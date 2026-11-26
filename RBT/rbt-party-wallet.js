/* 贸易商、服务商钱包与结款总览。
   钱包只保留余额账户：可充值、可提现，没有保证金账户，也没有货款账户。
   已到账结款记入余额。贸易商合同全部签完后，按商品金额划转给冷丰供应链。 */
(function (global) {
    var KEY = 'rbt_party_wallet_v1';
    var OPENING = {
        '杭州鲜达贸易有限公司': 100000,
        '上海冷链融资租赁有限公司': 200000
    };

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
        return {
            recharge: Array.isArray(bag.recharge) ? bag.recharge : [],
            withdraw: Array.isArray(bag.withdraw) ? bag.withdraw : [],
            transfer: Array.isArray(bag.transfer) ? bag.transfer : []
        };
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

    function receiptLines(role, name) {
        var api = global.RbtDemandData;
        var daily = global.RbtDailyFulfill;
        if (!name || !api || typeof api.list !== 'function' || !daily || typeof daily.payeeSplit !== 'function') return [];
        var field = role === 'provider' ? 'provider' : 'trader';
        var lines = [];
        (api.list() || []).forEach(function (item) {
            if (!item) return;
            if (role === 'provider') {
                if (item.providerName !== name) return;
            } else if (item.traderName !== name) return;
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
                var when = row.kind === 'manual' ? (row.time || '') : (addDays(row.date, 1) + ' 08:00:00');
                lines.push({
                    id: 'receipt:' + item.code + ':' + (row.id || row.date + ':' + row.channel),
                    time: when,
                    dir: 'in',
                    title: '结款入账 · ' + item.code,
                    amount: amount,
                    kind: 'receipt'
                });
            });
        });
        return lines;
    }

    function movementLines(name) {
        var bag = bagOf(name);
        return bag.recharge.map(function (row) {
            return { id: row.id, time: row.time, dir: 'in', title: (row.method || '充值') + '充值', amount: round2(row.amount), kind: 'recharge' };
        }).concat(bag.withdraw.map(function (row) {
            return { id: row.id, time: row.time, dir: 'out', title: '提现到收款账户', amount: round2(row.amount), kind: 'withdraw' };
        })).concat(bag.transfer.map(function (row) {
            return { id: row.code, time: row.time, dir: 'out', title: '划转冷丰供应链 · ' + row.code, amount: round2(row.amount), kind: 'transfer' };
        }));
    }

    function ledgerOf(role, name) {
        return receiptLines(role, name).concat(movementLines(name)).filter(function (row) {
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

    function recharge(role, name, amount, method) {
        if (role !== 'trader') return { ok: false, message: '服务商钱包不支持充值' };
        var value = round2(amount);
        if (!(value > 0)) return { ok: false, message: '请填写大于 0 的充值金额' };
        var bag = bagOf(name);
        bag.recharge.push({
            id: 'recharge:' + Date.now(),
            amount: value,
            method: method === '微信' ? '微信' : '支付宝',
            time: nowText()
        });
        saveBag(name, bag);
        return { ok: true, balance: balanceOf(role, name) };
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
        var count = 0;
        var stores = {};
        var days = {};
        rows.forEach(function (row) {
            var amount = round2((row.cents || 0) / 100);
            var store = row.store || '—';
            var date = row.date || '—';
            if (!stores[store]) stores[store] = { settled: 0, pending: 0, count: 0 };
            if (!days[date]) days[date] = { settled: 0, pending: 0, count: 0 };
            if (row.pending) {
                pending += amount;
                stores[store].pending += amount;
                days[date].pending += amount;
                return;
            }
            settled += amount;
            count += 1;
            stores[store].settled += amount;
            stores[store].count += 1;
            days[date].settled += amount;
            days[date].count += 1;
            if (row.kind === 'manual') manual += amount;
            else daily += amount;
        });
        var storeRows = Object.keys(stores).map(function (name) {
            return { name: name, settled: stores[name].settled, pending: stores[name].pending, count: stores[name].count };
        }).sort(function (a, b) { return b.settled - a.settled || a.name.localeCompare(b.name, 'zh'); });
        var dayRows = Object.keys(days).sort().reverse();
        var body = waiting
            ? '<p class="rbt-party-empty">选择起止日期后查询</p>'
            : (!rows.length
                ? '<p class="rbt-party-empty">该时段暂无结款</p>'
                : '<section class="rbt-party-block"><h3>按门店</h3>' + storeRows.map(function (row) {
                    return '<div class="rbt-party-line"><b>' + esc(row.name) + '</b>' +
                        '<span>已结款 ¥' + comma(row.settled) + '</span>' +
                        '<span>待结款 ¥' + comma(row.pending) + '</span>' +
                        '<em>' + row.count + ' 笔</em></div>';
                }).join('') + '</section>' +
                '<section class="rbt-party-block"><h3>按日</h3>' + dayRows.map(function (date) {
                    var row = days[date];
                    return '<div class="rbt-party-line"><b>' + esc(date) + '</b>' +
                        '<span>已结款 ¥' + comma(row.settled) + '</span>' +
                        '<span>待结款 ¥' + comma(row.pending) + '</span>' +
                        '<em>' + row.count + ' 笔</em></div>';
                }).join('') + '</section>');
        return '<section class="rbt-party-overview">' +
            '<div class="rbt-party-chips">' +
            chip('近7天', mode === '7', 'data-ov-mode', '7') +
            chip('近30天', mode === '30', 'data-ov-mode', '30') +
            chip('全部', mode === 'all', 'data-ov-mode', 'all') +
            chip('自定义', mode === 'custom', 'data-ov-mode', 'custom') +
            '</div>' +
            (mode === 'custom' ? dateFields(from, to, 'data-ov-from', 'data-ov-to', 'data-ov-apply') : '') +
            '<p class="rbt-party-note">已结款按到账日，待结款按营业日，提前支付按支付日。只汇总结款明细里的金额。</p>' +
            '<div class="rbt-party-hero"><span>已结款</span><b>¥' + (waiting ? '—' : comma(settled)) + '</b></div>' +
            '<div class="rbt-party-metrics">' +
            '<div><span>待结款</span><b>' + (waiting ? '—' : ('¥' + comma(pending))) + '</b></div>' +
            '<div><span>已结款笔数</span><b>' + (waiting ? '—' : String(count)) + '</b></div>' +
            '<div><span>当日支付</span><b>' + (waiting ? '—' : ('¥' + comma(daily))) + '</b></div>' +
            '<div><span>提前支付</span><b>' + (waiting ? '—' : ('¥' + comma(manual))) + '</b></div>' +
            '</div>' + body + '</section>';
    }

    function walletHtml(opts) {
        opts = opts || {};
        var role = opts.role === 'provider' ? 'provider' : 'trader';
        var view = snapshot(role, opts.name);
        var pane = opts.pane === 'recharge' || opts.pane === 'withdraw' ? opts.pane : 'main';
        if (role !== 'trader' && pane === 'recharge') pane = 'main';
        var account = opts.account || {};
        if (pane === 'recharge') {
            var method = opts.method === '微信' ? '微信' : '支付宝';
            return '<section class="rbt-party-form">' +
                '<p class="rbt-party-note">充值进入余额账户。合同全部签署后，按该需求的商品金额划转至冷丰供应链。支付宝、微信在对方完成密码验证。</p>' +
                '<label class="rbt-party-amount"><span>充值金额</span><input id="rbtWalletAmount" inputmode="decimal" placeholder="0.00" autocomplete="off" value="' + esc(opts.draft || '') + '"><em>元</em></label>' +
                '<button type="button" class="rbt-party-method' + (method === '支付宝' ? ' is-on' : '') + '" data-wallet-method="支付宝"><i>支</i><span>支付宝</span></button>' +
                '<button type="button" class="rbt-party-method' + (method === '微信' ? ' is-on' : '') + '" data-wallet-method="微信"><i class="is-wx">微</i><span>微信</span></button>' +
                '<button type="button" class="rbt-party-submit" data-wallet-submit="recharge">确认充值</button></section>';
        }
        if (pane === 'withdraw') {
            return '<section class="rbt-party-form">' +
                '<p class="rbt-party-note">可提现 ¥' + comma(view.withdrawable) + '。提现到下方收款账户，需先验证平台支付密码。</p>' +
                '<label class="rbt-party-amount"><span>提现金额</span><input id="rbtWalletAmount" inputmode="decimal" placeholder="0.00" autocomplete="off" value="' + esc(opts.draft || '') + '"><em>元</em></label>' +
                '<div class="rbt-party-account"><span>收款账户</span><b>' + esc(account.accountName || '—') + '</b><em>' + esc(account.accountNo || '—') + '</em></div>' +
                '<button type="button" class="rbt-party-submit" data-wallet-submit="withdraw">确认提现</button></section>';
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
            '<div class="rbt-party-acct"><strong>余额账户</strong><p>余额 ¥' + comma(view.balance) + '</p><p>可提款 ¥' + comma(view.withdrawable) + '</p></div>' +
            '<div class="rbt-party-actions">' +
            (role === 'trader' ? '<button type="button" data-wallet-go="recharge">充值</button>' : '') +
            '<button type="button" class="is-primary" data-wallet-go="withdraw">提现</button></div>' +
            '<p class="rbt-party-note">' + esc(opts.note || '收款到账后可从本钱包提现。没有保证金账户，也没有货款账户。') + '</p>' +
            '<div class="rbt-party-ledger-head"><strong>账户明细</strong></div>' +
            '<div class="rbt-party-chips">' +
            chip('全部', tab === 'all', 'data-wallet-tab', 'all') +
            chip('收入', tab === 'in', 'data-wallet-tab', 'in') +
            chip('支出', tab === 'out', 'data-wallet-tab', 'out') +
            '</div>' +
            '<div class="rbt-party-chips">' +
            chip('近7天', range === '7', 'data-wallet-range', '7') +
            chip('近30天', range === '30', 'data-wallet-range', '30') +
            chip('全部', range === 'all', 'data-wallet-range', 'all') +
            chip('自定义', range === 'custom', 'data-wallet-range', 'custom') +
            '</div>' +
            (range === 'custom' ? dateFields(from, to, 'data-wallet-from', 'data-wallet-to', 'data-wallet-apply') : '') +
            (list.length ? list.map(function (row) {
                return '<div class="rbt-party-ledger"><b>' + esc(row.title) + '</b><span>' + esc(row.time || '—') + '</span>' +
                    '<em class="' + (row.dir === 'out' ? 'is-out' : '') + '">' + (row.dir === 'out' ? '-' : '+') + '¥' + comma(row.amount) + '</em></div>';
            }).join('') : '<p class="rbt-party-empty">' + (waiting ? '选择起止日期后查询' : '该时段暂无明细') + '</p>') +
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
        balanceOf: balanceOf,
        snapshot: snapshot,
        recharge: recharge,
        withdraw: withdraw,
        transferToSupply: transferToSupply,
        verifyPassword: verifyPassword,
        overviewHtml: overviewHtml,
        walletHtml: walletHtml,
        openPassword: openPassword
    };
})(window);
