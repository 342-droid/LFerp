/* 主数据管理专用侧栏 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    let currentPage = (window.location.pathname.split('/').pop() || 'master_data_product_category.html').toLowerCase().split('?')[0];
    if (currentPage && !currentPage.endsWith('.html')) currentPage += '.html';

    const productMasterItems = [
        { href: 'master_data_product_category.html', text: '商品分类' },
        { href: 'master_data_product_brand.html', text: '商品品牌' },
        { href: 'master_data_ingredient_category.html', text: '配料类别' },
        { href: 'master_data_product_library.html', text: '基础商品库' }
    ];

    const supplyChainItems = [
        { href: 'master_data_supplier.html', text: '供应商档案' },
        { href: 'master_data_supply.html', text: '供货关系' }
    ];

    function pageMatches(href) {
        return currentPage === String(href || '').toLowerCase();
    }

    function groupHasActive(items) {
        return items.some(function (item) { return pageMatches(item.href); });
    }

    const isProductMasterSection = groupHasActive(productMasterItems);
    const isSupplyChainSection = groupHasActive(supplyChainItems);

    function renderCollapsibleGroup(label, items, sectionActive) {
        const submenuHtml = items.map(function (item) {
            const active = pageMatches(item.href);
            return '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
        }).join('');
        return '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this); return false;">' +
            '<span>' + label + '</span>' +
            '<button type="button" class="menu-toggle">' + (sectionActive ? '▼' : '▶') + '</button>' +
            '</a>' +
            '<ul class="submenu' + (sectionActive ? ' expanded' : '') + '">' + submenuHtml + '</ul>' +
            '</li>';
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰主数据管理">' +
        '<span style="white-space:nowrap;font-size:16px">主数据管理</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        renderCollapsibleGroup('商品主数据', productMasterItems, isProductMasterSection) +
        renderCollapsibleGroup('供应链管理', supplyChainItems, isSupplyChainSection) +
        '</ul>' +
        '</aside>';
})();
