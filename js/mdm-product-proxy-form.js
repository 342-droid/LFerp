/**
 * 代采 / 商城商品列表 — 添加/编辑商品（完整表单）
 * channel: 'proxy'（快递/配送）| 'mall'（快递/自提）
 */
(function () {
  var pickerInstance = null;
  var formState = null;
  var formChannel = 'proxy';

  var SALE_UNIT_OPTIONS = ['件', '箱', '瓶', '袋', 'kg', 'L', '罐', '包', '套', '卷', '个', '斤', '盒'];
  var ETA_COUNTDOWN_UNITS = ['天', '小时'];
  /** 限购配置（演示枚举） */
  var LIMIT_CONFIG_OPTIONS = [
    { value: '', label: '请选择' },
    { value: 'none', label: '不限购' },
    { value: 'per_order', label: '每单限购' },
    { value: 'per_user', label: '每用户限购' }
  ];
  /**
   * 积分兑换三态（售卖规格）：
   * - cash 现金：展示售价 + 划线价
   * - points 纯积分兑换：展示积分个数 + 划线价
   * - points_cash 积分+现金：下拉旁积分/金额 + 售价 + 划线价
   */
  var POINT_EXCHANGE_OPTIONS = [
    { value: 'cash', label: '现金' },
    { value: 'points', label: '纯积分兑换' },
    { value: 'points_cash', label: '积分+现金' }
  ];
  /** 可售库存配置：取现货 / 按现货百分比溢出 / 按固定数量 */
  var SELLABLE_STOCK_MODES = [
    { value: 'follow', label: '取现货库存' },
    { value: 'percent', label: '按现货百分比溢出' },
    { value: 'fixed', label: '按具体数量' }
  ];

  function normalizeSellableMode(value) {
    if (value === 'percent' || value === 'fixed' || value === 'follow') return value;
    return 'follow';
  }

  function parseStockNum(value) {
    var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function computeSellableStock(sku) {
    if (window.MdmSkuWhStock && typeof window.MdmSkuWhStock.attachToSku === 'function') {
      var sum = window.MdmSkuWhStock.attachToSku(sku);
      return sum ? sum.sellableTotal : 0;
    }
    var spot = parseStockNum(sku && sku.spotStock);
    var mode = normalizeSellableMode(sku && sku.sellableMode);
    if (mode === 'percent') {
      return Math.round(spot * parseStockNum(sku.sellablePercent) / 100);
    }
    if (mode === 'fixed') {
      return Math.round(parseStockNum(sku.sellableFixed));
    }
    return Math.round(spot);
  }

  function ensureSkuStockFields(sku) {
    if (!sku) return sku;
    sku.sellableMode = normalizeSellableMode(sku.sellableMode);
    if (sku.sellablePercent == null || sku.sellablePercent === '') sku.sellablePercent = '100';
    if (sku.sellableFixed == null) sku.sellableFixed = '';
    if (window.MdmSkuWhStock && typeof window.MdmSkuWhStock.attachToSku === 'function') {
      window.MdmSkuWhStock.attachToSku(sku);
    } else {
      if (sku.spotStock == null || sku.spotStock === '') sku.spotStock = '0';
      if (sku.reservedStock == null || sku.reservedStock === '') sku.reservedStock = '0';
      sku.sellableStock = String(computeSellableStock(sku));
    }
    return sku;
  }

  var PROXY_DELIVERY_MODE_OPTIONS = [
    { value: 'express', label: '快递' },
    { value: 'platform', label: '配送' }
  ];
  var MALL_DELIVERY_MODE_OPTIONS = [
    { value: 'express', label: '快递' },
    { value: 'pickup', label: '自提' }
  ];

  function getDeliveryModeOptions() {
    return formChannel === 'mall' ? MALL_DELIVERY_MODE_OPTIONS : PROXY_DELIVERY_MODE_OPTIONS;
  }

  function normalizeDeliveryMode(mode) {
    if (formChannel === 'mall') {
      if (mode === 'pickup' || mode === '自提' || mode === '门店自提') return 'pickup';
      if (mode === 'express' || mode === '快递到店' || mode === '快递' || mode === '快递配送' || mode === 'store') {
        return 'express';
      }
      return 'express';
    }
    if (mode === 'platform' || mode === '平台配送' || mode === '配送' || mode === 'warehouse' || mode === 'delivery') {
      return 'platform';
    }
    if (mode === 'express' || mode === '快递到店' || mode === '快递' || mode === 'store') {
      return 'express';
    }
    return 'platform';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function closeModal() {
    var modal = document.querySelector('[data-proxy-product-form]');
    if (modal) modal.remove();
    pickerInstance = null;
    formState = null;
  }

  function getProductCategoryIds(product) {
    if (Array.isArray(product.category_l3_ids) && product.category_l3_ids.length) {
      return product.category_l3_ids.slice();
    }
    if (product.category_l3_id) return [product.category_l3_id];
    return [];
  }

  function getProductCategoryPaths(product) {
    if (Array.isArray(product.category_paths) && product.category_paths.length) {
      return product.category_paths.slice();
    }
    if (product.category_path) return [product.category_path];
    if (product.category) return [product.category];
    return [];
  }

  /**
   * 门店配置 · 营业时间（localStorage）
   * 回写优先级：商品自定义(SPU) > 快递24小时可售 > 商品类目可售时间 > 门店自定义营业时间 > 平台默认营业时间
   * 超过可售时间则该类目商品不可售
   */
  var PLATFORM_HOURS_KEY = 'lf_basic_settings_business_hours';
  var STORE_HOURS_KEY = 'mdm_store_business_hours_v1';
  var EXPRESS_24H_RANGE = { start: '00:00', end: '23:59' };

  function loadPlatformBusinessHours() {
    try {
      var raw = localStorage.getItem(PLATFORM_HOURS_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        start: parsed.start || '08:00',
        end: parsed.end || '22:00',
        crossDay: parsed.crossDay === 'yes' ? 'yes' : 'no',
        express24hSale: parsed.express24hSale === 'yes' ? 'yes' : 'no',
        categoryHours: Array.isArray(parsed.categoryHours) ? parsed.categoryHours : []
      };
    } catch (e) {
      return null;
    }
  }

  function loadStoreCustomBusinessHours(storeId) {
    var id = String(storeId || '').trim();
    if (!id) return null;
    try {
      var raw = localStorage.getItem(STORE_HOURS_KEY);
      if (!raw) return null;
      var map = JSON.parse(raw);
      if (!map || typeof map !== 'object') return null;
      var custom = map[id];
      if (custom && custom.start && custom.end) {
        return { start: custom.start, end: custom.end, source: 'store' };
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function saleTimeSourceTipText(source) {
    if (source === 'custom') return '已采用商品自定义可售卖时间';
    if (source === 'express24h') return '24小时可售';
    if (source === 'category') return '已采用商品类目可售卖时间';
    if (source === 'store') return '已采用门店自定义营业时间';
    return '已采用平台默认营业时间';
  }

  function updateSaleTimeSourceTip(backdrop, source) {
    var tip = backdrop && backdrop.querySelector('#proxySaleTimeSourceTip');
    if (!tip) return;
    tip.textContent = saleTimeSourceTipText(source);
    tip.setAttribute('data-source', source || 'business');
  }

  function getCurrentDeliveryMode(backdrop, product) {
    if (backdrop) {
      var el = backdrop.querySelector('input[name="proxyDeliveryMode"]:checked');
      if (el) return normalizeDeliveryMode(el.value);
    }
    if (formState && formState.deliveryMode) {
      return normalizeDeliveryMode(formState.deliveryMode);
    }
    product = product || {};
    return normalizeDeliveryMode(
      product.deliveryMode || product.fulfillmentMode || (product.detail && product.detail.deliveryMode)
    );
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

  function getCurrentCategoryPaths(product) {
    if (pickerInstance && typeof pickerInstance.getPaths === 'function') {
      var paths = pickerInstance.getPaths() || [];
      if (paths.length) return paths;
    }
    return getProductCategoryPaths(product || {});
  }

  /** 按 快递24h > 类目可售时间 > 门店自定义营业时间 > 平台默认营业时间 解析可售时段（不含商品自定义） */
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

  /** 当前时刻是否落在可售窗口内（支持跨日） */
  function isWithinSaleWindow(start, end, crossDay, now) {
    var s = String(start || '').trim();
    var e = String(end || '').trim();
    if (!s || !e) return false;
    var d = now instanceof Date ? now : new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var cur = hh + ':' + mm;
    if (crossDay === 'yes' || s > e) {
      /* 跨日：如 22:00–02:00，当前 >= 开始 或 < 结束 */
      return cur >= s || cur < e;
    }
    return cur >= s && cur < e;
  }

  /**
   * 是否在可售时间内（超过则不可售）
   * @param {object} product
   * @param {{ storeId?: string, now?: Date }} [options]
   */
  function isProductSaleableNow(product, options) {
    var opts = options || {};
    var t = resolveEffectiveSaleTime(product, opts);
    if (!t || !t.start || !t.end) return false;
    if (t.source === 'express24h') return true;
    var platform = loadPlatformBusinessHours();
    var crossDay = platform && platform.crossDay === 'yes' ? 'yes' : 'no';
    return isWithinSaleWindow(t.start, t.end, crossDay, opts.now);
  }

  function applySaleTimeToForm(backdrop, start, end) {
    if (formState) {
      formState.saleTimeStart = start || '08:00';
      formState.saleTimeEnd = end || '22:00';
    }
    if (!backdrop) return;
    var startEl = backdrop.querySelector('#proxySaleTimeStart');
    var endEl = backdrop.querySelector('#proxySaleTimeEnd');
    if (startEl) startEl.value = start || '08:00';
    if (endEl) endEl.value = end || '22:00';
  }

  function syncInheritedSaleTime(backdrop, product) {
    if (!formState) return;
    /* 用户改过时间框，或已保存为 SPU 自定义时，不再被类目/门店/营业时间/24h 覆盖 */
    if (formState.saleTimeTouched || formState.saleTimeMode === 'custom') {
      updateSaleTimeSourceTip(backdrop, 'custom');
      return;
    }
    var resolved = resolveInheritedSaleTime(
      getCurrentCategoryPaths(product),
      getCurrentDeliveryMode(backdrop, product),
      (product && product.storeId) || ''
    );
    formState.saleTimeSource = resolved.source;
    applySaleTimeToForm(backdrop, resolved.start, resolved.end);
    updateSaleTimeSourceTip(backdrop, resolved.source);
  }

  function buildDefaultDisplayName(productName, specValue, saleUnit) {
    var name = String(productName || '').trim();
    var spec = String(specValue == null ? '' : specValue).trim();
    var unit = String(saleUnit == null ? '' : saleUnit).trim();
    var tail = spec && unit ? (spec + '/' + unit) : (spec || unit);
    if (name && tail) return name + ' ' + tail;
    return name || tail || '';
  }

  function normalizePointExchange(value) {
    if (value === 'points' || value === '纯积分兑换' || value === 'points_only') return 'points';
    if (value === 'points_cash' || value === '积分+现金' || value === 'money_points') return 'points_cash';
    if (value === 'cash' || value === '现金' || value === 'money') return 'cash';
    return 'cash';
  }

  function inferPointExchangeFromProduct(product) {
    if (product.priceType === 'points') return 'points';
    if (product.priceType === 'money_points') return 'points_cash';
    return 'cash';
  }

  function defaultSku(id, product, index) {
    var specs = ['2.5kg', '500g', '1kg', '12箱', '1'];
    var specValue = index === 0 && product.spec ? String(product.spec) : specs[index] || '1';
    var saleUnit = '';
    var pointExchange = inferPointExchangeFromProduct(product);
    return {
      id: id,
      displayName: buildDefaultDisplayName(product.name, specValue, saleUnit || '个'),
      displayNameManual: false,
      internalCode: index === 0 ? '147852369' : (product.code || 'SPU') + '-' + String(index + 1).padStart(2, '0'),
      barcode: index === 0 ? '147852369' : '',
      specValue: specValue,
      baseUnit: '个',
      purchasePrice: index === 0 ? '0.01' : '8.00',
      saleRatio: '1.000',
      saleUnit: saleUnit,
      limitConfig: '',
      pointExchange: pointExchange,
      pointsAmount: product.pricePoints != null ? String(product.pricePoints) : '',
      pointCash: pointExchange === 'points_cash' ? String(product.priceMoney || '0') : '',
      salePrice: index === 0 ? String(product.priceMoney != null ? product.priceMoney : '0.00') : '0.01',
      linePrice: product.linePrice != null ? String(product.linePrice) : '',
      minQty: '1',
      sellableMode: 'follow',
      sellablePercent: '100',
      sellableFixed: '',
      img: product.img || '../user-app/assets/restock/product-leaf.svg',
      isDefault: index === 0,
      onShelf: true
    };
  }

  function buildSkuPool(product) {
    var count = Math.max(5, product.specCount || 1);
    var pool = [];
    for (var i = 0; i < count; i++) {
      var id = (product.code || 'SPU') + '-sku-' + (i + 1);
      pool.push(ensureSkuStockFields(defaultSku(id, product, i)));
    }
    return pool;
  }

  function normalizeDetail(product) {
    var detail = product.detail || {};
    var pool = buildSkuPool(product);
    var poolMap = {};
    pool.forEach(function (s) { poolMap[s.id] = s; });

    var savedSkus = detail.skus || {};
    pool.forEach(function (s) {
      if (savedSkus[s.id]) {
        Object.assign(s, savedSkus[s.id], { id: s.id });
      }
      s.pointExchange = normalizePointExchange(
        s.pointExchange || s.priceType || inferPointExchangeFromProduct(product)
      );
      if (s.saleRatio == null && s.stockStatus != null) s.saleRatio = s.stockStatus;
      if (s.saleRatio == null || s.saleRatio === '') s.saleRatio = '1.000';
      if (s.limitConfig == null) s.limitConfig = '';
      if (s.pointsAmount == null) s.pointsAmount = '';
      if (s.pointCash == null) s.pointCash = '';
      if (s.barcode && !s.internalCode) s.internalCode = s.barcode;
      if (s.displayNameManual) {
        if (!String(s.displayName || '').trim()) {
          s.displayName = buildDefaultDisplayName(product.name, s.specValue, s.saleUnit);
        }
      } else {
        s.displayNameManual = false;
        s.displayName = buildDefaultDisplayName(product.name, s.specValue, s.saleUnit);
      }
      ensureSkuStockFields(s);
    });

    var selectedIds = Array.isArray(detail.selectedSkuIds) && detail.selectedSkuIds.length
      ? detail.selectedSkuIds.filter(function (id) { return poolMap[id]; })
      : pool.slice(0, Math.max(1, product.specCount || 1)).map(function (s) { return s.id; });

    if (!selectedIds.length) {
      selectedIds = [pool[0].id];
    }

    var hasDefault = selectedIds.some(function (id) {
      return poolMap[id] && poolMap[id].isDefault;
    });
    if (!hasDefault) {
      poolMap[selectedIds[0]].isDefault = true;
    }

    var result = {
      productName: product.name || '',
      summary: detail.summary || '',
      displaySales: detail.displaySales != null ? String(detail.displaySales) : (detail.summary || ''),
      textDesc: detail.textDesc || '',
      etaCountdown: detail.etaCountdown != null
        ? String(detail.etaCountdown)
        : (product.etaCountdown != null ? String(product.etaCountdown) : ''),
      etaCountdownUnit: detail.etaCountdownUnit || product.etaCountdownUnit || '天',
      deliveryMode: normalizeDeliveryMode(
        detail.deliveryMode || product.deliveryMode || product.fulfillmentMode
      ),
      saleScope: detail.saleScope || 'all',
      saleRegions: detail.saleRegions ? cloneRegionSelected(detail.saleRegions) : {},
      saleRegionSummary: Array.isArray(detail.saleRegionSummary) ? detail.saleRegionSummary.slice() : [],
      saleStores: detail.saleStores ? cloneStoreSelected(detail.saleStores) : {},
      images: Array.isArray(detail.images) && detail.images.length
        ? detail.images.slice()
        : (product.img ? [product.img] : []),
      detailHtml: detail.detailHtml || '',
      skuPool: pool,
      selectedSkuIds: selectedIds
    };
    /* SPU 已配置可售时间优先；否则按 快递24h > 类目 > 门店自定义 > 平台默认 自动回写 */
    var isCustomSale =
      detail.saleTimeMode === 'custom' || product.saleTimeMode === 'custom';
    if (isCustomSale && (detail.saleTimeStart || product.saleTimeStart)) {
      result.saleTimeMode = 'custom';
      result.saleTimeTouched = false;
      result.saleTimeSource = 'custom';
      result.saleTimeStart =
        detail.saleTimeStart || product.saleTimeStart || '08:00';
      result.saleTimeEnd = detail.saleTimeEnd || product.saleTimeEnd || '22:00';
    } else {
      var inherited = resolveInheritedSaleTime(
        getProductCategoryPaths(product),
        result.deliveryMode,
        product.storeId || ''
      );
      result.saleTimeMode = 'follow_category';
      result.saleTimeTouched = false;
      result.saleTimeSource = inherited.source;
      result.saleTimeStart = inherited.start;
      result.saleTimeEnd = inherited.end;
    }
    if (!result.saleRegionSummary.length && Object.keys(result.saleRegions).length && window.MdmProxyRegionPicker) {
      result.saleRegionSummary = window.MdmProxyRegionPicker.summarize(result.saleRegions);
    }
    return result;
  }

  function getTagOptions() {
    var tagStore = formChannel === 'mall' ? window.MdmMallTagStore : window.MdmProxyTagStore;
    if (tagStore) {
      return tagStore.getAll().map(function (t) { return t.name; });
    }
    return ['冷丰溯源', '冷丰优选', '牛牛专用', '蔬菜水果', '优选商品', '天天平价'];
  }

  function cloneRegionSelected(map) {
    if (window.MdmProxyRegionPicker) return window.MdmProxyRegionPicker.cloneSelected(map);
    var out = {};
    Object.keys(map || {}).forEach(function (k) { out[k] = true; });
    return out;
  }

  function cloneStoreSelected(map) {
    if (window.MdmProxyStorePicker) return window.MdmProxyStorePicker.cloneSelected(map);
    var out = {};
    Object.keys(map || {}).forEach(function (k) { out[k] = true; });
    return out;
  }

  function getSaleStoreCount(state) {
    if (window.MdmProxyStorePicker) return window.MdmProxyStorePicker.count(state.saleStores || {});
    return Object.keys(state.saleStores || {}).length;
  }

  function renderSaleRegionSummary(state) {
    if (!state.saleRegionSummary || !state.saleRegionSummary.length) return '';
    return state.saleRegionSummary.map(function (item) {
      return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label) + '</span>';
    }).join('');
  }

  function renderSaleScopeSection(state) {
    var isRegion = state.saleScope === 'region';
    var isStore = state.saleScope === 'store';
    var storeCount = getSaleStoreCount(state);
    return (
      '<section class="product-proxy-form__section">' +
      '  <h3 class="product-proxy-form__section-title">售卖范围</h3>' +
      '  <div class="product-proxy-form__field product-proxy-form__field--inline product-proxy-sale-scope__type">' +
      '    <span class="product-proxy-form__label product-proxy-form__label--inline">范围类型</span>' +
      '    <div class="product-add-radio-row">' +
      '      <label class="product-add-radio"><input type="radio" name="proxySaleScope" value="all"' + (state.saleScope === 'all' ? ' checked' : '') + '> 全部</label>' +
      '      <label class="product-add-radio"><input type="radio" name="proxySaleScope" value="region"' + (state.saleScope === 'region' ? ' checked' : '') + '> 省市区</label>' +
      '      <label class="product-add-radio"><input type="radio" name="proxySaleScope" value="store"' + (state.saleScope === 'store' ? ' checked' : '') + '> 门店</label>' +
      '    </div>' +
      '  </div>' +
      '  <div class="product-proxy-sale-scope__region" id="proxySaleScopeRegion"' + (isRegion ? '' : ' hidden') + '>' +
      '    <div class="product-proxy-sale-scope__alert">' +
      '      <span class="product-proxy-sale-scope__alert-icon">i</span>' +
      '      <span class="product-proxy-sale-scope__alert-text">支持按省 / 市 / 区配置售卖范围，可勾选整省、整市或具体区县</span>' +
      '    </div>' +
      '    <button type="button" class="product-proxy-sale-scope__pick" id="proxySaleScopePickBtn">+ 选择区域</button>' +
      '    <div class="product-proxy-sale-scope__tags" id="proxySaleScopeTags">' + renderSaleRegionSummary(state) + '</div>' +
      '  </div>' +
      '  <div class="product-proxy-sale-scope__store" id="proxySaleScopeStore"' + (isStore ? '' : ' hidden') + '>' +
      '    <button type="button" class="product-proxy-sale-scope__pick" id="proxySaleScopeStorePickBtn">+ 选择门店</button>' +
      '    <p class="product-proxy-sale-scope__store-count" id="proxySaleScopeStoreCount"' + (storeCount ? '' : ' hidden') + '>已选择 ' + storeCount + ' 个门店</p>' +
      '  </div>' +
      '</section>'
    );
  }

  function editorToolbarHtml() {
    var btns = ['正文', 'B', 'I', 'U', 'S', 'A', 'A', '清除', '|', '≡', '1.', '"', '←', '→', '🔗', '🖼', '▶'];
    return btns.map(function (b) {
      if (b === '|') return '<span class="product-add-editor__divider"></span>';
      return '<button type="button" class="product-add-editor__btn" tabindex="-1">' + b + '</button>';
    }).join('');
  }

  function renderPointExchangeFields(sku) {
    var mode = normalizePointExchange(sku.pointExchange);
    var options = POINT_EXCHANGE_OPTIONS.map(function (opt) {
      return (
        '<option value="' +
        escapeHtml(opt.value) +
        '"' +
        (mode === opt.value ? ' selected' : '') +
        '>' +
        escapeHtml(opt.label) +
        '</option>'
      );
    }).join('');

    var inline = '';
    if (mode === 'points' || mode === 'points_cash') {
      inline +=
        '<div class="product-proxy-spec__points-input">' +
        '<input type="text" class="product-proxy-spec__input" data-field="pointsAmount" value="' +
        escapeHtml(sku.pointsAmount || '') +
        '" placeholder="" inputmode="numeric">' +
        '<span class="product-proxy-spec__points-suffix">个</span>' +
        '</div>';
    }
    if (mode === 'points_cash') {
      inline +=
        '<div class="product-proxy-spec__money product-proxy-spec__money--inline">' +
        '<span class="product-proxy-spec__money-prefix">¥</span>' +
        '<input type="text" class="product-proxy-spec__input product-proxy-spec__input--money" data-field="pointCash" value="' +
        escapeHtml(sku.pointCash || '') +
        '" inputmode="decimal">' +
        '</div>';
    }

    return (
      '<div class="product-proxy-spec__field product-proxy-spec__field--exchange' +
      (mode !== 'cash' ? ' is-' + mode : '') +
      '">' +
      '<label class="product-proxy-spec__label">积分兑换</label>' +
      '<div class="product-proxy-spec__exchange-row">' +
      '<select class="product-proxy-spec__input product-proxy-spec__exchange-select" data-field="pointExchange">' +
      options +
      '</select>' +
      inline +
      '</div></div>'
    );
  }

  function renderPriceFieldsByExchange(sku) {
    var mode = normalizePointExchange(sku.pointExchange);
    var html = '';
    // 现金 / 积分+现金：展示售价；纯积分不展示售价
    if (mode === 'cash' || mode === 'points_cash') {
      html += renderMoneyField('售价/sku', 'salePrice', sku.salePrice);
    }
    html += renderMoneyField('划线价/sku', 'linePrice', sku.linePrice);
    return html;
  }

  function renderSpecPanel(sku) {
    var saleUnit = SALE_UNIT_OPTIONS.indexOf(sku.saleUnit) >= 0 ? sku.saleUnit : '';
    var saleUnitOptions =
      '<option value="">请选择</option>' +
      SALE_UNIT_OPTIONS.map(function (opt) {
        return (
          '<option value="' +
          escapeHtml(opt) +
          '"' +
          (saleUnit === opt ? ' selected' : '') +
          '>' +
          escapeHtml(opt) +
          '</option>'
        );
      }).join('');
    var limitOptions = LIMIT_CONFIG_OPTIONS.map(function (opt) {
      return (
        '<option value="' +
        escapeHtml(opt.value) +
        '"' +
        (String(sku.limitConfig || '') === opt.value ? ' selected' : '') +
        '>' +
        escapeHtml(opt.label) +
        '</option>'
      );
    }).join('');
    var barcode = sku.barcode || sku.internalCode || '';

    return (
      '<article class="product-proxy-spec' +
      (sku.isDefault ? ' is-default' : '') +
      '" data-sku-id="' +
      escapeHtml(sku.id) +
      '">' +
      '  <div class="product-proxy-spec__head">' +
      '    <span class="product-proxy-spec__head-label">展示规格名称</span>' +
      '    <input type="text" class="product-proxy-spec__head-input" data-field="displayName" value="' +
      escapeHtml(sku.displayName || '') +
      '" placeholder="请输入展示规格名称">' +
      (sku.isDefault ? '<span class="product-proxy-spec__default-tag">默认</span>' : '') +
      '  </div>' +
      '  <div class="product-proxy-spec__body">' +
      '    <div class="product-proxy-spec__thumb">' +
      '      <img src="' +
      escapeHtml(sku.img) +
      '" alt="">' +
      '    </div>' +
      '    <div class="product-proxy-spec__grid">' +
      renderSpecField('商品条形码', 'internalCode', barcode) +
      renderSpecField('规格值', 'specValue', sku.specValue) +
      renderSpecField('基础单位', 'baseUnit', sku.baseUnit) +
      renderMoneyField('采购价/基础单位', 'purchasePrice', sku.purchasePrice) +
      renderSpecField('售卖系数', 'saleRatio', sku.saleRatio || '1.000') +
      '      <div class="product-proxy-spec__field">' +
      '        <label class="product-proxy-spec__label">售卖单位</label>' +
      '        <select class="product-proxy-spec__input" data-field="saleUnit">' +
      saleUnitOptions +
      '</select>' +
      '      </div>' +
      '      <div class="product-proxy-spec__field">' +
      '        <label class="product-proxy-spec__label">限购配置</label>' +
      '        <select class="product-proxy-spec__input" data-field="limitConfig">' +
      limitOptions +
      '</select>' +
      '      </div>' +
      renderPointExchangeFields(sku) +
      renderPriceFieldsByExchange(sku) +
      renderSpecField('起售量', 'minQty', sku.minQty) +
      renderSkuStockFields(sku) +
      '    </div>' +
      '  </div>' +
      '  <div class="product-proxy-spec__foot">' +
      (sku.isDefault
        ? '<button type="button" class="product-proxy-spec__btn-default" data-action="unset-default">取消默认</button>'
        : '<button type="button" class="product-proxy-spec__btn-default" data-action="set-default">设为默认</button>') +
      '    <button type="button" class="product-proxy-spec__btn-off' +
      (sku.onShelf === false ? ' is-off' : '') +
      '" data-action="toggle-shelf">' +
      (sku.onShelf === false ? '上架' : '下架') +
      '    </button>' +
      '  </div>' +
      '</article>'
    );
  }

  function renderSkuStockFields(sku) {
    sku = ensureSkuStockFields(sku || {});
    var mode = sku.sellableMode;
    var modeOptions = SELLABLE_STOCK_MODES.map(function (opt) {
      return (
        '<option value="' +
        escapeHtml(opt.value) +
        '"' +
        (mode === opt.value ? ' selected' : '') +
        '>' +
        escapeHtml(opt.label) +
        '</option>'
      );
    }).join('');
    return (
      '<div class="product-proxy-spec__field">' +
      '  <label class="product-proxy-spec__label">现货库存</label>' +
      '  <input type="text" class="product-proxy-spec__input" data-field="spotStock" value="' +
      escapeHtml(sku.spotStock) +
      '" readonly tabindex="-1" aria-label="现货库存">' +
      '  <p class="product-proxy-spec__stock-tip">全网共享，等于各配送仓现货之和，由仓储维护。</p>' +
      '</div>' +
      '<div class="product-proxy-spec__field product-proxy-spec__field--sellable" data-sellable-mode="' +
      escapeHtml(mode) +
      '">' +
      '  <label class="product-proxy-spec__label">可售库存</label>' +
      '  <div class="product-proxy-spec__stock-row">' +
      '    <select class="product-proxy-spec__input product-proxy-spec__stock-mode" data-field="sellableMode" aria-label="可售库存配置方式">' +
      modeOptions +
      '</select>' +
      '    <input type="text" class="product-proxy-spec__input product-proxy-spec__stock-extra" data-field="sellablePercent" inputmode="decimal" value="' +
      escapeHtml(sku.sellablePercent) +
      '" placeholder="如 120" aria-label="溢出百分比"' +
      (mode === 'percent' ? '' : ' hidden') +
      '>' +
      '    <span class="product-proxy-spec__stock-suffix"' +
      (mode === 'percent' ? '' : ' hidden') +
      '>%</span>' +
      '    <input type="text" class="product-proxy-spec__input product-proxy-spec__stock-extra" data-field="sellableFixed" inputmode="decimal" value="' +
      escapeHtml(sku.sellableFixed) +
      '" placeholder="全网可售件数" aria-label="固定可售数量"' +
      (mode === 'fixed' ? '' : ' hidden') +
      '>' +
      '    <input type="text" class="product-proxy-spec__input product-proxy-spec__stock-result" data-sellable-result readonly tabindex="-1" value="' +
      escapeHtml(sku.sellableStock) +
      '" aria-label="可售库存结果"' +
      (mode === 'fixed' ? ' hidden' : '') +
      '>' +
      '  </div>' +
      '  <p class="product-proxy-spec__stock-tip">取现货/百分比按各仓现货计算；固定数量为全网上限。分仓与现货/预售预占见选品库「库存统计」。</p>' +
      '</div>'
    );
  }

  function renderSpecField(label, field, value) {
    return (
      '<div class="product-proxy-spec__field">' +
      '  <label class="product-proxy-spec__label">' +
      label +
      '</label>' +
      '  <input type="text" class="product-proxy-spec__input" data-field="' +
      field +
      '" value="' +
      escapeHtml(value == null ? '' : value) +
      '">' +
      '</div>'
    );
  }

  function renderMoneyField(label, field, value) {
    return (
      '<div class="product-proxy-spec__field">' +
      '  <label class="product-proxy-spec__label">' +
      label +
      '</label>' +
      '  <div class="product-proxy-spec__money">' +
      '    <span class="product-proxy-spec__money-prefix">¥</span>' +
      '    <input type="text" class="product-proxy-spec__input product-proxy-spec__input--money" data-field="' +
      field +
      '" value="' +
      escapeHtml(value == null ? '' : value) +
      '">' +
      '  </div>' +
      '</div>'
    );
  }

  function renderSkuPanels(state) {
    var poolMap = {};
    state.skuPool.forEach(function (s) { poolMap[s.id] = s; });
    var selected = state.selectedSkuIds.map(function (id) { return poolMap[id]; }).filter(Boolean);
    return selected.map(function (sku, idx) { return renderSpecPanel(sku, idx); }).join('');
  }

  function renderSkuSelectorLabel(state) {
    return '已选 ' + state.selectedSkuIds.length + ' 个 SKU';
  }

  function renderImages(images) {
    var html = images.map(function (src, idx) {
      return (
        '<div class="product-proxy-form__img-item" data-img-index="' + idx + '">' +
        '  <img src="' + escapeHtml(src) + '" alt="">' +
        '  <button type="button" class="product-proxy-form__img-remove" data-action="remove-image" data-index="' + idx + '" aria-label="删除">&times;</button>' +
        '</div>'
      );
    }).join('');
    return html + '<button type="button" class="product-add-upload__box" data-action="add-image"><span class="product-add-upload__plus">+</span></button>';
  }

  function buildFormHtml(product, state, isEdit) {
    var tagOptions = getTagOptions();
    var tagSelect = tagOptions.map(function (name) {
      var sel = product.tag === name ? ' selected' : '';
      return '<option value="' + escapeHtml(name) + '"' + sel + '>' + escapeHtml(name) + '</option>';
    }).join('');

    var skuDropdown = state.skuPool.map(function (sku) {
      var checked = state.selectedSkuIds.indexOf(sku.id) >= 0 ? ' checked' : '';
      return (
        '<label class="product-proxy-form__sku-option">' +
        '  <input type="checkbox" data-sku-id="' + escapeHtml(sku.id) + '"' + checked + '>' +
        '  <span>' + escapeHtml(sku.displayName) + '（' + escapeHtml(sku.specValue) + '）</span>' +
        '</label>'
      );
    }).join('');

    return (
      '<div class="erp-modal product-proxy-form-modal product-proxy-form-modal--landscape">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' + (isEdit ? '编辑商品' : '添加商品') + '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-form-fullscreen aria-label="全屏" title="全屏">&#9723;</button>' +
      '      <button type="button" class="erp-modal__header-btn" data-form-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body product-proxy-form__body">' +
      '    <section class="product-proxy-form__section">' +
      '      <h3 class="product-proxy-form__section-title">基础信息</h3>' +
      '      <div class="product-proxy-form__grid product-proxy-form__grid--2">' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormName"><span class="product-proxy-form__req">*</span>商品名称</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <input class="product-proxy-form__input" id="proxyFormName" type="text" value="' + escapeHtml(product.name || '') + '" placeholder="请输入商品名称">' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field product-proxy-form__field--category">' +
      '          <label class="product-proxy-form__label">商品类目</label>' +
      '          <div class="product-proxy-form__control" id="proxyFormCategoryPicker"></div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormEta">预计到达时间</label>' +
      '          <div class="product-proxy-form__control product-proxy-form__eta">' +
      '            <input class="product-proxy-form__input product-proxy-form__eta-input" id="proxyFormEta" type="text" inputmode="numeric" value="' + escapeHtml(state.etaCountdown) + '" placeholder="请输入预计到达时间">' +
      '            <select class="product-proxy-form__input product-proxy-form__eta-unit" id="proxyFormEtaUnit" aria-label="倒计时单位">' +
      ETA_COUNTDOWN_UNITS.map(function (u) {
        return '<option value="' + escapeHtml(u) + '"' + (state.etaCountdownUnit === u ? ' selected' : '') + '>' + escapeHtml(u) + '</option>';
      }).join('') +
      '            </select>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormTag">商品标签</label>' +
      '          <div class="product-proxy-form__control product-proxy-form__tag-select">' +
      '            <select class="product-proxy-form__input" id="proxyFormTag">' +
      '              <option value="">请选择商品标签</option>' + tagSelect +
      '            </select>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label"><span class="product-proxy-form__req">*</span>履约方式</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <div class="product-add-radio-row">' +
      getDeliveryModeOptions().map(function (opt) {
        return (
          '<label class="product-add-radio' + (state.deliveryMode === opt.value ? ' is-checked' : '') + '">' +
          '<input type="radio" name="proxyDeliveryMode" value="' + opt.value + '"' +
          (state.deliveryMode === opt.value ? ' checked' : '') + '> ' + opt.label +
          '</label>'
        );
      }).join('') +
      '            </div>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field product-proxy-form__field--sale-time">' +
      '          <label class="product-proxy-form__label" for="proxySaleTimeStart">可售时间</label>' +
      '          <div class="product-proxy-form__control product-proxy-form__sale-time-wrap">' +
      '            <div class="product-proxy-form__eta product-proxy-form__sale-time-range">' +
      '              <input class="product-proxy-form__input" id="proxySaleTimeStart" type="time" value="' + escapeHtml(state.saleTimeStart) + '" aria-label="可售开始时间">' +
      '              <span class="product-proxy-form__sale-time-sep">至</span>' +
      '              <input class="product-proxy-form__input" id="proxySaleTimeEnd" type="time" value="' + escapeHtml(state.saleTimeEnd) + '" aria-label="可售结束时间">' +
      '            </div>' +
      '            <div class="product-proxy-form__hint product-proxy-form__sale-time-tip" id="proxySaleTimeSourceTip" data-source="' +
      escapeHtml(state.saleTimeSource || 'business') +
      '">' +
      escapeHtml(saleTimeSourceTipText(state.saleTimeSource || 'business')) +
      '</div>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormDisplaySales">展示销量</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <input class="product-proxy-form__input" id="proxyFormDisplaySales" type="text" value="' + escapeHtml(state.displaySales) + '" placeholder="请输入展示销量">' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field product-proxy-form__field--text-desc">' +
      '          <label class="product-proxy-form__label" for="proxyFormTextDesc">文字描述</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <textarea class="product-proxy-form__textarea product-proxy-form__textarea--inline" id="proxyFormTextDesc" rows="1" placeholder="请输入商品文字描述">' + escapeHtml(state.textDesc) + '</textarea>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '    </section>' +
      renderSaleScopeSection(state) +
      '    <section class="product-proxy-form__section">' +
      '      <h3 class="product-proxy-form__section-title">售卖规格配置</h3>' +
      '      <div class="product-proxy-form__sku-bar">' +
      '        <label class="product-proxy-form__label product-proxy-form__label--inline">选择 SKU</label>' +
      '        <div class="product-proxy-form__sku-picker" id="proxyFormSkuPicker">' +
      '          <button type="button" class="product-proxy-form__sku-trigger" id="proxyFormSkuTrigger">' + renderSkuSelectorLabel(state) + ' <span class="product-proxy-form__sku-caret">▼</span></button>' +
      '          <div class="product-proxy-form__sku-dropdown" id="proxyFormSkuDropdown" hidden>' + skuDropdown + '</div>' +
      '        </div>' +
      '        <p class="product-proxy-form__sku-tip">1份SKU采购价：采购价/基础单位 × 售卖系数</p>' +
      '      </div>' +
      '      <div class="product-proxy-form__spec-list" id="proxyFormSpecList">' + renderSkuPanels(state) + '</div>' +
      '    </section>' +
      '    <section class="product-proxy-form__section">' +
      '      <h3 class="product-proxy-form__section-title">媒体与详情</h3>' +
      '      <div class="product-proxy-form__field product-proxy-form__field--media">' +
      '        <label class="product-proxy-form__label">商品图片</label>' +
      '        <div class="product-proxy-form__control">' +
      '          <p class="product-proxy-form__hint">发布一波上市的新品图片，支持 JPG/PNG/GIF/WEBP 格式，单张小于 5MB；建议 1 个 MP4 视频小于 10MB</p>' +
      '          <div class="product-proxy-form__images" id="proxyFormImages">' + renderImages(state.images) + '</div>' +
      '          <input type="file" id="proxyFormImageInput" accept="image/*" hidden>' +
      '        </div>' +
      '      </div>' +
      '      <div class="product-proxy-form__field product-proxy-form__field--media">' +
      '        <label class="product-proxy-form__label">商品详情</label>' +
      '        <div class="product-proxy-form__control">' +
      '          <div class="product-add-editor">' +
      '            <div class="product-add-editor__toolbar">' + editorToolbarHtml() + '</div>' +
      '            <div class="product-add-editor__body" id="proxyFormDetailEditor" contenteditable="true" data-placeholder="请输入商品详情，支持图片、文字、连接描述">' +
      (state.detailHtml || '') +
      '            </div>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '    </section>' +
      '  </div>' +
      '  <div class="erp-modal__footer product-proxy-form__footer">' +
      '    <p class="product-proxy-form__footer-tip">编辑内容可能丢失，不会影响中数据</p>' +
      '    <div class="product-proxy-form__footer-actions">' +
      '      <button type="button" class="erp-btn" data-form-cancel>取消</button>' +
      '      <button type="button" class="erp-btn erp-btn--primary" data-form-save>保存</button>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  function refreshSpecList(backdrop) {
    syncAutoDisplayNames(backdrop);
    var listEl = backdrop.querySelector('#proxyFormSpecList');
    var triggerEl = backdrop.querySelector('#proxyFormSkuTrigger');
    if (listEl) listEl.innerHTML = renderSkuPanels(formState);
    if (triggerEl) {
      triggerEl.innerHTML = renderSkuSelectorLabel(formState) + ' <span class="product-proxy-form__sku-caret">▼</span>';
    }
    bindSpecEvents(backdrop);
  }

  function refreshImages(backdrop) {
    var wrap = backdrop.querySelector('#proxyFormImages');
    if (!wrap) return;
    wrap.innerHTML = renderImages(formState.images);
    bindImageEvents(backdrop);
  }

  function readSpecPanelsFromDom(backdrop) {
    var poolMap = {};
    formState.skuPool.forEach(function (s) { poolMap[s.id] = s; });

    backdrop.querySelectorAll('.product-proxy-spec').forEach(function (panel) {
      var id = panel.getAttribute('data-sku-id');
      var sku = poolMap[id];
      if (!sku) return;
      panel.querySelectorAll('[data-field]').forEach(function (input) {
        if (input.hidden) return;
        sku[input.getAttribute('data-field')] = input.value;
      });
      ensureSkuStockFields(sku);
    });
    formState.skuPool = formState.skuPool.map(function (s) { return poolMap[s.id] || s; });
  }

  function getFormProductName(backdrop) {
    var nameInput = backdrop.querySelector('#proxyFormName');
    if (nameInput) return String(nameInput.value || '').trim();
    return String((formState && formState.productName) || '').trim();
  }

  function syncAutoDisplayNames(backdrop, productName) {
    var name = productName != null ? String(productName || '').trim() : getFormProductName(backdrop);
    formState.productName = name;
    formState.skuPool.forEach(function (sku) {
      if (sku.displayNameManual) return;
      sku.displayName = buildDefaultDisplayName(name, sku.specValue, sku.saleUnit);
    });
  }

  function updatePanelDisplayNameInput(panel, sku) {
    var input = panel.querySelector('[data-field="displayName"]');
    if (input) input.value = sku.displayName || '';
  }

  function bindSpecEvents(backdrop) {
    backdrop.querySelectorAll('.product-proxy-spec [data-action="set-default"]').forEach(function (btn) {
      btn.onclick = function () {
        readSpecPanelsFromDom(backdrop);
        var panel = btn.closest('.product-proxy-spec');
        var id = panel.getAttribute('data-sku-id');
        formState.skuPool.forEach(function (s) {
          s.isDefault = s.id === id;
        });
        refreshSpecList(backdrop);
      };
    });

    backdrop.querySelectorAll('.product-proxy-spec [data-action="unset-default"]').forEach(function (btn) {
      btn.onclick = function () {
        readSpecPanelsFromDom(backdrop);
        var panel = btn.closest('.product-proxy-spec');
        var id = panel.getAttribute('data-sku-id');
        var selected = formState.selectedSkuIds.slice();
        var otherId = '';
        for (var i = 0; i < selected.length; i++) {
          if (selected[i] !== id) {
            otherId = selected[i];
            break;
          }
        }
        if (!otherId) {
          if (typeof showToast === 'function') showToast('至少保留一个默认规格', 'warning');
          return;
        }
        formState.skuPool.forEach(function (s) {
          s.isDefault = s.id === otherId;
        });
        refreshSpecList(backdrop);
      };
    });

    backdrop.querySelectorAll('.product-proxy-spec [data-action="toggle-shelf"]').forEach(function (btn) {
      btn.onclick = function () {
        readSpecPanelsFromDom(backdrop);
        var panel = btn.closest('.product-proxy-spec');
        var id = panel.getAttribute('data-sku-id');
        formState.skuPool.forEach(function (s) {
          if (s.id === id) s.onShelf = s.onShelf === false;
        });
        refreshSpecList(backdrop);
      };
    });

    backdrop.querySelectorAll('.product-proxy-spec').forEach(function (panel) {
      var id = panel.getAttribute('data-sku-id');
      var sku = formState.skuPool.find(function (s) {
        return s.id === id;
      });
      if (!sku) return;

      var displayInput = panel.querySelector('[data-field="displayName"]');
      if (displayInput) {
        displayInput.addEventListener('input', function () {
          sku.displayName = displayInput.value;
          sku.displayNameManual = true;
        });
      }

      panel.querySelectorAll('[data-field="specValue"], [data-field="saleUnit"]').forEach(function (input) {
        var handler = function () {
          sku[input.getAttribute('data-field')] = input.value;
          if (!sku.displayNameManual) {
            sku.displayName = buildDefaultDisplayName(
              getFormProductName(backdrop),
              sku.specValue,
              sku.saleUnit
            );
            updatePanelDisplayNameInput(panel, sku);
          }
        };
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
      });

      // 积分兑换切换：重绘规格卡，露出对应字段
      var exchangeSelect = panel.querySelector('[data-field="pointExchange"]');
      if (exchangeSelect) {
        exchangeSelect.addEventListener('change', function () {
          readSpecPanelsFromDom(backdrop);
          sku.pointExchange = normalizePointExchange(exchangeSelect.value);
          refreshSpecList(backdrop);
        });
      }

      var sellableWrap = panel.querySelector('[data-sellable-mode]');
      if (sellableWrap) {
        function syncSellableResult() {
          ensureSkuStockFields(sku);
          var resultEl = panel.querySelector('[data-sellable-result]');
          if (resultEl) resultEl.value = sku.sellableStock;
        }
        var modeSelect = panel.querySelector('[data-field="sellableMode"]');
        if (modeSelect) {
          modeSelect.addEventListener('change', function () {
            readSpecPanelsFromDom(backdrop);
            sku.sellableMode = normalizeSellableMode(modeSelect.value);
            refreshSpecList(backdrop);
          });
        }
        panel.querySelectorAll('[data-field="sellablePercent"], [data-field="sellableFixed"]').forEach(function (input) {
          input.addEventListener('input', function () {
            sku[input.getAttribute('data-field')] = input.value;
            syncSellableResult();
          });
        });
      }
    });
  }

  function bindProductNameSync(backdrop) {
    var nameInput = backdrop.querySelector('#proxyFormName');
    if (!nameInput) return;
    nameInput.addEventListener('input', function () {
      readSpecPanelsFromDom(backdrop);
      syncAutoDisplayNames(backdrop, nameInput.value);
      formState.skuPool.forEach(function (sku) {
        if (sku.displayNameManual) return;
        var panel = backdrop.querySelector('.product-proxy-spec[data-sku-id="' + sku.id + '"]');
        if (panel) updatePanelDisplayNameInput(panel, sku);
      });
    });
  }

  function bindImageEvents(backdrop) {
    var input = backdrop.querySelector('#proxyFormImageInput');
    var addBtn = backdrop.querySelector('[data-action="add-image"]');
    if (addBtn && input) {
      addBtn.onclick = function () { input.click(); };
      input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          formState.images.push(reader.result);
          refreshImages(backdrop);
        };
        reader.readAsDataURL(file);
        input.value = '';
      };
    }

    backdrop.querySelectorAll('[data-action="remove-image"]').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        formState.images.splice(idx, 1);
        refreshImages(backdrop);
      };
    });
  }

  function bindSkuPicker(backdrop) {
    var trigger = backdrop.querySelector('#proxyFormSkuTrigger');
    var dropdown = backdrop.querySelector('#proxyFormSkuDropdown');
    if (!trigger || !dropdown) return;

    trigger.onclick = function (e) {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    };

    dropdown.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
      checkbox.onchange = function () {
        readSpecPanelsFromDom(backdrop);
        var id = checkbox.getAttribute('data-sku-id');
        if (checkbox.checked) {
          if (formState.selectedSkuIds.indexOf(id) < 0) {
            formState.selectedSkuIds.push(id);
          }
        } else {
          if (formState.selectedSkuIds.length <= 1) {
            checkbox.checked = true;
            if (typeof showToast === 'function') showToast('至少保留 1 个 SKU', 'warning');
            return;
          }
          formState.selectedSkuIds = formState.selectedSkuIds.filter(function (sid) { return sid !== id; });
        }
        refreshSpecList(backdrop);
        trigger.innerHTML = renderSkuSelectorLabel(formState) + ' <span class="product-proxy-form__sku-caret">▼</span>';
      };
    });

    document.addEventListener('click', function closeSkuDropdown(e) {
      if (!backdrop.isConnected) {
        document.removeEventListener('click', closeSkuDropdown);
        return;
      }
      if (!e.target.closest('#proxyFormSkuPicker')) {
        dropdown.hidden = true;
      }
    });
  }

  function bindSaleTimeEvents(backdrop, product) {
    function markTouched() {
      if (!formState) return;
      formState.saleTimeTouched = true;
      formState.saleTimeMode = 'custom';
      formState.saleTimeSource = 'custom';
      updateSaleTimeSourceTip(backdrop, 'custom');
    }
    ['#proxySaleTimeStart', '#proxySaleTimeEnd'].forEach(function (sel) {
      var el = backdrop.querySelector(sel);
      if (!el) return;
      el.addEventListener('change', markTouched);
      el.addEventListener('input', markTouched);
    });

    backdrop.querySelectorAll('input[name="proxyDeliveryMode"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (!formState) return;
        formState.deliveryMode = normalizeDeliveryMode(radio.value);
        backdrop.querySelectorAll('input[name="proxyDeliveryMode"]').forEach(function (r) {
          var lab = r.closest('.product-add-radio');
          if (lab) lab.classList.toggle('is-checked', r.checked);
        });
        syncInheritedSaleTime(backdrop, product);
      });
    });
  }

  function bindSaleScopeEvents(backdrop) {
    var regionPanel = backdrop.querySelector('#proxySaleScopeRegion');
    var storePanel = backdrop.querySelector('#proxySaleScopeStore');
    var tagsEl = backdrop.querySelector('#proxySaleScopeTags');
    var pickBtn = backdrop.querySelector('#proxySaleScopePickBtn');
    var storePickBtn = backdrop.querySelector('#proxySaleScopeStorePickBtn');
    var storeCountEl = backdrop.querySelector('#proxySaleScopeStoreCount');

    function refreshRegionTags() {
      if (!tagsEl) return;
      tagsEl.innerHTML = renderSaleRegionSummary(formState);
    }

    function refreshStoreCount() {
      if (!storeCountEl) return;
      var count = getSaleStoreCount(formState);
      storeCountEl.textContent = '已选择 ' + count + ' 个门店';
      storeCountEl.hidden = !count;
    }

    function syncScopePanelsVisible() {
      var scopeEl = backdrop.querySelector('input[name="proxySaleScope"]:checked');
      var isRegion = scopeEl && scopeEl.value === 'region';
      var isStore = scopeEl && scopeEl.value === 'store';
      if (regionPanel) regionPanel.hidden = !isRegion;
      if (storePanel) storePanel.hidden = !isStore;
      if (scopeEl) formState.saleScope = scopeEl.value;
    }

    backdrop.querySelectorAll('input[name="proxySaleScope"]').forEach(function (radio) {
      radio.addEventListener('change', syncScopePanelsVisible);
    });

    if (pickBtn) {
      pickBtn.addEventListener('click', function () {
        if (!window.MdmProxyRegionPicker) {
          if (typeof showToast === 'function') showToast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: formState.saleRegions,
          onConfirm: function (selected, summary) {
            formState.saleRegions = selected;
            formState.saleRegionSummary = summary;
            refreshRegionTags();
          }
        });
      });
    }

    if (storePickBtn) {
      storePickBtn.addEventListener('click', function () {
        if (!window.MdmProxyStorePicker) {
          if (typeof showToast === 'function') showToast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: formState.saleStores,
          onConfirm: function (selected) {
            formState.saleStores = selected;
            refreshStoreCount();
          }
        });
      });
    }
  }

  function collectPayload(backdrop, product) {
    readSpecPanelsFromDom(backdrop);

    var poolMap = {};
    formState.skuPool.forEach(function (s) { poolMap[s.id] = s; });
    var skus = {};
    formState.selectedSkuIds.forEach(function (id) {
      if (poolMap[id]) skus[id] = Object.assign({}, poolMap[id]);
    });

    var defaultSkuItem =
      formState.skuPool.find(function (s) {
        return s.isDefault;
      }) || poolMap[formState.selectedSkuIds[0]];

    var scopeEl = backdrop.querySelector('input[name="proxySaleScope"]:checked');
    var deliveryEl = backdrop.querySelector('input[name="proxyDeliveryMode"]:checked');
    var detailEditor = backdrop.querySelector('#proxyFormDetailEditor');
    var deliveryMode = normalizeDeliveryMode(deliveryEl ? deliveryEl.value : formState.deliveryMode);
    var etaCountdown = ((backdrop.querySelector('#proxyFormEta') || {}).value || '').trim();
    var etaCountdownUnit = ((backdrop.querySelector('#proxyFormEtaUnit') || {}).value || '天').trim() || '天';
    var saleTimeStart = ((backdrop.querySelector('#proxySaleTimeStart') || {}).value || '').trim();
    var saleTimeEnd = ((backdrop.querySelector('#proxySaleTimeEnd') || {}).value || '').trim();
    var saleTimeMode =
      formState && (formState.saleTimeTouched || formState.saleTimeMode === 'custom')
        ? 'custom'
        : 'follow_category';
    if (saleTimeMode === 'follow_category') {
      var inheritedOnSave = resolveInheritedSaleTime(
        pickerInstance && typeof pickerInstance.getPaths === 'function'
          ? pickerInstance.getPaths()
          : getProductCategoryPaths(product),
        deliveryMode,
        (product && product.storeId) || ''
      );
      saleTimeStart = inheritedOnSave.start;
      saleTimeEnd = inheritedOnSave.end;
    }
    var exchange = normalizePointExchange(defaultSkuItem && defaultSkuItem.pointExchange);
    var priceType =
      exchange === 'points' ? 'points' : exchange === 'points_cash' ? 'money_points' : 'money';
    var priceMoney = 0.01;
    var pricePoints = 0;
    if (defaultSkuItem) {
      if (exchange === 'points') {
        pricePoints = parseFloat(defaultSkuItem.pointsAmount) || 0;
        priceMoney = 0;
      } else if (exchange === 'points_cash') {
        pricePoints = parseFloat(defaultSkuItem.pointsAmount) || 0;
        priceMoney =
          parseFloat(defaultSkuItem.pointCash != null ? defaultSkuItem.pointCash : defaultSkuItem.salePrice) ||
          0;
      } else {
        priceMoney = parseFloat(defaultSkuItem.salePrice) || 0.01;
      }
    }

    return {
      name: (backdrop.querySelector('#proxyFormName') || {}).value.trim(),
      tag: (backdrop.querySelector('#proxyFormTag') || {}).value,
      etaCountdown: etaCountdown,
      etaCountdownUnit: etaCountdownUnit,
      saleTimeMode: saleTimeMode,
      saleTimeStart: saleTimeStart,
      saleTimeEnd: saleTimeEnd,
      deliveryMode: deliveryMode,
      fulfillmentMode: deliveryMode,
      category_l3_ids: pickerInstance ? pickerInstance.getValues() : getProductCategoryIds(product),
      category_paths: pickerInstance ? pickerInstance.getPaths() : getProductCategoryPaths(product),
      category_l3_id: pickerInstance ? pickerInstance.getValue() : (product.category_l3_id || ''),
      category_path: pickerInstance ? pickerInstance.getPath() : (product.category_path || product.category || ''),
      category: pickerInstance ? pickerInstance.getPaths().join('、') : (product.category || product.category_path || ''),
      img: formState.images[0] || product.img,
      specCount: formState.selectedSkuIds.length,
      spec: defaultSkuItem ? defaultSkuItem.specValue || defaultSkuItem.displayName : product.spec,
      priceType: priceType,
      priceMoney: priceMoney,
      pricePoints: pricePoints,
      linePrice: defaultSkuItem && defaultSkuItem.linePrice ? parseFloat(defaultSkuItem.linePrice) : null,
      detail: {
        summary: (backdrop.querySelector('#proxyFormDisplaySales') || {}).value.trim(),
        displaySales: (backdrop.querySelector('#proxyFormDisplaySales') || {}).value.trim(),
        textDesc: (backdrop.querySelector('#proxyFormTextDesc') || {}).value.trim(),
        etaCountdown: etaCountdown,
        etaCountdownUnit: etaCountdownUnit,
        saleTimeMode: saleTimeMode,
        saleTimeStart: saleTimeStart,
        saleTimeEnd: saleTimeEnd,
        deliveryMode: deliveryMode,
        saleScope: scopeEl ? scopeEl.value : 'all',
        saleRegions: cloneRegionSelected(formState.saleRegions),
        saleRegionSummary: (formState.saleRegionSummary || []).slice(),
        saleStores: cloneStoreSelected(formState.saleStores),
        images: formState.images.slice(),
        detailHtml: detailEditor ? detailEditor.innerHTML : '',
        selectedSkuIds: formState.selectedSkuIds.slice(),
        skus: skus
      },
      detailEdited: true
    };
  }

  function openProxyProductForm(options) {
    var store = window.MdmProxyCategoryStore;
    if (!store) return;

    options = options || {};
    formChannel = options.channel === 'mall' ? 'mall' : 'proxy';
    var isEdit = options.mode === 'edit';
    var product = options.product || {};
    var onSave = options.onSave;

    closeModal();
    formState = normalizeDetail(product);

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-proxy-form-backdrop';
    backdrop.setAttribute('data-proxy-product-form', '1');
    backdrop.innerHTML = buildFormHtml(product, formState, isEdit);

    var modal = backdrop.querySelector('.product-proxy-form-modal');
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeModal(); });
    backdrop.querySelectorAll('[data-form-close], [data-form-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    var fsBtn = backdrop.querySelector('[data-form-fullscreen]');
    if (fsBtn && modal) {
      fsBtn.addEventListener('click', function () {
        var on = modal.classList.toggle('erp-modal--fullscreen');
        fsBtn.title = on ? '退出全屏' : '全屏';
      });
    }

    backdrop.querySelector('[data-form-save]').addEventListener('click', function () {
      var payload = collectPayload(backdrop, product);
      if (!payload.name) {
        if (typeof showToast === 'function') showToast('请输入商品名称', 'warning');
        return;
      }
      if (!payload.category_l3_ids.length || !payload.category_l3_ids.every(function (id) {
        return store.isSelectableL3(id);
      })) {
        if (typeof showToast === 'function') showToast('请至少选择一个已上架的三级类目', 'warning');
        return;
      }
      if (payload.detail.saleScope === 'region') {
        var regionCount = Object.keys(formState.saleRegions || {}).length;
        if (!regionCount) {
          if (typeof showToast === 'function') showToast('请选择售卖区域', 'warning');
          return;
        }
      }
      if (payload.detail.saleScope === 'store') {
        var storeCount = Object.keys(formState.saleStores || {}).length;
        if (!storeCount) {
          if (typeof showToast === 'function') showToast('请选择售卖门店', 'warning');
          return;
        }
      }
      if (!payload.saleTimeStart || !payload.saleTimeEnd) {
        if (typeof showToast === 'function') showToast('请配置可售时间', 'warning');
        return;
      }
      if (payload.saleTimeStart === payload.saleTimeEnd) {
        if (typeof showToast === 'function') showToast('可售开始与结束时间不能相同', 'warning');
        return;
      }
      if (typeof onSave === 'function') onSave(payload, product);
      closeModal();
    });

    document.body.appendChild(backdrop);

    var pickerEl = backdrop.querySelector('#proxyFormCategoryPicker');
    if (pickerEl && window.MdmProxyCategoryPicker) {
      pickerInstance = window.MdmProxyCategoryPicker.mount({
        container: pickerEl,
        values: getProductCategoryIds(product),
        onChange: function () {
          syncInheritedSaleTime(backdrop, product);
        }
      });
    }

    bindSpecEvents(backdrop);
    bindProductNameSync(backdrop);
    bindImageEvents(backdrop);
    bindSkuPicker(backdrop);
    bindSaleTimeEvents(backdrop, product);
    bindSaleScopeEvents(backdrop);
    syncInheritedSaleTime(backdrop, product);

    var nameInput = backdrop.querySelector('#proxyFormName');
    if (nameInput) nameInput.focus();
  }

  /** 列表/表单共用：解析商品有效可售时间 */
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
    return resolveInheritedSaleTime(
      getProductCategoryPaths(product),
      product.deliveryMode || product.fulfillmentMode || detail.deliveryMode,
      opts.storeId || product.storeId || ''
    );
  }

  function formatSaleTimeLabel(product, options) {
    var t = resolveEffectiveSaleTime(product, options);
    if (t.source === 'express24h') return '24小时可售';
    return (t.start || '08:00') + '–' + (t.end || '22:00');
  }

  window.MdmProductSaleTime = {
    resolve: resolveEffectiveSaleTime,
    format: formatSaleTimeLabel,
    isSaleableNow: isProductSaleableNow,
    isWithinWindow: isWithinSaleWindow
  };

  window.MdmProxyProductForm = {
    open: openProxyProductForm,
    close: closeModal
  };
})();
