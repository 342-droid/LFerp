(function () {
  var STORAGE_KEY = 'ua_user_session_v1';
  var DEFAULT_PHONE = '15912344315';
  var DEFAULT_MASKED = '159****4315';
  var SMS_COOLDOWN = 60;
  var APP_PAGES = [
    'profile.html',
    'home.html',
    'orders.html',
    'order-detail-shipping.html',
    'order-detail-pickup.html'
  ];

  var page = (window.location.pathname.split('/').pop() || '').toLowerCase();
  var isLoginPage = page === 'login.html';
  var isPhoneLoginPage = page === 'login-phone.html';
  var isWechatLoginPage = page === 'login-wechat.html';
  var isProfilePage = page === 'profile.html';
  var isAppInterior = APP_PAGES.indexOf(page) >= 0;
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

  function readSession() {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn(session) {
    return !!(session && session.loggedIn);
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

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return d || DEFAULT_MASKED;
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.classList.remove('is-show');
    }, 2000);
  }

  function isAgreed() {
    return agreeCheckbox && agreeCheckbox.checked;
  }

  function requireAgreement() {
    if (isAgreed()) return true;
    showToast('请先阅读并同意相关协议');
    return false;
  }

  function resolveNextPage() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next') || 'profile.html';
    if (APP_PAGES.indexOf(next) < 0) next = 'profile.html';
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

  function redirectAfterAuth() {
    window.location.href = resolveNextPage();
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
    writeSession({
      loggedIn: true,
      phone: phone,
      phoneMasked: maskPhone(phone),
      nickname: nickname || '冷丰用户'
    });
    redirectAfterAuth();
  }

  function completeWechatLogin() {
    writeSession({
      loggedIn: true,
      loginMethod: 'wechat',
      nickname: '微信用户',
      phoneMasked: '微信已授权'
    });
    redirectAfterAuth();
  }

  function completeSkip() {
    writeSession({ loggedIn: false, skipped: true });
    redirectAfterAuth();
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
      oneClickBtn.addEventListener('click', function () {
        if (!requireAgreement()) return;
        completeLogin(DEFAULT_PHONE, '宁静致远');
      });
    }

    if (wechatEntryBtn) {
      wechatEntryBtn.addEventListener('click', function () {
        if (wechatAgreeModal) wechatAgreeModal.hidden = false;
      });
    }

    if (phoneMethodBtn) {
      phoneMethodBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login-phone.html');
      });
    }

    if (wechatAgreeCancelBtn) {
      wechatAgreeCancelBtn.addEventListener('click', function () {
        if (wechatAgreeModal) wechatAgreeModal.hidden = true;
      });
    }

    if (wechatAgreeConfirmBtn) {
      wechatAgreeConfirmBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login-wechat.html');
      });
    }

    if (wechatAgreeModal) {
      wechatAgreeModal.addEventListener('click', function (e) {
        if (e.target === wechatAgreeModal) wechatAgreeModal.hidden = true;
      });
    }

    if (loginSkipBtn) {
      loginSkipBtn.addEventListener('click', completeSkip);
    }
  }

  function bindPhoneLoginEvents() {
    if (phoneBackBtn) {
      phoneBackBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login.html');
      });
    }

    if (phoneSkipBtn) {
      phoneSkipBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login.html');
      });
    }

    if (phoneWechatLinkBtn) {
      phoneWechatLinkBtn.addEventListener('click', function () {
        if (wechatAgreeModal) wechatAgreeModal.hidden = false;
      });
    }

    if (phoneOneClickLinkBtn) {
      phoneOneClickLinkBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login.html');
      });
    }

    if (wechatAgreeCancelBtn) {
      wechatAgreeCancelBtn.addEventListener('click', function () {
        if (wechatAgreeModal) wechatAgreeModal.hidden = true;
      });
    }

    if (wechatAgreeConfirmBtn) {
      wechatAgreeConfirmBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login-wechat.html');
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
        if (!requireAgreement()) return;
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
      history.replaceState(null, '', 'login.html');
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
        window.location.href = buildLoginUrl('login.html');
      });
    }

    if (wechatAuthCancelBtn) {
      wechatAuthCancelBtn.addEventListener('click', function () {
        window.location.href = buildLoginUrl('login.html');
      });
    }

    if (wechatAuthAllowBtn) {
      wechatAuthAllowBtn.addEventListener('click', completeWechatLogin);
    }
  }

  function initProfilePage() {
    if (/[?&]logout=1(?:&|$)/.test(location.search)) {
      clearSession();
      window.location.href = 'login.html';
      return;
    }

    if (!guardAppInterior()) return;
    applyProfile(readSession());

    if (profilePhoneEl) {
      profilePhoneEl.addEventListener('click', function () {
        var current = readSession();
        if (current && current.skipped && !current.loggedIn) {
          window.location.href = 'login.html?next=profile.html&force=1';
        }
      });
    }
  }

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
      window.location.href = 'login.html';
      return;
    }
    guardAppInterior();
  }

  window.UaUserAuth = {
    readSession: function () {
      return normalizeLegacySession(readSession());
    },
    logout: function () {
      clearSession();
      window.location.href = 'login.html';
    }
  };
})();
