/**
 * 低利润门槛
 * 毛利率 = (售卖价 - 采购价 × 售卖系数) / 售卖价。
 * 低于门槛的商品，要同时满足「门店合作合同已签署」和「保证金余额达到该店应保有」才能下单，营销活动才能选这家店。
 * 少一条就是未放开。这项在门店配置「低利润与营销」里可关，关闭后两条都不看。
 * 应保有按门店账户配置，未单独配置时用平台通用金额。余额达到应保有（含等于）才算保证金这一条通过。
 */
(function (global) {
    var STORAGE_KEY = 'lf_low_margin_threshold_v1';
    var DEFAULT_THRESHOLD = 10;
    var CONTRACT_STORE_KEY = 'lf_contract_proto_v1';
    /** 门店配置「合同未完成限制」。关闭后不看合同、也不看保证金。 */
    var RESTRICT_STORAGE_KEY = 'lf_store_contract_restrict_v1';
    /** 合同脚本未加载、本地也还没有签署任务时，沿用合同演示种子里已完成的门店。 */
    var DEMO_SIGNED_STORE = '鲜丰水果文一西路店';

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

    function readStoredContracts() {
        try {
            var raw = global.localStorage.getItem(CONTRACT_STORE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.tasks) || !parsed.tasks.length) return null;
            if (!Array.isArray(parsed.parties) || !parsed.parties.length) return null;
            return parsed;
        } catch (err) {
            return null;
        }
    }

    /** 门店合作合同已完成（双方签完）。补充协议、签署中、已作废都不算。 */
    function contractSigned(ref) {
        var key = storeRef(ref);
        if (!key.name) return false;
        if (global.LfContract && typeof global.LfContract.storeContractCompleted === 'function') {
            return !!global.LfContract.storeContractCompleted(key.name);
        }
        var bundle = readStoredContracts();
        if (!bundle) return key.name === DEMO_SIGNED_STORE;
        var partyIds = {};
        bundle.parties.forEach(function (party) {
            if (party && party.name === key.name) partyIds[party.id] = true;
        });
        return bundle.tasks.some(function (task) {
            return !!(
                task &&
                task.scene === 'store' &&
                task.status === 'sign_completed' &&
                partyIds[task.partyId]
            );
        });
    }

    function commerceRestrictOn() {
        try {
            var raw = localStorage.getItem(RESTRICT_STORAGE_KEY);
            if (!raw) return true;
            var parsed = JSON.parse(raw);
            return !parsed || parsed.commerceGate !== 'off';
        } catch (err) {
            return true;
        }
    }

    function gateState(ref) {
        var key = storeRef(ref);
        var deposit = depositState(key);
        var signed = contractSigned(key);
        var enforce = commerceRestrictOn();
        return {
            key: key,
            deposit: deposit,
            signed: signed,
            enforce: enforce,
            released: !!(key.storeId || key.name) && (!enforce || (!!deposit.released && signed))
        };
    }

    function released(ref) {
        return gateState(ref).released;
    }

    function blockReason(ref) {
        var state = gateState(ref);
        if (state.released) return '';
        var why = [];
        if (!state.signed) why.push('门店合作合同未完成');
        if (!state.deposit.released) {
            why.push(
                '保证金余额 ' +
                    money(state.deposit.depositActual) +
                    '，未达到应保有 ' +
                    money(state.deposit.depositRequired)
            );
        }
        return why.join('；');
    }

    function commerceLabel(ref) {
        var state = gateState(ref);
        if (!state.enforce) {
            return {
                text: '已放开',
                title: '门店配置已关闭低利润与营销门槛。低利润商品可以下单，营销活动可以选择本店。'
            };
        }
        var bits = [
            state.signed ? '合同已签署' : '合同未完成',
            state.deposit.released
                ? '保证金余额 ' + money(state.deposit.depositActual) + '，已达到应保有 ' + money(state.deposit.depositRequired)
                : '保证金余额 ' + money(state.deposit.depositActual) + '，未达到应保有 ' + money(state.deposit.depositRequired)
        ];
        var line = '毛利率低于 ' + formatPercent(threshold()) + ' 的商品';
        if (!state.released) {
            return {
                text: '未放开',
                title: bits.join('。') + '。' + line + '，本店客户不能下单；营销活动不能选择本店。合同已签署且保证金达到应保有后改为已放开。'
            };
        }
        return {
            text: '已放开',
            title: bits.join('。') + '。低利润商品可以下单，营销活动可以选择本店。'
        };
    }

    function orderBlock(opts) {
        opts = opts || {};
        var rate = marginOf(opts);
        if (!isBelow(rate) || !commerceRestrictOn()) return '';
        var ref = { name: opts.storeName, storeId: opts.storeId };
        var state = gateState(ref);
        if (state.released) return '';
        var why = blockReason(ref) || '合同未完成或保证金未达到应保有';
        return '毛利率 ' + formatPercent(rate) + '，低于门槛 ' + formatPercent(threshold()) +
            '。' + why + '，不能下单。';
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
        commerceRestrictOn: commerceRestrictOn,
        blockReason: blockReason,
        commerceLabel: commerceLabel,
        orderBlock: orderBlock,
        listCell: listCell
    };
})(window);
