/**
 * C 端 · 丰银宝直播分享带参
 * - 海报 / 小程序链接携带 storeId + staffId（邀请人）
 * - 打开后参数写入本地缓存，页内跳转、先逛后登录均保留
 * - 注册登录后自动绑定该门店并进入该场直播页；门店停业则绑系统默认店并提示
 */
(function (global) {
  'use strict';

  var PAYLOAD_KEY = 'ua_live_invite_v1';
  var DEMO_KEY = 'ua_live_invite_demo_v1';
  var TOAST_KEY = 'ua_live_invite_toast_v1';
  var APPLIED_KEY = 'ua_live_invite_applied_v1';
  var BIND_KEY = 'ua_store_bind_v1';
  var BIND_LOG_KEY = 'mdm_member_store_bind_log_v1';
  var SESSION_KEY = 'ua_user_session_v1';
  var DISABLED_TIP = '分享门店停业，自动绑定默认门店';

  var DEFAULT_DEMO = {
    loggedIn: 'yes',
    storeStatus: 'enabled'
  };

  var STORE_META = {
    'ONS303445581201': {
      name: '冷丰生鲜超市',
      region: '天津市河东区',
      addr: '天津市河东区长三角珠宝产业园A3栋'
    },
    'ONS-CENTER-01': {
      name: '中心店01',
      region: '浙江省杭州市西湖区',
      addr: '杭州市西湖区绿城西溪世纪中心1号楼'
    },
    'ONS-XIXI-SOUTH': {
      name: '西溪湿地南门店',
      region: '浙江省杭州市西湖区',
      addr: '杭州市西湖区天目山路旁西溪湿地南门'
    },
    'ONS-JIANGCUN': {
      name: '蒋村公交站店',
      region: '浙江省杭州市西湖区',
      addr: '杭州市西湖区余杭塘路蒋村路口'
    }
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function readSessionPayload() {
    var fromLs = readJson(PAYLOAD_KEY, null);
    var fromSs = null;
    try {
      var raw = sessionStorage.getItem(PAYLOAD_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && typeof data === 'object') fromSs = data;
      }
    } catch (e) {
      fromSs = null;
    }
    if (fromLs && fromSs) {
      return (fromLs.capturedAt || 0) >= (fromSs.capturedAt || 0) ? fromLs : fromSs;
    }
    return fromLs || fromSs;
  }

  function writePayload(data) {
    try {
      sessionStorage.setItem(PAYLOAD_KEY, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
    writeJson(PAYLOAD_KEY, data);
  }

  function getDemo() {
    return Object.assign({}, DEFAULT_DEMO, readJson(DEMO_KEY, {}));
  }

  function setDemo(patch) {
    var next = Object.assign(getDemo(), patch || {});
    writeJson(DEMO_KEY, next);
    try {
      localStorage.removeItem(APPLIED_KEY);
    } catch (e) {
      /* ignore */
    }
    return next;
  }

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return d || '';
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatNow() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function syncUrlFromPayload() {
    var payload = readSessionPayload();
    if (!payload || !payload.storeId || !payload.staffId) return;
    try {
      var url = new URL(global.location.href);
      var keys = ['storeId', 'staffId', 'inviteName', 'invitePhone', 'sessionId'];
      var changed = false;
      keys.forEach(function (key) {
        if (payload[key] && !url.searchParams.get(key)) {
          url.searchParams.set(key, payload[key]);
          changed = true;
        }
      });
      if (changed) {
        global.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function guestLandingPage() {
    return appendToUrl('home.html');
  }

  function captureFromUrl() {
    var params = new URLSearchParams(global.location.search || '');
    var storeId = params.get('storeId') || params.get('store') || '';
    var staffId = params.get('staffId') || params.get('inviter') || params.get('inviteId') || '';
    var inviteName = params.get('inviteName') || '';
    var invitePhone = params.get('invitePhone') || '';
    var sessionId = params.get('sessionId') || '';
    if (!storeId || !staffId) {
      var existing = readSessionPayload();
      return existing;
    }
    var payload = {
      storeId: storeId,
      staffId: staffId,
      inviteName: inviteName || '牛店长',
      invitePhone: invitePhone || '13812348001',
      sessionId: sessionId,
      capturedAt: Date.now()
    };
    writePayload(payload);
    return payload;
  }

  function hasInvite() {
    var p = readSessionPayload();
    return !!(p && p.storeId && p.staffId);
  }

  function isLoggedIn() {
    var demo = getDemo();
    if (demo.loggedIn === 'no') return false;
    if (demo.loggedIn === 'yes') {
      var sess = readJson(SESSION_KEY, null);
      if (sess && sess.loggedIn === false && sess.skipped) return false;
      return true;
    }
    var session = readJson(SESSION_KEY, null);
    if (session && session.loggedIn) return true;
    if (session && session.loggedIn === false) return false;
    return true;
  }

  function isShareStoreEnabled(storeId) {
    var demo = getDemo();
    if (demo.storeStatus === 'disabled') return false;
    if (global.UaStoreSwitch && global.UaStoreSwitch.CATALOG) {
      var cat = null;
      for (var i = 0; i < global.UaStoreSwitch.CATALOG.length; i++) {
        if (global.UaStoreSwitch.CATALOG[i].id === storeId) {
          cat = global.UaStoreSwitch.CATALOG[i];
          break;
        }
      }
      if (cat && cat.status === 'disabled') return false;
    }
    return true;
  }

  function defaultStoreId() {
    if (global.UaStoreSwitch && typeof global.UaStoreSwitch.getSystemDefaultStore === 'function') {
      var def = global.UaStoreSwitch.getSystemDefaultStore();
      if (def && def.id) return def.id;
    }
    if (global.MdmSystemDefaultStore && typeof global.MdmSystemDefaultStore.readDefault === 'function') {
      var fromB = global.MdmSystemDefaultStore.readDefault();
      if (fromB && fromB.storeId) return fromB.storeId;
    }
    return 'ONS-CENTER-01';
  }

  function bindStore(storeId) {
    if (global.UaStoreSwitch && typeof global.UaStoreSwitch.markVisited === 'function') {
      global.UaStoreSwitch.markVisited(storeId);
      return;
    }
    var bind = Object.assign(
      { confirmed: false, currentStoreId: '', scannedIds: [], visitAt: {} },
      readJson(BIND_KEY, {})
    );
    if (!Array.isArray(bind.scannedIds)) bind.scannedIds = [];
    if (!bind.visitAt || typeof bind.visitAt !== 'object') bind.visitAt = {};
    var defId = defaultStoreId();
    if (storeId && storeId !== defId && bind.scannedIds.indexOf(storeId) < 0) {
      bind.scannedIds.push(storeId);
    }
    bind.currentStoreId = storeId;
    bind.visitAt[storeId] = Date.now();
    bind.confirmed = true;
    writeJson(BIND_KEY, bind);
  }

  function inviterText(payload) {
    var name = (payload && payload.inviteName) || '牛店长';
    var phone = maskPhone((payload && payload.invitePhone) || '');
    return phone ? name + '（' + phone + '）' : name;
  }

  function appendBindLog(payload, storeId, usedDefault) {
    var meta = STORE_META[storeId] || STORE_META['ONS-CENTER-01'];
    var rec = {
      type: usedDefault ? '绑定门店' : '绑定门店',
      storeName: (meta && meta.name) || storeId,
      region: (meta && meta.region) || '—',
      addr: (meta && meta.addr) || '—',
      way: '直播分享',
      time: formatNow(),
      watch: '—',
      amount: '—',
      orders: '—',
      refundAmt: '—',
      refundCnt: '—',
      inviter: inviterText(payload)
    };
    var map = readJson(BIND_LOG_KEY, {});
    var memberId = 'U10001';
    var session = readJson(SESSION_KEY, null);
    if (session && session.phone) memberId = 'U10001';
    var rows = map[memberId];
    if (!Array.isArray(rows)) rows = [];
    rows.unshift(rec);
    map[memberId] = rows;
    writeJson(BIND_LOG_KEY, map);
  }

  function showToast(msg) {
    if (global.UaUserAuth && typeof global.UaUserAuth.showToast === 'function') {
      global.UaUserAuth.showToast(msg);
      return;
    }
    var el = document.getElementById('uaShopToast') || document.getElementById('uaLoginToast');
    if (el) {
      el.textContent = msg;
      el.hidden = false;
      clearTimeout(showToast._t);
      showToast._t = setTimeout(function () {
        el.hidden = true;
      }, 1800);
      return;
    }
    var toast = document.getElementById('uaLiveInviteToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'uaLiveInviteToast';
      toast.className = 'ua-sa-toast';
      toast.style.cssText =
        'position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:4000;max-width:80%;padding:10px 16px;border-radius:8px;background:rgba(0,0,0,.78);color:#fff;font-size:14px;text-align:center;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.hidden = true;
    }, 2000);
  }

  function applyBind(payload) {
    if (!payload || !payload.storeId) return { bound: false };
    var enabled = isShareStoreEnabled(payload.storeId);
    var targetId = enabled ? payload.storeId : defaultStoreId();
    var sig = [payload.storeId, payload.staffId, enabled ? '1' : '0', targetId].join('|');
    var applied = readJson(APPLIED_KEY, null);
    if (applied && applied.sig === sig) {
      return { bound: true, storeId: targetId, fallback: !enabled, skipped: true };
    }
    bindStore(targetId);
    appendBindLog(payload, targetId, !enabled);
    writeJson(APPLIED_KEY, { sig: sig });
    if (!enabled) {
      try {
        sessionStorage.setItem(TOAST_KEY, DISABLED_TIP);
      } catch (e) {
        /* ignore */
      }
    }
    return { bound: true, storeId: targetId, fallback: !enabled };
  }

  function promotedPage() {
    var payload = readSessionPayload();
    if (!payload || !payload.sessionId) return '';
    return appendToUrl('live-room.html?sessionId=' + encodeURIComponent(payload.sessionId));
  }

  function gateLiveRoomIfNeeded() {
    var path = String(global.location.pathname || '');
    if (path.indexOf('live-room') < 0) return;
    if (!hasInvite()) return;
    if (isLoggedIn()) return;
    var next = 'live-room.html' + (global.location.search || '');
    var login = appendToUrl('login.html?next=' + encodeURIComponent(next));
    global.location.replace(login);
  }

  function consumeLanding() {
    var payload = captureFromUrl();
    if (!payload || !payload.storeId || !payload.staffId) return false;
    if (!isLoggedIn()) return true;
    applyBind(payload);
    return true;
  }

  function applyBindAfterLogin() {
    var payload = captureFromUrl() || readSessionPayload();
    if (!payload || !payload.storeId || !payload.staffId) return;
    var result = applyBind(payload);
    if (result.fallback) {
      try {
        sessionStorage.setItem(TOAST_KEY, DISABLED_TIP);
      } catch (e) {
        /* ignore */
      }
    }
  }

  function flushToast() {
    var msg = '';
    try {
      msg = sessionStorage.getItem(TOAST_KEY) || '';
      if (msg) sessionStorage.removeItem(TOAST_KEY);
    } catch (e) {
      msg = '';
    }
    if (msg) {
      setTimeout(function () {
        showToast(msg);
      }, 300);
    }
  }

  function appendToUrl(href) {
    var payload = readSessionPayload();
    if (!payload || !payload.storeId || !payload.staffId) return href;
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return href;
    if (/^(tel:|mailto:)/i.test(href)) return href;
    try {
      var url = new URL(href, global.location.href);
      if (url.origin !== global.location.origin) return href;
      if (!url.searchParams.get('storeId')) url.searchParams.set('storeId', payload.storeId);
      if (!url.searchParams.get('staffId')) url.searchParams.set('staffId', payload.staffId);
      if (payload.inviteName && !url.searchParams.get('inviteName')) {
        url.searchParams.set('inviteName', payload.inviteName);
      }
      if (payload.invitePhone && !url.searchParams.get('invitePhone')) {
        url.searchParams.set('invitePhone', payload.invitePhone);
      }
      if (payload.sessionId && !url.searchParams.get('sessionId')) {
        url.searchParams.set('sessionId', payload.sessionId);
      }
      if (href.indexOf('http') === 0) return url.href;
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return href;
    }
  }

  function interceptLinks() {
    document.addEventListener(
      'click',
      function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || e.defaultPrevented) return;
        if (a.target && a.target !== '_self') return;
        var href = a.getAttribute('href');
        var next = appendToUrl(href);
        if (next !== href) {
          e.preventDefault();
          global.location.href = next;
        }
      },
      true
    );
  }

  function mountDemoPanel() {
    if (document.getElementById('uaLiveInviteDemo')) return;
    if (!document.querySelector('.user-app-body')) return;
    var isLogin = !!document.querySelector('.ua-mobile-shell--login, .ua-register-screen, .ua-phone-login-screen');
    var demo = getDemo();
    var panel = document.createElement('div');
    panel.id = 'uaLiveInviteDemo';
    panel.className = 'ua-rg-demo ua-live-invite-demo' + (isLogin ? ' ua-live-invite-demo--login' : '');
    panel.innerHTML =
      '<div class="ua-rg-demo__title">直播分享验收开关</div>' +
      '<label class="ua-rg-demo__row">登录态' +
      '<select id="uaLiveInviteLogin">' +
      '<option value="yes">已登录</option>' +
      '<option value="no">未登录</option>' +
      '</select></label>' +
      '<label class="ua-rg-demo__row">分享门店' +
      '<select id="uaLiveInviteStore">' +
      '<option value="enabled">已启用</option>' +
      '<option value="disabled">已禁用</option>' +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveInviteApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var loginSel = document.getElementById('uaLiveInviteLogin');
    var storeSel = document.getElementById('uaLiveInviteStore');
    if (loginSel) loginSel.value = demo.loggedIn || 'yes';
    if (storeSel) storeSel.value = demo.storeStatus || 'enabled';
    var apply = document.getElementById('uaLiveInviteApply');
    if (apply) {
      apply.addEventListener('click', function () {
        setDemo({
          loggedIn: (loginSel && loginSel.value) || 'yes',
          storeStatus: (storeSel && storeSel.value) || 'enabled'
        });
        var logged = (loginSel && loginSel.value) === 'yes';
        var sess = Object.assign({}, readJson(SESSION_KEY, {}), {
          loggedIn: logged,
          skipped: !logged,
          phone: '13800002211',
          nickname: '小程序用户A'
        });
        writeJson(SESSION_KEY, sess);
        global.location.reload();
      });
    }
  }

  function init() {
    captureFromUrl();
    syncUrlFromPayload();
    interceptLinks();
    mountDemoPanel();
    gateLiveRoomIfNeeded();
    if (hasInvite() && isLoggedIn()) consumeLanding();
    flushToast();
  }

  global.UaLiveInvite = {
    captureFromUrl: captureFromUrl,
    consumeLanding: consumeLanding,
    applyBindAfterLogin: applyBindAfterLogin,
    appendToUrl: appendToUrl,
    promotedPage: promotedPage,
    guestLandingPage: guestLandingPage,
    hasInvite: hasInvite,
    shouldDeferBind: function () {
      return hasInvite() && !isLoggedIn();
    },
    flushToast: flushToast,
    isLoggedIn: isLoggedIn,
    DISABLED_TIP: DISABLED_TIP
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
