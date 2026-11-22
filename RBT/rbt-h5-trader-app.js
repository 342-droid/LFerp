/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var signCode = '';
    var signSummaryOpen = false;
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

    function setHead(text) {
        var head = document.getElementById('rbtH5HeadText');
        var title = document.querySelector('.rbt-h5-phone__head h1');
        var phone = document.getElementById('rbtH5Phone');
        if (phone && phone.classList.contains('is-app')) {
            if (title) title.textContent = text || '收款';
        }
        if (head) head.textContent = text || '';
    }

    /* 二级回到基础工具，三级回到上一级。首页和我的没有上一级。 */
    function backTarget() {
        if (!account) return '';
        if (screen === 'collect-bill') return 'collect';
        if (screen === 'sign') return 'hall';
        if (screen === 'password') return 'mine';
        if (screen === 'collect' || screen === 'hall') return 'home';
        return '';
    }

    function syncHeadBack() {
        var btn = document.getElementById('rbtH5HeadBack');
        if (!btn) return;
        btn.classList.toggle('is-on', !!backTarget());
    }

    function goBack(target) {
        screen = target || 'home';
        if (screen === 'hall') hallFilter = 'accepted';
        if (screen === 'collect') collectFilter = collectFilter === 'closed' ? 'closed' : 'open';
        tab = screen === 'mine' || screen === 'password' ? 'mine' : 'hall';
        render();
    }

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    function traderName() {
        var license = account && account.license;
        return (license && license.name) || '贸易商';
    }

    /* 服务商档案中的账号不能看需求大厅，也不能接单。 */
    function archiveRow() {
        var name = traderName();
        var api = window.MdmTraderArchiveStore;
        if (!name || !api || typeof api.list !== 'function') return null;
        var found = null;
        (api.list() || []).some(function (row) {
            if (!row) return false;
            if (row.name === name || row.subjectName === name || (row.license && row.license.name === name)) {
                found = row;
                return true;
            }
            return false;
        });
        return found;
    }

    function isServiceProvider() {
        var name = traderName();
        var api = window.MdmProviderArchiveStore;
        if (name && api && typeof api.list === 'function') {
            var hit = (api.list() || []).some(function (row) {
                return !!(row && (row.name === name || row.subjectName === name || (row.license && row.license.name === name)));
            });
            if (hit) return true;
        }
        var row = archiveRow();
        return !!(row && row.subjectType === '服务商');
    }

    function toast(message) {
        if (window.RbtH5TraderLogin && window.RbtH5TraderLogin.toast) {
            window.RbtH5TraderLogin.toast(message);
        }
    }

    function demandRows() {
        var api = window.RbtDemandData;
        if (!api || typeof api.list !== 'function') return [];
        return api.list();
    }

    function pendingDemands() {
        if (isServiceProvider()) return [];
        return demandRows().filter(function (item) {
            return item && item.status === '待接单' && !item.traderName;
        }).sort(function (a, b) {
            return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        });
    }

    function acceptedDemands() {
        if (isServiceProvider()) return [];
        var name = traderName();
        return demandRows().filter(function (item) {
            return item && item.traderName && item.traderName === name;
        }).sort(function (a, b) {
            return String(b.acceptedAt || b.updatedAt || '').localeCompare(String(a.acceptedAt || a.updatedAt || ''));
        });
    }

    function skuText(item) {
        return (item.skus || []).map(function (sku) {
            var name = sku.name || sku.code || '';
            return sku.qty != null && sku.qty !== '' ? name + '×' + sku.qty : name;
        }).filter(Boolean).join('、') || '—';
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

    /* 大厅总金额用需求单的贸易商应收，服务费按这个总金额减商品金额。 */
    function hallAmounts(item) {
        var goods = item && item.goodsAmount ? String(item.goodsAmount) : '';
        var api = window.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var total = pack && pack.trader ? String(pack.trader) : '';
        var goodsCents = centsOf(goods);
        var totalCents = centsOf(total);
        var fee = goodsCents == null || totalCents == null ? '' : fromCents(totalCents - goodsCents);
        return {
            goods: goods || '—',
            fee: fee || '—',
            total: total || '—'
        };
    }

    function yuanText(value) {
        var text = String(value == null ? '' : value).trim();
        if (!text || text === '—') return '—';
        return text.charAt(0) === '¥' ? text : '¥' + text;
    }

    function hallCell(label, value) {
        return '<div class="rbt-hall-card__cell"><span>' + esc(label) + '</span><b>' + esc(value || '—') + '</b></div>';
    }

    function hallActions(item, accepted) {
        var code = esc(item.code);
        if (!accepted) return '<button type="button" class="rbt-hall-card__btn" data-accept="' + code + '">接单</button>';
        if (item.status === '待确认签约') {
            return '<button type="button" class="rbt-hall-card__btn is-ghost" data-withdraw="' + code + '">撤回接单</button>' +
                '<button type="button" class="rbt-hall-card__btn" data-confirm-deal="' + code + '">确认签约</button>';
        }
        if (item.status === '待签署') return '<button type="button" class="rbt-hall-card__btn" data-sign="' + code + '">去签署</button>';
        if (item.status === '待付款') {
            return '<button type="button" class="rbt-hall-card__btn is-ghost" data-pay-offline="' + code + '">线下支付</button>' +
                '<button type="button" class="rbt-hall-card__btn" data-pay-online="' + code + '">在线支付</button>';
        }
        return '';
    }

    function renderHallCard(item, accepted) {
        var status = accepted ? (item.status || '已接单') : '待接单';
        var statusClass = status === '已完成' ? ' is-done' : (status === '已作废' || status === '已驳回' ? ' is-off' : '');
        var amounts = hallAmounts(item);
        var ratio = item.repayMethod === '比例付' ? ratioText(item) : '';
        var extra = ratio && ratio !== '—'
            ? '<div class="rbt-hall-card__block"><span>结算比例</span><p>' + esc(ratio) + '</p></div>'
            : (item.repayMethod && item.repayMethod !== '比例付'
                ? '<div class="rbt-hall-card__block"><span>结算期数</span><p>' + esc(item.repayPeriod || '—') + '期</p></div>'
                : '');
        var actions = hallActions(item, accepted);
        return '<article class="rbt-hall-card">' +
            '<div class="rbt-hall-card__top"><h2 class="rbt-hall-card__name">' + esc(item.storeName || '—') + '</h2>' +
            '<span class="rbt-hall-card__status' + statusClass + '">' + esc(status) + '</span></div>' +
            '<p class="rbt-hall-card__meta">' + esc(item.code || '—') + ' · ' + esc(item.packageName || '—') + ' ' + esc(item.packageCode || '—') + '</p>' +
            '<div class="rbt-hall-card__total"><span>总金额</span><b>' + esc(yuanText(amounts.total)) + '</b></div>' +
            '<div class="rbt-hall-card__grid">' +
            hallCell('商品金额', yuanText(amounts.goods)) +
            hallCell('服务费', yuanText(amounts.fee)) +
            hallCell('结算周期', item.repayCycle || '—') +
            hallCell('结算方式', item.repayMethod || '—') +
            '</div>' +
            '<div class="rbt-hall-card__block"><span>商品</span><p>' + esc(skuText(item)) + '</p></div>' +
            extra +
            '<div class="rbt-hall-card__foot"><div class="rbt-hall-card__time"><p>创建时间 ' + esc(item.createdAt || '—') + '</p>' +
            (accepted ? '<p>接单时间 ' + esc(item.acceptedAt || '—') + '</p>' : '') +
            '</div><div class="rbt-hall-card__actions">' + actions + '</div></div></article>';
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = tab === 'hall' && screen === 'home';
        if (phone) {
            phone.classList.toggle('is-home', on);
            phone.classList.toggle('is-hall', screen === 'hall');
            phone.classList.toggle('is-sign', screen === 'sign');
        }
        if (scroll) scroll.classList.toggle('is-home', on);
    }

    /* 首页对齐门店端，不放扫码核销、售后。当前基础工具只放需求大厅。 */
    function renderHome() {
        var name = traderName();
        var orange = 'linear-gradient(180deg,#ff9a45,#ff7019)';
        var hall = svgIcon('<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var bell = svgIcon('<path d="M6 16.5h12l-1.2-1.6V10a4.8 4.8 0 1 0-9.6 0v4.9L6 16.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>');
        var gear = svgIcon('<path fill="currentColor" d="M19.4 13.1c.1-.4.1-.7.1-1.1s0-.7-.1-1.1l1.7-1.3a.5.5 0 0 0 .1-.6l-1.6-2.8a.5.5 0 0 0-.6-.2l-2 .8a6.2 6.2 0 0 0-1.9-1.1l-.3-2.1a.5.5 0 0 0-.5-.4h-3.2a.5.5 0 0 0-.5.4l-.3 2.1c-.7.3-1.3.7-1.9 1.1l-2-.8a.5.5 0 0 0-.6.2L2.8 9a.5.5 0 0 0 .1.6l1.7 1.3c-.1.4-.1.7-.1 1.1s0 .7.1 1.1L2.9 14.4a.5.5 0 0 0-.1.6l1.6 2.8c.1.2.4.3.6.2l2-.8c.6.4 1.2.8 1.9 1.1l.3 2.1c0 .2.2.4.5.4h3.2c.3 0 .5-.2.5-.4l.3-2.1c.7-.3 1.3-.7 1.9-1.1l2 .8c.2.1.5 0 .6-.2l1.6-2.8a.5.5 0 0 0-.1-.6l-1.7-1.3zM12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z"/>');
        return '<div class="rbt-h5-home">' +
            '<header class="rbt-h5-home__bar">' +
            '<span class="rbt-h5-home__avatar">' + esc(name.slice(0, 1)) + '</span>' +
            '<strong class="rbt-h5-home__name">' + esc(name) + '</strong>' +
            '<span class="rbt-h5-home__tools">' + bell + gear + '</span>' +
            '</header>' +
            '<section class="rbt-h5-home__card">' +
            '<h2>基础工具</h2>' +
            '<div class="rbt-h5-home__grid">' +
            '<button type="button" class="rbt-h5-tool" data-entry="hall">' +
            '<span class="rbt-h5-tool__icon" style="background:' + orange + '">' + hall + '</span>' +
            '<span>需求大厅</span></button>' +
            '<button type="button" class="rbt-h5-tool" data-entry="collect">' +
            '<span class="rbt-h5-tool__icon" style="background:' + orange + '">' + hall + '</span>' +
            '<span>收款</span></button>' +
            '</div></section></div>';
    }

    function ratioPercent(value) {
        var num = Number(String(value == null ? '' : value).replace('%', ''));
        if (!isFinite(num)) return '';
        return num.toFixed(2) + '%';
    }

    /* 基础信息只列渠道和比例，不带「默认比例」和类目。 */
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
        var period = item && item.repayPeriod ? ratioPercent(item.repayPeriod) : '';
        return period || (item && item.repayPeriod ? String(item.repayPeriod) : '—');
    }

    function phaseLabel(status) {
        if (status === '门店付款中' || status === '还款中') return '履约中';
        return status || '—';
    }

    function yuan(value) {
        if (value == null || value === '' || value === '—') return '—';
        return '¥' + value;
    }

    /* 已结款是已经结清的营业日拆给贸易商的金额。最近一天结算单未确定，明细行仍记待结款。 */
    function traderSettled(item) {
        var daily = window.RbtDailyFulfill;
        var rows = daily && typeof daily.payeeSplit === 'function' ? daily.payeeSplit(item) : [];
        if (!rows.length) return { total: '', pending: '', shares: [] };
        var latest = '';
        var shares = rows.map(function (row) {
            return { date: row.date, time: row.time || '', channel: row.channel, kind: row.kind || '', amount: row.trader };
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
        var pendingCents = 0;
        shares.forEach(function (row) {
            var cents = Math.round(Number(row.amount) * 100);
            if (!isFinite(cents)) cents = 0;
            /* 一键履约已经付过，按结算系数拆完即已结款。最近一个营业日仍等结算单。 */
            row.stage = !done && row.kind !== 'manual' && row.date === latest ? 'pending' : 'due';
            if (row.stage === 'pending') pendingCents += cents;
            else settledCents += cents;
        });
        return {
            total: (settledCents / 100).toFixed(2),
            pending: done ? '' : (pendingCents / 100).toFixed(2),
            shares: shares
        };
    }

    var TRADER_ACCOUNTS = {
        '杭州鲜达贸易有限公司': { accountName: '杭州鲜达贸易有限公司', accountNo: '6230610210001001007' },
        '上海冷链融资租赁有限公司': { accountName: '上海冷链融资租赁有限公司', accountNo: '6217920210001002008' }
    };

    /* 跟进中：待结款 = 应收 − 已结款。还没有已结款时按 0 减。没有应收时不计算。 */
    function pendingOf(receivable, settled) {
        var due = centsOf(receivable);
        if (due == null) return '';
        var paid = centsOf(settled);
        if (paid == null) paid = 0;
        return fromCents(Math.max(0, due - paid));
    }

    function fundOf(item) {
        var amounts = hallAmounts(item);
        var settled = traderSettled(item);
        var settledText = settled.total;
        var pending = pendingOf(amounts.total, settledText);
        /* 已结束的单已经结清：已结款等于应收，待结款为 0。 */
        if (closedBid(item)) {
            var due = centsOf(amounts.total);
            if (due != null) {
                settledText = fromCents(due);
                pending = fromCents(0);
            }
        }
        return {
            receivable: amounts.total,
            goods: amounts.goods,
            fee: amounts.fee,
            settled: settledText,
            pending: pending,
            shares: settled.shares,
            account: TRADER_ACCOUNTS[item && item.traderName] || TRADER_ACCOUNTS[traderName()] || null
        };
    }

    function closedBid(item) {
        return item && (item.status === '已完成' || item.status === '已作废' || item.status === '已驳回');
    }

    /* 收款列表的跟进中只放履约中。待确认签约、待签署、待付款不在这里。 */
    function fulfillingBid(item) {
        return item && (item.status === '门店付款中' || item.status === '还款中');
    }

    function collectDemands(closed) {
        return acceptedDemands().filter(function (item) {
            return closed ? closedBid(item) : fulfillingBid(item);
        });
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

    function renderCollect() {
        var closed = collectFilter === 'closed';
        var rows = collectDemands(closed);
        var funds = rows.map(function (item) { return fundOf(item); });
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
                    '<p class="rbt-fund-card__store">' + esc(item.storeName || '—') + '</p>' +
                    '<div class="rbt-fund-card__metrics">' +
                    '<div><span>应收</span><b>' + esc(yuan(fund.receivable)) + '</b></div>' +
                    '<div><span>已结款</span><b>' + esc(fund.settled ? yuan(fund.settled) : '未产生') + '</b></div>' +
                    '<div><span>待结款</span><b>' + esc(fund.pending ? yuan(fund.pending) : (item.status === '已完成' ? '无' : '未产生')) + '</b></div>' +
                    '</div></button>';
            }).join('') : '<div class="rbt-h5-empty">' + (closed ? '暂无已结束的接单' : '暂无履约中的接单') + '</div>') +
            '</div>';
    }

    /* 支付时间是贸易商付完货款的时间。没走过支付的单不补时间。 */
    function payTimeOf(item) {
        if (!item) return '';
        if (item.paidAt) return item.paidAt;
        var found = '';
        (item.logs || []).forEach(function (row) {
            if (!row || !row.time || !/在线支付|线下支付/.test(row.content || '')) return;
            if (!found || row.time < found) found = row.time;
        });
        return found;
    }

    /* 贸易商签的是销售合同和采购合同。只列出已经签完的。 */
    function traderSignedContracts(item) {
        var api = window.RbtDemandData;
        if (!item || !api || typeof api.signContracts !== 'function') return [];
        return api.signContracts(item).filter(function (contract) {
            if (!contract || contract.signStatus !== '已签署') return false;
            return (contract.parties || []).some(function (party) { return party.role === 'trader'; });
        });
    }

    function renderSignedContracts(item) {
        var contracts = traderSignedContracts(item);
        var value = contracts.length
            ? contracts.map(function (contract) {
                return '<button type="button" class="rbt-bill__contract" data-contract-open="' + esc(contract.key) + '">' +
                    esc(contract.name) + '</button>';
            }).join('')
            : '—';
        return '<div class="rbt-bill__line"><span>签署合同</span><b>' + value + '</b></div>';
    }

    function closeContract() {
        var node = document.getElementById('rbtH5Contract');
        if (!node) return;
        node.hidden = true;
        node.innerHTML = '';
    }

    function contractSideLine(label, value) {
        return '<div class="rbt-contract__side-line"><span>' + esc(label) + '</span><b>' + esc(value || '—') + '</b></div>';
    }

    function contractSeal(name, index) {
        var uid = 'rbtSealArc' + index;
        return '<span class="rbt-contract__seal" aria-label="已盖章"><svg viewBox="0 0 120 120" width="96" height="96">' +
            '<circle cx="60" cy="60" r="56" fill="rgba(255,255,255,0.55)" stroke="#c41e1e" stroke-width="3"/>' +
            '<circle cx="60" cy="60" r="51" fill="none" stroke="#c41e1e" stroke-width="1"/>' +
            '<defs><path id="' + uid + '" d="M16,64 A44,44 0 0,1 104,64"/></defs>' +
            '<text fill="#c41e1e" font-size="11" font-weight="700"><textPath href="#' + uid + '" startOffset="50%" text-anchor="middle">' +
            esc(name || '签署方') + '</textPath></text>' +
            '<text x="60" y="66" text-anchor="middle" fill="#c41e1e" font-size="16">★</text>' +
            '<text x="60" y="86" text-anchor="middle" fill="#c41e1e" font-size="12" font-weight="700">合同专用章</text></svg></span>';
    }

    function contractCnDate(raw) {
        var matched = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})/);
        return matched ? (matched[1] + '年' + matched[2] + '月' + matched[3] + '日') : '';
    }

    /* 销售合同正文同门店端，乙方是门店。采购合同是供应商清分合同，乙方是贸易商。签署页盖章。 */
    function contractPaperHtml(contract, item) {
        var purchase = contract && contract.key === 'purchase';
        var bag = window.LF_CONTRACT_BODIES || {};
        var body = bag[purchase ? 'TPL004' : 'TPL001'] || '';
        var parties = (contract && contract.parties) || [];
        var partyB = parties.filter(function (party) {
            return party && party.role === (purchase ? 'trader' : 'store');
        })[0];
        var partyName = partyB && partyB.name || (purchase ? (item && item.traderName) : (item && item.storeName)) || '';
        var signedAt = '';
        parties.some(function (party) {
            if (party && party.signedAt) {
                signedAt = party.signedAt;
                return true;
            }
            return false;
        });
        var dateText = contractCnDate(signedAt);
        if (!body) return '暂无合同正文';
        var lines = body.split('\n');
        var headEnd = lines.findIndex(function (line) {
            return line.indexOf('鉴于') === 0 || line.indexOf('第一条') === 0 || line.indexOf('1.1') === 0;
        });
        if (headEnd < 0) headEnd = Math.min(lines.length, 24);
        var addressFilled = false;
        for (var i = 0; i < headEnd; i++) {
            var head = lines[i];
            if (partyName && /^乙方(?:（[^）]*）)?：\s*$/.test(head.trim())) {
                lines[i] = head.replace(/：\s*$/, '：' + partyName);
                continue;
            }
            if (!purchase && partyName && !addressFilled && /地址：\s*$/.test(head.trim())) {
                lines[i] = head.replace(/：\s*$/, '：' + partyName);
                addressFilled = true;
            }
        }
        var inPage = false;
        var sealIndex = 0;
        return lines.map(function (line) {
            var trimmed = line.trim();
            if (trimmed.indexOf('以下无正文') >= 0) inPage = true;
            if (inPage && trimmed.indexOf('附件') === 0) inPage = false;
            if (!inPage || trimmed.indexOf('以下无正文') >= 0) return esc(line);
            if (/^甲方（盖章）/.test(trimmed)) {
                sealIndex += 1;
                var partyA = ((trimmed.match(/：\s*(.+)$/) || [])[1] || '').replace(/[_\s　]+$/g, '').trim();
                if (!partyA) partyA = purchase ? '上海冷丰德本信息科技有限公司' : '上海冷丰道善信息科技有限公司';
                return '<span class="rbt-contract__sign">' + esc(line) + contractSeal(partyA, sealIndex) + '</span>';
            }
            if (/^乙方（(?:签字|盖章)/.test(trimmed)) {
                var shown = line;
                if (partyName && /：\s*[_＿\s　]*$/.test(trimmed)) shown = line.replace(/：\s*[_＿\s　]*$/, '：' + partyName);
                sealIndex += 1;
                return '<span class="rbt-contract__sign">' + esc(shown) + contractSeal(partyName, sealIndex) + '</span>';
            }
            if (/^日期/.test(trimmed) && dateText) return esc(line.replace(/：.*/, '：' + dateText));
            return esc(line);
        }).join('\n');
    }

    function openContract(key) {
        var item = acceptedDemands().filter(function (row) { return row.code === collectCode; })[0];
        var contract = traderSignedContracts(item).filter(function (row) { return row.key === key; })[0];
        var node = document.getElementById('rbtH5Contract');
        if (!item || !contract || !node) return;
        var signers = (contract.parties || []).map(function (party) {
            return '<section class="rbt-contract__signer"><div class="rbt-contract__signer-top"><span>签署</span><span>顺序签署</span></div>' +
                '<div class="rbt-contract__signer-who"><b>' + esc(party.name || party.roleLabel || '—') + '</b><em>已签署</em></div>' +
                contractSideLine('完成时间', party.signedAt) + '</section>';
        }).join('');
        node.innerHTML = '<div class="rbt-contract__bar"><button type="button" data-contract-close aria-label="返回">‹</button><strong>' +
            esc(contract.name) + '</strong></div>' +
            '<div class="rbt-contract__body">' +
            '<p class="rbt-contract__meta">签署任务 · ' + esc(contract.code) + ' · ' + esc(item.storeName || '') + ' · 已签署</p>' +
            '<article class="rbt-contract__paper">' + contractPaperHtml(contract, item) + '</article>' +
            '<section class="rbt-contract__side"><h3>详情</h3>' +
            contractSideLine('主题', contract.name) +
            '<div class="rbt-contract__side-line"><span>状态</span><b><i class="rbt-contract__dot"></i>已签署</b></div>' +
            contractSideLine('合同编号', contract.code) +
            contractSideLine('发件人', '上海冷丰道善信息科技有限公司') +
            contractSideLine('关联需求', item.code) +
            signers +
            '</section></div>';
        node.hidden = false;
    }

    /* 已结款的结款时间是营业日次日 08:00:00，只写月日时分秒。一键履约用实际支付时间。待结款还没结，时间用 -。 */
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

    function renderCollectBill(item) {
        var fund = fundOf(item);
        var payee = fund.account || { accountName: '—', accountNo: '—' };
        setHead('资金明细');
        var lines = [
            ['门店', item.storeName || '—'],
            ['商品金额', yuan(fund.goods)],
            ['服务费', yuan(fund.fee)],
            ['结算比例', ratioText(item)],
            ['接单时间', item.acceptedAt || '—'],
            ['支付时间', payTimeOf(item) || '—'],
            ['已结款', fund.settled ? yuan(fund.settled) : '未产生'],
            ['待结款', fund.pending ? yuan(fund.pending) : (item.status === '已完成' ? '无' : '未产生')],
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
            '</div>' +
            '</section>' +
            '<div class="rbt-bill-tabs" role="tablist">' +
            '<button type="button" data-fund-tab="base"' + (fundTab === 'share' ? '' : ' class="is-on"') + '>基础信息</button>' +
            '<button type="button" data-fund-tab="share"' + (fundTab === 'share' ? ' class="is-on"' : '') + '>结款明细</button>' +
            '</div>' +
            (fundTab === 'share'
                ? '<section class="rbt-bill__sheet' + (shares.length ? '' : ' rbt-bill__sheet--blank') + '">' + detail + '</section>'
                : '<section class="rbt-bill__sheet">' +
                    lines.map(function (line) {
                        return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
                    }).join('') +
                    renderSignedContracts(item) +
                    '</section>');
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        closeContract();
        syncHomeChrome();
        syncHeadBack();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            var payActions = signing && signing.status === '待付款'
                ? '<section class="rbt-sign-card">' +
                  '<h2>支付</h2>' +
                  '<p>合同已签署，请选择支付方式。</p>' +
                  '<button type="button" class="rbt-h5-accept" data-pay-online="' + esc(signing.code) + '">在线支付</button>' +
                  '<button type="button" class="rbt-h5-withdraw" data-pay-offline="' + esc(signing.code) + '">线下支付</button>' +
                  '</section>'
                : '';
            scroll.innerHTML = (window.RbtContractSign
                ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone }, {
                    layout: 'trader',
                    summaryOpen: signSummaryOpen,
                    amounts: signing ? hallAmounts(signing) : {}
                })
                : '<div class="rbt-h5-empty">合同签署页不可用</div>') +
                payActions;
            return;
        }
        if (tab === 'hall' && screen === 'collect-bill') {
            setHead('资金明细');
            var collectBill = acceptedDemands().filter(function (item) { return item.code === collectCode; })[0];
            scroll.innerHTML = collectBill
                ? renderCollectBill(collectBill)
                : '<div class="rbt-h5-empty">账单不存在</div>';
            return;
        }
        if (tab === 'hall' && screen === 'collect') {
            scroll.innerHTML = renderCollect();
            return;
        }
        if (tab === 'hall' && screen === 'home') {
            setHead('首页');
            scroll.innerHTML = renderHome();
            return;
        }
        if (tab === 'mine') {
            setHead(screen === 'password' ? '修改密码' : '我的');
            if (screen === 'password') {
                scroll.innerHTML =
                    '<section class="rbt-h5-card rbt-h5-mine">' +
                    '<div class="rbt-h5-field"><label for="rbtH5OldPwd">原密码</label><input id="rbtH5OldPwd" type="password" maxlength="32" placeholder="请输入原密码"></div>' +
                    '<div class="rbt-h5-field"><label for="rbtH5NewPwd">新密码</label><input id="rbtH5NewPwd" type="password" maxlength="32" placeholder="请输入新密码"></div>' +
                    '<div class="rbt-h5-field"><label for="rbtH5ConfirmPwd">确认新密码</label><input id="rbtH5ConfirmPwd" type="password" maxlength="32" placeholder="请再次输入新密码"></div>' +
                    '<p class="rbt-h5-tip">新密码至少 6 位。演示默认密码 123456。</p>' +
                    '<button type="button" class="rbt-h5-primary rbt-h5-publish" data-save-password>保存</button>' +
                    '</section>';
                return;
            }
            var license = account.license || {};
            var permit = account.permit || {};
            scroll.innerHTML =
                '<section class="rbt-h5-card rbt-h5-mine"><h2>' + esc(license.name || '贸易商') + '</h2>' +
                '<p>统一社会信用代码：' + esc(license.creditCode || '—') + '\n' +
                '法定代表人：' + esc(license.legal || '—') + '\n' +
                '许可证编号：' + esc(permit.no || '—') + '\n' +
                '牌照类型：' + esc(account.licenseType || '—') + '\n' +
                '业务范围：' + esc(account.bizScope || '—') + '\n' +
                '手机号：' + esc(account.phone || '') + '</p>' +
                '<button type="button" class="rbt-h5-action" data-change-password>修改密码</button>' +
                '<button type="button" class="rbt-h5-logout" data-logout>退出登录</button></section>';
            return;
        }
        if (tab === 'assets') {
            setHead('资产台账');
            scroll.innerHTML = '<div class="rbt-h5-empty">暂无资产台账</div>';
            return;
        }
        setHead('需求大厅');
        var acceptedView = hallFilter === 'accepted';
        var pending = pendingDemands();
        var accepted = acceptedDemands();
        var hall = acceptedView ? accepted : pending;
        scroll.innerHTML = '<div class="rbt-h5-hall-tabs" role="tablist">' +
            '<button type="button" data-hall-tab="pending"' + (acceptedView ? '' : ' class="is-on"') + '>待接单(' + pending.length + ')</button>' +
            '<button type="button" data-hall-tab="accepted"' + (acceptedView ? ' class="is-on"' : '') + '>已接单(' + accepted.length + ')</button>' +
            '</div>' +
            (hall.length
                ? hall.map(function (item) { return renderHallCard(item, acceptedView); }).join('')
                : '<div class="rbt-h5-empty">' + (acceptedView ? '暂无已接单需求' : '暂无待接单需求') + '</div>');
    }

    function open(next) {
        account = next;
        tab = 'hall';
        screen = 'home';
        render();
    }

    function close() {
        account = null;
        tab = 'hall';
        screen = 'home';
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var title = document.querySelector('.rbt-h5-phone__head h1');
        var headBack = document.getElementById('rbtH5HeadBack');
        if (title) title.textContent = '贸易商端';
        if (headBack) headBack.classList.remove('is-on');
        if (phone) phone.classList.remove('is-home', 'is-hall', 'is-sign');
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.innerHTML = '';
        }
    }

    /* 接单成功后提示去已接单确认签约。稍后处理留在待接单。 */
    function closeAcceptDone() {
        document.querySelectorAll('[data-accept-done]').forEach(function (node) {
            node.remove();
        });
    }

    function openAcceptDone() {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeAcceptDone();
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-accept-done', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtAcceptDoneTitle">' +
            '<h2 id="rbtAcceptDoneTitle">接单成功</h2>' +
            '<p>确定接单成功，需您在「已接单」里确认签约，一个需求单只能由一个贸易商接单</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-accept-later>稍后处理</button>' +
            '<button type="button" class="is-go" data-accept-go>去已接单确认</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-accept-later]')) {
                closeAcceptDone();
                render();
                return;
            }
            if (event.target.closest('[data-accept-go]')) {
                closeAcceptDone();
                hallFilter = 'accepted';
                screen = 'hall';
                render();
            }
        });
        phone.appendChild(mask);
    }

    function closeWithdraw() {
        document.querySelectorAll('[data-withdraw-dialog]').forEach(function (node) {
            node.remove();
        });
    }

    /* 撤回前填写原因。点选后台配置的原因会填进输入框，也可以自己写。取消不改状态。 */
    function openWithdraw(code) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeWithdraw();
        var api = window.RbtDemandData;
        var reasons = api && typeof api.withdrawReasons === 'function' ? api.withdrawReasons() : [];
        var chips = reasons.map(function (item) {
            return '<button type="button" data-withdraw-reason="' + esc(item) + '">' + esc(item) + '</button>';
        }).join('');
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-withdraw-dialog', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog rbt-withdraw-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtWithdrawTitle">' +
            '<h2 id="rbtWithdrawTitle">撤回接单</h2>' +
            '<p>撤回后需平台重新确认，确认前不能再次接单</p>' +
            (chips ? '<div class="rbt-withdraw-reasons">' + chips + '</div>' : '') +
            '<textarea maxlength="100" placeholder="请填写撤回原因"></textarea>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-withdraw-cancel>取消</button>' +
            '<button type="button" class="is-go" data-withdraw-ok>确认撤回</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            var chip = event.target.closest('[data-withdraw-reason]');
            if (chip) {
                var picked = chip.getAttribute('data-withdraw-reason') || '';
                var input = mask.querySelector('textarea');
                if (input) input.value = picked;
                mask.querySelectorAll('[data-withdraw-reason]').forEach(function (node) {
                    node.classList.toggle('is-on', node === chip);
                });
                return;
            }
            if (event.target.closest('[data-withdraw-cancel]')) {
                closeWithdraw();
                return;
            }
            if (!event.target.closest('[data-withdraw-ok]')) return;
            var value = String((mask.querySelector('textarea') || {}).value || '').trim();
            if (!value) {
                toast('请填写撤回原因');
                return;
            }
            var withdrawResult = api && typeof api.withdrawAccept === 'function'
                ? api.withdrawAccept(code, { name: traderName(), phone: account && account.phone }, value)
                : { ok: false };
            closeWithdraw();
            if (withdrawResult && withdrawResult.ok) toast('已撤回接单，待平台重新确认');
            else if (withdrawResult && withdrawResult.reason === 'long') toast('撤回原因不超过 100 个字');
            else toast('当前不能撤回');
            render();
        });
        phone.appendChild(mask);
    }

    function closeConfirmSign() {
        document.querySelectorAll('[data-confirm-sign-dialog]').forEach(function (node) {
            node.remove();
        });
    }

    function moneyLabel(value) {
        var num = Number(value);
        if (!isFinite(num)) return '—';
        var cents = Math.round(num * 100);
        var abs = Math.abs(cents);
        return (cents < 0 ? '-' : '') + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0');
    }

    function closeBalanceShort() {
        document.querySelectorAll('[data-balance-short]').forEach(function (node) {
            node.remove();
        });
    }

    /* 余额不够时拦住确认签署。我知道了不改状态。 */
    function openBalanceShort(check) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeBalanceShort();
        var text = check && check.reason === 'amount'
            ? '暂时无法核对商品金额，请稍后再试'
            : '当前余额 ¥' + moneyLabel(check && check.balance) + '，本单需支付商品金额 ¥' + moneyLabel(check && check.need) + '。余额不足，请尽快充值后再确认签署。';
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-balance-short', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtBalanceTitle">' +
            '<h2 id="rbtBalanceTitle">余额不足</h2>' +
            '<p>' + esc(text) + '</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-go" data-balance-ok>我知道了</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-balance-ok]')) closeBalanceShort();
        });
        phone.appendChild(mask);
    }

    function traderActor() {
        return { role: 'trader', name: traderName(), phone: account && account.phone };
    }

    function blockIfBalanceShort(code) {
        var api = window.RbtDemandData;
        if (!api || typeof api.traderBalanceCheck !== 'function') return false;
        var check = api.traderBalanceCheck(code, traderActor());
        if (check && check.ok) return false;
        openBalanceShort(check || {});
        return true;
    }

    /* 确认签约前先说明会生成两份合同。稍后处理不改状态；去签署才确认并进入签署页。 */
    function openConfirmSign(code) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeConfirmSign();
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-confirm-sign-dialog', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtConfirmSignTitle">' +
            '<h2 id="rbtConfirmSignTitle">确认签约</h2>' +
            '<p>确认后将生成相关合同，进入合同签署页面</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-confirm-sign-later>稍后处理</button>' +
            '<button type="button" class="is-go" data-confirm-sign-go>去签署</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-confirm-sign-later]')) {
                closeConfirmSign();
                return;
            }
            if (event.target.closest('[data-confirm-sign-go]')) {
                closeConfirmSign();
                if (blockIfBalanceShort(code)) return;
                var dealApi = window.RbtDemandData;
                var dealResult = dealApi && typeof dealApi.confirmSigning === 'function'
                    ? dealApi.confirmSigning(code, traderActor())
                    : { ok: false };
                if (dealResult && (dealResult.reason === 'balance' || dealResult.reason === 'amount')) {
                    openBalanceShort(dealResult);
                    return;
                }
                if (!(dealResult && dealResult.ok)) {
                    toast('当前不能确认签约');
                    render();
                    return;
                }
                signCode = code;
                tab = 'hall';
                screen = 'sign';
                hallFilter = 'accepted';
                signSummaryOpen = false;
                render();
            }
        });
        phone.appendChild(mask);
    }

    var headBackBtn = document.getElementById('rbtH5HeadBack');
    if (headBackBtn) {
        headBackBtn.addEventListener('click', function () {
            var contract = document.getElementById('rbtH5Contract');
            if (contract && !contract.hidden) {
                closeContract();
                return;
            }
            var target = backTarget();
            if (target) goBack(target);
        });
    }

    function finishPay(code, method) {
        var api = window.RbtDemandData;
        var result = api && typeof api.payDemand === 'function'
            ? api.payDemand(code, method, { name: traderName(), phone: account && account.phone })
            : { ok: false };
        if (result && result.ok) toast(method === 'offline' ? '已确认线下支付，需求进入门店付款中' : '支付完成，需求进入门店付款中');
        else toast('当前不能支付');
        render();
    }

    function closeOfflinePay() {
        document.querySelectorAll('[data-pay-dialog]').forEach(function (node) {
            node.remove();
        });
    }

    /* 线下支付先确认。取消不改状态。 */
    function openOfflinePay(code) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeOfflinePay();
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-pay-dialog', '1');
        mask.innerHTML =
            '<div class="rbt-h5-pay-dialog" role="dialog" aria-modal="true">' +
            '<p>请进行线下打款，相关信息请联系平台处理</p>' +
            '<div class="rbt-h5-pay-dialog__actions">' +
            '<button type="button" data-pay-cancel>取消</button>' +
            '<button type="button" data-pay-ok>确认</button>' +
            '</div></div>';
        phone.appendChild(mask);
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-pay-cancel]')) {
                closeOfflinePay();
                return;
            }
            if (event.target.closest('[data-pay-ok]')) {
                closeOfflinePay();
                finishPay(code, 'offline');
            }
        });
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
        var contractClose = event.target.closest('[data-contract-close]');
        var contractOpen = event.target.closest('[data-contract-open]');
        if (contractClose) {
            closeContract();
            return;
        }
        if (contractOpen) {
            openContract(contractOpen.getAttribute('data-contract-open') || '');
            return;
        }
        if (event.target.closest('#rbtH5Contract')) return;
        var entry = event.target.closest('[data-entry]');
        var hallTab = event.target.closest('[data-hall-tab]');
        var accept = event.target.closest('[data-accept]');
        var confirmDeal = event.target.closest('[data-confirm-deal]');
        var withdraw = event.target.closest('[data-withdraw]');
        var sign = event.target.closest('[data-sign]');
        var summaryToggle = event.target.closest('[data-sign-summary]');
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var payOnline = event.target.closest('[data-pay-online]');
        var payOffline = event.target.closest('[data-pay-offline]');
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (payOnline) {
            finishPay(payOnline.getAttribute('data-pay-online'), 'online');
            return;
        }
        if (payOffline) {
            openOfflinePay(payOffline.getAttribute('data-pay-offline'));
            return;
        }
        if (summaryToggle) {
            signSummaryOpen = !signSummaryOpen;
            render();
            return;
        }
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            if (blockIfBalanceShort(signedCode)) return;
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, traderActor(), confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && (signResult.reason === 'balance' || signResult.reason === 'amount')) {
                openBalanceShort(signResult);
                return;
            }
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，请选择支付方式');
            else if (signResult && signResult.ok) toast('签署成功');
            else if (signResult && signResult.reason === 'signed') toast('你已签署');
            else toast('当前不能签署');
            render();
            return;
        }
        if (sign) {
            signCode = sign.getAttribute('data-sign') || '';
            tab = 'hall';
            screen = 'sign';
            hallFilter = 'accepted';
            signSummaryOpen = false;
            render();
            return;
        }
        if (hallTab) {
            hallFilter = hallTab.getAttribute('data-hall-tab') === 'accepted' ? 'accepted' : 'pending';
            render();
            return;
        }
        if (entry && entry.getAttribute('data-entry') === 'hall') {
            tab = 'hall';
            screen = 'hall';
            hallFilter = 'pending';
            render();
            return;
        }
        if (entry && entry.getAttribute('data-entry') === 'collect') {
            tab = 'hall';
            screen = 'collect';
            collectFilter = 'open';
            render();
            return;
        }
        if (confirmDeal) {
            openConfirmSign(confirmDeal.getAttribute('data-confirm-deal'));
            return;
        }
        if (withdraw) {
            openWithdraw(withdraw.getAttribute('data-withdraw'));
            return;
        }
        if (accept) {
            if (isServiceProvider()) {
                toast('服务商不能接单');
                return;
            }
            var code = accept.getAttribute('data-accept');
            var api = window.RbtDemandData;
            var result = api && typeof api.acceptDemand === 'function'
                ? api.acceptDemand(code, { name: traderName(), phone: account && account.phone })
                : { ok: false, reason: 'missing' };
            if (result && result.ok) openAcceptDone();
            else if (result && result.reason === 'provider') toast('服务商不能接单');
            else if (result && result.reason === 'missing') toast('需求单不存在');
            else toast('该需求单已被接单');
            render();
            return;
        }
        if (changePassword) {
            screen = 'password';
            render();
            return;
        }
        if (savePassword) {
            var oldPassword = String((document.getElementById('rbtH5OldPwd') || {}).value || '');
            var nextPassword = String((document.getElementById('rbtH5NewPwd') || {}).value || '');
            var confirmPassword = String((document.getElementById('rbtH5ConfirmPwd') || {}).value || '');
            if (window.RbtH5TraderLogin && window.RbtH5TraderLogin.changePassword(account.phone, oldPassword, nextPassword, confirmPassword)) {
                account = window.RbtH5TraderLogin.currentAccount() || account;
                screen = 'mine';
                render();
            }
            return;
        }
        var collectView = event.target.closest('[data-collect-view]');
        var collectBtn = event.target.closest('[data-collect]');
        if (collectView) {
            collectFilter = collectView.getAttribute('data-collect-view') === 'closed' ? 'closed' : 'open';
            tab = 'hall';
            screen = 'collect';
            render();
            return;
        }
        if (collectBtn) {
            var collectId = collectBtn.getAttribute('data-collect') || '';
            if (!collectId) return;
            collectCode = collectId;
            fundTab = 'base';
            tab = 'hall';
            screen = 'collect-bill';
            render();
            return;
        }
        var fundTabBtn = event.target.closest('[data-fund-tab]');
        if (fundTabBtn && screen === 'collect-bill') {
            fundTab = fundTabBtn.getAttribute('data-fund-tab') === 'share' ? 'share' : 'base';
            render();
            return;
        }
        if (back) {
            goBack(back.getAttribute('data-back') || 'home');
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
