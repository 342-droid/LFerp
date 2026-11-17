/* 贸易商端登录后主界面：需求大厅、资产台账、我的。 */
(function () {
    var account = null;
    var tab = 'hall';
    var screen = 'home';
    var hallFilter = 'pending';
    var signCode = '';
    var collectFilter = 'pending';
    var collectCode = '';
    var bizRange = '30d';
    var storeBizCode = '';
    var storeBizDemandCode = '';
    var storeBizBack = 'home';
    var jvDailyBack = 'store-biz';

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setHead(text) {
        var head = document.getElementById('rbtH5HeadText');
        if (head) head.textContent = text;
    }

    function svgIcon(paths) {
        return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">' + paths + '</svg>';
    }

    function traderName() {
        var license = account && account.license;
        return (license && license.name) || '贸易商';
    }

    /* 主体类型以贸易商档案为准。服务商不能看需求大厅，也不能接单。 */
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

    function demandActionButtons(item, accepted) {
        if (!accepted) {
            return '<button type="button" class="rbt-h5-accept" data-accept="' + esc(item.code) + '">接单</button>';
        }
        if (item.status === '待确认签约') {
            return (
                '<button type="button" class="rbt-h5-accept" data-confirm-deal="' + esc(item.code) + '">确认签约</button>' +
                '<button type="button" class="rbt-h5-withdraw" data-withdraw="' + esc(item.code) + '">撤回接单</button>'
            );
        }
        if (item.status === '待签署') {
            return '<button type="button" class="rbt-h5-accept" data-sign="' + esc(item.code) + '">去签署</button>';
        }
        return '';
    }

    function demandSummaryHtml(item, accepted) {
        var status = accepted ? (item.status || '已接单') : '待接单';
        var statusClass = status === '已完成' ? ' is-done' : (status === '已作废' || status === '已驳回' ? ' is-off' : '');
        var amounts = hallAmounts(item);
        return (
            '<div class="rbt-h5-card__top"><h2>' + esc(item.code) + '</h2>' +
            '<span class="rbt-h5-status' + statusClass + '">' + esc(status) + '</span></div>' +
            '<p>门店：' + esc(item.storeName || '—') + '（' + esc(item.storeCode || '—') + '）</p>' +
            '<p>商品包：' + esc(item.packageName || '—') + '（' + esc(item.packageCode || '—') + '）</p>' +
            '<p>商品：' + esc(skuText(item)) + '</p>' +
            '<p>商品金额：¥' + esc(amounts.goods) + '</p>' +
            '<p>服务费：¥' + esc(amounts.fee) + '</p>' +
            '<p>总金额：¥' + esc(amounts.total) + '</p>' +
            (item.repayCycle
                ? '<p>结算周期：' + esc(item.repayCycle) + '</p>' +
                  '<p>结算方式：' + esc(item.repayMethod || '—') + '</p>' +
                  (item.repayMethod === '比例付'
                      ? ((window.RbtSettleRatio && RbtSettleRatio.textOf(item)) ? '<p>结算比例：' + esc(RbtSettleRatio.textOf(item)) + '</p>' : '')
                      : '<p>结算期数：' + esc(item.repayPeriod || '—') + '期</p>')
                : '') +
            '<p>创建时间：' + esc(item.createdAt || '—') + '</p>' +
            (accepted ? '<p>接单时间：' + esc(item.acceptedAt || '—') + '</p>' : '')
        );
    }

    function renderHallCard(item, accepted) {
        return (
            '<article class="rbt-h5-card">' +
            demandSummaryHtml(item, accepted) +
            demandActionButtons(item, accepted) +
            '</article>'
        );
    }

    function bizApi() {
        return window.RbtTraderStoreBiz;
    }

    function fmtMoney(n) {
        var api = bizApi();
        return api && api.money ? api.money(n) : String(n == null ? '—' : n);
    }

    function renderTrendBars(trend) {
        var arr = trend || [];
        if (!arr.length) return '';
        var max = Math.max.apply(null, arr.concat([1]));
        return (
            '<div class="rbt-biz-trend" aria-hidden="true">' +
            arr
                .map(function (v) {
                    var h = Math.max(4, Math.round((Number(v) || 0) / max * 48));
                    return '<i style="height:' + h + 'px"></i>';
                })
                .join('') +
            '</div>'
        );
    }

    function renderStoreOverviewBlock(storeCode, range, opts) {
        var api = bizApi();
        var o = opts || {};
        var ready =
            typeof o.ready === 'boolean'
                ? o.ready
                : !(api && api.overviewReadyForDemand) || api.overviewReadyForDemand(o.demand);
        if (!api || !api.buildStoreOverview) {
            return '<section class="rbt-biz-sec"><h3>门店经营概览</h3><div class="rbt-biz-empty">经营数据暂不可用</div></section>';
        }
        var ov = api.buildStoreOverview(storeCode, range || bizRange, {
            ready: ready,
            storeName: o.storeName || (o.demand && o.demand.storeName),
            tip: o.tip
        });
        if (!ov.ready) {
            return (
                '<section class="rbt-biz-sec">' +
                '<h3>门店经营概览</h3>' +
                '<div class="rbt-biz-empty">' +
                esc(ov.tip || '各方完成签署并开始营业后可查看经营概览') +
                '</div></section>'
            );
        }
        var chips = (api.RANGE_OPTIONS || [])
            .map(function (opt) {
                return (
                    '<button type="button" class="rbt-biz-chip' +
                    (opt.id === ov.range ? ' is-on' : '') +
                    '" data-biz-range="' +
                    esc(opt.id) +
                    '">' +
                    esc(opt.label) +
                    '</button>'
                );
            })
            .join('');
        return (
            '<section class="rbt-biz-sec">' +
            '<h3>门店经营概览</h3>' +
            '<div class="rbt-biz-chips">' +
            chips +
            '</div>' +
            '<div class="rbt-biz-grid">' +
            '<div class="rbt-biz-cell"><span>营业额(元)</span><b>' +
            fmtMoney(ov.paid) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>退款(元)</span><b>' +
            fmtMoney(ov.refund) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>净成交额(元)</span><b>' +
            fmtMoney(ov.net) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>支付订单数</span><b>' +
            esc(ov.orders) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>客单价(元)</span><b>' +
            (ov.aov == null ? '—' : fmtMoney(ov.aov)) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>有成交天数</span><b>' +
            esc(ov.activeDays) +
            '</b></div>' +
            '<div class="rbt-biz-cell is-wide"><span>最近成交日</span><b>' +
            esc(ov.lastPayDate || '—') +
            '</b></div>' +
            '</div>' +
            renderTrendBars(ov.trend) +
            '</section>'
        );
    }

    function renderDailyRows(rows) {
        return (rows || [])
            .map(function (r) {
                return (
                    '<div class="rbt-biz-daily__row"><span>' +
                    esc(r.d) +
                    ' 日结</span><b>-' +
                    fmtMoney(r.a) +
                    '</b></div>'
                );
            })
            .join('');
    }

    function renderDemandJvBlock(item) {
        var api = bizApi();
        if (!api || !api.buildDemandJv) return '';
        var jv = api.buildDemandJv(item);
        if (!jv || jv.show === false) return '';
        if (!jv.started) {
            return (
                '<section class="rbt-biz-sec">' +
                '<h3>本笔联营回收</h3>' +
                '<div class="rbt-biz-empty">' +
                esc(jv.tip || '本笔尚未开始日结付款') +
                '</div></section>'
            );
        }
        var allRows = jv.dailyRows || [];
        var previewN = (api && api.DAILY_PREVIEW) || 5;
        var preview = allRows.slice(0, previewN);
        var daily = '';
        if (preview.length) {
            daily =
                '<div class="rbt-biz-daily">' +
                renderDailyRows(preview) +
                '</div>' +
                (allRows.length > previewN
                    ? '<button type="button" class="rbt-biz-more" data-jv-daily="' +
                      esc(item.code) +
                      '">全部日结（' +
                      allRows.length +
                      '）</button>'
                    : '');
        }
        return (
            '<section class="rbt-biz-sec">' +
            '<h3>本笔联营回收</h3>' +
            '<div class="rbt-biz-grid">' +
            '<div class="rbt-biz-cell"><span>约定回收(元)</span><b>' +
            fmtMoney(jv.agreed) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>累计实付(元)</span><b>' +
            fmtMoney(jv.actual) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>剩余应付(元)</span><b>' +
            fmtMoney(jv.remain) +
            '</b></div>' +
            '<div class="rbt-biz-cell"><span>状态</span><b>' +
            esc(jv.status) +
            '</b></div>' +
            '<div class="rbt-biz-cell is-wide"><span>预计付完</span><b>' +
            esc(jv.estLabel || '—') +
            '</b></div>' +
            '</div>' +
            daily +
            '</section>'
        );
    }

    function renderJvDailyList() {
        var api = bizApi();
        var demand =
            storeBizDemandCode && window.RbtDemandData && typeof window.RbtDemandData.get === 'function'
                ? window.RbtDemandData.get(storeBizDemandCode)
                : null;
        var jv = demand && api && api.buildDemandJv ? api.buildDemandJv(demand) : null;
        var rows = (jv && jv.dailyRows) || [];
        setHead('全部日结');
        return (
            '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="' +
            esc(jvDailyBack || 'store-biz') +
            '">返回</button></div>' +
            '<section class="rbt-biz-sec" style="margin-top:0">' +
            '<h3>日结明细 · 共 ' +
            rows.length +
            ' 笔</h3>' +
            (rows.length
                ? '<div class="rbt-biz-daily">' + renderDailyRows(rows) + '</div>'
                : '<div class="rbt-biz-empty">暂无日结记录</div>') +
            '</section>'
        );
    }

    function renderStoreBizList() {
        var api = bizApi();
        setHead('门店经营');
        var rows =
            api && typeof api.listVisibleStores === 'function'
                ? api.listVisibleStores({ accepted: acceptedDemands() })
                : [];
        if (!rows.length) {
            return (
                '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="home">返回</button></div>' +
                '<div class="rbt-h5-empty">暂无已接单相关门店</div>'
            );
        }
        return (
            '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="home">返回</button></div>' +
            rows
                .map(function (s) {
                    return (
                        '<button type="button" class="rbt-store-card" data-store-biz="' +
                        esc(s.storeCode) +
                        '" data-store-demand="' +
                        esc(s.activeDemandCode || s.sampleDemandCode || '') +
                        '">' +
                        '<div class="rbt-store-card__hd"><strong>' +
                        esc(s.storeName) +
                        '</strong></div>' +
                        '<div class="rbt-store-card__metrics">' +
                        '<div><span>近30天营业额</span><b>' +
                        (s.paid30d == null ? '—' : fmtMoney(s.paid30d)) +
                        '</b></div>' +
                        '<div><span>有成交天数</span><b>' +
                        (s.activeDays == null ? '—' : esc(s.activeDays)) +
                        '</b></div>' +
                        '<div><span>剩余应付</span><b>' +
                        (s.jvRemain == null ? '—' : fmtMoney(s.jvRemain)) +
                        '</b></div>' +
                        '</div>' +
                        (s.jvEstLabel
                            ? '<div class="rbt-store-card__foot">' + esc(s.jvEstLabel) + '</div>'
                            : '') +
                        '</button>'
                    );
                })
                .join('')
        );
    }

    function renderStoreBizPage() {
        var api = bizApi();
        var demand =
            storeBizDemandCode && window.RbtDemandData && typeof window.RbtDemandData.get === 'function'
                ? window.RbtDemandData.get(storeBizDemandCode)
                : null;
        var storeRow =
            api && typeof api.listVisibleStores === 'function'
                ? api.listVisibleStores({ accepted: acceptedDemands() }).filter(function (row) {
                      return row.storeCode === storeBizCode;
                  })[0]
                : null;
        var ready =
            demand && api && api.overviewReadyForDemand
                ? api.overviewReadyForDemand(demand)
                : !!(storeRow && storeRow.overviewReady);
        var ov =
            api && api.buildStoreOverview
                ? api.buildStoreOverview(storeBizCode, bizRange, {
                      ready: ready,
                      storeName: (storeRow && storeRow.storeName) || (demand && demand.storeName)
                  })
                : { storeName: storeBizCode };
        setHead(ov.storeName || '门店经营');
        var jvHtml = demand ? renderDemandJvBlock(demand) : '';
        return (
            '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="' +
            esc(storeBizBack || 'stores') +
            '">返回</button></div>' +
            renderStoreOverviewBlock(storeBizCode, bizRange, {
                ready: ready,
                demand: demand,
                storeName: ov.storeName
            }) +
            jvHtml
        );
    }

    function syncHomeChrome() {
        var phone = document.getElementById('rbtH5Phone');
        var scroll = document.getElementById('rbtH5Scroll');
        var on = tab === 'hall' && screen === 'home';
        if (phone) phone.classList.toggle('is-home', on);
        if (scroll) scroll.classList.toggle('is-home', on);
    }

    /* 首页对齐门店端：需求大厅、收款、门店经营。 */
    function renderHome() {
        var name = traderName();
        var orange = 'linear-gradient(180deg,#ff9a45,#ff7019)';
        var hall = svgIcon('<rect x="5" y="3.5" width="14" height="17" rx="2" stroke="#fff" stroke-width="1.6"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>');
        var store = svgIcon('<path d="M4 10l1.5-5h13L20 10" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 10v9h14v-9" stroke="#fff" stroke-width="1.6"/><path d="M10 19v-5h4v5" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>');
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
            '<button type="button" class="rbt-h5-tool" data-entry="stores">' +
            '<span class="rbt-h5-tool__icon" style="background:' + orange + '">' + store + '</span>' +
            '<span>门店经营</span></button>' +
            '</div></section></div>';
    }

    function ratioText(item) {
        var api = window.RbtSettleRatio;
        if (item && item.repayMethod === '比例付' && api && typeof api.textOf === 'function') {
            return api.textOf(item) || '—';
        }
        return item && item.repayPeriod ? String(item.repayPeriod) : '—';
    }

    function collectDemands(done) {
        return acceptedDemands().filter(function (item) {
            return item && item.status === (done ? '已完成' : '支付中');
        });
    }

    /* 贸易商收款看实际资方到账。支付中没有到账，已完成也不补到账。 */
    function renderCollect() {
        var done = collectFilter === 'done';
        var rows = collectDemands(done);
        setHead('收款');
        return '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="home">返回</button></div>' +
            '<div class="rbt-repay-hero">' +
            '<div class="rbt-repay-switch" role="tablist">' +
            '<button type="button" data-collect-view="pending"' + (done ? '' : ' class="is-on"') + '>待收款</button>' +
            '<button type="button" data-collect-view="done"' + (done ? ' class="is-on"' : '') + '>已收款</button>' +
            '</div>' +
            '<p class="rbt-repay-hero__label">实际资方到账</p>' +
            '<p class="rbt-repay-hero__amt">未产生</p>' +
            '<button type="button" class="rbt-repay-go" data-collect-first ' + (rows.length ? '' : 'disabled') + '>账单明细</button>' +
            '<p class="rbt-repay-hero__note">' + (done
                ? '已完成只表示需求状态。实际资方到账未产生。'
                : '支付中表示复核已通过。应履行未计算，不能记成已收款。') + '</p>' +
            '</div>' +
            (rows.length ? rows.map(function (item) {
                return '<button type="button" class="rbt-repay-row" data-collect="' + esc(item.code) + '">' +
                    '<span><span class="rbt-repay-row__title">' + esc(item.code) + '</span>' +
                    '<span class="rbt-repay-row__sub">' + esc(item.storeName || '—') + ' · 总金额 ¥' + esc(item.amount || '—') + '</span></span>' +
                    '<span class="rbt-repay-row__side' + (done ? ' is-done' : '') + '"><b>' + esc(item.status) + '</b><span>到账未产生</span></span></button>';
            }).join('') : '<div class="rbt-h5-empty">' + (done ? '暂无已完成的合作' : '暂无支付中的合作') + '</div>');
    }

    function renderCollectBill(item) {
        var done = item.status === '已完成';
        setHead('账单明细');
        var lines = [
            ['门店', (item.storeName || '—') + '（' + (item.storeCode || '—') + '）'],
            ['结算周期', item.repayCycle || '—'],
            ['结算方式', item.repayMethod || '—'],
            ['结算比例', ratioText(item)],
            ['应履行', done ? '完成依据待确认' : '未产生'],
            ['可结算', '未产生'],
            ['实际资方到账', '未产生'],
            ['原结算关联', '未生成']
        ];
        return '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="collect">返回</button></div>' +
            '<section class="rbt-bill__head">' +
            '<div class="rbt-bill__top"><span class="rbt-bill__code">' + esc(item.code) + '</span><span class="rbt-bill__tag">' + esc(item.status || '—') + '</span></div>' +
            '<p class="rbt-bill__label">总金额</p>' +
            '<p class="rbt-bill__amt">' + esc(item.amount || '—') + '</p></section>' +
            '<section class="rbt-bill__sheet"><h3>账单明细</h3>' +
            lines.map(function (line) {
                return '<div class="rbt-bill__line"><span>' + esc(line[0]) + '</span><b>' + esc(line[1]) + '</b></div>';
            }).join('') +
            '</section>';
    }

    function render() {
        var scroll = document.getElementById('rbtH5Scroll');
        if (!scroll || !account) return;
        syncHomeChrome();
        if (tab === 'hall' && screen === 'sign') {
            setHead('合同签署');
            var signing = window.RbtDemandData && window.RbtDemandData.get(signCode);
            scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="hall">返回</button></div>' +
                (window.RbtContractSign
                    ? window.RbtContractSign.render(signing, { role: 'trader', name: traderName(), phone: account.phone })
                    : '<div class="rbt-h5-empty">合同签署页不可用</div>');
            return;
        }
        if (tab === 'hall' && screen === 'collect-bill') {
            var collectBill = acceptedDemands().filter(function (item) { return item.code === collectCode; })[0];
            scroll.innerHTML = collectBill
                ? renderCollectBill(collectBill)
                : '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="collect">返回</button></div><div class="rbt-h5-empty">账单不存在</div>';
            return;
        }
        if (tab === 'hall' && screen === 'collect') {
            scroll.innerHTML = renderCollect();
            return;
        }
        if (tab === 'hall' && screen === 'jv-daily') {
            scroll.innerHTML = renderJvDailyList();
            return;
        }
        if (tab === 'hall' && screen === 'store-biz') {
            scroll.innerHTML = renderStoreBizPage();
            return;
        }
        if (tab === 'hall' && screen === 'stores') {
            scroll.innerHTML = renderStoreBizList();
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
                    '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="mine">返回</button></div>' +
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
        scroll.innerHTML = '<div class="rbt-h5-bar"><button type="button" class="rbt-h5-back" data-back="home">返回</button></div>' +
            '<div class="rbt-h5-hall-tabs" role="tablist">' +
            '<button type="button" data-hall-tab="pending"' + (acceptedView ? '' : ' class="is-on"') + '>待接单<em>' + pending.length + '</em></button>' +
            '<button type="button" data-hall-tab="accepted"' + (acceptedView ? ' class="is-on"' : '') + '>已接单<em>' + accepted.length + '</em></button>' +
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
        if (phone) phone.classList.remove('is-home');
        if (scroll) {
            scroll.classList.remove('is-home');
            scroll.innerHTML = '';
        }
    }

    document.getElementById('rbtH5App').addEventListener('click', function (event) {
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
                ? signApi.signDemand(signedCode, { role: 'trader', name: traderName(), phone: account && account.phone }, confirmSign.getAttribute('data-contract-key'))
                : { ok: false };
            if (signResult && signResult.ok && signResult.done) toast('各方已完成签署，需求进入待复核');
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
            collectFilter = 'pending';
            render();
            return;
        }
        if (entry && entry.getAttribute('data-entry') === 'stores') {
            tab = 'hall';
            screen = 'stores';
            bizRange = '30d';
            render();
            return;
        }
        var bizRangeBtn = event.target.closest('[data-biz-range]');
        if (bizRangeBtn) {
            bizRange = bizRangeBtn.getAttribute('data-biz-range') || '30d';
            render();
            return;
        }
        var storeBizBtn = event.target.closest('[data-store-biz]');
        if (storeBizBtn) {
            storeBizCode = storeBizBtn.getAttribute('data-store-biz') || '';
            storeBizDemandCode = storeBizBtn.getAttribute('data-store-demand') || '';
            storeBizBack = 'stores';
            bizRange = '30d';
            tab = 'hall';
            screen = 'store-biz';
            render();
            return;
        }
        var jvDailyBtn = event.target.closest('[data-jv-daily]');
        if (jvDailyBtn) {
            storeBizDemandCode = jvDailyBtn.getAttribute('data-jv-daily') || storeBizDemandCode;
            jvDailyBack = 'store-biz';
            tab = 'hall';
            screen = 'jv-daily';
            render();
            return;
        }
        if (confirmDeal) {
            var dealCode = confirmDeal.getAttribute('data-confirm-deal');
            if (!window.confirm('确认签约「' + dealCode + '」？确认后生成销售合同和采购合同，进入签署。')) return;
            var dealApi = window.RbtDemandData;
            var dealResult = dealApi && typeof dealApi.confirmSigning === 'function'
                ? dealApi.confirmSigning(dealCode, { name: traderName(), phone: account && account.phone })
                : { ok: false };
            if (dealResult && dealResult.ok) toast('已确认签约，可以去签署');
            else toast('当前不能确认签约');
            render();
            return;
        }
        if (withdraw) {
            var withdrawCode = withdraw.getAttribute('data-withdraw');
            if (!window.confirm('确认撤回接单「' + withdrawCode + '」？撤回后需求回到待接单。')) return;
            var withdrawApi = window.RbtDemandData;
            var withdrawResult = withdrawApi && typeof withdrawApi.withdrawAccept === 'function'
                ? withdrawApi.withdrawAccept(withdrawCode, { name: traderName(), phone: account && account.phone })
                : { ok: false };
            if (withdrawResult && withdrawResult.ok) toast('已撤回接单');
            else toast('当前不能撤回');
            render();
            return;
        }
        if (accept) {
            if (isServiceProvider()) {
                toast('服务商不能接单');
                return;
            }
            var code = accept.getAttribute('data-accept');
            if (!window.confirm('确认接单「' + code + '」？一笔需求单只能由一个贸易商接单。')) return;
            var api = window.RbtDemandData;
            var result = api && typeof api.acceptDemand === 'function'
                ? api.acceptDemand(code, { name: traderName(), phone: account && account.phone })
                : { ok: false, reason: 'missing' };
            if (result && result.ok) toast('接单成功');
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
        var collectFirst = event.target.closest('[data-collect-first]');
        if (collectView) {
            collectFilter = collectView.getAttribute('data-collect-view') === 'done' ? 'done' : 'pending';
            tab = 'hall';
            screen = 'collect';
            render();
            return;
        }
        if (collectFirst || collectBtn) {
            var collectId = collectBtn ? collectBtn.getAttribute('data-collect') : '';
            if (!collectId) {
                var collectRow = collectDemands(collectFilter === 'done')[0];
                collectId = collectRow ? collectRow.code : '';
            }
            if (!collectId) return;
            collectCode = collectId;
            tab = 'hall';
            screen = 'collect-bill';
            render();
            return;
        }
        if (back) {
            screen = back.getAttribute('data-back') || 'mine';
            if (screen === 'hall') hallFilter = hallFilter || 'pending';
            if (screen === 'collect') collectFilter = collectFilter || 'pending';
            if (screen === 'stores') bizRange = '30d';
            tab =
                screen === 'home' ||
                screen === 'hall' ||
                screen === 'collect' ||
                screen === 'stores' ||
                screen === 'store-biz' ||
                screen === 'jv-daily'
                    ? 'hall'
                    : 'mine';
            render();
            return;
        }
        if (logout && window.RbtH5TraderLogin) window.RbtH5TraderLogin.logout();
    });

    window.RbtH5TraderApp = { open: open, close: close };
})();
