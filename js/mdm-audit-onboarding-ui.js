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
            license_info: {
                name: '杭州悦享轻食餐饮管理有限公司',
                code: '91330106MA2GXXXX1X',
                start_date: '2023-06-01',
                valid_date: '2033-06-01',
                address: '杭州市西湖区文三路 88 号'
            },
            legal_info: {
                cert_type: '身份证',
                legal_name: '张三',
                id_no: '330102199001011234',
                id_start_date: '2020-01-01',
                id_valid_date: '2030-01-01'
            },
            license_pic: demoImg('营业执照 F07'),
            legal_cert_front_pic: demoImg('身份证人像面 F02'),
            legal_cert_back_pic: demoImg('身份证国徽面 F03'),
            open_license_pic: demoImg('开户许可证'),
            store_header_pic: demoImg('门头照 F22'),
            store_indoor_pic: demoImg('内景照 F24'),
            store_cashier_desk_pic: demoImg('收银台照 F105'),
            payment_agreement_signed: true,
            payment_agreement: {
                type: '挂网协议',
                name: '斗拱平台综合支付服务协议',
                url: 'https://cloudpnrcdn.oss-cn-shanghai.aliyuncs.com/opps/api/prod/download_file/PaymentServiceAgreement.htm',
                signed: true
            }
        };
        var rows = [
            {
                key: 'audit-demo::store::MCH-AUD-001',
                merchantShortName: '悦享轻食-城西银泰店',
                status: 'submitted',
                auditStatus: '待BD审核',
                nextAuditNode: 'BD 预审',
                subjectName: '杭州悦享轻食集团',
                settlementBodyType: '集团结算',
                createdBy: '周经理',
                channel: '门店 APP',
                onboardingChannel: '汇付天下',
                merchantNo: 'MCH20260415006',
                mccIndustry: '餐饮',
                onboardingCreatedAt: '2026-04-14 08:00',
                submittedAt: '',
                updatedAt: now - day * 2 + 3600 * 1000,
                remarks: '',
                reqSeqId: '',
                extMerId: ''
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
                remarks: 'BD预审通过，待总监审核',
                auditLogs: [
                    {
                        node: 'BD 预审',
                        reviewer: 'BD 王磊',
                        time: '2026-08-22 11:20',
                        result: '通过',
                        reason: '证照与结算信息齐全'
                    }
                ]
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
                remarks: 'BD环节驳回',
                auditLogs: [
                    {
                        node: 'BD 预审',
                        reviewer: 'BD 王强',
                        time: '2026-08-21 16:40',
                        result: '驳回',
                        reason: '证照信息不完整，请补齐后重提'
                    }
                ]
            }
        ];
        var changed = false;
        rows.forEach(function (r) {
            if (all[r.key]) return;
            var seedFields = copy(baseFields);
            if (r.merchantShortName) seedFields.short_name = r.merchantShortName;
            all[r.key] = {
                key: r.key,
                title: '进件演示',
                merchantShortName: r.merchantShortName,
                status: r.status,
                auditStatus: r.auditStatus,
                nextAuditNode: r.nextAuditNode,
                fields: seedFields,
                updatedAt: r.updatedAt,
                submittedAt: r.submittedAt,
                onboardingCreatedAt: r.onboardingCreatedAt || r.submittedAt || '',
                auditChain: '门店 -> BD -> 财务 -> 汇付',
                subjectName: r.subjectName,
                settlementBodyType: r.settlementBodyType,
                createdBy: r.createdBy,
                channel: r.channel,
                onboardingChannel: r.onboardingChannel || '汇付天下',
                onboardingCompletedAt: r.onboardingCompletedAt || '',
                rejectReason: r.rejectReason || '',
                remarks: r.remarks || '',
                mccIndustry: r.mccIndustry || '餐饮',
                reqSeqId: r.reqSeqId != null ? r.reqSeqId : 'REQ-' + r.key.split('::').pop(),
                extMerId: r.extMerId != null ? r.extMerId : 'EXT-' + r.key.split('::').pop(),
                auditLogs: r.auditLogs || [],
                merchantNo: r.merchantNo || 'MCH' + r.key.split('::').pop().replace(/\D/g, ''),
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
        Object.keys(all).forEach(function (k) {
            if (String(k).indexOf('audit-demo::') !== 0) return;
            var rec = all[k];
            if (!rec || !rec.fields) return;
            var f = rec.fields;
            if (!f.license_info) {
                f.license_info = copy(baseFields.license_info);
                changed = true;
            }
            if (!f.legal_info) {
                f.legal_info = copy(baseFields.legal_info);
                changed = true;
            }
            if (f.open_license_pic == null) {
                f.open_license_pic = baseFields.open_license_pic;
                changed = true;
            }
            if (String(k).indexOf('::supplier::') >= 0 && f.payment_agreement_signed == null) {
                f.payment_agreement_signed = true;
                f.payment_agreement = copy(baseFields.payment_agreement);
                changed = true;
            }
            if (!rec.onboardingChannel) {
                rec.onboardingChannel = '汇付天下';
                changed = true;
            }
            if (!rec.mccIndustry) {
                rec.mccIndustry = '餐饮';
                changed = true;
            }
            if (!rec.onboardingCreatedAt && rec.submittedAt) {
                rec.onboardingCreatedAt = rec.submittedAt;
                changed = true;
            }
            if (k === 'audit-demo::store::MCH-AUD-001' && rec.merchantNo !== 'MCH20260415006') {
                rec.merchantShortName = '悦享轻食-城西银泰店';
                rec.createdBy = '周经理';
                rec.onboardingChannel = '汇付天下';
                rec.merchantNo = 'MCH20260415006';
                rec.mccIndustry = '餐饮';
                rec.onboardingCreatedAt = '2026-04-14 08:00';
                rec.nextAuditNode = 'BD 预审';
                rec.reqSeqId = '';
                rec.extMerId = '';
                rec.submittedAt = '';
                rec.remarks = '';
                f.short_name = '悦享轻食-城西银泰店';
                changed = true;
            }
            if (!Array.isArray(rec.auditLogs) || !rec.auditLogs.length) {
                if (k === 'audit-demo::supplier::MCH-AUD-002') {
                    rec.auditLogs = [
                        {
                            node: 'BD 预审',
                            reviewer: 'BD 王磊',
                            time: '2026-08-22 11:20',
                            result: '通过',
                            reason: '证照与结算信息齐全'
                        }
                    ];
                    changed = true;
                } else if (k === 'audit-demo::store::MCH-AUD-006') {
                    rec.auditLogs = [
                        {
                            node: 'BD 预审',
                            reviewer: 'BD 王强',
                            time: '2026-08-21 16:40',
                            result: '驳回',
                            reason: rec.rejectReason || '证照信息不完整，请补齐后重提'
                        }
                    ];
                    changed = true;
                } else if (!Array.isArray(rec.auditLogs)) {
                    rec.auditLogs = [];
                    changed = true;
                }
            }
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
        if (v == null || v === '') return '—';
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v.trim())) {
            var parsed = new Date(v.trim().replace(' ', 'T'));
            if (isNaN(parsed.getTime())) return v.trim();
            v = parsed;
        }
        var d = v instanceof Date ? v : new Date(v);
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
        if (status === '待BD审核') return 'BD 预审';
        if (status === '待总监审核') return 'BD 总监审核';
        if (status === '待财务审核') return '财务审核';
        if (status === '待汇付审核') return '汇付审核';
        if (status === '审核成功') return '审核完成';
        if (status === '审核失败') return '审核驳回';
        return '—';
    }

    function auditStepText(item) {
        var node = (item && item.node) || '';
        if (node === 'BD审核') return 'BD 预审';
        if (node === 'BD总监审核') return 'BD 总监审核';
        return node || currentNode(item && item.auditStatus);
    }

    function headerStatusText(status) {
        if (status === '审核成功' || status === '审核失败') return status;
        if (status) return '待审核';
        return '—';
    }

    function reachedHuifu(status) {
        return status === '待汇付审核' || status === '审核成功';
    }

    function currentOnbReviewer(status) {
        if (status === '待BD审核') return 'BD 王强';
        if (status === '待总监审核') return 'BD总监 李静';
        if (status === '待财务审核') return '财务 赵敏';
        return '审核员';
    }

    function pushOnbAuditLog(item, result, reason) {
        if (!item.auditLogs) item.auditLogs = [];
        item.auditLogs.push({
            node: auditStepText(item),
            reviewer: currentOnbReviewer(item.auditStatus),
            time: toTimeText(Date.now()),
            result: result,
            reason: String(reason || '').trim()
        });
        if (result === '驳回') item.rejectReason = String(reason || '').trim();
    }

    function appendOnbAuditLogTable(parent, logs) {
        parent.appendChild(el('div', 'supplier-detail-section-title', '审核记录'));
        var list = logs || [];
        if (!list.length) {
            parent.appendChild(el('div', 'audit-empty-note', '暂无审核记录'));
            return;
        }
        var table = el('table', 'audit-log-table');
        var thead = el('thead');
        var hr = el('tr');
        ['审核环节', '审核人', '审核时间', '审核结果', '原因'].forEach(function (h) {
            hr.appendChild(el('th', '', h));
        });
        thead.appendChild(hr);
        table.appendChild(thead);
        var tbody = el('tbody');
        list.forEach(function (log) {
            var tr = el('tr');
            tr.appendChild(el('td', '', log.node || '—'));
            tr.appendChild(el('td', '', log.reviewer || '—'));
            tr.appendChild(el('td', '', log.time || '—'));
            tr.appendChild(el('td', '', log.result || '—'));
            tr.appendChild(el('td', '', log.reason || '—'));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        parent.appendChild(table);
    }

    function appendOnbOpinionBox(parent) {
        parent.appendChild(el('div', 'supplier-detail-section-title', '审核意见'));
        parent.appendChild(el('p', 'audit-reason-hint', '通过原因 / 驳回原因，选填'));
        var ta = document.createElement('textarea');
        ta.className = 'erp-textarea';
        ta.rows = 3;
        ta.style.width = '100%';
        ta.style.boxSizing = 'border-box';
        ta.placeholder = '选填，通过或驳回时可填写原因';
        ta.setAttribute('data-audit-opinion', '1');
        parent.appendChild(ta);
        return ta;
    }

    function readOnbOpinion(root) {
        var ta = root && root.querySelector('[data-audit-opinion]');
        return ta ? String(ta.value || '').trim() : '';
    }

    function copyMerchantNo(text) {
        var v = String(text || '').trim();
        if (!v || v === '—') {
            showToast('暂无商户编号', 'info');
            return;
        }
        function ok() {
            showToast('已复制商户编号', 'success');
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(v).then(ok).catch(function () {
                showToast('复制失败', 'error');
            });
            return;
        }
        var inp = document.createElement('input');
        inp.value = v;
        document.body.appendChild(inp);
        inp.select();
        try {
            document.execCommand('copy');
            ok();
        } catch (e) {
            showToast('复制失败', 'error');
        }
        inp.remove();
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
                merchantNo: r.merchantNo || '',
                companyName: (fields.license_info && fields.license_info.name) || r.regName || r.licenseName || '',
                onboardingChannel: r.onboardingChannel || '汇付天下',
                onboardingCreatedAt: r.onboardingCreatedAt || r.createdAt || '',
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
            title: r.title || '',
            auditLogs: Array.isArray(r.auditLogs) ? r.auditLogs : []
        };
    }

    function listRows() {
        var all = readRecords();
        var out = [];
        Object.keys(all).forEach(function (k) {
            var n = normalizeRecord(k, all[k]);
            if (!n.auditStatus) return;
            if (n.kind !== 'store' && n.kind !== 'supplier') return;
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
            (item.ext.creator || '—') +
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
        old.auditLogs = item.auditLogs || old.auditLogs || [];
        if (item.rejectReason) old.rejectReason = item.rejectReason;
        if (item.auditStatus === '审核成功') {
            old.status = 'submitted';
        } else if (item.auditStatus === '审核失败') {
            old.status = 'rejected';
        } else {
            old.status = 'submitted';
        }
        all[item.key] = old;
        writeRecords(all);
        if (
            item.auditStatus === '审核成功' &&
            item.key &&
            item.key.indexOf('archive::supplier::') === 0
        ) {
            var supplierId = item.key.split('::').pop();
            if (
                window.MdmSupplierArchiveUi &&
                typeof window.MdmSupplierArchiveUi.onOnboardingSuccess === 'function'
            ) {
                window.MdmSupplierArchiveUi.onOnboardingSuccess(supplierId);
            }
        }
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

    function pickText() {
        var i;
        for (i = 0; i < arguments.length; i++) {
            var t = String(arguments[i] == null ? '' : arguments[i]).trim();
            if (t) return t;
        }
        return '—';
    }

    function detailRows(body, item) {
        var fields = item.fields || {};
        var card = fields.card_info || {};
        var lic = fields.license_info || {};
        var legal = fields.legal_info || {};
        var ext = item.ext || {};
        var agreement =
            window.MdmUnifiedOnboardingUi &&
            typeof window.MdmUnifiedOnboardingUi.resolvePaymentAgreementInfo === 'function'
                ? window.MdmUnifiedOnboardingUi.resolvePaymentAgreementInfo(fields)
                : fields.payment_agreement || {};
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
                } else if (kv[2] === 'link' && kv[3]) {
                    var linkVal = el('span', 'audit-detail-row__value');
                    var a = document.createElement('a');
                    a.href = kv[3];
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.textContent = kv[1];
                    linkVal.appendChild(a);
                    row.appendChild(linkVal);
                } else {
                    row.appendChild(el('span', 'audit-detail-row__value', kv[1]));
                }
                body.appendChild(row);
            });
        }
        var companyName = pickText(
            ext.companyName,
            lic.name,
            card.account_name,
            item.merchantName
        );
        var merchantNo = pickText(ext.merchantNo);
        var shortName = pickText(fields.short_name, item.merchantName);
        var hero = el('div', 'onb-audit-hero');
        hero.appendChild(el('p', 'onb-audit-hero__name', companyName));
        var noRow = el('div', 'onb-audit-hero__row');
        noRow.appendChild(el('span', '', '商户编号 ' + merchantNo));
        if (merchantNo !== '—') {
            var copyBtn = el('button', 'onb-audit-copy', '复制');
            copyBtn.type = 'button';
            copyBtn.addEventListener('click', function () {
                copyMerchantNo(merchantNo);
            });
            noRow.appendChild(copyBtn);
        }
        hero.appendChild(noRow);
        var subRow = el('div', 'onb-audit-hero__row');
        subRow.appendChild(el('span', '', '简称 ' + shortName));
        var badge = el('span', 'status ' + statusClass(headerStatusText(item.auditStatus)));
        badge.textContent = headerStatusText(item.auditStatus);
        subRow.appendChild(badge);
        hero.appendChild(subRow);
        body.appendChild(hero);

        var flowRows = [
            ['审核环节', auditStepText(item)],
            ['进件渠道', pickText(ext.onboardingChannel, '汇付天下')],
            ['创建时间', toTimeText(ext.onboardingCreatedAt || item.submittedAt)],
            ['提交汇付时间', reachedHuifu(item.auditStatus) ? toTimeText(item.submittedAt) : '—'],
            [
                '汇付审核完成时间',
                item.auditStatus === '审核成功' ? toTimeText(ext.completedAt) : '—'
            ],
            ['MCC行业', pickText(ext.mccIndustry, '餐饮')],
            ['请求流水号', reachedHuifu(item.auditStatus) ? pickText(ext.reqSeqId) : '—'],
            ['外部商户号', reachedHuifu(item.auditStatus) ? pickText(ext.extMerId) : '—'],
            ['创建人', pickText(ext.creator)],
            ['备注', pickText(ext.remarks)]
        ];
        if (item.auditStatus === '审核失败' || ext.rejectReason) {
            flowRows.push(['驳回原因', pickText(ext.rejectReason)]);
        }
        addSection('进件流程信息', flowRows);
        var firstTitle = body.querySelector('.supplier-detail-section-title');
        if (firstTitle) {
            var desc = el('div', 'onb-audit-section-desc', '审核流转与关键时间');
            firstTitle.insertAdjacentElement('afterend', desc);
        }
        addSection('执照信息', [
            ['营业执照(F07)', fields.license_pic, 'image'],
            ['营业执照名称', pickText(lic.name, ext.regName)],
            ['证件代码', pickText(lic.code, ext.licenseCode)],
            ['执照起始日期', pickText(lic.start_date, ext.licenseBeginDate)],
            ['执照有效期', pickText(lic.valid_date, ext.licenseEndDate)],
            ['注册地址', pickText(lic.address, ext.regDetail)]
        ]);
        addSection('法人信息', [
            ['法人身份证人像面(F02)', fields.legal_cert_front_pic, 'image'],
            ['法人身份证国徽面(F03)', fields.legal_cert_back_pic, 'image'],
            ['证件类型', pickText(legal.cert_type, ext.legalCertType, '身份证')],
            ['法人姓名', pickText(legal.legal_name, ext.legalName)],
            ['身份证号', pickText(legal.id_no, ext.idMasked)],
            ['身份证起始日期', pickText(legal.id_start_date, ext.legalCertBeginDate)],
            ['身份证有效期', pickText(legal.id_valid_date, ext.legalCertEndDate)]
        ]);
        addSection('商户信息', [
            ['商户简称', fieldText(fields.short_name)],
            ['小票名称', fieldText(fields.receipt_name)],
            ['实际经营地址', fieldText(fields.detail_addr)],
            ['法人手机号', fieldText(fields.legal_mobile_no)],
            ['管理员手机号', fieldText(fields.contact_mobile_no)],
            ['管理员邮箱', fieldText(fields.contact_email)]
        ]);
        addSection('结算信息', [
            ['开户许可证', fields.open_license_pic || ext.openLicencePic, 'image'],
            ['开户名', fieldText(card.account_name)],
            ['银行卡号', fieldText(card.card_no)],
            ['开户银行', fieldText(card.bank_name)],
            ['开户支行', fieldText(card.bank_branch)]
        ]);
        addSection('门店场地', [
            ['门头/场地照(F22)', fields.store_header_pic, 'image'],
            ['内景/工作区域照(F24)', fields.store_indoor_pic, 'image'],
            ['收银台/前台照(F105)', fields.store_cashier_desk_pic, 'image']
        ]);
        if (item.kind === 'supplier') {
            var signed = !!(agreement && agreement.signed) || !!fields.payment_agreement_signed;
            var agreeName = pickText(agreement && agreement.name, '斗拱平台综合支付服务协议');
            var agreeUrl = (agreement && agreement.url) || '';
            addSection('签订协议', [
                ['协议类型', pickText(agreement && agreement.type, '挂网协议')],
                ['协议签署', signed ? '已签署' : '未签署'],
                agreeUrl
                    ? ['协议名称', '《' + agreeName + '》', 'link', agreeUrl]
                    : ['协议名称', '《' + agreeName + '》']
            ]);
        }
        appendOnbAuditLogTable(body, item.auditLogs);
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
        return currentNode(status);
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
            onboardingKind: item.kind || '',
            /* 审核中心：单据已提交；仅返回/保存（待提交草稿另有删除），无「提交进件」 */
            auditCenterEdit: true,
            forceEdit: true,
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
        showToast('请先编辑并保存资料，再在列表操作栏点击「审核」', 'info');
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
        appendOnbOpinionBox(body);
        var footer = el('div', 'erp-modal__footer');
        var cancel = el('button', 'erp-btn', '取消');
        cancel.type = 'button';
        cancel.addEventListener('click', function () {
            backdrop.remove();
        });
        var reject = el('button', 'erp-btn', '驳回');
        reject.type = 'button';
        reject.addEventListener('click', function () {
            pushOnbAuditLog(item, '驳回', readOnbOpinion(body));
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
            pushOnbAuditLog(item, '通过', readOnbOpinion(body));
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
                : '审核中心 / 入驻审核';
        }
        if (tab) tab.textContent = onb ? '进件审核' : '入驻审核';
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
