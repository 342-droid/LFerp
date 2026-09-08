/**
 * 待支付：钱包余额 + 支付宝/微信二选一
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
    onPaid: null
  };
  var state = {
    useBalance: true,
    channel: '',
    pwd: ''
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
      balanceOnly: balanceLeg > 0 && channelLeg <= 0.001
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

  function renderWallet() {
    var row = document.getElementById('orderPayWalletRow');
    var hint = document.getElementById('orderPayWalletHint');
    var toggle = document.getElementById('orderPayUseBalance');
    var legs = getLegs();
    var showWallet = ctx.isRestock && legs.available > 0.001;
    if (row) row.hidden = !showWallet;
    if (toggle) toggle.checked = !!state.useBalance;
    if (hint) hint.textContent = '已抵扣 ¥' + legs.balanceLeg.toFixed(2);
    syncChannelUI();
  }

  function closeSheet() {
    var sheet = document.getElementById('orderPaySheet');
    if (sheet) sheet.hidden = true;
  }

  function updatePwdDots() {
    document.querySelectorAll('#orderPayPwdDots span').forEach(function (dot, i) {
      dot.classList.toggle('filled', i < state.pwd.length);
    });
  }

  function closePwd() {
    var sheet = document.getElementById('orderPayPwdSheet');
    if (sheet) sheet.hidden = true;
    state.pwd = '';
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
    closePwd();
    if (typeof ctx.onPaid === 'function') {
      ctx.onPaid({
        payMethod: formatPayMethodNames(parts),
        payLegs: parts,
        payable: L.payable
      });
    }
  }

  function openPwd(legs) {
    var L = legs || getLegs();
    var freeze = beginPayFreeze(L);
    if (freeze && freeze.ok === false) {
      window.alert(freeze.message || '余额冻结失败');
      return;
    }
    state.pwd = '';
    updatePwdDots();
    var amountEl = document.getElementById('orderPayPwdAmount');
    if (amountEl) amountEl.textContent = '¥' + L.payable.toFixed(2);
    var methodEl = document.getElementById('orderPayPwdMethodText');
    if (methodEl) {
      if (L.balanceOnly) methodEl.textContent = '钱包余额支付';
      else if (L.balanceLeg > 0 && L.channelLeg > 0) {
        methodEl.textContent = '余额 + ' + payChannelShortName(L.channel);
      } else {
        methodEl.textContent = payChannelShortName(L.channel);
      }
    }
    var split = document.getElementById('orderPayPwdSplit');
    if (split) {
      var parts = buildPayLegParts(L);
      if (L.balanceLeg > 0 && L.channelLeg > 0) {
        split.hidden = false;
        split.innerHTML = parts
          .map(function (p) {
            return (
              '<div class="ua-od-pwd-sheet__split-row"><span>' +
              p.name +
              '</span><span class="ua-od-pwd-sheet__split-amount">-¥' +
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
    closeSheet();
    var sheet = document.getElementById('orderPayPwdSheet');
    if (sheet) sheet.hidden = false;
  }

  function jumpThirdPartyPay(channel) {
    state.channel = channel;
    var legs = getLegs();
    legs.channel = channel;
    var freeze = beginPayFreeze(legs);
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
        (legs.balanceLeg > 0.001 ? '已冻结余额，' : '') +
        '正在验证' +
        (channel === 'alipay' ? '支付宝' : '微信支付') +
        '回调…';
    }
    overlay.hidden = false;
    window.setTimeout(function () {
      overlay.hidden = true;
      finishPay(legs);
    }, 900);
  }

  function onPickChannel(channel) {
    if (channel !== 'alipay' && channel !== 'wechat') return;
    state.channel = channel;
    syncChannelUI();
    var legs = getLegs();
    legs.channel = channel;
    if (ctx.isRestock && state.useBalance && legs.balanceOnly) {
      openPwd(legs);
      return;
    }
    if (ctx.isRestock && legs.needChannel) {
      jumpThirdPartyPay(channel);
      return;
    }
    finishPay(legs);
  }

  function ensureDom() {
    var shell = document.querySelector('.ua-mobile-shell') || document.body;
    if (!document.getElementById('orderPaySheet')) {
      var sheet = document.createElement('div');
      sheet.className = 'ua-od-pay-sheet';
      sheet.id = 'orderPaySheet';
      sheet.hidden = true;
      sheet.innerHTML =
        '<div class="ua-od-pay-sheet__mask" id="orderPaySheetMask"></div>' +
        '<div class="ua-od-pay-sheet__panel" role="dialog" aria-modal="true" aria-label="选择支付方式">' +
        '<div class="ua-od-pay-sheet__wallet" id="orderPayWalletRow">' +
        '<span class="ua-od-pay-sheet__wallet-label">钱包余额</span>' +
        '<span class="ua-od-pay-sheet__wallet-hint" id="orderPayWalletHint">已抵扣 ¥0.00</span>' +
        '<label class="ua-od-pay-switch">' +
        '<input type="checkbox" class="ua-od-pay-switch__input" id="orderPayUseBalance" checked>' +
        '<span class="ua-od-pay-switch__track"></span></label></div>' +
        '<div class="ua-od-pay-sheet__list" role="radiogroup" aria-label="支付方式">' +
        '<button type="button" class="ua-od-pay-sheet__item" data-pay-channel="alipay" role="radio" aria-checked="false">支付宝</button>' +
        '<button type="button" class="ua-od-pay-sheet__item" data-pay-channel="wechat" role="radio" aria-checked="false">微信支付</button>' +
        '</div>' +
        '<button type="button" class="ua-od-pay-sheet__cancel" id="orderPaySheetCancel">取消</button>' +
        '</div>';
      shell.appendChild(sheet);
    }
    if (!document.getElementById('orderPayPwdSheet')) {
      var pwd = document.createElement('div');
      pwd.className = 'ua-od-pwd-sheet';
      pwd.id = 'orderPayPwdSheet';
      pwd.hidden = true;
      pwd.innerHTML =
        '<div class="ua-od-pwd-sheet__mask" id="orderPayPwdMask"></div>' +
        '<div class="ua-od-pwd-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="orderPayPwdTitle">' +
        '<button type="button" class="ua-od-pwd-sheet__close" id="orderPayPwdClose" aria-label="关闭">×</button>' +
        '<div class="ua-od-pwd-sheet__title" id="orderPayPwdTitle">确认付款</div>' +
        '<div class="ua-od-pwd-sheet__amount" id="orderPayPwdAmount">¥0.00</div>' +
        '<div class="ua-od-pwd-sheet__method" id="orderPayPwdMethod">' +
        '<svg viewBox="0 0 24 24" fill="#FF7A00"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18" stroke="#fff" stroke-width="1.2"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/></svg>' +
        '<span id="orderPayPwdMethodText">钱包余额</span></div>' +
        '<div class="ua-od-pwd-sheet__split" id="orderPayPwdSplit" hidden></div>' +
        '<div class="ua-od-pwd-sheet__pwd-label">请输入支付密码</div>' +
        '<div class="ua-od-pwd-sheet__pwd" id="orderPayPwdDots" aria-label="支付密码">' +
        '<span></span><span></span><span></span><span></span><span></span><span></span></div>' +
        '<div class="ua-od-pwd-sheet__keypad" id="orderPayPwdKeypad">' +
        '<button type="button" data-pay-key="1">1</button>' +
        '<button type="button" data-pay-key="2">2</button>' +
        '<button type="button" data-pay-key="3">3</button>' +
        '<button type="button" data-pay-key="4">4</button>' +
        '<button type="button" data-pay-key="5">5</button>' +
        '<button type="button" data-pay-key="6">6</button>' +
        '<button type="button" data-pay-key="7">7</button>' +
        '<button type="button" data-pay-key="8">8</button>' +
        '<button type="button" data-pay-key="9">9</button>' +
        '<button type="button" class="ua-od-pwd-sheet__empty" disabled></button>' +
        '<button type="button" data-pay-key="0">0</button>' +
        '<button type="button" class="ua-od-pwd-sheet__del" data-pay-key="del" aria-label="删除">⌫</button>' +
        '</div></div>';
      shell.appendChild(pwd);
    }
  }

  function bindOnce() {
    if (document.body.dataset.uaPaySheetBound) return;
    document.body.dataset.uaPaySheetBound = '1';
    ensureDom();
    var mask = document.getElementById('orderPaySheetMask');
    var cancel = document.getElementById('orderPaySheetCancel');
    if (mask) mask.addEventListener('click', closeSheet);
    if (cancel) cancel.addEventListener('click', closeSheet);
    var list = document.querySelector('#orderPaySheet .ua-od-pay-sheet__list');
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
        var legs = getLegs();
        if (legs.channelLeg > 0.001 && !state.channel) state.channel = 'wechat';
        if (state.useBalance && legs.balanceOnly) state.channel = '';
        renderWallet();
      });
    }
    var pwdClose = document.getElementById('orderPayPwdClose');
    var pwdMask = document.getElementById('orderPayPwdMask');
    function cancelPwd() {
      releasePayFreeze();
      closePwd();
    }
    if (pwdClose) pwdClose.addEventListener('click', cancelPwd);
    if (pwdMask) pwdMask.addEventListener('click', cancelPwd);
    var keypad = document.getElementById('orderPayPwdKeypad');
    if (keypad) {
      keypad.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pay-key]');
        if (!btn) return;
        var key = btn.getAttribute('data-pay-key');
        if (key === 'del') state.pwd = state.pwd.slice(0, -1);
        else if (state.pwd.length < 6) state.pwd += key;
        updatePwdDots();
        if (state.pwd.length === 6) {
          window.setTimeout(function () {
            var success = state.pwd !== '000000';
            var legs = getLegs();
            closePwd();
            if (success) finishPay(legs);
            else {
              releasePayFreeze();
              window.alert('支付失败，请重试');
            }
          }, 300);
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
    ctx.onPaid = typeof options.onPaid === 'function' ? options.onPaid : null;
    ensureDom();
    bindOnce();
    applyScene();
    var legs = getLegs();
    if (ctx.isRestock && legs.channelLeg > 0.001 && !state.channel) state.channel = 'wechat';
    if (ctx.isRestock && state.useBalance && legs.balanceOnly) state.channel = '';
    renderWallet();
    var sheet = document.getElementById('orderPaySheet');
    if (sheet) sheet.hidden = false;
  }

  function mountDemoPanel() {
    if (!ctx.isRestock && !(arguments[0] && arguments[0].forceRestock)) return;
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
      '<div class="ua-mix-pay-demo__tip">选场景后点应用并刷新。余额不足会压低钱包可用额，用来走混合支付。</div>' +
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
