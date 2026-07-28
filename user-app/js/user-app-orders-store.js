/**
 * 用户 APP — 演示订单存储（确认下单后写入待支付，支付后改状态）
 */
(function (global) {
  var STORAGE_KEY = 'ua_demo_orders_v1';
  var LAST_KEY = 'ua_last_order_v1';
  var LAST_ITEMS_KEY = 'ua_last_order_items_v1';

  function readAll() {
    try {
      var raw = global.sessionStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    } catch (e) { /* ignore */ }
  }

  function genOrderNo() {
    var t = Date.now().toString();
    return t.slice(-10) + String(Math.floor(Math.random() * 900) + 100);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowText() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function normalizeOrder(order) {
    order = order || {};
    return {
      orderNo: String(order.orderNo || ''),
      status: order.status || 'unpaid',
      createdAt: order.createdAt || nowText(),
      paidAt: order.paidAt || '',
      closedReason: order.closedReason || '',
      exchangePoints: Number(order.exchangePoints) || 0,
      deductPoints: Number(order.deductPoints) || 0,
      deductAmount: Number(order.deductAmount) || 0,
      goodsTotal: Number(order.goodsTotal) || 0,
      freight: Number(order.freight) || 0,
      payable: Number(order.payable) || 0,
      payLabel: order.payLabel || '',
      items: Array.isArray(order.items) ? order.items : []
    };
  }

  function upsert(order) {
    var next = normalizeOrder(order);
    if (!next.orderNo) next.orderNo = genOrderNo();
    var list = readAll().filter(function (o) {
      return o.orderNo !== next.orderNo;
    });
    list.unshift(next);
    writeAll(list.slice(0, 30));
    try {
      global.sessionStorage.setItem(LAST_KEY, JSON.stringify(next));
      global.sessionStorage.setItem(
        LAST_ITEMS_KEY,
        JSON.stringify(
          next.items.map(function (it) {
            return {
              id: it.id,
              name: it.name,
              isPointsExchange: !!it.isPointsExchange,
              pointsCode: it.pointsCode || '',
              points: Number(it.points) || 0,
              money: Number(it.money) || 0,
              qty: it.qty
            };
          })
        )
      );
    } catch (e) { /* ignore */ }
    return next;
  }

  function getByNo(orderNo) {
    var no = String(orderNo || '');
    if (!no) return null;
    var list = readAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].orderNo === no) return normalizeOrder(list[i]);
    }
    try {
      var raw = global.sessionStorage.getItem(LAST_KEY);
      if (!raw) return null;
      var last = JSON.parse(raw);
      if (last && last.orderNo === no) return normalizeOrder(last);
    } catch (e) { /* ignore */ }
    return null;
  }

  function getLatest() {
    var list = readAll();
    if (list.length) return normalizeOrder(list[0]);
    try {
      var raw = global.sessionStorage.getItem(LAST_KEY);
      return raw ? normalizeOrder(JSON.parse(raw)) : null;
    } catch (e) {
      return null;
    }
  }

  function updateStatus(orderNo, status, extra) {
    var order = getByNo(orderNo);
    if (!order) return null;
    order.status = status;
    if (extra && typeof extra === 'object') {
      Object.keys(extra).forEach(function (k) {
        order[k] = extra[k];
      });
    }
    if (status === 'shipping' && !order.paidAt) order.paidAt = nowText();
    return upsert(order);
  }

  function buildDetailHref(order) {
    if (!order) return 'orders.html';
    var qs = ['status=' + encodeURIComponent(order.status || 'unpaid')];
    qs.push('orderNo=' + encodeURIComponent(order.orderNo));
    if (order.status === 'closed' && order.closedReason) {
      qs.push('reason=' + encodeURIComponent(order.closedReason));
    }
    var pointsIdx = [];
    (order.items || []).forEach(function (it, idx) {
      if (it && it.isPointsExchange) pointsIdx.push(idx);
    });
    if (pointsIdx.length) qs.push('pointsItem=' + pointsIdx.join(','));
    return 'order-detail.html?' + qs.join('&');
  }

  global.UaOrdersStore = {
    genOrderNo: genOrderNo,
    nowText: nowText,
    upsert: upsert,
    getByNo: getByNo,
    getLatest: getLatest,
    updateStatus: updateStatus,
    list: readAll,
    buildDetailHref: buildDetailHref,
    STORAGE_KEY: STORAGE_KEY,
    LAST_KEY: LAST_KEY
  };
})(typeof window !== 'undefined' ? window : this);
