/**
 * 营销-积分商城商品池（独立于选品库）
 *
 * 关系约定：
 * - 选品库（MdmProductCatalog）= 商品原始主数据，只读引用
 * - 积分商城本 store = 从选品库挑选后，叠加积分兑换属性后的商品池
 * - 唯一键：商品编码 code（即 goodsId），与选品库一一对应，禁止重复添加
 * - 本模块只读选品库，绝不回写/改写选品库主数据
 */
(function () {
  var STORAGE_KEY = 'mdm_marketing_points_mall_v12';

  function makeSpecs(code, basePrice, points, money, count, enabledCount, img) {
    var names = ['默认', '500g', '1kg', '2.5kg'];
    var n = Math.max(1, count || 1);
    var enableN = enabledCount == null ? n : Math.max(1, Math.min(n, enabledCount));
    var exchangeType = money > 0 ? 'points_money' : 'points';
    var fallbackImg = img || '../user-app/assets/restock/product-leaf.svg';
    var list = [];
    for (var i = 0; i < n; i++) {
      var enabled = i < enableN;
      list.push({
        skuCode: code + '-' + String(i + 1).padStart(2, '0'),
        specName: n === 1 ? '默认' : names[i] || ('规格' + (i + 1)),
        skuImg: fallbackImg,
        purchasePrice: Math.round((basePrice + i * 0.5) * 100) / 100,
        linePrice: Math.round((basePrice + i * 0.5 + 2) * 100) / 100,
        stock: 80 + i * 15,
        /* 起售量：每 SKU 独立，默认 1，演示数据略作区分 */
        minSaleQty: i === 0 ? 1 : Math.min(3, i + 1),
        exchangeEnabled: enabled,
        exchangeType: exchangeType,
        points: enabled ? points + i * 10 : 0,
        money: enabled && money > 0 ? Math.round((money + i * 0.5) * 100) / 100 : 0,
        exchangedQty: enabled ? Math.max(0, 12 - i * 2) : 0
      });
    }
    return list;
  }

  function parseOptionalLimit(val) {
    if (val === '' || val == null) return null;
    var n = Number(val);
    if (isNaN(n) || n < 0) return null;
    return Math.round(n);
  }

  var SEED = [
    {
      code: 'SPU00103',
      name: 'ss积分加现金',
      img: '../user-app/assets/restock/product-leaf.svg',
      category: '新鲜蔬菜',
      status: 'on_shelf',
      deliveryMode: 'express',
      exchangeType: 'points_money',
      supplierId: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      memberLevelIds: [],
      limitType: 'order',
      limitPerOrder: 2,
      limitPerDay: null,
      limitTotal: null,
      specs: makeSpecs('SPU00103', 10, 100, 1, 2, 2, '../user-app/assets/restock/product-leaf.svg')
    },
    {
      code: 'SPU00090',
      name: '东北大米 5kg',
      img: '../user-app/assets/restock/category-icon-grain.svg',
      category: '粮油调味',
      status: 'schedule',
      scheduleOnAt: '2026-07-20T08:00',
      scheduleOffAt: '2026-08-31T23:59',
      deliveryMode: 'platform',
      exchangeType: 'points',
      saleScope: 'region',
      saleRegions: { '440000': 1 },
      saleRegionSummary: [{ id: '440000', label: '广东省' }, { id: '330000', label: '浙江省' }],
      supplierId: '斯斯供应商商家',
      supplierName: '斯斯供应商商家',
      memberLevelIds: [],
      limitType: 'order',
      limitPerOrder: 1,
      limitPerDay: null,
      limitTotal: null,
      specs: makeSpecs('SPU00090', 32, 500, 0, 1, 1, '../user-app/assets/restock/category-icon-grain.svg')
    },
    {
      code: 'SPU00085',
      name: '圆茄 优质',
      img: '../user-app/assets/restock/product-eggplant-round.svg',
      category: '新鲜蔬菜',
      status: 'off_shelf',
      deliveryMode: 'platform',
      exchangeType: 'points',
      saleScope: 'store',
      saleStores: { 'st-001': 1, 'st-002': 1, 'st-003': 1 },
      memberLevelIds: ['ML10002', 'ML10001'],
      limitType: 'day',
      limitPerOrder: null,
      limitPerDay: 3,
      limitTotal: null,
      specs: makeSpecs('SPU00085', 3.5, 80, 0, 3, 2, '../user-app/assets/restock/product-eggplant-round.svg')
    },
    {
      code: 'SPU00078',
      name: '长茄子 广茄',
      img: '../user-app/assets/restock/product-eggplant-long.svg',
      category: '新鲜蔬菜',
      status: 'on_shelf',
      deliveryMode: 'express',
      exchangeType: 'points_money',
      saleScope: 'all',
      supplierId: '斯斯供应商商家',
      supplierName: '斯斯供应商商家',
      memberLevelIds: [],
      limitType: 'total',
      limitPerOrder: null,
      limitPerDay: null,
      limitTotal: 50,
      specs: makeSpecs('SPU00078', 4.2, 50, 2.5, 2, 2, '../user-app/assets/restock/product-eggplant-long.svg')
    }
  ];

  var list = [];
  var loaded = false;

  function normalizeSpec(spec, index, productCode, productExchangeType) {
    var s = Object.assign({}, spec || {});
    var type = productExchangeType === 'points_money' || s.exchangeType === 'points_money'
      ? 'points_money'
      : 'points';
    if (productExchangeType === 'points' || productExchangeType === 'points_money') {
      type = productExchangeType;
    }
    s.skuCode = s.skuCode || (productCode + '-' + String((index || 0) + 1).padStart(2, '0'));
    s.specName = s.specName || '默认';
    s.skuImg = s.skuImg || s.specImg || '';
    s.purchasePrice = Math.round((Number(s.purchasePrice) || 0) * 100) / 100;
    s.stock = Math.max(0, Math.round(Number(s.stock) || 0));
    /* 起售量：每 SKU 独立配置，至少 1 */
    s.minSaleQty = Math.max(1, Math.round(Number(s.minSaleQty) || 1));
    s.exchangeEnabled = !!s.exchangeEnabled;
    s.exchangeType = type;
    if (s.exchangeEnabled) {
      s.points = Math.max(0, Math.round(Number(s.points) || 0));
      s.money = type === 'points_money'
        ? Math.round((Number(s.money) || 0) * 100) / 100
        : 0;
    } else {
      s.points = Math.max(0, Math.round(Number(s.points) || 0));
      s.money = type === 'points_money'
        ? Math.round((Number(s.money) || 0) * 100) / 100
        : 0;
    }
    s.exchangedQty = Math.max(0, Math.round(Number(s.exchangedQty != null ? s.exchangedQty : s.exchangeQty) || 0));
    delete s.exchangeQty;
    if (s.linePrice === '' || s.linePrice == null) {
      s.linePrice = null;
    } else {
      var lp = Number(s.linePrice);
      s.linePrice = isNaN(lp) || lp < 0 ? null : Math.round(lp * 100) / 100;
    }
    return s;
  }

  function normalizeDeliveryMode(mode) {
    if (mode === 'express' || mode === '快递到店' || mode === '快递' || mode === '快递配送' || mode === 'store') {
      return 'express';
    }
    if (mode === 'platform' || mode === '平台配送' || mode === '配送' || mode === 'warehouse' || mode === 'delivery') {
      return 'platform';
    }
    return 'platform';
  }

  function normalizeSaleScope(scope) {
    if (scope === 'region' || scope === 'store' || scope === 'all') return scope;
    return 'all';
  }

  function normalizeSalePortScope(scope) {
    return scope === 'custom' ? 'custom' : 'all';
  }

  function normalizeSalePorts(ports, scope) {
    if (scope !== 'custom') return [];
    var allowed = { mini_program: 1, app: 1 };
    return (Array.isArray(ports) ? ports : []).filter(function (p) {
      return !!allowed[String(p)];
    });
  }

  function normalizeImages(images, fallbackImg) {
    var list = Array.isArray(images) ? images.filter(Boolean).map(String) : [];
    if (!list.length && fallbackImg) list = [String(fallbackImg)];
    return list;
  }

  function normalizeItem(item) {
    var copy = Object.assign({}, item);
    if (copy.status === 'schedule' || copy.status === 'scheduled') {
      copy.status = 'schedule';
    } else {
      copy.status = copy.status === 'off_shelf' ? 'off_shelf' : 'on_shelf';
    }
    copy.scheduleOnAt = copy.scheduleOnAt ? String(copy.scheduleOnAt) : '';
    copy.scheduleOffAt = copy.scheduleOffAt ? String(copy.scheduleOffAt) : '';
    copy.category = copy.category || '';
    copy.name = copy.name || '';
    copy.code = String(copy.code || copy.goodsId || '').trim();
    /* goodsId 与商品编码等同，作为与选品库的唯一关联键 */
    copy.goodsId = copy.code;
    copy.img = copy.img || '../user-app/assets/restock/product-leaf.svg';
    copy.deliveryMode = normalizeDeliveryMode(copy.deliveryMode);
    copy.saleScope = normalizeSaleScope(copy.saleScope);
    copy.saleRegions = copy.saleRegions && typeof copy.saleRegions === 'object' ? copy.saleRegions : {};
    copy.saleRegionSummary = Array.isArray(copy.saleRegionSummary) ? copy.saleRegionSummary : [];
    copy.saleStores = copy.saleStores && typeof copy.saleStores === 'object' ? copy.saleStores : {};
    copy.salePortScope = normalizeSalePortScope(copy.salePortScope);
    copy.salePorts = normalizeSalePorts(copy.salePorts, copy.salePortScope);
    copy.images = normalizeImages(copy.images, copy.img);
    if (copy.images[0]) copy.img = copy.images[0];
    copy.detailHtml = copy.detailHtml != null ? String(copy.detailHtml) : '';
    copy.memberLevelIds = Array.isArray(copy.memberLevelIds)
      ? copy.memberLevelIds.map(function (id) { return String(id || '').trim(); }).filter(Boolean)
      : [];

    /* 限购三选一：order / day / total / none */
    var limitType = copy.limitType;
    if (limitType !== 'order' && limitType !== 'day' && limitType !== 'total' && limitType !== 'none') {
      if (copy.limitPerOrder != null) limitType = 'order';
      else if (copy.limitPerDay != null) limitType = 'day';
      else if (copy.limitTotal != null) limitType = 'total';
      else limitType = 'none';
    }
    copy.limitType = limitType;
    copy.limitPerOrder = limitType === 'order' ? parseOptionalLimit(copy.limitPerOrder) : null;
    copy.limitPerDay = limitType === 'day' ? parseOptionalLimit(copy.limitPerDay) : null;
    copy.limitTotal = limitType === 'total' ? parseOptionalLimit(copy.limitTotal) : null;

    var specs = Array.isArray(copy.specs) && copy.specs.length
      ? copy.specs
      : [{
          skuCode: copy.code + '-01',
          specName: '默认',
          purchasePrice: Number(copy.purchasePrice) || 0,
          stock: Number(copy.stock) || 0,
          exchangeEnabled: true,
          exchangeType: copy.exchangeType || 'points',
          points: Number(copy.points) || 100,
          money: Number(copy.money) || 0,
          exchangedQty: Number(copy.exchangedQty || copy.exchangeQty) || 0
        }];

    /* 兼容旧数据：若无 exchangeEnabled，视为全部开启 */
    var hasEnabledFlag = specs.some(function (s) { return Object.prototype.hasOwnProperty.call(s || {}, 'exchangeEnabled'); });
    var productType = copy.exchangeType === 'points_money' || copy.exchangeType === 'points'
      ? copy.exchangeType
      : null;
    if (!productType) {
      var firstTyped = null;
      for (var ti = 0; ti < specs.length; ti++) {
        if (specs[ti] && specs[ti].exchangeType) {
          firstTyped = specs[ti];
          break;
        }
      }
      productType = firstTyped && firstTyped.exchangeType === 'points_money' ? 'points_money' : 'points';
    }

    copy.specs = specs.map(function (s, i) {
      var next = Object.assign({}, s);
      if (!hasEnabledFlag) next.exchangeEnabled = true;
      return normalizeSpec(next, i, copy.code, productType);
    });

    var enabled = copy.specs.filter(function (s) { return s.exchangeEnabled; });
    var first = enabled[0] || copy.specs[0];
    /* 兑换方式在商品维度统一，多规格保持一致 */
    copy.exchangeType = productType;
    copy.points = first ? first.points : 0;
    copy.money = productType === 'points_money' && first ? first.money : 0;
    copy.purchasePrice = first ? first.purchasePrice : 0;
    copy.stock = copy.specs.reduce(function (sum, s) { return sum + s.stock; }, 0);
    copy.exchangedQty = enabled.reduce(function (sum, s) { return sum + s.exchangedQty; }, 0);
    copy.specCount = copy.specs.length;
    copy.enabledSpecCount = enabled.length;

    /* 供应商：优先已存字段，否则回落选品库 */
    var catalogSupplier = '';
    if (window.MdmProductCatalog && copy.code && typeof window.MdmProductCatalog.getByCode === 'function') {
      var cat = window.MdmProductCatalog.getByCode(copy.code);
      if (cat && cat.supplierId) catalogSupplier = String(cat.supplierId);
    }
    copy.supplierId = String(copy.supplierId || catalogSupplier || '斯斯供应商商家').trim();
    copy.supplierName = String(copy.supplierName || copy.supplierId).trim();
    return copy;
  }

  /** C/B 端列表展示态：定时上下架按当前时间推算是否在架 */
  function isOnShelfDisplay(item) {
    if (!item) return false;
    if (item.status === 'on_shelf') return true;
    if (item.status === 'off_shelf') return false;
    if (item.status === 'schedule') {
      var now = Date.now();
      var onMs = item.scheduleOnAt ? Date.parse(String(item.scheduleOnAt).replace(' ', 'T')) : NaN;
      var offMs = item.scheduleOffAt ? Date.parse(String(item.scheduleOffAt).replace(' ', 'T')) : NaN;
      if (!isNaN(onMs) && !isNaN(offMs) && now >= onMs && now < offMs) return true;
      return false;
    }
    return false;
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* ignore */
    }
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.map(normalizeItem);
          loaded = true;
          return;
        }
      }
    } catch (e) {
      /* ignore */
    }
    list = SEED.map(normalizeItem);
    loaded = true;
    persist();
  }

  function ensureLoaded() {
    if (!loaded) load();
  }

  function getAll() {
    ensureLoaded();
    return list.map(function (item) {
      return Object.assign({}, item, {
        specs: item.specs.map(function (s) { return Object.assign({}, s); })
      });
    });
  }

  function getByCode(code) {
    ensureLoaded();
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === code) {
        return Object.assign({}, list[i], {
          specs: list[i].specs.map(function (s) { return Object.assign({}, s); })
        });
      }
    }
    return null;
  }

  function getAddedCodesMap() {
    var map = {};
    getAll().forEach(function (item) {
      map[item.code] = true;
    });
    return map;
  }

  function upsert(item) {
    ensureLoaded();
    var next = normalizeItem(item);
    if (!next.code) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === next.code || list[i].goodsId === next.code) {
        list[i] = next;
        persist();
        return list[i];
      }
    }
    list.unshift(next);
    persist();
    return next;
  }

  function addMany(items) {
    var count = 0;
    (items || []).forEach(function (item) {
      if (!item || !(item.code || item.goodsId)) return;
      var code = String(item.code || item.goodsId).trim();
      if (!code || getByCode(code)) return;
      if (upsert(item)) count += 1;
    });
    return count;
  }

  function update(code, patch) {
    ensureLoaded();
    for (var i = 0; i < list.length; i++) {
      if (list[i].code !== code) continue;
      list[i] = normalizeItem(Object.assign({}, list[i], patch));
      persist();
      return list[i];
    }
    return null;
  }

  function remove(code) {
    ensureLoaded();
    var before = list.length;
    list = list.filter(function (item) { return item.code !== code; });
    if (list.length !== before) persist();
    return before !== list.length;
  }

  function catalogSpecsFromProduct(src) {
    var catalogSpecs = Array.isArray(src.specs) && src.specs.length ? src.specs : null;
    var code = src.code || 'SPU';
    if (catalogSpecs) {
      return catalogSpecs.map(function (s, i) {
        var specName = s.specName || '';
        if (!specName) {
          if (s.packaging && s.flavor) specName = s.packaging + ' / ' + s.flavor;
          else specName = s.flavor || s.packaging || ('规格' + (i + 1));
        }
        var skuCode = s.skuCode && !/^SKU00\d+$/i.test(String(s.skuCode))
          ? String(s.skuCode)
          : (code + '-' + String(i + 1).padStart(2, '0'));
        return {
          skuCode: skuCode,
          specName: specName,
          skuImg: s.skuImg || s.specImg || src.img || '',
          purchasePrice: Number(s.price != null ? s.price : (s.purchasePrice != null ? s.purchasePrice : src.price)) || 0,
          stock: s.stock != null ? Number(s.stock) : (50 + i * 10)
        };
      });
    }
    return [{
      skuCode: code + '-01',
      specName: '默认',
      skuImg: src.img || '',
      purchasePrice: Number(src.price) || 0,
      stock: 100
    }];
  }

  /** 从选品库商品构建积分商城条目（只读选品库，默认仅开启第一个规格）
   *  以勾选快照的 code/name/img/category/price 为准；code=goodsId 作为唯一关联
   */
  function buildFromCatalogProduct(product, defaults) {
    defaults = defaults || {};
    var picked = Object.assign({}, product || {});
    delete picked._pickId;

    var code = String(picked.code || picked.goodsId || '').trim();
    if (!code) return null;

    /* 只读取规格详情，不写回选品库；名称等展示字段以勾选快照为准 */
    var detail = null;
    if (window.MdmProductCatalog && typeof window.MdmProductCatalog.getByCode === 'function') {
      detail = window.MdmProductCatalog.getByCode(code);
    }

    var src = Object.assign({}, detail || {}, {
      code: code,
      goodsId: code,
      name: picked.name || (detail && detail.name) || '',
      img: picked.img || (detail && detail.img),
      category: picked.category != null && picked.category !== ''
        ? picked.category
        : ((detail && detail.category) || ''),
      price: picked.price != null ? picked.price : (detail && detail.price),
      specs: (detail && detail.specs && detail.specs.length)
        ? detail.specs
        : (picked.specs || [])
    });

    var baseSpecs = catalogSpecsFromProduct(src);
    var exchangeType = defaults.exchangeType === 'points_money' ? 'points_money' : 'points';

    var specs = baseSpecs.map(function (s, i) {
      var enabled = i === 0;
      return {
        skuCode: s.skuCode,
        specName: s.specName,
        skuImg: s.skuImg || src.img || '',
        purchasePrice: s.purchasePrice,
        stock: s.stock,
        minSaleQty: 1,
        exchangeEnabled: enabled,
        exchangeType: exchangeType,
        points: enabled ? (Number(defaults.points) || 100) : 0,
        money: enabled && exchangeType === 'points_money' ? (Number(defaults.money) || 0) : 0,
        exchangedQty: 0
      };
    });

    return {
      code: code,
      goodsId: code,
      name: src.name,
      img: src.img,
      category: src.category || '',
      status: defaults.status || 'off_shelf',
      scheduleOnAt: defaults.scheduleOnAt || '',
      scheduleOffAt: defaults.scheduleOffAt || '',
      deliveryMode: normalizeDeliveryMode(defaults.deliveryMode || 'platform'),
      supplierId: src.supplierId || defaults.supplierId || '斯斯供应商商家',
      supplierName: src.supplierName || src.supplierId || defaults.supplierName || '斯斯供应商商家',
      saleScope: normalizeSaleScope(defaults.saleScope || 'all'),
      saleRegions: defaults.saleRegions && typeof defaults.saleRegions === 'object' ? defaults.saleRegions : {},
      saleRegionSummary: Array.isArray(defaults.saleRegionSummary) ? defaults.saleRegionSummary : [],
      saleStores: defaults.saleStores && typeof defaults.saleStores === 'object' ? defaults.saleStores : {},
      salePortScope: normalizeSalePortScope(defaults.salePortScope || 'all'),
      salePorts: normalizeSalePorts(defaults.salePorts, defaults.salePortScope || 'all'),
      images: normalizeImages(defaults.images, src.img),
      detailHtml: defaults.detailHtml != null ? String(defaults.detailHtml) : '',
      exchangeType: exchangeType,
      memberLevelIds: Array.isArray(defaults.memberLevelIds) ? defaults.memberLevelIds.slice() : [],
      limitType: defaults.limitType || 'none',
      limitPerOrder: parseOptionalLimit(defaults.limitPerOrder),
      limitPerDay: parseOptionalLimit(defaults.limitPerDay),
      limitTotal: parseOptionalLimit(defaults.limitTotal),
      specs: specs
    };
  }

  /** 编辑时合并选品库全部规格 + 已保存兑换配置（规格总数以选品库为准） */
  function mergeWithCatalogSpecs(mallItem) {
    var item = mallItem || {};
    var detail = window.MdmProductCatalog && item.code
      ? window.MdmProductCatalog.getByCode(item.code)
      : null;
    var catalogSpecs = catalogSpecsFromProduct(detail || item);
    var savedList = item.specs || [];
    var savedMap = {};
    savedList.forEach(function (s) {
      if (s && s.skuCode) savedMap[s.skuCode] = s;
    });
    var productType = item.exchangeType === 'points_money' ? 'points_money' : 'points';

    var specs = catalogSpecs.map(function (cs, i) {
      var saved = savedMap[cs.skuCode] || savedList[i] || null;
      if (saved) {
        return normalizeSpec(Object.assign({}, saved, {
          skuCode: cs.skuCode,
          specName: cs.specName,
          purchasePrice: cs.purchasePrice,
          skuImg: saved.skuImg || cs.skuImg || '',
          /* 库存以积分商城已保存值为准（可编辑），无则回落选品库 */
          stock: saved.stock != null ? saved.stock : cs.stock
        }), i, item.code, productType);
      }
      return normalizeSpec({
        skuCode: cs.skuCode,
        specName: cs.specName,
        skuImg: cs.skuImg || '',
        purchasePrice: cs.purchasePrice,
        stock: cs.stock,
        minSaleQty: 1,
        exchangeEnabled: false,
        exchangeType: productType,
        points: 100,
        money: 0,
        exchangedQty: 0
      }, i, item.code, productType);
    });

    return Object.assign({}, item, {
      exchangeType: productType,
      specs: specs
    });
  }

  window.MdmPointsMallStore = {
    getAll: getAll,
    getByCode: getByCode,
    getAddedCodesMap: getAddedCodesMap,
    upsert: upsert,
    addMany: addMany,
    update: update,
    remove: remove,
    buildFromCatalogProduct: buildFromCatalogProduct,
    mergeWithCatalogSpecs: mergeWithCatalogSpecs,
    isOnShelfDisplay: isOnShelfDisplay,
    reload: load
  };

  load();
})();
