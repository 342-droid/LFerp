/**
 * 所有主体「新增」改为分步弹窗：先配主体，再编下游档案。
 * 门店、供应商、仓库、贸易商都是两步：先主体，再下游信息。
 */
(function (global) {
    var CONTRACT_CAUTION = '所填信息为合同签约的控件填充字段，<strong>请谨慎填写</strong>！';
    var STORE_STEPS = [
        {
            title: '主体信息',
            items: [
                { caution: CONTRACT_CAUTION },
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { sec: '联系信息' },
                { label: '绑定BD' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '门店信息',
            items: [
                { sec: '基础信息' },
                { label: '门店名称' },
                { label: '门店简称' },
                { label: '门店合作类型', partner: true },
                { label: '门店类型' },
                { label: '事业线' },
                { label: '品牌名称' },
                { label: '业务线' },
                { sec: '地址与位置' },
                { label: '配送仓库' },
                { label: '门店编码' },
                { label: '门店地址' },
                { label: '详细地址', span: true },
                { map: true, span: true },
                { sec: '门店设施' },
                { label: '门头/场地照', span: true },
                { label: '有无冷藏柜' },
                { label: '冷藏柜照片' },
                { label: '有无冷冻柜' },
                { label: '冷冻柜照片' },
                { label: '门店面积', whenPartner: true },
                { label: '门店楼层', whenPartner: true },
                { label: '店门口口述视频', span: true, whenPartner: true },
                { label: '店内口述视频', span: true, whenPartner: true },
                { sec: '运营与评估' },
                { collapse: '门店经营与认知', span: true, whenPartner: true },
                { collapse: '特殊情况说明', span: true, whenPartner: true }
            ]
        }
    ];

    var SUPPLIER_STEPS = [
        {
            title: '主体信息',
            items: [
                { caution: CONTRACT_CAUTION },
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { label: '供应商别名' },
                { sec: '联系信息' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '供应商信息',
            items: [
                { sec: '基础信息' },
                { label: '供应商名称' },
                { label: '供应商类型' },
                { sec: '地址与仓库' },
                { label: '供应商地址' },
                { label: '入库仓库' },
                { label: '详细地址', span: true },
                { map: true, span: true },
                { sec: '结算方式' },
                { label: '结款方式' },
                { label: '结算类型' },
                { label: '结算策略', span: true },
                { label: '结算起算节点' },
                { label: '结算周期' }
            ]
        }
    ];

    var WAREHOUSE_STEPS = [
        {
            title: '主体信息',
            items: [
                { caution: CONTRACT_CAUTION },
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { sec: '联系信息' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '仓库信息',
            items: [
                { sec: '基础信息' },
                { label: '仓库名称' },
                { label: '仓库类型' },
                { label: '仓库级别' },
                { label: '仓库管理员' },
                { sec: '地址与面积' },
                { label: '仓库地址' },
                { label: '详细地址', span: true },
                { map: true, span: true },
                { label: '仓库面积（m²）' }
            ]
        }
    ];

    var TRADER_STEPS = [
        {
            title: '主体信息',
            items: [
                { caution: CONTRACT_CAUTION },
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { label: '主体类型' },
                { sec: '联系信息' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '贸易商信息',
            items: [
                { sec: '基础信息' },
                { label: '贸易商名称' },
                { label: '贸易商简称' },
                { label: '牌照类型' },
                { label: '业务范围' },
                { label: '贸易商状态', span: true },
                { sec: '地址' },
                { label: '贸易商地址' },
                { label: '详细地址', span: true },
                { map: true, span: true }
            ]
        }
    ];

    var ARCHIVE_STORE_STEPS = [
        {
            title: '门店信息',
            items: [
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { label: '门店名称' },
                { label: '门店简称' },
                { label: '门店合作类型', partner: true },
                { label: '门店类型' },
                { label: '事业线' },
                { label: '品牌名称' },
                { label: '业务线' },
                { label: '绑定BD' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '地址与位置',
            items: [
                { sec: '地址与位置' },
                { label: '配送仓库' },
                { label: '门店编码' },
                { label: '门店地址' },
                { label: '详细地址', span: true },
                { map: true, span: true }
            ]
        },
        {
            title: '门店设施',
            items: [
                { sec: '门店设施' },
                { label: '门头/场地照', span: true },
                { label: '有无冷藏柜' },
                { label: '冷藏柜照片' },
                { label: '有无冷冻柜' },
                { label: '冷冻柜照片' },
                { label: '门店面积', whenPartner: true },
                { label: '门店楼层', whenPartner: true },
                { label: '店门口口述视频', span: true, whenPartner: true },
                { label: '店内口述视频', span: true, whenPartner: true }
            ]
        },
        {
            title: '运营与评估',
            items: [
                { sec: '运营与评估' },
                { collapse: '门店经营与认知', span: true, whenPartner: true },
                { collapse: '特殊情况说明', span: true, whenPartner: true }
            ]
        }
    ];

    var ARCHIVE_SUPPLIER_STEPS = [
        {
            title: '供应商信息',
            items: [
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { label: '供应商名称' },
                { label: '供应商别名' },
                { label: '供应商类型' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '地址与仓库',
            items: [
                { sec: '地址与仓库' },
                { label: '供应商地址' },
                { label: '入库仓库' },
                { label: '详细地址', span: true },
                { map: true, span: true }
            ]
        },
        {
            title: '结算方式',
            items: [
                { sec: '结算方式' },
                { label: '结款方式' },
                { label: '结算类型' },
                { label: '结算策略', span: true },
                { label: '结算起算节点' },
                { label: '结算周期' }
            ]
        }
    ];

    var ARCHIVE_WAREHOUSE_STEPS = [
        {
            title: '仓库信息',
            items: [
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { label: '仓库名称' },
                { label: '仓库类型' },
                { label: '仓库级别' },
                { label: '仓库管理员' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '地址与面积',
            items: [
                { sec: '地址与面积' },
                { label: '仓库地址' },
                { label: '详细地址', span: true },
                { map: true, span: true },
                { label: '仓库面积（m²）' }
            ]
        }
    ];

    var ARCHIVE_TRADER_STEPS = [
        {
            title: '贸易商信息',
            items: [
                { sec: '基础信息' },
                { label: '主体名称', span: true, bar: true },
                { label: '主体类型' },
                { label: '贸易商名称' },
                { label: '贸易商简称' },
                { label: '牌照类型' },
                { label: '业务范围' },
                { label: '贸易商状态', span: true },
                { label: '联系人姓名' },
                { label: '手机号码' },
                { label: '验证码' },
                { sec: '证照与结算' },
                { materials: true, span: true }
            ]
        },
        {
            title: '地址',
            items: [
                { sec: '地址' },
                { label: '贸易商地址' },
                { label: '详细地址', span: true },
                { map: true, span: true }
            ]
        }
    ];

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function labelOf(node) {
        if (!node) return '';
        if (node.classList && node.classList.contains('store-form__collapse')) {
            var title = node.querySelector('.store-form__collapse-title');
            return title ? title.textContent.replace(/\s+/g, '') : '';
        }
        var lab = node.querySelector('.store-form__label') || node.querySelector('label');
        if (!lab) return '';
        return lab.textContent.replace(/\*/g, '').replace(/\s+/g, '').trim();
    }

    function dress(modal, kind, opts) {
        opts = opts || {};
        if (!modal || modal.getAttribute('data-subj-wiz') === '1') return;
        var form = modal.querySelector('.modal-form');
        var content = modal.querySelector('.modal-content');
        var footer = modal.querySelector('.modal-footer');
        if (!form || !content || !footer) return;
        modal.setAttribute('data-subj-wiz', '1');
        content.classList.add('subj-wiz');
        content.style.width = '';
        form.style.maxHeight = '';
        form.style.overflow = '';

        var titles = { 门店: '添加门店商家', 供应商: '添加供应商商家', 仓库: '添加仓库商家', 贸易商: '添加贸易商商家' };
        var heading = modal.querySelector('.modal-title');
        if (heading && titles[kind] && !opts.keepTitle) heading.textContent = titles[kind];

        var subjectRecipes = { 门店: STORE_STEPS, 供应商: SUPPLIER_STEPS, 仓库: WAREHOUSE_STEPS, 贸易商: TRADER_STEPS };
        var archiveRecipes = { 门店: ARCHIVE_STORE_STEPS, 供应商: ARCHIVE_SUPPLIER_STEPS, 仓库: ARCHIVE_WAREHOUSE_STEPS, 贸易商: ARCHIVE_TRADER_STEPS };
        var recipe = (opts.archive ? archiveRecipes[kind] : subjectRecipes[kind]) || null;
        var archive = form.querySelector('.store-form__row')
            ? form.querySelector('.store-form__row').parentNode
            : null;
        while (archive && archive !== form && !archive.querySelector(':scope > .store-form__row, :scope > [data-entry-materials]')) {
            archive = archive.parentNode;
        }
        if (archive === form) archive = null;

        var pool = [];
        var sink = el('div', 'subj-wiz__sink');
        function claimTree(root) {
            if (!root) return;
            root.querySelectorAll('.store-form__row').forEach(function (row) {
                if (row.closest('.store-form__collapse') || row.closest('[data-entry-materials]')) return;
                /* 重复的主体字段已去掉必填，直接收起。结算起算节点这类按选项显隐的行仍要留在步骤里。 */
                if (row.style.display === 'none' && !row.querySelector('[data-required-msg], [data-upload-required-msg]')) {
                    sink.appendChild(row);
                    return;
                }
                pool.push(row);
            });
            root.querySelectorAll('.store-form__collapse').forEach(function (node) {
                if (node.closest('[data-entry-materials]')) return;
                pool.push(node);
            });
            var materials = root.querySelector('[data-entry-materials]');
            if (materials) pool.push(materials);
            root.querySelectorAll('.store-form__tip').forEach(function (tip) {
                if (tip.closest('[data-entry-materials]')) return;
                if (tip.style.display === 'none') sink.appendChild(tip);
                else pool.push(tip);
            });
        }
        claimTree(archive || form);
        form.querySelectorAll('.modal-form-group').forEach(function (group) {
            var lab = labelOf(group);
            if (lab === '主体类型' && kind !== '贸易商') {
                sink.appendChild(group);
                return;
            }
            pool.push(group);
        });

        var used = [];
        function take(pred) {
            var i;
            for (i = 0; i < pool.length; i++) {
                if (used.indexOf(pool[i]) >= 0) continue;
                if (pred(pool[i])) {
                    used.push(pool[i]);
                    return pool[i];
                }
            }
            return null;
        }

        var scroll = archive || el('div', 'subj-wiz__scroll');
        if (archive) scroll.classList.add('subj-wiz__scroll');
        else form.appendChild(scroll);
        var panels = [];
        var steps = recipe || [{
            title: '主体信息',
            items: [
                { label: '主体名称', span: true, bar: true },
                { label: '主体类型' },
                { label: '联系人' },
                { label: '手机号码' },
                { label: '验证码' }
            ]
        }];
        var stepper = el('div', 'subj-wiz__stepper');
        var stepButtons = [];

        steps.forEach(function (step, index) {
            if (recipe && index > 0) stepper.appendChild(el('span', 'subj-wiz__line'));
            if (recipe) {
                var btn = el('button', 'subj-wiz__step');
                btn.type = 'button';
                btn.appendChild(el('span', 'subj-wiz__num', String(index + 1)));
                btn.appendChild(document.createTextNode(step.title));
                stepper.appendChild(btn);
                stepButtons.push(btn);
            }
            var panel = el('div', 'subj-wiz__panel');
            var grid = el('div', 'subj-wiz__grid');
            panel.appendChild(grid);
            scroll.appendChild(panel);
            panels.push(panel);
            (step.items || []).forEach(function (item) {
                if (item.caution) {
                    var caution = el('div', 'mdm-biz-tip subj-wiz__span');
                    caution.setAttribute('role', 'note');
                    caution.innerHTML = item.caution;
                    grid.appendChild(caution);
                    return;
                }
                if (item.sec) {
                    grid.appendChild(el('div', 'subj-wiz__sec', item.sec));
                    return;
                }
                var node = null;
                if (item.materials) node = take(function (n) { return n.hasAttribute && n.hasAttribute('data-entry-materials'); });
                else if (item.map) node = take(function (n) { return !!n.querySelector('.store-archive__map-mock'); });
                else if (item.collapse) node = take(function (n) { return labelOf(n) === item.collapse; });
                else if (item.label) {
                    node = take(function (n) {
                        var lab = labelOf(n);
                        if (lab === item.label) return true;
                        if (item.label === '手机号码' && (lab === '联系手机号' || lab === '店长手机号')) return true;
                        return false;
                    });
                }
                if (!node) return;
                if (item.span) node.classList.add('subj-wiz__span');
                if (item.bar) node.classList.add('subj-wiz__subject-bar');
                if (item.whenPartner) node.classList.add('subj-wiz__partner-only');
                if (item.partner) mountPartnerPills(node);
                grid.appendChild(node);
            });
        });

        var lastGrid = panels[panels.length - 1].querySelector('.subj-wiz__grid');
        function buried(node) {
            var parent = node.parentNode;
            while (parent && parent !== archive && parent !== form) {
                if (parent.style && parent.style.display === 'none') return true;
                parent = parent.parentNode;
            }
            return false;
        }
        pool.forEach(function (node) {
            if (used.indexOf(node) >= 0) return;
            if ((node.style && node.style.display === 'none') || buried(node)) {
                sink.appendChild(node);
                return;
            }
            node.classList.add('subj-wiz__span');
            lastGrid.appendChild(node);
        });

        if (recipe) form.insertBefore(stepper, scroll);
        if (archive) {
            Array.prototype.slice.call(archive.children).forEach(function (child) {
                if (panels.indexOf(child) >= 0 || child === sink) return;
                sink.appendChild(child);
            });
            archive.appendChild(sink);
        } else {
            form.appendChild(sink);
        }

        var saveBtn = footer.querySelector('.btn-primary');
        var cancelBtn = footer.querySelector('.btn-secondary');
        if (cancelBtn) cancelBtn.classList.add('subj-wiz__cancel');
        if (saveBtn) saveBtn.style.display = 'none';
        var prev = el('button', 'subj-wiz__prev', '上一步');
        prev.type = 'button';
        var next = el('button', 'subj-wiz__next', recipe ? '下一步' : '提交');
        next.type = 'button';
        footer.appendChild(prev);
        footer.appendChild(next);

        var index = 0;
        var partnerSel = null;
        form.querySelectorAll('select').forEach(function (sel) {
            var row = sel.closest('.store-form__row');
            if (row && labelOf(row) === '门店合作类型') partnerSel = sel;
        });

        function partnerOn() {
            return !!(partnerSel && partnerSel.value);
        }

        function syncPartnerOnly() {
            var on = partnerOn();
            modal.querySelectorAll('.subj-wiz__partner-only').forEach(function (node) {
                node.style.display = on ? '' : 'none';
            });
        }

        function show(nextIndex) {
            index = nextIndex;
            panels.forEach(function (panel, i) {
                panel.classList.toggle('is-on', i === index);
            });
            stepButtons.forEach(function (btn, i) {
                btn.classList.toggle('is-active', i === index);
                btn.classList.toggle('is-done', i < index);
            });
            prev.hidden = index === 0 || !recipe;
            next.textContent = !recipe || index === panels.length - 1 ? '提交' : '下一步';
            scroll.scrollTop = 0;
        }

        function clearErrors(scope) {
            (scope || modal).querySelectorAll('.subj-wiz__err').forEach(function (node) { node.remove(); });
            (scope || modal).querySelectorAll('.is-error').forEach(function (node) { node.classList.remove('is-error'); });
        }

        function mark(node, message) {
            node.classList.add('is-error');
            var tip = el('div', 'subj-wiz__err', message);
            node.appendChild(tip);
        }

        function visibleField(node) {
            if (!node || node.style.display === 'none') return false;
            var partnerHost = node.closest('.subj-wiz__partner-only');
            if (partnerHost && partnerHost.style.display === 'none') return false;
            if (node.closest('.subj-wiz__sink')) return false;
            return true;
        }

        function validatePanel(panel) {
            clearErrors(panel);
            var ok = true;
            panel.querySelectorAll('.modal-form-group, .store-form__row').forEach(function (node) {
                if (!visibleField(node)) return;
                if (node.closest('.store-form__collapse') && node.classList.contains('store-form__row')) {
                    var box = node.closest('.store-form__collapse');
                    if (box.style.display === 'none') return;
                }
                var upload = node.querySelector('[data-upload-required-msg]');
                if (upload && upload.getAttribute('data-upload-state') !== '1') {
                    mark(node, upload.getAttribute('data-upload-required-msg') || '请上传');
                    ok = false;
                    return;
                }
                var req = node.querySelector('[data-required-msg]');
                if (req && !req.disabled && !String(req.value || '').trim()) {
                    mark(node, req.getAttribute('data-required-msg') || '请填写');
                    ok = false;
                    return;
                }
                var aliasInput = node.querySelector('[data-supplier-alias], input[id$="supplierAlias"]');
                if (aliasInput && !aliasInput.disabled && global.MdmSupplierArchiveStore) {
                    var aliasError = global.MdmSupplierArchiveStore.validateAlias(aliasInput.value);
                    if (aliasError) {
                        mark(node, aliasError);
                        ok = false;
                        return;
                    }
                }
                var phone = node.querySelector('input[id$="addPhone"]');
                if (phone) {
                    var digits = String(phone.value || '').replace(/\D/g, '');
                    if (digits.length !== 11) {
                        mark(node, '请输入11位手机号码');
                        ok = false;
                        return;
                    }
                }
                var sms = node.querySelector('input[id$="smsCode"]');
                if (sms && String(sms.value || '').replace(/\D/g, '').length !== 6) {
                    mark(node, '请输入6位数字验证码');
                    ok = false;
                    return;
                }
                var named = node.querySelector('input[id$="subjectName"], input[id$="contactPerson"], input[id$="dockPerson"], input[id$="supplierAlias"]');
                if (named && !named.disabled && !String(named.value || '').trim()) {
                    var lab = labelOf(node) || '该项';
                    mark(node, named.id.indexOf('dockPerson') >= 0 ? '请选择绑定BD' : '请输入' + lab);
                    ok = false;
                }
            });
            var materials = panel.querySelector('[data-entry-materials]');
            if (materials && global.MdmEntryMaterials && typeof global.MdmEntryMaterials.validate === 'function') {
                var entryErr = global.MdmEntryMaterials.validate(materials);
                if (entryErr) {
                    mark(materials, entryErr);
                    ok = false;
                }
            }
            return ok;
        }

        function validateAll() {
            var i;
            for (i = 0; i < panels.length; i++) {
                if (!validatePanel(panels[i])) {
                    show(i);
                    return false;
                }
            }
            return true;
        }

        stepButtons.forEach(function (btn, i) {
            btn.addEventListener('click', function () {
                if (i >= index) return;
                show(i);
            });
        });
        prev.addEventListener('click', function () {
            if (index > 0) show(index - 1);
        });
        next.addEventListener('click', function () {
            if (!validatePanel(panels[index])) return;
            if (recipe && index < panels.length - 1) {
                show(index + 1);
                return;
            }
            if (!validateAll()) return;
            if (saveBtn) saveBtn.click();
        });
        if (partnerSel) {
            partnerSel.addEventListener('change', syncPartnerOnly);
        }

        modal.__subjWizReset = function () {
            clearErrors(modal);
            if (partnerSel && kind === '门店') {
                partnerSel.value = 'franchise';
                partnerSel.dispatchEvent(new Event('change'));
                var pills = modal.querySelectorAll('.subj-wiz__pill');
                pills.forEach(function (pill) {
                    pill.classList.toggle('is-on', pill.getAttribute('data-value') === 'franchise');
                });
            }
            syncPartnerOnly();
            paintPills();
            show(0);
        };
        function paintPills() {
            if (!partnerSel) return;
            modal.querySelectorAll('.subj-wiz__pill').forEach(function (pill) {
                pill.classList.toggle('is-on', pill.getAttribute('data-value') === partnerSel.value);
            });
        }
        syncPartnerOnly();
        paintPills();
        show(0);
    }

    function mountPartnerPills(row) {
        var sel = row.querySelector('select');
        var ctrl = row.querySelector('.store-form__control');
        if (!sel || !ctrl) return;
        sel.classList.add('subj-wiz__sr');
        var pills = el('div', 'subj-wiz__pills');
        Array.prototype.forEach.call(sel.options, function (opt) {
            if (!opt.value) return;
            var pill = el('button', 'subj-wiz__pill', opt.textContent);
            pill.type = 'button';
            pill.setAttribute('data-value', opt.value);
            pill.addEventListener('click', function () {
                sel.value = opt.value;
                sel.dispatchEvent(new Event('change'));
                pills.querySelectorAll('.subj-wiz__pill').forEach(function (one) {
                    one.classList.toggle('is-on', one === pill);
                });
            });
            pills.appendChild(pill);
        });
        ctrl.appendChild(pills);
        ctrl.appendChild(el('p', 'subj-wiz__hint', '三类均按加盟店资料填写'));
    }

    global.MdmSubjectAddWizard = { dress: dress };
})(window);
