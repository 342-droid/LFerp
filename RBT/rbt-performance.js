/* 履约：复核通过后的需求。每日履行在履约详情里。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var dataApi = window.RbtDemandData;
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

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function phase(status) {
        return dailyApi && dailyApi.phaseLabel ? dailyApi.phaseLabel(status) : (status || '—');
    }

    function statusType(status) {
        if (status === '已完成') return 'success';
        if (status === '还款中') return 'warning';
        return '';
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status' };

            var columns = [
                { dataIndex: 'code', title: '需求单号', minWidth: 140, search: { control: 'input' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 160, align: 'left', search: { control: 'input' } },
                { dataIndex: 'storeCode', title: '门店编码', minWidth: 120 },
                { dataIndex: 'traderName', title: '贸易商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.traderName); } },
                { dataIndex: 'providerName', title: '服务商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.providerName); } },
                { dataIndex: 'accountNameQuery', title: '收款账户名称', hideInTable: true, search: { control: 'input' } },
                { dataIndex: 'accountNoQuery', title: '收款账户', hideInTable: true, search: { control: 'input' } },
                { dataIndex: 'amount', title: '总金额', minWidth: 120, formatter: function (row) { return blank(row.amount) ? '—' : ('¥' + row.amount); } },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 100, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 100, formatter: function (row) { return show(row.repayMethod); } },
                {
                    dataIndex: 'status',
                    title: '履约阶段',
                    minWidth: 110,
                    search: {
                        control: 'select',
                        options: [
                            { label: '履约中', value: '还款中' },
                            { label: '已完成', value: '已完成' }
                        ],
                        placeholder: '请选择'
                    }
                },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];

            function payeeHit(row, field, query) {
                if (blank(query)) return true;
                var list = window.RbtDemandDetail && typeof window.RbtDemandDetail.payeesOf === 'function'
                    ? window.RbtDemandDetail.payeesOf(row)
                    : [];
                return list.some(function (account) {
                    return includesText(account && account[field], query);
                });
            }

            function requestRows(params) {
                var matched = (dataApi && dataApi.list ? dataApi.list() : []).filter(function (row) {
                    if (!row || !dailyApi.inPerformance(row.status)) return false;
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.traderName, params.traderName)) return false;
                    if (!includesText(row.providerName, params.providerName)) return false;
                    if (!payeeHit(row, 'accountName', params.accountNameQuery)) return false;
                    if (!payeeHit(row, 'accountNo', params.accountNoQuery)) return false;
                    if (!blank(params.status) && row.status !== params.status) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function openDetail(row) {
                var item = dataApi && dataApi.get ? (dataApi.get(row && row.code) || row) : row;
                if (window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item, { performance: true });
                }
            }

            return {
                table: table,
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                statusType: statusType,
                phase: phase,
                openDetail: openDetail
            };
        }
    }, '#rbtPerfApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
