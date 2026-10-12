/**
 * 营销活动 — 现金红包模版列表
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

  function formHref(id, mode) {
    var q = 'mode=' + encodeURIComponent(mode || 'edit');
    if (id) q += '&id=' + encodeURIComponent(id);
    return wp.page('mdm_marketing_cash_redpack_tpl_form.html') + '?' + q;
  }

  function statusTagClass(status) {
    if (status === 'ACTIVE') return 'mkt-tpl-tag mkt-tpl-tag--success';
    if (status === 'APPROVED') return 'mkt-tpl-tag mkt-tpl-tag--primary';
    if (status === 'PENDING') return 'mkt-tpl-tag mkt-tpl-tag--warning';
    if (status === 'REJECTED') return 'mkt-tpl-tag mkt-tpl-tag--danger';
    return 'mkt-tpl-tag mkt-tpl-tag--info';
  }

  function query() {
    return {
      name: (document.getElementById('qCrTplName') || {}).value || '',
      status: (document.getElementById('qCrTplStatus') || {}).value || '',
      port: (document.getElementById('qCrTplPort') || {}).value || ''
    };
  }

  function rowActions(item) {
    var acts = [];
    if (item.status === 'DRAFT' || item.status === 'APPROVED' || item.status === 'REJECTED' || item.status === 'DISABLED') {
      acts.push({ key: 'edit', label: '编辑' });
    }
    if (item.status === 'PENDING') acts.push({ key: 'cancel', label: '取消审核' });
    if (item.status === 'APPROVED' || item.status === 'DISABLED') acts.push({ key: 'enable', label: '启用' });
    if (item.status === 'ACTIVE') acts.push({ key: 'disable', label: '禁用' });
    acts.push({ key: 'operationLog', label: '操作日志' });
    return acts;
  }

  function renderTable() {
    var tbody = document.getElementById('crTplTableBody');
    if (!tbody) return;
    var all = Store.listRows(query());
    var total = all.length;
    var start = (state.page - 1) * state.pageSize;
    var rows = all.slice(start, start + state.pageSize);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="mkt-tpl-empty">未查询到符合条件的数据</td></tr>';
    } else {
      tbody.innerHTML = rows
        .map(function (item) {
          var ops = rowActions(item)
            .map(function (a) {
              var cls = 'mkt-tpl-link';
              if (a.key === 'disable' || a.key === 'cancel') cls += ' mkt-tpl-link--warn';
              if (a.key === 'enable') cls += ' mkt-tpl-link--ok';
              return (
                '<button type="button" class="' +
                cls +
                '" data-act="' +
                a.key +
                '" data-id="' +
                escapeHtml(item.id) +
                '">' +
                escapeHtml(a.label) +
                '</button>'
              );
            })
            .join('');
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(item.id) +
            '</td>' +
            '<td><button type="button" class="mkt-tpl-name" data-act="view" data-id="' +
            escapeHtml(item.id) +
            '">' +
            escapeHtml(item.name || '未命名草稿') +
            '</button></td>' +
            '<td>' +
            escapeHtml(Store.activityTimeText(item)) +
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
            escapeHtml(Store.toMoney(item.budgetUsed).toFixed(2)) +
            '</td>' +
            '<td>' +
            escapeHtml(item.createdAt || '—') +
            '</td>' +
            '<td style="text-align:center"><span class="' +
            statusTagClass(item.status) +
            '">' +
            escapeHtml(Store.statusLabel(item.status)) +
            '</span></td>' +
            '<td>' +
            escapeHtml(item.status === 'REJECTED' ? item.remark || '—' : '—') +
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

  function handleAct(act, id) {
    if (act === 'edit' || act === 'view') {
      window.location.href = formHref(id, act === 'view' ? 'view' : 'edit');
      return;
    }
    if (act === 'operationLog') {
      openLog(id);
      return;
    }
    if (act === 'cancel') {
      if (!window.confirm('取消审核后现金红包将回到草稿，是否继续？')) return;
      var cancelled = Store.cancelAudit(id);
      if (!cancelled.ok) {
        toast(cancelled.message, 'warning');
        return;
      }
      toast('已取消审核', 'success');
      renderTable();
      return;
    }
    if (act === 'enable') {
      if (!window.confirm('确认启用该现金红包？启用后可被注册有礼及其他模块关联。')) return;
      var enabled = Store.enable(id);
      if (!enabled.ok) {
        toast(enabled.message, 'warning');
        return;
      }
      toast('已启用', 'success');
      renderTable();
      return;
    }
    if (act === 'disable') {
      if (!window.confirm('确认禁用该现金红包？禁用后不可被新的活动或其他模块关联。')) return;
      var disabled = Store.disable(id);
      if (!disabled.ok) {
        toast(disabled.message, 'warning');
        return;
      }
      toast('已禁用', 'success');
      renderTable();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var addBtn = document.getElementById('crTplAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        window.location.href = formHref('', 'add');
      });
    }
    var queryBtn = document.getElementById('crTplFilterQuery');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        state.page = 1;
        renderTable();
      });
    }
    var resetBtn = document.getElementById('crTplFilterReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = document.getElementById('crTplFilterForm');
        if (form) form.reset();
        state.page = 1;
        renderTable();
      });
    }
    var tbody = document.getElementById('crTplTableBody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        handleAct(btn.getAttribute('data-act'), btn.getAttribute('data-id'));
      });
    }
    var mask = document.getElementById('tplLogMask');
    var close = document.getElementById('tplLogClose');
    if (mask) mask.addEventListener('click', closeLog);
    if (close) close.addEventListener('click', closeLog);
    renderTable();
  });
})();
