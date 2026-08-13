/**
 * 选品库商品目录（演示数据 + sessionStorage 持久化）
 *
 * 说明：本 store 是商品原始主数据。营销-积分商城通过商品编码(code/goodsId)
 * 只读引用本库商品，叠加积分属性后落入独立商品池，不会回写本库。
 */
(function () {
  var STORAGE_KEY = 'mdm_product_catalog_v5';

  var SEED = [
    { code: 'SPU00103', name: 'ss积分加现金', price: 10, channel: '电商直播、代采', saleChannels: ['live', 'proxy'], category: '新鲜蔬菜', status: 'selling', audit: 'passed', img: '../user-app/assets/restock/product-leaf.svg' },
    { code: 'SPU00102', name: 'ss苏打水商品', price: 0.12, channel: '电商直播', category: '时令水果', status: 'pending_sale', audit: 'pending', img: '../user-app/assets/restock/product-water.svg' },
    { code: 'SPU00101', name: '豌豆', price: 0.01, channel: '电商直播', category: '新鲜蔬菜', status: 'pending_sale', audit: 'pending', img: '../user-app/assets/restock/product-egg.svg' },
    { code: 'SPU00098', name: '茶叶', price: 10, channel: '电商直播', category: '新鲜蔬菜', status: 'pending_sale', audit: 'rejected', rejectReason: '商品主图不清晰，请重新上传符合规范的图片', img: '../user-app/assets/restock/product-tea.svg' },
    { code: 'SPU00090', name: '东北大米 5kg', price: 32, channel: '电商直播', category: '粮油调味', status: 'selling', audit: 'passed', img: '../user-app/assets/restock/category-icon-grain.svg' },
    { code: 'SPU00088', name: '红壳黄心鲜鸡蛋', price: 28.9, channel: '电商直播', category: '肉禽蛋品', status: 'stopped', audit: 'passed', img: '../user-app/assets/restock/product-egg.svg' },
    { code: 'SPU00085', name: '圆茄 优质', price: 3.5, channel: '电商直播', category: '新鲜蔬菜', status: 'selling', audit: 'passed', img: '../user-app/assets/restock/product-eggplant-round.svg' },
    { code: 'SPU00082', name: '可口可乐摩登罐', price: 52, channel: '电商直播', category: '酒水饮料', status: 'pending_sale', audit: 'pending', img: '../user-app/assets/restock/product-cola.svg' },
    { code: 'SPU00080', name: '油麦菜【菜鲜】', price: 3.2, channel: '电商直播', category: '新鲜蔬菜', status: 'stopped', audit: 'passed', img: '../user-app/assets/restock/product-leaf.svg' },
    { code: 'SPU00078', name: '长茄子 广茄', price: 4.2, channel: '电商直播', category: '新鲜蔬菜', status: 'selling', audit: 'passed', img: '../user-app/assets/restock/product-eggplant-long.svg' },
    { code: 'SPU00106', name: 'ss🤔', price: 10, channel: '代采', category: '新鲜蔬菜', status: 'pending_sale', audit: 'rejected', rejectReason: '1111', img: '../user-app/assets/restock/product-leaf.svg' }
  ];

  var IMGS = [
    '../user-app/assets/restock/product-leaf.svg',
    '../user-app/assets/restock/product-egg.svg',
    '../user-app/assets/restock/product-tomato.svg',
    '../user-app/assets/restock/product-cola.svg',
    '../user-app/assets/restock/product-water.svg',
    '../user-app/assets/restock/product-tea.svg',
    '../user-app/assets/restock/product-eggplant-round.svg',
    '../user-app/assets/restock/product-eggplant-long.svg',
    '../user-app/assets/restock/product-root.svg',
    '../user-app/assets/restock/category-icon-veg.svg'
  ];

  var CATEGORIES = ['新鲜蔬菜', '时令水果', '粮油调味', '肉禽蛋品', '酒水饮料'];
  var NAMES = ['精品西红柿', '本地生菜', '鲜鸡蛋托装', '娃哈哈纯净水', '康师傅冰红茶', '黄心土豆', '冷鲜牛腩', '鲜香菇', '普罗旺斯番茄', '山东大葱'];

  var catalog = [];

  function assignProductState(i) {
    if (i % 23 === 0) return { status: 'stopped', audit: 'passed' };
    if (i % 19 === 0) return { status: 'pending_sale', audit: 'rejected' };
    if (i % 17 === 0) return { status: 'pending_sale', audit: 'pending' };
    if (i % 13 === 0) return { status: 'selling', audit: 'passed' };
    if (i % 11 === 0) return { status: 'pending_sale', audit: 'rejected' };
    if (i % 7 === 0) return { status: 'pending_sale', audit: 'pending' };
    return { status: 'selling', audit: 'passed' };
  }

  function defaultRejectReason(code) {
    return '商品资料不完整，请补充商品图片、规格及详情后重新提交审核（' + code + '）';
  }

  /** 待售卖 + 待审核；审核未通过时商品状态只能是待售卖 */
  function normalizeItem(item) {
    var copy = Object.assign({}, item);
    if (copy.audit === 'rejected') {
      copy.status = 'pending_sale';
      if (!copy.rejectReason) copy.rejectReason = defaultRejectReason(copy.code || '');
    } else if (copy.status === 'pending_sale') {
      if (copy.audit === 'passed') {
        copy.status = 'selling';
      } else if (copy.audit !== 'pending') {
        copy.audit = 'pending';
      }
      delete copy.rejectReason;
    } else if (copy.audit === 'passed') {
      delete copy.rejectReason;
    }
    if (copy.status === 'selling' && !copy.audit) {
      copy.audit = 'passed';
    }
    return copy;
  }

  function normalizeCatalog(list) {
    return (list || []).map(normalizeItem);
  }

  function buildCatalogSeed() {
    var list = SEED.slice();
    var used = {};
    list.forEach(function (item) {
      if (item && item.code) used[item.code] = true;
    });
    var i = 0;
    var seq = 200;
    while (list.length < 198) {
      var seed = SEED[i % SEED.length];
      var productState = assignProductState(list.length);
      var code;
      do {
        code = 'SPU' + String(seq).padStart(5, '0');
        seq += 1;
      } while (used[code]);
      used[code] = true;
      list.push({
        code: code,
        name: NAMES[i % NAMES.length] + (list.length > 20 ? ' ' + (list.length - 9) : ''),
        price: Math.round((seed.price + (i % 5) * 0.5) * 100) / 100,
        channel: '电商直播',
        saleChannels: ['live'],
        category: CATEGORIES[i % CATEGORIES.length],
        status: productState.status,
        audit: productState.audit,
        rejectReason: productState.audit === 'rejected' ? defaultRejectReason(code) : undefined,
        img: IMGS[i % IMGS.length]
      });
      i += 1;
    }
    return list;
  }

  function hasDuplicateCodes(list) {
    var seen = {};
    for (var i = 0; i < (list || []).length; i++) {
      var code = list[i] && list[i].code;
      if (!code) continue;
      if (seen[code]) return true;
      seen[code] = true;
    }
    return false;
  }

  function channelLabelsFromValues(values) {
    var labels = [];
    (values || []).forEach(function (v) {
      if (v === 'live') labels.push('电商直播');
      else if (v === 'proxy') labels.push('代采');
    });
    return labels;
  }

  function normalizeSaleChannels(item) {
    if (Array.isArray(item.saleChannels) && item.saleChannels.length) {
      return item.saleChannels.filter(function (v) { return v === 'live' || v === 'proxy'; });
    }
    if (item.saleChannel === 'live' || item.saleChannel === 'proxy') {
      return [item.saleChannel];
    }
    var ch = item.channel || '';
    if (ch.indexOf('、') >= 0) {
      return ch.split('、').map(function (part) {
        part = part.trim();
        if (part === '代采') return 'proxy';
        if (part === '电商直播') return 'live';
        return '';
      }).filter(Boolean);
    }
    if (ch === '代采') return ['proxy'];
    if (ch === '电商直播') return ['live'];
    return ['live'];
  }

  function defaultSpecDetail(item) {
    var img = item.img || '../user-app/assets/restock/product-leaf.svg';
    var price = Number(item.price) || 9.9;
    var code = String(item.code || 'SPU');
    /* 无规格主数据时，按常见包装生成稳定多 SKU，便于积分商城完整展示 */
    var packs = ['默认', '500g', '1kg'];
    return {
      specGroups: [{ name: '包装', values: packs }],
      specs: packs.map(function (pack, i) {
        return {
          packaging: pack,
          flavor: '',
          price: String(Math.round((price + i * 0.5) * 100) / 100),
          skuCode: code + '-' + String(i + 1).padStart(2, '0'),
          barcode: '690' + String(1000000000 + i).slice(-10),
          skuImg: img,
          stock: 80 + i * 15,
          length: '',
          width: '',
          height: '',
          volume: '',
          gross: '',
          tare: '',
          net: ''
        };
      })
    };
  }

  function enrichDetail(item) {
    var saleChannels = normalizeSaleChannels(item);
    var channelLabels = channelLabelsFromValues(saleChannels);
    var fallback = defaultSpecDetail(item);
    var code = String(item.code || 'SPU');
    var specGroups = item.specGroups || fallback.specGroups;
    var specs = item.specs;
    if (!specs || !specs.length) {
      specs = fallback.specs;
    }

    /* SKU 编码稳定：按序号生成 code-01，避免 enrich 时随机码导致积分商城合并丢规格 */
    specs = (specs || []).map(function (s, i) {
      var next = Object.assign({}, s);
      if (!next.skuCode || /^SKU00\d+$/i.test(String(next.skuCode))) {
        next.skuCode = code + '-' + String(i + 1).padStart(2, '0');
      }
      if (next.stock == null && fallback.specs[i]) {
        next.stock = fallback.specs[i].stock;
      }
      return next;
    });

    return Object.assign({}, item, {
      productType: item.productType || 'physical',
      productLabel: item.productLabel || '',
      supplierId: item.supplierId || '斯斯供应商商家',
      productBrand: item.productBrand || '318583479090561000',
      purchaser: item.purchaser || 'M000047-斯斯',
      saleChannels: saleChannels,
      saleChannel: item.saleChannel || saleChannels[0] || 'live',
      channel: item.channel || channelLabels.join('、') || '电商直播',
      weighType: item.weighType || 'yes',
      baseUnit: item.baseUnit || '包',
      productWeight: item.productWeight != null ? String(item.productWeight) : '0.1',
      shelfLife: item.shelfLife != null ? String(item.shelfLife) : '365',
      tempLayer: item.tempLayer || '常温',
      specGroups: specGroups,
      specs: specs,
      detailHtml: item.detailHtml || '<p>商品详情介绍（演示）</p>'
    });
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    } catch (e) {
      /* ignore */
    }
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length && !hasDuplicateCodes(parsed)) {
          catalog = normalizeCatalog(parsed);
          persist();
          return;
        }
      }
    } catch (e) {
      /* ignore */
    }
    catalog = normalizeCatalog(buildCatalogSeed());
    persist();
  }

  function getAll() {
    if (!catalog.length) load();
    return normalizeCatalog(catalog);
  }

  /**
   * 选品库关联商品类目（主数据类目清单 + 商品上已出现的类目）
   * 供会员适用范围、营销选品等共用；id/name 均为类目名称（与商品 category 字段一致）
   */
  function getCategories() {
    var seen = {};
    var list = [];
    function pushName(name) {
      name = String(name || '').trim();
      if (!name || seen[name]) return;
      seen[name] = true;
      list.push({ id: name, name: name });
    }
    CATEGORIES.forEach(pushName);
    getAll().forEach(function (item) {
      pushName(item && item.category);
    });
    return list;
  }

  /**
   * 转为适用范围选择器商品结构：id=商品编码 code
   */
  function toScopeProduct(item) {
    var detail = enrichDetail(Object.assign({}, item || {}));
    var category = String(detail.category || '').trim();
    var skus = (detail.specs || []).map(function (s) {
      return {
        code: s.skuCode || '',
        price: Number(s.price) || Number(detail.price) || 0
      };
    });
    if (!skus.length) {
      skus = [{ code: detail.code || '', price: Number(detail.price) || 0 }];
    }
    var saleChannels = Array.isArray(detail.saleChannels) ? detail.saleChannels.slice() : [];
    return {
      id: String(detail.code || ''),
      code: String(detail.code || ''),
      name: String(detail.name || ''),
      categoryId: category,
      category: category,
      image: detail.img || '',
      status: detail.status || 'selling',
      channel: detail.channel || '',
      saleChannels: saleChannels,
      skus: skus
    };
  }

  /** 选品库商品（适用范围 / 筛选多选） */
  function getScopeProducts() {
    return getAll().map(toScopeProduct).filter(function (p) {
      return !!p.id;
    });
  }

  function getByCode(code) {
    if (!catalog.length) load();
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].code === code) return enrichDetail(Object.assign({}, catalog[i]));
    }
    return null;
  }

  function updateAudit(code, audit, rejectReason) {
    if (!catalog.length) load();
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].code !== code) continue;
      catalog[i].audit = audit;
      if (audit === 'rejected') {
        catalog[i].status = 'pending_sale';
        if (rejectReason) catalog[i].rejectReason = rejectReason;
      }
      if (audit === 'passed') {
        delete catalog[i].rejectReason;
        if (catalog[i].status === 'pending_sale') {
          catalog[i].status = 'selling';
        }
      }
      catalog[i] = normalizeItem(catalog[i]);
      persist();
      return catalog[i];
    }
    return null;
  }

  function addProduct(product) {
    if (!catalog.length) load();
    catalog.unshift(product);
    persist();
    return product;
  }

  function updateProduct(code, patch) {
    if (!catalog.length) load();
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].code !== code) continue;
      Object.assign(catalog[i], patch);
      catalog[i] = normalizeItem(catalog[i]);
      persist();
      return catalog[i];
    }
    return null;
  }

  function resubmitAudit(code) {
    if (!catalog.length) load();
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].code !== code) continue;
      if (catalog[i].audit !== 'rejected') return catalog[i];
      catalog[i].status = 'pending_sale';
      catalog[i].audit = 'pending';
      delete catalog[i].rejectReason;
      persist();
      return catalog[i];
    }
    return null;
  }

  window.MdmProductCatalog = {
    getAll: getAll,
    getByCode: getByCode,
    getCategories: getCategories,
    getScopeProducts: getScopeProducts,
    toScopeProduct: toScopeProduct,
    updateAudit: updateAudit,
    updateProduct: updateProduct,
    resubmitAudit: resubmitAudit,
    addProduct: addProduct,
    reload: load
  };

  load();
})();
