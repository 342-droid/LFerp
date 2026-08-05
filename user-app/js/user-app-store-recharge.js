(function () {
  var api = window.StoreWalletDemo;
  if (!api) return;

  var SINGLE_LIMIT = 5000;
  var DAILY_LIMIT = 50000;

  var METHODS = [
    {
      id: 'corp',
      name: '对公账户',
      short: '公',
      tone: 'is-corp',
      channel: '对公账户'
    },
    {
      id: 'alipay',
      name: '支付宝',
      short: '支',
      tone: 'is-alipay',
      channel: '支付宝'
    },
    {
      id: 'wechat',
      name: '微信',
      short: '微',
      tone: 'is-wechat',
      channel: '微信'
    }
  ];

  var state = {
    amount: '',
    methodId: 'corp',
    keypadOpen: true,
    dailyRemain: DAILY_LIMIT
  };

  function $(id) {
    return document.getElementById(id);
  }

  function moneyPlain(n) {
    return Number(n || 0).toFixed(2);
  }

  function moneyInt(n) {
    var num = Number(n || 0);
    if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
    return num.toFixed(2);
  }

  function currentMethod() {
    return (
      METHODS.find(function (m) {
        return m.id === state.methodId;
      }) || METHODS[0]
    );
  }

  function methodTitle(m) {
    if (m.id !== 'corp') return m.name;
    var snap = api.snapshot();
    var settle = (snap && snap.settleAccount) || {};
    var bank = settle.bankName || '';
    var tail = settle.cardTail || '';
    if (bank && tail) return bank + '(' + tail + ')';
    if (bank) return bank;
    return m.name;
  }

  function methodTip() {
    return '单笔最高¥' + moneyInt(SINGLE_LIMIT) + '，单日最高¥' + moneyInt(DAILY_LIMIT);
  }

  function parseAmount(str) {
    if (!str) return 0;
    var n = Number(str);
    return isFinite(n) ? n : 0;
  }

  function refreshDailyRemain() {
    if (typeof api.rechargeDailyRemain === 'function') {
      state.dailyRemain = Number(api.rechargeDailyRemain() || 0);
    } else {
      state.dailyRemain = DAILY_LIMIT;
    }
  }

  function corpIconShort() {
    var snap = api.snapshot();
    var bank = ((snap && snap.settleAccount) || {}).bankName || '';
    if (bank.indexOf('建设') >= 0) return '建';
    if (bank.indexOf('工商') >= 0) return '工';
    if (bank.indexOf('农业') >= 0) return '农';
    if (bank.indexOf('中国银行') >= 0) return '中';
    return '公';
  }

  function syncMethodUi() {
    var m = currentMethod();
    var icon = $('rcBankIcon');
    var name = $('rcBankName');
    var tip = $('rcBankTip');
    if (icon) {
      icon.textContent = m.id === 'corp' ? corpIconShort() : m.short;
      icon.className = 'ua-wd-bank__icon ' + (m.tone || '');
    }
    if (name) name.textContent = methodTitle(m);
    if (tip) tip.textContent = methodTip();
  }

  function syncAmountUi() {
    var valueEl = $('rcAmountValue');
    var caret = $('rcCaret');
    var err = $('rcErr');
    var submit = $('rcSubmit');
    var focusRow = $('rcAmountFocus');
    if (valueEl) valueEl.textContent = state.amount;
    if (caret) caret.hidden = !state.keypadOpen;
    if (focusRow) focusRow.classList.toggle('is-focus', state.keypadOpen);

    var amt = parseAmount(state.amount);
    var msg = '';
    if (state.amount && amt <= 0) msg = '请输入正确的充值金额';
    else if (amt > SINGLE_LIMIT + 0.001) msg = '单笔最高可充值¥' + moneyInt(SINGLE_LIMIT);
    else if (amt > state.dailyRemain + 0.001) msg = '超过单日剩余额度¥' + moneyInt(state.dailyRemain);
    if (err) {
      err.hidden = !msg;
      err.textContent = msg;
    }
    if (submit) {
      submit.disabled = !(
        amt > 0 &&
        amt <= SINGLE_LIMIT + 0.001 &&
        amt <= state.dailyRemain + 0.001 &&
        !msg
      );
    }
  }

  function setKeypad(open) {
    state.keypadOpen = open;
    var pad = $('rcKeypad');
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

  function openMethodSheet() {
    var sheet = $('rcBankSheet');
    var list = $('rcBankList');
    if (!sheet || !list) return;
    var tip = methodTip();
    list.innerHTML = METHODS.map(function (m) {
      var active = m.id === state.methodId ? ' is-active' : '';
      var short = m.id === 'corp' ? corpIconShort() : m.short;
      return (
        '<button type="button" class="ua-wd-bank-option' +
        active +
        '" data-method-id="' +
        m.id +
        '">' +
        '<span class="ua-wd-bank__icon ' +
        (m.tone || '') +
        '">' +
        short +
        '</span>' +
        '<span class="ua-wd-bank-option__info">' +
        '<div class="ua-wd-bank-option__name">' +
        methodTitle(m) +
        '</div>' +
        '<div class="ua-wd-bank-option__tip">' +
        tip +
        '</div>' +
        '</span>' +
        '<span class="ua-wd-bank-option__check" aria-hidden="true"></span>' +
        '</button>'
      );
    }).join('');
    sheet.hidden = false;
  }

  function closeMethodSheet() {
    var sheet = $('rcBankSheet');
    if (sheet) sheet.hidden = true;
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

  function setupBack() {
    var back = $('rcBack');
    if (back) back.setAttribute('href', 'store-wallet.html' + walletQuery());
  }

  function doSubmitDirect(amt, method) {
    var result = api.applyRecharge(amt, {
      channel: method.channel,
      methodId: method.id,
      bankName: method.channel,
      bankTail: ''
    });
    if (!result || result.ok === false) {
      window.alert((result && result.message) || '充值失败，请稍后重试');
      refreshDailyRemain();
      syncMethodUi();
      syncAmountUi();
      return;
    }
    var msg = '充值成功\n金额：¥' + moneyPlain(amt) + '\n方式：' + methodTitle(method);
    if (result.filledGap > 0) {
      msg += '\n其中补齐保证金 ¥' + moneyPlain(result.filledGap);
    }
    if (result.toPending > 0) {
      msg += '\n计入待解冻 ¥' + moneyPlain(result.toPending) + '（T+1 后可提现）';
    }
    window.alert(msg);
    window.location.href = 'store-wallet.html' + walletQuery({ tab: 'in', bizType: '充值' });
  }

  function doSubmit() {
    var amt = parseAmount(state.amount);
    var method = currentMethod();
    refreshDailyRemain();
    if (!(amt > 0) || amt > SINGLE_LIMIT + 0.001 || amt > state.dailyRemain + 0.001) {
      syncAmountUi();
      return;
    }
    if (typeof api.applyRecharge !== 'function') {
      window.alert('充值功能暂不可用');
      return;
    }
    /* 支付宝 / 微信充值无需支付密码；对公账户充值需要 */
    if (method.id !== 'corp') {
      doSubmitDirect(amt, method);
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var appFrom = params.get('from') || '';
    var returnUrl = 'store-recharge.html' + walletQuery();
    var guard = window.StorePayPasswordGuard;
    if (!guard) {
      window.alert('支付密码模块未加载');
      return;
    }
    guard.gatePayPassword(
      { from: 'recharge', returnUrl: returnUrl, appFrom: appFrom },
      {
        action: 'recharge',
        amount: amt,
        meta: {
          channel: method.channel,
          methodId: method.id,
          bankName: method.channel,
          bankTail: ''
        }
      }
    );
  }

  function bind() {
    setupBack();
    refreshDailyRemain();
    syncMethodUi();
    syncAmountUi();
    setKeypad(true);

    var focus = $('rcAmountFocus');
    if (focus) {
      focus.addEventListener('click', function () {
        setKeypad(true);
      });
    }

    var pad = $('rcKeypad');
    if (pad) {
      pad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-key]');
        if (!btn) return;
        appendKey(btn.getAttribute('data-key'));
      });
    }

    var submit = $('rcSubmit');
    if (submit) {
      submit.addEventListener('click', doSubmit);
    }

    var methodBtn = $('rcMethodBtn');
    if (methodBtn) {
      methodBtn.addEventListener('click', openMethodSheet);
    }

    document.querySelectorAll('[data-rc-sheet-close]').forEach(function (el) {
      el.addEventListener('click', closeMethodSheet);
    });

    var list = $('rcBankList');
    if (list) {
      list.addEventListener('click', function (e) {
        var opt = e.target.closest('[data-method-id]');
        if (!opt) return;
        state.methodId = opt.getAttribute('data-method-id');
        syncMethodUi();
        syncAmountUi();
        closeMethodSheet();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
