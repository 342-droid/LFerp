(function () {
  function isProxyOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'proxy';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfirmReceipt);
  } else {
    initConfirmReceipt();
  }
})();
