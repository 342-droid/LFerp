(function () {
  var payApi = window.StorePayPassword;
  var STORAGE_LOGIN = 'sa_demo_login_pwd';
  var DEFAULT_LOGIN = '123456';
  /* 新密码为 000000 时演示「设置/重置失败」 */
  var FAIL_DEMO = '000000';

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
  /* withdraw 兼容旧链接，统一为支付密码 */
  var kind = kindParam === 'withdraw' || kindParam === 'pay' ? 'pay' : 'login';
  var paySet = kind === 'pay' && !!getPayPwd();
  var mode = kind === 'login' ? 'modify' : paySet ? 'modify' : 'set';

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
      { key: 'old', label: '输入旧的登录密码', value: '', visible: false },
      { key: 'new', label: '设置登录密码', value: '', visible: false },
      { key: 'confirm', label: '确认新密码', value: '', visible: false }
    ];
  }

  var focusIdx = 0;

  var titleMap = {
    'login-modify': '修改登录密码',
    'pay-set': '设置支付密码',
    'pay-modify': '修改支付密码'
  };
  var leadMap = {
    'login-modify': '修改您的登录密码',
    'pay-set': '设置您的支付密码',
    'pay-modify': '修改您的支付密码'
  };
  var sceneKey = kind + '-' + mode;

  var titleEl = document.getElementById('pwdPageTitle');
  var leadEl = document.getElementById('pwdLead');
  var host = document.getElementById('pwdFields');
  var submitBtn = document.getElementById('pwdSubmit');
  var keypad = document.getElementById('pwdKeypad');

  if (titleEl) titleEl.textContent = titleMap[sceneKey] || '密码管理';
  if (leadEl) leadEl.textContent = leadMap[sceneKey] || '';
  document.title = (titleMap[sceneKey] || '密码管理') + ' · 门店APP';

  function renderFields() {
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
          '</button>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');
    syncSubmit();
  }

  function syncSubmit() {
    if (!submitBtn) return;
    submitBtn.disabled = !fields.every(function (f) {
      return f.value.length === 6;
    });
  }

  function setFocus(idx) {
    focusIdx = Math.max(0, Math.min(fields.length - 1, idx));
    renderFields();
  }

  function inputDigit(d) {
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

  function onSubmit() {
    if (submitBtn && submitBtn.disabled) return;
    var oldF = fieldByKey('old');
    var newF = fieldByKey('new');
    var confirmF = fieldByKey('confirm');
    var next = newF ? newF.value : '';
    var confirm = confirmF ? confirmF.value : '';

    if (mode === 'set') {
      if (next !== confirm) {
        toast('密码不一致，请重新输入！');
        return;
      }
      if (next === FAIL_DEMO) {
        toast('密码设置失败，请重新操作！');
        return;
      }
      setPayPwd(next);
      toast('设置成功！');
      setTimeout(function () {
        window.location.href = 'password.html';
      }, 900);
      return;
    }

    var stored = kind === 'pay' ? getPayPwd() : getLoginPwd();
    if (oldF && oldF.value !== stored) {
      toast('旧密码有误！');
      return;
    }
    if (next !== confirm) {
      toast('新密码不一致，请重新输入！');
      return;
    }
    if (next === FAIL_DEMO) {
      toast('密码重置失败，请重新操作！');
      return;
    }
    if (kind === 'pay') setPayPwd(next);
    else setLoginPwd(next);
    toast('设置成功！');
    setTimeout(function () {
      window.location.href = 'password.html';
    }, 900);
  }

  if (host) {
    host.addEventListener('click', function (e) {
      var eye = e.target.closest('[data-eye-idx]');
      if (eye) {
        e.stopPropagation();
        var ei = Number(eye.getAttribute('data-eye-idx'));
        if (fields[ei]) {
          fields[ei].visible = !fields[ei].visible;
          renderFields();
        }
        return;
      }
      var box = e.target.closest('[data-field-idx]');
      if (box) setFocus(Number(box.getAttribute('data-field-idx')));
    });
  }

  if (keypad) {
    keypad.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-key]');
      if (!btn) return;
      var key = btn.getAttribute('data-key');
      if (key === 'del') deleteDigit();
      else if (/^\d$/.test(key)) inputDigit(key);
    });
  }

  if (submitBtn) submitBtn.addEventListener('click', onSubmit);

  renderFields();
})();
