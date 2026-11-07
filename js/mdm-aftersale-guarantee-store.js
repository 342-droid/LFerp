/**
 * 售后保障期主数据
 * 生效优先级：销售域商品配置（商城/代采/直播排品） > 类目默认 > 平台兜底
 */
(function (global) {
  var KEY = 'lf_aftersale_guarantee_v1';

  var DEFAULT = {
    platformDays: 7,
    categories: [
      { id: 'CAT-318568861735600128', name: '新鲜蔬菜', days: 3, inheritParent: false },
      { id: 'CAT-318570755371581440', name: '时令水果', days: 3, inheritParent: false },
      { id: 'CAT-318570903677976576', name: '肉禽蛋', days: 5, inheritParent: false },
      { id: 'CAT-318571213641236480', name: '水产海鲜', days: 2, inheritParent: false },
      { id: 'CAT-318571881810640896', name: '休闲零食', days: 7, inheritParent: false },
      { id: 'CAT-318572119849975808', name: '粮油调味', days: 15, inheritParent: false },
      { id: 'CAT-318572335181348864', name: '酒水饮料', days: 15, inheritParent: false },
      { id: 'CAT-318572583630946304', name: '乳饮面包', days: 5, inheritParent: false },
      { id: 'CAT-318572832655163392', name: '方便速食', days: 7, inheritParent: false }
    ],
    /* productKey -> days；由销售域商品编辑写入，空表示未配置 */
    products: {}
  };

  function safeParse(raw) {
    try {
      var v = JSON.parse(raw);
      return v && typeof v === 'object' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT));
  }

  function normalizeDays(v) {
    if (v === '' || v == null) return null;
    var n = Number(v);
    if (isNaN(n) || n < 0) return null;
    return Math.floor(n);
  }

  /** 旧版 SPU 覆盖迁移进商品配置表后丢弃 spus */
  function migrateFromSpus(products, spus) {
    if (!Array.isArray(spus) || !spus.length) return products;
    var out = products || {};
    spus.forEach(function (s) {
      if (!s || !s.id) return;
      if (out[s.id] != null) return;
      if (s.mode === 'custom' && s.days != null) {
        var d = normalizeDays(s.days);
        if (d != null) out[s.id] = d;
      }
    });
    return out;
  }

  function load() {
    var raw = null;
    try {
      raw = global.localStorage && global.localStorage.getItem(KEY);
    } catch (e) {
      raw = null;
    }
    var saved = raw ? safeParse(raw) : null;
    if (!saved) return cloneDefault();
    var out = cloneDefault();
    if (typeof saved.platformDays === 'number' && saved.platformDays >= 0) {
      out.platformDays = saved.platformDays;
    }
    if (Array.isArray(saved.categories) && saved.categories.length) {
      out.categories = saved.categories;
    }
    out.products =
      saved.products && typeof saved.products === 'object' ? Object.assign({}, saved.products) : {};
    out.products = migrateFromSpus(out.products, saved.spus);
    return out;
  }

  function save(data) {
    var payload = {
      platformDays: data && data.platformDays != null ? data.platformDays : DEFAULT.platformDays,
      categories: (data && data.categories) || [],
      products: (data && data.products) || {}
    };
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (e) {}
    return payload;
  }

  function categoryDays(state, categoryId) {
    var list = (state && state.categories) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === categoryId) return Number(list[i].days) || 0;
    }
    return Number(state && state.platformDays) || 0;
  }

  function getProductDays(state, productKey) {
    if (!productKey || !state || !state.products) return null;
    return normalizeDays(state.products[productKey]);
  }

  function setProductDays(state, productKey, days) {
    if (!state || !productKey) return state;
    if (!state.products) state.products = {};
    var n = normalizeDays(days);
    if (n == null) delete state.products[productKey];
    else state.products[productKey] = n;
    return state;
  }

  /**
   * 生效保障天数：商品配置 > 类目 > 平台兜底
   * @param {object} state
   * @param {string|object} productKeyOrOpts 商品编码，或 { productKey, productDays, categoryId }
   * @param {string} [categoryId]
   */
  function resolveDays(state, productKeyOrOpts, categoryId) {
    var opts =
      productKeyOrOpts && typeof productKeyOrOpts === 'object'
        ? productKeyOrOpts
        : { productKey: productKeyOrOpts, categoryId: categoryId };

    var fromProduct = normalizeDays(opts.productDays);
    if (fromProduct == null && opts.productKey) {
      fromProduct = getProductDays(state, opts.productKey);
    }
    if (fromProduct != null) return fromProduct;

    if (opts.categoryId) return categoryDays(state, opts.categoryId);
    return Number(state && state.platformDays) || 0;
  }

  /** 写入销售域商品售后期并落库（空值清除商品级配置） */
  function syncProductDays(productKey, days) {
    if (!productKey) return null;
    var data = load();
    setProductDays(data, productKey, days);
    return save(data);
  }

  /**
   * 仅当结算起算节点 =「售后期结束」时使用：整单保障天数 = max(各商品行售后期)。
   * 起算节点 =「订单履约确认后」时不调用本函数（完成日 + 结算周期即可；售后期与结算互不影响）。
   * C 端申请售后置灰始终按单行 resolveDays。
   * @param {object} state
   * @param {Array<{productKey?:string,categoryId?:string,productDays?:number|null}>} lines
   */
  function resolveOrderSettleGuaranteeDays(state, lines) {
    var list = Array.isArray(lines) ? lines : [];
    var maxDays = 0;
    var hit = false;
    list.forEach(function (line) {
      var d = resolveDays(state, line || {});
      var n = normalizeDays(d);
      if (n == null) return;
      hit = true;
      if (n > maxDays) maxDays = n;
    });
    if (hit) return maxDays;
    return Number(state && state.platformDays) || 0;
  }

  global.LFAftersaleGuaranteeStore = {
    KEY: KEY,
    load: load,
    save: save,
    resolveDays: resolveDays,
    resolveOrderSettleGuaranteeDays: resolveOrderSettleGuaranteeDays,
    categoryDays: categoryDays,
    getProductDays: getProductDays,
    setProductDays: setProductDays,
    syncProductDays: syncProductDays,
    normalizeDays: normalizeDays,
    cloneDefault: cloneDefault
  };
})(typeof window !== 'undefined' ? window : this);
