(function () {
  var STATUS_TEXT = {
    unpaid: '待付款',
    pending_accept: '待接单',
    shipping: '待发货',
    receipt: '待收货',
    completed: '已完成',
    closed: '已关闭'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(n) {
    return '¥' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
  }

  function kv(label, value) {
    return (
      '<div class="sa-ro-kv"><span>' +
      escapeHtml(label) +
      '</span><span>' +
      value +
      '</span></div>'
    );
  }

  function isDelivery(order) {
    return window.UaOrdersStore && typeof window.UaOrdersStore.isRestockDelivery === 'function'
      ? window.UaOrdersStore.isRestockDelivery(order)
      : order && (order.fulfillType === 'delivery' || !!order.warehouse);
  }

  function shopTitle(order) {
    return window.UaOrdersStore && typeof window.UaOrdersStore.restockShopTitle === 'function'
      ? window.UaOrdersStore.restockShopTitle(order)
      : order.warehouse || order.supplierName || '进货商品';
  }

  function quoteDeliveryFreight(order) {
    var api = window.TmsLogisticsRate;
    if (!api || typeof api.quoteOrder !== 'function') return null;
    return api.quoteOrder({
      channel: api.CHANNEL_PROXY,
      fulfill: 'platform',
      address: (order.store && order.store.address) || '浙江省杭州市萧山区建设一路88号',
      items: (order.items || []).map(function (it) {
        return {
          id: it.id || '',
          title: it.name || it.title || '',
          priceNum: it.price != null ? it.price : it.priceNum,
          qty: it.qty || 1,
          tempLayer: it.tempLayer || '',
          spuId: it.spuId || ''
        };
      }),
      payable: Number(order.goodsTotal) || 0,
      services: { insure: true, deliver: true, upstairs: true },
      upstairs: order.upstairs || { hasElevator: true, floor: 2 }
    });
  }

  function resolveFreight(order) {
    if (!isDelivery(order)) {
      return { total: 0, lines: [] };
    }
    var ambient = Number(order.ambientFee) || 0;
    var cold = Number(order.coldFee) || 0;
    var extra =
      Math.round(
        ((Number(order.insureFee) || 0) +
          (Number(order.deliverFee) || 0) +
          (Number(order.upstairsFee) || 0)) *
          100
      ) / 100;
    var total = Number(order.freight) || 0;
    if (total <= 0 && ambient + cold + extra <= 0) {
      var quote = quoteDeliveryFreight(order);
      if (quote) {
        ambient = (quote.ambient && quote.ambient.amount) || 0;
        cold = (quote.cold && quote.cold.amount) || 0;
        var summary = quote.serviceSummary || {};
        extra = Math.round(
          (((summary.insure && summary.insure.amount) || 0) +
            ((summary.deliver && summary.deliver.amount) || 0) +
            ((summary.upstairs && summary.upstairs.amount) || 0)) *
            100
        ) / 100;
        total = Number(quote.total) || Math.round((ambient + cold + extra) * 100) / 100;
        if (window.UaOrdersStore && typeof window.UaOrdersStore.updateStatus === 'function') {
          var payable = Math.round((Number(order.payable || 0) + total) * 100) / 100;
          window.UaOrdersStore.updateStatus(order.orderNo, order.status, {
            freight: total,
            ambientFee: ambient,
            coldFee: cold,
            insureFee: (summary.insure && summary.insure.amount) || 0,
            deliverFee: (summary.deliver && summary.deliver.amount) || 0,
            upstairsFee: (summary.upstairs && summary.upstairs.amount) || 0,
            payable: payable,
            payLabel: money(payable),
            fulfillType: 'delivery',
            splitKind: 'delivery',
            warehouse: order.warehouse || 'W002 嘉兴仓'
          });
          order.freight = total;
          order.payable = payable;
        }
      }
    }
    var lines = [];
    if (ambient > 0) lines.push({ name: '常温基础运费', amount: ambient });
    if (cold > 0) lines.push({ name: '冷链基础运费', amount: cold });
    if (extra > 0) lines.push({ name: '增值 / 上楼', amount: extra });
    return { total: total, lines: lines };
  }

  var params = new URLSearchParams(window.location.search);
  var orderNo = params.get('orderNo') || '';
  var root = document.getElementById('restockOrderDetail');
  if (!root) return;

  var order =
    window.UaOrdersStore && typeof window.UaOrdersStore.getByNo === 'function'
      ? window.UaOrdersStore.getByNo(orderNo)
      : null;

  if (!order) {
    root.innerHTML = '<div class="sa-ro-empty">订单不存在，请从进货订单列表进入</div>';
    return;
  }

  var store = order.store || {};
  var freight = resolveFreight(order);
  var delivery = isDelivery(order);
  var canExpand = delivery && freight.lines.length > 0 && freight.total > 0;
  var itemsHtml = (order.items || [])
    .map(function (it) {
      return (
        '<div class="sa-ro-item">' +
        '<img src="' +
        escapeHtml(it.img || '../../user-app/assets/order-product-1.svg') +
        '" alt="">' +
        '<div><div class="sa-ro-item__name">' +
        escapeHtml(it.name || it.title || '') +
        '</div><div class="sa-ro-item__meta">' +
        money(it.price) +
        ' ×' +
        (Number(it.qty) || 0) +
        '</div></div></div>'
      );
    })
    .join('');

  var freightValue = delivery ? (freight.total > 0 ? money(freight.total) : '免运费') : '免运费';
  var freightHtml =
    '<div class="sa-ro-kv sa-ro-kv--freight"><span>运费</span><span class="sa-ro-freight">' +
    '<span class="sa-ro-freight__line"><span id="restockFreightTotal">' +
    freightValue +
    '</span>' +
    (canExpand
      ? '<button type="button" class="sa-ro-freight__toggle" id="restockFreightToggle" aria-expanded="false" aria-label="展开运费明细"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
      : '') +
    '</span>' +
    (canExpand
      ? '<div class="sa-ro-freight__legs" id="restockFreightLegs" hidden>' +
        freight.lines
          .map(function (line) {
            return (
              '<div class="sa-ro-freight__leg"><span>' +
              escapeHtml(line.name) +
              '</span><span>' +
              money(line.amount) +
              '</span></div>'
            );
          })
          .join('') +
        '</div>'
      : '') +
    '</span></div>';

  root.innerHTML =
    '<section class="sa-ro-block">' +
    '<div class="sa-ro-card__head"><span class="sa-ro-card__name">' +
    escapeHtml(STATUS_TEXT[order.status] || order.status || '') +
    '</span></div>' +
    kv('订单号', escapeHtml(order.orderNo || '')) +
    kv('下单时间', escapeHtml(order.createdAt || '')) +
    '</section>' +
    '<section class="sa-ro-block">' +
    '<h3 class="sa-ro-block__title">收货门店</h3>' +
    '<p class="sa-ro-item__name">' +
    escapeHtml(store.name || '') +
    '</p>' +
    '<p class="sa-ro-item__meta">' +
    escapeHtml((store.contact || '') + ' ' + (store.phone || '')) +
    '</p>' +
    '<p class="sa-ro-item__meta">' +
    escapeHtml(store.address || '') +
    '</p></section>' +
    '<section class="sa-ro-block"><h3 class="sa-ro-block__title">' +
    escapeHtml(shopTitle(order)) +
    '</h3>' +
    itemsHtml +
    '</section>' +
    '<section class="sa-ro-block">' +
    kv('商品总额', money(order.goodsTotal)) +
    freightHtml +
    '<div class="sa-ro-kv sa-ro-kv--total"><span>应付</span><span>' +
    money(order.payable) +
    '</span></div></section>';

  var toggle = document.getElementById('restockFreightToggle');
  var legsEl = document.getElementById('restockFreightLegs');
  if (toggle && legsEl) {
    toggle.addEventListener('click', function () {
      var next = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
      toggle.setAttribute('aria-label', next ? '收起运费明细' : '展开运费明细');
      toggle.classList.toggle('is-expanded', next);
      legsEl.hidden = !next;
    });
  }
})();
