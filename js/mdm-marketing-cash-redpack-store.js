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
   * 活动领取剩余次数。手动发放不限制。
   * 单项配置 0 表示该项不限制，不参与最小值。
   * 每场直播限领只在有直播场次时参与。
   * 当日下单：按当日下单金额匹配已达到的最高档；未达到任一档则该档为 0。档次数为 0 表示该档不限制。
   * 参与项剩余次数的最小值为 0 时，用户点击领取提示「无活动次数」。
   */
  function activityClaimRemain(ctx) {
    ctx = ctx || {};
    if (ctx.activityType === 'manual') return { limited: false, remain: null, message: '' };
    var s = getSettings();
    var caps = [];
    if (ctx.inLive && s.liveLimit > 0) {
      caps.push(Math.max(0, s.liveLimit - Math.max(0, Math.round(Number(ctx.usedLive) || 0))));
    }
    if (s.dailyMode === 'order_today') {
      var dailyTiers = s.dailyTiers || [];
      if (dailyTiers.length) {
        var matched = matchDailyTier(dailyTiers, ctx.orderAmountToday);
        if (!matched) caps.push(0);
        else if (matched.count > 0) {
          caps.push(Math.max(0, matched.count - Math.max(0, Math.round(Number(ctx.usedToday) || 0))));
        }
      }
    } else if (s.dailyLimit > 0) {
      caps.push(Math.max(0, s.dailyLimit - Math.max(0, Math.round(Number(ctx.usedToday) || 0))));
    }
    if (s.totalLimit > 0) {
      caps.push(Math.max(0, s.totalLimit - Math.max(0, Math.round(Number(ctx.usedTotal) || 0))));
    }
    if (!caps.length) return { limited: false, remain: null, message: '' };
    var remain = caps[0];
    caps.forEach(function (n) {
      if (n < remain) remain = n;
    });
    if (remain === 0) return { limited: true, remain: 0, message: '无活动次数' };
    return { limited: true, remain: remain, message: '' };
  }

  function activityClaimRemainForRecord(record) {
    var item = record || {};
    if (item.activityType === 'manual') return activityClaimRemain(item);
    ensureLoaded();
    var userId = String(item.userId || '');
    var liveId = String(item.liveId || '');
    var today = todayKey();
    var totalDays = getSettings().totalDayRange;
    var usedTotal = 0;
    var usedToday = 0;
    var usedLive = 0;
    list.forEach(function (it) {
      if (!it || it.activityType === 'manual' || it.status !== 'claimed') return;
      if (String(it.id) === String(item.id)) return;
      if (String(it.userId || '') !== userId) return;
      if (inTotalWindow(it.claimAt || it.grantedAt, totalDays)) usedTotal += 1;
      if (dayKey(it.claimAt || it.grantedAt) === today) usedToday += 1;
      if (liveId && String(it.liveId || '') === liveId) usedLive += 1;
    });
    return activityClaimRemain({
      activityType: item.activityType,
      inLive: !!liveId,
      orderedToday: !!item.orderedToday,
      orderAmountToday: item.orderAmountToday,
      usedTotal: usedTotal,
      usedToday: usedToday,
      usedLive: usedLive
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
    if (!dt) return null;
    var s = String(dt).trim().replace(' ', 'T');
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
      mode: 'single'
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
      scene: 'manual',
      ports: ['mini', 'app'],
      port: '',
      status: 'pending'
    }
  ];

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
          scene: 'manual',
          ports: ['mini', 'app'],
          port: '',
          status: 'pending'
        })
      );
      persist();
    }
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
      mode: MANUAL_MODE_LABEL[payload && payload.mode] ? payload.mode : ''
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
    PENDING: '待审核',
    APPROVED: '审核成功',
    REJECTED: '审核失败'
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

  function createManualAudit(payload) {
    ensureManualAudits();
    var snap = payload || {};
    var now = formatNow();
    var creator = String(snap.creator || '').trim() || '演示运营';
    var audit = {
      id: 'MRAUD' + String(Date.now()).slice(-8),
      status: 'PENDING',
      submittedAt: now,
      submittedBy: creator,
      auditedAt: '',
      auditedBy: '',
      reason: '',
      batchId: '',
      fileName: String(snap.fileName || '').trim(),
      snapshot: {
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
        creator: creator
      },
      logs: []
    };
    pushManualAuditLog(audit, '提交审核', creator, '提交派发红包');
    manualAudits.unshift(audit);
    persistManualAudits();
    return cloneAudit(audit);
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
      mode: snap.mode
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

  function approveManualAudit(id) {
    ensureManualAudits();
    var audit = findManualAudit(id);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可通过' };
    var executed = executeManualGrant(audit.snapshot);
    audit.status = 'APPROVED';
    audit.auditedAt = formatNow();
    audit.auditedBy = '审核员小李';
    audit.reason = '';
    audit.batchId = executed.batchId;
    pushManualAuditLog(audit, '审核成功', '审核员小李', '审核成功并执行发放');
    persistManualAudits();
    return {
      ok: true,
      audit: cloneAudit(audit),
      batchId: executed.batchId,
      total: executed.total,
      success: executed.success,
      fail: executed.fail,
      fileName: executed.fileName
    };
  }

  function rejectManualAudit(id, reason) {
    ensureManualAudits();
    var text = String(reason || '').trim();
    if (!text) return { ok: false, message: '请填写审核失败原因' };
    var audit = findManualAudit(id);
    if (!audit || audit.status !== 'PENDING') return { ok: false, message: '仅待审核可驳回' };
    audit.status = 'REJECTED';
    audit.auditedAt = formatNow();
    audit.auditedBy = '审核员小李';
    audit.reason = text;
    pushManualAuditLog(audit, '审核失败', '审核员小李', text);
    persistManualAudits();
    return { ok: true, audit: cloneAudit(audit) };
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
    listManualAudits: listManualAudits,
    findManualAudit: findManualAudit,
    approveManualAudit: approveManualAudit,
    rejectManualAudit: rejectManualAudit,
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
