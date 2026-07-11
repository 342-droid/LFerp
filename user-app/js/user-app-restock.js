(function () {
  var STORAGE_KEY = 'ua_user_session_v1';
  var CART_KEY = 'ua_restock_cart_v2';
  var CART_PAGE_KEY = 'ua_restock_cart_page_v2';
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
    } else if (prevTabId === 'category') {
      closeCatAllPanel();
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

  var SUPPLIER_BY_SPU = {
    'eggplant-long': { id: 'supplier-jiangnan', name: '江南果蔬批发' },
    'eggplant-round': { id: 'supplier-jiangnan', name: '江南果蔬批发' },
    'leaf-y1': { id: 'supplier-xianfeng', name: '鲜丰蔬菜批发' },
    'leaf-y4': { id: 'supplier-xianfeng', name: '鲜丰蔬菜批发' },
    tomato: { id: 'supplier-jiangnan', name: '江南果蔬批发' },
    egg: { id: 'supplier-huadong', name: '华东冷链供应商' },
    cola: { id: 'supplier-lengfeng', name: '冷丰优选供应链' },
    water: { id: 'supplier-lengfeng', name: '冷丰优选供应链' },
    tea: { id: 'supplier-lengfeng', name: '冷丰优选供应链' }
  };

  var DEFAULT_SUPPLIER = { id: 'supplier-lengfeng', name: '冷丰优选供应链' };

  var PLATFORM_FREIGHT = {
    threshold: 399,
    fee: 6
  };

  function resolveSupplier(payload) {
    if (payload.supplierId && payload.supplierName) {
      return { id: payload.supplierId, name: payload.supplierName };
    }
    if (payload.spuId && SUPPLIER_BY_SPU[payload.spuId]) {
      return SUPPLIER_BY_SPU[payload.spuId];
    }
    var found = findSpuBySpecId(payload.id);
    if (found && SUPPLIER_BY_SPU[found.spuId]) {
      return SUPPLIER_BY_SPU[found.spuId];
    }
    var productKey = payload.id ? String(payload.id).replace(/-\d+$/, '').replace(/-default$/, '') : '';
    if (productKey && SUPPLIER_BY_SPU[productKey]) {
      return SUPPLIER_BY_SPU[productKey];
    }
    return DEFAULT_SUPPLIER;
  }

  function createSupplierStore(supplier, items) {
    return {
      id: supplier.id,
      name: supplier.name,
      tag: '',
      blocks: [{ items: items || [] }]
    };
  }

  function createDefaultCartStores() {
    return [
      createSupplierStore(SUPPLIER_BY_SPU['eggplant-long'], [
        {
          id: 'eggplant-long-5',
          spuId: 'eggplant-long',
          title: '长茄子 广茄',
          spec: '5斤',
          priceNum: 21,
          qty: 1,
          selected: false,
          img: '../assets/restock/product-eggplant-long.svg',
          supplierId: 'supplier-jiangnan',
          supplierName: '江南果蔬批发'
        },
        {
          id: 'eggplant-long-10',
          spuId: 'eggplant-long',
          title: '长茄子 广茄',
          spec: '10斤',
          priceNum: 40,
          qty: 2,
          selected: true,
          img: '../assets/restock/product-eggplant-long.svg',
          supplierId: 'supplier-jiangnan',
          supplierName: '江南果蔬批发'
        },
        {
          id: 'tomato-1',
          spuId: 'tomato',
          title: '普罗旺斯西红柿',
          spec: '5斤',
          priceNum: 29,
          qty: 1,
          selected: true,
          img: '../assets/restock/product-tomato.svg',
          supplierId: 'supplier-jiangnan',
          supplierName: '江南果蔬批发'
        }
      ]),
      createSupplierStore(SUPPLIER_BY_SPU['leaf-y1'], [
        {
          id: 'leaf-y1-10',
          spuId: 'leaf-y1',
          title: '油麦菜【菜鲜】',
          spec: '10斤',
          priceNum: 30,
          qty: 1,
          selected: true,
          img: '../assets/restock/product-leaf.svg',
          supplierId: 'supplier-xianfeng',
          supplierName: '鲜丰蔬菜批发'
        }
      ]),
      createSupplierStore(SUPPLIER_BY_SPU['cola'], [
        {
          id: 'cola',
          spuId: 'cola',
          title: '[可口可乐]摩登罐汽水330ml',
          spec: '24罐',
          priceNum: 52,
          qty: 1,
          selected: true,
          img: '../assets/restock/product-cola.svg',
          supplierId: 'supplier-lengfeng',
          supplierName: '冷丰优选供应链'
        }
      ]),
      createSupplierStore(SUPPLIER_BY_SPU['egg'], [
        {
          id: 'egg',
          spuId: 'egg',
          title: '红壳黄心鲜鸡蛋 中码 托装',
          spec: '3.5斤/30枚',
          priceNum: 28.9,
          qty: 1,
          selected: false,
          img: '../assets/restock/product-egg.svg',
          supplierId: 'supplier-huadong',
          supplierName: '华东冷链供应商'
        }
      ])
    ];
  }

  function ensureDemoLoggedIn() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          loggedIn: true,
          nickname: '演示用户',
          phone: '13800138000',
          phoneMasked: '138****8000',
          couponCount: 2,
          balance: 128.5,
          topupAmount: 0
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function calcPlatformFreight(subtotal) {
    var gap = Math.max(0, PLATFORM_FREIGHT.threshold - subtotal);
    if (gap <= 0) {
      return {
        text: '已满' + PLATFORM_FREIGHT.threshold + '元，已减' + PLATFORM_FREIGHT.fee.toFixed(2) + '元运费',
        done: true,
        fee: 0
      };
    }
    return {
      text: '差' + gap.toFixed(2) + '元减' + PLATFORM_FREIGHT.fee.toFixed(2) + '元运费',
      done: false,
      fee: PLATFORM_FREIGHT.fee
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
          display: 'grid',
          options: [
            {
              value: 'black',
              label: '黑色',
              img: '../assets/restock/product-eggplant-long.svg',
              tags: [
                { label: '冷藏配送', tone: 'blue' },
                { label: '产地直发', tone: 'purple' }
              ]
            },
            {
              value: 'red',
              label: '红色',
              img: '../assets/restock/product-eggplant-long.svg',
              tags: [
                { label: '冷藏配送', tone: 'blue' },
                { label: '产地直发', tone: 'purple' }
              ]
            }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'eggplant-long-5', label: '5斤', specId: 'eggplant-long-5', priceNum: 21, available: false, stock: 0 },
            { value: 'eggplant-long-10', label: '10斤', specId: 'eggplant-long-10', priceNum: 40, available: true, stock: 9994 },
            { value: 'eggplant-long-20', label: '20斤', specId: 'eggplant-long-20', priceNum: 78, available: true, stock: 5620 }
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
          display: 'grid',
          options: [
            {
              value: 'purple',
              label: '紫色',
              img: '../assets/restock/product-eggplant-round.svg',
              tags: [
                { label: '冷链运输', tone: 'blue' },
                { label: '当日采摘', tone: 'purple' }
              ]
            },
            {
              value: 'black',
              label: '黑色',
              img: '../assets/restock/product-eggplant-round.svg',
              tags: [
                { label: '冷链运输', tone: 'blue' },
                { label: '当日采摘', tone: 'purple' }
              ]
            }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'eggplant-round-5', label: '5斤', specId: 'eggplant-round-5', priceNum: 17.5, available: false, stock: 0 },
            { value: 'eggplant-round-10', label: '10斤', specId: 'eggplant-round-10', priceNum: 34, available: false, stock: 0 },
            { value: 'eggplant-round-20', label: '20斤', specId: 'eggplant-round-20', priceNum: 66, available: false, stock: 0 }
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
          display: 'grid',
          options: [
            {
              value: 'green',
              label: '翠绿',
              img: '../assets/restock/product-leaf.svg',
              tags: [
                { label: '菜鲜直供', tone: 'blue' },
                { label: '当日发货', tone: 'purple' }
              ]
            },
            {
              value: 'light',
              label: '浅绿',
              img: '../assets/restock/product-leaf.svg',
              tags: [
                { label: '菜鲜直供', tone: 'blue' },
                { label: '当日发货', tone: 'purple' }
              ]
            }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'leaf-y1-5', label: '5斤', specId: 'leaf-y1-5', priceNum: 16, available: false, stock: 0 },
            { value: 'leaf-y1-10', label: '10斤', specId: 'leaf-y1-10', priceNum: 30, available: true, stock: 8860 },
            { value: 'leaf-y1-20', label: '20斤', specId: 'leaf-y1-20', priceNum: 58, available: true, stock: 4320 }
          ]
        },
        {
          key: 'cut',
          label: '切配方式',
          options: [
            { value: 'whole', label: '整棵' },
            { value: 'half', label: '半切' }
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
          display: 'grid',
          options: [
            {
              value: 'green',
              label: '翠绿',
              img: '../assets/restock/product-leaf.svg',
              tags: [
                { label: '小颗精选', tone: 'blue' },
                { label: '基地直发', tone: 'purple' }
              ]
            },
            {
              value: 'light',
              label: '浅绿',
              img: '../assets/restock/product-leaf.svg',
              tags: [
                { label: '小颗精选', tone: 'blue' },
                { label: '基地直发', tone: 'purple' }
              ]
            }
          ]
        },
        {
          key: 'weight',
          label: '规格',
          skuKey: true,
          options: [
            { value: 'leaf-y4-5', label: '5斤', specId: 'leaf-y4-5', priceNum: 20, available: false, stock: 0 },
            { value: 'leaf-y4-10', label: '10斤', specId: 'leaf-y4-10', priceNum: 38, available: false, stock: 0 },
            { value: 'leaf-y4-20', label: '20斤', specId: 'leaf-y4-20', priceNum: 72, available: false, stock: 0 }
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

  function findOrCreateSupplierStore(state, supplier) {
    var store = (state.stores || []).find(function (s) {
      return s.id === supplier.id;
    });
    if (store) return store;
    store = createSupplierStore(supplier, []);
    state.stores.push(store);
    return store;
  }

  function normalizeCartBySupplier(state) {
    state = ensureCartPageStores(state);
    var grouped = {};
    (state.stores || []).forEach(function (store) {
      (store.blocks || []).forEach(function (block) {
        (block.items || []).forEach(function (item) {
          var supplier = resolveSupplier(item);
          item.supplierId = supplier.id;
          item.supplierName = supplier.name;
          if (!grouped[supplier.id]) {
            grouped[supplier.id] = createSupplierStore(supplier, []);
          }
          grouped[supplier.id].blocks[0].items.push(item);
        });
      });
    });
    state.stores = Object.keys(grouped)
      .map(function (key) {
        return grouped[key];
      })
      .filter(function (store) {
        return (store.blocks[0].items || []).length > 0;
      });
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
      state.stores = createDefaultCartStores();
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
    var state = normalizeCartBySupplier(readCartPageState());
    var found = findCartItem(state, payload.id);
    if (found) {
      found.qty = (found.qty || 0) + 1;
      writeCartPageState(state);
      syncFlatCartFromPageState(state);
      return found.qty;
    }
    var supplier = resolveSupplier(payload);
    var store = findOrCreateSupplierStore(state, supplier);
    var block = store.blocks[0];
    block.items.push({
      id: payload.id,
      title: payload.title,
      spec: payload.spec || '',
      priceNum: payload.priceNum,
      qty: 1,
      selected: false,
      img: payload.img || CART_PLACEHOLDER_IMG,
      userAdded: true,
      spuId: (findSpuBySpecId(payload.id) || {}).spuId || payload.spuId || '',
      supplierId: supplier.id,
      supplierName: supplier.name
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
      stores: createDefaultCartStores(),
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
    userItems.forEach(function (u) {
      if (findCartItem(state, u.id)) return;
      var supplier = resolveSupplier(u);
      var store = findOrCreateSupplierStore(state, supplier);
      store.blocks[0].items.push({
        id: u.id,
        title: u.title,
        spec: u.spec || '',
        priceNum: u.priceNum,
        qty: u.qty || 1,
        selected: false,
        img: u.img || CART_PLACEHOLDER_IMG,
        userAdded: true,
        supplierId: supplier.id,
        supplierName: supplier.name
      });
    });
    return normalizeCartBySupplier(state);
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
    var max = item.maxQty || 999;
    return (
      '<div class="ua-restock-cart-qty" data-item-id="' +
      item.id +
      '">' +
      '<button type="button" class="ua-restock-cart-qty__btn ua-restock-cart-qty__minus" data-item-id="' +
      item.id +
      '" aria-label="减少">-</button>' +
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

  function getProductDetailUrl(specId) {
    var panel = document.querySelector('.ua-restock-panel--active');
    var tab = panel ? panel.getAttribute('data-panel') : 'cart';
    return (
      'product-detail.html?id=' +
      encodeURIComponent(specId) +
      '&from=restock.html&tab=' +
      encodeURIComponent(tab)
    );
  }

  function isCartItemMultiSpec(item) {
    var spu = item.spuId ? getSpuById(item.spuId) : null;
    if (!spu) {
      var found = findSpuBySpecId(item.id);
      spu = found ? found.spu : null;
    }
    return !!(spu && spu.specs && spu.specs.length > 1);
  }

  function getCartItemDisplayTitle(item, multiSpec) {
    var title = item.title || '';
    if (multiSpec || !item.spec) return title;
    if (title.indexOf(item.spec) >= 0) return title;
    return title + ' ' + item.spec;
  }

  function renderCartItemHtml(item, loggedIn) {
    var multiSpec = isCartItemMultiSpec(item);
    var displayTitle = getCartItemDisplayTitle(item, multiSpec);
    if (item.stockStatus === 'spec_invalid') {
      var specTag =
        multiSpec && item.spec
          ? '<span class="ua-restock-cart-item__spec ua-restock-cart-item__spec--disabled">' + item.spec + '</span>'
          : '';
      var detailUrl = getProductDetailUrl(item.spuId || item.id);
      return (
        '<article class="ua-restock-cart-item ua-restock-cart-item--spec-invalid" data-item-id="' +
        item.id +
        '">' +
        '<div class="ua-restock-cart-item__check">' +
        renderCartCheckInput(false, ' data-check-type="item" data-item-id="' + item.id + '"', true) +
        '</div>' +
        '<a class="ua-restock-cart-item__link" href="' +
        detailUrl +
        '">' +
        '<img class="ua-restock-cart-item__img" src="' +
        (item.img || CART_PLACEHOLDER_IMG) +
        '" alt="">' +
        '<div class="ua-restock-cart-item__body">' +
        '<h3 class="ua-restock-cart-item__title">' +
        displayTitle +
        '</h3>' +
        specTag +
        '<div class="ua-restock-cart-item__respec-row">' +
        '<span class="ua-restock-cart-item__respec-tip">请重新选择商品规格</span>' +
        '<button type="button" class="ua-restock-cart-item__respec-btn" data-respec-id="' +
        item.id +
        '">重选</button>' +
        '</div></div></a></article>'
      );
    }

    var priceText = loggedIn ? formatCartPrice(item.priceNum) : '****';
    var specHtml =
      multiSpec && item.spec
        ? '<button type="button" class="ua-restock-cart-item__spec" data-item-id="' +
          item.id +
          '">' +
          item.spec +
          ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>'
        : '';
    var flashHtml = item.flashTip ? '<p class="ua-restock-cart-item__flash">' + item.flashTip + '</p>' : '';
    var stockHtml = item.stockTip ? '<p class="ua-restock-cart-item__stock">' + item.stockTip + '</p>' : '';
    var detailUrl = getProductDetailUrl(item.spuId || item.id);
    return (
      '<article class="ua-restock-cart-item" data-item-id="' +
      item.id +
      '">' +
      '<div class="ua-restock-cart-item__check">' +
      renderCartCheckInput(!!item.selected, ' data-check-type="item" data-item-id="' + item.id + '"') +
      '</div>' +
      '<a class="ua-restock-cart-item__link" href="' +
      detailUrl +
      '">' +
      '<img class="ua-restock-cart-item__img" src="' +
      (item.img || CART_PLACEHOLDER_IMG) +
      '" alt="">' +
      '<div class="ua-restock-cart-item__body">' +
      '<h3 class="ua-restock-cart-item__title">' +
      displayTitle +
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
      '</div></div></div></a></article>'
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

  function renderCartFreightHtml(freightInfo) {
    if (!freightInfo) return '';
    var shipClass = freightInfo.done ? ' ua-restock-cart-freight--done' : '';
    return (
      '<section class="ua-restock-cart-freight' +
      shipClass +
      '">' +
      '<span class="ua-restock-cart-freight__label">平台运费</span>' +
      '<span class="ua-restock-cart-freight__text">' +
      freightInfo.text +
      CHEVRON_SVG +
      '</span></section>'
    );
  }

  function renderCartStoreHtml(store, loggedIn) {
    var storeSelected = isStoreAllSelected(store);
    var tagHtml = store.tag
      ? '<span class="ua-restock-cart-store__tag">' + store.tag + '</span>'
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
      '<section class="ua-restock-cart-store" data-store-id="' +
      store.id +
      '">' +
      '<div class="ua-restock-cart-store__head">' +
      renderCartCheckInput(storeSelected, ' data-check-type="store" data-store-id="' + store.id + '"') +
      '<svg class="ua-restock-cart-store__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>' +
      '<span class="ua-restock-cart-store__name">' +
      (store.name || '供应商') +
      '</span>' +
      tagHtml +
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

  function getCartSubtotal(state, selectedOnly) {
    var items = getAllValidItems(state);
    if (selectedOnly) {
      items = items.filter(function (i) {
        return i.selected;
      });
    }
    return items.reduce(function (sum, i) {
      return sum + i.priceNum * i.qty;
    }, 0);
  }

  function updateCartBar(state, loggedIn) {
    var items = getAllValidItems(state);
    var selected = items.filter(function (i) {
      return i.selected;
    });
    var selectedQty = selected.reduce(function (sum, i) {
      return sum + (i.qty || 0);
    }, 0);
    var selectedSubtotal = getCartSubtotal(state, true);
    var freightInfo = calcPlatformFreight(selectedSubtotal);
    var total = selectedSubtotal + (selectedQty > 0 ? freightInfo.fee : 0);
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
    return freightInfo;
  }

  function renderCart() {
    var state = normalizeCartBySupplier(mergeUserItemsIntoCartPage(readCartPageState()));
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
    var allSubtotal = getCartSubtotal(state, false);
    var freightInfo = calcPlatformFreight(allSubtotal);
    updateCartBar(state, loggedIn);
    var storesHtml = (state.stores || [])
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
    cartListEl.innerHTML = renderCartFreightHtml(freightInfo) + storesHtml;
    if (cartInvalidWrapEl) {
      cartInvalidWrapEl.innerHTML = renderInvalidSectionHtml(state);
    }
    syncStoreCheckIndeterminate(state);
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
    return normalizeCartBySupplier(state);
  }

  var specSheetCtx = null;
  var pendingDeleteItemId = null;

  function openCartDeleteConfirm(itemId) {
    pendingDeleteItemId = itemId;
    var modal = document.getElementById('restockCartDeleteModal');
    if (modal) modal.hidden = false;
  }

  function closeCartDeleteConfirm() {
    pendingDeleteItemId = null;
    var modal = document.getElementById('restockCartDeleteModal');
    if (modal) modal.hidden = true;
  }

  function confirmCartDelete() {
    if (!pendingDeleteItemId) return;
    var itemId = pendingDeleteItemId;
    closeCartDeleteConfirm();
    var state = normalizeCartBySupplier(removeCartItem(readCartPageState(), itemId));
    saveAndRenderCart(state);
    updateCartBadge();
  }

  function bindCartDeleteConfirmEvents() {
    var modal = document.getElementById('restockCartDeleteModal');
    if (!modal || modal._deleteBound) return;
    modal._deleteBound = true;

    document.getElementById('restockCartDeleteModalMask') &&
      document.getElementById('restockCartDeleteModalMask').addEventListener('click', closeCartDeleteConfirm);
    document.getElementById('restockCartDeleteCancelBtn') &&
      document.getElementById('restockCartDeleteCancelBtn').addEventListener('click', closeCartDeleteConfirm);
    document.getElementById('restockCartDeleteConfirmBtn') &&
      document.getElementById('restockCartDeleteConfirmBtn').addEventListener('click', confirmCartDelete);
  }

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
    bindCartDeleteConfirmEvents();
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
        e.preventDefault();
        var itemId = minus.getAttribute('data-item-id');
        var state = readCartPageState();
        var item = findCartItem(state, itemId);
        if (item && (item.qty || 1) <= 1) {
          openCartDeleteConfirm(itemId);
          return;
        }
        saveAndRenderCart(changeCartItemQty(state, itemId, -1));
        return;
      }
      var plus = e.target.closest('.ua-restock-cart-qty__plus');
      if (plus && !plus.disabled) {
        e.preventDefault();
        var state2 = changeCartItemQty(readCartPageState(), plus.getAttribute('data-item-id'), 1);
        saveAndRenderCart(state2);
        return;
      }
      if (e.target.closest('[data-promo-action]')) {
        window.alert('去凑单（演示）');
        return;
      }
      if (e.target.closest('.ua-restock-cart-freight')) {
        window.alert('平台运费按整单计算（演示）');
        return;
      }
      if (e.target.closest('.ua-restock-cart-item__spec')) {
        e.preventDefault();
        var specBtn = e.target.closest('.ua-restock-cart-item__spec');
        var itemEl = specBtn.closest('.ua-restock-cart-item');
        if (itemEl) openSpecReselectSheet(itemEl.getAttribute('data-item-id'));
        return;
      }
      var respecBtn = e.target.closest('.ua-restock-cart-item__respec-btn');
      if (respecBtn) {
        e.preventDefault();
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
      img: imgSrc,
      supplierId: card.getAttribute('data-supplier-id') || '',
      supplierName: card.getAttribute('data-supplier-name') || ''
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
      img: imgSrc,
      supplierId: btn.getAttribute('data-supplier-id') || '',
      supplierName: btn.getAttribute('data-supplier-name') || '',
      spuId: btn.getAttribute('data-spu-id') || ''
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
    expandedProductIds: {},
    sectionMoreTitle: null,
    scrollLockUntil: 0,
    crossSpecByProduct: {},
    primaryCategoryLabel: '蔬菜水果',
    allPanelOpen: false
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
  var catAllPanelEl = document.getElementById('restockCatAllPanel');
  var catAllGridEl = document.getElementById('restockCatAllGrid');
  var catAllBtnEl = document.getElementById('restockCatAllBtn');
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
    catState.expandedProductIds = {};
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

  function findCatItemById(itemId) {
    var keys = Object.keys(CATEGORY_TREE);
    for (var ki = 0; ki < keys.length; ki++) {
      var secondaries = (CATEGORY_TREE[keys[ki]].secondary || []);
      for (var si = 0; si < secondaries.length; si++) {
        var sections = secondaries[si].sections || [];
        for (var sxi = 0; sxi < sections.length; sxi++) {
          var items = sections[sxi].items || [];
          for (var ii = 0; ii < items.length; ii++) {
            if (items[ii].id === itemId) return items[ii];
          }
        }
      }
    }
    return null;
  }

  function getCatItemSpu(item) {
    return item && item.id ? getSpuById(item.id) : null;
  }

  function isCatItemCrossSpec(item) {
    var spu = getCatItemSpu(item);
    return !!(spu && spu.dimensions && spu.dimensions.length >= 2);
  }

  function initCrossSpecSelections(dimensions) {
    var selections = {};
    dimensions.forEach(function (dim) {
      var firstAvailable = (dim.options || []).find(function (o) {
        return o.available !== false;
      });
      var first = firstAvailable || (dim.options || [])[0];
      selections[dim.key] = first ? first.value : '';
    });
    return { selections: selections };
  }

  function getCrossSpecState(item) {
    var spu = getCatItemSpu(item);
    if (!spu) return null;
    var dimensions = getSpuDimensions(spu);
    if (dimensions.length < 2) return null;
    if (!catState.crossSpecByProduct[item.id]) {
      catState.crossSpecByProduct[item.id] = initCrossSpecSelections(dimensions);
    }
    var stored = catState.crossSpecByProduct[item.id];
    return {
      item: item,
      spu: spu,
      dimensions: dimensions,
      selections: stored.selections
    };
  }

  function getCrossSpecPricePreview(item, loggedIn) {
    var spu = getCatItemSpu(item);
    if (!spu || !spu.specs || !spu.specs.length) {
      return {
        text: loggedIn ? item.price : '****',
        hideClass: loggedIn ? '' : ' ua-restock-product__price--hidden'
      };
    }
    var specs = spu.specs.filter(function (s) {
      return s.available !== false;
    });
    if (!specs.length) specs = spu.specs.slice();
    var nums = specs.map(function (s) {
      return s.priceNum;
    });
    var min = Math.min.apply(null, nums);
    var max = Math.max.apply(null, nums);
    var text;
    if (!loggedIn) {
      text = '****';
    } else if (min === max) {
      text = formatSpecSheetPrice(min);
    } else {
      text = formatSpecSheetPrice(min) + ' - ' + formatSpecSheetPrice(max);
    }
    return {
      text: text,
      hideClass: loggedIn ? '' : ' ua-restock-product__price--hidden'
    };
  }

  function renderInlineXspecGridOption(item, dim, opt, active, disabled) {
    var tagsHtml = (opt.tags || [])
      .map(function (tag) {
        return (
          '<span class="ua-restock-cat-xspec-card__tag ua-restock-cat-xspec-card__tag--' +
          (tag.tone || 'blue') +
          '">' +
          tag.label +
          '</span>'
        );
      })
      .join('');
    var imgSrc = opt.img || item.img || CART_PLACEHOLDER_IMG;
    return (
      '<button type="button" class="ua-restock-cat-xspec-card' +
      (active ? ' ua-restock-cat-xspec-card--active' : '') +
      (disabled ? ' ua-restock-cat-xspec-card--disabled' : '') +
      '" data-dim-key="' +
      dim.key +
      '" data-dim-value="' +
      opt.value +
      '"' +
      (disabled ? ' disabled' : '') +
      '>' +
      '<span class="ua-restock-cat-xspec-card__img-wrap"><img src="' +
      imgSrc +
      '" alt=""></span>' +
      (tagsHtml ? '<span class="ua-restock-cat-xspec-card__tags">' + tagsHtml + '</span>' : '') +
      '<span class="ua-restock-cat-xspec-card__label">' +
      opt.label +
      '</span></button>'
    );
  }

  function renderInlineXspecChipOption(dim, opt, active, disabled) {
    return (
      '<button type="button" class="ua-restock-cat-xspec-chip' +
      (active ? ' ua-restock-cat-xspec-chip--active' : '') +
      (disabled ? ' ua-restock-cat-xspec-chip--disabled' : '') +
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
  }

  function renderInlineXspecGroup(item, dim, ctx) {
    var selections = ctx.selections;
    var optionsHtml = '';
    if (dim.display === 'grid') {
      optionsHtml =
        '<div class="ua-restock-cat-xspec-group__grid">' +
        (dim.options || [])
          .map(function (opt) {
            var active = selections[dim.key] === opt.value;
            var disabled = opt.available === false;
            return renderInlineXspecGridOption(item, dim, opt, active, disabled);
          })
          .join('') +
        '</div>';
    } else {
      optionsHtml =
        '<div class="ua-restock-cat-xspec-group__chips">' +
        (dim.options || [])
          .map(function (opt) {
            var active = selections[dim.key] === opt.value;
            var disabled = opt.available === false;
            return renderInlineXspecChipOption(dim, opt, active, disabled);
          })
          .join('') +
        '</div>';
    }
    return (
      '<section class="ua-restock-cat-xspec-group" data-dim-key="' +
      dim.key +
      '">' +
      '<div class="ua-restock-cat-xspec-group__head">' +
      '<span class="ua-restock-cat-xspec-group__label">' +
      dim.label +
      '</span></div>' +
      optionsHtml +
      '</section>'
    );
  }

  function buildCrossSpecCartLabel(selections, dimensions, skuOpt, skuDim) {
    var merged = Object.assign({}, selections);
    if (skuDim) merged[skuDim.key] = skuOpt.value;
    return buildSpecLabel(merged, dimensions);
  }

  function renderCrossSpecAddBtn(item, skuOpt, specLabel, disabled) {
    var specId = skuOpt.specId || skuOpt.value;
    var qty = getCartQty(specId);
    var hasQty = qty > 0;
    var supplier = resolveSupplier({ id: specId, spuId: item.id });
    var priceText = '¥' + (skuOpt.priceNum % 1 === 0 ? skuOpt.priceNum.toFixed(0) : skuOpt.priceNum.toFixed(2));
    return (
      '<button type="button" class="ua-restock-cat-product__spec-add' +
      (hasQty ? ' ua-restock-cat-product__spec-add--qty' : '') +
      (disabled ? ' ua-restock-cat-product__spec-add--disabled' : '') +
      '" aria-label="加入购物车" data-id="' +
      specId +
      '" data-title="' +
      item.title +
      '" data-spec="' +
      (specLabel || '') +
      '" data-price="' +
      priceText +
      '" data-price-num="' +
      skuOpt.priceNum +
      '" data-img="' +
      item.img +
      '" data-supplier-id="' +
      supplier.id +
      '" data-supplier-name="' +
      supplier.name +
      '" data-spu-id="' +
      item.id +
      '"' +
      (disabled ? ' disabled' : '') +
      '>' +
      (hasQty ? '×' + qty : '+') +
      '</button>'
    );
  }

  function renderCrossSpecExpandedPanel(item, loggedIn) {
    var ctx = getCrossSpecState(item);
    if (!ctx) return '';
    var skuDim = getSkuDimension(ctx.dimensions);
    var nonSkuDims = ctx.dimensions.filter(function (dim) {
      return dim !== skuDim;
    });
    var groupsHtml = nonSkuDims
      .map(function (dim) {
        return renderInlineXspecGroup(item, dim, ctx);
      })
      .join('');
    var skuRowsHtml = skuDim
      ? (skuDim.options || [])
          .map(function (opt) {
            var specId = opt.specId || opt.value;
            var disabled = opt.available === false;
            var specLabel = buildCrossSpecCartLabel(ctx.selections, ctx.dimensions, opt, skuDim);
            var priceText = loggedIn ? formatSpecSheetPrice(opt.priceNum) : '****';
            var stockHtml =
              !disabled && opt.stock != null
                ? '<span class="ua-restock-cat-product__spec-stock">库存' + opt.stock + '</span>'
                : '';
            return (
              '<li class="ua-restock-cat-product__spec-row' +
              (disabled ? ' ua-restock-cat-product__spec-row--disabled' : '') +
              '">' +
              '<span class="ua-restock-cat-product__spec-label">' +
              opt.label +
              '</span>' +
              stockHtml +
              '<span class="ua-restock-cat-product__spec-price' +
              (loggedIn ? '' : ' ua-restock-product__price--hidden') +
              '" data-price="' +
              priceText +
              '">' +
              priceText +
              '</span>' +
              renderCrossSpecAddBtn(item, opt, specLabel, disabled) +
              '</li>'
            );
          })
          .join('')
      : '';
    return (
      '<div class="ua-restock-cat-product__cross-spec">' +
      groupsHtml +
      (skuDim
        ? '<section class="ua-restock-cat-xspec-group ua-restock-cat-xspec-group--sku">' +
          '<div class="ua-restock-cat-xspec-group__head">' +
          '<span class="ua-restock-cat-xspec-group__label">' +
          skuDim.label +
          '</span></div>' +
          '<ul class="ua-restock-cat-product__spec-list">' +
          skuRowsHtml +
          '</ul></section>'
        : '') +
      '</div>'
    );
  }

  function selectCrossSpecOption(productId, dimKey, dimValue) {
    var item = findCatItemById(productId);
    if (!item) return;
    var ctx = getCrossSpecState(item);
    if (!ctx) return;
    ctx.selections[dimKey] = dimValue;
    catState.crossSpecByProduct[productId].selections = ctx.selections;
    if (catState.sectionMoreTitle) renderSectionMorePanel();
    else renderProducts();
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
    if (isCatItemCrossSpec(item)) return true;
    return !!(item.specs && item.specs.length > 1);
  }

  function getDisplaySpec(item) {
    var specs = getItemSpecs(item);
    return specs[0];
  }

  function renderSpecAddBtn(item, spec, extraClass) {
    var qty = getCartQty(spec.id);
    var hasQty = qty > 0;
    var supplier = resolveSupplier({ id: spec.id, spuId: item.id });
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
      '" data-supplier-id="' +
      supplier.id +
      '" data-supplier-name="' +
      supplier.name +
      '" data-spu-id="' +
      item.id +
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
      if (isCatItemCrossSpec(item)) {
        return (
          '<article class="ua-restock-cat-product ua-restock-cat-product--expanded ua-restock-cat-product--cross-spec" data-id="' +
          item.id +
          '" data-title="' +
          item.title +
          '">' +
          '<div class="ua-restock-cat-product__main">' +
          imgBlock +
          '<div class="ua-restock-cat-product__spec-panel ua-restock-cat-product__spec-panel--compact">' +
          '<h4 class="ua-restock-cat-product__spec-name">' +
          item.title +
          '</h4>' +
          (item.attrs ? '<p class="ua-restock-cat-product__attrs">' + item.attrs + '</p>' : '') +
          '</div></div>' +
          renderCrossSpecExpandedPanel(item, loggedIn) +
          '<button type="button" class="ua-restock-cat-product__spec-collapse">收起</button>' +
          '</article>'
        );
      }

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
      var previewSpec = isCatItemCrossSpec(item) ? null : displaySpec;
      var priceBlock = isCatItemCrossSpec(item)
        ? (function () {
            var crossPrice = getCrossSpecPricePreview(item, loggedIn);
            return (
              '<div class="ua-restock-cat-product__spec-preview">' +
              '<span class="ua-restock-cat-product__spec-preview-price ua-restock-cat-product__price' +
              crossPrice.hideClass +
              '">' +
              crossPrice.text +
              '</span></div>'
            );
          })()
        : renderCollapsedPriceHtml(previewSpec, loggedIn, true);
      bottomHtml = priceBlock + '<button type="button" class="ua-restock-cat-product__spec-btn">选规格</button>';
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
    if (catState.expandedProductIds[productId]) {
      delete catState.expandedProductIds[productId];
    } else {
      catState.expandedProductIds[productId] = true;
    }
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
        var expanded = !!catState.expandedProductIds[item.id];
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
    closeCatAllPanel();
    catState.sectionMoreTitle = title;
    catState.expandedProductIds = {};
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
    catState.expandedProductIds = {};
    if (sectionMoreEl) {
      sectionMoreEl.hidden = true;
      sectionMoreEl.classList.remove('is-open');
    }
    document.body.classList.remove('ua-restock-section-more-open');
    if (!options.silent) renderProducts();
  }

  var TOP_ALL_CATEGORIES = [
    { id: 'veg', label: '蔬菜水果', img: '../assets/restock/category-icon-veg.svg' },
    { id: 'meat', label: '鲜肉禽水产', img: '../assets/restock/category-icon-meat.svg' },
    { id: 'frozen', label: '冻肉禽水产', img: '../assets/restock/category-icon-frozen.svg' },
    { id: 'grain', label: '米面油蛋', img: '../assets/restock/category-icon-grain.svg' },
    { id: 'drink', label: '酒水饮料', img: '../assets/restock/category-icon-drink.svg' },
    { id: 'grain', label: '调料调味品', img: '../assets/restock/category-icon-seasoning.svg' },
    { id: 'meat', label: '熟食预制菜', img: '../assets/restock/category-icon-prepared.svg' },
    { id: 'frozen', label: '冷冻半成品', img: '../assets/restock/category-icon-semi-frozen.svg' },
    { id: 'grain', label: '餐厨用品', img: '../assets/restock/category-icon-kitchenware.svg' },
    { id: 'veg', label: '快驴独家', img: '../assets/restock/category-icon-exclusive.svg' },
    { id: 'grain', label: '豆腐豆制品', img: '../assets/restock/category-icon-tofu.svg' },
    { id: 'grain', label: '主食面点', img: '../assets/restock/category-icon-staple.svg' },
    { id: 'grain', label: '干货/香料', img: '../assets/restock/category-icon-dry-spice.svg' },
    { id: 'veg', label: '腌菜酱菜', img: '../assets/restock/category-icon-pickle.svg' },
    { id: 'grain', label: '酱油醋', img: '../assets/restock/category-icon-sauce.svg' },
    { id: 'meat', label: '丸子肠串', img: '../assets/restock/category-icon-meatball.svg' },
    { id: 'grain', label: '焙烤食品', img: '../assets/restock/category-icon-bakery.svg' }
  ];

  function renderCatAllItemIcon(item) {
    if (item.img) {
      return (
        '<span class="ua-restock-cat-all-item__icon-wrap"><img src="' +
        item.img +
        '" alt=""></span>'
      );
    }
    return (
      '<span class="ua-restock-cat-all-item__icon-wrap"><span class="ua-restock-cat-all-item__emoji">' +
      (item.emoji || '📦') +
      '</span></span>'
    );
  }

  function renderCatAllPanelGrid() {
    if (!catAllGridEl) return;
    var activeLabel = catState.primaryCategoryLabel || '蔬菜水果';
    catAllGridEl.innerHTML = TOP_ALL_CATEGORIES.map(function (item) {
      var active = item.label === activeLabel;
      return (
        '<button type="button" class="ua-restock-cat-all-item' +
        (active ? ' ua-restock-cat-all-item--active' : '') +
        '" data-cat="' +
        item.id +
        '" data-label="' +
        item.label +
        '">' +
        renderCatAllItemIcon(item) +
        '<span class="ua-restock-cat-all-item__label">' +
        item.label +
        '</span></button>'
      );
    }).join('');
  }

  function syncTopnavActiveState(categoryLabel) {
    var topItems = document.querySelectorAll('.ua-restock-cat-topitem');
    var matched = null;
    topItems.forEach(function (btn) {
      var labelEl = btn.querySelector('.ua-restock-cat-topitem__label');
      if (categoryLabel && labelEl && labelEl.textContent.trim() === categoryLabel) {
        matched = btn;
      }
    });
    setActiveItem(topItems, matched, 'ua-restock-cat-topitem--active');
  }

  function openCatAllPanel() {
    if (!catAllPanelEl) return;
    closeTagsExpand();
    closeSectionMore({ silent: true });
    renderCatAllPanelGrid();
    catState.allPanelOpen = true;
    catAllPanelEl.hidden = false;
    if (catTopAreaEl) catTopAreaEl.classList.add('ua-restock-cat-top-area--all-open');
    if (catAllBtnEl) catAllBtnEl.classList.add('is-open');
    window.requestAnimationFrame(function () {
      catAllPanelEl.classList.add('is-open');
    });
  }

  function closeCatAllPanel() {
    if (!catAllPanelEl || catAllPanelEl.hidden) return;
    catState.allPanelOpen = false;
    catAllPanelEl.classList.remove('is-open');
    if (catTopAreaEl) catTopAreaEl.classList.remove('ua-restock-cat-top-area--all-open');
    if (catAllBtnEl) catAllBtnEl.classList.remove('is-open');
    window.setTimeout(function () {
      if (!catAllPanelEl.classList.contains('is-open')) {
        catAllPanelEl.hidden = true;
      }
    }, 280);
  }

  function toggleCatAllPanel() {
    if (catState.allPanelOpen) closeCatAllPanel();
    else openCatAllPanel();
  }

  function bindCatAllPanelEvents() {
    if (!catAllPanelEl || catAllPanelEl._allBound) return;
    catAllPanelEl._allBound = true;

    document.getElementById('restockCatAllMask') &&
      document.getElementById('restockCatAllMask').addEventListener('click', closeCatAllPanel);
    document.getElementById('restockCatAllCollapseBtn') &&
      document.getElementById('restockCatAllCollapseBtn').addEventListener('click', closeCatAllPanel);

    catAllGridEl &&
      catAllGridEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.ua-restock-cat-all-item');
        if (!btn) return;
        e.preventDefault();
        var catId = btn.getAttribute('data-cat');
        var label = btn.getAttribute('data-label');
        if (!catId) return;
        selectPrimary(catId, catId === 'veg' ? 'leaf' : undefined, label);
        closeCatAllPanel();
      });
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

  function selectPrimary(catId, secondaryId, categoryLabel) {
    if (!CATEGORY_TREE[catId]) return;
    closeCatAllPanel();
    catState.primary = catId;
    if (categoryLabel) {
      catState.primaryCategoryLabel = categoryLabel;
    } else {
      var topLabelEl = document.querySelector(
        '.ua-restock-cat-topitem[data-cat="' + catId + '"] .ua-restock-cat-topitem__label'
      );
      if (topLabelEl) catState.primaryCategoryLabel = topLabelEl.textContent.trim();
    }
    var list = CATEGORY_TREE[catId].secondary || [];
    if (secondaryId && list.some(function (s) { return s.id === secondaryId; })) {
      catState.secondary = secondaryId;
    } else {
      catState.secondary = list[0] ? list[0].id : '';
    }
    catState.tag = '全部';
    syncTopnavActiveState(catState.primaryCategoryLabel);
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
    catState.expandedProductIds = {};
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
    鲜肉禽水产: 'meat',
    冻肉禽水产: 'frozen',
    米面油蛋: 'grain',
    酒水饮料: 'drink',
    调料调味: 'grain',
    调料调味品: 'grain',
    熟食预制: 'meat',
    熟食预制菜: 'meat',
    冷冻半成品: 'frozen',
    餐厨用品: 'grain',
    日用百货: 'drink',
    快驴独家: 'veg',
    豆腐豆制品: 'grain',
    '主食面点': 'grain',
    '干货/香料': 'grain',
    腌菜酱菜: 'veg',
    酱油醋: 'grain',
    丸子肠串: 'meat',
    焙烤食品: 'grain'
  };

  function activateTopCategory(name) {
    var catId = HOME_TO_TOP_CAT[name] || 'veg';
    selectPrimary(catId, catId === 'veg' ? 'leaf' : undefined, name);
  }

  document.querySelectorAll('.ua-restock-cat-topitem').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var labelEl = btn.querySelector('.ua-restock-cat-topitem__label');
      selectPrimary(btn.getAttribute('data-cat'), undefined, labelEl ? labelEl.textContent.trim() : '');
    });
  });

  function handleProductListClick(e) {
    var xspecOpt = e.target.closest('.ua-restock-cat-xspec-card, .ua-restock-cat-xspec-chip');
    if (xspecOpt && !xspecOpt.disabled) {
      e.preventDefault();
      e.stopPropagation();
      var optCard = xspecOpt.closest('.ua-restock-cat-product');
      if (optCard) {
        selectCrossSpecOption(optCard.getAttribute('data-id'), xspecOpt.getAttribute('data-dim-key'), xspecOpt.getAttribute('data-dim-value'));
      }
      return;
    }
    var card = e.target.closest('.ua-restock-cat-product');
    if (
      card &&
      !e.target.closest('.ua-restock-cat-product__spec-add') &&
      !e.target.closest('.ua-restock-cat-product__spec-btn') &&
      !e.target.closest('.ua-restock-cat-product__spec-collapse') &&
      !e.target.closest('.ua-restock-cat-xspec-card') &&
      !e.target.closest('.ua-restock-cat-xspec-chip')
    ) {
      var spuId = card.getAttribute('data-id');
      if (spuId) {
        e.preventDefault();
        window.location.href = getProductDetailUrl(spuId);
        return;
      }
    }
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
      e.preventDefault();
      e.stopPropagation();
      var specCard = specBtn.closest('.ua-restock-cat-product');
      if (specCard) toggleProductSpec(specCard.getAttribute('data-id'));
      return;
    }
    var collapseBtn = e.target.closest('.ua-restock-cat-product__spec-collapse');
    if (collapseBtn) {
      var collapseCard = collapseBtn.closest('.ua-restock-cat-product');
      if (collapseCard) delete catState.expandedProductIds[collapseCard.getAttribute('data-id')];
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
    document.getElementById('restockCatAllBtn').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleCatAllPanel();
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

  document.querySelectorAll('.ua-restock-product').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.ua-restock-product__add')) return;
      var id = card.getAttribute('data-id');
      if (id) window.location.href = getProductDetailUrl(id);
    });
  });

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
      var payload = {
        store: {
          name: '悠悠生鲜超市',
          contact: '张店长',
          phone: '138****6688',
          address: '浙江省杭州市萧山区建设一路88号'
        },
        items: selected.map(function (item) {
          return {
            id: item.id,
            title: item.title,
            spec: item.spec || '',
            priceNum: item.priceNum,
            qty: item.qty || 1,
            img: item.img,
            spuId: item.spuId || '',
            supplierId: item.supplierId || '',
            supplierName: item.supplierName || ''
          };
        })
      };
      try {
        sessionStorage.setItem('ua_checkout_v1', JSON.stringify(payload));
      } catch (e) {
        /* ignore */
      }
      window.location.href = 'checkout.html?from=restock.html';
    });

  var params = new URLSearchParams(window.location.search);
  var initialTab = params.get('tab') || 'cart';
  if (['home', 'category', 'cart', 'me'].indexOf(initialTab) < 0) initialTab = 'cart';

  ensureDemoLoggedIn();
  bindCartPageEvents();
  bindMePageEvents();
  bindCatAllPanelEvents();
  updatePriceVisibility();
  renderCart();
  renderMe();
  renderCategoryContent();
  syncAllSpecAddBtnsFromCart();
  switchTab(initialTab);
})();
