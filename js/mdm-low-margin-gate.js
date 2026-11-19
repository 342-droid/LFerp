/**
 * 合同未完成限制
 * 指定商品购买、营销选店各自开关。开启后都要同时满足「门店合作合同已签署」和「保证金余额达到该店应保有」。
 * 指定商品范围：利润率、标签、类目至少配一项，命中任一已配置条件即纳入限制购买范围。
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

    function restrictConfig() {
        try {
            var raw = localStorage.getItem(RESTRICT_STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (err) {
            return null;
        }
    }

    /** 未单独保存过利润比例时，仍用原来的门槛；明确留空则不按利润拦截。 */
    function configuredProfit() {
        var parsed = restrictConfig();
        if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, 'profitBelow')) return threshold();
        if (parsed.profitBelow == null || parsed.profitBelow === '') return null;
        var num = Number(parsed.profitBelow);
        if (!isFinite(num) || num < 0 || num > 100) return null;
        return Math.round(num * 10) / 10;
    }

    function isBelow(rate) {
        var limit = configuredProfit();
        if (limit == null) return false;
        return rate != null && isFinite(rate) && rate < limit;
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

    function flagOn(key) {
        var parsed = restrictConfig();
        if (!parsed) return true;
        if (parsed[key] === 'off') return false;
        if (parsed[key] === 'on') return true;
        return parsed.commerceGate !== 'off';
    }

    function productPurchaseOn() {
        return flagOn('productPurchaseGate');
    }

    function marketingStoreOn() {
        return flagOn('marketingStoreGate');
    }

    function namedRows(list) {
        var seen = {};
        return (Array.isArray(list) ? list : [])
            .map(function (row) {
                var id = String((row && (row.id || row.name)) || '').trim();
                var name = String((row && row.name) || id).trim();
                if (!id || seen[id]) return null;
                seen[id] = true;
                return { id: id, name: name || id };
            })
            .filter(Boolean);
    }

    function conditions(ref) {
        var key = storeRef(ref);
        var deposit = depositState(key);
        var signed = contractSigned(key);
        var known = !!(key.storeId || key.name);
        return {
            key: key,
            deposit: deposit,
            signed: signed,
            known: known,
            ok: known && !!deposit.released && signed
        };
    }

    function unmetReason(ref) {
        var state = conditions(ref);
        if (!state.known || state.ok) return '';
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

    function released(ref) {
        var state = conditions(ref);
        return state.known && (!productPurchaseOn() || state.ok);
    }

    function marketingReleased(ref) {
        var state = conditions(ref);
        return state.known && (!marketingStoreOn() || state.ok);
    }

    function blockReason(ref) {
        if (!marketingStoreOn()) return '';
        return unmetReason(ref);
    }

    function matchRestricted(opts) {
        opts = opts || {};
        var parsed = restrictConfig() || {};
        var reasons = [];
        var limit = configuredProfit();
        var rate = marginOf(opts);
        if (limit != null && rate != null && isFinite(rate) && rate < limit) {
            reasons.push('商品利润率 ' + formatPercent(rate) + '，低于 ' + formatPercent(limit));
        }
        var tags = namedRows(parsed.blockedTags);
        var productTags = []
            .concat(opts.tags || [], opts.productTags || [])
            .map(function (tag) {
                return String(tag && tag.name ? tag.name : tag || '').trim();
            })
            .filter(Boolean);
        if (tags.length && productTags.length) {
            var hitTags = tags
                .filter(function (row) {
                    return productTags.indexOf(row.name) >= 0 || productTags.indexOf(row.id) >= 0;
                })
                .map(function (row) {
                    return row.name;
                });
            if (hitTags.length) reasons.push('商品标签「' + hitTags.join('、') + '」');
        }
        var cats = namedRows(parsed.blockedCategories);
        var category = String(opts.category || opts.categoryName || '').trim();
        if (cats.length && category) {
            var hitCat = cats.some(function (row) {
                return row.name === category || category.indexOf(row.name) >= 0;
            });
            if (hitCat) reasons.push('商品类目「' + category + '」');
        }
        return reasons;
    }

    function commerceLabel(ref) {
        var state = conditions(ref);
        var marketingOn = marketingStoreOn();
        var bits = [
            state.signed ? '合同已签署' : '合同未完成',
            state.deposit.released
                ? '保证金余额 ' + money(state.deposit.depositActual) + '，已达到应保有 ' + money(state.deposit.depositRequired)
                : '保证金余额 ' + money(state.deposit.depositActual) + '，未达到应保有 ' + money(state.deposit.depositRequired)
        ];
        var restricted = marketingOn && !state.ok;
        var marketing = !marketingOn
            ? '营销选店限制未开启，门店可正常参与营销活动'
            : (state.ok ? '合同和保证金已满足，可参与营销活动' : '营销选店未放开');
        return {
            text: restricted ? '营销受限' : '正常',
            title: bits.join('，') + '。' + marketing + '。'
        };
    }

    function orderBlock(opts) {
        opts = opts || {};
        if (!productPurchaseOn()) return '';
        var reasons = matchRestricted(opts);
        if (!reasons.length) return '';
        var ref = { name: opts.storeName, storeId: opts.storeId };
        var state = conditions(ref);
        if (!state.known || state.ok) return '';
        var why = unmetReason(ref) || '合同未完成或保证金未达到应保有';
        return reasons.join('；') + '。' + why + '，不能购买。';
    }

    function listCell(item) {
        var rate = marginOf({
            purchasePrice: item && item.purchasePrice,
            salePrice: item && (item.priceMoney != null ? item.priceMoney : item.salePrice),
            saleRatio: item && item.saleRatio
        });
        if (rate == null) return '<span class="product-proxy-dash">—</span>';
        var low = productPurchaseOn() && isBelow(rate);
        return '<span' + (low ? ' style="color:#d4380d;font-weight:600" title="商品利润率低于已配置阈值，未放开门店不可购买"' : '') + '>' +
            formatPercent(rate) + (low ? ' · 不可购买' : '') + '</span>';
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
        marketingReleased: marketingReleased,
        productPurchaseOn: productPurchaseOn,
        marketingStoreOn: marketingStoreOn,
        commerceRestrictOn: productPurchaseOn,
        blockReason: blockReason,
        commerceLabel: commerceLabel,
        orderBlock: orderBlock,
        listCell: listCell
    };
})(window);
