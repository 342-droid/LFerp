/**
 * 表单工具函数 - 统一处理表单相关操作
 */

const FormUtils = {
    /**
     * 获取表单数据
     * @param {string|HTMLElement} formOrSelector - 表单元素或选择器
     * @returns {Object} 表单数据对象
     */
    getFormData(formOrSelector) {
        const form = typeof formOrSelector === 'string' 
            ? document.querySelector(formOrSelector) 
            : formOrSelector;
        
        if (!form) return {};

        const data = {};
        
        // 文本输入框
        form.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            if (input.id) {
                data[input.id] = input.value.trim();
            }
        });

        // 下拉框（自定义）
        form.querySelectorAll('.custom-select input').forEach(input => {
            if (input.id) {
                data[input.id] = input.value.trim();
                data[input.id + '_value'] = input.dataset.value || '';
            }
        });

        // 原生select
        form.querySelectorAll('select').forEach(select => {
            if (select.id) {
                data[select.id] = select.value;
            }
        });

        // 文本域
        form.querySelectorAll('textarea').forEach(textarea => {
            if (textarea.id) {
                data[textarea.id] = textarea.value.trim();
            }
        });

        // 单选框
        form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            data[radio.name] = radio.value;
        });

        // 复选框
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.name) {
                if (!data[checkbox.name]) data[checkbox.name] = [];
                if (checkbox.checked) {
                    data[checkbox.name].push(checkbox.value);
                }
            }
        });

        return data;
    },

    /**
     * 设置表单数据
     * @param {string|HTMLElement} formOrSelector - 表单元素或选择器
     * @param {Object} data - 要设置的数据
     */
    setFormData(formOrSelector, data) {
        const form = typeof formOrSelector === 'string'
            ? document.querySelector(formOrSelector)
            : formOrSelector;

        if (!form || !data) return;

        Object.entries(data).forEach(([key, value]) => {
            const el = form.querySelector(`#${key}`) || form.querySelector(`[name="${key}"]`);
            if (!el) return;

            if (el.type === 'radio') {
                const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
            } else if (el.type === 'checkbox') {
                el.checked = Array.isArray(value) ? value.includes(el.value) : !!value;
            } else {
                el.value = value;
            }
        });
    },

    /**
     * 重置表单
     * @param {string|HTMLElement} formOrSelector - 表单元素或选择器
     * @param {Object} options - 选项
     */
    resetForm(formOrSelector, options = {}) {
        const form = typeof formOrSelector === 'string'
            ? document.querySelector(formOrSelector)
            : formOrSelector;

        if (!form) return;

        const { preserveDisabled = true, defaults = {} } = options;

        // 重置文本输入
        form.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            if (preserveDisabled && input.disabled) return;
            input.value = defaults[input.id] || '';
        });

        // 重置文本域
        form.querySelectorAll('textarea').forEach(textarea => {
            if (preserveDisabled && textarea.disabled) return;
            textarea.value = defaults[textarea.id] || '';
        });

        // 重置下拉框
        form.querySelectorAll('.custom-select input').forEach(input => {
            if (preserveDisabled && input.disabled) return;
            input.value = defaults[input.id] || '';
            input.dataset.value = '';
        });

        // 重置原生select
        form.querySelectorAll('select').forEach(select => {
            if (preserveDisabled && select.disabled) return;
            select.selectedIndex = 0;
        });

        // 重置单选框
        form.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = defaults[radio.name] === radio.value;
        });
    },

    /**
     * 验证表单
     * @param {Array} rules - 验证规则数组
     * @returns {boolean} 是否验证通过
     */
    validate(rules) {
        for (const rule of rules) {
            const el = document.getElementById(rule.id);
            if (!el) continue;

            const value = el.value.trim();

            // 必填验证
            if (rule.required && (!value || value === '请选择')) {
                showToast(rule.message || `请填写${rule.label || rule.id}`);
                el.focus();
                return false;
            }

            // 正则验证
            if (rule.pattern && value && !rule.pattern.test(value)) {
                showToast(rule.patternMessage || rule.message || '格式不正确');
                el.focus();
                return false;
            }

            // 最小长度
            if (rule.minLength && value.length < rule.minLength) {
                showToast(rule.minLengthMessage || `最少输入${rule.minLength}个字符`);
                el.focus();
                return false;
            }

            // 最大长度
            if (rule.maxLength && value.length > rule.maxLength) {
                showToast(rule.maxLengthMessage || `最多输入${rule.maxLength}个字符`);
                el.focus();
                return false;
            }

            // 自定义验证函数
            if (rule.validator && !rule.validator(value)) {
                showToast(rule.message || '验证失败');
                el.focus();
                return false;
            }
        }

        return true;
    },

    /**
     * 创建验证规则
     */
    createRule(id, label, options = {}) {
        return {
            id,
            label,
            required: options.required !== false,
            message: options.message || `请输入${label}`,
            pattern: options.pattern,
            patternMessage: options.patternMessage,
            minLength: options.minLength,
            maxLength: options.maxLength,
            validator: options.validator
        };
    },

    /**
     * 批量创建必填验证规则
     * @param {Array} fields - [{id, label}]
     */
    createRequiredRules(fields) {
        return fields.map(field => ({
            id: field.id,
            label: field.label,
            required: true,
            message: field.type === 'select' ? `请选择${field.label}` : `请输入${field.label}`
        }));
    }
};

/**
 * 表格行数据提取工具
 */
const TableRowUtils = {
    /**
     * 从表格行提取数据
     * @param {HTMLElement} row - 表格行
     * @param {Array} columns - 列配置 [{index, key, type}]
     */
    extractRowData(row, columns) {
        const cells = row.querySelectorAll('td');
        const data = {};

        columns.forEach(col => {
            const cell = cells[col.index];
            if (!cell) return;

            switch (col.type) {
                case 'status':
                    const statusSpan = cell.querySelector('.status');
                    data[col.key] = statusSpan ? statusSpan.textContent.trim() : '';
                    break;
                case 'code-name':
                    // 格式如 "W001-南京仓"，提取编码
                    const text = cell.textContent.trim();
                    data[col.key] = text;
                    data[col.key + 'Code'] = text.split('-')[0];
                    break;
                default:
                    data[col.key] = cell.textContent.trim();
            }
        });

        return data;
    },

    /**
     * 检查行状态是否为启用
     * @param {HTMLElement} row - 表格行
     * @param {number} statusIndex - 状态列索引
     */
    isRowEnabled(row, statusIndex) {
        const cell = row.querySelectorAll('td')[statusIndex];
        const statusSpan = cell?.querySelector('.status');
        return statusSpan && statusSpan.classList.contains('active');
    }
};

// 导出到全局
window.FormUtils = FormUtils;
window.TableRowUtils = TableRowUtils;
