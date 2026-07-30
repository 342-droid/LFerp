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
        applyOrderListFilters();
      });
    }

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        applyOrderListFilters();
        if (typeof showToast === 'function') {
          showToast('查询完成（演示）', 'success');
        }
      });
    }
  }

  /** 零售/代采共用：支付渠道；零售另支持履约方式 */
  function applyOrderListFilters() {
    var page = document.body ? document.body.getAttribute('data-order-page') : '';
    var isProxy = page === 'proxy';
    var isRetail = page === 'retail';
    if (!isProxy && !isRetail) return;

    var paySel = document.getElementById('qPayChannel');
    var payChannel = paySel ? (paySel.value || '').trim() : '';
    var deliverySel = document.getElementById('qDeliveryMode');
    var delivery = deliverySel ? (deliverySel.value || '').trim() : '';

    var tbody = document.querySelector('.order-live-table tbody');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr[data-order-id]');
    var visible = 0;
    rows.forEach(function (row) {
      var show = true;
      if (payChannel) {
        var rowPay = row.getAttribute('data-pay-channel') || '';
        show = rowPay === payChannel;
      }
      if (show && isRetail && delivery) {
        var mode = row.getAttribute('data-delivery-mode') || 'pickup';
        show = mode === delivery;
      }
      row.hidden = !show;
      if (show) visible += 1;
    });
    var totalEl = document.querySelector('.order-pagination__total');
    if (totalEl && (payChannel || (isRetail && delivery))) {
      totalEl.textContent = '共 ' + visible + ' 条';
    } else if (totalEl && !payChannel && !(isRetail && delivery)) {
      totalEl.textContent = '共 ' + rows.length + ' 条';
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

  function canCancelRetailOrder(row) {
    if (window.OrderPlatformAftersale) return window.OrderPlatformAftersale.canCancelOrder(row);
    var status = getRowOrderStatus(row);
    var mode = (row.getAttribute('data-delivery-mode') || '') === 'express' ? 'express' : 'pickup';
    if (mode === 'pickup') {
      return ['待支付', '已创建', '待发货', '待收货', '待提货'].indexOf(status) >= 0;
    }
    return ['待支付', '已创建', '已支付', '待发货'].indexOf(status) >= 0;
  }

  function canRetailPlatformRefund(row) {
    if (window.OrderPlatformAftersale) return window.OrderPlatformAftersale.canPlatformRefund(row);
    var status = getRowOrderStatus(row);
    var mode = (row.getAttribute('data-delivery-mode') || '') === 'express' ? 'express' : 'pickup';
    if (mode === 'pickup') return status === '待收货' || status === '待提货';
    return status === '待收货';
  }

  function createRetailActionButton(className, orderId, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'order-live-table__action ' + className;
    btn.setAttribute('data-order-id', orderId);
    btn.textContent = label;
    return btn;
  }

  function normalizeRetailActionCell(row) {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;
    var cell = row.querySelector('.order-live-table__sticky-col');
    if (!cell || cell.dataset.actionsNormalized === '1') return;

    var orderId = row.getAttribute('data-order-id');
    var viewLink = cell.querySelector('.js-order-view');
    var verifyBtn = cell.querySelector('.js-order-verify');
    var uploadBtn = cell.querySelector('.js-retail-upload-express');
    var cancelBtn = cell.querySelector('.js-retail-cancel-order');
    var refundBtn = cell.querySelector('.js-retail-platform-refund');
    var showCancel = canCancelRetailOrder(row);
    var showRefund = canRetailPlatformRefund(row);
    var isExpress = (row.getAttribute('data-delivery-mode') || '') === 'express';
    var showUpload = isExpress && canUploadRetailExpress(row);
    var showVerify = !isExpress && getRowOrderStatus(row) === '待提货';

    var actions = document.createElement('div');
    actions.className = 'order-live-table__actions';

    if (viewLink) actions.appendChild(viewLink);
    if (showVerify) {
      if (verifyBtn) {
        actions.appendChild(verifyBtn);
      } else {
        var verifyNew = document.createElement('button');
        verifyNew.type = 'button';
        verifyNew.className = 'order-live-table__verify js-order-verify';
        verifyNew.setAttribute('data-order-id', orderId);
        verifyNew.textContent = '核销';
        actions.appendChild(verifyNew);
      }
    } else if (verifyBtn) {
      verifyBtn.remove();
    }
    if (showUpload) {
      if (uploadBtn) actions.appendChild(uploadBtn);
      else actions.appendChild(createRetailActionButton('js-retail-upload-express', orderId, '上传快递单'));
    } else if (uploadBtn) {
      uploadBtn.remove();
    }
    if (showCancel) {
      if (cancelBtn) actions.appendChild(cancelBtn);
      else actions.appendChild(createRetailActionButton('js-retail-cancel-order', orderId, '取消订单'));
    } else if (cancelBtn) {
      cancelBtn.remove();
    }
    if (showRefund) {
      if (refundBtn) actions.appendChild(refundBtn);
      else actions.appendChild(createRetailActionButton('js-retail-platform-refund', orderId, '平台退款'));
    } else if (refundBtn) {
      refundBtn.remove();
    }

    cell.innerHTML = '';
    cell.appendChild(actions);
    cell.dataset.actionsNormalized = '1';
  }

  function refreshRetailActionRow(row) {
    var cell = row.querySelector('.order-live-table__sticky-col');
    if (cell) delete cell.dataset.actionsNormalized;
    normalizeRetailActionCell(row);
  }

  function initRetailActionLayout() {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;
    document.querySelectorAll('.order-live-table tbody tr[data-order-id]').forEach(function (row) {
      refreshRetailActionRow(row);
    });
  }

  function showRetailConfirmDialog(options) {
    var exist = document.getElementById(options.backdropId);
    if (exist) exist.remove();
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = options.backdropId;
    backdrop.innerHTML =
      '<div class="order-verify-confirm" role="dialog">' +
      '<h3 class="order-verify-confirm__title">' +
      options.title +
      '</h3>' +
      '<p class="order-verify-confirm__message">' +
      options.message +
      '</p>' +
      '<div class="order-verify-confirm__actions">' +
      '<button type="button" class="order-detail-btn js-retail-dialog-cancel">取消</button>' +
      '<button type="button" class="order-detail-btn order-detail-btn--primary js-retail-dialog-ok">' +
      options.okLabel +
      '</button>' +
      '</div></div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    function close() {
      backdrop.remove();
      if (!document.getElementById('orderDetailBackdrop') && !document.getElementById('orderPlatformAsBackdrop')) {
        document.body.style.overflow = '';
      }
    }
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    backdrop.querySelector('.js-retail-dialog-cancel').addEventListener('click', close);
    backdrop.querySelector('.js-retail-dialog-ok').addEventListener('click', function () {
      close();
      options.onConfirm();
    });
  }

  function initRetailCancelAndRefund() {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;

    document.addEventListener('click', function (e) {
      var cancelBtn = e.target.closest('.js-retail-cancel-order');
      if (cancelBtn) {
        e.preventDefault();
        e.stopPropagation();
        var orderId = cancelBtn.getAttribute('data-order-id');
        var row = cancelBtn.closest('tr');
        if (!orderId || !row) return;
        if (!canCancelRetailOrder(row)) {
          if (typeof showToast === 'function') showToast('当前订单状态不可取消', 'error');
          return;
        }
        showRetailConfirmDialog({
          backdropId: 'orderRetailCancelBackdrop',
          title: '取消订单',
          message:
            '确认取消订单 <strong>' +
            orderId +
            '</strong> 吗？<br>取消后订单将关闭，此操作不可撤销。',
          okLabel: '确认取消',
          onConfirm: function () {
            var statusCell = row.querySelector('td:nth-last-child(2) .order-tag');
            if (statusCell) {
              statusCell.className = 'order-tag order-tag--closed';
              statusCell.textContent = '已关闭';
            }
            refreshRetailActionRow(row);
            if (typeof showToast === 'function') showToast('订单已取消', 'success');
          }
        });
        return;
      }

      var refundBtn = e.target.closest('.js-retail-platform-refund');
      if (refundBtn) {
        e.preventDefault();
        e.stopPropagation();
        var refundOrderId = refundBtn.getAttribute('data-order-id');
        var refundRow = refundBtn.closest('tr');
        if (!refundOrderId || !refundRow) return;
        if (!canRetailPlatformRefund(refundRow)) {
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
      initRetailActionLayout();
      initRetailCancelAndRefund();
    });
  } else {
    initFilter();
    initPagination();
    initVerifyPickup();
    initRetailExpressUpload();
    initRetailBatchExpressUpload();
    initRetailActionLayout();
    initRetailCancelAndRefund();
  }
})();
