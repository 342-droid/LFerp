/**
 * 基础设置 · 门店配置 — 订单配置 / 账户配置（各板块独立保存）
 * 标题行右侧：默认「修改」；编辑中「取消 / 保存」
 */
(function () {
  var ORDER_STORAGE_KEY = 'lf_basic_settings_order_config';
  var HOURS_STORAGE_KEY = 'lf_basic_settings_business_hours';
  var ORDER_DEFAULTS = { storeQueue: 'on', pendingShipmentVerify: 'on' };
  var HOURS_DEFAULTS = {
    start: '08:00',
    end: '22:00',
    crossDay: 'no',
    /** 快递商品是否默认 24 小时可售 */
    express24hSale: 'no',
    categoryHours: []
  };
  var ORDER_FIELDS = ['storeQueue', 'pendingShipmentVerify'];
  var FALLBACK_CATEGORIES = [
    { id: '新鲜蔬菜', name: '新鲜蔬菜' },
    { id: '时令水果', name: '时令水果' },
    { id: '粮油调味', name: '粮油调味' },
    { id: '肉禽蛋品', name: '肉禽蛋品' },
    { id: '酒水饮料', name: '酒水饮料' }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
    else window.alert(msg);
  }

  function bindCollapse(sectionId, toggleId) {
    var section = $(sectionId);
    var toggle = $(toggleId);
    if (!toggle || !section) return;
    toggle.addEventListener('click', function () {
      section.classList.toggle('is-collapsed');
    });
    toggle.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        section.classList.toggle('is-collapsed');
      }
    });
  }

  function setSectionEditing(section, editing) {
    if (!section) return;
    section.classList.toggle('is-editing', !!editing);
    if (editing) section.classList.remove('is-collapsed');
    var body = section.querySelector('.sac-section__body');
    if (body) {
      body.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        el.disabled = !editing;
      });
    }
    var actions = section.querySelector('.bs-section-head-actions');
    if (!actions) return;
    var editBtn = actions.querySelector('[data-role="edit"]');
    var cancelBtn = actions.querySelector('[data-role="cancel"]');
    var saveBtn = actions.querySelector('[data-role="save"]');
    if (editBtn) editBtn.hidden = !!editing;
    if (cancelBtn) cancelBtn.hidden = !editing;
    if (saveBtn) saveBtn.hidden = !editing;
  }

  function loadOrderSettings() {
    try {
      var raw = localStorage.getItem(ORDER_STORAGE_KEY);
      if (!raw) return Object.assign({}, ORDER_DEFAULTS);
      return Object.assign({}, ORDER_DEFAULTS, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, ORDER_DEFAULTS);
    }
  }

  function mountOrderConfig() {
    var root = $('bsOrderConfigRoot');
    var ui = window.OrderConfigUi;
    if (!root || !ui) return null;
    root.innerHTML = '';
    var settings = loadOrderSettings();
    var copy = ui.STORE_COPY || {};

    ui.appendOrderConfigItem({
      root: root,
      fieldKey: 'storeQueue',
      label: '门店排队',
      settings: settings,
      namePrefix: 'basicOrder',
      nameSuffix: '',
      required: true,
      onHint: copy.storeQueueOn
    });

    ui.appendOrderConfigItem({
      root: root,
      fieldKey: 'pendingShipmentVerify',
      label: '待发货订单核销',
      settings: settings,
      namePrefix: 'basicOrder',
      nameSuffix: '',
      required: true,
      staticHint: copy.pendingVerifyDesc,
      warnTip: copy.pendingVerifyWarn
    });
    return root;
  }

  function readAccountForm() {
    var deposit = Number(($('bsDepositRequired') && $('bsDepositRequired').value) || '');
    var goods = Number(($('bsGoodsQuotaRequired') && $('bsGoodsQuotaRequired').value) || '');
    var affectEl = document.querySelector('input[name="bsAffectHistory"]:checked');
    return {
      depositRequired: deposit,
      goodsQuotaRequired: goods,
      affectHistory: affectEl ? affectEl.value : 'no'
    };
  }

  function fillAccountForm(cfg) {
    if ($('bsDepositRequired')) {
      $('bsDepositRequired').value =
        cfg.depositRequired != null ? String(cfg.depositRequired) : '';
    }
    if ($('bsGoodsQuotaRequired')) {
      $('bsGoodsQuotaRequired').value =
        cfg.goodsQuotaRequired != null ? String(cfg.goodsQuotaRequired) : '';
    }
    var val = cfg.affectHistory === 'yes' ? 'yes' : 'no';
    document.querySelectorAll('input[name="bsAffectHistory"]').forEach(function (r) {
      r.checked = r.value === val;
    });
  }

  function validateAccount(form) {
    if (!(form.depositRequired >= 0) || Number.isNaN(form.depositRequired)) {
      return '请填写有效的保证金账户金额';
    }
    if (!(form.goodsQuotaRequired >= 0) || Number.isNaN(form.goodsQuotaRequired)) {
      return '请填写有效的货款金额';
    }
    return '';
  }

  function applyHistoryIfNeeded(cfg) {
    if (cfg.affectHistory !== 'yes') return;
    if (
      !window.StoreWalletDemo ||
      typeof window.StoreWalletDemo.applyPlatformAccountRule !== 'function'
    ) {
      return;
    }
    window.StoreWalletDemo.applyPlatformAccountRule({
      depositRequired: cfg.depositRequired,
      goodsQuotaRequired: cfg.goodsQuotaRequired
    });
  }

  function getCatalogCategories() {
    if (
      window.MdmProductCatalog &&
      typeof window.MdmProductCatalog.getCategories === 'function'
    ) {
      var list = window.MdmProductCatalog.getCategories() || [];
      if (list.length) return list;
    }
    return FALLBACK_CATEGORIES.slice();
  }

  function normalizeCategoryHours(list) {
    return (Array.isArray(list) ? list : [])
      .map(function (row) {
        var id = String((row && (row.id || row.name)) || '').trim();
        if (!id) return null;
        return {
          id: id,
          name: String((row && row.name) || id).trim() || id,
          start: (row && row.start) || HOURS_DEFAULTS.start,
          end: (row && row.end) || HOURS_DEFAULTS.end
        };
      })
      .filter(Boolean);
  }

  function cloneHoursConfig(cfg) {
    var base = Object.assign({}, HOURS_DEFAULTS, cfg || {});
    base.express24hSale = base.express24hSale === 'yes' ? 'yes' : 'no';
    base.categoryHours = normalizeCategoryHours(base.categoryHours).map(function (row) {
      return Object.assign({}, row);
    });
    return base;
  }

  function loadHoursSettings() {
    try {
      var raw = localStorage.getItem(HOURS_STORAGE_KEY);
      if (!raw) return cloneHoursConfig(HOURS_DEFAULTS);
      return cloneHoursConfig(JSON.parse(raw));
    } catch (e) {
      return cloneHoursConfig(HOURS_DEFAULTS);
    }
  }

  function isCrossDayEnabled() {
    var crossEl = document.querySelector('input[name="bsHoursCrossDay"]:checked');
    return !!(crossEl && crossEl.value === 'yes');
  }

  var SALE_TIME_PRIORITY_TIP =
    '优先级：商品自定义可售时间 > 快递商品24小时可售 > 商品类目可售时间 > 默认营业时间。';

  function syncCategoryHoursTip() {
    var tip = $('bsHoursCategoryTip');
    if (!tip) return;
    if (isCrossDayEnabled()) {
      tip.textContent =
        '按选品库商品类目配置每天可售时段。' +
        SALE_TIME_PRIORITY_TIP +
        '已开启跨日营业，类目可售时间也支持跨日配置（结束时间可早于开始时间）。超过可售时间则该类目商品不可售。';
    } else {
      tip.textContent =
        '按选品库商品类目配置每天可售时段。' +
        SALE_TIME_PRIORITY_TIP +
        '超过可售时间则该类目商品不可售。';
    }
  }

  function validateTimeRange(start, end, crossDay, label) {
    if (!start || !end) return '请填写' + label;
    if (crossDay !== 'yes' && start >= end) {
      return label + '：未开启跨日营业时，结束时间需晚于开始时间';
    }
    if (crossDay === 'yes' && start === end) {
      return label + '：跨日时开始与结束时间不能相同';
    }
    return '';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readCategoryHoursForm() {
    var listEl = $('bsHoursCategoryList');
    if (!listEl) return [];
    var rows = [];
    listEl.querySelectorAll('.bs-hours-cat__row').forEach(function (row) {
      var id = String(row.getAttribute('data-cat-id') || '').trim();
      if (!id) return;
      var nameEl = row.querySelector('.bs-hours-cat__name');
      var startEl = row.querySelector('[data-cat-start]');
      var endEl = row.querySelector('[data-cat-end]');
      rows.push({
        id: id,
        name: nameEl ? String(nameEl.textContent || id).trim() : id,
        start: (startEl && startEl.value) || '',
        end: (endEl && endEl.value) || ''
      });
    });
    return normalizeCategoryHours(rows);
  }

  function isExpress24hOn() {
    var btn = $('bsHoursExpress24h');
    return !!(btn && (btn.getAttribute('aria-pressed') === 'true' || btn.classList.contains('is-on')));
  }

  function setExpress24hSwitch(on) {
    var btn = $('bsHoursExpress24h');
    var enabled = !!on;
    if (btn) {
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      btn.classList.toggle('is-on', enabled);
    }
  }

  function readHoursForm() {
    var start = ($('bsHoursStart') && $('bsHoursStart').value) || '';
    var end = ($('bsHoursEnd') && $('bsHoursEnd').value) || '';
    var crossEl = document.querySelector('input[name="bsHoursCrossDay"]:checked');
    return {
      start: start,
      end: end,
      crossDay: crossEl ? crossEl.value : 'no',
      express24hSale: isExpress24hOn() ? 'yes' : 'no',
      categoryHours: readCategoryHoursForm()
    };
  }

  function renderCategoryHours(list, editing) {
    var listEl = $('bsHoursCategoryList');
    if (!listEl) return;
    var rows = normalizeCategoryHours(list);
    if (!rows.length) {
      listEl.innerHTML = '';
      return;
    }
    listEl.innerHTML = rows
      .map(function (row) {
        return (
          '<div class="bs-hours-cat__row" data-cat-id="' +
          escapeHtml(row.id) +
          '">' +
          '<span class="bs-hours-cat__name">' +
          escapeHtml(row.name) +
          '</span>' +
          '<div class="bs-hours-range">' +
          '<input class="erp-input" type="time" data-cat-start value="' +
          escapeHtml(row.start) +
          '">' +
          '<span class="bs-hours-range__sep">至</span>' +
          '<input class="erp-input" type="time" data-cat-end value="' +
          escapeHtml(row.end) +
          '">' +
          '</div>' +
          '<button type="button" class="erp-btn bs-hours-cat__remove" data-cat-remove>删除</button>' +
          '</div>'
        );
      })
      .join('');
    listEl.querySelectorAll('input, button').forEach(function (el) {
      el.disabled = !editing;
    });
  }

  function openCategoryPicker() {
    var catalog = getCatalogCategories();
    if (!catalog.length) {
      toast('暂无选品库类目', 'error');
      return;
    }
    var current = readCategoryHoursForm();
    var timeMap = {};
    current.forEach(function (row) {
      timeMap[row.id] = row;
    });
    var selectedMap = {};
    current.forEach(function (row) {
      selectedMap[row.id] = true;
    });

    var backdrop = document.createElement('div');
    backdrop.className = 'pts-rule-pick-backdrop';
    backdrop.innerHTML =
      '<div class="pts-rule-pick-modal" role="dialog" aria-modal="true">' +
      '  <div class="pts-rule-pick-modal__header">' +
      '    <h3 class="pts-rule-pick-modal__title">选择商品类目</h3>' +
      '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
      '  </div>' +
      '  <div class="pts-rule-pick-modal__body">' +
      '    <input class="erp-input pts-rule-pick-filter" type="text" placeholder="输入类目名称筛选" data-pick-filter>' +
      '    <div class="pts-rule-pick-list" data-pick-list></div>' +
      '  </div>' +
      '  <div class="pts-rule-pick-modal__footer">' +
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
        listEl.innerHTML = '<div class="pts-rule-pick-empty">无匹配项</div>';
        return;
      }
      listEl.innerHTML = filtered
        .map(function (it) {
          return (
            '<label class="pts-rule-pick-item">' +
            '<input type="checkbox" value="' +
            escapeHtml(it.id) +
            '"' +
            (selectedMap[it.id] ? ' checked' : '') +
            '>' +
            '<span>' +
            escapeHtml(it.name) +
            '</span>' +
            '</label>'
          );
        })
        .join('');
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
      var defaultStart =
        ($('bsHoursStart') && $('bsHoursStart').value) || HOURS_DEFAULTS.start;
      var defaultEnd = ($('bsHoursEnd') && $('bsHoursEnd').value) || HOURS_DEFAULTS.end;
      var next = catalog
        .filter(function (it) {
          return !!selectedMap[it.id];
        })
        .map(function (it) {
          var prev = timeMap[it.id];
          return {
            id: it.id,
            name: it.name,
            start: (prev && prev.start) || defaultStart,
            end: (prev && prev.end) || defaultEnd
          };
        });
      renderCategoryHours(next, true);
      close();
    });

    document.body.appendChild(backdrop);
    filterEl.focus();
  }

  function fillHoursForm(cfg, editing) {
    cfg = cloneHoursConfig(cfg);
    if ($('bsHoursStart')) $('bsHoursStart').value = cfg.start || HOURS_DEFAULTS.start;
    if ($('bsHoursEnd')) $('bsHoursEnd').value = cfg.end || HOURS_DEFAULTS.end;
    var val = cfg.crossDay === 'yes' ? 'yes' : 'no';
    document.querySelectorAll('input[name="bsHoursCrossDay"]').forEach(function (r) {
      r.checked = r.value === val;
    });
    setExpress24hSwitch(cfg.express24hSale === 'yes');
    var section = $('bsHoursSection');
    var isEditing =
      editing != null ? !!editing : !!(section && section.classList.contains('is-editing'));
    renderCategoryHours(cfg.categoryHours, isEditing);
    syncCategoryHoursTip();
  }

  function validateHours(form) {
    /* 类目可售时间与默认营业时间共用「允许跨日营业」开关 */
    var err = validateTimeRange(form.start, form.end, form.crossDay, '默认营业时间');
    if (err) return err;
    var seen = {};
    for (var i = 0; i < (form.categoryHours || []).length; i++) {
      var row = form.categoryHours[i];
      if (!row.id) return '请选择商品类目';
      if (seen[row.id]) return '类目「' + row.name + '」重复配置';
      seen[row.id] = true;
      err = validateTimeRange(
        row.start,
        row.end,
        form.crossDay,
        '类目「' + row.name + '」每天可售时间'
      );
      if (err) return err;
    }
    return '';
  }

  function bindCategoryHoursActions() {
    var listEl = $('bsHoursCategoryList');
    var addBtn = $('bsHoursCategoryAddBtn');
    if (listEl && !listEl._bsCatBound) {
      listEl._bsCatBound = true;
      listEl.addEventListener('click', function (ev) {
        var section = $('bsHoursSection');
        if (!section || !section.classList.contains('is-editing')) return;
        var removeBtn = ev.target.closest('[data-cat-remove]');
        if (!removeBtn) return;
        var row = removeBtn.closest('.bs-hours-cat__row');
        if (row) row.remove();
      });
    }
    if (addBtn && !addBtn._bsCatBound) {
      addBtn._bsCatBound = true;
      addBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var section = $('bsHoursSection');
        if (!section || !section.classList.contains('is-editing')) return;
        openCategoryPicker();
      });
    }
    document.querySelectorAll('input[name="bsHoursCrossDay"]').forEach(function (radio) {
      if (radio._bsCrossTipBound) return;
      radio._bsCrossTipBound = true;
      radio.addEventListener('change', syncCategoryHoursTip);
    });

    var express24hBtn = $('bsHoursExpress24h');
    if (express24hBtn && !express24hBtn._bsExpress24hBound) {
      express24hBtn._bsExpress24hBound = true;
      express24hBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var section = $('bsHoursSection');
        if (!section || !section.classList.contains('is-editing')) return;
        if (express24hBtn.disabled) return;
        setExpress24hSwitch(!isExpress24hOn());
      });
    }
  }

  function bindSectionEditMode(opts) {
    var section = $(opts.sectionId);
    var editBtn = $(opts.editId);
    var cancelBtn = $(opts.cancelId);
    var saveBtn = $(opts.saveId);
    if (!section || !editBtn || !cancelBtn || !saveBtn) return;

    editBtn.setAttribute('data-role', 'edit');
    cancelBtn.setAttribute('data-role', 'cancel');
    saveBtn.setAttribute('data-role', 'save');

    var snapshot = null;

    editBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      snapshot = opts.takeSnapshot();
      setSectionEditing(section, true);
    });

    cancelBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (snapshot) opts.restoreSnapshot(snapshot);
      snapshot = null;
      setSectionEditing(section, false);
    });

    saveBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!opts.onSave()) return;
      snapshot = null;
      setSectionEditing(section, false);
    });

    setSectionEditing(section, false);
  }

  function bind() {
    var orderRoot = mountOrderConfig();
    bindCollapse('bsOrderSection', 'bsOrderSectionToggle');
    bindCollapse('bsAccountSection', 'bsAccountSectionToggle');
    bindCollapse('bsHoursSection', 'bsHoursSectionToggle');

    bindSectionEditMode({
      sectionId: 'bsOrderSection',
      editId: 'bsOrderEditBtn',
      cancelId: 'bsOrderCancelBtn',
      saveId: 'bsOrderSaveBtn',
      takeSnapshot: function () {
        if (!orderRoot || !window.OrderConfigUi) return loadOrderSettings();
        return window.OrderConfigUi.readOrderConfigValues(
          orderRoot,
          'basicOrder',
          '',
          ORDER_FIELDS
        );
      },
      restoreSnapshot: function (data) {
        if (!orderRoot || !window.OrderConfigUi || !data) return;
        ORDER_FIELDS.forEach(function (key) {
          var name = 'basicOrder_' + key;
          var val = data[key] === 'off' ? 'off' : 'on';
          orderRoot.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
            r.checked = r.value === val;
            r.dispatchEvent(new Event('change', { bubbles: true }));
          });
        });
      },
      onSave: function () {
        if (!orderRoot || !window.OrderConfigUi) return false;
        var data = window.OrderConfigUi.readOrderConfigValues(
          orderRoot,
          'basicOrder',
          '',
          ORDER_FIELDS
        );
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data));
        toast('订单配置已保存（演示）', 'success');
        return true;
      }
    });

    var api = window.StoreAccountConfig;
    if (api) {
      fillAccountForm(api.getPlatform());
      bindSectionEditMode({
        sectionId: 'bsAccountSection',
        editId: 'bsAccountEditBtn',
        cancelId: 'bsAccountCancelBtn',
        saveId: 'bsAccountSaveBtn',
        takeSnapshot: function () {
          return readAccountForm();
        },
        restoreSnapshot: function (data) {
          fillAccountForm(data || api.getPlatform());
        },
        onSave: function () {
          var form = readAccountForm();
          var err = validateAccount(form);
          if (err) {
            toast(err, 'error');
            return false;
          }
          var saved = api.savePlatform(form);
          applyHistoryIfNeeded(saved);
          toast(
            saved.affectHistory === 'yes'
              ? '账户配置已保存，并按新规则同步调整历史演示数据'
              : '账户配置已保存，仅影响新增数据',
            'success'
          );
          return true;
        }
      });
    }

    bindCategoryHoursActions();
    fillHoursForm(loadHoursSettings(), false);
    bindSectionEditMode({
      sectionId: 'bsHoursSection',
      editId: 'bsHoursEditBtn',
      cancelId: 'bsHoursCancelBtn',
      saveId: 'bsHoursSaveBtn',
      takeSnapshot: function () {
        return cloneHoursConfig(readHoursForm());
      },
      restoreSnapshot: function (data) {
        fillHoursForm(data || loadHoursSettings(), false);
      },
      onSave: function () {
        var form = readHoursForm();
        var err = validateHours(form);
        if (err) {
          toast(err, 'error');
          return false;
        }
        localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(form));
        toast('营业时间配置已保存（演示）', 'success');
        return true;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
