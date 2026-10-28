/**
 * 入驻审核 — 详情弹窗、媒体预览、审核流程（由 vendor audit-store-registration 迁入）
 */
(function () {
    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function mkBtn(label, primary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        b.textContent = label;
        return b;
    }

    function textInput(placeholder, value, extra) {
        var inp = document.createElement('input');
        inp.className = 'erp-input';
        inp.type = 'text';
        inp.placeholder = placeholder || '';
        inp.value = value != null ? String(value) : '';
        if (extra && extra.readOnly) {
            inp.readOnly = true;
            inp.style.background = '#f5f5f5';
        }
        return inp;
    }

    function textareaInput(placeholder, value, rows) {
        var ta = document.createElement('textarea');
        ta.className = 'erp-textarea';
        ta.rows = rows || 3;
        ta.style.width = '100%';
        ta.style.boxSizing = 'border-box';
        ta.placeholder = placeholder || '';
        ta.value = value != null ? String(value) : '';
        return ta;
    }

    function selectInput(opts, value) {
        var sel = document.createElement('select');
        sel.className = 'erp-select';
        opts.forEach(function (o) {
            var opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = o.label;
            sel.appendChild(opt);
        });
        if (value != null) sel.value = String(value);
        return sel;
    }

    /** 生鲜店、同行店归加盟店，合作店归联营店。三种类型都按加盟店资料填写。 */
    function displayPartnerDivision(v) {
        if (v === '生鲜店' || v === '同行店') return '加盟店';
        if (v === '合作店') return '联营店';
        return v;
    }

    function isFranchiseOrPartnerRow(row) {
        var v = displayPartnerDivision(row && row.partnerDivision);
        return v === '加盟店' || v === '联营店' || v === '直营店';
    }

    function partnerDivisionSelectOptions(current) {
        var value = displayPartnerDivision(current) || '';
        var opts = [
            { value: '加盟店', label: '加盟店' },
            { value: '联营店', label: '联营店' },
            { value: '直营店', label: '直营店' }
        ];
        if (value && !opts.some(function (o) { return o.value === value; })) {
            opts.push({ value: value, label: value });
        }
        return { options: opts, value: value };
    }

    function isSupplierAuditRow(row) {
        return row && row.subjectType === '供应商';
    }

    function isAuditFieldRequired(fieldKey, row) {
        if (isSupplierAuditRow(row)) {
            /* 与「新增供应商商家」一致：主体名称 / 联系人 / 手机号码 */
            var supReq = {
                subjectName: true,
                phone: true,
                contact: true
            };
            return !!supReq[fieldKey];
        }
        var common = {
            subjectName: true,
            bd: true,
            warehouse: true,
            storeName: true,
            partnerDivision: true,
            storeType: true,
            bizLine: true,
            brandName: true,
            bizLines: true,
            region: true,
            address: true,
            facadePhoto: true,
            phone: true,
            contact: true,
            verifyCode: true
        };
        if (common[fieldKey]) return true;
        if (isFranchiseOrPartnerRow(row) && (fieldKey === 'storeArea' || fieldKey === 'storeFloors')) return true;
        return false;
    }

    /** 详情 / 审核只读展示：与编辑必填一致，但不展示验证码必填 */
    function isAuditDisplayRequired(fieldKey, row) {
        if (fieldKey === 'verifyCode') return false;
        return isAuditFieldRequired(fieldKey, row);
    }

    function hasFacadePhoto(row) {
        var f = row && row.facadePhoto;
        return Array.isArray(f) && f.length > 0;
    }

    function phoneWithSmsControl(row) {
        var wrap = el('div', 'erp-modal-phone-row');
        var inp = textInput('手机号', row.phone);
        inp.type = 'tel';
        inp.setAttribute('data-audit-field', 'phone');
        var btn = mkBtn('获取验证码', false);
        btn.className = 'erp-btn erp-btn--sms';
        btn.addEventListener('click', function () {
            if (typeof showToast === 'function') showToast('演示：短信验证码已发送', 'success');
        });
        wrap.appendChild(inp);
        wrap.appendChild(btn);
        return wrap;
    }

    function editPhoneRow(dataRow) {
        var rowEl = el('div', 'audit-detail-row');
        var labelEl = el('span', 'audit-detail-row__label');
        labelEl.appendChild(el('span', 'audit-req', '*'));
        labelEl.appendChild(document.createTextNode('老板 / 负责人联系电话'));
        rowEl.appendChild(labelEl);
        var value = el('span', 'audit-detail-row__value');
        value.appendChild(phoneWithSmsControl(dataRow));
        rowEl.appendChild(value);
        return rowEl;
    }

    function appendContactSectionHeader(body) {
        body.appendChild(el('div', 'supplier-detail-section-title', '老板 / 联系人'));
    }

    function appendContactDetailSection(body, row) {
        appendContactSectionHeader(body);
        body.appendChild(detailRow('老板 / 联系人姓名', row.contact, 'contact', row));
        body.appendChild(detailRow('老板 / 负责人联系电话', row.phone, 'phone', row));
    }

    function appendContactEditSection(body, row) {
        appendContactSectionHeader(body);
        body.appendChild(
            editRow('老板 / 联系人姓名', textInput('请输入姓名', row.contact), 'contact', row)
        );
        body.appendChild(editPhoneRow(row));
        var codeInp = textInput('请输入验证码', row.verifyCode);
        codeInp.type = 'text';
        codeInp.maxLength = 6;
        codeInp.setAttribute('inputmode', 'numeric');
        body.appendChild(editRow('短信验证码', codeInp, 'verifyCode', row));
    }

    function validateAuditEdit(patch, row) {
        var p = patch || {};
        var merged = {};
        Object.keys(row || {}).forEach(function (k) {
            merged[k] = row[k];
        });
        Object.keys(p).forEach(function (k) {
            merged[k] = p[k];
        });
        var checks = isSupplierAuditRow(merged)
            ? [
                  { key: 'subjectName', msg: '请填写主体名称' },
                  { key: 'contact', msg: '请填写联系人' },
                  { key: 'phone', msg: '请填写手机号码' }
              ]
            : [
                  { key: 'subjectName', msg: '请填写门店主体' },
                  { key: 'bd', msg: '请填写绑定BD' },
                  { key: 'warehouse', msg: '请选择配送仓库' },
                  { key: 'storeName', msg: '请填写门店名称' },
                  { key: 'partnerDivision', msg: '请选择门店合作类型' },
                  { key: 'storeType', msg: '请填写门店类型' },
                  { key: 'bizLine', msg: '请选择事业线' },
                  { key: 'brandName', msg: '请选择品牌名称' },
                  { key: 'bizLines', msg: '请选择业务线' },
                  { key: 'region', msg: '请选择省市区' },
                  { key: 'address', msg: '请填写详细地址' },
                  { key: 'phone', msg: '请填写联系电话' },
                  { key: 'contact', msg: '请填写联系人姓名' }
              ];
        var i;
        for (i = 0; i < checks.length; i++) {
            var v = String(p[checks[i].key] != null ? p[checks[i].key] : '').trim();
            if (!v) {
                if (typeof showToast === 'function') showToast(checks[i].msg, 'error');
                return false;
            }
        }
        if (isSupplierAuditRow(merged)) return true;
        var code = String(p.verifyCode != null ? p.verifyCode : '').trim();
        if (!code || code.length < 4) {
            if (typeof showToast === 'function') showToast('请填写验证码', 'error');
            return false;
        }
        if (!hasFacadePhoto(merged)) {
            if (typeof showToast === 'function') showToast('请上传门头/场地照', 'error');
            return false;
        }
        if (isFranchiseOrPartnerRow(merged)) {
            if (!String(p.storeArea != null ? p.storeArea : '').trim()) {
                if (typeof showToast === 'function') showToast('请填写门店面积', 'error');
                return false;
            }
            if (!String(p.storeFloors != null ? p.storeFloors : '').trim()) {
                if (typeof showToast === 'function') showToast('请填写门店楼层', 'error');
                return false;
            }
        }
        return true;
    }

    function closeAuditModals() {
        document.querySelectorAll('[data-audit-center-modal]').forEach(function (n) {
            n.remove();
        });
    }

    function detailRow(label, value, fieldKey, dataRow) {
        var rowEl = el('div', 'audit-detail-row');
        var labelEl = el('span', 'audit-detail-row__label');
        if (fieldKey && dataRow && isAuditDisplayRequired(fieldKey, dataRow)) {
            labelEl.appendChild(el('span', 'audit-req', '*'));
        }
        labelEl.appendChild(document.createTextNode(label));
        rowEl.appendChild(labelEl);
        var valueEl = el('span', 'audit-detail-row__value');
        if (value instanceof Node) valueEl.appendChild(value);
        else valueEl.textContent = value || '—';
        rowEl.appendChild(valueEl);
        return rowEl;
    }

    function mediaUrl(file) {
        if (file.url) return file.url;
        if (file.type === 'video') return 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">' +
            '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#eff6ff"/></linearGradient></defs>' +
            '<rect width="360" height="240" rx="18" fill="url(#g)"/>' +
            '<circle cx="72" cy="70" r="24" fill="#93c5fd"/>' +
            '<path d="M40 196l82-82 54 54 36-36 108 108H40z" fill="#60a5fa" opacity=".55"/>' +
            '<text x="180" y="218" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#1d4ed8">' +
            escapeHtml(file.name) +
            '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function openMediaPreview(file) {
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-audit-center-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', file.name));
        var actions = el('div', 'erp-modal__header-actions');
        var close = el('button', 'erp-modal__header-btn');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.addEventListener('click', function () {
            backdrop.remove();
        });
        actions.appendChild(close);
        header.appendChild(actions);

        var body = el('div', 'erp-modal__body');
        var preview = el('div', 'audit-media-preview');
        if (file.type === 'video') {
            var video = el('video', 'audit-media-preview__video');
            video.controls = true;
            video.autoplay = true;
            video.src = mediaUrl(file);
            preview.appendChild(video);
        } else {
            var img = el('img', 'audit-media-preview__image');
            img.src = mediaUrl(file);
            img.alt = file.name;
            preview.appendChild(img);
        }
        body.appendChild(preview);

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

    function mediaGrid(files) {
        if (!Array.isArray(files) || files.length === 0) return '—';
        var wrap = el('div', 'audit-media-grid');
        files.forEach(function (file) {
            var card = el('div', 'audit-media-card');
            if (file.type === 'video') {
                var video = el('video', 'audit-media-card__video');
                video.controls = true;
                video.preload = 'metadata';
                video.src = mediaUrl(file);
                card.appendChild(video);
            } else {
                var img = el('img', 'audit-media-card__image');
                img.src = mediaUrl(file);
                img.alt = file.name;
                img.addEventListener('click', function () {
                    openMediaPreview(file);
                });
                card.appendChild(img);
            }
            card.appendChild(el('div', 'audit-media-card__caption', file.name));
            wrap.appendChild(card);
        });
        return wrap;
    }

    /** 供应商入驻：字段与「新增供应商商家」一致（主体名称 / 主体类型 / 联系人 / 手机号码） */
    function appendSupplierRegistrationFields(body, row) {
        body.appendChild(el('div', 'supplier-detail-section-title', '供应商商家字段'));
        body.appendChild(detailRow('主体名称', row.subjectName, 'subjectName', row));
        body.appendChild(detailRow('主体类型', row.subjectType || '供应商'));
        body.appendChild(detailRow('联系人', row.contact, 'contact', row));
        body.appendChild(detailRow('手机号码', row.phone, 'phone', row));
    }

    function appendSupplierEditableFields(body, row) {
        body.appendChild(el('div', 'supplier-detail-section-title', '供应商商家字段'));
        body.appendChild(editRow('主体名称', textInput('请输入主体名称', row.subjectName), 'subjectName', row));
        body.appendChild(detailRow('主体类型', row.subjectType || '供应商'));
        body.appendChild(editRow('联系人', textInput('请输入联系人', row.contact), 'contact', row));
        var phoneInp = textInput('请输入手机号码', row.phone);
        phoneInp.type = 'tel';
        body.appendChild(editRow('手机号码', phoneInp, 'phone', row));
    }

    function appendRegistrationFields(body, row) {
        if (isSupplierAuditRow(row)) {
            appendSupplierRegistrationFields(body, row);
            return;
        }
        var isFranchiseOrPartner = isFranchiseOrPartnerRow(row);
        var isPeerStore = row.partnerDivision === '同行店';

        body.appendChild(el('div', 'supplier-detail-section-title', '主体字段'));
        body.appendChild(detailRow('主体名称', row.subjectName, 'subjectName', row));
        body.appendChild(detailRow('绑定BD', row.bd, 'bd', row));
        body.appendChild(detailRow('主体类型', row.subjectType || '门店'));

        body.appendChild(el('div', 'supplier-detail-section-title', '门店档案字段'));
        body.appendChild(detailRow('入驻方名称', row.storeName, 'storeName', row));
        body.appendChild(detailRow('门店简称', row.shortName));
        body.appendChild(detailRow('门店合作类型', displayPartnerDivision(row.partnerDivision), 'partnerDivision', row));
        body.appendChild(detailRow('门店类型', row.storeType, 'storeType', row));
        appendStoreBizDetail(body, row);
        body.appendChild(detailRow('配送仓库', row.warehouse, 'warehouse', row));
        body.appendChild(detailRow('省市区', row.region, 'region', row));
        body.appendChild(detailRow('详细地址', row.address, 'address', row));
        body.appendChild(detailRow('经纬度', row.latlng));
        body.appendChild(detailRow('门头/场地照', mediaGrid(row.facadePhoto), 'facadePhoto', row));
        body.appendChild(detailRow('有无冷藏柜', row.hasRefrigeratedCabinet));
        body.appendChild(detailRow('冷藏柜照片', mediaGrid(row.refrigeratedPhotos)));
        body.appendChild(detailRow('有无冷冻柜', row.hasFreezerCabinet));
        body.appendChild(detailRow('冷冻柜照片', mediaGrid(row.freezerPhotos)));

        appendContactDetailSection(body, row);

        if (isFranchiseOrPartner) {
            body.appendChild(el('div', 'supplier-detail-section-title', '加盟店资料'));
            body.appendChild(detailRow('门店面积（㎡）', row.storeArea, 'storeArea', row));
            body.appendChild(detailRow('门店楼层', row.storeFloors, 'storeFloors', row));
            body.appendChild(detailRow('店门口口述视频', mediaGrid(row.videoStorefrontIntro)));
            body.appendChild(detailRow('店内口述视频', mediaGrid(row.videoInteriorIntro)));
            body.appendChild(detailRow('门店方圆500米入住户数', row.householdsWithin500m));
            body.appendChild(detailRow('日均客单量', row.dailyOrderVolume));
            body.appendChild(detailRow('店内工作人员总数', row.staffCount));
            body.appendChild(detailRow('实际经营者对直播业务的理解', row.liveCommerceUnderstanding));
            body.appendChild(detailRow('门店日常运营服务理解与配合', row.dailyOpsCooperationNote));
            body.appendChild(detailRow('私域直播投入产出期望', row.privateLiveRoiExpectation));
            body.appendChild(detailRow('私域直播/社区团购熟悉程度', row.privateCommerceFamiliarity));
            body.appendChild(detailRow('周边小区及居住人群描述', row.surroundingCommunityNote));
            body.appendChild(detailRow('拉到1000人信心说明', row.confidenceReach1000));
            body.appendChild(detailRow('特殊情况说明', row.specialCircumstancesNote));
            body.appendChild(detailRow('特殊情况配图', mediaGrid(row.specialCircumstancesPhotos)));
        }

        if (isPeerStore) {
            body.appendChild(el('div', 'supplier-detail-section-title', '同行店补充资料'));
            body.appendChild(detailRow('已合作其他平台情况', row.otherPlatformsCooperation));
            body.appendChild(detailRow('近三天上播及销量截图', mediaGrid(row.broadcastSalesScreenshots)));
        }
    }

    function formatAuditNow() {
        var d = new Date();
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

    function currentRegNodeLabel(row) {
        if (isSupplierAuditRow(row)) return '财务审核';
        if (row.auditStatus === '待审核') return 'BD 审核';
        if (row.auditStatus === '待总监审核') return 'BD 总监终审';
        return row.auditStatus || '审核';
    }

    function currentRegReviewer(row) {
        if (isSupplierAuditRow(row)) return '财务总监 赵敏';
        if (row.auditStatus === '待总监审核') return 'BD总监 李静';
        if (row.bd && row.bd !== '—') return row.bd;
        return 'BD 王强';
    }

    function pushAuditLog(row, result, reason) {
        if (!row.auditLogs) row.auditLogs = [];
        row.auditLogs.push({
            node: currentRegNodeLabel(row),
            reviewer: currentRegReviewer(row),
            time: formatAuditNow(),
            result: result,
            reason: String(reason || '').trim()
        });
    }

    function appendAuditLogTable(parent, logs) {
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

    function appendOpinionBox(parent) {
        parent.appendChild(el('div', 'supplier-detail-section-title', '审核意见'));
        parent.appendChild(el('p', 'audit-reason-hint', '驳回原因必填，通过原因选填，最多100字'));
        var ta = textareaInput('驳回时必填；通过时选填，最多100字', '', 3);
        ta.maxLength = 100;
        ta.setAttribute('data-audit-opinion', '1');
        parent.appendChild(ta);
        return ta;
    }

    function readOpinion(root) {
        var ta = root && root.querySelector('[data-audit-opinion]');
        return ta ? String(ta.value || '').trim().slice(0, 100) : '';
    }

    function auditPartyName(row) {
        if (isSupplierAuditRow(row)) return row.subjectName || row.storeName || '';
        return row.storeName || row.subjectName || '';
    }

    /* 门店：总监终审通过后生成门店合作；供应商：财务审核通过后生成供应商合作。 */
    function attachGeneratedContract(row) {
        var api = window.LfContract;
        if (!api || !row || row.auditStatus !== '审核成功') return null;
        var isSup = isSupplierAuditRow(row);
        var task = api.generateCoopTask({
            scene: isSup ? 'supplier' : 'store',
            bizRef: 'audit:' + row.id,
            name: auditPartyName(row),
            partnerType: isSup ? '' : (displayPartnerDivision(row.partnerDivision) || '加盟店'),
            contact: [row.contact, row.phone].filter(Boolean).join(' '),
            phone: row.phone || '',
            address: row.address || '',
            initiator: isSup ? '供应商入驻审核' : '门店入驻审核',
            status: 'sign_progress'
        });
        if (!task) return null;
        row.contractTaskId = task.id;
        row.contractSignUrl = task.signUrl;
        row.contractName = task.agreementNames || task.name;
        return task;
    }

    function appendContractShare(body, row) {
        if (!row || row.auditStatus !== '审核成功') return;
        var task = attachGeneratedContract(row);
        if (!task || !window.LfContract) return;
        var live = window.LfContract.findTask(task.id) || task;
        var isSup = isSupplierAuditRow(row);
        var progress = window.LfContract.signProgressLabel
            ? window.LfContract.signProgressLabel(live)
            : (live.status === 'sign_completed' ? '已签署' : '待签署');
        body.appendChild(el('div', 'supplier-detail-section-title', isSup ? '供应商合作' : '门店合作'));
        body.appendChild(detailRow('签署协议', live.agreementNames || row.contractName || live.name));
        body.appendChild(detailRow('签署状态', progress));
        body.appendChild(detailRow('合同链接', live.signUrl || ''));
        var wrap = el('div', 'audit-contract-actions');
        wrap.style.margin = '8px 0 12px';
        var btn = mkBtn('复制合同链接', true);
        btn.addEventListener('click', function () {
            window.LfContract.copyText(live.signUrl).then(function () {
                showToast('合同链接已复制，可转发给' + (isSup ? '供应商' : '门店'), 'success');
            });
        });
        wrap.appendChild(btn);
        wrap.appendChild(el('p', 'audit-reason-hint', isSup
            ? '可将链接转发给供应商。每份协议单独确认签署，签完一份不会自动签上其他协议。'
            : '可将链接转发给门店，门店也可在门店 App 中一份份签署。'));
        body.appendChild(wrap);
    }

    function approveAudit(row, reason) {
        pushAuditLog(row, '通过', reason);
        /* 供应商：财务总监一道审核，待审核直接 → 审核成功 */
        if (isSupplierAuditRow(row)) {
            if (row.auditStatus === '待审核') {
                row.auditStatus = '审核成功';
                row.mdmStatus = '已生成主体与供应商档案';
                return attachGeneratedContract(row);
            }
            return null;
        }
        if (row.auditStatus === '待审核') {
            row.auditStatus = '待总监审核';
            row.mdmStatus = '未生成';
            return null;
        }
        if (row.auditStatus === '待总监审核') {
            row.auditStatus = '审核成功';
            row.mdmStatus = '已生成主体与门店档案';
            return attachGeneratedContract(row);
        }
        return null;
    }

    function rejectAudit(row, reason) {
        pushAuditLog(row, '驳回', reason);
        row.rejectReason = String(reason || '').trim();
        row.auditStatus = '审核失败';
        row.mdmStatus = '未生成';
    }

    function submitEditedAudit(row) {
        /* 供应商驳回后重提：回到待财务审核；门店仍进总监环节 */
        row.auditStatus = isSupplierAuditRow(row) ? '待审核' : '待总监审核';
        row.mdmStatus = '未生成';
    }

    function bizDisplay(value) {
        var api = window.StoreBizStructure;
        var text = api ? api.formatBiz(value) : '';
        return text || '—';
    }

    function appendStoreBizDetail(body, row) {
        body.appendChild(detailRow('事业线', row.bizLine || '—', 'bizLine', row));
        body.appendChild(detailRow('品牌名称', row.brandName || '—', 'brandName', row));
        body.appendChild(detailRow('业务线', bizDisplay(row.bizLines), 'bizLines', row));
    }

    function appendStoreBizEdit(body, row) {
        var api = window.StoreBizStructure;
        if (!api) return;
        var lineSel = selectInput(
            [{ value: '', label: '请选择事业线' }].concat(
                api.lines().map(function (n) {
                    return { value: n, label: n };
                })
            ),
            row.bizLine || ''
        );
        var brandSel = selectInput([{ value: '', label: '请先选择事业线' }], '');
        var checks = el('div', 'store-form__checks');
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.setAttribute('data-audit-field', 'bizLines');
        var tip = el('div', 'store-form__field-tip');
        var wrap = document.createElement('div');
        wrap.appendChild(checks);
        wrap.appendChild(hidden);
        wrap.appendChild(tip);

        function selectedBiz() {
            return Array.prototype.map.call(checks.querySelectorAll('input:checked'), function (node) {
                return node.value;
            });
        }
        function syncHidden() {
            hidden.value = api.formatBiz(selectedBiz());
        }
        function paintBiz(keep) {
            var opts = api.bizLines(lineSel.value, brandSel.value);
            var keepSet = keep || [];
            checks.innerHTML = '';
            opts.forEach(function (name) {
                var lab = el('label', 'store-form__check');
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = name;
                if (keepSet.indexOf(name) >= 0) cb.checked = true;
                cb.addEventListener('change', syncHidden);
                lab.appendChild(cb);
                lab.appendChild(document.createTextNode(name));
                checks.appendChild(lab);
            });
            tip.textContent = opts.length
                ? '可多选。更换品牌后，不在该品牌下的业务线会取消勾选。'
                : lineSel.value
                  ? '请先选择品牌名称。业务线可多选。'
                  : '请先选择事业线和品牌名称。业务线可多选，选项随品牌变化。';
            syncHidden();
        }
        function paintBrands(keepBrand, keepBiz) {
            var list = api.brands(lineSel.value);
            brandSel.innerHTML = '';
            var ph = document.createElement('option');
            ph.value = '';
            ph.textContent = list.length ? '请选择品牌名称' : '请先选择事业线';
            brandSel.appendChild(ph);
            list.forEach(function (n) {
                var op = document.createElement('option');
                op.value = n;
                op.textContent = n;
                brandSel.appendChild(op);
            });
            brandSel.disabled = !list.length;
            brandSel.value = list.indexOf(keepBrand) >= 0 ? keepBrand : '';
            paintBiz(brandSel.value ? keepBiz : []);
        }
        lineSel.addEventListener('change', function () {
            paintBrands('', []);
        });
        brandSel.addEventListener('change', function () {
            paintBiz([]);
        });
        body.appendChild(editRow('事业线', lineSel, 'bizLine', row));
        body.appendChild(editRow('品牌名称', brandSel, 'brandName', row));
        var rowEl = el('div', 'audit-detail-row');
        var labelEl = el('span', 'audit-detail-row__label');
        if (isAuditFieldRequired('bizLines', row)) labelEl.appendChild(el('span', 'audit-req', '*'));
        labelEl.appendChild(document.createTextNode('业务线'));
        rowEl.appendChild(labelEl);
        var value = el('span', 'audit-detail-row__value');
        value.appendChild(wrap);
        rowEl.appendChild(value);
        body.appendChild(rowEl);
        paintBrands(row.brandName || '', api.normalizeBiz(row.bizLines));
    }

    function editRow(label, control, fieldKey, dataRow) {
        var rowEl = el('div', 'audit-detail-row');
        var labelEl = el('span', 'audit-detail-row__label');
        if (fieldKey && dataRow && isAuditFieldRequired(fieldKey, dataRow)) {
            labelEl.appendChild(el('span', 'audit-req', '*'));
        }
        labelEl.appendChild(document.createTextNode(label));
        rowEl.appendChild(labelEl);
        var value = el('span', 'audit-detail-row__value');
        if (fieldKey) control.setAttribute('data-audit-field', fieldKey);
        value.appendChild(control);
        rowEl.appendChild(value);
        return rowEl;
    }

    /** 与 appendRegistrationFields 同结构：可编辑项用表单控件，附件类与审核详情一致为只读预览。 */
    function appendEditableFields(body, row, opts) {
        opts = opts || {};
        var onPartnerChange = opts.onPartnerChange;
        if (isSupplierAuditRow(row)) {
            appendSupplierEditableFields(body, row);
            return;
        }

        var isFranchiseOrPartner = isFranchiseOrPartnerRow(row);
        var isPeerStore = row.partnerDivision === '同行店';

        body.appendChild(el('div', 'supplier-detail-section-title', '主体字段'));
        body.appendChild(editRow('主体名称', textInput('请输入主体名称', row.subjectName), 'subjectName', row));
        body.appendChild(editRow('绑定BD', textInput('请输入绑定BD', row.bd), 'bd', row));
        body.appendChild(detailRow('主体类型', row.subjectType || '门店'));

        body.appendChild(el('div', 'supplier-detail-section-title', '门店档案字段'));
        var storeNameInp = textInput('请输入门店名称', row.storeName);
        var shortNameInp = textInput('', row.storeName || row.shortName || '', { readOnly: true });
        storeNameInp.addEventListener('input', function () {
            shortNameInp.value = storeNameInp.value;
        });
        body.appendChild(editRow('门店名称', storeNameInp, 'storeName', row));
        body.appendChild(editRow('门店简称', shortNameInp, 'shortName', row));
        var partnerOpts = partnerDivisionSelectOptions(row.partnerDivision);
        var partnerSel = selectInput(partnerOpts.options, partnerOpts.value);
        partnerSel.setAttribute('data-audit-field', 'partnerDivision');
        body.appendChild(editRow('门店合作类型', partnerSel, 'partnerDivision', row));
        body.appendChild(editRow('门店类型', textInput('请输入门店类型', row.storeType), 'storeType', row));
        appendStoreBizEdit(body, row);
        body.appendChild(editRow('配送仓库', textInput('请输入配送仓库', row.warehouse), 'warehouse', row));
        body.appendChild(editRow('省市区', textInput('请输入省市区', row.region), 'region', row));
        body.appendChild(editRow('详细地址', textInput('请输入详细地址', row.address), 'address', row));
        body.appendChild(editRow('经纬度', textInput('例如 120.09,30.28', row.latlng), 'latlng', row));
        body.appendChild(detailRow('门头/场地照', mediaGrid(row.facadePhoto), 'facadePhoto', row));
        body.appendChild(
            editRow(
                '有无冷藏柜',
                selectInput(
                    [
                        { value: '有', label: '有' },
                        { value: '无', label: '无' }
                    ],
                    row.hasRefrigeratedCabinet
                ),
                'hasRefrigeratedCabinet',
                row
            )
        );
        body.appendChild(detailRow('冷藏柜照片', mediaGrid(row.refrigeratedPhotos)));
        body.appendChild(
            editRow(
                '有无冷冻柜',
                selectInput(
                    [
                        { value: '有', label: '有' },
                        { value: '无', label: '无' }
                    ],
                    row.hasFreezerCabinet
                ),
                'hasFreezerCabinet',
                row
            )
        );
        body.appendChild(detailRow('冷冻柜照片', mediaGrid(row.freezerPhotos)));

        appendContactEditSection(body, row);

        if (isFranchiseOrPartner) {
            body.appendChild(el('div', 'supplier-detail-section-title', '加盟店资料'));
            body.appendChild(editRow('门店面积（㎡）', textInput('', row.storeArea), 'storeArea', row));
            body.appendChild(editRow('门店楼层', textInput('', row.storeFloors), 'storeFloors', row));
            body.appendChild(detailRow('店门口口述视频', mediaGrid(row.videoStorefrontIntro)));
            body.appendChild(detailRow('店内口述视频', mediaGrid(row.videoInteriorIntro)));
            body.appendChild(
                editRow('门店方圆500米入住户数', textInput('', row.householdsWithin500m), 'householdsWithin500m', row)
            );
            body.appendChild(editRow('日均客单量', textInput('', row.dailyOrderVolume), 'dailyOrderVolume', row));
            body.appendChild(editRow('店内工作人员总数', textInput('', row.staffCount), 'staffCount', row));
            body.appendChild(
                editRow(
                    '实际经营者对直播业务的理解',
                    textareaInput('', row.liveCommerceUnderstanding, 3),
                    'liveCommerceUnderstanding',
                    row
                )
            );
            body.appendChild(
                editRow(
                    '门店日常运营服务理解与配合',
                    textareaInput('', row.dailyOpsCooperationNote, 3),
                    'dailyOpsCooperationNote',
                    row
                )
            );
            body.appendChild(
                editRow(
                    '私域直播投入产出期望',
                    textareaInput('', row.privateLiveRoiExpectation, 3),
                    'privateLiveRoiExpectation',
                    row
                )
            );
            body.appendChild(
                editRow(
                    '私域直播/社区团购熟悉程度',
                    textareaInput('', row.privateCommerceFamiliarity, 3),
                    'privateCommerceFamiliarity',
                    row
                )
            );
            body.appendChild(
                editRow(
                    '周边小区及居住人群描述',
                    textareaInput('', row.surroundingCommunityNote, 3),
                    'surroundingCommunityNote',
                    row
                )
            );
            body.appendChild(
                editRow('拉到1000人信心说明', textareaInput('', row.confidenceReach1000, 3), 'confidenceReach1000', row)
            );
            body.appendChild(
                editRow('特殊情况说明', textareaInput('', row.specialCircumstancesNote, 3), 'specialCircumstancesNote', row)
            );
            body.appendChild(detailRow('特殊情况配图', mediaGrid(row.specialCircumstancesPhotos)));
        }

        if (isPeerStore) {
            body.appendChild(el('div', 'supplier-detail-section-title', '同行店补充资料'));
            body.appendChild(
                editRow(
                    '已合作其他平台情况',
                    textareaInput('', row.otherPlatformsCooperation, 3),
                    'otherPlatformsCooperation',
                    row
                )
            );
            body.appendChild(detailRow('近三天上播及销量截图', mediaGrid(row.broadcastSalesScreenshots)));
        }

        if (typeof onPartnerChange === 'function') {
            partnerSel.addEventListener('change', function () {
                onPartnerChange(partnerSel);
            });
        }
    }

    var AUDIT_ROWS = [
        {
            id: 'WF-STORE-20260507001',
            source: 'PC 创建门店',
            subjectName: '冷丰演示门店',
            subjectType: '门店',
            storeName: '冷丰演示门店文一西路店',
            shortName: '冷丰-文一西路',
            bd: '王强',
            contact: '周敏',
            phone: '13800132201',
            verifyCode: '123456',
            auditStatus: '待审核',
            mdmStatus: '未生成',
            createdBy: '周经理',
            submittedAt: '2026-05-07 15:20',
            auditLogs: [],
            storeType: '社区生鲜店',
            bizLine: '餐饮',
            brandName: '冷丰锅贴',
            bizLines: ['拉新', '商城', '代采进货'],
            partnerDivision: '加盟店',
            warehouse: '华东 RDC-杭州',
            region: '浙江省 / 杭州市 / 西湖区',
            address: '文一西路 558 号 1 层临街',
            latlng: '120.0912,30.2866',
            facadePhoto: [{ type: 'image', name: '门头场地照-文一西路.jpg' }],
            hasRefrigeratedCabinet: '有',
            refrigeratedPhotos: [
                { type: 'image', name: '冷藏柜-1.jpg' },
                { type: 'image', name: '冷藏柜-2.jpg' }
            ],
            hasFreezerCabinet: '无',
            freezerPhotos: '—',
            storeArea: '120',
            storeFloors: '1F',
            videoStorefrontIntro: [{ type: 'video', name: '店门口口述视频.mp4' }],
            videoInteriorIntro: [{ type: 'video', name: '店内口述视频.mp4' }],
            householdsWithin500m: '约 1200 户',
            dailyOrderVolume: '工作日约 80 单',
            staffCount: '5',
            liveCommerceUnderstanding: '了解社区直播，可配合门店陈列与直播讲解。',
            dailyOpsCooperationNote: '可配合售后、配送交接与社群运营。',
            privateLiveRoiExpectation: '期望 2-3 个月形成稳定复购。',
            privateCommerceFamiliarity: '曾参与社区团购，熟悉基础操作。',
            surroundingCommunityNote: '周边成熟小区多，家庭客群占比高。',
            confidenceReach1000: '老板有多个社群资源，有信心达成。',
            specialCircumstancesNote: '无',
            specialCircumstancesPhotos: '—'
        },
        {
            id: 'WF-STORE-20260507002',
            source: 'PC 创建门店',
            subjectName: '五角场体验店',
            subjectType: '门店',
            storeName: '五角场体验店',
            shortName: '五角场体验',
            bd: '李四',
            contact: '孙丽',
            phone: '18812347765',
            verifyCode: '123456',
            auditStatus: '待总监审核',
            mdmStatus: '未生成',
            createdBy: '李四',
            submittedAt: '2026-05-07 14:58',
            auditLogs: [
                {
                    node: 'BD 审核',
                    reviewer: '李四',
                    time: '2026-05-07 15:10',
                    result: '通过',
                    reason: '门店资料齐全'
                }
            ],
            storeType: '团购自提点',
            bizLine: '康美',
            brandName: '汉言',
            bizLines: ['外卖运营', 'POS/到店'],
            partnerDivision: '联营店',
            warehouse: '沪东前置仓',
            region: '上海市 / 市辖区 / 杨浦区',
            address: '五角场商圈政通路 99 号',
            latlng: '121.5142,31.3028',
            facadePhoto: [{ type: 'image', name: '五角场门头照.jpg' }],
            hasRefrigeratedCabinet: '有',
            refrigeratedPhotos: [{ type: 'image', name: '冷藏柜照片.jpg' }],
            hasFreezerCabinet: '有',
            freezerPhotos: [{ type: 'image', name: '冷冻柜照片.jpg' }],
            storeArea: '156',
            storeFloors: '1F',
            videoStorefrontIntro: [{ type: 'video', name: '店前两分钟口述.mp4' }],
            videoInteriorIntro: [{ type: 'video', name: '店内一分钟口述.mp4' }],
            householdsWithin500m: '约 3000 户',
            dailyOrderVolume: '日均约 160 单',
            staffCount: '8',
            liveCommerceUnderstanding: '老板认可直播带货与社群复购模式。',
            dailyOpsCooperationNote: '具备固定店员，可承接日常运营。',
            privateLiveRoiExpectation: '可接受前期投入，关注复购增长。',
            privateCommerceFamiliarity: '熟悉私域社群，做过团购接龙。',
            surroundingCommunityNote: '周边办公与居民混合，午晚高峰明显。',
            confidenceReach1000: '已有老客群基础。',
            specialCircumstancesNote: '选址附近已有门店，提请审核同事确认。',
            specialCircumstancesPhotos: [
                { type: 'image', name: '选址情况说明-1.jpg' },
                { type: 'image', name: '选址情况说明-2.jpg' }
            ]
        },
        {
            id: 'WF-STORE-20260506001',
            source: 'PC 创建门店',
            subjectName: '滨江便民店',
            subjectType: '门店',
            storeName: '滨江便民店春晓路店',
            shortName: '滨江-春晓路',
            bd: '王强',
            contact: '刘芳',
            phone: '13912343308',
            verifyCode: '123456',
            auditStatus: '审核失败',
            mdmStatus: '未生成',
            createdBy: '王强',
            submittedAt: '2026-05-06 09:12',
            rejectReason: '需补充门头清晰照与视频',
            auditLogs: [
                {
                    node: 'BD 审核',
                    reviewer: '王强',
                    time: '2026-05-06 10:20',
                    result: '驳回',
                    reason: '需补充门头清晰照与视频'
                }
            ],
            storeType: '社区便利店',
            bizLine: '纯私域',
            brandName: '冷丰特选',
            bizLines: ['拉新', '留存', '私域直播-生鲜场'],
            partnerDivision: '加盟店',
            warehouse: '华东 RDC-杭州',
            region: '浙江省 / 杭州市 / 滨江区',
            address: '春晓路 198 号',
            latlng: '120.2120,30.2080',
            facadePhoto: [{ type: 'image', name: '滨江门头.jpg' }],
            hasRefrigeratedCabinet: '有',
            refrigeratedPhotos: [{ type: 'image', name: '滨江冷藏.jpg' }],
            hasFreezerCabinet: '无',
            freezerPhotos: '—',
            storeArea: '88',
            storeFloors: '1F',
            videoStorefrontIntro: [{ type: 'video', name: '滨江店门口.mp4' }],
            videoInteriorIntro: [{ type: 'video', name: '滨江店内.mp4' }],
            householdsWithin500m: '约 800 户',
            dailyOrderVolume: '约 50 单',
            staffCount: '3',
            liveCommerceUnderstanding: '愿意尝试直播，配合店内讲解。',
            dailyOpsCooperationNote: '可配合日常售后与交接。',
            privateLiveRoiExpectation: '先试运营再看投入产出。',
            privateCommerceFamiliarity: '对私域团购了解有限。',
            surroundingCommunityNote: '周边新建小区与沿街商铺混合。',
            confidenceReach1000: '需补充社群拉新方案。',
            specialCircumstancesNote: '需补充门头清晰照与视频。',
            specialCircumstancesPhotos: '—'
        },
        {
            id: 'WF-STORE-20260506008',
            source: 'PC 创建门店',
            subjectName: '张江快闪店',
            subjectType: '门店',
            storeName: '张江快闪店',
            shortName: '张江快闪',
            bd: '赵小九',
            contact: '陈晨',
            phone: '18612349001',
            verifyCode: '123456',
            auditStatus: '审核成功',
            mdmStatus: '已生成主体与门店档案',
            createdBy: '赵小九',
            submittedAt: '2026-05-06 18:36',
            auditLogs: [
                {
                    node: 'BD 审核',
                    reviewer: '赵小九',
                    time: '2026-05-06 16:40',
                    result: '通过',
                    reason: ''
                },
                {
                    node: 'BD 总监终审',
                    reviewer: 'BD总监 李静',
                    time: '2026-05-06 18:20',
                    result: '通过',
                    reason: '选址情况已人工确认'
                }
            ],
            storeType: '快闪零售',
            bizLine: '纯私域',
            brandName: '其他',
            bizLines: ['私域直播-百货场'],
            partnerDivision: '加盟店',
            warehouse: '沪东前置仓',
            region: '上海市 / 市辖区 / 浦东新区',
            address: '张江路 88 号',
            latlng: '121.6321,31.2047',
            facadePhoto: [{ type: 'image', name: '张江快闪门头照.jpg' }],
            hasRefrigeratedCabinet: '无',
            refrigeratedPhotos: '—',
            hasFreezerCabinet: '无',
            freezerPhotos: '—',
            otherPlatformsCooperation: '已合作美团优选和社区团购平台。',
            broadcastSalesScreenshots: [
                { type: 'image', name: '上播销量截图-第1天.jpg' },
                { type: 'image', name: '上播销量截图-第2天.jpg' },
                { type: 'image', name: '上播销量截图-第3天.jpg' }
            ]
        },
        {
            /* 供应商入驻：字段对齐「新增供应商商家」 */
            id: 'WF-SUP-20260508001',
            source: 'PC 创建供应商',
            subjectName: '小牛供应链',
            subjectType: '供应商',
            storeName: '小牛供应链',
            bd: '—',
            contact: '王敏',
            phone: '13800132210',
            auditStatus: '待审核',
            mdmStatus: '未生成',
            createdBy: '王敏',
            submittedAt: '2026-05-08 10:15',
            auditLogs: []
        },
        {
            id: 'WF-SUP-20260507010',
            source: 'PC 创建供应商',
            subjectName: '珠宝集采中心',
            subjectType: '供应商',
            storeName: '珠宝集采中心',
            bd: '—',
            contact: '钱多多',
            phone: '15912347788',
            auditStatus: '审核失败',
            mdmStatus: '未生成',
            createdBy: '钱多多',
            submittedAt: '2026-05-07 11:40',
            rejectReason: '结算信息不完整',
            auditLogs: [
                {
                    node: '财务审核',
                    reviewer: '财务总监 赵敏',
                    time: '2026-05-07 14:05',
                    result: '驳回',
                    reason: '结算信息不完整'
                }
            ]
        },
        {
            id: 'WF-SUP-20260506020',
            source: 'PC 创建供应商',
            subjectName: '华东辅料仓配',
            subjectType: '供应商',
            storeName: '华东辅料仓配',
            bd: '—',
            contact: '牛强',
            phone: '15912347788',
            auditStatus: '审核成功',
            mdmStatus: '已生成主体与供应商档案',
            createdBy: '牛强',
            submittedAt: '2026-05-06 16:08',
            auditLogs: [
                {
                    node: '财务审核',
                    reviewer: '财务总监 赵敏',
                    time: '2026-05-06 15:50',
                    result: '通过',
                    reason: '资料审核通过'
                }
            ]
        }
    ];

    function getRecordByTableRow(tr) {
        if (!tr) return null;
        var cells = tr.querySelectorAll('td');
        if (!cells.length) return null;
        var id = cells[0].textContent.trim();
        for (var i = 0; i < AUDIT_ROWS.length; i++) {
            if (AUDIT_ROWS[i].id === id) return AUDIT_ROWS[i];
        }
        return null;
    }

    function statusCellHtml(text) {
        var active = text === '审核成功' || text.indexOf('已生成') === 0;
        return (
            '<span class="status ' + (active ? 'active' : 'inactive') + '">' + escapeHtml(text) + '</span>'
        );
    }

    function renderActionHtml(rec) {
        var d =
            '<a href="#" class="mdm-audit-detail">详情</a>';
        if (rec.auditStatus === '待审核' || rec.auditStatus === '待总监审核') {
            return d + '　<a href="#" class="mdm-audit-review">审核</a>';
        }
        /* 供应商财务审核无编辑；门店审核失败可改资料重提 */
        if (rec.auditStatus === '审核失败' && !isSupplierAuditRow(rec)) {
            return d + '　<a href="#" class="mdm-audit-edit">编辑</a>';
        }
        return d;
    }

    function applyRowToDom(tr, rec) {
        var cells = tr.querySelectorAll('td');
        if (cells.length < 13) return;
        cells[1].textContent = rec.source || '';
        cells[2].textContent = rec.subjectName || '';
        cells[3].textContent = rec.subjectType || '门店';
        cells[4].textContent = rec.storeName || '';
        cells[5].textContent = rec.bd || '—';
        cells[6].textContent = rec.contact || '';
        cells[7].textContent = rec.phone || '';
        cells[8].innerHTML = statusCellHtml(rec.auditStatus);
        cells[9].innerHTML = statusCellHtml(rec.mdmStatus);
        cells[10].textContent = rec.createdBy || rec.creator || '—';
        cells[11].textContent = rec.submittedAt || '';
        cells[12].className = 'action-links';
        cells[12].innerHTML = renderActionHtml(rec);
    }

    function openAuditDetail(row) {
        closeAuditModals();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-audit-center-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '入驻审核详情'));
        var actions = el('div', 'erp-modal__header-actions');
        var close = el('button', 'erp-modal__header-btn');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.addEventListener('click', function () {
            backdrop.remove();
        });
        actions.appendChild(close);
        header.appendChild(actions);

        var body = el('div', 'erp-modal__body');
        appendRegistrationFields(body, row);
        body.appendChild(el('div', 'supplier-detail-section-title', '状态信息'));
        body.appendChild(detailRow('审核状态', row.auditStatus));
        body.appendChild(detailRow('MDM状态', row.mdmStatus));
        appendContractShare(body, row);
        appendAuditLogTable(body, row.auditLogs);

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

    function readEditableFromBody(body) {
        var out = {};
        body.querySelectorAll('[data-audit-field]').forEach(function (inp) {
            var k = inp.getAttribute('data-audit-field');
            if (k) out[k] = inp.value;
        });
        return out;
    }

    function applyEditableToRow(row, patch) {
        if (!patch || typeof patch !== 'object') return;
        Object.keys(patch).forEach(function (k) {
            row[k] = patch[k];
        });
        /* 供应商商家无独立入驻方名称：列表「入驻方名称」与主体名称同步 */
        if (isSupplierAuditRow(row) && patch.subjectName != null) {
            row.storeName = String(patch.subjectName).trim();
        }
        if (!isSupplierAuditRow(row) && patch.storeName != null) {
            row.shortName = String(patch.storeName).trim();
            if (window.MdmStoreSiteSlot) {
                window.MdmStoreSiteSlot.syncFromStore({
                    storeCode: row.id || '',
                    storeName: row.storeName,
                    source: 'audit'
                });
            }
        }
    }

    function openAuditReview(row, pm, startInEdit) {
        closeAuditModals();
        var backdrop = el('div', 'erp-modal-backdrop');
        backdrop.setAttribute('data-audit-center-modal', '1');
        var modal = el('div', 'erp-modal erp-modal--store-wide');
        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', '审核入驻申请'));
        var actions = el('div', 'erp-modal__header-actions');
        var close = el('button', 'erp-modal__header-btn');
        close.type = 'button';
        close.innerHTML = '&times;';
        close.addEventListener('click', function () {
            backdrop.remove();
        });
        actions.appendChild(close);
        header.appendChild(actions);

        var body = el('div', 'erp-modal__body');
        var footer = el('div', 'erp-modal__footer');

        function findTr() {
            var tbody = document.getElementById((pm && pm.config && pm.config.tableBodyId) || 'tableBody');
            if (!tbody) return null;
            var trs = tbody.querySelectorAll('tr');
            for (var i = 0; i < trs.length; i++) {
                if (trs[i].querySelectorAll('td')[0] && trs[i].querySelectorAll('td')[0].textContent.trim() === row.id)
                    return trs[i];
            }
            return null;
        }

        function onDone() {
            var tr = findTr();
            if (tr) applyRowToDom(tr, row);
            if (pm && typeof pm.refreshPagination === 'function') pm.refreshPagination();
        }

        function renderReview() {
            body.innerHTML = '';
            footer.innerHTML = '';
            var isSup = isSupplierAuditRow(row);
            var phaseLabel;
            if (isSup) {
                phaseLabel =
                    row.auditStatus === '待审核'
                        ? '财务审核（财务总监）'
                        : row.auditStatus === '审核失败'
                          ? '审核失败'
                          : row.auditStatus === '审核成功'
                            ? '财务审核已通过'
                            : '—';
            } else {
                phaseLabel =
                    row.auditStatus === '待审核'
                        ? 'BD 审核'
                        : row.auditStatus === '待总监审核'
                          ? 'BD 总监终审'
                          : row.auditStatus === '审核失败'
                            ? '审核失败（待修改资料）'
                            : '—';
            }
            body.appendChild(detailRow('当前环节', phaseLabel));
            body.appendChild(detailRow('审核状态', row.auditStatus));
            appendRegistrationFields(body, row);
            appendAuditLogTable(body, row.auditLogs);
            if (row.auditStatus === '待审核' || row.auditStatus === '待总监审核') {
                appendOpinionBox(body);
            }

            var cancel = mkBtn('取消', false);
            cancel.addEventListener('click', function () {
                backdrop.remove();
            });
            footer.appendChild(cancel);

            if (row.auditStatus === '待审核') {
                if (!isSup) {
                    var edit = mkBtn('编辑', false);
                    edit.addEventListener('click', renderEdit);
                    footer.appendChild(edit);
                }
                var reject = mkBtn('驳回', false);
                reject.addEventListener('click', function () {
                    var reason = readOpinion(body);
                    if (!reason) {
                        showToast('请填写驳回原因', 'error');
                        return;
                    }
                    rejectAudit(row, reason);
                    backdrop.remove();
                    onDone();
                    showToast(isSup ? '财务已驳回申请（演示）' : '已驳回申请（演示）', 'info');
                });
                var approve = mkBtn('审核通过', true);
                approve.addEventListener('click', function () {
                    var task = approveAudit(row, readOpinion(body));
                    backdrop.remove();
                    onDone();
                    if (task && task.signUrl && window.LfContract) {
                        window.LfContract.copyText(task.signUrl);
                        showToast((isSup ? '供应商合作' : '门店合作') + '合同已生成，签署链接已复制', 'success');
                    } else {
                        showToast(isSup ? '财务审核通过，已生成供应商商家（演示）' : '审核已处理（演示）', 'success');
                    }
                });
                footer.appendChild(reject);
                footer.appendChild(approve);
            } else if (!isSup && row.auditStatus === '待总监审核') {
                var reject2 = mkBtn('驳回', false);
                reject2.addEventListener('click', function () {
                    var reason = readOpinion(body);
                    if (!reason) {
                        showToast('请填写驳回原因', 'error');
                        return;
                    }
                    rejectAudit(row, reason);
                    backdrop.remove();
                    onDone();
                    showToast('已驳回申请（演示）', 'info');
                });
                var approve2 = mkBtn('审核通过', true);
                approve2.addEventListener('click', function () {
                    var task = approveAudit(row, readOpinion(body));
                    backdrop.remove();
                    onDone();
                    if (task && task.signUrl && window.LfContract) {
                        window.LfContract.copyText(task.signUrl);
                        showToast('门店合作合同已生成，签署链接已复制', 'success');
                    } else {
                        showToast('审核已处理（演示）', 'success');
                    }
                });
                footer.appendChild(reject2);
                footer.appendChild(approve2);
            } else if (!isSup && row.auditStatus === '审核失败') {
                var editFail = mkBtn('编辑资料', false);
                editFail.addEventListener('click', renderEdit);
                footer.appendChild(editFail);
            }
        }

        function renderEdit() {
            body.innerHTML = '';
            footer.innerHTML = '';
            body.appendChild(detailRow('当前状态', '编辑资料'));

            function partnerChangeHandler(partnerSel) {
                var patch = readEditableFromBody(body);
                applyEditableToRow(row, patch);
                row.partnerDivision = partnerSel.value;
                while (body.children.length > 1) {
                    body.removeChild(body.lastElementChild);
                }
                appendEditableFields(body, row, { onPartnerChange: partnerChangeHandler });
            }

            appendEditableFields(body, row, { onPartnerChange: partnerChangeHandler });

            var cancel = mkBtn('取消', false);
            cancel.addEventListener('click', function () {
                if (startInEdit && row.auditStatus === '审核失败') backdrop.remove();
                else renderReview();
            });
            var save = mkBtn('保存资料', false);
            save.addEventListener('click', function () {
                var vals = readEditableFromBody(body);
                if (!validateAuditEdit(vals, row)) return;
                applyEditableToRow(row, vals);
                onDone();
                if (startInEdit && row.auditStatus === '审核失败') {
                    backdrop.remove();
                } else renderReview();
            });
            var submit = mkBtn('保存并提交', true);
            submit.addEventListener('click', function () {
                var vals = readEditableFromBody(body);
                if (!validateAuditEdit(vals, row)) return;
                applyEditableToRow(row, vals);
                submitEditedAudit(row);
                backdrop.remove();
                onDone();
                showToast('资料已保存并提交（演示）', 'success');
            });
            footer.appendChild(cancel);
            footer.appendChild(save);
            footer.appendChild(submit);
        }

        /* 供应商财务审核无编辑态 */
        if (startInEdit && !isSupplierAuditRow(row)) renderEdit();
        else renderReview();

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    window.MdmAuditStoreUi = {
        openDetail: function (tr) {
            var rec = getRecordByTableRow(tr);
            if (!rec) {
                showToast('未找到该申请单详情数据', 'error');
                return;
            }
            openAuditDetail(rec);
        },
        openReview: function (tr, pm, startInEdit) {
            var rec = getRecordByTableRow(tr);
            if (!rec) {
                showToast('未找到该申请单', 'error');
                return;
            }
            openAuditReview(rec, pm, startInEdit);
        }
    };
})();
