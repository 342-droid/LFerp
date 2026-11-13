/* RBT 采购单 / 销售单列表，按页面 data-kind 切换。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var host = document.getElementById('rbtTradeApp');
    var kind = host && host.getAttribute('data-kind') === 'purchase' ? 'purchase' : 'sales';
    var dataApi = window.RbtTradeDocs;

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
        return {
            list: rows.slice(start, start + size),
            total: rows.length
        };
    }

    function statusType(status) {
        if (status === '已完成') return 'success';
        if (status === '待收货') return 'warning';
        return '';
    }

    var statusOptions = [
        { label: '待收货', value: '待收货' },
        { label: '已完成', value: '已完成' }
    ];
    var codeTitle = kind === 'purchase' ? '采购单号' : '销售单号';

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status' };
            var columns = [
                { dataIndex: 'code', title: codeTitle, minWidth: 140, search: { control: 'input' } },
                { dataIndex: 'demandCode', title: '来源需求单', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'buyerName', title: '买方', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'sellerName', title: '卖方', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'receiveName', title: '收货方', minWidth: 150, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'amount', title: '金额', minWidth: 120, formatter: function (row) { return blank(row.amount) ? '—' : ('¥' + row.amount); } },
                {
                    dataIndex: 'status',
                    title: '状态',
                    minWidth: 110,
                    search: { control: 'select', options: statusOptions, placeholder: '请选择状态' }
                },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 }
            ];

            function sourceRows() {
                if (!dataApi) return [];
                return kind === 'purchase' ? dataApi.listPurchases() : dataApi.listSales();
            }

            function requestRows(params) {
                var matched = sourceRows().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.demandCode, params.demandCode)) return false;
                    if (!includesText(row.buyerName, params.buyerName)) return false;
                    if (!includesText(row.sellerName, params.sellerName)) return false;
                    if (!includesText(row.receiveName, params.receiveName) && !includesText(row.storeName, params.receiveName)) return false;
                    if (!blank(params.status) && row.status !== params.status) return false;
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
