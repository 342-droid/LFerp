/**
 * 积分操作日志抽屉 — 界面 1:1 对齐营销-优惠券-操作日志
 */
(function (global) {
  'use strict';

  var adapter = null;
  var state = { resourceId: '', page: 1, pageSize: 20 };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
  }

  function formatLogValue(field, value) {
    if (value == null || value === '') return '—';
    var map = adapter && adapter.VALUE_MAP ? adapter.VALUE_MAP[field] : null;
    if (map && map[String(value)] != null) return map[String(value)];
    return String(value);
  }

  function renderLogs() {
    var tbody = document.getElementById('tplLogTableBody');
    if (!tbody || !adapter) return;
    var data = adapter.listLogs(state.resourceId, state.page, state.pageSize);
    if (!data.list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="mkt-tpl-empty">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = data.list
        .map(function (row) {
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(row.timestamp || row.time || '—') +
            '</td>' +
            '<td>' +
            escapeHtml((adapter.ACTION_LABEL && adapter.ACTION_LABEL[row.action]) || row.content || row.action || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(row.operator || '—') +
            '</td>' +
            '<td><span class="mkt-tpl-log-method">' +
            escapeHtml([row.httpMethod, row.requestUri].filter(Boolean).join(' ') || '—') +
            '</span></td>' +
            '<td style="text-align:center"><span class="mkt-tpl-tag ' +
            (row.success ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--warning') +
            '">' +
            (row.success ? '成功' : '失败') +
            '</span></td>' +
            '<td><button type="button" class="mkt-tpl-name" data-act="log-detail" data-id="' +
            escapeHtml(row.id) +
            '">查看详情</button></td></tr>'
          );
        })
        .join('');
    }
    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'tplLogPagination',
        totalItems: data.total,
        currentPage: state.page,
        pageSize: state.pageSize,
        pageSizeOptions: [10, 20, 50],
        onPageChange: function (p) {
          state.page = p;
          renderLogs();
        },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderLogs();
        }
      });
    }
  }

  function openLogDetail(id) {
    var row = adapter && adapter.findLog(id);
    var body = document.getElementById('tplLogDetailBody');
    if (!body || !row) return;
    var changes = row.changes || [];
    var pretty;
    try {
      pretty = JSON.stringify(JSON.parse(row.requestParams), null, 2);
    } catch (e) {
      pretty = String(row.requestParams || '—');
    }
    var fieldLabel = (adapter && adapter.FIELD_LABEL) || {};
    body.innerHTML =
      '<div class="mkt-tpl-log-detail__head">' +
      '<span class="mkt-tpl-tag ' +
      (row.success ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--warning') +
      '">' +
      (row.success ? '成功' : '失败') +
      '</span>' +
      '<span class="mkt-tpl-log-detail__action">' +
      escapeHtml((adapter.ACTION_LABEL && adapter.ACTION_LABEL[row.action]) || row.content || row.action || '—') +
      '</span></div>' +
      '<div class="mkt-tpl-log-detail__meta">' +
      '<div><dt>操作时间</dt><dd>' +
      escapeHtml(row.timestamp || row.time || '—') +
      '</dd></div>' +
      '<div><dt>操作人</dt><dd>' +
      escapeHtml(row.operator || '—') +
      '</dd></div>' +
      '<div><dt>查询对象</dt><dd>' +
      escapeHtml([row.resource, row.resourceId].filter(Boolean).join('-') || '—') +
      '</dd></div>' +
      '<div><dt>客户端IP</dt><dd>' +
      escapeHtml(row.clientIp || '—') +
      '</dd></div>' +
      '<div><dt>来源服务</dt><dd>' +
      escapeHtml(row.service || '—') +
      '</dd></div>' +
      '<div><dt>耗时</dt><dd>' +
      escapeHtml(row.elapsedMs != null ? row.elapsedMs + ' ms' : '—') +
      '</dd></div></div>' +
      '<div class="mkt-tpl-log-detail__section-title">变更明细 <span class="mkt-tpl-log-detail__count">（共 ' +
      changes.length +
      ' 个字段）</span></div>' +
      (changes.length
        ? '<table class="table"><thead><tr><th>字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
          changes
            .map(function (c) {
              return (
                '<tr><td>' +
                escapeHtml(fieldLabel[c.field] || c.field) +
                '</td><td class="mkt-tpl-log-old">' +
                escapeHtml(formatLogValue(c.field, c.oldValue)) +
                '</td><td class="mkt-tpl-log-new">' +
                escapeHtml(formatLogValue(c.field, c.newValue)) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table>'
        : '<div class="mkt-tpl-empty">无字段级变更</div>') +
      '<div class="mkt-tpl-log-detail__section-title">请求参数</div>' +
      '<div class="mkt-tpl-log-uri">' +
      escapeHtml((row.httpMethod || '') + ' ' + (row.requestUri || '')) +
      '</div>' +
      '<pre class="mkt-tpl-log-params">' +
      escapeHtml(pretty) +
      '</pre>';
    setHidden(document.getElementById('tplLogDetailBackdrop'), false);
  }

  function open(storeAdapter, resourceId, titleName) {
    adapter = storeAdapter;
    state.resourceId = resourceId;
    state.page = 1;
    var title = document.getElementById('tplLogTitle');
    var name = titleName;
    if (!name && adapter && typeof adapter.getById === 'function') {
      var item = adapter.getById(resourceId);
      name = item && item.name;
    }
    if (title) title.textContent = '操作日志' + (name ? ' · ' + name : '');
    setHidden(document.getElementById('tplLogDrawer'), false);
    renderLogs();
  }

  function close() {
    setHidden(document.getElementById('tplLogDrawer'), true);
    setHidden(document.getElementById('tplLogDetailBackdrop'), true);
  }

  function bind() {
    var mask = document.getElementById('tplLogMask');
    var closeBtn = document.getElementById('tplLogClose');
    if (mask) mask.onclick = close;
    if (closeBtn) closeBtn.onclick = close;
    var tbody = document.getElementById('tplLogTableBody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act="log-detail"]');
        if (btn) openLogDetail(btn.getAttribute('data-id'));
      });
    }
    var detailClose = document.getElementById('tplLogDetailClose');
    var detailOk = document.getElementById('tplLogDetailOk');
    if (detailClose) {
      detailClose.onclick = function () {
        setHidden(document.getElementById('tplLogDetailBackdrop'), true);
      };
    }
    if (detailOk) {
      detailOk.onclick = function () {
        setHidden(document.getElementById('tplLogDetailBackdrop'), true);
      };
    }
  }

  global.MdmMemberPointsLogUi = {
    bind: bind,
    open: open,
    close: close
  };
})(window);
