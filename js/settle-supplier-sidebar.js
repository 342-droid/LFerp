/* 供应商角色结算侧栏：与平台结算中心独立，互不影响。 */
(function () {
    var wp = window.wmsPath || { page: function (f) { return f; }, asset: function (r) { return r; } };
    var names = {
        account: '账户总览',
        ledger: '清分台账',
        bills: '结款单'
    };
    var params = new URLSearchParams(window.location.search);
    var view = params.get('view') || 'account';
    if (!names[view]) view = 'account';
    var supplier = params.get('supplier') || localStorage.getItem('spSettleSupplierId') || '';
    var items = Object.keys(names).map(function (key) {
        var href = wp.page('mdm_settle_supplier_portal.html') + '?view=' + key +
            (supplier ? '&supplier=' + encodeURIComponent(supplier) : '');
        return '<li class="menu-item"><a class="menu-link' + (view === key ? ' active' : '') +
            '" href="' + href + '"><span>' + names[key] + '</span></a></li>';
    }).join('');
    var host = document.getElementById('sidebar-container');
    if (!host) return;
    /* 回平台结算改由版头切回主组织，侧栏不再放返回链接 */
    try {
        var orgId = localStorage.getItem('lfCurrentOrgId') || '';
        if (orgId && String(orgId).indexOf('sup-') !== 0) {
            window.location.replace(wp.page('mdm_settle_index.html'));
            return;
        }
    } catch (e) { /* ignore */ }

    host.innerHTML = '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar-header"><img src="' + wp.asset('image/冷丰图标.png') +
        '" alt="冷丰结算"><span>冷丰结算</span></div>' +
        '<div class="settle-sidebar-caption">供应商结算</div>' +
        '<ul class="sidebar-menu">' + items + '</ul></aside>';
})();
