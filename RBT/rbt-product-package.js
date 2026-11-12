/* RBT 商品包：按编码、名称、商品标签查询，可新增商品包、勾选后批量添加或移出标签。 */
(function () {
    var Vue = OctopusPrototype.Vue;
    var ref = Vue.ref;
    var ElMessage = OctopusPrototype.ElementPlus.ElMessage;
    var KEY = 'rbt_product_package_v1';
    var TAG_TYPE = 'PRODUCT_PACKAGE';
    /* 条码、单位、采购价与供货关系一致；规格从商品名称拆出。类目沿用商品模块已有类目。售价在加入商品包后手填。 */
    var SKUS = [
        { code: 'SKU10001', name: '库尔勒香梨 4kg', barcode: '6901234567001', unit: '箱', spec: '4kg', category: '时令水果', purchasePrice: 42.5 },
        { code: 'SKU10002', name: '精品黄瓜 2kg', barcode: '6901234567002', unit: '箱', spec: '2kg', category: '新鲜蔬菜', purchasePrice: 16.8 },
        { code: 'SKU10003', name: '冷鲜牛腩 1kg', barcode: '6901234567003', unit: '件', spec: '1kg', category: '肉禽蛋品', purchasePrice: 58 },
        { code: 'SKU10004', name: '山东土豆 5kg', barcode: '6901234567004', unit: '袋', spec: '5kg', category: '新鲜蔬菜', purchasePrice: 21.6 },
        { code: 'SKU10005', name: '云南小番茄 1kg', barcode: '6901234567005', unit: '箱', spec: '1kg', category: '时令水果', purchasePrice: 13.2 },
        { code: 'SKU10006', name: '新西兰奇异果 12粒', barcode: '6901234567006', unit: '盒', spec: '12粒', category: '时令水果', purchasePrice: 36.9 },
        { code: 'SKU10007', name: '冷冻鸡中翅 2kg', barcode: '6901234567007', unit: '袋', spec: '2kg', category: '肉禽蛋品', purchasePrice: 47 },
        { code: 'SKU10008', name: '江西紫薯 3kg', barcode: '6901234567008', unit: '箱', spec: '3kg', category: '新鲜蔬菜', purchasePrice: 19.9 },
        { code: 'SKU10009', name: '东北黑木耳 500g', barcode: '6901234567009', unit: '袋', spec: '500g', category: '粮油调味', purchasePrice: 29.5 },
        { code: 'SKU10010', name: '福建空心菜 400g', barcode: '6901234567010', unit: '把', spec: '400g', category: '新鲜蔬菜', purchasePrice: 6.8 },
        { code: 'SKU10011', name: '冷鲜猪里脊 1kg', barcode: '6901234567011', unit: '件', spec: '1kg', category: '肉禽蛋品', purchasePrice: 39.8 },
        { code: 'SKU10012', name: '海南贝贝南瓜 2kg', barcode: '6901234567012', unit: '箱', spec: '2kg', category: '新鲜蔬菜', purchasePrice: 18.4 }
    ];
    var CATEGORIES = ['新鲜蔬菜', '时令水果', '粮油调味', '肉禽蛋品'];
    /* 旧数据按事业线挂商品包。转成门店时，挂到该事业线下的全部门店。 */
    var BIZ_LINE_STORES = {
        '餐饮': ['ONS00001', 'ONS00004'],
        '康美': ['ONS00002'],
        '纯私域': ['ONS00003'],
        '集团内部': ['ONS00005']
    };
    var SEED_STORES = {
        SPB00001: ['ONS00001', 'ONS00004'],
        SPB00002: ['ONS00002'],
        SPB00003: ['ONS00003']
    };
    /* 旧数据只存了商品编码。这几条是已保存的演示售价，新加入的商品不套用。 */
    var LEGACY_SALE = {
        SKU10001: '56.80',
        SKU10002: '22.80',
        SKU10003: '78.00',
        SKU10004: '28.90',
        SKU10005: '18.50',
        SKU10006: '49.90',
        SKU10007: '62.00',
        SKU10008: '26.80',
        SKU10009: '39.90',
        SKU10010: '9.90',
        SKU10011: '52.80',
        SKU10012: '24.90'
    };

    function blank(value) {
        return value === undefined || value === null || String(value).trim() === '';
    }

    function includesText(source, query) {
        if (blank(query)) return true;
        return String(source || '').toLowerCase().indexOf(String(query).trim().toLowerCase()) >= 0;
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function nowText() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function seed() {
        return [
            { code: 'SPB00001', name: '周末生鲜包', storeCodes: ['ONS00001', 'ONS00004'], skus: [{ code: 'SKU10001', salePrice: '56.80' }, { code: 'SKU10002', salePrice: '22.80' }], creator: '王丽', createdAt: '2026-08-02 10:12:00', updater: '王丽', updatedAt: '2026-08-12 09:20:00' },
            { code: 'SPB00002', name: '肉类组合包', storeCodes: ['ONS00002'], skus: [{ code: 'SKU10003', salePrice: '78.00' }, { code: 'SKU10011', salePrice: '52.80' }], creator: '张宁', createdAt: '2026-08-04 14:30:00', updater: '张宁', updatedAt: '2026-08-14 16:05:00' },
            { code: 'SPB00003', name: '果蔬尝鲜包', storeCodes: ['ONS00003'], skus: [{ code: 'SKU10005', salePrice: '18.50' }, { code: 'SKU10006', salePrice: '49.90' }, { code: 'SKU10010', salePrice: '9.90' }], creator: '李萌', createdAt: '2026-08-06 11:08:00', updater: '李萌', updatedAt: '2026-08-16 13:40:00' }
        ];
    }

    function read() {
        try {
            var raw = sessionStorage.getItem(KEY);
            var list = raw ? JSON.parse(raw) : null;
            if (!Array.isArray(list) || !list.length) {
                list = seed();
                sessionStorage.setItem(KEY, JSON.stringify(list));
            }
            var changed = false;
            list.forEach(function (item) {
                if (ensureStores(item)) changed = true;
                if (ensureLogs(item)) changed = true;
            });
            if (changed) sessionStorage.setItem(KEY, JSON.stringify(list));
            return list;
        } catch (e) {
            return seed();
        }
    }

    function write(list) {
        sessionStorage.setItem(KEY, JSON.stringify(list));
    }

    function nextCode(items) {
        var max = 0;
        items.forEach(function (item) {
            var matched = String(item.code || '').match(/^SPB(\d+)$/);
            if (matched) max = Math.max(max, parseInt(matched[1], 10));
        });
        return 'SPB' + String(max + 1).padStart(5, '0');
    }

    function findSku(code) {
        var found = null;
        SKUS.some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function money(value) {
        var amount = Number(value);
        if (!isFinite(amount)) return '—';
        return amount.toFixed(2);
    }

    function normalizeSku(item) {
        if (typeof item === 'string') return { code: item, salePrice: LEGACY_SALE[item] || '' };
        var price = item && item.salePrice;
        return { code: item && item.code, salePrice: price == null || price === '' ? '' : String(price) };
    }

    function normalizeSkus(list) {
        return (list || []).map(normalizeSku).filter(function (item) { return item.code; });
    }

    function validSale(value) {
        if (blank(value)) return false;
        var amount = Number(String(value).trim());
        return isFinite(amount) && amount > 0;
    }

    function skuView(line) {
        var code = line && line.code;
        var found = findSku(code);
        var sale = line && line.salePrice;
        return {
            code: code || '—',
            name: found ? found.name : '—',
            barcode: found ? found.barcode : '—',
            unit: found ? found.unit : '—',
            spec: found ? found.spec : '—',
            purchasePrice: found ? money(found.purchasePrice) : '—',
            salePrice: validSale(sale) ? money(sale) : '—',
            image: found && typeof getWmsSkuImage === 'function' ? getWmsSkuImage(found.code) : ''
        };
    }

    function admitStores() {
        var api = window.RbtStoreData;
        if (!api || typeof api.list !== 'function') return [];
        return api.list() || [];
    }

    function codesFromBizLine(line) {
        var matched = admitStores().filter(function (store) {
            return store && store.bizLine === line && store.code;
        }).map(function (store) { return store.code; });
        if (matched.length) return matched;
        return (BIZ_LINE_STORES[line] || []).slice();
    }

    /* 没有门店数组时，把旧的事业线转成该事业线下的门店。已经保存过的门店多选不再改写。 */
    function ensureStores(item) {
        if (!item) return false;
        if (Array.isArray(item.storeCodes)) {
            if (!item.bizLine) return false;
            delete item.bizLine;
            return true;
        }
        item.storeCodes = item.bizLine
            ? codesFromBizLine(item.bizLine)
            : (SEED_STORES[item.code] || []).slice();
        delete item.bizLine;
        return true;
    }

    function storeName(code) {
        var name = '';
        admitStores().some(function (store) {
            if (store && store.code === code) {
                name = store.name || code;
                return true;
            }
            return false;
        });
        return name || code || '';
    }

    function pushLog(item, content, operator, time) {
        if (!item || !content) return;
        if (!Array.isArray(item.logs)) item.logs = [];
        item.logs.unshift({
            time: time || nowText(),
            operator: operator || '用户名',
            content: content
        });
    }

    /* 旧数据没有操作记录时，补一条新增记录。之后的变更只追加真实差异。 */
    function ensureLogs(item) {
        if (!item || Array.isArray(item.logs)) return false;
        item.logs = [{
            time: item.createdAt || item.updatedAt || '',
            operator: item.creator || '用户名',
            content: '新增商品包'
        }];
        return true;
    }

    function storeText(row) {
        var codes = row && Array.isArray(row.storeCodes) ? row.storeCodes : [];
        if (!codes.length) return '—';
        return codes.map(storeName).filter(Boolean).join('、');
    }

    function storeChoices() {
        return admitStores().filter(function (store) { return store && store.code; }).map(function (store) {
            var name = store.name || store.code;
            return { label: name + '（' + store.code + '）', value: store.code };
        });
    }

    function skuText(row) {
        var lines = normalizeSkus(row.skus);
        if (!lines.length) return '—';
        return lines.map(function (line) {
            var found = findSku(line.code);
            return found ? found.code + ' ' + found.name : line.code;
        }).join('、');
    }

    function storeLogText(codes) {
        var text = storeText({ storeCodes: codes || [] });
        return text === '—' ? '无' : text;
    }

    function sameCodes(left, right) {
        return (left || []).slice().sort().join('\n') === (right || []).slice().sort().join('\n');
    }

    function skuLogText(lines) {
        var normalized = normalizeSkus(lines);
        if (!normalized.length) return '无';
        return normalized.map(function (line) {
            var found = findSku(line.code);
            var price = validSale(line.salePrice) ? Number(line.salePrice).toFixed(2) : '无售价';
            return line.code + ' ' + (found ? found.name : line.code) + ' ¥' + price;
        }).join('、');
    }

    function tagNames(ids) {
        var store = window.BusinessTagPrototypeStore;
        var tags = store ? store.listTags(TAG_TYPE, true) || [] : [];
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

    function findPackage(code) {
        var found = null;
        read().some(function (item) {
            if (item && item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function appendLog(code, content, operator) {
        var items = read();
        var target = null;
        items.some(function (item) {
            if (item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target || !content) return null;
        ensureLogs(target);
        var changedAt = nowText();
        var who = operator || '用户名';
        target.updater = who;
        target.updatedAt = changedAt;
        pushLog(target, content, who, changedAt);
        write(items);
        return target;
    }

    function tagOptions() {
        var store = window.BusinessTagPrototypeStore;
        if (!store) return [];
        return (store.listTags(TAG_TYPE, false) || []).map(function (tag) {
            return { label: tag.name, value: tag.id };
        });
    }

    function tagsOf(row) {
        var store = window.BusinessTagPrototypeStore;
        if (!store || !row) return [];
        return store.tagsFor(TAG_TYPE, row.code) || [];
    }

    var packageTagOptions = tagOptions();

    window.RbtPackageData = { get: findPackage };
    OctopusPrototype.mount({
        setup: function () {
            var reactive = Vue.reactive;
            var nextTick = Vue.nextTick;
            var table = ref(null);
            var addDialog = ref(null);
            var batchDialog = ref(null);
            var batchTitle = ref('添加标签');
            var batchSuccessText = ref('已添加标签');
            var batchMode = 'add';
            var batchCodes = [];
            var dialogTitle = ref('新增商品包');
            var pickerOpen = ref(false);
            var pickerTable = ref(null);
            var pickerRows = ref([]);
            var pickerSelection = ref([]);
            var pickerQuery = reactive({ code: '', name: '', category: '' });
            var pickerForm = null;
            var afterSave = 'add';
            var slots = { code: 'cell-code', tags: 'cell-packageTags', status: 'cell-enabled' };
            var storeOptions = storeChoices();
            var statusOptions = [{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }];
            var columns = [
                { dataIndex: 'code', title: '商品包编码', minWidth: 140, search: { control: 'input' } },
                { dataIndex: 'name', title: '商品包名称', minWidth: 180, align: 'left', showOverflowTooltip: true, search: { control: 'input' } },
                { dataIndex: 'storeQuery', title: '门店', hideInTable: true, search: { control: 'select', options: storeOptions, placeholder: '请选择' } },
                { dataIndex: 'statusQuery', title: '状态', hideInTable: true, search: { control: 'select', options: statusOptions, placeholder: '请选择' } },
                { dataIndex: 'storeText', title: '门店', minWidth: 220, align: 'left', showOverflowTooltip: true, formatter: storeText },
                { dataIndex: 'enabled', title: '状态', width: 100 },
                { dataIndex: 'tagQuery', title: '商品标签', hideInTable: true, search: { control: 'select', options: packageTagOptions, placeholder: '请选择' } },
                { dataIndex: 'packageTags', title: '商品包标签', minWidth: 180, align: 'left' },
                { dataIndex: 'skuText', title: '包含SKU', minWidth: 280, align: 'left', showOverflowTooltip: true, formatter: skuText },
                { dataIndex: 'creator', title: '创建人', minWidth: 100 },
                { dataIndex: 'createdAt', title: '创建时间', minWidth: 170 },
                { dataIndex: 'updater', title: '更新人', minWidth: 100 },
                { dataIndex: 'updatedAt', title: '更新时间', minWidth: 170 }
            ];
            var addFields = [
                { field: 'name', label: '商品包名称', required: true, placeholder: '请输入商品包名称' },
                { field: 'storeCodes', label: '门店', control: 'select', multiple: true, required: true, defaultValue: [], options: storeOptions, placeholder: '请选择门店' },
                { field: 'status', label: '状态', control: 'select', required: true, defaultValue: '启用', options: [{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }], placeholder: '请选择' },
                { field: 'packageTags', label: '商品包标签', control: 'select', multiple: true, defaultValue: [], options: packageTagOptions, placeholder: '可不选' },
                { field: 'skus', label: '包含SKU', control: 'slot', defaultValue: [] }
            ];
            var batchFields = [
                { field: 'packageTags', label: '商品包标签', control: 'select', multiple: true, required: true, defaultValue: [], options: packageTagOptions, placeholder: '请选择标签' }
            ];

            function requestRows(params) {
                var matched = read().filter(function (row) {
                    if (!includesText(row.code, params.code)) return false;
                    if (!includesText(row.name, params.name)) return false;
                    if (!blank(params.storeQuery)) {
                        var codes = Array.isArray(row.storeCodes) ? row.storeCodes : [];
                        if (codes.indexOf(params.storeQuery) < 0) return false;
                    }
                    if (!blank(params.statusQuery)) {
                        var status = row.enabled === false ? '禁用' : '启用';
                        if (status !== params.statusQuery) return false;
                    }
                    if (!blank(params.tagQuery)) {
                        var bound = (window.BusinessTagPrototypeStore.getBinding(TAG_TYPE, row.code) || []);
                        if (bound.indexOf(params.tagQuery) < 0) return false;
                    }
                    return true;
                });
                var pageNum = Number(params.pageNum) || 1;
                var pageSize = Number(params.pageSize) || 20;
                var start = (pageNum - 1) * pageSize;
                return Promise.resolve({ list: matched.slice(start, start + pageSize), total: matched.length });
            }

            function syncTagOptions() {
                var next = tagOptions();
                packageTagOptions.splice(0, packageTagOptions.length);
                next.forEach(function (item) { packageTagOptions.push(item); });
            }

            function skuItems(row) {
                return normalizeSkus(row.skus).map(skuView);
            }

            function skuOf(code) {
                return findSku(code) || { code: code, name: '—', barcode: '—', unit: '—', spec: '—', purchasePrice: null };
            }

            function skuImage(code) {
                return typeof getWmsSkuImage === 'function' ? getWmsSkuImage(code) : '';
            }

            function removeSku(form, code) {
                if (!form || !Array.isArray(form.skus)) return;
                form.skus = form.skus.filter(function (item) { return item.code !== code; });
            }

            function searchSkus() {
                var used = {};
                normalizeSkus(pickerForm && pickerForm.skus).forEach(function (line) { used[line.code] = true; });
                pickerSelection.value = [];
                pickerRows.value = SKUS.filter(function (item) {
                    if (used[item.code]) return false;
                    if (!includesText(item.code, pickerQuery.code)) return false;
                    if (!includesText(item.name, pickerQuery.name)) return false;
                    if (!blank(pickerQuery.category) && item.category !== pickerQuery.category) return false;
                    return true;
                });
                nextTick(function () {
                    pickerTable.value && pickerTable.value.clearSelection();
                });
            }

            function resetSkuSearch() {
                pickerQuery.code = '';
                pickerQuery.name = '';
                pickerQuery.category = '';
                searchSkus();
            }

            function openSkuPicker(form) {
                pickerForm = form;
                if (!Array.isArray(form.skus)) form.skus = [];
                resetSkuSearch();
                pickerOpen.value = true;
            }

            function onSkuPick(rows) {
                pickerSelection.value = rows || [];
            }

            function confirmAddSkus() {
                var selected = pickerSelection.value || [];
                if (!selected.length) {
                    ElMessage.warning('请勾选商品');
                    return;
                }
                if (!pickerForm) return;
                if (!Array.isArray(pickerForm.skus)) pickerForm.skus = [];
                var exists = {};
                pickerForm.skus.forEach(function (line) { exists[line.code] = true; });
                selected.forEach(function (item) {
                    if (exists[item.code]) return;
                    pickerForm.skus.push({ code: item.code, salePrice: '' });
                });
                pickerOpen.value = false;
            }

            function openDetail(row) {
                var current = null;
                read().some(function (item) {
                    if (item.code === row.code) {
                        current = item;
                        return true;
                    }
                    return false;
                });
                current = current || row;
                if (window.RbtPackageDetail) {
                    window.RbtPackageDetail.open(Object.assign({}, current, {
                        skuItems: skuItems(current),
                        storeText: storeText(current)
                    }));
                }
            }

            function openAdd() {
                afterSave = 'add';
                dialogTitle.value = '新增商品包';
                pickerOpen.value = false;
                syncTagOptions();
                addDialog.value && addDialog.value.showEdit();
            }

            function openEdit(row) {
                afterSave = 'edit';
                dialogTitle.value = '编辑商品包';
                pickerOpen.value = false;
                syncTagOptions();
                var tags = window.BusinessTagPrototypeStore
                    ? window.BusinessTagPrototypeStore.getBinding(TAG_TYPE, row.code)
                    : [];
                addDialog.value && addDialog.value.showEdit({
                    code: row.code,
                    name: row.name,
                    storeCodes: Array.isArray(row.storeCodes) ? row.storeCodes.slice() : [],
                    status: row.enabled === false ? '禁用' : '启用',
                    packageTags: tags,
                    skus: normalizeSkus(row.skus)
                });
            }

            function openBatch(mode, rows) {
                batchCodes = (rows || []).map(function (row) { return row.code; }).filter(Boolean);
                if (!batchCodes.length) {
                    ElMessage.error('请先勾选商品包');
                    return;
                }
                batchMode = mode === 'remove' ? 'remove' : 'add';
                batchTitle.value = batchMode === 'remove' ? '移出标签' : '添加标签';
                batchSuccessText.value = batchMode === 'remove' ? '已移出标签' : '已添加标签';
                syncTagOptions();
                batchDialog.value && batchDialog.value.showEdit();
            }

            function beforeSubmitBatch(values) {
                var picked = values.packageTags || [];
                if (!picked.length) {
                    ElMessage.error('请选择商品包标签');
                    return false;
                }
                return values;
            }

            function applyBatchTags(values) {
                var api = window.BusinessTagPrototypeStore;
                if (!api) return null;
                var picked = values.packageTags || [];
                batchCodes.forEach(function (code) {
                    var current = api.getBinding(TAG_TYPE, code);
                    var next = batchMode === 'remove'
                        ? current.filter(function (id) { return picked.indexOf(id) < 0; })
                        : current.concat(picked.filter(function (id) { return current.indexOf(id) < 0; }));
                    if (sameCodes(current, next)) return;
                    api.saveBinding(TAG_TYPE, code, next);
                    appendLog(code, '商品包标签：' + tagNames(current) + ' → ' + tagNames(next));
                });
                return true;
            }

            function refreshAfterBatch() {
                table.value && table.value.fetchData();
            }

            function openTags() {
                if (window.BusinessTagPrototypeUI) {
                    window.BusinessTagPrototypeUI.openManager(TAG_TYPE, '商品包标签库');
                }
            }

            function beforeSubmit(values) {
                if (blank(values.name)) {
                    ElMessage.error('请输入商品包名称');
                    return false;
                }
                var storeCodes = Array.isArray(values.storeCodes) ? values.storeCodes.filter(Boolean) : [];
                if (!storeCodes.length) {
                    ElMessage.error('请选择门店');
                    return false;
                }
                values.storeCodes = storeCodes;
                if (values.status !== '启用' && values.status !== '禁用') {
                    ElMessage.error('请选择状态');
                    return false;
                }
                var lines = normalizeSkus(values.skus);
                if (lines.some(function (line) { return !validSale(line.salePrice); })) {
                    ElMessage.error('请填写售价');
                    return false;
                }
                values.skus = lines.map(function (line) {
                    return { code: line.code, salePrice: Number(line.salePrice).toFixed(2) };
                });
                return values;
            }

            function addPackage(values) {
                var items = read();
                var createdAt = nowText();
                var created = {
                    code: nextCode(items),
                    name: String(values.name || '').trim(),
                    storeCodes: (values.storeCodes || []).slice(),
                    skus: values.skus || [],
                    enabled: values.status !== '禁用',
                    creator: '用户名',
                    createdAt: createdAt,
                    updater: '用户名',
                    updatedAt: createdAt
                };
                pushLog(created, '新增商品包', '用户名', createdAt);
                items.unshift(created);
                write(items);
                var tagIds = values.packageTags || [];
                if (window.BusinessTagPrototypeStore) {
                    window.BusinessTagPrototypeStore.saveBinding(TAG_TYPE, created.code, tagIds);
                }
                if (tagIds.length) appendLog(created.code, '商品包标签：无 → ' + tagNames(tagIds));
                return created;
            }

            function updatePackage(values) {
                var items = read();
                var target = null;
                items.some(function (item) {
                    if (item.code === values.code) {
                        target = item;
                        return true;
                    }
                    return false;
                });
                if (!target) return null;
                ensureLogs(target);
                var changes = [];
                var nextName = String(values.name || '').trim();
                if (nextName !== String(target.name || '').trim()) {
                    changes.push('商品包名称：' + (target.name || '无') + ' → ' + (nextName || '无'));
                    target.name = nextName;
                }
                var nextStores = (values.storeCodes || []).slice();
                if (!sameCodes(target.storeCodes, nextStores)) {
                    changes.push('门店：' + storeLogText(target.storeCodes) + ' → ' + storeLogText(nextStores));
                    target.storeCodes = nextStores;
                }
                var nextEnabled = values.status !== '禁用';
                if ((target.enabled === false) !== (nextEnabled === false)) {
                    changes.push('状态：' + (target.enabled === false ? '禁用' : '启用') + ' → ' + (nextEnabled ? '启用' : '禁用'));
                    target.enabled = nextEnabled;
                }
                var nextSkus = values.skus || [];
                if (skuLogText(target.skus) !== skuLogText(nextSkus)) {
                    changes.push('包含SKU：' + skuLogText(target.skus) + ' → ' + skuLogText(nextSkus));
                    target.skus = nextSkus;
                }
                delete target.bizLine;
                var beforeTags = window.BusinessTagPrototypeStore
                    ? window.BusinessTagPrototypeStore.getBinding(TAG_TYPE, values.code)
                    : [];
                var nextTags = values.packageTags || [];
                var tagChanged = !sameCodes(beforeTags, nextTags);
                if (changes.length) {
                    var changedAt = nowText();
                    target.updater = '用户名';
                    target.updatedAt = changedAt;
                    pushLog(target, changes.join('；'), '用户名', changedAt);
                    write(items);
                }
                if (window.BusinessTagPrototypeStore && tagChanged) {
                    window.BusinessTagPrototypeStore.saveBinding(TAG_TYPE, values.code, nextTags);
                    appendLog(values.code, '商品包标签：' + tagNames(beforeTags) + ' → ' + tagNames(nextTags));
                }
                return target;
            }

            function toggleEnabled(row) {
                var items = read();
                var target = null;
                items.some(function (item) {
                    if (item.code === row.code) {
                        target = item;
                        return true;
                    }
                    return false;
                });
                if (!target) return;
                ensureLogs(target);
                var enabled = target.enabled === false;
                var changedAt = nowText();
                target.enabled = enabled;
                target.updater = '用户名';
                target.updatedAt = changedAt;
                pushLog(target, '状态：' + (enabled ? '禁用 → 启用' : '启用 → 禁用'), '用户名', changedAt);
                write(items);
                ElMessage.success(enabled ? '已启用' : '已禁用');
                table.value && table.value.fetchData();
            }

            function refreshTable() {
                if (!table.value) return;
                if (afterSave === 'edit') table.value.fetchData();
                else table.value.queryData();
            }

            window.addEventListener('business-tags:changed', function () {
                syncTagOptions();
                table.value && table.value.fetchData();
            });

            return {
                slots: slots,
                table: table,
                addDialog: addDialog,
                batchDialog: batchDialog,
                batchTitle: batchTitle,
                batchSuccessText: batchSuccessText,
                batchFields: batchFields,
                dialogTitle: dialogTitle,
                pickerOpen: pickerOpen,
                pickerTable: pickerTable,
                pickerQuery: pickerQuery,
                pickerRows: pickerRows,
                categoryOptions: CATEGORIES,
                columns: columns,
                addFields: addFields,
                requestRows: requestRows,
                tagsOf: tagsOf,
                skuOf: skuOf,
                skuImage: skuImage,
                money: money,
                removeSku: removeSku,
                openSkuPicker: openSkuPicker,
                searchSkus: searchSkus,
                resetSkuSearch: resetSkuSearch,
                onSkuPick: onSkuPick,
                confirmAddSkus: confirmAddSkus,
                openDetail: openDetail,
                openAdd: openAdd,
                openEdit: openEdit,
                toggleEnabled: toggleEnabled,
                openBatch: openBatch,
                beforeSubmitBatch: beforeSubmitBatch,
                applyBatchTags: applyBatchTags,
                refreshAfterBatch: refreshAfterBatch,
                openTags: openTags,
                beforeSubmit: beforeSubmit,
                addPackage: addPackage,
                updatePackage: updatePackage,
                refreshTable: refreshTable
            };
        }
    }, '#rbtPackageApp', {
        services: {},
        warehouse: { warehouseId: 'demo', warehouseCode: 'DEMO', warehouseName: '演示仓库' },
        permissions: [],
        layoutDensity: 'default'
    });
})();
