(function () {
  var payApi = window.StorePayPassword;
  var loginPwd = window.StoreAppLoginPwd;
  var STORAGE_LOGIN = 'sa_demo_login_pwd';
  var FAIL_DEMO_PAY = '000000';
  var FAIL_DEMO_LOGIN = 'Fail9x';
  /* 与设计稿一致的演示手机号掩码 */
  var DEMO_PHONE_MASK = '159****4315';
  var params = new URLSearchParams(window.location.search);
  var kindParam = params.get('kind') || 'login';
  var kind = kindParam === 'withdraw' || kindParam === 'pay' ? 'pay' : 'login';
  var isLogin = kind === 'login';
  var step = params.get('step') === 'reset' ? 'reset' : 'sms';
  var smsVerified = sessionStorage.getItem('sa_pwd_forgot_ok_' + kind) === '1';
  var loginPlaceholder =
    (loginPwd && loginPwd.PLACEHOLDER) || '6-16位，支持数字、字母、特殊字符';

  var titleEl = document.getElementById('pwdForgotTitle');
  var navEl = document.getElementById('pwdForgotNav');
  var backEl = document.getElementById('pwdForgotBack');
  var stepSms = document.getElementById('pwdForgotStepSms');
  var stepReset = document.getElementById('pwdForgotStepReset');
  var smsInput = document.getElementById('pwdForgotSmsInput');
  var smsHint = document.getElementById('pwdForgotSmsHint');
  var otpCells = document.getElementById('pwdForgotOtpCells');
  var smsBtn = document.getElementById('pwdForgotSmsBtn');
  var fieldsHost = document.getElementById('pwdForgotFields');
  var submitBtn = document.getElementById('pwdForgotSubmit');
  var keypad = document.getElementById('pwdForgotKeypad');
  var root = document.getElementById('pwdForgotRoot');

  var smsTimer = null;
  var smsSubmitting = false;
  var fields = [];
  var focusIdx = -1; /* -1 = 未选中，无高亮 */
  var loginKbd = null;

  function editHref() {
    return 'password-edit.html?kind=' + (isLogin ? 'login' : 'pay');
  }

  function setLoginPwd(value) {
    try {
      localStorage.setItem(STORAGE_LOGIN, value);
    } catch (e) {
      /* ignore */
    }
  }

  function setPayPwd(value) {
    if (payApi && typeof payApi.setPassword === 'function') {
      payApi.setPassword(value);
      return;
    }
    try {
      localStorage.setItem('sa_demo_pay_pwd', value);
    } catch (e) {
      /* ignore */
    }
  }

  function toast(msg, opts) {
    opts = opts || {};
    var shell = document.querySelector('.sa-pwd-shell');
    var el = document.querySelector('.sa-pwd-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-pwd-toast';
      (shell || document.body).appendChild(el);
    }
    el.className = 'sa-pwd-toast' + (opts.success ? ' sa-pwd-toast--success' : ' sa-pwd-toast--error');
    el.innerHTML =
      '<span class="sa-pwd-toast__icon" aria-hidden="true">' +
      (opts.success
        ? '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M7 12.5l3.2 3.2L17 8.8" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M8 8l8 8M16 8l-8 8" stroke="#111" stroke-width="2.2" stroke-linecap="round"/></svg>') +
      '</span><span class="sa-pwd-toast__text"></span>';
    var textEl = el.querySelector('.sa-pwd-toast__text');
    if (textEl) textEl.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, opts.ms || (opts.success ? 1400 : 1800));
  }

  function eyeSvg(visible) {
    if (visible) {
      return (
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
        '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/>' +
        '<circle cx="12" cy="12" r="2.5"/></svg>'
      );
    }
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
      '<path d="M3 3l18 18"/>' +
      '<path d="M10.6 10.6A2.5 2.5 0 0012 14.5a2.5 2.5 0 001.9-.8"/>' +
      '<path d="M6.1 6.2C3.9 7.7 2.3 10 2 12c.5 1.8 3.8 6 10 6 2.1 0 3.9-.5 5.4-1.2"/>' +
      '<path d="M14.1 9.1A5.8 5.8 0 0117.8 12"/>' +
      '<path d="M9.9 5.2A10.4 10.4 0 0112 5c6.2 0 9.5 4.2 10 6-.2.7-.7 1.7-1.5 2.7"/></svg>'
    );
  }

  function escapeAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** 登录密码输入展示：只读自定义键盘下用闪烁光标表示选中 */
  function loginTextFaceHtml(f, focused) {
    var val = String(f.value || '');
    var valHtml = '';
    var valCls = 'sa-pwd-text-face__val';
    if (val) {
      if (f.visible) valHtml = escapeHtml(val);
      else {
        valHtml = Array(val.length + 1).join('•');
        valCls += ' is-mask';
      }
    }
    var caret = focused ? '<span class="sa-pwd-caret" aria-hidden="true"></span>' : '';
    var ph = !val
      ? '<span class="sa-pwd-text-face__ph">' + escapeHtml(loginPlaceholder) + '</span>'
      : '';
    return (
      '<div class="sa-pwd-text-wrap">' +
      '<input class="sa-pwd-text-input sa-pwd-text-input--ghost" tabindex="-1" readonly aria-hidden="true" value="' +
      escapeAttr(val) +
      '">' +
      '<div class="sa-pwd-text-face">' +
      '<span class="' +
      valCls +
      '">' +
      valHtml +
      '</span>' +
      caret +
      ph +
      '</div></div>'
    );
  }

  function goStep(next) {
    var q = new URLSearchParams(window.location.search);
    q.set('kind', isLogin ? 'login' : 'pay');
    q.set('step', next);
    window.location.href = 'password-forgot.html?' + q.toString();
  }

  function readSmsCode() {
    return smsInput ? String(smsInput.value || '').replace(/\D/g, '').slice(0, 6) : '';
  }

  function syncOtpCells() {
    var code = readSmsCode();
    if (smsInput && smsInput.value !== code) smsInput.value = code;
    if (!otpCells) return;
    var cells = otpCells.querySelectorAll('[data-otp-cell]');
    var focusAt = Math.min(code.length, 5);
    for (var i = 0; i < cells.length; i++) {
      var ch = code.charAt(i);
      cells[i].textContent = ch || '';
      cells[i].classList.toggle('is-filled', !!ch);
      cells[i].classList.toggle('is-active', !ch && i === focusAt && document.activeElement === smsInput);
    }
  }

  function syncSmsUi() {
    syncOtpCells();
    if (readSmsCode().length === 6) trySubmitSms();
  }

  function smsRemain() {
    if (payApi && typeof payApi.smsRemainSec === 'function') return payApi.smsRemainSec();
    return 0;
  }

  function tickSmsBtn() {
    if (!smsBtn) return;
    var left = smsRemain();
    if (left > 0) {
      smsBtn.classList.add('is-cooldown');
      smsBtn.textContent = left + 's后重发';
      smsTimer = setTimeout(tickSmsBtn, 250);
      return;
    }
    smsBtn.classList.remove('is-cooldown');
    smsBtn.textContent = '重新获取';
  }

  function startSmsCountdown() {
    clearTimeout(smsTimer);
    tickSmsBtn();
  }

  function onSendSms(opts) {
    opts = opts || {};
    if (!smsBtn) return;
    /* 冷却中重复点击 → 操作频繁 */
    if (smsRemain() > 0) {
      if (!opts.silent) toast('操作频繁，请稍后再试');
      return;
    }
    if (!payApi || typeof payApi.sendSms !== 'function') {
      if (!opts.silent) toast('密码重置失败，请稍后再试');
      return;
    }
    payApi.sendSms();
    if (!opts.silent) toast('验证码已发送（演示码 123456）');
    startSmsCountdown();
  }

  function trySubmitSms() {
    if (smsSubmitting) return;
    var code = readSmsCode();
    if (code.length !== 6) return;
    if (!payApi || typeof payApi.verifySms !== 'function') {
      toast('密码重置失败，请稍后再试');
      return;
    }
    if (smsRemain() <= 0) {
      toast('验证码已失效，请重新获取');
      startSmsCountdown();
      return;
    }
    var sms = payApi.getSms && payApi.getSms();
    if (!sms) {
      toast('验证码已失效，请重新获取');
      return;
    }
    if (String(code) !== String(sms.code)) {
      toast('验证码错误，请重新输入');
      if (smsInput) {
        smsInput.value = '';
        syncOtpCells();
      }
      return;
    }
    smsSubmitting = true;
    payApi.verifySms(code);
    try {
      sessionStorage.setItem('sa_pwd_forgot_ok_' + kind, '1');
    } catch (e) {
      /* ignore */
    }
    goStep('reset');
  }

  function renderLoginResetFields() {
    if (!fieldsHost) return;
    fieldsHost.innerHTML = fields
      .map(function (f, idx) {
        var focused = idx === focusIdx;
        return (
          '<div class="sa-pwd-field sa-pwd-field--text sa-pwd-field--row-label' +
          (focused ? ' is-focus' : '') +
          '" data-field-idx="' +
          idx +
          '">' +
          '<span class="sa-pwd-field__label">' +
          f.label +
          '</span>' +
          '<div class="sa-pwd-field__row">' +
          loginTextFaceHtml(f, focused) +
          (f.value
            ? '<button type="button" class="sa-pwd-field__clear" data-clear-idx="' +
              idx +
              '" aria-label="清除">×</button>'
            : '') +
          '<button type="button" class="sa-pwd-field__eye" data-eye-idx="' +
          idx +
          '" aria-label="' +
          (f.visible ? '隐藏密码' : '显示密码') +
          '">' +
          eyeSvg(f.visible) +
          '</button></div></div>'
        );
      })
      .join('');
    syncResetSubmit();
  }

  function renderPayResetFields() {
    if (!fieldsHost) return;
    fieldsHost.innerHTML = fields
      .map(function (f, idx) {
        var slots = '';
        for (var i = 0; i < 6; i++) {
          var ch = f.value.charAt(i);
          var content = '';
          var cls = 'sa-pwd-field__slot';
          if (ch) {
            if (f.visible) content = ch;
            else {
              content = '●';
              cls += ' is-dot';
            }
          }
          slots += '<span class="' + cls + '">' + content + '</span>';
        }
        return (
          '<div class="sa-pwd-field' +
          (idx === focusIdx ? ' is-focus' : '') +
          '" data-field-idx="' +
          idx +
          '">' +
          '<span class="sa-pwd-field__label">' +
          f.label +
          '</span>' +
          '<div class="sa-pwd-field__row">' +
          '<div class="sa-pwd-field__slots">' +
          slots +
          '</div>' +
          '<button type="button" class="sa-pwd-field__eye" data-eye-idx="' +
          idx +
          '" aria-label="' +
          (f.visible ? '隐藏密码' : '显示密码') +
          '">' +
          eyeSvg(f.visible) +
          '</button></div></div>'
        );
      })
      .join('');
    syncResetSubmit();
  }

  function renderResetFields() {
    if (isLogin) renderLoginResetFields();
    else renderPayResetFields();
  }

  function syncResetSubmit() {
    if (!submitBtn) return;
    if (isLogin) {
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = !fields.every(function (f) {
      return f.value.length === 6;
    });
  }

  function clearFocus() {
    if (focusIdx < 0) return;
    focusIdx = -1;
    renderResetFields();
  }

  function ensureFocus() {
    if (focusIdx >= 0 && focusIdx < fields.length) return;
    var maxLen = isLogin ? 16 : 6;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].value.length < maxLen) {
        focusIdx = i;
        return;
      }
    }
    focusIdx = Math.max(0, fields.length - 1);
  }

  function appendLoginChar(ch) {
    if (!loginPwd || !loginPwd.isAllowedChar(ch)) return;
    ensureFocus();
    var f = fields[focusIdx];
    if (!f || f.value.length >= 16) return;
    f.value += ch;
    renderResetFields();
  }

  function inputDigit(d) {
    ensureFocus();
    var f = fields[focusIdx];
    if (!f) return;
    if (f.value.length >= 6) {
      if (focusIdx < fields.length - 1) {
        focusIdx += 1;
        f = fields[focusIdx];
      } else return;
    }
    if (f.value.length >= 6) return;
    f.value += d;
    if (f.value.length === 6 && focusIdx < fields.length - 1) focusIdx += 1;
    renderResetFields();
  }

  function deleteDigit() {
    if (focusIdx < 0) return;
    var f = fields[focusIdx];
    if (!f) return;
    if (!f.value.length && focusIdx > 0) {
      focusIdx -= 1;
      f = fields[focusIdx];
    }
    if (f.value.length) f.value = f.value.slice(0, -1);
    renderResetFields();
  }

  function onResetSubmit() {
    if (!submitBtn || submitBtn.disabled) return;
    var a = fields[0] ? fields[0].value : '';
    var b = fields[1] ? fields[1].value : '';

    if (isLogin) {
      if (!a) {
        toast('请输入新密码');
        return;
      }
      var ruleErr =
        loginPwd && typeof loginPwd.validateNewPassword === 'function'
          ? loginPwd.validateNewPassword(a)
          : '';
      if (ruleErr) {
        toast(ruleErr);
        return;
      }
      if (!b) {
        toast('请再次输入新密码');
        return;
      }
      if (a !== b) {
        toast('两次输入的密码不一致');
        return;
      }
      if (a === FAIL_DEMO_LOGIN) {
        toast('密码重置失败，请稍后再试');
        return;
      }
      setLoginPwd(a);
    } else {
      if (!a) {
        toast('请输入新密码');
        return;
      }
      if (!b) {
        toast('请再次输入新密码');
        return;
      }
      if (a !== b) {
        toast('两次输入的密码不一致');
        return;
      }
      if (!/^\d{6}$/.test(a) || a === FAIL_DEMO_PAY) {
        toast('密码重置失败，请稍后再试');
        return;
      }
      setPayPwd(a);
    }
    try {
      sessionStorage.removeItem('sa_pwd_forgot_ok_' + kind);
    } catch (e) {
      /* ignore */
    }
    toast('密码重置成功', { success: true, ms: 1400 });
    setTimeout(function () {
      window.location.href = 'password.html';
    }, 1200);
  }

  function initSmsStep() {
    var pageTitle = isLogin ? '忘记登录密码' : '忘记支付密码';
    if (titleEl) titleEl.textContent = pageTitle;
    document.title = pageTitle + ' · 门店APP';
    if (navEl) navEl.classList.add('sa-pwd-nav--otp');
    if (stepSms) stepSms.hidden = false;
    if (stepReset) stepReset.hidden = true;
    if (keypad) keypad.hidden = true;
    if (root) root.classList.remove('sa-pwd--login-text');
    if (backEl) backEl.setAttribute('href', editHref());
    if (smsHint) smsHint.textContent = '验证码发送至' + DEMO_PHONE_MASK;

    if (smsInput) {
      smsInput.addEventListener('input', syncSmsUi);
      smsInput.addEventListener('focus', syncOtpCells);
      smsInput.addEventListener('blur', syncOtpCells);
      smsInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') trySubmitSms();
      });
    }
    if (smsBtn) {
      smsBtn.addEventListener('click', function () {
        onSendSms();
      });
    }
    var otpWrap = document.getElementById('pwdForgotOtp');
    if (otpWrap && smsInput) {
      otpWrap.addEventListener('click', function () {
        smsInput.focus();
      });
    }

    /* 进入页自动发码，对齐「验证码已发送」态 */
    if (smsRemain() <= 0) onSendSms({ silent: true });
    syncOtpCells();
    startSmsCountdown();
    setTimeout(function () {
      if (smsInput) smsInput.focus();
    }, 80);
  }

  function mountLoginKeyboard() {
    if (!isLogin || !keypad || !loginPwd || typeof loginPwd.mountFullKeypad !== 'function') return;
    loginKbd = loginPwd.mountFullKeypad(keypad, {
      onChar: function (ch) {
        appendLoginChar(ch);
      },
      onDel: function () {
        deleteDigit();
      },
      onDone: function () {
        onResetSubmit();
      }
    });
  }

  function initResetStep() {
    if (!smsVerified) {
      goStep('sms');
      return;
    }
    if (titleEl) titleEl.textContent = isLogin ? '重置登录密码' : '重置支付密码';
    document.title = (titleEl ? titleEl.textContent : '重置密码') + ' · 门店APP';
    if (navEl) navEl.classList.remove('sa-pwd-nav--otp');
    if (stepSms) stepSms.hidden = true;
    if (stepReset) stepReset.hidden = false;
    if (keypad) keypad.hidden = false;
    if (root) root.classList.toggle('sa-pwd--login-text', !!isLogin);
    if (backEl) {
      backEl.setAttribute(
        'href',
        'password-forgot.html?kind=' + (isLogin ? 'login' : 'pay') + '&step=sms'
      );
    }

    /* 短信已在上一步完成，此处仅设新密码 + 确定密码 */
    fields = [
      { key: 'new', label: '新密码', value: '', visible: false },
      { key: 'confirm', label: '确定密码', value: '', visible: false }
    ];
    focusIdx = -1;
    renderResetFields();

    if (fieldsHost) {
      fieldsHost.addEventListener('click', function (e) {
        var clearBtn = e.target.closest('[data-clear-idx]');
        if (clearBtn) {
          var ci = Number(clearBtn.getAttribute('data-clear-idx'));
          if (fields[ci]) {
            fields[ci].value = '';
            focusIdx = ci;
            renderResetFields();
          }
          return;
        }
        var eye = e.target.closest('[data-eye-idx]');
        if (eye) {
          var ei = Number(eye.getAttribute('data-eye-idx'));
          if (fields[ei]) {
            fields[ei].visible = !fields[ei].visible;
            if (focusIdx !== ei) focusIdx = ei;
            renderResetFields();
          }
          return;
        }
        var box = e.target.closest('[data-field-idx]');
        if (box) {
          focusIdx = Number(box.getAttribute('data-field-idx'));
          renderResetFields();
        }
      });
    }

    if (isLogin) {
      mountLoginKeyboard();
    } else if (keypad) {
      keypad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-key]');
        if (!btn) return;
        var key = btn.getAttribute('data-key');
        if (key === 'del') deleteDigit();
        else if (/^\d$/.test(key)) inputDigit(key);
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-field-idx]')) return;
      if (e.target.closest('.sa-pwd-keypad')) return;
      clearFocus();
    });

    if (submitBtn) submitBtn.addEventListener('click', onResetSubmit);
  }

  if (titleEl) titleEl.textContent = isLogin ? '忘记登录密码' : '忘记支付密码';
  if (step === 'reset') initResetStep();
  else initSmsStep();
})();
