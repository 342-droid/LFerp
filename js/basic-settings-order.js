/**
 * 基础设置 · 门店配置 — 订单配置 / 账户配置 / 合同未完成限制（各板块独立保存）
 * 标题行右侧：默认「修改」；编辑中「取消 / 保存」
 */
(function () {
  var ORDER_STORAGE_KEY = 'lf_basic_settings_order_config';
  var HOURS_STORAGE_KEY = 'lf_basic_settings_business_hours';
  var RESTRICT_STORAGE_KEY = 'lf_store_contract_restrict_v1';
  var RESTRICT_DEFAULTS = {
    commissionHold: 'on',
    productPurchaseGate: 'on',
    marketingStoreGate: 'on'
  };
  var FALLBACK_TAGS = [
    { id: '冷丰溯源', name: '冷丰溯源' },
    { id: '冷丰优选', name: '冷丰优选' },
    { id: '牛牛专用', name: '牛牛专用' },
    { id: '蔬菜水果', name: '蔬菜水果' },
    { id: '优选商品', name: '优选商品' },
    { id: '天天平价', name: '天天平价' }
  ];
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
    '优先级：商品自定义可售时间 > 快递商品24小时可售 > 商品类目可售时间 > 门店自定义营业时间 > 平台默认营业时间。';

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

  function normalizeNameRows(list) {
    var seen = {};
    return (Array.isArray(list) ? list : [])
      .map(function (row) {
        var id = String((row && (row.id || row.name)) || '').trim();
        var name = String((row && row.name) || id).trim();
        if (!id || seen[id]) return null;
        seen[id] = true;
        return { id: id, name: name || id };
      })
      .filter(Boolean);
  }

  function defaultProfitBelow() {
    try {
      var stored = normalizeProfitBelow(localStorage.getItem('lf_low_margin_threshold_v1'));
      if (stored != null) return stored;
    } catch (e) {}
    return 10;
  }

  function normalizeProfitBelow(value) {
    if (value == null || value === '') return null;
    var num = Number(value);
    if (!isFinite(num) || num < 0 || num > 100) return null;
    return Math.round(num * 10) / 10;
  }

  function storedProfitBelow(parsed) {
    if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, 'profitBelow')) {
      return defaultProfitBelow();
    }
    return normalizeProfitBelow(parsed.profitBelow);
  }

  function restrictFlag(parsed, key) {
    if (parsed && (parsed[key] === 'on' || parsed[key] === 'off')) return parsed[key];
    if (parsed && parsed.commerceGate === 'off') return 'off';
    return 'on';
  }

  function loadRestrictSettings() {
    var base = {
      commissionHold: 'on',
      productPurchaseGate: 'on',
      marketingStoreGate: 'on',
      profitBelow: defaultProfitBelow(),
      blockedTags: [],
      blockedCategories: []
    };
    try {
      var raw = localStorage.getItem(RESTRICT_STORAGE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      return {
        commissionHold: parsed && parsed.commissionHold === 'off' ? 'off' : 'on',
        productPurchaseGate: restrictFlag(parsed, 'productPurchaseGate'),
        marketingStoreGate: restrictFlag(parsed, 'marketingStoreGate'),
        profitBelow: storedProfitBelow(parsed),
        blockedTags: normalizeNameRows(parsed && parsed.blockedTags),
        blockedCategories: normalizeNameRows(parsed && parsed.blockedCategories)
      };
    } catch (e) {
      return base;
    }
  }

  function getCatalogTags() {
    var map = {};
    function add(list) {
      (list || []).forEach(function (row) {
        var id = String((row && (row.id || row.name)) || '').trim();
        var name = String((row && row.name) || id).trim();
        if (!id || map[id]) return;
        map[id] = { id: id, name: name || id };
      });
    }
    if (
      window.MdmProductSelectionTagStore &&
      typeof window.MdmProductSelectionTagStore.getEnabled === 'function'
    ) {
      add(window.MdmProductSelectionTagStore.getEnabled());
    }
    add(FALLBACK_TAGS);
    return Object.keys(map).map(function (id) {
      return map[id];
    });
  }

  var lowMarginTags = [];
  var lowMarginCategories = [];

  function renderNamePicks(hostId, rows, emptyText) {
    var host = $(hostId);
    if (!host) return;
    var list = normalizeNameRows(rows);
    if (!list.length) {
      host.innerHTML = '<span class="bs-low-margin__empty">' + escapeHtml(emptyText) + '</span>';
      return;
    }
    host.innerHTML = list
      .map(function (row) {
        return (
          '<span class="bs-low-margin__chip" data-id="' +
          escapeHtml(row.id) +
          '"><span>' +
          escapeHtml(row.name) +
          '</span><span data-pick-remove role="button" aria-label="移除">×</span></span>'
        );
      })
      .join('');
  }

  function fillLowMarginForm(data, editing) {
    data = data || loadRestrictSettings();
    lowMarginTags = normalizeNameRows(data.blockedTags);
    lowMarginCategories = normalizeNameRows(data.blockedCategories);
    var input = $('bsLowMarginProfit');
    if (input) input.value = data.profitBelow == null ? '' : String(data.profitBelow);
    renderNamePicks('bsLowMarginTags', lowMarginTags, '未选择');
    renderNamePicks('bsLowMarginCategories', lowMarginCategories, '未选择');
    var section = $('bsRestrictSection');
    var isEditing =
      editing != null ? !!editing : !!(section && section.classList.contains('is-editing'));
    if (!isEditing && section) {
      section.querySelectorAll('.bs-restrict-scope input, .bs-restrict-scope button').forEach(function (el) {
        el.disabled = true;
      });
    }
  }

  function readLowMarginForm() {
    var input = $('bsLowMarginProfit');
    return {
      profitBelow: input ? input.value : '',
      blockedTags: normalizeNameRows(lowMarginTags),
      blockedCategories: normalizeNameRows(lowMarginCategories)
    };
  }

  function restrictCheckedOn(name) {
    var root = $('bsRestrictConfigRoot');
    if (!root) return true;
    var checked = root.querySelector('input[name="' + name + '"]:checked');
    return !checked || checked.value !== 'off';
  }

  function restrictNoteHtml(name, on) {
    function bullets(lead, items) {
      return (
        lead +
        '<ul>' +
        items.map(function (item) { return '<li>' + item + '</li>'; }).join('') +
        '</ul>'
      );
    }
    if (name === 'basicRestrict_commissionHold') {
      return on
        ? '开启：门店合同未签署时，该店分佣由平台代收；合同签署完成后，自动生成补偿结款单。'
        : '关闭：不代收该店分佣，合同签署完成后也不生成补偿结款单。';
    }
    if (name === 'basicRestrict_productPurchaseGate') {
      return on
        ? bullets('开启：指定商品购买需同时满足以下条件：', ['合同已签署', '保证金余额达到应保有金额'])
        : '关闭：不校验合同签署状态及保证金余额，指定商品可正常购买。';
    }
    return on
      ? bullets('开启：门店参与营销活动需同时满足以下条件：', ['合同已签署', '保证金余额达到应保有金额']) +
        '秒杀、新人专区、积分商城不能选营销受限的店。优惠券、福袋、签到、观看任务、现金红包对营销受限门店的用户不可参与，直播间提示「当前门店不支持」。'
      : '关闭：不校验合同签署状态及保证金余额，门店可正常参与营销活动。';
  }

  function syncRestrictNotes() {
    var root = $('bsRestrictConfigRoot');
    if (!root) return;
    root.querySelectorAll('[data-restrict-note]').forEach(function (note) {
      var name = note.getAttribute('data-restrict-note');
      note.innerHTML = restrictNoteHtml(name, restrictCheckedOn(name));
    });
    var scope = root.querySelector('.bs-restrict-scope');
    if (scope) scope.hidden = !restrictCheckedOn('basicRestrict_productPurchaseGate');
  }

  function validateLowMargin(form, gateOn) {
    if (!gateOn) return '';
    var raw = String(form.profitBelow == null ? '' : form.profitBelow).trim();
    var profit = normalizeProfitBelow(raw);
    if (raw !== '' && profit == null) return '商品利润率请填写 0–100 的比例';
    if (profit == null && !form.blockedTags.length && !form.blockedCategories.length) {
      return '指定商品范围请至少配置一项：商品利润率、商品标签或商品类目';
    }
    return '';
  }

  function openNamePicker(title, catalog, selectedRows, onOk) {
    if (!catalog.length) {
      toast('暂无可选项', 'error');
      return;
    }
    var selectedMap = {};
    normalizeNameRows(selectedRows).forEach(function (row) {
      selectedMap[row.id] = true;
    });
    var backdrop = document.createElement('div');
    backdrop.className = 'pts-rule-pick-backdrop';
    backdrop.innerHTML =
      '<div class="pts-rule-pick-modal" role="dialog" aria-modal="true">' +
      '  <div class="pts-rule-pick-modal__header">' +
      '    <h3 class="pts-rule-pick-modal__title">' +
      escapeHtml(title) +
      '</h3>' +
      '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
      '  </div>' +
      '  <div class="pts-rule-pick-modal__body">' +
      '    <input class="erp-input pts-rule-pick-filter" type="text" placeholder="输入名称筛选" data-pick-filter>' +
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
            '</span></label>'
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
      onOk(
        catalog.filter(function (it) {
          return !!selectedMap[it.id];
        })
      );
      close();
    });
    document.body.appendChild(backdrop);
    filterEl.focus();
  }

  function bindLowMarginActions() {
    var tagHost = $('bsLowMarginTags');
    var catHost = $('bsLowMarginCategories');
    function onRemove(ev, kind) {
      var section = $('bsRestrictSection');
      if (!section || !section.classList.contains('is-editing')) return;
      var btn = ev.target.closest('[data-pick-remove]');
      if (!btn) return;
      ev.stopPropagation();
      var chip = btn.closest('.bs-low-margin__chip');
      var id = chip ? chip.getAttribute('data-id') : '';
      if (kind === 'tag') {
        lowMarginTags = lowMarginTags.filter(function (row) {
          return row.id !== id;
        });
        renderNamePicks('bsLowMarginTags', lowMarginTags, '未选择');
      } else {
        lowMarginCategories = lowMarginCategories.filter(function (row) {
          return row.id !== id;
        });
        renderNamePicks('bsLowMarginCategories', lowMarginCategories, '未选择');
      }
    }
    if (tagHost && !tagHost._bsLowBound) {
      tagHost._bsLowBound = true;
      tagHost.addEventListener('click', function (ev) {
        onRemove(ev, 'tag');
      });
    }
    if (catHost && !catHost._bsLowBound) {
      catHost._bsLowBound = true;
      catHost.addEventListener('click', function (ev) {
        onRemove(ev, 'category');
      });
    }
    var tagBtn = $('bsLowMarginTagAdd');
    var catBtn = $('bsLowMarginCategoryAdd');
    if (tagBtn && !tagBtn._bsLowBound) {
      tagBtn._bsLowBound = true;
      tagBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (ev.target.closest('[data-pick-remove]')) return;
        var section = $('bsRestrictSection');
        if (!section || !section.classList.contains('is-editing')) return;
        openNamePicker('选择商品标签', getCatalogTags(), lowMarginTags, function (rows) {
          lowMarginTags = normalizeNameRows(rows);
          renderNamePicks('bsLowMarginTags', lowMarginTags, '未选择');
        });
      });
    }
    if (catBtn && !catBtn._bsLowBound) {
      catBtn._bsLowBound = true;
      catBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (ev.target.closest('[data-pick-remove]')) return;
        var section = $('bsRestrictSection');
        if (!section || !section.classList.contains('is-editing')) return;
        openNamePicker('选择商品类目', getCatalogCategories(), lowMarginCategories, function (rows) {
          lowMarginCategories = normalizeNameRows(rows);
          renderNamePicks('bsLowMarginCategories', lowMarginCategories, '未选择');
        });
      });
    }
  }

  function restrictSwitch(label, name, on) {
    return (
      '<div class="store-order-config__item">' +
      '  <div class="store-order-config__label"><span class="store-order-config__required">*</span>' +
      label +
      '</div>' +
      '  <div class="store-order-config__control">' +
      '    <div class="store-order-config__radios">' +
      '      <label class="store-order-config__radio"><input type="radio" name="' +
      name +
      '" value="on"' +
      (on ? ' checked' : '') +
      '>开启</label>' +
      '      <label class="store-order-config__radio"><input type="radio" name="' +
      name +
      '" value="off"' +
      (on ? '' : ' checked') +
      '>关闭</label>' +
      '    </div>' +
      '    <div class="store-order-config__hint" data-restrict-note="' +
      name +
      '"></div>' +
      '  </div>' +
      '</div>'
    );
  }

  function readRestrictSwitches() {
    function val(name) {
      return restrictCheckedOn(name) ? 'on' : 'off';
    }
    return {
      commissionHold: val('basicRestrict_commissionHold'),
      productPurchaseGate: val('basicRestrict_productPurchaseGate'),
      marketingStoreGate: val('basicRestrict_marketingStoreGate')
    };
  }

  function mountRestrictConfig() {
    var root = $('bsRestrictConfigRoot');
    if (!root) return null;
    var settings = loadRestrictSettings();
    root.innerHTML =
      '<p class="sac-tip bs-restrict-intro">配置门店合同未签署或保证金未达标时的业务限制规则。</p>' +
      restrictSwitch('分佣代收', 'basicRestrict_commissionHold', settings.commissionHold !== 'off') +
      restrictSwitch('指定商品购买限制', 'basicRestrict_productPurchaseGate', settings.productPurchaseGate !== 'off') +
      '<div class="bs-restrict-scope">' +
      '  <div class="sac-field">' +
      '    <div class="sac-field__label">商品利润率</div>' +
      '    <div class="sac-field__control">' +
      '      <div class="bs-low-margin__profit">' +
      '        <span>低于</span>' +
      '        <input id="bsLowMarginProfit" class="erp-input" type="number" min="0" max="100" step="0.1" placeholder="请输入">' +
      '        <span>%</span>' +
      '      </div>' +
      '      <div class="sac-tip">以下条件至少配置一项，可多项同时配置。商品满足任一已配置条件时，纳入限制购买范围。</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="sac-field">' +
      '    <div class="sac-field__label">商品标签</div>' +
      '    <div class="sac-field__control">' +
      '      <div class="bs-low-margin__pick-row">' +
      '        <div class="bs-low-margin__picks" id="bsLowMarginTags"></div>' +
      '        <button type="button" class="erp-btn" id="bsLowMarginTagAdd">选择</button>' +
      '      </div>' +
      '      <div class="sac-tip">可多选。</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="sac-field">' +
      '    <div class="sac-field__label">商品类目</div>' +
      '    <div class="sac-field__control">' +
      '      <div class="bs-low-margin__pick-row">' +
      '        <div class="bs-low-margin__picks" id="bsLowMarginCategories"></div>' +
      '        <button type="button" class="erp-btn" id="bsLowMarginCategoryAdd">选择</button>' +
      '      </div>' +
      '      <div class="sac-tip">可多选。</div>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      restrictSwitch('营销选店限制', 'basicRestrict_marketingStoreGate', settings.marketingStoreGate !== 'off');
    fillLowMarginForm(settings, false);
    bindLowMarginActions();
    root.querySelectorAll('input[type="radio"]').forEach(function (input) {
      if (input._bsRestrictBound) return;
      input._bsRestrictBound = true;
      input.addEventListener('change', syncRestrictNotes);
    });
    syncRestrictNotes();
    return root;
  }

  function bind() {
    var orderRoot = mountOrderConfig();
    var restrictRoot = mountRestrictConfig();
    bindCollapse('bsOrderSection', 'bsOrderSectionToggle');
    bindCollapse('bsAccountSection', 'bsAccountSectionToggle');
    bindCollapse('bsHoursSection', 'bsHoursSectionToggle');
    bindCollapse('bsRestrictSection', 'bsRestrictSectionToggle');

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

    bindSectionEditMode({
      sectionId: 'bsRestrictSection',
      editId: 'bsRestrictEditBtn',
      cancelId: 'bsRestrictCancelBtn',
      saveId: 'bsRestrictSaveBtn',
      takeSnapshot: function () {
        var saved = loadRestrictSettings();
        if (!restrictRoot) return saved;
        var switches = readRestrictSwitches();
        var low = readLowMarginForm();
        return {
          commissionHold: switches.commissionHold,
          productPurchaseGate: switches.productPurchaseGate,
          marketingStoreGate: switches.marketingStoreGate,
          profitBelow: low.profitBelow,
          blockedTags: low.blockedTags.map(function (row) {
            return Object.assign({}, row);
          }),
          blockedCategories: low.blockedCategories.map(function (row) {
            return Object.assign({}, row);
          })
        };
      },
      restoreSnapshot: function (data) {
        if (!restrictRoot || !data) return;
        [
          ['basicRestrict_commissionHold', 'commissionHold'],
          ['basicRestrict_productPurchaseGate', 'productPurchaseGate'],
          ['basicRestrict_marketingStoreGate', 'marketingStoreGate']
        ].forEach(function (pair) {
          var val = data[pair[1]] === 'off' ? 'off' : 'on';
          restrictRoot.querySelectorAll('input[name="' + pair[0] + '"]').forEach(function (r) {
            r.checked = r.value === val;
            r.dispatchEvent(new Event('change', { bubbles: true }));
          });
        });
        fillLowMarginForm(data, true);
      },
      onSave: function () {
        if (!restrictRoot) return false;
        var switches = readRestrictSwitches();
        var low = readLowMarginForm();
        var gateOn = switches.productPurchaseGate !== 'off';
        var err = validateLowMargin(low, gateOn);
        if (err) {
          toast(err, 'error');
          return false;
        }
        var data = {
          commissionHold: switches.commissionHold,
          productPurchaseGate: switches.productPurchaseGate,
          marketingStoreGate: switches.marketingStoreGate,
          profitBelow: normalizeProfitBelow(low.profitBelow),
          blockedTags: low.blockedTags,
          blockedCategories: low.blockedCategories
        };
        localStorage.setItem(RESTRICT_STORAGE_KEY, JSON.stringify(data));
        try {
          if (data.profitBelow == null) localStorage.removeItem('lf_low_margin_threshold_v1');
          else localStorage.setItem('lf_low_margin_threshold_v1', String(data.profitBelow));
        } catch (e) {}
        if (
          data.profitBelow != null &&
          window.LfLowMargin &&
          typeof window.LfLowMargin.setThreshold === 'function'
        ) {
          window.LfLowMargin.setThreshold(data.profitBelow);
        }
        fillLowMarginForm(data, false);
        toast('合同未完成限制已保存', 'success');
        return true;
      }
    });
  }

  window.LfStoreContractRestrict = {
    load: loadRestrictSettings,
    commissionHoldOn: function () {
      return loadRestrictSettings().commissionHold !== 'off';
    },
    productPurchaseOn: function () {
      return loadRestrictSettings().productPurchaseGate !== 'off';
    },
    marketingStoreOn: function () {
      return loadRestrictSettings().marketingStoreGate !== 'off';
    },
    commerceGateOn: function () {
      return loadRestrictSettings().productPurchaseGate !== 'off';
    },
    lowMargin: function () {
      var saved = loadRestrictSettings();
      return {
        profitBelow: saved.profitBelow,
        blockedTags: saved.blockedTags.slice(),
        blockedCategories: saved.blockedCategories.slice()
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
