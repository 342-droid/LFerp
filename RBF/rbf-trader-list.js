/* RBF 贸易商管理：待入驻（待审核/已驳回）与已入驻（已审核）两套列表。 */
(function () {
    var dataApi = window.RbfTraderData;
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var ElMessage = OctopusPrototype.ElementPlus.ElMessage;
    var CHANGE_EVENT = 'rbf-trader:changed';
    var PENDING_STATUSES = ['待审核', '已驳回'];
    var SETTLED_STATUSES = ['已审核'];

    function optionList(values) {
        return values.map(function (value) {
            return { label: value, value: value };
        });
    }

    function blank(value) {
        return value === undefined || value === null || String(value).trim() === '';
    }

    function includesText(source, query) {
        if (blank(query)) return true;
        return String(source || '').toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function paginate(list, params) {
        var pageNum = Number(params.pageNum) || 1;
        var pageSize = Number(params.pageSize) || 20;
        var start = (pageNum - 1) * pageSize;
        return { list: list.slice(start, start + pageSize), total: list.length };
    }

    function selectedCodes(table) {
        if (!table) return [];
        var rows = table.selectedRows;
        if (rows && typeof rows === 'object' && 'value' in rows) rows = rows.value;
        if (!Array.isArray(rows) || !rows.length) {
            var inner = table.tableRef;
            if (inner && typeof inner === 'object' && 'value' in inner) inner = inner.value;
            if (inner && typeof inner.getSelectionRows === 'function') rows = inner.getSelectionRows();
        }
        return (rows || []).map(function (row) { return row && row.code; }).filter(Boolean);
    }

    function selectedRows(table) {
        if (!table) return [];
        var rows = table.selectedRows;
        if (rows && typeof rows === 'object' && 'value' in rows) rows = rows.value;
        if (!Array.isArray(rows) || !rows.length) {
            var inner = table.tableRef;
            if (inner && typeof inner === 'object' && 'value' in inner) inner = inner.value;
            if (inner && typeof inner.getSelectionRows === 'function') rows = inner.getSelectionRows();
        }
        return rows || [];
    }

    function statusTagType(status) {
        if (status === '已审核') return 'success';
        if (status === '已驳回') return 'danger';
        return 'warning';
    }

    function moneyText(value) {
        if (value === undefined || value === null || value === '') return '—';
        var num = Number(value);
        if (!isFinite(num)) return '—';
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' 元';
    }

    function quotaInputText(value) {
        var text = String(value == null ? '' : value).replace(/[^\d.]/g, '');
        var parts = text.split('.');
        if (parts.length > 2) text = parts[0] + '.' + parts.slice(1).join('');
        parts = text.split('.');
        if (parts[1] && parts[1].length > 2) text = parts[0] + '.' + parts[1].slice(0, 2);
        return text;
    }

    function baseColumns(options) {
        var withStatusSearch = !!(options && options.withStatusSearch);
        var withQuota = !!(options && options.withQuota);
        var cols = [
            {
                dataIndex: 'subjectName',
                title: '主体名称',
                minWidth: 200,
                fixed: 'left',
                align: 'left',
                showOverflowTooltip: true,
                search: { control: 'input', placeholder: '请输入主体名称' }
            },
            {
                dataIndex: 'licenseType',
                title: '牌照类型',
                minWidth: 140,
                search: {
                    control: 'select',
                    options: optionList(dataApi.licenseTypes),
                    placeholder: '请选择'
                }
            },
            {
                dataIndex: 'bizScope',
                title: '业务范围',
                minWidth: 120,
                search: {
                    control: 'select',
                    options: optionList(dataApi.bizScopes),
                    placeholder: '请选择'
                }
            },
            {
                dataIndex: 'contactName',
                title: '联系人姓名',
                minWidth: 110,
                search: { control: 'input', placeholder: '请输入联系人姓名' }
            },
            {
                dataIndex: 'contactPhone',
                title: '联系人手机号',
                minWidth: 140,
                search: { control: 'input', placeholder: '请输入联系人手机号' }
            },
            {
                dataIndex: 'status',
                title: '状态',
                width: 110,
                search: withStatusSearch
                    ? {
                        control: 'select',
                        options: optionList(PENDING_STATUSES),
                        placeholder: '请选择'
                    }
                    : undefined
            }
        ];
        if (withQuota) {
            cols.push(
                {
                    dataIndex: 'orderQuota',
                    title: '接单总额度',
                    minWidth: 140,
                    align: 'right',
                    formatter: function (row) {
                        return moneyText(dataApi.quotaOf(row).total);
                    }
                },
                {
                    dataIndex: 'occupiedQuota',
                    title: '已占用（接单中）',
                    minWidth: 150,
                    align: 'right',
                    formatter: function (row) {
                        return moneyText(dataApi.quotaOf(row).occupied);
                    }
                },
                {
                    dataIndex: 'lockedQuota',
                    title: '已成交锁定',
                    minWidth: 140,
                    align: 'right',
                    formatter: function (row) {
                        return moneyText(dataApi.quotaOf(row).locked);
                    }
                },
                {
                    dataIndex: 'availableQuota',
                    title: '可用额度',
                    minWidth: 140,
                    align: 'right',
                    formatter: function (row) {
                        return moneyText(dataApi.quotaOf(row).available);
                    }
                }
            );
        }
        cols.push(
            { dataIndex: 'creator', title: '创建人', minWidth: 110 },
            { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
            { dataIndex: 'updater', title: '更新人', minWidth: 110 },
            { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
        );
        return cols;
    }

    function matchFilters(row, params) {
        if (!includesText(row.subjectName, params.subjectName)) return false;
        if (!blank(params.licenseType) && row.licenseType !== params.licenseType) return false;
        if (!blank(params.bizScope) && row.bizScope !== params.bizScope) return false;
        if (!includesText(row.contactName, params.contactName)) return false;
        if (!includesText(row.contactPhone, params.contactPhone)) return false;
        if (!blank(params.status) && row.status !== params.status) return false;
        return true;
    }

    function openDetail(row) {
        var item = null;
        if (row && row.code) item = dataApi.get(row.code);
        if (!item && row && row.subjectName) {
            item = dataApi.list().filter(function (entry) {
                return entry && entry.subjectName === row.subjectName;
            })[0];
        }
        if (!item && typeof row === 'string' && row) {
            item = dataApi.get(row) || dataApi.list().filter(function (entry) {
                return entry && entry.subjectName === row;
            })[0];
        }
        if (!item && row && row.subjectName) item = row;
        if (item && window.RbfTraderDetail) window.RbfTraderDetail.open(item);
    }

    function notifyChanged() {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    }

    function bindRefresh(table) {
        window.addEventListener(CHANGE_EVENT, function () {
            table.value && table.value.fetchData();
        });
    }

    function mountPending() {
        OctopusPrototype.mount({
            setup: function () {
                var table = ref(null);
                var auditDialog = ref(null);
                var pendingAuditCodes = [];
                var slots = { subject: 'cell-subjectName', status: 'cell-status' };
                var columns = baseColumns({ withStatusSearch: true });
                var auditFields = [
                    {
                        field: 'orderquota',
                        label: '接单总额度',
                        control: 'slot',
                        requiredMark: true,
                        required: true,
                        colSpan: 24
                    }
                ];

                function requestRows(params) {
                    var matched = dataApi.list(PENDING_STATUSES).filter(function (row) {
                        return matchFilters(row, params);
                    });
                    return Promise.resolve(paginate(matched, params));
                }

                function pickRows(rows) {
                    var picked = rows && rows.length ? rows : selectedRows(table.value);
                    return (picked || []).filter(Boolean);
                }

                function onQuotaInput(form, value) {
                    form.orderquota = quotaInputText(value);
                }

                function audit(rows) {
                    var picked = pickRows(rows);
                    if (!picked.length) {
                        ElMessage.error('请先勾选待入驻贸易商');
                        return;
                    }
                    var invalid = picked.filter(function (row) { return row.status !== '待审核'; });
                    if (invalid.length) {
                        ElMessage.error('仅待审核状态可审核，请重新勾选');
                        return;
                    }
                    pendingAuditCodes = picked.map(function (row) { return row.code; });
                    auditDialog.value && auditDialog.value.showEdit({ orderquota: '' });
                }

                function beforeSubmitAudit(values) {
                    var text = String(values.orderquota == null ? '' : values.orderquota).trim();
                    if (!text) {
                        ElMessage.error('请输入接单总额度');
                        return false;
                    }
                    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
                        ElMessage.error('接单总额度仅支持数字，最多两位小数');
                        return false;
                    }
                    var amount = Number(text);
                    if (!(amount > 0)) {
                        ElMessage.error('接单总额度须大于 0');
                        return false;
                    }
                    return { orderquota: amount };
                }

                function submitAudit(values) {
                    if (!pendingAuditCodes.length) {
                        ElMessage.error('请先勾选待入驻贸易商');
                        throw { __handledByPage: true };
                    }
                    dataApi.updateStatus(pendingAuditCodes, '已审核', '管理员', {
                        orderQuota: values.orderquota
                    });
                }

                function onAuditSaved() {
                    pendingAuditCodes = [];
                    notifyChanged();
                }

                function reject(rows) {
                    var picked = pickRows(rows);
                    if (!picked.length) {
                        ElMessage.error('请先勾选待入驻贸易商');
                        return;
                    }
                    var invalid = picked.filter(function (row) { return row.status !== '待审核'; });
                    if (invalid.length) {
                        ElMessage.error('仅待审核状态可驳回，请重新勾选');
                        return;
                    }
                    var codes = picked.map(function (row) { return row.code; });
                    dataApi.updateStatus(codes, '已驳回', '管理员');
                    ElMessage.success('已驳回 ' + codes.length + ' 家贸易商');
                    notifyChanged();
                }

                bindRefresh(table);

                return {
                    slots: slots,
                    table: table,
                    auditDialog: auditDialog,
                    columns: columns,
                    auditFields: auditFields,
                    requestRows: requestRows,
                    openDetail: openDetail,
                    audit: audit,
                    reject: reject,
                    beforeSubmitAudit: beforeSubmitAudit,
                    submitAudit: submitAudit,
                    onAuditSaved: onAuditSaved,
                    onQuotaInput: onQuotaInput,
                    statusTagType: statusTagType
                };
            }
        }, '#rbfTraderPendingApp', {
            services: {},
            warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
            permissions: [],
            user: { userId: 'demo', userName: '演示用户' }
        });
    }

    function mountSettled() {
        OctopusPrototype.mount({
            setup: function () {
                var table = ref(null);
                var slots = { subject: 'cell-subjectName', status: 'cell-status' };
                var columns = baseColumns({ withQuota: true });

                function requestRows(params) {
                    var matched = dataApi.list(SETTLED_STATUSES).filter(function (row) {
                        return matchFilters(row, params);
                    });
                    return Promise.resolve(paginate(matched, params));
                }

                bindRefresh(table);

                return {
                    slots: slots,
                    table: table,
                    columns: columns,
                    requestRows: requestRows,
                    openDetail: openDetail,
                    statusTagType: statusTagType
                };
            }
        }, '#rbfTraderSettledApp', {
            services: {},
            warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
            permissions: [],
            user: { userId: 'demo', userName: '演示用户' }
        });
    }

    if (document.getElementById('rbfTraderPendingApp')) mountPending();
    if (document.getElementById('rbfTraderSettledApp')) mountSettled();
})();
