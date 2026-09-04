/**
 * 订单库存运行时（底层规则，不在页面呈现过程）
 *
 * 对照 docs/库存管理需求.html（文本稿 docs/库存管理规则-v1.0-20260903.txt）
 *
 * 可售库存、预占库存同一维度：SKU × 放单渠道（代采 / 商城 / 直播 / 零售）。
 * 剩余可售 = 本渠道可售 − 本渠道预占。
 * 现货仍按配送仓：SKU × 配送仓。仓可用现货 = 仓实物（预占不锁仓）。
 * 预占只在支付成功增加，按履约节点释放：
 *   零售自提 → 用户核销后释放；核销时扣仓实物
 *   零售/商城/直播快递 → 供应商发货后释放，不进仓储
 *   代采配送 / 代采快递 → 门店收货后释放
 * 截单不碰库存。
 */
(function (global) {
    var LEDGER_KEY = 'lf_order_stock_ledger_v3';
    var LINE_KEY = 'lf_order_stock_lines_v3';

    var CHANNEL = {
        PROXY: 'proxy',
        MALL: 'mall',
        LIVE: 'live',
        RETAIL: 'retail'
    };

    var FULFILL = {
        RETAIL_PICKUP: 'retail_pickup',
        RETAIL_EXPRESS: 'retail_express',
        PROXY_DELIVERY: 'proxy_delivery',
        PROXY_EXPRESS: 'proxy_express'
    };

    var RELEASE_EVENT = {
        USER_VERIFY: 'user_verify',
        SUPPLIER_SHIP: 'supplier_ship',
        STORE_RECEIVE: 'store_receive'
    };

    function releaseEventOf(fulfill) {
        if (fulfill === FULFILL.RETAIL_PICKUP) return RELEASE_EVENT.USER_VERIFY;
        if (fulfill === FULFILL.RETAIL_EXPRESS) return RELEASE_EVENT.SUPPLIER_SHIP;
        if (fulfill === FULFILL.PROXY_DELIVERY) return RELEASE_EVENT.STORE_RECEIVE;
        if (fulfill === FULFILL.PROXY_EXPRESS) return RELEASE_EVENT.STORE_RECEIVE;
        return RELEASE_EVENT.SUPPLIER_SHIP;
    }

    function isDirectExpress(fulfill) {
        return fulfill === FULFILL.RETAIL_EXPRESS;
    }

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

    function parseNum(value) {
        var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
        return isFinite(n) && n > 0 ? n : 0;
    }

    function channelKey(skuId, channel) {
        return String(skuId || '') + '@ch:' + String(channel || CHANNEL.RETAIL);
    }

    function physicalKey(skuId, warehouseId) {
        return String(skuId || '') + '@wh:' + String(warehouseId || '');
    }

    function loadLedger() {
        var parsed = readJson(LEDGER_KEY);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }

    function saveLedger(map) {
        writeJson(LEDGER_KEY, map || {});
    }

    function loadLines() {
        var parsed = readJson(LINE_KEY);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }

    function saveLines(map) {
        writeJson(LINE_KEY, map || {});
    }

    function emptyChannel() {
        return { reserved: 0, sellable: 0 };
    }

    function emptyPhysical() {
        return { physical: 0 };
    }

    function channelBucket(skuId, channel) {
        var map = loadLedger();
        var cur = map[channelKey(skuId, channel)];
        return cur ? Object.assign(emptyChannel(), cur) : emptyChannel();
    }

    function writeChannel(skuId, channel, bucket) {
        var map = loadLedger();
        map[channelKey(skuId, channel)] = bucket;
        saveLedger(map);
        return bucket;
    }

    function physicalBucket(skuId, warehouseId) {
        var map = loadLedger();
        var cur = map[physicalKey(skuId, warehouseId)];
        return cur ? Object.assign(emptyPhysical(), cur) : emptyPhysical();
    }

    function writePhysical(skuId, warehouseId, bucket) {
        var map = loadLedger();
        map[physicalKey(skuId, warehouseId)] = bucket;
        saveLedger(map);
        return bucket;
    }

    function attachSellable(skuId, channel, sku) {
        var bucket = channelBucket(skuId, channel);
        if (global.MdmSkuWhStock && typeof global.MdmSkuWhStock.summarize === 'function' && sku) {
            var sum = global.MdmSkuWhStock.summarize(sku, { channel: channel });
            if (!bucket.sellable) bucket.sellable = sum.sellableTotal || 0;
            if (!bucket.reserved && sum.reservedTotal) bucket.reserved = sum.reservedTotal;
        }
        if (sku && sku.sellableStock != null && !bucket.sellable) {
            bucket.sellable = parseNum(sku.sellableStock);
        }
        return bucket;
    }

    function snapshot(channelBucket, physical) {
        var reserved = (channelBucket && channelBucket.reserved) || 0;
        var sellable = (channelBucket && channelBucket.sellable) || 0;
        var qty = physical && physical.physical != null ? physical.physical : 0;
        return {
            physical: qty,
            reserved: reserved,
            reservedTotal: reserved,
            availableSpot: Math.max(0, qty),
            sellable: sellable,
            remain: Math.max(0, sellable - reserved),
            canSell: Math.max(0, sellable - reserved)
        };
    }

    /**
     * 支付成功：本渠道预占库存 +Q。
     * line: { orderNo, skuId, warehouseId, storeName, qty, channel, fulfill, sessionId, sku, liveQuota }
     */
    function reserveOnPay(line) {
        var qty = Math.round(parseNum(line && line.qty));
        if (!line || !qty) return { ok: false, reason: 'empty' };
        var lines = loadLines();
        var lineId = String(line.orderNo || '') + ':' + String(line.skuId || '');
        if (lines[lineId] && lines[lineId].status === 'reserved') {
            return { ok: false, reason: 'already_reserved', line: lines[lineId] };
        }

        var channel = line.channel || CHANNEL.RETAIL;
        var fulfill = line.fulfill || FULFILL.RETAIL_EXPRESS;
        var directShip = isDirectExpress(fulfill) || !!line.directShip;
        var warehouseId = directShip ? '' : String(line.warehouseId || '');
        var bucket = attachSellable(line.skuId, channel, line.sku);
        var view = snapshot(bucket, physicalBucket(line.skuId, warehouseId));
        var liveCap = line.liveQuota != null ? Math.round(parseNum(line.liveQuota)) : view.canSell;
        var cap = line.sessionId ? Math.min(view.canSell, liveCap) : view.canSell;
        if (qty > cap) {
            return { ok: false, reason: 'sellable_short', canSell: cap, need: qty };
        }

        bucket.reserved += qty;
        writeChannel(line.skuId, channel, bucket);

        var rec = {
            lineId: lineId,
            orderNo: line.orderNo,
            skuId: line.skuId,
            warehouseId: warehouseId,
            storeName: String(line.storeName || ''),
            channel: channel,
            fulfill: fulfill,
            releaseEvent: releaseEventOf(fulfill),
            sessionId: line.sessionId || '',
            qty: qty,
            directShip: directShip,
            status: 'reserved',
            at: new Date().toISOString()
        };
        lines[lineId] = rec;
        saveLines(lines);
        return { ok: true, line: rec, ledger: snapshot(bucket, physicalBucket(line.skuId, warehouseId)) };
    }

    /** 入库：仓实物 +N。预占不在这一步转化或释放。 */
    function inbound(skuId, warehouseId, qty) {
        var add = Math.round(parseNum(qty));
        if (!add) return { ok: false, reason: 'empty' };
        var bucket = physicalBucket(skuId, warehouseId);
        bucket.physical += add;
        writePhysical(skuId, warehouseId, bucket);
        return { ok: true, converted: 0, ledger: snapshot(emptyChannel(), bucket) };
    }

    function releaseReserved(rec, deductPhysical) {
        var bucket = channelBucket(rec.skuId, rec.channel || CHANNEL.RETAIL);
        bucket.reserved = Math.max(0, bucket.reserved - (rec.qty || 0));
        writeChannel(rec.skuId, rec.channel || CHANNEL.RETAIL, bucket);
        var physical = physicalBucket(rec.skuId, rec.warehouseId || '');
        if (deductPhysical && !rec.directShip && rec.warehouseId) {
            physical.physical = Math.max(0, physical.physical - (rec.qty || 0));
            writePhysical(rec.skuId, rec.warehouseId, physical);
        }
        return snapshot(bucket, physical);
    }

    /** 未到手取消 / 售中退款：退本渠道预占 */
    function releaseOnCancel(orderNo, skuId) {
        var lines = loadLines();
        var lineId = String(orderNo || '') + ':' + String(skuId || '');
        var rec = lines[lineId];
        if (!rec || rec.status !== 'reserved') return { ok: false, reason: 'not_reserved' };
        var view = releaseReserved(rec, false);
        rec.status = 'released';
        rec.releasedAt = new Date().toISOString();
        lines[lineId] = rec;
        saveLines(lines);
        return { ok: true, line: rec, ledger: view };
    }

    /**
     * 履约节点释放本渠道预占。event 必须等于该行 releaseEvent，否则不扣。
     * 零售自提用户核销会同时扣仓实物。
     */
    function releaseOnFulfill(orderNo, skuId, event) {
        var lines = loadLines();
        var lineId = String(orderNo || '') + ':' + String(skuId || '');
        var rec = lines[lineId];
        if (!rec || rec.status !== 'reserved') return { ok: false, reason: 'not_reserved' };
        if (event && rec.releaseEvent && event !== rec.releaseEvent) {
            return { ok: false, reason: 'wrong_event', expect: rec.releaseEvent };
        }
        var deductPhysical = rec.releaseEvent === RELEASE_EVENT.USER_VERIFY;
        var view = releaseReserved(rec, deductPhysical);
        rec.status = 'fulfilled';
        rec.fulfilledAt = new Date().toISOString();
        rec.fulfilledEvent = rec.releaseEvent;
        lines[lineId] = rec;
        saveLines(lines);
        return { ok: true, line: rec, ledger: view };
    }

    /** 兼容旧名：仅零售自提用户核销会走到这里 */
    function writeoff(orderNo, skuId) {
        return releaseOnFulfill(orderNo, skuId, RELEASE_EVENT.USER_VERIFY);
    }

    function lineOf(orderNo, skuId) {
        return loadLines()[String(orderNo || '') + ':' + String(skuId || '')] || null;
    }

    global.OrderStockRuntime = {
        CHANNEL: CHANNEL,
        FULFILL: FULFILL,
        RELEASE_EVENT: RELEASE_EVENT,
        releaseEventOf: releaseEventOf,
        snapshot: function (skuId, channel, warehouseId) {
            return snapshot(channelBucket(skuId, channel), physicalBucket(skuId, warehouseId));
        },
        reserveOnPay: reserveOnPay,
        inbound: inbound,
        releaseOnCancel: releaseOnCancel,
        releaseOnFulfill: releaseOnFulfill,
        writeoff: writeoff,
        lineOf: lineOf
    };
})(window);
