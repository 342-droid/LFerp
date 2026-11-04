/* 供应商角色结算门户：账户总览 / 订单 / 清分台账 / 结款单。与平台结算中心数据同源口径、页面独立；不改平台订单模块。 */
(function () {
    /* 结算账户可能是公司共用汇付商户，总览不展示汇付余额/可提现，只按本商家订单归集。 */
    var SUPPLIERS = [
        {
            id: 'sup-ss',
            name: '斯斯供应商商家',
            code: '330159456409100288',
            accountName: '小牛供应链有限公司',
            accountNo: '6666000218008801'
        },
        {
            id: 'sup-mq',
            name: '南京马群枢纽供应商',
            code: '319838916817453056',
            accountName: '南京冷链物流服务有限公司',
            accountNo: '6666000219001108'
        }
    ];

    var LEDGER = [
        { id: '1721', orderNo: 'ORD-2610312477895', lineNo: '—', product: '运费验收-快递常温2.5kg', qty: 1, goods: '0.01', deduct: '0.00', net: '0.01', clearStatus: '已清分', settleStatus: '待结算', postingStatus: '待入账', settleAmount: '—', related: '—', flowNo: '—', orderTime: '2026-10-31 18:17:16', supplier: '斯斯供应商商家', orderType: '代采' },
        { id: '1719', orderNo: 'ORD-2610312466502', lineNo: 'ORD-2610312466502-1', product: '火龙果', qty: 2, goods: '0.04', deduct: '0.00', net: '0.04', clearStatus: '已清分', settleStatus: '待结款', postingStatus: '待入账', settleAmount: '—', related: 'ST_357556279620669440', flowNo: '—', orderTime: '2026-10-31 13:58:02', supplier: '斯斯供应商商家', orderType: '零售' },
        { id: '1716', orderNo: 'ORD-2610307754308', lineNo: 'ORD-2610307754308-1', product: '低糖养乐多', qty: 3, goods: '1.50', deduct: '0.00', net: '1.50', clearStatus: '已清分', settleStatus: '已结款', postingStatus: '已入账', settleAmount: '1.50', related: 'ST_351310165011607552', flowNo: '003100TOP3B26103077543081', orderTime: '2026-10-30 18:05:11', supplier: '南京马群枢纽供应商', orderType: '代采' },
        { id: '1708', orderNo: 'ORD-261013200012', lineNo: 'ORD-261013200012-1', product: '白芭乐-快递-ss', qty: 1, goods: '0.30', deduct: '0.06', net: '0.24', clearStatus: '已清分', settleStatus: '已结款', postingStatus: '已入账', settleAmount: '0.24', related: 'ST_2088198765544431618', flowNo: '003100TOP3B2610132000121', orderTime: '2026-10-13 10:22:00', supplier: '斯斯供应商商家', orderType: '零售' },
        { id: '1705', orderNo: 'ORD-261016200015', lineNo: 'ORD-261016200015-2', product: '芒果干', qty: 2, goods: '0.80', deduct: '0.16', net: '0.64', clearStatus: '已清分', settleStatus: '结款中', postingStatus: '待入账', settleAmount: '—', related: 'ST_2086759712106688514', flowNo: '—', orderTime: '2026-10-16 09:10:00', supplier: '斯斯供应商商家', orderType: '零售' },
        { id: '1699', orderNo: 'ORD-261008200001', lineNo: 'ORD-261008200001-1', product: '马群-莲藕-快递配送', qty: 5, goods: '12.00', deduct: '0.60', net: '11.40', clearStatus: '已清分', settleStatus: '待结算', postingStatus: '待入账', settleAmount: '—', related: '—', flowNo: '—', orderTime: '2026-10-08 14:20:00', supplier: '南京马群枢纽供应商', orderType: '零售' },
        { id: '1695', orderNo: 'ORD-2609033597216', lineNo: 'ORD-2609033597216-1', product: '火龙果', qty: 1, goods: '0.03', deduct: '0.00', net: '0.03', clearStatus: '已清分', settleStatus: '部分结款', postingStatus: '已入账', settleAmount: '0.02', related: 'ST_353846837167284224', flowNo: '003100TOP3B26090335972161', orderTime: '2026-09-03 18:21:00', supplier: '斯斯供应商商家', orderType: '零售' },
        { id: '1690', orderNo: 'ORD-2609104841852', lineNo: '353852301770752223', product: '低糖养乐多', qty: 1, goods: '0.02', deduct: '0.01', net: '0.01', clearStatus: '清分异常', settleStatus: '待结算', postingStatus: '待入账', settleAmount: '—', related: 'ST_358643443066482688', flowNo: '—', orderTime: '2026-09-10 11:05:00', supplier: '南京马群枢纽供应商', orderType: '零售', exception: '未配置供应商结算账户或结算主体' }
    ];

    var BILLS = [
        { id: 'ST_357556279620669440', supplier: '斯斯供应商商家', goods: '0.50', deduct: '0.49', net: '0.01', orders: 1, status: '待结款', created: '2026-09-14 00:01', cycle: '2026-09-12', posted: '' },
        { id: 'ST_353846837167284224', supplier: '斯斯供应商商家', goods: '0.04', deduct: '0.00', net: '0.04', orders: 2, status: '部分结款', created: '2026-09-03 18:21', cycle: '2026-09-03', posted: '2026-09-06 15:07' },
        { id: 'ST_2088198765544431618', supplier: '斯斯供应商商家', goods: '0.30', deduct: '0.06', net: '0.24', orders: 1, status: '已结款', created: '2026-08-15 18:21', cycle: '2026-08-14', posted: '2026-08-16 10:02' },
        { id: 'ST_2086759712106688514', supplier: '斯斯供应商商家', goods: '0.80', deduct: '0.16', net: '0.64', orders: 1, status: '结款中', created: '2026-08-10 18:21', cycle: '2026-08-10', posted: '' },
        { id: 'ST_358643443066482688', supplier: '南京马群枢纽供应商', goods: '0.04', deduct: '0.02', net: '0.02', orders: 2, status: '待结款', created: '2026-09-17 00:01', cycle: '2026-09-10', posted: '' },
        { id: 'ST_351310165011607552', supplier: '南京马群枢纽供应商', goods: '1.50', deduct: '0.00', net: '1.50', orders: 1, status: '已结款', created: '2026-08-27 18:21', cycle: '2026-08-27', posted: '2026-10-31 09:21' },
        { id: 'ST_351310131578810368', supplier: '南京马群枢纽供应商', goods: '0.42', deduct: '0.14', net: '0.28', orders: 6, status: '已结款', created: '2026-08-27 18:21', cycle: '2026-08-27', posted: '2026-08-28 11:00' }
    ];

    var FLOWS = [
        { time: '2026-10-31 09:21:05', type: '结款入账', billId: 'ST_351310165011607552', amount: '1.50', status: '成功', flowNo: '003100TOP3B26103077543081', supplier: '南京马群枢纽供应商' },
        { time: '2026-09-06 15:07:00', type: '结款入账', billId: 'ST_353846837167284224', amount: '0.02', status: '成功', flowNo: '003100TOP3B26090335972161', supplier: '斯斯供应商商家' },
        { time: '2026-08-16 10:02:11', type: '结款入账', billId: 'ST_2088198765544431618', amount: '0.24', status: '成功', flowNo: '003100TOP3B2610132000121', supplier: '斯斯供应商商家' },
        { time: '2026-08-10 18:30:00', type: '在途', billId: 'ST_2086759712106688514', amount: '0.64', status: '处理中', flowNo: '—', supplier: '斯斯供应商商家' },
        { time: '2026-09-14 00:05:00', type: '在途', billId: 'ST_357556279620669440', amount: '0.01', status: '待出账', flowNo: '—', supplier: '斯斯供应商商家' },
        { time: '2026-09-17 00:10:00', type: '在途', billId: 'ST_358643443066482688', amount: '0.02', status: '待出账', flowNo: '—', supplier: '南京马群枢纽供应商' }
    ];

    /* 供应商视角订单：零售 + 代采，仅本商家；平台订单模块不改。 */
    var ORDERS = [
        { id: 'o-ss-1', orderNo: 'ORD-2610312477895', orderType: '代采', storeName: '德清乾元天恩冷鲜超市', product: '运费验收-快递常温2.5kg', qty: 1, goods: '0.01', orderStatus: '交易成功', logisticsNo: 'SF1448200317569', logisticsStatus: '已签收', aftersale: '无售后', settleStatus: '待结算', related: '—', orderTime: '2026-10-31 18:17:16', payTime: '2026-10-31 18:17:40', shipTime: '2026-10-31 19:05:00', receiveTime: '2026-11-01 10:22:00', clearTime: '—', settleTime: '—', supplier: '斯斯供应商商家' },
        { id: 'o-ss-2', orderNo: 'ORD-2610312466502', orderType: '零售', storeName: '斯斯门店商家2', product: '火龙果等 2 种', qty: 3, goods: '0.05', orderStatus: '交易成功', logisticsNo: 'YT8862001452', logisticsStatus: '已签收', aftersale: '售后中', settleStatus: '待结款', related: 'ST_357556279620669440', orderTime: '2026-10-31 13:58:02', payTime: '2026-10-31 13:58:20', shipTime: '2026-10-31 16:10:00', receiveTime: '2026-11-01 09:40:00', clearTime: '2026-10-31 14:01:10', settleTime: '—', supplier: '斯斯供应商商家' },
        { id: 'o-ss-3', orderNo: 'ORD-261016200015', orderType: '零售', storeName: '斯斯门店商家2', product: '芒果干', qty: 2, goods: '0.80', orderStatus: '待收货', logisticsNo: 'ZT5519008821', logisticsStatus: '运输中', aftersale: '无售后', settleStatus: '结款中', related: 'ST_2086759712106688514', orderTime: '2026-10-16 09:10:00', payTime: '2026-10-16 09:10:18', shipTime: '2026-10-16 14:20:00', receiveTime: '—', clearTime: '2026-10-16 09:30:00', settleTime: '—', supplier: '斯斯供应商商家' },
        { id: 'o-ss-4', orderNo: 'ORD-261013200012', orderType: '零售', storeName: '斯斯门店商家2', product: '白芭乐-快递-ss', qty: 1, goods: '0.30', orderStatus: '交易成功', logisticsNo: 'SF1448200299100', logisticsStatus: '已签收', aftersale: '无售后', settleStatus: '已结款', related: 'ST_2088198765544431618', orderTime: '2026-10-13 10:22:00', payTime: '2026-10-13 10:22:15', shipTime: '2026-10-13 15:00:00', receiveTime: '2026-10-14 11:08:00', clearTime: '2026-10-13 10:40:00', settleTime: '2026-08-16 10:02:11', supplier: '斯斯供应商商家' },
        { id: 'o-ss-5', orderNo: 'ORD-2609033597216', orderType: '零售', storeName: '斯斯门店商家2', product: '火龙果', qty: 1, goods: '0.03', orderStatus: '交易成功', logisticsNo: 'YD1238800456', logisticsStatus: '已签收', aftersale: '无售后', settleStatus: '部分结款', related: 'ST_353846837167284224', orderTime: '2026-09-03 18:21:00', payTime: '2026-09-03 18:21:12', shipTime: '2026-09-04 09:00:00', receiveTime: '2026-09-05 16:30:00', clearTime: '2026-09-03 18:40:00', settleTime: '2026-09-06 15:07:00', supplier: '斯斯供应商商家' },
        { id: 'o-mq-1', orderNo: 'ORD-2610307754308', orderType: '代采', storeName: '南京马群枢纽供应商店', product: '低糖养乐多', qty: 3, goods: '1.50', orderStatus: '交易成功', logisticsNo: 'SF1448200300011', logisticsStatus: '已签收', aftersale: '无售后', settleStatus: '已结款', related: 'ST_351310165011607552', orderTime: '2026-10-30 18:05:11', payTime: '2026-10-30 18:05:30', shipTime: '2026-10-30 20:10:00', receiveTime: '2026-10-31 08:50:00', clearTime: '2026-10-30 18:10:00', settleTime: '2026-10-31 09:21:05', supplier: '南京马群枢纽供应商' },
        { id: 'o-mq-2', orderNo: 'ORD-261008200001', orderType: '零售', storeName: '南京马群枢纽供应商店', product: '马群-莲藕-快递配送', qty: 5, goods: '12.00', orderStatus: '待发货', logisticsNo: '—', logisticsStatus: '未发货', aftersale: '无售后', settleStatus: '待结算', related: '—', orderTime: '2026-10-08 14:20:00', payTime: '2026-10-08 14:20:22', shipTime: '—', receiveTime: '—', clearTime: '2026-10-08 14:35:00', settleTime: '—', supplier: '南京马群枢纽供应商' },
        { id: 'o-mq-3', orderNo: 'ORD-2609104841852', orderType: '零售', storeName: '野子文化', product: '低糖养乐多', qty: 1, goods: '0.02', orderStatus: '交易成功', logisticsNo: 'ZT5519007701', logisticsStatus: '已签收', aftersale: '无售后', settleStatus: '待结算', related: 'ST_358643443066482688', orderTime: '2026-09-10 11:05:00', payTime: '2026-09-10 11:05:18', shipTime: '2026-09-10 15:40:00', receiveTime: '2026-09-11 10:12:00', clearTime: '—', settleTime: '—', exception: '未配置供应商结算账户或结算主体', supplier: '南京马群枢纽供应商' }
    ];

    var params = new URLSearchParams(window.location.search);
    var state = {
        view: params.get('view') || 'account',
        detail: params.get('detail') || '',
        orderDetail: params.get('order') || '',
        supplierId: params.get('supplier') || localStorage.getItem('spSettleSupplierId') || 'sup-ss',
        ledgerTab: params.get('tab') || 'all',
        orderTab: params.get('orderTab') || 'all',
        query: '',
        status: '',
        orderStatus: ''
    };
    if (!['account', 'orders', 'ledger', 'bills'].includes(state.view)) state.view = 'account';
    if (!['all', 'retail', 'proxy'].includes(state.orderTab)) state.orderTab = 'all';

    function h(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function cash(v) {
        if (v === '—' || v == null || v === '') return '—';
        var n = Number(v);
        if (isNaN(n)) return '¥' + h(v);
        return '¥' + n.toFixed(2);
    }
    function tag(v) {
        var cls = /已结款|成功|已入账|已清分/.test(v) ? 'green'
            : /异常|失败/.test(v) ? 'red'
            : /待|部分|结款中|处理中|出账/.test(v) ? 'orange' : '';
        return '<span class="settle-tag ' + cls + '">' + h(mapStatus(v)) + '</span>';
    }
    function mapStatus(v) {
        var m = {
            '待结算': '待结算',
            '待结款': '待结算',
            '结款中': '出账中',
            '部分结款': '部分结款',
            '已结款': '已结款',
            '结款失败': '结款异常',
            '清分异常': '清分异常'
        };
        return m[v] || v;
    }
    function currentSupplier() {
        return SUPPLIERS.filter(function (s) { return s.id === state.supplierId; })[0] || SUPPLIERS[0];
    }
    function button(label, act, id, kind) {
        return '<button type="button" class="settle-btn ' + (kind || 'link') + '" data-act="' + h(act) + '"' +
            (id ? ' data-id="' + h(id) + '"' : '') + '>' + h(label) + '</button>';
    }
    function card(title, body, extra) {
        return '<section class="settle-card"><div class="settle-card-head"><h2>' + h(title) + '</h2>' +
            (extra || '') + '</div><div class="settle-card-body">' + body + '</div></section>';
    }
    function setUrl() {
        var p = new URLSearchParams();
        p.set('view', state.view);
        p.set('supplier', state.supplierId);
        if (state.view === 'ledger' && state.ledgerTab && state.ledgerTab !== 'all') p.set('tab', state.ledgerTab);
        if (state.view === 'orders' && state.orderTab && state.orderTab !== 'all') p.set('orderTab', state.orderTab);
        if (state.view === 'orders' && state.orderDetail) p.set('order', state.orderDetail);
        if (state.view === 'bills' && state.detail) p.set('detail', state.detail);
        history.replaceState(null, '', location.pathname + '?' + p.toString());
        localStorage.setItem('spSettleSupplierId', state.supplierId);
    }
    function titleText() {
        var base = '结算 / 供应商结算 / ';
        if (state.view === 'orders') return base + (state.orderDetail ? '订单详情' : '订单');
        if (state.view === 'ledger') return base + '清分台账';
        if (state.view === 'bills') return base + (state.detail ? '结款单详情' : '结款单');
        return base + '账户总览';
    }
    function supplierLedgerAll() {
        var s = currentSupplier();
        return LEDGER.filter(function (r) { return r.supplier === s.name; });
    }
    /* 按本商家订单归集：采购汇总 / 已到账；不读汇付商户余额。 */
    function accountStats() {
        var rows = supplierLedgerAll();
        var purchase = sumField(rows, 'goods');
        var arrived = rows.reduce(function (n, r) {
            if (r.postingStatus !== '已入账') return n;
            var v = Number(r.settleAmount);
            return n + (isNaN(v) ? 0 : v);
        }, 0);
        var pending = rows.reduce(function (n, r) {
            if (!/待结算|待结款|结款中|部分结款/.test(r.settleStatus)) return n;
            if (r.clearStatus === '清分异常') return n;
            var v = Number(r.net);
            return n + (isNaN(v) ? 0 : v);
        }, 0);
        var inTransit = rows.reduce(function (n, r) {
            if (r.settleStatus !== '结款中') return n;
            var v = Number(r.net);
            return n + (isNaN(v) ? 0 : v);
        }, 0);
        return { purchase: purchase, arrived: arrived, pending: pending, inTransit: inTransit, orderCount: rows.length };
    }
    /* 组织切换在版头一级页签右侧；本页不再重复供应商下拉。 */
    function renderAccount() {
        var s = currentSupplier();
        var stats = accountStats();
        var flows = FLOWS.filter(function (f) { return f.supplier === s.name; }).slice(0, 8);
        var metrics =
            '<div class="sp-metric-grid sp-metric-grid--pair">' +
            metric('采购汇总金额', stats.purchase, '本商家订单采购款合计（' + stats.orderCount + ' 笔明细）', 'goto-orders') +
            metric('已到账金额', stats.arrived, '本商家已入账结款金额', 'goto-bills') +
            '</div>';
        var subs =
            '<div class="sp-sub-metrics">' +
            subMetric('待结算金额', stats.pending) +
            subMetric('出账中金额', stats.inTransit) +
            '</div>';
        var acctBar =
            '<div class="sp-account-bar">' +
            '<span>供应商名称 <b>' + h(s.name) + '</b></span>' +
            '<span>结算收款账户名称 <b>' + h(s.accountName) + '</b></span>' +
            '<span>结算收款账户 <b>' + h(s.accountNo) + '</b></span>' +
            '</div>';
        var flowRows = flows.map(function (f) {
            return '<tr><td>' + h(f.time) + '</td><td>' + h(f.type) + '</td>' +
                '<td class="money">' + cash(f.amount) + '</td><td>' + tag(f.status) + '</td>' +
                '<td>' + button(f.billId, 'bill-detail', f.billId) + '</td>' +
                '<td title="' + h(f.flowNo || '—') + '">' + h(f.flowNo || '—') + '</td></tr>';
        }).join('');
        var flowTable = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            '<th>时间</th><th>类型</th><th class="money">金额</th><th>状态</th><th>关联结款单</th><th>交易流水</th></tr></thead><tbody>' +
            (flowRows || '<tr><td colspan="6" class="settle-empty">暂无动态</td></tr>') +
            '</tbody></table></div>';
        return acctBar + metrics + subs + card('近期结款动态', flowTable);
    }
    function metric(label, value, hint, act) {
        return '<div class="sp-metric" data-act="' + h(act) + '"><div class="sp-metric__label">' + h(label) +
            '</div><div class="sp-metric__value">' + cash(value) + '</div><div class="sp-metric__hint">' +
            h(hint) + '</div></div>';
    }
    function subMetric(label, value) {
        return '<div class="sp-sub-metric"><div class="sp-sub-metric__label">' + h(label) +
            '</div><div class="sp-sub-metric__value">' + cash(value) + '</div></div>';
    }

    function orderRows() {
        var s = currentSupplier();
        return ORDERS.filter(function (r) {
            if (r.supplier !== s.name) return false;
            if (state.orderTab === 'retail' && r.orderType !== '零售') return false;
            if (state.orderTab === 'proxy' && r.orderType !== '代采') return false;
            if (state.query && String(r.orderNo).indexOf(state.query) < 0 && String(r.product).indexOf(state.query) < 0 &&
                String(r.logisticsNo || '').indexOf(state.query) < 0) return false;
            if (state.orderStatus && r.orderStatus !== state.orderStatus) return false;
            if (state.status && r.settleStatus !== state.status) return false;
            return true;
        });
    }
    function orderTrackSteps(o) {
        return [
            { name: '下单', time: o.orderTime, done: !!o.orderTime && o.orderTime !== '—' },
            { name: '支付', time: o.payTime, done: !!o.payTime && o.payTime !== '—' },
            { name: '发货', time: o.shipTime, done: !!o.shipTime && o.shipTime !== '—' },
            { name: '收货/签收', time: o.receiveTime, done: !!o.receiveTime && o.receiveTime !== '—' },
            { name: '清分', time: o.clearTime, done: !!o.clearTime && o.clearTime !== '—' },
            { name: '结款入账', time: o.settleTime, done: !!o.settleTime && o.settleTime !== '—' }
        ];
    }
    function renderOrders() {
        if (state.orderDetail) return renderOrderDetail(state.orderDetail);
        var rows = orderRows();
        var tabs = [['all', '全部'], ['retail', '零售订单'], ['proxy', '代采订单']];
        var tabHtml = '<div class="settle-tabs">' + tabs.map(function (t) {
            return '<button type="button" class="settle-tab' + (state.orderTab === t[0] ? ' active' : '') +
                '" data-act="order-tab" data-id="' + h(t[0]) + '">' + h(t[1]) + '</button>';
        }).join('') + '</div>';
        var orderStatuses = ['待发货', '待收货', '交易成功', '交易关闭'];
        var filters = '<div class="settle-card-body"><div class="settle-filter">' +
            '<label class="settle-field"><span>订单号/商品/物流单</span><input class="settle-input" id="sp-query" value="' +
            h(state.query) + '" placeholder="请输入订单号、商品或物流单号"></label>' +
            '<label class="settle-field"><span>订单状态</span><select class="settle-select" id="sp-order-status">' +
            '<option value="">全部</option>' +
            orderStatuses.map(function (v) {
                return '<option value="' + h(v) + '"' + (state.orderStatus === v ? ' selected' : '') + '>' + h(v) + '</option>';
            }).join('') + '</select></label>' +
            '<label class="settle-field"><span>结算状态</span><select class="settle-select" id="sp-status">' +
            '<option value="">全部</option>' +
            ['待结算', '待结款', '结款中', '部分结款', '已结款'].map(function (v) {
                return '<option value="' + h(v) + '"' + (state.status === v ? ' selected' : '') + '>' + h(mapStatus(v)) + '</option>';
            }).join('') + '</select></label>' +
            '<div class="settle-actions">' + button('查询', 'search', '', 'primary') + button('重置', 'reset-orders', '', '') +
            '</div></div></div>';
        var tip = '<div class="mdm-biz-tip mdm-biz-tip--flush" role="note">仅展示<strong>本商家</strong>供货的零售订单与代采订单，用于跟踪履约与结款进度；平台侧订单模块不变。</div>';
        var tr = rows.map(function (r) {
            return '<tr>' +
                '<td>' + button(r.orderNo, 'order-detail', r.id) + '</td>' +
                '<td>' + h(r.orderType) + '</td>' +
                '<td title="' + h(r.storeName) + '">' + h(r.storeName) + '</td>' +
                '<td title="' + h(r.product) + '">' + h(r.product) + '</td>' +
                '<td>' + h(r.qty) + '</td>' +
                '<td class="money">' + cash(r.goods) + '</td>' +
                '<td>' + tag(r.orderStatus) + '</td>' +
                '<td title="' + h(r.logisticsNo) + '">' + h(r.logisticsNo) + '</td>' +
                '<td>' + h(r.logisticsStatus) + '</td>' +
                '<td>' + h(r.aftersale) + '</td>' +
                '<td>' + tag(r.settleStatus) + '</td>' +
                '<td>' + (r.related && r.related !== '—' ? button(r.related, 'bill-detail', r.related) : '—') + '</td>' +
                '<td>' + h(r.orderTime) + '</td>' +
                '<td>' + button('跟踪', 'order-detail', r.id) + '</td></tr>';
        }).join('');
        var table = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            ['订单号', '订单类型', '门店', '商品', '数量', '采购款', '订单状态', '物流单号', '物流状态', '售后', '结算状态', '关联结款单', '下单时间', '操作']
                .map(function (x) { return '<th>' + h(x) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + (tr || '<tr><td colspan="14" class="settle-empty">暂无订单</td></tr>') +
            '</tbody></table></div>';
        return tip + '<section class="settle-card">' + tabHtml + filters + table +
            '<div class="settle-table-footer">共 ' + rows.length + ' 条（只读）</div></section>';
    }
    function renderOrderDetail(id) {
        var s = currentSupplier();
        var o = ORDERS.filter(function (x) { return x.id === id; })[0];
        var back = '<div class="settle-back">' + button('← 返回订单列表', 'back-orders', '', '') + '</div>';
        if (!o || o.supplier !== s.name) {
            return back + '<div class="settle-note">未找到订单，或无权查看：' + h(id) + '</div>';
        }
        var steps = orderTrackSteps(o);
        var trackHtml = '<ol class="sp-order-track">' + steps.map(function (st) {
            return '<li class="sp-order-track__item' + (st.done ? ' is-done' : '') + '">' +
                '<div class="sp-order-track__dot"></div>' +
                '<div class="sp-order-track__body"><strong>' + h(st.name) + '</strong>' +
                '<span>' + h(st.time && st.time !== '—' ? st.time : '未到达') + '</span></div></li>';
        }).join('') + '</ol>';
        var lines = LEDGER.filter(function (r) { return r.orderNo === o.orderNo && r.supplier === s.name; });
        var lineTr = lines.map(function (r) {
            return '<tr><td>' + h(r.lineNo) + '</td><td>' + h(r.product) + '</td><td>' + h(r.qty) + '</td>' +
                '<td class="money">' + cash(r.goods) + '</td><td class="money">' + cash(r.deduct) + '</td>' +
                '<td class="money">' + cash(r.net) + '</td><td>' + tag(r.clearStatus) + '</td><td>' + tag(r.settleStatus) + '</td></tr>';
        }).join('');
        var lineTable = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            '<th>子订单号</th><th>商品</th><th>数量</th><th>采购款</th><th>扣减</th><th>净额</th><th>清分状态</th><th>结算状态</th></tr></thead><tbody>' +
            (lineTr || '<tr><td colspan="8" class="settle-empty">暂无明细</td></tr>') + '</tbody></table></div>';
        var basic = '<div class="settle-description">' +
            desc('订单号', h(o.orderNo)) + desc('订单类型', h(o.orderType)) +
            desc('门店', h(o.storeName)) + desc('订单状态', tag(o.orderStatus)) +
            desc('物流单号', h(o.logisticsNo)) + desc('物流状态', h(o.logisticsStatus)) +
            desc('售后', h(o.aftersale)) + desc('采购款', cash(o.goods)) +
            desc('结算状态', tag(o.settleStatus)) +
            desc('关联结款单', o.related && o.related !== '—' ? button(o.related, 'bill-detail', o.related) : '—') +
            desc('异常说明', h(o.exception || '—')) +
            '</div>';
        return back + '<div class="settle-detail-header"><h2>订单跟踪</h2></div>' +
            card('基础信息', basic) + card('履约与结款进度', trackHtml) + card('商品明细', lineTable);
    }
    function ledgerRows() {
        var s = currentSupplier();
        return LEDGER.filter(function (r) {
            if (r.supplier !== s.name) return false;
            if (state.ledgerTab === 'pending') {
                return /待结算|待结款|结款中|部分结款/.test(r.settleStatus) && r.clearStatus !== '清分异常';
            }
            if (state.ledgerTab === 'settled') return r.settleStatus === '已结款';
            if (state.ledgerTab === 'exception') return r.clearStatus === '清分异常' || /失败|异常/.test(r.settleStatus);
            return true;
        }).filter(function (r) {
            if (state.query && String(r.orderNo).indexOf(state.query) < 0 && String(r.product).indexOf(state.query) < 0) return false;
            if (state.status && r.settleStatus !== state.status) return false;
            return true;
        });
    }
    function sumField(rows, key) {
        return rows.reduce(function (n, r) {
            var v = Number(r[key]);
            return n + (isNaN(v) ? 0 : v);
        }, 0);
    }
    function renderLedger() {
        var rows = ledgerRows();
        var tabs = [['all', '全部'], ['pending', '待结算'], ['settled', '已结款'], ['exception', '异常']];
        var tabHtml = '<div class="settle-tabs">' + tabs.map(function (t) {
            return '<button type="button" class="settle-tab' + (state.ledgerTab === t[0] ? ' active' : '') +
                '" data-act="ledger-tab" data-id="' + h(t[0]) + '">' + h(t[1]) + '</button>';
        }).join('') + '</div>';
        var filters = '<div class="settle-card-body"><div class="settle-filter">' +
            '<label class="settle-field"><span>订单号/商品</span><input class="settle-input" id="sp-query" value="' +
            h(state.query) + '" placeholder="请输入订单号或商品"></label>' +
            '<label class="settle-field"><span>结算状态</span><select class="settle-select" id="sp-status">' +
            '<option value="">全部</option>' +
            ['待结算', '待结款', '结款中', '部分结款', '已结款', '结款失败'].map(function (v) {
                return '<option value="' + h(v) + '"' + (state.status === v ? ' selected' : '') + '>' + h(mapStatus(v)) + '</option>';
            }).join('') + '</select></label>' +
            '<div class="settle-actions">' + button('查询', 'search', '', 'primary') + button('重置', 'reset', '', '') +
            '</div></div></div>';
        var totals = '<div class="settle-totals"><b>当前合计（' + rows.length + ' 行）</b>' +
            '<span>采购款合计 <b>' + cash(sumField(rows, 'goods')) + '</b></span>' +
            '<span>扣减合计 <b>' + cash(sumField(rows, 'deduct')) + '</b></span>' +
            '<span>待结算/净额参考 <b>' + cash(sumField(rows.filter(function (r) {
                return /待结算|待结款|结款中|部分结款/.test(r.settleStatus);
            }), 'net')) + '</b></span>' +
            '<span>结款金额合计 <b>' + cash(sumField(rows, 'settleAmount')) + '</b></span></div>';
        var tr = rows.map(function (r) {
            return '<tr>' +
                '<td>' + h(r.orderNo) + '</td><td>' + h(r.lineNo) + '</td><td>' + h(r.orderType) + '</td>' +
                '<td title="' + h(r.product) + '">' + h(r.product) + '</td><td>' + h(r.qty) + '</td>' +
                '<td class="money">' + cash(r.goods) + '</td><td class="money">' + cash(r.deduct) + '</td>' +
                '<td class="money">' + cash(r.net) + '</td>' +
                '<td>' + tag(r.clearStatus) + '</td><td>' + tag(r.settleStatus) + '</td><td>' + tag(r.postingStatus) + '</td>' +
                '<td class="money">' + cash(r.settleAmount) + '</td>' +
                '<td>' + (r.related && r.related !== '—' ? button(r.related, 'bill-detail', r.related) : '—') + '</td>' +
                '<td title="' + h(r.flowNo) + '">' + h(r.flowNo) + '</td>' +
                '<td>' + h(r.orderTime) + '</td>' +
                '<td class="wrap">' + h(r.exception || '—') + '</td></tr>';
        }).join('');
        var table = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            ['订单号', '子订单号', '订单类型', '商品', '数量', '采购款（货款）', '扣减合计', '净额', '清分状态', '结算状态', '入账状态', '结款金额', '关联结款单', '通道流水号', '下单时间', '异常说明']
                .map(function (x) { return '<th>' + h(x) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + (tr || '<tr><td colspan="16" class="settle-empty">暂无数据</td></tr>') +
            '</tbody></table></div>';
        return '<section class="settle-card settle-ledger">' + tabHtml + filters + totals + table + '</section>';
    }

    function billRows() {
        var s = currentSupplier();
        return BILLS.filter(function (b) {
            if (b.supplier !== s.name) return false;
            if (state.query && String(b.id).indexOf(state.query) < 0) return false;
            if (state.status && b.status !== state.status) return false;
            return true;
        });
    }
    function renderBills() {
        if (state.detail) return renderBillDetail(state.detail);
        var rows = billRows();
        var filters = '<div class="settle-card-body"><div class="settle-filter">' +
            '<label class="settle-field"><span>结款单号</span><input class="settle-input" id="sp-query" value="' +
            h(state.query) + '" placeholder="请输入结款单号"></label>' +
            '<label class="settle-field"><span>结款状态</span><select class="settle-select" id="sp-status">' +
            '<option value="">全部</option>' +
            ['待结款', '结款中', '部分结款', '已结款', '结款失败'].map(function (v) {
                return '<option value="' + h(v) + '"' + (state.status === v ? ' selected' : '') + '>' + h(mapStatus(v)) + '</option>';
            }).join('') + '</select></label>' +
            '<div class="settle-actions">' + button('查询', 'search', '', 'primary') + button('重置', 'reset', '', '') +
            '</div></div></div>';
        var tr = rows.map(function (b, i) {
            return '<tr><td>' + (i + 1) + '</td><td>' + button(b.id, 'bill-detail', b.id) + '</td>' +
                '<td class="money">' + cash(b.goods) + '</td><td class="money">' + cash(b.deduct) + '</td>' +
                '<td class="money">' + cash(b.net) + '</td><td>' + h(b.orders) + '</td>' +
                '<td>' + tag(b.status) + '</td><td>' + h(b.created) + '</td><td>' + h(b.cycle) + '</td>' +
                '<td>' + h(b.posted || '—') + '</td><td>' + button('查看详情', 'bill-detail', b.id) + '</td></tr>';
        }).join('');
        var table = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            ['序号', '结款单号', '采购款合计', '扣减合计', '结款净额', '订单数', '结款状态', '创建时间', '结算周期', '入账时间', '操作']
                .map(function (x) { return '<th>' + h(x) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + (tr || '<tr><td colspan="11" class="settle-empty">暂无结款单</td></tr>') +
            '</tbody></table></div>';
        return '<section class="settle-card">' + filters + table +
            '<div class="settle-table-footer">共 ' + rows.length + ' 条（只读）</div></section>';
    }
    function renderBillDetail(id) {
        var s = currentSupplier();
        var b = BILLS.filter(function (x) { return x.id === id; })[0];
        var back = '<div class="settle-back">' + button('← 返回列表', 'back-bills', '', '') + '</div>';
        if (!b || b.supplier !== s.name) {
            return back + '<div class="settle-note">未找到结款单，或无权查看该单据：' + h(id) + '</div>';
        }
        var lines = LEDGER.filter(function (r) { return r.related === id && r.supplier === s.name; });
        if (!lines.length) {
            lines = LEDGER.filter(function (r) { return r.supplier === s.name; }).slice(0, 2).map(function (r, i) {
                return Object.assign({}, r, { related: id, settleAmount: i === 0 ? b.net : '—' });
            });
        }
        var basic = '<div class="settle-description">' +
            desc('结款单号', h(b.id)) + desc('供应商名称', h(b.supplier)) +
            desc('采购款合计', cash(b.goods)) + desc('扣减合计', cash(b.deduct)) +
            desc('结款净额', cash(b.net)) + desc('结款状态', tag(b.status)) +
            desc('收款账户名称', h(s.accountName)) + desc('收款账户', h(s.accountNo)) +
            desc('创建时间', h(b.created)) + desc('结算周期', h(b.cycle)) +
            desc('入账时间', h(b.posted || '—')) + desc('订单数', h(b.orders)) +
            '</div>';
        var lineTr = lines.map(function (r) {
            return '<tr><td>' + h(r.orderNo) + '</td><td>' + h(r.product) + '</td><td>' + h(r.qty) + '</td>' +
                '<td class="money">' + cash(r.goods) + '</td><td class="money">' + cash(r.deduct) + '</td>' +
                '<td class="money">' + cash(r.net) + '</td><td title="' + h(r.flowNo) + '">' + h(r.flowNo) + '</td></tr>';
        }).join('');
        var lineTable = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            '<th>订单号</th><th>商品</th><th>数量</th><th>采购款</th><th>扣减</th><th>净额</th><th>通道流水号</th></tr></thead><tbody>' +
            lineTr + '</tbody></table></div>';
        var payStatus = b.status === '已结款' || b.status === '部分结款' ? '已到账' : (b.status === '结款中' ? '处理中' : '待出账');
        var payFlow = (lines[0] && lines[0].flowNo && lines[0].flowNo !== '—') ? lines[0].flowNo : '—';
        var payTable = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            '<th>方向</th><th>付款方</th><th>收款方</th><th>金额</th><th>状态</th><th>通道流水号</th><th>时间</th></tr></thead><tbody>' +
            '<tr><td>收款</td><td>平台</td><td>' + h(b.supplier) + '</td><td class="money">' + cash(b.net) +
            '</td><td>' + tag(payStatus) + '</td><td>' + h(payFlow) + '</td><td>' +
            h(b.posted || b.created) + '</td></tr></tbody></table></div>';
        return back + '<div class="settle-detail-header"><h2>结款单详情</h2></div>' +
            card('基础信息', basic) + card('订单明细', lineTable) + card('收付款记录', payTable);
    }
    function desc(k, v) {
        return '<div class="settle-description-item"><span>' + h(k) + '</span><strong>' + v + '</strong></div>';
    }

    function render() {
        setUrl();
        var title = document.getElementById('sp-title');
        if (title) title.textContent = titleText();
        var app = document.getElementById('sp-app');
        if (!app) return;
        if (state.view === 'orders') app.innerHTML = renderOrders();
        else if (state.view === 'ledger') app.innerHTML = renderLedger();
        else if (state.view === 'bills') app.innerHTML = renderBills();
        else app.innerHTML = renderAccount();
    }

    function readFilters() {
        state.query = (document.getElementById('sp-query') || {}).value || '';
        state.status = (document.getElementById('sp-status') || {}).value || '';
        state.orderStatus = (document.getElementById('sp-order-status') || {}).value || '';
    }

    document.addEventListener('click', function (e) {
        var t = e.target.closest('[data-act]');
        if (!t) return;
        var act = t.getAttribute('data-act');
        var id = t.getAttribute('data-id') || '';
        if (act === 'noop') return;
        if (act === 'goto-orders') {
            state.view = 'orders'; state.orderDetail = ''; state.detail = '';
            location.search = '?view=orders&supplier=' + encodeURIComponent(state.supplierId);
            return;
        }
        if (act === 'goto-ledger') {
            state.view = 'ledger'; state.detail = ''; state.orderDetail = ''; state.ledgerTab = 'pending';
            location.search = '?view=ledger&tab=pending&supplier=' + encodeURIComponent(state.supplierId);
            return;
        }
        if (act === 'goto-bills' || act === 'goto-bills-transit') {
            state.view = 'bills'; state.detail = ''; state.orderDetail = '';
            location.search = '?view=bills&supplier=' + encodeURIComponent(state.supplierId);
            return;
        }
        if (act === 'ledger-tab') { state.ledgerTab = id; render(); return; }
        if (act === 'order-tab') { state.orderTab = id; state.orderDetail = ''; render(); return; }
        if (act === 'search') { readFilters(); render(); return; }
        if (act === 'reset') { state.query = ''; state.status = ''; render(); return; }
        if (act === 'reset-orders') {
            state.query = ''; state.status = ''; state.orderStatus = '';
            render();
            return;
        }
        if (act === 'order-detail') {
            state.view = 'orders'; state.orderDetail = id; state.detail = '';
            render();
            return;
        }
        if (act === 'back-orders') {
            state.orderDetail = '';
            render();
            return;
        }
        if (act === 'bill-detail') {
            state.view = 'bills'; state.detail = id; state.orderDetail = '';
            render();
            return;
        }
        if (act === 'back-bills') {
            state.detail = '';
            render();
            return;
        }
    });
    render();
})();
