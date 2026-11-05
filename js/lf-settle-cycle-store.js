/**
 * 结算起算节点 / 平台默认周期 / 供应商覆盖（原型共享）
 * - 平台改默认后：标记「跟随平台」的供应商自动同步；已生成清分不变，新增按新配置。
 * - 结款方式一并落在供应商结算配置里，详情与编辑表单共用。
 */
(function (global) {
  var CFG_KEY = 'lf_settle_general_config_v1';
  var SUP_KEY = 'lf_supplier_settle_cycle_v1';

  var TRIGGER_LABELS = {
    fulfill: '订单履约确认后',
    aftersale: '售后期结束'
  };

  var PAY_METHOD_LABELS = {
    goods_first: '先货后款',
    pay_first: '先款后货'
  };

  var STRATEGY_LABELS = {
    inherit: '平台通用配置',
    override: '供应商独立配置'
  };

  var CYCLE_OPTIONS = [
    { value: '1', label: '1天' },
    { value: '2', label: '2天' },
    { value: '3', label: '3天' },
    { value: '5', label: '5天' },
    { value: '7', label: '7天' },
    { value: '15', label: '15天' },
    { value: '30', label: '30天' },
    { value: 'month', label: '自然月1日' }
  ];

  var DEFAULT_CFG = {
    trigger: 'fulfill',
    cycle: '1',
    generate: '00:01',
    autoBill: true,
    payHours: '1',
    master: true,
    exclude: false,
    excludeTypes: [],
    min: '0.00',
    roundMode: 'round'
  };

  function safeParse(raw, fallback) {
    try {
      var v = JSON.parse(raw);
      return v && typeof v === 'object' ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function loadConfig() {
    var raw = null;
    try {
      raw = global.localStorage && global.localStorage.getItem(CFG_KEY);
    } catch (e) {
      raw = null;
    }
    var saved = raw ? safeParse(raw, {}) : {};
    var out = {};
    Object.keys(DEFAULT_CFG).forEach(function (k) {
      out[k] = saved[k] != null ? saved[k] : DEFAULT_CFG[k];
    });
    if (out.trigger !== 'fulfill' && out.trigger !== 'aftersale') out.trigger = 'fulfill';
    return out;
  }

  function saveConfig(partial) {
    var next = Object.assign({}, loadConfig(), partial || {});
    try {
      if (global.localStorage) global.localStorage.setItem(CFG_KEY, JSON.stringify(next));
    } catch (e) {}
    syncFollowers(next);
    return next;
  }

  function loadSupplierMap() {
    var raw = null;
    try {
      raw = global.localStorage && global.localStorage.getItem(SUP_KEY);
    } catch (e) {
      raw = null;
    }
    return raw ? safeParse(raw, {}) : {};
  }

  function persistSupplierMap(map) {
    try {
      if (global.localStorage) global.localStorage.setItem(SUP_KEY, JSON.stringify(map || {}));
    } catch (e) {}
  }

  function normalizeSupplierKey(id, name) {
    var k = String(id || '').trim();
    if (k) return k;
    return 'name:' + String(name || '').trim();
  }

  function normalizePayMethod(v) {
    return v === 'pay_first' ? 'pay_first' : 'goods_first';
  }

  function getSupplier(id, name) {
    var map = loadSupplierMap();
    var key = normalizeSupplierKey(id, name);
    var row = map[key];
    var cfg = loadConfig();
    if (!row) {
      return {
        key: key,
        trigger: cfg.trigger,
        cycle: cfg.cycle,
        followPlatform: true,
        payMethod: 'goods_first'
      };
    }
    var follow = row.followPlatform !== false;
    return {
      key: key,
      trigger: follow
        ? cfg.trigger
        : row.trigger === 'aftersale'
          ? 'aftersale'
          : 'fulfill',
      cycle: follow ? cfg.cycle : row.cycle || cfg.cycle,
      followPlatform: follow,
      payMethod: normalizePayMethod(row.payMethod)
    };
  }

  function saveSupplier(id, name, data) {
    var map = loadSupplierMap();
    var key = normalizeSupplierKey(id, name);
    var cfg = loadConfig();
    var follow = !!(data && data.followPlatform);
    var prev = map[key] || {};
    map[key] = {
      trigger: follow ? cfg.trigger : data && data.trigger === 'aftersale' ? 'aftersale' : 'fulfill',
      cycle: follow ? cfg.cycle : (data && data.cycle) || cfg.cycle,
      followPlatform: follow,
      payMethod: normalizePayMethod(
        data && data.payMethod != null ? data.payMethod : prev.payMethod
      ),
      name: String(name || '').trim(),
      updatedAt: new Date().toISOString()
    };
    persistSupplierMap(map);
    return getSupplier(id, name);
  }

  /** 平台默认变更后，同步所有「跟随平台」的供应商配置 */
  function syncFollowers(cfg) {
    var map = loadSupplierMap();
    var changed = false;
    Object.keys(map).forEach(function (key) {
      var row = map[key];
      if (!row || row.followPlatform === false) return;
      if (row.trigger !== cfg.trigger || row.cycle !== cfg.cycle) {
        row.trigger = cfg.trigger;
        row.cycle = cfg.cycle;
        row.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) persistSupplierMap(map);
  }

  function cycleLabel(value) {
    for (var i = 0; i < CYCLE_OPTIONS.length; i++) {
      if (CYCLE_OPTIONS[i].value === value) return CYCLE_OPTIONS[i].label;
    }
    return value || '—';
  }

  function triggerLabel(value) {
    return TRIGGER_LABELS[value] || TRIGGER_LABELS.fulfill;
  }

  function payMethodLabel(value) {
    return PAY_METHOD_LABELS[normalizePayMethod(value)] || PAY_METHOD_LABELS.goods_first;
  }

  function strategyLabel(followPlatform) {
    return followPlatform === false ? STRATEGY_LABELS.override : STRATEGY_LABELS.inherit;
  }

  /** 列表「结算信息」摘要：结款方式 / 策略 / 起算 / 周期 */
  function formatSupplierSettleSummary(id, name) {
    var sc = getSupplier(id, name);
    return [
      payMethodLabel(sc.payMethod),
      strategyLabel(sc.followPlatform),
      triggerLabel(sc.trigger),
      cycleLabel(sc.cycle)
    ].join(' / ');
  }

  global.LFSettleCycleStore = {
    CFG_KEY: CFG_KEY,
    SUP_KEY: SUP_KEY,
    CYCLE_OPTIONS: CYCLE_OPTIONS,
    TRIGGER_LABELS: TRIGGER_LABELS,
    PAY_METHOD_LABELS: PAY_METHOD_LABELS,
    STRATEGY_LABELS: STRATEGY_LABELS,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    getSupplier: getSupplier,
    saveSupplier: saveSupplier,
    syncFollowers: syncFollowers,
    cycleLabel: cycleLabel,
    triggerLabel: triggerLabel,
    payMethodLabel: payMethodLabel,
    strategyLabel: strategyLabel,
    formatSupplierSettleSummary: formatSupplierSettleSummary
  };
})(typeof window !== 'undefined' ? window : this);
