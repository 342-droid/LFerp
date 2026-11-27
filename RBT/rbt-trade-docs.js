/* 确认发货完成、进入门店付款中后按发货记录生成三张交易单。没有发货记录的历史单仍按需求商品生成。 */
(function () {
    var KEY = 'rbt_trade_docs_v2';
    var LF_SUPPLY = { code: 'LF-SUPPLY', name: '冷丰供应链' };
    var DOC_UP = '上游交易';
    var DOC_DOWN = '下游交易';
    var DOC_FEE = '冷丰服务费';

    function centsOf(value) {
        var num = Number(String(value == null ? '' : value).replace(/[¥,\s]/g, ''));
        if (!isFinite(num)) return 0;
        return Math.round(num * 100);
    }

    function fromCents(cents) {
        var sign = cents < 0 ? '-' : '';
        var abs = Math.abs(Math.round(cents));
        return sign + (abs / 100).toFixed(2);
    }

    function nowText() {
        var api = window.RbtDemandData;
        if (api && typeof api.nowText === 'function') return api.nowText();
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function emptyStore() {
        return { trades: [] };
    }

    /* 已生成的单据若把服务费记在字段上，改成明细里的一行。 */
    function migrateFeeLine(row) {
        if (!row || !Array.isArray(row.lines)) return false;
        var storedAsField = row.serviceFee != null || row.lines.some(function (line) {
            return line && line.serviceFee != null;
        });
        if (!storedAsField) return false;
        if (row.docType === DOC_UP) {
            row.lines = row.lines.filter(function (line) { return !isFeeLine(line); }).map(function (line) {
                var amount = line.goodsAmount != null ? line.goodsAmount : line.amount;
                return { code: line.code || '', name: line.name || '', qty: line.qty, salePrice: line.salePrice, amount: amount };
            });
        } else if (row.docType === DOC_FEE) {
            var gap = 0;
            row.lines.forEach(function (line) {
                if (!line || isFeeLine(line)) {
                    gap += centsOf(line && line.amount);
                    return;
                }
                gap += line.serviceFee != null ? centsOf(line.serviceFee) : centsOf(line.amount);
            });
            row.lines = [feeLine(gap)];
        } else {
            var goods = [];
            var fee = 0;
            row.lines.forEach(function (line) {
                if (!line) return;
                if (isFeeLine(line)) {
                    fee += centsOf(line.amount);
                    return;
                }
                fee += centsOf(line.serviceFee);
                var amount = line.goodsAmount != null ? line.goodsAmount : fromCents(centsOf(line.salePrice) * Number(line.qty || 0));
                goods.push({ code: line.code || '', name: line.name || '', qty: line.qty, salePrice: line.salePrice, amount: amount });
            });
            row.lines = goods.concat([feeLine(fee)]);
        }
        delete row.serviceFee;
        row.goodsAmount = sumField(row.lines.filter(function (line) { return !isFeeLine(line); }), 'amount');
        row.amount = sumField(row.lines, 'amount');
        return true;
    }

    function readStore() {
        try {
            var raw = sessionStorage.getItem(KEY);
            if (raw == null) return emptyStore();
            var data = JSON.parse(raw);
            var trades = data && Array.isArray(data.trades) ? data.trades : [];
            var changed = false;
            trades.forEach(function (row) {
                if (migrateFeeLine(row)) changed = true;
            });
            var store = { trades: trades };
            if (changed) writeStore(store);
            return store;
        } catch (e) {
            return emptyStore();
        }
    }

    function writeStore(store) {
        sessionStorage.setItem(KEY, JSON.stringify(store || emptyStore()));
    }

    function pad5(num) {
        return ('00000' + Number(num || 0)).slice(-5);
    }

    function nextCodes(store) {
        var max = 0;
        (store.trades || []).forEach(function (row) {
            var matched = String((row && row.code) || '').match(/^JY(\d+)$/i);
            if (matched) max = Math.max(max, Number(matched[1]));
        });
        return {
            up: 'JY' + pad5(max + 1),
            down: 'JY' + pad5(max + 2),
            fee: 'JY' + pad5(max + 3)
        };
    }

    /* 单价按系数四舍五入到分。系数无效时保持原始售价。 */
    function ratedUnitCents(originCents, rate) {
        var hundred = Math.round(Number(rate) * 100);
        if (!isFinite(hundred) || hundred <= 0) return originCents;
        return Math.round(originCents * hundred / 100);
    }

    function sumField(lines, field) {
        return fromCents((lines || []).reduce(function (total, line) {
            return total + centsOf(line && line[field]);
        }, 0));
    }

    function isFeeLine(line) {
        return !!(line && (line.fee || line.name === '服务费' || line.name === '冷丰实收' || line.name === '服务商实收'));
    }

    function goodsLine(sku) {
        var qty = Number(sku && sku.qty);
        if (!isFinite(qty) || qty < 0) qty = 0;
        if (sku && sku.shipAmount != null && sku.shipAmount !== '') {
            var shipCents = centsOf(sku.shipAmount);
            var unit = qty > 0 ? Math.round(shipCents / qty) : 0;
            return {
                code: sku.code || '',
                name: sku.name || '',
                qty: qty,
                salePrice: fromCents(unit),
                amount: fromCents(shipCents)
            };
        }
        var originCents = centsOf(sku && sku.salePrice);
        return {
            code: sku && sku.code || '',
            name: sku && sku.name || '',
            qty: qty,
            salePrice: fromCents(originCents),
            amount: fromCents(originCents * qty)
        };
    }

    /* 服务费是商品明细中的一行，不是单据字段。数量按 1，售价即这笔差额。 */
    function feeLine(cents, name) {
        var amount = fromCents(Math.max(0, cents || 0));
        return { code: '', name: name || '服务费', qty: 1, salePrice: amount, amount: amount, fee: true };
    }

    function feeCentsOf(skus, mode, rates) {
        var total = 0;
        (skus || []).forEach(function (sku) {
            if (sku && sku.shipAmount != null && sku.shipAmount !== '') {
                var originTotal = centsOf(sku.shipAmount);
                var traderTotal = rates ? ratedUnitCents(originTotal, rates.trader) : originTotal;
                var storeTotal = rates ? ratedUnitCents(originTotal, rates.store) : originTotal;
                var shippedFee = 0;
                if (mode === 'trader') shippedFee = traderTotal - originTotal;
                if (mode === 'gap') shippedFee = storeTotal - traderTotal;
                if (shippedFee > 0) total += shippedFee;
                return;
            }
            var qty = Number(sku && sku.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            var originCents = centsOf(sku && sku.salePrice);
            var traderUnit = rates ? ratedUnitCents(originCents, rates.trader) : originCents;
            var storeUnit = rates ? ratedUnitCents(originCents, rates.store) : originCents;
            var feeUnit = 0;
            if (mode === 'trader') feeUnit = traderUnit - originCents;
            if (mode === 'gap') feeUnit = storeUnit - traderUnit;
            if (feeUnit > 0) total += feeUnit * qty;
        });
        return total;
    }

    function buildLines(skus, mode, rates, feeCents) {
        if (mode === 'gap') return [feeLine(feeCents != null ? feeCents : feeCentsOf(skus, 'gap', rates))];
        var lines = (skus || []).map(goodsLine);
        if (mode === 'trader') lines.push(feeLine(feeCents != null ? feeCents : feeCentsOf(skus, 'trader', rates)));
        return lines;
    }

    /* 服务费只按需求单商品金额计算，多发不加大这笔服务费。 */
    function feeOnGoods(demand, mode, rates) {
        var origin = centsOf(demand && demand.goodsAmount);
        var traderTotal = rates ? ratedUnitCents(origin, rates.trader) : origin;
        var storeTotal = rates ? ratedUnitCents(origin, rates.store) : origin;
        var fee = 0;
        if (mode === 'trader') fee = traderTotal - origin;
        if (mode === 'gap') fee = storeTotal - traderTotal;
        return fee > 0 ? fee : 0;
    }

    function partyFields(storeCode, storeName, payorName, shipperName) {
        return {
            payorName: payorName,
            receiveCode: storeCode || '',
            receiveName: storeName || '',
            shipperName: shipperName || ''
        };
    }

    function makeDoc(spec, lines) {
        return {
            code: spec.code,
            kind: 'trade',
            docType: spec.docType,
            demandCode: spec.demandCode,
            storeCode: spec.storeCode,
            storeName: spec.storeName,
            traderName: spec.traderName,
            buyerCode: spec.buyerCode || '',
            buyerName: spec.buyerName,
            sellerCode: spec.sellerCode || '',
            sellerName: spec.sellerName,
            payorName: spec.payorName,
            receiveCode: spec.receiveCode || '',
            receiveName: spec.receiveName || '',
            shipperName: spec.shipperName || '',
            goodsAmount: sumField(lines.filter(function (line) { return !isFeeLine(line); }), 'amount'),
            amount: sumField(lines, 'amount'),
            status: '已完成',
            lines: lines,
            createdAt: spec.createdAt,
            creator: spec.creator
        };
    }

    function canGenerate(demand) {
        return !!(demand && (demand.status === '门店付款中' || demand.status === '已完成') && demand.traderName);
    }

    function docsOf(store, demandCode) {
        var found = { up: null, down: null, fee: null };
        (store.trades || []).forEach(function (row) {
            if (!row || row.demandCode !== demandCode) return;
            if (row.docType === DOC_UP) found.up = row;
            if (row.docType === DOC_DOWN) found.down = row;
            if (row.docType === DOC_FEE) found.fee = row;
        });
        return found;
    }

    function hasSet(found) {
        return !!(found && found.up && found.down && found.fee);
    }

    function buildSet(demand, operator, store) {
        var codes = nextCodes(store);
        var when = demand.updatedAt || nowText();
        var who = operator || demand.updater || '王丽';
        var traderName = demand.traderName || '接单贸易商';
        var storeName = demand.storeName || '需求门店';
        var storeCode = demand.storeCode || '';
        var rates = window.RbtDemandData && typeof window.RbtDemandData.settlementRates === 'function'
            ? window.RbtDemandData.settlementRates(demand)
            : null;
        var base = {
            demandCode: demand.code,
            storeCode: storeCode,
            storeName: storeName,
            traderName: traderName,
            createdAt: when,
            creator: who
        };
        var sourceSkus = demand.shipSkus && demand.shipSkus.length ? demand.shipSkus : demand.skus;
        var upParties = partyFields(storeCode, storeName, traderName, LF_SUPPLY.name);
        var downParties = partyFields(storeCode, storeName, storeName, LF_SUPPLY.name);
        var feeParties = partyFields(storeCode, storeName, traderName, '');
        var pack = window.RbtDemandData && typeof window.RbtDemandData.deductSettlement === 'function'
            ? window.RbtDemandData.deductSettlement(demand)
            : null;
        var storePay = pack && pack.storePay ? centsOf(pack.storePay) : 0;
        var goods = centsOf(demand.goodsAmount);
        var downFee = storePay > goods ? storePay - goods : feeOnGoods(demand, 'trader', rates);
        var feeLines = [];
        if (pack && pack.storePay) {
            var providerPay = centsOf(pack.provider);
            if (providerPay > 0) feeLines.push(feeLine(providerPay, '服务商实收'));
            feeLines.push(feeLine(centsOf(pack.lengfeng), '冷丰实收'));
        } else {
            feeLines = buildLines(sourceSkus, 'gap', rates, feeOnGoods(demand, 'gap', rates));
        }
        return {
            up: makeDoc(Object.assign({}, base, upParties, {
                code: codes.up,
                docType: DOC_UP,
                buyerName: traderName,
                sellerCode: LF_SUPPLY.code,
                sellerName: LF_SUPPLY.name
            }), buildLines(sourceSkus, 'origin', rates)),
            down: makeDoc(Object.assign({}, base, downParties, {
                code: codes.down,
                docType: DOC_DOWN,
                buyerCode: storeCode,
                buyerName: storeName,
                sellerName: traderName
            }), buildLines(sourceSkus, 'trader', rates, downFee)),
            fee: makeDoc(Object.assign({}, base, feeParties, {
                code: codes.fee,
                docType: DOC_FEE,
                buyerName: traderName,
                sellerCode: LF_SUPPLY.code,
                sellerName: LF_SUPPLY.name
            }), feeLines)
        };
    }

    function ensureForDemand(demand, operator) {
        if (!canGenerate(demand)) return null;
        var store = readStore();
        var found = docsOf(store, demand.code);
        if (hasSet(found)) return { created: false, demandCode: demand.code, set: found };
        var set = buildSet(demand, operator, store);
        store.trades.push(set.up, set.down, set.fee);
        writeStore(store);
        return { created: true, demandCode: demand.code, set: set };
    }

    function ensureForPassedDemands(demands) {
        var created = [];
        (demands || []).forEach(function (demand) {
            var result = ensureForDemand(demand);
            if (result && result.created) created.push(result);
        });
        return created;
    }

    function sortRows(rows) {
        return (rows || []).slice().sort(function (a, b) {
            var ta = String((a && a.createdAt) || '');
            var tb = String((b && b.createdAt) || '');
            if (ta !== tb) return ta < tb ? 1 : -1;
            return String((b && b.code) || '').localeCompare(String((a && a.code) || ''));
        });
    }

    function qtyKey(qty) {
        var num = Number(qty);
        return isFinite(num) ? String(num) : '';
    }

    function linesSignature(lines) {
        return (lines || []).map(function (line) {
            return [
                String(line && line.code || ''),
                String(line && line.name || ''),
                qtyKey(line && line.qty),
                fromCents(centsOf(line && line.salePrice)),
                fromCents(centsOf(line && line.amount))
            ].join('|');
        }).join('\n');
    }

    function sameLines(left, right) {
        return linesSignature(left) === linesSignature(right);
    }

    /* 需求单改成开业费用后，清掉已不存在的单、旧食品明细，以及和当前发货/商品不一致的三张交易单。 */
    function replaceStaleTrades(demands) {
        var store = readStore();
        var generatable = {};
        (demands || []).forEach(function (item) {
            if (canGenerate(item)) generatable[item.code] = item;
        });
        var drop = {};
        (store.trades || []).forEach(function (row) {
            if (!row) return;
            var demand = generatable[row.demandCode];
            var legacy = (row.lines || []).some(function (line) {
                return line && /^SKU100/.test(String(line.code || ''));
            });
            if (!demand || legacy) drop[row.demandCode || row.code] = true;
        });
        Object.keys(generatable).forEach(function (code) {
            if (drop[code]) return;
            var found = docsOf(store, code);
            if (!hasSet(found)) {
                if (found.up || found.down || found.fee) drop[code] = true;
                return;
            }
            var fresh = buildSet(generatable[code], '', { trades: store.trades });
            if (!sameLines(found.up.lines, fresh.up.lines) ||
                !sameLines(found.down.lines, fresh.down.lines) ||
                !sameLines(found.fee.lines, fresh.fee.lines) ||
                found.up.payorName !== fresh.up.payorName ||
                found.down.payorName !== fresh.down.payorName ||
                found.fee.payorName !== fresh.fee.payorName) {
                drop[code] = true;
            }
        });
        var codes = Object.keys(drop);
        if (!codes.length) return;
        store.trades = (store.trades || []).filter(function (row) {
            return row && codes.indexOf(row.demandCode) < 0;
        });
        writeStore(store);
    }

    function currentDemands() {
        var api = window.RbtDemandData;
        return api && typeof api.list === 'function' ? api.list() : [];
    }

    function listTrades() {
        var demands = currentDemands();
        replaceStaleTrades(demands);
        ensureForPassedDemands(demands);
        return sortRows(readStore().trades);
    }

    function getTrade(code) {
        listTrades();
        var found = null;
        readStore().trades.some(function (row) {
            if (row && row.code === code) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function docsOfDemand(demandCode) {
        listTrades();
        var found = docsOf(readStore(), demandCode);
        return [found.up, found.down, found.fee].filter(Boolean);
    }

    window.RbtTradeDocs = {
        KEY: KEY,
        LF_SUPPLY: LF_SUPPLY,
        DOC_UP: DOC_UP,
        DOC_DOWN: DOC_DOWN,
        DOC_FEE: DOC_FEE,
        listTrades: listTrades,
        getTrade: getTrade,
        getByCode: getTrade,
        docsOfDemand: docsOfDemand,
        ensureForDemand: ensureForDemand,
        ensureForPassedDemands: ensureForPassedDemands
    };
})();
