(function (global) {
  var CART_KEY = 'ua_shop_cart_v1';
  var LIVE_CART_KEY = 'ua_live_cart_v1';
  var STORE = {
    id: 'store-prod-verify',
    name: '生产验证门店',
    avatar: '../assets/restock/me-shop-avatar.svg',
    address: '上海市市辖区青浦区上海市青浦区华新镇纪鹤公路1301号7幢1层121室',
    contact: '斯斯 159****4315'
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
      pickupStore: '冷丰特选-博地中心店',
      distance: '180m',
      pickupBadge: '后天可提',
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
      pickupStore: '冷丰特选-博地中心店',
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
      pickupStore: '冷丰特选-博地中心店',
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
      pickupStore: '冷丰特选-博地中心店',
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
      pickupStore: '冷丰特选-博地中心店',
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
    if (cart && Array.isArray(cart.items) && cart.items.length) return cart;
    cart = {
      store: STORE,
      items: [
        { id: 'wonton-corn', qty: 1, checked: true, source: 'mall' },
        { id: 'dumpling', qty: 1, checked: true, source: 'mall' },
        { id: 'wonton-pork', qty: 1, checked: true, source: 'mall' }
      ]
    };
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
    if (item) {
      item.qty += addQty;
    } else {
      cart.items.push({
        id: id,
        qty: addQty,
        checked: true,
        source: 'mall',
        price: price,
        spec: spec
      });
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
        return {
          id: p.id,
          name: p.name,
          spec: itemSpecText(item),
          price: itemUnitPrice(item),
          img: p.img,
          watermark: p.watermark,
          qty: item.qty
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

  function initGoodsDetailPage() {
    ensureCart();
    var params = new URLSearchParams(window.location.search);
    var product = getProduct(params.get('id') || 'beef-tendon');
    var selectedSpec = product.defaultSpec || (product.specs && product.specs[0]) || product.spec;
    var sheetIntent = 'pick';

    var from = params.get('from') || 'mall.html';
    var back = document.getElementById('goodsDetailBack');
    if (back) back.setAttribute('href', from);

    function renderBase() {
      document.title = product.shortName || product.name + ' · 用户 APP';
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
      setText('goodsDetailPickupStore', '提货点：' + (product.pickupStore || '冷丰特选-博地中心店'));
      setText('goodsDetailDistance', product.distance || '180m');
      setText('goodsDetailPickupBadge', product.pickupBadge || '后天可提');
      setText('goodsDetailSpecValue', selectedSpec);
      setText('goodsDetailSpecCount', String((product.specs || []).length || 1));
      setText('goodsDetailReviewCount', String(product.reviewCount || 0));
    }

    function setText(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
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
      var sheet = document.getElementById('goodsDetailSpecSheet');
      if (sheet) sheet.hidden = false;
    }

    function closeSpecSheet() {
      var sheet = document.getElementById('goodsDetailSpecSheet');
      if (sheet) sheet.hidden = true;
      sheetIntent = 'pick';
    }

    function addCurrentToCart() {
      addToCart(product.id, 1);
      showToast('已加入购物车');
    }

    renderBase();

    document.getElementById('goodsDetailSpecRow') &&
      document.getElementById('goodsDetailSpecRow').addEventListener('click', function () {
        openSpecSheet('pick');
      });

    document.querySelectorAll('[data-gd-close]').forEach(function (el) {
      el.addEventListener('click', closeSpecSheet);
    });

    document.getElementById('goodsDetailSpecConfirm') &&
      document.getElementById('goodsDetailSpecConfirm').addEventListener('click', function () {
        setText('goodsDetailSpecValue', selectedSpec);
        var intent = sheetIntent;
        closeSpecSheet();
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

    document.getElementById('goodsDetailShareBtn') &&
      document.getElementById('goodsDetailShareBtn').addEventListener('click', function () {
        showToast('分享功能演示');
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
    var listEl = document.getElementById('cartItemList');
    var storeCheck = document.getElementById('cartStoreCheck');
    var totalEl = document.getElementById('cartTotal');
    var checkoutBtn = document.getElementById('cartCheckoutBtn');
    var emptyEl = document.getElementById('cartEmpty');
    var cardEl = document.getElementById('cartCard');
    if (!listEl) return;

    if (!cart.items.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (cardEl) cardEl.hidden = true;
      if (totalEl) totalEl.textContent = '¥0.00';
      if (checkoutBtn) checkoutBtn.textContent = '立即下单(0)';
      syncBadges();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (cardEl) cardEl.hidden = false;

    var allChecked = cart.items.every(function (it) {
      return it.checked;
    });
    if (storeCheck) {
      storeCheck.classList.toggle('is-checked', allChecked);
      storeCheck.setAttribute('aria-checked', allChecked ? 'true' : 'false');
    }

    listEl.innerHTML = cart.items
      .map(function (item) {
        var p = PRODUCTS[item.id];
        if (!p) return '';
        return (
          '<div class="ua-cart-item" data-id="' +
          p.id +
          '">' +
          '<button type="button" class="ua-shop-check' +
          (item.checked ? ' is-checked' : '') +
          '" data-cart-check="' +
          p.id +
          '" aria-label="选择"></button>' +
          '<div class="ua-cart-item__thumb">' +
          '<img src="' +
          p.img +
          '" alt="">' +
          (p.watermark
            ? '<span class="ua-shop-watermark">生产验证商品<br>请勿下单</span>'
            : '') +
          '</div>' +
          '<div class="ua-cart-item__body">' +
          '<div class="ua-cart-item__name">' +
          p.name +
          '</div>' +
          '<div class="ua-cart-item__spec">规格：' +
          itemSpecText(item) +
          '</div>' +
          '<div class="ua-cart-item__price">' +
          formatMoney(itemUnitPrice(item)) +
          '</div>' +
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
          '</div>' +
          '</div>'
        );
      })
      .join('');

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
        if (item.qty <= 1) {
          removeCartItem(id);
        } else {
          setQty(id, item.qty - 1);
        }
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

    if (storeCheck) {
      storeCheck.onclick = function () {
        toggleAll(!allChecked);
        renderCart();
      };
    }

    var summary = getCheckedSummary(cart);
    if (totalEl) totalEl.textContent = formatMoney(summary.total);
    if (checkoutBtn) checkoutBtn.textContent = '立即下单(' + summary.count + ')';
    syncBadges();
  }

  function initOrderConfirmPage() {
    ensureCart();
    var items = getCheckoutItems();
    var listEl = document.getElementById('confirmItemList');
    var goodsTotalEl = document.getElementById('confirmGoodsTotal');
    var sumEl = document.getElementById('confirmSum');
    var payEl = document.getElementById('confirmPayAmount');
    var countEl = document.getElementById('confirmGoodsCount');

    if (!items.length) {
      window.location.href = 'cart.html';
      return;
    }

    var total = 0;
    var count = 0;
    listEl.innerHTML = items
      .map(function (p) {
        total += p.price * p.qty;
        count += p.qty;
        return (
          '<div class="ua-confirm-item">' +
          '<div class="ua-confirm-item__thumb">' +
          '<img src="' +
          p.img +
          '" alt="">' +
          (p.watermark
            ? '<span class="ua-shop-watermark ua-shop-watermark--sm">生产验证商品<br>请勿下单</span>'
            : '') +
          '</div>' +
          '<div class="ua-confirm-item__body">' +
          '<div class="ua-confirm-item__name">' +
          p.name +
          '</div>' +
          '<div class="ua-confirm-item__spec">' +
          p.spec +
          '</div>' +
          '<div class="ua-confirm-item__price">¥' +
          p.price +
          '</div>' +
          '</div>' +
          '<div class="ua-confirm-item__qty">x' +
          p.qty +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    if (countEl) countEl.textContent = '共计' + count + '件商品';
    if (goodsTotalEl) goodsTotalEl.textContent = '¥' + total;
    if (sumEl) sumEl.textContent = '¥' + total;
    if (payEl) payEl.textContent = formatMoney(total);

    document.getElementById('confirmPayBtn') &&
      document.getElementById('confirmPayBtn').addEventListener('click', function () {
        showToast('支付功能演示');
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
    ensureCart: ensureCart,
    addToCart: addToCart,
    syncBadges: syncBadges,
    initHomePage: initHomePage,
    initLiveRoomPage: initLiveRoomPage,
    initMallPage: initMallPage,
    initCartPage: initCartPage,
    initOrderConfirmPage: initOrderConfirmPage,
    initGoodsDetailPage: initGoodsDetailPage,
    formatMoney: formatMoney,
    getCheckedSummary: getCheckedSummary
  };
})(window);
