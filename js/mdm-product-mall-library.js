/**
 * 商城商品库 — 从商品库添加抽屉专用数据源（175 件演示数据）
 */
(function () {
  var ASSET = '../user-app/assets/restock/';
  var IMGS = [
    ASSET + 'product-leaf.svg',
    ASSET + 'product-egg.svg',
    ASSET + 'product-tomato.svg',
    ASSET + 'product-cola.svg',
    ASSET + 'product-water.svg',
    ASSET + 'product-tea.svg',
    ASSET + 'product-eggplant-round.svg',
    ASSET + 'product-eggplant-long.svg',
    ASSET + 'product-root.svg',
    ASSET + 'category-icon-veg.svg',
    ASSET + 'category-icon-meat.svg',
    ASSET + 'category-icon-grain.svg',
    ASSET + 'category-icon-drink.svg'
  ];

  var CATEGORY_PLAN = [
    { name: '新鲜蔬菜', count: 21 },
    { name: '时令水果', count: 26 },
    { name: '粮油调味', count: 13 },
    { name: '烘焙原料', count: 0 },
    { name: '肉禽蛋品', count: 29 },
    { name: '休闲零食', count: 20 },
    { name: '酒水饮料', count: 6 },
    { name: '个护家清', count: 10 },
    { name: '餐饮用品', count: 18 },
    { name: '其他', count: 32 }
  ];

  var FEATURED_ORDER = [
    'SPU00113', 'SPU00112', 'SPU00103', 'SPU00106', 'SPU00107', 'SPU00102',
    'SPU00101', 'SPU00098', 'SPU00090', 'SPU00088', 'SPU00085', 'SPU00082', 'SPU00078', 'SPU00067', 'SPU00064'
  ];

  var FEATURED = [
    { code: 'SPU00113', name: '榴莲', category: '时令水果', img: ASSET + 'category-icon-veg.svg' },
    { code: 'SPU00112', name: '辣椒-ss', category: '新鲜蔬菜', img: ASSET + 'product-tomato.svg' },
    { code: 'SPU00103', name: 'ss积分加现金', category: '新鲜蔬菜', img: ASSET + 'product-leaf.svg' },
    { code: 'SPU00106', name: 'ss🤔', category: '新鲜蔬菜', img: ASSET + 'product-leaf.svg' },
    { code: 'SPU00107', name: 'ss的测试商品', category: '新鲜蔬菜', img: ASSET + 'product-leaf.svg' },
    { code: 'SPU00102', name: 'ss苏打水商品', category: '酒水饮料', img: ASSET + 'product-water.svg' },
    { code: 'SPU00101', name: '豌豆', category: '新鲜蔬菜', img: ASSET + 'product-egg.svg' },
    { code: 'SPU00098', name: '茶叶', category: '休闲零食', img: ASSET + 'product-tea.svg' },
    { code: 'SPU00090', name: '东北大米 5kg', category: '粮油调味', img: ASSET + 'category-icon-grain.svg' },
    { code: 'SPU00088', name: '红壳黄心鲜鸡蛋', category: '肉禽蛋品', img: ASSET + 'product-egg.svg' },
    { code: 'SPU00085', name: '圆茄 优质', category: '新鲜蔬菜', img: ASSET + 'product-eggplant-round.svg' },
    { code: 'SPU00082', name: '可口可乐摩登罐', category: '酒水饮料', img: ASSET + 'product-cola.svg' },
    { code: 'SPU00078', name: '长茄子 广茄', category: '新鲜蔬菜', img: ASSET + 'product-eggplant-long.svg' },
    { code: 'SPU00067', name: '测试', category: '其他', img: ASSET + 'product-tomato.svg' },
    { code: 'SPU00064', name: 'ss紫薯', category: '新鲜蔬菜', img: ASSET + 'product-root.svg' }
  ];

  var EXTRA_NAMES = [
    '精品西红柿', '本地生菜', '鲜鸡蛋托装', '娃哈哈纯净水', '康师傅冰红茶', '黄心土豆', '冷鲜牛腩', '鲜香菇',
    '普罗旺斯番茄', '山东大葱', '进口车厘子', '赣南脐橙', '海南芒果', '新疆哈密瓜', '彩虹糖', '芒果干', '爆米花',
    '每日坚果', '午餐肉罐头', '抽取式面巾纸', '商用垃圾袋', '一次性餐盒', '烘焙面粉', '黄油块', '酵母粉'
  ];

  var library = [];

  function normalizeProduct(raw) {
    return {
      code: raw.code,
      name: raw.name,
      category: raw.category || '其他',
      img: raw.img || IMGS[0],
      price: raw.price != null ? raw.price : 10,
      onSale: true,
      productType: 'physical'
    };
  }

  function featuredByCategory() {
    var map = {};
    FEATURED.forEach(function (item) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }

  function buildLibrarySeed() {
    var list = [];
    var usedCodes = {};
    var featuredMap = featuredByCategory();
    var seq = 0;

    CATEGORY_PLAN.forEach(function (plan) {
      var featured = (featuredMap[plan.name] || []).slice();
      var i = 0;
      while (i < plan.count) {
        var raw = null;
        if (featured.length) {
          raw = featured.shift();
        } else {
          var num = 300 - seq;
          var code = 'SPU' + String(num).padStart(5, '0');
          while (usedCodes[code]) {
            num -= 1;
            code = 'SPU' + String(num).padStart(5, '0');
          }
          raw = {
            code: code,
            name: EXTRA_NAMES[seq % EXTRA_NAMES.length] + (seq > 24 ? ' ' + seq : ''),
            category: plan.name,
            img: IMGS[seq % IMGS.length]
          };
          seq += 1;
        }
        if (usedCodes[raw.code]) continue;
        usedCodes[raw.code] = true;
        list.push(normalizeProduct(raw));
        i += 1;
      }
    });

    return list;
  }

  function sortFeaturedFirst(list) {
    var orderMap = {};
    FEATURED_ORDER.forEach(function (code, idx) {
      orderMap[code] = idx;
    });
    return list.slice().sort(function (a, b) {
      var ai = orderMap[a.code];
      var bi = orderMap[b.code];
      if (ai != null && bi != null) return ai - bi;
      if (ai != null) return -1;
      if (bi != null) return 1;
      return 0;
    });
  }

  function ensureLibrary() {
    if (!library.length) {
      library = buildLibrarySeed();
    }
    return library;
  }

  function getCategories() {
    var list = ensureLibrary();
    return [{ name: '全部', count: list.length }].concat(
      CATEGORY_PLAN.map(function (plan) {
        var count = 0;
        list.forEach(function (item) {
          if (item.category === plan.name) count += 1;
        });
        return { name: plan.name, count: count };
      })
    );
  }

  function getProducts(options) {
    options = options || {};
    var list = ensureLibrary().slice();
    if (options.category && options.category !== 'all') {
      list = list.filter(function (item) { return item.category === options.category; });
    }
    if (options.keyword) {
      var q = options.keyword.toLowerCase();
      list = list.filter(function (item) {
        return item.name.indexOf(options.keyword) >= 0 || item.code.toLowerCase().indexOf(q) >= 0;
      });
    }
    return sortFeaturedFirst(list);
  }

  window.MdmMallProductLibrary = {
    getProducts: getProducts,
    getCategories: getCategories,
    getAll: ensureLibrary,
    reload: function () {
      library = buildLibrarySeed();
      return library;
    }
  };

  ensureLibrary();
})();
