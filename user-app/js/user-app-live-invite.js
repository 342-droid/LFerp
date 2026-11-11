/**
 * C 端 · 门店/店员直播分享
 * - URL 二维码（非微信官方小程序码）统一解析；小程序入口与 App 扫一扫互通演示
 * - 门店会员关系与当前自提门店分离：多店并存、同店幂等、不重置首次绑定时间
 * - 场次可用性先校验；需会员身份的权限在入会后复验
 * - 停用分享门店：按用户已有关系分支回退/保留，不新增停用店会员关系（仅直播分享入口）
 * - App 唤起/下载/安装后自动恢复：桥接页为演示；自动恢复标为外部依赖未完成
 */
(function (global) {
  'use strict';

  var PAYLOAD_KEY = 'ua_live_invite_v1';
  var DEMO_KEY = 'ua_live_invite_demo_v1';
  var TOAST_KEY = 'ua_live_invite_toast_v1';
  var PROGRESS_KEY = 'ua_live_invite_progress_v1';
  var MEMBER_KEY = 'ua_store_membership_v1';
  var BIND_KEY = 'ua_store_bind_v1';
  var BIND_LOG_KEY = 'mdm_member_store_bind_log_v1';
  var SESSION_KEY = 'ua_user_session_v1';
  var BLOCK_KEY = 'ua_live_invite_block_v1';

  var TIP_SHARE_DISABLED_DEFAULT = '分享门店已停业，已自动绑定默认门店';
  var TIP_SHARE_DISABLED_KEEP = '分享门店已停业，已保留当前门店';
  var TIP_NO_ENTRY = '暂无法进入，请稍后再试';
  var TIP_OPEN_FAIL = '未能打开 App。已安装请重试，未安装请下载安装。';
  var LIVE_HOME = 'home.html';

  var LEGACY_ID_ALIAS = {
    'ONS-CENTER-01': 'HGH00002',
    'ONS-XIXI-SOUTH': 'BJS00001',
    'ONS-JIANGCUN': 'TSN00001',
    ONS303445581201: 'HGH00002'
  };

  var STORE_META = {
    HGH00002: {
      name: '中心店01',
      region: '浙江省杭州市西湖区',
      addr: '杭州市西湖区绿城西溪世纪中心1号楼'
    },
    BJS00001: {
      name: '测试通知',
      region: '北京市东城区',
      addr: '北京市东城区地下车库'
    },
    TSN00001: {
      name: '111',
      region: '天津市河东区',
      addr: '天津市河东区长三角珠宝产业园A3栋'
    },
    SHA00001: {
      name: 'DDD',
      region: '上海市浦东新区',
      addr: '上海市浦东新区张江路88号'
    },
    HGH00001: {
      name: '张三',
      region: '浙江省杭州市余杭区',
      addr: '杭州市余杭区文一西路969号'
    }
  };

  /** 演示场次目录（原型校验用，非真实接口） */
  var SESSION_CATALOG = {
    'sess-live-01': {
      id: 'sess-live-01',
      name: '9.4 晚间生鲜专场',
      status: 'live',
      liveType: 'OFFICIAL',
      storeIds: [],
      cover: '../assets/shop/live-hero.svg',
      needMemberWatch: false
    },
    'sess-live-02': {
      id: 'sess-live-02',
      name: '9.4 门店会员闪购',
      status: 'live',
      liveType: 'TARGETED',
      storeIds: ['HGH00002'],
      cover: '../assets/shop/banner-featured.svg',
      needMemberWatch: true
    },
    'sess-up-01': {
      id: 'sess-up-01',
      name: '9.5 产地直采早市',
      status: 'upcoming',
      liveType: 'OFFICIAL',
      storeIds: [],
      cover: '../assets/shop/cat-veg.svg',
      needMemberWatch: false
    },
    'sess-end-01': {
      id: 'sess-end-01',
      name: '9.3 会员日闪购',
      status: 'ended',
      liveType: 'TARGETED',
      storeIds: ['HGH00002'],
      cover: '../assets/shop/product-dumpling.svg',
      needMemberWatch: false
    },
    'sess-deleted-01': {
      id: 'sess-deleted-01',
      name: '已删除场次',
      status: 'deleted',
      liveType: 'OFFICIAL',
      storeIds: [],
      cover: '../assets/shop/live-hero.svg',
      needMemberWatch: false
    },
    'sess-invalid-01': {
      id: 'sess-invalid-01',
      name: '已失效场次',
      status: 'invalid',
      liveType: 'OFFICIAL',
      storeIds: [],
      cover: '../assets/shop/live-hero.svg',
      needMemberWatch: false
    },
    'sess-deny-01': {
      id: 'sess-deny-01',
      name: '无权观看演示场',
      status: 'live',
      liveType: 'TARGETED',
      storeIds: ['HGH00002'],
      cover: '../assets/shop/live-hero.svg',
      needMemberWatch: true,
      forceDenyAfterMember: true
    }
  };

  var DEFAULT_DEMO = {
    loggedIn: 'yes',
    storeStatus: 'enabled',
    sessionOverride: 'from_payload',
    access: 'ok',
    memberCase: 'none',
    network: 'ok',
    appInstalled: 'yes',
    defaultStoreOk: 'yes'
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

  function resolveStoreId(id) {
    var sid = String(id || '').trim();
    return LEGACY_ID_ALIAS[sid] || sid;
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

  function clearProgress() {
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function readProgress() {
    return readJson(PROGRESS_KEY, null);
  }

  function writeProgress(data) {
    writeJson(PROGRESS_KEY, data);
  }

  function getDemo() {
    return Object.assign({}, DEFAULT_DEMO, readJson(DEMO_KEY, {}));
  }

  function setDemo(patch) {
    var next = Object.assign(getDemo(), patch || {});
    writeJson(DEMO_KEY, next);
    clearProgress();
    try {
      localStorage.removeItem(BLOCK_KEY);
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

  function memberId() {
    return 'U10001';
  }

  function readMembershipMap() {
    return readJson(MEMBER_KEY, {});
  }

  function writeMembershipMap(map) {
    writeJson(MEMBER_KEY, map);
  }

  function listMemberStores(mid) {
    var map = readMembershipMap();
    var row = map[mid || memberId()] || {};
    return row && typeof row === 'object' ? row : {};
  }

  function hasAnyMembership(mid) {
    return Object.keys(listMemberStores(mid)).length > 0;
  }

  function hasMembership(storeId, mid) {
    var sid = resolveStoreId(storeId);
    return !!listMemberStores(mid)[sid];
  }

  /**
   * 幂等写入门店会员关系：已存在不重置 firstBoundAt
   * @returns {{ created: boolean, firstBoundAt: string, skipped: boolean }}
   */
  function ensureMembership(storeId, meta) {
    var sid = resolveStoreId(storeId);
    if (!sid) return { created: false, skipped: true, firstBoundAt: '' };
    var mid = memberId();
    var map = readMembershipMap();
    if (!map[mid] || typeof map[mid] !== 'object') map[mid] = {};
    var existing = map[mid][sid];
    if (existing && existing.firstBoundAt) {
      return { created: false, skipped: true, firstBoundAt: existing.firstBoundAt };
    }
    var now = formatNow();
    map[mid][sid] = {
      firstBoundAt: now,
      way: (meta && meta.way) || '直播分享',
      inviter: (meta && meta.inviter) || '',
      inviteName: (meta && meta.inviteName) || '',
      invitePhone: (meta && meta.invitePhone) || '',
      staffId: (meta && meta.staffId) || ''
    };
    writeMembershipMap(map);
    return { created: true, skipped: false, firstBoundAt: now };
  }

  function isStoreDisabled(storeId) {
    var sid = resolveStoreId(storeId);
    var demo = getDemo();
    if (demo.storeStatus === 'disabled' && sid === resolveStoreId((readSessionPayload() || {}).storeId)) {
      return true;
    }
    if (global.UaStoreSwitch && global.UaStoreSwitch.CATALOG) {
      var cat = null;
      for (var i = 0; i < global.UaStoreSwitch.CATALOG.length; i++) {
        if (global.UaStoreSwitch.CATALOG[i].id === sid) {
          cat = global.UaStoreSwitch.CATALOG[i];
          break;
        }
      }
      if (cat && global.MdmArchiveEnableDisable && typeof global.MdmArchiveEnableDisable.isStoreDisabledByMeta === 'function') {
        return !!global.MdmArchiveEnableDisable.isStoreDisabledByMeta({
          id: cat.id,
          storeId: cat.id,
          name: cat.name
        });
      }
    }
    try {
      var map = JSON.parse(localStorage.getItem('lferp_store_disabled_v1') || '{}') || {};
      if (map[sid] && map[sid].disabled) return true;
      var meta = STORE_META[sid];
      if (meta && map[meta.name] && map[meta.name].disabled) return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function defaultStoreId() {
    if (global.UaStoreSwitch && typeof global.UaStoreSwitch.getSystemDefaultStore === 'function') {
      var def = global.UaStoreSwitch.getSystemDefaultStore();
      if (def && def.id) return resolveStoreId(def.id);
    }
    if (global.MdmSystemDefaultStore && typeof global.MdmSystemDefaultStore.readDefault === 'function') {
      var fromB = global.MdmSystemDefaultStore.readDefault();
      if (fromB && fromB.storeId) return resolveStoreId(fromB.storeId);
    }
    return 'HGH00002';
  }

  function isDefaultStoreAvailable() {
    var demo = getDemo();
    if (demo.defaultStoreOk === 'no') return false;
    return !isStoreDisabled(defaultStoreId());
  }

  function setPickupStore(storeId) {
    var sid = resolveStoreId(storeId);
    if (!sid) return;
    if (global.UaStoreSwitch && typeof global.UaStoreSwitch.markVisited === 'function') {
      global.UaStoreSwitch.markVisited(sid);
      return;
    }
    var bind = Object.assign(
      { confirmed: false, currentStoreId: '', scannedIds: [], visitAt: {} },
      readJson(BIND_KEY, {})
    );
    if (!Array.isArray(bind.scannedIds)) bind.scannedIds = [];
    if (!bind.visitAt || typeof bind.visitAt !== 'object') bind.visitAt = {};
    var defId = defaultStoreId();
    if (sid && sid !== defId && bind.scannedIds.indexOf(sid) < 0) {
      bind.scannedIds.push(sid);
    }
    bind.currentStoreId = sid;
    bind.visitAt[sid] = Date.now();
    bind.confirmed = true;
    writeJson(BIND_KEY, bind);
  }

  function currentPickupId() {
    if (global.UaStoreSwitch && typeof global.UaStoreSwitch.readBind === 'function') {
      var bind = global.UaStoreSwitch.readBind();
      if (global.UaStoreSwitch.resolveCurrentStore) {
        var cur = global.UaStoreSwitch.resolveCurrentStore(bind);
        if (cur && cur.id) return resolveStoreId(cur.id);
      }
      if (bind && bind.currentStoreId) return resolveStoreId(bind.currentStoreId);
    }
    var raw = readJson(BIND_KEY, null);
    return raw && raw.currentStoreId ? resolveStoreId(raw.currentStoreId) : '';
  }

  function enabledMemberStoreIds() {
    var ids = Object.keys(listMemberStores());
    return ids.filter(function (id) {
      return !isStoreDisabled(id);
    });
  }

  function inviterText(payload) {
    var name = (payload && payload.inviteName) || '';
    if (!name) return '';
    var phone = maskPhone((payload && payload.invitePhone) || '');
    return phone ? name + '（' + phone + '）' : name;
  }

  function appendBindLog(payload, storeId, way) {
    var sid = resolveStoreId(storeId);
    var meta = STORE_META[sid] || { name: sid, region: '—', addr: '—' };
    var rec = {
      type: '绑定门店',
      storeName: meta.name || sid,
      region: meta.region || '—',
      addr: meta.addr || '—',
      way: way || '直播分享',
      time: formatNow(),
      watch: '—',
      amount: '—',
      orders: '—',
      refundAmt: '—',
      refundCnt: '—',
      inviter: inviterText(payload) || '—'
    };
    var map = readJson(BIND_LOG_KEY, {});
    var mid = memberId();
    var rows = map[mid];
    if (!Array.isArray(rows)) rows = [];
    rows.unshift(rec);
    map[mid] = rows;
    writeJson(BIND_LOG_KEY, map);
  }

  function showToast(msg) {
    if (!msg) return;
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
      }, 2200);
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
    }, 2200);
  }

  function queueToast(msg) {
    try {
      sessionStorage.setItem(TOAST_KEY, msg || '');
    } catch (e) {
      /* ignore */
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
      }, 280);
    }
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

  function parseShareSearch(search) {
    var params = new URLSearchParams(search || '');
    var storeId = params.get('storeId') || params.get('store') || '';
    var staffId = params.get('staffId') || params.get('inviter') || params.get('inviteId') || '';
    var inviteName = params.get('inviteName') || '';
    var invitePhone = params.get('invitePhone') || '';
    var sessionId = params.get('sessionId') || '';
    var ch = params.get('ch') || params.get('channel') || '';
    if (!storeId && !sessionId) return null;
    return {
      storeId: resolveStoreId(storeId),
      staffId: staffId,
      inviteName: inviteName,
      invitePhone: invitePhone,
      sessionId: sessionId,
      ch: ch === 'app' ? 'app' : ch === 'mp' ? 'mp' : ch || 'mp',
      capturedAt: Date.now()
    };
  }

  /** 从任意扫码文本解析直播分享（URL 二维码，非官方小程序码） */
  function parseSharePayloadText(raw) {
    var text = String(raw || '').trim();
    if (!text) return null;
    if (text.indexOf('lengfeng-live:') === 0) {
      try {
        var body = text.slice('lengfeng-live:'.length);
        var json = JSON.parse(decodeURIComponent(body));
        if (!json || !json.storeId) return null;
        return {
          storeId: resolveStoreId(json.storeId),
          staffId: json.staffId || '',
          inviteName: json.inviteName || '',
          invitePhone: json.invitePhone || '',
          sessionId: json.sessionId || '',
          ch: json.ch === 'app' ? 'app' : 'mp',
          capturedAt: Date.now()
        };
      } catch (e) {
        return null;
      }
    }
    try {
      var url = new URL(text, global.location.href);
      var path = String(url.pathname || '');
      if (
        path.indexOf('live-share') >= 0 ||
        path.indexOf('live-room') >= 0 ||
        url.searchParams.get('sessionId') ||
        (url.searchParams.get('storeId') && url.searchParams.get('ch'))
      ) {
        return parseShareSearch(url.search);
      }
    } catch (e2) {
      /* ignore */
    }
    return null;
  }

  function buildShareUrl(opts) {
    opts = opts || {};
    var ch = opts.ch === 'app' ? 'app' : 'mp';
    var url = new URL('live-share.html', global.location.href);
    if (String(global.location.pathname || '').indexOf('/store-app/') >= 0) {
      url = new URL('../../user-app/h5/live-share.html', global.location.href);
    }
    url.searchParams.set('ch', ch);
    if (opts.sessionId) url.searchParams.set('sessionId', opts.sessionId);
    if (opts.storeId) url.searchParams.set('storeId', resolveStoreId(opts.storeId));
    if (opts.staffId) url.searchParams.set('staffId', opts.staffId);
    if (opts.inviteName) url.searchParams.set('inviteName', opts.inviteName);
    if (opts.invitePhone) url.searchParams.set('invitePhone', opts.invitePhone);
    return url.href;
  }

  function captureFromUrl() {
    var parsed = parseShareSearch(global.location.search || '');
    if (!parsed || (!parsed.storeId && !parsed.sessionId)) {
      return readSessionPayload();
    }
    if (!parsed.storeId) {
      var existing = readSessionPayload();
      if (existing && existing.storeId) parsed.storeId = existing.storeId;
    }
    writePayload(parsed);
    return parsed;
  }

  function hasInvite() {
    var p = readSessionPayload();
    return !!(p && p.storeId && p.sessionId);
  }

  function resolveSession(payload) {
    var demo = getDemo();
    var sid = (payload && payload.sessionId) || '';
    if (demo.sessionOverride && demo.sessionOverride !== 'from_payload') {
      sid = demo.sessionOverride;
    }
    var base = SESSION_CATALOG[sid] || {
      id: sid,
      name: sid || '未知场次',
      status: sid ? 'live' : 'deleted',
      liveType: 'OFFICIAL',
      storeIds: [],
      cover: '../assets/shop/live-hero.svg',
      needMemberWatch: false
    };
    var sess = Object.assign({}, base);
    if (demo.access === 'no_permission') {
      sess.forceDenyBeforeMember = true;
    }
    if (demo.access === 'no_scope') {
      sess.forceNoScope = true;
    }
    return sess;
  }

  function sessionBlockReason(sess) {
    if (!sess || !sess.id) return { code: 'deleted', message: '直播场次不存在或已删除', retryable: false };
    if (sess.status === 'deleted') return { code: 'deleted', message: '直播场次已删除', retryable: false };
    if (sess.status === 'invalid') return { code: 'invalid', message: '直播场次已失效', retryable: false };
    if (sess.status === 'ended') return { code: 'ended', message: '直播场次已结束', retryable: false };
    if (sess.forceDenyBeforeMember) {
      return { code: 'no_permission', message: '暂无该场次观看权限', retryable: false };
    }
    return null;
  }

  function storeInScope(sess, storeId) {
    if (!sess) return false;
    if (sess.forceNoScope) return false;
    var sid = resolveStoreId(storeId);
    if (sess.liveType === 'OFFICIAL') return true;
    var ids = (sess.storeIds || []).map(resolveStoreId);
    if (sess.liveType === 'TARGETED' || sess.liveType === 'REGION') {
      if (!ids.length) return true;
      return ids.indexOf(sid) >= 0;
    }
    return true;
  }

  function watchAllowed(sess, storeId, afterMember) {
    if (!sess) return false;
    if (!storeInScope(sess, storeId)) return false;
    if (sess.forceDenyAfterMember && afterMember) return false;
    if (sess.needMemberWatch && afterMember && !hasMembership(storeId)) return false;
    return true;
  }

  function seedMembershipDemo() {
    var demo = getDemo();
    var mid = memberId();
    var map = readMembershipMap();
    if (demo.memberCase === 'none') {
      map[mid] = {};
      writeMembershipMap(map);
      if (global.UaStoreSwitch && typeof global.UaStoreSwitch.readBind === 'function') {
        var bind = global.UaStoreSwitch.readBind();
        bind.scannedIds = [];
        bind.currentStoreId = defaultStoreId();
        bind.confirmed = true;
        writeJson(BIND_KEY, bind);
      }
      return;
    }
    if (demo.memberCase === 'same') {
      var shareId = resolveStoreId((readSessionPayload() || {}).storeId) || 'HGH00002';
      map[mid] = {};
      map[mid][shareId] = {
        firstBoundAt: '2026-01-01 10:00:00',
        way: '拉新',
        inviter: '—',
        inviteName: '',
        invitePhone: '',
        staffId: ''
      };
      writeMembershipMap(map);
      setPickupStore(shareId);
      return;
    }
    if (demo.memberCase === 'other') {
      map[mid] = {};
      map[mid].BJS00001 = {
        firstBoundAt: '2026-02-01 10:00:00',
        way: '拉新',
        inviter: '—',
        inviteName: '',
        invitePhone: '',
        staffId: ''
      };
      writeMembershipMap(map);
      setPickupStore('BJS00001');
    }
  }

  function syncUrlFromPayload() {
    var payload = readSessionPayload();
    if (!payload || !payload.storeId) return;
    try {
      var url = new URL(global.location.href);
      var keys = ['storeId', 'staffId', 'inviteName', 'invitePhone', 'sessionId', 'ch'];
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

  function appendToUrl(href) {
    var payload = readSessionPayload();
    if (!payload || !payload.storeId) return href;
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return href;
    if (/^(tel:|mailto:)/i.test(href)) return href;
    try {
      var url = new URL(href, global.location.href);
      if (url.origin !== global.location.origin) return href;
      if (!url.searchParams.get('storeId')) url.searchParams.set('storeId', payload.storeId);
      if (payload.staffId && !url.searchParams.get('staffId')) url.searchParams.set('staffId', payload.staffId);
      if (payload.inviteName && !url.searchParams.get('inviteName')) {
        url.searchParams.set('inviteName', payload.inviteName);
      }
      if (payload.invitePhone && !url.searchParams.get('invitePhone')) {
        url.searchParams.set('invitePhone', payload.invitePhone);
      }
      if (payload.sessionId && !url.searchParams.get('sessionId')) {
        url.searchParams.set('sessionId', payload.sessionId);
      }
      if (payload.ch && !url.searchParams.get('ch')) url.searchParams.set('ch', payload.ch);
      if (href.indexOf('http') === 0) return url.href;
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return href;
    }
  }

  function guestLandingPage() {
    return appendToUrl(LIVE_HOME);
  }

  function promotedPage() {
    var payload = readSessionPayload();
    if (!payload || !payload.sessionId) return '';
    return appendToUrl('live-room.html?sessionId=' + encodeURIComponent(payload.sessionId));
  }

  function writeBlock(info) {
    writeJson(BLOCK_KEY, info || {});
  }

  function showBlockPage(info) {
    writeBlock(info);
    var path = String(global.location.pathname || '');
    if (path.indexOf('live-share') >= 0) {
      renderShareBlock(info);
      return;
    }
    global.location.replace(
      'live-share.html?view=block&reason=' + encodeURIComponent(info.code || 'blocked')
    );
  }

  function renderShareBlock(info) {
    var host = document.getElementById('liveShareView');
    if (!host) return;
    var retryable = !!(info && info.retryable);
    host.innerHTML =
      '<div class="ua-live-share-card">' +
      '<h1 class="ua-live-share-card__title">' +
      escapeHtml((info && info.title) || '无法进入直播') +
      '</h1>' +
      '<p class="ua-live-share-card__desc">' +
      escapeHtml((info && info.message) || '当前分享不可用') +
      '</p>' +
      '<div class="ua-live-share-card__actions">' +
      (retryable
        ? '<button type="button" class="ua-live-share-card__btn ua-live-share-card__btn--primary" id="uaLiveShareRetry">重试</button>'
        : '') +
      '<a class="ua-live-share-card__btn" href="' +
      LIVE_HOME +
      '">返回直播首页</a>' +
      '</div>' +
      '<p class="ua-live-share-card__note">临时拦截：不新增会员关系、不切换自提门店；已有关系与当前店保持不变。</p>' +
      '</div>';
    var retry = document.getElementById('uaLiveShareRetry');
    if (retry) {
      retry.addEventListener('click', function () {
        clearProgress();
        runShareFlow({ force: true });
      });
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyUpcomingUi(sess) {
    if (!sess || sess.status !== 'upcoming') return;
    var badge = document.querySelector('.ua-live-room__live');
    if (badge) {
      badge.textContent = '直播即将开始';
      badge.classList.add('is-upcoming');
    }
    var stage = document.querySelector('.ua-live-room__stage');
    if (stage && sess.cover) {
      stage.style.backgroundImage = 'url("' + sess.cover + '")';
      stage.style.backgroundSize = 'cover';
      stage.style.backgroundPosition = 'center';
    }
    var name = document.querySelector('.ua-live-room__name');
    if (name && sess.name) name.textContent = sess.name;
  }

  /**
   * 停用分享门店时的自提/会员分支（不新增停用店会员关系）
   */
  function resolveStoreWhenShareDisabled(payload, progress) {
    var defId = defaultStoreId();
    if (!hasAnyMembership()) {
      if (!isDefaultStoreAvailable()) {
        return { ok: false, code: 'no_entry', message: TIP_NO_ENTRY };
      }
      if (!progress.membershipDone) {
        var created = ensureMembership(defId, {
          way: '直播分享',
          inviter: inviterText(payload),
          inviteName: payload.inviteName,
          invitePhone: payload.invitePhone,
          staffId: payload.staffId
        });
        if (created.created) appendBindLog(payload, defId, '直播分享');
        progress.membershipDone = true;
      }
      if (!progress.pickupDone) {
        setPickupStore(defId);
        progress.pickupDone = true;
      }
      queueToast(TIP_SHARE_DISABLED_DEFAULT);
      return { ok: true, storeId: defId, tip: TIP_SHARE_DISABLED_DEFAULT };
    }

    var cur = currentPickupId();
    if (cur && !isStoreDisabled(cur)) {
      queueToast(TIP_SHARE_DISABLED_KEEP);
      progress.membershipDone = true;
      progress.pickupDone = true;
      return { ok: true, storeId: cur, tip: TIP_SHARE_DISABLED_KEEP };
    }

    var enabled = enabledMemberStoreIds();
    if (enabled.length) {
      /* 复用切店 resolve；无把握时引导用户选择，不擅自指定 */
      var picked = '';
      if (global.UaStoreSwitch && typeof global.UaStoreSwitch.resolveCurrentStore === 'function') {
        var resolved = global.UaStoreSwitch.resolveCurrentStore(global.UaStoreSwitch.readBind());
        if (resolved && resolved.id && enabled.indexOf(resolveStoreId(resolved.id)) >= 0) {
          picked = resolveStoreId(resolved.id);
        }
      }
      if (!picked) {
        return {
          ok: false,
          code: 'need_select_store',
          message: '当前门店不可用，请选择其他已绑定门店',
          selectHref: 'switch-address.html?from=live-share.html'
        };
      }
      if (!progress.pickupDone) {
        setPickupStore(picked);
        progress.pickupDone = true;
      }
      progress.membershipDone = true;
      return { ok: true, storeId: picked };
    }

    if (!isDefaultStoreAvailable()) {
      return { ok: false, code: 'no_entry', message: TIP_NO_ENTRY };
    }
    if (!progress.membershipDone) {
      var createdDef = ensureMembership(defId, {
        way: '直播分享',
        inviter: inviterText(payload),
        inviteName: payload.inviteName,
        invitePhone: payload.invitePhone,
        staffId: payload.staffId
      });
      if (createdDef.created) appendBindLog(payload, defId, '直播分享');
      progress.membershipDone = true;
    }
    if (!progress.pickupDone) {
      setPickupStore(defId);
      progress.pickupDone = true;
    }
    queueToast(TIP_SHARE_DISABLED_DEFAULT);
    return { ok: true, storeId: defId, tip: TIP_SHARE_DISABLED_DEFAULT };
  }

  function resolveStoreWhenShareEnabled(payload, progress) {
    var shareId = resolveStoreId(payload.storeId);
    if (!progress.membershipDone) {
      var created = ensureMembership(shareId, {
        way: '直播分享',
        inviter: inviterText(payload),
        inviteName: payload.inviteName,
        invitePhone: payload.invitePhone,
        staffId: payload.staffId
      });
      if (created.created) appendBindLog(payload, shareId, '直播分享');
      progress.membershipDone = true;
      progress.boundShare = true;
    }
    if (!progress.pickupDone) {
      setPickupStore(shareId);
      progress.pickupDone = true;
    }
    return { ok: true, storeId: shareId };
  }

  function payloadSig(payload, sess) {
    return [payload.storeId, payload.sessionId, payload.staffId || '', (sess && sess.status) || ''].join('|');
  }

  /**
   * 主流程：场次可用性 →（登录）→ 入会/切店 → 以最终门店复验分发与观看权限 → 进原场次
   */
  function runShareFlow(options) {
    options = options || {};
    var payload = options.payload || captureFromUrl() || readSessionPayload();
    if (!payload || !payload.storeId || !payload.sessionId) {
      return { ok: false, code: 'no_payload' };
    }
    writePayload(payload);

    var demo = getDemo();
    if (demo.network === 'fail') {
      showBlockPage({
        code: 'network',
        title: '网络异常',
        message: '网络失败，请重试',
        retryable: true
      });
      return { ok: false, code: 'network', retryable: true };
    }

    var sess = resolveSession(payload);
    var early = sessionBlockReason(sess);
    if (early) {
      showBlockPage({
        code: early.code,
        title: '无法进入该场直播',
        message: early.message,
        retryable: false
      });
      return { ok: false, code: early.code };
    }

    if (!isLoggedIn()) {
      if (options.skipLoginGate) return { ok: false, code: 'need_login', deferred: true };
      var next = 'live-share.html' + (global.location.search || '');
      if (String(global.location.pathname || '').indexOf('live-room') >= 0) {
        next = 'live-room.html' + (global.location.search || '');
      }
      global.location.replace(appendToUrl('login.html?next=' + encodeURIComponent(next)));
      return { ok: false, code: 'need_login' };
    }

    var progress = readProgress();
    var sig = payloadSig(payload, sess);
    if (!progress || progress.sig !== sig) {
      progress = { sig: sig, sessionChecked: true, membershipDone: false, pickupDone: false, entered: false };
    } else {
      progress.sessionChecked = true;
    }

    var shareDisabled = isStoreDisabled(payload.storeId);
    var storeResult = shareDisabled
      ? resolveStoreWhenShareDisabled(payload, progress)
      : resolveStoreWhenShareEnabled(payload, progress);

    writeProgress(progress);

    if (!storeResult.ok) {
      if (storeResult.code === 'need_select_store') {
        queueToast(storeResult.message);
        global.location.replace(storeResult.selectHref);
        return storeResult;
      }
      showBlockPage({
        code: storeResult.code || 'no_entry',
        title: '暂无法进入',
        message: storeResult.message || TIP_NO_ENTRY,
        retryable: false
      });
      return storeResult;
    }

    var finalStore = storeResult.storeId;
    var afterMember = true;
    if (!watchAllowed(sess, finalStore, afterMember)) {
      queueToast('当前门店无权观看该场次，已为你打开直播首页');
      writeProgress(Object.assign({}, progress, { entered: false, accessDenied: true }));
      global.location.replace(appendToUrl(LIVE_HOME));
      return { ok: false, code: 'no_access_final', storeId: finalStore };
    }

    writeProgress(Object.assign({}, progress, { entered: true, finalStoreId: finalStore }));
    var target = appendToUrl(
      'live-room.html?sessionId=' + encodeURIComponent(payload.sessionId) + '&liveStatus=' + encodeURIComponent(sess.status)
    );
    var path = String(global.location.pathname || '');
    if (path.indexOf('live-room') >= 0) {
      applyUpcomingUi(sess);
      flushToast();
      return { ok: true, storeId: finalStore, stayed: true };
    }
    global.location.replace(target);
    return { ok: true, storeId: finalStore };
  }

  function gateLiveRoomIfNeeded() {
    var path = String(global.location.pathname || '');
    if (path.indexOf('live-room') < 0) return;
    if (!hasInvite()) return;
    if (isLoggedIn()) return;
    var next = 'live-room.html' + (global.location.search || '');
    global.location.replace(appendToUrl('login.html?next=' + encodeURIComponent(next)));
  }

  function consumeLanding() {
    var payload = captureFromUrl();
    if (!payload || !payload.storeId) return false;
    if (!isLoggedIn()) return true;
    runShareFlow({ payload: payload, skipLoginGate: false });
    return true;
  }

  function applyBindAfterLogin() {
    var payload = captureFromUrl() || readSessionPayload();
    if (!payload || !payload.storeId) return;
    /* 登录成功后由 redirectAfterAuth 跳 promotedPage；此处只完成可安全执行的校验准备 */
    writePayload(payload);
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

  function isWeChatUa() {
    return /MicroMessenger/i.test(navigator.userAgent || '');
  }

  function detectClientHint() {
    var params = new URLSearchParams(global.location.search || '');
    var client = params.get('client') || '';
    if (client === 'app' || client === 'mp') return client;
    var demo = getDemo();
    if (demo.forceClient === 'app' || demo.forceClient === 'mp') return demo.forceClient;
    if (isWeChatUa()) return 'wechat';
    return 'browser';
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
      '<label class="ua-rg-demo__row">登录态<select id="uaLiveInviteLogin"><option value="yes">已登录</option><option value="no">未登录</option></select></label>' +
      '<label class="ua-rg-demo__row">分享门店<select id="uaLiveInviteStore"><option value="enabled">已启用</option><option value="disabled">已停用</option></select></label>' +
      '<label class="ua-rg-demo__row">会员关系<select id="uaLiveInviteMember"><option value="none">未绑定</option><option value="same">已绑同店</option><option value="other">已绑他店</option></select></label>' +
      '<label class="ua-rg-demo__row">场次<select id="uaLiveInviteSession"><option value="from_payload">跟分享</option><option value="sess-live-01">直播中</option><option value="sess-up-01">未开始</option><option value="sess-end-01">已结束</option><option value="sess-deleted-01">已删除</option><option value="sess-invalid-01">已失效</option><option value="sess-deny-01">无权(入会后)</option></select></label>' +
      '<label class="ua-rg-demo__row">权限<select id="uaLiveInviteAccess"><option value="ok">通过</option><option value="no_scope">分发不符</option><option value="no_permission">无权(先拦)</option></select></label>' +
      '<label class="ua-rg-demo__row">网络<select id="uaLiveInviteNet"><option value="ok">正常</option><option value="fail">失败可重试</option></select></label>' +
      '<label class="ua-rg-demo__row">默认店<select id="uaLiveInviteDef"><option value="yes">可用</option><option value="no">不可用</option></select></label>' +
      '<label class="ua-rg-demo__row">App已装<select id="uaLiveInviteApp"><option value="yes">已安装</option><option value="no">未安装</option></select></label>' +
      '<p class="ua-rg-demo__hint" style="margin:0 0 6px;color:#999;font-size:10px;line-height:1.35">码为 URL 二维码，非微信官方小程序码；安装后自动恢复未完成</p>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveInviteApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var map = {
      uaLiveInviteLogin: 'loggedIn',
      uaLiveInviteStore: 'storeStatus',
      uaLiveInviteMember: 'memberCase',
      uaLiveInviteSession: 'sessionOverride',
      uaLiveInviteAccess: 'access',
      uaLiveInviteNet: 'network',
      uaLiveInviteDef: 'defaultStoreOk',
      uaLiveInviteApp: 'appInstalled'
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = demo[map[id]] || DEFAULT_DEMO[map[id]];
    });
    var apply = document.getElementById('uaLiveInviteApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var patch = {};
        Object.keys(map).forEach(function (id) {
          var el = document.getElementById(id);
          patch[map[id]] = (el && el.value) || DEFAULT_DEMO[map[id]];
        });
        setDemo(patch);
        var logged = patch.loggedIn === 'yes';
        writeJson(
          SESSION_KEY,
          Object.assign({}, readJson(SESSION_KEY, {}), {
            loggedIn: logged,
            skipped: !logged,
            phone: '13800002211',
            nickname: '小程序用户A'
          })
        );
        seedMembershipDemo();
        if (patch.storeStatus === 'disabled') {
          var sid = resolveStoreId((readSessionPayload() || {}).storeId) || 'HGH00002';
          var meta = STORE_META[sid] || { name: sid };
          try {
            var dis = {};
            dis[sid] = { id: sid, name: meta.name, disabled: true };
            dis[meta.name] = dis[sid];
            localStorage.setItem('lferp_store_disabled_v1', JSON.stringify(dis));
          } catch (e) {
            /* ignore */
          }
        }
        global.location.reload();
      });
    }
  }

  function initLiveSharePage() {
    captureFromUrl();
    mountDemoPanel();
    var payload = readSessionPayload();
    var params = new URLSearchParams(global.location.search || '');
    if (params.get('view') === 'block') {
      var block = readJson(BLOCK_KEY, {
        code: params.get('reason') || 'blocked',
        title: '无法进入该场直播',
        message: '分享目标不可用',
        retryable: false
      });
      renderShareBlock(block);
      return;
    }
    if (!payload || !payload.storeId) {
      renderShareBlock({
        code: 'no_payload',
        title: '分享无效',
        message: '未识别到有效的直播分享信息',
        retryable: false
      });
      return;
    }

    var ch = payload.ch || 'mp';
    var client = detectClientHint();
    var host = document.getElementById('liveShareView');

    if (ch === 'app' && client === 'wechat') {
      if (host) {
        host.innerHTML =
          '<div class="ua-live-share-card">' +
          '<h1 class="ua-live-share-card__title">打开冷丰 APP</h1>' +
          '<p class="ua-live-share-card__desc">请点击右上角 ···，选择「在浏览器中打开」，以继续直播分享流程。</p>' +
          '<p class="ua-live-share-card__note">微信内无法直接唤起；分享信息已保留。此页为 App 分享码中间页（演示）。</p>' +
          '</div>';
      }
      return;
    }

    if (ch === 'app' && client === 'browser') {
      renderAppBridge(host, payload);
      return;
    }

    /* mp 码在小程序/App 扫一扫，或 App 码已在 App 内：走主流程 */
    runShareFlow({ payload: payload });
  }

  function renderAppBridge(host, payload) {
    if (!host) return;
    var demo = getDemo();
    var installed = demo.appInstalled !== 'no';
    host.innerHTML =
      '<div class="ua-live-share-card">' +
      '<h1 class="ua-live-share-card__title">冷丰鲜选直播分享</h1>' +
      '<p class="ua-live-share-card__desc">绑定分享门店并进入对应直播场次。请使用冷丰 APP 打开。</p>' +
      '<div class="ua-live-share-card__actions">' +
      '<button type="button" class="ua-live-share-card__btn ua-live-share-card__btn--primary" id="uaOpenAppBtn">打开 App</button>' +
      '<button type="button" class="ua-live-share-card__btn" id="uaDownloadAppBtn">下载 App</button>' +
      '</div>' +
      '<p class="ua-live-share-card__note" id="uaOpenAppTip" hidden></p>' +
      '<p class="ua-live-share-card__note">补救：返回本页再点「打开 App」，或在 App 内重新扫描原分享码。<br>「安装后首次打开自动恢复」依赖原生与国内应用市场，当前原型未完成，不能用本地缓存代替。</p>' +
      '<p class="ua-live-share-card__note">安卓下载为中国境内应用市场演示入口，不使用 Google Play。</p>' +
      '</div>';

    var tip = document.getElementById('uaOpenAppTip');
    var openBtn = document.getElementById('uaOpenAppBtn');
    var dlBtn = document.getElementById('uaDownloadAppBtn');
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        /* 一次唤起失败不能直接判定未安装 */
        if (!installed) {
          if (tip) {
            tip.hidden = false;
            tip.textContent = TIP_OPEN_FAIL;
          } else {
            showToast(TIP_OPEN_FAIL);
          }
          return;
        }
        /* 演示：已安装则带参进入 App 内流程 */
        var url = buildShareUrl(
          Object.assign({}, payload, { ch: 'app' })
        ).replace('live-share.html', 'live-share.html');
        try {
          var u = new URL(url);
          u.searchParams.set('client', 'app');
          global.location.href = u.pathname + u.search;
        } catch (e) {
          runShareFlow({ payload: Object.assign({}, payload, { ch: 'app' }) });
        }
      });
    }
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        showToast('演示：跳转国内应用市场下载（非 Google Play）。安装后自动恢复未完成。');
      });
    }
  }

  function init() {
    var path = String(global.location.pathname || '');
    var isUserApp = path.indexOf('/user-app/') >= 0 || !!document.querySelector('.user-app-body');
    if (!isUserApp) {
      /* 门店 APP 仅复用 buildShareUrl 等工具，不跑 C 端主流程 */
      return;
    }

    captureFromUrl();
    syncUrlFromPayload();
    interceptLinks();
    mountDemoPanel();

    if (path.indexOf('live-share') >= 0) {
      initLiveSharePage();
      return;
    }

    gateLiveRoomIfNeeded();
    var pathLive = path.indexOf('live-room') >= 0;
    var pathHome = path.indexOf('home') >= 0;
    if (hasInvite() && isLoggedIn()) {
      var progress = readProgress();
      var payload = readSessionPayload();
      var sess = resolveSession(payload);
      var sig = payloadSig(payload, sess);
      /* 仅在落地/直播页推进主流程；其他页只保留参数，避免反复强跳 */
      if (pathLive || path.indexOf('live-share') >= 0) {
        runShareFlow({ skipLoginGate: false });
      } else if (pathHome && (!progress || progress.sig !== sig || !progress.entered)) {
        runShareFlow({ skipLoginGate: false });
      } else {
        flushToast();
      }
    } else {
      flushToast();
    }

    if (pathLive && hasInvite()) {
      applyUpcomingUi(resolveSession(readSessionPayload()));
    }
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
    runShareFlow: runShareFlow,
    parseSharePayloadText: parseSharePayloadText,
    buildShareUrl: buildShareUrl,
    ensureMembership: ensureMembership,
    hasMembership: hasMembership,
    listMemberStores: listMemberStores,
    resolveStoreId: resolveStoreId,
    SESSION_CATALOG: SESSION_CATALOG,
    TIP_OPEN_FAIL: TIP_OPEN_FAIL,
    TIP_SHARE_DISABLED_DEFAULT: TIP_SHARE_DISABLED_DEFAULT,
    TIP_SHARE_DISABLED_KEEP: TIP_SHARE_DISABLED_KEEP,
    DISABLED_TIP: TIP_SHARE_DISABLED_DEFAULT
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
