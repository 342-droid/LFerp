/* 结算侧栏：清分、策略、清分台账（含异常单 Tab）、供应商、承运商运费、佣金、补偿。 */
(function () {
    var wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    var currentPage = String(window.location.pathname.split('/').pop() || '').replace(/\.html$/i, '');
    if (currentPage === 'mdm_settle_fee_config' || currentPage === 'mdm_settle_freight_config') {
        window.location.replace(wp.page('mdm_order_freight_config.html'));
        return;
    }
    var names = {
        policy: '策略管理',
        summary: '清分汇总',
        ledger: '清分台账',
        supplier: '供应商结算',
        carrier: '承运商结算',
        commission: '佣金清算',
        compensation: '补偿结款'
    };
    var params = new URLSearchParams(window.location.search);
    var view = params.get('view') || 'summary';
    if (view === 'exception') {
        window.location.replace(wp.page('mdm_settle_index.html') + '?view=ledger&tab=exception');
        return;
    }
    if (!names[view]) view = 'summary';
    var items = Object.keys(names).map(function (key) {
        return '<li class="menu-item"><a class="menu-link' + (view === key ? ' active' : '') +
            '" href="' + wp.page('mdm_settle_index.html') + '?view=' + key + '">' +
            '<span>' + names[key] + '</span></a></li>';
    }).join('');
    var host = document.getElementById('sidebar-container');
    if (!host) return;
    host.innerHTML = '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header"><img src="' + wp.asset('image/冷丰图标.png') +
        '" alt="冷丰结算"><span>冷丰结算</span></div>' +
        '<div class="settle-sidebar-caption">结算中心</div><ul class="sidebar-menu">' + items + '</ul></aside>';
})();
