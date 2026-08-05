(function () {
  /** 金额：整数不补小数，否则保留两位（对齐参考图「0元」「21.40元」） */
  function money(n) {
    var num = Number(n || 0);
    if (!isFinite(num)) return '0';
    if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
    return num.toFixed(2);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderGoodsItem(item) {
    return (
      '<div class="sa-og-item">' +
      '<img class="sa-og-item__img" src="' +
      esc(item.img) +
      '" alt="">' +
      '<div class="sa-og-item__main">' +
      '<div class="sa-og-item__top">' +
      '<div class="sa-og-item__name">' +
      esc(item.name) +
      '</div>' +
      '<div class="sa-og-item__qty">X' +
      esc(item.qty) +
      '</div>' +
      '</div>' +
      '<div class="sa-og-item__meta">实付：' +
      money(item.paid) +
      '元 佣金：' +
      money(item.commission) +
      '元</div>' +
      '</div></div>'
    );
  }

  function renderRefundItem(item) {
    return (
      '<div class="sa-og-item">' +
      '<img class="sa-og-item__img" src="' +
      esc(item.img) +
      '" alt="">' +
      '<div class="sa-og-item__main">' +
      '<div class="sa-og-item__top">' +
      '<div class="sa-og-item__name">' +
      esc(item.name) +
      '</div>' +
      '<div class="sa-og-item__qty">X' +
      esc(item.qty) +
      '</div>' +
      '</div>' +
      '<div class="sa-og-item__meta">实退：' +
      money(item.refund) +
      '元 佣金回退：' +
      money(item.commissionRefund) +
      '元</div>' +
      '</div></div>'
    );
  }

  function render(order) {
    var goods = order.goodsItems || [];
    var refunds = order.refundItems || [];
    var count =
      order.goodsCount != null
        ? order.goodsCount
        : goods.reduce(function (n, g) {
            return n + (Number(g.qty) || 0);
          }, 0);

    var html =
      '<section class="sa-og-summary">' +
      '<div class="sa-og-summary__comm">本单佣金 <em>' +
      money(order.commission) +
      '元</em></div>' +
      '<div class="sa-og-summary__paid">订单实付 ' +
      money(order.paid) +
      '元，共' +
      count +
      '件商品</div>' +
      '</section>';

    html +=
      '<section class="sa-og-block">' +
      (goods.length ? goods.map(renderGoodsItem).join('') : '<div class="sa-og-empty">暂无购买商品</div>') +
      '</section>';

    /* 阶梯差价回退：本期不展示 */

    if (refunds.length) {
      html +=
        '<section class="sa-og-block sa-og-block--refund">' +
        '<h2 class="sa-og-block__title">退款商品明细</h2>' +
        refunds.map(renderRefundItem).join('') +
        '</section>';
    }

    return html;
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id') || '';
    var root = document.getElementById('ogRoot');
    var api = window.StoreAppBizOrders;
    var order = api && typeof api.getById === 'function' ? api.getById(id) : null;
    if (!root) return;
    if (!order) {
      root.innerHTML = '<div class="sa-og-empty">订单不存在或已失效</div>';
      return;
    }
    root.innerHTML = render(order);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
