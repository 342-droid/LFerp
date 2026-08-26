/**
 * PC 代采订单 · 退运费原型
 * 订单发起，生成订单级售后明细；不选择商品、不改变商品售后状态。
 */
(function (global) {
  var previousFocus = null;
  var keydownHandler = null;

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

  function nowText() {
    var date = new Date();
    function pad(value) {
      return value < 10 ? '0' + value : String(value);
    }
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      ' ' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes()) +
      ':' +
      pad(date.getSeconds())
    );
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
    var pending = (detail && Array.isArray(detail.aftersales) ? detail.aftersales : []).reduce(
      function (total, item) {
        if (!item || item.type !== '退运费' || item.status !== '退款中') return total;
        return total + parseMoney(item.refundSubtotal != null ? item.refundSubtotal : item.refundAmount);
      },
      0
    );
    pending = Math.min(Math.max(0, original - refunded), Math.max(0, pending));
    return {
      orderId: orderId,
      original: original,
      refunded: refunded,
      pending: pending,
      remaining: Math.max(0, Math.round((original - refunded - pending) * 100) / 100),
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
    var shouldRestoreFocus = !!backdrop;
    if (backdrop) backdrop.remove();
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderPlatformAsBackdrop')
    ) {
      document.body.style.overflow = '';
    }
    if (shouldRestoreFocus && previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    if (shouldRestoreFocus) previousFocus = null;
  }

  function reasonOptions() {
    var reasons = [];
    if (global.MdmAftersaleReasons) {
      if (typeof global.MdmAftersaleReasons.getReasonList === 'function') {
        reasons = global.MdmAftersaleReasons.getReasonList('退运费', '已收到货', '已完成');
      } else if (typeof global.MdmAftersaleReasons.getReasonsByType === 'function') {
        reasons = global.MdmAftersaleReasons.getReasonsByType('退运费');
      }
    }
    return (
      '<option value="">请选择售后原因</option>' +
      reasons.map(function (reason) {
        return '<option value="' + escapeHtml(reason) + '">' + escapeHtml(reason) + '</option>';
      }).join('')
    );
  }

  function amountCard(label, amount, key, mod) {
    return (
      '<div class="order-as-kv' + (mod ? ' ' + mod : '') + '">' +
      '<span class="order-as-kv__k">' + label + '</span>' +
      '<strong class="order-as-kv__v" data-freight-amount="' + key + '">¥' + formatMoney(amount) + '</strong>' +
      '</div>'
    );
  }

  function appendFreightAftersale(detail, amount, reason, desc) {
    var payChannel = detail.tags && detail.tags.payChannel;
    var alipay = payChannel === '支付宝' ? amount : 0;
    var wechat = payChannel === '微信' ? amount : 0;
    var wallet = payChannel === '钱包' ? amount : 0;
    detail.aftersales = Array.isArray(detail.aftersales) ? detail.aftersales : [];
    var aftersale = {
      id: 'AS-FREIGHT-' + Date.now(),
      productName: '订单运费',
      type: '退运费',
      status: '退款中',
      returnQty: '-',
      refundAmount: '¥' + formatMoney(amount),
      refundSubtotal: '¥' + formatMoney(amount),
      refundAlipay: '¥' + formatMoney(alipay),
      refundWechat: '¥' + formatMoney(wechat),
      refundWallet: '¥' + formatMoney(wallet),
      refundCoupon: '¥0.00',
      refundPoints: 0,
      adjustAmount: '¥0.00',
      reason: reason,
      desc: desc
    };
    detail.aftersales.unshift(aftersale);
    return aftersale;
  }

  function applyPrototypeRefund(summary, amount, reason, desc) {
    var detail = summary.detail;
    var aftersale = appendFreightAftersale(detail, amount, reason, desc);
    if (global.FreightRefundAftersaleStore) {
      var deliveryType = detail.delivery && detail.delivery.type;
      var fulfillment = deliveryType === 'PICKUP' ? '自提' : deliveryType === 'DELIVERY' ? '配送' : '快递';
      var createdAt = nowText();
      global.FreightRefundAftersaleStore.add({
        id: aftersale.id,
        source: '运营代用户发起',
        type: '退运费',
        status: '退款中',
        orderSource: '代采',
        liveSession: (detail.tags && detail.tags.livePeriod) || '-',
        fulfillment: fulfillment,
        nickname: (detail.customer && detail.customer.nickname) || '-',
        phone: (detail.customer && detail.customer.phone) || '-',
        store: (detail.delivery && detail.delivery.store) || '-',
        storeAddress: (detail.delivery && detail.delivery.address) || '-',
        productName: '订单运费',
        productSpec: '-',
        productSku: '-',
        applyAmount: formatMoney(amount),
        approveAmount: formatMoney(amount),
        refundExecStatus: '退款执行中',
        actualAmount: '0.00',
        couponAmount: '0.00',
        pointsAmount: 0,
        reason: reason,
        desc: desc,
        approver: '超级管理员',
        settleStatus: '待结算',
        occurTime: createdAt,
        approveTime: createdAt,
        applyTime: createdAt,
        updateTime: createdAt,
        orderNo: summary.orderId,
        orderTime: (detail.progress && detail.progress.submitTime) || '-',
        orderAmount: parseMoney(detail.amounts && detail.amounts.payable),
        orderStatus: (detail.progress && detail.progress.status) || '-',
        payChannel: (detail.tags && detail.tags.payChannel) || '-',
        originalFreight: summary.original,
        refundedFreight: summary.refunded,
        pendingFreight: Math.round((summary.pending + amount) * 100) / 100,
        refundAlipay: aftersale.refundAlipay,
        refundWechat: aftersale.refundWechat,
        refundWallet: aftersale.refundWallet
      });
    }
  }

  function open(orderId, row) {
    close();
    previousFocus = document.activeElement;
    var summary = getSummary(orderId, row);
    if (!canRefund(orderId, row)) {
      if (typeof global.showToast === 'function') global.showToast('当前订单暂无可退运费', 'error');
      return;
    }
    var payChannel = summary.detail && summary.detail.tags && summary.detail.tags.payChannel;
    var refundChannel = payChannel && payChannel !== '-' ? payChannel + '（原路退回）' : '原路退回';

    var backdrop = document.createElement('div');
    backdrop.className = 'store-drawer-backdrop order-as-drawer-backdrop';
    backdrop.id = 'orderFreightRefundBackdrop';
    backdrop.innerHTML =
      '<aside class="store-drawer order-as-drawer" id="orderFreightRefundDrawer" role="dialog" aria-modal="true" aria-labelledby="orderFreightRefundTitle">' +
      '<div class="store-drawer__header order-as-drawer__header">' +
      '<h2 class="store-drawer__title" id="orderFreightRefundTitle">退运费</h2>' +
      '<button type="button" class="store-drawer__close" data-freight-close aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="store-drawer__body order-as-drawer__body">' +
      '<div class="order-as-occur"><span class="order-as-occur__label">售后发生时间</span>' +
      '<div class="order-as-occur__value"><span class="order-as-occur__icon" aria-hidden="true">🕒</span>' +
      '<span>' + escapeHtml(nowText()) + '</span></div></div>' +
      '<h3 class="order-as-section-title">运费信息</h3>' +
      '<article class="order-as-item is-selected" aria-label="订单运费退款信息">' +
      '<div class="order-as-item__meta">' +
      '<div class="order-as-kv"><span class="order-as-kv__k">订单号</span><span class="order-as-kv__v">' + escapeHtml(orderId) + '</span></div>' +
      amountCard('原始运费', summary.original, 'original') +
      amountCard('累计退运费', summary.refunded, 'refunded') +
      amountCard('剩余可退运费', summary.remaining, 'remaining') +
      '</div>' +
      '<div class="order-as-form">' +
      '<div class="order-as-form__row order-as-form__row--3">' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>本次退运费</span>' +
      '<input class="order-as-field__control" id="orderFreightRefundAmount" name="freightRefundAmount" type="text" inputmode="decimal" value="' +
      formatMoney(summary.remaining) + '" autocomplete="off"></label>' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>售后原因</span>' +
      '<select class="order-as-field__control" id="orderFreightRefundReason" name="freightRefundReason">' + reasonOptions() + '</select></label>' +
      '<label class="order-as-field"><span class="order-as-field__label">退款渠道</span>' +
      '<input class="order-as-field__control" type="text" value="' + escapeHtml(refundChannel) + '" readonly></label>' +
      '</div>' +
      '<div class="order-as-form__row">' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>售后描述</span>' +
      '<span class="order-as-textarea-wrap"><textarea class="order-as-field__control order-as-field__textarea" id="orderFreightRefundDesc" name="freightRefundDesc" maxlength="200" placeholder="请填写退运费说明"></textarea>' +
      '<span class="order-as-textarea-count" data-freight-desc-count>0/200</span></span></label>' +
      '</div>' +
      '<p class="order-freight-refund-error" id="orderFreightRefundError" role="alert"></p>' +
      '</div>' +
      '<div class="order-as-item__foot">仅生成订单级退运费售后，不改变商品售后状态及采购款分账。</div>' +
      '</article>' +
      '</div>' +
      '<div class="order-as-drawer__footer">' +
      '<div class="order-as-drawer__summary">本次退运费 <em data-freight-submit-total>¥' + formatMoney(summary.remaining) + '</em></div>' +
      '<div class="order-as-drawer__actions"><button type="button" class="order-detail-btn" data-freight-close>取消</button>' +
      '<button type="button" class="order-detail-btn order-detail-btn--primary" data-freight-submit>提交</button></div>' +
      '</div></aside>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop || event.target.closest('[data-freight-close]')) close();
    });

    var amountInput = document.getElementById('orderFreightRefundAmount');
    var descInput = document.getElementById('orderFreightRefundDesc');
    amountInput.addEventListener('input', function () {
      backdrop.querySelector('[data-freight-submit-total]').textContent = '¥' + formatMoney(parseMoney(amountInput.value));
    });
    descInput.addEventListener('input', function () {
      backdrop.querySelector('[data-freight-desc-count]').textContent = descInput.value.length + '/200';
    });
    keydownHandler = function (event) {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', keydownHandler);

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
        global.showToast('退运费申请已提交（原型演示）', 'success');
      }
    });

    requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
      var drawer = document.getElementById('orderFreightRefundDrawer');
      if (drawer) drawer.classList.add('is-open');
      amountInput.focus();
      amountInput.select();
    });
  }

  global.OrderFreightRefund = {
    canRefund: canRefund,
    getSummary: getSummary,
    open: open,
    close: close
  };
})(typeof window !== 'undefined' ? window : this);
