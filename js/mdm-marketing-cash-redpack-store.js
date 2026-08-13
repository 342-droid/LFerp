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
    old_first_download: '老用户下载'
  };

  var PORT_LABEL = { mini: '小程序', app: 'APP' };

  var ACTIVITY_TYPE_LABEL = {
    register_gift: '注册有礼'
  };

  /** 活动类型 → 可选场景（二级联动） */
  var ACTIVITY_SCENES = {
    register_gift: ['new_register', 'old_first_download']
  };

  var DEFAULT_SETTINGS = {
    enabled: true,
    expireHours: 24
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

  function normalizeSettings(raw) {
    var s = Object.assign({}, DEFAULT_SETTINGS, raw || {});
    s.enabled = !!s.enabled;
    s.expireHours = clampExpireHours(s.expireHours);
    return s;
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
    item.scene = item.scene === 'old_first_download' ? 'old_first_download' : 'new_register';
    item.port = item.port === 'app' ? 'app' : 'mini';
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
      if (port && it.port !== port) return false;
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
        name: '注册有礼',
        desc: '新用户注册 / 老用户下载场景可配置现金红包奖励',
        href: 'mdm_marketing_register_gift.html'
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

  function activityTypeLabel(type) {
    return ACTIVITY_TYPE_LABEL[type] || type || '—';
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
    activityTypeLabel: activityTypeLabel,
    nextId: nextId,
    formatNow: formatNow,
    toMoney: toMoney,
    clampExpireHours: clampExpireHours
  };
})(window);
