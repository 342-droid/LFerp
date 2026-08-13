/* 直播专用侧栏：直播管理 / 直播商品（分组均默认展开，与营销侧栏一致） */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = window.location.pathname.replace(/\\/g, '/');

    /** 与 mdm-sidebar 一致：去掉 .html / 查询串，兼容静态服务器剥离后缀 */
    function pageBase(name) {
        return String(name || '')
            .split('?')[0]
            .split('#')[0]
            .replace(/\.html$/i, '')
            .split('/')
            .pop() || '';
    }

    const currentPage = pageBase(pathForMatch.split('/').pop()) || 'mdm_live_room';

    const manageItems = [
        { href: 'mdm_live_room.html', text: '直播间' },
        { href: 'mdm_live_timeslot.html', text: '直播时段' },
        {
            href: 'mdm_live_session.html',
            text: '直播场次',
            alsoActive: [
                'mdm_live_session_form.html',
                'mdm_live_session_detail.html'
            ]
        },
        { href: 'mdm_live_data.html', text: '直播数据' },
        { href: 'mdm_live_control.html', text: '直播中控' }
    ];

    const productItems = [
        {
            href: 'mdm_live_product_sched.html',
            text: '直播排品',
            alsoActive: [
                'mdm_live_product_sched_edit.html'
            ]
        },
        { href: 'mdm_live_product_category.html', text: '直播类目' }
    ];

    function pageMatches(href) {
        var hrefBase = pageBase(href);
        return (
            hrefBase === currentPage ||
            pathForMatch.endsWith('/' + String(href || '')) ||
            pathForMatch.replace(/\.html$/i, '').endsWith('/' + hrefBase)
        );
    }

    function itemActive(item) {
        if (pageMatches(item.href)) return true;
        if (item.alsoActive && item.alsoActive.some(pageMatches)) return true;
        return false;
    }

    function submenuHtml(items) {
        return items.map(function (item) {
            const active = itemActive(item);
            return '<li><a href="' + pageHref(item.href) + '"' + (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
        }).join('');
    }

    /** 与会员侧栏一致：分组默认展开，切换子菜单后仍保持展开 */
    function renderCollapsibleGroup(label, iconRel, items) {
        return '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/' + iconRel + '.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>' + label + '</span>' +
            '<button type="button" class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu expanded">' + submenuHtml(items) + '</ul>' +
            '</li>';
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰直播">' +
        '<span>冷丰直播</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        renderCollapsibleGroup('直播管理', '策略管理', manageItems) +
        renderCollapsibleGroup('直播商品', '策略管理', productItems) +
        '</ul>' +
        '</aside>';
})();
