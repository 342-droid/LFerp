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

    function yuan(value) {
        return blank(value) ? '—' : ('¥' + value);
    }

    /* 与首页履约风险同一口径：已发生日期的实际履行合计、应履行减实际履行、覆盖率和等级。 */
    function withRisk(row) {
        var days = dailyApi && typeof dailyApi.daysOf === 'function' ? dailyApi.daysOf(row) : [];
        var fact = window.RbtRisk && typeof window.RbtRisk.assessDays === 'function'
            ? window.RbtRisk.assessDays(days)
            : { actual: '', gap: '', cover: '—', grade: '—' };
        return Object.assign({}, row, {
            fulfilledAmount: fact.actual,
            fulfillGap: fact.gap,
            fulfillCover: fact.cover,
            riskGrade: fact.grade
        });
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            /* 页内模板会把 v-slot 表达式转成小写，风险等级的键用 riskgrade。 */
            var slots = { code: 'cell-code', status: 'cell-status', riskgrade: 'cell-riskGrade' };
            var gradeOptions = [
                { label: '正常', value: '正常' },
                { label: '关注', value: '关注' },
                { label: '预警', value: '预警' },
                { label: '异常', value: '异常' }
            ];

            var columns = [
                { dataIndex: 'code', title: '需求单号', minWidth: 140, search: { control: 'input' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 160, align: 'left', search: { control: 'input' } },
                { dataIndex: 'storeCode', title: '门店编码', minWidth: 120 },
                { dataIndex: 'traderName', title: '贸易商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.traderName); } },
                { dataIndex: 'providerName', title: '服务商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.providerName); } },
                { dataIndex: 'accountNameQuery', title: '收款账户名称', hideInTable: true, search: { control: 'input' } },
                { dataIndex: 'accountNoQuery', title: '收款账户', hideInTable: true, search: { control: 'input' } },
                { dataIndex: 'amount', title: '总金额', minWidth: 120, formatter: function (row) { return blank(row.amount) ? '—' : ('¥' + row.amount); } },
                { dataIndex: 'fulfilledAmount', title: '已履行金额', minWidth: 120, align: 'right', formatter: function (row) { return yuan(row.fulfilledAmount); } },
                { dataIndex: 'fulfillGap', title: '未履行差额', minWidth: 120, align: 'right', formatter: function (row) { return yuan(row.fulfillGap); } },
                { dataIndex: 'fulfillCover', title: '履行覆盖率', minWidth: 110 },
                {
                    dataIndex: 'riskGrade',
                    title: '履约风险等级',
                    minWidth: 120,
                    search: { control: 'select', options: gradeOptions, placeholder: '请选择' }
                },
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
                }).map(withRisk).filter(function (row) {
                    if (!blank(params.riskGrade) && row.riskGrade !== params.riskGrade) return false;
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
