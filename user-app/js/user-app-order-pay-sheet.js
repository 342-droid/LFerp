/**
 * 待支付收银台：参考支付宝确认付款
 * - 仅纯余额：输入 6 位支付密码（演示非 000000 成功）
 * - 混合 / 纯三方：先勾选支付宝或微信，再点「确认付款」跳三方
 * 密码成败结果页、提醒文案对齐确认订单页。
 * 详情「立即付款」、订单列表「去付款」共用。
 */
(function (global) {
  var MIX_PAY_DEMO_KEY = 'ua_checkout_mix_pay_demo_v1';
  var MIX_PAY_SCENES = [
    { id: 'auto', label: '按实际钱包' },
    { id: 'wallet', label: '余额充足·仅钱包' },
    { id: 'mix_wechat', label: '余额不足·混微信' },
    { id: 'mix_alipay', label: '余额不足·混支付宝' },
    { id: 'wechat', label: '关闭余额·仅微信' },
    { id: 'alipay', label: '关闭余额·仅支付宝' },
    { id: 'wallet_zero', label: '余额为0·隐藏钱包' }
  ];

  var ctx = {
    isRestock: false,
    getPayable: function () {
      return 0;
    },
    onPaid: null,
    nav: {}
  };
  var state = {
    useBalance: true,
    channel: '',
    pwd: '',
    busy: false
  };

  function readMixPayDemo() {
    try {
      var raw = localStorage.getItem(MIX_PAY_DEMO_KEY);
      if (!raw) return { scene: 'auto' };
      var data = JSON.parse(raw);
      return { scene: (data && data.scene) || 'auto' };
    } catch (e) {
      return { scene: 'auto' };
    }
  }

  function writeMixPayDemo(scene) {
    try {
      localStorage.setItem(MIX_PAY_DEMO_KEY, JSON.stringify({ scene: scene || 'auto' }));
    } catch (e) {
      /* ignore */
    }
  }

  function realWalletAvailable() {
    if (global.StoreWalletDemo && typeof global.StoreWalletDemo.snapshot === 'function') {
      var snap = global.StoreWalletDemo.snapshot();
      return Number(snap.restockAvailable != null ? snap.restockAvailable : snap.available) || 0;
    }
    return 0;
  }

  function getPayable() {
    var n = ctx.getPayable ? Number(ctx.getPayable()) : 0;
    return n > 0 ? n : 0;
  }

  function getWalletAvailable() {
    var scene = readMixPayDemo().scene;
    var real = realWalletAvailable();
    var payable = getPayable();
    if (!ctx.isRestock) return 0;
    if (!scene || scene === 'auto') return real;
    if (scene === 'wallet_zero') return 0;
    if (scene === 'wallet' || scene === 'wechat' || scene === 'alipay') {
      return Math.max(real, Math.round((payable + 50) * 100) / 100);
    }
    if (scene === 'mix_wechat' || scene === 'mix_alipay') {
      return Math.max(0.01, Math.round(payable * 0.4 * 100) / 100);
    }
    return real;
  }

  function getLegs() {
    var payable = getPayable();
    var available = getWalletAvailable();
    var useBalance = ctx.isRestock && !!state.useBalance;
    var balanceLeg = useBalance ? Math.min(available, payable) : 0;
    balanceLeg = Math.round(balanceLeg * 100) / 100;
    var channelLeg = Math.round((payable - balanceLeg) * 100) / 100;
    return {
      payable: payable,
      available: available,
      balanceLeg: balanceLeg,
      channelLeg: channelLeg,
      channel: state.channel || '',
      needChannel: channelLeg > 0.001,
      balanceOnly: balanceLeg > 0 && channelLeg <= 0.001,
      /* 仅纯余额支付需要支付密码；混合 / 纯三方不需要 */
      needsPassword: ctx.isRestock && useBalance && balanceLeg > 0 && channelLeg <= 0.001
    };
  }

  function payChannelShortName(channel) {
    if (channel === 'alipay') return '支付宝';
    if (channel === 'wechat') return '微信';
    return '钱包余额';
  }

  function buildPayLegParts(legs) {
    var L = legs || getLegs();
    var parts = [];
    if (L.balanceLeg > 0.001) parts.push({ name: '钱包余额', amount: L.balanceLeg });
    if (L.channelLeg > 0.001) {
      parts.push({ name: payChannelShortName(L.channel || 'wechat'), amount: L.channelLeg });
    }
    if (!parts.length) {
      parts.push({ name: payChannelShortName(L.channel || 'balance'), amount: L.payable || 0 });
    }
    return parts;
  }

  function formatPayMethodNames(parts) {
    return (parts || [])
      .map(function (p) {
        return p.name;
      })
      .filter(Boolean)
      .join('、');
  }

  function applyScene() {
    var scene = readMixPayDemo().scene;
    if (!ctx.isRestock || !scene || scene === 'auto') {
      state.useBalance = !!ctx.isRestock;
      state.channel = '';
      return;
    }
    if (scene === 'wallet') {
      state.useBalance = true;
      state.channel = '';
      return;
    }
    if (scene === 'mix_wechat') {
      state.useBalance = true;
      state.channel = 'wechat';
      return;
    }
    if (scene === 'mix_alipay') {
      state.useBalance = true;
      state.channel = 'alipay';
      return;
    }
    if (scene === 'wechat' || scene === 'wallet_zero') {
      state.useBalance = false;
      state.channel = 'wechat';
      return;
    }
    if (scene === 'alipay') {
      state.useBalance = false;
      state.channel = 'alipay';
    }
  }

  function syncChannelUI() {
    document.querySelectorAll('#orderPaySheet [data-pay-channel]').forEach(function (btn) {
      var selected = btn.getAttribute('data-pay-channel') === state.channel;
      btn.classList.toggle('is-active', selected);
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
    });
  }

  function updatePwdDots() {
    document.querySelectorAll('#orderPayPwdDots span').forEach(function (dot, i) {
      dot.classList.toggle('filled', i < state.pwd.length);
      dot.classList.toggle('is-focus', i === state.pwd.length && i < 6);
    });
  }

  function renderSheet() {
    var legs = getLegs();
    var amountEl = document.getElementById('orderPayAmount');
    if (amountEl) amountEl.textContent = '¥' + legs.payable.toFixed(2);
    var row = document.getElementById('orderPayWalletRow');
    var hint = document.getElementById('orderPayWalletHint');
    var toggle = document.getElementById('orderPayUseBalance');
    var showWallet = ctx.isRestock && legs.available > 0.001;
    if (row) row.hidden = !showWallet;
    if (toggle) toggle.checked = !!state.useBalance;
    if (hint) {
      hint.textContent = state.useBalance
        ? '已抵扣 ¥' + legs.balanceLeg.toFixed(2)
        : '可用 ¥' + legs.available.toFixed(2);
    }
    var pwdBlock = document.getElementById('orderPayPwdBlock');
    if (pwdBlock) pwdBlock.hidden = !legs.needsPassword;
    var confirm = document.getElementById('orderPayConfirm');
    if (confirm) confirm.hidden = !!legs.needsPassword;
    var split = document.getElementById('orderPaySplit');
    if (split) {
      if (legs.balanceLeg > 0.001 && legs.channelLeg > 0.001) {
        split.hidden = false;
        split.innerHTML = buildPayLegParts(legs)
          .map(function (p) {
            return (
              '<div class="ua-od-pay-sheet__split-row"><span>' +
              p.name +
              '</span><span>-¥' +
              Number(p.amount).toFixed(2) +
              '</span></div>'
            );
          })
          .join('');
      } else {
        split.hidden = true;
        split.innerHTML = '';
      }
    }
    syncChannelUI();
    updatePwdDots();
  }

  function closeSheet() {
    var sheet = document.getElementById('orderPaySheet');
    if (sheet) sheet.hidden = true;
    state.pwd = '';
    state.busy = false;
    updatePwdDots();
  }

  function releasePayFreeze() {
    if (global.StoreWalletDemo && typeof global.StoreWalletDemo.releaseRestockPayFreeze === 'function') {
      global.StoreWalletDemo.releaseRestockPayFreeze();
    }
  }

  function beginPayFreeze(legs) {
    var L = legs || getLegs();
    if (
      global.StoreWalletDemo &&
      typeof global.StoreWalletDemo.freezeRestockPay === 'function' &&
      L.balanceLeg > 0.001
    ) {
      return global.StoreWalletDemo.freezeRestockPay({
        balanceAmount: L.balanceLeg,
        pointsAmount: 0,
        channel: L.channel || state.channel || ''
      });
    }
    return { ok: true, skipped: true };
  }

  function settlePayAfterOk(legs) {
    var L = legs || getLegs();
    if (global.StoreWalletDemo && typeof global.StoreWalletDemo.commitRestockPayFreeze === 'function') {
      return global.StoreWalletDemo.commitRestockPayFreeze({
        balanceAmount: L.balanceLeg,
        channel: L.channel || state.channel,
        channelLabel: payChannelShortName(L.channel || state.channel)
      });
    }
    if (L.balanceLeg > 0 && global.StoreWalletDemo && typeof global.StoreWalletDemo.applyRestockPay === 'function') {
      global.StoreWalletDemo.applyRestockPay(L.balanceLeg, {
        channel: L.channel || state.channel,
        channelLabel: payChannelShortName(L.channel || state.channel)
      });
    }
    return { ok: true };
  }

  function finishPay(legs) {
    var L = legs || getLegs();
    var parts = buildPayLegParts(L);
    settlePayAfterOk(L);
    closeSheet();
    ctx.nav = {};
    if (typeof ctx.onPaid === 'function') {
      var nav = ctx.onPaid({
        payMethod: formatPayMethodNames(parts),
        payLegs: parts,
        payable: L.payable
      });
      if (nav && typeof nav === 'object') ctx.nav = nav;
    }
    showResult(true, L);
  }

  function finishPayFail(legs) {
    releasePayFreeze();
    closeSheet();
    showResult(false, legs || getLegs());
  }

  function showResult(success, paidLegs) {
    ensureResultDom();
    var el = document.getElementById('orderPayResult');
    var body = document.getElementById('orderPayResultBody');
    if (!el || !body) return;
    var L = paidLegs || getLegs();
    var parts = buildPayLegParts(L).filter(function (p) {
      return p && Number(p.amount) > 0.001;
    });
    if (success) {
      var isMixed = parts.length >= 2;
      var amountHtml = isMixed
        ? '<div class="ua-co-result__amount-line"><span class="ua-co-result__amount">¥' +
          L.payable.toFixed(2) +
          '</span>' +
          '<button type="button" class="ua-co-pay-legs-toggle" id="orderPayLegsToggle" aria-expanded="false" aria-label="展开支付明细">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button></div>' +
          '<div class="ua-co-pay-legs ua-co-pay-legs--result" id="orderPayResultLegs" hidden>' +
          parts
            .map(function (p) {
              return (
                '<div class="ua-co-pay-legs__row"><span class="ua-co-pay-legs__name">' +
                p.name +
                '</span><span class="ua-co-pay-legs__amount">-¥' +
                Number(p.amount).toFixed(2) +
                '</span></div>'
              );
            })
            .join('') +
          '</div>'
        : '<div class="ua-co-result__amount">¥' + L.payable.toFixed(2) + '</div>';
      body.innerHTML =
        '<div class="ua-co-result__icon ua-co-result__icon--success">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg></div>' +
        '<div class="ua-co-result__title">支付成功</div>' +
        amountHtml +
        '<div class="ua-co-result__actions">' +
        '<button type="button" class="ua-co-result__btn" id="orderPayResultOrders">查看订单</button>' +
        '<button type="button" class="ua-co-result__btn ua-co-result__btn--primary" id="orderPayResultHome">返回首页</button>' +
        '</div>' +
        '<div class="ua-co-result__recommend">' +
        '<div class="ua-co-result__recommend-title">猜你喜欢</div>' +
        '<div class="ua-co-result__grid">' +
        '<div class="ua-co-result__product"><img src="../assets/restock/product-egg.svg" alt=""><div class="ua-co-result__product-name">红壳黄心鲜鸡蛋 中码 托装</div><div class="ua-co-result__product-price">¥28.90</div></div>' +
        '<div class="ua-co-result__product"><img src="../assets/restock/product-leaf.svg" alt=""><div class="ua-co-result__product-name">油麦菜【菜鲜】</div><div class="ua-co-result__product-price">¥3.20</div></div>' +
        '</div></div>';
      var toggle = document.getElementById('orderPayLegsToggle');
      var legsEl = document.getElementById('orderPayResultLegs');
      if (toggle && legsEl) {
        toggle.addEventListener('click', function () {
          var next = toggle.getAttribute('aria-expanded') !== 'true';
          toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
          toggle.classList.toggle('is-expanded', next);
          legsEl.hidden = !next;
        });
      }
      var ordersBtn = document.getElementById('orderPayResultOrders');
      if (ordersBtn) {
        ordersBtn.addEventListener('click', function () {
          window.location.href = ctx.nav.orderHref || 'orders.html?from=restock.html';
        });
      }
      var homeBtn = document.getElementById('orderPayResultHome');
      if (homeBtn) {
        homeBtn.addEventListener('click', function () {
          window.location.href = ctx.nav.homeHref || 'restock.html';
        });
      }
    } else {
      body.innerHTML =
        '<div class="ua-co-result__icon ua-co-result__icon--fail">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/></svg></div>' +
        '<div class="ua-co-result__title">支付失败</div>' +
        '<div class="ua-co-result__sub">请在 30 分钟内完成支付</div>' +
        '<div class="ua-co-result__actions">' +
        '<button type="button" class="ua-co-result__btn ua-co-result__btn--primary" id="orderPayResultRetry">重新支付</button>' +
        '<button type="button" class="ua-co-result__btn" id="orderPayResultView">查看订单</button>' +
        '</div>';
      var retry = document.getElementById('orderPayResultRetry');
      if (retry) {
        retry.addEventListener('click', function () {
          el.hidden = true;
          reopenSheet();
        });
      }
      var view = document.getElementById('orderPayResultView');
      if (view) {
        view.addEventListener('click', function () {
          window.location.href = ctx.nav.unpaidHref || 'orders.html?from=restock.html&tab=unpaid';
        });
      }
    }
    el.hidden = false;
  }

  function ensureResultDom() {
    var shell = document.querySelector('.ua-mobile-shell') || document.body;
    if (document.getElementById('orderPayResult')) return;
    var el = document.createElement('div');
    el.className = 'ua-co-result';
    el.id = 'orderPayResult';
    el.hidden = true;
    el.innerHTML = '<div class="ua-co-result__body" id="orderPayResultBody"></div>';
    shell.appendChild(el);
  }

  function jumpThirdPartyPay(channel, legs) {
    var L = legs || getLegs();
    L.channel = channel || L.channel || state.channel;
    state.channel = L.channel;
    var freeze = beginPayFreeze(L);
    if (freeze && freeze.ok === false) {
      window.alert(freeze.message || '余额冻结失败');
      return;
    }
    closeSheet();
    var shell = document.querySelector('.ua-mobile-shell') || document.body;
    var overlay = document.getElementById('orderThirdPay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'orderThirdPay';
      overlay.className = 'ua-od-thirdpay';
      overlay.innerHTML =
        '<div class="ua-od-thirdpay__spin" aria-hidden="true"></div><div id="orderThirdPayText"></div>';
      shell.appendChild(overlay);
    }
    var text = document.getElementById('orderThirdPayText');
    if (text) {
      text.textContent =
        (L.balanceLeg > 0.001 ? '已冻结余额，' : '') +
        '正在验证' +
        (L.channel === 'alipay' ? '支付宝' : '微信支付') +
        '回调…';
    }
    overlay.hidden = false;
    window.setTimeout(function () {
      overlay.hidden = true;
      finishPay(L);
    }, 900);
  }

  function onPickChannel(channel) {
    if (channel !== 'alipay' && channel !== 'wechat') return;
    state.channel = channel;
    renderSheet();
  }

  function confirmChannelPay() {
    if (state.busy) return;
    var legs = getLegs();
    if (legs.needsPassword) return;
    if (legs.needChannel && legs.channel !== 'alipay' && legs.channel !== 'wechat') {
      window.alert(legs.balanceLeg > 0.001 ? '请选择支付宝或微信补足差额' : '请选择支付方式');
      return;
    }
    jumpThirdPartyPay(legs.channel, legs);
  }

  function submitWithPassword() {
    if (state.busy) return;
    var legs = getLegs();
    if (!legs.needsPassword) return;
    /* 与确认订单页一致：演示密码非 000000 即成功 */
    if (state.pwd === '000000') {
      finishPayFail(legs);
      return;
    }
    state.busy = true;
    var freeze = beginPayFreeze(legs);
    if (freeze && freeze.ok === false) {
      state.busy = false;
      window.alert(freeze.message || '余额冻结失败');
      return;
    }
    finishPay(legs);
  }

  function ensureDom() {
    var shell = document.querySelector('.ua-mobile-shell') || document.body;
    if (document.getElementById('orderPaySheet')) return;
    var sheet = document.createElement('div');
    sheet.className = 'ua-od-pay-sheet';
    sheet.id = 'orderPaySheet';
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="ua-od-pay-sheet__mask" id="orderPaySheetMask"></div>' +
      '<div class="ua-od-pay-sheet__panel" role="dialog" aria-modal="true" aria-label="确认付款">' +
      '<button type="button" class="ua-od-pay-sheet__close" id="orderPaySheetClose" aria-label="关闭">×</button>' +
      '<div class="ua-od-pay-sheet__amount" id="orderPayAmount">¥0.00</div>' +
      '<div class="ua-od-pay-sheet__methods">' +
      '<div class="ua-od-pay-sheet__wallet" id="orderPayWalletRow">' +
      '<span class="ua-od-pay-sheet__wallet-label">钱包余额</span>' +
      '<span class="ua-od-pay-sheet__wallet-hint" id="orderPayWalletHint">已抵扣 ¥0.00</span>' +
      '<label class="ua-od-pay-switch">' +
      '<input type="checkbox" class="ua-od-pay-switch__input" id="orderPayUseBalance" checked>' +
      '<span class="ua-od-pay-switch__track"></span></label></div>' +
      '<button type="button" class="ua-od-pay-sheet__item" data-pay-channel="alipay" role="radio" aria-checked="false">' +
      '<span>支付宝</span><i class="ua-od-pay-sheet__check" aria-hidden="true"></i></button>' +
      '<button type="button" class="ua-od-pay-sheet__item" data-pay-channel="wechat" role="radio" aria-checked="false">' +
      '<span>微信支付</span><i class="ua-od-pay-sheet__check" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="ua-od-pay-sheet__split" id="orderPaySplit" hidden></div>' +
      '<button type="button" class="ua-od-pay-sheet__confirm" id="orderPayConfirm">确认付款</button>' +
      '<div class="ua-od-pay-sheet__pwd-block" id="orderPayPwdBlock" hidden>' +
      '<div class="ua-od-pay-sheet__pwd-label">请输入支付密码</div>' +
      '<div class="ua-od-pay-sheet__pwd" id="orderPayPwdDots" aria-label="支付密码">' +
      '<span></span><span></span><span></span><span></span><span></span><span></span></div>' +
      '<div class="ua-od-pay-sheet__forgot-row">' +
      '<button type="button" class="ua-od-pay-sheet__forgot" id="orderPayForgot">忘记密码</button></div>' +
      '<div class="ua-od-pay-sheet__keypad" id="orderPayPwdKeypad">' +
      '<button type="button" data-pay-key="1">1</button>' +
      '<button type="button" data-pay-key="2">2</button>' +
      '<button type="button" data-pay-key="3">3</button>' +
      '<button type="button" data-pay-key="4">4</button>' +
      '<button type="button" data-pay-key="5">5</button>' +
      '<button type="button" data-pay-key="6">6</button>' +
      '<button type="button" data-pay-key="7">7</button>' +
      '<button type="button" data-pay-key="8">8</button>' +
      '<button type="button" data-pay-key="9">9</button>' +
      '<button type="button" class="ua-od-pay-sheet__empty" disabled></button>' +
      '<button type="button" data-pay-key="0">0</button>' +
      '<button type="button" class="ua-od-pay-sheet__del" data-pay-key="del" aria-label="删除">⌫</button>' +
      '</div></div></div>';
    shell.appendChild(sheet);
  }

  function bindOnce() {
    if (document.body.dataset.uaPaySheetBound) return;
    document.body.dataset.uaPaySheetBound = '1';
    ensureDom();
    function cancelSheet() {
      releasePayFreeze();
      closeSheet();
    }
    var mask = document.getElementById('orderPaySheetMask');
    var closeBtn = document.getElementById('orderPaySheetClose');
    if (mask) mask.addEventListener('click', cancelSheet);
    if (closeBtn) closeBtn.addEventListener('click', cancelSheet);
    var confirm = document.getElementById('orderPayConfirm');
    if (confirm) confirm.addEventListener('click', confirmChannelPay);
    var forgot = document.getElementById('orderPayForgot');
    if (forgot) {
      forgot.addEventListener('click', function () {
        var path = window.location.pathname.split('/').pop() + window.location.search;
        var q = new URLSearchParams();
        q.set('step', 'sms');
        q.set('from', 'order-pay');
        q.set('return', path);
        var appFrom = new URLSearchParams(window.location.search).get('from');
        if (appFrom) q.set('appFrom', appFrom);
        window.location.href = 'store-pay-password.html?' + q.toString();
      });
    }
    var list = document.querySelector('#orderPaySheet .ua-od-pay-sheet__methods');
    if (list) {
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pay-channel]');
        if (!btn) return;
        onPickChannel(btn.getAttribute('data-pay-channel'));
      });
    }
    var toggle = document.getElementById('orderPayUseBalance');
    if (toggle) {
      toggle.addEventListener('change', function () {
        state.useBalance = !!toggle.checked;
        state.pwd = '';
        var legs = getLegs();
        if (legs.channelLeg > 0.001 && !state.channel) state.channel = 'wechat';
        if (state.useBalance && legs.balanceOnly) state.channel = '';
        renderSheet();
      });
    }
    var keypad = document.getElementById('orderPayPwdKeypad');
    if (keypad) {
      keypad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pay-key]');
        if (!btn || state.busy) return;
        var key = btn.getAttribute('data-pay-key');
        if (key === 'del') state.pwd = state.pwd.slice(0, -1);
        else if (state.pwd.length < 6) state.pwd += key;
        updatePwdDots();
        if (state.pwd.length === 6) {
          window.setTimeout(submitWithPassword, 160);
        }
      });
    }
  }

  function open(options) {
    options = options || {};
    ctx.isRestock = !!options.isRestock;
    ctx.getPayable =
      typeof options.getPayable === 'function'
        ? options.getPayable
        : function () {
            return Number(options.payable) || 0;
          };
    if (typeof options.onPaid === 'function') ctx.onPaid = options.onPaid;
    reopenSheet();
  }

  function reopenSheet() {
    state.pwd = '';
    state.busy = false;
    ensureDom();
    bindOnce();
    applyScene();
    var legs = getLegs();
    if (ctx.isRestock && legs.channelLeg > 0.001 && !state.channel) state.channel = 'wechat';
    if (ctx.isRestock && state.useBalance && legs.balanceOnly) state.channel = '';
    renderSheet();
    var result = document.getElementById('orderPayResult');
    if (result) result.hidden = true;
    var sheet = document.getElementById('orderPaySheet');
    if (sheet) sheet.hidden = false;
  }

  function mountDemoPanel() {
    if (!ctx.isRestock) return;
    if (document.getElementById('uaMixPayDemo')) return;
    var current = readMixPayDemo().scene;
    var options = MIX_PAY_SCENES.map(function (s) {
      return (
        '<option value="' +
        s.id +
        '"' +
        (s.id === current ? ' selected' : '') +
        '>' +
        s.label +
        '</option>'
      );
    }).join('');
    var panel = document.createElement('div');
    panel.id = 'uaMixPayDemo';
    panel.className = 'ua-mix-pay-demo';
    panel.innerHTML =
      '<div class="ua-mix-pay-demo__title">支付验收开关</div>' +
      '<label class="ua-mix-pay-demo__row">支付场景' +
      '<select id="uaMixPayDemoScene">' +
      options +
      '</select></label>' +
      '<div class="ua-mix-pay-demo__tip">选场景后点应用并刷新。纯余额输支付密码；混合/三方勾选渠道后点确认付款。</div>' +
      '<button type="button" class="ua-mix-pay-demo__apply" id="uaMixPayDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaMixPayDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaMixPayDemoScene');
        writeMixPayDemo(sel ? sel.value : 'auto');
        window.location.reload();
      });
    }
  }

  global.UaOrderPaySheet = {
    open: open,
    close: closeSheet,
    mountDemoPanel: function (isRestock) {
      ctx.isRestock = !!isRestock;
      mountDemoPanel();
    }
  };
})(typeof window !== 'undefined' ? window : this);
