/**
 * 用户 APP — 页面返回导航约定
 * 从 A 跳到 B 时带上 ?from=A；B 页左上角返回读 from，无特殊说明时回到 A。
 *
 * 用法：
 *   跳转：href = UaNav.withFrom('profile-edit.html')
 *   返回：UaNav.applyBackLink('.ua-pe-nav__back', 'profile.html')
 */
(function (global) {
  var SAFE_PAGE_RE = /^[a-z0-9][a-z0-9._-]*\.html(?:\?[^#]*)?(?:#.*)?$/i;
  var BACK_STORAGE_KEY = 'ua_nav_back_v1';

  function currentPage() {
    var path = ((global.location && global.location.pathname) || '').replace(/\\/g, '/');
    var fromPath = (path.split('/').pop() || '').split('?')[0] || '';
    if (fromPath && /\.html$/i.test(fromPath)) return fromPath.toLowerCase();

    /* 本地预览 pathname 可能不含文件名，用 DOM 兜底 */
    var doc = global.document;
    if (!doc) return fromPath;
    if (doc.querySelector('.ua-mc-page, #mcCarousel, .ua-mc-carousel')) return 'member-center.html';
    if (doc.querySelector('.ua-pe-page, #peSaveBtn')) return 'profile-edit.html';
    if (doc.getElementById('uaProfileContent') || doc.querySelector('.ua-profile-page')) return 'profile.html';
    if (doc.getElementById('acPanelNotice') || doc.querySelector('[data-ac-panel]')) return 'account-cancel.html';
    if (doc.querySelector('.ua-change-pwd-screen') || doc.getElementById('pwdSubmit')) return 'change-password.html';
    if (doc.querySelector('.ua-set-pwd-screen')) return 'set-password.html';
    if (doc.querySelector('.ua-forgot-pwd-screen')) return 'forgot-password.html';
    if (doc.getElementById('setClearCache')) return 'settings.html';
    if (doc.getElementById('moreAccountCancel')) return 'settings-more.html';
    if (doc.querySelector('.ua-set-page') && doc.querySelector('.ua-pe-nav__title')) {
      var t = (doc.querySelector('.ua-pe-nav__title').textContent || '').trim();
      if (t === '更多') return 'settings-more.html';
      if (t === '设置') return 'settings.html';
      if (t === '修改密码') return 'change-password.html';
      if (t === '设置密码') return 'set-password.html';
      if (t === '密码管理') return 'settings.html';
      if (t.indexOf('注销') >= 0) return 'account-cancel.html';
    }
    if (doc.querySelector('.ua-gd-page') && doc.getElementById('gdTotalValue')) return 'growth-detail.html';
    if (doc.querySelector('.ua-pd-page') && doc.getElementById('pdCurrent')) return 'points-detail.html';
    if (doc.querySelector('.ua-pm-page') && doc.getElementById('pmAvailable')) return 'points-mall.html';
    if (doc.querySelector('.ua-nz-page') && doc.getElementById('nzList')) return 'newcomer-zone.html';
    if (doc.querySelector('.ua-ppd-page') && doc.getElementById('ppdTitle')) return 'points-product-detail.html';
    if (doc.querySelector('.ua-poc-page') && doc.getElementById('pocSubmit')) return 'points-order-confirm.html';
    if (doc.querySelector('.ua-gd-page') && doc.getElementById('prContent')) return 'points-rule-desc.html';
    if (doc.querySelector('.ua-gd-page') && doc.getElementById('grContent')) return 'growth-rule-desc.html';
    if (doc.querySelector('.ua-report-page')) return 'report-records.html';
    if (doc.querySelector('.ua-fb-page')) return 'feedback.html';
    return fromPath;
  }

  function sanitizeBack(href, fallback) {
    fallback = fallback || 'profile.html';
    if (href == null || href === '') return fallback;
    try {
      href = decodeURIComponent(String(href));
    } catch (e) {
      return fallback;
    }
    href = href.replace(/^\.\//, '').trim();
    if (!href || /^(https?:|\/\/|javascript:|data:)/i.test(href)) return fallback;
    if (!SAFE_PAGE_RE.test(href)) return fallback;
    return href;
  }

  function rememberBack(page) {
    page = sanitizeBack(page, '');
    if (!page) return;
    try {
      global.sessionStorage.setItem(BACK_STORAGE_KEY, page);
    } catch (e) { /* ignore */ }
  }

  function readRememberedBack() {
    try {
      return global.sessionStorage.getItem(BACK_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function getBackHref(fallback) {
    fallback = sanitizeBack(fallback, 'profile.html');
    var params = new URLSearchParams((global.location && global.location.search) || '');
    var fromQuery = params.get('from') || params.get('back') || '';
    var remembered = readRememberedBack();
    var href = sanitizeBack(fromQuery || remembered, fallback);
    var here = currentPage();
    /* 避免返回链指向当前页，表现为「点击没反应」 */
    if (here && pageBase(href) === pageBase(here)) {
      href = fallback;
    }
    if (here && pageBase(href) === pageBase(here)) {
      href = 'profile.html';
    }
    return href;
  }

  function pageBase(name) {
    return String(name || '')
      .split('?')[0]
      .split('#')[0]
      .replace(/^\.\//, '')
      .split('/')
      .pop()
      .toLowerCase();
  }

  function withFrom(target, fromPage) {
    if (!target) return target;
    fromPage = fromPage || currentPage();
    if (!fromPage) fromPage = 'profile.html';

    rememberBack(fromPage);

    var hash = '';
    var hashIdx = target.indexOf('#');
    if (hashIdx >= 0) {
      hash = target.slice(hashIdx);
      target = target.slice(0, hashIdx);
    }
    if (/[?&]from=/.test(target) || /[?&]back=/.test(target)) {
      return target + hash;
    }
    var sep = target.indexOf('?') >= 0 ? '&' : '?';
    return target + sep + 'from=' + encodeURIComponent(fromPage) + hash;
  }

  function applyBackLink(elOrSelector, fallback) {
    var el = typeof elOrSelector === 'string'
      ? document.querySelector(elOrSelector)
      : elOrSelector;
    fallback = sanitizeBack(fallback, 'profile.html');
    var href = getBackHref(fallback);
    /* 若记忆指向本页，顺手清掉，避免反复污染 */
    try {
      if (pageBase(readRememberedBack()) === pageBase(currentPage())) {
        global.sessionStorage.removeItem(BACK_STORAGE_KEY);
      }
    } catch (e) { /* ignore */ }
    if (el) {
      el.setAttribute('href', href);
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        try {
          global.sessionStorage.removeItem(BACK_STORAGE_KEY);
        } catch (e) { /* ignore */ }
        var target = sanitizeBack(el.getAttribute('href') || href, fallback);
        if (pageBase(target) === pageBase(currentPage())) {
          target = fallback;
        }
        if (pageBase(target) === pageBase(currentPage())) {
          target = 'profile.html';
        }
        try {
          global.location.assign(target);
        } catch (err) {
          global.location.href = target;
        }
      });
    }
    return href;
  }

  function rewriteLinksWithFrom(selector, fromPage) {
    fromPage = fromPage || currentPage();
    document.querySelectorAll(selector).forEach(function (el) {
      var href = el.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^(https?:|\/\/|javascript:|mailto:|tel:)/i.test(href)) return;
      if (!SAFE_PAGE_RE.test(href.replace(/^\.\//, ''))) return;
      el.setAttribute('href', withFrom(href, fromPage));
    });
  }

  global.UaNav = {
    currentPage: currentPage,
    getBackHref: getBackHref,
    withFrom: withFrom,
    applyBackLink: applyBackLink,
    sanitizeBack: sanitizeBack,
    rememberBack: rememberBack,
    rewriteLinksWithFrom: rewriteLinksWithFrom
  };

  if (!document.getElementById('pg-prd-float-js')) {
    var s = document.createElement('script');
    s.id = 'pg-prd-float-js';
    s.src = '../../js/pg-prd-float.js?v=20260824-openlink';
    s.async = true;
    (document.head || document.body).appendChild(s);
  }
})(window);
