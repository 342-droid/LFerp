/* 移动端公共组件 */
(function (global) {
    if (global.WMSMobileComponents && global.WMSMobileComponents.mountScanBarcodeInput) {
        return;
    }

    function getHostNode(container) {
        if (!container) return null;
        if (typeof container === 'string') return document.getElementById(container);
        if (container instanceof HTMLElement) return container;
        return null;
    }

    function mountScanBarcodeInput(options) {
        const opts = options || {};
        const host = getHostNode(opts.container);
        if (!host) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'wms-mobile-scan-input';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = opts.inputClassName || 'wms-mobile-scan-input__field';
        input.placeholder = opts.placeholder || '请扫描/输入';
        input.autocomplete = opts.autocomplete || 'off';
        if (opts.inputId) input.id = opts.inputId;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wms-mobile-scan-input__btn';
        button.title = opts.buttonTitle || '扫描';
        button.setAttribute('aria-label', opts.buttonTitle || '扫描');
        button.innerHTML = (
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M3 7V5a2 2 0 0 1 2-2h2"></path>' +
            '<path d="M17 3h2a2 2 0 0 1 2 2v2"></path>' +
            '<path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>' +
            '<path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>' +
            '<line x1="7" y1="12" x2="17" y2="12"></line>' +
            '</svg>'
        );

        button.addEventListener('click', () => {
            input.focus();
            if (typeof opts.onScanClick === 'function') {
                opts.onScanClick({ input, button, wrapper });
            }
        });

        wrapper.appendChild(input);
        wrapper.appendChild(button);
        host.innerHTML = '';
        host.appendChild(wrapper);

        return {
            root: wrapper,
            input,
            button,
            focus: function () {
                input.focus();
            }
        };
    }

    global.WMSMobileComponents = global.WMSMobileComponents || {};
    global.WMSMobileComponents.mountScanBarcodeInput = mountScanBarcodeInput;
})(window);
