/**
 * C 端 — 商品可售时间
 * 优先级：商品自定义 > 快递24小时可售 > 商品类目可售时间 > 门店自定义营业时间 > 平台默认营业时间
 * 超过可售时间：标记「今日不可售」，不可加购/下单
 *
 * 验收开关 localStorage：ua_product_sale_demo_v1
 *   force: auto | on | off（按实际时间 / 强制可售 / 强制今日不可售）
 */
(function (global) {
  'use strict';

  var PLATFORM_HOURS_KEY = 'lf_basic_settings_business_hours';
  var STORE_HOURS_KEY = 'mdm_store_business_hours_v1';
  var DEMO_KEY = 'ua_product_sale_demo_v1';
  var EXPRESS_24H_RANGE = { start: '00:00', end: '23:59' };
  var UNSALEABLE_LABEL = '今日不可售';

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function readDemo() {
    var d = readJson(DEMO_KEY, {});
    var force = d.force;
    if (force !== 'on' && force !== 'off') force = 'auto';
    return { force: force };
  }

  function writeDemo(partial) {
    writeJson(DEMO_KEY, Object.assign({}, readDemo(), partial || {}));
  }

  function loadPlatformBusinessHours() {
    var parsed = readJson(PLATFORM_HOURS_KEY, null);
    if (!parsed) return null;
    return {
      start: parsed.start || '08:00',
      end: parsed.end || '22:00',
      crossDay: parsed.crossDay === 'yes' ? 'yes' : 'no',
      express24hSale: parsed.express24hSale === 'yes' ? 'yes' : 'no',
      categoryHours: Array.isArray(parsed.categoryHours) ? parsed.categoryHours : []
    };
  }

  function loadStoreCustomBusinessHours(storeId) {
    var id = String(storeId || '').trim();
    if (!id) return null;
    var map = readJson(STORE_HOURS_KEY, null);
    if (!map) return null;
    var custom = map[id];
    if (custom && custom.start && custom.end) {
      return { start: custom.start, end: custom.end, source: 'store' };
    }
    return null;
  }

  function normalizeDeliveryMode(mode) {
    var m = String(mode || '').trim();
    if (m === 'express' || m === '快递' || m === '快递到店' || m === '快递配送' || m === 'store') {
      return 'express';
    }
    if (m === 'pickup' || m === '自提' || m === '门店自提') return 'pickup';
    return m || 'pickup';
  }

  function categoryPathMatches(path, categoryName) {
    var p = String(path || '').trim();
    var name = String(categoryName || '').trim();
    if (!p || !name) return false;
    if (p === name) return true;
    if (p.indexOf('/' + name) !== -1) return true;
    if (p.indexOf(name + '/') === 0) return true;
    var segs = p.split(/[\/、,，]/);
    for (var i = 0; i < segs.length; i++) {
      if (String(segs[i] || '').trim() === name) return true;
    }
    return p.indexOf(name) !== -1;
  }

  function getProductCategoryPaths(product) {
    product = product || {};
    if (Array.isArray(product.category_paths) && product.category_paths.length) {
      return product.category_paths.slice();
    }
    if (product.category_path) return [product.category_path];
    if (product.category) return [product.category];
    return [];
  }

  function resolveInheritedSaleTime(categoryPaths, deliveryMode, storeId) {
    var platform = loadPlatformBusinessHours();
    var fallback = { start: '08:00', end: '22:00', source: 'business' };
    var mode = normalizeDeliveryMode(deliveryMode);
    if (mode === 'express' && platform && platform.express24hSale === 'yes') {
      return {
        start: EXPRESS_24H_RANGE.start,
        end: EXPRESS_24H_RANGE.end,
        source: 'express24h'
      };
    }
    if (platform) {
      var paths = Array.isArray(categoryPaths) ? categoryPaths : [];
      var cats = platform.categoryHours || [];
      for (var i = 0; i < cats.length; i++) {
        var row = cats[i];
        if (!row || !row.start || !row.end) continue;
        var catName = row.name || row.id;
        for (var j = 0; j < paths.length; j++) {
          if (categoryPathMatches(paths[j], catName)) {
            return {
              start: row.start,
              end: row.end,
              source: 'category',
              categoryName: catName
            };
          }
        }
      }
    }
    var storeHours = loadStoreCustomBusinessHours(storeId);
    if (storeHours) return storeHours;
    if (platform && platform.start && platform.end) {
      return { start: platform.start, end: platform.end, source: 'business' };
    }
    return fallback;
  }

  function resolveEffectiveSaleTime(product, options) {
    product = product || {};
    var opts = options || {};
    var detail = product.detail || {};
    var isCustom =
      detail.saleTimeMode === 'custom' || product.saleTimeMode === 'custom';
    var start = detail.saleTimeStart || product.saleTimeStart;
    var end = detail.saleTimeEnd || product.saleTimeEnd;
    if (isCustom && start && end) {
      return { start: start, end: end, source: 'custom' };
    }
    var delivery =
      product.deliveryMode ||
      product.fulfillmentMode ||
      product.fulfillType ||
      detail.deliveryMode;
    return resolveInheritedSaleTime(
      getProductCategoryPaths(product),
      delivery,
      opts.storeId || product.storeId || resolveStoreId()
    );
  }

  function isWithinSaleWindow(start, end, crossDay, now) {
    var s = String(start || '').trim();
    var e = String(end || '').trim();
    if (!s || !e) return false;
    var d = now instanceof Date ? now : new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var cur = hh + ':' + mm;
    if (crossDay === 'yes' || s > e) {
      return cur >= s || cur < e;
    }
    return cur >= s && cur < e;
  }

  function resolveStoreId() {
    try {
      if (global.UaSwitchAddress && typeof global.UaSwitchAddress.readCtx === 'function') {
        var ctx = global.UaSwitchAddress.readCtx();
        if (ctx && ctx.storeId) return String(ctx.storeId);
      }
    } catch (e) {
      /* ignore */
    }
    return 'store-prod-verify';
  }

  /** 门店营业时间：门店自定义 > 平台默认（不含类目/商品自定义） */
  function resolveStoreBusinessHours(storeId) {
    var id = storeId || resolveStoreId();
    var storeHours = loadStoreCustomBusinessHours(id);
    if (storeHours) return storeHours;
    var platform = loadPlatformBusinessHours();
    if (platform && platform.start && platform.end) {
      return { start: platform.start, end: platform.end, source: 'business' };
    }
    return { start: '08:00', end: '22:00', source: 'business' };
  }

  function isStoreOpenNow(options) {
    var opts = options || {};
    var demo = readDemo();
    /* 验收：强制今日不可售时视为营业中，便于露出商品级不可售标识 */
    if (demo.force === 'off') return true;
    if (demo.force === 'on') return true;
    var hours = resolveStoreBusinessHours(opts.storeId);
    var platform = loadPlatformBusinessHours();
    var crossDay = platform && platform.crossDay === 'yes' ? 'yes' : 'no';
    return isWithinSaleWindow(hours.start, hours.end, crossDay, opts.now);
  }

  function isSaleableNow(product, options) {
    var demo = readDemo();
    if (demo.force === 'on') return true;
    if (demo.force === 'off') return false;
    var opts = options || {};
    var t = resolveEffectiveSaleTime(product, opts);
    if (!t || !t.start || !t.end) return false;
    if (t.source === 'express24h') return true;
    var platform = loadPlatformBusinessHours();
    var crossDay = platform && platform.crossDay === 'yes' ? 'yes' : 'no';
    return isWithinSaleWindow(t.start, t.end, crossDay, opts.now);
  }

  /**
   * 商品卡片「今日不可售」标识：
   * 仅当门店营业时间内、且商品仍不可售时展示；
   * 过了门店营业时间导致的不可售不展示标识。
   */
  function shouldShowUnsaleableBadge(product, options) {
    if (!product) return false;
    if (isSaleableNow(product, options)) return false;
    return isStoreOpenNow(options);
  }

  function assertSaleable(product, options) {
    if (isSaleableNow(product, options)) return { ok: true };
    return { ok: false, msg: UNSALEABLE_LABEL };
  }

  function mountDemoPanel(opts) {
    opts = opts || {};
    if (document.getElementById('uaSaleTimeDemo')) return;
    var demo = readDemo();
    var panel = document.createElement('div');
    panel.id = 'uaSaleTimeDemo';
    panel.className = 'ua-sale-time-demo' + (opts.className ? ' ' + opts.className : '');
    panel.innerHTML =
      '<div class="ua-sale-time-demo__title">可售时间验收开关</div>' +
      '<label class="ua-sale-time-demo__row">商品可售' +
      '<select id="uaSaleTimeDemoForce">' +
      '<option value="auto"' +
      (demo.force === 'auto' ? ' selected' : '') +
      '>按实际时间</option>' +
      '<option value="on"' +
      (demo.force === 'on' ? ' selected' : '') +
      '>强制可售</option>' +
      '<option value="off"' +
      (demo.force === 'off' ? ' selected' : '') +
      '>今日不可售</option>' +
      '</select></label>' +
      '<button type="button" class="ua-sale-time-demo__apply" id="uaSaleTimeDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaSaleTimeDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaSaleTimeDemoForce');
        writeDemo({ force: (sel && sel.value) || 'auto' });
        global.location.reload();
      });
    }
  }

  global.UaProductSaleTime = {
    resolve: resolveEffectiveSaleTime,
    isSaleableNow: isSaleableNow,
    isWithinWindow: isWithinSaleWindow,
    isStoreOpenNow: isStoreOpenNow,
    shouldShowUnsaleableBadge: shouldShowUnsaleableBadge,
    assertSaleable: assertSaleable,
    mountDemoPanel: mountDemoPanel,
    readDemo: readDemo,
    writeDemo: writeDemo,
    resolveStoreId: resolveStoreId,
    resolveStoreBusinessHours: resolveStoreBusinessHours,
    UNSALEABLE_LABEL: UNSALEABLE_LABEL,
    DEMO_KEY: DEMO_KEY
  };
})(typeof window !== 'undefined' ? window : this);
