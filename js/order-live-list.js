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
        resetOrderFilterSwitches();
        resetOrderStatusMulti();
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

    initOrderFilterSwitches();
    initOrderStatusMulti();
  }

  function closeOrderFilterSwitches(except) {
    document.querySelectorAll('.order-filter-switch.is-open').forEach(function (sw) {
      if (except && sw === except) return;
      sw.classList.remove('is-open');
      var trigger = sw.querySelector('.order-filter-switch__trigger');
      var menu = sw.querySelector('.order-filter-switch__menu');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
    });
  }

  function applyOrderFilterSwitchValue(sw, item) {
    if (!sw || !item) return;
    var text = (item.textContent || '').replace(/\s+/g, '');
    var placeholder = item.getAttribute('data-placeholder') || ('请输入' + text);
    var value = item.getAttribute('data-value') || '';
    var labelEl = sw.querySelector('.order-filter-switch__text');
    var hidden = sw.querySelector('input[type="hidden"]');
    var input = sw.parentElement ? sw.parentElement.querySelector('.order-filter-field__input') : null;
    if (labelEl) labelEl.textContent = text;
    if (hidden) hidden.value = value;
    if (input) {
      input.placeholder = placeholder;
      input.setAttribute('aria-label', text);
    }
    sw.querySelectorAll('.order-filter-switch__item').forEach(function (btn) {
      var active = btn === item;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function resetOrderFilterSwitches() {
    document.querySelectorAll('.order-filter-switch').forEach(function (sw) {
      var first = sw.querySelector('.order-filter-switch__item');
      applyOrderFilterSwitchValue(sw, first);
    });
    closeOrderFilterSwitches();
  }

  function initOrderFilterSwitches() {
    var switches = document.querySelectorAll('.order-filter-switch');
    if (!switches.length) return;

    switches.forEach(function (sw) {
      var trigger = sw.querySelector('.order-filter-switch__trigger');
      var menu = sw.querySelector('.order-filter-switch__menu');
      if (!trigger || !menu) return;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var willOpen = !sw.classList.contains('is-open');
        closeOrderFilterSwitches();
        closeOrderStatusMulti();
        if (willOpen) {
          sw.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          menu.hidden = false;
        }
      });

      menu.addEventListener('click', function (e) {
        var item = e.target.closest('.order-filter-switch__item');
        if (!item) return;
        e.preventDefault();
        applyOrderFilterSwitchValue(sw, item);
        closeOrderFilterSwitches();
      });
    });

    if (!document.body.dataset.orderFilterSwitchBound) {
      document.body.dataset.orderFilterSwitchBound = '1';
      document.addEventListener('click', function (e) {
        if (e.target.closest('.order-filter-switch')) return;
        closeOrderFilterSwitches();
        if (!e.target.closest('.order-filter-multi')) closeOrderStatusMulti();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeOrderFilterSwitches();
          closeOrderStatusMulti();
        }
      });
    }
  }

  var RETURN_REFUND_FILTER_LABEL = '发起退货/退款';
  var RETURN_REFUND_AFTERSALE_STATUSES = [
    '待审核',
    '待审批',
    '退货中',
    '待退货',
    '退款中',
    '退款异常',
    '退货成功',
    '退款成功'
  ];

  function getSelectedOrderStatusLabels() {
    return Array.prototype.slice
      .call(document.querySelectorAll('#qOrderStatusMulti .js-order-status-opt:checked'))
      .map(function (cb) {
        return cb.getAttribute('data-label') || cb.value;
      });
  }

  function isReturnRefundAftersaleText(text) {
    var s = String(text || '').replace(/\s+/g, '');
    if (!s) return false;
    return RETURN_REFUND_AFTERSALE_STATUSES.some(function (status) {
      return s === status || s.indexOf(status) >= 0;
    });
  }

  function getRowAftersaleStatus(row) {
    if (!row) return '';
    var attr = (row.getAttribute('data-as-status') || row.getAttribute('data-demo-as') || '').trim();
    if (attr) return attr;
    var tag = row.querySelector('.order-detail-goods-as-tag');
    if (tag) return tag.textContent.replace(/\s+/g, '');
    var orderId = row.getAttribute('data-order-id');
    if (orderId && window.OrderLiveDetail && typeof window.OrderLiveDetail.getOrderAftersaleStatus === 'function') {
      return window.OrderLiveDetail.getOrderAftersaleStatus(orderId, row) || '';
    }
    return '';
  }

  function rowHasReturnRefundAftersale(row) {
    if (!row) return false;
    if (isReturnRefundAftersaleText(getRowAftersaleStatus(row))) return true;
    var tags = row.querySelectorAll('.order-detail-goods-as-tag');
    for (var i = 0; i < tags.length; i++) {
      if (isReturnRefundAftersaleText(tags[i].textContent)) return true;
    }
    return false;
  }

  function closeOrderStatusMulti() {
    var box = document.getElementById('qOrderStatusMulti');
    if (!box) return;
    box.classList.remove('is-open');
    var trigger = box.querySelector('.order-filter-multi__trigger');
    var menu = box.querySelector('.order-filter-multi__menu');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  }

  function syncOrderStatusMulti() {
    var box = document.getElementById('qOrderStatusMulti');
    if (!box) return;
    var opts = Array.prototype.slice.call(box.querySelectorAll('.js-order-status-opt'));
    var checked = opts.filter(function (cb) {
      return cb.checked;
    });
    var all = box.querySelector('.js-order-status-all');
    if (all) {
      all.checked = opts.length > 0 && checked.length === opts.length;
      all.indeterminate = checked.length > 0 && checked.length < opts.length;
    }
    var valueEl = box.querySelector('.order-filter-multi__value');
    if (valueEl) {
      if (!checked.length) {
        valueEl.textContent = box.getAttribute('data-placeholder') || '全部';
        valueEl.classList.add('is-placeholder');
      } else {
        valueEl.textContent = checked
          .map(function (cb) {
            return cb.getAttribute('data-label') || cb.value;
          })
          .join('、');
        valueEl.classList.remove('is-placeholder');
      }
    }
  }

  function resetOrderStatusMulti() {
    var box = document.getElementById('qOrderStatusMulti');
    if (!box) return;
    box.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = false;
      cb.indeterminate = false;
    });
    syncOrderStatusMulti();
    closeOrderStatusMulti();
  }

  function initOrderStatusMulti() {
    var box = document.getElementById('qOrderStatusMulti');
    if (!box || box.dataset.bound === '1') return;
    box.dataset.bound = '1';
    var trigger = box.querySelector('.order-filter-multi__trigger');
    var menu = box.querySelector('.order-filter-multi__menu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !box.classList.contains('is-open');
      closeOrderFilterSwitches();
      closeOrderStatusMulti();
      if (willOpen) {
        box.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
      }
    });

    menu.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    menu.addEventListener('change', function (e) {
      var all = e.target.closest('.js-order-status-all');
      if (all) {
        box.querySelectorAll('.js-order-status-opt').forEach(function (cb) {
          cb.checked = all.checked;
        });
      }
      syncOrderStatusMulti();
    });

    syncOrderStatusMulti();
  }

  /** 零售/代采共用：支付渠道、下单门店；零售另支持履约方式 */
  function applyOrderListFilters() {
    var page = document.body ? document.body.getAttribute('data-order-page') : '';
    var isProxy = page === 'proxy';
    var isRetail = page === 'retail';
    if (!isProxy && !isRetail) return;

    var paySel = document.getElementById('qPayChannel');
    var payChannel = paySel ? (paySel.value || '').trim() : '';
    var deliverySel = document.getElementById('qDeliveryMode');
    var delivery = deliverySel ? (deliverySel.value || '').trim() : '';
    var sceneSel = document.getElementById('qOrderScene');
    var scene = isRetail && sceneSel ? (sceneSel.value || '').trim() : '';
    var storeSel = document.getElementById('qStore');
    var store = storeSel ? (storeSel.value || '').trim() : '';
    var statusLabels = getSelectedOrderStatusLabels();

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
      if (show && scene) {
        var sceneEl = row.querySelector('.order-scene');
        var sceneText = sceneEl ? sceneEl.textContent.replace(/\s+/g, '') : '';
        var sceneLabel = scene === 'live' ? '直播' : scene === 'mall' ? '商城' : '';
        show = !!(sceneLabel && sceneText.indexOf(sceneLabel) >= 0);
      }
      if (show && store) {
        var rowStore = (row.getAttribute('data-store') || '').trim();
        show = rowStore === store;
      }
      if (show && statusLabels.length) {
        var orderStatuses = statusLabels.filter(function (label) {
          return label !== RETURN_REFUND_FILTER_LABEL;
        });
        var wantAftersale = statusLabels.indexOf(RETURN_REFUND_FILTER_LABEL) >= 0;
        var matchOrder = orderStatuses.length > 0 && orderStatuses.indexOf(getRowOrderStatus(row)) >= 0;
        var matchAftersale = wantAftersale && rowHasReturnRefundAftersale(row);
        show = matchOrder || matchAftersale;
      }
      row.hidden = !show;
      if (!show) {
        var hiddenCheck = row.querySelector('.js-order-retail-check, .js-order-proxy-check');
        if (hiddenCheck) hiddenCheck.checked = false;
      }
      if (show) visible += 1;
    });
    var totalEl = document.querySelector('.order-pagination__total');
    var hasFilter = !!(payChannel || (isRetail && delivery) || scene || store || statusLabels.length);
    if (totalEl && hasFilter) {
      totalEl.textContent = '共 ' + visible + ' 条';
    } else if (totalEl && !hasFilter) {
      totalEl.textContent = '共 ' + rows.length + ' 条';
    }
    syncOrderExportChecks();
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

  /**
   * 核销确认弹窗
   * options: { title, message, variant: 'refund'|'' }
   * 存在进行中退款售后时用 variant=refund，文案对齐设计稿
   */
  function showOrderVerifyConfirm(orderId, onConfirm, options) {
    options = options || {};
    closeOrderVerifyConfirm();
    var isRefundWarn = options.variant === 'refund';
    var title = options.title || (isRefundWarn ? '确认核销' : '整单核销确认');
    var message = options.message || (
      isRefundWarn
        ? '当前商品存在退款申请，核销后将关闭退款，是否已与客户确认？'
        : ('确认核销订单 <strong>' + orderId + '</strong> 吗？<br>核销后订单内全部商品将标记为已提货，此操作不可撤销。')
    );
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = 'orderVerifyConfirmBackdrop';
    backdrop.innerHTML =
      '<div class="order-verify-confirm' + (isRefundWarn ? ' order-verify-confirm--refund' : '') +
        '" role="dialog" aria-labelledby="orderVerifyConfirmTitle">' +
        '<h3 id="orderVerifyConfirmTitle" class="order-verify-confirm__title">' + title + '</h3>' +
        '<p class="order-verify-confirm__message">' + message + '</p>' +
        '<div class="order-verify-confirm__actions">' +
          '<button type="button" class="order-detail-btn order-detail-btn--ghost js-order-verify-cancel">取消</button>' +
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

  /** 供订单详情抽屉核销复用同一套确认弹窗 */
  window.OrderVerifyUI = {
    showConfirm: showOrderVerifyConfirm,
    close: closeOrderVerifyConfirm
  };

  function updateRowAfterVerify(row) {
    var statusCell =
      row.querySelector('.order-status-cell .order-tag') ||
      row.querySelector('td:nth-last-child(2) .order-tag');
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
      if (
        window.OrderLivePickup &&
        typeof window.OrderLivePickup.hasApprovedRefundAftersale === 'function' &&
        window.OrderLivePickup.hasApprovedRefundAftersale(orderId, row)
      ) {
        if (typeof showToast === 'function') showToast('订单售后已通过审核，无法核销', 'warning');
        return;
      }

      var hasOpenRefund = window.OrderLivePickup &&
        typeof window.OrderLivePickup.hasOpenRefundAftersale === 'function' &&
        window.OrderLivePickup.hasOpenRefundAftersale(orderId, row);

      showOrderVerifyConfirm(orderId, function () {
        var result = null;
        if (window.OrderLivePickup && typeof window.OrderLivePickup.verifyWholeOrder === 'function') {
          result = window.OrderLivePickup.verifyWholeOrder(orderId, { closeOpenRefunds: true });
        }
        if (result && result.blocked) {
          if (typeof showToast === 'function') showToast('订单售后已通过审核，无法核销', 'warning');
          return;
        }
        var verified = !!(result && (result.ok === true || result === true));
        var closedCount = result && result.closedAftersales ? result.closedAftersales.length : 0;
        updateRowAfterVerify(row);
        if (window.OrderLiveDetail && typeof window.OrderLiveDetail.syncRetailListAftersaleUI === 'function') {
          window.OrderLiveDetail.syncRetailListAftersaleUI(row);
        }
        if (typeof showToast === 'function') {
          if (verified && closedCount > 0) {
            showToast('整单核销成功，已自动关闭 ' + closedCount + ' 笔退款售后（订单核销，自动关闭）', 'success');
          } else if (verified) {
            showToast('整单核销成功，订单已完成', 'success');
          } else {
            showToast('整单核销成功（演示）', 'success');
          }
        }
      }, hasOpenRefund ? { variant: 'refund' } : null);
    });
  }

  function getRowOrderStatus(row) {
    var statusEl = row
      ? row.querySelector('.order-status-cell .order-tag') ||
        row.querySelector('td:nth-last-child(2) .order-tag')
      : null;
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
    if (rowHasReturnRefundAftersale(row)) return false;
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

  function canRetailOpenAftersale(row) {
    if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.canOpenAftersaleDrawer === 'function') {
      return window.OrderPlatformAftersale.canOpenAftersaleDrawer(row);
    }
    return canRetailPlatformRefund(row) || getRowOrderStatus(row) === '已完成';
  }

  function retailAftersaleActionLabel(row) {
    if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.aftersaleActionLabel === 'function') {
      return window.OrderPlatformAftersale.aftersaleActionLabel(row);
    }
    return getRowOrderStatus(row) === '已完成' ? '发起售后' : '申请售后';
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
    var showRefund = canRetailOpenAftersale(row);
    var aftersaleLabel = retailAftersaleActionLabel(row);
    var isExpress = (row.getAttribute('data-delivery-mode') || '') === 'express';
    var showUpload = isExpress && canUploadRetailExpress(row);
    var showVerify = !isExpress && getRowOrderStatus(row) === '待提货';
    var verifyBlocked = showVerify &&
      window.OrderLivePickup &&
      typeof window.OrderLivePickup.hasApprovedRefundAftersale === 'function' &&
      window.OrderLivePickup.hasApprovedRefundAftersale(orderId, row);

    var actions = document.createElement('div');
    actions.className = 'order-live-table__actions';

    if (viewLink) actions.appendChild(viewLink);
    if (showVerify) {
      var verifyEl = verifyBtn;
      if (!verifyEl) {
        verifyEl = document.createElement('button');
        verifyEl.type = 'button';
        verifyEl.className = 'order-live-table__verify js-order-verify';
        verifyEl.setAttribute('data-order-id', orderId);
        verifyEl.textContent = '核销';
      }
      if (verifyBlocked) {
        verifyEl.disabled = true;
        verifyEl.title = '订单售后已通过审核，无法核销';
        verifyEl.classList.add('is-disabled');
      } else {
        verifyEl.disabled = false;
        verifyEl.removeAttribute('title');
        verifyEl.classList.remove('is-disabled');
      }
      actions.appendChild(verifyEl);
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
      if (refundBtn) {
        refundBtn.textContent = aftersaleLabel;
        actions.appendChild(refundBtn);
      } else {
        actions.appendChild(createRetailActionButton('js-retail-platform-refund', orderId, aftersaleLabel));
      }
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
    var alertOnly = options.mode === 'alert';
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
      (alertOnly
        ? ''
        : '<button type="button" class="order-detail-btn js-retail-dialog-cancel">取消</button>') +
      '<button type="button" class="order-detail-btn order-detail-btn--primary js-retail-dialog-ok">' +
      (options.okLabel || (alertOnly ? '好的' : '确认取消')) +
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
    var cancelBtn = backdrop.querySelector('.js-retail-dialog-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    backdrop.querySelector('.js-retail-dialog-ok').addEventListener('click', function () {
      close();
      if (typeof options.onConfirm === 'function') options.onConfirm();
    });
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
        if (hasOpenAftersaleBlockingCancel(orderId, row)) {
          showRetailConfirmDialog({
            backdropId: 'orderRetailCancelBlockBackdrop',
            title: '无法取消订单',
            message: '当前订单存在处理中售后，暂无法取消订单。',
            mode: 'alert',
            okLabel: '好的'
          });
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
            var statusCell =
              row.querySelector('.order-status-cell .order-tag') ||
              row.querySelector('td:nth-last-child(2) .order-tag');
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
        if (!canRetailOpenAftersale(refundRow)) {
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

  var RETAIL_EXPORT_FIELDS_KEY = 'lfRetailOrderExportFields';
  var PROXY_EXPORT_FIELDS_KEY = 'lfProxyOrderExportFields';
  var RETAIL_EXPORT_FIELDS = [
    { key: 'orderNo', label: '订单号' },
    { key: 'orderTime', label: '下单时间' },
    { key: 'nickname', label: '用户昵称' },
    { key: 'receiverName', label: '收货人姓名' },
    { key: 'receiverPhone', label: '收货人电话' },
    { key: 'goods', label: '商品信息' },
    { key: 'qty', label: '总件数' },
    { key: 'marketingType', label: '营销类型' },
    { key: 'payable', label: '应付金额' },
    { key: 'discount', label: '优惠金额' },
    { key: 'coupon', label: '优惠券' },
    { key: 'pointsUsed', label: '使用积分' },
    { key: 'pointsDeduct', label: '积分抵扣金额' },
    { key: 'paid', label: '实付金额' },
    { key: 'scene', label: '订单场景' },
    { key: 'deliveryMode', label: '履约方式' },
    { key: 'payChannel', label: '支付渠道' },
    { key: 'store', label: '下单门店' },
    { key: 'orderStatus', label: '订单状态' },
    { key: 'address', label: '收货地址', extra: true },
    { key: 'aftersaleStatus', label: '售后状态', extra: true }
  ];
  var PROXY_EXPORT_FIELDS = [
    { key: 'orderNo', label: '订单号' },
    { key: 'orderTime', label: '下单时间' },
    { key: 'nickname', label: '用户昵称' },
    { key: 'receiverName', label: '收货人姓名' },
    { key: 'receiverPhone', label: '收货人电话' },
    { key: 'goods', label: '商品信息' },
    { key: 'qty', label: '总件数' },
    { key: 'payable', label: '应付金额' },
    { key: 'discount', label: '优惠金额' },
    { key: 'coupon', label: '优惠券' },
    { key: 'pointsUsed', label: '使用积分' },
    { key: 'pointsDeduct', label: '积分抵扣金额' },
    { key: 'paid', label: '实付金额' },
    { key: 'payChannel', label: '支付渠道' },
    { key: 'deliveryMode', label: '履约方式' },
    { key: 'store', label: '下单门店' },
    { key: 'orderStatus', label: '订单状态' },
    { key: 'address', label: '收货地址', extra: true },
    { key: 'aftersaleStatus', label: '售后状态', extra: true }
  ];

  function isRetailOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'retail';
  }

  function isProxyOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'proxy';
  }

  function getOrderExportSpec() {
    if (isRetailOrderPage()) {
      return {
        fields: RETAIL_EXPORT_FIELDS,
        storageKey: RETAIL_EXPORT_FIELDS_KEY,
        filePrefix: '零售订单_',
        checkClass: 'js-order-retail-check',
        checkAllClass: 'js-order-retail-check-all',
        btnId: 'orderRetailExport'
      };
    }
    if (isProxyOrderPage()) {
      return {
        fields: PROXY_EXPORT_FIELDS,
        storageKey: PROXY_EXPORT_FIELDS_KEY,
        filePrefix: '代采订单_',
        checkClass: 'js-order-proxy-check',
        checkAllClass: 'js-order-proxy-check-all',
        btnId: 'orderProxyExport'
      };
    }
    return null;
  }

  function getOrderListTableRows() {
    return Array.prototype.slice.call(
      document.querySelectorAll('.order-live-table tbody tr[data-order-id]')
    );
  }

  function getVisibleOrderListRows() {
    return getOrderListTableRows().filter(function (row) {
      return !row.hidden;
    });
  }

  function getCheckedOrderListRows(spec) {
    spec = spec || getOrderExportSpec();
    if (!spec) return [];
    return getVisibleOrderListRows().filter(function (row) {
      var cb = row.querySelector('.' + spec.checkClass);
      return cb && cb.checked;
    });
  }

  function syncOrderExportChecks() {
    var spec = getOrderExportSpec();
    if (!spec) return;
    var visible = getVisibleOrderListRows();
    var checked = 0;
    visible.forEach(function (row) {
      var cb = row.querySelector('.' + spec.checkClass);
      if (cb && cb.checked) checked += 1;
    });
    var all = document.querySelector('.' + spec.checkAllClass);
    if (!all) return;
    all.checked = visible.length > 0 && checked === visible.length;
    all.indeterminate = checked > 0 && checked < visible.length;
  }

  function ensureOrderListRowChecks(spec) {
    spec = spec || getOrderExportSpec();
    if (!spec) return;
    getOrderListTableRows().forEach(function (row) {
      if (row.querySelector('.' + spec.checkClass)) return;
      var td = document.createElement('td');
      td.className = 'order-live-table__check-col';
      td.innerHTML =
        '<input type="checkbox" class="table-checkbox ' +
        spec.checkClass +
        '" aria-label="选择订单">';
      row.insertBefore(td, row.firstChild);
    });
  }

  function readOrderExportFields(spec) {
    var defaults = spec.fields.map(function (f) {
      return f.key;
    });
    try {
      var raw = localStorage.getItem(spec.storageKey);
      var list = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(list) || !list.length) return defaults;
      return spec.fields
        .map(function (f) {
          return f.key;
        })
        .filter(function (key) {
          return list.indexOf(key) >= 0;
        });
    } catch (e) {
      return defaults;
    }
  }

  function writeOrderExportFields(spec, keys) {
    try {
      localStorage.setItem(spec.storageKey, JSON.stringify(keys || []));
    } catch (e) {
      /* ignore */
    }
  }

  function closeOrderExportModal() {
    var backdrop = document.getElementById('orderListExportBackdrop');
    if (backdrop) backdrop.remove();
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderPlatformAsBackdrop') &&
      !document.getElementById('orderVerifyConfirmBackdrop')
    ) {
      document.body.style.overflow = '';
    }
  }

  function syncOrderExportFieldAll(modal) {
    var boxes = modal.querySelectorAll('.js-order-export-field');
    var checked = 0;
    boxes.forEach(function (cb) {
      if (cb.checked) checked += 1;
    });
    var all = modal.querySelector('.js-order-export-field-all');
    if (!all) return;
    all.checked = boxes.length > 0 && checked === boxes.length;
    all.indeterminate = checked > 0 && checked < boxes.length;
  }

  function collectOrderExportFields(modal) {
    return Array.prototype.slice
      .call(modal.querySelectorAll('.js-order-export-field:checked'))
      .map(function (cb) {
        return cb.value;
      });
  }

  function renderOrderExportFieldHtml(spec, savedKeys) {
    var listHtml = '';
    var extraHtml = '';
    spec.fields.forEach(function (field) {
      var checked = savedKeys.indexOf(field.key) >= 0 ? ' checked' : '';
      var item =
        '<label class="order-export-modal__field">' +
        '<input type="checkbox" class="js-order-export-field" value="' +
        field.key +
        '"' +
        checked +
        '>' +
        '<span>' +
        field.label +
        '</span>' +
        (field.extra ? '<em class="order-export-modal__extra">列表外</em>' : '') +
        '</label>';
      if (field.extra) extraHtml += item;
      else listHtml += item;
    });
    return (
      '<div class="order-export-modal__fields">' +
      listHtml +
      '</div>' +
      '<p class="order-export-modal__extra-title">以下字段不在列表中，可一并导出</p>' +
      '<div class="order-export-modal__fields">' +
      extraHtml +
      '</div>'
    );
  }

  function submitOrderListExport(spec, scope, fieldKeys, triggerEl) {
    var now = new Date();
    var stamp =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0');
    var scopeLabel = scope === 'selected' ? '勾选数据' : '所有查询数据';
    var count =
      scope === 'selected' ? getCheckedOrderListRows(spec).length : getVisibleOrderListRows().length;
    if (window.LfFileCenterNotify && typeof window.LfFileCenterNotify.bump === 'function') {
      window.LfFileCenterNotify.bump(
        {
          title: '订单列表导出',
          type: 'order-list-export',
          fileName: spec.filePrefix + stamp + '.xlsx'
        },
        { fromEl: triggerEl, toast: false }
      );
    }
    if (typeof showToast === 'function') {
      showToast(
        '已提交导出' + scopeLabel + '（' + count + ' 条，' + fieldKeys.length + ' 个字段），请到文件中心下载',
        'success'
      );
    }
  }

  function openOrderListExportModal() {
    var spec = getOrderExportSpec();
    if (!spec) return;
    closeOrderExportModal();
    var selectedCount = getCheckedOrderListRows(spec).length;
    var queryCount = getVisibleOrderListRows().length;
    var defaultScope = selectedCount > 0 ? 'selected' : 'query';
    var savedKeys = readOrderExportFields(spec);
    if (!savedKeys.length) {
      savedKeys = spec.fields.map(function (f) {
        return f.key;
      });
    }

    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = 'orderListExportBackdrop';
    backdrop.setAttribute('data-lf-skip-export-notify', '');
    backdrop.innerHTML =
      '<div class="order-export-modal" role="dialog" aria-modal="true" aria-labelledby="orderListExportTitle">' +
      '<div class="order-export-modal__head">' +
      '<h3 id="orderListExportTitle" class="order-export-modal__title">导出订单</h3>' +
      '<button type="button" class="order-export-modal__close js-order-export-close" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="order-export-modal__body">' +
      '<section class="order-export-modal__section">' +
      '<div class="order-export-modal__label">导出范围</div>' +
      '<label class="order-export-modal__scope">' +
      '<input type="radio" name="orderExportScope" value="selected"' +
      (defaultScope === 'selected' ? ' checked' : '') +
      '>' +
      '<span>导出勾选数据<small>（已选 ' +
      selectedCount +
      ' 条）</small></span>' +
      '</label>' +
      '<label class="order-export-modal__scope">' +
      '<input type="radio" name="orderExportScope" value="query"' +
      (defaultScope === 'query' ? ' checked' : '') +
      '>' +
      '<span>导出所有查询数据<small>（共 ' +
      queryCount +
      ' 条）</small></span>' +
      '</label>' +
      '</section>' +
      '<section class="order-export-modal__section">' +
      '<div class="order-export-modal__label-row">' +
      '<div class="order-export-modal__label">导出字段</div>' +
      '<label class="order-export-modal__all">' +
      '<input type="checkbox" class="js-order-export-field-all"> 全选' +
      '</label>' +
      '</div>' +
      renderOrderExportFieldHtml(spec, savedKeys) +
      '</section>' +
      '</div>' +
      '<div class="order-export-modal__foot">' +
      '<button type="button" class="order-detail-btn order-detail-btn--ghost js-order-export-cancel">取消</button>' +
      '<button type="button" class="order-detail-btn order-detail-btn--primary js-order-export-ok">确定导出</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    syncOrderExportFieldAll(backdrop);

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeOrderExportModal();
        document.removeEventListener('keydown', onKeydown);
      }
    }
    document.addEventListener('keydown', onKeydown);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeOrderExportModal();
    });
    backdrop.querySelector('.js-order-export-close').addEventListener('click', closeOrderExportModal);
    backdrop.querySelector('.js-order-export-cancel').addEventListener('click', closeOrderExportModal);
    backdrop.addEventListener('change', function (e) {
      var fieldAll = e.target.closest('.js-order-export-field-all');
      if (fieldAll) {
        backdrop.querySelectorAll('.js-order-export-field').forEach(function (cb) {
          cb.checked = fieldAll.checked;
        });
        syncOrderExportFieldAll(backdrop);
        return;
      }
      if (e.target.classList.contains('js-order-export-field')) {
        syncOrderExportFieldAll(backdrop);
      }
    });
    backdrop.querySelector('.js-order-export-ok').addEventListener('click', function () {
      var scopeInput = backdrop.querySelector('input[name="orderExportScope"]:checked');
      var scope = scopeInput ? scopeInput.value : 'query';
      var fieldKeys = collectOrderExportFields(backdrop);
      if (!fieldKeys.length) {
        if (typeof showToast === 'function') showToast('请至少选择一个导出字段', 'warning');
        return;
      }
      if (scope === 'selected' && !getCheckedOrderListRows(spec).length) {
        if (typeof showToast === 'function') showToast('请先勾选要导出的订单', 'warning');
        return;
      }
      if (scope === 'query' && !getVisibleOrderListRows().length) {
        if (typeof showToast === 'function') showToast('当前查询无数据可导出', 'warning');
        return;
      }
      writeOrderExportFields(spec, fieldKeys);
      closeOrderExportModal();
      document.removeEventListener('keydown', onKeydown);
      submitOrderListExport(spec, scope, fieldKeys, document.getElementById(spec.btnId));
    });
  }

  function initOrderListExport() {
    var spec = getOrderExportSpec();
    if (!spec) return;
    ensureOrderListRowChecks(spec);
    syncOrderExportChecks();

    var table = document.querySelector('.order-live-table');
    if (table && !table.dataset.orderExportCheckBound) {
      table.dataset.orderExportCheckBound = '1';
      table.addEventListener('change', function (e) {
        if (e.target.classList.contains(spec.checkAllClass)) {
          var checked = e.target.checked;
          getVisibleOrderListRows().forEach(function (row) {
            var cb = row.querySelector('.' + spec.checkClass);
            if (cb) cb.checked = checked;
          });
          syncOrderExportChecks();
          return;
        }
        if (e.target.classList.contains(spec.checkClass)) {
          syncOrderExportChecks();
        }
      });
    }

    var exportBtn = document.getElementById(spec.btnId);
    if (exportBtn && !exportBtn.dataset.orderExportBound) {
      exportBtn.dataset.orderExportBound = '1';
      exportBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openOrderListExportModal();
      });
    }
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
          : '',
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
      initOrderListExport();
    });
  } else {
    initFilter();
    initPagination();
    initVerifyPickup();
    initRetailExpressUpload();
    initRetailBatchExpressUpload();
    initRetailActionLayout();
    initRetailCancelAndRefund();
    initOrderListExport();
  }
})();
