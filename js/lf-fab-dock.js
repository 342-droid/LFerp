/**
 * 后台右下角悬浮快捷入口 + 文件中心未读角标
 * 交互对齐 C 端加购：导出任务 +1、角标 pulse、进入文件中心后清零
 */
(function (global) {
  'use strict';

  if (/\/(shop-h5|user-app|store-app)\//i.test(global.location.pathname || '')) return;
  if (/authz-designer\.html$/i.test(global.location.pathname || '')) return;

  var UNSEEN_KEY = 'lfFileCenterUnseenCount';
  var TASKS_KEY = 'lfFileCenterQueuedTasks';
  var MSG_UNSEEN_KEY = 'lfMessageUnseenCount';
  var EVENT_NAME = 'lf-file-center-unseen-change';
  var MAX_TASKS = 50;
  var lastBumpAt = 0;

  function assetHref(p) {
    return global.wmsPath && typeof global.wmsPath.asset === 'function'
      ? global.wmsPath.asset(p)
      : p;
  }

  function pageHref(f) {
    return global.wmsPath && typeof global.wmsPath.page === 'function'
      ? global.wmsPath.page(f)
      : f;
  }

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

  function readUnseen() {
    try {
      var n = parseInt(localStorage.getItem(UNSEEN_KEY) || '0', 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  function writeUnseen(n) {
    try {
      localStorage.setItem(UNSEEN_KEY, String(Math.max(0, n | 0)));
    } catch (e) {
      /* ignore */
    }
  }

  function readMsgUnseen() {
    try {
      var n = parseInt(localStorage.getItem(MSG_UNSEEN_KEY) || '0', 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  function readTasks() {
    try {
      var raw = localStorage.getItem(TASKS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeTasks(list) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify((list || []).slice(0, MAX_TASKS)));
    } catch (e) {
      /* ignore */
    }
  }

  function makeTaskNo() {
    var now = Date.now();
    return 'FT' + String(now) + String(Math.floor(Math.random() * 90) + 10);
  }

  function inferMetaFromTrigger(el) {
    var text = String((el && el.textContent) || '').replace(/\s+/g, '');
    var title = '列表导出';
    var type = 'list-export';
    if (/订单/.test(text) || /order/i.test((el && el.id) || '')) {
      title = '订单列表导出';
      type = 'order-list-export';
    } else if (/售后/.test(text) || /aftersale|asTicket/i.test((el && el.id) || '')) {
      title = '售后单导出';
      type = 'aftersale-export';
    } else if (/会员|标签|分群/.test(document.title || '')) {
      title = '会员列表导出';
      type = 'member-list-export';
    } else if (/导出列表/.test(text)) {
      title = '列表导出';
      type = 'list-export';
    }
    var path = String(global.location.pathname || '');
    if (/mdm_order_retail/i.test(path)) {
      title = '订单列表导出';
      type = 'order-list-export';
    } else if (/aftersale/i.test(path)) {
      title = '售后单导出';
      type = 'aftersale-export';
    }
    return { title: title, type: type };
  }

  function buildTask(meta) {
    var now = new Date();
    var expire = new Date(now.getTime());
    expire.setDate(expire.getDate() + 7);
    var title = (meta && meta.title) || '列表导出';
    var type = (meta && meta.type) || 'list-export';
    var fileName =
      (meta && meta.fileName) ||
      title.replace(/导出$/, '') +
        '_' +
        now.getFullYear() +
        '-' +
        pad2(now.getMonth() + 1) +
        '-' +
        pad2(now.getDate()) +
        '.xlsx';
    return {
      id: 'file-queued-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      taskNo: (meta && meta.taskNo) || makeTaskNo(),
      title: title,
      type: type,
      status: 'ready',
      fileName: fileName,
      size: (meta && meta.size) || '18.2 KB',
      initiator: (meta && meta.initiator) || '',
      downloadCount: 0,
      submitTime: formatDateTime(now),
      expireTime: formatDateTime(expire),
      mine: true,
      queuedAt: now.getTime()
    };
  }

  function dispatchChange(count) {
    try {
      global.dispatchEvent(
        new CustomEvent(EVENT_NAME, { detail: { count: count } })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function getFileFab() {
    return document.getElementById('lfFabFileCenter');
  }

  function getFileBadge() {
    return document.getElementById('lfFabFileBadge');
  }

  function getMsgBadge() {
    return document.getElementById('lfFabMsgBadge');
  }

  function syncBadge(pulse) {
    var badge = getFileBadge();
    if (!badge) return;
    var count = readUnseen();
    if (count > 0) {
      badge.hidden = false;
      badge.textContent = count > 99 ? '99+' : String(count);
    } else {
      badge.hidden = true;
      badge.textContent = '';
    }
    if (pulse && count > 0) {
      badge.classList.remove('is-pulse');
      void badge.offsetWidth;
      badge.classList.add('is-pulse');
    }

    var msgBadge = getMsgBadge();
    if (msgBadge) {
      var msgCount = readMsgUnseen();
      if (msgCount > 0) {
        msgBadge.hidden = false;
        msgBadge.textContent = msgCount > 99 ? '99+' : String(msgCount);
      } else {
        msgBadge.hidden = true;
        msgBadge.textContent = '';
      }
    }
  }

  function flyToFab(fromX, fromY) {
    var fab = getFileFab();
    if (!fab || fromX == null || fromY == null) return;
    var rect = fab.getBoundingClientRect();
    var toX = rect.left + rect.width / 2;
    var toY = rect.top + rect.height / 2;
    var dot = document.createElement('span');
    dot.className = 'lf-fab-fly';
    dot.style.left = fromX + 'px';
    dot.style.top = fromY + 'px';
    document.body.appendChild(dot);
    void dot.offsetWidth;
    dot.style.setProperty('--fly-x', toX - fromX + 'px');
    dot.style.setProperty('--fly-y', toY - fromY + 'px');
    dot.classList.add('is-active');
    setTimeout(function () {
      if (dot.parentNode) dot.parentNode.removeChild(dot);
    }, 600);
  }

  function bump(meta, opts) {
    opts = opts || {};
    var now = Date.now();
    if (!opts.force && now - lastBumpAt < 400) return readUnseen();
    lastBumpAt = now;

    var task = buildTask(meta || {});
    var tasks = readTasks();
    tasks.unshift(task);
    writeTasks(tasks);

    var count = readUnseen() + 1;
    writeUnseen(count);
    dispatchChange(count);
    syncBadge(true);

    if (opts.fromEvent && opts.fromEvent.clientX != null) {
      flyToFab(opts.fromEvent.clientX, opts.fromEvent.clientY);
    } else if (opts.fromEl) {
      var r = opts.fromEl.getBoundingClientRect();
      flyToFab(r.left + r.width / 2, r.top + r.height / 2);
    }

    if (opts.toast !== false && typeof global.showToast === 'function') {
      global.showToast('已提交导出，请到文件中心下载', 'success');
    }
    return count;
  }

  function markSeen() {
    writeUnseen(0);
    dispatchChange(0);
    syncBadge(false);
  }

  function isExportTrigger(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('[data-lf-skip-export-notify]')) return false;
    if (el.closest('.lf-fab-dock')) return false;
    var btn = el.closest('button, a, [role="button"], [data-lf-export]');
    if (!btn) return false;
    if (btn.getAttribute('data-lf-skip-export-notify') != null) return false;
    if (btn.getAttribute('data-lf-export') != null) return btn;
    var id = String(btn.id || '');
    if (/export/i.test(id) && !/export-popover|export-menu/i.test(id)) return btn;
    var text = String(btn.textContent || '').replace(/\s+/g, '');
    if (!text) return false;
    if (text === '导出' || text.indexOf('导出') === 0 || /^导出/.test(text)) return btn;
    if (text === '导出列表' || /导出列表/.test(text)) return btn;
    return false;
  }

  function onDocClick(ev) {
    var btn = isExportTrigger(ev.target);
    if (!btn) return;
    var meta = inferMetaFromTrigger(btn);
    bump(meta, { fromEvent: ev, toast: true });
  }

  function ensureCss() {
    if (document.getElementById('lf-fab-dock-css')) return;
    var link = document.createElement('link');
    link.id = 'lf-fab-dock-css';
    link.rel = 'stylesheet';
    link.href = assetHref('css/lf-fab-dock.css') + '?v=20260816-fab1';
    document.head.appendChild(link);
  }

  function mountDock() {
    if (document.getElementById('lfFabDock')) return;
    ensureCss();

    var dock = document.createElement('div');
    dock.id = 'lfFabDock';
    dock.className = 'lf-fab-dock';
    dock.setAttribute('data-lf-skip-export-notify', '');
    dock.innerHTML =
      '<a class="lf-fab-dock__btn" id="lfFabFileCenter" href="' +
      pageHref('basic_settings_file_center.html') +
      '" title="文件中心" aria-label="文件中心">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/>' +
      '<path d="M14 3v5h5"/>' +
      '<path d="M9 13h6M9 17h6"/>' +
      '</svg>' +
      '<span class="lf-fab-dock__badge" id="lfFabFileBadge" hidden></span>' +
      '</a>' +
      '<button type="button" class="lf-fab-dock__btn" id="lfFabMessage" title="消息通知" aria-label="消息通知">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>' +
      '<path d="M10 20a2 2 0 004 0"/>' +
      '</svg>' +
      '<span class="lf-fab-dock__badge" id="lfFabMsgBadge" hidden></span>' +
      '</button>';

    document.body.appendChild(dock);

    var msgBtn = document.getElementById('lfFabMessage');
    if (msgBtn) {
      msgBtn.addEventListener('click', function () {
        if (typeof global.showToast === 'function') {
          global.showToast(
            readMsgUnseen() > 0 ? '暂无更多消息' : '暂无新消息',
            'info'
          );
        }
      });
    }

    syncBadge(false);
  }

  function isFileCenterPage() {
    return /basic_settings_file_center\.html$/i.test(
      String(global.location.pathname || '')
    );
  }

  function init() {
    mountDock();
    if (isFileCenterPage()) {
      markSeen();
    }
    document.addEventListener('click', onDocClick, true);
    global.addEventListener(EVENT_NAME, function () {
      syncBadge(false);
    });
    global.addEventListener('storage', function (ev) {
      if (!ev) return;
      if (ev.key === UNSEEN_KEY || ev.key === TASKS_KEY || ev.key === MSG_UNSEEN_KEY) {
        syncBadge(false);
      }
    });
  }

  global.LfFileCenterNotify = {
    bump: bump,
    markSeen: markSeen,
    getUnseenCount: readUnseen,
    getQueuedTasks: readTasks,
    syncBadge: syncBadge,
    EVENT: EVENT_NAME,
    KEYS: { unseen: UNSEEN_KEY, tasks: TASKS_KEY, messageUnseen: MSG_UNSEEN_KEY }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
