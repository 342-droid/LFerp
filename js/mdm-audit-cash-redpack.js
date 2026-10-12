/**
 * 审核中心 — 营销审核 — 现金红包
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCashRedpackTplStore;
  if (!Store) return;
  var wp = window.wmsPath || { page: function (f) { return f; } };

  var state = { page: 1, pageSize: 10 };
  var logId = '';

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
    return wp.page('mdm_marketing_cash_redpack_tpl_form.html') + '?' + q;
  }

  function statusTagClass(status) {
    if (status === 'APPROVED') return 'mkt-tpl-tag mkt-tpl-tag--success';
    if (status === 'PENDING') return 'mkt-tpl-tag mkt-tpl-tag--warning';
    if (status === 'REJECTED') return 'mkt-tpl-tag mkt-tpl-tag--danger';
    if (status === 'CANCELLED') return 'mkt-tpl-tag mkt-tpl-tag--info';
    return 'mkt-tpl-tag mkt-tpl-tag--info';
  }

  function query() {
    return {
      templateId: (document.getElementById('qAudId') || {}).value || '',
      name: (document.getElementById('qAudName') || {}).value || '',
      rewardType: (document.getElementById('qAudReward') || {}).value || '',
      port: (document.getElementById('qAudPort') || {}).value || '',
      status: (document.getElementById('qAudStatus') || {}).value || '',
      auditor: (document.getElementById('qAudAuditor') || {}).value || ''
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
      tbody.innerHTML = '<tr><td colspan="12" class="mkt-tpl-empty">未查询到符合条件的数据</td></tr>';
    } else {
      tbody.innerHTML = rows
        .map(function (audit) {
          var item = audit.snapshot || Store.getById(audit.templateId) || {};
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
            '<button type="button" class="mkt-tpl-link" data-act="operationLog" data-tpl="' +
            escapeHtml(audit.templateId) +
            '">操作日志</button>';
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(item.id || audit.templateId) +
            '</td>' +
            '<td>' +
            escapeHtml(item.name || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(Store.rewardTypeText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.rewardContentText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.portsText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.claimText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.memberLevelText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(audit.submittedAt || '—') +
            '</td>' +
            '<td style="text-align:center"><span class="' +
            statusTagClass(audit.status) +
            '">' +
            escapeHtml(Store.auditStatusLabel(audit.status)) +
            '</span></td>' +
            '<td>' +
            escapeHtml(audit.auditedBy || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(audit.auditedAt || '—') +
            '</td>' +
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

  function closeLog() {
    var drawer = document.getElementById('tplLogDrawer');
    if (drawer) drawer.hidden = true;
    logId = '';
  }

  function openLog(id) {
    logId = id;
    var drawer = document.getElementById('tplLogDrawer');
    var title = document.getElementById('tplLogTitle');
    var body = document.getElementById('tplLogTableBody');
    var item = Store.getById(id);
    if (title) title.textContent = '操作日志' + (item ? ' · ' + (item.name || item.id) : '');
    var rows = Store.getLogs(id);
    if (body) {
      body.innerHTML = rows.length
        ? rows
            .map(function (row) {
              return (
                '<tr><td>' +
                escapeHtml(row.at) +
                '</td><td>' +
                escapeHtml(row.action) +
                '</td><td>' +
                escapeHtml(row.operator) +
                '</td><td>' +
                escapeHtml(row.detail || '—') +
                '</td><td style="text-align:center">' +
                escapeHtml(row.result || '成功') +
                '</td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="5" class="mkt-tpl-empty">暂无操作日志</td></tr>';
    }
    if (drawer) drawer.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
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
      if (act === 'operationLog') {
        openLog(btn.getAttribute('data-tpl'));
        return;
      }
      var audit = Store.findAudit(btn.getAttribute('data-id'));
      if (!audit) return toast('未找到审核记录', 'warning');
      var item = audit.snapshot || Store.getById(audit.templateId);
      window.location.href = formHref(item, act === 'audit' ? 'audit' : 'view', audit);
    });
    var mask = document.getElementById('tplLogMask');
    var close = document.getElementById('tplLogClose');
    if (mask) mask.addEventListener('click', closeLog);
    if (close) close.addEventListener('click', closeLog);
    renderTable();
  });
})();
