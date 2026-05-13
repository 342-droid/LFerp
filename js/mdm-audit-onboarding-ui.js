/**
 * 审核中心 - 进件审核板块
 */
(function () {
    var KEY = 'mdm_unified_onboarding_records_v1';
    var PAGE_SIZE = 10;
    var filtersBound = false;
    var tableEventsBound = false;

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function readRecords() {
        try {
            var raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeRecords(map) {
        try {
            localStorage.setItem(KEY, JSON.stringify(map || {}));
        } catch (e) {}
    }

    function copy(obj) {
        try {
            return JSON.parse(JSON.stringify(obj || {}));
        } catch (e) {
            return obj || {};
        }
    }

    function demoImg(label) {
        var text = String(label || '进件资料');
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">' +
            '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#e0f2fe"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>' +
            '<rect width="360" height="220" rx="16" fill="url(#g)"/>' +
            '<rect x="22" y="22" width="316" height="132" rx="10" fill="#bae6fd"/>' +
            '<text x="180" y="192" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="#0369a1">' +
            text +
            '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function resolvePhotoSrc(v, label) {
        if (typeof v === 'string') {
            var s = v.trim();
            if (s) return s;
        }
        if (v === true) return demoImg(label || '进件资料');
        return '';
    }

    function ensureDemoRecords() {
        var all = readRecords();
        var now = Date.now();
        var day = 24 * 60 * 60 * 1000;
        var baseFields = {
            short_name: '悦享轻食',
            receipt_name: '悦享轻食',
            detail_addr: '杭州市西湖区文三路 88 号',
            legal_mobile_no: '13800138000',
            contact_mobile_no: '13900139000',
            contact_email: 'demo@lf.com',
            card_info: {
                account_name: '杭州悦享轻食餐饮管理有限公司',
                card_no: '6222020212345678901',
                bank_name: '招商银行',
                bank_branch: '杭州城西支行'
            },
            license_pic: demoImg('营业执照 F07'),
            legal_cert_front_pic: demoImg('身份证人像面 F02'),
            legal_cert_back_pic: demoImg('身份证国徽面 F03'),
            store_header_pic: demoImg('门头照 F22'),
            store_indoor_pic: demoImg('内景照 F24'),
            store_cashier_desk_pic: demoImg('收银台照 F105')
        };
        var rows = [
            {
                key: 'audit-demo::store::MCH-AUD-001',
                merchantShortName: '悦享轻食-城西银泰店',
                status: 'submitted',
                auditStatus: '待BD审核',
                nextAuditNode: 'BD审核',
                subjectName: '杭州悦享轻食集团',
                settlementBodyType: '集团结算',
                createdBy: '门店负责人',
                channel: '门店 APP',
                submittedAt: now - day * 2,
                updatedAt: now - day * 2 + 3600 * 1000,
                remarks: '门店侧发起，待BD审核'
            },
            {
                key: 'audit-demo::supplier::MCH-AUD-002',
                merchantShortName: '鲜选供应链-滨江',
                status: 'submitted',
                auditStatus: '待总监审核',
                nextAuditNode: 'BD总监审核',
                subjectName: '鲜选供应链集团',
                settlementBodyType: '独立结算',
                createdBy: 'BD 王磊',
                channel: 'BD APP',
                submittedAt: now - day * 3,
                updatedAt: now - day * 2,
                remarks: 'BD预审通过，待总监审核'
            },
            {
                key: 'audit-demo::warehouse::MCH-AUD-003',
                merchantShortName: '云仓华东一号',
                status: 'submitted',
                auditStatus: '待财务审核',
                nextAuditNode: '财务审核',
                subjectName: '云仓物流',
                settlementBodyType: '独立结算',
                createdBy: 'BD 李静',
                channel: '后台',
                submittedAt: now - day * 4,
                updatedAt: now - day * 2,
                remarks: '总监审核通过，财务复核中'
            },
            {
                key: 'audit-demo::carrier::MCH-AUD-004',
                merchantShortName: '极速承运-杭州',
                status: 'submitted',
                auditStatus: '待汇付审核',
                nextAuditNode: '汇付审核',
                subjectName: '极速物流集团',
                settlementBodyType: '集团结算',
                createdBy: '财务 赵敏',
                channel: '后台',
                submittedAt: now - day * 6,
                updatedAt: now - day,
                remarks: '财务审核通过，待汇付终审'
            },
            {
                key: 'audit-demo::liveRoom::MCH-AUD-005',
                merchantShortName: '潮味直播间',
                status: 'approved',
                auditStatus: '审核成功',
                nextAuditNode: '审核完成',
                subjectName: '潮味传媒',
                settlementBodyType: '独立结算',
                createdBy: 'BD 陈晨',
                channel: 'BD APP',
                submittedAt: now - day * 8,
                updatedAt: now - day * 7,
                onboardingCompletedAt: now - day * 7,
                remarks: '全链路审核通过'
            },
            {
                key: 'audit-demo::store::MCH-AUD-006',
                merchantShortName: '轻食便当-文二路店',
                status: 'rejected',
                auditStatus: '审核失败',
                nextAuditNode: '审核驳回',
                subjectName: '轻食便当集团',
                settlementBodyType: '集团结算',
                createdBy: '门店负责人',
                channel: '门店 APP',
                submittedAt: now - day * 5,
                updatedAt: now - day * 4,
                rejectReason: '证照信息不完整，请补齐后重提',
                remarks: 'BD环节驳回'
            }
        ];
        var changed = false;
        rows.forEach(function (r) {
            if (all[r.key]) return;
            all[r.key] = {
                key: r.key,
                title: '进件演示',
                merchantShortName: r.merchantShortName,
                status: r.status,
                auditStatus: r.auditStatus,
                nextAuditNode: r.nextAuditNode,
                fields: copy(baseFields),
                updatedAt: r.updatedAt,
                submittedAt: r.submittedAt,
                auditChain: '门店 -> BD -> 财务 -> 汇付',
                subjectName: r.subjectName,
                settlementBodyType: r.settlementBodyType,
                createdBy: r.createdBy,
                channel: r.channel,
                onboardingCompletedAt: r.onboardingCompletedAt || '',
                rejectReason: r.rejectReason || '',
                remarks: r.remarks,
                mccIndustry: '快餐服务',
                reqSeqId: 'REQ-' + r.key.split('::').pop(),
                extMerId: 'EXT-' + r.key.split('::').pop(),
                merchantNo: 'HF-' + r.key.split('::').pop(),
                headHuifuId: 'HUIFU-HEAD-001',
                legalName: '张三',
                legalCertType: '身份证',
                idMasked: '3301**********1234',
                legalCertBeginDate: '2020-01-01',
                legalCertEndDate: '2030-01-01',
                regName: r.merchantShortName + '有限公司',
                licenseCode: '9133' + r.key.split('::').pop(),
                entType: '有限责任公司',
                foundDate: '2023-06-01',
                licenseBeginDate: '2023-06-01',
                licenseEndDate: '2033-06-01',
                regDetail: '杭州市西湖区文三路 88 号'
            };
            changed = true;
        });
        if (changed) writeRecords(all);
    }

    function kindLabel(kind) {
        var map = {
            store: '门店',
            supplier: '供应商',
            warehouse: '仓库',
            liveRoom: '直播间',
            carrier: '承运商'
        };
        return map[kind] || kind || '未知';
    }

    function toTimeText(v) {
        if (!v) return '—';
        var d = new Date(v);
        if (isNaN(d.getTime())) return String(v);
        var p = function (n) {
            return String(n).padStart(2, '0');
        };
        return (
            d.getFullYear() +
            '-' +
            p(d.getMonth() + 1) +
            '-' +
            p(d.getDate()) +
            ' ' +
            p(d.getHours()) +
            ':' +
            p(d.getMinutes())
        );
    }

    function statusClass(text) {
        return text === '审核成功' ? 'active' : 'inactive';
    }

    function displayAuditStatus(status) {
        if (status === '审核成功' || status === '审核失败') return status;
        if (status) return '审核中';
        return '—';
    }

    function currentNode(status) {
        if (status === '待BD审核') return 'BD审核';
        if (status === '待总监审核') return 'BD总监审核';
        if (status === '待财务审核') return '财务审核';
        if (status === '待汇付审核') return '汇付审核';
        if (status === '审核成功') return '审核完成';
        if (status === '审核失败') return '审核驳回';
        return '—';
    }

    function normalizeRecord(key, rec) {
        var r = rec || {};
        var recordKey = r.key || r.recordKey || key;
        var parts = String(recordKey || '').split('::');
        var kind = parts.length >= 2 ? parts[1] : '';
        var fields = r.fields || {};
        var fromBdApp = String(recordKey || '').indexOf('bdapp::merchant::') === 0;
        var auditStatus =
            r.auditStatus ||
            (r.status === 'submitted'
                ? (fromBdApp ? '待总监审核' : '待BD审核')
                : r.status === 'rejected'
                  ? '审核失败'
                  : r.status === 'approved'
                    ? '审核成功'
                    : '');
        var merchantName =
            r.merchantShortName ||
            fields.short_name ||
            fields.receipt_name ||
            (parts.length >= 3 ? parts[2] : '');
        return {
            key: recordKey,
            rawKey: key,
            kind: kind,
            merchantName: merchantName || '—',
            fields: fields,
            ext: {
                huifuId: r.huifuId || r.merchantNo || '',
                groupName: r.groupName || r.subjectName || '',
                rejectReason: r.rejectReason || '',
                onboardingChannel: r.onboardingChannel || r.channel || '',
                onboardingCreatedAt: r.onboardingCreatedAt || '',
                completedAt: r.onboardingCompletedAt || r.completedAt || '',
                mccIndustry: r.mccIndustry || '',
                reqSeqId: r.reqSeqId || '',
                extMerId: r.extMerId || '',
                creator: r.creator || r.createdBy || '',
                remarks: r.remarks || '',
                headHuifuId: r.headHuifuId || '',
                settlementBodyType: r.settlementBodyType || '',
                regName: r.regName || r.licenseName || '',
                licenseCode: r.licenseCode || r.registrationCode || '',
                entType: r.entType || '',
                foundDate: r.foundDate || '',
                licenseBeginDate: r.licenseBeginDate || r.licenseValidFrom || '',
                licenseEndDate: r.licenseEndDate || r.licenseValidTo || '',
                regDetail: r.regDetail || r.registeredDetailAddress || '',
                legalName: r.legalName || r.legalPerson || '',
                legalCertType: r.legalCertType || r.legalIdDocType || '',
                idMasked: r.idMasked || '',
                legalCertBeginDate: r.legalCertBeginDate || r.idValidFrom || '',
                legalCertEndDate: r.legalCertEndDate || r.idValidTo || '',
                legalAddr: r.legalAddr || '',
                sceneType: r.sceneType || '',
                businessType: r.businessType || '',
                contactName: r.contactName || r.contact || '',
                loginName: r.loginName || r.loginAccount || '',
                bankMasked: r.bankMasked || '',
                openLicencePic: r.openLicencePic || '',
                openLicenceNo: r.openLicenceNo || '',
                placeName: r.placeName || r.storeName || ''
            },
            status: r.status || '',
            auditStatus: auditStatus,
            node: r.nextAuditNode || currentNode(auditStatus),
            submittedAt: r.submittedAt || '',
            updatedAt: r.updatedAt || '',
            title: r.title || ''
        };
    }

    function listRows() {
        var all = readRecords();
        var out = [];
        Object.keys(all).forEach(function (k) {
            var n = normalizeRecord(k, all[k]);
            if (!n.auditStatus) return;
            out.push(n);
        });
        out.sort(function (a, b) {
            return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
        });
        return out;
    }

    function matchFilter(item) {
        var qName = ((document.getElementById('qOnbMerchant') || {}).value || '').trim();
        var qKind = ((document.getElementById('qOnbKind') || {}).value || '').trim();
        var qSt = ((document.getElementById('qOnbAuditStatus') || {}).value || '').trim();
        if (qName && item.merchantName.indexOf(qName) === -1) return false;
        if (qKind && item.kind !== qKind) return false;
        if (qSt && displayAuditStatus(item.auditStatus) !== qSt) return false;
        return true;
    }

    function actionHtml(item) {
        var html = '<a href="#" class="mdm-onb-audit-detail">详情</a>';
        if (item.auditStatus === '待BD审核') {
            html += '　<a href="#" class="mdm-onb-audit-edit">编辑</a>';
        }
        if (item.auditStatus === '审核失败') {
            html += '　<a href="#" class="mdm-onb-audit-resubmit">重新提交</a>';
        }
        if (
            item.auditStatus === '待BD审核' ||
            item.auditStatus === '待总监审核' ||
            item.auditStatus === '待财务审核'
        ) {
            html += '　<a href="#" class="mdm-onb-audit-review">审核</a>';
        }
        return html;
    }

    function rowHtml(item, index) {
        var auditNo = 'WF-ONB-' + String(index + 1).padStart(6, '0');
        var requestNo = item.ext.reqSeqId || 'REQ-ONB-' + String(index + 1).padStart(6, '0');
        var applicationNo = item.ext.extMerId || auditNo;
        return (
            '<tr data-onb-key="' +
            item.key +
            '">' +
            '<td>' +
            requestNo +
            '</td>' +
            '<td>' +
            applicationNo +
            '</td>' +
            '<td>' +
            item.merchantName +
            '</td>' +
            '<td>' +
            kindLabel(item.kind) +
            '</td>' +
            '<td><span class="status ' +
            statusClass(displayAuditStatus(item.auditStatus)) +
            '">' +
            displayAuditStatus(item.auditStatus) +
            '</span></td>' +
            '<td>' +
            item.node +
            '</td>' +
            '<td>' +
            toTimeText(item.submittedAt) +
            '</td>' +
            '<td>' +
            toTimeText(item.updatedAt) +
            '</td>' +
            '<td class="action-links">' +
            actionHtml(item) +
            '</td>' +
            '</tr>'
        );
    }

    function getByTr(tr) {
        if (!tr) return null;
        var k = tr.getAttribute('data-onb-key');
        if (!k) return null;
        var all = readRecords();
        var rec = all[k];
        if (!rec) return null;
        return normalizeRecord(k, rec);
    }

    function saveNormalized(item) {
        var all = readRecords();
        var old = all[item.key] || {};
        old.auditStatus = item.auditStatus;
        old.nextAuditNode = item.node;
        old.updatedAt = Date.now();
        old.auditChain = '门店 -> BD -> 财务 -> 汇付';
        if (item.auditStatus === '审核成功') {
            old.status = 'submitted';
        } else if (item.auditStatus === '审核失败') {
            old.status = 'rejected';
        } else {
            old.status = 'submitted';
        }
        all[item.key] = old;
        writeRecords(all);
    }

    function closeModals() {
        document.querySelectorAll('[data-onb-audit-modal]').forEach(function (n) {
            n.remove();
        });
    }

    function fieldText(v) {
        if (typeof v === 'boolean') return v ? '已上传' : '—';
        var t = String(v == null ? '' : v).trim();
        return t || '—';
    }

    function detailRows(body, item) {
        var fields = item.fields || {};
        var card = fields.card_info || {};
        var ext = item.ext || {};
        function addSection(title, rows) {
            body.appendChild(el('div', 'supplier-detail-section-title', title));
            rows.forEach(function (kv) {
                var row = el('div', 'audit-detail-row');
                row.appendChild(el('span', 'audit-detail-row__label', kv[0]));
                if (kv[2] === 'image') {
                    var val = el('span', 'audit-detail-row__value');
                    var src = resolvePhotoSrc(kv[1], kv[0]);
                    if (!src) {
                        val.textContent = '待上传';
                    } else {
                        var tile = el('div');
                        tile.style.width = '180px';
                        tile.style.height = '112px';
                        tile.style.border = '1px solid #e5e7eb';
                        tile.style.borderRadius = '8px';
                        tile.style.overflow = 'hidden';
                        tile.style.background = '#f8fafc';
                        tile.style.display = 'flex';
                        tile.style.alignItems = 'center';
                        tile.style.justifyContent = 'center';
                        var img = document.createElement('img');
                        img.src = src;
                        img.alt = kv[0];
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.onerror = function () {
                            tile.innerHTML = '';
                            tile.appendChild(el('span', '', '已上传'));
                        };
                        tile.appendChild(img);
                        val.appendChild(tile);
                    }
                    row.appendChild(val);
                } else {
                    row.appendChild(el('span', 'audit-detail-row__value', kv[1]));
                }
                body.appendChild(row);
            });
        }
        function flowStatus() {
            if (item.auditStatus === '审核成功') return '成功';
            if (item.auditStatus === '审核失败') return '失败';
            if (item.auditStatus) return '审核中';
            if (item.status === 'draft') return '草稿';
            return '审核中';
        }

        addSection('基础信息', [
            ['商户名称', item.merchantName],
            ['汇付商户号', ext.huifuId || '—'],
            ['主体类型', kindLabel(item.kind)],
            ['所属集团主体', ext.groupName || '—'],
            ['进件状态', flowStatus()],
            ['驳回原因', ext.rejectReason || '—']
        ]);
        addSection('进件信息', [
            ['审核环节', item.node],
            ['进件渠道', ext.onboardingChannel || 'BD APP'],
            ['创建时间', toTimeText(ext.onboardingCreatedAt || item.submittedAt)],
            ['提交汇付时间', toTimeText(item.submittedAt)],
            ['汇付审核完成时间', toTimeText(ext.completedAt)],
            ['MCC行业', ext.mccIndustry || '—'],
            ['请求流水号', ext.reqSeqId || '—'],
            ['外部商户号', ext.extMerId || '—'],
            ['创建人', ext.creator || '—'],
            ['备注', ext.remarks || '—']
        ]);
        addSection('主体关系信息', [
            ['上级汇付号', ext.headHuifuId || '—'],
            ['结算主体类型', ext.settlementBodyType || '—']
        ]);
        addSection('执照信息', [
            ['营业执照', resolvePhotoSrc(fields.license_pic, '营业执照'), 'image'],
            ['营业执照名称', ext.regName || '—'],
            ['注册号/统一信用代码', ext.licenseCode || '—'],
            ['公司类型', ext.entType || '—'],
            ['成立日期', ext.foundDate || '—'],
            ['执照有效期', (ext.licenseBeginDate || '—') + ' ~ ' + (ext.licenseEndDate || '—')],
            ['注册地址', ext.regDetail || '—'],
            ['实际经营地址', fieldText(fields.detail_addr)]
        ]);
        addSection('法人信息', [
            ['法人姓名', ext.legalName || '—'],
            ['法人手机号', fieldText(fields.legal_mobile_no)],
            ['证件类型', ext.legalCertType || '—'],
            ['身份证号', ext.idMasked || '—'],
            ['证件有效期', (ext.legalCertBeginDate || '—') + ' ~ ' + (ext.legalCertEndDate || '—')],
            ['身份证地址', ext.legalAddr || '—'],
            ['身份证人像面', resolvePhotoSrc(fields.legal_cert_front_pic, '身份证人像面'), 'image'],
            ['身份证国徽面', resolvePhotoSrc(fields.legal_cert_back_pic, '身份证国徽面'), 'image']
        ]);
        addSection('经营信息', [
            ['商户简称', fieldText(fields.short_name)],
            ['小票名称', fieldText(fields.receipt_name)],
            ['场景类型', ext.sceneType || '—'],
            ['经营类型', ext.businessType || '—']
        ]);
        addSection('联系人信息', [
            ['管理员姓名', ext.contactName || '—'],
            ['管理员手机号', fieldText(fields.contact_mobile_no)],
            ['管理员邮箱', fieldText(fields.contact_email)],
            ['登录账号', ext.loginName || '—']
        ]);
        addSection('结算信息', [
            ['开户名/结算户名', fieldText(card.account_name)],
            ['银行账号', ext.bankMasked || fieldText(card.card_no)],
            ['开户银行', fieldText(card.bank_name)],
            ['开户支行', fieldText(card.bank_branch)],
            ['开户许可证', resolvePhotoSrc(ext.openLicencePic, '开户许可证'), 'image'],
            ['开户许可证核准号', ext.openLicenceNo || '—']
        ]);
        addSection('经营场地信息', [
            ['经营场所名称', ext.placeName || item.merchantName || '—'],
            ['门头/场地照', resolvePhotoSrc(fields.store_header_pic, '门头/场地照'), 'image'],
            ['内景/工作区域照', resolvePhotoSrc(fields.store_indoor_pic, '内景/工作区域照'), 'image'],
            ['收银台/前台照', resolvePhotoSrc(fields.store_cashier_desk_pic, '收银台/前台照'), 'image']
        ]);
    }

    function openDetail(item) {
        closeModals();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-onb-audit-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '进件审核详情'));
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
        detailRows(body, item);
        var footer = el('div', 'erp-modal__footer');
        if (item.auditStatus === '审核失败') {
            var rs = el('button', 'erp-btn erp-btn--primary', '重新提交');
            rs.type = 'button';
            rs.addEventListener('click', function () {
                backdrop.remove();
                resubmitFailed(item);
            });
            footer.appendChild(rs);
        }
        var btn = el('button', 'erp-btn erp-btn--primary', '关闭');
        btn.type = 'button';
        btn.addEventListener('click', function () {
            backdrop.remove();
        });
        footer.appendChild(btn);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    function nextStatusByApprove(status) {
        if (status === '待BD审核') return '待总监审核';
        if (status === '待总监审核') return '待财务审核';
        if (status === '待财务审核') return '待汇付审核';
        if (status === '待汇付审核') return '审核成功';
        return status;
    }

    function nodeByStatus(status) {
        if (status === '待BD审核') return 'BD审核';
        if (status === '待总监审核') return 'BD总监审核';
        if (status === '待财务审核') return '财务审核';
        if (status === '待汇付审核') return '汇付审核';
        if (status === '审核成功') return '审核完成';
        if (status === '审核失败') return '审核驳回';
        return '—';
    }

    function openEdit(item) {
        if (!item || (item.auditStatus !== '待BD审核' && item.auditStatus !== '审核失败')) {
            showToast('仅 BD 审核节点或审核失败记录支持编辑', 'info');
            return;
        }
        if (
            !window.MdmUnifiedOnboardingUi ||
            typeof window.MdmUnifiedOnboardingUi.openModal !== 'function'
        ) {
            showToast('进件模块未加载', 'error');
            return;
        }
        window.MdmUnifiedOnboardingUi.openModal({
            title: item.title || '进件审核编辑',
            merchantShortNameDefault: item.merchantName || '',
            fieldDefaults: copy(item.fields || {}),
            recordKey: item.key,
            variant: 'resource',
            onRecordChange: function () {
                render();
            }
        });
    }

    function resubmitFailed(item) {
        if (!item || item.auditStatus !== '审核失败') {
            showToast('当前记录不在审核失败状态', 'info');
            return;
        }
        showToast('请先编辑资料，再在弹窗内点击提交', 'info');
        openEdit(item);
    }

    function openReview(item) {
        if (item && item.auditStatus === '待汇付审核') {
            showToast('汇付审核由接口推送结果，后台无需人工操作', 'info');
            return;
        }
        closeModals();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-onb-audit-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '进件审核'));
        var body = el('div', 'erp-modal__body');
        detailRows(body, item);
        var footer = el('div', 'erp-modal__footer');
        var cancel = el('button', 'erp-btn', '取消');
        cancel.type = 'button';
        cancel.addEventListener('click', function () {
            backdrop.remove();
        });
        var reject = el('button', 'erp-btn', '驳回');
        reject.type = 'button';
        reject.addEventListener('click', function () {
            item.auditStatus = '审核失败';
            item.node = nodeByStatus(item.auditStatus);
            saveNormalized(item);
            backdrop.remove();
            render();
            showToast('已驳回进件申请', 'info');
        });
        var approve = el('button', 'erp-btn erp-btn--primary', '审核通过');
        approve.type = 'button';
        approve.addEventListener('click', function () {
            item.auditStatus = nextStatusByApprove(item.auditStatus);
            item.node = nodeByStatus(item.auditStatus);
            saveNormalized(item);
            backdrop.remove();
            render();
            showToast(item.auditStatus === '审核成功' ? '进件审核已完成' : '已流转下一审核节点', 'success');
        });
        footer.appendChild(cancel);
        if (item.auditStatus === '待BD审核') {
            var editBtn = el('button', 'erp-btn', '编辑');
            editBtn.type = 'button';
            editBtn.addEventListener('click', function () {
                backdrop.remove();
                openEdit(item);
            });
            footer.appendChild(editBtn);
        }
        footer.appendChild(reject);
        footer.appendChild(approve);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    function bindTableEvents() {
        if (tableEventsBound) return;
        var tbody = document.getElementById('onboardingAuditTableBody');
        if (!tbody) return;
        tableEventsBound = true;
        tbody.addEventListener('click', function (e) {
            var detail = e.target.closest('.mdm-onb-audit-detail');
            if (detail) {
                e.preventDefault();
                openDetail(getByTr(detail.closest('tr')));
                return;
            }
            var review = e.target.closest('.mdm-onb-audit-review');
            if (review) {
                e.preventDefault();
                openReview(getByTr(review.closest('tr')));
                return;
            }
            var edit = e.target.closest('.mdm-onb-audit-edit');
            if (edit) {
                e.preventDefault();
                openEdit(getByTr(edit.closest('tr')));
                return;
            }
            var rs = e.target.closest('.mdm-onb-audit-resubmit');
            if (rs) {
                e.preventDefault();
                resubmitFailed(getByTr(rs.closest('tr')));
            }
        });
    }

    function render() {
        var tbody = document.getElementById('onboardingAuditTableBody');
        var empty = document.getElementById('onboarding-audit-empty');
        if (!tbody) return;
        var rows = listRows().filter(matchFilter);
        tbody.innerHTML = rows.map(rowHtml).join('');
        if (empty) empty.style.display = rows.length ? 'none' : '';
        if (typeof createTablePagination === 'function') {
            createTablePagination({
                tableBodyId: 'onboardingAuditTableBody',
                paginationContainerId: 'onboarding-audit-pagination',
                pageSize: PAGE_SIZE,
                pageButtonRange: 3
            });
        }
    }

    function bindFilters() {
        if (filtersBound) return;
        var q = document.getElementById('btnOnbFilterQuery');
        var r = document.getElementById('btnOnbFilterReset');
        filtersBound = true;
        if (q) q.addEventListener('click', render);
        if (r) {
            r.addEventListener('click', function () {
                ['qOnbMerchant', 'qOnbKind', 'qOnbAuditStatus'].forEach(function (id) {
                    var node = document.getElementById(id);
                    if (node) node.value = '';
                });
                render();
            });
        }
    }

    function resolveMode() {
        var hash = String(window.location.hash || '').replace(/^#/, '');
        return hash === 'onboarding-review' ? 'onboarding-review' : 'store-registration';
    }

    function applyMode(mode) {
        var regPanel = document.getElementById('audit-store-registration-panel');
        var onbPanel = document.getElementById('audit-onboarding-panel');
        var title = document.querySelector('.content-title');
        var tab = document.getElementById('auditCurrentTab');
        if (!regPanel || !onbPanel) return;
        var onb = mode === 'onboarding-review';
        regPanel.classList.toggle('audit-panel-hidden', onb);
        onbPanel.classList.toggle('audit-panel-hidden', !onb);
        if (title) {
            title.textContent = onb
                ? '审核中心 / 进件审核 / 进件审核'
                : '审核中心 / 门店审核 / 门店注册审核';
        }
        if (tab) tab.textContent = onb ? '进件审核' : '门店注册审核';
        if (onb) render();
    }

    function init() {
        ensureDemoRecords();
        applyMode(resolveMode());
        bindFilters();
        bindTableEvents();
        window.addEventListener('hashchange', function () {
            applyMode(resolveMode());
        });
    }

    window.MdmAuditOnboardingUi = {
        init: init,
        render: render
    };
})();
