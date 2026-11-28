/* 每日付款：商城、直播应付 = 已入账佣金 × 结算比例。POS 应付 =（经营流水 − 平台服务费）× 结算比例。
   扣率：门店按日只还给贸易商。平台服务费、服务商服务费在贸易商划转时一次结清，不从每日付款里拆。 */
(function (global) {
    var SPAN_DEMO_FACTS = [
        { date: '2025-12-20', channel: 'POS', turnover: 540 },
        { date: '2025-12-24', channel: '直播', turnover: 360 },
        { date: '2025-12-28', channel: '商城', turnover: 280 },
        { date: '2025-12-31', channel: 'POS', turnover: 610 },
        { date: '2026-01-03', channel: '直播', turnover: 390 },
        { date: '2026-01-08', channel: '商城', turnover: 250 },
        { date: '2026-01-12', channel: 'POS', turnover: 700 },
        { date: '2026-10-22', channel: 'POS', turnover: 640 },
        { date: '2026-10-25', channel: '直播', turnover: 410 },
        { date: '2026-10-28', channel: '商城', turnover: 300 },
        { date: '2026-10-31', channel: 'POS', turnover: 760 }
    ];
    var FACTS = [
        { date: '2026-11-07', channel: 'POS', turnover: 860 },
        { date: '2026-11-08', channel: '直播', turnover: 420 },
        { date: '2026-11-09', channel: '商城', turnover: 310 },
        { date: '2026-11-10', channel: 'POS', turnover: 980 },
        { date: '2026-11-11', channel: '直播', turnover: 560 },
        { date: '2026-11-12', channel: '商城', turnover: 240 },
        /* 签完合同后继续发生的营业日，便于贸易商按时段／单日查看 */
        { date: '2026-11-13', channel: 'POS', turnover: 720 },
        { date: '2026-11-14', channel: '直播', turnover: 380 },
        { date: '2026-11-15', channel: '商城', turnover: 290 },
        { date: '2026-11-16', channel: 'POS', turnover: 850 },
        { date: '2026-11-18', channel: '直播', turnover: 410 },
        { date: '2026-11-20', channel: '商城', turnover: 265 },
        { date: '2026-11-22', channel: 'POS', turnover: 690 }
    ];
    /* 演示：商城、直播已入账佣金 = 当日营业流水 × 10%。POS 平台服务费同样按经营流水的 10% 扣除。 */
    var COMMISSION_RATE = 0.1;
    var POS_PLATFORM_FEE_RATE = 0.1;
    /* 每日付款从营业收入里扣，支付方式固定为这一句。计算来源仍说明金额怎么算，不改成支付方式。 */
    var AUTO_PAY_METHOD = '营业收入自动扣款';

    function phaseLabel(status) {
        if (status === '门店付款中' || status === '还款中') return '付款中';
        return status || '—';
    }

    /* 手动付款按笔记录。不再读旧的汇总金额，那笔汇总会把两张原型需求都结成已完成。 */
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

    /* 一笔提交汇付失败的手动付款。付款子单已经生成，钱没有划出，不进已付款。 */
    var DEMO_FAILED = {
        code: 'XQ00023',
        at: '2026-11-23 10:06:18',
        cents: 5000,
        channel: '支付宝'
    };

    function failedRows(item) {
        if (!item || item.code !== DEMO_FAILED.code) return [];
        var amount = (DEMO_FAILED.cents / 100).toFixed(2);
        return [{
            id: item.code + ':zfail:huifu',
            date: String(DEMO_FAILED.at).slice(0, 10),
            time: DEMO_FAILED.at,
            storeCode: item.storeCode || '',
            storeName: item.storeName || '',
            demandCode: item.code,
            channel: '手动付款',
            kind: 'manual',
            turnover: '',
            commission: '',
            ratio: '',
            due: amount,
            actual: '',
            payMethod: DEMO_FAILED.channel,
            source: '手动付款',
            fundStatus: 'failed',
            traderName: item.traderName || ''
        }];
    }

    /* 门店原型固定带一笔已支付成功的提前支付，每日付款打开就能看到。按支付时间认这笔，不重复补。 */
    var DEMO_MANUAL = {
        storeCode: 'ONS00001',
        code: 'XQ00023',
        at: '2026-11-23 09:18:26',
        cents: 10000,
        channel: '支付宝'
    };

    function ensureDemoManual() {
        var map = readJson(MANUAL_ROW_KEY);
        var key = manualKey(DEMO_MANUAL.storeCode, DEMO_MANUAL.code);
        var list = Array.isArray(map[key]) ? map[key].filter(Boolean) : [];
        var has = list.some(function (row) {
            return row && row.at === DEMO_MANUAL.at && Math.round(Number(row.cents)) === DEMO_MANUAL.cents;
        });
        if (has) return;
        list.push({
            at: DEMO_MANUAL.at,
            cents: DEMO_MANUAL.cents,
            channel: DEMO_MANUAL.channel
        });
        map[key] = list;
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
                channel: '手动付款',
                turnover: '',
                commission: '',
                ratio: '—',
                due: amount,
                actual: amount,
                payMethod: row.channel || '支付宝',
                source: '手动付款',
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

    /* 剩余付款额为 0，或门店端已把这笔结清：付款阶段为已完成。 */
    function phaseOf(item, remain) {
        if (!item) return '—';
        if (item.status === '已完成') return '已完成';
        if (item.status === '门店付款中' || item.status === '还款中') {
            if (remain != null && amountOf(remain) <= 0) return '已完成';
            if ((remain == null || amountOf(remain) <= 0) && isSettled(item.code)) return '已完成';
            return '付款中';
        }
        return phaseLabel(item.status);
    }

    /* 已付款加上门店手动支付。结清后剩余付款额为 0，已付款金额等于总金额。 */
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
                baseline: '—',
                grade: '—',
                phase: '已完成'
            };
        }
        return {
            due: base.due || '0.00',
            actual: money(actual),
            gap: money(gap),
            progress: base.progress || '—',
            baseline: base.baseline || '—',
            grade: base.grade || '—',
            phase: phaseLabel(item && item.status)
        };
    }

    function inPerformance(status) {
        return status === '门店付款中' || status === '还款中' || status === '已完成';
    }

    function money(value) {
        var num = Number(value);
        if (!isFinite(num)) return '—';
        return num.toFixed(2);
    }

    /* 没改过比例时整单用当前配置。改过之后，生效日之前的子单用旧配置，生效日起用新配置。 */
    function ratiosForDate(item, date) {
        var versions = item && item.settleRatioVersions;
        if (!Array.isArray(versions) || !versions.length) return item && item.settleRatios;
        var chosen = versions[0];
        versions.forEach(function (version) {
            if (!version) return;
            var from = version.effectiveFrom || '';
            if (!from || String(date || '') >= from) chosen = version;
        });
        return (chosen && chosen.ratios) || (item && item.settleRatios);
    }

    function channelRatio(item, channel, date) {
        var list = (date ? ratiosForDate(item, date) : (item && item.settleRatios)) || [];
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

    /* 商城、直播：已入账佣金。POS：经营流水扣除平台服务费。再各自乘渠道结算比例。 */
    function postedBase(channel, turnover) {
        var amount = Number(turnover) || 0;
        if (channel === 'POS') {
            var fee = Math.round(amount * POS_PLATFORM_FEE_RATE * 100) / 100;
            return Math.round((amount - fee) * 100) / 100;
        }
        return Math.round(amount * COMMISSION_RATE * 100) / 100;
    }

    function payableFact(fact) {
        return fact && !fact.missing;
    }

    /* 结款时间取成功凭据上的真实时间。演示按入账日次日生成，时分秒随这笔变化，不固定 08:00。 */
    function settledAt(date, seed) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return '';
        var day = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(day.getTime())) return '';
        day.setDate(day.getDate() + 1);
        var text = String(seed || date);
        var x = 2166136261;
        var i;
        for (i = 0; i < text.length; i++) {
            x ^= text.charCodeAt(i);
            x = Math.imul(x, 16777619);
        }
        x = x >>> 0;
        var hour = 9 + (x % 10);
        var minute = (x >>> 8) % 60;
        var second = (x >>> 16) % 60;
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return day.getFullYear() + '-' + pad(day.getMonth() + 1) + '-' + pad(day.getDate()) +
            ' ' + pad(hour) + ':' + pad(minute) + ':' + pad(second);
    }

    /* 最近一个入账日已日切冻结，次日批次还没到账，不能记成已付款，也不能当成 0 元未付款。 */
    function daysOf(item) {
        if (!item || (item.status !== '门店付款中' && item.status !== '还款中' && item.status !== '已完成') || item.repayMethod !== '比例付') return [];
        var scale = scaleOf(item.code);
        var facts = FACTS;
        if (item.code === 'XQ00024') {
            var start = String(item.paidAt || item.createdAt || '').slice(0, 10);
            var end = item.status === '已完成' ? String(item.updatedAt || '').slice(0, 10) : '';
            facts = SPAN_DEMO_FACTS.concat(FACTS).filter(function (fact) {
                return (!start || fact.date >= start) && (!end || fact.date <= end);
            });
        }
        /* 已完成的原型单只保留结清日之前的营业日，避免把后续付款中的流水算进来。 */
        if (item.code === 'XQ00027') {
            var doneOn = String(item.updatedAt || '').slice(0, 10);
            facts = FACTS.filter(function (fact) {
                return fact && (!doneOn || fact.date <= doneOn);
            });
        }
        facts = facts.filter(payableFact);
        var latest = '';
        facts.forEach(function (fact) {
            if (fact.date > latest) latest = fact.date;
        });
        var auto = facts.map(function (fact) {
            var turnover = Math.round(fact.turnover * scale * 100) / 100;
            var commission = postedBase(fact.channel, turnover);
            var ratio = channelRatio(item, fact.channel, fact.date);
            var due = Math.round(commission * ratio) / 100;
            /* 需求已完成时，结清日前的批次都已到账，不再留一个在途日。 */
            var inflight = item.status !== '已完成' && fact.date === latest;
            return {
                id: item.code + ':' + fact.date + ':' + fact.channel,
                date: fact.date,
                postDate: fact.postDate || fact.date,
                storeCode: item.storeCode || '',
                storeName: item.storeName || '',
                demandCode: item.code,
                channel: fact.channel,
                turnover: money(turnover),
                commission: money(commission),
                ratio: ratio.toFixed(2) + '%',
                due: money(due),
                actual: inflight ? '' : money(due),
                time: inflight ? '' : settledAt(fact.date, item.code + ':' + fact.date),
                fundStatus: inflight ? 'inflight' : 'arrived',
                payMethod: AUTO_PAY_METHOD,
                source: '获准营业事实'
            };
        });
        return auto.concat(manualLedgerRows(item).map(function (row) {
            row.fundStatus = 'arrived';
            return row;
        }));
    }

    function rows(onlyActive) {
        var api = global.RbtDemandData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var out = [];
        list.forEach(function (item) {
            if (!item) return;
            if (onlyActive && item.status !== '门店付款中' && item.status !== '还款中') return;
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

    /* 扣率之后，每日付款整笔记给贸易商。平台服务费、服务商服务费不从这一笔里拆。 */
    function allocateShares(item, days) {
        return (days || []).map(function (row) {
            var base = row && row.due != null && row.due !== '' ? row.due : (row && row.actual);
            var actual = Math.max(0, cents(base));
            return {
                id: row && row.id,
                date: row && row.date,
                time: (row && row.time) || '',
                channel: row && row.channel,
                kind: (row && row.kind) || '',
                trader: (actual / 100).toFixed(2),
                lengfeng: '0.00',
                provider: '0.00'
            };
        });
    }

    /* 贸易商收到的钱全部记货款，不拆服务费。已结仍是这笔金额。 */
    function settledParts(item, amount) {
        var total = cents(amount);
        if (!(total > 0)) return { goods: '', fee: '' };
        return { goods: (total / 100).toFixed(2), fee: '' };
    }

    function sumField(rows, field) {
        var total = 0;
        var any = false;
        (rows || []).forEach(function (row) {
            if (!row || row[field] == null || row[field] === '') return;
            any = true;
            total += cents(row[field]);
        });
        return any ? (total / 100).toFixed(2) : '';
    }

    function feeStamp(item) {
        var text = String((item && (item.paidAt || item.acceptedAt || item.updatedAt)) || '');
        return { date: text.slice(0, 10), time: text };
    }

    function channelsOf(item) {
        var channels = ((item && item.settleRatios) || []).map(function (row) {
            return row && row.channel;
        }).filter(Boolean);
        if (!channels.length) channels = ['POS', '直播', '商城'];
        return channels;
    }

    function ratioText(item, channel) {
        var found = '';
        ((item && item.settleRatios) || []).some(function (row) {
            if (!row || row.channel !== channel || row.fallback == null || row.fallback === '') return false;
            found = row.fallback;
            return true;
        });
        if (!found) {
            var ratio = channelRatio(item, channel);
            return ratio ? Number(ratio).toFixed(2) + '%' : '';
        }
        var num = Number(String(found).replace('%', ''));
        return isFinite(num) ? num.toFixed(2) + '%' : String(found);
    }

    /* 自动扣款才按渠道拆所得、比例、应付。手动付款和放款划拨没有渠道营业。 */
    function channelFields(item, list, daily) {
        var income = {};
        var due = {};
        var ratio = {};
        channelsOf(item).forEach(function (channel) {
            if (!daily) {
                income[channel] = '';
                due[channel] = '';
                ratio[channel] = '';
                return;
            }
            var incomeCents = 0;
            var dueCents = 0;
            var hit = false;
            (list || []).forEach(function (row) {
                if (!row || row.channel !== channel) return;
                hit = true;
                incomeCents += cents(row.commission);
                dueCents += cents(row.due);
            });
            income[channel] = hit ? (incomeCents / 100).toFixed(2) : '';
            due[channel] = hit ? (dueCents / 100).toFixed(2) : '';
            var used = '';
            (list || []).forEach(function (row) {
                if (row && row.channel === channel && row.ratio) used = row.ratio;
            });
            ratio[channel] = used || (daily ? ratioText(item, channel) : '');
        });
        return {
            incomePos: income.POS || '',
            incomeLive: income['直播'] || '',
            incomeMall: income['商城'] || '',
            ratioPos: ratio.POS || '',
            ratioLive: ratio['直播'] || '',
            ratioMall: ratio['商城'] || '',
            duePos: due.POS || '',
            dueLive: due['直播'] || '',
            dueMall: due['商城'] || ''
        };
    }

    /* 放款各一条：冷丰记货款差额，服务商记转出金额。时间用贸易商打给冷丰供应链的时间。 */
    function upfrontFeeRows(item) {
        var api = global.RbtDemandData;
        var pack = api && typeof api.deductSettlement === 'function' ? api.deductSettlement(item) : null;
        var stamp = feeStamp(item);
        if (!pack || !stamp.date) return [];
        var rows = [];
        function push(role, amountText) {
            var amount = Number(amountText);
            if (!(amount > 0)) return;
            var lengfeng = role === 'lengfeng';
            rows.push({
                id: item.code + ':fee:' + role,
                date: stamp.date,
                time: stamp.time,
                storeCode: item.storeCode || '',
                storeName: item.storeName || '',
                demandCode: item.code,
                channel: '放款划拨',
                kind: 'fee',
                turnover: '',
                commission: '',
                ratio: '',
                due: amount.toFixed(2),
                actual: amount.toFixed(2),
                payMethod: '放款划拨',
                source: '放款划拨',
                fundStatus: 'arrived',
                traderName: item.traderName || '',
                traderPay: '',
                goodsPay: '',
                feePay: '',
                lengfengPay: lengfeng ? amount.toFixed(2) : '',
                providerName: item.providerName || '',
                providerPay: lengfeng ? '' : amount.toFixed(2)
            });
            Object.assign(rows[rows.length - 1], channelFields(item, [], false));
        }
        push('lengfeng', pack.lengfeng);
        push('provider', pack.provider);
        return rows;
    }

    /* 同一天各渠道合成一条，全部结给贸易商。手动付款仍单独成行。 */
    function traderDayRows(item) {
        var groups = {};
        var order = [];
        var manuals = [];
        daysOf(item).forEach(function (row) {
            if (!row) return;
            if (row.kind === 'manual') {
                manuals.push(row);
                return;
            }
            if (!groups[row.date]) {
                groups[row.date] = [];
                order.push(row.date);
            }
            groups[row.date].push(row);
        });
        /* 在途也生成一条。付款子单号当时就有，结款、实际付款和通道流水到账后再写。 */
        var daily = [];
        order.forEach(function (date) {
            var list = groups[date];
            var arrived = list.filter(function (row) {
                return row.fundStatus !== 'inflight' && row.actual !== '';
            });
            var pending = !arrived.length;
            var basis = pending ? list : arrived;
            var actual = pending ? '' : sumField(basis, 'actual');
            var parts = pending ? { goods: '', fee: '' } : settledParts(item, actual);
            var ratios = [];
            basis.forEach(function (row) {
                if (row.ratio && ratios.indexOf(row.ratio) < 0) ratios.push(row.ratio);
            });
            daily.push(Object.assign({
                id: item.code + ':day:' + date,
                date: date,
                time: pending ? '' : ((basis[0] && basis[0].time) || settledAt(date, item.code + ':' + date)),
                storeCode: item.storeCode || '',
                storeName: item.storeName || '',
                demandCode: item.code,
                channel: '自动扣款',
                kind: '',
                turnover: sumField(basis, 'turnover'),
                commission: sumField(basis, 'commission'),
                ratio: ratios.length === 1 ? ratios[0] : '',
                due: sumField(basis, 'due'),
                actual: actual,
                payMethod: AUTO_PAY_METHOD,
                source: '获准营业事实',
                fundStatus: pending ? 'inflight' : 'arrived',
                traderName: item.traderName || '',
                traderPay: actual,
                goodsPay: parts.goods,
                feePay: parts.fee,
                lengfengPay: '',
                providerName: item.providerName || '',
                providerPay: ''
            }, channelFields(item, basis, true)));
        });
        failedRows(item).forEach(function (row) { manuals.push(row); });
        return daily.concat(manuals.map(function (row) {
            var failed = row.fundStatus === 'failed';
            var amount = failed ? '' : (row.actual || row.due || '');
            var parts = failed ? { goods: '', fee: '' } : settledParts(item, amount);
            return {
                id: row.id,
                date: row.date,
                time: row.time || '',
                storeCode: row.storeCode,
                storeName: row.storeName,
                demandCode: row.demandCode,
                channel: '手动付款',
                kind: 'manual',
                turnover: '',
                commission: '',
                ratio: '',
                due: row.due,
                actual: failed ? '' : row.actual,
                payMethod: row.payMethod || '',
                source: row.source || '手动付款',
                fundStatus: failed ? 'failed' : 'arrived',
                traderName: item.traderName || '',
                traderPay: amount,
                goodsPay: parts.goods,
                feePay: parts.fee,
                lengfengPay: '',
                providerName: item.providerName || '',
                providerPay: ''
            };
        }).map(function (row) {
            return Object.assign(row, channelFields(item, [], false));
        }));
    }

    function paidRow(row) {
        return row && row.actual != null && String(row.actual).trim() !== '';
    }

    /* 结款失败是这笔子单提交时平台或汇付出错，钱没有划出。已结款才有通道流水和实际付款。 */
    function settleStatus(row) {
        if (row && row.fundStatus === 'failed') return '结款失败';
        return paidRow(row) ? '已结款' : '在途';
    }

    function hashDigits(seed, length) {
        var text = String(seed || '');
        var x = 2166136261;
        var i;
        for (i = 0; i < text.length; i++) {
            x ^= text.charCodeAt(i);
            x = Math.imul(x, 16777619);
        }
        var digits = '';
        x = x >>> 0;
        while (digits.length < length) {
            x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
            digits += String(100000000 + (x % 100000000)).slice(1);
        }
        return digits.slice(0, length);
    }

    /* 付款单号 FK 加 5 位编码，中间不带横杠。付款子单号再接日期和当天序号，同样连成一串数字。 */
    function paySerial(item) {
        var code = String((item && (item.code || item.demandCode)) || '').replace(/\D/g, '');
        if (!code) return '';
        while (code.length < 5) code = '0' + code;
        return code.slice(-5);
    }

    /* 自动扣款从门店钱包余额扣。手动付款才是支付宝、微信或钱包。放款划拨不记付款账户。 */
    function payAccountText(channel, payMethod) {
        if (channel === '自动扣款') return '钱包余额';
        var tool = String(payMethod || '').trim();
        if (tool === '余额账户') return '钱包';
        if (tool === '支付宝' || tool === '微信' || tool === '钱包') return tool;
        return '';
    }

    function ledgerNo(item) {
        var serial = paySerial(item);
        return serial ? ('FK' + serial) : '';
    }

    /* 同一张付款单、同一天的子单从 1 往下排。 */
    function subIndex(row, rows) {
        var mates = (rows || []).filter(function (item) {
            return item.demandCode === row.demandCode && item.date === row.date;
        }).sort(function (a, b) {
            var left = String(a.id || '');
            var right = String(b.id || '');
            if (left === right) return 0;
            return left < right ? -1 : 1;
        });
        var index = 1;
        mates.forEach(function (item, i) {
            if (item.id === row.id) index = i + 1;
        });
        return index > 9 ? 9 : index;
    }

    function payDoc(row, rows) {
        var serial = paySerial(row);
        var day = String(row.date || '').replace(/\D/g, '');
        var short = day.length >= 8 ? day.slice(2, 8) : day;
        return {
            payNo: serial && short ? ('FK' + serial + short + subIndex(row, rows)) : '',
            channelFlow: paidRow(row) ? ('003100TOP3B' + hashDigits(row.id + ':flow', 18)) : ''
        };
    }

    /* 列表按结款方拆开：贸易商、冷丰、服务商各一条，不再把三方结款并在同一行。 */
    function partyRows() {
        var rows = detailRows();
        return rows.map(function (row) {
            var role = '贸易商';
            var name = row.traderName || '';
            var amount = row.traderPay || '';
            var goods = row.goodsPay || '';
            var fee = row.feePay || '';
            if (row.kind === 'fee' && row.lengfengPay) {
                role = '冷丰';
                name = '上海冷丰科技有限公司';
                amount = row.lengfengPay;
                /* 冷丰放款划拨整笔记货款。已结仍是这笔金额，服务费留空。 */
                goods = amount;
                fee = '';
            } else if (row.kind === 'fee') {
                role = '服务商';
                name = row.providerName || '';
                amount = row.providerPay || '';
                goods = '';
                fee = amount;
            }
            var doc = payDoc(row, rows);
            return Object.assign({}, row, {
                payeeRole: role,
                payeeName: name,
                settleAmount: amount,
                goodsPay: goods,
                feePay: fee,
                payNo: doc.payNo,
                channelFlow: doc.channelFlow,
                payWay: row.channel || '',
                payAccount: payAccountText(row.channel, row.payMethod),
                settleStatus: settleStatus(row)
            });
        });
    }

    /* 营业流水按原口径整段拆。一键付款单独按结算系数拆，不把尾差挤进这笔手动付款。 */
    function payeeSplit(item) {
        var days = daysOf(item);
        var auto = [];
        var manual = [];
        days.forEach(function (row) {
            if (row && row.kind === 'manual') manual.push(row);
            else auto.push(row);
        });
        var autoShares = allocateShares(item, auto);
        var manualShares = manual.map(function (row) { return allocateShares(item, [row])[0]; });
        var autoIndex = 0;
        var manualIndex = 0;
        return days.map(function (row) {
            if (row && row.kind === 'manual') return manualShares[manualIndex++];
            return autoShares[autoIndex++];
        });
    }

    /* 付款明细：贸易商按日一条；冷丰、服务商各一条放款划拨，不按日重复。 */
    function detailRows() {
        var api = global.RbtDemandData;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var out = [];
        list.forEach(function (item) {
            if (!item || !inPerformance(item.status)) return;
            out = out.concat(upfrontFeeRows(item), traderDayRows(item));
        });
        out.sort(function (a, b) {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            if (a.storeName !== b.storeName) return a.storeName < b.storeName ? -1 : 1;
            if (a.demandCode !== b.demandCode) return a.demandCode < b.demandCode ? -1 : 1;
            return a.channel < b.channel ? -1 : 1;
        });
        return out;
    }

    /* 门店经营用营业额，含 POS。不生成应付。 */
    function opsFacts(item) {
        if (!item || (item.status !== '门店付款中' && item.status !== '还款中' && item.status !== '已完成')) return [];
        var scale = scaleOf(item.code);
        var doneOn = item.status === '已完成' ? String(item.updatedAt || '').slice(0, 10) : '';
        return FACTS.filter(function (fact) {
            return fact && fact.date && fact.channel && !fact.missing && (!doneOn || fact.date <= doneOn);
        }).map(function (fact) {
            return {
                date: fact.date,
                channel: fact.channel,
                turnover: Math.round(fact.turnover * scale * 100) / 100
            };
        });
    }

    /* 已发生的营收事实，供门店流水演示。 */
    function revenueFacts() {
        return FACTS.map(function (fact) {
            return { date: fact.date, channel: fact.channel, turnover: fact.turnover };
        });
    }

    global.RbtDailyFulfill = {
        autoPayMethod: AUTO_PAY_METHOD,
        revenueFacts: revenueFacts,
        opsFacts: opsFacts,
        commissionRate: COMMISSION_RATE,
        posPlatformFeeRate: POS_PLATFORM_FEE_RATE,
        postedBase: postedBase,
        manualCents: manualCents,
        manualRows: manualLedgerRows,
        failedRows: failedRows,
        appendManual: appendManual,
        phaseLabel: phaseLabel,
        phaseOf: phaseOf,
        isSettled: isSettled,
        markSettled: markSettled,
        performanceFact: performanceFact,
        inPerformance: inPerformance,
        money: money,
        settledAt: settledAt,
        daysOf: daysOf,
        rows: rows,
        detailRows: detailRows,
        partyRows: partyRows,
        ledgerNo: ledgerNo,
        payAccountText: payAccountText,
        settledParts: settledParts,
        sumDue: sumDue,
        payeeSplit: payeeSplit
    };
})(window);
