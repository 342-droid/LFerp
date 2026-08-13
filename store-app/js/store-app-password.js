(function () {
  var payApi = window.StorePayPassword;
  var loginPwd = window.StoreAppLoginPwd;
  var STORAGE_LOGIN = 'sa_demo_login_pwd';
  /* 默认登录密码：字母+数字两类，无连续 4 位 */
  var DEFAULT_LOGIN = 'Lf8k3m';
  /* 演示失败码（支付：6 位；登录：符合格式） */
  var FAIL_DEMO_PAY = '000000';
  var FAIL_DEMO_LOGIN = 'Fail9x';

  function getLoginPwd() {
    try {
      return localStorage.getItem(STORAGE_LOGIN) || DEFAULT_LOGIN;
    } catch (e) {
      return DEFAULT_LOGIN;
    }
  }

  function setLoginPwd(value) {
    try {
      localStorage.setItem(STORAGE_LOGIN, value);
    } catch (e) {
      /* ignore */
    }
  }

  function getPayPwd() {
    if (payApi) return payApi.getPassword() || '';
    try {
      return localStorage.getItem('sa_demo_pay_pwd') || localStorage.getItem('sa_demo_withdraw_pwd') || '';
    } catch (e) {
      return '';
    }
  }

  function setPayPwd(value) {
    if (payApi) {
      payApi.setPassword(value);
      return;
    }
    try {
      localStorage.setItem('sa_demo_pay_pwd', value);
    } catch (e) {
      /* ignore */
    }
  }

  function toast(msg, ms) {
    var shell = document.querySelector('.sa-pwd-shell');
    var el = document.querySelector('.sa-pwd-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-pwd-toast';
      (shell || document.body).appendChild(el);
    }
    el.className = 'sa-pwd-toast';
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, ms || 1800);
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

  var params = new URLSearchParams(window.location.search);
  var kindParam = params.get('kind') || 'login';
  var kind = kindParam === 'withdraw' || kindParam === 'pay' ? 'pay' : 'login';
  var paySet = kind === 'pay' && !!getPayPwd();
  var mode = kind === 'login' ? 'modify' : paySet ? 'modify' : 'set';
  var isLogin = kind === 'login';

  var fields = [];
  if (mode === 'set') {
    fields = [
      { key: 'new', label: '设置支付密码', value: '', visible: true },
      { key: 'confirm', label: '确认新密码', value: '', visible: false }
    ];
  } else if (kind === 'pay') {
    fields = [
      { key: 'old', label: '输入旧的支付密码', value: '', visible: false },
      { key: 'new', label: '设置支付密码', value: '', visible: false },
      { key: 'confirm', label: '确认新密码', value: '', visible: false }
    ];
  } else {
    fields = [
      { key: 'old', label: '原密码', value: '', visible: false },
      { key: 'new', label: '新密码', value: '', visible: false },
      { key: 'confirm', label: '确定密码', value: '', visible: false }
    ];
  }

  var focusIdx = -1; /* -1 = 未选中，无高亮 */
  var loginKbd = null;
  var loginPlaceholder =
    (loginPwd && loginPwd.PLACEHOLDER) || '6-16位，支持数字、字母、特殊字符';

  var titleMap = {
    'login-modify': '修改登录密码',
    'pay-set': '设置支付密码',
    'pay-modify': '修改支付密码'
  };
  var leadMap = {
    'login-modify': '',
    'pay-set': '设置您的支付密码',
    'pay-modify': '修改您的支付密码'
  };
  var sceneKey = kind + '-' + mode;

  var titleEl = document.getElementById('pwdPageTitle');
  var leadEl = document.getElementById('pwdLead');
  var host = document.getElementById('pwdFields');
  var submitBtn = document.getElementById('pwdSubmit');
  var forgotBtn = document.getElementById('pwdForgot');
  var keypad = document.getElementById('pwdKeypad');
  var editRoot = document.querySelector('.sa-pwd--edit');

  if (titleEl) titleEl.textContent = titleMap[sceneKey] || '密码管理';
  if (leadEl) {
    var leadText = leadMap[sceneKey] || '';
    leadEl.textContent = leadText;
    leadEl.hidden = !leadText;
  }
  document.title = (titleMap[sceneKey] || '密码管理') + ' · 门店APP';
  if (forgotBtn) {
    forgotBtn.hidden = !(isLogin || (kind === 'pay' && mode === 'modify'));
  }
  if (keypad) keypad.hidden = false;
  if (editRoot) {
    editRoot.classList.toggle('sa-pwd--login-text', !!isLogin);
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

  function renderLoginFields() {
    if (!host) return;
    host.innerHTML = fields
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
          '</button>' +
          '</div></div>'
        );
      })
      .join('');
    syncSubmit();
  }

  function renderPayFields() {
    if (!host) return;
    host.innerHTML = fields
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
    syncSubmit();
  }

  function renderFields() {
    if (isLogin) renderLoginFields();
    else renderPayFields();
  }

  function syncSubmit() {
    if (!submitBtn) return;
    /* 登录密码：始终可点，空值/规则在提交时按表提示 */
    if (isLogin) {
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = !fields.every(function (f) {
      return f.value.length === 6;
    });
  }

  function setFocus(idx) {
    if (idx == null || idx < 0) focusIdx = -1;
    else focusIdx = Math.max(0, Math.min(fields.length - 1, idx));
    renderFields();
  }

  function clearFocus() {
    if (focusIdx < 0) return;
    focusIdx = -1;
    renderFields();
  }

  /** 键盘输入时若无选中行，落到第一个未填满字段 */
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
    renderFields();
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
    renderFields();
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
    renderFields();
  }

  function fieldByKey(key) {
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].key === key) return fields[i];
    }
    return null;
  }

  function onSubmitLogin() {
    var oldF = fieldByKey('old');
    var newF = fieldByKey('new');
    var confirmF = fieldByKey('confirm');
    var oldVal = oldF ? oldF.value : '';
    var next = newF ? newF.value : '';
    var confirm = confirmF ? confirmF.value : '';

    if (!oldVal) {
      toast('请输入原密码');
      return;
    }
    if (oldVal !== getLoginPwd()) {
      toast('原密码错误，请重新输入');
      return;
    }
    if (!next) {
      toast('请输入新密码');
      return;
    }
    var ruleErr =
      loginPwd && typeof loginPwd.validateNewPassword === 'function'
        ? loginPwd.validateNewPassword(next)
        : '';
    if (ruleErr) {
      toast(ruleErr);
      return;
    }
    if (next === oldVal) {
      toast('新密码不能与原密码相同');
      return;
    }
    if (!confirm) {
      toast('请再次输入新密码');
      return;
    }
    if (next !== confirm) {
      toast('两次输入的密码不一致');
      return;
    }
    if (next === FAIL_DEMO_LOGIN) {
      toast('密码重置失败，请稍后再试');
      return;
    }
    setLoginPwd(next);
    toast('密码重置成功');
    setTimeout(function () {
      window.location.href = 'password.html';
    }, 900);
  }

  function onSubmit() {
    if (submitBtn && submitBtn.disabled) return;
    if (isLogin) {
      onSubmitLogin();
      return;
    }

    var oldF = fieldByKey('old');
    var newF = fieldByKey('new');
    var confirmF = fieldByKey('confirm');
    var next = newF ? newF.value : '';
    var confirm = confirmF ? confirmF.value : '';

    if (mode === 'set') {
      if (next !== confirm) {
        toast('两次输入的密码不一致');
        return;
      }
      if (next === FAIL_DEMO_PAY) {
        toast('密码重置失败，请稍后再试');
        return;
      }
      setPayPwd(next);
      toast('密码重置成功');
      setTimeout(function () {
        window.location.href = 'password.html';
      }, 900);
      return;
    }

    var stored = getPayPwd();
    if (oldF && !oldF.value) {
      toast('请输入原密码');
      return;
    }
    if (oldF && oldF.value !== stored) {
      toast('原密码错误，请重新输入');
      return;
    }
    if (!next) {
      toast('请输入新密码');
      return;
    }
    if (!confirm) {
      toast('请再次输入新密码');
      return;
    }
    if (next !== confirm) {
      toast('两次输入的密码不一致');
      return;
    }
    if (next === FAIL_DEMO_PAY) {
      toast('密码重置失败，请稍后再试');
      return;
    }
    setPayPwd(next);
    toast('密码重置成功');
    setTimeout(function () {
      window.location.href = 'password.html';
    }, 900);
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
        onSubmit();
      }
    });
  }

  if (host) {
    host.addEventListener('click', function (e) {
      var clearBtn = e.target.closest('[data-clear-idx]');
      if (clearBtn && isLogin) {
        var ci = Number(clearBtn.getAttribute('data-clear-idx'));
        if (fields[ci]) {
          fields[ci].value = '';
          focusIdx = ci;
          renderFields();
        }
        return;
      }
      var eye = e.target.closest('[data-eye-idx]');
      if (eye) {
        e.stopPropagation();
        var ei = Number(eye.getAttribute('data-eye-idx'));
        if (fields[ei]) {
          fields[ei].visible = !fields[ei].visible;
          if (focusIdx !== ei) focusIdx = ei;
          renderFields();
        }
        return;
      }
      var box = e.target.closest('[data-field-idx]');
      if (box) setFocus(Number(box.getAttribute('data-field-idx')));
    });
  }

  if (keypad && !isLogin) {
    keypad.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-key]');
      if (!btn) return;
      var key = btn.getAttribute('data-key');
      if (key === 'del') deleteDigit();
      else if (/^\d$/.test(key)) inputDigit(key);
    });
  }

  /* 点输入框 / 键盘以外区域 → 取消高亮 */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-field-idx]')) return;
    if (e.target.closest('.sa-pwd-keypad')) return;
    clearFocus();
  });

  if (submitBtn) submitBtn.addEventListener('click', onSubmit);

  if (forgotBtn) {
    forgotBtn.addEventListener('click', function () {
      window.location.href =
        'password-forgot.html?kind=' + (isLogin ? 'login' : 'pay') + '&step=sms';
    });
  }

  renderFields();
  mountLoginKeyboard();
})();
