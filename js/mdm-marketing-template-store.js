/**
 * 营销模版 — 模版配置
 * Key: mdm_marketing_template_v1
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_marketing_template_v1';
  var LOG_KEY = 'mdm_marketing_template_logs_v1';

  var TYPE_LABEL = {
    COUPON: '优惠券',
    FORTUNE_BAG: '福袋',
    SIGN_IN: '签到',
    TASK: '任务'
  };
  var TASK_TYPE_LABEL = { WATCH: '观看任务' };
  var CHANNEL_LABEL = { ALL: '全部渠道', LIVE_ONLY: '仅直播', MALL_ONLY: '仅商城' };
  var SCOPE_LABEL = { ALL: '全部商品', GOODS: '指定商品', CATEGORY: '指定类目' };
  var STATUS_LABEL = { ACTIVE: '启用', PAUSED: '禁用', DRAFT: '禁用' };
  var COUPON_TYPE_LABEL = { NO_THRESHOLD: '无门槛', FULL_MINUS: '满减' };
  var PRIZE_TYPE_LABEL = { POINTS: '积分', GOODS: '商品', COUPON: '优惠券' };
  var ACTION_LABEL = {
    'activity.create': '创建模板',
    'activity.update': '修改模板',
    'activity.activate': '启用模板',
    'activity.pause': '禁用模板'
  };

  var MALL_CATEGORIES = [
    { id: 'mc-1', name: '蔬菜水果', source: 'MALL' },
    { id: 'mc-2', name: '肉禽蛋品', source: 'MALL' },
    { id: 'mc-3', name: '酒水饮料', source: 'MALL' },
    { id: 'mc-4', name: '粮油调味', source: 'MALL' },
    { id: 'mc-5', name: '日用百货', source: 'MALL' }
  ];
  var LIVE_CATEGORIES = [
    { id: 'lcat-001', name: '时令果蔬', source: 'LIVE' },
    { id: 'lcat-002', name: '肉禽蛋奶', source: 'LIVE' },
    { id: 'lcat-003', name: '水产海鲜', source: 'LIVE' },
    { id: 'lcat-004', name: '粮油干货', source: 'LIVE' },
    { id: 'lcat-005', name: '爆款秒杀', source: 'LIVE' }
  ];

  var PRODUCTS = [
    {
      id: '1001',
      spuCode: 'LF-VG-10086',
      title: '云南高山西红柿',
      skus: [
        { skuCode: 'SKU-001A', skuName: '5斤装' },
        { skuCode: 'SKU-001B', skuName: '3斤装' }
      ]
    },
    {
      id: '1002',
      spuCode: 'LF-MT-20011',
      title: '冷鲜黑猪五花肉',
      skus: [{ skuCode: 'SKU-002A', skuName: '500g' }]
    },
    {
      id: '1003',
      spuCode: 'LF-FR-30022',
      title: '烟台红富士苹果',
      skus: [
        { skuCode: 'SKU-003A', skuName: '5斤装' },
        { skuCode: 'SKU-003B', skuName: '10斤装' }
      ]
    },
    {
      id: '1004',
      spuCode: 'LF-SN-40008',
      title: '炭烧腰果',
      skus: [{ skuCode: 'SKU-004A', skuName: '200g/袋' }]
    },
    {
      id: '1005',
      spuCode: 'LF-EG-50019',
      title: '土鸡蛋礼盒',
      skus: [
        { skuCode: 'SKU-005A', skuName: '30枚' },
        { skuCode: 'SKU-005B', skuName: '60枚' }
      ]
    }
  ];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
    var d = new Date();
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

  function nextId() {
    return String(Date.now()) + String(Math.floor(Math.random() * 900 + 100));
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function seedTemplates() {
    return [
      {
        id: '10086001',
        name: '满99减10券',
        activityType: 'COUPON',
        applicableChannel: 'ALL',
        status: 'ACTIVE',
        totalStock: 1000,
        createdAt: '2026-08-12 10:20:11',
        updatedAt: '2026-08-20 09:12:00',
        validStart: '2026-08-12 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: {
          activityType: 'COUPON',
          couponType: 'FULL_MINUS',
          threshold: 99,
          denomination: 10,
          timeScope: 'UNLIMITED',
          itemScope: 'ALL',
          perUserLimit: null,
          stackable: false
        }
      },
      {
        id: '10086002',
        name: '新人专享券',
        activityType: 'COUPON',
        applicableChannel: 'ALL',
        status: 'PAUSED',
        totalStock: 300,
        createdAt: '2026-08-15 14:08:32',
        updatedAt: '2026-08-28 16:40:18',
        validStart: '2026-08-15 00:00:00',
        validEnd: '2026-11-30 23:59:59',
        config: {
          activityType: 'COUPON',
          couponType: 'NO_THRESHOLD',
          threshold: 0,
          denomination: 5,
          timeScope: 'UNLIMITED',
          itemScope: 'GOODS',
          productScopeJson: JSON.stringify({
            type: 'GOODS',
            items: [
              {
                id: 'SKU-001A',
                label: '云南高山西红柿（5斤装（SKU-001A））',
                spuCode: 'LF-VG-10086',
                skuCode: 'SKU-001A',
                spuId: '1001'
              }
            ]
          }),
          perUserLimit: 1,
          stackable: false
        }
      },
      {
        id: '10086003',
        name: '果蔬满减券',
        activityType: 'COUPON',
        applicableChannel: 'MALL_ONLY',
        status: 'ACTIVE',
        totalStock: 2800,
        createdAt: '2026-08-18 09:33:05',
        updatedAt: '2026-08-18 09:33:05',
        validStart: '2026-09-01 00:00:00',
        validEnd: '2026-09-30 23:59:59',
        config: {
          activityType: 'COUPON',
          couponType: 'FULL_MINUS',
          threshold: 59,
          denomination: 8,
          timeScope: 'SPECIFIC',
          itemScope: 'CATEGORY',
          productScopeJson: JSON.stringify({
            type: 'CATEGORY',
            items: [{ id: 'mc-1', name: '蔬菜水果', source: 'MALL' }]
          }),
          perUserLimit: 3,
          stackable: false
        }
      },
      {
        id: '10086004',
        name: '开播福袋',
        activityType: 'FORTUNE_BAG',
        applicableChannel: 'LIVE_ONLY',
        status: 'ACTIVE',
        totalStock: 200,
        createdAt: '2026-08-10 19:01:44',
        updatedAt: '2026-08-22 11:20:00',
        validStart: '2026-08-10 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: {
          activityType: 'FORTUNE_BAG',
          prizeType: 'POINTS',
          prizes: [{ refId: 'POINTS', amount: 100, weight: 1 }],
          drawMode: 'SCHEDULED',
          winnerLimitMode: 'PER_SESSION'
        }
      },
      {
        id: '10086005',
        name: '整点福袋',
        activityType: 'FORTUNE_BAG',
        applicableChannel: 'LIVE_ONLY',
        status: 'PAUSED',
        totalStock: 100,
        createdAt: '2026-08-11 08:15:09',
        updatedAt: '2026-08-26 18:02:41',
        validStart: '2026-08-11 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: {
          activityType: 'FORTUNE_BAG',
          prizeType: 'COUPON',
          prizes: [{ refId: '10086001', amount: 1, weight: 1 }],
          drawMode: 'SCHEDULED',
          winnerLimitMode: 'PER_SESSION'
        }
      },
      {
        id: '10086006',
        name: '直播签到有礼',
        activityType: 'SIGN_IN',
        applicableChannel: 'LIVE_ONLY',
        status: 'ACTIVE',
        totalStock: null,
        createdAt: '2026-08-09 16:42:20',
        updatedAt: '2026-08-21 10:08:00',
        validStart: '2026-08-09 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: {
          activityType: 'SIGN_IN',
          totalRounds: 3,
          mode: 'PER_ROUND',
          continuousRequired: false,
          roundRewards: [
            { rewardType: 'POINTS', pointsAmount: 5 },
            { rewardType: 'NONE' },
            { rewardType: 'COUPON', couponActivityId: '10086001' }
          ]
        }
      },
      {
        id: '10086007',
        name: '观看满10分钟领积分',
        activityType: 'TASK',
        applicableChannel: 'LIVE_ONLY',
        status: 'ACTIVE',
        totalStock: null,
        createdAt: '2026-08-08 11:00:00',
        updatedAt: '2026-08-19 13:26:33',
        validStart: '2026-08-08 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: {
          activityType: 'TASK',
          taskType: 'WATCH',
          milestones: [{ index: 0, threshold: 10, reward: { rewardType: 'POINTS', pointsAmount: 20 } }]
        }
      },
      {
        id: '10086008',
        name: '观看满30分钟领积分',
        activityType: 'TASK',
        applicableChannel: 'LIVE_ONLY',
        status: 'PAUSED',
        totalStock: null,
        createdAt: '2026-08-08 11:05:18',
        updatedAt: '2026-08-25 09:44:02',
        validStart: '2026-08-08 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: {
          activityType: 'TASK',
          taskType: 'WATCH',
          milestones: [
            { index: 0, threshold: 10, reward: { rewardType: 'POINTS', pointsAmount: 10 } },
            { index: 1, threshold: 30, reward: { rewardType: 'POINTS', pointsAmount: 30 } }
          ]
        }
      }
    ];
  }

  function seedLogs() {
    return {
      '10086001': [
        {
          id: 'log-10086001-1',
          timestamp: '2026-08-20 09:12:00',
          action: 'activity.activate',
          operator: '张征',
          httpMethod: 'POST',
          requestUri: '/marketing-core/v1/activity/activate',
          success: true,
          clientIp: '10.8.12.21',
          service: 'marketing-core',
          elapsedMs: 42,
          resource: 'marketing_activity',
          resourceId: '10086001',
          requestParams: '{"id":"10086001"}',
          changes: [{ field: 'status', oldValue: 'PAUSED', newValue: 'ACTIVE' }]
        },
        {
          id: 'log-10086001-2',
          timestamp: '2026-08-12 10:20:11',
          action: 'activity.create',
          operator: '张征',
          httpMethod: 'POST',
          requestUri: '/marketing-core/v1/activity/create',
          success: true,
          clientIp: '10.8.12.21',
          service: 'marketing-core',
          elapsedMs: 88,
          resource: 'marketing_activity',
          resourceId: '10086001',
          requestParams: '{"name":"满99减10券","activityType":"COUPON"}',
          changes: [{ field: 'name', oldValue: '', newValue: '满99减10券' }]
        }
      ]
    };
  }

  var list = [];
  var logs = {};

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      /* ignore */
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          list = parsed;
        } else {
          list = seedTemplates();
        }
      } else {
        list = seedTemplates();
      }
    } catch (e) {
      list = seedTemplates();
    }
    try {
      var rawLogs = localStorage.getItem(LOG_KEY);
      logs = rawLogs ? JSON.parse(rawLogs) : seedLogs();
      if (!logs || typeof logs !== 'object') logs = seedLogs();
    } catch (e2) {
      logs = seedLogs();
    }
    list.forEach(function (item) {
      if (!item || !item.id) return;
      if (logs[item.id] && logs[item.id].length) return;
      var recs = [
        {
          id: 'log-' + item.id + '-create',
          timestamp: item.createdAt || nowStr(),
          action: 'activity.create',
          operator: '张征',
          httpMethod: 'POST',
          requestUri: '/marketing-core/v1/activity/create',
          success: true,
          clientIp: '10.8.12.21',
          service: 'marketing-core',
          elapsedMs: 64,
          resource: 'marketing_activity',
          resourceId: String(item.id),
          requestParams: JSON.stringify({ name: item.name, activityType: item.activityType }),
          changes: [{ field: 'name', oldValue: '', newValue: item.name || '' }]
        }
      ];
      if (item.status === 'ACTIVE') {
        recs.unshift({
          id: 'log-' + item.id + '-activate',
          timestamp: item.updatedAt || item.createdAt || nowStr(),
          action: 'activity.activate',
          operator: '张征',
          httpMethod: 'POST',
          requestUri: '/marketing-core/v1/activity/activate',
          success: true,
          clientIp: '10.8.12.21',
          service: 'marketing-core',
          elapsedMs: 40,
          resource: 'marketing_activity',
          resourceId: String(item.id),
          requestParams: JSON.stringify({ id: String(item.id) }),
          changes: [{ field: 'status', oldValue: 'PAUSED', newValue: 'ACTIVE' }]
        });
      }
      logs[item.id] = recs;
    });
    persist();
  }

  function typeLabel(activityType, taskType) {
    if (activityType === 'TASK' && taskType && TASK_TYPE_LABEL[taskType]) {
      return TASK_TYPE_LABEL[taskType];
    }
    return TYPE_LABEL[activityType] || activityType || '-';
  }

  function channelLabel(v) {
    return v ? CHANNEL_LABEL[v] || v : '-';
  }

  function scopeLabel(v) {
    return v ? SCOPE_LABEL[v] || v : '-';
  }

  function statusLabel(v) {
    return v === 'ACTIVE' ? '启用' : '禁用';
  }

  function listRows(query) {
    var q = query || {};
    var type = String(q.activityType || '');
    var activityType = '';
    var taskType = '';
    if (type) {
      var parts = type.split(':');
      activityType = parts[0];
      taskType = parts[1] || '';
    }
    var rows = list.filter(function (item) {
      if (activityType && item.activityType !== activityType) return false;
      if (taskType) {
        var tt = (item.config && item.config.taskType) || '';
        if (tt !== taskType) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    return rows;
  }

  function findById(id) {
    var sid = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === sid) return list[i];
    }
    return null;
  }

  function snapshotFields(item) {
    var cfg = item.config || {};
    return {
      name: item.name,
      status: item.status,
      validStart: item.validStart || '',
      validEnd: item.validEnd || '',
      totalStock: item.totalStock,
      applicableChannel: item.applicableChannel,
      'config.couponType': cfg.couponType,
      'config.denomination': cfg.denomination,
      'config.threshold': cfg.threshold,
      'config.itemScope': cfg.itemScope,
      'config.productScopeJson': cfg.productScopeJson,
      'config.perUserLimit': cfg.perUserLimit,
      'config.stackable': cfg.stackable
    };
  }

  function diffChanges(before, after) {
    var keys = [
      'name',
      'status',
      'validStart',
      'validEnd',
      'totalStock',
      'applicableChannel',
      'config.couponType',
      'config.denomination',
      'config.threshold',
      'config.itemScope',
      'config.productScopeJson',
      'config.perUserLimit',
      'config.stackable'
    ];
    var out = [];
    keys.forEach(function (k) {
      var ov = before[k];
      var nv = after[k];
      if (String(ov == null ? '' : ov) === String(nv == null ? '' : nv)) return;
      out.push({ field: k, oldValue: ov, newValue: nv });
    });
    return out;
  }

  function pushLog(item, action, changes, extra) {
    var id = String(item.id);
    if (!logs[id]) logs[id] = [];
    var rec = {
      id: 'log-' + nextId(),
      timestamp: nowStr(),
      action: action,
      operator: '张征',
      httpMethod: 'POST',
      requestUri:
        action === 'activity.create'
          ? '/marketing-core/v1/activity/create'
          : action === 'activity.update'
            ? '/marketing-core/v1/activity/update'
            : action === 'activity.activate'
              ? '/marketing-core/v1/activity/activate'
              : '/marketing-core/v1/activity/pause',
      success: true,
      clientIp: '10.8.12.21',
      service: 'marketing-core',
      elapsedMs: 30 + Math.floor(Math.random() * 80),
      resource: 'marketing_activity',
      resourceId: id,
      requestParams: JSON.stringify(extra || { id: id }),
      changes: changes || []
    };
    logs[id].unshift(rec);
    persist();
    return rec;
  }

  function createItem(payload) {
    var item = clone(payload);
    item.id = nextId();
    item.status = 'PAUSED';
    item.createdAt = nowStr();
    item.updatedAt = item.createdAt;
    list.unshift(item);
    pushLog(item, 'activity.create', [{ field: 'name', oldValue: '', newValue: item.name }], payload);
    persist();
    return item;
  }

  function updateItem(id, payload) {
    var item = findById(id);
    if (!item) return null;
    var before = snapshotFields(item);
    item.name = payload.name;
    item.validStart = payload.validStart;
    item.validEnd = payload.validEnd;
    item.totalStock = payload.totalStock;
    item.applicableChannel = payload.applicableChannel;
    item.config = payload.config;
    item.updatedAt = nowStr();
    var after = snapshotFields(item);
    pushLog(item, 'activity.update', diffChanges(before, after), payload);
    persist();
    return item;
  }

  function setStatus(id, status) {
    var item = findById(id);
    if (!item) return null;
    var before = item.status;
    item.status = status;
    item.updatedAt = nowStr();
    pushLog(
      item,
      status === 'ACTIVE' ? 'activity.activate' : 'activity.pause',
      [{ field: 'status', oldValue: before, newValue: status }],
      { id: String(id) }
    );
    persist();
    return item;
  }

  function listLogs(activityId, pageNum, pageSize) {
    var all = (logs[String(activityId)] || []).slice();
    var page = Number(pageNum) || 1;
    var size = Number(pageSize) || 20;
    var start = (page - 1) * size;
    return { list: all.slice(start, start + size), total: all.length };
  }

  function findLog(logId) {
    var keys = Object.keys(logs);
    for (var i = 0; i < keys.length; i++) {
      var arr = logs[keys[i]] || [];
      for (var j = 0; j < arr.length; j++) {
        if (String(arr[j].id) === String(logId)) return arr[j];
      }
    }
    return null;
  }

  function listActiveCoupons() {
    return list.filter(function (item) {
      return item.activityType === 'COUPON' && item.status === 'ACTIVE';
    });
  }

  function couponOptionLabel(item) {
    var scope = scopeLabel((item.config && item.config.itemScope) || '');
    var name = item.name || item.id;
    return scope && scope !== '-' ? name + ' [' + scope + ']' : name;
  }

  function searchProducts(keyword) {
    var q = String(keyword || '').trim();
    return PRODUCTS.filter(function (p) {
      if (!q) return true;
      return (p.title + p.spuCode).indexOf(q) >= 0;
    });
  }

  function categoriesOf(source) {
    return source === 'LIVE' ? LIVE_CATEGORIES.slice() : MALL_CATEGORIES.slice();
  }

  load();

  global.MdmMarketingTemplateStore = {
    TYPE_LABEL: TYPE_LABEL,
    CHANNEL_LABEL: CHANNEL_LABEL,
    SCOPE_LABEL: SCOPE_LABEL,
    STATUS_LABEL: STATUS_LABEL,
    COUPON_TYPE_LABEL: COUPON_TYPE_LABEL,
    PRIZE_TYPE_LABEL: PRIZE_TYPE_LABEL,
    ACTION_LABEL: ACTION_LABEL,
    typeLabel: typeLabel,
    channelLabel: channelLabel,
    scopeLabel: scopeLabel,
    statusLabel: statusLabel,
    listRows: listRows,
    findById: findById,
    createItem: createItem,
    updateItem: updateItem,
    setStatus: setStatus,
    listLogs: listLogs,
    findLog: findLog,
    listActiveCoupons: listActiveCoupons,
    couponOptionLabel: couponOptionLabel,
    searchProducts: searchProducts,
    categoriesOf: categoriesOf,
    nowStr: nowStr
  };
})(window);
