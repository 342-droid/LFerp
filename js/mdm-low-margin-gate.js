/**
 * 低利润门槛
 * 毛利率 = (售卖价 - 采购价 × 售卖系数) / 售卖价。
 * 低于门槛的商品，保证金余额未达到该店应保有金额时不能下单，营销活动也不能选这些门店。
 * 应保有按门店账户配置，未单独配置时用平台通用金额。余额达到应保有（含等于）即为已放开。
 */
(function (global) {
    var STORAGE_KEY = 'lf_low_margin_threshold_v1';
    var DEFAULT_THRESHOLD = 10;

    function threshold() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw == null || raw === '') return DEFAULT_THRESHOLD;
            var num = Number(raw);
            if (!isFinite(num) || num < 0) return DEFAULT_THRESHOLD;
            return Math.round(num * 10) / 10;
        } catch (e) {
            return DEFAULT_THRESHOLD;
        }
    }

    function setThreshold(value) {
        var num = Number(value);
        if (!isFinite(num) || num < 0) num = DEFAULT_THRESHOLD;
        if (num > 100) num = 100;
        num = Math.round(num * 10) / 10;
        try {
            localStorage.setItem(STORAGE_KEY, String(num));
        } catch (e) {}
        return num;
    }

    function marginOf(opts) {
        opts = opts || {};
        var sale = Number(opts.salePrice);
        var buy = Number(opts.purchasePrice);
        var ratio = opts.saleRatio == null || opts.saleRatio === '' ? 1 : Number(opts.saleRatio);
        if (!isFinite(sale) || sale <= 0 || !isFinite(buy) || !isFinite(ratio)) return null;
        return Math.round(((sale - buy * ratio) / sale) * 1000) / 10;
    }

    function formatPercent(rate) {
        if (rate == null || !isFinite(rate)) return '—';
        var text = (Math.round(rate * 10) / 10).toFixed(1);
        return text.replace(/\.0$/, '') + '%';
    }

    function isBelow(rate) {
        return rate != null && isFinite(rate) && rate < threshold();
    }

    function storeRef(ref) {
        if (ref && typeof ref === 'object') {
            return {
                storeId: String(ref.storeId || ref.id || '').trim(),
                name: String(ref.name || ref.storeName || '').trim()
            };
        }
        return { storeId: '', name: String(ref || '').trim() };
    }

    function money(n) {
        return '¥' + Number(n || 0).toFixed(2);
    }

    function depositState(ref) {
        var key = storeRef(ref);
        if (global.StoreAccountConfig && typeof global.StoreAccountConfig.depositStatus === 'function') {
            return global.StoreAccountConfig.depositStatus(key.storeId, key.name);
        }
        return {
            depositActual: 0,
            depositRequired: 0,
            depositGap: 0,
            released: false,
            depositSource: 'platform'
        };
    }

    function released(ref) {
        var key = storeRef(ref);
        if (!key.storeId && !key.name) return false;
        return !!depositState(key).released;
    }

    function commerceLabel(ref) {
        var state = depositState(ref);
        var hold = '保证金余额 ' + money(state.depositActual) + '，应保有 ' + money(state.depositRequired);
        var line = '毛利率低于 ' + formatPercent(threshold()) + ' 的商品';
        if (!state.released) {
            return {
                text: '未放开',
                title: hold + '，未达到应保有。' + line + '，本店客户不能下单；营销活动不能选择本店。'
            };
        }
        return {
            text: '已放开',
            title: hold + '，已达到应保有。低利润商品可以下单，营销活动可以选择本店。'
        };
    }

    function orderBlock(opts) {
        opts = opts || {};
        var rate = marginOf(opts);
        if (!isBelow(rate)) return '';
        var ref = { name: opts.storeName, storeId: opts.storeId };
        if (released(ref)) return '';
        var state = depositState(ref);
        return '毛利率 ' + formatPercent(rate) + '，低于门槛 ' + formatPercent(threshold()) +
            '。保证金余额 ' + money(state.depositActual) + '，未达应保有 ' + money(state.depositRequired) + '，不能下单。';
    }

    function listCell(item) {
        var rate = marginOf({
            purchasePrice: item && item.purchasePrice,
            salePrice: item && (item.priceMoney != null ? item.priceMoney : item.salePrice),
            saleRatio: item && item.saleRatio
        });
        if (rate == null) return '<span class="product-proxy-dash">—</span>';
        var low = isBelow(rate);
        return '<span' + (low ? ' style="color:#d4380d;font-weight:600" title="低于门槛，未放开门店不可下单"' : '') + '>' +
            formatPercent(rate) + (low ? ' · 不可下单' : '') + '</span>';
    }

    function bindConfig(input) {
        if (!input) return;
        input.value = String(threshold());
        input.addEventListener('change', function () {
            input.value = String(setThreshold(input.value));
            if (global.MdmErpLists && typeof global.MdmErpLists.repaintStoreCommerce === 'function') {
                global.MdmErpLists.repaintStoreCommerce();
            }
            if (typeof global.showToast === 'function') {
                global.showToast('低利润门槛已改为 ' + formatPercent(threshold()), 'success');
            }
        });
    }

    function mount() {
        bindConfig(document.getElementById('lowMarginThreshold'));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();

    global.LfLowMargin = {
        threshold: threshold,
        setThreshold: setThreshold,
        marginOf: marginOf,
        formatPercent: formatPercent,
        isBelow: isBelow,
        released: released,
        commerceLabel: commerceLabel,
        orderBlock: orderBlock,
        listCell: listCell
    };
})(window);
