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
                '<h2 class="modal-title">温馨提示</h2>' +
                '<span class="close" id="lfMdmWarmCloseX">&times;</span>' +
                '</div>' +
                '<div class="modal-body" style="padding:16px 20px;line-height:1.65;color:#333">' +
                '<p id="lfMdmWarmMsg" style="margin:0;"></p>' +
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

    function showLfWarmConfirm(message, onOk) {
        ensureLfWarmConfirmModal();
        var modal = document.getElementById('lfMdmWarmConfirm');
        var okBtn = document.getElementById('lfMdmWarmOk');
        var msgEl = document.getElementById('lfMdmWarmMsg');
        if (!modal || !okBtn || !msgEl) return;
        msgEl.textContent = message;
        modal.style.display = 'block';
        okBtn.onclick = function () {
            modal.style.display = 'none';
            okBtn.onclick = null;
            if (typeof onOk === 'function') onOk();
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
            if (qSt === 'normal' && stTxt !== '正常') ok = false;
            if (qSt === 'frozen' && stTxt !== '冻结') ok = false;
            if (qSt === 'stopped' && stTxt !== '停用') ok = false;
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
     *   compactStoreSubjectForm?: boolean,
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

    function firstMissingOnboardingField(fields) {
        var f = fields || {};
        var checks = [
            { key: 'short_name', label: '商户简称' },
            { key: 'receipt_name', label: '小票名称' },
            { key: 'detail_addr', label: '实际经营地址' },
            { key: 'legal_mobile_no', label: '法人手机号' },
            { key: 'contact_mobile_no', label: '管理员手机号' },
            { key: 'contact_email', label: '管理员邮箱' },
            { key: 'license_pic', label: '营业执照(F07)' },
            { key: 'legal_cert_front_pic', label: '法人身份证人像面(F02)' },
            { key: 'legal_cert_back_pic', label: '法人身份证国徽面(F03)' },
            { key: 'store_header_pic', label: '门头/场地照(F22)' },
            { key: 'store_indoor_pic', label: '内景/工作区域照(F24)' },
            { key: 'store_cashier_desk_pic', label: '收银台/前台照(F105)' }
        ];
        var i;
        for (i = 0; i < checks.length; i++) {
            if (!isTruthyValue(f[checks[i].key])) return checks[i].label;
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
                license_pic: String(picked.license_pic || '').trim(),
                legal_cert_front_pic: String(picked.legal_cert_front_pic || '').trim(),
                legal_cert_back_pic: String(picked.legal_cert_back_pic || '').trim(),
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
                license_pic: '',
                legal_cert_front_pic: '',
                legal_cert_back_pic: '',
                store_header_pic: '',
                store_indoor_pic: '',
                store_cashier_desk_pic: ''
            };
        }
        if (!defaults.short_name) defaults.short_name = shortName;
        if (!defaults.receipt_name) defaults.receipt_name = defaults.short_name;
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
                license_pic: isTruthyValue(f.license_pic) || isTruthyValue(defaults.license_pic),
                legal_cert_front_pic:
                    isTruthyValue(f.legal_cert_front_pic) || isTruthyValue(defaults.legal_cert_front_pic),
                legal_cert_back_pic:
                    isTruthyValue(f.legal_cert_back_pic) || isTruthyValue(defaults.legal_cert_back_pic),
                store_header_pic: isTruthyValue(f.store_header_pic) || isTruthyValue(defaults.store_header_pic),
                store_indoor_pic: isTruthyValue(f.store_indoor_pic) || isTruthyValue(defaults.store_indoor_pic),
                store_cashier_desk_pic:
                    isTruthyValue(f.store_cashier_desk_pic) || isTruthyValue(defaults.store_cashier_desk_pic)
            };
        }
        window.MdmUnifiedOnboardingUi.openModal({
            title: meta.title,
            merchantShortNameDefault: shortName,
            fieldDefaults: defaults,
            recordKey: meta.recordKey,
            variant: 'resource',
            forceView: !!(extraOpts && extraOpts.forceView),
            onRecordChange:
                extraOpts && typeof extraOpts.onRecordChange === 'function' ?
                    extraOpts.onRecordChange :
                    null
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
        var missing = firstMissingOnboardingField(current.fields || {});
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
        section('页头信息', [
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
            ['上级汇付号', r.headHuifuId || ext.headHuifuId || '—'],
            ['结算主体类型', rowInfo.subjectType || '—']
        ]);
        section('执照信息', [
            ['营业执照', f.license_pic, 'image'],
            ['营业执照名称', r.regName || ext.regName || '—'],
            ['注册号/统一信用代码', r.licenseCode || ext.licenseCode || '—'],
            ['公司类型', r.entType || ext.entType || '—'],
            ['成立日期', r.foundDate || ext.foundDate || '—'],
            ['执照有效期', (r.licenseBeginDate || ext.licenseBeginDate || '—') + ' ~ ' + (r.licenseEndDate || ext.licenseEndDate || '—')],
            ['注册地址', r.regDetail || ext.regDetail || '—'],
            ['实际经营地址', f.detail_addr || '—']
        ]);
        section('法人信息', [
            ['法人姓名', r.legalName || ext.legalName || '—'],
            ['法人手机号', f.legal_mobile_no || '—'],
            ['证件类型', r.legalCertType || ext.legalCertType || '—'],
            ['身份证号', maskMiddle(r.legalIdNo || ext.legalIdNo)],
            ['证件有效期', (r.legalCertBeginDate || ext.legalCertBeginDate || '—') + ' ~ ' + (r.legalCertEndDate || ext.legalCertEndDate || '—')],
            ['身份证地址', r.legalAddr || ext.legalAddr || '—'],
            ['身份证人像面', f.legal_cert_front_pic, 'image'],
            ['身份证国徽面', f.legal_cert_back_pic, 'image']
        ]);
        section('经营信息', [
            ['商户简称', f.short_name || '—'],
            ['小票名称', f.receipt_name || '—'],
            ['场景类型', r.sceneType || ext.sceneType || '—'],
            ['经营类型', r.businessType || ext.businessType || '—']
        ]);
        section('联系人信息', [
            ['管理员姓名', r.contactName || ext.contactName || rowInfo.contactName || '—'],
            ['管理员手机号', f.contact_mobile_no || rowInfo.contactMobile || '—'],
            ['管理员邮箱', f.contact_email || '—'],
            ['登录账号', r.loginName || ext.loginName || rowInfo.loginAccount || '—']
        ]);
        section('结算信息', [
            ['开户名/结算户名', card.account_name || '—'],
            ['银行账号', maskBank(card.card_no)],
            ['开户银行', card.bank_name || '—'],
            ['开户支行', card.bank_branch || '—'],
            ['开户许可证', r.openLicencePic || ext.openLicencePic || '', 'image'],
            ['开户许可证核准号', r.openLicenceNo || ext.openLicenceNo || '—']
        ]);
        section('经营场地信息', [
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
        var f = rec.fields || {};
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
            '<div style="font-size:14px;font-weight:700;color:#0f172a;margin:14px 0 10px">进件信息</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px;font-size:12px;color:#334155">' +
            '<div>商户简称：' + (f.short_name || '—') + '</div>' +
            '<div>小票名称：' + (f.receipt_name || '—') + '</div>' +
            '<div>实际经营地址：' + (f.detail_addr || '—') + '</div>' +
            '<div>法人手机号：' + (f.legal_mobile_no || '—') + '</div>' +
            '<div>管理员手机号：' + (f.contact_mobile_no || '—') + '</div>' +
            '<div>管理员邮箱：' + (f.contact_email || '—') + '</div>' +
            '<div>银行卡信息：' + cardInfoText(f.card_info) + '</div>' +
            '<div>营业执照(F07)：' + uploadText(f.license_pic) + '</div>' +
            '<div>身份证人像面(F02)：' + uploadText(f.legal_cert_front_pic) + '</div>' +
            '<div>身份证国徽面(F03)：' + uploadText(f.legal_cert_back_pic) + '</div>' +
            '<div>门头照(F22)：' + uploadText(f.store_header_pic) + '</div>' +
            '<div>内景照(F24)：' + uploadText(f.store_indoor_pic) + '</div>' +
            '<div>收银台照(F105)：' + uploadText(f.store_cashier_desk_pic) + '</div>' +
            '</div>' +
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

    function init(spec) {
        var showBindBd = !!spec.showBindBd;
        var compactLogin = !!spec.compactStoreSubjectForm;
        var contactLabel = spec.contactPersonLabel || '联系人';
        var bindHdr = spec.bindColumnLabel || '绑定BD名称';
        var disableMsg = spec.disableConfirmMessage || '确定禁用该主体吗？';
        var addModalId = spec.addModalId || 'mdmSubjectAddModal';
        var editModalId = spec.editModalId || 'mdmSubjectDetailModal';
        var addBtnLabel = spec.addButtonLabel || '+ 新增' + spec.pageLabel + '主体';
        var multiSubjectType = Array.isArray(spec.subjectTypeOptions) && spec.subjectTypeOptions.length > 0;
        var typeOptions = multiSubjectType
            ? spec.subjectTypeOptions.map(function (x) {
                  return { value: x, text: x };
              })
            : [{ value: spec.subjectTypeLabel, text: spec.subjectTypeLabel }];
        var idPrefixMap = {
            门店: 'STORE',
            供应商: 'SUP',
            仓库: 'WH',
            直播间: 'LIVE',
            承运商: 'CAR'
        };
        var subjectIdPrefix = spec.subjectIdPrefix || idPrefixMap[spec.pageLabel] || 'SUB';

        var showSubjectOnboarding = !!spec.enableSubjectOnboarding;

        var fields = [
            {
                id: 'subjectId',
                label: '主体ID',
                type: 'text',
                required: true,
                editDisabled: true,
                hiddenInAdd: true
            },
            {
                id: 'subjectName',
                label: '主体名称',
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入主体名称'
            }
        ];

        if (showBindBd) {
            fields.push({
                id: 'dockPerson',
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
                id: 'dockPerson',
                label: bindHdr,
                type: 'text',
                editDisabled: true,
                hiddenInAdd: true
            });
        }

        fields.push(
            {
                id: 'subjectType',
                label: '主体类型',
                type: 'select',
                required: true,
                editDisabled: true,
                disabled: !multiSubjectType,
                options: typeOptions
            },
            {
                id: 'contactPerson',
                label: contactLabel,
                type: 'text',
                required: true,
                editDisabled: true,
                placeholder: '请输入' + contactLabel
            },
            {
                type: 'raw',
                html:
                    '<div class="modal-form-group" style="width:100%">' +
                    '<label style="min-width:100px"><span style="color:red">*</span>手机号码</label>' +
                    '<div style="flex:1;display:flex;gap:8px;align-items:center">' +
                    '<div class="input-wrapper" style="flex:1">' +
                    '<input type="text" id="addPhone" placeholder="请输入手机号码">' +
                    '<span class="clear-btn">×</span></div>' +
                    '<button type="button" class="btn btn-secondary btn-sm" id="mdmSmsDummyBtn">获取验证码</button>' +
                    '</div></div>',
                editHtml:
                    '<div class="modal-form-group"><label style="min-width:100px">手机号码</label>' +
                    '<div class="input-wrapper">' +
                    '<input type="text" id="editRowPhoneDisplay" disabled>' +
                    '<span class="clear-btn">×</span></div></div>'
            },
            {
                id: 'smsCode',
                label: '验证码',
                type: 'text',
                required: true,
                editDisabled: true
            },
            ...(compactLogin
                ? []
                : [
                      {
                          id: 'loginAccount',
                          label: '登录账号',
                          type: 'text',
                          editDisabled: true,
                          placeholder: '请输入登录账号'
                      }
                  ]),
            {
                id: 'createTime',
                label: '创建时间',
                type: 'text',
                editDisabled: true,
                disabled: true,
                hiddenInAdd: true
            },
            {
                id: 'lastOperator',
                label: '最后操作人',
                type: 'text',
                editDisabled: true,
                hiddenInAdd: true
            },
            {
                id: 'rowStatus',
                label: '状态',
                type: 'select',
                required: true,
                editDisabled: true,
                hiddenInAdd: true,
                options: [
                    { value: '正常', text: '正常' },
                    { value: '冻结', text: '冻结' },
                    { value: '停用', text: '停用' }
                ]
            }
        );

        var pm = new PageManager({
            entityName: spec.entityName || spec.pageLabel + '主体',
            addModalTitle: spec.addModalTitle || '添加' + spec.pageLabel + '主体',
            editModalTitle: spec.editModalTitle || '编辑' + spec.pageLabel + '主体',
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
                        var st = document.getElementById('subjectType');
                        if (st) st.value = spec.subjectTypeLabel;
                    }
                },
                validations: [
                    { id: 'subjectName', message: '请输入主体名称', required: true },
                    ...(showBindBd
                        ? [{ id: 'dockPerson', message: '请选择绑定BD', required: true }]
                        : []),
                    ...(multiSubjectType
                        ? [{ id: 'subjectType', message: '请选择主体类型', required: true }]
                        : []),
                    {
                        id: 'contactPerson',
                        message: '请输入' + contactLabel,
                        required: true
                    },
                    { id: 'addPhone', message: '请输入手机号码', required: true },
                    { id: 'smsCode', message: '请输入验证码', required: true }
                ],
                onSave: function () {
                    var pv = document.getElementById('addPhone')
                        ? document.getElementById('addPhone').value.trim()
                        : '';
                    if (!pv) {
                        showToast('请输入手机号码');
                        return false;
                    }
                    var loginVal = compactLogin
                        ? '—'
                        : document.getElementById('loginAccount')
                          ? document.getElementById('loginAccount').value.trim() || '—'
                          : '—';
                    if (!compactLogin && (!loginVal || loginVal === '—')) {
                        showToast('请输入登录账号');
                        return false;
                    }
                    var dockVal = '—';
                    if (showBindBd) {
                        var dockEl = document.getElementById('dockPerson');
                        dockVal = dockEl ? dockEl.value.trim() : '';
                        if (!dockVal) {
                            showToast('请选择绑定BD');
                            return false;
                        }
                    }
                    var typeEl = document.getElementById('subjectType');
                    var typeVal = typeEl ? typeEl.value.trim() : spec.subjectTypeLabel;
                    var cells = [
                        nextSubjectRowId(subjectIdPrefix, pm),
                        document.getElementById('subjectName').value.trim(),
                        dockVal,
                        typeVal || spec.subjectTypeLabel,
                        document.getElementById('contactPerson').value.trim(),
                        maskPhoneForTable(pv),
                        loginVal,
                        pm.getCurrentTimeStr(),
                        '当前用户',
                        { value: '正常', isStatus: true }
                    ];
                    pm.addTableRow({ cells: cells });
                    showToast(spec.pageLabel + '主体已保存', 'success');
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

        document.body.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'mdmSmsDummyBtn')
                showToast('验证码已发送（演示）', 'info');
        });

        setTimeout(function () {
            pm.decorateAllDetailLinkCells();
            document.querySelectorAll('#tableBody tr').forEach(function (tr) {
                pm.refreshDisableToggleLabel(tr);
            });
        }, 0);

        return pm;
    }

    window.MdmSubjectLf = {
        init: init,
        filterSubjectRows: filterSubjectRows,
        showLfWarmConfirm: showLfWarmConfirm
    };
})();
