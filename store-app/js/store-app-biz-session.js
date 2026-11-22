/**
 * 数据中心 · 门店 / BD 下钻会话
 * URL：role=bd&storeId=xxx&from=bd-app
 */
(function (global) {
  var KEY = 'sa_biz_session_v1';

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

  function defaultStore() {
    var D = global.StoreAppBizReportData;
    if (D && D.STORE) return { id: D.STORE.id, name: D.STORE.name };
    return { id: 'STORE-YY', name: '悠悠生鲜超市' };
  }

  function resolveStore(storeId) {
    var D = global.StoreAppBizReportData;
    var id = String(storeId || '').trim();
    if (D && typeof D.getBdStoreById === 'function' && id) {
      var s = D.getBdStoreById(id);
      if (s) return { id: s.id, name: s.name, alerts: (s.alerts || []).slice(), area: s.area || '' };
    }
    var def = defaultStore();
    return { id: def.id, name: def.name, alerts: [], area: '' };
  }

  function normalize(raw) {
    var next = Object.assign({ role: 'store', from: 'store-app', storeId: '' }, raw || {});
    if (next.role !== 'bd') next.role = 'store';
    if (next.from !== 'bd-app') next.from = 'store-app';
    var store = resolveStore(next.storeId || defaultStore().id);
    next.storeId = store.id;
    return next;
  }

  function applyUrl() {
    var params = pageParams();
    var from = params.get('from');
    var role = params.get('role');
    var storeId = params.get('storeId');
    /* 仅 URL 显式带 BD 入口时进入 BD 下钻；否则强制本店视角，避免 localStorage 残留把店长带进 BD 壳 */
    var isBdEntry = from === 'bd-app' || role === 'bd';
    if (isBdEntry) {
      var patch = { role: 'bd', from: 'bd-app' };
      if (storeId) patch.storeId = storeId;
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
      out.from = sess.from === 'bd-app' ? 'bd-app' : 'bd-app';
      out.storeId = sess.storeId;
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
    if (isBd()) return appendQs('biz-bd-home.html');
    return 'home.html';
  }

  function backHref() {
    if (isBd()) return appendQs('biz-bd-home.html');
    return 'home.html';
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

  /**
   * BD 顶栏 + 底栏回退 + 链接透传 query
   */
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

  function applyChrome(opts) {
    opts = opts || {};
    if (!isBd()) {
      clearBdChrome();
      return;
    }

    document.documentElement.classList.add('sa-biz-bd');
    document.body.classList.add('sa-biz-bd');

    var store = currentStore();
    var bar = document.getElementById('saBizBdBar');
    if (!bar) {
      bar = document.createElement('header');
      bar.id = 'saBizBdBar';
      bar.className = 'sa-biz-bd-bar';
      bar.innerHTML =
        '<a class="sa-biz-bd-bar__back" id="saBizBdBack" aria-label="返回">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>' +
        '</a>' +
        '<div class="sa-biz-bd-bar__main">' +
        '<div class="sa-biz-bd-bar__store" id="saBizBdStore"></div>' +
        '</div>';
      var shell = document.querySelector('.sa-rpt') || document.querySelector('.sa-shell') || document.body;
      shell.insertBefore(bar, shell.firstChild);
    }
    var back = document.getElementById('saBizBdBack');
    if (back) back.setAttribute('href', backHref());
    var nameEl = document.getElementById('saBizBdStore');
    if (nameEl) nameEl.textContent = store.name || '—';

    /* 本店预警条：只展示，不可点（非跳转入口） */
    var tipHost = document.getElementById('saBizBdAlertTip');
    var titles = alertTitles();
    if (titles) {
      if (!tipHost) {
        tipHost = document.createElement('div');
        tipHost.id = 'saBizBdAlertTip';
        tipHost.className = 'sa-biz-bd-alert';
        tipHost.setAttribute('role', 'status');
        if (bar && bar.nextSibling) bar.parentNode.insertBefore(tipHost, bar.nextSibling);
        else if (bar) bar.parentNode.appendChild(tipHost);
      }
      tipHost.hidden = false;
      tipHost.textContent = '本店预警：' + titles;
    } else if (tipHost) {
      tipHost.hidden = true;
    }

    /* BD 下钻为二级／三级页：隐藏门店底栏 Tab */
    document.querySelectorAll('.sa-rpt-tabbar, .sa-biz-tabbar').forEach(function (bar) {
      bar.hidden = true;
      bar.setAttribute('aria-hidden', 'true');
    });
    document.documentElement.classList.add('sa-biz-bd--no-tabbar');
    document.body.classList.add('sa-biz-bd--no-tabbar');

    /* 同模块内链透传 */
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!/^biz-/.test(href) && !/^\.\/biz-/.test(href)) return;
      if (/role=bd|storeId=/.test(href)) return;
      a.setAttribute('href', appendQs(href));
    });

    /* BD 只看经营：营业额／顾客分析／RBT；藏佣金与进货 */
    applyBdScopeUi();
    if (/biz-commission\.html|biz-order-goods\.html|biz-restock-report\.html/i.test(location.pathname || '')) {
      location.replace(appendQs('biz-center.html'));
      return;
    }

    /* 预警红点：命中对应区块 */
    markDots();
  }

  function applyBdScopeUi() {
    /* 佣金明细入口 */
    document.querySelectorAll('a[href*="biz-commission"]').forEach(function (a) {
      var tab = a.classList.contains('sa-rpt-topline__tab') || a.classList.contains('sa-biz-topline__tab');
      if (tab) {
        a.hidden = true;
        a.setAttribute('aria-hidden', 'true');
        return;
      }
      a.removeAttribute('href');
      a.classList.add('sa-biz-bd-nolink');
    });
    /* 顶 Tab 整条隐藏（BD 无佣金明细） */
    document.querySelectorAll('.sa-rpt-topline, .sa-biz-topline').forEach(function (el) {
      el.hidden = true;
    });
    /* 佣金橙卡 */
    document.querySelectorAll('.sa-rpt-snap, [aria-label="佣金快照"]').forEach(function (el) {
      el.hidden = true;
    });
    /* 进货概况 */
    document.querySelectorAll('a[href*="biz-restock"]').forEach(function (a) {
      a.hidden = true;
      a.setAttribute('aria-hidden', 'true');
    });
    var withdrawTop = document.getElementById('bizWithdrawTop');
    if (withdrawTop) withdrawTop.hidden = true;
    document.querySelectorAll('#bizWithdrawBtn, [data-biz-withdraw]').forEach(function (btn) {
      btn.hidden = true;
    });
    var settleTip = document.getElementById('bizBdSettleTip');
    if (settleTip) settleTip.hidden = true;
  }

  function markDots() {
    var map = [
      { code: 'AL-01', sel: '[data-drill="paid"], #rptPaid' },
      { code: 'AL-02', sel: '[data-drill="orders"], #rptMainCnt' },
      { code: 'AL-03', sel: '[data-drill="rbt"]' },
      { code: 'AL-04', sel: '[data-drill="rbt"]' },
      { code: 'AL-08', sel: '#rptAftersaleCard, [data-tip="aftersale"]' }
    ];
    map.forEach(function (item) {
      if (!hasAlertCode(item.code)) return;
      document.querySelectorAll(item.sel).forEach(function (el) {
        var host = el.closest('.sa-rpt-metric, .sa-rpt-snap__cell, .sa-rpt-card') || el;
        host.classList.add('sa-biz-bd-dot');
      });
    });
  }

  function ensureStyles() {
    if (document.getElementById('saBizBdStyles')) return;
    var style = document.createElement('style');
    style.id = 'saBizBdStyles';
    style.textContent =
      '.sa-biz-bd-bar{display:flex;align-items:center;gap:4px;min-height:48px;padding:6px 8px;background:#fff;border-bottom:1px solid #f1f2f5;flex-shrink:0}' +
      '.sa-biz-bd-bar__back{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;color:#1f2024;text-decoration:none}' +
      '.sa-biz-bd-bar__back svg{width:22px;height:22px}' +
      '.sa-biz-bd-bar__main{flex:1;min-width:0;padding-right:8px}' +
      '.sa-biz-bd-bar__store{font-size:17px;font-weight:600;color:#1f2024;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sa-biz-bd-alert{display:block;margin:8px 12px 0;padding:10px 12px;border-radius:10px;background:rgba(255,101,1,.08);color:#ff6501;font-size:12px;line-height:1.45;pointer-events:none;cursor:default}' +
      '.sa-biz-bd .sa-rpt-tabbar,.sa-biz-bd .sa-biz-tabbar{display:none!important}' +
      '.sa-biz-bd--no-tabbar .sa-rpt-scroll,.sa-biz-bd--no-tabbar .sa-biz-scroll{padding-bottom:24px}' +
      '.sa-biz-bd-dot{position:relative}' +
      '.sa-biz-bd-dot::after{content:"";position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;background:#f62b57;box-shadow:0 0 0 2px #fff}' +
      '.sa-biz-bd-settle-tip{display:none!important}' +
      '.sa-biz-bd #bizWithdrawTop{display:none!important}' +
      '.sa-biz-bd .sa-rpt-topline,.sa-biz-bd .sa-biz-topline{display:none!important}' +
      '.sa-biz-bd .sa-rpt-snap{display:none!important}' +
      '.sa-biz-bd a[href*="biz-restock"],.sa-biz-bd a.sa-rpt-entry[href*="restock"]{display:none!important}' +
      '.sa-biz-bd [data-drill="pending"],.sa-biz-bd [data-drill="credited"],.sa-biz-bd [data-drill="orders"]{cursor:default}' +
      '.sa-biz-bd-nolink{pointer-events:none;opacity:.45}';
    document.head.appendChild(style);
  }

  function boot(opts) {
    ensureStyles();
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
    qsParams: qsParams,
    appendQs: appendQs,
    homeHref: homeHref,
    backHref: backHref,
    hasAlertCode: hasAlertCode,
    applyChrome: applyChrome,
    boot: boot
  };
})(window);
