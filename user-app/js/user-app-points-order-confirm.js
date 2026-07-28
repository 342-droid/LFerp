/**
 * 用户 APP — 积分兑换确认订单
 * 纯积分：确认后直接扣积分；积分+现金且现金>0：先扣积分并拉起支付
 */
(function () {
  var AVAILABLE_POINTS = 161;
  var lines = [];
  var payMethod = 'wechat';

  function resolveAsset(src) {
    src = String(src || '');
    if (!src) return '';
    if (/^(data:|https?:|\/\/)/i.test(src)) return src;
    if (src.indexOf('../user-app/') === 0) return src.replace('../user-app/', '../');
    if (src.indexOf('user-app/') === 0) return '../' + src.slice('user-app/'.length);
    if (src.indexOf('../') === 0) return src;
    return src;
  }

  function formatMoney(num) {
    var n = Math.round((Number(num) || 0) * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    return '¥' + n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function formatMoneyFixed(num) {
    return '¥' + (Math.round((Number(num) || 0) * 100) / 100).toFixed(2);
  }

  function toast(msg) {
    if (typeof showToast === 'function') {
      showToast(msg, 'info');
      return;
    }
    window.alert(msg);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function totals() {
    var points = 0;
    var money = 0;
    var qty = 0;
    lines.forEach(function (line) {
      var q = Math.max(1, Number(line.qty) || 1);
      qty += q;
      points += (Number(line.points) || 0) * q;
      money += (Number(line.money) || 0) * q;
    });
    return { qty: qty, points: points, money: Math.round(money * 100) / 100 };
  }

  function formatSum(t) {
    if (t.money > 0) return t.points + '积分 + ' + formatMoney(t.money);
    return t.points + '积分';
  }

  function linePriceText(line) {
    if (line.exchangeType === 'points_money' && Number(line.money) > 0) {
      return (Number(line.points) || 0) + '积分 + ' + formatMoney(line.money);
    }
    return (Number(line.points) || 0) + '积分';
  }

  function render() {
    var empty = document.getElementById('pocEmpty');
    var listEl = document.getElementById('pocGoodsList');
    var submit = document.getElementById('pocSubmit');
    var t = totals();

    if (!lines.length) {
      if (empty) empty.hidden = false;
      if (listEl) listEl.innerHTML = '';
      if (submit) submit.disabled = true;
      return;
    }

    if (empty) empty.hidden = true;
    if (submit) submit.disabled = false;

    if (listEl) {
      listEl.innerHTML = lines
        .map(function (line) {
          var q = Math.max(1, Number(line.qty) || 1);
          return (
            '<div class="ua-poc-goods__row">' +
            '<img class="ua-poc-goods__img" src="' +
            escapeHtml(resolveAsset(line.skuImg || line.img || '')) +
            '" alt="">' +
            '<div class="ua-poc-goods__body">' +
            '<div class="ua-poc-goods__name">' +
            '<span class="ua-poc-goods__tag">积分兑换</span>' +
            escapeHtml(line.name || '') +
            '</div>' +
            '<div class="ua-poc-goods__spec">规格：' +
            escapeHtml(line.specName || '默认') +
            '</div>' +
            '<div class="ua-poc-goods__foot">' +
            '<div class="ua-poc-goods__price">' +
            escapeHtml(linePriceText(line)) +
            '</div>' +
            '<div class="ua-poc-goods__qty">x' +
            q +
            '</div>' +
            '</div></div></div>'
          );
        })
        .join('');
    }

    var delivery = document.getElementById('pocDeliveryMode');
    if (delivery) {
      var modes = {};
      lines.forEach(function (line) {
        modes[line.deliveryMode === 'express' ? 'express' : 'platform'] = true;
      });
      var labels = [];
      if (modes.express) labels.push('快递配送');
      if (modes.platform) labels.push('平台配送');
      delivery.textContent = '履约方式：' + (labels.join(' / ') || '平台配送');
    }

    var pointsTotal = document.getElementById('pocPointsTotal');
    var moneyRow = document.getElementById('pocMoneyRow');
    var moneyTotal = document.getElementById('pocMoneyTotal');
    var available = document.getElementById('pocAvailable');
    var sum = document.getElementById('pocSum');
    var payText = document.getElementById('pocPayText');

    if (pointsTotal) pointsTotal.textContent = String(t.points);
    if (moneyRow) moneyRow.hidden = !(t.money > 0);
    if (moneyTotal) moneyTotal.textContent = formatMoney(t.money);
    if (available) available.textContent = String(AVAILABLE_POINTS);
    if (sum) sum.textContent = formatSum(t);
    if (payText) {
      payText.innerHTML =
        t.money > 0
          ? '需支付 <strong>' + formatSum(t) + '</strong>'
          : '需扣除 <strong>' + t.points + '积分</strong>';
    }
    if (submit) {
      submit.textContent = t.money > 0 ? '确认并支付' : '确认兑换';
    }

    if (submit && t.points > AVAILABLE_POINTS) {
      submit.disabled = true;
      if (payText) payText.innerHTML = '<strong style="color:#e53935;">可用积分不足</strong>';
    }
  }

  var pendingOrder = null;

  function openPaySheet() {
    var t = totals();
    var sheet = document.getElementById('pocPaySheet');
    var pointsEl = document.getElementById('pocPaySheetPoints');
    var amountEl = document.getElementById('pocPaySheetAmount');
    if (pointsEl) pointsEl.textContent = '将扣除 ' + t.points + ' 积分';
    if (amountEl) {
      amountEl.textContent =
        t.money > 0 ? formatMoneyFixed(t.money) : '扣除 ' + t.points + ' 积分';
    }
    if (sheet) sheet.hidden = false;
  }

  function closePaySheet() {
    var sheet = document.getElementById('pocPaySheet');
    if (sheet) sheet.hidden = true;
  }

  function syncPayMethodUI() {
    document.querySelectorAll('[data-pay-method]').forEach(function (btn) {
      var active = btn.getAttribute('data-pay-method') === payMethod;
      btn.classList.toggle('is-active', active);
      var check = btn.querySelector('.ua-poc-pay-check');
      if (check) check.classList.toggle('is-checked', active);
    });
  }

  /** 提交订单（接口动作）：生成待支付订单 */
  function createUnpaidOrder(t) {
    if (window.UaPointsMallOrder) window.UaPointsMallOrder.clearCheckout();
    if (window.UaPointsMallOrder) {
      lines.forEach(function (line) {
        window.UaPointsMallOrder.removeFromShopCart(line.code, line.skuCode);
      });
    }
    var orderPayload = {
      orderNo: window.UaOrdersStore ? window.UaOrdersStore.genOrderNo() : String(Date.now()),
      status: 'unpaid',
      createdAt: window.UaOrdersStore ? window.UaOrdersStore.nowText() : '',
      exchangePoints: t.points,
      deductPoints: 0,
      deductAmount: 0,
      goodsTotal: t.money,
      freight: 0,
      payable: t.money,
      payLabel: formatSum(t),
      items: lines.map(function (line) {
        return {
          id: 'points:' + (line.code || '') + ':' + (line.skuCode || ''),
          name: line.name || '',
          spec: line.specName || '',
          img: resolveAsset(line.skuImg || line.img || ''),
          qty: Math.max(1, Number(line.qty) || 1),
          price: 0,
          points: Number(line.points) || 0,
          money: Number(line.money) || 0,
          isPointsExchange: true,
          pointsCode: line.code || '',
          skuCode: line.skuCode || ''
        };
      })
    };
    var saved = window.UaOrdersStore
      ? window.UaOrdersStore.upsert(orderPayload)
      : orderPayload;
    pendingOrder = saved;
    return saved;
  }

  function goPaidOrderDetail(order) {
    var paid = null;
    if (window.UaOrdersStore && order && order.orderNo) {
      paid = window.UaOrdersStore.updateStatus(order.orderNo, 'shipping');
    }
    if (!paid) {
      paid = Object.assign({}, order || {}, { status: 'shipping' });
      if (window.UaOrdersStore && paid.orderNo) {
        paid = window.UaOrdersStore.upsert(paid);
      }
    }
    var href =
      window.UaOrdersStore && window.UaOrdersStore.buildDetailHref
        ? window.UaOrdersStore.buildDetailHref(paid)
        : 'order-detail.html?status=shipping&orderNo=' +
          encodeURIComponent((paid && paid.orderNo) || '');
    window.location.replace(href);
  }

  function submitOrder() {
    if (!lines.length) return;
    var t = totals();
    if (t.points > AVAILABLE_POINTS) {
      toast('可用积分不足');
      return;
    }
    /* 提交订单成功后唤起支付，不跳转待支付页 */
    if (!pendingOrder) {
      createUnpaidOrder(t);
      toast('订单已生成，请支付');
    }
    openPaySheet();
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('#pocBack', 'points-mall.html');
    }

    var payload = window.UaPointsMallOrder ? window.UaPointsMallOrder.getCheckout() : null;
    lines = window.UaPointsMallOrder
      ? window.UaPointsMallOrder.normalizeCheckoutLines(payload)
      : [];
    render();

    document.getElementById('pocAddressCard') &&
      document.getElementById('pocAddressCard').addEventListener('click', function () {
        toast('原型演示：选择收货地址');
      });

    document.getElementById('pocSubmit') &&
      document.getElementById('pocSubmit').addEventListener('click', submitOrder);

    document.querySelectorAll('[data-poc-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closePaySheet();
        if (pendingOrder) toast('可稍后在订单列表完成支付');
      });
    });

    document.querySelectorAll('[data-pay-method]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        payMethod = btn.getAttribute('data-pay-method') || 'wechat';
        syncPayMethodUI();
      });
    });

    document.getElementById('pocPaySubmit') &&
      document.getElementById('pocPaySubmit').addEventListener('click', function () {
        closePaySheet();
        var order = pendingOrder;
        if (!order && window.UaOrdersStore) order = window.UaOrdersStore.getLatest();
        toast('支付成功（演示）');
        setTimeout(function () {
          goPaidOrderDetail(order);
        }, 500);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
