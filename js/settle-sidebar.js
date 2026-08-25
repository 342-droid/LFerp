/* 结算专用侧栏：仅结算中心。运费已迁至订单，账户配置已迁至基础设置 / 门店配置 */
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

    function pageBase(name) {
        return String(name || '')
            .split('?')[0]
            .split('#')[0]
            .replace(/\.html$/i, '')
            .split('/')
            .pop() || '';
    }

    var currentPage = pageBase(window.location.pathname.split('/').pop()) || 'mdm_settle_index';

    /* 旧费用/运费入口 → 订单 / 运费配置 */
    if (currentPage === 'mdm_settle_fee_config' || currentPage === 'mdm_settle_freight_config') {
        window.location.replace(pageHref('mdm_order_freight_config.html'));
        return;
    }

    var isCenterActive = currentPage === 'mdm_settle_index';

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
        '</ul>' +
        '</aside>';
})();
