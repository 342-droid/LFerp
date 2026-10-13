/**
 * 直播间签到。现金红包点「签到」后直接落入现金账户并播放落袋声，不再二次确认。
 * 积分奖励只提示到账，不飞金币。未发放时不显示入口。
 */
(function (global) {
  'use strict';

  var DEMO_KEY = 'ua_live_signin_demo_v1';
  var CLAIM_KEY = 'ua_live_signin_claim_v1';
  var CREDIT_KEY = 'ua_live_cash_credits_v1';
  var LEDGER_KEY = 'ua_live_cash_claim_ledger_v1';
  var AMOUNT = 1.2;
  var TEMPLATE_ID = 'CRPT10006';

  function sessionId() {
    try {
      var params = new URLSearchParams(location.search || '');
      return params.get('sessionId') || params.get('id') || 'sess-001';
    } catch (e) {
      return 'sess-001';
    }
  }

  function signId() {
    return 'sign:' + sessionId();
  }

  function readDemo() {
    try {
      var v = localStorage.getItem(DEMO_KEY);
      if (v === 'claimed' || v === 'points' || v === 'none' || v === 'pending') return v;
    } catch (e) {}
    return 'pending';
  }

  function readClaim() {
    try {
      var data = JSON.parse(localStorage.getItem(CLAIM_KEY) || 'null');
      if (data && data.sessionId === sessionId()) return data;
    } catch (e) {}
    return null;
  }

  function writeClaim(extra) {
    var data = {
      sessionId: sessionId(),
      claimed: true,
      kind: extra && extra.kind ? extra.kind : 'cash',
      amount: extra && extra.amount ? extra.amount : 0,
      at: extra && extra.at ? extra.at : ''
    };
    try {
      localStorage.setItem(CLAIM_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function clockNow() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function dropSignCredit() {
    try {
      var data = JSON.parse(localStorage.getItem(CREDIT_KEY) || 'null');
      if (data && Array.isArray(data.items)) {
        data.items = data.items.filter(function (item) {
          return !item || item.id !== signId();
        });
        localStorage.setItem(CREDIT_KEY, JSON.stringify(data));
      }
    } catch (e) {}
    try {
      var ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null');
      if (ledger && Array.isArray(ledger.items)) {
        ledger.items = ledger.items.filter(function (item) {
          return !item || item.id !== signId();
        });
        localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
      }
    } catch (e2) {}
  }

  function done() {
    if (readDemo() === 'claimed') return true;
    var saved = readClaim();
    return !!(saved && saved.claimed);
  }

  function showButton() {
    return readDemo() !== 'none';
  }

  function render() {
    var btn = document.getElementById('uaLiveSignin');
    if (!btn) return;
    var finished = done();
    btn.hidden = !showButton();
    btn.textContent = finished ? '已签到' : '签到';
    btn.classList.toggle('is-done', finished);
    btn.disabled = finished;
  }

  function tip(msg) {
    if (global.UaLiveBagCash && typeof global.UaLiveBagCash.showLimitTip === 'function') {
      global.UaLiveBagCash.showLimitTip(msg);
    }
  }

  function signIn() {
    if (done() || readDemo() === 'none') return;
    if (readDemo() === 'points') {
      writeClaim({ kind: 'points', amount: 0, at: clockNow() });
      render();
      tip('签到成功，获得 5 积分');
      return;
    }
    var bag = global.UaLiveBagCash;
    if (!bag || typeof bag.receive !== 'function') return;
    var btn = document.getElementById('uaLiveSignin');
    var ok = bag.receive({
      id: signId(),
      source: '签到',
      name: '审核通过红包',
      packetId: signId(),
      templateId: TEMPLATE_ID,
      amount: AMOUNT,
      outBillNo: 'LFCR20261014043000120',
      fromEl: btn,
      inLive: true,
      activityType: 'sign'
    });
    if (!ok) return;
    writeClaim({ kind: 'cash', amount: AMOUNT, at: clockNow() });
    render();
  }

  function mountDemo() {
    if (document.getElementById('uaLiveSigninDemo')) return;
    var panel = document.createElement('div');
    panel.className = 'ua-rg-demo ua-live-signin-demo';
    panel.id = 'uaLiveSigninDemo';
    var mode = readDemo();
    function opt(value, label) {
      return '<option value="' + value + '"' + (mode === value ? ' selected' : '') + '>' + label + '</option>';
    }
    panel.innerHTML =
      '<div class="ua-rg-demo__title">签到验收开关</div>' +
      '<label class="ua-rg-demo__row">签到状态' +
      '<select id="uaLiveSigninDemoMode">' +
      opt('pending', '待签到') +
      opt('claimed', '已签到') +
      opt('points', '积分奖励') +
      opt('none', '未发放') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveSigninDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaLiveSigninDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaLiveSigninDemoMode');
      var next = sel ? sel.value : 'pending';
      try {
        if (next && next !== 'pending') localStorage.setItem(DEMO_KEY, next);
        else localStorage.removeItem(DEMO_KEY);
        localStorage.removeItem(CLAIM_KEY);
      } catch (e) {}
      dropSignCredit();
      try { sessionStorage.setItem('ua_skip_watch_reward_modal_v1', '1'); } catch (e2) {}
      window.location.reload();
    });
  }

  function init() {
    var room = document.querySelector('.ua-live-room');
    if (!room || document.getElementById('uaLiveSignin')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'uaLiveSignin';
    btn.className = 'ua-live-signin';
    btn.textContent = '签到';
    room.appendChild(btn);
    btn.addEventListener('click', signIn);
    mountDemo();
    render();
    if (global.UAShop && typeof global.UAShop.scheduleLiveRoomLeftDemos === 'function') {
      global.UAShop.scheduleLiveRoomLeftDemos();
    }
  }

  global.UaLiveSignin = { init: init };
})(window);
