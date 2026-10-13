/**
 * 营销活动 — 现金红包（总控设置 + 发放明细）
 * Key: mdm_marketing_cash_redpack_v4 / mdm_marketing_cash_redpack_settings_v1
 *
 * 字段对齐微信商家转账：
 * - outBillNo 流水号（商户单号 out_bill_no）
 * - transferBillNo 微信回执单号（微信转账单号 transfer_bill_no）
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_marketing_cash_redpack_v4';
  var SETTINGS_KEY = 'mdm_marketing_cash_redpack_settings_v1';
  /** 旧版明细 key，加载时清理，避免残留旧演示数据 */
  var LEGACY_STORAGE_KEYS = [
    'mdm_marketing_cash_redpack_v1',
    'mdm_marketing_cash_redpack_v2',
    'mdm_marketing_cash_redpack_v3'
  ];

  function purgeLegacyStorage() {
    LEGACY_STORAGE_KEYS.forEach(function (key) {
      try {
        if (localStorage.getItem(key) != null) {
          localStorage.removeItem(key);
        }
      } catch (e) {}
    });
  }

  var STATUS_LABEL = {
    claimed: '领取成功',
    pending: '待领取',
    failed: '发放失败',
    expired: '已过期',
    revoked: '已撤销'
  };

  var SCENE_LABEL = {
    new_register: '新用户注册',
    old_first_download: '老用户下载',
    manual: '手动发放'
  };

  var PORT_LABEL = { mini: '小程序', app: 'APP' };

  function uniquePorts(arr) {
    var out = [];
    (arr || []).forEach(function (p) {
      var v = p === 'app' ? 'app' : p === 'mini' ? 'mini' : '';
      if (v && out.indexOf(v) < 0) out.push(v);
    });
    return out;
  }

  function portsOf(raw) {
    var fromList = uniquePorts(raw && raw.ports);
    if (fromList.length) return fromList;
    if (raw && (raw.port === 'app' || raw.port === 'mini')) return [raw.port];
    return [];
  }

  var ACTIVITY_TYPE_LABEL = {
    register_gift: '注册有礼',
    manual: '手动发放'
  };

  /** 活动类型 → 可选场景（二级联动） */
  var ACTIVITY_SCENES = {
    register_gift: ['new_register', 'old_first_download'],
    manual: ['manual']
  };

  var DEFAULT_SETTINGS = {
    enabled: true,
    expireHours: 24,
    liveLimit: 0,
    dailyMode: 'fixed',
    dailyLimit: 0,
    dailyTiers: [],
    totalLimit: 0,
    totalDayRange: 0
  };

  var SEED = [
    {
      id: 'CR10001',
      outBillNo: 'LFCR20260806091233001',
      transferBillNo: '1330000071100999991182020050700019480001',
      grantedAt: '2026-08-06 09:12:33',
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315',
      userAvatar: '',
      amount: 1,
      activityType: 'register_gift',
      activityId: 'RG10002',
      activityName: 'APP双场景开业礼',
      scene: 'new_register',
      port: 'app',
      status: 'claimed',
      claimAt: '2026-08-06 09:13:01',
      failReason: ''
    },
    {
      id: 'CR10002',
      outBillNo: 'LFCR20260806102208002',
      transferBillNo: '1330000071100999991182020050700019480002',
      grantedAt: '2026-08-06 10:22:08',
      userId: 'U10087',
      userName: '微信用户',
      userPhone: '138****6621',
      userAvatar: '',
      amount: 1.2,
      activityType: 'register_gift',
      activityId: 'RG10001',
      activityName: '小程序新人注册礼',
      scene: 'new_register',
      port: 'mini',
      status: 'claimed',
      claimAt: '2026-08-06 10:22:40',
      failReason: ''
    },
    {
      id: 'CR10003',
      outBillNo: 'LFCR20260806110511003',
      transferBillNo: '1330000071100999991182020050700019480003',
      grantedAt: '2026-08-06 11:05:11',
      userId: 'U10088',
      userName: '老王',
      userPhone: '186****9900',
      userAvatar: '',
      amount: 0.8,
      activityType: 'register_gift',
      activityId: 'RG10002',
      activityName: 'APP双场景开业礼',
      scene: 'old_first_download',
      port: 'app',
      status: 'pending',
      claimAt: '',
      failReason: ''
    },
    {
      id: 'CR10004',
      outBillNo: 'LFCR20260805184055004',
      transferBillNo: '1330000071100999991182020050700019480004',
      grantedAt: '2026-08-05 18:40:55',
      userId: 'U10089',
      userName: '小美',
      userPhone: '177****2233',
      userAvatar: '',
      amount: 2,
      activityType: 'register_gift',
      activityId: 'RG10001',
      activityName: '小程序新人注册礼',
      scene: 'new_register',
      port: 'mini',
      status: 'expired',
      claimAt: '',
      failReason: ''
    },
    {
      id: 'CR10005',
      outBillNo: 'LFCR20260805161802005',
      transferBillNo: '',
      grantedAt: '2026-08-05 16:18:02',
      userId: 'U10090',
      userName: '阿强',
      userPhone: '135****7788',
      userAvatar: '',
      amount: 1.5,
      activityType: 'register_gift',
      activityId: 'RG10002',
      activityName: 'APP双场景开业礼',
      scene: 'new_register',
      port: 'app',
      status: 'failed',
      claimAt: '',
      failReason: '账户余额不足'
    },
    {
      id: 'CR10006',
      outBillNo: 'LFCR20260804200144006',
      transferBillNo: '1330000071100999991182020050700019480006',
      grantedAt: '2026-08-04 20:01:44',
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315',
      userAvatar: '',
      amount: 1,
      activityType: 'register_gift',
      activityId: 'RG10001',
      activityName: '小程序新人注册礼',
      scene: 'new_register',
      port: 'mini',
      status: 'pending',
      claimAt: '',
      failReason: ''
    },
    {
      id: 'CR10007',
      outBillNo: 'LFCR20260720143012007',
      transferBillNo: '1330000071100999991182020050700019480007',
      grantedAt: '2026-07-20 14:30:12',
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315',
      userAvatar: '',
      amount: 0.66,
      activityType: 'register_gift',
      activityId: 'RG10001',
      activityName: '直播福袋红包',
      scene: 'new_register',
      port: 'mini',
      status: 'expired',
      claimAt: '',
      failReason: ''
    },
    {
      id: 'CR10008',
      outBillNo: 'LFCR20260708190540008',
      transferBillNo: '1330000071100999991182020050700019480008',
      grantedAt: '2026-07-08 19:05:40',
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315',
      userAvatar: '',
      amount: 1.5,
      activityType: 'register_gift',
      activityId: 'RG10002',
      activityName: '观看任务红包',
      scene: 'new_register',
      port: 'app',
      status: 'expired',
      claimAt: '',
      failReason: ''
    }
  ];

  var list = [];
  var loaded = false;
  var settingsCache = null;

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

  function toMoney(n) {
    var v = Number(n);
    if (isNaN(v) || v < 0) return 0;
    return Math.round(v * 100) / 100;
  }

  function clampExpireHours(n) {
    var v = Math.round(Number(n));
    if (isNaN(v)) return DEFAULT_SETTINGS.expireHours;
    if (v < 1) return 1;
    if (v > 100) return 100;
    return v;
  }

  function clampClaimCount(n) {
    if (n === '' || n == null) return 0;
    var text = String(n).trim();
    if (!/^\d+$/.test(text)) return null;
    return Math.round(Number(text));
  }

  function normalizeSettings(raw) {
    var s = Object.assign({}, DEFAULT_SETTINGS, raw || {});
    s.enabled = !!s.enabled;
    s.expireHours = clampExpireHours(s.expireHours);
    s.dailyMode = s.dailyMode === 'order_today' ? 'order_today' : 'fixed';
    s.dailyTiers = normalizeDailyTiers(s.dailyTiers);
    ['liveLimit', 'dailyLimit', 'totalLimit'].forEach(function (key) {
      var count = clampClaimCount(s[key]);
      s[key] = count == null ? 0 : count;
    });
    var range = clampClaimCount(s.totalDayRange);
    s.totalDayRange = range == null ? 0 : Math.min(range, 3650);
    return s;
  }

  function normalizeDailyTiers(raw) {
    var list = Array.isArray(raw) ? raw : [];
    var out = [];
    var seen = {};
    list.slice(0, 20).forEach(function (row) {
      if (!row) return;
      var amountText = row.amount == null ? '' : String(row.amount).trim();
      var countText = row.count == null ? '' : String(row.count).trim();
      if (!amountText && !countText) return;
      var amount = toMoney(amountText);
      if (!(amount > 0)) return;
      var count = clampClaimCount(countText === '' ? 0 : countText);
      if (count == null) count = 0;
      var key = String(Math.round(amount * 100));
      if (seen[key]) return;
      seen[key] = true;
      out.push({ amount: amount, count: count });
    });
    out.sort(function (a, b) {
      return a.amount - b.amount;
    });
    return out;
  }

  function matchDailyTier(tiers, orderAmount) {
    var money = toMoney(orderAmount);
    var hit = null;
    (tiers || []).forEach(function (tier) {
      if (money + 0.0001 < tier.amount) return;
      if (!hit || tier.amount > hit.amount) hit = tier;
    });
    return hit;
  }

  /** 总次数累计窗口。0 为注册至今；大于 0 为含今日在内的近 N 日 */
  function inTotalWindow(at, days) {
    var n = Math.round(Number(days) || 0);
    if (!(n > 0)) return true;
    var t = parseLocal(at);
    if (t == null) return false;
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (n - 1));
    return t >= start.getTime();
  }

  /**
   * 领取触顶文案。多项剩余同时为 0 时按此顺序取第一条：
   * 单场次、平台累计、单个红包、每日。
   * 手动派发不走这些限制。
   */
  var LIMIT_MSG = {
    live: '领取失败，该场次红包已达上限！',
    total: '领取失败，您已达平台领取上限！',
    packet: '领取失败，该红包已达领取上限！',
    daily: '领取失败，您今日领取已达上限！'
  };
  var LIMIT_ORDER = ['live', 'total', 'packet', 'daily'];
  var CLAIM_LEDGER_KEY = 'ua_live_cash_claim_ledger_v1';

  function readClaimLedger() {
    try {
      var data = JSON.parse(localStorage.getItem(CLAIM_LEDGER_KEY) || 'null');
      if (data && Array.isArray(data.items)) return data.items;
    } catch (e) {}
    return [];
  }

  function currentClientUserId() {
    try {
      var raw = localStorage.getItem('ua_user_session_v1');
      var session = raw ? JSON.parse(raw) : null;
      if (session && (session.userId || session.id)) return String(session.userId || session.id);
    } catch (e) {}
    return 'U10086';
  }

  /** 当日已支付订单金额，供「当日下单」档位匹配。未传金额时由领取判断自行读取。 */
  function todayPaidAmount() {
    var api = global.UaOrdersStore;
    if (!api || typeof api.list !== 'function') return 0;
    var today = todayKey();
    var sum = 0;
    api.list().forEach(function (order) {
      if (!order) return;
      var status = String(order.status || '');
      if (status === 'unpaid' || status === 'closed' || status === 'cancelled') return;
      if (dayKey(order.paidAt) !== today) return;
      sum += Number(order.payable) || 0;
    });
    return Math.round(sum * 100) / 100;
  }

  /**
   * 手动派发、签到、观看任务的现金红包不占领取次数，也不受次数上限拦截。
   * 识别活动类型和来源，避免前后端各写一套。
   */
  function claimLimitExempt(ctx) {
    ctx = ctx || {};
    if (ctx.manual || ctx.limitExempt || ctx.exempt) return true;
    var type = String(ctx.activityType || '').toLowerCase();
    if (
      type === 'manual' ||
      type === 'sign' ||
      type === 'signin' ||
      type === 'sign_in' ||
      type === 'watch' ||
      type === 'watch_task' ||
      type === 'task'
    ) {
      return true;
    }
    var source = String(ctx.source || '');
    return source === '签到' || source === '观看任务';
  }

  /**
   * 活动领取剩余次数。
   * 取总次数、每日限领（满足条件的对应档）、每场直播、单个红包的剩余最小值。
   * 单项配置 0 表示不限制，不参与最小值。每场直播只在直播场次内参与。
   * 当日下单：按当日下单金额匹配已达到的最高档；未达到任一档则该档剩余为 0。档次数填 0 表示该档不限制。
   * 总次数窗口：totalDayRange 为 0 统计注册至今，大于 0 统计近 N 日。
   * 剩余为 0 时按触顶项返回文案。手动派发、签到、观看任务不限制。
   */
  function activityClaimRemain(ctx) {
    ctx = ctx || {};
    if (claimLimitExempt(ctx)) {
      return { limited: false, remain: null, reason: '', message: '' };
    }
    var s = getSettings();
    var hits = [];
    function add(reason, remain) {
      hits.push({ reason: reason, remain: Math.max(0, remain) });
    }
    if (ctx.inLive && s.liveLimit > 0) {
      add('live', s.liveLimit - Math.max(0, Math.round(Number(ctx.usedLive) || 0)));
    }
    var orderAmount = ctx.orderAmountToday;
    if (orderAmount == null || orderAmount === '') orderAmount = todayPaidAmount();
    if (s.dailyMode === 'order_today') {
      var dailyTiers = s.dailyTiers || [];
      if (dailyTiers.length) {
        var matched = matchDailyTier(dailyTiers, orderAmount);
        if (!matched) add('daily', 0);
        else if (matched.count > 0) {
          add('daily', matched.count - Math.max(0, Math.round(Number(ctx.usedToday) || 0)));
        }
      }
    } else if (s.dailyLimit > 0) {
      add('daily', s.dailyLimit - Math.max(0, Math.round(Number(ctx.usedToday) || 0)));
    }
    if (s.totalLimit > 0) {
      add('total', s.totalLimit - Math.max(0, Math.round(Number(ctx.usedTotal) || 0)));
    }
    var packetLimit = Math.max(0, Math.round(Number(ctx.packetLimit) || 0));
    if (packetLimit > 0) {
      add('packet', packetLimit - Math.max(0, Math.round(Number(ctx.usedPacket) || 0)));
    }
    if (ctx.templateOnce) {
      add('packet', 1 - Math.max(0, Math.round(Number(ctx.usedTemplate) || 0)));
    }
    if (!hits.length) return { limited: false, remain: null, reason: '', message: '' };
    var remain = hits[0].remain;
    hits.forEach(function (hit) {
      if (hit.remain < remain) remain = hit.remain;
    });
    if (remain > 0) return { limited: true, remain: remain, reason: '', message: '' };
    var reason = '';
    LIMIT_ORDER.forEach(function (key) {
      if (reason) return;
      hits.forEach(function (hit) {
        if (!reason && hit.reason === key && hit.remain === 0) reason = key;
      });
    });
    if (!LIMIT_MSG[reason]) reason = 'daily';
    return { limited: true, remain: 0, reason: reason, message: LIMIT_MSG[reason] };
  }

  function activityClaimRemainForRecord(record) {
    var item = record || {};
    if (claimLimitExempt(item)) return activityClaimRemain(item);
    ensureLoaded();
    var userId = String(item.userId || '');
    var liveId = String(item.liveId || item.sessionId || '');
    var packetId = String(item.packetId || '');
    var templateId = String(item.templateId || '');
    var today = todayKey();
    var totalDays = getSettings().totalDayRange;
    var usedTotal = 0;
    var usedToday = 0;
    var usedLive = 0;
    var usedPacket = 0;
    var usedTemplate = 0;
    var seen = {};
    function addUse(id, at, rowLive, rowPacket, rowTemplate) {
      var key = String(id || at || '');
      if (!key || seen[key]) return;
      seen[key] = true;
      if (inTotalWindow(at, totalDays)) usedTotal += 1;
      if (dayKey(at) === today) usedToday += 1;
      if (liveId && String(rowLive || '') === liveId) usedLive += 1;
      if (packetId && String(rowPacket || '') === packetId) usedPacket += 1;
      if (templateId && String(rowTemplate || '') === templateId) usedTemplate += 1;
    }
    list.forEach(function (it) {
      if (!it || claimLimitExempt(it) || it.status !== 'claimed') return;
      if (String(it.id) === String(item.id)) return;
      if (userId && String(it.userId || '') !== userId) return;
      addUse(it.id, it.claimAt || it.grantedAt, it.liveId, it.packetId, it.templateId);
    });
    if (!userId || userId === currentClientUserId()) {
      readClaimLedger().forEach(function (it) {
        if (!it || it.manual || it.exempt || claimLimitExempt(it)) return;
        addUse(it.id, it.at, it.sessionId, it.packetId, it.templateId);
      });
    }
    var packetLimit = Math.max(0, Math.round(Number(item.perUserLimit) || 0));
    var templateOnce = item.claimTimesMode === 'per_user';
    var tplStore = global.MdmMarketingCashRedpackTplStore;
    if (!templateOnce && templateId && tplStore && typeof tplStore.getById === 'function') {
      var tpl = tplStore.getById(templateId);
      if (tpl && tpl.claimTimesMode === 'per_user') templateOnce = true;
    }
    return activityClaimRemain({
      activityType: item.activityType,
      inLive: !!liveId,
      orderAmountToday: item.orderAmountToday,
      usedTotal: usedTotal,
      usedToday: usedToday,
      usedLive: usedLive,
      usedPacket: usedPacket,
      packetLimit: packetLimit,
      usedTemplate: usedTemplate,
      templateOnce: templateOnce
    });
  }

  function getSettings() {
    if (settingsCache) return Object.assign({}, settingsCache);
    var data = Object.assign({}, DEFAULT_SETTINGS);
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) data = Object.assign(data, JSON.parse(raw));
    } catch (e) {}
    settingsCache = normalizeSettings(data);
    return Object.assign({}, settingsCache);
  }

  function saveSettings( partial) {
    var next = normalizeSettings(Object.assign({}, getSettings(), partial || {}));
    settingsCache = next;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (e) {}
    return Object.assign({}, next);
  }

  function isEnabled() {
    return !!getSettings().enabled;
  }

  function genOutBillNo() {
    var d = new Date();
    var stamp =
      d.getFullYear() +
      pad2(d.getMonth() + 1) +
      pad2(d.getDate()) +
      pad2(d.getHours()) +
      pad2(d.getMinutes()) +
      pad2(d.getSeconds());
    var rand = String(Math.floor(Math.random() * 9000) + 1000);
    return 'LFCR' + stamp + rand;
  }

  /** 演示用微信转账单号（transfer_bill_no） */
  function genTransferBillNo() {
    var tail = String(Date.now()).slice(-10) + String(Math.floor(Math.random() * 9000) + 1000);
    return '133000007110099999118' + tail;
  }

  function normalizeItem(raw) {
    var item = Object.assign({}, raw || {});
    item.id = String(item.id || '');
    item.outBillNo = String(item.outBillNo || item.merchantBillNo || '').trim();
    item.transferBillNo = String(item.transferBillNo || item.wxTransferBillNo || '').trim();
    item.grantedAt = String(item.grantedAt || '').trim();
    item.userId = String(item.userId || '').trim() || '—';
    item.userName = String(item.userName || '').trim() || '用户';
    item.userPhone = String(item.userPhone || '').trim() || '—';
    item.userAvatar = String(item.userAvatar || '').trim();
    item.amount = toMoney(item.amount);
    item.activityType = String(item.activityType || 'register_gift').trim() || 'register_gift';
    if (!ACTIVITY_TYPE_LABEL[item.activityType]) item.activityType = 'register_gift';
    item.activityId = String(item.activityId || '');
    item.activityName = String(item.activityName || '').trim() || '—';
    if (item.frontRemark == null) item.frontRemark = DEMO_FRONT_REMARK[item.id] || '';
    else item.frontRemark = String(item.frontRemark).trim();
    if (item.activityType === 'manual') item.scene = 'manual';
    else if (item.scene !== 'old_first_download') item.scene = 'new_register';
    var explicitPorts = portsOf(item);
    if (item.activityType === 'manual' || explicitPorts.length) {
      var ports = portsOf(item);
      if (!ports.length) ports = ['mini'];
      item.ports = ports;
      var claimPort = item.claimPort === 'app' || item.claimPort === 'mini' ? item.claimPort : '';
      if (!claimPort && item.status === 'claimed' && ports.length === 1) claimPort = ports[0];
      item.claimPort = claimPort;
      item.port = claimPort || (ports.length === 1 ? ports[0] : '');
    } else {
      item.port = item.port === 'app' ? 'app' : 'mini';
      item.ports = [item.port];
      item.claimPort = item.status === 'claimed' ? item.port : '';
    }
    var st = String(item.status || 'pending');
    if (st === 'claimed' || st === 'success') st = 'claimed';
    if (!STATUS_LABEL[st]) st = 'pending';
    item.status = st;
    item.claimAt = String(item.claimAt || '').trim();
    item.failReason = String(item.failReason || '').trim();
    item.revokeAt = String(item.revokeAt || '').trim();
    if (!item.outBillNo && item.id) {
      item.outBillNo = 'LFCR' + String(item.id).replace(/\D/g, '') + '0000';
    }
    return item;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  /** 已有本地明细时只补本页需要的已过期演示单，避免把删掉的种子数据加回来 */
  var DEMO_EXPIRED_IDS = { CR10007: true, CR10008: true };

  function mergeMissingSeed() {
    var ids = {};
    list.forEach(function (it) {
      if (it && it.id) ids[String(it.id)] = true;
    });
    var added = false;
    SEED.forEach(function (row) {
      if (!row || !row.id || !DEMO_EXPIRED_IDS[String(row.id)] || ids[String(row.id)]) return;
      list.push(normalizeItem(row));
      added = true;
    });
    if (added) persist();
  }

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    purgeLegacyStorage();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          list = parsed.map(normalizeItem);
          mergeMissingSeed();
          return;
        }
      }
    } catch (e) {}
    list = SEED.map(normalizeItem);
    persist();
  }

  function getAll() {
    ensureLoaded();
    return list.map(normalizeItem).sort(function (a, b) {
      return String(b.grantedAt).localeCompare(String(a.grantedAt));
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
    return 'CR' + String(max + 1);
  }

  function addRecord(payload) {
    ensureLoaded();
    var item = normalizeItem(payload);
    if (!item.id) item.id = nextId();
    if (!item.grantedAt) item.grantedAt = formatNow();
    if (!item.outBillNo) item.outBillNo = genOutBillNo();
    if (!item.userId || item.userId === '—') {
      item.userId = 'U' + String(10000 + Math.floor(Math.random() * 90000));
    }
    if (!item.activityType) item.activityType = 'register_gift';
    list.unshift(item);
    persist();
    return item;
  }

  function updateStatus(id, status, extra) {
    ensureLoaded();
    var sid = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) !== sid) continue;
      list[i].status = STATUS_LABEL[status] ? status : list[i].status;
      if (extra && typeof extra === 'object') {
        Object.keys(extra).forEach(function (k) {
          list[i][k] = extra[k];
        });
      }
      if (status === 'claimed' && !list[i].claimAt) {
        list[i].claimAt = formatNow();
      }
      if (status === 'revoked' && !list[i].revokeAt) {
        list[i].revokeAt = formatNow();
      }
      persist();
      return normalizeItem(list[i]);
    }
    return null;
  }

  function revokeRecord(id) {
    return updateStatus(id, 'revoked');
  }

  /**
   * 模拟微信商家转账发放：
   * - 成功：待领取 + 写入微信回执单号
   * - 失败：发放失败（无微信回执单号）
   * 重新发放时更换商户单号（对齐微信：失败确认后换单重试）
   */
  function dispatchTransfer(id, opts) {
    opts = opts || {};
    ensureLoaded();
    var sid = String(id || '');
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === sid) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return { ok: false, message: '红包记录不存在' };

    var cur = list[idx];
    if (cur.status === 'claimed') {
      return { ok: false, message: '红包已领取', record: normalizeItem(cur) };
    }
    if (cur.status === 'revoked' || cur.status === 'expired') {
      return { ok: false, message: '红包已失效，无法发放', record: normalizeItem(cur) };
    }

    var renewOutBill = !!opts.renewOutBillNo || cur.status === 'failed' || !cur.outBillNo;
    if (renewOutBill) cur.outBillNo = genOutBillNo();
    if (!cur.grantedAt) cur.grantedAt = formatNow();

    if (opts.insufficient) {
      cur.status = 'failed';
      cur.transferBillNo = '';
      cur.failReason = opts.failReason || '账户余额不足';
      cur.claimAt = '';
      persist();
      return {
        ok: false,
        late: true,
        insufficient: true,
        message: '您来晚了，红包已经发放完毕',
        record: normalizeItem(cur)
      };
    }

    cur.status = 'pending';
    cur.transferBillNo = genTransferBillNo();
    cur.failReason = '';
    cur.claimAt = '';
    persist();
    return {
      ok: true,
      message: '红包发放成功',
      record: normalizeItem(cur)
    };
  }

  /** B 端：发放失败后重新发放 */
  function redispatchRecord(id, opts) {
    return dispatchTransfer(id, Object.assign({ renewOutBillNo: true }, opts || {}));
  }

  function parseLocal(dt) {
    if (dt == null || dt === '') return null;
    if (typeof dt === 'number') return isFinite(dt) ? dt : null;
    var s = String(dt).trim();
    if (/^\d{13}$/.test(s)) return Number(s);
    s = s.replace(' ', 'T');
    var t = Date.parse(s);
    return isNaN(t) ? null : t;
  }

  function dayKey(dt) {
    var t = parseLocal(dt);
    if (t == null) return '';
    var d = new Date(t);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function filterList(query) {
    ensureLoaded();
    var q = query || {};
    var keyword = String(q.keyword || q.user || '')
      .trim()
      .toLowerCase();
    var status = String(q.status || '').trim();
    var port = String(q.port || '').trim();
    var scene = String(q.scene || '').trim();
    var activityType = String(q.activityType || q.activity || '').trim();
    var activityId = String(q.activityId || '')
      .trim()
      .toLowerCase();
    var timeStart = String(q.timeStart || '').trim();
    var timeEnd = String(q.timeEnd || '').trim();
    var outBillNo = String(q.outBillNo || q.merchantBillNo || '')
      .trim()
      .toLowerCase();
    var transferBillNo = String(q.transferBillNo || q.wxTransferBillNo || '')
      .trim()
      .toLowerCase();
    var amountMin = q.amountMin !== '' && q.amountMin != null ? Number(q.amountMin) : null;
    var amountMax = q.amountMax !== '' && q.amountMax != null ? Number(q.amountMax) : null;
    if (amountMin != null && isNaN(amountMin)) amountMin = null;
    if (amountMax != null && isNaN(amountMax)) amountMax = null;
    var fStart = parseLocal(timeStart);
    var fEnd = parseLocal(timeEnd);

    return getAll().filter(function (it) {
      if (keyword) {
        var hay = (
          it.userId +
          ' ' +
          it.userName +
          ' ' +
          it.userPhone +
          ' ' +
          it.activityName +
          ' ' +
          it.activityId +
          ' ' +
          it.id
        ).toLowerCase();
        if (hay.indexOf(keyword) < 0) return false;
      }
      if (outBillNo && String(it.outBillNo || '').toLowerCase().indexOf(outBillNo) < 0) {
        return false;
      }
      if (
        transferBillNo &&
        String(it.transferBillNo || '').toLowerCase().indexOf(transferBillNo) < 0
      ) {
        return false;
      }
      if (status && it.status !== status) return false;
      if (port && !matchesClaimPort(it, port)) return false;
      if (scene && it.scene !== scene) return false;
      if (activityType && it.activityType !== activityType) return false;
      if (activityId && String(it.activityId || '').toLowerCase().indexOf(activityId) < 0) {
        return false;
      }
      if (amountMin != null && it.amount < amountMin) return false;
      if (amountMax != null && it.amount > amountMax) return false;
      var t = parseLocal(it.grantedAt);
      if (fStart != null && (t == null || t < fStart)) return false;
      if (fEnd != null && (t == null || t > fEnd)) return false;
      return true;
    });
  }

  /** 统计：发放总额 / 发放用户数 / 触发活动数（不含已撤销） */
  function calcStats(rows) {
    var amount = 0;
    var users = {};
    var acts = {};
    (rows || []).forEach(function (it) {
      if (it.status === 'revoked') return;
      amount += Number(it.amount) || 0;
      if (it.userId && it.userId !== '—') users[it.userId] = true;
      else users[it.userName + '|' + it.userPhone] = true;
      if (it.activityId) acts[it.activityId] = true;
    });
    return {
      amount: Math.round(amount * 100) / 100,
      userCount: Object.keys(users).length,
      activityCount: Object.keys(acts).length
    };
  }

  function getHomeStats() {
    var all = getAll();
    var today = todayKey();
    var todayRows = all.filter(function (it) {
      return dayKey(it.grantedAt) === today;
    });
    return {
      today: calcStats(todayRows),
      total: calcStats(all)
    };
  }

  /** 发放活动入口（后续有活动支持红包时在此扩展） */
  function getGrantActivities() {
    return [
      {
        type: 'register_gift',
        name: '现金红包',
        desc: '创建现金红包模版，启用后可被注册有礼及其他模块关联',
        href: 'mdm_marketing_cash_redpack_tpl.html'
      },
      {
        type: 'manual',
        name: '手动派发红包',
        desc: '按同一金额批量勾选用户发放，到账后为待领取',
        href: 'mdm_marketing_cash_redpack_manual.html'
      }
    ];
  }

  function scenesForActivity(activityType) {
    var key = String(activityType || '').trim();
    if (key && ACTIVITY_SCENES[key]) return ACTIVITY_SCENES[key].slice();
    var all = {};
    Object.keys(ACTIVITY_SCENES).forEach(function (k) {
      ACTIVITY_SCENES[k].forEach(function (s) {
        all[s] = true;
      });
    });
    return Object.keys(all);
  }

  function statusLabel(code) {
    return STATUS_LABEL[code] || code || '—';
  }

  function sceneLabel(scene) {
    return SCENE_LABEL[scene] || scene || '—';
  }

  function portLabel(port) {
    return PORT_LABEL[port] || port || '—';
  }

  function portsLabel(ports) {
    var list = uniquePorts(ports);
    if (!list.length) return '—';
    return list.map(portLabel).join('、');
  }

  function batchPorts(batch) {
    var ports = portsOf(batch);
    return ports.length ? ports : ['mini'];
  }

  function allowedPorts(item) {
    var ports = portsOf(item);
    return ports.length ? ports : [];
  }

  function recordAllowsPort(item, port) {
    var p = port === 'app' ? 'app' : port === 'mini' ? 'mini' : '';
    if (!p) return false;
    return allowedPorts(item).indexOf(p) >= 0;
  }

  function matchesClaimPort(item, port) {
    if (!port) return true;
    if (item && item.status === 'claimed') return (item.claimPort || item.port) === port;
    return recordAllowsPort(item, port);
  }

  function claimPortText(item) {
    if (!item) return '—';
    if (item.status === 'claimed') return portLabel(item.claimPort || item.port);
    var ports = allowedPorts(item);
    if (!ports.length) return portLabel(item.port);
    return portsLabel(ports);
  }

  function activityTypeLabel(type) {
    return ACTIVITY_TYPE_LABEL[type] || type || '—';
  }

  var BATCH_KEY = 'mdm_marketing_cash_redpack_batches_v1';
  var BATCH_STATUS_LABEL = {
    scheduled: '待触发',
    granting: '发放中',
    done: '已完成',
    failed: '发放失败',
    partial: '部分失败'
  };
  var batches = [];
  var batchesLoaded = false;

  var SEED_BATCHES = [
    {
      id: 'MF2026092001',
      name: '会员补偿红包',
      port: 'app',
      amount: 2,
      createdAt: '2026-09-20 11:06:18',
      finishedAt: '2026-09-20 11:06:21',
      status: 'done',
      creator: '张运营',
      mode: 'single',
      frontRemark: '会员日补偿',
      backRemark: '会员补偿'
    },
    {
      id: 'MF2026100102',
      name: '小程序回访红包',
      port: 'mini',
      amount: 1.5,
      createdAt: '2026-10-01 09:30:00',
      finishedAt: '2026-10-01 09:30:04',
      status: 'done',
      creator: '李增长',
      mode: 'single'
    },
    {
      id: 'MF2026100703',
      name: '双端补偿红包',
      ports: ['mini', 'app'],
      createdAt: '2026-10-07 10:00:00',
      finishedAt: '2026-10-07 10:00:02',
      status: 'done',
      creator: '王活动',
      mode: 'single',
      frontRemark: '双端补差'
    }
  ];

  var SEED_BATCH_RECORDS = [
    {
      id: 'CR91001',
      outBillNo: 'LFCR20260920110618001',
      transferBillNo: '133000007110099999118202609200001',
      grantedAt: '2026-09-20 11:06:18',
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315',
      amount: 2,
      activityType: 'manual',
      activityId: 'MF2026092001',
      activityName: '会员补偿红包',
      frontRemark: '会员日补偿',
      scene: 'manual',
      port: 'app',
      status: 'claimed',
      claimAt: '2026-09-20 11:20:06'
    },
    {
      id: 'CR91002',
      outBillNo: 'LFCR20260920110618002',
      transferBillNo: '133000007110099999118202609200002',
      grantedAt: '2026-09-20 11:06:18',
      userId: 'U10002',
      userName: 'APP会员B',
      userPhone: '139****9033',
      amount: 8,
      activityType: 'manual',
      activityId: 'MF2026092001',
      activityName: '会员补偿红包',
      scene: 'manual',
      port: 'app',
      status: 'pending'
    },
    {
      id: 'CR91003',
      outBillNo: 'LFCR20261001093000003',
      transferBillNo: '133000007110099999118202610010003',
      grantedAt: '2026-10-01 09:30:00',
      userId: 'U10001',
      userName: '小程序用户A',
      userPhone: '138****2211',
      amount: 1.5,
      activityType: 'manual',
      activityId: 'MF2026100102',
      activityName: '小程序回访红包',
      scene: 'manual',
      port: 'mini',
      status: 'pending'
    },
    {
      id: 'CR91004',
      outBillNo: 'LFCR20261001093000004',
      transferBillNo: '133000007110099999118202610010004',
      grantedAt: '2026-10-01 09:30:00',
      userId: 'U10006',
      userName: '演示会员6',
      userPhone: '136****6606',
      amount: 3,
      activityType: 'manual',
      activityId: 'MF2026100102',
      activityName: '小程序回访红包',
      scene: 'manual',
      port: 'mini',
      status: 'claimed',
      claimAt: '2026-10-01 12:08:44'
    },
    {
      id: 'CR91005',
      outBillNo: 'LFCR20261007100000005',
      transferBillNo: '133000007110099999118202610070005',
      grantedAt: '2026-10-07 10:00:00',
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315',
      amount: 1.2,
      activityType: 'manual',
      activityId: 'MF2026100703',
      activityName: '双端补偿红包',
      frontRemark: '双端补差',
      scene: 'manual',
      ports: ['mini', 'app'],
      port: '',
      status: 'pending'
    }
  ];

  var DEMO_FRONT_REMARK = {
    CR91001: '会员日补偿',
    CR91005: '双端补差'
  };

  var DEMO_BATCH_FRONT_REMARK = {
    MF2026092001: '会员日补偿',
    MF2026100703: '双端补差'
  };

  function persistBatches() {
    try {
      localStorage.setItem(BATCH_KEY, JSON.stringify(batches));
    } catch (e) {}
  }

  function batchStatusOf(rows, stored) {
    if (!rows.length) return stored || 'done';
    var failed = rows.filter(function (r) {
      return r.status === 'failed';
    }).length;
    if (failed && failed === rows.length) return 'failed';
    if (failed) return 'partial';
    if (stored === 'granting') return 'granting';
    return 'done';
  }

  function absorbOrphanBatches() {
    var known = {};
    batches.forEach(function (b) {
      known[b.id] = true;
    });
    var groups = {};
    getAll().forEach(function (it) {
      if (it.activityType !== 'manual' || !it.activityId || known[it.activityId]) return;
      if (!groups[it.activityId]) groups[it.activityId] = [];
      groups[it.activityId].push(it);
    });
    var changed = false;
    Object.keys(groups).forEach(function (id) {
      var rows = groups[id].slice().sort(function (a, b) {
        return String(a.grantedAt).localeCompare(String(b.grantedAt));
      });
      var first = rows[0];
      var status = batchStatusOf(rows, 'done');
      batches.push({
        id: id,
        name: first.activityName && first.activityName !== '—' ? first.activityName : '手动发放红包',
        ports: portsOf(first).length ? portsOf(first) : ['mini'],
        createdAt: first.grantedAt,
        finishedAt: status === 'granting' ? '' : rows[rows.length - 1].grantedAt,
        status: status,
        creator: '演示运营'
      });
      changed = true;
    });
    if (changed) persistBatches();
  }

  function ensureBatches() {
    if (batchesLoaded) return;
    batchesLoaded = true;
    ensureLoaded();
    var hasStored = false;
    try {
      var raw = localStorage.getItem(BATCH_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          batches = parsed;
          hasStored = true;
        }
      }
    } catch (e) {}
    if (!hasStored) {
      batches = SEED_BATCHES.map(function (b) {
        return Object.assign({}, b);
      });
      SEED_BATCH_RECORDS.forEach(function (row) {
        if (!getById(row.id)) list.unshift(normalizeItem(row));
      });
      persist();
      persistBatches();
    }
    absorbOrphanBatches();
    patchSeedDemoAmounts();
    ensureDualPortDemo();
    ensureSeedCreators();
    ensureSeedModes();
    ensureSeedFrontRemarks();
    ensureManualStatusDemos();
    ensureClaimableDemos();
  }

  /** 演示账号多留几笔待领取的手动派发，小程序和 APP 都能领 */
  function ensureClaimableDemos() {
    var user = {
      userId: 'U10086',
      userName: '宁静致远',
      userPhone: '159****4315'
    };
    function row(id, bill, at, amount, name, remark) {
      return Object.assign({}, user, {
        id: id,
        outBillNo: bill,
        transferBillNo: '',
        grantedAt: at,
        amount: amount,
        activityType: 'manual',
        activityId: 'MF2026101408',
        activityName: name,
        frontRemark: remark,
        scene: 'manual',
        ports: ['mini', 'app'],
        port: '',
        status: 'pending',
        claimAt: ''
      });
    }
    var emptyIdx = -1;
    batches.forEach(function (batch, index) {
      if (batch.id === 'MF2026101401') emptyIdx = index;
    });
    if (emptyIdx >= 0) {
      batches.splice(emptyIdx, 1);
      persistBatches();
    }
    pushDemoBatch(
      {
        id: 'MF2026101408',
        name: '会员关怀补发',
        ports: ['mini', 'app'],
        createdAt: '2026-10-14 08:00:00',
        finishedAt: '2026-10-14 08:00:08',
        status: 'done',
        creator: '王活动',
        mode: 'single',
        frontRemark: '关怀补发',
        backRemark: '待用户领取'
      },
      [
        row('CR91051', 'LFCR20261014081206051', '2026-10-14 08:12:06', 3, '生日关怀红包', '生日快乐'),
        row('CR91052', 'LFCR20261013192018052', '2026-10-13 19:20:18', 0.88, '回访补发红包', '回访补发'),
        row('CR91053', 'LFCR20261012110840053', '2026-10-12 11:08:40', 2.5, '开业加码红包', '开业加码')
      ]
    );
  }

  /** 演示单补前台备注：只补原来没有该字段的记录，已填写或留空的不覆盖 */
  function ensureSeedFrontRemarks() {
    var changed = false;
    batches.forEach(function (batch) {
      if (batch.frontRemark != null || !DEMO_BATCH_FRONT_REMARK[batch.id]) return;
      batch.frontRemark = DEMO_BATCH_FRONT_REMARK[batch.id];
      changed = true;
    });
    if (changed) persistBatches();
    var recordChanged = false;
    list.forEach(function (item) {
      if (item.frontRemark != null || !DEMO_FRONT_REMARK[item.id]) return;
      item.frontRemark = DEMO_FRONT_REMARK[item.id];
      recordChanged = true;
    });
    if (recordChanged) persist();
  }

  function packetTitle(item) {
    var name = String((item && item.activityName) || '').trim();
    if (!name || name === '—') name = '现金红包';
    var remark = String((item && item.frontRemark) || '').trim();
    if (!remark) return name;
    return name + '（' + remark + '）';
  }

  function ensureSeedModes() {
    var modes = {
      MF2026092001: 'single',
      MF2026100102: 'single',
      MF2026100703: 'single'
    };
    var changed = false;
    batches.forEach(function (b) {
      if (b.mode || !modes[b.id]) return;
      b.mode = modes[b.id];
      changed = true;
    });
    if (changed) persistBatches();
  }

  function ensureSeedCreators() {
    var seedCreators = {
      MF2026092001: '张运营',
      MF2026100102: '李增长',
      MF2026100703: '王活动'
    };
    var changed = false;
    batches.forEach(function (b) {
      if (b.creator || !seedCreators[b.id]) return;
      b.creator = seedCreators[b.id];
      changed = true;
    });
    if (changed) persistBatches();
  }

  function ensureDualPortDemo() {
    var hasBatch = batches.some(function (b) {
      return b.id === 'MF2026100703';
    });
    if (!hasBatch) {
      batches.push({
        id: 'MF2026100703',
        name: '双端补偿红包',
        ports: ['mini', 'app'],
        createdAt: '2026-10-07 10:00:00',
        finishedAt: '2026-10-07 10:00:02',
        status: 'done',
        creator: '王活动',
        mode: 'single'
      });
      persistBatches();
    }
    if (!getById('CR91005')) {
      list.unshift(
        normalizeItem({
          id: 'CR91005',
          outBillNo: 'LFCR20261007100000005',
          transferBillNo: '133000007110099999118202610070005',
          grantedAt: '2026-10-07 10:00:00',
          userId: 'U10086',
          userName: '宁静致远',
          userPhone: '159****4315',
          amount: 1.2,
          activityType: 'manual',
          activityId: 'MF2026100703',
          activityName: '双端补偿红包',
          frontRemark: '双端补差',
          scene: 'manual',
          ports: ['mini', 'app'],
          port: '',
          status: 'pending'
        })
      );
      persist();
    }
  }

  function pushDemoBatch(batch, records) {
    var exists = batches.some(function (item) {
      return item.id === batch.id;
    });
    if (!exists) {
      batches.push(Object.assign({}, batch));
      persistBatches();
    }
    var added = false;
    (records || []).forEach(function (row) {
      if (getById(row.id)) return;
      list.unshift(normalizeItem(row));
      added = true;
    });
    if (added) persist();
  }

  /** 各执行状态各留一条，已有同编号不重复写入，方便已打开过的原型刷新后核对 */
  function ensureManualStatusDemos() {
    SEED_BATCHES.forEach(function (batch) {
      pushDemoBatch(
        batch,
        SEED_BATCH_RECORDS.filter(function (row) {
          return row.activityId === batch.id;
        })
      );
    });
    pushDemoBatch(
      {
        id: 'MF2026101301',
        name: '定时回访红包',
        port: 'app',
        createdAt: '2026-10-13 09:00:00',
        finishedAt: '',
        status: 'scheduled',
        creator: '李增长',
        mode: 'level',
        triggerMode: 'schedule',
        triggerAt: '2026-10-20 10:00:00',
        plannedCount: 12,
        plannedAmount: 36,
        frontRemark: '回访关怀',
        backRemark: '定时待触发'
      },
      []
    );
    pushDemoBatch(
      {
        id: 'MF2026101302',
        name: '活动补偿发放中',
        ports: ['mini', 'app'],
        createdAt: '2026-10-13 08:30:00',
        finishedAt: '',
        status: 'granting',
        creator: '王活动',
        mode: 'single',
        triggerMode: 'now',
        frontRemark: '活动补偿',
        backRemark: '发放未完成'
      },
      [
        {
          id: 'CR91021',
          outBillNo: 'LFCR20261013083000021',
          transferBillNo: '133000007110099999118202610130021',
          grantedAt: '2026-10-13 08:30:00',
          userId: 'U10001',
          userName: '小程序用户A',
          userPhone: '138****2211',
          amount: 2,
          activityType: 'manual',
          activityId: 'MF2026101302',
          activityName: '活动补偿发放中',
          scene: 'manual',
          ports: ['mini', 'app'],
          port: '',
          status: 'pending',
          frontRemark: '活动补偿',
          backRemark: '发放未完成'
        },
        {
          id: 'CR91022',
          outBillNo: 'LFCR20261013083000022',
          transferBillNo: '133000007110099999118202610130022',
          grantedAt: '2026-10-13 08:30:02',
          userId: 'U10002',
          userName: 'APP会员B',
          userPhone: '139****9033',
          amount: 2,
          activityType: 'manual',
          activityId: 'MF2026101302',
          activityName: '活动补偿发放中',
          scene: 'manual',
          ports: ['mini', 'app'],
          port: '',
          status: 'pending',
          frontRemark: '活动补偿',
          backRemark: '发放未完成'
        }
      ]
    );
    pushDemoBatch(
      {
        id: 'MF2026101303',
        name: '批量补发部分失败',
        port: 'mini',
        createdAt: '2026-10-12 16:00:00',
        finishedAt: '2026-10-12 16:00:08',
        status: 'partial',
        creator: '张运营',
        mode: 'batch',
        triggerMode: 'now'
      },
      [
        {
          id: 'CR91031',
          outBillNo: 'LFCR20261012160000031',
          transferBillNo: '133000007110099999118202610120031',
          grantedAt: '2026-10-12 16:00:00',
          userId: 'U10001',
          userName: '小程序用户A',
          userPhone: '138****2211',
          amount: 2,
          activityType: 'manual',
          activityId: 'MF2026101303',
          activityName: '批量补发部分失败',
          scene: 'manual',
          port: 'mini',
          status: 'claimed',
          claimAt: '2026-10-12 16:20:00',
          frontRemark: '补发成功',
          backRemark: '已核对'
        },
        {
          id: 'CR91032',
          outBillNo: 'LFCR20261012160000032',
          transferBillNo: '133000007110099999118202610120032',
          grantedAt: '2026-10-12 16:00:01',
          userId: 'U10002',
          userName: 'APP会员B',
          userPhone: '139****9033',
          amount: 3,
          activityType: 'manual',
          activityId: 'MF2026101303',
          activityName: '批量补发部分失败',
          scene: 'manual',
          port: 'mini',
          status: 'pending',
          frontRemark: '待领取',
          backRemark: '跟进中'
        },
        {
          id: 'CR91033',
          outBillNo: 'LFCR20261012160000033',
          transferBillNo: '',
          grantedAt: '2026-10-12 16:00:02',
          userId: 'U10086',
          userName: '宁静致远',
          userPhone: '159****4315',
          amount: 5,
          activityType: 'manual',
          activityId: 'MF2026101303',
          activityName: '批量补发部分失败',
          scene: 'manual',
          port: 'mini',
          status: 'failed',
          failReason: '用户微信未实名',
          frontRemark: '补发失败',
          backRemark: '待重试'
        }
      ]
    );
    pushDemoBatch(
      {
        id: 'MF2026101304',
        name: '账户异常发放失败',
        port: 'app',
        createdAt: '2026-10-12 11:00:00',
        finishedAt: '2026-10-12 11:00:06',
        status: 'failed',
        creator: '王活动',
        mode: 'batch',
        triggerMode: 'now'
      },
      [
        {
          id: 'CR91041',
          outBillNo: 'LFCR20261012110000041',
          transferBillNo: '',
          grantedAt: '2026-10-12 11:00:00',
          userId: 'U10006',
          userName: '演示会员6',
          userPhone: '136****6606',
          amount: 1.5,
          activityType: 'manual',
          activityId: 'MF2026101304',
          activityName: '账户异常发放失败',
          scene: 'manual',
          port: 'app',
          status: 'failed',
          failReason: '账户余额不足',
          frontRemark: '异常补发',
          backRemark: '余额不足'
        },
        {
          id: 'CR91042',
          outBillNo: 'LFCR20261012110000042',
          transferBillNo: '',
          grantedAt: '2026-10-12 11:00:01',
          userId: 'U10002',
          userName: 'APP会员B',
          userPhone: '139****9033',
          amount: 1.5,
          activityType: 'manual',
          activityId: 'MF2026101304',
          activityName: '账户异常发放失败',
          scene: 'manual',
          port: 'app',
          status: 'failed',
          failReason: '收款账户异常',
          frontRemark: '异常补发',
          backRemark: '账户异常'
        }
      ]
    );
  }

  function patchSeedDemoAmounts() {
    var changed = false;
    list.forEach(function (it) {
      if (it.id === 'CR91002' && Number(it.amount) === 2) {
        it.amount = 8;
        changed = true;
      }
      if (it.id === 'CR91004' && Number(it.amount) === 1.5) {
        it.amount = 3;
        changed = true;
      }
    });
    if (changed) persist();
  }

  function getBatches() {
    ensureBatches();
    return batches
      .map(function (b) {
        return Object.assign({}, b, { ports: batchPorts(b) });
      })
      .sort(function (a, b) {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }

  function recordsOfBatch(batchId) {
    var id = String(batchId || '');
    return getAll().filter(function (it) {
      return it.activityType === 'manual' && String(it.activityId) === id;
    });
  }

  function summarizeBatch(batch) {
    var rows = recordsOfBatch(batch && batch.id);
    var active = rows.filter(function (r) {
      return r.status !== 'revoked';
    });
    var claimed = active.filter(function (r) {
      return r.status === 'claimed';
    });
    var grantCount = active.length;
    var totalAmount = 0;
    var claimAmount = 0;
    active.forEach(function (r) {
      totalAmount += Number(r.amount) || 0;
    });
    claimed.forEach(function (r) {
      claimAmount += Number(r.amount) || 0;
    });
    var status = batchStatusOf(active, batch && batch.status);
    if (status === 'scheduled') {
      grantCount = Number(batch && batch.plannedCount) || 0;
      totalAmount = Number(batch && batch.plannedAmount) || 0;
    }
    var execFail = rows.filter(function (r) {
      return r.status === 'failed';
    }).length;
    return {
      grantCount: grantCount,
      totalAmount: toMoney(totalAmount),
      claimCount: claimed.length,
      claimAmount: toMoney(claimAmount),
      status: status,
      statusLabel: BATCH_STATUS_LABEL[status] || status || '—',
      execTotal: rows.length,
      execSuccess: rows.length - execFail,
      execFail: execFail
    };
  }

  function addBatch(payload) {
    ensureBatches();
    var item = {
      id: String((payload && payload.id) || 'MF' + String(Date.now()).slice(-8)),
      name: String((payload && payload.name) || '').trim() || '手动发放红包',
      ports: batchPorts(payload),
      createdAt: (payload && payload.createdAt) || formatNow(),
      finishedAt: (payload && payload.finishedAt) || '',
      status: (payload && BATCH_STATUS_LABEL[payload.status] && payload.status) || 'granting',
      frontRemark: String((payload && payload.frontRemark) || '').trim(),
      backRemark: String((payload && payload.backRemark) || '').trim(),
      creator: String((payload && payload.creator) || '').trim() || '演示运营',
      mode: MANUAL_MODE_LABEL[payload && payload.mode] ? payload.mode : '',
      triggerMode: payload && payload.triggerMode === 'schedule' ? 'schedule' : 'now',
      triggerAt: payload && payload.triggerMode === 'schedule' ? String(payload.triggerAt || '').trim() : '',
      plannedCount: Math.max(0, Number(payload && payload.plannedCount) || 0),
      plannedAmount: toMoney(payload && payload.plannedAmount)
    };
    batches.unshift(item);
    persistBatches();
    return Object.assign({}, item);
  }

  var MANUAL_AUDIT_KEY = 'mdm_marketing_cash_redpack_manual_audits_v1';
  var MANUAL_MODE_LABEL = {
    single: '单个会员',
    batch: '批量发放',
    level: '按会员等级',
    tag: '按会员标签',
    segment: '按会员分群'
  };
  var MANUAL_AUDIT_STATUS = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '审核成功',
    REJECTED: '审核失败',
    CANCELLED: '已取消'
  };
  var manualAudits = [];
  var manualAuditsLoaded = false;

  function manualAuditStatusLabel(code) {
    return MANUAL_AUDIT_STATUS[code] || code || '—';
  }

  function cloneAudit(row) {
    return JSON.parse(JSON.stringify(row));
  }

  function seedManualAudits() {
    return [
      {
        id: 'MRAUD2026101201',
        status: 'PENDING',
        submittedAt: '2026-10-12 09:20:00',
        submittedBy: '张运营',
        auditedAt: '',
        auditedBy: '',
        reason: '',
        auditLogs: [],
        batchId: '',
        fileName: '',
        snapshot: {
          name: '回访补发红包',
          ports: ['mini'],
          mode: 'single',
          memberKind: 'phone',
          memberInput: '13800002211',
          levelIds: [],
          tagIds: [],
          segmentIds: [],
          users: [{ id: 'U10001', name: '小程序用户A', phone: '138****2211', amount: 1.5, frontRemark: '回访补发', backRemark: '' }],
          reward: 1.5,
          frontRemark: '回访补发',
          backRemark: '',
          fileName: '',
          creator: '张运营'
        },
        logs: [{ at: '2026-10-12 09:20:00', action: '提交审核', operator: '张运营', detail: '提交派发红包', result: '成功' }]
      },
      {
        id: 'MRAUD2026101102',
        status: 'REJECTED',
        submittedAt: '2026-10-11 16:08:00',
        submittedBy: '李增长',
        auditedAt: '2026-10-11 17:12:00',
        auditedBy: '审核员小李',
        reason: '奖励金额超出活动预算',
        auditLogs: [{
          node: '营销审核',
          reviewer: '审核员小李',
          time: '2026-10-11 17:12:00',
          result: '驳回',
          reason: '奖励金额超出活动预算'
        }],
        batchId: '',
        fileName: '回访名单.xlsx',
        snapshot: {
          name: '异常金额红包',
          ports: ['app'],
          mode: 'batch',
          memberKind: 'phone',
          memberInput: '',
          levelIds: [],
          tagIds: [],
          segmentIds: [],
          users: [
            { id: 'U10002', name: 'APP会员B', phone: '139****9033', amount: 8, frontRemark: '', backRemark: '补差' },
            { id: 'U10086', name: '宁静致远', phone: '159****4315', amount: 6, frontRemark: '', backRemark: '补差' }
          ],
          reward: 0,
          frontRemark: '',
          backRemark: '',
          fileName: '回访名单.xlsx',
          creator: '李增长'
        },
        logs: [
          { at: '2026-10-11 16:08:00', action: '提交审核', operator: '李增长', detail: '提交派发红包', result: '成功' },
          { at: '2026-10-11 17:12:00', action: '审核失败', operator: '审核员小李', detail: '奖励金额超出活动预算', result: '成功' }
        ]
      }
    ];
  }

  function persistManualAudits() {
    try {
      localStorage.setItem(MANUAL_AUDIT_KEY, JSON.stringify(manualAudits));
    } catch (e) {}
  }

  function ensureManualAudits() {
    if (manualAuditsLoaded) return;
    manualAuditsLoaded = true;
    var hasStored = false;
    try {
      var raw = localStorage.getItem(MANUAL_AUDIT_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          manualAudits = parsed;
          hasStored = true;
        }
      }
    } catch (e) {}
    if (!hasStored) {
      manualAudits = seedManualAudits();
      persistManualAudits();
    }
    ensurePendingAuditDemo();
    ensureCancelledAuditDemo();
  }

  function ensureCancelledAuditDemo() {
    var changed = false;
    manualAudits.forEach(function (row) {
      if (!row || row.status !== 'DRAFT' || row.fromCancelId) return;
      var cancelId = 'CANCEL-' + row.id;
      if (!manualAudits.some(function (item) { return item && item.id === cancelId; })) {
        var cancelled = cloneAudit(row);
        cancelled.id = cancelId;
        cancelled.status = 'CANCELLED';
        cancelled.auditedAt = row.submittedAt || '2026-10-12 18:00:00';
        cancelled.auditedBy = row.submittedBy || '演示运营';
        cancelled.auditLogs = [{
          node: '营销审核',
          reviewer: cancelled.auditedBy,
          time: cancelled.auditedAt,
          result: '取消',
          reason: '取消审核，回到草稿'
        }];
        manualAudits.push(cancelled);
      }
      row.fromCancelId = cancelId;
      changed = true;
    });
    if (!manualAudits.some(function (row) { return row && row.id === 'MRAUD2026101305'; })) {
      manualAudits.push({
        id: 'MRAUD2026101305',
        status: 'CANCELLED',
        submittedAt: '2026-10-12 14:06:00',
        submittedBy: '张运营',
        auditedAt: '2026-10-12 14:20:00',
        auditedBy: '张运营',
        reason: '',
        auditLogs: [{
          node: '营销审核',
          reviewer: '张运营',
          time: '2026-10-12 14:20:00',
          result: '取消',
          reason: '取消审核，回到草稿'
        }],
        batchId: '',
        fileName: '',
        snapshot: {
          name: '已取消的关怀红包',
          ports: ['mini'],
          mode: 'single',
          memberKind: 'phone',
          memberInput: '13800002211',
          levelIds: [],
          tagIds: [],
          segmentIds: [],
          users: [{ id: 'U10001', name: '小程序用户A', phone: '138****2211', amount: 2, frontRemark: '取消后不发放', backRemark: '' }],
          reward: 2,
          frontRemark: '取消后不发放',
          backRemark: '',
          fileName: '',
          triggerMode: 'now',
          triggerAt: '',
          creator: '张运营'
        },
        logs: [
          { at: '2026-10-12 14:06:00', action: '提交审核', operator: '张运营', detail: '提交派发红包', result: '成功' },
          { at: '2026-10-12 14:20:00', action: '取消审核', operator: '张运营', detail: '回到草稿', result: '成功' }
        ]
      });
      changed = true;
    }
    if (changed) persistManualAudits();
  }

  function ensurePendingAuditDemo() {
    var exists = manualAudits.some(function (row) {
      return row.id === 'MRAUD2026101301';
    });
    if (exists) return;
    manualAudits.unshift({
      id: 'MRAUD2026101301',
      status: 'PENDING',
      submittedAt: '2026-10-13 09:30:00',
      submittedBy: '张运营',
      auditedAt: '',
      auditedBy: '',
      reason: '',
      auditLogs: [],
      batchId: '',
      fileName: '',
      snapshot: {
        name: '生日关怀红包',
        ports: ['mini'],
        mode: 'single',
        memberKind: 'phone',
        memberInput: '13800002211',
        levelIds: [],
        tagIds: [],
        segmentIds: [],
        users: [{ id: 'U10001', name: '小程序用户A', phone: '138****2211', amount: 6.6, frontRemark: '生日快乐', backRemark: '客服补发' }],
        reward: 6.6,
        frontRemark: '生日快乐',
        backRemark: '客服补发',
        fileName: '',
        triggerMode: 'schedule',
        triggerAt: '2026-10-18 09:00:00',
        creator: '张运营'
      },
      logs: [{ at: '2026-10-13 09:30:00', action: '提交审核', operator: '张运营', detail: '提交派发红包', result: '成功' }]
    });
    persistManualAudits();
  }

  function pushManualAuditLog(audit, action, operator, detail) {
    if (!audit.logs) audit.logs = [];
    audit.logs.unshift({
      at: formatNow(),
      action: action,
      operator: operator || '演示运营',
      detail: detail || '',
      result: '成功'
    });
  }

  function manualSnapshotOf(payload) {
    var snap = payload || {};
    var creator = String(snap.creator || '').trim() || '演示运营';
    return {
      name: String(snap.name || '').trim(),
      ports: batchPorts(snap),
      mode: MANUAL_MODE_LABEL[snap.mode] ? snap.mode : 'single',
      memberKind: snap.memberKind === 'id' ? 'id' : 'phone',
      memberInput: String(snap.memberInput || ''),
      levelIds: Array.isArray(snap.levelIds) ? snap.levelIds.slice() : [],
      tagIds: Array.isArray(snap.tagIds) ? snap.tagIds.slice() : [],
      segmentIds: Array.isArray(snap.segmentIds) ? snap.segmentIds.slice() : [],
      users: Array.isArray(snap.users) ? snap.users.map(function (u) { return Object.assign({}, u); }) : [],
      reward: toMoney(snap.reward),
      frontRemark: String(snap.frontRemark || '').trim(),
      backRemark: String(snap.backRemark || '').trim(),
      fileName: String(snap.fileName || '').trim(),
      triggerMode: snap.triggerMode === 'schedule' ? 'schedule' : 'now',
      triggerAt: snap.triggerMode === 'schedule' ? String(snap.triggerAt || '').trim() : '',
      creator: creator
    };
  }

  function createManualAudit(payload) {
    ensureManualAudits();
    var snap = payload || {};
    var now = formatNow();
    var creator = String(snap.creator || '').trim() || '演示运营';
    var snapshot = manualSnapshotOf(snap);
    var audit = {
      id: 'MRAUD' + String(Date.now()).slice(-8),
      status: 'PENDING',
      submittedAt: now,
      submittedBy: creator,
      auditedAt: '',
      auditedBy: '',
      reason: '',
      auditLogs: [],
      batchId: '',
      fileName: snapshot.fileName,
      snapshot: snapshot,
      logs: []
    };
    pushManualAuditLog(audit, '提交审核', creator, '提交派发红包');
    manualAudits.unshift(audit);
    persistManualAudits();
    return cloneAudit(audit);
  }

  function resubmitManualDraft(id, payload) {
    ensureManualAudits();
    var audit = findManualAudit(id);
    if (!audit || audit.status !== 'DRAFT') return { ok: false, message: '仅草稿可提交' };
    var snap = payload || {};
    var now = formatNow();
    var creator = String(snap.creator || (audit.snapshot && audit.snapshot.creator) || '').trim() || '演示运营';
    audit.status = 'PENDING';
    audit.submittedAt = now;
    audit.submittedBy = creator;
    audit.auditedAt = '';
    audit.auditedBy = '';
    audit.reason = '';
    audit.snapshot = manualSnapshotOf(Object.assign({}, snap, { creator: creator }));
    audit.fileName = audit.snapshot.fileName;
    pushManualAuditLog(audit, '提交审核', creator, '草稿重新提交派发红包');
    persistManualAudits();
    return { ok: true, audit: cloneAudit(audit) };
  }

  function findManualAudit(id) {
    ensureManualAudits();
    var sid = String(id || '');
    for (var i = 0; i < manualAudits.length; i++) {
      if (String(manualAudits[i].id) === sid) return manualAudits[i];
    }
    return null;
  }

  function listManualAudits(query) {
    ensureManualAudits();
    var q = query || {};
    var name = String(q.name || '').trim();
    var mode = String(q.mode || '');
    var port = String(q.port || '');
    var status = String(q.status || '');
    var auditor = String(q.auditor || '').trim();
    var rows = manualAudits.filter(function (row) {
      var snap = row.snapshot || {};
      if (name && String(snap.name || '').indexOf(name) < 0) return false;
      if (mode && snap.mode !== mode) return false;
      if (port && batchPorts(snap).indexOf(port) < 0) return false;
      if (status && row.status !== status) return false;
      if (!status && row.status === 'DRAFT') return false;
      if (auditor && String(row.auditedBy || '').indexOf(auditor) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) {
      return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
    });
    return rows.map(cloneAudit);
  }

  function executeManualGrant(snapshot) {
    var snap = snapshot || {};
    var users = Array.isArray(snap.users) ? snap.users : [];
    var now = formatNow();
    var batchMode = snap.mode === 'batch';
    var batch = addBatch({
      name: snap.name,
      ports: batchPorts(snap),
      createdAt: now,
      status: 'granting',
      frontRemark: batchMode ? '' : snap.frontRemark,
      backRemark: batchMode ? '' : snap.backRemark,
      creator: snap.creator || '演示运营',
      mode: snap.mode,
      triggerMode: snap.triggerMode,
      triggerAt: snap.triggerAt
    });
    var failed = 0;
    users.forEach(function (u) {
      var item = addRecord({
        amount: toMoney(batchMode ? u.amount : snap.reward || u.amount),
        frontRemark: batchMode ? u.frontRemark : snap.frontRemark,
        backRemark: batchMode ? u.backRemark : snap.backRemark,
        userId: u.id,
        userName: u.name,
        userPhone: u.phone,
        activityType: 'manual',
        activityId: batch.id,
        activityName: snap.name,
        scene: 'manual',
        ports: batchPorts(snap),
        port: batchPorts(snap).length === 1 ? batchPorts(snap)[0] : '',
        status: 'pending',
        grantedAt: now
      });
      var result = dispatchTransfer(item.id);
      if (!result || !result.ok) failed += 1;
    });
    var status = failed ? (failed === users.length ? 'failed' : 'partial') : 'done';
    finishBatch(batch.id, status);
    return {
      ok: true,
      batchId: batch.id,
      total: users.length,
      success: users.length - failed,
      fail: failed,
      fileName: snap.fileName || '—'
    };
  }

  function pushAuditRecord(audit, result, reason) {
    if (!audit.auditLogs) audit.auditLogs = [];
    audit.auditLogs.push({
      node: '营销审核',
      reviewer: audit.auditedBy || '审核员小李',
      time: audit.auditedAt || formatNow(),
      result: result,
      reason: String(reason || '').trim().slice(0, 100)
    });
  }

  function plannedAmountOf(snap) {
    var users = Array.isArray(snap && snap.users) ? snap.users : [];
    var total = 0;
    var batchMode = snap && snap.mode === 'batch';
    users.forEach(function (user) {
      total += Number(batchMode ? user.amount : snap.reward || user.amount) || 0;
    });
    return toMoney(total);
  }

  function isFutureTrigger(snap) {
    if (!snap || snap.triggerMode !== 'schedule') return false;
    var at = String(snap.triggerAt || '').trim();
    return !!at && at > formatNow();
  }

  function scheduleManualGrant(snapshot) {
    var snap = snapshot || {};
    var users = Array.isArray(snap.users) ? snap.users : [];
    var batchMode = snap.mode === 'batch';
    var batch = addBatch({
      name: snap.name,
      ports: batchPorts(snap),
      createdAt: formatNow(),
      status: 'scheduled',
      frontRemark: batchMode ? '' : snap.frontRemark,
      backRemark: batchMode ? '' : snap.backRemark,
      creator: snap.creator || '演示运营',
      mode: snap.mode,
      triggerMode: 'schedule',
      triggerAt: snap.triggerAt,
      plannedCount: users.length,
      plannedAmount: plannedAmountOf(snap)
    });
    return {
      ok: true,
      scheduled: true,
      batchId: batch.id,
      triggerAt: snap.triggerAt || '',
      total: users.length,
      success: 0,
      fail: 0,
      fileName: snap.fileName || '—'
    };
  }

  function approveManualAudit(id, opinion) {
    ensureManualAudits();
    var audit = findManualAudit(id);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可通过' };
    var note = String(opinion || '').trim().slice(0, 100);
    var executed = isFutureTrigger(audit.snapshot) ? scheduleManualGrant(audit.snapshot) : executeManualGrant(audit.snapshot);
    audit.status = 'APPROVED';
    audit.auditedAt = formatNow();
    audit.auditedBy = '审核员小李';
    audit.reason = '';
    audit.batchId = executed.batchId;
    pushAuditRecord(audit, '通过', note);
    pushManualAuditLog(
      audit,
      '审核成功',
      '审核员小李',
      executed.scheduled
        ? '审核成功，将于 ' + (executed.triggerAt || '') + ' 触发发放'
        : (note ? '审核成功并执行发放：' + note : '审核成功并执行发放')
    );
    persistManualAudits();
    return {
      ok: true,
      audit: cloneAudit(audit),
      batchId: executed.batchId,
      total: executed.total,
      success: executed.success,
      fail: executed.fail,
      fileName: executed.fileName,
      scheduled: !!executed.scheduled,
      triggerAt: executed.triggerAt || ''
    };
  }

  function rejectManualAudit(id, reason) {
    ensureManualAudits();
    var text = String(reason || '').trim().slice(0, 100);
    if (!text) return { ok: false, message: '请填写驳回原因' };
    var audit = findManualAudit(id);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可驳回' };
    audit.status = 'REJECTED';
    audit.auditedAt = formatNow();
    audit.auditedBy = '审核员小李';
    audit.reason = text;
    pushAuditRecord(audit, '驳回', text);
    pushManualAuditLog(audit, '审核失败', '审核员小李', text);
    persistManualAudits();
    return { ok: true, audit: cloneAudit(audit) };
  }

  function saveManualBackRemark(payload) {
    payload = payload || {};
    var text = String(payload.backRemark || '').trim();
    var members = Array.isArray(payload.members) ? payload.members : null;
    if (payload.kind === 'audit') {
      ensureManualAudits();
      var audit = findManualAudit(payload.id);
      if (!audit || !audit.snapshot) return { ok: false, message: '未找到发放记录' };
      if (members) {
        (audit.snapshot.users || []).forEach(function (user) {
          members.forEach(function (member) {
            if (String(user.id) !== String(member.id)) return;
            user.backRemark = String(member.backRemark || '').trim();
          });
        });
      } else {
        audit.snapshot.backRemark = text;
      }
      persistManualAudits();
      return { ok: true };
    }
    ensureBatches();
    ensureLoaded();
    var batch = null;
    var bid = String(payload.id || '');
    for (var i = 0; i < batches.length; i++) {
      if (String(batches[i].id) === bid) batch = batches[i];
    }
    if (!batch) return { ok: false, message: '未找到发放记录' };
    if (members) {
      members.forEach(function (member) {
        list.forEach(function (record) {
          if (record.activityType !== 'manual' || String(record.activityId) !== bid) return;
          if (String(record.id) !== String(member.id)) return;
          record.backRemark = String(member.backRemark || '').trim();
        });
      });
    } else {
      batch.backRemark = text;
      list.forEach(function (record) {
        if (record.activityType === 'manual' && String(record.activityId) === bid) record.backRemark = text;
      });
    }
    persistBatches();
    persist();
    return { ok: true };
  }

  function cancelManualAudit(id) {
    ensureManualAudits();
    var audit = findManualAudit(id);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可取消' };
    var now = formatNow();
    var operator = audit.submittedBy || '演示运营';
    audit.status = 'CANCELLED';
    audit.auditedAt = now;
    audit.auditedBy = operator;
    if (!audit.auditLogs) audit.auditLogs = [];
    audit.auditLogs.push({
      node: '营销审核',
      reviewer: operator,
      time: now,
      result: '取消',
      reason: '取消审核，回到草稿'
    });
    pushManualAuditLog(audit, '取消审核', operator, '回到草稿');
    var draft = cloneAudit(audit);
    draft.id = 'MRAUD' + String(Date.now()).slice(-8);
    draft.status = 'DRAFT';
    draft.fromCancelId = audit.id;
    draft.auditedAt = '';
    draft.auditedBy = '';
    draft.reason = '';
    draft.auditLogs = [];
    draft.logs = [{ at: now, action: '取消审核', operator: operator, detail: '回到草稿', result: '成功' }];
    manualAudits.unshift(draft);
    persistManualAudits();
    return { ok: true, audit: cloneAudit(audit), draft: cloneAudit(draft) };
  }

  function finishBatch(id, status) {
    ensureBatches();
    var sid = String(id || '');
    for (var i = 0; i < batches.length; i++) {
      if (String(batches[i].id) !== sid) continue;
      batches[i].status = BATCH_STATUS_LABEL[status] ? status : 'done';
      if (!batches[i].finishedAt && batches[i].status !== 'granting') batches[i].finishedAt = formatNow();
      persistBatches();
      return Object.assign({}, batches[i]);
    }
    return null;
  }

  global.MdmMarketingCashRedpackStore = {
    STORAGE_KEY: STORAGE_KEY,
    SETTINGS_KEY: SETTINGS_KEY,
    STATUS_LABEL: STATUS_LABEL,
    SCENE_LABEL: SCENE_LABEL,
    PORT_LABEL: PORT_LABEL,
    ACTIVITY_TYPE_LABEL: ACTIVITY_TYPE_LABEL,
    ACTIVITY_SCENES: ACTIVITY_SCENES,
    normalizeItem: normalizeItem,
    claimLimitExempt: claimLimitExempt,
    packetTitle: packetTitle,
    getAll: getAll,
    getById: getById,
    addRecord: addRecord,
    updateStatus: updateStatus,
    revokeRecord: revokeRecord,
    dispatchTransfer: dispatchTransfer,
    redispatchRecord: redispatchRecord,
    genOutBillNo: genOutBillNo,
    genTransferBillNo: genTransferBillNo,
    filterList: filterList,
    calcStats: calcStats,
    getHomeStats: getHomeStats,
    getGrantActivities: getGrantActivities,
    scenesForActivity: scenesForActivity,
    getSettings: getSettings,
    saveSettings: saveSettings,
    isEnabled: isEnabled,
    statusLabel: statusLabel,
    sceneLabel: sceneLabel,
    portLabel: portLabel,
    portsLabel: portsLabel,
    batchPorts: batchPorts,
    recordAllowsPort: recordAllowsPort,
    claimPortText: claimPortText,
    activityTypeLabel: activityTypeLabel,
    BATCH_STATUS_LABEL: BATCH_STATUS_LABEL,
    getBatches: getBatches,
    recordsOfBatch: recordsOfBatch,
    summarizeBatch: summarizeBatch,
    addBatch: addBatch,
    finishBatch: finishBatch,
    MANUAL_MODE_LABEL: MANUAL_MODE_LABEL,
    createManualAudit: createManualAudit,
    resubmitManualDraft: resubmitManualDraft,
    listManualAudits: listManualAudits,
    findManualAudit: findManualAudit,
    approveManualAudit: approveManualAudit,
    rejectManualAudit: rejectManualAudit,
    cancelManualAudit: cancelManualAudit,
    saveManualBackRemark: saveManualBackRemark,
    manualAuditStatusLabel: manualAuditStatusLabel,
    nextId: nextId,
    formatNow: formatNow,
    toMoney: toMoney,
    clampExpireHours: clampExpireHours,
    clampClaimCount: clampClaimCount,
    activityClaimRemain: activityClaimRemain,
    activityClaimRemainForRecord: activityClaimRemainForRecord
  };
})(window);
