/* 订单专用侧栏：直播订单 / 商城订单 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const currentPage = window.location.pathname.split('/').pop() || 'mdm_order_live.html';

    const orderItems = [
        { href: 'mdm_order_live.html', text: '直播订单' },
        { href: 'mdm_order_mall.html', text: '商城订单' }
    ];

    function pageMatches(href) {
        return currentPage === String(href || '');
    }

    const isOrderSection = orderItems.some(function (item) { return pageMatches(item.href); });

    const submenuHtml = orderItems.map(function (item) {
        const active = pageMatches(item.href);
        return '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
    }).join('');

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰订单">' +
        '<span>冷丰订单</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
        '<img src="' + assetHref('image/任务管理.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>订单管理</span>' +
        '<button type="button" class="menu-toggle">' + (isOrderSection ? '▼' : '▶') + '</button>' +
        '</a>' +
        '<ul class="submenu' + (isOrderSection ? ' expanded' : '') + '">' + submenuHtml + '</ul>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
