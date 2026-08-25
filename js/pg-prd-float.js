/**
 * 可入库 PRD 悬浮入口：B 端贴在页面右侧，C 端挂在手机框外；可拖动；点击标题弹窗查看。
 * 数据来自 prototype-prd/（随分支推送），不依赖本机 .local 版本清单。
 */
(function () {
  if (window.__pgPrdFloatLoaded) return;
  window.__pgPrdFloatLoaded = true;
  if (/\/prototype-prd\/view\.html$/i.test(location.pathname || '')) return;

  var POS_KEY_B = 'pg_prd_float_pos_b';
  var POS_KEY_C = 'pg_prd_float_pos_c';

  function siteRoot() {
    var path = (location.pathname || '/').replace(/\\/g, '/');
    var markers = ['/MDM/', '/SCM/', '/CRM/', '/user-app/', '/shop-h5/', '/store-app/', '/prototype-prd/', '/.local/'];
    var lower = path.toLowerCase();
    for (var i = 0; i < markers.length; i++) {
      var idx = lower.indexOf(markers[i].toLowerCase());
      if (idx >= 0) return path.slice(0, idx) + '/';
    }
    if (/\/index\.html$/i.test(path)) return path.replace(/index\.html$/i, '');
    if (path.charAt(path.length - 1) === '/') return path;
    var last = path.lastIndexOf('/');
    return last >= 0 ? path.slice(0, last + 1) : '/';
  }

  function isCEnd() {
    return /\/user-app\//i.test(location.pathname || '');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function prdTitle(item) {
    if (!item) return '';
    if (typeof item === 'string') return item.replace(/\.md$/i, '');
    return item.title || item.id || item.file || '';
  }

  function prdFile(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.file || '';
  }

  function pageMatches(pages) {
    if (!pages || !pages.length) return !isCEnd();
    var path = (location.pathname || '').replace(/\\/g, '/').toLowerCase();
    var file = (path.split('/').pop() || '').replace(/\.html$/i, '');
    return pages.some(function (p) {
      var n = String(p || '').replace(/\\/g, '/').toLowerCase().replace(/\.html$/i, '');
      var base = n.split('/').pop();
      return path.indexOf(n) >= 0 || file === base;
    });
  }

  function injectStyle() {
    if (document.getElementById('pg-prd-float-style')) return;
    var css =
      '.pg-prd-float{position:fixed;z-index:10050;font-family:"PingFang SC","Microsoft YaHei",sans-serif;touch-action:none;}' +
      '.pg-prd-float__btn{width:52px;height:52px;border-radius:50%;border:0;background:#ff7019;color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px;cursor:grab;box-shadow:0 6px 18px rgba(255,112,25,.35);}' +
      '.pg-prd-float__btn:active{cursor:grabbing;}' +
      '.pg-prd-float__btn:hover{background:#f0630c;}' +
      '.pg-prd-float__panel{display:none;position:absolute;width:260px;max-height:70vh;background:#fff;border:1px solid #e8e8e8;border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.12);overflow:hidden;}' +
      '.pg-prd-float.is-open .pg-prd-float__panel{display:block;}' +
      '.pg-prd-float:not(.pg-prd-float--c) .pg-prd-float__panel{right:64px;top:50%;transform:translateY(-50%);}' +
      '.pg-prd-float--c .pg-prd-float__panel{top:60px;right:0;left:auto;}' +
      '.pg-prd-float__head{padding:12px 14px;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f0;color:#222;}' +
      '.pg-prd-float__list{max-height:calc(70vh - 44px);overflow:auto;padding:6px 0;}' +
      '.pg-prd-float__item{display:block;width:100%;text-align:left;border:0;background:transparent;padding:10px 14px;font-size:13px;line-height:1.45;color:#222;cursor:pointer;}' +
      '.pg-prd-float__item:hover{background:#fff7f0;color:#ff7019;}' +
      '.pg-prd-modal{position:fixed;inset:0;z-index:10100;}' +
      '.pg-prd-modal__mask{position:absolute;inset:0;background:rgba(0,0,0,.45);}' +
      '.pg-prd-modal__box{position:absolute;top:3vh;left:50%;transform:translateX(-50%);width:min(1180px,96vw);height:94vh;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.24);display:flex;flex-direction:column;}' +
      '.pg-prd-modal__bar{flex:none;display:flex;align-items:center;height:44px;padding:0 12px 0 16px;border-bottom:1px solid #eee;font-size:14px;font-weight:600;}' +
      '.pg-prd-modal__bar span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      '.pg-prd-modal__open{flex:none;height:28px;margin-right:8px;padding:0 10px;border:1px solid #ff7019;border-radius:6px;background:#fff;color:#ff7019;font-size:12px;text-decoration:none;display:inline-flex;align-items:center;}' +
      '.pg-prd-modal__open:hover{background:#fff7f0;}' +
      '.pg-prd-modal__close{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#666;padding:4px 8px;}' +
      '.pg-prd-modal__frame{flex:1;width:100%;border:0;background:#fff;}';
    var el = document.createElement('style');
    el.id = 'pg-prd-float-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function readPos(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var pos = JSON.parse(raw);
      if (pos && typeof pos.left === 'number' && typeof pos.top === 'number') return pos;
    } catch (e) { /* ignore */ }
    return null;
  }

  function writePos(key, left, top) {
    try {
      localStorage.setItem(key, JSON.stringify({ left: left, top: top }));
    } catch (e) { /* ignore */ }
  }

  function clamp(left, top, size) {
    var maxL = Math.max(8, window.innerWidth - size - 8);
    var maxT = Math.max(8, window.innerHeight - size - 8);
    return {
      left: Math.min(maxL, Math.max(8, left)),
      top: Math.min(maxT, Math.max(8, top))
    };
  }

  function defaultPos(cend) {
    if (cend) {
      var shell = document.querySelector('.ua-mobile-shell');
      if (shell) {
        var r = shell.getBoundingClientRect();
        var left = r.right + 12;
        if (left + 52 > window.innerWidth - 8) left = window.innerWidth - 60;
        return clamp(left, r.top + 72, 52);
      }
      return clamp(window.innerWidth - 64, 24, 52);
    }
    return clamp(window.innerWidth - 72, window.innerHeight / 2 - 26, 52);
  }

  function applyPos(wrap, pos) {
    wrap.style.left = pos.left + 'px';
    wrap.style.top = pos.top + 'px';
    wrap.style.right = 'auto';
    wrap.style.transform = 'none';
  }

  function bindDrag(wrap, btn, posKey) {
    var dragging = false;
    var moved = false;
    var startX = 0;
    var startY = 0;
    var origL = 0;
    var origT = 0;

    btn.addEventListener('pointerdown', function (ev) {
      if (ev.button != null && ev.button !== 0) return;
      dragging = true;
      moved = false;
      startX = ev.clientX;
      startY = ev.clientY;
      origL = wrap.offsetLeft;
      origT = wrap.offsetTop;
      try { btn.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    });
    btn.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (!moved) return;
      wrap.classList.remove('is-open');
      applyPos(wrap, clamp(origL + dx, origT + dy, 52));
    });
    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      try { btn.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      if (moved) {
        writePos(posKey, wrap.offsetLeft, wrap.offsetTop);
        ev.preventDefault();
        ev.stopPropagation();
      }
    }
    btn.addEventListener('pointerup', endDrag);
    btn.addEventListener('pointercancel', endDrag);
    btn.addEventListener('click', function (ev) {
      if (moved) {
        ev.preventDefault();
        ev.stopPropagation();
        moved = false;
        return;
      }
      ev.stopPropagation();
      wrap.classList.toggle('is-open');
    });
  }

  function viewUrl(file) {
    return siteRoot() + 'prototype-prd/view.html?file=' + encodeURIComponent(file);
  }

  function absoluteViewUrl(file) {
    return location.origin + viewUrl(file);
  }

  function openModal(title, file) {
    closeModal();
    var url = viewUrl(file);
    var abs = absoluteViewUrl(file);
    var modal = document.createElement('div');
    modal.className = 'pg-prd-modal';
    modal.innerHTML =
      '<div class="pg-prd-modal__mask" data-pg-prd-close="1"></div>' +
      '<div class="pg-prd-modal__box">' +
      '<div class="pg-prd-modal__bar"><span>' + escapeHtml(title) + '</span>' +
      '<a class="pg-prd-modal__open" href="' + escapeHtml(abs) + '" target="_blank" rel="noopener">查看链接</a>' +
      '<button type="button" class="pg-prd-modal__close" data-pg-prd-close="1" aria-label="关闭">×</button></div>' +
      '<iframe class="pg-prd-modal__frame" title="PRD" src="' + escapeHtml(url) + '"></iframe>' +
      '</div>';
    modal.addEventListener('click', function (ev) {
      if (ev.target && ev.target.getAttribute('data-pg-prd-close')) closeModal();
    });
    document.body.appendChild(modal);
    var open = modal.querySelector('.pg-prd-modal__open');
    if (open) {
      open.addEventListener('click', function () {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(abs);
          }
        } catch (e) { /* ignore */ }
      });
    }
    document.addEventListener('keydown', onEsc);
  }

  function onEsc(ev) {
    if (ev.key === 'Escape') closeModal();
  }

  function closeModal() {
    var el = document.querySelector('.pg-prd-modal');
    if (el) el.parentNode.removeChild(el);
    document.removeEventListener('keydown', onEsc);
  }

  function render(prds) {
    injectStyle();
    var cend = isCEnd();
    var wrap = document.createElement('div');
    wrap.className = 'pg-prd-float' + (cend ? ' pg-prd-float--c' : '');
    wrap.innerHTML =
      '<button type="button" class="pg-prd-float__btn" aria-label="打开 PRD 列表">prd</button>' +
      '<div class="pg-prd-float__panel">' +
      '<div class="pg-prd-float__head">PRD 列表</div>' +
      '<div class="pg-prd-float__list"></div>' +
      '</div>';
    var list = wrap.querySelector('.pg-prd-float__list');
    list.innerHTML = prds.map(function (item) {
      return (
        '<button type="button" class="pg-prd-float__item" data-file="' +
        escapeHtml(prdFile(item)) +
        '" data-title="' +
        escapeHtml(prdTitle(item)) +
        '">' +
        escapeHtml(prdTitle(item)) +
        '</button>'
      );
    }).join('');
    list.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-file]');
      if (!btn) return;
      wrap.classList.remove('is-open');
      openModal(btn.getAttribute('data-title') || 'PRD', btn.getAttribute('data-file'));
    });
    document.body.appendChild(wrap);
    var posKey = cend ? POS_KEY_C : POS_KEY_B;
    var saved = readPos(posKey);
    applyPos(wrap, saved ? clamp(saved.left, saved.top, 52) : defaultPos(cend));
    bindDrag(wrap, wrap.querySelector('.pg-prd-float__btn'), posKey);
    document.addEventListener('click', function (ev) {
      if (!wrap.contains(ev.target)) wrap.classList.remove('is-open');
    });
    window.addEventListener('resize', function () {
      applyPos(wrap, clamp(wrap.offsetLeft, wrap.offsetTop, 52));
    });
  }

  function boot() {
    fetch(siteRoot() + 'prototype-prd/index.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('index');
        return r.json();
      })
      .then(function (data) {
        var all = (data && data.prds) || [];
        var matched = all.filter(function (item) {
          return pageMatches(item.pages);
        });
        if (!matched.length) return;
        render(matched);
      })
      .catch(function () { /* 未推送或无目录时不展示 */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
