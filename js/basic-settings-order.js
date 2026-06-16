(function () {
    var storageKey = 'lf_basic_settings_order_config';
    var defaults = { storeQueue: 'on', pendingShipmentVerify: 'on' };
    var root = document.getElementById('bsOrderConfigRoot');
    var saveBtn = document.getElementById('bsOrderSaveBtn');

    if (!root || !window.OrderConfigUi) {
        return;
    }

    var settings = defaults;
    try {
        var raw = localStorage.getItem(storageKey);
        if (raw) {
            settings = Object.assign({}, defaults, JSON.parse(raw));
        }
    } catch (e) {
        settings = defaults;
    }

    var copy = window.OrderConfigUi.STORE_COPY;

    window.OrderConfigUi.appendOrderConfigItem({
        root: root,
        fieldKey: 'storeQueue',
        label: '门店排队',
        settings: settings,
        namePrefix: 'basicOrder',
        nameSuffix: '',
        onHint: copy.storeQueueOn
    });

    window.OrderConfigUi.appendOrderConfigItem({
        root: root,
        fieldKey: 'pendingShipmentVerify',
        label: '待发货订单核销',
        settings: settings,
        namePrefix: 'basicOrder',
        nameSuffix: '',
        staticHint: copy.pendingVerifyDesc,
        warnTip: copy.pendingVerifyWarn
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            var data = window.OrderConfigUi.readOrderConfigValues(
                root,
                'basicOrder',
                '',
                ['storeQueue', 'pendingShipmentVerify']
            );
            localStorage.setItem(storageKey, JSON.stringify(data));
            if (typeof showToast === 'function') {
                showToast('订单配置已保存（演示）', 'success');
            }
        });
    }
})();
