/* 贸易商、服务商钱包与结款总览。
   钱包只保留余额账户：可充值、可提现，没有保证金账户，也没有货款账户。
   已到账结款记入余额。贸易商合同全部签完后，按商品金额划转给冷丰供应链。 */
(function (global) {
    var KEY = 'rbt_party_wallet_v1';
    var OPENING = {
        '杭州鲜达贸易有限公司': 100000,
        '上海冷链融资租赁有限公司': 200000
    };
    /* 充值限额与门店钱包一致：支付宝、微信走单笔 5000、单日 50000；银行卡用该卡自己的限额。 */
    var SINGLE_LIMIT = 5000;
    var DAILY_LIMIT = 50000;
    var SMS_CODE = '123456';
    var BANKS = [
        { id: 'icbc', name: '工商银行', short: '工', single: 5000, daily: 100000 },
        { id: 'abc', name: '农业银行', short: '农', single: 700, daily: 10000 },
        { id: 'boc', name: '中国银行', short: '中', single: 5000, daily: 10000 },
        { id: 'ccb', name: '建设银行', short: '建', single: 200000, daily: 200000 },
        { id: 'citic', name: '中信银行', short: '信', single: 5000, daily: 5000 },
        { id: 'ceb', name: '光大银行', short: '光', single: 200000, daily: 200000 },
        { id: 'cmb', name: '招商银行', short: '招', single: 50000, daily: 50000 },
        { id: 'comm', name: '交通银行', short: '交', single: 20000, daily: 50000 }
    ];
    var BIN_MAP = {
        '622202': 'icbc',
        '622848': 'abc',
        '621660': 'boc',
        '621700': 'ccb',
        '622690': 'citic',
        '622666': 'ceb',
        '622588': 'cmb',
        '622262': 'comm'
    };
    /* 原型支出，落在近 30 天内。贸易商账户明细里，提现写「提现」，付给冷丰供应链的货款写「货款」。服务商只提现，金额不超过已入账服务费。 */
    var DEMO_MOVEMENTS = {
        '杭州鲜达贸易有限公司': {
            withdraw: [
                { id: 'withdraw:demo:20261121', amount: 3600, time: '2026-11-21 15:26:08' },
                { id: 'withdraw:demo:20261110', amount: 12000, time: '2026-11-10 11:08:42' }
            ],
            transfer: [
                { code: 'XQ00026', amount: 50000, time: '2026-11-18 16:40:08' }
            ]
        },
        '上海冷链融资租赁有限公司': {
            withdraw: [
                { id: 'withdraw:demo:20261115', amount: 8000, time: '2026-11-15 14:12:33' }
            ],
            transfer: [
                { code: 'XQ00016', amount: 40000, time: '2026-11-07 09:22:05' }
            ]
        },
        '宁波海丰商业保理有限公司': {
            withdraw: [
                { id: 'withdraw:demo:provider:20261125', amount: 600, time: '2026-11-25 14:48:02' },
                { id: 'withdraw:demo:provider:20261118', amount: 800, time: '2026-11-18 10:05:36' },
                { id: 'withdraw:demo:provider:20261112', amount: 1200, time: '2026-11-12 16:20:18' }
            ]
        }
    };
    var SEED_CARDS = [{
        id: 'BC-QUICK-001',
        bankId: 'cmb',
        bankName: '招商银行',
        bankShort: '招',
        cardNo: '6225881234566666',
        cardTail: '6666',
        single: 50000,
        daily: 50000
    }];

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function round2(value) {
        var num = Number(value);
        if (!isFinite(num)) return 0;
        return Math.round(num * 100) / 100;
    }

    function cents(value) {
        return Math.round(round2(value) * 100);
    }

    function fromCents(value) {
        var sign = value < 0 ? '-' : '';
        var abs = Math.abs(Math.round(value));
        return sign + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    function comma(value) {
        var text = fromCents(cents(value));
        var parts = text.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    function pad(num) {
        return num < 10 ? '0' + num : String(num);
    }

    function nowText() {
        var now = new Date();
        return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' +
            pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    }

    function today() {
        var now = new Date();
        return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    }

    function addDays(date, days) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return '';
        var next = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(next.getTime())) return '';
        next.setDate(next.getDate() + days);
        return next.getFullYear() + '-' + pad(next.getMonth() + 1) + '-' + pad(next.getDate());
    }

    /* 已结款按到账日，待结款按营业日，提前支付按支付日。 */
    function queryDate(share) {
        if (!share) return '';
        if (share.kind === 'manual') {
            var matched = String(share.time || '').match(/(\d{4}-\d{2}-\d{2})/);
            return (matched && matched[1]) || share.date || '';
        }
        if (share.stage === 'pending') return share.date || '';
        return addDays(share.date, 1);
    }

    function readAll() {
        try {
            var raw = sessionStorage.getItem(KEY);
            var data = raw ? JSON.parse(raw) : null;
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function bagOf(name) {
        var bag = readAll()[name] || {};
        var next = {
            recharge: Array.isArray(bag.recharge) ? bag.recharge : [],
            withdraw: Array.isArray(bag.withdraw) ? bag.withdraw : [],
            transfer: Array.isArray(bag.transfer) ? bag.transfer : [],
            cards: Array.isArray(bag.cards) ? bag.cards : null,
            rechargeDailyDate: bag.rechargeDailyDate || '',
            rechargeDailyUsed: Number(bag.rechargeDailyUsed || 0)
        };
        return ensureDemoMovements(name, next);
    }

    function ensureDemoMovements(name, bag) {
        var demo = DEMO_MOVEMENTS[name];
        if (!demo) return bag;
        var changed = false;
        (demo.withdraw || []).forEach(function (row) {
            if (bag.withdraw.some(function (item) { return item && item.id === row.id; })) return;
            bag.withdraw.push(row);
            changed = true;
        });
        (demo.transfer || []).forEach(function (row) {
            if (bag.transfer.some(function (item) { return item && item.code === row.code; })) return;
            bag.transfer.push(row);
            changed = true;
        });
        if (changed) saveBag(name, bag);
        return bag;
    }

    function saveBag(name, bag) {
        var all = readAll();
        all[name] = bag;
        sessionStorage.setItem(KEY, JSON.stringify(all));
    }

    function openFund(row) {
        return row && row.kind !== 'manual' &&
            (row.fundStatus === 'inflight' || row.fundStatus === 'frozen' || row.fundStatus === 'missing' || row.fundStatus === 'pending_freeze');
    }

    /* 服务商服务费在贸易商划转时一次入账，不再按日拆。 */
    function providerFeeLines(name) {
        var api = global.RbtDemandData;
        if (!name || !api || typeof api.list !== 'function') return [];
        var out = [];
        (api.list() || []).forEach(function (item) {
            if (!item || item.providerName !== name) return;
            if (item.status !== '门店付款中' && item.status !== '还款中' && item.status !== '已完成') return;
            var pack = typeof api.deductSettlement === 'function' ? api.deductSettlement(item) : null;
            var amount = round2(pack && pack.provider);
            if (!(amount > 0)) return;
            var when = item.paidAt || '';
            if (!when) return;
            out.push({
                id: 'receipt:fee:' + item.code,
                time: when,
                dir: 'in',
                title: item.storeName ? ('结款入账 · ' + item.storeName) : '结款入账',
                amount: amount,
                kind: 'receipt'
            });
        });
        return out;
    }

    /* 各渠道、各需求先汇总进门店钱包，再从门店余额按打款节点打出。同一门店同一天只入账一笔。服务商不走这条。 */
    function receiptLines(role, name) {
        if (role === 'provider') return providerFeeLines(name);
        var api = global.RbtDemandData;
        var daily = global.RbtDailyFulfill;
        if (!name || !api || typeof api.list !== 'function' || !daily || typeof daily.payeeSplit !== 'function') return [];
        var field = 'trader';
        var batches = {};
        var batchOrder = [];
        (api.list() || []).forEach(function (item) {
            if (!item) return;
            if (role === 'provider') {
                if (item.providerName !== name) return;
            } else if (item.traderName !== name) return;
            var store = item.storeName || '';
            var facts = {};
            if (typeof daily.daysOf === 'function') {
                daily.daysOf(item).forEach(function (row) {
                    if (row && row.id) facts[row.id] = row;
                });
            }
            (daily.payeeSplit(item) || []).forEach(function (row) {
                if (!row) return;
                var fact = facts[row.id] || {};
                if (openFund(row.kind === 'manual' ? { kind: 'manual' } : fact)) return;
                var amount = round2(row[field]);
                if (!(amount > 0)) return;
                var manual = row.kind === 'manual';
                var when = manual ? (row.time || fact.time || '') : (fact.time || '');
                var day = String(when).slice(0, 10);
                var key = day + '\n' + store;
                if (!batches[key]) {
                    batches[key] = { time: when, store: store, amountCents: 0 };
                    batchOrder.push(key);
                }
                var batch = batches[key];
                batch.amountCents += Math.round(amount * 100);
                if (!manual) batch.time = when;
            });
        });
        return batchOrder.map(function (key) {
            var batch = batches[key];
            return {
                id: 'receipt:store:' + key,
                time: batch.time,
                dir: 'in',
                title: batch.store ? ('结款入账 · ' + batch.store) : '结款入账',
                amount: round2(batch.amountCents / 100),
                kind: 'receipt'
            };
        });
    }

    function movementLines(role, name) {
        var bag = bagOf(name);
        var trader = role === 'trader';
        return bag.recharge.map(function (row) {
            return { id: row.id, time: row.time, dir: 'in', title: (row.method || '充值') + '充值', amount: round2(row.amount), kind: 'recharge' };
        }).concat(bag.withdraw.map(function (row) {
            return { id: row.id, time: row.time, dir: 'out', title: trader ? '提现' : '提现到收款账户', amount: round2(row.amount), kind: 'withdraw' };
        })).concat(bag.transfer.map(function (row) {
            return { id: row.code, time: row.time, dir: 'out', title: (trader ? '货款' : '划转冷丰供应链') + ' · ' + row.code, amount: round2(row.amount), kind: 'transfer' };
        }));
    }

    function ledgerOf(role, name) {
        return receiptLines(role, name).concat(movementLines(role, name)).filter(function (row) {
            return row && row.amount > 0;
        }).sort(function (a, b) {
            return String(b.time || '').localeCompare(String(a.time || ''));
        });
    }

    function balanceOf(role, name) {
        var total = role === 'trader' ? round2(OPENING[name] || 0) : 0;
        ledgerOf(role, name).forEach(function (row) {
            total += row.dir === 'out' ? -row.amount : row.amount;
        });
        return round2(total);
    }

    function snapshot(role, name) {
        var balance = balanceOf(role, name);
        return {
            balance: balance,
            withdrawable: balance > 0 ? balance : 0,
            ledger: ledgerOf(role, name)
        };
    }

    function editAmount(current, key) {
        var s = String(current || '');
        if (key === 'del') return s.slice(0, -1);
        if (key === '.') {
            if (!s) return '0.';
            if (s.indexOf('.') >= 0) return s;
            return s + '.';
        }
        if (!/^\d$/.test(key)) return s;
        if (s === '0') return key;
        var dot = s.indexOf('.');
        if (dot >= 0) {
            if (s.length - dot > 2) return s;
            return s + key;
        }
        if (s.length >= 8) return s;
        return s + key;
    }

    function amountReady(raw, max) {
        if (!/^\d+(\.\d{1,2})?$/.test(String(raw || ''))) return false;
        var value = Number(raw);
        if (!(value > 0)) return false;
        if (max != null && value > Number(max) + 0.001) return false;
        return true;
    }

    function moneyInt(value) {
        var num = Number(value || 0);
        if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
        return num.toFixed(2);
    }

    function bankById(id) {
        var i;
        for (i = 0; i < BANKS.length; i++) {
            if (BANKS[i].id === id) return BANKS[i];
        }
        return null;
    }

    function detectBank(cardNo) {
        var text = String(cardNo || '').replace(/\s/g, '');
        var keys = Object.keys(BIN_MAP);
        var i;
        for (i = 0; i < keys.length; i++) {
            if (text.indexOf(keys[i]) === 0) return bankById(BIN_MAP[keys[i]]);
        }
        return null;
    }

    function cardsOf(name) {
        var bag = bagOf(name);
        if (!Array.isArray(bag.cards)) {
            bag.cards = SEED_CARDS.map(function (card) { return Object.assign({}, card); });
            saveBag(name, bag);
        }
        return bag.cards;
    }

    function rechargeMethods(name) {
        var cards = cardsOf(name).map(function (card) {
            return {
                id: 'card:' + card.id,
                name: card.bankName + '(' + card.cardTail + ')',
                short: card.bankShort || '卡',
                tone: 'is-card',
                channel: card.bankName,
                showTip: true,
                tip: '单笔最高¥' + moneyInt(card.single || SINGLE_LIMIT) + '，单日最高¥' + moneyInt(card.daily || DAILY_LIMIT),
                single: Number(card.single || SINGLE_LIMIT),
                daily: Number(card.daily || DAILY_LIMIT)
            };
        });
        return cards.concat([
            { id: 'alipay', name: '支付宝', short: '支', tone: 'is-alipay', channel: '支付宝', showTip: false },
            { id: 'wechat', name: '微信', short: '微', tone: 'is-wechat', channel: '微信', showTip: false }
        ]);
    }

    function normalizeMethodId(methodId) {
        if (methodId === '微信') return 'wechat';
        if (methodId === '支付宝') return 'alipay';
        return methodId || '';
    }

    function rechargeMethod(name, methodId) {
        var methods = rechargeMethods(name);
        var id = normalizeMethodId(methodId);
        var i;
        for (i = 0; i < methods.length; i++) {
            if (methods[i].id === id) return methods[i];
        }
        return methods[0] || null;
    }

    function dailyRemainOf(name) {
        var bag = bagOf(name);
        var used = bag.rechargeDailyDate === today() ? Number(bag.rechargeDailyUsed || 0) : 0;
        return round2(Math.max(0, DAILY_LIMIT - used));
    }

    function methodLimit(method) {
        if (!method) return { single: SINGLE_LIMIT, daily: DAILY_LIMIT };
        return {
            single: Number(method.single || SINGLE_LIMIT),
            daily: Number(method.daily || DAILY_LIMIT)
        };
    }

    /* 和门店充值同一套校验：没选方式、金额不对、超过单笔或当日剩余额度。 */
    function rechargeIssue(name, methodId, raw) {
        var method = rechargeMethod(name, methodId);
        var text = String(raw || '');
        if (!method) return '请先选择充值方式或添加银行卡';
        if (!text || /\.$/.test(text)) return '';
        if (!amountReady(text)) return '请输入正确的充值金额';
        var amount = Number(text);
        var limit = methodLimit(method);
        var remain = dailyRemainOf(name);
        if (amount > limit.single + 0.001) return '单笔最高可充值¥' + moneyInt(limit.single);
        if (amount > remain + 0.001) return '超过单日剩余额度¥' + moneyInt(remain);
        return '';
    }

    function bindReady(form) {
        form = form || {};
        var cardNo = String(form.cardNo || '').replace(/\s/g, '');
        return cardNo.length >= 12 && !!form.bankId && /^\d{11}$/.test(String(form.phone || '')) && String(form.sms || '').length >= 4;
    }

    function bindCard(name, form) {
        form = form || {};
        var cardNo = String(form.cardNo || '').replace(/\s/g, '');
        var phone = String(form.phone || '');
        var sms = String(form.sms || '');
        var bank = bankById(form.bankId) || detectBank(cardNo);
        if (!cardNo || cardNo.length < 12) return { ok: false, message: '你的银行卡卡号填写错误或者卡号不存在' };
        if (!bank) return { ok: false, message: '发行行不支持此交易，请更换银行卡绑定。' };
        if (!/^\d{11}$/.test(phone)) return { ok: false, message: '请输入银行预留手机号' };
        if (sms !== SMS_CODE) return { ok: false, message: sms ? '验证码错误，请重新填写' : '请填写验证码' };
        var suffix = cardNo.slice(-4);
        var suffixMessage = {
            '0000': '您填写的银行卡号无效或已过期，请更换银行卡绑定。',
            '1111': '此银行卡已绑定',
            '2222': '该卡已受限制，请更换银行卡绑定。',
            '3333': '发行行不支持此交易，请更换银行卡绑定。',
            '4444': '此卡未开通无卡支付，请更换银行卡绑定。',
            '5555': '银行卡预留手机号不符，请核对后再试，若银行卡预留手机号已变更，请更新手机号',
            '6666': '您填写的信息不匹配，请核对后再试。'
        };
        if (suffixMessage[suffix]) return { ok: false, message: suffixMessage[suffix] };
        var bag = bagOf(name);
        var list = cardsOf(name);
        if (list.some(function (card) { return card.cardNo === cardNo; })) return { ok: false, message: '此银行卡已绑定' };
        var card = {
            id: 'BC' + Date.now(),
            bankId: bank.id,
            bankName: bank.name,
            bankShort: bank.short,
            cardNo: cardNo,
            cardTail: cardNo.slice(-4),
            single: bank.single,
            daily: bank.daily
        };
        bag = bagOf(name);
        bag.cards = list.concat([card]);
        saveBag(name, bag);
        return { ok: true, card: card };
    }

    function recharge(role, name, amount, methodId) {
        if (role !== 'trader' && role !== 'provider') return { ok: false, message: '当前钱包不支持充值' };
        var issue = rechargeIssue(name, methodId, amount);
        if (issue) return { ok: false, message: issue };
        var value = round2(amount);
        if (!(value > 0)) return { ok: false, message: '请输入正确的充值金额' };
        var method = rechargeMethod(name, methodId);
        var bag = bagOf(name);
        if (bag.rechargeDailyDate !== today()) {
            bag.rechargeDailyDate = today();
            bag.rechargeDailyUsed = 0;
        }
        bag.rechargeDailyUsed = round2(Number(bag.rechargeDailyUsed || 0) + value);
        bag.recharge.push({
            id: 'recharge:' + Date.now(),
            amount: value,
            method: method ? method.channel : '充值',
            time: nowText()
        });
        saveBag(name, bag);
        return { ok: true, balance: balanceOf(role, name), method: method };
    }

    function withdraw(role, name, amount) {
        var value = round2(amount);
        if (!(value > 0)) return { ok: false, message: '请填写大于 0 的提现金额' };
        var balance = balanceOf(role, name);
        if (value > balance + 0.001) return { ok: false, message: '超过可提现余额 ¥' + comma(balance) };
        var bag = bagOf(name);
        bag.withdraw.push({ id: 'withdraw:' + Date.now(), amount: value, time: nowText() });
        saveBag(name, bag);
        return { ok: true, balance: balanceOf(role, name) };
    }

    function transferToSupply(name, code, amount) {
        var value = round2(amount);
        if (!name || !code || !(value > 0)) return { ok: false, reason: 'amount' };
        var bag = bagOf(name);
        if (bag.transfer.some(function (row) { return row && row.code === code; })) return { ok: true, skipped: true };
        if (balanceOf('trader', name) + 0.001 < value) return { ok: false, reason: 'balance' };
        bag.transfer.push({ code: code, amount: value, time: nowText() });
        saveBag(name, bag);
        return { ok: true };
    }

    function verifyPassword(pwd) {
        var api = global.StorePayPassword;
        var text = String(pwd || '');
        if (api && typeof api.hasPassword === 'function' && api.hasPassword()) {
            return typeof api.verify === 'function' ? api.verify(text) : { ok: false };
        }
        if (text === '123456') {
            if (api && typeof api.setPassword === 'function') api.setPassword('123456');
            return { ok: true };
        }
        return { ok: false, message: '密码输入错误，请重新输入' };
    }

    function inRange(date, mode, from, to) {
        if (!date) return false;
        if (mode === 'all') return true;
        if (mode === 'custom') return !!(from && to && date >= from && date <= to);
        var end = today();
        var start = addDays(end, mode === '7' ? -6 : -29);
        return date >= start && date <= end;
    }

    function chip(label, on, attr, value) {
        return '<button type="button" class="rbt-party-chip' + (on ? ' is-on' : '') + '" ' + attr + '="' + esc(value) + '">' + esc(label) + '</button>';
    }

    function dateFields(from, to, fromAttr, toAttr, applyAttr) {
        return '<div class="rbt-party-dates">' +
            '<label>开始<input type="date" ' + fromAttr + ' value="' + esc(from || '') + '"></label>' +
            '<label>结束<input type="date" ' + toAttr + ' value="' + esc(to || '') + '"></label>' +
            '<button type="button" class="rbt-party-apply" ' + applyAttr + '>查询</button></div>';
    }

    function monthDay(date) {
        var matched = String(date || '').match(/(\d{4})-(\d{2})-(\d{2})/);
        if (!matched) return '';
        return Number(matched[2]) + '月' + Number(matched[3]) + '日';
    }

    function rangeLabel(range, from, to) {
        if (range === '7') return '近7天';
        if (range === 'all') return '全部时间';
        if (range === 'custom') return from && to ? (monthDay(from) + '–' + monthDay(to)) : '自定义';
        return '近30天';
    }

    function clockOf(time) {
        var matched = String(time || '').match(/(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}:\d{2}))?/);
        if (!matched) return { day: '', dayLabel: '日期未知', clock: '' };
        return {
            day: matched[1] + '-' + matched[2] + '-' + matched[3],
            dayLabel: Number(matched[2]) + '月' + Number(matched[3]) + '日',
            clock: matched[4] || ''
        };
    }

    function splitTitle(title) {
        var text = String(title || '');
        var cut = text.indexOf(' · ');
        if (cut < 0) return { name: text || '流水', extra: '' };
        return { name: text.slice(0, cut), extra: text.slice(cut + 3) };
    }

    function ledgerListHtml(list) {
        if (!list.length) return '<p class="rbt-party-empty rbt-party-empty--card">该时段暂无明细</p>';
        var html = '';
        var lastDay = '';
        list.forEach(function (row) {
            var when = clockOf(row.time);
            var parts = splitTitle(row.title);
            var sub = [parts.extra, when.clock].filter(Boolean).join(' · ');
            if (when.day !== lastDay) {
                if (lastDay) html += '</div></section>';
                lastDay = when.day;
                html += '<section class="rbt-party-day"><h3>' + esc(when.dayLabel) + '</h3><div class="rbt-party-day__card">';
            }
            html += '<div class="rbt-party-ledger"><div class="rbt-party-ledger__main"><b>' + esc(parts.name) + '</b>' +
                '<span>' + esc(sub || '—') + '</span></div><em class="' + (row.dir === 'out' ? 'is-out' : '') + '">' +
                (row.dir === 'out' ? '-' : '+') + '¥' + comma(row.amount) + '</em></div>';
        });
        if (lastDay) html += '</div></section>';
        return html;
    }

    function timePill(range, from, to, open) {
        return '<button type="button" class="rbt-party-time' + (open || range !== '30' ? ' is-on' : '') + '" data-wallet-time aria-expanded="' + (open ? 'true' : 'false') + '">' +
            '<svg class="rbt-party-time__cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>' +
            '<span>' + esc(rangeLabel(range, from, to)) + '</span>' +
            '<svg class="rbt-party-time__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>';
    }

    function timeSheetHtml(range, from, to) {
        var options = [
            ['7', '近7天', '最近一周'],
            ['30', '近30天', '最近一个月'],
            ['all', '全部', '不限时间'],
            ['custom', '自定义', '选择起止日期']
        ];
        var rows = options.map(function (item) {
            return '<button type="button" class="rbt-party-pick' + (range === item[0] ? ' is-on' : '') + '" data-wallet-range="' + item[0] + '">' +
                '<span class="rbt-party-pick__info"><b>' + item[1] + '</b><small>' + item[2] + '</small></span>' +
                '<em class="rbt-party-radio"></em></button>';
        }).join('');
        var custom = range === 'custom'
            ? '<div class="rbt-party-time-custom">' + dateFields(from, to, 'data-wallet-from', 'data-wallet-to', 'data-wallet-apply') + '</div>'
            : '';
        return '<div class="rbt-party-sheet rbt-party-time-sheet"><div class="rbt-party-sheet__mask" data-wallet-time-close></div>' +
            '<div class="rbt-party-sheet__panel" role="dialog" aria-modal="true" aria-label="选择时间">' +
            '<div class="rbt-party-sheet__bar"><strong>选择时间</strong><button type="button" data-wallet-time-close aria-label="关闭">×</button></div>' +
            '<div class="rbt-party-sheet__list">' + rows + '</div>' + custom + '</div></div>';
    }

    function clearTimeSheet() {
        var nodes = document.querySelectorAll('#rbtH5App > .rbt-party-time-sheet, #rbtH5Phone > .rbt-party-time-sheet');
        Array.prototype.forEach.call(nodes, function (node) { node.remove(); });
    }

    function pinTimeSheet() {
        var host = document.getElementById('rbtH5App') || document.getElementById('rbtH5Phone');
        var sheet = document.querySelector('#rbtH5Scroll .rbt-party-time-sheet');
        if (host && sheet) host.appendChild(sheet);
    }

    function overviewHtml(opts) {
        opts = opts || {};
        var mode = opts.mode === '7' || opts.mode === 'all' || opts.mode === 'custom' ? opts.mode : '30';
        var from = opts.from || '';
        var to = opts.to || '';
        var waiting = mode === 'custom' && (!from || !to);
        var rows = waiting ? [] : (opts.rows || []).filter(function (row) {
            return inRange(row && row.date, mode, from, to);
        });
        var settled = 0;
        var pending = 0;
        var daily = 0;
        var manual = 0;
        var stores = {};
        var days = {};
        rows.forEach(function (row) {
            var amount = round2((row.cents || 0) / 100);
            var store = row.store || '—';
            var date = row.date || '—';
            if (!stores[store]) stores[store] = { settled: 0, pending: 0 };
            if (!days[date]) days[date] = { settled: 0, pending: 0 };
            if (row.pending) {
                pending += amount;
                stores[store].pending += amount;
                days[date].pending += amount;
                return;
            }
            settled += amount;
            stores[store].settled += amount;
            days[date].settled += amount;
            if (row.kind === 'manual') manual += amount;
            else daily += amount;
        });
        var storeRows = Object.keys(stores).map(function (name) {
            return { name: name, settled: stores[name].settled, pending: stores[name].pending };
        }).sort(function (a, b) { return b.settled - a.settled || a.name.localeCompare(b.name, 'zh'); });
        var dayRows = Object.keys(days).sort().reverse();
        var body = waiting
            ? '<p class="rbt-party-empty">选择起止日期后查询</p>'
            : (!rows.length
                ? '<p class="rbt-party-empty">该时段暂无结款</p>'
                : '<section class="rbt-party-block"><h3>按门店</h3>' + storeRows.map(function (row) {
                    return '<div class="rbt-party-line"><b>' + esc(row.name) + '</b>' +
                        '<span>已结款 ¥' + comma(row.settled) + '</span>' +
                        '<span>待结款 ¥' + comma(row.pending) + '</span></div>';
                }).join('') + '</section>' +
                '<section class="rbt-party-block"><h3>按日</h3>' + dayRows.map(function (date) {
                    var row = days[date];
                    return '<div class="rbt-party-line"><b>' + esc(date) + '</b>' +
                        '<span>已结款 ¥' + comma(row.settled) + '</span>' +
                        '<span>待结款 ¥' + comma(row.pending) + '</span></div>';
                }).join('') + '</section>');
        return '<section class="rbt-party-overview">' +
            '<div class="rbt-party-chips">' +
            chip('近7天', mode === '7', 'data-ov-mode', '7') +
            chip('近30天', mode === '30', 'data-ov-mode', '30') +
            chip('全部', mode === 'all', 'data-ov-mode', 'all') +
            chip('自定义', mode === 'custom', 'data-ov-mode', 'custom') +
            '</div>' +
            (mode === 'custom' ? dateFields(from, to, 'data-ov-from', 'data-ov-to', 'data-ov-apply') : '') +
            '<p class="rbt-party-note">已结款按到账日，待结款按营业日，手动付款按支付日。只汇总结款明细里的金额。</p>' +
            '<div class="rbt-party-hero"><span>已结款</span><b>¥' + (waiting ? '—' : comma(settled)) + '</b></div>' +
            '<div class="rbt-party-metrics">' +
            '<div><span>待结款</span><b>' + (waiting ? '—' : ('¥' + comma(pending))) + '</b></div>' +
            '<div><span>' + esc(opts.dailyLabel || '自动扣款') + '</span><b>' + (waiting ? '—' : ('¥' + comma(daily))) + '</b></div>' +
            '<div><span>' + esc(opts.manualLabel || '手动付款') + '</span><b>' + (waiting ? '—' : ('¥' + comma(manual))) + '</b></div>' +
            '</div>' + body + '</section>';
    }

    function keypadHtml() {
        return '<div class="rbt-party-keypad">' +
            '123456789'.split('').map(function (key) {
                return '<button type="button" data-wallet-key="' + key + '">' + key + '</button>';
            }).join('') +
            '<button type="button" data-wallet-key=".">.</button>' +
            '<button type="button" data-wallet-key="0">0</button>' +
            '<button type="button" class="is-del" data-wallet-key="del" aria-label="删除">删除</button></div>';
    }

    function amountHtml(label, draft, extra) {
        return '<div class="rbt-party-yen"><div class="rbt-party-yen__label">' + label + '</div>' +
            '<div class="rbt-party-yen__row"><span>¥</span><b>' + esc(draft || '') + '</b><i></i></div>' +
            (extra || '') + '</div>';
    }

    function methodRow(method) {
        var tone = method ? method.tone : '';
        var tip = method && method.showTip && method.tip
            ? '<small>' + esc(method.tip) + '</small>'
            : '';
        return '<button type="button" class="rbt-party-method" data-wallet-method-open>' +
            '<span>充值方式</span><span class="rbt-party-method__main">' +
            '<i class="' + esc(tone) + '">' + esc(method ? method.short : '选') + '</i>' +
            '<span class="rbt-party-method__info"><b>' + esc(method ? method.name : '请选择充值方式') + '</b>' + tip + '</span>' +
            '<em>›</em></span></button>';
    }

    function methodSheet(name, method) {
        var current = method ? method.id : '';
        var rows = rechargeMethods(name).map(function (item) {
            var tip = item.showTip && item.tip ? '<small>' + esc(item.tip) + '</small>' : '';
            return '<button type="button" class="rbt-party-pick' + (item.id === current ? ' is-on' : '') + '" data-wallet-pick="' + esc(item.id) + '">' +
                '<i class="' + esc(item.tone) + '">' + esc(item.short) + '</i>' +
                '<span class="rbt-party-pick__info"><b>' + esc(item.name) + '</b>' + tip + '</span>' +
                '<em class="rbt-party-radio"></em></button>';
        }).join('');
        return '<div class="rbt-party-sheet"><div class="rbt-party-sheet__mask" data-wallet-sheet-close></div>' +
            '<div class="rbt-party-sheet__panel" role="dialog" aria-modal="true" aria-label="选择充值方式">' +
            '<div class="rbt-party-sheet__bar"><strong>选择充值方式</strong><button type="button" data-wallet-sheet-close aria-label="关闭">×</button></div>' +
            '<div class="rbt-party-sheet__list">' + rows +
            '<button type="button" class="rbt-party-add-card" data-wallet-add-card>+ 添加银行卡充值</button></div></div></div>';
    }

    function rechargeHtml(opts, draft) {
        var method = rechargeMethod(opts.name, opts.method);
        var issue = rechargeIssue(opts.name, method && method.id, draft);
        var ready = !!(method && amountReady(draft) && !issue);
        var extra = issue ? '<p class="rbt-party-yen__err">' + esc(issue) + '</p>' : '';
        return '<section class="rbt-party-pay">' +
            '<div class="rbt-party-pay__body"><div class="rbt-party-card">' +
            methodRow(method) +
            amountHtml('充值金额', draft, extra) +
            '<button type="button" class="rbt-party-submit" data-wallet-submit="recharge"' +
            (ready ? '' : ' disabled') + '>充值</button></div></div>' +
            keypadHtml() +
            (opts.sheet === 'method' ? methodSheet(opts.name, method) : '') +
            '</section>';
    }

    function bindHtml(opts) {
        var form = opts.bind || {};
        var bank = bankById(form.bankId);
        var cardNo = String(form.cardNo || '').replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
        var ready = bindReady(form);
        var banks = BANKS.map(function (item) {
            return '<button type="button" class="rbt-party-pick' + (item.id === form.bankId ? ' is-on' : '') + '" data-wallet-bank="' + esc(item.id) + '">' +
                '<i class="is-card">' + esc(item.short) + '</i>' +
                '<span class="rbt-party-pick__info"><b>' + esc(item.name) + '</b>' +
                '<small>单笔限额' + moneyInt(item.single) + '，单日限额' + moneyInt(item.daily) + '</small></span>' +
                '<em class="rbt-party-radio"></em></button>';
        }).join('');
        return '<section class="rbt-party-pay"><div class="rbt-party-pay__body">' +
            '<p class="rbt-party-bind__holder">持卡人：' + esc(opts.holder || opts.name || '') +
            ' <button type="button" data-wallet-holder-info aria-label="持卡人说明">i</button>' +
            '<span>仅限绑定本人持有借记卡</span></p>' +
            '<div class="rbt-party-bind">' +
            '<label><input data-wallet-bind="cardNo" inputmode="numeric" maxlength="23" placeholder="请输入银行卡号" value="' + esc(cardNo) + '"></label>' +
            '<button type="button" class="rbt-party-bind__bank' + (bank ? '' : ' is-empty') + '" data-wallet-bank-open>' +
            '<span>' + esc(bank ? bank.name : '请选择开户银行') + '</span><em>›</em></button>' +
            '<label><input data-wallet-bind="phone" inputmode="numeric" maxlength="11" placeholder="请输入银行预留手机号" value="' + esc(form.phone || '') + '"></label>' +
            '<label><input data-wallet-bind="sms" inputmode="numeric" maxlength="6" placeholder="请输入验证码" value="' + esc(form.sms || '') + '">' +
            '<button type="button" data-wallet-sms>获取验证码</button></label></div>' +
            '<button type="button" class="rbt-party-submit" data-wallet-bind-submit' + (ready ? '' : ' disabled') + '>立即绑卡</button></div>' +
            (form.sheet === 'bank'
                ? '<div class="rbt-party-sheet"><div class="rbt-party-sheet__mask" data-wallet-bind-close></div>' +
                    '<div class="rbt-party-sheet__panel" role="dialog" aria-modal="true" aria-label="选择开户银行">' +
                    '<div class="rbt-party-sheet__bar"><strong>选择开户银行</strong><button type="button" data-wallet-bind-close aria-label="关闭">×</button></div>' +
                    '<div class="rbt-party-sheet__list">' + banks + '</div></div></div>'
                : '') +
            (form.modal === 'holder'
                ? '<div class="rbt-party-sheet is-center"><div class="rbt-party-sheet__mask" data-wallet-bind-close></div>' +
                    '<div class="rbt-party-note-box" role="dialog" aria-modal="true"><strong>持卡人说明</strong>' +
                    '<p>为了账户资金安全，只能绑定持卡人本人的银行卡。</p>' +
                    '<button type="button" data-wallet-bind-close>知道了</button></div></div>'
                : '') +
            '</section>';
    }

    function walletHtml(opts) {
        opts = opts || {};
        var role = opts.role === 'provider' ? 'provider' : 'trader';
        var view = snapshot(role, opts.name);
        var pane = opts.pane === 'recharge' || opts.pane === 'withdraw' || opts.pane === 'bind' ? opts.pane : 'main';
        /* 服务商钱包只提现，不提供充值。 */
        if (role === 'provider' && pane === 'recharge') pane = 'main';
        var account = opts.account || {};
        var draft = String(opts.draft || '');
        if (pane === 'bind') return bindHtml(opts);
        if (pane === 'recharge') return rechargeHtml(opts, draft);
        if (pane === 'withdraw') {
            var no = String(account.accountNo || '').replace(/\s/g, '');
            var tail = no.slice(-4) || '----';
            var arrive = (account.accountName || '收款账户') + '(' + tail + ')';
            var mark = String(account.accountName || '户').slice(0, 1);
            var typing = /\.$/.test(draft);
            var over = !typing && amountReady(draft) && Number(draft) > view.withdrawable + 0.001;
            var bad = draft && !typing && !amountReady(draft);
            var readyWithdraw = amountReady(draft, view.withdrawable);
            var extra = '<p class="rbt-party-yen__meta">可提现金额¥' + comma(view.withdrawable) +
                '，<button type="button" data-wallet-all>全部提现</button></p>' +
                '<p class="rbt-party-yen__hint">提现后预计 T+1 到账</p>' +
                (bad ? '<p class="rbt-party-yen__err">请输入正确的提现金额</p>' : '') +
                (over ? '<p class="rbt-party-yen__err">提现金额不能超过可提现金额</p>' : '');
            return '<section class="rbt-party-pay">' +
                '<div class="rbt-party-pay__body"><div class="rbt-party-card">' +
                '<div class="rbt-party-bank"><span>到账账户</span><strong><i class="is-bank">' +
                esc(mark) + '</i>' + esc(arrive) + '</strong></div>' +
                amountHtml('提现金额', draft, extra) +
                '<button type="button" class="rbt-party-submit" data-wallet-submit="withdraw"' +
                (readyWithdraw ? '' : ' disabled') + '>提现</button></div></div>' +
                keypadHtml() + '</section>';
        }
        var range = opts.range === '7' || opts.range === 'all' || opts.range === 'custom' ? opts.range : '30';
        var tab = opts.tab === 'in' || opts.tab === 'out' ? opts.tab : 'all';
        var from = opts.from || '';
        var to = opts.to || '';
        var waiting = range === 'custom' && (!from || !to);
        var list = view.ledger.filter(function (row) {
            if (tab === 'in' && row.dir !== 'in') return false;
            if (tab === 'out' && row.dir !== 'out') return false;
            if (waiting) return false;
            return inRange(String(row.time || '').slice(0, 10), range, from, to);
        });
        return '<section class="rbt-party-wallet">' +
            '<div class="rbt-party-total"><span>账户总计</span>' +
            '<div><b>' + comma(view.balance) + '</b><em>总金额</em></div>' +
            '<div><b>' + comma(view.withdrawable) + '</b><em>可提现金额</em></div></div>' +
            '<div class="rbt-party-actions">' +
            (role === 'provider' ? '' : '<button type="button" data-wallet-go="recharge">充值</button>') +
            '<button type="button" class="is-primary" data-wallet-go="withdraw">提现</button></div>' +
            (opts.note ? '<p class="rbt-party-note">' + esc(opts.note) + '</p>' : '') +
            '<div class="rbt-party-ledger-head"><strong>账户明细</strong>' + timePill(range, from, to, !!opts.timeOpen) + '</div>' +
            '<div class="rbt-party-tabs" role="tablist">' +
            '<button type="button"' + (tab === 'all' ? ' class="is-on"' : '') + ' data-wallet-tab="all">全部</button>' +
            '<button type="button"' + (tab === 'in' ? ' class="is-on"' : '') + ' data-wallet-tab="in">收入</button>' +
            '<button type="button"' + (tab === 'out' ? ' class="is-on"' : '') + ' data-wallet-tab="out">支出</button>' +
            '</div>' +
            (waiting ? '<p class="rbt-party-empty rbt-party-empty--card">选择起止日期后查询</p>' : ledgerListHtml(list)) +
            (opts.timeOpen ? timeSheetHtml(range, from, to) : '') +
            '</section>';
    }

    function openPassword(host, amountText, onOk) {
        if (!host) return;
        var old = document.getElementById('rbtPartyPwd');
        if (old) old.remove();
        var pwd = '';
        var node = document.createElement('div');
        node.id = 'rbtPartyPwd';
        node.className = 'rbt-party-pwd';
        function paint() {
            var boxes = '';
            var i;
            for (i = 0; i < 6; i++) boxes += '<span' + (i < pwd.length ? ' class="is-on"' : '') + '></span>';
            var boxNode = node.querySelector('.rbt-party-pwd__boxes');
            if (boxNode) boxNode.innerHTML = boxes;
        }
        node.innerHTML = '<div class="rbt-party-pwd__mask" data-party-pwd-close></div>' +
            '<div class="rbt-party-pwd__panel" role="dialog" aria-modal="true" aria-label="请输入支付密码">' +
            '<div class="rbt-party-pwd__bar"><strong>请输入支付密码</strong><button type="button" data-party-pwd-close aria-label="关闭">×</button></div>' +
            '<div class="rbt-party-pwd__body"><p class="rbt-party-pwd__amount">¥' + esc(amountText) + '</p>' +
            '<div class="rbt-party-pwd__boxes"></div><p class="rbt-party-pwd__error"></p>' +
            '<p class="rbt-party-pwd__hint">未单独设置时，演示密码为 123456</p></div>' +
            '<div class="rbt-party-pwd__keys">' +
            '123456789'.split('').map(function (num) {
                return '<button type="button" data-party-key="' + num + '">' + num + '</button>';
            }).join('') +
            '<button type="button" disabled></button><button type="button" data-party-key="0">0</button>' +
            '<button type="button" data-party-key="del">删除</button></div></div>';
        node.addEventListener('click', function (event) {
            event.stopPropagation();
            if (event.target.closest('[data-party-pwd-close]')) {
                node.remove();
                return;
            }
            var keyBtn = event.target.closest('[data-party-key]');
            if (!keyBtn) return;
            var key = keyBtn.getAttribute('data-party-key');
            if (key === 'del') pwd = pwd.slice(0, -1);
            else if (pwd.length < 6) pwd += key;
            paint();
            if (pwd.length < 6) return;
            var result = verifyPassword(pwd);
            if (!result || !result.ok) {
                pwd = '';
                paint();
                var error = node.querySelector('.rbt-party-pwd__error');
                if (error) error.textContent = '密码输入错误，请重新输入';
                return;
            }
            node.remove();
            if (typeof onOk === 'function') onOk();
        });
        host.appendChild(node);
        paint();
    }

    global.RbtPartyWallet = {
        queryDate: queryDate,
        dateInRange: inRange,
        balanceOf: balanceOf,
        snapshot: snapshot,
        editAmount: editAmount,
        rechargeMethod: rechargeMethod,
        rechargeIssue: rechargeIssue,
        detectBank: detectBank,
        bindReady: bindReady,
        bindCard: bindCard,
        recharge: recharge,
        withdraw: withdraw,
        transferToSupply: transferToSupply,
        verifyPassword: verifyPassword,
        overviewHtml: overviewHtml,
        walletHtml: walletHtml,
        clearTimeSheet: clearTimeSheet,
        pinTimeSheet: pinTimeSheet,
        openPassword: openPassword
    };
})(window);
