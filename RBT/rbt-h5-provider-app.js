/* 服务商端只看收款。服务商不接单、不签销售合同和采购合同。 */
(function () {
    var SESSION_KEY = 'rbt_h5_provider_session';
    var DEMO_PASSWORD = '123456';
    var ACCOUNTS = [
        { phone: '13800001003', name: '宁波海丰商业保理有限公司' },
        { phone: '13800001000', name: '冷丰' }
    ];
    var PROVIDER_ACCOUNTS = {
        '宁波海丰商业保理有限公司': { accountName: '宁波海丰商业保理有限公司', accountNo: '6222080210001003009' },
        '冷丰': { accountName: '冷丰', accountNo: '6217000210001000001' }
    };

    var account = null;
    var screen = 'collect';
    var collectFilter = 'open';
    var collectCode = '';
    var fundTab = 'base';

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toast(message) {
        var node = document.getElementById('rbtH5Toast');
        if (!node) return;
        node.textContent = message;
        node.classList.add('is-on');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { node.classList.remove('is-on'); }, 2200);
    }

    function centsOf(value) {
        var text = String(value == null ? '' : value).replace(/^¥/, '').replace(/,/g, '');
        if (!text || text === '—') return null;
        var num = Number(text);
        if (!isFinite(num)) return null;
        return Math.round(num * 100);
    }

    function fromCents(cents) {
        var sign = cents < 0 ? '-' : '';
        var abs = Math.abs(Math.round(cents));
        return sign + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    function yuan(value) {
        if (value == null || value === '' || value === '—') return '—';
        return '¥' + value;
    }

    function phaseLabel(status) {
        if (status === '门店付款中' || status === '还款中') return '履约中';
        return status || '—';
    }

    function ratioPercent(value) {
        var num = Number(String(value == null ? '' : value).replace('%', ''));
        if (!isFinite(num)) return '';
        return num.toFixed(2) + '%';
    }

    function ratioText(item) {
        var api = window.RbtSettleRatio;
        if (item && item.repayMethod === '比例付' && api && typeof api.viewOf === 'function') {
            var view = api.viewOf(item) || [];
            var text = view.map(function (channel) {
                var percent = ratioPercent(channel.fallback);
                return percent ? (channel.channel + ' ' + percent) : '';
            }).filter(Boolean).join('；');
            if (text) return text;
        }
        return '—';
    }

    /* 服务商结算系数 = 1 + 服务商应收 / 商品金额。计提是系数超出 1 的部分。 */
    function providerCoeff(item) {
        var api = window.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var goods = centsOf(item && item.goodsAmount);
        var provider = centsOf(pack && pack.provider);
        if (!goods || provider == null) return '—';
        return (1 + provider / goods).toFixed(2);
    }

    function archiveOf(name) {
        var api = window.MdmProviderArchiveStore;
        var list = api && typeof api.list === 'function' ? api.list() : [];
        var found = null;
        (list || []).some(function (row) {
            if (!row) return false;
            if (row.name === name || row.subjectName === name || (row.license && row.license.name === name)) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function accountByPhone(phone) {
        return ACCOUNTS.filter(function (item) { return item.phone === phone; })[0] || null;
    }

    function loginBlock(item) {
        if (!item) return '手机号或密码不正确';
        var row = archiveOf(item.name);
        if (!row || row.subjectType !== '服务商') return '未在服务商档案中，无法登录';
        if (String(row.status || '').trim() === '冻结') return '该服务商已冻结，无法登录';
        if (String(row.status || '').trim() !== '正常') return '服务商状态非正常，无法登录';
        return '';
    }

    function readSession() {
        try {
            var raw = sessionStorage.getItem(SESSION_KEY);
            var data = raw ? JSON.parse(raw) : null;
            if (!data || !data.phone || !data.name) return null;
            if (loginBlock(data)) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function writeSession(item) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ phone: item.phone, name: item.name }));
    }

    function renderAccounts() {
        var box = document.getElementById('rbtH5Accounts');
        if (!box) return;
        box.innerHTML = '<h2>可登录账号</h2>' + ACCOUNTS.map(function (item) {
            return '<div class="rbt-h5-account"><strong>' + esc(item.name) + '</strong>' +
                '<button type="button" data-fill-phone="' + esc(item.phone) + '">' + esc(item.phone) + '</button></div>';
        }).join('');
    }

    function demands() {
        var api = window.RbtDemandData;
        return api && typeof api.list === 'function' ? api.list() : [];
    }

    /* 只看确认到当前服务商名下的单。没有服务商时计提留在冷丰，这里不出现。 */
    function mineDemands() {
        var name = account && account.name;
        return demands().filter(function (item) {
            if (!item || !name || item.providerName !== name) return false;
            var api = window.RbtDemandData;
            var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
            return centsOf(pack && pack.provider) != null;
        }).sort(function (a, b) {
            return String(b.acceptedAt || b.updatedAt || '').localeCompare(String(a.acceptedAt || a.updatedAt || ''));
        });
    }

    function closedBid(item) {
        return item && (item.status === '已完成' || item.status === '已作废' || item.status === '已驳回');
    }

    function fulfillingBid(item) {
        return item && (item.status === '门店付款中' || item.status === '还款中');
    }

    function collectDemands(closed) {
        return mineDemands().filter(function (item) {
            return closed ? closedBid(item) : fulfillingBid(item);
        });
    }

    /* 已结款是已经结清的营业日拆给服务商的金额。最近一天结算单未确定，明细行仍记待结款。 */
    function providerSettled(item) {
        var daily = window.RbtDailyFulfill;
        var rows = daily && typeof daily.payeeSplit === 'function' ? daily.payeeSplit(item) : [];
        if (!rows.length) return { total: '', shares: [] };
        var latest = '';
        var shares = rows.map(function (row) {
            return { date: row.date, time: row.time || '', channel: row.channel, kind: row.kind || '', amount: row.provider };
        }).filter(function (row) {
            if (row.kind !== 'manual') return true;
            return Math.round(Number(row.amount) * 100) > 0;
        });
        shares.forEach(function (row) {
            if (row.kind === 'manual') return;
            if (row.date > latest) latest = row.date;
        });
        var done = item && item.status === '已完成';
        var settledCents = 0;
        shares.forEach(function (row) {
            var cents = Math.round(Number(row.amount) * 100);
            if (!isFinite(cents)) cents = 0;
            /* 一键履约已经付过，按结算系数拆完即已结款。最近一个营业日仍等结算单。 */
            row.stage = !done && row.kind !== 'manual' && row.date === latest ? 'pending' : 'due';
            if (row.stage !== 'pending') settledCents += cents;
        });
        return { total: (settledCents / 100).toFixed(2), shares: shares };
    }

    /* 跟进中：待结款 = 应收 − 已结款。已结束已经结清，已结款等于应收，待结款为 0。 */
    function pendingOf(receivable, settled) {
        var due = centsOf(receivable);
        if (due == null) return '';
        var paid = centsOf(settled);
        if (paid == null) paid = 0;
        return fromCents(Math.max(0, due - paid));
    }

    function fundOf(item) {
        var api = window.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var receivable = pack && pack.provider ? String(pack.provider) : '';
        var settled = providerSettled(item);
        var settledText = settled.total;
        var pending = pendingOf(receivable, settledText);
        if (closedBid(item)) {
            var due = centsOf(receivable);
            if (due != null) {
                settledText = fromCents(due);
                pending = fromCents(0);
            }
        }
        return {
            receivable: receivable,
            goods: item && item.goodsAmount ? String(item.goodsAmount) : '',
            settled: settledText,
            pending: pending,
            shares: settled.shares,
            account: PROVIDER_ACCOUNTS[account && account.name] || null
        };
    }

    function sumMoney(rows, field) {
        var total = 0;
        var any = false;
        rows.forEach(function (row) {
            var cents = centsOf(row[field]);
            if (cents == null) return;
            any = true;
            total += cents;
        });
        return any ? fromCents(total) : '';
    }

    function paidClock(raw) {
        var matched = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})/);
        if (!matched) return '';
        return Number(matched[2]) + '月' + Number(matched[3]) + '日 ' + matched[4];
    }

    function settleClock(date) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return '';
        var day = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isNaN(day.getTime())) return '';
        day.setDate(day.getDate() + 1);
        return (day.getMonth() + 1) + '月' + day.getDate() + '日 08:00:00';
    }

    function setHead(text) {
        var title = document.querySelector('.rbt-h5-phone__head h1');
        var phone = document.getElementById('rbtH5Phone');
        if (phone && phone.classList.contains('is-app') && title) title.textContent = text || '收款';
    }

    function renderCollect() {
        var closed = collectFilter === 'closed';
        var rows = collectDemands(closed);
        var funds = rows.map(fundOf);
        var receivable = sumMoney(funds, 'receivable');
        var settled = sumMoney(funds, 'settled');
        var pending = sumMoney(funds, 'pending');
        setHead('收款');
        return '<div class="rbt-fund">' +
            '<div class="rbt-fund__tabs" role="tablist">' +
            '<button type="button" data-collect-view="open"' + (closed ? '' : ' class="is-on"') + '>履约中</button>' +
            '<button type="button" data-collect-view="closed"' + (closed ? ' class="is-on"' : '') + '>已结束</button>' +
            '</div>' +
            '<div class="rbt-fund__summary">' +
            '<div><span>笔数</span><b>' + rows.length + '</b></div>' +
            '<div><span>应收</span><b>' + esc(receivable ? yuan(receivable) : '—') + '</b></div>' +
            '<div><span>已结款</span><b>' + esc(settled ? yuan(settled) : '未产生') + '</b></div>' +
            '<div><span>待结款</span><b>' + esc(pending ? yuan(pending) : (closed ? '无' : '未产生')) + '</b></div>' +
            '</div>' +
            (rows.length ? rows.map(function (item) {
                var fund = fundOf(item);
                var tagClass = item.status === '已完成' ? ' is-done' : (item.status === '已作废' || item.status === '已驳回' ? ' is-off' : '');
                return '<button type="button" class="rbt-fund-card" data-collect="' + esc(item.code) + '">' +
                    '<div class="rbt-fund-card__top"><strong>' + esc(item.code) + '</strong>' +
                    '<span class="rbt-fund-card__tag' + tagClass + '">' + esc(phaseLabel(item.status)) + '</span></div>' +
                    '<p class="rbt-fund-card__store">' + esc(item.storeName || '—') + ' · ' + esc(item.traderName || '—') + '</p>' +
                    '<div class="rbt-fund-card__metrics">' +
                    '<div><span>应收</span><b>' + esc(yuan(fund.receivable)) + '</b></div>' +
                    '<div><span>已结款</span><b>' + esc(fund.settled ? yuan(fund.settled) : '未产生') + '</b></div>' +
                    '<div><span>待结款</span><b>' + esc(fund.pending ? yuan(fund.pending) : '未产生') + '</b></div>' +
                    '</div></button>';
            }).join('') : '<div class="rbt-h5-empty">' + (closed ? '暂无已结束的收款' : '暂无履约中的收款') + '</div>') +
            '</div>';
    }

    function renderBill(item) {
        var fund = fundOf(item);
        var payee = fund.account || { accountName: '—', accountNo: '—' };
        setHead('资金明细');
        var lines = [
            ['门店', item.storeName || '—'],
            ['贸易商', item.traderName || '—'],
            ['商品金额', yuan(fund.goods)],
            ['服务商结算系数', providerCoeff(item)],
            ['结算比例', ratioText(item)],
            ['创建时间', item.createdAt || '—'],
            ['已结款', fund.settled ? yuan(fund.settled) : '未产生'],
            ['待结款', fund.pending ? yuan(fund.pending) : '未产生'],
            ['收款账户名称', payee.accountName || '—'],
            ['收款账户', payee.accountNo || '—']
        ];
        var shares = fund.shares.slice().reverse();
        var detail = shares.length
            ? '<div class="rbt-share__head"><span>金额</span><span>结款状态</span><span>结款时间</span></div>' +
                shares.map(function (row) {
                    var pendingRow = row.stage === 'pending';
                    return '<div class="rbt-share__row"><b>' + esc(yuan(row.amount)) + '</b><em class="' +
                        (pendingRow ? '' : 'is-due') + '">' + (pendingRow ? '待结款' : '已结款') + '</em><span>' +
                        esc(pendingRow ? '-' : (row.kind === 'manual' ? (paidClock(row.time) || settleClock(row.date)) : settleClock(row.date))) + '</span></div>';
                }).join('')
            : '<p class="rbt-bill__empty">暂无结款明细</p>';
        return '<section class="rbt-bill__head">' +
            '<div class="rbt-bill__top"><span class="rbt-bill__code">' + esc(item.code) + '</span><span class="rbt-bill__tag">' +
            esc(phaseLabel(item.status)) + '</span></div>' +
            '<p class="rbt-bill__label">应收</p>' +
            '<p class="rbt-bill__amt">' + esc(fund.receivable && fund.receivable !== '—' ? fund.receivable : '—') + '</p>' +
            '<div class="rbt-bill__stats">' +
            '<div><span>结算周期</span><b>' + esc(item.repayCycle || '—') + '</b></div>' +
            '<div><span>结算方式</span><b>' + esc(item.repayMethod || '—') + '</b></div>' +
            '</div></section>' +
            '<div class="rbt-bill-tabs" role="tablist">' +
            '<button type="button" data-fund-tab="base"' + (fundTab === 'share' ? '' : ' class="is-on"') + '>基础信息</button>' +
            '<button type="button" data-fund-tab="share"' + (fundTab === 'share' ? ' class="is-on"' : '') + '>结款明细</button>' +
            '</div>' +
            (fundTab === 'share'
                ? '<section class="rbt-bill__sheet' + (shares.length ? '' : ' rbt-bill__sheet--blank') + '">' + detail + '</section>'
                : '<section class="rbt-bill__sheet">' + lines.map(function (line) {
                    return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
                }).join('') + '</section>');
    }

    function render() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var back = document.getElementById('rbtH5HeadBack');
        if (!phone || !scroll) return;
        if (!account) {
            phone.classList.add('is-login');
            phone.classList.remove('is-app');
            if (back) back.classList.remove('is-on');
            var title = document.querySelector('.rbt-h5-phone__head h1');
            if (title) title.textContent = '服务商端';
            return;
        }
        phone.classList.remove('is-login');
        phone.classList.add('is-app');
        if (back) back.classList.toggle('is-on', screen === 'bill');
        if (screen === 'bill') {
            var item = mineDemands().filter(function (row) { return row.code === collectCode; })[0];
            scroll.innerHTML = item ? renderBill(item) : '<div class="rbt-h5-empty">资金明细不存在</div>';
            return;
        }
        scroll.innerHTML = renderCollect();
    }

    function openAccount(item) {
        account = { phone: item.phone, name: item.name };
        writeSession(account);
        screen = 'collect';
        collectFilter = 'open';
        collectCode = '';
        fundTab = 'base';
        render();
    }

    function submitLogin(event) {
        if (event) event.preventDefault();
        var phone = String((document.querySelector('[data-phone="login"]') || {}).value || '').replace(/\D/g, '');
        var password = String((document.querySelector('[data-password="login"]') || {}).value || '');
        var item = accountByPhone(phone);
        if (!item || password !== DEMO_PASSWORD) {
            toast('手机号或密码不正确');
            return;
        }
        var block = loginBlock(item);
        if (block) {
            toast(block);
            return;
        }
        openAccount(item);
    }

    document.addEventListener('click', function (event) {
        var fill = event.target.closest('[data-fill-phone]');
        if (fill) {
            var phoneInput = document.querySelector('[data-phone="login"]');
            var passwordInput = document.querySelector('[data-password="login"]');
            if (phoneInput) phoneInput.value = fill.getAttribute('data-fill-phone') || '';
            if (passwordInput) passwordInput.value = DEMO_PASSWORD;
            return;
        }
        if (!account) return;
        var view = event.target.closest('[data-collect-view]');
        if (view) {
            collectFilter = view.getAttribute('data-collect-view') === 'closed' ? 'closed' : 'open';
            screen = 'collect';
            render();
            return;
        }
        var card = event.target.closest('[data-collect]');
        if (card) {
            collectCode = card.getAttribute('data-collect') || '';
            fundTab = 'base';
            screen = 'bill';
            render();
            return;
        }
        var tab = event.target.closest('[data-fund-tab]');
        if (tab && screen === 'bill') {
            fundTab = tab.getAttribute('data-fund-tab') === 'share' ? 'share' : 'base';
            render();
        }
    });

    var form = document.getElementById('rbtH5LoginForm');
    if (form) form.addEventListener('submit', submitLogin);
    var back = document.getElementById('rbtH5HeadBack');
    if (back) back.addEventListener('click', function () {
        if (screen !== 'bill') return;
        screen = 'collect';
        render();
    });

    renderAccounts();
    var saved = readSession();
    if (saved) openAccount(saved);
})();
