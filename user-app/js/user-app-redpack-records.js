/**
 * C 端 — 红包领取记录（小程序 / APP 共用）
 * 手动派发、抽中现金红包福袋需要用户自己领取；其余现金红包直接到账，在本页显示为已领取。
 * 顶部统计现金收益（只合计已领取金额），以及红包总数、已领取、待领取、已过期。
 * 明细含已过期。待领取可再次打开领取半屏。不展示发放失败。
 */
(function () {
  'use strict';

  var RG = window.UaRegisterGift;
  var C = window.MdmMarketingCashRedpackStore;
  if (!RG || !C) return;

  var STATUS_DEMO_KEY = 'ua_rp_cash_status_demo_v1';
  var statusFilter = readStatusDemo();
  var BAG_CLAIM_KEY = 'ua_live_bag_cash_claim_v1';
  var BAG_DEMO_KEY = 'ua_live_bag_cash_demo_v1';
  var LIVE_CREDIT_KEY = 'ua_live_cash_credits_v1';
  var BAG_AMOUNT = 0.81;

  function readStatusDemo() {
    try {
      var value = localStorage.getItem(STATUS_DEMO_KEY) || '';
      if (value === 'pending' || value === 'claimed' || value === 'expired') return value;
    } catch (e) {}
    return '';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusClass(st) {
    if (st === 'claimed') return 'ua-rp-status ua-rp-status--ok';
    if (st === 'pending') return 'ua-rp-status ua-rp-status--pending';
    if (st === 'expired') return 'ua-rp-status ua-rp-status--expired';
    return 'ua-rp-status ua-rp-status--muted';
  }

  function statusText(st) {
    if (st === 'claimed') return '已领取';
    if (st === 'pending') return '待领取';
    if (st === 'expired') return '已过期';
    return C.statusLabel(st);
  }

  function moneyText(n) {
    var v = Math.round(Number(n) * 100) / 100;
    if (!isFinite(v)) v = 0;
    return v.toFixed(2);
  }

  function renderStats(all) {
    var box = document.getElementById('rpRecordsStats');
    if (!box) return;
    var earned = 0;
    var claimed = 0;
    var pending = 0;
    var expired = 0;
    all.forEach(function (it) {
      if (it.status === 'claimed') {
        claimed += 1;
        earned += Number(it.amount) || 0;
      } else if (it.status === 'pending') pending += 1;
      else if (it.status === 'expired') expired += 1;
    });
    box.innerHTML =
      '<div class="ua-rp-stats__earn"><span>现金收益</span><strong>¥' +
      moneyText(earned) +
      '</strong></div>' +
      '<div class="ua-rp-stats__grid">' +
      '<div><b>' + all.length + '</b><span>红包总数</span></div>' +
      '<div><b>' + claimed + '</b><span>已领取</span></div>' +
      '<div><b>' + pending + '</b><span>待领取</span></div>' +
      '<div><b>' + expired + '</b><span>已过期</span></div>' +
      '</div>';
  }

  function sceneText(it) {
    if (it && it.sceneText) return it.sceneText;
    var scene = it && it.scene;
    return C.sceneLabel ? C.sceneLabel(scene) : scene === 'old_first_download' ? '老用户下载' : '新用户注册';
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function formatDateTime(ts) {
    var d = new Date(ts);
    if (!isFinite(d.getTime())) return '';
    return (
      d.getFullYear() +
      '-' +
      pad2(d.getMonth() + 1) +
      '-' +
      pad2(d.getDate()) +
      ' ' +
      pad2(d.getHours()) +
      ':' +
      pad2(d.getMinutes()) +
      ':' +
      pad2(d.getSeconds())
    );
  }

  /** 未领取超过领取时效即过期，过期时间 = 发放时间 + 时效小时 */
  function expireAtText(it) {
    if (it && it.expireAt) return String(it.expireAt);
    var start = new Date(String((it && it.grantedAt) || '').replace(/-/g, '/')).getTime();
    if (!isFinite(start)) return '';
    var hours = 24;
    if (C.getSettings) {
      var settings = C.getSettings();
      var n = Math.round(Number(settings && settings.expireHours));
      if (n > 0) hours = n;
    }
    return formatDateTime(start + hours * 3600000);
  }

  function dateLine(label, value) {
    return '<div class="ua-rp-item__sub">' + escapeHtml(label) + ' ' + escapeHtml(value || '—') + '</div>';
  }

  function subHtml(it) {
    var scene =
      '<div class="ua-rp-item__sub">' + escapeHtml(sceneText(it)) + '</div>';
    if (it.status === 'expired') {
      return scene + dateLine('发放日期', it.grantedAt) + dateLine('过期日期', expireAtText(it));
    }
    if (it.status === 'claimed') {
      return scene + dateLine('发放日期', it.grantedAt) + dateLine('领取日期', it.claimAt || it.grantedAt);
    }
    return (
      '<div class="ua-rp-item__sub">' +
      escapeHtml(sceneText(it)) +
      ' · ' +
      escapeHtml(it.grantedAt || '') +
      '</div>'
    );
  }

  function sessionId() {
    try {
      var params = new URLSearchParams(location.search || '');
      return params.get('sessionId') || params.get('id') || 'sess-001';
    } catch (e) {
      return 'sess-001';
    }
  }

  function clockNow() {
    var d = new Date();
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /** 待领取里，只有手动派发和抽中福袋要用户自己领；其余直接算已领取 */
  function presentRecord(it) {
    var row = Object.assign({}, it);
    var manual = row.activityType === 'manual' || row.claimKind === 'bag';
    if (row.status === 'pending' && !manual) {
      row.status = 'claimed';
      if (!row.claimAt) row.claimAt = row.grantedAt;
    }
    return row;
  }

  function readBagClaim() {
    try {
      var data = JSON.parse(localStorage.getItem(BAG_CLAIM_KEY) || 'null');
      if (data && data.sessionId === sessionId()) return data;
    } catch (e) {}
    return null;
  }

  function bagDemo() {
    try {
      var v = localStorage.getItem(BAG_DEMO_KEY);
      if (v === 'claimed' || v === 'miss' || v === 'lost' || v === 'none' || v === 'pending') return v;
    } catch (e) {}
    return 'pending';
  }

  function bagWonRow() {
    var demo = bagDemo();
    var saved = readBagClaim();
    var claimed = demo === 'claimed' || !!(saved && saved.claimed);
    if (demo === 'none' || demo === 'miss' || demo === 'lost' || (saved && (saved.missed || saved.lost) && !claimed)) {
      return null;
    }
    if (!claimed && demo !== 'pending' && demo !== 'claimed') return null;
    return {
      id: 'live-bag',
      claimKind: 'bag',
      activityName: '现金红包',
      sceneText: '福袋',
      amount: BAG_AMOUNT,
      grantedAt: '2026-10-14 19:30',
      claimAt: claimed ? '2026-10-14 ' + ((saved && saved.at) || '19:30') : '',
      status: claimed ? 'claimed' : 'pending',
      outBillNo: 'LFCR20261014193000081'
    };
  }

  function readLiveCredits() {
    try {
      var data = JSON.parse(localStorage.getItem(LIVE_CREDIT_KEY) || 'null');
      if (data && data.sessionId === sessionId() && Array.isArray(data.items)) return data.items;
    } catch (e) {}
    return [];
  }

  function liveDirectRows() {
    var rows = [
      {
        id: 'live-sign',
        activityName: '审核通过红包',
        sceneText: '签到',
        amount: 1.2,
        grantedAt: '2026-10-14 19:18',
        claimAt: '2026-10-14 19:18',
        status: 'claimed',
        outBillNo: 'LFCR20261014191800021'
      },
      {
        id: 'live-watch-base',
        activityName: '新人注册红包',
        sceneText: '观看任务',
        amount: 0.5,
        grantedAt: '2026-10-14 19:26',
        claimAt: '2026-10-14 19:26',
        status: 'claimed',
        outBillNo: 'LFCR20261014192600022'
      },
      {
        id: 'live-send-base',
        activityName: '新人注册红包',
        sceneText: '现金红包',
        amount: 1.6,
        grantedAt: '2026-10-14 19:25',
        claimAt: '2026-10-14 19:25',
        status: 'claimed',
        outBillNo: 'LFCR20261014192500023'
      }
    ];
    readLiveCredits().forEach(function (item) {
      if (!item || item.source === '福袋' || String(item.id || '').indexOf('bag:') === 0) return;
      var at = String(item.at || '');
      if (/^\d{2}:\d{2}$/.test(at)) at = '2026-10-14 ' + at;
      rows.push({
        id: 'live-credit-' + (item.id || rows.length),
        activityName: item.name === '发送现金红包' ? '现金红包' : (item.name || '现金红包'),
        sceneText: item.source === '发送现金红包' ? '现金红包' : (item.source || '现金红包'),
        amount: item.amount,
        grantedAt: at,
        claimAt: at,
        status: 'claimed',
        outBillNo: item.outBillNo || ''
      });
    });
    var bag = bagWonRow();
    if (bag) rows.push(bag);
    return rows;
  }

  /** 当前用户若缺某一展示状态，补一条仅用于本页验收的记录，不改发放数据 */
  function coverStatusSamples(list) {
    var has = { pending: false, claimed: false, expired: false };
    list.forEach(function (it) {
      if (has[it.status] != null) has[it.status] = true;
    });
    if (!has.pending) {
      list.push({
        id: 'demo-status-pending',
        activityType: 'manual',
        activityName: '双端补偿红包',
        frontRemark: '双端补差',
        sceneText: '手动发放',
        amount: 1.2,
        grantedAt: '2026-10-07 10:00:00',
        status: 'pending',
        claimKind: 'sheet-demo'
      });
    }
    if (!has.claimed) {
      list.push({
        id: 'demo-status-claimed',
        activityName: '会员补偿红包',
        frontRemark: '会员日补偿',
        sceneText: '手动发放',
        amount: 2,
        grantedAt: '2026-09-20 11:06:18',
        claimAt: '2026-09-20 11:20:06',
        status: 'claimed',
        outBillNo: 'LFCR20260920110618001'
      });
    }
    if (!has.expired) {
      list.push({
        id: 'demo-status-expired',
        activityName: '直播福袋红包',
        sceneText: '新用户注册',
        amount: 0.66,
        grantedAt: '2026-07-20 14:30:12',
        status: 'expired'
      });
    }
    return list;
  }

  function allRecords() {
    if (typeof C.getBatches === 'function') C.getBatches();
    var list = RG.listMyCashRecords().map(presentRecord);
    liveDirectRows().forEach(function (row) {
      list.push(presentRecord(row));
    });
    coverStatusSamples(list);
    list.sort(function (a, b) {
      return String(b.grantedAt).localeCompare(String(a.grantedAt));
    });
    return list;
  }

  function claimDenied() {
    if (!RG.claimConditionDeny) return '';
    return RG.claimConditionDeny({}) || '';
  }

  function earnedNow() {
    var earned = 0;
    allRecords().forEach(function (it) {
      if (it.status === 'claimed') earned += Number(it.amount) || 0;
    });
    return Math.round(earned * 100) / 100;
  }

  var audioCtx = null;

  function ensureAudio() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playCoinSound() {
    if (!ensureAudio()) return;
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
    var notes = [
      [0, 1318.51, 0.18, 0.72],
      [0.14, 1567.98, 0.14, 0.56],
      [0.23, 2093, 0.12, 0.5]
    ];
    var n;
    for (n = 0; n < notes.length; n++) bell(now + notes[n][0], notes[n][1], notes[n][2], notes[n][3]);
  }

  /** 领取金额飞入顶部现金收益，落地后更新数字并播放叮铃铃 */
  function landEarn(from, beforeEarn) {
    ensureAudio();
    var earn = document.querySelector('#rpRecordsStats .ua-rp-stats__earn');
    var strong = earn ? earn.querySelector('strong') : null;
    if (!strong) return;
    var fromBox = from || { left: window.innerWidth / 2, top: window.innerHeight * 0.7, width: 0, height: 0 };
    var to = strong.getBoundingClientRect();
    var coin = document.createElement('i');
    coin.className = 'ua-rp-flycoin';
    coin.setAttribute('aria-hidden', 'true');
    var sx = fromBox.left + (fromBox.width || 0) / 2;
    var sy = fromBox.top + (fromBox.height || 0) * 0.45;
    var tx = to.left + to.width / 2;
    var ty = to.top + to.height / 2;
    coin.style.left = sx + 'px';
    coin.style.top = sy + 'px';
    document.body.appendChild(coin);
    var anim = coin.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)' },
        {
          transform:
            'translate(calc(-50% + ' +
            Math.round((tx - sx) * 0.45) +
            'px), calc(-50% - 70px)) scale(1.12)',
          offset: 0.42
        },
        {
          transform:
            'translate(calc(-50% + ' +
            Math.round(tx - sx) +
            'px), calc(-50% + ' +
            Math.round(ty - sy) +
            'px)) scale(0.42)'
        }
      ],
      { duration: 780, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'forwards' }
    );
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      coin.remove();
      strong.textContent = '¥' + moneyText(earnedNow());
      if (earn) {
        earn.classList.remove('is-hit');
        void earn.offsetWidth;
        earn.classList.add('is-hit');
      }
      playCoinSound();
    }
    anim.onfinish = finish;
    window.setTimeout(finish, 860);
    if (beforeEarn != null) strong.textContent = '¥' + moneyText(beforeEarn);
  }

  function claimBag(fromEl) {
    var denied = claimDenied();
    if (denied) {
      if (RG.toast) RG.toast(denied);
      return;
    }
    if (window.UaWxPayAuth && !window.UaWxPayAuth.isAuthorized()) {
      window.UaWxPayAuth.ensure({
        onDone: function () {
          claimBag(fromEl);
        }
      });
      return;
    }
    var from = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : null;
    var before = earnedNow();
    try {
      localStorage.setItem(
        BAG_CLAIM_KEY,
        JSON.stringify({
          sessionId: sessionId(),
          claimed: true,
          missed: false,
          lost: false,
          amount: BAG_AMOUNT,
          at: clockNow()
        })
      );
    } catch (e) {}
    render();
    landEarn(from, before);
  }

  function render() {
    var listEl = document.getElementById('rpRecordsList');
    var endEl = document.getElementById('rpRecordsEnd');
    if (!listEl) return;

    var all = allRecords();
    renderStats(all);
    var rows = all.filter(function (it) {
      if (!statusFilter) return true;
      return it.status === statusFilter;
    });

    if (!rows.length) {
      listEl.innerHTML = '<div class="ua-gd-empty">暂无红包记录</div>';
      if (endEl) endEl.hidden = true;
      return;
    }

    if (endEl) endEl.hidden = false;
    var client = RG.getClientMode ? RG.getClientMode() : 'mini';
    listEl.innerHTML = rows
      .map(function (it) {
        var allows = it.claimKind === 'bag' || typeof C.recordAllowsPort !== 'function' || C.recordAllowsPort(it, client);
        var canClaim = it.status === 'pending' && allows;
        var tag = canClaim
          ? '<span class="ua-rp-item__action">去领取</span>'
          : '<span class="' +
            statusClass(it.status === 'pending' ? '' : it.status) +
            '">' +
            escapeHtml(
              it.status === 'pending' && !allows
                ? '请到' + (C.portsLabel ? C.portsLabel(it.ports) : '指定端口') + '领取'
                : statusText(it.status)
            ) +
            '</span>';
        var billNo = it.status === 'claimed' ? it.outBillNo || '' : '';
        return (
          '<button type="button" class="ua-rp-item' +
          (canClaim ? ' ua-rp-item--claimable' : '') +
          '" data-id="' +
          escapeHtml(it.id) +
          '"' +
          (canClaim ? ' data-claim="1"' : '') +
          '>' +
          '<div class="ua-rp-item__meta">' +
          '<div class="ua-rp-item__title">' +
          escapeHtml(C.packetTitle ? C.packetTitle(it) : it.activityName || '现金红包') +
          '</div>' +
          subHtml(it) +
          (billNo
            ? '<div class="ua-rp-item__bill">流水号 ' + escapeHtml(billNo) + '</div>'
            : '') +
          '</div>' +
          '<div class="ua-rp-item__right">' +
          '<div class="ua-rp-item__amount">' +
          escapeHtml(String(it.amount)) +
          '<em>元</em></div>' +
          tag +
          '</div></button>'
        );
      })
      .join('');
  }

  function bindFilter() {
    document.querySelectorAll('.ua-rp-filter__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.ua-rp-filter__btn').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        statusFilter = btn.getAttribute('data-status') || '';
        render();
      });
    });
  }

  function bindList() {
    var listEl = document.getElementById('rpRecordsList');
    if (!listEl) return;
    listEl.addEventListener('click', function (e) {
      var item = e.target && e.target.closest ? e.target.closest('[data-claim]') : null;
      if (!item) return;
      var id = item.getAttribute('data-id');
      if (!id) return;
      if (id === 'live-bag') {
        claimBag(item);
        return;
      }
      if (id === 'demo-status-pending' && RG.showRedpackClaimSheet) {
        RG.showRedpackClaimSheet('', {
          preview: {
            activityName: '双端补偿红包',
            frontRemark: '双端补差',
            scene: 'manual',
            amount: 1.2,
            status: 'pending'
          }
        });
        return;
      }
      /* 手动派发等待领取：再次打开用户领取弹窗；成功后金额飞入现金收益 */
      RG.goRedpackClaim(id, {
        onClaimed: function (record, from) {
          var before = earnedNow() - (Number(record && record.amount) || 0);
          render();
          landEarn(from || item.getBoundingClientRect(), before);
        }
      });
    });
  }

  function syncFilterTabs() {
    document.querySelectorAll('.ua-rp-filter__btn').forEach(function (btn) {
      btn.classList.toggle('is-active', (btn.getAttribute('data-status') || '') === statusFilter);
    });
  }

  function layoutDemoStack() {
    var stack = document.getElementById('uaRpDemoStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'uaRpDemoStack';
      stack.className = 'ua-rp-demo-stack';
      document.body.appendChild(stack);
    }
    ['uaBlDemo', 'uaRpCondDemo', 'uaRpStatusDemo', 'uaWxPayDemo'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) stack.appendChild(el);
    });
  }

  function renderStatusDemo() {
    if (document.getElementById('uaRpStatusDemo')) return;
    var panel = document.createElement('div');
    panel.id = 'uaRpStatusDemo';
    panel.className = 'ua-rg-demo ua-rp-status-demo';
    var mode = readStatusDemo();
    function opt(value, label) {
      return '<option value="' + value + '"' + (mode === value ? ' selected' : '') + '>' + label + '</option>';
    }
    panel.innerHTML =
      '<div class="ua-rg-demo__title">现金红包验收开关</div>' +
      '<label class="ua-rg-demo__row">展示状态' +
      '<select id="uaRpStatusDemoMode">' +
      opt('', '全部状态') +
      opt('pending', '待领取') +
      opt('claimed', '已领取') +
      opt('expired', '已过期') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaRpStatusDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaRpStatusDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaRpStatusDemoMode');
      var next = sel ? sel.value : '';
      try {
        if (next) localStorage.setItem(STATUS_DEMO_KEY, next);
        else localStorage.removeItem(STATUS_DEMO_KEY);
      } catch (e) {}
      window.location.reload();
    });
  }

  function renderDemoPanel() {
    if (document.getElementById('uaRpPortDemo')) return;
    var panel = document.createElement('div');
    panel.id = 'uaRpPortDemo';
    panel.className = 'ua-rg-demo';
    var client = RG.getClientMode ? RG.getClientMode() : 'mini';
    panel.innerHTML =
      '<div class="ua-rg-demo__title">红包领取验收开关</div>' +
      '<label class="ua-rg-demo__row">客户端' +
      '<select id="uaRpPortDemoClient">' +
      '<option value="mini"' +
      (client === 'mini' ? ' selected' : '') +
      '>小程序</option>' +
      '<option value="app"' +
      (client === 'app' ? ' selected' : '') +
      '>APP</option>' +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaRpPortDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    renderStatusDemo();
    renderCondDemo();
    layoutDemoStack();
    var apply = document.getElementById('uaRpPortDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaRpPortDemoClient');
      if (RG.setClientMode) RG.setClientMode(sel && sel.value === 'app' ? 'app' : 'mini');
      window.location.reload();
    });
  }

  function renderCondDemo() {
    if (document.getElementById('uaRpCondDemo')) return;
    var panel = document.createElement('div');
    panel.id = 'uaRpCondDemo';
    panel.className = 'ua-rg-demo ua-rp-cond-demo';
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
      '<select id="uaRpCondDemoMode">' +
      opt('', '满足条件') +
      opt('register', '新注册用户') +
      opt('order_amount', '累计下单金额') +
      opt('order_count', '累计下单笔数') +
      opt('level', '会员等级') +
      opt('segment', '会员分群') +
      opt('tag', '会员标签') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaRpCondDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaRpCondDemoApply');
    if (!apply) return;
    apply.addEventListener('click', function () {
      var sel = document.getElementById('uaRpCondDemoMode');
      var next = sel ? sel.value : '';
      try {
        if (next) localStorage.setItem('ua_cash_claim_cond_demo_v1', next);
        else localStorage.removeItem('ua_cash_claim_cond_demo_v1');
      } catch (e) {}
      window.location.reload();
    });
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-gd-nav__back', 'profile.html');
    }
    renderDemoPanel();
    syncFilterTabs();
    bindFilter();
    bindList();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
