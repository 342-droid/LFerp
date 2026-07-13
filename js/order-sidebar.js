/* 订单专用侧栏：订单管理 / 排队记录 */
(function () {
  var wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
  var pageHref = function (f) { return wp.page(f); };
  var assetHref = function (r) { return wp.asset(r); };
  var currentPage = window.location.pathname.split('/').pop() || 'mdm_order_retail.html';

  var orderManageGroup = {
    title: '订单管理',
    items: [
      { href: 'mdm_order_retail.html', text: '零售订单' },
      { href: 'mdm_order_proxy.html', text: '代采订单' }
    ]
  };

  var legacyPages = {
    'mdm_order_live.html': 'mdm_order_retail.html',
    'mdm_order_mall.html': 'mdm_order_retail.html'
  };

  if (legacyPages[currentPage]) {
    window.location.replace(pageHref(legacyPages[currentPage]));
    return;
  }

  function pageMatches(href) {
    return currentPage === String(href || '');
  }

  function isGroupActive(group) {
    return group.items.some(function (item) { return pageMatches(item.href); });
  }

  function renderSubmenuItems(items) {
    return items.map(function (item) {
      var active = pageMatches(item.href);
      return '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
    }).join('');
  }

  var isOrderManageSection = isGroupActive(orderManageGroup);
  var isQueuePage = pageMatches('mdm_order_queue.html');

  var sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML =
    '<aside class="sidebar order-sidebar" id="sidebar">' +
    '<div class="sidebar-header">' +
    '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰订单">' +
    '<span>冷丰订单</span>' +
    '</div>' +
    '<ul class="sidebar-menu order-sidebar-menu">' +
    '<li class="menu-item order-side-group">' +
    '<a href="#" class="menu-link order-side-group__head" onclick="toggleSubmenu(this); return false;">' +
    '<img src="' + assetHref('image/任务管理.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
    '<span class="order-side-group__title">订单管理</span>' +
    '<button type="button" class="menu-toggle" aria-label="展开">' + (isOrderManageSection ? '▼' : '▶') + '</button>' +
    '</a>' +
    '<ul class="submenu order-side-submenu' + (isOrderManageSection ? ' expanded' : '') + '">' +
    renderSubmenuItems(orderManageGroup.items) +
    '</ul></li>' +
    '<li class="menu-item">' +
    '<a href="' + pageHref('mdm_order_queue.html') + '" class="menu-link' + (isQueuePage ? ' active' : '') + '">' +
    '<img src="' + assetHref('image/任务管理.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
    '<span>排队记录</span>' +
    '</a></li>' +
    '</ul></aside>';
})();
