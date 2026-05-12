/**
 * 资源中心档案 — 右侧滑出详情抽屉 + 多页签（对齐 vendor store-archive-ui / resource-archive-ui）
 */
(function () {
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function mkBtn(label, primary, outlinePrimary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        if (outlinePrimary) b.classList.add('erp-btn--outline-primary');
        b.textContent = label;
        return b;
    }

    function empty(host) {
        while (host && host.firstChild) host.removeChild(host.firstChild);
    }

    function nz(v) {
        if (v == null || v === '') return '—';
        return String(v);
    }

    function cellPlain(td) {
        if (!td) return '—';
        return td.textContent.replace(/\s+/g, ' ').trim() || '—';
    }

    function cellStatus(td) {
        if (!td) return '—';
        var s = td.querySelector('.status');
        return (s ? s.textContent : td.textContent).trim() || '—';
    }

    function removeArchiveDrawers() {
        document.querySelectorAll('[data-mdm-archive-drawer]').forEach(function (n) {
            n.remove();
        });
    }

    function sectionTitle(text) {
        return el('div', 'supplier-detail-section-title', text);
    }

    function detailCell(label, value) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        b.textContent = nz(value);
        c.appendChild(b);
        return c;
    }

    function detailCellWarehouse(label, value) {
        var block = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        block.appendChild(el('div', 'supplier-detail-cell__label', label));
        var body = el('div', 'supplier-detail-cell__body');
        var wh = nz(value);
        body.textContent = wh;
        if (wh !== '—' && wh.indexOf('创建门店时选择的履约仓库') >= 0) {
            body.classList.add('store-detail-warehouse-red');
        }
        block.appendChild(body);
        return block;
    }

    /** 资源档案状态类字段 → 标签样式（与 ERP 语义色一致） */
    function archiveStatusVariant(text) {
        var s = String(text || '');
        if (/正常|启用|已进件|营业|审核/.test(s)) return 'success';
        if (/冻结|停用/.test(s)) return 'danger';
        if (/进件中|未进件|筹备|停业/.test(s)) return 'warning';
        return 'neutral';
    }

    function detailCellTagged(label, raw, preferTag) {
        var c = el('div', 'supplier-detail-cell');
        c.appendChild(el('div', 'supplier-detail-cell__label', label));
        var b = el('div', 'supplier-detail-cell__body');
        if (preferTag) {
            var sp = el('span', 'mdm-detail-tag mdm-detail-tag--' + archiveStatusVariant(raw));
            sp.textContent = nz(raw);
            b.appendChild(sp);
        } else {
            b.textContent = nz(raw);
        }
        c.appendChild(b);
        return c;
    }

    function dataTable(headers, rows) {
        var wrap = el('div', 'erp-table-scroll');
        var table = el('table', 'erp-table');
        var thead = el('thead');
        var trh = el('tr');
        headers.forEach(function (h) {
            trh.appendChild(el('th', '', h));
        });
        thead.appendChild(trh);
        var tbody = el('tbody');
        rows.forEach(function (cells) {
            var tr = el('tr');
            cells.forEach(function (cell) {
                var td = el('td', '');
                if (cell && typeof cell === 'object' && cell.node && cell.node.nodeType) {
                    td.appendChild(cell.node);
                } else if (cell && typeof cell === 'object' && typeof cell.html === 'string') {
                    td.innerHTML = cell.html;
                } else {
                    td.textContent = cell;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function emptyNote(text) {
        return el('div', 'store-empty', text);
    }

    function summaryBar(spans) {
        var bar = el('div', 'store-summary-bar');
        spans.forEach(function (t) {
            bar.appendChild(el('span', '', t));
        });
        return bar;
    }

    function toolbarFilters(labels, withActions) {
        var bar = el('div', 'erp-toolbar');
        labels.forEach(function (lab) {
            var grp = el('div', 'modal-form-group');
            grp.style.marginBottom = '0';
            grp.appendChild(el('label', '', lab));
            var inp = el('input', 'erp-input');
            inp.type = 'text';
            inp.placeholder = '—';
            inp.style.minWidth = '160px';
            grp.appendChild(inp);
            bar.appendChild(grp);
        });
        if (withActions) {
            var ta = el('div', 'erp-toolbar__actions');
            ta.appendChild(mkBtn('重置', false));
            ta.appendChild(mkBtn('查询', true));
            bar.appendChild(ta);
        }
        return bar;
    }

    function fakePagination() {
        var bar = el('div', 'erp-pagination');
        bar.appendChild(el('span', 'erp-pagination__total', '演示分页'));
        return bar;
    }

    function formatTs(ts) {
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

    function onboardStatusText(st) {
        if (st === '待总监审核') return '待总监审核';
        if (st === '待财务审核') return '待财务审核';
        if (st === '待汇付审核') return '待汇付审核';
        if (st === '审核成功') return '审核成功';
        if (st === '审核失败') return '审核失败';
        if (st === 'rejected') return '审核失败';
        if (st === 'submitted') return '待BD审核';
        if (st === 'draft') return '未提交';
        return '未发起';
    }

    function onboardRecordKey(kind, id) {
        return 'archive::' + kind + '::' + String(id || '');
    }

    function getOnboardingSummary(recordKey, defaults) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.getSummary === 'function'
        ) {
            return window.MdmUnifiedOnboardingUi.getSummary(recordKey, defaults || {});
        }
        return { status: '', submittedAt: null, updatedAt: null, fields: defaults || {} };
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

    function auditStepText(node) {
        var n = String(node || '').trim();
        if (!n || n === '—') return '—';
        if (n === 'BD') return 'BD预审';
        if (n === 'BD总监') return 'BD总监审核';
        if (n === '财务') return '财务审核';
        if (n === '汇付') return '汇付审核';
        return n;
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

    function openOnboardingDetailModal(meta) {
        var m = meta || {};
        var summary = getOnboardingSummary(m.recordKey, m.defaults || {});
        var ui =
            window.MdmUnifiedOnboardingUi && typeof window.MdmUnifiedOnboardingUi.getRecord === 'function' ?
                window.MdmUnifiedOnboardingUi :
                null;
        var rec = ui ? ui.getRecord(m.recordKey) || {} : {};
        var ext = rec.ext || {};
        var f = summary.fields || {};
        var card = f.card_info || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        var auditStatus = summary.auditStatus || onboardStatusText(summary.status);
        var node = summary.nextAuditNode || rec.nextAuditNode || '';

        var backdrop = el('div', 'erp-modal-backdrop');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '进件详情'));
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', function () {
            backdrop.remove();
        });
        var acts = el('div', 'erp-modal__header-actions');
        acts.appendChild(closeBtn);
        header.appendChild(acts);

        var body = el('div', 'erp-modal__body');
        function makePhotoCell(label, src) {
            var c = el('div', 'supplier-detail-cell');
            c.appendChild(el('div', 'supplier-detail-cell__label', label));
            var b = el('div', 'supplier-detail-cell__body');
            var v = resolvePhotoSrc(src, label);
            if (!v) {
                b.textContent = '待上传';
            } else {
                var tile = el('div');
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
                    tile.appendChild(el('span', '', '已上传'));
                };
                tile.appendChild(img);
                b.appendChild(tile);
            }
            c.appendChild(b);
            return c;
        }
        function appendSection(title, rows) {
            body.appendChild(sectionTitle(title));
            var grid = el('div', 'supplier-detail-grid');
            rows.forEach(function (it) {
                if (it[2] === 'image') {
                    grid.appendChild(makePhotoCell(it[0], it[1]));
                } else {
                    grid.appendChild(detailCell(it[0], it[1]));
                }
            });
            body.appendChild(grid);
        }

        appendSection('页头信息', [
            ['商户名称', m.merchantName || ext.merchantName || '—'],
            ['汇付商户号', m.huifuMerchantNo || ext.huifuId || '—'],
            ['主体类型', m.subjectType || ext.subjectType || '—'],
            ['所属集团主体', m.groupName || ext.groupName || '—'],
            ['进件状态', flowStatusText(auditStatus, summary.status)],
            ['驳回原因', rec.rejectReason || ext.rejectReason || '—']
        ]);
        appendSection('进件流程信息', [
            ['审核环节', auditStepText(node)],
            ['进件渠道', rec.onboardingChannel || ext.onboardingChannel || '后台'],
            ['创建时间', formatTs(rec.createdAt || summary.submittedAt)],
            ['提交汇付时间', formatTs(summary.submittedAt)],
            ['汇付审核完成时间', formatTs(rec.completedAt || ext.completedAt)],
            ['MCC行业', rec.mccIndustry || ext.mccIndustry || '—'],
            ['请求流水号', rec.reqSeqId || ext.reqSeqId || '—'],
            ['外部商户号', rec.extMerId || ext.extMerId || '—'],
            ['创建人', rec.creator || ext.creator || '—'],
            ['备注', rec.remarks || ext.remarks || '—']
        ]);
        appendSection('主体关系信息', [
            ['上级汇付号', rec.headHuifuId || ext.headHuifuId || '—'],
            ['结算主体类型', m.settlementSubject || rec.settlementBodyType || ext.settlementBodyType || '—']
        ]);
        appendSection('执照信息', [
            ['营业执照', f.license_pic, 'image'],
            ['营业执照名称', lic.name || rec.regName || ext.regName || '—'],
            ['证件代码', lic.code || rec.licenseCode || ext.licenseCode || '—'],
            ['执照起始日期', lic.start_date || rec.licenseBeginDate || ext.licenseBeginDate || '—'],
            ['执照有效期', lic.valid_date || rec.licenseEndDate || ext.licenseEndDate || '—'],
            ['注册地址', lic.address || rec.regDetail || ext.regDetail || '—']
        ]);
        appendSection('法人基本信息', [
            ['身份证人像面', f.legal_cert_front_pic, 'image'],
            ['身份证国徽面', f.legal_cert_back_pic, 'image'],
            ['法人姓名', legal.legal_name || rec.legalName || ext.legalName || '—'],
            ['身份证号', legal.id_no || maskMiddle(rec.legalIdNo || ext.legalIdNo)],
            ['身份证起始日期', legal.id_start_date || rec.legalCertBeginDate || ext.legalCertBeginDate || '—'],
            ['身份证有效期', legal.id_valid_date || rec.legalCertEndDate || ext.legalCertEndDate || '—']
        ]);
        appendSection('商户信息', [
            ['商户简称', f.short_name || '—'],
            ['小票名称', f.receipt_name || '—'],
            ['实际经营地址', f.detail_addr || '—'],
            ['法人手机号', f.legal_mobile_no || '—'],
            ['管理员手机号', f.contact_mobile_no || m.contactMobile || '—'],
            ['管理员邮箱', f.contact_email || '—']
        ]);
        appendSection('结算信息', [
            ['开户许可证', f.open_license_pic || rec.openLicencePic || ext.openLicencePic || '', 'image'],
            ['开户名/结算户名', card.account_name || '—'],
            ['银行账号', maskBank(card.card_no)],
            ['开户银行', card.bank_name || '—'],
            ['开户支行', card.bank_branch || '—']
        ]);
        appendSection('门店场地', [
            ['经营场所名称', m.merchantName || rec.placeName || ext.placeName || '—'],
            ['门头/场地照', f.store_header_pic, 'image'],
            ['内景/工作区域照', f.store_indoor_pic, 'image'],
            ['收银台/前台照', f.store_cashier_desk_pic, 'image']
        ]);

        var footer = el('div', 'erp-modal__footer');
        var ok = mkBtn('关闭', true);
        ok.addEventListener('click', function () {
            backdrop.remove();
        });
        footer.appendChild(ok);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    function openOnboardResource(title, shortName, defaults, recordKey, extraOpts) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.openModal === 'function'
        ) {
            window.MdmUnifiedOnboardingUi.openModal({
                title: title,
                merchantShortNameDefault: shortName || '',
                fieldDefaults: defaults || {},
                recordKey: recordKey,
                variant: 'resource',
                forceView: !!(extraOpts && extraOpts.forceView)
            });
        } else if (typeof showToast === 'function') {
            showToast('进件模块未加载', 'error');
        }
    }

    function openOnboardStore(shortName, defaults, recordKey, extraOpts) {
        if (
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.openModal === 'function'
        ) {
            window.MdmUnifiedOnboardingUi.openModal({
                title: '门店进件',
                merchantShortNameDefault: shortName || '',
                fieldDefaults: defaults || {},
                recordKey: recordKey,
                variant: 'store',
                forceView: !!(extraOpts && extraOpts.forceView)
            });
        } else if (typeof showToast === 'function') {
            showToast('进件模块未加载', 'error');
        }
    }

    var ONBOARD_LIST_HEADERS = [
        '商户名称',
        '主体类型',
        '所属集团',
        '进件状态',
        '汇付商户号',
        '结算主体',
        '联系人手机号',
        '提交时间',
        '操作'
    ];

    function storeOnboardingDefaults(store) {
        return {
            short_name: nz(store.name) === '—' ? '' : store.name,
            receipt_name: nz(store.name) === '—' ? '' : store.name,
            detail_addr: nz(store.address) === '—' ? '' : store.address,
            legal_mobile_no: '',
            contact_mobile_no: nz(store.phone) === '—' ? '' : store.phone,
            contact_email: '',
            card_info: {
                account_name: '',
                card_no: '',
                bank_name: '',
                bank_branch: ''
            },
            license_info: {},
            legal_info: {},
            license_pic: '',
            legal_cert_front_pic: '',
            legal_cert_back_pic: '',
            open_license_pic: '',
            store_header_pic: '档案门头照',
            store_indoor_pic: '',
            store_cashier_desk_pic: ''
        };
    }

    function resourceOnboardingDefaults(name, detailAddr, phone) {
        return {
            short_name: nz(name) === '—' ? '' : name,
            receipt_name: nz(name) === '—' ? '' : name,
            detail_addr: nz(detailAddr) === '—' ? '' : detailAddr,
            legal_mobile_no: '',
            contact_mobile_no: nz(phone) === '—' ? '' : phone,
            contact_email: '',
            card_info: {
                account_name: '',
                card_no: '',
                bank_name: '',
                bank_branch: ''
            },
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

    function cardInfoText(card) {
        var c = card || {};
        var parts = [];
        if (c.account_name) parts.push(c.account_name);
        if (c.card_no) parts.push(c.card_no);
        if (c.bank_name) parts.push(c.bank_name);
        if (c.bank_branch) parts.push(c.bank_branch);
        return parts.length ? parts.join(' / ') : '待填写';
    }

    function uploadedText(v) {
        return v ? '已上传' : '待上传';
    }

    function cloneObj(v) {
        if (!v || typeof v !== 'object') return v;
        try {
            return JSON.parse(JSON.stringify(v));
        } catch (e) {
            return v;
        }
    }

    function firstMissingOnboardingField(fields) {
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
            { key: 'name', label: '营业执照名称', bucket: lic },
            { key: 'code', label: '证件代码', bucket: lic },
            { key: 'start_date', label: '执照起始日期', bucket: lic },
            { key: 'valid_date', label: '执照有效期', bucket: lic },
            { key: 'address', label: '注册地址', bucket: lic },
            { key: 'legal_cert_front_pic', label: '法人身份证人像面(F02)' },
            { key: 'legal_cert_back_pic', label: '法人身份证国徽面(F03)' },
            { key: 'legal_name', label: '法人姓名', bucket: legal },
            { key: 'id_no', label: '身份证号', bucket: legal },
            { key: 'id_start_date', label: '身份证起始日期', bucket: legal },
            { key: 'id_valid_date', label: '身份证有效期', bucket: legal },
            { key: 'open_license_pic', label: '开户许可证' },
            { key: 'store_header_pic', label: '门头/场地照(F22)' },
            { key: 'store_indoor_pic', label: '内景/工作区域照(F24)' },
            { key: 'store_cashier_desk_pic', label: '收银台/前台照(F105)' }
        ];
        var i;
        for (i = 0; i < checks.length; i++) {
            var check = checks[i];
            var val = check.bucket ? check.bucket[check.key] : f[check.key];
            if (!val || !String(val).trim()) return check.label;
        }
        var card = f.card_info || {};
        if (!card.account_name || !String(card.account_name).trim()) return '银行卡户名';
        if (!card.card_no || !String(card.card_no).trim()) return '银行卡号';
        if (!card.bank_name || !String(card.bank_name).trim()) return '开户行';
        if (!card.bank_branch || !String(card.bank_branch).trim()) return '开户支行';
        return '';
    }

    function submitOnboardingRecord(meta) {
        var ui = window.MdmUnifiedOnboardingUi;
        if (!ui || typeof ui.upsertRecord !== 'function' || typeof ui.getRecord !== 'function') {
            if (typeof showToast === 'function') showToast('进件模块未加载', 'error');
            return false;
        }
        var recordKey = meta.recordKey;
        var fallbackDefaults = cloneObj(meta.defaults || {});
        var summary = getOnboardingSummary(recordKey, fallbackDefaults);
        var fields = summary.fields || fallbackDefaults;
        var missing = firstMissingOnboardingField(fields);
        if (missing) {
            if (typeof showToast === 'function') showToast('请先完善：' + missing, 'error');
            return false;
        }
        var now = Date.now();
        var oldRec = ui.getRecord(recordKey) || {};
        var rec = {
            key: String(recordKey || ''),
            title: meta.title || oldRec.title || '',
            merchantShortName: meta.shortName || oldRec.merchantShortName || '',
            status: 'submitted',
            fields: cloneObj(fields),
            updatedAt: now,
            submittedAt: oldRec.submittedAt || now,
            auditChain: '门店 -> BD -> 财务 -> 汇付',
            nextAuditNode: 'BD'
        };
        ui.upsertRecord(recordKey, rec);
        if (typeof showToast === 'function') showToast('已提交上级审核', 'success');
        return true;
    }

    function makeOnboardActionCell(meta, refresh) {
        var m = meta || {};
        var wrap = el('div', 'action-links');
        var status = m.onboardStatus;
        var editable =
            status !== 'submitted' &&
            status !== '待BD审核' &&
            status !== '待总监审核' &&
            status !== '待财务审核' &&
            status !== '待汇付审核' &&
            status !== '审核成功';
        var submitLabel = status === '审核失败' || status === 'rejected' ? '重新提交' : '提交进件';
        function opBtn(label, onClick) {
            var btn = el('button', 'erp-link-like-btn', label);
            btn.type = 'button';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.color = '#1677ff';
            btn.style.cursor = 'pointer';
            btn.style.padding = '0';
            btn.style.marginRight = '10px';
            btn.style.fontSize = '12px';
            btn.addEventListener('click', function (ev) {
                ev.preventDefault();
                onClick();
            });
            return btn;
        }
        wrap.appendChild(
            opBtn('查看', function () {
                openOnboardingDetailModal(m);
            })
        );
        if (editable) {
            wrap.appendChild(
                opBtn('删除', function () {
                    if (
                        window.MdmUnifiedOnboardingUi &&
                        typeof window.MdmUnifiedOnboardingUi.removeRecord === 'function'
                    ) {
                        window.MdmUnifiedOnboardingUi.removeRecord(m.recordKey);
                        if (typeof showToast === 'function') showToast('已删除进件草稿', 'success');
                        refresh();
                    }
                })
            );
            wrap.appendChild(
                opBtn('编辑', function () {
                    m.openModal(false);
                })
            );
            wrap.appendChild(
                opBtn(submitLabel, function () {
                    if (status === '审核失败' || status === 'rejected') {
                        m.openModal(false);
                        return;
                    }
                    if (submitOnboardingRecord(m)) refresh();
                })
            );
        }
        return { node: wrap };
    }

    function buildOnboardListRow(meta, refresh) {
        var m = meta || {};
        return [
            nz(m.merchantName),
            nz(m.subjectType),
            nz(m.groupName),
            onboardStatusText(m.onboardStatus),
            nz(m.huifuMerchantNo),
            nz(m.settlementSubject),
            nz(m.contactMobile),
            nz(m.submitTime),
            makeOnboardActionCell(m, refresh)
        ];
    }

    function onboardingDetailCells(fields) {
        var f = fields || {};
        var card = f.card_info || {};
        var lic = f.license_info || {};
        var legal = f.legal_info || {};
        return [
            detailCell('商户简称', f.short_name || '—'),
            detailCell('小票名称', f.receipt_name || '—'),
            detailCell('实际经营地址', f.detail_addr || '—'),
            detailCell('法人手机号', f.legal_mobile_no || '—'),
            detailCell('管理员手机号', f.contact_mobile_no || '—'),
            detailCell('管理员邮箱', f.contact_email || '—'),
            detailCell('银行卡信息配置', cardInfoText(card)),
            detailCell('营业执照(F07)', f.license_pic ? '已上传' : '待上传'),
            detailCell('营业执照名称', lic.name || '—'),
            detailCell('证件代码', lic.code || '—'),
            detailCell('执照起始日期', lic.start_date || '—'),
            detailCell('执照有效期', lic.valid_date || '—'),
            detailCell('注册地址', lic.address || '—'),
            detailCell('法人身份证人像面(F02)', f.legal_cert_front_pic ? '已上传' : '待上传'),
            detailCell('法人身份证国徽面(F03)', f.legal_cert_back_pic ? '已上传' : '待上传'),
            detailCell('法人姓名', legal.legal_name || '—'),
            detailCell('身份证号', legal.id_no || '—'),
            detailCell('身份证起始日期', legal.id_start_date || '—'),
            detailCell('身份证有效期', legal.id_valid_date || '—'),
            detailCell('开户许可证', f.open_license_pic ? '已上传' : '待上传'),
            detailCell('门头/场地照(F22)', f.store_header_pic ? '已上传' : '待上传'),
            detailCell('内景/工作区域照(F24)', f.store_indoor_pic ? '已上传' : '待上传'),
            detailCell('收银台/前台照(F105)', f.store_cashier_desk_pic ? '已上传' : '待上传')
        ];
    }

    function rowToStore(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 20) return null;
        var name = cellPlain(c[2]);
        var partner = cellPlain(c[3]);
        var isFP = partner === '加盟店' || partner === '合作店';
        var isPeer = partner === '同行店';
        return {
            name: name,
            storeId: cellPlain(c[0]),
            orgId: cellPlain(c[1]),
            subjectName: cellPlain(c[1]),
            contact: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            shortName: '—',
            partnerDivision: partner,
            storeType: cellPlain(c[4]),
            bd: cellPlain(c[5]),
            fulfillWarehouse: cellPlain(c[8]),
            region: cellPlain(c[9]),
            address: cellPlain(c[10]),
            latlng: cellPlain(c[11]),
            withdrawPhone: cellPlain(c[12]),
            opStatus: cellPlain(c[13]),
            onboardStatus: cellPlain(c[14]),
            settleType: cellPlain(c[15]),
            settleCycle: cellPlain(c[16]),
            splitService: cellPlain(c[17]),
            storeStatus: cellStatus(c[18]),
            createTime: cellPlain(c[19]),
            onboardChannelGuess: cellPlain(c[15]) !== '—' ? '支付宝/微信（演示）' : '—',
            hasRefrigerator: false,
            hasFreezer: false,
            detailTags: [],
            isFranchiseOrPartner: isFP,
            isPeerStore: isPeer
        };
    }

    function storeHeroTags(store) {
        var tags = [];
        var st = store.storeStatus;
        if (st === '正常') tags.push({ kind: 'orange', label: '门店正常' });
        else if (st === '停用') tags.push({ kind: 'gray', label: '停用' });
        else if (st === '冻结') tags.push({ kind: 'gray', label: '冻结' });
        if (store.opStatus && store.opStatus !== '—') {
            tags.push({ kind: 'gray', label: store.opStatus });
        }
        return tags;
    }

    function panelStoreBase(store) {
        var p = el('div', 'supplier-detail-tab');
        var recordKey = onboardRecordKey('store', store.storeId);
        var onboardingDefaults = storeOnboardingDefaults(store);
        p.appendChild(sectionTitle('基础信息'));

        var grid = el('div', 'supplier-detail-grid');
        var regionDisp = store.region ? store.region.replace(/\//g, ' / ') : '—';

        grid.appendChild(detailCell('门店ID', store.storeId));
        grid.appendChild(detailCell('主体名称', store.subjectName));
        grid.appendChild(detailCell('联系人', store.contact));
        grid.appendChild(detailCell('手机号码', store.phone));

        grid.appendChild(detailCell('门店名称', store.name));
        grid.appendChild(detailCell('门店简称', store.shortName));
        grid.appendChild(detailCell('门店合作类型', store.partnerDivision));
        grid.appendChild(detailCell('门店类型', store.storeType));

        grid.appendChild(detailCell('绑定BD', store.bd));
        grid.appendChild(detailCell('配送仓库', store.fulfillWarehouse));
        grid.appendChild(detailCell('省市区', regionDisp));
        grid.appendChild(detailCell('详细地址', store.address));

        grid.appendChild(detailCell('经纬度', store.latlng));
        grid.appendChild(detailCell('运营状态', store.opStatus));
        grid.appendChild(detailCell('进件状态', store.onboardStatus));
        grid.appendChild(detailCell('结算类型', store.settleType));

        grid.appendChild(detailCell('结算周期', store.settleCycle));
        grid.appendChild(detailCell('分账服务', store.splitService));
        grid.appendChild(detailCellTagged('门店状态', store.storeStatus, true));
        grid.appendChild(detailCell('可提现手机号', store.withdrawPhone));

        var thumbRow = el('div', 'supplier-detail-cell');
        thumbRow.appendChild(el('div', 'supplier-detail-cell__label', '门店门头照'));
        var tw = el('div', 'store-detail-thumb-row');
        tw.appendChild(el('div', 'store-detail-thumb store-detail-thumb--lg'));
        thumbRow.appendChild(tw);
        grid.appendChild(thumbRow);

        grid.appendChild(detailCellWarehouse('门店仓库', store.fulfillWarehouse));

        var fr = el('div', 'supplier-detail-cell');
        fr.appendChild(el('div', 'supplier-detail-cell__label', '冷藏柜 / 冷冻柜'));
        var frRow = el('div', 'store-detail-fridge-row');
        frRow.appendChild(el('span', 'store-detail-yesno', '无'));
        fr.appendChild(frRow);
        grid.appendChild(fr);

        if (store.isFranchiseOrPartner) {
            grid.appendChild(detailCell('门店面积（㎡）', '—'));
            grid.appendChild(detailCell('门店楼层', '—'));
            grid.appendChild(detailCell('店门口口述视频', '—'));
            grid.appendChild(detailCell('店内口述视频', '—'));
            grid.appendChild(detailCell('门店方圆500米入住户数', '—'));
            grid.appendChild(detailCell('日均客单量', '—'));
            grid.appendChild(detailCell('店内工作人员总数', '—'));
            grid.appendChild(detailCell('实际经营者对直播业务的理解', '—'));
            grid.appendChild(detailCell('门店日常运营服务理解与配合', '—'));
            grid.appendChild(detailCell('私域直播投入产出期望', '—'));
            grid.appendChild(detailCell('私域直播/社区团购熟悉程度', '—'));
            grid.appendChild(detailCell('周边小区及居住人群描述', '—'));
            grid.appendChild(detailCell('拉到1000人信心说明', '—'));
            grid.appendChild(detailCell('特殊情况说明', '—'));
            grid.appendChild(detailCell('特殊情况配图', '—'));
        }
        if (store.isPeerStore) {
            grid.appendChild(detailCell('已合作其他平台情况', '—'));
            grid.appendChild(detailCell('近三天上播及销量截图', '—'));
        }

        grid.appendChild(detailCell('创建时间', store.createTime));
        p.appendChild(grid);

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('商户进件'));
        var onboardBlock = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardStore(store.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        onboardBlock.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: store.name,
                                subjectType: '门店',
                                groupName: store.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(store.storeId || '').replace(/\s+/g, ''),
                                settlementSubject: store.settleType,
                                contactMobile: store.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '门店进件',
                                shortName: store.name,
                                openModal: function (forceView) {
                                    openOnboardStore(store.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        onboardBlock.appendChild(tableWrap);
        onboardBlock.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        p.appendChild(onboardBlock);
        return p;
    }

    function panelStoreCustomers() {
        var root = el('div', 'supplier-detail-tab');
        root.appendChild(
            toolbarFilters(['用户ID', '手机号码'], true)
        );
        root.appendChild(
            dataTable(
                [
                    '用户ID',
                    '用户昵称',
                    '用户头像',
                    '手机号码',
                    '下单次数',
                    '累计下单金额',
                    '观看时长',
                    '用户等级',
                    '用户当前积分'
                ],
                []
            )
        );
        root.appendChild(emptyNote('暂无数据'));
        root.appendChild(fakePagination());
        return root;
    }

    function panelCommProdPerf(kind) {
        var root = el('div', 'supplier-detail-tab');
        if (kind === 'comm') {
            root.appendChild(summaryBar(['累计分佣：¥—', '订单数：—', '商品销售数：—']));
            root.appendChild(toolbarFilters(['商品名称', '订单ID'], true));
            var dr = el('div', 'erp-toolbar');
            dr.appendChild(el('label', '', '下单时间'));
            var inp = el('input', 'erp-input');
            inp.placeholder = '开始日期 — 结束日期';
            dr.appendChild(inp);
            root.appendChild(dr);
            root.appendChild(
                dataTable(
                    [
                        '订单ID',
                        '下单时间',
                        '商品信息',
                        '实付金额',
                        '买家信息',
                        '佣金',
                        '交易状态',
                        '分佣比例'
                    ],
                    []
                )
            );
        } else if (kind === 'prod') {
            root.appendChild(
                summaryBar([
                    '商品成交金额：¥—',
                    '商品退款金额：¥—',
                    '商品数量：—',
                    '未核销：—',
                    '已核销：—',
                    '已过期：—',
                    '已退款：—',
                    '退款中：—'
                ])
            );
            root.appendChild(toolbarFilters(['商品名称', '商品类目'], true));
            root.appendChild(
                dataTable(
                    [
                        '商品ID',
                        '商品信息',
                        '商品类目',
                        '成交金额',
                        '退款金额',
                        '商品数量',
                        '未核销',
                        '已核销',
                        '已过期',
                        '已退款'
                    ],
                    []
                )
            );
        } else {
            root.appendChild(
                summaryBar([
                    '总成交订单数：—',
                    '总成交金额：¥—',
                    '总退款订单数：—',
                    '总退款金额：¥—'
                ])
            );
            root.appendChild(toolbarFilters(['选择日期'], true));
            root.appendChild(
                dataTable(['日期', '成交订单数', '成交金额', '退款订单数', '退款金额'], [])
            );
        }
        root.appendChild(emptyNote('暂无数据'));
        return root;
    }

    function attachDrawer(opts) {
        removeArchiveDrawers();
        var backdrop = el('div', 'store-drawer-backdrop');
        backdrop.setAttribute('data-mdm-archive-drawer', '1');
        var drawer = el('aside', 'store-drawer store-drawer--interactive');
        drawer.setAttribute('data-mdm-archive-drawer', '1');
        if (opts.wideClass) drawer.classList.add(opts.wideClass);

        var header = el('div', 'store-drawer__header');
        header.appendChild(el('h2', 'store-drawer__title', opts.title));
        var btnClose = el('button', 'store-drawer__close');
        btnClose.type = 'button';
        btnClose.setAttribute('aria-label', '关闭');
        btnClose.innerHTML = '&times;';
        function shut() {
            document.removeEventListener('keydown', onDocKey);
            backdrop.remove();
            drawer.remove();
        }
        function onDocKey(ev) {
            if (ev.key === 'Escape') shut();
        }
        document.addEventListener('keydown', onDocKey);
        btnClose.addEventListener('click', shut);
        header.appendChild(btnClose);

        var hero = el('div', 'store-drawer__hero store-drawer__hero--elevated');
        var nameRow = el('div', 'store-drawer__name-row');
        nameRow.appendChild(el('span', 'store-drawer__name', opts.heroName));
        (opts.heroTags || []).forEach(function (t) {
            nameRow.appendChild(
                el('span', 'store-drawer__tag store-drawer__tag--' + t.kind, t.label)
            );
        });
        hero.appendChild(nameRow);
        (opts.metaLines || []).forEach(function (line) {
            hero.appendChild(el('div', 'store-drawer__meta', line));
        });

        var tabsWrap = el('div', 'store-drawer__tabs store-drawer__tabs--sticky');
        var bodyHost = el('div', 'store-drawer__body');

        var tabIds = opts.tabIds;
        var tabLabels = opts.tabLabels;
        var bodies = opts.bodies;
        var tabs = [];

        function showTab(id) {
            tabIds.forEach(function (tid, i) {
                tabs[i].classList.toggle('is-active', tid === id);
            });
            empty(bodyHost);
            bodyHost.appendChild(bodies[id]);
            bodyHost.scrollTop = 0;
        }

        tabIds.forEach(function (id, i) {
            var t = el('button', 'store-drawer__tab', tabLabels[i]);
            t.type = 'button';
            (function (tid) {
                t.addEventListener('click', function () {
                    showTab(tid);
                });
            })(id);
            tabsWrap.appendChild(t);
            tabs.push(t);
        });

        drawer.appendChild(header);
        drawer.appendChild(hero);
        drawer.appendChild(tabsWrap);
        drawer.appendChild(bodyHost);

        if (opts.withFooter !== false) {
            var footer = el('div', 'store-drawer__footer');
            var back = mkBtn('返回', false, true);
            var ok = mkBtn('确定', true);
            back.addEventListener('click', shut);
            ok.addEventListener('click', shut);
            footer.appendChild(back);
            footer.appendChild(ok);
            drawer.appendChild(footer);
        }

        showTab(tabIds[0]);

        backdrop.addEventListener('click', shut);
        drawer.addEventListener('click', function (e) {
            e.stopPropagation();
        });
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);
    }

    function openStore(tr) {
        var store = rowToStore(tr);
        if (!store) {
            if (typeof showToast === 'function') showToast('无法读取门店行数据', 'error');
            return;
        }
        store.detailTags = storeHeroTags(store);
        attachDrawer({
            title: '门店详情',
            heroName: store.name,
            heroTags: store.detailTags,
            metaLines: ['门店ID：' + store.storeId + ' · 所属组织：' + store.orgId],
            wideClass: 'store-drawer--store-wide',
            tabIds: ['base', 'cust', 'comm', 'prod', 'perf'],
            tabLabels: ['基础信息', '绑定客户', '分佣明细', '商品统计', '业绩报表'],
            bodies: {
                base: panelStoreBase(store),
                cust: panelStoreCustomers(),
                comm: panelCommProdPerf('comm'),
                prod: panelCommProdPerf('prod'),
                perf: panelCommProdPerf('perf')
            }
        });
    }

    function rowToSupplier(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 15) return null;
        return {
            id: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            region: cellPlain(c[3]),
            detailAddress: cellPlain(c[4]),
            typeLabel: cellPlain(c[5]),
            contactName: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            createTime: cellPlain(c[8]),
            productCount: cellPlain(c[9]),
            settleInfo: cellPlain(c[10]),
            withdrawPhone: cellPlain(c[11]),
            channel: cellPlain(c[12]),
            onboard: cellPlain(c[13]),
            status: cellStatus(c[14])
        };
    }

    function panelResourceBaseSupplier(r) {
        var recordKey = onboardRecordKey('supplier', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.detailAddress, r.phone);
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('供应商ID', r.id));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('供应商名称', r.name));
        grid.appendChild(detailCell('供应商类型', r.typeLabel));
        grid.appendChild(detailCell('供应商地址', r.region));
        var addr = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        addr.appendChild(el('div', 'supplier-detail-cell__label', '详细地址'));
        var addrBody = el('div', 'supplier-detail-cell__body supplier-detail-cell__body--multiline');
        addrBody.textContent = nz(r.detailAddress);
        addr.appendChild(addrBody);
        grid.appendChild(addr);
        grid.appendChild(detailCell('负责人姓名', r.contactName));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCell('供应商品数量', r.productCount));
        grid.appendChild(detailCell('结算信息', r.settleInfo));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        grid.appendChild(detailCell('进件渠道', r.channel));
        grid.appendChild(detailCell('进件状态', r.onboard));
        grid.appendChild(detailCellTagged('供应商状态', r.status, true));
        p.appendChild(grid);

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('供应商进件'));
        var onboard = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource('供应商进件', r.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        onboard.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: r.name,
                                subjectType: '供应商',
                                groupName: r.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(r.id || '').replace(/\s+/g, ''),
                                settlementSubject: r.settleInfo,
                                contactMobile: r.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '供应商进件',
                                shortName: r.name,
                                openModal: function (forceView) {
                                    openOnboardResource('供应商进件', r.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        onboard.appendChild(tableWrap);
        onboard.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        p.appendChild(onboard);
        return p;
    }

    function panelResourceCommLike(tabKind) {
        return panelCommProdPerf(tabKind === 'comm' ? 'comm' : tabKind === 'prod' ? 'prod' : 'perf');
    }

    function openSupplier(tr) {
        var r = rowToSupplier(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取供应商行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '正常') tags.push({ kind: 'orange', label: '正常' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '供应商详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: ['供应商ID：' + r.id + ' · 所属组织：' + r.subjectName],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'comm', 'prod', 'perf'],
            tabLabels: ['基础信息', '分佣明细', '商品统计', '业绩报表'],
            bodies: {
                base: panelResourceBaseSupplier(r),
                comm: panelResourceCommLike('comm'),
                prod: panelResourceCommLike('prod'),
                perf: panelResourceCommLike('perf')
            }
        });
    }

    function rowToLiveRoom(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 12) return null;
        return {
            id: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            typeLabel: cellPlain(c[3]),
            anchorId: cellPlain(c[4]),
            anchorName: cellPlain(c[5]),
            contactName: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            viewPermissionLabel: cellPlain(c[8]),
            createTime: cellPlain(c[9]),
            withdrawPhone: cellPlain(c[10]),
            status: cellStatus(c[11])
        };
    }

    function panelLiveBase(r) {
        var recordKey = onboardRecordKey('liveRoom', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.name, r.phone);
        var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('直播间ID', r.id));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('直播间名称', r.name));
        grid.appendChild(detailCell('直播类型', r.typeLabel));
        grid.appendChild(detailCell('主播ID', r.anchorId));
        grid.appendChild(detailCell('主播名称', r.anchorName));
        grid.appendChild(detailCell('负责人', r.contactName));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('观看权限', r.viewPermissionLabel));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        grid.appendChild(detailCellTagged('状态', r.status, true));
        p.appendChild(grid);

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
            onboardingGrid.appendChild(cell);
        });
        p.appendChild(onboardingGrid);
        return p;
    }

    function panelLiveSessions() {
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle('直播场次（业务系统）'));
        d.appendChild(
            el(
                'p',
                'erp-page__note mdm-detail-note',
                '业务系统在本直播间下创建场次；列表需业务侧同步后展示（原型示意）。'
            )
        );
        d.appendChild(dataTable(['场次编号', '计划开播', '计划结束', '渠道', '状态'], []));
        d.appendChild(emptyNote('暂无同步数据'));
        return d;
    }

    function panelLiveSessionProducts() {
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle('场次商品（业务系统）'));
        d.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '商品挂在场次下，随场次关联展示（原型示意）。')
        );
        d.appendChild(dataTable(['场次编号', '商品ID', '商品名称', '挂场状态'], []));
        d.appendChild(emptyNote('暂无同步数据'));
        return d;
    }

    function panelLiveOnboard(r) {
        var recordKey = onboardRecordKey('liveRoom', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.name, r.phone);
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle('直播间进件'));
        var wrap = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource('直播间进件', r.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        wrap.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: r.name,
                                subjectType: '直播间',
                                groupName: r.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(r.id || '').replace(/\s+/g, ''),
                                settlementSubject: '—',
                                contactMobile: r.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '直播间进件',
                                shortName: r.name,
                                openModal: function (forceView) {
                                    openOnboardResource('直播间进件', r.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            renderOnboardingTable
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        wrap.appendChild(tableWrap);
        wrap.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        d.appendChild(wrap);
        d.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件与结算信息走统一进件流程（原型示意）。')
        );
        return d;
    }

    function openLiveRoom(tr) {
        var r = rowToLiveRoom(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取直播间行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '启用') tags.push({ kind: 'orange', label: '启用' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '直播间详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: [
                '直播间ID：' + r.id + ' · 所属组织：' + r.subjectName,
                '主播：' + r.anchorName + '（' + r.anchorId + '）'
            ],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'comm', 'prod', 'perf'],
            tabLabels: ['基础信息', '直播场次（业务）', '场次商品（业务）', '进件与数据'],
            bodies: {
                base: panelLiveBase(r),
                comm: panelLiveSessions(),
                prod: panelLiveSessionProducts(),
                perf: panelLiveOnboard(r)
            }
        });
    }

    function rowToCarrier(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 15) return null;
        return {
            id: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            region: cellPlain(c[3]),
            detailAddress: cellPlain(c[4]),
            typeLabel: cellPlain(c[5]),
            contactName: cellPlain(c[6]),
            phone: cellPlain(c[7]),
            createTime: cellPlain(c[8]),
            serviceArea: cellPlain(c[9]),
            settleInfo: cellPlain(c[10]),
            withdrawPhone: cellPlain(c[11]),
            channel: cellPlain(c[12]),
            onboard: cellPlain(c[13]),
            status: cellStatus(c[14])
        };
    }

    function panelCarrierBase(r) {
        var recordKey = onboardRecordKey('carrier', r.id);
        var onboardingDefaults = resourceOnboardingDefaults(r.name, r.detailAddress, r.phone);
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('承运商ID', r.id));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('承运商名称', r.name));
        grid.appendChild(detailCell('承运类型', r.typeLabel));
        grid.appendChild(detailCell('承运商地址', r.region));
        var addr = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        addr.appendChild(el('div', 'supplier-detail-cell__label', '详细地址'));
        var addrBody = el('div', 'supplier-detail-cell__body supplier-detail-cell__body--multiline');
        addrBody.textContent = nz(r.detailAddress);
        addr.appendChild(addrBody);
        grid.appendChild(addr);
        grid.appendChild(detailCell('负责人姓名', r.contactName));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCell('服务区域', r.serviceArea));
        grid.appendChild(detailCell('结算信息', r.settleInfo));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        grid.appendChild(detailCell('进件渠道', r.channel));
        grid.appendChild(detailCell('进件状态', r.onboard));
        grid.appendChild(detailCellTagged('承运商状态', r.status, true));
        p.appendChild(grid);

        p.appendChild(sectionTitle('进件信息'));
        var onboardingGrid = el('div', 'supplier-detail-grid');
        function renderOnboardingInfo() {
            onboardingGrid.innerHTML = '';
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            onboardingDetailCells(onboardingSummary.fields).forEach(function (cell) {
                onboardingGrid.appendChild(cell);
            });
        }
        renderOnboardingInfo();
        p.appendChild(onboardingGrid);

        p.appendChild(sectionTitle('承运商进件'));
        var onboard = el('div', 'store-onboard-section store-onboard-section--white');
        var bar = el('div', 'erp-actions-row supplier-detail-onboard-actions');
        var go = mkBtn('去进件', true);
        go.addEventListener('click', function () {
            openOnboardResource('承运商进件', r.name, onboardingDefaults, recordKey);
        });
        bar.appendChild(go);
        onboard.appendChild(bar);
        var tableWrap = el('div');
        function renderOnboardingTable() {
            var onboardingSummary = getOnboardingSummary(recordKey, onboardingDefaults);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(
                dataTable(
                    ONBOARD_LIST_HEADERS,
                    [
                        buildOnboardListRow(
                            {
                                merchantName: r.name,
                                subjectType: '承运商',
                                groupName: r.subjectName,
                                onboardStatus: onboardingSummary.auditStatus || onboardingSummary.status,
                                huifuMerchantNo: 'HF-' + String(r.id || '').replace(/\s+/g, ''),
                                settlementSubject: r.settleInfo,
                                contactMobile: r.phone,
                                submitTime: formatTs(onboardingSummary.submittedAt),
                                recordKey: recordKey,
                                defaults: onboardingDefaults,
                                title: '承运商进件',
                                shortName: r.name,
                                openModal: function (forceView) {
                                    openOnboardResource('承运商进件', r.name, onboardingDefaults, recordKey, {
                                        forceView: !!forceView
                                    });
                                }
                            },
                            function () {
                                renderOnboardingInfo();
                                renderOnboardingTable();
                            }
                        )
                    ]
                )
            );
        }
        renderOnboardingTable();
        onboard.appendChild(tableWrap);
        onboard.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '进件审核流程：门店 → BD → 财务 → 汇付（审核操作在审核中心，MDM仅发起与保存）。')
        );
        p.appendChild(onboard);
        return p;
    }

    function openCarrier(tr) {
        var r = rowToCarrier(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取承运商行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '正常') tags.push({ kind: 'orange', label: '正常' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '承运商详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: ['承运商ID：' + r.id + ' · 所属组织：' + r.subjectName],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'comm', 'prod', 'perf'],
            tabLabels: ['基础信息', '运单明细', '运力统计', '履约报表'],
            bodies: {
                base: panelCarrierBase(r),
                comm: panelResourceCommLike('comm'),
                prod: panelResourceCommLike('prod'),
                perf: panelResourceCommLike('perf')
            }
        });
    }

    function rowToWarehouse(tr) {
        var c = tr.querySelectorAll('td');
        if (c.length < 12) return null;
        return {
            code: cellPlain(c[0]),
            subjectName: cellPlain(c[1]),
            name: cellPlain(c[2]),
            typeLabel: cellPlain(c[3]),
            relatedStore: cellPlain(c[4]),
            admin: cellPlain(c[5]),
            phone: cellPlain(c[6]),
            withdrawPhone: cellPlain(c[7]),
            location: cellPlain(c[8]),
            area: cellPlain(c[9]),
            createTime: cellPlain(c[10]),
            status: cellStatus(c[11])
        };
    }

    function panelWarehouseBase(r) {
        var p = el('div', 'supplier-detail-tab');
        p.appendChild(sectionTitle('基础信息'));
        var grid = el('div', 'supplier-detail-grid');
        grid.appendChild(detailCell('仓库编号', r.code));
        grid.appendChild(detailCell('主体名称', r.subjectName));
        grid.appendChild(detailCell('仓库名称', r.name));
        grid.appendChild(detailCell('仓库类型', r.typeLabel));
        grid.appendChild(detailCell('关联门店', r.relatedStore));
        grid.appendChild(detailCell('仓库管理员', r.admin));
        grid.appendChild(detailCell('手机号码', r.phone));
        grid.appendChild(detailCell('可提现手机号', r.withdrawPhone));
        var loc = el('div', 'supplier-detail-cell supplier-detail-cell--span4');
        loc.appendChild(el('div', 'supplier-detail-cell__label', '仓库位置'));
        var locBody = el('div', 'supplier-detail-cell__body supplier-detail-cell__body--multiline');
        locBody.textContent = nz(r.location);
        loc.appendChild(locBody);
        grid.appendChild(loc);
        grid.appendChild(detailCell('仓库面积', r.area));
        grid.appendChild(detailCell('创建时间', r.createTime));
        grid.appendChild(detailCellTagged('状态', r.status, true));
        p.appendChild(grid);
        return p;
    }

    function panelWarehouseExtra(title, tableHeaders) {
        var d = el('div', 'supplier-detail-tab');
        d.appendChild(sectionTitle(title));
        d.appendChild(
            el('p', 'erp-page__note mdm-detail-note', '仓库主数据由 MDM 维护；此页签为业务侧数据占位（原型）。')
        );
        d.appendChild(dataTable(tableHeaders, []));
        d.appendChild(emptyNote('暂无数据'));
        return d;
    }

    function openWarehouse(tr) {
        var r = rowToWarehouse(tr);
        if (!r) {
            if (typeof showToast === 'function') showToast('无法读取仓库行数据', 'error');
            return;
        }
        var tags = [];
        if (r.status === '启用') tags.push({ kind: 'orange', label: '启用' });
        else tags.push({ kind: 'gray', label: r.status });
        attachDrawer({
            title: '仓库详情',
            heroName: r.name,
            heroTags: tags,
            metaLines: ['仓库编号：' + r.code + ' · 所属组织：' + r.subjectName],
            wideClass: 'store-drawer--supplier-wide',
            tabIds: ['base', 'stock', 'inout', 'ops'],
            tabLabels: ['基础信息', '库存概览', '出入库明细', '作业与统计'],
            bodies: {
                base: panelWarehouseBase(r),
                stock: panelWarehouseExtra('库存概览', ['SKU', '商品名称', '可用数量', '锁定数量', '库位']),
                inout: panelWarehouseExtra('出入库明细', ['单号', '类型', '时间', '操作人', '状态']),
                ops: panelWarehouseExtra('作业统计', ['日期', '入库单量', '出库单量', '盘点次数'])
            }
        });
    }

    window.MdmArchiveDetailDrawer = {
        openStore: openStore,
        openSupplier: openSupplier,
        openLiveRoom: openLiveRoom,
        openCarrier: openCarrier,
        openWarehouse: openWarehouse,
        openOnboardingDetail: openOnboardingDetailModal
    };
})();
