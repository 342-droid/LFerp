/**
 * 模态框管理器 - 统一管理模态框的创建和操作
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
    }

    /**
     * 创建通用模态框HTML
     * @param {Object} config - 模态框配置
     */
    static createModalHTML(config) {
        const {
            id,
            title,
            width = '60%',
            fields = [],
            showFooter = true,
            footerButtons = ['save', 'cancel']
        } = config;

        const fieldsHTML = fields.map(field => ModalManager.createFieldHTML(field)).join('');
        
        const footerHTML = showFooter ? `
            <div class="modal-footer">
                ${footerButtons.includes('save') ? `<button type="button" class="btn btn-primary" id="${id}SaveBtn">保存</button>` : ''}
                ${footerButtons.includes('cancel') ? `<button type="button" class="btn btn-secondary" id="${id}CancelBtn">取消</button>` : ''}
                ${footerButtons.includes('close') ? `<button type="button" class="btn btn-secondary" id="${id}CloseBtn">关闭</button>` : ''}
            </div>
        ` : '';

        return `
            <div id="${id}" class="modal">
                <div class="modal-content" style="width: ${width};">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <span class="close" id="${id}CloseX">&times;</span>
                    </div>
                    <form class="modal-form">
                        ${fieldsHTML}
                    </form>
                    ${footerHTML}
                </div>
            </div>
        `;
    }

    /**
     * 创建表单字段HTML
     */
    static createFieldHTML(field) {
        const {
            type = 'text',
            id,
            label,
            required = false,
            disabled = false,
            placeholder = '请输入',
            options = [],
            width,
            labelWidth
        } = field;

        const requiredMark = required ? '<span style="color: red;">*</span>' : '';
        const styleAttr = width ? `style="width: ${width};"` : '';
        const labelStyle = labelWidth ? `style="width: ${labelWidth};"` : '';

        switch (type) {
            case 'text':
            case 'number':
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="input-wrapper">
                            <input type="${type}" id="${id}" placeholder="${placeholder}" ${disabled ? 'disabled' : ''}>
                            <span class="clear-btn">×</span>
                        </div>
                    </div>
                `;

            case 'select':
                return `
                    <div class="modal-form-group custom-select-wrapper" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="custom-select">
                            <input type="text" id="${id}" placeholder="请选择" ${disabled ? 'disabled' : ''}>
                            <span class="select-arrow">▼</span>
                            <span class="clear-btn">×</span>
                            <div class="select-dropdown" id="${id}Dropdown">
                                ${options.map(opt => `<div class="select-option" data-value="${opt.value}">${opt.text}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;

            case 'textarea':
                return `
                    <div class="modal-form-group" style="width: 100%;">
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <textarea id="${id}" placeholder="${placeholder}" rows="4" style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 3px; outline: none; resize: vertical;"></textarea>
                    </div>
                `;

            case 'radio':
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="radio-group">
                            ${options.map(opt => `
                                <div class="radio-option">
                                    <input type="radio" id="${id}${opt.value}" name="${id}" value="${opt.value}">
                                    <label for="${id}${opt.value}">${opt.text}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            case 'triple-input':
                return `
                    <div class="modal-form-group" ${styleAttr}>
                        <label ${labelStyle}>${label} ${requiredMark}</label>
                        <div class="row-column-layer-inputs">
                            ${field.inputs.map((input, i) => `
                                <div class="input-wrapper">
                                    <input type="number" id="${input.id}" placeholder="${input.placeholder}" min="0" ${input.step ? `step="${input.step}"` : ''}>
                                    <span class="clear-btn">×</span>
                                </div>
                                ${i < field.inputs.length - 1 ? '<span class="separator">-</span>' : ''}
                            `).join('')}
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * 创建删除确认模态框
     */
    static createDeleteConfirmModal(entityName, modalId = 'confirmDeleteModal') {
        return `
            <div id="${modalId}" class="modal">
                <div class="modal-content" style="width: 400px;">
                    <div class="modal-header">
                        <h2 class="modal-title">删除确认</h2>
                        <span class="close" id="${modalId}CloseBtn">&times;</span>
                    </div>
                    <div class="confirm-modal">
                        <div class="warning-icon">⚠️</div>
                        <p>确认删除${entityName}吗？</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="confirmDeleteBtn">确定</button>
                        <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">取消</button>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * 常用下拉选项
 */
const CommonOptions = {
    isEnabled: [
        { value: 'yes', text: '启用' },
        { value: 'no', text: '禁用' }
    ],
    yesNo: [
        { value: 'yes', text: '是' },
        { value: 'no', text: '否' }
    ],
    warehouseType: [
        { value: 'warehouse', text: '仓库' },
        { value: 'store', text: '门店' }
    ],
    temperatureLayer: [
        { value: 'normal', text: '常温' },
        { value: 'cold', text: '冷藏' },
        { value: 'frozen', text: '冷冻' }
    ],
    locationType: [
        { value: 'picking', text: '拣选位' },
        { value: 'storage', text: '存储位' },
        { value: 'temporary', text: '暂存位' },
        { value: 'receiving', text: '收货位' },
        { value: 'shipping', text: '发货位' },
        { value: 'crossdock', text: '越库位' },
        { value: 'distribution', text: '集散位' },
        { value: 'packing', text: '打包位' },
        { value: 'exception', text: '异常位' },
        { value: 'pending', text: '待处理位' },
        { value: 'return', text: '退货位' }
    ],
    locationCategory: [
        { value: 'floor', text: '地推' },
        { value: 'heavy', text: '重型货架' },
        { value: 'light', text: '轻型货架' }
    ],
    volumeValidationRule: [
        { value: 'volume', text: '按体积' },
        { value: 'specification', text: '按规格' },
        { value: 'none', text: '不校验' }
    ],
    // 仓库选项
    warehouse: [
        { value: 'W001-南京仓', text: 'W001-南京仓' },
        { value: 'W002-嘉兴仓', text: 'W002-嘉兴仓' },
        { value: 'W003-上海仓', text: 'W003-上海仓' },
        { value: 'W004-北京仓', text: 'W004-北京仓' },
        { value: 'W005-广州仓', text: 'W005-广州仓' },
        { value: 'W006-深圳仓', text: 'W006-深圳仓' }
    ],
    // 容器状态选项
    lpnStatus: [
        { value: 'idle', text: '空闲' },
        { value: 'occupied', text: '占用' }
    ],
    // 容器型号选项
    lpnModel: [
        { value: 'PT001-纸箱', text: 'PT001-标准纸箱' },
        { value: 'PT002-周转箱', text: 'PT002-塑料周转箱' }
    ],
    // 容器类型选项
    lpnType: [
        { value: 'carton', text: '纸箱' },
        { value: 'box', text: '周转箱' },
        { value: 'pallet', text: '托盘' },
        { value: 'cart', text: '笼车' }
    ],
    // 管理模式选项
    manageMode: [
        { value: 'once', text: '一次使用' },
        { value: 'cycle', text: '循环使用' }
    ],
    // 作业档案选项
    profile: [
        { value: 'P001-标准作业档案', text: 'P001-标准作业档案' },
        { value: 'P002-冷链作业档案', text: 'P002-冷链作业档案' },
        { value: 'P003-快消品作业档案', text: 'P003-快消品作业档案' }
    ],
    // 货主选项
    company: [
        { value: 'Y001-南京货主', text: 'Y001-南京货主' },
        { value: 'Y002-北京货主', text: 'Y002-北京货主' },
        { value: 'Y003-上海货主', text: 'Y003-上海货主' },
        { value: 'Y004-广州货主', text: 'Y004-广州货主' },
        { value: 'Y005-深圳货主', text: 'Y005-深圳货主' },
        { value: 'Y006-杭州货主', text: 'Y006-杭州货主' }
    ],
    // 来源触发选项
    sourceTrigger: [
        { value: 'receive_confirm', text: '收货确认' },
        { value: 'receive_cancel', text: '收货取消' },
        { value: 'pick_occupied', text: '库存占用' },
        { value: 'occupy_cancel', text: '取消占用' },
        { value: 'pick_finish', text: '拣货完成' },
        { value: 'sort_finish', text: '分拣完成' },
        { value: 'ship_finish', text: '发货完成' },
        { value: 'exception_accept', text: '异常受理' },
        { value: 'exception_recover', text: '异常恢复' },
        { value: 'exception_shortage', text: '异常缺货' },
        { value: 'in_warehouse_reshelf', text: '库内返架' }
    ],
    // 地点选项
    location: [
        { value: 'L001-南京地点', text: 'L001-南京地点' },
        { value: 'L002-北京地点', text: 'L002-北京地点' },
        { value: 'L003-上海地点', text: 'L003-上海地点' },
        { value: 'L004-广州地点', text: 'L004-广州地点' },
        { value: 'L005-深圳地点', text: 'L005-深圳地点' }
    ]
};

// 导出到全局
window.ModalManager = ModalManager;
window.CommonOptions = CommonOptions;
