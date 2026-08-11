/**
 * MDM — 资源档案 / 人员 / 会员 / 审核 等列表的 PageManager 启动脚本
 */
(function () {
    var RESOURCE_ARCHIVE_CACHE_KEY = 'mdm_resource_archive_first_by_subject_v1';
    var MDM_ENABLED_WAREHOUSE_CACHE_KEY = 'mdm_enabled_warehouse_options_v1';
    var MDM_BD_WAREHOUSE_BIND_KEY = 'mdm_bd_warehouse_bindings_v1';

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

    function readJsonStore(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeJsonStore(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
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

    function normalizeWarehouseTypeLabel(raw) {
        var t = String(raw || '').trim();
        if (t === '网格仓' || t === '门店') return '网格仓';
        if (t === '中心仓' || t === '仓库') return '中心仓';
        return '';
    }

    function collectWarehouseOptionsFromRows(rows) {
        var list = [];
        rows.forEach(function (tr) {
            var c = tr.querySelectorAll('td');
            if (c.length < 12) return;
            var code = (c[0].textContent || '').trim();
            var name = (c[2].textContent || '').trim();
            var warehouseType = (c[3].textContent || '').trim();
            var typeLabel = normalizeWarehouseTypeLabel((c[4].textContent || '').trim());
            var st = (c[11].querySelector('.status') || {}).textContent || c[11].textContent || '';
            st = String(st).trim();
            if (!code || !name || !typeLabel || warehouseType !== '仓库') return;
            list.push({
                id: code,
                name: name,
                typeLabel: typeLabel,
                enabled: st === '启用'
            });
        });
        return list;
    }

    function cacheEnabledWarehouseOptionsFromTable() {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;
        var list = collectWarehouseOptionsFromRows(tbody.querySelectorAll('tr'));
        writeJsonStore(MDM_ENABLED_WAREHOUSE_CACHE_KEY, {
            updatedAt: Date.now(),
            items: list
        });
    }

    function readEnabledWarehouseOptions() {
        var data = readJsonStore(MDM_ENABLED_WAREHOUSE_CACHE_KEY) || {};
        var items = Array.isArray(data.items) ? data.items : [];
        return items.filter(function (one) {
            return (
                one &&
                one.id &&
                one.name &&
                (one.typeLabel === '网格仓' || one.typeLabel === '中心仓')
            );
        }).map(function (one) {
            var copied = {
                id: one.id,
                name: one.name,
                typeLabel: one.typeLabel,
                enabled: one.enabled !== false
            };
            return copied;
        });
    }

    function fetchEnabledWarehouseOptionsFromArchivePage(callback) {
        if (typeof fetch !== 'function') {
            callback([]);
            return;
        }
        fetch('mdm_archive_warehouse.html', { cache: 'no-store' })
            .then(function (res) {
                if (!res || !res.ok) return '';
                return res.text();
            })
            .then(function (html) {
                if (!html) return [];
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var rows = doc.querySelectorAll('#tableBody tr');
                return collectWarehouseOptionsFromRows(rows);
            })
            .then(function (list) {
                writeJsonStore(MDM_ENABLED_WAREHOUSE_CACHE_KEY, {
                    updatedAt: Date.now(),
                    items: list
                });
                callback(list || []);
            })
            .catch(function () {
                callback([]);
            });
    }

    function ensureEnabledWarehouseOptions(callback) {
        var list = readEnabledWarehouseOptions();
        if (list.length) {
            callback(list);
            return;
        }
        fetchEnabledWarehouseOptionsFromArchivePage(function (fetched) {
            callback(fetched || []);
        });
    }

    function readBdWarehouseBindings() {
        var data = readJsonStore(MDM_BD_WAREHOUSE_BIND_KEY);
        if (!data || typeof data !== 'object') return {};
        return data;
    }

    function writeBdWarehouseBindings(data) {
        writeJsonStore(MDM_BD_WAREHOUSE_BIND_KEY, data || {});
    }

    function readOneBdWarehouseBinding(bdId) {
        var all = readBdWarehouseBindings();
        var one = all[String(bdId || '').trim()] || {};
        var warehouseIds = Array.isArray(one.warehouseIds) ? one.warehouseIds : [];
        return {
            warehouseIds: warehouseIds
        };
    }

    function saveOneBdWarehouseBinding(bdId, warehouseIds) {
        var key = String(bdId || '').trim();
        if (!key) return;
        var all = readBdWarehouseBindings();
        all[key] = {
            warehouseIds: Array.isArray(warehouseIds) ? warehouseIds : [],
            updatedAt: Date.now()
        };
        writeBdWarehouseBindings(all);
    }

    function getActiveWarehouseIdsByOptions(warehouseIds, options) {
        var enabledMap = {};
        (options || []).forEach(function (one) {
            if (one && one.id) enabledMap[String(one.id)] = one.enabled !== false;
        });
        return (warehouseIds || []).filter(function (id) {
            return !!enabledMap[String(id)];
        });
    }

    function refreshBdBindWarehouseLinkText(row) {
        if (!row || !row.querySelectorAll) return;
        var c = row.querySelectorAll('td');
        if (c.length < 14) return;
        var bdId = (c[0].textContent || '').trim();
        var a = row.querySelector('.mdm-bd-bind-warehouse');
        if (!a || !bdId) return;
        var bind = readOneBdWarehouseBinding(bdId);
        var options = readEnabledWarehouseOptions();
        var activeIds = getActiveWarehouseIdsByOptions(bind.warehouseIds, options);
        var count = activeIds.length;
        a.textContent = count > 0 ? '绑定仓库(' + count + ')' : '绑定仓库';
    }

    function refreshBdBindWarehouseLinksInTable() {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            refreshBdBindWarehouseLinkText(tr);
        });
    }

    function openBdBindWarehouseModal(row) {
        var c = row ? row.querySelectorAll('td') : [];
        var bdId = c[0] ? c[0].textContent.trim() : '';
        var bdName = c[1] ? c[1].textContent.trim() : '';
        ensureEnabledWarehouseOptions(function (options) {
            var ex = document.getElementById('mdmBdBindWarehouseModal');
            if (ex) ex.remove();
            var selected = readOneBdWarehouseBinding(bdId).warehouseIds;
            var selectedMap = {};
            selected.forEach(function (id) {
                selectedMap[String(id)] = true;
            });
            var grouped = { '网格仓': [], '中心仓': [] };
            options.forEach(function (one) {
                if (grouped[one.typeLabel]) grouped[one.typeLabel].push(one);
            });
            function buildGroupHtml(typeLabel) {
                var arr = grouped[typeLabel] || [];
                var itemsHtml = '';
                arr.forEach(function (one) {
                    var checked = selectedMap[one.id] ? ' checked' : '';
                    var dis = one.enabled ? '' : ' disabled';
                    var lbStyle =
                        'display:inline-flex;align-items:center;gap:6px;margin:0 14px 10px 0;cursor:' +
                        (one.enabled ? 'pointer' : 'not-allowed') +
                        ';' +
                        (one.enabled ? '' : 'color:#999;');
                    itemsHtml +=
                        '<label style="' +
                        lbStyle +
                        '">' +
                        '<input type="checkbox" class="mdm-bd-wh-opt" data-wh-id="' +
                        one.id +
                        '"' +
                        checked +
                        dis +
                        '>' +
                        '<span>' +
                        one.name +
                        (one.enabled ? '' : '（停用）') +
                        '</span></label>';
                });
                if (!itemsHtml) itemsHtml = '<div style="color:#999;font-size:12px;">暂无仓库</div>';
                return (
                    '<div style="margin-bottom:14px;">' +
                    '<div style="font-weight:600;color:#333;margin:0 0 8px;">' +
                    typeLabel +
                    '</div>' +
                    '<div style="padding:10px;border:1px solid #eee;border-radius:4px;background:#fafafa;">' +
                    itemsHtml +
                    '</div></div>'
                );
            }
            var emptyHint =
                options.length ?
                    ''
                :   '<div style="margin-bottom:10px;padding:8px 10px;border-radius:4px;background:#fff7e6;color:#ad6800;font-size:12px;">暂无仓库，请先在仓库档案新增仓库。</div>';
            document.body.insertAdjacentHTML(
                'beforeend',
                '<div id="mdmBdBindWarehouseModal" class="modal" style="display:block">' +
                    '<div class="modal-content" style="width:680px;max-width:94vw;">' +
                    '<div class="modal-header">' +
                    '<h2 class="modal-title">绑定仓库</h2>' +
                    '<span class="close" id="mdmBdBindWarehouseCloseX">&times;</span></div>' +
                    '<div class="modal-body" style="padding:16px 20px;max-height:60vh;overflow:auto;">' +
                    '<div style="margin-bottom:10px;color:#333;">BD：<strong>' +
                    (bdName || '—') +
                    '</strong></div>' +
                    '<div style="margin-bottom:10px;padding:8px 10px;border-radius:4px;background:#fafafa;color:#666;font-size:12px;">停用仓库绑定关系自动失效；再次启用后自动恢复生效。</div>' +
                    emptyHint +
                    buildGroupHtml('网格仓') +
                    buildGroupHtml('中心仓') +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '<button type="button" class="btn btn-secondary" id="mdmBdBindWarehouseCancelBtn">取消</button>' +
                    '<button type="button" class="btn btn-primary" id="mdmBdBindWarehouseSaveBtn">确定</button>' +
                    '</div></div></div>'
            );
            function hide() {
                var m = document.getElementById('mdmBdBindWarehouseModal');
                if (m) m.remove();
            }
            document
                .getElementById('mdmBdBindWarehouseCloseX')
                .addEventListener('click', hide);
            document
                .getElementById('mdmBdBindWarehouseCancelBtn')
                .addEventListener('click', hide);
            document
                .getElementById('mdmBdBindWarehouseSaveBtn')
                .addEventListener('click', function () {
                    var ids = [];
                    document.querySelectorAll('#mdmBdBindWarehouseModal .mdm-bd-wh-opt:checked').forEach(function (el) {
                        var id = String(el.getAttribute('data-wh-id') || '').trim();
                        if (id) ids.push(id);
                    });
                    saveOneBdWarehouseBinding(bdId, ids);
                    refreshBdBindWarehouseLinkText(row);
                    if (typeof showToast === 'function') {
                        showToast('仓库绑定已保存（演示）', 'success');
                    }
                    hide();
                });
            document.getElementById('mdmBdBindWarehouseModal').addEventListener('click', function (e) {
                if (e.target.id === 'mdmBdBindWarehouseModal') hide();
            });
        });
    }

    var SUPPLIER_BALANCE_PAY_KEY = 'mdm_supplier_balance_payment_v1';
    var SUPPLIER_COL = {
        name: 2,
        shortName: 3,
        region: 4,
        detailAddr: 5,
        type: 6,
        contact: 7,
        phone: 8,
        onboard: 14,
        balancePay: 15,
        status: 16
    };

    function readSupplierBalancePayments() {
        return readJsonStore(SUPPLIER_BALANCE_PAY_KEY) || {};
    }

    function writeSupplierBalancePayments(map) {
        writeJsonStore(SUPPLIER_BALANCE_PAY_KEY, map || {});
    }

    function getSupplierBalancePayment(supplierId) {
        var map = readSupplierBalancePayments();
        var raw = String(map[String(supplierId || '').trim()] || '').trim();
        return raw === '未开通' ? '已拒绝' : raw;
    }

    function setSupplierBalancePayment(supplierId, status) {
        var id = String(supplierId || '').trim();
        if (!id) return;
        var map = readSupplierBalancePayments();
        map[id] = status;
        writeSupplierBalancePayments(map);
    }

    function supplierRecordKey(id) {
        return 'archive::supplier::' + String(id || '').trim();
    }

    function resolveSupplierOnboardingDisplay(recordKey, fallback) {
        var summary = {};
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.getSummary === 'function'
        ) {
            summary = window.MdmUnifiedOnboardingUi.getSummary(recordKey, {});
        }
        if (summary.auditStatus === '审核成功') return '进件成功';
        if (summary.auditStatus === '审核失败') return '进件失败';
        if (summary.status === 'submitted' || summary.auditStatus) return '进件中';
        var fb = String(fallback || '').trim();
        if (fb === '已进件' || fb === '进件成功') return '进件成功';
        if (fb === '进件失败') return '进件失败';
        if (fb === '进件中' || fb === '审核中') return '进件中';
        if (!fb || fb === '—' || fb === '-' || fb === '--') return '未进件';
        return fb;
    }

    var STORE_BALANCE_PAY_KEY = 'mdm_store_balance_payment_v1';
    var STORE_COL = {
        onboard: 14,
        balancePay: 15,
        settleType: 16,
        settleCycle: 17,
        split: 18,
        status: 19,
        createTime: 20
    };

    function storeRecordKey(id) {
        return 'archive::store::' + String(id || '').trim();
    }

    function readStoreBalancePayments() {
        return readJsonStore(STORE_BALANCE_PAY_KEY) || {};
    }

    function writeStoreBalancePayments(map) {
        writeJsonStore(STORE_BALANCE_PAY_KEY, map || {});
    }

    function getStoreBalancePayment(storeId) {
        var map = readStoreBalancePayments();
        var raw = String(map[String(storeId || '').trim()] || '').trim();
        return raw === '未开通' ? '已拒绝' : raw;
    }

    function setStoreBalancePayment(storeId, status) {
        var id = String(storeId || '').trim();
        if (!id) return;
        var map = readStoreBalancePayments();
        map[id] = status;
        writeStoreBalancePayments(map);
    }

    function resolveStoreBalancePayment(storeId, onboardingDisplay) {
        var saved = getStoreBalancePayment(storeId);
        if (saved) return saved;
        if (onboardingDisplay === '进件成功') return '审核中';
        return '未提交';
    }

    function triggerStoreBalancePayment(storeId) {
        var id = String(storeId || '').trim();
        if (!id) return '';
        var current = getStoreBalancePayment(id);
        if (current === '已开通' || current === '审核中' || current === '已拒绝') return current;
        setStoreBalancePayment(id, '审核中');
        if (typeof showToast === 'function') {
            showToast('进件成功，已自动发起余额支付申请', 'success');
        }
        return '审核中';
    }

    function syncStoreArchiveRow(tr, payload) {
        if (!tr) return;
        var cells = tr.querySelectorAll('td');
        if (cells.length < STORE_COL.status + 1) return;
        var storeId = cells[0].textContent.trim();
        var recordKey = storeRecordKey(storeId);
        var onboardFallback = cells[STORE_COL.onboard].textContent.trim();
        var onboardDisplay = resolveSupplierOnboardingDisplay(recordKey, onboardFallback);
        if (payload && payload.status === 'submitted') onboardDisplay = '进件中';
        if (payload === null) onboardDisplay = '未进件';
        cells[STORE_COL.onboard].textContent = onboardDisplay;
        if (onboardDisplay === '进件成功') {
            triggerStoreBalancePayment(storeId);
        }
        cells[STORE_COL.balancePay].textContent = resolveStoreBalancePayment(storeId, onboardDisplay);
    }

    function syncAllStoreArchiveRows() {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            syncStoreArchiveRow(tr);
        });
    }

    function seedStoreDemoBalancePayments() {
        var map = readStoreBalancePayments();
        if (!map.ONS303445581201) map.ONS303445581201 = '已开通';
        writeStoreBalancePayments(map);
    }

    function resolveSupplierBalancePayment(supplierId, onboardingDisplay) {
        var saved = getSupplierBalancePayment(supplierId);
        if (saved) return saved;
        if (onboardingDisplay === '进件成功') return '审核中';
        return '未提交';
    }

    function triggerSupplierBalancePayment(supplierId) {
        var id = String(supplierId || '').trim();
        if (!id) return '';
        var current = getSupplierBalancePayment(id);
        if (current === '已开通' || current === '审核中' || current === '已拒绝') return current;
        setSupplierBalancePayment(id, '审核中');
        if (typeof showToast === 'function') {
            showToast('进件成功，已自动发起余额支付申请', 'success');
        }
        return '审核中';
    }

    function findSupplierArchiveRow(supplierId) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return null;
        var id = String(supplierId || '').trim();
        var found = null;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var c = tr.querySelectorAll('td');
            if (c[0] && c[0].textContent.trim() === id) found = tr;
        });
        return found;
    }

    function syncSupplierArchiveRow(tr, payload) {
        if (!tr) return;
        var cells = tr.querySelectorAll('td');
        if (cells.length < SUPPLIER_COL.status + 1) return;
        var supplierId = cells[0].textContent.trim();
        var recordKey = supplierRecordKey(supplierId);
        var onboardFallback = cells[SUPPLIER_COL.onboard].textContent.trim();
        var onboardDisplay = resolveSupplierOnboardingDisplay(recordKey, onboardFallback);
        if (payload && payload.status === 'submitted') onboardDisplay = '进件中';
        if (payload === null) onboardDisplay = '未进件';
        cells[SUPPLIER_COL.onboard].textContent = onboardDisplay;
        if (onboardDisplay === '进件成功') {
            triggerSupplierBalancePayment(supplierId);
        }
        cells[SUPPLIER_COL.balancePay].textContent = resolveSupplierBalancePayment(
            supplierId,
            onboardDisplay
        );
    }

    function syncAllSupplierArchiveRows() {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr) {
            syncSupplierArchiveRow(tr);
        });
    }

    function seedSupplierDemoBalancePayments() {
        var map = readSupplierBalancePayments();
        if (!map.SUP20188301) map.SUP20188301 = '已开通';
        writeSupplierBalancePayments(map);
    }

    function onSupplierOnboardingSuccess(supplierId) {
        triggerSupplierBalancePayment(supplierId);
        var tr = findSupplierArchiveRow(supplierId);
        if (tr) syncSupplierArchiveRow(tr);
    }

    window.MdmSupplierArchiveUi = {
        syncRow: syncSupplierArchiveRow,
        syncAllRows: syncAllSupplierArchiveRows,
        onOnboardingSuccess: onSupplierOnboardingSuccess,
        triggerBalancePayment: triggerSupplierBalancePayment,
        resolveOnboardingDisplay: resolveSupplierOnboardingDisplay,
        findRow: findSupplierArchiveRow,
        COL: SUPPLIER_COL
    };

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
        } else if (kind === 'supplier') {
            var archiveShort = c[SUPPLIER_COL.shortName]
                ? c[SUPPLIER_COL.shortName].textContent.trim()
                : '';
            if (archiveShort === '—' || archiveShort === '-') archiveShort = '';
            shortName = archiveShort || shortName;
            detailAddrIdx = SUPPLIER_COL.detailAddr;
            contactMobileIdx = SUPPLIER_COL.phone;
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
        var modalOpts = {
            title: title,
            merchantShortNameDefault: shortName,
            onboardingKind: kind,
            fieldDefaults: {
                short_name: shortName,
                receipt_name: shortName,
                detail_addr: detailAddr,
                contact_mobile_no: contactMobile,
                store_header_pic: kind === 'store' ? '档案门头照' : ''
            },
            recordKey: 'archive::' + kind + '::' + recordId,
            variant: 'resource'
        };
        if (kind === 'supplier' && tr) {
            modalOpts.onRecordChange = function (payload) {
                syncSupplierArchiveRow(tr, payload);
            };
        } else if (kind === 'store' && tr) {
            modalOpts.onRecordChange = function (payload) {
                syncStoreArchiveRow(tr, payload);
            };
        }
        window.MdmUnifiedOnboardingUi.openModal(modalOpts);
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
        var qOnboard = (document.getElementById('qStoreOnboardStatus') || {}).value.trim();
        var qBalance = (document.getElementById('qStoreBalancePay') || {}).value.trim();
        var qSplit = (document.getElementById('qStoreSplit') || {}).value.trim();
        var qSt = (document.getElementById('qStoreStatus') || {}).value.trim();
        var opMap = { '1': '营业中', '2': '筹备', '3': '停业' };
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < STORE_COL.status + 1) return;
            var sub = cells[1].textContent.trim();
            /* 门店名称列可能含链接，取纯文本 */
            var sn = cells[2].textContent.trim();
            var opTxt = cells[13].textContent.trim();
            var onboardTxt = cells[STORE_COL.onboard].textContent.trim();
            var balanceTxt = cells[STORE_COL.balancePay].textContent.trim();
            var splitTxt = cells[STORE_COL.split].textContent.trim();
            var stSpan = cells[STORE_COL.status].querySelector('.status');
            var stTxt = stSpan ? stSpan.textContent.trim() : '';
            var ok = true;
            if (qSub && sub.indexOf(qSub) === -1) ok = false;
            if (qStore && sn.indexOf(qStore) === -1) ok = false;
            if (qOp && opTxt !== opMap[qOp]) ok = false;
            if (qOnboard && onboardTxt !== qOnboard) ok = false;
            if (qBalance && balanceTxt !== qBalance) ok = false;
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

    function supplierArchiveFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qSub = (document.getElementById('qSubjectName') || {}).value.trim();
        var qRes = (document.getElementById('qResourceName') || {}).value.trim();
        var qOnboard = (document.getElementById('qSupOnboardStatus') || {}).value.trim();
        var qBalance = (document.getElementById('qSupBalancePay') || {}).value.trim();
        var qSt = (document.getElementById('qResStatus') || {}).value.trim();
        var statusMap = { normal: '正常', frozen: '冻结' };
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < SUPPLIER_COL.status + 1) return;
            var ok = true;
            if (qSub && cells[1].textContent.trim().indexOf(qSub) === -1) ok = false;
            if (qRes && cells[2].textContent.trim().indexOf(qRes) === -1) ok = false;
            if (qOnboard && cells[SUPPLIER_COL.onboard].textContent.trim() !== qOnboard) ok = false;
            if (qBalance && cells[SUPPLIER_COL.balancePay].textContent.trim() !== qBalance) ok = false;
            if (qSt && statusMap[qSt]) {
                var stTxt = (cells[SUPPLIER_COL.status].querySelector('.status') || {}).textContent || '';
                if (String(stTxt).trim() !== statusMap[qSt]) ok = false;
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
            if ((qTyp === 'center' || qTyp === 'w') && cells[4].textContent.trim() !== '中心仓') ok = false;
            if ((qTyp === 'grid' || qTyp === 's') && cells[4].textContent.trim() !== '网格仓') ok = false;
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
            { id: 'fulfillWarehouse', label: '配送仓库', type: 'text', required: true },
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
            statusColumnIndex: STORE_COL.status,
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
                    { id: 'editContactPerson', message: '请输入联系人', required: true },
                    { id: 'editFulfillWarehouse', message: '请输入配送仓库', required: true }
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
                        editStoreOpStatus: c[STORE_COL.status].querySelector('.status')
                            ? c[STORE_COL.status].querySelector('.status').textContent.trim()
                            : '正常'
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var st = document.getElementById('editStoreOpStatus').value.trim();
                    var patch = {
                        2: document.getElementById('editStoreName').value.trim(),
                        6: document.getElementById('editContactPerson').value.trim(),
                        7: document.getElementById('editPhone').value.trim(),
                        8: document.getElementById('editFulfillWarehouse').value.trim(),
                        9: document.getElementById('editRegionText').value.trim(),
                        10: document.getElementById('editAddressText').value.trim()
                    };
                    patch[STORE_COL.status] = { value: st, isStatus: true };
                    pm.updateTableRow(row, patch);
                    pm.decorateDetailLinkCell(row);
                    showToast('门店档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        seedStoreDemoBalancePayments();
        syncAllStoreArchiveRows();
        window.addEventListener('storage', function (e) {
            if (e.key === 'mdm_unified_onboarding_records_v1') {
                syncAllStoreArchiveRows();
            }
        });
        bindSimpleFilter(pm, {
            resetFields: [
                'qSubjectName',
                'qStoreName',
                'qStoreOpStatus',
                'qStoreOnboardStatus',
                'qStoreBalancePay',
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
            syncAllStoreArchiveRows();
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
            statusColumnIndex: SUPPLIER_COL.status,
            actionColumnMode: 'editOnboard',
            fields: fields,
            detailView: {
                enabled: true,
                columnIndex: SUPPLIER_COL.name,
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
                        editResName: c[SUPPLIER_COL.name].textContent.trim(),
                        editContactName: c[SUPPLIER_COL.contact].textContent.trim(),
                        editPhone: c[SUPPLIER_COL.phone].textContent.trim(),
                        editResStatus: c[SUPPLIER_COL.status].querySelector('.status')
                            ? c[SUPPLIER_COL.status].querySelector('.status').textContent.trim()
                            : '正常'
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var st = document.getElementById('editResStatus').value.trim();
                    pm.updateTableRow(row, {
                        2: document.getElementById('editResName').value.trim(),
                        7: document.getElementById('editContactName').value.trim(),
                        8: document.getElementById('editPhone').value.trim(),
                        16: { value: st, isStatus: true }
                    });
                    pm.decorateDetailLinkCell(row);
                    showToast('供应商档案已更新（演示）', 'success');
                    pm.currentEditRow = null;
                }
            }
        });
        pm.init();
        seedSupplierDemoBalancePayments();
        syncAllSupplierArchiveRows();
        window.addEventListener('storage', function (e) {
            if (
                e.key === 'mdm_unified_onboarding_records_v1' ||
                e.key === SUPPLIER_BALANCE_PAY_KEY ||
                e.key === 'mdm_supplier_archive_v1'
            ) {
                syncAllSupplierArchiveRows();
            }
        });
        bindSimpleFilter(pm, {
            resetFields: [
                'qSubjectName',
                'qResourceName',
                'qSupOnboardStatus',
                'qSupBalancePay',
                'qResStatus'
            ],
            filterFn: supplierArchiveFilter
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
            syncAllSupplierArchiveRows();
            if (window.MdmSupplierArchiveStore) {
                window.MdmSupplierArchiveStore.syncFromArchiveTable();
            }
            cacheFirstResourceRows('supplier', {
                subjectCol: 1,
                resourceNameCol: SUPPLIER_COL.name,
                detailAddrCol: SUPPLIER_COL.detailAddr,
                contactMobileCol: SUPPLIER_COL.phone
            });
        }, 0);
    }

    function initArchiveWarehouse() {
        var fields = [
            { id: 'whCode', label: '仓库编号', type: 'text', editDisabled: true },
            { id: 'subjectName', label: '主体名称', type: 'text', editDisabled: true },
            { id: 'whName', label: '仓库名称', type: 'text', required: true },
            { id: 'whType', label: '仓库级别', type: 'text' },
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
                        cacheEnabledWarehouseOptionsFromTable();
                    });
                    return;
                } else {
                    page.updateTableRow(row, { 11: { value: '停用', isStatus: true } });
                }
                page.refreshDisableToggleLabel(row);
                cacheEnabledWarehouseOptionsFromTable();
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
                        editWhType: c[4].textContent.trim(),
                        editAdminName: c[5].textContent.trim(),
                        editAdminPhone: c[6].textContent.trim()
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    pm.updateTableRow(row, {
                        2: document.getElementById('editWhName').value.trim(),
                        4: document.getElementById('editWhType').value.trim(),
                        5: document.getElementById('editAdminName').value.trim(),
                        6: document.getElementById('editAdminPhone').value.trim()
                    });
                    pm.decorateDetailLinkCell(row);
                    cacheEnabledWarehouseOptionsFromTable();
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
            cacheEnabledWarehouseOptionsFromTable();
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

    var BD_CATEGORY_OPTIONS = [
        { value: '', text: '请选择BD分类' },
        { value: '城市BD', text: '城市BD' },
        { value: '行业BD', text: '行业BD' },
        { value: '渠道BD', text: '渠道BD' }
    ];

    var BD_IDENTITY_OPTIONS = [
        { value: '', text: '请选择BD身份' },
        { value: '初级', text: '初级' },
        { value: '高级', text: '高级' },
        { value: '主管', text: '主管' },
        { value: '总监', text: '总监' }
    ];

    var BD_SUPERIOR_PLACEHOLDER = { value: '', text: '请选择BD上级' };

    /** 当前身份对应的上一级身份（作为 BD 上级的候选身份） */
    var BD_SUPERIOR_IDENTITY = {
        初级: '高级',
        高级: '主管',
        主管: '总监',
        总监: null
    };

    var BD_CATEGORY_FILTER_MAP = { city: '城市BD', industry: '行业BD', channel: '渠道BD' };
    var BD_IDENTITY_FILTER_MAP = {
        junior: '初级',
        senior: '高级',
        supervisor: '主管',
        director: '总监'
    };

    function getEnabledBdRowsFromTable() {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return [];
        var rows = [];
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 14) return;
            var statusEl = cells[12].querySelector('.status');
            rows.push({
                name: cells[1].textContent.trim(),
                identity: cells[4].textContent.trim(),
                enabled: !!(statusEl && statusEl.textContent.trim() === '开启')
            });
        });
        return rows;
    }

    function buildBdSuperiorOptions(identity, selectedName, excludeName) {
        var options = [BD_SUPERIOR_PLACEHOLDER];
        var targetIdentity = BD_SUPERIOR_IDENTITY[identity];
        if (!targetIdentity) {
            options.push({ value: '无上级', text: '无上级' });
            return options;
        }
        getEnabledBdRowsFromTable().forEach(function (row) {
            if (!row.enabled) return;
            if (row.identity !== targetIdentity) return;
            if (excludeName && row.name === excludeName) return;
            options.push({ value: row.name, text: row.name });
        });
        if (
            selectedName &&
            selectedName !== '无上级' &&
            !options.some(function (opt) {
                return opt.value === selectedName;
            })
        ) {
            options.push({ value: selectedName, text: selectedName });
        }
        return options;
    }

    function refreshBdSuperiorSelect(inputId, dropdownId, identity, selectedName, excludeName) {
        var options = buildBdSuperiorOptions(identity, selectedName, excludeName);
        if (typeof renderSelectOptions === 'function') {
            renderSelectOptions(dropdownId, options);
        }
        var input = document.getElementById(inputId);
        if (!input) return;
        if (selectedName) {
            input.value = selectedName;
            input.dataset.value = selectedName;
        } else if (!targetIdentityRequiresSuperior(identity)) {
            input.value = '无上级';
            input.dataset.value = '无上级';
        } else {
            input.value = '';
            input.dataset.value = '';
        }
    }

    function targetIdentityRequiresSuperior(identity) {
        return !!BD_SUPERIOR_IDENTITY[identity];
    }

    function bindBdIdentitySuperiorCascade(isEdit, getExcludeName) {
        var identityId = isEdit ? 'editBdIdentity' : 'bdIdentity';
        var superiorInputId = isEdit ? 'editBdSuperior' : 'bdSuperior';
        var superiorDropdownId = superiorInputId + 'Dropdown';
        var identityEl = document.getElementById(identityId);
        if (!identityEl || identityEl.dataset.bdCascadeBound === '1') return;
        identityEl.dataset.bdCascadeBound = '1';
        identityEl.addEventListener('change', function () {
            var identity = identityEl.value.trim();
            var excludeName = typeof getExcludeName === 'function' ? getExcludeName() : '';
            refreshBdSuperiorSelect(superiorInputId, superiorDropdownId, identity, '', excludeName);
        });
    }

    function bindPeopleNameCharCounter(inputId, counterId) {
        var input = document.getElementById(inputId);
        var counter = document.getElementById(counterId);
        if (!input || !counter || input.dataset.peopleCharBound === '1') return;
        input.dataset.peopleCharBound = '1';
        function sync() {
            counter.textContent = String((input.value || '').length) + ' / 20';
        }
        input.addEventListener('input', sync);
        sync();
    }

    function bindBdNameCharCounter(inputId, counterId) {
        bindPeopleNameCharCounter(inputId, counterId);
    }

    function movePeopleRequiredMarkBeforeLabel(modalRoot) {
        if (!modalRoot) return;
        modalRoot.querySelectorAll('.modal-form-group > label').forEach(function (lab) {
            var star = lab.querySelector('span[style*="red"], span[style*="color: red"]');
            if (star && lab.firstChild !== star) {
                lab.insertBefore(star, lab.firstChild);
                star.classList.add('mdm-people-req', 'mdm-bd-req');
                star.removeAttribute('style');
            }
        });
    }

    function moveBdRequiredMarkBeforeLabel(modalRoot) {
        movePeopleRequiredMarkBeforeLabel(modalRoot);
    }

    function setupPeopleModalShell(pm, modalId, modalKey, titleText, saveBtnId, nameCounters) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('mdm-people-modal-root');

        var content = modal.querySelector('.modal-content');
        if (content) content.classList.add('mdm-people-modal');

        var titleEl = modal.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = titleText;
            titleEl.classList.add('mdm-people-modal__title');
        }

        var header = modal.querySelector('.modal-header');
        if (header && !header.querySelector('.mdm-people-modal__header-actions')) {
            var oldClose = header.querySelector('.close');
            if (oldClose) oldClose.style.display = 'none';

            var actions = document.createElement('div');
            actions.className = 'mdm-people-modal__header-actions';

            var fsBtn = document.createElement('button');
            fsBtn.type = 'button';
            fsBtn.className = 'mdm-people-modal__header-btn';
            fsBtn.title = '全屏';
            fsBtn.setAttribute('aria-label', '全屏');
            fsBtn.innerHTML =
                '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
                '<path d="M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M13.5 2.5L10 6M2.5 13.5L6 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            fsBtn.addEventListener('click', function () {
                if (content) content.classList.toggle('mdm-people-modal--fullscreen');
            });

            var closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'mdm-people-modal__header-btn';
            closeBtn.title = '关闭';
            closeBtn.setAttribute('aria-label', '关闭');
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', function () {
                pm.closeModal(modalKey);
            });

            actions.appendChild(fsBtn);
            actions.appendChild(closeBtn);
            header.appendChild(actions);
        }

        var form = modal.querySelector('.modal-form');
        if (form) form.classList.add('mdm-people-modal-form');

        var footer = modal.querySelector('.modal-footer');
        if (footer) footer.classList.add('mdm-people-modal__footer');

        var saveBtn = document.getElementById(saveBtnId);
        if (saveBtn) saveBtn.textContent = '确定';

        movePeopleRequiredMarkBeforeLabel(modal);
        (nameCounters || []).forEach(function (pair) {
            bindPeopleNameCharCounter(pair.inputId, pair.counterId);
        });
    }

    function setupBdPromoterModalShell(pm, modalId, modalKey, titleText, saveBtnId) {
        setupPeopleModalShell(pm, modalId, modalKey, titleText, saveBtnId, [
            { inputId: 'bdName', counterId: 'bdNameCharCount' },
            { inputId: 'editBdName', counterId: 'editBdNameCharCount' }
        ]);
        var modal = document.getElementById(modalId);
        if (modal) modal.classList.add('mdm-bd-promoter-modal-root');
        var content = modal && modal.querySelector('.modal-content');
        if (content) content.classList.add('mdm-bd-promoter-modal');
        var form = modal && modal.querySelector('.modal-form');
        if (form) form.classList.add('mdm-bd-promoter-form');
        var footer = modal && modal.querySelector('.modal-footer');
        if (footer) footer.classList.add('mdm-bd-promoter-modal__footer');
        var titleEl = modal && modal.querySelector('.modal-title');
        if (titleEl) titleEl.classList.add('mdm-bd-promoter-modal__title');
    }

    function setupPeopleSmsCodeInputs(ids) {
        ids.forEach(function (id) {
            var node = document.getElementById(id);
            if (node) {
                node.setAttribute('maxlength', '6');
                node.setAttribute('inputmode', 'numeric');
            }
        });
    }

    var peopleSmsClickBound = false;
    var PEOPLE_SMS_BTN_MAP = {
        bdSmsBtn: { phone: 'bdAddPhone', label: 'BD手机' },
        editBdSmsBtn: { phone: 'editBdPhone', label: 'BD手机' },
        drvSmsBtn: { phone: 'drvAddPhone', label: '手机号码' },
        editDrvSmsBtn: { phone: 'editDrvPhone', label: '手机号码' },
        ancSmsBtn: { phone: 'ancAddPhone', label: '手机号码' },
        editAncSmsBtn: { phone: 'editAncPhone', label: '手机号码' },
        purSmsBtn: { phone: 'purAddPhone', label: '手机号码' },
        editPurSmsBtn: { phone: 'editPurPhone', label: '手机号码' }
    };

    function bindPeopleSmsButtons() {
        if (peopleSmsClickBound) return;
        peopleSmsClickBound = true;
        document.body.addEventListener('click', function (e) {
            var btn = e.target;
            if (!btn || !btn.id) return;
            var cfg = PEOPLE_SMS_BTN_MAP[btn.id];
            if (!cfg) return;
            var inp = document.getElementById(cfg.phone);
            var d = inp ? inp.value.replace(/\D/g, '') : '';
            if (d.length !== 11) {
                showToast('请先输入11位' + cfg.label, 'info');
                return;
            }
            showToast('验证码已发送（演示）', 'info');
        });
    }

    function getPeoplePhoneRawFromRow(row) {
        if (!row) return '';
        var raw =
            row.getAttribute('data-phone-raw') ||
            row.getAttribute('data-bd-phone-raw') ||
            row.getAttribute('data-purchaser-phone-raw');
        if (raw) return String(raw).replace(/\D/g, '');
        var cells = row.querySelectorAll('td');
        if (cells.length < 3) return '';
        return String(cells[2].textContent || '').replace(/\D/g, '');
    }

    function validatePeoplePhoneAndSms(phoneInputId, smsInputId, phoneLabel) {
        var label = phoneLabel || '手机';
        var raw = (document.getElementById(phoneInputId).value || '').replace(/\D/g, '');
        if (raw.length !== 11) {
            showToast('请输入11位' + label, 'error');
            return false;
        }
        var smsCode = (document.getElementById(smsInputId).value || '').replace(/\D/g, '');
        if (smsCode.length !== 6) {
            showToast('请输入6位数字验证码', 'error');
            return false;
        }
        return raw;
    }

    function buildPeopleRoleFields(cfg) {
        var nameHtml =
            '<div class="modal-form-group" style="width:100%">' +
            '<label><span class="mdm-people-req mdm-bd-req">*</span>' +
            cfg.nameLabel +
            '</label>' +
            '<div class="mdm-people-control mdm-bd-control mdm-people-input-count-wrap mdm-bd-input-count-wrap">' +
            '<div class="input-wrapper">' +
            '<input type="text" id="' +
            cfg.nameAddId +
            '" placeholder="请输入' +
            cfg.nameLabel +
            '" maxlength="20">' +
            '<span class="clear-btn">×</span></div>' +
            '<span class="mdm-people-char-count mdm-bd-char-count" id="' +
            cfg.nameAddCounterId +
            '">0 / 20</span>' +
            '</div></div>';
        var nameEditHtml =
            '<div class="modal-form-group" style="width:100%">' +
            '<label><span class="mdm-people-req mdm-bd-req">*</span>' +
            cfg.nameLabel +
            '</label>' +
            '<div class="mdm-people-control mdm-bd-control mdm-people-input-count-wrap mdm-bd-input-count-wrap">' +
            '<div class="input-wrapper">' +
            '<input type="text" id="' +
            cfg.nameEditId +
            '" placeholder="请输入' +
            cfg.nameLabel +
            '" maxlength="20">' +
            '<span class="clear-btn">×</span></div>' +
            '<span class="mdm-people-char-count mdm-bd-char-count" id="' +
            cfg.nameEditCounterId +
            '">0 / 20</span>' +
            '</div></div>';
        var phoneHtml =
            '<div class="modal-form-group" style="width:100%">' +
            '<label><span class="mdm-people-req mdm-bd-req">*</span>' +
            cfg.phoneLabel +
            '</label>' +
            '<div class="mdm-people-control mdm-bd-control mdm-people-phone-row mdm-bd-phone-row">' +
            '<div class="input-wrapper">' +
            '<input type="text" id="' +
            cfg.phoneAddId +
            '" placeholder="请输入' +
            cfg.phoneLabel +
            '" inputmode="numeric" maxlength="11">' +
            '<span class="clear-btn">×</span></div>' +
            '<button type="button" class="btn btn-primary btn-sm mdm-people-sms-btn mdm-bd-sms-btn" id="' +
            cfg.smsBtnAddId +
            '">获取验证码</button>' +
            '</div></div>';
        var phoneEditHtml =
            '<div class="modal-form-group" style="width:100%">' +
            '<label><span class="mdm-people-req mdm-bd-req">*</span>' +
            cfg.phoneLabel +
            '</label>' +
            '<div class="mdm-people-control mdm-bd-control mdm-people-phone-row mdm-bd-phone-row">' +
            '<div class="input-wrapper">' +
            '<input type="text" id="' +
            cfg.phoneEditId +
            '" placeholder="请输入' +
            cfg.phoneLabel +
            '" inputmode="numeric" maxlength="11">' +
            '<span class="clear-btn">×</span></div>' +
            '<button type="button" class="btn btn-primary btn-sm mdm-people-sms-btn mdm-bd-sms-btn" id="' +
            cfg.smsBtnEditId +
            '">获取验证码</button>' +
            '</div></div>';
        return [
            { id: cfg.idKey, label: cfg.idLabel, type: 'text', editDisabled: true, hiddenInAdd: true },
            { type: 'raw', html: nameHtml, editHtml: nameEditHtml },
            { type: 'raw', html: phoneHtml, editHtml: phoneEditHtml },
            {
                id: cfg.smsCodeKey,
                label: '验证码',
                type: 'text',
                required: true,
                placeholder: '请输入6位数字验证码'
            }
        ];
    }

    function getBdPhoneRawFromRow(row) {
        return getPeoplePhoneRawFromRow(row);
    }

    function validateBdPhoneAndSms(phoneInputId, smsInputId) {
        return validatePeoplePhoneAndSms(phoneInputId, smsInputId, 'BD手机');
    }

    var bdFields = [
        { id: 'bdId', label: 'BD推广员ID', type: 'text', editDisabled: true, hiddenInAdd: true },
        {
            type: 'raw',
            html:
                '<div class="modal-form-group" style="width:100%">' +
                '<label><span class="mdm-bd-req">*</span>BD姓名</label>' +
                '<div class="mdm-bd-control mdm-bd-input-count-wrap">' +
                '<div class="input-wrapper">' +
                '<input type="text" id="bdName" placeholder="请输入BD姓名" maxlength="20">' +
                '<span class="clear-btn">×</span></div>' +
                '<span class="mdm-bd-char-count" id="bdNameCharCount">0 / 20</span>' +
                '</div></div>',
            editHtml:
                '<div class="modal-form-group" style="width:100%">' +
                '<label><span class="mdm-bd-req">*</span>BD姓名</label>' +
                '<div class="mdm-bd-control mdm-bd-input-count-wrap">' +
                '<div class="input-wrapper">' +
                '<input type="text" id="editBdName" placeholder="请输入BD姓名" maxlength="20">' +
                '<span class="clear-btn">×</span></div>' +
                '<span class="mdm-bd-char-count" id="editBdNameCharCount">0 / 20</span>' +
                '</div></div>'
        },
        {
            type: 'raw',
            html:
                '<div class="modal-form-group" style="width:100%">' +
                '<label><span class="mdm-bd-req">*</span>BD手机</label>' +
                '<div class="mdm-bd-control mdm-bd-phone-row">' +
                '<div class="input-wrapper">' +
                '<input type="text" id="bdAddPhone" placeholder="请输入BD手机" inputmode="numeric" maxlength="11">' +
                '<span class="clear-btn">×</span></div>' +
                '<button type="button" class="btn btn-primary btn-sm mdm-bd-sms-btn" id="bdSmsBtn">获取验证码</button>' +
                '</div></div>',
            editHtml:
                '<div class="modal-form-group" style="width:100%">' +
                '<label><span class="mdm-bd-req">*</span>BD手机</label>' +
                '<div class="mdm-bd-control mdm-bd-phone-row">' +
                '<div class="input-wrapper">' +
                '<input type="text" id="editBdPhone" placeholder="请输入BD手机" inputmode="numeric" maxlength="11">' +
                '<span class="clear-btn">×</span></div>' +
                '<button type="button" class="btn btn-primary btn-sm mdm-bd-sms-btn" id="editBdSmsBtn">获取验证码</button>' +
                '</div></div>'
        },
        {
            id: 'bdSmsCode',
            label: '验证码',
            type: 'text',
            required: true,
            placeholder: '请输入6位数字验证码'
        },
        {
            id: 'bdCategory',
            label: 'BD分类',
            type: 'select',
            required: true,
            placeholder: '请选择BD分类',
            options: BD_CATEGORY_OPTIONS
        },
        {
            id: 'bdIdentity',
            label: 'BD身份',
            type: 'select',
            required: true,
            placeholder: '请选择BD身份',
            options: BD_IDENTITY_OPTIONS
        },
        {
            id: 'bdSuperior',
            label: 'BD上级',
            type: 'select',
            required: false,
            placeholder: '请选择BD上级',
            options: [BD_SUPERIOR_PLACEHOLDER]
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
        var catMap = BD_CATEGORY_FILTER_MAP;
        var idMap = BD_IDENTITY_FILTER_MAP;
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
            statusColumnIndex: 12,
            actionColumnMode: 'disableTogglePlusEditBindWarehouse',
            disableToggleVerb: 'openClose',
            onDisableToggle: function (row, status, page) {
                applyPeopleDisableToggle(row, status, page, {
                    roleLabel: 'BD推广员',
                    statusColumnIndex: 12,
                    enabledToast: '已开启 BD（演示）',
                    disabledToast: '已禁用 BD（演示）'
                });
            },
            fields: bdFields,
            detailView: {
                enabled: true,
                columnIndex: 1,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    if (window.MdmBdPromoterDetail) {
                        window.MdmBdPromoterDetail.openFromRow(row, 'base');
                    }
                }
            },
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
                    selector: '.mdm-bd-bind-warehouse',
                    handler: function (e, el) {
                        e.preventDefault();
                        openBdBindWarehouseModal(el.closest('tr'));
                    }
                }
            ],
            addModal: {
                modalId: 'mdmBdAdd',
                cancelBtnId: 'mdmBdAddCancelBtn',
                saveBtnId: 'mdmBdAddSaveBtn',
                triggerBtnId: 'mdmPeopleBdAddBtn',
                onOpen: function () {
                    bindBdIdentitySuperiorCascade(false, function () {
                        var nameEl = document.getElementById('bdName');
                        return nameEl ? nameEl.value.trim() : '';
                    });
                    refreshBdSuperiorSelect('bdSuperior', 'bdSuperiorDropdown', '', '', '');
                    var nameCnt = document.getElementById('bdNameCharCount');
                    var nameInp = document.getElementById('bdName');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'bdName', message: '请输入BD姓名', required: true },
                    { id: 'bdAddPhone', message: '请输入BD手机', required: true },
                    { id: 'bdSmsCode', message: '请输入6位数字验证码', required: true },
                    { id: 'bdCategory', message: '请选择BD分类', required: true },
                    { id: 'bdIdentity', message: '请选择BD身份', required: true }
                ],
                onSave: function () {
                    var raw = validateBdPhoneAndSms('bdAddPhone', 'bdSmsCode');
                    if (!raw) return false;
                    var id = 'BD-PROMO-' + String(Date.now()).slice(-6);
                    var masked = maskBdPhoneForCell(raw);
                    var superiorVal = document.getElementById('bdSuperior').value.trim();
                    var newRow = pm.addTableRow({
                        cells: [
                            id,
                            document.getElementById('bdName').value.trim(),
                            masked,
                            document.getElementById('bdCategory').value.trim(),
                            document.getElementById('bdIdentity').value.trim(),
                            superiorVal || '—',
                            '0',
                            '¥0',
                            '¥0',
                            '<a href="#" class="mdm-bd-settle">查看信息</a>',
                            masked,
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    if (newRow) newRow.setAttribute('data-bd-phone-raw', raw);
                    if (newRow) {
                        newRow.setAttribute(
                            'data-bd-member-no',
                            'M' + String(Date.now()).slice(-6).padStart(6, '0')
                        );
                        newRow.setAttribute('data-bd-join-time', pm.getCurrentTimeStr().replace(' ', 'T'));
                    }
                    refreshBdBindWarehouseLinksInTable();
                    showToast('已添加 BD（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmBdEdit',
                cancelBtnId: 'mdmBdEditCancelBtn',
                saveBtnId: 'mdmBdEditSaveBtn',
                onOpen: function () {
                    bindBdIdentitySuperiorCascade(true, function () {
                        return pm.currentEditRow
                            ? pm.currentEditRow.querySelectorAll('td')[1].textContent.trim()
                            : '';
                    });
                    var identityEl = document.getElementById('editBdIdentity');
                    var superiorEl = document.getElementById('editBdSuperior');
                    var identity = identityEl ? identityEl.value.trim() : '';
                    var superior = superiorEl ? superiorEl.value.trim() : '';
                    var excludeName = pm.currentEditRow
                        ? pm.currentEditRow.querySelectorAll('td')[1].textContent.trim()
                        : '';
                    refreshBdSuperiorSelect(
                        'editBdSuperior',
                        'editBdSuperiorDropdown',
                        identity,
                        superior,
                        excludeName
                    );
                    var editNameCnt = document.getElementById('editBdNameCharCount');
                    var editNameInp = document.getElementById('editBdName');
                    if (editNameCnt && editNameInp) {
                        editNameCnt.textContent = String((editNameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'editBdName', message: '请输入BD姓名', required: true },
                    { id: 'editBdPhone', message: '请输入BD手机', required: true },
                    { id: 'editBdSmsCode', message: '请输入6位数字验证码', required: true },
                    { id: 'editBdCategory', message: '请选择BD分类', required: true },
                    { id: 'editBdIdentity', message: '请选择BD身份', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    var phoneRaw = getBdPhoneRawFromRow(row);
                    return {
                        editBdId: c[0].textContent.trim(),
                        editBdName: c[1].textContent.trim(),
                        editBdPhone: phoneRaw || c[2].textContent.trim(),
                        editBdCategory: c[3].textContent.trim(),
                        editBdIdentity: c[4].textContent.trim(),
                        editBdSuperior: c[5].textContent.trim() === '—' ? '' : c[5].textContent.trim(),
                        editBdSmsCode: ''
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var raw = validateBdPhoneAndSms('editBdPhone', 'editBdSmsCode');
                    if (!raw) return false;
                    var masked = maskBdPhoneForCell(raw);
                    var superiorVal = document.getElementById('editBdSuperior').value.trim();
                    pm.updateTableRow(row, {
                        1: document.getElementById('editBdName').value.trim(),
                        2: masked,
                        3: document.getElementById('editBdCategory').value.trim(),
                        4: document.getElementById('editBdIdentity').value.trim(),
                        5: superiorVal || '—'
                    });
                    row.setAttribute('data-bd-phone-raw', raw);
                    pm.decorateDetailLinkCell(row);
                    showToast('BD 资料已保存（演示）', 'success');
                    pm.currentEditRow = null;
                },
                onDetailModeChange: function (isDetail) {
                    var smsGroup = document.getElementById('editBdSmsCode');
                    if (smsGroup && smsGroup.closest) {
                        smsGroup.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                    }
                    var smsBtn = document.getElementById('editBdSmsBtn');
                    if (smsBtn) smsBtn.style.display = isDetail ? 'none' : '';
                }
            }
        });
        pm.init();
        setupBdPromoterModalShell(pm, 'mdmBdAdd', 'add', '添加BD推广员', 'mdmBdAddSaveBtn');
        setupBdPromoterModalShell(pm, 'mdmBdEdit', 'edit', '编辑BD推广员', 'mdmBdEditSaveBtn');
        setupPeopleSmsCodeInputs(['bdSmsCode', 'editBdSmsCode']);
        bindPeopleSmsButtons();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qBdCategory', 'qBdIdentity', 'qEnabled'],
            filterFn: bdFilter
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            refreshBdBindWarehouseLinksInTable();
        }, 0);
    }

    function showMdmPeopleWarmConfirm(message, onOk) {
        var existing = document.getElementById('mdmPeopleWarmConfirm');
        if (existing) existing.remove();

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
        backdrop.id = 'mdmPeopleWarmConfirm';

        function hide() {
            if (backdrop.parentNode) backdrop.remove();
        }

        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--confirm">' +
            '<div class="erp-modal__header">' +
            '<h2 class="erp-modal__title">温馨提示</h2>' +
            '<div class="erp-modal__header-actions">' +
            '<button type="button" class="erp-modal__header-btn" id="mdmPeopleWarmCloseX" title="关闭" aria-label="关闭">&times;</button>' +
            '</div></div>' +
            '<div class="erp-modal__body">' +
            '<div class="erp-modal-confirm__row">' +
            '<div class="erp-modal-confirm__icon">!</div>' +
            '<div class="erp-modal-confirm__msg" id="mdmPeopleWarmMsg"></div>' +
            '</div></div>' +
            '<div class="erp-modal__footer">' +
            '<button type="button" class="erp-btn" id="mdmPeopleWarmCancel">取消</button>' +
            '<button type="button" class="erp-btn erp-btn--primary" id="mdmPeopleWarmOk">确定</button>' +
            '</div></div>';

        document.body.appendChild(backdrop);
        document.getElementById('mdmPeopleWarmMsg').textContent = message;

        document.getElementById('mdmPeopleWarmCancel').addEventListener('click', hide);
        document.getElementById('mdmPeopleWarmCloseX').addEventListener('click', hide);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) hide();
        });
        document.getElementById('mdmPeopleWarmOk').addEventListener('click', function () {
            hide();
            if (typeof onOk === 'function') onOk();
        });
    }

    function buildPeopleDisableConfirmMessage(roleLabel, status) {
        var st = String(status || '').trim();
        var actionWord = st === '禁用' ? '启用' : '停用';
        return '确定将此' + roleLabel + '设为' + actionWord + '？';
    }

    function applyPeopleDisableToggle(row, status, page, cfg) {
        var st = String(status || '').trim();
        var next = st === '禁用' ? '开启' : '禁用';
        var col = cfg.statusColumnIndex;
        showMdmPeopleWarmConfirm(buildPeopleDisableConfirmMessage(cfg.roleLabel, status), function () {
            var updates = {};
            updates[col] = { value: next, isStatus: true };
            page.updateTableRow(row, updates);
            page.refreshDisableToggleLabel(row);
            if (typeof showToast === 'function') {
                showToast(next === '开启' ? cfg.enabledToast : cfg.disabledToast, 'success');
            }
        });
    }

    function getCurrentLinkedOrgName() {
        if (typeof getCurrentUser === 'function') {
            var user = getCurrentUser();
            if (user) {
                var org =
                    user.orgName || user.organization || user.companyName || user.company || user.org;
                if (org && String(org).trim()) return String(org).trim();
            }
        }
        return '上海冷丰科技有限公司';
    }

    function purchaserFilter(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var qName = (document.getElementById('qPersonName') || {}).value.trim();
        var qPhoneRaw = ((document.getElementById('qPhone') || {}).value || '').replace(/\D/g, '');
        var qEn = (document.getElementById('qEnabled') || {}).value.trim();
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 7) return;
            var ok = true;
            if (qName && cells[1].textContent.trim().indexOf(qName) === -1) ok = false;
            if (qPhoneRaw) {
                var phTxt = cells[2].textContent.trim();
                var phDig = phTxt.replace(/\D/g, '');
                if (phDig.indexOf(qPhoneRaw) === -1 && phTxt.indexOf(qPhoneRaw) === -1) ok = false;
            }
            var stTxt = (cells[5].querySelector('.status') || {}).textContent.trim();
            if (qEn === 'on' && stTxt !== '开启') ok = false;
            if (qEn === 'off' && stTxt !== '禁用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    function initPeoplePurchaser() {
        var fields = buildPeopleRoleFields({
            idKey: 'purId',
            idLabel: '采购员ID',
            nameLabel: '采购员姓名',
            nameAddId: 'purName',
            nameEditId: 'editPurName',
            nameAddCounterId: 'purNameCharCount',
            nameEditCounterId: 'editPurNameCharCount',
            phoneLabel: '手机号码',
            phoneAddId: 'purAddPhone',
            phoneEditId: 'editPurPhone',
            smsBtnAddId: 'purSmsBtn',
            smsBtnEditId: 'editPurSmsBtn',
            smsCodeKey: 'purSmsCode'
        });
        var pm = new PageManager({
            entityName: '采购员',
            addModalTitle: '添加采购员',
            editModalTitle: '编辑采购员',
            modalWidth: '520px',
            checkboxColumn: false,
            statusColumnIndex: 5,
            actionColumnMode: 'disableTogglePlusEdit',
            disableToggleVerb: 'openClose',
            onDisableToggle: function (row, status, page) {
                applyPeopleDisableToggle(row, status, page, {
                    roleLabel: '采购员',
                    statusColumnIndex: 5,
                    enabledToast: '已开启采购员（演示）',
                    disabledToast: '已禁用采购员（演示）'
                });
            },
            fields: fields,
            addModal: {
                modalId: 'mdmPurAdd',
                cancelBtnId: 'mdmPurAddCancelBtn',
                saveBtnId: 'mdmPurAddSaveBtn',
                triggerBtnId: 'mdmPeoplePurchaserAddBtn',
                onOpen: function () {
                    var nameCnt = document.getElementById('purNameCharCount');
                    var nameInp = document.getElementById('purName');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'purName', message: '请输入采购员姓名', required: true },
                    { id: 'purAddPhone', message: '请输入手机号码', required: true },
                    { id: 'purSmsCode', message: '请输入6位数字验证码', required: true }
                ],
                onSave: function () {
                    var raw = validatePeoplePhoneAndSms('purAddPhone', 'purSmsCode', '手机号码');
                    if (!raw) return false;
                    var id = 'PUR-' + String(Date.now()).slice(-6);
                    var masked = maskBdPhoneForCell(raw);
                    var linkedOrg = getCurrentLinkedOrgName();
                    var newRow = pm.addTableRow({
                        cells: [
                            id,
                            document.getElementById('purName').value.trim(),
                            masked,
                            linkedOrg,
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    if (newRow) {
                        newRow.setAttribute('data-purchaser-phone-raw', raw);
                        newRow.setAttribute('data-linked-org', linkedOrg);
                    }
                    showToast('已添加采购员（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmPurEdit',
                cancelBtnId: 'mdmPurEditCancelBtn',
                saveBtnId: 'mdmPurEditSaveBtn',
                onOpen: function () {
                    var nameCnt = document.getElementById('editPurNameCharCount');
                    var nameInp = document.getElementById('editPurName');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'editPurName', message: '请输入采购员姓名', required: true },
                    { id: 'editPurPhone', message: '请输入手机号码', required: true },
                    { id: 'editPurSmsCode', message: '请输入6位数字验证码', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    var phoneRaw = getPeoplePhoneRawFromRow(row);
                    return {
                        editPurId: c[0].textContent.trim(),
                        editPurName: c[1].textContent.trim(),
                        editPurPhone: phoneRaw || c[2].textContent.trim(),
                        editPurSmsCode: ''
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var raw = validatePeoplePhoneAndSms('editPurPhone', 'editPurSmsCode', '手机号码');
                    if (!raw) return false;
                    var masked = maskBdPhoneForCell(raw);
                    pm.updateTableRow(row, {
                        1: document.getElementById('editPurName').value.trim(),
                        2: masked
                    });
                    row.setAttribute('data-purchaser-phone-raw', raw);
                    showToast('采购员资料已保存（演示）', 'success');
                    pm.currentEditRow = null;
                },
                onDetailModeChange: function (isDetail) {
                    var smsGroup = document.getElementById('editPurSmsCode');
                    if (smsGroup && smsGroup.closest) {
                        smsGroup.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                    }
                    var smsBtn = document.getElementById('editPurSmsBtn');
                    if (smsBtn) smsBtn.style.display = isDetail ? 'none' : '';
                }
            }
        });
        pm.init();
        setupPeopleModalShell(pm, 'mdmPurAdd', 'add', '添加采购员', 'mdmPurAddSaveBtn', [
            { inputId: 'purName', counterId: 'purNameCharCount' },
            { inputId: 'editPurName', counterId: 'editPurNameCharCount' }
        ]);
        setupPeopleModalShell(pm, 'mdmPurEdit', 'edit', '编辑采购员', 'mdmPurEditSaveBtn', [
            { inputId: 'purName', counterId: 'purNameCharCount' },
            { inputId: 'editPurName', counterId: 'editPurNameCharCount' }
        ]);
        setupPeopleSmsCodeInputs(['purSmsCode', 'editPurSmsCode']);
        bindPeopleSmsButtons();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qEnabled'],
            filterFn: purchaserFilter
        });
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
        var fields = buildPeopleRoleFields({
            idKey: 'did',
            idLabel: '司机ID',
            nameLabel: '姓名',
            nameAddId: 'dname',
            nameEditId: 'editDname',
            nameAddCounterId: 'dnameCharCount',
            nameEditCounterId: 'editDnameCharCount',
            phoneLabel: '手机号码',
            phoneAddId: 'drvAddPhone',
            phoneEditId: 'editDrvPhone',
            smsBtnAddId: 'drvSmsBtn',
            smsBtnEditId: 'editDrvSmsBtn',
            smsCodeKey: 'drvSmsCode'
        });
        var pm = new PageManager({
            entityName: '司机',
            addModalTitle: '添加司机',
            editModalTitle: '编辑司机',
            modalWidth: '520px',
            checkboxColumn: false,
            statusColumnIndex: 8,
            actionColumnMode: 'disableTogglePlusEdit',
            disableToggleVerb: 'openClose',
            onDisableToggle: function (row, status, page) {
                applyPeopleDisableToggle(row, status, page, {
                    roleLabel: '司机',
                    statusColumnIndex: 8,
                    enabledToast: '已开启司机（演示）',
                    disabledToast: '已禁用司机（演示）'
                });
            },
            fields: fields,
            detailView: { enabled: true, columnIndex: 1, linkClass: 'subject-name-link' },
            addModal: {
                modalId: 'mdmDrvAdd',
                cancelBtnId: 'mdmDrvAddCancelBtn',
                saveBtnId: 'mdmDrvAddSaveBtn',
                triggerBtnId: 'mdmPeopleDrvAddBtn',
                onOpen: function () {
                    var nameCnt = document.getElementById('dnameCharCount');
                    var nameInp = document.getElementById('dname');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'dname', message: '请输入姓名', required: true },
                    { id: 'drvAddPhone', message: '请输入手机号码', required: true },
                    { id: 'drvSmsCode', message: '请输入6位数字验证码', required: true }
                ],
                onSave: function () {
                    var raw = validatePeoplePhoneAndSms('drvAddPhone', 'drvSmsCode', '手机号码');
                    if (!raw) return false;
                    var id = 'DRV' + String(Date.now()).slice(-8);
                    var masked = maskBdPhoneForCell(raw);
                    var newRow = pm.addTableRow({
                        cells: [
                            id,
                            document.getElementById('dname').value.trim(),
                            masked,
                            '城配车队-沪',
                            '在岗',
                            '上海冷丰科技有限公司',
                            masked,
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    if (newRow) {
                        newRow.setAttribute('data-dept-key', 'fleet_sh');
                        newRow.setAttribute('data-phone-raw', raw);
                    }
                    showToast('已添加司机（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmDrvEdit',
                cancelBtnId: 'mdmDrvEditCancelBtn',
                saveBtnId: 'mdmDrvEditSaveBtn',
                onOpen: function () {
                    var nameCnt = document.getElementById('editDnameCharCount');
                    var nameInp = document.getElementById('editDname');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'editDname', message: '请输入姓名', required: true },
                    { id: 'editDrvPhone', message: '请输入手机号码', required: true },
                    { id: 'editDrvSmsCode', message: '请输入6位数字验证码', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    var phoneRaw = getPeoplePhoneRawFromRow(row);
                    return {
                        editDid: c[0].textContent.trim(),
                        editDname: c[1].textContent.trim(),
                        editDrvPhone: phoneRaw || c[2].textContent.trim(),
                        editDrvSmsCode: ''
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var raw = validatePeoplePhoneAndSms('editDrvPhone', 'editDrvSmsCode', '手机号码');
                    if (!raw) return false;
                    var masked = maskBdPhoneForCell(raw);
                    pm.updateTableRow(row, {
                        1: document.getElementById('editDname').value.trim(),
                        2: masked,
                        6: masked
                    });
                    row.setAttribute('data-phone-raw', raw);
                    pm.decorateDetailLinkCell(row);
                    showToast('司机信息已保存（演示）', 'success');
                    pm.currentEditRow = null;
                },
                onDetailModeChange: function (isDetail) {
                    var smsGroup = document.getElementById('editDrvSmsCode');
                    if (smsGroup && smsGroup.closest) {
                        smsGroup.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                    }
                    var smsBtn = document.getElementById('editDrvSmsBtn');
                    if (smsBtn) smsBtn.style.display = isDetail ? 'none' : '';
                }
            }
        });
        pm.init();
        setupPeopleModalShell(pm, 'mdmDrvAdd', 'add', '添加司机', 'mdmDrvAddSaveBtn', [
            { inputId: 'dname', counterId: 'dnameCharCount' }
        ]);
        setupPeopleModalShell(pm, 'mdmDrvEdit', 'edit', '编辑司机', 'mdmDrvEditSaveBtn', [
            { inputId: 'editDname', counterId: 'editDnameCharCount' }
        ]);
        setupPeopleSmsCodeInputs(['drvSmsCode', 'editDrvSmsCode']);
        bindPeopleSmsButtons();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qDept', 'qJobStatus', 'qEnabled'],
            filterFn: rolePeopleFilter
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initPeopleAnchor() {
        var fields = buildPeopleRoleFields({
            idKey: 'aid',
            idLabel: '主播ID',
            nameLabel: '姓名',
            nameAddId: 'aname',
            nameEditId: 'editAname',
            nameAddCounterId: 'anameCharCount',
            nameEditCounterId: 'editAnameCharCount',
            phoneLabel: '手机号码',
            phoneAddId: 'ancAddPhone',
            phoneEditId: 'editAncPhone',
            smsBtnAddId: 'ancSmsBtn',
            smsBtnEditId: 'editAncSmsBtn',
            smsCodeKey: 'ancSmsCode'
        });
        var pm = new PageManager({
            entityName: '主播',
            addModalTitle: '添加主播',
            editModalTitle: '编辑主播',
            modalWidth: '520px',
            checkboxColumn: false,
            statusColumnIndex: 8,
            actionColumnMode: 'disableTogglePlusEdit',
            disableToggleVerb: 'openClose',
            onDisableToggle: function (row, status, page) {
                applyPeopleDisableToggle(row, status, page, {
                    roleLabel: '主播',
                    statusColumnIndex: 8,
                    enabledToast: '已开启主播（演示）',
                    disabledToast: '已禁用主播（演示）'
                });
            },
            fields: fields,
            detailView: { enabled: true, columnIndex: 1, linkClass: 'subject-name-link' },
            addModal: {
                modalId: 'mdmAncAdd',
                cancelBtnId: 'mdmAncAddCancelBtn',
                saveBtnId: 'mdmAncAddSaveBtn',
                triggerBtnId: 'mdmPeopleAncAddBtn',
                onOpen: function () {
                    var nameCnt = document.getElementById('anameCharCount');
                    var nameInp = document.getElementById('aname');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'aname', message: '请输入姓名', required: true },
                    { id: 'ancAddPhone', message: '请输入手机号码', required: true },
                    { id: 'ancSmsCode', message: '请输入6位数字验证码', required: true }
                ],
                onSave: function () {
                    var raw = validatePeoplePhoneAndSms('ancAddPhone', 'ancSmsCode', '手机号码');
                    if (!raw) return false;
                    var id = 'ANC' + String(Date.now()).slice(-8);
                    var masked = maskBdPhoneForCell(raw);
                    var newRow = pm.addTableRow({
                        cells: [
                            id,
                            document.getElementById('aname').value.trim(),
                            masked,
                            '内容运营中心',
                            '在岗',
                            '上海冷丰科技有限公司',
                            masked,
                            pm.getCurrentTimeStr(),
                            { value: '开启', isStatus: true }
                        ]
                    });
                    if (newRow) {
                        newRow.setAttribute('data-dept-key', 'content');
                        newRow.setAttribute('data-phone-raw', raw);
                    }
                    showToast('已添加主播（演示）', 'success');
                }
            },
            editModal: {
                modalId: 'mdmAncEdit',
                cancelBtnId: 'mdmAncEditCancelBtn',
                saveBtnId: 'mdmAncEditSaveBtn',
                onOpen: function () {
                    var nameCnt = document.getElementById('editAnameCharCount');
                    var nameInp = document.getElementById('editAname');
                    if (nameCnt && nameInp) {
                        nameCnt.textContent = String((nameInp.value || '').length) + ' / 20';
                    }
                },
                validations: [
                    { id: 'editAname', message: '请输入姓名', required: true },
                    { id: 'editAncPhone', message: '请输入手机号码', required: true },
                    { id: 'editAncSmsCode', message: '请输入6位数字验证码', required: true }
                ],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    var phoneRaw = getPeoplePhoneRawFromRow(row);
                    return {
                        editAid: c[0].textContent.trim(),
                        editAname: c[1].textContent.trim(),
                        editAncPhone: phoneRaw || c[2].textContent.trim(),
                        editAncSmsCode: ''
                    };
                },
                onSave: function () {
                    if (!pm.currentEditRow) return;
                    var row = pm.currentEditRow;
                    var raw = validatePeoplePhoneAndSms('editAncPhone', 'editAncSmsCode', '手机号码');
                    if (!raw) return false;
                    var masked = maskBdPhoneForCell(raw);
                    pm.updateTableRow(row, {
                        1: document.getElementById('editAname').value.trim(),
                        2: masked,
                        6: masked
                    });
                    row.setAttribute('data-phone-raw', raw);
                    pm.decorateDetailLinkCell(row);
                    showToast('主播信息已保存（演示）', 'success');
                    pm.currentEditRow = null;
                },
                onDetailModeChange: function (isDetail) {
                    var smsGroup = document.getElementById('editAncSmsCode');
                    if (smsGroup && smsGroup.closest) {
                        smsGroup.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                    }
                    var smsBtn = document.getElementById('editAncSmsBtn');
                    if (smsBtn) smsBtn.style.display = isDetail ? 'none' : '';
                }
            }
        });
        pm.init();
        setupPeopleModalShell(pm, 'mdmAncAdd', 'add', '添加主播', 'mdmAncAddSaveBtn', [
            { inputId: 'aname', counterId: 'anameCharCount' }
        ]);
        setupPeopleModalShell(pm, 'mdmAncEdit', 'edit', '编辑主播', 'mdmAncEditSaveBtn', [
            { inputId: 'editAname', counterId: 'editAnameCharCount' }
        ]);
        setupPeopleSmsCodeInputs(['ancSmsCode', 'editAncSmsCode']);
        bindPeopleSmsButtons();
        bindSimpleFilter(pm, {
            resetFields: ['qPersonName', 'qPhone', 'qDept', 'qJobStatus', 'qEnabled'],
            filterFn: rolePeopleFilter
        });
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function syncCMemberRowsToTable() {
        var MEMBER_LIST_KEY = 'mdm_member_c_list_v1';
        var PROFILE_KEY = 'ua_member_profile_v1';
        var C_MEMBER_ID = 'UC10001';
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        function maskPhone(phone) {
            var s = String(phone || '').replace(/\D/g, '');
            if (s.length < 7) return phone || '—';
            return s.slice(0, 3) + '****' + s.slice(-4);
        }

        function loadSyncedMembers() {
            var list = [];
            try {
                var raw = localStorage.getItem(MEMBER_LIST_KEY);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) list = parsed;
                }
            } catch (e) { /* ignore */ }

            /* 兼容：仅保存过 C 端资料、尚未写入会员列表时，现场补一条 */
            if (!list.length) {
                try {
                    var pref = localStorage.getItem(PROFILE_KEY);
                    if (pref) {
                        var profile = JSON.parse(pref) || {};
                        var nick = profile.nickname || '宁静致远';
                        var phone = profile.displayPhone || '15589069061';
                        var levelName = '普通会员';
                        try {
                            var levelsRaw = localStorage.getItem('mdm_member_level_list_v1');
                            var levels = levelsRaw ? JSON.parse(levelsRaw) : null;
                            if (Array.isArray(levels) && levels.length) {
                                var growth = 1485;
                                var sorted = levels
                                    .filter(function (it) {
                                        return it && it.status !== '禁用';
                                    })
                                    .sort(function (a, b) {
                                        return Number(a.growthValue || 0) - Number(b.growthValue || 0);
                                    });
                                sorted.forEach(function (lv) {
                                    if (growth >= Number(lv.growthValue || 0)) levelName = lv.name;
                                });
                            }
                        } catch (e2) { /* ignore */ }
                        list = [
                            {
                                id: C_MEMBER_ID,
                                nickname: nick,
                                avatarText: String(nick).charAt(0) || '会',
                                phone: phone,
                                phoneMasked: maskPhone(phone),
                                gender: '未知',
                                isMember: '是',
                                level: levelName,
                                tags: 'C端注册',
                                source: '微信小程序',
                                bindMethod: '手机',
                                channelCount: '1',
                                points: '500',
                                satisMinutes: '0',
                                satisFeedback: '0',
                                growthScore: '1485',
                                amount: '0.00',
                                orderCount: '0',
                                lastConsume: '—',
                                status: '正常',
                                birthday: profile.birthday || '',
                                district: profile.district || ''
                            }
                        ];
                        localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(list));
                    }
                } catch (e3) { /* ignore */ }
            }
            return list;
        }

        function buildRow(m) {
            var tr = document.createElement('tr');
            tr.setAttribute('data-c-member', '1');
            tr.setAttribute('data-member-id', m.id || C_MEMBER_ID);
            if (m.birthday) tr.setAttribute('data-birthday', m.birthday);
            if (m.district) tr.setAttribute('data-district', m.district);
            if (m.phone) tr.setAttribute('data-phone-full', m.phone);
            tr.setAttribute('data-member-status', m.status || '正常');

            var phoneShow = m.phoneMasked || maskPhone(m.phone) || m.phone || '—';
            var avatarText = m.avatarText || String(m.nickname || '会').charAt(0);
            var cells = [
                m.id || C_MEMBER_ID,
                m.nickname || '—',
                null,
                phoneShow,
                m.gender || '未知',
                m.isMember || '是',
                m.level || '普通会员',
                m.tags || 'C端注册',
                m.source || '微信小程序',
                m.bindMethod || '手机',
                m.channelCount || '1',
                m.points || '500',
                m.satisMinutes || '0',
                m.satisFeedback || '0',
                m.growthScore || '1485',
                m.amount || '0.00',
                m.orderCount || '0',
                m.lastConsume || '—',
                null,
                null
            ];
            cells.forEach(function (val, idx) {
                var td = document.createElement('td');
                if (idx === 2) {
                    var span = document.createElement('span');
                    span.className = 'mdm-list-avatar';
                    span.textContent = avatarText;
                    td.appendChild(span);
                } else if (idx === 18) {
                    var st = document.createElement('span');
                    var stTxt = m.status || '正常';
                    if (stTxt === '黑名单') st.className = 'status blacklist';
                    else if (stTxt === '注销' || stTxt === '已注销') st.className = 'status canceled';
                    else if (stTxt === '注销中' || stTxt === '审核中') st.className = 'status cancel-pending';
                    else st.className = 'status active';
                    st.textContent = stTxt === '已注销' ? '注销' : stTxt;
                    td.appendChild(st);
                } else if (idx === 19) {
                    td.className = 'action-links';
                    if (window.MdmMemberBlacklist && window.MdmMemberBlacklist.buildMemberListActions) {
                        td.innerHTML = window.MdmMemberBlacklist.buildMemberListActions(m.status || '正常');
                    } else {
                        var stNow = m.status || '正常';
                        if (stNow === '注销' || stNow === '已注销' || stNow === '注销中' || stNow === '审核中') {
                            td.innerHTML = '<a href="#" class="mdm-mem-detail">查看详情</a>';
                        } else {
                            var actions =
                                '<a href="#" class="mdm-mem-detail">查看详情</a>' +
                                '<a href="#" class="mdm-mem-coupon">优惠券</a>' +
                                '<a href="#" class="mdm-mem-points">调整积分</a>' +
                                '<a href="#" class="mdm-mem-growth">调整成长值</a>';
                            if (stNow === '正常') actions += '<a href="#" class="mdm-mem-blacklist">拉黑</a>';
                            else if (stNow === '黑名单') actions += '<a href="#" class="mdm-mem-restore">恢复</a>';
                            td.innerHTML = actions;
                        }
                    }
                } else {
                    td.textContent = val;
                }
                tr.appendChild(td);
            });
            return tr;
        }

        var members = loadSyncedMembers();
        if (!members.length) return;

        /* 先移除旧的 C 端同步行，再按最新数据插入表头 */
        tbody.querySelectorAll('tr[data-c-member="1"]').forEach(function (tr) {
            tr.remove();
        });
        members
            .slice()
            .reverse()
            .forEach(function (m) {
                if (!m || !m.id) return;
                tbody.insertBefore(buildRow(m), tbody.firstChild);
            });
    }

    /** 将注销申请/已注销会员同步进会员列表，并校正操作列（注销仅查看详情） */
    function ensureCanceledMembersInList() {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        function normalizeCancelStatus(st) {
            st = String(st || '').trim();
            if (st === '已注销' || st === '注销') return '注销';
            if (st === '审核中' || st === '注销中') return '注销中';
            if (st === '已驳回') return '';
            return st;
        }

        function findRowById(id) {
            var found = null;
            tbody.querySelectorAll('tr').forEach(function (tr) {
                var cell = tr.querySelector('td');
                if (cell && cell.textContent.trim() === String(id)) found = tr;
            });
            return found;
        }

        function applyActions(tr, status) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 20) return;
            cells[19].className = 'action-links';
            if (window.MdmMemberBlacklist && window.MdmMemberBlacklist.buildMemberListActions) {
                cells[19].innerHTML = window.MdmMemberBlacklist.buildMemberListActions(status);
            } else if (status === '注销' || status === '注销中') {
                cells[19].innerHTML = '<a href="#" class="mdm-mem-detail">查看详情</a>';
            }
        }

        /* 校正现有行：注销 / 注销中仅保留查看详情 */
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 20) return;
            var stEl = cells[18].querySelector('.status');
            var stTxt = stEl
                ? stEl.textContent.trim()
                : (tr.getAttribute('data-member-status') || '');
            if (stTxt === '注销' || stTxt === '已注销' || stTxt === '注销中' || stTxt === '审核中') {
                var norm = normalizeCancelStatus(stTxt) || stTxt;
                tr.setAttribute('data-member-status', norm);
                if (stEl) {
                    stEl.className = norm === '注销中' ? 'status cancel-pending' : 'status canceled';
                    stEl.textContent = norm;
                }
                applyActions(tr, norm);
            }
        });

        var cancelList = [];
        try {
            if (window.MdmMemberCancel && typeof window.MdmMemberCancel.loadList === 'function') {
                cancelList = window.MdmMemberCancel.loadList() || [];
            } else {
                var raw = localStorage.getItem('mdm_member_cancel_list_v1');
                cancelList = raw ? JSON.parse(raw) : [];
            }
        } catch (e) {
            cancelList = [];
        }
        if (!Array.isArray(cancelList)) return;

        cancelList.forEach(function (item) {
            if (!item || !item.id) return;
            var status = normalizeCancelStatus(item.status);
            if (!status) return;
            var existing = findRowById(item.id);
            if (existing) {
                existing.setAttribute('data-member-status', status);
                var cells = existing.querySelectorAll('td');
                if (cells.length >= 20) {
                    var st = cells[18].querySelector('.status') || document.createElement('span');
                    st.className = status === '注销中' ? 'status cancel-pending' : 'status canceled';
                    st.textContent = status;
                    if (!st.parentNode) {
                        cells[18].innerHTML = '';
                        cells[18].appendChild(st);
                    }
                    applyActions(existing, status);
                }
                return;
            }
            var m = {
                id: item.id,
                nickname: item.nickname || '—',
                avatarText: String(item.nickname || '会').charAt(0),
                phone: item.phone || '—',
                phoneMasked: item.phone || '—',
                gender: '未知',
                isMember: '是',
                level: '普通会员',
                tags: '—',
                source: item.channel || '—',
                bindMethod: '—',
                channelCount: '1',
                points: '0',
                satisMinutes: '0',
                satisFeedback: '0',
                growthScore: '0',
                amount: '0.00',
                orderCount: '0',
                lastConsume: '—',
                status: status
            };
            var tr = document.createElement('tr');
            tr.setAttribute('data-member-status', status);
            tr.setAttribute('data-cancel-synced', '1');
            var phoneShow = m.phoneMasked || m.phone || '—';
            var avatarText = m.avatarText;
            [
                m.id, m.nickname, null, phoneShow, m.gender, m.isMember, m.level, m.tags,
                m.source, m.bindMethod, m.channelCount, m.points, m.satisMinutes, m.satisFeedback,
                m.growthScore, m.amount, m.orderCount, m.lastConsume, null, null
            ].forEach(function (val, idx) {
                var td = document.createElement('td');
                if (idx === 2) {
                    var span = document.createElement('span');
                    span.className = 'mdm-list-avatar';
                    span.textContent = avatarText;
                    td.appendChild(span);
                } else if (idx === 18) {
                    var st2 = document.createElement('span');
                    st2.className = status === '注销中' ? 'status cancel-pending' : 'status canceled';
                    st2.textContent = status;
                    td.appendChild(st2);
                } else if (idx === 19) {
                    td.className = 'action-links';
                    td.innerHTML = '<a href="#" class="mdm-mem-detail">查看详情</a>';
                } else {
                    td.textContent = val;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function initMemberC() {
        var pm = new PageManager({
            entityName: '会员管理',
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
                },
                {
                    selector: '.mdm-mem-growth',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (window.MdmMemberCUi) {
                            window.MdmMemberCUi.openGrowthFromRow(el.closest('tr'));
                        }
                    }
                },
                {
                    selector: '.mdm-mem-blacklist',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (window.MdmMemberBlacklist) {
                            window.MdmMemberBlacklist.openBlacklistFromMember(el.closest('tr'));
                        }
                    }
                },
                {
                    selector: '.mdm-mem-restore',
                    handler: function (e, el) {
                        e.preventDefault();
                        if (window.MdmMemberBlacklist) {
                            window.MdmMemberBlacklist.openRestoreFromMember(el.closest('tr'));
                        }
                    }
                }
            ]
        });
        // 将 C 端已保存会员资料同步进列表（localStorage）
        syncCMemberRowsToTable();
        pm.init();
        if (window.MdmMemberBlacklist) {
            window.MdmMemberBlacklist.init();
        }
        bindSimpleFilter(pm, {
            resetFields: ['qMemberId', 'qNickname', 'qBindWay', 'qPhone', 'qMemberLevel', 'qMemberTag', 'qMemberStatus'],
            filterFn: function (p) {
                var tbody = document.getElementById(p.config.tableBodyId);
                if (!tbody) return;
                var qId = (document.getElementById('qMemberId') || {}).value.trim();
                var qNick = (document.getElementById('qNickname') || {}).value.trim();
                var qB = (document.getElementById('qBindWay') || {}).value.trim();
                var qP = ((document.getElementById('qPhone') || {}).value || '').replace(/\D/g, '');
                var qLevel = (document.getElementById('qMemberLevel') || {}).value.trim();
                var qTag = (document.getElementById('qMemberTag') || {}).value.trim();
                var qSt = (document.getElementById('qMemberStatus') || {}).value.trim();
                tbody.querySelectorAll('tr').forEach(function (tr) {
                    var c = tr.querySelectorAll('td');
                    if (c.length < 18) return;
                    var ok = true;
                    if (qId && c[0].textContent.trim().indexOf(qId) === -1) ok = false;
                    if (qNick && c[1].textContent.trim().indexOf(qNick) === -1) ok = false;
                    if (qB && c[9].textContent.trim() !== qB) ok = false;
                    if (qP && c[3].textContent.replace(/\D/g, '').indexOf(qP) === -1) ok = false;
                    if (qLevel && c[6].textContent.trim() !== qLevel) ok = false;
                    if (qTag && c[7].textContent.trim().indexOf(qTag) === -1) ok = false;
                    if (qSt) {
                        var stEl = c[18].querySelector('.status');
                        var stTxt = stEl ? stEl.textContent.trim() : (tr.getAttribute('data-member-status') || '');
                        if (stTxt !== qSt) ok = false;
                    }
                    tr.style.display = ok ? '' : 'none';
                });
                p.refreshPagination();
            }
        });
        /* 会员列表默认展示全部状态（含黑名单 / 注销中 / 注销） */
        try {
            ensureCanceledMembersInList();
            var qBtn0 = document.getElementById('btnFilterQuery');
            if (qBtn0) qBtn0.click();
        } catch (eSt0) { /* ignore */ }
        // 会员等级下拉：优先读取后台已配置等级
        try {
            var levelElInit = document.getElementById('qMemberLevel');
            if (levelElInit) {
                var levelRaw = localStorage.getItem('mdm_member_level_list_v1');
                var levelList = levelRaw ? JSON.parse(levelRaw) : null;
                if (Array.isArray(levelList) && levelList.length) {
                    var keep = levelElInit.value || '';
                    levelElInit.innerHTML = '<option value="">全部</option>';
                    levelList
                        .slice()
                        .sort(function (a, b) {
                            return Number(a.growthValue || 0) - Number(b.growthValue || 0);
                        })
                        .forEach(function (item) {
                            if (!item || !item.name) return;
                            var opt = document.createElement('option');
                            opt.value = item.name;
                            opt.textContent = item.name;
                            levelElInit.appendChild(opt);
                        });
                    if (keep) levelElInit.value = keep;
                }
            }
        } catch (eLevel) { /* ignore */ }
        // 支持从会员等级 / 会员标签 / 成长值明细跳转携带筛选参数
        try {
            var params = new URLSearchParams(window.location.search || '');
            var levelParam = params.get('level');
            var tagParam = params.get('tag');
            var memberIdParam = params.get('memberId');
            var nicknameParam = params.get('nickname');
            var openDetail = params.get('detail') === '1';
            var levelEl = document.getElementById('qMemberLevel');
            var tagEl = document.getElementById('qMemberTag');
            var memberIdEl = document.getElementById('qMemberId');
            var nicknameEl = document.getElementById('qNickname');
            if (levelParam && levelEl) {
                levelEl.value = levelParam;
                if (!levelEl.value) {
                    var opt = document.createElement('option');
                    opt.value = levelParam;
                    opt.textContent = levelParam;
                    levelEl.appendChild(opt);
                    levelEl.value = levelParam;
                }
            }
            if (tagParam && tagEl) tagEl.value = tagParam;
            if (memberIdParam && memberIdEl) memberIdEl.value = memberIdParam;
            if (nicknameParam && nicknameEl) nicknameEl.value = nicknameParam;
            if (levelParam || tagParam || memberIdParam || nicknameParam) {
                var queryBtn = document.getElementById('btnFilterQuery');
                if (queryBtn) queryBtn.click();
            }
            if (openDetail && memberIdParam) {
                setTimeout(function () {
                    var tbody = document.getElementById(pm.config.tableBodyId);
                    if (!tbody || !window.MdmMemberCUi) return;
                    var target = null;
                    tbody.querySelectorAll('tr').forEach(function (tr) {
                        if (target || tr.style.display === 'none') return;
                        var idCell = tr.querySelector('td');
                        if (idCell && idCell.textContent.trim() === memberIdParam) target = tr;
                    });
                    if (target) window.MdmMemberCUi.openDetailFromRow(target);
                }, 120);
            }
        } catch (e) { /* ignore */ }
        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
        }, 0);
    }

    function initAuditStoreRegistration() {
        var pm = new PageManager({
            entityName: '入驻申请',
            checkboxColumn: false,
            fields: [],
            detailView: {
                enabled: true,
                /* 入驻方名称列：申请单号/来源/主体名称/主体类型 之后 */
                columnIndex: 4,
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
            resetFields: ['qSubjectName', 'qStoreName', 'qSubjectType', 'qAuditStatus'],
            filterFn: function (p) {
                var tbody = document.getElementById(p.config.tableBodyId);
                if (!tbody) return;
                var qS = (document.getElementById('qSubjectName') || {}).value.trim();
                var qN = (document.getElementById('qStoreName') || {}).value.trim();
                var qType = (document.getElementById('qSubjectType') || {}).value.trim();
                var qSt = (document.getElementById('qAuditStatus') || {}).value.trim();
                var map = {
                    pending: '待审核',
                    leaderPending: '待总监审核',
                    success: '审核成功',
                    failed: '审核失败'
                };
                tbody.querySelectorAll('tr').forEach(function (tr) {
                    var cells = tr.querySelectorAll('td');
                    if (cells.length < 12) return;
                    var ok = true;
                    if (qS && cells[2].textContent.trim().indexOf(qS) === -1) ok = false;
                    if (qType && cells[3].textContent.trim() !== qType) ok = false;
                    /* 入驻方名称（主体类型之后） */
                    if (qN && cells[4].textContent.trim().indexOf(qN) === -1) ok = false;
                    if (qSt && map[qSt]) {
                        var t = cells[8].querySelector('.status');
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
        initPeoplePurchaser: initPeoplePurchaser,
        initPeopleDriver: initPeopleDriver,
        initPeopleAnchor: initPeopleAnchor,
        initMemberC: initMemberC,
        initAuditStoreRegistration: initAuditStoreRegistration
    };
})();
