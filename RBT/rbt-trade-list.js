/* RBT 交易单列表。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var dataApi = window.RbtTradeDocs;

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function includesText(value, query) {
        if (blank(query)) return true;
        return String(value == null ? '' : value).toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function moneyText(value) {
        return blank(value) && value !== 0 ? '—' : ('¥' + value);
    }

    function paginate(rows, params) {
        var page = Math.max(1, Number(params && params.page) || 1);
        var size = Math.max(1, Number(params && params.pageSize) || 20);
        var start = (page - 1) * size;
        return {
            list: rows.slice(start, start + size),
            total: rows.length
        };
    }

    function statusType(status) {
        if (status === '已完成') return 'success';
        return '';
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status' };
            var columns = [
                { dataIndex: 'code', title: '交易单号', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'demandCode', title: '来源需求单', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'buyerName', title: '付款方', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'sellerName', title: '收款方', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'receiveName', title: '收货方', minWidth: 150, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'amount', title: '总金额', minWidth: 120, formatter: function (row) { return moneyText(row.amount); } },
                { dataIndex: 'status', title: '状态', minWidth: 100 },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 }
            ];

            function requestRows(params) {
                var rows = dataApi && typeof dataApi.listTrades === 'function' ? dataApi.listTrades() : [];
                var matched = rows.filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.demandCode, params.demandCode)) return false;
                    if (!includesText(row.buyerName, params.buyerName)) return false;
                    if (!includesText(row.sellerName, params.sellerName)) return false;
                    if (!includesText(row.receiveName, params.receiveName) && !includesText(row.storeName, params.receiveName)) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function openDetail(row) {
                if (window.RbtTradeDetail && typeof window.RbtTradeDetail.open === 'function') {
                    window.RbtTradeDetail.open(row);
                }
            }

            return {
                table: table,
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                statusType: statusType,
                openDetail: openDetail
            };
        }
    }, '#rbtTradeApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
