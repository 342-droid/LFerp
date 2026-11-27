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
    var screen = 'home';
    var collectFilter = 'open';
    var collectCode = '';
    var fundTab = 'base';
    var contractKey = '';
    var overviewMode = '30';
    var overviewFrom = '';
    var overviewTo = '';
    var walletPane = 'main';
    var walletTab = 'all';
    var walletRange = '30';
    var walletFrom = '';
    var walletTo = '';
    var walletTimeOpen = false;
    var walletMethod = '';
    var walletSheet = '';
    var walletBind = { cardNo: '', bankId: '', phone: '', sms: '', sheet: '', modal: '' };
    var walletDraft = '';

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
        if (status === '门店付款中' || status === '还款中') return '付款中';
        return status || '—';
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

    /* 已结款只计已经到账、拆给服务商的金额。已冻结和在途仍是待结款。服务商份额不进冷丰、贸易商的自动转账。 */
    function providerSettled(item) {
        var daily = window.RbtDailyFulfill;
        var rows = daily && typeof daily.payeeSplit === 'function' ? daily.payeeSplit(item) : [];
        if (!rows.length) return { total: '', shares: [] };
        var facts = {};
        if (typeof daily.daysOf === 'function') {
            daily.daysOf(item).forEach(function (row) {
                if (row && row.id) facts[row.id] = row;
            });
        }
        var shares = rows.map(function (row) {
            var fact = facts[row.id] || {};
            return {
                date: row.date,
                time: row.time || '',
                channel: row.channel,
                kind: row.kind || '',
                amount: row.provider,
                fundStatus: row.kind === 'manual' ? 'arrived' : (fact.fundStatus || '')
            };
        }).filter(function (row) {
            if (row.kind !== 'manual') return true;
            return Math.round(Number(row.amount) * 100) > 0;
        });
        var settledCents = 0;
        shares.forEach(function (row) {
            var cents = Math.round(Number(row.amount) * 100);
            if (!isFinite(cents)) cents = 0;
            var open = row.fundStatus === 'inflight' || row.fundStatus === 'frozen' || row.fundStatus === 'missing' || row.fundStatus === 'pending_freeze';
            row.stage = row.kind !== 'manual' && open ? 'pending' : 'due';
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
            '<button type="button" data-collect-view="open"' + (closed ? '' : ' class="is-on"') + '>付款中</button>' +
            '<button type="button" data-collect-view="closed"' + (closed ? ' class="is-on"' : '') + '>已结束</button>' +
            '</div>' +
            '<div class="rbt-fund__summary">' +
            '<p class="rbt-fund__summary-name">汇总</p>' +
            '<div class="rbt-fund__summary-metrics">' +
            '<div><span>笔数</span><b>' + rows.length + '</b></div>' +
            '<div><span>应收</span><b>' + esc(receivable ? yuan(receivable) : '—') + '</b></div>' +
            '<div><span>已结款</span><b>' + esc(settled ? yuan(settled) : '未产生') + '</b></div>' +
            '<div><span>待结款</span><b>' + esc(pending ? yuan(pending) : (closed ? '无' : '未产生')) + '</b></div>' +
            '</div></div>' +
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
            }).join('') : '<div class="rbt-h5-empty">' + (closed ? '暂无已结束的收款' : '暂无付款中的收款') + '</div>') +
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
            ['创建时间', item.createdAt || '—'],
            ['签署时间', effectTimeOf(item) || '—'],
            ['已结款', fund.settled ? yuan(fund.settled) : '未产生'],
            ['待结款', fund.pending ? yuan(fund.pending) : '未产生'],
            ['收款账户名称', payee.accountName || '—'],
            ['收款账户', payee.accountNo || '—']
        ];
        var shares = fund.shares.slice().reverse();
        var detail = shares.length
            ? '<div class="rbt-share__head"><span>结款时间</span><span>金额</span><span>结款状态</span></div>' +
                shares.map(function (row) {
                    var pendingRow = row.stage === 'pending';
                    return '<div class="rbt-share__row"><span>' +
                        esc(pendingRow ? '-' : (row.kind === 'manual' ? (paidClock(row.time) || settleClock(row.date)) : settleClock(row.date))) +
                        '</span><b>' + esc(yuan(row.amount)) + '</b><em class="' +
                        (pendingRow ? '' : 'is-due') + '">' + (pendingRow ? '待结款' : '已结款') + '</em></div>';
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
            '<button type="button" data-fund-tab="base"' + (fundTab === 'base' ? ' class="is-on"' : '') + '>基础信息</button>' +
            '<button type="button" data-fund-tab="share"' + (fundTab === 'share' ? ' class="is-on"' : '') + '>结款明细</button>' +
            '<button type="button" data-fund-tab="overview"' + (fundTab === 'overview' ? ' class="is-on"' : '') + '>结款总览</button>' +
            '</div>' +
            (fundTab === 'share'
                ? '<section class="rbt-bill__sheet' + (shares.length ? '' : ' rbt-bill__sheet--blank') + '">' + detail + '</section>'
                : fundTab === 'overview'
                    ? '<section class="rbt-bill__sheet">' + renderOverview() + '</section>'
                    : '<section class="rbt-bill__sheet">' + lines.map(function (line) {
                        return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
                    }).join('') + renderSignedContracts(item) + '</section>');
    }

    function signedContracts(item) {
        var api = window.RbtDemandData;
        if (!item || !api || typeof api.signContracts !== 'function') return [];
        return api.signContracts(item).filter(function (contract) {
            return contract && contract.signStatus === '已签署';
        });
    }

    function renderSignedContracts(item) {
        var contracts = signedContracts(item);
        var value = contracts.length
            ? contracts.map(function (contract) {
                return '<button type="button" class="rbt-bill__contract" data-contract="' + esc(contract.key) + '">' +
                    esc(contract.name) + '</button>';
            }).join('')
            : '—';
        return '<div class="rbt-bill__line"><span>签署合同</span><b>' + value + '</b></div>';
    }

    function effectTimeOf(item) {
        var contracts = signedContracts(item);
        var api = window.RbtDemandData;
        var all = api && typeof api.signContracts === 'function' ? api.signContracts(item) : [];
        if (!all.length || all.length !== contracts.length) return '';
        var latest = '';
        contracts.forEach(function (contract) {
            (contract.parties || []).forEach(function (party) {
                if (party && party.signedAt && party.signedAt > latest) latest = party.signedAt;
            });
        });
        return latest;
    }

    function renderContract(item) {
        var contract = signedContracts(item).filter(function (row) { return row.key === contractKey; })[0];
        setHead(contract && contract.name || '签署合同');
        if (!contract) return '<div class="rbt-h5-empty">合同不存在</div>';
        var parties = (contract.parties || []).map(function (party) {
            return '<div class="rbt-bill__line"><span>' + esc(party.roleLabel || '签署方') + '</span><b>' +
                esc((party.name || '—') + ' ' + (party.signedAt || '—')) + '</b></div>';
        }).join('');
        return '<section class="rbt-bill__sheet">' +
            '<div class="rbt-bill__line"><span>合同编号</span><b>' + esc(contract.code || '—') + '</b></div>' +
            '<div class="rbt-bill__line"><span>状态</span><b>已签署</b></div>' +
            '<div class="rbt-bill__line"><span>生效时间</span><b>' + esc(effectTimeOf(item) || '—') + '</b></div>' +
            parties + '</section>';
    }

    function providerOverviewRows() {
        var wallet = window.RbtPartyWallet;
        var rows = [];
        mineDemands().forEach(function (item) {
            if (!fulfillingBid(item) && !closedBid(item)) return;
            (fundOf(item).shares || []).forEach(function (share) {
                var amount = centsOf(share.amount);
                if (amount == null) return;
                rows.push({
                    date: wallet && wallet.queryDate ? wallet.queryDate(share) : (share.date || ''),
                    cents: amount,
                    pending: share.stage === 'pending',
                    store: item.storeName || '—',
                    kind: share.kind === 'manual' ? 'manual' : 'daily',
                    code: item.code
                });
            });
        });
        return rows;
    }

    function toolIcon(path) {
        return '<span class="rbt-party-home__icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + path + '</svg></span>';
    }

    function renderHome() {
        var name = account && account.name ? account.name : '服务商';
        setHead('首页');
        return '<div class="rbt-party-home"><header class="rbt-party-home__bar"><span class="rbt-party-home__avatar">' +
            esc(name.slice(0, 1)) + '</span><strong class="rbt-party-home__name">' + esc(name) + '</strong></header>' +
            '<section class="rbt-party-home__card"><h2>基础工具</h2><div class="rbt-party-home__grid">' +
            '<button type="button" data-entry="collect">' + toolIcon('<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>') + '收款</button>' +
            '<button type="button" data-entry="wallet">' + toolIcon('<rect x="3" y="6" width="18" height="13" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M3 10h18" stroke="#fff" stroke-width="1.6"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/>') + '钱包</button>' +
            '</div></section></div>';
    }

    function renderOverview() {
        var wallet = window.RbtPartyWallet;
        if (!wallet) return '<div class="rbt-h5-empty">结款总览不可用</div>';
        return wallet.overviewHtml({ rows: providerOverviewRows(), mode: overviewMode, from: overviewFrom, to: overviewTo });
    }

    function renderWallet() {
        var titles = { recharge: '充值', withdraw: '提现', bind: '绑定银行卡' };
        setHead(titles[walletPane] || '钱包');
        var wallet = window.RbtPartyWallet;
        if (!wallet) return '<div class="rbt-h5-empty">钱包不可用</div>';
        return wallet.walletHtml({
            role: 'provider',
            name: account && account.name,
            pane: walletPane,
            method: walletMethod,
            sheet: walletSheet,
            bind: walletBind,
            holder: account && account.name,
            tab: walletTab,
            range: walletRange,
            from: walletFrom,
            to: walletTo,
            timeOpen: walletTimeOpen,
            draft: walletDraft,
            account: PROVIDER_ACCOUNTS[account && account.name] || null,
            note: '已到账的结款记入余额，可提现到收款账户。没有保证金账户，也没有货款账户。'
        });
    }

    function partyRange(kind) {
        var from = String((document.querySelector(kind === 'overview' ? '[data-ov-from]' : '[data-wallet-from]') || {}).value || '');
        var to = String((document.querySelector(kind === 'overview' ? '[data-ov-to]' : '[data-wallet-to]') || {}).value || '');
        if (!from || !to) {
            toast('请选择起止日期');
            return;
        }
        if (from > to) {
            toast('开始日期不能晚于结束日期');
            return;
        }
        if (kind === 'overview') {
            overviewMode = 'custom';
            overviewFrom = from;
            overviewTo = to;
        } else {
            walletRange = 'custom';
            walletFrom = from;
            walletTo = to;
            walletTimeOpen = false;
        }
        render();
    }

    function render() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var back = document.getElementById('rbtH5HeadBack');
        if (!phone || !scroll) return;
        if (window.RbtPartyWallet && window.RbtPartyWallet.clearTimeSheet) window.RbtPartyWallet.clearTimeSheet();
        scroll.classList.toggle('is-collect', !!account && (screen === 'collect' || screen === 'wallet'));
        scroll.classList.toggle('is-party-home', !!account && screen === 'home');
        phone.classList.toggle('is-party-home', !!account && screen === 'home');
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
        if (back) back.classList.toggle('is-on', screen !== 'home');
        if (screen === 'home') {
            scroll.innerHTML = renderHome();
            return;
        }
        if (screen === 'wallet') {
            scroll.innerHTML = renderWallet();
            if (window.RbtPartyWallet && window.RbtPartyWallet.pinTimeSheet) window.RbtPartyWallet.pinTimeSheet();
            return;
        }
        if (screen === 'contract') {
            var contractItem = mineDemands().filter(function (row) { return row.code === collectCode; })[0];
            scroll.innerHTML = contractItem ? renderContract(contractItem) : '<div class="rbt-h5-empty">合同不存在</div>';
            return;
        }
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
        screen = 'home';
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

    function readBindFields() {
        var card = document.querySelector('[data-wallet-bind="cardNo"]');
        var phone = document.querySelector('[data-wallet-bind="phone"]');
        var sms = document.querySelector('[data-wallet-bind="sms"]');
        if (card) walletBind.cardNo = String(card.value || '').replace(/\D/g, '').slice(0, 19);
        if (phone) walletBind.phone = String(phone.value || '').replace(/\D/g, '').slice(0, 11);
        if (sms) walletBind.sms = String(sms.value || '').replace(/\D/g, '').slice(0, 6);
    }

    function syncBindSubmit() {
        var button = document.querySelector('[data-wallet-bind-submit]');
        var api = window.RbtPartyWallet;
        if (button && api && api.bindReady) button.disabled = !api.bindReady(walletBind);
    }

    function handleBindClick(event) {
        if (screen !== 'wallet' || walletPane !== 'bind') return false;
        var api = window.RbtPartyWallet;
        var partyName = account && account.name;
        if (event.target.closest('[data-wallet-holder-info]')) {
            readBindFields();
            walletBind.modal = 'holder';
            walletBind.sheet = '';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-bank-open]')) {
            readBindFields();
            walletBind.sheet = 'bank';
            walletBind.modal = '';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-bind-close]')) {
            readBindFields();
            walletBind.sheet = '';
            walletBind.modal = '';
            render();
            return true;
        }
        var bankBtn = event.target.closest('[data-wallet-bank]');
        if (bankBtn) {
            readBindFields();
            walletBind.bankId = bankBtn.getAttribute('data-wallet-bank') || '';
            walletBind.sheet = '';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-sms]')) {
            readBindFields();
            if (!/^\d{11}$/.test(walletBind.phone)) {
                toast('请输入银行预留手机号');
                return true;
            }
            toast('验证码已发送（演示码 123456）');
            return true;
        }
        if (event.target.closest('[data-wallet-bind-submit]')) {
            readBindFields();
            var result = api && api.bindCard ? api.bindCard(partyName, walletBind) : { ok: false };
            if (!result || !result.ok) {
                toast((result && result.message) || '绑定银行卡失败，请重新绑定。');
                return true;
            }
            walletMethod = 'card:' + result.card.id;
            walletBind = { cardNo: '', bankId: '', phone: '', sms: '', sheet: '', modal: '' };
            walletPane = 'recharge';
            walletSheet = '';
            toast('绑定成功');
            render();
            return true;
        }
        return false;
    }

    function submitPartyRecharge(role, name, raw, wallet) {
        var issue = wallet.rechargeIssue ? wallet.rechargeIssue(name, walletMethod, raw) : '';
        if (issue) {
            toast(issue);
            return;
        }
        var method = wallet.rechargeMethod ? wallet.rechargeMethod(name, walletMethod) : null;
        var channel = method && method.channel ? method.channel : '支付宝';
        var methodId = method && method.id ? method.id : walletMethod;
        function finish() {
            var result = wallet.recharge(role, name, raw, methodId);
            if (!result || !result.ok) {
                toast((result && result.message) || '充值失败');
                return;
            }
            walletDraft = '';
            walletPane = 'main';
            toast('充值成功');
            render();
        }
        if (methodId === 'alipay' || methodId === 'wechat') {
            toast('正在跳转' + channel + '，请在' + channel + '完成密码验证');
            setTimeout(finish, 600);
            return;
        }
        finish();
    }

    document.addEventListener('input', function (event) {
        var input = event.target.closest('[data-wallet-bind]');
        if (!input || screen !== 'wallet') return;
        var key = input.getAttribute('data-wallet-bind');
        var digits = String(input.value || '').replace(/\D/g, '');
        if (key === 'cardNo') {
            digits = digits.slice(0, 19);
            input.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
            walletBind.cardNo = digits;
            if (!walletBind.bankId && window.RbtPartyWallet && window.RbtPartyWallet.detectBank) {
                var bank = window.RbtPartyWallet.detectBank(digits);
                var nameNode = document.querySelector('[data-wallet-bank-open] span');
                var bankBtn = document.querySelector('[data-wallet-bank-open]');
                if (bank && nameNode) {
                    walletBind.bankId = bank.id;
                    nameNode.textContent = bank.name;
                    if (bankBtn) bankBtn.classList.remove('is-empty');
                }
            }
        } else if (key === 'phone') {
            digits = digits.slice(0, 11);
            input.value = digits;
            walletBind.phone = digits;
        } else {
            digits = digits.slice(0, 6);
            input.value = digits;
            walletBind.sms = digits;
        }
        syncBindSubmit();
    });

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
        var entry = event.target.closest('[data-entry]');
        if (entry) {
            var next = entry.getAttribute('data-entry');
            screen = next === 'wallet' ? 'wallet' : 'collect';
            if (screen === 'wallet') walletPane = 'main';
            if (screen === 'collect') collectFilter = 'open';
            render();
            return;
        }
        var contractBtn = event.target.closest('[data-contract]');
        if (contractBtn && screen === 'bill') {
            contractKey = contractBtn.getAttribute('data-contract') || '';
            screen = 'contract';
            render();
            return;
        }
        var ovMode = event.target.closest('[data-ov-mode]');
        if (ovMode && screen === 'bill') {
            overviewMode = ovMode.getAttribute('data-ov-mode') || '30';
            render();
            return;
        }
        if (event.target.closest('[data-ov-apply]') && screen === 'bill') {
            partyRange('overview');
            return;
        }
        if (screen === 'wallet') {
            var walletGo = event.target.closest('[data-wallet-go]');
            if (walletGo) {
                walletPane = walletGo.getAttribute('data-wallet-go') === 'recharge' ? 'recharge' : 'withdraw';
                walletDraft = '';
                walletSheet = '';
                walletTimeOpen = false;
                render();
                return;
            }
            var walletKey = event.target.closest('[data-wallet-key]');
            if (walletKey) {
                var amountApi = window.RbtPartyWallet;
                walletDraft = amountApi && amountApi.editAmount ? amountApi.editAmount(walletDraft, walletKey.getAttribute('data-wallet-key')) : walletDraft;
                render();
                return;
            }
            if (event.target.closest('[data-wallet-method-open]')) {
                walletSheet = 'method';
                render();
                return;
            }
            if (event.target.closest('[data-wallet-sheet-close]')) {
                walletSheet = '';
                render();
                return;
            }
            var walletPick = event.target.closest('[data-wallet-pick]');
            if (walletPick) {
                walletMethod = walletPick.getAttribute('data-wallet-pick') || '';
                walletSheet = '';
                render();
                return;
            }
            if (event.target.closest('[data-wallet-add-card]')) {
                walletBind = { cardNo: '', bankId: '', phone: '', sms: '', sheet: '', modal: '' };
                walletPane = 'bind';
                walletSheet = '';
                render();
                return;
            }
            if (handleBindClick(event)) return;
            if (event.target.closest('[data-wallet-all]')) {
                var snapApi = window.RbtPartyWallet;
                var snap = snapApi && snapApi.snapshot ? snapApi.snapshot('provider', account && account.name) : null;
                walletDraft = snap ? Number(snap.withdrawable || 0).toFixed(2) : '';
                render();
                return;
            }
            if (event.target.closest('[data-wallet-time]')) {
                walletTimeOpen = !walletTimeOpen;
                render();
                return;
            }
            if (event.target.closest('[data-wallet-time-close]')) {
                walletTimeOpen = false;
                render();
                return;
            }
            var walletTabBtn = event.target.closest('[data-wallet-tab]');
            if (walletTabBtn) {
                walletTab = walletTabBtn.getAttribute('data-wallet-tab') || 'all';
                render();
                return;
            }
            var walletRangeBtn = event.target.closest('[data-wallet-range]');
            if (walletRangeBtn) {
                walletRange = walletRangeBtn.getAttribute('data-wallet-range') || '30';
                walletTimeOpen = walletRange === 'custom';
                render();
                return;
            }
            if (event.target.closest('[data-wallet-apply]')) {
                partyRange('wallet');
                return;
            }
            var walletSubmit = event.target.closest('[data-wallet-submit]');
            if (walletSubmit) {
                var raw = walletDraft;
                if (!/^\d+(\.\d{1,2})?$/.test(raw) || !(Number(raw) > 0)) {
                    toast('请填写金额，最多两位小数');
                    return;
                }
                var phone = document.getElementById('rbtH5Phone');
                var wallet = window.RbtPartyWallet;
                if (!wallet || !phone) return;
                if (walletSubmit.getAttribute('data-wallet-submit') === 'recharge') {
                    submitPartyRecharge('provider', account && account.name, raw, wallet);
                    return;
                }
                wallet.openPassword(phone, Number(raw).toFixed(2), function () {
                    var result = wallet.withdraw('provider', account && account.name, raw);
                    walletDraft = '';
                    if (!result || !result.ok) {
                        toast((result && result.message) || '提现失败');
                        return;
                    }
                    walletPane = 'main';
                    toast('提现已提交');
                    render();
                });
                return;
            }
        }
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
            var nextTab = tab.getAttribute('data-fund-tab');
            fundTab = nextTab === 'share' || nextTab === 'overview' ? nextTab : 'base';
            render();
        }
    });

    var form = document.getElementById('rbtH5LoginForm');
    if (form) form.addEventListener('submit', submitLogin);
    var back = document.getElementById('rbtH5HeadBack');
    if (back) back.addEventListener('click', function () {
        if (screen === 'contract') {
            screen = 'bill';
            render();
            return;
        }
        if (screen === 'wallet' && walletPane === 'bind') {
            walletPane = 'recharge';
            walletSheet = '';
            render();
            return;
        }
        if (screen === 'wallet' && walletPane !== 'main') {
            walletPane = 'main';
            render();
            return;
        }
        if (screen === 'bill') {
            screen = 'collect';
            render();
            return;
        }
        if (screen !== 'home') {
            screen = 'home';
            render();
        }
    });

    renderAccounts();
    var saved = readSession();
    if (saved) openAccount(saved);
})();
