/**
 * 后台订单 · 平台退款 / 发起售后（右侧抽屉）
 * 售后类型：仅退款、退货退款、补货（补货时「退款金额」→「补货数量」）
 */
(function (global) {
  var TYPES = ['仅退款', '退货退款', '补货'];
  var DESC_MAX = 200;
  var PROOF_MAX = 9;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pageType() {
    var p = document.body && document.body.getAttribute('data-order-page');
    return p === 'proxy' ? 'proxy' : 'retail';
  }

  function getRowOrderStatus(row) {
    var statusEl = row
      ? row.querySelector('.order-status-cell .order-tag') ||
        row.querySelector('td:nth-last-child(2) .order-tag')
      : null;
    return statusEl ? statusEl.textContent.trim() : '';
  }

  function getFulfillmentKind(row) {
    if (!row) return 'express';
    if (pageType() === 'retail') {
      return (row.getAttribute('data-delivery-mode') || '') === 'express' ? 'express' : 'pickup';
    }
    return (row.getAttribute('data-fulfillment-mode') || '') === 'warehouse' ? 'delivery' : 'express';
  }

  /**
   * 取消订单可见性
   * - 零售自提：待支付、已支付、待接单、待发货、待收货、待提货
   * - 零售快递 / 代采快递 / 代采配送：待支付、已支付、待接单、待发货
   */
  function canCancelOrder(row) {
    var status = getRowOrderStatus(row);
    var kind = getFulfillmentKind(row);
    if (pageType() === 'retail' && kind === 'pickup') {
      return ['待支付', '已创建', '已支付', '待接单', '待发货', '待收货', '待提货'].indexOf(status) >= 0;
    }
    return ['待支付', '已创建', '已支付', '待接单', '待发货'].indexOf(status) >= 0;
  }

  /**
   * 平台退款可见性
   * - 零售自提：待收货、待提货
   * - 其余：待收货
   */
  function canPlatformRefund(row) {
    var status = getRowOrderStatus(row);
    var kind = getFulfillmentKind(row);
    if (pageType() === 'retail' && kind === 'pickup') {
      return status === '待收货' || status === '待提货';
    }
    return status === '待收货';
  }

  function canStartAftersale(row) {
    var status = getRowOrderStatus(row);
    if (global.OrderRetailStatus) return global.OrderRetailStatus.isSuccess(status);
    return status === '已完成' || status === '交易成功';
  }

  function canOpenAftersaleDrawer(row) {
    return canPlatformRefund(row) || canStartAftersale(row);
  }

  function aftersaleActionLabel(row) {
    return canStartAftersale(row) ? '发起售后' : '申请售后';
  }

  function parseMoney(val) {
    var n = parseFloat(String(val == null ? '' : val).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  }

  function formatMoney(n) {
    return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
  }

  function resolveBatchRefundAmount(it, remain) {
    var amt = parseMoney(it && it.refundAmount);
    var total = parseMoney(it && it.batchRemainTotal);
    var cap = parseMoney(remain);
    if (Math.abs(amt - total) < 0.001) return cap;
    if (!(amt > 0)) return 0;
    return amt > cap ? cap : amt;
  }

  function allocateByWeights(total, weights) {
    var list = (weights || []).map(function (w) {
      return parseMoney(w);
    });
    if (!list.length) return [];
    var sum = list.reduce(function (a, b) {
      return a + b;
    }, 0);
    var cents = Math.round(parseMoney(total) * 100);
    if (cents <= 0) return list.map(function () { return 0; });
    if (sum <= 0) {
      var even = Math.floor(cents / list.length);
      var leftover = cents - even * list.length;
      return list.map(function (_, i) {
        return (even + (i < leftover ? 1 : 0)) / 100;
      });
    }
    var raw = list.map(function (w) {
      return Math.floor((cents * w) / sum);
    });
    var used = raw.reduce(function (a, b) {
      return a + b;
    }, 0);
    var i = 0;
    while (used < cents && i < raw.length) {
      raw[i] += 1;
      used += 1;
      i += 1;
    }
    return raw.map(function (c) {
      return c / 100;
    });
  }

  function allocateIntByWeights(total, weights) {
    var list = (weights || []).map(function (w) {
      return parseMoney(w);
    });
    if (!list.length) return [];
    var sum = list.reduce(function (a, b) {
      return a + b;
    }, 0);
    var ints = Math.round(Number(total) || 0);
    if (ints <= 0) return list.map(function () { return 0; });
    if (sum <= 0) {
      var even = Math.floor(ints / list.length);
      var leftover = ints - even * list.length;
      return list.map(function (_, i) {
        return even + (i < leftover ? 1 : 0);
      });
    }
    var raw = list.map(function (w) {
      return Math.floor((ints * w) / sum);
    });
    var used = raw.reduce(function (a, b) {
      return a + b;
    }, 0);
    var i = 0;
    while (used < ints && i < raw.length) {
      raw[i] += 1;
      used += 1;
      i += 1;
    }
    return raw;
  }

  function applyOrderBenefits(goods, row, detail) {
    if (!goods || !goods.length) return;
    var coupon = 0;
    var points = 0;
    var paid = 0;
    if (detail && detail.amounts) {
      coupon = parseMoney(detail.amounts.coupon);
      points = parseInt(detail.amounts.points, 10) || 0;
      paid = parseMoney(detail.amounts.paid);
    }
    if (!(coupon > 0)) coupon = readRowMoneyByPref(row, 'couponAmount');
    if (!points) points = Math.round(readRowMoneyByPref(row, 'usedPoints'));
    if (!(paid > 0)) paid = readRowMoneyByPref(row, 'paidAmount');
    var weights = goods.map(function (g) {
      return parseMoney(g.paidAmount) || parseMoney(g.remainAmount);
    });
    var couponParts = allocateByWeights(coupon, weights);
    var cashParts = paid > 0 ? allocateByWeights(paid, weights) : null;
    var pointParts = allocateIntByWeights(points, weights);
    goods.forEach(function (g, idx) {
      g.remainCoupon = couponParts[idx] || 0;
      g.remainPoints = pointParts[idx] || 0;
      if (cashParts) {
        g.remainAmount = cashParts[idx];
        g.paidAmount = cashParts[idx];
      }
    });
  }

  function appendTargetAftersale(target, payload) {
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.appendGoodsAftersale === 'function') {
      window.OrderLiveDetail.appendGoodsAftersale(target.orderId, target.row, payload);
    } else if (target.row) {
      target.row.setAttribute('data-as-status', '待审批');
    }
  }

  function applyBatchAftersales(it) {
    var applied = 0;
    var isOrder = state.batchScope === 'order';
    state.batchTargets.forEach(function (target, idx) {
      var goods = isOrder && target.goods && target.goods.length
        ? target.goods
        : [target.good || {
            name: it.name,
            id: target.good && target.good.id,
            qty: target.qty,
            remainAmount: target.remainAmount,
            remainCoupon: target.remainCoupon,
            remainPoints: target.remainPoints
          }];
      var weights = goods.map(function (g) {
        return parseMoney(g.remainAmount);
      });
      var cashParts = allocateByWeights(target.remainAmount, weights);
      var couponParts = allocateByWeights(
        target.remainCoupon,
        goods.map(function (g) {
          return parseMoney(g.remainCoupon) || parseMoney(g.remainAmount);
        })
      );
      var pointParts = allocateIntByWeights(
        target.remainPoints,
        goods.map(function (g) {
          return parseInt(g.remainPoints, 10) || parseMoney(g.remainAmount);
        })
      );
      goods.forEach(function (good, gi) {
        var refundAmount = cashParts[gi] != null ? cashParts[gi] : parseMoney(target.remainAmount);
        var refundCoupon = couponParts[gi] != null ? couponParts[gi] : parseMoney(target.remainCoupon);
        var refundPoints = pointParts[gi] != null ? pointParts[gi] : (parseInt(target.remainPoints, 10) || 0);
        var asId = 'AS-BATCH-' + Date.now() + '-' + idx + '-' + gi;
        appendTargetAftersale(target, {
          id: asId,
          productName: isOrder ? (good.name || '商品') : it.name,
          goodId: good.id,
          type: '仅退款',
          status: '已完成',
          skipApproval: true,
          returnQty: parseInt(good.qty, 10) || 1,
          refundAmount: '¥' + formatMoney(refundAmount),
          refundCoupon: '¥' + formatMoney(refundCoupon),
          refundPoints: refundPoints,
          adjustAmount: '¥0.00',
          reason: it.reason,
          desc: it.desc
        });
        persistDirectRefund({
          id: 'RF-DIR-' + Date.now() + '-' + idx + '-' + gi,
          orderNo: target.orderId,
          aftersaleId: '',
          orderSource: pageType() === 'proxy' ? '代采' : '零售',
          method: '原路退回',
          source: '批量退款',
          skipApproval: true,
          reason: it.reason || '',
          productName: isOrder ? (good.name || '商品') : it.name,
          status: '退款成功',
          cashAmount: refundAmount,
          actualPaid: refundAmount,
          couponAmount: refundCoupon,
          refundPoints: refundPoints,
          payTxnNo: 'PAY-' + String(target.orderId || '').replace(/\D/g, '').slice(-12),
          refundTxnNo: 'RFN' + Date.now() + pad2(idx) + pad2(gi),
          channel: '微信',
          createdAt: nowText(),
          updatedAt: nowText(),
          completedAt: nowText(),
          remark: it.desc || '',
          proofUrl: '',
          voucherUploaded: false,
          offlineChannel: ''
        });
      });
      var cb = target.row
        ? target.row.querySelector('.js-order-retail-check, .js-order-proxy-check')
        : null;
      if (cb) cb.checked = false;
      applied += 1;
    });
    if (typeof state.onDone === 'function') state.onDone();
    return applied;
  }

  var DIRECT_REFUND_KEY = 'lfRetailDirectRefunds';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function persistDirectRefund(row) {
    if (!row) return;
    var prev = [];
    try {
      prev = JSON.parse(window.localStorage.getItem(DIRECT_REFUND_KEY) || '[]');
    } catch (e) {
      prev = [];
    }
    if (!Array.isArray(prev)) prev = [];
    prev.unshift(row);
    try {
      window.localStorage.setItem(DIRECT_REFUND_KEY, JSON.stringify(prev.slice(0, 80)));
    } catch (e) { /* ignore */ }
  }

  function persistCancelRefund(orderId, row, orderSource) {
    var amount = 0;
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.resolveDetail === 'function') {
      var detail = window.OrderLiveDetail.resolveDetail(orderId, row);
      var paid = detail && detail.amounts && (detail.amounts.paid != null ? detail.amounts.paid : detail.amounts.payable);
      amount = parseMoney(paid);
    }
    persistDirectRefund({
      id: 'RF-CAN-' + Date.now(),
      orderNo: orderId,
      aftersaleId: '',
      orderSource: orderSource || '零售',
      method: '原路退回',
      source: '取消订单',
      skipApproval: true,
      reason: '我不想要了',
      status: '退款成功',
      cashAmount: amount,
      actualPaid: amount,
      payTxnNo: 'PAY-' + String(orderId || '').replace(/\D/g, '').slice(-12),
      refundTxnNo: 'RFN' + Date.now(),
      channel: '微信',
      createdAt: nowText(),
      updatedAt: nowText(),
      completedAt: nowText(),
      remark: '',
      proofUrl: '',
      voucherUploaded: false,
      offlineChannel: ''
    });
  }

  function nowText() {
    var d = new Date();
    function p(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return (
      d.getFullYear() +
      '-' +
      p(d.getMonth() + 1) +
      '-' +
      p(d.getDate()) +
      ' ' +
      p(d.getHours()) +
      ':' +
      p(d.getMinutes()) +
      ':' +
      p(d.getSeconds())
    );
  }

  function readRowMoneyByPref(row, key) {
    var table = row && row.closest('table');
    if (!table || !key) return 0;
    var ths = table.querySelectorAll('thead th');
    for (var i = 0; i < ths.length; i++) {
      if (ths[i].getAttribute('data-preference-key') === key) {
        return parseMoney(row.children[i] && row.children[i].textContent);
      }
    }
    return 0;
  }

  function resolveGoods(orderId, row) {
    var goods = [];
    var detail = null;
    if (global.OrderLiveDetail && typeof global.OrderLiveDetail.resolveDetail === 'function') {
      detail = global.OrderLiveDetail.resolveDetail(orderId, row);
      if (detail && detail.goods && detail.goods.length) {
        goods = detail.goods.map(function (g, idx) {
          var paid = parseMoney(g.subtotal != null ? g.subtotal : g.price);
          var qty = parseInt(g.qty, 10) || 1;
          var unit = parseMoney(g.unitPrice != null ? g.unitPrice : g.price);
          if (!unit && qty) unit = Math.round((paid / qty) * 100) / 100;
          return {
            id: g.id || 'g' + (idx + 1),
            name: g.name || '商品',
            spec: g.spec || '-',
            sku: g.sku || g.spu || '-',
            img: g.img || '../user-app/assets/order-product-1.svg',
            unitPrice: unit,
            qty: qty,
            paidAmount: paid,
            remainAmount: paid,
            remainCoupon: 0,
            remainPoints: 0
          };
        });
      }
    }
    var listPaid = readRowMoneyByPref(row, 'paidAmount');
    var remainSum = goods.reduce(function (sum, g) {
      return sum + parseMoney(g.remainAmount);
    }, 0);
    if (goods.length && listPaid > 0 && !(remainSum > 0)) {
      if (goods.length === 1) {
        goods[0].paidAmount = listPaid;
        goods[0].remainAmount = listPaid;
        if (!goods[0].unitPrice) goods[0].unitPrice = listPaid;
      } else {
        var parts = allocateByWeights(listPaid, goods.map(function () { return 1; }));
        goods.forEach(function (g, idx) {
          g.paidAmount = parts[idx];
          g.remainAmount = parts[idx];
        });
      }
    }
    if (!goods.length) {
      var nameEl = row ? row.querySelector('.order-product-cell__name') : null;
      var thumb = row ? row.querySelector('.order-product-cell__thumb') : null;
      var name = nameEl ? nameEl.textContent.trim().replace(/\s等\d+种$/, '') : '商品';
      var paid = listPaid || 0.02;
      goods = [
        {
          id: 'g1',
          name: name,
          spec: '口味：甜糯',
          sku: 'SKU00148',
          img: thumb ? thumb.getAttribute('src') : '../user-app/assets/order-product-1.svg',
          unitPrice: paid,
          qty: 1,
          paidAmount: paid,
          remainAmount: paid,
          remainCoupon: 0,
          remainPoints: 0
        }
      ];
    }
    applyOrderBenefits(goods, row, detail);
    return goods;
  }

  function reasonsForType(type) {
    if (global.MdmAftersaleReasons && typeof global.MdmAftersaleReasons.getReasonsByType === 'function') {
      return global.MdmAftersaleReasons.getReasonsByType(type);
    }
    return ['质量问题', '卖家发错货'];
  }

  function reasonOptionsHtml(type, selected) {
    var list = reasonsForType(type);
    var html = '<option value="">请选择售后原因</option>';
    list.forEach(function (r) {
      html +=
        '<option value="' +
        escapeHtml(r) +
        '"' +
        (selected === r ? ' selected' : '') +
        '>' +
        escapeHtml(r) +
        '</option>';
    });
    return html;
  }

  function typeOptionsHtml(selected, onlyRefund) {
    var types = onlyRefund ? ['仅退款'] : TYPES;
    return types.map(function (t) {
      return (
        '<option value="' +
        escapeHtml(t) +
        '"' +
        (selected === t ? ' selected' : '') +
        '>' +
        escapeHtml(t) +
        '</option>'
      );
    }).join('');
  }

  var state = {
    orderId: '',
    row: null,
    occurAt: '',
    items: [],
    batch: false,
    batchScope: 'sku',
    batchTargets: [],
    excluded: 0,
    onDone: null
  };

  function closeDrawer() {
    var backdrop = $('orderPlatformAsBackdrop');
    if (backdrop) backdrop.remove();
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderVerifyConfirmBackdrop') &&
      !document.getElementById('orderProxyCancelBackdrop')
    ) {
      document.body.style.overflow = '';
    }
  }

  function syncFooter() {
    var countEl = $('orderAsSelectedCount');
    var totalEl = $('orderAsRefundTotal');
    var selected = state.items.filter(function (it) {
      return it.checked;
    });
    var total = 0;
    if (state.batch) {
      var couponTotal = 0;
      var pointsTotal = 0;
      state.batchTargets.forEach(function (target) {
        total += parseMoney(target.remainAmount);
        couponTotal += parseMoney(target.remainCoupon);
        pointsTotal += parseInt(target.remainPoints, 10) || 0;
      });
      if (countEl) countEl.textContent = String(state.batchTargets.length);
      var couponEl = $('orderAsCouponTotal');
      var pointsEl = $('orderAsPointsTotal');
      if (couponEl) couponEl.textContent = '¥' + formatMoney(couponTotal);
      if (pointsEl) pointsEl.textContent = String(pointsTotal);
    } else {
      selected.forEach(function (it) {
        if (it.type === '补货') return;
        total += parseMoney(it.refundAmount);
      });
      if (countEl) countEl.textContent = String(selected.length);
    }
    if (totalEl) totalEl.textContent = '¥' + formatMoney(total);
  }

  function isBatchDirectForm(it) {
    return !!state.batch || !!(it && it.hideMoneyQty);
  }

  function renderItemForm(it) {
    var type = it.type || '仅退款';
    var isReturn = type === '退货退款';
    var isRestock = type === '补货';
    var hideMoneyQty = isBatchDirectForm(it);
    var midFieldLabel = isRestock ? '补货数量' : '退款金额';
    var midFieldValue = isRestock ? String(it.restockQty || it.qty || 1) : formatMoney(it.refundAmount);
    var midFieldAttr = isRestock
      ? 'data-field="restockQty" inputmode="numeric"'
      : 'data-field="refundAmount" inputmode="decimal"';

    var colsClass = hideMoneyQty
      ? 'order-as-form__row order-as-form__row--2'
      : (isReturn ? 'order-as-form__row order-as-form__row--4' : 'order-as-form__row order-as-form__row--3');

    return (
      '<div class="order-as-form">' +
      (hideMoneyQty
        ? '<p class="order-as-form-hint">仅支持仅退款。各订单优惠券、积分分摊不同，无法统一金额，将按各单可退现金、优惠券、积分分别直接退款。</p>'
        : '') +
      '<div class="' +
      colsClass +
      '">' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>售后类型</span>' +
      (state.batch
        ? '<input class="order-as-field__control" type="text" value="仅退款" readonly>'
        : '<select class="order-as-field__control js-as-type" data-id="' +
          escapeHtml(it.id) +
          '">' +
          typeOptionsHtml(type) +
          '</select>') +
      '</label>' +
      (hideMoneyQty
        ? ''
        : '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>' +
          midFieldLabel +
          '</span>' +
          '<input class="order-as-field__control js-as-mid" type="text" ' +
          midFieldAttr +
          ' data-id="' +
          escapeHtml(it.id) +
          '" value="' +
          escapeHtml(midFieldValue) +
          '"></label>') +
      (!hideMoneyQty && isReturn
        ? '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>退货数量</span>' +
          '<input class="order-as-field__control js-as-return-qty" type="text" inputmode="numeric" data-id="' +
          escapeHtml(it.id) +
          '" value="' +
          escapeHtml(String(it.returnQty || it.qty || 1)) +
          '"></label>'
        : '') +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>' +
      (state.batch ? '退款原因' : '售后原因') +
      '</span>' +
      '<select class="order-as-field__control js-as-reason" data-id="' +
      escapeHtml(it.id) +
      '">' +
      reasonOptionsHtml(type, it.reason) +
      '</select></label>' +
      '</div>' +
      '<div class="order-as-form__row order-as-form__row--desc">' +
      '<label class="order-as-field order-as-field--desc"><span class="order-as-field__label"><i>*</i>售后描述</span>' +
      '<div class="order-as-textarea-wrap">' +
      '<textarea class="order-as-field__control order-as-field__textarea js-as-desc" data-id="' +
      escapeHtml(it.id) +
      '" maxlength="' +
      DESC_MAX +
      '" placeholder="请填写售后描述">' +
      escapeHtml(it.desc || '') +
      '</textarea>' +
      '<span class="order-as-textarea-count js-as-desc-count">' +
      String((it.desc || '').length) +
      ' / ' +
      DESC_MAX +
      '</span></div></label>' +
      '<div class="order-as-field order-as-field--upload"><span class="order-as-field__label"><i>*</i>上传凭证</span>' +
      '<div class="order-as-upload">' +
      '<button type="button" class="order-as-upload__btn js-as-upload" data-id="' +
      escapeHtml(it.id) +
      '" aria-label="上传凭证">+</button>' +
      '<div class="order-as-upload__list js-as-proof-list" data-id="' +
      escapeHtml(it.id) +
      '">' +
      (it.proofs || [])
        .map(function (src, idx) {
          return (
            '<span class="order-as-upload__thumb" data-idx="' +
            idx +
            '"><img src="' +
            escapeHtml(src) +
            '" alt=""><button type="button" class="order-as-upload__remove js-as-proof-remove" data-id="' +
            escapeHtml(it.id) +
            '" data-idx="' +
            idx +
            '">×</button></span>'
          );
        })
        .join('') +
      '</div>' +
      '<p class="order-as-upload__hint">最多上传 ' +
      PROOF_MAX +
      ' 张图片，支持 jpg、png 格式</p>' +
      '</div></div>' +
      '</div>' +
      (isBatchDirectForm(it)
        ? ''
        : '<div class="order-as-item__foot">退还优惠券：¥' +
          formatMoney(it.refundCoupon || 0) +
          '&nbsp;&nbsp;退还积分：' +
          String(it.refundPoints || 0) +
          '</div>') +
      '</div>'
    );
  }

  function readBatchOrderNick(row) {
    var cells = row ? row.querySelectorAll('td') : [];
    return cells[3] ? cells[3].textContent.replace(/\s+/g, ' ').trim() : '-';
  }

  function renderRefundableGoods(goods) {
    var list = goods && goods.length ? goods : [];
    if (!list.length) return '—';
    return (
      '<div class="order-as-order-goods">' +
      list
        .map(function (g) {
          var name = String(g.name || '商品');
          var spec = String(g.spec || '').replace(/^规格：/, '');
          if (spec && name.indexOf(spec) !== -1) spec = '';
          return (
            '<div class="order-as-order-goods__item">' +
            '<span class="order-as-order-goods__name">' +
            escapeHtml(name) +
            '</span>' +
            (spec ? '<span class="order-as-order-goods__spec">' + escapeHtml(spec) + '</span>' : '') +
            '<span class="order-as-order-goods__qty">×' +
            escapeHtml(String(g.qty || 1)) +
            '</span>' +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderOrderBatchTable() {
    var rows = state.batchTargets.map(function (t) {
      return (
        '<tr>' +
        '<td>' + escapeHtml(t.orderId || '-') + '</td>' +
        '<td>' + escapeHtml(readBatchOrderNick(t.row)) + '</td>' +
        '<td>' + renderRefundableGoods(t.goods) + '</td>' +
        '<td>¥' + formatMoney(t.remainAmount) + '</td>' +
        '<td>¥' + formatMoney(t.remainCoupon) + '</td>' +
        '<td>' + escapeHtml(String(t.remainPoints || 0)) + '</td>' +
        '</tr>'
      );
    }).join('');
    return (
      '<div class="order-as-order-batch">' +
      '<table class="order-as-order-table">' +
      '<thead><tr><th>订单号</th><th>用户</th><th>可退商品</th><th>退现金</th><th>退优惠券</th><th>退积分</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>'
    );
  }

  function renderItemCard(it) {
    return (
      '<article class="order-as-item' +
      (it.checked ? ' is-selected' : '') +
      '" data-id="' +
      escapeHtml(it.id) +
      '">' +
      '<div class="order-as-item__head">' +
      (it.lockCheck
        ? ''
        : '<label class="order-as-check">' +
          '<input type="checkbox" class="js-as-check" data-id="' +
          escapeHtml(it.id) +
          '"' +
          (it.checked ? ' checked' : '') +
          '>' +
          '<span class="order-as-check__box" aria-hidden="true"></span>' +
          '</label>') +
      '<img class="order-as-item__thumb" src="' +
      escapeHtml(it.img) +
      '" alt="">' +
      '<div class="order-as-item__meta">' +
      '<div class="order-as-item__meta-col">' +
      '<div class="order-as-kv"><span class="order-as-kv__k">商品名称</span><span class="order-as-kv__v">' +
      escapeHtml(it.name) +
      '</span></div>' +
      '<div class="order-as-kv"><span class="order-as-kv__k">商品单价</span><span class="order-as-kv__v">¥' +
      formatMoney(it.unitPrice) +
      '</span></div>' +
      '<div class="order-as-kv"><span class="order-as-kv__k">剩余可退金额</span><span class="order-as-kv__v">¥' +
      formatMoney(it.remainAmount) +
      '</span></div>' +
      '</div>' +
      '<div class="order-as-item__meta-col">' +
      '<div class="order-as-kv"><span class="order-as-kv__k">商品规格</span><span class="order-as-kv__v">' +
      escapeHtml(it.spec) +
      '</span></div>' +
      '<div class="order-as-kv"><span class="order-as-kv__k">下单数量</span><span class="order-as-kv__v">' +
      escapeHtml(String(it.qty)) +
      '</span></div>' +
      '<div class="order-as-kv"><span class="order-as-kv__k">剩余可退优惠券</span><span class="order-as-kv__v">¥' +
      formatMoney(it.remainCoupon) +
      '</span></div>' +
      '</div>' +
      '<div class="order-as-item__meta-col">' +
      '<div class="order-as-kv"><span class="order-as-kv__k">SKU编码</span><span class="order-as-kv__v">' +
      escapeHtml(it.sku) +
      '</span></div>' +
      '<div class="order-as-kv"><span class="order-as-kv__k">实付金额</span><span class="order-as-kv__v">¥' +
      formatMoney(it.paidAmount) +
      '</span></div>' +
      '<div class="order-as-kv"><span class="order-as-kv__k">剩余可退积分</span><span class="order-as-kv__v">' +
      escapeHtml(String(it.remainPoints || 0)) +
      '</span></div>' +
      '</div>' +
      '</div></div>' +
      (it.checked ? renderItemForm(it) : '') +
      '</article>'
    );
  }

  function findItem(id) {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].id === id) return state.items[i];
    }
    return null;
  }

  function renderList() {
    var list = $('orderAsProductList');
    if (!list) return;
    if (state.batch) {
      var formItem = state.items[0];
      list.innerHTML =
        renderOrderBatchTable() +
        (formItem
          ? '<article class="order-as-item is-selected" data-id="' +
            escapeHtml(formItem.id) +
            '">' +
            renderItemForm(formItem) +
            '</article>'
          : '');
      syncFooter();
      return;
    }
    list.innerHTML = state.items.map(renderItemCard).join('');
    syncFooter();
  }

  function validateAndSubmit() {
    var selected = state.items.filter(function (it) {
      return it.checked;
    });
    if (!selected.length) {
      if (typeof showToast === 'function') showToast('请选择售后商品', 'error');
      return;
    }
    for (var i = 0; i < selected.length; i++) {
      var it = selected[i];
      if (!it.type) {
        if (typeof showToast === 'function') showToast('请选择售后类型', 'error');
        return;
      }
      if (!isBatchDirectForm(it)) {
        if (it.type === '补货') {
          var rq = parseInt(it.restockQty, 10);
          if (!rq || rq < 1) {
            if (typeof showToast === 'function') showToast('请填写补货数量', 'error');
            return;
          }
          if (rq > it.qty) {
            if (typeof showToast === 'function') {
              showToast('补货数量不能超过下单数量（最多' + it.qty + '件）', 'error');
            }
            return;
          }
        } else {
          var amt = parseMoney(it.refundAmount);
          if (!(amt > 0)) {
            if (typeof showToast === 'function') showToast('请填写退款金额', 'error');
            return;
          }
          if (amt > it.remainAmount + 0.0001) {
            if (typeof showToast === 'function') showToast('退款金额不能超过剩余可退金额', 'error');
            return;
          }
        }
        if (it.type === '退货退款') {
          var retQty = parseInt(it.returnQty, 10);
          if (!retQty || retQty < 1) {
            if (typeof showToast === 'function') showToast('请填写退货数量', 'error');
            return;
          }
          if (retQty > it.qty) {
            if (typeof showToast === 'function') showToast('退货数量不能超过下单数量', 'error');
            return;
          }
        }
      }
      if (!it.reason) {
        if (typeof showToast === 'function') showToast('请选择售后原因', 'error');
        return;
      }
      if (!String(it.desc || '').trim()) {
        if (typeof showToast === 'function') showToast('请填写售后描述', 'error');
        return;
      }
      if (!it.proofs || !it.proofs.length) {
        if (typeof showToast === 'function') showToast('请上传凭证图片', 'error');
        return;
      }
    }
    closeDrawer();
    if (state.batch) {
      var count = applyBatchAftersales(selected[0]);
      if (typeof showToast === 'function') {
        showToast(
          state.batchScope === 'order'
            ? '已直接退款 ' + count + ' 笔订单（不走审批）'
            : '已直接退款 ' + count + ' 笔订单的该商品（不走审批）',
          'success'
        );
      }
      return;
    }
    if (typeof showToast === 'function') {
      showToast('平台退款/售后申请已提交（演示）共 ' + selected.length + ' 件商品', 'success');
    }
  }

  function bindDrawerEvents(backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeDrawer();
    });
    backdrop.querySelectorAll('[data-as-close]').forEach(function (btn) {
      btn.addEventListener('click', closeDrawer);
    });
    var cancelBtn = backdrop.querySelector('[data-as-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', closeDrawer);
    var submitBtn = backdrop.querySelector('[data-as-submit]');
    if (submitBtn) submitBtn.addEventListener('click', validateAndSubmit);

    backdrop.addEventListener('change', function (e) {
      var t = e.target;
      var id = t.getAttribute('data-id');
      var it = findItem(id);
      if (!it) return;
      if (t.classList.contains('js-as-check')) {
        it.checked = !!t.checked;
        if (it.checked && !it.type) it.type = '仅退款';
        if (it.checked && it.refundAmount == null) it.refundAmount = it.remainAmount;
        if (it.checked && it.restockQty == null) it.restockQty = it.qty;
        if (it.checked && it.returnQty == null) it.returnQty = it.qty;
        renderList();
        return;
      }
      if (t.classList.contains('js-as-type')) {
        it.type = t.value;
        it.reason = '';
        if (it.type === '补货') {
          it.restockQty = it.restockQty || it.qty;
        } else {
          it.refundAmount = it.refundAmount != null ? it.refundAmount : it.remainAmount;
        }
        if (it.type === '退货退款') it.returnQty = it.returnQty || it.qty;
        renderList();
        return;
      }
      if (t.classList.contains('js-as-reason')) {
        it.reason = t.value;
      }
    });

    backdrop.addEventListener('input', function (e) {
      var t = e.target;
      var id = t.getAttribute('data-id');
      var it = findItem(id);
      if (!it) return;
      if (t.classList.contains('js-as-mid')) {
        if (t.getAttribute('data-field') === 'restockQty') {
          it.restockQty = t.value.replace(/[^\d]/g, '');
          t.value = it.restockQty;
        } else {
          it.refundAmount = t.value;
          syncFooter();
        }
      }
      if (t.classList.contains('js-as-return-qty')) {
        it.returnQty = t.value.replace(/[^\d]/g, '');
        t.value = it.returnQty;
      }
      if (t.classList.contains('js-as-desc')) {
        var val = t.value.slice(0, DESC_MAX);
        it.desc = val;
        t.value = val;
        var card = t.closest('.order-as-item');
        var count = card ? card.querySelector('.js-as-desc-count') : null;
        if (count) count.textContent = val.length + ' / ' + DESC_MAX;
      }
    });

    backdrop.addEventListener('click', function (e) {
      var up = e.target.closest('.js-as-upload');
      if (up) {
        var it = findItem(up.getAttribute('data-id'));
        if (!it) return;
        it.proofs = it.proofs || [];
        if (it.proofs.length >= PROOF_MAX) {
          if (typeof showToast === 'function') showToast('最多上传 ' + PROOF_MAX + ' 张图片', 'warning');
          return;
        }
        it.proofs.push(it.img || '../user-app/assets/order-product-1.svg');
        renderList();
        return;
      }
      var rm = e.target.closest('.js-as-proof-remove');
      if (rm) {
        var item = findItem(rm.getAttribute('data-id'));
        var idx = parseInt(rm.getAttribute('data-idx'), 10);
        if (!item || isNaN(idx)) return;
        item.proofs.splice(idx, 1);
        renderList();
      }
    });
  }

  function normalizeGoodsName(name) {
    return String(name || '').replace(/\s+/g, '').toLowerCase();
  }

  function sumTargetField(list, key) {
    return (list || []).reduce(function (total, item) {
      return total + (key === 'qty' ? (parseInt(item[key], 10) || 0) : parseMoney(item[key]));
    }, 0);
  }

  function buildBatchTargets(sku, targets, scope) {
    var isOrder = scope === 'order';
    return (targets || []).map(function (t) {
      var resolved = resolveGoods(t.orderId, t.row);
      var goods;
      if (isOrder) {
        var allow = {};
        (t.goods || []).forEach(function (g) {
          allow[normalizeGoodsName(g.name)] = true;
        });
        goods = Object.keys(allow).length
          ? resolved.filter(function (g) { return allow[normalizeGoodsName(g.name)]; })
          : resolved.slice();
        if (!goods.length) goods = resolved.slice();
      } else {
        var key = normalizeGoodsName(sku && sku.name);
        var good = null;
        resolved.forEach(function (g) {
          if (good) return;
          if (normalizeGoodsName(g.name) === key) good = g;
        });
        goods = [good || resolved[0] || {}];
      }
      var first = goods[0] || {};
      return {
        orderId: t.orderId,
        row: t.row,
        good: first,
        goods: goods,
        qty: sumTargetField(goods, 'qty') || 1,
        remainAmount: sumTargetField(goods, 'remainAmount'),
        remainCoupon: sumTargetField(goods, 'remainCoupon'),
        remainPoints: (goods || []).reduce(function (total, item) {
          return total + (parseInt(item.remainPoints, 10) || 0);
        }, 0),
        paidAmount: sumTargetField(goods, 'paidAmount'),
        unitPrice: first.unitPrice || 0
      };
    });
  }

  function openDrawer(orderId, row, options) {
    closeDrawer();
    options = options || {};
    state.batch = !!options.batch;
    state.batchScope = options.scope === 'order' ? 'order' : 'sku';
    state.batchTargets = state.batch ? buildBatchTargets(options.sku, options.targets, state.batchScope) : [];
    state.excluded = options.excluded || 0;
    state.onDone = typeof options.onDone === 'function' ? options.onDone : null;
    state.orderId = orderId || (state.batchTargets[0] && state.batchTargets[0].orderId) || '';
    state.row = row || (state.batchTargets[0] && state.batchTargets[0].row) || null;
    state.occurAt = nowText();

    if (state.batch) {
      var sku = options.sku || {};
      var first = state.batchTargets[0] || {};
      var remainTotal = 0;
      var couponTotal = 0;
      var pointsTotal = 0;
      var qtyTotal = 0;
      var paidTotal = 0;
      var skuCount = 0;
      state.batchTargets.forEach(function (t) {
        remainTotal += parseMoney(t.remainAmount);
        couponTotal += parseMoney(t.remainCoupon);
        pointsTotal += parseInt(t.remainPoints, 10) || 0;
        qtyTotal += parseInt(t.qty, 10) || 0;
        paidTotal += parseMoney(t.paidAmount);
        skuCount += (t.goods && t.goods.length) ? t.goods.length : 1;
      });
      var isOrder = state.batchScope === 'order';
      state.items = [{
        id: 'batch-sku',
        name: isOrder ? '整单退款' : (sku.name || first.good.name || '商品'),
        spec: isOrder
          ? ('各订单内可退商品全部退款，共 ' + skuCount + ' 个 SKU')
          : (sku.spec || first.good.spec || '-'),
        sku: isOrder ? '整单' : (sku.sku || first.good.sku || '-'),
        img: sku.img || (first.good && first.good.img) || '../user-app/assets/order-product-1.svg',
        unitPrice: first.unitPrice || 0,
        qty: qtyTotal || 1,
        paidAmount: paidTotal,
        remainAmount: remainTotal,
        remainCoupon: couponTotal,
        remainPoints: pointsTotal,
        checked: true,
        lockCheck: true,
        hideMoneyQty: true,
        type: '仅退款',
        refundAmount: remainTotal,
        batchRemainTotal: remainTotal,
        restockQty: qtyTotal || 1,
        returnQty: qtyTotal || 1,
        reason: '',
        desc: '',
        proofs: [],
        refundCoupon: couponTotal,
        refundPoints: pointsTotal
      }];
    } else {
      var goods = resolveGoods(orderId, row);
      state.items = goods.map(function (g, idx) {
        return {
          id: g.id,
          name: g.name,
          spec: g.spec,
          sku: g.sku,
          img: g.img,
          unitPrice: g.unitPrice,
          qty: g.qty,
          paidAmount: g.paidAmount,
          remainAmount: g.remainAmount,
          remainCoupon: g.remainCoupon,
          remainPoints: g.remainPoints,
          checked: idx === 0,
          type: '仅退款',
          refundAmount: g.remainAmount,
          restockQty: g.qty,
          returnQty: g.qty,
          reason: '',
          desc: '',
          proofs: [],
          refundCoupon: g.remainCoupon || 0,
          refundPoints: g.remainPoints || 0
        };
      });
    }

    var title = state.batch ? '批量退款' : '发起售后';
    var sectionTitle = state.batch ? '退款订单' : '选择售后商品';
    var extraTip = '';
    if (state.batch) {
      extraTip =
        state.batchScope === 'order'
          ? '<div class="order-as-batch-tip" role="note">未筛选商品名称，将为 <strong>' +
            state.batchTargets.length +
            '</strong> 笔订单<strong>整单仅退款</strong>。优惠券、积分按订单分摊，各单退现金/退券/退积分分别计算，提交后直接退款。' +
            (state.excluded
              ? '另已排除 ' + state.excluded + ' 笔（状态不符或商品售后处理中）。'
              : '') +
            '</div>'
          : '<div class="order-as-batch-tip" role="note">将为 <strong>' +
            state.batchTargets.length +
            '</strong> 笔订单的「' +
            escapeHtml((options.sku && options.sku.name) || '商品') +
            '」<strong>仅退款</strong>。同一商品因优惠券、积分分摊不同，各单退现金/退券/退积分分别计算，提交后直接退款。' +
            (state.excluded
              ? '另已排除 ' + state.excluded + ' 笔（无该商品、状态不符或该商品售后处理中）。'
              : '') +
            '</div>';
    }
    var summary = state.batch
      ? '已选 <em id="orderAsSelectedCount">0</em> 笔订单，退现金 <em id="orderAsRefundTotal">¥0.00</em>，退优惠券 <em id="orderAsCouponTotal">¥0.00</em>，退积分 <em id="orderAsPointsTotal">0</em>'
      : '已选 <em id="orderAsSelectedCount">0</em> 个商品，共计退款 <em id="orderAsRefundTotal">¥0.00</em>';

    var backdrop = document.createElement('div');
    backdrop.className = 'store-drawer-backdrop order-as-drawer-backdrop';
    backdrop.id = 'orderPlatformAsBackdrop';
    backdrop.innerHTML =
      '<aside class="store-drawer order-as-drawer" id="orderPlatformAsDrawer" role="dialog" aria-labelledby="orderAsTitle">' +
      '<div class="store-drawer__header order-as-drawer__header">' +
      '<h2 class="store-drawer__title" id="orderAsTitle">' +
      title +
      '</h2>' +
      '<button type="button" class="store-drawer__close" data-as-close aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="store-drawer__body order-as-drawer__body">' +
      extraTip +
      '<div class="order-as-occur">' +
      '<span class="order-as-occur__label">售后发生时间</span>' +
      '<div class="order-as-occur__value">' +
      '<span class="order-as-occur__icon" aria-hidden="true">🕒</span>' +
      '<span id="orderAsOccurAt">' +
      escapeHtml(state.occurAt) +
      '</span></div></div>' +
      '<h3 class="order-as-section-title">' +
      sectionTitle +
      '</h3>' +
      '<div class="order-as-product-list" id="orderAsProductList"></div>' +
      '</div>' +
      '<div class="order-as-drawer__footer">' +
      '<div class="order-as-drawer__summary">' +
      summary +
      '</div>' +
      '<div class="order-as-drawer__actions">' +
      '<button type="button" class="order-detail-btn" data-as-cancel>取消</button>' +
      '<button type="button" class="order-detail-btn order-detail-btn--primary" data-as-submit>提交</button>' +
      '</div></div></aside>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    bindDrawerEvents(backdrop);
    renderList();
    requestAnimationFrame(function () {
      var drawer = $('orderPlatformAsDrawer');
      if (drawer) drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
  }

  global.OrderPlatformAftersale = {
    canCancelOrder: canCancelOrder,
    canPlatformRefund: canPlatformRefund,
    canOpenAftersaleDrawer: canOpenAftersaleDrawer,
    aftersaleActionLabel: aftersaleActionLabel,
    getRowOrderStatus: getRowOrderStatus,
    getFulfillmentKind: getFulfillmentKind,
    persistRefund: persistDirectRefund,
    persistCancelRefund: persistCancelRefund,
    open: openDrawer,
    openBatch: function (opts) {
      openDrawer(null, null, {
        batch: true,
        scope: (opts && opts.scope) || ((opts && opts.sku && opts.sku.name) ? 'sku' : 'order'),
        sku: (opts && opts.sku) || {},
        targets: (opts && opts.targets) || [],
        excluded: (opts && opts.excluded) || 0,
        onDone: opts && opts.onDone
      });
    },
    close: closeDrawer
  };
})(typeof window !== 'undefined' ? window : this);
