/* 异常付款数据：当前台账里不是正常的需求，加上不回写每日付款的持续未付款样例。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var api = window.RbtRisk;
    var current = null;

    function blank(value) {
        return value == null || String(value).trim() === '';
    }

    function includesText(value, query) {
        if (blank(query)) return true;
        return String(value == null ? '' : value).toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

    function closeHandle() {
        current = null;
        document.getElementById('rbtHandle').hidden = true;
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var gradeOptions = [
                { label: '关注', value: '关注' },
                { label: '预警', value: '预警' },
                { label: '异常', value: '异常' }
            ];
            var sourceOptions = [
                { label: '当前台账', value: '当前台账' },
                { label: '持续未付款样例', value: '持续未付款样例' }
            ];
            var roleNode = document.getElementById('rbtRiskRole');
            var lineNode = document.getElementById('rbtRiskBiz');
            var lines = [];
            (window.RbtStoreData && window.RbtStoreData.list ? window.RbtStoreData.list() : []).forEach(function (row) {
                if (row && row.bizLine && lines.indexOf(row.bizLine) < 0) lines.push(row.bizLine);
            });
            if (!lines.length) lines = ['餐饮', '康美', '纯私域', '集团内部'];
            if (lineNode) {
                lineNode.innerHTML = lines.map(function (name) {
                    return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
                }).join('');
            }
            var handleOptions = api.handleStatuses.map(function (status) {
                return { label: status, value: status };
            });
            var columns = [
                { dataIndex: 'storeName', title: '门店', minWidth: 140, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'demand', title: '需求单号', minWidth: 128, search: { control: 'input' } },
                { dataIndex: 'streak', title: '连续未付款天数', minWidth: 120 },
                { dataIndex: 'gap', title: '剩余应付金额', minWidth: 120, formatter: function (row) { return yuan(row.gap); } },
                { dataIndex: 'progress', title: '日均付款额', minWidth: 120 },
                { dataIndex: 'baseline', title: '生效基准', minWidth: 180 },
                { dataIndex: 'grade', title: '付款风险等级', minWidth: 120, search: { control: 'select', options: gradeOptions, placeholder: '请选择' } },
                { dataIndex: 'source', title: '数据来源', minWidth: 140, search: { control: 'select', options: sourceOptions, placeholder: '请选择' } },
                { dataIndex: 'handleStatus', title: '工单状态', minWidth: 120, search: { control: 'select', options: handleOptions, placeholder: '请选择' } },
                { dataIndex: 'handleHandler', title: '处理人', minWidth: 100 }
            ];

            function requestRows(params) {
                var matched = api.exceptionRows().map(function (row) {
                    return Object.assign({ demand: row.demandCode }, row);
                }).filter(function (row) {
                    if (!includesText(row.storeName, params.storeName) && !includesText(row.storeCode, params.storeName)) return false;
                    if (!includesText(row.demandCode, params.demand)) return false;
                    if (!blank(params.grade) && row.grade !== params.grade) return false;
                    if (!blank(params.source) && row.source !== params.source) return false;
                    if (!blank(params.handleStatus) && row.handleStatus !== params.handleStatus) return false;
                    var role = roleNode ? roleNode.value : '风控';
                    if (role === '业务' && lineNode && row.bizLine && row.bizLine !== lineNode.value) return false;
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function refreshTable() {
                var tableVm = table.value;
                if (!tableVm) return;
                if (typeof tableVm.reload === 'function') tableVm.reload();
                else if (typeof tableVm.fetchData === 'function') tableVm.fetchData();
            }

            function openDemand(row) {
                var dataApi = window.RbtDemandData;
                var item = dataApi && dataApi.get ? dataApi.get(row && row.demandCode) : null;
                if (item && window.RbtDemandDetail && typeof window.RbtDemandDetail.open === 'function') {
                    window.RbtDemandDetail.open(item, { performance: true });
                }
            }

            function openHandle(row) {
                current = row;
                var fact = [
                    ['门店', (row.storeName || '—') + (row.storeCode ? '（' + row.storeCode + '）' : '')],
                    ['需求单号', row.demandCode || '—'],
                    ['数据来源', row.scene || row.source || '—'],
                    ['连续未付款天数', row.streak],
                    ['最近未付款日期', row.lastMiss || '—'],
                    ['应付款', yuan(row.due)],
                    ['实际付款', yuan(row.actual)],
                    ['剩余应付金额', yuan(row.gap)],
                    ['处理人', row.handleHandler || '—'],
                    ['处理时间', row.handleAt ? String(row.handleAt).replace('T', ' ').slice(0, 19) : '—'],
                    ['建议暂停新需求', row.handlePause ? '是' : '否'],
                    ['日均付款额', row.progress || '—'],
                    ['生效基准', row.baseline || '—'],
                    ['付款风险等级', row.grade || '—'],
                    ['异常提醒', row.alert || '—']
                ];
                document.getElementById('rbtHandleFact').innerHTML = fact.map(function (pair) {
                    return '<tr><th>' + esc(pair[0]) + '</th><td>' + esc(pair[1]) + '</td></tr>';
                }).join('');
                var select = document.getElementById('rbtHandleStatus');
                select.innerHTML = api.handleStatuses.map(function (status) {
                    return '<option value="' + esc(status) + '">' + esc(status) + '</option>';
                }).join('');
                select.value = row.handleStatus || '待处置';
                document.getElementById('rbtHandleMeasure').value = row.handleMeasure || '';
                document.getElementById('rbtHandleResult').value = row.handleResult || '';
                document.getElementById('rbtHandleNote').value = row.handleNote || '';
                document.getElementById('rbtHandleHandler').value = row.handleHandler || (roleNode && roleNode.value !== '财务' ? roleNode.value + '演示' : '');
                document.getElementById('rbtHandlePause').checked = !!row.handlePause;
                var finance = roleNode && roleNode.value === '财务';
                document.getElementById('rbtHandleSave').hidden = finance;
                document.getElementById('rbtHandle').hidden = false;
            }

            document.getElementById('rbtHandleMask').addEventListener('click', closeHandle);
            document.getElementById('rbtHandleClose').addEventListener('click', closeHandle);
            document.getElementById('rbtHandleCancel').addEventListener('click', closeHandle);
            document.getElementById('rbtHandleSave').addEventListener('click', function () {
                if (!current || (roleNode && roleNode.value === '财务')) return;
                api.saveHandle(current.id, {
                    status: document.getElementById('rbtHandleStatus').value,
                    measure: document.getElementById('rbtHandleMeasure').value,
                    result: document.getElementById('rbtHandleResult').value,
                    note: document.getElementById('rbtHandleNote').value,
                    handler: document.getElementById('rbtHandleHandler').value,
                    pauseNew: document.getElementById('rbtHandlePause').checked
                });
                closeHandle();
                refreshTable();
                if (typeof window.showToast === 'function') window.showToast('已记录处置', 'success');
            });
            if (roleNode) roleNode.addEventListener('change', refreshTable);
            if (lineNode) lineNode.addEventListener('change', refreshTable);

            return {
                table: table,
                columns: columns,
                requestRows: requestRows,
                openDemand: openDemand,
                openHandle: openHandle
            };
        }
    }, '#rbtAbnormalApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
