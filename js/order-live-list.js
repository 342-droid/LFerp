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
        ensureOrderTimePreset();
        resetOrderFilterSwitches();
        resetOrderStatusMulti();
        if (extraGrid) {
          extraGrid.hidden = !defaultExpanded;
        }
        if (expandBtn) {
          expandBtn.classList.toggle('is-expanded', defaultExpanded);
        }
        if (expandLabel) expandLabel.textContent = defaultExpanded ? '收起' : '展开';
        closeOrderLiveSessionCombo();
        applyOrderListFilters();
      });
    }

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        if (applyOrderListFilters() === false) return;
        if (typeof showToast === 'function') {
          showToast('查询完成（演示）', 'success');
        }
      });
    }

    initOrderFilterSwitches();
    initOrderStatusMulti();
    initLiveSessionCombo();
    initOrderTimeFilter();
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
        if (!e.target.closest('.order-filter-combo')) closeOrderLiveSessionCombo();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeOrderFilterSwitches();
          closeOrderStatusMulti();
          closeOrderLiveSessionCombo();
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

  var RETAIL_LIVE_SESSIONS = [
    '美物甄选-9.7午间场',
    '美物甄选-9.6晚间场X',
    '美物甄选-9.6晚间场L',
    '美物甄选-9.6午间场',
    '美物甄选-9.5晚间场X',
    '美物甄选-9.5晚间场L',
    '美物甄选-9.5午间场L',
    '美物甄选-9.4晚间场X'
  ];

  function normalizeFilterText(text) {
    return String(text || '').replace(/\s+/g, '').toLowerCase();
  }

  function closeOrderLiveSessionCombo() {
    var combo = document.getElementById('qLiveSessionCombo');
    var input = document.getElementById('qLiveSession');
    var menu = document.getElementById('qLiveSessionMenu');
    if (combo) combo.classList.remove('is-open');
    if (input) input.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  }

  var ORDER_FILTER_COL_LABELS = {
    nickname: '用户昵称',
    receiverName: '收货人姓名',
    receiverPhone: '收货人电话'
  };

  function getRowCellByPrefKey(row, key) {
    var table = row && row.closest('table');
    if (!table || !key) return '';
    var label = ORDER_FILTER_COL_LABELS[key] || '';
    var ths = table.querySelectorAll('thead th');
    var idx = -1;
    for (var i = 0; i < ths.length; i++) {
      if (ths[i].getAttribute('data-preference-key') === key) {
        idx = i;
        break;
      }
      var headText = String(ths[i].textContent || '').replace(/[?？]/g, '').replace(/\s+/g, '');
      if (label && headText === label) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return '';
    var td = row.children[idx];
    return normalizeFilterText(td && td.textContent);
  }

  function initLiveSessionCombo() {
    var combo = document.getElementById('qLiveSessionCombo');
    var input = document.getElementById('qLiveSession');
    var menu = document.getElementById('qLiveSessionMenu');
    if (!combo || !input || !menu) return;

    var activeIndex = -1;
    var visibleItems = [];

    function renderMenu() {
      var query = normalizeFilterText(input.value);
      visibleItems = RETAIL_LIVE_SESSIONS.filter(function (name) {
        return !query || normalizeFilterText(name).indexOf(query) >= 0;
      });
      if (!visibleItems.length) {
        menu.innerHTML = '<div class="order-filter-combo__empty">无匹配场次</div>';
        activeIndex = -1;
        return;
      }
      if (activeIndex >= visibleItems.length) activeIndex = visibleItems.length - 1;
      if (activeIndex < 0) activeIndex = 0;
      menu.innerHTML = visibleItems
        .map(function (name, idx) {
          return (
            '<button type="button" class="order-filter-combo__item' +
            (idx === activeIndex ? ' is-active' : '') +
            '" role="option" data-value="' +
            name.replace(/"/g, '&quot;') +
            '">' +
            name +
            '</button>'
          );
        })
        .join('');
      var activeEl = menu.querySelector('.order-filter-combo__item.is-active');
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    function openMenu() {
      closeOrderFilterSwitches();
      closeOrderStatusMulti();
      combo.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
      renderMenu();
    }

    function pickItem(name) {
      input.value = name || '';
      closeOrderLiveSessionCombo();
    }

    input.addEventListener('focus', function () {
      openMenu();
    });
    input.addEventListener('click', function (e) {
      e.stopPropagation();
      openMenu();
    });
    input.addEventListener('input', function () {
      openMenu();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (menu.hidden) openMenu();
        if (!visibleItems.length) return;
        if (e.key === 'ArrowDown') {
          activeIndex = (activeIndex + 1) % visibleItems.length;
        } else {
          activeIndex = (activeIndex - 1 + visibleItems.length) % visibleItems.length;
        }
        renderMenu();
        return;
      }
      if (e.key === 'Enter' && !menu.hidden && visibleItems.length && activeIndex >= 0) {
        e.preventDefault();
        pickItem(visibleItems[activeIndex]);
      }
    });
    menu.addEventListener('mousedown', function (e) {
      e.preventDefault();
    });
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.order-filter-combo__item');
      if (!item) return;
      pickItem(item.getAttribute('data-value') || item.textContent || '');
    });
    menu.addEventListener('mousemove', function (e) {
      var item = e.target.closest('.order-filter-combo__item');
      if (!item) return;
      var items = menu.querySelectorAll('.order-filter-combo__item');
      items.forEach(function (btn, idx) {
        var active = btn === item;
        btn.classList.toggle('is-active', active);
        if (active) activeIndex = idx;
      });
    });
  }

  var ORDER_TIME_PRESET_DEFAULT = '7d';
  var ORDER_TIME_PRESETS = ['today', 'yesterday', '7d', '14d', '30d', 'lastMonth', 'thisMonth'];

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addLocalDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function formatOrderDay(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1);
    var d = String(date.getDate());
    if (m.length < 2) m = '0' + m;
    if (d.length < 2) d = '0' + d;
    return y + '-' + m + '-' + d;
  }

  function parseOrderDay(text) {
    var m = String(text || '').match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /* 近 N 天含今天，共 N 个自然日；今天/昨天为单日；本月/上个月为整自然月 */
  function getOrderTimePresetRange(preset) {
    var today = startOfLocalDay(new Date());
    var start = today;
    var end = today;
    if (preset === 'today') {
      /* 今天 */
    } else if (preset === 'yesterday') {
      start = addLocalDays(today, -1);
      end = start;
    } else if (preset === '7d') {
      start = addLocalDays(today, -6);
    } else if (preset === '14d') {
      start = addLocalDays(today, -13);
    } else if (preset === '30d') {
      start = addLocalDays(today, -29);
    } else if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else {
      return null;
    }
    return { start: start, end: end };
  }

  function formatOrderDateTime(date, endOfDay) {
    return formatOrderDay(date) + (endOfDay ? ' 23:59:59' : ' 00:00:00');
  }

  function getOrderTimePresetBtns() {
    return document.querySelectorAll('#qOrderTimePresets [data-preset]');
  }

  function setOrderTimePresetChecked(preset) {
    getOrderTimePresetBtns().forEach(function (btn) {
      var on = btn.getAttribute('data-preset') === preset;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var hidden = document.getElementById('qOrderTime');
    if (hidden) hidden.value = preset || '';
  }

  function applyOrderTimePreset(preset) {
    var range = getOrderTimePresetRange(preset);
    var startEl = document.getElementById('qOrderTimeStart');
    var endEl = document.getElementById('qOrderTimeEnd');
    if (!range || !startEl || !endEl) return;
    startEl.value = formatOrderDateTime(range.start, false);
    endEl.value = formatOrderDateTime(range.end, true);
    setOrderTimePresetChecked(preset);
  }

  function matchOrderTimePreset(start, end) {
    if (!start || !end) return '';
    var startKey = formatOrderDay(start);
    var endKey = formatOrderDay(end);
    for (var i = 0; i < ORDER_TIME_PRESETS.length; i++) {
      var range = getOrderTimePresetRange(ORDER_TIME_PRESETS[i]);
      if (range && formatOrderDay(range.start) === startKey && formatOrderDay(range.end) === endKey) {
        return ORDER_TIME_PRESETS[i];
      }
    }
    return '';
  }

  function readOrderTimeRange() {
    var startEl = document.getElementById('qOrderTimeStart');
    var endEl = document.getElementById('qOrderTimeEnd');
    if (!startEl && !endEl) return null;
    var start = parseOrderDay(startEl && startEl.value);
    var end = parseOrderDay(endEl && endEl.value);
    if (!start || !end) return null;
    if (end < start) {
      var swap = start;
      start = end;
      end = swap;
    }
    return { start: start, end: end };
  }

  function ensureOrderTimePreset() {
    var startEl = document.getElementById('qOrderTimeStart');
    if (!startEl) return;
    applyOrderTimePreset(ORDER_TIME_PRESET_DEFAULT);
  }

  function initOrderTimeFilter() {
    var presets = document.getElementById('qOrderTimePresets');
    var startEl = document.getElementById('qOrderTimeStart');
    var endEl = document.getElementById('qOrderTimeEnd');
    if (!presets || !startEl || !endEl) return;

    presets.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-preset]');
      if (!btn || !presets.contains(btn)) return;
      applyOrderTimePreset(btn.getAttribute('data-preset'));
    });

    function syncPresetFromInputs() {
      var range = readOrderTimeRange();
      setOrderTimePresetChecked(range ? matchOrderTimePreset(range.start, range.end) : '');
    }

    startEl.addEventListener('change', syncPresetFromInputs);
    endEl.addEventListener('change', syncPresetFromInputs);
    startEl.addEventListener('blur', syncPresetFromInputs);
    endEl.addEventListener('blur', syncPresetFromInputs);
  }

  function getRowOrderedAt(row) {
    var raw = row.getAttribute('data-ordered-at');
    if (raw) return parseOrderDay(raw);
    var table = row.closest('table');
    if (!table) return null;
    var ths = table.querySelectorAll('thead th');
    var idx = -1;
    for (var i = 0; i < ths.length; i++) {
      if (ths[i].getAttribute('data-preference-key') === 'orderedAt') {
        idx = i;
        break;
      }
      if (String(ths[i].textContent || '').replace(/\s+/g, '') === '下单时间') {
        idx = i;
        break;
      }
    }
    if (idx < 0) return null;
    return parseOrderDay(row.children[idx] && row.children[idx].textContent);
  }

  /** 零售/代采/直播：支付渠道、支付流水；零售/代采另支持下单门店，零售另支持履约方式 */
  function applyOrderListFilters() {
    var page = document.body ? document.body.getAttribute('data-order-page') : '';
    var isProxy = page === 'proxy';
    var isRetail = page === 'retail';
    var isLive = page === 'live';
    if (!isProxy && !isRetail && !isLive) return;

    var needOrderTime = isProxy || isRetail;
    var orderTimeRange = needOrderTime ? readOrderTimeRange() : null;
    if (needOrderTime && !orderTimeRange) {
      if (typeof showToast === 'function') showToast('请选择下单时间', 'warning');
      return false;
    }

    var paySel = document.getElementById('qPayChannel');
    var payChannel = paySel ? (paySel.value || '').trim() : '';
    var deliverySel = document.getElementById('qDeliveryMode');
    var delivery = deliverySel ? (deliverySel.value || '').trim() : '';
    var sceneSel = document.getElementById('qOrderScene');
    var scene = isRetail && sceneSel ? (sceneSel.value || '').trim() : '';
    var storeSel = document.getElementById('qStore');
    var store = storeSel ? (storeSel.value || '').trim() : '';
    var payNoInput = document.getElementById('qPayNo');
    var payNo = payNoInput ? (payNoInput.value || '').trim() : '';
    var userKeyEl = document.getElementById('qUserKey');
    var userKey = userKeyEl ? (userKeyEl.value || 'nickname') : 'nickname';
    var userInput = document.getElementById('qNickname');
    var userQ = userInput ? normalizeFilterText(userInput.value) : '';
    var phoneInput = document.getElementById('qReceiverPhone');
    var phoneQ = phoneInput ? normalizeFilterText(phoneInput.value) : '';
    var liveInput = document.getElementById('qLiveSession');
    var liveQ = liveInput ? normalizeFilterText(liveInput.value) : '';
    var statusLabels = getSelectedOrderStatusLabels();
    var productInput = document.getElementById('qProductName');
    var productQ = productInput ? normalizeFilterText(productInput.value) : '';

    var tbody = document.querySelector('.order-live-table tbody');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr[data-order-id]');
    var visible = 0;
    rows.forEach(function (row) {
      var show = true;
      if (show && orderTimeRange) {
        var orderedAt = getRowOrderedAt(row);
        show = !!(orderedAt && orderedAt >= orderTimeRange.start && orderedAt <= orderTimeRange.end);
      }
      if (show && payChannel) {
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
      if (show && payNo) {
        var needle = payNo.toLowerCase();
        var rowPayNo = (row.getAttribute('data-pay-no') || '').trim().toLowerCase();
        var payNoCell = row.querySelector('.order-pay-no');
        var cellPayNo = payNoCell
          ? payNoCell.textContent.replace(/\s+/g, '').toLowerCase()
          : '';
        show = rowPayNo.indexOf(needle) >= 0 || cellPayNo.indexOf(needle) >= 0;
      }
      if (show && (userQ || phoneQ)) {
        if (userQ) {
          var userCol =
            userKey === 'receiverName'
              ? 'receiverName'
              : userKey === 'receiverPhone'
                ? 'receiverPhone'
                : 'nickname';
          show = getRowCellByPrefKey(row, userCol).indexOf(userQ) >= 0;
        }
        if (show && phoneQ) {
          show = getRowCellByPrefKey(row, 'receiverPhone').indexOf(phoneQ) >= 0;
        }
      }
      if (show && liveQ) {
        var rowLive = normalizeFilterText(row.getAttribute('data-live-session') || '');
        show = rowLive.indexOf(liveQ) >= 0;
      }
      if (show && productQ) {
        show = rowMatchesProductQuery(row, productQ);
      }
      /* 发起退货/退款：只看售后状态，不改订单状态列；与履约态同时勾选时为或关系 */
      if (show && statusLabels.length) {
        var orderStatuses = statusLabels.filter(function (label) {
          return label !== RETURN_REFUND_FILTER_LABEL;
        });
        var wantAftersale = statusLabels.indexOf(RETURN_REFUND_FILTER_LABEL) >= 0;
        var matchOrder = orderStatuses.length > 0 && (
          window.OrderRetailStatus
            ? window.OrderRetailStatus.matchesFilter(getRowOrderStatus(row), orderStatuses)
            : orderStatuses.indexOf(getRowOrderStatus(row)) >= 0
        );
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
    var hasFilter = !!(
      orderTimeRange ||
      payChannel ||
      (isRetail && delivery) ||
      scene ||
      store ||
      payNo ||
      userQ ||
      phoneQ ||
      liveQ ||
      productQ ||
      (!isLive && statusLabels.length)
    );
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
      statusCell.className = 'order-tag order-tag--success';
      statusCell.textContent = '交易成功';
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
            showToast('整单核销成功，订单交易成功', 'success');
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
    if (window.OrderRetailStatus && window.OrderRetailStatus.isTerminal(status)) return false;
    return !!status && status !== '已完成' && status !== '已关闭' && status !== '已取消';
  }

  function canCancelRetailOrder(row) {
    if (window.OrderPlatformAftersale) return window.OrderPlatformAftersale.canCancelOrder(row);
    var status = getRowOrderStatus(row);
    var mode = (row.getAttribute('data-delivery-mode') || '') === 'express' ? 'express' : 'pickup';
    if (mode === 'pickup') {
      return ['待支付', '已创建', '已支付', '待接单', '待发货', '待收货', '待提货'].indexOf(status) >= 0;
    }
    return ['待支付', '已创建', '已支付', '待接单', '待发货'].indexOf(status) >= 0;
  }

  function getRetailProductQuery() {
    var input = document.getElementById('qProductName');
    return input ? normalizeFilterText(input.value) : '';
  }

  function rowMatchesProductQuery(row, productQ) {
    if (!row || !productQ) return true;
    var goods = getOrderGoods(row.getAttribute('data-order-id'), row) || [];
    var hit = goods.some(function (g) {
      return normalizeFilterText(g && g.name).indexOf(productQ) >= 0;
    });
    if (hit) return true;
    var nameEl = row.querySelector('.order-product-cell__name');
    return normalizeFilterText(nameEl ? nameEl.textContent : '').indexOf(productQ) >= 0;
  }

  function collectMatchingSkuNames(rows, productQ) {
    var map = {};
    (rows || []).forEach(function (row) {
      var goods = getOrderGoods(row.getAttribute('data-order-id'), row) || [];
      goods.forEach(function (g) {
        var name = (g && g.name) || '';
        if (!name || normalizeFilterText(name).indexOf(productQ) < 0) return;
        var key = normalizeFilterText(name);
        if (!map[key]) {
          map[key] = {
            name: name,
            spec: g.spec || '',
            sku: g.sku || g.skuCode || g.spu || '',
            img: g.img || ''
          };
        }
      });
    });
    return Object.keys(map).map(function (key) {
      return map[key];
    });
  }

  function findRowGoodBySkuName(row, skuName) {
    var key = normalizeFilterText(skuName);
    var goods = getOrderGoods(row.getAttribute('data-order-id'), row) || [];
    for (var i = 0; i < goods.length; i++) {
      if (normalizeFilterText(goods[i] && goods[i].name) === key) return goods[i];
    }
    return null;
  }

  function skuHasOpenAftersale(orderId, row, skuName) {
    if (!orderId || !skuName) return false;
    var detail = null;
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.resolveDetail === 'function') {
      detail = window.OrderLiveDetail.resolveDetail(orderId, row);
    }
    var list = detail && Array.isArray(detail.aftersales) ? detail.aftersales : [];
    var key = normalizeFilterText(skuName);
    var openStatuses = ['待审批', '退款中', '待退货', '待收货', '退款异常'];
    var openTypes = ['仅退款', '退货退款', '补货', '换货'];
    if (list.some(function (item) {
      if (!item) return false;
      if (openTypes.indexOf(item.type) < 0) return false;
      if (openStatuses.indexOf(item.status) < 0) return false;
      return normalizeFilterText(item.productName) === key;
    })) return true;
    var good = findRowGoodBySkuName(row, skuName);
    return !!(good && (good.aftersaleTag === '退款中' || good.aftersaleTag === '补发中'));
  }

  function applyRetailCancelRow(row) {
    var statusCell =
      row.querySelector('.order-status-cell .order-tag') ||
      row.querySelector('td:nth-last-child(2) .order-tag');
    if (statusCell) {
      statusCell.className = 'order-tag order-tag--failed';
      statusCell.textContent = '交易失败';
    }
    var cb = row.querySelector('.js-order-retail-check');
    if (cb) cb.checked = false;
    refreshRetailActionRow(row);
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
    return canRetailPlatformRefund(row) || (
      window.OrderRetailStatus
        ? window.OrderRetailStatus.isSuccess(getRowOrderStatus(row))
        : getRowOrderStatus(row) === '已完成'
    );
  }

  function retailAftersaleActionLabel(row) {
    if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.aftersaleActionLabel === 'function') {
      return window.OrderPlatformAftersale.aftersaleActionLabel(row);
    }
    var done = window.OrderRetailStatus
      ? window.OrderRetailStatus.isSuccess(getRowOrderStatus(row))
      : getRowOrderStatus(row) === '已完成';
    return done ? '发起售后' : '申请售后';
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
            '</strong> 吗？<br>取消后订单将变为交易失败，此操作不可撤销。',
          okLabel: '确认取消',
          onConfirm: function () {
            applyRetailCancelRow(row);
            if (window.OrderPlatformAftersale && typeof window.OrderPlatformAftersale.persistCancelRefund === 'function') {
              window.OrderPlatformAftersale.persistCancelRefund(orderId, row, '零售');
            }
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

  var RETAIL_EXPORT_FIELDS_KEY = 'lfRetailOrderExportFieldsV7';
  var PROXY_EXPORT_FIELDS_KEY = 'lfProxyOrderExportFieldsV4';
  var RETAIL_CLEARING_EXPORT_FIELDS_KEY = 'lfRetailClearingExportFieldsV3';
  var PROXY_CLEARING_EXPORT_FIELDS_KEY = 'lfProxyClearingExportFieldsV3';
  var RETAIL_EXPORT_FIELDS = [
    { key: 'orderNo', label: '订单号' },
    { key: 'orderTime', label: '下单时间' },
    { key: 'nickname', label: '用户昵称' },
    { key: 'receiverName', label: '收货人姓名' },
    { key: 'receiverPhone', label: '收货人电话' },
    { key: 'goodsName', label: '商品名称' },
    { key: 'spec', label: '规格' },
    { key: 'qty', label: '总件数' },
    { key: 'marketingType', label: '营销类型' },
    { key: 'payable', label: '应付金额' },
    { key: 'discount', label: '优惠金额' },
    { key: 'coupon', label: '优惠券' },
    { key: 'pointsUsed', label: '使用积分' },
    { key: 'pointsDeduct', label: '积分抵扣金额' },
    { key: 'paidWithFreight', label: '实付金额（含分摊运费）' },
    { key: 'paidWithoutFreight', label: '实付金额（不含运费）' },
    { key: 'scene', label: '订单场景' },
    { key: 'deliveryMode', label: '履约方式' },
    { key: 'payChannel', label: '支付渠道' },
    { key: 'store', label: '下单门店' },
    { key: 'payNo', label: '支付流水' },
    { key: 'orderStatus', label: '订单状态' },
    { key: 'skuCode', label: '商品编码', extra: true },
    { key: 'category', label: '商品类目', extra: true },
    { key: 'allocatedFreight', label: '分摊运费', extra: true },
    { key: 'refundAmount', label: '退款金额', extra: true },
    { key: 'liveSession', label: '直播场次', extra: true },
    { key: 'address', label: '收货地址', extra: true },
    { key: 'aftersaleStatus', label: '售后状态', extra: true }
  ];
  var PROXY_EXPORT_FIELDS = [
    { key: 'orderNo', label: '订单号' },
    { key: 'orderTime', label: '下单时间' },
    { key: 'nickname', label: '用户昵称' },
    { key: 'receiverName', label: '收货人姓名' },
    { key: 'receiverPhone', label: '收货人电话' },
    { key: 'goodsName', label: '商品名称' },
    { key: 'spec', label: '规格' },
    { key: 'qty', label: '总件数' },
    { key: 'payable', label: '应付金额' },
    { key: 'discount', label: '优惠金额' },
    { key: 'coupon', label: '优惠券' },
    { key: 'pointsUsed', label: '使用积分' },
    { key: 'pointsDeduct', label: '积分抵扣金额' },
    { key: 'paidWithFreight', label: '实付金额（含分摊运费）' },
    { key: 'paidWithoutFreight', label: '实付金额（不含运费）' },
    { key: 'payChannel', label: '支付渠道' },
    { key: 'deliveryMode', label: '履约方式' },
    { key: 'store', label: '下单门店' },
    { key: 'payNo', label: '支付流水' },
    { key: 'orderStatus', label: '订单状态' },
    { key: 'skuCode', label: '商品编码', extra: true },
    { key: 'category', label: '商品类目', extra: true },
    { key: 'allocatedFreight', label: '分摊运费', extra: true },
    { key: 'refundAmount', label: '退款金额', extra: true },
    { key: 'address', label: '收货地址', extra: true },
    { key: 'aftersaleStatus', label: '售后状态', extra: true }
  ];
  /** 清分明细导出：一行一个清分项；支付流水已去掉，对账用通道流水 */
  var CLEARING_EXPORT_FIELDS = [
    { key: 'orderNo', label: '订单号' },
    { key: 'orderStatus', label: '订单状态' },
    { key: 'orderScene', label: '订单场景' },
    { key: 'skuName', label: '商品名称' },
    { key: 'spec', label: '商品规格' },
    { key: 'skuCode', label: '商品编码' },
    { key: 'qty', label: '商品数量' },
    { key: 'paid', label: '实付' },
    { key: 'aftersaleAmount', label: '售后金额' },
    { key: 'netPaid', label: '净实付金额' },
    { key: 'aftersaleStatus', label: '售后状态' },
    { key: 'roleCommission', label: '角色分佣' },
    { key: 'supplierCost', label: '供应商采购成本' },
    { key: 'marginRate', label: '毛利率' },
    { key: 'payee', label: '收款方' },
    { key: 'role', label: '角色' },
    { key: 'account', label: '账户' },
    { key: 'method', label: '分佣方式' },
    { key: 'strategy', label: '命中策略' },
    { key: 'receivable', label: '应收' },
    { key: 'received', label: '实收' },
    { key: 'clearStatus', label: '清分状态' },
    { key: 'settleStatus', label: '结算状态' },
    { key: 'bookStatus', label: '入账状态' },
    { key: 'orderChannel', label: '订单渠道', extra: true },
    { key: 'store', label: '下单门店', extra: true },
    { key: 'channelNo', label: '通道流水', extra: true }
  ];

  function isRetailOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'retail';
  }

  function isProxyOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'proxy';
  }

  function getOrderPageCheckSpec() {
    if (isRetailOrderPage()) {
      return {
        checkClass: 'js-order-retail-check',
        checkAllClass: 'js-order-retail-check-all'
      };
    }
    if (isProxyOrderPage()) {
      return {
        checkClass: 'js-order-proxy-check',
        checkAllClass: 'js-order-proxy-check-all'
      };
    }
    return null;
  }

  function getOrderExportSpec(kind) {
    var page = getOrderPageCheckSpec();
    if (!page) return null;
    var isRetail = isRetailOrderPage();
    if (kind === 'clearing') {
      return {
        kind: 'clearing',
        title: '导出订单清分明细',
        fields: CLEARING_EXPORT_FIELDS,
        storageKey: isRetail ? RETAIL_CLEARING_EXPORT_FIELDS_KEY : PROXY_CLEARING_EXPORT_FIELDS_KEY,
        filePrefix: (isRetail ? '零售订单清分明细_' : '代采订单清分明细_'),
        taskTitle: '订单清分明细导出',
        taskType: 'order-clearing-export',
        checkClass: page.checkClass,
        checkAllClass: page.checkAllClass,
        btnId: isRetail ? 'orderRetailClearingExport' : 'orderProxyClearingExport'
      };
    }
    return {
      kind: 'order',
      title: '导出订单',
      fields: isRetail ? RETAIL_EXPORT_FIELDS : PROXY_EXPORT_FIELDS,
      storageKey: isRetail ? RETAIL_EXPORT_FIELDS_KEY : PROXY_EXPORT_FIELDS_KEY,
      filePrefix: isRetail ? '零售订单_' : '代采订单_',
      taskTitle: '订单列表导出',
      taskType: 'order-list-export',
      checkClass: page.checkClass,
      checkAllClass: page.checkAllClass,
      btnId: isRetail ? 'orderRetailExport' : 'orderProxyExport'
    };
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
    if (!spec) spec = getOrderPageCheckSpec();
    if (!spec) return [];
    return getVisibleOrderListRows().filter(function (row) {
      var cb = row.querySelector('.' + spec.checkClass);
      return cb && cb.checked;
    });
  }

  function syncOrderExportChecks() {
    var spec = getOrderPageCheckSpec() || getOrderExportSpec();
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
    spec = spec || getOrderPageCheckSpec() || getOrderExportSpec();
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
      var selected = spec.fields
        .map(function (f) {
          return f.key;
        })
        .filter(function (key) {
          return list.indexOf(key) >= 0;
        });
      var seenKey = spec.storageKey + ':payNo';
      var seenPayNo = false;
      try {
        seenPayNo = !!localStorage.getItem(seenKey);
      } catch (eSeen) {
        seenPayNo = true;
      }
      if (spec.kind !== 'clearing' && !seenPayNo && selected.indexOf('payNo') < 0 && defaults.indexOf('payNo') >= 0) {
        var storeIdx = selected.indexOf('store');
        selected.splice(storeIdx >= 0 ? storeIdx + 1 : selected.length, 0, 'payNo');
      }
      return selected;
    } catch (e) {
      return defaults;
    }
  }

  function writeOrderExportFields(spec, keys) {
    try {
      localStorage.setItem(spec.storageKey, JSON.stringify(keys || []));
      if (spec.kind !== 'clearing') {
        localStorage.setItem(spec.storageKey + ':payNo', '1');
      }
    } catch (e) {
      /* ignore */
    }
  }

  function resolveOrderDetailForExport(row) {
    var orderId = row && row.getAttribute('data-order-id');
    if (!orderId || !window.OrderLiveDetail || typeof window.OrderLiveDetail.resolveDetail !== 'function') {
      return null;
    }
    return window.OrderLiveDetail.resolveDetail(orderId, row);
  }

  function getOrderExportDataCells(row) {
    return Array.prototype.filter.call(row.querySelectorAll('td'), function (td) {
      return (
        !td.classList.contains('order-live-table__check-col') &&
        !td.classList.contains('lf-row-no-td') &&
        !td.classList.contains('order-live-table__sticky-col')
      );
    });
  }

  function cellTextOf(cells, index) {
    var td = cells[index];
    return td ? String(td.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function parseMoneyYuan(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function yuanToCents(v) {
    return Math.round(parseMoneyYuan(v) * 100);
  }

  function centsToYuanText(cents) {
    return (cents / 100).toFixed(2);
  }

  function skuAmountCents(item) {
    if (item && item.subtotal) return Math.abs(yuanToCents(item.subtotal));
    var price = Math.abs(yuanToCents(item && item.price));
    var qty = parseInt(String((item && item.qty) || '1').replace(/\D/g, ''), 10) || 1;
    return price * qty;
  }

  function allocateCents(totalCents, weights) {
    var n = weights.length;
    var out = [];
    var sumW = 0;
    var i;
    for (i = 0; i < n; i++) sumW += weights[i];
    if (!n) return out;
    if (!totalCents || sumW <= 0) {
      for (i = 0; i < n; i++) out.push(0);
      return out;
    }
    var used = 0;
    for (i = 0; i < n; i++) {
      if (i === n - 1) {
        out.push(totalCents - used);
      } else {
        var share = Math.round((totalCents * weights[i]) / sumW);
        out.push(share);
        used += share;
      }
    }
    return out;
  }

  function resolveOrderFreightCents(detail) {
    if (detail && detail.freight && detail.freight.original != null) {
      return Math.max(0, yuanToCents(detail.freight.original));
    }
    return Math.max(0, yuanToCents(detail && detail.amounts && detail.amounts.shipping));
  }

  /**
   * 商品实付 = 订单实付去掉运费后，按商品金额比例分摊。
   * 若订单实付已含运费则先扣除；末行吃分摊尾差，不再把整笔运费叠进最后一条实付。
   */
  function resolveGoodsPaidCents(amounts, freightCents) {
    var paid = yuanToCents(amounts && amounts.paid);
    var goods = yuanToCents(amounts && amounts.goods);
    var discount = yuanToCents(amounts && amounts.discount);
    var withFreight = goods + discount + freightCents;
    var noFreight = goods + discount;
    if (Math.abs(paid - withFreight) <= 1) return Math.max(0, paid - freightCents);
    if (Math.abs(paid - noFreight) <= 1) return Math.max(0, paid);
    return Math.max(0, paid - freightCents);
  }

  function resolveGoodsExportName(item, fallback) {
    var name = item && item.name ? String(item.name).trim() : '';
    return name || fallback || '—';
  }

  function resolveGoodsExportSpec(item) {
    var spec = item && (item.spec || item.skuName);
    spec = String(spec || '')
      .replace(/^规格：/, '')
      .trim();
    return spec || '—';
  }

  /** 列表无「商品类目」列：导出按商品明细取类目，无值时按品名归到选品库类目 */
  function resolveGoodsCategory(item) {
    var raw = item && (item.category || item.categoryName || item.cateName);
    if (raw && String(raw).trim()) return String(raw).trim();
    var name = String((item && item.name) || '');
    if (/虾|鱼|蟹|贝|海鲜/.test(name)) return '水产海鲜';
    if (/牛|猪|羊|鸡|鸭|肉|蛋/.test(name)) return '肉禽蛋品';
    if (/车厘子|橙|瓜|莓|蕉|果|苹/.test(name)) return '时令水果';
    if (/奶|酸奶|乳/.test(name)) return '乳品烘焙';
    if (/萝卜|菜|茄|椒/.test(name)) return '新鲜蔬菜';
    if (/油|米|面|调味|干/.test(name)) return '粮油调味';
    if (/酒|水|饮料|茶/.test(name)) return '酒水饮料';
    return '其他';
  }

  function isFreightRefundAftersale(item) {
    return !!(
      item &&
      (item.refundScene === 'ORDER_FREIGHT' || item.type === '退运费')
    );
  }

  /** 处理中不计入退款合计，与订单详情一致 */
  function isCompletedMoneyRefund(item) {
    if (!item || item.type === '补货') return false;
    var st = item.status || '';
    return st === '已完成' || st === '退款成功';
  }

  function aftersaleRefundCents(item) {
    if (!item) return 0;
    return Math.max(
      0,
      yuanToCents(item.refundSubtotal != null ? item.refundSubtotal : item.refundAmount)
    );
  }

  function goodsMatchesAftersale(item, aftersale) {
    if (!item || !aftersale) return false;
    if (aftersale.goodId && item.id && aftersale.goodId === item.id) return true;
    return !!(aftersale.productName && item.name && aftersale.productName === item.name);
  }

  /**
   * 一行商品的退款金额 = 已完成商品售后 + 分摊已退运费。
   * 无售后明细时，按订单退款合计比例分摊。
   */
  function resolveSkuRefundCents(goods, aftersales, detail) {
    var n = goods.length;
    var out = [];
    var i;
    for (i = 0; i < n; i++) out.push(0);
    if (!n) return out;

    (aftersales || []).forEach(function (as) {
      if (!isCompletedMoneyRefund(as) || isFreightRefundAftersale(as)) return;
      var cents = aftersaleRefundCents(as);
      if (!cents) return;
      var idx = -1;
      for (i = 0; i < n; i++) {
        if (goodsMatchesAftersale(goods[i], as)) {
          idx = i;
          break;
        }
      }
      if (idx < 0 && n === 1) idx = 0;
      if (idx >= 0) out[idx] += cents;
    });

    var freightRefunded = 0;
    if (detail && detail.freight && detail.freight.refunded != null) {
      freightRefunded = Math.max(0, yuanToCents(detail.freight.refunded));
    } else {
      (aftersales || []).forEach(function (as) {
        if (!isCompletedMoneyRefund(as) || !isFreightRefundAftersale(as)) return;
        freightRefunded += aftersaleRefundCents(as);
      });
    }
    var freightParts = allocateCents(freightRefunded, goods.map(skuAmountCents));
    for (i = 0; i < n; i++) out[i] += freightParts[i] || 0;

    var assigned = 0;
    for (i = 0; i < n; i++) assigned += out[i];
    var orderRefund = Math.max(0, yuanToCents(detail && detail.amounts && detail.amounts.refund));
    if (orderRefund > 0 && assigned === 0) {
      return allocateCents(orderRefund, goods.map(skuAmountCents));
    }
    if (orderRefund > assigned) {
      var leftover = allocateCents(orderRefund - assigned, goods.map(skuAmountCents));
      for (i = 0; i < n; i++) out[i] += leftover[i] || 0;
    }
    return out;
  }

  function resolveLiveSessionExport(row, detail) {
    var fromRow = row && row.getAttribute('data-live-session');
    fromRow = String(fromRow || '').trim();
    if (fromRow) return fromRow;
    var tags = detail && detail.tags;
    var fromDetail = tags && (tags.liveSession || tags.livePeriod);
    fromDetail = String(fromDetail || '').trim();
    if (fromDetail && fromDetail !== '-') return fromDetail;
    return '—';
  }

  function getOrderExportColMap() {
    if (isRetailOrderPage()) {
      return {
        orderNo: 0,
        orderTime: 1,
        nickname: 2,
        receiverName: 3,
        receiverPhone: 4,
        goods: 5,
        qty: 6,
        marketingType: 7,
        payable: 8,
        discount: 9,
        coupon: 10,
        pointsUsed: 11,
        pointsDeduct: 12,
        paid: 13,
        scene: 14,
        deliveryMode: 15,
        payChannel: 16,
        store: 17,
        payNo: 18,
        orderStatus: 19
      };
    }
    return {
      orderNo: 0,
      orderTime: 1,
      nickname: 2,
      receiverName: 3,
      receiverPhone: 4,
      goods: 5,
      qty: 6,
      payable: 7,
      discount: 8,
      coupon: 9,
      pointsUsed: 10,
      pointsDeduct: 11,
      paid: 12,
      payChannel: 13,
      deliveryMode: 14,
      store: 15,
      payNo: 16,
      orderStatus: 17
    };
  }

  function collectOrderGoodsExportLines(row) {
    var cells = getOrderExportDataCells(row);
    var col = getOrderExportColMap();
    var detail = resolveOrderDetailForExport(row) || {};
    var goods = Array.isArray(detail.goods) && detail.goods.length ? detail.goods : [{}];
    var freightCents = resolveOrderFreightCents(detail);
    var goodsPaidCents = resolveGoodsPaidCents(detail.amounts, freightCents);
    var weights = goods.map(skuAmountCents);
    var paidParts = allocateCents(goodsPaidCents, weights);
    var freightParts = allocateCents(freightCents, weights);
    var refundParts = resolveSkuRefundCents(goods, detail.aftersales, detail);
    var aftersaleStatus = '';
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.getOrderAftersaleStatus === 'function') {
      aftersaleStatus = window.OrderLiveDetail.getOrderAftersaleStatus(
        row.getAttribute('data-order-id'),
        row
      ) || '';
    } else {
      aftersaleStatus = row.getAttribute('data-as-status') || '';
    }
    var base = {
      orderNo: cellTextOf(cells, col.orderNo),
      orderTime: cellTextOf(cells, col.orderTime),
      nickname: cellTextOf(cells, col.nickname),
      receiverName: cellTextOf(cells, col.receiverName),
      receiverPhone: cellTextOf(cells, col.receiverPhone),
      qty: cellTextOf(cells, col.qty),
      marketingType: col.marketingType != null ? cellTextOf(cells, col.marketingType) : '',
      payable: cellTextOf(cells, col.payable),
      discount: cellTextOf(cells, col.discount),
      coupon: cellTextOf(cells, col.coupon),
      pointsUsed: cellTextOf(cells, col.pointsUsed),
      pointsDeduct: cellTextOf(cells, col.pointsDeduct),
      scene: col.scene != null ? cellTextOf(cells, col.scene) : '',
      deliveryMode: cellTextOf(cells, col.deliveryMode),
      payChannel: cellTextOf(cells, col.payChannel),
      store: cellTextOf(cells, col.store),
      payNo: cellTextOf(cells, col.payNo),
      orderStatus: cellTextOf(cells, col.orderStatus),
      address: (detail.delivery && (detail.delivery.address || detail.delivery.homeAddress)) || '—',
      aftersaleStatus: aftersaleStatus || '—',
      liveSession: resolveLiveSessionExport(row, detail)
    };
    return goods.map(function (item, index) {
      return Object.assign({}, base, {
        goodsName: resolveGoodsExportName(item, cellTextOf(cells, col.goods)),
        spec: resolveGoodsExportSpec(item),
        skuCode: (item && (item.sku || item.skuCode || item.spu)) || '—',
        category: resolveGoodsCategory(item),
        allocatedFreight: centsToYuanText(freightParts[index] || 0),
        paidWithoutFreight: centsToYuanText(paidParts[index] || 0),
        paidWithFreight: centsToYuanText((paidParts[index] || 0) + (freightParts[index] || 0)),
        refundAmount: centsToYuanText(refundParts[index] || 0)
      });
    });
  }

  function collectOrderExportRecords(spec, orderRows) {
    var records = [];
    (orderRows || []).forEach(function (row) {
      if (spec.kind === 'order') {
        records = records.concat(collectOrderGoodsExportLines(row));
      }
    });
    return records;
  }

  function csvEscape(value) {
    var s = String(value == null ? '' : value);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function buildOrderExportCsv(spec, fieldKeys, records) {
    var fields = (spec.fields || []).filter(function (f) {
      return fieldKeys.indexOf(f.key) >= 0;
    });
    var header = fields.map(function (f) {
      return csvEscape(f.label);
    }).join(',');
    var lines = [header];
    records.forEach(function (rec) {
      lines.push(
        fields
          .map(function (f) {
            return csvEscape(rec[f.key]);
          })
          .join(',')
      );
    });
    return '\ufeff' + lines.join('\r\n');
  }

  /** 范围内有清分数据的行数：SKU 清分项优先，否则门店明细 */
  function countClearingExportRows(orderRows) {
    var count = 0;
    (orderRows || []).forEach(function (row) {
      var detail = resolveOrderDetailForExport(row);
      if (!detail || detail.clearingEmpty) return;
      var clearing = detail.clearing || {};
      if (clearing.skus && clearing.skus.length) {
        clearing.skus.forEach(function (sku) {
          count += (sku.rows && sku.rows.length) ? sku.rows.length : 0;
        });
        return;
      }
      var storeRows = clearing.storeRows || [];
      if (storeRows.length && detail.storeCommissionRate != null && detail.storeCommissionRate !== '') {
        count += storeRows.length;
      }
    });
    return count;
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
    var sourceRows = scope === 'selected' ? getCheckedOrderListRows(spec) : getVisibleOrderListRows();
    var exportRecords = spec.kind === 'order' ? collectOrderExportRecords(spec, sourceRows) : [];
    var count =
      spec.kind === 'clearing'
        ? countClearingExportRows(sourceRows)
        : spec.kind === 'order'
          ? exportRecords.length
          : sourceRows.length;
    var unit =
      spec.kind === 'clearing'
        ? '条清分明细'
        : spec.kind === 'order'
          ? '条商品明细'
          : '条';
    var csvContent =
      spec.kind === 'order' ? buildOrderExportCsv(spec, fieldKeys, exportRecords) : '';
    var fileExt = spec.kind === 'order' ? '.csv' : '.xlsx';
    if (window.LfFileCenterNotify && typeof window.LfFileCenterNotify.bump === 'function') {
      window.LfFileCenterNotify.bump(
        {
          title: spec.taskTitle || '订单列表导出',
          type: spec.taskType || 'order-list-export',
          fileName: spec.filePrefix + stamp + fileExt,
          csvContent: csvContent,
          size: csvContent ? (csvContent.length / 1024).toFixed(1) + ' KB' : undefined
        },
        { fromEl: triggerEl, toast: false }
      );
    }
    if (typeof showToast === 'function') {
      showToast(
        '已提交导出' + scopeLabel + '（' + count + ' ' + unit + '，' + fieldKeys.length + ' 个字段），请到文件中心下载',
        'success'
      );
    }
  }

  function openOrderListExportModal(kind) {
    var spec = getOrderExportSpec(kind);
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
      '<h3 id="orderListExportTitle" class="order-export-modal__title">' +
      spec.title +
      '</h3>' +
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
      var pickedRows = scope === 'selected' ? getCheckedOrderListRows(spec) : getVisibleOrderListRows();
      if (scope === 'selected' && !pickedRows.length) {
        if (typeof showToast === 'function') showToast('请先勾选要导出的订单', 'warning');
        return;
      }
      if (scope === 'query' && !pickedRows.length) {
        if (typeof showToast === 'function') showToast('当前查询无数据可导出', 'warning');
        return;
      }
      if (spec.kind === 'clearing' && !countClearingExportRows(pickedRows)) {
        if (typeof showToast === 'function') showToast('所选订单暂无清分明细可导出', 'warning');
        return;
      }
      writeOrderExportFields(spec, fieldKeys);
      closeOrderExportModal();
      document.removeEventListener('keydown', onKeydown);
      submitOrderListExport(spec, scope, fieldKeys, document.getElementById(spec.btnId));
    });
  }

  function bindOrderExportButton(kind) {
    var spec = getOrderExportSpec(kind);
    if (!spec) return;
    var exportBtn = document.getElementById(spec.btnId);
    if (!exportBtn || exportBtn.dataset.orderExportBound) return;
    exportBtn.dataset.orderExportBound = '1';
    exportBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openOrderListExportModal(kind);
    });
  }

  function initOrderListExport() {
    var spec = getOrderPageCheckSpec() || getOrderExportSpec();
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

    bindOrderExportButton('order');
    bindOrderExportButton('clearing');
  }

  function classifyRetailBatchRefundRows(rows, sku) {
    var eligible = [];
    var noSku = [];
    var blocked = [];
    rows.forEach(function (row) {
      var orderId = row.getAttribute('data-order-id');
      var good = findRowGoodBySkuName(row, sku.name);
      if (!good) {
        noSku.push(row);
        return;
      }
      if (!canRetailOpenAftersale(row) || skuHasOpenAftersale(orderId, row, sku.name)) {
        blocked.push(row);
        return;
      }
      eligible.push({ row: row, orderId: orderId, good: good });
    });
    return { eligible: eligible, noSku: noSku, blocked: blocked };
  }

  function classifyRetailBatchOrderRefundRows(rows) {
    var eligible = [];
    var blocked = [];
    rows.forEach(function (row) {
      var orderId = row.getAttribute('data-order-id');
      if (!canRetailOpenAftersale(row)) {
        blocked.push(row);
        return;
      }
      var goods = (getOrderGoods(orderId, row) || []).filter(function (g) {
        return g && g.name && !skuHasOpenAftersale(orderId, row, g.name);
      });
      if (!goods.length) {
        blocked.push(row);
        return;
      }
      eligible.push({ row: row, orderId: orderId, goods: goods });
    });
    return { eligible: eligible, blocked: blocked };
  }

  function openRetailBatchRefund(opts) {
    if (!window.OrderPlatformAftersale || typeof window.OrderPlatformAftersale.openBatch !== 'function') {
      if (typeof showToast === 'function') showToast('发起售后模块未加载', 'error');
      return;
    }
    window.OrderPlatformAftersale.openBatch({
      scope: opts.scope,
      sku: opts.sku || {},
      targets: opts.targets,
      excluded: opts.excluded || 0,
      onDone: syncOrderExportChecks
    });
  }

  function initRetailBatchRefund() {
    if (!document.body || document.body.getAttribute('data-order-page') !== 'retail') return;
    var btn = document.getElementById('orderRetailBatchRefund');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (applyOrderListFilters() === false) return;

      var spec = getOrderPageCheckSpec();
      var rows = getCheckedOrderListRows(spec);
      if (!rows.length) {
        if (typeof showToast === 'function') showToast('请先勾选要申请退款的订单', 'error');
        return;
      }

      var productQ = getRetailProductQuery();
      if (!productQ) {
        var orderGroups = classifyRetailBatchOrderRefundRows(rows);
        if (!orderGroups.eligible.length) {
          if (typeof showToast === 'function') {
            showToast('所选订单当前不可整单退款（状态不符或商品售后处理中）', 'error');
          }
          return;
        }
        openRetailBatchRefund({
          scope: 'order',
          targets: orderGroups.eligible,
          excluded: orderGroups.blocked.length
        });
        return;
      }

      var visible = getVisibleOrderListRows();
      var skus = collectMatchingSkuNames(visible, productQ);
      if (!skus.length) {
        if (typeof showToast === 'function') showToast('当前筛选没有匹配的商品', 'error');
        return;
      }
      if (skus.length > 1) {
        if (typeof showToast === 'function') {
          showToast('当前搜索命中多个商品，请精确到单个商品后再按 SKU 批量退款', 'error');
        }
        return;
      }

      var sku = skus[0];
      var groups = classifyRetailBatchRefundRows(rows, sku);
      if (!groups.eligible.length) {
        var msg = '所选订单当前不可申请该商品退款';
        if (groups.noSku.length && !groups.blocked.length) {
          msg = '所选订单中没有「' + sku.name + '」';
        } else if (groups.blocked.length && !groups.noSku.length) {
          msg = '所选订单当前不可申请退款（状态不符或该商品售后处理中）';
        }
        if (typeof showToast === 'function') showToast(msg, 'error');
        return;
      }
      openRetailBatchRefund({
        scope: 'sku',
        sku: sku,
        targets: groups.eligible,
        excluded: groups.noSku.length + groups.blocked.length
      });
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

  function bootOrderListPage() {
    initFilter();
    initPagination();
    initVerifyPickup();
    initRetailExpressUpload();
    initRetailBatchExpressUpload();
    initRetailBatchRefund();
    initRetailActionLayout();
    initRetailCancelAndRefund();
    initOrderListExport();
    ensureOrderTimePreset();
    applyOrderListFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootOrderListPage);
  } else {
    bootOrderListPage();
  }
})();
