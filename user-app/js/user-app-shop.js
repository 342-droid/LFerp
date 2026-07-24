(function (global) {
  var CART_KEY = 'ua_shop_cart_v2';
  var LIVE_CART_KEY = 'ua_live_cart_v1';
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

  function getCartItemMerchantInfo(item) {
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
        merchantName: supplier.name,
        merchantAvatar: supplier.avatar,
        tag: '快递',
        tipTag: '快递',
        tipText: '由供应商发货，预计按物流时效送达'
      };
    }
    var store =
      (p && p.store) ||
      STORE;
    return {
      fulfillType: 'pickup',
      merchantId: store.id,
      merchantName: store.name,
      merchantAvatar: store.avatar,
      tag: '自提',
      tipTag: '自提',
        tipText: '到店自提，下单后按提货时间到店核销'
      };
  }

  function enrichCartItem(item) {
    if (!item || !PRODUCTS[item.id]) return item;
    var info = getCartItemMerchantInfo(item);
    item.fulfillType = info.fulfillType;
    item.merchantId = info.merchantId;
    item.merchantName = info.merchantName;
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
      if (!PRODUCTS[item.id]) return;
      var info = getCartItemMerchantInfo(item);
      var key = info.fulfillType + ':' + info.merchantId;
      if (!map[key]) {
        map[key] = {
          key: key,
          fulfillType: info.fulfillType,
          merchantId: info.merchantId,
          merchantName: info.merchantName,
          merchantAvatar: info.merchantAvatar,
          tag: info.tag,
          tipTag: info.tipTag,
          tipText: info.tipText,
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
    if (item && item.price != null) return Number(item.price);
    var p = PRODUCTS[item && item.id];
    return p ? Number(p.price) : 0;
  }

  function itemSpecText(item) {
    if (item && item.spec != null && item.spec !== '') return String(item.spec);
    var p = PRODUCTS[item && item.id];
    return p ? String(p.spec) : '';
  }

  function getCartCount(cart) {
    cart = cart || ensureCart();
    return (cart.items || []).reduce(function (sum, item) {
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
    (cart.items || []).forEach(function (item) {
      if (!item.checked) return;
      var p = PRODUCTS[item.id];
      if (!p) return;
      total += itemUnitPrice(item) * item.qty;
      count += item.qty;
    });
    return { total: total, count: count };
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
    item.qty = Math.max(1, qty);
    writeCart(cart);
    return cart;
  }

  function removeCartItem(id) {
    var cart = ensureCart();
    cart.items = (cart.items || []).filter(function (it) {
      return it.id !== id;
    });
    writeCart(cart);
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
    return cart;
  }

  function getCheckoutItems() {
    var cart = ensureCart();
    return (cart.items || [])
      .filter(function (item) {
        return item.checked && PRODUCTS[item.id];
      })
      .map(function (item) {
        var p = PRODUCTS[item.id];
        var info = getCartItemMerchantInfo(item);
        return {
          id: p.id,
          name: p.shortName || p.name,
          fullName: p.name,
          spec: itemSpecText(item),
          price: itemUnitPrice(item),
          img: p.img,
          watermark: p.watermark,
          qty: item.qty,
          fulfillType: info.fulfillType,
          merchantId: info.merchantId,
          merchantName: info.merchantName,
          deliveryText:
            info.fulfillType === 'express'
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
                desc: (merchant.name || '供应商') + '（' + (merchant.meta || '') + '）负责备货与发货。'
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
      setText('goodsDetailMerchantName', merchant.name || (fulfillType === 'express' ? '供应商' : '门店'));
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
      if (priceEl) priceEl.innerHTML = '<small>¥</small>' + formatPriceLabel(product.price);
      var originEl = document.getElementById('goodsDetailOrigin');
      if (originEl) {
        if (product.originPrice) {
          originEl.hidden = false;
          originEl.textContent = '¥' + formatPriceLabel(product.originPrice);
        } else {
          originEl.hidden = true;
        }
      }
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
        openSpecSheet('cart');
      });

    document.getElementById('goodsDetailBuyNow') &&
      document.getElementById('goodsDetailBuyNow').addEventListener('click', function () {
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
        var allChecked =
          cart.items.length > 0 &&
          cart.items.every(function (it) {
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

    var allChecked = cart.items.every(function (it) {
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
          '</span>' +
          '<span class="ua-cart-group__tag">' +
          group.tag +
          '</span></div>' +
          '<div class="ua-cart-group__tip">' +
          '<span class="ua-cart-group__tip-tag">' +
          group.tipTag +
          '</span>' +
          '<span class="ua-cart-group__tip-text">' +
          group.tipText +
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
        if (item.qty <= 1) removeCartItem(id);
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
    if (totalEl) totalEl.textContent = formatMoney(summary.total);
    if (checkoutBtn) checkoutBtn.textContent = '立即下单(' + summary.count + ')';
    syncBadges();
  }

  function initOrderConfirmPage() {
    ensureCart();
    var items = getCheckoutItems();
    var splitListEl = document.getElementById('confirmSplitList');
    var addressCard = document.getElementById('confirmAddressCard');
    var goodsTotalEl = document.getElementById('confirmGoodsTotal');
    var freightEl = document.getElementById('confirmFreight');
    var couponDiscountEl = document.getElementById('confirmCouponDiscount');
    var sumEl = document.getElementById('confirmSum');
    var payEl = document.getElementById('confirmPayAmount');
    var paySheetAmount = document.getElementById('confirmPaySheetAmount');
    var agreeCheck = document.getElementById('confirmAgreeCheck');
    var paySheet = document.getElementById('confirmPaySheet');
    var payMethod = 'wechat';
    var remarks = {};

    if (!items.length) {
      window.location.href = 'cart.html';
      return;
    }

    var splits = buildConfirmSplitOrders(items);
    var hasExpress = splits.some(function (s) {
      return s.fulfillType === 'express';
    });
    var hasPickup = splits.some(function (s) {
      return s.fulfillType === 'pickup';
    });
    var goodsTotal = items.reduce(function (sum, it) {
      return sum + it.price * it.qty;
    }, 0);
    var freight = hasExpress ? 0 : 0;
    var payable = goodsTotal + freight;

    var shopIcon =
      '<svg class="ua-confirm-split__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>';
    var chevron =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

    if (addressCard) addressCard.hidden = !hasExpress;

    function renderItemRow(item) {
      return (
        '<div class="ua-confirm-item">' +
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
        item.name +
        '</div>' +
        '<span class="ua-confirm-item__spec">' +
        item.spec +
        '</span>' +
        '<div class="ua-confirm-item__bottom">' +
        '<span class="ua-confirm-item__price">' +
        formatMoney(item.price) +
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

    function renderPickupStoreBlock() {
      if (!hasPickup) return '';
      return (
        '<div class="ua-confirm-split__store">' +
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
      );
    }

    if (splitListEl) {
      var pickupStoreShown = false;
      splitListEl.innerHTML = splits
        .map(function (split) {
          var tagClass =
            split.fulfillType === 'express'
              ? 'ua-confirm-split__tag--express'
              : 'ua-confirm-split__tag--pickup';
          var tagText = split.fulfillType === 'express' ? '快递到家' : '门店自提';
          var storeBlock = '';
          if (split.fulfillType === 'pickup' && !pickupStoreShown) {
            storeBlock = renderPickupStoreBlock();
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

      splitListEl.querySelectorAll('[data-remark-split]').forEach(function (input) {
        input.addEventListener('input', function () {
          remarks[input.getAttribute('data-remark-split')] = input.value || '';
        });
      });

      splitListEl.querySelectorAll('[data-expand-split]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-expand-split');
          var detail = splitListEl.querySelector('[data-split-detail="' + key + '"]');
          if (!detail) return;
          var open = detail.hidden;
          detail.hidden = !open;
          var group = splits.find(function (s) {
            return s.key === key;
          });
          btn.innerHTML =
            (open ? '收起' : '共' + (group ? group.totalQty : '') + '件') + chevron;
        });
      });
    }

    if (goodsTotalEl) goodsTotalEl.textContent = formatMoney(goodsTotal);
    if (freightEl) freightEl.textContent = freight > 0 ? formatMoney(freight) : '免运费';
    if (couponDiscountEl) couponDiscountEl.textContent = '-¥0.00';
    if (sumEl) sumEl.textContent = formatMoney(payable);
    if (payEl) payEl.textContent = formatMoney(payable);
    if (paySheetAmount) paySheetAmount.textContent = formatMoney(payable);

    function openPaySheet() {
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

    document.getElementById('confirmAddressCard') &&
      document.getElementById('confirmAddressCard').addEventListener('click', function () {
        showToast('选择收货地址（演示）');
      });

    document.getElementById('confirmServiceBtn') &&
      document.getElementById('confirmServiceBtn').addEventListener('click', function () {
        showToast('联系客服（演示）');
      });

    document.getElementById('confirmInvoiceRow') &&
      document.getElementById('confirmInvoiceRow').addEventListener('click', function () {
        showToast('发票设置（演示）');
      });

    document.getElementById('confirmCouponRow') &&
      document.getElementById('confirmCouponRow').addEventListener('click', function () {
        showToast('暂无可用优惠券');
      });

    document.getElementById('confirmFreightHelp') &&
      document.getElementById('confirmFreightHelp').addEventListener('click', function () {
        showToast(hasExpress ? '快递订单满额包邮（演示）' : '自提订单无需运费');
      });

    if (agreeCheck) {
      agreeCheck.addEventListener('click', function () {
        var next = !agreeCheck.classList.contains('is-checked');
        agreeCheck.classList.toggle('is-checked', next);
        agreeCheck.setAttribute('aria-checked', next ? 'true' : 'false');
      });
    }

    document.getElementById('confirmPayBtn') &&
      document.getElementById('confirmPayBtn').addEventListener('click', function () {
        if (agreeCheck && !agreeCheck.classList.contains('is-checked')) {
          showToast('请先同意交易服务协议');
          return;
        }
        openPaySheet();
      });

    document.querySelectorAll('[data-confirm-close]').forEach(function (el) {
      el.addEventListener('click', closePaySheet);
    });

    document.querySelectorAll('[data-pay-method]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        payMethod = btn.getAttribute('data-pay-method');
        syncPayMethodUI();
      });
    });

    document.getElementById('confirmPaySubmit') &&
      document.getElementById('confirmPaySubmit').addEventListener('click', function () {
        closePaySheet();
        showToast('支付成功（演示）');
        setTimeout(function () {
          window.location.href = 'orders.html';
        }, 800);
      });
  }

  function initHomePage() {
    ensureCart();
    syncBadges();
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
          var price = getLivePrice(p);
          var actions = inLive
            ? '<div class="ua-live-goods__stepper">' +
              '<button type="button" data-live-minus="' +
              p.id +
              '">−</button>' +
              '<span>' +
              liveItem.qty +
              '</span>' +
              '<button type="button" data-live-plus="' +
              p.id +
              '">+</button></div>'
            : '<div class="ua-live-goods__ops">' +
              '<button type="button" class="ua-live-goods__add" data-live-add="' +
              p.id +
              '" aria-label="加入购物车">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.1 10.5h9.8L19 8H7"/></svg>' +
              '</button>' +
              '<button type="button" class="ua-live-goods__buy" data-live-rush="' +
              p.id +
              '">去抢购</button></div>';
          return (
            '<article class="ua-live-goods__item">' +
            '<div class="ua-live-goods__thumb">' +
            '<span class="ua-live-goods__rank">' +
            (index + 1) +
            '</span>' +
            '<img src="' +
            p.img +
            '" alt="">' +
            (p.watermark
              ? '<span class="ua-shop-watermark ua-shop-watermark--sm">生产验证商品<br>请勿下单</span>'
              : '') +
            '</div>' +
            '<div class="ua-live-goods__info">' +
            '<div class="ua-live-goods__name">' +
            p.shortName +
            '</div>' +
            '<div class="ua-live-goods__stock">库存' +
            (p.liveStock != null ? p.liveStock : 66) +
            '</div>' +
            '<div class="ua-live-goods__bottom">' +
            '<div class="ua-live-goods__price"><small>¥</small>' +
            Number(price).toFixed(2) +
            '</div>' +
            actions +
            '</div></div></article>'
          );
        })
        .join('');
      updateLiveFooter();
    }

    function openSkuSheet(productId) {
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

    function renderConfirmSheet(items) {
      state.confirmItems = items || [];
      var body = document.getElementById('liveConfirmBody');
      var payEl = document.getElementById('liveConfirmPay');
      if (!body) return;
      var total = 0;
      var count = 0;
      var goodsHtml = state.confirmItems
        .map(function (item) {
          total += item.price * item.qty;
          count += item.qty;
          return (
            '<div class="ua-live-confirm__item">' +
            '<img src="' +
            item.img +
            '" alt="">' +
            '<div class="ua-live-confirm__item-body">' +
            '<div class="ua-live-confirm__item-name">' +
            item.name +
            '</div>' +
            '<div class="ua-live-confirm__item-spec">' +
            item.spec +
            '</div>' +
            '<div class="ua-live-confirm__item-row">' +
            '<span class="ua-live-confirm__item-price">¥' +
            formatPriceLabel(item.price) +
            '</span>' +
            '<span class="ua-live-confirm__item-qty">x' +
            item.qty +
            '</span></div></div></div>'
          );
        })
        .join('');
      body.innerHTML =
        goodsHtml +
        '<div class="ua-live-confirm__rows">' +
        '<div class="ua-live-confirm__row"><span>商品总价 <em>共计' +
        count +
        '件商品</em></span><strong>¥' +
        formatPriceLabel(total) +
        '</strong></div>' +
        '<div class="ua-live-confirm__row"><span>优惠券</span><span class="ua-live-confirm__muted">暂无可用优惠券</span></div>' +
        '<div class="ua-live-confirm__row ua-live-confirm__row--sum"><span>合计</span><strong>¥' +
        formatPriceLabel(total) +
        '</strong></div></div>' +
        '<div class="ua-live-confirm__payway">' +
        '<span class="ua-live-confirm__wx"><i></i>微信支付</span>' +
        '<span class="ua-shop-check is-checked" aria-hidden="true"></span></div>';
      if (payEl) payEl.textContent = formatMoney(total);
    }

    function openConfirmWithLiveCart() {
      var items = getLiveCartItems().map(function (item) {
        var p = PRODUCTS[item.id];
        return {
          id: item.id,
          name: p.shortName || p.name,
          spec: item.spec || (p && p.spec) || '',
          price: Number(item.price != null ? item.price : getLivePrice(p)),
          img: p.img,
          qty: item.qty
        };
      });
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
      renderConfirmSheet([
        {
          id: cur.product.id,
          name: cur.product.shortName || cur.product.name,
          spec: cur.spec.label,
          price: cur.spec.price,
          img: cur.product.img,
          qty: cur.qty
        }
      ]);
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
          openSkuSheet(addBtn.getAttribute('data-live-add'));
          return;
        }
        var rushBtn = e.target.closest('[data-live-rush]');
        if (rushBtn) {
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
        showToast('支付功能演示');
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
        var input = document.getElementById('liveCommentInput');
        var text = input && String(input.value || '').trim();
        if (!text) {
          showToast('请输入内容');
          return;
        }
        if (input) input.value = '';
        showToast('发送成功');
      });
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
