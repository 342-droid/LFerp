(function () {
  var api = window.StorePayPassword;
  var wallet = window.StoreWalletDemo;
  if (!api) return;

  var FAIL_DEMO = '000000';
  var params = new URLSearchParams(window.location.search);
  var step = params.get('step') || 'set'; /* set | reset | sms | verify */
  var fromAction = params.get('from') || ''; /* withdraw | recharge */
  var returnUrl = params.get('return') || '';

  var state = {
    fields: [],
    focusIdx: 0,
    smsCode: '',
    smsVisible: false,
    smsLeft: 0,
    smsTimer: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, ms) {
    var shell = document.querySelector('.ua-pp-page');
    var el = document.querySelector('.ua-pp-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ua-pp-toast';
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

  function decodeReturn() {
    if (!returnUrl) {
      if (fromAction === 'recharge') return 'store-recharge.html' + keepFromQuery();
      if (fromAction === 'withdraw') return 'store-withdraw.html' + keepFromQuery();
      return 'store-wallet.html' + keepFromQuery();
    }
    try {
      return decodeURIComponent(returnUrl);
    } catch (e) {
      return returnUrl;
    }
  }

  function keepFromQuery() {
    /* from=withdraw|recharge 是业务来源；门店入口用 appFrom */
    var from = params.get('appFrom') || '';
    return from ? '?from=' + encodeURIComponent(from) : '';
  }

  function walletQuery(extra) {
    var q = new URLSearchParams();
    var appFrom = params.get('appFrom') || '';
    if (appFrom) q.set('from', appFrom);
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        if (extra[k] != null && extra[k] !== '') q.set(k, extra[k]);
      });
    }
    var s = q.toString();
    return s ? '?' + s : '';
  }

  function setupBack() {
    var back = $('ppBack');
    if (!back) return;
    back.setAttribute('href', decodeReturn());
  }

  function renderSlots(value, visible) {
    var html = '';
    for (var i = 0; i < 6; i++) {
      var ch = value.charAt(i);
      var cls = 'ua-pp-field__slot';
      var content = '';
      if (ch) {
        if (visible) content = ch;
        else {
          content = '●';
          cls += ' is-dot';
        }
      }
      html += '<span class="' + cls + '">' + content + '</span>';
    }
    return html;
  }

  function renderPwdFields(hostId, fields, focusIdx, withEye) {
    var host = $(hostId);
    if (!host) return;
    host.innerHTML = fields
      .map(function (f, idx) {
        return (
          '<div class="ua-pp-field' +
          (idx === focusIdx ? ' is-focus' : '') +
          '" data-field-idx="' +
          idx +
          '">' +
          '<span class="ua-pp-field__label">' +
          f.label +
          '</span>' +
          '<div class="ua-pp-field__row">' +
          '<div class="ua-pp-field__slots">' +
          renderSlots(f.value, f.visible) +
          '</div>' +
          (withEye
            ? '<button type="button" class="ua-pp-field__eye" data-eye-idx="' +
              idx +
              '" aria-label="' +
              (f.visible ? '隐藏密码' : '显示密码') +
              '">' +
              eyeSvg(f.visible) +
              '</button>'
            : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function syncSubmit(btn, ok) {
    if (btn) btn.disabled = !ok;
  }

  function allFilled(fields) {
    return fields.every(function (f) {
      return f.value.length === 6;
    });
  }

  function bindFieldHost(hostId, fields, getFocus, setFocus, onChange) {
    var host = $(hostId);
    if (!host) return;
    host.addEventListener('click', function (e) {
      var eye = e.target.closest('[data-eye-idx]');
      if (eye) {
        e.stopPropagation();
        var ei = Number(eye.getAttribute('data-eye-idx'));
        if (fields[ei]) {
          fields[ei].visible = !fields[ei].visible;
          onChange();
        }
        return;
      }
      var box = e.target.closest('[data-field-idx]');
      if (box) {
        setFocus(Number(box.getAttribute('data-field-idx')));
        onChange();
      }
    });
  }

  function inputToFields(fields, focusIdx, d) {
    var f = fields[focusIdx];
    if (!f) return focusIdx;
    if (f.value.length >= 6) {
      if (focusIdx < fields.length - 1) {
        focusIdx += 1;
        f = fields[focusIdx];
      } else return focusIdx;
    }
    if (f.value.length >= 6) return focusIdx;
    f.value += d;
    if (f.value.length === 6 && focusIdx < fields.length - 1) focusIdx += 1;
    return focusIdx;
  }

  function delFromFields(fields, focusIdx) {
    var f = fields[focusIdx];
    if (!f) return focusIdx;
    if (!f.value.length && focusIdx > 0) {
      focusIdx -= 1;
      f = fields[focusIdx];
    }
    if (f.value.length) f.value = f.value.slice(0, -1);
    return focusIdx;
  }

  function finishPendingAfterAuth() {
    var pending = api.getPending();
    if (!pending || !wallet) {
      toast('设置成功！');
      setTimeout(function () {
        window.location.href = decodeReturn();
      }, 900);
      return;
    }
    if (pending.action === 'withdraw' && typeof wallet.applyWithdraw === 'function') {
      var wRes = wallet.applyWithdraw(Number(pending.amount), pending.settle || {});
      api.clearPending();
      if (!wRes || wRes.ok === false) {
        toast((wRes && wRes.message) || '提现失败，请重新操作！');
        setTimeout(function () {
          window.location.href = decodeReturn();
        }, 1200);
        return;
      }
      toast('提交成功！');
      setTimeout(function () {
        window.location.href =
          'store-wallet.html' + walletQuery({ tab: 'out', bizType: '提现申请' });
      }, 900);
      return;
    }
    if (pending.action === 'recharge' && typeof wallet.applyRecharge === 'function') {
      var rRes = wallet.applyRecharge(Number(pending.amount), pending.meta || {});
      api.clearPending();
      if (!rRes || rRes.ok === false) {
        toast((rRes && rRes.message) || '充值失败，请重新操作！');
        setTimeout(function () {
          window.location.href = decodeReturn();
        }, 1200);
        return;
      }
      toast('提交成功！');
      setTimeout(function () {
        var bizType = rRes.firstRecharge ? '首次充值' : '充值';
        window.location.href = 'store-wallet.html' + walletQuery({ tab: 'in', bizType: bizType });
      }, 900);
      return;
    }
    api.clearPending();
    toast('设置成功！');
    setTimeout(function () {
      window.location.href = decodeReturn();
    }, 900);
  }

  function goSms() {
    var q = new URLSearchParams(window.location.search);
    q.set('step', 'sms');
    window.location.href = 'store-pay-password.html?' + q.toString();
  }

  function goReset() {
    var q = new URLSearchParams(window.location.search);
    q.set('step', 'reset');
    window.location.href = 'store-pay-password.html?' + q.toString();
  }

  function startSmsCountdown() {
    var btn = $('ppSmsCd');
    function tick() {
      if (!btn) return;
      var left = typeof api.smsRemainSec === 'function' ? api.smsRemainSec() : 0;
      state.smsLeft = left;
      if (left <= 0) {
        btn.disabled = false;
        btn.textContent = '重发';
        return;
      }
      btn.disabled = true;
      btn.textContent = left + 'S';
      state.smsTimer = setTimeout(tick, 250);
    }
    clearTimeout(state.smsTimer);
    tick();
  }

  function renderSmsSlots() {
    var host = $('ppSmsSlots');
    if (!host) return;
    host.innerHTML = renderSlots(state.smsCode, true);
    syncSubmit($('ppSmsNext'), state.smsCode.length === 6);
  }

  function showStep() {
    var setEl = $('ppStepSet');
    var smsEl = $('ppStepSms');
    var verifyEl = $('ppStepVerify');
    if (setEl) setEl.hidden = !(step === 'set' || step === 'reset');
    if (smsEl) smsEl.hidden = step !== 'sms';
    if (verifyEl) verifyEl.hidden = step !== 'verify';

    var title = $('ppTitle');
    if (title) {
      if (step === 'sms') title.textContent = '设置支付密码';
      else if (step === 'verify') title.textContent = '支付密码';
      else title.textContent = '设置支付密码';
    }
    document.title = (title ? title.textContent : '支付密码') + ' · 门店 APP';
  }

  function initSetOrReset() {
    var tip = $('ppTip');
    var lead = $('ppLead');
    if (step === 'set') {
      if (tip) {
        tip.hidden = false;
        tip.textContent =
          fromAction === 'recharge' ? '首次充值，需设置支付密码' : '首次提现，需设置支付密码';
      }
      if (lead) lead.textContent = '设置您的支付密码';
    } else {
      if (tip) tip.hidden = true;
      if (lead) lead.textContent = '设置您的支付密码';
    }

    state.fields = [
      { key: 'new', label: '设置支付密码', value: '', visible: true },
      { key: 'confirm', label: '确认新密码', value: '', visible: false }
    ];
    state.focusIdx = 0;

    function refresh() {
      renderPwdFields('ppFields', state.fields, state.focusIdx, true);
      syncSubmit($('ppSubmit'), allFilled(state.fields));
    }

    bindFieldHost(
      'ppFields',
      state.fields,
      function () {
        return state.focusIdx;
      },
      function (i) {
        state.focusIdx = i;
      },
      refresh
    );

    var submit = $('ppSubmit');
    if (submit) {
      submit.addEventListener('click', function () {
        if (submit.disabled) return;
        var a = state.fields[0].value;
        var b = state.fields[1].value;
        if (a !== b) {
          toast('密码不一致，请重新输入！');
          return;
        }
        if (a === FAIL_DEMO) {
          toast('密码设置失败，请重新操作！');
          return;
        }
        api.setPassword(a);
        /* 重置密码后回到提现/充值页，需重新点提现并输入新密码；首次设置仍可继续待提交业务 */
        if (step === 'reset') {
          api.clearPending();
          toast('设置成功！');
          setTimeout(function () {
            window.location.href = decodeReturn();
          }, 900);
          return;
        }
        if (api.getPending()) {
          finishPendingAfterAuth();
        } else {
          toast('设置成功！');
          setTimeout(function () {
            window.location.href = decodeReturn();
          }, 900);
        }
      });
    }

    refresh();

    return {
      onDigit: function (d) {
        state.focusIdx = inputToFields(state.fields, state.focusIdx, d);
        refresh();
      },
      onDel: function () {
        state.focusIdx = delFromFields(state.fields, state.focusIdx);
        refresh();
      }
    };
  }

  function initSms() {
    /* 仍在有效期内则续用；倒计时与校验都读同一 expireAt（墙钟），避免 setTimeout 漂移误报过期 */
    var remain = typeof api.smsRemainSec === 'function' ? api.smsRemainSec() : 0;
    var sent = remain > 0 ? { phone: api.DEMO_PHONE } : api.sendSms();
    var phone = $('ppPhone');
    if (phone) phone.textContent = (sent && sent.phone) || api.DEMO_PHONE;
    startSmsCountdown();
    renderSmsSlots();

    var cd = $('ppSmsCd');
    if (cd) {
      cd.addEventListener('click', function () {
        if (cd.disabled) return;
        api.sendSms();
        toast('验证码已重新发送');
        startSmsCountdown();
      });
    }

    var next = $('ppSmsNext');
    if (next) {
      next.addEventListener('click', function () {
        if (next.disabled) return;
        var res = api.verifySms(state.smsCode);
        if (!res.ok) {
          toast(res.message || '短信验证码错误');
          if (res.message && res.message.indexOf('过期') >= 0) {
            startSmsCountdown();
          }
          return;
        }
        goReset();
      });
    }

    return {
      onDigit: function (d) {
        if (state.smsCode.length >= 6) return;
        state.smsCode += d;
        renderSmsSlots();
      },
      onDel: function () {
        state.smsCode = state.smsCode.slice(0, -1);
        renderSmsSlots();
      }
    };
  }

  function initVerify() {
    state.fields = [{ key: 'pwd', label: '支付密码', value: '', visible: false }];
    state.focusIdx = 0;

    function refresh() {
      renderPwdFields('ppVerifyFields', state.fields, 0, true);
      syncSubmit($('ppVerifyOk'), state.fields[0].value.length === 6);
    }

    bindFieldHost(
      'ppVerifyFields',
      state.fields,
      function () {
        return 0;
      },
      function () {},
      refresh
    );

    var forgot = $('ppForgot');
    if (forgot) {
      forgot.addEventListener('click', function () {
        goSms();
      });
    }

    var ok = $('ppVerifyOk');
    if (ok) {
      ok.addEventListener('click', function () {
        if (ok.disabled) return;
        if (api.isLocked()) {
          toast('支付密码已锁定，请重置后重试');
          return;
        }
        var res = api.verify(state.fields[0].value);
        if (!res.ok) {
          toast(res.message || '支付密码错误');
          state.fields[0].value = '';
          refresh();
          if (res.locked) {
            setTimeout(goSms, 1200);
          }
          return;
        }
        finishPendingAfterAuth();
      });
    }

    refresh();

    return {
      onDigit: function (d) {
        state.focusIdx = inputToFields(state.fields, 0, d);
        refresh();
      },
      onDel: function () {
        state.focusIdx = delFromFields(state.fields, 0);
        refresh();
      }
    };
  }

  function bind() {
    setupBack();
    showStep();

    var handler = null;
    if (step === 'sms') handler = initSms();
    else if (step === 'verify') handler = initVerify();
    else handler = initSetOrReset();

    var pad = $('ppKeypad');
    if (pad && handler) {
      pad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-key]');
        if (!btn) return;
        var key = btn.getAttribute('data-key');
        if (key === 'del') handler.onDel();
        else if (/^\d$/.test(key)) handler.onDigit(key);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
