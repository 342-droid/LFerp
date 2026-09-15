/**
 * 用户 APP — 演示订单存储（确认下单后写入待支付，支付后改状态）
 */
(function (global) {
  var STORAGE_KEY = 'ua_demo_orders_v1';
  var LAST_KEY = 'ua_last_order_v1';
  var LAST_ITEMS_KEY = 'ua_last_order_items_v1';
  var MDM_MIRROR_KEY = 'lf_mdm_cend_split_orders_v1';

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

  function demoPayNo(orderNo, method) {
    var digits = String(orderNo || '').replace(/\D/g, '');
    if (!digits) digits = String(Date.now());
    digits = digits.slice(-10).padStart(10, '0');
    var key = String(method || '');
    if (key.indexOf('支付宝') >= 0 || /alipay/i.test(key)) {
      return '20260831' + digits.slice(-8);
    }
    return '420000' + digits;
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
    var status = order.status || 'unpaid';
    /* 后台「待核销 / 现货直核」不对用户展示：自提对客仍是待自提 */
    if (status === '待核销' || status === 'verify') status = 'pickup';
    var items = Array.isArray(order.items)
      ? order.items.map(function (item) {
          var copy = Object.assign({}, item || {});
          if (copy.fulfillTag === '现货直核') delete copy.fulfillTag;
          delete copy.spotDirectVerify;
          return copy;
        })
      : [];
    var payLegs = Array.isArray(order.payLegs)
      ? order.payLegs
          .map(function (leg) {
            return {
              name: String((leg && leg.name) || ''),
              amount: Math.round((Number(leg && leg.amount) || 0) * 100) / 100
            };
          })
          .filter(function (leg) {
            return leg.name;
          })
      : [];
    return {
      orderNo: String(order.orderNo || ''),
      status: status,
      createdAt: order.createdAt || nowText(),
      paidAt: order.paidAt || '',
      closedReason: order.closedReason || '',
      exchangePoints: Number(order.exchangePoints) || 0,
      deductPoints: Number(order.deductPoints) || 0,
      deductAmount: Number(order.deductAmount) || 0,
      goodsTotal: Number(order.goodsTotal) || 0,
      freight: Number(order.freight) || 0,
      ambientFee: order.ambientFee != null ? Number(order.ambientFee) : null,
      coldFee: order.coldFee != null ? Number(order.coldFee) : null,
      payable: Number(order.payable) || 0,
      payLabel: order.payLabel || '',
      /* 混合支付：支付方式名（顿号拼接）+ 各腿金额明细 */
      payMethod: order.payMethod || '',
      payNo: order.payNo || demoPayNo(order.orderNo, order.payMethod),
      payLegs: payLegs,
      from: order.from || '',
      items: items,
      splitGroupId: order.splitGroupId || '',
      siblingOrderNo: order.siblingOrderNo || '',
      siblingOrderNos: Array.isArray(order.siblingOrderNos)
        ? order.siblingOrderNos.filter(Boolean)
        : order.siblingOrderNo
          ? [order.siblingOrderNo]
          : [],
      splitKind: order.splitKind || '',
      fulfillType: order.fulfillType || '',
      warehouse: order.warehouse || '',
      supplierName: order.supplierName || '',
      insureFee: Number(order.insureFee) || 0,
      deliverFee: Number(order.deliverFee) || 0,
      upstairsFee: Number(order.upstairsFee) || 0,
      upstairs: order.upstairs || null
    };
  }

  function publishMdmMirror(order) {
    try {
      var raw = global.localStorage.getItem(MDM_MIRROR_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      var rec = {
        channel: order.from === 'restock.html' ? 'proxy' : 'retail',
        orderNo: order.orderNo,
        createdAt: order.createdAt,
        status: order.status,
        storeName: order.from === 'restock.html' ? '悠悠生鲜超市' : '华强北',
        fulfill: order.fulfillType || order.splitKind || '',
        warehouse: order.warehouse || '',
        supplierName: order.supplierName || '',
        goods: (order.items || []).map(function (it) {
          return {
            name: it.name || it.title || '',
            img: it.img || '',
            qty: Number(it.qty) || 1,
            price: Number(it.price) || 0,
            spec: it.spec || ''
          };
        }),
        goodsTotal: order.goodsTotal,
        freight: order.freight,
        payable: order.payable,
        payMethod: order.payMethod || '',
        payNo: order.payNo || '',
        siblingOrderNos: order.siblingOrderNos || [],
        splitKind: order.splitKind || ''
      };
      list = list.filter(function (x) {
        return !x || x.orderNo !== rec.orderNo;
      });
      list.unshift(rec);
      global.localStorage.setItem(MDM_MIRROR_KEY, JSON.stringify(list.slice(0, 40)));
    } catch (e) {
      /* ignore */
    }
  }

  function upsert(order) {
    var next = normalizeOrder(order);
    if (!next.orderNo) next.orderNo = genOrderNo();
    var list = readAll().filter(function (o) {
      return o.orderNo !== next.orderNo;
    });
    list.unshift(next);
    writeAll(list.slice(0, 30));
    if (next.from === 'restock.html' || next.fulfillType || next.splitKind) {
      publishMdmMirror(next);
    }
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
              qty: it.qty,
              price: Number(it.price) || 0,
              /* 支付方式按商品金额占比分摊，供原路退回 */
              payLegs: Array.isArray(it.payLegs) ? it.payLegs : []
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
    if ((status === 'shipping' || status === 'pending_accept') && !order.paidAt) order.paidAt = nowText();
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
    demoPayNo: demoPayNo,
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
