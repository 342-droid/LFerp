/**
 * 营销活动 — 优惠券模板（独立于模版配置）
 * Key: mdm_marketing_coupon_v2
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_marketing_coupon_v3';
  var AUDIT_KEY = 'mdm_marketing_coupon_audit_v3';
  var LOG_KEY = 'mdm_marketing_coupon_logs_v3';
  var REC_KEY = 'mdm_mall_recommendation_coupon_v1';

  var STATUS_LABEL = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '审核成功',
    REJECTED: '审核失败',
    ACTIVE: '启用'
  };
  var AUDIT_STATUS_LABEL = {
    PENDING: '待审核',
    CANCELLED: '取消审核',
    APPROVED: '审核成功',
    REJECTED: '审核失败'
  };
  var CHANNEL_LABEL = { ALL: '全部渠道', LIVE_ONLY: '仅直播', MALL_ONLY: '仅商城' };
  var SCOPE_LABEL = { ALL: '全部商品', GOODS: '指定商品', CATEGORY: '指定类目' };
  var COUPON_TYPE_LABEL = { NO_THRESHOLD: '无门槛', FULL_MINUS: '满减' };
  var SCENE_LABEL = {
    LIVE: '直播发券',
    MARKETING: '营销送券',
    MALL: '商城推荐位',
    MEMBER: '会员发券'
  };
  var SCENE_OPTIONS = [
    { v: 'LIVE', l: '直播发券' },
    { v: 'MARKETING', l: '营销送券（福袋、观看奖励、签到可关联此券）' },
    { v: 'MALL', l: '商城推荐位' },
    { v: 'MEMBER', l: '会员发券' }
  ];
  var ACTION_LABEL = {
    'coupon.create': '创建优惠券',
    'coupon.save': '保存草稿',
    'coupon.submit': '提交审核',
    'coupon.cancel_audit': '取消审核',
    'coupon.approve': '审核成功',
    'coupon.reject': '审核失败',
    'coupon.enable': '启用',
    'coupon.disable': '禁用'
  };
  var ACTION_URI = {
    'coupon.create': '/marketing-core/v1/coupon/create',
    'coupon.save': '/marketing-core/v1/coupon/update',
    'coupon.submit': '/marketing-core/v1/coupon/submit',
    'coupon.cancel_audit': '/marketing-core/v1/coupon/cancel-audit',
    'coupon.approve': '/marketing-core/v1/coupon/approve',
    'coupon.reject': '/marketing-core/v1/coupon/reject',
    'coupon.enable': '/marketing-core/v1/coupon/activate',
    'coupon.disable': '/marketing-core/v1/coupon/pause'
  };
  var CAT_SOURCE_LABEL = { MALL: '商城', LIVE: '直播' };

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
  var PRODUCT_IMGS = [
    '../user-app/assets/restock/product-leaf.svg',
    '../user-app/assets/restock/product-egg.svg',
    '../user-app/assets/restock/product-tea.svg',
    '../user-app/assets/restock/category-icon-grain.svg',
    '../user-app/assets/restock/category-icon-drink.svg'
  ];

  var PRODUCTS = [
    { id: '1001', spuCode: 'LF-VG-10086', title: '云南高山西红柿', skus: [{ skuCode: 'SKU-001A', skuName: '5斤装' }, { skuCode: 'SKU-001B', skuName: '3斤装' }] },
    { id: '1002', spuCode: 'LF-MT-20011', title: '冷鲜黑猪五花肉', skus: [{ skuCode: 'SKU-002A', skuName: '500g' }] },
    { id: '1003', spuCode: 'LF-FR-30022', title: '烟台红富士苹果', skus: [{ skuCode: 'SKU-003A', skuName: '5斤装' }, { skuCode: 'SKU-003B', skuName: '10斤装' }] },
    { id: '1004', spuCode: 'LF-SN-40008', title: '炭烧腰果', skus: [{ skuCode: 'SKU-004A', skuName: '200g/袋' }] },
    { id: '1005', spuCode: 'LF-EG-50019', title: '土鸡蛋礼盒', skus: [{ skuCode: 'SKU-005A', skuName: '30枚' }, { skuCode: 'SKU-005B', skuName: '60枚' }] },
    { id: '1006', spuCode: 'LF-VG-10087', title: '寿光黄瓜', skus: [{ skuCode: 'SKU-006A', skuName: '1斤装' }, { skuCode: 'SKU-006B', skuName: '3斤装' }] },
    { id: '1007', spuCode: 'LF-VG-10088', title: '有机菠菜', skus: [{ skuCode: 'SKU-007A', skuName: '250g' }] },
    { id: '1008', spuCode: 'LF-FR-30023', title: '海南贵妃芒', skus: [{ skuCode: 'SKU-008A', skuName: '2斤装' }, { skuCode: 'SKU-008B', skuName: '5斤装' }] },
    { id: '1009', spuCode: 'LF-MT-20012', title: '散养鸡腿', skus: [{ skuCode: 'SKU-009A', skuName: '500g' }] },
    { id: '1010', spuCode: 'LF-SF-60001', title: '舟山带鱼段', skus: [{ skuCode: 'SKU-010A', skuName: '400g' }, { skuCode: 'SKU-010B', skuName: '800g' }] },
    { id: '1011', spuCode: 'LF-DR-70001', title: '冷丰鲜榨橙汁', skus: [{ skuCode: 'SKU-011A', skuName: '1L' }] },
    { id: '1012', spuCode: 'LF-GR-80001', title: '东北大米', skus: [{ skuCode: 'SKU-012A', skuName: '5kg' }, { skuCode: 'SKU-012B', skuName: '10kg' }] },
    { id: '1013', spuCode: 'LF-VG-10089', title: '紫皮洋葱', skus: [{ skuCode: 'SKU-013A', skuName: '1kg' }] },
    { id: '1014', spuCode: 'LF-FR-30024', title: '四川猕猴桃', skus: [{ skuCode: 'SKU-014A', skuName: '6粒装' }, { skuCode: 'SKU-014B', skuName: '12粒装' }] },
    { id: '1015', spuCode: 'LF-MT-20013', title: '精品牛腩', skus: [{ skuCode: 'SKU-015A', skuName: '500g' }] },
    { id: '1016', spuCode: 'LF-SN-40009', title: '原味瓜子', skus: [{ skuCode: 'SKU-016A', skuName: '180g' }] },
    { id: '1017', spuCode: 'LF-EG-50020', title: '鲜鸭蛋', skus: [{ skuCode: 'SKU-017A', skuName: '10枚' }, { skuCode: 'SKU-017B', skuName: '20枚' }] },
    { id: '1018', spuCode: 'LF-VG-10090', title: '上海青', skus: [{ skuCode: 'SKU-018A', skuName: '400g' }] },
    { id: '1019', spuCode: 'LF-FR-30025', title: '国产香蕉', skus: [{ skuCode: 'SKU-019A', skuName: '约1kg' }] },
    { id: '1020', spuCode: 'LF-DR-70002', title: '低温鲜奶', skus: [{ skuCode: 'SKU-020A', skuName: '950ml' }, { skuCode: 'SKU-020B', skuName: '1.8L' }] },
    { id: '1021', spuCode: 'LF-GR-80002', title: '花生油', skus: [{ skuCode: 'SKU-021A', skuName: '5L' }] },
    { id: '1022', spuCode: 'LF-SF-60002', title: '明虾', skus: [{ skuCode: 'SKU-022A', skuName: '500g' }, { skuCode: 'SKU-022B', skuName: '1kg' }] },
    { id: '1023', spuCode: 'LF-VG-10091', title: '玉米棒', skus: [{ skuCode: 'SKU-023A', skuName: '4根' }] },
    { id: '1024', spuCode: 'LF-SN-40010', title: '混合坚果', skus: [{ skuCode: 'SKU-024A', skuName: '200g' }, { skuCode: 'SKU-024B', skuName: '400g' }] }
  ].map(function (p, i) {
    p.img = PRODUCT_IMGS[i % PRODUCT_IMGS.length];
    return p;
  });

  var list = [];
  var audits = [];
  var logs = {};
  var recSlots = [];

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
    return String(Date.now()).slice(-10);
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem(AUDIT_KEY, JSON.stringify(audits));
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
      localStorage.setItem(REC_KEY, JSON.stringify(recSlots));
    } catch (e) {
      /* ignore */
    }
  }

  function couponCfg(partial) {
    return Object.assign(
      {
        activityType: 'COUPON',
        couponType: 'FULL_MINUS',
        threshold: 0,
        denomination: 0,
        timeScope: 'UNLIMITED',
        itemScope: 'ALL',
        perUserLimit: null,
        stackable: false
      },
      partial || {}
    );
  }

  function seedCoupons() {
    return [
      {
        id: '10086001',
        name: '满99减10券',
        status: 'ACTIVE',
        applicableChannel: 'ALL',
        issueSceneMode: 'ALL',
        issueScenes: [],
        totalStock: 1000,
        remark: '',
        createdAt: '2026-08-12 10:20:11',
        updatedAt: '2026-08-20 09:12:00',
        submittedAt: '2026-08-12 10:20:11',
        validStart: '2026-08-12 00:00:00',
        validEnd: '2026-12-31 23:59:59',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 99, denomination: 10 })
      },
      {
        id: '10086002',
        name: '新人专享券',
        status: 'APPROVED',
        applicableChannel: 'ALL',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['MEMBER', 'LIVE'],
        totalStock: 300,
        remark: '',
        createdAt: '2026-08-15 14:08:32',
        updatedAt: '2026-08-28 16:40:18',
        submittedAt: '2026-08-28 16:40:18',
        validStart: '2026-08-15 00:00:00',
        validEnd: '2026-11-30 23:59:59',
        config: couponCfg({
          couponType: 'NO_THRESHOLD',
          threshold: 0,
          denomination: 5,
          itemScope: 'GOODS',
          productScopeJson: JSON.stringify({
            type: 'GOODS',
            items: skuScopeItems(PRODUCTS.slice(0, 22))
          }),
          perUserLimit: 1
        })
      },
      {
        id: '10086003',
        name: '果蔬满减券',
        status: 'ACTIVE',
        applicableChannel: 'MALL_ONLY',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['MALL', 'MARKETING'],
        totalStock: 2800,
        remark: '',
        createdAt: '2026-08-18 09:33:05',
        updatedAt: '2026-08-18 09:33:05',
        submittedAt: '2026-08-18 09:33:05',
        validStart: '2026-09-01 00:00:00',
        validEnd: '2026-09-30 23:59:59',
        config: couponCfg({
          couponType: 'FULL_MINUS',
          threshold: 59,
          denomination: 8,
          timeScope: 'SPECIFIC',
          itemScope: 'CATEGORY',
          productScopeJson: JSON.stringify({
            type: 'CATEGORY',
            items: [
              { id: 'mc-1', name: '蔬菜水果', source: 'MALL' },
              { id: 'mc-2', name: '肉禽蛋品', source: 'MALL' },
              { id: 'lcat-001', name: '时令果蔬', source: 'LIVE' },
              { id: 'lcat-002', name: '肉禽蛋奶', source: 'LIVE' },
              { id: 'lcat-003', name: '水产海鲜', source: 'LIVE' }
            ]
          }),
          perUserLimit: 3
        })
      },
      {
        id: '10086010',
        name: '直播专享券',
        status: 'ACTIVE',
        applicableChannel: 'LIVE_ONLY',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['LIVE'],
        totalStock: 4400,
        remark: '',
        createdAt: '2026-08-20 19:00:00',
        updatedAt: '2026-08-20 19:00:00',
        submittedAt: '2026-08-20 19:00:00',
        validStart: '',
        validEnd: '',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 99, denomination: 20 })
      },
      {
        id: '10086011',
        name: '营销福袋券',
        status: 'ACTIVE',
        applicableChannel: 'ALL',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['MARKETING'],
        totalStock: 800,
        remark: '',
        createdAt: '2026-08-21 11:12:00',
        updatedAt: '2026-08-21 11:12:00',
        submittedAt: '2026-08-21 11:12:00',
        config: couponCfg({ couponType: 'NO_THRESHOLD', threshold: 0, denomination: 3 })
      },
      {
        id: '10086012',
        name: '会员关怀券',
        status: 'ACTIVE',
        applicableChannel: 'ALL',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['MEMBER'],
        totalStock: 500,
        remark: '',
        createdAt: '2026-08-22 09:00:00',
        updatedAt: '2026-08-22 09:00:00',
        submittedAt: '2026-08-22 09:00:00',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 50, denomination: 5, perUserLimit: 1 })
      },
      {
        id: '10086013',
        name: '周末草稿券',
        status: 'DRAFT',
        applicableChannel: 'ALL',
        issueSceneMode: '',
        issueScenes: [],
        totalStock: '',
        remark: '',
        createdAt: '2026-09-04 15:20:00',
        updatedAt: '2026-09-04 15:20:00',
        submittedAt: '',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 0, denomination: 0 })
      },
      {
        id: '10086014',
        name: '中秋待审券',
        status: 'PENDING',
        applicableChannel: 'ALL',
        issueSceneMode: 'ALL',
        issueScenes: [],
        totalStock: 2000,
        remark: '',
        createdAt: '2026-09-05 09:10:00',
        updatedAt: '2026-09-05 10:02:00',
        submittedAt: '2026-09-05 10:02:00',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 88, denomination: 12 })
      },
      {
        id: '10086015',
        name: '审核失败券',
        status: 'REJECTED',
        applicableChannel: 'ALL',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['MALL'],
        totalStock: 100,
        remark: '满减金额不能大于消费金额',
        createdAt: '2026-09-03 14:00:00',
        updatedAt: '2026-09-03 16:18:00',
        submittedAt: '2026-09-03 14:30:00',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 10, denomination: 20 })
      },
      {
        id: 'CT10001',
        name: '晚间满减券',
        status: 'ACTIVE',
        applicableChannel: 'ALL',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['LIVE'],
        totalStock: 4400,
        remark: '',
        createdAt: '2026-08-10 18:00:00',
        updatedAt: '2026-08-10 18:00:00',
        submittedAt: '2026-08-10 18:00:00',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 99, denomination: 20 })
      },
      {
        id: 'CT10002',
        name: '果蔬专享券',
        status: 'ACTIVE',
        applicableChannel: 'ALL',
        issueSceneMode: 'ALL',
        issueScenes: [],
        totalStock: 2800,
        remark: '',
        createdAt: '2026-08-11 10:00:00',
        updatedAt: '2026-08-11 10:00:00',
        submittedAt: '2026-08-11 10:00:00',
        config: couponCfg({ couponType: 'NO_THRESHOLD', threshold: 0, denomination: 5, perUserLimit: 3 })
      },
      {
        id: 'CT10003',
        name: '会员日满减券',
        status: 'ACTIVE',
        applicableChannel: 'ALL',
        issueSceneMode: 'SPECIFIC',
        issueScenes: ['MEMBER', 'MALL'],
        totalStock: 4000,
        remark: '',
        createdAt: '2026-08-12 08:00:00',
        updatedAt: '2026-08-12 08:00:00',
        submittedAt: '2026-08-12 08:00:00',
        config: couponCfg({ couponType: 'FULL_MINUS', threshold: 59, denomination: 10, perUserLimit: 2 })
      }
    ];
  }

  function seedAudits() {
    return [
      {
        id: 'AUD-10086014-1',
        couponId: '10086014',
        status: 'PENDING',
        submittedAt: '2026-09-05 10:02:00',
        submittedBy: '张征',
        auditedAt: '',
        auditedBy: '',
        reason: '',
        snapshot: clone(findIn(seedCoupons(), '10086014'))
      },
      {
        id: 'AUD-10086015-1',
        couponId: '10086015',
        status: 'REJECTED',
        submittedAt: '2026-09-03 14:30:00',
        submittedBy: '张征',
        auditedAt: '2026-09-03 16:18:00',
        auditedBy: '审核员小李',
        reason: '满减金额不能大于消费金额',
        snapshot: clone(findIn(seedCoupons(), '10086015'))
      },
      {
        id: 'AUD-10086001-1',
        couponId: '10086001',
        status: 'APPROVED',
        submittedAt: '2026-08-12 10:20:11',
        submittedBy: '张征',
        auditedAt: '2026-08-12 11:00:00',
        auditedBy: '审核员小李',
        reason: '',
        snapshot: clone(findIn(seedCoupons(), '10086001'))
      },
      {
        id: 'AUD-10086002-1',
        couponId: '10086002',
        status: 'APPROVED',
        submittedAt: '2026-08-28 16:40:18',
        submittedBy: '张征',
        auditedAt: '2026-08-28 17:10:00',
        auditedBy: '审核员小李',
        reason: '',
        snapshot: clone(findIn(seedCoupons(), '10086002'))
      },
      {
        id: 'AUD-10086003-1',
        couponId: '10086003',
        status: 'APPROVED',
        submittedAt: '2026-08-18 09:33:05',
        submittedBy: '张征',
        auditedAt: '2026-08-18 10:02:00',
        auditedBy: '审核员小李',
        reason: '',
        snapshot: clone(findIn(seedCoupons(), '10086003'))
      }
    ];
  }

  function seedRecSlots() {
    return [
      { id: 'rec-home-banner', name: '商城首页优惠券推荐位', couponId: '10086003' },
      { id: 'rec-cart', name: '购物车凑单推荐位', couponId: '' },
      { id: 'rec-settle', name: '结算页领券推荐位', couponId: 'CT10003' }
    ];
  }

  function findIn(arr, id) {
    var sid = String(id || '');
    for (var i = 0; i < arr.length; i++) {
      if (String(arr[i].id) === sid) return arr[i];
    }
    return null;
  }

  function logUri(action) {
    return ACTION_URI[action] || '/marketing-core/v1/coupon';
  }

  function makeLog(partial, couponId) {
    var action = partial.action || '';
    var ts = partial.timestamp || partial.time || nowStr();
    return {
      id: partial.id || 'log-' + nextId(),
      timestamp: ts,
      time: ts,
      action: action,
      operator: partial.operator || '张征',
      success: partial.success !== false,
      content: partial.content || ACTION_LABEL[action] || action,
      httpMethod: partial.httpMethod || 'POST',
      requestUri: partial.requestUri || logUri(action),
      clientIp: partial.clientIp || '10.8.12.21',
      service: partial.service || 'marketing-core',
      elapsedMs: partial.elapsedMs != null ? partial.elapsedMs : 30 + Math.floor(Math.random() * 80),
      resource: partial.resource || 'marketing_coupon',
      resourceId: String(partial.resourceId || couponId || ''),
      requestParams: partial.requestParams || JSON.stringify({ id: couponId || '', action: action }),
      changes: Array.isArray(partial.changes) ? partial.changes : []
    };
  }

  function normalizeLog(row, couponId) {
    if (!row) return row;
    return makeLog(row, couponId || row.resourceId);
  }

  function seedLogs() {
    var map = {};
    seedCoupons().forEach(function (item) {
      var recs = [
        makeLog(
          {
            id: 'log-' + item.id + '-1',
            time: item.createdAt,
            action: 'coupon.create',
            operator: '张征',
            content: '创建优惠券',
            changes: [{ field: 'name', oldValue: '', newValue: item.name }]
          },
          item.id
        )
      ];
      if (item.status === 'PENDING' || item.status === 'APPROVED' || item.status === 'REJECTED' || item.status === 'ACTIVE') {
        recs.push(
          makeLog(
            {
              id: 'log-' + item.id + '-2',
              time: item.submittedAt || item.createdAt,
              action: 'coupon.submit',
              operator: '张征',
              content: '提交审核'
            },
            item.id
          )
        );
      }
      if (item.status === 'REJECTED') {
        recs.push(
          makeLog(
            {
              id: 'log-' + item.id + '-3',
              time: item.updatedAt,
              action: 'coupon.reject',
              operator: '审核员小李',
              content: '审核失败：' + (item.remark || '')
            },
            item.id
          )
        );
      }
      if (item.status === 'APPROVED' || item.status === 'ACTIVE') {
        recs.push(
          makeLog(
            {
              id: 'log-' + item.id + '-3',
              time: item.updatedAt,
              action: 'coupon.approve',
              operator: '审核员小李',
              content: '审核成功'
            },
            item.id
          )
        );
      }
      if (item.status === 'ACTIVE') {
        recs.push(
          makeLog(
            {
              id: 'log-' + item.id + '-4',
              time: item.updatedAt,
              action: 'coupon.enable',
              operator: '张征',
              content: '启用优惠券',
              changes: [{ field: 'status', oldValue: 'APPROVED', newValue: 'ACTIVE' }]
            },
            item.id
          )
        );
      }
      recs.sort(function (a, b) {
        return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
      });
      map[item.id] = recs;
    });
    return map;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      list = raw ? JSON.parse(raw) : seedCoupons();
      var araw = localStorage.getItem(AUDIT_KEY);
      audits = araw ? JSON.parse(araw) : seedAudits();
      var lraw = localStorage.getItem(LOG_KEY);
      logs = lraw ? JSON.parse(lraw) : seedLogs();
      var rraw = localStorage.getItem(REC_KEY);
      recSlots = rraw ? JSON.parse(rraw) : seedRecSlots();
    } catch (e) {
      list = seedCoupons();
      audits = seedAudits();
      logs = seedLogs();
      recSlots = seedRecSlots();
    }
    if (!Array.isArray(list) || !list.length) list = seedCoupons();
    if (!Array.isArray(audits)) audits = seedAudits();
    if (!logs || typeof logs !== 'object') logs = seedLogs();
    if (!Array.isArray(recSlots) || !recSlots.length) recSlots = seedRecSlots();
  }

  function pushLog(item, action, content, extra) {
    var id = String(item.id);
    if (!logs[id]) logs[id] = [];
    logs[id].unshift(
      makeLog(
        {
          action: action,
          content: content || ACTION_LABEL[action] || action,
          requestParams: JSON.stringify(extra || { id: id, action: action })
        },
        id
      )
    );
  }

  function statusLabel(v) {
    return STATUS_LABEL[v] || v || '—';
  }

  function auditStatusLabel(v) {
    return AUDIT_STATUS_LABEL[v] || v || '—';
  }

  function channelLabel(v) {
    return v ? CHANNEL_LABEL[v] || v : '—';
  }

  function scopeLabel(v) {
    return v ? SCOPE_LABEL[v] || v : '—';
  }

  function categorySourceLabel(v) {
    return CAT_SOURCE_LABEL[v] || v || '—';
  }

  function sceneLabel(v) {
    return SCENE_LABEL[v] || v || '';
  }

  function issueSceneText(item) {
    if (!item) return '—';
    if (item.issueSceneMode === 'ALL') return '全部';
    if (item.issueSceneMode === 'SPECIFIC') {
      var arr = item.issueScenes || [];
      if (!arr.length) return '指定场景';
      return arr
        .map(function (s) {
          return sceneLabel(s);
        })
        .filter(Boolean)
        .join('、');
    }
    return '—';
  }

  function faceValueText(item) {
    var cfg = (item && item.config) || {};
    var n = Number(cfg.denomination || 0);
    if (!n) return '—';
    return '减' + n + '元';
  }

  function thresholdText(item) {
    var cfg = (item && item.config) || {};
    if (cfg.couponType === 'NO_THRESHOLD' || !Number(cfg.threshold || 0)) return '无门槛';
    return '满' + Number(cfg.threshold) + '元';
  }

  function parseScope(item) {
    var cfg = (item && item.config) || {};
    try {
      var parsed = typeof cfg.productScopeJson === 'string' ? JSON.parse(cfg.productScopeJson) : cfg.productScopeJson;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {
      /* ignore */
    }
    return { type: cfg.itemScope || 'ALL', items: [] };
  }

  function skuScopeItems(products) {
    var items = [];
    (products || []).forEach(function (p) {
      (p.skus || []).forEach(function (s) {
        items.push({
          id: s.skuCode,
          label: p.title + '（' + s.skuName + '（' + s.skuCode + '））',
          spuCode: p.spuCode,
          skuCode: s.skuCode,
          skuName: s.skuName,
          spuId: p.id,
          name: p.title
        });
      });
    });
    return items;
  }

  function findProductBySku(skuCode) {
    var code = String(skuCode || '');
    var i;
    var j;
    for (i = 0; i < PRODUCTS.length; i++) {
      var p = PRODUCTS[i];
      var skus = p.skus || [];
      for (j = 0; j < skus.length; j++) {
        if (skus[j].skuCode === code) return { product: p, sku: skus[j] };
      }
    }
    return null;
  }

  function groupSkuItems(items) {
    var map = {};
    var order = [];
    (items || []).forEach(function (n) {
      var found = findProductBySku(n.skuCode || n.id);
      var p = found ? found.product : null;
      var sku = found ? found.sku : null;
      var key = p ? String(p.id) : String(n.spuId || n.spuCode || n.id || '');
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          id: key,
          name: p ? p.title : String(n.name || n.label || '商品'),
          spuCode: p ? p.spuCode : String(n.spuCode || ''),
          img: p && p.img ? p.img : '',
          skus: []
        };
        order.push(key);
      }
      map[key].skus.push({
        skuCode: sku ? sku.skuCode : String(n.skuCode || n.id || ''),
        skuName: sku ? sku.skuName : String(n.skuName || ''),
        label: n.label || (sku ? sku.skuName + '（' + sku.skuCode + '）' : String(n.id || ''))
      });
    });
    return order.map(function (k) {
      return map[k];
    });
  }

  function groupGoodsOf(item) {
    var scope = parseScope(item);
    if (scope.type !== 'GOODS' && (item.config || {}).itemScope !== 'GOODS') return [];
    return groupSkuItems(scope.items || []);
  }

  function categoryItemsOf(item) {
    var scope = parseScope(item);
    if (scope.type === 'CATEGORY' && Array.isArray(scope.items)) return scope.items;
    return [];
  }

  function scopeText(item) {
    var cfg = (item && item.config) || {};
    var scope = cfg.itemScope || 'ALL';
    if (scope === 'ALL') return '全部商品';
    if (scope === 'CATEGORY') {
      var cats = categoryItemsOf(item);
      return '指定类目（' + cats.length + '）';
    }
    var goods = groupGoodsOf(item);
    return goods.length ? goods.length + '个商品' : '指定商品（0）';
  }

  function validPeriodText(item) {
    var cfg = (item && item.config) || {};
    if (cfg.timeScope === 'SPECIFIC' && (item.validStart || item.validEnd)) {
      return String(item.validStart || '').slice(0, 16) + ' ~ ' + String(item.validEnd || '').slice(0, 16);
    }
    return '领取后不限制';
  }

  function collectLimitText(item) {
    var cfg = (item && item.config) || {};
    if (cfg.perUserLimit) return '每人' + cfg.perUserLimit + '次';
    return '不限';
  }

  function matchesScene(item, scene) {
    if (!item || item.status !== 'ACTIVE') return false;
    if (!scene) return true;
    if (item.issueSceneMode === 'ALL') return true;
    if (item.issueSceneMode === 'SPECIFIC') {
      return (item.issueScenes || []).indexOf(scene) >= 0;
    }
    return false;
  }

  function findById(id) {
    return findIn(list, id);
  }

  function findAudit(id) {
    return findIn(audits, id);
  }

  function latestAuditOf(couponId, status) {
    var sid = String(couponId || '');
    var found = null;
    audits.forEach(function (a) {
      if (String(a.couponId) !== sid) return;
      if (status && a.status !== status) return;
      if (!found || String(a.submittedAt || '') > String(found.submittedAt || '')) found = a;
    });
    return found;
  }

  function listRows(query) {
    var q = query || {};
    var name = String(q.name || '').trim();
    var status = String(q.status || '');
    var scene = String(q.scene || '');
    var scope = String(q.itemScope || '');
    var rows = list.filter(function (item) {
      if (name && String(item.name || '').indexOf(name) < 0 && String(item.id || '').indexOf(name) < 0) return false;
      if (status && item.status !== status) return false;
      if (scope && String((item.config && item.config.itemScope) || 'ALL') !== scope) return false;
      if (scene) {
        if (item.issueSceneMode === 'ALL') return true;
        if (item.issueSceneMode !== 'SPECIFIC') return false;
        if ((item.issueScenes || []).indexOf(scene) < 0) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    return rows;
  }

  function listAuditRows(query) {
    var q = query || {};
    var id = String(q.couponId || '').trim();
    var name = String(q.name || '').trim();
    var face = String(q.faceValue || '').trim();
    var channel = String(q.channel || '');
    var status = String(q.status || '');
    var rows = audits.filter(function (a) {
      var item = a.snapshot || findById(a.couponId) || {};
      if (id && String(item.id || a.couponId || '').indexOf(id) < 0) return false;
      if (name && String(item.name || '').indexOf(name) < 0) return false;
      if (channel && item.applicableChannel !== channel) return false;
      if (status && a.status !== status) return false;
      if (face) {
        var fv = faceValueText(item);
        if (fv.indexOf(face) < 0 && String((item.config && item.config.denomination) || '').indexOf(face) < 0) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
    });
    return rows;
  }

  function listSelectable(scene) {
    return list.filter(function (item) {
      return matchesScene(item, scene);
    });
  }

  function toLivePickerItem(item) {
    var cfg = (item && item.config) || {};
    return {
      id: item.id,
      name: item.name,
      threshold: Number(cfg.threshold || 0),
      denomination: Number(cfg.denomination || 0),
      status: item.status === 'ACTIVE' ? 'enabled' : 'disabled',
      stock: Number(item.totalStock || 0),
      channel: channelLabel(item.applicableChannel),
      validPeriod: validPeriodText(item),
      collectLimit: collectLimitText(item),
      perUserLimit: cfg.perUserLimit || null
    };
  }

  function toMemberPickerItem(item) {
    return {
      id: item.id,
      value: item.name,
      label: item.name,
      amount: faceValueText(item),
      threshold: thresholdText(item),
      channel: channelLabel(item.applicableChannel),
      validPeriod: validPeriodText(item),
      collectLimit: collectLimitText(item),
      stock: String(item.totalStock == null || item.totalStock === '' ? '0' : item.totalStock),
      expired: false
    };
  }

  function couponOptionLabel(item) {
    var scope = scopeLabel((item.config && item.config.itemScope) || '');
    var name = item.name || item.id;
    return scope && scope !== '-' ? name + ' [' + scope + ']' : name;
  }

  function buildProductScope(model) {
    if (model.itemScope === 'GOODS') {
      return JSON.stringify({ type: 'GOODS', items: model.productSkus || [] });
    }
    if (model.itemScope === 'CATEGORY') {
      return JSON.stringify({ type: 'CATEGORY', items: model.selectedCategories || [] });
    }
    return '';
  }

  function applyModel(item, model) {
    item.name = String(model.name || '').trim();
    item.applicableChannel = model.applicableChannel || 'ALL';
    item.issueSceneMode = model.issueSceneMode || '';
    item.issueScenes = model.issueSceneMode === 'SPECIFIC' ? (model.issueScenes || []).slice() : [];
    item.totalStock = model.totalStock === '' || model.totalStock == null ? '' : Number(model.totalStock);
    item.config = couponCfg({
      couponType: model.couponType || 'FULL_MINUS',
      threshold: Number(model.threshold || 0),
      denomination: Number(model.denomination || 0),
      timeScope: model.timeScope || 'UNLIMITED',
      itemScope: model.itemScope || 'ALL',
      productScopeJson: buildProductScope(model),
      perUserLimit: model.claimLimitMode === 'LIMITED' ? Number(model.perUserLimit || 1) : null
    });
    if (model.timeScope === 'SPECIFIC') {
      item.validStart = String(model.timeStart || '').replace('T', ' ');
      item.validEnd = String(model.timeEnd || '').replace('T', ' ');
      if (item.validStart && item.validStart.length === 16) item.validStart += ':00';
      if (item.validEnd && item.validEnd.length === 16) item.validEnd += ':00';
    } else {
      item.validStart = '';
      item.validEnd = '';
    }
  }

  function saveDraft(id, model) {
    var item = id ? findById(id) : null;
    var isNew = !item;
    if (!item) {
      item = {
        id: nextId(),
        name: '',
        status: 'DRAFT',
        applicableChannel: 'ALL',
        issueSceneMode: '',
        issueScenes: [],
        totalStock: '',
        remark: '',
        createdAt: nowStr(),
        updatedAt: nowStr(),
        submittedAt: '',
        config: couponCfg()
      };
      list.unshift(item);
    }
    applyModel(item, model);
    item.status = 'DRAFT';
    item.updatedAt = nowStr();
    pushLog(item, isNew ? 'coupon.create' : 'coupon.save', isNew ? '创建并保存草稿' : '保存草稿');
    persist();
    return item;
  }

  function submitCoupon(id, model) {
    var item = id ? findById(id) : null;
    var isNew = !item;
    if (!item) {
      item = {
        id: nextId(),
        name: '',
        status: 'DRAFT',
        applicableChannel: 'ALL',
        issueSceneMode: '',
        issueScenes: [],
        totalStock: '',
        remark: '',
        createdAt: nowStr(),
        updatedAt: nowStr(),
        submittedAt: '',
        config: couponCfg()
      };
      list.unshift(item);
    }
    applyModel(item, model);
    item.status = 'PENDING';
    item.remark = '';
    item.submittedAt = nowStr();
    item.updatedAt = item.submittedAt;
    var audit = {
      id: 'AUD-' + item.id + '-' + nextId().slice(-6),
      couponId: item.id,
      status: 'PENDING',
      submittedAt: item.submittedAt,
      submittedBy: '张征',
      auditedAt: '',
      auditedBy: '',
      reason: '',
      snapshot: clone(item)
    };
    audits.unshift(audit);
    pushLog(item, isNew ? 'coupon.create' : 'coupon.submit', '提交审核，生成审核记录 ' + audit.id);
    persist();
    return { item: item, audit: audit };
  }

  function cancelAudit(id) {
    var item = findById(id);
    if (!item || item.status !== 'PENDING') return null;
    var audit = latestAuditOf(item.id, 'PENDING');
    if (audit) {
      audit.status = 'CANCELLED';
      audit.auditedAt = nowStr();
      audit.auditedBy = '张征';
    }
    item.status = 'DRAFT';
    item.updatedAt = nowStr();
    pushLog(item, 'coupon.cancel_audit', '取消审核，优惠券回到草稿');
    persist();
    return item;
  }

  function approveAudit(auditId) {
    var audit = findAudit(auditId);
    if (!audit || audit.status !== 'PENDING') return null;
    audit.status = 'APPROVED';
    audit.auditedAt = nowStr();
    audit.auditedBy = '审核员小李';
    audit.reason = '';
    var item = findById(audit.couponId);
    if (item) {
      item.status = 'APPROVED';
      item.remark = '';
      item.updatedAt = audit.auditedAt;
      pushLog(item, 'coupon.approve', '审核成功');
    }
    persist();
    return { item: item, audit: audit };
  }

  function rejectAudit(auditId, reason) {
    var audit = findAudit(auditId);
    if (!audit || audit.status !== 'PENDING') return null;
    var why = String(reason || '').trim();
    audit.status = 'REJECTED';
    audit.auditedAt = nowStr();
    audit.auditedBy = '审核员小李';
    audit.reason = why;
    var item = findById(audit.couponId);
    if (item) {
      item.status = 'REJECTED';
      item.remark = why;
      item.updatedAt = audit.auditedAt;
      pushLog(item, 'coupon.reject', '审核失败：' + why);
    }
    persist();
    return { item: item, audit: audit };
  }

  function enableCoupon(id) {
    var item = findById(id);
    if (!item || item.status !== 'APPROVED') return null;
    item.status = 'ACTIVE';
    item.updatedAt = nowStr();
    pushLog(item, 'coupon.enable', '启用优惠券');
    persist();
    return item;
  }

  function disableCoupon(id) {
    var item = findById(id);
    if (!item || item.status !== 'ACTIVE') return null;
    item.status = 'APPROVED';
    item.updatedAt = nowStr();
    pushLog(item, 'coupon.disable', '禁用，状态回到审核成功');
    persist();
    return item;
  }

  function listLogs(couponId, pageNum, pageSize) {
    var all = (logs[String(couponId)] || []).map(function (row) {
      return normalizeLog(row, couponId);
    });
    all.sort(function (a, b) {
      return String(b.timestamp || b.time || '').localeCompare(String(a.timestamp || a.time || ''));
    });
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
        if (String(arr[j].id) === String(logId)) return normalizeLog(arr[j], keys[i]);
      }
    }
    return null;
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

  function listRecSlots() {
    return recSlots.slice();
  }

  function bindRecCoupon(slotId, couponId) {
    recSlots.forEach(function (s) {
      if (s.id === slotId) s.couponId = couponId || '';
    });
    persist();
    return findIn(recSlots, slotId);
  }

  function deductStock(id, qty) {
    var item = findById(id);
    var n = Math.floor(Number(qty) || 0);
    if (!item || n < 1) return false;
    var stock = Number(item.totalStock || 0);
    if (stock < n) return false;
    item.totalStock = stock - n;
    persist();
    return true;
  }

  load();

  global.MdmMarketingCouponStore = {
    STATUS_LABEL: STATUS_LABEL,
    AUDIT_STATUS_LABEL: AUDIT_STATUS_LABEL,
    CHANNEL_LABEL: CHANNEL_LABEL,
    SCOPE_LABEL: SCOPE_LABEL,
    COUPON_TYPE_LABEL: COUPON_TYPE_LABEL,
    SCENE_LABEL: SCENE_LABEL,
    SCENE_OPTIONS: SCENE_OPTIONS,
    ACTION_LABEL: ACTION_LABEL,
    CAT_SOURCE_LABEL: CAT_SOURCE_LABEL,
    statusLabel: statusLabel,
    auditStatusLabel: auditStatusLabel,
    channelLabel: channelLabel,
    scopeLabel: scopeLabel,
    categorySourceLabel: categorySourceLabel,
    sceneLabel: sceneLabel,
    issueSceneText: issueSceneText,
    faceValueText: faceValueText,
    thresholdText: thresholdText,
    scopeText: scopeText,
    groupGoodsOf: groupGoodsOf,
    groupSkuItems: groupSkuItems,
    categoryItemsOf: categoryItemsOf,
    validPeriodText: validPeriodText,
    collectLimitText: collectLimitText,
    matchesScene: matchesScene,
    listRows: listRows,
    listAuditRows: listAuditRows,
    listSelectable: listSelectable,
    findById: findById,
    findAudit: findAudit,
    latestAuditOf: latestAuditOf,
    saveDraft: saveDraft,
    submitCoupon: submitCoupon,
    cancelAudit: cancelAudit,
    approveAudit: approveAudit,
    rejectAudit: rejectAudit,
    enableCoupon: enableCoupon,
    disableCoupon: disableCoupon,
    listLogs: listLogs,
    findLog: findLog,
    searchProducts: searchProducts,
    categoriesOf: categoriesOf,
    toLivePickerItem: toLivePickerItem,
    toMemberPickerItem: toMemberPickerItem,
    couponOptionLabel: couponOptionLabel,
    listRecSlots: listRecSlots,
    bindRecCoupon: bindRecCoupon,
    deductStock: deductStock,
    nowStr: nowStr
  };
})(window);
