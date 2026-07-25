/**
 * 会员等级 — 新增 / 编辑配置页
 */
(function () {
    'use strict';

    var Data = window.MdmMemberLevelData;
    if (!Data) return;

    var COUPON_OPTIONS = [
        { value: '满50减5券', label: '满50减5券', amount: '减5元', channel: '全渠道', validPeriod: '领取后7天有效', collectLimit: '不限', stock: '999', expired: false },
        { value: '满100减15券', label: '满100减15券', amount: '减15元', channel: 'APP/小程序', validPeriod: '2026-01-01~12-31', collectLimit: '每人3次', stock: '500', expired: false },
        { value: '满200减30券', label: '满200减30券', amount: '减30元', channel: '全渠道', validPeriod: '2026-03-01~09-30', collectLimit: '每人2次', stock: '200', expired: false },
        { value: '满300减50券', label: '满300减50券', amount: '减50元', channel: '门店自提', validPeriod: '领取后15天有效', collectLimit: '每人1次', stock: '100', expired: false },
        { value: '生日专属券', label: '生日专属券', amount: '减10元', channel: '全渠道', validPeriod: '生日当月有效', collectLimit: '每人1次', stock: '999', expired: false },
        { value: '免运费券', label: '免运费券', amount: '免运费', channel: '快递配送', validPeriod: '领取后3天有效', collectLimit: '每人2次', stock: '300', expired: false },
        { value: '新人专享券', label: '新人专享券', amount: '减8元', channel: 'APP/小程序', validPeriod: '领取后30天有效', collectLimit: '每人1次', stock: '800', expired: false },
        { value: '周末专享券', label: '周末专享券', amount: '9折', channel: '全渠道', validPeriod: '每周五~周日', collectLimit: '不限', stock: '999', expired: false },
        { value: '生鲜满减券', label: '生鲜满减券', amount: '减12元', channel: '全渠道', validPeriod: '2026-04-01~10-31', collectLimit: '每人3次', stock: '450', expired: false },
        { value: '过期满减券', label: '过期满减券', amount: '减20元', channel: '全渠道', validPeriod: '2025-01-01~12-31', collectLimit: '每人1次', stock: '0', expired: true }
    ];

    var MODE_OPTIONS = [
        { value: 'total', label: '累计' },
        { value: 'monthly', label: '每月' },
        { value: 'daily', label: '每日' }
    ];

    var EDIT_CACHE_KEY = 'mdm_member_level_edit_v1';
    var params = new URLSearchParams(window.location.search || '');
    var editId = params.get('id') || params.get('Id') || '';
    var list = Data.loadLevelList();
    var editItem = null;
    var growthLocked = false;
    var iconValue = '';
    var scopeState = Data.defaultDiscountScope();
    var isEdit = false;

    function findLevelById(id) {
        if (id == null || id === '') return null;
        var sid = String(id);
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].id) === sid) {
                return Data.normalizeLevel(list[i]);
            }
        }
        return null;
    }

    function loadEditCache() {
        try {
            var raw = sessionStorage.getItem(EDIT_CACHE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            if (editId && String(parsed.id) !== String(editId)) return null;
            return Data.normalizeLevel(parsed);
        } catch (e) {
            return null;
        }
    }

    function clearEditCache() {
        try {
            sessionStorage.removeItem(EDIT_CACHE_KEY);
        } catch (e) { /* ignore */ }
    }

    function resolveEditItem() {
        list = Data.loadLevelList();
        editItem = findLevelById(editId);
        if (!editItem && editId) {
            /* URL 带了 id 但列表未命中时，尝试列表页写入的缓存 */
            editItem = loadEditCache();
        } else if (!editItem && !editId) {
            /* 部分本地预览会丢 query，仅依赖缓存判断是否编辑 */
            editItem = loadEditCache();
            if (editItem && editItem.id) editId = String(editItem.id);
        }
        isEdit = !!editItem;
        growthLocked = isEdit && Data.isSystemPreset(editItem);
    }

    resolveEditItem();

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function escapeHtml(str) {
        return Data.escapeHtml(str);
    }

    function nowStr() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function genId() {
        return 'ML' + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);
    }

    function pageHref(filename) {
        if (window.wmsPath && typeof window.wmsPath.page === 'function') {
            return window.wmsPath.page(filename);
        }
        return filename;
    }

    function goList() {
        window.location.href = pageHref('mdm_member_level.html');
    }

    function setTitles() {
        var title = isEdit ? '编辑会员等级' : '新增会员等级';
        var crumb = isEdit ? '编辑' : '新增';
        var tab = document.getElementById('formTabTitle');
        var crumbEl = document.getElementById('formCrumb');
        if (tab) tab.textContent = title;
        if (crumbEl) crumbEl.textContent = crumb;
        document.title = '冷丰WMS - ' + title;
    }

    /* ---------- 图标上传 ---------- */
    function setupIconUpload() {
        var btn = document.getElementById('mlIconBtn');
        var fileInput = document.getElementById('mlIconFile');
        var clearBtn = document.getElementById('mlIconClear');

        function renderPreview() {
            if (!btn) return;
            if (!iconValue) {
                btn.innerHTML = '<span class="member-level-upload__plus">+</span>';
                btn.classList.remove('member-level-upload__box--filled');
                if (clearBtn) clearBtn.hidden = true;
                return;
            }
            btn.innerHTML = '<img class="member-level-upload__preview" src="" alt="">';
            btn.classList.add('member-level-upload__box--filled');
            var img = btn.querySelector('.member-level-upload__preview');
            if (img) img.src = iconValue;
            if (clearBtn) clearBtn.hidden = false;
        }

        renderPreview();

        if (btn && fileInput) {
            btn.addEventListener('click', function () {
                fileInput.click();
            });
            fileInput.addEventListener('change', function () {
                var file = fileInput.files && fileInput.files[0];
                if (!file) return;
                if (!/^image\/(jpeg|png|webp|svg\+xml)$/.test(file.type)) {
                    toast('请上传 JPG/PNG/WEBP/SVG 格式图片', 'warning');
                    fileInput.value = '';
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    toast('图片不能超过 2MB', 'warning');
                    fileInput.value = '';
                    return;
                }
                var reader = new FileReader();
                reader.onload = function () {
                    iconValue = reader.result;
                    renderPreview();
                };
                reader.readAsDataURL(file);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                iconValue = '';
                if (fileInput) fileInput.value = '';
                renderPreview();
            });
        }
    }

    /* ---------- 权益开关 ---------- */
    function setControlsDisabled(root, disabled) {
        if (!root) return;
        root.querySelectorAll('input, select, textarea, button').forEach(function (el) {
            if (el.getAttribute('data-benefit-switch') != null) return;
            el.disabled = !!disabled;
        });
    }

    function syncBenefitSwitch(field) {
        var sw = field.querySelector('[data-benefit-switch]');
        var body = field.querySelector('[data-benefit-body]');
        if (!sw || !body) return;
        var on = !!sw.checked;
        body.classList.toggle('is-disabled', !on);
        setControlsDisabled(body, !on);
        if (on && field.getAttribute('data-benefit') === 'memberDiscount') {
            syncScopeUi();
        }
    }

    function bindBenefitSwitches() {
        document.querySelectorAll('[data-benefit]').forEach(function (field) {
            var sw = field.querySelector('[data-benefit-switch]');
            if (!sw) return;
            sw.addEventListener('change', function () {
                syncBenefitSwitch(field);
            });
            syncBenefitSwitch(field);
        });
    }

    /* ---------- 优惠券选择器（弹窗，同会员管理-发放优惠券） ---------- */
    function syncCouponPickerTrigger(picker) {
        if (!picker) return;
        var hidden = picker.querySelector('[data-coupon-name]');
        var label = picker.querySelector('[data-coupon-label]');
        var trigger = picker.querySelector('[data-coupon-trigger]');
        var val = hidden ? hidden.value : '';
        if (label) label.textContent = val || '请选择优惠券';
        if (trigger) trigger.classList.toggle('is-placeholder', !val);
    }

    function createCouponPaginationBar(opts) {
        var page = opts.page;
        var pageSize = opts.pageSize;
        var total = opts.total;
        var onPage = opts.onPage;
        var maxPage = Math.max(1, Math.ceil(total / pageSize));
        var bar = document.createElement('div');
        bar.className = 'erp-pagination';
        var totalEl = document.createElement('span');
        totalEl.className = 'erp-pagination__total';
        totalEl.textContent = '共 ' + total + ' 条';
        bar.appendChild(totalEl);

        var mid = document.createElement('div');
        mid.className = 'erp-pagination__mid';
        var hint = document.createElement('span');
        hint.className = 'erp-pagination__hint';
        hint.textContent = pageSize + ' 条/页';
        mid.appendChild(hint);
        var pages = document.createElement('div');
        pages.className = 'erp-pagination__pages';
        var windowStart = Math.max(1, Math.min(page - 1, maxPage - 2));
        for (var p = windowStart; p <= Math.min(maxPage, windowStart + 2); p++) {
            (function (pp) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'erp-page-btn' + (pp === page ? ' is-active' : '');
                b.textContent = String(pp);
                b.addEventListener('click', function () { onPage(pp); });
                pages.appendChild(b);
            })(p);
        }
        mid.appendChild(pages);
        bar.appendChild(mid);

        var right = document.createElement('div');
        right.className = 'erp-pagination__right';
        var gotoLabel = document.createElement('span');
        gotoLabel.className = 'erp-pagination__goto-label';
        gotoLabel.textContent = '前往';
        right.appendChild(gotoLabel);
        var inp = document.createElement('input');
        inp.className = 'erp-pagination__goto-input';
        inp.type = 'number';
        inp.min = '1';
        inp.max = String(maxPage);
        inp.value = String(Math.min(page, maxPage));
        inp.addEventListener('change', function () {
            var v = Math.min(maxPage, Math.max(1, Number(inp.value) || 1));
            onPage(v);
        });
        right.appendChild(inp);
        var pageLabel = document.createElement('span');
        pageLabel.className = 'erp-pagination__goto-label';
        pageLabel.textContent = '页';
        right.appendChild(pageLabel);
        bar.appendChild(right);
        return bar;
    }

    function openCouponSelectModal(picker) {
        if (!picker) return;
        var hidden = picker.querySelector('[data-coupon-name]');
        var current = hidden ? hidden.value : '';
        var selectedValue = current || '';

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-ml-coupon-modal', '1');

        var modal = document.createElement('div');
        modal.className = 'erp-modal erp-modal--ml-coupon';

        var header = document.createElement('div');
        header.className = 'erp-modal__header';
        var title = document.createElement('h2');
        title.className = 'erp-modal__title';
        title.textContent = '选择优惠券';
        header.appendChild(title);
        var ha = document.createElement('div');
        ha.className = 'erp-modal__header-actions';
        var bx = document.createElement('button');
        bx.type = 'button';
        bx.className = 'erp-modal__header-btn';
        bx.innerHTML = '&times;';
        ha.appendChild(bx);
        header.appendChild(ha);

        var body = document.createElement('div');
        body.className = 'erp-modal__body';

        var tabs = document.createElement('div');
        tabs.className = 'member-coupon-tabs';
        var tab1 = document.createElement('button');
        tab1.type = 'button';
        tab1.className = 'member-coupon-tab is-active';
        tab1.textContent = '商品优惠券';
        tabs.appendChild(tab1);
        body.appendChild(tabs);

        var toolbar = document.createElement('div');
        toolbar.className = 'erp-toolbar member-coupon-toolbar';
        var searchInp = document.createElement('input');
        searchInp.className = 'erp-input member-coupon-search';
        searchInp.type = 'text';
        searchInp.placeholder = '请输入优惠券名称';
        searchInp.style.maxWidth = '280px';
        var searchBtn = document.createElement('button');
        searchBtn.type = 'button';
        searchBtn.className = 'erp-btn';
        searchBtn.textContent = '搜索';
        toolbar.appendChild(searchInp);
        toolbar.appendChild(searchBtn);
        body.appendChild(toolbar);

        var scroll = document.createElement('div');
        scroll.className = 'ml-coupon-table-wrap';
        var table = document.createElement('table');
        table.className = 'erp-table ml-coupon-table';
        var thead = document.createElement('thead');
        var trh = document.createElement('tr');
        ['优惠券名称', '减免金额', '适用渠道', '有效期', '领取限制', '剩余库存'].forEach(function (h) {
            var th = document.createElement('th');
            th.textContent = h;
            trh.appendChild(th);
        });
        thead.appendChild(trh);
        var tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        scroll.appendChild(table);
        body.appendChild(scroll);

        var pagHost = document.createElement('div');
        pagHost.className = 'member-coupon-pagination';
        body.appendChild(pagHost);

        var footer = document.createElement('div');
        footer.className = 'erp-modal__footer';
        var bCancel = document.createElement('button');
        bCancel.type = 'button';
        bCancel.className = 'erp-btn';
        bCancel.textContent = '取消';
        var bOk = document.createElement('button');
        bOk.type = 'button';
        bOk.className = 'erp-btn erp-btn--primary';
        bOk.textContent = '确定';
        footer.appendChild(bCancel);
        footer.appendChild(bOk);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        var couponPage = 1;
        var couponPageSize = 10;
        var couponKeyword = '';

        function filteredCoupons() {
            var k = couponKeyword.trim().toLowerCase();
            return COUPON_OPTIONS.filter(function (c) {
                if (c.expired) return false;
                return !k || String(c.label).toLowerCase().indexOf(k) !== -1;
            });
        }

        function close() {
            backdrop.remove();
        }

        function applySelection() {
            if (!selectedValue) {
                toast('请选择优惠券', 'warning');
                return;
            }
            if (hidden) hidden.value = selectedValue;
            syncCouponPickerTrigger(picker);
            close();
        }

        function paintCouponTable() {
            var all = filteredCoupons();
            var total = all.length;
            var maxPage = Math.max(1, Math.ceil(total / couponPageSize) || 1);
            if (couponPage > maxPage) couponPage = maxPage;
            var start = (couponPage - 1) * couponPageSize;
            var slice = all.slice(start, start + couponPageSize);

            tbody.innerHTML = '';
            if (!slice.length) {
                var emptyTr = document.createElement('tr');
                var emptyTd = document.createElement('td');
                emptyTd.colSpan = 6;
                emptyTd.className = 'member-level-coupon-picker__empty';
                emptyTd.style.textAlign = 'center';
                emptyTd.textContent = '无匹配优惠券';
                emptyTr.appendChild(emptyTd);
                tbody.appendChild(emptyTr);
            } else {
                slice.forEach(function (c) {
                    var tr = document.createElement('tr');
                    if (c.value === selectedValue) tr.className = 'is-selected';
                    tr.style.cursor = 'pointer';

                    var tdName = document.createElement('td');
                    tdName.className = 'ml-coupon-table__name';
                    var nameLabel = document.createElement('label');
                    nameLabel.className = 'ml-coupon-table__check';
                    var cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.value = c.value;
                    cb.checked = c.value === selectedValue;
                    var nameText = document.createElement('span');
                    nameText.textContent = c.label;
                    nameLabel.appendChild(cb);
                    nameLabel.appendChild(nameText);
                    tdName.appendChild(nameLabel);
                    tr.appendChild(tdName);

                    [c.amount, c.channel, c.validPeriod, c.collectLimit, c.stock].forEach(function (text) {
                        var td = document.createElement('td');
                        td.textContent = text;
                        tr.appendChild(td);
                    });

                    function pickThis(ev) {
                        if (ev) ev.stopPropagation();
                        selectedValue = c.value;
                        paintCouponTable();
                    }

                    cb.addEventListener('change', function (ev) {
                        if (cb.checked) {
                            selectedValue = c.value;
                        } else if (selectedValue === c.value) {
                            selectedValue = '';
                        }
                        paintCouponTable();
                        ev.stopPropagation();
                    });
                    tr.addEventListener('click', function (ev) {
                        if (ev.target === cb) return;
                        pickThis(ev);
                    });

                    tbody.appendChild(tr);
                });
            }

            pagHost.innerHTML = '';
            pagHost.appendChild(createCouponPaginationBar({
                page: couponPage,
                pageSize: couponPageSize,
                total: total,
                onPage: function (p) {
                    couponPage = p;
                    paintCouponTable();
                }
            }));
        }

        searchBtn.addEventListener('click', function () {
            couponKeyword = searchInp.value || '';
            couponPage = 1;
            paintCouponTable();
        });
        searchInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                couponKeyword = searchInp.value || '';
                couponPage = 1;
                paintCouponTable();
            }
        });
        bx.addEventListener('click', close);
        bCancel.addEventListener('click', close);
        bOk.addEventListener('click', applySelection);
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });

        paintCouponTable();
        document.body.appendChild(backdrop);
        searchInp.focus();
    }

    function bindCouponPicker(picker) {
        if (!picker || picker.getAttribute('data-bound') === '1') return;
        picker.setAttribute('data-bound', '1');

        var trigger = picker.querySelector('[data-coupon-trigger]');
        syncCouponPickerTrigger(picker);

        if (trigger) {
            trigger.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                if (trigger.disabled) return;
                openCouponSelectModal(picker);
            });
        }
    }

    function buildModeRadios(name, selected) {
        return MODE_OPTIONS.map(function (m) {
            return (
                '<label class="member-level-check-label">' +
                '<input type="radio" name="' + name + '" value="' + m.value + '"' +
                (selected === m.value ? ' checked' : '') + '> ' + m.label +
                '</label>'
            );
        }).join('');
    }

    function buildCouponRowHtml(item) {
        item = item || { coupon: '', qty: 1 };
        var selected = item.coupon || '';
        return (
            '<div class="member-level-coupon-row" data-coupon-row>' +
            '  <div class="member-level-coupon-picker" data-coupon-picker>' +
            '    <input type="hidden" data-coupon-name value="' + escapeHtml(selected) + '">' +
            '    <button type="button" class="member-level-coupon-picker__trigger' + (selected ? '' : ' is-placeholder') + '" data-coupon-trigger>' +
            '      <span data-coupon-label>' + escapeHtml(selected || '请选择优惠券') + '</span>' +
            '      <span>选择</span>' +
            '    </button>' +
            '  </div>' +
            '  <div class="member-level-coupon-qty">' +
            '    <input class="erp-input" type="number" min="1" step="1" value="' + escapeHtml(String(item.qty || 1)) + '" data-coupon-qty>' +
            '    <span class="member-level-unit__text">张</span>' +
            '  </div>' +
            '  <button type="button" class="member-level-coupon-remove" data-coupon-remove>删除</button>' +
            '</div>'
        );
    }

    function bindCouponBlock(blockEl) {
        if (!blockEl || blockEl.getAttribute('data-bound') === '1') return;
        blockEl.setAttribute('data-bound', '1');
        var listEl = blockEl.querySelector('[data-coupon-list]');
        var addBtn = blockEl.querySelector('[data-coupon-add]');

        blockEl.querySelectorAll('[data-coupon-picker]').forEach(bindCouponPicker);

        if (addBtn) {
            addBtn.addEventListener('click', function () {
                if (addBtn.disabled) return;
                listEl.insertAdjacentHTML('beforeend', buildCouponRowHtml({ coupon: '', qty: 1 }));
                var rows = listEl.querySelectorAll('[data-coupon-row]');
                var last = rows[rows.length - 1];
                if (last) bindCouponPicker(last.querySelector('[data-coupon-picker]'));
                var field = blockEl.closest('[data-benefit]');
                if (field) syncBenefitSwitch(field);
            });
        }

        blockEl.addEventListener('click', function (ev) {
            var removeBtn = ev.target.closest('[data-coupon-remove]');
            if (!removeBtn || removeBtn.disabled) return;
            var rows = listEl.querySelectorAll('[data-coupon-row]');
            if (rows.length <= 1) {
                toast('至少保留一行优惠券配置', 'warning');
                return;
            }
            var row = removeBtn.closest('[data-coupon-row]');
            if (row) row.remove();
        });
    }

    function initCouponBlock(prefix, mode, items) {
        var block = document.querySelector('[data-coupon-block="' + prefix + '"]');
        if (!block) return;
        var modes = block.querySelector('[data-coupon-modes]');
        var listEl = block.querySelector('[data-coupon-list]');
        if (modes) {
            if (prefix === 'birthday') {
                /* 生日送券固定生日月每年赠送一次，不展示累计/每月/每日 */
                modes.innerHTML = '';
                modes.hidden = true;
                modes.style.display = 'none';
            } else {
                modes.hidden = false;
                modes.style.display = '';
                modes.innerHTML = buildModeRadios(prefix + 'Mode', mode || 'total');
            }
        }
        var rows = (items && items.length)
            ? items.map(function (it) { return buildCouponRowHtml(it); }).join('')
            : buildCouponRowHtml({ coupon: '', qty: 1 });
        if (listEl) listEl.innerHTML = rows;
        bindCouponBlock(block);
    }

    function collectCoupons(blockEl) {
        var items = [];
        if (!blockEl) return items;
        blockEl.querySelectorAll('[data-coupon-row]').forEach(function (row) {
            var coupon = (row.querySelector('[data-coupon-name]') || {}).value || '';
            var qtyRaw = ((row.querySelector('[data-coupon-qty]') || {}).value || '').trim();
            items.push({
                coupon: coupon,
                qtyRaw: qtyRaw,
                qty: Number(qtyRaw)
            });
        });
        return items;
    }

    function getSelectedMode(name) {
        var el = document.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : 'total';
    }

    function validateCouponItems(items, label) {
        var filled = items.filter(function (it) { return !!it.coupon; });
        if (!filled.length) {
            return { ok: false, message: '请至少选择一种' + label };
        }
        var seen = {};
        for (var i = 0; i < filled.length; i++) {
            var it = filled[i];
            if (!it.qtyRaw || isNaN(it.qty) || it.qty < 1 || !/^\d+$/.test(it.qtyRaw)) {
                return { ok: false, message: label + '发放数量须为正整数' };
            }
            if (seen[it.coupon]) {
                return { ok: false, message: label + '中优惠券不能重复' };
            }
            seen[it.coupon] = true;
        }
        return {
            ok: true,
            items: filled.map(function (it) {
                return { coupon: it.coupon, qty: it.qty };
            })
        };
    }

    /* ---------- 折扣适用范围 ---------- */
    function isProductScope(type) {
        return type === 'include_product' || type === 'exclude_product';
    }

    function isCategoryScope(type) {
        return type === 'include_category' || type === 'exclude_category';
    }

    function getScopeSelectedItems() {
        if (isProductScope(scopeState.type)) return scopeState.products || [];
        if (isCategoryScope(scopeState.type)) return scopeState.categories || [];
        return [];
    }

    function renderScopeChips() {
        var chipsEl = document.getElementById('mlScopeChips');
        var emptyEl = document.getElementById('mlScopeEmpty');
        if (!chipsEl) return;
        var items = getScopeSelectedItems();
        if (!items.length) {
            chipsEl.innerHTML = '';
            if (emptyEl) emptyEl.hidden = scopeState.type === 'all';
            return;
        }
        if (emptyEl) emptyEl.hidden = true;
        chipsEl.innerHTML = items.map(function (it) {
            return (
                '<span class="member-level-scope-chip" data-id="' + escapeHtml(it.id) + '">' +
                '<span>' + escapeHtml(it.name) + '</span>' +
                '<button type="button" class="member-level-scope-chip__remove" data-scope-remove aria-label="移除">&times;</button>' +
                '</span>'
            );
        }).join('');
    }

    function syncScopeUi() {
        var typeEl = document.querySelector('input[name="mlScopeType"]:checked');
        var type = typeEl ? typeEl.value : 'all';
        scopeState.type = type;
        if (type === 'all') {
            scopeState.products = [];
            scopeState.categories = [];
        } else if (isProductScope(type)) {
            scopeState.categories = [];
        } else if (isCategoryScope(type)) {
            scopeState.products = [];
        }

        var pickWrap = document.getElementById('mlScopePickWrap');
        var pickBtn = document.getElementById('mlScopePickBtn');
        var hint = document.getElementById('mlScopePickHint');
        var chipsEl = document.getElementById('mlScopeChips');
        var emptyEl = document.getElementById('mlScopeEmpty');
        var needPick = type !== 'all';
        // 全部商品时不展示选择商品/类目按钮
        if (pickWrap) pickWrap.hidden = !needPick;
        if (chipsEl) chipsEl.hidden = !needPick;
        if (emptyEl && !needPick) emptyEl.hidden = true;
        if (pickBtn) {
            if (isProductScope(type)) pickBtn.textContent = '选择商品';
            else if (isCategoryScope(type)) pickBtn.textContent = '选择类目';
        }
        if (hint) {
            hint.textContent = isProductScope(type)
                ? '可多选商品'
                : (isCategoryScope(type) ? '可多选类目' : '');
        }
        if (needPick) renderScopeChips();
        else if (chipsEl) chipsEl.innerHTML = '';
    }

    function formatProductPrice(product) {
        var skus = product.skus || [];
        if (!skus.length) return '—';
        var prices = skus.map(function (s) { return Number(s.price); }).filter(function (n) {
            return !isNaN(n);
        });
        if (!prices.length) return '—';
        var min = Math.min.apply(null, prices);
        var max = Math.max.apply(null, prices);
        function fmt(n) {
            return '¥' + (Math.round(n * 100) / 100).toFixed(2);
        }
        if (min === max) return fmt(min);
        return fmt(min) + ' ~ ' + fmt(max);
    }

    function formatProductSkuCodes(product) {
        var skus = product.skus || [];
        if (!skus.length) return '—';
        return skus.map(function (s) { return s.code; }).join(' / ');
    }

    function getCategoryName(categoryId) {
        for (var i = 0; i < Data.DEMO_CATEGORIES.length; i++) {
            if (Data.DEMO_CATEGORIES[i].id === categoryId) return Data.DEMO_CATEGORIES[i].name;
        }
        return '';
    }

    function openScopePicker() {
        var type = scopeState.type;
        if (type === 'all') return;
        var isProduct = isProductScope(type);
        var selectedMap = {};
        getScopeSelectedItems().forEach(function (it) {
            selectedMap[it.id] = true;
        });

        if (isProduct) {
            openProductScopePicker(selectedMap);
            return;
        }
        openCategoryScopePicker(selectedMap);
    }

    function openCategoryScopePicker(selectedMap) {
        var catalog = Data.DEMO_CATEGORIES;
        var backdrop = document.createElement('div');
        backdrop.className = 'member-level-pick-backdrop';
        backdrop.innerHTML =
            '<div class="member-level-pick-modal" role="dialog" aria-modal="true">' +
            '  <div class="member-level-pick-modal__header">' +
            '    <h3 class="member-level-pick-modal__title">选择类目</h3>' +
            '    <button type="button" class="member-level-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
            '  </div>' +
            '  <div class="member-level-pick-modal__body">' +
            '    <input class="erp-input member-level-pick-filter" type="text" placeholder="输入类目名称筛选" data-pick-filter>' +
            '    <div class="member-level-pick-list" data-pick-list></div>' +
            '  </div>' +
            '  <div class="member-level-pick-modal__footer">' +
            '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var listEl = backdrop.querySelector('[data-pick-list]');
        var filterEl = backdrop.querySelector('[data-pick-filter]');

        function renderList(keyword) {
            var kw = String(keyword || '').trim().toLowerCase();
            var filtered = catalog.filter(function (it) {
                if (!kw) return true;
                return String(it.name).toLowerCase().indexOf(kw) !== -1;
            });
            if (!filtered.length) {
                listEl.innerHTML = '<div class="member-level-coupon-picker__empty">无匹配项</div>';
                return;
            }
            listEl.innerHTML = filtered.map(function (it) {
                return (
                    '<label class="member-level-pick-item">' +
                    '<input type="checkbox" value="' + escapeHtml(it.id) + '"' +
                    (selectedMap[it.id] ? ' checked' : '') + '>' +
                    '<span>' + escapeHtml(it.name) + '</span>' +
                    '</label>'
                );
            }).join('');
        }

        renderList('');

        filterEl.addEventListener('input', function () {
            renderList(filterEl.value);
        });

        listEl.addEventListener('change', function (ev) {
            var input = ev.target;
            if (!input || input.type !== 'checkbox') return;
            if (input.checked) selectedMap[input.value] = true;
            else delete selectedMap[input.value];
        });

        function close() {
            backdrop.remove();
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });
        backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
            btn.addEventListener('click', close);
        });
        backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
            scopeState.categories = catalog.filter(function (it) {
                return !!selectedMap[it.id];
            }).map(function (it) {
                return { id: it.id, name: it.name };
            });
            scopeState.products = [];
            renderScopeChips();
            close();
        });

        document.body.appendChild(backdrop);
        filterEl.focus();
    }

    function openProductScopePicker(selectedMap) {
        var catalog = Data.DEMO_PRODUCTS;
        var filterState = {
            categoryId: '',
            name: '',
            sku: ''
        };

        var catOptions = Data.DEMO_CATEGORIES.map(function (c) {
            return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
        }).join('');

        var backdrop = document.createElement('div');
        backdrop.className = 'member-level-pick-backdrop';
        backdrop.innerHTML =
            '<div class="member-level-pick-modal member-level-pick-modal--product" role="dialog" aria-modal="true">' +
            '  <div class="member-level-pick-modal__header">' +
            '    <h3 class="member-level-pick-modal__title">选择商品</h3>' +
            '    <button type="button" class="member-level-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
            '  </div>' +
            '  <div class="member-level-pick-modal__body">' +
            '    <div class="member-level-product-filter">' +
            '      <select class="erp-select member-level-product-filter__cat" data-pick-cat>' +
            '        <option value="">全部类目</option>' + catOptions +
            '      </select>' +
            '      <input class="erp-input" type="text" placeholder="商品名称" data-pick-name>' +
            '      <input class="erp-input" type="text" placeholder="SKU 编码" data-pick-sku>' +
            '      <button type="button" class="erp-btn" data-pick-search>搜索</button>' +
            '    </div>' +
            '    <div class="erp-table-scroll member-level-product-table-wrap">' +
            '      <table class="erp-table member-level-product-table">' +
            '        <thead><tr>' +
            '          <th style="width:40px;"></th>' +
            '          <th style="width:64px;">图片</th>' +
            '          <th>商品名称</th>' +
            '          <th>SKU 编码</th>' +
            '          <th style="width:120px;">价格</th>' +
            '        </tr></thead>' +
            '        <tbody data-pick-list></tbody>' +
            '      </table>' +
            '    </div>' +
            '  </div>' +
            '  <div class="member-level-pick-modal__footer">' +
            '    <span class="member-level-field-tip" data-pick-count style="margin:0;margin-right:auto;"></span>' +
            '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var listEl = backdrop.querySelector('[data-pick-list]');
        var catEl = backdrop.querySelector('[data-pick-cat]');
        var nameEl = backdrop.querySelector('[data-pick-name]');
        var skuEl = backdrop.querySelector('[data-pick-sku]');
        var countEl = backdrop.querySelector('[data-pick-count]');

        function syncCount() {
            var n = Object.keys(selectedMap).length;
            if (countEl) countEl.textContent = n ? ('已选 ' + n + ' 件商品') : '';
        }

        function matchProduct(it) {
            if (filterState.categoryId && it.categoryId !== filterState.categoryId) return false;
            var nameKw = filterState.name.trim().toLowerCase();
            if (nameKw && String(it.name).toLowerCase().indexOf(nameKw) === -1) return false;
            var skuKw = filterState.sku.trim().toLowerCase();
            if (skuKw) {
                var skus = it.skus || [];
                var hit = skus.some(function (s) {
                    return String(s.code).toLowerCase().indexOf(skuKw) !== -1;
                });
                if (!hit) return false;
            }
            return true;
        }

        function renderList() {
            var filtered = catalog.filter(matchProduct);
            if (!filtered.length) {
                listEl.innerHTML =
                    '<tr><td colspan="5" class="member-level-coupon-picker__empty" style="text-align:center;">无匹配商品</td></tr>';
                return;
            }
            listEl.innerHTML = filtered.map(function (it) {
                var img = it.image
                    ? '<img class="member-level-product-thumb" src="' + escapeHtml(it.image) + '" alt="">'
                    : '<span class="member-level-product-thumb member-level-product-thumb--empty">无图</span>';
                return (
                    '<tr class="member-level-product-row' + (selectedMap[it.id] ? ' is-checked' : '') + '">' +
                    '  <td><input type="checkbox" value="' + escapeHtml(it.id) + '"' +
                    (selectedMap[it.id] ? ' checked' : '') + '></td>' +
                    '  <td>' + img + '</td>' +
                    '  <td>' +
                    '    <div class="member-level-product-name">' + escapeHtml(it.name) + '</div>' +
                    '    <div class="member-level-product-cat">' + escapeHtml(getCategoryName(it.categoryId) || '—') + '</div>' +
                    '  </td>' +
                    '  <td class="member-level-product-sku">' + escapeHtml(formatProductSkuCodes(it)) + '</td>' +
                    '  <td class="member-level-product-price">' + escapeHtml(formatProductPrice(it)) + '</td>' +
                    '</tr>'
                );
            }).join('');
        }

        function applyFilter() {
            filterState.categoryId = catEl ? catEl.value : '';
            filterState.name = nameEl ? nameEl.value : '';
            filterState.sku = skuEl ? skuEl.value : '';
            renderList();
        }

        renderList();
        syncCount();

        backdrop.querySelector('[data-pick-search]').addEventListener('click', applyFilter);
        [nameEl, skuEl].forEach(function (el) {
            if (!el) return;
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') applyFilter();
            });
        });
        if (catEl) {
            catEl.addEventListener('change', applyFilter);
        }

        listEl.addEventListener('change', function (ev) {
            var input = ev.target;
            if (!input || input.type !== 'checkbox') return;
            if (input.checked) selectedMap[input.value] = true;
            else delete selectedMap[input.value];
            var row = input.closest('tr');
            if (row) row.classList.toggle('is-checked', input.checked);
            syncCount();
        });

        function close() {
            backdrop.remove();
        }

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });
        backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
            btn.addEventListener('click', close);
        });
        backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
            scopeState.products = catalog.filter(function (it) {
                return !!selectedMap[it.id];
            }).map(function (it) {
                return { id: it.id, name: it.name };
            });
            scopeState.categories = [];
            renderScopeChips();
            close();
        });

        document.body.appendChild(backdrop);
        if (nameEl) nameEl.focus();
    }

    function bindScopeUi() {
        document.querySelectorAll('input[name="mlScopeType"]').forEach(function (radio) {
            radio.addEventListener('change', syncScopeUi);
        });
        var pickBtn = document.getElementById('mlScopePickBtn');
        if (pickBtn) {
            pickBtn.addEventListener('click', function () {
                if (pickBtn.disabled) return;
                openScopePicker();
            });
        }
        var chipsEl = document.getElementById('mlScopeChips');
        if (chipsEl) {
            chipsEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-scope-remove]');
                if (!btn) return;
                var chip = btn.closest('[data-id]');
                if (!chip) return;
                var id = chip.getAttribute('data-id');
                if (isProductScope(scopeState.type)) {
                    scopeState.products = (scopeState.products || []).filter(function (it) {
                        return it.id !== id;
                    });
                } else if (isCategoryScope(scopeState.type)) {
                    scopeState.categories = (scopeState.categories || []).filter(function (it) {
                        return it.id !== id;
                    });
                }
                renderScopeChips();
            });
        }
    }

    /* ---------- 填充 / 保存 ---------- */
    function fillForm() {
        var item = editItem || Data.normalizeLevel({
            name: '',
            icon: '',
            growthValue: '',
            giftPointsEnabled: false,
            giftPoints: 0,
            giftPointsDesc: '',
            giftCouponEnabled: false,
            giftCouponMode: 'total',
            giftCoupons: [],
            giftCouponDesc: '',
            memberDiscountEnabled: false,
            memberDiscount: 100,
            memberDiscountDesc: '',
            discountScope: Data.defaultDiscountScope(),
            pointsRatioEnabled: false,
            pointsRatio: 100,
            pointsRatioDesc: '',
            birthdayEnabled: false,
            birthdayCouponMode: 'total',
            birthdayCoupons: [{ coupon: '生日专属券', qty: 1 }],
            birthdayDesc: ''
        });

        function setVal(id, value) {
            var el = document.getElementById(id);
            if (el) el.value = value;
        }
        function setChecked(id, on) {
            var el = document.getElementById(id);
            if (el) el.checked = !!on;
        }

        setVal('mlName', item.name || '');
        iconValue = item.icon || '';

        var growthInput = document.getElementById('mlGrowth');
        if (growthInput) {
            growthInput.value = item.growthValue === '' || item.growthValue == null ? '' : String(item.growthValue);
            growthInput.disabled = growthLocked;
        }
        var tip = document.getElementById('mlGrowthTip');
        if (tip) {
            tip.textContent = growthLocked
                ? '默认等级，成长值固定为 0，不可修改。'
                : '列表按成长值从低到高排序；达标后立即升级生效，降级于每日统一处理。成长值 0 为默认等级专用，新增不可使用。';
        }

        setChecked('mlGiftPointsEnable', item.giftPointsEnabled);
        setVal('mlGiftPoints', item.giftPoints != null ? String(item.giftPoints) : '0');
        setVal('mlGiftPointsDesc', item.giftPointsDesc || '');

        setChecked('mlGiftCouponEnable', item.giftCouponEnabled);
        setVal('mlGiftCouponDesc', item.giftCouponDesc || '');
        initCouponBlock('gift', item.giftCouponMode || 'total', item.giftCoupons || []);

        setChecked('mlDiscountEnable', item.memberDiscountEnabled);
        setVal('mlDiscount', item.memberDiscount != null ? String(item.memberDiscount) : '100');
        setVal('mlDiscountDesc', item.memberDiscountDesc || '');
        scopeState = Data.normalizeDiscountScope(item.discountScope);
        var scopeRadios = document.querySelectorAll('input[name="mlScopeType"]');
        scopeRadios.forEach(function (radio) {
            radio.checked = radio.value === scopeState.type;
        });

        setChecked('mlPointsRatioEnable', item.pointsRatioEnabled);
        setVal('mlPointsRatio', item.pointsRatio != null ? String(item.pointsRatio) : '100');
        setVal('mlPointsRatioDesc', item.pointsRatioDesc || '');

        setChecked('mlBirthdayEnable', item.birthdayEnabled);
        setVal('mlBirthdayDesc', item.birthdayDesc || '');
        initCouponBlock(
            'birthday',
            item.birthdayCouponMode || 'total',
            (item.birthdayCoupons && item.birthdayCoupons.length)
                ? item.birthdayCoupons
                : [{ coupon: '生日专属券', qty: 1 }]
        );
    }

    function save() {
        var levelName = (document.getElementById('mlName').value || '').trim();
        var growthRaw = (document.getElementById('mlGrowth').value || '').trim();

        if (!levelName) {
            toast('请输入等级名称', 'warning');
            return;
        }
        if (levelName.length > Data.NAME_MAX) {
            toast('等级名称不能超过 ' + Data.NAME_MAX + ' 字', 'warning');
            return;
        }
        if (!iconValue) {
            toast('请上传等级图标', 'warning');
            return;
        }
        if (growthRaw === '' || isNaN(Number(growthRaw)) || Number(growthRaw) < 0 || !/^\d+$/.test(growthRaw)) {
            toast('请输入有效的成长值（非负整数）', 'warning');
            return;
        }
        var growthNum = Number(growthRaw);
        if (growthLocked) {
            growthNum = 0;
        } else if (growthNum === 0) {
            toast('成长值 0 为默认等级专用，不可新增或修改为 0', 'warning');
            return;
        }

        var nameDup = list.some(function (it) {
            return it.name === levelName && (!isEdit || it.id !== editItem.id);
        });
        if (nameDup) {
            toast('等级名称已存在', 'warning');
            return;
        }
        var growthDup = list.some(function (it) {
            return Number(it.growthValue) === growthNum && (!isEdit || it.id !== editItem.id);
        });
        if (growthDup) {
            toast('已存在相同成长值的等级，请调整', 'warning');
            return;
        }

        if (!isEdit && list.length >= Data.LEVEL_MAX) {
            toast('最多可设置 ' + Data.LEVEL_MAX + ' 个会员等级', 'warning');
            return;
        }

        var giftPointsEnabled = document.getElementById('mlGiftPointsEnable').checked;
        var giftPointsNum = 0;
        var giftPointsDesc = (document.getElementById('mlGiftPointsDesc').value || '');
        if (giftPointsEnabled) {
            var giftPointsRaw = (document.getElementById('mlGiftPoints').value || '').trim();
            giftPointsNum = giftPointsRaw === '' ? NaN : Number(giftPointsRaw);
            if (isNaN(giftPointsNum) || giftPointsNum < 0 || !/^\d+$/.test(giftPointsRaw)) {
                toast('赠送积分须为非负整数', 'warning');
                return;
            }
        }

        var giftCouponEnabled = document.getElementById('mlGiftCouponEnable').checked;
        var giftMode = getSelectedMode('giftMode');
        var giftCoupons = [];
        var giftCouponDesc = document.getElementById('mlGiftCouponDesc').value || '';
        if (giftCouponEnabled) {
            var giftBlock = document.querySelector('[data-coupon-block="gift"]');
            var giftResult = validateCouponItems(collectCoupons(giftBlock), '赠送券');
            if (!giftResult.ok) {
                toast(giftResult.message, 'warning');
                return;
            }
            giftCoupons = giftResult.items;
        }

        var memberDiscountEnabled = document.getElementById('mlDiscountEnable').checked;
        var discountNum = 100;
        var memberDiscountDesc = document.getElementById('mlDiscountDesc').value || '';
        var discountScope = Data.defaultDiscountScope();
        if (memberDiscountEnabled) {
            var discountRaw = (document.getElementById('mlDiscount').value || '').trim();
            discountNum = discountRaw === '' ? NaN : Number(discountRaw);
            if (isNaN(discountNum) || discountNum < 1 || discountNum > 100 || !/^\d+$/.test(discountRaw)) {
                toast('商品会员折扣请填写 1~100 的整数', 'warning');
                return;
            }
            syncScopeUi();
            discountScope = Data.normalizeDiscountScope(scopeState);
            if (discountScope.type !== 'all') {
                var scopeItems = isProductScope(discountScope.type)
                    ? discountScope.products
                    : discountScope.categories;
                if (!scopeItems.length) {
                    toast('请选择折扣适用范围', 'warning');
                    return;
                }
            }
        }

        var pointsRatioEnabled = document.getElementById('mlPointsRatioEnable').checked;
        var ratioNum = 100;
        var pointsRatioDesc = document.getElementById('mlPointsRatioDesc').value || '';
        if (pointsRatioEnabled) {
            var ratioRaw = (document.getElementById('mlPointsRatio').value || '').trim();
            ratioNum = ratioRaw === '' ? NaN : Number(ratioRaw);
            if (isNaN(ratioNum) || ratioNum < 100 || !/^\d+$/.test(ratioRaw)) {
                toast('积分等级赠送比例须为不小于 100 的整数', 'warning');
                return;
            }
        }

        var birthdayEnabled = document.getElementById('mlBirthdayEnable').checked;
        /* 生日送券：生日月赠送，每年一次，不区分每月/每日 */
        var birthdayMode = 'total';
        var birthdayCoupons = [];
        var birthdayDesc = document.getElementById('mlBirthdayDesc').value || '';
        if (birthdayEnabled) {
            var birthBlock = document.querySelector('[data-coupon-block="birthday"]');
            var birthdayResult = validateCouponItems(collectCoupons(birthBlock), '生日券');
            if (!birthdayResult.ok) {
                toast(birthdayResult.message, 'warning');
                return;
            }
            birthdayCoupons = birthdayResult.items;
        }

        var payload = Data.normalizeLevel({
            name: levelName,
            icon: iconValue,
            growthValue: growthNum,
            giftPointsEnabled: giftPointsEnabled,
            giftPoints: giftPointsEnabled ? giftPointsNum : 0,
            giftPointsDesc: giftPointsDesc,
            giftCouponEnabled: giftCouponEnabled,
            giftCouponMode: giftMode,
            giftCoupons: giftCoupons,
            giftCouponDesc: giftCouponDesc,
            memberDiscountEnabled: memberDiscountEnabled,
            memberDiscount: memberDiscountEnabled ? discountNum : 100,
            memberDiscountDesc: memberDiscountDesc,
            discountScope: discountScope,
            pointsRatioEnabled: pointsRatioEnabled,
            pointsRatio: pointsRatioEnabled ? ratioNum : 100,
            pointsRatioDesc: pointsRatioDesc,
            birthdayEnabled: birthdayEnabled,
            birthdayCouponMode: birthdayMode,
            birthdayCoupons: birthdayCoupons,
            birthdayDesc: birthdayDesc,
            updatedAt: nowStr()
        });

        if (isEdit) {
            for (var k = 0; k < list.length; k++) {
                if (list[k].id === editItem.id) {
                    payload.id = editItem.id;
                    payload.memberCount = editItem.memberCount;
                    payload.status = editItem.status;
                    list[k] = payload;
                    break;
                }
            }
            Data.saveLevelList(list);
            clearEditCache();
            toast('会员等级已更新', 'success');
        } else {
            payload.id = genId();
            payload.memberCount = 0;
            payload.status = '启用';
            list.push(payload);
            Data.saveLevelList(list);
            clearEditCache();
            toast('会员等级已新增', 'success');
        }

        setTimeout(goList, 400);
    }

    function bindEvents() {
        var back = document.getElementById('btnBackList');
        if (back) {
            back.addEventListener('click', function (ev) {
                ev.preventDefault();
                clearEditCache();
                goList();
            });
        }
        var cancel = document.getElementById('btnCancel');
        if (cancel) {
            cancel.addEventListener('click', function () {
                clearEditCache();
                goList();
            });
        }
        var saveBtn = document.getElementById('btnSave');
        if (saveBtn) saveBtn.addEventListener('click', save);
    }

    function boot() {
        resolveEditItem();

        if (editId && !editItem) {
            toast('未找到该会员等级', 'warning');
            clearEditCache();
            setTimeout(goList, 600);
            return;
        }

        setTitles();
        fillForm();
        setupIconUpload();
        bindScopeUi();
        syncScopeUi();
        bindBenefitSwitches();
        bindEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
