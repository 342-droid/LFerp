/* 全部门店的每日履行。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
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
            var table = ref(null);
            var slots = { demandCode: 'cell-demandCode' };
            var columns = [
                { dataIndex: 'date', title: '日期', minWidth: 120, search: { control: 'input', placeholder: '如 2026-11-10' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 160, align: 'left', search: { control: 'input' } },
                { dataIndex: 'storeCode', title: '门店编码', minWidth: 120 },
                { dataIndex: 'demandCode', title: '需求单号', minWidth: 140, search: { control: 'input' } },
                {
                    dataIndex: 'channel',
                    title: '渠道',
                    minWidth: 100,
                    search: {
                        control: 'select',
                        options: [
                            { label: 'POS', value: 'POS' },
                            { label: '直播', value: '直播' },
                            { label: '商城', value: '商城' }
                        ],
                        placeholder: '请选择渠道'
                    }
                },
                { dataIndex: 'turnover', title: '营业流水', minWidth: 120, formatter: function (row) { return yuan(row.turnover); } },
                { dataIndex: 'commission', title: '所得佣金', minWidth: 120, formatter: function (row) { return yuan(row.commission); } },
                { dataIndex: 'ratio', title: '结算比例', minWidth: 110 },
                { dataIndex: 'due', title: '应履行', minWidth: 120, formatter: function (row) { return yuan(row.due); } },
                { dataIndex: 'actual', title: '实际履行', minWidth: 120, formatter: function (row) { return yuan(row.actual); } },
                { dataIndex: 'source', title: '计算来源', minWidth: 140 }
            ];

            function requestRows(params) {
                var matched = (dailyApi && dailyApi.rows ? dailyApi.rows(false) : []).filter(function (row) {
                    if (!includesText(row.date, params.date)) return false;
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.demandCode, params.demandCode)) return false;
                    if (!blank(params.channel) && row.channel !== params.channel) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function openDemand(row) {
                var api = window.RbtDemandData;
                var item = api && api.get ? api.get(row && row.demandCode) : null;
                if (item && window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item);
                }
            }

            return {
                table: table,
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                openDemand: openDemand
            };
        }
    }, '#rbtDailyApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
