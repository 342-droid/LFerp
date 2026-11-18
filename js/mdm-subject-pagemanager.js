/**
 * MDM 主体中心 — PageManager 实现（与 LF-master 列表列一致：10 列数据 + 禁用/启用）
 * 列：主体ID、主体名称、绑定列、主体类型、联系人/负责人、手机、登录账号、创建时间、最后操作人、状态
 */
(function () {
    function ensureLfWarmConfirmModal() {
        if (document.getElementById('lfMdmWarmConfirm')) return;
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="lfMdmWarmConfirm" class="modal" style="display:none">' +
                '<div class="modal-content" style="width:420px">' +
                '<div class="modal-header">' +
                '<h2 class="modal-title" id="lfMdmWarmTitle">温馨提示</h2>' +
                '<span class="close" id="lfMdmWarmCloseX">&times;</span>' +
                '</div>' +
                '<div class="modal-body" style="padding:16px 20px;line-height:1.65;color:#333">' +
                '<p id="lfMdmWarmMsg" style="margin:0;white-space:pre-line"></p>' +
                '<label id="lfMdmWarmReasonLabel" hidden>操作原因<textarea id="lfMdmWarmReason" class="form-control" rows="2" maxlength="200"></textarea></label>' +
                '</div>' +
                '<div class="modal-footer">' +
                '<button type="button" class="btn btn-primary" id="lfMdmWarmOk">确定</button>' +
                '<button type="button" class="btn btn-secondary" id="lfMdmWarmCancel">取消</button>' +
                '</div></div></div>'
        );
        function hide() {
            var m = document.getElementById('lfMdmWarmConfirm');
            if (m) m.style.display = 'none';
        }
        document.getElementById('lfMdmWarmCancel').addEventListener('click', hide);
        document.getElementById('lfMdmWarmCloseX').addEventListener('click', hide);
        document.getElementById('lfMdmWarmConfirm').addEventListener('click', function (e) {
            if (e.target.id === 'lfMdmWarmConfirm') hide();
        });
    }

    function showLfWarmConfirm(message, onOk, requireReason, blockedTitle) {
        ensureLfWarmConfirmModal();
        var modal = document.getElementById('lfMdmWarmConfirm');
        var okBtn = document.getElementById('lfMdmWarmOk');
        var msgEl = document.getElementById('lfMdmWarmMsg');
        if (!modal || !okBtn || !msgEl) return;
        document.getElementById('lfMdmWarmTitle').textContent = blockedTitle || '温馨提示';
        document.getElementById('lfMdmWarmCancel').hidden = Boolean(blockedTitle);
        okBtn.textContent = blockedTitle ? '关闭' : '确定';
        var reason = document.getElementById('lfMdmWarmReason');
        document.getElementById('lfMdmWarmReasonLabel').hidden = !requireReason;
        reason.value = '';
        msgEl.textContent = message;
        modal.style.display = 'block';
        okBtn.onclick = function () {
            if (requireReason && !reason.value.trim()) {
                showToast('请输入操作原因', 'error');
                reason.focus();
                return;
            }
            modal.style.display = 'none';
            okBtn.onclick = null;
            if (typeof onOk === 'function') {
                if (requireReason) onOk(reason.value.trim());
                else onOk();
            }
        };
    }

    function filterSubjectRows(pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        if (!tbody) return;
        var ni = document.getElementById('qSubjectName');
        var ss = document.getElementById('qStatus');
        var qName = ni ? ni.value.trim() : '';
        var qSt = ss ? ss.value.trim() : '';
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var cells = tr.querySelectorAll('td');
            if (cells.length < 11) return;
            var nm = cells[1].textContent.trim();
            var st = cells[9].querySelector('.status');
            var stTxt = st ? st.textContent.trim() : '';
            var ok = true;
            if (qName && nm.indexOf(qName) === -1) ok = false;
            if ((qSt === 'normal' || qSt === 'open') && stTxt !== '正常' && stTxt !== '开启') ok = false;
            if (qSt === 'frozen' && stTxt !== '冻结') ok = false;
            if ((qSt === 'stopped' || qSt === 'disabled') && stTxt !== '停用' && stTxt !== '禁用') ok = false;
            tr.style.display = ok ? '' : 'none';
        });
        pm.refreshPagination();
    }

    /**
     * @param {{
     *   entityName?: string,
     *   pageLabel: string,
     *   subjectTypeLabel: string,
     *   bindColumnLabel?: string,
     *   contactPersonLabel?: string,
     *   showBindBd?: boolean,
     *   compactStoreSubjectForm?: boolean, 为 true 时不展示登录账号（可与验证码并存）
     *   omitSmsAndLoginAccount?: boolean, 添加商家表单同时去掉验证码与登录账号
     *   disableConfirmMessage?: string,
     *   addModalId?: string,
     *   editModalId?: string,
     *   pageSize?: number,
     *   addButtonLabel?: string,
     *   subjectTypeOptions?: string[],
     *   enableSubjectOnboarding?: boolean
     * }} spec
     */
    function nextSubjectRowId(prefix, pm) {
        var tbody = document.getElementById(pm.config.tableBodyId);
        var max = 0;
        if (!tbody) return prefix + '-SUB-001';
        var re = new RegExp(
            '^' + String(prefix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-SUB-(\\d+)$'
        );
        tbody.querySelectorAll('tr').forEach(function (tr) {
            var c0 = tr.querySelectorAll('td')[0];
            if (!c0) return;
            var m = String(c0.textContent || '').trim().match(re);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return prefix + '-SUB-' + String(max + 1).padStart(3, '0');
    }

    function maskPhoneForTable(phoneRaw) {
        var d = String(phoneRaw || '').replace(/\D/g, '');
        if (d.length < 7) return phoneRaw || '—';
        return d.slice(0, 3) + '****' + d.slice(-4);
    }

    function addrParts(full, region, detail) {
        if (window.MdmOnboardAddress && typeof window.MdmOnboardAddress.splitAddress === 'function') {
            return window.MdmOnboardAddress.splitAddress(full, region, detail);
        }
        return {
            region: String(region || '').trim(),
            detail: String(detail || '').trim(),
            full: String(full || region || detail || '').trim()
        };
    }

    function subjectOnboardingTitle(pageLabel) {
        if (pageLabel === '门店') return '门店进件';
        if (pageLabel === '供应商') return '供应商进件';
        if (pageLabel === '仓库') return '仓库主体进件';
        if (pageLabel === '直播间') return '直播间进件';
        if (pageLabel === '承运商') return '承运商进件';
        return '支付进件';
    }

    function subjectOnboardingKind(pageLabel) {
        var kindMap = {
            门店: 'store',
            供应商: 'supplier',
            仓库: 'warehouse',
            直播间: 'liveRoom',
            承运商: 'carrier'
        };
        return kindMap[pageLabel] || 'store';
    }

    function subjectRowCells(tr) {
        var c = tr ? tr.querySelectorAll('td') : [];
        return {
            id: c[0] ? c[0].textContent.trim() : '',
            shortName: c[1] ? c[1].textContent.trim() : '',
            groupName: c[2] ? c[2].textContent.trim() : '',
            subjectType: c[3] ? c[3].textContent.trim() : '',
            contactName: c[4] ? c[4].textContent.trim() : '',
            contactMobile: c[5] ? c[5].textContent.trim() : '',
            loginAccount: c[6] ? c[6].textContent.trim() : '',
            createTime: c[7] ? c[7].textContent.trim() : '',
            lastOperator: c[8] ? c[8].textContent.trim() : '',
            rowStatus:
                c[9] && c[9].querySelector('.status') ?
                    c[9].querySelector('.status').textContent.trim() :
                    ''
        };
    }

    function isTruthyValue(v) {
        return !!(v || v === true);
    }

    function firstMissingOnboardingField(fields, kind) {
        var f = fields || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var checks = [
            { key: 'short_name', label: '商户简称' },
            { key: 'receipt_name', label: '小票名称' },
            { key: 'detail_addr', label: '实际经营地址' },
            { key: 'legal_mobile_no', label: '法人手机号' },
            { key: 'contact_mobile_no', label: '管理员手机号' },
            { key: 'contact_email', label: '管理员邮箱' },
            { key: 'license_pic', label: '营业执照(F07)' },
            { key: 'license_info.name', label: '商户名称', bucket: lic },
            { key: 'license_info.code', label: '证照编号', bucket: lic },
            { key: 'license_info.start_date', label: '证照有效期开始日期', bucket: lic },
            { key: 'license_info.valid_date', label: '证照有效期截止日期', bucket: lic },
            { key: 'license_info.found_date', label: '成立日期', bucket: lic },
            { key: 'license_info.address', label: '注册地址', bucket: lic },
            { key: 'legal_cert_front_pic', label: '法人身份证人像面(F02)' },
            { key: 'legal_cert_back_pic', label: '法人身份证国徽面(F03)' },
            { key: 'legal_info.legal_name', label: '法人姓名', bucket: legal },
            { key: 'legal_info.id_no', label: '法人证件号码', bucket: legal },
            { key: 'legal_info.id_start_date', label: '法人证件开始日期', bucket: legal },
            { key: 'legal_info.id_valid_date', label: '法人证件截止日期', bucket: legal },
            { key: 'legal_info.legal_addr', label: '法人证件地址', bucket: legal },
            { key: 'contact_name', label: '管理员姓名' },
            { key: 'open_license_pic', label: '开户许可证' }
            /* 内景/收银台为选填；门头/场地照仅门店必填 */
        ];
        if (kind === 'store') {
            checks.push({ key: 'store_header_pic', label: '门头/场地照(F22)' });
        }
        var i;
        for (i = 0; i < checks.length; i++) {
            var check = checks[i];
            var val = check.bucket ? check.bucket[check.key.split('.').pop()] : f[check.key];
            if (!isTruthyValue(val)) return check.label;
        }
        var card = f.card_info || {};
        if (!String(card.account_name || '').trim()) return '银行卡户名';
        if (!String(card.card_no || '').trim()) return '银行卡号';
        if (!String(card.bank_name || '').trim()) return '开户行';
        if (!String(card.bank_branch || '').trim()) return '开户支行';
        return '';
    }

    function getSubjectRecordMeta(tr, pageLabel) {
        var row = subjectRowCells(tr);
        var kind = subjectOnboardingKind(pageLabel);
        var recordKey = 'subject::' + kind + '::' + String(row.id || '');
        var legacyRecordKey = 'subject::' + kind + '::' + String(row.shortName || '');
        return {
            row: row,
            kind: kind,
            recordKey: recordKey,
            legacyRecordKey: legacyRecordKey,
            title: subjectOnboardingTitle(pageLabel)
        };
    }

    function readSubjectRecord(meta) {
        var ui = window.MdmUnifiedOnboardingUi;
        if (!ui || typeof ui.getRecord !== 'function') return null;
        var rec = ui.getRecord(meta.recordKey);
        if (!rec && meta.legacyRecordKey) {
            rec = ui.getRecord(meta.legacyRecordKey);
            if (rec && typeof ui.upsertRecord === 'function') {
                rec.key = meta.recordKey;
                ui.upsertRecord(meta.recordKey, rec);
            }
        }
        return rec || null;
    }

    function resolveSubjectOnboardingDefaultsFromCache(kind, subjectName) {
        var KEY = 'mdm_resource_archive_first_by_subject_v1';
        try {
            var raw = localStorage.getItem(KEY);
            var all = raw ? JSON.parse(raw) : {};
            var bucket = all[kind] || {};
            var bySubject = bucket.bySubject || {};
            var firstRows = bucket.firstRows || [];
            var key = String(subjectName || '').trim();
            var picked = key && bySubject[key] ? bySubject[key] : firstRows[0];
            if (!picked) return null;
            return {
                short_name: String(picked.short_name || '').trim(),
                receipt_name: String(picked.receipt_name || '').trim(),
                detail_addr: String(picked.detail_addr || '').trim(),
                legal_mobile_no: String(picked.legal_mobile_no || '').trim(),
                contact_mobile_no: String(picked.contact_mobile_no || '').trim(),
                contact_email: String(picked.contact_email || '').trim(),
                card_info: picked.card_info || {},
                license_info: picked.license_info || {},
                legal_info: picked.legal_info || {},
                license_pic: String(picked.license_pic || '').trim(),
                legal_cert_front_pic: String(picked.legal_cert_front_pic || '').trim(),
                legal_cert_back_pic: String(picked.legal_cert_back_pic || '').trim(),
                open_license_pic: String(picked.open_license_pic || '').trim(),
                store_header_pic: String(picked.store_header_pic || '').trim(),
                store_indoor_pic: String(picked.store_indoor_pic || '').trim(),
                store_cashier_desk_pic: String(picked.store_cashier_desk_pic || '').trim()
            };
        } catch (e) {
            return null;
        }
    }

    function openSubjectOnboardingFromRow(tr, pageLabel, extraOpts) {
        if (
            !window.MdmUnifiedOnboardingUi ||
            typeof window.MdmUnifiedOnboardingUi.openModal !== 'function'
        ) {
            showToast('进件模块未加载，请刷新页面重试', 'error');
            return;
        }
        var meta = getSubjectRecordMeta(tr, pageLabel);
        var shortName = meta.row.shortName;
        var kind = meta.kind;
        var defaults = null;
        if (
            window.MdmResourceArchiveOnboardingDefaults &&
            typeof window.MdmResourceArchiveOnboardingDefaults.resolveFirstBySubject === 'function'
        ) {
            defaults = window.MdmResourceArchiveOnboardingDefaults.resolveFirstBySubject(
                kind,
                shortName
            );
        }
        if (!defaults) defaults = resolveSubjectOnboardingDefaultsFromCache(kind, shortName);
        if (!defaults) {
            defaults = {
                short_name: shortName,
                receipt_name: shortName,
                detail_addr: '',
                legal_mobile_no: '',
                contact_mobile_no: '',
                contact_email: '',
                card_info: {},
                license_info: {},
                legal_info: {},
                license_pic: '',
                legal_cert_front_pic: '',
                legal_cert_back_pic: '',
                open_license_pic: '',
                store_header_pic: '',
                store_indoor_pic: '',
                store_cashier_desk_pic: ''
            };
        }
        if (!defaults.short_name) defaults.short_name = shortName;
        if (!defaults.receipt_name) defaults.receipt_name = defaults.short_name;
        if (
            (kind === 'store' || kind === 'supplier') &&
            window.MdmResourceArchiveForms &&
            typeof window.MdmResourceArchiveForms.readVenuePhotos === 'function'
        ) {
            var venue =
                window.MdmResourceArchiveForms.readVenuePhotos(kind, meta.row.id || meta.row.storeId) ||
                {};
            if (!venue.store_header_pic && shortName) {
                venue =
                    window.MdmResourceArchiveForms.readVenuePhotos(kind, 'name:' + shortName) || venue;
            }
            if (!defaults.store_header_pic && venue.store_header_pic) {
                defaults.store_header_pic = venue.store_header_pic;
            }
            if (!defaults.store_indoor_pic && venue.store_indoor_pic) {
                defaults.store_indoor_pic = venue.store_indoor_pic;
            }
            if (!defaults.store_cashier_desk_pic && venue.store_cashier_desk_pic) {
                defaults.store_cashier_desk_pic = venue.store_cashier_desk_pic;
            }
        }
        var existing = readSubjectRecord(meta);
        if (existing && existing.fields) {
            var f = existing.fields;
            defaults = {
                short_name: f.short_name || defaults.short_name,
                receipt_name: f.receipt_name || defaults.receipt_name,
                detail_addr: f.detail_addr || defaults.detail_addr,
                legal_mobile_no: f.legal_mobile_no || defaults.legal_mobile_no,
                contact_mobile_no: f.contact_mobile_no || defaults.contact_mobile_no,
                contact_email: f.contact_email || defaults.contact_email,
                card_info: f.card_info || defaults.card_info || {},
                license_info: f.license_info || defaults.license_info || {},
                legal_info: f.legal_info || defaults.legal_info || {},
                license_pic: isTruthyValue(f.license_pic) || isTruthyValue(defaults.license_pic),
                legal_cert_front_pic:
                    isTruthyValue(f.legal_cert_front_pic) || isTruthyValue(defaults.legal_cert_front_pic),
                legal_cert_back_pic:
                    isTruthyValue(f.legal_cert_back_pic) || isTruthyValue(defaults.legal_cert_back_pic),
                open_license_pic:
                    isTruthyValue(f.open_license_pic) || isTruthyValue(defaults.open_license_pic),
                store_header_pic: isTruthyValue(f.store_header_pic) || isTruthyValue(defaults.store_header_pic),
                store_indoor_pic: isTruthyValue(f.store_indoor_pic) || isTruthyValue(defaults.store_indoor_pic),
                store_cashier_desk_pic:
                    isTruthyValue(f.store_cashier_desk_pic) || isTruthyValue(defaults.store_cashier_desk_pic)
            };
        }
        var userOnChange =
            extraOpts && typeof extraOpts.onRecordChange === 'function' ?
                extraOpts.onRecordChange :
                null;
        window.MdmUnifiedOnboardingUi.openModal({
            title: meta.title,
            merchantShortNameDefault: shortName,
            subjectId: meta.row.id,
            fieldDefaults: defaults,
            recordKey: meta.recordKey,
            variant: kind === 'store' ? 'store' : 'resource',
            onboardingKind: kind,
            forceView: !!(extraOpts && extraOpts.forceView),
            onRecordChange: function (payload) {
                if (
                    payload &&
                    payload.fields &&
                    payload.auditStatus !== '审核成功' &&
                    (kind === 'store' || kind === 'supplier') &&
                    window.MdmResourceArchiveForms &&
                    typeof window.MdmResourceArchiveForms.syncVenuePhotosFromOnboarding === 'function'
                ) {
                    window.MdmResourceArchiveForms.syncVenuePhotosFromOnboarding(
                        kind,
                        meta.row.id || meta.row.storeId,
                        payload.fields
                    );
                }
                if (userOnChange) userOnChange(payload);
            }
        });
    }

    function submitSubjectOnboardingFromRow(tr, pageLabel) {
        var ui = window.MdmUnifiedOnboardingUi;
        var meta = getSubjectRecordMeta(tr, pageLabel);
        if (!ui || typeof ui.upsertRecord !== 'function') {
            showToast('进件模块未加载，请刷新页面重试', 'error');
            return false;
        }
        var current = readSubjectRecord(meta);
        if (!current || !current.fields) {
            showToast('请先完善进件信息后再提交', 'error');
            return false;
        }
        var missing = firstMissingOnboardingField(current.fields || {}, meta.kind);
        if (missing) {
            showToast('请先完善：' + missing, 'error');
            return false;
        }
        var now = Date.now();
        var payload = {
            key: meta.recordKey,
            title: meta.title,
            variant: 'resource',
            merchantShortName: meta.row.shortName || '',
            fields: current.fields,
            status: 'submitted',
            updatedAt: now,
            submittedAt: current.submittedAt || now,
            auditChain: '门店 -> BD -> 财务 -> 汇付',
            nextAuditNode: 'BD'
        };
        ui.upsertRecord(meta.recordKey, payload);
        showToast('已提交上级审核', 'success');
        return true;
    }

    function removeSubjectOnboardingFromRow(tr, pageLabel) {
        var ui = window.MdmUnifiedOnboardingUi;
        var meta = getSubjectRecordMeta(tr, pageLabel);
        if (!ui || typeof ui.removeRecord !== 'function') {
            showToast('进件模块未加载，请刷新页面重试', 'error');
            return;
        }
        ui.removeRecord(meta.recordKey);
        if (meta.legacyRecordKey) ui.removeRecord(meta.legacyRecordKey);
        showToast('已删除进件草稿', 'success');
    }

    function subjectOnboardingStatus(tr, pageLabel) {
        var rec = readSubjectRecord(getSubjectRecordMeta(tr, pageLabel));
        return rec && rec.status ? rec.status : '';
    }

    function subjectOnboardingAuditText(rec) {
        if (!rec) return '未发起';
        if (rec.auditStatus) return rec.auditStatus;
        if (rec.status === 'submitted') {
            if (rec.nextAuditNode === 'BD总监') return '待总监审核';
            if (rec.nextAuditNode === '财务') return '待财务审核';
            if (rec.nextAuditNode === '汇付') return '待汇付审核';
            return '待BD审核';
        }
        if (rec.status === 'draft') return '未提交';
        return '未发起';
    }

    function tsText(ts) {
        if (!ts) return '—';
        var d = new Date(ts);
        if (isNaN(d.getTime())) return '—';
        return (
            d.getFullYear() +
            '-' +
            String(d.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(d.getDate()).padStart(2, '0') +
            ' ' +
            String(d.getHours()).padStart(2, '0') +
            ':' +
            String(d.getMinutes()).padStart(2, '0')
        );
    }

    function cardInfoText(card) {
        var c = card || {};
        var parts = [];
        if (c.account_name) parts.push(c.account_name);
        if (c.card_no) parts.push(c.card_no);
        if (c.bank_name) parts.push(c.bank_name);
        if (c.bank_branch) parts.push(c.bank_branch);
        return parts.length ? parts.join(' / ') : '—';
    }

    function uploadText(v) {
        return isTruthyValue(v) ? '已上传' : '—';
    }

    function maskMiddle(v) {
        var s = String(v || '').trim();
        if (!s) return '—';
        if (s.length <= 8) return s;
        return s.slice(0, 4) + '****' + s.slice(-4);
    }

    function maskBank(v) {
        var s = String(v || '').replace(/\s+/g, '');
        if (!s) return '—';
        if (s.length <= 8) return s;
        return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
    }

    function flowStatusText(auditStatus, status) {
        if (auditStatus === '审核成功') return '成功';
        if (auditStatus === '审核失败') return '失败';
        if (auditStatus) return '审核中';
        if (status === 'draft') return '草稿';
        return '审核中';
    }

    function demoPhoto(label) {
        var text = String(label || '进件照片');
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">' +
            '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>' +
            '<rect width="360" height="220" rx="14" fill="url(#g)"/>' +
            '<rect x="24" y="24" width="312" height="130" rx="10" fill="#cbd5e1"/>' +
            '<text x="180" y="194" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#334155">' +
            text +
            '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function resolvePhotoSrc(v, label) {
        if (typeof v === 'string') {
            var s = v.trim();
            if (s) return s;
        }
        if (v === true) return demoPhoto(label);
        return '';
    }

    function openSubjectOnboardingDetail(meta, rec, rowInfo) {
        var m = meta || {};
        var r = rec || {};
        var f = r.fields || {};
        var ext = r.ext || {};
        var card = f.card_info || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        var modal = document.createElement('div');
        modal.className = 'erp-modal erp-modal--store-wide';
        var header = document.createElement('div');
        header.className = 'erp-modal__header';
        var title = document.createElement('h2');
        title.className = 'erp-modal__title';
        title.textContent = '进件详情';
        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'erp-modal__header-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', function () {
            backdrop.remove();
        });
        var acts = document.createElement('div');
        acts.className = 'erp-modal__header-actions';
        acts.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(acts);
        modal.appendChild(header);

        var body = document.createElement('div');
        body.className = 'erp-modal__body';
        function makeCell(label, value) {
            var c = document.createElement('div');
            c.className = 'supplier-detail-cell';
            var l = document.createElement('div');
            l.className = 'supplier-detail-cell__label';
            l.textContent = label;
            var b = document.createElement('div');
            b.className = 'supplier-detail-cell__body';
            b.textContent = value == null || value === '' ? '—' : String(value);
            c.appendChild(l);
            c.appendChild(b);
            return c;
        }
        function makePhotoCell(label, src) {
            var c = document.createElement('div');
            c.className = 'supplier-detail-cell';
            var l = document.createElement('div');
            l.className = 'supplier-detail-cell__label';
            l.textContent = label;
            var b = document.createElement('div');
            b.className = 'supplier-detail-cell__body';
            var v = resolvePhotoSrc(src, label);
            if (!v) {
                b.textContent = '待上传';
            } else {
                var tile = document.createElement('div');
                tile.style.width = '100%';
                tile.style.maxWidth = '180px';
                tile.style.height = '112px';
                tile.style.border = '1px solid #e5e7eb';
                tile.style.borderRadius = '8px';
                tile.style.overflow = 'hidden';
                tile.style.background = '#f8fafc';
                tile.style.display = 'flex';
                tile.style.alignItems = 'center';
                tile.style.justifyContent = 'center';
                var img = document.createElement('img');
                img.src = v;
                img.alt = label;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.onerror = function () {
                    tile.innerHTML = '';
                    var txt = document.createElement('span');
                    txt.textContent = '已上传';
                    tile.appendChild(txt);
                };
                tile.appendChild(img);
                b.appendChild(tile);
            }
            c.appendChild(l);
            c.appendChild(b);
            return c;
        }
        function section(titleText, rows) {
            var h = document.createElement('div');
            h.className = 'supplier-detail-section-title';
            h.textContent = titleText;
            body.appendChild(h);
            var g = document.createElement('div');
            g.className = 'supplier-detail-grid';
            rows.forEach(function (it) {
                if (it[2] === 'image') {
                    g.appendChild(makePhotoCell(it[0], it[1]));
                } else {
                    g.appendChild(makeCell(it[0], it[1]));
                }
            });
            body.appendChild(g);
        }
        section('基础信息', [
            ['商户名称', rowInfo.shortName || '—'],
            ['汇付商户号', 'HF-' + String(rowInfo.id || '').replace(/\s+/g, '')],
            ['主体类型', rowInfo.subjectType || '—'],
            ['所属集团主体', rowInfo.groupName || '—'],
            ['进件状态', flowStatusText(r.auditStatus, r.status)],
            ['驳回原因', r.rejectReason || ext.rejectReason || '—']
        ]);
        section('进件流程信息', [
            ['审核环节', r.nextAuditNode || '—'],
            ['进件渠道', r.onboardingChannel || ext.onboardingChannel || '后台'],
            ['创建时间', tsText(r.createdAt || r.submittedAt)],
            ['提交汇付时间', tsText(r.submittedAt)],
            ['汇付审核完成时间', tsText(r.completedAt || ext.completedAt)],
            ['MCC行业', r.mccIndustry || ext.mccIndustry || '—'],
            ['请求流水号', r.reqSeqId || ext.reqSeqId || '—'],
            ['外部商户号', r.extMerId || ext.extMerId || '—'],
            ['创建人', r.creator || ext.creator || '—'],
            ['备注', r.remarks || ext.remarks || '—']
        ]);
        section('主体关系信息', [
            ['上级汇付ID', r.headHuifuId || ext.headHuifuId || '—'],
            ['结算主体类型', rowInfo.subjectType || '—']
        ]);
        section('执照信息', [
            ['营业执照', f.license_pic, 'image'],
            ['商户名称', lic.name || r.regName || ext.regName || '—'],
            ['证照编号', lic.code || r.licenseCode || ext.licenseCode || '—'],
            ['证照有效期开始日期', lic.start_date || r.licenseBeginDate || ext.licenseBeginDate || '—'],
            [
                '证照有效期截止日期',
                /长期/.test(String(lic.valid_date || r.licenseEndDate || ext.licenseEndDate || ''))
                    ? '长期有效'
                    : lic.valid_date || r.licenseEndDate || ext.licenseEndDate || '—'
            ],
            ['成立日期', lic.found_date || r.foundDate || ext.foundDate || lic.start_date || '—'],
            ['省市区', addrParts(lic.address || r.regDetail || ext.regDetail, lic.region, lic.address_detail).region || '—'],
            ['详细地址', addrParts(lic.address || r.regDetail || ext.regDetail, lic.region, lic.address_detail).detail || '—']
        ]);
        section('法人基本信息', [
            ['法人身份证人像面', f.legal_cert_front_pic, 'image'],
            ['法人身份证国徽面', f.legal_cert_back_pic, 'image'],
            ['法人证件类型', legal.cert_type || '身份证'],
            ['法人姓名', legal.legal_name || r.legalName || ext.legalName || '—'],
            ['法人证件号码', legal.id_no || maskMiddle(r.legalIdNo || ext.legalIdNo)],
            ['法人证件开始日期', legal.id_start_date || r.legalCertBeginDate || ext.legalCertBeginDate || '—'],
            [
                '法人证件截止日期',
                /长期/.test(String(legal.id_valid_date || r.legalCertEndDate || ext.legalCertEndDate || ''))
                    ? '长期有效'
                    : legal.id_valid_date || r.legalCertEndDate || ext.legalCertEndDate || '—'
            ],
            ['省市区', addrParts(legal.legal_addr || r.legalAddr || ext.legalAddr, legal.legal_region, legal.legal_addr_detail).region || '—'],
            ['详细地址', addrParts(legal.legal_addr || r.legalAddr || ext.legalAddr, legal.legal_region, legal.legal_addr_detail).detail || '—']
        ]);
        section('商户信息', [
            ['商户简称', f.short_name || '—'],
            ['小票名称', f.receipt_name || '—'],
            ['实际经营地址', f.detail_addr || '—'],
            ['法人手机号', f.legal_mobile_no || '—'],
            ['管理员姓名', f.contact_name || legal.legal_name || r.legalName || '—'],
            ['管理员手机号', f.contact_mobile_no || rowInfo.contactMobile || '—'],
            ['管理员邮箱', f.contact_email || '—']
        ]);
        section('结算信息', [
            ['开户许可证', f.open_license_pic || r.openLicencePic || ext.openLicencePic || '', 'image'],
            ['开户名/结算户名', card.account_name || '—'],
            ['银行账号', maskBank(card.card_no)],
            ['开户银行', card.bank_name || '—'],
            ['开户支行', card.bank_branch || '—']
        ]);
        section('门店场地', [
            ['经营场所名称', rowInfo.shortName || '—'],
            ['门头/场地照', f.store_header_pic, 'image'],
            ['内景/工作区域照', f.store_indoor_pic, 'image'],
            ['收银台/前台照', f.store_cashier_desk_pic, 'image']
        ]);
        modal.appendChild(body);

        var footer = document.createElement('div');
        footer.className = 'erp-modal__footer';
        var ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'erp-btn erp-btn--primary';
        ok.textContent = '关闭';
        ok.addEventListener('click', function () {
            backdrop.remove();
        });
        footer.appendChild(ok);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    function merchantDetailTitle(kind) {
        var map = {
            门店: '门店详情',
            供应商: '供应商详情',
            仓库: '仓库详情',
            贸易商: '贸易商详情'
        };
        return map[kind] || ((kind || '商家') + '详情');
    }

    function merchantDetailCell(label, value) {
        var cell = subjectDrawerNode('div');
        var lab = subjectDrawerNode('div', 'mdm-detail-grid__label', label);
        var val = subjectDrawerNode('div', 'mdm-detail-grid__value', value || '—');
        cell.appendChild(lab);
        cell.appendChild(val);
        return cell;
    }

    function merchantDetailFold(label, sub, body) {
        var fold = subjectDrawerNode('section', 'mdm-fold is-open');
        fold.setAttribute('data-fold', label);
        var bar = subjectDrawerNode('button', 'mdm-fold__bar');
        bar.type = 'button';
        bar.appendChild(subjectDrawerNode('span', 'mdm-fold__name', label));
        bar.appendChild(subjectDrawerNode('span', 'mdm-fold__sub', sub || ''));
        bar.appendChild(subjectDrawerNode('span', 'mdm-fold__chevron'));
        var box = subjectDrawerNode('div', 'mdm-fold__body');
        box.appendChild(body);
        bar.addEventListener('click', function () {
            fold.classList.toggle('is-open');
        });
        fold.appendChild(bar);
        fold.appendChild(box);
        return fold;
    }

    function openMerchantDetailDrawer(tr) {
        if (!tr) return;
        var info = subjectRowCells(tr);
        var kind = info.subjectType === '服务商' ? '贸易商' : info.subjectType;
        var materialsKind = kind === '供应商' ? 'supplier' : kind === '仓库' ? 'warehouse' : kind === '贸易商' ? 'trader' : 'store';
        removeSubjectDrawers();

        var backdrop = subjectDrawerNode('div', 'store-drawer-backdrop');
        backdrop.setAttribute('data-mdm-subject-drawer', '1');
        var drawer = subjectDrawerNode('aside', 'store-drawer store-drawer--interactive store-drawer--store-wide');
        drawer.setAttribute('data-mdm-subject-drawer', '1');

        var header = subjectDrawerNode('div', 'store-drawer__header');
        header.appendChild(subjectDrawerNode('h2', 'store-drawer__title', merchantDetailTitle(kind)));
        var btnClose = subjectDrawerNode('button', 'store-drawer__close');
        btnClose.type = 'button';
        btnClose.setAttribute('aria-label', '关闭');
        btnClose.innerHTML = '&times;';
        header.appendChild(btnClose);

        function shut() {
            document.removeEventListener('keydown', onKey);
            backdrop.remove();
            drawer.remove();
        }
        function onKey(ev) {
            if (ev.key === 'Escape') shut();
        }
        document.addEventListener('keydown', onKey);
        btnClose.addEventListener('click', shut);

        var hero = subjectDrawerNode('div', 'store-drawer__hero store-drawer__hero--elevated');
        var heroMain = subjectDrawerNode('div', 'store-drawer__hero-main');
        var nameRow = subjectDrawerNode('div', 'store-drawer__name-row');
        nameRow.appendChild(subjectDrawerNode('span', 'store-drawer__name', info.shortName || '—'));
        nameRow.appendChild(subjectDrawerNode('span', 'store-drawer__tag store-drawer__tag--green', kind || '商家'));
        if (info.rowStatus) {
            var statusKind = info.rowStatus === '开启' ? 'green' : 'gray';
            nameRow.appendChild(subjectDrawerNode('span', 'store-drawer__tag store-drawer__tag--' + statusKind, info.rowStatus));
        }
        heroMain.appendChild(nameRow);
        heroMain.appendChild(subjectDrawerNode('div', 'store-drawer__meta', '商家ID：' + (info.id || '—') + ' · 主体类型：' + (kind || '—')));
        hero.appendChild(heroMain);
        var actions = subjectDrawerNode('div', 'store-drawer__actions');
        var editBtn = subjectDrawerNode('button', 'store-drawer__action', '编辑');
        editBtn.type = 'button';
        editBtn.addEventListener('click', function () {
            shut();
            openSubjectDetailDrawer(tr);
        });
        var goBtn = subjectDrawerNode('button', 'store-drawer__action is-primary', '去进件');
        goBtn.type = 'button';
        goBtn.addEventListener('click', function () {
            shut();
            openSubjectOnboardingFromRow(tr, kind, {});
        });
        actions.appendChild(editBtn);
        actions.appendChild(goBtn);
        hero.appendChild(actions);

        var tabs = subjectDrawerNode('div', 'store-drawer__tabs store-drawer__tabs--sticky');
        var tab = subjectDrawerNode('button', 'store-drawer__tab is-active', '基础信息');
        tab.type = 'button';
        tabs.appendChild(tab);

        var grid = subjectDrawerNode('div', 'mdm-detail-grid');
        [
            ['商家名称', info.shortName],
            ['主体类型', kind],
            ['绑定BD', info.groupName],
            ['联系人', info.contactName],
            ['手机号码', info.contactMobile],
            ['登录账号', info.loginAccount],
            ['创建时间', info.createTime],
            ['最后操作人', info.lastOperator],
            ['状态', info.rowStatus]
        ].forEach(function (pair) {
            grid.appendChild(merchantDetailCell(pair[0], pair[1]));
        });

        var materialBody = subjectDrawerNode('div');
        var materials = window.MdmEntryMaterials;
        var saved = null;
        if (materials && info.id && typeof materials.ensureDemoSubject === 'function') {
            saved = materials.ensureDemoSubject(info.id, info.shortName);
        }
        if (!saved && materials && info.id && typeof materials.loadSubject === 'function') saved = materials.loadSubject(info.id);
        if (!saved && materials && typeof materials.loadForArchive === 'function') {
            var first = typeof materials.firstOf === 'function' ? materials.firstOf(info.id) : null;
            if (first && first.name) saved = materials.loadForArchive(first.kind || materialsKind, first.name);
        }
        var matGrid = subjectDrawerNode('div', 'mdm-detail-grid');
        var pairs = materials && typeof materials.pairs === 'function' ? materials.pairs(saved) : [];
        pairs.forEach(function (pair) {
            if (pair.photo && materials && typeof materials.viewPhoto === 'function') {
                var cell = subjectDrawerNode('div');
                cell.appendChild(subjectDrawerNode('div', 'mdm-detail-grid__label', pair.label));
                var val = subjectDrawerNode('div', 'mdm-detail-grid__value');
                val.appendChild(materials.viewPhoto(pair.label, pair.uploaded));
                cell.appendChild(val);
                matGrid.appendChild(cell);
                return;
            }
            matGrid.appendChild(merchantDetailCell(pair.label, pair.value));
        });
        materialBody.appendChild(matGrid);

        var panel = subjectDrawerNode('div', 'supplier-detail-tab');
        panel.appendChild(merchantDetailFold('商家信息', '名称、类型、联系人与状态', grid));
        panel.appendChild(merchantDetailFold('证照与结算', '营业执照、法人身份证、法人实名电话、整套结算信息', materialBody));

        var bodyHost = subjectDrawerNode('div', 'store-drawer__body');
        bodyHost.appendChild(panel);
        var rail = subjectDrawerNode('nav', 'store-drawer__rail');
        rail.setAttribute('aria-label', '内容目录');
        panel.querySelectorAll(':scope > .mdm-fold').forEach(function (fold, index) {
            var anchor = subjectDrawerNode('button', 'store-drawer__anchor' + (index === 0 ? ' is-active' : ''), fold.getAttribute('data-fold'));
            anchor.type = 'button';
            anchor.addEventListener('click', function () {
                fold.classList.add('is-open');
                fold.scrollIntoView({ block: 'start' });
                rail.querySelectorAll('.store-drawer__anchor').forEach(function (node) {
                    node.classList.remove('is-active');
                });
                anchor.classList.add('is-active');
            });
            rail.appendChild(anchor);
        });

        var layout = subjectDrawerNode('div', 'store-drawer__layout');
        var main = subjectDrawerNode('div', 'store-drawer__main');
        main.appendChild(tabs);
        main.appendChild(bodyHost);
        layout.appendChild(main);
        layout.appendChild(rail);

        drawer.appendChild(header);
        drawer.appendChild(hero);
        drawer.appendChild(layout);
        backdrop.addEventListener('click', shut);
        drawer.addEventListener('click', function (ev) { ev.stopPropagation(); });
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
    }

    function paintSubjectDetailLinks() {
        document.querySelectorAll('#tableBody .action-links').forEach(function (cell) {
            if (!cell.querySelector('.mdm-subject-detail')) {
                var link = document.createElement('a');
                link.href = '#';
                link.className = 'mdm-subject-detail';
                link.textContent = '编辑';
                link.style.marginRight = '8px';
                cell.insertBefore(link, cell.firstChild);
            }
            if (!cell.querySelector('.mdm-subject-onboard')) {
                var go = document.createElement('a');
                go.href = '#';
                go.className = 'mdm-subject-onboard';
                go.textContent = '去进件';
                go.style.marginRight = '8px';
                var toggle = cell.querySelector('.mdm-disable-toggle');
                if (toggle) cell.insertBefore(go, toggle);
                else cell.appendChild(go);
            }
        });
    }

    function removeSubjectDrawers() {
        document.querySelectorAll('[data-mdm-subject-drawer]').forEach(function (node) {
            node.remove();
        });
    }

    function subjectDrawerNode(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function openSubjectDetailDrawer(tr) {
        if (!tr) return;
        var info = subjectRowCells(tr);
        var kind = info.subjectType === '服务商' ? '贸易商' : info.subjectType;
        var materialsKind = kind === '供应商' ? 'supplier' : kind === '仓库' ? 'warehouse' : kind === '贸易商' ? 'trader' : 'store';
        var hasMaterials = kind === '门店' || kind === '供应商' || kind === '仓库' || kind === '贸易商';
        var materials = window.MdmEntryMaterials;
        removeSubjectDrawers();

        var backdrop = subjectDrawerNode('div', 'store-drawer-backdrop');
        backdrop.setAttribute('data-mdm-subject-drawer', '1');
        var drawer = subjectDrawerNode('aside', 'store-drawer store-drawer--interactive store-drawer--store-wide');
        drawer.setAttribute('data-mdm-subject-drawer', '1');

        var header = subjectDrawerNode('div', 'store-drawer__header');
        header.appendChild(subjectDrawerNode('h2', 'store-drawer__title', '编辑' + (kind || '') + '商家'));
        var btnClose = subjectDrawerNode('button', 'store-drawer__close');
        btnClose.type = 'button';
        btnClose.setAttribute('aria-label', '关闭');
        btnClose.innerHTML = '&times;';
        header.appendChild(btnClose);

        var hero = subjectDrawerNode('div', 'store-drawer__hero store-drawer__hero--elevated');
        var nameRow = subjectDrawerNode('div', 'store-drawer__name-row');
        nameRow.appendChild(subjectDrawerNode('span', 'store-drawer__name', info.shortName || '—'));
        nameRow.appendChild(subjectDrawerNode('span', 'store-drawer__tag store-drawer__tag--orange', kind || '主体'));
        if (info.rowStatus) {
            nameRow.appendChild(subjectDrawerNode('span', 'store-drawer__tag store-drawer__tag--gray', info.rowStatus));
        }
        hero.appendChild(nameRow);
        hero.appendChild(subjectDrawerNode('div', 'store-drawer__meta', '主体ID：' + (info.id || '—') + ' · 所属组织：' + (info.groupName || '—')));

        var body = subjectDrawerNode('div', 'store-drawer__body');
        var basicTitle = subjectDrawerNode('div', 'supplier-detail-section-title', '主体信息');
        body.appendChild(basicTitle);
        if (hasMaterials) {
            var caution = subjectDrawerNode('div', 'mdm-biz-tip');
            caution.setAttribute('role', 'note');
            caution.innerHTML = '所填信息为合同签约的控件填充字段，<strong>请谨慎填写</strong>！';
            body.appendChild(caution);
        }
        var grid = subjectDrawerNode('div', 'supplier-detail-grid');
        [
            ['主体ID', info.id],
            ['主体名称', info.shortName],
            ['主体类型', kind],
            ['联系人', info.contactName],
            ['手机号', info.contactMobile],
            ['登录账号', info.loginAccount],
            ['创建时间', info.createTime],
            ['状态', info.rowStatus]
        ].forEach(function (pair) {
            var cell = subjectDrawerNode('div', 'supplier-detail-cell');
            cell.appendChild(subjectDrawerNode('div', 'supplier-detail-cell__label', pair[0]));
            cell.appendChild(subjectDrawerNode('div', 'supplier-detail-cell__body', pair[1] || '—'));
            grid.appendChild(cell);
        });
        body.appendChild(grid);

        var materialsRoot = null;
        if (hasMaterials && materials && typeof materials.mount === 'function') {
            var saved = materials.loadSubject ? materials.loadSubject(info.id) : null;
            var bound = materials.firstOf ? materials.firstOf(info.id) : null;
            if (!saved && bound) saved = materials.load(bound.kind, bound.name);
            if (!saved) saved = materials.load(materialsKind, info.shortName);
            materialsRoot = materials.mount(body, { skin: 'pc', role: 'subject' });
            if (saved) materials.fill(materialsRoot, saved);
        } else {
            var skipTip = subjectDrawerNode('div', 'mdm-biz-tip');
            skipTip.setAttribute('role', 'note');
            skipTip.style.marginTop = '16px';
            skipTip.innerHTML = '仓库、贸易商不维护营业执照、法人身份证、法人实名电话和整套结算信息。';
            body.appendChild(skipTip);
        }

        var footer = subjectDrawerNode('div', 'store-drawer__footer');
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'erp-btn';
        back.textContent = '关闭';
        footer.appendChild(back);
        var saveBtn = null;
        if (materialsRoot) {
            saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.className = 'erp-btn erp-btn--primary';
            saveBtn.textContent = '保存';
            footer.appendChild(saveBtn);
        }

        function shut() {
            document.removeEventListener('keydown', onKey);
            backdrop.remove();
            drawer.remove();
        }
        function onKey(ev) {
            if (ev.key === 'Escape') shut();
        }
        document.addEventListener('keydown', onKey);
        btnClose.addEventListener('click', shut);
        back.addEventListener('click', shut);
        backdrop.addEventListener('click', shut);
        drawer.addEventListener('click', function (ev) { ev.stopPropagation(); });
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var err = materials.validate(materialsRoot);
                if (err) {
                    showToast(err, 'error');
                    return;
                }
                var payload = materials.read(materialsRoot);
                materials.saveSubject(info.id, payload);
                var current = materials.firstOf(info.id);
                var targetKind = current && current.kind ? current.kind : materialsKind;
                var targetName = current && current.name ? current.name : info.shortName;
                if (!current) materials.bindFirst(info.id, targetKind, targetName);
                if (targetName) materials.save(targetKind, targetName, payload);
                var kindLabel = { supplier: '供应商', warehouse: '仓库', trader: '贸易商' }[targetKind] || '门店';
                showToast(
                    '已保存，并同步到第一家' + kindLabel + '「' + (targetName || '—') + '」',
                    'success'
                );
            });
        }

        drawer.appendChild(header);
        drawer.appendChild(hero);
        drawer.appendChild(body);
        drawer.appendChild(footer);
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
    }

    function renderSubjectDetailOnboardingBlock(pm, spec, editModalId) {
        var row = pm.currentEditRow;
        if (!row) return;
        var modal = document.getElementById(editModalId);
        if (!modal) return;
        var form = modal.querySelector('.modal-form');
        var footer = modal.querySelector('.modal-footer');
        if (!form || !footer || !form.parentNode) return;
        var block = modal.querySelector('[data-subject-onboard-detail]');
        if (!block) {
            block = document.createElement('div');
            block.setAttribute('data-subject-onboard-detail', '1');
            block.style.padding = '0 20px 14px';
            block.style.borderTop = '1px dashed #e5e7eb';
            block.style.marginTop = '8px';
            block.style.maxHeight = '42vh';
            block.style.overflow = 'auto';
            form.parentNode.insertBefore(block, footer);
        }
        block.style.display = '';
        var meta = getSubjectRecordMeta(row, spec.pageLabel);
        var rec = readSubjectRecord(meta) || {};
        var rowInfo = subjectRowCells(row);
        var basicItems = [
            ['主体ID', rowInfo.id || '—'],
            ['主体名称', rowInfo.shortName || '—'],
            ['所属组织', rowInfo.groupName || '—'],
            ['主体类型', rowInfo.subjectType || '—'],
            ['联系人', rowInfo.contactName || '—'],
            ['手机号', rowInfo.contactMobile || '—'],
            ['登录账号', rowInfo.loginAccount || '—'],
            ['创建时间', rowInfo.createTime || '—'],
            ['最后操作人', rowInfo.lastOperator || '—'],
            ['状态', rowInfo.rowStatus || '—']
        ];
        var basicHtml = basicItems
            .map(function (it) {
                return '<div><span style="color:#64748b">' + it[0] + '：</span>' + it[1] + '</div>';
            })
            .join('');
        block.innerHTML =
            '<div style="font-size:14px;font-weight:700;color:#0f172a;margin:12px 0 10px">基础信息</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px;font-size:12px;color:#334155">' +
            basicHtml +
            '</div>' +
            '<div class="mdm-biz-tip" role="note" style="margin:14px 0 10px">营业执照、法人身份证、法人实名电话、整套结算信息在操作栏「编辑」里修改，并默认同步到第一家门店、供应商、仓库或贸易商。去进件带入第一家已同步的字段，法人实名电话不写入进件。</div>' +
            '<div style="font-size:14px;font-weight:700;color:#0f172a;margin:14px 0 10px">主体进件</div>' +
            '<div style="margin:0 0 10px"><button type="button" class="btn btn-primary" data-subject-go-onboard>去进件</button></div>' +
            '<div class="table-scroll-container"><table class="table"><thead><tr>' +
            '<th>商户名称</th><th>主体类型</th><th>所属组织</th><th>进件状态</th><th>汇付商户号</th><th>结算主体</th><th>联系人手机号</th><th>提交时间</th><th>操作</th>' +
            '</tr></thead><tbody><tr>' +
            '<td>' + (rowInfo.shortName || '—') + '</td>' +
            '<td>' + (rowInfo.subjectType || '—') + '</td>' +
            '<td>' + (rowInfo.groupName || '—') + '</td>' +
            '<td>' + subjectOnboardingAuditText(rec) + '</td>' +
            '<td>HF-' + String(rowInfo.id || '').replace(/\s+/g, '') + '</td>' +
            '<td>' + (rowInfo.subjectType || '—') + '</td>' +
            '<td>' + (rowInfo.contactMobile || '—') + '</td>' +
            '<td>' + tsText(rec.submittedAt) + '</td>' +
            '<td class="action-links" data-subject-onboard-actions="1"></td>' +
            '</tr></tbody></table></div>';

        var goBtn = block.querySelector('[data-subject-go-onboard]');
        if (goBtn) {
            goBtn.addEventListener('click', function () {
                openSubjectOnboardingFromRow(row, spec.pageLabel, {
                    onRecordChange: function () {
                        renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
                    }
                });
            });
        }
        var actionCell = block.querySelector('[data-subject-onboard-actions]');
        if (!actionCell) return;
        function mkA(text, handler) {
            var a = document.createElement('a');
            a.href = '#';
            a.textContent = text;
            a.style.marginRight = '8px';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                handler();
            });
            actionCell.appendChild(a);
        }
        mkA('查看', function () {
            var latestMeta = getSubjectRecordMeta(row, spec.pageLabel);
            var latestRec = readSubjectRecord(latestMeta) || {};
            openSubjectOnboardingDetail(latestMeta, latestRec, subjectRowCells(row));
        });
        mkA('编辑', function () {
            openSubjectOnboardingFromRow(row, spec.pageLabel, {
                onRecordChange: function () {
                    renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
                }
            });
        });
        var recAudit = subjectOnboardingAuditText(rec);
        var editable =
            rec.status !== 'submitted' ||
            recAudit === '审核失败' ||
            recAudit === '未提交' ||
            recAudit === '未发起';
        if (editable) {
            mkA('删除', function () {
                removeSubjectOnboardingFromRow(row, spec.pageLabel);
                renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
            });
            var submitLabel = recAudit === '审核失败' ? '重新提交' : '提交进件';
            mkA(submitLabel, function () {
                if (recAudit === '审核失败') {
                    openSubjectOnboardingFromRow(row, spec.pageLabel, {
                        onRecordChange: function () {
                            renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
                        }
                    });
                    return;
                }
                if (submitSubjectOnboardingFromRow(row, spec.pageLabel)) {
                    renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
                }
            });
        }
    }

    function fieldId(prefix, id) {
        return String(prefix || '') + id;
    }

    /** 主体/商家表单字段（创建与查看口径按类型配置） */
    function buildSubjectFields(spec) {
        var showBindBd = !!spec.showBindBd;
        var omitSmsAndLogin = !!spec.omitSmsAndLoginAccount;
        var compactLogin = !!spec.compactStoreSubjectForm || omitSmsAndLogin;
        var contactLabel = spec.contactPersonLabel || '联系人';
        var bindHdr = spec.bindColumnLabel || '绑定BD名称';
        var multiSubjectType = Array.isArray(spec.subjectTypeOptions) && spec.subjectTypeOptions.length > 0;
        var typeOptions = multiSubjectType
            ? spec.subjectTypeOptions.map(function (x) {
                  return { value: x, text: x };
              })
            : [{ value: spec.subjectTypeLabel, text: spec.subjectTypeLabel }];
        var pfx = spec.fieldIdPrefix || '';
        var phoneId = fieldId(pfx, 'addPhone');
        var smsBtnId = fieldId(pfx, 'mdmSmsDummyBtn');

        var fields = [
            {
                id: fieldId(pfx, 'subjectId'),
                label: '主体ID',
                type: 'text',
                required: true,
                editDisabled: true,
                hiddenInAdd: true
            },
            {
                id: fieldId(pfx, 'subjectName'),
                label: '主体名称',
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入主体名称'
            }
        ];

        if (spec.subjectTypeLabel === '供应商') {
            fields.push({
                id: fieldId(pfx, 'supplierAlias'),
                label: '供应商别名',
                type: 'text',
                required: true,
                placeholder: '请输入供应商别名'
            });
        }

        if (showBindBd) {
            fields.push({
                id: fieldId(pfx, 'dockPerson'),
                label: '绑定BD',
                type: 'select',
                required: true,
                editDisabled: true,
                options: [
                    { value: '', text: '请选择绑定BD' },
                    { value: '赵小九', text: '赵小九' },
                    { value: '李四', text: '李四' },
                    { value: '张三', text: '张三' },
                    { value: '王五', text: '王五' }
                ]
            });
        } else {
            fields.push({
                id: fieldId(pfx, 'dockPerson'),
                label: bindHdr,
                type: 'text',
                editDisabled: true,
                hiddenInAdd: true
            });
        }

        var phoneAddHtml = omitSmsAndLogin
            ? '<div class="modal-form-group" style="width:100%">' +
              '<label style="min-width:100px"><span style="color:red">*</span>手机号码</label>' +
              '<div class="input-wrapper" style="flex:1">' +
              '<input type="text" id="' +
              phoneId +
              '" placeholder="请输入手机号码">' +
              '<span class="clear-btn">×</span></div></div>'
            : '<div class="modal-form-group" style="width:100%">' +
              '<label style="min-width:100px"><span style="color:red">*</span>手机号码</label>' +
              '<div style="flex:1;display:flex;gap:8px;align-items:center">' +
              '<div class="input-wrapper" style="flex:1">' +
              '<input type="text" id="' +
              phoneId +
              '" placeholder="请输入手机号码">' +
              '<span class="clear-btn">×</span></div>' +
              '<button type="button" class="btn btn-secondary btn-sm mdm-sms-dummy-btn" id="' +
              smsBtnId +
              '">获取验证码</button>' +
              '</div></div>';

        fields.push(
            {
                id: fieldId(pfx, 'subjectType'),
                label: '主体类型',
                type: 'select',
                required: true,
                editDisabled: true,
                disabled: !multiSubjectType,
                options: typeOptions
            },
            {
                id: fieldId(pfx, 'contactPerson'),
                label: contactLabel,
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入' + contactLabel
            },
            {
                type: 'raw',
                html: phoneAddHtml,
                editHtml:
                    '<div class="modal-form-group"><label style="min-width:100px">手机号码</label>' +
                    '<div class="input-wrapper">' +
                    '<input type="text" id="editRowPhoneDisplay" disabled>' +
                    '<span class="clear-btn">×</span></div></div>'
            }
        );
        if (!omitSmsAndLogin) {
            fields.push({
                id: fieldId(pfx, 'smsCode'),
                label: '验证码',
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入6位数字验证码'
            });
        }
        if (!compactLogin) {
            fields.push({
                id: fieldId(pfx, 'loginAccount'),
                label: '登录账号',
                type: 'text',
                editDisabled: true,
                placeholder: '请输入登录账号'
            });
        }
        fields.push(
            {
                id: fieldId(pfx, 'createTime'),
                label: '创建时间',
                type: 'text',
                editDisabled: true,
                disabled: true,
                hiddenInAdd: true
            },
            {
                id: fieldId(pfx, 'lastOperator'),
                label: '最后操作人',
                type: 'text',
                editDisabled: true,
                hiddenInAdd: true
            },
            {
                id: fieldId(pfx, 'rowStatus'),
                label: '状态',
                type: 'select',
                required: true,
                editDisabled: true,
                hiddenInAdd: true,
                options: spec.statusOptions || [
                    { value: '正常', text: '正常' },
                    { value: '冻结', text: '冻结' },
                    { value: '停用', text: '停用' }
                ]
            }
        );
        return fields;
    }

    function buildAddValidations(spec) {
        var pfx = spec.fieldIdPrefix || '';
        var showBindBd = !!spec.showBindBd;
        var omitSmsAndLogin = !!spec.omitSmsAndLoginAccount;
        var multiSubjectType = Array.isArray(spec.subjectTypeOptions) && spec.subjectTypeOptions.length > 0;
        var contactLabel = spec.contactPersonLabel || '联系人';
        var list = [
            { id: fieldId(pfx, 'subjectName'), message: '请输入主体名称', required: true },
            ...(showBindBd
                ? [{ id: fieldId(pfx, 'dockPerson'), message: '请选择绑定BD', required: true }]
                : []),
            ...(multiSubjectType
                ? [{ id: fieldId(pfx, 'subjectType'), message: '请选择主体类型', required: true }]
                : []),
            {
                id: fieldId(pfx, 'contactPerson'),
                message: '请输入' + contactLabel,
                required: true
            },
            { id: fieldId(pfx, 'addPhone'), message: '请输入手机号码', required: true }
        ];
        if (spec.subjectTypeLabel === '供应商') {
            list.push({ id: fieldId(pfx, 'supplierAlias'), message: '请输入供应商别名', required: true });
        }
        if (!omitSmsAndLogin) {
            list.push({ id: fieldId(pfx, 'smsCode'), message: '请输入6位数字验证码', required: true });
        }
        return list;
    }

    function saveSubjectRowFromAddForm(pm, spec) {
        var pfx = spec.fieldIdPrefix || '';
        var showBindBd = !!spec.showBindBd;
        var omitSmsAndLogin = !!spec.omitSmsAndLoginAccount;
        var compactLogin = !!spec.compactStoreSubjectForm || omitSmsAndLogin;
        var idPrefixMap = {
            门店: 'STORE',
            供应商: 'SUP',
            贸易商: 'TRD',
            服务商: 'PRV',
            仓库: 'WH',
            直播间: 'LIVE',
            承运商: 'CAR'
        };
        var subjectIdPrefix = spec.subjectIdPrefix || idPrefixMap[spec.pageLabel] || 'SUB';
        var phoneEl = document.getElementById(fieldId(pfx, 'addPhone'));
        var pv = phoneEl ? phoneEl.value.replace(/\D/g, '') : '';
        if (pv.length !== 11) {
            showToast('请输入11位手机号码');
            return false;
        }
        if (!omitSmsAndLogin) {
            var smsEl = document.getElementById(fieldId(pfx, 'smsCode'));
            var smsCode = smsEl ? (smsEl.value || '').replace(/\D/g, '') : '';
            if (smsCode.length !== 6) {
                showToast('请输入6位数字验证码');
                if (smsEl) smsEl.focus();
                return false;
            }
        }
        var loginEl = document.getElementById(fieldId(pfx, 'loginAccount'));
        var loginVal = compactLogin ? '—' : loginEl ? loginEl.value.trim() || '—' : '—';
        if (!compactLogin && (!loginVal || loginVal === '—')) {
            showToast('请输入登录账号');
            return false;
        }
        var dockVal = '—';
        if (showBindBd) {
            var dockEl = document.getElementById(fieldId(pfx, 'dockPerson'));
            dockVal = dockEl ? dockEl.value.trim() : '';
            if (!dockVal) {
                showToast('请选择绑定BD');
                return false;
            }
        }
        var typeEl = document.getElementById(fieldId(pfx, 'subjectType'));
        var typeVal = typeEl ? typeEl.value.trim() : spec.subjectTypeLabel;
        var allowedTypes = Array.isArray(spec.subjectTypeOptions) ? spec.subjectTypeOptions : null;
        if (allowedTypes && allowedTypes.indexOf(typeVal) === -1) {
            showToast('请选择主体类型');
            if (typeEl) typeEl.focus();
            return false;
        }
        var nameEl = document.getElementById(fieldId(pfx, 'subjectName'));
        var contactEl = document.getElementById(fieldId(pfx, 'contactPerson'));
        var supplierAliasEl = document.getElementById(fieldId(pfx, 'supplierAlias'));
        var supplierAlias = supplierAliasEl ? supplierAliasEl.value.trim() : '';
        if (spec.subjectTypeLabel === '供应商' && !supplierAlias) {
            showToast('请输入供应商别名');
            if (supplierAliasEl) supplierAliasEl.focus();
            return false;
        }
        var subjectId = nextSubjectRowId(subjectIdPrefix, pm);
        if (spec.subjectTypeLabel === '供应商') {
            if (!window.MdmSupplierArchiveStore) {
                showToast('供应商档案数据未加载，请刷新页面后重试');
                return false;
            }
            var saved = window.MdmSupplierArchiveStore.upsert({
                id: subjectId,
                name: nameEl ? nameEl.value.trim() : '',
                shortName: supplierAlias
            });
            if (!saved.ok) {
                showToast(saved.message);
                return false;
            }
        }
        pm.addTableRow({
            cells: [
                subjectId,
                nameEl ? nameEl.value.trim() : '',
                dockVal,
                typeVal || spec.subjectTypeLabel,
                contactEl ? contactEl.value.trim() : '',
                maskPhoneForTable(pv),
                loginVal,
                pm.getCurrentTimeStr(),
                '当前用户',
                { value: spec.defaultStatus || '正常', isStatus: true }
            ]
        });
        if (window.MdmOperationLog) window.MdmOperationLog.record('subject', subjectId, '新增商家主体', null, {
            '主体名称': nameEl ? nameEl.value.trim() : '',
            '主体类型': typeVal || spec.subjectTypeLabel,
            '状态': spec.defaultStatus || '正常'
        });
        showToast(spec.pageLabel + '商家已保存', 'success');
        return subjectId;
    }

    function init(spec) {
        var showBindBd = !!spec.showBindBd;
        var omitSmsAndLogin = !!spec.omitSmsAndLoginAccount;
        var multiSubjectType = Array.isArray(spec.subjectTypeOptions) && spec.subjectTypeOptions.length > 0;
        var disableMsg = spec.disableConfirmMessage || '确定禁用该主体吗？';
        var addModalId = spec.addModalId || 'mdmSubjectAddModal';
        var editModalId = spec.editModalId || 'mdmSubjectDetailModal';
        var addBtnLabel = spec.addButtonLabel || '+ 新增' + spec.pageLabel + '商家';
        var showSubjectOnboarding = !!spec.enableSubjectOnboarding;
        var fields = buildSubjectFields(spec);

        var pm = new PageManager({
            entityName: spec.entityName || spec.pageLabel + '商家',
            addModalTitle: spec.addModalTitle || '添加' + spec.pageLabel + '商家',
            editModalTitle: spec.editModalTitle || '编辑' + spec.pageLabel + '商家',
            detailModalTitle: spec.detailModalTitle || spec.pageLabel + '详情',
            statusColumnIndex: 9,
            checkboxColumn: false,
            actionColumnMode: showSubjectOnboarding ? 'disableTogglePlusOnboard' : 'disableToggle',
            customRowActions: showSubjectOnboarding
                ? [
                      {
                          selector: '.mdm-onboard-btn',
                          handler: function (e, el) {
                              openSubjectOnboardingFromRow(el.closest('tr'), spec.pageLabel, {
                                  onRecordChange: function () {
                                      var editModal = document.getElementById(editModalId);
                                      if (editModal && editModal.style.display === 'block' && pm.isDetailMode) {
                                          renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
                                      }
                                  }
                              });
                          }
                      }
                  ]
                : [],
            pageSize: spec.pageSize != null ? spec.pageSize : 20,
            detailView: {
                enabled: true,
                columnIndex: 1,
                linkClass: 'subject-name-link'
            },
            fields: fields,
            onDisableToggle: function (row, status) {
                if (status === '停用') {
                    pm.updateTableRow(row, { 9: { value: '正常', isStatus: true } });
                    pm.refreshDisableToggleLabel(row);
                    return;
                }
                showLfWarmConfirm(disableMsg, function () {
                    pm.updateTableRow(row, { 9: { value: '停用', isStatus: true } });
                    pm.refreshDisableToggleLabel(row);
                });
            },
            addModal: {
                modalId: addModalId,
                cancelBtnId: addModalId + 'CancelBtn',
                saveBtnId: addModalId + 'SaveBtn',
                triggerBtnId: 'mdmSubjectAddBtn',
                onOpen: function () {
                    if (!multiSubjectType) {
                        var st = document.getElementById(fieldId(spec.fieldIdPrefix, 'subjectType'));
                        if (st) st.value = spec.subjectTypeLabel;
                    }
                },
                validations: buildAddValidations(spec),
                onSave: function () {
                    return saveSubjectRowFromAddForm(pm, spec);
                }
            },
            editModal: {
                modalId: editModalId,
                cancelBtnId: editModalId + 'CancelBtn',
                saveBtnId: editModalId + 'SaveBtn',
                validations: [],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    var c = row.querySelectorAll('td');
                    return {
                        editSubjectId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editDockPerson: c[2].textContent.trim(),
                        editSubjectType: c[3].textContent.trim(),
                        editContactPerson: c[4].textContent.trim(),
                        editRowPhoneDisplay: c[5].textContent.trim(),
                        editLoginAccount: c[6].textContent.trim(),
                        editCreateTime: c[7].textContent.trim(),
                        editLastOperator: c[8].textContent.trim(),
                        editRowStatus: c[9].querySelector('.status').textContent.trim(),
                        editSmsCode: '—'
                    };
                },
                onSave: function () {},
                onDetailModeChange: function (isDetail) {
                    var g = document.getElementById('editSmsCode');
                    if (g && g.closest)
                        g.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                    var editModal = document.getElementById(editModalId);
                    if (!editModal) return;
                    var form = editModal.querySelector('.modal-form');
                    if (form) form.style.display = isDetail ? 'none' : '';
                    var blk = editModal.querySelector('[data-subject-onboard-detail]');
                    if (!isDetail) {
                        if (blk) blk.style.display = 'none';
                        return;
                    }
                    if (showSubjectOnboarding) {
                        renderSubjectDetailOnboardingBlock(pm, spec, editModalId);
                    }
                }
            }
        });

        pm.init();

        var addBtn = document.getElementById('mdmSubjectAddBtn');
        if (addBtn) addBtn.textContent = addBtnLabel;

        document.getElementById('btnFilterReset') &&
            document.getElementById('btnFilterReset').addEventListener('click', function () {
                var ni = document.getElementById('qSubjectName');
                var ss = document.getElementById('qStatus');
                if (ni) ni.value = '';
                if (ss) ss.value = '';
                filterSubjectRows(pm);
            });
        document.getElementById('btnFilterQuery') &&
            document.getElementById('btnFilterQuery').addEventListener('click', function () {
                filterSubjectRows(pm);
            });

        var smsInput = document.getElementById(fieldId(spec.fieldIdPrefix, 'smsCode'));
        if (smsInput) {
            smsInput.setAttribute('maxlength', '6');
            smsInput.setAttribute('inputmode', 'numeric');
        }

        document.body.addEventListener('click', function (e) {
            var t = e.target;
            if (
                t &&
                (t.id === 'mdmSmsDummyBtn' ||
                    (t.classList && t.classList.contains('mdm-sms-dummy-btn')))
            ) {
                handleSubjectSmsDummyClick(t);
            }
        });

        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            document.querySelectorAll('#tableBody tr').forEach(function (tr) {
                pm.refreshDisableToggleLabel(tr);
            });
        }, 0);

        return pm;
    }

    function handleSubjectSmsDummyClick(btn) {
        var modal = btn && btn.closest ? btn.closest('.modal') : null;
        var phoneInp = modal ? modal.querySelector('input[id$="addPhone"]') : null;
        if (!phoneInp && btn && btn.id) {
            phoneInp = document.getElementById(String(btn.id).replace(/mdmSmsDummyBtn$/, 'addPhone'));
        }
        var digits = phoneInp ? String(phoneInp.value || '').replace(/\D/g, '') : '';
        if (digits.length !== 11) {
            showToast('请先输入11位手机号码', 'info');
            if (phoneInp) phoneInp.focus();
            return;
        }
        showToast('验证码已发送（演示）', 'info');
    }

    function rowMerchantKind(tr) {
        var c = tr ? tr.querySelectorAll('td') : [];
        var t = c[3] ? c[3].textContent.trim() : '';
        if (t === '服务商') return '服务商';
        if (t === '供应商' || t === '贸易商' || t === '仓库' || t === '门店') return t;
        return '门店';
    }

    function archiveKindOf(label) {
        if (label === '供应商') return 'supplier';
        if (label === '仓库') return 'warehouse';
        if (label === '贸易商') return 'trader';
        if (label === '门店') return 'store';
        return '';
    }

    function openKindAddModal(modalId, kindSpec) {
        var modal = document.getElementById(modalId);
        if (!modal) return;
        modal.querySelectorAll('input, select, textarea').forEach(function (el) {
            if (el.disabled) return;
            if (el.type === 'radio' || el.type === 'checkbox' || el.type === 'file') return;
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        });
        var st = document.getElementById(fieldId(kindSpec.fieldIdPrefix, 'subjectType'));
        if (st) st.value = kindSpec.subjectTypeLabel;
        if (kindSpec.entryRoot && window.MdmEntryMaterials) window.MdmEntryMaterials.fill(kindSpec.entryRoot, {});
        if (kindSpec.archiveBundle && kindSpec.archiveBundle.refs) {
            var archiveName = kindSpec.archiveBundle.refs.nameInp;
            if (archiveName) archiveName.removeAttribute('data-user-edited');
            if (kindSpec.archiveBundle.refs.entryMaterials && window.MdmEntryMaterials) {
                window.MdmEntryMaterials.fill(kindSpec.archiveBundle.refs.entryMaterials, {});
            }
            var statusName = kindSpec.archiveBundle.refs.statusName;
            if (statusName) {
                modal.querySelectorAll('input[name="' + statusName + '"]').forEach(function (inp) {
                    inp.checked = inp.value === '正常';
                });
            }
        }
        if (typeof modal.__subjWizReset === 'function') modal.__subjWizReset();
        modal.style.display = 'block';
    }

    function mountKindAddModal(mainPm, kindSpec) {
        var modalId = kindSpec.addModalId;
        var cancelId = modalId + 'CancelBtn';
        var saveId = modalId + 'SaveBtn';
        var helper = new PageManager({
            fields: buildSubjectFields(kindSpec),
            entityName: kindSpec.pageLabel + '商家',
            addModalTitle: '添加' + kindSpec.pageLabel + '商家',
            addModal: {
                modalId: modalId,
                cancelBtnId: cancelId,
                saveBtnId: saveId
            }
        });
        helper.autoGenerateModals();
        var smsInput = document.getElementById(fieldId(kindSpec.fieldIdPrefix, 'smsCode'));
        if (smsInput) {
            smsInput.setAttribute('maxlength', '6');
            smsInput.setAttribute('inputmode', 'numeric');
        }

        var btn = document.getElementById(kindSpec.triggerBtnId);
        if (btn) {
            btn.addEventListener('click', function () {
                openKindAddModal(modalId, kindSpec);
            });
        }
        var modal = document.getElementById(modalId);
        if (!modal) return;
        var formHost = modal.querySelector('.modal-form') || modal.querySelector('.modal-body') || modal;
        var archiveKind = archiveKindOf(kindSpec.subjectTypeLabel);
        if (archiveKind) {
            var content = modal.querySelector('.modal-content');
            if (content) content.style.width = '960px';
            if (formHost) {
                formHost.style.maxHeight = '72vh';
                formHost.style.overflow = 'auto';
            }
            if (window.MdmResourceArchiveForms && typeof window.MdmResourceArchiveForms.buildFirstArchive === 'function') {
                kindSpec.archiveBundle = window.MdmResourceArchiveForms.buildFirstArchive(archiveKind);
                formHost.appendChild(kindSpec.archiveBundle.body);
                var subjectNameInput = document.getElementById(fieldId(kindSpec.fieldIdPrefix, 'subjectName'));
                if (subjectNameInput && kindSpec.archiveBundle.refs.nameInp) {
                    subjectNameInput.addEventListener('input', function () {
                        var archiveName = kindSpec.archiveBundle.refs.nameInp;
                        if (archiveName.getAttribute('data-user-edited') === '1') return;
                        archiveName.value = subjectNameInput.value;
                        archiveName.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    kindSpec.archiveBundle.refs.nameInp.addEventListener('input', function () {
                        if (document.activeElement === kindSpec.archiveBundle.refs.nameInp) {
                            kindSpec.archiveBundle.refs.nameInp.setAttribute('data-user-edited', '1');
                        }
                    });
                }
            } else if ((archiveKind === 'store' || archiveKind === 'supplier') && window.MdmEntryMaterials) {
                kindSpec.entryRoot = window.MdmEntryMaterials.mount(formHost, { skin: 'pc' });
            }
        }
        var closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                modal.style.display = 'none';
            });
        }
        var cancelBtn = document.getElementById(cancelId);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                modal.style.display = 'none';
            });
        }
        var saveBtn = document.getElementById(saveId);
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                var rules = buildAddValidations(kindSpec);
                for (var i = 0; i < rules.length; i++) {
                    var el = document.getElementById(rules[i].id);
                    var val = el ? String(el.value || '').trim() : '';
                    if (rules[i].required && !val) {
                        showToast(rules[i].message);
                        if (el) el.focus();
                        return;
                    }
                }
                if (kindSpec.archiveBundle && window.MdmResourceArchiveForms) {
                    var archiveErr = window.MdmResourceArchiveForms.validateFirstArchive(kindSpec.archiveBundle);
                    if (archiveErr) {
                        showToast(archiveErr, 'error');
                        return;
                    }
                } else if (kindSpec.entryRoot && window.MdmEntryMaterials) {
                    var entryErr = window.MdmEntryMaterials.validate(kindSpec.entryRoot);
                    if (entryErr) {
                        showToast(entryErr, 'error');
                        return;
                    }
                }
                var pfx = kindSpec.fieldIdPrefix || '';
                var nameBefore = (document.getElementById(fieldId(pfx, 'subjectName')) || {}).value || '';
                var contactBefore = (document.getElementById(fieldId(pfx, 'contactPerson')) || {}).value || '';
                var phoneBefore = (document.getElementById(fieldId(pfx, 'addPhone')) || {}).value || '';
                var typeBefore = (document.getElementById(fieldId(pfx, 'subjectType')) || {}).value || '';
                var bdBefore = (document.getElementById(fieldId(pfx, 'dockPerson')) || {}).value || '';
                var aliasBefore = (document.getElementById(fieldId(pfx, 'supplierAlias')) || {}).value || '';
                if (!kindSpec.archiveBundle && kindSpec.entryRoot && window.MdmEntryMaterials && String(nameBefore).trim()) {
                    window.MdmEntryMaterials.save(
                        kindSpec.subjectTypeLabel === '供应商' ? 'supplier' : 'store',
                        String(nameBefore).trim(),
                        window.MdmEntryMaterials.read(kindSpec.entryRoot)
                    );
                }
                var savedId = saveSubjectRowFromAddForm(mainPm, kindSpec);
                if (savedId === false) return;
                if (kindSpec.archiveBundle && window.MdmResourceArchiveForms) {
                    var committed = window.MdmResourceArchiveForms.commitFirstArchive(
                        archiveKind,
                        {
                            id: typeof savedId === 'string' ? savedId : '',
                            name: String(nameBefore || '').trim(),
                            contact: String(contactBefore || '').trim(),
                            phone: String(phoneBefore || '').trim(),
                            bd: String(bdBefore || '').trim(),
                            alias: String(aliasBefore || '').trim(),
                            subjectType: String(typeBefore || '').trim() || kindSpec.subjectTypeLabel
                        },
                        kindSpec.archiveBundle
                    );
                    if (committed === false) return;
                    var archiveRefs = kindSpec.archiveBundle.refs || {};
                    var bizName = archiveRefs.nameInp ? String(archiveRefs.nameInp.value || '').trim() : '';
                    if (archiveKind !== 'warehouse' && window.MdmResourceArchiveForms.enqueueEntryAudit) {
                        var partnerMap = { franchise: '加盟店', joint: '联营店', direct: '直营店' };
                        var partnerValue = archiveRefs.partnerSel ? archiveRefs.partnerSel.value : '';
                        window.MdmResourceArchiveForms.enqueueEntryAudit({
                            kind: archiveKind,
                            source: 'PC 创建主体',
                            subjectName: String(nameBefore || '').trim(),
                            subjectType: String(typeBefore || '').trim() || kindSpec.subjectTypeLabel,
                            storeName: bizName || String(nameBefore || '').trim(),
                            bd: String(bdBefore || '').trim(),
                            contact: String(contactBefore || '').trim(),
                            phone: String(phoneBefore || '').trim(),
                            partnerDivision: partnerMap[partnerValue] || partnerValue || '',
                            storeType: archiveRefs.storeTypeInp ? String(archiveRefs.storeTypeInp.value || '').trim() : '',
                            warehouse: archiveRefs.warehouseSel ? (archiveRefs.warehouseSel.options[archiveRefs.warehouseSel.selectedIndex] || {}).text || '' : '',
                            bizLine: archiveRefs.bizLineSel ? archiveRefs.bizLineSel.value : '',
                            brandName: archiveRefs.brandSel ? archiveRefs.brandSel.value : '',
                            bizLines: archiveRefs.bizHidden ? archiveRefs.bizHidden.value : '',
                            region: archiveRefs.regionInp ? String(archiveRefs.regionInp.value || '').trim() : '',
                            address: archiveRefs.addressTa ? String(archiveRefs.addressTa.value || '').trim() : '',
                            shortName: bizName || String(nameBefore || '').trim()
                        });
                    }
                    var archiveTip = archiveKind === 'warehouse'
                        ? '已提交首个仓库档案，可在仓库档案查看'
                        : '已提交入驻审核，审核全部通过后发起合同签署';
                    showToast(archiveTip, 'success');
                }
                modal.style.display = 'none';
                mainPm.decorateAllDetailLinkCells();
                paintSubjectDetailLinks();
                mainPm.refreshPagination();
                if (
                    !kindSpec.archiveBundle &&
                    kindSpec.subjectTypeLabel === '贸易商' &&
                    window.MdmTraderArchiveStore &&
                    typeof window.MdmTraderArchiveStore.addFromSubject === 'function'
                ) {
                    window.MdmTraderArchiveStore.addFromSubject({
                        subjectId: typeof savedId === 'string' ? savedId : '',
                        subjectName: String(nameBefore || '').trim(),
                        subjectType: String(typeBefore || '').trim() || kindSpec.subjectTypeLabel,
                        contact: String(contactBefore || '').trim(),
                        phone: String(phoneBefore || '').trim()
                    });
                    showToast('已写入贸易商档案，正在跳转…', 'success');
                    setTimeout(function () {
                        window.location.href = 'mdm_archive_trader.html';
                    }, 600);
                } else if (
                    kindSpec.subjectTypeLabel === '服务商' &&
                    window.MdmProviderArchiveStore &&
                    typeof window.MdmProviderArchiveStore.addFromSubject === 'function'
                ) {
                    window.MdmProviderArchiveStore.addFromSubject({
                        subjectId: typeof savedId === 'string' ? savedId : '',
                        subjectName: String(nameBefore || '').trim(),
                        subjectType: '服务商',
                        contact: String(contactBefore || '').trim(),
                        phone: String(phoneBefore || '').trim()
                    });
                    showToast('已写入服务商档案，正在跳转…', 'success');
                    setTimeout(function () {
                        window.location.href = 'mdm_archive_provider.html';
                    }, 600);
                }
            });
        }
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
        });
        if (window.MdmSubjectAddWizard && typeof window.MdmSubjectAddWizard.dress === 'function') {
            window.MdmSubjectAddWizard.dress(modal, kindSpec.subjectTypeLabel);
        }
        if (typeof initCustomSelect === 'function') {
            modal.querySelectorAll('.custom-select > input[id]').forEach(function (input) {
                if (document.getElementById(input.id + 'Dropdown')) {
                    initCustomSelect(input.id, input.id + 'Dropdown');
                }
            });
        }
    }

    /**
     * 所有主体：门店/供应商/贸易商/仓库商家合并列表；各新增按钮各自打开原表单字段
     */
    function initUnified() {
        var kindByLabel = {
            门店: {
                pageLabel: '门店',
                subjectTypeLabel: '门店',
                showBindBd: true,
                /* 创建需短信验证码；不收集登录账号 */
                compactStoreSubjectForm: true,
                enableSubjectOnboarding: true,
                defaultStatus: '开启',
                addModalId: 'mdmAllAddStore',
                triggerBtnId: 'mdmAddStoreMerchantBtn',
                fieldIdPrefix: 'st_',
                subjectIdPrefix: 'STORE',
                disableConfirmMessage: '确定禁用此门店吗？'
            },
            供应商: {
                pageLabel: '供应商',
                subjectTypeLabel: '供应商',
                /* 创建需短信验证码；不收集登录账号 */
                compactStoreSubjectForm: true,
                enableSubjectOnboarding: true,
                defaultStatus: '开启',
                addModalId: 'mdmAllAddSup',
                triggerBtnId: 'mdmAddSupMerchantBtn',
                fieldIdPrefix: 'sup_',
                subjectIdPrefix: 'SUP',
                disableConfirmMessage: '确定禁用此供应商吗？'
            },
            贸易商: {
                pageLabel: '贸易商',
                subjectTypeLabel: '贸易商',
                /* 主体类型锁定为贸易商，不可改 */
                compactStoreSubjectForm: true,
                enableSubjectOnboarding: true,
                defaultStatus: '开启',
                addModalId: 'mdmAllAddTrader',
                triggerBtnId: 'mdmAddTraderMerchantBtn',
                fieldIdPrefix: 'trd_',
                subjectIdPrefix: 'TRD',
                disableConfirmMessage: '确定禁用此贸易商吗？'
            },
            服务商: {
                pageLabel: '服务商',
                subjectTypeLabel: '服务商',
                /* 主体类型锁定为服务商，不可改；成功后写入服务商档案 */
                compactStoreSubjectForm: true,
                enableSubjectOnboarding: true,
                defaultStatus: '开启',
                addModalId: 'mdmAllAddProvider',
                triggerBtnId: 'mdmAddProviderMerchantBtn',
                fieldIdPrefix: 'prv_',
                subjectIdPrefix: 'PRV',
                disableConfirmMessage: '确定禁用此服务商吗？'
            },
            仓库: {
                pageLabel: '仓库',
                subjectTypeLabel: '仓库',
                /* 创建需短信验证码；不收集登录账号 */
                compactStoreSubjectForm: true,
                enableSubjectOnboarding: true,
                defaultStatus: '开启',
                addModalId: 'mdmAllAddWh',
                triggerBtnId: 'mdmAddWhMerchantBtn',
                fieldIdPrefix: 'wh_',
                subjectIdPrefix: 'WH',
                disableConfirmMessage: '确定禁用此仓库吗？'
            }
        };
        var editModalId = 'mdmPartyAllDetail';
        var activeKind = kindByLabel['门店'];

        var detailFields = buildSubjectFields({
            pageLabel: '商家',
            subjectTypeLabel: '门店',
            subjectTypeOptions: ['门店', '供应商', '贸易商', '服务商', '仓库'],
            bindColumnLabel: '绑定BD名称',
            contactPersonLabel: '联系人',
            statusOptions: [
                { value: '开启', text: '开启' },
                { value: '冻结', text: '冻结' },
                { value: '禁用', text: '禁用' }
            ]
        });

        var pm = new PageManager({
            entityName: '商家',
            editModalTitle: '商家详情',
            detailModalTitle: '商家详情',
            statusColumnIndex: 9,
            checkboxColumn: false,
            /* 列表操作对齐运营后台：仅「禁用/开启」；进件从详情进入 */
            actionColumnMode: 'disableToggle',
            disableToggleVerb: 'openClose',
            pageSize: 20,
            fields: detailFields,
            detailView: {
                enabled: true,
                columnIndex: 1,
                linkClass: 'subject-name-link',
                onOpenDetail: function (row) {
                    openMerchantDetailDrawer(row);
                }
            },
            onDisableToggle: function (row, status) {
                var cells = row ? row.querySelectorAll('td') : [];
                var shownType = cells[3] ? cells[3].textContent.trim() : '';
                var label = rowMerchantKind(row);
                var kindSpec = kindByLabel[label] || kindByLabel['门店'];
                if (status === '禁用' || status === '停用' || status === '冻结') {
                    pm.updateTableRow(row, { 9: { value: '开启', isStatus: true } });
                    if (window.MdmOperationLog) window.MdmOperationLog.record('subject',
                        row.cells[0].textContent.trim(), '启用商家主体', { '状态': status }, { '状态': '开启' });
                    pm.refreshDisableToggleLabel(row);
                    return;
                }
                var disableMessage =
                    shownType === '服务商' ? '确定禁用此服务商吗？' : kindSpec.disableConfirmMessage;
                showLfWarmConfirm(disableMessage, function () {
                    pm.updateTableRow(row, { 9: { value: '禁用', isStatus: true } });
                    if (window.MdmOperationLog) window.MdmOperationLog.record('subject',
                        row.cells[0].textContent.trim(), '禁用商家主体', { '状态': status }, { '状态': '禁用' });
                    pm.refreshDisableToggleLabel(row);
                });
            },
            editModal: {
                modalId: editModalId,
                cancelBtnId: editModalId + 'CancelBtn',
                saveBtnId: editModalId + 'SaveBtn',
                validations: [],
                mapRowToForm: function (row) {
                    pm.currentEditRow = row;
                    activeKind = kindByLabel[rowMerchantKind(row)] || kindByLabel['门店'];
                    var c = row.querySelectorAll('td');
                    var titleEl = document.querySelector('#' + editModalId + ' .modal-title');
                    var shownType = c[3] ? c[3].textContent.trim() : '';
                    if (titleEl) titleEl.textContent = (shownType || activeKind.pageLabel) + '详情';
                    return {
                        editSubjectId: c[0].textContent.trim(),
                        editSubjectName: c[1].textContent.trim(),
                        editDockPerson: c[2].textContent.trim(),
                        editSubjectType: c[3].textContent.trim(),
                        editContactPerson: c[4].textContent.trim(),
                        editRowPhoneDisplay: c[5].textContent.trim(),
                        editLoginAccount: c[6].textContent.trim(),
                        editCreateTime: c[7].textContent.trim(),
                        editLastOperator: c[8].textContent.trim(),
                        editRowStatus: c[9].querySelector('.status')
                            ? c[9].querySelector('.status').textContent.trim()
                            : '开启',
                        editSmsCode: '—'
                    };
                },
                onSave: function () {},
                onDetailModeChange: function (isDetail) {
                    var g = document.getElementById('editSmsCode');
                    if (g && g.closest) {
                        g.closest('.modal-form-group').style.display = isDetail ? 'none' : '';
                    }
                    var editModal = document.getElementById(editModalId);
                    if (!editModal) return;
                    var form = editModal.querySelector('.modal-form');
                    if (form) form.style.display = isDetail ? 'none' : '';
                    var blk = editModal.querySelector('[data-subject-onboard-detail]');
                    if (!isDetail) {
                        if (blk) blk.style.display = 'none';
                        return;
                    }
                    var row = pm.currentEditRow;
                    var kindSpec = kindByLabel[rowMerchantKind(row)] || kindByLabel['门店'];
                    renderSubjectDetailOnboardingBlock(pm, kindSpec, editModalId);
                }
            }
        });

        paintSubjectDetailLinks();
        pm.init();

        ['门店', '供应商', '贸易商', '服务商', '仓库'].forEach(function (label) {
            mountKindAddModal(pm, kindByLabel[label]);
        });

        document.getElementById('btnFilterReset') &&
            document.getElementById('btnFilterReset').addEventListener('click', function () {
                var ni = document.getElementById('qSubjectName');
                var ss = document.getElementById('qStatus');
                if (ni) ni.value = '';
                if (ss) ss.value = '';
                filterSubjectRows(pm);
            });
        document.getElementById('btnFilterQuery') &&
            document.getElementById('btnFilterQuery').addEventListener('click', function () {
                filterSubjectRows(pm);
            });

        document.body.addEventListener('click', function (e) {
            var t = e.target;
            if (t && t.classList && t.classList.contains('mdm-sms-dummy-btn')) {
                showToast('验证码已发送（演示）', 'info');
            }
            var detailLink = t && t.closest ? t.closest('.mdm-subject-detail') : null;
            if (detailLink) {
                e.preventDefault();
                openSubjectDetailDrawer(detailLink.closest('tr'));
                return;
            }
            var onboardLink = t && t.closest ? t.closest('.mdm-subject-onboard') : null;
            if (onboardLink) {
                e.preventDefault();
                var onboardRow = onboardLink.closest('tr');
                openSubjectOnboardingFromRow(onboardRow, rowMerchantKind(onboardRow), {});
            }
        });

        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            paintSubjectDetailLinks();
            document.querySelectorAll('#tableBody tr').forEach(function (tr) {
                pm.refreshDisableToggleLabel(tr);
            });
        }, 0);

        return pm;
    }

    window.MdmSubjectLf = {
        init: init,
        initUnified: initUnified,
        filterSubjectRows: filterSubjectRows,
        showLfWarmConfirm: showLfWarmConfirm
    };
})();
