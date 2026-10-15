/**
 * 直播中控发送现金红包后的 C 端表现。
 * 有预热：左侧红包图标走倒计时，倒计时结束才弹出红包雨。
 * 无预热或预热已结束：直接弹出。点击「领取」时若未授权微信支付收款，先出授权半屏；同意后金额自动转入微信，并播放金币落入账户。
 * 文案用本场现金红包业务说法，不照搬参考图外文。
 * 验收开关：跟随中控 / 预热中 / 可领取 / 已领取 / 未抢到 / 未发放。
 * 未抢到：点领取后不转微信、不落金币，提示留下等下一轮。
 */
(function (global) {
  'use strict';

  var ISSUE_KEY = 'lf_live_cash_redpack_issue_v1';
  var DEMO_KEY = 'ua_live_cash_rain_demo_v1';
  var DEMO_PAYLOAD_KEY = 'ua_live_cash_rain_demo_payload_v1';
  var CLAIM_KEY = 'ua_live_cash_rain_claim_v1';
  var DEMO_PREHEAT_SEC = 8;
  var DEMO_AMOUNT = 0.88;

  var opening = false;
  var shownId = '';
  var timer = 0;

  function sessionId() {
    try {
      var params = new URLSearchParams(location.search || '');
      return params.get('sessionId') || params.get('id') || 'sess-001';
    } catch (e) {
      return 'sess-001';
    }
  }

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, val) {
    try {
      if (val == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function readDemo() {
    try {
      var v = localStorage.getItem(DEMO_KEY);
      if (v === 'preheat' || v === 'open' || v === 'lost' || v === 'claimed' || v === 'none' || v === 'follow') return v;
    } catch (e) {}
    return 'follow';
  }

  function claimMap() {
    var data = readJson(CLAIM_KEY);
    if (!data || data.sessionId !== sessionId() || !data.ids) return {};
    return data.ids;
  }

  function isClaimed(id) {
    return !!(id && claimMap()[id]);
  }

  function writeClaim(id, amount) {
    var ids = claimMap();
    ids[id] = { amount: amount, at: Date.now() };
    writeJson(CLAIM_KEY, { sessionId: sessionId(), ids: ids });
  }

  function clearClaim(id) {
    var ids = claimMap();
    if (id) delete ids[id];
    writeJson(CLAIM_KEY, { sessionId: sessionId(), ids: ids });
  }

  function controlIssue() {
    var data = readJson(ISSUE_KEY);
    if (!data || data.sessionId !== sessionId()) return null;
    return data;
  }

  function currentIssue() {
    var mode = readDemo();
    if (mode === 'none' || mode === 'claimed') return null;
    if (mode === 'preheat' || mode === 'open' || mode === 'lost') return readJson(DEMO_PAYLOAD_KEY);
    return controlIssue();
  }

  function phaseOf(issue, now) {
    var mode = readDemo();
    if (mode === 'none') return 'none';
    if (mode === 'claimed') return 'claimed';
    if (!issue || issue.status === 'CLOSED') return 'none';
    if (isClaimed(issue.id)) return 'claimed';
    var start = Number(issue.startedAt);
    if (!isFinite(start)) return 'none';
    var pre = Math.max(0, Number(issue.preheatSec) || 0);
    var dur = Math.max(0, Number(issue.durationSec) || 0);
    var elapsed = (now - start) / 1000;
    if (elapsed < pre) return 'preheat';
    if (elapsed < pre + Math.max(dur, 1)) return 'claim';
    return 'expired';
  }

  function remainPreheat(issue, now) {
    var start = Number(issue.startedAt);
    var pre = Math.max(0, Number(issue.preheatSec) || 0);
    return Math.max(0, pre - (now - start) / 1000);
  }

  function clock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function moneyText(n) {
    var v = Math.round(Number(n) * 100) / 100;
    if (!isFinite(v)) v = 0;
    return v.toFixed(2);
  }

  function fallHtml() {
    var html = '';
    var i;
    for (i = 0; i < 16; i++) {
      var left = (i * 17 + 6) % 92;
      var size = 34 + ((i * 13) % 48);
      var rot = ((i * 23) % 50) - 25;
      var drift = ((i % 2) ? 1 : -1) * (8 + (i % 5) * 6);
      var dur = 6.2 + (i % 5) * 0.7;
      var delay = -((i * 0.45) % dur);
      html += '<i style="left:' + left + '%;--size:' + size + 'px;--rot:' + rot + 'deg;--drift:' + drift + 'px;--dur:' + dur + 's;--delay:' + delay + 's"></i>';
    }
    return html;
  }

  function mount(room) {
    var entry = document.createElement('button');
    entry.type = 'button';
    entry.className = 'ua-rain-entry';
    entry.id = 'uaRainEntry';
    entry.hidden = true;
    entry.innerHTML = '<span class="ua-rain-entry__env" aria-hidden="true"></span><span class="ua-rain-entry__time" id="uaRainTime">00:00</span>';
    room.appendChild(entry);

    var rain = document.createElement('div');
    rain.className = 'ua-rain';
    rain.id = 'uaRain';
    rain.hidden = true;
    rain.innerHTML =
      '<div class="ua-rain__fall" aria-hidden="true">' + fallHtml() + '</div>' +
      '<div class="ua-rain__stage">' +
        '<div class="ua-rain__chip">现金红包</div>' +
        '<div class="ua-rain__pack" id="uaRainPack">' +
          '<div class="ua-rain__shell">' +
            '<div class="ua-rain__slip"><em>恭喜</em><strong id="uaRainAmt">0.00</strong><p class="ua-rain__lost">很遗憾，没有抢到红包，不要离开等待下一轮奖励</p></div>' +
            '<div class="ua-rain__face">' +
              '<div class="ua-rain__name" id="uaRainName">现金红包</div>' +
              '<div class="ua-rain__hint">点击领取，现金红包将转入微信</div>' +
              '<button type="button" class="ua-rain__seal" id="uaRainSeal">领取</button>' +
              '<div class="ua-rain__done">已自动转账至微信</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="ua-rain__close" id="uaRainClose" aria-label="关闭">×</button>' +
      '</div>';
    room.appendChild(rain);

    var panel = document.createElement('div');
    panel.className = 'ua-rg-demo ua-live-rain-demo';
    panel.innerHTML =
      '<div class="ua-rg-demo__title">现金红包验收开关</div>' +
      '<label class="ua-rg-demo__row">发放状态' +
      '<select id="uaLiveRainDemoMode">' +
        '<option value="follow">跟随中控</option>' +
        '<option value="preheat">预热中</option>' +
        '<option value="open">可领取</option>' +
        '<option value="claimed">已领取</option>' +
        '<option value="lost">未抢到</option>' +
        '<option value="none">未发放</option>' +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveRainDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var sel = document.getElementById('uaLiveRainDemoMode');
    if (sel) sel.value = readDemo();
  }

  function paintEntry(issue, phase) {
    var entry = document.getElementById('uaRainEntry');
    var time = document.getElementById('uaRainTime');
    var rain = document.getElementById('uaRain');
    if (!entry) return;
    var show = phase === 'preheat' || (phase === 'claim' && rain && rain.hidden);
    entry.hidden = !show;
    entry.classList.toggle('is-ready', phase === 'claim');
    entry.setAttribute('aria-label', phase === 'preheat' ? '现金红包倒计时' : '领取现金红包');
    if (!time || !issue) return;
    if (phase === 'preheat') time.textContent = clock(remainPreheat(issue, Date.now()));
    else if (phase === 'claim') time.textContent = '领取';
  }

  function openPopup(issue) {
    var rain = document.getElementById('uaRain');
    var name = document.getElementById('uaRainName');
    var amt = document.getElementById('uaRainAmt');
    if (!rain || !issue) return;
    if (name) name.textContent = issue.name || '现金红包';
    if (amt) amt.textContent = moneyText(issue.amount);
    rain.classList.remove('is-open');
    rain.classList.remove('is-lost');
    rain.hidden = false;
    rain.setAttribute('data-id', issue.id || '');
    paintEntry(issue, 'claim');
  }

  function closePopup() {
    var rain = document.getElementById('uaRain');
    if (!rain) return;
    rain.classList.remove('is-open');
    rain.classList.remove('is-lost');
    rain.hidden = true;
  }

  var LOST_TEXT = '很遗憾，没有抢到红包，不要离开等待下一轮奖励';

  function cashNeedsWxAuth(issue) {
    if (!global.UaWxPayAuth || global.UaWxPayAuth.isAuthorized()) return false;
    if (issue.lost || readDemo() === 'lost') return false;
    var claimOpts = {
      id: 'send:' + issue.id,
      source: '现金红包',
      packetId: issue.id,
      templateId: issue.templateId || '',
      claimCondition: issue.claimCondition || '',
      inLive: true,
      activityType: issue.activityType
    };
    var block = '';
    if (global.UaLiveBagCash) {
      if (global.UaLiveBagCash.conditionBlock) block = global.UaLiveBagCash.conditionBlock(claimOpts);
      if (!block && global.UaLiveBagCash.claimBlock) block = global.UaLiveBagCash.claimBlock(claimOpts);
    }
    return !block;
  }

  function claim(issue) {
    if (opening || !issue || isClaimed(issue.id)) return;
    if (cashNeedsWxAuth(issue)) {
      global.UaWxPayAuth.ensure({
        onDone: function () {
          claim(issue);
        }
      });
      return;
    }
    opening = true;
    shownId = issue.id;
    var rain = document.getElementById('uaRain');
    var lostEl = rain ? rain.querySelector('.ua-rain__lost') : null;
    var claimOpts = {
      id: 'send:' + issue.id,
      source: '现金红包',
      packetId: issue.id,
      templateId: issue.templateId || '',
      claimCondition: issue.claimCondition || '',
      registerDays: issue.registerDays,
      orderCount: issue.orderCount,
      orderAmount: issue.orderAmount,
      orderDayRange: issue.orderDayRange,
      memberAudience: issue.memberAudience || '',
      memberScope: issue.memberScope || '',
      memberLevelIds: issue.memberLevelIds || [],
      memberTagIds: issue.memberTagIds || [],
      memberSegmentIds: issue.memberSegmentIds || [],
      perUserLimit: issue.perUserLimit,
      claimTimesMode: issue.claimTimesMode,
      manual: issue.manual,
      activityType: issue.activityType,
      inLive: true
    };
    var block = '';
    if (!(issue.lost || readDemo() === 'lost') && global.UaLiveBagCash) {
      if (global.UaLiveBagCash.conditionBlock) block = global.UaLiveBagCash.conditionBlock(claimOpts);
      if (!block && global.UaLiveBagCash.claimBlock) block = global.UaLiveBagCash.claimBlock(claimOpts);
    }
    var lost = !block && !!(issue.lost || readDemo() === 'lost');
    if (lostEl) lostEl.textContent = block || LOST_TEXT;
    if (rain) {
      rain.classList.add('is-open');
      if (lost || block) rain.classList.add('is-lost');
    }
    if (block) {
      if (global.UaLiveBagCash.showLimitTip) global.UaLiveBagCash.showLimitTip(block);
      global.setTimeout(function () {
        opening = false;
        closePopup();
        if (lostEl) lostEl.textContent = LOST_TEXT;
        paintEntry(issue, 'claim');
      }, 2600);
      return;
    }
    if (lost) {
      global.setTimeout(function () {
        writeClaim(issue.id, 0);
        opening = false;
        closePopup();
        paintEntry(issue, 'claimed');
      }, 2600);
      return;
    }
    global.setTimeout(function () {
      var from = document.querySelector('.ua-rain__slip') || document.getElementById('uaRainPack');
      if (global.UaLiveBagCash && global.UaLiveBagCash.receive) {
        global.UaLiveBagCash.receive({
          id: 'send:' + issue.id,
          source: '现金红包',
          name: issue.name || '现金红包',
          packetId: issue.id,
          templateId: issue.templateId || '',
          claimCondition: issue.claimCondition || '',
          registerDays: issue.registerDays,
          orderCount: issue.orderCount,
          orderAmount: issue.orderAmount,
          orderDayRange: issue.orderDayRange,
          memberAudience: issue.memberAudience || '',
          memberScope: issue.memberScope || '',
          memberLevelIds: issue.memberLevelIds || [],
          memberTagIds: issue.memberTagIds || [],
          memberSegmentIds: issue.memberSegmentIds || [],
          perUserLimit: issue.perUserLimit,
          claimTimesMode: issue.claimTimesMode,
          manual: issue.manual,
          activityType: issue.activityType,
          amount: Number(issue.amount) || 0,
          fromEl: from
        });
      }
      writeClaim(issue.id, issue.amount);
      opening = false;
      closePopup();
      paintEntry(issue, 'claimed');
    }, 1100);
  }

  function tick() {
    var issue = currentIssue();
    var phase = phaseOf(issue, Date.now());
    paintEntry(issue, phase);
    if (phase === 'claim' && issue && shownId !== issue.id && !opening) {
      var rain = document.getElementById('uaRain');
      if (rain && rain.hidden) {
        shownId = issue.id;
        openPopup(issue);
      }
    }
    if (!opening && phase !== 'claim' && phase !== 'preheat') closePopup();
  }

  function bind() {
    var entry = document.getElementById('uaRainEntry');
    var seal = document.getElementById('uaRainSeal');
    var close = document.getElementById('uaRainClose');
    var apply = document.getElementById('uaLiveRainDemoApply');
    if (entry) entry.addEventListener('click', function () {
      var issue = currentIssue();
      if (phaseOf(issue, Date.now()) !== 'claim') return;
      shownId = issue.id;
      openPopup(issue);
    });
    if (seal) seal.addEventListener('click', function () {
      var issue = currentIssue();
      if (phaseOf(issue, Date.now()) !== 'claim') return;
      claim(issue);
    });
    if (close) close.addEventListener('click', function () {
      if (opening || document.getElementById('uaRain').classList.contains('is-open')) return;
      closePopup();
      paintEntry(currentIssue(), phaseOf(currentIssue(), Date.now()));
    });
    if (apply) apply.addEventListener('click', function () {
      var sel = document.getElementById('uaLiveRainDemoMode');
      var mode = sel ? sel.value : 'follow';
      var now = Date.now();
      try { localStorage.setItem(DEMO_KEY, mode); } catch (e) {}
      if (mode === 'preheat') {
        clearClaim('demo-rain-preheat');
        writeJson(DEMO_PAYLOAD_KEY, {
          sessionId: sessionId(),
          id: 'demo-rain-preheat',
          name: '新人注册红包',
          amount: DEMO_AMOUNT,
          preheatSec: DEMO_PREHEAT_SEC,
          durationSec: 180,
          startedAt: now,
          status: 'ACTIVE'
        });
      } else if (mode === 'open') {
        clearClaim('demo-rain-open');
        writeJson(DEMO_PAYLOAD_KEY, {
          sessionId: sessionId(),
          id: 'demo-rain-open',
          name: '新人注册红包',
          amount: DEMO_AMOUNT,
          preheatSec: DEMO_PREHEAT_SEC,
          durationSec: 180,
          startedAt: now - (DEMO_PREHEAT_SEC + 1) * 1000,
          status: 'ACTIVE'
        });
      } else if (mode === 'lost') {
        clearClaim('demo-rain-lost');
        writeJson(DEMO_PAYLOAD_KEY, {
          sessionId: sessionId(),
          id: 'demo-rain-lost',
          name: '新人注册红包',
          amount: DEMO_AMOUNT,
          preheatSec: DEMO_PREHEAT_SEC,
          durationSec: 180,
          startedAt: now - (DEMO_PREHEAT_SEC + 1) * 1000,
          status: 'ACTIVE',
          lost: true
        });
      } else if (mode === 'claimed') {
        writeClaim('demo-rain-open', DEMO_AMOUNT);
      }
      try { sessionStorage.setItem('ua_skip_watch_reward_modal_v1', '1'); } catch (e2) {}
      global.location.reload();
    });
    global.addEventListener('storage', function (ev) {
      if (ev.key === ISSUE_KEY) {
        shownId = '';
        tick();
      }
    });
  }

  function init() {
    var room = document.querySelector('.ua-live-room');
    if (!room || document.getElementById('uaRainEntry')) return;
    mount(room);
    bind();
    tick();
    timer = global.setInterval(tick, 250);
  }

  global.UaLiveCashRain = { init: init };
})(window);
