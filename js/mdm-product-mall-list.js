(function () {
  var wp = window.wmsPath || { page: function (f) { return f; } };
  var STORAGE_KEY = 'mdm_mall_product_list_v1';

  var SEED = [
    {
      code: 'SPU00181',
      name: '芒果-自提-马群',
      img: '../user-app/assets/restock/product-leaf.svg',
      tag: '冷丰溯源',
      category: '',
      spec: '1个',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.06,
      linePrice: 1,
      sales: 0,
      status: 'on_shelf',
      deliveryMode: 'pickup',
      fulfillmentMode: 'pickup',
      detailEdited: true,
      fromLibrary: true
    },
    {
      code: 'SPU00180',
      name: '石榴-快递-马群',
      img: '../user-app/assets/restock/product-tomato.svg',
      tag: '冷丰溯源',
      category: '',
      spec: '1个',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.06,
      linePrice: 1,
      sales: 0,
      status: 'on_shelf',
      deliveryMode: 'express',
      fulfillmentMode: 'express',
      detailEdited: true,
      fromLibrary: true
    },
    {
      code: 'SPU00179',
      name: '苏打水-自提',
      img: '../user-app/assets/restock/product-water.svg',
      tag: '牛牛专用',
      category: '牛牛下单专用',
      category_path: '牛牛下单专用',
      category_paths: ['牛牛下单专用'],
      spec: '150g',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.06,
      linePrice: 1,
      sales: 0,
      status: 'on_shelf',
      deliveryMode: 'pickup',
      fulfillmentMode: 'pickup',
      detailEdited: true,
      fromLibrary: true
    },
    {
      code: 'SPU00178',
      name: '香菜-快递',
      img: '../user-app/assets/restock/category-icon-veg.svg',
      tag: '',
      category: '',
      spec: '有机袋装香菜',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.06,
      linePrice: null,
      sales: 0,
      status: 'on_shelf',
      deliveryMode: 'express',
      fulfillmentMode: 'express',
      detailEdited: true,
      fromLibrary: true
    },
    {
      code: 'SPU00114',
      name: '抹茶',
      img: '../user-app/assets/restock/product-tea.svg',
      tag: '冷丰优选',
      category: '',
      spec: '2.5kg',
      specCount: 3,
      priceType: 'money',
      priceMoney: 28.8,
      linePrice: 35,
      sales: 0,
      status: 'draft',
      detailEdited: false,
      fromLibrary: true
    },
    {
      code: 'SPU00103',
      name: 'ss积分加现金',
      img: '../user-app/assets/restock/product-leaf.svg',
      tag: '冷丰溯源',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money_points',
      priceMoney: 1,
      pricePoints: 10,
      linePrice: 1,
      sales: 0,
      status: 'draft'
    },
    {
      code: 'SPU00112',
      name: '辣椒-ss',
      img: '../user-app/assets/restock/product-tomato.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.01,
      linePrice: null,
      sales: 0,
      status: 'draft',
      fromLibrary: true,
      detailEdited: false
    },
    {
      code: 'SPU00102',
      name: 'ss苏打水商品',
      img: '../user-app/assets/restock/product-water.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.12,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00101',
      name: '豌豆',
      img: '../user-app/assets/restock/product-egg.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.01,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00098',
      name: '茶叶',
      img: '../user-app/assets/restock/product-tea.svg',
      tag: '牛牛专用',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 10,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00090',
      name: '东北大米 5kg',
      img: '../user-app/assets/restock/category-icon-grain.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 32,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00088',
      name: '红壳黄心鲜鸡蛋',
      img: '../user-app/assets/restock/product-egg.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 28.9,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00078',
      name: '长茄子 广茄',
      img: '../user-app/assets/restock/product-eggplant-long.svg',
      tag: '',
      category: '',
      spec: '12箱',
      specCount: 1,
      priceType: 'money',
      priceMoney: 11,
      linePrice: 15,
      sales: 0,
      status: 'off_shelf'
    },
    {
      code: 'SPU00085',
      name: '圆茄 优质',
      img: '../user-app/assets/restock/product-eggplant-round.svg',
      tag: '',
      category: '',
      spec: '500g',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.01,
      linePrice: 5,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00082',
      name: '可口可乐摩登罐',
      img: '../user-app/assets/restock/product-cola.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0.02,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00067',
      name: '测试',
      img: '../user-app/assets/restock/product-tomato.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'points',
      pricePoints: 100,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    },
    {
      code: 'SPU00064',
      name: 'ss紫薯',
      img: '../user-app/assets/restock/product-root.svg',
      tag: '',
      category: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: 0,
      linePrice: null,
      sales: 0,
      status: 'on_shelf'
    }
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
  var TAGS = ['冷丰溯源', '牛牛专用', '爆款', '新品', ''];
  var NAMES = ['芒果-自提-马群', '石榴-快递-马群', '苏打水-自提', '香菜-快递', '西红柿-自提', '本地生菜-快递', '鲜鸡蛋-自提', '牛腩-快递'];

  var ALL_PRODUCTS = [];
  var state = {
    filtered: [],
    page: 1,
    pageSize: 20,
    filters: { code: '', name: '', mallCategory: '', tag: '', status: '' }
  };

  function formatMoney(num) {
    var n = Math.round(num * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    var s = n.toFixed(2);
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return '¥' + s;
  }

  function normalizeDeliveryMode(mode) {
    if (mode === 'pickup' || mode === '自提' || mode === '门店自提') return 'pickup';
    if (
      mode === 'express' ||
      mode === '快递到店' ||
      mode === '快递' ||
      mode === '快递配送' ||
      mode === 'store'
    ) {
      return 'express';
    }
    return 'express';
  }

  function deliveryModeLabel(mode) {
    return normalizeDeliveryMode(mode) === 'pickup' ? '自提' : '快递';
  }

  function normalizeProduct(item, idx) {
    if (!item) return item;
    var raw = item.deliveryMode || item.fulfillmentMode;
    if (
      raw !== 'pickup' &&
      raw !== 'express' &&
      raw !== '自提' &&
      raw !== '门店自提' &&
      raw !== '快递' &&
      raw !== '快递配送' &&
      raw !== '快递到店' &&
      raw !== 'store'
    ) {
      item.deliveryMode = idx % 2 === 1 ? 'pickup' : 'express';
    } else {
      item.deliveryMode = normalizeDeliveryMode(raw);
    }
    item.fulfillmentMode = item.deliveryMode;
    if (item.etaCountdown == null) item.etaCountdown = '';
    if (!item.etaCountdownUnit) item.etaCountdownUnit = '小时';
    if (item.saleTimeMode !== 'custom') item.saleTimeMode = 'follow_category';
    if (!item.saleTimeStart) item.saleTimeStart = '08:00';
    if (!item.saleTimeEnd) item.saleTimeEnd = '22:00';
    return item;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function closeWarmConfirmModal() {
    var modal = document.querySelector('[data-product-warm-confirm]');
    if (modal) modal.remove();
  }

  function openWarmConfirmModal(message, onConfirm) {
    closeWarmConfirmModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-product-warm-confirm', '1');

    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">温馨提示</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="erp-modal-confirm__row">' +
      '      <div class="erp-modal-confirm__icon">!</div>' +
      '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-warm-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
      '  </div>' +
      '</div>';

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeWarmConfirmModal();
    });
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeWarmConfirmModal);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      closeWarmConfirmModal();
      if (typeof onConfirm === 'function') onConfirm();
    });

    document.body.appendChild(backdrop);
  }

  function persistProducts() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ALL_PRODUCTS));
    } catch (e) {
      /* ignore */
    }
  }

  function loadProducts() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          ALL_PRODUCTS = parsed.map(normalizeProduct);
          persistProducts();
          return;
        }
      }
    } catch (e) {
      /* ignore */
    }
    buildCatalog();
    persistProducts();
  }

  function getAddedCodesMap() {
    var map = {};
    ALL_PRODUCTS.forEach(function (item) {
      map[item.code] = true;
    });
    return map;
  }

  function isProductReadyForShelf(product) {
    if (!product || !product.name) return false;
    if (product.fromLibrary && !product.detailEdited) return false;
    return getProductCategoryIds(product).length > 0;
  }

  function getProductCategoryIds(product) {
    if (!product) return [];
    if (Array.isArray(product.category_l3_ids) && product.category_l3_ids.length) {
      return product.category_l3_ids.slice();
    }
    if (product.category_l3_id) return [product.category_l3_id];
    return [];
  }

  function getProductCategoryPaths(product) {
    if (!product) return [];
    if (Array.isArray(product.category_paths) && product.category_paths.length) {
      return product.category_paths.slice();
    }
    if (product.category_path) return [product.category_path];
    if (product.category) return String(product.category).split('、').filter(Boolean);
    return [];
  }

  function renderCategoryCell(item) {
    var paths = getProductCategoryPaths(item);
    if (!paths.length) return '<span class="product-proxy-dash">-</span>';
    if (paths.length === 1) return escapeHtml(paths[0]);
    return paths.map(function (p) {
      return '<div class="product-proxy-table__cat-line">' + escapeHtml(p) + '</div>';
    }).join('');
  }

  function catalogItemToMallProduct(item) {
    return {
      code: item.code,
      name: item.name,
      img: item.img,
      tag: '',
      category: '',
      category_path: '',
      category_l3_id: '',
      spec: '1',
      specCount: 1,
      priceType: 'money',
      priceMoney: item.price != null ? item.price : 0.01,
      linePrice: null,
      sales: 0,
      status: 'draft',
      fulfillmentMode: 'express',
      deliveryMode: 'express',
      etaCountdown: '',
      etaCountdownUnit: '小时',
      fromLibrary: true,
      detailEdited: false
    };
  }

  function addProductsFromLibrary(items) {
    if (!items || !items.length) return 0;
    var addedCodes = getAddedCodesMap();
    var count = 0;
    items.forEach(function (item) {
      if (addedCodes[item.code]) return;
      var product = catalogItemToMallProduct(item);
      ALL_PRODUCTS.unshift(product);
      addedCodes[item.code] = true;
      count += 1;
    });
    if (count) {
      persistProducts();
      applyFilters();
      renderTable();
      populateCategoryFilter();
    }
    return count;
  }

  function openLibraryDrawer() {
    if (!window.MdmProxyLibraryDrawer) {
      if (typeof showToast === 'function') showToast('商品库组件未加载', 'warning');
      return;
    }
    if (!window.MdmMallProductLibrary) {
      if (typeof showToast === 'function') showToast('商品库数据未加载', 'warning');
      return;
    }
    window.MdmProxyLibraryDrawer.open({
      addedCodes: getAddedCodesMap(),
      onConfirm: function (picked) {
        var count = addProductsFromLibrary(picked);
        if (typeof showToast === 'function') {
          showToast(count ? ('已添加 ' + count + ' 件商品，请编辑完善后再上架') : '未添加新商品', count ? 'success' : 'info');
        }
      }
    });
  }

  function getStore() {
    return window.MdmProxyCategoryStore || null;
  }

  function applyProductCategories(product, l3Ids, paths) {
    var store = getStore();
    if (!store) return;
    var oldIds = getProductCategoryIds(product);
    var newIds = (l3Ids || []).slice();
    store.syncProductBindings(oldIds, newIds, {
      code: product.code,
      name: product.name,
      img: product.img
    });
    product.category_l3_ids = newIds.slice();
    product.category_paths = (paths || []).slice();
    product.category_l3_id = newIds[0] || '';
    product.category_path = (paths && paths[0]) || '';
    product.category = (paths && paths.length) ? paths.join('、') : '';
  }

  function applyProductCategory(product, l3Id, path) {
    applyProductCategories(product, l3Id ? [l3Id] : [], path ? [path] : []);
  }

  function unbindProductCategory(product) {
    var store = getStore();
    if (!store) return;
    getProductCategoryIds(product).forEach(function (id) {
      store.unbindProduct(id, product.code);
    });
    product.category_l3_ids = [];
    product.category_paths = [];
    product.category_l3_id = '';
    product.category_path = '';
    product.category = '';
  }

  function populateCategoryFilter() {
    var select = document.getElementById('qMallCategory');
    var store = getStore();
    if (!select || !store) return;
    var current = select.value;
    var list = store.getSelectableL3List();
    select.innerHTML = '<option value="">请选择商城类目</option>' +
      list.map(function (c) {
        return '<option value="' + c.path + '">' + c.path + '</option>';
      }).join('');
    if (current) select.value = current;
  }

  function openProductForm(product) {
    if (!window.MdmProxyProductForm) {
      if (typeof showToast === 'function') showToast('表单组件未加载', 'warning');
      return;
    }
    window.MdmProxyProductForm.open({
      channel: 'mall',
      mode: product ? 'edit' : 'add',
      product: product || {},
      onSave: function (payload, original) {
        if (original && original.code) {
          applyProductCategories(original, payload.category_l3_ids, payload.category_paths);
          original.name = payload.name;
          original.tag = payload.tag || '';
          original.img = payload.img || original.img;
          original.specCount = payload.specCount || 1;
          original.spec = payload.spec || original.spec;
          original.priceType = payload.priceType || 'money';
          original.priceMoney = payload.priceMoney;
          original.pricePoints = payload.pricePoints || 0;
          original.linePrice = payload.linePrice;
          original.etaCountdown = payload.etaCountdown || '';
          original.etaCountdownUnit = payload.etaCountdownUnit || '小时';
          original.saleTimeMode =
            payload.saleTimeMode === 'custom' ? 'custom' : 'follow_category';
          original.saleTimeStart = payload.saleTimeStart || '08:00';
          original.saleTimeEnd = payload.saleTimeEnd || '22:00';
          original.deliveryMode = normalizeDeliveryMode(payload.deliveryMode || payload.fulfillmentMode);
          original.fulfillmentMode = original.deliveryMode;
          original.detail = payload.detail;
          original.detailEdited = true;
          persistProducts();
          renderTable();
          populateCategoryFilter();
          if (typeof showToast === 'function') showToast('商品已更新', 'success');
          return;
        }
        var newItem = {
          code: 'SPU' + String(Date.now()).slice(-5),
          name: payload.name,
          img: payload.img || '../user-app/assets/restock/product-leaf.svg',
          tag: payload.tag || '',
          category: payload.category,
          category_path: payload.category_path,
          category_paths: payload.category_paths.slice(),
          category_l3_id: payload.category_l3_id,
          category_l3_ids: payload.category_l3_ids.slice(),
          spec: payload.spec || '1',
          specCount: payload.specCount || 1,
          priceType: payload.priceType || 'money',
          priceMoney: payload.priceMoney || 0.01,
          pricePoints: payload.pricePoints || 0,
          linePrice: payload.linePrice,
          sales: 0,
          status: 'draft',
          etaCountdown: payload.etaCountdown || '',
          etaCountdownUnit: payload.etaCountdownUnit || '小时',
          saleTimeMode: payload.saleTimeMode === 'custom' ? 'custom' : 'follow_category',
          saleTimeStart: payload.saleTimeStart || '08:00',
          saleTimeEnd: payload.saleTimeEnd || '22:00',
          deliveryMode: normalizeDeliveryMode(payload.deliveryMode || payload.fulfillmentMode),
          fulfillmentMode: normalizeDeliveryMode(payload.deliveryMode || payload.fulfillmentMode),
          detail: payload.detail,
          detailEdited: true
        };
        ALL_PRODUCTS.unshift(newItem);
        applyProductCategories(newItem, payload.category_l3_ids, payload.category_paths);
        newItem.detailEdited = true;
        persistProducts();
        applyFilters();
        renderTable();
        populateCategoryFilter();
        if (typeof showToast === 'function') showToast('商品已添加', 'success');
      }
    });
  }

  function buildCatalog() {
    var list = SEED.map(function (item, idx) {
      var copy = Object.assign({}, item);
      return normalizeProduct(copy, idx);
    });
    var i = 0;
    while (list.length < 122) {
      var seed = SEED[i % SEED.length];
      var num = 100 - Math.floor(list.length / SEED.length);
      list.push(normalizeProduct({
        code: 'SPU00' + String(num).padStart(3, '0'),
        name: NAMES[i % NAMES.length] + (list.length > 20 ? ' ' + (list.length - 9) : ''),
        img: IMGS[i % IMGS.length],
        tag: TAGS[i % TAGS.length],
        category: i % 3 === 0 ? CATEGORIES[i % CATEGORIES.length] : '',
        spec: i % 4 === 0 ? '500g' : i % 5 === 0 ? '12箱' : '1',
        specCount: 1,
        priceType: i % 7 === 0 ? 'points' : i % 11 === 0 ? 'money_points' : 'money',
        priceMoney: seed.priceMoney || 10,
        pricePoints: i % 11 === 0 ? 10 : 100,
        linePrice: i % 6 === 0 ? 15 : i % 8 === 0 ? 5 : null,
        sales: 0,
        status: i % 13 === 0 ? 'draft' : i % 17 === 0 ? 'off_shelf' : 'on_shelf',
        fulfillmentMode: i % 2 === 0 ? 'express' : 'pickup',
        deliveryMode: i % 2 === 0 ? 'express' : 'pickup',
        etaCountdown: String((i % 5) + 1),
        etaCountdownUnit: i % 2 === 0 ? '天' : '小时'
      }, list.length));
      i += 1;
    }
    ALL_PRODUCTS = list;
  }

  function matchFilters(item) {
    var f = state.filters;
    if (f.code && item.code.toLowerCase().indexOf(f.code.toLowerCase()) < 0) return false;
    if (f.name && item.name.indexOf(f.name) < 0) return false;
    if (f.mallCategory) {
      var paths = getProductCategoryPaths(item);
      if (paths.indexOf(f.mallCategory) < 0) return false;
    }
    if (f.tag && item.tag !== f.tag) return false;
    if (f.status && item.status !== f.status) return false;
    return true;
  }

  function applyFilters() {
    state.filtered = ALL_PRODUCTS.filter(matchFilters);
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function renderSalePrice(item) {
    if (item.status === 'draft') {
      return '<span class="product-proxy-dash">-</span>';
    }
    if (item.priceType === 'points') {
      return '<span class="product-proxy-price">' + item.pricePoints + '积分</span>';
    }
    if (item.priceType === 'money_points') {
      return (
        '<span class="product-proxy-price">' +
        formatMoney(item.priceMoney) + ' + ' + item.pricePoints + '积分</span>'
      );
    }
    return '<span class="product-proxy-price">' + formatMoney(item.priceMoney) + '</span>';
  }

  function renderLinePrice(item) {
    if (item.status === 'draft') {
      return '<span class="product-proxy-dash">-</span>';
    }
    if (item.linePrice == null || item.linePrice === '') {
      return '<span class="product-proxy-dash">-</span>';
    }
    return '<span class="product-proxy-price product-proxy-price--line">' + formatMoney(item.linePrice) + '</span>';
  }

  function getSaleTimeValue(item) {
    if (window.MdmProductSaleTime && typeof window.MdmProductSaleTime.resolve === 'function') {
      return window.MdmProductSaleTime.resolve(item);
    }
    return {
      start: item.saleTimeStart || '08:00',
      end: item.saleTimeEnd || '22:00'
    };
  }

  function renderSaleTimeCell(item) {
    var t = getSaleTimeValue(item);
    var label =
      window.MdmProductSaleTime && typeof window.MdmProductSaleTime.format === 'function'
        ? window.MdmProductSaleTime.format(item)
        : t.start + '–' + t.end;
    return (
      '<td class="product-proxy-table__td product-proxy-table__td--sale-time">' +
      '<button type="button" class="product-sale-time-cell" data-sale-time-edit data-code="' +
      escapeHtml(item.code) +
      '" data-start="' +
      escapeHtml(t.start) +
      '" data-end="' +
      escapeHtml(t.end) +
      '" title="点击编辑可售时间">' +
      '<span class="product-sale-time-cell__text">' +
      escapeHtml(label) +
      '</span></button></td>'
    );
  }

  function beginSaleTimeEdit(btn) {
    if (!btn || btn.classList.contains('is-editing')) return;
    var code = btn.getAttribute('data-code');
    var start = btn.getAttribute('data-start') || '08:00';
    var end = btn.getAttribute('data-end') || '22:00';
    btn.classList.add('is-editing');
    btn.innerHTML =
      '<span class="product-sale-time-editor">' +
      '<input type="time" class="product-sale-time-editor__input" data-sale-start value="' +
      escapeHtml(start) +
      '">' +
      '<span class="product-sale-time-editor__sep">至</span>' +
      '<input type="time" class="product-sale-time-editor__input" data-sale-end value="' +
      escapeHtml(end) +
      '">' +
      '</span>';
    var startEl = btn.querySelector('[data-sale-start]');
    if (startEl) startEl.focus();

    function cleanup() {
      document.removeEventListener('mousedown', onDocDown, true);
    }

    function commit() {
      if (!btn.classList.contains('is-editing')) return;
      cleanup();
      var s = ((btn.querySelector('[data-sale-start]') || {}).value || '').trim();
      var e = ((btn.querySelector('[data-sale-end]') || {}).value || '').trim();
      if (!s || !e) {
        renderTable();
        return;
      }
      if (s === e) {
        if (typeof showToast === 'function') showToast('可售开始与结束时间不能相同', 'warning');
        return;
      }
      var product = getProduct(code);
      if (!product) {
        renderTable();
        return;
      }
      product.saleTimeMode = 'custom';
      product.saleTimeStart = s;
      product.saleTimeEnd = e;
      if (!product.detail) product.detail = {};
      product.detail.saleTimeMode = 'custom';
      product.detail.saleTimeStart = s;
      product.detail.saleTimeEnd = e;
      persistProducts();
      renderTable();
      if (typeof showToast === 'function') showToast('可售时间已更新', 'success');
    }

    function onDocDown(ev) {
      if (btn.contains(ev.target)) return;
      commit();
    }

    setTimeout(function () {
      document.addEventListener('mousedown', onDocDown, true);
    }, 0);

    btn.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          commit();
        }
        if (ev.key === 'Escape') {
          ev.preventDefault();
          cleanup();
          renderTable();
        }
      });
    });
  }

  function renderStatus(status) {
    if (status === 'draft') {
      return '<span class="product-tag product-tag--draft">草稿</span>';
    }
    if (status === 'off_shelf') {
      return '<span class="product-tag product-tag--stopped">已下架</span>';
    }
    return '<span class="product-tag product-tag--on-shelf">已上架</span>';
  }

  function renderDeliveryMode(item) {
    return (
      '<span class="product-proxy-delivery">' +
      escapeHtml(deliveryModeLabel(item.deliveryMode || item.fulfillmentMode)) +
      '</span>'
    );
  }

  function renderMoreMenu(code, status) {
    var items = [];
    if (status === 'draft') {
      items.push({ action: 'list-shelf', label: '上架' });
      items.push({ action: 'delete', label: '删除', danger: true });
    } else if (status === 'on_shelf') {
      items.push({ action: 'off-shelf', label: '下架' });
    } else if (status === 'off_shelf') {
      items.push({ action: 'delete', label: '删除', danger: true });
    }

    var menuHtml = items
      .map(function (entry) {
        var cls = 'product-more__item';
        if (entry.danger) cls += ' product-more__item--danger';
        else cls += ' product-more__item--primary';
        return (
          '<button type="button" class="' + cls + '" data-action="' + entry.action + '" data-code="' + code + '">' + entry.label + '</button>'
        );
      })
      .join('');

    return (
      '<div class="product-more" data-more-wrap>' +
      '<button type="button" class="product-more__btn" data-more-toggle>更多 <span class="product-more__caret">▼</span></button>' +
      '<div class="product-more__menu">' + menuHtml + '</div></div>'
    );
  }

  function renderActions(item) {
    return (
      '<div class="product-action">' +
      '<button type="button" class="product-action__link" data-action="edit" data-code="' + item.code + '">编辑</button>' +
      renderMoreMenu(item.code, item.status) +
      '</div>'
    );
  }

  function renderTable() {
    var tbody = document.getElementById('mallListTableBody');
    var emptyEl = document.getElementById('mallListEmpty');
    if (!tbody) return;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      tbody.innerHTML = pageItems
        .map(function (item, idx) {
          var rowCls = idx % 2 === 1 ? ' product-proxy-table__row--alt' : '';
          return (
            '<tr class="product-proxy-table__row' + rowCls + '" data-code="' + item.code + '">' +
            '<td class="product-proxy-table__td product-proxy-table__td--name">' + item.name + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--code">' +
            '  <div class="product-proxy-code">' + item.code + '</div>' +
            '  <div class="product-proxy-code__sub">' + item.specCount + '个规格</div>' +
            '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--img">' +
            '  <img class="product-table__thumb" src="' + item.img + '" alt="">' +
            '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--tag">' + (item.tag || '<span class="product-proxy-dash">-</span>') + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--category">' + renderCategoryCell(item) + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--spec">' + item.spec + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--sale">' + renderSalePrice(item) + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--line">' + renderLinePrice(item) + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--sales">' + item.sales + '</td>' +
            renderSaleTimeCell(item) +
            '<td class="product-proxy-table__td product-proxy-table__td--status">' + renderStatus(item.status) + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--action">' + renderActions(item) + '</td>' +
            '</tr>'
          );
        })
        .join('');
    }
    renderPagination();
  }

  function renderPagination() {
    var totalEl = document.getElementById('mallPaginationTotal');
    var pagesEl = document.getElementById('mallPaginationPages');
    var gotoEl = document.getElementById('mallPageGoto');
    var total = state.filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    var page = state.page;

    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(page);

    if (!pagesEl) return;

    var html = '';
    html += '<button type="button" class="product-pagination__btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('…');
      var start = Math.max(2, page - 2);
      var end = Math.min(totalPages - 1, page + 2);
      for (var j = start; j <= end; j++) pages.push(j);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages);
    }

    pages.forEach(function (p) {
      if (p === '…') {
        html += '<button type="button" class="product-pagination__btn" disabled>…</button>';
      } else {
        html += '<button type="button" class="product-pagination__btn' + (p === page ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
      }
    });

    html += '<button type="button" class="product-pagination__btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function readFiltersFromForm() {
    state.filters.code = (document.getElementById('qMallCode') || {}).value.trim();
    state.filters.name = (document.getElementById('qMallName') || {}).value.trim();
    state.filters.mallCategory = (document.getElementById('qMallCategory') || {}).value;
    state.filters.tag = (document.getElementById('qMallTag') || {}).value;
    state.filters.status = (document.getElementById('qMallStatus') || {}).value;
  }

  function refresh(resetPage) {
    if (resetPage) state.page = 1;
    readFiltersFromForm();
    applyFilters();
    renderTable();
  }

  function closeAllMoreMenus() {
    document.querySelectorAll('.product-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  function getProduct(code) {
    for (var i = 0; i < ALL_PRODUCTS.length; i++) {
      if (ALL_PRODUCTS[i].code === code) return ALL_PRODUCTS[i];
    }
    return null;
  }

  function removeProduct(code) {
    ALL_PRODUCTS = ALL_PRODUCTS.filter(function (item) {
      return item.code !== code;
    });
  }

  function bindEvents() {
    document.getElementById('mallFilterQuery') &&
      document.getElementById('mallFilterQuery').addEventListener('click', function () {
        refresh(true);
        if (typeof showToast === 'function') showToast('查询完成', 'success');
      });

    document.getElementById('mallFilterReset') &&
      document.getElementById('mallFilterReset').addEventListener('click', function () {
        var form = document.getElementById('mallListFilterForm');
        if (form) form.reset();
        refresh(true);
      });

    document.getElementById('mallPageSize') &&
      document.getElementById('mallPageSize').addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 20;
        refresh(true);
      });

    document.getElementById('mallPaginationPages') &&
      document.getElementById('mallPaginationPages').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderTable();
      });

    document.getElementById('mallPageGoto') &&
      document.getElementById('mallPageGoto').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        var val = parseInt(e.target.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });

    document.getElementById('mallAddFromLibrary') &&
      document.getElementById('mallAddFromLibrary').addEventListener('click', function () {
        openLibraryDrawer();
      });

    document.addEventListener('click', function (e) {
      var saleTimeBtn = e.target.closest('[data-sale-time-edit]');
      if (saleTimeBtn && !saleTimeBtn.classList.contains('is-editing')) {
        e.preventDefault();
        e.stopPropagation();
        closeAllMoreMenus();
        beginSaleTimeEdit(saleTimeBtn);
        return;
      }

      var toggle = e.target.closest('[data-more-toggle]');
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = toggle.closest('.product-more');
        if (!wrap) return;
        var open = wrap.classList.contains('is-open');
        closeAllMoreMenus();
        if (!open) wrap.classList.add('is-open');
        return;
      }

      if (!e.target.closest('.product-more')) closeAllMoreMenus();

      var actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.preventDefault();
        closeAllMoreMenus();
        var action = actionBtn.getAttribute('data-action');
        var code = actionBtn.getAttribute('data-code');
        var product = getProduct(code);

        if (action === 'edit') {
          if (product) openProductForm(product);
          return;
        }

        if (action === 'list-shelf' && product) {
          if (!isProductReadyForShelf(product)) {
            if (typeof showToast === 'function') {
              showToast('请先编辑商品，完善类目等信息后再上架', 'warning');
            }
            return;
          }
          openWarmConfirmModal('确定上架此商品吗？', function () {
            product.status = 'on_shelf';
            persistProducts();
            renderTable();
            if (typeof showToast === 'function') showToast('已上架', 'success');
          });
          return;
        }

        if (action === 'off-shelf' && product) {
          product.status = 'off_shelf';
          persistProducts();
          renderTable();
          if (typeof showToast === 'function') showToast('已下架', 'success');
          return;
        }

        if (action === 'delete' && product) {
          unbindProductCategory(product);
          removeProduct(code);
          persistProducts();
          applyFilters();
          renderTable();
          populateCategoryFilter();
          if (typeof showToast === 'function') showToast('已删除', 'success');
        }
      }
    });
  }

  function init() {
    if (getStore()) getStore().load();
    if (window.MdmProductCatalog) window.MdmProductCatalog.reload();
    loadProducts();
    state.filtered = ALL_PRODUCTS.slice();
    populateCategoryFilter();
    bindEvents();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
