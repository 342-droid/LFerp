/**
 * 页面管理器 - 抽象公共页面逻辑
 * 统一管理模态框、表单验证、表格操作等功能
 * 
 * 支持功能：
 * - 新增：保存后在表格中插入新行
 * - 编辑：保存后更新对应行数据
 * - 删除：确认后从表格中移除行
 */

class PageManager {
    constructor(config) {
        const merged = {
            entityName: '',
            entityCode: '',
            statusColumnIndex: 4,
            checkboxColumn: true,
            actionColumnMode: 'editDelete',
            statusCellsIndex: null,
            onDisableToggle: null,
            disableToggleVerb: 'stopNormal',
            customRowActions: [],
            tableBodyId: 'tableBody',
            paginationContainerId: 'pagination-container',
            pageSize: 10,
            ...config
        };
        merged.checkboxColumn = merged.checkboxColumn !== false;
        merged.actionColumnMode = merged.actionColumnMode || 'editDelete';
        if (!Array.isArray(merged.customRowActions)) {
            merged.customRowActions = [];
        }
        if (typeof merged.onDisableToggle !== 'function') {
            merged.onDisableToggle = null;
        }
        this.config = merged;

        this.modals = {};
        this.currentEditRow = null;
        this.deleteTargetRow = null;
        this.isDetailMode = false;
    }

    /**
     * 状态列视为「在用」时的取值（决定 .active / .inactive 与能否删除）
     */
    statusValueLooksActive(value) {
        const v = String(value ?? '').trim();
        return (
            v === '启用' ||
            v === '正常' ||
            v === '在岗' ||
            v === '开启' ||
            v === '营业中' ||
            v === '审核成功' ||
            v === '已结算' ||
            v === '已签署'
        );
    }

    /**
     * 「禁用/启用」或「停用/启用」切换链文案
     */
    disableToggleLinkLabel(statusVal) {
        const st = String(statusVal ?? '').trim();
        const verb = this.config.disableToggleVerb || 'stopNormal';
        if (verb === 'enableStop') {
            return st === '停用' ? '启用' : '停用';
        }
        return st === '停用' ? '启用' : '禁用';
    }

    /**
     * 生成当前时间字符串
     */
    getCurrentTimeStr() {
        const now = new Date();
        return now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
    }
    
    /**
     * 刷新分页
     */
    refreshPagination() {
        if (typeof createTablePagination === 'function') {
            createTablePagination({
                tableBodyId: this.config.tableBodyId,
                paginationContainerId: this.config.paginationContainerId,
                pageSize: this.config.pageSize,
                pageButtonRange: 3
            });
        }
    }

    /**
     * @param {Array} cells — addTableRow 的 cells（不含操作列）
     */
    buildActionCellHtml(cells) {
        const mode = this.config.actionColumnMode;
        const pickStatusFromCells = () => {
            const si =
                this.config.statusCellsIndex != null
                    ? this.config.statusCellsIndex
                    : Math.max(0, cells.length - 1);
            const cell = cells[si];
            return typeof cell === 'object' && cell && cell.isStatus
                ? cell.value
                : String(cell ?? '');
        };

        if (mode === 'disableToggle') {
            const label = this.disableToggleLinkLabel(pickStatusFromCells());
            return `<td class="action-links"><a href="#" class="mdm-disable-toggle">${label}</a></td>`;
        }

        if (mode === 'disableTogglePlusEdit') {
            const label = this.disableToggleLinkLabel(pickStatusFromCells());
            return `<td class="action-links"><a href="#" class="mdm-disable-toggle">${label}</a> <a href="#" class="edit-btn">编辑</a></td>`;
        }

        if (mode === 'disableTogglePlusOnboard') {
            const label = this.disableToggleLinkLabel(pickStatusFromCells());
            return `<td class="action-links"><a href="#" class="mdm-disable-toggle">${label}</a> <a href="#" class="mdm-onboard-btn">去进件</a></td>`;
        }

        if (mode === 'editOnboard') {
            return `<td class="action-links"><a href="#" class="edit-btn">编辑</a> <a href="#" class="mdm-onboard-btn">去进件</a></td>`;
        }

        if (mode === 'editOnly') {
            return `<td class="action-links"><a href="#" class="edit-btn">编辑</a></td>`;
        }

        if (mode === 'editDetail') {
            return `<td class="action-links"><a href="#" class="mdm-peop-detail">查看详情</a> <a href="#" class="edit-btn">编辑</a></td>`;
        }

        if (mode === 'editDetailBindWarehouse') {
            return `<td class="action-links"><a href="#" class="mdm-peop-detail">查看详情</a> <a href="#" class="edit-btn">编辑</a> <a href="#" class="mdm-bd-bind-warehouse">绑定仓库</a></td>`;
        }

        return `<td class="action-links">
            <a href="#" class="edit-btn">编辑</a>
            <a href="#" class="delete-btn">删除</a>
        </td>`;
    }

    refreshDisableToggleLabel(row) {
        if (!row || !row.querySelector) return;
        const a = row.querySelector('.mdm-disable-toggle');
        if (!a) return;
        const st = this.getCellStatus(row, this.config.statusColumnIndex);
        a.textContent = this.disableToggleLinkLabel(st);
    }

    /**
     * 新增行到表格
     * @param {Object} rowData - 行数据配置
     * @param {Array} rowData.cells - 单元格数据数组，每项可以是字符串或 {value, isStatus, statusClass}
     */
    addTableRow(rowData) {
        const tableBody = document.getElementById(this.config.tableBodyId);
        if (!tableBody) return;
        
        const newRow = document.createElement('tr');
        let html = '';
        if (this.config.checkboxColumn !== false) {
            html +=
                '<td><input type="checkbox" class="table-checkbox checkbox-row"></td>';
        }

        rowData.cells.forEach((cell) => {
            if (typeof cell === 'object' && cell.isStatus) {
                const statusClass =
                    cell.statusClass ||
                    (this.statusValueLooksActive(cell.value) ? 'active' : 'inactive');
                html += `<td><span class="status ${statusClass}">${cell.value}</span></td>`;
            } else {
                html += `<td>${cell}</td>`;
            }
        });

        html += this.buildActionCellHtml(rowData.cells);
        
        newRow.innerHTML = html;
        tableBody.insertBefore(newRow, tableBody.firstChild);

        if (this.config.detailView?.enabled) {
            this.decorateDetailLinkCell(newRow);
        }
        
        this.refreshPagination();
        return newRow;
    }
    
    /**
     * 更新表格行
     * @param {HTMLElement} row - 要更新的行
     * @param {Object} updates - 更新数据 {columnIndex: value} 或 {columnIndex: {value, isStatus}}
     */
    updateTableRow(row, updates) {
        if (!row) return;
        
        const cells = row.querySelectorAll('td');
        Object.entries(updates).forEach(([index, data]) => {
            const cell = cells[parseInt(index)];
            if (!cell) return;
            
            if (typeof data === 'object' && data.isStatus) {
                const statusSpan = cell.querySelector('.status');
                if (statusSpan) {
                    statusSpan.textContent = data.value;
                    statusSpan.className =
                        'status ' + (this.statusValueLooksActive(data.value) ? 'active' : 'inactive');
                }
            } else {
                cell.textContent = data;
            }
        });

        if (this.config.detailView?.enabled) {
            this.decorateDetailLinkCell(row);
        }
        if (
            this.config.actionColumnMode === 'disableToggle' ||
            this.config.actionColumnMode === 'disableTogglePlusEdit' ||
            this.config.actionColumnMode === 'disableTogglePlusOnboard'
        ) {
            this.refreshDisableToggleLabel(row);
        }
    }
    
    /**
     * 删除表格行
     * @param {HTMLElement} row - 要删除的行
     */
    deleteTableRow(row) {
        if (!row) return;
        row.remove();
        this.refreshPagination();
    }

    /**
     * 初始化页面
     */
    init() {
        this.initPagination();
        this.initModals();
        this.initCustomSelects();
        this.initTableEvents();
        this.initDetailView();
        this.initTableCheckbox();
        this.initEscapeKey();
    }

    /**
     * 初始化首列详情点击能力
     */
    initDetailView() {
        if (!this.config.detailView?.enabled) return;
        const tableBody = document.getElementById(this.config.tableBodyId);
        if (!tableBody) return;
        this.decorateAllDetailLinkCells();
    }

    /**
     * 初始化分页
     */
    initPagination() {
        if (typeof createTablePagination === 'function') {
            createTablePagination({
                tableBodyId: this.config.tableBodyId,
                paginationContainerId: this.config.paginationContainerId,
                pageSize: this.config.pageSize,
                pageButtonRange: 3
            });
        }
    }

    /**
     * 批量初始化下拉框
     * @param {Array} selects - 下拉框配置数组 [{inputId, dropdownId}]
     */
    initCustomSelects(selects = this.config.customSelects || []) {
        selects.forEach(({ inputId, dropdownId }) => {
            if (typeof initCustomSelect === 'function') {
                initCustomSelect(inputId, dropdownId);
            }
        });
    }

    /**
     * 注册模态框
     * @param {string} name - 模态框名称
     * @param {Object} modalConfig - 模态框配置
     */
    registerModal(name, modalConfig) {
        const modal = document.getElementById(modalConfig.modalId);
        if (!modal) return;

        this.modals[name] = {
            element: modal,
            config: modalConfig,
            closeBtn: modal.querySelector('.close'),
            cancelBtn: document.getElementById(modalConfig.cancelBtnId),
            saveBtn: document.getElementById(modalConfig.saveBtnId)
        };

        this.bindModalEvents(name);
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents(name) {
        const modalData = this.modals[name];
        if (!modalData) return;

        const { element, closeBtn, cancelBtn, saveBtn, config } = modalData;

        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(name));
        }

        // 取消按钮
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal(name));
        }

        // 点击遮罩关闭
        element.addEventListener('click', (e) => {
            if (e.target === element) this.closeModal(name);
        });

        // 保存按钮
        if (saveBtn && config.onSave) {
            saveBtn.addEventListener('click', () => {
                if (this.validateForm(config.validations)) {
                    const keepOpen = config.onSave() === false;
                    if (!keepOpen) {
                        this.closeModal(name);
                    }
                }
            });
        }
    }

    /**
     * 打开模态框
     */
    openModal(name, options = {}) {
        const modalData = this.modals[name];
        if (!modalData) return;

        // 重置表单
        if (options.reset !== false) {
            this.resetModalForm(modalData.element);
        }

        // 设置默认值
        if (options.defaults) {
            Object.entries(options.defaults).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });
        }

        // 填充编辑数据
        if (options.data) {
            Object.entries(options.data).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });
        }

        // 调用onOpen回调
        if (modalData.config.onOpen) {
            modalData.config.onOpen();
        }

        modalData.element.style.display = 'block';
    }

    /**
     * 关闭模态框
     */
    closeModal(name) {
        const modalData = this.modals[name];
        if (modalData) {
            modalData.element.style.display = 'none';
        }
    }

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
        Object.keys(this.modals).forEach(name => this.closeModal(name));
    }

    /**
     * 重置模态框表单
     */
    resetModalForm(modal) {
        modal.querySelectorAll('input[type="text"]').forEach(input => {
            if (!input.disabled) input.value = '';
        });
        modal.querySelectorAll('input[type="number"]').forEach(input => {
            if (!input.disabled) input.value = '';
        });
        modal.querySelectorAll('textarea').forEach(textarea => {
            if (!textarea.disabled) textarea.value = '';
        });
    }

    /**
     * 表单验证
     * @param {Array} validations - 验证规则数组
     */
    validateForm(validations = []) {
        for (const rule of validations) {
            const el = document.getElementById(rule.id);
            if (!el) continue;

            const value = el.value.trim();
            
            if (rule.required && (!value || value === '请选择')) {
                showToast(rule.message);
                el.focus();
                return false;
            }

            if (rule.pattern && !rule.pattern.test(value)) {
                showToast(rule.message);
                el.focus();
                return false;
            }
        }
        return true;
    }

    /**
     * 根据 fields 配置自动生成新增/编辑模态框HTML
     */
    autoGenerateModals() {
        const fields = this.config.fields;
        const entityName = this.config.entityName;
        const modalWidth = this.config.modalWidth || '60%';
        const labelWidth = this.config.labelWidth;
        
        // 生成新增模态框
        if (this.config.addModal && this.config.addModal.modalId) {
            const addModalId = this.config.addModal.modalId;
            if (!document.getElementById(addModalId)) {
                const addTitle =
                    this.config.addModalTitle ||
                    this.config.addModal?.title ||
                    `${entityName}-新增`;
                const addFieldsHtml = fields
                    .filter((field) => !field.hiddenInAdd)
                    .map((field) => this.generateFieldHTML(field, false, labelWidth))
                    .join('');
                const addModalHtml = `
                    <div id="${addModalId}" class="modal">
                        <div class="modal-content" style="width: ${modalWidth};">
                            <div class="modal-header">
                                <h2 class="modal-title">${addTitle}</h2>
                                <span class="close">&times;</span>
                            </div>
                            <form class="modal-form">
                                ${addFieldsHtml}
                            </form>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="${this.config.addModal.cancelBtnId || 'cancelBtn'}">取消</button>
                                <button type="button" class="btn btn-primary" id="${this.config.addModal.saveBtnId || 'saveBtn'}">保存</button>
                            </div>
                        </div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', addModalHtml);
            }
        }
        
        // 生成编辑模态框
        if (this.config.editModal && this.config.editModal.modalId) {
            const editModalId = this.config.editModal.modalId;
            if (!document.getElementById(editModalId)) {
                const editFieldsHtml = fields.map(field => 
                    this.generateFieldHTML(field, true, labelWidth)
                ).join('');
                const editModalHtml = `
                    <div id="${editModalId}" class="modal">
                        <div class="modal-content" style="width: ${modalWidth};">
                            <div class="modal-header">
                                <h2 class="modal-title">${entityName}-编辑</h2>
                                <span class="close">&times;</span>
                            </div>
                            <form class="modal-form">
                                ${editFieldsHtml}
                            </form>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="${this.config.editModal.cancelBtnId || 'editCancelBtn'}">取消</button>
                                <button type="button" class="btn btn-primary" id="${this.config.editModal.saveBtnId || 'editSaveBtn'}">保存</button>
                            </div>
                        </div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', editModalHtml);
            }
        }
        
        // 自动注册自动生成的下拉框到 customSelects
        if (!this.config.customSelects) {
            this.config.customSelects = [];
        }
        const existingSelectIds = new Set(this.config.customSelects.map(s => s.inputId));
        fields.forEach(field => {
            if (field.type === 'select' && field.options) {
                // 新增模态框的下拉框（未出现在新增 DOM 中的字段不注册）
                if (field.id && !field.hiddenInAdd && !existingSelectIds.has(field.id)) {
                    this.config.customSelects.push({ inputId: field.id, dropdownId: field.id + 'Dropdown' });
                    existingSelectIds.add(field.id);
                }
                // 编辑模态框的下拉框
                if (field.id) {
                    const editId = 'edit' + field.id.charAt(0).toUpperCase() + field.id.slice(1);
                    if (!existingSelectIds.has(editId)) {
                        this.config.customSelects.push({ inputId: editId, dropdownId: editId + 'Dropdown' });
                        existingSelectIds.add(editId);
                    }
                }
            }
        });
    }
    
    /**
     * 生成单个表单字段的HTML
     * @param {Object} field - 字段配置
     * @param {boolean} isEdit - 是否为编辑模式
     * @param {string} globalLabelWidth - 全局label宽度
     */
    generateFieldHTML(field, isEdit = false, globalLabelWidth) {
        const {
            type = 'text',
            id,
            label,
            required = false,
            editDisabled = false,
            disabled = false,
            placeholder,
            options = [],
            width,
            labelWidth,
            inputs // for triple-input type
        } = field;
        
        // 编辑模式下的id前缀
        const fieldId = id ? (isEdit ? ('edit' + id.charAt(0).toUpperCase() + id.slice(1)) : id) : '';
        const isDisabled = disabled || (isEdit && editDisabled);
        const requiredMark = required ? '<span style="color: red;">*</span>' : '';
        const disabledAttr = isDisabled ? 'disabled' : '';
        const effectiveLabelWidth = labelWidth || globalLabelWidth;
        const labelStyle = effectiveLabelWidth ? `style="width: ${effectiveLabelWidth};"` : '';
        const styleAttr = width ? `style="width: ${width};"` : '';
        const fieldPlaceholder = placeholder || (type === 'select' ? '请选择' : '请输入');
        
        switch (type) {
            case 'text':
            case 'number': {
                const extraAttrs = type === 'number' ? `min="0" ${field.step ? `step="${field.step}"` : ''}` : '';
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="input-wrapper">
                            <input type="${type}" id="${fieldId}" placeholder="${fieldPlaceholder}" ${disabledAttr} ${extraAttrs}>
                            <span class="clear-btn">×</span>
                        </div>
                    </div>`;
            }
            case 'select': {
                const dropdownId = fieldId + 'Dropdown';
                const optionsHtml = options.map(opt => 
                    `<div class="select-option" data-value="${opt.value}">${opt.text}</div>`
                ).join('');
                return `
                    <div class="modal-form-group custom-select-wrapper" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="custom-select">
                            <input type="text" id="${fieldId}" placeholder="${fieldPlaceholder}" ${disabledAttr}>
                            <span class="select-arrow">▼</span>
                            ${!isDisabled ? '<span class="clear-btn">×</span>' : ''}
                            <div class="select-dropdown" id="${dropdownId}">
                                ${optionsHtml}
                            </div>
                        </div>
                    </div>`;
            }
            case 'textarea': {
                const textareaLabelWidth = effectiveLabelWidth || '80px';
                return `
                    <div class="modal-form-group" style="width: 100%;">
                        <label style="width: ${textareaLabelWidth};">${label} ${requiredMark}</label>
                        <textarea id="${fieldId}" placeholder="${fieldPlaceholder}" rows="${field.rows || 4}" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 3px; outline: none; resize: vertical;" ${disabledAttr}></textarea>
                    </div>`;
            }
            case 'radio': {
                const radioName = id ? (isEdit ? ('edit' + id.charAt(0).toUpperCase() + id.slice(1)) : id) : '';
                const radioOptionsHtml = options.map(opt => `
                    <div class="radio-option">
                        <input type="radio" id="${fieldId}${opt.value}" name="${radioName}" value="${opt.value}">
                        <label for="${fieldId}${opt.value}">${opt.text}</label>
                    </div>
                `).join('');
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="radio-group">
                            ${radioOptionsHtml}
                        </div>
                    </div>`;
            }
            case 'triple-input': {
                const tripleInputs = (inputs || []).map((input, i) => {
                    const inputId = isEdit ? ('edit' + input.id.charAt(0).toUpperCase() + input.id.slice(1)) : input.id;
                    return `
                        <div class="input-wrapper">
                            <input type="number" id="${inputId}" placeholder="${input.placeholder || ''}" min="0" ${input.step ? `step="${input.step}"` : ''}>
                            <span class="clear-btn">×</span>
                        </div>
                        ${i < (inputs.length - 1) ? '<span class="separator">-</span>' : ''}`;
                }).join('');
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="row-column-layer-inputs">
                            ${tripleInputs}
                        </div>
                    </div>`;
            }
            case 'raw':
                return isEdit ? (field.editHtml || field.html || field.content || '') : (field.html || field.content || '');

            default:
                return '';
        }
    }

    /**
     * 初始化模态框（简化配置）
     */
    initModals() {
        // 如果配置了 fields，自动生成新增/编辑模态框HTML
        if (this.config.fields && this.config.fields.length > 0) {
            this.autoGenerateModals();
        }

        // 新增模态框
        if (this.config.addModal) {
            const addConfig = this.config.addModal;
            this.registerModal('add', addConfig);
            
            const addBtn = document.getElementById(addConfig.triggerBtnId || 'addBtn');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    this.openModal('add', {
                        defaults: addConfig.defaults || { isEnabled: '启用' }
                    });
                });
            }
        }

        // 编辑模态框
        if (this.config.editModal) {
            this.registerModal('edit', this.config.editModal);
        }

        // 删除确认模态框
        if (this.config.deleteModal) {
            const deleteConfig = this.config.deleteModal;
            const modalId = deleteConfig.modalId || 'confirmDeleteModal';
            
            // 如果DOM中不存在该模态框，则自动创建
            if (!document.getElementById(modalId)) {
                const closeBtnId = deleteConfig.closeBtnId || 'confirmDeleteCloseBtn';
                const confirmBtnId = deleteConfig.confirmBtnId || 'confirmDeleteBtn';
                const cancelBtnId = deleteConfig.cancelBtnId || 'cancelDeleteBtn';
                const deleteModalHtml = `
                    <div id="${modalId}" class="modal">
                        <div class="modal-content" style="width: 400px;">
                            <div class="modal-header">
                                <h2 class="modal-title">删除确认</h2>
                                <span class="close" id="${closeBtnId}">&times;</span>
                            </div>
                            <div class="confirm-modal">
                                <div class="warning-icon">⚠️</div>
                                <p>确认删除${this.config.entityName}吗？</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" id="${confirmBtnId}">确定</button>
                                <button type="button" class="btn btn-secondary" id="${cancelBtnId}">取消</button>
                            </div>
                        </div>
                    </div>`;
                document.body.insertAdjacentHTML('beforeend', deleteModalHtml);
            }
            
            const modal = document.getElementById(modalId);
            
            if (modal) {
                this.modals['delete'] = {
                    element: modal,
                    config: deleteConfig
                };
                
                // 关闭按钮
                const closeBtn = document.getElementById(deleteConfig.closeBtnId || 'confirmDeleteCloseBtn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.closeDeleteModal());
                }
                
                // 取消按钮
                const cancelBtn = document.getElementById(deleteConfig.cancelBtnId || 'cancelDeleteBtn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => this.closeDeleteModal());
                }
                
                // 点击遮罩关闭
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.closeDeleteModal();
                });
                
                // 确认删除按钮
                const confirmBtn = document.getElementById(deleteConfig.confirmBtnId || 'confirmDeleteBtn');
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        if (this.deleteTargetRow) {
                            this.deleteTableRow(this.deleteTargetRow);
                            showToast(`${this.config.entityName}已删除`, 'success');
                            this.closeDeleteModal();
                        }
                    });
                }
            }
        }
    }
    
    /**
     * 关闭删除模态框
     */
    closeDeleteModal() {
        const modalData = this.modals['delete'];
        if (modalData) {
            modalData.element.style.display = 'none';
        }
        this.deleteTargetRow = null;
    }

    /**
     * 初始化表格事件委托
     */
    initTableEvents() {
        const tableBody = document.getElementById(this.config.tableBodyId);
        if (!tableBody) return;

        tableBody.addEventListener('click', (e) => {
            // 首列详情链接
            if (this.config.detailView?.enabled) {
                const detailLinkClass = this.config.detailView.linkClass || 'table-detail-link';
                const detailLink = e.target.closest(`.${detailLinkClass}`);
                if (detailLink) {
                    e.preventDefault();
                    e.stopPropagation();
                    const row = detailLink.closest('tr');
                    this.handleDetail(row);
                    return;
                }
            }

            const customs = this.config.customRowActions;
            if (Array.isArray(customs) && customs.length) {
                for (let i = 0; i < customs.length; i++) {
                    const spec = customs[i];
                    if (!spec || !spec.selector) continue;
                    const hit = e.target.closest(spec.selector);
                    if (hit && tableBody.contains(hit)) {
                        e.preventDefault();
                        spec.handler(e, hit, this);
                        return;
                    }
                }
            }

            const mdmTog = e.target.closest('.mdm-disable-toggle');
            if (
                mdmTog &&
                (this.config.actionColumnMode === 'disableToggle' ||
                    this.config.actionColumnMode === 'disableTogglePlusEdit' ||
                    this.config.actionColumnMode === 'disableTogglePlusOnboard')
            ) {
                e.preventDefault();
                const row = mdmTog.closest('tr');
                const status = this.getCellStatus(row, this.config.statusColumnIndex);
                if (typeof this.config.onDisableToggle === 'function') {
                    this.config.onDisableToggle(row, status, this, mdmTog);
                }
                return;
            }

            // 编辑按钮
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                e.preventDefault();
                if (this.config.editModal?.comingSoon) {
                    const msg = this.config.editModal.comingSoonMessage || '编辑功能开发中';
                    showToast(msg, 'info');
                    return;
                }
                this.isDetailMode = false;
                this.updateEditModalMode(false);
                try {
                    this.handleEdit(editBtn);
                } catch (error) {
                    console.error('Error handling edit:', error);
                    showToast('编辑操作失败，请重试');
                }
                return;
            }

            // 删除按钮
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.preventDefault();
                try {
                    this.handleDelete(deleteBtn);
                } catch (error) {
                    console.error('Error handling delete:', error);
                    showToast('删除操作失败，请重试');
                }
                return;
            }

            // 查看按钮
            const viewBtn = e.target.closest('.view-btn');
            if (viewBtn) {
                e.preventDefault();
                if (this.config.onView) {
                    try {
                        this.config.onView(viewBtn);
                    } catch (error) {
                        console.error('Error handling view:', error);
                        showToast('查看操作失败，请重试');
                    }
                }
                return;
            }
        });
    }

    /**
     * 将行首列渲染为详情链接
     */
    decorateDetailLinkCell(row) {
        if (!row || !this.config.detailView?.enabled) return;
        const columnIndex = this.config.detailView.columnIndex ?? 1;
        const linkClass = this.config.detailView.linkClass || 'table-detail-link';
        const cell = row.querySelectorAll('td')[columnIndex];
        if (!cell) return;
        if (cell.querySelector(`.${linkClass}`)) return;
        const value = cell.textContent.trim();
        cell.innerHTML = `<a href="#" class="${linkClass}">${value}</a>`;
    }

    /**
     * 批量处理表格详情链接
     */
    decorateAllDetailLinkCells() {
        const tableBody = document.getElementById(this.config.tableBodyId);
        if (!tableBody) return;
        tableBody.querySelectorAll('tr').forEach((row) => this.decorateDetailLinkCell(row));
    }

    /**
     * 编辑弹窗只读切换
     */
    setEditModalReadOnly(readOnly) {
        const editModalId = this.config.editModal?.modalId;
        if (!editModalId) return;
        const editModal = document.getElementById(editModalId);
        if (!editModal) return;
        editModal.querySelectorAll('input, textarea, select').forEach((el) => {
            if (readOnly) {
                if (!Object.prototype.hasOwnProperty.call(el.dataset, 'pmOriginalDisabled')) {
                    el.dataset.pmOriginalDisabled = el.disabled ? '1' : '0';
                }
                el.disabled = true;
            } else if (Object.prototype.hasOwnProperty.call(el.dataset, 'pmOriginalDisabled')) {
                el.disabled = el.dataset.pmOriginalDisabled === '1';
            }
        });
    }

    /**
     * 更新编辑弹窗为详情/编辑模式
     */
    updateEditModalMode(isDetailMode) {
        if (!this.config.editModal) return;
        const editModalId = this.config.editModal.modalId;
        const editModal = document.getElementById(editModalId);
        if (!editModal) return;

        const titleEl = editModal.querySelector('.modal-title');
        const saveBtn = document.getElementById(this.config.editModal.saveBtnId || 'editSaveBtn');
        const cancelBtn = document.getElementById(this.config.editModal.cancelBtnId || 'editCancelBtn');
        const entityName = this.config.entityName || '信息';

        if (titleEl) {
            const detailTitle =
                this.config.detailModalTitle != null
                    ? this.config.detailModalTitle
                    : `${entityName}-详情`;
            const editTitle =
                this.config.editModalTitle != null
                    ? this.config.editModalTitle
                    : `${entityName}-编辑`;
            titleEl.textContent = isDetailMode ? detailTitle : editTitle;
        }
        if (saveBtn) {
            saveBtn.style.display = isDetailMode ? 'none' : '';
        }
        if (cancelBtn) {
            cancelBtn.textContent = isDetailMode ? '关闭' : '取消';
        }

        this.setEditModalReadOnly(isDetailMode);

        if (typeof this.config.editModal?.onDetailModeChange === 'function') {
            try {
                this.config.editModal.onDetailModeChange(isDetailMode, this);
            } catch (e) {
                console.error('editModal.onDetailModeChange', e);
            }
        }
    }

    /**
     * 处理首列详情点击
     */
    handleDetail(row) {
        if (!row) return;
        this.currentEditRow = row;
        this.isDetailMode = true;

        // 页面可覆盖默认详情行为
        if (typeof this.config.detailView?.onOpenDetail === 'function') {
            this.config.detailView.onOpenDetail(row, this);
            return;
        }

        if (this.config.editModal?.mapRowToForm) {
            this.updateEditModalMode(true);
            const data = this.config.editModal.mapRowToForm(row);
            this.openModal('edit', { data, reset: false });
        }
    }

    /**
     * 处理编辑
     */
    handleEdit(element) {
        const row = element.closest('tr');
        this.currentEditRow = row;

        if (this.config.editModal && this.config.editModal.mapRowToForm) {
            this.isDetailMode = false;
            this.updateEditModalMode(false);
            const data = this.config.editModal.mapRowToForm(row);
            this.openModal('edit', { data, reset: false });
        }
    }

    /**
     * 处理删除
     */
    handleDelete(element) {
        const row = element.closest('tr');
        const statusIndex = this.config.statusColumnIndex;
        const statusSpan = row.querySelectorAll('td')[statusIndex]?.querySelector('.status');

        // 检查是否为启用状态
        if (statusSpan && statusSpan.classList.contains('active')) {
            showToast(`当前${this.config.entityName}为启用状态，不允许删除`);
            return;
        }

        this.deleteTargetRow = row;
        const modalData = this.modals['delete'];
        if (modalData) {
            modalData.element.style.display = 'block';
        }
    }

    /**
     * 初始化表格勾选框
     */
    initTableCheckbox() {
        if (this.config.checkboxColumn === false) {
            return;
        }
        if (typeof initTableCheckbox === 'function') {
            initTableCheckbox(this.config.tableBodyId);
        }
    }

    /**
     * ESC键关闭弹窗
     */
    initEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * 从表格行获取单元格数据
     * @param {HTMLElement} row - 表格行
     * @param {number} index - 列索引（从1开始，0是复选框）
     */
    getCellValue(row, index) {
        const cell = row.querySelectorAll('td')[index];
        return cell ? cell.textContent.trim() : '';
    }

    /**
     * 从表格行获取状态值
     */
    getCellStatus(row, index) {
        const cell = row.querySelectorAll('td')[index];
        const statusSpan = cell?.querySelector('.status');
        return statusSpan ? statusSpan.textContent.trim() : '';
    }
}

/**
 * 创建验证规则的辅助函数
 */
function createValidation(id, message, required = true, pattern = null) {
    return { id, message, required, pattern };
}

/**
 * 常用验证规则
 */
const CommonValidations = {
    required: (id, fieldName) => createValidation(id, `请输入${fieldName}`),
    select: (id, fieldName) => createValidation(id, `请选择${fieldName}`),
    phone: (id) => createValidation(id, '请输入正确的手机号', false, /^1[3-9]\d{9}$/),
    email: (id) => createValidation(id, '请输入正确的邮箱', false, /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/)
};

// 导出到全局
window.PageManager = PageManager;
window.createValidation = createValidation;
window.CommonValidations = CommonValidations;
