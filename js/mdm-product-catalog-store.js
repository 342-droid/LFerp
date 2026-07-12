/**
 * 选品库商品目录（演示数据 + sessionStorage 持久化）
 */
(function () {
  var STORAGE_KEY = 'mdm_product_catalog_v2';

  var SEED = [
    { code: 'SPU00103', name: 'ss积分加现金', price: 10, channel: '电商直播', category: '新鲜蔬菜', status: 'selling', audit: 'passed', img: '../user-app/assets/restock/product-leaf.svg' },
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
    var i = 0;
    while (list.length < 198) {
      var seed = SEED[i % SEED.length];
      var num = 100 - Math.floor(list.length / SEED.length);
      var productState = assignProductState(list.length);
      list.push({
        code: 'SPU00' + String(num).padStart(3, '0'),
        name: NAMES[i % NAMES.length] + (list.length > 20 ? ' ' + (list.length - 9) : ''),
        price: Math.round((seed.price + (i % 5) * 0.5) * 100) / 100,
        channel: '电商直播',
        category: CATEGORIES[i % CATEGORIES.length],
        status: productState.status,
        audit: productState.audit,
        rejectReason: productState.audit === 'rejected' ? defaultRejectReason('SPU00' + String(num).padStart(3, '0')) : undefined,
        img: IMGS[i % IMGS.length]
      });
      i += 1;
    }
    return list;
  }

  function defaultSpecDetail(item) {
    var img = item.img || '../user-app/assets/restock/product-leaf.svg';
    return {
      specGroups: [{ name: '口味', values: ['牛肉味'] }],
      specs: [
        {
          flavor: '牛肉味',
          price: '9.9',
          barcode: '6900000000123',
          skuImg: img,
          length: '',
          width: '',
          height: '',
          volume: '',
          gross: '',
          tare: '',
          net: ''
        }
      ]
    };
  }

  function enrichDetail(item) {
    var channelValue = item.channel === '代采' ? 'proxy' : 'live';
    var fallback = defaultSpecDetail(item);
    var specGroups = item.specGroups || fallback.specGroups;
    var specs = item.specs;
    if (!specs || !specs.length) {
      if (specGroups.length === 1 && specGroups[0].name === '口味' && specGroups[0].values && specGroups[0].values.length === 1) {
        specs = fallback.specs;
      } else {
        specs = [];
        specGroups[0].values.forEach(function (pack) {
          (specGroups[1] ? specGroups[1].values : ['']).forEach(function (flavor) {
            specs.push({
              packaging: pack,
              flavor: flavor,
              price: String(item.price || 10),
              skuCode: 'SKU00' + String(Math.floor(Math.random() * 900) + 100),
              barcode: '690' + String(Math.floor(Math.random() * 1e10)).padStart(10, '0'),
              skuImg: item.img,
              length: '',
              width: '',
              height: '',
              volume: '',
              gross: '',
              tare: '',
              net: ''
            });
          });
        });
      }
    }

    return Object.assign({}, item, {
      productType: item.productType || 'physical',
      productLabel: item.productLabel || '',
      supplierId: item.supplierId || '斯斯供应商商家',
      productBrand: item.productBrand || '318583479090561000',
      purchaser: item.purchaser || 'M000047-斯斯',
      saleChannel: item.saleChannel || channelValue,
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
        if (Array.isArray(parsed) && parsed.length) {
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
    updateAudit: updateAudit,
    updateProduct: updateProduct,
    resubmitAudit: resubmitAudit,
    addProduct: addProduct,
    reload: load
  };

  load();
})();
