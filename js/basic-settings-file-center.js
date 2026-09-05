/**
 * 基础设置 · 文件中心
 * Tab：我的文件 / 全部文件 / 下载流水
 */
(function (global) {
  'use strict';

  var STATUS_MAP = {
    ready: { label: '可下载', cls: 'fc-status--ready' },
    pending: { label: '生成中', cls: 'fc-status--pending' },
    expired: { label: '已过期', cls: 'fc-status--expired' },
    failed: { label: '失败', cls: 'fc-status--failed' }
  };

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatDateTime(d) {
    return (
      d.getFullYear() +
      '-' +
      pad2(d.getMonth() + 1) +
      '-' +
      pad2(d.getDate()) +
      ' ' +
      pad2(d.getHours()) +
      ':' +
      pad2(d.getMinutes())
    );
  }

  function addDays(base, days) {
    var d = new Date(base.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function makeTaskNo(seed) {
    var base = 'FT202608163473056472068259';
    var n = String(84 + seed);
    return base + n.slice(-2);
  }

  function buildFileRows(count, mineOnly) {
    var titles = [
      '订单列表导出',
      '订单清分明细导出',
      '门店档案导出',
      '售后单导出',
      '会员列表导出',
      '商品列表导出',
      '结算对账导出',
      '运费模板导出',
      '积分明细导出'
    ];
    var types = [
      'order-list-export',
      'order-clearing-export',
      'store-archive-export',
      'aftersale-export',
      'member-list-export',
      'product-list-export',
      'settle-bill-export',
      'freight-tpl-export',
      'points-detail-export'
    ];
    var statuses = ['ready', 'ready', 'ready', 'pending', 'expired', 'failed'];
    var rows = [];
    var i;
    for (i = 0; i < count; i++) {
      var submit = new Date(2026, 7, 16, 17, 8 - (i % 5), 0);
      var status = statuses[i % statuses.length];
      if (mineOnly && i > 1) status = 'ready';
      var title = titles[i % titles.length];
      rows.push({
        id: 'file-' + (mineOnly ? 'mine-' : 'all-') + i,
        taskNo: makeTaskNo(i),
        title: title,
        type: types[i % types.length],
        status: status,
        fileName: title.replace('导出', '') + '_2026-08-16.xlsx',
        size: (18.2 + (i % 7) * 1.3).toFixed(1) + ' KB',
        initiator: i % 3 === 0 ? '' : i % 3 === 1 ? '吴丹萍' : '系统',
        downloadCount: i === 0 ? 1 : i % 4,
        submitTime: formatDateTime(submit),
        expireTime: formatDateTime(addDays(submit, 7)),
        mine: mineOnly ? true : i % 5 !== 0
      });
    }
    return rows;
  }

  function buildDownloadLogs(count, fileRows) {
    var names = ['吴丹萍', '超级管理员', '张三', '李四', '王五'];
    var ips = ['172.21.2.168', '172.21.2.101', '10.0.0.18', '192.168.1.66'];
    var logs = [];
    var i;
    for (i = 0; i < count; i++) {
      var file = fileRows[i % fileRows.length];
      var issue = new Date(2026, 7, 16, 17, 24 - (i % 10), Math.max(0, 40 - i));
      var isAdmin = i % 4 === 1;
      logs.push({
        id: 'log-' + i,
        taskNo: file.taskNo,
        fileName: file.fileName,
        downloaderId: isAdmin ? '1' : String(32726419418 + (i % 9)),
        downloader: isAdmin ? '超级管理员' : names[i % names.length === 1 ? 0 : i % names.length],
        ip: ips[i % ips.length],
        urlTtl: 300,
        issueTime: formatDateTime(issue)
      });
    }
    return logs;
  }

  var ALL_FILES = buildFileRows(23, false);
  /* 截图「我的文件」：2 条同标题可下载记录 */
  var MY_FILES = [
    {
      id: 'file-mine-0',
      taskNo: 'FT20260816347305647206825984',
      title: '订单列表导出',
      type: 'order-list-export',
      status: 'ready',
      fileName: '订单列表_2026-08-16.xlsx',
      size: '18.2 KB',
      initiator: '',
      downloadCount: 1,
      submitTime: '2026-08-16 17:08',
      expireTime: '2026-08-23 17:08',
      mine: true
    },
    {
      id: 'file-mine-1',
      taskNo: 'FT20260816347305647206825985',
      title: '订单列表导出',
      type: 'order-list-export',
      status: 'ready',
      fileName: '订单列表_2026-08-16.xlsx',
      size: '18.2 KB',
      initiator: '',
      downloadCount: 0,
      submitTime: '2026-08-16 17:08',
      expireTime: '2026-08-23 17:08',
      mine: true
    }
  ];

  var QUEUED_TASKS_KEY = 'lfFileCenterQueuedTasks';
  var UNSEEN_KEY = 'lfFileCenterUnseenCount';

  function readQueuedTasksLocal() {
    try {
      var raw = localStorage.getItem(QUEUED_TASKS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function markFileCenterSeen() {
    try {
      localStorage.setItem(UNSEEN_KEY, '0');
    } catch (e) {
      /* ignore */
    }
    if (global.LfFileCenterNotify && typeof global.LfFileCenterNotify.markSeen === 'function') {
      global.LfFileCenterNotify.markSeen();
    } else {
      try {
        global.dispatchEvent(
          new CustomEvent('lf-file-center-unseen-change', { detail: { count: 0 } })
        );
      } catch (e2) {
        /* ignore */
      }
    }
  }

  function mergeQueuedTasks() {
    var queued = readQueuedTasksLocal();
    if (global.LfFileCenterNotify && typeof global.LfFileCenterNotify.getQueuedTasks === 'function') {
      queued = global.LfFileCenterNotify.getQueuedTasks() || queued;
    }
    if (!queued.length) return;
    var seen = {};
    MY_FILES.forEach(function (r) {
      seen[r.id] = true;
      seen[r.taskNo] = true;
    });
    ALL_FILES.forEach(function (r) {
      seen[r.id] = true;
      seen[r.taskNo] = true;
    });
    queued.forEach(function (task) {
      if (!task || seen[task.id] || seen[task.taskNo]) return;
      var row = {
        id: task.id,
        taskNo: task.taskNo,
        title: task.title,
        type: task.type,
        status: task.status || 'ready',
        fileName: task.fileName,
        size: task.size || '18.2 KB',
        initiator: task.initiator || '',
        downloadCount: task.downloadCount || 0,
        submitTime: task.submitTime,
        expireTime: task.expireTime,
        mine: true
      };
      MY_FILES.unshift(row);
      ALL_FILES.unshift(row);
      seen[row.id] = true;
      seen[row.taskNo] = true;
    });
  }

  mergeQueuedTasks();
  var DOWNLOAD_LOGS = buildDownloadLogs(16, ALL_FILES.concat(MY_FILES));

  var state = {
    tab: 'mine',
    page: 1,
    pageSize: 20,
    filters: {
      taskNo: '',
      type: '',
      status: ''
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function currentSource() {
    if (state.tab === 'mine') return MY_FILES;
    if (state.tab === 'all') return ALL_FILES;
    return DOWNLOAD_LOGS;
  }

  function filteredRows() {
    var list = currentSource().slice();
    var f = state.filters;
    var taskNo = String(f.taskNo || '').trim().toLowerCase();
    var type = String(f.type || '').trim().toLowerCase();
    var status = String(f.status || '').trim();

    return list.filter(function (row) {
      if (taskNo && String(row.taskNo || '').toLowerCase().indexOf(taskNo) < 0) return false;
      if (state.tab !== 'logs') {
        if (type && String(row.type || '').toLowerCase().indexOf(type) < 0) return false;
        if (status && row.status !== status) return false;
      }
      return true;
    });
  }

  function statusBadge(status) {
    var meta = STATUS_MAP[status] || STATUS_MAP.ready;
    return (
      '<span class="fc-status ' +
      meta.cls +
      '">' +
      escapeHtml(meta.label) +
      '</span>'
    );
  }

  function renderFileRow(row) {
    var canDownload = row.status === 'ready';
    return (
      '<tr data-file-id="' +
      escapeHtml(row.id) +
      '">' +
      '<td>' +
      escapeHtml(row.taskNo) +
      '</td>' +
      '<td>' +
      escapeHtml(row.title) +
      '</td>' +
      '<td>' +
      escapeHtml(row.type) +
      '</td>' +
      '<td>' +
      statusBadge(row.status) +
      '</td>' +
      '<td>' +
      escapeHtml(row.fileName) +
      '</td>' +
      '<td>' +
      escapeHtml(row.size) +
      '</td>' +
      '<td>' +
      escapeHtml(row.initiator || '') +
      '</td>' +
      '<td>' +
      escapeHtml(String(row.downloadCount == null ? 0 : row.downloadCount)) +
      '</td>' +
      '<td>' +
      escapeHtml(row.submitTime) +
      '</td>' +
      '<td>' +
      escapeHtml(row.expireTime) +
      '</td>' +
      '<td>' +
      (canDownload
        ? '<button type="button" class="fc-op-link" data-fc-download="' +
          escapeHtml(row.id) +
          '">下载</button>'
        : '<button type="button" class="fc-op-link is-disabled" disabled>下载</button>') +
      '</td>' +
      '</tr>'
    );
  }

  function renderLogRow(row) {
    return (
      '<tr data-log-id="' +
      escapeHtml(row.id) +
      '">' +
      '<td>' +
      escapeHtml(row.taskNo) +
      '</td>' +
      '<td>' +
      escapeHtml(row.fileName) +
      '</td>' +
      '<td>' +
      escapeHtml(row.downloaderId) +
      '</td>' +
      '<td>' +
      escapeHtml(row.downloader) +
      '</td>' +
      '<td>' +
      escapeHtml(row.ip) +
      '</td>' +
      '<td>' +
      escapeHtml(String(row.urlTtl)) +
      '</td>' +
      '<td>' +
      escapeHtml(row.issueTime) +
      '</td>' +
      '</tr>'
    );
  }

  function pageSlice(rows) {
    var start = (state.page - 1) * state.pageSize;
    return rows.slice(start, start + state.pageSize);
  }

  function renderPager(total) {
    var host = $('fcPager');
    if (!host) return;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;

    var pagesHtml = '';
    var i;
    var maxShow = 5;
    var start = Math.max(1, state.page - 2);
    var end = Math.min(totalPages, start + maxShow - 1);
    start = Math.max(1, end - maxShow + 1);
    for (i = start; i <= end; i++) {
      pagesHtml +=
        '<button type="button" class="fc-pager__btn' +
        (i === state.page ? ' is-active' : '') +
        '" data-fc-page="' +
        i +
        '">' +
        i +
        '</button>';
    }

    host.innerHTML =
      '<span class="fc-pager__total">共 ' +
      total +
      ' 条</span>' +
      '<select class="fc-pager__size" id="fcPageSize" aria-label="每页条数">' +
      [10, 20, 50, 100]
        .map(function (n) {
          return (
            '<option value="' +
            n +
            '"' +
            (n === state.pageSize ? ' selected' : '') +
            '>' +
            n +
            '条/页</option>'
          );
        })
        .join('') +
      '</select>' +
      '<div class="fc-pager__nav">' +
      '<button type="button" class="fc-pager__btn" data-fc-page="' +
      Math.max(1, state.page - 1) +
      '"' +
      (state.page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>' +
      pagesHtml +
      '<button type="button" class="fc-pager__btn" data-fc-page="' +
      Math.min(totalPages, state.page + 1) +
      '"' +
      (state.page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>' +
      '</div>' +
      '<div class="fc-pager__goto">前往' +
      '<input class="fc-pager__goto-input" id="fcGotoPage" type="text" value="' +
      state.page +
      '" inputmode="numeric">' +
      '页</div>';
  }

  function renderTable() {
    var tbody = $('fcTableBody');
    var thead = $('fcTableHead');
    if (!tbody || !thead) return;

    if (state.tab === 'logs') {
      thead.innerHTML =
        '<tr>' +
        '<th>任务号</th>' +
        '<th>文件名</th>' +
        '<th>下载人ID</th>' +
        '<th>下载人</th>' +
        '<th>IP</th>' +
        '<th>URL有效期(s)</th>' +
        '<th>签发时间</th>' +
        '</tr>';
    } else {
      thead.innerHTML =
        '<tr>' +
        '<th>任务号</th>' +
        '<th>标题</th>' +
        '<th>类型</th>' +
        '<th>状态</th>' +
        '<th>文件名</th>' +
        '<th>大小</th>' +
        '<th>发起人</th>' +
        '<th>下载次数</th>' +
        '<th>提交时间</th>' +
        '<th>过期时间</th>' +
        '<th>操作</th>' +
        '</tr>';
    }

    var rows = filteredRows();
    var pageRows = pageSlice(rows);
    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="20"><div class="fc-empty">暂无数据</div></td></tr>';
    } else if (state.tab === 'logs') {
      tbody.innerHTML = pageRows.map(renderLogRow).join('');
    } else {
      tbody.innerHTML = pageRows.map(renderFileRow).join('');
    }

    var table = $('fcTable');
    if (table) {
      table.setAttribute('data-lf-row-start', String((state.page - 1) * state.pageSize));
      table.setAttribute('data-lf-row-total', String(rows.length));
      table.classList.remove('lf-row-no-on', 'lf-row-no-native');
      var oldTh = table.querySelector('th.lf-row-no-th');
      if (oldTh) oldTh.remove();
    }
    renderPager(rows.length);
    if (global.LfTableRowNo && typeof global.LfTableRowNo.refresh === 'function') {
      global.LfTableRowNo.refresh();
    } else {
      try {
        global.dispatchEvent(new Event('lf-table-row-no:refresh'));
      } catch (e) {
        /* ignore */
      }
    }
  }

  function syncFilterVisibility() {
    var typeField = $('fcFilterTypeWrap');
    var statusField = $('fcFilterStatusWrap');
    var isLogs = state.tab === 'logs';
    if (typeField) typeField.hidden = isLogs;
    if (statusField) statusField.hidden = isLogs;
  }

  function readFiltersFromDom() {
    state.filters.taskNo = (($('fcTaskNo') || {}).value || '').trim();
    state.filters.type = (($('fcType') || {}).value || '').trim();
    state.filters.status = (($('fcStatus') || {}).value || '').trim();
  }

  function resetFiltersDom() {
    if ($('fcTaskNo')) $('fcTaskNo').value = '';
    if ($('fcType')) $('fcType').value = '';
    if ($('fcStatus')) $('fcStatus').value = '';
    state.filters = { taskNo: '', type: '', status: '' };
  }

  function findFileById(id) {
    var all = MY_FILES.concat(ALL_FILES);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  function bumpDownloadCount(file) {
    if (!file) return;
    file.downloadCount = Number(file.downloadCount || 0) + 1;
    /* 同步同 taskNo 的全部文件副本 */
    ALL_FILES.forEach(function (r) {
      if (r.taskNo === file.taskNo) r.downloadCount = file.downloadCount;
    });
    MY_FILES.forEach(function (r) {
      if (r.taskNo === file.taskNo) r.downloadCount = file.downloadCount;
    });
  }

  function appendDownloadLog(file) {
    if (!file) return;
    var now = new Date();
    DOWNLOAD_LOGS.unshift({
      id: 'log-new-' + Date.now(),
      taskNo: file.taskNo,
      fileName: file.fileName,
      downloaderId: '32726419418',
      downloader: '吴丹萍',
      ip: '172.21.2.168',
      urlTtl: 300,
      issueTime: formatDateTime(now)
    });
  }

  function triggerDemoDownload(file) {
    if (!file) return;
    if (file.status && file.status !== 'ready') {
      if (typeof showToast === 'function') showToast('当前状态不可下载', 'warning');
      return;
    }
    bumpDownloadCount(file);
    appendDownloadLog(file);
    if (typeof showToast === 'function') {
      showToast('开始下载：' + file.fileName, 'success');
    }
    /* 生成演示文本文件供浏览器下载 */
    try {
      var blob = new Blob(
        ['演示导出文件\n任务号：' + file.taskNo + '\n文件名：' + file.fileName + '\n'],
        { type: 'text/plain;charset=utf-8' }
      );
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = String(file.fileName || 'export.txt').replace(/\.xlsx$/i, '.txt');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      /* ignore */
    }
    renderTable();
  }

  function switchTab(tab) {
    state.tab = tab;
    state.page = 1;
    document.querySelectorAll('[data-fc-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-fc-tab') === tab);
    });
    syncFilterVisibility();
    renderTable();
  }

  function bindEvents() {
    document.querySelectorAll('[data-fc-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-fc-tab');
        document.querySelectorAll('[data-fc-tab]').forEach(function (b) {
          var on = b.getAttribute('data-fc-tab') === tab;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        switchTab(tab);
      });
    });

    var queryBtn = $('fcQueryBtn');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        readFiltersFromDom();
        state.page = 1;
        renderTable();
      });
    }

    var resetBtn = $('fcResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetFiltersDom();
        state.page = 1;
        renderTable();
      });
    }

    ['fcTaskNo', 'fcType'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          readFiltersFromDom();
          state.page = 1;
          renderTable();
        }
      });
    });

    var table = $('fcTable');
    if (table) {
      table.addEventListener('click', function (ev) {
        var dl = ev.target.closest('[data-fc-download]');
        if (dl) {
          ev.preventDefault();
          triggerDemoDownload(findFileById(dl.getAttribute('data-fc-download')));
          return;
        }
      });
    }

    var pager = $('fcPager');
    if (pager) {
      pager.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-fc-page]');
        if (!btn || btn.disabled) return;
        var page = parseInt(btn.getAttribute('data-fc-page'), 10);
        if (!page || page === state.page) return;
        state.page = page;
        renderTable();
      });
      pager.addEventListener('change', function (ev) {
        if (ev.target && ev.target.id === 'fcPageSize') {
          state.pageSize = parseInt(ev.target.value, 10) || 20;
          state.page = 1;
          renderTable();
        }
      });
      pager.addEventListener('keydown', function (ev) {
        if (ev.target && ev.target.id === 'fcGotoPage' && ev.key === 'Enter') {
          var page = parseInt(ev.target.value, 10);
          var total = filteredRows().length;
          var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
          if (!page || page < 1 || page > totalPages) {
            if (typeof showToast === 'function') showToast('请输入有效页码', 'warning');
            ev.target.value = String(state.page);
            return;
          }
          state.page = page;
          renderTable();
        }
      });
    }
  }

  function init() {
    markFileCenterSeen();
    mergeQueuedTasks();
    bindEvents();
    syncFilterVisibility();
    renderTable();
  }

  global.BsFileCenter = { init: init, mergeQueuedTasks: mergeQueuedTasks };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
