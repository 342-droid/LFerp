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
    if (doc.querySelector('.ua-gd-page') && doc.getElementById('gdTotalValue')) return 'growth-detail.html';
    if (doc.querySelector('.ua-gd-page') && doc.getElementById('grContent')) return 'growth-rule-desc.html';
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
    var params = new URLSearchParams((global.location && global.location.search) || '');
    var fromQuery = params.get('from') || params.get('back') || '';
    var remembered = readRememberedBack();
    return sanitizeBack(fromQuery || remembered, fallback);
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
    var href = getBackHref(fallback);
    if (el) {
      el.setAttribute('href', href);
      el.addEventListener('click', function () {
        /* 返回后清掉记忆，避免污染下一次默认返回 */
        try {
          global.sessionStorage.removeItem(BACK_STORAGE_KEY);
        } catch (e) { /* ignore */ }
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
})(window);
