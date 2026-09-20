/**
 * 包邮配置（按订单渠道 × 履约方式）
 * 开关开启 = 包邮；关闭 = 按 TMS 物流费率表计费。
 * 零售自提、零售快递：固定包邮，不可关闭。
 * 代采配送、代采快递可开可关；商品编辑未单独改过「是否包邮」时，跟本页。
 */
(function (global) {
  var STORAGE_KEY = 'lf_order_free_ship_v2';
  var LEGACY_KEY = 'lf_order_free_ship_v1';

  var DEFAULTS = {
    retail: { pickup: true, express: true },
    proxy: { delivery: false, express: true }
  };

  var CHANNELS = [
    {
      key: 'retail',
      label: '零售',
      tip: '适用商城、直播零售订单。',
      rows: [
        { key: 'pickup', label: '自提', locked: true, tip: '用户到店自提。固定包邮，不收客户运费。' },
        { key: 'express', label: '快递', locked: true, tip: '快递到家。固定包邮，不收客户运费。' }
      ]
    },
    {
      key: 'proxy',
      label: '代采',
      tip: '适用门店代采进货订单。',
      rows: [
        { key: 'delivery', label: '配送', tip: '仓配到店。关闭则按门店对应配送仓 → 门店地址计费。' },
        { key: 'express', label: '快递', tip: '代采快递到店。关闭则按供应商发货地 → 门店地址计费，计费方式与配送相同。' }
      ]
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
      f === '快递到店' ||
      f === '快递配送'
    ) {
      return 'express';
    }
    return '';
  }

  function normalizeChannel(channel) {
    var c = String(channel || '').trim();
    if (
      c === 'retail' ||
      c === 'mall' ||
      c === 'live' ||
      c === '零售' ||
      c === '零售订单' ||
      c === '商城' ||
      c === '直播'
    ) {
      return 'retail';
    }
    if (c === 'proxy' || c === '代采' || c === '代采订单') {
      return 'proxy';
    }
    return '';
  }

  function isLocked(channel, fulfill) {
    var ch = normalizeChannel(channel);
    var f = normalizeFulfill(fulfill);
    var group = CHANNELS.filter(function (item) {
      return item.key === ch;
    })[0];
    if (!group) return false;
    var row = group.rows.filter(function (item) {
      return item.key === f;
    })[0];
    return !!(row && row.locked);
  }

  function applyLocked(rule) {
    var next = rule && typeof rule === 'object' ? rule : clone(DEFAULTS);
    CHANNELS.forEach(function (ch) {
      if (!next[ch.key] || typeof next[ch.key] !== 'object') next[ch.key] = {};
      ch.rows.forEach(function (row) {
        if (row.locked) next[ch.key][row.key] = true;
      });
    });
    return next;
  }

  function migrateLegacy(raw) {
    var next = clone(DEFAULTS);
    if (!raw || typeof raw !== 'object') return applyLocked(next);
    if (typeof raw.delivery === 'boolean') next.proxy.delivery = raw.delivery;
    return applyLocked(next);
  }

  function normalizeRule(raw) {
    var rule = clone(DEFAULTS);
    if (!raw || typeof raw !== 'object') return applyLocked(rule);
    if (raw.retail || raw.proxy) {
      CHANNELS.forEach(function (ch) {
        var src = raw[ch.key];
        if (!src || typeof src !== 'object') return;
        ch.rows.forEach(function (row) {
          if (row.locked) return;
          if (typeof src[row.key] === 'boolean') rule[ch.key][row.key] = src[row.key];
        });
      });
      return applyLocked(rule);
    }
    return migrateLegacy(raw);
  }

  function readStorage(key) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function load() {
    var current = readStorage(STORAGE_KEY);
    if (current) return normalizeRule(current);
    var legacy = readStorage(LEGACY_KEY);
    if (legacy) return migrateLegacy(legacy);
    return clone(DEFAULTS);
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

  function isFreeShip(fulfill, channel) {
    if (isLocked(channel, fulfill)) return true;
    var rule = load();
    var f = normalizeFulfill(fulfill);
    var ch = normalizeChannel(channel);
    if (ch && f && rule[ch] && typeof rule[ch][f] === 'boolean') {
      return !!rule[ch][f];
    }
    if (f === 'pickup') return !!rule.retail.pickup;
    if (f === 'delivery') return !!rule.proxy.delivery;
    if (f === 'express') return !!(rule.retail.express && rule.proxy.express);
    return true;
  }

  global.MdmOrderFreeShip = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULTS: clone(DEFAULTS),
    CHANNELS: CHANNELS,
    normalizeFulfill: normalizeFulfill,
    normalizeChannel: normalizeChannel,
    load: load,
    save: save,
    reset: reset,
    isLocked: isLocked,
    isFreeShip: isFreeShip
  };
})(typeof window !== 'undefined' ? window : this);
