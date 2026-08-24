/**
 * 售后 — 举报 / 意见反馈 共享演示数据（B 端列表与 C 端提交共用 localStorage）
 *
 * 类型 20 字以内；删除仅当没有关联单据。
 * 举报来源固定为直播详情，展示场次 ID（活动 ID）。
 */
(function (global) {
  'use strict';

  var TYPE_NAME_MAX = 20;
  var CONTENT_MAX = 200;
  var REPLY_MAX = 200;
  var REMARK_MAX = 100;
  var ADMIN_NICK = '超级管理员';
  var ADMIN_ACCOUNT = 'admin';

  var IMAGE_MAX_COUNT = 9;
  var VIDEO_MAX_COUNT = 1;
  var IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  var VIDEO_MAX_BYTES = 100 * 1024 * 1024;

  var KEYS = {
    reportTypes: 'lf_report_types_v1',
    reports: 'lf_reports_v2',
    feedbackTypes: 'lf_feedback_types_v1',
    feedbacks: 'lf_feedbacks_v2'
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data != null ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function nowText() {
    var d = new Date();
    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function nextId(prefix, list) {
    var max = 0;
    (list || []).forEach(function (item) {
      var m = String(item.id || '').match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var n = max + 1;
    var str = String(n);
    while (str.length < 3) str = '0' + str;
    return prefix + str;
  }

  function defaultReportTypes() {
    return [
      { id: 'RT001', name: '色情低俗', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 1, createdAt: '2026-08-01 10:00:00' },
      { id: 'RT002', name: '违法违规', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 2, createdAt: '2026-08-01 10:01:00' },
      { id: 'RT003', name: '欺诈广告', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 3, createdAt: '2026-08-01 10:02:00' },
      { id: 'RT004', name: '人身攻击', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 4, createdAt: '2026-08-01 10:03:00' },
      { id: 'RT005', name: '虚假宣传', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 5, createdAt: '2026-08-01 10:04:00' }
    ];
  }

  function defaultFeedbackTypes() {
    return [
      { id: 'FT001', name: '功能建议', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 1, createdAt: '2026-08-01 11:00:00' },
      { id: 'FT002', name: '体验问题', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 2, createdAt: '2026-08-01 11:01:00' },
      { id: 'FT003', name: '商品问题', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 3, createdAt: '2026-08-01 11:02:00' },
      { id: 'FT004', name: '物流配送', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 4, createdAt: '2026-08-01 11:03:00' },
      { id: 'FT005', name: '其他', enabled: true, creatorNick: ADMIN_NICK, creatorAccount: ADMIN_ACCOUNT, sort: 5, createdAt: '2026-08-01 11:04:00' }
    ];
  }

  function defaultReports() {
    return [
      {
        id: 'RP005',
        userId: 'UC10001',
        nickname: '宁静致远',
        phone: '15589069061',
        avatar: '../user-app/assets/profile-avatar.svg',
        typeId: 'RT005',
        typeName: '虚假宣传',
        content: '主播说今晚全场半价，实际下单还是原价。',
        source: '直播详情',
        sessionId: 'sess-001',
        sessionName: '8.11 晚间生鲜专场',
        createdAt: '2026-08-19 15:12:08',
        status: '待处理',
        reply: '',
        replyUnread: false,
        remark: '',
        images: [
          { kind: 'image', name: '价格截图.png', url: '/user-app/assets/shop/beef-review-1.svg' }
        ],
        video: null
      },
      {
        id: 'RP006',
        userId: 'UC10001',
        nickname: '宁静致远',
        phone: '15589069061',
        avatar: '../user-app/assets/profile-avatar.svg',
        typeId: 'RT004',
        typeName: '人身攻击',
        content: '有人在弹幕骂人，主播没有及时处理。',
        source: '直播详情',
        sessionId: 'sess-001',
        sessionName: '8.11 晚间生鲜专场',
        createdAt: '2026-08-18 21:06:40',
        status: '已处理',
        reply: '已警告相关账号并开启本场弹幕审核，感谢反馈。',
        replyUnread: true,
        remark: '已同步中控。',
        images: [
          { kind: 'image', name: '弹幕截图.png', url: '/user-app/assets/shop/beef-review-2.svg' }
        ],
        video: { kind: 'video', name: '直播片段.mp4', size: 18600000, url: '' }
      },
      {
        id: 'RP004',
        userId: 'UC10028',
        nickname: '小陈爱吃',
        phone: '13800001111',
        avatar: '',
        typeId: 'RT004',
        typeName: '人身攻击',
        content: '弹幕里有人骂人，主播也没有管。',
        source: '直播详情',
        sessionId: 'sess-001',
        sessionName: '8.11 晚间生鲜专场',
        createdAt: '2026-08-18 20:41:22',
        status: '待处理',
        reply: '',
        replyUnread: false,
        remark: '',
        images: [],
        video: null
      },
      {
        id: 'RP003',
        userId: 'UC10035',
        nickname: '阿强',
        phone: '13900002222',
        avatar: '',
        typeId: 'RT003',
        typeName: '欺诈广告',
        content: '福袋宣传必中券，抽了三次都没有。',
        source: '直播详情',
        sessionId: 'sess-002',
        sessionName: '8.12 产地直采早市',
        createdAt: '2026-08-17 09:18:40',
        status: '已处理',
        reply: '福袋为概率玩法，已在直播间补充说明。',
        replyUnread: false,
        remark: '已核实为概率玩法，已在直播间补充说明。',
        images: [],
        video: null
      },
      {
        id: 'RP002',
        userId: 'UC10041',
        nickname: '林林',
        phone: '13700003333',
        avatar: '',
        typeId: 'RT002',
        typeName: '违法违规',
        content: '讲解时提到了违规药品功效。',
        source: '直播详情',
        sessionId: 'sess-003',
        sessionName: '会员日专场',
        createdAt: '2026-08-16 19:05:11',
        status: '已处理',
        reply: '已下架相关话术并警告主播。',
        replyUnread: false,
        remark: '已下架相关话术并警告主播。',
        images: [],
        video: null
      },
      {
        id: 'RP001',
        userId: 'UC10052',
        nickname: '周末买菜',
        phone: '13600004444',
        avatar: '',
        typeId: 'RT001',
        typeName: '色情低俗',
        content: '封面图不合适。',
        source: '直播详情',
        sessionId: 'sess-002',
        sessionName: '8.12 产地直采早市',
        createdAt: '2026-08-15 11:22:00',
        status: '已处理',
        reply: '已更换封面，感谢举报。',
        replyUnread: false,
        remark: '已更换封面。',
        images: [
          { kind: 'image', name: '封面.png', url: '/user-app/assets/shop/live-hero.svg' }
        ],
        video: null
      }
    ];
  }

  function defaultFeedbacks() {
    return [
      {
        id: 'FB004',
        userId: 'UC10001',
        nickname: '宁静致远',
        phone: '15589069061',
        avatar: '../user-app/assets/profile-avatar.svg',
        typeId: 'FT002',
        typeName: '体验问题',
        content: '直播间点赞后页面会卡一下，希望优化。',
        createdAt: '2026-08-19 14:08:30',
        status: '待处理',
        reply: '',
        remark: '',
        replyUnread: false,
        images: [],
        video: null
      },
      {
        id: 'FB003',
        userId: 'UC10001',
        nickname: '宁静致远',
        phone: '15589069061',
        avatar: '../user-app/assets/profile-avatar.svg',
        typeId: 'FT001',
        typeName: '功能建议',
        content: '希望个人中心能看到积分即将过期的提醒。',
        createdAt: '2026-08-12 16:40:12',
        status: '已处理',
        reply: '感谢反馈，积分过期提醒已排进迭代，上线后会在个人中心展示。',
        remark: '产品已收录。',
        replyUnread: true,
        images: [
          { kind: 'image', name: '个人中心.png', url: '/user-app/assets/shop/beef-review-3.svg' }
        ],
        video: null
      },
      {
        id: 'FB002',
        userId: 'UC10001',
        nickname: '宁静致远',
        phone: '15589069061',
        avatar: '../user-app/assets/profile-avatar.svg',
        typeId: 'FT003',
        typeName: '商品问题',
        content: '积分商城有个商品图模糊。',
        createdAt: '2026-08-08 09:12:45',
        status: '已处理',
        reply: '已联系运营更换商品主图，请刷新后再看。',
        remark: '',
        replyUnread: false,
        images: [
          { kind: 'image', name: '商品图.png', url: '/user-app/assets/shop/product-dumpling.svg' }
        ],
        video: null
      },
      {
        id: 'FB001',
        userId: 'UC10028',
        nickname: '小陈爱吃',
        phone: '13800001111',
        avatar: '',
        typeId: 'FT004',
        typeName: '物流配送',
        content: '自提点排队有点久。',
        createdAt: '2026-08-07 18:20:00',
        status: '已处理',
        reply: '已反馈门店增加高峰人力。',
        remark: '',
        replyUnread: false,
        images: [],
        video: null
      }
    ];
  }

  function normalizeRecord(row) {
    var next = Object.assign({}, row || {});
    if (!Array.isArray(next.images)) next.images = [];
    if (next.video === undefined) next.video = null;
    if (next.reply == null) next.reply = '';
    if (next.replyUnread == null) next.replyUnread = false;
    return next;
  }

  function pickMedia(payload) {
    var images = Array.isArray(payload && payload.images) ? payload.images.slice(0, IMAGE_MAX_COUNT) : [];
    var video = payload && payload.video ? payload.video : null;
    return { images: images, video: video };
  }

  function ensureList(key, factory) {
    var list = readJson(key, null);
    if (!Array.isArray(list) || !list.length) {
      list = factory();
      writeJson(key, list);
    }
    return clone(list);
  }

  function sortTypes(list) {
    return (list || []).slice().sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0);
    });
  }

  function saveTypes(key, list) {
    writeJson(key, list);
    return sortTypes(list);
  }

  function getReportTypes() {
    return sortTypes(ensureList(KEYS.reportTypes, defaultReportTypes));
  }

  function getFeedbackTypes() {
    return sortTypes(ensureList(KEYS.feedbackTypes, defaultFeedbackTypes));
  }

  function getReports() {
    return ensureList(KEYS.reports, defaultReports)
      .map(normalizeRecord)
      .sort(function (a, b) {
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
  }

  function getFeedbacks() {
    return ensureList(KEYS.feedbacks, defaultFeedbacks)
      .map(normalizeRecord)
      .sort(function (a, b) {
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
  }

  function saveReports(list) {
    writeJson(KEYS.reports, list);
  }

  function saveFeedbacks(list) {
    writeJson(KEYS.feedbacks, list);
  }

  function validateTypeName(name, list, excludeId) {
    var text = String(name || '').trim();
    if (!text) return { ok: false, message: '请输入类型名称' };
    if (text.length > TYPE_NAME_MAX) return { ok: false, message: '类型名称不超过 ' + TYPE_NAME_MAX + ' 个字' };
    var dup = (list || []).some(function (item) {
      return item.id !== excludeId && String(item.name || '') === text;
    });
    if (dup) return { ok: false, message: '已存在同名类型' };
    return { ok: true, name: text };
  }

  function addType(key, prefix, name) {
    var list = key === KEYS.reportTypes ? getReportTypes() : getFeedbackTypes();
    var check = validateTypeName(name, list);
    if (!check.ok) return check;
    var maxSort = 0;
    list.forEach(function (item) {
      if (item.sort > maxSort) maxSort = item.sort;
    });
    var item = {
      id: nextId(prefix, list),
      name: check.name,
      enabled: true,
      creatorNick: ADMIN_NICK,
      creatorAccount: ADMIN_ACCOUNT,
      sort: maxSort + 1,
      createdAt: nowText()
    };
    list.push(item);
    saveTypes(key, list);
    return { ok: true, item: item };
  }

  function toggleType(key, id) {
    var list = key === KEYS.reportTypes ? getReportTypes() : getFeedbackTypes();
    var found = null;
    list.forEach(function (item) {
      if (item.id === id) {
        item.enabled = !item.enabled;
        found = item;
      }
    });
    if (!found) return { ok: false, message: '类型不存在' };
    saveTypes(key, list);
    return { ok: true, item: found };
  }

  function typeRefCount(kind, typeId) {
    var list = kind === 'report' ? getReports() : getFeedbacks();
    var count = 0;
    list.forEach(function (row) {
      if (row.typeId === typeId) count += 1;
    });
    return count;
  }

  function deleteType(key, kind, id) {
    var refs = typeRefCount(kind, id);
    if (refs > 0) return { ok: false, message: '已有关联数据，无法删除' };
    var list = key === KEYS.reportTypes ? getReportTypes() : getFeedbackTypes();
    var next = list.filter(function (item) {
      return item.id !== id;
    });
    if (next.length === list.length) return { ok: false, message: '类型不存在' };
    next.forEach(function (item, idx) {
      item.sort = idx + 1;
    });
    saveTypes(key, next);
    return { ok: true };
  }

  function moveType(key, id, direction) {
    var list = key === KEYS.reportTypes ? getReportTypes() : getFeedbackTypes();
    var index = -1;
    list.forEach(function (item, i) {
      if (item.id === id) index = i;
    });
    if (index < 0) return { ok: false, message: '类型不存在' };
    var swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= list.length) return { ok: false, message: direction === 'up' ? '已经是第一条' : '已经是最后一条' };
    var a = list[index];
    var b = list[swap];
    var tmp = a.sort;
    a.sort = b.sort;
    b.sort = tmp;
    saveTypes(key, list);
    return { ok: true };
  }

  function addReport(payload) {
    var content = String((payload && payload.content) || '').trim();
    var typeId = String((payload && payload.typeId) || '').trim();
    if (!typeId) return { ok: false, message: '请选择举报类型' };
    if (!content) return { ok: false, message: '请填写详细举报内容' };
    if (content.length > CONTENT_MAX) return { ok: false, message: '举报内容不超过 ' + CONTENT_MAX + ' 个字' };
    var types = getReportTypes();
    var type = null;
    types.forEach(function (item) {
      if (item.id === typeId) type = item;
    });
    if (!type || !type.enabled) return { ok: false, message: '请选择有效的举报类型' };
    var media = pickMedia(payload);
    var list = getReports();
    var row = {
      id: nextId('RP', list),
      userId: (payload && payload.userId) || 'UC10001',
      nickname: (payload && payload.nickname) || '宁静致远',
      phone: (payload && payload.phone) || '15589069061',
      avatar: (payload && payload.avatar) || '../user-app/assets/profile-avatar.svg',
      typeId: type.id,
      typeName: type.name,
      content: content,
      source: '直播详情',
      sessionId: (payload && payload.sessionId) || 'sess-001',
      sessionName: (payload && payload.sessionName) || '黑灯直播间',
      createdAt: nowText(),
      status: '待处理',
      reply: '',
      replyUnread: false,
      remark: '',
      images: media.images,
      video: media.video
    };
    list.unshift(row);
    saveReports(list);
    return { ok: true, item: row };
  }

  function updateReport(id, patch) {
    var list = getReports();
    var found = null;
    list.forEach(function (row) {
      if (row.id === id) {
        Object.keys(patch || {}).forEach(function (k) {
          row[k] = patch[k];
        });
        found = row;
      }
    });
    if (!found) return { ok: false, message: '记录不存在' };
    saveReports(list);
    return { ok: true, item: found };
  }

  function addFeedback(payload) {
    var content = String((payload && payload.content) || '').trim();
    var typeId = String((payload && payload.typeId) || '').trim();
    if (!typeId) return { ok: false, message: '请选择反馈类型' };
    if (!content) return { ok: false, message: '请填写反馈内容' };
    if (content.length > CONTENT_MAX) return { ok: false, message: '反馈内容不超过 ' + CONTENT_MAX + ' 个字' };
    var types = getFeedbackTypes();
    var type = null;
    types.forEach(function (item) {
      if (item.id === typeId) type = item;
    });
    if (!type || !type.enabled) return { ok: false, message: '请选择有效的反馈类型' };
    var media = pickMedia(payload);
    var list = getFeedbacks();
    var row = {
      id: nextId('FB', list),
      userId: (payload && payload.userId) || 'UC10001',
      nickname: (payload && payload.nickname) || '宁静致远',
      phone: (payload && payload.phone) || '15589069061',
      avatar: (payload && payload.avatar) || '../user-app/assets/profile-avatar.svg',
      typeId: type.id,
      typeName: type.name,
      content: content,
      createdAt: nowText(),
      status: '待处理',
      reply: '',
      remark: '',
      replyUnread: false,
      images: media.images,
      video: media.video
    };
    list.unshift(row);
    saveFeedbacks(list);
    return { ok: true, item: row };
  }

  function updateFeedback(id, patch) {
    var list = getFeedbacks();
    var found = null;
    list.forEach(function (row) {
      if (row.id === id) {
        Object.keys(patch || {}).forEach(function (k) {
          row[k] = patch[k];
        });
        found = row;
      }
    });
    if (!found) return { ok: false, message: '记录不存在' };
    saveFeedbacks(list);
    return { ok: true, item: found };
  }

  function processReport(id, reply, remark) {
    var text = String(reply || '').trim();
    if (!text) return { ok: false, message: '请填写回复内容' };
    if (text.length > REPLY_MAX) return { ok: false, message: '回复内容不超过 ' + REPLY_MAX + ' 个字' };
    return updateReport(id, {
      status: '已处理',
      reply: text,
      remark: String(remark || '').trim(),
      replyUnread: true
    });
  }

  function remarkReport(id, remark) {
    return updateReport(id, { remark: String(remark || '').trim() });
  }

  function processFeedback(id, reply, remark) {
    var text = String(reply || '').trim();
    if (!text) return { ok: false, message: '请填写回复内容' };
    if (text.length > REPLY_MAX) return { ok: false, message: '回复内容不超过 ' + REPLY_MAX + ' 个字' };
    return updateFeedback(id, {
      status: '已处理',
      reply: text,
      remark: String(remark || '').trim(),
      replyUnread: true
    });
  }

  function remarkFeedback(id, remark) {
    return updateFeedback(id, { remark: String(remark || '').trim() });
  }

  function enabledTypes(list) {
    return (list || []).filter(function (item) {
      return item.enabled !== false;
    });
  }

  function hasUnreadReply(userId) {
    var id = String(userId || '').trim();
    return getFeedbacks().some(function (row) {
      return String(row.userId) === id && row.reply && row.replyUnread;
    });
  }

  function hasUnreadReportReply(userId) {
    var id = String(userId || '').trim();
    return getReports().some(function (row) {
      return String(row.userId) === id && row.reply && row.replyUnread;
    });
  }

  function markFeedbackRead(id) {
    return updateFeedback(id, { replyUnread: false });
  }

  function markReportRead(id) {
    return updateReport(id, { replyUnread: false });
  }

  function feedbacksByUser(userId) {
    var id = String(userId || '').trim();
    return getFeedbacks().filter(function (row) {
      return String(row.userId) === id;
    });
  }

  function reportsByUser(userId) {
    var id = String(userId || '').trim();
    return getReports().filter(function (row) {
      return String(row.userId) === id;
    });
  }

  function findById(list, id) {
    var found = null;
    (list || []).forEach(function (row) {
      if (row.id === id) found = row;
    });
    return found;
  }

  function seedFeedbacks(list) {
    writeJson(KEYS.feedbacks, list);
  }

  function resetAll(seed) {
    var pack = seed || {};
    writeJson(KEYS.reportTypes, pack.reportTypes || defaultReportTypes());
    writeJson(KEYS.reports, pack.reports || defaultReports());
    writeJson(KEYS.feedbackTypes, pack.feedbackTypes || defaultFeedbackTypes());
    writeJson(KEYS.feedbacks, pack.feedbacks || defaultFeedbacks());
  }

  global.LfAftersaleFeedbackStore = {
    IMAGE_MAX_COUNT: IMAGE_MAX_COUNT,
    VIDEO_MAX_COUNT: VIDEO_MAX_COUNT,
    IMAGE_MAX_BYTES: IMAGE_MAX_BYTES,
    VIDEO_MAX_BYTES: VIDEO_MAX_BYTES,
    TYPE_NAME_MAX: TYPE_NAME_MAX,
    CONTENT_MAX: CONTENT_MAX,
    REPLY_MAX: REPLY_MAX,
    REMARK_MAX: REMARK_MAX,
    getReportTypes: getReportTypes,
    getEnabledReportTypes: function () {
      return enabledTypes(getReportTypes());
    },
    addReportType: function (name) {
      return addType(KEYS.reportTypes, 'RT', name);
    },
    toggleReportType: function (id) {
      return toggleType(KEYS.reportTypes, id);
    },
    deleteReportType: function (id) {
      return deleteType(KEYS.reportTypes, 'report', id);
    },
    moveReportType: function (id, direction) {
      return moveType(KEYS.reportTypes, id, direction);
    },
    reportTypeRefCount: function (id) {
      return typeRefCount('report', id);
    },
    getReports: getReports,
    addReport: addReport,
    processReport: processReport,
    remarkReport: remarkReport,
    getFeedbackTypes: getFeedbackTypes,
    getEnabledFeedbackTypes: function () {
      return enabledTypes(getFeedbackTypes());
    },
    addFeedbackType: function (name) {
      return addType(KEYS.feedbackTypes, 'FT', name);
    },
    toggleFeedbackType: function (id) {
      return toggleType(KEYS.feedbackTypes, id);
    },
    deleteFeedbackType: function (id) {
      return deleteType(KEYS.feedbackTypes, 'feedback', id);
    },
    moveFeedbackType: function (id, direction) {
      return moveType(KEYS.feedbackTypes, id, direction);
    },
    feedbackTypeRefCount: function (id) {
      return typeRefCount('feedback', id);
    },
    getFeedbacks: getFeedbacks,
    addFeedback: addFeedback,
    processFeedback: processFeedback,
    remarkFeedback: remarkFeedback,
    feedbacksByUser: feedbacksByUser,
    reportsByUser: reportsByUser,
    hasUnreadReply: hasUnreadReply,
    hasUnreadReportReply: hasUnreadReportReply,
    markFeedbackRead: markFeedbackRead,
    markReportRead: markReportRead,
    getFeedback: function (id) {
      return findById(getFeedbacks(), id);
    },
    getReport: function (id) {
      return findById(getReports(), id);
    },
    resetAll: resetAll,
    seedFeedbacks: seedFeedbacks,
    seedReports: function (list) {
      writeJson(KEYS.reports, list);
    },
    defaultFeedbacks: defaultFeedbacks,
    defaultReports: defaultReports
  };
})(window);
