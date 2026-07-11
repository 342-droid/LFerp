(function (global) {
  var PRODUCT_CATALOG = {
    'eggplant-long-10': {
      spuId: 'eggplant-long',
      title: '长茄子 广茄',
      subtitle: '新鲜直采 · 净菜优选 · 适合快炒与炖煮',
      imgs: ['../assets/restock/product-eggplant-long.svg'],
      priceNum: 40,
      originPrice: 45,
      promo: true,
      coupons: ['满99减10', '进货券-5元'],
      serviceTags: ['品质保障', '坏损包赔', '专票支持'],
      delivery: '预计明日 09:00-12:00 送达门店',
      warehouse: '杭州萧山仓',
      supplier: { id: 'supplier-jiangnan', name: '江南果蔬批发', meta: '4.9分 · 月销1280单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品牌', value: '产地直供' },
        { label: '产地', value: '山东寿光' },
        { label: '规格', value: '10斤/箱' },
        { label: '保质期', value: '3天' },
        { label: '储存方式', value: '0-4℃冷藏' },
        { label: '包装', value: '周转筐装' }
      ],
      specs: [
        { id: 'eggplant-long-5', label: '5斤', priceNum: 21, available: false },
        { id: 'eggplant-long-10', label: '10斤', priceNum: 40, available: true },
        { id: 'eggplant-long-20', label: '20斤', priceNum: 78, available: true }
      ],
      detailImgs: ['../assets/restock/product-eggplant-long.svg'],
      story: [
        { title: '产地故事', text: '精选山东寿光产区长茄子，果形顺直、肉质细嫩，适合门店日常快炒与炖煮菜品。' },
        { title: '储存建议', text: '建议0-4℃冷藏保存，到店后请尽快入库，避免阳光直射。' }
      ],
      bundle: ['tomato-1', 'leaf-y1-10'],
      recommend: ['egg', 'cola', 'leaf-y1-10']
    },
    'leaf-c1': {
      spuId: 'leaf-c1',
      title: '小香芹 优质 带叶',
      subtitle: '优质 | 小香芹 | 带根 | 瑕疵率<5%',
      imgs: ['../assets/restock/product-leaf.svg'],
      priceNum: 28,
      originPrice: 0,
      promo: false,
      coupons: ['满99减10'],
      serviceTags: ['品质保障', '坏损包赔'],
      delivery: '预计明日 11:00-14:00 送达门店',
      warehouse: '鲜丰杭州仓',
      supplier: { id: 'supplier-xianfeng', name: '鲜丰蔬菜批发', meta: '4.8分 · 月销860单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品类', value: '小香芹' },
        { label: '等级', value: '优质' },
        { label: '形态', value: '带叶带根' },
        { label: '瑕疵率', value: '<5%' },
        { label: '储存方式', value: '0-4℃冷藏' },
        { label: '包装', value: '保鲜膜+箱装' }
      ],
      specs: [
        {
          id: 'leaf-c1-5',
          label: '5斤',
          name: '小香芹 5斤/份',
          priceNum: 28,
          tierHint: '5斤及以上：¥28.00/份',
          unitLabel: '/份',
          available: true
        },
        {
          id: 'leaf-c1-10',
          label: '10斤',
          name: '小香芹 10斤/份',
          priceNum: 54,
          tierHint: '10斤及以上：¥54.00/份',
          unitLabel: '/份',
          available: true
        }
      ],
      detailImgs: ['../assets/restock/product-leaf.svg'],
      story: [{ title: '商品说明', text: '叶柄脆嫩、芹香浓郁，适合清炒、凉拌及馅料加工，到店后请尽快冷藏保存。' }],
      recommend: ['leaf-y1-10', 'tomato-1', 'egg']
    },
    'leaf-y1-10': {
      spuId: 'leaf-y1',
      title: '油麦菜【菜鲜】',
      subtitle: '优质叶菜 · 20-30cm · 瑕疵率<5%',
      imgs: ['../assets/restock/product-leaf.svg'],
      priceNum: 30,
      originPrice: 35,
      promo: false,
      coupons: ['满99减10'],
      serviceTags: ['品质保障', '坏损包赔'],
      delivery: '预计明日 11:00-14:00 送达门店',
      warehouse: '鲜丰杭州仓',
      supplier: { id: 'supplier-xianfeng', name: '鲜丰蔬菜批发', meta: '4.8分 · 月销860单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品牌', value: '菜鲜' },
        { label: '产地', value: '本地基地' },
        { label: '规格', value: '10斤/捆' },
        { label: '保质期', value: '2天' },
        { label: '储存方式', value: '0-4℃冷藏' },
        { label: '包装', value: '保鲜膜+箱装' }
      ],
      specs: [
        { id: 'leaf-y1-5', label: '5斤', priceNum: 16, available: false },
        { id: 'leaf-y1-10', label: '10斤', priceNum: 30, available: true },
        { id: 'leaf-y1-20', label: '20斤', priceNum: 58, available: true }
      ],
      detailImgs: ['../assets/restock/product-leaf.svg'],
      story: [{ title: '商品说明', text: '叶片鲜绿、梗部脆嫩，适合沙拉、清炒及火锅配菜。' }],
      bundle: ['eggplant-long-10'],
      recommend: ['tomato-1', 'egg']
    },
    cola: {
      spuId: 'cola',
      title: '[可口可乐]摩登罐汽水330ml',
      subtitle: '24罐整箱 · 常温配送',
      imgs: ['../assets/restock/product-cola.svg'],
      priceNum: 52,
      originPrice: 58,
      promo: true,
      coupons: ['满199减20'],
      serviceTags: ['品质保障', '专票支持'],
      delivery: '预计后日 14:00-18:00 送达门店',
      warehouse: '冷丰中央仓',
      supplier: { id: 'supplier-lengfeng', name: '冷丰优选供应链', meta: '4.9分 · 月销2100单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品牌', value: '可口可乐' },
        { label: '规格', value: '330ml×24罐' },
        { label: '保质期', value: '12个月' },
        { label: '储存方式', value: '常温避光' },
        { label: '包装', value: '纸箱' }
      ],
      specs: [{ id: 'cola', label: '24罐', priceNum: 52, available: true }],
      detailImgs: ['../assets/restock/product-cola.svg'],
      story: [{ title: '商品说明', text: '摩登罐经典口味，适合便利店、超市冷藏陈列。' }],
      bundle: ['water', 'tea'],
      recommend: ['egg', 'leaf-y1-10']
    },
    egg: {
      spuId: 'egg',
      title: '红壳黄心鲜鸡蛋 中码 托装',
      subtitle: '净重3.5斤 · 30枚/托',
      imgs: ['../assets/restock/product-egg.svg'],
      priceNum: 28.9,
      originPrice: 32,
      promo: false,
      coupons: ['满99减10'],
      serviceTags: ['品质保障', '坏损包赔'],
      delivery: '预计明日 08:00-11:00 送达门店',
      warehouse: '华东冷链仓',
      supplier: { id: 'supplier-huadong', name: '华东冷链供应商', meta: '4.7分 · 月销560单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品牌', value: '产地直供' },
        { label: '规格', value: '3.5斤/30枚' },
        { label: '保质期', value: '15天' },
        { label: '储存方式', value: '0-4℃冷藏' },
        { label: '包装', value: '托装+薄膜' }
      ],
      specs: [{ id: 'egg', label: '3.5斤/30枚', priceNum: 28.9, available: true }],
      detailImgs: ['../assets/restock/product-egg.svg'],
      story: [{ title: '商品说明', text: '蛋黄饱满、蛋壳完整率高，适合烘焙与日常零售。' }],
      bundle: ['leaf-y1-10'],
      recommend: ['cola', 'tomato-1']
    },
    water: {
      spuId: 'water',
      title: '[娃哈哈]纯净水596ml',
      subtitle: '24瓶整箱 · 常温配送',
      imgs: ['../assets/restock/product-water.svg'],
      priceNum: 36,
      originPrice: 40,
      promo: false,
      coupons: ['满199减20'],
      serviceTags: ['品质保障', '专票支持'],
      delivery: '预计后日 14:00-18:00 送达门店',
      warehouse: '冷丰中央仓',
      supplier: { id: 'supplier-lengfeng', name: '冷丰优选供应链', meta: '4.9分 · 月销2100单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品牌', value: '娃哈哈' },
        { label: '规格', value: '596ml×24瓶' },
        { label: '保质期', value: '12个月' },
        { label: '储存方式', value: '常温避光' },
        { label: '包装', value: '纸箱' }
      ],
      specs: [{ id: 'water', label: '24瓶', priceNum: 36, available: true }],
      detailImgs: ['../assets/restock/product-water.svg'],
      story: [{ title: '商品说明', text: '596ml 家庭装纯净水，适合便利店、超市常温陈列。' }],
      bundle: ['cola', 'tea'],
      recommend: ['egg', 'leaf-y1-10']
    },
    tea: {
      spuId: 'tea',
      title: '[康师傅]冰红茶500ml',
      subtitle: '15瓶整箱 · 常温配送',
      imgs: ['../assets/restock/product-tea.svg'],
      priceNum: 42,
      originPrice: 46,
      promo: true,
      coupons: ['满199减20'],
      serviceTags: ['品质保障', '专票支持'],
      delivery: '预计后日 14:00-18:00 送达门店',
      warehouse: '冷丰中央仓',
      supplier: { id: 'supplier-lengfeng', name: '冷丰优选供应链', meta: '4.9分 · 月销2100单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '品牌', value: '康师傅' },
        { label: '规格', value: '500ml×15瓶' },
        { label: '保质期', value: '12个月' },
        { label: '储存方式', value: '常温避光' },
        { label: '包装', value: '纸箱' }
      ],
      specs: [{ id: 'tea', label: '15瓶', priceNum: 42, available: true }],
      detailImgs: ['../assets/restock/product-tea.svg'],
      story: [{ title: '商品说明', text: '经典冰红茶口味，适合餐饮门店与零售补货。' }],
      bundle: ['cola', 'water'],
      recommend: ['egg', 'tomato-1']
    },
    'tomato-1': {
      spuId: 'tomato',
      title: '普罗旺斯西红柿',
      subtitle: '沙瓤多汁 · 5斤/箱',
      imgs: ['../assets/restock/product-tomato.svg'],
      priceNum: 29,
      originPrice: 33,
      promo: false,
      coupons: ['满99减10'],
      serviceTags: ['品质保障', '坏损包赔'],
      delivery: '预计明日 11:00-14:00 送达门店',
      warehouse: '杭州余杭仓',
      supplier: { id: 'supplier-jiangnan', name: '江南果蔬批发', meta: '4.9分 · 月销1280单', avatar: '../assets/restock/me-shop-avatar.svg' },
      params: [
        { label: '产地', value: '新疆' },
        { label: '规格', value: '5斤/箱' },
        { label: '保质期', value: '5天' },
        { label: '储存方式', value: '常温通风' }
      ],
      specs: [{ id: 'tomato-1', label: '5斤', priceNum: 29, available: true }],
      detailImgs: ['../assets/restock/product-tomato.svg'],
      story: [{ title: '商品说明', text: '果形圆润、酸甜适中，适合生食与烹饪。' }],
      bundle: ['eggplant-long-10'],
      recommend: ['leaf-y1-10', 'egg']
    }
  };

  function cloneProduct(product) {
    return JSON.parse(JSON.stringify(product));
  }

  function resolveProduct(id) {
    if (id && PRODUCT_CATALOG[id]) return cloneProduct(PRODUCT_CATALOG[id]);
    var keys = Object.keys(PRODUCT_CATALOG);
    for (var i = 0; i < keys.length; i++) {
      var p = PRODUCT_CATALOG[keys[i]];
      if (p.spuId === id) return cloneProduct(p);
      if ((p.specs || []).some(function (s) { return s.id === id; })) {
        return cloneProduct(p);
      }
    }
    return cloneProduct(PRODUCT_CATALOG['leaf-c1']);
  }

  function formatPriceFixed(num) {
    return '¥' + Number(num).toFixed(2);
  }

  function getAvailableSpecs(p) {
    return (p.specs || []).filter(function (s) { return s.available !== false; });
  }

  function getSpecDisplayName(p, spec) {
    return spec.name || p.title + ' ' + spec.label + (spec.unitLabel || '/份');
  }

  function getSpecTierHint(spec) {
    if (spec.tierHint) return spec.tierHint;
    return spec.label + '及以上：' + formatPriceFixed(spec.priceNum) + (spec.unitLabel || '/份');
  }

  function getSpecUnitPriceText(spec) {
    return formatPriceFixed(spec.priceNum) + (spec.unitLabel || '/份');
  }

  function getPriceRangeText(p) {
    var specs = getAvailableSpecs(p);
    if (!specs.length) return formatPriceFixed(p.priceNum || 0);
    if (specs.length === 1) {
      var single = specs[0].priceNum;
      return '¥' + (single % 1 === 0 ? single.toFixed(0) : single.toFixed(2));
    }
    var nums = specs.map(function (s) { return s.priceNum; });
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    function fmt(n) {
      return '¥' + (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2));
    }
    return fmt(min) + ' - ' + fmt(max);
  }

  function isMultiSpecProduct(id) {
    var p = resolveProduct(id);
    return !!(p && p.specs && p.specs.length > 1);
  }

  global.UAProductCatalog = {
    PRODUCT_CATALOG: PRODUCT_CATALOG,
    resolveProduct: resolveProduct,
    formatPriceFixed: formatPriceFixed,
    getAvailableSpecs: getAvailableSpecs,
    getSpecDisplayName: getSpecDisplayName,
    getSpecTierHint: getSpecTierHint,
    getSpecUnitPriceText: getSpecUnitPriceText,
    getPriceRangeText: getPriceRangeText,
    isMultiSpecProduct: isMultiSpecProduct
  };
})(typeof window !== 'undefined' ? window : this);
