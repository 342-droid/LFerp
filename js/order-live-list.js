(function () {
  function initFilter() {
    var expandBtn = document.getElementById('orderFilterExpand');
    var expandLabel = document.getElementById('orderFilterExpandLabel');
    var extraGrid = document.getElementById('orderFilterExtra');
    var resetBtn = document.getElementById('orderFilterReset');
    var queryBtn = document.getElementById('orderFilterQuery');
    if (!expandBtn || !extraGrid) return;

    expandBtn.addEventListener('click', function () {
      var expanded = expandBtn.classList.toggle('is-expanded');
      extraGrid.hidden = !expanded;
      if (expandLabel) expandLabel.textContent = expanded ? '收起' : '展开';
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = document.getElementById('orderLiveFilterForm');
        if (!form) return;
        form.reset();
        extraGrid.hidden = true;
        expandBtn.classList.remove('is-expanded');
        if (expandLabel) expandLabel.textContent = '展开';
      });
    }

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        if (typeof showToast === 'function') {
          showToast('查询完成（演示）', 'success');
        }
      });
    }
  }

  function initPagination() {
    var gotoInput = document.getElementById('orderPageGoto');
    if (gotoInput) {
      gotoInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typeof showToast === 'function') {
            showToast('已跳转至第 ' + (gotoInput.value || '1') + ' 页（演示）', 'success');
          }
        }
      });
    }
  }

  function closeOrderVerifyConfirm() {
    var backdrop = document.getElementById('orderVerifyConfirmBackdrop');
    if (backdrop) backdrop.remove();
    if (!document.getElementById('orderDetailBackdrop')) {
      document.body.style.overflow = '';
    }
  }

  function showOrderVerifyConfirm(orderId, onConfirm) {
    closeOrderVerifyConfirm();
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = 'orderVerifyConfirmBackdrop';
    backdrop.innerHTML =
      '<div class="order-verify-confirm" role="dialog" aria-labelledby="orderVerifyConfirmTitle">' +
        '<h3 id="orderVerifyConfirmTitle" class="order-verify-confirm__title">整单核销确认</h3>' +
        '<p class="order-verify-confirm__message">确认核销订单 <strong>' + orderId + '</strong> 吗？<br>核销后订单内全部商品将标记为已提货，此操作不可撤销。</p>' +
        '<div class="order-verify-confirm__actions">' +
          '<button type="button" class="order-detail-btn js-order-verify-cancel">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-order-verify-ok">确认核销</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeOrderVerifyConfirm();
    });
    backdrop.querySelector('.js-order-verify-cancel').addEventListener('click', closeOrderVerifyConfirm);
    backdrop.querySelector('.js-order-verify-ok').addEventListener('click', function () {
      closeOrderVerifyConfirm();
      onConfirm();
    });
  }

  function updateRowAfterVerify(row) {
    var statusCell = row.querySelector('td:nth-last-child(2) .order-tag');
    if (statusCell) {
      statusCell.className = 'order-tag order-tag--completed';
      statusCell.textContent = '已完成';
    }
    var verifyBtn = row.querySelector('.js-order-verify');
    if (verifyBtn) verifyBtn.remove();
  }

  function initVerifyPickup() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-order-verify');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      var orderId = btn.getAttribute('data-order-id');
      var row = btn.closest('tr');
      if (!orderId || !row) return;

      showOrderVerifyConfirm(orderId, function () {
        var verified = false;
        if (window.OrderLivePickup && typeof window.OrderLivePickup.verifyWholeOrder === 'function') {
          verified = window.OrderLivePickup.verifyWholeOrder(orderId);
        }
        updateRowAfterVerify(row);
        if (typeof showToast === 'function') {
          showToast(verified ? '整单核销成功，订单已完成' : '整单核销成功（演示）', 'success');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initFilter();
      initPagination();
      initVerifyPickup();
    });
  } else {
    initFilter();
    initPagination();
    initVerifyPickup();
  }
})();
