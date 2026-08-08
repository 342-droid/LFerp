/* 营销专用侧栏：积分管理 / 营销活动（分组均默认展开，与会员侧栏一致） */
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

    const currentPage = pageBase(pathForMatch.split('/').pop()) || 'mdm_marketing_points_home';

    const pointsItems = [
        { href: 'mdm_marketing_points_home.html', text: '积分首页' },
        { href: 'mdm_marketing_consume_points.html', text: '消费赠积分' }
    ];

    const activityItems = [
        {
            href: 'mdm_marketing_points_mall.html',
            text: '积分商城',
            alsoActive: [
                'mdm_marketing_points_mall_form.html',
                'mdm_marketing_points_rule_desc.html'
            ]
        },
        {
            href: 'mdm_marketing_newcomer_zone.html',
            text: '新人专区',
            alsoActive: [
                'mdm_marketing_newcomer_zone_form.html'
            ]
        },
        {
            href: 'mdm_marketing_register_gift.html',
            text: '注册有礼',
            alsoActive: [
                'mdm_marketing_register_gift_form.html'
            ]
        },
        {
            href: 'mdm_marketing_cash_redpack.html',
            text: '现金红包'
        }
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
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰营销">' +
        '<span>冷丰营销</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        renderCollapsibleGroup('积分管理', '策略管理', pointsItems) +
        renderCollapsibleGroup('营销活动', '策略管理', activityItems) +
        '</ul>' +
        '</aside>';
})();
