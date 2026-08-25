/**
 * PC 代采订单 · 退运费原型
 * 订单发起，生成订单级售后明细；不选择商品、不改变商品售后状态。
 */
(function (global) {
  var REASONS = ['配送异常', '运费收取错误', '平台补偿', '其他'];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseMoney(value) {
    var parsed = parseFloat(String(value == null ? '' : value).replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  function formatMoney(value) {
    return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
  }

  function resolveDetail(orderId, row) {
    if (!global.OrderLiveDetail || typeof global.OrderLiveDetail.resolveDetail !== 'function') return null;
    return global.OrderLiveDetail.resolveDetail(orderId, row || null);
  }

  function getSummary(orderId, row) {
    var detail = resolveDetail(orderId, row);
    var freight = detail && detail.freight ? detail.freight : {};
    var original = parseMoney(freight.original);
    var refunded = Math.min(original, Math.max(0, parseMoney(freight.refunded)));
    return {
      orderId: orderId,
      original: original,
      refunded: refunded,
      remaining: Math.max(0, Math.round((original - refunded) * 100) / 100),
      detail: detail
    };
  }

  function rowStatus(row) {
    var tag = row
      ? row.querySelector('.order-status-cell .order-tag') || row.querySelector('td:nth-last-child(2) .order-tag')
      : null;
    return tag ? tag.textContent.trim() : '';
  }

  function canRefund(orderId, row) {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'proxy') return false;
    var summary = getSummary(orderId, row);
    var allowed = ['已支付', '待发货', '待收货', '待提货', '已完成', '交易成功'];
    return summary.original > 0 && summary.remaining > 0 && allowed.indexOf(rowStatus(row)) >= 0;
  }

  function close() {
    var backdrop = document.getElementById('orderFreightRefundBackdrop');
    if (backdrop) backdrop.remove();
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderPlatformAsBackdrop')
    ) {
      document.body.style.overflow = '';
    }
  }

  function reasonOptions() {
    return (
      '<option value="">请选择退款原因</option>' +
      REASONS.map(function (reason) {
        return '<option value="' + escapeHtml(reason) + '">' + escapeHtml(reason) + '</option>';
      }).join('')
    );
  }

  function amountCard(label, amount, key, mod) {
    return (
      '<div class="order-freight-refund-summary__item' + (mod ? ' ' + mod : '') + '">' +
      '<span>' + label + '</span>' +
      '<strong data-freight-amount="' + key + '">¥' + formatMoney(amount) + '</strong>' +
      '</div>'
    );
  }

  function appendFreightAftersale(detail, amount, reason, desc) {
    detail.aftersales = Array.isArray(detail.aftersales) ? detail.aftersales : [];
    detail.aftersales.unshift({
      id: 'AS-FREIGHT-' + Date.now(),
      productName: '订单运费',
      type: '退运费',
      status: '已完成',
      returnQty: '-',
      refundAmount: '¥' + formatMoney(amount),
      refundCoupon: '¥0.00',
      refundPoints: 0,
      adjustAmount: '¥0.00',
      reason: reason,
      desc: desc
    });
  }

  function applyPrototypeRefund(summary, amount, reason, desc) {
    var detail = summary.detail;
    detail.freight.refunded = Math.round((summary.refunded + amount) * 100) / 100;
    detail.amounts = detail.amounts || {};
    detail.amounts.refund = '¥' + formatMoney(parseMoney(detail.amounts.refund) + amount);
    detail.amounts.merchant =
      '¥' + formatMoney(Math.max(0, parseMoney(detail.amounts.merchant) - amount));
    appendFreightAftersale(detail, amount, reason, desc);
  }

  function open(orderId, row) {
    close();
    var summary = getSummary(orderId, row);
    if (!canRefund(orderId, row)) {
      if (typeof global.showToast === 'function') global.showToast('当前订单暂无可退运费', 'error');
      return;
    }

    var backdrop = document.createElement('div');
    backdrop.className = 'store-drawer-backdrop order-freight-refund-backdrop';
    backdrop.id = 'orderFreightRefundBackdrop';
    backdrop.innerHTML =
      '<aside class="store-drawer order-freight-refund-drawer" id="orderFreightRefundDrawer" role="dialog" aria-labelledby="orderFreightRefundTitle">' +
      '<div class="store-drawer__header order-freight-refund-drawer__header">' +
      '<div><h2 class="store-drawer__title" id="orderFreightRefundTitle">退运费</h2>' +
      '<p class="order-freight-refund-order">订单号：' + escapeHtml(orderId) + '</p></div>' +
      '<button type="button" class="store-drawer__close" data-freight-close aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="store-drawer__body order-freight-refund-drawer__body">' +
      '<section class="order-freight-refund-summary" aria-label="运费退款汇总">' +
      amountCard('原始运费', summary.original, 'original') +
      amountCard('累计退运费', summary.refunded, 'refunded') +
      amountCard('剩余可退运费', summary.remaining, 'remaining', 'is-remaining') +
      '</section>' +
      '<section class="order-freight-refund-form">' +
      '<h3>退款信息</h3>' +
      '<label class="order-freight-refund-field"><span><i>*</i>本次退运费</span>' +
      '<div class="order-freight-refund-money"><b>¥</b><input id="orderFreightRefundAmount" type="text" inputmode="decimal" value="' +
      formatMoney(summary.remaining) + '" autocomplete="off"></div>' +
      '<small>可退范围：¥0.01～¥' + formatMoney(summary.remaining) + '</small></label>' +
      '<label class="order-freight-refund-field"><span><i>*</i>退款原因</span>' +
      '<select id="orderFreightRefundReason">' + reasonOptions() + '</select></label>' +
      '<label class="order-freight-refund-field"><span><i>*</i>退款说明</span>' +
      '<textarea id="orderFreightRefundDesc" maxlength="200" placeholder="请填写退运费说明"></textarea></label>' +
      '<p class="order-freight-refund-error" id="orderFreightRefundError" role="alert"></p>' +
      '</section>' +
      '<aside class="order-freight-refund-note"><strong>退款影响范围</strong>' +
      '<p>仅退订单运费并累计到订单退款金额，不改变商品数量、商品售后状态、采购款分账、库存、优惠券和积分。</p></aside>' +
      '</div>' +
      '<div class="order-freight-refund-drawer__footer">' +
      '<span>原型提交后模拟退款成功，并生成一条“退运费”售后明细。</span>' +
      '<div><button type="button" class="order-detail-btn" data-freight-close>取消</button>' +
      '<button type="button" class="order-detail-btn order-detail-btn--primary" data-freight-submit>提交</button></div>' +
      '</div></aside>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop || event.target.closest('[data-freight-close]')) close();
    });

    backdrop.querySelector('[data-freight-submit]').addEventListener('click', function () {
      var latest = getSummary(orderId, row);
      var amount = parseMoney(document.getElementById('orderFreightRefundAmount').value);
      var reason = document.getElementById('orderFreightRefundReason').value;
      var desc = document.getElementById('orderFreightRefundDesc').value.trim();
      var error = document.getElementById('orderFreightRefundError');
      error.textContent = '';
      if (!(amount > 0)) {
        error.textContent = '本次退运费必须大于 ¥0.00';
        return;
      }
      if (amount > latest.remaining + 0.0001) {
        error.textContent = '本次退运费不能超过剩余可退运费 ¥' + formatMoney(latest.remaining);
        return;
      }
      if (!reason) {
        error.textContent = '请选择退款原因';
        return;
      }
      if (!desc) {
        error.textContent = '请填写退款说明';
        return;
      }

      applyPrototypeRefund(latest, amount, reason, desc);
      close();
      if (global.OrderProxyList && typeof global.OrderProxyList.refreshActionLayout === 'function') {
        global.OrderProxyList.refreshActionLayout();
      }
      if (typeof global.showToast === 'function') {
        global.showToast('退运费成功（原型演示）', 'success');
      }
    });

    requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
      var drawer = document.getElementById('orderFreightRefundDrawer');
      if (drawer) drawer.classList.add('is-open');
    });
  }

  global.OrderFreightRefund = {
    canRefund: canRefund,
    getSummary: getSummary,
    open: open,
    close: close
  };
})(typeof window !== 'undefined' ? window : this);
