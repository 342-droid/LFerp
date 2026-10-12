/**
 * 营销活动 — 手动发放红包列表
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCashRedpackStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

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

  function pageHref(file) {
    return wp.page(file);
  }

  function execResultText(sum) {
    if (sum.status === 'granting' && !sum.execTotal) return '执行中';
    return '导入' + (sum.execTotal || 0) + '条，成功执行' + (sum.execSuccess || 0) + '条，失败' + (sum.execFail || 0) + '条。';
  }

  function execResultHtml(batch, sum) {
    var links = '';
    if (sum.execFail > 0) {
      links +=
        '<button type="button" data-act="download-fail" data-id="' +
        escapeHtml(batch.id) +
        '">下载失败部分</button>';
    }
    if (sum.execTotal > 0) {
      links +=
        '<button type="button" data-act="download-all" data-id="' +
        escapeHtml(batch.id) +
        '">下载全部结果</button>';
    }
    return (
      '<div class="mkt-cr-exec-result"><div>' +
      escapeHtml(execResultText(sum)) +
      '</div>' +
      (links ? '<div class="mkt-cr-exec-result__links">' + links + '</div>' : '') +
      '</div>'
    );
  }

  function isGrantFailed(record) {
    return record && record.status === 'failed';
  }

  function resultSheetRows(batchId, failedOnly) {
    return Store.recordsOfBatch(batchId)
      .filter(function (record) {
        return failedOnly ? isGrantFailed(record) : true;
      })
      .map(function (record) {
        var failed = isGrantFailed(record);
        return [
          record.userId || '',
          record.userPhone || '',
          money(record.amount),
          record.frontRemark || '',
          record.backRemark || '',
          failed ? '失败' : '成功',
          failed ? record.failReason || '发放失败' : ''
        ];
      });
  }

  function downloadResult(batchId, failedOnly) {
    if (!window.XLSX) {
      toast('Excel 组件未加载', 'warning');
      return;
    }
    var batch = Store.getBatches().filter(function (item) {
      return item.id === batchId;
    })[0];
    var rows = resultSheetRows(batchId, failedOnly);
    if (!rows.length) {
      toast(failedOnly ? '没有失败数据' : '没有可下载的结果', 'warning');
      return;
    }
    var headers = ['会员ID', '用户手机号', '奖励金额', '前台备注', '后台备注', '执行结果', '失败原因'];
    var wb = window.XLSX.utils.book_new();
    var ws = window.XLSX.utils.aoa_to_sheet([headers].concat(rows));
    ws['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 24 }];
    window.XLSX.utils.book_append_sheet(wb, ws, failedOnly ? '失败部分' : '全部结果');
    var name = String((batch && batch.name) || '派发红包').replace(/[\\/:*?"<>|]/g, '');
    window.XLSX.writeFile(wb, name + (failedOnly ? '-失败部分.xlsx' : '-全部结果.xlsx'));
  }

  function remarkText(value) {
    var text = String(value || '').trim();
    return text || '—';
  }

  function openRemark(batchId) {
    var batch = Store.getBatches().filter(function (item) {
      return item.id === batchId;
    })[0];
    var backdrop = document.getElementById('crMbRemarkBackdrop');
    var body = document.getElementById('crMbRemarkBody');
    var title = document.getElementById('crMbRemarkTitle');
    if (!batch || !backdrop || !body) return;
    if (title) title.textContent = '备注 · ' + (batch.name || '');
    var records = Store.recordsOfBatch(batchId);
    var perUser = batch.mode === 'batch' || records.some(function (record) {
      return String(record.frontRemark || '').trim() || String(record.backRemark || '').trim();
    });
    var html =
      '<div class="mkt-cr-remark-line"><span>前台备注</span><span>' +
      escapeHtml(remarkText(batch.frontRemark)) +
      '</span></div>' +
      '<div class="mkt-cr-remark-line"><span>后台备注</span><span>' +
      escapeHtml(remarkText(batch.backRemark)) +
      '</span></div>';
    if (perUser && batch.mode === 'batch') {
      var shown = records.slice(0, 20);
      html +=
        '<table class="mkt-cr-remark-table"><thead><tr><th>会员ID</th><th>用户手机号</th><th>前台备注</th><th>后台备注</th></tr></thead><tbody>' +
        shown
          .map(function (record) {
            return (
              '<tr><td>' +
              escapeHtml(record.userId || '—') +
              '</td><td>' +
              escapeHtml(record.userPhone || '—') +
              '</td><td>' +
              escapeHtml(remarkText(record.frontRemark)) +
              '</td><td>' +
              escapeHtml(remarkText(record.backRemark)) +
              '</td></tr>'
            );
          })
          .join('') +
        '</tbody></table>' +
        (records.length > 20 ? '<div class="pts-rule-tip">仅展示前 20 条，完整备注请下载执行结果。</div>' : '');
    }
    body.innerHTML = html;
    backdrop.hidden = false;
  }

  function closeRemark() {
    var backdrop = document.getElementById('crMbRemarkBackdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function statusClass(st) {
    if (st === 'done') return 'mdm-status mdm-status--ok';
    if (st === 'granting' || st === 'partial') return 'mdm-status mdm-status--warn';
    if (st === 'failed') return 'mdm-status mdm-status--danger';
    return 'mdm-status mdm-status--muted';
  }

  function modeLabel(mode) {
    return (Store.MANUAL_MODE_LABEL && Store.MANUAL_MODE_LABEL[mode]) || '—';
  }

  function readFilter() {
    return {
      name: String((document.getElementById('qMbName') || {}).value || '').trim().toLowerCase(),
      mode: (document.getElementById('qMbMode') || {}).value || '',
      port: (document.getElementById('qMbPort') || {}).value || '',
      status: (document.getElementById('qMbStatus') || {}).value || '',
      totalMin: moneyBound('qMbTotalMin'),
      totalMax: moneyBound('qMbTotalMax'),
      timeStart: (document.getElementById('qMbTimeStart') || {}).value || '',
      timeEnd: (document.getElementById('qMbTimeEnd') || {}).value || ''
    };
  }

  function moneyBound(id) {
    var raw = (document.getElementById(id) || {}).value;
    if (raw === '' || raw == null) return null;
    var n = Number(raw);
    return isNaN(n) ? null : n;
  }

  function inTime(createdAt, start, end) {
    var key = String(createdAt || '').replace(' ', 'T').slice(0, 16);
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  }

  function renderTable() {
    var body = document.getElementById('crMbTableBody');
    if (!body) return;
    var q = readFilter();
    var rows = Store.getBatches().filter(function (b) {
      var sum = Store.summarizeBatch(b);
      if (q.name && String(b.name || '').toLowerCase().indexOf(q.name) < 0) return false;
      if (q.mode && b.mode !== q.mode) return false;
      if (q.port && Store.batchPorts(b).indexOf(q.port) < 0) return false;
      if (q.status && sum.status !== q.status) return false;
      if (q.totalMin != null && sum.totalAmount < q.totalMin) return false;
      if (q.totalMax != null && sum.totalAmount > q.totalMax) return false;
      if (!inTime(b.createdAt, q.timeStart, q.timeEnd)) return false;
      b._sum = sum;
      return true;
    });
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="14" style="text-align:center;color:#999;">暂无发放记录</td></tr>';
      return;
    }
    body.innerHTML = rows
      .map(function (b, index) {
        var sum = b._sum;
        var detail =
          pageHref('mdm_marketing_cash_redpack.html') +
          '?tab=detail&activityId=' +
          encodeURIComponent(b.id);
        return (
          '<tr>' +
          '<td>' +
          (index + 1) +
          '</td>' +
          '<td>' +
          escapeHtml(b.name) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.portsLabel(Store.batchPorts(b))) +
          '</td>' +
          '<td>' +
          escapeHtml(modeLabel(b.mode)) +
          '</td>' +
          '<td>' +
          sum.grantCount +
          '</td>' +
          '<td>' +
          money(sum.totalAmount) +
          '</td>' +
          '<td>' +
          sum.claimCount +
          '</td>' +
          '<td>' +
          money(sum.claimAmount) +
          '</td>' +
          '<td><span class="' +
          statusClass(sum.status) +
          '">' +
          escapeHtml(sum.statusLabel) +
          '</span></td>' +
          '<td>' +
          execResultHtml(b, sum) +
          '</td>' +
          '<td>' +
          escapeHtml(b.creator || '演示运营') +
          '</td>' +
          '<td>' +
          escapeHtml(b.createdAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(b.finishedAt || '—') +
          '</td>' +
          '<td class="action-links"><a href="' +
          escapeHtml(detail) +
          '">查看明细</a><button type="button" class="mkt-cr-row-link" data-act="remark" data-id="' +
          escapeHtml(b.id) +
          '">备注</button></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function syncDatetimeClear(wrapId, inputId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-value', !!input.value);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var back = document.getElementById('crManualBack');
    if (back) back.href = pageHref('mdm_marketing_cash_redpack.html');
    var tip = document.getElementById('crManualTip');
    if (tip && !Store.isEnabled()) {
      tip.innerHTML = '<strong>现金红包已关闭。</strong>请先回到现金红包页开启总开关，再手动发放。';
    }
    renderTable();

    [
      ['qMbTimeStartWrap', 'qMbTimeStart'],
      ['qMbTimeEndWrap', 'qMbTimeEnd']
    ].forEach(function (pair) {
      var input = document.getElementById(pair[1]);
      if (!input) return;
      input.addEventListener('input', function () {
        syncDatetimeClear(pair[0], pair[1]);
      });
      input.addEventListener('change', function () {
        syncDatetimeClear(pair[0], pair[1]);
      });
      syncDatetimeClear(pair[0], pair[1]);
    });
    document.querySelectorAll('#crFilterForm .mkt-rg-datetime-clear').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-clear-for');
        var input = id && document.getElementById(id);
        if (!input) return;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    document.querySelectorAll('#crFilterForm .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentNode && btn.parentNode.querySelector('input');
        if (!input) return;
        input.value = '';
        input.focus();
      });
    });

    var queryBtn = document.getElementById('crMbQuery');
    if (queryBtn) queryBtn.addEventListener('click', renderTable);
    var resetBtn = document.getElementById('crMbReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        ['qMbName', 'qMbMode', 'qMbPort', 'qMbStatus', 'qMbTotalMin', 'qMbTotalMax', 'qMbTimeStart', 'qMbTimeEnd'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        syncDatetimeClear('qMbTimeStartWrap', 'qMbTimeStart');
        syncDatetimeClear('qMbTimeEndWrap', 'qMbTimeEnd');
        renderTable();
      });
    }
    var tableBody = document.getElementById('crMbTableBody');
    if (tableBody) {
      tableBody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-act');
        var id = btn.getAttribute('data-id');
        if (act === 'remark') openRemark(id);
        if (act === 'download-fail') downloadResult(id, true);
        if (act === 'download-all') downloadResult(id, false);
      });
    }
    ['crMbRemarkClose', 'crMbRemarkOk'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', closeRemark);
    });
    var addBtn = document.getElementById('crMbAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (!Store.isEnabled()) {
          toast('请先开启现金红包', 'warning');
          return;
        }
        window.location.href = pageHref('mdm_marketing_cash_redpack_manual_form.html');
      });
    }
  });
})();
