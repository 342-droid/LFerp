/* 基础设置专用侧栏 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const currentPage = (window.location.pathname.split('/').pop() || 'basic_settings_miniprogram_agreement.html').toLowerCase();

    const agreementItems = [
        { href: 'basic_settings_miniprogram_agreement.html', text: '小程序协议' }
    ];

    const topLevelItems = [
        { href: 'basic_settings_order.html', text: '订单配置' },
        { href: 'basic_settings_recommendation.html', text: '推荐位配置' },
        { href: 'basic_settings_member.html', text: '会员配置' },
        { href: 'basic_settings_material.html', text: '素材管理', icon: '基础信息' },
        { href: 'basic_settings_system.html', text: '系统管理', icon: '权限管理' },
        { href: 'basic_settings_cooperation.html', text: '合作管理' }
    ];

    function pageMatches(href) {
        return currentPage === String(href || '').toLowerCase();
    }

    function groupHasActive(items) {
        return items.some(function (item) { return pageMatches(item.href); });
    }

    const isAgreementSection = groupHasActive(agreementItems);

    function renderCollapsibleGroup(label, iconRel, items, sectionActive) {
        const submenuHtml = items.map(function (item) {
            const active = pageMatches(item.href);
            return '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
        }).join('');
        const iconHtml = iconRel
            ? '<img src="' + assetHref('image/' + iconRel + '.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">'
            : '';
        return '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this); return false;">' +
            iconHtml +
            '<span>' + label + '</span>' +
            '<button type="button" class="menu-toggle">' + (sectionActive ? '▼' : '▶') + '</button>' +
            '</a>' +
            '<ul class="submenu' + (sectionActive ? ' expanded' : '') + '">' + submenuHtml + '</ul>' +
            '</li>';
    }

    function renderTopLevelItem(item) {
        const active = pageMatches(item.href);
        const iconHtml = item.icon
            ? '<img src="' + assetHref('image/' + item.icon + '.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">'
            : '';
        return '<li class="menu-item">' +
            '<a href="' + pageHref(item.href) + '" class="menu-link' + (active ? ' active' : '') + '">' +
            iconHtml +
            '<span>' + item.text + '</span>' +
            '<span class="menu-chevron">▼</span>' +
            '</a>' +
            '</li>';
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    const topLevelHtml = topLevelItems.map(renderTopLevelItem).join('');

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰基础设置">' +
        '<span>基础设置</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        renderCollapsibleGroup('协议配置', null, agreementItems, isAgreementSection) +
        topLevelHtml +
        '</ul>' +
        '</aside>';
})();
