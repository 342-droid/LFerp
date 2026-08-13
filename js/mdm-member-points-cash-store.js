/**
 * 会员 · 积分抵现规则列表（localStorage）
 * Key: mdm_member_points_cash_v1
 * 若本地为空，会尝试从旧版全局积分规则 mdm_member_points_rule_v1.cash 迁移一条默认规则
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_member_points_cash_v1';
  var LEGACY_RULE_KEY = 'mdm_member_points_rule_v1';
  var Scope = global.MdmMemberPointsScope;

  var SEED = [
    {
      id: 'PX10001',
      name: '默认积分抵现',
      enabled: true,
      perPointAmount: 0.01,
      maxRatio: 50,
      maxAmount: 100,
      portScope: 'all',
      ports: [],
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      productScope: { type: 'all', products: [], categories: [] },
      createdAt: '2026-07-01 10:00:00',
      updatedAt: '2026-07-28 14:20:11'
    },
    {
      id: 'PX10002',
      name: 'APP 生鲜类抵现',
      enabled: true,
      perPointAmount: 0.01,
      maxRatio: 30,
      maxAmount: 50,
      portScope: 'custom',
      ports: ['app'],
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      productScope: {
        type: 'include_category',
        products: [],
        categories: [{ id: '新鲜蔬菜', name: '新鲜蔬菜' }]
      },
      createdAt: '2026-07-20 11:00:00',
      updatedAt: '2026-08-02 16:40:00'
    },
    {
      id: 'PX10003',
      name: '北京门店抵现',
      enabled: true,
      perPointAmount: 0.02,
      maxRatio: 40,
      maxAmount: 80,
      portScope: 'all',
      ports: [],
      saleScope: 'store',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: { 'st-005': 1, 'st-006': 1 },
      productScope: { type: 'all', products: [], categories: [] },
      createdAt: '2026-07-25 15:00:00',
      updatedAt: '2026-08-04 10:00:00'
    }
  ];

  var list = [];
  var loaded = false;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatNow() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad2(d.getMonth() + 1) +
      '-' +
      pad2(d.getDate()) +
      ' ' +
      pad2(d.getHours()) +
      ':' +
      pad2(d.getMinutes()) +
      ':' +
      pad2(d.getSeconds())
    );
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeProductScope(scope) {
    if (Scope && Scope.normalizeScope) return Scope.normalizeScope(scope);
    scope = scope || {};
    return {
      type: scope.type || 'all',
      products: Array.isArray(scope.products) ? scope.products : [],
      categories: Array.isArray(scope.categories) ? scope.categories : []
    };
  }

  function normalizeAdcode(code) {
    var s = String(code || '');
    while (s.length > 2 && s.slice(-2) === '00') s = s.slice(0, -2);
    return s;
  }

  function regionCodesOverlap(a, b) {
    if (!a || !b) return false;
    var na = normalizeAdcode(a);
    var nb = normalizeAdcode(b);
    return na === nb || na.indexOf(nb) === 0 || nb.indexOf(na) === 0;
  }

  function saleRegionsCoverCode(saleRegions, code) {
    if (!code) return true;
    var map = saleRegions || {};
    var keys = Object.keys(map);
    if (!keys.length) return false;
    return keys.some(function (k) {
      return map[k] && regionCodesOverlap(k, code);
    });
  }

  function normalizeSaleFields(raw) {
    var saleScope = raw.saleScope;
    if (saleScope !== 'all' && saleScope !== 'region' && saleScope !== 'store') {
      saleScope = raw.storeScope === 'store' ? 'store' : 'all';
    }
    var saleRegions = {};
    var saleRegionSummary = [];
    var saleStores = {};
    if (saleScope === 'region') {
      saleRegions = raw.saleRegions && typeof raw.saleRegions === 'object' ? clone(raw.saleRegions) : {};
      saleRegionSummary = Array.isArray(raw.saleRegionSummary) ? raw.saleRegionSummary.slice() : [];
    } else if (saleScope === 'store') {
      var storesSrc = raw.saleStores && typeof raw.saleStores === 'object'
        ? raw.saleStores
        : (raw.stores && typeof raw.stores === 'object' ? raw.stores : {});
      saleStores = clone(storesSrc);
    }
    return {
      saleScope: saleScope,
      saleRegions: saleRegions,
      saleRegionSummary: saleRegionSummary,
      saleStores: saleStores
    };
  }

  function normalizeItem(raw) {
    raw = raw || {};
    var portScope = raw.portScope === 'custom' ? 'custom' : 'all';
    var ports = Array.isArray(raw.ports) ? raw.ports.filter(function (p) {
      return p === 'mini' || p === 'app';
    }) : [];
    var sale = normalizeSaleFields(raw);
    return {
      id: String(raw.id || ''),
      name: String(raw.name || '').trim(),
      enabled: raw.enabled !== false,
      perPointAmount: Number(raw.perPointAmount) > 0 ? Number(raw.perPointAmount) : 0.01,
      maxRatio: Number(raw.maxRatio) > 0 ? Math.floor(Number(raw.maxRatio)) : 50,
      maxAmount: Number(raw.maxAmount) > 0 ? Number(raw.maxAmount) : 100,
      portScope: portScope,
      ports: portScope === 'custom' ? ports : [],
      saleScope: sale.saleScope,
      saleRegions: sale.saleRegions,
      saleRegionSummary: sale.saleRegionSummary,
      saleStores: sale.saleStores,
      productScope: normalizeProductScope(raw.productScope),
      createdAt: raw.createdAt || formatNow(),
      updatedAt: raw.updatedAt || formatNow()
    };
  }

  function migrateFromLegacy() {
    try {
      var raw = localStorage.getItem(LEGACY_RULE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.cash) return null;
      var c = parsed.cash;
      return normalizeItem({
        id: 'PX10001',
        name: '默认积分抵现',
        enabled: c.enabled !== false,
        perPointAmount: c.perPointAmount,
        maxRatio: c.maxRatio,
        maxAmount: c.maxAmount,
        portScope: 'all',
        ports: [],
        saleScope: 'all',
        saleRegions: {},
        saleRegionSummary: [],
        saleStores: {},
        productScope: c.scope || { type: 'all', products: [], categories: [] },
        createdAt: formatNow(),
        updatedAt: formatNow()
      });
    } catch (e) {
      return null;
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        list = Array.isArray(parsed) ? parsed.map(normalizeItem) : [];
      } else {
        var migrated = migrateFromLegacy();
        list = migrated ? [migrated] : SEED.map(normalizeItem);
        persist();
      }
    } catch (e) {
      list = SEED.map(normalizeItem);
    }
  }

  function nextId() {
    ensureLoaded();
    var max = 10000;
    list.forEach(function (it) {
      var m = String(it.id || '').match(/^PX(\d+)$/i);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return 'PX' + (max + 1);
  }

  function getAll() {
    ensureLoaded();
    return list.map(clone);
  }

  function getById(id) {
    ensureLoaded();
    var found = list.filter(function (it) {
      return it.id === id;
    })[0];
    return found ? clone(found) : null;
  }

  function save(item) {
    ensureLoaded();
    var normalized = normalizeItem(item);
    if (!normalized.id) {
      normalized.id = nextId();
      normalized.createdAt = formatNow();
    }
    normalized.updatedAt = formatNow();
    var idx = -1;
    list.forEach(function (it, i) {
      if (it.id === normalized.id) idx = i;
    });
    if (idx >= 0) {
      normalized.createdAt = list[idx].createdAt || normalized.createdAt;
      list[idx] = normalized;
    } else {
      list.unshift(normalized);
    }
    persist();
    return clone(normalized);
  }

  function remove(id) {
    ensureLoaded();
    var before = list.length;
    list = list.filter(function (it) {
      return it.id !== id;
    });
    if (list.length !== before) persist();
    return list.length !== before;
  }

  function setEnabled(id, enabled) {
    ensureLoaded();
    var item = list.filter(function (it) {
      return it.id === id;
    })[0];
    if (!item) return null;
    item.enabled = !!enabled;
    item.updatedAt = formatNow();
    persist();
    return clone(item);
  }

  function lookupStoreRegionId(storeId) {
    if (!storeId || !global.MdmProxyStorePicker || typeof global.MdmProxyStorePicker.listAll !== 'function') {
      return '';
    }
    var found = global.MdmProxyStorePicker.listAll().filter(function (s) {
      return s.id === storeId;
    })[0];
    return found ? String(found.regionId || '') : '';
  }

  /**
   * 判断规则是否命中场景；未命中则不支持抵现
   * @param {object} rule
   * @param {{port?:string, storeId?:string, regionId?:string, productId?:string, category?:string}} ctx
   */
  function matchesContext(rule, ctx) {
    ctx = ctx || {};
    if (!rule || !rule.enabled) return false;
    if (ctx.port) {
      if (rule.portScope === 'custom') {
        if ((rule.ports || []).indexOf(ctx.port) < 0) return false;
      }
    }
    var saleScope = rule.saleScope || (rule.storeScope === 'store' ? 'store' : 'all');
    if (saleScope === 'store') {
      var stores = rule.saleStores || rule.stores || {};
      if (ctx.storeId && !stores[ctx.storeId]) return false;
    } else if (saleScope === 'region') {
      var regionCode = ctx.regionId || (ctx.storeId ? lookupStoreRegionId(ctx.storeId) : '');
      if ((ctx.storeId || ctx.regionId) && !saleRegionsCoverCode(rule.saleRegions, regionCode)) {
        return false;
      }
    }
    if (ctx.productId || ctx.category) {
      var scope = normalizeProductScope(rule.productScope);
      var type = scope.type;
      if (type === 'all') return true;
      var pid = String(ctx.productId || '');
      var cat = String(ctx.category || '');
      var products = scope.products || [];
      var categories = scope.categories || [];
      function inProducts() {
        return products.some(function (p) {
          return String(p.id || p.code || '') === pid || String(p.name || '') === pid;
        });
      }
      function inCategories() {
        return categories.some(function (c) {
          return String(c.id || c.name || '') === cat || String(c.name || '') === cat;
        });
      }
      if (type === 'include_product') return inProducts();
      if (type === 'exclude_product') return !inProducts();
      if (type === 'include_category') return inCategories();
      if (type === 'exclude_category') return !inCategories();
    }
    return true;
  }

  /** 取命中规则：启用且匹配场景，按创建时间最新；未命中返回 null（不支持抵现） */
  function resolveActiveRule(ctx) {
    ensureLoaded();
    var enabled = list.filter(function (it) {
      return matchesContext(it, ctx || {});
    });
    if (!enabled.length) return null;
    enabled.sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    return clone(enabled[0]);
  }

  global.MdmMemberPointsCashStore = {
    getAll: getAll,
    getById: getById,
    save: save,
    remove: remove,
    setEnabled: setEnabled,
    resolveActiveRule: resolveActiveRule,
    matchesContext: matchesContext,
    normalizeItem: normalizeItem
  };
})(window);
