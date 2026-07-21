/**
 * 会员等级 — 列表（按成长值升序）、新增/编辑（最多10级）、启禁用、删除
 * 赠送券 / 生日券：累计|每月|每日，支持多券及发放数量
 */
(function () {
    var LEVEL_MAX = 10;
    var NAME_MAX = 20;

    var COUPON_OPTIONS = [
        { value: '满50减5券', label: '满50减5券' },
        { value: '满100减15券', label: '满100减15券' },
        { value: '满200减30券', label: '满200减30券' },
        { value: '满300减50券', label: '满300减50券' },
        { value: '生日专属券', label: '生日专属券' },
        { value: '免运费券', label: '免运费券' },
        { value: '新人专享券', label: '新人专享券' },
        { value: '周末专享券', label: '周末专享券' },
        { value: '生鲜满减券', label: '生鲜满减券' }
    ];

    var MODE_LABEL = {
        total: '累计赠送',
        monthly: '每月赠送',
        daily: '每日赠送'
    };

    var state = {
        page: 1,
        pageSize: 10,
        filter: {
            levelName: '',
            status: ''
        },
        list: [
            {
                id: 'ML10004',
                name: '普通会员',
                growthValue: 0,
                giftPoints: 0,
                giftCouponMode: 'total',
                giftCoupons: [],
                memberDiscount: 100,
                pointsRatio: 100,
                birthdayEnabled: false,
                birthdayCouponMode: 'total',
                birthdayCoupons: [],
                memberCount: 5620,
                updatedAt: '2026-04-15 09:12:08',
                status: '启用'
            },
            {
                id: 'ML10003',
                name: '银牌会员',
                growthValue: 2000,
                giftPoints: 100,
                giftCouponMode: 'total',
                giftCoupons: [
                    { coupon: '满50减5券', qty: 2 },
                    { coupon: '免运费券', qty: 1 }
                ],
                memberDiscount: 95,
                pointsRatio: 120,
                birthdayEnabled: true,
                birthdayCouponMode: 'total',
                birthdayCoupons: [
                    { coupon: '生日专属券', qty: 1 },
                    { coupon: '免运费券', qty: 1 }
                ],
                memberCount: 1280,
                updatedAt: '2026-04-18 15:30:44',
                status: '启用'
            },
            {
                id: 'ML10002',
                name: '金牌会员',
                growthValue: 5000,
                giftPoints: 200,
                giftCouponMode: 'monthly',
                giftCoupons: [
                    { coupon: '满100减15券', qty: 1 },
                    { coupon: '满50减5券', qty: 2 }
                ],
                memberDiscount: 90,
                pointsRatio: 150,
                birthdayEnabled: true,
                birthdayCouponMode: 'total',
                birthdayCoupons: [
                    { coupon: '生日专属券', qty: 2 }
                ],
                memberCount: 312,
                updatedAt: '2026-04-20 10:22:11',
                status: '启用'
            },
            {
                id: 'ML10001',
                name: '钻石会员',
                growthValue: 10000,
                giftPoints: 500,
                giftCouponMode: 'daily',
                giftCoupons: [
                    { coupon: '满200减30券', qty: 1 },
                    { coupon: '满100减15券', qty: 1 },
                    { coupon: '免运费券', qty: 1 }
                ],
                memberDiscount: 85,
                pointsRatio: 200,
                birthdayEnabled: true,
                birthdayCouponMode: 'monthly',
                birthdayCoupons: [
                    { coupon: '生日专属券', qty: 1 },
                    { coupon: '满200减30券', qty: 1 }
                ],
                memberCount: 86,
                updatedAt: '2026-04-20 10:22:11',
                status: '启用'
            }
        ]
    };

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function nowStr() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function genId(prefix) {
        return prefix + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);
    }

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function sortByGrowthAsc(list) {
        return list.slice().sort(function (a, b) {
            if (a.growthValue !== b.growthValue) return a.growthValue - b.growthValue;
            return String(a.name).localeCompare(String(b.name), 'zh-CN');
        });
    }

    function getFilteredList() {
        var f = state.filter;
        return sortByGrowthAsc(state.list.filter(function (item) {
            if (f.levelName && item.name.indexOf(f.levelName) === -1) return false;
            if (f.status && item.status !== f.status) return false;
            return true;
        }));
    }

    function findById(id) {
        for (var i = 0; i < state.list.length; i++) {
            if (state.list[i].id === id) return state.list[i];
        }
        return null;
    }

    function updateCountHint() {
        var el = document.getElementById('levelCountHint');
        if (el) el.textContent = '已设置 ' + state.list.length + ' / ' + LEVEL_MAX + ' 个等级';
    }

    function formatCouponList(mode, items) {
        if (!items || !items.length) return '';
        var modeText = MODE_LABEL[mode] || MODE_LABEL.total;
        var detail = items.map(function (it) {
            return it.coupon + '×' + it.qty;
        }).join('、');
        return modeText + '：' + detail;
    }

    function formatBenefitSummary(item) {
        var parts = [];
        if (item.giftPoints > 0) parts.push('赠积分 ' + item.giftPoints);
        var giftText = formatCouponList(item.giftCouponMode, item.giftCoupons);
        if (giftText) parts.push('赠券（' + giftText + '）');
        if (item.memberDiscount != null && item.memberDiscount < 100) {
            parts.push('会员折扣 ' + (item.memberDiscount / 10).toFixed(1).replace(/\.0$/, '') + ' 折');
        } else {
            parts.push('会员折扣 无');
        }
        parts.push('积分倍率 ' + (item.pointsRatio / 100).toFixed(2).replace(/\.?0+$/, '') + ' 倍');
        if (item.birthdayEnabled) {
            var birthText = formatCouponList(item.birthdayCouponMode, item.birthdayCoupons);
            parts.push(birthText ? '生日券（' + birthText + '）' : '生日券 已开启');
        } else {
            parts.push('生日券 无');
        }
        return parts.map(function (p) {
            return '<span>' + escapeHtml(p) + '</span>';
        }).join('');
    }

    function closeModal() {
        var backdrop = document.querySelector('[data-member-level-modal]');
        if (backdrop) backdrop.remove();
    }

    function closeWarmConfirm() {
        var backdrop = document.querySelector('[data-member-level-warm]');
        if (backdrop) backdrop.remove();
    }

    function openWarmConfirm(message, onConfirm) {
        closeWarmConfirm();
        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
        backdrop.setAttribute('data-member-level-warm', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--confirm">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">温馨提示</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body">' +
            '    <div class="erp-modal-confirm__row">' +
            '      <div class="erp-modal-confirm__icon">!</div>' +
            '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__footer">' +
            '    <button type="button" class="erp-btn" data-warm-cancel>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
            '  </div>' +
            '</div>';

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeWarmConfirm();
        });
        backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
            btn.addEventListener('click', closeWarmConfirm);
        });
        backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
            closeWarmConfirm();
            if (typeof onConfirm === 'function') onConfirm();
        });
        document.body.appendChild(backdrop);
    }

    function buildModeRadios(name, selected) {
        var modes = [
            { value: 'total', label: '累计赠送' },
            { value: 'monthly', label: '每月赠送' },
            { value: 'daily', label: '每日赠送' }
        ];
        return modes.map(function (m) {
            return (
                '<label class="member-level-check-label">' +
                '<input type="radio" name="' + name + '" value="' + m.value + '"' +
                (selected === m.value ? ' checked' : '') + '> ' + m.label +
                '</label>'
            );
        }).join('');
    }

    function renderCouponOptionList(selected, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var filtered = COUPON_OPTIONS.filter(function (opt) {
            if (!kw) return true;
            return opt.label.toLowerCase().indexOf(kw) !== -1;
        });
        if (!filtered.length) {
            return '<li class="member-level-coupon-picker__empty">无匹配优惠券</li>';
        }
        return filtered.map(function (opt) {
            return (
                '<li class="member-level-coupon-picker__item' +
                (opt.value === selected ? ' is-active' : '') +
                '" data-coupon-option="' + escapeHtml(opt.value) + '">' +
                escapeHtml(opt.label) +
                '</li>'
            );
        }).join('');
    }

    function syncCouponPickerTrigger(picker) {
        if (!picker) return;
        var hidden = picker.querySelector('[data-coupon-name]');
        var label = picker.querySelector('[data-coupon-label]');
        var trigger = picker.querySelector('[data-coupon-trigger]');
        var val = hidden ? hidden.value : '';
        if (label) label.textContent = val || '请选择优惠券';
        if (trigger) trigger.classList.toggle('is-placeholder', !val);
    }

    function closeAllCouponPickers(except) {
        document.querySelectorAll('[data-coupon-picker].is-open').forEach(function (picker) {
            if (except && picker === except) return;
            picker.classList.remove('is-open');
            var filter = picker.querySelector('[data-coupon-filter]');
            if (filter) filter.value = '';
            var list = picker.querySelector('[data-coupon-options]');
            var hidden = picker.querySelector('[data-coupon-name]');
            if (list) list.innerHTML = renderCouponOptionList(hidden ? hidden.value : '', '');
        });
    }

    function bindCouponPicker(picker) {
        if (!picker || picker.getAttribute('data-bound') === '1') return;
        picker.setAttribute('data-bound', '1');

        var trigger = picker.querySelector('[data-coupon-trigger]');
        var filter = picker.querySelector('[data-coupon-filter]');
        var list = picker.querySelector('[data-coupon-options]');
        var hidden = picker.querySelector('[data-coupon-name]');

        syncCouponPickerTrigger(picker);

        if (trigger) {
            trigger.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                var willOpen = !picker.classList.contains('is-open');
                closeAllCouponPickers();
                if (willOpen) {
                    picker.classList.add('is-open');
                    if (filter) {
                        filter.value = '';
                        filter.focus();
                    }
                    if (list) list.innerHTML = renderCouponOptionList(hidden ? hidden.value : '', '');
                }
            });
        }

        if (filter) {
            filter.addEventListener('input', function () {
                if (list) list.innerHTML = renderCouponOptionList(hidden ? hidden.value : '', filter.value);
            });
            filter.addEventListener('click', function (ev) {
                ev.stopPropagation();
            });
        }

        if (list) {
            list.addEventListener('click', function (ev) {
                var item = ev.target.closest('[data-coupon-option]');
                if (!item) return;
                ev.stopPropagation();
                if (hidden) hidden.value = item.getAttribute('data-coupon-option') || '';
                syncCouponPickerTrigger(picker);
                picker.classList.remove('is-open');
                if (filter) filter.value = '';
                list.innerHTML = renderCouponOptionList(hidden ? hidden.value : '', '');
            });
        }
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
            '      <span>▾</span>' +
            '    </button>' +
            '    <div class="member-level-coupon-picker__panel" data-coupon-panel>' +
            '      <input class="erp-input member-level-coupon-picker__filter" type="text" placeholder="输入券名称筛选" data-coupon-filter>' +
            '      <ul class="member-level-coupon-picker__list" data-coupon-options>' +
            renderCouponOptionList(selected, '') +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <div class="member-level-coupon-qty">' +
            '    <input class="erp-input" type="number" min="1" step="1" value="' + escapeHtml(String(item.qty || 1)) + '" data-coupon-qty>' +
            '    <span class="member-level-unit__text">张</span>' +
            '  </div>' +
            '  <button type="button" class="member-level-coupon-remove" data-coupon-remove>删除</button>' +
            '</div>'
        );
    }

    function buildCouponBlockHtml(prefix, mode, items, tip) {
        var rows = (items && items.length)
            ? items.map(function (it) { return buildCouponRowHtml(it); }).join('')
            : buildCouponRowHtml({ coupon: '', qty: 1 });
        return (
            '<div class="member-level-coupon-block" data-coupon-block="' + prefix + '">' +
            '  <div class="member-level-check-row" style="margin-bottom:8px;">' +
            buildModeRadios(prefix + 'Mode', mode || 'total') +
            '  </div>' +
            '  <div class="member-level-coupon-list" data-coupon-list>' + rows + '</div>' +
            '  <button type="button" class="member-level-coupon-add" data-coupon-add>+ 添加优惠券</button>' +
            '  <div class="member-level-field-tip">' + escapeHtml(tip) + '</div>' +
            '</div>'
        );
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

    function getSelectedMode(backdrop, name) {
        var el = backdrop.querySelector('input[name="' + name + '"]:checked');
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

    function bindCouponBlock(blockEl) {
        if (!blockEl) return;
        var listEl = blockEl.querySelector('[data-coupon-list]');
        var addBtn = blockEl.querySelector('[data-coupon-add]');

        blockEl.querySelectorAll('[data-coupon-picker]').forEach(bindCouponPicker);

        if (addBtn) {
            addBtn.addEventListener('click', function () {
                listEl.insertAdjacentHTML('beforeend', buildCouponRowHtml({ coupon: '', qty: 1 }));
                var rows = listEl.querySelectorAll('[data-coupon-row]');
                var last = rows[rows.length - 1];
                if (last) bindCouponPicker(last.querySelector('[data-coupon-picker]'));
            });
        }
        blockEl.addEventListener('click', function (ev) {
            var removeBtn = ev.target.closest('[data-coupon-remove]');
            if (!removeBtn) return;
            var rows = listEl.querySelectorAll('[data-coupon-row]');
            if (rows.length <= 1) {
                toast('至少保留一行优惠券配置', 'warning');
                return;
            }
            var row = removeBtn.closest('[data-coupon-row]');
            if (row) row.remove();
        });
    }

    function openLevelModal(options) {
        closeModal();
        options = options || {};
        var editItem = options.item || null;
        var isEdit = !!editItem;

        var name = isEdit ? editItem.name : '';
        var growthValue = isEdit ? editItem.growthValue : '';
        var giftPoints = isEdit ? editItem.giftPoints : 0;
        var giftCouponMode = isEdit ? (editItem.giftCouponMode || 'total') : 'total';
        var giftCoupons = isEdit ? (editItem.giftCoupons || []) : [];
        var memberDiscount = isEdit ? editItem.memberDiscount : 100;
        var pointsRatio = isEdit ? editItem.pointsRatio : 100;
        var birthdayEnabled = isEdit ? !!editItem.birthdayEnabled : false;
        var birthdayCouponMode = isEdit ? (editItem.birthdayCouponMode || 'total') : 'total';
        var birthdayCoupons = isEdit ? (editItem.birthdayCoupons || []) : [{ coupon: '生日专属券', qty: 1 }];

        var backdrop = document.createElement('div');
        backdrop.className = 'erp-modal-backdrop';
        backdrop.setAttribute('data-member-level-modal', '1');
        backdrop.innerHTML =
            '<div class="erp-modal erp-modal--member-level">' +
            '  <div class="erp-modal__header">' +
            '    <h2 class="erp-modal__title">' + (isEdit ? '编辑会员等级' : '新增会员等级') + '</h2>' +
            '    <div class="erp-modal__header-actions">' +
            '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__body">' +
            '    <div class="member-level-section-title">基础信息</div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="mlName"><span class="erp-req">*</span>等级名称</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <input class="erp-input" id="mlName" type="text" maxlength="' + NAME_MAX + '" placeholder="请输入等级名称，' + NAME_MAX + '字以内" value="' + escapeHtml(name) + '">' +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="mlGrowth"><span class="erp-req">*</span>成长值</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-level-unit">' +
            '          <input class="erp-input" id="mlGrowth" type="number" min="0" step="1" placeholder="达到该成长值可享本等级" value="' + escapeHtml(growthValue === '' ? '' : String(growthValue)) + '">' +
            '          <span class="member-level-unit__text">分</span>' +
            '        </div>' +
            '        <div class="member-level-field-tip">列表按成长值从低到高排序；达标后立即升级生效，降级于每月 1 号统一处理。</div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="member-level-section-title">会员权益</div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="mlGiftPoints">赠送积分</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-level-unit">' +
            '          <input class="erp-input" id="mlGiftPoints" type="number" min="0" step="1" placeholder="升级时赠送积分，0 表示不赠送" value="' + escapeHtml(String(giftPoints)) + '">' +
            '          <span class="member-level-unit__text">分</span>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label">赠送券</label>' +
            '      <div class="erp-modal-field__control">' +
            buildCouponBlockHtml('gift', giftCouponMode, giftCoupons, '可多选优惠券并设置每种发放数量；支持累计 / 每月 / 每日赠送。可不配置券。') +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="mlDiscount">商品会员折扣</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-level-unit">' +
            '          <input class="erp-input" id="mlDiscount" type="number" min="1" max="100" step="1" placeholder="100 表示无折扣" value="' + escapeHtml(String(memberDiscount)) + '">' +
            '          <span class="member-level-unit__text">%（如 90 表示 9 折）</span>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label" for="mlPointsRatio">积分等级赠送比例</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-level-unit">' +
            '          <input class="erp-input" id="mlPointsRatio" type="number" min="100" step="10" placeholder="100 表示按基础规则 1 倍赠送" value="' + escapeHtml(String(pointsRatio)) + '">' +
            '          <span class="member-level-unit__text">%（如 150 表示 1.5 倍）</span>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="erp-modal-field">' +
            '      <label class="erp-modal-field__label">生日送券</label>' +
            '      <div class="erp-modal-field__control">' +
            '        <div class="member-level-check-row" style="margin-bottom:8px;">' +
            '          <label class="member-level-check-label"><input type="checkbox" id="mlBirthdayEnable"' + (birthdayEnabled ? ' checked' : '') + '> 开启生日送券</label>' +
            '        </div>' +
            '        <div id="mlBirthdayBlock" style="' + (birthdayEnabled ? '' : 'display:none;') + '">' +
            buildCouponBlockHtml('birthday', birthdayCouponMode, birthdayCoupons, '生日当月/当日按所选规则发放；可配置多种优惠券及数量。') +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="erp-modal__footer">' +
            '    <button type="button" class="erp-btn" data-modal-cancel>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-modal-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var birthdayEnable = backdrop.querySelector('#mlBirthdayEnable');
        var birthdayBlock = backdrop.querySelector('#mlBirthdayBlock');
        birthdayEnable.addEventListener('change', function () {
            birthdayBlock.style.display = birthdayEnable.checked ? '' : 'none';
        });

        backdrop.querySelectorAll('[data-coupon-block]').forEach(bindCouponBlock);

        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) closeModal();
            if (!ev.target.closest('[data-coupon-picker]')) closeAllCouponPickers();
        });
        backdrop.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) {
            btn.addEventListener('click', closeModal);
        });

        backdrop.querySelector('[data-modal-ok]').addEventListener('click', function () {
            var levelName = (backdrop.querySelector('#mlName').value || '').trim();
            var growthRaw = (backdrop.querySelector('#mlGrowth').value || '').trim();
            var giftPointsRaw = (backdrop.querySelector('#mlGiftPoints').value || '').trim();
            var discountRaw = (backdrop.querySelector('#mlDiscount').value || '').trim();
            var ratioRaw = (backdrop.querySelector('#mlPointsRatio').value || '').trim();
            var birthdayOn = backdrop.querySelector('#mlBirthdayEnable').checked;

            var giftBlock = backdrop.querySelector('[data-coupon-block="gift"]');
            var giftMode = getSelectedMode(backdrop, 'giftMode');
            var giftRawItems = collectCoupons(giftBlock);
            var giftFilled = giftRawItems.filter(function (it) { return !!it.coupon; });
            var giftResult = { ok: true, items: [] };
            if (giftFilled.length) {
                giftResult = validateCouponItems(giftRawItems, '赠送券');
                if (!giftResult.ok) {
                    toast(giftResult.message, 'warning');
                    return;
                }
            } else {
                // 允许全部为空（不赠券），但若填了数量未选券则提示
                for (var gi = 0; gi < giftRawItems.length; gi++) {
                    if (!giftRawItems[gi].coupon && giftRawItems[gi].qtyRaw && giftRawItems[gi].qtyRaw !== '1') {
                        toast('请为赠送券选择优惠券', 'warning');
                        return;
                    }
                }
            }

            var birthdayMode = getSelectedMode(backdrop, 'birthdayMode');
            var birthdayResult = { ok: true, items: [] };
            if (birthdayOn) {
                var birthBlock = backdrop.querySelector('[data-coupon-block="birthday"]');
                birthdayResult = validateCouponItems(collectCoupons(birthBlock), '生日券');
                if (!birthdayResult.ok) {
                    toast(birthdayResult.message, 'warning');
                    return;
                }
            }

            if (!levelName) {
                toast('请输入等级名称', 'warning');
                return;
            }
            if (growthRaw === '' || isNaN(Number(growthRaw)) || Number(growthRaw) < 0 || !/^\d+$/.test(growthRaw)) {
                toast('请输入有效的成长值（非负整数）', 'warning');
                return;
            }
            var growthNum = Number(growthRaw);
            var giftPointsNum = giftPointsRaw === '' ? 0 : Number(giftPointsRaw);
            if (isNaN(giftPointsNum) || giftPointsNum < 0 || !/^\d*$/.test(giftPointsRaw === '' ? '0' : giftPointsRaw)) {
                toast('赠送积分须为非负整数', 'warning');
                return;
            }
            var discountNum = discountRaw === '' ? 100 : Number(discountRaw);
            if (isNaN(discountNum) || discountNum < 1 || discountNum > 100 || !/^\d+$/.test(discountRaw === '' ? '100' : discountRaw)) {
                toast('商品会员折扣请填写 1~100 的整数', 'warning');
                return;
            }
            var ratioNum = ratioRaw === '' ? 100 : Number(ratioRaw);
            if (isNaN(ratioNum) || ratioNum < 100 || !/^\d+$/.test(ratioRaw === '' ? '100' : ratioRaw)) {
                toast('积分等级赠送比例须为不小于 100 的整数', 'warning');
                return;
            }

            var nameDup = state.list.some(function (it) {
                return it.name === levelName && (!isEdit || it.id !== editItem.id);
            });
            if (nameDup) {
                toast('等级名称已存在', 'warning');
                return;
            }
            var growthDup = state.list.some(function (it) {
                return it.growthValue === growthNum && (!isEdit || it.id !== editItem.id);
            });
            if (growthDup) {
                toast('已存在相同成长值的等级，请调整', 'warning');
                return;
            }

            var payload = {
                name: levelName,
                growthValue: growthNum,
                giftPoints: giftPointsNum,
                giftCouponMode: giftMode,
                giftCoupons: giftResult.items,
                memberDiscount: discountNum,
                pointsRatio: ratioNum,
                birthdayEnabled: birthdayOn,
                birthdayCouponMode: birthdayMode,
                birthdayCoupons: birthdayOn ? birthdayResult.items : [],
                updatedAt: nowStr()
            };

            if (isEdit) {
                Object.keys(payload).forEach(function (k) {
                    editItem[k] = payload[k];
                });
                toast('会员等级已更新', 'success');
            } else {
                if (state.list.length >= LEVEL_MAX) {
                    toast('最多可设置 ' + LEVEL_MAX + ' 个会员等级', 'warning');
                    return;
                }
                state.list.push({
                    id: genId('ML'),
                    memberCount: 0,
                    status: '启用',
                    name: payload.name,
                    growthValue: payload.growthValue,
                    giftPoints: payload.giftPoints,
                    giftCouponMode: payload.giftCouponMode,
                    giftCoupons: payload.giftCoupons,
                    memberDiscount: payload.memberDiscount,
                    pointsRatio: payload.pointsRatio,
                    birthdayEnabled: payload.birthdayEnabled,
                    birthdayCouponMode: payload.birthdayCouponMode,
                    birthdayCoupons: payload.birthdayCoupons,
                    updatedAt: payload.updatedAt
                });
                toast('会员等级已新增', 'success');
            }

            closeModal();
            state.page = 1;
            render();
        });

        document.body.appendChild(backdrop);
        var nameInput = backdrop.querySelector('#mlName');
        if (nameInput) nameInput.focus();
    }

    function renderTable(pageItems, startIndex) {
        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (!pageItems.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px;">暂无数据</td></tr>';
            return;
        }

        tbody.innerHTML = pageItems.map(function (item, idx) {
            var statusClass = item.status === '启用' ? 'active' : 'inactive';
            var toggleText = item.status === '启用' ? '禁用' : '启用';
            return (
                '<tr data-id="' + escapeHtml(item.id) + '">' +
                '<td>' + (startIndex + idx + 1) + '</td>' +
                '<td>' + escapeHtml(item.name) + '</td>' +
                '<td><span class="member-level-growth-cell">' + item.growthValue + '</span></td>' +
                '<td><div class="member-level-benefit-summary">' + formatBenefitSummary(item) + '</div></td>' +
                '<td><a href="mdm_member_c.html?level=' + encodeURIComponent(item.name) + '" class="subject-name-link" data-action="members">' + item.memberCount + '</a></td>' +
                '<td>' + escapeHtml(item.updatedAt) + '</td>' +
                '<td><span class="status ' + statusClass + '">' + escapeHtml(item.status) + '</span></td>' +
                '<td class="action-links">' +
                '<a href="#" data-action="edit">编辑</a>　' +
                '<a href="#" data-action="toggle">' + toggleText + '</a>　' +
                '<a href="#" data-action="delete">删除</a>' +
                '</td>' +
                '</tr>'
            );
        }).join('');
    }

    function renderPagination(total) {
        if (typeof createPagination !== 'function') return;
        createPagination({
            containerId: 'pagination-container',
            totalItems: total,
            currentPage: state.page,
            pageSize: state.pageSize,
            onPageChange: function (page) {
                state.page = page;
                render(false);
            },
            onPageSizeChange: function (size) {
                state.pageSize = size;
                state.page = 1;
                render(false);
            }
        });
    }

    function render(resetPage) {
        if (resetPage) state.page = 1;
        updateCountHint();
        var filtered = getFilteredList();
        var total = filtered.length;
        var totalPages = Math.ceil(total / state.pageSize) || 1;
        if (state.page > totalPages) state.page = totalPages;
        var start = (state.page - 1) * state.pageSize;
        var pageItems = filtered.slice(start, start + state.pageSize);
        renderTable(pageItems, start);
        renderPagination(total);
    }

    function readFilter() {
        state.filter.levelName = (document.getElementById('qLevelName').value || '').trim();
        state.filter.status = document.getElementById('qStatus').value || '';
    }

    function bindEvents() {
        var addBtn = document.getElementById('btnAddLevel');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                if (state.list.length >= LEVEL_MAX) {
                    toast('最多可设置 ' + LEVEL_MAX + ' 个会员等级', 'warning');
                    return;
                }
                openLevelModal();
            });
        }

        var ruleBtn = document.getElementById('btnGotoRule');
        if (ruleBtn) {
            ruleBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_rule.html';
            });
        }

        var growthBtn = document.getElementById('btnGotoGrowth');
        if (growthBtn) {
            growthBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_growth.html';
            });
        }

        var descBtn = document.getElementById('btnGotoDesc');
        if (descBtn) {
            descBtn.addEventListener('click', function () {
                window.location.href = 'mdm_member_level_desc.html';
            });
        }

        var queryBtn = document.getElementById('btnFilterQuery');
        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                readFilter();
                render(true);
            });
        }

        var resetBtn = document.getElementById('btnFilterReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                var form = document.getElementById('memberLevelSearchForm');
                if (form) form.reset();
                state.filter = { levelName: '', status: '' };
                render(true);
            });
        }

        var tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.addEventListener('click', function (ev) {
            var link = ev.target.closest('a[data-action]');
            if (!link) return;
            var action = link.getAttribute('data-action');
            if (action === 'members') {
                // 允许默认跳转至 C 端会员页
                return;
            }
            ev.preventDefault();
            var row = link.closest('tr[data-id]');
            if (!row) return;
            var item = findById(row.getAttribute('data-id'));
            if (!item) return;

            if (action === 'edit') {
                openLevelModal({ item: item });
                return;
            }

            if (action === 'toggle') {
                var next = item.status === '启用' ? '禁用' : '启用';
                openWarmConfirm('确认将等级「' + item.name + '」' + next + '？', function () {
                    item.status = next;
                    item.updatedAt = nowStr();
                    toast('已' + next, 'success');
                    render(false);
                });
                return;
            }

            if (action === 'delete') {
                if (item.memberCount > 0) {
                    toast('该等级仍有关联会员，无法删除', 'warning');
                    return;
                }
                openWarmConfirm('确认删除等级「' + item.name + '」？', function () {
                    state.list = state.list.filter(function (it) { return it.id !== item.id; });
                    toast('已删除', 'success');
                    render(false);
                });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindEvents();
        render(true);
    });
})();
