(function () {
  var CART_KEY = 'ua_restock_cart_v2';
  var CART_PAGE_KEY = 'ua_restock_cart_page_v2';
  var CHECK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>';

  var B2B_SERVICES = [
    { title: '品质保障', desc: '平台严选供应商，商品入库前抽检，保障食材品质。' },
    { title: '坏损包赔', desc: '门店签收前发现质量问题，支持按平台规则申请赔付。' },
    { title: '准时送达', desc: '按约定时段配送到店，超时将优先协调补送。' },
    { title: '专票支持', desc: '支持开具电子普通发票，抬头类型为公司或个体工商户。' }
  ];

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

  var state = {
    product: null,
    specQtys: {},
    countdownEnd: 0,
    sheetIntent: 'pick'
  };

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function resolveProduct(id) {
    if (id && PRODUCT_CATALOG[id]) return JSON.parse(JSON.stringify(PRODUCT_CATALOG[id]));
    var keys = Object.keys(PRODUCT_CATALOG);
    for (var i = 0; i < keys.length; i++) {
      var p = PRODUCT_CATALOG[keys[i]];
      if (p.spuId === id) return JSON.parse(JSON.stringify(p));
      if (p.specs.some(function (s) { return s.id === id; })) {
        return JSON.parse(JSON.stringify(p));
      }
    }
    return JSON.parse(JSON.stringify(PRODUCT_CATALOG['leaf-c1']));
  }

  function formatPrice(num) {
    return '¥' + (num % 1 === 0 ? num.toFixed(0) : num.toFixed(2));
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
    if (!specs.length) return formatPrice(p.priceNum || 0);
    if (specs.length === 1) return formatPrice(specs[0].priceNum);
    var nums = specs.map(function (s) { return s.priceNum; });
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    return formatPrice(min) + ' - ' + formatPrice(max);
  }

  function initSpecQtys(reset) {
    var qtys = reset ? {} : state.specQtys || {};
    (state.product.specs || []).forEach(function (spec) {
      if (reset || qtys[spec.id] == null) qtys[spec.id] = 0;
    });
    state.specQtys = qtys;
  }

  function getSpecQty(specId) {
    return state.specQtys[specId] || 0;
  }

  function setSpecQty(specId, qty) {
    state.specQtys[specId] = Math.max(0, Math.min(999, qty));
  }

  function calcSelectedSpecs() {
    return (state.product.specs || [])
      .filter(function (spec) {
        return spec.available !== false && getSpecQty(spec.id) > 0;
      })
      .map(function (spec) {
        return { spec: spec, qty: getSpecQty(spec.id) };
      });
  }

  function calcMspecTotal() {
    var total = 0;
    calcSelectedSpecs().forEach(function (item) {
      total += item.spec.priceNum * item.qty;
    });
    return total;
  }

  function buildDetailUrl(id) {
    var p = getParams();
    var q = 'id=' + encodeURIComponent(id);
    if (p.get('from')) q += '&from=' + encodeURIComponent(p.get('from'));
    if (p.get('tab')) q += '&tab=' + encodeURIComponent(p.get('tab'));
    return 'product-detail.html?' + q;
  }

  function initProduct() {
    var id = getParams().get('id') || 'leaf-c1';
    state.product = resolveProduct(id);
    initSpecQtys(true);
    state.sheetIntent = 'pick';
    if (state.product.promo) {
      state.countdownEnd = Date.now() + 2 * 3600 * 1000;
    }
    var from = getParams().get('from') || 'restock.html';
    var tab = getParams().get('tab');
    var backHref = tab ? from + '?tab=' + tab : from;
    var back = document.getElementById('productDetailBack');
    if (back) back.setAttribute('href', backHref);
    var homeLink = document.getElementById('productDetailHomeLink');
    if (homeLink) homeLink.setAttribute('href', backHref);
    var cartLink = document.getElementById('productDetailCartLink');
    if (cartLink) cartLink.setAttribute('href', from + '?tab=cart');
  }

  function renderPage() {
    var p = state.product;
    if (!p) return;

    document.title = p.title + ' · 用户 APP';
    setText('productDetailTitle', p.title);
    setText('productDetailSubtitle', p.subtitle);
    setText('productDetailPrice', getPriceRangeText(p));
    var originEl = document.getElementById('productDetailOriginPrice');
    if (originEl) originEl.textContent = p.originPrice ? '¥' + p.originPrice : '';

    var promoEl = document.getElementById('productDetailPromo');
    if (promoEl) promoEl.hidden = !p.promo;

    renderFlatSpecs(p);
    setText('productDetailDeliveryText', p.delivery + ' · ' + p.warehouse);
    setText('productDetailServiceText', p.serviceTags.join(' · '));
    setText('productDetailParamsText', p.params.slice(0, 3).map(function (x) { return x.label + ' ' + x.value; }).join(' · '));

    setHtml('productDetailCoupons', (p.coupons || []).map(function (c) {
      return '<span class="ua-pd-coupon">' + c + '</span>';
    }).join(''));

    setHtml('productDetailServiceTags', (p.serviceTags || []).map(function (t) {
      return '<span class="ua-pd-service-tag">' + CHECK_ICON + t + '</span>';
    }).join(''));

    setText('productDetailSupplierName', p.supplier.name);
    setText('productDetailSupplierMeta', p.supplier.meta);
    var avatar = document.getElementById('productDetailSupplierAvatar');
    if (avatar) avatar.src = p.supplier.avatar;

    renderGallery(p.imgs);
    renderMiniList('productDetailRecommend', p.recommend);
    renderDetailContent(p);
    updateCartBadge();
    tickCountdown();
  }

  function renderGallery(imgs) {
    var main = document.getElementById('productDetailMainImg');
    var dots = document.getElementById('productDetailDots');
    if (!main || !imgs.length) return;
    main.src = imgs[0];
    main.classList.add('ua-pd-hero__img--active');
    if (dots) {
      dots.innerHTML = imgs.map(function (_, i) {
        return '<span class="ua-pd-hero__dot' + (i === 0 ? ' ua-pd-hero__dot--active' : '') + '"></span>';
      }).join('');
    }
  }

  function renderFlatSpecs(p) {
    var el = document.getElementById('productDetailSpecsFlat');
    var section = document.getElementById('productDetailSpecsSection');
    if (!el) return;
    var specs = p.specs || [];
    if (section) section.hidden = !specs.length;
    el.innerHTML = specs
      .map(function (spec) {
        var disabled = spec.available === false;
        return (
          '<div class="ua-pd-spec-flat' +
          (disabled ? ' ua-pd-spec-flat--disabled' : '') +
          '">' +
          '<div class="ua-pd-spec-flat__main">' +
          '<div class="ua-pd-spec-flat__name">' +
          getSpecDisplayName(p, spec) +
          '</div>' +
          '<div class="ua-pd-spec-flat__hint">' +
          getSpecTierHint(spec) +
          '</div></div>' +
          '<div class="ua-pd-spec-flat__right">' +
          '<div class="ua-pd-spec-flat__price">' +
          getSpecUnitPriceText(spec) +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function renderMiniList(elId, ids) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = (ids || []).map(function (id) {
      var item = PRODUCT_CATALOG[id];
      if (!item) return '';
      var spec = item.specs[0];
      return (
        '<button type="button" class="ua-pd-mini" data-pd-id="' + id + '">' +
        '<img class="ua-pd-mini__img" src="' + item.imgs[0] + '" alt="">' +
        '<div class="ua-pd-mini__title">' + item.title + '</div>' +
        '<div class="ua-pd-mini__price">' + formatPrice(spec.priceNum) + '</div></button>'
      );
    }).join('');
  }

  function renderDetailContent(p) {
    var imgsEl = document.getElementById('productDetailDetailImgs');
    if (imgsEl) {
      imgsEl.innerHTML = (p.detailImgs || []).map(function (src) {
        return '<img src="' + src + '" alt="">';
      }).join('');
    }
    var storyEl = document.getElementById('productDetailStory');
    if (storyEl) {
      storyEl.innerHTML = (p.story || []).map(function (s) {
        return '<h3>' + s.title + '</h3><p>' + s.text + '</p>';
      }).join('');
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function tickCountdown() {
    var el = document.getElementById('productDetailCountdown');
    if (!el || !state.countdownEnd) return;
    var left = Math.max(0, state.countdownEnd - Date.now());
    var h = Math.floor(left / 3600000);
    var m = Math.floor((left % 3600000) / 60000);
    var s = Math.floor((left % 60000) / 1000);
    el.textContent = [h, m, s].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
    if (left > 0) window.setTimeout(tickCountdown, 1000);
  }

  function openSheet(name) {
    var map = { service: 'productDetailServiceSheet', params: 'productDetailParamsSheet', spec: 'productDetailSpecSheet' };
    var el = document.getElementById(map[name]);
    if (el) {
      el.hidden = false;
      document.body.classList.add('ua-pd-sheet-open');
    }
  }

  function closeSheet(name) {
    var map = { service: 'productDetailServiceSheet', params: 'productDetailParamsSheet', spec: 'productDetailSpecSheet' };
    var el = document.getElementById(map[name]);
    if (el) el.hidden = true;
    if (!document.querySelector('.ua-pd-sheet:not([hidden])')) {
      document.body.classList.remove('ua-pd-sheet-open');
    }
  }

  function renderServiceSheet() {
    setHtml(
      'productDetailServiceList',
      B2B_SERVICES.map(function (s) {
        return (
          '<div class="ua-pd-service-item">' +
          '<div class="ua-pd-service-item__icon">' + CHECK_ICON + '</div>' +
          '<div><div class="ua-pd-service-item__title">' + s.title + '</div>' +
          '<div class="ua-pd-service-item__desc">' + s.desc + '</div></div></div>'
        );
      }).join('')
    );
  }

  function renderParamsSheet() {
    var p = state.product;
    setHtml(
      'productDetailParamsList',
      (p.params || []).map(function (row) {
        return '<div class="ua-pd-param-row"><span class="ua-pd-param-row__label">' + row.label + '</span><span class="ua-pd-param-row__value">' + row.value + '</span></div>';
      }).join('')
    );
  }

  function renderMultiSpecSheet() {
    var p = state.product;
    if (!p) return;

    setText('productDetailMspecTitle', p.title);
    setText('productDetailMspecPriceRange', getPriceRangeText(p));
    updateMspecTotal();

    var confirmBtn = document.getElementById('productDetailSpecConfirm');
    if (confirmBtn) {
      if (state.sheetIntent === 'cart') confirmBtn.textContent = '加入购物车';
      else if (state.sheetIntent === 'buy') confirmBtn.textContent = '我要进货';
      else confirmBtn.textContent = '确定';
    }

    setHtml(
      'productDetailMspecList',
      (p.specs || [])
        .map(function (spec) {
          var qty = getSpecQty(spec.id);
          var disabled = spec.available === false;
          var subtotal = spec.priceNum * qty;
          return (
            '<div class="ua-pd-mspec-item' +
            (disabled ? ' ua-pd-mspec-item--disabled' : '') +
            '" data-mspec-id="' +
            spec.id +
            '">' +
            '<div class="ua-pd-mspec-item__top">' +
            '<div class="ua-pd-mspec-item__name">' +
            getSpecDisplayName(p, spec) +
            '</div>' +
            '<div class="ua-pd-mspec-item__stepper">' +
            '<button type="button" class="ua-pd-mspec-minus" data-mspec-id="' +
            spec.id +
            '"' +
            (disabled || qty <= 0 ? ' disabled' : '') +
            ' aria-label="减少">-</button>' +
            '<input type="number" class="ua-pd-mspec-input" data-mspec-id="' +
            spec.id +
            '" value="' +
            qty +
            '" min="0" max="999"' +
            (disabled ? ' disabled' : '') +
            ' inputmode="numeric">' +
            '<button type="button" class="ua-pd-mspec-plus" data-mspec-id="' +
            spec.id +
            '"' +
            (disabled ? ' disabled' : '') +
            ' aria-label="增加">+</button></div></div>' +
            '<div class="ua-pd-mspec-item__bottom">' +
            '<div class="ua-pd-mspec-item__hint">' +
            getSpecTierHint(spec) +
            '</div>' +
            '<div class="ua-pd-mspec-item__pricing">' +
            '<div class="ua-pd-mspec-item__unit-price">' +
            getSpecUnitPriceText(spec) +
            '</div>' +
            '<div class="ua-pd-mspec-item__subtotal"' +
            (qty > 0 ? '' : ' hidden') +
            ' data-mspec-subtotal="' +
            spec.id +
            '">小计：' +
            formatPriceFixed(subtotal) +
            '</div></div></div></div>'
          );
        })
        .join('')
    );
  }

  function updateMspecRow(specId) {
    var p = state.product;
    if (!p) return;
    var spec = p.specs.find(function (s) { return s.id === specId; });
    if (!spec) return;
    var row = document.querySelector('[data-mspec-id="' + specId + '"].ua-pd-mspec-item');
    if (!row) return;
    var qty = getSpecQty(specId);
    var input = row.querySelector('.ua-pd-mspec-input');
    var minus = row.querySelector('.ua-pd-mspec-minus');
    var subtotalEl = row.querySelector('[data-mspec-subtotal="' + specId + '"]');
    if (input) input.value = String(qty);
    if (minus) minus.disabled = qty <= 0;
    if (subtotalEl) {
      if (qty > 0) {
        subtotalEl.hidden = false;
        subtotalEl.textContent = '小计：' + formatPriceFixed(spec.priceNum * qty);
      } else {
        subtotalEl.hidden = true;
      }
    }
    updateMspecTotal();
  }

  function updateMspecTotal() {
    var totalEl = document.getElementById('productDetailMspecTotal');
    var confirmBtn = document.getElementById('productDetailSpecConfirm');
    var total = calcMspecTotal();
    if (totalEl) totalEl.textContent = formatPriceFixed(total);
    if (confirmBtn) confirmBtn.disabled = total <= 0;
  }

  function addMultipleToCart(goCheckout) {
    var p = state.product;
    var selected = calcSelectedSpecs();
    if (!selected.length) {
      window.alert('请选择规格数量');
      return;
    }
    var checkoutItems = [];
    try {
      var raw = localStorage.getItem(CART_PAGE_KEY);
      var cartState = raw ? JSON.parse(raw) : { stores: [] };
      if (!cartState.stores) cartState.stores = [];
      var supplierId = p.supplier.id;
      var store = cartState.stores.find(function (s) { return s.id === supplierId; });
      if (!store) {
        store = { id: supplierId, name: p.supplier.name, blocks: [{ items: [] }] };
        cartState.stores.push(store);
      }
      var items = store.blocks[0].items;
      selected.forEach(function (entry) {
        var spec = entry.spec;
        var found = items.find(function (i) { return i.id === spec.id; });
        if (found) found.qty = (found.qty || 0) + entry.qty;
        else {
          items.push({
            id: spec.id,
            spuId: p.spuId,
            title: p.title,
            spec: spec.label,
            priceNum: spec.priceNum,
            qty: entry.qty,
            selected: !!goCheckout,
            img: p.imgs[0],
            supplierId: supplierId,
            supplierName: p.supplier.name
          });
        }
        checkoutItems.push({
          id: spec.id,
          spuId: p.spuId,
          title: p.title,
          spec: spec.label,
          priceNum: spec.priceNum,
          qty: entry.qty,
          img: p.imgs[0],
          supplierId: p.supplier.id,
          supplierName: p.supplier.name
        });
      });
      if (goCheckout) {
        var selectedIds = selected.map(function (s) { return s.spec.id; });
        items.forEach(function (i) {
          i.selected = selectedIds.indexOf(i.id) !== -1;
        });
      }
      localStorage.setItem(CART_PAGE_KEY, JSON.stringify(cartState));
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    } catch (e) {
      /* ignore */
    }
    if (goCheckout) {
      sessionStorage.setItem(
        'ua_checkout_v1',
        JSON.stringify({
          store: { name: '悠悠生鲜超市', contact: '张店长', phone: '138****6688', address: '浙江省杭州市萧山区建设一路88号' },
          items: checkoutItems
        })
      );
      window.location.href = 'checkout.html?from=restock.html';
      return;
    }
    updateCartBadge();
    window.alert('已加入购物车');
  }

  function updateCartBadge() {
    var badge = document.getElementById('productDetailCartBadge');
    if (!badge) return;
    var n = 0;
    try {
      var raw = localStorage.getItem(CART_PAGE_KEY);
      if (raw) {
        var cart = JSON.parse(raw);
        (cart.stores || []).forEach(function (s) {
          (s.blocks || []).forEach(function (b) {
            (b.items || []).forEach(function (i) { n += i.qty || 0; });
          });
        });
      }
    } catch (e) {
      /* ignore */
    }
    if (n > 0) {
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.hidden = false;
    } else badge.hidden = true;
  }

  function openSpecSheet(intent) {
    state.sheetIntent = intent || 'pick';
    initSpecQtys(true);
    renderMultiSpecSheet();
    openSheet('spec');
  }

  function bindEvents() {
    document.getElementById('productDetailServiceRow') &&
      document.getElementById('productDetailServiceRow').addEventListener('click', function () {
        renderServiceSheet();
        openSheet('service');
      });

    document.getElementById('productDetailParamsRow') &&
      document.getElementById('productDetailParamsRow').addEventListener('click', function () {
        renderParamsSheet();
        openSheet('params');
      });

    document.getElementById('productDetailDeliveryRow') &&
      document.getElementById('productDetailDeliveryRow').addEventListener('click', function () {
        window.alert('配送时段以结算页选择为准（演示）');
      });

    document.querySelectorAll('[data-pd-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-pd-close'));
      });
    });

    document.getElementById('productDetailMspecList') &&
      document.getElementById('productDetailMspecList').addEventListener('click', function (e) {
        var minus = e.target.closest('.ua-pd-mspec-minus');
        if (minus && !minus.disabled) {
          var minusId = minus.getAttribute('data-mspec-id');
          setSpecQty(minusId, getSpecQty(minusId) - 1);
          updateMspecRow(minusId);
          return;
        }
        var plus = e.target.closest('.ua-pd-mspec-plus');
        if (plus && !plus.disabled) {
          var plusId = plus.getAttribute('data-mspec-id');
          setSpecQty(plusId, getSpecQty(plusId) + 1);
          updateMspecRow(plusId);
        }
      });

    document.getElementById('productDetailMspecList') &&
      document.getElementById('productDetailMspecList').addEventListener('change', function (e) {
        var input = e.target.closest('.ua-pd-mspec-input');
        if (!input) return;
        var specId = input.getAttribute('data-mspec-id');
        var val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 999) val = 999;
        setSpecQty(specId, val);
        updateMspecRow(specId);
      });

    document.getElementById('productDetailSpecConfirm') &&
      document.getElementById('productDetailSpecConfirm').addEventListener('click', function () {
        if (this.disabled) return;
        var intent = state.sheetIntent;
        closeSheet('spec');
        state.sheetIntent = 'pick';
        if (intent === 'cart') addMultipleToCart(false);
        else if (intent === 'buy') addMultipleToCart(true);
      });

    document.getElementById('productDetailAddCart') &&
      document.getElementById('productDetailAddCart').addEventListener('click', function () {
        openSpecSheet('cart');
      });

    document.getElementById('productDetailBuyNow') &&
      document.getElementById('productDetailBuyNow').addEventListener('click', function () {
        openSpecSheet('buy');
      });

    document.getElementById('productDetailShare') &&
      document.getElementById('productDetailShare').addEventListener('click', function () {
        window.alert('分享商品（演示）');
      });

    document.getElementById('productDetailMore') &&
      document.getElementById('productDetailMore').addEventListener('click', function () {
        window.alert('更多操作（演示）');
      });

    document.getElementById('productDetailSupportBtn') &&
      document.getElementById('productDetailSupportBtn').addEventListener('click', function () {
        window.alert('联系客服（演示）');
      });

    document.getElementById('productDetailSupplierEnter') &&
      document.getElementById('productDetailSupplierEnter').addEventListener('click', function () {
        window.alert('进入供应商：' + state.product.supplier.name + '（演示）');
      });

    document.body.addEventListener('click', function (e) {
      var mini = e.target.closest('[data-pd-id]');
      if (mini) window.location.href = buildDetailUrl(mini.getAttribute('data-pd-id'));
    });
  }

  initProduct();
  renderPage();
  bindEvents();
})();
