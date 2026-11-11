/**
 * 入驻资料：新增门店 / 新增供应商商家时必填。
 * 营业执照、法人身份证、结算信息与进件字段一致；法人实名电话只留在入驻资料，不写入进件。
 * 之后打开进件时，用这里已保存的值作为默认值，进件里仍可修改。
 */
(function (global) {
    var STORAGE_KEY = 'lf_entry_materials_v1';

    var TEXT_FIELDS = [
        { key: 'licenseName', label: '商户名称', group: 'license' },
        { key: 'licenseCode', label: '证照编号', group: 'license' },
        { key: 'licenseStart', label: '证照有效期开始日期', group: 'license', type: 'date' },
        { key: 'licenseValid', label: '证照有效期截止日期', group: 'license', placeholder: '日期或长期有效' },
        { key: 'licenseFound', label: '成立日期', group: 'license', type: 'date' },
        { key: 'licenseRegion', label: '省市区', group: 'license', placeholder: '省 / 市 / 区' },
        { key: 'licenseAddress', label: '详细地址', group: 'license' },
        { key: 'legalName', label: '法人姓名', group: 'legal' },
        { key: 'legalIdNo', label: '法人证件号码', group: 'legal' },
        { key: 'legalIdStart', label: '法人证件开始日期', group: 'legal', type: 'date' },
        { key: 'legalIdValid', label: '法人证件截止日期', group: 'legal', placeholder: '日期或长期有效' },
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
        var name = String(opts.merchantShortNameDefault || opts.name || '').trim();
        if (!name) return null;
        var kind = opts.onboardingKind === 'supplier' ? 'supplier' : 'store';
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

    function uploadButton(field) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'erp-btn';
        btn.textContent = field.label;
        btn.setAttribute('data-em-upload', field.key);
        btn.setAttribute('data-em-label', field.label);
        btn.setAttribute('data-upload-required-msg', '请' + field.label);
        return btn;
    }

    function pcRow(label, control) {
        var row = el('div', 'store-form__row');
        var lab = el('label', 'store-form__label');
        lab.appendChild(el('span', 'store-form__req', '*'));
        lab.appendChild(document.createTextNode(label));
        var ctrl = el('div', 'store-form__control');
        ctrl.appendChild(control);
        row.appendChild(lab);
        row.appendChild(ctrl);
        return row;
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

    function appendGroup(parent, title, group, skin, note) {
        var heading = el('div', skin === 'audit' ? 'supplier-detail-section-title' : 'store-form__section', title);
        if (skin !== 'audit') heading.style.cssText = 'margin:16px 0 8px;font-weight:600;';
        parent.appendChild(heading);
        if (note) {
            var tip = el('div', '', note);
            tip.style.cssText = 'margin:0 0 8px;font-size:12px;color:#999;line-height:1.5;';
            parent.appendChild(tip);
        }
        UPLOADS.filter(function (field) { return field.group === group; }).forEach(function (field) {
            parent.appendChild(skin === 'audit' ? auditRow(field.label.replace('上传', ''), uploadButton(field)) : pcRow(field.label.replace('上传', ''), uploadButton(field)));
        });
        TEXT_FIELDS.filter(function (field) { return field.group === group; }).forEach(function (field) {
            parent.appendChild(skin === 'audit' ? auditRow(field.label, textInput(field)) : pcRow(field.label, textInput(field)));
        });
    }

    function mount(parent, options) {
        options = options || {};
        var skin = options.skin || 'pc';
        var root = el('div', '');
        root.setAttribute('data-entry-materials', '1');
        var intro = el('div', '', '营业执照、法人身份证和结算信息会在之后的进件里默认带入，进件中可以修改。法人实名电话只保存在入驻资料。');
        intro.style.cssText = 'margin:8px 0;font-size:12px;color:#666;line-height:1.5;';
        root.appendChild(intro);
        appendGroup(root, '营业执照', 'license', skin);
        appendGroup(root, '法人身份证', 'legal', skin);
        appendGroup(root, '法人实名电话', 'phone', skin, '进件没有这一项。请填写法人实名认证所用手机号。');
        appendGroup(root, '结算信息', 'settle', skin);
        if (options.editable === false) {
            root.querySelectorAll('input, button').forEach(function (node) { node.disabled = true; });
        }
        parent.appendChild(root);
        if (options.value) fill(root, options.value);
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
        root.querySelectorAll('[data-em]').forEach(function (input) {
            input.value = data[input.getAttribute('data-em')] || '';
        });
        root.querySelectorAll('[data-em-upload]').forEach(function (btn) {
            var on = !!data[btn.getAttribute('data-em-upload')];
            btn.setAttribute('data-upload-state', on ? '1' : '');
            btn.textContent = on ? '已上传，点击可重传' : (btn.getAttribute('data-em-label') || '上传');
        });
    }

    function validate(root) {
        var data = read(root);
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
            return '<button type="button" data-em-upload="' + field.key + '" data-em-label="' + field.label +
                '" style="width:100%;height:40px;border:1px dashed #ccc;background:#fafafa;border-radius:6px">' + field.label + '</button>';
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
            '<p style="margin:12px 0 0;font-size:12px;color:#666;line-height:1.5">营业执照、法人身份证和结算信息会带入后续进件，进件中可以修改。法人实名电话只保存在入驻资料。</p>' +
            group('营业执照', 'license') +
            group('法人身份证', 'legal') +
            group('法人实名电话', 'phone', '进件没有这一项。请填写法人实名认证所用手机号。') +
            group('结算信息', 'settle') +
            '</div>';
    }

    function h5Root(doc) {
        return (doc || document).querySelector('[data-entry-materials-wrap]');
    }

    function summaryBlocks(data, render) {
        data = Object.assign(emptyRecord(), data || {});
        var lines = TEXT_FIELDS.map(function (field) {
            return render(field.label, data[field.key] || '未填写');
        }).concat(UPLOADS.map(function (field) {
            return render(field.label.replace('上传', ''), data[field.key] ? '已上传' : '未上传');
        }));
        return lines.join('');
    }

    document.addEventListener('click', function (event) {
        var btn = event.target && event.target.closest ? event.target.closest('[data-em-upload]') : null;
        if (!btn || btn.disabled) return;
        var on = btn.getAttribute('data-upload-state') !== '1';
        btn.setAttribute('data-upload-state', on ? '1' : '');
        btn.textContent = on ? '已上传，点击可重传' : (btn.getAttribute('data-em-label') || '上传');
    });

    global.MdmEntryMaterials = {
        save: save,
        load: load,
        mount: mount,
        read: read,
        fill: fill,
        validate: validate,
        h5Section: h5Section,
        h5Root: h5Root,
        toOnboardingDefaults: toOnboardingDefaults,
        lookupForOnboarding: lookupForOnboarding,
        fillEmptyOnboarding: fillEmptyOnboarding,
        summaryBlocks: summaryBlocks
    };
})(window);
