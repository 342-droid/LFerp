/**
 * C 端 — 商品可售时间
 * 优先级：商品自定义 > 快递24小时可售 > 商品类目可售时间 > 门店自定义营业时间 > 平台默认营业时间
 * 商品可售 = 当前处于门店营业时间 ∩ 商品可售时间
 * 超过可售时间：首页/分类下架不展示；搜索/详情/购物车打「商品不可售」
 *
 * 验收开关 localStorage：ua_product_sale_demo_v1
 *   force: auto | all | partial | none
 *   （按实际时间 / 全部可售 / 部分可售 / 全部不可售）
 *   applied: all | partial | none
 *   购物车/确认订单列表按 applied 展示；
 *   点「应用」回到初始可售态（applied=all）并记住 force；
 *   部分/全部不可售点立即下单/确认订单才校验、弹提示并刷新
 *   兼容旧值 on→all、off→none
 */
(function (global) {
  'use strict';

  var PLATFORM_HOURS_KEY = 'lf_basic_settings_business_hours';
  var STORE_HOURS_KEY = 'mdm_store_business_hours_v1';
  var DEMO_KEY = 'ua_product_sale_demo_v1';
  var EXPRESS_24H_RANGE = { start: '00:00', end: '23:59' };
  var UNSALEABLE_LABEL = '商品不可售';

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

  function normalizeForce(force) {
    if (force === 'on') return 'all';
    if (force === 'off') return 'none';
    if (force === 'all' || force === 'partial' || force === 'none' || force === 'auto') {
      return force;
    }
    return 'auto';
  }

  function readDemo() {
    var d = readJson(DEMO_KEY, {});
    var applied = d.applied != null ? normalizeForce(d.applied) : 'all';
    var invalidIds = Array.isArray(d.invalidIds) ? d.invalidIds.map(String) : [];
    return { force: normalizeForce(d.force), applied: applied, invalidIds: invalidIds };
  }

  /** 部分可售：按 id 做稳定散列拆半，避免多数 sku 被算到同一侧 */
  function isPartialDemoUnsaleable(product) {
    var id = String((product && (product.id || product.spuId || product.code)) || '');
    if (!id) return true;
    var h = 0;
    for (var i = 0; i < id.length; i++) {
      h = (31 * h + id.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 2 === 1;
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

  function isStoreOpenNowRaw(options) {
    var opts = options || {};
    var hours = resolveStoreBusinessHours(opts.storeId);
    var platform = loadPlatformBusinessHours();
    var crossDay = platform && platform.crossDay === 'yes' ? 'yes' : 'no';
    return isWithinSaleWindow(hours.start, hours.end, crossDay, opts.now);
  }

  function isProductWindowOpenNow(product, options) {
    var opts = options || {};
    var t = resolveEffectiveSaleTime(product, opts);
    if (!t || !t.start || !t.end) return false;
    if (t.source === 'express24h') return true;
    var platform = loadPlatformBusinessHours();
    var crossDay = platform && platform.crossDay === 'yes' ? 'yes' : 'no';
    return isWithinSaleWindow(t.start, t.end, crossDay, opts.now);
  }

  function isStoreOpenNow(options) {
    var demo = readDemo();
    /* 验收强制态视为营业中，便于露出商品级不可售标识 */
    if (demo.force === 'none' || demo.force === 'all' || demo.force === 'partial') return true;
    return isStoreOpenNowRaw(options);
  }

  function isSaleableNow(product, options) {
    var demo = readDemo();
    if (demo.force === 'all' || demo.force === 'on') return true;
    if (demo.force === 'none' || demo.force === 'off') return false;
    if (demo.force === 'partial') return !isPartialDemoUnsaleable(product);
    return isStoreOpenNowRaw(options) && isProductWindowOpenNow(product, options);
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
    var checkout = opts.variant === 'checkout';
    var selected = demo.force;
    if (checkout && selected === 'auto') selected = 'all';
    var title = checkout ? '商品可售验收开关' : '可售时间验收开关';
    var optionsHtml = checkout
      ? ''
      : '<option value="auto"' +
        (selected === 'auto' ? ' selected' : '') +
        '>按实际时间</option>';
    optionsHtml +=
      '<option value="all"' +
      (selected === 'all' ? ' selected' : '') +
      '>全部可售</option>' +
      '<option value="partial"' +
      (selected === 'partial' ? ' selected' : '') +
      '>部分可售</option>' +
      '<option value="none"' +
      (selected === 'none' ? ' selected' : '') +
      '>全部不可售</option>';
    var panel = document.createElement('div');
    panel.id = 'uaSaleTimeDemo';
    panel.className = 'ua-sale-time-demo' + (opts.className ? ' ' + opts.className : '');
    panel.innerHTML =
      '<div class="ua-sale-time-demo__title">' +
      title +
      '</div>' +
      '<label class="ua-sale-time-demo__row">商品可售' +
      '<select id="uaSaleTimeDemoForce">' +
      optionsHtml +
      '</select></label>' +
      (checkout
        ? '<div class="ua-sale-time-demo__tip">点应用回到初始可售。部分/全部不可售：再点立即下单或确认订单才校验并刷新</div>'
        : '') +
      '<button type="button" class="ua-sale-time-demo__apply" id="uaSaleTimeDemoApply">应用</button>';
    document.body.appendChild(panel);
    function storeForce(force) {
      var stored = force === 'all' ? 'on' : force === 'none' ? 'off' : force;
      return stored;
    }
    function applyForce() {
      var sel = document.getElementById('uaSaleTimeDemoForce');
      var fallback = checkout ? 'all' : 'auto';
      var force = normalizeForce((sel && sel.value) || fallback);
      /* 同时写入旧值 on/off，避免缓存的旧脚本把 none/partial 当成 auto */
      var next = { force: storeForce(force) };
      if (checkout) {
        /* 应用：回到操作前的初始可售态，场景留给立即下单/确认订单触发 */
        next.applied = 'all';
        next.invalidIds = [];
        writeDemo(next);
        global.location.reload();
        return;
      }
      writeDemo(next);
      if (typeof opts.onApply === 'function') {
        opts.onApply(force);
        return;
      }
      global.location.reload();
    }
    var apply = document.getElementById('uaSaleTimeDemoApply');
    var sel = document.getElementById('uaSaleTimeDemoForce');
    if (apply) apply.addEventListener('click', applyForce);
    if (sel) {
      sel.addEventListener('change', function () {
        var force = normalizeForce(sel.value || (checkout ? 'all' : 'auto'));
        if (checkout) {
          writeDemo({ force: storeForce(force) });
          return;
        }
        applyForce();
      });
    }
  }

  global.UaProductSaleTime = {
    resolve: resolveEffectiveSaleTime,
    isSaleableNow: isSaleableNow,
    isWithinWindow: isWithinSaleWindow,
    isStoreOpenNow: isStoreOpenNow,
    isStoreOpenNowRaw: isStoreOpenNowRaw,
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
