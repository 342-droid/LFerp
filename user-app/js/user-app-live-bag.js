/**
 * 直播间现金红包福袋。
 * 同一活动同一时段每人只能领一个，领取后弹窗消失。
 * 已授权时领取后自动转账到微信。未授权时红包先入账户待领取，不自动打微信。
 * 福袋、中控红包、签到、观看任务领到现金，无论是否已授权，都播放金币落入本场红包图标和落袋声。未授权不加本场已打款金额。
 * 预热只在中控倒计时；这里展示的是已经可以领取的福袋。
 * 验收开关：待领取 / 已领取 / 未中奖 / 未抢到 / 未发放。
 * 未抢到：点领取后不转微信、不落金币，提示留下等下一轮。
 * 领取条件（会员等级、分群、标签、新注册、累计金额、累计笔数）在点击福袋入口时提示，不打开红包层。次数仍在点领取时判断。
 * 限领触顶：按单场次 / 平台累计 / 单个红包 / 每日给出失败文案，不转微信、不落金币。手动派发、签到、观看任务不受限制。
 */
(function (global) {
  'use strict';

  var DEMO_KEY = 'ua_live_bag_cash_demo_v1';
  var CLAIM_KEY = 'ua_live_bag_cash_claim_v1';
  var CREDIT_KEY = 'ua_live_cash_credits_v1';
  var HOLD_KEY = 'ua_live_cash_hold_v1';
  var LIMIT_DEMO_KEY = 'ua_live_cash_limit_demo_v1';
  var LEDGER_KEY = 'ua_live_cash_claim_ledger_v1';
  var BAG_AMOUNT = 0.81;
  var LIMIT_MSG = {
    live: '领取失败，该场次红包已达上限！',
    total: '领取失败，您已达平台领取上限！',
    packet: '领取失败，该红包已达领取上限！',
    daily: '领取失败，您今日领取已达上限！'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(n) {
    return '¥' + (Math.round(Number(n) * 100) / 100).toFixed(2);
  }

  function sessionCash(n) {
    var v = Math.round(Number(n) * 100) / 100;
    if (!isFinite(v)) v = 0;
    if (Math.abs(v - Math.round(v)) < 0.001) return String(Math.round(v));
    return v.toFixed(2);
  }

  function sessionId() {
    try {
      var params = new URLSearchParams(location.search || '');
      return params.get('sessionId') || params.get('id') || 'sess-001';
    } catch (e) {
      return 'sess-001';
    }
  }

  function readDemo() {
    try {
      var v = localStorage.getItem(DEMO_KEY);
      if (v === 'claimed' || v === 'miss' || v === 'lost' || v === 'none' || v === 'pending') return v;
    } catch (e) {}
    return 'pending';
  }

  function readClaim() {
    try {
      var raw = localStorage.getItem(CLAIM_KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (data && data.sessionId === sessionId()) return data;
    } catch (e) {}
    return null;
  }

  function writeClaim(extra) {
    try {
      localStorage.setItem(CLAIM_KEY, JSON.stringify(Object.assign({ sessionId: sessionId() }, extra)));
    } catch (e) {}
  }

  function clearClaim() {
    try {
      localStorage.removeItem(CLAIM_KEY);
    } catch (e) {}
  }

  function clockNow() {
    var d = new Date();
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function dayKey(ts) {
    var d = new Date(ts);
    if (!isFinite(d.getTime())) return '';
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseTime(at) {
    if (typeof at === 'number') return at;
    var text = String(at || '').trim();
    if (!text) return NaN;
    var t = new Date(text.replace(/-/g, '/')).getTime();
    return t;
  }

  function inWindow(ts, days) {
    var n = Math.round(Number(days) || 0);
    if (!(n > 0)) return isFinite(ts);
    if (!isFinite(ts)) return false;
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (n - 1));
    return ts >= start.getTime();
  }

  function readLimitDemo() {
    try {
      var v = localStorage.getItem(LIMIT_DEMO_KEY) || '';
      if (v === 'live' || v === 'total' || v === 'packet' || v === 'daily' || v === 'manual') return v;
    } catch (e) {}
    return '';
  }

  function isLimitExempt(opts) {
    opts = opts || {};
    if (readLimitDemo() === 'manual') return true;
    var store = global.MdmMarketingCashRedpackStore;
    if (store && typeof store.claimLimitExempt === 'function') return store.claimLimitExempt(opts);
    if (opts.manual || opts.limitExempt || opts.exempt) return true;
    var type = String(opts.activityType || '').toLowerCase();
    if (type === 'manual' || type === 'sign' || type === 'signin' || type === 'sign_in' || type === 'watch' || type === 'watch_task' || type === 'task') return true;
    var source = String(opts.source || '');
    return source === '签到' || source === '观看任务';
  }

  function readLedger() {
    try {
      var data = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null');
      if (data && Array.isArray(data.items)) return data.items;
    } catch (e) {}
    return [];
  }

  function noteClaim(opts) {
    opts = opts || {};
    var items = readLedger();
    items.push({
      id: opts.id || '',
      sessionId: sessionId(),
      packetId: opts.packetId || '',
      templateId: opts.templateId || '',
      at: Date.now(),
      source: opts.source || '',
      activityType: opts.activityType || '',
      manual: !!(opts.manual || opts.activityType === 'manual' || readLimitDemo() === 'manual'),
      exempt: isLimitExempt(opts)
    });
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify({ items: items }));
    } catch (e) {}
  }

  function currentUserId() {
    try {
      var raw = localStorage.getItem('ua_user_session_v1');
      var session = raw ? JSON.parse(raw) : null;
      if (session && (session.userId || session.id)) return String(session.userId || session.id);
    } catch (e) {}
    return 'U10086';
  }

  function sameCashUser(it, userId) {
    if (!it) return false;
    if (userId && it.userId && String(it.userId) === userId) return true;
    if (userId === 'U10086' && String(it.userPhone || '') === '159****4315') return true;
    return false;
  }

  function limitUsage(opts) {
    opts = opts || {};
    var session = sessionId();
    var packetId = String(opts.packetId || '');
    var templateId = String(opts.templateId || '');
    var packetLimit = Math.max(0, Math.round(Number(opts.perUserLimit) || 0));
    var templateOnce = opts.claimTimesMode === 'per_user';
    var usedLive = 0;
    var usedToday = 0;
    var usedTotal = 0;
    var usedPacket = 0;
    var usedTemplate = 0;
    var today = dayKey(Date.now());
    var range = 0;
    var store = global.MdmMarketingCashRedpackStore;
    if (store && store.getSettings) range = store.getSettings().totalDayRange;
    readLedger().forEach(function (it) {
      if (!it || it.manual || it.exempt) return;
      var at = Number(it.at);
      if (String(it.sessionId || '') === session) usedLive += 1;
      if (dayKey(at) === today) usedToday += 1;
      if (inWindow(at, range)) usedTotal += 1;
      if (packetId && String(it.packetId || '') === packetId) usedPacket += 1;
      if (templateId && String(it.templateId || '') === templateId) usedTemplate += 1;
    });
    if (store && store.getAll) {
      var userId = currentUserId();
      store.getAll().forEach(function (it) {
        if (!it || it.status !== 'claimed') return;
        if (store.claimLimitExempt ? store.claimLimitExempt(it) : it.activityType === 'manual') return;
        if (!sameCashUser(it, userId)) return;
        var at = parseTime(it.claimAt || it.grantedAt);
        if (String(it.liveId || '') === session) usedLive += 1;
        if (dayKey(at) === today) usedToday += 1;
        if (inWindow(at, range)) usedTotal += 1;
      });
    }
    return {
      usedLive: usedLive,
      usedToday: usedToday,
      usedTotal: usedTotal,
      usedPacket: usedPacket,
      usedTemplate: usedTemplate,
      packetLimit: packetLimit,
      templateOnce: templateOnce
    };
  }

  function conditionBlock(opts) {
    opts = opts || {};
    var tplStore = global.MdmMarketingCashRedpackTplStore;
    var item = opts;
    if (opts.templateId && tplStore && typeof tplStore.getById === 'function') {
      var tpl = tplStore.getById(opts.templateId);
      if (tpl) item = tpl;
    }
    if (tplStore && typeof tplStore.claimDenyMessage === 'function') return tplStore.claimDenyMessage(item, {});
    return '';
  }

  function claimBlock(opts) {
    opts = opts || {};
    if (isLimitExempt(opts)) return '';
    var demo = readLimitDemo();
    if (LIMIT_MSG[demo]) return LIMIT_MSG[demo];
    var store = global.MdmMarketingCashRedpackStore;
    if (!store || typeof store.activityClaimRemain !== 'function') return '';
    var usage = limitUsage(opts);
    var decision = store.activityClaimRemain({
      activityType: opts.activityType || 'live_cash',
      inLive: opts.inLive !== false,
      usedLive: usage.usedLive,
      usedToday: usage.usedToday,
      usedTotal: usage.usedTotal,
      usedPacket: usage.usedPacket,
      packetLimit: usage.packetLimit,
      usedTemplate: usage.usedTemplate,
      templateOnce: usage.templateOnce,
      orderAmountToday: opts.orderAmountToday
    });
    if (decision && decision.limited && decision.remain === 0) return decision.message || '';
    return '';
  }

  function showLimitTip(msg) {
    var text = String(msg || '').trim();
    if (!text) return;
    var room = document.querySelector('.ua-live-room') || document.body;
    var el = document.getElementById('uaLiveLimitTip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'uaLiveLimitTip';
      el.className = 'ua-live-limit-tip';
      el.setAttribute('role', 'status');
      room.appendChild(el);
    }
    el.textContent = text;
    el.hidden = false;
    clearTimeout(showLimitTip._t);
    showLimitTip._t = setTimeout(function () {
      el.hidden = true;
    }, 2800);
  }

  function mountLimitDemo() {
    if (document.getElementById('uaLiveLimitDemo')) return;
    var panel = document.createElement('div');
    panel.className = 'ua-rg-demo ua-live-limit-demo';
    panel.id = 'uaLiveLimitDemo';
    var mode = readLimitDemo();
    function opt(value, label) {
      return '<option value="' + value + '"' + (mode === value ? ' selected' : '') + '>' + label + '</option>';
    }
    panel.innerHTML =
      '<div class="ua-rg-demo__title">现金红包限领验收开关</div>' +
      '<label class="ua-rg-demo__row">限领状态' +
      '<select id="uaLiveLimitDemoMode">' +
      opt('', '跟随配置') +
      opt('live', '单场次限领') +
      opt('total', '平台累计限领') +
      opt('packet', '单个红包限领') +
      opt('daily', '每日限领') +
      opt('manual', '手动派发') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveLimitDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    mountCondDemo();
    var apply = document.getElementById('uaLiveLimitDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaLiveLimitDemoMode');
      var next = sel ? sel.value : '';
      try {
        if (next) localStorage.setItem(LIMIT_DEMO_KEY, next);
        else localStorage.removeItem(LIMIT_DEMO_KEY);
      } catch (e) {}
      try { sessionStorage.setItem('ua_skip_watch_reward_modal_v1', '1'); } catch (e2) {}
      window.location.reload();
    });
  }

  function mountCondDemo() {
    if (document.getElementById('uaLiveCondDemo')) return;
    var panel = document.createElement('div');
    panel.className = 'ua-rg-demo ua-live-cond-demo';
    panel.id = 'uaLiveCondDemo';
    var mode = '';
    try {
      mode = localStorage.getItem('ua_cash_claim_cond_demo_v1') || '';
    } catch (e) {}
    function opt(value, label) {
      return '<option value="' + value + '"' + (mode === value ? ' selected' : '') + '>' + label + '</option>';
    }
    panel.innerHTML =
      '<div class="ua-rg-demo__title">领取条件验收开关</div>' +
      '<label class="ua-rg-demo__row">未满足场景' +
      '<select id="uaLiveCondDemoMode">' +
      opt('', '满足条件') +
      opt('register', '新注册用户') +
      opt('order_amount', '累计下单金额') +
      opt('order_count', '累计下单笔数') +
      opt('level', '会员等级') +
      opt('segment', '会员分群') +
      opt('tag', '会员标签') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveCondDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaLiveCondDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaLiveCondDemoMode');
      var next = sel ? sel.value : '';
      try {
        if (next) localStorage.setItem('ua_cash_claim_cond_demo_v1', next);
        else localStorage.removeItem('ua_cash_claim_cond_demo_v1');
      } catch (e) {}
      try { sessionStorage.setItem('ua_skip_watch_reward_modal_v1', '1'); } catch (e2) {}
      window.location.reload();
    });
  }

  function baseRows() {
    return [
      { source: '签到', name: '审核通过红包', amount: 1.2, at: '19:18', wechat: true },
      { source: '观看任务', name: '新人注册红包', amount: 0.5, at: '19:26', wechat: true },
      { source: '现金红包', name: '新人注册红包', amount: 1.6, at: '19:25', wechat: true }
    ];
  }

  function bagClaimed() {
    var mode = readDemo();
    if (mode === 'claimed') return true;
    var saved = readClaim();
    return !!(saved && saved.claimed);
  }

  function bagMissed() {
    var saved = readClaim();
    return readDemo() === 'miss' && !!(saved && saved.missed);
  }

  function bagLost() {
    var saved = readClaim();
    return readDemo() === 'lost' && !!(saved && saved.lost);
  }

  function bagHeld() {
    var saved = readClaim();
    return !!(saved && saved.held && !saved.claimed);
  }

  function showEntry() {
    var mode = readDemo();
    if (mode === 'none') return false;
    if (mode === 'claimed') return false;
    if (bagClaimed() || bagHeld() || bagMissed() || bagLost()) return false;
    return mode === 'pending' || mode === 'miss' || mode === 'lost';
  }

  function readCredits() {
    try {
      var data = JSON.parse(localStorage.getItem(CREDIT_KEY) || 'null');
      if (data && data.sessionId === sessionId() && Array.isArray(data.items)) return data.items;
    } catch (e) {}
    return [];
  }

  function readHolds() {
    try {
      var data = JSON.parse(localStorage.getItem(HOLD_KEY) || 'null');
      if (data && data.sessionId === sessionId() && Array.isArray(data.items)) return data.items;
    } catch (e) {}
    return [];
  }

  function writeHolds(items) {
    try {
      localStorage.setItem(HOLD_KEY, JSON.stringify({ sessionId: sessionId(), items: items }));
    } catch (e) {}
  }

  /** 未授权中奖：红包先入账户待领取，不飞金币、不打微信。 */
  function holdWin(opts) {
    opts = opts || {};
    var id = String(opts.id || '');
    if (!id) return false;
    var items = readHolds();
    var i;
    for (i = 0; i < items.length; i++) {
      if (String(items[i].id) === id) return false;
    }
    items.unshift({
      id: id,
      source: opts.source || '现金红包',
      name: opts.name || '现金红包',
      amount: Math.round(Number(opts.amount) * 100) / 100,
      at: opts.at || clockNow(),
      sceneText: opts.sceneText || sourceText(opts.source || '现金红包')
    });
    writeHolds(items);
    noteClaim({
      id: id,
      packetId: opts.packetId || id,
      templateId: opts.templateId || '',
      perUserLimit: opts.perUserLimit,
      claimTimesMode: opts.claimTimesMode,
      manual: opts.manual,
      activityType: opts.activityType,
      source: opts.source
    });
    return true;
  }

  function listHolds() {
    return readHolds();
  }

  /** 用户在红包记录里点领取后，才记为已打入微信。 */
  function takeHold(id) {
    var items = readHolds();
    var found = null;
    var next = items.filter(function (it) {
      if (String(it.id) === String(id)) {
        found = it;
        return false;
      }
      return true;
    });
    if (!found) return null;
    writeHolds(next);
    if (String(found.id) === 'live-bag' || String(found.source) === '福袋') {
      writeClaim({
        claimed: true,
        held: false,
        missed: false,
        lost: false,
        amount: found.amount,
        at: found.at || clockNow()
      });
    } else {
      writeCredit({
        id: found.id,
        source: found.source,
        name: found.name,
        amount: found.amount,
        at: found.at,
        wechat: true
      });
    }
    return found;
  }

  /** 收款授权验收开关切到已授权：本场未转账红包全部打入微信，清单回到自动打款文案。 */
  function settleAllHolds() {
    if (!wxAuthorized()) return;
    readHolds().slice().forEach(function (it) {
      takeHold(it.id);
    });
  }

  function wxAuthorized() {
    return !global.UaWxPayAuth || global.UaWxPayAuth.isAuthorized();
  }

  function writeCredit(item) {
    var items = readCredits();
    var i;
    for (i = 0; i < items.length; i++) {
      if (items[i].id === item.id) return false;
    }
    items.unshift(item);
    try {
      localStorage.setItem(CREDIT_KEY, JSON.stringify({ sessionId: sessionId(), items: items }));
    } catch (e) {}
    return true;
  }

  function sourceText(source) {
    var text = String(source || '');
    if (text === '发送现金红包') return '现金红包';
    return text;
  }

  function rows() {
    var list = baseRows();
    readCredits().forEach(function (item) {
      list.unshift({
        source: sourceText(item.source),
        name: item.name === '发送现金红包' ? '现金红包' : item.name,
        amount: item.amount,
        at: item.at,
        wechat: true
      });
    });
    if (bagClaimed()) {
      var saved = readClaim();
      list.unshift({
        source: '福袋',
        name: '现金红包',
        amount: BAG_AMOUNT,
        at: (saved && saved.at) || '19:30',
        wechat: true
      });
    }
    readHolds().forEach(function (hold) {
      list.unshift({
        source: sourceText(hold.source),
        name: hold.name || '现金红包',
        amount: hold.amount,
        at: hold.at,
        wechat: false
      });
    });
    return list;
  }

  function totalAmount() {
    return rows().reduce(function (sum, row) {
      if (row.wechat === false) return sum;
      return sum + Number(row.amount || 0);
    }, 0);
  }

  function pendingAmount() {
    return rows().reduce(function (sum, row) {
      if (row.wechat !== false) return sum;
      return sum + Number(row.amount || 0);
    }, 0);
  }

  var opening = false;

  function floatCoins() {
    var html = '';
    var i;
    for (i = 0; i < 36; i++) {
      var left = (i * 47 + (i % 5) * 6) % 100;
      var size = i % 9 === 0 ? 54 : (14 + (i % 7) * 6);
      var delay = -((i * 0.37) % 5.2).toFixed(2);
      var dur = (2.8 + (i % 8) * 0.55).toFixed(2);
      var rot = (i * 37) % 360;
      var drift = (i % 2 ? 1 : -1) * (18 + (i % 5) * 14);
      var spin = 70 + (i % 6) * 28;
      html += '<i style="left:' + left + '%;width:' + size + 'px;height:' + size +
        'px;animation-duration:' + dur + 's;animation-delay:' + delay +
        's;--rot:' + rot + 'deg;--drift:' + drift + 'px;--spin:' + spin + 'deg"></i>';
    }
    return html;
  }

  function mount(room) {
    room.insertAdjacentHTML('beforeend',
      '<button type="button" class="ua-live-bag-entry" id="uaLiveBagEntry" hidden>' +
        '<span class="ua-live-bag-entry__pouch" aria-hidden="true"></span>' +
        '<span class="ua-live-bag-entry__name">福袋</span>' +
      '</button>' +
      '<button type="button" class="ua-live-cash" id="uaLiveCash" aria-label="本场现金">' +
        '<span class="ua-live-cash__badge">' +
          '<span class="ua-live-cash__amt" id="uaLiveCashAmt">0</span>' +
          '<span class="ua-live-cash__env" id="uaLiveCashPile" aria-hidden="true"></span>' +
        '</span>' +
      '</button>' +
      '<div class="ua-bag-fx" id="uaBagFx" hidden>' +
        '<div class="ua-bag-fx__float" aria-hidden="true">' + floatCoins() + '</div>' +
        '<div class="ua-bag-fx__stage">' +
          '<div class="ua-bag-fx__tip" id="uaBagFxTip">点击领取，现金红包将转入微信</div>' +
          '<button type="button" class="ua-bag-pouch" id="uaBagFxOpen">' +
            '<img class="ua-bag-pouch__art ua-bag-pouch__closed" src="../assets/shop/live-bag-closed.png?v=20261014-coin-gold" alt="">' +
            '<img class="ua-bag-pouch__art ua-bag-pouch__opened" src="../assets/shop/live-bag-open.png?v=20261014-bag-vivid" alt="">' +
            '<span class="ua-bag-pouch__cta">领取</span>' +
            '<span class="ua-bag-pouch__result" id="uaBagFxResult">' +
              '<em>恭喜</em><strong id="uaBagFxAmount">0.81</strong><small>已自动转账至微信</small>' +
            '</span>' +
          '</button>' +
          '<button type="button" class="ua-bag-fx__close" id="uaBagFxClose" aria-label="关闭">×</button>' +
        '</div>' +
      '</div>' +
      '<div class="ua-live-cash-sheet" id="uaLiveCashSheet" hidden>' +
        '<div class="ua-live-cash-sheet__mask" id="uaLiveCashMask"></div>' +
        '<div class="ua-live-cash-sheet__panel" role="dialog" aria-label="本场已领现金红包">' +
          '<div class="ua-live-cash-sheet__title">本场已领现金红包</div>' +
          '<div class="ua-live-cash-sheet__sub">含福袋、签到、观看任务和现金红包。领取后自动转账至微信。</div>' +
          '<div class="ua-live-cash-sheet__sum" id="uaLiveCashSum"></div>' +
          '<div class="ua-live-cash-sheet__list" id="uaLiveCashList"></div>' +
        '</div>' +
      '</div>'
    );
    var panel = document.createElement('div');
    panel.className = 'ua-rg-demo ua-live-bag-demo';
    panel.id = 'uaLiveBagDemo';
    var mode = readDemo();
    function opt(value, label) {
      return '<option value="' + value + '"' + (mode === value ? ' selected' : '') + '>' + label + '</option>';
    }
    panel.innerHTML =
      '<div class="ua-rg-demo__title">福袋（现金红包）验收开关</div>' +
      '<label class="ua-rg-demo__row">福袋状态' +
      '<select id="uaLiveBagDemoMode">' +
      opt('pending', '待领取') +
      opt('claimed', '已领取') +
      opt('miss', '未中奖') +
      opt('lost', '未抢到') +
      opt('none', '未发放') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaLiveBagDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    mountLimitDemo();
    var cash = document.getElementById('uaLiveCash');
    var fx = document.getElementById('liveFxDemo');
    if (cash && fx) fx.appendChild(cash);
  }

  var audioCtx = null;

  function playCoinSound() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var now = audioCtx.currentTime;
    var bus = audioCtx.createGain();
    bus.gain.value = 0.82;
    var air = audioCtx.createBiquadFilter();
    air.type = 'lowpass';
    air.frequency.value = 5200;
    air.Q.value = 0.5;
    bus.connect(air);
    air.connect(audioCtx.destination);
    function bell(t, freq, gain, dur) {
      function tone(mul, gMul, dMul) {
        var osc = audioCtx.createOscillator();
        var amp = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * mul, t);
        var d = dur * dMul;
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(gain * gMul, t + 0.008);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + d);
        osc.connect(amp);
        amp.connect(bus);
        osc.start(t);
        osc.stop(t + d + 0.03);
      }
      tone(1, 1, 1);
      tone(1.004, 0.42, 0.9);
      tone(2, 0.22, 0.38);
      tone(3, 0.06, 0.1);
    }
    // 叮 — 铃铃：E-G-C 大三和弦上行，余韵拉开，不走金属撞击
    var notes = [
      [0, 1318.51, 0.18, 0.72],
      [0.14, 1567.98, 0.14, 0.56],
      [0.23, 2093, 0.12, 0.5]
    ];
    var n;
    for (n = 0; n < notes.length; n++) bell(now + notes[n][0], notes[n][1], notes[n][2], notes[n][3]);
  }

  function renderAccount() {
    var amt = document.getElementById('uaLiveCashAmt');
    if (amt) amt.textContent = sessionCash(totalAmount());
    var entry = document.getElementById('uaLiveBagEntry');
    if (entry) entry.hidden = !showEntry();
  }

  function renderSheet() {
    var list = document.getElementById('uaLiveCashList');
    var sum = document.getElementById('uaLiveCashSum');
    var sub = document.querySelector('.ua-live-cash-sheet__sub');
    var data = rows();
    var pending = data.some(function (row) { return row.wechat === false; });
    if (sub) {
      sub.textContent = pending
        ? '含福袋、签到、观看任务和现金红包。未转账的已放入我的红包，领取后才打入微信。'
        : '含福袋、签到、观看任务和现金红包。领取后自动转账至微信。';
    }
    if (sum) {
      sum.innerHTML = pending
        ? '已打入微信 <b>' + money(totalAmount()) + '</b><span>未转账 <b>' + money(pendingAmount()) + '</b></span>'
        : '合计 <b>' + money(totalAmount()) + '</b>';
    }
    if (!list) return;
    list.innerHTML = data.map(function (row) {
      var status = row.wechat === false ? '已放入账户，未转账' : '已打入微信';
      return '<div class="ua-live-cash-sheet__item">' +
        '<div class="ua-live-cash-sheet__head">' +
          '<span class="ua-live-cash-sheet__src">' + escapeHtml(sourceText(row.source)) + '</span>' +
          '<span class="ua-live-cash-sheet__money">' + money(row.amount) + '</span>' +
        '</div>' +
        '<div class="ua-live-cash-sheet__name">' + escapeHtml(row.name) + '</div>' +
        '<div class="ua-live-cash-sheet__meta' + (row.wechat === false ? ' is-pending' : '') + '">' +
          escapeHtml(row.at) + ' · ' + status +
        '</div>' +
      '</div>';
    }).join('');
  }

  function closeFx() {
    var fx = document.getElementById('uaBagFx');
    if (fx) {
      fx.classList.remove('is-open');
      fx.classList.remove('is-lost');
      fx.hidden = true;
    }
    opening = false;
  }

  function flyCoinFrom(fromEl, done) {
    var room = document.querySelector('.ua-live-room');
    var pile = document.getElementById('uaLiveCashPile');
    if (!room || !pile) {
      if (done) done();
      return;
    }
    var roomBox = room.getBoundingClientRect();
    var from = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
    if (!from || !from.width) {
      from = {
        left: roomBox.left + roomBox.width / 2,
        top: roomBox.top + roomBox.height * 0.42,
        width: 0,
        height: 0
      };
    }
    var to = pile.getBoundingClientRect();
    var coin = document.createElement('i');
    coin.className = 'ua-bag-flycoin';
    var sx = from.left + from.width / 2 - roomBox.left;
    var sy = from.top + from.height * 0.45 - roomBox.top;
    var tx = to.left + to.width / 2 - roomBox.left;
    var ty = to.top + to.height / 2 - roomBox.top;
    coin.style.left = sx + 'px';
    coin.style.top = sy + 'px';
    room.appendChild(coin);
    var anim = coin.animate([
      { transform: 'translate(-50%, -50%) scale(1)' },
      { transform: 'translate(calc(-50% + ' + Math.round((tx - sx) * 0.45) + 'px), calc(-50% - 70px)) scale(1.12)', offset: 0.42 },
      { transform: 'translate(calc(-50% + ' + Math.round(tx - sx) + 'px), calc(-50% + ' + Math.round(ty - sy) + 'px)) scale(0.42)' }
    ], { duration: 780, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'forwards' });
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      coin.remove();
      var account = document.getElementById('uaLiveCash');
      if (account) {
        account.classList.remove('is-hit');
        void account.offsetWidth;
        account.classList.add('is-hit');
      }
      playCoinSound();
      if (done) done();
    }
    anim.onfinish = finish;
    window.setTimeout(finish, 820);
  }

  function flyCoin(done) {
    flyCoinFrom(document.getElementById('uaBagFxOpen'), done);
  }

  /** 只播放落入本场红包图标的金币和叮铃铃，不把红包记成已打入微信。 */
  function landCoin(fromEl) {
    flyCoinFrom(fromEl, renderAccount);
  }

  function receive(opts) {
    opts = opts || {};
    var amount = Number(opts.amount);
    if (!isFinite(amount) || amount <= 0) return false;
    var denied = conditionBlock(opts);
    if (denied) {
      showLimitTip(denied);
      return false;
    }
    var block = claimBlock(opts);
    if (block) {
      showLimitTip(block);
      return false;
    }
    var id = opts.id || ('cash:' + Date.now());
    var wrote = writeCredit({
      id: id,
      source: opts.source || '现金红包',
      name: opts.name || '现金红包',
      amount: Math.round(amount * 100) / 100,
      at: clockNow(),
      outBillNo: opts.outBillNo || ''
    });
    if (wrote !== false) {
      noteClaim({
        id: id,
        packetId: opts.packetId || id,
        templateId: opts.templateId || '',
        perUserLimit: opts.perUserLimit,
        claimTimesMode: opts.claimTimesMode,
        manual: opts.manual,
        activityType: opts.activityType,
        source: opts.source
      });
    }
    flyCoinFrom(opts.fromEl, renderAccount);
    return true;
  }

  function bagClaimOpts() {
    return {
      id: 'bag:' + sessionId(),
      source: '福袋',
      packetId: 'bag:' + sessionId(),
      inLive: true
    };
  }

  function openFx() {
    if (!showEntry() || opening) return;
    var mode = readDemo();
    if (mode !== 'miss') {
      var denied = conditionBlock(bagClaimOpts());
      if (denied) {
        showLimitTip(denied);
        return;
      }
    }
    opening = true;
    var fx = document.getElementById('uaBagFx');
    var result = document.getElementById('uaBagFxResult');
    var amount = document.getElementById('uaBagFxAmount');
    var mode = readDemo();
    var miss = mode === 'miss';
    if (result) {
      result.innerHTML = mode === 'lost'
        ? '<p class="ua-bag-pouch__lost">很遗憾，没有抢到红包，不要离开等待下一轮奖励</p>'
        : miss
        ? '<em>未中奖</em><strong>—</strong><small>未抽中，不会打入微信</small>'
        : '<em>恭喜</em><strong>' + BAG_AMOUNT.toFixed(2) + '</strong><small>已自动转账至微信</small>';
    }
    if (amount && !miss) amount.textContent = BAG_AMOUNT.toFixed(2);
    if (fx) {
      fx.classList.remove('is-open');
      fx.classList.remove('is-lost');
      fx.hidden = false;
    }
  }

  function confirmOpen() {
    var fx = document.getElementById('uaBagFx');
    if (!fx || fx.hidden || fx.classList.contains('is-open') || fx.classList.contains('is-lost')) return;
    var mode = readDemo();
    if (mode !== 'miss') {
      var denied = conditionBlock(bagClaimOpts());
      var block = denied || claimBlock(bagClaimOpts());
      if (block) {
        var blocked = document.getElementById('uaBagFxResult');
        if (blocked) blocked.innerHTML = '<p class="ua-bag-pouch__lost">' + escapeHtml(block) + '</p>';
        fx.classList.add('is-lost');
        showLimitTip(block);
        window.setTimeout(function () {
          closeFx();
          renderAccount();
        }, 2600);
        return;
      }
    }
    if (mode === 'lost') {
      fx.classList.add('is-lost');
      window.setTimeout(function () {
        writeClaim({ lost: true, missed: false, claimed: false, at: clockNow() });
        closeFx();
        renderAccount();
      }, 2600);
      return;
    }
    var unauthorized = mode !== 'miss' && !wxAuthorized();
    if (unauthorized) {
      var heldText = document.getElementById('uaBagFxResult');
      var heldSmall = heldText ? heldText.querySelector('small') : null;
      if (heldSmall) heldSmall.textContent = '已放入红包账户，请到我的红包领取';
    }
    fx.classList.add('is-open');
    var miss = mode === 'miss';
    window.setTimeout(function () {
      if (miss) {
        writeClaim({ missed: true, claimed: false, at: clockNow() });
        closeFx();
        renderAccount();
        return;
      }
      if (unauthorized) {
        holdWin({
          id: 'live-bag',
          source: '福袋',
          name: '现金红包',
          sceneText: '福袋',
          packetId: 'bag:' + sessionId(),
          amount: BAG_AMOUNT,
          at: clockNow()
        });
        writeClaim({ held: true, claimed: false, missed: false, lost: false, amount: BAG_AMOUNT, at: clockNow() });
        var entryHeld = document.getElementById('uaLiveBagEntry');
        if (entryHeld) entryHeld.hidden = true;
        flyCoin(renderAccount);
        closeFx();
        return;
      }
      writeClaim({ claimed: true, missed: false, amount: BAG_AMOUNT, at: clockNow() });
      noteClaim({
        id: 'bag:' + sessionId(),
        packetId: 'bag:' + sessionId(),
        source: '福袋'
      });
      var entry = document.getElementById('uaLiveBagEntry');
      if (entry) entry.hidden = true;
      flyCoin(renderAccount);
      closeFx();
    }, 1300);
  }

  function bind() {
    var entry = document.getElementById('uaLiveBagEntry');
    var open = document.getElementById('uaBagFxOpen');
    var close = document.getElementById('uaBagFxClose');
    var cash = document.getElementById('uaLiveCash');
    var mask = document.getElementById('uaLiveCashMask');
    var apply = document.getElementById('uaLiveBagDemoApply');
    if (entry) entry.addEventListener('click', openFx);
    if (open) open.addEventListener('click', confirmOpen);
    if (close) close.addEventListener('click', function () {
      if (document.getElementById('uaBagFx').classList.contains('is-open')) return;
      closeFx();
    });
    if (cash) cash.addEventListener('click', function () {
      renderSheet();
      document.getElementById('uaLiveCashSheet').hidden = false;
    });
    if (mask) mask.addEventListener('click', function () {
      document.getElementById('uaLiveCashSheet').hidden = true;
    });
    if (apply) apply.addEventListener('click', function () {
      var sel = document.getElementById('uaLiveBagDemoMode');
      var mode = sel ? sel.value : 'pending';
      try { localStorage.setItem(DEMO_KEY, mode); } catch (e) {}
      if (mode === 'claimed') writeClaim({ claimed: true, missed: false, amount: BAG_AMOUNT, at: '19:30' });
      else clearClaim();
      try { sessionStorage.setItem('ua_skip_watch_reward_modal_v1', '1'); } catch (e2) {}
      window.location.reload();
    });
  }

  function init() {
    var room = document.querySelector('.ua-live-room');
    if (!room || document.getElementById('uaLiveBagEntry')) return;
    mount(room);
    bind();
    settleAllHolds();
    renderAccount();
  }

  global.UaLiveBagCash = {
    init: init,
    receive: receive,
    holdWin: holdWin,
    listHolds: listHolds,
    takeHold: takeHold,
    landCoin: landCoin,
    settleAllHolds: settleAllHolds,
    claimBlock: claimBlock,
    conditionBlock: conditionBlock,
    showLimitTip: showLimitTip
  };
})(window);
