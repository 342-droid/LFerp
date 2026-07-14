/**
 * 售后 — 售后单列表
 */
(function () {
  var PAGE_SIZE_OPTIONS = [20, 50, 100];

  var SOURCES = ['用户自助发起', '运营代用户发起'];
  var TYPES = ['仅退款', '退货退款', '补货', '换货'];
  var STATUSES = ['待审批', '退款中', '已拒绝', '待退货', '已收货', '退款异常', '已完成', '已取消'];
  var ORDER_SOURCES = ['商城', '直播', '代采'];
  var LIVE_SESSIONS = ['默认经营池', 'ZB20260714-晚场', 'ZB20260713-早场'];
  var FULFILLMENTS = ['门店自提', '快递到店', '平台配送'];
  var NICKNAMES = ['牛小牛呀', '冷丰用户', '悠悠生鲜粉', '门店会员A'];
  var PHONES = ['17739589272', '13800138000', '15922345621', '18600001111'];
  var STORES = ['南京万达店', '斯斯门店商家2', '杭州西湖店', '上海徐家汇店'];
  var ADDRESSES = [
    '浙江省杭州市萧山区宁围街道...',
    '江苏省南京市建邺区河西大街...',
    '上海市徐汇区漕溪北路...',
    '浙江省杭州市上城区望江路...'
  ];
  var PRODUCTS = [
    '牛牛专用香梨-计重甜香脆',
    '爆米花--清分专用小袋装',
    '冷丰优选车厘子 3斤装',
    '精品牛腩 500g'
  ];
  var REASONS = ['质量问题', '未收到货', '发错货', '其他'];
  var APPROVERS = ['系统', '超级管理员'];
  var REFUND_EXEC = ['未发起退款', '待退款', '退款执行中', '退款成功', '退款失败'];

  /** 售后状态与退款执行状态的合理组合 */
  function resolveRefundExec(status, i) {
    if (status === '已完成') return '退款成功';
    if (status === '退款中') return i % 3 === 0 ? '退款执行中' : '待退款';
    if (status === '退款异常') return '退款失败';
    if (status === '已拒绝' || status === '已取消' || status === '待审批') return '未发起退款';
    if (status === '待退货' || status === '已收货') return i % 3 === 0 ? '待退款' : '未发起退款';
    return REFUND_EXEC[i % REFUND_EXEC.length];
  }

  function pad(n, len) {
    var s = String(n);
    while (s.length < (len || 2)) s = '0' + s;
    return s;
  }

  function money(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function buildMockRows(count) {
    var list = [];
    for (var i = 0; i < count; i++) {
      var applyAmt = [0.03, 0.02, 2.75, 0.75, 2.0, 0.1, 0.04, 1.2][i % 8];
      var day = pad((i % 28) + 1);
      var hour = pad(10 + (i % 10));
      var minute = pad((i * 3) % 60);
      var second = pad((i * 7) % 60);
      var occurAt = '2026-07-14 ' + hour + ':' + minute + ':' + second;
      var applyAt = '2026-07-14 ' + hour + ':' + minute + ':' + pad(Math.max(0, parseInt(second, 10) - 1), 2);
      var approveAt = occurAt;
      var updateAt = '2026-07-14 ' + hour + ':' + pad((parseInt(minute, 10) + 1) % 60) + ':' + pad((parseInt(second, 10) + 8) % 60);
      // 全量覆盖枚举；约一半为已完成，其余轮询各状态便于筛选联调
      var status = i % 2 === 0 ? '已完成' : STATUSES[Math.floor(i / 2) % STATUSES.length];
      list.push({
        id: 'AS-335' + String(300000000000000 + i * 117 + day).slice(0, 15),
        source: SOURCES[i % SOURCES.length],
        type: TYPES[i % TYPES.length],
        status: status,
        orderSource: ORDER_SOURCES[i % ORDER_SOURCES.length],
        liveSession: LIVE_SESSIONS[i % LIVE_SESSIONS.length],
        fulfillment: i % 3 === 0 ? '快递到店' : FULFILLMENTS[i % FULFILLMENTS.length],
        nickname: NICKNAMES[i % NICKNAMES.length],
        phone: PHONES[i % PHONES.length],
        store: STORES[i % STORES.length],
        storeAddress: ADDRESSES[i % ADDRESSES.length],
        productName: PRODUCTS[i % PRODUCTS.length],
        applyAmount: money(applyAmt),
        approveAmount: money(applyAmt),
        refundExecStatus: resolveRefundExec(status, i),
        actualAmount: money(applyAmt),
        couponAmount: '0.00',
        pointsAmount: 0,
        reason: REASONS[i % REASONS.length],
        approver: APPROVERS[i % APPROVERS.length],
        settleStatus: '-',
        occurTime: occurAt,
        approveTime: approveAt,
        applyTime: applyAt,
        updateTime: updateAt,
        orderNo: 'ORD-3212689' + pad(200000 + i, 7)
      });
    }
    return list;
  }

  var ALL_ROWS = buildMockRows(115);

  var state = {
    page: 1,
    pageSize: 20,
    collapsed: false,
    filters: {},
    filtered: ALL_ROWS.slice()
  };

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

  function statusTag(status) {
    var cls = 'aftersale-tag aftersale-tag--info';
    if (status === '已完成') cls = 'aftersale-tag aftersale-tag--success';
    else if (status === '已拒绝' || status === '已取消' || status === '退款异常') {
      cls = 'aftersale-tag aftersale-tag--danger';
    } else if (
      status === '待审批' ||
      status === '退款中' ||
      status === '待退货' ||
      status === '已收货'
    ) {
      cls = 'aftersale-tag aftersale-tag--warning';
    }
    return '<span class="' + cls + '">' + escapeHtml(status) + '</span>';
  }

  function refundExecTag(status) {
    var cls = 'aftersale-tag aftersale-tag--info';
    if (status === '退款成功') cls = 'aftersale-tag aftersale-tag--success';
    else if (status === '退款失败') cls = 'aftersale-tag aftersale-tag--danger';
    else if (status === '待退款' || status === '退款执行中') cls = 'aftersale-tag aftersale-tag--warning';
    return '<span class="' + cls + '">' + escapeHtml(status) + '</span>';
  }

  function detailLinkAttrs(row) {
    return (
      ' class="aftersale-link js-as-detail" data-id="' +
      escapeHtml(row.id) +
      '" data-status="' +
      escapeHtml(row.status) +
      '" data-type="' +
      escapeHtml(row.type) +
      '" data-order-source="' +
      escapeHtml(row.orderSource) +
      '" data-delivery="' +
      escapeHtml(row.fulfillment) +
      '"'
    );
  }

  function renderActionCell(row) {
    var html =
      '<td class="aftersale-table__td aftersale-table__td--action">' +
      '<div class="aftersale-action">' +
      '<a href="#"' +
      detailLinkAttrs(row) +
      '>查看详情</a>';
    if (row.status === '待审批') {
      html +=
        '<div class="aftersale-more">' +
        '<button type="button" class="aftersale-more__trigger js-as-more" aria-expanded="false" data-id="' +
        escapeHtml(row.id) +
        '">更多<svg class="aftersale-more__caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="aftersale-more__menu" role="menu">' +
        '<button type="button" class="aftersale-more__item js-as-cancel" role="menuitem" data-id="' +
        escapeHtml(row.id) +
        '">取消售后单</button>' +
        '</div>' +
        '</div>';
    }
    html += '</div></td>';
    return html;
  }

  function readFilters() {
    state.filters = {
      ticketNo: (($('asTicketNo') || {}).value || '').trim(),
      orderNo: (($('asOrderNo') || {}).value || '').trim(),
      orderSource: ($('asOrderSource') || {}).value || '',
      phone: (($('asUserPhone') || {}).value || '').trim(),
      productName: (($('asProductName') || {}).value || '').trim(),
      type: ($('asType') || {}).value || '',
      status: ($('asStatus') || {}).value || '',
      refundExecStatus: ($('asRefundExecStatus') || {}).value || '',
      reason: ($('asReason') || {}).value || '',
      applyMin: ($('asApplyAmountMin') || {}).value || '',
      applyMax: ($('asApplyAmountMax') || {}).value || '',
      approver: ($('asApprover') || {}).value || '',
      execMin: ($('asExecAmountMin') || {}).value || '',
      execMax: ($('asExecAmountMax') || {}).value || '',
      source: ($('asSource') || {}).value || '',
      liveSession: (($('asLiveSession') || {}).value || '').trim(),
      applyStart: (($('asApplyTimeStart') || {}).value || '').trim(),
      applyEnd: (($('asApplyTimeEnd') || {}).value || '').trim(),
      approveStart: (($('asApproveTimeStart') || {}).value || '').trim(),
      approveEnd: (($('asApproveTimeEnd') || {}).value || '').trim(),
      refundStart: (($('asRefundTimeStart') || {}).value || '').trim(),
      refundEnd: (($('asRefundTimeEnd') || {}).value || '').trim()
    };
  }

  function inRange(val, min, max) {
    var n = parseFloat(val);
    if (isNaN(n)) return false;
    if (min !== '' && !isNaN(parseFloat(min)) && n < parseFloat(min)) return false;
    if (max !== '' && !isNaN(parseFloat(max)) && n > parseFloat(max)) return false;
    return true;
  }

  function matchRow(row) {
    var f = state.filters;
    if (f.ticketNo && row.id.indexOf(f.ticketNo) < 0) return false;
    if (f.orderNo && String(row.orderNo).indexOf(f.orderNo) < 0) return false;
    if (f.orderSource && row.orderSource !== f.orderSource) return false;
    if (f.phone && row.phone.indexOf(f.phone) < 0) return false;
    if (f.productName && row.productName.indexOf(f.productName) < 0) return false;
    if (f.type && row.type !== f.type) return false;
    if (f.status && row.status !== f.status) return false;
    if (f.refundExecStatus && row.refundExecStatus !== f.refundExecStatus) return false;
    if (f.reason && row.reason !== f.reason) return false;
    if ((f.applyMin || f.applyMax) && !inRange(row.applyAmount, f.applyMin, f.applyMax)) return false;
    if (f.approver && row.approver !== f.approver) return false;
    if ((f.execMin || f.execMax) && !inRange(row.actualAmount, f.execMin, f.execMax)) return false;
    if (f.source && row.source !== f.source) return false;
    if (f.liveSession && row.liveSession.indexOf(f.liveSession) < 0) return false;
    if (f.applyStart && row.applyTime < f.applyStart) return false;
    if (f.applyEnd && row.applyTime > f.applyEnd) return false;
    if (f.approveStart && row.approveTime < f.approveStart) return false;
    if (f.approveEnd && row.approveTime > f.approveEnd) return false;
    if (f.refundStart && row.updateTime < f.refundStart) return false;
    if (f.refundEnd && row.updateTime > f.refundEnd) return false;
    return true;
  }

  function applyFilters() {
    state.filtered = ALL_ROWS.filter(matchRow);
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function renderTable() {
    var tbody = $('asTicketTableBody');
    var empty = $('asTicketEmpty');
    var totalEl = $('asTicketTotal');
    if (!tbody) return;

    var start = (state.page - 1) * state.pageSize;
    var rows = state.filtered.slice(start, start + state.pageSize);
    if (totalEl) totalEl.textContent = '共 ' + state.filtered.length + ' 条';

    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
      renderPagination();
      return;
    }
    if (empty) empty.hidden = true;

    tbody.innerHTML = rows
      .map(function (row) {
        return (
          '<tr data-id="' +
          escapeHtml(row.id) +
          '">' +
          '<td class="aftersale-table__td aftersale-table__td--ticket"><a href="#"' +
          detailLinkAttrs(row) +
          '>' +
          escapeHtml(row.id) +
          '</a></td>' +
          '<td>' +
          escapeHtml(row.source) +
          '</td>' +
          '<td>' +
          escapeHtml(row.type) +
          '</td>' +
          '<td>' +
          statusTag(row.status) +
          '</td>' +
          '<td>' +
          escapeHtml(row.orderSource) +
          '</td>' +
          '<td>' +
          escapeHtml(row.liveSession) +
          '</td>' +
          '<td>' +
          escapeHtml(row.fulfillment) +
          '</td>' +
          '<td><div class="aftersale-user"><span>' +
          escapeHtml(row.nickname) +
          '</span><span class="aftersale-user__phone">' +
          escapeHtml(row.phone) +
          '</span></div></td>' +
          '<td>' +
          escapeHtml(row.store) +
          '</td>' +
          '<td><span class="aftersale-ellipsis" title="' +
          escapeHtml(row.storeAddress) +
          '">' +
          escapeHtml(row.storeAddress) +
          '</span></td>' +
          '<td><span class="aftersale-ellipsis" title="' +
          escapeHtml(row.productName) +
          '">' +
          escapeHtml(row.productName) +
          '</span></td>' +
          '<td>' +
          escapeHtml(row.applyAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.approveAmount) +
          '</td>' +
          '<td>' +
          refundExecTag(row.refundExecStatus) +
          '</td>' +
          '<td>' +
          escapeHtml(row.actualAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.couponAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.pointsAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.reason) +
          '</td>' +
          '<td>' +
          escapeHtml(row.approver) +
          '</td>' +
          '<td>' +
          escapeHtml(row.settleStatus) +
          '</td>' +
          '<td>' +
          escapeHtml(row.occurTime) +
          '</td>' +
          '<td>' +
          escapeHtml(row.approveTime) +
          '</td>' +
          '<td>' +
          escapeHtml(row.applyTime) +
          '</td>' +
          '<td>' +
          escapeHtml(row.updateTime) +
          '</td>' +
          renderActionCell(row) +
          '</tr>'
        );
      })
      .join('');

    renderPagination();
  }

  function renderPagination() {
    var pagesEl = $('asTicketPages');
    var jumpEl = $('asTicketJump');
    if (!pagesEl) return;
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    var page = state.page;
    if (jumpEl) jumpEl.value = String(page);

    var html =
      '<button type="button" class="aftersale-page-btn" data-page="' +
      (page - 1) +
      '"' +
      (page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>';

    var start = Math.max(1, page - 2);
    var end = Math.min(totalPages, start + 5);
    start = Math.max(1, end - 5);
    for (var i = start; i <= end; i++) {
      html +=
        '<button type="button" class="aftersale-page-btn' +
        (i === page ? ' is-active' : '') +
        '" data-page="' +
        i +
        '">' +
        i +
        '</button>';
    }
    html +=
      '<button type="button" class="aftersale-page-btn" data-page="' +
      (page + 1) +
      '"' +
      (page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function refresh(resetPage) {
    if (resetPage) state.page = 1;
    readFilters();
    applyFilters();
    renderTable();
  }

  function bindEvents() {
    var queryBtn = $('asTicketQuery');
    var resetBtn = $('asTicketReset');
    var collapseBtn = $('asTicketCollapse');
    var exportBtn = $('asTicketExport');
    var sizeEl = $('asTicketPageSize');
    var pagesEl = $('asTicketPages');
    var jumpGo = $('asTicketJumpGo');
    var jumpEl = $('asTicketJump');
    var tbody = $('asTicketTableBody');

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        refresh(true);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = $('asTicketFilterForm');
        if (form) form.reset();
        refresh(true);
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        state.collapsed = !state.collapsed;
        var grid = $('asTicketFilterGrid');
        var label = $('asTicketCollapseLabel');
        if (grid) grid.classList.toggle('is-collapsed', state.collapsed);
        if (label) label.textContent = state.collapsed ? '展开' : '收起';
        collapseBtn.setAttribute('aria-expanded', state.collapsed ? 'false' : 'true');
        var svg = collapseBtn.querySelector('svg path');
        if (svg) svg.setAttribute('d', state.collapsed ? 'M6 9l6 6 6-6' : 'M18 15l-6-6-6 6');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (typeof showToast === 'function') showToast('导出列表（演示）共 ' + state.filtered.length + ' 条', 'success');
      });
    }

    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        refresh(true);
      });
    }

    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.aftersale-page-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.getAttribute('data-page'), 10);
        if (!p || p === state.page) return;
        state.page = p;
        renderTable();
      });
    }

    function jumpTo() {
      var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      var val = parseInt((jumpEl && jumpEl.value) || '1', 10);
      if (!val || val < 1) val = 1;
      if (val > totalPages) val = totalPages;
      state.page = val;
      renderTable();
    }

    if (jumpGo) jumpGo.addEventListener('click', jumpTo);
    if (jumpEl) {
      jumpEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          jumpTo();
        }
      });
    }

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var moreBtn = e.target.closest('.js-as-more');
        if (moreBtn) {
          e.preventDefault();
          e.stopPropagation();
          var wrap = moreBtn.closest('.aftersale-more');
          var willOpen = wrap && !wrap.classList.contains('is-open');
          closeAllMoreMenus();
          if (willOpen && wrap) {
            wrap.classList.add('is-open');
            moreBtn.setAttribute('aria-expanded', 'true');
            var actionTd = wrap.closest('.aftersale-table__td--action');
            if (actionTd) actionTd.classList.add('is-more-open');
            positionMoreMenu(wrap, moreBtn);
          }
          return;
        }

        var cancelBtn = e.target.closest('.js-as-cancel');
        if (cancelBtn) {
          e.preventDefault();
          e.stopPropagation();
          var cancelId = cancelBtn.getAttribute('data-id');
          cancelAftersale(cancelId);
          closeAllMoreMenus();
          return;
        }

        var link = e.target.closest('.js-as-detail');
        if (!link) return;
        e.preventDefault();
        var id = link.getAttribute('data-id');
        var status = link.getAttribute('data-status') || '';
        var type = link.getAttribute('data-type') || '';
        var orderSource = link.getAttribute('data-order-source') || '';
        var delivery = link.getAttribute('data-delivery') || '';
        var wp = window.wmsPath;
        var base =
          wp && typeof wp.page === 'function'
            ? wp.page('mdm_aftersale_ticket_detail.html')
            : 'mdm_aftersale_ticket_detail.html';
        window.location.href =
          base +
          '?id=' +
          encodeURIComponent(id || '') +
          '&status=' +
          encodeURIComponent(status) +
          '&type=' +
          encodeURIComponent(type) +
          '&orderSource=' +
          encodeURIComponent(orderSource) +
          '&delivery=' +
          encodeURIComponent(delivery);
      });
    }

    document.addEventListener('click', function () {
      closeAllMoreMenus();
    });

    var tableWrap = document.querySelector('.aftersale-table-wrap');
    if (tableWrap) {
      tableWrap.addEventListener('scroll', function () {
        closeAllMoreMenus();
      });
    }
    window.addEventListener('resize', function () {
      closeAllMoreMenus();
    });
  }

  function closeAllMoreMenus() {
    document.querySelectorAll('.aftersale-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
      var btn = el.querySelector('.js-as-more');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      var td = el.closest('.aftersale-table__td--action');
      if (td) td.classList.remove('is-more-open');
      var menu = el.querySelector('.aftersale-more__menu');
      if (menu) {
        menu.classList.remove('is-fixed');
        menu.style.top = '';
        menu.style.left = '';
      }
    });
  }

  function positionMoreMenu(wrap, trigger) {
    var menu = wrap.querySelector('.aftersale-more__menu');
    if (!menu || !trigger) return;
    var rect = trigger.getBoundingClientRect();
    var menuWidth = Math.max(108, menu.offsetWidth || 108);
    var left = rect.left + rect.width / 2 - menuWidth / 2;
    var top = rect.bottom + 10;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    menu.classList.add('is-fixed');
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }

  function cancelAftersale(id) {
    var found = null;
    for (var i = 0; i < ALL_ROWS.length; i++) {
      if (ALL_ROWS[i].id === id) {
        found = ALL_ROWS[i];
        found.status = '已取消';
        found.refundExecStatus = '未发起退款';
        break;
      }
    }
    if (!found) return;
    applyFilters();
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    renderTable();
    if (typeof showToast === 'function') showToast('已取消售后单：' + id, 'success');
  }

  function init() {
    bindEvents();
    refresh(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
