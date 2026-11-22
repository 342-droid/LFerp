/* 履约：贸易商付款完成后的需求。每日履行在履约详情里。 */
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
        if (status === '门店付款中' || status === '履约中' || status === '还款中') return 'warning';
        return '';
    }

    function yuan(value) {
        return blank(value) ? '—' : ('¥' + value);
    }

    /* 与首页履约风险同一口径：已履行金额、剩余履行额 = 总金额 − 已履行金额、日均履行进度和等级。 */
    function withRisk(row) {
        var days = dailyApi && typeof dailyApi.daysOf === 'function' ? dailyApi.daysOf(row) : [];
        var risk = window.RbtRisk;
        var base = risk && typeof risk.receivableOf === 'function' ? risk.receivableOf(row) : 0;
        var fact = risk && typeof risk.assessDays === 'function'
            ? risk.assessDays(days, base, row.amount)
            : { actual: '', gap: '', progress: '—', grade: '—' };
        if (dailyApi && typeof dailyApi.performanceFact === 'function') fact = dailyApi.performanceFact(row, fact);
        return Object.assign({}, row, {
            fulfilledAmount: fact.actual,
            fulfillGap: fact.gap,
            fulfillProgress: fact.progress,
            riskGrade: fact.grade,
            fulfillPhase: fact.phase || phase(row.status)
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
                { dataIndex: 'fulfillGap', title: '剩余履行额', minWidth: 120, align: 'right', formatter: function (row) { return yuan(row.fulfillGap); } },
                { dataIndex: 'fulfillProgress', title: '日均履行进度', minWidth: 120 },
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
                            { label: '履约中', value: '门店付款中' },
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
                    return true;
                }).map(withRisk).filter(function (row) {
                    if (!blank(params.status)) {
                        var want = params.status === '已完成' ? '已完成' : '履约中';
                        if (row.fulfillPhase !== want) return false;
                    }
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
