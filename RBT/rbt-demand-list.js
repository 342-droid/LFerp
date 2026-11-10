/* 需求单管理：展示门店端发布的需求，默认可见待审核等全量状态。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var dataApi = window.RbtDemandData;

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

    function show(value) {
        return blank(value) ? '—' : String(value);
    }

    function guarantorText(row) {
        var names = (row.guarantors || []).map(function (item) { return item && item.name; }).filter(Boolean);
        return names.length ? names.join('、') : '—';
    }

    function periodText(row) {
        if (row.repayMethod === '比例付') return show(row.repayPeriod);
        if (blank(row.repayPeriod)) return '—';
        return String(row.repayPeriod).indexOf('期') >= 0 ? String(row.repayPeriod) : String(row.repayPeriod) + '期';
    }

    function statusType(status) {
        if (status === '已完成') return 'success';
        if (status === '已取消' || status === '已驳回') return 'info';
        if (status === '待审核' || status === '待复核') return 'warning';
        if (status === '支付中') return 'danger';
        return '';
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status' };
            var statusOptions = (dataApi.STATUSES || []).concat(dataApi.CLOSED_STATUSES || []).map(function (name) {
                return { label: name, value: name };
            });

            var columns = [
                { dataIndex: 'code', title: '需求单号', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 150, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'packageName', title: '商品包', minWidth: 140, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'amount', title: '货款总金额', minWidth: 120, formatter: function (row) { return blank(row.amount) ? '—' : ('¥' + row.amount); } },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 100, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 100, formatter: function (row) { return show(row.repayMethod); } },
                { dataIndex: 'repayPeriod', title: '结算期数/比例', minWidth: 130, formatter: periodText },
                { dataIndex: 'dailyAmount', title: '预估每日结算货款', minWidth: 150, formatter: function (row) {
                    if (row.repayMethod === '比例付') return '—';
                    return blank(row.dailyAmount) ? '—' : ('¥' + row.dailyAmount);
                } },
                { dataIndex: 'guarantors', title: '担保门店', minWidth: 160, align: 'left', showOverflowTooltip: true, formatter: guarantorText },
                {
                    dataIndex: 'status',
                    title: '状态',
                    minWidth: 110,
                    search: { control: 'select', options: statusOptions, placeholder: '请选择状态' }
                },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
                { dataIndex: 'updater', title: '更新人', minWidth: 100 },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];

            function requestRows(params) {
                var matched = dataApi.list().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.packageName, params.packageName) && !includesText(row.packageCode, params.packageName)) return false;
                    if (!blank(params.status) && row.status !== params.status) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function refreshTable() {
                table.value && table.value.refresh && table.value.refresh();
            }

            function openDetail(row) {
                var item = dataApi.get(row && row.code) || row;
                if (window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item);
                }
            }

            function canGoAudit(row) {
                return !!(row && (row.status === '待审核' || row.status === '待复核'));
            }

            function goAudit(row) {
                if (!canGoAudit(row) || !row.code) return;
                var wp = window.wmsPath || {
                    page: function (file) { return '../MDM/' + file; }
                };
                var url = wp.page('mdm_audit_rbt_demand.html');
                var joiner = url.indexOf('?') >= 0 ? '&' : '?';
                window.location.href = url + joiner + 'demandCode=' + encodeURIComponent(row.code);
            }

            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') refreshTable();
            });
            window.addEventListener('focus', refreshTable);

            return {
                table: table,
                slots: slots,
                columns: columns,
                requestRows: requestRows,
                statusType: statusType,
                openDetail: openDetail,
                canGoAudit: canGoAudit,
                goAudit: goAudit,
                refreshTable: refreshTable
            };
        }
    }, '#rbtDemandApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
