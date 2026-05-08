/**
 * 日期选择器组件 - 冷丰WMS系统
 */

class DatePicker {
    constructor(options) {
        this.options = {
            element: null,
            format: 'YYYY-MM-DD',
            minDate: null,
            maxDate: null,
            disabled: false,
            onSelect: null,
            ...options
        };
        
        this.init();
    }
    
    init() {
        if (!this.options.element) return;
        
        this.element = typeof this.options.element === 'string' 
            ? document.querySelector(this.options.element) 
            : this.options.element;
        
        this.element.classList.add('date-picker');
        this.input = this.element.querySelector('input') || this.element;
        
        if (this.options.disabled) {
            this.input.disabled = true;
        }
        
        this.setupEventListeners();
        this.formatInputValue();
    }
    
    setupEventListeners() {
        this.input.addEventListener('change', (e) => {
            this.formatInputValue();
            if (this.options.onSelect) {
                this.options.onSelect(this.getValue());
            }
        });
        
        this.input.addEventListener('blur', (e) => {
            this.formatInputValue();
        });
    }
    
    formatInputValue() {
        const value = this.input.value;
        if (!value) return;
        
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return;
            
            const formatted = this.formatDate(date, this.options.format);
            this.input.value = formatted;
        } catch (e) {
            console.error('日期格式化错误:', e);
        }
    }
    
    formatDate(date, format) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    getValue() {
        return this.input.value;
    }
    
    setValue(value) {
        this.input.value = value;
        this.formatInputValue();
    }
    
    disable() {
        this.input.disabled = true;
    }
    
    enable() {
        this.input.disabled = false;
    }
    
    destroy() {
        this.element.classList.remove('date-picker');
        // 移除事件监听器
        const newInput = this.input.cloneNode(true);
        this.input.parentNode.replaceChild(newInput, this.input);
        this.input = newInput;
    }
}

class DateRangePicker {
    constructor(options) {
        this.options = {
            element: null,
            format: 'YYYY-MM-DD',
            minDate: null,
            maxDate: null,
            disabled: false,
            onSelect: null,
            ...options
        };
        
        this.init();
    }
    
    init() {
        if (!this.options.element) return;
        
        this.element = typeof this.options.element === 'string' 
            ? document.querySelector(this.options.element) 
            : this.options.element;
        
        this.element.classList.add('date-range');
        
        this.startInput = this.element.querySelector('[data-type="start"]');
        this.endInput = this.element.querySelector('[data-type="end"]');
        
        if (!this.startInput || !this.endInput) {
            console.error('日期范围选择器缺少开始或结束输入框');
            return;
        }
        
        // 为输入框添加date-picker类
        this.startInput.parentElement.classList.add('date-picker');
        this.endInput.parentElement.classList.add('date-picker');
        
        if (this.options.disabled) {
            this.startInput.disabled = true;
            this.endInput.disabled = true;
        }
        
        this.setupEventListeners();
        this.formatInputValues();
    }
    
    setupEventListeners() {
        const handleChange = () => {
            this.formatInputValues();
            this.validateRange();
            if (this.options.onSelect) {
                this.options.onSelect(this.getValue());
            }
        };
        
        this.startInput.addEventListener('change', handleChange);
        this.endInput.addEventListener('change', handleChange);
        
        this.startInput.addEventListener('blur', handleChange);
        this.endInput.addEventListener('blur', handleChange);
    }
    
    formatInputValues() {
        [this.startInput, this.endInput].forEach(input => {
            const value = input.value;
            if (!value) return;
            
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return;
                
                const formatted = this.formatDate(date, this.options.format);
                input.value = formatted;
            } catch (e) {
                console.error('日期格式化错误:', e);
            }
        });
    }
    
    formatDate(date, format) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    validateRange() {
        const startValue = this.startInput.value;
        const endValue = this.endInput.value;
        
        if (!startValue || !endValue) return;
        
        const startDate = new Date(startValue);
        const endDate = new Date(endValue);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
        
        if (startDate > endDate) {
            // 交换值
            const temp = this.startInput.value;
            this.startInput.value = this.endInput.value;
            this.endInput.value = temp;
            
            // 显示提示
            if (window.showToast) {
                window.showToast('开始时间不能晚于结束时间', 'error');
            } else {
                alert('开始时间不能晚于结束时间');
            }
        }
    }
    
    getValue() {
        return {
            start: this.startInput.value,
            end: this.endInput.value
        };
    }
    
    setValue(start, end) {
        this.startInput.value = start;
        this.endInput.value = end;
        this.formatInputValues();
        this.validateRange();
    }
    
    disable() {
        this.startInput.disabled = true;
        this.endInput.disabled = true;
    }
    
    enable() {
        this.startInput.disabled = false;
        this.endInput.disabled = false;
    }
    
    destroy() {
        this.element.classList.remove('date-range');
        this.startInput.parentElement.classList.remove('date-picker');
        this.endInput.parentElement.classList.remove('date-picker');
        
        // 移除事件监听器
        const newStartInput = this.startInput.cloneNode(true);
        const newEndInput = this.endInput.cloneNode(true);
        this.startInput.parentNode.replaceChild(newStartInput, this.startInput);
        this.endInput.parentNode.replaceChild(newEndInput, this.endInput);
        this.startInput = newStartInput;
        this.endInput = newEndInput;
    }
}

// 全局工具函数
if (!window.DatePicker) {
    window.DatePicker = DatePicker;
    window.DateRangePicker = DateRangePicker;
}

// 初始化函数
function initDatePickers() {
    // 初始化所有日期选择器
    document.querySelectorAll('.date-picker').forEach(element => {
        if (!element._datePicker) {
            element._datePicker = new DatePicker({ element });
        }
    });
    
    // 初始化所有日期范围选择器
    document.querySelectorAll('.date-range').forEach(element => {
        if (!element._dateRangePicker) {
            element._dateRangePicker = new DateRangePicker({ element });
        }
    });
}

// 当DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDatePickers);
} else {
    initDatePickers();
}
