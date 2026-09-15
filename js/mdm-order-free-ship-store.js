/**
 * 订单配置 · 包邮配置（按履约方式的全局默认）
 * 商品编辑未单独改过「是否包邮」时，跟本页。
 */
(function (global) {
  var STORAGE_KEY = 'lf_order_free_ship_v1';

  var DEFAULTS = {
    delivery: false,
    pickup: true,
    express: true
  };

  var ROWS = [
    {
      key: 'delivery',
      label: '配送',
      apply: '代采订单',
      tip: '未包邮时按 TMS 物流费率表计费（仓 → 门店）。'
    },
    {
      key: 'pickup',
      label: '自提',
      apply: '零售、直播',
      tip: '用户到店自提。包邮则不收客户运费。'
    },
    {
      key: 'express',
      label: '快递',
      apply: '零售、代采、直播',
      tip: '快递到家 / 代采快递。包邮则不收客户运费。'
    }
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeFulfill(fulfill) {
    var f = String(fulfill || '').trim();
    if (
      f === 'platform' ||
      f === 'warehouse' ||
      f === 'delivery' ||
      f === '配送' ||
      f === '平台配送'
    ) {
      return 'delivery';
    }
    if (f === 'pickup' || f === '自提' || f === '门店自提' || f === 'SELF_PICKUP') {
      return 'pickup';
    }
    if (
      f === 'express' ||
      f === 'store' ||
      f === 'mail' ||
      f === '快递' ||
      f === '快递到家' ||
      f === '快递配送'
    ) {
      return 'express';
    }
    return '';
  }

  function normalizeRule(raw) {
    var rule = clone(DEFAULTS);
    if (!raw || typeof raw !== 'object') return rule;
    ROWS.forEach(function (row) {
      if (typeof raw[row.key] === 'boolean') rule[row.key] = raw[row.key];
    });
    return rule;
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULTS);
      return normalizeRule(JSON.parse(raw));
    } catch (e) {
      return clone(DEFAULTS);
    }
  }

  function save(rule) {
    var next = normalizeRule(rule);
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      /* ignore */
    }
    return next;
  }

  function reset() {
    return save(clone(DEFAULTS));
  }

  function isFreeShip(fulfill) {
    var key = normalizeFulfill(fulfill);
    if (!key) return true;
    return !!load()[key];
  }

  global.MdmOrderFreeShip = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULTS: clone(DEFAULTS),
    ROWS: ROWS,
    normalizeFulfill: normalizeFulfill,
    load: load,
    save: save,
    reset: reset,
    isFreeShip: isFreeShip
  };
})(typeof window !== 'undefined' ? window : this);
