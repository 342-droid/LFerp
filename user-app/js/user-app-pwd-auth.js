/**
 * 用户 APP — 账号密码登录 / 注册 / 找回 / 设置
 *
 * 业务规则：
 * - 手机号+短信：未注册号码验证通过后自动注册，不强制引导设置密码
 * - 账号密码：未注册提示去注册；已注册未设密码可立即设置（需短信验证）或改用验证码登录
 * - 设置-密码管理：未设密码→设置密码；已设密码→修改密码（均需短信验证）
 *
 * 验收：右下角「账号密码验收开关」切换账号状态后刷新
 * 演示密码 a123456；注册/找回/改密验证码 123456，有效期 5 分钟
 */
(function (global) {
  'use strict';

  var DEMO_KEY = 'ua_pwd_login_demo_v1';
  var ACCOUNT_KEY = 'ua_user_pwd_accounts_v1';
  var SESSION_KEY = 'ua_user_session_v1';
  var DEMO_PASSWORD = 'a123456';
  var DEMO_SMS = '123456';
  var SMS_COOLDOWN = 60;
  var SMS_TTL_MS = 5 * 60 * 1000;

  var STATE_OPTIONS = [
    { value: 'unregistered', label: '未注册' },
    { value: 'noPassword', label: '已注册未设密码' },
    { value: 'hasPassword', label: '已注册已设密码' }
  ];

  var STATE_PRESET = {
    unregistered: { registered: false, hasPassword: false },
    noPassword: { registered: true, hasPassword: false },
    hasPassword: { registered: true, hasPassword: true }
  };

  var smsTimer = null;
  var smsLeft = 0;
  var smsSentAt = 0;

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
    } catch (e) {}
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '');
  }

  function validPassword(pwd) {
    if (!pwd || pwd.length < 6 || pwd.length > 12) return false;
    return /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
  }

  function getDemo() {
    var stored = readJson(DEMO_KEY, {});
    var state = stored && STATE_PRESET[stored.accountState] ? stored.accountState : 'hasPassword';
    return { accountState: state };
  }

  function setDemo(patch) {
    var next = Object.assign({}, getDemo(), patch || {});
    if (!STATE_PRESET[next.accountState]) next.accountState = 'hasPassword';
    writeJson(DEMO_KEY, next);
    return next;
  }

  function readAccounts() {
    var data = readJson(ACCOUNT_KEY, {});
    return data && data.phones && typeof data.phones === 'object' ? data.phones : {};
  }

  function writeAccounts(phones) {
    writeJson(ACCOUNT_KEY, { phones: phones || {} });
  }

  function getSavedAccount(phone) {
    var key = normalizePhone(phone);
    if (!key) return {};
    return readAccounts()[key] || {};
  }

  function patchSavedAccount(phone, patch) {
    var key = normalizePhone(phone);
    if (!key) return;
    var phones = readAccounts();
    phones[key] = Object.assign({}, phones[key] || {}, patch || {});
    writeAccounts(phones);
  }

  function getAccount(phone) {
    var preset = STATE_PRESET[getDemo().accountState] || STATE_PRESET.hasPassword;
    var saved = getSavedAccount(phone);
    return {
      registered: !!preset.registered,
      hasPassword: !!preset.hasPassword,
      password: saved.password || DEMO_PASSWORD
    };
  }

  function isRegistered(phone) {
    return !!getAccount(phone).registered;
  }

  function hasPassword(phone) {
    return !!getAccount(phone).hasPassword;
  }

  function markRegistered(phone) {
    patchSavedAccount(phone, { registered: true });
    if (getDemo().accountState === 'unregistered') {
      setDemo({ accountState: 'noPassword' });
    }
  }

  function clearPassword(phone) {
    patchSavedAccount(phone, { hasPassword: false });
    setDemo({ accountState: 'noPassword' });
    syncSessionPasswordFlag(false);
  }

  function setPassword(phone, pwd) {
    patchSavedAccount(phone, { registered: true, hasPassword: true, password: pwd });
    setDemo({ accountState: 'hasPassword' });
    syncSessionPasswordFlag(true);
  }

  function syncSessionPasswordFlag(flag) {
    try {
      var session = readJson(SESSION_KEY, null);
      if (!session || !session.loggedIn) return;
      session.hasPassword = !!flag;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}
  }

  function readSession() {
    if (global.UaUserAuth && typeof global.UaUserAuth.readSession === 'function') {
      return global.UaUserAuth.readSession();
    }
    return readJson(SESSION_KEY, null);
  }

  function sessionPhone() {
    var session = readSession() || {};
    return normalizePhone(session.phone);
  }

  function showToast(msg) {
    if (global.UaUserAuth && typeof global.UaUserAuth.showToast === 'function') {
      global.UaUserAuth.showToast(msg);
      return;
    }
    if (global.UaAccountCancel && typeof global.UaAccountCancel.showToast === 'function') {
      global.UaAccountCancel.showToast(msg);
      return;
    }
    var el = document.getElementById('uaLoginToast') || document.getElementById('uaCancelToast');
    if (!el) {
      window.alert(msg);
      return;
    }
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.remove('is-show');
    }, 2200);
  }

  function goTo(url) {
    if (global.UaUserAuth && typeof global.UaUserAuth.goTo === 'function') {
      global.UaUserAuth.goTo(url);
      return;
    }
    try {
      window.location.assign(url);
    } catch (e) {
      window.location.href = url;
    }
  }

  function buildLoginUrl(target) {
    if (global.UaUserAuth && typeof global.UaUserAuth.buildLoginUrl === 'function') {
      return global.UaUserAuth.buildLoginUrl(target);
    }
    return target;
  }

  function completeLogin(phone, nickname) {
    if (global.UaUserAuth && typeof global.UaUserAuth.completeLogin === 'function') {
      global.UaUserAuth.completeLogin(phone, nickname || '冷丰用户');
      return;
    }
    goTo('profile.html');
  }

  function bindEye(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
      btn.classList.toggle('is-on', show);
    });
  }

  function resetSmsBtn(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = '获取验证码';
  }

  function startSmsCooldown(btn) {
    if (!btn) return;
    smsLeft = SMS_COOLDOWN;
    btn.disabled = true;
    btn.textContent = smsLeft + 's';
    clearInterval(smsTimer);
    smsTimer = setInterval(function () {
      smsLeft -= 1;
      if (smsLeft <= 0) {
        clearInterval(smsTimer);
        smsTimer = null;
        resetSmsBtn(btn);
        return;
      }
      btn.textContent = smsLeft + 's';
    }, 1000);
  }

  function bindSms(btn, phoneInput) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      var phone = normalizePhone(phoneInput && phoneInput.value);
      if (phone.length !== 11) {
        showToast('请输入11位手机号');
        return;
      }
      startSmsCooldown(btn);
      smsSentAt = Date.now();
      showToast('验证码已发送（演示：' + DEMO_SMS + '）');
    });
  }

  function isSmsCodeValid(code) {
    if (!smsSentAt) return false;
    if (Date.now() - smsSentAt > SMS_TTL_MS) return false;
    return String(code || '') === DEMO_SMS;
  }

  function smsFailToast(code) {
    if (!smsSentAt) {
      showToast('请先获取验证码');
      return;
    }
    if (Date.now() - smsSentAt > SMS_TTL_MS) {
      showToast('验证码已过期，请重新获取');
      return;
    }
    showToast(code ? '验证码错误或已过期' : '请输入验证码');
  }

  function isAgreed(checkbox) {
    return !!(checkbox && checkbox.checked);
  }

  function queryScene() {
    try {
      return String(new URLSearchParams(window.location.search).get('scene') || '');
    } catch (e) {
      return '';
    }
  }

  function queryPhone() {
    try {
      return normalizePhone(new URLSearchParams(window.location.search).get('phone'));
    } catch (e) {
      return '';
    }
  }

  function goLoginPage(page, extra) {
    extra = extra || {};
    var params = new URLSearchParams();
    Object.keys(extra).forEach(function (k) {
      if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') {
        params.set(k, String(extra[k]));
      }
    });
    try {
      var cur = new URLSearchParams(window.location.search);
      if (cur.get('next') && !params.get('next')) params.set('next', cur.get('next'));
    } catch (e) {}
    var qs = params.toString();
    goTo(page + (qs ? '?' + qs : ''));
  }

  function bindWechatAgree(modalId) {
    var modal = document.getElementById(modalId || 'uaLoginWechatAgreeModal');
    var cancelBtn = document.getElementById('uaLoginWechatAgreeCancelBtn');
    var confirmBtn = document.getElementById('uaLoginWechatAgreeConfirmBtn');
    var wechatBtn = document.getElementById('uaPwdWechatLinkBtn') || document.getElementById('uaRegWechatLinkBtn');
    if (wechatBtn && modal) {
      wechatBtn.addEventListener('click', function () {
        modal.hidden = false;
      });
    }
    if (cancelBtn && modal) {
      cancelBtn.addEventListener('click', function () {
        modal.hidden = true;
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-wechat.html'));
      });
    }
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.hidden = true;
      });
    }
  }

  function initPasswordLoginPage() {
    var root = document.querySelector('.ua-pwd-login-screen');
    if (!root) return;

    var backBtn = document.getElementById('uaPwdLoginBackBtn');
    var skipBtn = document.getElementById('uaPwdLoginSkipBtn');
    var phoneInput = document.getElementById('uaPwdPhoneInput');
    var pwdInput = document.getElementById('uaPwdInput');
    var eyeBtn = document.getElementById('uaPwdEye');
    var forgotBtn = document.getElementById('uaPwdForgotBtn');
    var registerBtn = document.getElementById('uaPwdRegisterBtn');
    var submitBtn = document.getElementById('uaPwdSubmitBtn');
    var agree = document.getElementById('uaPwdLoginAgree');
    var oneClickBtn = document.getElementById('uaPwdOneClickLinkBtn');
    var phoneLinkBtn = document.getElementById('uaPwdPhoneLinkBtn');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }
    if (forgotBtn) {
      forgotBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('forgot-password.html'));
      });
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-register.html'));
      });
    }
    if (oneClickBtn) {
      oneClickBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }
    if (phoneLinkBtn) {
      phoneLinkBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-phone.html'));
      });
    }

    bindEye(eyeBtn, pwdInput);
    bindWechatAgree();

    var noPwdModal = document.getElementById('uaPwdNoPwdModal');
    var noPwdSetBtn = document.getElementById('uaPwdNoPwdSetBtn');
    var noPwdSmsBtn = document.getElementById('uaPwdNoPwdSmsBtn');
    var pendingNoPwdPhone = '';

    function openNoPwdModal(phone) {
      pendingNoPwdPhone = phone;
      if (noPwdModal) noPwdModal.hidden = false;
    }

    function closeNoPwdModal() {
      if (noPwdModal) noPwdModal.hidden = true;
    }

    if (noPwdModal) {
      noPwdModal.addEventListener('click', function (e) {
        if (e.target === noPwdModal) closeNoPwdModal();
      });
    }
    if (noPwdSetBtn) {
      noPwdSetBtn.addEventListener('click', function () {
        goLoginPage('set-password.html', { scene: 'unset', phone: pendingNoPwdPhone });
      });
    }
    if (noPwdSmsBtn) {
      noPwdSmsBtn.addEventListener('click', function () {
        goLoginPage('login-phone.html', { phone: pendingNoPwdPhone });
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!isAgreed(agree)) {
          showToast('请先阅读并同意相关协议');
          return;
        }
        var phone = normalizePhone(phoneInput && phoneInput.value);
        var pwd = (pwdInput && pwdInput.value) || '';
        if (phone.length !== 11) {
          showToast('请输入11位手机号');
          return;
        }
        var acc = getAccount(phone);
        if (!acc.registered) {
          showToast('该手机号未注册，请先注册');
          return;
        }
        if (!acc.hasPassword) {
          openNoPwdModal(phone);
          return;
        }
        if (!pwd) {
          showToast('请输入密码');
          return;
        }
        if (pwd !== acc.password) {
          showToast('账号或密码错误');
          return;
        }
        completeLogin(phone, '冷丰用户');
      });
    }
  }

  function initRegisterPage() {
    var root = document.querySelector('.ua-register-screen');
    if (!root) return;

    var backBtn = document.getElementById('uaRegBackBtn');
    var skipBtn = document.getElementById('uaRegSkipBtn');
    var phoneInput = document.getElementById('uaRegPhoneInput');
    var codeInput = document.getElementById('uaRegCodeInput');
    var smsBtn = document.getElementById('uaRegSmsBtn');
    var pwdInput = document.getElementById('uaRegPwdInput');
    var submitBtn = document.getElementById('uaRegSubmitBtn');
    var agree = document.getElementById('uaRegAgree');
    var loginLink = document.getElementById('uaRegLoginLink');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-password.html'));
      });
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }
    if (loginLink) {
      loginLink.addEventListener('click', function () {
        goTo(buildLoginUrl('login-password.html'));
      });
    }

    bindSms(smsBtn, phoneInput);
    bindEye(document.getElementById('uaRegPwdEye'), pwdInput);
    bindWechatAgree();

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!isAgreed(agree)) {
          showToast('请先阅读并同意相关协议');
          return;
        }
        var phone = normalizePhone(phoneInput && phoneInput.value);
        var code = String((codeInput && codeInput.value) || '').replace(/\D/g, '');
        var pwd = (pwdInput && pwdInput.value) || '';
        if (phone.length !== 11) {
          showToast('请输入11位手机号');
          return;
        }
        if (!isSmsCodeValid(code)) {
          smsFailToast(code);
          return;
        }
        if (!validPassword(pwd)) {
          showToast('密码需 6-12 位，且同时包含字母和数字');
          return;
        }
        if (isRegistered(phone)) {
          showToast('该手机号已注册，请直接登录');
          return;
        }
        setPassword(phone, pwd);
        showToast('注册成功');
        setTimeout(function () {
          completeLogin(phone, '冷丰用户');
        }, 400);
      });
    }
  }

  function initForgotPage() {
    var root = document.querySelector('.ua-forgot-pwd-screen');
    if (!root) return;

    var backBtn = document.getElementById('uaForgotBackBtn');
    var phoneInput = document.getElementById('uaForgotPhoneInput');
    var codeInput = document.getElementById('uaForgotCodeInput');
    var smsBtn = document.getElementById('uaForgotSmsBtn');
    var pwdInput = document.getElementById('uaForgotPwdInput');
    var submitBtn = document.getElementById('uaForgotSubmitBtn');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-password.html'));
      });
    }

    bindSms(smsBtn, phoneInput);
    bindEye(document.getElementById('uaForgotPwdEye'), pwdInput);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var phone = normalizePhone(phoneInput && phoneInput.value);
        var code = String((codeInput && codeInput.value) || '').replace(/\D/g, '');
        var pwd = (pwdInput && pwdInput.value) || '';
        if (phone.length !== 11) {
          showToast('请输入11位手机号');
          return;
        }
        if (!isRegistered(phone)) {
          showToast('该手机号未注册，请先注册');
          return;
        }
        if (!isSmsCodeValid(code)) {
          smsFailToast(code);
          return;
        }
        if (!validPassword(pwd)) {
          showToast('密码需 6-12 位，且同时包含字母和数字');
          return;
        }
        setPassword(phone, pwd);
        showToast('密码已重置，请使用新密码登录');
        setTimeout(function () {
          goTo(buildLoginUrl('login-password.html'));
        }, 800);
      });
    }
  }

  function initSetPasswordPage() {
    var root = document.querySelector('.ua-set-pwd-screen');
    if (!root) return;

    var scene = queryScene();
    var fromSettings = scene === 'settings';
    var backBtn = document.getElementById('uaSetPwdBackBtn');
    var titleEl = document.getElementById('uaSetPwdTitle');
    var submitBtn = document.getElementById('uaSetPwdSubmitBtn');
    var phoneInput = document.getElementById('uaSetPwdPhoneInput');
    var codeInput = document.getElementById('uaSetPwdCodeInput');
    var smsBtn = document.getElementById('uaSetPwdSmsBtn');
    var pwdInput = document.getElementById('uaSetPwdInput');
    var presetPhone = queryPhone() || (fromSettings ? sessionPhone() : '');

    if (titleEl) titleEl.textContent = '设置密码';
    if (phoneInput) {
      if (presetPhone) phoneInput.value = presetPhone;
      phoneInput.readOnly = false;
    }

    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (fromSettings) {
          goTo(global.UaNav ? global.UaNav.getBackHref('settings.html') : 'settings.html');
          return;
        }
        goLoginPage('login-password.html');
      });
    }

    bindSms(smsBtn, phoneInput);
    bindEye(document.getElementById('uaSetPwdEye'), pwdInput);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var phone = normalizePhone(phoneInput && phoneInput.value) || presetPhone;
        var code = String((codeInput && codeInput.value) || '').replace(/\D/g, '');
        var pwd = (pwdInput && pwdInput.value) || '';
        if (fromSettings) {
          var session = readSession();
          if (!session || !session.loggedIn) {
            showToast('请先登录后再设置密码');
            goTo('login.html?next=' + encodeURIComponent('change-password.html?scene=set') + '&force=1');
            return;
          }
        }
        if (phone.length !== 11) {
          showToast('请输入11位手机号');
          return;
        }
        if (!isSmsCodeValid(code)) {
          smsFailToast(code);
          return;
        }
        if (!validPassword(pwd)) {
          showToast('密码需 6-12 位，且同时包含字母和数字');
          return;
        }
        setPassword(phone, pwd);
        showToast('密码设置成功');
        setTimeout(function () {
          if (fromSettings) {
            goTo(global.UaNav ? global.UaNav.getBackHref('settings.html') : 'settings.html');
          } else {
            completeLogin(phone, '冷丰用户');
          }
        }, 600);
      });
    }
  }

  function initSettingsPwdManage() {
    var link = document.getElementById('setPwdManage');
    if (!link) return;
    var extra = document.getElementById('setPwdManageExtra');
    var session = readSession();
    var loggedIn = !!(session && session.loggedIn);
    var phone = sessionPhone();
    var setHref = 'change-password.html?scene=set';
    var changeHref = 'change-password.html';
    if (global.UaNav && typeof global.UaNav.withFrom === 'function') {
      setHref = global.UaNav.withFrom(setHref);
      changeHref = global.UaNav.withFrom(changeHref);
    }
    var hasPwd = loggedIn && hasPassword(phone);
    if (extra) extra.textContent = !loggedIn ? '' : hasPwd ? '修改密码' : '未设置';
    link.setAttribute('href', !loggedIn ? 'login.html?next=' + encodeURIComponent('settings.html') + '&force=1' : hasPwd ? changeHref : setHref);
    link.addEventListener('click', function (e) {
      if (loggedIn) return;
      e.preventDefault();
      showToast('请先登录后再管理密码');
      setTimeout(function () {
        goTo('login.html?next=' + encodeURIComponent('settings.html') + '&force=1');
      }, 400);
    });
  }

  function shouldShowDemo() {
    return !!(
      document.getElementById('uaLoginScreen') ||
      document.querySelector('.ua-phone-login-screen') ||
      document.querySelector('.ua-pwd-login-screen') ||
      document.querySelector('.ua-register-screen') ||
      document.querySelector('.ua-forgot-pwd-screen') ||
      document.querySelector('.ua-set-pwd-screen') ||
      document.getElementById('pwdSubmit') ||
      document.getElementById('setPwdManage')
    );
  }

  function mountDemoPanel() {
    if (!shouldShowDemo()) return;
    if (document.getElementById('uaPwdDemo')) return;
    var demo = getDemo();
    var panel = document.createElement('div');
    panel.id = 'uaPwdDemo';
    panel.className = 'ua-pwd-demo';
    var options = STATE_OPTIONS.map(function (item) {
      return (
        '<option value="' +
        item.value +
        '"' +
        (demo.accountState === item.value ? ' selected' : '') +
        '>' +
        item.label +
        '</option>'
      );
    }).join('');
    panel.innerHTML =
      '<div class="ua-pwd-demo__title">账号密码验收开关</div>' +
      '<p class="ua-pwd-demo__hint">演示密码 ' +
      DEMO_PASSWORD +
      '；验证码 ' +
      DEMO_SMS +
      '</p>' +
      '<label class="ua-pwd-demo__row">账号状态' +
      '<select id="uaPwdDemoState">' +
      options +
      '</select></label>' +
      '<button type="button" class="ua-pwd-demo__apply" id="uaPwdDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var applyBtn = document.getElementById('uaPwdDemoApply');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        var sel = document.getElementById('uaPwdDemoState');
        setDemo({ accountState: (sel && sel.value) || 'hasPassword' });
        window.location.reload();
      });
    }
  }

  function boot() {
    initPasswordLoginPage();
    initRegisterPage();
    initForgotPage();
    initSetPasswordPage();
    initSettingsPwdManage();
    mountDemoPanel();
  }

  global.UaPwdAuth = {
    DEMO_PASSWORD: DEMO_PASSWORD,
    DEMO_SMS: DEMO_SMS,
    getDemo: getDemo,
    setDemo: setDemo,
    getAccount: getAccount,
    isRegistered: isRegistered,
    hasPassword: hasPassword,
    markRegistered: markRegistered,
    clearPassword: clearPassword,
    setPassword: setPassword,
    validPassword: validPassword,
    showToast: showToast
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
