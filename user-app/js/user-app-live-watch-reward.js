/**
 * 用户 APP — 直播观看奖励
 * 仅在 B 端发放后开始统计观看时长；达标自动发奖并弹窗。
 * 验收开关：未发放 / 已发放未达标 / 达成各档 / 中断切新活动。
 */
(function (global) {
  'use strict';

  var DEMO_KEY = 'ua_live_watch_reward_demo_v1';
  var CLAIM_KEY = 'ua_live_watch_reward_claim_v1';
  var TIME_KEY = 'ua_live_watch_reward_time_v1';
  var ISSUE_KEY = 'lf_live_watch_reward_issue_v1';

  var FALLBACK_TPL = {
    WT10001: {
      id: 'WT10001',
      name: '晚间观看有礼',
      milestones: [
        { threshold: 3, rewardType: 'POINTS', pointsAmount: 10 },
        { threshold: 10, rewardType: 'COUPON', prizeCouponId: 'CT10001', couponName: '晚间满减券' },
        { threshold: 20, rewardType: 'POINTS', pointsAmount: 25 }
      ]
    },
    WT10002: {
      id: 'WT10002',
      name: '会员日观看',
      milestones: [
        { threshold: 5, rewardType: 'POINTS', pointsAmount: 5 },
        { threshold: 15, rewardType: 'POINTS', pointsAmount: 20 }
      ]
    }
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function sessionId() {
    try {
      var params = new URLSearchParams(location.search || '');
      return params.get('sessionId') || params.get('id') || 'sess-001';
    } catch (e) {
      return 'sess-001';
    }
  }

  function viewerId() {
    try {
      var raw = localStorage.getItem('ua_live_viewer_v1');
      var data = raw ? JSON.parse(raw) : null;
      if (data && data.id) return String(data.id);
    } catch (e) {}
    if (global.UAProfile && typeof global.UAProfile.getActiveMemberId === 'function') {
      return String(global.UAProfile.getActiveMemberId() || 'u-guozi');
    }
    return 'u-guozi';
  }

  function readDemoMode() {
    try {
      var v = localStorage.getItem(DEMO_KEY);
      if (
        v === 'follow' ||
        v === 'none' ||
        v === 'watching' ||
        v === 'hit1' ||
        v === 'hit2' ||
        v === 'hitAll' ||
        v === 'switched'
      ) {
        return v;
      }
    } catch (e) {}
    return 'follow';
  }

  function findTemplate(id) {
    var Demo = global.MdmLiveDemo;
    if (Demo && typeof Demo.findTaskTemplate === 'function') {
      var live = Demo.findTaskTemplate(id);
      if (live) return live;
    }
    return FALLBACK_TPL[id] || null;
  }

  function rewardText(m) {
    if (!m) return '奖励';
    if (m.rewardType === 'COUPON') {
      var c =
        m.prizeCouponId && global.MdmLiveDemo && global.MdmLiveDemo.findCouponTemplate
          ? global.MdmLiveDemo.findCouponTemplate(m.prizeCouponId)
          : null;
      return c ? '优惠券「' + c.name + '」' : m.couponName ? '优惠券「' + m.couponName + '」' : '优惠券';
    }
    if (m.rewardType === 'FORTUNE_BAG') return '福袋';
    if (m.rewardType === 'NONE') return '无奖励';
    return '+' + (m.pointsAmount || 0) + ' 积分';
  }

  function claimStoreKey(planId) {
    return sessionId() + ':' + planId + ':' + viewerId();
  }

  function readClaimed(planId) {
    var map = readJson(CLAIM_KEY, {});
    var arr = map[claimStoreKey(planId)];
    return Array.isArray(arr) ? arr : [];
  }

  function writeClaimed(planId, arr) {
    var map = readJson(CLAIM_KEY, {});
    map[claimStoreKey(planId)] = arr;
    writeJson(CLAIM_KEY, map);
  }

  function readTime(planId) {
    var map = readJson(TIME_KEY, {});
    return Number(map[claimStoreKey(planId)]) || 0;
  }

  function writeTime(planId, sec) {
    var map = readJson(TIME_KEY, {});
    map[claimStoreKey(planId)] = Math.max(0, Math.floor(sec || 0));
    writeJson(TIME_KEY, map);
  }

  function resolveIssued() {
    var mode = readDemoMode();
    if (mode === 'none') return null;
    if (mode === 'watching' || mode === 'hit1' || mode === 'hit2' || mode === 'hitAll') {
      return {
        sessionId: sessionId(),
        planId: 'demo-wt-1',
        templateId: 'WT10001',
        status: 'active',
        name: '晚间观看有礼'
      };
    }
    if (mode === 'switched') {
      return {
        sessionId: sessionId(),
        planId: 'demo-wt-2',
        templateId: 'WT10002',
        status: 'active',
        name: '会员日观看',
        prevPlanId: 'demo-wt-1',
        prevTemplateId: 'WT10001'
      };
    }
    var issued = readJson(ISSUE_KEY, null);
    if (!issued || issued.status !== 'active') return null;
    if (issued.sessionId && issued.sessionId !== sessionId()) return null;
    return issued;
  }

  function applyDemoSeed(issued) {
    var mode = readDemoMode();
    if (!issued) return;
    var ms = (findTemplate(issued.templateId) || {}).milestones || [];
    if (mode === 'watching') {
      writeTime(issued.planId, 45);
      writeClaimed(issued.planId, []);
    } else if (mode === 'hit1') {
      writeTime(issued.planId, (ms[0] && ms[0].threshold ? ms[0].threshold : 3) * 60);
      writeClaimed(issued.planId, []);
    } else if (mode === 'hit2') {
      writeTime(issued.planId, (ms[1] && ms[1].threshold ? ms[1].threshold : 10) * 60);
      writeClaimed(issued.planId, ms.length > 1 ? [0] : []);
    } else if (mode === 'hitAll') {
      var last = ms[ms.length - 1];
      var prior = [];
      var i;
      for (i = 0; i < Math.max(0, ms.length - 1); i++) prior.push(i);
      writeTime(issued.planId, (last && last.threshold ? last.threshold : 20) * 60);
      writeClaimed(issued.planId, prior);
    } else if (mode === 'switched') {
      writeTime(issued.planId, 20);
      writeClaimed(issued.planId, []);
      if (issued.prevPlanId) writeClaimed(issued.prevPlanId, [0]);
    }
  }

  function formatClock(sec) {
    var s = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function nextUnclaimed(ms, claimed) {
    var i;
    for (i = 0; i < (ms || []).length; i++) {
      if (claimed.indexOf(i) < 0) return { index: i, m: ms[i] };
    }
    return null;
  }

  function ensureUi() {
    var room = document.querySelector('.ua-live-room');
    if (room && !document.getElementById('uaWatchRewardChip')) {
      var chip = document.createElement('div');
      chip.id = 'uaWatchRewardChip';
      chip.className = 'ua-watch-reward-chip';
      chip.hidden = true;
      room.appendChild(chip);
    }
    if (!document.getElementById('uaWatchRewardModal')) {
      var modal = document.createElement('div');
      modal.id = 'uaWatchRewardModal';
      modal.className = 'ua-watch-reward-modal';
      modal.hidden = true;
      modal.innerHTML =
        '<div class="ua-watch-reward-modal__mask" data-wr-close="1"></div>' +
        '<div class="ua-watch-reward-modal__box" role="dialog" aria-labelledby="uaWatchRewardTitle">' +
        '<div class="ua-watch-reward-modal__title" id="uaWatchRewardTitle">观看奖励到账</div>' +
        '<div class="ua-watch-reward-modal__prize" id="uaWatchRewardPrize"></div>' +
        '<div class="ua-watch-reward-modal__desc" id="uaWatchRewardDesc"></div>' +
        '<button type="button" class="ua-watch-reward-modal__ok" id="uaWatchRewardOk">知道了</button>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function (ev) {
        if (ev.target.closest('[data-wr-close]') || ev.target.closest('#uaWatchRewardOk')) closeModal();
      });
    }
  }

  var modalQueue = [];
  var modalOpen = false;

  function closeModal() {
    var el = document.getElementById('uaWatchRewardModal');
    if (el) el.hidden = true;
    modalOpen = false;
    if (modalQueue.length) {
      var next = modalQueue.shift();
      window.setTimeout(function () {
        openModal(next.prize, next.desc);
      }, 240);
    }
  }

  function openModal(prize, desc) {
    ensureUi();
    if (modalOpen) {
      modalQueue.push({ prize: prize, desc: desc });
      return;
    }
    var el = document.getElementById('uaWatchRewardModal');
    var prizeEl = document.getElementById('uaWatchRewardPrize');
    var descEl = document.getElementById('uaWatchRewardDesc');
    if (prizeEl) prizeEl.textContent = prize;
    if (descEl) descEl.textContent = desc;
    if (el) el.hidden = false;
    modalOpen = true;
  }

  function grantDue(issued, watchSec) {
    var tpl = findTemplate(issued.templateId);
    var ms = (tpl && tpl.milestones) || issued.milestones || [];
    var claimed = readClaimed(issued.planId).slice();
    var minutes = watchSec / 60;
    var i;
    var changed = false;
    for (i = 0; i < ms.length; i++) {
      if (claimed.indexOf(i) >= 0) continue;
      if (minutes + 0.001 < Number(ms[i].threshold || 0)) continue;
      claimed.push(i);
      changed = true;
      openModal(rewardText(ms[i]), '观看满 ' + ms[i].threshold + ' 分钟，奖励已自动发放');
    }
    if (changed) writeClaimed(issued.planId, claimed);
    return claimed;
  }

  function renderChip(issued, watchSec) {
    ensureUi();
    var chip = document.getElementById('uaWatchRewardChip');
    if (!chip) return;
    if (!issued) {
      chip.hidden = true;
      return;
    }
    var tpl = findTemplate(issued.templateId);
    var ms = (tpl && tpl.milestones) || [];
    var claimed = readClaimed(issued.planId);
    var nxt = nextUnclaimed(ms, claimed);
    var name = (tpl && tpl.name) || issued.name || '观看奖励';
    var extra = '';
    if (readDemoMode() === 'switched' && issued.prevPlanId) extra = '（已切新活动）';
    chip.hidden = false;
    if (!nxt) {
      chip.textContent = name + extra + ' · 已看 ' + formatClock(watchSec) + ' · 全部档位已领';
      return;
    }
    chip.textContent =
      name + extra + ' · 已看 ' + formatClock(watchSec) + ' · 满' + nxt.m.threshold + '分钟领' + rewardText(nxt.m).replace(/^\+/, '');
  }

  function tick() {
    if (document.querySelector('.ua-live-room--bl-ban')) return;
    var issued = resolveIssued();
    if (!issued) {
      renderChip(null, 0);
      return;
    }
    var sec = readTime(issued.planId) + 1;
    writeTime(issued.planId, sec);
    grantDue(issued, sec);
    renderChip(issued, sec);
  }

  function mountDemo() {
    if (document.getElementById('uaWatchRewardDemo')) return;
    var mode = readDemoMode();
    var panel = document.createElement('div');
    panel.id = 'uaWatchRewardDemo';
    panel.className = 'ua-watch-reward-demo';
    panel.innerHTML =
      '<div class="ua-watch-reward-demo__title">观看奖励验收开关</div>' +
      '<label class="ua-live-goods-demo__row">发放状态' +
      '<select id="uaWatchRewardDemoMode">' +
      '<option value="follow"' +
      (mode === 'follow' ? ' selected' : '') +
      '>跟随中控</option>' +
      '<option value="none"' +
      (mode === 'none' ? ' selected' : '') +
      '>未发放（不计时）</option>' +
      '<option value="watching"' +
      (mode === 'watching' ? ' selected' : '') +
      '>已发放·未达标</option>' +
      '<option value="hit1"' +
      (mode === 'hit1' ? ' selected' : '') +
      '>达成第1档</option>' +
      '<option value="hit2"' +
      (mode === 'hit2' ? ' selected' : '') +
      '>达成第2档</option>' +
      '<option value="hitAll"' +
      (mode === 'hitAll' ? ' selected' : '') +
      '>全部档位已领</option>' +
      '<option value="switched"' +
      (mode === 'switched' ? ' selected' : '') +
      '>中断后按新活动</option>' +
      '</select></label>' +
      '<button type="button" class="ua-live-goods-demo__apply" id="uaWatchRewardDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaWatchRewardDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaWatchRewardDemoMode');
        var v = sel ? sel.value : 'follow';
        try {
          localStorage.setItem(DEMO_KEY, v);
        } catch (e) {}
        window.location.reload();
      });
    }
  }

  function init() {
    if (!document.querySelector('.ua-live-room')) return;
    ensureUi();
    mountDemo();
    var issued = resolveIssued();
    applyDemoSeed(issued);
    if (issued && !document.querySelector('.ua-live-room--bl-ban')) {
      var sec = readTime(issued.planId);
      grantDue(issued, sec);
      renderChip(issued, sec);
      window.setInterval(tick, 1000);
    } else {
      renderChip(null, 0);
    }
    window.addEventListener('storage', function (ev) {
      if (ev.key === ISSUE_KEY || ev.key === DEMO_KEY) window.location.reload();
    });
  }

  global.UaLiveWatchReward = { init: init };
})(window);
