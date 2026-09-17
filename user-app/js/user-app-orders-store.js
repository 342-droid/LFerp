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

  function isWarehouseShopName(name) {
    var s = String(name || '').trim();
    if (!s || /供应商/.test(s)) return false;
    if (/^W00\d/.test(s) || /嘉兴仓|南京仓|上海仓/.test(s)) return true;
    if (s === '华东冷链仓') return true;
    return /仓$/.test(s);
  }

  function looksLikeJiaxingDelivery(order) {
    var title = String((order && (order.warehouse || order.supplierName)) || '');
    return /W002|嘉兴仓/.test(title);
  }

  /** 进货配送单：按仓履约。W002 嘉兴仓即使被误写成快递，也按配送修回。 */
  function isRestockDelivery(order) {
    if (!order) return false;
    if (looksLikeJiaxingDelivery(order)) return true;
    if (order.fulfillType === 'delivery' || order.splitKind === 'delivery') return true;
    if (order.fulfillType === 'express' || order.splitKind === 'express') return false;
    return isWarehouseShopName(order.warehouse);
  }

  function restockShopTitle(order) {
    if (!order) return '进货商城';
    if (isRestockDelivery(order)) {
      return (
        String(order.warehouse || '').trim() ||
        (isWarehouseShopName(order.supplierName) ? String(order.supplierName).trim() : '') ||
        '配送仓'
      );
    }
    var name = String(order.supplierName || '').trim();
    if (name === '华东冷链' || name === '华东冷链仓') return '华东冷链供应商';
    return name || '进货商城';
  }

  function applyRestockFulfillRepair(order) {
    if (!order) return order;
    if (isRestockDelivery(order)) {
      order.fulfillType = 'delivery';
      order.splitKind = 'delivery';
      if (!order.warehouse) {
        order.warehouse = isWarehouseShopName(order.supplierName)
          ? order.supplierName
          : looksLikeJiaxingDelivery(order)
            ? order.supplierName || 'W002 嘉兴仓'
            : '';
      }
      if (isWarehouseShopName(order.supplierName)) order.supplierName = '';
    } else if (order.fulfillType === 'express' || order.splitKind === 'express') {
      if (order.supplierName === '华东冷链' || order.supplierName === '华东冷链仓') {
        order.supplierName = '华东冷链供应商';
      }
    }
    return order;
  }

  function normalizeOrder(order) {
    order = applyRestockFulfillRepair(Object.assign({}, order || {}));
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
      freightRefunded: Number(order.freightRefunded) || 0,
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
      upstairs: order.upstairs || null,
      store: order.store || null
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
        splitKind: order.splitKind || '',
        upstairs: order.upstairs || null
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

  function listNormalized() {
    var raw = readAll();
    var next = raw.map(normalizeOrder);
    var changed = next.some(function (n, i) {
      var o = raw[i] || {};
      return (
        n.fulfillType !== (o.fulfillType || '') ||
        n.splitKind !== (o.splitKind || '') ||
        n.warehouse !== (o.warehouse || '') ||
        n.supplierName !== (o.supplierName || '')
      );
    });
    if (changed) writeAll(next);
    return next;
  }

  function getByNo(orderNo) {
    var no = String(orderNo || '');
    if (!no) return null;
    var list = listNormalized();
    for (var i = 0; i < list.length; i++) {
      if (list[i].orderNo === no) return list[i];
    }
    try {
      var raw = global.sessionStorage.getItem(LAST_KEY);
      if (!raw) return null;
      var last = JSON.parse(raw);
      if (last && last.orderNo === no) return normalizeOrder(last);
    } catch (e) { /* ignore */ }
    return null;
  }

  function restockAsset(file) {
    return '../assets/' + file;
  }

  function isRestockOrder(order) {
    return !!(order && (order.from === 'restock.html' || order.fulfillType || order.splitKind));
  }

  function ensureRestockDemo(orderNo) {
    var no = String(orderNo || '').trim();
    if (no) {
      var existing = getByNo(no);
      if (existing && isRestockOrder(existing)) return existing;
    }
    var seedNo = no || '9550747005504';
    return upsert({
      orderNo: seedNo,
      status: 'receipt',
      createdAt: '2026-09-16 10:22:08',
      paidAt: '2026-09-16 10:22:36',
      goodsTotal: 93.9,
      freight: 12.5,
      payable: 93.9,
      payLabel: '¥93.90',
      payMethod: '微信支付',
      from: 'restock.html',
      fulfillType: 'delivery',
      splitKind: 'delivery',
      warehouse: 'W002 嘉兴仓',
      supplierName: '',
      items: [
        {
          name: '冷丰优选智利车厘子 鲜脆清甜 礼盒装',
          spec: '2.5kg；颜色：白色',
          qty: 1,
          price: 18,
          img: restockAsset('order-product-1.svg'),
          tempLayer: '冷藏'
        },
        {
          name: '新鲜红颜草莓 香甜多汁 500g装',
          spec: '500g；颜色：红色',
          qty: 1,
          price: 16,
          img: restockAsset('order-product-2.svg'),
          tempLayer: '冷藏'
        },
        {
          name: '海南贵妃芒 香甜软糯 礼盒装',
          spec: '2.5kg',
          qty: 1,
          price: 59.9,
          img: restockAsset('order-product-3.svg'),
          tempLayer: '常温'
        }
      ]
    });
  }

  function ensureRestockDemoList() {
    var list = listNormalized().filter(isRestockOrder);
    if (list.length) return list;
    ensureRestockDemo('9550747005504');
    upsert({
      orderNo: '9550747005511',
      status: 'pending_accept',
      createdAt: '2026-09-16 11:08:22',
      paidAt: '2026-09-16 11:08:40',
      goodsTotal: 36,
      freight: 0,
      payable: 36,
      payLabel: '¥36.00',
      payMethod: '微信支付',
      from: 'restock.html',
      fulfillType: 'express',
      splitKind: 'express',
      warehouse: '',
      supplierName: '华东冷链供应商',
      items: [
        {
          name: '新鲜红颜草莓 香甜多汁 500g装',
          spec: '500g；颜色：红色',
          qty: 2,
          price: 18,
          img: restockAsset('order-product-2.svg'),
          tempLayer: '冷藏'
        }
      ]
    });
    upsert({
      orderNo: '9550747005528',
      status: 'unpaid',
      createdAt: '2026-09-16 14:16:05',
      goodsTotal: 59.9,
      freight: 0,
      payable: 59.9,
      payLabel: '¥59.90',
      from: 'restock.html',
      fulfillType: 'express',
      splitKind: 'express',
      warehouse: '',
      supplierName: '冷丰优选供应链',
      items: [
        {
          name: '海南贵妃芒 香甜软糯 礼盒装',
          spec: '2.5kg',
          qty: 1,
          price: 59.9,
          img: restockAsset('order-product-3.svg'),
          tempLayer: '常温'
        }
      ]
    });
    return listNormalized().filter(isRestockOrder);
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

  function isStoreAppShell() {
    return !!(global.LfAppShell && typeof global.LfAppShell.isStoreApp === 'function' && global.LfAppShell.isStoreApp());
  }

  function buildDetailHref(order) {
    if (!order) {
      return isStoreAppShell()
        ? (global.LfAppShell ? global.LfAppShell.restockOrdersHref() : '../../store-app/h5/restock-orders.html')
        : 'orders.html';
    }
    order = normalizeOrder(order);
    if (isStoreAppShell() && (order.from === 'restock.html' || order.fulfillType || order.splitKind)) {
      return global.LfAppShell.restockDetailHref(order.orderNo);
    }
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
    if (order.from === 'restock.html' || order.fulfillType || order.splitKind) {
      qs.push('from=restock.html');
      qs.push('delivery=' + (isRestockDelivery(order) ? 'warehouse' : 'store'));
      var shop = restockShopTitle(order);
      if (shop) qs.push('supplier=' + encodeURIComponent(shop));
    }
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
    list: listNormalized,
    buildDetailHref: buildDetailHref,
    isRestockOrder: isRestockOrder,
    ensureRestockDemo: ensureRestockDemo,
    ensureRestockDemoList: ensureRestockDemoList,
    isRestockDelivery: isRestockDelivery,
    restockShopTitle: restockShopTitle,
    isWarehouseShopName: isWarehouseShopName,
    STORAGE_KEY: STORAGE_KEY,
    LAST_KEY: LAST_KEY
  };
})(typeof window !== 'undefined' ? window : this);
