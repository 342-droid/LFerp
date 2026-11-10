/* RBF 模块侧栏 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = (window.location.pathname || '').replace(/\\/g, '/');
    const currentPage = (pathForMatch.split('/').pop() || 'rbf_index.html').split('?')[0].replace(/\.html$/i, '');
    const isHome = currentPage === 'rbf_index' || currentPage === '';
    const isAdmitStore = currentPage === 'rbf_admit_store';
    const isProductPackage = currentPage === 'rbf_product_package';
    const isInstallment = currentPage === 'rbf_installment';
    const isTrader = currentPage === 'rbf_trader';

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰RBF">' +
        '<span>冷丰RBF</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbf_index.html') + '" class="menu-link' + (isHome ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>首页</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbf_admit_store.html') + '" class="menu-link' + (isAdmitStore ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>门店管理</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbf_product_package.html') + '" class="menu-link' + (isProductPackage ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>商品包</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbf_installment.html') + '" class="menu-link' + (isInstallment ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>分期配置</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbf_trader.html') + '" class="menu-link' + (isTrader ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>贸易商管理</span>' +
        '</a>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
