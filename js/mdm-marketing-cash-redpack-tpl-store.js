/**
 * 营销活动 — 现金红包模版
 * Key: mdm_marketing_cash_redpack_tpl_v1
 * 字段：红包名称、活动领取终端、奖励类型、领取条件。
 * 奖励类型替换原发放金额、发放总额度。
 * 启用后不按发放场景限制，注册有礼及其他模块均可关联。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_marketing_cash_redpack_tpl_v1';
  var LOG_KEY = 'mdm_marketing_cash_redpack_tpl_logs_v1';
  var AUDIT_KEY = 'mdm_marketing_cash_redpack_tpl_audit_v1';

  var STATUS_LABEL = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '审核成功',
    REJECTED: '审核失败',
    ACTIVE: '启用',
    DISABLED: '禁用'
  };
  var PORT_LABEL = { mini: '小程序', app: 'APP' };
  var SCENE_LABEL = { REGISTER_GIFT: '注册有礼' };
  var SCENE_OPTIONS = [{ v: 'REGISTER_GIFT', l: '注册有礼' }];
  /** 红包模版固定走微信「现金营销」，用户收款感知默认「活动奖励」 */
  var TRANSFER_SCENE_DEFAULT = { id: 'cash_marketing', label: '现金营销' };
  var USER_PERCEPTION_DEFAULT = { id: 'activity_reward', label: '活动奖励' };
  var AMOUNT_MODE_LABEL = { fixed: '固定金额', range: '区间金额' };
  var REWARD_TYPE_LABEL = {
    fixed: '固定金额',
    random: '随机金额',
    custom_fixed: '自定义（固定）',
    custom_random: '自定义（随机）'
  };
  var CLAIM_LABEL = {
    none: '无条件',
    register: '新注册用户',
    order_amount: '累计天数范围内的累计下单金额',
    order_count: '累计天数范围内的累计下单笔数'
  };
  /** 未满足模板领取条件时，客户端固定提示 */
  var CLAIM_DENY_MSG = {
    register: '抱歉，您暂不符合领取条件！',
    order_amount: '您的累计下单金额未达到领取条件！',
    order_count: '您的累计下单笔数未达到领取条件！'
  };
  /** 不在会员等级、分群或标签领取范围内 */
  var MEMBER_DENY_MSG = '抱歉，您暂不符合该红包的领取条件！';
  var CLAIM_DEMO_KEY = 'ua_cash_claim_cond_demo_v1';
  var CLAIM_TIMES_LABEL = { per_user: '每人限领', unlimited: '不限次数' };
  /** 累计天数范围。1 展示为「1(即今日)」，与统计口径文案对应 */
  var DAY_RANGE_OPTIONS = [1, 3, 7, 15, 30, 60, 90, 180, 365];

  var SEED = [
    {
      id: 'CRPT10001',
      name: '新人注册红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['mini'],
      rewardType: 'custom_random',
      singleAmount: 0,
      totalAmount: '',
      packetTotal: 0,
      packetIssued: 0,
      tiers: [{ amount: 0, amountMin: 0.5, amountMax: 2, count: 2500, expected: 1, probability: 100, issued: 80 }],
      budgetTotal: 5000,
      budgetUsed: 120,
      claimCondition: 'register',
      registerDays: 7,
      orderCount: 0,
      orderAmount: 0,
      orderDayRange: 1,
      status: 'ACTIVE',
      remark: '',
      startAt: '2026-06-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-06-18 09:20:00',
      updatedAt: '2026-07-28 14:20:11'
    },
    {
      id: 'CRPT10002',
      name: 'APP开业红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['app'],
      rewardType: 'fixed',
      singleAmount: 1,
      totalAmount: '',
      packetTotal: 3000,
      packetIssued: 88,
      tiers: [],
      budgetTotal: 3000,
      budgetUsed: 88,
      status: 'ACTIVE',
      remark: '',
      startAt: '2026-01-01T00:00',
      endAt: '2026-08-01T23:59',
      createdAt: '2026-07-10 11:00:00',
      updatedAt: '2026-07-30 09:12:45'
    },
    {
      id: 'CRPT10003',
      name: 'APP下载回访红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['app'],
      rewardType: 'random',
      singleAmount: 0,
      totalAmount: '2000',
      packetTotal: 2000,
      packetIssued: 45,
      tiers: [],
      budgetTotal: 2000,
      budgetUsed: 45,
      claimCondition: 'order_count',
      registerDays: 0,
      orderCount: 2,
      orderAmount: 0,
      orderDayRange: 7,
      status: 'ACTIVE',
      remark: '',
      startAt: '2026-11-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-07-12 15:40:00',
      updatedAt: '2026-07-30 09:12:45'
    },
    {
      id: 'CRPT10004',
      name: '会员日红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['mini', 'app'],
      rewardType: 'custom_fixed',
      singleAmount: 0,
      totalAmount: '',
      packetTotal: 0,
      packetIssued: 0,
      tiers: [
        { amount: 0.88, amountMin: 0, amountMax: 0, count: 800, expected: 0, probability: 80, issued: 0 },
        { amount: 8.8, amountMin: 0, amountMax: 0, count: 200, expected: 0, probability: 20, issued: 0 }
      ],
      budgetTotal: 2464,
      budgetUsed: 0,
      status: 'DRAFT',
      remark: '',
      startAt: '2026-10-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-10-01 10:08:00',
      updatedAt: '2026-10-01 10:08:00'
    },
    {
      id: 'CRPT10005',
      name: '春节红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['mini'],
      rewardType: 'fixed',
      singleAmount: 2,
      totalAmount: '',
      packetTotal: 4000,
      packetIssued: 0,
      tiers: [],
      budgetTotal: 8000,
      budgetUsed: 0,
      status: 'PENDING',
      remark: '',
      startAt: '2026-10-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-10-06 16:22:00',
      updatedAt: '2026-10-06 16:30:00'
    },
    {
      id: 'CRPT10006',
      name: '审核通过红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['mini', 'app'],
      rewardType: 'fixed',
      singleAmount: 1.2,
      totalAmount: '',
      packetTotal: 1000,
      packetIssued: 0,
      tiers: [],
      budgetTotal: 1200,
      budgetUsed: 0,
      status: 'APPROVED',
      remark: '',
      startAt: '2026-10-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-10-08 09:00:00',
      updatedAt: '2026-10-08 11:20:00'
    },
    {
      id: 'CRPT10007',
      name: '审核失败红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['mini'],
      rewardType: 'fixed',
      singleAmount: 1,
      totalAmount: '',
      packetTotal: 500,
      packetIssued: 0,
      tiers: [],
      budgetTotal: 500,
      budgetUsed: 0,
      status: 'REJECTED',
      remark: '奖励金额超出活动预算',
      startAt: '2026-10-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-10-09 10:00:00',
      updatedAt: '2026-10-09 15:00:00'
    },
    {
      id: 'CRPT10008',
      name: '已禁用红包',
      issueScenes: ['REGISTER_GIFT'],
      ports: ['app'],
      rewardType: 'fixed',
      singleAmount: 2,
      totalAmount: '',
      packetTotal: 800,
      packetIssued: 0,
      tiers: [],
      budgetTotal: 1600,
      budgetUsed: 0,
      status: 'DISABLED',
      remark: '',
      startAt: '2026-10-01T00:00',
      endAt: '2026-12-31T23:59',
      createdAt: '2026-10-10 10:00:00',
      updatedAt: '2026-10-11 10:00:00'
    }
  ];

  var AUDIT_STATUS_LABEL = {
    PENDING: '待审核',
    APPROVED: '审核成功',
    REJECTED: '审核失败',
    CANCELLED: '已取消'
  };

  var list = [];
  var logs = {};
  var audits = [];
  var loaded = false;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
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

  function toMoney(n) {
    var v = Math.round(Number(n) * 100) / 100;
    return isNaN(v) ? 0 : v;
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function uniqueIds(ids) {
    var out = [];
    (Array.isArray(ids) ? ids : []).forEach(function (id) {
      var sid = String(id || '');
      if (sid && out.indexOf(sid) < 0) out.push(sid);
    });
    return out;
  }

  function uniquePorts(ports) {
    var out = [];
    (ports || []).forEach(function (p) {
      if ((p === 'mini' || p === 'app') && out.indexOf(p) < 0) out.push(p);
    });
    return out;
  }

  function normalize(raw) {
    var item = Object.assign({}, raw || {});
    item.id = String(item.id || '');
    item.name = String(item.name || '').trim().slice(0, 50);
    item.startAt = String(item.startAt || '').trim();
    item.endAt = String(item.endAt || '').trim();
    item.ports = uniquePorts(item.ports);
    item.budgetUsed = toMoney(item.budgetUsed);
    item.rewardMode = item.rewardMode === 'diff' ? 'diff' : 'unified';
    if (item.rewardMode === 'diff') {
      item.rewardSchemes = normalizeSchemes(item.rewardSchemes);
      applyDiffRoot(item);
    } else {
      item.rewardSchemes = [];
      applyReward(item);
    }
    var claim = item.claimCondition;
    if (claim === 'order') {
      claim = toMoney(item.orderAmount) > 0 && !(Math.round(Number(item.orderCount) || 0) >= 1) ? 'order_amount' : 'order_count';
    }
    if (claim !== 'register' && claim !== 'order_count' && claim !== 'order_amount') claim = 'none';
    item.claimCondition = claim;
    item.registerDays = Math.max(0, Math.round(Number(item.registerDays) || 0));
    item.orderCount = Math.max(0, Math.round(Number(item.orderCount) || 0));
    item.orderAmount = toMoney(item.orderAmount);
    if (claim === 'order_count') item.orderAmount = 0;
    if (claim === 'order_amount') item.orderCount = 0;
    var audience = item.memberAudience;
    if (audience !== 'tag' && audience !== 'segment') audience = 'level';
    item.memberAudience = audience;
    if (item.memberScope !== 'all' && item.memberScope !== 'specific') item.memberScope = 'all';
    item.memberLevelIds = uniqueIds(item.memberLevelIds);
    item.memberTagIds = uniqueIds(item.memberTagIds);
    item.memberSegmentIds = uniqueIds(item.memberSegmentIds);
    if (item.rewardMode === 'diff') {
      var schemeIds = [];
      (item.rewardSchemes || []).forEach(function (scheme) {
        (scheme.memberIds || []).forEach(function (id) {
          if (schemeIds.indexOf(id) < 0) schemeIds.push(id);
        });
      });
      item.memberScope = 'specific';
      if (audience === 'tag') {
        item.memberTagIds = schemeIds;
        item.memberLevelIds = [];
        item.memberSegmentIds = [];
      } else if (audience === 'segment') {
        item.memberSegmentIds = schemeIds;
        item.memberLevelIds = [];
        item.memberTagIds = [];
      } else {
        item.memberLevelIds = schemeIds;
        item.memberTagIds = [];
        item.memberSegmentIds = [];
      }
    } else if (audience === 'level' && item.memberScope === 'all') {
      item.memberLevelIds = [];
    }
    var rawDay = item.orderDayRange;
    var dayRange = Math.round(Number(rawDay));
    if (!dayRange || dayRange < 1) dayRange = rawDay === '' ? 0 : 1;
    if (dayRange > 3650) dayRange = 3650;
    item.orderDayRange = dayRange;
    item.orderDayCustom = !!item.orderDayCustom || (dayRange > 0 && DAY_RANGE_OPTIONS.indexOf(dayRange) < 0);
    item.claimTimesMode = item.claimTimesMode === 'per_user' ? 'per_user' : 'unlimited';
    item.transferScene = TRANSFER_SCENE_DEFAULT.id;
    item.userPerception = USER_PERCEPTION_DEFAULT.id;
    if (!STATUS_LABEL[item.status]) item.status = 'DRAFT';
    item.remark = String(item.remark || '').trim();
    var now = nowStr();
    item.createdAt = String(item.createdAt || now);
    item.updatedAt = String(item.updatedAt || item.createdAt);
    return item;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
      localStorage.setItem(AUDIT_KEY, JSON.stringify(audits));
    } catch (e) {}
  }

  /** 旧演示数据没有领取条件时，按种子补上，已保存过的配置不覆盖 */
  function fillSeedClaim(raw) {
    var item = raw || {};
    if (item.claimCondition != null && item.claimCondition !== '') return item;
    if (item.id === 'CRPT10001') {
      item.claimCondition = 'register';
      item.registerDays = item.registerDays || 7;
    } else if (item.id === 'CRPT10003') {
      item.claimCondition = 'order_count';
      item.orderCount = item.orderCount || 2;
      item.orderAmount = 0;
      item.orderDayRange = item.orderDayRange || 7;
    }
    return item;
  }

  /** 旧演示数据没有有效期时补上，已填写的不覆盖 */
  function fillSeedValidity(raw) {
    var item = raw || {};
    if (item.startAt || item.endAt) return item;
    var span = {
      CRPT10001: ['2026-06-01T00:00', '2026-12-31T23:59'],
      CRPT10002: ['2026-01-01T00:00', '2026-08-01T23:59'],
      CRPT10003: ['2026-11-01T00:00', '2026-12-31T23:59'],
      CRPT10004: ['2026-10-01T00:00', '2026-12-31T23:59'],
      CRPT10005: ['2026-10-01T00:00', '2026-12-31T23:59']
    };
    var pair = span[item.id];
    if (!pair) return item;
    item.startAt = pair[0];
    item.endAt = pair[1];
    return item;
  }

  function parseAt(value) {
    var text = String(value || '').trim().replace(' ', 'T');
    if (!text) return NaN;
    if (text.length === 16) text += ':00';
    var time = Date.parse(text);
    return isNaN(time) ? NaN : time;
  }

  /** 已打开过的原型补上审核成功 / 审核失败 / 已禁用样例，便于核对可选与置灰 */
  function ensureRewardStatusDemos() {
    var ids = { CRPT10006: true, CRPT10007: true, CRPT10008: true };
    var missing = SEED.filter(function (item) {
      return ids[item.id] && !list.some(function (row) { return row.id === item.id; });
    });
    if (!missing.length) return;
    missing.forEach(function (item) {
      list.push(normalize(clone(item)));
    });
    persist();
  }

  /**
   * 福袋 / 签到 / 观看任务关联红包：已审核通过即可选，未到有效期也可先关联。
   * 直播发放仍走默认口径，未到有效期不能发。
   * options.allowNotStarted 为 true 时，不把「未到有效期」当作不可选。
   */
  function rewardBlockReason(item, options) {
    var it = item && item.status ? item : normalize(item);
    var allowNotStarted = !!(options && options.allowNotStarted);
    if (it.status === 'DRAFT') return '草稿';
    if (it.status === 'PENDING') return '待审核';
    if (it.status === 'REJECTED') return '审核失败';
    if (it.status === 'DISABLED') return '已禁用';
    if (it.status !== 'APPROVED' && it.status !== 'ACTIVE') return '未审核通过';
    var start = parseAt(it.startAt);
    var end = parseAt(it.endAt);
    if (isNaN(start) || isNaN(end)) return '未设置有效期';
    var now = Date.now();
    if (now < start && !allowNotStarted) return '未到有效期';
    if (now > end) return '已过有效期';
    return '';
  }

  function listRewardOptions(options) {
    ensureLoaded();
    return getAll().map(function (it) {
      var reason = rewardBlockReason(it, options);
      return {
        id: it.id,
        name: it.name,
        selectable: !reason,
        reason: reason,
        label: reason ? it.name + '（' + reason + '）' : it.name
      };
    });
  }

  function rewardPhase(item) {
    if (!item) return 'other';
    var start = parseAt(item.startAt);
    var end = parseAt(item.endAt);
    if (isNaN(start) || isNaN(end)) return 'other';
    var now = Date.now();
    if (now < start) return 'notStarted';
    if (now > end) return 'expired';
    return 'active';
  }

  /**
   * 关联现金红包的下拉：只保留可关联的。有效期内的在前，未到有效期其次，并带上有效期。
   * 草稿、待审核、审核失败、已禁用、已过有效期不出现在下拉中。
   */
  function listBindOptions() {
    var list = listRewardOptions({ allowNotStarted: true }).filter(function (opt) {
      return opt.selectable;
    }).map(function (opt) {
      var row = getById(opt.id);
      var phase = rewardPhase(row);
      var period = activityTimeText(row);
      var periodText = period && period !== '—' ? period : '';
      var label = opt.name + (periodText ? '（有效期 ' + periodText + '）' : '');
      return {
        id: opt.id,
        name: opt.name,
        selectable: true,
        reason: '',
        periodText: periodText,
        phase: phase,
        sortRank: phase === 'notStarted' ? 1 : 0,
        label: label
      };
    });
    list.sort(function (a, b) {
      return a.sortRank - b.sortRank;
    });
    return list;
  }

  function isRewardSelectable(id, options) {
    var sid = String(id || '');
    if (!sid) return false;
    var rows = listRewardOptions(options);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === sid) return !!rows[i].selectable;
    }
    return false;
  }

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      list = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(list) || !list.length) list = clone(SEED);
      else list = list.map(fillSeedClaim).map(fillSeedValidity);
    } catch (e) {
      list = clone(SEED);
    }
    try {
      logs = JSON.parse(localStorage.getItem(LOG_KEY) || '{}') || {};
    } catch (e2) {
      logs = {};
    }
    list = list.map(normalize);
    try {
      var araw = localStorage.getItem(AUDIT_KEY);
      audits = araw ? JSON.parse(araw) : null;
      if (!Array.isArray(audits)) audits = seedAudits();
    } catch (e3) {
      audits = seedAudits();
    }
    ensureRewardStatusDemos();
    ensureCancelledAuditDemo();
  }

  function ensureCancelledAuditDemo() {
    if (audits.some(function (row) { return row && row.id === 'CRAUD-CANCEL-DEMO'; })) return;
    var src = null;
    list.forEach(function (item) {
      if (item && item.id === 'CRPT10004') src = item;
    });
    if (!src && list.length) src = list[0];
    if (!src) return;
    var snap = clone(normalize(src));
    snap.name = snap.name || '已取消红包';
    audits.unshift({
      id: 'CRAUD-CANCEL-DEMO',
      templateId: snap.id,
      status: 'CANCELLED',
      submittedAt: '2026-10-12 15:10:00',
      submittedBy: '张征',
      auditedAt: '2026-10-12 15:18:00',
      auditedBy: '张征',
      reason: '',
      auditLogs: [{
        node: '营销审核',
        reviewer: '张征',
        time: '2026-10-12 15:18:00',
        result: '取消',
        reason: '取消审核，回到草稿'
      }],
      snapshot: snap
    });
    persist();
  }

  function nextId() {
    var max = 10000;
    list.forEach(function (it) {
      var m = String(it.id || '').match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'CRPT' + String(max + 1);
  }

  function findIndex(id) {
    var sid = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === sid) return i;
    }
    return -1;
  }

  function pushLog(id, action, detail) {
    var sid = String(id || '');
    if (!logs[sid]) logs[sid] = [];
    logs[sid].unshift({
      at: nowStr(),
      action: action,
      detail: detail || '',
      operator: '管理员',
      result: '成功'
    });
  }

  function normalizeSchemes(list) {
    return (Array.isArray(list) ? list : []).map(function (raw) {
      var scheme = {
        memberIds: uniqueIds(raw && raw.memberIds),
        rewardType: raw && raw.rewardType,
        singleAmount: raw && raw.singleAmount,
        totalAmount: raw && raw.totalAmount,
        packetTotal: raw && raw.packetTotal,
        packetIssued: raw && raw.packetIssued,
        tiers: raw && raw.tiers,
        budgetUsed: raw && raw.budgetUsed
      };
      applyReward(scheme);
      return scheme;
    });
  }

  function applyDiffRoot(item) {
    var schemes = item.rewardSchemes || [];
    if (!schemes.length) {
      applyReward(item);
      return;
    }
    var min = 0;
    var max = 0;
    var budget = 0;
    var packets = 0;
    var issued = 0;
    schemes.forEach(function (scheme) {
      if (scheme.amountMin > 0 && (!min || scheme.amountMin < min)) min = scheme.amountMin;
      if (scheme.amountMax > max) max = scheme.amountMax;
      budget += Number(scheme.budgetTotal) || 0;
      packets += Number(scheme.packetTotal) || 0;
      issued += Number(scheme.packetIssued) || 0;
    });
    item.rewardType = schemes[0].rewardType;
    item.singleAmount = schemes[0].singleAmount;
    item.totalAmount = schemes[0].totalAmount;
    item.tiers = schemes[0].tiers;
    item.amount = toMoney(min);
    item.amountMin = toMoney(min);
    item.amountMax = toMoney(max || min);
    item.amountMode = min === max ? 'fixed' : 'range';
    item.budgetTotal = toMoney(budget);
    item.packetTotal = Math.max(0, Math.round(packets));
    item.packetIssued = Math.max(0, Math.round(issued));
  }

  function emptyTier() {
    return { amount: 0, amountMin: 0, amountMax: 0, count: 0, expected: 0, probability: 0, issued: 0 };
  }

  function normalizeTier(raw) {
    var t = Object.assign(emptyTier(), raw || {});
    t.amount = toMoney(t.amount);
    t.amountMin = toMoney(t.amountMin);
    t.amountMax = toMoney(t.amountMax);
    if (t.amountMax < t.amountMin) t.amountMax = t.amountMin;
    t.count = Math.max(0, Math.round(Number(t.count) || 0));
    t.expected = toMoney(t.expected);
    t.probability = toMoney(t.probability);
    t.issued = Math.max(0, Math.round(Number(t.issued) || 0));
    return t;
  }

  function isTotalAmountOk(value) {
    return /^[1-9]\d{0,5}$/.test(String(value == null ? '' : value).trim());
  }

  /** 把奖励类型整理成可发放的金额区间和额度，兼容旧的发放金额、发放总额度 */
  function applyReward(item) {
    var type = item.rewardType;
    if (type !== 'fixed' && type !== 'random' && type !== 'custom_fixed' && type !== 'custom_random') {
      if (item.amountMode === 'range') {
        type = 'custom_random';
        var span = toMoney(item.amountMax) >= toMoney(item.amountMin) ? toMoney(item.amountMax) : toMoney(item.amountMin);
        var qty = span > 0 ? Math.max(1, Math.floor(toMoney(item.budgetTotal) / span)) : 0;
        item.tiers = [{ amountMin: item.amountMin, amountMax: item.amountMax, count: qty, expected: 0, probability: 100, issued: 0 }];
      } else {
        type = 'fixed';
        item.singleAmount = item.amount > 0 ? item.amount : item.amountMin;
        var unit = toMoney(item.singleAmount);
        item.packetTotal = unit > 0 ? Math.floor(toMoney(item.budgetTotal) / unit) : 0;
        item.packetIssued = unit > 0 ? Math.min(item.packetTotal, Math.round(toMoney(item.budgetUsed) / unit)) : 0;
      }
    }
    item.rewardType = type;
    item.singleAmount = toMoney(item.singleAmount);
    item.totalAmount = String(item.totalAmount == null ? '' : item.totalAmount).trim();
    item.packetTotal = Math.max(0, Math.round(Number(item.packetTotal) || 0));
    item.packetIssued = Math.max(0, Math.round(Number(item.packetIssued) || 0));
    item.tiers = (Array.isArray(item.tiers) ? item.tiers : []).map(normalizeTier);
    if ((type === 'custom_fixed' || type === 'custom_random') && !item.tiers.length) {
      item.tiers = [emptyTier()];
    }
    var quota = rewardQuota(item);
    item.amount = quota.min;
    item.amountMin = quota.min;
    item.amountMax = quota.max;
    item.amountMode = quota.min === quota.max ? 'fixed' : 'range';
    item.budgetTotal = quota.budgetTotal;
  }

  function rewardQuota(item) {
    var type = item.rewardType;
    if (type === 'fixed') {
      var one = toMoney(item.singleAmount);
      return { min: one, max: one, budgetTotal: toMoney(one * (item.packetTotal || 0)), packetTotal: item.packetTotal || 0 };
    }
    if (type === 'random') {
      var total = isTotalAmountOk(item.totalAmount) ? Number(item.totalAmount) : 0;
      var count = item.packetTotal || 0;
      var avg = count > 0 ? total / count : total;
      return { min: 0.01, max: toMoney(Math.max(0.01, avg * 2)), budgetTotal: total, packetTotal: count };
    }
    var tiers = item.tiers || [];
    if (type === 'custom_fixed') {
      var minF = 0;
      var maxF = 0;
      var money = 0;
      var packets = 0;
      tiers.forEach(function (t) {
        if (!(t.amount > 0) || !(t.count > 0)) return;
        if (!minF || t.amount < minF) minF = t.amount;
        if (t.amount > maxF) maxF = t.amount;
        money += t.amount * t.count;
        packets += t.count;
      });
      return { min: toMoney(minF), max: toMoney(maxF || minF), budgetTotal: toMoney(money), packetTotal: packets };
    }
    var minR = 0;
    var maxR = 0;
    var moneyMax = 0;
    var packetsR = 0;
    tiers.forEach(function (t) {
      if (!(t.amountMax > 0) || !(t.count > 0)) return;
      if (!minR || t.amountMin < minR) minR = t.amountMin;
      if (t.amountMax > maxR) maxR = t.amountMax;
      moneyMax += t.amountMax * t.count;
      packetsR += t.count;
    });
    return { min: toMoney(minR), max: toMoney(maxR || minR), budgetTotal: toMoney(moneyMax), packetTotal: packetsR };
  }

  function amountBounds(item) {
    var it = item && item.rewardType ? item : normalize(item);
    return { min: it.amountMin, max: it.amountMax };
  }

  function moneyText(n) {
    return toMoney(n).toFixed(2);
  }

  function rewardTypeText(item) {
    return REWARD_TYPE_LABEL[item && item.rewardType] || '—';
  }

  function claimTimesText(item) {
    return CLAIM_TIMES_LABEL[item && item.claimTimesMode] || CLAIM_TIMES_LABEL.unlimited;
  }

  function rewardContentText(item) {
    if (!item) return '—';
    var it = item.rewardType ? item : normalize(item);
    if (it.rewardMode === 'diff') {
      var dim = it.memberAudience === 'tag' ? '会员标签' : it.memberAudience === 'segment' ? '会员分群' : '会员等级';
      return '按' + dim + '差异化，共 ' + ((it.rewardSchemes && it.rewardSchemes.length) || 0) + ' 组';
    }
    if (it.rewardType === 'fixed') return '单个金额 ' + moneyText(it.singleAmount) + ' 元，红包总数 ' + (it.packetTotal || 0);
    if (it.rewardType === 'random') return '总计金额 ' + (it.totalAmount || '—') + '，红包总数 ' + (it.packetTotal || 0);
    var sum = rewardSums(it);
    if (it.rewardType === 'custom_random') return '红包总额 ' + moneyText(sum.minMoney) + '-' + moneyText(sum.maxMoney) + '，红包总数 ' + sum.count;
    return '红包总额 ' + moneyText(sum.money) + '，红包总数 ' + sum.count;
  }

  function rewardSums(item) {
    var money = 0;
    var minMoney = 0;
    var maxMoney = 0;
    var count = 0;
    (item.tiers || []).forEach(function (t) {
      count += t.count || 0;
      if (item.rewardType === 'custom_random') {
        minMoney += (t.amountMin || 0) * (t.count || 0);
        maxMoney += (t.amountMax || 0) * (t.count || 0);
      } else {
        money += (t.amount || 0) * (t.count || 0);
      }
    });
    return { money: toMoney(money), minMoney: toMoney(minMoney), maxMoney: toMoney(maxMoney), count: count };
  }

  function schemeBudget(item) {
    var type = item && item.rewardType;
    if (type === 'fixed') {
      var money = toMoney((Number(item.singleAmount) || 0) * (Number(item.packetTotal) || 0));
      return { min: money, max: money, count: Math.max(0, Math.round(Number(item.packetTotal) || 0)) };
    }
    if (type === 'random') {
      var total = isTotalAmountOk(item.totalAmount) ? Number(item.totalAmount) : 0;
      return { min: toMoney(total), max: toMoney(total), count: Math.max(0, Math.round(Number(item.packetTotal) || 0)) };
    }
    var sum = rewardSums(item || {});
    if (type === 'custom_random') return { min: sum.minMoney, max: sum.maxMoney, count: sum.count };
    return { min: sum.money, max: sum.money, count: sum.count };
  }

  function configuredBudget(item) {
    var it = item && (item.rewardMode || item.rewardType) ? item : normalize(item);
    if (it.rewardMode === 'diff') {
      var min = 0;
      var max = 0;
      var count = 0;
      (it.rewardSchemes || []).forEach(function (scheme) {
        var budget = schemeBudget(scheme);
        min += budget.min;
        max += budget.max;
        count += budget.count;
      });
      return { min: toMoney(min), max: toMoney(max), count: count };
    }
    return schemeBudget(it);
  }

  function rewardBudgetText(item) {
    var budget = configuredBudget(item);
    if (budget.min !== budget.max) return moneyText(budget.min) + '-' + moneyText(budget.max);
    return moneyText(budget.min);
  }

  function rewardPacketCountText(item) {
    return String(configuredBudget(item).count || 0);
  }

  function amountText(item) {
    return rewardContentText(item);
  }

  /** 剩余红包个数：红包总数减去已发放个数。自定义金额按各档剩余个数合计 */
  function remainPacketCount(item) {
    if (!item) return 0;
    var it = item.rewardMode || item.rewardType ? item : normalize(item);
    if (it.rewardMode === 'diff') {
      return (it.rewardSchemes || []).reduce(function (sum, scheme) {
        var one = Object.assign({}, scheme, { rewardMode: 'unified' });
        return sum + remainPacketCount(one);
      }, 0);
    }
    if ((it.rewardType === 'custom_fixed' || it.rewardType === 'custom_random') && !(Number(it.packetTotal) > 0)) {
      var left = 0;
      (it.tiers || []).forEach(function (t) {
        left += Math.max(0, Math.round(Number(t.count) || 0) - Math.round(Number(t.issued) || 0));
      });
      return left;
    }
    var total = Math.max(0, Math.round(Number(it.packetTotal) || 0));
    var issued = Math.max(0, Math.round(Number(it.packetIssued) || 0));
    return Math.max(0, total - issued);
  }

  function canGrant(item) {
    var it = item && (item.rewardMode || item.rewardType) ? item : normalize(item);
    if (it.rewardMode === 'diff') {
      return (it.rewardSchemes || []).some(function (scheme) {
        return canGrant(Object.assign({}, scheme, { rewardMode: 'unified' }));
      });
    }
    if (it.rewardType === 'fixed') return it.singleAmount > 0 && it.packetIssued < it.packetTotal;
    if (it.rewardType === 'random') {
      return isTotalAmountOk(it.totalAmount) && it.packetIssued < it.packetTotal && it.budgetUsed < Number(it.totalAmount);
    }
    return (it.tiers || []).some(function (t) {
      return t.count > t.issued && (it.rewardType === 'custom_fixed' ? t.amount > 0 : t.amountMax > 0);
    });
  }

  var lastDrawTier = {};

  function rollAmount(item) {
    var it = item && (item.rewardMode || item.rewardType) ? item : normalize(item);
    if (it.rewardMode === 'diff') {
      var schemes = it.rewardSchemes || [];
      var s;
      for (s = 0; s < schemes.length; s++) {
        var scheme = Object.assign({}, schemes[s], { rewardMode: 'unified', id: it.id });
        if (canGrant(scheme)) return rollAmount(scheme);
      }
      return 0;
    }
    if (!canGrant(it)) return 0;
    if (it.rewardType === 'fixed') return capSingleGrant(it.singleAmount);
    if (it.rewardType === 'random') {
      var leftMoney = Number(it.totalAmount) - it.budgetUsed;
      var leftCount = it.packetTotal - it.packetIssued;
      if (leftCount <= 1) return capSingleGrant(leftMoney);
      var avg = leftMoney / leftCount;
      var amount = avg * (0.5 + Math.random());
      var cap = leftMoney - (leftCount - 1) * 0.01;
      if (amount > cap) amount = cap;
      if (amount < 0.01) amount = 0.01;
      return capSingleGrant(amount);
    }
    var pool = (it.tiers || []).filter(function (t) {
      return t.count > t.issued && t.probability > 0 && (it.rewardType === 'custom_fixed' ? t.amount > 0 : t.amountMax >= t.amountMin && t.amountMax > 0);
    });
    if (!pool.length) return 0;
    var weight = pool.reduce(function (s, t) { return s + t.probability; }, 0);
    var hit = Math.random() * weight;
    var chosen = pool[0];
    var idx = 0;
    for (var i = 0; i < pool.length; i++) {
      hit -= pool[i].probability;
      if (hit <= 0) {
        chosen = pool[i];
        idx = (it.tiers || []).indexOf(pool[i]);
        break;
      }
    }
    lastDrawTier[it.id] = idx;
    if (it.rewardType === 'custom_fixed') return capSingleGrant(chosen.amount);
    if (!(chosen.expected > 0)) {
      var span = chosen.amountMax - chosen.amountMin;
      return capSingleGrant(chosen.amountMin + Math.random() * span);
    }
    var jitter = (chosen.amountMax - chosen.amountMin) * 0.15;
    var value = chosen.expected + (Math.random() * 2 - 1) * jitter;
    if (value < chosen.amountMin) value = chosen.amountMin;
    if (value > chosen.amountMax) value = chosen.amountMax;
    return capSingleGrant(value);
  }

  function dayRangeLabel(days) {
    var n = Math.round(Number(days) || 1);
    if (n === 1) return '1(即今日)';
    return String(n);
  }

  function dayRangeHint(days, claim) {
    var n = Math.round(Number(days) || 0);
    var metric = claim === 'order_count' ? '累计下单笔数' : '累计下单金额';
    if (n === 1) return '表示统计今日的' + metric;
    if (n > 1) return '表示统计近' + n + '日的' + metric;
    return '';
  }

  var MEMBER_TAG_GROUPS = [
    {
      id: 'TG10001',
      name: '活跃度',
      rule: 'multi',
      tags: [
        { id: 'TV10001', name: '高活跃' },
        { id: 'TV10002', name: '中活跃' }
      ]
    },
    {
      id: 'TG10002',
      name: '消费偏好',
      rule: 'multi',
      tags: [
        { id: 'TV10004', name: '储值' },
        { id: 'TV10005', name: '复购' }
      ]
    },
    {
      id: 'TG10003',
      name: '生命周期',
      rule: 'multi',
      tags: [{ id: 'TV10006', name: '新客' }]
    }
  ];

  function memberTagGroups() {
    return MEMBER_TAG_GROUPS;
  }

  function memberSegmentOptions() {
    var fallback = [
      { id: 'AG10001', name: '高价值复购客群' },
      { id: 'AG10002', name: '沉睡唤回-海鲜偏好' }
    ];
    try {
      var raw = localStorage.getItem('mdm_member_segment_list');
      var list = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(list) || !list.length) return fallback;
      var enabled = list.filter(function (it) {
        return it && it.status === '启用' && it.id && it.name;
      });
      return enabled.length
        ? enabled.map(function (it) {
            return { id: String(it.id), name: String(it.name) };
          })
        : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function namesById(ids, options, nameKey) {
    return (ids || []).map(function (id) {
      var found = '';
      options.forEach(function (opt) {
        if (String(opt.id) === String(id)) found = opt[nameKey] || opt.name || id;
      });
      return found || id;
    });
  }

  function memberLevelOptions() {
    var Data = global.MdmMemberLevelData;
    var list = Data && Data.loadLevelList ? Data.loadLevelList() : [];
    return list
      .filter(function (level) {
        return level && level.status !== '禁用';
      })
      .sort(function (a, b) {
        return Number(a.growthValue || 0) - Number(b.growthValue || 0);
      });
  }

  function memberLevelText(item) {
    if (!item) return '—';
    if (item.memberAudience === 'tag') {
      var tags = [];
      memberTagGroups().forEach(function (group) {
        (group.tags || []).forEach(function (tag) {
          tags.push(tag);
        });
      });
      var tagNames = namesById(item.memberTagIds, tags, 'name');
      return tagNames.length ? '标签：' + tagNames.join('、') : '—';
    }
    if (item.memberAudience === 'segment') {
      var segNames = namesById(item.memberSegmentIds, memberSegmentOptions(), 'name');
      return segNames.length ? '分群：' + segNames.join('、') : '—';
    }
    if (item.memberScope !== 'specific') return '全部层级';
    var names = namesById(item.memberLevelIds, memberLevelOptions(), 'name');
    return names.length ? names.join('、') : '—';
  }

  function claimText(item) {
    if (!item || !item.claimCondition || item.claimCondition === 'none') return '无条件';
    if (item.claimCondition === 'register') return '新注册' + (item.registerDays || 0) + '天内用户';
    var day = item.orderDayRange === 1 ? '今日' : '近' + item.orderDayRange + '日';
    if (item.claimCondition === 'order_amount') {
      return '累计下单金额' + toMoney(item.orderAmount).toFixed(2) + '元（' + day + '）';
    }
    if (item.claimCondition === 'order_count' || item.claimCondition === 'order') {
      return '累计下单笔数' + (item.orderCount || 0) + '笔（' + day + '）';
    }
    return '无条件';
  }

  function readClaimDemo() {
    try {
      return localStorage.getItem(CLAIM_DEMO_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function memberRestricted(item) {
    if (!item) return false;
    var audience = item.memberAudience === 'tag' || item.memberAudience === 'segment' ? item.memberAudience : 'level';
    if (audience === 'tag') return !!(item.memberTagIds && item.memberTagIds.length);
    if (audience === 'segment') return !!(item.memberSegmentIds && item.memberSegmentIds.length);
    return item.memberScope === 'specific' && !!(item.memberLevelIds && item.memberLevelIds.length);
  }

  function idHit(have, need) {
    var set = {};
    (have || []).forEach(function (id) {
      set[String(id)] = true;
    });
    var i;
    for (i = 0; i < (need || []).length; i++) {
      if (set[String(need[i])]) return true;
    }
    return false;
  }

  /** 原型未提供会员身份时视为在范围内；显式传入且未命中才拦截 */
  function memberMiss(item, profile) {
    if (!memberRestricted(item)) return false;
    profile = profile || {};
    var audience = item.memberAudience === 'tag' || item.memberAudience === 'segment' ? item.memberAudience : 'level';
    if (audience === 'tag') {
      if (profile.memberTagIds == null) return false;
      return !idHit(profile.memberTagIds, item.memberTagIds);
    }
    if (audience === 'segment') {
      if (profile.memberSegmentIds == null) return false;
      return !idHit(profile.memberSegmentIds, item.memberSegmentIds);
    }
    if (profile.memberLevelId == null && profile.memberLevelIds == null) return false;
    var have = profile.memberLevelIds || [profile.memberLevelId];
    return !idHit(have, item.memberLevelIds);
  }

  /**
   * 未满足领取条件时返回客户端文案，满足或无条件时返回空串。
   * 验收开关写入 CLAIM_DEMO_KEY：register / order_amount / order_count / level / segment / tag。
   * 无限制红包在验收开关打开时也展示对应文案，便于客户端验收；有条件时只拦截被点名的那一项。
   * 未打开开关时，原型用户默认在会员范围内，且满足新注册、下单金额与笔数条件。
   * 会员范围不通过时优先于下单/注册条件。
   */
  function claimDenyMessage(item, profile) {
    item = item || {};
    profile = profile || {};
    var demo = profile.demo != null ? profile.demo : readClaimDemo();
    if (demo === 'audience' || demo === 'level' || demo === 'segment' || demo === 'tag') return MEMBER_DENY_MSG;
    if (demo !== 'register' && demo !== 'order_amount' && demo !== 'order_count' && memberMiss(item, profile)) {
      return MEMBER_DENY_MSG;
    }
    var claim = item.claimCondition || 'none';
    if (claim === 'order') {
      claim = Number(item.orderAmount) > 0 && Number(item.orderCount) < 1 ? 'order_amount' : 'order_count';
    }
    if (demo === 'register' || demo === 'order_amount' || demo === 'order_count') {
      if (claim === 'none' || claim === demo) return CLAIM_DENY_MSG[demo];
    }
    if (claim === 'none') return '';
    if (claim === 'register') {
      var age = profile.registerAgeDays != null ? Number(profile.registerAgeDays) : 0;
      if (age > Number(item.registerDays || 0)) return CLAIM_DENY_MSG.register;
      return '';
    }
    if (claim === 'order_amount') {
      var haveAmt = profile.orderAmount != null ? Number(profile.orderAmount) : 999999;
      if (haveAmt + 0.0001 < Number(item.orderAmount || 0)) return CLAIM_DENY_MSG.order_amount;
      return '';
    }
    if (claim === 'order_count') {
      var haveCnt = profile.orderCount != null ? Number(profile.orderCount) : 999;
      if (haveCnt < Number(item.orderCount || 0)) return CLAIM_DENY_MSG.order_count;
      return '';
    }
    return '';
  }

  function currentMinuteValue() {
    var d = new Date();
    d.setSeconds(0, 0);
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  function activityTimeText(item) {
    if (!item || !item.startAt || !item.endAt) return '—';
    return String(item.startAt).replace('T', ' ') + ' 至 ' + String(item.endAt).replace('T', ' ');
  }

  function portsText(item) {
    var ports = uniquePorts(item && item.ports);
    if (!ports.length) return '—';
    return ports
      .map(function (p) {
        return PORT_LABEL[p] || p;
      })
      .join('、');
  }

  function getAll() {
    ensureLoaded();
    return list.map(function (it) {
      return normalize(it);
    });
  }

  function getById(id) {
    ensureLoaded();
    var idx = findIndex(id);
    return idx < 0 ? null : normalize(list[idx]);
  }

  function listRows(query) {
    var q = query || {};
    var name = String(q.name || '')
      .trim()
      .toLowerCase();
    var status = String(q.status || '').trim();
    var port = String(q.port || '').trim();
    return getAll().filter(function (it) {
      if (name) {
        var hit = String(it.name).toLowerCase().indexOf(name) >= 0 || String(it.id).toLowerCase().indexOf(name) >= 0;
        if (!hit) return false;
      }
      if (status && it.status !== status) return false;
      if (port && it.ports.indexOf(port) < 0) return false;
      return true;
    });
  }

  /** 已启用即可被各模块关联；传入活动领取终端时，只返回覆盖该终端的红包 */
  function listForAssociate(opts) {
    opts = opts || {};
    var port = opts.port === 'app' ? 'app' : opts.port === 'mini' ? 'mini' : '';
    return getAll().filter(function (it) {
      if (it.status !== 'ACTIVE') return false;
      if (port && it.ports.indexOf(port) < 0) return false;
      return true;
    });
  }

  function validate(payload, strict) {
    var item = normalize(payload);
    if (!strict) return { ok: true, item: item };
    if (!item.name) return { ok: false, message: '请填写红包名称' };
    if (item.name.length > 50) return { ok: false, message: '红包名称最多 50 个字符' };
    if (!item.startAt || !item.endAt) return { ok: false, message: '请选择有效时间' };
    var nowMinute = Date.parse(currentMinuteValue());
    if (!(Date.parse(item.startAt) >= nowMinute) || !(Date.parse(item.endAt) >= nowMinute)) {
      return { ok: false, message: '有效时间需选择当前及以后的时间' };
    }
    if (!(Date.parse(item.startAt) < Date.parse(item.endAt))) {
      return { ok: false, message: '结束时间需晚于开始时间' };
    }
    if (!item.ports.length) return { ok: false, message: '请选择活动领取终端' };
    if (item.rewardMode === 'diff') {
      var diffError = validateDiff(item, payload);
      if (diffError) return { ok: false, message: diffError };
    } else {
      var rewardError = validateReward(item, payload);
      if (rewardError) return { ok: false, message: rewardError };
    }
    if (item.claimCondition === 'register' && item.registerDays < 1) {
      return { ok: false, message: '请填写大于 0 的新注册天数' };
    }
    if (item.claimCondition === 'order_count' || item.claimCondition === 'order_amount') {
      if (item.claimCondition === 'order_count' && item.orderCount < 1) {
        return { ok: false, message: '请填写累计下单笔数' };
      }
      if (item.claimCondition === 'order_amount' && !(item.orderAmount > 0)) {
        return { ok: false, message: '请填写累计下单金额' };
      }
      if (!(item.orderDayRange >= 1)) {
        return { ok: false, message: item.orderDayCustom ? '请填写自定义天数' : '请选择累计天数范围' };
      }
    }
    if (item.rewardMode !== 'diff') {
      if (item.memberAudience === 'tag') {
        if (!(item.memberTagIds && item.memberTagIds.length)) return { ok: false, message: '请选择会员标签' };
      } else if (item.memberAudience === 'segment') {
        if (!(item.memberSegmentIds && item.memberSegmentIds.length)) return { ok: false, message: '请选择会员分群' };
      } else if (item.memberScope === 'specific' && !(item.memberLevelIds && item.memberLevelIds.length)) {
        return { ok: false, message: '请选择会员等级' };
      }
    }
    return { ok: true, item: item };
  }

  var REWARD_AMOUNT_MAX = 200;
  var REWARD_AMOUNT_HINT = '单用户单笔金额不得超过200';

  function rewardAmountError(n) {
    var cents = Math.round(toMoney(n) * 100);
    if (!(cents > 0) || cents > REWARD_AMOUNT_MAX * 100) return REWARD_AMOUNT_HINT;
    return '';
  }

  function capSingleGrant(n) {
    var money = toMoney(n);
    if (!(money > 0)) return 0;
    if (money > REWARD_AMOUNT_MAX) return REWARD_AMOUNT_MAX;
    return money;
  }

  function rangesOverlap(a, b) {
    var aMin = Math.round(toMoney(a.amountMin) * 100);
    var aMax = Math.round(toMoney(a.amountMax) * 100);
    var bMin = Math.round(toMoney(b.amountMin) * 100);
    var bMax = Math.round(toMoney(b.amountMax) * 100);
    return aMin <= bMax && bMin <= aMax;
  }

  function rawTierAt(raw, index) {
    var list = raw && Array.isArray(raw.tiers) ? raw.tiers : null;
    return list && list[index] ? list[index] : null;
  }

  function tierAmount(rawTier, itemTier, key) {
    var source = rawTier && rawTier[key] != null && rawTier[key] !== '' ? rawTier[key] : itemTier ? itemTier[key] : 0;
    return toMoney(source);
  }

  function schemeDimName(audience) {
    if (audience === 'tag') return '会员标签';
    if (audience === 'segment') return '会员分群';
    return '会员等级';
  }

  function validateDiff(item, payload) {
    var schemes = item.rewardSchemes || [];
    var rawList = payload && Array.isArray(payload.rewardSchemes) ? payload.rewardSchemes : [];
    var dim = schemeDimName(item.memberAudience);
    if (schemes.length < 2) return '差异化配置至少需要两组' + dim + '奖励';
    var seen = {};
    var i;
    for (i = 0; i < schemes.length; i++) {
      var scheme = schemes[i];
      var title = dim + '方案 ' + (i + 1);
      if (!(scheme.memberIds && scheme.memberIds.length)) return '请为' + title + '选择会员';
      var m;
      for (m = 0; m < scheme.memberIds.length; m++) {
        var mid = scheme.memberIds[m];
        if (seen[mid]) return '同一' + dim + '不能出现在两组奖励里';
        seen[mid] = true;
      }
      var rewardError = validateReward(scheme, rawList[i] || scheme);
      if (rewardError) return title + '：' + rewardError;
    }
    return '';
  }

  function validateReward(item, raw) {
    if (item.rewardType === 'fixed') {
      var fixedError = rewardAmountError(item.singleAmount);
      if (fixedError) return fixedError;
      if (!(item.packetTotal >= 1)) return '请填写红包总数';
      return '';
    }
    if (item.rewardType === 'random') {
      if (!isTotalAmountOk(item.totalAmount)) return '请输入1-6位整数';
      if (!(item.packetTotal >= 1)) return '请填写红包总数';
      var avgCents = Math.round((Number(item.totalAmount) * 100) / item.packetTotal);
      if (avgCents > REWARD_AMOUNT_MAX * 100) return REWARD_AMOUNT_HINT;
      return '';
    }
    var tiers = item.tiers || [];
    if (!tiers.length) return '请至少配置一行红包';
    if (tiers.length > 20) return '最多添加20条';
    var prob = 0;
    var fixedAmounts = {};
    var ranges = [];
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var rawTier = rawTierAt(raw, i);
      var row = '第 ' + (i + 1) + ' 行';
      if (!(t.count >= 1)) return row + '请填写红包数量';
      if (item.rewardType === 'custom_fixed') {
        var amount = tierAmount(rawTier, t, 'amount');
        var amountError = rewardAmountError(amount);
        if (amountError) return amountError;
        var amountKey = String(Math.round(amount * 100));
        if (fixedAmounts[amountKey]) return '红包金额不可重复';
        fixedAmounts[amountKey] = true;
      } else {
        var amountMin = tierAmount(rawTier, t, 'amountMin');
        var amountMax = tierAmount(rawTier, t, 'amountMax');
        var minError = rewardAmountError(amountMin);
        if (minError) return minError;
        var maxError = rewardAmountError(amountMax);
        if (maxError) return maxError;
        if (amountMin > amountMax) return row + '红包金额区间最小值不能大于最大值';
        var expected = tierAmount(rawTier, t, 'expected');
        if (expected > 0 && (expected < amountMin || expected > amountMax)) {
          return '红包金额区间最小值 ≤ 期望奖金 ≤ 红包金额区间最大值';
        }
        ranges.push({ amountMin: amountMin, amountMax: amountMax });
        for (var j = 0; j < ranges.length - 1; j++) {
          if (rangesOverlap(ranges[ranges.length - 1], ranges[j])) return '红包金额区间不得重叠';
        }
      }
      if (t.probability < 0) return row + '中奖概率不能为负数';
      prob += t.probability;
    }
    if (toMoney(prob) !== 100) return '中奖概率合计需为 100%';
    return '';
  }

  function seedAuditLogs(status, time, reason) {
    if (status === 'PENDING') return [];
    return [{
      node: '营销审核',
      reviewer: '审核员小李',
      time: time,
      result: status === 'REJECTED' ? '驳回' : '通过',
      reason: status === 'REJECTED' ? reason || '' : ''
    }];
  }

  function pushAuditRecord(audit, result, reason) {
    if (!audit.auditLogs) audit.auditLogs = [];
    audit.auditLogs.push({
      node: '营销审核',
      reviewer: audit.auditedBy || '审核员小李',
      time: audit.auditedAt || nowStr(),
      result: result,
      reason: String(reason || '').trim().slice(0, 100)
    });
  }

  function seedAudits() {
    var rows = [];
    list.forEach(function (item) {
      if (!item || item.status === 'DRAFT') return;
      var status = item.status === 'PENDING' ? 'PENDING' : item.status === 'REJECTED' ? 'REJECTED' : 'APPROVED';
      var auditedAt = status === 'PENDING' ? '' : item.updatedAt || item.createdAt || '';
      var reason = status === 'REJECTED' ? item.remark || '' : '';
      rows.push({
        id: 'CRAUD-' + item.id,
        templateId: item.id,
        status: status,
        submittedAt: item.createdAt || item.updatedAt || nowStr(),
        submittedBy: '张征',
        auditedAt: auditedAt,
        auditedBy: status === 'PENDING' ? '' : '审核员小李',
        reason: reason,
        auditLogs: seedAuditLogs(status, auditedAt, reason),
        snapshot: clone(item)
      });
    });
    rows.sort(function (a, b) {
      return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
    });
    return rows;
  }

  function findAudit(id) {
    ensureLoaded();
    var sid = String(id || '');
    for (var i = 0; i < audits.length; i++) {
      if (String(audits[i].id) === sid) return audits[i];
    }
    return null;
  }

  function latestAuditOf(templateId, status) {
    var sid = String(templateId || '');
    var found = null;
    audits.forEach(function (row) {
      if (String(row.templateId) !== sid) return;
      if (status && row.status !== status) return;
      if (!found || String(row.submittedAt || '') > String(found.submittedAt || '')) found = row;
    });
    return found;
  }

  function createPendingAudit(item) {
    var audit = {
      id: 'CRAUD-' + item.id + '-' + String(Date.now()).slice(-6),
      templateId: item.id,
      status: 'PENDING',
      submittedAt: item.updatedAt || nowStr(),
      submittedBy: '张征',
      auditedAt: '',
      auditedBy: '',
      reason: '',
      auditLogs: [],
      snapshot: clone(item)
    };
    audits.unshift(audit);
    return audit;
  }

  function listAuditRows(query) {
    ensureLoaded();
    var q = query || {};
    var id = String(q.templateId || '').trim();
    var name = String(q.name || '').trim();
    var rewardType = String(q.rewardType || '');
    var port = String(q.port || '');
    var status = String(q.status || '');
    var auditor = String(q.auditor || '').trim();
    var rows = audits.filter(function (row) {
      var item = row.snapshot || getById(row.templateId) || {};
      if (id && String(item.id || row.templateId || '').indexOf(id) < 0) return false;
      if (name && String(item.name || '').indexOf(name) < 0) return false;
      if (rewardType && item.rewardType !== rewardType) return false;
      if (port && (item.ports || []).indexOf(port) < 0) return false;
      if (status && row.status !== status) return false;
      if (auditor && String(row.auditedBy || '').indexOf(auditor) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) {
      return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
    });
    return rows;
  }

  function saveDraft(payload) {
    ensureLoaded();
    var checked = validate(payload, false);
    var item = checked.item;
    var idx = item.id ? findIndex(item.id) : -1;
    var now = nowStr();
    if (idx < 0) {
      item.id = nextId();
      item.status = 'DRAFT';
      item.createdAt = now;
      item.updatedAt = now;
      item.budgetUsed = 0;
      item.packetIssued = 0;
      list.unshift(item);
      pushLog(item.id, '保存草稿', '创建现金红包模版');
    } else {
      var prev = normalize(list[idx]);
      if (prev.status === 'PENDING' || prev.status === 'ACTIVE') {
        return { ok: false, message: '当前状态不可保存为草稿' };
      }
      var fromDisabled = prev.status === 'DISABLED';
      item.id = prev.id;
      item.status = 'DRAFT';
      item.createdAt = prev.createdAt;
      item.budgetUsed = prev.budgetUsed;
      item.packetIssued = prev.packetIssued;
      item.remark = '';
      item.updatedAt = now;
      list[idx] = item;
      pushLog(
        item.id,
        '保存草稿',
        fromDisabled ? '禁用后编辑保存，需重新审核通过并启用后方有效' : '保存为草稿'
      );
      persist();
      return {
        ok: true,
        item: normalize(item),
        message: fromDisabled ? '已保存。修改后需重新提交审核，审核通过并启用后方有效' : ''
      };
    }
    persist();
    return { ok: true, item: normalize(item) };
  }

  function submit(payload) {
    ensureLoaded();
    var checked = validate(payload, true);
    if (!checked.ok) return checked;
    var item = checked.item;
    var idx = item.id ? findIndex(item.id) : -1;
    var now = nowStr();
    if (idx < 0) {
      item.id = nextId();
      item.createdAt = now;
      item.budgetUsed = 0;
      item.packetIssued = 0;
      item.status = 'PENDING';
      item.remark = '';
      item.updatedAt = now;
      list.unshift(item);
      var createdAudit = createPendingAudit(item);
      pushLog(item.id, '提交审核', '提交现金红包模版，生成审核记录 ' + createdAudit.id);
    } else {
      var prev = normalize(list[idx]);
      if (prev.status === 'PENDING' || prev.status === 'ACTIVE') {
        return { ok: false, message: '当前状态不可提交' };
      }
      var fromDisabled = prev.status === 'DISABLED';
      item.id = prev.id;
      item.createdAt = prev.createdAt;
      item.budgetUsed = prev.budgetUsed;
      item.packetIssued = prev.packetIssued;
      item.status = 'PENDING';
      item.remark = '';
      item.updatedAt = now;
      list[idx] = item;
      var pendingAudit = createPendingAudit(item);
      pushLog(
        item.id,
        '提交审核',
        fromDisabled
          ? '禁用后重新提交审核，审核通过并启用后方有效。审核记录 ' + pendingAudit.id
          : '提交审核，生成审核记录 ' + pendingAudit.id
      );
      persist();
      return {
        ok: true,
        item: normalize(item),
        message: fromDisabled ? '已提交审核。审核通过并启用后方有效' : ''
      };
    }
    persist();
    return { ok: true, item: normalize(item) };
  }

  function cancelAudit(id) {
    ensureLoaded();
    var idx = findIndex(id);
    if (idx < 0) return { ok: false, message: '模版不存在' };
    if (list[idx].status !== 'PENDING') return { ok: false, message: '仅待审核可取消' };
    var pending = latestAuditOf(id, 'PENDING');
    if (pending) {
      pending.status = 'CANCELLED';
      pending.auditedAt = nowStr();
      pending.auditedBy = '张征';
      pushAuditRecord(pending, '取消', '取消审核，回到草稿');
    }
    list[idx].status = 'DRAFT';
    list[idx].updatedAt = nowStr();
    pushLog(id, '取消审核', '回到草稿');
    persist();
    return { ok: true, item: normalize(list[idx]) };
  }

  function approveAudit(auditId, opinion) {
    ensureLoaded();
    var audit = findAudit(auditId);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可通过' };
    var note = String(opinion || '').trim().slice(0, 100);
    audit.status = 'APPROVED';
    audit.auditedAt = nowStr();
    audit.auditedBy = '审核员小李';
    audit.reason = '';
    pushAuditRecord(audit, '通过', note);
    var idx = findIndex(audit.templateId);
    if (idx >= 0 && list[idx].status === 'PENDING') {
      list[idx].status = 'APPROVED';
      list[idx].remark = '';
      list[idx].updatedAt = audit.auditedAt;
      pushLog(audit.templateId, '审核成功', note ? '审核成功：' + note : '审核成功');
    }
    persist();
    return { ok: true, item: idx >= 0 ? normalize(list[idx]) : null, audit: audit };
  }

  function rejectAudit(auditId, reason) {
    ensureLoaded();
    var text = String(reason || '').trim().slice(0, 100);
    if (!text) return { ok: false, message: '请填写驳回原因' };
    var audit = findAudit(auditId);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可驳回' };
    audit.status = 'REJECTED';
    audit.auditedAt = nowStr();
    audit.auditedBy = '审核员小李';
    audit.reason = text;
    pushAuditRecord(audit, '驳回', text);
    var idx = findIndex(audit.templateId);
    if (idx >= 0 && list[idx].status === 'PENDING') {
      list[idx].status = 'REJECTED';
      list[idx].remark = text;
      list[idx].updatedAt = audit.auditedAt;
      pushLog(audit.templateId, '审核失败', text);
    }
    persist();
    return { ok: true, item: idx >= 0 ? normalize(list[idx]) : null, audit: audit };
  }

  function approve(id, opinion) {
    ensureLoaded();
    var pending = latestAuditOf(id, 'PENDING');
    if (pending) return approveAudit(pending.id, opinion);
    var idx = findIndex(id);
    if (idx < 0) return { ok: false, message: '模版不存在' };
    if (list[idx].status !== 'PENDING') return { ok: false, message: '仅待审核可通过' };
    list[idx].status = 'APPROVED';
    list[idx].remark = '';
    list[idx].updatedAt = nowStr();
    pushLog(id, '审核成功', '审核成功');
    persist();
    return { ok: true, item: normalize(list[idx]) };
  }

  function reject(id, reason) {
    ensureLoaded();
    var text = String(reason || '').trim().slice(0, 100);
    if (!text) return { ok: false, message: '请填写驳回原因' };
    var pending = latestAuditOf(id, 'PENDING');
    if (pending) return rejectAudit(pending.id, text);
    var idx = findIndex(id);
    if (idx < 0) return { ok: false, message: '模版不存在' };
    if (list[idx].status !== 'PENDING') return { ok: false, message: '仅待审核可驳回' };
    list[idx].status = 'REJECTED';
    list[idx].remark = text;
    list[idx].updatedAt = nowStr();
    pushLog(id, '审核失败', text);
    persist();
    return { ok: true, item: normalize(list[idx]) };
  }

  function enable(id) {
    ensureLoaded();
    var idx = findIndex(id);
    if (idx < 0) return { ok: false, message: '模版不存在' };
    var st = list[idx].status;
    if (st !== 'APPROVED' && st !== 'DISABLED') return { ok: false, message: '当前状态不可启用' };
    list[idx].status = 'ACTIVE';
    list[idx].updatedAt = nowStr();
    pushLog(id, '启用', '启用后可被注册有礼及其他模块关联');
    persist();
    return { ok: true, item: normalize(list[idx]) };
  }

  function disable(id) {
    ensureLoaded();
    var idx = findIndex(id);
    if (idx < 0) return { ok: false, message: '模版不存在' };
    if (list[idx].status !== 'ACTIVE') return { ok: false, message: '仅启用中可禁用' };
    list[idx].status = 'DISABLED';
    list[idx].updatedAt = nowStr();
    pushLog(id, '禁用', '禁用后不可被新活动关联');
    persist();
    return { ok: true, item: normalize(list[idx]) };
  }

  function addBudgetUsed(id, amount) {
    ensureLoaded();
    var idx = findIndex(id);
    var amt = toMoney(amount);
    if (idx < 0 || amt <= 0) return null;
    list[idx].budgetUsed = toMoney(toMoney(list[idx].budgetUsed) + amt);
    list[idx].packetIssued = Math.max(0, Math.round(Number(list[idx].packetIssued) || 0)) + 1;
    var tierIndex = lastDrawTier[String(id)];
    if (tierIndex != null && Array.isArray(list[idx].tiers) && list[idx].tiers[tierIndex]) {
      list[idx].tiers[tierIndex].issued = Math.max(0, Math.round(Number(list[idx].tiers[tierIndex].issued) || 0)) + 1;
      delete lastDrawTier[String(id)];
    }
    list[idx].updatedAt = nowStr();
    persist();
    return normalize(list[idx]);
  }

  function getLogs(id) {
    ensureLoaded();
    return (logs[String(id || '')] || []).slice();
  }

  global.MdmMarketingCashRedpackTplStore = {
    STORAGE_KEY: STORAGE_KEY,
    STATUS_LABEL: STATUS_LABEL,
    PORT_LABEL: PORT_LABEL,
    SCENE_LABEL: SCENE_LABEL,
    SCENE_OPTIONS: SCENE_OPTIONS,
    TRANSFER_SCENE_DEFAULT: TRANSFER_SCENE_DEFAULT,
    USER_PERCEPTION_DEFAULT: USER_PERCEPTION_DEFAULT,
    AMOUNT_MODE_LABEL: AMOUNT_MODE_LABEL,
    CLAIM_LABEL: CLAIM_LABEL,
    CLAIM_DENY_MSG: CLAIM_DENY_MSG,
    MEMBER_DENY_MSG: MEMBER_DENY_MSG,
    CLAIM_DEMO_KEY: CLAIM_DEMO_KEY,
    claimDenyMessage: claimDenyMessage,
    DAY_RANGE_OPTIONS: DAY_RANGE_OPTIONS,
    dayRangeLabel: dayRangeLabel,
    dayRangeHint: dayRangeHint,
    claimText: claimText,
    memberLevelOptions: memberLevelOptions,
    memberTagGroups: memberTagGroups,
    memberSegmentOptions: memberSegmentOptions,
    memberLevelText: memberLevelText,
    currentMinuteValue: currentMinuteValue,
    activityTimeText: activityTimeText,
    REWARD_TYPE_LABEL: REWARD_TYPE_LABEL,
    rewardTypeText: rewardTypeText,
    claimTimesText: claimTimesText,
    rewardContentText: rewardContentText,
    rewardBudgetText: rewardBudgetText,
    rewardPacketCountText: rewardPacketCountText,
    remainPacketCount: remainPacketCount,
    rewardSums: rewardSums,
    isTotalAmountOk: isTotalAmountOk,
    canGrant: canGrant,
    rollAmount: rollAmount,
    toMoney: toMoney,
    normalize: normalize,
    amountBounds: amountBounds,
    amountText: amountText,
    portsText: portsText,
    statusLabel: function (code) {
      return STATUS_LABEL[code] || code || '—';
    },
    getAll: getAll,
    getById: getById,
    listRows: listRows,
    listForAssociate: listForAssociate,
    listRewardOptions: listRewardOptions,
    listBindOptions: listBindOptions,
    isRewardSelectable: isRewardSelectable,
    rewardBlockReason: rewardBlockReason,
    saveDraft: saveDraft,
    submit: submit,
    cancelAudit: cancelAudit,
    approve: approve,
    reject: reject,
    approveAudit: approveAudit,
    rejectAudit: rejectAudit,
    findAudit: findAudit,
    latestAuditOf: latestAuditOf,
    listAuditRows: listAuditRows,
    auditStatusLabel: function (code) {
      return AUDIT_STATUS_LABEL[code] || code || '—';
    },
    enable: enable,
    disable: disable,
    addBudgetUsed: addBudgetUsed,
    getLogs: getLogs
  };
})(window);
