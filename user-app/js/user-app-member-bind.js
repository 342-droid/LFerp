/**
 * 用户 APP — 会员绑定和合并
 * 同一链接承载脑图各状态：验收开关写入 localStorage 后刷新；也可用 ?scene=&screen=&method=
 */
(function () {
  var STORAGE_KEY = 'ua_member_bind_demo_v1';

  var SCENES = [
    { id: 'terminal-unbound', label: '终端 + 未绑手机号' },
    { id: 'terminal-bound', label: '终端 + 已绑手机号' },
    { id: 'no-terminal-bound', label: '无终端 + 已绑手机号' }
  ];

  var SCREENS = [
    { id: 'bind', label: '绑定手机号' },
    { id: 'member-info', label: 'UnionID一致·会员信息只读' },
    { id: 'identity-select', label: '多身份选择' },
    { id: 'phone-occupied', label: '手机号已被他人绑定' },
    { id: 'register', label: '手机号未注册·去注册' },
    { id: 'success', label: '绑定成功（无弹窗）' },
    { id: 'verify-old', label: '旧手机号验证' },
    { id: 'change-phone', label: '换绑新手机号' },
    { id: 'conflict', label: '新号已绑他人·确认是否本人' },
    { id: 'merge-ask', label: '是否合并会员' },
    { id: 'merge-assets', label: '合并资产确认' },
    { id: 'merge-done', label: '合并完成' }
  ];

  var METHODS = [
    { id: 'sms', label: '验证码绑定' },
    { id: 'qr', label: '扫码绑定' },
    { id: 'admin', label: '后台一键绑定' }
  ];

  var TITLES = {
    bind: '绑定手机号',
    'member-info': '确认绑定',
    'identity-select': '选择会员身份',
    'phone-occupied': '绑定手机号',
    register: '账号注册',
    success: '绑定成功',
    'verify-old': '验证原手机号',
    'change-phone': '换绑手机号',
    conflict: '换绑手机号',
    'merge-ask': '换绑手机号',
    'merge-assets': '合并会员',
    'merge-done': '合并完成'
  };

  var VIEW_FOR_SCREEN = {
    bind: 'bind',
    'member-info': 'member-info',
    'identity-select': 'identity-select',
    'phone-occupied': 'bind',
    register: 'register',
    success: 'success',
    'verify-old': 'verify-old',
    'change-phone': 'change-phone',
    conflict: 'change-phone',
    'merge-ask': 'change-phone',
    'merge-assets': 'merge-assets',
    'merge-done': 'merge-done'
  };

  var DEFAULT_STATE = {
    scene: 'terminal-unbound',
    screen: 'bind',
    method: 'sms'
  };

  var smsTimers = {};

  function readState() {
    var state = Object.assign({}, DEFAULT_STATE);
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved && typeof saved === 'object') {
        if (saved.scene) state.scene = saved.scene;
        if (saved.screen) state.screen = saved.screen;
        if (saved.method) state.method = saved.method;
      }
    } catch (e) { /* ignore */ }
    try {
      var params = new URLSearchParams(window.location.search || '');
      if (params.get('scene')) state.scene = params.get('scene');
      if (params.get('screen')) state.screen = params.get('screen');
      if (params.get('method')) state.method = params.get('method');
    } catch (e2) { /* ignore */ }
    if (!SCENES.some(function (s) { return s.id === state.scene; })) state.scene = DEFAULT_STATE.scene;
    if (!SCREENS.some(function (s) { return s.id === state.screen; })) state.screen = DEFAULT_STATE.screen;
    if (!METHODS.some(function (s) { return s.id === state.method; })) state.method = DEFAULT_STATE.method;
    return state;
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function toast(msg) {
    var el = document.getElementById('mbToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove('is-show');
    }, 2200);
  }

  function hideModals() {
    ['mbOccupiedModal', 'mbConflictModal', 'mbMergeAskModal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  function showModal(id) {
    hideModals();
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function setMethodUi(method) {
    document.querySelectorAll('[data-mb-method]').forEach(function (btn) {
      btn.classList.toggle('is-on', btn.getAttribute('data-mb-method') === method);
    });
    var sms = document.getElementById('mbBindSms');
    var qr = document.getElementById('mbBindQr');
    var hint = document.getElementById('mbBindHint');
    var submit = document.getElementById('mbBindSubmit');
    if (sms) sms.hidden = method === 'qr';
    if (qr) qr.hidden = method !== 'qr';
    if (submit) {
      submit.textContent = method === 'qr' ? '授权并绑定' : method === 'admin' ? '一键绑定' : '绑定';
    }
    if (hint) {
      hint.textContent =
        method === 'admin'
          ? '后台一键绑定按 UnionID 一致处理：只展示会员信息，不可修改资料。'
          : method === 'qr'
            ? '扫码后校验 UnionID：一致则展示会员信息；不一致再按手机号是否已注册分支处理。'
            : '验证码绑定与后台一键绑定：若 UnionID 已匹配，仅展示会员信息，不可在此修改资料。';
    }
  }

  function applyScreen(state) {
    var viewId = VIEW_FOR_SCREEN[state.screen] || 'bind';
    var title = document.getElementById('mbTitle');
    if (title) title.textContent = TITLES[state.screen] || '绑定手机号';

    document.querySelectorAll('[data-mb-view]').forEach(function (view) {
      view.hidden = view.getAttribute('data-mb-view') !== viewId;
    });

    setMethodUi(state.method);
    hideModals();

    if (state.screen === 'phone-occupied') showModal('mbOccupiedModal');
    if (state.screen === 'conflict') showModal('mbConflictModal');
    if (state.screen === 'merge-ask') showModal('mbMergeAskModal');

    var successTitle = document.getElementById('mbSuccessTitle');
    var successDesc = document.getElementById('mbSuccessDesc');
    if (successTitle) successTitle.textContent = '绑定成功';
    if (successDesc) {
      successDesc.textContent = '首次绑定手机号已完成，无需额外弹窗提醒。';
    }

    var sourceEl = document.getElementById('mbMemberSource');
    if (sourceEl) {
      sourceEl.textContent = state.scene === 'no-terminal-bound' ? '小程序' : '终端开卡';
    }
  }

  function persistAndGo(patch) {
    var state = Object.assign(readState(), patch || {});
    writeState(state);
    var q =
      '?scene=' +
      encodeURIComponent(state.scene) +
      '&screen=' +
      encodeURIComponent(state.screen) +
      '&method=' +
      encodeURIComponent(state.method);
    try {
      var from = new URLSearchParams(window.location.search || '').get('from');
      if (from) q += '&from=' + encodeURIComponent(from);
    } catch (e) { /* ignore */ }
    window.location.replace('member-bind-merge.html' + q);
  }

  function startSms(kind, btn) {
    if (!btn || btn.disabled) return;
    toast('验证码已发送');
    var left = 60;
    btn.disabled = true;
    btn.textContent = left + 's';
    clearInterval(smsTimers[kind]);
    smsTimers[kind] = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        clearInterval(smsTimers[kind]);
        btn.disabled = false;
        btn.textContent = '获取验证码';
        return;
      }
      btn.textContent = left + 's';
    }, 1000);
  }

  function renderDemoPanel(state) {
    var old = document.getElementById('uaMbDemo');
    if (old) old.remove();
    var panel = document.createElement('div');
    panel.id = 'uaMbDemo';
    panel.className = 'ua-mb-demo';
    panel.innerHTML =
      '<div class="ua-mb-demo__title">会员绑定验收开关</div>' +
      '<label class="ua-mb-demo__row">场景' +
      '<select id="uaMbDemoScene">' +
      SCENES.map(function (s) {
        return (
          '<option value="' +
          s.id +
          '"' +
          (s.id === state.scene ? ' selected' : '') +
          '>' +
          s.label +
          '</option>'
        );
      }).join('') +
      '</select></label>' +
      '<label class="ua-mb-demo__row">当前界面' +
      '<select id="uaMbDemoScreen">' +
      SCREENS.map(function (s) {
        return (
          '<option value="' +
          s.id +
          '"' +
          (s.id === state.screen ? ' selected' : '') +
          '>' +
          s.label +
          '</option>'
        );
      }).join('') +
      '</select></label>' +
      '<label class="ua-mb-demo__row">入口方式' +
      '<select id="uaMbDemoMethod">' +
      METHODS.map(function (s) {
        return (
          '<option value="' +
          s.id +
          '"' +
          (s.id === state.method ? ' selected' : '') +
          '>' +
          s.label +
          '</option>'
        );
      }).join('') +
      '</select></label>' +
      '<button type="button" class="ua-mb-demo__apply" id="uaMbDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);

    document.getElementById('uaMbDemoApply').addEventListener('click', function () {
      persistAndGo({
        scene: document.getElementById('uaMbDemoScene').value,
        screen: document.getElementById('uaMbDemoScreen').value,
        method: document.getElementById('uaMbDemoMethod').value
      });
    });
  }

  function bindEvents(state) {
    if (window.UaNav) {
      window.UaNav.applyBackLink('#mbBack', 'settings.html');
    }

    document.querySelectorAll('[data-mb-method]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var method = btn.getAttribute('data-mb-method');
        var next = Object.assign(readState(), { method: method, screen: 'bind' });
        writeState(next);
        setMethodUi(method);
      });
    });

    document.querySelectorAll('[data-mb-sms]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startSms(btn.getAttribute('data-mb-sms'), btn);
      });
    });

    document.querySelectorAll('[data-mb-identity]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-mb-identity]').forEach(function (el) {
          el.classList.toggle('is-on', el === btn);
        });
      });
    });

    document.querySelectorAll('[data-mb-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        hideModals();
      });
    });

    var bindSubmit = document.getElementById('mbBindSubmit');
    if (bindSubmit) {
      bindSubmit.addEventListener('click', function () {
        var method = readState().method;
        if (method === 'sms') {
          var phone = ((document.getElementById('mbBindPhone') || {}).value || '').trim();
          var code = ((document.getElementById('mbBindCode') || {}).value || '').trim();
          if (!/^1\d{10}$/.test(phone)) {
            toast('请输入11位手机号');
            return;
          }
          if (!/^\d{6}$/.test(code)) {
            toast('请输入6位验证码');
            return;
          }
        }
        persistAndGo({ screen: 'member-info' });
      });
    }

    var infoConfirm = document.getElementById('mbInfoConfirm');
    if (infoConfirm) {
      infoConfirm.addEventListener('click', function () {
        persistAndGo({ screen: 'success' });
      });
    }

    var identityConfirm = document.getElementById('mbIdentityConfirm');
    if (identityConfirm) {
      identityConfirm.addEventListener('click', function () {
        persistAndGo({ screen: 'success' });
      });
    }

    var regSubmit = document.getElementById('mbRegSubmit');
    if (regSubmit) {
      regSubmit.addEventListener('click', function () {
        persistAndGo({ screen: 'success' });
      });
    }

    var successOk = document.getElementById('mbSuccessOk');
    if (successOk) {
      successOk.addEventListener('click', function () {
        if (window.UaNav) {
          window.location.href = window.UaNav.getBackHref('settings.html');
        } else {
          window.location.href = 'settings.html';
        }
      });
    }

    var oldSubmit = document.getElementById('mbOldSubmit');
    if (oldSubmit) {
      oldSubmit.addEventListener('click', function () {
        var code = ((document.getElementById('mbOldCode') || {}).value || '').trim();
        if (!/^\d{6}$/.test(code)) {
          toast('请输入6位验证码');
          return;
        }
        persistAndGo({ screen: 'change-phone' });
      });
    }

    var newSubmit = document.getElementById('mbNewSubmit');
    if (newSubmit) {
      newSubmit.addEventListener('click', function () {
        var phone = ((document.getElementById('mbNewPhone') || {}).value || '').trim();
        var code = ((document.getElementById('mbNewCode') || {}).value || '').trim();
        if (!/^1\d{10}$/.test(phone)) {
          toast('请输入11位手机号');
          return;
        }
        if (!/^\d{6}$/.test(code)) {
          toast('请输入6位验证码');
          return;
        }
        persistAndGo({ screen: 'conflict' });
      });
    }

    var conflictOk = document.getElementById('mbConflictOk');
    if (conflictOk) {
      conflictOk.addEventListener('click', function () {
        persistAndGo({ screen: 'merge-ask' });
      });
    }

    var mergeAskOk = document.getElementById('mbMergeAskOk');
    if (mergeAskOk) {
      mergeAskOk.addEventListener('click', function () {
        persistAndGo({ screen: 'merge-assets' });
      });
    }

    var mergeCancel = document.getElementById('mbMergeCancel');
    if (mergeCancel) {
      mergeCancel.addEventListener('click', function () {
        persistAndGo({ screen: 'change-phone' });
      });
    }

    var mergeConfirm = document.getElementById('mbMergeConfirm');
    if (mergeConfirm) {
      mergeConfirm.addEventListener('click', function () {
        persistAndGo({ screen: 'merge-done' });
      });
    }

    var mergeDoneOk = document.getElementById('mbMergeDoneOk');
    if (mergeDoneOk) {
      mergeDoneOk.addEventListener('click', function () {
        if (window.UaNav) {
          window.location.href = window.UaNav.getBackHref('settings.html');
        } else {
          window.location.href = 'settings.html';
        }
      });
    }
  }

  function init() {
    var state = readState();
    writeState(state);
    applyScreen(state);
    renderDemoPanel(state);
    bindEvents(state);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
