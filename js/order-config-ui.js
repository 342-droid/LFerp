/**
 * 订单配置 — 门店详情 / 基础设置共用 UI
 */
(function (global) {
    var STORE_COPY = {
        storeQueueOn: '开启：分销端提货页面可查看用户的排队信息；商城端用户可在个人主页或扫门店排队码进行排队',
        pendingVerifyDesc: '开启：核销时可对待发货订单进行核销',
        pendingVerifyWarn: ''
    };

    /** 门店档案 — 门店详情 — 订单配置专用文案 */
    var STORE_DETAIL_COPY = {
        storeQueueOn: '开启：分销端提货页面可查看用户的排队信息；商城端用户可在个人主页或扫门店排队码进行排队',
        pendingVerifyDesc: '开启待发货订单核销，核销时可对待发货订单进行核销，默认使用平台配置',
        pendingVerifyWarn: '温馨提示：先核销再订货，可能导致门店缺货'
    };

    function appendOrderConfigItem(opts) {
        var root = opts.root;
        if (!root) return;

        var fieldKey = opts.fieldKey;
        var settings = opts.settings || {};
        var namePrefix = opts.namePrefix || 'storeOrder';
        var nameSuffix = opts.nameSuffix || '';
        var radioName = namePrefix + '_' + fieldKey + nameSuffix;
        var current = settings[fieldKey] === 'off' ? 'off' : 'on';

        var item = document.createElement('div');
        item.className = 'store-order-config__item';

        var labelEl = document.createElement('div');
        labelEl.className = 'store-order-config__label';
        if (opts.required) {
            var req = document.createElement('span');
            req.className = 'store-order-config__required';
            req.textContent = '*';
            labelEl.appendChild(req);
        }
        labelEl.appendChild(document.createTextNode(opts.label || ''));

        var control = document.createElement('div');
        control.className = 'store-order-config__control';

        var radios = document.createElement('div');
        radios.className = 'store-order-config__radios';

        [
            { value: 'on', text: '开启' },
            { value: 'off', text: '关闭' }
        ].forEach(function (opt) {
            var wrap = document.createElement('label');
            wrap.className = 'store-order-config__radio';
            var input = document.createElement('input');
            input.type = 'radio';
            input.name = radioName;
            input.value = opt.value;
            input.checked = current === opt.value;
            wrap.appendChild(input);
            wrap.appendChild(document.createTextNode(opt.text));
            radios.appendChild(wrap);
        });

        control.appendChild(radios);

        var hintEl = null;
        var warnAlways = opts.warnTipAlways && opts.warnTip;
        if (opts.onHint || opts.staticHint || (opts.warnTip && !warnAlways)) {
            hintEl = document.createElement('p');
            hintEl.className = 'store-order-config__hint';

            function syncHint() {
                var checked = control.querySelector('input[name="' + radioName + '"]:checked');
                var val = checked ? checked.value : 'on';

                if (opts.staticHint) {
                    hintEl.textContent = opts.staticHint;
                    hintEl.hidden = false;
                    return;
                }

                if (val === 'on' && opts.onHint) {
                    hintEl.textContent = opts.onHint;
                    hintEl.hidden = false;
                    return;
                }

                if (val === 'off' && opts.warnTip) {
                    hintEl.textContent = opts.warnTip;
                    hintEl.hidden = false;
                    return;
                }

                hintEl.textContent = '';
                hintEl.hidden = true;
            }

            radios.querySelectorAll('input[type="radio"]').forEach(function (input) {
                input.addEventListener('change', syncHint);
            });
            syncHint();
            control.appendChild(hintEl);
        }

        if (warnAlways) {
            var warnEl = document.createElement('p');
            warnEl.className = 'store-order-config__warn';
            warnEl.textContent = opts.warnTip;
            control.appendChild(warnEl);
        }

        item.appendChild(labelEl);
        item.appendChild(control);
        root.appendChild(item);
    }

    function readOrderConfigValues(root, namePrefix, nameSuffix, fieldKeys) {
        var result = {};
        fieldKeys.forEach(function (fieldKey) {
            var radioName = namePrefix + '_' + fieldKey + nameSuffix;
            var checked = root.querySelector('input[name="' + radioName + '"]:checked');
            result[fieldKey] = checked ? checked.value : 'on';
        });
        return result;
    }

    global.OrderConfigUi = {
        STORE_COPY: STORE_COPY,
        STORE_DETAIL_COPY: STORE_DETAIL_COPY,
        appendOrderConfigItem: appendOrderConfigItem,
        readOrderConfigValues: readOrderConfigValues
    };
})(window);
