/**
 * 数据中心 · 门店 / BD 下钻会话
 * URL：role=bd&storeId=xxx&from=bd-app
 * BD 单店经营统一落在 biz-bd-store.html，不再复用店长总览壳。
 */
(function (global) {
  var KEY = 'sa_biz_session_v1';

  /** 旧 STORE-* 与一期 BD 门店 ID 对齐 */
  var STORE_ID_ALIASES = {
    'STORE-YY': 'S-XX',
    'STORE-CN': 'S-CN',
    'S-CN': 'S-CN',
    'STORE-HP': 'S-HP',
    'S-HP': 'S-HP',
    'STORE-BJ': 'S-BJ',
    'S-BJ': 'S-BJ',
    'STORE-XX': 'S-XX',
    'S-XX': 'S-XX',
    'STORE-DC': 'S-DC',
    'S-DC': 'S-DC',
    'STORE-TEST': 'S-TEST',
    'S-TEST': 'S-TEST'
  };

  function pageParams() {
    try {
      return new URLSearchParams(location.search || '');
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  function writeRaw(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function canonicalizeStoreId(storeId) {
    var id = String(storeId || '').trim();
    if (!id) return '';
    if (STORE_ID_ALIASES[id]) return STORE_ID_ALIASES[id];
    if (/^S-/.test(id)) return id;
    return id;
  }

  function defaultStore() {
    var D = global.StoreAppBizDataCenter;
    if (D && D.STORE) return { id: D.STORE.id, name: D.STORE.name };
    var R = global.StoreAppBizReportData;
    if (R && R.STORE) return { id: R.STORE.id, name: R.STORE.name };
    return { id: 'S-CN', name: '城南生鲜店' };
  }

  function resolveBdStore(storeId) {
    var id = canonicalizeStoreId(storeId);
    if (!id) return null;
    var Bd = global.StoreAppBdDcData;
    if (Bd && typeof Bd.storeById === 'function') {
      var s = Bd.storeById(id);
      if (s) return { id: s.id, name: s.name, scope: s.scope || 'current', alerts: [] };
    }
    if (Bd && typeof Bd.stores === 'function') {
      var list = Bd.stores() || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
          return { id: list[i].id, name: list[i].name, scope: list[i].scope || 'current', alerts: [] };
        }
      }
    }
    var R = global.StoreAppBizReportData;
    if (R && typeof R.getBdStoreById === 'function') {
      var legacy = R.getBdStoreById(id);
      if (legacy && legacy.id && canonicalizeStoreId(legacy.id) === id) {
        return {
          id: canonicalizeStoreId(legacy.id),
          name: legacy.name,
          scope: 'current',
          alerts: (legacy.alerts || []).slice(),
          area: legacy.area || ''
        };
      }
    }
    return null;
  }

  function resolveStore(storeId) {
    var id = canonicalizeStoreId(storeId);
    var bd = resolveBdStore(id);
    if (bd) return bd;
    var def = defaultStore();
    if (!id || id === def.id) return { id: def.id, name: def.name, alerts: [], area: '', scope: 'current' };
    return { id: id, name: '', alerts: [], area: '', unknown: true };
  }

  function normalize(raw) {
    var next = Object.assign({ role: 'store', from: 'store-app', storeId: '' }, raw || {});
    if (next.role !== 'bd') next.role = 'store';
    if (next.from !== 'bd-app') next.from = 'store-app';
    if (next.role === 'bd') {
      next.storeId = canonicalizeStoreId(next.storeId);
      return next;
    }
    var store = resolveStore(next.storeId || defaultStore().id);
    next.storeId = store.id;
    return next;
  }

  function applyUrl() {
    var params = pageParams();
    var from = params.get('from');
    var role = params.get('role');
    var storeId = params.get('storeId') || params.get('store');
    var isBdEntry = from === 'bd-app' || role === 'bd';
    if (isBdEntry) {
      var patch = { role: 'bd', from: 'bd-app' };
      if (storeId) patch.storeId = canonicalizeStoreId(storeId);
      var next = normalize(Object.assign(readRaw() || {}, patch));
      writeRaw(next);
      return next;
    }
    var def = defaultStore();
    var storeSess = normalize({
      role: 'store',
      from: 'store-app',
      storeId: def.id
    });
    writeRaw(storeSess);
    return storeSess;
  }

  function read() {
    return normalize(applyUrl());
  }

  function isBd() {
    return read().role === 'bd';
  }

  function currentStore() {
    var sess = read();
    return resolveStore(sess.storeId);
  }

  function qsParams(extra) {
    var sess = read();
    var out = {};
    if (sess.role === 'bd') {
      out.role = 'bd';
      out.from = 'bd-app';
      if (sess.storeId) out.storeId = sess.storeId;
    }
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k] != null && extra[k] !== '') out[k] = extra[k];
    });
    return out;
  }

  function appendQs(url, extra) {
    var base = String(url || '');
    var hash = '';
    var hi = base.indexOf('#');
    if (hi >= 0) {
      hash = base.slice(hi);
      base = base.slice(0, hi);
    }
    var path = base;
    var search = '';
    var qi = base.indexOf('?');
    if (qi >= 0) {
      path = base.slice(0, qi);
      search = base.slice(qi + 1);
    }
    var params;
    try {
      params = new URLSearchParams(search);
    } catch (e) {
      params = new URLSearchParams();
    }
    var q = qsParams(extra);
    Object.keys(q).forEach(function (k) {
      params.set(k, q[k]);
    });
    var pair = params.toString();
    return path + (pair ? '?' + pair : '') + hash;
  }

  function homeHref() {
    if (isBd()) return 'biz-bd-center.html?from=bd-app&role=bd&group=stores&section=business';
    return 'home.html';
  }

  function backHref() {
    if (isBd()) {
      try {
        var ret = pageParams().get('returnTo');
        if (ret === 'stores') return 'biz-bd-stores.html?from=bd-app&role=bd';
        if (ret === 'center' || ret === 'home') return homeHref();
      } catch (e) { /* ignore */ }
      return homeHref();
    }
    return 'home.html';
  }

  function bdStoreHref(storeId, extra) {
    var id = canonicalizeStoreId(storeId);
    var q = Object.assign(
      { role: 'bd', from: 'bd-app' },
      extra || {}
    );
    if (id) q.storeId = id;
    var parts = Object.keys(q).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(q[k]);
    });
    return 'biz-bd-store.html?' + parts.join('&');
  }

  /**
   * BD 误入店长壳页时，跳到 BD 单店页；无法解析门店则带 unknown 标记由单店页提示。
   */
  function redirectBdAwayFromStoreShell() {
    if (!isBd()) return false;
    var path = String(location.pathname || '');
    var onStoreShell =
      /biz-center\.html|biz-ops\.html|biz-operate\.html|biz-commission\.html|biz-revenue\.html|biz-restock|biz-order-goods|biz-rbt\.html/i.test(
        path
      );
    if (!onStoreShell) return false;
    var sess = read();
    var params = pageParams();
    var extra = {};
    if (params.get('range')) extra.range = params.get('range');
    if (params.get('tab')) extra.tab = params.get('tab');
    if (params.get('start')) extra.start = params.get('start');
    if (params.get('end')) extra.end = params.get('end');
    extra.returnTo = 'center';
    location.replace(bdStoreHref(sess.storeId, extra));
    return true;
  }

  function hasAlertCode(code) {
    var store = currentStore();
    return (store.alerts || []).some(function (a) {
      return a.code === code;
    });
  }

  function alertTitles() {
    return (currentStore().alerts || [])
      .map(function (a) {
        return a.title;
      })
      .join(' · ');
  }

  function clearBdChrome() {
    document.documentElement.classList.remove('sa-biz-bd', 'sa-biz-bd--no-tabbar');
    document.body.classList.remove('sa-biz-bd', 'sa-biz-bd--no-tabbar');
    var bar = document.getElementById('saBizBdBar');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    var tip = document.getElementById('saBizBdAlertTip');
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    document.querySelectorAll('.sa-rpt-tabbar, .sa-biz-tabbar').forEach(function (el) {
      el.hidden = false;
      el.removeAttribute('aria-hidden');
    });
  }

  function applyChrome() {
    if (!isBd()) {
      clearBdChrome();
      return;
    }
    if (redirectBdAwayFromStoreShell()) return;
  }

  function boot(opts) {
    read();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyChrome(opts);
      });
    } else {
      applyChrome(opts);
    }
  }

  global.StoreAppBizSession = {
    read: read,
    isBd: isBd,
    currentStore: currentStore,
    resolveStore: resolveStore,
    resolveBdStore: resolveBdStore,
    canonicalizeStoreId: canonicalizeStoreId,
    qsParams: qsParams,
    appendQs: appendQs,
    homeHref: homeHref,
    backHref: backHref,
    bdStoreHref: bdStoreHref,
    hasAlertCode: hasAlertCode,
    alertTitles: alertTitles,
    applyChrome: applyChrome,
    boot: boot
  };
})(window);
