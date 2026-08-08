/**
 * 营销活动 — 注册有礼（localStorage）
 * Key: mdm_marketing_register_gift_v1
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_marketing_register_gift_v2';

  var PORT_LABEL = { mini: '小程序', app: 'APP' };
  var SCENE_LABEL = {
    new_register: '新用户注册',
    old_first_download: '老用户下载'
  };

  var COUPON_OPTIONS = [
    '满50减5券',
    '满100减15券',
    '满200减30券',
    '满300减50券',
    '新人专享券',
    '免运费券',
    '生鲜满减券'
  ];

  var SEED = [
    {
      id: 'RG10001',
      name: '小程序新人注册礼',
      startAt: '2026-07-01T00:00',
      endAt: '2026-12-31T23:59',
      port: 'mini',
      scenes: ['new_register'],
      rewards: {
        new_register: {
          coupons: [
            { coupon: '新人专享券', qty: 1 },
            { coupon: '免运费券', qty: 1 }
          ],
          points: 100,
          cashEnabled: true,
          cashMin: 0.5,
          cashMax: 2,
          cashBudgetTotal: 5000,
          cashBudgetUsed: 120
        }
      },
      enabled: true,
      createdAt: '2026-06-20 10:00:00',
      updatedAt: '2026-07-28 14:20:11'
    },
    {
      id: 'RG10002',
      name: 'APP双场景开业礼',
      startAt: '2026-08-01T00:00',
      endAt: '2026-12-31T23:59',
      port: 'app',
      scenes: ['new_register', 'old_first_download'],
      rewards: {
        new_register: {
          coupons: [{ coupon: '满50减5券', qty: 2 }],
          points: 200,
          cashEnabled: true,
          cashMin: 1,
          cashMax: 1,
          cashBudgetTotal: 3000,
          cashBudgetUsed: 88
        },
        old_first_download: {
          coupons: [{ coupon: '满100减15券', qty: 1 }],
          points: 50,
          cashEnabled: true,
          cashMin: 0.3,
          cashMax: 1.5,
          cashBudgetTotal: 2000,
          cashBudgetUsed: 45
        }
      },
      enabled: true,
      createdAt: '2026-07-15 16:30:00',
      updatedAt: '2026-07-30 09:12:45'
    },
    {
      id: 'RG10003',
      name: '春季拉新（已下线）',
      startAt: '2026-03-01T00:00',
      endAt: '2026-05-31T23:59',
      port: 'app',
      scenes: ['new_register'],
      rewards: {
        new_register: {
          coupons: [{ coupon: '生鲜满减券', qty: 1 }],
          points: 0,
          cashEnabled: false,
          cashMin: 0,
          cashMax: 0,
          cashBudgetTotal: 0,
          cashBudgetUsed: 0
        }
      },
      enabled: false,
      createdAt: '2026-02-18 11:05:00',
      updatedAt: '2026-06-02 11:08:00'
    }
  ];

  var list = [];
  var loaded = false;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatNow() {
    var d = new Date();
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

  function parseLocal(dt) {
    if (!dt) return null;
    var s = String(dt).trim().replace(' ', 'T');
    var t = Date.parse(s);
    return isNaN(t) ? null : t;
  }

  function normalizeCoupon(item) {
    var c = item || {};
    return {
      coupon: String(c.coupon || '').trim(),
      qty: Math.max(1, Math.round(Number(c.qty) || 1))
    };
  }

  function toMoney(n) {
    var v = Number(n);
    if (isNaN(v) || v < 0) return 0;
    return Math.round(v * 100) / 100;
  }

  function normalizeReward(reward) {
    var r = reward || {};
    var coupons = Array.isArray(r.coupons) ? r.coupons.map(normalizeCoupon) : [];
    var points = Math.max(0, Math.round(Number(r.points) || 0));
    var cashMin = toMoney(r.cashMin);
    var cashMax = toMoney(r.cashMax);
    if (cashMax < cashMin) cashMax = cashMin;
    var cashBudgetTotal = toMoney(r.cashBudgetTotal);
    var cashBudgetUsed = toMoney(r.cashBudgetUsed);
    var cashEnabled = r.cashEnabled === true || r.cashEnabled === 'true' || r.cashEnabled === 1;
    if (!cashEnabled && (cashMin > 0 || cashMax > 0) && cashBudgetTotal > 0 && r.cashEnabled == null) {
      /* 兼容旧数据：有金额配置但未写开关时视为开启 */
      cashEnabled = true;
    }
    return {
      coupons: coupons,
      points: points,
      cashEnabled: !!cashEnabled,
      cashMin: cashMin,
      cashMax: cashMax,
      cashBudgetTotal: cashBudgetTotal,
      cashBudgetUsed: cashBudgetUsed
    };
  }

  /** 现金红包总开关是否开启（营销-现金红包页） */
  function isGlobalCashEnabled() {
    var C = global.MdmMarketingCashRedpackStore;
    if (!C || typeof C.isEnabled !== 'function') return true;
    return !!C.isEnabled();
  }

  /** 现金红包是否仍可发放（总开关开启 + 活动已开启且未达总额度） */
  function isCashAvailable(reward) {
    if (!isGlobalCashEnabled()) return false;
    var r = normalizeReward(reward);
    if (!r.cashEnabled) return false;
    if (r.cashBudgetTotal <= 0) return false;
    return r.cashBudgetUsed < r.cashBudgetTotal;
  }

  /** 摘要文案：固定金额或区间 */
  function formatCashSummary(reward) {
    var r = normalizeReward(reward);
    if (!r.cashEnabled) return '';
    if (r.cashMin === r.cashMax) return '现金红包：' + r.cashMin + '元';
    return '现金红包：' + r.cashMin + '~' + r.cashMax + '元';
  }

  /** 在区间内随机金额（演示）；额度不足时返回剩余额度 */
  function rollCashAmount(reward) {
    var r = normalizeReward(reward);
    if (!isCashAvailable(r)) return 0;
    var remain = Math.round((r.cashBudgetTotal - r.cashBudgetUsed) * 100) / 100;
    var min = r.cashMin;
    var max = r.cashMax;
    if (max < min) max = min;
    var amount;
    if (min === max) {
      amount = min;
    } else {
      amount = Math.round((min + Math.random() * (max - min)) * 100) / 100;
    }
    if (amount > remain) amount = remain;
    return amount > 0 ? amount : 0;
  }


  function normalizeItem(raw) {
    var item = Object.assign({}, raw || {});
    item.id = String(item.id || '');
    item.name = String(item.name || '').trim();
    item.startAt = String(item.startAt || '').trim();
    item.endAt = String(item.endAt || '').trim();
    item.port = item.port === 'app' ? 'app' : 'mini';
    var scenes = Array.isArray(item.scenes) ? item.scenes.slice() : [];
    scenes = scenes.filter(function (s) {
      return s === 'new_register' || s === 'old_first_download';
    });
    if (item.port === 'mini') {
      scenes = ['new_register'];
    } else if (!scenes.length) {
      scenes = ['new_register'];
    }
    item.scenes = scenes;
    var rewards = item.rewards && typeof item.rewards === 'object' ? item.rewards : {};
    var nextRewards = {};
    scenes.forEach(function (scene) {
      nextRewards[scene] = normalizeReward(rewards[scene]);
    });
    item.rewards = nextRewards;
    item.enabled = item.enabled !== false;
    var nowStr = formatNow();
    item.createdAt = String(item.createdAt || item.updatedAt || nowStr);
    item.updatedAt = String(item.updatedAt || nowStr);
    return item;
  }

  /**
   * 活动展示状态：已禁用 / 未开始 / 进行中 / 已结束
   */
  function computeStatus(item, nowMs) {
    if (!item || !item.enabled) return 'disabled';
    var now = nowMs != null ? nowMs : Date.now();
    var start = parseLocal(item.startAt);
    var end = parseLocal(item.endAt);
    if (start != null && now < start) return 'upcoming';
    if (end != null && now > end) return 'ended';
    return 'active';
  }

  var STATUS_LABEL = {
    disabled: '已禁用',
    upcoming: '未开始',
    active: '进行中',
    ended: '已结束'
  };

  function statusLabel(code) {
    return STATUS_LABEL[code] || code || '—';
  }

  function portLabel(port) {
    return PORT_LABEL[port] || port || '—';
  }

  function sceneLabel(scene) {
    return SCENE_LABEL[scene] || scene || '—';
  }

  function scenesText(item) {
    if (!item || !Array.isArray(item.scenes)) return '—';
    return item.scenes.map(sceneLabel).join('、') || '—';
  }

  function formatRange(item) {
    if (!item) return '—';
    var a = (item.startAt || '').replace('T', ' ');
    var b = (item.endAt || '').replace('T', ' ');
    if (!a && !b) return '—';
    return (a || '—') + ' ~ ' + (b || '—');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 单场景奖励摘要：券名×数量、N积分、现金红包 */
  function rewardSceneSummary(reward) {
    var r = normalizeReward(reward);
    var parts = [];
    (r.coupons || []).forEach(function (c) {
      if (!c.coupon) return;
      parts.push(c.coupon + '×' + c.qty);
    });
    if (r.points > 0) parts.push(r.points + '积分');
    var cashText = formatCashSummary(r);
    if (cashText) parts.push(cashText);
    return parts.length ? parts.join('、') : '';
  }

  /**
   * 收集奖励展示结构：按场景分组，子项为券/积分/红包各一行。
   * @returns {Array<{scene: string, items: string[]}>}
   */
  function rewardsSummaryGroups(item) {
    if (!item || !Array.isArray(item.scenes) || !item.scenes.length) return [];
    var groups = [];
    item.scenes.forEach(function (scene) {
      var r = normalizeReward(item.rewards && item.rewards[scene]);
      var items = [];
      (r.coupons || []).forEach(function (c) {
        if (!c.coupon) return;
        items.push(c.coupon + '×' + c.qty);
      });
      if (r.points > 0) items.push(r.points + '积分');
      var cashText = formatCashSummary(r);
      if (cashText) items.push(cashText);
      if (items.length) {
        groups.push({ scene: sceneLabel(scene), items: items });
      }
    });
    return groups;
  }

  /**
   * C 端展示用：按场景收集可见奖励文案；额度耗尽时不展示现金红包。
   * @returns {string[]}
   */
  function rewardDisplayLines(reward, opts) {
    opts = opts || {};
    var r = normalizeReward(reward);
    var lines = [];
    (r.coupons || []).forEach(function (c) {
      if (!c.coupon) return;
      lines.push(c.coupon + '×' + c.qty);
    });
    if (r.points > 0) lines.push(r.points + '积分');
    var showCash = opts.includeCash !== false && isCashAvailable(r);
    if (showCash) {
      var cashText = formatCashSummary(r);
      if (cashText) lines.push(cashText);
    }
    return lines;
  }

  /** 取指定端口当前进行中、创建时间最新的活动 */
  function getActiveByPort(port) {
    var now = Date.now();
    var target = port === 'app' ? 'app' : 'mini';
    var candidates = getAll().filter(function (it) {
      return it.port === target && computeStatus(it, now) === 'active';
    });
    candidates.sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    return candidates[0] || null;
  }

  /** 累加某场景已用红包额度 */
  function addCashBudgetUsed(activityId, scene, amount) {
    ensureLoaded();
    var sid = String(activityId || '');
    var amt = toMoney(amount);
    if (!sid || amt <= 0) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) !== sid) continue;
      var item = normalizeItem(list[i]);
      var reward = normalizeReward(item.rewards && item.rewards[scene]);
      reward.cashBudgetUsed = toMoney(reward.cashBudgetUsed + amt);
      item.rewards[scene] = reward;
      item.updatedAt = formatNow();
      list[i] = item;
      persist();
      return normalizeItem(item);
    }
    return null;
  }


  /**
   * 收集奖励展示行（纯文本兼容：场景：子项、子项）
   */
  function rewardsSummaryLines(item) {
    return rewardsSummaryGroups(item).map(function (g) {
      return g.scene + '：' + g.items.join('、');
    });
  }

  /** 列表「奖励」列纯文本（title / 兼容） */
  function rewardsSummary(item) {
    var lines = rewardsSummaryLines(item);
    return lines.length ? lines.join('；') : '—';
  }

  /**
   * 列表「奖励」列 HTML：场景标题 + 缩进橙点子项
   * 新用户注册：
   *    · xxx
   */
  function formatRewardsSummaryHtml(item) {
    var groups = rewardsSummaryGroups(item);
    if (!groups.length) {
      return '<span class="member-level-benefit-empty">暂无奖励</span>';
    }
    return (
      '<ul class="member-level-benefit-list mkt-rg-reward-groups">' +
      groups
        .map(function (g) {
          return (
            '<li class="mkt-rg-reward-group">' +
            '<div class="mkt-rg-reward-group__title">' +
            escapeHtml(g.scene) +
            '：</div>' +
            '<ul class="mkt-rg-reward-group__items">' +
            g.items
              .map(function (it) {
                return '<li>' + escapeHtml(it) + '</li>';
              })
              .join('') +
            '</ul></li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  /**
   * 活动时间区间与筛选区间是否有交集。
   * 两端均可空：都空=不过滤；仅开始=活动结束≥筛选开始；仅结束=活动开始≤筛选结束。
   */
  function rangesIntersect(actStartAt, actEndAt, filterStartAt, filterEndAt) {
    var fStart = parseLocal(filterStartAt);
    var fEnd = parseLocal(filterEndAt);
    if (fStart == null && fEnd == null) return true;

    var aStart = parseLocal(actStartAt);
    var aEnd = parseLocal(actEndAt);
    var actLo = aStart != null ? aStart : Number.NEGATIVE_INFINITY;
    var actHi = aEnd != null ? aEnd : Number.POSITIVE_INFINITY;
    var filterLo = fStart != null ? fStart : Number.NEGATIVE_INFINITY;
    var filterHi = fEnd != null ? fEnd : Number.POSITIVE_INFINITY;
    return actLo <= filterHi && filterLo <= actHi;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          list = parsed.map(normalizeItem);
          return;
        }
      }
    } catch (e) {}
    list = SEED.map(normalizeItem);
    persist();
  }

  function getAll() {
    ensureLoaded();
    return list.map(function (it) {
      return normalizeItem(it);
    });
  }

  function getById(id) {
    ensureLoaded();
    var sid = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === sid) return normalizeItem(list[i]);
    }
    return null;
  }

  function nextId() {
    ensureLoaded();
    var max = 10000;
    list.forEach(function (it) {
      var m = String(it.id || '').match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'RG' + String(max + 1);
  }

  function saveItem(payload) {
    ensureLoaded();
    var item = normalizeItem(payload);
    if (!item.id) item.id = nextId();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(item.id)) {
        idx = i;
        break;
      }
    }
    var nowStr = formatNow();
    if (idx >= 0) {
      item.createdAt = String(list[idx].createdAt || item.createdAt || nowStr);
      item.updatedAt = nowStr;
      list[idx] = item;
    } else {
      item.createdAt = String(item.createdAt || nowStr);
      item.updatedAt = nowStr;
      list.unshift(item);
    }
    persist();
    return item;
  }

  function setEnabled(id, enabled) {
    ensureLoaded();
    var sid = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === sid) {
        list[i].enabled = !!enabled;
        list[i].updatedAt = formatNow();
        persist();
        return normalizeItem(list[i]);
      }
    }
    return null;
  }

  function removeItem(id) {
    ensureLoaded();
    var sid = String(id || '');
    var next = list.filter(function (it) {
      return String(it.id) !== sid;
    });
    if (next.length === list.length) return false;
    list = next;
    persist();
    return true;
  }

  function filterList(query) {
    ensureLoaded();
    var q = query || {};
    var name = String(q.name || '')
      .trim()
      .toLowerCase();
    var port = String(q.port || '').trim();
    var status = String(q.status || '').trim();
    var timeStart = String(q.timeStart || '').trim();
    var timeEnd = String(q.timeEnd || '').trim();
    var now = Date.now();
    return getAll().filter(function (it) {
      if (name && String(it.name).toLowerCase().indexOf(name) < 0) return false;
      if (port && it.port !== port) return false;
      if (status) {
        var st = computeStatus(it, now);
        if (st !== status) return false;
      }
      if (!rangesIntersect(it.startAt, it.endAt, timeStart, timeEnd)) return false;
      return true;
    });
  }

  global.MdmMarketingRegisterGiftStore = {
    STORAGE_KEY: STORAGE_KEY,
    COUPON_OPTIONS: COUPON_OPTIONS,
    PORT_LABEL: PORT_LABEL,
    SCENE_LABEL: SCENE_LABEL,
    STATUS_LABEL: STATUS_LABEL,
    normalizeItem: normalizeItem,
    normalizeReward: normalizeReward,
    toMoney: toMoney,
    isCashAvailable: isCashAvailable,
    isGlobalCashEnabled: isGlobalCashEnabled,
    formatCashSummary: formatCashSummary,
    rollCashAmount: rollCashAmount,
    rewardDisplayLines: rewardDisplayLines,
    getActiveByPort: getActiveByPort,
    addCashBudgetUsed: addCashBudgetUsed,
    computeStatus: computeStatus,
    statusLabel: statusLabel,
    portLabel: portLabel,
    sceneLabel: sceneLabel,
    scenesText: scenesText,
    formatRange: formatRange,
    rewardSceneSummary: rewardSceneSummary,
    rewardsSummaryGroups: rewardsSummaryGroups,
    rewardsSummaryLines: rewardsSummaryLines,
    rewardsSummary: rewardsSummary,
    formatRewardsSummaryHtml: formatRewardsSummaryHtml,
    rangesIntersect: rangesIntersect,
    getAll: getAll,
    getById: getById,
    saveItem: saveItem,
    setEnabled: setEnabled,
    removeItem: removeItem,
    filterList: filterList,
    nextId: nextId
  };
})(window);
