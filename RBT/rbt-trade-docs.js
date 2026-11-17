/* 贸易商付款完成、进入门店付款中后生成三张交易单，不再生成采购单、销售单和入库单。 */
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
        return !!(line && line.name === '服务费');
    }

    function goodsLine(sku) {
        var qty = Number(sku && sku.qty);
        if (!isFinite(qty) || qty < 0) qty = 0;
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
    function feeLine(cents) {
        var amount = fromCents(cents);
        return { code: '', name: '服务费', qty: 1, salePrice: amount, amount: amount };
    }

    function feeCentsOf(skus, mode, rates) {
        var total = 0;
        (skus || []).forEach(function (sku) {
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

    function buildLines(skus, mode, rates) {
        if (mode === 'gap') return [feeLine(feeCentsOf(skus, 'gap', rates))];
        var lines = (skus || []).map(goodsLine);
        if (mode === 'trader') lines.push(feeLine(feeCentsOf(skus, 'trader', rates)));
        return lines;
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
        var upParties = partyFields(storeCode, storeName, traderName, LF_SUPPLY.name);
        var downParties = partyFields(storeCode, storeName, storeName, LF_SUPPLY.name);
        var feeParties = partyFields(storeCode, storeName, storeName, '');
        return {
            up: makeDoc(Object.assign({}, base, upParties, {
                code: codes.up,
                docType: DOC_UP,
                buyerName: traderName,
                sellerCode: LF_SUPPLY.code,
                sellerName: LF_SUPPLY.name
            }), buildLines(demand.skus, 'origin', rates)),
            down: makeDoc(Object.assign({}, base, downParties, {
                code: codes.down,
                docType: DOC_DOWN,
                buyerCode: storeCode,
                buyerName: storeName,
                sellerName: traderName
            }), buildLines(demand.skus, 'trader', rates)),
            fee: makeDoc(Object.assign({}, base, feeParties, {
                code: codes.fee,
                docType: DOC_FEE,
                buyerCode: storeCode,
                buyerName: storeName,
                sellerCode: LF_SUPPLY.code,
                sellerName: LF_SUPPLY.name
            }), buildLines(demand.skus, 'gap', rates))
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

    function listTrades() {
        if (window.RbtDemandData && typeof window.RbtDemandData.list === 'function') {
            ensureForPassedDemands(window.RbtDemandData.list());
        }
        return sortRows(readStore().trades);
    }

    function getTrade(code) {
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
