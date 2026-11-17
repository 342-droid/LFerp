/**
 * 主体资料：营业执照、法人身份证、法人实名电话、整套结算信息跟着主体。
 * 主体详情可查看、可编辑；保存后默认同步到第一家门店或供应商，供进件带入。
 * 法人实名电话不写入进件。后建的门店、供应商不再收集这四套。
 */
(function (global) {
    var STORAGE_KEY = 'lf_entry_materials_v1';
    var FIRST_BIZ_KEY = 'lf_subject_first_biz_v1';

    var TEXT_FIELDS = [
        { key: 'licenseName', label: '商户名称', group: 'license', tip: '必须与企业证照上的名称一致；个体工商户的营业执照如没有名称，名称为“*”或空，则商户名称应填“个体户XXX”（XXX为营业执照上经营者姓名），如“个体户张三”。' },
        { key: 'licenseCode', label: '证照编号', group: 'license' },
        { key: 'licenseStart', label: '证照有效期开始日期', group: 'license', type: 'date' },
        { key: 'licenseValid', label: '证照有效期截止日期', group: 'license', forever: true, required: false },
        { key: 'licenseFound', label: '成立日期', group: 'license', type: 'date' },
        { key: 'licenseRegion', label: '省市区', group: 'license', placeholder: '省 / 市 / 区' },
        { key: 'licenseAddress', label: '详细地址', group: 'license' },
        { key: 'legalName', label: '法人姓名', group: 'legal' },
        { key: 'legalIdNo', label: '法人证件号码', group: 'legal' },
        { key: 'legalIdStart', label: '法人证件开始日期', group: 'legal', type: 'date' },
        { key: 'legalIdValid', label: '法人证件截止日期', group: 'legal', forever: true, required: false },
        { key: 'legalRegion', label: '省市区', group: 'legal', placeholder: '省 / 市 / 区' },
        { key: 'legalAddress', label: '详细地址', group: 'legal' },
        { key: 'legalRealnamePhone', label: '法人实名电话', group: 'phone', placeholder: '11位手机号' },
        { key: 'accountName', label: '开户名', group: 'settle' },
        { key: 'cardNo', label: '银行卡号', group: 'settle' },
        { key: 'bankName', label: '开户银行', group: 'settle' },
        { key: 'bankBranch', label: '开户支行', group: 'settle' }
    ];

    var UPLOADS = [
        { key: 'licensePic', label: '上传营业执照', group: 'license' },
        { key: 'legalFront', label: '上传法人身份证人像面', group: 'legal' },
        { key: 'legalBack', label: '上传法人身份证国徽面', group: 'legal' },
        { key: 'openLicensePic', label: '上传开户许可证', group: 'settle' }
    ];

    function emptyRecord() {
        var data = {};
        TEXT_FIELDS.forEach(function (field) { data[field.key] = ''; });
        UPLOADS.forEach(function (field) { data[field.key] = false; });
        return data;
    }

    function readMap() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var data = raw ? JSON.parse(raw) : {};
            return data && typeof data === 'object' ? data : {};
        } catch (err) {
            return {};
        }
    }

    function writeMap(map) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {})); } catch (err) {}
    }

    function storageKey(kind, name) {
        var who = String(name || '').trim();
        if (!who) return '';
        return String(kind || 'store') + '::' + who;
    }

    function save(kind, name, data) {
        var key = storageKey(kind, name);
        if (!key) return;
        var map = readMap();
        map[key] = Object.assign(emptyRecord(), data || {});
        writeMap(map);
    }

    function load(kind, name) {
        var key = storageKey(kind, name);
        if (!key) return null;
        var one = readMap()[key];
        return one ? Object.assign(emptyRecord(), one) : null;
    }

    function readFirstMap() {
        try {
            return JSON.parse(localStorage.getItem(FIRST_BIZ_KEY) || '{}') || {};
        } catch (e) {
            return {};
        }
    }

    function writeFirstMap(map) {
        try {
            localStorage.setItem(FIRST_BIZ_KEY, JSON.stringify(map || {}));
        } catch (e) {}
    }

    function saveSubject(id, data) {
        id = String(id || '').trim();
        if (!id) return;
        var map = readMap();
        map['subject::' + id] = Object.assign(emptyRecord(), data || {});
        writeMap(map);
    }

    function loadSubject(id) {
        id = String(id || '').trim();
        if (!id) return null;
        var one = readMap()['subject::' + id];
        return one ? Object.assign(emptyRecord(), one) : null;
    }

    function normalizeKind(kind) {
        if (kind === 'supplier' || kind === 'warehouse' || kind === 'trader') return kind;
        return 'store';
    }

    function bindFirst(id, kind, name) {
        id = String(id || '').trim();
        name = String(name || '').trim();
        if (!id || !name) return;
        var map = readFirstMap();
        map[id] = { kind: normalizeKind(kind), name: name };
        writeFirstMap(map);
    }

    function firstOf(id) {
        id = String(id || '').trim();
        if (!id) return null;
        return readFirstMap()[id] || null;
    }

    function subjectIdForBusiness(kind, name) {
        kind = normalizeKind(kind);
        name = String(name || '').trim();
        if (!name) return '';
        var map = readFirstMap();
        var id;
        for (id in map) {
            if (!Object.prototype.hasOwnProperty.call(map, id)) continue;
            if (map[id] && map[id].kind === kind && map[id].name === name) return id;
        }
        return '';
    }

    function toOnboardingDefaults(data) {
        data = Object.assign(emptyRecord(), data || {});
        return {
            license_pic: !!data.licensePic,
            legal_cert_front_pic: !!data.legalFront,
            legal_cert_back_pic: !!data.legalBack,
            open_license_pic: !!data.openLicensePic,
            license_info: {
                name: data.licenseName,
                code: data.licenseCode,
                start_date: data.licenseStart,
                valid_date: data.licenseValid,
                found_date: data.licenseFound,
                region: data.licenseRegion,
                address_detail: data.licenseAddress
            },
            legal_info: {
                cert_type: '身份证',
                legal_name: data.legalName,
                id_no: data.legalIdNo,
                id_start_date: data.legalIdStart,
                id_valid_date: data.legalIdValid,
                legal_region: data.legalRegion,
                legal_addr_detail: data.legalAddress
            },
            card_info: {
                account_name: data.accountName,
                card_no: data.cardNo,
                bank_name: data.bankName,
                bank_branch: data.bankBranch
            }
        };
    }

    function lookupForOnboarding(opts) {
        opts = opts || {};
        if (opts.subjectId) {
            var owned = loadSubject(opts.subjectId);
            if (owned) return toOnboardingDefaults(owned);
        }
        var name = String(opts.merchantShortNameDefault || opts.name || '').trim();
        if (!name) return null;
        var kind = normalizeKind(opts.onboardingKind);
        var ownerId = subjectIdForBusiness(kind, name);
        if (!ownerId && (kind === 'store' || kind === 'supplier')) {
            ownerId = subjectIdForBusiness(kind === 'store' ? 'supplier' : 'store', name);
        }
        if (ownerId) {
            var fromOwner = loadSubject(ownerId);
            if (fromOwner) return toOnboardingDefaults(fromOwner);
        }
        var found = load(kind, name) || load(kind === 'store' ? 'supplier' : 'store', name);
        return found ? toOnboardingDefaults(found) : null;
    }

    function fillEmptyOnboarding(base, kind, name) {
        var extra = toOnboardingDefaults(load(kind, name) || null);
        if (!extra) return base;
        base = base || {};
        function fill(current, next) {
            return String(current || '').trim() ? current : (next || '');
        }
        ['license_pic', 'legal_cert_front_pic', 'legal_cert_back_pic', 'open_license_pic'].forEach(function (key) {
            if (!base[key] && extra[key]) base[key] = extra[key];
        });
        base.license_info = base.license_info || {};
        base.legal_info = base.legal_info || {};
        base.card_info = base.card_info || {};
        Object.keys(extra.license_info).forEach(function (key) {
            base.license_info[key] = fill(base.license_info[key], extra.license_info[key]);
        });
        Object.keys(extra.legal_info).forEach(function (key) {
            base.legal_info[key] = fill(base.legal_info[key], extra.legal_info[key]);
        });
        Object.keys(extra.card_info).forEach(function (key) {
            base.card_info[key] = fill(base.card_info[key], extra.card_info[key]);
        });
        return base;
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function textInput(field) {
        var input = document.createElement('input');
        input.className = 'erp-input';
        input.type = field.type || (field.key === 'legalRealnamePhone' ? 'tel' : 'text');
        input.placeholder = field.placeholder || ('请输入' + field.label);
        input.setAttribute('data-em', field.key);
        input.setAttribute('data-required-msg', '请填写' + field.label);
        input.style.width = '100%';
        input.style.height = '36px';
        input.style.boxSizing = 'border-box';
        return input;
    }

    function uploadCaption(field) {
        return field.label.indexOf('上传') === 0 ? field.label : '上传' + field.label;
    }

    function auditRow(label, control) {
        var row = el('div', 'audit-detail-row');
        var lab = el('span', 'audit-detail-row__label');
        lab.appendChild(el('span', 'audit-req', '*'));
        lab.appendChild(document.createTextNode(label));
        var value = el('span', 'audit-detail-row__value');
        value.appendChild(control);
        row.appendChild(lab);
        row.appendChild(value);
        return row;
    }

    function clickUploadBox(caption) {
        var wrap = el('div', '');
        wrap.appendChild(el('div', 'store-upload-box onboard-upload--click', '点击上传'));
        if (caption) wrap.appendChild(el('div', 'store-upload-box__cap', caption));
        wrap.style.cursor = 'pointer';
        return wrap;
    }

    function previewUploadBox(caption) {
        var preview = el('div', 'store-upload-box', caption || '已上传');
        preview.style.fontSize = '13px';
        return preview;
    }

    function tagUpload(node, key, caption, uploaded) {
        node.setAttribute('data-em-upload', key);
        node.setAttribute('data-em-upload-managed', '1');
        node.setAttribute('data-em-label', caption);
        node.setAttribute('data-upload-required-msg', '请' + (caption.indexOf('上传') === 0 ? caption : '上传' + caption));
        if (uploaded) node.setAttribute('data-upload-state', '1');
        return node;
    }

    function mount(parent, options) {
        options = options || {};
        var skin = options.skin || 'pc';
        var editMode = options.editable !== false;
        var state = Object.assign(emptyRecord(), options.value || {});
        var picked = {};
        var root = el('div', '');
        root.setAttribute('data-entry-materials', '1');

        function photoControl(field) {
            var host = el('div', '');
            var caption = uploadCaption(field);
            var on = !!state[field.key];
            if (!editMode) {
                host.appendChild(on ? photoButton(field.label.replace('上传', '')) : el('span', '', '待上传'));
                if (on) tagUpload(host.appendChild(el('span', '')), field.key, caption, true).hidden = true;
                return host;
            }
            if (!on) {
                var wrap = clickUploadBox(caption);
                tagUpload(wrap, field.key, caption, false);
                wrap.addEventListener('click', function () { markUploaded(field.key); });
                host.appendChild(wrap);
                return host;
            }
            var preview = previewUploadBox(picked[field.key] || '已上传');
            tagUpload(preview, field.key, caption, true);
            host.appendChild(preview);
            var actions = el('div', 'store-form__upload-hint');
            actions.style.marginTop = '8px';
            actions.appendChild(el('span', '', '已上传'));
            actions.appendChild(document.createTextNode('  '));
            var rep = document.createElement('a');
            rep.href = '#';
            rep.textContent = '更换';
            rep.addEventListener('click', function (ev) {
                ev.preventDefault();
                markUploaded(field.key);
            });
            actions.appendChild(rep);
            host.appendChild(actions);
            return host;
        }

        function fieldLabel(text, required) {
            var lab = el('label', 'em-field__label');
            if (required !== false) lab.appendChild(el('span', 'store-form__req', '*'));
            lab.appendChild(document.createTextNode(text));
            return lab;
        }

        function editPhoto(field) {
            var caption = uploadCaption(field);
            var on = !!state[field.key];
            var wrap = el('div', 'em-photo');
            var box = el('div', 'em-photo__box' + (on ? ' is-done' : ''), on ? '已上传' : '+');
            var hint = el('div', 'em-photo__hint');
            wrap.appendChild(box);
            wrap.appendChild(hint);
            tagUpload(wrap, field.key, caption, on);
            if (!editMode) {
                hint.textContent = on ? '已上传' : '待上传';
                return wrap;
            }
            if (!on) {
                hint.textContent = 'JPG/PNG，≤ 10MB';
                wrap.addEventListener('click', function () { markUploaded(field.key); });
                return wrap;
            }
            hint.appendChild(document.createTextNode('JPG/PNG，≤ 10MB  '));
            var rep = document.createElement('a');
            rep.href = '#';
            rep.textContent = '更换';
            rep.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                markUploaded(field.key);
            });
            hint.appendChild(rep);
            return wrap;
        }

        function dateForever(field) {
            var raw = String(state[field.key] || '').trim();
            var longTerm = raw === '长期' || raw === '长期有效' || raw === '永久有效';
            var host = el('div', 'unified-onboard-id-valid-ctrl');
            var dateInp = document.createElement('input');
            dateInp.className = 'erp-input';
            dateInp.type = 'date';
            dateInp.disabled = !editMode || longTerm;
            if (!longTerm && /^\d{4}-\d{2}-\d{2}/.test(raw)) dateInp.value = raw.slice(0, 10);
            var hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.setAttribute('data-em', field.key);
            hidden.setAttribute('data-required-msg', '请填写' + field.label);
            hidden.value = longTerm ? '长期有效' : (dateInp.value || '');
            var lab = document.createElement('label');
            lab.className = 'unified-onboard-id-valid-forever';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = longTerm;
            cb.disabled = !editMode;
            function sync() {
                hidden.value = cb.checked ? '长期有效' : (dateInp.value || '');
            }
            cb.addEventListener('change', function () {
                dateInp.disabled = !editMode || cb.checked;
                if (cb.checked) {
                    if (dateInp.value) dateInp.setAttribute('data-prev-date', dateInp.value);
                    dateInp.value = '';
                } else {
                    dateInp.value = dateInp.getAttribute('data-prev-date') || '';
                }
                sync();
            });
            dateInp.addEventListener('input', sync);
            lab.appendChild(cb);
            lab.appendChild(document.createTextNode('长期有效'));
            host.appendChild(dateInp);
            host.appendChild(lab);
            host.appendChild(hidden);
            return host;
        }

        function editControl(field) {
            if (field.forever) return dateForever(field);
            var input = textInput(field);
            input.disabled = !editMode;
            var raw = state[field.key] || '';
            if (field.type === 'date') {
                if (/^\d{4}-\d{2}-\d{2}/.test(raw)) input.value = raw.slice(0, 10);
            } else {
                input.value = raw;
            }
            return input;
        }

        function appendAuditGroup(title, group) {
            var heading = el('div', 'supplier-detail-section-title', title);
            root.appendChild(heading);
            UPLOADS.filter(function (field) { return field.group === group; }).forEach(function (field) {
                root.appendChild(auditRow(field.label.replace('上传', ''), photoControl(field)));
            });
            TEXT_FIELDS.filter(function (field) { return field.group === group; }).forEach(function (field) {
                var input = textInput(field);
                input.disabled = !editMode;
                var raw = state[field.key] || '';
                if (field.type === 'date') {
                    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) input.value = raw.slice(0, 10);
                } else {
                    input.value = raw;
                }
                root.appendChild(auditRow(field.label, input));
            });
        }

        function appendEditGroup(title, group) {
            var block = el('div', 'em-edit');
            block.appendChild(el('div', 'em-edit__title', title));
            var grid = el('div', 'em-edit__grid');
            var uploads = UPLOADS.filter(function (field) { return field.group === group; });
            uploads.forEach(function (field) {
                var cell = el('div', 'em-field' + (uploads.length === 1 ? ' em-field--full' : ''));
                cell.appendChild(fieldLabel(field.label.replace('上传', '')));
                cell.appendChild(editPhoto(field));
                grid.appendChild(cell);
            });
            TEXT_FIELDS.filter(function (field) { return field.group === group; }).forEach(function (field) {
                var cell = el('div', 'em-field');
                cell.appendChild(fieldLabel(field.label, field.required !== false));
                cell.appendChild(editControl(field));
                if (field.tip) cell.appendChild(el('div', 'em-tip', field.tip));
                grid.appendChild(cell);
            });
            block.appendChild(grid);
            root.appendChild(block);
        }

        function appendGroup(title, group) {
            if (skin === 'audit') appendAuditGroup(title, group);
            else appendEditGroup(title, group);
        }

        function paint() {
            root.innerHTML = '';
            appendGroup('营业执照', 'license');
            appendGroup('法人身份证', 'legal');
            appendGroup('法人实名电话', 'phone');
            appendGroup('结算信息', 'settle');
        }

        function markUploaded(key) {
            if (!editMode) return;
            var current = read(root);
            current[key] = true;
            state = Object.assign(emptyRecord(), current);
            picked[key] = '本地上传文件';
            if (typeof showToast === 'function') showToast('已选择文件（演示）', 'success');
            paint();
        }

        root._emPaint = function (next) {
            state = Object.assign(emptyRecord(), next || {});
            picked = {};
            paint();
        };
        paint();
        parent.appendChild(root);
        return root;
    }

    function read(root) {
        var data = emptyRecord();
        if (!root) return data;
        root.querySelectorAll('[data-em]').forEach(function (input) {
            data[input.getAttribute('data-em')] = String(input.value || '').trim();
        });
        root.querySelectorAll('[data-em-upload]').forEach(function (btn) {
            data[btn.getAttribute('data-em-upload')] = btn.getAttribute('data-upload-state') === '1';
        });
        return data;
    }

    function fill(root, data) {
        data = Object.assign(emptyRecord(), data || {});
        if (!root) return;
        if (typeof root._emPaint === 'function') {
            root._emPaint(data);
            return;
        }
        root.querySelectorAll('[data-em]').forEach(function (input) {
            input.value = data[input.getAttribute('data-em')] || '';
        });
        root.querySelectorAll('[data-em-upload]').forEach(function (btn) {
            var on = !!data[btn.getAttribute('data-em-upload')];
            btn.setAttribute('data-upload-state', on ? '1' : '');
            if (btn.classList.contains('onboard-upload--click')) {
                btn.textContent = on ? '已上传' : '点击上传';
                return;
            }
            if (btn.getAttribute('data-em-upload-managed') === '1') return;
            btn.textContent = on ? '已上传，点击可重传' : (btn.getAttribute('data-em-label') || '上传');
        });
    }

    function validateRecord(data) {
        data = Object.assign(emptyRecord(), data || {});
        var i;
        for (i = 0; i < UPLOADS.length; i++) {
            if (!data[UPLOADS[i].key]) return '请' + UPLOADS[i].label;
        }
        for (i = 0; i < TEXT_FIELDS.length; i++) {
            if (!data[TEXT_FIELDS[i].key]) return '请填写' + TEXT_FIELDS[i].label;
        }
        if (!/^1\d{10}$/.test(data.legalRealnamePhone)) return '请填写11位法人实名电话';
        return '';
    }

    function validate(root) {
        return validateRecord(read(root));
    }

    function h5Field(label, inner) {
        return '<div class="h5-field" style="margin-bottom:12px"><label class="h5-lab" style="display:block;margin-bottom:6px;font-size:13px"><span class="req" style="color:#e85d04">*</span>' +
            label + '</label>' + inner + '</div>';
    }

    function h5Section() {
        function input(field) {
            var type = field.type || (field.key === 'legalRealnamePhone' ? 'tel' : 'text');
            return '<input class="h5-input erp-input" style="width:100%;height:40px;box-sizing:border-box" data-em="' + field.key +
                '" type="' + type + '" placeholder="' + (field.placeholder || ('请输入' + field.label)) + '">';
        }
        function upload(field) {
            return '<button type="button" class="store-upload-box onboard-upload--click" data-em-upload="' + field.key +
                '" data-em-label="' + field.label + '" data-upload-required-msg="请' + field.label +
                '" style="width:100%;height:120px;border:1px dashed #d9d9d9;background:#fafafa;border-radius:8px;color:#64748b">点击上传</button>' +
                '<div class="store-upload-box__cap">' + field.label + '</div>';
        }
        function group(title, groupName, note) {
            var html = '<section class="h5-sec" data-entry-materials="1" style="margin-top:12px"><h3 style="margin:0 0 8px;font-size:15px">' + title + '</h3>';
            if (note) html += '<p style="margin:0 0 8px;font-size:12px;color:#888;line-height:1.5">' + note + '</p>';
            UPLOADS.forEach(function (field) {
                if (field.group === groupName) html += h5Field(field.label.replace('上传', ''), upload(field));
            });
            TEXT_FIELDS.forEach(function (field) {
                if (field.group === groupName) html += h5Field(field.label, input(field));
            });
            return html + '</section>';
        }
        return '<div data-entry-materials-wrap="1">' +
            '<p style="margin:12px 0 0;font-size:12px;color:#666;line-height:1.5">营业执照、法人身份证、法人实名电话和结算信息属于主体，会同步到第一家门店。进件带入执照、身份证和结算，法人实名电话不写入进件。</p>' +
            group('营业执照', 'license') +
            group('法人身份证', 'legal') +
            group('法人实名电话', 'phone') +
            group('结算信息', 'settle') +
            '</div>';
    }

    function h5Root(doc) {
        return (doc || document).querySelector('[data-entry-materials-wrap]');
    }

    function loadForArchive(kind, name) {
        kind = normalizeKind(kind);
        name = String(name || '').trim();
        if (!name) return null;
        var own = load(kind, name);
        if (own) return own;
        var sid = subjectIdForBusiness(kind, name);
        if (!sid) return null;
        var first = firstOf(sid);
        if (first && (first.kind !== kind || first.name !== name)) return null;
        return loadSubject(sid);
    }

    function saveForArchive(kind, name, data) {
        kind = normalizeKind(kind);
        name = String(name || '').trim();
        if (!name) return;
        save(kind, name, data);
        var sid = subjectIdForBusiness(kind, name);
        if (!sid) return;
        var first = firstOf(sid);
        if (!first || (first.kind === kind && first.name === name)) {
            saveSubject(sid, data);
            if (!first) bindFirst(sid, kind, name);
        }
    }

    function pairs(data) {
        data = Object.assign(emptyRecord(), data || {});
        return TEXT_FIELDS.map(function (field) {
            return { label: field.label, value: data[field.key] || '未填写' };
        }).concat(UPLOADS.map(function (field) {
            var on = !!data[field.key];
            return {
                label: field.label.replace('上传', ''),
                value: on ? '已上传' : '未上传',
                photo: true,
                uploaded: on
            };
        }));
    }

    /** 列表里的演示主体没有落过证照。缺记录时补一份，已有资料不覆盖。 */
    var DEMO_SUBJECTS = {
        'STORE-SUB-001': { name: '冷丰演示门店', person: '张三', phone: '13800002211', code: '91330106MA2DEMO001', idNo: '330106198803151234', region: '浙江省 / 杭州市 / 西湖区', addr: '杭州市西湖区文一西路88号', bank: '中国工商银行', branch: '杭州文一支行', card: '6222021202002211001' },
        'STORE-SUB-002': { name: '五角场体验店', person: '李四', phone: '18800007765', code: '91310110MA2DEMO002', idNo: '310110198506082226', region: '上海市 / 市辖区 / 杨浦区', addr: '上海市杨浦区淞沪路8号', bank: '中国建设银行', branch: '上海五角场支行', card: '6217001210007765002' },
        'STORE-SUB-003': { name: '张江快闪店', person: '陈晨', phone: '18600009001', code: '91310115MA2DEMO003', idNo: '310115199203193315', region: '上海市 / 市辖区 / 浦东新区', addr: '上海市浦东新区祖冲之路2288号', bank: '招商银行', branch: '上海张江支行', card: '6214830210009001003' },
        'SUP-SUB-001': { name: '小牛供应链', person: '牛强', phone: '15900007788', code: '91330100MA2DEMO011', idNo: '330102197911220018', region: '浙江省 / 杭州市 / 滨江区', addr: '杭州市滨江区网商路599号', bank: '中国农业银行', branch: '杭州滨江支行', card: '6228480320007788004' },
        'SUP-SUB-002': { name: '珠宝集采中心', person: '钱多多', phone: '17700009271', code: '91310101MA2DEMO012', idNo: '310101198207074422', region: '上海市 / 市辖区 / 黄浦区', addr: '上海市黄浦区南京东路100号', bank: '中国银行', branch: '上海南京东路支行', card: '6216610210009271005' },
        'SUP-SUB-003': { name: '华东辅料仓配', person: '刘洋', phone: '17600000317', code: '91320500MA2DEMO013', idNo: '320506198912013317', region: '江苏省 / 苏州市 / 工业园区', addr: '苏州市工业园区星湖街328号', bank: '交通银行', branch: '苏州工业园区支行', card: '6222620210000317006' },
        'TRD-SUB-001': { name: '杭州鲜达贸易有限公司', person: '周宁', phone: '13800001001', code: '91330106MA2DEMO021', idNo: '330106198401156618', region: '浙江省 / 杭州市 / 拱墅区', addr: '杭州市拱墅区湖州街88号', bank: '杭州银行', branch: '杭州拱墅支行', card: '6230610210001001007' },
        'TRD-SUB-002': { name: '上海冷链融资租赁有限公司', person: '李航', phone: '13800001002', code: '91310115MA2DEMO022', idNo: '310115198708229901', region: '上海市 / 市辖区 / 浦东新区', addr: '上海市浦东新区世纪大道100号', bank: '浦发银行', branch: '上海陆家嘴支行', card: '6217920210001002008' },
        'WH-SUB-001': { name: '沪南一号仓', person: '周仓', phone: '13700000098', code: '91310112MA2DEMO031', idNo: '310112198005053311', region: '上海市 / 市辖区 / 闵行区', addr: '上海市闵行区沪南路2000号', bank: '中国工商银行', branch: '上海闵行支行', card: '6222021002000098009' },
        'WH-SUB-002': { name: '合作仓-苏州', person: '孙杰', phone: '13300000000', code: '91320505MA2DEMO032', idNo: '320505198603174420', region: '江苏省 / 苏州市 / 虎丘区', addr: '苏州市虎丘区狮山路18号', bank: '中国建设银行', branch: '苏州狮山路支行', card: '6217001002000000010' },
        'WH-SUB-003': { name: '自建仓-杭州', person: '王敏', phone: '13800002210', code: '91330108MA2DEMO033', idNo: '330108199105286628', region: '浙江省 / 杭州市 / 余杭区', addr: '杭州市余杭区仓前街道文一西路1500号', bank: '浙商银行', branch: '杭州余杭支行', card: '6210190210002210011' }
    };

    function demoRecord(spec, name) {
        spec = spec || {};
        var merchant = spec.name || name || '';
        return Object.assign(emptyRecord(), {
            licenseName: merchant,
            licenseCode: spec.code || '',
            licenseStart: '2020-01-01',
            licenseValid: '长期有效',
            licenseFound: '2018-06-18',
            licenseRegion: spec.region || '',
            licenseAddress: spec.addr || '',
            licensePic: true,
            legalName: spec.person || '',
            legalIdNo: spec.idNo || '',
            legalIdStart: '2019-03-01',
            legalIdValid: '2039-03-01',
            legalRegion: spec.region || '',
            legalAddress: spec.addr || '',
            legalFront: true,
            legalBack: true,
            legalRealnamePhone: spec.phone || '',
            accountName: merchant,
            cardNo: spec.card || '',
            bankName: spec.bank || '',
            bankBranch: spec.branch || '',
            openLicensePic: true
        });
    }

    function ensureDemoSubject(id, name) {
        id = String(id || '').trim();
        var spec = DEMO_SUBJECTS[id];
        if (!id || !spec) return loadSubject(id);
        var current = loadSubject(id);
        if (current && String(current.licenseName || '').trim()) return current;
        saveSubject(id, demoRecord(spec, name));
        return loadSubject(id);
    }

    /* 入驻审核按主体名称带回证照。已保存的资料不覆盖。 */
    function loadBySubjectName(name) {
        name = String(name || '').trim();
        if (!name) return null;
        var id;
        for (id in DEMO_SUBJECTS) {
            if (DEMO_SUBJECTS[id] && DEMO_SUBJECTS[id].name === name) return ensureDemoSubject(id, name);
        }
        return null;
    }

    Object.keys(DEMO_SUBJECTS).forEach(function (id) {
        ensureDemoSubject(id, DEMO_SUBJECTS[id].name);
    });

    function summaryBlocks(data, render) {
        data = Object.assign(emptyRecord(), data || {});
        var lines = TEXT_FIELDS.map(function (field) {
            return render(field.label, data[field.key] || '未填写');
        }).concat(UPLOADS.map(function (field) {
            return render(field.label.replace('上传', ''), data[field.key] ? '已上传' : '未上传');
        }));
        return lines.join('');
    }

    function demoPhoto(label) {
        var text = String(label || '证照');
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

    function openPhotoLightbox(src, title) {
        if (!src) return;
        document.querySelectorAll('[data-em-photo-lightbox="1"]').forEach(function (node) { node.remove(); });
        var backdrop = el('div', 'erp-modal-backdrop erp-modal-backdrop--over-drawer mdm-photo-lightbox');
        backdrop.setAttribute('data-em-photo-lightbox', '1');
        var box = el('div', 'mdm-photo-lightbox__box');
        var head = el('div', 'mdm-photo-lightbox__head');
        head.appendChild(el('div', 'mdm-photo-lightbox__title', title || '查看照片'));
        var closeBtn = el('button', 'erp-modal__header-btn');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        head.appendChild(closeBtn);
        var img = document.createElement('img');
        img.className = 'mdm-photo-lightbox__img';
        img.src = src;
        img.alt = title || '照片';
        box.appendChild(head);
        box.appendChild(img);
        backdrop.appendChild(box);
        function shut() { backdrop.remove(); }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) shut();
        });
        closeBtn.addEventListener('click', shut);
        document.body.appendChild(backdrop);
    }

    function photoButton(label) {
        var tile = el('button', 'mdm-onboard-photo');
        tile.type = 'button';
        tile.title = '点击放大查看';
        var img = document.createElement('img');
        var src = demoPhoto(label);
        img.src = src;
        img.alt = label;
        tile.appendChild(img);
        tile.addEventListener('click', function () { openPhotoLightbox(src, label); });
        return tile;
    }

    function viewPhoto(label, uploaded) {
        if (!uploaded) return el('span', '', '待上传');
        return photoButton(label);
    }

    document.addEventListener('click', function (event) {
        var btn = event.target && event.target.closest ? event.target.closest('[data-em-upload]') : null;
        if (!btn || btn.disabled || btn.getAttribute('data-em-upload-managed') === '1') return;
        var on = btn.getAttribute('data-upload-state') !== '1';
        btn.setAttribute('data-upload-state', on ? '1' : '');
        if (btn.classList.contains('onboard-upload--click')) {
            btn.textContent = on ? '已上传' : '点击上传';
            return;
        }
        btn.textContent = on ? '已上传，点击可重传' : (btn.getAttribute('data-em-label') || '上传');
    });

    global.MdmEntryMaterials = {
        save: save,
        load: load,
        saveSubject: saveSubject,
        loadSubject: loadSubject,
        ensureDemoSubject: ensureDemoSubject,
        loadBySubjectName: loadBySubjectName,
        bindFirst: bindFirst,
        firstOf: firstOf,
        subjectIdForBusiness: subjectIdForBusiness,
        loadForArchive: loadForArchive,
        saveForArchive: saveForArchive,
        mount: mount,
        viewPhoto: viewPhoto,
        read: read,
        fill: fill,
        validate: validate,
        validateRecord: validateRecord,
        h5Section: h5Section,
        h5Root: h5Root,
        toOnboardingDefaults: toOnboardingDefaults,
        lookupForOnboarding: lookupForOnboarding,
        fillEmptyOnboarding: fillEmptyOnboarding,
        summaryBlocks: summaryBlocks,
        pairs: pairs
    };
})(window);
