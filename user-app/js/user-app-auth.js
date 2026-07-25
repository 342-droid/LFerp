(function () {
  var STORAGE_KEY = 'ua_user_session_v1';
  var SESSION_HANDOFF_KEY = '_ua_s';
  var DEFAULT_PHONE = '15912344315';
  var DEFAULT_MASKED = '159****4315';
  var SMS_COOLDOWN = 60;
  var APP_PAGES = [
    'profile.html',
    'orders.html',
    'order-detail-shipping.html',
    'order-detail-pickup.html',
    'restock.html'
  ];

  /* 本地预览 / Simple Browser 的 pathname 可能不含文件名，优先用 DOM 识别页面 */
  function resolvePageName() {
    var raw = (window.location.pathname || '').replace(/\\/g, '/');
    var fromPath = (raw.split('/').pop() || '').split('?')[0].toLowerCase();
    if (fromPath && /\.html$/i.test(fromPath)) return fromPath;
    if (document.getElementById('uaLoginScreen')) return 'login.html';
    if (document.querySelector('.ua-phone-login-screen')) return 'login-phone.html';
    if (document.querySelector('.ua-wechat-auth-screen')) return 'login-wechat.html';
    if (document.getElementById('uaProfileContent')) return 'profile.html';
    if (document.getElementById('uaLoginOneClickBtn')) return 'login.html';
    return fromPath;
  }

  var page = resolvePageName();
  var isLoginPage = page === 'login.html' || !!document.getElementById('uaLoginScreen');
  var isPhoneLoginPage = page === 'login-phone.html' || !!document.querySelector('.ua-phone-login-screen');
  var isWechatLoginPage = page === 'login-wechat.html' || !!document.querySelector('.ua-wechat-auth-screen');
  var isProfilePage = page === 'profile.html' || !!document.getElementById('uaProfileContent');
  var isAppInterior = APP_PAGES.indexOf(page) >= 0 || isProfilePage;
  var isLoginFlowPage = isLoginPage || isPhoneLoginPage || isWechatLoginPage;

  if (!isLoginFlowPage && !isAppInterior) return;

  var loginScreen = document.getElementById('uaLoginScreen');
  var profileContent = document.getElementById('uaProfileContent');

  if (isLoginPage && !loginScreen) return;
  if (isPhoneLoginPage && !document.querySelector('.ua-phone-login-screen')) return;
  if (isWechatLoginPage && !document.querySelector('.ua-wechat-auth-screen')) return;
  if (isProfilePage && !profileContent) return;

  var oneClickBtn = document.getElementById('uaLoginOneClickBtn');
  var wechatEntryBtn = document.getElementById('uaLoginWechatBtn');
  var phoneMethodBtn = document.getElementById('uaLoginPhoneMethodBtn');
  var wechatAgreeModal = document.getElementById('uaLoginWechatAgreeModal');
  var wechatAgreeCancelBtn = document.getElementById('uaLoginWechatAgreeCancelBtn');
  var wechatAgreeConfirmBtn = document.getElementById('uaLoginWechatAgreeConfirmBtn');
  var loginSkipBtn = document.getElementById('uaLoginSkipBtn');
  var phoneBackBtn = document.getElementById('uaPhoneLoginBackBtn');
  var phoneSkipBtn = document.getElementById('uaPhoneLoginSkipBtn');
  var phoneWechatLinkBtn = document.getElementById('uaPhoneLoginWechatLinkBtn');
  var phoneOneClickLinkBtn = document.getElementById('uaPhoneLoginOneClickLinkBtn');
  var wechatAuthBackBtn = document.getElementById('uaWechatAuthBackBtn');
  var wechatAuthCancelBtn = document.getElementById('uaWechatAuthCancelBtn');
  var wechatAuthAllowBtn = document.getElementById('uaWechatAuthAllowBtn');
  var phoneDisplay = document.getElementById('uaLoginPhoneDisplay');
  var agreeCheckbox = document.getElementById(
    isPhoneLoginPage ? 'uaPhoneLoginAgree' : 'uaLoginAgree'
  );
  var phoneInput = document.getElementById('uaLoginPhoneInput');
  var codeInput = document.getElementById('uaLoginCodeInput');
  var smsBtn = document.getElementById('uaLoginSmsBtn');
  var phoneLoginBtn = document.getElementById('uaLoginPhoneSubmitBtn');
  var toastEl = document.getElementById('uaLoginToast');
  var profileNameEl = document.querySelector('.ua-profile-name');
  var profilePhoneEl = document.querySelector('.ua-profile-phone');
  var profileHeadEl = document.querySelector('.ua-profile-head');

  var smsTimer = null;
  var smsLeft = 0;
  var memorySession = null;
  var pendingOneClickAfterAgree = false;
  var authNavigating = false;

  function readSession() {
    if (memorySession) return memorySession;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  function writeSession(data) {
    memorySession = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* file:// / 部分本地预览可能写不进 localStorage，靠 URL 交接 */
    }
  }

  function clearSession() {
    memorySession = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function hasProfileAccess(session) {
    return !!(session && (session.loggedIn || session.skipped));
  }

  function normalizeLegacySession(session) {
    if (!session) return null;
    if (session.skipped && !session.loggedIn) return session;
    if (!session.loggedIn) {
      clearSession();
      return null;
    }
    return session;
  }

  /* 本地 file:// 或隔离预览下，各 HTML 的 localStorage 互不共享；用 URL 参数把登录态带到下一页 */
  function hydrateSessionFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      var raw = params.get(SESSION_HANDOFF_KEY);
      if (!raw) return;
      var data = JSON.parse(decodeURIComponent(raw));
      if (data && typeof data === 'object') writeSession(data);
      params.delete(SESSION_HANDOFF_KEY);
      var qs = params.toString();
      var clean = (page || 'profile.html') + (qs ? '?' + qs : '') + (window.location.hash || '');
      history.replaceState(null, '', clean);
    } catch (e) {}
  }

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return d || DEFAULT_MASKED;
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  function showToast(msg) {
    if (!toastEl) {
      window.alert(msg);
      return;
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.classList.remove('is-show');
    }, 2200);
  }

  function isAgreed() {
    return !!(agreeCheckbox && agreeCheckbox.checked);
  }

  function markAgreed() {
    if (agreeCheckbox) agreeCheckbox.checked = true;
  }

  function resolveNextPage() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next') || 'profile.html';
    var base = (next.split('?')[0] || '').toLowerCase();
    if (APP_PAGES.indexOf(base) < 0) next = 'profile.html';
    return next;
  }

  function buildLoginUrl(target, extraQuery) {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next');
    var url = target;
    var q = [];
    if (next) q.push('next=' + encodeURIComponent(next));
    if (extraQuery) q.push(extraQuery);
    if (q.length) url += '?' + q.join('&');
    return url;
  }

  function goTo(url) {
    try {
      window.location.assign(url);
    } catch (e1) {
      try {
        window.location.href = url;
      } catch (e2) {
        showToast('无法跳转，请用浏览器打开本页');
      }
    }
  }

  function redirectAfterAuth(session) {
    var next = resolveNextPage();
    var data = session || readSession();
    if (data) {
      var sep = next.indexOf('?') >= 0 ? '&' : '?';
      next += sep + SESSION_HANDOFF_KEY + '=' + encodeURIComponent(JSON.stringify(data));
    }
    goTo(next);
  }

  function redirectToLogin() {
    window.location.replace('login.html?next=' + encodeURIComponent(page || 'profile.html'));
  }

  function guardAppInterior() {
    if (!hasProfileAccess(normalizeLegacySession(readSession()))) {
      redirectToLogin();
      return false;
    }
    return true;
  }

  function applyProfile(session) {
    if (!isProfilePage) return;

    var guest = session && session.skipped && !session.loggedIn;
    var loggedIn = session && session.loggedIn;

    if (profileHeadEl) {
      profileHeadEl.classList.toggle('ua-profile-head--guest', !!guest);
    }
    if (profileNameEl) {
      profileNameEl.textContent = loggedIn
        ? (session.nickname || '冷丰用户')
        : guest
          ? '未登录'
          : '宁静致远';
    }
    if (profilePhoneEl) {
      if (loggedIn) {
        profilePhoneEl.textContent = session.phoneMasked || maskPhone(session.phone);
        profilePhoneEl.removeAttribute('role');
      } else if (guest) {
        profilePhoneEl.textContent = '点击登录';
        profilePhoneEl.setAttribute('role', 'button');
      } else {
        profilePhoneEl.textContent = '155****9061';
        profilePhoneEl.removeAttribute('role');
      }
    }
  }

  function completeLogin(phone, nickname) {
    var session = {
      loggedIn: true,
      phone: phone,
      phoneMasked: maskPhone(phone),
      nickname: nickname || '冷丰用户'
    };
    writeSession(session);
    redirectAfterAuth(session);
  }

  function completeWechatLogin() {
    var session = {
      loggedIn: true,
      loginMethod: 'wechat',
      nickname: '微信用户',
      phoneMasked: '微信已授权'
    };
    writeSession(session);
    redirectAfterAuth(session);
  }

  function completeSkip() {
    var session = { loggedIn: false, skipped: true };
    writeSession(session);
    redirectAfterAuth(session);
  }

  function handleOneClickLogin() {
    if (authNavigating) return;
    if (!isAgreed()) {
      showToast('请先阅读并同意相关协议');
      pendingOneClickAfterAgree = true;
      if (wechatAgreeModal) {
        wechatAgreeModal.hidden = false;
        return;
      }
      if (agreeCheckbox) {
        try {
          agreeCheckbox.focus();
        } catch (e) {}
      }
      return;
    }
    pendingOneClickAfterAgree = false;
    authNavigating = true;
    completeLogin(DEFAULT_PHONE, '宁静致远');
  }

  function resetSmsBtn() {
    if (!smsBtn) return;
    smsBtn.disabled = false;
    smsBtn.textContent = '获取验证码';
  }

  function startSmsCooldown() {
    smsLeft = SMS_COOLDOWN;
    if (!smsBtn) return;
    smsBtn.disabled = true;
    smsBtn.textContent = smsLeft + 's';
    clearInterval(smsTimer);
    smsTimer = setInterval(function () {
      smsLeft -= 1;
      if (smsLeft <= 0) {
        clearInterval(smsTimer);
        smsTimer = null;
        resetSmsBtn();
        return;
      }
      smsBtn.textContent = smsLeft + 's';
    }, 1000);
  }

  function bindOneClickLoginEvents() {
    if (oneClickBtn) {
      oneClickBtn.addEventListener('click', function (e) {
        e.preventDefault();
        handleOneClickLogin();
      });
    }

    if (wechatEntryBtn) {
      wechatEntryBtn.addEventListener('click', function () {
        pendingOneClickAfterAgree = false;
        if (wechatAgreeModal) wechatAgreeModal.hidden = false;
      });
    }

    if (phoneMethodBtn) {
      phoneMethodBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-phone.html'));
      });
    }

    if (wechatAgreeCancelBtn) {
      wechatAgreeCancelBtn.addEventListener('click', function () {
        pendingOneClickAfterAgree = false;
        if (wechatAgreeModal) wechatAgreeModal.hidden = true;
      });
    }

    if (wechatAgreeConfirmBtn) {
      wechatAgreeConfirmBtn.addEventListener('click', function () {
        markAgreed();
        if (wechatAgreeModal) wechatAgreeModal.hidden = true;
        if (pendingOneClickAfterAgree) {
          pendingOneClickAfterAgree = false;
          authNavigating = true;
          completeLogin(DEFAULT_PHONE, '宁静致远');
          return;
        }
        goTo(buildLoginUrl('login-wechat.html'));
      });
    }

    if (wechatAgreeModal) {
      wechatAgreeModal.addEventListener('click', function (e) {
        if (e.target === wechatAgreeModal) {
          pendingOneClickAfterAgree = false;
          wechatAgreeModal.hidden = true;
        }
      });
    }

    if (loginSkipBtn) {
      loginSkipBtn.addEventListener('click', completeSkip);
    }
  }

  function bindPhoneLoginEvents() {
    if (phoneBackBtn) {
      phoneBackBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }

    if (phoneSkipBtn) {
      phoneSkipBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }

    if (phoneWechatLinkBtn) {
      phoneWechatLinkBtn.addEventListener('click', function () {
        if (wechatAgreeModal) wechatAgreeModal.hidden = false;
      });
    }

    if (phoneOneClickLinkBtn) {
      phoneOneClickLinkBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }

    if (wechatAgreeCancelBtn) {
      wechatAgreeCancelBtn.addEventListener('click', function () {
        if (wechatAgreeModal) wechatAgreeModal.hidden = true;
      });
    }

    if (wechatAgreeConfirmBtn) {
      wechatAgreeConfirmBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login-wechat.html'));
      });
    }

    if (wechatAgreeModal) {
      wechatAgreeModal.addEventListener('click', function (e) {
        if (e.target === wechatAgreeModal) wechatAgreeModal.hidden = true;
      });
    }

    if (smsBtn) {
      smsBtn.addEventListener('click', function () {
        var phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
        if (phone.length !== 11) {
          showToast('请输入11位手机号');
          return;
        }
        startSmsCooldown();
        showToast('验证码已发送（演示）');
      });
    }

    if (phoneLoginBtn) {
      phoneLoginBtn.addEventListener('click', function () {
        if (!isAgreed()) {
          showToast('请先阅读并同意相关协议');
          return;
        }
        var phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
        var code = codeInput ? codeInput.value.replace(/\D/g, '') : '';
        if (phone.length !== 11) {
          showToast('请输入11位手机号');
          return;
        }
        if (code.length < 4) {
          showToast('请输入验证码');
          return;
        }
        completeLogin(phone, '冷丰用户');
      });
    }
  }

  function initLoginPage() {
    if (/[?&]logout=1(?:&|$)/.test(location.search)) {
      clearSession();
      try {
        history.replaceState(null, '', 'login.html');
      } catch (e) {}
    }

    if (/[?&]force=1(?:&|$)/.test(location.search)) {
      clearSession();
    }

    normalizeLegacySession(readSession());

    if (phoneDisplay) phoneDisplay.textContent = DEFAULT_MASKED;
    if (agreeCheckbox) agreeCheckbox.checked = false;
    bindOneClickLoginEvents();
  }

  function initPhoneLoginPage() {
    normalizeLegacySession(readSession());
    if (agreeCheckbox) agreeCheckbox.checked = false;
    bindPhoneLoginEvents();
  }

  function initWechatLoginPage() {
    normalizeLegacySession(readSession());

    if (wechatAuthBackBtn) {
      wechatAuthBackBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }

    if (wechatAuthCancelBtn) {
      wechatAuthCancelBtn.addEventListener('click', function () {
        goTo(buildLoginUrl('login.html'));
      });
    }

    if (wechatAuthAllowBtn) {
      wechatAuthAllowBtn.addEventListener('click', completeWechatLogin);
    }
  }

  function initProfilePage() {
    if (/[?&]logout=1(?:&|$)/.test(location.search)) {
      clearSession();
      goTo('login.html');
      return;
    }

    if (!guardAppInterior()) return;
    applyProfile(readSession());

    if (profilePhoneEl) {
      profilePhoneEl.addEventListener('click', function () {
        var current = readSession();
        if (current && current.skipped && !current.loggedIn) {
          goTo('login.html?next=profile.html&force=1');
        }
      });
    }
  }

  hydrateSessionFromQuery();

  if (isLoginPage) {
    initLoginPage();
  } else if (isPhoneLoginPage) {
    initPhoneLoginPage();
  } else if (isWechatLoginPage) {
    initWechatLoginPage();
  } else if (isProfilePage) {
    initProfilePage();
  } else if (isAppInterior) {
    if (/[?&]logout=1(?:&|$)/.test(location.search)) {
      clearSession();
      goTo('login.html');
      return;
    }
    guardAppInterior();
  }

  window.UaUserAuth = {
    readSession: function () {
      return normalizeLegacySession(readSession());
    },
    oneClickLogin: handleOneClickLogin,
    logout: function () {
      clearSession();
      goTo('login.html');
    }
  };
})();
