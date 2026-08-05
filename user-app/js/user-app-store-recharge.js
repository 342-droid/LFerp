(function () {
  var api = window.StoreWalletDemo;
  var cardApi = window.StoreBindCardDemo;
  if (!api) return;

  var SINGLE_LIMIT = 5000;
  var DAILY_LIMIT = 50000;

  var BASE_METHODS = [
    {
      id: 'alipay',
      name: '支付宝',
      short: '支',
      tone: 'is-alipay',
      channel: '支付宝',
      showTip: false
    },
    {
      id: 'wechat',
      name: '微信',
      short: '微',
      tone: 'is-wechat',
      channel: '微信',
      showTip: false
    }
  ];

  var state = {
    amount: '',
    methodId: '',
    keypadOpen: true,
    dailyRemain: DAILY_LIMIT,
    methods: []
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

  function buildMethods() {
    /* 仅快捷支付卡可充值；汇付默认提现对公户不出现在充值方式 */
    var cards =
      cardApi && typeof cardApi.listQuickPayCards === 'function'
        ? cardApi.listQuickPayCards()
        : cardApi && typeof cardApi.listCards === 'function'
          ? cardApi.listCards().filter(function (c) {
              return c.purpose !== 'withdraw';
            })
          : [];
    var cardMethods = cards.map(function (c) {
      return {
        id: 'card:' + c.id,
        name: c.bankName + '(' + c.cardTail + ')',
        short: c.bankShort || '卡',
        tone: 'is-card',
        channel: c.bankName,
        showTip: true,
        tip:
          '单笔最高¥' +
          moneyInt(c.single || SINGLE_LIMIT) +
          '，单日最高¥' +
          moneyInt(c.daily || DAILY_LIMIT),
        card: c,
        single: c.single || SINGLE_LIMIT,
        daily: c.daily || DAILY_LIMIT
      };
    });
    return cardMethods.concat(BASE_METHODS);
  }

  function currentMethod() {
    return (
      state.methods.find(function (m) {
        return m.id === state.methodId;
      }) ||
      state.methods[0] ||
      null
    );
  }

  function methodLimit(m) {
    if (!m) return { single: SINGLE_LIMIT, daily: DAILY_LIMIT };
    return {
      single: Number(m.single || SINGLE_LIMIT),
      daily: Number(m.daily || DAILY_LIMIT)
    };
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

  function syncMethodUi() {
    var m = currentMethod();
    var icon = $('rcBankIcon');
    var name = $('rcBankName');
    var tip = $('rcBankTip');
    if (!m) {
      if (name) name.textContent = '请选择充值方式';
      if (tip) {
        tip.hidden = true;
        tip.textContent = '';
      }
      return;
    }
    if (icon) {
      icon.textContent = m.short;
      icon.className = 'ua-wd-bank__icon ' + (m.tone || '');
    }
    if (name) name.textContent = m.name;
    if (tip) {
      if (m.showTip && m.tip) {
        tip.hidden = false;
        tip.textContent = m.tip;
      } else {
        tip.hidden = true;
        tip.textContent = '';
      }
    }
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

    var m = currentMethod();
    var lim = methodLimit(m);
    var amt = parseAmount(state.amount);
    var msg = '';
    if (!m) msg = '请先选择充值方式或添加银行卡';
    else if (state.amount && amt <= 0) msg = '请输入正确的充值金额';
    else if (amt > lim.single + 0.001) msg = '单笔最高可充值¥' + moneyInt(lim.single);
    else if (amt > state.dailyRemain + 0.001) msg = '超过单日剩余额度¥' + moneyInt(state.dailyRemain);
    if (err) {
      err.hidden = !msg;
      err.textContent = msg;
    }
    if (submit) {
      submit.disabled = !(m && amt > 0 && amt <= lim.single + 0.001 && amt <= state.dailyRemain + 0.001 && !msg);
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
    state.methods = buildMethods();
    var html = state.methods
      .map(function (m) {
        var active = m.id === state.methodId ? ' is-active' : '';
        var tipHtml = m.showTip && m.tip ? '<div class="ua-wd-bank-option__tip">' + m.tip + '</div>' : '';
        return (
          '<button type="button" class="ua-wd-bank-option' +
          active +
          '" data-method-id="' +
          m.id +
          '">' +
          '<span class="ua-wd-bank__icon ' +
          (m.tone || '') +
          '">' +
          m.short +
          '</span>' +
          '<span class="ua-wd-bank-option__info">' +
          '<div class="ua-wd-bank-option__name">' +
          m.name +
          '</div>' +
          tipHtml +
          '</span>' +
          '<span class="ua-wd-bank-option__check" aria-hidden="true"></span>' +
          '</button>'
        );
      })
      .join('');
    html +=
      '<button type="button" class="ua-rc-add-card" id="rcAddCardBtn">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>' +
      '添加银行卡充值</button>';
    list.innerHTML = html;
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
    var channel = method.channel;
    if (method.card) channel = method.card.bankName;
    var result = api.applyRecharge(amt, {
      channel: channel,
      methodId: method.id,
      bankName: method.card ? method.card.bankName : channel,
      bankTail: method.card ? method.card.cardTail : ''
    });
    if (!result || result.ok === false) {
      window.alert((result && result.message) || '充值失败，请稍后重试');
      refreshDailyRemain();
      syncMethodUi();
      syncAmountUi();
      return;
    }
    var msg = '充值成功\n金额：¥' + moneyPlain(amt) + '\n方式：' + method.name;
    if (result.firstRecharge) {
      if (result.filledGap > 0) {
        msg += '\n已自动划拨保证金 ¥' + moneyPlain(result.filledGap);
      }
      if (result.toGoodsQuota > 0) {
        msg += '\n计入货款 ¥' + moneyPlain(result.toGoodsQuota);
      }
    } else {
      if (result.filledGap > 0) {
        msg += '\n其中补齐保证金 ¥' + moneyPlain(result.filledGap);
      }
      if (result.toPending > 0) {
        msg += '\n计入待解冻 ¥' + moneyPlain(result.toPending) + '（T+1 后可提现）';
      }
    }
    window.alert(msg);
    var bizType = result.firstRecharge ? '首次充值' : '充值';
    window.location.href = 'store-wallet.html' + walletQuery({ tab: 'in', bizType: bizType });
  }

  function doSubmit() {
    var amt = parseAmount(state.amount);
    var method = currentMethod();
    refreshDailyRemain();
    if (!method) {
      openMethodSheet();
      return;
    }
    var lim = methodLimit(method);
    if (!(amt > 0) || amt > lim.single + 0.001 || amt > state.dailyRemain + 0.001) {
      syncAmountUi();
      return;
    }
    if (typeof api.applyRecharge !== 'function') {
      window.alert('充值功能暂不可用');
      return;
    }
    /* 快捷支付：支付宝 / 微信 / 已绑银行卡，无需对公默认账户 */
    doSubmitDirect(amt, method);
  }

  function pickDefaultMethod() {
    var params = new URLSearchParams(window.location.search);
    var cardId = params.get('cardId') || '';
    state.methods = buildMethods();
    if (cardId) {
      var hit = state.methods.find(function (m) {
        return m.id === 'card:' + cardId;
      });
      if (hit) {
        state.methodId = hit.id;
        return;
      }
    }
    if (state.methods.length) {
      state.methodId = state.methods[0].id;
    }
  }

  function bind() {
    setupBack();
    refreshDailyRemain();
    pickDefaultMethod();
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
        var add = e.target.closest('#rcAddCardBtn');
        if (add) {
          var gate = window.StoreOnboardingGate;
          if (gate && !gate.canAddBankCardForRecharge()) {
            var msg =
              gate.rechargeAddCardBlockMessage() ||
              '商户进件未完成，请先完成进件后充值';
            gate.blockAndGoOnboarding(msg, {
              from: 'store-app',
              returnUrl: 'store-recharge.html' + walletQuery()
            });
            return;
          }
          window.location.href = 'store-bind-card.html' + walletQuery();
          return;
        }
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
