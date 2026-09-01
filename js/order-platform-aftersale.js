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

  function resolveGoods(orderId, row) {
    var goods = [];
    if (global.OrderLiveDetail && typeof global.OrderLiveDetail.resolveDetail === 'function') {
      var detail = global.OrderLiveDetail.resolveDetail(orderId, row);
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
    if (!goods.length) {
      var nameEl = row ? row.querySelector('.order-product-cell__name') : null;
      var thumb = row ? row.querySelector('.order-product-cell__thumb') : null;
      var name = nameEl ? nameEl.textContent.trim().replace(/\s等\d+种$/, '') : '商品';
      var paidCell = row ? row.querySelectorAll('td')[12] : null;
      var paid = paidCell ? parseMoney(paidCell.textContent) : 0.02;
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

  function typeOptionsHtml(selected) {
    return TYPES.map(function (t) {
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
    items: []
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
    selected.forEach(function (it) {
      if (it.type === '补货') return;
      total += parseMoney(it.refundAmount);
    });
    if (countEl) countEl.textContent = String(selected.length);
    if (totalEl) totalEl.textContent = '¥' + formatMoney(total);
  }

  function renderItemForm(it) {
    var type = it.type || '仅退款';
    var isReturn = type === '退货退款';
    var isRestock = type === '补货';
    var midFieldLabel = isRestock ? '补货数量' : '退款金额';
    var midFieldValue = isRestock ? String(it.restockQty || it.qty || 1) : formatMoney(it.refundAmount);
    var midFieldAttr = isRestock
      ? 'data-field="restockQty" inputmode="numeric"'
      : 'data-field="refundAmount" inputmode="decimal"';

    var colsClass = isReturn ? 'order-as-form__row order-as-form__row--4' : 'order-as-form__row order-as-form__row--3';

    return (
      '<div class="order-as-form">' +
      '<div class="' +
      colsClass +
      '">' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>售后类型</span>' +
      '<select class="order-as-field__control js-as-type" data-id="' +
      escapeHtml(it.id) +
      '">' +
      typeOptionsHtml(type) +
      '</select></label>' +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>' +
      midFieldLabel +
      '</span>' +
      '<input class="order-as-field__control js-as-mid" type="text" ' +
      midFieldAttr +
      ' data-id="' +
      escapeHtml(it.id) +
      '" value="' +
      escapeHtml(midFieldValue) +
      '"></label>' +
      (isReturn
        ? '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>退货数量</span>' +
          '<input class="order-as-field__control js-as-return-qty" type="text" inputmode="numeric" data-id="' +
          escapeHtml(it.id) +
          '" value="' +
          escapeHtml(String(it.returnQty || it.qty || 1)) +
          '"></label>'
        : '') +
      '<label class="order-as-field"><span class="order-as-field__label"><i>*</i>售后原因</span>' +
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
      '<div class="order-as-item__foot">退还优惠券：¥' +
      formatMoney(it.refundCoupon || 0) +
      '&nbsp;&nbsp;退还积分：' +
      String(it.refundPoints || 0) +
      '</div></div>'
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
      '<label class="order-as-check">' +
      '<input type="checkbox" class="js-as-check" data-id="' +
      escapeHtml(it.id) +
      '"' +
      (it.checked ? ' checked' : '') +
      '>' +
      '<span class="order-as-check__box" aria-hidden="true"></span>' +
      '</label>' +
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

  function openDrawer(orderId, row) {
    closeDrawer();
    var goods = resolveGoods(orderId, row);
    state.orderId = orderId;
    state.row = row;
    state.occurAt = nowText();
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
        refundCoupon: 0,
        refundPoints: 0
      };
    });

    var backdrop = document.createElement('div');
    backdrop.className = 'store-drawer-backdrop order-as-drawer-backdrop';
    backdrop.id = 'orderPlatformAsBackdrop';
    backdrop.innerHTML =
      '<aside class="store-drawer order-as-drawer" id="orderPlatformAsDrawer" role="dialog" aria-labelledby="orderAsTitle">' +
      '<div class="store-drawer__header order-as-drawer__header">' +
      '<h2 class="store-drawer__title" id="orderAsTitle">发起售后</h2>' +
      '<button type="button" class="store-drawer__close" data-as-close aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="store-drawer__body order-as-drawer__body">' +
      '<div class="order-as-occur">' +
      '<span class="order-as-occur__label">售后发生时间</span>' +
      '<div class="order-as-occur__value">' +
      '<span class="order-as-occur__icon" aria-hidden="true">🕒</span>' +
      '<span id="orderAsOccurAt">' +
      escapeHtml(state.occurAt) +
      '</span></div></div>' +
      '<h3 class="order-as-section-title">选择售后商品</h3>' +
      '<div class="order-as-product-list" id="orderAsProductList"></div>' +
      '</div>' +
      '<div class="order-as-drawer__footer">' +
      '<div class="order-as-drawer__summary">已选 <em id="orderAsSelectedCount">0</em> 个商品，共计退款 <em id="orderAsRefundTotal">¥0.00</em></div>' +
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
    open: openDrawer,
    close: closeDrawer
  };
})(typeof window !== 'undefined' ? window : this);
