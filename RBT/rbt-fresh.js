/* 本地原型不保留上次改动。刷新页面时清掉 RBT 会话数据，随后各页按初始数据重新生成。 */
(function () {
    var KEYS = [
        'rbt_store_list_v2',
        'rbt_product_package_v1',
        'rbt_installment_v2',
        'rbt_installment_v3',
        'rbt_h5_fund_demand_v1',
        'rbt_h5_store_session',
        'rbt_h5_store_passwords_v1',
        'rbt_h5_trader_accounts_v1',
        'rbt_h5_trader_session',
        'rbt_trader_list_v1',
        'rbt_trader_list_v2',
        'rbt_trader_list_v3'
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
