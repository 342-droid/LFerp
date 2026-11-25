/**
 * 结算起算 / 周期：零售、代采各一套平台默认；供应商可按业态跟随或独立配置。
 * 佣金开关、出账时间仍是平台通用项，不按业态拆开。
 * 平台改某一业态后：只同步「跟随该业态平台默认」的供应商。已生成清分不变，新增按新配置。
 * 结款方式仍落在供应商结算配置里，详情与编辑表单共用。
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
    inherit: '跟随平台',
    inheritRetail: '跟随零售平台默认',
    inheritProcure: '跟随代采平台默认',
    override: '独立配置'
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
    retailTrigger: 'fulfill',
    retailCycle: '1',
    procureTrigger: 'aftersale',
    procureCycle: '7',
    /* 旧字段保留为零售别名，避免历史读取落空 */
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

  function normalizeTrigger(v, fallback) {
    return v === 'aftersale' || v === 'fulfill' ? v : fallback;
  }

  function normalizeCycle(v, fallback) {
    var s = v == null || v === '' ? '' : String(v);
    if (!s) return String(fallback);
    for (var i = 0; i < CYCLE_OPTIONS.length; i++) {
      if (CYCLE_OPTIONS[i].value === s) return s;
    }
    return String(fallback);
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
    /* 旧版只有一套起算/周期时，两业态都沿用，避免已保存的演示被默认值改掉 */
    if (saved.retailTrigger == null && saved.trigger != null) {
      out.retailTrigger = saved.trigger;
      out.retailCycle = saved.cycle != null ? saved.cycle : out.retailCycle;
    }
    if (saved.procureTrigger == null && saved.trigger != null) {
      out.procureTrigger = saved.trigger;
      out.procureCycle = saved.cycle != null ? saved.cycle : out.procureCycle;
    }
    out.retailTrigger = normalizeTrigger(out.retailTrigger, 'fulfill');
    out.procureTrigger = normalizeTrigger(out.procureTrigger, 'aftersale');
    out.retailCycle = normalizeCycle(out.retailCycle, '1');
    out.procureCycle = normalizeCycle(out.procureCycle, '7');
    out.trigger = out.retailTrigger;
    out.cycle = out.retailCycle;
    return out;
  }

  function saveConfig(partial) {
    var next = Object.assign({}, loadConfig(), partial || {});
    next.retailTrigger = normalizeTrigger(next.retailTrigger, 'fulfill');
    next.procureTrigger = normalizeTrigger(next.procureTrigger, 'aftersale');
    next.retailCycle = normalizeCycle(next.retailCycle, '1');
    next.procureCycle = normalizeCycle(next.procureCycle, '7');
    next.trigger = next.retailTrigger;
    next.cycle = next.retailCycle;
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

  function followsRetail(row) {
    if (!row) return true;
    if (row.followRetail != null) return row.followRetail !== false;
    return row.followPlatform !== false;
  }

  function followsProcure(row) {
    if (!row) return true;
    if (row.followProcure != null) return row.followProcure !== false;
    return row.followPlatform !== false;
  }

  function storedTrigger(row, line, fallback) {
    var key = line === 'procure' ? 'procureTrigger' : 'retailTrigger';
    if (row && row[key] != null) return normalizeTrigger(row[key], fallback);
    if (row && row.trigger != null) return normalizeTrigger(row.trigger, fallback);
    return fallback;
  }

  function storedCycle(row, line, fallback) {
    var key = line === 'procure' ? 'procureCycle' : 'retailCycle';
    if (row && row[key] != null && row[key] !== '') return normalizeCycle(row[key], fallback);
    if (row && row.cycle != null && row.cycle !== '') return normalizeCycle(row.cycle, fallback);
    return String(fallback);
  }

  function blankSupplier(key, cfg) {
    return {
      key: key,
      followRetail: true,
      followProcure: true,
      followPlatform: true,
      retailTrigger: cfg.retailTrigger,
      retailCycle: cfg.retailCycle,
      procureTrigger: cfg.procureTrigger,
      procureCycle: cfg.procureCycle,
      trigger: cfg.retailTrigger,
      cycle: cfg.retailCycle,
      payMethod: 'goods_first'
    };
  }

  function getSupplier(id, name) {
    var map = loadSupplierMap();
    var key = normalizeSupplierKey(id, name);
    var row = map[key];
    var cfg = loadConfig();
    if (!row) return blankSupplier(key, cfg);
    var followRetail = followsRetail(row);
    var followProcure = followsProcure(row);
    var retailTrigger = followRetail
      ? cfg.retailTrigger
      : storedTrigger(row, 'retail', cfg.retailTrigger);
    var retailCycle = followRetail
      ? cfg.retailCycle
      : storedCycle(row, 'retail', cfg.retailCycle);
    var procureTrigger = followProcure
      ? cfg.procureTrigger
      : storedTrigger(row, 'procure', cfg.procureTrigger);
    var procureCycle = followProcure
      ? cfg.procureCycle
      : storedCycle(row, 'procure', cfg.procureCycle);
    return {
      key: key,
      followRetail: followRetail,
      followProcure: followProcure,
      followPlatform: followRetail && followProcure,
      retailTrigger: retailTrigger,
      retailCycle: retailCycle,
      procureTrigger: procureTrigger,
      procureCycle: procureCycle,
      trigger: retailTrigger,
      cycle: retailCycle,
      payMethod: normalizePayMethod(row.payMethod)
    };
  }

  function saveSupplier(id, name, data) {
    data = data || {};
    var map = loadSupplierMap();
    var key = normalizeSupplierKey(id, name);
    var cfg = loadConfig();
    var prev = map[key] || {};
    var legacy =
      data.followRetail == null &&
      data.followProcure == null &&
      (data.followPlatform != null || data.trigger != null || data.cycle != null);
    var followRetail = legacy ? data.followPlatform !== false : data.followRetail !== false;
    var followProcure = legacy ? data.followPlatform !== false : data.followProcure !== false;
    var retailTrigger = followRetail
      ? cfg.retailTrigger
      : normalizeTrigger(legacy ? data.trigger : data.retailTrigger, cfg.retailTrigger);
    var procureTrigger = followProcure
      ? cfg.procureTrigger
      : normalizeTrigger(legacy ? data.trigger : data.procureTrigger, cfg.procureTrigger);
    var retailCycle = followRetail
      ? cfg.retailCycle
      : normalizeCycle(legacy ? data.cycle : data.retailCycle, cfg.retailCycle);
    var procureCycle = followProcure
      ? cfg.procureCycle
      : normalizeCycle(legacy ? data.cycle : data.procureCycle, cfg.procureCycle);
    map[key] = {
      followRetail: followRetail,
      followProcure: followProcure,
      followPlatform: followRetail && followProcure,
      retailTrigger: retailTrigger,
      retailCycle: retailCycle,
      procureTrigger: procureTrigger,
      procureCycle: procureCycle,
      trigger: retailTrigger,
      cycle: retailCycle,
      payMethod: normalizePayMethod(data.payMethod != null ? data.payMethod : prev.payMethod),
      name: String(name || '').trim(),
      updatedAt: new Date().toISOString()
    };
    persistSupplierMap(map);
    return getSupplier(id, name);
  }

  /** 平台默认变更后，只同步跟随对应业态的供应商 */
  function syncFollowers(cfg) {
    var map = loadSupplierMap();
    var changed = false;
    Object.keys(map).forEach(function (key) {
      var row = map[key];
      if (!row) return;
      var touch = false;
      if (followsRetail(row)) {
        row.followRetail = true;
        if (row.retailTrigger !== cfg.retailTrigger || String(row.retailCycle) !== String(cfg.retailCycle)) {
          row.retailTrigger = cfg.retailTrigger;
          row.retailCycle = cfg.retailCycle;
          touch = true;
        }
      }
      if (followsProcure(row)) {
        row.followProcure = true;
        if (
          row.procureTrigger !== cfg.procureTrigger ||
          String(row.procureCycle) !== String(cfg.procureCycle)
        ) {
          row.procureTrigger = cfg.procureTrigger;
          row.procureCycle = cfg.procureCycle;
          touch = true;
        }
      }
      var retailTrigger = followsRetail(row) ? cfg.retailTrigger : row.retailTrigger || row.trigger;
      var retailCycle = followsRetail(row) ? cfg.retailCycle : row.retailCycle || row.cycle;
      if (row.trigger !== retailTrigger || String(row.cycle) !== String(retailCycle)) {
        row.trigger = retailTrigger;
        row.cycle = retailCycle;
        touch = true;
      }
      if (touch) {
        row.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) persistSupplierMap(map);
  }

  function cycleLabel(value) {
    var s = value == null ? '' : String(value);
    for (var i = 0; i < CYCLE_OPTIONS.length; i++) {
      if (CYCLE_OPTIONS[i].value === s) return CYCLE_OPTIONS[i].label;
    }
    return s || '—';
  }

  function triggerLabel(value) {
    return TRIGGER_LABELS[value] || TRIGGER_LABELS.fulfill;
  }

  function payMethodLabel(value) {
    return PAY_METHOD_LABELS[normalizePayMethod(value)] || PAY_METHOD_LABELS.goods_first;
  }

  function lineStrategyLabel(line, follow) {
    if (follow === false) return STRATEGY_LABELS.override;
    return line === 'procure' ? STRATEGY_LABELS.inheritProcure : STRATEGY_LABELS.inheritRetail;
  }

  function strategyLabel(followPlatform, line) {
    if (line) return lineStrategyLabel(line, followPlatform);
    return followPlatform === false ? STRATEGY_LABELS.override : STRATEGY_LABELS.inherit;
  }

  function describeLine(sc, line) {
    var procure = line === 'procure';
    var follow = procure ? sc.followProcure !== false : sc.followRetail !== false;
    var trigger = procure ? sc.procureTrigger : sc.retailTrigger;
    var cycle = procure ? sc.procureCycle : sc.retailCycle;
    return (
      (procure ? '代采' : '零售') +
      '：' +
      lineStrategyLabel(line, follow) +
      '，' +
      triggerLabel(trigger) +
      '，' +
      cycleLabel(cycle)
    );
  }

  function describeSupplier(sc) {
    if (!sc) return '—';
    return [payMethodLabel(sc.payMethod), describeLine(sc, 'retail'), describeLine(sc, 'procure')].join('；');
  }

  function briefLine(sc, line) {
    var procure = line === 'procure';
    var follow = procure ? sc.followProcure !== false : sc.followRetail !== false;
    var trigger = procure ? sc.procureTrigger : sc.retailTrigger;
    var cycle = procure ? sc.procureCycle : sc.retailCycle;
    return (
      (procure ? '代采' : '零售') +
      '：' +
      (follow ? '跟随平台' : '独立') +
      ' · ' +
      triggerLabel(trigger) +
      ' · ' +
      cycleLabel(cycle)
    );
  }

  /** 列表「结算信息」摘要：结款方式 / 零售 / 代采 */
  function formatSupplierSettleSummary(id, name) {
    var sc = getSupplier(id, name);
    return [payMethodLabel(sc.payMethod), briefLine(sc, 'retail'), briefLine(sc, 'procure')].join(' / ');
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
    lineStrategyLabel: lineStrategyLabel,
    describeLine: describeLine,
    describeSupplier: describeSupplier,
    formatSupplierSettleSummary: formatSupplierSettleSummary
  };
})(typeof window !== 'undefined' ? window : this);
