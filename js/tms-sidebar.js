/* TMS 专用侧栏：菜单数据与渲染与 WMS 的 wms-sidebar.js 完全独立，互不影响 */
(function() {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const currentPage = window.location.pathname.split('/').pop() || 'TMS_index.html';

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰TMS">' +
        '<span>冷丰TMS</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('tms_route_rule.html') + '" class="menu-link' + (currentPage === 'tms_route_rule.html' ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="路由规则" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>路由规则</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('tms_route.html') + '" class="menu-link' + (currentPage === 'tms_route.html' ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="线路管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>线路管理</span>' +
        '</a>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
