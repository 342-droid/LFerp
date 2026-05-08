/* 采购专用侧栏：与 WMS 的 wms-sidebar.js、TMS 的 tms-sidebar.js 独立 */
(function() {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const currentPage = window.location.pathname.split('/').pop() || 'purchase_index.html';

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    const isSummaryPage = currentPage === 'purchase_store_demand_summary.html';
    const isOrderSheetPage = currentPage === 'purchase_store_order_sheet.html';
    const isStoreOrderSection = isSummaryPage || isOrderSheetPage;
    const isPurchaseDemandSummaryPage = currentPage === 'purchase_demand_summary.html';
    const isPurchaseOrderPage = currentPage === 'purchase_order.html';
    const isPurchaseManagementSection = isPurchaseDemandSummaryPage || isPurchaseOrderPage;

    const storeOrderSubmenuHtml =
        '<li><a href="' + pageHref('purchase_store_demand_summary.html') + '"' + (isSummaryPage ? ' class="active"' : '') + '>门店订货汇总</a></li>' +
        '<li><a href="' + pageHref('purchase_store_order_sheet.html') + '"' + (isOrderSheetPage ? ' class="active"' : '') + '>门店订货单</a></li>';

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰采购">' +
        '<span>冷丰采购</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="门店订货" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>门店订货</span>' +
        '<button class="menu-toggle" type="button">' + (isStoreOrderSection ? '▼' : '▶') + '</button>' +
        '</a>' +
        '<ul class="submenu' + (isStoreOrderSection ? ' expanded' : '') + '">' + storeOrderSubmenuHtml + '</ul>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="采购管理" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>采购管理</span>' +
        '<button class="menu-toggle" type="button">' + (isPurchaseManagementSection ? '▼' : '▶') + '</button>' +
        '</a>' +
        '<ul class="submenu' + (isPurchaseManagementSection ? ' expanded' : '') + '">' +
        '<li><a href="' + pageHref('purchase_demand_summary.html') + '"' + (isPurchaseDemandSummaryPage ? ' class="active"' : '') + '>采购需求汇总</a></li>' +
        '<li><a href="' + pageHref('purchase_order.html') + '"' + (isPurchaseOrderPage ? ' class="active"' : '') + '>采购单</a></li>' +
        '</ul>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
