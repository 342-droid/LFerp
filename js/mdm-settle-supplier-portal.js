/* 供应商角色结算门户：账户总览 / 清分台账 / 结款单。与平台结算中心数据同源口径、页面独立。 */
(function () {
    var SUPPLIERS = [
        {
            id: 'sup-ss',
            name: '斯斯供应商商家',
            code: '330159456409100288',
            accountName: '小牛供应链有限公司',
            accountNo: '6666000218008801',
            total: '12860.35',
            balance: '3260.18',
            withdrawable: '2980.00',
            inTransit: '280.18',
            pendingSettle: '0.50',
            monthSettled: '1.24',
            cumulativeSettled: '9860.17'
        },
        {
            id: 'sup-mq',
            name: '南京马群枢纽供应商',
            code: '319838916817453056',
            accountName: '南京冷链物流服务有限公司',
            accountNo: '6666000219001108',
            total: '48620.00',
            balance: '12580.40',
            withdrawable: '11000.00',
            inTransit: '1580.40',
            pendingSettle: '128.60',
            monthSettled: '266.80',
            cumulativeSettled: '36039.60'
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
        { time: '2026-10-31 09:21:05', type: '结款入账', billId: 'ST_351310165011607552', amount: '1.50', status: '成功', supplier: '南京马群枢纽供应商' },
        { time: '2026-09-06 15:07:00', type: '结款入账', billId: 'ST_353846837167284224', amount: '0.02', status: '成功', supplier: '斯斯供应商商家' },
        { time: '2026-08-16 10:02:11', type: '结款入账', billId: 'ST_2088198765544431618', amount: '0.24', status: '成功', supplier: '斯斯供应商商家' },
        { time: '2026-08-10 18:30:00', type: '在途', billId: 'ST_2086759712106688514', amount: '0.64', status: '处理中', supplier: '斯斯供应商商家' },
        { time: '2026-09-14 00:05:00', type: '在途', billId: 'ST_357556279620669440', amount: '0.01', status: '待出账', supplier: '斯斯供应商商家' },
        { time: '2026-09-17 00:10:00', type: '在途', billId: 'ST_358643443066482688', amount: '0.02', status: '待出账', supplier: '南京马群枢纽供应商' }
    ];

    var params = new URLSearchParams(window.location.search);
    var state = {
        view: params.get('view') || 'account',
        detail: params.get('detail') || '',
        supplierId: params.get('supplier') || localStorage.getItem('spSettleSupplierId') || 'sup-ss',
        ledgerTab: params.get('tab') || 'all',
        query: '',
        status: ''
    };
    if (!['account', 'ledger', 'bills'].includes(state.view)) state.view = 'account';

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
        if (state.view === 'bills' && state.detail) p.set('detail', state.detail);
        history.replaceState(null, '', location.pathname + '?' + p.toString());
        localStorage.setItem('spSettleSupplierId', state.supplierId);
    }
    function titleText() {
        var base = '结算 / 供应商结算 / ';
        if (state.view === 'ledger') return base + '清分台账';
        if (state.view === 'bills') return base + (state.detail ? '结款单详情' : '结款单');
        return base + '账户总览';
    }
    /* 组织切换在版头一级页签右侧；本页不再重复供应商下拉。 */
    function renderAccount() {
        var s = currentSupplier();
        var flows = FLOWS.filter(function (f) { return f.supplier === s.name; }).slice(0, 8);
        var metrics =
            '<div class="sp-metric-grid">' +
            metric('账户总额', s.total, '累计资产口径（演示）', 'noop') +
            metric('账户余额', s.balance, '汇付基本户余额', 'noop') +
            metric('可提现', s.withdrawable, '当前可提现金额', 'noop') +
            metric('在途资金', s.inTransit, '已发起结款尚未入账', 'goto-bills-transit') +
            '</div>';
        var subs =
            '<div class="sp-sub-metrics">' +
            subMetric('待结算金额', s.pendingSettle) +
            subMetric('本月已结款', s.monthSettled) +
            subMetric('累计已结款', s.cumulativeSettled) +
            '</div>';
        var acctBar =
            '<div class="sp-account-bar">' +
            '<span>供应商名称 <b>' + h(s.name) + '</b></span>' +
            '<span>收款账户名称 <b>' + h(s.accountName) + '</b></span>' +
            '<span>收款账户 <b>' + h(s.accountNo) + '</b></span>' +
            '</div>';
        var flowRows = flows.map(function (f) {
            return '<tr><td>' + h(f.time) + '</td><td>' + h(f.type) + '</td><td>' +
                button(f.billId, 'bill-detail', f.billId) + '</td><td class="money">' + cash(f.amount) +
                '</td><td>' + tag(f.status) + '</td></tr>';
        }).join('');
        var flowTable = '<div class="settle-table-wrap"><table class="settle-table"><thead><tr>' +
            '<th>时间</th><th>类型</th><th>关联结款单</th><th>金额</th><th>状态</th></tr></thead><tbody>' +
            (flowRows || '<tr><td colspan="5" class="settle-empty">暂无动态</td></tr>') +
            '</tbody></table></div>';
        return '<div class="sp-toolbar">' +
            '<div class="settle-actions">' + button('查看清分台账', 'goto-ledger', '', '') +
            button('查看结款单', 'goto-bills', '', 'primary') + '</div></div>' +
            acctBar + metrics + subs + card('近期资金动态', flowTable);
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
        if (state.view === 'ledger') app.innerHTML = renderLedger();
        else if (state.view === 'bills') app.innerHTML = renderBills();
        else app.innerHTML = renderAccount();
    }

    function readFilters() {
        state.query = (document.getElementById('sp-query') || {}).value || '';
        state.status = (document.getElementById('sp-status') || {}).value || '';
    }

    document.addEventListener('click', function (e) {
        var t = e.target.closest('[data-act]');
        if (!t) return;
        var act = t.getAttribute('data-act');
        var id = t.getAttribute('data-id') || '';
        if (act === 'noop') return;
        if (act === 'goto-ledger') {
            state.view = 'ledger'; state.detail = ''; state.ledgerTab = 'pending';
            /* 切视图后刷新侧栏高亮 */
            location.search = '?view=ledger&tab=pending&supplier=' + encodeURIComponent(state.supplierId);
            return;
        }
        if (act === 'goto-bills' || act === 'goto-bills-transit') {
            state.view = 'bills'; state.detail = '';
            location.search = '?view=bills&supplier=' + encodeURIComponent(state.supplierId);
            return;
        }
        if (act === 'ledger-tab') { state.ledgerTab = id; render(); return; }
        if (act === 'search') { readFilters(); render(); return; }
        if (act === 'reset') { state.query = ''; state.status = ''; render(); return; }
        if (act === 'bill-detail') {
            state.view = 'bills'; state.detail = id;
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
