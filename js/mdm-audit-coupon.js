/**
 * 审核中心 — 营销审核 — 优惠券
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCouponStore;
  var GoodsDialog = window.MdmMarketingCouponGoodsDialog;
  var LogUi = window.MdmMarketingCouponLogUi;
  if (!Store) return;
  var wp = window.wmsPath || { page: function (f) { return f; } };

  var state = { page: 1, pageSize: 10 };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formHref(item, mode, audit) {
    var q = 'mode=' + encodeURIComponent(mode) + '&from=audit';
    if (item && item.id) q += '&id=' + encodeURIComponent(item.id);
    if (audit && audit.id) q += '&auditId=' + encodeURIComponent(audit.id);
    return wp.page('mdm_marketing_coupon_form.html') + '?' + q;
  }

  function statusTagClass(status) {
    if (status === 'APPROVED') return 'mkt-tpl-tag mkt-tpl-tag--success';
    if (status === 'PENDING') return 'mkt-tpl-tag mkt-tpl-tag--warning';
    if (status === 'REJECTED') return 'mkt-tpl-tag mkt-tpl-tag--danger';
    return 'mkt-tpl-tag mkt-tpl-tag--info';
  }

  function query() {
    return {
      couponId: (document.getElementById('qAudId') || {}).value || '',
      name: (document.getElementById('qAudName') || {}).value || '',
      faceValue: (document.getElementById('qAudFace') || {}).value || '',
      channel: (document.getElementById('qAudChannel') || {}).value || '',
      status: (document.getElementById('qAudStatus') || {}).value || ''
    };
  }

  function renderTable() {
    var tbody = document.getElementById('audTableBody');
    if (!tbody) return;
    var all = Store.listAuditRows(query());
    var total = all.length;
    var start = (state.page - 1) * state.pageSize;
    var rows = all.slice(start, start + state.pageSize);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="mkt-tpl-empty">未查询到符合条件的数据</td></tr>';
    } else {
      tbody.innerHTML = rows
        .map(function (audit) {
          var item = audit.snapshot || Store.findById(audit.couponId) || {};
          var ops =
            '<button type="button" class="mkt-tpl-link" data-act="view" data-id="' +
            escapeHtml(audit.id) +
            '">查看</button>';
          if (audit.status === 'PENDING') {
            ops +=
              '<button type="button" class="mkt-tpl-link" data-act="audit" data-id="' +
              escapeHtml(audit.id) +
              '">审核</button>';
          }
          ops +=
            '<button type="button" class="mkt-tpl-link" data-act="operationLog" data-coupon="' +
            escapeHtml(audit.couponId) +
            '">操作日志</button>';
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(item.id || audit.couponId) +
            '</td>' +
            '<td>' +
            escapeHtml(item.name || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(Store.faceValueText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.thresholdText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.channelLabel(item.applicableChannel)) +
            '</td>' +
            '<td>' +
            (GoodsDialog
              ? GoodsDialog.cellHtml(item, 'data-audit="' + escapeHtml(audit.id) + '"')
              : escapeHtml(Store.scopeText(item))) +
            '</td>' +
            '<td>' +
            escapeHtml(audit.submittedAt || '—') +
            '</td>' +
            '<td style="text-align:center"><span class="' +
            statusTagClass(audit.status) +
            '">' +
            escapeHtml(Store.auditStatusLabel(audit.status)) +
            '</span></td>' +
            '<td class="mkt-tpl-ops action-links">' +
            ops +
            '</td></tr>'
          );
        })
        .join('');
    }
    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'pagination-container',
        totalItems: total,
        currentPage: state.page,
        pageSize: state.pageSize,
        pageSizeOptions: [10, 20, 50, 100],
        onPageChange: function (p) {
          state.page = p;
          renderTable();
        },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('audFilterQuery').addEventListener('click', function () {
      state.page = 1;
      renderTable();
    });
    document.getElementById('audFilterReset').addEventListener('click', function () {
      ['qAudId', 'qAudName', 'qAudFace', 'qAudChannel', 'qAudStatus'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
      state.page = 1;
      renderTable();
    });
    document.getElementById('audTableBody').addEventListener('click', function (e) {
      var goodsBtn = e.target.closest('[data-act="view-scope"], [data-act="view-goods"]');
      if (goodsBtn) {
        e.preventDefault();
        var rec = Store.findAudit(goodsBtn.getAttribute('data-audit'));
        var coupon = rec ? rec.snapshot || Store.findById(rec.couponId) : null;
        if (coupon && GoodsDialog) GoodsDialog.openFromCoupon(coupon);
        return;
      }
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'operationLog') {
        if (LogUi) LogUi.open(btn.getAttribute('data-coupon'));
        return;
      }
      var audit = Store.findAudit(btn.getAttribute('data-id'));
      if (!audit) return toast('未找到审核记录', 'warning');
      var item = Store.findById(audit.couponId) || audit.snapshot;
      window.location.href = formHref(item, act === 'audit' ? 'audit' : 'view', audit);
    });
    if (LogUi) LogUi.bind();
    renderTable();
  });
})();
