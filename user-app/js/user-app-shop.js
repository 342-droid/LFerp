(function (global) {
  var CART_KEY = 'ua_shop_cart_v2';
  var LIVE_CART_KEY = 'ua_live_cart_v1';
  var CONFIRM_SHIPPING_ADDR_KEY = 'ua_order_confirm_shipping_address';
  var DEFAULT_SHIPPING_ADDRESS = {
    contact: '武者',
    phone: '181****4215',
    full: '四川省成都市武侯区天府大道中段666号天府软件园A区'
  };
  var STORE = {
    id: 'store-prod-verify',
    name: '生产验证门店',
    avatar: '../assets/restock/me-shop-avatar.svg',
    address: '上海市市辖区青浦区上海市青浦区华新镇纪鹤公路1301号7幢1层121室',
    contact: '斯斯 159****4315',
    meta: '4.9分 · 距您180m',
    distance: '180m',
    pickupBadge: '后天可提'
  };

  var SUPPLIER_LENGFENG = {
    id: 'supplier-lengfeng',
    name: '冷丰优选供应链',
    avatar: '../assets/restock/me-shop-avatar.svg',
    meta: '4.9分 · 月销2100单',
    warehouse: '冷丰中央仓',
    deliveryText: '预计3天内发货'
  };

  var SUPPLIER_TEST = {
    id: 'supplier-prod-test',
    name: '生产测试商',
    avatar: '../assets/shop/cat-test.svg',
    meta: '4.8分 · 月销860单',
    warehouse: '生产验证仓',
    deliveryText: '预计2-3天送达'
  };

  /** 商品透出供应商名：档案简称优先，无简称则用全称 */
  function getSupplierDisplayName(supplier) {
    if (
      window.MdmSupplierArchiveStore &&
      typeof window.MdmSupplierArchiveStore.getDisplayName === 'function'
    ) {
      return window.MdmSupplierArchiveStore.getDisplayName(supplier);
    }
    if (!supplier) return '';
    return String(supplier.shortName || supplier.name || '').trim();
  }

  var PRODUCTS = {
    'beef-tendon': {
      id: 'beef-tendon',
      name: '精选金钱牛腱子肉 软嫩弹牙',
      shortName: '精选金钱牛腱子肉',
      spec: '1kg',
      price: 96.8,
      originPrice: 196.8,
      sold: 888,
      serviceText: '坏了包退 三天内到货',
      img: '../assets/shop/beef-hero.svg',
      detailImg: '../assets/shop/beef-detail.svg',
      heroTags: ['精选新鲜牛后腿肉', '大块整切 拒绝合成'],
      fulfillType: 'pickup',
      pickupStore: '生产验证门店',
      distance: '180m',
      pickupBadge: '后天可提',
      store: STORE,
      specs: [
        '精选金钱牛腱子肉 500g',
        '精选金钱牛腱子肉 1kg',
        '精选金钱牛腱子肉 1.5kg',
        '精选金钱牛腱子肉 2kg',
        '精选金钱牛腱子肉 礼盒装'
      ],
      defaultSpec: '精选金钱牛腱子肉 1kg',
      reviewCount: 1906,
      watermark: false
    },
    'wonton-corn': {
      id: 'wonton-corn',
      name: '黑猪肉玉米云吞',
      shortName: '黑猪肉玉米云吞',
      spec: '12',
      price: 12,
      livePrice: 6,
      liveStock: 66,
      liveSpecs: [{ label: '12', price: 6 }],
      originPrice: 18,
      sold: 326,
      serviceText: '坏了包退 三天内到货',
      img: '../assets/shop/product-wonton-corn.svg',
      detailImg: '../assets/shop/product-wonton-corn.svg',
      heroTags: ['冷丰特选', '新鲜速冻'],
      fulfillType: 'express',
      supplier: SUPPLIER_LENGFENG,
      pickupStore: '生产验证门店',
      distance: '180m',
      pickupBadge: '后天可提',
      specs: ['黑猪肉玉米云吞 12只', '黑猪肉玉米云吞 24只'],
      defaultSpec: '黑猪肉玉米云吞 12只',
      reviewCount: 128,
      watermark: false
    },
    dumpling: {
      id: 'dumpling',
      name: '饺子',
      shortName: '饺子',
      spec: '60',
      price: 16,
      livePrice: 30,
      liveStock: 66,
      liveSpecs: [{ label: '60', price: 30 }],
      originPrice: 26,
      sold: 512,
      serviceText: '坏了包退 三天内到货',
      img: '../assets/shop/product-dumpling.svg',
      detailImg: '../assets/shop/product-dumpling.svg',
      heroTags: ['生产验证商品', '请勿下单'],
      fulfillType: 'express',
      supplier: SUPPLIER_TEST,
      pickupStore: '生产验证门店',
      distance: '180m',
      pickupBadge: '后天可提',
      specs: ['饺子 30只', '饺子 60只'],
      defaultSpec: '饺子 60只',
      reviewCount: 86,
      watermark: true
    },
    'wonton-pork': {
      id: 'wonton-pork',
      name: '猪肉雪菜笋丁云吞',
      shortName: '猪肉雪菜笋丁云吞',
      spec: '12',
      price: 12,
      livePrice: 6,
      liveStock: 66,
      liveSpecs: [{ label: '12', price: 6 }],
      originPrice: 18,
      sold: 268,
      serviceText: '坏了包退 三天内到货',
      img: '../assets/shop/product-wonton-pork.svg',
      detailImg: '../assets/shop/product-wonton-pork.svg',
      heroTags: ['冷丰特选', '鲜香入味'],
      fulfillType: 'pickup',
      store: STORE,
      pickupStore: '生产验证门店',
      distance: '180m',
      pickupBadge: '后天可提',
      specs: ['猪肉雪菜笋丁云吞 12只', '猪肉雪菜笋丁云吞 24只'],
      defaultSpec: '猪肉雪菜笋丁云吞 12只',
      reviewCount: 204,
      watermark: false
    },
    'duck-mix': {
      id: 'duck-mix',
      name: '鸭杂复合包',
      shortName: '鸭杂复合包',
      spec: '1',
      price: 3,
      livePrice: 3,
      liveStock: 66,
      liveSpecs: [{ label: '1', price: 3 }],
      originPrice: 5,
      sold: 990,
      serviceText: '坏了包退 三天内到货',
      img: '../assets/shop/product-duck-mix.svg',
      detailImg: '../assets/shop/product-duck-mix.svg',
      heroTags: ['冷丰特选', '煲汤优选'],
      fulfillType: 'express',
      supplier: SUPPLIER_LENGFENG,
      pickupStore: '生产验证门店',
      distance: '180m',
      pickupBadge: '后天可提',
      specs: ['鸭杂复合包 1份', '鸭杂复合包 3份'],
      defaultSpec: '鸭杂复合包 1份',
      reviewCount: 66,
      watermark: false
    }
  };

  var LIVE_PRODUCT_IDS = ['dumpling', 'wonton-pork', 'wonton-corn', 'duck-mix'];
  var LIVE_SALE_MODE_KEY = 'ua_live_sale_mode_v1';
  var LIVE_PREVIEW_PRICE_KEY = 'ua_live_preview_price_v1';
  var LIVE_EXPLAIN_KEY = 'ua_live_explain_v1';
  var LIVE_C_STATE_KEY = 'lf_live_c_state_v1';
  var LIVE_VIEWER_KEY = 'ua_live_viewer_v1';
  var LIVE_VIEWER_OPTIONS = [
    { id: 'u-guozi', name: '果子狸' },
    { id: 'u-anan', name: '阿南' },
    { id: 'u-xiaoman', name: '小满' },
    { id: 'u-laozhang', name: '老张' },
    { id: 'u-xiaomei', name: '小美' }
  ];
  var liveLocalComments = [];
  var LIVE_DANMU_FALLBACK = [
    { id: 'c1', userId: 'u-guozi', user: '果子狸', text: '西红柿还有吗？' },
    { id: 'c2', userId: 'u-anchor', user: '主播小丰', text: '有的，讲解中这款还有库存～', isAnchor: true },
    { id: 'c3', userId: 'u-anan', user: '阿南', text: '五花肉包邮吗' },
    { id: 'c4', userId: 'u-xiaoman', user: '小满', text: '来个福袋！' },
    { id: 'c5', userId: 'u-xikui', user: '希奎', text: '火龙果什么时候讲' }
  ];

  function readLiveCState() {
    try {
      var raw = localStorage.getItem(LIVE_C_STATE_KEY);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function readLiveViewer() {
    try {
      var raw = localStorage.getItem(LIVE_VIEWER_KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (data && data.id && data.name) return data;
    } catch (e) {}
    return { id: 'u-guozi', name: '果子狸' };
  }

  function writeLiveViewer(id, name) {
    localStorage.setItem(LIVE_VIEWER_KEY, JSON.stringify({ id: id, name: name }));
  }

  function escapeLiveText(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function liveDanmuList() {
    var st = readLiveCState();
    var remote = Array.isArray(st.chatMessages) ? st.chatMessages : LIVE_DANMU_FALLBACK;
    return remote.concat(liveLocalComments).filter(function (m) {
      return m && !m.blocked;
    });
  }

  function renderLiveDanmu() {
    var box = document.getElementById('liveDanmuList');
    if (!box) return;
    var msgs = liveDanmuList().slice(-8);
    box.innerHTML = msgs
      .map(function (m) {
        return (
          '<div class="ua-live-danmu__item"><b>' +
          escapeLiveText(m.user || '观众') +
          '</b> ' +
          escapeLiveText(m.text || '') +
          '</div>'
        );
      })
      .join('');
  }

  function renderLiveViewerCount() {
    var el = document.getElementById('liveViewerCount');
    if (!el) return;
    var st = readLiveCState();
    if (st.cViewerText) el.textContent = st.cViewerText;
  }

  function refreshLiveRoomOverlay() {
    renderLiveDanmu();
    renderLiveViewerCount();
  }

  function liveMuteReason() {
    var st = readLiveCState();
    var me = readLiveViewer();
    if (st.muted) return 'room';
    var ids = Array.isArray(st.mutedUserIds) ? st.mutedUserIds : ['u-laozhang', 'u-xiaomei'];
    if (ids.indexOf(me.id) >= 0 || ids.indexOf(me.name) >= 0) return 'user';
    return '';
  }

  function mountLiveDanmuDemo() {
    if (document.getElementById('uaLiveDanmuDemo')) return;
    var me = readLiveViewer();
    var panel = document.createElement('div');
    panel.id = 'uaLiveDanmuDemo';
    panel.className = 'ua-live-danmu-demo';
    panel.innerHTML =
      '<div class="ua-live-danmu-demo__title">弹幕验收开关</div>' +
      '<label class="ua-live-goods-demo__row">当前身份' +
      '<select id="uaLiveDanmuViewer">' +
      LIVE_VIEWER_OPTIONS.map(function (opt) {
        return (
          '<option value="' +
          opt.id +
          '"' +
          (me.id === opt.id ? ' selected' : '') +
          '>' +
          opt.name +
          '</option>'
        );
      }).join('') +
      '</select></label>' +
      '<button type="button" class="ua-live-goods-demo__apply" id="uaLiveDanmuDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaLiveDanmuDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaLiveDanmuViewer');
        var id = sel ? sel.value : 'u-guozi';
        var found = LIVE_VIEWER_OPTIONS.filter(function (o) {
          return o.id === id;
        })[0];
        writeLiveViewer(id, found ? found.name : '果子狸');
        window.location.reload();
      });
    }
  }

  function readLiveSaleMode() {
    try {
      var v = localStorage.getItem(LIVE_SALE_MODE_KEY);
      return v === 'preview' ? 'preview' : 'selling';
    } catch (e) {
      return 'selling';
    }
  }

  function writeLiveSaleMode(mode) {
    localStorage.setItem(LIVE_SALE_MODE_KEY, mode === 'preview' ? 'preview' : 'selling');
  }

  function isLivePreview() {
    return readLiveSaleMode() === 'preview';
  }

  function readPreviewPriceMode() {
    try {
      var v = localStorage.getItem(LIVE_PREVIEW_PRICE_KEY);
      if (v === 'question' || v === 'market' || v === 'sale') return v;
    } catch (e) {}
    var st = readLiveCState();
    if (st.previewPriceMode === 'question' || st.previewPriceMode === 'market' || st.previewPriceMode === 'sale') {
      return st.previewPriceMode;
    }
    return 'sale';
  }

  function writePreviewPriceMode(mode) {
    localStorage.setItem(
      LIVE_PREVIEW_PRICE_KEY,
      mode === 'question' || mode === 'market' ? mode : 'sale'
    );
  }

  function readExplainFlag() {
    try {
      return localStorage.getItem(LIVE_EXPLAIN_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeExplainFlag(on) {
    localStorage.setItem(LIVE_EXPLAIN_KEY, on ? 'on' : 'off');
  }

  function isLiveExplainOn() {
    var flag = readExplainFlag();
    if (flag === 'on') return true;
    if (flag === 'off') return false;
    return !!readLiveCState().explaining;
  }

  function liveQuestionMarksHtml() {
    return '<span class="ua-live-goods__price-q">???</span>';
  }

  function hasStrikePrice(val) {
    return val != null && val !== '' && Number(val) > 0;
  }

  function livePreviewPriceInner(p, mode) {
    if (mode === 'question') return liveQuestionMarksHtml();
    if (mode === 'market') {
      var m =
        p &&
        (hasStrikePrice(p.originPrice)
          ? p.originPrice
          : hasStrikePrice(p.marketPrice)
            ? p.marketPrice
            : null);
      if (!hasStrikePrice(m)) return liveQuestionMarksHtml();
      return '<small>¥</small>' + Number(m).toFixed(2);
    }
    return '<small>¥</small>' + Number(getLivePrice(p)).toFixed(2);
  }

  function liveGoodsPriceHtml(p) {
    if (!isLivePreview()) {
      return '<small>¥</small>' + Number(getLivePrice(p)).toFixed(2);
    }
    return livePreviewPriceInner(p, readPreviewPriceMode());
  }

  function getLiveExplainPayload() {
    var flag = readExplainFlag();
    var st = readLiveCState();
    if (flag === 'off') return null;
    if (st && st.explaining) return st.explaining;
    if (flag !== 'on') return null;
    var p = PRODUCTS[LIVE_PRODUCT_IDS[0]];
    if (!p) return null;
    return {
      name: p.shortName || p.name,
      price: getLivePrice(p),
      marketPrice: p.originPrice,
      previewPriceMode: readPreviewPriceMode(),
      saleMode: readLiveSaleMode(),
      img: p.img
    };
  }

  function mountLiveGoodsDemo(opts) {
    if (document.getElementById('uaLiveGoodsDemo')) return;
    opts = opts || {};
    var panel = document.createElement('div');
    panel.id = 'uaLiveGoodsDemo';
    panel.className = 'ua-live-goods-demo' + (opts.offsetFooter ? ' ua-live-goods-demo--gd' : '');
    var cur = readLiveSaleMode();
    var priceMode = readPreviewPriceMode();
    var explainOn = isLiveExplainOn();
    var explainHtml =
      opts.includeExplain === false
        ? ''
        : '<label class="ua-live-goods-demo__row">讲解卡片' +
          '<select id="uaLiveGoodsDemoExplain">' +
          '<option value="off"' +
          (explainOn ? '' : ' selected') +
          '>关闭</option>' +
          '<option value="on"' +
          (explainOn ? ' selected' : '') +
          '>开启</option></select></label>';
    panel.innerHTML =
      '<div class="ua-live-goods-demo__title">直播商品验收开关</div>' +
      '<label class="ua-live-goods-demo__row">商品状态' +
      '<select id="uaLiveGoodsDemoMode">' +
      '<option value="selling"' +
      (cur === 'selling' ? ' selected' : '') +
      '>售卖</option>' +
      '<option value="preview"' +
      (cur === 'preview' ? ' selected' : '') +
      '>预告</option></select></label>' +
      '<label class="ua-live-goods-demo__row">预告价格' +
      '<select id="uaLiveGoodsDemoPrice">' +
      '<option value="question"' +
      (priceMode === 'question' ? ' selected' : '') +
      '>问号</option>' +
      '<option value="market"' +
      (priceMode === 'market' ? ' selected' : '') +
      '>划线价</option>' +
      '<option value="sale"' +
      (priceMode === 'sale' ? ' selected' : '') +
      '>售价</option></select></label>' +
      explainHtml +
      '<button type="button" class="ua-live-goods-demo__apply" id="uaLiveGoodsDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaLiveGoodsDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaLiveGoodsDemoMode');
        var priceSel = document.getElementById('uaLiveGoodsDemoPrice');
        var explainSel = document.getElementById('uaLiveGoodsDemoExplain');
        writeLiveSaleMode(sel ? sel.value : 'selling');
        writePreviewPriceMode(priceSel ? priceSel.value : 'sale');
        if (explainSel) writeExplainFlag(explainSel.value === 'on');
        window.location.reload();
      });
    }
  }

  function liveExplainPriceHtml(info) {
    var preview = isLivePreview() || (info && info.saleMode === 'preview');
    var mode = (info && info.previewPriceMode) || readPreviewPriceMode();
    if (preview && mode === 'question') return liveQuestionMarksHtml();
    if (preview && mode === 'market') {
      var m =
        info &&
        (hasStrikePrice(info.marketPrice)
          ? info.marketPrice
          : hasStrikePrice(info.originPrice)
            ? info.originPrice
            : null);
      if (!hasStrikePrice(m)) return liveQuestionMarksHtml();
      return '<small>¥</small>' + Number(m).toFixed(2);
    }
    return '<small>¥</small>' + Number((info && info.price) || 0).toFixed(2);
  }

  function renderLiveExplainCard() {
    var card = document.getElementById('liveExplainCard');
    if (!card) return;
    var info = getLiveExplainPayload();
    if (!info) {
      card.hidden = true;
      return;
    }
    var nameEl = document.getElementById('liveExplainName');
    var priceEl = document.getElementById('liveExplainPrice');
    var thumbEl = document.getElementById('liveExplainThumb');
    if (nameEl) nameEl.textContent = info.name || '讲解商品';
    if (priceEl) priceEl.innerHTML = liveExplainPriceHtml(info);
    if (thumbEl) {
      if (info.img) {
        thumbEl.innerHTML = '<img src="' + info.img + '" alt="">';
      } else {
        var ch = String(info.name || '商').charAt(0);
        thumbEl.innerHTML = '<span>' + ch + '</span>';
      }
    }
    card.hidden = false;
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    syncBadges();
    global.dispatchEvent(new CustomEvent('ua-shop-cart-change', { detail: cart }));
  }

  function ensureCart() {
    var cart = readCart();
    if (cart && Array.isArray(cart.items) && cart.items.length) {
      normalizeCartItems(cart);
      return cart;
    }
    cart = {
      store: STORE,
      items: [
        { id: 'beef-tendon', qty: 1, checked: true, source: 'mall' },
        { id: 'wonton-pork', qty: 1, checked: true, source: 'mall' },
        { id: 'wonton-corn', qty: 1, checked: true, source: 'mall' },
        { id: 'dumpling', qty: 1, checked: true, source: 'mall' }
      ]
    };
    normalizeCartItems(cart);
    writeCart(cart);
    return cart;
  }

  function isPointsExchangeItem(item) {
    return !!(item && (item.isPointsExchange || String(item.id || '').indexOf('points:') === 0));
  }

  function resolveCartAsset(src) {
    src = String(src || '');
    if (!src) return '';
    if (/^(data:|https?:|\/\/)/i.test(src)) return src;
    if (src.indexOf('../user-app/') === 0) return src.replace('../user-app/', '../');
    if (src.indexOf('user-app/') === 0) return '../' + src.slice('user-app/'.length);
    return src;
  }

  function formatPointsExchangePrice(item) {
    if (global.UaPointsMallOrder && global.UaPointsMallOrder.formatExchangeLabel) {
      return global.UaPointsMallOrder.formatExchangeLabel(item.points, item.money);
    }
    var pts = Number(item && item.points) || 0;
    var cash = Number(item && item.money) || 0;
    if (cash > 0) return pts + '积分 + ' + formatMoney(cash);
    return pts + '积分';
  }

  function getCartItemMerchantInfo(item) {
    if (isPointsExchangeItem(item)) {
      var supplierId = item.supplierId || String(item.merchantId || '').replace(/^supplier:/, '') || '斯斯供应商商家';
      var supplierName = item.supplierName || item.merchantName || supplierId;
      return {
        fulfillType: item.fulfillType === 'express' ? 'express' : 'pickup',
        merchantId: 'supplier:' + supplierId,
        merchantName: supplierName,
        merchantAvatar: ''
      };
    }
    var p = PRODUCTS[item && item.id];
    var fulfillType =
      (item && item.fulfillType) || (p && getProductFulfillType(p)) || 'pickup';
    if (fulfillType === 'express') {
      var supplier = (item && item.merchantId && p && p.supplier && p.supplier.id === item.merchantId
        ? p.supplier
        : null) || (p && p.supplier) || SUPPLIER_LENGFENG;
      return {
        fulfillType: 'express',
        merchantId: supplier.id,
        merchantName: getSupplierDisplayName(supplier) || supplier.name,
        merchantAvatar: supplier.avatar
      };
    }
    var store =
      (p && p.store) ||
      STORE;
    return {
      fulfillType: 'pickup',
      merchantId: store.id,
      merchantName: store.name,
      merchantAvatar: store.avatar
    };
  }

  function enrichCartItem(item) {
    if (!item) return item;
    if (isPointsExchangeItem(item)) {
      item.isPointsExchange = true;
      var info = getCartItemMerchantInfo(item);
      item.fulfillType = info.fulfillType;
      item.merchantId = info.merchantId;
      item.merchantName = info.merchantName;
      item.price = Number(item.money) || 0;
      return item;
    }
    if (!PRODUCTS[item.id]) return item;
    var mallInfo = getCartItemMerchantInfo(item);
    item.fulfillType = mallInfo.fulfillType;
    item.merchantId = mallInfo.merchantId;
    item.merchantName = mallInfo.merchantName;
    return item;
  }

  function normalizeCartItems(cart) {
    if (!cart || !Array.isArray(cart.items)) return cart;
    cart.items.forEach(enrichCartItem);
    return cart;
  }

  function groupCartItems(cart) {
    var groups = [];
    var map = {};
    (cart.items || []).forEach(function (item) {
      if (!isPointsExchangeItem(item) && !PRODUCTS[item.id]) return;
      var info = getCartItemMerchantInfo(item);
      var key = info.fulfillType + ':' + info.merchantId;
      if (!map[key]) {
        map[key] = {
          key: key,
          fulfillType: info.fulfillType,
          merchantId: info.merchantId,
          merchantName: info.merchantName,
          merchantAvatar: info.merchantAvatar,
          isPointsGroup: false,
          items: []
        };
        groups.push(map[key]);
      }
      map[key].items.push(item);
    });
    groups.sort(function (a, b) {
      if (a.fulfillType === b.fulfillType) return a.merchantName.localeCompare(b.merchantName, 'zh');
      return a.fulfillType === 'pickup' ? -1 : 1;
    });
    return groups;
  }

  function toggleGroup(merchantKey, checked) {
    var cart = ensureCart();
    var groups = groupCartItems(cart);
    var group = groups.find(function (g) {
      return g.key === merchantKey;
    });
    if (!group) return cart;
    group.items.forEach(function (item) {
      item.checked = !!checked;
    });
    writeCart(cart);
    return cart;
  }

  function itemUnitPrice(item) {
    if (isPointsExchangeItem(item)) return Number(item.money) || 0;
    if (item && item.price != null) return Number(item.price);
    var p = PRODUCTS[item && item.id];
    return p ? Number(p.price) : 0;
  }

  function itemSpecText(item) {
    if (isPointsExchangeItem(item)) return String(item.spec || '默认');
    if (item && item.spec != null && item.spec !== '') return String(item.spec);
    var p = PRODUCTS[item && item.id];
    return p ? String(p.spec) : '';
  }

  function getCartCount(cart) {
    cart = cart || ensureCart();
    return (cart.items || []).reduce(function (sum, item) {
      if (!isPointsExchangeItem(item) && !PRODUCTS[item.id]) return sum;
      return sum + (item.qty || 0);
    }, 0);
  }

  function readLiveCart() {
    try {
      var raw = localStorage.getItem(LIVE_CART_KEY);
      if (!raw) return { items: [] };
      var data = JSON.parse(raw);
      return data && Array.isArray(data.items) ? data : { items: [] };
    } catch (e) {
      return { items: [] };
    }
  }

  function writeLiveCart(liveCart) {
    localStorage.setItem(LIVE_CART_KEY, JSON.stringify(liveCart || { items: [] }));
  }

  function findLiveItem(liveCart, id) {
    return ((liveCart && liveCart.items) || []).find(function (it) {
      return it.id === id;
    });
  }

  function syncLiveItemToMallCart(liveItem) {
    if (!liveItem) return;
    var cart = ensureCart();
    var item = findItem(cart, liveItem.id);
    if (item) {
      if (item.fromLive) item.qty = liveItem.qty;
      else item.qty = Math.max(item.qty || 0, liveItem.qty || 0);
      item.checked = true;
      item.price = liveItem.price;
      item.spec = liveItem.spec;
      item.fromLive = true;
    } else {
      cart.items.push({
        id: liveItem.id,
        qty: liveItem.qty,
        checked: true,
        price: liveItem.price,
        spec: liveItem.spec,
        fromLive: true,
        source: 'mall'
      });
    }
    writeCart(cart);
  }

  function getLiveCartItems() {
    return readLiveCart().items.filter(function (item) {
      return PRODUCTS[item.id];
    });
  }

  function getLiveCartSummary() {
    var total = 0;
    var count = 0;
    getLiveCartItems().forEach(function (item) {
      total += Number(item.price || 0) * (item.qty || 0);
      count += item.qty || 0;
    });
    return { total: total, count: count };
  }

  function getCheckedSummary(cart) {
    cart = cart || ensureCart();
    var total = 0;
    var count = 0;
    var points = 0;
    var hasPoints = false;
    (cart.items || []).forEach(function (item) {
      if (!item.checked) return;
      if (isPointsExchangeItem(item)) {
        hasPoints = true;
        total += itemUnitPrice(item) * item.qty;
        points += (Number(item.points) || 0) * (item.qty || 0);
        count += item.qty;
        return;
      }
      var p = PRODUCTS[item.id];
      if (!p) return;
      total += itemUnitPrice(item) * item.qty;
      count += item.qty;
    });
    return { total: total, count: count, points: points, hasPoints: hasPoints };
  }

  function formatMoney(n) {
    return '¥' + Number(n || 0).toFixed(2);
  }

  function formatPriceLabel(n) {
    var num = Number(n || 0);
    if (num % 1 === 0) return String(num);
    return String(Math.round(num * 10) / 10);
  }

  function getProduct(id) {
    return PRODUCTS[id] || PRODUCTS['beef-tendon'];
  }

  function syncBadges() {
    var count = getCartCount();
    document.querySelectorAll('[data-ua-cart-badge]').forEach(function (el) {
      if (count > 0) {
        el.hidden = false;
        el.textContent = String(count > 99 ? '99+' : count);
      } else {
        el.hidden = true;
        el.textContent = '';
      }
    });
  }

  function findItem(cart, id) {
    return (cart.items || []).find(function (it) {
      return it.id === id;
    });
  }

  function addToCart(id, qty, opts) {
    opts = opts || {};
    var addQty = qty || 1;
    var p = PRODUCTS[id];
    var price = opts.price != null ? opts.price : p ? p.price : 0;
    var spec = opts.spec != null ? opts.spec : p ? p.spec : '';

    if (opts.source === 'live') {
      var liveCart = readLiveCart();
      var liveItem = findLiveItem(liveCart, id);
      if (liveItem) {
        liveItem.qty += addQty;
        liveItem.price = price;
        liveItem.spec = spec;
      } else {
        liveCart.items.push({ id: id, qty: addQty, price: price, spec: spec });
        liveItem = findLiveItem(liveCart, id);
      }
      writeLiveCart(liveCart);
      syncLiveItemToMallCart(liveItem);
      return ensureCart();
    }

    var cart = ensureCart();
    var item = findItem(cart, id);
    var fulfillType = getProductFulfillType(p);
    var merchant = getProductMerchant(p || {});
    if (item) {
      item.qty += addQty;
      enrichCartItem(item);
    } else {
      cart.items.push(
        enrichCartItem({
          id: id,
          qty: addQty,
          checked: true,
          source: 'mall',
          price: price,
          spec: spec,
          fulfillType: fulfillType,
          merchantId: merchant && merchant.id,
          merchantName: merchant && merchant.name
        })
      );
    }
    writeCart(cart);
    return cart;
  }

  function setQty(id, qty) {
    var cart = ensureCart();
    var item = findItem(cart, id);
    if (!item) return cart;
    var min = isPointsExchangeItem(item)
      ? Math.max(1, Math.round(Number(item.minSaleQty) || 1))
      : 1;
    item.qty = Math.max(min, qty);
    writeCart(cart);
    if (isPointsExchangeItem(item) && global.UaPointsMallOrder && global.UaPointsMallOrder.setCartLineQty) {
      global.UaPointsMallOrder.setCartLineQty(item.pointsCode, item.skuCode, item.qty);
    }
    return cart;
  }

  function removeCartItem(id) {
    var cart = ensureCart();
    var removing = findItem(cart, id);
    cart.items = (cart.items || []).filter(function (it) {
      return it.id !== id;
    });
    writeCart(cart);
    if (removing && isPointsExchangeItem(removing) && global.UaPointsMallOrder) {
      global.UaPointsMallOrder.removeFromShopCart(removing.pointsCode, removing.skuCode);
    }
    return cart;
  }

  function setLiveItemQty(id, qty, meta) {
    meta = meta || {};
    var liveCart = readLiveCart();
    var liveItem = findLiveItem(liveCart, id);
    var p = PRODUCTS[id];
    if (qty <= 0) {
      liveCart.items = liveCart.items.filter(function (it) {
        return it.id !== id;
      });
      writeLiveCart(liveCart);
      return liveCart;
    }
    if (liveItem) {
      liveItem.qty = qty;
      if (meta.price != null) liveItem.price = meta.price;
      if (meta.spec != null) liveItem.spec = meta.spec;
    } else {
      liveItem = {
        id: id,
        qty: qty,
        price: meta.price != null ? meta.price : getLivePrice(p),
        spec: meta.spec != null ? meta.spec : (getLiveSpecs(p)[0] && getLiveSpecs(p)[0].label) || (p && p.spec)
      };
      liveCart.items.push(liveItem);
    }
    writeLiveCart(liveCart);
    syncLiveItemToMallCart(liveItem);
    return liveCart;
  }

  function toggleItem(id, checked) {
    var cart = ensureCart();
    var item = findItem(cart, id);
    if (!item) return cart;
    item.checked = !!checked;
    writeCart(cart);
    return cart;
  }

  function toggleAll(checked) {
    var cart = ensureCart();
    (cart.items || []).forEach(function (item) {
      item.checked = !!checked;
    });
    writeCart(cart);
    return cart;
  }

  function clearCart() {
    var cart = ensureCart();
    cart.items = [];
    writeCart(cart);
    try {
      global.sessionStorage.removeItem('ua_points_mall_cart_v1');
    } catch (e) { /* ignore */ }
    return cart;
  }

  function getCheckoutItems() {
    /* 新人专区：立即购买草稿优先（不走购物车） */
    if (global.UaNewcomerZoneOrder && typeof global.UaNewcomerZoneOrder.getCheckoutItems === 'function') {
      var newcomerItems = global.UaNewcomerZoneOrder.getCheckoutItems();
      if (newcomerItems && newcomerItems.length) return newcomerItems;
    }
    var cart = ensureCart();
    return (cart.items || [])
      .filter(function (item) {
        return item.checked && (isPointsExchangeItem(item) || PRODUCTS[item.id]);
      })
      .map(function (item) {
        if (isPointsExchangeItem(item)) {
          var info = getCartItemMerchantInfo(item);
          return {
            id: item.id,
            name: item.name,
            fullName: item.name,
            spec: itemSpecText(item),
            price: itemUnitPrice(item),
            img: resolveCartAsset(item.img),
            watermark: false,
            qty: item.qty,
            fulfillType: info.fulfillType,
            merchantId: info.merchantId,
            merchantName: info.merchantName,
            isPointsExchange: true,
            points: Number(item.points) || 0,
            money: Number(item.money) || 0,
            exchangeType: item.exchangeType,
            pointsCode: item.pointsCode,
            skuCode: item.skuCode,
            category: item.category || '',
            deliveryText:
              info.fulfillType === 'express' ? '预计2-3天送达' : '按履约方式配送'
          };
        }
        var p = PRODUCTS[item.id];
        var mallInfo = getCartItemMerchantInfo(item);
        return {
          id: p.id,
          name: p.shortName || p.name,
          fullName: p.name,
          spec: itemSpecText(item),
          price: itemUnitPrice(item),
          img: p.img,
          watermark: p.watermark,
          qty: item.qty,
          fulfillType: mallInfo.fulfillType,
          merchantId: mallInfo.merchantId,
          merchantName: mallInfo.merchantName,
          isPointsExchange: false,
          category: p.category || '',
          deliveryText:
            mallInfo.fulfillType === 'express'
              ? (p.supplier && p.supplier.deliveryText) || '预计2-3天送达'
              : p.pickupBadge || STORE.pickupBadge || '后天可提'
        };
      });
  }

  function buildConfirmSplitOrders(items) {
    var groups = [];
    var map = {};
    (items || []).forEach(function (item) {
      var key = item.fulfillType + ':' + item.merchantId;
      if (!map[key]) {
        map[key] = {
          key: key,
          fulfillType: item.fulfillType,
          merchantId: item.merchantId,
          merchantName: item.merchantName,
          items: []
        };
        groups.push(map[key]);
      }
      map[key].items.push(item);
    });
    groups.sort(function (a, b) {
      if (a.fulfillType === b.fulfillType) {
        return String(a.merchantName).localeCompare(String(b.merchantName), 'zh');
      }
      return a.fulfillType === 'pickup' ? -1 : 1;
    });
    return groups.map(function (group, index) {
      var qty = group.items.reduce(function (sum, it) {
        return sum + (it.qty || 0);
      }, 0);
      return {
        key: group.key,
        fulfillType: group.fulfillType,
        merchantId: group.merchantId,
        merchantName: group.merchantName,
        packageNo: index + 1,
        packageLabel:
          group.fulfillType === 'express' ? '快递发货' : '门店自提',
        timeText: group.items[0] ? group.items[0].deliveryText : '',
        items: group.items,
        totalQty: qty
      };
    });
  }

  /** 直播确认单行 → 与全页确认订单一致的 checkout item */
  function mapProductLineToCheckoutItem(p, line) {
    line = line || {};
    if (!p) return null;
    var fulfillType = getProductFulfillType(p);
    var merchant = getProductMerchant(p);
    var merchantName =
      fulfillType === 'express'
        ? getSupplierDisplayName(merchant) || (merchant && merchant.name) || ''
        : (merchant && merchant.name) || STORE.name;
    return {
      id: p.id,
      name: p.shortName || p.name,
      fullName: p.name,
      spec: line.spec != null ? String(line.spec) : String(p.spec || ''),
      price: Number(line.price != null ? line.price : getLivePrice(p)),
      img: p.img,
      watermark: !!p.watermark,
      qty: Number(line.qty) > 0 ? Number(line.qty) : 1,
      fulfillType: fulfillType,
      merchantId: merchant && merchant.id ? merchant.id : STORE.id,
      merchantName: merchantName,
      isPointsExchange: false,
      deliveryText:
        fulfillType === 'express'
          ? (merchant && merchant.deliveryText) || '预计2-3天送达'
          : p.pickupBadge || STORE.pickupBadge || '后天可提'
    };
  }

  /** 确认订单金额/积分抵扣（全页与直播半遮罩共用） */
  function computeOrderConfirmPricing(items) {
    items = items || [];
    var splits = buildConfirmSplitOrders(items);
    var hasExpress = splits.some(function (s) {
      return s.fulfillType === 'express';
    });
    var hasPickup = splits.some(function (s) {
      return s.fulfillType === 'pickup';
    });
    var isNewcomerCheckout = items.some(function (it) {
      return !!it.isNewcomerExclusive;
    });
    var mallGoodsTotal = 0;
    var pointsExchangeCash = 0;
    var pointsExchangePts = 0;
    items.forEach(function (it) {
      if (it.isPointsExchange) {
        pointsExchangeCash += (Number(it.money) || 0) * (it.qty || 0);
        pointsExchangePts += (Number(it.points) || 0) * (it.qty || 0);
      } else {
        mallGoodsTotal += (Number(it.price) || 0) * (it.qty || 0);
      }
    });
    mallGoodsTotal = Math.round(mallGoodsTotal * 100) / 100;
    pointsExchangeCash = Math.round(pointsExchangeCash * 100) / 100;
    var goodsTotal = Math.round((mallGoodsTotal + pointsExchangeCash) * 100) / 100;
    var freight = 0;
    var cfg = global.MdmPointsMallConfig;
    var availablePts = (cfg && cfg.AVAILABLE_POINTS_DEMO) || 161;
    var ptsLeftForDeduct = Math.max(0, availablePts - pointsExchangePts);
    var deductInfo = isNewcomerCheckout
      ? {
          enabled: false,
          deductAmount: 0,
          pointsUsed: 0,
          eligibleAmount: 0,
          tip: '新人专区商品不支持积分抵扣'
        }
      : cfg && cfg.calcCashDeduction
        ? cfg.calcCashDeduction(
            items.filter(function (it) {
              return !it.isPointsExchange && !it.isNewcomerExclusive;
            }),
            ptsLeftForDeduct
          )
        : {
            enabled: false,
            deductAmount: 0,
            pointsUsed: 0,
            eligibleAmount: 0,
            tip: ''
          };
    if (pointsExchangePts > 0 && deductInfo.enabled) {
      deductInfo.tip =
        (deductInfo.deductAmount > 0
          ? '兑换已占 ' +
            pointsExchangePts +
            ' 积分，剩余可抵 ¥' +
            Number(deductInfo.deductAmount).toFixed(2)
          : '兑换已占 ' +
            pointsExchangePts +
            ' 积分，剩余积分不足抵现') +
        '（可用共 ' +
        availablePts +
        '）';
    }
    return {
      items: items,
      splits: splits,
      hasExpress: hasExpress,
      hasPickup: hasPickup,
      isNewcomerCheckout: isNewcomerCheckout,
      mallGoodsTotal: mallGoodsTotal,
      pointsExchangeCash: pointsExchangeCash,
      pointsExchangePts: pointsExchangePts,
      goodsTotal: goodsTotal,
      freight: freight,
      availablePts: availablePts,
      deductInfo: deductInfo,
      usePointsDeduct: !isNewcomerCheckout && !!deductInfo.enabled
    };
  }

  function formatConfirmPointsPrice(item) {
    var pts = Number(item.points) || 0;
    var cash = Number(item.money) || 0;
    if (cash > 0) return pts + '积分 + ' + formatMoney(cash);
    return pts + '积分';
  }

  function calcConfirmPayable(pricing, usePointsDeduct) {
    var d =
      usePointsDeduct && pricing.deductInfo && pricing.deductInfo.enabled
        ? pricing.deductInfo
        : { deductAmount: 0 };
    return Math.max(
      0,
      Math.round((pricing.goodsTotal + pricing.freight - (d.deductAmount || 0)) * 100) /
        100
    );
  }

  function getConfirmDeductDisplay(pricing, usePointsDeduct) {
    var deductInfo = pricing.deductInfo || {};
    var pointsExchangePts = pricing.pointsExchangePts || 0;
    var d =
      usePointsDeduct && deductInfo.enabled
        ? deductInfo
        : { deductAmount: 0, pointsUsed: 0 };
    var text = '未使用';
    var muted = true;
    if (!deductInfo.enabled || !(deductInfo.eligibleAmount > 0)) {
      text = deductInfo.tip || '不可用';
      muted = true;
    } else if (usePointsDeduct && d.deductAmount > 0) {
      text =
        pointsExchangePts > 0
          ? '已抵 ¥' +
            d.deductAmount.toFixed(2) +
            '（兑换已占' +
            pointsExchangePts +
            '积分）'
          : '已抵 ' + d.pointsUsed + '积分（-¥' + d.deductAmount.toFixed(2) + '）';
      muted = false;
    } else {
      text =
        pointsExchangePts > 0 && deductInfo.tip ? deductInfo.tip : '不使用抵扣';
      muted = true;
    }
    return {
      text: text,
      muted: muted,
      deductAmount: d.deductAmount || 0,
      pointsUsed: d.pointsUsed || 0,
      payable: calcConfirmPayable(pricing, usePointsDeduct)
    };
  }

  function formatConfirmPayLabel(pricing, payable) {
    var pts = pricing.pointsExchangePts || 0;
    if (pts > 0 && payable > 0) return pts + '积分 + ' + formatMoney(payable);
    if (pts > 0) return pts + '积分';
    return formatMoney(payable);
  }

  function escapeConfirmHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function maskShippingPhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.length >= 7) {
      return digits.slice(0, 3) + '****' + digits.slice(-4);
    }
    return String(phone || '');
  }

  function readConfirmShippingAddress() {
    try {
      var raw = sessionStorage.getItem(CONFIRM_SHIPPING_ADDR_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.full) {
          return {
            contact: parsed.contact || DEFAULT_SHIPPING_ADDRESS.contact,
            phone: parsed.phone || DEFAULT_SHIPPING_ADDRESS.phone,
            full: parsed.full
          };
        }
      }
    } catch (e) {
      /* ignore */
    }
    return {
      contact: DEFAULT_SHIPPING_ADDRESS.contact,
      phone: DEFAULT_SHIPPING_ADDRESS.phone,
      full: DEFAULT_SHIPPING_ADDRESS.full
    };
  }

  function writeConfirmShippingAddress(addr) {
    if (!addr || !addr.full) return;
    try {
      sessionStorage.setItem(
        CONFIRM_SHIPPING_ADDR_KEY,
        JSON.stringify({
          contact: addr.contact || DEFAULT_SHIPPING_ADDRESS.contact,
          phone: addr.phone || DEFAULT_SHIPPING_ADDRESS.phone,
          full: addr.full
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function applyPickedAddressForConfirm() {
    try {
      var raw = sessionStorage.getItem('ua_refund_picked_address');
      if (!raw) return false;
      var picked = JSON.parse(raw);
      sessionStorage.removeItem('ua_refund_picked_address');
      if (!picked || !picked.full) return false;
      writeConfirmShippingAddress({
        contact: picked.contact || DEFAULT_SHIPPING_ADDRESS.contact,
        phone:
          maskShippingPhone(picked.phone) ||
          picked.phone ||
          DEFAULT_SHIPPING_ADDRESS.phone,
        full: picked.full
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function openConfirmAddressBook() {
    var returnTo = 'order-confirm.html' + (window.location.search || '');
    window.location.href =
      'order-refund-address-book.html?addrFrom=order_confirm&from=' +
      encodeURIComponent(returnTo);
  }

  /**
   * 确认订单共用内容（全页 / 直播半遮罩）
   * @returns {{ html: string, pricing: object, payable: number, splits: array, hasExpress: boolean, hasPickup: boolean }}
   */
  function buildSharedOrderConfirmView(items, remarks, pricing, usePointsDeduct) {
    remarks = remarks || {};
    items = items || [];
    pricing = pricing || computeOrderConfirmPricing(items);
    if (usePointsDeduct == null) usePointsDeduct = pricing.usePointsDeduct;
    var splits = pricing.splits;
    var hasExpress = pricing.hasExpress;
    var hasPickup = pricing.hasPickup;
    var freight = pricing.freight;
    var goodsTotal = pricing.goodsTotal;
    var pointsExchangePts = pricing.pointsExchangePts || 0;
    var deductDisp = getConfirmDeductDisplay(pricing, usePointsDeduct);
    var payable = deductDisp.payable;
    var couponText = pricing.isNewcomerCheckout
      ? '新人专区不可用券'
      : '暂无可用优惠券';
    var shippingAddr = readConfirmShippingAddress();

    var shopIcon =
      '<svg class="ua-confirm-split__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>';
    var chevron =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
    var rowChevron =
      '<svg class="ua-confirm-row__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

    function renderItemRow(item) {
      var nameHtml = item.isNewcomerExclusive
        ? '<span class="ua-cart-item__tag">新人专享</span>' + item.name
        : item.isPointsExchange
          ? '<span class="ua-cart-item__tag">积分兑换</span>' + item.name
          : item.name;
      var priceHtml = item.isPointsExchange
        ? formatConfirmPointsPrice(item)
        : formatMoney(item.price);
      return (
        '<div class="ua-confirm-item' +
        (item.isPointsExchange ? ' ua-confirm-item--points' : '') +
        (item.isNewcomerExclusive ? ' ua-confirm-item--newcomer' : '') +
        '">' +
        '<div class="ua-confirm-item__thumb">' +
        '<img src="' +
        item.img +
        '" alt="">' +
        (item.watermark
          ? '<span class="ua-shop-watermark ua-shop-watermark--sm">生产验证商品<br>请勿下单</span>'
          : '') +
        '</div>' +
        '<div class="ua-confirm-item__body">' +
        '<div class="ua-confirm-item__name">' +
        nameHtml +
        '</div>' +
        '<span class="ua-confirm-item__spec">' +
        item.spec +
        '</span>' +
        '<div class="ua-confirm-item__bottom">' +
        '<span class="ua-confirm-item__price' +
        (item.isPointsExchange ? ' ua-confirm-item__price--points' : '') +
        '">' +
        priceHtml +
        '</span>' +
        '<span class="ua-confirm-item__qty">x' +
        item.qty +
        '</span></div></div></div>'
      );
    }

    function renderPkgBody(split) {
      if (split.items.length === 1) return renderItemRow(split.items[0]);
      var thumbs = split.items
        .slice(0, 4)
        .map(function (item) {
          return (
            '<div class="ua-confirm-pkg__thumb"><img src="' +
            item.img +
            '" alt=""></div>'
          );
        })
        .join('');
      return (
        '<div class="ua-confirm-pkg__multi">' +
        '<div class="ua-confirm-pkg__thumbs">' +
        thumbs +
        '</div>' +
        '<button type="button" class="ua-confirm-pkg__count" data-expand-split="' +
        split.key +
        '">共' +
        split.totalQty +
        '件' +
        chevron +
        '</button></div>' +
        '<div class="ua-confirm-pkg__detail" data-split-detail="' +
        split.key +
        '" hidden>' +
        split.items.map(renderItemRow).join('') +
        '</div>'
      );
    }

    var pickupStoreHtml = hasPickup
      ? '<div class="ua-confirm-split__store">' +
        '<div class="ua-confirm-split__store-label">自提门店</div>' +
        '<div class="ua-confirm-split__store-name">' +
        STORE.name +
        '</div>' +
        '<p class="ua-confirm-split__store-addr">' +
        STORE.address +
        '</p>' +
        '<div class="ua-confirm-split__store-meta">' +
        STORE.contact +
        ' · 距您' +
        (STORE.distance || '180m') +
        '</div></div>'
      : '';

    var pickupStoreShown = false;
    var splitsHtml = splits
      .map(function (split) {
        var tagClass =
          split.fulfillType === 'express'
            ? 'ua-confirm-split__tag--express'
            : 'ua-confirm-split__tag--pickup';
        var tagText = split.fulfillType === 'express' ? '快递到家' : '门店自提';
        var storeBlock = '';
        if (split.fulfillType === 'pickup' && !pickupStoreShown) {
          storeBlock = pickupStoreHtml;
          pickupStoreShown = true;
        }
        return (
          '<section class="ua-confirm-split" data-split-key="' +
          split.key +
          '">' +
          '<div class="ua-confirm-split__head">' +
          shopIcon +
          '<span class="ua-confirm-split__name">' +
          split.merchantName +
          '</span>' +
          '<span class="ua-confirm-split__tag ' +
          tagClass +
          '">' +
          tagText +
          '</span></div>' +
          storeBlock +
          '<div class="ua-confirm-pkg">' +
          '<div class="ua-confirm-pkg__head">' +
          '<span class="ua-confirm-pkg__label">包裹' +
          split.packageNo +
          '（' +
          split.packageLabel +
          '）</span>' +
          '<span class="ua-confirm-pkg__time">' +
          split.timeText +
          (split.fulfillType === 'express' ? ' · 免运费' : '') +
          '</span></div>' +
          renderPkgBody(split) +
          '<div class="ua-confirm-pkg__remark">' +
          '<span class="ua-confirm-pkg__remark-label">备注</span>' +
          '<input type="text" class="ua-confirm-pkg__remark-input" data-remark-split="' +
          split.key +
          '" placeholder="填写备注（50字以内）" maxlength="50" value="' +
          (remarks[split.key] || '') +
          '">' +
          '</div></div></section>'
        );
      })
      .join('');

    var addressHtml = hasExpress
      ? '<button type="button" class="ua-confirm-card ua-confirm-address" data-confirm-address aria-label="变更收货地址">' +
        '<span class="ua-confirm-address__pin" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>' +
        '</span>' +
        '<div class="ua-confirm-address__body">' +
        '<div class="ua-confirm-address__user"><span>' +
        escapeConfirmHtml(shippingAddr.contact) +
        '</span><span>' +
        escapeConfirmHtml(shippingAddr.phone) +
        '</span></div>' +
        '<p class="ua-confirm-address__text">' +
        escapeConfirmHtml(shippingAddr.full) +
        '</p>' +
        '</div>' +
        '<svg class="ua-confirm-address__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
        '</button>'
      : '';

    var optionsHtml =
      '<section class="ua-confirm-card ua-confirm-options">' +
      '<button type="button" class="ua-confirm-row" data-confirm-invoice>' +
      '<span class="ua-confirm-row__label">发票抬头</span>' +
      '<span class="ua-confirm-row__value">不开发票</span>' +
      rowChevron +
      '</button>' +
      '<button type="button" class="ua-confirm-row" data-confirm-coupon>' +
      '<span class="ua-confirm-row__label">优惠券</span>' +
      '<span class="ua-confirm-row__value ua-confirm-row__value--muted" data-confirm-coupon-text>' +
      couponText +
      '</span>' +
      rowChevron +
      '</button>' +
      '<button type="button" class="ua-confirm-row" data-confirm-points>' +
      '<span class="ua-confirm-row__label">积分抵扣</span>' +
      '<span class="ua-confirm-row__value' +
      (deductDisp.muted ? ' ua-confirm-row__value--muted' : '') +
      '" data-confirm-points-text>' +
      deductDisp.text +
      '</span>' +
      rowChevron +
      '</button></section>';

    var summaryHtml =
      '<section class="ua-confirm-card ua-confirm-summary">' +
      '<div class="ua-confirm-summary__row"><span>商品总价</span><span data-confirm-goods-total>' +
      formatMoney(goodsTotal) +
      '</span></div>' +
      '<div class="ua-confirm-summary__row" data-confirm-exchange-row' +
      (pointsExchangePts > 0 ? '' : ' hidden') +
      '><span>积分兑换</span><span data-confirm-exchange-pts>' +
      pointsExchangePts +
      '积分</span></div>' +
      '<div class="ua-confirm-summary__row"><span class="ua-confirm-summary__label">运费' +
      '<button type="button" class="ua-confirm-summary__help" data-confirm-freight-help aria-label="运费说明">i</button></span>' +
      '<span data-confirm-freight>' +
      (freight > 0 ? formatMoney(freight) : '免运费') +
      '</span></div>' +
      '<div class="ua-confirm-summary__row"><span>优惠券</span><span class="ua-confirm-summary__discount" data-confirm-coupon-discount>-¥0.00</span></div>' +
      '<div class="ua-confirm-summary__row" data-confirm-deduct-summary-row' +
      (deductDisp.deductAmount > 0 ? '' : ' hidden') +
      '><span>积分抵扣</span><span class="ua-confirm-summary__discount" data-confirm-deduct-amount>-¥' +
      Number(deductDisp.deductAmount || 0).toFixed(2) +
      '</span></div>' +
      '<div class="ua-confirm-summary__row ua-confirm-summary__row--total"><span>合计</span><strong data-confirm-sum>' +
      formatConfirmPayLabel(pricing, payable) +
      '</strong></div></section>';

    var agreeHtml =
      '<label class="ua-confirm-agree">' +
      '<button type="button" class="ua-shop-check is-checked" data-confirm-agree aria-checked="true"></button>' +
      '<span>我已阅读并同意《交易服务协议》</span></label>';

    return {
      html: addressHtml + splitsHtml + optionsHtml + summaryHtml + agreeHtml,
      pricing: pricing,
      goodsTotal: goodsTotal,
      freight: freight,
      payable: payable,
      usePointsDeduct: usePointsDeduct,
      hasExpress: hasExpress,
      hasPickup: hasPickup,
      splits: splits
    };
  }

  function syncSharedOrderConfirmAmounts(host, pricing, usePointsDeduct, payEls) {
    if (!host || !pricing) return calcConfirmPayable(pricing, usePointsDeduct);
    var disp = getConfirmDeductDisplay(pricing, usePointsDeduct);
    var payable = disp.payable;
    var goodsEl = host.querySelector('[data-confirm-goods-total]');
    if (goodsEl) goodsEl.textContent = formatMoney(pricing.goodsTotal);
    var freightEl = host.querySelector('[data-confirm-freight]');
    if (freightEl) {
      freightEl.textContent =
        pricing.freight > 0 ? formatMoney(pricing.freight) : '免运费';
    }
    var couponEl = host.querySelector('[data-confirm-coupon-discount]');
    if (couponEl) couponEl.textContent = '-¥0.00';
    var exchangeRow = host.querySelector('[data-confirm-exchange-row]');
    var exchangePtsEl = host.querySelector('[data-confirm-exchange-pts]');
    if (exchangeRow) exchangeRow.hidden = !(pricing.pointsExchangePts > 0);
    if (exchangePtsEl) {
      exchangePtsEl.textContent = (pricing.pointsExchangePts || 0) + '积分';
    }
    var deductRow = host.querySelector('[data-confirm-deduct-summary-row]');
    var deductAmt = host.querySelector('[data-confirm-deduct-amount]');
    if (deductRow) deductRow.hidden = !(disp.deductAmount > 0);
    if (deductAmt) {
      deductAmt.textContent = '-¥' + Number(disp.deductAmount || 0).toFixed(2);
    }
    var deductText = host.querySelector('[data-confirm-points-text]');
    if (deductText) {
      deductText.textContent = disp.text;
      deductText.classList.toggle('ua-confirm-row__value--muted', disp.muted);
    }
    var sumEl = host.querySelector('[data-confirm-sum]');
    if (sumEl) sumEl.textContent = formatConfirmPayLabel(pricing, payable);
    var payLabel = formatConfirmPayLabel(pricing, payable);
    (payEls || []).forEach(function (el) {
      if (!el) return;
      el.innerHTML = payLabel;
    });
    var sheetAmount = document.getElementById('confirmPaySheetAmount');
    if (sheetAmount) {
      var pts = pricing.pointsExchangePts || 0;
      sheetAmount.textContent =
        pts > 0 && payable > 0
          ? '扣 ' + pts + '积分，付 ' + formatMoney(payable)
          : payable > 0
            ? formatMoney(payable)
            : pts > 0
              ? '扣除 ' + pts + '积分'
              : formatMoney(0);
    }
    return payable;
  }

  function bindSharedOrderConfirmInteractions(host, view, remarks, hooks) {
    if (!host || !view) return;
    remarks = remarks || {};
    hooks = hooks || {};
    host.querySelectorAll('[data-remark-split]').forEach(function (input) {
      input.addEventListener('input', function () {
        remarks[input.getAttribute('data-remark-split')] = input.value || '';
      });
    });
    host.querySelectorAll('[data-expand-split]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-expand-split');
        var detail = host.querySelector('[data-split-detail="' + key + '"]');
        if (!detail) return;
        var open = detail.hidden;
        detail.hidden = !open;
        var group = (view.splits || []).find(function (s) {
          return s.key === key;
        });
        var chevron =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
        btn.innerHTML =
          (open ? '收起' : '共' + (group ? group.totalQty : '') + '件') + chevron;
      });
    });
    var addr = host.querySelector('[data-confirm-address]');
    if (addr) {
      addr.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (hooks.onAddress) {
          hooks.onAddress();
          return;
        }
        openConfirmAddressBook();
      });
    }
    var invoice = host.querySelector('[data-confirm-invoice]');
    if (invoice) {
      invoice.addEventListener('click', function () {
        showToast('发票设置（演示）');
      });
    }
    var coupon = host.querySelector('[data-confirm-coupon]');
    if (coupon) {
      coupon.addEventListener('click', function () {
        if (hooks.onCoupon) hooks.onCoupon();
        else if (view.pricing && view.pricing.isNewcomerCheckout) {
          showToast('新人专区商品不支持用券');
        } else showToast('暂无可用优惠券');
      });
    }
    var points = host.querySelector('[data-confirm-points]');
    if (points) {
      points.addEventListener('click', function () {
        if (hooks.onPointsDeduct) hooks.onPointsDeduct();
        else showToast('积分抵扣（演示）');
      });
    }
    var freightHelp = host.querySelector('[data-confirm-freight-help]');
    if (freightHelp) {
      freightHelp.addEventListener('click', function () {
        showToast(view.hasExpress ? '快递订单满额包邮（演示）' : '自提订单无需运费');
      });
    }
    var agree = host.querySelector('[data-confirm-agree]');
    if (agree) {
      agree.addEventListener('click', function () {
        var next = !agree.classList.contains('is-checked');
        agree.classList.toggle('is-checked', next);
        agree.setAttribute('aria-checked', next ? 'true' : 'false');
      });
    }
  }

  function getLivePrice(p) {
    if (!p) return 0;
    return p.livePrice != null ? p.livePrice : p.price;
  }

  function getLiveSpecs(p) {
    if (p && p.liveSpecs && p.liveSpecs.length) return p.liveSpecs;
    return [{ label: String(p.spec || ''), price: getLivePrice(p) }];
  }

  function showToast(msg) {
    var el = document.getElementById('uaShopToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'uaShopToast';
      el.className = 'ua-shop-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  var MALL_CATEGORIES = [
    { id: 'daily', name: '日用百货', img: '../assets/shop/cat-daily.svg', products: ['beef-tendon'] },
    { id: 'meat', name: '肉禽蛋品', img: '../assets/shop/cat-meat.svg', products: ['beef-tendon', 'duck-mix'] },
    { id: 'dairy', name: '乳品烘焙', img: '../assets/shop/cat-dairy.svg', products: ['wonton-corn', 'dumpling'] },
    { id: 'seafood', name: '水产生鲜', img: '../assets/shop/cat-seafood.svg', products: ['wonton-pork', 'duck-mix'] },
    { id: 'veg', name: '蔬菜水果', img: '../assets/shop/cat-veg.svg', products: ['wonton-pork', 'wonton-corn'] },
    { id: 'snack', name: '休闲零食', img: '../assets/shop/cat-snack.svg', products: ['dumpling', 'wonton-corn'] },
    { id: 'grain', name: '粮油调味', img: '../assets/shop/cat-grain.svg', products: ['duck-mix', 'dumpling'] },
    {
      id: 'test',
      name: '生产测试商',
      img: '../assets/shop/cat-test.svg',
      products: ['dumpling', 'wonton-pork', 'wonton-corn', 'duck-mix']
    }
  ];

  function getMallCategory(id) {
    return (
      MALL_CATEGORIES.find(function (c) {
        return c.id === id;
      }) || MALL_CATEGORIES[MALL_CATEGORIES.length - 1]
    );
  }

  function initMallPage() {
    ensureCart();
    syncBadges();

    var scroll = document.getElementById('mallScroll');
    var head = document.getElementById('mallHead');
    var page = document.querySelector('.ua-mall-page');
    if (scroll && head) {
      var onScroll = function () {
        var compact = scroll.scrollTop > 40;
        head.classList.toggle('is-compact', compact);
        if (page) page.classList.toggle('is-compact', compact);
      };
      scroll.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    document.querySelectorAll('.ua-mall-subtab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.ua-mall-subtab').forEach(function (t) {
          t.classList.remove('is-active');
        });
        tab.classList.add('is-active');
      });
    });

    document.querySelectorAll('.ua-mall-cat[data-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-cat') || 'test';
        window.location.href = 'category.html?cat=' + encodeURIComponent(cat);
      });
    });

    document.querySelectorAll('[data-add-product]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = btn.getAttribute('data-add-product');
        addToCart(id, 1);
        var cart = ensureCart();
        var item = findItem(cart, id);
        if (item && item.qty > 0) {
          btn.classList.add('is-qty');
          btn.textContent = 'x' + item.qty;
        }
        showToast('已加入购物车');
        syncMallAddButtons();
      });
    });

    syncMallAddButtons();

    document.querySelectorAll('[data-goods-id]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('[data-add-product]')) return;
        var id = card.getAttribute('data-goods-id');
        window.location.href = 'goods-detail.html?id=' + encodeURIComponent(id);
      });
    });

    var searchBtn = document.getElementById('mallSearchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        showToast('搜索功能演示');
      });
    }
  }

  function initCategoryPage() {
    ensureCart();
    syncBadges();

    var params = new URLSearchParams(window.location.search);
    var state = {
      catId: params.get('cat') || 'test',
      sort: 'default',
      priceDir: 'asc',
      keyword: ''
    };

    var topnav = document.getElementById('catTopnav');
    var allGrid = document.getElementById('catAllGrid');
    var listEl = document.getElementById('catProductList');
    var emptyEl = document.getElementById('catEmpty');
    var titleEl = document.getElementById('catTitle');
    var salesBtn = document.getElementById('catSortSales');
    var priceBtn = document.getElementById('catSortPrice');
    var searchInput = document.getElementById('catSearchInput');
    var allPanel = document.getElementById('catAllPanel');
    var cartTotalEl = document.getElementById('catCartTotal');
    var checkoutBtn = document.getElementById('catCheckoutBtn');
    var backEl = document.getElementById('catBack');
    if (backEl) backEl.setAttribute('href', 'mall.html');

    var cartIconSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.2 11h9.6L19 8H7"/></svg>';

    function syncCartBar() {
      var cart = ensureCart();
      var total = 0;
      var count = 0;
      (cart.items || []).forEach(function (item) {
        if (!PRODUCTS[item.id]) return;
        total += itemUnitPrice(item) * (item.qty || 0);
        count += item.qty || 0;
      });
      if (cartTotalEl) cartTotalEl.textContent = formatMoney(total);
      if (checkoutBtn) checkoutBtn.disabled = count <= 0;
      syncBadges();
    }

    function formatCatPrice(price) {
      var n = Number(price || 0).toFixed(2);
      var parts = n.split('.');
      return (
        '<small>¥</small>' +
        parts[0] +
        '<span class="ua-cat-item__decimal">.' +
        parts[1] +
        '</span>'
      );
    }

    function getCategoryProducts() {
      var cat = getMallCategory(state.catId);
      var list = (cat.products || [])
        .map(function (id) {
          return PRODUCTS[id];
        })
        .filter(Boolean);
      var kw = String(state.keyword || '').trim().toLowerCase();
      if (kw) {
        list = list.filter(function (p) {
          return String(p.shortName || p.name || '')
            .toLowerCase()
            .indexOf(kw) >= 0;
        });
      }
      if (state.sort === 'price') {
        list = list.slice().sort(function (a, b) {
          var d = Number(a.price) - Number(b.price);
          return state.priceDir === 'desc' ? -d : d;
        });
      } else if (state.sort === 'sales') {
        list = list.slice().sort(function (a, b) {
          return Number(b.sold || 0) - Number(a.sold || 0);
        });
      }
      return list;
    }

    function renderTopnav() {
      if (!topnav) return;
      topnav.innerHTML = MALL_CATEGORIES.map(function (cat) {
        return (
          '<button type="button" class="ua-cat-topitem' +
          (cat.id === state.catId ? ' is-active' : '') +
          '" data-cat="' +
          cat.id +
          '" role="tab" aria-selected="' +
          (cat.id === state.catId ? 'true' : 'false') +
          '">' +
          '<img class="ua-cat-topitem__img" src="' +
          cat.img +
          '" alt="">' +
          '<span class="ua-cat-topitem__label">' +
          cat.name +
          '</span></button>'
        );
      }).join('');
      topnav.querySelectorAll('[data-cat]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectCategory(btn.getAttribute('data-cat'));
        });
      });
      var active = topnav.querySelector('.ua-cat-topitem.is-active');
      if (active && typeof active.scrollIntoView === 'function') {
        active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }

    function renderAllGrid() {
      if (!allGrid) return;
      allGrid.innerHTML = MALL_CATEGORIES.map(function (cat) {
        return (
          '<button type="button" class="ua-cat-all-panel__item' +
          (cat.id === state.catId ? ' is-active' : '') +
          '" data-cat="' +
          cat.id +
          '">' +
          '<img src="' +
          cat.img +
          '" alt="">' +
          '<span>' +
          cat.name +
          '</span></button>'
        );
      }).join('');
      allGrid.querySelectorAll('[data-cat]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectCategory(btn.getAttribute('data-cat'));
          closeAllPanel();
        });
      });
    }

    function renderProducts() {
      var cat = getMallCategory(state.catId);
      if (titleEl) titleEl.textContent = cat.name;
      document.title = cat.name + ' · 分类 · 用户 APP';
      var list = getCategoryProducts();
      var cart = ensureCart();
      if (emptyEl) emptyEl.hidden = list.length > 0;
      if (!listEl) return;
      listEl.innerHTML = list
        .map(function (p) {
          var item = findItem(cart, p.id);
          var qty = item && item.qty ? item.qty : 0;
          return (
            '<article class="ua-cat-item" data-goods-id="' +
            p.id +
            '">' +
            '<div class="ua-cat-item__img">' +
            '<img src="' +
            p.img +
            '" alt="' +
            (p.shortName || p.name) +
            '">' +
            (p.watermark
              ? '<span class="ua-shop-watermark ua-shop-watermark--sm">生产验证商品<br>请勿下单</span>'
              : '') +
            '</div>' +
            '<div class="ua-cat-item__body">' +
            '<h3 class="ua-cat-item__name">' +
            (p.shortName || p.name) +
            '</h3>' +
            '<div class="ua-cat-item__foot">' +
            '<span class="ua-cat-item__price">' +
            formatCatPrice(p.price) +
            '</span>' +
            '<button type="button" class="ua-cat-item__add' +
            (qty > 0 ? ' is-qty' : '') +
            '" data-add-product="' +
            p.id +
            '" aria-label="加入购物车">' +
            (qty > 0 ? 'x' + qty : cartIconSvg) +
            '</button></div></div></article>'
          );
        })
        .join('');

      listEl.querySelectorAll('[data-add-product]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var id = btn.getAttribute('data-add-product');
          addToCart(id, 1);
          showToast('已加入购物车');
          renderProducts();
          syncCartBar();
        });
      });
      listEl.querySelectorAll('[data-goods-id]').forEach(function (row) {
        row.addEventListener('click', function (e) {
          if (e.target.closest('[data-add-product]')) return;
          var id = row.getAttribute('data-goods-id');
          window.location.href =
            'goods-detail.html?id=' + encodeURIComponent(id) + '&from=category.html%3Fcat%3D' + encodeURIComponent(state.catId);
        });
      });
    }

    function syncSortUI() {
      if (salesBtn) salesBtn.classList.toggle('is-active', state.sort === 'sales');
      if (priceBtn) {
        priceBtn.classList.toggle('is-active', state.sort === 'price');
        if (state.sort === 'price') priceBtn.setAttribute('data-price-dir', state.priceDir);
        else priceBtn.removeAttribute('data-price-dir');
      }
    }

    function selectCategory(catId) {
      state.catId = catId || state.catId;
      if (!getMallCategory(state.catId)) state.catId = 'test';
      var url = new URL(window.location.href);
      url.searchParams.set('cat', state.catId);
      window.history.replaceState({}, '', url.toString());
      renderTopnav();
      renderAllGrid();
      renderProducts();
    }

    function openAllPanel() {
      if (allPanel) allPanel.hidden = false;
      renderAllGrid();
    }

    function closeAllPanel() {
      if (allPanel) allPanel.hidden = true;
    }

    if (salesBtn) {
      salesBtn.addEventListener('click', function () {
        state.sort = 'sales';
        syncSortUI();
        renderProducts();
      });
    }
    if (priceBtn) {
      priceBtn.addEventListener('click', function () {
        if (state.sort === 'price') {
          state.priceDir = state.priceDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort = 'price';
          state.priceDir = 'asc';
        }
        syncSortUI();
        renderProducts();
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.keyword = searchInput.value || '';
        renderProducts();
      });
    }
    document.getElementById('catAllBtn') &&
      document.getElementById('catAllBtn').addEventListener('click', openAllPanel);
    document.getElementById('catAllClose') &&
      document.getElementById('catAllClose').addEventListener('click', closeAllPanel);
    document.getElementById('catAllMask') &&
      document.getElementById('catAllMask').addEventListener('click', closeAllPanel);
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        if (checkoutBtn.disabled) {
          showToast('请先添加商品');
          return;
        }
        window.location.href = 'cart.html';
      });
    }

    window.addEventListener('ua-shop-cart-change', function () {
      renderProducts();
      syncCartBar();
    });

    renderTopnav();
    renderAllGrid();
    syncSortUI();
    renderProducts();
    syncCartBar();
  }

  function getProductFulfillType(product) {
    return product && product.fulfillType === 'express' ? 'express' : 'pickup';
  }

  function getProductMerchant(product) {
    if (getProductFulfillType(product) === 'express') {
      return product.supplier || SUPPLIER_LENGFENG;
    }
    return product.store || STORE;
  }

  function initGoodsDetailPage() {
    ensureCart();
    syncBadges();
    var params = new URLSearchParams(window.location.search);
    var product = getProduct(params.get('id') || 'beef-tendon');
    var selectedSpec = product.defaultSpec || (product.specs && product.specs[0]) || product.spec;
    var sheetIntent = 'pick';
    var fulfillType = getProductFulfillType(product);
    var merchant = getProductMerchant(product);

    var from = params.get('from') || 'mall.html';
    var fromLive = String(from).indexOf('live-room') >= 0;
    var livePreview = fromLive && isLivePreview();
    var back = document.getElementById('goodsDetailBack');
    if (back) back.setAttribute('href', from);

    function setText(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    function openSheet(name) {
      var sheet = document.getElementById(
        name === 'fulfill' ? 'goodsDetailFulfillSheet' : 'goodsDetailSpecSheet'
      );
      if (sheet) sheet.hidden = false;
    }

    function closeSheet(name) {
      if (!name || name === 'spec') {
        var specSheet = document.getElementById('goodsDetailSpecSheet');
        if (specSheet) specSheet.hidden = true;
        sheetIntent = 'pick';
      }
      if (!name || name === 'fulfill') {
        var fulfillSheet = document.getElementById('goodsDetailFulfillSheet');
        if (fulfillSheet) fulfillSheet.hidden = true;
      }
    }

    function renderFulfillSheet() {
      var list = document.getElementById('goodsDetailFulfillList');
      if (!list) return;
      var items =
        fulfillType === 'express'
          ? [
              {
                title: '快递配送',
                desc:
                  '本商品由供应商发货，经快递送达。发货仓：' +
                  (merchant.warehouse || '冷丰中央仓') +
                  '；' +
                  (merchant.deliveryText || '预计3天内发货') +
                  '。'
              },
              {
                title: '供应商',
                desc:
                  (getSupplierDisplayName(merchant) || merchant.name || '供应商') +
                  '（' +
                  (merchant.meta || '') +
                  '）负责备货与发货。'
              },
              {
                title: '售后说明',
                desc: '签收后如有质量问题，可按订单售后流程申请退换货。'
              }
            ]
          : [
              {
                title: '门店自提',
                desc:
                  '本商品支持到店自提。提货点：' +
                  (merchant.name || product.pickupStore || STORE.name) +
                  '；' +
                  (product.pickupBadge || merchant.pickupBadge || '后天可提') +
                  '。'
              },
              {
                title: '门店信息',
                desc:
                  (merchant.address || STORE.address) +
                  '；联系人 ' +
                  (merchant.contact || STORE.contact) +
                  '。'
              },
              {
                title: '提货说明',
                desc: '下单成功后按提货时间到店核销取货，请携带下单手机号或提货码。'
              }
            ];
      list.innerHTML = items
        .map(function (item) {
          return (
            '<div class="ua-gd-fulfill-item">' +
            '<div class="ua-gd-fulfill-item__title">' +
            item.title +
            '</div>' +
            '<div class="ua-gd-fulfill-item__desc">' +
            item.desc +
            '</div></div>'
          );
        })
        .join('');
    }

    function renderMerchant() {
      var avatar = document.getElementById('goodsDetailMerchantAvatar');
      if (avatar) avatar.src = merchant.avatar || STORE.avatar;
      setText(
        'goodsDetailMerchantName',
        fulfillType === 'express'
          ? getSupplierDisplayName(merchant) || merchant.name || '供应商'
          : merchant.name || '门店'
      );
      setText(
        'goodsDetailMerchantMeta',
        merchant.meta ||
          (fulfillType === 'express'
            ? '平台严选供应商'
            : '4.9分 · 距您' + (product.distance || STORE.distance || '180m'))
      );
    }

    function renderFulfillBlocks() {
      var badge = product.pickupBadge || STORE.pickupBadge || '后天可提';
      if (fulfillType === 'express') {
        setText('goodsDetailFulfillText', '快递 · ' + (merchant.deliveryText || '预计3天内发货'));
      } else {
        setText('goodsDetailFulfillText', '自提 · ' + badge);
      }
      renderMerchant();
    }

    function renderBase() {
      document.title = (product.shortName || product.name) + ' · 用户 APP';
      var hero = document.getElementById('goodsDetailHero');
      if (hero) hero.src = product.img;
      var detailImg = document.getElementById('goodsDetailDetailImg');
      if (detailImg) detailImg.src = product.detailImg || product.img;

      var tags = document.getElementById('goodsDetailTags');
      if (tags) {
        tags.innerHTML = (product.heroTags || [])
          .map(function (t) {
            return '<span class="ua-gd-hero__tag"><i></i>' + t + '</span>';
          })
          .join('');
      }

      var priceEl = document.getElementById('goodsDetailPrice');
      if (priceEl) {
        priceEl.innerHTML = fromLive
          ? liveGoodsPriceHtml(product)
          : '<small>¥</small>' + formatPriceLabel(product.price);
      }
      var originEl = document.getElementById('goodsDetailOrigin');
      if (originEl) {
        if (fromLive) {
          originEl.hidden = true;
        } else if (product.originPrice) {
          originEl.hidden = false;
          originEl.textContent = '¥' + formatPriceLabel(product.originPrice);
        } else {
          originEl.hidden = true;
        }
      }
      var previewBadge = document.getElementById('goodsDetailPreviewBadge');
      if (previewBadge) previewBadge.hidden = !livePreview;
      var addBtn = document.getElementById('goodsDetailAddCart');
      var buyBtn = document.getElementById('goodsDetailBuyNow');
      var soonBtn = document.getElementById('goodsDetailSoon');
      if (addBtn) addBtn.hidden = !!livePreview;
      if (buyBtn) buyBtn.hidden = !!livePreview;
      if (soonBtn) soonBtn.hidden = !livePreview;
      setText('goodsDetailSold', '已售' + (product.sold || 0));
      setText('goodsDetailTitle', product.name);
      setText('goodsDetailService', product.serviceText || '坏了包退 三天内到货');
      setText('goodsDetailSpecValue', selectedSpec);
      setText('goodsDetailSpecCount', String((product.specs || []).length || 1));
      setText('goodsDetailReviewCount', String(product.reviewCount || 0));
      renderFulfillBlocks();
    }

    function openSpecSheet(intent) {
      sheetIntent = intent || 'pick';
      var list = document.getElementById('goodsDetailSpecList');
      if (list) {
        list.innerHTML = (product.specs || [selectedSpec])
          .map(function (spec) {
            return (
              '<button type="button" class="ua-gd-sheet__chip' +
              (spec === selectedSpec ? ' is-active' : '') +
              '" data-spec="' +
              spec +
              '">' +
              spec +
              '</button>'
            );
          })
          .join('');
        list.querySelectorAll('[data-spec]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            selectedSpec = btn.getAttribute('data-spec');
            list.querySelectorAll('[data-spec]').forEach(function (b) {
              b.classList.toggle('is-active', b.getAttribute('data-spec') === selectedSpec);
            });
          });
        });
      }
      var confirmBtn = document.getElementById('goodsDetailSpecConfirm');
      if (confirmBtn) {
        if (sheetIntent === 'cart') confirmBtn.textContent = '加入购物车';
        else if (sheetIntent === 'buy') confirmBtn.textContent = '立即购买';
        else confirmBtn.textContent = '确定';
      }
      openSheet('spec');
    }

    function addCurrentToCart() {
      addToCart(product.id, 1);
      syncBadges();
      showToast('已加入购物车');
    }

    renderBase();

    document.getElementById('goodsDetailFulfillRow') &&
      document.getElementById('goodsDetailFulfillRow').addEventListener('click', function () {
        renderFulfillSheet();
        openSheet('fulfill');
      });

    document.getElementById('goodsDetailSpecRow') &&
      document.getElementById('goodsDetailSpecRow').addEventListener('click', function () {
        openSpecSheet('pick');
      });

    document.querySelectorAll('[data-gd-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-gd-close'));
      });
    });

    document.getElementById('goodsDetailSpecConfirm') &&
      document.getElementById('goodsDetailSpecConfirm').addEventListener('click', function () {
        setText('goodsDetailSpecValue', selectedSpec);
        var intent = sheetIntent;
        closeSheet('spec');
        if (livePreview) return;
        if (intent === 'cart') addCurrentToCart();
        else if (intent === 'buy') {
          var cart = addToCart(product.id, 1);
          (cart.items || []).forEach(function (it) {
            it.checked = it.id === product.id;
          });
          writeCart(cart);
          window.location.href = 'order-confirm.html';
        }
      });

    document.getElementById('goodsDetailAddCart') &&
      document.getElementById('goodsDetailAddCart').addEventListener('click', function () {
        if (livePreview) return;
        openSpecSheet('cart');
      });

    document.getElementById('goodsDetailBuyNow') &&
      document.getElementById('goodsDetailBuyNow').addEventListener('click', function () {
        if (livePreview) return;
        openSpecSheet('buy');
      });

    document.getElementById('goodsDetailServiceBtn') &&
      document.getElementById('goodsDetailServiceBtn').addEventListener('click', function () {
        showToast('联系客服（演示）');
      });

    document.getElementById('goodsDetailReviewMore') &&
      document.getElementById('goodsDetailReviewMore').addEventListener('click', function () {
        showToast('更多评价（演示）');
      });

    if (fromLive) mountLiveGoodsDemo({ includeExplain: false, offsetFooter: true });
  }

  function syncMallAddButtons() {
    var cart = ensureCart();
    document.querySelectorAll('[data-add-product]').forEach(function (btn) {
      var id = btn.getAttribute('data-add-product');
      var item = findItem(cart, id);
      if (item && item.qty > 0) {
        btn.classList.add('is-qty');
        btn.textContent = 'x' + item.qty;
      } else {
        btn.classList.remove('is-qty');
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.2 11h9.6L19 8H7"/></svg>';
      }
    });
  }

  function initCartPage() {
    ensureCart();
    renderCart();
    syncBadges();

    document.getElementById('cartClearBtn') &&
      document.getElementById('cartClearBtn').addEventListener('click', function () {
        if (!confirm('确认清空购物车？')) return;
        clearCart();
        renderCart();
      });

    document.getElementById('cartSelectAll') &&
      document.getElementById('cartSelectAll').addEventListener('click', function () {
        var cart = ensureCart();
        var selectable = (cart.items || []).filter(function (it) {
          return isPointsExchangeItem(it) || PRODUCTS[it.id];
        });
        var allChecked =
          selectable.length > 0 &&
          selectable.every(function (it) {
            return it.checked;
          });
        toggleAll(!allChecked);
        renderCart();
      });

    document.getElementById('cartCheckoutBtn') &&
      document.getElementById('cartCheckoutBtn').addEventListener('click', function () {
        var summary = getCheckedSummary();
        if (!summary.count) {
          showToast('请选择商品');
          return;
        }
        window.location.href = 'order-confirm.html';
      });
  }

  function renderCart() {
    var cart = ensureCart();
    var listEl = document.getElementById('cartGroupList');
    var selectAll = document.getElementById('cartSelectAll');
    var totalEl = document.getElementById('cartTotal');
    var checkoutBtn = document.getElementById('cartCheckoutBtn');
    var emptyEl = document.getElementById('cartEmpty');
    if (!listEl) return;

    var groups = groupCartItems(cart);
    var shopIcon =
      '<svg class="ua-cart-group__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>';

    if (!groups.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (totalEl) totalEl.textContent = '¥0.00';
      if (checkoutBtn) checkoutBtn.textContent = '立即下单(0)';
      if (selectAll) {
        selectAll.classList.remove('is-checked');
        selectAll.setAttribute('aria-checked', 'false');
      }
      syncBadges();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    var selectable = (cart.items || []).filter(function (it) {
      return isPointsExchangeItem(it) || PRODUCTS[it.id];
    });
    var allChecked =
      selectable.length > 0 &&
      selectable.every(function (it) {
        return it.checked;
      });
    if (selectAll) {
      selectAll.classList.toggle('is-checked', allChecked);
      selectAll.setAttribute('aria-checked', allChecked ? 'true' : 'false');
    }

    listEl.innerHTML = groups
      .map(function (group) {
        var groupChecked = group.items.every(function (it) {
          return it.checked;
        });
        var itemsHtml = group.items
          .map(function (item) {
            if (isPointsExchangeItem(item)) {
              var detailHref =
                'points-product-detail.html?code=' +
                encodeURIComponent(item.pointsCode || '') +
                '&from=cart.html';
              return (
                '<article class="ua-cart-item ua-cart-item--points" data-id="' +
                item.id +
                '">' +
                '<div class="ua-cart-item__check">' +
                '<button type="button" class="ua-shop-check' +
                (item.checked ? ' is-checked' : '') +
                '" data-cart-check="' +
                item.id +
                '" aria-label="选择"></button></div>' +
                '<div class="ua-cart-item__thumb">' +
                '<a href="' +
                detailHref +
                '">' +
                '<img src="' +
                resolveCartAsset(item.img) +
                '" alt="">' +
                '</a></div>' +
                '<div class="ua-cart-item__body">' +
                '<a class="ua-cart-item__name" href="' +
                detailHref +
                '">' +
                '<span class="ua-cart-item__tag">积分兑换</span>' +
                (item.name || '') +
                '</a>' +
                '<span class="ua-cart-item__spec">' +
                itemSpecText(item) +
                '</span>' +
                '<div class="ua-cart-item__bottom">' +
                '<div class="ua-cart-item__price ua-cart-item__price--points">' +
                formatPointsExchangePrice(item) +
                '</div>' +
                '<div class="ua-cart-stepper">' +
                '<button type="button" class="ua-cart-stepper__btn" data-cart-minus="' +
                item.id +
                '">−</button>' +
                '<span class="ua-cart-stepper__num">' +
                item.qty +
                '</span>' +
                '<button type="button" class="ua-cart-stepper__btn ua-cart-stepper__btn--plus" data-cart-plus="' +
                item.id +
                '">+</button>' +
                '</div></div></div></article>'
              );
            }
            var p = PRODUCTS[item.id];
            if (!p) return '';
            return (
              '<article class="ua-cart-item" data-id="' +
              p.id +
              '">' +
              '<div class="ua-cart-item__check">' +
              '<button type="button" class="ua-shop-check' +
              (item.checked ? ' is-checked' : '') +
              '" data-cart-check="' +
              p.id +
              '" aria-label="选择"></button></div>' +
              '<div class="ua-cart-item__thumb">' +
              '<a href="goods-detail.html?id=' +
              encodeURIComponent(p.id) +
              '&from=cart.html">' +
              '<img src="' +
              p.img +
              '" alt="">' +
              (p.watermark
                ? '<span class="ua-shop-watermark ua-shop-watermark--sm">生产验证商品<br>请勿下单</span>'
                : '') +
              '</a></div>' +
              '<div class="ua-cart-item__body">' +
              '<a class="ua-cart-item__name" href="goods-detail.html?id=' +
              encodeURIComponent(p.id) +
              '&from=cart.html">' +
              (p.shortName || p.name) +
              '</a>' +
              '<span class="ua-cart-item__spec">' +
              itemSpecText(item) +
              '</span>' +
              '<div class="ua-cart-item__bottom">' +
              '<div class="ua-cart-item__price">' +
              formatMoney(itemUnitPrice(item)) +
              '</div>' +
              '<div class="ua-cart-stepper">' +
              '<button type="button" class="ua-cart-stepper__btn" data-cart-minus="' +
              p.id +
              '">−</button>' +
              '<span class="ua-cart-stepper__num">' +
              item.qty +
              '</span>' +
              '<button type="button" class="ua-cart-stepper__btn ua-cart-stepper__btn--plus" data-cart-plus="' +
              p.id +
              '">+</button>' +
              '</div></div></div></article>'
            );
          })
          .join('');

        return (
          '<section class="ua-cart-group" data-group-key="' +
          group.key +
          '">' +
          '<div class="ua-cart-group__head">' +
          '<button type="button" class="ua-shop-check' +
          (groupChecked ? ' is-checked' : '') +
          '" data-group-check="' +
          group.key +
          '" aria-label="全选' +
          group.merchantName +
          '"></button>' +
          shopIcon +
          '<span class="ua-cart-group__name">' +
          group.merchantName +
          '</span></div>' +
          itemsHtml +
          '</section>'
        );
      })
      .join('');

    listEl.querySelectorAll('[data-group-check]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-group-check');
        var group = groupCartItems(ensureCart()).find(function (g) {
          return g.key === key;
        });
        if (!group) return;
        var next = !group.items.every(function (it) {
          return it.checked;
        });
        toggleGroup(key, next);
        renderCart();
      });
    });

    listEl.querySelectorAll('[data-cart-check]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-cart-check');
        var item = findItem(ensureCart(), id);
        toggleItem(id, !(item && item.checked));
        renderCart();
      });
    });

    listEl.querySelectorAll('[data-cart-minus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-cart-minus');
        var item = findItem(ensureCart(), id);
        if (!item) return;
        var min = isPointsExchangeItem(item)
          ? Math.max(1, Math.round(Number(item.minSaleQty) || 1))
          : 1;
        if (item.qty <= min) removeCartItem(id);
        else setQty(id, item.qty - 1);
        renderCart();
      });
    });

    listEl.querySelectorAll('[data-cart-plus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-cart-plus');
        var item = findItem(ensureCart(), id);
        setQty(id, (item ? item.qty : 0) + 1);
        renderCart();
      });
    });

    var summary = getCheckedSummary(cart);
    if (totalEl) {
      if (summary.hasPoints && summary.points > 0) {
        totalEl.innerHTML =
          summary.total > 0
            ? '<span class="ua-cart-footer__mix">' +
              summary.points +
              '积分 + ' +
              formatMoney(summary.total) +
              '</span>'
            : '<span class="ua-cart-footer__mix">' + summary.points + '积分</span>';
      } else {
        totalEl.textContent = formatMoney(summary.total);
      }
    }
    if (checkoutBtn) checkoutBtn.textContent = '立即下单(' + summary.count + ')';
    syncBadges();
  }

  function initOrderConfirmPage() {
    ensureCart();
    applyPickedAddressForConfirm();
    var items = getCheckoutItems();
    if (!items.length) {
      window.location.href = 'cart.html';
      return;
    }

    var body = document.getElementById('confirmBody');
    var payEl = document.getElementById('confirmPayAmount');
    var paySheet = document.getElementById('confirmPaySheet');
    var payMethod = 'wechat';
    var remarks = {};
    var pricing = computeOrderConfirmPricing(items);
    var usePointsDeduct = pricing.usePointsDeduct;
    var view = null;
    var pendingOrder = null;

    function currentDeduct() {
      if (!usePointsDeduct || !pricing.deductInfo.enabled) {
        return { deductAmount: 0, pointsUsed: 0 };
      }
      return pricing.deductInfo;
    }

    function calcPayable() {
      return calcConfirmPayable(pricing, usePointsDeduct);
    }

    function syncAmounts() {
      return syncSharedOrderConfirmAmounts(
        body,
        pricing,
        usePointsDeduct,
        [payEl]
      );
    }

    function renderConfirmBody() {
      if (!body) return;
      view = buildSharedOrderConfirmView(items, remarks, pricing, usePointsDeduct);
      body.innerHTML = view.html;
      bindSharedOrderConfirmInteractions(body, view, remarks, {
        onCoupon: function () {
          if (pricing.isNewcomerCheckout) {
            showToast('新人专区商品不支持用券');
            return;
          }
          showToast('暂无可用优惠券');
        },
        onPointsDeduct: function () {
          if (pricing.isNewcomerCheckout) {
            showToast('新人专区商品不支持积分抵扣');
            return;
          }
          if (!pricing.deductInfo.enabled || !(pricing.deductInfo.eligibleAmount > 0)) {
            showToast(pricing.deductInfo.tip || '当前订单无可抵扣的普通商品');
            return;
          }
          usePointsDeduct = !usePointsDeduct;
          syncAmounts();
          showToast(usePointsDeduct ? '已使用积分抵扣（仅普通商品）' : '已取消积分抵扣');
        }
      });
      syncAmounts();
    }

    renderConfirmBody();

    function clearCheckoutCart() {
      items.forEach(function (it) {
        if (it.isPointsExchange && global.UaPointsMallOrder) {
          global.UaPointsMallOrder.removeFromShopCart(it.pointsCode, it.skuCode);
        }
      });
      if (global.UaNewcomerZoneOrder && typeof global.UaNewcomerZoneOrder.clearCheckout === 'function') {
        var hasNewcomer = items.some(function (it) {
          return !!it.isNewcomerExclusive;
        });
        if (hasNewcomer) global.UaNewcomerZoneOrder.clearCheckout();
      }
      var cart = ensureCart();
      var remainIds = {};
      items.forEach(function (it) {
        remainIds[it.id] = true;
      });
      cart.items = (cart.items || []).filter(function (it) {
        return !remainIds[it.id];
      });
      writeCart(cart);
    }

    function validateNewcomerCheckout() {
      var newcomerLines = items.filter(function (it) {
        return !!it.isNewcomerExclusive;
      });
      if (!newcomerLines.length) return { ok: true };
      if (!global.UaNewcomerZoneOrder) {
        return { ok: false, message: '新人专区校验组件未加载' };
      }
      /* 支付前只卡「是否仍是新人 / 是否已买过」；待支付同商品由下单入口拦截 */
      var gate = global.UaNewcomerZoneOrder.assertNewcomerForCheckout();
      if (!gate.ok) return gate;
      for (var i = 0; i < newcomerLines.length; i++) {
        var line = newcomerLines[i];
        var code = line.newcomerCode || '';
        if (Number(line.qty) !== 1) {
          return { ok: false, message: '新人专区商品每人限购 1 件' };
        }
        if (
          (global.UaNewcomerZoneOrder.hasPaidNewcomerOrder &&
            global.UaNewcomerZoneOrder.hasPaidNewcomerOrder()) ||
          (code && global.UaNewcomerZoneOrder.hasBoughtNewcomerProduct(code))
        ) {
          return {
            ok: false,
            message: '新人专区限购一单，您已购买过'
          };
        }
      }
      return { ok: true };
    }

    /** 提交订单（接口动作）：生成待支付订单，成功后由调用方唤起支付 */
    function createUnpaidOrder() {
      var newcomerCheck = validateNewcomerCheckout();
      if (!newcomerCheck.ok) {
        showToast(newcomerCheck.message || '暂无法购买新人专区商品');
        return null;
      }
      var d = currentDeduct();
      var payable = calcPayable();
      var orderPayload = {
        orderNo: global.UaOrdersStore ? global.UaOrdersStore.genOrderNo() : String(Date.now()),
        status: 'unpaid',
        createdAt: global.UaOrdersStore ? global.UaOrdersStore.nowText() : '',
        exchangePoints: pricing.pointsExchangePts,
        deductPoints: usePointsDeduct ? d.pointsUsed || 0 : 0,
        deductAmount: usePointsDeduct ? d.deductAmount || 0 : 0,
        goodsTotal: pricing.goodsTotal,
        freight: pricing.freight,
        payable: payable,
        payLabel:
          pricing.pointsExchangePts > 0 && payable > 0
            ? pricing.pointsExchangePts + '积分 + ¥' + payable.toFixed(2)
            : pricing.pointsExchangePts > 0
              ? pricing.pointsExchangePts + '积分'
              : '¥' + payable.toFixed(2),
        items: items.map(function (it) {
          return {
            id: it.id,
            name: it.name,
            spec: it.spec || '',
            img: it.img || '',
            qty: it.isNewcomerExclusive ? 1 : it.qty,
            price: Number(it.price) || 0,
            points: Number(it.points) || 0,
            money: Number(it.money) || 0,
            isPointsExchange: !!it.isPointsExchange,
            isNewcomerExclusive: !!it.isNewcomerExclusive,
            newcomerCode: it.newcomerCode || '',
            pointsCode: it.pointsCode || '',
            skuCode: it.skuCode || ''
          };
        })
      };
      var saved = global.UaOrdersStore
        ? global.UaOrdersStore.upsert(orderPayload)
        : orderPayload;
      try {
        global.sessionStorage.setItem(
          'ua_last_order_items_v1',
          JSON.stringify(
            saved.items.map(function (it) {
              return {
                id: it.id,
                name: it.name,
                isPointsExchange: !!it.isPointsExchange,
                pointsCode: it.pointsCode || '',
                points: Number(it.points) || 0,
                money: Number(it.money) || 0,
                qty: it.qty
              };
            })
          )
        );
      } catch (e) { /* ignore */ }
      clearCheckoutCart();
      pendingOrder = saved;
      return saved;
    }

    function goPaidOrderDetail(order) {
      var paid = null;
      if (global.UaOrdersStore && order && order.orderNo) {
        paid = global.UaOrdersStore.updateStatus(order.orderNo, 'shipping');
      }
      if (!paid) {
        paid = Object.assign({}, order || {}, { status: 'shipping' });
        if (global.UaOrdersStore && paid.orderNo) {
          paid = global.UaOrdersStore.upsert(paid);
        }
      }
      var href =
        global.UaOrdersStore && global.UaOrdersStore.buildDetailHref
          ? global.UaOrdersStore.buildDetailHref(paid)
          : 'order-detail.html?status=shipping&orderNo=' +
            encodeURIComponent((paid && paid.orderNo) || '');
      window.location.replace(href);
    }

    function openPaySheet() {
      syncAmounts();
      if (paySheet) paySheet.hidden = false;
    }

    function closePaySheet() {
      if (paySheet) paySheet.hidden = true;
    }

    function syncPayMethodUI() {
      document.querySelectorAll('[data-pay-method]').forEach(function (btn) {
        var active = btn.getAttribute('data-pay-method') === payMethod;
        btn.classList.toggle('is-active', active);
        var check = btn.querySelector('.ua-shop-check');
        if (check) check.classList.toggle('is-checked', active);
      });
    }

    document.getElementById('confirmServiceBtn') &&
      document.getElementById('confirmServiceBtn').addEventListener('click', function () {
        showToast('联系客服（演示）');
      });

    document.getElementById('confirmPayBtn') &&
      document.getElementById('confirmPayBtn').addEventListener('click', function () {
        /* 黑名单禁用「下单」：确认订单提交拦截 */
        if (global.UaBlacklistGuard && global.UaBlacklistGuard.guardOrderSubmit()) return;
        var agreeCheck = body && body.querySelector('[data-confirm-agree]');
        if (agreeCheck && !agreeCheck.classList.contains('is-checked')) {
          showToast('请先同意交易服务协议');
          return;
        }
        if (pricing.pointsExchangePts > pricing.availablePts) {
          showToast('可用积分不足，无法兑换');
          return;
        }
        var dNeed = currentDeduct();
        if (
          usePointsDeduct &&
          dNeed.pointsUsed > 0 &&
          pricing.pointsExchangePts + dNeed.pointsUsed > pricing.availablePts
        ) {
          showToast('可用积分不足（兑换与抵扣合计超出）');
          return;
        }
        var ncCheck = validateNewcomerCheckout();
        if (!ncCheck.ok) {
          showToast(ncCheck.message || '暂无法购买新人专区商品');
          return;
        }
        if (!pendingOrder) {
          var created = createUnpaidOrder();
          if (!created) return;
          showToast('订单已生成，请支付');
        }
        openPaySheet();
      });

    document.querySelectorAll('[data-confirm-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closePaySheet();
        if (pendingOrder) {
          showToast('可稍后在订单列表完成支付');
        }
      });
    });

    document.querySelectorAll('[data-pay-method]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        payMethod = btn.getAttribute('data-pay-method');
        syncPayMethodUI();
      });
    });

    document.getElementById('confirmPaySubmit') &&
      document.getElementById('confirmPaySubmit').addEventListener('click', function () {
        var payNcCheck = validateNewcomerCheckout();
        if (!payNcCheck.ok) {
          showToast(payNcCheck.message || '您已有支付成功的订单，无法继续支付新人专区订单');
          closePaySheet();
          return;
        }
        closePaySheet();
        var order = pendingOrder;
        if (!order && global.UaOrdersStore) order = global.UaOrdersStore.getLatest();
        showToast('支付成功（演示）');
        setTimeout(function () {
          goPaidOrderDetail(order);
        }, 500);
      });
  }

  function initHomePage() {
    ensureCart();
    syncBadges();
    if (global.UaSwitchAddress && typeof global.UaSwitchAddress.syncHomeLocate === 'function') {
      global.UaSwitchAddress.syncHomeLocate();
    }
    var enterBtn = document.getElementById('homeEnterLiveBtn');
    var card = document.getElementById('homeLiveCard');
    function enterLive(e) {
      if (e) e.preventDefault();
      window.location.href = 'live-room.html';
    }
    if (enterBtn) enterBtn.addEventListener('click', enterLive);
    if (card) card.addEventListener('click', enterLive);
  }

  function initLiveRoomPage() {
    ensureCart();
    /* 黑名单禁用「观看直播」：不拉流，页内提示 */
    if (global.UaBlacklistGuard) global.UaBlacklistGuard.applyLiveWatchBan();
    var state = {
      keyword: '',
      skuProductId: '',
      skuSpecIndex: 0,
      skuQty: 1,
      confirmItems: null
    };

    function openSheet(name) {
      var map = {
        goods: 'liveGoodsSheet',
        sku: 'liveSkuSheet',
        confirm: 'liveConfirmSheet'
      };
      var el = document.getElementById(map[name]);
      if (el) el.hidden = false;
    }

    function closeSheet(name) {
      var map = {
        goods: 'liveGoodsSheet',
        sku: 'liveSkuSheet',
        confirm: 'liveConfirmSheet'
      };
      var el = document.getElementById(map[name]);
      if (el) el.hidden = true;
    }

    function updateLiveFooter() {
      var summary = getLiveCartSummary();
      var badge = document.getElementById('liveGoodsBadge');
      var totalEl = document.getElementById('liveGoodsTotal');
      if (badge) {
        if (summary.count > 0) {
          badge.hidden = false;
          badge.textContent = String(summary.count > 99 ? '99+' : summary.count);
        } else {
          badge.hidden = true;
        }
      }
      if (totalEl) totalEl.textContent = formatMoney(summary.total);
    }

    function getFilteredLiveProducts() {
      var kw = String(state.keyword || '').trim().toLowerCase();
      return LIVE_PRODUCT_IDS.map(function (id) {
        return PRODUCTS[id];
      }).filter(function (p) {
        if (!p) return false;
        if (!kw) return true;
        return String(p.name).toLowerCase().indexOf(kw) !== -1;
      });
    }

    function renderLiveGoodsList() {
      var listEl = document.getElementById('liveGoodsList');
      if (!listEl) return;
      var liveCart = readLiveCart();
      var products = getFilteredLiveProducts();
      listEl.innerHTML = products
        .map(function (p, index) {
          var liveItem = findLiveItem(liveCart, p.id);
          var inLive = liveItem && liveItem.qty > 0;
          var preview = isLivePreview();
          var actions;
          if (preview) {
            actions =
              '<div class="ua-live-goods__ops">' +
              '<button type="button" class="ua-live-goods__buy is-soon" disabled>即将开售</button></div>';
          } else if (inLive) {
            actions =
              '<div class="ua-live-goods__stepper">' +
              '<button type="button" data-live-minus="' +
              p.id +
              '">−</button>' +
              '<span>' +
              liveItem.qty +
              '</span>' +
              '<button type="button" data-live-plus="' +
              p.id +
              '">+</button></div>';
          } else {
            actions =
              '<div class="ua-live-goods__ops">' +
              '<button type="button" class="ua-live-goods__add" data-live-add="' +
              p.id +
              '" aria-label="加入购物车">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.1 10.5h9.8L19 8H7"/></svg>' +
              '</button>' +
              '<button type="button" class="ua-live-goods__buy" data-live-rush="' +
              p.id +
              '">去抢购</button></div>';
          }
          return (
            '<article class="ua-live-goods__item' +
            (preview ? ' is-preview' : '') +
            '" data-live-goods-id="' +
            p.id +
            '" role="link" tabindex="0">' +
            '<div class="ua-live-goods__thumb">' +
            '<span class="ua-live-goods__rank"' +
            (preview ? ' hidden' : '') +
            '>' +
            (index + 1) +
            '</span>' +
            '<img src="' +
            p.img +
            '" alt="">' +
            (preview ? '<span class="ua-live-goods__preview-badge">预告中</span>' : '') +
            (p.watermark
              ? '<span class="ua-shop-watermark ua-shop-watermark--sm">生产验证商品<br>请勿下单</span>'
              : '') +
            '</div>' +
            '<div class="ua-live-goods__info">' +
            '<div class="ua-live-goods__name">' +
            p.shortName +
            '</div>' +
            '<div class="ua-live-goods__fulfill">' +
            (getProductFulfillType(p) === 'express' ? '快递' : '自提') +
            '</div>' +
            '<div class="ua-live-goods__bottom">' +
            '<div class="ua-live-goods__price">' +
            liveGoodsPriceHtml(p) +
            '</div>' +
            actions +
            '</div></div></article>'
          );
        })
        .join('');
      updateLiveFooter();
    }

    function openSkuSheet(productId) {
      if (isLivePreview()) {
        showToast('该商品为预告，暂不可购买');
        return;
      }
      var p = PRODUCTS[productId];
      if (!p) return;
      var specs = getLiveSpecs(p);
      state.skuProductId = productId;
      state.skuSpecIndex = 0;
      state.skuQty = 1;
      var thumb = document.getElementById('liveSkuThumb');
      var nameEl = document.getElementById('liveSkuName');
      if (thumb) thumb.src = p.img;
      if (nameEl) nameEl.textContent = p.shortName || p.name;
      renderSkuSheet();
      openSheet('sku');
    }

    function currentSku() {
      var p = PRODUCTS[state.skuProductId];
      if (!p) return null;
      var specs = getLiveSpecs(p);
      var spec = specs[state.skuSpecIndex] || specs[0];
      return { product: p, spec: spec, qty: state.skuQty };
    }

    function renderSkuSheet() {
      var cur = currentSku();
      if (!cur) return;
      var priceEl = document.getElementById('liveSkuPrice');
      var pickedEl = document.getElementById('liveSkuPicked');
      var qtyEl = document.getElementById('liveSkuQty');
      var specsEl = document.getElementById('liveSkuSpecs');
      if (priceEl) priceEl.textContent = formatMoney(cur.spec.price);
      if (pickedEl) pickedEl.textContent = '已选 ' + cur.spec.label;
      if (qtyEl) qtyEl.textContent = String(cur.qty);
      if (specsEl) {
        var specs = getLiveSpecs(cur.product);
        specsEl.innerHTML = specs
          .map(function (spec, i) {
            return (
              '<button type="button" class="ua-live-sku__chip' +
              (i === state.skuSpecIndex ? ' is-active' : '') +
              '" data-sku-spec="' +
              i +
              '">' +
              '<img src="' +
              cur.product.img +
              '" alt="">' +
              '<span>' +
              spec.label +
              '</span></button>'
            );
          })
          .join('');
      }
    }

    var confirmRemarks = {};
    var confirmPricing = null;
    var confirmUsePointsDeduct = true;
    var confirmPendingOrder = null;
    var confirmPayMethod = 'wechat';
    var confirmPaySheet = document.getElementById('confirmPaySheet');

    function syncLiveConfirmAmounts() {
      var body = document.getElementById('liveConfirmBody');
      var payEl = document.getElementById('liveConfirmPay');
      if (!confirmPricing) return 0;
      var payable = syncSharedOrderConfirmAmounts(
        body,
        confirmPricing,
        confirmUsePointsDeduct,
        [payEl]
      );
      state.confirmPayable = payable;
      return payable;
    }

    function renderConfirmSheet(checkoutItems) {
      state.confirmItems = checkoutItems || [];
      var body = document.getElementById('liveConfirmBody');
      if (!body) return;
      confirmRemarks = {};
      confirmPendingOrder = null;
      confirmPricing = computeOrderConfirmPricing(state.confirmItems);
      confirmUsePointsDeduct = confirmPricing.usePointsDeduct;
      var view = buildSharedOrderConfirmView(
        state.confirmItems,
        confirmRemarks,
        confirmPricing,
        confirmUsePointsDeduct
      );
      body.innerHTML = view.html;
      bindSharedOrderConfirmInteractions(body, view, confirmRemarks, {
        onCoupon: function () {
          showToast('暂无可用优惠券');
        },
        onPointsDeduct: function () {
          if (!confirmPricing.deductInfo.enabled || !(confirmPricing.deductInfo.eligibleAmount > 0)) {
            showToast(confirmPricing.deductInfo.tip || '当前订单无可抵扣的普通商品');
            return;
          }
          confirmUsePointsDeduct = !confirmUsePointsDeduct;
          syncLiveConfirmAmounts();
          showToast(confirmUsePointsDeduct ? '已使用积分抵扣（仅普通商品）' : '已取消积分抵扣');
        }
      });
      syncLiveConfirmAmounts();
    }

    function clearLiveConfirmCart() {
      var ids = {};
      (state.confirmItems || []).forEach(function (it) {
        ids[it.id] = true;
      });
      var liveCart = readLiveCart();
      liveCart.items = (liveCart.items || []).filter(function (it) {
        return !ids[it.id];
      });
      writeLiveCart(liveCart);
      var shopCart = ensureCart();
      shopCart.items = (shopCart.items || []).filter(function (it) {
        return !ids[it.id];
      });
      writeCart(shopCart);
      syncBadges();
      renderLiveGoodsList();
    }

    function createLiveUnpaidOrder() {
      if (!confirmPricing) return null;
      var d =
        confirmUsePointsDeduct && confirmPricing.deductInfo.enabled
          ? confirmPricing.deductInfo
          : { deductAmount: 0, pointsUsed: 0 };
      var payable = calcConfirmPayable(confirmPricing, confirmUsePointsDeduct);
      var orderPayload = {
        orderNo: global.UaOrdersStore ? global.UaOrdersStore.genOrderNo() : String(Date.now()),
        status: 'unpaid',
        createdAt: global.UaOrdersStore ? global.UaOrdersStore.nowText() : '',
        exchangePoints: 0,
        deductPoints: confirmUsePointsDeduct ? d.pointsUsed || 0 : 0,
        deductAmount: confirmUsePointsDeduct ? d.deductAmount || 0 : 0,
        goodsTotal: confirmPricing.goodsTotal,
        freight: confirmPricing.freight,
        payable: payable,
        payLabel: '¥' + payable.toFixed(2),
        source: 'live',
        items: (state.confirmItems || []).map(function (it) {
          return {
            id: it.id,
            name: it.name,
            spec: it.spec || '',
            img: it.img || '',
            qty: it.qty,
            price: Number(it.price) || 0,
            points: 0,
            money: 0,
            isPointsExchange: false,
            isNewcomerExclusive: false
          };
        })
      };
      var saved = global.UaOrdersStore
        ? global.UaOrdersStore.upsert(orderPayload)
        : orderPayload;
      clearLiveConfirmCart();
      confirmPendingOrder = saved;
      return saved;
    }

    function openLivePaySheet() {
      syncLiveConfirmAmounts();
      if (confirmPaySheet) confirmPaySheet.hidden = false;
    }

    function closeLivePaySheet() {
      if (confirmPaySheet) confirmPaySheet.hidden = true;
    }

    function goLivePaidOrderDetail(order) {
      var paid = null;
      if (global.UaOrdersStore && order && order.orderNo) {
        paid = global.UaOrdersStore.updateStatus(order.orderNo, 'shipping');
      }
      if (!paid) {
        paid = Object.assign({}, order || {}, { status: 'shipping' });
        if (global.UaOrdersStore && paid.orderNo) {
          paid = global.UaOrdersStore.upsert(paid);
        }
      }
      var href =
        global.UaOrdersStore && global.UaOrdersStore.buildDetailHref
          ? global.UaOrdersStore.buildDetailHref(paid)
          : 'order-detail.html?status=shipping&orderNo=' +
            encodeURIComponent((paid && paid.orderNo) || '');
      window.location.href = href;
    }

    function openConfirmWithLiveCart() {
      if (isLivePreview()) {
        showToast('预告商品暂不可购买');
        return;
      }
      var items = getLiveCartItems()
        .map(function (item) {
          var p = PRODUCTS[item.id];
          return mapProductLineToCheckoutItem(p, {
            spec: item.spec || (p && p.spec) || '',
            price: item.price,
            qty: item.qty
          });
        })
        .filter(Boolean);
      if (!items.length) {
        showToast('请先选择商品');
        return;
      }
      renderConfirmSheet(items);
      openSheet('confirm');
    }

    function openConfirmWithSku() {
      var cur = currentSku();
      if (!cur) return;
      var line = mapProductLineToCheckoutItem(cur.product, {
        spec: cur.spec.label,
        price: cur.spec.price,
        qty: cur.qty
      });
      if (!line) return;
      renderConfirmSheet([line]);
      closeSheet('sku');
      openSheet('confirm');
    }

    document.getElementById('liveCartBtn') &&
      document.getElementById('liveCartBtn').addEventListener('click', function () {
        state.keyword = '';
        var search = document.getElementById('liveGoodsSearch');
        if (search) search.value = '';
        renderLiveGoodsList();
        openSheet('goods');
      });

    document.querySelectorAll('[data-live-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-live-close'));
      });
    });

    document.getElementById('liveGoodsSearch') &&
      document.getElementById('liveGoodsSearch').addEventListener('input', function (e) {
        state.keyword = e.target.value || '';
        renderLiveGoodsList();
      });

    document.getElementById('liveGoodsList') &&
      document.getElementById('liveGoodsList').addEventListener('click', function (e) {
        var addBtn = e.target.closest('[data-live-add]');
        if (addBtn) {
          if (isLivePreview()) {
            showToast('该商品为预告，暂不可购买');
            return;
          }
          openSkuSheet(addBtn.getAttribute('data-live-add'));
          return;
        }
        var rushBtn = e.target.closest('[data-live-rush]');
        if (rushBtn) {
          if (isLivePreview()) {
            showToast('该商品为预告，暂不可购买');
            return;
          }
          openSkuSheet(rushBtn.getAttribute('data-live-rush'));
          return;
        }
        var minus = e.target.closest('[data-live-minus]');
        if (minus) {
          var mid = minus.getAttribute('data-live-minus');
          var mItem = findLiveItem(readLiveCart(), mid);
          if (!mItem) return;
          setLiveItemQty(mid, mItem.qty - 1, {
            price: mItem.price,
            spec: mItem.spec
          });
          renderLiveGoodsList();
          return;
        }
        var plus = e.target.closest('[data-live-plus]');
        if (plus) {
          var pid = plus.getAttribute('data-live-plus');
          var pItem = findLiveItem(readLiveCart(), pid);
          if (!pItem) return;
          setLiveItemQty(pid, pItem.qty + 1, {
            price: pItem.price,
            spec: pItem.spec
          });
          renderLiveGoodsList();
          return;
        }
        /* 点击商品卡片（非加购/抢购/数量按钮）进入商品详情 */
        var card = e.target.closest('[data-live-goods-id]');
        if (card) {
          var goodsId = card.getAttribute('data-live-goods-id');
          if (!goodsId) return;
          window.location.href =
            'goods-detail.html?id=' +
            encodeURIComponent(goodsId) +
            '&from=' +
            encodeURIComponent('live-room.html');
        }
      });

    document.getElementById('liveSkuSpecs') &&
      document.getElementById('liveSkuSpecs').addEventListener('click', function (e) {
        var chip = e.target.closest('[data-sku-spec]');
        if (!chip) return;
        state.skuSpecIndex = parseInt(chip.getAttribute('data-sku-spec'), 10) || 0;
        renderSkuSheet();
      });

    document.getElementById('liveSkuMinus') &&
      document.getElementById('liveSkuMinus').addEventListener('click', function () {
        state.skuQty = Math.max(1, state.skuQty - 1);
        renderSkuSheet();
      });
    document.getElementById('liveSkuPlus') &&
      document.getElementById('liveSkuPlus').addEventListener('click', function () {
        state.skuQty = Math.min(99, state.skuQty + 1);
        renderSkuSheet();
      });

    document.getElementById('liveSkuAddCart') &&
      document.getElementById('liveSkuAddCart').addEventListener('click', function () {
        var cur = currentSku();
        if (!cur) return;
        addToCart(cur.product.id, cur.qty, {
          source: 'live',
          price: cur.spec.price,
          spec: cur.spec.label
        });
        closeSheet('sku');
        renderLiveGoodsList();
        showToast('已加入购物车');
      });

    document.getElementById('liveSkuBuyNow') &&
      document.getElementById('liveSkuBuyNow').addEventListener('click', function () {
        openConfirmWithSku();
      });

    document.getElementById('liveGoodsCheckout') &&
      document.getElementById('liveGoodsCheckout').addEventListener('click', function () {
        openConfirmWithLiveCart();
      });

    document.getElementById('liveConfirmPayBtn') &&
      document.getElementById('liveConfirmPayBtn').addEventListener('click', function () {
        /* 黑名单禁用「下单」：直播确认订单提交拦截 */
        if (global.UaBlacklistGuard && global.UaBlacklistGuard.guardOrderSubmit()) return;
        var body = document.getElementById('liveConfirmBody');
        var agree = body && body.querySelector('[data-confirm-agree]');
        if (agree && !agree.classList.contains('is-checked')) {
          showToast('请先同意交易服务协议');
          return;
        }
        if (!confirmPendingOrder) {
          var created = createLiveUnpaidOrder();
          if (!created) return;
          showToast('订单已生成，请支付');
        }
        openLivePaySheet();
      });

    document.querySelectorAll('[data-confirm-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeLivePaySheet();
        if (confirmPendingOrder) {
          showToast('可稍后在订单列表完成支付');
        }
      });
    });

    document.querySelectorAll('[data-pay-method]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        confirmPayMethod = btn.getAttribute('data-pay-method');
        document.querySelectorAll('[data-pay-method]').forEach(function (b) {
          var active = b.getAttribute('data-pay-method') === confirmPayMethod;
          b.classList.toggle('is-active', active);
          var check = b.querySelector('.ua-shop-check');
          if (check) check.classList.toggle('is-checked', active);
        });
      });
    });

    document.getElementById('confirmPaySubmit') &&
      document.getElementById('confirmPaySubmit').addEventListener('click', function () {
        if (global.UaBlacklistGuard && global.UaBlacklistGuard.guardOrderSubmit()) return;
        closeLivePaySheet();
        var order = confirmPendingOrder;
        if (!order && global.UaOrdersStore) order = global.UaOrdersStore.getLatest();
        showToast('支付成功（演示）');
        setTimeout(function () {
          goLivePaidOrderDetail(order);
        }, 500);
      });

    document.getElementById('liveCouponBtn') &&
      document.getElementById('liveCouponBtn').addEventListener('click', function () {
        showToast('暂无可用优惠券');
      });
    document.getElementById('liveOrderBtn') &&
      document.getElementById('liveOrderBtn').addEventListener('click', function () {
        showToast('订单功能演示');
      });

    document.getElementById('liveReportBtn') &&
      document.getElementById('liveReportBtn').addEventListener('click', function () {
        showToast('已提交举报（演示）');
      });
    document.getElementById('liveLikeBtn') &&
      document.getElementById('liveLikeBtn').addEventListener('click', function () {
        showToast('点赞成功');
      });
    document.getElementById('liveShareBtn') &&
      document.getElementById('liveShareBtn').addEventListener('click', function () {
        showToast('分享功能演示');
      });
    document.getElementById('liveSendBtn') &&
      document.getElementById('liveSendBtn').addEventListener('click', function () {
        /* 黑名单禁用「禁止直播评论」：发评论弹窗拦截 */
        if (global.UaBlacklistGuard && global.UaBlacklistGuard.guardLiveComment()) return;
        var mute = liveMuteReason();
        if (mute === 'room') {
          showToast('主播已开启全员禁言');
          return;
        }
        if (mute === 'user') {
          showToast('本场直播你已被禁言');
          return;
        }
        var input = document.getElementById('liveCommentInput');
        var text = input && String(input.value || '').trim();
        if (!text) {
          showToast('请输入内容');
          return;
        }
        if (input) input.value = '';
        var me = readLiveViewer();
        liveLocalComments.push({
          id: 'lc-' + Date.now(),
          userId: me.id,
          user: me.name,
          text: text
        });
        renderLiveDanmu();
        showToast('发送成功');
      });

    mountLiveGoodsDemo();
    mountLiveDanmuDemo();
    refreshLiveRoomOverlay();
    window.addEventListener('storage', function (ev) {
      if (ev.key === LIVE_C_STATE_KEY) refreshLiveRoomOverlay();
    });
    window.setInterval(refreshLiveRoomOverlay, 2000);

    renderLiveExplainCard();

    /* 进场特效：进入直播间自动播放；右侧可切换演示三种样式 */
    (function bindLiveEntryFx() {
      var host = document.getElementById('liveEntryFxHost');
      var demo = document.getElementById('liveFxDemo');
      if (!host || !window.UaLiveEntryFx) return;

      function playType(type) {
        if (demo) {
          demo.querySelectorAll('[data-fx]').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.getAttribute('data-fx') === type);
          });
        }
        window.UaLiveEntryFx.play(host, type);
      }

      var initial = window.UaLiveEntryFx.resolveEffectType();
      window.setTimeout(function () {
        playType(initial);
      }, 350);

      if (demo) {
        demo.addEventListener('click', function (ev) {
          var btn = ev.target.closest('[data-fx]');
          if (!btn) return;
          playType(btn.getAttribute('data-fx'));
        });
      }
    })();
  }

  global.UAShop = {
    PRODUCTS: PRODUCTS,
    STORE: STORE,
    MALL_CATEGORIES: MALL_CATEGORIES,
    ensureCart: ensureCart,
    addToCart: addToCart,
    syncBadges: syncBadges,
    initHomePage: initHomePage,
    initLiveRoomPage: initLiveRoomPage,
    initMallPage: initMallPage,
    initCategoryPage: initCategoryPage,
    initCartPage: initCartPage,
    initOrderConfirmPage: initOrderConfirmPage,
    initGoodsDetailPage: initGoodsDetailPage,
    formatMoney: formatMoney,
    getCheckedSummary: getCheckedSummary
  };
})(window);
