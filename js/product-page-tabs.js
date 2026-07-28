/**
 * 商品模块 — 动态页签（首页固定不可关，仅展示已打开页面）
 */
(function () {
  var STORAGE_KEY = 'mdm_product_page_tabs_v1';
  var HOME_PAGE = 'mdm_workbench.html';

  var PAGE_TABS = {
    'mdm_product_selection.html': '选品库',
    'mdm_product_category.html': '商品类目',
    'mdm_product_brand.html': '商品品牌',
    'mdm_product_mall.html': '商品列表',
    'mdm_product_mall_category.html': '商城类目',
    'mdm_product_mall_tag.html': '商城标签',
    'mdm_product_proxy_list.html': '商品列表',
    'mdm_product_proxy_category.html': '类目管理',
    'mdm_product_proxy_tag.html': '标签管理',
    'mdm_product_audit.html': '商品详情'
  };

  var HOME_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
    '<path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z"/></svg>';

  function wp() {
    return window.wmsPath || { page: function (f) { return f; } };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentPage() {
    return (window.location.pathname.split('/').pop() || '').toLowerCase();
  }

  function loadTabs() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list)) return list.filter(function (p) { return PAGE_TABS[p]; });
      }
    } catch (e) { /* ignore */ }
    return [];
  }

  function saveTabs(tabs) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (e) { /* ignore */ }
  }

  function ensureCurrentTabOpen(tabs, page) {
    if (!PAGE_TABS[page]) return tabs;
    if (tabs.indexOf(page) >= 0) return tabs;
    return tabs.concat([page]);
  }

  function render(page, tabs) {
    var container = document.getElementById('productPageTabs');
    if (!container) return;

    var html =
      '<a href="' +
      wp().page(HOME_PAGE) +
      '" class="product-page-tabs__item product-page-tabs__item--home">' +
      HOME_ICON +
      '首页</a>';

    tabs.forEach(function (tabPage) {
      var label = PAGE_TABS[tabPage];
      if (!label) return;
      var active = tabPage === page;
      var closeBtn =
        '<button type="button" class="product-page-tabs__close" data-close-tab="' +
        tabPage +
        '" aria-label="关闭">×</button>';

      if (active) {
        html +=
          '<span class="product-page-tabs__item product-page-tabs__item--active">' +
          escapeHtml(label) +
          closeBtn +
          '</span>';
      } else {
        html +=
          '<a href="' +
          wp().page(tabPage) +
          '" class="product-page-tabs__item">' +
          '<span class="product-page-tabs__label">' +
          escapeHtml(label) +
          '</span>' +
          closeBtn +
          '</a>';
      }
    });

    container.innerHTML = html;
  }

  function closeTab(tabPage, page) {
    var tabs = loadTabs().filter(function (t) { return t !== tabPage; });
    saveTabs(tabs);

    if (tabPage === page) {
      if (tabs.length) {
        window.location.href = wp().page(tabs[tabs.length - 1]);
      } else {
        window.location.href = wp().page(HOME_PAGE);
      }
      return;
    }
    render(page, tabs);
  }

  function bindEvents(page) {
    var container = document.getElementById('productPageTabs');
    if (!container || container._productTabsBound) return;
    container._productTabsBound = true;

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-close-tab]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      closeTab(btn.getAttribute('data-close-tab'), page);
    });
  }

  function init() {
    var page = currentPage();
    if (!PAGE_TABS[page]) return;

    var tabs = loadTabs();
    tabs = ensureCurrentTabOpen(tabs, page);
    saveTabs(tabs);
    render(page, tabs);
    bindEvents(page);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
