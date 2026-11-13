/* 需求复核通过后生成的 RBT 采购单、销售单、入库单。方案一：两段买卖各有采购+销售。 */
(function () {
    var KEY = 'rbt_trade_docs_v1';
    var LF_SUPPLY = { code: 'LF-SUPPLY', name: '冷丰供应链' };
    var SALE_LF = '冷丰销售';
    var SALE_TR = '贸易商销售';
    var PO_GY = '供应链采购';
    var PO_MD = '门店采购';

    function centsOf(value) {
        var num = Number(String(value == null ? '' : value).replace(/[¥,\s]/g, ''));
        if (!isFinite(num)) return 0;
        return Math.round(num * 100);
    }

    function fromCents(cents) {
        return (Number(cents || 0) / 100).toFixed(2);
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
        return { sales: [], purchases: [], inbounds: [] };
    }

    function readStore() {
        try {
            var raw = sessionStorage.getItem(KEY);
            if (raw == null) return emptyStore();
            var data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return emptyStore();
            var store = {
                sales: Array.isArray(data.sales) ? data.sales : [],
                purchases: Array.isArray(data.purchases) ? data.purchases : [],
                inbounds: Array.isArray(data.inbounds) ? data.inbounds : []
            };
            var changed = migrateLegacyCodes(store);
            if (enrichTradeDocs(store)) changed = true;
            if (changed) writeStore(store);
            return store;
        } catch (e) {
            return emptyStore();
        }
    }

    function writeStore(store) {
        sessionStorage.setItem(KEY, JSON.stringify(store || emptyStore()));
    }

    function seqOf(demandCode) {
        var digits = String(demandCode || '').replace(/\D/g, '');
        if (!digits) digits = '0';
        return ('00000' + digits).slice(-5);
    }

    function pad5(num) {
        return ('00000' + Number(num || 0)).slice(-5);
    }

    function maxSeq(rows, prefix) {
        var max = 0;
        var re = new RegExp('^' + prefix + '(\\d+)$', 'i');
        (rows || []).forEach(function (row) {
            var matched = String((row && row.code) || '').match(re);
            if (matched) max = Math.max(max, Number(matched[1]));
        });
        return max;
    }

    function codesOf(store, demandCode) {
        var so = maxSeq(store && store.sales, 'SO');
        var po = maxSeq(store && store.purchases, 'PO');
        return {
            lfSale: 'SO' + pad5(so + 1),
            trSale: 'SO' + pad5(so + 2),
            gyPo: 'PO' + pad5(po + 1),
            mdPo: 'PO' + pad5(po + 2),
            inbound: 'IBD' + seqOf(demandCode)
        };
    }

    function isLegacySaleCode(code) {
        return /^(LFXS|MYXS)/i.test(String(code || ''));
    }

    function isLegacyPurchaseCode(code) {
        return /^(GYCG|MDCG)/i.test(String(code || ''));
    }

    function pickType(rows, docType) {
        var found = null;
        (rows || []).some(function (row) {
            if (row && row.docType === docType) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function migrateLegacyCodes(store) {
        var hasLegacy = (store.sales || []).some(function (row) { return isLegacySaleCode(row && row.code); })
            || (store.purchases || []).some(function (row) { return isLegacyPurchaseCode(row && row.code); });
        if (!hasLegacy) return false;
        var groups = {};
        function add(row, bucket) {
            if (!row || !row.demandCode) return;
            if (!groups[row.demandCode]) {
                groups[row.demandCode] = { sales: [], purchases: [], inbounds: [], at: row.createdAt || '' };
            }
            groups[row.demandCode][bucket].push(row);
            if (row.createdAt && (!groups[row.demandCode].at || row.createdAt < groups[row.demandCode].at)) {
                groups[row.demandCode].at = row.createdAt;
            }
        }
        (store.sales || []).forEach(function (row) { add(row, 'sales'); });
        (store.purchases || []).forEach(function (row) { add(row, 'purchases'); });
        (store.inbounds || []).forEach(function (row) { add(row, 'inbounds'); });
        var demandCodes = Object.keys(groups).sort(function (a, b) {
            if (groups[a].at !== groups[b].at) return groups[a].at < groups[b].at ? -1 : 1;
            return a.localeCompare(b);
        });
        var so = 0;
        var po = 0;
        demandCodes.forEach(function (demandCode) {
            var group = groups[demandCode];
            var lfSale = pickType(group.sales, SALE_LF);
            var trSale = pickType(group.sales, SALE_TR);
            var gyPo = pickType(group.purchases, PO_GY);
            var mdPo = pickType(group.purchases, PO_MD);
            var inbound = group.inbounds[0] || null;
            if (lfSale) {
                so += 1;
                lfSale.code = 'SO' + pad5(so);
            }
            if (trSale) {
                so += 1;
                trSale.code = 'SO' + pad5(so);
            }
            if (gyPo) {
                po += 1;
                gyPo.code = 'PO' + pad5(po);
            }
            if (mdPo) {
                po += 1;
                mdPo.code = 'PO' + pad5(po);
            }
            if (lfSale && gyPo) {
                lfSale.peerCode = gyPo.code;
                gyPo.peerCode = lfSale.code;
            }
            if (trSale && mdPo) {
                trSale.peerCode = mdPo.code;
                mdPo.peerCode = trSale.code;
            }
            if (inbound && mdPo) {
                inbound.sourceCode = mdPo.code;
                mdPo.inboundCode = inbound.code;
                if (trSale) trSale.inboundCode = inbound.code;
            }
        });
        return true;
    }

    function inboundFinished(store, demandCode) {
        var done = false;
        (store && store.inbounds || []).some(function (row) {
            if (row && row.demandCode === demandCode && row.status === '已完成') {
                done = true;
                return true;
            }
            return false;
        });
        return done;
    }

    function setField(row, key, value) {
        if (!row) return false;
        if (row[key] === value) return false;
        row[key] = value;
        return true;
    }

    function enrichTradeDoc(row, received) {
        if (!row || row.kind === 'inbound') return false;
        var storeName = row.storeName || row.receiveName || '';
        var storeCode = row.storeCode || row.receiveCode || '';
        var traderName = row.traderName || '';
        var payor = (row.docType === SALE_LF || row.docType === PO_GY)
            ? (traderName || row.buyerName || '')
            : (storeName || row.buyerName || '');
        var nextStatus = row.status;
        if (row.docType === SALE_LF || row.docType === PO_GY) {
            nextStatus = '已完成';
        }
        var changed = false;
        if (setField(row, 'payorName', payor)) changed = true;
        if (setField(row, 'receiveCode', storeCode)) changed = true;
        if (setField(row, 'receiveName', storeName)) changed = true;
        if (setField(row, 'shipperName', LF_SUPPLY.name)) changed = true;
        if (setField(row, 'deliveryMode', '采购直送')) changed = true;
        if (nextStatus && setField(row, 'status', nextStatus)) changed = true;
        if (setField(row, 'priceKind', 'goods')) changed = true;
        if (setField(row, 'priceLabel', '商品售价')) changed = true;
        if (repriceLines(row)) changed = true;
        return changed;
    }

    function priceBasisOf(row) {
        if (!row) return 'origin';
        if (row.kind === 'inbound' || row.docType === PO_MD) return 'store';
        if (row.docType === SALE_TR) return 'trader';
        return 'origin';
    }

    function demandRecord(code) {
        if (!code) return null;
        try {
            var raw = sessionStorage.getItem('rbt_h5_fund_demand_v2');
            var parsed = raw ? JSON.parse(raw) : null;
            var rows = parsed && Array.isArray(parsed.rows) ? parsed.rows : (Array.isArray(parsed) ? parsed : []);
            var found = null;
            rows.some(function (row) {
                if (row && row.code === code) {
                    found = row;
                    return true;
                }
                return false;
            });
            return found;
        } catch (error) {
            return null;
        }
    }

    function ratesOf(row) {
        if (!window.RbtDemandData || typeof window.RbtDemandData.settlementRates !== 'function') return null;
        var demand = demandRecord(row && row.demandCode);
        var code = (demand && demand.installmentCode) || (row && row.installmentCode) || '';
        return window.RbtDemandData.settlementRates({ installmentCode: code });
    }

    function rateOfBasis(basis, rates) {
        if (!rates) return '';
        if (basis === 'store') return rates.store || '';
        if (basis === 'trader') return rates.trader || '';
        return '';
    }

    /* 商品售价按系数四舍五入到分。系数为空时保持原始售价。 */
    function ratedUnitCents(originCents, rate) {
        var hundred = Math.round(Number(rate) * 100);
        if (!isFinite(hundred) || hundred <= 0) return originCents;
        return Math.round(originCents * hundred / 100);
    }

    function repriceLines(row) {
        if (!row || !Array.isArray(row.lines) || !row.lines.length) return false;
        var basis = priceBasisOf(row);
        var rate = rateOfBasis(basis, ratesOf(row));
        var changed = false;
        var headerCents = 0;
        var nextLines = row.lines.map(function (line) {
            var qty = Number(line && line.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            var storedOrigin = line && line.originPrice != null && String(line.originPrice).trim() !== '';
            var alreadyRated = row.priceBasis === basis && basis !== 'origin' && !storedOrigin;
            var originCents = storedOrigin || !alreadyRated
                ? centsOf(storedOrigin ? line.originPrice : (line && line.salePrice))
                : null;
            var saleCents = originCents == null ? centsOf(line && line.salePrice) : ratedUnitCents(originCents, rate);
            var amountCents = saleCents * qty;
            headerCents += amountCents;
            var next = {
                code: line && line.code || '',
                name: line && line.name || '',
                qty: qty,
                originPrice: originCents == null ? '' : fromCents(originCents),
                salePrice: fromCents(saleCents),
                amount: fromCents(amountCents)
            };
            if (line && Object.prototype.hasOwnProperty.call(line, 'unitPrice')) changed = true;
            if (!line || line.code !== next.code || line.name !== next.name || Number(line.qty) !== next.qty
                || String(line.originPrice || '') !== next.originPrice
                || line.salePrice !== next.salePrice || line.amount !== next.amount) {
                changed = true;
            }
            return next;
        });
        if (changed) row.lines = nextLines;
        if (setField(row, 'priceBasis', basis)) changed = true;
        if (setField(row, 'amount', fromCents(headerCents))) changed = true;
        return changed;
    }

    function enrichTradeDocs(store) {
        if (!store) return false;
        var changed = false;
        (store.sales || []).forEach(function (row) {
            if (enrichTradeDoc(row, inboundFinished(store, row && row.demandCode))) changed = true;
        });
        (store.purchases || []).forEach(function (row) {
            if (enrichTradeDoc(row, inboundFinished(store, row && row.demandCode))) changed = true;
        });
        (store.inbounds || []).forEach(function (row) {
            if (repriceLines(row)) changed = true;
        });
        return changed;
    }

    function dropshipFields(storeCode, storeName, payorName) {
        return {
            payorName: payorName,
            receiveCode: storeCode || '',
            receiveName: storeName || '',
            shipperName: LF_SUPPLY.name,
            deliveryMode: '采购直送'
        };
    }

    function buildPricedLines(skus, rate) {
        return (skus || []).map(function (sku) {
            var qty = Number(sku && sku.qty);
            if (!isFinite(qty) || qty < 0) qty = 0;
            var originCents = centsOf(sku && sku.salePrice);
            var saleCents = ratedUnitCents(originCents, rate);
            return {
                code: sku && sku.code || '',
                name: sku && sku.name || '',
                qty: qty,
                originPrice: fromCents(originCents),
                salePrice: fromCents(saleCents),
                amount: fromCents(saleCents * qty)
            };
        });
    }

    function linesAmount(lines) {
        return fromCents((lines || []).reduce(function (total, line) {
            return total + centsOf(line && line.amount);
        }, 0));
    }

    function canGenerate(demand) {
        return !!(demand && (demand.status === '支付中' || demand.status === '已完成') && demand.traderName);
    }

    function findByDemand(store, demandCode) {
        var found = { lfSale: null, trSale: null, gyPo: null, mdPo: null, inbound: null };
        if (!demandCode) return found;
        (store.sales || []).forEach(function (row) {
            if (!row || row.demandCode !== demandCode) return;
            if (row.docType === SALE_LF) found.lfSale = row;
            if (row.docType === SALE_TR) found.trSale = row;
        });
        (store.purchases || []).forEach(function (row) {
            if (!row || row.demandCode !== demandCode) return;
            if (row.docType === PO_GY) found.gyPo = row;
            if (row.docType === PO_MD) found.mdPo = row;
        });
        (store.inbounds || []).forEach(function (row) {
            if (row && row.demandCode === demandCode && !found.inbound) found.inbound = row;
        });
        return found;
    }

    function hasSet(found) {
        return !!(found && found.lfSale && found.trSale && found.gyPo && found.mdPo);
    }

    function buildSet(demand, operator, store) {
        var codes = codesOf(store, demand.code);
        var when = demand.updatedAt || nowText();
        var who = operator || demand.updater || '王丽';
        var traderName = demand.traderName || '接单贸易商';
        var storeName = demand.storeName || '需求门店';
        var storeCode = demand.storeCode || '';
        var rates = window.RbtDemandData && typeof window.RbtDemandData.settlementRates === 'function'
            ? window.RbtDemandData.settlementRates(demand)
            : null;
        var originLines = buildPricedLines(demand.skus, '');
        var traderLines = buildPricedLines(demand.skus, rates && rates.trader);
        var storeLines = buildPricedLines(demand.skus, rates && rates.store);
        var inboundLines = buildPricedLines(demand.skus, rates && rates.store);
        var installmentCode = demand.installmentCode || '';
        var lfParties = dropshipFields(storeCode, storeName, traderName);
        var storeParties = dropshipFields(storeCode, storeName, storeName);
        var lfSale = Object.assign({
            code: codes.lfSale,
            kind: 'sales',
            docType: SALE_LF,
            demandCode: demand.code,
            storeCode: storeCode,
            storeName: storeName,
            traderName: traderName,
            buyerCode: '',
            buyerName: traderName,
            sellerCode: LF_SUPPLY.code,
            sellerName: LF_SUPPLY.name,
            installmentCode: installmentCode,
            priceKind: 'goods',
            priceBasis: 'origin',
            priceLabel: '商品售价',
            amount: linesAmount(originLines),
            status: '已完成',
            peerCode: codes.gyPo,
            inboundCode: '',
            lines: originLines,
            createdAt: when,
            creator: who
        }, lfParties);
        var gyPo = Object.assign({
            code: codes.gyPo,
            kind: 'purchase',
            docType: PO_GY,
            demandCode: demand.code,
            storeCode: storeCode,
            storeName: storeName,
            traderName: traderName,
            buyerCode: '',
            buyerName: traderName,
            sellerCode: LF_SUPPLY.code,
            sellerName: LF_SUPPLY.name,
            installmentCode: installmentCode,
            priceKind: 'goods',
            priceBasis: 'origin',
            priceLabel: '商品售价',
            amount: linesAmount(originLines),
            status: '已完成',
            peerCode: codes.lfSale,
            inboundCode: '',
            lines: buildPricedLines(demand.skus, ''),
            createdAt: when,
            creator: who
        }, lfParties);
        var trSale = Object.assign({
            code: codes.trSale,
            kind: 'sales',
            docType: SALE_TR,
            demandCode: demand.code,
            storeCode: storeCode,
            storeName: storeName,
            traderName: traderName,
            buyerCode: storeCode,
            buyerName: storeName,
            sellerCode: '',
            sellerName: traderName,
            installmentCode: installmentCode,
            priceKind: 'goods',
            priceBasis: 'trader',
            priceLabel: '商品售价',
            amount: linesAmount(traderLines),
            status: '待收货',
            peerCode: codes.mdPo,
            inboundCode: codes.inbound,
            lines: traderLines,
            createdAt: when,
            creator: who
        }, storeParties);
        var mdPo = Object.assign({
            code: codes.mdPo,
            kind: 'purchase',
            docType: PO_MD,
            demandCode: demand.code,
            storeCode: storeCode,
            storeName: storeName,
            traderName: traderName,
            buyerCode: storeCode,
            buyerName: storeName,
            sellerCode: '',
            sellerName: traderName,
            installmentCode: installmentCode,
            priceKind: 'goods',
            priceBasis: 'store',
            priceLabel: '商品售价',
            amount: linesAmount(storeLines),
            status: '待收货',
            peerCode: codes.trSale,
            inboundCode: codes.inbound,
            lines: storeLines,
            createdAt: when,
            creator: who
        }, storeParties);
        var inbound = {
            code: codes.inbound,
            kind: 'inbound',
            docType: '采购入库',
            demandCode: demand.code,
            sourceCode: codes.mdPo,
            orderType: '采购入库',
            bizType: '采购直送',
            receivePlace: storeName,
            supplier: traderName,
            buyerName: storeName,
            sellerName: traderName,
            installmentCode: installmentCode,
            priceBasis: 'store',
            amount: linesAmount(inboundLines),
            status: '待收货',
            lines: inboundLines,
            createdAt: when,
            creator: who
        };
        return {
            lfSale: lfSale,
            trSale: trSale,
            gyPo: gyPo,
            mdPo: mdPo,
            inbound: inbound
        };
    }

    function ensureForDemand(demand, operator) {
        if (!canGenerate(demand)) return null;
        var store = readStore();
        var found = findByDemand(store, demand.code);
        if (hasSet(found)) {
            return { created: false, demandCode: demand.code, set: found };
        }
        var set = buildSet(demand, operator, store);
        store.sales.push(set.lfSale, set.trSale);
        store.purchases.push(set.gyPo, set.mdPo);
        store.inbounds.push(set.inbound);
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

    function listSales() {
        if (window.RbtDemandData && typeof window.RbtDemandData.list === 'function') {
            ensureForPassedDemands(window.RbtDemandData.list());
        }
        return sortRows(readStore().sales);
    }

    function listPurchases() {
        if (window.RbtDemandData && typeof window.RbtDemandData.list === 'function') {
            ensureForPassedDemands(window.RbtDemandData.list());
        }
        return sortRows(readStore().purchases);
    }

    function getSale(code) {
        var found = null;
        readStore().sales.some(function (row) {
            if (row && row.code === code) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function getPurchase(code) {
        var found = null;
        readStore().purchases.some(function (row) {
            if (row && row.code === code) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function getInbound(code) {
        var found = null;
        readStore().inbounds.some(function (row) {
            if (row && row.code === code) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function getByCode(code) {
        return getSale(code) || getPurchase(code) || getInbound(code);
    }

    function docsOfDemand(demandCode) {
        var found = findByDemand(readStore(), demandCode);
        var rows = [];
        [found.lfSale, found.gyPo, found.trSale, found.mdPo].forEach(function (row) {
            if (row) rows.push(row);
        });
        return rows;
    }

    window.RbtTradeDocs = {
        KEY: KEY,
        LF_SUPPLY: LF_SUPPLY,
        SALE_LF: SALE_LF,
        SALE_TR: SALE_TR,
        PO_GY: PO_GY,
        PO_MD: PO_MD,
        listSales: listSales,
        listPurchases: listPurchases,
        getSale: getSale,
        getPurchase: getPurchase,
        getInbound: getInbound,
        getByCode: getByCode,
        docsOfDemand: docsOfDemand,
        ensureForDemand: ensureForDemand,
        ensureForPassedDemands: ensureForPassedDemands
    };
})();
