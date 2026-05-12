/**
 * 统一进件（门店 / 供应商 / 直播间 / 承运商）— 由 vendor unified-onboarding-ui.js 迁入
 */
(function () {
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function textInput(placeholder, value) {
        var inp = document.createElement('input');
        inp.className = 'erp-input';
        inp.type = 'text';
        inp.placeholder = placeholder || '';
        if (value != null && value !== '') inp.value = value;
        return inp;
    }

    function selectInput(options, value) {
        var sel = document.createElement('select');
        sel.className = 'erp-select';
        options.forEach(function (o) {
            var opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = o.label;
            sel.appendChild(opt);
        });
        if (value != null && value !== '') sel.value = String(value);
        return sel;
    }

    function mkBtn(label, primary, outlinePrimary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'erp-btn' + (primary ? ' erp-btn--primary' : '');
        if (outlinePrimary) b.classList.add('erp-btn--outline-primary');
        b.textContent = label;
        return b;
    }

    function sfLabel(text, required) {
        var lab = el('label', 'store-form__label');
        if (required) {
            var star = el('span', 'store-form__req', '*');
            lab.appendChild(star);
        }
        lab.appendChild(document.createTextNode(text));
        return lab;
    }

    function sectionTitle(text) {
        return el('div', 'unified-onboard-section-title', text);
    }

    function ogRow(parent, label, req, node) {
        var r = el('div', 'store-form__row');
        r.appendChild(sfLabel(label, req));
        var c = el('div', 'store-form__control');
        c.appendChild(node);
        r.appendChild(c);
        parent.appendChild(r);
    }

    function uploadClickBox(caption, prefilledHint) {
        var wrap = el('div', '');
        var box = el('div', 'store-upload-box onboard-upload--click', '点击上传');
        wrap.appendChild(box);
        if (caption) wrap.appendChild(el('div', 'store-upload-box__cap', caption));
        if (prefilledHint)
            wrap.appendChild(el('div', 'store-form__upload-hint', prefilledHint));
        return wrap;
    }

    function enterpriseTypeSelect() {
        return selectInput(
            [
                { value: '', label: '请选择经营类型' },
                { value: 'mall', label: '商场及企业' },
                { value: 'food', label: '餐饮' },
                { value: 'retail', label: '零售' },
                { value: 'other', label: '其他' }
            ],
            ''
        );
    }

    function scenarioTypeSelect() {
        return selectInput(
            [
                { value: '', label: '请选择场景类型' },
                { value: 'offline', label: '线下实体' },
                { value: 'wx', label: '公众号/小程序' },
                { value: 'app', label: 'APP' },
                { value: 'pc', label: 'PC网站' }
            ],
            ''
        );
    }

    function clearNode(n) {
        while (n && n.firstChild) n.removeChild(n.firstChild);
    }

    function removeUnifiedOnboardingModals() {
        document.querySelectorAll('[data-unified-onboarding]').forEach(function (x) {
            x.remove();
        });
    }

    var ONBOARDING_RECORDS_KEY = 'mdm_unified_onboarding_records_v1';

    function readOnboardingRecords() {
        try {
            var raw = localStorage.getItem(ONBOARDING_RECORDS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeOnboardingRecords(map) {
        try {
            localStorage.setItem(ONBOARDING_RECORDS_KEY, JSON.stringify(map || {}));
        } catch (e) {}
    }

    function copyObj(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    function makeRecordKey(opts) {
        if (opts && opts.recordKey) return String(opts.recordKey);
        var variant = (opts && opts.variant) || 'resource';
        var title = (opts && opts.title) || '进件';
        var shortName = (opts && opts.merchantShortNameDefault) || '';
        return [variant, title, shortName].join('::');
    }

    function readRecord(recordKey) {
        var all = readOnboardingRecords();
        var one = all[recordKey];
        return one ? copyObj(one) : null;
    }

    function saveRecord(recordKey, data) {
        var all = readOnboardingRecords();
        all[recordKey] = copyObj(data);
        writeOnboardingRecords(all);
    }

    function removeRecord(recordKey) {
        var all = readOnboardingRecords();
        delete all[recordKey];
        writeOnboardingRecords(all);
    }

    function buildDefaultFields(opts, existingRecord) {
        var defaults = copyObj((opts && opts.fieldDefaults) || {});
        var existing = existingRecord && existingRecord.fields ? existingRecord.fields : {};
        var cardDef = defaults.card_info || {};
        var cardExisting = existing.card_info || {};
        var licenseDef = defaults.license_info || {};
        var licenseExisting = existing.license_info || {};
        var legalDef = defaults.legal_info || {};
        var legalExisting = existing.legal_info || {};
        function uploadDefault(key) {
            if (typeof existing[key] === 'boolean' || typeof existing[key] === 'string')
                return existing[key];
            return !!defaults[key];
        }
        return {
            short_name: String(
                existing.short_name ||
                    defaults.short_name ||
                    (opts && opts.merchantShortNameDefault) ||
                    ''
            ).trim(),
            receipt_name: String(
                existing.receipt_name ||
                    defaults.receipt_name ||
                    defaults.short_name ||
                    (opts && opts.merchantShortNameDefault) ||
                    ''
            ).trim(),
            detail_addr: String(existing.detail_addr || defaults.detail_addr || '').trim(),
            legal_mobile_no: String(existing.legal_mobile_no || defaults.legal_mobile_no || '').trim(),
            contact_mobile_no: String(
                existing.contact_mobile_no || defaults.contact_mobile_no || ''
            ).trim(),
            contact_email: String(existing.contact_email || defaults.contact_email || '').trim(),
            card_info: {
                account_name: String(
                    cardExisting.account_name || cardDef.account_name || ''
                ).trim(),
                card_no: String(cardExisting.card_no || cardDef.card_no || '').trim(),
                bank_name: String(cardExisting.bank_name || cardDef.bank_name || '').trim(),
                bank_branch: String(
                    cardExisting.bank_branch || cardDef.bank_branch || ''
                ).trim()
            },
            license_info: {
                name: String(licenseExisting.name || licenseDef.name || '').trim(),
                code: String(licenseExisting.code || licenseDef.code || '').trim(),
                start_date: String(licenseExisting.start_date || licenseDef.start_date || '').trim(),
                valid_date: String(licenseExisting.valid_date || licenseDef.valid_date || '').trim(),
                address: String(licenseExisting.address || licenseDef.address || '').trim()
            },
            legal_info: {
                cert_type: String(legalExisting.cert_type || legalDef.cert_type || '身份证').trim(),
                legal_name: String(legalExisting.legal_name || legalDef.legal_name || '').trim(),
                id_no: String(legalExisting.id_no || legalDef.id_no || '').trim(),
                id_start_date: String(legalExisting.id_start_date || legalDef.id_start_date || '').trim(),
                id_valid_date: String(legalExisting.id_valid_date || legalDef.id_valid_date || '').trim()
            },
            license_pic: uploadDefault('license_pic'),
            legal_cert_front_pic: uploadDefault('legal_cert_front_pic'),
            legal_cert_back_pic: uploadDefault('legal_cert_back_pic'),
            open_license_pic: uploadDefault('open_license_pic'),
            store_header_pic: uploadDefault('store_header_pic'),
            store_indoor_pic: uploadDefault('store_indoor_pic'),
            store_cashier_desk_pic: uploadDefault('store_cashier_desk_pic')
        };
    }

    /**
     * @param {{
     *   title: string,
     *   merchantShortNameDefault?: string,
     *   variant?: string,
     *   fieldDefaults?: Record<string, any>
     * }} opts
     */
    function openUnifiedOnboardingModal(opts) {
        opts = opts || {};
        removeUnifiedOnboardingModals();
        var recordKey = makeRecordKey(opts || {});
        var existingRecord = readRecord(recordKey);
        var formFields = buildDefaultFields(opts || {}, existingRecord);

        var variant = opts.variant || 'store';
        var backdrop = el(
            'div',
            variant === 'resource' ? 'store-archive-modal-backdrop' : 'store-archive-modal-backdrop'
        );
        backdrop.setAttribute('data-unified-onboarding', '1');
        if (variant === 'store') backdrop.setAttribute('data-store-archive-ui', '1');
        else backdrop.setAttribute('data-resource-archive-ui', '1');

        var modal = el('div', 'erp-modal erp-modal--onboarding');
        var fullscreen = false;

        var header = el('div', 'erp-modal__header');
        header.appendChild(el('h2', 'erp-modal__title', opts.title || '进件'));
        var ha = el('div', 'erp-modal__header-actions');
        var bf = el('button', 'erp-modal__header-btn');
        bf.type = 'button';
        bf.innerHTML = '&#9723;';
        bf.title = '全屏';
        bf.addEventListener('click', function () {
            fullscreen = !fullscreen;
            modal.classList.toggle('erp-modal--fullscreen', fullscreen);
            bf.title = fullscreen ? '退出全屏' : '全屏';
        });
        var bx = el('button', 'erp-modal__header-btn');
        bx.type = 'button';
        bx.innerHTML = '&times;';
        bx.addEventListener('click', function () {
            backdrop.remove();
        });
        ha.appendChild(bf);
        ha.appendChild(bx);
        header.appendChild(ha);

        var body = el('div', 'erp-modal__body');
        var inputMap = {};
        var uploadState = {
            license_pic: !!formFields.license_pic,
            legal_cert_front_pic: !!formFields.legal_cert_front_pic,
            legal_cert_back_pic: !!formFields.legal_cert_back_pic,
            open_license_pic: !!formFields.open_license_pic,
            store_header_pic: !!formFields.store_header_pic,
            store_indoor_pic: !!formFields.store_indoor_pic,
            store_cashier_desk_pic: !!formFields.store_cashier_desk_pic
        };
        var editMode = opts.forceView ? false : !(existingRecord && existingRecord.status === 'submitted');
        var recordStatus = existingRecord ? existingRecord.status : '';
        var uploadRenders = [];

        function inputRow(parent, label, key, placeholder, val) {
            var inp = textInput(placeholder, val);
            inp.setAttribute('data-onboard-key', key);
            inp.disabled = !editMode;
            inputMap[key] = inp;
            ogRow(parent, label, true, inp);
        }

        function ocrDemoValue(key) {
            var demo = {
                'license_info.name': '云南立扬后勤管理服务有限公司',
                'license_info.code': '91530602MADJAY451L',
                'license_info.start_date': '2024-05-13',
                'license_info.valid_date': '长期有效',
                'license_info.address': '云南省昭通市昭阳区太平街道办事处昭通大道',
                'legal_info.legal_name': '陈大华',
                'legal_info.id_no': '532101199003145212',
                'legal_info.id_start_date': '2022-03-07',
                'legal_info.id_valid_date': '2042-03-07',
                'card_info.account_name': '云南立扬后勤管理服务有限公司',
                'card_info.card_no': '53050163613700000992',
                'card_info.bank_name': '中国建设银行',
                'card_info.bank_branch': '中国建设银行股份有限公司昭通珠泉支行'
            };
            return demo[key] || '';
        }

        function seedOcrFields(fields) {
            (fields || []).forEach(function (f) {
                var inp = inputMap[f.key];
                if (inp && !inp.value.trim()) inp.value = f.value || ocrDemoValue(f.key);
            });
        }

        function uploadRow(parent, label, key, caption, ocrFields, opts) {
            opts = opts || {};
            var row = el('div', 'store-form__row');
            if (ocrFields && ocrFields.length) row.classList.add('store-form__row--ocr');
            row.appendChild(sfLabel(label, true));
            var ctrl = el('div', 'store-form__control');
            var seeded = uploadState[key] ? caption : '';

            function markUploaded() {
                if (!editMode) return;
                uploadState[key] = true;
                if (!seeded) seeded = '本地上传文件';
                seedOcrFields(ocrFields);
                showToast('已选择文件（演示）', 'success');
                render();
            }

            function appendOcrFields(parentNode) {
                if (!ocrFields || !ocrFields.length) return;
                var grid = el('div', 'unified-onboard-ocr-grid');
                if (opts.ocrColumns) grid.style.gridTemplateColumns = opts.ocrColumns;
                ocrFields.forEach(function (f) {
                    var wrap = el('div', 'unified-onboard-ocr-field');
                    wrap.appendChild(sfLabel(f.label, true));
                    var val =
                        inputMap[f.key] && inputMap[f.key].value ?
                            inputMap[f.key].value :
                            f.value || (uploadState[key] ? ocrDemoValue(f.key) : '');
                    var inp = textInput(f.placeholder || f.label, val);
                    inp.setAttribute('data-onboard-key', f.key);
                    inp.disabled = !editMode;
                    inputMap[f.key] = inp;
                    wrap.appendChild(inp);
                    grid.appendChild(wrap);
                });
                parentNode.appendChild(grid);
            }

            function render() {
                clearNode(ctrl);
                if (!uploadState[key]) {
                    if (editMode) {
                        var wrap = uploadClickBox(caption);
                        wrap.addEventListener('click', markUploaded);
                        if (ocrFields && ocrFields.length) {
                            var emptyCombo = el('div', 'unified-onboard-ocr-wrap');
                            if (opts.mediaWidth) emptyCombo.style.gridTemplateColumns = opts.mediaWidth + ' minmax(0, 1fr)';
                            var emptyMedia = el('div', 'unified-onboard-ocr-media');
                            emptyMedia.appendChild(wrap);
                            emptyCombo.appendChild(emptyMedia);
                            appendOcrFields(emptyCombo);
                            ctrl.appendChild(emptyCombo);
                        } else {
                            ctrl.appendChild(wrap);
                        }
                    } else {
                        if (ocrFields && ocrFields.length) {
                            var viewCombo = el('div', 'unified-onboard-ocr-wrap');
                            if (opts.mediaWidth) viewCombo.style.gridTemplateColumns = opts.mediaWidth + ' minmax(0, 1fr)';
                            var viewMedia = el('div', 'unified-onboard-ocr-media');
                            viewMedia.appendChild(el('div', 'store-form__upload-hint', '未上传'));
                            viewCombo.appendChild(viewMedia);
                            appendOcrFields(viewCombo);
                            ctrl.appendChild(viewCombo);
                        } else {
                            ctrl.appendChild(el('div', 'store-form__upload-hint', '未上传'));
                        }
                    }
                    return;
                }

                var preview = el('div', 'store-upload-box');
                preview.style.width = '100%';
                preview.style.minHeight = '110px';
                preview.style.display = 'flex';
                preview.style.alignItems = 'center';
                preview.style.justifyContent = 'center';
                preview.style.background = '#f8fafc';
                preview.style.color = '#666';
                preview.style.fontSize = '12px';
                preview.textContent = seeded || caption || '已上传';
                if (ocrFields && ocrFields.length) {
                    var combo = el('div', 'unified-onboard-ocr-wrap');
                    if (opts.mediaWidth) combo.style.gridTemplateColumns = opts.mediaWidth + ' minmax(0, 1fr)';
                    var media = el('div', 'unified-onboard-ocr-media');
                    media.appendChild(preview);
                    combo.appendChild(media);
                    appendOcrFields(combo);
                    ctrl.appendChild(combo);
                } else {
                    ctrl.appendChild(preview);
                }

                var actions = el('div', 'store-form__upload-hint');
                actions.style.marginTop = '8px';
                actions.appendChild(el('span', '', '已上传'));
                if (editMode) {
                    actions.appendChild(document.createTextNode('  '));
                    var rep = el('a', '', '更换');
                    rep.href = '#';
                    rep.addEventListener('click', function (ev) {
                        ev.preventDefault();
                        markUploaded();
                    });
                    actions.appendChild(rep);
                }
                ctrl.appendChild(actions);
            }

            render();
            uploadRenders.push(render);
            row.appendChild(ctrl);
            parent.appendChild(row);
        }

        function idCardUploadRow(parent) {
            var row = el('div', 'store-form__row store-form__row--ocr');
            row.appendChild(sfLabel('身份证上传', true));
            var ctrl = el('div', 'store-form__control');
            var ocrFields = [
                { label: '法人姓名', key: 'legal_info.legal_name', value: formFields.legal_info.legal_name },
                { label: '身份证号', key: 'legal_info.id_no', value: formFields.legal_info.id_no },
                { label: '身份证起始日期', key: 'legal_info.id_start_date', value: formFields.legal_info.id_start_date },
                { label: '身份证有效期', key: 'legal_info.id_valid_date', value: formFields.legal_info.id_valid_date }
            ];
            var uploadKeys = [
                { key: 'legal_cert_front_pic', caption: '上传身份证人像面' },
                { key: 'legal_cert_back_pic', caption: '上传身份证国徽面' }
            ];

            function markUploaded(key) {
                if (!editMode) return;
                uploadState[key] = true;
                seedOcrFields(ocrFields);
                showToast('已选择文件（演示）', 'success');
                render();
            }

            function renderUploadBox(item) {
                var box;
                if (!uploadState[item.key]) {
                    if (!editMode) return el('div', 'store-form__upload-hint', '未上传');
                    box = uploadClickBox(item.caption);
                    box.addEventListener('click', function () {
                        markUploaded(item.key);
                    });
                    return box;
                }
                box = el('div', 'store-upload-box');
                box.style.width = '100%';
                box.style.minHeight = '110px';
                box.style.display = 'flex';
                box.style.alignItems = 'center';
                box.style.justifyContent = 'center';
                box.style.background = '#f8fafc';
                box.style.color = '#666';
                box.style.fontSize = '12px';
                box.textContent = item.caption;
                if (editMode) {
                    box.style.cursor = 'pointer';
                    box.addEventListener('click', function () {
                        markUploaded(item.key);
                    });
                }
                return box;
            }

            function render() {
                clearNode(ctrl);
                var combo = el('div', 'unified-onboard-ocr-wrap unified-onboard-ocr-wrap--idcard');
                var media = el('div', 'unified-onboard-ocr-media unified-onboard-ocr-media--idcard');
                uploadKeys.forEach(function (item) {
                    media.appendChild(renderUploadBox(item));
                });
                combo.appendChild(media);
                var grid = el('div', 'unified-onboard-ocr-grid');
                grid.style.gridTemplateColumns = '1fr';
                ocrFields.forEach(function (f) {
                    var wrap = el('div', 'unified-onboard-ocr-field');
                    wrap.appendChild(sfLabel(f.label, true));
                    var val =
                        inputMap[f.key] && inputMap[f.key].value ?
                            inputMap[f.key].value :
                            f.value || ((uploadState.legal_cert_front_pic || uploadState.legal_cert_back_pic) ? ocrDemoValue(f.key) : '');
                    var inp = textInput(f.label, val);
                    inp.setAttribute('data-onboard-key', f.key);
                    inp.disabled = !editMode;
                    inputMap[f.key] = inp;
                    wrap.appendChild(inp);
                    grid.appendChild(wrap);
                });
                combo.appendChild(grid);
                ctrl.appendChild(combo);
            }

            render();
            uploadRenders.push(render);
            row.appendChild(ctrl);
            parent.appendChild(row);
        }

        var s0 = el('section', 'store-onboard-section store-onboard-section--white');
        s0.appendChild(sectionTitle('执照信息'));
        uploadRow(s0, '营业执照', 'license_pic', 'F07', [
            { label: '营业执照名称', key: 'license_info.name', value: formFields.license_info.name },
            { label: '证件代码', key: 'license_info.code', value: formFields.license_info.code },
            { label: '执照起始日期', key: 'license_info.start_date', value: formFields.license_info.start_date },
            { label: '执照有效期', key: 'license_info.valid_date', value: formFields.license_info.valid_date },
            { label: '注册地址', key: 'license_info.address', value: formFields.license_info.address }
        ], { mediaWidth: '260px', ocrColumns: '1fr' });
        idCardUploadRow(s0);
        body.appendChild(s0);

        var s1 = el('section', 'store-onboard-section');
        s1.appendChild(sectionTitle('商户信息'));
        var gMer = el('div', 'unified-onboard-grid');
        s1.appendChild(gMer);
        inputRow(
            gMer,
            '商户简称',
            'short_name',
            '账单展示名称',
            formFields.short_name
        );
        inputRow(
            gMer,
            '小票名称',
            'receipt_name',
            '小票展示名称',
            formFields.receipt_name
        );
        inputRow(
            gMer,
            '实际经营地址',
            'detail_addr',
            '经营详细地址',
            formFields.detail_addr
        );
        inputRow(gMer, '法人手机号', 'legal_mobile_no', '法人联系方式', formFields.legal_mobile_no);
        inputRow(
            gMer,
            '管理员手机号',
            'contact_mobile_no',
            '登录/通知手机号',
            formFields.contact_mobile_no
        );
        inputRow(
            gMer,
            '管理员邮箱',
            'contact_email',
            '汇付通知邮箱',
            formFields.contact_email
        );
        body.appendChild(s1);

        var s2 = el('section', 'store-onboard-section store-onboard-section--white');
        s2.appendChild(sectionTitle('结算信息'));
        uploadRow(s2, '开户许可证', 'open_license_pic', '开户许可证', [
            { label: '开户名', key: 'card_info.account_name', value: formFields.card_info.account_name },
            { label: '银行卡号', key: 'card_info.card_no', value: formFields.card_info.card_no },
            { label: '开户银行', key: 'card_info.bank_name', value: formFields.card_info.bank_name },
            { label: '开户支行', key: 'card_info.bank_branch', value: formFields.card_info.bank_branch }
        ], { mediaWidth: '260px', ocrColumns: '1fr' });
        body.appendChild(s2);

        var s4 = el('section', 'store-onboard-section');
        s4.appendChild(sectionTitle('门店场地'));
        uploadRow(s4, '门头/场地照', 'store_header_pic', 'F22');
        uploadRow(s4, '内景/工作区域照', 'store_indoor_pic', 'F24');
        uploadRow(s4, '收银台/前台照', 'store_cashier_desk_pic', 'F105');
        body.appendChild(s4);

        function getInputVal(key) {
            var inp = inputMap[key];
            return inp ? inp.value.trim() : '';
        }

        function collectFields() {
            return {
                short_name: getInputVal('short_name'),
                receipt_name: getInputVal('receipt_name'),
                detail_addr: getInputVal('detail_addr'),
                legal_mobile_no: getInputVal('legal_mobile_no'),
                contact_mobile_no: getInputVal('contact_mobile_no'),
                contact_email: getInputVal('contact_email'),
                card_info: {
                    account_name: getInputVal('card_info.account_name'),
                    card_no: getInputVal('card_info.card_no'),
                    bank_name: getInputVal('card_info.bank_name'),
                    bank_branch: getInputVal('card_info.bank_branch')
                },
                license_info: {
                    name: getInputVal('license_info.name'),
                    code: getInputVal('license_info.code'),
                    start_date: getInputVal('license_info.start_date'),
                    valid_date: getInputVal('license_info.valid_date'),
                    address: getInputVal('license_info.address')
                },
                legal_info: {
                    cert_type: getInputVal('legal_info.cert_type'),
                    legal_name: getInputVal('legal_info.legal_name'),
                    id_no: getInputVal('legal_info.id_no'),
                    id_start_date: getInputVal('legal_info.id_start_date'),
                    id_valid_date: getInputVal('legal_info.id_valid_date')
                },
                license_pic: !!uploadState.license_pic,
                legal_cert_front_pic: !!uploadState.legal_cert_front_pic,
                legal_cert_back_pic: !!uploadState.legal_cert_back_pic,
                open_license_pic: !!uploadState.open_license_pic,
                store_header_pic: !!uploadState.store_header_pic,
                store_indoor_pic: !!uploadState.store_indoor_pic,
                store_cashier_desk_pic: !!uploadState.store_cashier_desk_pic
            };
        }

        function validateBeforeSubmit() {
            var requiredUploads = [
                ['license_pic', '营业执照'],
                ['legal_cert_front_pic', '法人身份证人像面'],
                ['legal_cert_back_pic', '法人身份证国徽面'],
                ['open_license_pic', '开户许可证'],
                ['store_header_pic', '门头/场地照'],
                ['store_indoor_pic', '内景/工作区域照'],
                ['store_cashier_desk_pic', '收银台/前台照']
            ];
            for (var j = 0; j < requiredUploads.length; j++) {
                var up = requiredUploads[j];
                if (!uploadState[up[0]]) {
                    showToast('请上传' + up[1], 'error');
                    return false;
                }
            }
            var requiredTextFields = [
                { key: 'short_name', label: '商户简称' },
                { key: 'receipt_name', label: '小票名称' },
                { key: 'detail_addr', label: '实际经营地址' },
                { key: 'legal_mobile_no', label: '法人手机号' },
                { key: 'contact_mobile_no', label: '管理员手机号' },
                { key: 'contact_email', label: '管理员邮箱' },
                { key: 'license_info.name', label: '营业执照名称' },
                { key: 'license_info.code', label: '证件代码' },
                { key: 'license_info.start_date', label: '执照起始日期' },
                { key: 'license_info.valid_date', label: '执照有效期' },
                { key: 'license_info.address', label: '注册地址' },
                { key: 'legal_info.legal_name', label: '法人姓名' },
                { key: 'legal_info.id_no', label: '身份证号' },
                { key: 'legal_info.id_start_date', label: '身份证起始日期' },
                { key: 'legal_info.id_valid_date', label: '身份证有效期' },
                { key: 'card_info.account_name', label: '开户名' },
                { key: 'card_info.card_no', label: '银行卡号' },
                { key: 'card_info.bank_name', label: '开户银行' },
                { key: 'card_info.bank_branch', label: '开户支行' }
            ];
            for (var i = 0; i < requiredTextFields.length; i++) {
                var f = requiredTextFields[i];
                if (!getInputVal(f.key)) {
                    showToast('请填写' + f.label, 'error');
                    return false;
                }
            }
            return true;
        }

        function persist(status) {
            var now = Date.now();
            var payload = {
                recordKey: recordKey,
                status: status,
                title: opts.title || '进件',
                variant: variant,
                merchantShortName: opts.merchantShortNameDefault || '',
                fields: collectFields(),
                updatedAt: now,
                submittedAt: status === 'submitted' ? now : null
            };
            saveRecord(recordKey, payload);
            recordStatus = status;
            if (typeof opts.onRecordChange === 'function') {
                try {
                    opts.onRecordChange(copyObj(payload));
                } catch (e) {}
            }
            return payload;
        }

        function refreshEditable() {
            Object.keys(inputMap).forEach(function (k) {
                inputMap[k].disabled = !editMode;
            });
            uploadRenders.forEach(function (fn) {
                fn();
            });
            if (opts.forceView) {
                bEdit.style.display = 'none';
                bSave.style.display = 'none';
                bSubmit.style.display = 'none';
                bDelete.style.display = 'none';
                return;
            }
            bEdit.style.display = !editMode && recordStatus === 'submitted' ? '' : 'none';
            bSave.style.display = editMode ? '' : 'none';
            bSubmit.style.display = editMode ? '' : 'none';
            bDelete.style.display = editMode && recordStatus === 'draft' ? '' : 'none';
        }

        var footer = el('div', 'erp-modal__footer');
        var bBack = mkBtn('返回', false, true);
        var bDelete = mkBtn('删除', false, true);
        var bEdit = mkBtn('编辑', false, true);
        var bSave = mkBtn('保存', false, true);
        var bSubmit = mkBtn('提交进件', true, false);
        bBack.addEventListener('click', function () {
            backdrop.remove();
        });
        bDelete.addEventListener('click', function () {
            if (recordStatus !== 'draft') {
                showToast('仅草稿支持删除', 'error');
                return;
            }
            removeRecord(recordKey);
            recordStatus = '';
            if (typeof opts.onRecordChange === 'function') {
                try {
                    opts.onRecordChange(null);
                } catch (e) {}
            }
            showToast('草稿已删除', 'success');
            backdrop.remove();
        });
        bEdit.addEventListener('click', function () {
            editMode = true;
            refreshEditable();
        });
        bSave.addEventListener('click', function () {
            persist('draft');
            showToast('已保存草稿', 'success');
            refreshEditable();
        });
        bSubmit.addEventListener('click', function () {
            if (!validateBeforeSubmit()) return;
            persist('submitted');
            editMode = false;
            refreshEditable();
            showToast('已提交进件（演示）', 'success');
            backdrop.remove();
        });
        footer.appendChild(bBack);
        footer.appendChild(bDelete);
        footer.appendChild(bEdit);
        footer.appendChild(bSave);
        footer.appendChild(bSubmit);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        refreshEditable();
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) backdrop.remove();
        });
        document.body.appendChild(backdrop);
    }

    window.MdmUnifiedOnboardingUi = {
        openModal: openUnifiedOnboardingModal,
        removeModals: removeUnifiedOnboardingModals,
        makeRecordKey: makeRecordKey,
        getRecord: readRecord,
        removeRecord: removeRecord,
        upsertRecord: function (recordKey, record) {
            if (!recordKey || !record) return;
            saveRecord(String(recordKey), record);
        },
        getSummary: function (recordKey, fallbackDefaults) {
            var rec = readRecord(recordKey);
            var fields = rec && rec.fields ? rec.fields : copyObj(fallbackDefaults || {});
            return {
                status: rec && rec.status ? rec.status : '',
                auditStatus: rec && rec.auditStatus ? rec.auditStatus : '',
                nextAuditNode: rec && rec.nextAuditNode ? rec.nextAuditNode : '',
                submittedAt: rec && rec.submittedAt ? rec.submittedAt : null,
                updatedAt: rec && rec.updatedAt ? rec.updatedAt : null,
                fields: fields
            };
        }
    };
})();
