/* RBT 门店列表：查询、新增准入门店、勾选后批量添加或移出标签，门店编码弹出详情。 */
(function () {
    var dataApi = window.RbtStoreData;
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var ElMessage = OctopusPrototype.ElementPlus.ElMessage;

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

    function regionText(row) {
        var text = String(row.region || '').replace(/\//g, ' / ');
        return text || '—';
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

    function parseQuota(values) {
        var text = String(values.storequota == null ? '' : values.storequota).trim();
        if (!text) {
            ElMessage.error('请输入门店额度');
            return false;
        }
        if (!/^\d+(\.\d{1,2})?$/.test(text)) {
            ElMessage.error('门店额度仅支持数字，最多两位小数');
            return false;
        }
        var amount = Number(text);
        if (!(amount > 0)) {
            ElMessage.error('门店额度须大于 0');
            return false;
        }
        return amount;
    }

    function parseDemandLimit(values) {
        var text = String(values.demandlimit == null ? '' : values.demandlimit).trim();
        if (!text) {
            ElMessage.error('请输入需求次数');
            return false;
        }
        if (!/^[1-9]\d*$/.test(text)) {
            ElMessage.error('需求次数须为大于 0 的整数');
            return false;
        }
        return Number(text);
    }

    function paginate(list, params) {
        var pageNum = Number(params.pageNum) || 1;
        var pageSize = Number(params.pageSize) || 20;
        var start = (pageNum - 1) * pageSize;
        return { list: list.slice(start, start + pageSize), total: list.length };
    }

    function tagsOf(row) {
        var store = window.BusinessTagPrototypeStore;
        if (!store || typeof store.tagsFor !== 'function' || !row) return [];
        return store.tagsFor('RBT_STORE', row.code) || [];
    }

    OctopusPrototype.mount({
        setup: function () {
            var table = ref(null);
            var addDialog = ref(null);
            var editDialog = ref(null);
            var batchDialog = ref(null);
            var batchTitle = ref('添加标签');
            var batchSuccessText = ref('已添加标签');
            var batchMode = 'add';
            var batchCodes = [];
            var afterSave = 'add';
            var occupiedVisible = ref(false);
            var occupiedTitle = ref('已占用需求单');
            var occupiedRows = ref([]);
            var slots = {
                code: 'cell-code',
                phone: 'cell-phone',
                legalphone: 'cell-legalPhone',
                tags: 'cell-storeTags',
                status: 'cell-enabled',
                occupied: 'cell-occupiedQuota'
            };
            var tagOptions = (window.BusinessTagPrototypeStore.listTags('RBT_STORE', false) || []).map(function (tag) {
                return { label: tag.name, value: tag.id };
            });
            var columns = [
                { dataIndex: 'code', title: '门店编码', minWidth: 140, fixed: 'left', search: { control: 'input' } },
                { dataIndex: 'name', title: '门店名称', minWidth: 160, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'rbtLevel', title: 'RBT等级', width: 100, search: { control: 'select', options: optionList(dataApi.levels) } },
                { dataIndex: 'enabled', title: '状态', width: 100 },
                { dataIndex: 'contactQuery', title: '联系人姓名', hideInTable: true, search: { control: 'input' } },
                { dataIndex: 'contactPhone', title: '联系人手机号', hideInTable: true, search: { control: 'input' } },
                { dataIndex: 'storeTags', title: 'RBT标签', minWidth: 180, align: 'left' },
                {
                    dataIndex: 'storeQuota',
                    title: '门店总额度',
                    minWidth: 140,
                    align: 'right',
                    formatter: function (row) {
                        return moneyText(dataApi.quotaOf(row).total);
                    }
                },
                {
                    dataIndex: 'occupiedQuota',
                    title: '已占用',
                    minWidth: 150,
                    align: 'right'
                },
                {
                    dataIndex: 'lockedQuota',
                    title: '已成交',
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
                },
                {
                    dataIndex: 'demandLimit',
                    title: '需求次数',
                    width: 100,
                    align: 'right',
                    formatter: function (row) {
                        return String(dataApi.demandLimitOf(row));
                    }
                },
                {
                    dataIndex: 'depositPaid',
                    title: '保证金',
                    width: 100,
                    formatter: function (row) {
                        if (row.depositPaid === true) return '已缴纳';
                        if (row.depositPaid === false) return '未缴纳';
                        return '—';
                    }
                },
                { dataIndex: 'partnerType', title: '门店合作类型', minWidth: 120 },
                { dataIndex: 'storeType', title: '门店类型', minWidth: 120 },
                { dataIndex: 'bizLine', title: '事业线', minWidth: 110 },
                { dataIndex: 'brandName', title: '品牌名称', minWidth: 140, align: 'left', showOverflowTooltip: true },
                { dataIndex: 'bizLines', title: '业务线', minWidth: 200, align: 'left', showOverflowTooltip: true },
                { dataIndex: 'contact', title: '联系人', minWidth: 100 },
                { dataIndex: 'phone', title: '联系人手机号', minWidth: 150 },
                { dataIndex: 'legalName', title: '法人姓名', minWidth: 100, search: { control: 'input' } },
                { dataIndex: 'legalPhone', title: '法人手机号', minWidth: 150, search: { control: 'input' } },
                { dataIndex: 'tagQuery', title: 'RBT标签', hideInTable: true, search: { control: 'select', options: tagOptions, placeholder: '请选择' } },
                { dataIndex: 'warehouse', title: '配送仓库', minWidth: 140, align: 'left', showOverflowTooltip: true },
                { dataIndex: 'region', title: '省市区', minWidth: 180, align: 'left', showOverflowTooltip: true, formatter: regionText },
                { dataIndex: 'address', title: '详细地址', minWidth: 200, align: 'left', showOverflowTooltip: true },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
                { dataIndex: 'updater', title: '更新人', minWidth: 100 },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];
            var lockedKeys = ['code', 'name', 'partnerType', 'storeType', 'bizLine', 'brandName', 'bizLines', 'contact', 'phone', 'legalName', 'legalPhone', 'warehouse', 'region', 'address'];
            var archiveOptions = dataApi.archiveStores().map(function (item) {
                return { label: item.name + '（' + item.code + '）', value: item.code };
            });

            function fillFromArchive(code, form) {
                var source = code ? dataApi.archiveByCode(code) : null;
                lockedKeys.forEach(function (key) {
                    form[key] = source && source[key] ? source[key] : '';
                });
            }

            function lockedField(field, label, extra) {
                return Object.assign({ field: field, label: label, disabled: true, placeholder: '选择门店后自动带出' }, extra || {});
            }

            var addFields = [
                {
                    field: 'archiveCode',
                    label: '门店',
                    control: 'select',
                    required: true,
                    colSpan: 24,
                    options: archiveOptions,
                    placeholder: '请选择门店档案中的门店',
                    dependency: {
                        onChange: function (value, form) {
                            fillFromArchive(value, form);
                        }
                    }
                },
                { field: 'rbtLevel', label: 'RBT等级', control: 'select', required: true, options: optionList(dataApi.levels), placeholder: '请选择' },
                { field: 'status', label: '状态', control: 'select', required: true, defaultValue: '启用', options: optionList(['启用', '禁用']), placeholder: '请选择' },
                {
                    field: 'storequota',
                    label: '门店额度',
                    control: 'slot',
                    requiredMark: true,
                    required: true,
                    colSpan: 24
                },
                {
                    field: 'demandlimit',
                    label: '需求次数',
                    control: 'slot',
                    requiredMark: true,
                    required: true,
                    defaultValue: '1',
                    colSpan: 12
                },
                {
                    field: 'depositpaid',
                    label: '保证金是否缴纳',
                    control: 'slot',
                    requiredMark: true,
                    defaultValue: '',
                    colSpan: 24
                },
                {
                    field: 'depositvoucher',
                    label: '缴纳凭证',
                    control: 'slot',
                    defaultValue: null,
                    colSpan: 24
                },
                { field: 'storeTags', label: 'RBT标签', control: 'select', multiple: true, defaultValue: [], colSpan: 24, options: tagOptions, placeholder: '可不选' },
                lockedField('code', '门店编码'),
                lockedField('name', '门店名称'),
                lockedField('partnerType', '门店合作类型'),
                lockedField('storeType', '门店类型'),
                lockedField('bizLine', '事业线'),
                lockedField('brandName', '品牌名称'),
                lockedField('bizLines', '业务线', { colSpan: 24 }),
                lockedField('contact', '联系人姓名'),
                lockedField('phone', '联系人手机号'),
                lockedField('legalName', '法人姓名'),
                lockedField('legalPhone', '法人手机号'),
                lockedField('warehouse', '配送仓库'),
                lockedField('region', '省市区'),
                lockedField('address', '详细地址', { colSpan: 24 })
            ];
            var editFields = [
                {
                    field: 'archiveCode',
                    label: '门店',
                    control: 'select',
                    disabled: true,
                    colSpan: 24,
                    options: archiveOptions,
                    placeholder: '请选择门店档案中的门店'
                },
                { field: 'rbtLevel', label: 'RBT等级', control: 'select', required: true, options: optionList(dataApi.levels), placeholder: '请选择' },
                { field: 'status', label: '状态', control: 'select', required: true, defaultValue: '启用', options: optionList(['启用', '禁用']), placeholder: '请选择' },
                {
                    field: 'storequota',
                    label: '门店额度',
                    control: 'slot',
                    requiredMark: true,
                    required: true,
                    colSpan: 24
                },
                {
                    field: 'demandlimit',
                    label: '需求次数',
                    control: 'slot',
                    requiredMark: true,
                    required: true,
                    defaultValue: '1',
                    colSpan: 12
                },
                {
                    field: 'depositpaid',
                    label: '保证金是否缴纳',
                    control: 'slot',
                    requiredMark: true,
                    defaultValue: '',
                    colSpan: 24
                },
                {
                    field: 'depositvoucher',
                    label: '缴纳凭证',
                    control: 'slot',
                    defaultValue: null,
                    colSpan: 24
                },
                { field: 'storeTags', label: 'RBT标签', control: 'select', multiple: true, defaultValue: [], colSpan: 24, options: tagOptions, placeholder: '可不选' },
                lockedField('code', '门店编码'),
                lockedField('name', '门店名称'),
                lockedField('partnerType', '门店合作类型'),
                lockedField('storeType', '门店类型'),
                lockedField('bizLine', '事业线'),
                lockedField('brandName', '品牌名称'),
                lockedField('bizLines', '业务线', { colSpan: 24 }),
                lockedField('contact', '联系人姓名'),
                lockedField('phone', '联系人手机号'),
                lockedField('legalName', '法人姓名'),
                lockedField('legalPhone', '法人手机号'),
                lockedField('warehouse', '配送仓库'),
                lockedField('region', '省市区'),
                lockedField('address', '详细地址', { colSpan: 24 })
            ];
            var batchFields = [
                { field: 'storeTags', label: 'RBT标签', control: 'select', multiple: true, required: true, defaultValue: [], options: tagOptions, placeholder: '请选择标签' }
            ];

            function requestRows(params) {
                var matched = dataApi.list().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.name, params.name)) return false;
                    if (!blank(params.rbtLevel) && row.rbtLevel !== params.rbtLevel) return false;
                    if (!includesText(row.contact, params.contactQuery)) return false;
                    if (!includesText(row.phone, params.contactPhone)) return false;
                    if (!includesText(row.legalName, params.legalName)) return false;
                    if (!includesText(row.legalPhone, params.legalPhone)) return false;
                    if (!blank(params.tagQuery)) {
                        var bound = window.BusinessTagPrototypeStore.getBinding('RBT_STORE', row.code) || [];
                        if (bound.indexOf(params.tagQuery) < 0) return false;
                    }
                    return true;
                });
                return Promise.resolve(paginate(matched, params));
            }

            function occupiedText(row) {
                return moneyText(dataApi.quotaOf(row).occupied);
            }

            function canOpenOccupied(row) {
                var occupied = dataApi.quotaOf(row).occupied;
                return Number(occupied) > 0;
            }

            function openOccupied(row) {
                if (!row || !canOpenOccupied(row)) return;
                var demandApi = window.RbtDemandData;
                var rows = demandApi && typeof demandApi.listOccupyingDemands === 'function'
                    ? demandApi.listOccupyingDemands(row.code)
                    : [];
                occupiedTitle.value = '已占用需求单 · ' + (row.name || row.code || '');
                occupiedRows.value = rows || [];
                occupiedVisible.value = true;
            }

            function openDetail(row) {
                var store = dataApi.get(row.code);
                if (store && window.RbtStoreDetail) window.RbtStoreDetail.open(store);
            }

            function openAdd() {
                afterSave = 'add';
                addDialog.value && addDialog.value.showEdit();
            }

            function onQuotaInput(form, value) {
                form.storequota = quotaInputText(value);
            }

            function onDemandLimitInput(form, value) {
                form.demandlimit = String(value == null ? '' : value).replace(/\D/g, '').replace(/^0+/, '');
            }

            function depositFileText(form) {
                var file = form && form.depositvoucher;
                return file && file.name ? '已选择：' + file.name : '支持图片或 PDF，不超过 800KB';
            }

            function onDepositFile(form, event) {
                var input = event && event.target;
                var file = input && input.files && input.files[0];
                if (!file) {
                    form.depositvoucher = null;
                    return;
                }
                if (file.size > 800 * 1024) {
                    ElMessage.error('凭证文件请控制在 800KB 以内');
                    input.value = '';
                    form.depositvoucher = null;
                    return;
                }
                var reader = new FileReader();
                reader.onload = function () {
                    form.depositvoucher = {
                        name: file.name || '缴纳凭证',
                        type: file.type || '',
                        data: String(reader.result || ''),
                        uploadedAt: dataApi.nowText ? dataApi.nowText() : '',
                        uploadedBy: '用户名'
                    };
                };
                reader.readAsDataURL(file);
            }

            function parseDeposit(values) {
                if (values.depositpaid !== '是' && values.depositpaid !== '否') {
                    ElMessage.error('请选择保证金是否缴纳');
                    return false;
                }
                if (values.depositpaid === '是' && !(values.depositvoucher && values.depositvoucher.data)) {
                    ElMessage.error('请上传保证金缴纳凭证');
                    return false;
                }
                return {
                    depositPaid: values.depositpaid === '是',
                    depositVoucher: values.depositpaid === '是' ? values.depositvoucher : null
                };
            }

            function openEdit(row) {
                afterSave = 'edit';
                var store = dataApi.get(row.code) || row;
                var tags = window.BusinessTagPrototypeStore
                    ? window.BusinessTagPrototypeStore.getBinding('RBT_STORE', store.code)
                    : [];
                var quota = dataApi.quotaOf(store);
                editDialog.value && editDialog.value.showEdit(Object.assign({}, store, {
                    archiveCode: store.archiveCode || '',
                    status: store.enabled === false ? '禁用' : '启用',
                    storeTags: tags,
                    storequota: quota.total > 0 ? String(quota.total) : '',
                    demandlimit: String(dataApi.demandLimitOf(store)),
                    depositpaid: store.depositPaid === true ? '是' : store.depositPaid === false ? '否' : '',
                    depositvoucher: store.depositPaid === true && store.depositVoucher && store.depositVoucher.data ? store.depositVoucher : null
                }));
            }

            function openTags() {
                if (window.BusinessTagPrototypeUI && typeof window.BusinessTagPrototypeUI.openManager === 'function') {
                    window.BusinessTagPrototypeUI.openManager('RBT_STORE', '门店标签库');
                }
            }

            function openBatch(mode, rows) {
                batchCodes = (rows || []).map(function (row) { return row.code; }).filter(Boolean);
                if (!batchCodes.length) {
                    ElMessage.error('请先勾选门店');
                    return;
                }
                batchMode = mode === 'remove' ? 'remove' : 'add';
                batchTitle.value = batchMode === 'remove' ? '移出标签' : '添加标签';
                batchSuccessText.value = batchMode === 'remove' ? '已移出标签' : '已添加标签';
                batchDialog.value && batchDialog.value.showEdit();
            }

            function beforeSubmitBatch(values) {
                var picked = values.storeTags || [];
                if (!picked.length) {
                    ElMessage.error('请选择RBT标签');
                    return false;
                }
                return values;
            }

            function tagNames(ids) {
                var tags = window.BusinessTagPrototypeStore.listTags('RBT_STORE', true) || [];
                var names = (ids || []).map(function (id) {
                    var found = null;
                    tags.some(function (tag) {
                        if (tag.id === id) {
                            found = tag;
                            return true;
                        }
                        return false;
                    });
                    return found ? found.name : id;
                });
                return names.length ? names.join('、') : '无';
            }

            function sameTagIds(left, right) {
                return (left || []).slice().sort().join('\n') === (right || []).slice().sort().join('\n');
            }

            function logTagChange(code, before, after) {
                if (!dataApi || typeof dataApi.appendLog !== 'function' || sameTagIds(before, after)) return;
                dataApi.appendLog(code, 'RBT标签：' + tagNames(before) + ' → ' + tagNames(after));
            }

            function applyBatchTags(values) {
                var api = window.BusinessTagPrototypeStore;
                var picked = values.storeTags || [];
                batchCodes.forEach(function (code) {
                    var current = api.getBinding('RBT_STORE', code);
                    var next = batchMode === 'remove'
                        ? current.filter(function (id) { return picked.indexOf(id) < 0; })
                        : current.concat(picked.filter(function (id) { return current.indexOf(id) < 0; }));
                    api.saveBinding('RBT_STORE', code, next);
                    logTagChange(code, current, next);
                });
            }

            function beforeSubmitAdd(values) {
                if (!values.archiveCode) {
                    ElMessage.error('请选择门店');
                    return false;
                }
                if (!values.rbtLevel) {
                    ElMessage.error('请选择RBT等级');
                    return false;
                }
                if (values.status !== '启用' && values.status !== '禁用') {
                    ElMessage.error('请选择状态');
                    return false;
                }
                var amount = parseQuota(values);
                if (amount === false) return false;
                var demandLimit = parseDemandLimit(values);
                if (demandLimit === false) return false;
                var deposit = parseDeposit(values);
                if (deposit === false) return false;
                return Object.assign({}, values, { storequota: amount, demandlimit: demandLimit }, deposit);
            }

            function beforeSubmitEdit(values) {
                if (!values.rbtLevel) {
                    ElMessage.error('请选择RBT等级');
                    return false;
                }
                if (values.status !== '启用' && values.status !== '禁用') {
                    ElMessage.error('请选择状态');
                    return false;
                }
                var amount = parseQuota(values);
                if (amount === false) return false;
                var demandLimit = parseDemandLimit(values);
                if (demandLimit === false) return false;
                var deposit = parseDeposit(values);
                if (deposit === false) return false;
                return Object.assign({}, values, { storequota: amount, demandlimit: demandLimit }, deposit);
            }

            function addStore(values) {
                var created = dataApi.addFromArchive(Object.assign({}, values, {
                    storeQuota: values.storequota,
                    demandLimit: values.demandlimit,
                    depositPaid: values.depositPaid,
                    depositVoucher: values.depositVoucher
                }));
                if (!created || created.duplicate) {
                    ElMessage.error(created && created.duplicate ? '该门店已在准入列表中' : '请选择门店档案中的门店');
                    throw { __handledByPage: true };
                }
                var tagIds = values.storeTags || [];
                if (tagIds.length && window.BusinessTagPrototypeStore) {
                    window.BusinessTagPrototypeStore.saveBinding('RBT_STORE', created.code, tagIds);
                    logTagChange(created.code, [], tagIds);
                }
                return created;
            }

            function updateStore(values) {
                var beforeTags = window.BusinessTagPrototypeStore
                    ? window.BusinessTagPrototypeStore.getBinding('RBT_STORE', values.code)
                    : [];
                var updated = dataApi.update({
                    code: values.code,
                    rbtLevel: values.rbtLevel,
                    enabled: values.status !== '禁用',
                    storeQuota: values.storequota,
                    demandLimit: values.demandlimit,
                    depositPaid: values.depositPaid,
                    depositVoucher: values.depositVoucher
                });
                if (window.BusinessTagPrototypeStore) {
                    var nextTags = values.storeTags || [];
                    window.BusinessTagPrototypeStore.saveBinding('RBT_STORE', values.code, nextTags);
                    logTagChange(values.code, beforeTags, nextTags);
                }
                return updated;
            }

            function toggleEnabled(row) {
                var enabled = row.enabled === false;
                dataApi.update({ code: row.code, enabled: enabled });
                ElMessage.success(enabled ? '已启用' : '已禁用');
                table.value && table.value.fetchData();
            }

            function refreshTable() {
                if (!table.value) return;
                if (afterSave === 'edit') table.value.fetchData();
                else table.value.queryData();
            }

            window.addEventListener('business-tags:changed', function () {
                table.value && table.value.fetchData();
            });

            return {
                slots: slots,
                table: table,
                addDialog: addDialog,
                editDialog: editDialog,
                batchDialog: batchDialog,
                batchTitle: batchTitle,
                batchSuccessText: batchSuccessText,
                batchFields: batchFields,
                columns: columns,
                addFields: addFields,
                editFields: editFields,
                requestRows: requestRows,
                tagsOf: tagsOf,
                occupiedVisible: occupiedVisible,
                occupiedTitle: occupiedTitle,
                occupiedRows: occupiedRows,
                occupiedText: occupiedText,
                canOpenOccupied: canOpenOccupied,
                openOccupied: openOccupied,
                openDetail: openDetail,
                openAdd: openAdd,
                openEdit: openEdit,
                toggleEnabled: toggleEnabled,
                openTags: openTags,
                openBatch: openBatch,
                beforeSubmitBatch: beforeSubmitBatch,
                applyBatchTags: applyBatchTags,
                beforeSubmitAdd: beforeSubmitAdd,
                beforeSubmitEdit: beforeSubmitEdit,
                addStore: addStore,
                updateStore: updateStore,
                onQuotaInput: onQuotaInput,
                onDemandLimitInput: onDemandLimitInput,
                depositFileText: depositFileText,
                onDepositFile: onDepositFile,
                refreshTable: refreshTable
            };
        }
    }, '#rbtStoreApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
