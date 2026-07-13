(function () {
  var UPLOAD_LABEL = '上传快递单';
  var UPLOADABLE_STATUSES = ['已创建', '待收货'];

  function isProxyOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'proxy';
  }

  function getOrderGoods(orderId, row) {
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.resolveDetail === 'function') {
      var detail = window.OrderLiveDetail.resolveDetail(orderId, row);
      if (detail && detail.goods && detail.goods.length) {
        return detail.goods;
      }
    }
    var nameEl = row ? row.querySelector('.order-product-cell__name') : null;
    var name = nameEl ? nameEl.textContent.trim() : '商品';
    return [{ id: 'g1', name: name.replace(/\s等\d+种$/, '') }];
  }

  function getRowOrderStatus(row) {
    var statusEl = row ? row.querySelector('td:nth-last-child(2) .order-tag') : null;
    return statusEl ? statusEl.textContent.trim() : '';
  }

  function isStoreFulfillment(orderId, row) {
    if (!window.OrderProxyExpress) return false;
    return window.OrderProxyExpress.getFulfillmentMode(orderId, row) === 'STORE';
  }

  function canUploadExpress(row) {
    return UPLOADABLE_STATUSES.indexOf(getRowOrderStatus(row)) >= 0;
  }

  function createUploadButton(orderId) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'order-live-table__express js-proxy-upload-express';
    btn.setAttribute('data-order-id', orderId);
    btn.textContent = UPLOAD_LABEL;
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
    var isStore = isStoreFulfillment(orderId, row);
    var showUpload = isStore && canUploadExpress(row);

    if (trackBtn) trackBtn.remove();

    var actions = document.createElement('div');
    actions.className = 'order-live-table__actions';
    if (receiptBtn) {
      actions.classList.add('has-receipt');
    } else if (showUpload) {
      actions.classList.add('has-upload-only');
    }

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

    var uploadSlot = document.createElement('span');
    uploadSlot.className = 'order-live-table__actions-item order-live-table__actions-item--upload';
    if (showUpload) {
      if (uploadBtn) {
        uploadBtn.textContent = UPLOAD_LABEL;
        uploadSlot.appendChild(uploadBtn);
      } else {
        uploadSlot.appendChild(createUploadButton(orderId));
      }
    } else if (uploadBtn) {
      uploadBtn.remove();
    }
    actions.appendChild(uploadSlot);

    cell.innerHTML = '';
    cell.appendChild(actions);
    cell.dataset.actionsNormalized = '1';
  }

  function hideUploadButton(row) {
    var uploadBtn = row.querySelector('.js-proxy-upload-express');
    if (uploadBtn) uploadBtn.remove();
    var uploadSlot = row.querySelector('.order-live-table__actions-item--upload');
    if (uploadSlot) uploadSlot.innerHTML = '';
  }

  function initProxyActionLayout() {
    if (!isProxyOrderPage()) return;
    document.querySelectorAll('.order-live-table tbody tr[data-order-id]').forEach(function (row) {
      var cell = row.querySelector('.order-live-table__sticky-col');
      if (cell) delete cell.dataset.actionsNormalized;
      normalizeProxyActionCell(row);
    });
  }

  function closeConfirmReceipt() {
    var backdrop = document.getElementById('orderConfirmReceiptBackdrop');
    if (backdrop) backdrop.remove();
    if (!document.getElementById('orderDetailBackdrop')) {
      document.body.style.overflow = '';
    }
  }

  function showConfirmReceiptDialog(orderId, onConfirm) {
    closeConfirmReceipt();
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = 'orderConfirmReceiptBackdrop';
    backdrop.innerHTML =
      '<div class="order-verify-confirm" role="dialog" aria-labelledby="orderConfirmReceiptTitle">' +
        '<h3 id="orderConfirmReceiptTitle" class="order-verify-confirm__title">确认收货</h3>' +
        '<p class="order-verify-confirm__message">确认订单 <strong>' + orderId + '</strong> 已收货吗？<br>确认后订单将标记为已完成，此操作不可撤销。</p>' +
        '<div class="order-verify-confirm__actions">' +
          '<button type="button" class="order-detail-btn js-order-confirm-receipt-cancel">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-order-confirm-receipt-ok">确认收货</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeConfirmReceipt();
    });
    backdrop.querySelector('.js-order-confirm-receipt-cancel').addEventListener('click', closeConfirmReceipt);
    backdrop.querySelector('.js-order-confirm-receipt-ok').addEventListener('click', function () {
      closeConfirmReceipt();
      onConfirm();
    });
  }

  function updateRowAfterConfirmReceipt(row) {
    var statusCell = row.querySelector('td:nth-last-child(2) .order-tag');
    if (statusCell) {
      statusCell.className = 'order-tag order-tag--completed';
      statusCell.textContent = '已完成';
    }
    var btn = row.querySelector('.js-order-confirm-receipt');
    if (btn) btn.remove();
    hideUploadButton(row);
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
          showToast('确认收货成功，订单已完成', 'success');
        }
      });
    });
  }

  function initExpressListActions() {
    if (!isProxyOrderPage()) return;

    document.addEventListener('click', function (e) {
      var uploadBtn = e.target.closest('.js-proxy-upload-express');
      if (!uploadBtn) return;
      e.preventDefault();
      e.stopPropagation();

      var orderId = uploadBtn.getAttribute('data-order-id');
      var row = uploadBtn.closest('tr');
      if (!orderId || !row || !window.OrderProxyExpress) return;
      if (!isStoreFulfillment(orderId, row)) {
        if (typeof showToast === 'function') showToast('仓配订单无需上传快递单', 'error');
        return;
      }
      if (!canUploadExpress(row)) {
        if (typeof showToast === 'function') showToast('当前订单状态不可上传快递单', 'error');
        return;
      }
      window.OrderProxyExpress.openUploadModal(orderId, getOrderGoods(orderId, row));
    });
  }

  function init() {
    initProxyActionLayout();
    initConfirmReceipt();
    initExpressListActions();
  }

  window.OrderProxyList = {
    refreshActionLayout: initProxyActionLayout,
    canUploadExpress: canUploadExpress
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
