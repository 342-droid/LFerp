(function () {
  function initFilter() {
    var expandBtn = document.getElementById('orderFilterExpand');
    var expandLabel = document.getElementById('orderFilterExpandLabel');
    var extraGrid = document.getElementById('orderFilterExtra');
    var resetBtn = document.getElementById('orderFilterReset');
    var queryBtn = document.getElementById('orderFilterQuery');
    var defaultExpanded = extraGrid ? !extraGrid.hidden : false;

    if (expandBtn && extraGrid) {
      expandBtn.classList.toggle('is-expanded', defaultExpanded);
      if (expandLabel) expandLabel.textContent = defaultExpanded ? '收起' : '展开';

      expandBtn.addEventListener('click', function () {
        var expanded = expandBtn.classList.toggle('is-expanded');
        extraGrid.hidden = !expanded;
        if (expandLabel) expandLabel.textContent = expanded ? '收起' : '展开';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = document.getElementById('orderLiveFilterForm');
        if (!form) return;
        form.reset();
        if (extraGrid) {
          extraGrid.hidden = !defaultExpanded;
        }
        if (expandBtn) {
          expandBtn.classList.toggle('is-expanded', defaultExpanded);
        }
        if (expandLabel) expandLabel.textContent = defaultExpanded ? '收起' : '展开';
        applyRetailFilters();
      });
    }

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        applyRetailFilters();
        if (typeof showToast === 'function') {
          showToast('查询完成（演示）', 'success');
        }
      });
    }
  }

  function applyRetailFilters() {
    if (document.body && document.body.getAttribute('data-order-page') === 'proxy') return;
    var deliverySel = document.getElementById('qDeliveryMode');
    if (!deliverySel) return;
    var delivery = (deliverySel.value || '').trim();
    var tbody = document.querySelector('.order-live-table tbody');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr[data-order-id]');
    var visible = 0;
    rows.forEach(function (row) {
      var mode = row.getAttribute('data-delivery-mode') || 'pickup';
      var show = !delivery || mode === delivery;
      row.hidden = !show;
      if (show) visible += 1;
    });
    var totalEl = document.querySelector('.order-pagination__total');
    if (totalEl && delivery) {
      totalEl.textContent = '共 ' + visible + ' 条';
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
    if (document.body && document.body.getAttribute('data-order-page') === 'proxy') return;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-order-verify');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      var orderId = btn.getAttribute('data-order-id');
      var row = btn.closest('tr');
      if (!orderId || !row) return;
      if ((row.getAttribute('data-delivery-mode') || '') === 'express') {
        if (typeof showToast === 'function') showToast('快递订单无需核销', 'warning');
        return;
      }

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

  function getRowOrderStatus(row) {
    var statusEl = row ? row.querySelector('td:nth-last-child(2) .order-tag') : null;
    return statusEl ? statusEl.textContent.trim() : '';
  }

  function getOrderGoods(orderId, row) {
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.resolveDetail === 'function') {
      var detail = window.OrderLiveDetail.resolveDetail(orderId, row);
      if (detail && detail.goods && detail.goods.length) return detail.goods;
    }
    var nameEl = row ? row.querySelector('.order-product-cell__name') : null;
    var name = nameEl ? nameEl.textContent.trim() : '商品';
    return [{ id: 'g1', name: name.replace(/\s等\d+种$/, '') }];
  }

  function canUploadRetailExpress(row) {
    var status = getRowOrderStatus(row);
    if (window.OrderProxyExpress && typeof window.OrderProxyExpress.canUploadExpressStatus === 'function') {
      return window.OrderProxyExpress.canUploadExpressStatus(status, 'retail');
    }
    return !!status && status !== '已完成' && status !== '已关闭' && status !== '已取消';
  }

  function initRetailExpressUpload() {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-retail-upload-express');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      var orderId = btn.getAttribute('data-order-id');
      var row = btn.closest('tr');
      if (!orderId || !row) return;
      if ((row.getAttribute('data-delivery-mode') || '') !== 'express') {
        if (typeof showToast === 'function') showToast('仅快递订单可上传快递单', 'error');
        return;
      }
      if (!canUploadRetailExpress(row)) {
        if (typeof showToast === 'function') showToast('当前订单状态不可上传快递单', 'error');
        return;
      }
      if (!window.OrderProxyExpress) {
        if (typeof showToast === 'function') showToast('快递模块未加载', 'error');
        return;
      }
      window.OrderProxyExpress.openUploadModal(orderId, getOrderGoods(orderId, row));
    });
  }

  function initRetailBatchExpressUpload() {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;

    function openBatch(mode) {
      if (!window.OrderProxyExpress || typeof window.OrderProxyExpress.openBatchUploadModal !== 'function') {
        if (typeof showToast === 'function') showToast('快递模块未加载', 'error');
        return;
      }
      var isDelete = mode === 'delete';
      window.OrderProxyExpress.openBatchUploadModal({
        mode: isDelete ? 'delete' : 'upload',
        hint: isDelete
          ? '按「订单号、商品名称、规格、物流单号」批量删除：一商品一行。同一物流含多商品时，删除其中一条仅移除该商品；若该物流下已无商品则删除整条物流。仅待揽件包裹可删。'
          : '按「订单号、商品名称、规格、物流单号」批量上传：一商品一行。同物流+同订单+不同商品合并为一条物流；同物流+不同订单仅展示本订单商品；四者均一致则跳过。仅适用于履约方式为快递的订单。',
        onSuccess: function () {
          var drawer = document.getElementById('orderDetailDrawer');
          if (drawer && drawer.classList.contains('is-open') && drawer._orderId && window.OrderLiveDetail) {
            /* 详情打开时刷新配送信息 */
            if (typeof window.OrderLiveDetail.refreshOpenDrawer === 'function') {
              window.OrderLiveDetail.refreshOpenDrawer();
            }
          }
        }
      });
    }

    var batchBtn = document.getElementById('orderRetailBatchUpload');
    if (batchBtn) {
      batchBtn.addEventListener('click', function () {
        openBatch('upload');
      });
    }
    var deleteBtn = document.getElementById('orderRetailBatchDelete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        openBatch('delete');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initFilter();
      initPagination();
      initVerifyPickup();
      initRetailExpressUpload();
      initRetailBatchExpressUpload();
    });
  } else {
    initFilter();
    initPagination();
    initVerifyPickup();
    initRetailExpressUpload();
    initRetailBatchExpressUpload();
  }
})();
