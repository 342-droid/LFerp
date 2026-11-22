/* 每日履行：应履行 = 所得佣金 × 该渠道结算比例。所得佣金是当日已发生的门店佣金。不叫还款，不拆总金额，不预造未发生的日期。 */
(function (global) {
    var FACTS = [
        { date: '2026-11-07', channel: 'POS', turnover: 860 },
        { date: '2026-11-08', channel: '直播', turnover: 420 },
        { date: '2026-11-09', channel: '商城', turnover: 310 },
        { date: '2026-11-10', channel: 'POS', turnover: 980 },
        { date: '2026-11-11', channel: '直播', turnover: 560 },
        { date: '2026-11-12', channel: '商城', turnover: 240 }
    ];
    /* 演示：所得佣金 = 当日营业流水 × 10%，与门店佣金明细里常见的门店佣金比例一致。 */
    var COMMISSION_RATE = 0.1;
    /* 每日履行从营业收入里扣，支付方式固定为这一句。计算来源仍说明金额怎么算，不改成支付方式。 */
    var AUTO_PAY_METHOD = '营业收入自动扣款';

    function phaseLabel(status) {
        if (status === '还款中') return '履约中';
        return status || '—';
    }

    /* 手动履约按笔记录。不再读旧的汇总金额，那笔汇总会把两张原型需求都结成已完成。 */
    var MANUAL_ROW_KEY = 'rbt_h5_store_manual_rows_v1';
    var SETTLED_KEY = 'rbt_fulfill_settled_v1';

    function readJson(key) {
        try {
            var raw = global.localStorage.getItem(key);
            var map = raw ? JSON.parse(raw) : {};
            return map && typeof map === 'object' ? map : {};
        } catch (e) {
            return {};
        }
    }

    function amountOf(value) {
        var num = Number(String(value == null ? '' : value).replace(/,/g, '').replace(/^¥/, ''));
        return isFinite(num) ? num : 0;
    }

    function manualKey(storeCode, code) {
        return String(storeCode || '') + '|' + String(code || '');
    }

    /* 门店原型固定带一笔已支付成功的一键履约，每日履行打开就能看到。已有手动记录时不重复补。 */
    var DEMO_MANUAL = {
        storeCode: 'ONS00001',
        code: 'XQ00024',
        at: '2026-11-23 09:18:26',
        cents: 10000,
        channel: '支付宝'
    };

    function ensureDemoManual() {
        var map = readJson(MANUAL_ROW_KEY);
        var key = manualKey(DEMO_MANUAL.storeCode, DEMO_MANUAL.code);
        var list = Array.isArray(map[key]) ? map[key].filter(Boolean) : [];
        if (list.length) return;
        map[key] = [{
            at: DEMO_MANUAL.at,
            cents: DEMO_MANUAL.cents,
            channel: DEMO_MANUAL.channel
        }];
        try { global.localStorage.setItem(MANUAL_ROW_KEY, JSON.stringify(map)); } catch (e) {}
    }

    function manualRowsOf(storeCode, code) {
        ensureDemoManual();
        var list = readJson(MANUAL_ROW_KEY)[manualKey(storeCode, code)];
        return Array.isArray(list) ? list.filter(Boolean) : [];
    }

    function manualCents(storeCode, code) {
        return manualRowsOf(storeCode, code).reduce(function (sum, row) {
            var cents = Math.round(Number(row && row.cents));
            return sum + (isFinite(cents) ? cents : 0);
        }, 0);
    }

    function appendManual(storeCode, code, record) {
        if (!code || !record) return;
        var cents = Math.round(Number(record.cents));
        if (!isFinite(cents) || cents <= 0) return;
        var map = readJson(MANUAL_ROW_KEY);
        var key = manualKey(storeCode, code);
        var list = Array.isArray(map[key]) ? map[key].slice() : [];
        list.push({
            at: record.at || '',
            cents: cents,
            channel: record.channel || '支付宝'
        });
        map[key] = list;
        try { global.localStorage.setItem(MANUAL_ROW_KEY, JSON.stringify(map)); } catch (e) {}
    }

    function manualLedgerRows(item) {
        if (!item) return [];
        return manualRowsOf(item.storeCode, item.code).map(function (row, index) {
            var cents = Math.round(Number(row.cents)) || 0;
            var amount = (cents / 100).toFixed(2);
            return {
                id: item.code + ':manual:' + index + ':' + (row.at || ''),
                date: String(row.at || '').slice(0, 10),
                time: row.at || '',
                storeCode: item.storeCode || '',
                storeName: item.storeName || '',
                demandCode: item.code,
                channel: '手动履约',
                turnover: '',
                commission: '',
                ratio: '—',
                due: amount,
                actual: amount,
                payMethod: row.channel || '支付宝',
                source: '手动履约',
                kind: 'manual'
            };
        });
    }

    function isSettled(code) {
        return !!readJson(SETTLED_KEY)[code];
    }

    function markSettled(code, done) {
        if (!code) return;
        var map = readJson(SETTLED_KEY);
        var next = !!done;
        if (!!map[code] === next) return;
        if (next) map[code] = 1;
        else delete map[code];
        try { global.localStorage.setItem(SETTLED_KEY, JSON.stringify(map)); } catch (e) {}
    }

    /* 剩余履行额为 0，或门店端已把这笔结清：履约阶段为已完成。 */
    function phaseOf(item, remain) {
        if (!item) return '—';
        if (item.status === '已完成') return '已完成';
        if (item.status === '还款中') {
            if (remain != null && amountOf(remain) <= 0) return '已完成';
            if ((remain == null || amountOf(remain) <= 0) && isSettled(item.code)) return '已完成';
            return '履约中';
        }
        return phaseLabel(item.status);
    }

    /* 已履行加上门店手动支付。结清后剩余履行额为 0，已履行金额等于总金额。 */
    function performanceFact(item, fact) {
        var base = fact || {};
        var total = amountOf(item && item.amount);
        var actual = amountOf(base.actual);
        var gap = Math.max(0, Math.round((total - actual) * 100) / 100);
        if (item && isSettled(item.code) && gap > 0) markSettled(item.code, false);
        var settled = !!(item && (item.status === '已完成' || gap <= 0));
        if (settled) {
            return {
                due: base.due || '0.00',
                actual: money(total),
                gap: '0.00',
                progress: '—',
                grade: '—',
                phase: '已完成'
            };
        }
        return {
            due: base.due || '0.00',
            actual: money(actual),
            gap: money(gap),
            progress: base.progress || '—',
            grade: base.grade || '—',
            phase: phaseLabel(item && item.status)
        };
    }

    function inPerformance(status) {
        return status === '还款中' || status === '已完成';
    }

    function money(value) {
        var num = Number(value);
        if (!isFinite(num)) return '—';
        return num.toFixed(2);
    }

    function channelRatio(item, channel) {
        var list = (item && item.settleRatios) || [];
        var fallback = 0;
        var i;
        for (i = 0; i < list.length; i++) {
            var value = Number(String(list[i].fallback || '').replace('%', ''));
            if (!isFinite(value) || value <= 0) continue;
            if (!fallback) fallback = value;
            if (list[i].channel === channel) return value;
        }
        return fallback || 10;
    }

    /* 同一门店两张需求单用单号错开流水，避免两行数字完全一样。 */
    function scaleOf(code) {
        var text = String(code || '');
        var n = 0;
        var i;
        for (i = 0; i < text.length; i++) n += text.charCodeAt(i);
        return 0.82 + (n % 6) * 0.06;
    }

    function daysOf(item) {
        if (!item || (item.status !== '还款中' && item.status !== '已完成') || item.repayMethod !== '比例付') return [];
        var scale = scaleOf(item.code);
        var auto = FACTS.map(function (fact) {
            var turnover = Math.round(fact.turnover * scale * 100) / 100;
            var commission = Math.round(turnover * COMMISSION_RATE * 100) / 100;
            var ratio = channelRatio(item, fact.channel);
            var due = Math.round(commission * ratio) / 100;
            return {
                id: item.code + ':' + fact.date + ':' + fact.channel,
                date: fact.date,
                storeCode: item.storeCode || '',
                storeName: item.storeName || '',
                demandCode: item.code,
                channel: fact.channel,
                turnover: money(turnover),
                commission: money(commission),
                ratio: ratio.toFixed(2) + '%',
                due: money(due),
                actual: money(due),
                payMethod: AUTO_PAY_METHOD,
                source: '获准营业事实'
            };
        });
        return auto.concat(manualLedgerRows(item));
    }

    function rows(onlyActive) {
        var api = global.RbtDemandData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var out = [];
        list.forEach(function (item) {
            if (!item) return;
            if (onlyActive && item.status !== '还款中') return;
            if (!onlyActive && !inPerformance(item.status)) return;
            daysOf(item).forEach(function (row) { out.push(row); });
        });
        out.sort(function (a, b) {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            if (a.storeName !== b.storeName) return a.storeName < b.storeName ? -1 : 1;
            return a.demandCode < b.demandCode ? -1 : 1;
        });
        return out;
    }

    function sumDue(list) {
        return (list || []).reduce(function (total, row) {
            return total + Number(row.due || 0);
        }, 0);
    }

    function cents(value) {
        var num = Number(value);
        if (!isFinite(num)) return 0;
        return Math.round(num * 100);
    }

    /* 当日实际履行按贸易商、冷丰、服务商应收占比拆成三方收款。各日之和等于履约详情里的已结款，一行三笔之和等于当日实际履行。 */
    function payeeSplit(item) {
        /* 一键履约是门店另付的履行额，不按营业流水拆给贸易商。 */
        var days = daysOf(item).filter(function (row) { return row.kind !== 'manual'; });
        var keys = ['trader', 'lengfeng', 'provider'];
        var api = global.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var weights = {};
        var weightTotal = 0;
        keys.forEach(function (key) {
            weights[key] = Math.max(0, cents(pack && pack[key]));
            weightTotal += weights[key];
        });
        var actuals = days.map(function (row) { return Math.max(0, cents(row.actual)); });
        var pool = actuals.reduce(function (sum, value) { return sum + value; }, 0);
        var shares = { trader: 0, lengfeng: 0, provider: 0 };
        if (weightTotal && pool) {
            var largest = keys[0];
            keys.forEach(function (key) {
                if (weights[key] >= weights[largest]) largest = key;
            });
            var used = 0;
            keys.forEach(function (key) {
                if (key === largest) return;
                shares[key] = Math.floor(pool * weights[key] / weightTotal);
                used += shares[key];
            });
            shares[largest] = pool - used;
        }
        var remaining = { trader: shares.trader, lengfeng: shares.lengfeng, provider: shares.provider };
        return days.map(function (row, index) {
            var actual = actuals[index];
            var parts = { trader: 0, lengfeng: 0, provider: 0 };
            if (weightTotal && pool && index === days.length - 1) {
                keys.forEach(function (key) { parts[key] = remaining[key]; });
            } else if (weightTotal && pool) {
                var assigned = 0;
                keys.forEach(function (key) {
                    var raw = Math.floor(actual * shares[key] / pool);
                    if (raw > remaining[key]) raw = remaining[key];
                    parts[key] = raw;
                    assigned += raw;
                });
                var short = actual - assigned;
                var order = keys.slice().sort(function (a, b) {
                    return shares[b] - shares[a] || weights[b] - weights[a];
                });
                var guard = 0;
                while (short > 0 && guard < actual + 5) {
                    var progressed = false;
                    var i;
                    for (i = 0; i < order.length && short > 0; i++) {
                        var key = order[i];
                        if (remaining[key] - parts[key] <= 0) continue;
                        parts[key] += 1;
                        short -= 1;
                        progressed = true;
                    }
                    guard += 1;
                    if (!progressed) break;
                }
                keys.forEach(function (key) { remaining[key] -= parts[key]; });
            }
            return {
                id: row.id,
                date: row.date,
                channel: row.channel,
                trader: (parts.trader / 100).toFixed(2),
                lengfeng: (parts.lengfeng / 100).toFixed(2),
                provider: (parts.provider / 100).toFixed(2)
            };
        });
    }

    /* 履行明细：一行是一天、一个渠道，结款是当日实际履行拆给贸易商、冷丰、服务商的金额。 */
    function detailRows() {
        var api = global.RbtDemandData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var out = [];
        list.forEach(function (item) {
            if (!item || !inPerformance(item.status)) return;
            var shares = {};
            payeeSplit(item).forEach(function (share) {
                shares[share.id || (share.date + ':' + share.channel)] = share;
            });
            daysOf(item).forEach(function (row) {
                var share = shares[row.id] || shares[row.date + ':' + row.channel] || { trader: '0.00', lengfeng: '0.00', provider: '0.00' };
                out.push({
                    id: row.id,
                    date: row.date,
                    storeCode: row.storeCode,
                    storeName: row.storeName,
                    demandCode: row.demandCode,
                    channel: row.channel,
                    traderName: item.traderName || '',
                    traderPay: share.trader,
                    lengfengPay: share.lengfeng,
                    providerName: item.providerName || '',
                    providerPay: share.provider
                });
            });
        });
        out.sort(function (a, b) {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            if (a.storeName !== b.storeName) return a.storeName < b.storeName ? -1 : 1;
            if (a.demandCode !== b.demandCode) return a.demandCode < b.demandCode ? -1 : 1;
            return a.channel < b.channel ? -1 : 1;
        });
        return out;
    }

    global.RbtDailyFulfill = {
        autoPayMethod: AUTO_PAY_METHOD,
        manualCents: manualCents,
        manualRows: manualLedgerRows,
        appendManual: appendManual,
        phaseLabel: phaseLabel,
        phaseOf: phaseOf,
        isSettled: isSettled,
        markSettled: markSettled,
        performanceFact: performanceFact,
        inPerformance: inPerformance,
        money: money,
        daysOf: daysOf,
        rows: rows,
        detailRows: detailRows,
        sumDue: sumDue,
        payeeSplit: payeeSplit
    };
})(window);
