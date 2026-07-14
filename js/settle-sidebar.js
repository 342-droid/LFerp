/* 结算专用侧栏：结算中心 / 费用配置（运费配置） */
(function () {
    var wp = window.wmsPath || {
        page: function (f) {
            return f;
        },
        asset: function (r) {
            return r;
        }
    };
    var pageHref = function (f) {
        return wp.page(f);
    };
    var assetHref = function (r) {
        return wp.asset(r);
    };
    var currentPage = window.location.pathname.split('/').pop() || 'mdm_settle_index.html';

    // 旧「费用配置」落地页 → 运费配置
    if (currentPage === 'mdm_settle_fee_config.html') {
        window.location.replace(pageHref('mdm_settle_freight_config.html'));
        return;
    }

    var feeConfigItems = [{ href: 'mdm_settle_freight_config.html', text: '运费配置' }];

    function pageMatches(href) {
        return currentPage === String(href || '');
    }

    var isCenterActive = pageMatches('mdm_settle_index.html');
    var isFeeSection = feeConfigItems.some(function (item) {
        return pageMatches(item.href);
    });

    var feeSubmenuHtml = feeConfigItems
        .map(function (item) {
            var active = pageMatches(item.href);
            return (
                '<li><a href="' +
                pageHref(item.href) +
                '"' +
                (active ? ' class="active"' : '') +
                '>' +
                item.text +
                '</a></li>'
            );
        })
        .join('');

    var sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    sidebarContainer.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header">' +
        '<img src="' +
        assetHref('image/冷丰图标.png') +
        '" alt="冷丰结算">' +
        '<span>冷丰结算</span>' +
        '</div>' +
        '<ul class="sidebar-menu">' +
        '<li class="menu-item">' +
        '<a href="' +
        pageHref('mdm_settle_index.html') +
        '" class="menu-link' +
        (isCenterActive ? ' active' : '') +
        '">' +
        '<img src="' +
        assetHref('image/策略管理.svg') +
        '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>结算中心</span>' +
        '</a>' +
        '</li>' +
        '<li class="menu-item">' +
        '<a href="#" class="menu-link" onclick="toggleSubmenu(this); return false;">' +
        '<img src="' +
        assetHref('image/基础信息.svg') +
        '" alt="" style="height: 20px; margin-right: 10px; vertical-align: middle;">' +
        '<span>费用配置</span>' +
        '<button type="button" class="menu-toggle" aria-label="展开">' +
        (isFeeSection ? '▼' : '▶') +
        '</button>' +
        '</a>' +
        '<ul class="submenu' +
        (isFeeSection ? ' expanded' : '') +
        '">' +
        feeSubmenuHtml +
        '</ul>' +
        '</li>' +
        '</ul>' +
        '</aside>';
})();
