/**
 * 用户 APP — 修改密码（6-12 位字母+数字；验证码 60s 冷却）
 */
(function () {
  var SMS_COOLDOWN = 60;
  var smsTimer = null;
  var smsLeft = 0;

  function toast(msg) {
    if (window.UaAccountCancel && window.UaAccountCancel.showToast) {
      window.UaAccountCancel.showToast(msg);
      return;
    }
    alert(msg);
  }

  function validPassword(pwd) {
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
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-pe-nav__back', 'settings.html');
    }

    var smsBtn = document.getElementById('pwdSmsBtn');
    var submitBtn = document.getElementById('pwdSubmit');

    if (smsBtn) {
      smsBtn.addEventListener('click', function () {
        var phone = ((document.getElementById('pwdPhone') || {}).value || '').replace(/\D/g, '');
        if (phone.length !== 11) {
          toast('请输入正确的手机号');
          return;
        }
        toast('验证码已发送（演示：123456）');
        startSms(smsBtn);
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var phone = ((document.getElementById('pwdPhone') || {}).value || '').replace(/\D/g, '');
        var code = ((document.getElementById('pwdCode') || {}).value || '').trim();
        var pwd = ((document.getElementById('pwdNew') || {}).value || '');
        var confirm = ((document.getElementById('pwdConfirm') || {}).value || '');

        if (phone.length !== 11) {
          toast('请输入正确的手机号');
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
        if (pwd !== confirm) {
          toast('两次输入的密码不一致');
          return;
        }
        toast('密码修改成功');
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
