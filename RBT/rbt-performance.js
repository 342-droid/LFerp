/* 履约：只读展示复核通过后的合作。不生成还款计划、结算单或逾期处置。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var dataApi = window.RbtDemandData;
    var LIVE_STATUSES = ['还款中', '已完成'];

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

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function money(value) {
        if (blank(value) && value !== 0) return '—';
        var num = Number(String(value).replace(/^¥/, ''));
        if (!isFinite(num)) return '—';
        return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function statusType(status) {
        if (status === '已完成') return 'success';
        if (status === '还款中') return 'danger';
        return '';
    }

    function statusKind(status) {
        if (status === '已完成') return 'success';
        if (status === '还款中') return 'danger';
        return 'neutral';
    }

    function planText(row) {
        if (!row) return '—';
        if (row.status === '已完成') return '需求已完成，完成依据待确认';
        return '未激活';
    }

    function cell(label, value) {
        return (
            '<div class="supplier-detail-cell"><div class="supplier-detail-cell__label">' + esc(label) +
            '</div><div class="supplier-detail-cell__body">' + esc(value) + '</div></div>'
        );
    }

    function section(title) {
        return '<div class="supplier-detail-section-title">' + esc(title) + '</div>';
    }

    function note(text) {
        return '<p class="rbt-perf-note">' + esc(text) + '</p>';
    }

    function factRows(row) {
        var missing = row && row.status === '还款中';
        var facts = [
            ['有正营收但权益不足', '未登记'],
            ['负毛利导致商业不分', '未登记'],
            ['确零营收', '未登记'],
            ['源数据缺失', missing ? '本单当前：没有获准的营业来源，不记成零' : '未登记'],
            ['未到结算日', '起算待确认，不能据此判断'],
            ['执行在途', '未登记']
        ];
        return (
            '<table class="rbt-perf-table"><thead><tr><th>事实</th><th>本单</th></tr></thead><tbody>' +
            facts.map(function (item) {
                return '<tr><td>' + esc(item[0]) + '</td><td>' + esc(item[1]) + '</td></tr>';
            }).join('') +
            '</tbody></table>'
        );
    }

    function layerRows(row) {
        var done = row && row.status === '已完成';
        var layers = [
            ['计算来源依据', '无获准营业事实'],
            ['计算结果', '未计算'],
            ['应履行', done ? '完成依据待确认，不补本金余额' : '未产生'],
            ['可结算', '未产生'],
            ['实际履行', '未产生'],
            ['调整 / 反向', '无'],
            ['停止 / 完成依据', '待确认']
        ];
        return (
            '<table class="rbt-perf-table"><thead><tr><th>分层</th><th>本单</th></tr></thead><tbody>' +
            layers.map(function (item) {
                return '<tr><td>' + esc(item[0]) + '</td><td>' + esc(item[1]) + '</td></tr>';
            }).join('') +
            '</tbody></table>'
        );
    }

    function closeDrawer() {
        document.querySelectorAll('[data-rbt-perf-drawer]').forEach(function (node) {
            node.remove();
        });
        document.removeEventListener('keydown', onDrawerKey);
    }

    function onDrawerKey(event) {
        if (event.key !== 'Escape') return;
        closeDrawer();
    }

    function openDetail(row) {
        var item = dataApi && typeof dataApi.get === 'function' ? (dataApi.get(row && row.code) || row) : row;
        if (!item) return;
        closeDrawer();
        var backdrop = document.createElement('div');
        backdrop.className = 'store-drawer-backdrop';
        backdrop.setAttribute('data-rbt-perf-drawer', '1');
        var drawer = document.createElement('aside');
        drawer.className = 'store-drawer store-drawer--interactive store-drawer--store-wide';
        drawer.setAttribute('data-rbt-perf-drawer', '1');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', '履约详情');
        drawer.innerHTML =
            '<div class="store-drawer__header"><h2 class="store-drawer__title">履约详情</h2>' +
            '<button type="button" class="store-drawer__close" data-rbt-perf-close aria-label="关闭">&times;</button></div>' +
            '<div class="store-drawer__hero store-drawer__hero--elevated">' +
            '<div class="store-drawer__name-row"><span class="store-drawer__name">' + esc(item.code) + '</span>' +
            '<span class="mdm-detail-tag mdm-detail-tag--' + statusKind(item.status) + '">' + esc(item.status || '—') + '</span></div>' +
            '<div class="store-drawer__meta">门店：' + esc(show(item.storeName)) + '（' + esc(show(item.storeCode)) + '）</div>' +
            '<div class="store-drawer__meta">接单贸易商：' + esc(show(item.traderName)) + '</div></div>' +
            '<div class="store-drawer__body"><div class="supplier-detail-tab">' +
            section('合作引用') +
            note('沿用需求单和接单贸易商，不另建合作主单。总金额是这笔合作的货款引用。') +
            '<div class="supplier-detail-grid">' +
            cell('需求单号', item.code) +
            cell('需求状态', item.status) +
            cell('门店', show(item.storeName) + '（' + show(item.storeCode) + '）') +
            cell('接单贸易商', item.traderName) +
            cell('产品', show(item.installmentName) + '（' + show(item.installmentCode) + '）') +
            cell('结算周期', item.repayCycle) +
            cell('结算方式', item.repayMethod) +
            cell('总金额', money(item.amount)) +
            '</div>' +
            section('履约计划') +
            note('计划等起算条件确认后才激活。比例付不预造未来固定金额，预估日付与正式明细分开。') +
            '<div class="supplier-detail-grid">' +
            cell('条款版本', '沿用产品 ' + show(item.installmentName) + '，起算与舍入未冻结') +
            cell('计划版本', planText(item)) +
            cell('预估日付', item.repayMethod === '比例付' ? '不预造' : '无') +
            cell('逐期履约明细', '无') +
            '</div>' +
            section('来源、计算与履行') +
            note('来源、计算结果、应履行、可结算、实际履行分开留存。没有来源时不记零。') +
            layerRows(item) +
            section('原结算关联') +
            note('权益来源尚未在同一销售盘子分配和门店独立承担之间选定。货款应付与履约应付分开留存。关联未生成，结算中心仍用现有结算。') +
            '<div class="supplier-detail-grid">' +
            cell('原结算关联', '未生成') +
            cell('权益来源', '待确认') +
            cell('原资金结果', '无') +
            cell('实际资方到账', '无') +
            '</div>' +
            section('差异事实') +
            note('这几类事实各自记录。本页不把它们收成逾期，也没有催收、罚息、扣保证金或追担保。') +
            factRows(item) +
            '</div></div>';
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
        backdrop.addEventListener('click', closeDrawer);
        drawer.querySelector('[data-rbt-perf-close]').addEventListener('click', closeDrawer);
        document.addEventListener('keydown', onDrawerKey);
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var slots = { code: 'cell-code', status: 'cell-status' };
            var columns = [
                { dataIndex: 'code', title: '需求单号', minWidth: 130, search: { control: 'input' } },
                { dataIndex: 'storeName', title: '门店', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'traderName', title: '接单贸易商', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' }, formatter: function (row) { return show(row.traderName); } },
                {
                    dataIndex: 'status',
                    title: '需求状态',
                    minWidth: 110,
                    search: { control: 'select', options: LIVE_STATUSES.map(function (name) { return { label: name, value: name }; }), placeholder: '请选择状态' }
                },
                { dataIndex: 'repayCycle', title: '结算周期', minWidth: 100, formatter: function (row) { return show(row.repayCycle); } },
                { dataIndex: 'repayMethod', title: '结算方式', minWidth: 100, formatter: function (row) { return show(row.repayMethod); } },
                { dataIndex: 'amount', title: '总金额', minWidth: 120, formatter: function (row) { return money(row.amount); } },
                { dataIndex: 'planText', title: '履约计划', minWidth: 220, formatter: function (row) { return planText(row); } },
                { dataIndex: 'settleLink', title: '原结算关联', minWidth: 120, formatter: function () { return '未生成'; } }
            ];

            function requestRows(params) {
                var source = dataApi && typeof dataApi.list === 'function' ? dataApi.list() : [];
                var matched = source.filter(function (row) {
                    if (LIVE_STATUSES.indexOf(row.status) < 0) return false;
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.traderName, params.traderName)) return false;
                    if (!blank(params.status) && row.status !== params.status) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
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
    }, '#rbtPerfApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
