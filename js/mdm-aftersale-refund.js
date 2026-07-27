/**
 * 售后 — 退款单列表
 * 筛选项：退款来源（售后退款/履约调整退款/订单取消退款）
 *         退款状态（未发起退款/待退款/退款执行中/退款成功/退款失败）
 * 线下付款：待退款时可「上传付款凭证」标记线下已付款
 */
(function () {
  var SOURCES = ['售后退款', '履约调整退款', '订单取消退款'];
  var STATUSES = ['未发起退款', '待退款', '退款执行中', '退款成功', '退款失败'];
  var METHODS = ['原路退回', '线下付款'];
  var CHANNELS = ['微信', '支付宝', '银行转账'];
  var TOTAL_DEMO = 742;

  var state = {
    page: 1,
    pageSize: 20,
    filters: {},
    filtered: [],
    uploadId: '',
    uploadProofDataUrl: '',
    detailId: ''
  };

  function $(id) {
    return document.getElementById(id);
  }

  function pad(n, len) {
    var s = String(n);
    len = len == null ? 2 : len;
    while (s.length < len) s = '0' + s;
    return s;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(n) {
    var num = Number(n);
    if (isNaN(num)) return '¥ 0.00';
    return '¥ ' + (Math.round(num * 100) / 100).toFixed(2);
  }

  function moneyPlain(n) {
    var num = Number(n);
    if (isNaN(num)) return '0.00';
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  function dash(v) {
    return v == null || v === '' || v === '-' ? '—' : v;
  }

  function statusTag(status) {
    var cls = 'aftersale-tag aftersale-tag--info';
    if (status === '退款成功') cls = 'aftersale-tag aftersale-tag--success';
    else if (status === '退款失败') cls = 'aftersale-tag aftersale-tag--danger';
    else if (status === '待退款' || status === '退款执行中' || status === '未发起退款') {
      cls = 'aftersale-tag aftersale-tag--warning';
    }
    return '<span class="' + cls + '">' + escapeHtml(status) + '</span>';
  }

  /** 线下付款且待退款：可上传付款凭证 */
  function canUploadVoucher(row) {
    return row.method === '线下付款' && row.status === '待退款' && !row.voucherUploaded;
  }

  function buildDemoRows() {
    var list = [];
    var amounts = [1, 0.2, 0.02, 12.5, 0.75, 2.0, 9.9, 0.1, 3.6, 0.5];
    for (var i = 0; i < TOTAL_DEMO; i++) {
      var source = SOURCES[i % SOURCES.length];
      var method = i % 5 === 2 || i % 7 === 0 ? '线下付款' : '原路退回';
      var status;
      if (method === '线下付款') {
        // 线下：多数待退款，部分成功
        status = i % 3 === 0 ? '退款成功' : '待退款';
      } else {
        var pool = ['退款成功', '退款成功', '退款成功', '待退款', '退款执行中', '退款失败', '未发起退款'];
        status = pool[i % pool.length];
      }
      var cash = amounts[i % amounts.length];
      var day = pad((i % 28) + 1);
      var hour = pad(10 + (i % 12));
      var minute = pad((i * 3) % 60);
      var second = pad((i * 7) % 60);
      var createdAt = '2026-07-' + day + ' ' + hour + ':' + minute + ':' + second;
      var updatedAt = createdAt;
      var completedAt = '';
      var payTxn = 'PAY-' + String(339307215640866816 + i * 97);
      var refundTxn = '';
      var channel = '';
      var actualPaid = null;
      var remark = '';
      var proofUrl = '';
      var voucherUploaded = false;
      var aftersaleId =
        source === '售后退款' ? 'AS-' + String(340048455512625152 + i * 131) : '';

      if (status === '退款成功') {
        completedAt = '2026-07-' + day + ' ' + hour + ':' + minute + ':' + pad(Math.min(59, parseInt(second, 10) + 3));
        updatedAt = completedAt;
        actualPaid = cash;
        if (method === '原路退回') {
          refundTxn = '0150default' + day + hour + minute + second + 'P' + pad(i % 10000, 4) + 'ac139d1200000';
        } else {
          voucherUploaded = true;
          channel = CHANNELS[i % CHANNELS.length];
          remark = '线下已打款';
          proofUrl = 'uploaded';
          refundTxn = '';
        }
      } else if (status === '退款执行中') {
        refundTxn = '003100TOP1B26' + pad(i, 8) + 'X';
      } else if (status === '退款失败') {
        refundTxn = 'FAIL' + pad(i, 10);
      }

      list.push({
        id: 'RF-' + String(340048510537699328 + i * 173),
        orderNo: 'ORD-2607' + pad(2500000 + (i % 999999), 7) + (i % 4 === 0 ? '-2' : ''),
        aftersaleId: aftersaleId,
        method: method,
        source: source,
        status: status,
        cashAmount: cash,
        actualPaid: actualPaid,
        payTxnNo: payTxn,
        refundTxnNo: refundTxn,
        channel: channel,
        createdAt: createdAt,
        updatedAt: updatedAt,
        completedAt: completedAt,
        remark: remark,
        proofUrl: proofUrl,
        voucherUploaded: voucherUploaded,
        offlineChannel: channel
      });
    }
    return list;
  }

  var ALL_ROWS = buildDemoRows();

  function queryParam(name) {
    var m = new RegExp('(?:\\?|&)' + name + '=([^&]*)').exec(window.location.search || '');
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  /** 售后单跳转带入的退款单：写入筛选框，并保证列表中有对应行 */
  function applyJumpQuery() {
    var refundNo = queryParam('refundNo');
    if (!refundNo) return false;

    var aftersaleId = queryParam('aftersaleId');
    var orderNo = queryParam('orderNo');
    var cashRaw = queryParam('cash');
    var method = queryParam('method') || '线下付款';
    var status = queryParam('status') || '待退款';
    var source = queryParam('source') || '售后退款';
    var createdAt = queryParam('createdAt') || nowStamp();
    var cash = parseFloat(cashRaw);
    if (isNaN(cash)) cash = 0;

    var refundNoEl = $('asRefundNo');
    var orderNoEl = $('asRefundOrderNo');
    var sourceEl = $('asRefundSource');
    var statusEl = $('asRefundStatus');
    if (refundNoEl) refundNoEl.value = refundNo;
    if (orderNoEl && orderNo) orderNoEl.value = orderNo;
    if (sourceEl && source) sourceEl.value = source;
    if (statusEl && status) statusEl.value = status;

    var found = null;
    for (var i = 0; i < ALL_ROWS.length; i++) {
      if (ALL_ROWS[i].id === refundNo) {
        found = ALL_ROWS[i];
        break;
      }
    }
    if (!found) {
      ALL_ROWS.unshift({
        id: refundNo,
        orderNo: orderNo || 'ORD-' + String(Date.now()).slice(-10),
        aftersaleId: aftersaleId || '',
        method: method,
        source: source,
        status: status,
        cashAmount: cash,
        actualPaid: status === '退款成功' ? cash : null,
        payTxnNo: 'PAY-' + String(Date.now()).slice(-15),
        refundTxnNo: '',
        channel: '',
        createdAt: createdAt,
        updatedAt: createdAt,
        completedAt: status === '退款成功' ? createdAt : '',
        remark: '',
        proofUrl: '',
        voucherUploaded: false,
        offlineChannel: ''
      });
    } else {
      if (aftersaleId) found.aftersaleId = aftersaleId;
      if (orderNo) found.orderNo = orderNo;
      if (method) found.method = method;
      if (status) found.status = status;
      if (!isNaN(cash) && cashRaw !== '') found.cashAmount = cash;
      if (source) found.source = source;
    }
    return true;
  }

  function nowStamp() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function readFilters() {
    state.filters = {
      refundNo: (($('asRefundNo') || {}).value || '').trim(),
      orderNo: (($('asRefundOrderNo') || {}).value || '').trim(),
      source: ($('asRefundSource') || {}).value || '',
      status: ($('asRefundStatus') || {}).value || '',
      txnNo: (($('asRefundTxnNo') || {}).value || '').trim()
    };
  }

  function matchRow(row) {
    var f = state.filters;
    if (f.refundNo && row.id.indexOf(f.refundNo) < 0) return false;
    if (f.orderNo && String(row.orderNo).indexOf(f.orderNo) < 0) return false;
    if (f.source && row.source !== f.source) return false;
    if (f.status && row.status !== f.status) return false;
    if (f.txnNo && String(row.refundTxnNo || '').indexOf(f.txnNo) < 0) return false;
    return true;
  }

  function applyFilters() {
    state.filtered = ALL_ROWS.filter(matchRow);
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function findRow(id) {
    for (var i = 0; i < ALL_ROWS.length; i++) {
      if (ALL_ROWS[i].id === id) return ALL_ROWS[i];
    }
    return null;
  }

  function ticketDetailHref(aftersaleId) {
    if (!aftersaleId) return '#';
    var wp = window.wmsPath;
    var base =
      wp && typeof wp.page === 'function'
        ? wp.page('mdm_aftersale_ticket_detail.html')
        : 'mdm_aftersale_ticket_detail.html';
    return base + '?id=' + encodeURIComponent(aftersaleId);
  }

  function renderActionCell(row) {
    var html =
      '<td class="aftersale-table__td aftersale-table__td--action">' +
      '<div class="aftersale-action">' +
      '<a href="#" class="aftersale-link js-as-refund-detail" data-id="' +
      escapeHtml(row.id) +
      '">查看详情</a>';
    if (canUploadVoucher(row)) {
      html +=
        '<a href="#" class="aftersale-link js-as-refund-upload" data-id="' +
        escapeHtml(row.id) +
        '">上传付款凭证</a>';
    }
    html += '</div></td>';
    return html;
  }

  function renderTable() {
    var tbody = $('asRefundTableBody');
    var empty = $('asRefundEmpty');
    var totalEl = $('asRefundTotal');
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
        var aftersaleCell = row.aftersaleId
          ? '<a class="aftersale-link" href="' +
            escapeHtml(ticketDetailHref(row.aftersaleId)) +
            '">' +
            escapeHtml(row.aftersaleId) +
            '</a>'
          : '—';
        return (
          '<tr data-id="' +
          escapeHtml(row.id) +
          '">' +
          '<td>' +
          escapeHtml(row.id) +
          '</td>' +
          '<td><a href="#" class="aftersale-link js-as-order-link" data-order="' +
          escapeHtml(row.orderNo) +
          '">' +
          escapeHtml(row.orderNo) +
          '</a></td>' +
          '<td>' +
          aftersaleCell +
          '</td>' +
          '<td>' +
          escapeHtml(row.method) +
          '</td>' +
          '<td>' +
          escapeHtml(row.source) +
          '</td>' +
          '<td>' +
          statusTag(row.status) +
          '</td>' +
          '<td>' +
          money(row.cashAmount) +
          '</td>' +
          '<td><span class="aftersale-ellipsis" title="' +
          escapeHtml(row.payTxnNo) +
          '">' +
          escapeHtml(dash(row.payTxnNo)) +
          '</span></td>' +
          '<td><span class="aftersale-ellipsis" title="' +
          escapeHtml(row.refundTxnNo || '') +
          '">' +
          escapeHtml(dash(row.refundTxnNo)) +
          '</span></td>' +
          '<td>' +
          escapeHtml(dash(row.channel)) +
          '</td>' +
          '<td>' +
          escapeHtml(row.createdAt.slice(0, 16)) +
          '</td>' +
          '<td>' +
          escapeHtml(row.updatedAt.slice(0, 16)) +
          '</td>' +
          renderActionCell(row) +
          '</tr>'
        );
      })
      .join('');

    renderPagination();
  }

  function pageBtn(p, label, opts) {
    opts = opts || {};
    return (
      '<button type="button" class="aftersale-page-btn' +
      (opts.active ? ' is-active' : '') +
      '"' +
      (opts.disabled ? ' disabled' : '') +
      ' data-page="' +
      p +
      '"' +
      (opts.aria ? ' aria-label="' + opts.aria + '"' : '') +
      '>' +
      label +
      '</button>'
    );
  }

  function renderPagination() {
    var pagesEl = $('asRefundPages');
    var jumpEl = $('asRefundJump');
    if (!pagesEl) return;
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    var page = state.page;
    if (jumpEl) jumpEl.value = String(page);

    var html = pageBtn(page - 1, '‹', { disabled: page <= 1, aria: '上一页' });

    var pages = [];
    if (totalPages <= 8) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      var left = Math.max(2, page - 2);
      var right = Math.min(totalPages - 1, page + 2);
      if (page <= 4) {
        left = 2;
        right = 6;
      }
      if (page >= totalPages - 3) {
        left = totalPages - 5;
        right = totalPages - 1;
      }
      if (left > 2) pages.push('…');
      for (var j = left; j <= right; j++) pages.push(j);
      if (right < totalPages - 1) pages.push('…');
      pages.push(totalPages);
    }

    pages.forEach(function (p) {
      if (p === '…') {
        html += '<span class="aftersale-pagination__ellipsis">…</span>';
      } else {
        html += pageBtn(p, String(p), { active: p === page });
      }
    });

    html += pageBtn(page + 1, '›', { disabled: page >= totalPages, aria: '下一页' });
    pagesEl.innerHTML = html;
  }

  function refresh(resetPage) {
    if (resetPage) state.page = 1;
    readFilters();
    applyFilters();
    renderTable();
  }

  /* —— 上传付款凭证 —— */
  function openUploadModal(id) {
    var row = findRow(id);
    if (!row || !canUploadVoucher(row)) return;
    state.uploadId = id;
    state.uploadProofDataUrl = '';

    var amountEl = $('asUploadAmount');
    var hintEl = $('asUploadAmountHint');
    var remarkEl = $('asUploadRemark');
    var countEl = $('asUploadRemarkCount');
    var inputEl = $('asUploadProofInput');
    if (amountEl) amountEl.value = moneyPlain(row.cashAmount);
    if (hintEl) hintEl.textContent = '最大不超过 ' + money(row.cashAmount);
    if (remarkEl) remarkEl.value = '';
    if (countEl) countEl.textContent = '0';
    if (inputEl) inputEl.value = '';
    resetProofPreview();

    var radios = document.querySelectorAll('input[name="asUploadChannel"]');
    radios.forEach(function (r) {
      r.checked = r.value === '银行转账';
    });

    showModal('asRefundUploadModal');
  }

  function resetProofPreview() {
    var preview = $('asUploadProofPreview');
    var addBtn = $('asUploadProofAdd');
    var img = $('asUploadProofImg');
    if (preview) preview.hidden = true;
    if (addBtn) addBtn.hidden = false;
    if (img) img.removeAttribute('src');
    state.uploadProofDataUrl = '';
  }

  function setProofPreview(dataUrl) {
    var preview = $('asUploadProofPreview');
    var addBtn = $('asUploadProofAdd');
    var img = $('asUploadProofImg');
    state.uploadProofDataUrl = dataUrl || '';
    if (img && dataUrl) img.src = dataUrl;
    if (preview) preview.hidden = !dataUrl;
    if (addBtn) addBtn.hidden = !!dataUrl;
  }

  function closeUploadModal() {
    hideModal('asRefundUploadModal');
    state.uploadId = '';
    resetProofPreview();
  }

  function confirmUpload() {
    var row = findRow(state.uploadId);
    if (!row) return;
    var amountEl = $('asUploadAmount');
    var remarkEl = $('asUploadRemark');
    var amount = parseFloat((amountEl && amountEl.value) || '');
    var remark = ((remarkEl && remarkEl.value) || '').trim();
    var channelEl = document.querySelector('input[name="asUploadChannel"]:checked');
    var channel = channelEl ? channelEl.value : '';

    if (isNaN(amount) || amount <= 0) {
      if (typeof showToast === 'function') showToast('请输入有效的退款金额', 'error');
      return;
    }
    if (amount > row.cashAmount + 1e-9) {
      if (typeof showToast === 'function') {
        showToast('退款金额不能超过 ' + money(row.cashAmount), 'error');
      }
      return;
    }
    if (!channel) {
      if (typeof showToast === 'function') showToast('请选择退款方式', 'error');
      return;
    }
    if (!remark) {
      if (typeof showToast === 'function') showToast('请输入退款备注', 'error');
      return;
    }
    if (!state.uploadProofDataUrl) {
      if (typeof showToast === 'function') showToast('请上传退款凭证', 'error');
      return;
    }

    var now = new Date();
    var stamp =
      now.getFullYear() +
      '-' +
      pad(now.getMonth() + 1) +
      '-' +
      pad(now.getDate()) +
      ' ' +
      pad(now.getHours()) +
      ':' +
      pad(now.getMinutes()) +
      ':' +
      pad(now.getSeconds());

    row.status = '退款成功';
    row.actualPaid = amount;
    row.offlineChannel = channel;
    row.channel = channel;
    row.remark = remark;
    row.proofUrl = state.uploadProofDataUrl;
    row.voucherUploaded = true;
    row.completedAt = stamp;
    row.updatedAt = stamp;

    closeUploadModal();
    applyFilters();
    renderTable();
    if (typeof showToast === 'function') showToast('线下付款已标记完成', 'success');
  }

  /* —— 退款单详情 —— */
  function descCell(label, valueHtml) {
    return (
      '<div class="aftersale-refund-desc__cell">' +
      '<div class="aftersale-refund-desc__label">' +
      escapeHtml(label) +
      '</div>' +
      '<div class="aftersale-refund-desc__value">' +
      valueHtml +
      '</div></div>'
    );
  }

  function descSection(title, cellsHtml) {
    return (
      '<section class="aftersale-refund-desc-card">' +
      '<h3 class="aftersale-refund-desc-card__title">' +
      escapeHtml(title) +
      '</h3>' +
      '<div class="aftersale-refund-desc">' +
      cellsHtml +
      '</div></section>'
    );
  }

  function linkOrDash(text, href, cls) {
    if (!text) return escapeHtml('—');
    if (!href || href === '#') {
      return (
        '<a href="#" class="aftersale-link ' +
        (cls || '') +
        '">' +
        escapeHtml(text) +
        '</a>'
      );
    }
    return (
      '<a href="' +
      escapeHtml(href) +
      '" class="aftersale-link">' +
      escapeHtml(text) +
      '</a>'
    );
  }

  function renderDetail(row) {
    var body = $('asRefundDetailBody');
    if (!body || !row) return;

    var orderLink =
      '<a href="#" class="aftersale-link js-as-order-link" data-order="' +
      escapeHtml(row.orderNo) +
      '">' +
      escapeHtml(row.orderNo) +
      '</a>';
    var aftersaleLink = row.aftersaleId
      ? linkOrDash(row.aftersaleId, ticketDetailHref(row.aftersaleId))
      : escapeHtml('—');

    var info =
      descCell('退款单号', escapeHtml(row.id)) +
      descCell('订单号', orderLink) +
      descCell('退款状态', statusTag(row.status)) +
      descCell('售后单号', aftersaleLink) +
      descCell('退款来源', escapeHtml(row.source)) +
      descCell('创建时间', escapeHtml(row.createdAt)) +
      descCell('退款完成时间', escapeHtml(dash(row.completedAt)));

    var actualInAmount =
      row.actualPaid != null && row.status === '退款成功'
        ? money(row.actualPaid)
        : '—';

    var amount =
      descCell('退款方式', escapeHtml(row.method)) +
      descCell('现金退款金额', escapeHtml(money(row.cashAmount))) +
      descCell('实际打款金额', escapeHtml(actualInAmount)) +
      descCell('原支付流水号', escapeHtml(dash(row.payTxnNo))) +
      descCell('退款流水号', escapeHtml(dash(row.refundTxnNo))) +
      descCell('退款渠道', escapeHtml(dash(row.channel)));

    var html = descSection('退款信息', info) + descSection('退款金额', amount);

    // 线下付款详情：展示支付凭证区块（图五）
    if (row.method === '线下付款') {
      var voucherActual =
        row.voucherUploaded && row.actualPaid != null
          ? money(row.actualPaid)
          : money(row.cashAmount);
      var proofHtml = '—';
      if (row.proofUrl && row.proofUrl !== 'uploaded') {
        proofHtml =
          '<img class="aftersale-refund-detail-proof" src="' +
          escapeHtml(row.proofUrl) +
          '" alt="支付凭证">';
      } else if (row.proofUrl === 'uploaded') {
        proofHtml = '<span class="aftersale-refund-detail-proof-ph">已上传凭证</span>';
      }

      var voucher =
        descCell('线下付款渠道', escapeHtml(dash(row.offlineChannel))) +
        descCell('实际打款金额', escapeHtml(voucherActual)) +
        descCell('退款备注', escapeHtml(dash(row.remark))) +
        descCell('支付凭证', proofHtml);
      html += descSection('支付凭证', voucher);
    }

    body.innerHTML = html;
  }

  function openDetailDrawer(id) {
    var row = findRow(id);
    if (!row) return;
    state.detailId = id;
    renderDetail(row);
    var backdrop = $('asRefundDetailBackdrop');
    var drawer = $('asRefundDetailDrawer');
    if (backdrop) backdrop.hidden = false;
    if (drawer) {
      drawer.hidden = false;
      drawer.setAttribute('aria-hidden', 'false');
    }
    // 强制回流后再加 is-open，保证从右侧滑入动画生效
    if (drawer) void drawer.offsetWidth;
    if (backdrop) backdrop.classList.add('is-open');
    if (drawer) drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailDrawer() {
    var backdrop = $('asRefundDetailBackdrop');
    var drawer = $('asRefundDetailDrawer');
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) backdrop.classList.remove('is-open');
    state.detailId = '';
    window.setTimeout(function () {
      if (drawer) drawer.hidden = true;
      if (backdrop) backdrop.hidden = true;
      if (!$('asRefundUploadModal') || $('asRefundUploadModal').style.display !== 'block') {
        document.body.style.overflow = '';
      }
    }, 220);
  }

  function showModal(id) {
    var el = $(id);
    if (!el) return;
    el.style.display = 'block';
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function hideModal(id) {
    var el = $(id);
    if (!el) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    var drawer = $('asRefundDetailDrawer');
    var drawerOpen = drawer && !drawer.hidden && drawer.classList.contains('is-open');
    if (!drawerOpen) {
      document.body.style.overflow = '';
    }
  }

  function bindEvents() {
    var queryBtn = $('asRefundQuery');
    var resetBtn = $('asRefundReset');
    var sizeEl = $('asRefundPageSize');
    var pagesEl = $('asRefundPages');
    var jumpEl = $('asRefundJump');
    var tbody = $('asRefundTableBody');

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        refresh(true);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = $('asRefundFilterForm');
        if (form) form.reset();
        refresh(true);
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

    if (jumpEl) {
      jumpEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          jumpTo();
        }
      });
      jumpEl.addEventListener('blur', jumpTo);
    }

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var upload = e.target.closest('.js-as-refund-upload');
        if (upload) {
          e.preventDefault();
          openUploadModal(upload.getAttribute('data-id'));
          return;
        }
        var detail = e.target.closest('.js-as-refund-detail');
        if (detail) {
          e.preventDefault();
          openDetailDrawer(detail.getAttribute('data-id'));
          return;
        }
        var order = e.target.closest('.js-as-order-link');
        if (order) {
          e.preventDefault();
          if (typeof showToast === 'function') {
            showToast('订单详情（演示）：' + (order.getAttribute('data-order') || ''), 'success');
          }
        }
      });
    }

    var detailBody = $('asRefundDetailBody');
    if (detailBody) {
      detailBody.addEventListener('click', function (e) {
        var order = e.target.closest('.js-as-order-link');
        if (order) {
          e.preventDefault();
          if (typeof showToast === 'function') {
            showToast('订单详情（演示）：' + (order.getAttribute('data-order') || ''), 'success');
          }
        }
      });
    }

    function bindClose(id, closer) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('click', function (e) {
        if (e.target === el) closer();
      });
    }

    var uploadClose = $('asRefundUploadClose');
    var uploadCancel = $('asRefundUploadCancel');
    var uploadConfirm = $('asRefundUploadConfirm');
    var detailClose = $('asRefundDetailClose');
    var detailBackdrop = $('asRefundDetailBackdrop');
    if (uploadClose) uploadClose.addEventListener('click', closeUploadModal);
    if (uploadCancel) uploadCancel.addEventListener('click', closeUploadModal);
    if (uploadConfirm) uploadConfirm.addEventListener('click', confirmUpload);
    if (detailClose) detailClose.addEventListener('click', closeDetailDrawer);
    if (detailBackdrop) detailBackdrop.addEventListener('click', closeDetailDrawer);
    bindClose('asRefundUploadModal', closeUploadModal);

    var remarkEl = $('asUploadRemark');
    var countEl = $('asUploadRemarkCount');
    if (remarkEl && countEl) {
      remarkEl.addEventListener('input', function () {
        countEl.textContent = String(remarkEl.value.length);
      });
    }

    var addBtn = $('asUploadProofAdd');
    var inputEl = $('asUploadProofInput');
    var removeBtn = $('asUploadProofRemove');
    if (addBtn && inputEl) {
      addBtn.addEventListener('click', function () {
        inputEl.click();
      });
      inputEl.addEventListener('change', function () {
        var file = inputEl.files && inputEl.files[0];
        if (!file) return;
        var okType =
          file.type === 'image/jpeg' ||
          file.type === 'image/png' ||
          /\.jpe?g$/i.test(file.name) ||
          /\.png$/i.test(file.name);
        if (!okType) {
          if (typeof showToast === 'function') showToast('仅支持 jpg、png 格式', 'error');
          inputEl.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          setProofPreview(String(reader.result || ''));
        };
        reader.readAsDataURL(file);
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        if (inputEl) inputEl.value = '';
        resetProofPreview();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('asRefundUploadModal') && $('asRefundUploadModal').style.display === 'block') {
        closeUploadModal();
      } else if (
        $('asRefundDetailDrawer') &&
        !$('asRefundDetailDrawer').hidden &&
        $('asRefundDetailDrawer').classList.contains('is-open')
      ) {
        closeDetailDrawer();
      }
    });
  }

  function init() {
    bindEvents();
    applyJumpQuery();
    refresh(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
