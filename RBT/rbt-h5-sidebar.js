/* RBT-H5 模块侧栏 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = (window.location.pathname || '').replace(/\\/g, '/');
    const currentPage = (pathForMatch.split('/').pop() || 'rbt_h5_index.html').split('?')[0];
    const pageName = currentPage.replace(/\.html$/i, '');
    const isHome = pageName === 'rbt_h5_index' || pageName === '';
    const isStore = pageName === 'rbt_h5_store';
    const isTrader = pageName === 'rbt_h5_trader';

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰RBT-H5">' +
        '<span style="white-space:nowrap;font-size:16px;">冷丰RBT-H5</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_h5_index.html') + '" class="menu-link' + (isHome ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>首页</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_h5_store.html') + '" class="menu-link' + (isStore ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>门店端</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_h5_trader.html') + '" class="menu-link' + (isTrader ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>贸易商端</span>' +
        '</a>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
