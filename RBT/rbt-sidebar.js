/* RBT 模块侧栏 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = (window.location.pathname || '').replace(/\\/g, '/');
    const currentPage = (pathForMatch.split('/').pop() || 'rbt_index.html').split('?')[0].replace(/\.html$/i, '');
    const isHome = currentPage === 'rbt_index' || currentPage === '';
    const isAdmitStore = currentPage === 'rbt_admit_store';
    const isProductPackage = currentPage === 'rbt_product_package';
    const isInstallment = currentPage === 'rbt_installment';
    const isDemand = currentPage === 'rbt_demand';
    const isPurchase = currentPage === 'rbt_purchase';
    const isSales = currentPage === 'rbt_sales';
    const isPerformance = currentPage === 'rbt_performance';

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰RBT">' +
        '<span>冷丰RBT</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_index.html') + '" class="menu-link' + (isHome ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>首页</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_admit_store.html') + '" class="menu-link' + (isAdmitStore ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>门店准入管理</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_product_package.html') + '" class="menu-link' + (isProductPackage ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>商品包</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_installment.html') + '" class="menu-link' + (isInstallment ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>产品配置</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_demand.html') + '" class="menu-link' + (isDemand ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>需求单管理</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_purchase.html') + '" class="menu-link' + (isPurchase ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>采购单</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_sales.html') + '" class="menu-link' + (isSales ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>销售单</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="' + pageHref('rbt_performance.html') + '" class="menu-link' + (isPerformance ? ' active' : '') + '">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>履约</span>' +
        '</a>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
