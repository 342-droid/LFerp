/**
 * 用户 APP — 会员黑名单门禁（与 B 端 mdm_member_blacklist_v1 联动）
 *
 * 禁用功能（勾选 = 禁用该能力）：
 * - 禁止直播评论 → 发评论弹窗
 * - 观看直播 → 直播间不拉流 + 页内提示
 * - 下单 → 确认订单提交弹窗
 * - 访问页面 → 进入 C 端页弹窗并禁用操作
 *
 * 验收演示：
 * - 右下角「黑名单验收开关」面板（可多选禁用项，应用并刷新）
 * - URL：?blDemo=access|order|live|comment|all|off
 * - 也可把 ua_active_member_id_v1 设为黑名单里的 id（如 U10008 / U10009 / 1233444）
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_member_blacklist_v1';
  var ACTIVE_MEMBER_KEY = 'ua_active_member_id_v1';
  var DEMO_KEY = 'ua_blacklist_demo_v1';
  var DEFAULT_MEMBER_ID = 'UC10001';

  var FUNC = {
    COMMENT: '禁止直播评论',
    LIVE: '观看直播',
    ORDER: '下单',
    ACCESS: '访问页面'
  };

  var FUNC_OPTIONS = [FUNC.COMMENT, FUNC.LIVE, FUNC.ORDER, FUNC.ACCESS];

  var MSG = {
    comment: '抱歉，你正在小黑屋中，暂不支持发布评论。可联系客服进行申诉~',
    live: '抱歉，你正在小黑屋中，暂不支持观看直播。可联系客服进行申诉~',
    order: '抱歉，你正在小黑屋中，暂不支持下单。可联系客服进行申诉~',
    access: '抱歉，你的账号异常，暂不支持访问。可联系客服进行申诉~'
  };

  var DEMO_MAP = {
    access: [FUNC.ACCESS],
    order: [FUNC.ORDER],
    live: [FUNC.LIVE],
    comment: [FUNC.COMMENT],
    all: [FUNC.ACCESS, FUNC.ORDER, FUNC.LIVE, FUNC.COMMENT],
    off: []
  };

  var stylesReady = false;

  function getActiveMemberId() {
    if (global.UaAccountCancel && typeof global.UaAccountCancel.getActiveMemberId === 'function') {
      return global.UaAccountCancel.getActiveMemberId();
    }
    if (global.UaProfile && typeof global.UaProfile.getActiveMemberId === 'function') {
      return global.UaProfile.getActiveMemberId();
    }
    try {
      return localStorage.getItem(ACTIVE_MEMBER_KEY) || DEFAULT_MEMBER_ID;
    } catch (e) {
      return DEFAULT_MEMBER_ID;
    }
  }

  /** 与 B 端 demo 保持一致，便于未进过会员黑名单页时也能联调 */
  var SEED_LIST = [
    {
      id: '1233444',
      nickname: '金木甄选',
      funcs: ['访问页面', '下单', '观看直播', '禁止直播评论']
    },
    {
      id: 'U10008',
      nickname: '黑名单用户E',
      funcs: ['下单', '观看直播']
    },
    {
      id: 'U10009',
      nickname: '风控用户F',
      funcs: ['访问页面', '禁止直播评论']
    }
  ];

  function loadBlacklist() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) { /* ignore */ }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LIST));
    } catch (e2) { /* ignore */ }
    return SEED_LIST.slice();
  }

  function findMemberRecord(memberId) {
    var id = String(memberId || '').trim();
    if (!id) return null;
    var list = loadBlacklist();
    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].id) === id) return list[i];
    }
    return null;
  }

  function readDemoState() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var demo = String(params.get('blDemo') || '').trim().toLowerCase();
      if (demo === 'off') return { on: false, funcs: [] };
      if (demo && DEMO_MAP[demo]) return { on: true, funcs: DEMO_MAP[demo].slice() };
    } catch (e1) { /* ignore */ }
    try {
      var raw = localStorage.getItem(DEMO_KEY);
      if (!raw) {
        /* 兼容旧版：仅存 funcs 数组 */
        var legacy = localStorage.getItem('ua_blacklist_demo_funcs_v1');
        if (legacy) {
          var legacyFuncs = JSON.parse(legacy);
          if (Array.isArray(legacyFuncs)) return { on: true, funcs: legacyFuncs };
        }
        return { on: false, funcs: [] };
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { on: false, funcs: [] };
      return {
        on: !!parsed.on,
        funcs: Array.isArray(parsed.funcs) ? parsed.funcs.slice() : []
      };
    } catch (e2) {
      return { on: false, funcs: [] };
    }
  }

  function writeDemoState(state) {
    try {
      localStorage.setItem(
        DEMO_KEY,
        JSON.stringify({
          on: !!(state && state.on),
          funcs: state && Array.isArray(state.funcs) ? state.funcs.slice() : []
        })
      );
    } catch (e) { /* ignore */ }
  }

  function getBannedFuncs() {
    var demo = readDemoState();
    if (demo.on) return demo.funcs.slice();
    var rec = findMemberRecord(getActiveMemberId());
    if (!rec || !Array.isArray(rec.funcs)) return [];
    return rec.funcs.slice();
  }

  function isBanned(funcName) {
    var funcs = getBannedFuncs();
    return funcs.indexOf(funcName) >= 0;
  }

  function isStoreAppChannel() {
    try {
      var path = String((global.location && global.location.pathname) || '');
      if (/\/store-app\//i.test(path)) return true;
      var page = (path.split('/').pop() || '').toLowerCase();
      if (
        page === 'restock.html' ||
        page === 'product-detail.html' ||
        page === 'checkout.html' ||
        page.indexOf('store-wallet') === 0 ||
        page.indexOf('store-recharge') === 0 ||
        page.indexOf('store-withdraw') === 0 ||
        page.indexOf('store-bind-card') === 0 ||
        page.indexOf('store-pay-password') === 0
      ) {
        return true;
      }
      var search = String((global.location && global.location.search) || '');
      if (/from=store-app|port=store-app/i.test(search)) return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function isLoginFlowPage() {
    if (document.querySelector('.ua-change-pwd-screen')) return false;
    if (document.getElementById('uaLoginScreen')) return true;
    if (document.querySelector('.ua-phone-login-screen')) return true;
    if (document.querySelector('.ua-wechat-auth-screen')) return true;
    if (document.querySelector('.ua-pwd-login-screen')) return true;
    if (document.querySelector('.ua-register-screen')) return true;
    if (document.querySelector('.ua-forgot-pwd-screen')) return true;
    if (document.querySelector('.ua-set-pwd-screen')) return true;
    var page = ((window.location.pathname || '').split('/').pop() || '').toLowerCase();
    return (
      page === 'login.html' ||
      page === 'login-phone.html' ||
      page === 'login-wechat.html' ||
      page === 'login-password.html' ||
      page === 'login-register.html' ||
      page === 'forgot-password.html' ||
      page === 'set-password.html'
    );
  }

  function ensureStyles() {
    if (stylesReady) return;
    stylesReady = true;
    if (document.getElementById('uaBlacklistGuardStyles')) return;
    var style = document.createElement('style');
    style.id = 'uaBlacklistGuardStyles';
    style.textContent =
      '.ua-bl-modal{position:fixed;inset:0;z-index:3200;display:flex;align-items:center;justify-content:center;padding:24px;}' +
      '.ua-bl-modal__mask{position:absolute;inset:0;background:rgba(0,0,0,.45);}' +
      '.ua-bl-modal__panel{position:relative;width:100%;max-width:300px;background:#fff;border-radius:12px;overflow:hidden;}' +
      '.ua-bl-modal__text{margin:0;padding:28px 20px 20px;font-size:15px;color:#333;line-height:1.65;text-align:center;}' +
      '.ua-bl-modal__actions{display:flex;border-top:1px solid #eee;}' +
      '.ua-bl-modal__btn{flex:1;height:48px;border:none;background:#fff;font-size:15px;color:#ff6a00;font-weight:600;cursor:pointer;}' +
      'body.ua-bl-locked .ua-mobile-shell{pointer-events:none;user-select:none;}' +
      'body.ua-bl-locked .ua-bl-modal,body.ua-bl-locked .ua-bl-access-block,body.ua-bl-locked .ua-bl-demo,body.ua-bl-locked .ua-pwd-demo,body.ua-bl-locked .ua-watch-reward-demo{pointer-events:auto;}' +
      '.ua-bl-access-block{position:fixed;inset:0;z-index:3100;display:flex;align-items:center;justify-content:center;padding:28px;background:rgba(255,255,255,.72);backdrop-filter:blur(2px);}' +
      '.ua-bl-access-block__card{max-width:300px;padding:22px 18px;border-radius:12px;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.12);font-size:15px;line-height:1.65;color:#333;text-align:center;}' +
      '.ua-live-room--bl-ban .ua-live-room__stage{background:#1a1a1a!important;}' +
      '.ua-live-room--bl-ban .ua-live-room__stage::after{display:none!important;}' +
      '.ua-live-room--bl-ban .ua-live-room__center,' +
      '.ua-live-room--bl-ban .ua-live-room__box,' +
      '.ua-live-room--bl-ban .ua-live-fx-demo,' +
      '.ua-live-room--bl-ban .ua-live-fx-host{display:none!important;}' +
      '.ua-live-bl-tip{position:absolute;left:16px;right:16px;top:50%;transform:translateY(-50%);z-index:5;padding:18px 16px;border-radius:12px;background:rgba(0,0,0,.72);color:#fff;font-size:14px;line-height:1.7;text-align:center;}' +
      /* 验收开关：放左侧，避开注册有礼右下角面板 */
      '.ua-bl-demo{position:fixed;left:8px;bottom:72px;z-index:3300;width:178px;padding:10px;background:rgba(255,255,255,.96);border:1px solid #eee;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);font-size:11px;color:#333;}' +
      '.ua-bl-demo__title{font-weight:600;margin-bottom:8px;font-size:12px;}' +
      '.ua-bl-demo__hint{margin:0 0 8px;color:#999;font-size:10px;line-height:1.4;}' +
      '.ua-bl-demo__row{display:flex;align-items:center;gap:6px;margin-bottom:6px;line-height:1.3;}' +
      '.ua-bl-demo__row--master{margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed #eee;font-weight:600;}' +
      '.ua-bl-demo__funcs[hidden]{display:none!important;}' +
      '.ua-bl-demo__apply{width:100%;margin-top:4px;height:28px;border:none;border-radius:6px;background:#ff7019;color:#fff;font-size:11px;cursor:pointer;}';
    document.head.appendChild(style);
  }

  function showBanModal(message, opts) {
    ensureStyles();
    opts = opts || {};
    var old = document.getElementById('uaBlacklistBanModal');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'uaBlacklistBanModal';
    wrap.className = 'ua-bl-modal';
    wrap.innerHTML =
      '<div class="ua-bl-modal__mask"></div>' +
      '<div class="ua-bl-modal__panel" role="dialog" aria-modal="true">' +
      '<p class="ua-bl-modal__text"></p>' +
      '<div class="ua-bl-modal__actions">' +
      '<button type="button" class="ua-bl-modal__btn" data-bl-close>我知道了</button>' +
      '</div></div>';
    wrap.querySelector('.ua-bl-modal__text').textContent = message;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (!e.target.closest('[data-bl-close]')) return;
      wrap.remove();
      if (typeof opts.onClose === 'function') opts.onClose();
    });
    return wrap;
  }

  function lockPageAccess() {
    ensureStyles();
    document.body.classList.add('ua-bl-locked');
    if (document.getElementById('uaBlacklistAccessBlock')) return;
    var block = document.createElement('div');
    block.id = 'uaBlacklistAccessBlock';
    block.className = 'ua-bl-access-block';
    block.setAttribute('role', 'alert');
    block.innerHTML = '<div class="ua-bl-access-block__card"></div>';
    block.querySelector('.ua-bl-access-block__card').textContent = MSG.access;
    document.body.appendChild(block);
  }

  function guardPageAccess() {
    if (isStoreAppChannel() || isLoginFlowPage()) return false;
    if (!isBanned(FUNC.ACCESS)) return false;
    document.body.classList.add('ua-bl-locked');
    ensureStyles();
    showBanModal(MSG.access, {
      onClose: function () {
        lockPageAccess();
      }
    });
    return true;
  }

  function guardOrderSubmit() {
    if (isStoreAppChannel()) return false;
    if (!isBanned(FUNC.ORDER)) return false;
    showBanModal(MSG.order);
    return true;
  }

  function guardLiveComment() {
    if (!isBanned(FUNC.COMMENT)) return false;
    showBanModal(MSG.comment);
    return true;
  }

  function applyLiveWatchBan() {
    if (!isBanned(FUNC.LIVE)) return false;
    ensureStyles();
    var room = document.querySelector('.ua-live-room');
    if (!room) return true;
    room.classList.add('ua-live-room--bl-ban');
    if (!document.getElementById('uaLiveBlacklistTip')) {
      var tip = document.createElement('div');
      tip.id = 'uaLiveBlacklistTip';
      tip.className = 'ua-live-bl-tip';
      tip.setAttribute('role', 'note');
      tip.textContent = MSG.live;
      room.appendChild(tip);
    }
    return true;
  }

  function syncDemoFuncVisibility() {
    var onEl = document.getElementById('uaBlDemoOn');
    var wrap = document.getElementById('uaBlDemoFuncs');
    if (!onEl || !wrap) return;
    wrap.hidden = !onEl.checked;
  }

  function renderDemoPanel() {
    if (isLoginFlowPage() || isStoreAppChannel()) return;
    ensureStyles();
    var old = document.getElementById('uaBlDemo');
    if (old) old.remove();

    var state = readDemoState();
    var panel = document.createElement('div');
    panel.id = 'uaBlDemo';
    panel.className = 'ua-bl-demo';
    panel.innerHTML =
      '<div class="ua-bl-demo__title">黑名单验收开关</div>' +
      '<p class="ua-bl-demo__hint">勾选 = 禁用该项；关演示则跟 B 端黑名单</p>' +
      '<label class="ua-bl-demo__row ua-bl-demo__row--master">' +
      '<input type="checkbox" id="uaBlDemoOn"' +
      (state.on ? ' checked' : '') +
      '> 启用演示覆盖</label>' +
      '<div class="ua-bl-demo__funcs" id="uaBlDemoFuncs">' +
      FUNC_OPTIONS.map(function (name, idx) {
        return (
          '<label class="ua-bl-demo__row"><input type="checkbox" data-bl-func="' +
          name +
          '" id="uaBlDemoFunc' +
          idx +
          '"' +
          (state.funcs.indexOf(name) >= 0 ? ' checked' : '') +
          '> ' +
          name +
          '</label>'
        );
      }).join('') +
      '</div>' +
      '<button type="button" class="ua-bl-demo__apply" id="uaBlDemoApply">应用并刷新</button>';

    document.body.appendChild(panel);
    syncDemoFuncVisibility();

    var onEl = document.getElementById('uaBlDemoOn');
    if (onEl) {
      onEl.addEventListener('change', syncDemoFuncVisibility);
    }

    document.getElementById('uaBlDemoApply').addEventListener('click', function () {
      var enabled = !!(document.getElementById('uaBlDemoOn') || {}).checked;
      var funcs = [];
      if (enabled) {
        panel.querySelectorAll('[data-bl-func]').forEach(function (input) {
          if (input.checked) funcs.push(input.getAttribute('data-bl-func'));
        });
      }
      writeDemoState({ on: enabled, funcs: funcs });
      /* 去掉 URL 上的 blDemo，避免刷新后又被参数盖住面板选择 */
      try {
        var url = new URL(window.location.href);
        if (url.searchParams.has('blDemo')) {
          url.searchParams.delete('blDemo');
          window.location.replace(url.toString());
          return;
        }
      } catch (e) { /* ignore */ }
      window.location.reload();
    });
  }

  function consumeUrlDemoOnce() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var demo = String(params.get('blDemo') || '').trim().toLowerCase();
      if (!demo) return;
      if (demo === 'off') writeDemoState({ on: false, funcs: [] });
      else if (DEMO_MAP[demo]) writeDemoState({ on: true, funcs: DEMO_MAP[demo].slice() });
    } catch (e) { /* ignore */ }
  }

  function init() {
    if (isStoreAppChannel()) return;
    ensureStyles();
    consumeUrlDemoOnce();
    renderDemoPanel();
    guardPageAccess();
    if (document.querySelector('.ua-live-room-page, .ua-live-room')) {
      applyLiveWatchBan();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.UaBlacklistGuard = {
    FUNC: FUNC,
    MSG: MSG,
    getActiveMemberId: getActiveMemberId,
    getBannedFuncs: getBannedFuncs,
    isBanned: isBanned,
    showBanModal: showBanModal,
    guardPageAccess: guardPageAccess,
    guardOrderSubmit: guardOrderSubmit,
    guardLiveComment: guardLiveComment,
    applyLiveWatchBan: applyLiveWatchBan,
    renderDemoPanel: renderDemoPanel,
    readDemoState: readDemoState,
    writeDemoState: writeDemoState
  };
})(window);
