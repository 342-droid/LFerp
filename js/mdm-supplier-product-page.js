/* 供货关系列表：查询。编辑可改最小起订量和采购周期，商品单位和协议价只读。演示数据只在本页内存，刷新还原。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var ElMessage = OctopusPrototype.ElementPlus.ElMessage;

    var rows = [
        { supplier: '华东果蔬有限公司', spuCode: 'SPU10001', skuCode: 'SKU10001', barcode: '6901234567001', skuName: '库尔勒香梨 4kg', skuUnit: '箱', agreementPrice: 42.5, minOrderQty: 20, purchaseCycle: 2, supplyStatus: '生效', createdAt: '2026-04-12 09:15:23', createdBy: '王丽', updatedAt: '2026-05-10 10:08:02', updatedBy: '王丽' },
        { supplier: '浙北农产品合作社', spuCode: 'SPU10002', skuCode: 'SKU10002', barcode: '6901234567002', skuName: '精品黄瓜 2kg', skuUnit: '箱', agreementPrice: 16.8, minOrderQty: 10, purchaseCycle: 1, supplyStatus: '生效', createdAt: '2026-04-15 14:20:10', createdBy: '张宁', updatedAt: '2026-05-11 11:30:45', updatedBy: '张宁' },
        { supplier: '上海鲜达供应链', spuCode: 'SPU10003', skuCode: 'SKU10003', barcode: '6901234567003', skuName: '冷鲜牛腩 1kg', skuUnit: '件', agreementPrice: 58, minOrderQty: 5, purchaseCycle: 3, supplyStatus: '停用', createdAt: '2026-03-28 16:40:05', createdBy: '李萌', updatedAt: '2026-05-07 13:12:39', updatedBy: '李萌' },
        { supplier: '苏果直采中心', spuCode: 'SPU10004', skuCode: 'SKU10004', barcode: '6901234567004', skuName: '山东土豆 5kg', skuUnit: '袋', agreementPrice: 21.6, minOrderQty: 50, purchaseCycle: 2, supplyStatus: '生效', createdAt: '2026-04-18 08:32:54', createdBy: '陈杰', updatedAt: '2026-05-09 17:26:18', updatedBy: '陈杰' },
        { supplier: '华东果蔬有限公司', spuCode: 'SPU10005', skuCode: 'SKU10005', barcode: '6901234567005', skuName: '云南小番茄 1kg', skuUnit: '箱', agreementPrice: 13.2, minOrderQty: 30, purchaseCycle: 1, supplyStatus: '停用', createdAt: '2026-03-21 10:22:11', createdBy: '王丽', updatedAt: '2026-04-30 15:40:27', updatedBy: '王丽' },
        { supplier: '浙北农产品合作社', spuCode: 'SPU10006', skuCode: 'SKU10006', barcode: '6901234567006', skuName: '新西兰奇异果 12粒', skuUnit: '盒', agreementPrice: 36.9, minOrderQty: 12, purchaseCycle: 7, supplyStatus: '生效', createdAt: '2026-04-22 11:18:33', createdBy: '张宁', updatedAt: '2026-05-12 09:55:41', updatedBy: '张宁' },
        { supplier: '上海鲜达供应链', spuCode: 'SPU10007', skuCode: 'SKU10007', barcode: '6901234567007', skuName: '冷冻鸡中翅 2kg', skuUnit: '袋', agreementPrice: 47, minOrderQty: 8, purchaseCycle: 3, supplyStatus: '停用', createdAt: '2026-03-26 13:47:25', createdBy: '李萌', updatedAt: '2026-05-08 18:03:19', updatedBy: '李萌' },
        { supplier: '苏果直采中心', spuCode: 'SPU10008', skuCode: 'SKU10008', barcode: '6901234567008', skuName: '江西紫薯 3kg', skuUnit: '箱', agreementPrice: 19.9, minOrderQty: 40, purchaseCycle: 2, supplyStatus: '生效', createdAt: '2026-04-08 15:39:07', createdBy: '陈杰', updatedAt: '2026-05-06 12:28:54', updatedBy: '陈杰' },
        { supplier: '华东果蔬有限公司', spuCode: 'SPU10009', skuCode: 'SKU10009', barcode: '6901234567009', skuName: '东北黑木耳 500g', skuUnit: '袋', agreementPrice: 29.5, minOrderQty: 6, purchaseCycle: 5, supplyStatus: '停用', createdAt: '2026-03-11 09:05:44', createdBy: '王丽', updatedAt: '2026-04-27 10:17:36', updatedBy: '王丽' },
        { supplier: '浙北农产品合作社', spuCode: 'SPU10010', skuCode: 'SKU10010', barcode: '6901234567010', skuName: '福建空心菜 400g', skuUnit: '把', agreementPrice: 6.8, minOrderQty: 15, purchaseCycle: 1, supplyStatus: '生效', createdAt: '2026-04-25 17:11:50', createdBy: '张宁', updatedAt: '2026-05-13 14:09:22', updatedBy: '张宁' },
        { supplier: '上海鲜达供应链', spuCode: 'SPU10011', skuCode: 'SKU10011', barcode: '6901234567011', skuName: '冷鲜猪里脊 1kg', skuUnit: '件', agreementPrice: 39.8, minOrderQty: 10, purchaseCycle: 2, supplyStatus: '生效', createdAt: '2026-04-17 10:55:31', createdBy: '李萌', updatedAt: '2026-05-10 16:43:17', updatedBy: '李萌' },
        { supplier: '苏果直采中心', spuCode: 'SPU10012', skuCode: 'SKU10012', barcode: '6901234567012', skuName: '海南贝贝南瓜 2kg', skuUnit: '箱', agreementPrice: 18.4, minOrderQty: 24, purchaseCycle: 4, supplyStatus: '停用', createdAt: '2026-03-30 12:27:08', createdBy: '陈杰', updatedAt: '2026-05-05 09:32:40', updatedBy: '陈杰' }
    ];

    var suppliers = [];
    rows.forEach(function (row) {
        if (suppliers.indexOf(row.supplier) === -1) suppliers.push(row.supplier);
    });

    function optionList(values) {
        return values.map(function (value) { return { label: value, value: value }; });
    }

    function blank(value) {
        return value === undefined || value === null || String(value).trim() === '';
    }

    function includesText(source, query) {
        if (blank(query)) return true;
        return String(source || '').indexOf(String(query).trim()) !== -1;
    }

    function nowText() {
        var date = new Date();
        function pad(n) { return String(n).padStart(2, '0'); }
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
            ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function formatPrice(row) {
        var num = Number(row.agreementPrice);
        if (!isFinite(num)) return '--';
        return num.toFixed(2);
    }

    function paginate(list, params) {
        var pageNum = Number(params.pageNum) || 1;
        var pageSize = Number(params.pageSize) || 20;
        var start = (pageNum - 1) * pageSize;
        return { list: list.slice(start, start + pageSize), total: list.length };
    }

    function applySort(list, params) {
        var field = params.sortField;
        var order = params.sortOrder;
        if (!field || !order) return list;
        var dir = (order === 'asc' || order === 'ascending') ? 1 : -1;
        return list.slice().sort(function (a, b) {
            var left = a[field];
            var right = b[field];
            if (field === 'agreementPrice' || field === 'minOrderQty' || field === 'purchaseCycle') {
                left = Number(left);
                right = Number(right);
            } else {
                left = left == null ? '' : String(left);
                right = right == null ? '' : String(right);
            }
            if (left < right) return -1 * dir;
            if (left > right) return 1 * dir;
            return 0;
        });
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var editDialog = ref(null);
            var slots = {
                spucode: 'cell-spuCode',
                skucode: 'cell-skuCode',
                barcode: 'cell-barcode',
                supplystatus: 'cell-supplyStatus'
            };
            var columns = [
                { dataIndex: 'supplier', title: '供应商', minWidth: 160, align: 'left', fixed: 'left', showOverflowTooltip: true, search: { control: 'select', options: optionList(suppliers), placeholder: '请选择' } },
                { dataIndex: 'spuCode', title: 'SPU编码', minWidth: 140, search: { control: 'input', placeholder: '请输入' } },
                { dataIndex: 'skuCode', title: '商品编码', minWidth: 140, search: { control: 'input', placeholder: '请输入' } },
                { dataIndex: 'barcode', title: '商品条码', minWidth: 160, search: { control: 'input', placeholder: '请输入' } },
                { dataIndex: 'skuName', title: '商品名称', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input', placeholder: '请输入' } },
                { dataIndex: 'skuUnit', title: '商品单位', width: 100 },
                { dataIndex: 'agreementPrice', title: '协议价（实际采购价）', minWidth: 160, align: 'right', className: 'is-money', sorter: true, formatter: formatPrice },
                { dataIndex: 'minOrderQty', title: '最小起订量', minWidth: 120, align: 'right', sorter: true },
                { dataIndex: 'purchaseCycle', title: '采购周期', minWidth: 110, align: 'right', sorter: true },
                { dataIndex: 'supplyStatus', title: '供货状态', width: 110, search: { control: 'select', options: optionList(['生效', '停用']), placeholder: '请选择' } },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170, sorter: true },
                { dataIndex: 'createdBy', title: '创建人', minWidth: 100, showOverflowTooltip: true },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170, sorter: true },
                { dataIndex: 'updatedBy', title: '更新人', minWidth: 100, showOverflowTooltip: true }
            ];
            var editFields = [
                { field: 'supplier', label: '供应商', disabled: true },
                { field: 'spuCode', label: 'SPU编码', disabled: true },
                { field: 'skuCode', label: '商品编码', disabled: true },
                { field: 'barcode', label: '商品条码', disabled: true },
                { field: 'skuName', label: '商品名称', disabled: true },
                { field: 'skuUnit', label: '商品单位', disabled: true },
                { field: 'agreementPrice', label: '协议价（实际采购价）', disabled: true, colSpan: 24 },
                { field: 'minOrderQty', label: '最小起订量', control: 'inputnumber', required: true, min: 1, precision: 0, placeholder: '请输入最小起订量' },
                { field: 'purchaseCycle', label: '采购周期', control: 'inputnumber', required: true, min: 1, precision: 0, placeholder: '请输入采购周期' }
            ];

            function requestRows(params) {
                var matched = rows.filter(function (row) {
                    if (!blank(params.supplier) && row.supplier !== params.supplier) return false;
                    if (!blank(params.supplyStatus) && row.supplyStatus !== params.supplyStatus) return false;
                    if (!includesText(row.spuCode, params.spuCode)) return false;
                    if (!includesText(row.skuCode, params.skuCode)) return false;
                    if (!includesText(row.barcode, params.barcode)) return false;
                    if (!includesText(row.skuName, params.skuName)) return false;
                    return true;
                });
                return Promise.resolve(paginate(applySort(matched, params), params));
            }

            function editRow(row) {
                editDialog.value && editDialog.value.showEdit(row);
            }

            function validInt(value, min) {
                var num = Number(value);
                return isFinite(num) && num >= min && Math.floor(num) === num;
            }

            function beforeSubmit(values) {
                if (!validInt(values.minOrderQty, 1)) {
                    ElMessage.error('请输入有效的最小起订量');
                    return false;
                }
                if (!validInt(values.purchaseCycle, 1)) {
                    ElMessage.error('请输入有效的采购周期');
                    return false;
                }
                return values;
            }

            function saveSupply(values) {
                var target = rows.find(function (item) { return item.skuCode === values.skuCode; });
                if (!target) return;
                target.minOrderQty = Math.round(Number(values.minOrderQty));
                target.purchaseCycle = Math.round(Number(values.purchaseCycle));
                target.updatedAt = nowText();
                target.updatedBy = '当前用户';
            }

            function refreshTable() {
                table.value && table.value.fetchData();
            }

            return {
                slots: slots,
                table: table,
                editDialog: editDialog,
                columns: columns,
                editFields: editFields,
                requestRows: requestRows,
                editRow: editRow,
                beforeSubmit: beforeSubmit,
                saveSupply: saveSupply,
                refreshTable: refreshTable
            };
        }
    }, '#supplyApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
