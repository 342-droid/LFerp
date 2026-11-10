/* 本地原型不保留上次改动。刷新页面时清掉 RBF 会话数据，随后各页按初始数据重新生成。 */
(function () {
    var KEYS = [
        'rbf_store_list_v2',
        'rbf_product_package_v1',
        'rbf_installment_v2',
        'rbf_installment_v3',
        'rbf_h5_fund_demand_v1',
        'rbf_h5_store_session',
        'rbf_h5_store_passwords_v1',
        'rbf_h5_trader_accounts_v1',
        'rbf_h5_trader_session',
        'rbf_trader_list_v1',
        'rbf_trader_list_v2',
        'rbf_trader_list_v3'
    ];
    var nav = window.performance && performance.getEntriesByType
        ? performance.getEntriesByType('navigation')[0]
        : null;
    if (!nav || nav.type !== 'reload') return;
    KEYS.forEach(function (key) {
        try {
            sessionStorage.removeItem(key);
        } catch (e) {}
    });
})();
