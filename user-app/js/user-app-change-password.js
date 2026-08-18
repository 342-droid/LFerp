/**
 * 用户 APP — 个人中心 设置/修改密码
 * 样式与登录侧设置密码页一致；设置与修改仅标题不同；手机号取当前登录账号且不可改
 */
(function () {
  var SMS_COOLDOWN = 60;
  var SMS_TTL_MS = 5 * 60 * 1000;
  var smsTimer = null;
  var smsLeft = 0;
  var smsSentAt = 0;

  function toast(msg) {
    if (window.UaPwdAuth && typeof window.UaPwdAuth.showToast === 'function') {
      window.UaPwdAuth.showToast(msg);
      return;
    }
    if (window.UaAccountCancel && window.UaAccountCancel.showToast) {
      window.UaAccountCancel.showToast(msg);
      return;
    }
    alert(msg);
  }

  function validPassword(pwd) {
    if (window.UaPwdAuth && typeof window.UaPwdAuth.validPassword === 'function') {
      return window.UaPwdAuth.validPassword(pwd);
    }
    if (!pwd || pwd.length < 6 || pwd.length > 12) return false;
    return /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
  }

  function resetSmsBtn(btn) {
    btn.disabled = false;
    btn.textContent = '获取验证码';
  }

  function startSms(btn) {
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

  function init() {
    var isSetMode = false;
    try {
      isSetMode = String(new URLSearchParams(window.location.search).get('scene') || '') === 'set';
    } catch (e) {}

    var titleEl = document.getElementById('pwdPageTitle');
    if (isSetMode) {
      if (titleEl) titleEl.textContent = '设置密码';
      document.title = '设置密码 · 用户 APP';
    } else if (titleEl) {
      titleEl.textContent = '修改密码';
    }

    if (window.UaNav) {
      window.UaNav.applyBackLink('#pwdBackBtn', 'settings.html');
    }

    var phoneEl = document.getElementById('pwdPhone');
    var sessionPhone = '';
    if (phoneEl) {
      try {
        var session = window.UaUserAuth && window.UaUserAuth.readSession
          ? window.UaUserAuth.readSession()
          : JSON.parse(localStorage.getItem('ua_user_session_v1') || 'null');
        if (session && session.phone) {
          sessionPhone = String(session.phone).replace(/\D/g, '');
          phoneEl.value = sessionPhone;
        }
      } catch (e) {}
      phoneEl.readOnly = true;
    }

    function currentPhone() {
      return sessionPhone || ((document.getElementById('pwdPhone') || {}).value || '').replace(/\D/g, '');
    }

    var eyeBtn = document.getElementById('pwdEye');
    var pwdInput = document.getElementById('pwdNew');
    if (eyeBtn && pwdInput) {
      eyeBtn.addEventListener('click', function () {
        var show = pwdInput.type === 'password';
        pwdInput.type = show ? 'text' : 'password';
        eyeBtn.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
        eyeBtn.classList.toggle('is-on', show);
      });
    }

    var smsBtn = document.getElementById('pwdSmsBtn');
    var submitBtn = document.getElementById('pwdSubmit');

    if (smsBtn) {
      smsBtn.addEventListener('click', function () {
        var phone = currentPhone();
        if (phone.length !== 11) {
          toast(isSetMode ? '当前账号未绑定手机号，无法设置密码' : '当前账号未绑定手机号，无法修改密码');
          return;
        }
        toast('验证码已发送（演示：123456）');
        smsSentAt = Date.now();
        startSms(smsBtn);
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var phone = currentPhone();
        var code = ((document.getElementById('pwdCode') || {}).value || '').trim();
        var pwd = ((document.getElementById('pwdNew') || {}).value || '');

        if (phone.length !== 11) {
          toast(isSetMode ? '当前账号未绑定手机号，无法设置密码' : '当前账号未绑定手机号，无法修改密码');
          return;
        }
        if (!smsSentAt) {
          toast('请先获取验证码');
          return;
        }
        if (Date.now() - smsSentAt > SMS_TTL_MS) {
          toast('验证码已过期，请重新获取');
          return;
        }
        if (!code) {
          toast('请输入验证码');
          return;
        }
        if (code !== '123456') {
          toast('验证码错误或已过期');
          return;
        }
        if (!validPassword(pwd)) {
          toast('密码需 6-12 位，且同时包含字母和数字');
          return;
        }
        if (window.UaPwdAuth && typeof window.UaPwdAuth.setPassword === 'function') {
          window.UaPwdAuth.setPassword(phone, pwd);
        }
        toast(isSetMode ? '密码设置成功' : '密码修改成功');
        setTimeout(function () {
          var back = window.UaNav ? window.UaNav.getBackHref('settings.html') : 'settings.html';
          window.location.href = back;
        }, 800);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
