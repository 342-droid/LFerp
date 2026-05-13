/* 移动端模块侧栏（与 WMS 分组 + submenu 结构一致，无仓库选择器） */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = window.location.pathname.replace(/\\/g, '/');
    const currentPage = pathForMatch.split('/').pop() || 'mobile_index.html';

    function hrefMatchesCurrentPage(href) {
        if (href === currentPage) return true;
        return pathForMatch.endsWith('/' + href) || pathForMatch.endsWith(href);
    }

    const mobileAppItems = [
        { href: 'app_list.html', text: '仓储APP' },
        { href: 'mdm_bd_workbench.html', text: 'BD APP' },
        { href: 'shop-h5/h5/store/register.html', text: '门店H5' }
    ];

    const isMobileAppPage = mobileAppItems.some(function (item) {
        return hrefMatchesCurrentPage(item.href);
    });
    const isMobileModuleHome = hrefMatchesCurrentPage('mobile_index.html');
    const expandMobileGroup = isMobileModuleHome || isMobileAppPage;

    const submenuHtml = mobileAppItems.map(function (item) {
        const active = hrefMatchesCurrentPage(item.href);
        return '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
    }).join('');

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰移动端">' +
        '<span>冷丰移动端</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
        '<img src="' + assetHref('image/基础信息.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>移动端</span>' +
        '<button type="button" class="menu-toggle">▼</button>' +
        '</a>' +
        '<ul class="submenu' + (expandMobileGroup ? ' expanded' : '') + '">' + submenuHtml + '</ul>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
