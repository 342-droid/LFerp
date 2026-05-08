/**
 * MDM — 资源档案 / 人员 / 会员 / 审核 等列表的 PageManager 启动脚本
 */
(function () {
    function openArchiveOnboardingFromRow(tr, kind) {
        if (
            !window.MdmUnifiedOnboardingUi ||
            typeof window.MdmUnifiedOnboardingUi.openModal !== 'function'
        ) {
            showToast('进件模块未加载，请刷新页面重试', 'error');
            return;
        }
        var c = tr.querySelectorAll('td');
        var shortName = c[2] ? c[2].textContent.trim() : '';
        var title = '支付进件';
        if (kind === 'store') title = '门店进件';
        else if (kind === 'supplier') title = '供应商进件';
        else if (kind === 'liveRoom') title = '直播间进件';
        else if (kind === 'carrier') title = '承运商进件';
        window.MdmUnifiedOnboardingUi.openModal({
            title: title,
            merchantShortNameDefault: shortName,
            variant: 'resource'
        });
    }

    function bindSimpleFilter(pm, ids) {
        var resetId = ids.reset || 'btnFilterReset';
        var queryId = ids.query || 'btnFilterQuery';
        document.getElementById(resetId) &&
            document.getElementById(resetId).addEventListener('click', function () {
                (ids.resetFields || []).forEach(function (fid) {
                    var el = document.getElementById(fid);
                    if (el) el.value = '';
                });
                if (ids.filterFn) ids.filterFn(pm);
            });
        document.getElementById(queryId) &&
            document.getElementById(queryId).addEventListener('click', function () {
                if (ids.filterFn) ids.filterFn(pm);
            });
    }

    function storeArchiveFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qSub = (document.getElementById('qSubjectName') || {}).value.trim();
        var qStore = (document.getElementById('qStoreName') || {}).value.trim();
        var qSt = (document.getElementById('qStoreStatus') || {}).value.trim();
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 21) return;
            var sub = cells[1].textContent.trim();
            var sn = cells[2].textContent.trim();
            var stSpan = cells[18].querySelector('.status');
            var stTxt = stSpan ? stSpan.textContent.trim() : '';
            var ok = true;
            if (qSub && sub.indexOf(qSub) === -1) ok = false;
            if (qStore && sn.indexOf(qStore) === -1) ok = false;
            if (qSt === 'normal' && stTxt !== '正常') ok = false;
            if (qSt === 'stopped' && stTxt !== '停用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    function resourceArchiveFilter(pm, nameCol, statusCol, map) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qSub = (document.getElementById('qSubjectName') || {}).value.trim();
        var qRes = (document.getElementById('qResourceName') || {}).value.trim();
        var qSt = (document.getElementById('qResStatus') || {}).value.trim();
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < statusCol + 1) return;
            var ok = true;
            if (qSub && cells[1].textContent.trim().indexOf(qSub) === -1) ok = false;
            if (qRes && cells[nameCol].textContent.trim().indexOf(qRes) === -1) ok = false;
            if (map && qSt && map[qSt]) {
                var stTxt = (cells[statusCol].querySelector('.status') || {}).textContent || '';
                stTxt = String(stTxt).trim();
                if (stTxt !== map[qSt]) ok = false;
            }
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    function warehouseArchiveFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qSub = (document.getElementById('qSubjectName') || {}).value.trim();
        var qName = (document.getElementById('qResourceName') || {}).value.trim();
        var qTyp = (document.getElementById('qWhType') || {}).value.trim();
        var qSt = (document.getElementById('qWhStatus') || {}).value.trim();
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 13) return;
            var ok = true;
            if (qSub && cells[1].textContent.trim().indexOf(qSub) === -1) ok = false;
            if (qName && cells[2].textContent.trim().indexOf(qName) === -1) ok = false;
            if (qTyp === 'w' && cells[3].textContent.trim() !== '仓库') ok = false;
            if (qTyp === 's' && cells[3].textContent.trim() !== '门店') ok = false;
            var stTxt = (cells[11].querySelector('.status') || {}).textContent.trim();
            if (qSt === 'on' && stTxt !== '启用') ok = false;
            if (qSt === 'off' && stTxt !== '停用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    function initArchiveStore() {
        var fields = [
            { id: 'storeId', label: '门店ID', type: 'text', editDisabled: true },
            { id: 'subjectName', label: '主体名称', type: 'text', editDisabled: true },
            { id: 'storeName', label: '门店名称', type: 'text', required: true },
            { id: 'contactPerson', label: '联系人', type: 'text', required: true },
            { id: 'phone', label: '手机号码', type: 'text' },
            { id: 'fulfillWarehouse', label: '配送仓库', type: 'text' },
            { id: 'regionText', label: '省市区', type: 'text' },
            { id: 'addressText', label: '详细地址', type: 'text', width: '100%' },
            {
                id: 'storeOpStatus',
                label: '门店状态',
                type: 'select',
                required: true,
                editDisabled: true,
                options: [
                    { value: '正常', text: '正常' },
                    { value: '冻结', text: '冻结' },
                    { value: '停用', text: '停用' }
                ]
            }
        ];
        var pm = new PageManager({
            entityName: '门店档案',
            modalWidth: '720px',
            checkboxColumn: false,
            statusColumnIndex: 18,
            actionColumnMode: 'editOnboard',
            pageSize: 10,
            detailView: { enabled: true, columnIndex: 2, linkClass: 'subject-name-link' },
            fields: fields,
            customRowActions: [
                {
                    selector: '.mdm-onboard-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        openArchiveOnboardingFromRow(el.closest('tr'), 'store');
                    }
                }
            ],
            editModal: {
                modalId: 'mdmArchStoreEdit',
                cancelBtnId: 'mdmArchStoreEditCancelBtn',
                saveBtnId: 'mdmArchStoreEditSaveBtn',
                validations: [
                    { id: 'editStoreName', message: '请输入门店名称', required: true },
                    { id: 'editContactPerson', message: '请输入联系人', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editStoreId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editStoreName: c[2].textContent.trim(),
                        editContactPerson: c[6].textContent.trim(),
                        editPhone: c[7].textContent.trim(),
                        editFulfillWarehouse: c[8].textContent.trim(),
                        editRegionText: c[9].textContent.trim(),
                        editAddressText: c[10].textContent.trim(),
                        editStoreOpStatus: c[18].querySelector('.status')
                            ? c[18].querySelector('.status').textContent.trim()
                            : '正常'
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var st = document.getElementById('editStoreOpStatus').value.trim();
                    pm.updateTableRow(row, {
                        2: document.getElementById('editStoreName').value.trim(),
                        6: document.getElementById('editContactPerson').value.trim(),
                        7: document.getElementById('editPhone').value.trim(),
                        8: document.getElementById('editFulfillWarehouse').value.trim(),
                        9: document.getElementById('editRegionText').value.trim(),
                        10: document.getElementById('editAddressText').value.trim(),
                        18: { value: st, isStatus: true }
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('门店档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, { filterFn: storeArchiveFilter });
        document.getElementById('mdmArchiveStoreAddBtn') &&
            document.getElementById('mdmArchiveStoreAddBtn').addEventListener('click', function () {
                showToast('演示：请在业务侧创建门店后同步至档案', 'info');
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initArchiveSupplier() {
        var fields = [
            { id: 'resId', label: '供应商ID', type: 'text', editDisabled: true },
            { id: 'subjectName', label: '主体名称', type: 'text', editDisabled: true },
            { id: 'resName', label: '供应商名称', type: 'text', required: true },
            { id: 'contactName', label: '负责人姓名', type: 'text', required: true },
            { id: 'phone', label: '手机号码', type: 'text' },
            {
                id: 'resStatus',
                label: '供应商状态',
                type: 'select',
                editDisabled: true,
                options: [
                    { value: '正常', text: '正常' },
                    { value: '冻结', text: '冻结' }
                ]
            }
        ];
        var pm = new PageManager({
            entityName: '供应商档案',
            modalWidth: '640px',
            checkboxColumn: false,
            statusColumnIndex: 14,
            actionColumnMode: 'editOnboard',
            fields: fields,
            detailView: { enabled: true, columnIndex: 2, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-onboard-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        openArchiveOnboardingFromRow(el.closest('tr'), 'supplier');
                    }
                }
            ],
            editModal: {
                modalId: 'mdmArchSupEdit',
                cancelBtnId: 'mdmArchSupEditCancelBtn',
                saveBtnId: 'mdmArchSupEditSaveBtn',
                validations: [
                    { id: 'editResName', message: '请输入供应商名称', required: true },
                    { id: 'editContactName', message: '请输入负责人', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editResId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editResName: c[2].textContent.trim(),
                        editContactName: c[6].textContent.trim(),
                        editPhone: c[7].textContent.trim(),
                        editResStatus: c[14].querySelector('.status')
                            ? c[14].querySelector('.status').textContent.trim()
                            : '正常'
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var st = document.getElementById('editResStatus').value.trim();
                    pm.updateTableRow(row, {
                        2: document.getElementById('editResName').value.trim(),
                        6: document.getElementById('editContactName').value.trim(),
                        7: document.getElementById('editPhone').value.trim(),
                        14: { value: st, isStatus: true }
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('供应商档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qSubjectName', 'qResourceName', 'qResStatus'],
            filterFn: function (p) {
                resourceArchiveFilter(p, 2, 14, { normal: '正常', frozen: '冻结' });
            }
        });
        document.getElementById('mdmArchiveSupAddBtn') &&
            document.getElementById('mdmArchiveSupAddBtn').addEventListener('click', function () {
                showToast('演示：请到资源中心流程新建供应商', 'info');
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initArchiveWarehouse() {
        var fields = [
            { id: 'whCode', label: '仓库编号', type: 'text', editDisabled: true },
            { id: 'subjectName', label: '主体名称', type: 'text', editDisabled: true },
            { id: 'whName', label: '仓库名称', type: 'text', required: true },
            { id: 'whType', label: '仓库类型', type: 'text' },
            { id: 'relatedStore', label: '关联门店', type: 'text' },
            { id: 'adminName', label: '仓库管理员', type: 'text', required: true },
            { id: 'adminPhone', label: '手机号码', type: 'text' }
        ];
        var pm = new PageManager({
            entityName: '仓库档案',
            modalWidth: '640px',
            checkboxColumn: false,
            statusColumnIndex: 11,
            actionColumnMode: 'disableTogglePlusEdit',
            disableToggleVerb: 'enableStop',
            fields: fields,
            detailView: { enabled: true, columnIndex: 2, linkClass: 'subject-name-link' },
            onDisableToggle: function (row, status, page) {
                if (String(status).trim() === '停用') {
                    page.updateTableRow(row, { 11: { value: '启用', isStatus: true } });
                } else if (window.MdmSubjectLf && typeof MdmSubjectLf.showLfWarmConfirm === 'function') {
                    MdmSubjectLf.showLfWarmConfirm('确定将此仓库设为停用？', function () {
                        page.updateTableRow(row, { 11: { value: '停用', isStatus: true } });
                        page.refreshDisableToggleLabel(row);
                    });
                    return;
                } else {
                    page.updateTableRow(row, { 11: { value: '停用', isStatus: true } });
                }
                page.refreshDisableToggleLabel(row);
            },
            editModal: {
                modalId: 'mdmArchWhEdit',
                cancelBtnId: 'mdmArchWhEditCancelBtn',
                saveBtnId: 'mdmArchWhEditSaveBtn',
                validations: [{ id: 'editWhName', message: '请输入仓库名称', required: true }],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editWhCode: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editWhName: c[2].textContent.trim(),
                        editWhType: c[3].textContent.trim(),
                        editRelatedStore: c[4].textContent.trim(),
                        editAdminName: c[5].textContent.trim(),
                        editAdminPhone: c[6].textContent.trim()
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    pm.updateTableRow(row, {
                        2: document.getElementById('editWhName').value.trim(),
                        3: document.getElementById('editWhType').value.trim(),
                        4: document.getElementById('editRelatedStore').value.trim(),
                        5: document.getElementById('editAdminName').value.trim(),
                        6: document.getElementById('editAdminPhone').value.trim()
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('仓库档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qSubjectName', 'qResourceName', 'qWhType', 'qWhStatus'],
            filterFn: warehouseArchiveFilter
        });
        document.getElementById('mdmArchiveWhAddBtn') &&
            document.getElementById('mdmArchiveWhAddBtn').addEventListener('click', function () {
                showToast('演示：请到资源中心新建仓库档案', 'info');
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            document.querySelectorAll('#tableBody tr').forEach(function (tr) {
                pm.refreshDisableToggleLabel(tr);
            });
        }, 0);
    }

    function initArchiveLiveRoom() {
        var fields = [
            { id: 'lrId', label: '直播间ID', type: 'text', editDisabled: true },
            { id: 'subjectName', label: '主体名称', type: 'text', editDisabled: true },
            { id: 'lrName', label: '直播间名称', type: 'text', required: true },
            { id: 'anchorName', label: '主播名称', type: 'text' },
            { id: 'contactName', label: '负责人', type: 'text', required: true },
            { id: 'phone', label: '手机号码', type: 'text' },
            {
                id: 'lrStatus',
                label: '状态',
                type: 'select',
                editDisabled: true,
                options: [
                    { value: '启用', text: '启用' },
                    { value: '停用', text: '停用' }
                ]
            }
        ];
        var pm = new PageManager({
            entityName: '直播间档案',
            modalWidth: '640px',
            checkboxColumn: false,
            statusColumnIndex: 11,
            actionColumnMode: 'editOnboard',
            fields: fields,
            detailView: { enabled: true, columnIndex: 2, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-onboard-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        openArchiveOnboardingFromRow(el.closest('tr'), 'liveRoom');
                    }
                }
            ],
            editModal: {
                modalId: 'mdmArchLiveEdit',
                cancelBtnId: 'mdmArchLiveEditCancelBtn',
                saveBtnId: 'mdmArchLiveEditSaveBtn',
                validations: [
                    { id: 'editLrName', message: '请输入直播间名称', required: true },
                    { id: 'editContactName', message: '请输入负责人', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editLrId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editLrName: c[2].textContent.trim(),
                        editAnchorName: c[5].textContent.trim(),
                        editContactName: c[6].textContent.trim(),
                        editPhone: c[7].textContent.trim(),
                        editLrStatus: c[11].querySelector('.status')
                            ? c[11].querySelector('.status').textContent.trim()
                            : '启用'
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var st = document.getElementById('editLrStatus').value.trim();
                    pm.updateTableRow(row, {
                        2: document.getElementById('editLrName').value.trim(),
                        5: document.getElementById('editAnchorName').value.trim(),
                        6: document.getElementById('editContactName').value.trim(),
                        7: document.getElementById('editPhone').value.trim(),
                        11: { value: st, isStatus: true }
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('直播间档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qSubjectName', 'qResourceName', 'qLiveType'],
            filterFn: function (p) {
                var tbody = document.getElementById(p.config.tableBodyId);
                if (!tbody) return;
                var qSub = (document.getElementById('qSubjectName') || {}).value.trim();
                var qN = (document.getElementById('qResourceName') || {}).value.trim();
                var qT = (document.getElementById('qLiveType') || {}).value.trim();
                tbody.querySelectorAll('tr').forEach(function (tr) {
                    var cells = tr.querySelectorAll('td');
                    if (cells.length < 12) return;
                    var ok = true;
                    if (qSub && cells[1].textContent.trim().indexOf(qSub) === -1) ok = false;
                    if (qN && cells[2].textContent.trim().indexOf(qN) === -1) ok = false;
                    var typ = cells[3].textContent.trim();
                    if (qT === 'official' && typ !== '官方直播') ok = false;
                    if (qT === 'regional' && typ !== '区域直播') ok = false;
                    if (qT === 'targeted' && typ !== '定向直播') ok = false;
                    tr.style.display = ok ? '' : 'none';
                });
                p.refreshPagination();
            }
        });
        document.getElementById('mdmArchiveLiveAddBtn') &&
            document.getElementById('mdmArchiveLiveAddBtn').addEventListener('click', function () {
                showToast('演示：请到资源中心新建直播间', 'info');
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initArchiveCarrier() {
        var fields = [
            { id: 'carId', label: '承运商ID', type: 'text', editDisabled: true },
            { id: 'subjectName', label: '主体名称', type: 'text', editDisabled: true },
            { id: 'carName', label: '承运商名称', type: 'text', required: true },
            { id: 'contactName', label: '负责人姓名', type: 'text', required: true },
            { id: 'phone', label: '手机号码', type: 'text' },
            {
                id: 'carStatus',
                label: '承运商状态',
                type: 'select',
                editDisabled: true,
                options: [
                    { value: '正常', text: '正常' },
                    { value: '冻结', text: '冻结' }
                ]
            }
        ];
        var pm = new PageManager({
            entityName: '承运商档案',
            modalWidth: '640px',
            checkboxColumn: false,
            statusColumnIndex: 14,
            actionColumnMode: 'editOnboard',
            fields: fields,
            detailView: { enabled: true, columnIndex: 2, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-onboard-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        openArchiveOnboardingFromRow(el.closest('tr'), 'carrier');
                    }
                }
            ],
            editModal: {
                modalId: 'mdmArchCarEdit',
                cancelBtnId: 'mdmArchCarEditCancelBtn',
                saveBtnId: 'mdmArchCarEditSaveBtn',
                validations: [
                    { id: 'editCarName', message: '请输入承运商名称', required: true },
                    { id: 'editContactName', message: '请输入负责人', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editCarId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editCarName: c[2].textContent.trim(),
                        editContactName: c[6].textContent.trim(),
                        editPhone: c[7].textContent.trim(),
                        editCarStatus: c[14].querySelector('.status')
                            ? c[14].querySelector('.status').textContent.trim()
                            : '正常'
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var st = document.getElementById('editCarStatus').value.trim();
                    pm.updateTableRow(row, {
                        2: document.getElementById('editCarName').value.trim(),
                        6: document.getElementById('editContactName').value.trim(),
                        7: document.getElementById('editPhone').value.trim(),
                        14: { value: st, isStatus: true }
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('承运商档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qSubjectName', 'qResourceName', 'qResStatus'],
            filterFn: function (p) {
                resourceArchiveFilter(p, 2, 14, { normal: '正常', frozen: '冻结' });
            }
        });
        document.getElementById('mdmArchiveCarAddBtn') &&
            document.getElementById('mdmArchiveCarAddBtn').addEventListener('click', function () {
                showToast('演示：请到资源中心新建承运商', 'info');
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    var bdFields = [
        { id: 'bdId', label: 'BD推广员ID', type: 'text', editDisabled: true },
        { id: 'bdName', label: 'BD姓名', type: 'text', required: true },
        { id: 'bdPhone', label: '手机号码', type: 'text', required: true },
        {
            id: 'bdCategory',
            label: 'BD分类',
            type: 'select',
            options: [
                { value: '一级BD', text: '一级BD' },
                { value: '二级BD', text: '二级BD' },
                { value: '渠道BD', text: '渠道BD' }
            ]
        },
        {
            id: 'bdIdentity',
            label: 'BD身份',
            type: 'select',
            options: [
                { value: '正式', text: '正式' },
                { value: '试用', text: '试用' },
                { value: '合作', text: '合作' }
            ]
        },
        {
            id: 'bdSuperior',
            label: 'BD上级',
            type: 'select',
            options: [
                { value: '李总监', text: '李总监' },
                { value: '王经理', text: '王经理' },
                { value: '无上级', text: '无上级' }
            ]
        }
    ];

    function bdFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qName = (document.getElementById('qPersonName') || {}).value.trim();
        var qPhoneRaw = ((document.getElementById('qPhone') || {}).value || '').replace(/\D/g, '');
        var qCat = (document.getElementById('qBdCategory') || {}).value.trim();
        var qId = (document.getElementById('qBdIdentity') || {}).value.trim();
        var qEn = (document.getElementById('qEnabled') || {}).value.trim();
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 14) return;
            var ok = true;
            var nm = cells[1].textContent.trim();
            var ph = cells[2].textContent.trim().replace(/\D/g, '');
            if (qName && nm.indexOf(qName) === -1) ok = false;
            if (qPhoneRaw && ph.indexOf(qPhoneRaw) === -1 && cells[2].textContent.indexOf(qPhoneRaw) === -1)
                ok = false;
            if (qCat && cells[3].textContent.trim().indexOf(qCat) === -1) ok = false;
            if (qId && cells[4].textContent.trim().indexOf(qId) === -1) ok = false;
            var stTxt = (cells[12].querySelector('.status') || {}).textContent.trim();
            if (qEn === 'on' && stTxt !== '开启') ok = false;
            if (qEn === 'off' && stTxt !== '禁用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    function initPeopleBd() {
        var pm = new PageManager({
            entityName: 'BD推广员',
            modalWidth: '560px',
            checkboxColumn: false,
            actionColumnMode: 'editDetail',
            fields: bdFields,
            detailView: { enabled: true, columnIndex: 1, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-bd-settle',
                    handler: function (e) {
                        e.preventDefault();
                        showToast('结算周期 T+1；开户行演示支行（原型）', 'info');
                    }
                },
                {
                    selector: '.mdm-peop-detail',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        page.handleDetail(el.closest('tr'));
                    }
                }
            ],
            addModal: {
                modalId: 'mdmBdAdd',
                cancelBtnId: 'mdmBdAddCancelBtn',
                saveBtnId: 'mdmBdAddSaveBtn',
                triggerBtnId: 'mdmPeopleBdAddBtn',
                validations: [
                    { id: 'bdId', message: '请填写BD ID', required: true },
                    { id: 'bdName', message: '请输入BD姓名', required: true },
                    { id: 'bdPhone', message: '请输入手机号码', required: true }
                ],
                onOpen: function () {
                    var el = document.getElementById('bdId');
                    if (el) el.value = 'BD-PROMO-' + String(Date.now()).slice(-6);
                },
                onSave: function () {
                    var id = document.getElementById('bdId').value.trim();
                    pm.addTableRow({
                        cells: [
                            id,
                            document.getElementById('bdName').value.trim(),
                            document.getElementById('bdPhone').value.trim(),
                            document.getElementById('bdCategory').value.trim(),
                            document.getElementById('bdIdentity').value.trim(),
                            document.getElementById('bdSuperior').value.trim(),
                            '0',
                            '¥0',
                            '¥0',
                            '<a href="#" class="mdm-bd-settle">查看信息</a>',
                            document.getElementById('bdPhone').value.trim(),
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    showToast('已添加 BD（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmBdEdit',
                cancelBtnId: 'mdmBdEditCancelBtn',
                saveBtnId: 'mdmBdEditSaveBtn',
                validations: [
                    { id: 'editBdName', message: '请输入BD姓名', required: true },
                    { id: 'editBdPhone', message: '请输入手机号码', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editBdId: c[0].textContent.trim(),
                        editBdName: c[1].textContent.trim(),
                        editBdPhone: c[2].textContent.trim(),
                        editBdCategory: c[3].textContent.trim(),
                        editBdIdentity: c[4].textContent.trim(),
                        editBdSuperior: c[5].textContent.trim()
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    pm.updateTableRow(row, {
                        1: document.getElementById('editBdName').value.trim(),
                        2: document.getElementById('editBdPhone').value.trim(),
                        3: document.getElementById('editBdCategory').value.trim(),
                        4: document.getElementById('editBdIdentity').value.trim(),
                        5: document.getElementById('editBdSuperior').value.trim()
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('BD 资料已保存（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qBdCategory', 'qBdIdentity', 'qEnabled'],
            filterFn: bdFilter
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function rolePeopleFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qName = (document.getElementById('qPersonName') || {}).value.trim();
        var qPhoneRaw = ((document.getElementById('qPhone') || {}).value || '').replace(/\D/g, '');
        var qDept = (document.getElementById('qDept') || {}).value.trim();
        var qJob = (document.getElementById('qJobStatus') || {}).value.trim();
        var qEn = (document.getElementById('qEnabled') || {}).value.trim();
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 10) return;
            var ok = true;
            if (qName && cells[1].textContent.trim().indexOf(qName) === -1) ok = false;
            if (
                qPhoneRaw &&
                cells[2].textContent.replace(/\D/g, '').indexOf(qPhoneRaw) === -1 &&
                cells[2].textContent.indexOf(qPhoneRaw) === -1
            )
                ok = false;
            var dk = tr.getAttribute('data-dept-key') || '';
            if (qDept && dk !== qDept) ok = false;
            var job = cells[4].textContent.trim();
            if (qJob === 'on' && job !== '在岗') ok = false;
            if (qJob === 'off' && job === '在岗') ok = false;
            var stTxt = (cells[8].querySelector('.status') || {}).textContent.trim();
            if (qEn === 'on' && stTxt !== '开启') ok = false;
            if (qEn === 'off' && stTxt !== '禁用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    function initPeopleDriver() {
        var fields = [
            { id: 'did', label: '司机ID', type: 'text', editDisabled: true },
            { id: 'dname', label: '姓名', type: 'text', required: true },
            { id: 'dphone', label: '手机号码', type: 'text', required: true }
        ];
        var pm = new PageManager({
            entityName: '司机',
            modalWidth: '520px',
            checkboxColumn: false,
            actionColumnMode: 'editDetail',
            fields: fields,
            detailView: { enabled: true, columnIndex: 1, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-peop-detail',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        page.handleDetail(el.closest('tr'));
                    }
                }
            ],
            addModal: {
                modalId: 'mdmDrvAdd',
                cancelBtnId: 'mdmDrvAddCancelBtn',
                saveBtnId: 'mdmDrvAddSaveBtn',
                triggerBtnId: 'mdmPeopleDrvAddBtn',
                validations: [
                    { id: 'did', message: '请填写司机ID', required: true },
                    { id: 'dname', message: '请输入姓名', required: true },
                    { id: 'dphone', message: '请输入手机', required: true }
                ],
                onOpen: function () {
                    var el = document.getElementById('did');
                    if (el) el.value = 'DRV' + String(Date.now()).slice(-8);
                },
                onSave: function () {
                    pm.addTableRow({
                        cells: [
                            document.getElementById('did').value.trim(),
                            document.getElementById('dname').value.trim(),
                            document.getElementById('dphone').value.trim(),
                            '城配车队-沪',
                            '在岗',
                            '上海冷丰科技有限公司',
                            document.getElementById('dphone').value.trim(),
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    var tr = document.getElementById('tableBody').querySelector('tr');
                    if (tr) tr.setAttribute('data-dept-key', 'fleet_sh');
                    showToast('已添加司机（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmDrvEdit',
                cancelBtnId: 'mdmDrvEditCancelBtn',
                saveBtnId: 'mdmDrvEditSaveBtn',
                validations: [
                    { id: 'editDname', message: '请输入姓名', required: true },
                    { id: 'editDphone', message: '请输入手机', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editDid: c[0].textContent.trim(),
                        editDname: c[1].textContent.trim(),
                        editDphone: c[2].textContent.trim()
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    pm.updateTableRow(row, {
                        1: document.getElementById('editDname').value.trim(),
                        2: document.getElementById('editDphone').value.trim()
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('司机信息已保存（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qDept', 'qJobStatus', 'qEnabled'],
            filterFn: rolePeopleFilter
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initPeopleAnchor() {
        var fields = [
            { id: 'aid', label: '主播ID', type: 'text', editDisabled: true },
            { id: 'aname', label: '姓名', type: 'text', required: true },
            { id: 'aphone', label: '手机号码', type: 'text', required: true }
        ];
        var pm = new PageManager({
            entityName: '主播',
            modalWidth: '480px',
            checkboxColumn: false,
            actionColumnMode: 'editDetail',
            fields: fields,
            detailView: { enabled: true, columnIndex: 1, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-peop-detail',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        page.handleDetail(el.closest('tr'));
                    }
                }
            ],
            addModal: {
                modalId: 'mdmAncAdd',
                cancelBtnId: 'mdmAncAddCancelBtn',
                saveBtnId: 'mdmAncAddSaveBtn',
                triggerBtnId: 'mdmPeopleAncAddBtn',
                validations: [
                    { id: 'aid', message: '请填写主播ID', required: true },
                    { id: 'aname', message: '请输入姓名', required: true },
                    { id: 'aphone', message: '请输入手机', required: true }
                ],
                onOpen: function () {
                    var el = document.getElementById('aid');
                    if (el) el.value = 'ANC' + String(Date.now()).slice(-8);
                },
                onSave: function () {
                    pm.addTableRow({
                        cells: [
                            document.getElementById('aid').value.trim(),
                            document.getElementById('aname').value.trim(),
                            document.getElementById('aphone').value.trim(),
                            '内容运营中心',
                            '在岗',
                            '上海冷丰科技有限公司',
                            document.getElementById('aphone').value.trim(),
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    var tr = document.getElementById('tableBody').querySelector('tr');
                    if (tr) tr.setAttribute('data-dept-key', 'content');
                    showToast('已添加主播（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmAncEdit',
                cancelBtnId: 'mdmAncEditCancelBtn',
                saveBtnId: 'mdmAncEditSaveBtn',
                validations: [
                    { id: 'editAname', message: '请输入姓名', required: true },
                    { id: 'editAphone', message: '请输入手机', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editAid: c[0].textContent.trim(),
                        editAname: c[1].textContent.trim(),
                        editAphone: c[2].textContent.trim()
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    pm.updateTableRow(row, {
                        1: document.getElementById('editAname').value.trim(),
                        2: document.getElementById('editAphone').value.trim()
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('主播信息已保存（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qDept', 'qJobStatus', 'qEnabled'],
            filterFn: rolePeopleFilter
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initMemberC() {
        var pm = new PageManager({
            entityName: 'C端会员',
            checkboxColumn: false,
            fields: [],
            pageSize: 10,
            detailView: {
                enabled: true,
                columnIndex: 1,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmMemberCUi) {
                        window.MdmMemberCUi.openDetailFromRow(row);
                    }
                }
            },
            customRowActions: [
                {
                    selector: '.mdm-mem-detail',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        page.config.detailView.onOpenDetail(el.closest('tr'));
                    }
                },
                {
                    selector: '.mdm-mem-coupon',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (window.MdmMemberCUi) {
                            window.MdmMemberCUi.openCouponFromRow(el.closest('tr'));
                        }
                    }
                },
                {
                    selector: '.mdm-mem-points',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (window.MdmMemberCUi) {
                            window.MdmMemberCUi.openPointsFromRow(el.closest('tr'));
                        }
                    }
                }
            ]
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qMemberId', 'qBindWay', 'qPhone'],
            filterFn: function (p) {
                var tbody = document.getElementById(p.config.tableBodyId);
                if (!tbody) return;
                var qId = (document.getElementById('qMemberId') || {}).value.trim();
                var qB = (document.getElementById('qBindWay') || {}).value.trim();
                var qP = ((document.getElementById('qPhone') || {}).value || '').replace(/\D/g, '');
                tbody.querySelectorAll('tr').forEach(function (tr) {
                    var c = tr.querySelectorAll('td');
                    if (c.length < 17) return;
                    var ok = true;
                    if (qId && c[0].textContent.trim().indexOf(qId) === -1) ok = false;
                    if (qB && c[8].textContent.trim() !== qB) ok = false;
                    if (qP && c[3].textContent.replace(/\D/g, '').indexOf(qP) === -1) ok = false;
                    tr.style.display = ok ? '' : 'none';
                });
                p.refreshPagination();
            }
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initAuditStoreRegistration() {
        var pm = new PageManager({
            entityName: '门店注册申请',
            checkboxColumn: false,
            fields: [],
            detailView: {
                enabled: true,
                columnIndex: 3,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmAuditStoreUi) {
                        window.MdmAuditStoreUi.openDetail(row);
                    }
                }
            },
            customRowActions: [
                {
                    selector: '.mdm-audit-detail',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        if (window.MdmAuditStoreUi) {
                            window.MdmAuditStoreUi.openDetail(el.closest('tr'));
                        }
                    }
                },
                {
                    selector: '.mdm-audit-review',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        if (window.MdmAuditStoreUi) {
                            window.MdmAuditStoreUi.openReview(el.closest('tr'), page, false);
                        }
                    }
                },
                {
                    selector: '.mdm-audit-edit',
                    handler: function (e, el, page) {
                        e.preventDefault();
                        if (window.MdmAuditStoreUi) {
                            window.MdmAuditStoreUi.openReview(el.closest('tr'), page, true);
                        }
                    }
                }
            ]
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qSubjectName', 'qStoreName', 'qAuditStatus'],
            filterFn: function (p) {
                var tbody = document.getElementById(p.config.tableBodyId);
                if (!tbody) return;
                var qS = (document.getElementById('qSubjectName') || {}).value.trim();
                var qN = (document.getElementById('qStoreName') || {}).value.trim();
                var qSt = (document.getElementById('qAuditStatus') || {}).value.trim();
                var map = {
                    pending: '待审核',
                    leaderPending: '待总监审核',
                    success: '审核成功',
                    failed: '审核失败'
                };
                tbody.querySelectorAll('tr').forEach(function (tr) {
                    var cells = tr.querySelectorAll('td');
                    if (cells.length < 11) return;
                    var ok = true;
                    if (qS && cells[2].textContent.trim().indexOf(qS) === -1) ok = false;
                    if (qN && cells[3].textContent.trim().indexOf(qN) === -1) ok = false;
                    if (qSt && map[qSt]) {
                        var t = cells[7].querySelector('.status');
                        var tx = t ? t.textContent.trim() : '';
                        if (tx !== map[qSt]) ok = false;
                    }
                    tr.style.display = ok ? '' : 'none';
                });
                p.refreshPagination();
            }
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    window.MdmErpLists = {
        initArchiveStore: initArchiveStore,
        initArchiveSupplier: initArchiveSupplier,
        initArchiveWarehouse: initArchiveWarehouse,
        initArchiveLiveRoom: initArchiveLiveRoom,
        initArchiveCarrier: initArchiveCarrier,
        initPeopleBd: initPeopleBd,
        initPeopleDriver: initPeopleDriver,
        initPeopleAnchor: initPeopleAnchor,
        initMemberC: initMemberC,
        initAuditStoreRegistration: initAuditStoreRegistration
    };
})();
