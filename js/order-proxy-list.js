(function () {
  function isProxyOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'proxy';
  }

  function getRowOrderStatus(row) {
    if (window.OrderPlatformAftersale) {
      return window.OrderPlatformAftersale.getRowOrderStatus(row);
    }
    var statusEl = row ? row.querySelector('td:nth-last-child(2) .order-tag') : null;
    return statusEl ? statusEl.textContent.trim() : '';
  }

  function canCancelOrder(row) {
    if (window.OrderPlatformAftersale) return window.OrderPlatformAftersale.canCancelOrder(row);
    var status = getRowOrderStatus(row);
    return ['待支付', '已创建', '已支付', '待发货'].indexOf(status) >= 0;
  }

  function canPlatformRefund(row) {
    if (window.OrderPlatformAftersale) return window.OrderPlatformAftersale.canPlatformRefund(row);
    return getRowOrderStatus(row) === '待收货';
  }

  function canOpenAftersale(row) {
    if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.canOpenAftersaleDrawer === 'function') {
      return window.OrderPlatformAftersale.canOpenAftersaleDrawer(row);
    }
    return canPlatformRefund(row) || (
      window.OrderRetailStatus
        ? window.OrderRetailStatus.isSuccess(getRowOrderStatus(row))
        : getRowOrderStatus(row) === '已完成' || getRowOrderStatus(row) === '交易成功'
    );
  }

  function aftersaleActionLabel(row) {
    if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.aftersaleActionLabel === 'function') {
      return window.OrderPlatformAftersale.aftersaleActionLabel(row);
    }
    var done = window.OrderRetailStatus
      ? window.OrderRetailStatus.isSuccess(getRowOrderStatus(row))
      : getRowOrderStatus(row) === '已完成' || getRowOrderStatus(row) === '交易成功';
    return done ? '发起售后' : '申请售后';
  }

  function createActionButton(className, orderId, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'order-live-table__action ' + className;
    btn.setAttribute('data-order-id', orderId);
    btn.textContent = label;
    return btn;
  }

  function normalizeProxyActionCell(row) {
    var cell = row.querySelector('.order-live-table__sticky-col');
    if (!cell || cell.dataset.actionsNormalized === '1') return;

    var orderId = row.getAttribute('data-order-id');
    var viewLink = cell.querySelector('.js-order-view');
    var uploadBtn = cell.querySelector('.js-proxy-upload-express');
    var trackBtn = cell.querySelector('.js-proxy-track-express');
    var receiptBtn = cell.querySelector('.js-order-confirm-receipt');
    var cancelBtn = cell.querySelector('.js-proxy-cancel-order');
    var refundBtn = cell.querySelector('.js-proxy-platform-refund');
    var showCancel = canCancelOrder(row);
    var showRefund = canOpenAftersale(row);
    var aftersaleLabel = aftersaleActionLabel(row);

    if (trackBtn) trackBtn.remove();
    if (uploadBtn) uploadBtn.remove();

    var actions = document.createElement('div');
    actions.className = 'order-live-table__actions';

    var viewSlot = document.createElement('span');
    viewSlot.className = 'order-live-table__actions-item order-live-table__actions-item--view';
    if (viewLink) viewSlot.appendChild(viewLink);
    actions.appendChild(viewSlot);

    if (receiptBtn) {
      var receiptSlot = document.createElement('span');
      receiptSlot.className = 'order-live-table__actions-item order-live-table__actions-item--receipt';
      receiptSlot.appendChild(receiptBtn);
      actions.appendChild(receiptSlot);
    }

    if (showCancel) {
      var cancelSlot = document.createElement('span');
      cancelSlot.className = 'order-live-table__actions-item order-live-table__actions-item--cancel';
      if (cancelBtn) {
        cancelSlot.appendChild(cancelBtn);
      } else {
        cancelSlot.appendChild(createActionButton('js-proxy-cancel-order', orderId, '取消订单'));
      }
      actions.appendChild(cancelSlot);
    } else if (cancelBtn) {
      cancelBtn.remove();
    }

    if (showRefund) {
      var refundSlot = document.createElement('span');
      refundSlot.className = 'order-live-table__actions-item order-live-table__actions-item--refund';
      if (refundBtn) {
        refundBtn.textContent = aftersaleLabel;
        refundSlot.appendChild(refundBtn);
      } else {
        refundSlot.appendChild(createActionButton('js-proxy-platform-refund', orderId, aftersaleLabel));
      }
      actions.appendChild(refundSlot);
    } else if (refundBtn) {
      refundBtn.remove();
    }

    cell.innerHTML = '';
    cell.appendChild(actions);
    cell.dataset.actionsNormalized = '1';
  }

  function refreshProxyActionRow(row) {
    var cell = row.querySelector('.order-live-table__sticky-col');
    if (cell) delete cell.dataset.actionsNormalized;
    normalizeProxyActionCell(row);
  }

  function initProxyActionLayout() {
    if (!isProxyOrderPage()) return;
    document.querySelectorAll('.order-live-table tbody tr[data-order-id]').forEach(function (row) {
      refreshProxyActionRow(row);
    });
  }

  function closeProxyDialog(backdropId) {
    var backdrop = document.getElementById(backdropId);
    if (backdrop) backdrop.remove();
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderConfirmReceiptBackdrop') &&
      !document.getElementById('orderProxyCancelBackdrop') &&
      !document.getElementById('orderProxyRefundBackdrop') &&
      !document.getElementById('orderProxyBatchUploadBackdrop') &&
      !document.getElementById('orderPlatformAsBackdrop')
    ) {
      document.body.style.overflow = '';
    }
  }

  function hasOpenAftersaleBlockingCancel(orderId, row) {
    if (window.OrderLivePickup && typeof window.OrderLivePickup.hasOpenAftersaleBlockingCancel === 'function') {
      return window.OrderLivePickup.hasOpenAftersaleBlockingCancel(orderId, row);
    }
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.hasOpenAftersaleBlockingCancel === 'function') {
      return window.OrderLiveDetail.hasOpenAftersaleBlockingCancel(orderId, row);
    }
    return false;
  }

  function showProxyConfirmDialog(options) {
    closeProxyDialog(options.backdropId);
    var alertOnly = options.mode === 'alert';
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = options.backdropId;
    backdrop.innerHTML =
      '<div class="order-verify-confirm" role="dialog" aria-labelledby="' +
      options.titleId +
      '">' +
      '<h3 id="' +
      options.titleId +
      '" class="order-verify-confirm__title">' +
      options.title +
      '</h3>' +
      '<p class="order-verify-confirm__message">' +
      options.message +
      '</p>' +
      '<div class="order-verify-confirm__actions">' +
      (alertOnly
        ? ''
        : '<button type="button" class="order-detail-btn js-proxy-dialog-cancel">取消</button>') +
      '<button type="button" class="order-detail-btn order-detail-btn--primary js-proxy-dialog-ok">' +
      (options.okLabel || (alertOnly ? '好的' : '确定')) +
      '</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeProxyDialog(options.backdropId);
    });
    var cancelBtn = backdrop.querySelector('.js-proxy-dialog-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        closeProxyDialog(options.backdropId);
      });
    }
    backdrop.querySelector('.js-proxy-dialog-ok').addEventListener('click', function () {
      closeProxyDialog(options.backdropId);
      if (typeof options.onConfirm === 'function') options.onConfirm();
    });
  }

  function showConfirmReceiptDialog(orderId, onConfirm) {
    showProxyConfirmDialog({
      backdropId: 'orderConfirmReceiptBackdrop',
      titleId: 'orderConfirmReceiptTitle',
      title: '确认收货',
      message:
        '确认订单 <strong>' +
        orderId +
        '</strong> 已收货吗？<br>确认后订单将变为交易成功，此操作不可撤销。',
      okLabel: '确认收货',
      onConfirm: onConfirm
    });
  }

  function updateRowAfterConfirmReceipt(row) {
    var statusCell =
      row.querySelector('.order-status-cell .order-tag') ||
      row.querySelector('td:nth-last-child(2) .order-tag');
    if (statusCell) {
      statusCell.className = 'order-tag order-tag--success';
      statusCell.textContent = '交易成功';
    }
    var btn = row.querySelector('.js-order-confirm-receipt');
    if (btn) btn.remove();
    refreshProxyActionRow(row);
  }

  function updateRowAfterCancel(row) {
    var statusCell =
      row.querySelector('.order-status-cell .order-tag') ||
      row.querySelector('td:nth-last-child(2) .order-tag');
    if (statusCell) {
      statusCell.className = 'order-tag order-tag--failed';
      statusCell.textContent = '交易失败';
    }
    refreshProxyActionRow(row);
  }

  function confirmReceiptInDetail(orderId) {
    if (window.OrderProxyReceipt && typeof window.OrderProxyReceipt.confirmOrder === 'function') {
      window.OrderProxyReceipt.confirmOrder(orderId);
    }
  }

  function initConfirmReceipt() {
    if (!isProxyOrderPage()) return;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-order-confirm-receipt');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      var orderId = btn.getAttribute('data-order-id');
      var row = btn.closest('tr');
      if (!orderId || !row) return;

      showConfirmReceiptDialog(orderId, function () {
        confirmReceiptInDetail(orderId);
        updateRowAfterConfirmReceipt(row);
        if (typeof showToast === 'function') {
          showToast('确认收货成功，订单交易成功', 'success');
        }
      });
    });
  }

  function initExpressListActions() {
    if (!isProxyOrderPage()) return;

    document.addEventListener('click', function (e) {
      var cancelBtn = e.target.closest('.js-proxy-cancel-order');
      if (cancelBtn) {
        e.preventDefault();
        e.stopPropagation();
        var cancelOrderId = cancelBtn.getAttribute('data-order-id');
        var cancelRow = cancelBtn.closest('tr');
        if (!cancelOrderId || !cancelRow) return;
        if (!canCancelOrder(cancelRow)) {
          if (typeof showToast === 'function') showToast('当前订单状态不可取消', 'error');
          return;
        }
        if (hasOpenAftersaleBlockingCancel(cancelOrderId, cancelRow)) {
          showProxyConfirmDialog({
            backdropId: 'orderProxyCancelBlockBackdrop',
            titleId: 'orderProxyCancelBlockTitle',
            title: '无法取消订单',
            message: '当前订单存在处理中售后，暂无法取消订单。',
            mode: 'alert',
            okLabel: '好的'
          });
          return;
        }
        showProxyConfirmDialog({
          backdropId: 'orderProxyCancelBackdrop',
          titleId: 'orderProxyCancelTitle',
          title: '取消订单',
          message:
            '确认取消订单 <strong>' +
            cancelOrderId +
            '</strong> 吗？<br>取消后订单将变为交易失败，此操作不可撤销。',
          okLabel: '确认取消',
          onConfirm: function () {
            updateRowAfterCancel(cancelRow);
            if (typeof showToast === 'function') showToast('订单已取消', 'success');
          }
        });
        return;
      }

      var refundBtn = e.target.closest('.js-proxy-platform-refund');
      if (refundBtn) {
        e.preventDefault();
        e.stopPropagation();
        var refundOrderId = refundBtn.getAttribute('data-order-id');
        var refundRow = refundBtn.closest('tr');
        if (!refundOrderId || !refundRow) return;
        if (!canOpenAftersale(refundRow)) {
          if (typeof showToast === 'function') showToast('当前订单状态不可申请退款', 'error');
          return;
        }
        if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.open === 'function') {
          window.OrderPlatformAftersale.open(refundOrderId, refundRow);
        } else if (typeof showToast === 'function') {
          showToast('发起售后模块未加载', 'error');
        }
      }
    });
  }

  function init() {
    initProxyActionLayout();
    initConfirmReceipt();
    initExpressListActions();
  }

  window.OrderProxyList = {
    refreshActionLayout: initProxyActionLayout,
    canCancelOrder: canCancelOrder,
    canPlatformRefund: canPlatformRefund
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
