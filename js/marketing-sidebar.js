/* 营销专用侧栏：积分管理 / 积分首页 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const currentPage = window.location.pathname.split('/').pop() || 'mdm_marketing_points_home.html';

    const pointsItems = [
        { href: 'mdm_marketing_points_home.html', text: '积分首页' },
        { href: 'mdm_marketing_consume_points.html', text: '消费赠积分' }
    ];

    function pageMatches(href) {
        return currentPage === String(href || '');
    }

    const isPointsSection = pointsItems.some(function (item) { return pageMatches(item.href); });

    const submenuHtml = pointsItems.map(function (item) {
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
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰营销">' +
        '<span>冷丰营销</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
        '<img src="' + assetHref('image/策略管理.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>积分管理</span>' +
        '<button type="button" class="menu-toggle">' + (isPointsSection ? '▼' : '▶') + '</button>' +
        '</a>' +
        '<ul class="submenu' + (isPointsSection ? ' expanded' : '') + '">' + submenuHtml + '</ul>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
