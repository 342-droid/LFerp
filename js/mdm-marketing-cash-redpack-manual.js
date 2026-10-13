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

  var remarkEditing = null;

  function remarkPieces(row) {
    if (row.mode === 'batch') {
      return (row.members || [])
        .map(function (member) {
          var bits = [];
          if (String(member.frontRemark || '').trim()) bits.push('前台' + String(member.frontRemark).trim());
          if (String(member.backRemark || '').trim()) bits.push('后台' + String(member.backRemark).trim());
          if (!bits.length) return '';
          return (member.phone || member.userId || member.id || '') + ' ' + bits.join(' ');
        })
        .filter(Boolean);
    }
    var bits = [];
    if (String(row.frontRemark || '').trim()) bits.push('前台：' + String(row.frontRemark).trim());
    if (String(row.backRemark || '').trim()) bits.push('后台：' + String(row.backRemark).trim());
    return bits;
  }

  function nameHtml(row) {
    var name = row.name || '—';
    var remark = row.mode === 'batch' ? '' : String(row.frontRemark || '').trim();
    if (!remark) return escapeHtml(name);
    return escapeHtml(name) + '<span class="mkt-cr-name-remark">（' + escapeHtml(remark) + '）</span>';
  }

  function remarkCell(row) {
    var pieces = remarkPieces(row);
    if (!pieces.length) return '<span class="mkt-cr-remark-cell is-empty">—</span>';
    var full = pieces.join('；');
    return '<span class="mkt-cr-remark-cell" title="' + escapeHtml(full) + '">' + escapeHtml(full) + '</span>';
  }

  function openRemark(kind, id) {
    var row = findRow(kind, id);
    var backdrop = document.getElementById('crMbRemarkBackdrop');
    var body = document.getElementById('crMbRemarkBody');
    var title = document.getElementById('crMbRemarkTitle');
    if (!row || !backdrop || !body) return;
    remarkEditing = { kind: kind, id: id, mode: row.mode };
    if (title) title.textContent = '编辑后台备注 · ' + (row.name || '');
    if (row.mode === 'batch') {
      body.innerHTML =
        '<table class="mkt-cr-remark-edit-table"><thead><tr><th>会员ID</th><th>用户手机号</th><th>后台备注</th></tr></thead><tbody>' +
        (row.members || [])
          .map(function (member) {
            var mid = member.id || member.userId || '';
            return (
              '<tr><td>' +
              escapeHtml(member.userId || member.id || '—') +
              '</td><td>' +
              escapeHtml(member.phone || member.userPhone || '—') +
              '</td><td><input data-member-id="' +
              escapeHtml(mid) +
              '" value="' +
              escapeHtml(member.backRemark || '') +
              '" maxlength="100" placeholder="请输入后台备注"></td></tr>'
            );
          })
          .join('') +
        '</tbody></table>';
    } else {
      body.innerHTML =
        '<textarea class="mkt-cr-remark-edit" id="crMbBackRemark" maxlength="100" placeholder="请输入后台备注">' +
        escapeHtml(row.backRemark || '') +
        '</textarea>';
    }
    backdrop.hidden = false;
  }

  function saveRemark() {
    if (!remarkEditing) return;
    var payload = { kind: remarkEditing.kind, id: remarkEditing.id };
    if (remarkEditing.mode === 'batch') {
      payload.members = Array.prototype.map.call(document.querySelectorAll('#crMbRemarkBody [data-member-id]'), function (input) {
        return { id: input.getAttribute('data-member-id'), backRemark: input.value };
      });
    } else {
      payload.backRemark = (document.getElementById('crMbBackRemark') || {}).value || '';
    }
    var result = Store.saveManualBackRemark(payload);
    if (!result || !result.ok) {
      toast((result && result.message) || '保存失败', 'warning');
      return;
    }
    closeRemark();
    toast('已保存后台备注', 'success');
    renderTable();
  }

  function closeRemark() {
    var backdrop = document.getElementById('crMbRemarkBackdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function statusClass(st) {
    if (st === 'done') return 'mdm-status mdm-status--ok';
    if (st === 'granting' || st === 'partial' || st === 'pending' || st === 'scheduled') return 'mdm-status mdm-status--warn';
    if (st === 'draft') return 'mdm-status mdm-status--muted';
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

  function auditListRow(audit) {
    var snap = audit.snapshot || {};
    var users = Array.isArray(snap.users) ? snap.users : [];
    var total = 0;
    users.forEach(function (user) {
      total += Number(user.amount) || 0;
    });
    if (!total) total = (Number(snap.reward) || 0) * users.length;
    return {
      kind: 'audit',
      id: audit.id,
      name: snap.name || '—',
      ports: Store.batchPorts(snap),
      mode: snap.mode,
      creator: snap.creator || audit.submittedBy || '演示运营',
      createdAt: audit.submittedAt || '',
      finishedAt: '',
      triggerMode: snap.triggerMode,
      triggerAt: snap.triggerAt,
      frontRemark: snap.frontRemark || '',
      backRemark: snap.backRemark || '',
      members: users.map(function (user) {
        return {
          id: user.id,
          userId: user.id,
          phone: user.phone,
          frontRemark: user.frontRemark || '',
          backRemark: user.backRemark || ''
        };
      }),
      sum: {
        grantCount: users.length,
        totalAmount: total,
        claimCount: 0,
        claimAmount: 0,
        status: audit.status === 'DRAFT' ? 'draft' : 'pending',
        statusLabel: audit.status === 'DRAFT' ? '草稿' : '待审核',
        execTotal: 0,
        execSuccess: 0,
        execFail: 0
      }
    };
  }

  function batchListRow(batch) {
    var records = Store.recordsOfBatch(batch.id);
    return {
      kind: 'batch',
      id: batch.id,
      name: batch.name || '—',
      ports: Store.batchPorts(batch),
      mode: batch.mode,
      creator: batch.creator || '演示运营',
      createdAt: batch.createdAt || '',
      finishedAt: batch.finishedAt || '',
      triggerMode: batch.triggerMode,
      triggerAt: batch.triggerAt,
      frontRemark: batch.frontRemark || '',
      backRemark: batch.backRemark || '',
      members: records.map(function (record) {
        return {
          id: record.id,
          userId: record.userId,
          phone: record.userPhone,
          frontRemark: record.frontRemark || '',
          backRemark: record.backRemark || ''
        };
      }),
      sum: Store.summarizeBatch(batch)
    };
  }

  function listRows() {
    var q = readFilter();
    var rows = [];
    var auditStatuses = [];
    if (!q.status) auditStatuses = ['PENDING', 'DRAFT'];
    else if (q.status === 'pending') auditStatuses = ['PENDING'];
    else if (q.status === 'draft') auditStatuses = ['DRAFT'];
    auditStatuses.forEach(function (status) {
      Store.listManualAudits({ status: status }).forEach(function (audit) {
        rows.push(auditListRow(audit));
      });
    });
    if (q.status !== 'pending' && q.status !== 'draft') {
      Store.getBatches().forEach(function (batch) {
        rows.push(batchListRow(batch));
      });
    }
    return rows.filter(function (row) {
      var sum = row.sum;
      if (q.name && String(row.name || '').toLowerCase().indexOf(q.name) < 0) return false;
      if (q.mode && row.mode !== q.mode) return false;
      if (q.port && (row.ports || []).indexOf(q.port) < 0) return false;
      if (q.status && sum.status !== q.status) return false;
      if (q.totalMin != null && sum.totalAmount < q.totalMin) return false;
      if (q.totalMax != null && sum.totalAmount > q.totalMax) return false;
      if (!inTime(row.createdAt, q.timeStart, q.timeEnd)) return false;
      return true;
    }).sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }

  function findRow(kind, id) {
    var found = null;
    listRows().forEach(function (row) {
      if (row.kind === kind && String(row.id) === String(id)) found = row;
    });
    return found;
  }

  function renderTable() {
    var body = document.getElementById('crMbTableBody');
    if (!body) return;
    var rows = listRows();
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="16" style="text-align:center;color:#999;">暂无发放记录</td></tr>';
      return;
    }
    body.innerHTML = rows
      .map(function (row, index) {
        var sum = row.sum;
        var ops = '';
        if (sum.status === 'draft') {
          ops +=
            '<a href="' +
            escapeHtml(pageHref('mdm_marketing_cash_redpack_manual_form.html') + '?mode=edit&auditId=' + encodeURIComponent(row.id)) +
            '">编辑</a>';
        } else if (row.kind === 'audit') {
          ops +=
            '<button type="button" class="mkt-cr-row-link" data-act="cancel-audit" data-id="' +
            escapeHtml(row.id) +
            '">取消审核</button>';
        } else {
          ops +=
            '<a href="' +
            escapeHtml(pageHref('mdm_marketing_cash_redpack.html') + '?tab=detail&activityId=' + encodeURIComponent(row.id)) +
            '">查看明细</a>';
        }
        ops +=
          '<button type="button" class="mkt-cr-row-link" data-act="remark" data-kind="' +
          escapeHtml(row.kind) +
          '" data-id="' +
          escapeHtml(row.id) +
          '">备注</button>';
        return (
          '<tr>' +
          '<td>' + (rows.length - index) + '</td>' +
          '<td>' + nameHtml(row) + '</td>' +
          '<td>' + escapeHtml(Store.portsLabel(row.ports)) + '</td>' +
          '<td>' + escapeHtml(modeLabel(row.mode)) + '</td>' +
          '<td>' + sum.grantCount + '</td>' +
          '<td>' + money(sum.totalAmount) + '</td>' +
          '<td>' + sum.claimCount + '</td>' +
          '<td>' + money(sum.claimAmount) + '</td>' +
          '<td><span class="' + statusClass(sum.status) + '">' + escapeHtml(sum.statusLabel) + '</span></td>' +
          '<td>' + (sum.status === 'pending' || sum.status === 'draft' || sum.status === 'scheduled' ? '—' : execResultHtml(row, sum)) + '</td>' +
          '<td>' + escapeHtml(row.creator || '演示运营') + '</td>' +
          '<td>' + escapeHtml(row.createdAt || '—') + '</td>' +
          '<td>' + escapeHtml(row.triggerMode === 'schedule' && row.triggerAt ? String(row.triggerAt).slice(0, 16) : '即时') + '</td>' +
          '<td>' + escapeHtml(row.finishedAt || '—') + '</td>' +
          '<td>' + remarkCell(row) + '</td>' +
          '<td class="action-links">' + ops + '</td>' +
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
    try {
      var flash = sessionStorage.getItem('crManualAuditFlash');
      if (flash) {
        sessionStorage.removeItem('crManualAuditFlash');
        toast(flash, 'success');
      }
    } catch (e) {}
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
        if (act === 'remark') openRemark(btn.getAttribute('data-kind') || 'batch', id);
        if (act === 'cancel-audit') {
          if (!window.confirm('取消审核后派发红包将回到草稿，是否继续？')) return;
          var cancelled = Store.cancelManualAudit(id);
          if (!cancelled || !cancelled.ok) {
            toast((cancelled && cancelled.message) || '仅待审核可取消', 'warning');
            return;
          }
          toast('已取消审核', 'success');
          renderTable();
        }
        if (act === 'download-fail') downloadResult(id, true);
        if (act === 'download-all') downloadResult(id, false);
      });
    }
    ['crMbRemarkClose', 'crMbRemarkCancel'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', closeRemark);
    });
    var saveRemarkBtn = document.getElementById('crMbRemarkSave');
    if (saveRemarkBtn) saveRemarkBtn.addEventListener('click', saveRemark);
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
