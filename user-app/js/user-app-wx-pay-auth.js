/**
 * 微信支付收款授权（现金红包转入微信零钱）。
 *
 * 未授权时，登录成功（含系统自动登录）、进入直播间仍弹出授权半屏。
 * 活动中奖先把红包放入账户，不在中奖当场弹授权，也不自动打微信。
 * 我的红包点「领取」，或点现金收益旁的「收款授权」，才弹出授权半屏；领取且同意后才转微信。
 * 点「同意」后记为已授权，再点「完成」继续原来的动作。
 * 授权一次后不再弹出。关闭半屏且未点同意，保持未授权，下次上述场景再弹。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'ua_wx_pay_auth_v1';
  var ENTER_SKIP_KEY = 'ua_wx_pay_auth_enter_skip_v1';
  var LOGIN_SHOWN_KEY = 'ua_wx_pay_auth_login_shown_v1';
  var MERCHANT = '冷丰';

  var root = null;
  var queue = [];
  var cssHref = '../css/user-app-wx-pay-auth.css?v=20261015-wx-sheet3';

  if (document.currentScript && document.currentScript.src) {
    cssHref = document.currentScript.src.replace(
      /\/js\/user-app-wx-pay-auth\.js(\?.*)?$/,
      '/css/user-app-wx-pay-auth.css?v=20261015-wx-sheet3'
    );
  }

  function ensureCss() {
    if (document.getElementById('uaWxPayAuthCss')) return;
    var link = document.createElement('link');
    link.id = 'uaWxPayAuthCss';
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.appendChild(link);
  }

  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return data && data.authorized ? data : null;
    } catch (e) {
      return null;
    }
  }

  function isAuthorized() {
    return !!read();
  }

  function syncDemoSelect() {
    var sel = document.getElementById('uaWxPayDemoMode');
    if (sel) sel.value = isAuthorized() ? 'on' : 'off';
  }

  function authorize() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ authorized: true, merchant: MERCHANT, at: new Date().toISOString() })
      );
    } catch (e) {}
    syncDemoSelect();
  }

  function revoke() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    syncDemoSelect();
  }

  function payIcon() {
    return (
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="11" fill="#FA9D3B"/>' +
      '<text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">¥</text>' +
      '</svg>'
    );
  }

  function checkIcon() {
    return (
      '<svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">' +
      '<path d="M6 12.5l4 4 8-9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>'
    );
  }

  function build() {
    ensureCss();
    root = document.createElement('div');
    root.id = 'uaWxPayAuth';
    root.className = 'ua-wx-auth';
    root.hidden = true;
    root.setAttribute('data-step', 'ask');
    root.innerHTML =
      '<div class="ua-wx-auth__frame">' +
      '<div class="ua-wx-auth__mask" data-wx-auth-close></div>' +
      '<div class="ua-wx-auth__panel" role="dialog" aria-modal="true" aria-labelledby="uaWxPayAuthTitle">' +
      '<button type="button" class="ua-wx-auth__close" data-wx-auth-close aria-label="关闭">×</button>' +
      '<div class="ua-wx-auth__ask">' +
      '<div class="ua-wx-auth__logo">冷丰</div>' +
      '<h2 class="ua-wx-auth__title" id="uaWxPayAuthTitle">在' +
      MERCHANT +
      '通过微信支付收款</h2>' +
      '<div class="ua-wx-auth__rows">' +
      '<div class="ua-wx-auth__row"><span>转账类型</span><strong>活动奖励</strong></div>' +
      '<div class="ua-wx-auth__row"><span>转账说明</span><strong>同意后商家可转账至你的微信钱包</strong></div>' +
      '<div class="ua-wx-auth__row"><span>收款方式</span><strong class="ua-wx-auth__pay">' +
      payIcon() +
      '零钱</strong></div>' +
      '</div>' +
      '<button type="button" class="ua-wx-auth__agree" id="uaWxPayAuthAgree">同意</button>' +
      '</div>' +
      '<div class="ua-wx-auth__done" hidden>' +
      '<div class="ua-wx-auth__check">' +
      checkIcon() +
      '</div>' +
      '<p class="ua-wx-auth__done-text">已同意在' +
      MERCHANT +
      '通过微信支付收款</p>' +
      '<button type="button" class="ua-wx-auth__finish" id="uaWxPayAuthFinish">完成</button>' +
      '</div></div></div>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#uaWxPayAuthAgree')) {
        authorize();
        showStep('done');
        return;
      }
      if (e.target.closest && e.target.closest('#uaWxPayAuthFinish')) {
        finish();
        return;
      }
      if (e.target.closest && e.target.closest('[data-wx-auth-close]')) {
        if (root.getAttribute('data-step') === 'done') finish();
        else cancel();
      }
    });
  }

  function showStep(step) {
    if (!root) return;
    root.setAttribute('data-step', step);
    var ask = root.querySelector('.ua-wx-auth__ask');
    var done = root.querySelector('.ua-wx-auth__done');
    if (ask) ask.hidden = step !== 'ask';
    if (done) done.hidden = step !== 'done';
  }

  function openSheet() {
    if (!root) build();
    showStep('ask');
    root.hidden = false;
  }

  function closeSheet() {
    if (root) root.hidden = true;
  }

  function flush(kind) {
    var items = queue.splice(0, queue.length);
    closeSheet();
    items.forEach(function (it) {
      var fn = it && it[kind];
      if (typeof fn === 'function') fn();
    });
  }

  function finish() {
    flush('onDone');
  }

  function cancel() {
    flush('onCancel');
  }

  /**
   * 已授权则直接 onDone。未授权弹出半屏：同意并完成后 onDone，关闭未同意则 onCancel。
   */
  function ensure(opts) {
    opts = opts || {};
    if (isAuthorized()) {
      if (typeof opts.onDone === 'function') opts.onDone();
      return;
    }
    queue.push(opts);
    if (root && !root.hidden) return;
    openSheet();
  }

  function markEnterPrompted() {
    try {
      sessionStorage.setItem(ENTER_SKIP_KEY, '1');
    } catch (e) {}
  }

  /** 本次登录已经弹过收款授权，落地页不再连弹。 */
  function markLoginPrompted() {
    try {
      sessionStorage.setItem(LOGIN_SHOWN_KEY, '1');
    } catch (e) {}
  }

  function readUserSession() {
    try {
      var data = JSON.parse(localStorage.getItem('ua_user_session_v1') || 'null');
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  function isLoginSurface() {
    var path = String(global.location.pathname || '').toLowerCase();
    if (/login|forgot-password|set-password|change-password/.test(path)) return true;
    return !!(
      document.getElementById('uaLoginScreen') ||
      document.querySelector(
        '.ua-phone-login-screen, .ua-wechat-auth-screen, .ua-pwd-login-screen, .ua-register-screen'
      )
    );
  }

  function isAutoLoginSurface() {
    if (isLoginSurface()) return false;
    var path = String(global.location.pathname || '').toLowerCase();
    if (path.indexOf('home') >= 0 || path.indexOf('profile') >= 0) return true;
    return !!(document.getElementById('uaProfileContent') || document.querySelector('.ua-home-page'));
  }

  /** 已有登录态、或分享验收默认已登录，都算系统自动登录。跳过登录不算。 */
  function isAutoLoggedIn() {
    var session = readUserSession();
    if (session && session.skipped && !session.loggedIn) return false;
    if (session && session.loggedIn) return true;
    if (global.UaLiveInvite && typeof global.UaLiveInvite.isLoggedIn === 'function') {
      return !!global.UaLiveInvite.isLoggedIn();
    }
    return false;
  }

  function promptAutoLogin() {
    if (!isAutoLoginSurface() || isAuthorized() || !isAutoLoggedIn()) return;
    var skip = false;
    try {
      skip = sessionStorage.getItem(LOGIN_SHOWN_KEY) === '1';
      if (skip) sessionStorage.removeItem(LOGIN_SHOWN_KEY);
    } catch (e) {}
    if (skip) return;
    ensure({});
  }

  /** 进入直播间页时：本趟已经弹过则不再弹，否则未授权再弹一次。 */
  function promptEnterLive() {
    var skip = false;
    try {
      skip = sessionStorage.getItem(ENTER_SKIP_KEY) === '1';
      if (skip) sessionStorage.removeItem(ENTER_SKIP_KEY);
    } catch (e) {}
    if (isAuthorized() || skip) return;
    ensure({});
  }

  function mountDemo() {
    if (document.getElementById('uaWxPayDemo')) return;
    if (!document.querySelector('.user-app-body')) return;
    ensureCss();
    var panel = document.createElement('div');
    panel.id = 'uaWxPayDemo';
    panel.className = 'ua-wx-pay-demo';
    var on = isAuthorized();
    panel.innerHTML =
      '<div class="ua-wx-pay-demo__title">收款授权验收开关</div>' +
      '<label class="ua-wx-pay-demo__row">授权状态' +
      '<select id="uaWxPayDemoMode">' +
      '<option value="off"' +
      (on ? '' : ' selected') +
      '>未授权</option>' +
      '<option value="on"' +
      (on ? ' selected' : '') +
      '>已授权</option>' +
      '</select></label>' +
      '<button type="button" class="ua-wx-pay-demo__apply" id="uaWxPayDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaWxPayDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaWxPayDemoMode');
      if (sel && sel.value === 'on') {
        authorize();
        if (global.UaLiveBagCash && typeof global.UaLiveBagCash.settleAllHolds === 'function') {
          global.UaLiveBagCash.settleAllHolds();
        }
      } else revoke();
      global.location.reload();
    });
  }

  global.UaWxPayAuth = {
    isAuthorized: isAuthorized,
    authorize: authorize,
    revoke: revoke,
    ensure: ensure,
    markEnterPrompted: markEnterPrompted,
    markLoginPrompted: markLoginPrompted,
    promptEnterLive: promptEnterLive,
    promptAutoLogin: promptAutoLogin,
    merchant: MERCHANT
  };

  function boot() {
    mountDemo();
    global.setTimeout(promptAutoLogin, 0);
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})(window);
