/* MDM 侧栏：业务伙伴页展示主体/资源/人员；会员页展示会员360/会员体系；顶栏「审核中心」独立入口页仅展示审核分组 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = window.location.pathname.replace(/\\/g, '/');
    // serve 等静态服务器常去掉 .html，匹配时统一去掉后缀与查询串
    function pageBase(name) {
        return String(name || '')
            .split('?')[0]
            .split('#')[0]
            .replace(/\.html$/i, '')
            .split('/')
            .pop() || '';
    }
    const currentPage = pageBase(pathForMatch.split('/').pop()) || 'mdm_party_store';

    function hrefMatchesCurrentPage(href) {
        var full = String(href || '');
        var seg = full.split('#');
        var path = seg[0] || '';
        var hash = seg[1] || '';
        var hrefBase = pageBase(path);
        var samePath =
            hrefBase === currentPage ||
            pathForMatch.endsWith('/' + path) ||
            pathForMatch.endsWith(path) ||
            pathForMatch.replace(/\.html$/i, '').endsWith('/' + hrefBase);
        // 人群列表页归属「会员分群」高亮
        if (!samePath && hrefBase === 'mdm_member_segment' && currentPage === 'mdm_member_segment_members') {
            samePath = true;
        }
        // 批量打标签新建/编辑/人群列表归属「批量打标签」高亮
        if (!samePath && hrefBase === 'mdm_member_batch_tag' &&
            (currentPage === 'mdm_member_batch_tag_form' || currentPage === 'mdm_member_batch_tag_members')) {
            samePath = true;
        }
        if (!samePath) return false;
        var curHash = String(window.location.hash || '').replace(/^#/, '');
        if (!hash) {
            return !curHash || curHash === 'store-registration';
        }
        return curHash === hash;
    }

    const partyItems = [
        { href: 'mdm_party_store.html', text: '门店' },
        { href: 'mdm_party_supplier.html', text: '供应商' },
        { href: 'mdm_party_warehouse.html', text: '仓库' },
        { href: 'mdm_party_live_room.html', text: '直播间' },
        { href: 'mdm_party_carrier.html', text: '承运商' }
    ];

    const archiveItems = [
        { href: 'mdm_archive_store.html', text: '门店档案' },
        { href: 'mdm_archive_supplier.html', text: '供应商档案' },
        { href: 'mdm_archive_warehouse.html', text: '仓库档案' },
        { href: 'mdm_archive_live_room.html', text: '直播间档案' },
        { href: 'mdm_archive_carrier.html', text: '承运商档案' },
        { href: 'mdm_supplier_product.html', text: '供货关系' }
    ];

    const peopleItems = [
        { href: 'mdm_people_bd.html', text: 'BD' },
        { href: 'mdm_people_purchaser.html', text: '采购员' },
        { href: 'mdm_people_driver.html', text: '司机' },
        { href: 'mdm_people_anchor.html', text: '主播' }
    ];

    /** 会员 · 会员360 */
    const member360Items = [
        { href: 'mdm_member_c.html', text: '会员管理' },
        { href: 'mdm_member_tag.html', text: '会员标签' },
        { href: 'mdm_member_batch_tag.html', text: '批量打标签' },
        { href: 'mdm_member_segment.html', text: '会员分群' }
    ];

    /** 会员 · 会员体系 */
    const memberSystemItems = [
        { href: 'mdm_member_level.html', text: '会员等级' },
        { href: 'mdm_member_level_rule.html', text: '成长值规则' },
        { href: 'mdm_member_level_growth.html', text: '成长值明细' },
        { href: 'mdm_member_level_desc.html', text: '规则说明' }
    ];

    const auditItems = [
        { href: 'mdm_audit_store_registration.html', text: '门店注册审核' },
        { href: 'mdm_audit_store_registration.html#onboarding-review', text: '进件审核' }
    ];

    function groupHasActive(items) {
        return items.some(function (item) { return hrefMatchesCurrentPage(item.href); });
    }

    const isPartyPage = groupHasActive(partyItems);
    const isArchivePage = groupHasActive(archiveItems);
    const isPeoplePage = groupHasActive(peopleItems);
    const isMember360Page = groupHasActive(member360Items);
    const isMemberSystemPage = groupHasActive(memberSystemItems);
    // 兜底：路径以 mdm_member_ 开头即视为会员模块（兼容无html 后缀被剥离）
    const isMemberPage =
        isMember360Page ||
        isMemberSystemPage ||
        /^mdm_member_/i.test(currentPage);
    const isAuditPage = groupHasActive(auditItems);

    /**
     * 与 WMS wms-sidebar 一致：分组 + submenu + toggleSubmenu(this)
     * @param {string} iconRel 相对 image/
     */
    function refreshSidebarActiveState() {
        var links = document.querySelectorAll('#sidebar .submenu a[data-mdm-nav]');
        links.forEach(function (a) {
            var navHref = a.getAttribute('data-mdm-nav') || '';
            a.classList.toggle('active', hrefMatchesCurrentPage(navHref));
        });
    }

    function renderCollapsibleGroup(label, iconRel, items, sectionActive) {
        var submenuHtml = items.map(function (item) {
            var active = hrefMatchesCurrentPage(item.href);
            return '<li><a href="' + pageHref(item.href) + '" data-mdm-nav="' + item.href + '"' +
                (active ? ' class="active"' : '') + '>' + item.text + '</a></li>';
        }).join('');
        return '<li class="menu-item">' +
            '<a href="#" class="menu-link" onclick="toggleSubmenu(this)">' +
            '<img src="' + assetHref('image/' + iconRel + '.svg') + '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
            '<span>' + label + '</span>' +
            '<button type="button" class="menu-toggle">▼</button>' +
            '</a>' +
            '<ul class="submenu' + (sectionActive ? ' expanded' : '') + '">' + submenuHtml + '</ul>' +
            '</li>';
    }

    var itemsHtml;
    if (isAuditPage) {
        /** 顶栏「审核中心」独立入口：仅在该模块页面展示侧栏审核菜单 */
        itemsHtml = renderCollapsibleGroup('审核中心', '任务管理', auditItems, true);
    } else if (isMemberPage) {
        /** 顶栏「会员」独立入口：两组均默认展开，便于一眼看到完整菜单 */
        itemsHtml =
            renderCollapsibleGroup('会员360', '基础信息', member360Items, true) +
            renderCollapsibleGroup('会员体系', '策略管理', memberSystemItems, true);
    } else {
        itemsHtml =
            renderCollapsibleGroup('商家主体', '基础信息', partyItems, isPartyPage) +
            renderCollapsibleGroup('资源中心', '策略管理', archiveItems, isArchivePage) +
            renderCollapsibleGroup('人员中心', '权限管理', peopleItems, isPeoplePage);
    }

    var sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    var sidebarTitle = isMemberPage ? '冷丰会员' : '冷丰MDM';

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="' + sidebarTitle + '">' +
        '<span>' + sidebarTitle + '</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' + itemsHtml + '</ul>' +
        '</aside>';

    refreshSidebarActiveState();
    if (!window.__mdmSidebarHashBound) {
        window.__mdmSidebarHashBound = true;
        window.addEventListener('hashchange', refreshSidebarActiveState);
    }

    window.MdmSidebar = {
        refreshActiveState: refreshSidebarActiveState,
        hrefMatchesCurrentPage: hrefMatchesCurrentPage
    };
})();
