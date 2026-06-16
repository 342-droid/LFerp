/* MDM 侧栏：业务伙伴页展示主体/资源/人员/会员；顶栏「审核中心」独立入口页仅展示审核分组 */
(function () {
    const wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    const pageHref = function (f) { return wp.page(f); };
    const assetHref = function (r) { return wp.asset(r); };
    const pathForMatch = window.location.pathname.replace(/\\/g, '/');
    const currentPage = pathForMatch.split('/').pop() || 'mdm_party_store.html';

    function hrefMatchesCurrentPage(href) {
        var full = String(href || '');
        var seg = full.split('#');
        var path = seg[0] || '';
        var hash = seg[1] || '';
        var samePath =
            path === currentPage ||
            pathForMatch.endsWith('/' + path) ||
            pathForMatch.endsWith(path);
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

    const memberItems = [
        { href: 'mdm_member_c.html', text: 'C端会员' }
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
    const isMemberPage = groupHasActive(memberItems);
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

    /** 顶栏「审核中心」独立入口：仅在该模块页面展示侧栏审核菜单 */
    var itemsHtml = isAuditPage
        ? renderCollapsibleGroup('审核中心', '任务管理', auditItems, true)
        : renderCollapsibleGroup('商家主体', '基础信息', partyItems, isPartyPage) +
        renderCollapsibleGroup('资源中心', '策略管理', archiveItems, isArchivePage) +
        renderCollapsibleGroup('人员中心', '权限管理', peopleItems, isPeoplePage) +
        renderCollapsibleGroup('会员中心', '基础信息', memberItems, isMemberPage);

    var sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
        return;
    }

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' + assetHref('image/冷丰图标.png') + '" alt="冷丰MDM">' +
        '<span>冷丰MDM</span>' +
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
