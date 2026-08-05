(function () {
  var api = window.StoreWalletDemo;
  if (!api) return;

  var state = {
    amount: '',
    balance: 0,
    settle: null,
    keypadOpen: false,
    payPwd: '',
    payBusy: false
  };

  function toast(msg, ms) {
    var shell = document.querySelector('.ua-wd-page');
    var el = document.querySelector('.ua-wd-pay-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ua-wd-pay-toast';
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, ms || 1800);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function moneyPlain(n) {
    return Number(n || 0).toFixed(2);
  }

  function bankShort(name) {
    var n = String(name || '');
    if (n.indexOf('建设') >= 0) return '建';
    if (n.indexOf('工商') >= 0) return '工';
    if (n.indexOf('农业') >= 0) return '农';
    if (n.indexOf('中国银行') >= 0 || n === '中行') return '中';
    if (n.indexOf('交通') >= 0) return '交';
    if (n.indexOf('招商') >= 0) return '招';
    return n.slice(0, 1) || '公';
  }

  function cardTail(settle) {
    if (!settle) return '----';
    if (settle.cardTail) return String(settle.cardTail);
    var s = String(settle.cardNo || '').replace(/\s/g, '');
    return s.slice(-4) || '----';
  }

  function settleLabel(settle) {
    if (!settle) return '对公账户';
    return settle.bankName + '(' + cardTail(settle) + ')';
  }

  function parseAmount(str) {
    if (!str) return 0;
    var n = Number(str);
    return isFinite(n) ? n : 0;
  }

  function syncSettleUi() {
    var settle = state.settle || {};
    var icon = $('wdBankIcon');
    var name = $('wdBankName');
    if (icon) icon.textContent = bankShort(settle.bankName);
    if (name) name.textContent = settleLabel(settle);
  }

  function syncAmountUi() {
    var valueEl = $('wdAmountValue');
    var caret = $('wdCaret');
    var err = $('wdErr');
    var submit = $('wdSubmit');
    var focusRow = $('wdAmountFocus');
    if (valueEl) valueEl.textContent = state.amount;
    if (caret) caret.hidden = !state.keypadOpen;
    if (focusRow) focusRow.classList.toggle('is-focus', state.keypadOpen);

    var amt = parseAmount(state.amount);
    var msg = '';
    if (state.amount && amt <= 0) msg = '请输入正确的提现金额';
    else if (amt > state.balance + 0.001) msg = '提现金额不能超过可提现金额';
    if (err) {
      err.hidden = !msg;
      err.textContent = msg;
    }
    if (submit) {
      submit.disabled = !(amt > 0 && amt <= state.balance + 0.001 && !msg);
    }
  }

  function setKeypad(open) {
    state.keypadOpen = open;
    var pad = $('wdKeypad');
    if (pad) pad.hidden = !open;
    syncAmountUi();
  }

  function appendKey(key) {
    var s = state.amount;
    if (key === 'del') {
      state.amount = s.slice(0, -1);
      syncAmountUi();
      return;
    }
    if (key === '.') {
      if (!s) state.amount = '0.';
      else if (s.indexOf('.') < 0) state.amount = s + '.';
      syncAmountUi();
      return;
    }
    if (!/^\d$/.test(key)) return;
    if (s === '0') {
      state.amount = key;
      syncAmountUi();
      return;
    }
    var parts = s.split('.');
    if (parts[1] && parts[1].length >= 2) return;
    if (!parts[1] && parts[0].length >= 8) return;
    state.amount = s + key;
    syncAmountUi();
  }

  function walletQuery(extra) {
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || '';
    var q = new URLSearchParams();
    if (from) q.set('from', from);
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        if (extra[k] != null && extra[k] !== '') q.set(k, extra[k]);
      });
    }
    var s = q.toString();
    return s ? '?' + s : '';
  }

  function setupLinks() {
    var back = $('wdBack');
    var records = $('wdRecordsLink');
    if (back) back.setAttribute('href', 'store-wallet.html' + walletQuery());
    if (records) {
      records.setAttribute(
        'href',
        'store-wallet.html' + walletQuery({ tab: 'out', bizType: '提现申请' })
      );
    }
  }

  function bind() {
    var gate = window.StoreOnboardingGate;
    if (gate && typeof gate.ensureDemoApproved === 'function') {
      gate.ensureDemoApproved(true);
    }
    if (gate && !gate.canWithdraw()) {
      var wMsg = gate.withdrawBlockMessage() || '商户进件未完成，暂无法提现';
      gate.blockAndGoOnboarding(wMsg, {
        from: 'store-app',
        returnUrl: 'store-wallet.html?from=store-app'
      });
      return;
    }

    setupLinks();

    var snap = api.snapshot();
    state.balance = Number(snap.withdrawable || 0);
    state.settle = snap.settleAccount || null;
    var balEl = $('wdBalance');
    if (balEl) balEl.textContent = moneyPlain(state.balance);
    var pendingTip = $('wdPendingTip');
    var pendingAmt = Number(snap.pending || 0);
    if (pendingTip) {
      if (pendingAmt > 0) {
        pendingTip.hidden = false;
        pendingTip.textContent =
          '¥' + moneyPlain(pendingAmt) + ' 未满 T+1（待解冻），暂不可提现';
      } else {
        pendingTip.hidden = true;
        pendingTip.textContent = '';
      }
    }
    syncSettleUi();
    syncAmountUi();
    setKeypad(true);

    var focus = $('wdAmountFocus');
    if (focus) {
      focus.addEventListener('click', function () {
        setKeypad(true);
      });
    }

    var pad = $('wdKeypad');
    if (pad) {
      pad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-key]');
        if (!btn) return;
        appendKey(btn.getAttribute('data-key'));
      });
    }

    var allBtn = $('wdAllBtn');
    if (allBtn) {
      allBtn.addEventListener('click', function () {
        state.amount = moneyPlain(state.balance);
        setKeypad(true);
      });
    }

    function syncPayPwdUi() {
      var host = $('wdPayPwd');
      if (!host) return;
      var spans = host.querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) {
        spans[i].classList.toggle('filled', i < state.payPwd.length);
      }
    }

    function closePaySheet() {
      var sheet = $('wdPaySheet');
      if (sheet) sheet.hidden = true;
      state.payPwd = '';
      state.payBusy = false;
      syncPayPwdUi();
      setKeypad(true);
    }

    function openPaySheet(amt) {
      state.payPwd = '';
      state.payBusy = false;
      var hint = $('wdPayAmountHint');
      if (hint) hint.textContent = '¥' + moneyPlain(amt);
      syncPayPwdUi();
      setKeypad(false);
      var sheet = $('wdPaySheet');
      if (sheet) sheet.hidden = false;
    }

    function submitWithdrawAfterPwd() {
      var pending = window.StorePayPassword && window.StorePayPassword.getPending();
      var amt = pending ? Number(pending.amount) : parseAmount(state.amount);
      var settle = (pending && pending.settle) || state.settle || {};
      if (window.StorePayPassword) window.StorePayPassword.clearPending();
      var result = api.applyWithdraw(amt, settle);
      if (!result || result.ok === false) {
        toast((result && result.message) || '提现失败，请稍后重试');
        closePaySheet();
        return;
      }
      toast('提交成功！');
      setTimeout(function () {
        window.location.href = 'store-wallet.html' + walletQuery({ tab: 'out', bizType: '提现申请' });
      }, 800);
    }

    function tryVerifyPayPwd() {
      if (state.payBusy || state.payPwd.length !== 6) return;
      var payApi = window.StorePayPassword;
      if (!payApi) return;
      state.payBusy = true;
      var res = payApi.verify(state.payPwd);
      if (!res.ok) {
        toast(res.message || '支付密码错误');
        state.payPwd = '';
        syncPayPwdUi();
        state.payBusy = false;
        if (res.locked) {
          var params = new URLSearchParams(window.location.search);
          var appFrom = params.get('from') || '';
          var guard = window.StorePayPasswordGuard;
          setTimeout(function () {
            if (!guard) return;
            window.location.href = guard.buildPayPasswordUrl({
              step: 'sms',
              from: 'withdraw',
              returnUrl: 'store-withdraw.html' + walletQuery(),
              appFrom: appFrom
            });
          }, 1000);
        }
        return;
      }
      submitWithdrawAfterPwd();
    }

    var submit = $('wdSubmit');
    if (submit) {
      submit.addEventListener('click', function () {
        var amt = parseAmount(state.amount);
        if (!(amt > 0)) return;
        snap = api.snapshot();
        if (Number(snap.depositGap || 0) > 0) {
          window.alert('保证金存在缺口 ' + api.money(snap.depositGap) + '，请先补齐后再提现。');
          return;
        }
        if (amt > Number(snap.withdrawable || 0) + 0.001) {
          window.alert('提现金额不能超过可提现金额');
          return;
        }
        if (typeof api.applyWithdraw !== 'function') {
          window.alert('提现功能暂不可用');
          return;
        }
        /* 平台提现须校验支付密码；已设密则半屏弹框输入 */
        var settle = state.settle || snap.settleAccount || {};
        var params = new URLSearchParams(window.location.search);
        var appFrom = params.get('from') || '';
        var returnUrl = 'store-withdraw.html' + walletQuery();
        var guard = window.StorePayPasswordGuard;
        if (!guard) {
          window.alert('支付密码模块未加载');
          return;
        }
        var gate = guard.gatePayPassword(
          { from: 'withdraw', returnUrl: returnUrl, appFrom: appFrom, inlineVerify: true },
          { action: 'withdraw', amount: amt, settle: settle }
        );
        if (gate === 'verify') openPaySheet(amt);
      });
    }

    document.querySelectorAll('[data-wd-pay-close]').forEach(function (el) {
      el.addEventListener('click', closePaySheet);
    });

    var payPad = $('wdPayKeypad');
    if (payPad) {
      payPad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pay-key]');
        if (!btn || state.payBusy) return;
        var key = btn.getAttribute('data-pay-key');
        if (key === 'del') {
          state.payPwd = state.payPwd.slice(0, -1);
          syncPayPwdUi();
          return;
        }
        if (!/^\d$/.test(key) || state.payPwd.length >= 6) return;
        state.payPwd += key;
        syncPayPwdUi();
        if (state.payPwd.length === 6) {
          setTimeout(tryVerifyPayPwd, 80);
        }
      });
    }

    var forgot = $('wdPayForgot');
    if (forgot) {
      forgot.addEventListener('click', function () {
        var params = new URLSearchParams(window.location.search);
        var appFrom = params.get('from') || '';
        var guard = window.StorePayPasswordGuard;
        if (!guard) return;
        window.location.href = guard.buildPayPasswordUrl({
          step: 'sms',
          from: 'withdraw',
          returnUrl: 'store-withdraw.html' + walletQuery(),
          appFrom: appFrom
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
