/**
 * MDM — 资源档案 / 人员 / 会员 / 审核 等列表的 PageManager 启动脚本
 */
(function () {
    var RESOURCE_ARCHIVE_CACHE_KEY = 'mdm_resource_archive_first_by_subject_v1';

    function readResourceArchiveCache() {
        try {
            var raw = localStorage.getItem(RESOURCE_ARCHIVE_CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeResourceArchiveCache(cache) {
        try {
            localStorage.setItem(RESOURCE_ARCHIVE_CACHE_KEY, JSON.stringify(cache || {}));
        } catch (e) {}
    }

    function copyObj(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    function normalizeOnboardingDefaults(raw) {
        var r = raw || {};
        var cardInfo = r.card_info || {};
        return {
            short_name: String(r.short_name || '').trim(),
            receipt_name: String(r.receipt_name || '').trim(),
            detail_addr: String(r.detail_addr || '').trim(),
            legal_mobile_no: String(r.legal_mobile_no || '').trim(),
            contact_mobile_no: String(r.contact_mobile_no || '').trim(),
            contact_email: String(r.contact_email || '').trim(),
            card_info: {
                account_name: String(cardInfo.account_name || '').trim(),
                card_no: String(cardInfo.card_no || '').trim(),
                bank_name: String(cardInfo.bank_name || '').trim(),
                bank_branch: String(cardInfo.bank_branch || '').trim()
            },
            license_info: r.license_info || {},
            legal_info: r.legal_info || {},
            license_pic: String(r.license_pic || '').trim(),
            legal_cert_front_pic: String(r.legal_cert_front_pic || '').trim(),
            legal_cert_back_pic: String(r.legal_cert_back_pic || '').trim(),
            open_license_pic: String(r.open_license_pic || '').trim(),
            store_header_pic: String(r.store_header_pic || '').trim(),
            store_indoor_pic: String(r.store_indoor_pic || '').trim(),
            store_cashier_desk_pic: String(r.store_cashier_desk_pic || '').trim()
        };
    }

    function resolveFirstArchiveDefaults(kind, subjectName) {
        var all = readResourceArchiveCache();
        var bucket = all[kind] || {};
        var bySubject = bucket.bySubject || {};
        var firstRows = bucket.firstRows || [];
        var picked = null;
        var key = String(subjectName || '').trim();
        if (key && bySubject[key]) picked = bySubject[key];
        if (!picked && firstRows.length) picked = firstRows[0];
        if (!picked) return null;
        return normalizeOnboardingDefaults(copyObj(picked));
    }

    function cacheFirstResourceRows(kind, options) {
        var tbody = document.getElementById(options.tableBodyId || 'tableBody');
        if (!tbody) return;
        var rows = tbody.querySelectorAll('tr');
        if (!rows.length) return;
        var firstRows = [];
        var bySubject = {};
        rows.forEach(function (tr) {
            var c = tr.querySelectorAll('td');
            if (!c.length) return;
            var subjectName = (c[options.subjectCol] || {}).textContent || '';
            subjectName = subjectName.trim();
            var resourceName = (c[options.resourceNameCol] || {}).textContent || '';
            var detailAddr = (c[options.detailAddrCol] || {}).textContent || '';
            var contactMobile = (c[options.contactMobileCol] || {}).textContent || '';
            var one = {
                subject_name: subjectName,
                short_name: resourceName.trim(),
                receipt_name: resourceName.trim(),
                detail_addr: detailAddr.trim(),
                contact_mobile_no: contactMobile.trim(),
                legal_mobile_no: '',
                contact_email: '',
                open_license_pic: '',
                license_info: {},
                legal_info: {},
                store_header_pic: options.storeHeaderPic || '',
                card_info: {}
            };
            firstRows.push(one);
            if (subjectName && !bySubject[subjectName]) bySubject[subjectName] = one;
        });
        if (!firstRows.length) return;
        var all = readResourceArchiveCache();
        all[kind] = {
            updatedAt: Date.now(),
            firstRows: firstRows,
            bySubject: bySubject
        };
        writeResourceArchiveCache(all);
    }

    function maskBdPhoneForCell(raw) {
        var d = String(raw || '').replace(/\D/g, '');
        if (d.length < 7) return raw || '—';
        return d.slice(0, 3) + '****' + d.slice(-4);
    }

    function openBdSettleInfoModal(bdName) {
        var ex = document.getElementById('mdmBdSettleModal');
        if (ex) ex.remove();
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="mdmBdSettleModal" class="modal" style="display:block">' +
                '<div class="modal-content" style="width:440px">' +
                '<div class="modal-header">' +
                '<h2 class="modal-title">结算信息</h2>' +
                '<span class="close" id="mdmBdSettleCloseX">&times;</span></div>' +
                '<div class="modal-body" style="padding:16px 20px;line-height:1.65;color:#333">' +
                (bdName || '—') +
                '：结算周期 T+1；开户行演示支行；账户名与 BD 实名一致（原型）。</div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary" id="mdmBdSettleOk">知道了</button>' +
                '</div></div></div>'
        );
        function hide() {
            var m = document.getElementById('mdmBdSettleModal');
            if (m) m.remove();
        }
        document.getElementById('mdmBdSettleCloseX').addEventListener('click', hide);
        document.getElementById('mdmBdSettleOk').addEventListener('click', hide);
        document.getElementById('mdmBdSettleModal').addEventListener('click', function (e) {
            if (e.target.id === 'mdmBdSettleModal') hide();
        });
    }

    function openArchiveOnboardingFromRow(tr, kind) {
        if (
            !window.MdmUnifiedOnboardingUi ||
            typeof window.MdmUnifiedOnboardingUi.openModal !== 'function'
        ) {
            showToast('进件模块未加载，请刷新页面重试', 'error');
            return;
        }
        var c = tr.querySelectorAll('td');
        var recordId = c[0] ? c[0].textContent.trim() : '';
        var shortName = c[2] ? c[2].textContent.trim() : '';
        var detailAddrIdx = 4;
        var contactMobileIdx = 7;
        if (kind === 'store') {
            detailAddrIdx = 10;
            contactMobileIdx = 7;
        } else if (kind === 'warehouse') {
            detailAddrIdx = 8;
            contactMobileIdx = 6;
        } else if (kind === 'liveRoom') {
            detailAddrIdx = 2;
            contactMobileIdx = 7;
        }
        var detailAddr = c[detailAddrIdx] ? c[detailAddrIdx].textContent.trim() : '';
        var contactMobile = c[contactMobileIdx]
            ? c[contactMobileIdx].textContent.trim()
            : '';
        var title = '支付进件';
        if (kind === 'store') title = '门店进件';
        else if (kind === 'supplier') title = '供应商进件';
        else if (kind === 'liveRoom') title = '直播间进件';
        else if (kind === 'carrier') title = '承运商进件';
        window.MdmUnifiedOnboardingUi.openModal({
            title: title,
            merchantShortNameDefault: shortName,
            fieldDefaults: {
                short_name: shortName,
                receipt_name: shortName,
                detail_addr: detailAddr,
                contact_mobile_no: contactMobile,
                store_header_pic: kind === 'store' ? '档案门头照' : ''
            },
            recordKey: 'archive::' + kind + '::' + recordId,
            variant: 'resource'
        });
    }

    window.MdmResourceArchiveOnboardingDefaults = {
        resolveFirstBySubject: resolveFirstArchiveDefaults
    };

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

    function openWithdrawPhoneDemo(storeName, displayPhone) {
        var ex = document.getElementById('mdmWithdrawPhoneModal');
        if (ex) ex.remove();
        var sub =
            isWithdrawPhoneUnset(displayPhone) ?
                '当前未绑定可提现手机号，可按原型流程添加（演示）。'
            :   '当前：' + displayPhone + '。更换需短信验证（演示）。';
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="mdmWithdrawPhoneModal" class="modal" style="display:block">' +
                '<div class="modal-content" style="width:440px">' +
                '<div class="modal-header">' +
                '<h2 class="modal-title">可提现手机号</h2>' +
                '<span class="close" id="mdmWithdrawPhoneX">&times;</span></div>' +
                '<div class="modal-body" style="padding:16px 20px;line-height:1.65;color:#333">' +
                '<p style="margin:0 0 8px"><strong>' +
                (storeName || '门店') +
                '</strong></p><p style="margin:0">' +
                sub +
                '</p></div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary" id="mdmWithdrawPhoneOk">知道了</button>' +
                '</div></div></div>'
        );
        function hide() {
            var m = document.getElementById('mdmWithdrawPhoneModal');
            if (m) m.remove();
        }
        document.getElementById('mdmWithdrawPhoneX').addEventListener('click', hide);
        document.getElementById('mdmWithdrawPhoneOk').addEventListener('click', hide);
        document.getElementById('mdmWithdrawPhoneModal').addEventListener('click', function (e) {
            if (e.target.id === 'mdmWithdrawPhoneModal') hide();
        });
    }

    function isWithdrawPhoneUnset(v) {
        if (v == null) return true;
        var s = String(v).trim();
        return !s || s === '—' || s === '--' || s === '-' || s === '添加';
    }

    function storeArchiveFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qSub = (document.getElementById('qSubjectName') || {}).value.trim();
        var qStore = (document.getElementById('qStoreName') || {}).value.trim();
        var qOp = (document.getElementById('qStoreOpStatus') || {}).value.trim();
        var qSplit = (document.getElementById('qStoreSplit') || {}).value.trim();
        var qSt = (document.getElementById('qStoreStatus') || {}).value.trim();
        var opMap = { '1': '营业中', '2': '筹备', '3': '停业' };
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 21) return;
            var sub = cells[1].textContent.trim();
            /* 门店名称列可能含链接，取纯文本 */
            var sn = cells[2].textContent.trim();
            var opTxt = cells[13].textContent.trim();
            var splitTxt = cells[17].textContent.trim();
            var stSpan = cells[18].querySelector('.status');
            var stTxt = stSpan ? stSpan.textContent.trim() : '';
            var ok = true;
            if (qSub && sub.indexOf(qSub) === -1) ok = false;
            if (qStore && sn.indexOf(qStore) === -1) ok = false;
            if (qOp && opTxt !== opMap[qOp]) ok = false;
            if (qSplit === 'on' && splitTxt !== '开启') ok = false;
            if (qSplit === 'off' && splitTxt !== '关闭' && splitTxt !== '未开通') ok = false;
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
            addModalTitle: '新增门店',
            editModalTitle: '编辑门店',
            detailModalTitle: '门店详情',
            modalWidth: '720px',
            checkboxColumn: false,
            statusColumnIndex: 18,
            actionColumnMode: 'editOnboard',
            pageSize: 10,
            detailView: {
                enabled: true,
                columnIndex: 2,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmArchiveDetailDrawer) {
                        window.MdmArchiveDetailDrawer.openStore(row);
                    } else if (typeof showToast === 'function') {
                        showToast('详情抽屉未加载，请确认已引入 mdm-archive-detail-drawer.js', 'error');
                    }
                }
            },
            fields: fields,
            customRowActions: [
                {
                    selector: '.edit-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (
                            window.MdmResourceArchiveForms &&
                            typeof window.MdmResourceArchiveForms.openStoreEdit === 'function'
                        ) {
                            window.MdmResourceArchiveForms.openStoreEdit(el.closest('tr'));
                        } else if (typeof showToast === 'function') {
                            showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                        }
                    }
                },
                {
                    selector: '.mdm-store-withdraw',
                    handler: function (e, el) {
                        e.preventDefault();
                        var tr = el.closest('tr');
                        var c = tr.querySelectorAll('td');
                        var storeName = c[2].textContent.trim();
                        openWithdrawPhoneDemo(storeName, el.textContent.trim());
                    }
                },
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
        bindSimpleFilter(pm, {
            resetFields: [
                'qSubjectName',
                'qStoreName',
                'qStoreOpStatus',
                'qStoreSplit',
                'qStoreStatus'
            ],
            filterFn: storeArchiveFilter
        });
        document.getElementById('mdmArchiveStoreAddBtn') &&
            document.getElementById('mdmArchiveStoreAddBtn').addEventListener('click', function () {
                if (
                    window.MdmResourceArchiveForms &&
                    typeof window.MdmResourceArchiveForms.openStoreAdd === 'function'
                ) {
                    window.MdmResourceArchiveForms.openStoreAdd();
                } else if (typeof showToast === 'function') {
                    showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                }
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            cacheFirstResourceRows('store', {
                subjectCol: 1,
                resourceNameCol: 2,
                detailAddrCol: 10,
                contactMobileCol: 7,
                storeHeaderPic: '档案门头照'
            });
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
            detailView: {
                enabled: true,
                columnIndex: 2,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmArchiveDetailDrawer) {
                        window.MdmArchiveDetailDrawer.openSupplier(row);
                    } else if (typeof showToast === 'function') {
                        showToast('详情抽屉未加载，请确认已引入 mdm-archive-detail-drawer.js', 'error');
                    }
                }
            },
            customRowActions: [
                {
                    selector: '.edit-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (
                            window.MdmResourceArchiveForms &&
                            typeof window.MdmResourceArchiveForms.openSupplierEdit === 'function'
                        ) {
                            window.MdmResourceArchiveForms.openSupplierEdit(el.closest('tr'));
                        } else if (typeof showToast === 'function') {
                            showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                        }
                    }
                },
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
                if (
                    window.MdmResourceArchiveForms &&
                    typeof window.MdmResourceArchiveForms.openSupplierAdd === 'function'
                ) {
                    window.MdmResourceArchiveForms.openSupplierAdd();
                } else if (typeof showToast === 'function') {
                    showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                }
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            cacheFirstResourceRows('supplier', {
                subjectCol: 1,
                resourceNameCol: 2,
                detailAddrCol: 4,
                contactMobileCol: 7
            });
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
            detailView: {
                enabled: true,
                columnIndex: 2,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmArchiveDetailDrawer) {
                        window.MdmArchiveDetailDrawer.openWarehouse(row);
                    } else if (typeof showToast === 'function') {
                        showToast('详情抽屉未加载，请确认已引入 mdm-archive-detail-drawer.js', 'error');
                    }
                }
            },
            customRowActions: [
                {
                    selector: '.edit-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (
                            window.MdmResourceArchiveForms &&
                            typeof window.MdmResourceArchiveForms.openWarehouseEdit === 'function'
                        ) {
                            window.MdmResourceArchiveForms.openWarehouseEdit(el.closest('tr'));
                        } else if (typeof showToast === 'function') {
                            showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                        }
                    }
                }
            ],
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
                if (
                    window.MdmResourceArchiveForms &&
                    typeof window.MdmResourceArchiveForms.openWarehouseAdd === 'function'
                ) {
                    window.MdmResourceArchiveForms.openWarehouseAdd();
                } else if (typeof showToast === 'function') {
                    showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                }
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            document.querySelectorAll('#tableBody tr').forEach(function (tr) {
                pm.refreshDisableToggleLabel(tr);
            });
            cacheFirstResourceRows('warehouse', {
                subjectCol: 1,
                resourceNameCol: 2,
                detailAddrCol: 8,
                contactMobileCol: 6
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
            detailView: {
                enabled: true,
                columnIndex: 2,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmArchiveDetailDrawer) {
                        window.MdmArchiveDetailDrawer.openLiveRoom(row);
                    } else if (typeof showToast === 'function') {
                        showToast('详情抽屉未加载，请确认已引入 mdm-archive-detail-drawer.js', 'error');
                    }
                }
            },
            customRowActions: [
                {
                    selector: '.edit-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (
                            window.MdmResourceArchiveForms &&
                            typeof window.MdmResourceArchiveForms.openLiveRoomEdit === 'function'
                        ) {
                            window.MdmResourceArchiveForms.openLiveRoomEdit(el.closest('tr'));
                        } else if (typeof showToast === 'function') {
                            showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                        }
                    }
                },
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
                if (
                    window.MdmResourceArchiveForms &&
                    typeof window.MdmResourceArchiveForms.openLiveRoomAdd === 'function'
                ) {
                    window.MdmResourceArchiveForms.openLiveRoomAdd();
                } else if (typeof showToast === 'function') {
                    showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                }
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            cacheFirstResourceRows('liveRoom', {
                subjectCol: 1,
                resourceNameCol: 2,
                detailAddrCol: 2,
                contactMobileCol: 7
            });
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
            detailView: {
                enabled: true,
                columnIndex: 2,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmArchiveDetailDrawer) {
                        window.MdmArchiveDetailDrawer.openCarrier(row);
                    } else if (typeof showToast === 'function') {
                        showToast('详情抽屉未加载，请确认已引入 mdm-archive-detail-drawer.js', 'error');
                    }
                }
            },
            customRowActions: [
                {
                    selector: '.edit-btn',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (
                            window.MdmResourceArchiveForms &&
                            typeof window.MdmResourceArchiveForms.openCarrierEdit === 'function'
                        ) {
                            window.MdmResourceArchiveForms.openCarrierEdit(el.closest('tr'));
                        } else if (typeof showToast === 'function') {
                            showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                        }
                    }
                },
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
                if (
                    window.MdmResourceArchiveForms &&
                    typeof window.MdmResourceArchiveForms.openCarrierAdd === 'function'
                ) {
                    window.MdmResourceArchiveForms.openCarrierAdd();
                } else if (typeof showToast === 'function') {
                    showToast('表单模块未加载，请确认已引入 mdm-resource-archive-forms.js', 'error');
                }
            });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            cacheFirstResourceRows('carrier', {
                subjectCol: 1,
                resourceNameCol: 2,
                detailAddrCol: 4,
                contactMobileCol: 7
            });
        }, 0);
    }

    var bdFields = [
        { id: 'bdId', label: 'BD推广员ID', type: 'text', editDisabled: true, hiddenInAdd: true },
        {
            id: 'bdName',
            label: 'BD姓名',
            type: 'text',
            required: true,
            placeholder: '请输入BD姓名',
            editDisabled: true
        },
        {
            type: 'raw',
            html:
                '<div class="modal-form-group" style="width:100%">' +
                '<label style="min-width:100px"><span style="color:red">*</span>手机号码</label>' +
                '<div style="flex:1;display:flex;gap:8px;align-items:center">' +
                '<div class="input-wrapper" style="flex:1">' +
                '<input type="text" id="bdAddPhone" placeholder="请输入手机号码" inputmode="numeric" maxlength="11">' +
                '<span class="clear-btn">×</span></div>' +
                '<button type="button" class="btn btn-secondary btn-sm" id="bdSmsBtn">获取验证码</button>' +
                '</div></div>',
            editHtml:
                '<div class="modal-form-group"><label style="min-width:100px">手机号码</label>' +
                '<div class="input-wrapper">' +
                '<input type="text" id="editBdPhone" disabled>' +
                '<span class="clear-btn">×</span></div></div>'
        },
        {
            id: 'bdSmsCode',
            label: '验证码',
            type: 'text',
            required: true,
            editDisabled: true,
            placeholder: '请输入验证码'
        },
        {
            id: 'bdCategory',
            label: 'BD分类',
            type: 'select',
            required: true,
            editDisabled: true,
            options: [
                { value: '', text: '请选择' },
                { value: '一级BD', text: '一级BD' },
                { value: '二级BD', text: '二级BD' },
                { value: '渠道BD', text: '渠道BD' }
            ]
        },
        {
            id: 'bdIdentity',
            label: 'BD身份',
            type: 'select',
            required: true,
            editDisabled: true,
            options: [
                { value: '', text: '请选择' },
                { value: '正式', text: '正式' },
                { value: '试用', text: '试用' },
                { value: '合作', text: '合作' }
            ]
        },
        {
            id: 'bdSuperior',
            label: 'BD上级',
            type: 'select',
            required: true,
            editDisabled: true,
            options: [
                { value: '', text: '请选择' },
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
        var catMap = { l1: '一级BD', l2: '二级BD', channel: '渠道BD' };
        var idMap = { formal: '正式', probation: '试用', partner: '合作' };
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 14) return;
            var ok = true;
            var nm = cells[1].textContent.trim();
            if (qName && nm.indexOf(qName) === -1) ok = false;
            if (qPhoneRaw) {
                var phTxt = cells[2].textContent.trim();
                var phDig = phTxt.replace(/\D/g, '');
                if (phDig.indexOf(qPhoneRaw) === -1 && phTxt.indexOf(qPhoneRaw) === -1) ok = false;
            }
            if (qCat && cells[3].textContent.trim() !== catMap[qCat]) ok = false;
            if (qId && cells[4].textContent.trim() !== idMap[qId]) ok = false;
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
            addModalTitle: '添加BD推广员',
            editModalTitle: '编辑BD推广员',
            detailModalTitle: 'BD推广员详情',
            modalWidth: '560px',
            checkboxColumn: false,
            actionColumnMode: 'editDetail',
            fields: bdFields,
            detailView: { enabled: true, columnIndex: 1, linkClass: 'subject-name-link' },
            customRowActions: [
                {
                    selector: '.mdm-bd-settle',
                    handler: function (e, el) {
                        e.preventDefault();
                        var row = el.closest('tr');
                        var nm = row ? row.querySelectorAll('td')[1].textContent.trim() : '';
                        openBdSettleInfoModal(nm);
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
                    { id: 'bdName', message: '请输入BD姓名', required: true },
                    { id: 'bdAddPhone', message: '请输入手机号码', required: true },
                    { id: 'bdSmsCode', message: '请输入验证码', required: true },
                    { id: 'bdCategory', message: '请选择BD分类', required: true },
                    { id: 'bdIdentity', message: '请选择BD身份', required: true },
                    { id: 'bdSuperior', message: '请选择BD上级', required: true }
                ],
                onSave: function () {
                    var raw = document.getElementById('bdAddPhone').value.replace(/\D/g, '');
                    if (raw.length !== 11) {
                        showToast('请输入11位手机号码', 'error');
                        return false;
                    }
                    var id = 'BD-PROMO-' + String(Date.now()).slice(-6);
                    var masked = maskBdPhoneForCell(raw);
                    pm.addTableRow({
                        cells: [
                            id,
                            document.getElementById('bdName').value.trim(),
                            masked,
                            document.getElementById('bdCategory').value.trim(),
                            document.getElementById('bdIdentity').value.trim(),
                            document.getElementById('bdSuperior').value.trim(),
                            '0',
                            '¥0',
                            '¥0',
                            '<a href="#" class="mdm-bd-settle">查看信息</a>',
                            masked,
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
                    { id: 'editBdCategory', message: '请选择BD分类', required: true },
                    { id: 'editBdIdentity', message: '请选择BD身份', required: true },
                    { id: 'editBdSuperior', message: '请选择BD上级', required: true }
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
                        editBdSuperior: c[5].textContent.trim(),
                        editBdSmsCode: ''
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
                },
                onDetailModeChange: function (isDetail) {
                    var g = document.getElementById('editBdSmsCode');
                    if (g && g.closest) g.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                }
            }
        });
        pm.init();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qBdCategory', 'qBdIdentity', 'qEnabled'],
            filterFn: bdFilter
        });
        document.body.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'bdSmsBtn') {
                var inp = document.getElementById('bdAddPhone');
                var d = inp ? inp.value.replace(/\D/g, '') : '';
                if (d.length !== 11) {
                    showToast('请先输入11位手机号', 'info');
                    return;
                }
                showToast('验证码已发送（演示）', 'info');
            }
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
