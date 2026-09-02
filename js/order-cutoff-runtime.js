/**
 * 订单截单运行时（底层规则）
 *
 * 1. 支付后自动截单：支付成功即已截单，不再走每日定时。是否进订货汇总由商品标签决定，不跟截单方式绑定。
 * 2. 选品库系统标签「不走订货单」：该商品行不进入采购「门店订货汇总」，不生成门店订货单。
 * 3. 采购侧人工截单后，到点策略不再重复执行。
 * 已截单不可释放；任一来源写入后，其它自动截单任务跳过该单。
 */
(function (global) {
    var STRATEGY_KEY = 'lf_order_express_cutoff_v6';
    var STRATEGY_LEGACY_KEYS = [
        'lf_order_express_cutoff_v5',
        'lf_order_express_cutoff_v4',
        'lf_order_express_cutoff_v3'
    ];
    var FACT_KEY = 'lf_order_cutoff_fact_v1';

    var SOURCE = {
        AFTER_PAY: 'after_pay',
        SCHEDULE: 'schedule',
        MANUAL_DEMAND: 'manual_demand',
        EARLY_SHIP: 'early_ship'
    };

    var FULFILLMENT_MAP = {
        快递到家: 'express_home',
        门店自提: 'pickup',
        自提: 'pickup',
        平台配送: 'platform',
        快递配送: 'express_proxy',
        快递: 'express_home',
        express_home: 'express_home',
        pickup: 'pickup',
        platform: 'platform',
        express_proxy: 'express_proxy'
    };

    function readJson(key) {
        try {
            var raw = global.localStorage && global.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeJson(key, value) {
        try {
            if (global.localStorage) global.localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            /* ignore */
        }
    }

    function loadFacts() {
        var parsed = readJson(FACT_KEY);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }

    function saveFacts(map) {
        writeJson(FACT_KEY, map || {});
    }

    function orderNosOf(row) {
        var text = '';
        if (row) {
            text = String(row.sourceOrderNo || row.orderNo || row.orderCode || '').trim();
        }
        if (!text) return [];
        return text
            .split(/[,，\s]+/)
            .map(function (s) {
                return s.trim();
            })
            .filter(Boolean);
    }

    function factOf(rowOrNo) {
        var nos = typeof rowOrNo === 'string' ? [rowOrNo] : orderNosOf(rowOrNo);
        var facts = loadFacts();
        for (var i = 0; i < nos.length; i++) {
            if (facts[nos[i]]) return facts[nos[i]];
        }
        return null;
    }

    function channelOf(row) {
        var text = String((row && (row.orderSource || row.channel)) || '');
        if (text.indexOf('代采') >= 0 || text === 'proxy') return 'proxy';
        if (text.indexOf('零售') >= 0 || text === 'retail') return 'retail';
        return '';
    }

    function fulfillmentOf(row) {
        return FULFILLMENT_MAP[String((row && row.fulfillmentMethod) || '').trim()] || '';
    }

    function sceneOf(row) {
        if (row && (row.scene === 'live' || row.scene === 'mall')) return row.scene;
        var live = String((row && row.liveSession) || '').trim();
        if (live && live !== '—') return 'live';
        return 'mall';
    }

    function parseStrategies(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (raw.strategies && Array.isArray(raw.strategies)) return raw.strategies;
        return [];
    }

    function loadStrategies() {
        var current = parseStrategies(readJson(STRATEGY_KEY));
        if (current.length) return current;
        for (var i = 0; i < STRATEGY_LEGACY_KEYS.length; i++) {
            var legacy = parseStrategies(readJson(STRATEGY_LEGACY_KEYS[i]));
            if (legacy.length) return legacy;
        }
        return [];
    }

    function matchesStrategy(row, strategy) {
        if (!row || !strategy || strategy.status !== 'active') return false;
        var channel = channelOf(row);
        var channels = Array.isArray(strategy.channels) ? strategy.channels : [];
        if (channel && channels.length && channels.indexOf(channel) < 0) return false;
        if (channel === 'retail') {
            var scenes = Array.isArray(strategy.scenes) ? strategy.scenes : [];
            if (scenes.length && scenes.indexOf(sceneOf(row)) < 0) return false;
        }
        if (strategy.fulfillmentScope === 'specified') {
            var fulfill = fulfillmentOf(row);
            var ids = Array.isArray(strategy.fulfillments) ? strategy.fulfillments : [];
            if (!fulfill || ids.indexOf(fulfill) < 0) return false;
        }
        if (strategy.tagScope === 'specified') {
            var tags = Array.isArray(row.tags) ? row.tags : Array.isArray(row.productTags) ? row.productTags : [];
            var need = (strategy.tags || []).map(function (item) {
                return String((item && (item.id || item.name)) || item || '').trim();
            });
            if (!need.length) return false;
            var hitTag = tags.some(function (tag) {
                var id = String((tag && (tag.id || tag.name)) || tag || '').trim();
                return need.indexOf(id) >= 0;
            });
            if (!hitTag) return false;
        }
        if (strategy.categoryScope === 'specified') {
            var path = String((row && row.skuCategoryPath) || '');
            var cats = strategy.categories || [];
            var hitCat = cats.some(function (cat) {
                var name = String((cat && (cat.name || cat.id)) || cat || '').trim();
                return name && path.indexOf(name) >= 0;
            });
            if (!hitCat) return false;
        }
        return true;
    }

    function isMarkedAfterPay(row) {
        var source = String((row && (row.cutoffSource || row.cutoffMode)) || '');
        if (source === SOURCE.AFTER_PAY) return true;
        var fact = factOf(row);
        return !!(fact && fact.source === SOURCE.AFTER_PAY);
    }

    function matchesAfterPayStrategy(row) {
        var list = loadStrategies();
        for (var i = 0; i < list.length; i++) {
            if (list[i].cutoffMode === SOURCE.AFTER_PAY && matchesStrategy(row, list[i])) return true;
        }
        return false;
    }

    function isAfterPayCutoffOrder(row) {
        return isMarkedAfterPay(row) || matchesAfterPayStrategy(row);
    }

    function tagTokensOf(row) {
        var tokens = [];
        function push(item) {
            if (item == null) return;
            if (typeof item === 'string') {
                var text = item.trim();
                if (text) tokens.push(text);
                return;
            }
            var id = String((item.id || '')).trim();
            var name = String((item.name || '')).trim();
            if (id) tokens.push(id);
            if (name) tokens.push(name);
        }
        if (!row) return tokens;
        (row.tags || []).forEach(push);
        (row.productTags || []).forEach(push);
        (row.skuTags || []).forEach(push);
        var skuMap = global.PURCHASE_STORE_SKU_TAGS || {};
        var skuCode = String((row.skuCode || '')).trim();
        if (skuCode && skuMap[skuCode]) {
            (skuMap[skuCode] || []).forEach(push);
        }
        return tokens;
    }

    function isSkipDemandSummaryToken(token) {
        var text = String(token || '').trim();
        if (!text) return false;
        if (text === 'sys_skip_demand_summary' || text === '不走订货单') return true;
        var store = global.MdmProductSelectionTagStore;
        return !!(store && typeof store.isSkipDemandSummary === 'function' && store.isSkipDemandSummary(text));
    }

    function skipsDemandSummary(row) {
        return tagTokensOf(row).some(isSkipDemandSummaryToken);
    }

    function alreadyCommitted(row) {
        var fact = factOf(row);
        if (fact && fact.status === 'CUTOFF_COMMITTED') return true;
        var status = String((row && (row.cutoffStatus || row.cutoffState)) || '');
        return status === 'CUTOFF_COMMITTED' || status === '已截单';
    }

    function shouldAppearInDemandSummary(row) {
        if (!row) return false;
        return !skipsDemandSummary(row);
    }

    function filterDemandSummaryLines(lines) {
        return (Array.isArray(lines) ? lines : []).filter(shouldAppearInDemandSummary);
    }

    function canApplyScheduleCutoff(row) {
        if (!row) return false;
        if (alreadyCommitted(row)) return false;
        if (isAfterPayCutoffOrder(row)) return false;
        var fact = factOf(row);
        if (fact && fact.source === SOURCE.MANUAL_DEMAND) return false;
        return true;
    }

    function upsertFacts(orderNos, patch) {
        var map = loadFacts();
        (orderNos || []).forEach(function (no) {
            if (!no || map[no]) return;
            map[no] = {
                status: 'CUTOFF_COMMITTED',
                source: patch.source,
                at: patch.at || new Date().toISOString(),
                voucher: patch.voucher || ''
            };
        });
        saveFacts(map);
        return map;
    }

    function markManualDemandCutoff(orderNos, mdh) {
        return upsertFacts(orderNos, {
            source: SOURCE.MANUAL_DEMAND,
            voucher: mdh || '',
            at: new Date().toISOString()
        });
    }

    function applyScheduleCutoff(rows) {
        var applied = [];
        var skipped = [];
        (rows || []).forEach(function (row) {
            if (canApplyScheduleCutoff(row)) applied.push(row);
            else skipped.push(row);
        });
        if (applied.length) {
            var nos = [];
            applied.forEach(function (row) {
                orderNosOf(row).forEach(function (no) {
                    nos.push(no);
                });
            });
            upsertFacts(nos, { source: SOURCE.SCHEDULE });
        }
        return { applied: applied, skipped: skipped };
    }

    global.OrderCutoffRuntime = {
        SOURCE: SOURCE,
        orderNosOf: orderNosOf,
        factOf: factOf,
        isAfterPayCutoffOrder: isAfterPayCutoffOrder,
        skipsDemandSummary: skipsDemandSummary,
        shouldAppearInDemandSummary: shouldAppearInDemandSummary,
        filterDemandSummaryLines: filterDemandSummaryLines,
        canApplyScheduleCutoff: canApplyScheduleCutoff,
        markManualDemandCutoff: markManualDemandCutoff,
        applyScheduleCutoff: applyScheduleCutoff
    };
})(window);
