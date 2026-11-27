/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var detailCode = '';
    var signCode = '';
    var collectFilter = 'open';
    var collectCode = '';
    var fundTab = 'base';
    /* 门店经营：渠道、总览／自定义时段、点选单日 */
    var bizChannel = 'all';
    var bizRangeMode = 'overview';
    var bizFrom = '';
    var bizTo = '';
    var bizFocusDate = '';
    var bizPreset = '';
    var overviewMode = '30';
    var overviewFrom = '';
    var overviewTo = '';
    var walletPane = 'main';
    var walletMethod = '';
    var walletSheet = '';
    var walletBind = { cardNo: '', bankId: '', phone: '', sms: '', sheet: '', modal: '' };
    var walletTab = 'all';
    var walletRange = '30';
    var walletFrom = '';
    var walletTo = '';
    var walletTimeOpen = false;
    var walletDraft = '';

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
        } else if (title) {
            title.textContent = screen === 'hall'
                ? '需求大厅'
                : (screen === 'detail' ? '需求详情' : (screen === 'sign' ? '合同签署' : (text || '贸易商端')));
        }
        if (head) head.textContent = text || '';
    }

    /* 二级回到基础工具，三级回到上一级。首页和我的没有上一级。 */
    function backTarget() {
        if (!account) return '';
        if (screen === 'collect-bill') return 'collect';
        if (screen === 'detail') return 'hall-back';
        if (screen === 'sign') return 'hall';
        if (screen === 'password') return 'mine';
        if (screen === 'wallet' && walletPane === 'bind') return 'wallet-recharge';
        if (screen === 'wallet' && walletPane !== 'main') return 'wallet-main';
        if (screen === 'collect' || screen === 'hall' || screen === 'wallet') return 'home';
        return '';
    }

    function syncHeadBack() {
        var btn = document.getElementById('rbtH5HeadBack');
        if (!btn) return;
        btn.classList.toggle('is-on', !!backTarget());
    }

    function goBack(target) {
        if (target === 'wallet-recharge') {
            walletPane = 'recharge';
            walletSheet = '';
            screen = 'wallet';
            tab = 'hall';
            render();
            return;
        }
        if (target === 'wallet-main') {
            walletPane = 'main';
            screen = 'wallet';
            tab = 'hall';
            render();
            return;
        }
        if (target === 'hall-back') {
            screen = 'hall';
            tab = 'hall';
            render();
            return;
        }
        screen = target || 'home';
        if (screen === 'hall') hallFilter = 'accepted';
        if (screen === 'collect' && collectFilter !== 'board') {
            collectFilter = collectFilter === 'closed' ? 'closed' : 'open';
        }
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

    function lineAmount(line) {
        var qty = Number(line && line.qty);
        var price = Number(line && line.salePrice);
        if (!isFinite(qty) || qty < 1) qty = 1;
        if (!isFinite(price)) return '—';
        return yuanText((Math.round(price * qty * 100) / 100).toFixed(2));
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

    /* 大厅收益 = 应收 − 应付。应付是确认签约时要支付并冻结的金额，等于商品金额。应收等于需求总金额，即商品金额 × 贸易商系数。 */
    function hallAmounts(item) {
        var goods = item && item.goodsAmount ? String(item.goodsAmount) : '';
        var goodsCents = centsOf(goods);
        var totalCents = centsOf(item && item.amount);
        if (totalCents == null && goodsCents != null) {
            var api = window.RbtDemandData;
            var rates = api && typeof api.settlementRates === 'function' ? api.settlementRates(item) : null;
            var traderPts = rates && rates.trader ? Math.round(Number(rates.trader) * 100) : null;
            if (traderPts > 0) totalCents = Math.round(goodsCents * traderPts / 100);
        }
        var receive = totalCents != null ? fromCents(totalCents) : '';
        var profit = goodsCents != null && totalCents != null ? fromCents(totalCents - goodsCents) : '';
        return {
            goods: goods || '—',
            paid: goods || '—',
            profit: profit || '—',
            total: receive || '—'
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
        return '';
    }

    function hallStatus(item, accepted) {
        var status = accepted ? (item.status || '已接单') : '待接单';
        var statusClass = status === '已完成' ? ' is-done' : (status === '已作废' || status === '已驳回' ? ' is-off' : '');
        return { text: status, className: statusClass };
    }

    function hallSummary(item, accepted) {
        var status = hallStatus(item, accepted);
        var amounts = hallAmounts(item);
        return '<article class="rbt-hall-card">' +
            '<div class="rbt-hall-card__top"><h2 class="rbt-hall-card__name">' + esc(item.storeName || '—') + '</h2>' +
            '<span class="rbt-hall-card__status' + status.className + '">' + esc(status.text) + '</span></div>' +
            '<p class="rbt-hall-card__meta">' + esc(item.code || '—') + ' · ' + esc(item.packageName || '—') + ' ' + esc(item.packageCode || '—') + '</p>' +
            '<div class="rbt-hall-card__total"><span>收益</span><b>' + esc(yuanText(amounts.profit)) + '</b></div>' +
            '<div class="rbt-hall-card__grid">' +
            hallCell('应付', yuanText(amounts.paid)) +
            hallCell('应收', yuanText(amounts.total)) +
            hallCell('结算周期', item.repayCycle || '—') +
            hallCell('结算方式', item.repayMethod || '—') +
            '</div>';
    }

    function renderHallCard(item, accepted) {
        var actions = hallActions(item, accepted);
        return hallSummary(item, accepted) +
            (actions ? '<div class="rbt-hall-card__foot">' + actions + '</div>' : '') +
            '</article>';
    }

    function renderHallSkus(item) {
        var lines = (item && item.skus) || [];
        if (!lines.length) return '<p class="rbt-hall-sheet__empty">暂无商品</p>';
        return lines.map(function (line) {
            var qty = Number(line && line.qty);
            if (!isFinite(qty) || qty < 1) qty = 1;
            var price = line && line.salePrice != null && line.salePrice !== '' ? yuanText(line.salePrice) : '—';
            var spec = [line && line.code, line && line.spec].filter(Boolean).join(' · ');
            return '<div class="rbt-hall-sku">' +
                '<div class="rbt-hall-sku__main"><strong>' + esc((line && (line.name || line.code)) || '—') + '</strong>' +
                '<p>' + esc(spec || '—') + '</p></div>' +
                '<div class="rbt-hall-sku__side"><b>' + esc(lineAmount(line)) + '</b><span>×' + qty + ' · ' + esc(price) + '</span></div>' +
                '</div>';
        }).join('');
    }

    /* 比例付不展示结算比例。其他结算方式在详情里展示期数。 */
    function renderHallSettle(item) {
        if (item && item.repayMethod && item.repayMethod !== '比例付') {
            return '<section class="rbt-hall-sheet"><h3>结算期数</h3>' +
                '<p class="rbt-hall-sheet__text">' + esc(item.repayPeriod || '—') + '期</p></section>';
        }
        return '';
    }

    function renderHallDetail(item) {
        var accepted = !!(item.traderName && item.traderName === traderName());
        return hallSummary(item, accepted) +
            '<p class="rbt-hall-card__meta">创建时间 ' + esc(item.createdAt || '—') + '</p>' +
            (accepted ? '<p class="rbt-hall-card__meta">接单时间 ' + esc(item.acceptedAt || '—') + '</p>' : '') +
            '</article>' +
            '<section class="rbt-hall-sheet"><h3>商品</h3>' + renderHallSkus(item) + '</section>' +
            renderHallSettle(item);
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = tab === 'hall' && screen === 'home';
        if (phone) {
            phone.classList.toggle('is-home', on);
            phone.classList.toggle('is-hall', screen === 'hall' || screen === 'detail');
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
            '<button type="button" class="rbt-h5-tool" data-entry="wallet">' +
            '<span class="rbt-h5-tool__icon" style="background:' + orange + '">' +
            svgIcon('<rect x="3" y="6" width="18" height="13" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M3 10h18" stroke="#fff" stroke-width="1.6"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/>') +
            '</span><span>钱包</span></button>' +
            '</div></section></div>';
    }

    function phaseLabel(status) {
        if (status === '门店付款中' || status === '还款中') return '付款中';
        return status || '—';
    }

    function yuan(value) {
        if (value == null || value === '' || value === '—') return '—';
        return '¥' + value;
    }

    /* 已结款是门店已经到账、整笔记给贸易商的金额。已冻结和在途仍是待结款。最近一天结算单未确定，明细行仍记待结款。
       结款不按渠道拆开：各渠道佣金进门店钱包后，用佣金余额支付，同一天多渠道合成一笔。后台每日付款页仍按旧口径拆分。 */
    function traderSettled(item) {
        var daily = window.RbtDailyFulfill;
        var rows = daily && typeof daily.payeeSplit === 'function' ? daily.payeeSplit(item) : [];
        if (!rows.length) return { total: '', pending: '', shares: [] };
        var facts = {};
        if (typeof daily.daysOf === 'function') {
            daily.daysOf(item).forEach(function (row) {
                if (row && row.id) facts[row.id] = row;
            });
        }
        var shares = rows.map(function (row) {
            var fact = facts[row.id] || {};
            var manual = row.kind === 'manual';
            return {
                date: row.date,
                time: row.time || fact.time || '',
                channel: row.channel,
                kind: row.kind || '',
                amount: manual ? row.trader : (fact.actual || fact.due || row.trader),
                turnover: manual ? '' : (fact.turnover || ''),
                commission: manual ? '' : (fact.commission || ''),
                ratio: manual ? '' : (fact.ratio || ''),
                actual: fact.actual || fact.due || '',
                payMethod: fact.payMethod || '',
                fundStatus: manual ? 'arrived' : (fact.fundStatus || '')
            };
        }).filter(function (row) {
            if (row.kind !== 'manual') return true;
            return Math.round(Number(row.amount) * 100) > 0;
        });
        var settledCents = 0;
        var pendingCents = 0;
        shares.forEach(function (row) {
            var cents = Math.round(Number(row.amount) * 100);
            if (!isFinite(cents)) cents = 0;
            var open = row.fundStatus === 'inflight' || row.fundStatus === 'frozen' || row.fundStatus === 'missing' || row.fundStatus === 'pending_freeze';
            row.stage = row.kind !== 'manual' && open ? 'pending' : 'due';
            if (row.stage === 'pending') pendingCents += cents;
            else settledCents += cents;
        });
        return {
            total: (settledCents / 100).toFixed(2),
            pending: (pendingCents / 100).toFixed(2),
            shares: mergeWalletShares(shares)
        };
    }

    /* 同一天的 POS、商城、直播合成一笔佣金余额结款。一键付款仍单独成行。 */
    function mergeWalletShares(rows) {
        var grouped = {};
        var order = [];
        rows.forEach(function (row) {
            if (!row || row.kind === 'manual') {
                order.push(row);
                return;
            }
            var key = row.date || '';
            if (!grouped[key]) {
                grouped[key] = {
                    date: row.date,
                    time: row.time || '',
                    kind: '',
                    amountCents: 0,
                    turnoverCents: 0,
                    commissionCents: 0,
                    actualCents: 0,
                    stage: row.stage || 'due'
                };
                order.push(grouped[key]);
            }
            var bucket = grouped[key];
            bucket.amountCents += centsOf(row.amount) || 0;
            bucket.turnoverCents += centsOf(row.turnover) || 0;
            bucket.commissionCents += centsOf(row.commission) || 0;
            bucket.actualCents += centsOf(row.actual) || 0;
            if (row.stage === 'pending') bucket.stage = 'pending';
        });
        return order.map(function (row) {
            if (!row || row.kind === 'manual') return row;
            return {
                date: row.date,
                time: row.time,
                channel: '',
                kind: '',
                amount: fromCents(row.amountCents),
                turnover: fromCents(row.turnoverCents),
                commission: fromCents(row.commissionCents),
                ratio: '',
                actual: fromCents(row.actualCents),
                payMethod: '营业收入',
                stage: row.stage
            };
        });
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
        return {
            receivable: amounts.total,
            goods: amounts.goods,
            paid: amounts.paid,
            profit: amounts.profit,
            settled: settledText,
            pending: pending,
            shares: settled.shares,
            account: TRADER_ACCOUNTS[item && item.traderName] || TRADER_ACCOUNTS[traderName()] || null
        };
    }

    function closedBid(item) {
        return item && (item.status === '已完成' || item.status === '已作废' || item.status === '已驳回');
    }

    /* 收款列表的跟进中只放付款中。待确认签约、待签署、待付款不在这里。 */
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

    function collectTabs() {
        function tab(id, label) {
            return '<button type="button" data-collect-view="' + id + '"' +
                (collectFilter === id ? ' class="is-on"' : '') + '>' + label + '</button>';
        }
        return '<div class="rbt-fund__tabs" role="tablist">' +
            tab('open', '付款中') + tab('closed', '已结束') + tab('board', '数据总览') +
            '</div>';
    }

    function packFunds(items) {
        var funds = items.map(function (item) { return fundOf(item); });
        return {
            count: items.length,
            receivable: sumMoney(funds, 'receivable'),
            settled: sumMoney(funds, 'settled'),
            pending: sumMoney(funds, 'pending')
        };
    }

    function pendingText(value, kind) {
        if (value) return yuan(value);
        if (kind === 'paying' || kind === 'other') return '未产生';
        if (kind === 'closed' || kind === 'done' || kind === 'void' || kind === 'reject') return '无';
        return '—';
    }

    function boardMetrics(pack, kind) {
        return '<div class="rbt-board-metrics">' +
            '<div><span>笔数</span><b>' + pack.count + '</b></div>' +
            '<div><span>应收</span><b>' + esc(pack.receivable ? yuan(pack.receivable) : '—') + '</b></div>' +
            '<div><span>已结款</span><b>' + esc(pack.settled ? yuan(pack.settled) : '未产生') + '</b></div>' +
            '<div><span>待结款</span><b>' + esc(pendingText(pack.pending, kind)) + '</b></div>' +
            '</div>';
    }

    /* 收款总览：付款中、已结束的汇总从列表挪到这里，并按状态、门店汇总当前贸易商在平台上的单。 */
    function renderCollectBoard() {
        var paying = collectDemands(false);
        var closed = collectDemands(true);
        var scoped = paying.concat(closed);
        var all = acceptedDemands();
        var total = packFunds(all);
        var statuses = [
            { label: '付款中', items: paying, kind: 'paying' },
            { label: '已完成', items: closed.filter(function (item) { return item.status === '已完成'; }), kind: 'done' }
        ];
        var extraMap = {};
        var extras = [];
        acceptedDemands().forEach(function (item) {
            if (fulfillingBid(item) || closedBid(item)) return;
            var label = item.status || '其他';
            if (label === '发货中') return;
            if (!extraMap[label]) {
                extraMap[label] = { label: label, items: [], kind: 'other' };
                extras.push(extraMap[label]);
            }
            extraMap[label].items.push(item);
        });
        var statusHtml = statuses.concat(extras).map(function (row) {
            return '<article class="rbt-board-card"><header><strong>' + esc(row.label) + '</strong><em>' +
                row.items.length + ' 笔</em></header>' + boardMetrics(packFunds(row.items), row.kind) + '</article>';
        }).join('');
        var stores = {};
        var storeOrder = [];
        acceptedDemands().forEach(function (item) {
            var name = item.storeName || '—';
            if (!stores[name]) {
                stores[name] = { name: name, items: [], paying: 0, closed: 0, other: 0 };
                storeOrder.push(stores[name]);
            }
            var bucket = stores[name];
            bucket.items.push(item);
            if (fulfillingBid(item)) bucket.paying += 1;
            else if (closedBid(item)) bucket.closed += 1;
            else bucket.other += 1;
        });
        var storeRows = storeOrder.map(function (row) {
            var pack = packFunds(row.items);
            var hint = [];
            if (row.paying) hint.push('付款中 ' + row.paying + ' 笔');
            if (row.closed) hint.push('已结束 ' + row.closed + ' 笔');
            if (row.other) hint.push('其他 ' + row.other + ' 笔');
            return {
                name: row.name,
                hint: hint.join(' · '),
                pack: pack,
                receivableCents: centsOf(pack.receivable) || 0
            };
        }).sort(function (a, b) {
            return b.receivableCents - a.receivableCents || a.name.localeCompare(b.name, 'zh');
        });
        var storeHtml = storeRows.length ? storeRows.map(function (row) {
            return '<article class="rbt-board-store"><header><strong>' + esc(row.name) + '</strong><em>' +
                row.pack.count + ' 笔</em></header><p>' + esc(row.hint || '暂无分状态') + '</p>' +
                boardMetrics(row.pack, 'mixed') + '</article>';
        }).join('') : '<p class="rbt-h5-empty">暂无门店数据</p>';
        var dailyCents = 0;
        var manualCents = 0;
        var dueCount = 0;
        var waitCount = 0;
        scoped.forEach(function (item) {
            (fundOf(item).shares || []).forEach(function (share) {
                var cents = centsOf(share.amount);
                if (cents == null) return;
                if (share.stage === 'pending') {
                    waitCount += 1;
                    return;
                }
                dueCount += 1;
                if (share.kind === 'manual') manualCents += cents;
                else dailyCents += cents;
            });
        });
        setHead('收款');
        return '<div class="rbt-fund">' + collectTabs() +
            '<div class="rbt-board">' +
            '<h2>平台合计</h2>' +
            '<section class="rbt-board__total">' + boardMetrics(total, 'paying') + '</section>' +
            '<h2>按状态</h2>' + statusHtml +
            '<h2>按门店</h2>' + storeHtml +
            '<h2>结款构成</h2>' +
            '<section class="rbt-board__total">' +
            '<div class="rbt-board-metrics">' +
            '<div><span>当日支付</span><b>' + esc(dailyCents ? yuan(fromCents(dailyCents)) : '未产生') + '</b></div>' +
            '<div><span>提前支付</span><b>' + esc(manualCents ? yuan(fromCents(manualCents)) : '未产生') + '</b></div>' +
            '<div><span>已到账笔数</span><b>' + dueCount + '</b></div>' +
            '<div><span>待到账笔数</span><b>' + waitCount + '</b></div>' +
            '</div></section></div></div>';
    }

    function renderCollect() {
        if (collectFilter === 'board') return renderCollectBoard();
        var closed = collectFilter === 'closed';
        var rows = collectDemands(closed);
        setHead('收款');
        return '<div class="rbt-fund">' + collectTabs() +
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
            }).join('') : '<div class="rbt-h5-empty">' + (closed ? '暂无已结束的接单' : '暂无付款中的接单') + '</div>') +
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

    /* 两份合同都签完的最晚时间，就是合同内容生效的时间。 */
    function effectTimeOf(item) {
        var api = window.RbtDemandData;
        if (!item || !api || typeof api.signContracts !== 'function') return '';
        var contracts = api.signContracts(item) || [];
        if (!contracts.length || contracts.some(function (contract) { return !contract || contract.signStatus !== '已签署'; })) return '';
        var latest = '';
        contracts.forEach(function (contract) {
            (contract.parties || []).forEach(function (party) {
                if (party && party.signedAt && party.signedAt > latest) latest = party.signedAt;
            });
        });
        return latest;
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

    /* 已结款的结款时间是营业日次日 08:00:00，只写月日时分秒。一键付款用实际支付时间。待结款还没结，时间用 -。 */
    function paidClock(raw) {
        var matched = String(raw || '').match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})/);
        if (!matched) return '';
        return Number(matched[2]) + '月' + Number(matched[3]) + '日 ' + matched[4];
    }

    function monthDay(date) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return date || '—';
        return Number(parts[1]) + '月' + Number(parts[2]) + '日';
    }

    function shareTitle(row) {
        var day = monthDay(row && row.date);
        if (row && row.kind === 'manual') return day + ' · 提前支付';
        return day + ' · 当日支付';
    }

    function opsMoney(value) {
        if (value == null || value === '' || value === '—') return '—';
        return yuan(value);
    }

    function opsFact(label, value, kind) {
        return '<span class="rbt-ops__fact' + (kind ? ' is-' + kind : '') + '"><i>' + esc(label) + '</i><b>' + esc(value) + '</b></span>';
    }

    function renderShareCards(shares) {
        return shares.map(function (row) {
                var pendingRow = row.stage === 'pending';
                var manual = row.kind === 'manual';
                var when = pendingRow ? '-' : (manual ? (paidClock(row.time) || settleClock(row.date)) : settleClock(row.date));
                var facts = manual
                    ? opsFact('支付方式', row.payMethod || '—', 'pay')
                    : opsFact('营业额', opsMoney(row.turnover), 'amount') +
                        opsFact('支付方式', row.payMethod || '营业收入', 'pay');
                return '<article class="rbt-ops">' +
                    '<header class="rbt-ops__head"><b>' + esc(shareTitle(row)) + '</b>' +
                    '<em class="' + (pendingRow ? '' : 'is-due') + '">' + (pendingRow ? '待结款' : '已结款') + '</em></header>' +
                    '<div class="rbt-ops__grid' + (manual ? ' is-single' : '') + '">' +
                    facts +
                    '</div>' +
                    '<footer class="rbt-ops__foot">' +
                    '<span><i>结款时间</i><b>' + esc(when) + '</b></span>' +
                    '<span><i>我的结款</i><b class="is-mine">' + esc(yuan(row.amount)) + '</b></span>' +
                    '</footer></article>';
            }).join('');
    }

    function bizMoney(value) {
        var api = window.RbtTraderStoreBiz;
        if (value == null || value === '') return '—';
        return '¥' + (api && api.money ? api.money(value) : Number(value).toFixed(2));
    }

    function bizSeriesOf(pack) {
        if (!pack || !pack.ready) return [];
        if (bizChannel === 'all') return pack.series || [];
        var hit = (pack.channels || []).filter(function (ch) { return ch.id === bizChannel; })[0];
        return hit ? hit.series || [] : [];
    }

    function bizPackOf(item) {
        var api = window.RbtTraderStoreBiz;
        if (!api || typeof api.buildCollectStoreBiz !== 'function') {
            return { ready: false, tip: '门店经营数据不可用', channels: [] };
        }
        return api.buildCollectStoreBiz(item, {
            rangeMode: bizRangeMode,
            from: bizFrom,
            to: bizTo,
            focusDate: bizFocusDate
        });
    }

    /* 轴标签：同月 M/D；跨月首点或换月用 M月D日；跨年换年用 YY/M/D */
    function bizChartAxisMode(series) {
        var years = {};
        var months = {};
        (series || []).forEach(function (row) {
            var parts = String(row.date || '').split('-');
            if (parts.length < 3) return;
            years[parts[0]] = true;
            months[parts[0] + '-' + parts[1]] = true;
        });
        var yearCount = Object.keys(years).length;
        var monthCount = Object.keys(months).length;
        if (yearCount > 1) return 'year';
        if (monthCount > 1) return 'month';
        return 'day';
    }

    function bizChartAxisLabel(date, mode, prevDate) {
        var parts = String(date || '').split('-');
        if (parts.length < 3) return date || '';
        var y = parts[0];
        var m = Number(parts[1]);
        var d = Number(parts[2]);
        var prev = String(prevDate || '').split('-');
        var yearChanged = !prevDate || prev[0] !== y;
        var monthChanged = !prevDate || prev[0] !== y || prev[1] !== parts[1];
        if (mode === 'year') {
            if (yearChanged) return y.slice(2) + '/' + m + '/' + d;
            if (monthChanged) return m + '月' + d;
            return m + '/' + d;
        }
        if (mode === 'month') {
            if (monthChanged) return m + '月' + d + '日';
            return m + '/' + d;
        }
        return m + '/' + d;
    }

    function bizChartShouldShowLabel(series, index, mode) {
        if (!series || !series.length) return false;
        if (index === 0 || index === series.length - 1) return true;
        var prev = series[index - 1] && series[index - 1].date;
        var cur = series[index] && series[index].date;
        var prevParts = String(prev || '').split('-');
        var curParts = String(cur || '').split('-');
        if (mode === 'year' && prevParts[0] !== curParts[0]) return true;
        if ((mode === 'year' || mode === 'month') && (prevParts[0] !== curParts[0] || prevParts[1] !== curParts[1])) {
            return true;
        }
        var step = series.length > 14 ? Math.ceil(series.length / 6) : series.length > 6 ? 2 : 1;
        return index % step === 0;
    }

    /* 营业额单折线；圆点可点选单日高亮；跨月／跨年轴签换样式 */    function renderBizChart(series, focusDate) {
        if (!series || !series.length) {
            return '<div class="rbt-biz-chart rbt-biz-chart--empty">该时段暂无曲线数据</div>';
        }
        var mode = bizChartAxisMode(series);
        var w = 320;
        var h = mode === 'year' ? 160 : mode === 'month' ? 154 : 148;
        var padL = mode === 'year' ? 10 : 8;
        var padR = mode === 'year' ? 10 : 8;
        var padT = 12;
        var padB = mode === 'year' ? 30 : mode === 'month' ? 26 : 22;
        var max = 0;
        series.forEach(function (row) {
            max = Math.max(max, Number(row.turnover) || 0);
        });
        if (max <= 0) max = 1;
        var innerW = w - padL - padR;
        var innerH = h - padT - padB;
        function xAt(i) {
            if (series.length === 1) return padL + innerW / 2;
            return padL + (innerW * i) / (series.length - 1);
        }
        function yAt(v) {
            return padT + innerH * (1 - (Number(v) || 0) / max);
        }
        function pathOf(key) {
            return series.map(function (row, i) {
                return (i ? 'L' : 'M') + xAt(i).toFixed(1) + ' ' + yAt(row[key]).toFixed(1);
            }).join(' ');
        }
        var guides = '';
        series.forEach(function (row, i) {
            if (i === 0) return;
            var prevParts = String(series[i - 1].date || '').split('-');
            var curParts = String(row.date || '').split('-');
            var yearBreak = prevParts[0] !== curParts[0];
            var monthBreak = yearBreak || prevParts[1] !== curParts[1];
            if ((mode === 'year' && yearBreak) || (mode === 'month' && monthBreak)) {
                var gx = xAt(i).toFixed(1);
                guides +=
                    '<line class="rbt-biz-chart__guide' +
                    (yearBreak ? ' is-year' : '') +
                    '" x1="' +
                    gx +
                    '" y1="' +
                    padT +
                    '" x2="' +
                    gx +
                    '" y2="' +
                    (padT + innerH).toFixed(1) +
                    '"/>';
            }
        });
        var labels = series
            .map(function (row, i) {
                if (!bizChartShouldShowLabel(series, i, mode)) return '';
                var prev = i > 0 ? series[i - 1].date : '';
                var text = bizChartAxisLabel(row.date, mode, prev);
                var cls = 'rbt-biz-chart__tick';
                var prevParts = String(prev || '').split('-');
                var curParts = String(row.date || '').split('-');
                if (mode === 'year' && (!prev || prevParts[0] !== curParts[0])) cls += ' is-year';
                else if ((mode === 'year' || mode === 'month') && (!prev || prevParts[1] !== curParts[1] || prevParts[0] !== curParts[0])) {
                    cls += ' is-month';
                }
                return (
                    '<text class="' +
                    cls +
                    '" x="' +
                    xAt(i).toFixed(1) +
                    '" y="' +
                    (h - 6) +
                    '" text-anchor="middle">' +
                    esc(text) +
                    '</text>'
                );
            })
            .join('');
        var dots = series
            .map(function (row, i) {
                var on = focusDate && row.date === focusDate;
                var cx = xAt(i).toFixed(1);
                return (
                    '<g class="rbt-biz-chart__hit' +
                    (on ? ' is-on' : '') +
                    '" data-biz-day="' +
                    esc(row.date) +
                    '">' +
                    '<circle class="rbt-biz-chart__hot" cx="' +
                    cx +
                    '" cy="' +
                    (padT + innerH / 2).toFixed(1) +
                    '" r="14"/>' +
                    '<circle class="rbt-biz-chart__dot is-turnover" cx="' +
                    cx +
                    '" cy="' +
                    yAt(row.turnover).toFixed(1) +
                    '" r="' +
                    (on ? 4.5 : 3) +
                    '"/>' +
                    '</g>'
                );
            })
            .join('');
        var metricLabel = '营业额';
        var spanCls =
            mode === 'year' ? ' rbt-biz-chart--cross-year' : mode === 'month' ? ' rbt-biz-chart--cross-month' : '';
        return (
            '<div class="rbt-biz-chart' +
            spanCls +
            '">' +
            '<svg viewBox="0 0 ' +
            w +
            ' ' +
            h +
            '" role="img" aria-label="' +
            esc(metricLabel) +
            '曲线，可点选单日">' +
            guides +
            '<path class="rbt-biz-chart__line is-turnover" d="' +
            pathOf('turnover') +
            '" fill="none"/>' +
            labels +
            dots +
            '</svg>' +
            '<div class="rbt-biz-chart__legend"><span class="is-turnover">' +
            esc(metricLabel) +
            '</span></div>' +
            '<p class="rbt-biz-chart__hint">点击趋势图可高亮当日</p>' +
            '</div>'
        );    }

    function renderCollectBiz(item) {
        var api = window.RbtTraderStoreBiz;
        var pack = bizPackOf(item);
        if (!pack.ready) {
            return '<section class="rbt-biz">' +
                '<p class="rbt-ops__note">' + esc(pack.tip || '暂无门店经营数据') + '</p>' +
                '<p class="rbt-bill__empty">暂无门店经营数据</p></section>';
        }
        if (!bizFrom) bizFrom = pack.windowFrom || '';
        if (!bizTo) bizTo = pack.windowTo || '';
        var rangeChips =
            '<div class="rbt-biz-range">' +
            '<button type="button" class="rbt-biz-chip' + (bizRangeMode === 'overview' ? ' is-on' : '') +
            '" data-biz-range="overview">总览</button>' +
            '<button type="button" class="rbt-biz-chip' + (bizRangeMode === 'custom' ? ' is-on' : '') +
            '" data-biz-range="custom">自定义时段</button>' +
            '</div>';
        var presets = (api && api.CUSTOM_RANGE_PRESETS) || [];
        var presetChips = presets
            .map(function (p) {
                var inWin =
                    (!pack.windowFrom || p.from >= pack.windowFrom) &&
                    (!pack.windowTo || p.to <= pack.windowTo);
                if (!inWin) return '';
                return (
                    '<button type="button" class="rbt-biz-chip rbt-biz-chip--preset' +
                    (bizPreset === p.id ? ' is-on' : '') +
                    '" data-biz-preset="' +
                    esc(p.id) +
                    '" data-biz-from-set="' +
                    esc(p.from) +
                    '" data-biz-to-set="' +
                    esc(p.to) +
                    '">' +
                    esc(p.label) +
                    '</button>'
                );
            })
            .join('');
        var rangePick =
            bizRangeMode === 'custom'
                ? (presetChips ? '<div class="rbt-biz-presets">' + presetChips + '</div>' : '') +
                  '<div class="rbt-biz-dates">' +
                  '<label>开始<input type="date" data-biz-from value="' +
                  esc(bizFrom || pack.windowFrom || '') +
                  '" min="' +
                  esc(pack.windowFrom || '') +
                  '" max="' +
                  esc(pack.windowTo || '') +
                  '"></label>' +
                  '<label>结束<input type="date" data-biz-to value="' +
                  esc(bizTo || pack.windowTo || '') +
                  '" min="' +
                  esc(pack.windowFrom || '') +
                  '" max="' +
                  esc(pack.windowTo || '') +
                  '"></label>' +
                  '<button type="button" class="rbt-biz-apply" data-biz-apply>查询</button>' +
                  '</div>'
                : '<p class="rbt-biz-window">总览区间：' +
                  esc(pack.windowFrom || '—') +
                  ' 至 ' +
                  esc(pack.windowTo || '—') +
                  '</p>';
        var channelChips = [{ id: 'all', label: '全部' }].concat(
            (api && api.BIZ_CHANNELS) || [{ id: 'POS', label: 'POS' }, { id: '直播', label: '直播' }, { id: '商城', label: '商城' }]
        ).map(function (ch) {
            return '<button type="button" class="rbt-biz-chip' + (bizChannel === ch.id ? ' is-on' : '') +
                '" data-biz-channel="' + esc(ch.id) + '">' + esc(ch.label) + '</button>';
        }).join('');
        var posChannel = null;
        var otherCards = [];
        (pack.channels || []).forEach(function (ch) {
            if (ch.id === 'POS') posChannel = ch;
            else otherCards.push(ch);
        });
        var posCard = '';
        if (posChannel) {
            var modules = posChannel.posModules || [];
            var moduleHtml = modules.length
                ? '<div class="rbt-biz-channel__subs">' +
                  modules
                    .map(function (mod) {
                        return (
                            '<div class="rbt-biz-channel__sub">' +
                            '<span>' +
                            esc(mod.label) +
                            '</span><b>' +
                            esc(bizMoney(mod.turnover)) +
                            '</b></div>'
                        );
                    })
                    .join('') +
                  '</div>'
                : '<div class="rbt-biz-channel__metric"><span>营业额</span><b>' +
                  esc(bizMoney(posChannel.turnoverTotal)) +
                  '</b></div>';
            posCard =
                '<article class="rbt-biz-channel rbt-biz-channel--pos">' +
                '<header>' +
                esc(posChannel.label) +
                '</header>' +
                '<div class="rbt-biz-channel__metric rbt-biz-channel__total">' +
                '<span>营业额合计</span><b>' +
                esc(bizMoney(posChannel.turnoverTotal)) +
                '</b></div>' +
                moduleHtml +
                '</article>';
        }
        var otherHtml = otherCards
            .map(function (ch) {
                return (
                    '<article class="rbt-biz-channel rbt-biz-channel--estimate">' +
                    '<header>' +
                    esc(ch.label) +
                    '</header>' +
                    '<div class="rbt-biz-channel__metric">' +
                    '<span>营业额</span><b>' +
                    esc(bizMoney(ch.turnoverTotal)) +
                    '</b></div>' +
                    '</article>'
                );
            })
            .join('');
        var channelCards =
            posCard +
            (otherHtml
                ? '<div class="rbt-biz-channels__estimate">' + otherHtml + '</div>'
                : '');
        var focusBits = (pack.focusChannels || []).map(function (ch) {
            return '<div class="rbt-biz-focus__ch"><em>' + esc(ch.label) + '</em>' +
                '<span>' + esc(bizMoney(ch.turnover)) + '</span></div>';
        }).join('');
        var dateText = pack.focusDate ? monthDay(pack.focusDate) : '—';
        var clearDay = bizFocusDate
            ? '<button type="button" class="rbt-biz-clear" data-biz-clear-day>清除单日高亮</button>'
            : '';
        var tipHtml = pack.tip ? '<p class="rbt-ops__note">' + esc(pack.tip) + '</p>' : '';
        return '<section class="rbt-biz">' +
            tipHtml +
            rangeChips + rangePick +
            '<div class="rbt-biz-hero"><span>' + (bizRangeMode === 'custom' ? '时段营业额' : '门店营业额') + '</span><b>' +
            esc(bizMoney(pack.turnoverTotal)) + '</b></div>' +
            '<div class="rbt-biz-channels">' + channelCards + '</div>' +
            '<div class="rbt-biz-focus">' +
            '<header><span>' + esc((pack.focusLabel || '当日') + ' · ' + dateText) + '</span>' +
            (pack.frozen ? '<i class="is-frozen">已冻结</i>' : '') + '</header>' +
            '<div class="rbt-biz-focus__total"><span>营业额 <b>' + esc(bizMoney(pack.focusTurnover)) + '</b></span></div>' +
            (pack.hasSeries || bizFocusDate ? focusBits : '<p class="rbt-bill__empty">该时段暂无拆分数据</p>') +
            '</div>' +
            '<div class="rbt-biz-curve">' +
            '<div class="rbt-biz-curve__head"><strong>经营曲线</strong>' +
            '<div class="rbt-biz-chips">' + channelChips + '</div>' + clearDay + '</div>' +
            renderBizChart(bizSeriesOf(pack), pack.focusDate) +
            '</div></section>';
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
            ['商品金额（原价）', yuan(fund.goods)],
            ['实付', fund.paid && fund.paid !== '—' ? yuan(fund.paid) : '—'],
            ['收益', fund.profit && fund.profit !== '—' ? yuan(fund.profit) : '—'],
            ['结算比例', ratioText(item)],
            ['接单时间', item.acceptedAt || '—'],
            ['支付时间', payTimeOf(item) || '—'],
            ['签署时间', effectTimeOf(item) || '—'],
            ['已结款', fund.settled ? yuan(fund.settled) : '未产生'],
            ['待结款', fund.pending ? yuan(fund.pending) : (item.status === '已完成' ? '无' : '未产生')],
            ['收款账户名称', payee.accountName || '—'],
            ['收款账户', payee.accountNo || '—']
        ];
        if (fundTab === 'overview') fundTab = 'share';
        var shares = fund.shares.slice().reverse();
        var sheet =
            fundTab === 'share'
                ? renderShareSheet(shares)
                : fundTab === 'biz'
                        ? '<section class="rbt-bill__sheet">' + renderCollectBiz(item) + '</section>'
                        : '<section class="rbt-bill__sheet">' +
                            lines.map(function (line) {
                                return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
                            }).join('') +
                            renderSignedContracts(item) +
                            '</section>';
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
            '<button type="button" data-fund-tab="base"' + (fundTab === 'base' ? ' class="is-on"' : '') + '>基础信息</button>' +
            '<button type="button" data-fund-tab="share"' + (fundTab === 'share' ? ' class="is-on"' : '') + '>结款明细</button>' +
            '<button type="button" data-fund-tab="biz"' + (fundTab === 'biz' ? ' class="is-on"' : '') + '>门店经营</button>' +
            '</div>' +
            sheet;
    }

    /* 本单结款：时间选择在汇总卡片上方，同时筛汇总和下面这一单的结款卡片。已结款是已到账的当日支付加提前支付。 */
    function shareInRange(share) {
        var wallet = window.RbtPartyWallet;
        var date = wallet && wallet.queryDate ? wallet.queryDate(share) : ((share && share.date) || '');
        if (wallet && wallet.dateInRange) return wallet.dateInRange(date, overviewMode, overviewFrom, overviewTo);
        return overviewMode === 'all';
    }

    function renderShareSheet(shares) {
        var waiting = overviewMode === 'custom' && (!overviewFrom || !overviewTo);
        var shown = waiting ? [] : (shares || []).filter(shareInRange);
        var pendingCents = 0;
        var dailyCents = 0;
        var manualCents = 0;
        shown.forEach(function (share) {
            var cents = centsOf(share.amount);
            if (cents == null) return;
            if (share.stage === 'pending') pendingCents += cents;
            else if (share.kind === 'manual') manualCents += cents;
            else dailyCents += cents;
        });
        function money(cents) {
            if (waiting) return '—';
            return yuan(fromCents(cents));
        }
        function chip(id, label) {
            return '<button type="button" class="rbt-party-chip' + (overviewMode === id ? ' is-on' : '') + '" data-ov-mode="' + id + '">' + label + '</button>';
        }
        var dates = overviewMode === 'custom'
            ? '<div class="rbt-party-dates">' +
                '<label>开始<input type="date" data-ov-from value="' + esc(overviewFrom || '') + '"></label>' +
                '<label>结束<input type="date" data-ov-to value="' + esc(overviewTo || '') + '"></label>' +
                '<button type="button" class="rbt-party-apply" data-ov-apply>查询</button></div>'
            : '';
        var cards = waiting
            ? '<p class="rbt-bill__empty">选择起止日期后查询</p>'
            : (shown.length ? renderShareCards(shown) : '<p class="rbt-bill__empty">该时段暂无结款</p>');
        return '<section class="rbt-bill__sheet rbt-share-page">' +
            '<div class="rbt-share-range">' +
            '<div class="rbt-party-chips">' +
            chip('7', '近7天') + chip('30', '近30天') + chip('all', '全部') + chip('custom', '自定义') +
            '</div>' + dates +
            '</div>' +
            '<section class="rbt-share-board">' +
            '<div class="rbt-share-board__metrics">' +
            '<div><span>已结款</span><b>' + esc(money(dailyCents + manualCents)) + '</b></div>' +
            '<div><span>待结款</span><b>' + esc(money(pendingCents)) + '</b></div>' +
            '<div><span>当日支付</span><b>' + esc(money(dailyCents)) + '</b></div>' +
            '<div><span>提前支付</span><b>' + esc(money(manualCents)) + '</b></div>' +
            '</div></section>' +
            '<section class="rbt-share-detail"><h3>结款明细</h3>' + cards + '</section></section>';
    }

    function renderWallet() {
        var titles = { recharge: '充值', withdraw: '提现', bind: '绑定银行卡' };
        setHead(titles[walletPane] || '钱包');
        var wallet = window.RbtPartyWallet;
        if (!wallet || typeof wallet.walletHtml !== 'function') return '<div class="rbt-h5-empty">钱包不可用</div>';
        return wallet.walletHtml({
            role: 'trader',
            name: traderName(),
            pane: walletPane,
            method: walletMethod,
            sheet: walletSheet,
            bind: walletBind,
            holder: traderName(),
            tab: walletTab,
            range: walletRange,
            from: walletFrom,
            to: walletTo,
            timeOpen: walletTimeOpen,
            account: TRADER_ACCOUNTS[traderName()] || null,
            draft: walletDraft
        });
    }

    function validAmount(raw) {
        return /^\d+(\.\d{1,2})?$/.test(raw) && Number(raw) > 0;
    }

    function closePartyPwd() {
        var node = document.getElementById('rbtPartyPwd');
        if (node) node.remove();
    }

    function openPartyPwd(amountText, onOk) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closePartyPwd();
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
            '<div class="rbt-party-pwd__body"><p class="rbt-party-pwd__amount">' + esc(amountText) + '</p>' +
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
                closePartyPwd();
                return;
            }
            var keyBtn = event.target.closest('[data-party-key]');
            if (!keyBtn) return;
            var key = keyBtn.getAttribute('data-party-key');
            if (key === 'del') pwd = pwd.slice(0, -1);
            else if (pwd.length < 6) pwd += key;
            paint();
            if (pwd.length < 6) return;
            var wallet = window.RbtPartyWallet;
            var result = wallet && wallet.verifyPassword ? wallet.verifyPassword(pwd) : { ok: false };
            if (!result || !result.ok) {
                pwd = '';
                paint();
                var error = node.querySelector('.rbt-party-pwd__error');
                if (error) error.textContent = '密码输入错误，请重新输入';
                return;
            }
            closePartyPwd();
            onOk();
        });
        phone.appendChild(node);
        paint();
    }

    function applyPartyRange(kind) {
        var fromName = kind === 'overview' ? '[data-ov-from]' : '[data-wallet-from]';
        var toName = kind === 'overview' ? '[data-ov-to]' : '[data-wallet-to]';
        var from = String((document.querySelector(fromName) || {}).value || '');
        var to = String((document.querySelector(toName) || {}).value || '');
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
            var result = api && api.bindCard ? api.bindCard(traderName(), walletBind) : { ok: false };
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

    function handlePartyClick(event) {
        var modeBtn = event.target.closest('[data-ov-mode]');
        if (modeBtn && screen === 'collect-bill') {
            overviewMode = modeBtn.getAttribute('data-ov-mode') || '30';
            render();
            return true;
        }
        if (event.target.closest('[data-ov-apply]')) {
            applyPartyRange('overview');
            return true;
        }
        var go = event.target.closest('[data-wallet-go]');
        if (go && screen === 'wallet') {
            walletPane = go.getAttribute('data-wallet-go') === 'recharge' ? 'recharge' : 'withdraw';
            walletDraft = '';
            walletSheet = '';
            walletTimeOpen = false;
            render();
            return true;
        }
        var keyBtn = event.target.closest('[data-wallet-key]');
        if (keyBtn && screen === 'wallet') {
            var amountApi = window.RbtPartyWallet;
            walletDraft = amountApi && amountApi.editAmount ? amountApi.editAmount(walletDraft, keyBtn.getAttribute('data-wallet-key')) : walletDraft;
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-method-open]') && screen === 'wallet') {
            walletSheet = 'method';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-sheet-close]') && screen === 'wallet') {
            walletSheet = '';
            render();
            return true;
        }
        var pick = event.target.closest('[data-wallet-pick]');
        if (pick && screen === 'wallet') {
            walletMethod = pick.getAttribute('data-wallet-pick') || '';
            walletSheet = '';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-add-card]') && screen === 'wallet') {
            walletBind = { cardNo: '', bankId: '', phone: '', sms: '', sheet: '', modal: '' };
            walletPane = 'bind';
            walletSheet = '';
            render();
            return true;
        }
        if (handleBindClick(event)) return true;
        if (event.target.closest('[data-wallet-all]') && screen === 'wallet') {
            var snapApi = window.RbtPartyWallet;
            var snap = snapApi && snapApi.snapshot ? snapApi.snapshot('trader', traderName()) : null;
            walletDraft = snap ? Number(snap.withdrawable || 0).toFixed(2) : '';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-time]') && screen === 'wallet') {
            walletTimeOpen = !walletTimeOpen;
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-time-close]') && screen === 'wallet') {
            walletTimeOpen = false;
            render();
            return true;
        }
        var tabBtn = event.target.closest('[data-wallet-tab]');
        if (tabBtn && screen === 'wallet') {
            walletTab = tabBtn.getAttribute('data-wallet-tab') || 'all';
            render();
            return true;
        }
        var rangeBtn = event.target.closest('[data-wallet-range]');
        if (rangeBtn && screen === 'wallet') {
            walletRange = rangeBtn.getAttribute('data-wallet-range') || '30';
            walletTimeOpen = walletRange === 'custom';
            render();
            return true;
        }
        if (event.target.closest('[data-wallet-apply]')) {
            applyPartyRange('wallet');
            return true;
        }
        var submit = event.target.closest('[data-wallet-submit]');
        if (!submit) return false;
        var raw = walletDraft;
        if (!validAmount(raw)) {
            toast('请填写金额，最多两位小数');
            return true;
        }
        var wallet = window.RbtPartyWallet;
        if (!wallet) return true;
        if (submit.getAttribute('data-wallet-submit') === 'recharge') {
            submitPartyRecharge('trader', traderName(), raw, wallet);
            return true;
        }
        walletDraft = raw;
        openPartyPwd('¥' + Number(raw).toFixed(2), function () {
            walletDraft = '';
            var result = wallet.withdraw('trader', traderName(), raw);
            if (!result || !result.ok) {
                toast((result && result.message) || '提现失败');
                return;
            }
            walletPane = 'main';
            toast('提现已提交');
            render();
        });
        return true;
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        if (window.RbtPartyWallet && window.RbtPartyWallet.clearTimeSheet) window.RbtPartyWallet.clearTimeSheet();
        scroll.classList.toggle('is-collect', tab === 'hall' && (screen === 'collect' || screen === 'wallet'));
        closeContract();
        syncHomeChrome();
        syncHeadBack();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = (window.RbtContractSign
                ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone }, {
                    layout: 'trader',
                    amounts: signing ? hallAmounts(signing) : {}
                })
                : '<div class="rbt-h5-empty">合同签署页不可用</div>');
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
        if (tab === 'hall' && screen === 'wallet') {
            scroll.innerHTML = renderWallet();
            if (window.RbtPartyWallet && window.RbtPartyWallet.pinTimeSheet) window.RbtPartyWallet.pinTimeSheet();
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
        if (tab === 'hall' && screen === 'detail') {
            setHead('需求详情');
            var detailItem = null;
            demandRows().some(function (item) {
                if (item && item.code === detailCode) {
                    detailItem = item;
                    return true;
                }
                return false;
            });
            scroll.innerHTML = detailItem
                ? renderHallDetail(detailItem)
                : '<div class="rbt-h5-empty">需求单不存在</div>';
            scroll.scrollTop = 0;
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

    /* 余额不够时拦住确认签约。我知道了不改状态，也不生成合同、不冻结。 */
    function openBalanceShort(check) {
        var phone = document.getElementById('rbtH5Phone');
        if (!phone) return;
        closeBalanceShort();
        var text = check && check.reason === 'amount'
            ? '暂时无法核对商品金额，请稍后再试'
            : '当前余额 ¥' + moneyLabel(check && check.balance) + '，本单需支付 ¥' + moneyLabel(check && check.need) + '。余额不足，请尽快充值后再确认签约。';
        var mask = document.createElement('div');
        mask.className = 'rbt-h5-pay-mask';
        mask.setAttribute('data-balance-short', '1');
        mask.innerHTML =
            '<div class="rbt-accept-dialog" role="dialog" aria-modal="true" aria-labelledby="rbtBalanceTitle">' +
            '<h2 id="rbtBalanceTitle">余额不足</h2>' +
            '<p>' + esc(text) + '</p>' +
            '<div class="rbt-accept-dialog__actions">' +
            '<button type="button" class="is-later" data-balance-ok>我知道了</button>' +
            '<button type="button" class="is-go" data-balance-recharge>去充值</button>' +
            '</div></div>';
        mask.addEventListener('click', function (event) {
            if (event.target.closest('[data-balance-ok]')) closeBalanceShort();
            if (event.target.closest('[data-balance-recharge]')) {
                closeBalanceShort();
                tab = 'hall';
                screen = 'wallet';
                walletPane = 'recharge';
                render();
            }
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

    /* 确认签约前先说明会生成两份合同。余额够本单实付才确认并冻结，随后进入签署页。 */
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

    document.getElementById('rbtH5App').addEventListener('input', function (event) {
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
        var confirmSign = event.target.closest('[data-confirm-sign]');
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (confirmSign) {
            var signedCode = confirmSign.getAttribute('data-confirm-sign');
            var signApi = window.RbtDemandData;
            var signResult = signApi && typeof signApi.signDemand === 'function'
                ? signApi.signDemand(signedCode, traderActor(), confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && (signResult.reason === 'balance' || signResult.reason === 'amount')) {
                openBalanceShort(signResult);
                return;
            }
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，系统已自动划款，需求进入发货中');
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
        if (entry && entry.getAttribute('data-entry') === 'wallet') {
            tab = 'hall';
            screen = 'wallet';
            walletPane = 'main';
            render();
            return;
        }
        if (screen === 'wallet' || (screen === 'collect-bill' && fundTab === 'share')) {
            if (handlePartyClick(event)) return;
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
            var collectViewId = collectView.getAttribute('data-collect-view');
            collectFilter = collectViewId === 'closed' || collectViewId === 'board' ? collectViewId : 'open';
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
            bizChannel = 'all';
            bizRangeMode = 'overview';
            bizFrom = '';
            bizTo = '';
            bizFocusDate = '';
            bizPreset = '';
            tab = 'hall';
            screen = 'collect-bill';
            render();
            return;
        }
        var fundTabBtn = event.target.closest('[data-fund-tab]');
        if (fundTabBtn && screen === 'collect-bill') {
            var nextTab = fundTabBtn.getAttribute('data-fund-tab') || 'base';
            fundTab = nextTab === 'share' || nextTab === 'biz' ? nextTab : 'base';
            render();
            return;
        }
        var bizRangeBtn = event.target.closest('[data-biz-range]');
        if (bizRangeBtn && screen === 'collect-bill') {
            bizRangeMode = bizRangeBtn.getAttribute('data-biz-range') === 'custom' ? 'custom' : 'overview';
            bizFocusDate = '';
            fundTab = 'biz';
            if (bizRangeMode === 'overview') {
                bizFrom = '';
                bizTo = '';
                bizPreset = '';
            }
            render();
            return;
        }
        var bizPresetBtn = event.target.closest('[data-biz-preset]');
        if (bizPresetBtn && screen === 'collect-bill') {
            bizPreset = bizPresetBtn.getAttribute('data-biz-preset') || '';
            bizFrom = bizPresetBtn.getAttribute('data-biz-from-set') || '';
            bizTo = bizPresetBtn.getAttribute('data-biz-to-set') || '';
            bizRangeMode = 'custom';
            bizFocusDate = '';
            fundTab = 'biz';
            render();
            return;
        }
        var bizApplyBtn = event.target.closest('[data-biz-apply]');
        if (bizApplyBtn && screen === 'collect-bill') {
            var fromInput = document.querySelector('[data-biz-from]');
            var toInput = document.querySelector('[data-biz-to]');
            bizFrom = fromInput ? fromInput.value : bizFrom;
            bizTo = toInput ? toInput.value : bizTo;
            bizRangeMode = 'custom';
            bizFocusDate = '';
            bizPreset = '';
            fundTab = 'biz';
            render();
            return;
        }
        var bizDayBtn = event.target.closest('[data-biz-day]');
        if (bizDayBtn && screen === 'collect-bill') {
            bizFocusDate = bizDayBtn.getAttribute('data-biz-day') || '';
            fundTab = 'biz';
            render();
            return;
        }
        var bizClearDay = event.target.closest('[data-biz-clear-day]');
        if (bizClearDay && screen === 'collect-bill') {
            bizFocusDate = '';
            fundTab = 'biz';
            render();
            return;
        }
        var bizChannelBtn = event.target.closest('[data-biz-channel]');
        if (bizChannelBtn && screen === 'collect-bill') {
            var nextChannel = bizChannelBtn.getAttribute('data-biz-channel') || 'all';
            bizChannel = nextChannel === 'POS' || nextChannel === '直播' || nextChannel === '商城' ? nextChannel : 'all';
            fundTab = 'biz';
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
