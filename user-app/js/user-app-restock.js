(function () {
  var STORAGE_KEY = 'ua_user_session_v1';
  var CART_KEY = 'ua_restock_cart_v1';
  var CART_PAGE_KEY = 'ua_restock_cart_page_v1';
  var CART_PLACEHOLDER_IMG = '../assets/restock/product-leaf.svg';
  var CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

  var tabs = document.querySelectorAll('.ua-restock-tab[data-tab]');
  var panels = document.querySelectorAll('.ua-restock-panel');
  var loginBar = document.getElementById('restockLoginBar');
  var loginBtn = document.getElementById('restockLoginBtn');
  var cartListEl = document.getElementById('restockCartBody');
  var cartEmptyEl = document.getElementById('restockCartEmpty');
  var cartFooterEl = document.getElementById('restockCartBar');
  var cartInvalidWrapEl = document.getElementById('restockCartInvalidWrap');
  var cartSelectAllEl = document.getElementById('restockCartSelectAll');
  var cartTotalEl = document.getElementById('restockCartTotal');
  var cartBadgeEl = document.getElementById('restockCartBadge');
  var mobileShellEl = document.querySelector('.ua-mobile-shell');
  var memoryCart = null;
  var memoryCartPage = null;

  function readCart() {
    if (!memoryCart) {
      try {
        var raw = localStorage.getItem(CART_KEY);
        memoryCart = raw ? JSON.parse(raw) : [];
      } catch (e) {
        memoryCart = [];
      }
    }
    return memoryCart.slice();
  }

  function writeCart(items) {
    memoryCart = (items || []).slice();
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(memoryCart));
    } catch (e) {
      /* file:// 等环境 localStorage 不可用时仍保留内存购物车 */
    }
  }

  function readSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    var s = readSession();
    return !!(s && s.loggedIn);
  }

  var ME_ACTION_LABELS = {
    deposit: '退押金',
    returns: '退货/售后',
    invoice: '开发票',
    bill: '账单',
    support: '联系客服',
    sales: '销售经理',
    faq: '常见问题',
    rules: '售后规则',
    fraud: '防诈预警',
    share: '分享APP',
    coupons: '优惠券',
    balance: '余额',
    topup: '需补金额',
    wallet: '我的钱包'
  };

  function goLogin(nextTab) {
    var next = 'restock.html';
    if (nextTab) next += '?tab=' + encodeURIComponent(nextTab);
    window.location.href = 'login.html?next=' + encodeURIComponent(next) + '&force=1';
  }

  function requireLoginForMe(actionLabel) {
    if (isLoggedIn()) return true;
    if (window.confirm('请先登录后再使用「' + (actionLabel || '该功能') + '」')) {
      goLogin('me');
    }
    return false;
  }

  function handleMeAction(action) {
    var label = ME_ACTION_LABELS[action] || action;
    if (action === 'share') {
      window.alert('分享APP（演示）');
      return;
    }
    if (action === 'support' || action === 'sales') {
      window.alert(label + '（演示）');
      return;
    }
    if (!requireLoginForMe(label)) return;
    window.alert(label + '（演示）');
  }

  function switchTab(tabId) {
    if (tabId === 'orders') {
      window.location.href = 'orders.html?from=restock.html';
      return;
    }
    var prevPanel = document.querySelector('.ua-restock-panel--active');
    var prevTabId = prevPanel ? prevPanel.getAttribute('data-panel') : '';
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-tab') === tabId;
      tab.classList.toggle('ua-restock-tab--active', active);
    });
    panels.forEach(function (panel) {
      var active = panel.getAttribute('data-panel') === tabId;
      panel.classList.toggle('ua-restock-panel--active', active);
      panel.hidden = !active;
    });
    if (loginBar) {
      loginBar.hidden = isLoggedIn() || (tabId !== 'home' && tabId !== 'category');
    }
    var statusEl = document.querySelector('.ua-restock-status');
    if (statusEl) {
      statusEl.classList.toggle('ua-restock-status--me', tabId === 'me');
    }
    if (tabId === 'cart') renderCart();
    if (tabId === 'me') renderMe();
    if (tabId === 'category') {
      if (prevTabId !== 'category') {
        renderCategoryContent();
      }
      updatePriceVisibility();
      syncAllSpecAddBtnsFromCart();
    }
  }

  function updatePriceVisibility() {
    var loggedIn = isLoggedIn();
    document.querySelectorAll('.ua-restock-product__price, .ua-restock-cat-product__price, .ua-restock-cat-product__spec-price, .ua-restock-cat-product__spec-preview-price').forEach(function (el) {
      var real = el.getAttribute('data-price');
      if (loggedIn && real) {
        el.textContent = real;
        el.classList.remove('ua-restock-product__price--hidden');
      } else {
        el.textContent = '****';
        el.classList.add('ua-restock-product__price--hidden');
      }
    });
    var activePanel = document.querySelector('.ua-restock-panel--active');
    var panelId = activePanel ? activePanel.getAttribute('data-panel') : '';
    if (loginBar) loginBar.hidden = loggedIn || (panelId !== 'home' && panelId !== 'category');
    if (panelId === 'cart') renderCart();
  }

  function getCartQty(specId) {
    var found = readCart().find(function (x) {
      return x.id === specId;
    });
    return found ? found.qty : 0;
  }

  function getCartTotalQty() {
    return getCartItemCount(readCartPageState());
  }

  function formatCartPrice(num) {
    var n = Math.round(num * 100) / 100;
    var str =
      n % 1 === 0
        ? String(Math.round(n))
        : Math.round(n * 10) === n * 10
          ? n.toFixed(1)
          : n.toFixed(2);
    str = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return '¥ ' + str;
  }

  function formatCartTotal(num) {
    return '¥ ' + num.toFixed(2);
  }

  function createDefaultCartGroup() {
    return {
      id: 'cart',
      name: '',
      tag: '',
      shipText: '差60.00元减6.00元运费',
      shipDone: false,
      blocks: [{
        items: [
          {
            id: 'eggplant-long-5',
            spuId: 'eggplant-long',
            title: '长茄子 广茄',
            spec: '5斤',
            priceNum: 21,
            qty: 1,
            selected: false,
            img: '../assets/restock/product-eggplant-long.svg'
          }
        ]
      }]
    };
  }

  var SPU_SPEC_CATALOG = {
    'eggplant-long': {
      title: '长茄子 广茄',
      img: '../assets/restock/product-eggplant-long.svg',
      dimensions: [
        {
          key: 'color',
          label: '颜色',
          options: [
            { value: 'black', label: '黑色' },
            { value: 'red', label: '红色' }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'eggplant-long-5', label: '5斤', specId: 'eggplant-long-5', priceNum: 21, available: false },
            { value: 'eggplant-long-10', label: '10斤', specId: 'eggplant-long-10', priceNum: 40, available: true },
            { value: 'eggplant-long-20', label: '20斤', specId: 'eggplant-long-20', priceNum: 78, available: true }
          ]
        },
        {
          key: 'gift',
          label: '包装礼盒(免费)',
          options: [
            { value: 'joy', label: '喜气洋洋' },
            { value: 'abundance', label: '年年有余' }
          ]
        }
      ],
      specs: [
        { id: 'eggplant-long-5', label: '5斤', priceNum: 21, available: false },
        { id: 'eggplant-long-10', label: '10斤', priceNum: 40, available: true },
        { id: 'eggplant-long-20', label: '20斤', priceNum: 78, available: true }
      ]
    },
    'eggplant-round': {
      title: '圆茄 优质',
      img: '../assets/restock/product-eggplant-round.svg',
      dimensions: [
        {
          key: 'color',
          label: '颜色',
          options: [
            { value: 'purple', label: '紫色' },
            { value: 'black', label: '黑色' }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'eggplant-round-5', label: '5斤', specId: 'eggplant-round-5', priceNum: 17.5, available: false },
            { value: 'eggplant-round-10', label: '10斤', specId: 'eggplant-round-10', priceNum: 34, available: false },
            { value: 'eggplant-round-20', label: '20斤', specId: 'eggplant-round-20', priceNum: 66, available: false }
          ]
        },
        {
          key: 'gift',
          label: '包装礼盒(免费)',
          options: [
            { value: 'joy', label: '喜气洋洋' },
            { value: 'abundance', label: '年年有余' }
          ]
        }
      ],
      specs: [
        { id: 'eggplant-round-5', label: '5斤', priceNum: 17.5, available: false },
        { id: 'eggplant-round-10', label: '10斤', priceNum: 34, available: false },
        { id: 'eggplant-round-20', label: '20斤', priceNum: 66, available: false }
      ]
    },
    'leaf-y1': {
      title: '油麦菜【菜鲜】',
      img: '../assets/restock/product-leaf.svg',
      dimensions: [
        {
          key: 'color',
          label: '颜色',
          options: [
            { value: 'green', label: '翠绿' },
            { value: 'light', label: '浅绿' }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'leaf-y1-5', label: '5斤', specId: 'leaf-y1-5', priceNum: 16, available: false },
            { value: 'leaf-y1-10', label: '10斤', specId: 'leaf-y1-10', priceNum: 30, available: true },
            { value: 'leaf-y1-20', label: '20斤', specId: 'leaf-y1-20', priceNum: 58, available: true }
          ]
        },
        {
          key: 'gift',
          label: '包装礼盒(免费)',
          options: [
            { value: 'joy', label: '喜气洋洋' },
            { value: 'abundance', label: '年年有余' }
          ]
        }
      ],
      specs: [
        { id: 'leaf-y1-5', label: '5斤', priceNum: 16, available: false },
        { id: 'leaf-y1-10', label: '10斤', priceNum: 30, available: true },
        { id: 'leaf-y1-20', label: '20斤', priceNum: 58, available: true }
      ]
    },
    'leaf-y4': {
      title: '四季清香 油麦菜小颗',
      img: '../assets/restock/product-leaf.svg',
      dimensions: [
        {
          key: 'color',
          label: '颜色',
          options: [
            { value: 'green', label: '翠绿' },
            { value: 'light', label: '浅绿' }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'leaf-y4-5', label: '5斤', specId: 'leaf-y4-5', priceNum: 20, available: false },
            { value: 'leaf-y4-10', label: '10斤', specId: 'leaf-y4-10', priceNum: 38, available: false },
            { value: 'leaf-y4-20', label: '20斤', specId: 'leaf-y4-20', priceNum: 72, available: false }
          ]
        },
        {
          key: 'gift',
          label: '包装礼盒(免费)',
          options: [
            { value: 'joy', label: '喜气洋洋' },
            { value: 'abundance', label: '年年有余' }
          ]
        }
      ],
      specs: [
        { id: 'leaf-y4-5', label: '5斤', priceNum: 20, available: false },
        { id: 'leaf-y4-10', label: '10斤', priceNum: 38, available: false },
        { id: 'leaf-y4-20', label: '20斤', priceNum: 72, available: false }
      ]
    }
  };

  function getSpuDimensions(spu) {
    if (spu && spu.dimensions && spu.dimensions.length) return spu.dimensions;
    if (!spu || !spu.specs) return [];
    return [
      {
        key: 'spec',
        label: '规格',
        skuKey: true,
        options: spu.specs.map(function (s) {
          return {
            value: s.id,
            label: s.label,
            specId: s.id,
            priceNum: s.priceNum,
            available: s.available !== false
          };
        })
      }
    ];
  }

  function getSpuById(spuId) {
    return SPU_SPEC_CATALOG[spuId] || null;
  }

  function findSpuBySpecId(specId) {
    var keys = Object.keys(SPU_SPEC_CATALOG);
    for (var i = 0; i < keys.length; i++) {
      var spuId = keys[i];
      var spu = SPU_SPEC_CATALOG[spuId];
      var specs = spu.specs || [];
      for (var j = 0; j < specs.length; j++) {
        if (specs[j].id === specId) {
          return { spuId: spuId, spu: spu, spec: specs[j] };
        }
      }
    }
    return null;
  }

  function resolveStockStatus(item) {
    var found = findSpuBySpecId(item.id);
    if (!found) return 'available';
    if (found.spec.available) return 'available';
    var hasOther = found.spu.specs.some(function (s) {
      return s.available && s.id !== item.id;
    });
    return hasOther ? 'spec_invalid' : 'spu_invalid';
  }

  function isCartItemSelectable(item) {
    return item.stockStatus !== 'spec_invalid';
  }

  function addToInvalidItems(state, item, reason) {
    if (!Array.isArray(state.invalidItems)) state.invalidItems = [];
    var sourceId = item.id;
    var exists = state.invalidItems.some(function (inv) {
      return inv.sourceId === sourceId || inv.id === 'invalid-' + sourceId;
    });
    if (exists) return;
    state.invalidItems.unshift({
      id: 'invalid-' + sourceId,
      sourceId: sourceId,
      title: item.title,
      reason: reason || '商品库存不足',
      img: item.img || CART_PLACEHOLDER_IMG
    });
    state.invalidDismissed = false;
  }

  function removeCartItem(state, itemId) {
    (state.stores || []).forEach(function (store) {
      (store.blocks || []).forEach(function (block) {
        block.items = (block.items || []).filter(function (item) {
          return item.id !== itemId;
        });
      });
    });
    return state;
  }

  function processCartStock(state) {
    state = ensureCartPageStores(state);
    var toRemove = [];
    forEachCartItem(state, function (item) {
      var status = resolveStockStatus(item);
      if (status === 'spu_invalid') {
        toRemove.push(item.id);
        addToInvalidItems(state, item, item.offShelf ? '商品已下架' : '商品库存不足');
      } else if (status === 'spec_invalid') {
        item.stockStatus = 'spec_invalid';
        item.selected = false;
        var found = findSpuBySpecId(item.id);
        if (found) {
          item.spuId = found.spuId;
          if (!item.title) item.title = found.spu.title;
          if (!item.img) item.img = found.spu.img;
        }
      } else {
        delete item.stockStatus;
      }
    });
    toRemove.forEach(function (id) {
      removeCartItem(state, id);
    });
    return state;
  }

  function replaceCartSpec(state, oldItemId, newSpecMeta) {
    var oldItem = findCartItem(state, oldItemId);
    if (!oldItem || !newSpecMeta) return state;
    var found = findSpuBySpecId(newSpecMeta.id);
    var spu = found ? found.spu : null;
    var merged = findCartItem(state, newSpecMeta.id);
    if (merged && merged.id !== oldItemId) {
      merged.qty = (merged.qty || 0) + (oldItem.qty || 1);
      removeCartItem(state, oldItemId);
    } else {
      oldItem.id = newSpecMeta.id;
      oldItem.spec = newSpecMeta.label;
      oldItem.priceNum = newSpecMeta.priceNum;
      if (spu) {
        oldItem.title = spu.title;
        oldItem.img = spu.img;
        oldItem.spuId = found.spuId;
      }
      delete oldItem.stockStatus;
      oldItem.selected = false;
    }
    return processCartStock(state);
  }

  function normalizeWholesaleCartState(state) {
    state = ensureCartPageStores(state);
    var items = [];
    var shipText = '';
    var shipDone = false;
    (state.stores || []).forEach(function (store) {
      if (!shipText && store.shipText) shipText = store.shipText;
      if (store.shipDone) shipDone = true;
      (store.blocks || []).forEach(function (block) {
        (block.items || []).forEach(function (item) {
          items.push(item);
        });
      });
    });
    state.stores = [
      {
        id: 'cart',
        name: '',
        tag: '',
        shipText: shipText || '差60.00元减6.00元运费',
        shipDone: shipDone,
        blocks: [{ items: items }]
      }
    ];
    return state;
  }

  function getDefaultInvalidItems() {
    return [
      {
        id: 'invalid-eggplant',
        title: '圆茄 优质 5斤',
        reason: '商品库存不足',
        img: '../assets/restock/product-eggplant-round.svg'
      },
      {
        id: 'invalid-leaf',
        title: '本地散叶生菜 普通',
        reason: '商品库存不足',
        img: '../assets/restock/product-leaf.svg'
      }
    ];
  }

  function ensureCartPageStores(state) {
    if (!state) state = {};
    if (!Array.isArray(state.invalidItems)) state.invalidItems = [];
    if (!state.invalidDismissed && !state.invalidItems.length) {
      state.invalidItems = getDefaultInvalidItems();
    }
    if (!state.stores || !state.stores.length) {
      state.stores = [createDefaultCartGroup()];
    }
    state.stores.forEach(function (store) {
      if (!store.blocks || !store.blocks.length) {
        store.blocks = [{ items: [] }];
      }
      store.blocks.forEach(function (block) {
        if (!Array.isArray(block.items)) block.items = [];
      });
    });
    return state;
  }

  function upsertCartPageItem(payload) {
    var state = normalizeWholesaleCartState(readCartPageState());
    var found = findCartItem(state, payload.id);
    if (found) {
      found.qty = (found.qty || 0) + 1;
      writeCartPageState(state);
      syncFlatCartFromPageState(state);
      return found.qty;
    }
    var block = state.stores[0].blocks[0];
    block.items.push({
      id: payload.id,
      title: payload.title,
      spec: payload.spec || '',
      priceNum: payload.priceNum,
      qty: 1,
      selected: false,
      img: payload.img || CART_PLACEHOLDER_IMG,
      userAdded: true,
      spuId: (findSpuBySpecId(payload.id) || {}).spuId || ''
    });
    writeCartPageState(state);
    syncFlatCartFromPageState(state);
    return 1;
  }

  function updateCartBadge(pulse) {
    var total = getCartTotalQty();
    if (!cartBadgeEl) return;
    if (total > 0) {
      cartBadgeEl.textContent = total > 99 ? '99+' : String(total);
      cartBadgeEl.hidden = false;
      cartBadgeEl.classList.add('ua-restock-cart-badge--visible');
    } else {
      cartBadgeEl.hidden = true;
      cartBadgeEl.classList.remove('ua-restock-cart-badge--visible');
    }
    if (pulse) {
      cartBadgeEl.classList.remove('ua-restock-cart-badge--pulse');
      void cartBadgeEl.offsetWidth;
      cartBadgeEl.classList.add('ua-restock-cart-badge--pulse');
    }
  }

  function syncAllSpecAddBtnsFromCart() {
    readCart().forEach(function (item) {
      updateSpecAddBtnQty(item.id, item.qty);
    });
    document.querySelectorAll('.ua-restock-product__add[data-id]').forEach(function (btn) {
      var qty = getCartQty(btn.getAttribute('data-id'));
      if (qty > 0) {
        btn.textContent = '×' + qty;
        btn.classList.add('ua-restock-product__add--qty');
      } else {
        btn.textContent = '+';
        btn.classList.remove('ua-restock-product__add--qty');
      }
    });
    document.querySelectorAll('.ua-restock-product').forEach(function (card) {
      var id = card.getAttribute('data-id');
      var btn = card.querySelector('.ua-restock-product__add');
      if (!btn || !id) return;
      var qty = getCartQty(id);
      btn.setAttribute('data-id', id);
      if (qty > 0) {
        btn.textContent = '×' + qty;
        btn.classList.add('ua-restock-product__add--qty');
      } else {
        btn.textContent = '+';
        btn.classList.remove('ua-restock-product__add--qty');
      }
    });
  }

  function updateSpecAddBtnQty(specId, qty) {
    if (!specId) return;
    var selector = '.ua-restock-cat-product__spec-add[data-id="' + specId.replace(/"/g, '\\"') + '"]';
    document.querySelectorAll(selector).forEach(function (btn) {
      if (qty > 0) {
        btn.textContent = '×' + qty;
        btn.classList.add('ua-restock-cat-product__spec-add--qty');
      } else {
        btn.textContent = '+';
        btn.classList.remove('ua-restock-cat-product__spec-add--qty');
      }
    });
  }

  function playFlyToCartAnimation(fromEl, imgSrc) {
    var cartTab = document.querySelector('.ua-restock-tab[data-tab="cart"]');
    if (!fromEl || !cartTab) return;

    var imgWrap = fromEl.closest('.ua-restock-cat-product, .ua-restock-product');
    if (!imgSrc && imgWrap) {
      var imgEl = imgWrap.querySelector('img');
      if (imgEl) imgSrc = imgEl.getAttribute('src');
    }
    if (!imgSrc) return;

    var mount = mobileShellEl || document.body;
    var mountRect = mount.getBoundingClientRect();
    var fromRect = fromEl.getBoundingClientRect();
    var toRect = cartTab.getBoundingClientRect();
    var startX = fromRect.left + fromRect.width / 2 - mountRect.left;
    var startY = fromRect.top + fromRect.height / 2 - mountRect.top;
    var endX = toRect.left + toRect.width / 2 - mountRect.left;
    var endY = toRect.top + toRect.height / 2 - mountRect.top;

    var fly = document.createElement('div');
    fly.className = 'ua-restock-fly-cart';
    fly.innerHTML = '<img src="' + imgSrc + '" alt="">';
    fly.style.left = startX + 'px';
    fly.style.top = startY + 'px';
    fly.style.setProperty('--fly-x', endX - startX + 'px');
    fly.style.setProperty('--fly-y', endY - startY + 'px');
    mount.appendChild(fly);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fly.classList.add('ua-restock-fly-cart--active');
      });
    });

    window.setTimeout(function () {
      if (fly.parentNode) fly.parentNode.removeChild(fly);
    }, 620);
  }

  function getDefaultCartPageState() {
    return {
      invalidCollapsed: true,
      invalidDismissed: false,
      stores: [createDefaultCartGroup()],
      invalidItems: getDefaultInvalidItems()
    };
  }

  function readCartPageState() {
    if (memoryCartPage) {
      return ensureCartPageStores(JSON.parse(JSON.stringify(memoryCartPage)));
    }
    try {
      var raw = localStorage.getItem(CART_PAGE_KEY);
      if (raw) {
        memoryCartPage = ensureCartPageStores(JSON.parse(raw));
        return JSON.parse(JSON.stringify(memoryCartPage));
      }
    } catch (e) {
      /* ignore */
    }
    memoryCartPage = getDefaultCartPageState();
    return JSON.parse(JSON.stringify(memoryCartPage));
  }

  function writeCartPageState(state) {
    memoryCartPage = ensureCartPageStores(JSON.parse(JSON.stringify(state)));
    try {
      localStorage.setItem(CART_PAGE_KEY, JSON.stringify(memoryCartPage));
    } catch (e) {
      /* file:// 等环境 localStorage 不可用时仍保留内存购物车 */
    }
  }

  function forEachCartItem(state, fn) {
    (state.stores || []).forEach(function (store) {
      (store.blocks || []).forEach(function (block) {
        (block.items || []).forEach(function (item) {
          fn(item, store, block);
        });
      });
    });
  }

  function findCartItem(state, itemId) {
    var found = null;
    forEachCartItem(state, function (item) {
      if (item.id === itemId) found = item;
    });
    return found;
  }

  function getCartItemCount(state) {
    var n = 0;
    forEachCartItem(state, function (item) {
      n += item.qty || 0;
    });
    return n;
  }

  function syncFlatCartFromPageState(state) {
    var flat = [];
    forEachCartItem(state, function (item) {
      flat.push({
        id: item.id,
        title: item.title,
        spec: item.spec || '',
        price: formatCartPrice(item.priceNum),
        priceNum: item.priceNum,
        img: item.img || CART_PLACEHOLDER_IMG,
        qty: item.qty
      });
    });
    writeCart(flat);
  }

  function mergeUserItemsIntoCartPage(state) {
    state = ensureCartPageStores(state);
    var userItems = readCart();
    if (!userItems.length) return state;
    var online = state.stores[0];
    var block = online.blocks[0];
    userItems.forEach(function (u) {
      if (findCartItem(state, u.id)) return;
      block.items.push({
        id: u.id,
        title: u.title,
        spec: u.spec || '',
        priceNum: u.priceNum,
        qty: u.qty || 1,
        selected: false,
        img: u.img || CART_PLACEHOLDER_IMG,
        userAdded: true
      });
    });
    return state;
  }

  function isStoreAllSelected(store) {
    var items = [];
    (store.blocks || []).forEach(function (b) {
      (b.items || []).forEach(function (item) {
        if (isCartItemSelectable(item)) items.push(item);
      });
    });
    return items.length > 0 && items.every(function (i) { return i.selected; });
  }

  function isStorePartial(store) {
    var items = [];
    (store.blocks || []).forEach(function (b) {
      (b.items || []).forEach(function (item) {
        if (isCartItemSelectable(item)) items.push(item);
      });
    });
    var sel = items.filter(function (i) { return i.selected; }).length;
    return sel > 0 && sel < items.length;
  }

  function getAllValidItems(state) {
    var items = [];
    forEachCartItem(state, function (item) {
      if (isCartItemSelectable(item)) items.push(item);
    });
    return items;
  }

  function renderCartCheckInput(checked, dataAttrs, disabled) {
    dataAttrs = dataAttrs || '';
    return (
      '<label class="ua-restock-cart-check' +
      (disabled ? ' ua-restock-cart-check--disabled' : '') +
      '">' +
      '<input type="checkbox" class="ua-restock-cart-check__input"' +
      (checked ? ' checked' : '') +
      (disabled ? ' disabled' : '') +
      dataAttrs +
      '>' +
      '<span class="ua-restock-cart-check__box"></span></label>'
    );
  }

  function renderCartQtyStepper(item) {
    var min = 1;
    var max = item.maxQty || 999;
    return (
      '<div class="ua-restock-cart-qty" data-item-id="' +
      item.id +
      '">' +
      '<button type="button" class="ua-restock-cart-qty__btn ua-restock-cart-qty__minus" data-item-id="' +
      item.id +
      '"' +
      (item.qty <= min ? ' disabled' : '') +
      ' aria-label="减少">-</button>' +
      '<span class="ua-restock-cart-qty__num">' +
      item.qty +
      '</span>' +
      '<button type="button" class="ua-restock-cart-qty__btn ua-restock-cart-qty__plus" data-item-id="' +
      item.id +
      '"' +
      (item.qty >= max ? ' disabled' : '') +
      ' aria-label="增加">+</button></div>'
    );
  }

  function renderCartItemHtml(item, loggedIn) {
    if (item.stockStatus === 'spec_invalid') {
      var specTag = item.spec
        ? '<span class="ua-restock-cart-item__spec ua-restock-cart-item__spec--disabled">' + item.spec + '</span>'
        : '';
      return (
        '<article class="ua-restock-cart-item ua-restock-cart-item--spec-invalid" data-item-id="' +
        item.id +
        '">' +
        '<div class="ua-restock-cart-item__check">' +
        renderCartCheckInput(false, ' data-check-type="item" data-item-id="' + item.id + '"', true) +
        '</div>' +
        '<img class="ua-restock-cart-item__img" src="' +
        (item.img || CART_PLACEHOLDER_IMG) +
        '" alt="">' +
        '<div class="ua-restock-cart-item__body">' +
        '<h3 class="ua-restock-cart-item__title">' +
        item.title +
        '</h3>' +
        specTag +
        '<div class="ua-restock-cart-item__respec-row">' +
        '<span class="ua-restock-cart-item__respec-tip">请重新选择商品规格</span>' +
        '<button type="button" class="ua-restock-cart-item__respec-btn" data-respec-id="' +
        item.id +
        '">重选</button>' +
        '</div></div></article>'
      );
    }

    var priceText = loggedIn ? formatCartPrice(item.priceNum) : '****';
    var specHtml = item.spec
      ? '<button type="button" class="ua-restock-cart-item__spec" data-item-id="' +
        item.id +
        '">' +
        item.spec +
        ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>'
      : '';
    var flashHtml = item.flashTip ? '<p class="ua-restock-cart-item__flash">' + item.flashTip + '</p>' : '';
    var stockHtml = item.stockTip ? '<p class="ua-restock-cart-item__stock">' + item.stockTip + '</p>' : '';
    return (
      '<article class="ua-restock-cart-item" data-item-id="' +
      item.id +
      '">' +
      '<div class="ua-restock-cart-item__check">' +
      renderCartCheckInput(!!item.selected, ' data-check-type="item" data-item-id="' + item.id + '"') +
      '</div>' +
      '<img class="ua-restock-cart-item__img" src="' +
      (item.img || CART_PLACEHOLDER_IMG) +
      '" alt="">' +
      '<div class="ua-restock-cart-item__body">' +
      '<h3 class="ua-restock-cart-item__title">' +
      item.title +
      '</h3>' +
      specHtml +
      '<div class="ua-restock-cart-item__bottom">' +
      '<div class="ua-restock-cart-item__price-wrap">' +
      '<div class="ua-restock-cart-item__price' +
      (loggedIn ? '' : ' ua-restock-product__price--hidden') +
      '" data-price="' +
      formatCartPrice(item.priceNum) +
      '">' +
      priceText +
      '</div>' +
      flashHtml +
      '</div>' +
      '<div>' +
      renderCartQtyStepper(item) +
      stockHtml +
      '</div></div></div></article>'
    );
  }

  function renderCartPromoHtml(promo) {
    if (!promo) return '';
    var actionHtml = promo.action
      ? '<button type="button" class="ua-restock-cart-promo__action" data-promo-action="1">' +
        promo.action +
        CHEVRON_SVG +
        '</button>'
      : '';
    return (
      '<div class="ua-restock-cart-promo">' +
      '<span class="ua-restock-cart-promo__tag">' +
      promo.tag +
      '</span>' +
      '<span class="ua-restock-cart-promo__text">' +
      promo.text +
      '</span>' +
      actionHtml +
      '</div>'
    );
  }

  function renderCartStoreHtml(store, loggedIn) {
    var storeSelected = isStoreAllSelected(store);
    var shipClass = store.shipDone ? ' ua-restock-cart-store__ship--done' : '';
    var shipHtml = store.shipText
      ? '<span class="ua-restock-cart-store__ship' +
        shipClass +
        '">' +
        store.shipText +
        CHEVRON_SVG +
        '</span>'
      : '';
    var blocksHtml = (store.blocks || [])
      .map(function (block) {
        return (
          renderCartPromoHtml(block.promo) +
          (block.items || []).map(function (item) {
            return renderCartItemHtml(item, loggedIn);
          }).join('')
        );
      })
      .join('');
    return (
      '<section class="ua-restock-cart-store ua-restock-cart-store--wholesale" data-store-id="' +
      store.id +
      '">' +
      '<div class="ua-restock-cart-store__head ua-restock-cart-store__head--freight">' +
      renderCartCheckInput(storeSelected, ' data-check-type="store" data-store-id="' + store.id + '"') +
      shipHtml +
      '</div>' +
      blocksHtml +
      '</section>'
    );
  }

  function renderInvalidItemHtml(item) {
    return (
      '<article class="ua-restock-cart-invalid__item">' +
      '<span class="ua-restock-cart-invalid__badge">失效</span>' +
      '<img class="ua-restock-cart-invalid__img" src="' +
      item.img +
      '" alt="">' +
      '<div class="ua-restock-cart-invalid__body">' +
      '<h3 class="ua-restock-cart-invalid__title">' +
      item.title +
      '</h3>' +
      '<p class="ua-restock-cart-invalid__reason">' +
      item.reason +
      '</p></div></article>'
    );
  }

  function renderInvalidSectionHtml(state) {
    if (!state.invalidItems || !state.invalidItems.length) return '';
    var collapsed = !!state.invalidCollapsed;
    var collapsedClass = collapsed ? ' ua-restock-cart-invalid--collapsed' : '';
    var listHtml = state.invalidItems.map(function (item) {
      return renderInvalidItemHtml(item);
    }).join('');
    var toggleLabel = collapsed ? '展开' : '收起';
    var toggleIcon = collapsed
      ? '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
    return (
      '<section class="ua-restock-cart-invalid' +
      collapsedClass +
      '" id="restockCartInvalid">' +
      '<div class="ua-restock-cart-invalid__head">失效宝贝' +
      state.invalidItems.length +
      '件</div>' +
      '<div class="ua-restock-cart-invalid__list">' +
      listHtml +
      '</div>' +
      '<div class="ua-restock-cart-invalid__foot">' +
      '<div class="ua-restock-cart-invalid__foot-main">' +
      '<button type="button" class="ua-restock-cart-invalid__clear" id="restockCartInvalidClearBtn">清空全部失效商品</button>' +
      '</div>' +
      '<button type="button" class="ua-restock-cart-invalid__toggle" id="restockCartInvalidCollapseBtn">' +
      toggleLabel +
      ' ' +
      toggleIcon +
      '</button></div></section>'
    );
  }

  function syncStoreCheckIndeterminate(state) {
    if (!cartListEl) return;
    cartListEl.querySelectorAll('.ua-restock-cart-store').forEach(function (storeEl) {
      var storeId = storeEl.getAttribute('data-store-id');
      var store = (state.stores || []).find(function (s) {
        return s.id === storeId;
      });
      var input = storeEl.querySelector('.ua-restock-cart-check__input[data-check-type="store"]');
      if (!input || !store) return;
      input.indeterminate = isStorePartial(store);
      input.checked = isStoreAllSelected(store);
    });
  }

  function updateCartBar(state, loggedIn) {
    var items = getAllValidItems(state);
    var selected = items.filter(function (i) {
      return i.selected;
    });
    var selectedQty = selected.reduce(function (sum, i) {
      return sum + (i.qty || 0);
    }, 0);
    var total = selected.reduce(function (sum, i) {
      return sum + i.priceNum * i.qty;
    }, 0);
    var allSelected = items.length > 0 && selected.length === items.length;
    if (cartSelectAllEl) {
      cartSelectAllEl.checked = allSelected;
      cartSelectAllEl.indeterminate = selected.length > 0 && !allSelected;
    }
    if (cartTotalEl) {
      cartTotalEl.innerHTML = loggedIn
        ? '合计：<strong>' + formatCartTotal(total) + '</strong>'
        : '合计：<strong>****</strong>';
    }
    var checkoutBtn = document.getElementById('restockCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.textContent = '结算(' + selectedQty + ')';
      checkoutBtn.disabled = selectedQty === 0;
    }
  }

  function renderCart() {
    var state = normalizeWholesaleCartState(mergeUserItemsIntoCartPage(readCartPageState()));
    state = processCartStock(state);
    writeCartPageState(state);
    syncFlatCartFromPageState(state);
    var loggedIn = isLoggedIn();
    var itemCount = getCartItemCount(state);
    updateCartBadge(false);

    if (!cartListEl || !cartEmptyEl || !cartFooterEl) return;

    if (!itemCount) {
      cartListEl.innerHTML = '';
      if (cartInvalidWrapEl) {
        cartInvalidWrapEl.innerHTML = renderInvalidSectionHtml(state);
      }
      cartEmptyEl.hidden = false;
      cartFooterEl.hidden = true;
      return;
    }

    cartEmptyEl.hidden = true;
    cartFooterEl.hidden = false;
    cartListEl.innerHTML = (state.stores || [])
      .filter(function (store) {
        var qty = 0;
        (store.blocks || []).forEach(function (block) {
          (block.items || []).forEach(function (item) {
            qty += item.qty || 0;
          });
        });
        return qty > 0;
      })
      .map(function (store) {
        return renderCartStoreHtml(store, loggedIn);
      })
      .join('');
    if (cartInvalidWrapEl) {
      cartInvalidWrapEl.innerHTML = renderInvalidSectionHtml(state);
    }
    syncStoreCheckIndeterminate(state);
    updateCartBar(state, loggedIn);
    syncAllSpecAddBtnsFromCart();
  }

  function saveAndRenderCart(state) {
    writeCartPageState(state);
    syncFlatCartFromPageState(state);
    renderCart();
  }

  function toggleCartItemSelect(state, itemId, selected) {
    var item = findCartItem(state, itemId);
    if (item && isCartItemSelectable(item)) item.selected = selected;
    return state;
  }

  function toggleCartStoreSelect(state, storeId, selected) {
    var store = (state.stores || []).find(function (s) { return s.id === storeId; });
    if (!store) return state;
    (store.blocks || []).forEach(function (block) {
      (block.items || []).forEach(function (item) {
        if (isCartItemSelectable(item)) item.selected = selected;
      });
    });
    return state;
  }

  function toggleCartSelectAll(state, selected) {
    forEachCartItem(state, function (item) {
      if (isCartItemSelectable(item)) item.selected = selected;
    });
    return state;
  }

  function changeCartItemQty(state, itemId, delta) {
    var item = findCartItem(state, itemId);
    if (!item) return state;
    var max = item.maxQty || 999;
    var next = Math.max(1, Math.min(max, (item.qty || 1) + delta));
    item.qty = next;
    return state;
  }

  function deleteSelectedCartItems(state) {
    state.stores = (state.stores || [])
      .map(function (store) {
        store.blocks = (store.blocks || [])
          .map(function (block) {
            block.items = (block.items || []).filter(function (item) {
              return !item.selected;
            });
            return block;
          })
          .filter(function (block) {
            return (block.items && block.items.length) || block.promo;
          });
        return store;
      })
      .filter(function (store) {
        var hasItems = false;
        (store.blocks || []).forEach(function (b) {
          if (b.items && b.items.length) hasItems = true;
        });
        return hasItems;
      });
    return normalizeWholesaleCartState(state);
  }

  var specSheetCtx = null;

  function getSkuDimension(dimensions) {
    return (
      dimensions.find(function (d) {
        return d.skuKey;
      }) || dimensions[0]
    );
  }

  function findDimensionOption(dim, value) {
    return (dim.options || []).find(function (opt) {
      return opt.value === value || opt.specId === value;
    });
  }

  function buildSpecLabel(selections, dimensions) {
    return dimensions
      .map(function (dim) {
        var opt = findDimensionOption(dim, selections[dim.key]);
        return opt ? opt.label : '';
      })
      .filter(Boolean)
      .join('; ');
  }

  function getSelectedSkuFromSheet(selections, dimensions) {
    var skuDim = getSkuDimension(dimensions);
    if (!skuDim) return null;
    var opt = findDimensionOption(skuDim, selections[skuDim.key]);
    if (!opt) return null;
    return {
      id: opt.specId || opt.value,
      label: buildSpecLabel(selections, dimensions),
      priceNum: opt.priceNum || 0,
      available: opt.available !== false
    };
  }

  function initSpecSheetSelections(item, spu, dimensions) {
    var selections = {};
    var skuDim = getSkuDimension(dimensions);
    dimensions.forEach(function (dim) {
      if (dim === skuDim) {
        var matched = (dim.options || []).find(function (opt) {
          return opt.specId === item.id || opt.value === item.id;
        });
        if (matched) {
          selections[dim.key] = matched.value;
          return;
        }
        var firstAvailable = (dim.options || []).find(function (opt) {
          return opt.available !== false;
        });
        selections[dim.key] = (firstAvailable || dim.options[0] || {}).value;
        return;
      }
      var matchedLabel = (dim.options || []).find(function (opt) {
        return (item.spec || '').indexOf(opt.label) >= 0;
      });
      selections[dim.key] = matchedLabel
        ? matchedLabel.value
        : dim.options && dim.options[0]
          ? dim.options[0].value
          : '';
    });
    return selections;
  }

  function formatSpecSheetPrice(num) {
    var n = Math.round(num * 100) / 100;
    var str =
      n % 1 === 0
        ? String(Math.round(n))
        : Math.round(n * 10) === n * 10
          ? n.toFixed(1)
          : n.toFixed(2);
    str = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return '¥ ' + str;
  }

  function renderSpecSheetBody() {
    if (!specSheetCtx) return;
    var bodyEl = document.getElementById('restockCartSpecSheetBody');
    if (!bodyEl) return;
    bodyEl.innerHTML = specSheetCtx.dimensions
      .map(function (dim) {
        return (
          '<div class="ua-restock-cart-spec-group">' +
          '<div class="ua-restock-cart-spec-group__label">' +
          dim.label +
          '</div>' +
          '<div class="ua-restock-cart-spec-group__chips">' +
          (dim.options || [])
            .map(function (opt) {
              var active = specSheetCtx.selections[dim.key] === opt.value;
              var disabled = opt.available === false;
              return (
                '<button type="button" class="ua-restock-cart-spec-chip' +
                (active ? ' ua-restock-cart-spec-chip--active' : '') +
                (disabled ? ' ua-restock-cart-spec-chip--disabled' : '') +
                '" data-dim-key="' +
                dim.key +
                '" data-dim-value="' +
                opt.value +
                '"' +
                (disabled ? ' disabled' : '') +
                '>' +
                opt.label +
                '</button>'
              );
            })
            .join('') +
          '</div></div>'
        );
      })
      .join('');
    updateSpecSheetSummary();
  }

  function updateSpecSheetSummary() {
    if (!specSheetCtx) return;
    var priceEl = document.getElementById('restockCartSpecSheetPrice');
    var confirmBtn = document.getElementById('restockCartSpecSheetConfirm');
    var sku = getSelectedSkuFromSheet(specSheetCtx.selections, specSheetCtx.dimensions);
    if (priceEl) {
      priceEl.textContent = sku ? formatSpecSheetPrice(sku.priceNum) : '¥ --';
    }
    if (confirmBtn) {
      confirmBtn.disabled = !(sku && sku.available);
    }
  }

  function openSpecReselectSheet(itemId) {
    var state = readCartPageState();
    var item = findCartItem(state, itemId);
    if (!item) return;
    var found = findSpuBySpecId(item.id);
    var spu = found ? found.spu : item.spuId ? getSpuById(item.spuId) : null;
    if (!spu) return;
    var dimensions = getSpuDimensions(spu);
    if (!dimensions.length) return;

    var sheetEl = document.getElementById('restockCartSpecSheet');
    var imgEl = document.getElementById('restockCartSpecSheetImg');
    var titleEl = document.getElementById('restockCartSpecSheetTitle');
    if (!sheetEl) return;

    specSheetCtx = {
      itemId: itemId,
      spuId: found ? found.spuId : item.spuId,
      spu: spu,
      dimensions: dimensions,
      selections: initSpecSheetSelections(item, spu, dimensions)
    };

    if (imgEl) {
      imgEl.src = item.img || spu.img || CART_PLACEHOLDER_IMG;
      imgEl.alt = spu.title || item.title || '';
    }
    if (titleEl) titleEl.textContent = spu.title || item.title || '';
    renderSpecSheetBody();
    sheetEl.hidden = false;
    document.body.classList.add('ua-restock-spec-sheet-open');
  }

  function closeSpecReselectSheet() {
    var el = document.getElementById('restockCartSpecSheet');
    if (el) el.hidden = true;
    specSheetCtx = null;
    document.body.classList.remove('ua-restock-spec-sheet-open');
  }

  function confirmSpecReselectSheet() {
    if (!specSheetCtx) return;
    var sku = getSelectedSkuFromSheet(specSheetCtx.selections, specSheetCtx.dimensions);
    if (!sku || !sku.available) return;
    var state = replaceCartSpec(readCartPageState(), specSheetCtx.itemId, sku);
    saveAndRenderCart(state);
    closeSpecReselectSheet();
  }

  function bindSpecReselectSheetEvents() {
    var sheet = document.getElementById('restockCartSpecSheet');
    if (!sheet || sheet._specBound) return;
    sheet._specBound = true;

    document.getElementById('restockCartSpecSheetMask') &&
      document.getElementById('restockCartSpecSheetMask').addEventListener('click', closeSpecReselectSheet);
    document.getElementById('restockCartSpecSheetClose') &&
      document.getElementById('restockCartSpecSheetClose').addEventListener('click', closeSpecReselectSheet);
    document.getElementById('restockCartSpecSheetConfirm') &&
      document.getElementById('restockCartSpecSheetConfirm').addEventListener('click', confirmSpecReselectSheet);

    document.getElementById('restockCartSpecSheetBody') &&
      document.getElementById('restockCartSpecSheetBody').addEventListener('click', function (e) {
        var chip = e.target.closest('.ua-restock-cart-spec-chip');
        if (!chip || chip.disabled || !specSheetCtx) return;
        var dimKey = chip.getAttribute('data-dim-key');
        var dimValue = chip.getAttribute('data-dim-value');
        if (!dimKey) return;
        specSheetCtx.selections[dimKey] = dimValue;
        renderSpecSheetBody();
      });
  }

  function bindCartPageEvents() {
    bindSpecReselectSheetEvents();
    var panel = document.getElementById('restockPanelCart');
    if (!panel || panel._cartBound) return;
    panel._cartBound = true;

    panel.addEventListener('change', function (e) {
      var input = e.target;
      if (!input.classList.contains('ua-restock-cart-check__input')) return;
      var state = readCartPageState();
      var type = input.getAttribute('data-check-type');
      if (type === 'item') {
        toggleCartItemSelect(state, input.getAttribute('data-item-id'), input.checked);
      } else if (type === 'store') {
        toggleCartStoreSelect(state, input.getAttribute('data-store-id'), input.checked);
      }
      saveAndRenderCart(state);
    });

    panel.addEventListener('click', function (e) {
      var minus = e.target.closest('.ua-restock-cart-qty__minus');
      if (minus && !minus.disabled) {
        var state = changeCartItemQty(readCartPageState(), minus.getAttribute('data-item-id'), -1);
        saveAndRenderCart(state);
        return;
      }
      var plus = e.target.closest('.ua-restock-cart-qty__plus');
      if (plus && !plus.disabled) {
        var state2 = changeCartItemQty(readCartPageState(), plus.getAttribute('data-item-id'), 1);
        saveAndRenderCart(state2);
        return;
      }
      if (e.target.closest('[data-promo-action]')) {
        window.alert('去凑单（演示）');
        return;
      }
      if (e.target.closest('.ua-restock-cart-item__spec')) {
        var specBtn = e.target.closest('.ua-restock-cart-item__spec');
        var itemEl = specBtn.closest('.ua-restock-cart-item');
        if (itemEl) openSpecReselectSheet(itemEl.getAttribute('data-item-id'));
        return;
      }
      var respecBtn = e.target.closest('.ua-restock-cart-item__respec-btn');
      if (respecBtn) {
        openSpecReselectSheet(respecBtn.getAttribute('data-respec-id'));
        return;
      }
      if (e.target.id === 'restockCartInvalidClearBtn') {
        var st = readCartPageState();
        st.invalidItems = [];
        st.invalidDismissed = true;
        saveAndRenderCart(st);
        return;
      }
      if (e.target.closest('#restockCartInvalidCollapseBtn')) {
        var st2 = readCartPageState();
        st2.invalidCollapsed = !st2.invalidCollapsed;
        writeCartPageState(st2);
        renderCart();
        return;
      }
    });

    document.getElementById('restockCartSelectAll') &&
      document.getElementById('restockCartSelectAll').addEventListener('change', function (e) {
        var state = toggleCartSelectAll(readCartPageState(), e.target.checked);
        saveAndRenderCart(state);
      });

    document.getElementById('restockCartDeleteBtn') &&
      document.getElementById('restockCartDeleteBtn').addEventListener('click', function () {
        var state = readCartPageState();
        var selected = getAllValidItems(state).filter(function (i) { return i.selected; });
        if (!selected.length) {
          window.alert('请先选择要删除的商品');
          return;
        }
        if (!window.confirm('确定删除选中的 ' + selected.length + ' 件商品？')) return;
        saveAndRenderCart(deleteSelectedCartItems(state));
      });

    document.getElementById('restockCartLocateBtn') &&
      document.getElementById('restockCartLocateBtn').addEventListener('click', function () {
        window.alert('定位当前位置（演示）');
      });
  }

  function renderMe() {
    var s = readSession();
    var loggedIn = !!(s && s.loggedIn);
    var loginBtnEl = document.getElementById('restockMeLoginBtn');
    var userEl = document.getElementById('restockMeUser');
    var nameEl = document.getElementById('restockMeName');
    var phoneEl = document.getElementById('restockMePhone');
    var couponsEl = document.getElementById('restockMeCoupons');
    var balanceEl = document.getElementById('restockMeBalance');
    var topupEl = document.getElementById('restockMeTopup');

    if (loginBtnEl) loginBtnEl.hidden = loggedIn;
    if (userEl) userEl.hidden = !loggedIn;

    if (loggedIn) {
      if (nameEl) nameEl.textContent = s.nickname || '会员用户';
      if (phoneEl) phoneEl.textContent = s.phoneMasked || s.phone || '';
      if (couponsEl) couponsEl.textContent = String(s.couponCount != null ? s.couponCount : 0) + '张';
      if (balanceEl) {
        var bal = s.balance != null ? s.balance : 0;
        balanceEl.textContent = (typeof bal === 'number' ? bal.toFixed(2) : bal) + '元';
      }
      if (topupEl) {
        var top = s.topupAmount != null ? s.topupAmount : 0;
        topupEl.textContent = (typeof top === 'number' ? top.toFixed(2) : top) + '元';
      }
    } else {
      if (couponsEl) couponsEl.textContent = '0张';
      if (balanceEl) balanceEl.textContent = '0.00元';
      if (topupEl) topupEl.textContent = '0.00元';
    }
  }

  function bindMePageEvents() {
    var panel = document.getElementById('restockPanelMe');
    if (!panel || panel._meBound) return;
    panel._meBound = true;

    document.getElementById('restockMeLoginBtn') &&
      document.getElementById('restockMeLoginBtn').addEventListener('click', function () {
        goLogin('me');
      });

    document.getElementById('restockMeProfile') &&
      document.getElementById('restockMeProfile').addEventListener('click', function (e) {
        if (e.target.closest('#restockMeLoginBtn')) return;
        if (!isLoggedIn()) goLogin('me');
      });

    document.getElementById('restockMeSettingsBtn') &&
      document.getElementById('restockMeSettingsBtn').addEventListener('click', function () {
        if (!requireLoginForMe('设置')) return;
        window.alert('设置（演示）');
      });

    document.getElementById('restockMeMsgBtn') &&
      document.getElementById('restockMeMsgBtn').addEventListener('click', function () {
        if (!requireLoginForMe('消息')) return;
        window.alert('消息（演示）');
      });

    document.getElementById('restockMeWalletBtn') &&
      document.getElementById('restockMeWalletBtn').addEventListener('click', function () {
        handleMeAction('wallet');
      });

    panel.addEventListener('click', function (e) {
      var actionBtn = e.target.closest('[data-me-action]');
      if (!actionBtn) return;
      e.preventDefault();
      handleMeAction(actionBtn.getAttribute('data-me-action'));
    });
  }

  function addToCart(btn) {
    var card = btn.closest('.ua-restock-product');
    if (!card) return;
    var id = card.getAttribute('data-id');
    if (!id) return;
    var imgSrc = card.getAttribute('data-img');
    var qty = upsertCartPageItem({
      id: id,
      title: card.getAttribute('data-title'),
      spec: card.getAttribute('data-spec') || '',
      priceNum: parseFloat(card.getAttribute('data-price-num') || '0'),
      img: imgSrc
    });
    btn.textContent = '×' + qty;
    btn.classList.add('ua-restock-product__add--qty');
    btn.classList.add('ua-restock-product__add--pop');
    window.setTimeout(function () {
      btn.classList.remove('ua-restock-product__add--pop');
    }, 220);
    updateCartBadge(true);
    playFlyToCartAnimation(btn, imgSrc);
    renderCart();
  }

  function addSpecToCart(btn) {
    var id = btn.getAttribute('data-id');
    if (!id) return;
    var imgSrc = btn.getAttribute('data-img');
    var qty = upsertCartPageItem({
      id: id,
      title: btn.getAttribute('data-title'),
      spec: btn.getAttribute('data-spec') || '',
      priceNum: parseFloat(btn.getAttribute('data-price-num') || '0'),
      img: imgSrc
    });
    updateSpecAddBtnQty(id, qty);
    btn.classList.add('ua-restock-cat-product__spec-add--pop');
    window.setTimeout(function () {
      btn.classList.remove('ua-restock-cat-product__spec-add--pop');
    }, 220);
    updateCartBadge(true);
    playFlyToCartAnimation(btn, imgSrc);
    renderCart();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  document.querySelectorAll('.ua-restock-subtab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.ua-restock-subtab').forEach(function (b) {
        b.classList.remove('ua-restock-subtab--active');
      });
      btn.classList.add('ua-restock-subtab--active');
    });
  });

  function setActiveItem(list, activeEl, className) {
    list.forEach(function (el) {
      el.classList.toggle(className, el === activeEl);
    });
  }

  var FLAME_SVG =
    '<svg class="ua-restock-cat-sideitem__flame" viewBox="0 0 24 24" fill="#ff4d30"><path d="M12 2c0 4-4 6-4 10a4 4 0 108 0c0-4-4-6-4-10z"/></svg>';

  var CATEGORY_TREE = {
    veg: {
      secondary: [
        {
          id: 'hot',
          label: '爆品',
          hot: true,
          tags: ['全部', '今日特价', '高回购'],
          sections: [
            {
              title: '爆品推荐',
              items: [
                { id: 'hot-egg', title: '红壳黄心鲜鸡蛋 中码', price: '¥28.90', priceNum: 28.9, img: '../assets/restock/product-egg.svg' },
                { id: 'hot-cola', title: '[可口可乐]摩登罐330ml', price: '¥52.00', priceNum: 52, img: '../assets/restock/product-cola.svg' }
              ]
            }
          ]
        },
        {
          id: 'leaf',
          label: '叶菜类',
          tags: [
            '全部', '油麦菜', '生菜', '芹菜', '油菜/小青菜', '香菜', '菠菜', '娃娃菜',
            '韭菜/韭黄', '白菜', '小白菜', '菜心', '芥蓝', '黄心菜', '毛白菜', '苦菊/苦菜',
            '苋菜', '空心菜', '芥菜', '茼蒿', '蒜苗/蒜黄', '茴香', '西洋菜', '其他'
          ],
          sections: [
            {
              title: '生菜',
              items: [
                { id: 'leaf-l1', title: '散生菜 大小不均 普通', price: '¥2.60', priceNum: 2.6, img: '../assets/restock/product-leaf.svg' },
                { id: 'leaf-l2', title: '本地散叶生菜 普通', price: '¥2.80', priceNum: 2.8, img: '../assets/restock/product-leaf.svg', video: true },
                { id: 'leaf-l3', title: '罗马生菜 优质', price: '¥3.50', priceNum: 3.5, img: '../assets/restock/product-leaf.svg' }
              ]
            },
            {
              title: '油麦菜',
              items: [
                { id: 'leaf-y1', title: '油麦菜【菜鲜】', attrs: '优质 | 油麦菜 | 20-30cm | 瑕疵率<5%', price: '¥3.20', priceNum: 3.2, img: '../assets/restock/product-leaf.svg', specs: [
                  { id: 'leaf-y1-5', label: '5斤', price: '¥16.00', priceNum: 16 },
                  { id: 'leaf-y1-10', label: '10斤', price: '¥30.00', priceNum: 30 },
                  { id: 'leaf-y1-20', label: '20斤', price: '¥58.00', priceNum: 58 }
                ]},
                { id: 'leaf-y2', title: '油麦菜 优质', attrs: '优质 | 油麦菜 | 20-30cm | 瑕疵率<5%', price: '¥3.80', priceNum: 3.8, img: '../assets/restock/product-leaf.svg', specs: [
                  { id: 'leaf-y2-5', label: '5斤', price: '¥18.00', priceNum: 18 },
                  { id: 'leaf-y2-10', label: '10斤', price: '¥35.00', priceNum: 35 }
                ]},
                { id: 'leaf-y3', title: '本地油麦菜', attrs: '普通 | 油麦菜 | 20-30cm | 瑕疵率<5%', price: '¥2.90', priceNum: 2.9, img: '../assets/restock/product-leaf.svg' },
                { id: 'leaf-y4', title: '四季清香 油麦菜小颗', attrs: '优质 | 油麦菜 | 15-25cm | 瑕疵率<5%', price: '¥4.20', priceNum: 4.2, img: '../assets/restock/product-leaf.svg', specs: [
                  { id: 'leaf-y4-5', label: '5斤', price: '¥20.00', priceNum: 20 },
                  { id: 'leaf-y4-10', label: '10斤', price: '¥38.00', priceNum: 38 },
                  { id: 'leaf-y4-20', label: '20斤', price: '¥72.00', priceNum: 72 }
                ]},
                { id: 'leaf-y5', title: '油麦菜 精选', attrs: '优质 | 油麦菜 | 25-35cm | 瑕疵率<3%', price: '¥4.50', priceNum: 4.5, img: '../assets/restock/product-leaf.svg' }
              ]
            },
            {
              title: '芹菜',
              items: [
                { id: 'leaf-c1', title: '小香芹 优质 带叶', attrs: '优质 | 小香芹 | 带根 | 瑕疵率<5%', price: '¥5.80', priceNum: 5.8, img: '../assets/restock/product-leaf.svg', specs: [
                  { id: 'leaf-c1-5', label: '5斤', price: '¥28.00', priceNum: 28 },
                  { id: 'leaf-c1-10', label: '10斤', price: '¥54.00', priceNum: 54 }
                ]},
                { id: 'leaf-c2', title: '西芹 普通 带叶', attrs: '普通 | 西芹 | 带根 | 瑕疵率<5%', price: '¥3.60', priceNum: 3.6, img: '../assets/restock/product-leaf.svg', specs: [
                  { id: 'leaf-c2-5', label: '5斤', price: '¥17.00', priceNum: 17 },
                  { id: 'leaf-c2-10', label: '10斤', price: '¥32.00', priceNum: 32 },
                  { id: 'leaf-c2-20', label: '20斤', price: '¥62.00', priceNum: 62 }
                ]},
                { id: 'leaf-c3', title: '大芹菜（优质）', attrs: '优质 | 大芹菜 | 带根 | 瑕疵率<5%', price: '¥4.20', priceNum: 4.2, img: '../assets/restock/product-leaf.svg' },
                { id: 'leaf-c4', title: '本地芹菜 普通', attrs: '普通 | 芹菜 | 带根 | 瑕疵率<5%', price: '¥2.40', priceNum: 2.4, img: '../assets/restock/product-leaf.svg' }
              ]
            }
          ]
        },
        {
          id: 'root',
          label: '根茎类',
          tags: ['全部', '土豆', '胡萝卜', '红薯', '山药'],
          sections: [
            {
              title: '根茎类',
              items: [
                { id: 'root-1', title: '黄心土豆 大个', price: '¥1.90', priceNum: 1.9, img: '../assets/restock/product-root.svg' },
                { id: 'root-2', title: '胡萝卜 优质', price: '¥2.50', priceNum: 2.5, img: '../assets/restock/product-root.svg' }
              ]
            }
          ]
        },
        {
          id: 'cabbage',
          label: '包菜/花菜',
          tags: ['全部', '包菜', '花菜', '西兰花'],
          sections: [
            {
              title: '包菜/花菜',
              items: [{ id: 'cab-1', title: '圆包菜 优质', price: '¥2.20', priceNum: 2.2, img: '../assets/restock/product-leaf.svg' }]
            }
          ]
        },
        {
          id: 'pepper',
          label: '椒类',
          tags: ['全部', '青椒', '彩椒', '线椒'],
          sections: [
            {
              title: '椒类',
              items: [{ id: 'pep-1', title: '薄皮青椒 优质', price: '¥4.50', priceNum: 4.5, img: '../assets/restock/product-leaf.svg' }]
            }
          ]
        },
        {
          id: 'melon',
          label: '茄果瓜类',
          tags: ['全部', '茄子', '西红柿', '菜花', '西葫芦', '黄瓜', '其他瓜类', '冬瓜', '丝瓜', '玉米'],
          sections: [
            {
              title: '茄子',
              items: [
                {
                  id: 'eggplant-round',
                  title: '圆茄 优质',
                  price: '¥3.50',
                  priceNum: 3.5,
                  img: '../assets/restock/product-eggplant-round.svg',
                  specs: [
                    { id: 'eggplant-round-5', label: '5斤', price: '¥17.50', priceNum: 17.5 },
                    { id: 'eggplant-round-10', label: '10斤', price: '¥34.00', priceNum: 34 },
                    { id: 'eggplant-round-20', label: '20斤', price: '¥66.00', priceNum: 66 }
                  ]
                },
                {
                  id: 'eggplant-long',
                  title: '长茄子 广茄',
                  price: '¥4.20',
                  priceNum: 4.2,
                  img: '../assets/restock/product-eggplant-long.svg',
                  video: true,
                  specs: [
                    { id: 'eggplant-long-5', label: '5斤', price: '¥21.00', priceNum: 21 },
                    { id: 'eggplant-long-10', label: '10斤', price: '¥40.00', priceNum: 40 },
                    { id: 'eggplant-long-20', label: '20斤', price: '¥78.00', priceNum: 78 }
                  ]
                }
              ]
            },
            {
              title: '西红柿',
              items: [
                { id: 'tomato-1', title: '普罗旺斯西红柿', price: '¥5.80', priceNum: 5.8, img: '../assets/restock/product-tomato.svg' },
                { id: 'tomato-2', title: '硬粉西红柿 优质', price: '¥4.60', priceNum: 4.6, img: '../assets/restock/product-tomato.svg' }
              ]
            },
            {
              title: '菜花',
              items: [{ id: 'caul-1', title: '有机菜花 优质', price: '¥4.80', priceNum: 4.8, img: '../assets/restock/product-leaf.svg' }]
            }
          ]
        },
        {
          id: 'onion',
          label: '葱姜蒜',
          tags: ['全部', '大葱', '生姜', '大蒜', '洋葱'],
          sections: [
            {
              title: '葱姜蒜',
              items: [{ id: 'onion-1', title: '山东大葱 优质', price: '¥3.80', priceNum: 3.8, img: '../assets/restock/product-root.svg' }]
            }
          ]
        },
        {
          id: 'fruit',
          label: '新鲜水果',
          tags: ['全部', '苹果', '香蕉', '柑橘', '葡萄'],
          sections: [
            {
              title: '新鲜水果',
              items: [{ id: 'fruit-1', title: '红富士苹果 优质', price: '¥6.50', priceNum: 6.5, img: '../assets/restock/product-tomato.svg' }]
            }
          ]
        },
        {
          id: 'bean',
          label: '豆芽/豆类',
          tags: ['全部', '豆芽', '毛豆', '荷兰豆'],
          sections: [
            {
              title: '豆芽/豆类',
              items: [{ id: 'bean-1', title: '黄豆芽 新鲜', price: '¥2.00', priceNum: 2, img: '../assets/restock/product-leaf.svg' }]
            }
          ]
        },
        {
          id: 'mushroom',
          label: '菌菇/木耳',
          tags: ['全部', '香菇', '平菇', '木耳'],
          sections: [
            {
              title: '菌菇/木耳',
              items: [{ id: 'mus-1', title: '鲜香菇 优质', price: '¥8.80', priceNum: 8.8, img: '../assets/restock/product-root.svg' }]
            }
          ]
        },
        {
          id: 'wild',
          label: '野菜/特菜',
          tags: ['全部', '荠菜', '香椿', '蕨菜'],
          sections: [
            {
              title: '野菜/特菜',
              items: [{ id: 'wild-1', title: '新鲜荠菜 精选', price: '¥7.20', priceNum: 7.2, img: '../assets/restock/product-leaf.svg' }]
            }
          ]
        }
      ]
    },
    meat: {
      secondary: [
        { id: 'hot', label: '爆品', hot: true, tags: ['全部', '高回购'], sections: [{ title: '爆品', items: [{ id: 'meat-h1', title: '五花肉 冷鲜', price: '¥18.90', priceNum: 18.9, img: '../assets/restock/category-icon-meat.svg' }] }] },
        { id: 'pork', label: '猪肉', tags: ['全部', '五花', '里脊', '排骨'], sections: [{ title: '猪肉', items: [{ id: 'meat-p1', title: '冷鲜猪五花', price: '¥19.80', priceNum: 19.8, img: '../assets/restock/category-icon-meat.svg' }] }] },
        { id: 'beef', label: '牛肉', tags: ['全部', '牛腩', '牛腱'], sections: [{ title: '牛肉', items: [{ id: 'meat-b1', title: '冷鲜牛腩块', price: '¥42.00', priceNum: 42, img: '../assets/restock/category-icon-meat.svg' }] }] },
        { id: 'chicken', label: '禽类', tags: ['全部', '鸡腿', '鸡翅'], sections: [{ title: '禽类', items: [{ id: 'meat-c1', title: '琵琶腿 冷鲜', price: '¥12.50', priceNum: 12.5, img: '../assets/restock/category-icon-meat.svg' }] }] },
        { id: 'seafood', label: '水产', tags: ['全部', '鱼', '虾'], sections: [{ title: '水产', items: [{ id: 'meat-s1', title: '巴沙鱼柳 冷冻', price: '¥15.80', priceNum: 15.8, img: '../assets/restock/category-icon-meat.svg' }] }] }
      ]
    },
    frozen: {
      secondary: [
        { id: 'hot', label: '爆品', hot: true, tags: ['全部'], sections: [{ title: '爆品', items: [{ id: 'fr-h1', title: '冷冻鸡腿 1kg', price: '¥22.00', priceNum: 22, img: '../assets/restock/category-icon-frozen.svg' }] }] },
        { id: 'frozen-meat', label: '冻肉', tags: ['全部', '猪肉', '牛肉'], sections: [{ title: '冻肉', items: [{ id: 'fr-m1', title: '冷冻猪五花', price: '¥16.80', priceNum: 16.8, img: '../assets/restock/category-icon-frozen.svg' }] }] },
        { id: 'frozen-sea', label: '冻水产', tags: ['全部', '虾', '鱼'], sections: [{ title: '冻水产', items: [{ id: 'fr-s1', title: '冷冻虾仁 500g', price: '¥28.00', priceNum: 28, img: '../assets/restock/category-icon-frozen.svg' }] }] }
      ]
    },
    grain: {
      secondary: [
        { id: 'hot', label: '爆品', hot: true, tags: ['全部'], sections: [{ title: '爆品', items: [{ id: 'gr-h1', title: '红壳鲜鸡蛋 托装', price: '¥28.90', priceNum: 28.9, img: '../assets/restock/product-egg.svg' }] }] },
        { id: 'rice', label: '米面', tags: ['全部', '大米', '面粉'], sections: [{ title: '米面', items: [{ id: 'gr-r1', title: '东北大米 5kg', price: '¥32.00', priceNum: 32, img: '../assets/restock/category-icon-grain.svg' }] }] },
        { id: 'oil', label: '食用油', tags: ['全部', '调和油', '菜籽油'], sections: [{ title: '食用油', items: [{ id: 'gr-o1', title: '压榨花生油 5L', price: '¥89.00', priceNum: 89, img: '../assets/restock/category-icon-grain.svg' }] }] },
        { id: 'egg', label: '蛋品', tags: ['全部', '鸡蛋', '鸭蛋'], sections: [{ title: '蛋品', items: [{ id: 'gr-e1', title: '红壳黄心鲜鸡蛋', price: '¥28.90', priceNum: 28.9, img: '../assets/restock/product-egg.svg' }] }] }
      ]
    },
    drink: {
      secondary: [
        { id: 'hot', label: '爆品', hot: true, tags: ['全部'], sections: [{ title: '爆品', items: [{ id: 'dr-h1', title: '[可口可乐]摩登罐330ml', price: '¥52.00', priceNum: 52, img: '../assets/restock/product-cola.svg' }] }] },
        { id: 'water', label: '饮用水', tags: ['全部', '矿泉水', '纯净水'], sections: [{ title: '饮用水', items: [{ id: 'dr-w1', title: '[娃哈哈]纯净水596ml', price: '¥36.00', priceNum: 36, img: '../assets/restock/product-water.svg' }] }] },
        { id: 'soda', label: '碳酸饮料', tags: ['全部', '可乐', '雪碧'], sections: [{ title: '碳酸饮料', items: [{ id: 'dr-s1', title: '[可口可乐]摩登罐330ml', price: '¥52.00', priceNum: 52, img: '../assets/restock/product-cola.svg' }] }] },
        { id: 'tea', label: '茶饮料', tags: ['全部', '冰红茶', '绿茶'], sections: [{ title: '茶饮料', items: [{ id: 'dr-t1', title: '[康师傅]冰红茶500ml', price: '¥42.00', priceNum: 42, img: '../assets/restock/product-tea.svg' }] }] }
      ]
    }
  };

  var MORE_TAG = '__more__';
  var COLLAPSED_TAG_SLOTS = 5;
  var SECTION_PREVIEW_MAX = 3;

  var catState = {
    primary: 'veg',
    secondary: 'leaf',
    tag: '全部',
    tagsPinned: false,
    topnavCompact: false,
    tagsExpanded: false,
    expandedProductId: null,
    sectionMoreTitle: null,
    scrollLockUntil: 0
  };
  var sidebarEl = document.getElementById('restockCatSidebar');
  var tagsEl = document.getElementById('restockCatTags');
  var productsEl = document.getElementById('restockCatProducts');
  var scrollEl = document.getElementById('restockCatScroll');
  var headerEl = document.getElementById('restockCatHeader');
  var topnavWrapEl = document.getElementById('restockCatTopnavWrap');
  var tagsStickyWrapEl = document.getElementById('restockCatTagsStickyWrap');
  var tagsExpandEl = document.getElementById('restockCatTagsExpand');
  var tagsExpandGridEl = document.getElementById('restockCatTagsExpandGrid');
  var sectionMoreEl = document.getElementById('restockCatSectionMore');
  var sectionMoreTitleEl = document.getElementById('restockCatSectionMoreTitle');
  var sectionMoreListEl = document.getElementById('restockCatSectionMoreList');
  var catTopAreaEl = document.querySelector('.ua-restock-cat-top-area');
  var tagsFullHeight = 0;
  var tagsCollapsedHeight = 0;
  var topnavFullHeight = 0;
  var topnavCompactHeight = 0;
  var collapsedVisibleTagsSnapshot = null;
  var lastCategoryScrollTop = 0;
  var SCROLL_HYSTERESIS = 12;
  var SCROLL_TRANSITION_LOCK_MS = 180;

  function computeInitialCollapsedTags(tags) {
    var result = [];
    if (tags.indexOf('全部') >= 0) result.push('全部');
    tags.forEach(function (t) {
      if (result.length >= COLLAPSED_TAG_SLOTS) return;
      if (result.indexOf(t) >= 0) return;
      result.push(t);
    });
    return result;
  }

  function snapshotCollapsedTagsFromPinnedRow() {
    if (!tagsEl) return;
    var tags = [];
    tagsEl.querySelectorAll('.ua-restock-cat-tag:not(.ua-restock-cat-tag--more)').forEach(function (btn) {
      var t = btn.getAttribute('data-tag');
      if (t) tags.push(t);
    });
    if (tags.length) collapsedVisibleTagsSnapshot = tags;
  }

  function clearCollapsedTagsSnapshot() {
    collapsedVisibleTagsSnapshot = null;
  }

  function getPrimaryData() {
    return CATEGORY_TREE[catState.primary] || CATEGORY_TREE.veg;
  }

  function getSecondaryData() {
    var list = getPrimaryData().secondary || [];
    return list.find(function (s) { return s.id === catState.secondary; }) || list[0];
  }

  function renderSidebar() {
    if (!sidebarEl) return;
    var list = getPrimaryData().secondary || [];
    sidebarEl.innerHTML = list
      .map(function (item) {
        var active = item.id === catState.secondary;
        var hot = item.hot ? FLAME_SVG : '';
        return (
          '<button type="button" class="ua-restock-cat-sideitem' +
          (active ? ' ua-restock-cat-sideitem--active' : '') +
          '" data-side="' +
          item.id +
          '">' +
          hot +
          item.label +
          '</button>'
        );
      })
      .join('');
    bindSidebarEvents();
  }

  function tagButtonHtml(tag, extraClass) {
    return (
      '<button type="button" class="ua-restock-cat-tag' +
      (tag === catState.tag ? ' ua-restock-cat-tag--active' : '') +
      (extraClass ? ' ' + extraClass : '') +
      '" data-tag="' +
      tag +
      '">' +
      tag +
      '</button>'
    );
  }

  function moreTagButtonHtml() {
    return (
      '<button type="button" class="ua-restock-cat-tag ua-restock-cat-tag--more" data-tag="' +
      MORE_TAG +
      '">更多品类 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>'
    );
  }

  function getCollapsedVisibleTags(tags) {
    if (collapsedVisibleTagsSnapshot && collapsedVisibleTagsSnapshot.length) {
      return collapsedVisibleTagsSnapshot.slice();
    }
    return computeInitialCollapsedTags(tags);
  }

  function shouldShowMoreBtn(tags) {
    return tags.length > COLLAPSED_TAG_SLOTS + 1;
  }

  function closeTagsExpand() {
    catState.tagsExpanded = false;
    if (tagsExpandEl) {
      tagsExpandEl.hidden = true;
      tagsExpandEl.classList.remove('is-open');
    }
  }

  function openTagsExpand() {
    if (catState.tagsPinned) snapshotCollapsedTagsFromPinnedRow();
    catState.tagsExpanded = true;
    if (tagsExpandEl) {
      updateExpandPanelOffset();
      tagsExpandEl.hidden = false;
      tagsExpandEl.classList.add('is-open');
    }
    renderTagsExpandGrid();
  }

  function measureTopnavHeights() {
    if (!topnavWrapEl) return;
    var wasCompact = catState.topnavCompact;
    topnavWrapEl.classList.remove('ua-restock-cat-topnav-wrap--compact');
    topnavFullHeight = topnavWrapEl.offsetHeight;
    topnavWrapEl.classList.add('ua-restock-cat-topnav-wrap--compact');
    topnavCompactHeight = topnavWrapEl.offsetHeight;
    topnavWrapEl.classList.toggle('ua-restock-cat-topnav-wrap--compact', wasCompact);
    if (topnavFullHeight) {
      topnavWrapEl.style.setProperty('--topnav-full-h', String(topnavFullHeight));
      topnavWrapEl.style.setProperty('--topnav-compact-h', String(topnavCompactHeight));
    }
    if (scrollEl) {
      updateTopnavCollapseFromScroll(scrollEl.scrollTop);
    } else {
      setTopnavCollapseProgress(wasCompact ? 1 : 0);
    }
  }

  function setTopnavCollapseProgress(progress) {
    progress = Math.max(0, Math.min(1, progress));
    if (!topnavWrapEl) return;
    topnavWrapEl.style.setProperty('--topnav-collapse-progress', String(progress));
    var topAreaEl = topnavWrapEl.parentElement;
    if (topAreaEl) topAreaEl.style.setProperty('--topnav-collapse-progress', String(progress));
    var isCompact = progress >= 0.999;
    if (isCompact !== catState.topnavCompact) {
      catState.topnavCompact = isCompact;
      topnavWrapEl.classList.toggle('ua-restock-cat-topnav-wrap--compact', isCompact);
    }
  }

  function updateTopnavCollapseFromScroll(st) {
    var tagsThreshold = getTagsPinThreshold();
    var topnavThreshold = getTopnavCompactThreshold();
    var topnavDelta = topnavThreshold - tagsThreshold;

    if (tagsThreshold > 0) {
      if (!catState.tagsPinned || st < tagsThreshold) {
        setTopnavCollapseProgress(0);
        return;
      }
      if (topnavDelta <= 0) {
        setTopnavCollapseProgress(1);
        return;
      }
      setTopnavCollapseProgress((st - tagsThreshold) / topnavDelta);
      return;
    }

    var delta = topnavFullHeight && topnavCompactHeight
      ? Math.max(0, topnavFullHeight - topnavCompactHeight)
      : 0;
    if (delta <= 0) {
      setTopnavCollapseProgress(st > 0 ? 1 : 0);
      return;
    }
    setTopnavCollapseProgress(Math.min(1, st / delta));
  }

  function measureTagsHeights() {
    if (!tagsStickyWrapEl || !tagsEl) return;
    var wasPinned = catState.tagsPinned;
    if (wasPinned) {
      catState.tagsPinned = false;
      tagsStickyWrapEl.classList.remove('ua-restock-cat-tags-sticky-wrap--collapsed', 'ua-restock-cat-tags-sticky-wrap--pinned');
      renderTags();
    }
    tagsFullHeight = tagsStickyWrapEl.offsetHeight;

    catState.tagsPinned = true;
    tagsStickyWrapEl.classList.add('ua-restock-cat-tags-sticky-wrap--collapsed');
    renderTags();
    tagsCollapsedHeight = tagsStickyWrapEl.offsetHeight;

    catState.tagsPinned = wasPinned;
    tagsStickyWrapEl.classList.toggle('ua-restock-cat-tags-sticky-wrap--collapsed', wasPinned);
    tagsStickyWrapEl.classList.toggle('ua-restock-cat-tags-sticky-wrap--pinned', wasPinned);
    renderTags();
    measureTopnavHeights();
    updateTagsWrapHeight();
  }

  function updateTagsWrapHeight() {
    if (!tagsStickyWrapEl) return;
    var collapsed = catState.tagsPinned && !catState.tagsExpanded;
    var h = collapsed && tagsCollapsedHeight ? tagsCollapsedHeight : tagsFullHeight;
    if (h) tagsStickyWrapEl.style.setProperty('--tags-wrap-max-height', h + 'px');
  }

  function applyTagsVisibility() {
    if (!tagsEl) return;
    var sec = getSecondaryData();
    var tags = (sec && sec.tags) || ['全部'];
    var collapsed = catState.tagsPinned && !catState.tagsExpanded;
    var showMore = collapsed && shouldShowMoreBtn(tags);
    var visibleTags = collapsed && shouldShowMoreBtn(tags) ? getCollapsedVisibleTags(tags) : null;

    tagsEl.querySelectorAll('.ua-restock-cat-tag').forEach(function (btn) {
      var tag = btn.getAttribute('data-tag');
      if (tag === MORE_TAG) {
        btn.hidden = !showMore;
        return;
      }
      btn.hidden = visibleTags ? visibleTags.indexOf(tag) < 0 : false;
      btn.classList.toggle('ua-restock-cat-tag--active', tag === catState.tag);
    });
  }

  function lockCategoryScroll() {
    catState.scrollLockUntil = Date.now() + SCROLL_TRANSITION_LOCK_MS;
  }

  function getTagsPinThreshold() {
    if (!tagsFullHeight || !tagsCollapsedHeight) return 0;
    return Math.max(0, tagsFullHeight - tagsCollapsedHeight);
  }

  function getTopnavCompactThreshold() {
    var tagsThreshold = getTagsPinThreshold();
    var topnavDelta = topnavFullHeight && topnavCompactHeight
      ? Math.max(0, topnavFullHeight - topnavCompactHeight)
      : 0;
    return tagsThreshold + topnavDelta;
  }

  function setTopnavCompact(compact) {
    setTopnavCollapseProgress(compact ? 1 : 0);
  }

  function syncTopnavCompactFromScroll() {
    if (!scrollEl) return;
    updateTopnavCollapseFromScroll(scrollEl.scrollTop);
  }

  function applyTagsCollapsedPinnedLayout() {
    var sec = getSecondaryData();
    var tags = (sec && sec.tags) || ['全部'];
    if (!shouldShowMoreBtn(tags)) return false;

    catState.tagsPinned = true;
    if (tagsStickyWrapEl) {
      tagsStickyWrapEl.classList.add('ua-restock-cat-tags-sticky-wrap--collapsed');
      tagsStickyWrapEl.classList.add('ua-restock-cat-tags-sticky-wrap--pinned');
    }
    return true;
  }

  function scrollToPinnedThreshold() {
    if (!scrollEl) return;
    var threshold = getTagsPinThreshold();
    if (threshold <= 0) return;
    var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
    scrollEl.scrollTop = Math.min(threshold, Math.max(0, maxScroll));
    syncTopnavCompactFromScroll();
  }

  function ensureTagsCollapsedPinned() {
    if (!applyTagsCollapsedPinnedLayout()) return;
    scrollToPinnedThreshold();
  }

  function scrollToSelectedTagProducts(tag) {
    tag = tag || catState.tag;
    if (!scrollEl || !productsEl) return;
    window.requestAnimationFrame(function () {
      var threshold = getTagsPinThreshold();
      var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      var pinTop = threshold > 0 ? Math.min(threshold, Math.max(0, maxScroll)) : 0;
      if (tag === '全部') {
        scrollEl.scrollTop = pinTop;
        syncTopnavCompactFromScroll();
        return;
      }
      var secEl = productsEl.querySelector('[data-section-tag="' + tag + '"]');
      if (!secEl) {
        var titles = productsEl.querySelectorAll('[data-section-tag]');
        for (var i = 0; i < titles.length; i++) {
          var t = titles[i].getAttribute('data-section-tag') || '';
          if (t.indexOf(tag) >= 0 || tag.indexOf(t) >= 0) {
            secEl = titles[i];
            break;
          }
        }
      }
      if (!secEl) {
        scrollEl.scrollTop = pinTop;
        syncTopnavCompactFromScroll();
        return;
      }
      var tagsH = tagsStickyWrapEl && catState.tagsPinned ? tagsStickyWrapEl.offsetHeight : 0;
      var secRect = secEl.getBoundingClientRect();
      var scrollRect = scrollEl.getBoundingClientRect();
      var target = scrollEl.scrollTop + (secRect.top - scrollRect.top) - tagsH - 4;
      scrollEl.scrollTop = Math.max(pinTop, Math.min(target, maxScroll));
      syncTopnavCompactFromScroll();
    });
  }

  function setTagsPinned(pinned, options) {
    options = options || {};
    if (pinned === catState.tagsPinned) return;

    catState.tagsPinned = pinned;
    if (pinned) {
      var allTags = (getSecondaryData().tags) || ['全部'];
      if (!collapsedVisibleTagsSnapshot && shouldShowMoreBtn(allTags)) {
        collapsedVisibleTagsSnapshot = computeInitialCollapsedTags(allTags);
      }
    } else {
      clearCollapsedTagsSnapshot();
      closeTagsExpand();
    }
    if (tagsStickyWrapEl) {
      tagsStickyWrapEl.classList.toggle('ua-restock-cat-tags-sticky-wrap--collapsed', pinned);
      tagsStickyWrapEl.classList.toggle('ua-restock-cat-tags-sticky-wrap--pinned', pinned);
    }
    applyTagsVisibility();
    updateTagsWrapHeight();

    if (options.scrollLock) lockCategoryScroll();

    updateExpandPanelOffset();
  }

  function updateExpandPanelOffset() {
    if (!tagsExpandEl || !headerEl) return;
    tagsExpandEl.style.setProperty('--expand-panel-top', headerEl.offsetHeight + 'px');
  }

  function onCategoryScroll() {
    if (!scrollEl) return;
    if (catState.scrollLockUntil && Date.now() < catState.scrollLockUntil) return;

    var st = scrollEl.scrollTop;
    var delta = st - lastCategoryScrollTop;
    if (delta === 0) return;
    var scrollingUp = delta > 0;
    var scrollingDown = delta < 0;
    lastCategoryScrollTop = st;

    var tagsThreshold = getTagsPinThreshold();
    var hysteresis = SCROLL_HYSTERESIS;

    if (tagsThreshold <= 0) {
      if (catState.tagsPinned && !catState.tagsExpanded) {
        updateTopnavCollapseFromScroll(st);
        return;
      }
      if (catState.tagsPinned) setTagsPinned(false, { scrollLock: true });
      updateTopnavCollapseFromScroll(st);
      return;
    }

    if (scrollingUp) {
      if (st >= tagsThreshold && !catState.tagsPinned) {
        setTagsPinned(true, { scrollLock: true });
        scrollEl.scrollTop = tagsThreshold;
        lastCategoryScrollTop = tagsThreshold;
        updateTopnavCollapseFromScroll(tagsThreshold);
        return;
      }
    }

    if (scrollingDown) {
      if (st < tagsThreshold - hysteresis && catState.tagsPinned && !catState.tagsExpanded) {
        var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
        if (maxScroll >= tagsThreshold - hysteresis || maxScroll < tagsThreshold) {
          setTagsPinned(false, { scrollLock: true });
        }
      }
    }

    updateTopnavCollapseFromScroll(st);
  }

  function resetCategoryScroll() {
    catState.tagsPinned = false;
    catState.topnavCompact = false;
    catState.tagsExpanded = false;
    catState.expandedProductId = null;
    closeSectionMore({ silent: true });
    lastCategoryScrollTop = 0;
    clearCollapsedTagsSnapshot();
    closeTagsExpand();
    setTopnavCollapseProgress(0);
    if (tagsStickyWrapEl) {
      tagsStickyWrapEl.classList.remove('ua-restock-cat-tags-sticky-wrap--collapsed', 'ua-restock-cat-tags-sticky-wrap--pinned');
    }
    if (scrollEl) scrollEl.scrollTop = 0;
    renderTags();
    measureTagsHeights();
    updateExpandPanelOffset();
  }

  function renderTagsExpandGrid() {
    if (!tagsExpandGridEl) return;
    var sec = getSecondaryData();
    var tags = (sec && sec.tags) || ['全部'];
    tagsExpandGridEl.innerHTML = tags
      .map(function (tag) {
        return tagButtonHtml(tag, '');
      })
      .join('');
    tagsExpandGridEl.querySelectorAll('.ua-restock-cat-tag').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectTagFromExpand(btn.getAttribute('data-tag'));
      });
    });
  }

  function selectTagFromExpand(tag) {
    if (!tag || tag === MORE_TAG) return;
    catState.tag = tag;
    catState.scrollLockUntil = Date.now() + 500;
    closeTagsExpand();
    applyTagsCollapsedPinnedLayout();
    renderTags();
    renderProducts();
    window.requestAnimationFrame(function () {
      scrollToSelectedTagProducts(tag);
      catState.scrollLockUntil = Date.now() + 500;
    });
  }

  function renderTags() {
    if (!tagsEl) return;
    var sec = getSecondaryData();
    var tags = (sec && sec.tags) || ['全部'];
    if (tags.indexOf(catState.tag) < 0) catState.tag = '全部';

    tagsEl.innerHTML =
      tags.map(function (tag) {
        return tagButtonHtml(tag, '');
      }).join('') + moreTagButtonHtml();

    applyTagsVisibility();
    updateTagsWrapHeight();
    bindTagEvents();
    updateExpandPanelOffset();
  }

  function filterSections(sections, tag) {
    if (!sections) return [];
    if (tag === '全部') return sections;
    return sections.filter(function (sec) {
      return sec.title === tag || sec.title.indexOf(tag) >= 0;
    });
  }

  function getItemSpecs(item) {
    if (item.specs && item.specs.length) return item.specs;
    return [
      {
        id: item.id + '-default',
        label: item.specLabel || '',
        price: item.price,
        priceNum: item.priceNum
      }
    ];
  }

  function isMultiSpecItem(item) {
    return !!(item.specs && item.specs.length > 1);
  }

  function getDisplaySpec(item) {
    var specs = getItemSpecs(item);
    return specs[0];
  }

  function renderSpecAddBtn(item, spec, extraClass) {
    var qty = getCartQty(spec.id);
    var hasQty = qty > 0;
    return (
      '<button type="button" class="ua-restock-cat-product__spec-add' +
      (hasQty ? ' ua-restock-cat-product__spec-add--qty' : '') +
      (extraClass ? ' ' + extraClass : '') +
      '" aria-label="加入购物车" data-id="' +
      spec.id +
      '" data-title="' +
      item.title +
      '" data-spec="' +
      (spec.label || '') +
      '" data-price="' +
      spec.price +
      '" data-price-num="' +
      spec.priceNum +
      '" data-img="' +
      item.img +
      '">' +
      (hasQty ? '×' + qty : '+') +
      '</button>'
    );
  }

  function renderCollapsedPriceHtml(spec, loggedIn, withLabel) {
    var labelHtml = withLabel && spec.label
      ? '<span class="ua-restock-cat-product__spec-preview-label">' + spec.label + '</span>'
      : '';
    return (
      '<div class="ua-restock-cat-product__spec-preview">' +
      labelHtml +
      '<span class="ua-restock-cat-product__spec-preview-price ua-restock-cat-product__price' +
      (loggedIn ? '' : ' ua-restock-product__price--hidden') +
      '" data-price="' +
      spec.price +
      '">' +
      (loggedIn ? spec.price : '****') +
      '</span></div>'
    );
  }

  function renderProductVideoBadge(item) {
    if (!item.video) return '';
    return (
      '<span class="ua-restock-cat-product__video" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.35)"/><path d="M10 8l7 4-7 4V8z" fill="#fff"/></svg></span>'
    );
  }

  function renderProductItemHtml(item, loggedIn, expanded) {
    var specs = getItemSpecs(item);
    var multiSpec = isMultiSpecItem(item);
    var displaySpec = getDisplaySpec(item);
    var video = renderProductVideoBadge(item);
    var imgBlock =
      '<div class="ua-restock-cat-product__img-wrap">' +
      '<img class="ua-restock-cat-product__img" src="' +
      item.img +
      '" alt="' +
      item.title +
      '">' +
      video +
      '</div>';

    if (expanded) {
      var specRows = specs
        .map(function (spec) {
          return (
            '<li class="ua-restock-cat-product__spec-row">' +
            '<span class="ua-restock-cat-product__spec-label">' +
            spec.label +
            '</span>' +
            '<span class="ua-restock-cat-product__spec-price' +
            (loggedIn ? '' : ' ua-restock-product__price--hidden') +
            '" data-price="' +
            spec.price +
            '">' +
            (loggedIn ? spec.price : '****') +
            '</span>' +
            renderSpecAddBtn(item, spec) +
            '</li>'
          );
        })
        .join('');

      return (
        '<article class="ua-restock-cat-product ua-restock-cat-product--expanded" data-id="' +
        item.id +
        '" data-title="' +
        item.title +
        '">' +
        '<div class="ua-restock-cat-product__main">' +
        imgBlock +
        '<div class="ua-restock-cat-product__spec-panel">' +
        '<h4 class="ua-restock-cat-product__spec-name">' +
        item.title +
        '</h4>' +
        '<ul class="ua-restock-cat-product__spec-list">' +
        specRows +
        '</ul>' +
        '<button type="button" class="ua-restock-cat-product__spec-collapse">收起</button>' +
        '</div></div></article>'
      );
    }

    var bottomHtml;
    if (multiSpec) {
      bottomHtml =
        renderCollapsedPriceHtml(displaySpec, loggedIn, true) +
        '<button type="button" class="ua-restock-cat-product__spec-btn">选规格</button>';
    } else {
      bottomHtml =
        renderCollapsedPriceHtml(displaySpec, loggedIn, !!displaySpec.label) +
        renderSpecAddBtn(item, displaySpec);
    }

    return (
      '<article class="ua-restock-cat-product" data-id="' +
      item.id +
      '" data-title="' +
      item.title +
      '">' +
      imgBlock +
      '<div class="ua-restock-cat-product__body">' +
      '<h4 class="ua-restock-cat-product__title">' +
      item.title +
      '</h4>' +
      (item.attrs ? '<p class="ua-restock-cat-product__attrs">' + item.attrs + '</p>' : '') +
      '<div class="ua-restock-cat-product__bottom">' +
      bottomHtml +
      '</div></div></article>'
    );
  }

  function toggleProductSpec(productId) {
    catState.expandedProductId = catState.expandedProductId === productId ? null : productId;
    renderProducts();
    if (catState.sectionMoreTitle) renderSectionMorePanel();
  }

  function findSectionByTitle(title) {
    var sec = getSecondaryData();
    var sections = filterSections(sec ? sec.sections : [], catState.tag);
    return sections.find(function (s) {
      return s.title === title;
    });
  }

  function renderSectionMoreBtn(title) {
    return (
      '<button type="button" class="ua-restock-cat-section-more-btn" data-section-title="' +
      title +
      '">查看更多' +
      title +
      ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
    );
  }

  function renderSectionItemsHtml(section, loggedIn, maxCount) {
    var items = section.items || [];
    var displayItems = maxCount > 0 ? items.slice(0, maxCount) : items;
    return displayItems
      .map(function (item) {
        var expanded = catState.expandedProductId === item.id;
        return renderProductItemHtml(item, loggedIn, expanded);
      })
      .join('');
  }

  function updateSectionMoreOffset() {
    if (!sectionMoreEl || !catTopAreaEl) return;
    sectionMoreEl.style.setProperty('--section-more-top', catTopAreaEl.offsetHeight + 'px');
  }

  function openSectionMore(title) {
    var section = findSectionByTitle(title);
    if (!section || !(section.items || []).length) return;
    closeTagsExpand();
    catState.sectionMoreTitle = title;
    catState.expandedProductId = null;
    if (sectionMoreEl) {
      updateSectionMoreOffset();
      sectionMoreEl.hidden = false;
      sectionMoreEl.classList.add('is-open');
    }
    renderSectionMorePanel();
    document.body.classList.add('ua-restock-section-more-open');
  }

  function closeSectionMore(options) {
    options = options || {};
    catState.sectionMoreTitle = null;
    catState.expandedProductId = null;
    if (sectionMoreEl) {
      sectionMoreEl.hidden = true;
      sectionMoreEl.classList.remove('is-open');
    }
    document.body.classList.remove('ua-restock-section-more-open');
    if (!options.silent) renderProducts();
  }

  function renderSectionMorePanel() {
    if (!sectionMoreListEl || !catState.sectionMoreTitle) return;
    var section = findSectionByTitle(catState.sectionMoreTitle);
    if (!section) {
      closeSectionMore();
      return;
    }
    if (sectionMoreTitleEl) {
      sectionMoreTitleEl.textContent = '全部' + section.title;
    }
    var loggedIn = isLoggedIn();
    sectionMoreListEl.innerHTML = renderSectionItemsHtml(section, loggedIn);
    syncAllSpecAddBtnsFromCart();
    updatePriceVisibility();
  }

  function renderSectionBlockHtml(section, loggedIn) {
    var items = section.items || [];
    var titleHtml =
      '<h3 class="ua-restock-cat-section-title" data-section-tag="' +
      section.title +
      '">' +
      section.title +
      '</h3>';
    var itemsHtml = renderSectionItemsHtml(section, loggedIn, SECTION_PREVIEW_MAX);
    var moreBtn = items.length > SECTION_PREVIEW_MAX ? renderSectionMoreBtn(section.title) : '';
    return titleHtml + itemsHtml + moreBtn;
  }

  function renderProducts() {
    if (!productsEl) return;
    var sec = getSecondaryData();
    var sections = filterSections(sec ? sec.sections : [], catState.tag);
    if (!sections.length) {
      productsEl.innerHTML = '<div class="ua-restock-cat-empty">暂无商品</div>';
      return;
    }
    var loggedIn = isLoggedIn();
    productsEl.innerHTML = sections
      .map(function (section) {
        return renderSectionBlockHtml(section, loggedIn);
      })
      .join('');
    syncAllSpecAddBtnsFromCart();
  }

  function renderCategoryContent() {
    resetCategoryScroll();
    renderSidebar();
    renderTags();
    renderProducts();
  }

  function selectPrimary(catId, secondaryId) {
    if (!CATEGORY_TREE[catId]) return;
    catState.primary = catId;
    var list = CATEGORY_TREE[catId].secondary || [];
    if (secondaryId && list.some(function (s) { return s.id === secondaryId; })) {
      catState.secondary = secondaryId;
    } else {
      catState.secondary = list[0] ? list[0].id : '';
    }
    catState.tag = '全部';
    setActiveItem(
      document.querySelectorAll('.ua-restock-cat-topitem'),
      document.querySelector('.ua-restock-cat-topitem[data-cat="' + catId + '"]'),
      'ua-restock-cat-topitem--active'
    );
    resetCategoryScroll();
    renderSidebar();
    renderTags();
    renderProducts();
  }

  function selectSecondary(sideId) {
    catState.secondary = sideId;
    catState.tag = '全部';
    resetCategoryScroll();
    renderSidebar();
    renderTags();
    renderProducts();
  }

  function selectTag(tag, options) {
    options = options || {};
    if (tag === MORE_TAG) {
      openTagsExpand();
      return;
    }
    if (options.fromExpand) {
      selectTagFromExpand(tag);
      return;
    }
    catState.tag = tag;
    closeTagsExpand();
    catState.expandedProductId = null;
    closeSectionMore({ silent: true });
    renderTags();
    renderProducts();
  }

  function bindSidebarEvents() {
    if (!sidebarEl) return;
    sidebarEl.querySelectorAll('.ua-restock-cat-sideitem').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectSecondary(btn.getAttribute('data-side'));
      });
    });
  }

  function bindTagEvents() {
    if (!tagsEl) return;
    tagsEl.querySelectorAll('.ua-restock-cat-tag').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectTag(btn.getAttribute('data-tag'));
      });
    });
  }

  if (scrollEl) {
    scrollEl.addEventListener('scroll', onCategoryScroll, { passive: true });
  }

  document.getElementById('restockCatTagsCollapseBtn') &&
    document.getElementById('restockCatTagsCollapseBtn').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      catState.scrollLockUntil = Date.now() + 300;
      closeTagsExpand();
      applyTagsCollapsedPinnedLayout();
      applyTagsVisibility();
      updateTagsWrapHeight();
      window.requestAnimationFrame(function () {
        scrollToPinnedThreshold();
      });
    });

  if (tagsExpandEl) {
    tagsExpandEl.addEventListener('click', function (e) {
      if (e.target === tagsExpandEl) {
        closeTagsExpand();
        applyTagsVisibility();
      }
    });
  }

  window.addEventListener('resize', function () {
    measureTagsHeights();
    updateExpandPanelOffset();
    updateSectionMoreOffset();
  });

  var HOME_TO_TOP_CAT = {
    蔬菜水果: 'veg',
    鲜肉禽: 'meat',
    冻肉禽水产: 'frozen',
    米面油蛋: 'grain',
    酒水饮料: 'drink',
    调料调味: 'grain',
    熟食预制: 'meat',
    冷冻半成品: 'frozen',
    餐厨用品: 'grain',
    日用百货: 'drink'
  };

  function activateTopCategory(name) {
    var catId = HOME_TO_TOP_CAT[name] || 'veg';
    selectPrimary(catId, catId === 'veg' ? 'leaf' : undefined);
  }

  document.querySelectorAll('.ua-restock-cat-topitem').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectPrimary(btn.getAttribute('data-cat'));
    });
  });

  function handleProductListClick(e) {
    var moreBtn = e.target.closest('.ua-restock-cat-section-more-btn');
    if (moreBtn) {
      e.preventDefault();
      openSectionMore(moreBtn.getAttribute('data-section-title'));
      return;
    }
    var addBtn = e.target.closest('.ua-restock-cat-product__spec-add');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      addSpecToCart(addBtn);
      return;
    }
    var specBtn = e.target.closest('.ua-restock-cat-product__spec-btn');
    if (specBtn) {
      var card = specBtn.closest('.ua-restock-cat-product');
      if (card) toggleProductSpec(card.getAttribute('data-id'));
      return;
    }
    var collapseBtn = e.target.closest('.ua-restock-cat-product__spec-collapse');
    if (collapseBtn) {
      catState.expandedProductId = null;
      if (catState.sectionMoreTitle) renderSectionMorePanel();
      else renderProducts();
    }
  }

  var categoryPanelEl = document.getElementById('restockPanelCategory');
  if (categoryPanelEl) {
    categoryPanelEl.addEventListener('click', handleProductListClick);
  }

  document.getElementById('restockCatSectionMoreClose') &&
    document.getElementById('restockCatSectionMoreClose').addEventListener('click', function () {
      closeSectionMore();
    });

  document.getElementById('restockCatSectionMoreBackdrop') &&
    document.getElementById('restockCatSectionMoreBackdrop').addEventListener('click', function () {
      closeSectionMore();
    });

  document.querySelectorAll('.ua-restock-cat-sortitem').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('data-sort') === 'filter') {
        window.alert('筛选（演示）');
        return;
      }
      setActiveItem(document.querySelectorAll('.ua-restock-cat-sortitem'), btn, 'ua-restock-cat-sortitem--active');
    });
  });

  document.getElementById('restockCatAllBtn') &&
    document.getElementById('restockCatAllBtn').addEventListener('click', function () {
      window.alert('查看全部分类（演示）');
    });

  document.getElementById('restockCatSearchInput') &&
    document.getElementById('restockCatSearchInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var q = e.target.value.trim();
        if (q) window.alert('搜索：' + q + '（演示）');
      }
    });

  document.querySelectorAll('.ua-restock-cat').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var label = btn.querySelector('.ua-restock-cat__label');
      var name = label ? label.textContent.trim() : '';
      switchTab('category');
      if (name) activateTopCategory(name);
    });
  });

  var catsScroll = document.querySelector('.ua-restock-cats-scroll');
  var indicatorBar = document.querySelector('.ua-restock-cats-indicator__bar');
  if (catsScroll && indicatorBar) {
    catsScroll.addEventListener('scroll', function () {
      var max = catsScroll.scrollWidth - catsScroll.clientWidth;
      if (max <= 0) return;
      var ratio = catsScroll.scrollLeft / max;
      indicatorBar.style.setProperty('--scroll-ratio', String(ratio));
    });
  }

  document.querySelectorAll('.ua-restock-product__add').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      addToCart(btn);
    });
  });

  document.getElementById('restockSearchBtn') &&
    document.getElementById('restockSearchBtn').addEventListener('click', function () {
      var q = (document.getElementById('restockSearchInput') || {}).value.trim();
      if (q) window.alert('搜索：' + q + '（演示）');
    });

  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      goLogin('');
    });
  }

    document.getElementById('restockCheckoutBtn') &&
    document.getElementById('restockCheckoutBtn').addEventListener('click', function () {
      if (!isLoggedIn()) {
        goLogin('cart');
        return;
      }
      var state = readCartPageState();
      var selected = getAllValidItems(state).filter(function (i) {
        return i.selected;
      });
      if (!selected.length) return;
      window.alert('结算成功（演示）');
      saveAndRenderCart(deleteSelectedCartItems(state));
      syncAllSpecAddBtnsFromCart();
    });

  var params = new URLSearchParams(window.location.search);
  var initialTab = params.get('tab') || 'home';
  if (['home', 'category', 'cart', 'me'].indexOf(initialTab) < 0) initialTab = 'home';

  bindCartPageEvents();
  bindMePageEvents();
  updatePriceVisibility();
  renderCart();
  renderMe();
  renderCategoryContent();
  syncAllSpecAddBtnsFromCart();
  switchTab(initialTab);
})();
