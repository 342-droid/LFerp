/**
 * 审核中心 — 营销审核 — 派发红包
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCashRedpackStore;
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

  function money(n) {
    return (Number(n) || 0).toFixed(2);
  }

  function formHref(audit, mode) {
    return (
      wp.page('mdm_marketing_cash_redpack_manual_form.html') +
      '?mode=' +
      encodeURIComponent(mode) +
      '&from=audit&auditId=' +
      encodeURIComponent(audit.id)
    );
  }

  function statusTagClass(status) {
    if (status === 'APPROVED') return 'mkt-tpl-tag mkt-tpl-tag--success';
    if (status === 'PENDING') return 'mkt-tpl-tag mkt-tpl-tag--warning';
    if (status === 'REJECTED') return 'mkt-tpl-tag mkt-tpl-tag--danger';
    return 'mkt-tpl-tag mkt-tpl-tag--info';
  }

  function summary(audit) {
    var users = (audit.snapshot && audit.snapshot.users) || [];
    var total = 0;
    users.forEach(function (u) {
      total += Number(u.amount) || 0;
    });
    return { count: users.length, amount: total };
  }

  function query() {
    return {
      name: (document.getElementById('qAudName') || {}).value || '',
      mode: (document.getElementById('qAudMode') || {}).value || '',
      port: (document.getElementById('qAudPort') || {}).value || '',
      status: (document.getElementById('qAudStatus') || {}).value || '',
      auditor: (document.getElementById('qAudAuditor') || {}).value || ''
    };
  }

  function renderTable() {
    var tbody = document.getElementById('audTableBody');
    if (!tbody) return;
    var all = Store.listManualAudits(query());
    var total = all.length;
    var start = (state.page - 1) * state.pageSize;
    var rows = all.slice(start, start + state.pageSize);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11" class="mkt-tpl-empty">未查询到符合条件的数据</td></tr>';
    } else {
      tbody.innerHTML = rows
        .map(function (audit) {
          var snap = audit.snapshot || {};
          var sum = summary(audit);
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
            '<button type="button" class="mkt-tpl-link" data-act="operationLog" data-id="' +
            escapeHtml(audit.id) +
            '">操作日志</button>';
          return (
            '<tr>' +
            '<td>' + escapeHtml(snap.name || '—') + '</td>' +
            '<td>' + escapeHtml(Store.MANUAL_MODE_LABEL[snap.mode] || snap.mode || '—') + '</td>' +
            '<td>' + escapeHtml(Store.portsLabel(snap.ports)) + '</td>' +
            '<td>' + sum.count + '</td>' +
            '<td>' + money(sum.amount) + '</td>' +
            '<td>' + escapeHtml(snap.creator || audit.submittedBy || '—') + '</td>' +
            '<td>' + escapeHtml(audit.submittedAt || '—') + '</td>' +
            '<td style="text-align:center"><span class="' + statusTagClass(audit.status) + '">' +
            escapeHtml(Store.manualAuditStatusLabel(audit.status)) +
            '</span></td>' +
            '<td>' + escapeHtml(audit.auditedBy || '—') + '</td>' +
            '<td>' + escapeHtml(audit.auditedAt || '—') + '</td>' +
            '<td class="mkt-tpl-ops action-links">' + ops + '</td></tr>'
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

  function closeLog() {
    var drawer = document.getElementById('tplLogDrawer');
    if (drawer) drawer.hidden = true;
  }

  function openLog(id) {
    var audit = Store.findManualAudit(id);
    var drawer = document.getElementById('tplLogDrawer');
    var title = document.getElementById('tplLogTitle');
    var body = document.getElementById('tplLogTableBody');
    var snap = (audit && audit.snapshot) || {};
    if (title) title.textContent = '操作日志' + (snap.name ? ' · ' + snap.name : '');
    var rows = (audit && audit.logs) || [];
    if (body) {
      body.innerHTML = rows.length
        ? rows
            .map(function (row) {
              return (
                '<tr><td>' + escapeHtml(row.at) +
                '</td><td>' + escapeHtml(row.action) +
                '</td><td>' + escapeHtml(row.operator) +
                '</td><td>' + escapeHtml(row.detail || '—') +
                '</td><td style="text-align:center">' + escapeHtml(row.result || '成功') +
                '</td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="5" class="mkt-tpl-empty">暂无操作日志</td></tr>';
    }
    if (drawer) drawer.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();
    document.getElementById('audFilterQuery').addEventListener('click', function () {
      state.page = 1;
      renderTable();
    });
    document.getElementById('audFilterReset').addEventListener('click', function () {
      var form = document.getElementById('audFilterForm');
      if (form) form.reset();
      state.page = 1;
      renderTable();
    });
    document.getElementById('audTableBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      var id = btn.getAttribute('data-id');
      if (act === 'operationLog') {
        openLog(id);
        return;
      }
      var audit = Store.findManualAudit(id);
      if (!audit) return toast('未找到审核记录', 'warning');
      window.location.href = formHref(audit, act === 'audit' ? 'audit' : 'view');
    });
    var mask = document.getElementById('tplLogMask');
    var close = document.getElementById('tplLogClose');
    if (mask) mask.addEventListener('click', closeLog);
    if (close) close.addEventListener('click', closeLog);
  });
})();
