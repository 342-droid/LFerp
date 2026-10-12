/**
 * 派发红包执行结束后，后台任意页自行弹出结果。
 * 确认发放写入 localStorage，本脚本随 common.js 挂到各后台页，到点弹出，关闭后不再出现。
 */
(function (global) {
  'use strict';

  if (/\/(shop-h5|user-app|store-app)\//i.test(global.location.pathname || '')) return;

  var KEY = 'mdm_cash_redpack_exec_notice_v1';
  var MODULE_PATH = '冷丰营销-营销活动-现金红包-派发红包';
  var timer = 0;
  var root = null;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var notice = JSON.parse(raw);
      if (!notice || typeof notice !== 'object') return null;
      return notice;
    } catch (e) {
      return null;
    }
  }

  function write(notice) {
    try {
      localStorage.setItem(KEY, JSON.stringify(notice));
    } catch (e) {
      /* 隐私模式忽略 */
    }
  }

  function pageHref(file) {
    var wp = global.wmsPath;
    if (wp && typeof wp.page === 'function') return wp.page(file);
    return file;
  }

  function detailHref(batchId) {
    return (
      pageHref('mdm_marketing_cash_redpack.html') +
      '?tab=detail&activityId=' +
      encodeURIComponent(batchId || '')
    );
  }

  function text(value) {
    return String(value == null ? '' : value);
  }

  function ensureDom() {
    if (root) return root;
    var style = document.createElement('style');
    style.textContent = [
      '.cr-exec-notice{position:fixed;inset:0;z-index:3600;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.45);}',
      '.cr-exec-notice.is-open{display:flex;}',
      '.cr-exec-notice__dialog{width:100%;max-width:720px;background:#fff;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.15);display:flex;flex-direction:column;}',
      '.cr-exec-notice__header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 14px;border-bottom:1px solid #f0f0f0;}',
      '.cr-exec-notice__title{margin:0;font-size:20px;font-weight:600;color:#1f1f1f;line-height:1.4;}',
      '.cr-exec-notice__x{width:32px;height:32px;border:0;background:transparent;color:#8c8c8c;font-size:22px;line-height:1;cursor:pointer;}',
      '.cr-exec-notice__x:hover{color:#1f1f1f;}',
      '.cr-exec-notice__body{min-height:168px;padding:36px 48px 28px;color:#262626;font-size:16px;line-height:1.7;}',
      '.cr-exec-notice__row{margin:0 0 14px;}',
      '.cr-exec-notice__file{display:flex;align-items:flex-start;gap:10px;}',
      '.cr-exec-notice__ok{flex:0 0 22px;width:22px;height:22px;margin-top:2px;border-radius:50%;background:#52c41a;color:#fff;display:inline-flex;align-items:center;justify-content:center;}',
      '.cr-exec-notice__ok svg{display:block;}',
      '.cr-exec-notice__result{padding-left:32px;}',
      '.cr-exec-notice__footer{display:flex;justify-content:center;gap:16px;padding:16px 20px 22px;}',
      '.cr-exec-notice__btn{min-width:88px;height:36px;padding:0 18px;border-radius:4px;font-size:14px;cursor:pointer;}',
      '.cr-exec-notice__close{border:1px solid #d9d9d9;background:#fff;color:#262626;}',
      '.cr-exec-notice__close:hover{border-color:#1677ff;color:#1677ff;}',
      '.cr-exec-notice__view{border:0;background:#1677ff;color:#fff;}',
      '.cr-exec-notice__view:hover{background:#4096ff;}'
    ].join('');
    document.head.appendChild(style);

    root = document.createElement('div');
    root.className = 'cr-exec-notice';
    root.setAttribute('role', 'presentation');
    root.innerHTML =
      '<div class="cr-exec-notice__dialog" role="dialog" aria-modal="true" aria-labelledby="crExecNoticeTitle">' +
      '<div class="cr-exec-notice__header">' +
      '<h2 class="cr-exec-notice__title" id="crExecNoticeTitle">派发红包执行结果</h2>' +
      '<button type="button" class="cr-exec-notice__x" data-act="close" aria-label="关闭">&times;</button>' +
      '</div>' +
      '<div class="cr-exec-notice__body">' +
      '<p class="cr-exec-notice__row" data-field="module"></p>' +
      '<p class="cr-exec-notice__row cr-exec-notice__file"><span class="cr-exec-notice__ok" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.2 5.6 9.8 11 4.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span data-field="file"></span></p>' +
      '<p class="cr-exec-notice__row cr-exec-notice__result" data-field="result"></p>' +
      '</div>' +
      '<div class="cr-exec-notice__footer">' +
      '<button type="button" class="cr-exec-notice__btn cr-exec-notice__close" data-act="close">关闭</button>' +
      '<button type="button" class="cr-exec-notice__btn cr-exec-notice__view" data-act="view">查看</button>' +
      '</div>' +
      '</div>';
    root.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
      if (!btn || !root.contains(btn)) return;
      if (btn.getAttribute('data-act') === 'view') viewCurrent();
      else ack();
    });
    document.body.appendChild(root);
    return root;
  }

  function fill(notice) {
    var box = ensureDom();
    var total = Number(notice.total) || 0;
    var success = Number(notice.success) || 0;
    var fail = Number(notice.fail) || 0;
    var moduleEl = box.querySelector('[data-field="module"]');
    var fileEl = box.querySelector('[data-field="file"]');
    var resultEl = box.querySelector('[data-field="result"]');
    if (moduleEl) moduleEl.textContent = '所属模块：' + text(notice.module || MODULE_PATH);
    if (fileEl) fileEl.textContent = '文件名：' + text(notice.fileName || '—');
    if (resultEl) {
      resultEl.textContent =
        '执行结果：导入' + total + '条，成功执行' + success + '条，失败' + fail + '条。';
    }
    box.setAttribute('data-batch-id', text(notice.batchId));
  }

  function show(notice) {
    fill(notice);
    root.classList.add('is-open');
  }

  function hide() {
    if (root) root.classList.remove('is-open');
  }

  function ack() {
    var notice = read();
    if (notice) {
      notice.acked = true;
      write(notice);
    }
    hide();
    disarm();
  }

  function viewCurrent() {
    var notice = read() || {};
    var href = detailHref(notice.batchId || (root && root.getAttribute('data-batch-id')));
    ack();
    global.location.href = href;
  }

  function disarm() {
    if (!timer) return;
    clearInterval(timer);
    timer = 0;
  }

  function arm() {
    if (timer) return;
    timer = setInterval(tick, 300);
  }

  function tick() {
    var notice = read();
    if (!notice || notice.acked) {
      hide();
      disarm();
      return;
    }
    if (Date.now() < (Number(notice.readyAt) || 0)) return;
    show(notice);
    disarm();
  }

  function publish(payload) {
    payload = payload || {};
    var notice = {
      id: text(payload.batchId) || String(Date.now()),
      batchId: text(payload.batchId),
      fileName: text(payload.fileName || '—'),
      total: Number(payload.total) || 0,
      success: Number(payload.success) || 0,
      fail: Number(payload.fail) || 0,
      module: text(payload.module || MODULE_PATH),
      readyAt: Number(payload.readyAt) || Date.now() + 1800,
      acked: false
    };
    write(notice);
    hide();
    disarm();
    arm();
    tick();
  }

  function sync() {
    disarm();
    arm();
    tick();
  }

  global.LfCashRedpackExecNotice = {
    publish: publish,
    sync: sync,
    modulePath: MODULE_PATH
  };

  global.addEventListener('storage', function (e) {
    if (!e || e.key !== KEY) return;
    sync();
  });

  document.addEventListener('keydown', function (e) {
    if (!root || !root.classList.contains('is-open')) return;
    if (e.key === 'Escape') ack();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync);
  } else {
    sync();
  }
})(window);
