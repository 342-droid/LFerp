/**
 * 营销审核详情：审核记录 + 审核意见。
 * 与入驻审核、进件审核一致：驳回原因必填，通过原因选填，最多 100 字。
 */
(function (global) {
  'use strict';

  var styled = false;

  function ensureStyle() {
    if (styled) return;
    styled = true;
    var style = document.createElement('style');
    style.textContent = [
      '.mkt-audit-panel{margin-top:16px;padding:4px 16px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;}',
      '.mkt-audit-panel__title{margin:16px 0 10px;padding-left:10px;border-left:3px solid #1677ff;font-size:14px;font-weight:600;color:#1f1f1f;line-height:1.4;}',
      '.mkt-audit-panel__hint{margin:0 0 8px;font-size:12px;color:#94a3b8;}',
      '.mkt-audit-panel__table{width:100%;border-collapse:collapse;font-size:13px;}',
      '.mkt-audit-panel__table th,.mkt-audit-panel__table td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;vertical-align:top;}',
      '.mkt-audit-panel__table th{background:#f8fafc;color:#64748b;font-weight:600;white-space:nowrap;}',
      '.mkt-audit-panel__empty{padding:24px 0;color:#94a3b8;text-align:center;}',
      '.mkt-audit-panel__opinion{display:block;width:100%;box-sizing:border-box;min-height:72px;padding:8px 10px;border:1px solid #d9d9d9;border-radius:6px;font-size:13px;line-height:1.5;resize:vertical;color:#1f1f1f;}',
      '.mkt-audit-panel__opinion:focus{outline:none;border-color:#1677ff;}'
    ].join('');
    document.head.appendChild(style);
  }

  function text(value) {
    return String(value == null ? '' : value);
  }

  function escapeHtml(str) {
    return text(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function logsOf(audit) {
    var logs = audit && Array.isArray(audit.auditLogs) ? audit.auditLogs : [];
    if (logs.length) return logs;
    if (!audit) return [];
    if (audit.status !== 'APPROVED' && audit.status !== 'REJECTED') return [];
    return [{
      node: '营销审核',
      reviewer: audit.auditedBy || '—',
      time: audit.auditedAt || '—',
      result: audit.status === 'APPROVED' ? '通过' : '驳回',
      reason: audit.reason || ''
    }];
  }

  function mount(host, audit, editable) {
    var api = { read: function () { return ''; } };
    if (!host) return api;
    ensureStyle();
    host.hidden = false;
    var logs = logsOf(audit);
    var rows = logs.length
      ? logs.map(function (log) {
        return (
          '<tr><td>' + escapeHtml(log.node || '营销审核') +
          '</td><td>' + escapeHtml(log.reviewer || '—') +
          '</td><td>' + escapeHtml(log.time || '—') +
          '</td><td>' + escapeHtml(log.result || '—') +
          '</td><td>' + escapeHtml(log.reason || '—') +
          '</td></tr>'
        );
      }).join('')
      : '<tr><td colspan="5" class="mkt-audit-panel__empty">暂无审核记录</td></tr>';
    host.innerHTML =
      '<div class="mkt-audit-panel">' +
      '<div class="mkt-audit-panel__title">审核记录</div>' +
      '<table class="mkt-audit-panel__table"><thead><tr>' +
      '<th>审核环节</th><th>审核人</th><th>审核时间</th><th>审核结果</th><th>原因</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      (editable
        ? '<div class="mkt-audit-panel__title">审核意见</div>' +
          '<p class="mkt-audit-panel__hint">驳回原因必填，通过原因选填，最多100字</p>' +
          '<textarea class="mkt-audit-panel__opinion" data-audit-opinion maxlength="100" rows="3" placeholder="驳回时必填；通过时选填，最多100字"></textarea>'
        : '') +
      '</div>';
    api.read = function () {
      var ta = host.querySelector('[data-audit-opinion]');
      return ta ? text(ta.value).trim().slice(0, 100) : '';
    };
    return api;
  }

  global.MdmMarketingAuditPanel = { mount: mount };
})(window);
