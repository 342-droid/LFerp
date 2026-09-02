/**
 * 订单库存运行时（底层规则，不在页面呈现过程）
 *
 * 对照 docs/库存管理需求.html（文本稿 docs/库存管理规则-v1.0-20260903.txt）
 *
 * 预占只在支付成功增加，拆现货预占 / 预售预占。
 * 仓可用现货 = 仓实物 − 现货预占（预售预占不减现货）。
 * 还能卖 = 仓可售 − 现货预占 − 预售预占。
 * 截单不碰库存；核销才扣仓实物。
 */
(function (global) {
    var LEDGER_KEY = 'lf_order_stock_ledger_v1';
    var LINE_KEY = 'lf_order_stock_lines_v1';

    var KIND = {
        SPOT: 'spot',
        PRESALE: 'presale'
    };

    var CHANNEL = {
        PROXY: 'proxy',
        MALL: 'mall',
        LIVE: 'live',
        RETAIL: 'retail'
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

    function parseNum(value) {
        var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
        return isFinite(n) && n > 0 ? n : 0;
    }

    function ledgerKey(skuId, warehouseId) {
        return String(skuId || '') + '@' + String(warehouseId || 'direct');
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

    function emptyBucket() {
        return { physical: 0, spotReserved: 0, presaleReserved: 0, sellable: 0 };
    }

    function bucketOf(skuId, warehouseId) {
        var map = loadLedger();
        var key = ledgerKey(skuId, warehouseId);
        var cur = map[key];
        return cur ? Object.assign(emptyBucket(), cur) : emptyBucket();
    }

    function writeBucket(skuId, warehouseId, bucket) {
        var map = loadLedger();
        map[ledgerKey(skuId, warehouseId)] = bucket;
        saveLedger(map);
        return bucket;
    }

    function attachSellable(skuId, warehouseId, sku) {
        var bucket = bucketOf(skuId, warehouseId);
        if (global.MdmSkuWhStock && typeof global.MdmSkuWhStock.summarize === 'function' && sku) {
            var sum = global.MdmSkuWhStock.summarize(sku);
            var row = (sum.rows || []).filter(function (r) {
                return r.warehouseId === warehouseId;
            })[0];
            if (row) {
                if (!bucket.physical) bucket.physical = row.spot || 0;
                bucket.sellable = row.sellable || 0;
            } else if (sum.sellableTotal && !warehouseId) {
                bucket.sellable = sum.sellableTotal;
            }
        }
        if (sku && sku.sellableStock != null && !bucket.sellable) {
            bucket.sellable = parseNum(sku.sellableStock);
        }
        return bucket;
    }

    function snapshot(bucket) {
        var physical = bucket.physical || 0;
        var spotReserved = bucket.spotReserved || 0;
        var presaleReserved = bucket.presaleReserved || 0;
        var sellable = bucket.sellable || 0;
        return {
            physical: physical,
            spotReserved: spotReserved,
            presaleReserved: presaleReserved,
            reservedTotal: spotReserved + presaleReserved,
            availableSpot: Math.max(0, physical - spotReserved),
            sellable: sellable,
            canSell: Math.max(0, sellable - spotReserved - presaleReserved)
        };
    }

    /**
     * 支付成功：拆现货段 / 预售段并加预占。
     * line: { orderNo, skuId, warehouseId, qty, channel, sessionId, directShip, sku }
     */
    function reserveOnPay(line) {
        var qty = Math.round(parseNum(line && line.qty));
        if (!line || !qty) return { ok: false, reason: 'empty' };
        var lines = loadLines();
        var lineId = String(line.orderNo || '') + ':' + String(line.skuId || '');
        if (lines[lineId] && lines[lineId].status === 'reserved') {
            return { ok: false, reason: 'already_reserved', line: lines[lineId] };
        }

        var warehouseId = line.directShip ? '' : line.warehouseId || '';
        var bucket = attachSellable(line.skuId, warehouseId, line.sku);
        var view = snapshot(bucket);
        var liveCap = line.liveQuota != null ? Math.round(parseNum(line.liveQuota)) : view.canSell;
        var cap = line.sessionId ? Math.min(view.canSell, liveCap) : view.canSell;

        if (line.directShip) {
            view.availableSpot = 0;
        }

        var spotQty = Math.min(qty, view.availableSpot, cap);
        var presaleQty = qty - spotQty;
        if (spotQty + presaleQty < qty || presaleQty > cap - spotQty) {
            return { ok: false, reason: 'sellable_short', canSell: cap, need: qty };
        }

        bucket.spotReserved += spotQty;
        bucket.presaleReserved += presaleQty;
        writeBucket(line.skuId, warehouseId, bucket);

        var rec = {
            lineId: lineId,
            orderNo: line.orderNo,
            skuId: line.skuId,
            warehouseId: warehouseId,
            channel: line.channel || CHANNEL.RETAIL,
            sessionId: line.sessionId || '',
            qty: qty,
            spotQty: spotQty,
            presaleQty: presaleQty,
            directShip: !!line.directShip,
            status: 'reserved',
            at: new Date().toISOString()
        };
        lines[lineId] = rec;
        saveLines(lines);
        return { ok: true, line: rec, ledger: snapshot(bucket) };
    }

    /** 入库：实物增加，预售预占转为现货预占 */
    function inbound(skuId, warehouseId, qty) {
        var add = Math.round(parseNum(qty));
        if (!add) return { ok: false, reason: 'empty' };
        var bucket = bucketOf(skuId, warehouseId);
        bucket.physical += add;
        var convert = Math.min(add, bucket.presaleReserved);
        bucket.presaleReserved -= convert;
        bucket.spotReserved += convert;
        writeBucket(skuId, warehouseId, bucket);
        return { ok: true, converted: convert, ledger: snapshot(bucket) };
    }

    /** 未到手取消 / 售中退款：原路退预占 */
    function releaseOnCancel(orderNo, skuId) {
        var lines = loadLines();
        var lineId = String(orderNo || '') + ':' + String(skuId || '');
        var rec = lines[lineId];
        if (!rec || rec.status !== 'reserved') return { ok: false, reason: 'not_reserved' };
        var bucket = bucketOf(rec.skuId, rec.warehouseId);
        bucket.spotReserved = Math.max(0, bucket.spotReserved - (rec.spotQty || 0));
        bucket.presaleReserved = Math.max(0, bucket.presaleReserved - (rec.presaleQty || 0));
        writeBucket(rec.skuId, rec.warehouseId, bucket);
        rec.status = 'released';
        rec.releasedAt = new Date().toISOString();
        lines[lineId] = rec;
        saveLines(lines);
        return { ok: true, line: rec, ledger: snapshot(bucket) };
    }

    /** 核销：清预占；非直发扣仓实物 */
    function writeoff(orderNo, skuId) {
        var lines = loadLines();
        var lineId = String(orderNo || '') + ':' + String(skuId || '');
        var rec = lines[lineId];
        if (!rec || rec.status !== 'reserved') return { ok: false, reason: 'not_reserved' };
        var bucket = bucketOf(rec.skuId, rec.warehouseId);
        bucket.spotReserved = Math.max(0, bucket.spotReserved - (rec.spotQty || 0));
        bucket.presaleReserved = Math.max(0, bucket.presaleReserved - (rec.presaleQty || 0));
        if (!rec.directShip && rec.warehouseId) {
            bucket.physical = Math.max(0, bucket.physical - (rec.qty || 0));
        }
        writeBucket(rec.skuId, rec.warehouseId, bucket);
        rec.status = 'written_off';
        rec.writeoffAt = new Date().toISOString();
        lines[lineId] = rec;
        saveLines(lines);
        return { ok: true, line: rec, ledger: snapshot(bucket) };
    }

    function lineOf(orderNo, skuId) {
        return loadLines()[String(orderNo || '') + ':' + String(skuId || '')] || null;
    }

    global.OrderStockRuntime = {
        KIND: KIND,
        CHANNEL: CHANNEL,
        snapshot: function (skuId, warehouseId) {
            return snapshot(bucketOf(skuId, warehouseId));
        },
        reserveOnPay: reserveOnPay,
        inbound: inbound,
        releaseOnCancel: releaseOnCancel,
        writeoff: writeoff,
        lineOf: lineOf
    };
})(window);
