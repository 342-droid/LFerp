/**
 * 订单 × 售后验收：生成各状态组合演示单，并用开关筛选。
 * 门店 APP / 用户 APP 各写各的存储，不改现有列表/详情布局。
 */
(function (global) {
  var USER_DEMO_KEY = 'ua_order_as_demo_v1';
  var AS_PREFIX = 'as-mx-';
  var ORDER_PREFIX_STORE = 'SA20260921';
  var ORDER_PREFIX_USER = 'UA20260921';

  var ORDER_OPTIONS_STORE = [
    { id: 'all', label: '全部' },
    { id: 'unpaid', label: '待付款' },
    { id: 'pending_accept', label: '待接单' },
    { id: 'shipping', label: '待发货' },
    { id: 'receipt', label: '待收货' },
    { id: 'completed', label: '已完成' },
    { id: 'closed', label: '已关闭' }
  ];

  var ORDER_OPTIONS_USER = [
    { id: 'all', label: '全部' },
    { id: 'unpaid', label: '待付款' },
    { id: 'shipping', label: '待发货' },
    { id: 'pickup', label: '待自提' },
    { id: 'receiving', label: '待收货' },
    { id: 'completed', label: '已完成' },
    { id: 'closed', label: '已关闭' }
  ];

  var AFTERSALE_OPTIONS = [
    { id: 'all', label: '全部' },
    { id: 'none', label: '无售后' },
    { id: 'refund_audit', label: '退款待审核' },
    { id: 'refunding', label: '退款中' },
    { id: 'refund_success', label: '退款成功' },
    { id: 'refund_closed', label: '退款关闭' },
    { id: 'return_ing', label: '退货中' },
    { id: 'restock_ing', label: '补货中' },
    { id: 'restock_success', label: '补货完成' },
    { id: 'exchange_ing', label: '换货中' },
    { id: 'exchange_success', label: '换货完成' }
  ];

  var AS_LABEL = {
    none: '',
    refund_audit: '退款待审核',
    refunding: '退款中',
    refund_success: '退款成功',
    refund_closed: '退款关闭',
    return_ing: '退货中',
    restock_ing: '补货中',
    restock_success: '补货完成',
    exchange_ing: '换货中',
    exchange_success: '换货完成'
  };

  function isStoreApp() {
    return !!(global.LfAppShell && typeof global.LfAppShell.isStoreApp === 'function' && global.LfAppShell.isStoreApp());
  }

  function scopedKey(key) {
    if (global.UaOrdersStore && typeof global.UaOrdersStore.scopedKey === 'function') {
      return global.UaOrdersStore.scopedKey(key);
    }
    if (!isStoreApp()) return key;
    return String(key).indexOf('ua_') === 0 ? 'sa_' + String(key).slice(3) : 'sa_' + key;
  }

  function demoKey() {
    return scopedKey(USER_DEMO_KEY);
  }

  function aftersaleKey() {
    if (global.UaOrdersStore && global.UaOrdersStore.AFTERSALE_RECORDS_KEY) {
      return global.UaOrdersStore.AFTERSALE_RECORDS_KEY;
    }
    return scopedKey('ua_aftersale_records_v4');
  }

  function asset(file) {
    if (global.LfAppShell && typeof global.LfAppShell.userAppAsset === 'function') {
      return global.LfAppShell.userAppAsset(file);
    }
    return isStoreApp() ? '../../user-app/assets/' + file : '../assets/' + file;
  }

  function defaultFilter() {
    return { order: 'all', aftersale: 'all' };
  }

  function readFilter() {
    try {
      var raw = global.localStorage.getItem(demoKey());
      var obj = raw ? JSON.parse(raw) : null;
      if (obj && obj.order && obj.aftersale) return { order: obj.order, aftersale: obj.aftersale };
    } catch (e) {
      /* ignore */
    }
    return defaultFilter();
  }

  function writeFilter(next) {
    try {
      global.localStorage.setItem(demoKey(), JSON.stringify(next || defaultFilter()));
    } catch (e) {
      /* ignore */
    }
  }

  function itemsCherry() {
    return [
      {
        name: '冷丰优选智利车厘子 鲜脆清甜 礼盒装',
        spec: '2.5kg',
        qty: 1,
        price: 59.9,
        img: asset('order-product-1.svg'),
        tempLayer: '冷藏'
      }
    ];
  }

  function itemsMix() {
    return [
      {
        name: '新鲜红颜草莓 香甜多汁 500g装',
        spec: '500g',
        qty: 2,
        price: 18,
        img: asset('order-product-2.svg'),
        tempLayer: '冷藏'
      },
      {
        name: '海南贵妃芒 香甜软糯 礼盒装',
        spec: '2.5kg',
        qty: 1,
        price: 39.9,
        img: asset('order-product-3.svg'),
        tempLayer: '常温'
      }
    ];
  }

  function moneyOf(items) {
    return (items || []).reduce(function (sum, it) {
      return sum + (Number(it.price) || 0) * (Number(it.qty) || 0);
    }, 0);
  }

  function asSpec(type, stage, filter) {
    return { type: type, stage: stage, filter: filter, label: AS_LABEL[filter] || '' };
  }

  function storeRows() {
    return [
      { id: '01', status: 'unpaid', as: asSpec('', '', 'none'), fulfill: 'express', shop: '冷丰优选供应链' },
      { id: '02', status: 'pending_accept', as: asSpec('', '', 'none'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '03', status: 'pending_accept', as: asSpec('pre_ship', 'audit', 'refund_audit'), fulfill: 'express', shop: '华东冷链供应商' },
      { id: '04', status: 'shipping', as: asSpec('', '', 'none'), fulfill: 'express', shop: '华东冷链供应商' },
      { id: '05', status: 'shipping', as: asSpec('pre_ship', 'refund', 'refunding'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '06', status: 'receipt', as: asSpec('', '', 'none'), fulfill: 'delivery', shop: 'W002 嘉兴仓', items: 'mix' },
      { id: '07', status: 'receipt', as: asSpec('refund_only', 'audit', 'refund_audit'), fulfill: 'express', shop: '冷丰优选供应链' },
      { id: '08', status: 'receipt', as: asSpec('return', 'return', 'return_ing'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '09', status: 'receipt', as: asSpec('restock', 'reship', 'restock_ing'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '10', status: 'receipt', as: asSpec('exchange', 'audit', 'exchange_ing'), fulfill: 'express', shop: '华东冷链供应商' },
      { id: '11', status: 'completed', as: asSpec('', '', 'none'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '12', status: 'completed', as: asSpec('refund_only', 'success', 'refund_success'), fulfill: 'express', shop: '冷丰优选供应链' },
      { id: '13', status: 'completed', as: asSpec('return', 'closed', 'refund_closed'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '14', status: 'completed', as: asSpec('restock', 'success', 'restock_success'), fulfill: 'delivery', shop: 'W002 嘉兴仓' },
      { id: '15', status: 'completed', as: asSpec('exchange', 'success', 'exchange_success'), fulfill: 'express', shop: '华东冷链供应商' },
      { id: '16', status: 'closed', as: asSpec('', '', 'none'), fulfill: 'express', shop: '冷丰优选供应链', closedReason: 'cancel' },
      { id: '17', status: 'closed', as: asSpec('refund_only', 'success', 'refund_success'), fulfill: 'delivery', shop: 'W002 嘉兴仓', closedReason: 'refund' }
    ];
  }

  function userRows() {
    return [
      { id: '01', status: 'unpaid', as: asSpec('', '', 'none'), fulfill: 'express', shop: '鲜丰蔬菜批发' },
      { id: '02', status: 'shipping', as: asSpec('', '', 'none'), fulfill: 'express', shop: '冷丰优选供应链' },
      { id: '03', status: 'shipping', as: asSpec('pre_ship', 'audit', 'refund_audit'), fulfill: 'express', shop: '江南果蔬批发' },
      { id: '04', status: 'pickup', as: asSpec('', '', 'none'), fulfill: 'pickup', shop: '悠悠生鲜超市', items: 'mix' },
      { id: '05', status: 'pickup', as: asSpec('refund_only', 'audit', 'refund_audit'), fulfill: 'pickup', shop: '悠悠生鲜超市' },
      { id: '06', status: 'pickup', as: asSpec('return', 'return', 'return_ing'), fulfill: 'pickup', shop: '悠悠生鲜超市' },
      { id: '07', status: 'receipt', as: asSpec('', '', 'none'), fulfill: 'express', shop: '鲜丰蔬菜批发', listStatus: 'receiving' },
      { id: '08', status: 'receipt', as: asSpec('refund_only', 'refund', 'refunding'), fulfill: 'express', shop: '江南果蔬批发', listStatus: 'receiving' },
      { id: '09', status: 'receipt', as: asSpec('restock', 'reship', 'restock_ing'), fulfill: 'express', shop: '冷丰优选供应链', listStatus: 'receiving' },
      { id: '10', status: 'receipt', as: asSpec('exchange', 'audit', 'exchange_ing'), fulfill: 'express', shop: '华东冷链供应商', listStatus: 'receiving' },
      { id: '11', status: 'completed', as: asSpec('', '', 'none'), fulfill: 'pickup', shop: '悠悠生鲜超市' },
      { id: '12', status: 'completed', as: asSpec('refund_only', 'success', 'refund_success'), fulfill: 'express', shop: '冷丰优选供应链' },
      { id: '13', status: 'completed', as: asSpec('return', 'closed', 'refund_closed'), fulfill: 'pickup', shop: '悠悠生鲜超市' },
      { id: '14', status: 'completed', as: asSpec('restock', 'success', 'restock_success'), fulfill: 'express', shop: '江南果蔬批发' },
      { id: '15', status: 'completed', as: asSpec('exchange', 'success', 'exchange_success'), fulfill: 'pickup', shop: '悠悠生鲜超市' },
      { id: '16', status: 'closed', as: asSpec('', '', 'none'), fulfill: 'express', shop: '鲜丰蔬菜批发', closedReason: 'timeout' },
      { id: '17', status: 'closed', as: asSpec('refund_only', 'success', 'refund_success'), fulfill: 'pickup', shop: '悠悠生鲜超市', closedReason: 'refund' }
    ];
  }

  function rowMatches(row, filter) {
    if (!filter) return true;
    if (filter.order && filter.order !== 'all') {
      var listStatus = row.listStatus || row.status;
      if (filter.order === 'receipt') {
        if (row.status !== 'receipt' && listStatus !== 'review' && listStatus !== 'receiving') return false;
      } else if (filter.order === 'receiving') {
        if (listStatus !== 'receiving' && row.status !== 'receipt') return false;
      } else if (listStatus !== filter.order && row.status !== filter.order) {
        return false;
      }
    }
    if (filter.aftersale && filter.aftersale !== 'all') {
      if ((row.as && row.as.filter) !== filter.aftersale) return false;
    }
    return true;
  }

  function buildOrder(row, storeSide) {
    var items = row.items === 'mix' ? itemsMix() : itemsCherry();
    var total = Math.round(moneyOf(items) * 100) / 100;
    var orderNo = (storeSide ? ORDER_PREFIX_STORE : ORDER_PREFIX_USER) + row.id;
    var delivery = row.fulfill === 'delivery';
    var pickup = row.fulfill === 'pickup';
    var paid = row.status !== 'unpaid';
    return {
      orderNo: orderNo,
      status: row.status,
      createdAt: '2026-09-21 10:' + row.id + ':08',
      paidAt: paid ? '2026-09-21 10:' + row.id + ':36' : '',
      closedReason: row.closedReason || '',
      goodsTotal: total,
      freight: delivery ? 12.5 : 0,
      payable: total,
      payLabel: '¥' + total.toFixed(2),
      payMethod: paid ? '微信支付' : '',
      from: storeSide ? 'restock.html' : '',
      fulfillType: storeSide ? row.fulfill : '',
      splitKind: storeSide ? row.fulfill : '',
      warehouse: delivery ? row.shop : '',
      supplierName: delivery ? '' : row.shop,
      items: items,
      store: pickup ? { name: row.shop } : null,
      matrixDemo: true,
      asType: (row.as && row.as.type) || '',
      asStage: (row.as && row.as.stage) || '',
      asFilter: (row.as && row.as.filter) || 'none',
      asLabel: (row.as && row.as.label) || ''
    };
  }

  function buildAftersale(row, order) {
    if (!row.as || !row.as.type) return null;
    var item = (order.items || [])[0] || {};
    var finished = row.as.stage === 'success' || row.as.stage === 'closed' || row.as.stage === 'failed';
    return {
      id: AS_PREFIX + order.orderNo,
      orderNo: order.orderNo,
      itemIndex: 0,
      type: row.as.type,
      stage: row.as.stage,
      closeReason: row.as.stage === 'closed' ? 'cancel' : '',
      qty: Number(item.qty) || 1,
      amount: row.as.type === 'restock' || row.as.type === 'exchange' ? 0 : Number(order.payable) || 0,
      reason: row.as.type === 'restock' ? '包裹少件/漏发' : '质量问题',
      productName: item.name || '',
      productSpec: item.spec || '',
      productImg: item.img || '',
      shopName: order.warehouse || order.supplierName || '',
      applyTime: '2026-09-21 11:' + String(order.orderNo).slice(-2) + ':00',
      resultTime: finished ? '2026-09-21 16:30:00' : '',
      delivery:
        row.fulfill === 'delivery' ? 'warehouse' : row.fulfill === 'pickup' ? 'pickup' : 'store',
      matrixDemo: true
    };
  }

  function readAftersaleList() {
    try {
      var raw = global.sessionStorage.getItem(aftersaleKey());
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeAftersaleList(list) {
    try {
      global.sessionStorage.setItem(aftersaleKey(), JSON.stringify(list || []));
    } catch (e) {
      /* ignore */
    }
  }

  function removeMatrixOrders() {
    if (!global.UaOrdersStore || !global.UaOrdersStore.list || !global.UaOrdersStore.upsert) return;
    var kept = (global.UaOrdersStore.list() || []).filter(function (order) {
      return !order || !order.matrixDemo;
    });
    try {
      global.sessionStorage.setItem(global.UaOrdersStore.STORAGE_KEY, JSON.stringify(kept));
    } catch (e) {
      /* ignore */
    }
  }

  function applySeed(filter) {
    filter = filter || readFilter();
    var storeSide = isStoreApp();
    var rows = (storeSide ? storeRows() : userRows()).filter(function (row) {
      return rowMatches(row, filter);
    });
    removeMatrixOrders();
    var asKept = readAftersaleList().filter(function (rec) {
      return !rec || String(rec.id || '').indexOf(AS_PREFIX) !== 0;
    });
    if (!storeSide && !asKept.some(function (rec) { return rec && String(rec.id || '').indexOf('as-demo-') === 0; })) {
      asKept = asKept.concat([
        { id: 'as-demo-refund-closed-0', orderNo: '1089765423471123', itemIndex: 0, type: 'refund_only', stage: 'closed', closeReason: 'cancel', amount: 28.4, reason: '不想要了', applyTime: '2026-07-17 09:20:00' },
        { id: 'as-demo-refund-0', orderNo: '1089765423471123', itemIndex: 0, type: 'refund_only', stage: 'success', qty: 1, amount: 28.4, reason: '收到商品破损/污渍等', applyTime: '2026-07-18 10:20:00' },
        { id: 'as-demo-restock-0', orderNo: '1089765423471123', itemIndex: 0, type: 'restock', stage: 'reship', amount: 0, reason: '包裹少件/漏发', applyTime: '2026-07-18 11:05:00' },
        { id: 'as-demo-closed-1', orderNo: '1089765423471123', itemIndex: 1, type: 'return', stage: 'closed', closeReason: 'cancel', amount: 10, reason: '不喜欢/不想要', applyTime: '2026-07-17 16:40:00' }
      ]);
    }
    var seeded = [];
    rows.forEach(function (row) {
      if (!global.UaOrdersStore || !global.UaOrdersStore.upsert) return;
      var order = global.UaOrdersStore.upsert(buildOrder(row, storeSide));
      seeded.push(order);
      var rec = buildAftersale(row, order);
      if (rec) asKept.unshift(rec);
    });
    writeAftersaleList(asKept);
    return seeded;
  }

  function listMatrixOrders() {
    if (!global.UaOrdersStore || !global.UaOrdersStore.list) return [];
    return (global.UaOrdersStore.list() || []).filter(function (order) {
      return order && order.matrixDemo;
    });
  }

  function ensureSeed() {
    var existing = listMatrixOrders();
    if (existing.length) return existing;
    return applySeed(readFilter());
  }

  function orderOptions() {
    return isStoreApp() ? ORDER_OPTIONS_STORE : ORDER_OPTIONS_USER;
  }

  function listHref() {
    if (isStoreApp()) {
      return global.LfAppShell && global.LfAppShell.restockOrdersHref
        ? global.LfAppShell.restockOrdersHref()
        : 'restock-orders.html';
    }
    return /\/store-app\//i.test((global.location && global.location.pathname) || '')
      ? '../../user-app/h5/orders.html'
      : 'orders.html';
  }

  function shouldMount() {
    var path = (global.location && global.location.pathname) || '';
    return /restock-orders\.html|restock-order-detail\.html|restock-refund-detail\.html|restock-aftersale-list\.html|\/orders\.html|order-detail\.html|order-detail-pickup\.html|order-aftersale-list\.html/i.test(
      path
    );
  }

  function isDetailOrAsList() {
    var path = (global.location && global.location.pathname) || '';
    return /order-detail|refund-detail|aftersale-list/i.test(path);
  }

  function ensureStyle() {
    if (document.getElementById('uaOrderAsDemoStyle')) return;
    var style = document.createElement('style');
    style.id = 'uaOrderAsDemoStyle';
    style.textContent =
      '.ua-rg-demo.ua-order-as-demo{position:fixed;right:8px;bottom:72px;z-index:2300;width:178px;padding:10px;background:rgba(255,255,255,.96);border:1px solid #eee;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);font-size:11px;color:#333;pointer-events:auto;}' +
      '.ua-order-as-demo--left{right:auto;left:8px;bottom:168px;}' +
      '.ua-order-as-demo .ua-rg-demo__title{font-weight:600;margin-bottom:8px;font-size:12px;}' +
      '.ua-order-as-demo .ua-rg-demo__row{display:flex;align-items:center;gap:6px;margin-bottom:6px;line-height:1.3;}' +
      '.ua-order-as-demo .ua-rg-demo__row select{margin-left:auto;max-width:92px;font-size:11px;}' +
      '.ua-order-as-demo .ua-rg-demo__apply{width:100%;margin-top:4px;height:28px;border:none;border-radius:6px;background:#ff7019;color:#fff;font-size:11px;cursor:pointer;}';
    document.head.appendChild(style);
  }

  function optionHtml(list, cur) {
    return list
      .map(function (it) {
        return (
          '<option value="' +
          it.id +
          '"' +
          (it.id === cur ? ' selected' : '') +
          '>' +
          it.label +
          '</option>'
        );
      })
      .join('');
  }

  function mountPanel() {
    if (document.getElementById('uaOrderAsDemo')) return;
    ensureStyle();
    var filter = readFilter();
    var panel = document.createElement('div');
    panel.id = 'uaOrderAsDemo';
    panel.className = 'ua-rg-demo ua-order-as-demo' + (isDetailOrAsList() ? ' ua-order-as-demo--left' : '');
    panel.innerHTML =
      '<div class="ua-rg-demo__title">订单售后验收开关</div>' +
      '<label class="ua-rg-demo__row">订单状态<select id="uaOrderAsDemoOrder">' +
      optionHtml(orderOptions(), filter.order) +
      '</select></label>' +
      '<label class="ua-rg-demo__row">售后状态<select id="uaOrderAsDemoAs">' +
      optionHtml(AFTERSALE_OPTIONS, filter.aftersale) +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaOrderAsDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaOrderAsDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var orderEl = document.getElementById('uaOrderAsDemoOrder');
      var asEl = document.getElementById('uaOrderAsDemoAs');
      var next = {
        order: orderEl ? orderEl.value : 'all',
        aftersale: asEl ? asEl.value : 'all'
      };
      writeFilter(next);
      applySeed(next);
      global.location.href = listHref();
    });
  }

  function hideStaticCardsIfFiltered() {
    var filter = readFilter();
    if (filter.order === 'all' && filter.aftersale === 'all') return;
    document.querySelectorAll('.ua-order-card:not([data-matrix-demo="1"])').forEach(function (card) {
      if (filter.aftersale !== 'all' && filter.aftersale !== 'none') {
        card.hidden = true;
        return;
      }
      if (filter.order === 'all') return;
      var st = card.getAttribute('data-status') || '';
      var detail = card.getAttribute('data-detail-status') || '';
      var match =
        st === filter.order ||
        detail === filter.order ||
        (filter.order === 'receipt' && (st === 'review' || st === 'receiving' || detail === 'receipt')) ||
        (filter.order === 'receiving' && (st === 'receiving' || detail === 'receipt')) ||
        (filter.order === 'closed' && st.indexOf('closed') === 0);
      if (!match) card.hidden = true;
    });
    var emptyEl = document.getElementById('ordersEmpty');
    var endEl = document.querySelector('.ua-orders-end');
    var visible = document.querySelectorAll('.ua-order-card[data-status]:not([hidden])').length;
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (endEl) endEl.hidden = visible === 0;
  }

  function boot() {
    if (!shouldMount()) return;
    ensureSeed();
    if (document.body) {
      mountPanel();
      hideStaticCardsIfFiltered();
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        mountPanel();
        hideStaticCardsIfFiltered();
      });
    }
  }

  global.UaOrderMatrixDemo = {
    ensureSeed: ensureSeed,
    applySeed: applySeed,
    getFilter: readFilter,
    hideStaticCardsIfFiltered: hideStaticCardsIfFiltered,
    AS_LABEL: AS_LABEL
  };

  boot();
})(typeof window !== 'undefined' ? window : this);
