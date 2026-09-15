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

  function listRestockOrders() {
    if (!window.UaOrdersStore || typeof window.UaOrdersStore.list !== 'function') return [];
    return (window.UaOrdersStore.list() || []).filter(function (order) {
      return order && (order.from === 'restock.html' || order.fulfillType || order.splitKind);
    });
  }

  function render() {
    var wrap = document.getElementById('restockOrderList');
    var empty = document.getElementById('restockOrderEmpty');
    if (!wrap) return;
    var list = listRestockOrders();
    if (empty) empty.hidden = list.length > 0;
    wrap.innerHTML = list
      .map(function (order) {
        var imgs = (order.items || [])
          .slice(0, 3)
          .map(function (it) {
            return '<img src="' + escapeHtml(it.img || '../../user-app/assets/order-product-1.svg') + '" alt="">';
          })
          .join('');
        var qty = (order.items || []).reduce(function (sum, it) {
          return sum + (Number(it.qty) || 0);
        }, 0);
        return (
          '<a class="sa-ro-card" href="restock-order-detail.html?orderNo=' +
          encodeURIComponent(order.orderNo || '') +
          '">' +
          '<div class="sa-ro-card__head">' +
          '<span class="sa-ro-card__name">' +
          escapeHtml(
            window.UaOrdersStore && window.UaOrdersStore.restockShopTitle
              ? window.UaOrdersStore.restockShopTitle(order)
              : order.warehouse || order.supplierName || '进货商城'
          ) +
          '</span>' +
          '<span class="sa-ro-card__status">' +
          escapeHtml(STATUS_TEXT[order.status] || order.status || '') +
          '</span></div>' +
          '<div class="sa-ro-card__body"><div class="sa-ro-card__imgs">' +
          (imgs || '<img src="../../user-app/assets/order-product-1.svg" alt="">') +
          '</div><div class="sa-ro-card__sum"><div class="sa-ro-card__price">' +
          escapeHtml(order.payLabel || money(order.payable)) +
          '</div><div class="sa-ro-card__count">共' +
          qty +
          '件</div></div></div>' +
          '<div class="sa-ro-card__foot"><span class="sa-ro-card__time">' +
          escapeHtml(order.createdAt || '') +
          '</span></div></a>'
        );
      })
      .join('');
  }

  render();
})();
