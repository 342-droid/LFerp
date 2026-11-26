/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var detailCode = '';
    var signCode = '';
    var signSummaryOpen = false;
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
        if (screen === 'collect' || screen === 'hall') return 'home';
        return '';
    }

    function syncHeadBack() {
        var btn = document.getElementById('rbtH5HeadBack');
        if (!btn) return;
        btn.classList.toggle('is-on', !!backTarget());
    }

    function goBack(target) {
        if (target === 'hall-back') {
            screen = 'hall';
            tab = 'hall';
            render();
            return;
        }
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

    /* 大厅总金额用贸易商应收（含加价）。需求单商品金额仍是原价，不再单列贸易商服务费。 */
    function hallAmounts(item) {
        var goods = item && item.goodsAmount ? String(item.goodsAmount) : '';
        var api = window.RbtDemandData;
        var pack = api && typeof api.receivables === 'function' ? api.receivables(item) : null;
        var markup = api && typeof api.markupOf === 'function' ? api.markupOf(item) : null;
        var total = pack && pack.trader ? String(pack.trader) : '';
        return {
            goods: goods || '—',
            markup: markup && markup.rateText ? markup.rateText : '—',
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
            '<div class="rbt-hall-card__total"><span>总金额</span><b>' + esc(yuanText(amounts.total)) + '</b></div>' +
            '<div class="rbt-hall-card__grid">' +
            hallCell('商品金额（原价）', yuanText(amounts.goods)) +
            hallCell('加价率', amounts.markup) +
            hallCell('结算周期', item.repayCycle || '—') +
            hallCell('结算方式', item.repayMethod || '—') +
            '</div>';
    }

    function renderHallCard(item, accepted) {
        var actions = hallActions(item, accepted);
        return hallSummary(item, accepted).replace('<article class="rbt-hall-card">', '<article class="rbt-hall-card" data-demand="' + esc(item.code) + '">') +
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
        if (status === '门店付款中' || status === '还款中') return '付款中';
        return status || '—';
    }

    function yuan(value) {
        if (value == null || value === '' || value === '—') return '—';
        return '¥' + value;
    }

    /* 已结款是已经结清的营业日拆给贸易商的金额。最近一天结算单未确定，明细行仍记待结款。
       结款不按渠道拆开：各渠道佣金进门店钱包后，用佣金余额支付，同一天多渠道合成一笔。后台每日付款仍按渠道分行。 */
    function traderSettled(item) {
        var daily = window.RbtDailyFulfill;
        var rows = daily && typeof daily.payeeSplit === 'function' ? daily.payeeSplit(item) : [];
        if (!rows.length) return { total: '', pending: '', shares: [] };
        var latest = '';
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
                amount: row.trader,
                turnover: manual ? '' : (fact.turnover || ''),
                commission: manual ? '' : (fact.commission || ''),
                ratio: manual ? '' : (fact.ratio || ''),
                actual: fact.actual || fact.due || '',
                payMethod: fact.payMethod || ''
            };
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
            /* 一键付款已经付过，按结算系数拆完即已结款。最近一个营业日仍等结算单。 */
            row.stage = !done && row.kind !== 'manual' && row.date === latest ? 'pending' : 'due';
            if (row.stage === 'pending') pendingCents += cents;
            else settledCents += cents;
        });
        return {
            total: (settledCents / 100).toFixed(2),
            pending: done ? '' : (pendingCents / 100).toFixed(2),
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
                payMethod: '佣金余额',
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
            markup: amounts.markup,
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
        return day;
    }

    function opsMoney(value) {
        if (value == null || value === '' || value === '—') return '—';
        return yuan(value);
    }

    function opsFact(label, value) {
        return '<span><i>' + esc(label) + '</i><b>' + esc(value) + '</b></span>';
    }

    function renderShareCards(shares) {
        return '<p class="rbt-ops__note">各渠道佣金先进入门店钱包。结款从佣金余额支付，同一天可以多渠道混合后还款。</p>' +
            shares.map(function (row) {
                var pendingRow = row.stage === 'pending';
                var manual = row.kind === 'manual';
                var when = pendingRow ? '-' : (manual ? (paidClock(row.time) || settleClock(row.date)) : settleClock(row.date));
                var facts = manual
                    ? opsFact('当日实际付款', opsMoney(row.actual)) +
                        opsFact('支付方式', row.payMethod || '—')
                    : opsFact('营业流水', opsMoney(row.turnover)) +
                        opsFact('所得佣金', opsMoney(row.commission)) +
                        opsFact('当日实际付款', opsMoney(row.actual)) +
                        opsFact('支付方式', '佣金余额');
                return '<article class="rbt-ops">' +
                    '<header class="rbt-ops__head"><b>' + esc(shareTitle(row)) + '</b>' +
                    '<em class="' + (pendingRow ? '' : 'is-due') + '">' + (pendingRow ? '待结款' : '已结款') + '</em></header>' +
                    '<div class="rbt-ops__grid">' +
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

    /* 营业额单折线；圆点可点选单日高亮；跨月／跨年轴签换样式 */
    function renderBizChart(series, focusDate) {
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
        var metricLabel = bizChannel === '直播' || bizChannel === '商城' ? '预计收入' : '营业额';
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
        );
    }

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
                ? '<div class="rbt-biz-presets">' +
                  (presetChips || '') +
                  '</div>' +
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
                  '<button type="button" class="rbt-biz-apply" data-biz-apply>应用</button>' +
                  '</div>' +
                  (bizFrom && bizTo
                      ? '<p class="rbt-biz-window">已选时段：' +
                        esc(bizFrom) +
                        ' 至 ' +
                        esc(bizTo) +
                        '</p>'
                      : '')
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
        var estimateCards = [];
        (pack.channels || []).forEach(function (ch) {
            if (ch.id === 'POS') posChannel = ch;
            else estimateCards.push(ch);
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
        var estimateHtml = estimateCards
            .map(function (ch) {
                return (
                    '<article class="rbt-biz-channel rbt-biz-channel--estimate">' +
                    '<header>' +
                    esc(ch.label) +
                    '</header>' +
                    '<div class="rbt-biz-channel__metric">' +
                    '<span>预计收入</span><b>' +
                    esc(bizMoney(ch.turnoverTotal)) +
                    '</b></div>' +
                    '</article>'
                );
            })
            .join('');
        var channelCards =
            posCard +
            (estimateHtml
                ? '<div class="rbt-biz-channels__estimate">' + estimateHtml + '</div>'
                : '');
        var clearDay = bizFocusDate
            ? '<button type="button" class="rbt-biz-clear" data-biz-clear-day>清除单日高亮</button>'
            : '';
        return '<section class="rbt-biz">' +
            '<p class="rbt-ops__note">' + esc(pack.tip || '') + '</p>' +
            rangeChips + rangePick +
            '<div class="rbt-biz-summary rbt-biz-summary--single">' +
            '<div><span>' + (bizRangeMode === 'custom' ? '时段营业额' : '门店营业额') + '</span><b>' +
            esc(bizMoney(pack.turnoverTotal)) + '</b></div>' +
            '</div>' +
            '<div class="rbt-biz-channels">' + channelCards + '</div>' +
            '<p class="rbt-biz-estimate-note">直播、商城展示金额均为预计收入，经退款、平台结算后，最终到账金额以实际结算单为准；该部分收入不计入门店当期实收。</p>' +
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
            ['加价率', fund.markup || '—'],
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
            ? renderShareCards(shares)
            : '<p class="rbt-bill__empty">暂无结款明细</p>';
        var sheet =
            fundTab === 'share'
                ? '<section class="rbt-bill__sheet' + (shares.length ? '' : ' rbt-bill__sheet--blank') + '">' + detail + '</section>'
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

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        scroll.classList.toggle('is-collect', tab === 'hall' && screen === 'collect');
        closeContract();
        syncHomeChrome();
        syncHeadBack();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = (window.RbtContractSign
                ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone }, {
                    layout: 'trader',
                    summaryOpen: signSummaryOpen,
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
            : '当前余额 ¥' + moneyLabel(check && check.balance) + '，本单需支付商品金额 ¥' + moneyLabel(check && check.need) + '。余额不足，请尽快充值后再确认签约。';
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

    /* 确认签约前先说明会生成两份合同并冻结商品金额。稍后处理不改状态；余额够才确认，并进入签署页。 */
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
        var changePassword = event.target.closest('[data-change-password]');
        var savePassword = event.target.closest('[data-save-password]');
        var back = event.target.closest('[data-back]');
        var logout = event.target.closest('[data-logout]');
        if (summaryToggle) {
            signSummaryOpen = !signSummaryOpen;
            render();
            return;
        }
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
        var demandCard = event.target.closest('[data-demand]');
        if (demandCard && !event.target.closest('button')) {
            detailCode = demandCard.getAttribute('data-demand') || '';
            screen = 'detail';
            render();
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
