(function () {
  var wp = window.wmsPath || { page: function (f) { return f; } };

  var SEED = [
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
      status: 'on_shelf'
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
      status: 'on_shelf'
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
  var NAMES = ['精品西红柿', '本地生菜', '鲜鸡蛋托装', '娃哈哈纯净水', '康师傅冰红茶', '黄心土豆', '冷鲜牛腩', '鲜香菇'];

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

  function buildCatalog() {
    var list = SEED.slice();
    var i = 0;
    while (list.length < 87) {
      var seed = SEED[i % SEED.length];
      var num = 100 - Math.floor(list.length / SEED.length);
      list.push({
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
        status: i % 17 === 0 ? 'off_shelf' : 'on_shelf'
      });
      i += 1;
    }
    ALL_PRODUCTS = list;
  }

  function matchFilters(item) {
    var f = state.filters;
    if (f.code && item.code.toLowerCase().indexOf(f.code.toLowerCase()) < 0) return false;
    if (f.name && item.name.indexOf(f.name) < 0) return false;
    if (f.mallCategory && item.category !== f.mallCategory) return false;
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
    if (item.linePrice == null || item.linePrice === '') {
      return '<span class="product-proxy-dash">-</span>';
    }
    return '<span class="product-proxy-price product-proxy-price--line">' + formatMoney(item.linePrice) + '</span>';
  }

  function renderStatus(status) {
    if (status === 'off_shelf') {
      return '<span class="product-tag product-tag--stopped">已下架</span>';
    }
    return '<span class="product-tag product-tag--on-shelf">已上架</span>';
  }

  function renderMoreMenu(code, status) {
    var offLabel = status === 'on_shelf' ? '下架' : '上架';
    return (
      '<div class="product-more" data-more-wrap>' +
      '<button type="button" class="product-more__btn" data-more-toggle>更多 <span class="product-more__caret">▼</span></button>' +
      '<div class="product-more__menu">' +
      '<button type="button" class="product-more__item" data-action="toggle-shelf" data-code="' + code + '">' + offLabel + '</button>' +
      '<button type="button" class="product-more__item" data-action="copy" data-code="' + code + '">复制</button>' +
      '</div></div>'
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
    var tbody = document.getElementById('proxyListTableBody');
    var emptyEl = document.getElementById('proxyListEmpty');
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
            '<td class="product-proxy-table__td product-proxy-table__td--category">' + (item.category || '<span class="product-proxy-dash">-</span>') + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--spec">' + item.spec + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--sale">' + renderSalePrice(item) + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--line">' + renderLinePrice(item) + '</td>' +
            '<td class="product-proxy-table__td product-proxy-table__td--sales">' + item.sales + '</td>' +
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
    var totalEl = document.getElementById('proxyPaginationTotal');
    var pagesEl = document.getElementById('proxyPaginationPages');
    var gotoEl = document.getElementById('proxyPageGoto');
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
    state.filters.code = (document.getElementById('qProxyCode') || {}).value.trim();
    state.filters.name = (document.getElementById('qProxyName') || {}).value.trim();
    state.filters.mallCategory = (document.getElementById('qProxyMallCategory') || {}).value;
    state.filters.tag = (document.getElementById('qProxyTag') || {}).value;
    state.filters.status = (document.getElementById('qProxyStatus') || {}).value;
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

  function bindEvents() {
    document.getElementById('proxyFilterQuery') &&
      document.getElementById('proxyFilterQuery').addEventListener('click', function () {
        refresh(true);
        if (typeof showToast === 'function') showToast('查询完成', 'success');
      });

    document.getElementById('proxyFilterReset') &&
      document.getElementById('proxyFilterReset').addEventListener('click', function () {
        var form = document.getElementById('proxyListFilterForm');
        if (form) form.reset();
        refresh(true);
      });

    document.getElementById('proxyPageSize') &&
      document.getElementById('proxyPageSize').addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 20;
        refresh(true);
      });

    document.getElementById('proxyPaginationPages') &&
      document.getElementById('proxyPaginationPages').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderTable();
      });

    document.getElementById('proxyPageGoto') &&
      document.getElementById('proxyPageGoto').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        var val = parseInt(e.target.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });

    document.getElementById('proxyListTabClose') &&
      document.getElementById('proxyListTabClose').addEventListener('click', function () {
        window.location.href = wp.page('mdm_workbench.html');
      });

    document.getElementById('proxyAddFromLibrary') &&
      document.getElementById('proxyAddFromLibrary').addEventListener('click', function () {
        if (typeof showToast === 'function') showToast('从商品库添加（演示）', 'info');
      });

    document.addEventListener('click', function (e) {
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
          if (typeof showToast === 'function') showToast('编辑 ' + code + '（演示）', 'info');
          return;
        }

        if (action === 'toggle-shelf' && product) {
          product.status = product.status === 'on_shelf' ? 'off_shelf' : 'on_shelf';
          renderTable();
          if (typeof showToast === 'function') {
            showToast(product.status === 'on_shelf' ? '已上架' : '已下架', 'success');
          }
          return;
        }

        if (action === 'copy') {
          if (typeof showToast === 'function') showToast('复制 ' + code + '（演示）', 'info');
        }
      }
    });
  }

  function init() {
    buildCatalog();
    state.filtered = ALL_PRODUCTS.slice();
    bindEvents();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
