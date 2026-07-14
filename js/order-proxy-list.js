(function () {
  var UPLOAD_LABEL = '上传快递单';
  var UPLOADABLE_STATUSES = ['已创建', '待收货'];
  var CANCELLABLE_STATUSES = ['已支付', '待发货', '待收货'];
  var REFUNDABLE_STATUSES = ['待收货'];

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

  function canCancelOrder(row) {
    return CANCELLABLE_STATUSES.indexOf(getRowOrderStatus(row)) >= 0;
  }

  function canPlatformRefund(row) {
    return REFUNDABLE_STATUSES.indexOf(getRowOrderStatus(row)) >= 0;
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
    var isStore = isStoreFulfillment(orderId, row);
    var showUpload = isStore && canUploadExpress(row);
    var showCancel = canCancelOrder(row);
    var showRefund = canPlatformRefund(row);

    if (trackBtn) trackBtn.remove();

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

    if (showUpload) {
      var uploadSlot = document.createElement('span');
      uploadSlot.className = 'order-live-table__actions-item order-live-table__actions-item--upload';
      if (uploadBtn) {
        uploadBtn.textContent = UPLOAD_LABEL;
        uploadSlot.appendChild(uploadBtn);
      } else {
        uploadSlot.appendChild(createActionButton('js-proxy-upload-express', orderId, UPLOAD_LABEL));
      }
      actions.appendChild(uploadSlot);
    } else if (uploadBtn) {
      uploadBtn.remove();
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
        refundSlot.appendChild(refundBtn);
      } else {
        refundSlot.appendChild(createActionButton('js-proxy-platform-refund', orderId, '平台退款'));
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

  function hideUploadButton(row) {
    var uploadBtn = row.querySelector('.js-proxy-upload-express');
    if (uploadBtn) uploadBtn.remove();
    var uploadSlot = row.querySelector('.order-live-table__actions-item--upload');
    if (uploadSlot) uploadSlot.remove();
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
    if (!document.getElementById('orderDetailBackdrop') && !document.getElementById('orderConfirmReceiptBackdrop') &&
        !document.getElementById('orderProxyCancelBackdrop') && !document.getElementById('orderProxyRefundBackdrop') &&
        !document.getElementById('orderProxyBatchUploadBackdrop')) {
      document.body.style.overflow = '';
    }
  }

  function showProxyConfirmDialog(options) {
    closeProxyDialog(options.backdropId);
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = options.backdropId;
    backdrop.innerHTML =
      '<div class="order-verify-confirm" role="dialog" aria-labelledby="' + options.titleId + '">' +
        '<h3 id="' + options.titleId + '" class="order-verify-confirm__title">' + options.title + '</h3>' +
        '<p class="order-verify-confirm__message">' + options.message + '</p>' +
        '<div class="order-verify-confirm__actions">' +
          '<button type="button" class="order-detail-btn js-proxy-dialog-cancel">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-proxy-dialog-ok">' + options.okLabel + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeProxyDialog(options.backdropId);
    });
    backdrop.querySelector('.js-proxy-dialog-cancel').addEventListener('click', function () {
      closeProxyDialog(options.backdropId);
    });
    backdrop.querySelector('.js-proxy-dialog-ok').addEventListener('click', function () {
      closeProxyDialog(options.backdropId);
      options.onConfirm();
    });
  }

  function showConfirmReceiptDialog(orderId, onConfirm) {
    showProxyConfirmDialog({
      backdropId: 'orderConfirmReceiptBackdrop',
      titleId: 'orderConfirmReceiptTitle',
      title: '确认收货',
      message: '确认订单 <strong>' + orderId + '</strong> 已收货吗？<br>确认后订单将标记为已完成，此操作不可撤销。',
      okLabel: '确认收货',
      onConfirm: onConfirm
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
    refreshProxyActionRow(row);
  }

  function updateRowAfterCancel(row) {
    var statusCell = row.querySelector('td:nth-last-child(2) .order-tag');
    if (statusCell) {
      statusCell.className = 'order-tag order-tag--closed';
      statusCell.textContent = '已关闭';
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
          showToast('确认收货成功，订单已完成', 'success');
        }
      });
    });
  }

  function initExpressListActions() {
    if (!isProxyOrderPage()) return;

    document.addEventListener('click', function (e) {
      var uploadBtn = e.target.closest('.js-proxy-upload-express');
      if (uploadBtn) {
        e.preventDefault();
        e.stopPropagation();
        var orderId = uploadBtn.getAttribute('data-order-id');
        var row = uploadBtn.closest('tr');
        if (!orderId || !row || !window.OrderProxyExpress) return;
        if (!isStoreFulfillment(orderId, row)) {
          if (typeof showToast === 'function') showToast('平台配送订单无需上传快递单', 'error');
          return;
        }
        if (!canUploadExpress(row)) {
          if (typeof showToast === 'function') showToast('当前订单状态不可上传快递单', 'error');
          return;
        }
        window.OrderProxyExpress.openUploadModal(orderId, getOrderGoods(orderId, row));
        return;
      }

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
        showProxyConfirmDialog({
          backdropId: 'orderProxyCancelBackdrop',
          titleId: 'orderProxyCancelTitle',
          title: '取消订单',
          message: '确认取消订单 <strong>' + cancelOrderId + '</strong> 吗？<br>取消后订单将关闭，此操作不可撤销。',
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
        if (!canPlatformRefund(refundRow)) {
          if (typeof showToast === 'function') showToast('当前订单状态不可申请退款', 'error');
          return;
        }
        showProxyConfirmDialog({
          backdropId: 'orderProxyRefundBackdrop',
          titleId: 'orderProxyRefundTitle',
          title: '平台退款',
          message: '确认为订单 <strong>' + refundOrderId + '</strong> 发起平台退款吗？<br>提交后将进入平台退款流程。',
          okLabel: '确认退款',
          onConfirm: function () {
            if (typeof showToast === 'function') showToast('平台退款申请已提交', 'success');
          }
        });
      }
    });
  }

  function downloadBatchExpressTemplate() {
    var csv =
      '\uFEFF订单号,物流单号,快递公司\n' +
      'ORD-3212689201588561,773075059702651,申通快递\n' +
      'ORD-3212689201599001,SF1234567890123,顺丰速运\n';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '批量上传快递单模板.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openBatchExpressUploadModal() {
    closeProxyDialog('orderProxyBatchUploadBackdrop');
    var backdrop = document.createElement('div');
    backdrop.className = 'order-proxy-express-overlay';
    backdrop.id = 'orderProxyBatchUploadBackdrop';
    backdrop.innerHTML =
      '<div class="order-proxy-upload-modal order-proxy-batch-upload-modal" role="dialog" aria-labelledby="orderProxyBatchUploadTitle">' +
        '<div class="order-proxy-upload-modal__head">' +
          '<h3 id="orderProxyBatchUploadTitle" class="order-proxy-upload-modal__title">批量上传快递单</h3>' +
          '<button type="button" class="order-proxy-upload-modal__close js-proxy-batch-close" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__body">' +
          '<p class="order-proxy-upload-modal__hint">通过 Excel / CSV 批量上传快递单号。请先下载模板，按「订单号、物流单号、快递公司」填写后上传。</p>' +
          '<div class="order-proxy-batch-upload__template">' +
            '<button type="button" class="order-proxy-upload-field__link js-proxy-batch-template">下载导入模板</button>' +
          '</div>' +
          '<div class="order-proxy-upload-field">' +
            '<label class="order-proxy-upload-field__label" for="orderProxyBatchFile">上传文件</label>' +
            '<div class="order-proxy-batch-upload__file-row">' +
              '<input type="file" id="orderProxyBatchFile" class="order-proxy-batch-upload__file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv">' +
              '<span class="order-proxy-batch-upload__file-name js-proxy-batch-file-name">未选择文件</span>' +
            '</div>' +
            '<p class="order-proxy-upload-field__auto-hint">支持 .xlsx / .xls / .csv，单次建议不超过 1000 条</p>' +
          '</div>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__foot">' +
          '<button type="button" class="order-detail-btn js-proxy-batch-close">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-proxy-batch-submit">确认上传</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    var fileInput = backdrop.querySelector('#orderProxyBatchFile');
    var fileNameEl = backdrop.querySelector('.js-proxy-batch-file-name');

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeProxyDialog('orderProxyBatchUploadBackdrop');
    });
    backdrop.querySelectorAll('.js-proxy-batch-close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeProxyDialog('orderProxyBatchUploadBackdrop');
      });
    });
    backdrop.querySelector('.js-proxy-batch-template').addEventListener('click', function () {
      downloadBatchExpressTemplate();
      if (typeof showToast === 'function') showToast('模板已下载', 'success');
    });
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (fileNameEl) fileNameEl.textContent = file ? file.name : '未选择文件';
      });
    }
    backdrop.querySelector('.js-proxy-batch-submit').addEventListener('click', function () {
      var file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) {
        if (typeof showToast === 'function') showToast('请先选择 Excel 文件', 'error');
        return;
      }
      var name = String(file.name || '').toLowerCase();
      if (!/\.(xlsx|xls|csv)$/.test(name)) {
        if (typeof showToast === 'function') showToast('请上传 .xlsx / .xls / .csv 文件', 'error');
        return;
      }
      closeProxyDialog('orderProxyBatchUploadBackdrop');
      if (typeof showToast === 'function') {
        showToast('已解析「' + file.name + '」并完成快递单号批量上传（演示）', 'success');
      }
    });
  }

  function initTableToolbar() {
    if (!isProxyOrderPage()) return;

    var batchBtn = document.getElementById('orderProxyBatchUpload');
    if (batchBtn) {
      batchBtn.addEventListener('click', openBatchExpressUploadModal);
    }
  }

  function init() {
    initProxyActionLayout();
    initConfirmReceipt();
    initExpressListActions();
    initTableToolbar();
  }

  window.OrderProxyList = {
    refreshActionLayout: initProxyActionLayout,
    canUploadExpress: canUploadExpress,
    canCancelOrder: canCancelOrder,
    canPlatformRefund: canPlatformRefund
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
