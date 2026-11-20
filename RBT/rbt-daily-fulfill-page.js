/* 全部门店的每日履行。 */
(function () {
    var dailyApi = window.RbtDailyFulfill;

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function includesText(value, query) {
        if (blank(query)) return true;
        return String(value == null ? '' : value).toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function paginate(rows, params) {
        var page = Math.max(1, Number(params && params.page) || 1);
        var size = Math.max(1, Number(params && params.pageSize) || 20);
        var start = (page - 1) * size;
        return { list: rows.slice(start, start + size), total: rows.length };
    }

    function yuan(value) {
        return blank(value) ? '—' : ('¥' + value);
    }

    OctopusPrototype.mount({
        setup: function () {
            /* 页内模板会把 v-slot 表达式转成小写，键必须用 demandcode。值仍是 cell-demandCode，和列 dataIndex 对应。 */
            var slots = { demandcode: 'cell-demandCode' };
            var channelSearch = {
                control: 'select',
                options: [
                    { label: 'POS', value: 'POS' },
                    { label: '直播', value: '直播' },
                    { label: '商城', value: '商城' }
                ],
                placeholder: '请选择渠道'
            };
            var columns = [
                { dataIndex: 'date', title: '日期', minWidth: 96, search: { control: 'input', placeholder: '如 2026-11-10' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 132, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'storeCode', title: '门店编码', minWidth: 108 },
                { dataIndex: 'demandCode', title: '需求单号', minWidth: 120, search: { control: 'input' } },
                {
                    dataIndex: 'channel',
                    title: '渠道',
                    minWidth: 72,
                    search: channelSearch
                },
                { dataIndex: 'turnover', title: '营业流水', minWidth: 100, align: 'right', formatter: function (row) { return yuan(row.turnover); } },
                { dataIndex: 'commission', title: '所得佣金', minWidth: 100, align: 'right', formatter: function (row) { return yuan(row.commission); } },
                { dataIndex: 'ratio', title: '结算比例', minWidth: 80, align: 'right' },
                { dataIndex: 'due', title: '应履行', minWidth: 100, align: 'right', formatter: function (row) { return yuan(row.due); } },
                { dataIndex: 'actual', title: '实际履行', minWidth: 100, align: 'right', formatter: function (row) { return yuan(row.actual); } },
                { dataIndex: 'traderName', title: '贸易商', minWidth: 116, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return blank(row.traderName) ? '—' : row.traderName; } },
                { dataIndex: 'traderPay', title: '贸易商结款', minWidth: 108, align: 'right', formatter: function (row) { return yuan(row.traderPay); } },
                { dataIndex: 'lengfengPay', title: '冷丰结款', minWidth: 100, align: 'right', formatter: function (row) { return yuan(row.lengfengPay); } },
                { dataIndex: 'providerName', title: '服务商', minWidth: 96, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return blank(row.providerName) ? '—' : row.providerName; } },
                { dataIndex: 'providerPay', title: '服务商结款', minWidth: 108, align: 'right', formatter: function (row) { return yuan(row.providerPay); } },
                { dataIndex: 'source', title: '计算来源', minWidth: 112, align: 'left', showOverflowTooltip: true }
            ];

            function matchDaily(row, params) {
                if (!includesText(row.date, params.date)) return false;
                if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                if (!includesText(row.demandCode, params.demandCode)) return false;
                if (!blank(params.channel) && row.channel !== params.channel) return false;
                return true;
            }

            function requestRows(params) {
                var details = {};
                (dailyApi && dailyApi.detailRows ? dailyApi.detailRows() : []).forEach(function (row) {
                    details[row.id] = row;
                });
                var matched = (dailyApi && dailyApi.rows ? dailyApi.rows(false) : []).map(function (row) {
                    var detail = details[row.id] || {};
                    return {
                        id: row.id,
                        date: row.date,
                        storeName: row.storeName,
                        storeCode: row.storeCode,
                        demandCode: row.demandCode,
                        channel: row.channel,
                        turnover: row.turnover,
                        commission: row.commission,
                        ratio: row.ratio,
                        due: row.due,
                        actual: row.actual,
                        source: row.source,
                        traderName: detail.traderName || '',
                        traderPay: detail.traderPay,
                        lengfengPay: detail.lengfengPay,
                        providerName: detail.providerName || '',
                        providerPay: detail.providerPay
                    };
                }).filter(function (row) {
                    if (!matchDaily(row, params)) return false;
                    if (!includesText(row.traderName, params.traderName)) return false;
                    if (!includesText(row.providerName, params.providerName)) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function demandOf(row) {
                var api = window.RbtDemandData;
                return api && api.get ? api.get(row && row.demandCode) : null;
            }

            function openDemand(row) {
                closeDay();
                var item = demandOf(row);
                if (item && window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item);
                }
            }

            function openPerformance(row) {
                closeDay();
                var item = demandOf(row);
                if (item && window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item, { performance: true });
                }
            }

            function esc(value) {
                return String(value == null || value === '' ? '—' : value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function moneyText(value) {
                return blank(value) ? '—' : ('¥' + value);
            }

            function dayOf(row) {
                var id = row && row.id;
                var ledger = ((dailyApi && dailyApi.rows ? dailyApi.rows(false) : []).filter(function (item) {
                    return item.id === id;
                })[0]) || {};
                var detail = ((dailyApi && dailyApi.detailRows ? dailyApi.detailRows() : []).filter(function (item) {
                    return item.id === id;
                })[0]) || {};
                return {
                    date: ledger.date || detail.date || (row && row.date) || '',
                    channel: ledger.channel || detail.channel || (row && row.channel) || '',
                    storeName: ledger.storeName || detail.storeName || '',
                    storeCode: ledger.storeCode || detail.storeCode || '',
                    demandCode: ledger.demandCode || detail.demandCode || '',
                    turnover: ledger.turnover,
                    commission: ledger.commission,
                    ratio: ledger.ratio,
                    due: ledger.due,
                    actual: ledger.actual,
                    traderName: detail.traderName || '',
                    traderPay: detail.traderPay,
                    lengfengPay: detail.lengfengPay,
                    providerName: detail.providerName || '',
                    providerPay: detail.providerPay
                };
            }

            function onDayKey(event) {
                if (event.key === 'Escape') closeDay();
            }

            function closeDay() {
                document.querySelectorAll('[data-rbt-day-drawer]').forEach(function (node) {
                    node.remove();
                });
                document.removeEventListener('keydown', onDayKey);
            }

            function field(label, value) {
                return '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' + esc(label) +
                    '</div><div class="supplier-detail-cell__body">' + esc(value) + '</div></div>';
            }

            /* 查看只看这一天、这个渠道付给各方的结款，不打开需求单。 */
            function openDay(row) {
                var day = dayOf(row);
                closeDay();
                var backdrop = document.createElement('div');
                backdrop.className = 'store-drawer-backdrop';
                backdrop.setAttribute('data-rbt-day-drawer', '1');
                var drawer = document.createElement('aside');
                drawer.className = 'store-drawer store-drawer--interactive';
                drawer.setAttribute('data-rbt-day-drawer', '1');
                drawer.setAttribute('role', 'dialog');
                drawer.setAttribute('aria-modal', 'true');
                drawer.setAttribute('aria-label', '履行明细');
                drawer.innerHTML =
                    '<div class="store-drawer__header"><h2 class="store-drawer__title">履行明细</h2>' +
                    '<button type="button" class="store-drawer__close" data-rbt-day-close aria-label="关闭">&times;</button></div>' +
                    '<div class="store-drawer__body"><div class="rbt-day-sheet">' +
                    '<div class="supplier-detail-grid">' +
                    field('日期', day.date) +
                    field('渠道', day.channel) +
                    field('门店', (day.storeName || '—') + '（' + (day.storeCode || '—') + '）') +
                    field('需求单号', day.demandCode) +
                    field('营业流水', moneyText(day.turnover)) +
                    field('所得佣金', moneyText(day.commission)) +
                    field('结算比例', day.ratio) +
                    field('应履行', moneyText(day.due)) +
                    field('实际履行', moneyText(day.actual)) +
                    '</div>' +
                    '<div class="supplier-detail-section-title">各方结款</div>' +
                    '<table class="rbt-day-table"><thead><tr><th>角色</th><th>收款方</th><th class="is-money">结款</th></tr></thead><tbody>' +
                    '<tr><td>贸易商</td><td>' + esc(day.traderName) + '</td><td class="is-money">' + esc(moneyText(day.traderPay)) + '</td></tr>' +
                    '<tr><td>冷丰</td><td>上海冷丰科技有限公司</td><td class="is-money">' + esc(moneyText(day.lengfengPay)) + '</td></tr>' +
                    '<tr><td>服务商</td><td>' + esc(day.providerName) + '</td><td class="is-money">' + esc(moneyText(day.providerPay)) + '</td></tr>' +
                    '</tbody></table>' +
                    '<p class="rbt-day-note">结款从当日实际履行按贸易商、冷丰、服务商应收占比拆出，三笔之和等于当日实际履行。没有服务商时，服务商结款为 0。</p>' +
                    '</div></div>';
                document.body.appendChild(backdrop);
                document.body.appendChild(drawer);
                backdrop.addEventListener('click', closeDay);
                drawer.querySelector('[data-rbt-day-close]').addEventListener('click', closeDay);
                document.addEventListener('keydown', onDayKey);
            }

            return {
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                openDemand: openDemand,
                openPerformance: openPerformance,
                openDay: openDay
            };
        }
    }, '#rbtDailyApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
