/**
 * 直播模块共享演示数据（各列表页复用，内存可变，刷新重置）
 */
(function () {
  'use strict';

  var rooms = [
    {
      id: 'room-001',
      name: '冷丰生鲜晚间专场',
      status: 'enabled',
      streamChannel: '推流通道-A1',
      anchorUserId: '10086001',
      anchorName: '小丰主播',
      createdAt: '2026-05-12 10:20:00'
    },
    {
      id: 'room-002',
      name: '产地直采上午场',
      status: 'enabled',
      streamChannel: '推流通道-B2',
      anchorUserId: '10086002',
      anchorName: '产地小哥',
      createdAt: '2026-05-18 09:05:00'
    },
    {
      id: 'room-003',
      name: '会员日限时直播间',
      status: 'disabled',
      streamChannel: '推流通道-C3',
      anchorUserId: '10086003',
      anchorName: '会员管家',
      createdAt: '2026-06-01 14:30:00'
    },
    {
      id: 'room-004',
      name: '区域团购试播间',
      status: 'stopped',
      streamChannel: '推流通道-D4',
      anchorUserId: '10086004',
      anchorName: '区域达人',
      createdAt: '2026-04-22 16:45:00'
    }
  ];

  var timeslots = [
    { id: 'slot-001', name: '早市档（08:00-10:00）', bindCount: 3, createdAt: '2026-05-01 11:00:00' },
    { id: 'slot-002', name: '午间档（11:30-13:00）', bindCount: 1, createdAt: '2026-05-01 11:05:00' },
    { id: 'slot-003', name: '晚间黄金档（19:00-21:30）', bindCount: 5, createdAt: '2026-05-01 11:10:00' },
    { id: 'slot-004', name: '夜宵档（21:30-23:00）', bindCount: 0, createdAt: '2026-06-10 09:20:00' }
  ];

  var demoStores = [
    { id: 'store-001', name: '冷丰生鲜·城东店' },
    { id: 'store-002', name: '冷丰生鲜·高新店' },
    { id: 'store-003', name: '冷丰生鲜·滨江店' },
    { id: 'store-004', name: '冷丰生鲜·大学城店' }
  ];

  var demoRegions = [
    { code: '330100', label: '浙江省 杭州市（全市）' },
    { code: '330102', label: '浙江省 杭州市 上城区' },
    { code: '330106', label: '浙江省 杭州市 西湖区' },
    { code: '330200', label: '浙江省 宁波市（全市）' }
  ];

  function defaultTemplates() {
    return [];
  }

  var sessions = [
    {
      id: 'sess-001',
      name: '8.11 晚间生鲜专场',
      roomId: 'room-001',
      roomName: '冷丰生鲜晚间专场',
      slotId: 'slot-003',
      slotName: '晚间黄金档（19:00-21:30）',
      type: 'regular',
      typeName: '常规场',
      liveType: 'OFFICIAL',
      liveTypeName: '官方直播',
      status: 'live',
      startAt: '2026-08-11 19:00:00',
      endAt: '2026-08-11 21:30:00',
      actualStartAt: '2026-08-11 19:02:18',
      actualEndAt: '',
      anchorUserId: '10086001',
      anchorName: '小丰主播',
      cover: '',
      intro: '今晚主打产地直采果蔬与冷鲜肉，限时秒杀不断档。',
      viewPermission: 'ALL',
      regions: [],
      stores: [],
      pushUrl: 'rtmp://push.demo.lengfeng.com/live/sess-001?txSecret=****',
      playUrl: 'https://play.demo.lengfeng.com/live/sess-001.m3u8',
      templates: [
        {
          id: 'tpl-c1',
          type: 'COUPON',
          typeName: '优惠券',
          planId: 'tpl-c1',
          activityId: 'act-c1',
          templateId: 'CT10001',
          deliveredCount: 2,
          issuedQty: 8,
          roundCount: 2,
          quotaTotal: 500,
          released: false,
          releasedQty: null,
          activeWindowId: 'win-c1-2',
          stock: 500
        },
        {
          id: 'tpl-c2',
          type: 'COUPON',
          typeName: '优惠券',
          planId: 'tpl-c2',
          activityId: 'act-c2',
          templateId: 'CT10002',
          deliveredCount: 0,
          issuedQty: 0,
          roundCount: 0,
          quotaTotal: 200,
          released: false,
          releasedQty: null,
          stock: 200
        },
        {
          id: 'tpl-c1b',
          type: 'COUPON',
          typeName: '优惠券',
          planId: 'tpl-c1b',
          activityId: 'act-c1b',
          templateId: 'CT10001',
          deliveredCount: 1,
          issuedQty: 100,
          roundCount: 1,
          quotaTotal: 100,
          released: false,
          releasedQty: null,
          stock: 100
        },
        {
          id: 'tpl-c-off',
          type: 'COUPON',
          typeName: '优惠券',
          planId: 'tpl-c-off',
          activityId: 'act-c-off',
          templateId: 'CT10004',
          deliveredCount: 0,
          issuedQty: 0,
          roundCount: 0,
          quotaTotal: 50,
          released: false,
          releasedQty: null,
          stock: 50
        },
        {
          id: 'tpl-b1',
          type: 'FORTUNE_BAG',
          typeName: '福袋',
          planId: 'tpl-b1',
          activityId: 'act-b1',
          templateId: 'BT10003',
          deliveredCount: 2,
          issuedQty: 6,
          roundCount: 2,
          quotaTotal: 200,
          released: false,
          releasedQty: null,
          activeWindowId: 'win-b1-2',
          stock: 200
        },
        {
          id: 'tpl-b1b',
          type: 'FORTUNE_BAG',
          typeName: '福袋',
          planId: 'tpl-b1b',
          activityId: 'act-b1b',
          templateId: 'BT10003',
          deliveredCount: 0,
          issuedQty: 0,
          roundCount: 0,
          quotaTotal: 50,
          released: false,
          releasedQty: null,
          stock: 50
        },
        {
          id: 'tpl-b-pt',
          type: 'FORTUNE_BAG',
          typeName: '福袋',
          planId: 'tpl-b-pt',
          activityId: 'act-b-pt',
          templateId: 'BT10002',
          deliveredCount: 0,
          issuedQty: 0,
          roundCount: 0,
          quotaTotal: 80,
          released: false,
          releasedQty: null,
          stock: 80
        },
        {
          id: 'tpl-b-cp',
          type: 'FORTUNE_BAG',
          typeName: '福袋',
          planId: 'tpl-b-cp',
          activityId: 'act-b-cp',
          templateId: 'BT10001',
          deliveredCount: 0,
          issuedQty: 0,
          roundCount: 0,
          quotaTotal: 40,
          released: false,
          releasedQty: null,
          stock: 40
        },
        {
          id: 'tpl-s-live',
          type: 'SIGN_IN',
          typeName: '签到',
          planId: 'tpl-s-live',
          activityId: 'act-s-live',
          templateId: 'ST10001',
          deliveredCount: 186,
          roundsUsed: 2,
          interrupted: false,
          activeWindowId: null,
          stock: null
        },
        {
          id: 'tpl-s-dup',
          type: 'SIGN_IN',
          typeName: '签到',
          planId: 'tpl-s-dup',
          activityId: 'act-s-dup',
          templateId: 'ST10001',
          deliveredCount: 0,
          roundsUsed: 0,
          interrupted: false,
          activeWindowId: null,
          stock: null
        },
        {
          id: 'tpl-t-live',
          type: 'TASK',
          typeName: '观看奖励',
          planId: 'tpl-t-live',
          activityId: 'act-t-live',
          templateId: 'WT10001',
          delivered: true,
          interrupted: false,
          deliveredCount: 86,
          activeWindowId: 'win-t-live',
          stock: null
        },
        {
          id: 'tpl-t-dup',
          type: 'TASK',
          typeName: '观看奖励',
          planId: 'tpl-t-dup',
          activityId: 'act-t-dup',
          templateId: 'WT10001',
          delivered: false,
          interrupted: false,
          deliveredCount: 0,
          activeWindowId: null,
          stock: null
        }
      ],
      bagWinRule: 'session',
      autoCloseEnabled: false,
      autoCloseAt: '',
      cViewerDisplay: 'online',
      cViewerInitial: 18,
      cViewerExtraMin: 1,
      cViewerExtraMax: 3,
      createStatus: 'ENABLED',
      remark: '',
      createdAt: '2026-08-10 15:20:00'
    },
    {
      id: 'sess-002',
      name: '8.12 产地直采早市',
      roomId: 'room-002',
      roomName: '产地直采上午场',
      slotId: 'slot-001',
      slotName: '早市档（08:00-10:00）',
      type: 'origin',
      typeName: '产地专场',
      liveType: 'REGION',
      liveTypeName: '区域直播',
      status: 'upcoming',
      startAt: '2026-08-12 08:00:00',
      endAt: '2026-08-12 10:00:00',
      actualStartAt: '',
      actualEndAt: '',
      anchorUserId: '10086002',
      anchorName: '产地小哥',
      cover: '',
      intro: '早市产地专场，覆盖杭甬核心城区。',
      viewPermission: 'ALL',
      regions: [
        { code: '440100', label: '广东省 / 广州市（全市）' },
        { code: '440300', label: '广东省 / 深圳市（全市）' }
      ],
      saleRegions: {
        '440101': true,
        '440102': true,
        '440103': true,
        '440104': true,
        '440105': true,
        '440301': true,
        '440302': true,
        '440303': true,
        '440304': true,
        '440305': true
      },
      saleRegionSummary: [
        { id: '440100', label: '广东省 / 广州市（全市）' },
        { id: '440300', label: '广东省 / 深圳市（全市）' }
      ],
      stores: [],
      saleStores: {},
      pushUrl: 'rtmp://push.demo.lengfeng.com/live/sess-002?txSecret=****',
      playUrl: 'https://play.demo.lengfeng.com/live/sess-002.m3u8',
      templates: [],
      autoCloseEnabled: false,
      autoCloseAt: '',
      cViewerDisplay: 'online',
      cViewerInitial: 0,
      cViewerExtraMin: 0,
      cViewerExtraMax: 0,
      createStatus: 'ENABLED',
      remark: '区域试播',
      createdAt: '2026-08-11 09:40:00'
    },
    {
      id: 'sess-003',
      name: '8.10 会员日闪购',
      roomId: 'room-003',
      roomName: '会员日限时直播间',
      slotId: 'slot-002',
      slotName: '午间档（11:30-13:00）',
      type: 'member',
      typeName: '会员专场',
      liveType: 'TARGETED',
      liveTypeName: '定向直播',
      status: 'ended',
      startAt: '2026-08-10 11:30:00',
      endAt: '2026-08-10 13:00:00',
      actualStartAt: '2026-08-10 11:33:05',
      actualEndAt: '2026-08-10 13:08:42',
      anchorUserId: '10086003',
      anchorName: '会员管家',
      cover: '',
      intro: '会员日定向门店闪购场。',
      viewPermission: 'STORE_MEMBER',
      regions: [],
      stores: [
        { id: 'st-001', name: '振宁十足' },
        { id: 'st-002', name: '萧山万达店' }
      ],
      saleStores: { 'st-001': true, 'st-002': true },
      pushUrl: 'rtmp://push.demo.lengfeng.com/live/sess-003?txSecret=****',
      playUrl: 'https://play.demo.lengfeng.com/live/sess-003.m3u8',
      templates: [
        {
          id: 'tpl-s1',
          type: 'SIGN_IN',
          typeName: '签到',
          planId: 'tpl-s1',
          activityId: 'act-s1',
          templateId: 'ST10002',
          deliveredCount: 412,
          roundsUsed: 3,
          interrupted: false,
          activeWindowId: null,
          stock: null
        },
        {
          id: 'tpl-c3',
          type: 'COUPON',
          typeName: '优惠券',
          planId: 'tpl-c3',
          activityId: 'act-c3',
          templateId: 'CT10003',
          deliveredCount: 3,
          issuedQty: 12,
          roundCount: 3,
          quotaTotal: 300,
          released: true,
          releasedQty: 288,
          stock: 300
        },
        {
          id: 'tpl-b3',
          type: 'FORTUNE_BAG',
          typeName: '福袋',
          planId: 'tpl-b3',
          activityId: 'act-b3',
          templateId: 'BT10001',
          deliveredCount: 2,
          issuedQty: 6,
          roundCount: 2,
          quotaTotal: 80,
          released: true,
          releasedQty: 74,
          activeWindowId: null,
          stock: 80
        },
        {
          id: 'tpl-t3',
          type: 'TASK',
          typeName: '观看奖励',
          planId: 'tpl-t3',
          activityId: 'act-t3',
          templateId: 'WT10002',
          delivered: true,
          interrupted: false,
          deliveredCount: 268,
          activeWindowId: null,
          stock: null
        }
      ],
      autoCloseEnabled: false,
      autoCloseAt: '',
      cViewerDisplay: 'unique',
      cViewerInitial: 0,
      cViewerExtraMin: 0,
      cViewerExtraMax: 0,
      createStatus: 'ENABLED',
      remark: '已结束归档',
      createdAt: '2026-08-09 10:00:00'
    },
    {
      id: 'sess-004',
      name: '8.13 夜宵速达场',
      roomId: 'room-001',
      roomName: '冷丰生鲜晚间专场',
      slotId: 'slot-004',
      slotName: '夜宵档（21:30-23:00）',
      type: 'flash',
      typeName: '闪购场',
      liveType: 'OFFICIAL',
      liveTypeName: '官方直播',
      status: 'upcoming',
      startAt: '2026-08-13 21:30:00',
      endAt: '2026-08-13 23:00:00',
      actualStartAt: '',
      actualEndAt: '',
      anchorUserId: '10086001',
      anchorName: '小丰主播',
      cover: '',
      intro: '',
      viewPermission: 'ALL',
      regions: [],
      stores: [],
      pushUrl: 'rtmp://push.demo.lengfeng.com/live/sess-004?txSecret=****',
      playUrl: 'https://play.demo.lengfeng.com/live/sess-004.m3u8',
      templates: defaultTemplates(),
      autoCloseEnabled: false,
      autoCloseAt: '',
      cViewerDisplay: 'visits',
      cViewerInitial: 0,
      cViewerExtraMin: 0,
      cViewerExtraMax: 0,
      createStatus: 'DRAFT',
      remark: '',
      createdAt: '2026-08-11 18:10:00'
    }
  ];

  var categories = [
    { id: 'lcat-001', name: '时令果蔬', sort: 1, enabled: true },
    { id: 'lcat-002', name: '肉禽蛋奶', sort: 2, enabled: true },
    { id: 'lcat-003', name: '水产海鲜', sort: 3, enabled: true },
    { id: 'lcat-004', name: '粮油干货', sort: 4, enabled: false },
    { id: 'lcat-005', name: '爆款秒杀', sort: 5, enabled: true }
  ];

  function normalizeSchedStatus(st) {
    if (st === 'enabled' || st === 'on_shelf' || st === 'listing') return 'enabled';
    if (st === 'disabled' || st === 'off_shelf' || st === 'delisting') return 'disabled';
    return 'draft';
  }

  function makeSku(overrides) {
    return Object.assign(
      {
        id: 'sku-' + Math.random().toString(36).slice(2, 8),
        specName: '默认规格',
        price: 9.9,
        marketPrice: 19.9,
        stock: 100,
        minQty: 1,
        limitQty: '',
        bundleMode: '',
        bundlePoints: '',
        bundleCash: '',
        unit: '份',
        saleCoeff: 1,
        enabled: true
      },
      overrides || {}
    );
  }

  var productsBySession = {
    'sess-001': [
      {
        id: 'lp-001',
        sessionId: 'sess-001',
        sku: 'LF-VG-10086',
        name: '云南高山西红柿',
        category: '时令果蔬',
        categoryId: 'lcat-001',
        spec: '5斤装',
        price: 19.9,
        marketPrice: 29.9,
        stock: 860,
        status: 'enabled',
        liveStatus: 'explaining',
        inCart: true,
        saleMode: 'selling',
        explaining: true,
        pinned: false,
        cartSort: 1,
        addedAt: '2026-08-10 16:20:00',
        img: '',
        desc: '高原日照充足，口感沙甜多汁。',
        arrivalTime: '2',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-001a',
            specName: '5斤装',
            price: 19.9,
            marketPrice: 29.9,
            stock: 860,
            unit: '箱'
          }),
          makeSku({
            id: 'sku-001b',
            specName: '3斤装',
            price: 12.9,
            marketPrice: 18.9,
            stock: 420,
            unit: '箱',
            enabled: false
          })
        ]
      },
      {
        id: 'lp-002',
        sessionId: 'sess-001',
        sku: 'LF-MT-20011',
        name: '冷鲜黑猪五花肉',
        category: '肉禽蛋奶',
        categoryId: 'lcat-002',
        spec: '500g',
        price: 28.8,
        marketPrice: 36.0,
        stock: 320,
        status: 'enabled',
        liveStatus: 'displaying',
        inCart: true,
        saleMode: 'selling',
        explaining: false,
        pinned: true,
        cartSort: 2,
        addedAt: '2026-08-10 16:25:00',
        img: '',
        desc: '冷鲜到店，肥瘦均匀。',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'CUSTOM',
        displaySales: '1280',
        purchaseLimitType: 'ORDER',
        purchaseLimit: '5',
        skus: [
          makeSku({
            id: 'sku-002a',
            specName: '500g',
            price: 28.8,
            marketPrice: 36.0,
            stock: 320,
            unit: '盒',
            minQty: 1,
            limitQty: 5
          })
        ]
      },
      {
        id: 'lp-003',
        sessionId: 'sess-001',
        sku: 'LF-SF-30022',
        name: '鲜活基围虾',
        category: '水产海鲜',
        categoryId: 'lcat-003',
        spec: '500g',
        price: 39.9,
        marketPrice: 49.9,
        stock: 150,
        status: 'draft',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 3,
        addedAt: '2026-08-11 09:10:00',
        img: '',
        desc: '',
        arrivalTime: '4',
        arrivalUnit: 'HOUR',
        deliveryMode: 'mail',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-003a',
            specName: '500g',
            price: 39.9,
            marketPrice: 49.9,
            stock: 150,
            unit: '盒'
          })
        ]
      },
      {
        id: 'lp-007',
        sessionId: 'sess-001',
        sku: 'LF-VG-10101',
        name: '烟台红富士苹果',
        category: '时令果蔬',
        categoryId: 'lcat-001',
        spec: '8斤装',
        price: 49.9,
        marketPrice: 69.9,
        stock: 0,
        status: 'disabled',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 4,
        addedAt: '2026-08-11 10:00:00',
        img: '',
        desc: '脆甜多汁。',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-007a',
            specName: '8斤装',
            price: 49.9,
            marketPrice: 69.9,
            stock: 0,
            unit: '箱'
          })
        ]
      },
      {
        id: 'lp-008',
        sessionId: 'sess-001',
        sku: 'LF-VG-10208',
        name: '红心火龙果',
        category: '时令果蔬',
        categoryId: 'lcat-001',
        spec: '2粒装',
        price: 16.8,
        marketPrice: 22.8,
        stock: 540,
        status: 'enabled',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 5,
        addedAt: '2026-08-11 14:20:00',
        img: '',
        desc: '当季红心火龙果。',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-008a',
            specName: '2粒装',
            price: 16.8,
            marketPrice: 22.8,
            stock: 360,
            unit: '盒'
          }),
          makeSku({
            id: 'sku-008b',
            specName: '4粒装',
            price: 29.9,
            marketPrice: 39.9,
            stock: 180,
            unit: '盒'
          })
        ]
      },
      {
        id: 'lp-009',
        sessionId: 'sess-001',
        sku: 'LF-GR-40018',
        name: '七色糙米',
        category: '粮油干货',
        categoryId: 'lcat-004',
        spec: '1kg',
        price: 22.9,
        marketPrice: 32.9,
        stock: 260,
        status: 'enabled',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 6,
        addedAt: '2026-08-11 15:05:00',
        img: '',
        desc: '杂粮搭配糙米。',
        arrivalTime: '2',
        arrivalUnit: 'DAY',
        deliveryMode: 'mail',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-009a',
            specName: '1kg',
            price: 22.9,
            marketPrice: 32.9,
            stock: 260,
            unit: '袋'
          })
        ]
      }
    ],
    'sess-002': [
      {
        id: 'lp-004',
        sessionId: 'sess-002',
        sku: 'LF-VG-10099',
        name: '山东寿光黄瓜',
        category: '时令果蔬',
        categoryId: 'lcat-001',
        spec: '3斤装',
        price: 9.9,
        marketPrice: 15.9,
        stock: 1200,
        status: 'enabled',
        liveStatus: 'selling',
        inCart: true,
        saleMode: 'selling',
        explaining: false,
        pinned: false,
        cartSort: 1,
        addedAt: '2026-08-11 11:00:00',
        img: '',
        desc: '',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-004a',
            specName: '3斤装',
            price: 9.9,
            marketPrice: 15.9,
            stock: 1200,
            unit: '袋'
          })
        ]
      },
      {
        id: 'lp-005',
        sessionId: 'sess-002',
        sku: 'LF-GR-40001',
        name: '东北五常大米',
        category: '粮油干货',
        categoryId: 'lcat-004',
        spec: '5kg',
        price: 59.9,
        marketPrice: 79.9,
        stock: 0,
        status: 'disabled',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 2,
        addedAt: '2026-08-11 11:05:00',
        img: '',
        desc: '',
        arrivalTime: '3',
        arrivalUnit: 'DAY',
        deliveryMode: 'mail',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-005a',
            specName: '5kg',
            price: 59.9,
            marketPrice: 79.9,
            stock: 0,
            unit: '袋'
          })
        ]
      },
      {
        id: 'lp-010',
        sessionId: 'sess-002',
        sku: 'LF-VG-10330',
        name: '章丘大葱',
        category: '时令果蔬',
        categoryId: 'lcat-001',
        spec: '2斤装',
        price: 8.8,
        marketPrice: 12.8,
        stock: 800,
        status: 'enabled',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 3,
        addedAt: '2026-08-11 16:10:00',
        img: '',
        desc: '',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-010a',
            specName: '2斤装',
            price: 8.8,
            marketPrice: 12.8,
            stock: 800,
            unit: '把'
          })
        ]
      }
    ],
    'sess-003': [
      {
        id: 'lp-006',
        sessionId: 'sess-003',
        sku: 'LF-MT-20088',
        name: '土鸡蛋礼盒',
        category: '肉禽蛋奶',
        categoryId: 'lcat-002',
        spec: '30枚',
        price: 45.0,
        marketPrice: 58.0,
        stock: 80,
        status: 'enabled',
        liveStatus: 'selling',
        inCart: true,
        saleMode: 'selling',
        explaining: false,
        pinned: false,
        cartSort: 1,
        addedAt: '2026-08-09 15:40:00',
        img: '',
        desc: '散养土鸡蛋礼盒。',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-006a',
            specName: '30枚',
            price: 45.0,
            marketPrice: 58.0,
            stock: 80,
            unit: '盒'
          })
        ]
      },
      {
        id: 'lp-006b',
        sessionId: 'sess-003',
        sku: 'LF-MT-20089',
        name: '鲜牛奶礼盒',
        category: '肉禽蛋奶',
        categoryId: 'lcat-002',
        spec: '12盒',
        price: 59.9,
        marketPrice: 72.0,
        stock: 120,
        status: 'enabled',
        liveStatus: 'off_shelf',
        inCart: false,
        saleMode: 'preview',
        explaining: false,
        pinned: false,
        cartSort: 2,
        addedAt: '2026-08-09 16:10:00',
        img: '',
        desc: '低温鲜奶礼盒。',
        arrivalTime: '1',
        arrivalUnit: 'DAY',
        deliveryMode: 'pickup',
        images: [],
        detailImages: [],
        displaySalesMode: 'ACTUAL',
        displaySales: '',
        purchaseLimitType: 'NONE',
        purchaseLimit: '',
        skus: [
          makeSku({
            id: 'sku-006b',
            specName: '12盒',
            price: 59.9,
            marketPrice: 72.0,
            stock: 120,
            unit: '箱'
          })
        ]
      }
    ],
    'sess-004': []
  };

  function buildMetrics(overrides) {
    return Object.assign(
      {
        duration: '02:18:36',
        viewers: 12860,
        commentUsers: 3260,
        interactRate: '25.4%',
        danmuCount: 18642,
        danmuUsers: 4120,
        avgStay: '06:42',
        goodsClickUsers: 5180,
        totalViewers: 15620,
        salesQty: 2840,
        dealUsers: 1960,
        dealConvertRate: '15.2%',
        dealAmount: 186420.5,
        orderGmv: 198660.0
      },
      overrides || {}
    );
  }

  var dataMetrics = {
    'sess-001': {
      metrics: buildMetrics(),
      products: [
        {
          rank: 1,
          name: '云南高山西红柿',
          spec: '5斤装',
          clickRate: '32.6%',
          orderCount: 860,
          dealAmount: 17114.0,
          paidAmount: 16880.0
        },
        {
          rank: 2,
          name: '冷鲜黑猪五花肉',
          spec: '500g',
          clickRate: '28.1%',
          orderCount: 520,
          dealAmount: 14976.0,
          paidAmount: 14620.0
        },
        {
          rank: 3,
          name: '鲜活基围虾',
          spec: '500g',
          clickRate: '21.4%',
          orderCount: 310,
          dealAmount: 12369.0,
          paidAmount: 12010.0
        }
      ]
    },
    'sess-002': {
      metrics: buildMetrics({
        duration: '00:00:00',
        viewers: 0,
        commentUsers: 0,
        interactRate: '0%',
        danmuCount: 0,
        danmuUsers: 0,
        avgStay: '00:00',
        goodsClickUsers: 0,
        totalViewers: 0,
        salesQty: 0,
        dealUsers: 0,
        dealConvertRate: '0%',
        dealAmount: 0,
        orderGmv: 0
      }),
      products: []
    },
    'sess-003': {
      metrics: buildMetrics({
        duration: '01:28:12',
        viewers: 8620,
        commentUsers: 1980,
        interactRate: '22.9%',
        danmuCount: 10240,
        danmuUsers: 2410,
        avgStay: '05:18',
        goodsClickUsers: 3060,
        totalViewers: 9240,
        salesQty: 1420,
        dealUsers: 980,
        dealConvertRate: '11.4%',
        dealAmount: 68240.0,
        orderGmv: 72100.0
      }),
      products: [
        {
          rank: 1,
          name: '土鸡蛋礼盒',
          spec: '30枚',
          clickRate: '36.8%',
          orderCount: 420,
          dealAmount: 18900.0,
          paidAmount: 18620.0
        }
      ]
    },
    'sess-004': {
      metrics: buildMetrics({
        duration: '00:00:00',
        viewers: 0,
        commentUsers: 0,
        interactRate: '0%',
        danmuCount: 0,
        danmuUsers: 0,
        avgStay: '00:00',
        goodsClickUsers: 0,
        totalViewers: 0,
        salesQty: 0,
        dealUsers: 0,
        dealConvertRate: '0%',
        dealAmount: 0,
        orderGmv: 0
      }),
      products: []
    }
  };

  var controlMetrics = {
    'sess-001': {
      viewers: 1862,
      totalViews: 15620,
      visitCount: 22180,
      peakViewers: 3240,
      likes: 28640,
      orderCount: 428,
      orderGmv: 36820.5,
      salesAmount: 34210.0,
      recentOrders: [
        {
          id: 'o-1001',
          nickname: '希奎',
          level: 'Lv.0',
          productName: '火龙果',
          spec: '白心',
          qty: 1,
          amount: 1,
          payableAmount: 1,
          paidAmount: 0,
          statusLabel: '交易失败',
          paid: false,
          time: '2026-08-14 23:37:42'
        },
        {
          id: 'o-1002',
          nickname: '爱叫啥叫啥',
          level: 'Lv.0',
          productName: '七色糙米',
          spec: '20kg',
          qty: 1,
          amount: 0.01,
          payableAmount: 0.01,
          paidAmount: 0,
          statusLabel: '待支付',
          paid: false,
          time: '2026-08-14 23:36:18'
        },
        {
          id: 'o-1003',
          nickname: '果子狸',
          level: 'Lv.3',
          productName: '云南高山西红柿',
          spec: '5斤装',
          qty: 2,
          amount: 39.8,
          payableAmount: 0,
          paidAmount: 39.8,
          statusLabel: '已支付',
          paid: true,
          time: '2026-08-14 23:32:05'
        },
        {
          id: 'o-1004',
          nickname: '阿南',
          level: 'Lv.1',
          productName: '冷鲜黑猪五花肉',
          spec: '500g',
          qty: 1,
          amount: 28.8,
          payableAmount: 0,
          paidAmount: 28.8,
          statusLabel: '已支付',
          paid: true,
          time: '2026-08-14 23:28:51'
        }
      ],
      mutedUsers: { 'u-laozhang': true, 'u-xiaomei': true },
      chatMessages: [
        { id: 'c1', userId: 'u-guozi', user: '果子狸', text: '西红柿还有吗？', time: '2026-08-11 19:42:01', pinned: true },
        { id: 'c2', userId: 'u-anchor', user: '主播小丰', text: '有的，讲解中这款还有库存～', time: '2026-08-11 19:42:08', isAnchor: true },
        { id: 'c3', userId: 'u-anan', user: '阿南', text: '五花肉包邮吗', time: '2026-08-11 19:41:50' },
        { id: 'c4', userId: 'u-xiaoman', user: '小满', text: '来个福袋！', time: '2026-08-11 19:41:22' },
        { id: 'c5', userId: 'u-xikui', user: '希奎', text: '火龙果什么时候讲', time: '2026-08-11 19:40:58' },
        { id: 'c6', userId: 'u-aijiaosha', user: '爱叫啥叫啥', text: '糙米有优惠吗', time: '2026-08-11 19:40:41' },
        { id: 'c7', userId: 'u-amu', user: '阿木', text: '主播声音真好', time: '2026-08-11 19:40:12' },
        { id: 'c8', userId: 'u-xiaoman', user: '小满', text: '求讲解基围虾', time: '2026-08-11 19:39:50' },
        { id: 'c9', userId: 'u-guozi', user: '果子狸', text: '已下单，尽快发货', time: '2026-08-11 19:39:28' },
        { id: 'c10', userId: 'u-anchor', user: '主播小丰', text: '下单备注自提门店即可', time: '2026-08-11 19:39:10', isAnchor: true },
        { id: 'c11', userId: 'u-xiaozhou', user: '小周', text: '这个西红柿甜不甜', time: '2026-08-11 19:38:48' },
        { id: 'c12', userId: 'u-anan', user: '阿南', text: '有优惠券吗', time: '2026-08-11 19:38:22' },
        { id: 'c13', userId: 'u-xikui', user: '希奎', text: '基围虾还有货吗', time: '2026-08-11 19:37:55' },
        { id: 'c14', userId: 'u-guozi', user: '果子狸', text: '求讲解五花肉', time: '2026-08-11 19:37:30' },
        { id: 'c15', userId: 'u-xiaoman', user: '小满', text: '主播这个多少钱一斤', time: '2026-08-11 19:37:08' },
        { id: 'c16', userId: 'u-amu', user: '阿木', text: '能发个福袋吗', time: '2026-08-11 19:36:41' },
        { id: 'c17', userId: 'u-aijiaosha', user: '爱叫啥叫啥', time: '2026-08-11 19:36:12' },
        { id: 'c18', userId: 'u-xiaolin', user: '小林', text: '刚进来，现在讲哪款', time: '2026-08-11 19:35:50' }
      ],
      watchViewers: [
        { id: 'wv1', userId: 'u-guozi', nickname: '果子狸', lastEnterTime: '19:12:08', enterCount: 3, totalDuration: '01:12:10', online: true, muted: false },
        { id: 'wv2', userId: 'u-anan', nickname: '阿南', lastEnterTime: '19:20:41', enterCount: 2, totalDuration: '48:37', online: true, muted: false },
        { id: 'wv3', userId: 'u-xiaoman', nickname: '小满', lastEnterTime: '19:33:02', enterCount: 1, totalDuration: '09:16', online: true, muted: false },
        { id: 'wv4', userId: 'u-amu', nickname: '阿木', lastEnterTime: '19:38:55', enterCount: 1, totalDuration: '03:23', online: true, muted: false },
        { id: 'wv5', userId: 'u-xikui', nickname: '希奎', lastEnterTime: '19:08:12', enterCount: 2, totalDuration: '36:40', online: true, muted: false },
        { id: 'wv6', userId: 'u-aijiaosha', nickname: '爱叫啥叫啥', lastEnterTime: '19:28:20', enterCount: 1, totalDuration: '12:05', online: true, muted: false },
        { id: 'wv7', userId: 'u-xiaozhou', nickname: '小周', lastEnterTime: '19:40:00', enterCount: 1, totalDuration: '02:10', online: true, muted: false },
        { id: 'wv8', userId: 'u-laozhang', nickname: '老张', lastEnterTime: '19:05:00', enterCount: 4, totalDuration: '01:45:00', online: true, muted: true },
        { id: 'wv9', userId: 'u-abei', nickname: '阿北', lastEnterTime: '19:02:00', enterCount: 1, totalDuration: '08:00', online: false, muted: false },
        { id: 'wv10', userId: 'u-xiaolin', nickname: '小林', lastEnterTime: '18:50:00', enterCount: 2, totalDuration: '22:18', online: false, muted: false },
        { id: 'wv11', userId: 'u-xiaomei', nickname: '小美', lastEnterTime: '18:22:40', enterCount: 1, totalDuration: '15:02', online: false, muted: true }
      ],
      watchVisits: [
        { id: 'vs1', userId: 'u-xiaomei', nickname: '小美', enterTime: '18:07:38', leaveTime: '18:22:40', stayDuration: '15:02' },
        { id: 'vs2', userId: 'u-xiaolin', nickname: '小林', enterTime: '18:12:10', leaveTime: '18:26:40', stayDuration: '14:30' },
        { id: 'vs3', userId: 'u-guozi', nickname: '果子狸', enterTime: '18:20:00', leaveTime: '18:45:12', stayDuration: '25:12' },
        { id: 'vs4', userId: 'u-laozhang', nickname: '老张', enterTime: '18:22:00', leaveTime: '18:50:00', stayDuration: '28:00' },
        { id: 'vs5', userId: 'u-anan', nickname: '阿南', enterTime: '18:40:00', leaveTime: '19:06:20', stayDuration: '26:20' },
        { id: 'vs6', userId: 'u-xiaolin', nickname: '小林', enterTime: '18:34:42', leaveTime: '18:42:30', stayDuration: '07:48' },
        { id: 'vs7', userId: 'u-guozi', nickname: '果子狸', enterTime: '18:52:00', leaveTime: '19:10:00', stayDuration: '18:00' },
        { id: 'vs8', userId: 'u-laozhang', nickname: '老张', enterTime: '18:55:10', leaveTime: '19:02:40', stayDuration: '07:30' },
        { id: 'vs9', userId: 'u-abei', nickname: '阿北', enterTime: '18:54:00', leaveTime: '19:02:00', stayDuration: '08:00' },
        { id: 'vs10', userId: 'u-xikui', nickname: '希奎', enterTime: '18:48:00', leaveTime: '19:06:28', stayDuration: '18:28' },
        { id: 'vs11', userId: 'u-laozhang', nickname: '老张', enterTime: '19:03:20', leaveTime: '19:04:50', stayDuration: '01:30' },
        { id: 'vs12', userId: 'u-laozhang', nickname: '老张', enterTime: '19:05:00', leaveTime: '', stayDuration: '37:18' },
        { id: 'vs13', userId: 'u-xikui', nickname: '希奎', enterTime: '19:08:12', leaveTime: '', stayDuration: '34:06' },
        { id: 'vs14', userId: 'u-guozi', nickname: '果子狸', enterTime: '19:12:08', leaveTime: '', stayDuration: '30:10' },
        { id: 'vs15', userId: 'u-anan', nickname: '阿南', enterTime: '19:20:41', leaveTime: '', stayDuration: '21:37' },
        { id: 'vs16', userId: 'u-aijiaosha', nickname: '爱叫啥叫啥', enterTime: '19:28:20', leaveTime: '', stayDuration: '12:05' },
        { id: 'vs17', userId: 'u-xiaoman', nickname: '小满', enterTime: '19:33:02', leaveTime: '', stayDuration: '09:16' },
        { id: 'vs18', userId: 'u-amu', nickname: '阿木', enterTime: '19:38:55', leaveTime: '', stayDuration: '03:23' },
        { id: 'vs19', userId: 'u-xiaozhou', nickname: '小周', enterTime: '19:40:00', leaveTime: '', stayDuration: '02:10' }
      ],
      watchRecords: [
        { id: 'w1', nickname: '果子狸', phone: '138****6521', enterTime: '19:12:08', duration: '30:10' },
        { id: 'w2', nickname: '阿南', phone: '159****8830', enterTime: '19:20:41', duration: '21:37' },
        { id: 'w3', nickname: '小满', phone: '186****2209', enterTime: '19:33:02', duration: '09:16' },
        { id: 'w4', nickname: '阿木', phone: '137****4410', enterTime: '19:38:55', duration: '03:23' }
      ]
    },
    'sess-002': {
      viewers: 0,
      totalViews: 0,
      peakViewers: 0,
      likes: 0,
      orderCount: 0,
      orderGmv: 0,
      salesAmount: 0,
      recentOrders: [],
      chatMessages: [],
      watchRecords: []
    },
    'sess-003': {
      viewers: 0,
      totalViews: 9240,
      visitCount: 11860,
      peakViewers: 2100,
      likes: 15200,
      orderCount: 420,
      orderGmv: 72100.0,
      salesAmount: 68240.0,
      recentOrders: [],
      chatMessages: [{ id: 'c9', user: '系统', text: '本场直播已结束', time: '2026-08-10 13:00:00', isSys: true }],
      watchRecords: []
    },
    'sess-004': {
      viewers: 0,
      totalViews: 0,
      peakViewers: 0,
      likes: 0,
      orderCount: 0,
      orderGmv: 0,
      salesAmount: 0,
      recentOrders: [],
      chatMessages: [],
      watchRecords: []
    }
  };

  (function hydrateEndedSessionReplay() {
    var live = controlMetrics['sess-001'];
    var ended = controlMetrics['sess-003'];
    if (!live || !ended) return;
    ended.chatMessages = (live.chatMessages || [])
      .map(function (m) {
        return Object.assign({}, m);
      })
      .concat([{ id: 'c-end', user: '系统', text: '本场直播已结束', time: '2026-08-10 13:00:00', isSys: true }]);
    ended.watchViewers = (live.watchViewers || []).map(function (w) {
      return Object.assign({}, w, { online: false });
    });
    ended.watchVisits = (live.watchVisits || []).map(function (v) {
      return Object.assign({}, v);
    });
    ended.watchRecords = (live.watchRecords || []).map(function (w) {
      return Object.assign({}, w);
    });
    ended.recentOrders = (live.recentOrders || []).map(function (o) {
      return Object.assign({}, o);
    });
    ended.mutedUsers = Object.assign({}, live.mutedUsers || {});
  })();

  var marketingTemplatePool = [
    { id: 'tpl-pool-c1', type: 'COUPON', typeName: '优惠券', name: '满99减10券', stock: 1000 },
    { id: 'tpl-pool-c2', type: 'COUPON', typeName: '优惠券', name: '新人专享券', stock: 300 },
    { id: 'tpl-pool-b1', type: 'FORTUNE_BAG', typeName: '福袋', name: '开播福袋', stock: 200 },
    { id: 'tpl-pool-b2', type: 'FORTUNE_BAG', typeName: '福袋', name: '整点福袋', stock: 100 },
    { id: 'tpl-pool-s1', type: 'SIGN_IN', typeName: '签到', name: '直播签到有礼', stock: null },
    { id: 'tpl-pool-t1', type: 'TASK', typeName: '观看奖励', name: '观看满10分钟领积分', stock: null },
    { id: 'tpl-pool-t2', type: 'TASK', typeName: '观看奖励', name: '观看满30分钟领券', stock: null }
  ];

  var couponTemplates = [
    {
      id: 'CT10001',
      name: '晚间满减券',
      threshold: 99,
      denomination: 20,
      status: 'enabled',
      stock: 4400,
      channel: '全渠道',
      validPeriod: '领取后7天有效',
      collectLimit: '不限'
    },
    {
      id: 'CT10002',
      name: '果蔬专享券',
      threshold: 0,
      denomination: 5,
      status: 'enabled',
      stock: 2800,
      channel: 'APP/小程序',
      validPeriod: '领取后15天有效',
      collectLimit: '每人3次'
    },
    {
      id: 'CT10003',
      name: '会员日满减券',
      threshold: 59,
      denomination: 10,
      status: 'enabled',
      stock: 4000,
      channel: '全渠道',
      validPeriod: '2026-03-01~09-30',
      collectLimit: '每人2次'
    },
    {
      id: 'CT10004',
      name: '停用满减券',
      threshold: 30,
      denomination: 8,
      status: 'disabled',
      stock: 1200,
      channel: '全渠道',
      validPeriod: '领取后7天有效',
      collectLimit: '每人1次'
    },
    {
      id: 'CT10005',
      name: '过期满减券',
      threshold: 50,
      denomination: 15,
      status: 'expired',
      stock: 0,
      channel: '全渠道',
      validPeriod: '2025-01-01~12-31',
      collectLimit: '每人1次'
    }
  ];

  function findCouponTemplate(id) {
    var i;
    for (i = 0; i < couponTemplates.length; i++) {
      if (couponTemplates[i].id === id) return couponTemplates[i];
    }
    return null;
  }

  function couponTemplateStatusLabel(status) {
    if (status === 'disabled') return '禁用';
    if (status === 'expired') return '已过期';
    return '启用';
  }

  function deductCouponStock(templateId, qty) {
    var tpl = findCouponTemplate(templateId);
    var n = Math.floor(Number(qty) || 0);
    if (!tpl || n < 1) return false;
    if (tpl.stock < n) return false;
    tpl.stock -= n;
    return true;
  }

  function releaseCouponStock(templateId, qty) {
    var tpl = findCouponTemplate(templateId);
    var n = Math.floor(Number(qty) || 0);
    if (!tpl || n < 1) return false;
    tpl.stock += n;
    return true;
  }

  function nextCouponPlanId() {
    return 'plan-c-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  var bagTemplates = [
    {
      id: 'BT10001',
      name: '开播券福袋',
      status: 'enabled',
      stock: 1760,
      prizeType: 'COUPON',
      prizeCouponId: 'CT10001'
    },
    {
      id: 'BT10002',
      name: '积分福袋',
      status: 'enabled',
      stock: 2120,
      prizeType: 'POINTS',
      pointsAmount: 50
    },
    {
      id: 'BT10003',
      name: '开播福袋',
      status: 'enabled',
      stock: 1750,
      prizeType: 'PRODUCT',
      productName: '进口车厘子礼盒',
      productSpec: '2斤装 / 红色车厘子'
    },
    {
      id: 'BT10004',
      name: '停用福袋',
      status: 'disabled',
      stock: 80,
      prizeType: 'POINTS',
      pointsAmount: 10
    }
  ];

  var liveAudience = [
    { userId: '10086011', nickname: '果子狸', phone: '13812346521', aliases: ['u-guozi'] },
    { userId: '10086012', nickname: '阿南', phone: '15988308830', aliases: ['u-anan'] },
    { userId: '10086013', nickname: '小满', phone: '18622092209', aliases: ['u-xiaoman'] },
    { userId: '10086014', nickname: '阿木', phone: '13744104410', aliases: ['u-amu'] },
    { userId: '10086015', nickname: '希奎', phone: '13566778899', aliases: ['u-xikui'] },
    { userId: '10086016', nickname: '爱叫啥叫啥', phone: '15011223344', aliases: ['u-aijiaosha'] },
    { userId: '10086017', nickname: '小周', phone: '13900001111', aliases: ['u-xiaozhou'] },
    { userId: '10086018', nickname: '老张', phone: '18866667777', aliases: ['u-laozhang'] },
    { userId: '10086019', nickname: '阿北', phone: '13655554444', aliases: ['u-abei'] },
    { userId: '10086020', nickname: '小林', phone: '13122223333', aliases: ['u-xiaolin'] },
    { userId: '10086021', nickname: '小美', phone: '15900001234', aliases: ['u-xiaomei'] }
  ];

  /* 与 会员360-会员管理 列表种子一致；指定中奖搜索走这份 + localStorage 同步会员 */
  var MEMBER360_LIST_KEY = 'mdm_member_c_list_v1';
  var member360Seed = [
    { userId: 'U10001', nickname: '小程序用户A', phone: '138****2211', status: '正常' },
    { userId: 'U10002', nickname: 'APP会员B', phone: '139****9033', status: '正常' },
    { userId: 'U10004', nickname: '演示会员4', phone: '137****1004', status: '正常' },
    { userId: 'U10006', nickname: '演示会员6', phone: '136****6606', status: '正常' },
    { userId: 'U10008', nickname: '黑名单用户E', phone: '139****5508', status: '黑名单' },
    { userId: 'U10012', nickname: '待审用户甲', phone: '138****6612', status: '注销中' },
    { userId: 'U10003', nickname: '访客C', phone: '—', status: '注销' },
    { userId: 'U10005', nickname: '演示会员5', phone: '137****1005', status: '注销' },
    { userId: 'U10007', nickname: '已注销用户D', phone: '135****7707', status: '注销' }
  ];

  function normalizeMember360(m) {
    if (!m) return null;
    var id = String(m.userId || m.id || m.memberId || '').trim();
    if (!id) return null;
    return {
      userId: id,
      nickname: String(m.nickname || '—'),
      phone: String(m.phone || m.phoneMasked || '—'),
      status: String(m.status || '正常')
    };
  }

  function listMember360() {
    var map = {};
    member360Seed.forEach(function (m) {
      var row = normalizeMember360(m);
      if (row) map[row.userId] = row;
    });
    try {
      var raw = localStorage.getItem(MEMBER360_LIST_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(function (item) {
            var row = normalizeMember360(item);
            if (!row) return;
            map[row.userId] = Object.assign({}, map[row.userId] || {}, row);
          });
        }
      }
    } catch (e) { /* ignore */ }
    return Object.keys(map).map(function (k) {
      return map[k];
    });
  }

  function findMember360(userId) {
    var id = String(userId || '');
    var list = listMember360();
    var i;
    for (i = 0; i < list.length; i++) {
      if (String(list[i].userId) === id) return list[i];
    }
    return null;
  }

  function findBagTemplate(id) {
    var i;
    for (i = 0; i < bagTemplates.length; i++) {
      if (bagTemplates[i].id === id) return bagTemplates[i];
    }
    return null;
  }

  function bagTemplateStatusLabel(status) {
    if (status === 'disabled') return '停用';
    if (status === 'expired') return '已过期';
    return '启用';
  }

  function bagPrizeTypeLabel(type) {
    if (type === 'COUPON') return '券';
    if (type === 'POINTS') return '积分';
    if (type === 'PRODUCT') return '商品';
    return '—';
  }

  function deductBagStock(templateId, qty) {
    var tpl = findBagTemplate(templateId);
    var n = Math.floor(Number(qty) || 0);
    if (!tpl || n < 1) return false;
    if (tpl.stock < n) return false;
    tpl.stock -= n;
    return true;
  }

  function releaseBagStock(templateId, qty) {
    var tpl = findBagTemplate(templateId);
    var n = Math.floor(Number(qty) || 0);
    if (!tpl || n < 1) return false;
    tpl.stock += n;
    return true;
  }

  function nextBagPlanId() {
    return 'plan-b-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  var signTemplates = [
    {
      id: 'ST10001',
      name: '晚间签到有礼',
      status: 'enabled',
      totalRounds: 5,
      rewards: [
        { rewardType: 'POINTS', pointsAmount: 10 },
        { rewardType: 'COUPON', prizeCouponId: 'CT10001' },
        { rewardType: 'FORTUNE_BAG', prizeBagId: 'BT10002' },
        { rewardType: 'POINTS', pointsAmount: 30 },
        { rewardType: 'NONE' }
      ]
    },
    {
      id: 'ST10002',
      name: '会员日签到',
      status: 'enabled',
      totalRounds: 3,
      rewards: [
        { rewardType: 'POINTS', pointsAmount: 5 },
        { rewardType: 'COUPON', prizeCouponId: 'CT10003' },
        { rewardType: 'POINTS', pointsAmount: 20 }
      ]
    },
    {
      id: 'ST10003',
      name: '停用签到',
      status: 'disabled',
      totalRounds: 2,
      rewards: [
        { rewardType: 'POINTS', pointsAmount: 2 },
        { rewardType: 'NONE' }
      ]
    }
  ];

  function findSignTemplate(id) {
    var i;
    for (i = 0; i < signTemplates.length; i++) {
      if (signTemplates[i].id === id) return signTemplates[i];
    }
    return null;
  }

  function signTemplateStatusLabel(status) {
    if (status === 'disabled') return '停用';
    if (status === 'expired') return '已过期';
    return '启用';
  }

  function nextSignPlanId() {
    return 'plan-s-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  var taskTemplates = [
    {
      id: 'WT10001',
      name: '晚间观看有礼',
      status: 'enabled',
      milestones: [
        { threshold: 3, rewardType: 'POINTS', pointsAmount: 10 },
        { threshold: 10, rewardType: 'COUPON', prizeCouponId: 'CT10001' },
        { threshold: 20, rewardType: 'POINTS', pointsAmount: 25 }
      ]
    },
    {
      id: 'WT10002',
      name: '会员日观看',
      status: 'enabled',
      milestones: [
        { threshold: 5, rewardType: 'POINTS', pointsAmount: 5 },
        { threshold: 15, rewardType: 'POINTS', pointsAmount: 20 }
      ]
    },
    {
      id: 'WT10003',
      name: '停用观看奖励',
      status: 'disabled',
      milestones: [
        { threshold: 8, rewardType: 'POINTS', pointsAmount: 8 }
      ]
    }
  ];

  function findTaskTemplate(id) {
    var i;
    for (i = 0; i < taskTemplates.length; i++) {
      if (taskTemplates[i].id === id) return taskTemplates[i];
    }
    return null;
  }

  function taskTemplateStatusLabel(status) {
    if (status === 'disabled') return '停用';
    if (status === 'expired') return '已过期';
    return '启用';
  }

  function nextTaskPlanId() {
    return 'plan-t-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  var WATCH_REWARD_ISSUE_KEY = 'lf_live_watch_reward_issue_v1';

  function publishWatchRewardIssue(payload) {
    try {
      if (!payload) localStorage.removeItem(WATCH_REWARD_ISSUE_KEY);
      else localStorage.setItem(WATCH_REWARD_ISSUE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function readWatchRewardIssue() {
    try {
      var raw = localStorage.getItem(WATCH_REWARD_ISSUE_KEY);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  function clampInt(val, min, max, fallback) {
    var n = Math.floor(Number(val));
    if (!isFinite(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  var C_VIEWER_INITIAL_MAX = 999999;
  var C_VIEWER_EXTRA_MAX = 100;

  function normalizeCViewerConfig(sess) {
    sess = sess || {};
    var display = sess.cViewerDisplay;
    if (display !== 'unique' && display !== 'visits') display = 'online';
    var extraMin = clampInt(sess.cViewerExtraMin, 0, C_VIEWER_EXTRA_MAX, 0);
    var extraMax = clampInt(sess.cViewerExtraMax, 0, C_VIEWER_EXTRA_MAX, 0);
    if (extraMin > extraMax) {
      var tmp = extraMin;
      extraMin = extraMax;
      extraMax = tmp;
    }
    return {
      display: display,
      initial: clampInt(sess.cViewerInitial, 0, C_VIEWER_INITIAL_MAX, 0),
      extraMin: extraMin,
      extraMax: extraMax
    };
  }

  function extraFollowAt(index, min, max, seed) {
    var lo = clampInt(min, 0, C_VIEWER_EXTRA_MAX, 0);
    var hi = clampInt(max, 0, C_VIEWER_EXTRA_MAX, 0);
    if (lo > hi) {
      var t = lo;
      lo = hi;
      hi = t;
    }
    var span = hi - lo + 1;
    var h = 2166136261;
    var key = String(seed || 'live') + ':' + index;
    for (var i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return lo + (h % span);
  }

  function boostedOnlineCount(realCount, cfg, seed) {
    var real = clampInt(realCount, 0, 99999999, 0);
    if (cfg.extraMin === 0 && cfg.extraMax === 0) return cfg.initial + real;
    var extra = 0;
    var i;
    for (i = 0; i < real; i++) {
      extra += extraFollowAt(i, cfg.extraMin, cfg.extraMax, seed);
    }
    return cfg.initial + real + extra;
  }

  function cViewerDisplayLabel(display) {
    if (display === 'unique') return '累计观看人数';
    if (display === 'visits') return '累计观看人次';
    return '实际在线人数';
  }

  function formatCViewerText(count, display) {
    var n = clampInt(count, 0, 99999999, 0);
    if (display === 'unique') return n + '人看过';
    if (display === 'visits') return n + '人次观看';
    return n + '人正在观看';
  }

  function resolveCViewerCount(sess, metrics) {
    var cfg = normalizeCViewerConfig(sess);
    var m = metrics || {};
    var real = 0;
    if (cfg.display === 'unique') {
      real = clampInt(m.totalViews, 0, 99999999, 0);
    } else if (cfg.display === 'visits') {
      real = m.visitCount != null ? clampInt(m.visitCount, 0, 99999999, 0) : (m.watchVisits || []).length;
    } else {
      real = clampInt(m.viewers, 0, 99999999, 0);
    }
    return boostedOnlineCount(real, cfg, sess && sess.id);
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function formatDemoTs(d) {
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

  function tsFromNow(minOffset, secOffset) {
    return formatDemoTs(new Date(Date.now() + (minOffset || 0) * 60000 + (secOffset || 0) * 1000));
  }

  function nextWindowId() {
    return 'win-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  var welfareWindows = {
    'tpl-c1': [
      {
        id: 'win-c1-2',
        roundIndex: 1,
        roundNo: 2,
        startedAt: tsFromNow(-1),
        endedAt: tsFromNow(2),
        durationSec: 180,
        status: 'ACTIVE',
        couponTotalStock: 4,
        couponClaimedCount: 2,
        couponUsedCount: 0,
        participantCount: 2,
        participateTimes: 2
      },
      {
        id: 'win-c1-1',
        roundIndex: 0,
        roundNo: 1,
        startedAt: tsFromNow(-28),
        endedAt: tsFromNow(-25),
        durationSec: 180,
        status: 'CLOSED',
        couponTotalStock: 4,
        couponClaimedCount: 4,
        couponUsedCount: 2,
        participantCount: 4,
        participateTimes: 4
      }
    ],
    'tpl-c2': [],
    'tpl-c1b': [
      {
        id: 'win-c1b-1',
        roundIndex: 0,
        roundNo: 1,
        startedAt: tsFromNow(-40),
        endedAt: tsFromNow(-37),
        durationSec: 180,
        status: 'CLOSED',
        couponTotalStock: 100,
        couponClaimedCount: 100,
        couponUsedCount: 61,
        participantCount: 86,
        participateTimes: 100
      }
    ],
    'tpl-c-off': [],
    'tpl-b1b': [],
    'tpl-b-pt': [],
    'tpl-b-cp': [],
    'tpl-b1': [
      {
        id: 'win-b1-2',
        roundIndex: 1,
        roundNo: 2,
        startedAt: tsFromNow(-0.4),
        endedAt: tsFromNow(1.6),
        durationSec: 120,
        status: 'ACTIVE',
        prizeTitle: '进口车厘子礼盒',
        participantCount: 86,
        participateTimes: 112,
        winnerCount: 0,
        winnerTotal: 3,
        drawType: 'RANDOM',
        rewards: []
      },
      {
        id: 'win-b1-1',
        roundIndex: 0,
        roundNo: 1,
        startedAt: tsFromNow(-18),
        endedAt: tsFromNow(-16),
        durationSec: 120,
        status: 'CLOSED',
        prizeTitle: '进口车厘子礼盒',
        participantCount: 124,
        participateTimes: 168,
        winnerCount: 3,
        winnerTotal: 3,
        drawType: 'RANDOM',
        rewards: [
          { nickMasked: '小**', prizeTitle: '进口车厘子礼盒' },
          { nickMasked: '果**迷', prizeTitle: '进口车厘子礼盒' },
          { nickMasked: '晚**购', prizeTitle: '进口车厘子礼盒' }
        ]
      }
    ],
    'tpl-s-live': [
      {
        id: 'win-sl-2',
        roundIndex: 1,
        roundNo: 2,
        startedAt: tsFromNow(-12),
        endedAt: tsFromNow(-9),
        durationSec: 180,
        status: 'CLOSED',
        participantCount: 96,
        participateTimes: 128
      },
      {
        id: 'win-sl-1',
        roundIndex: 0,
        roundNo: 1,
        startedAt: tsFromNow(-22),
        endedAt: tsFromNow(-19),
        durationSec: 180,
        status: 'CLOSED',
        participantCount: 74,
        participateTimes: 90
      }
    ],
    'tpl-s-dup': [],
    'tpl-t-live': [
      {
        id: 'win-t-live',
        roundIndex: 0,
        roundNo: 1,
        startedAt: tsFromNow(-8),
        endedAt: tsFromNow(1440),
        durationSec: 86400,
        status: 'ACTIVE',
        participantCount: 86,
        participateTimes: 86
      }
    ],
    'tpl-t-dup': [],
    'tpl-c3': [
      {
        id: 'win-c3-3',
        roundIndex: 2,
        startedAt: '2026-08-10 12:40:00',
        endedAt: '2026-08-10 12:43:00',
        durationSec: 180,
        status: 'CLOSED',
        couponTotalStock: 4,
        couponClaimedCount: 4,
        couponUsedCount: 3
      },
      {
        id: 'win-c3-2',
        roundIndex: 1,
        startedAt: '2026-08-10 12:10:00',
        endedAt: '2026-08-10 12:13:00',
        durationSec: 180,
        status: 'CLOSED',
        couponTotalStock: 4,
        couponClaimedCount: 3,
        couponUsedCount: 1
      },
      {
        id: 'win-c3-1',
        roundIndex: 0,
        startedAt: '2026-08-10 11:35:00',
        endedAt: '2026-08-10 11:38:00',
        durationSec: 180,
        status: 'CLOSED',
        couponTotalStock: 4,
        couponClaimedCount: 4,
        couponUsedCount: 2
      }
    ],
    'tpl-b3': [
      {
        id: 'win-b3-2',
        roundIndex: 1,
        startedAt: '2026-08-10 12:20:00',
        endedAt: '2026-08-10 12:22:00',
        durationSec: 120,
        status: 'CLOSED',
        prizeTitle: '会员日神秘礼',
        participantCount: 67,
        winnerCount: 3,
        winnerTotal: 3,
        drawType: 'RANDOM',
        rewards: [
          { nickMasked: '会**员', prizeTitle: '会员日神秘礼' },
          { nickMasked: '闪**达', prizeTitle: '会员日神秘礼' },
          { nickMasked: '冷**鲜', prizeTitle: '会员日神秘礼' }
        ]
      },
      {
        id: 'win-b3-1',
        roundIndex: 0,
        startedAt: '2026-08-10 11:40:00',
        endedAt: '2026-08-10 11:42:00',
        durationSec: 120,
        status: 'CLOSED',
        prizeTitle: '会员日神秘礼',
        participantCount: 41,
        winnerCount: 3,
        winnerTotal: 3,
        drawType: 'RANDOM',
        rewards: [
          { nickMasked: '阿**米', prizeTitle: '会员日神秘礼' },
          { nickMasked: '小**桃', prizeTitle: '会员日神秘礼' },
          { nickMasked: '滨**店', prizeTitle: '会员日神秘礼' }
        ]
      }
    ],
    'tpl-s1': [
      {
        id: 'win-s1-3',
        roundIndex: 2,
        startedAt: '2026-08-10 12:30:00',
        endedAt: '2026-08-10 12:33:00',
        durationSec: 180,
        status: 'CLOSED'
      },
      {
        id: 'win-s1-2',
        roundIndex: 1,
        startedAt: '2026-08-10 12:00:00',
        endedAt: '2026-08-10 12:03:00',
        durationSec: 180,
        status: 'CLOSED'
      },
      {
        id: 'win-s1-1',
        roundIndex: 0,
        startedAt: '2026-08-10 11:32:00',
        endedAt: '2026-08-10 11:35:00',
        durationSec: 180,
        status: 'CLOSED'
      }
    ],
    'tpl-t3': [
      {
        id: 'win-t3-1',
        roundIndex: 0,
        startedAt: '2026-08-10 11:31:00',
        endedAt: '2026-08-10 13:00:00',
        durationSec: 86400,
        status: 'CLOSED'
      }
    ]
  };

  function welfareWindowsOf(planId) {
    if (!planId) return [];
    if (!welfareWindows[planId]) welfareWindows[planId] = [];
    return welfareWindows[planId];
  }

  window.MdmLiveDemo = {
    rooms: rooms,
    timeslots: timeslots,
    sessions: sessions,
    categories: categories,
    productsBySession: productsBySession,
    normalizeSchedStatus: normalizeSchedStatus,
    normalizeCViewerConfig: normalizeCViewerConfig,
    resolveCViewerCount: resolveCViewerCount,
    formatCViewerText: formatCViewerText,
    cViewerDisplayLabel: cViewerDisplayLabel,
    clampInt: clampInt,
    C_VIEWER_INITIAL_MAX: C_VIEWER_INITIAL_MAX,
    C_VIEWER_EXTRA_MAX: C_VIEWER_EXTRA_MAX,
    dataMetrics: dataMetrics,
    controlMetrics: controlMetrics,
    demoStores: demoStores,
    demoRegions: demoRegions,
    marketingTemplatePool: marketingTemplatePool,
    liveTypeOptions: [
      { value: 'OFFICIAL', label: '官方直播' },
      { value: 'REGION', label: '区域直播' },
      { value: 'TARGETED', label: '定向直播' }
    ],
    viewPermissionOptions: [
      { value: 'ALL', label: '全部用户' },
      { value: 'STORE_MEMBER', label: '仅会员可看' }
    ],
    templateTypeOptions: [
      { value: 'COUPON', label: '优惠券' },
      { value: 'FORTUNE_BAG', label: '福袋' },
      { value: 'SIGN_IN', label: '签到' },
      { value: 'TASK', label: '观看奖励' }
    ],
    welfareWindows: welfareWindows,
    welfareWindowsOf: welfareWindowsOf,
    formatDemoTs: formatDemoTs,
    nextWindowId: nextWindowId,
    couponTemplates: couponTemplates,
    findCouponTemplate: findCouponTemplate,
    couponTemplateStatusLabel: couponTemplateStatusLabel,
    deductCouponStock: deductCouponStock,
    releaseCouponStock: releaseCouponStock,
    nextCouponPlanId: nextCouponPlanId,
    bagTemplates: bagTemplates,
    findBagTemplate: findBagTemplate,
    bagTemplateStatusLabel: bagTemplateStatusLabel,
    bagPrizeTypeLabel: bagPrizeTypeLabel,
    deductBagStock: deductBagStock,
    releaseBagStock: releaseBagStock,
    nextBagPlanId: nextBagPlanId,
    signTemplates: signTemplates,
    findSignTemplate: findSignTemplate,
    signTemplateStatusLabel: signTemplateStatusLabel,
    nextSignPlanId: nextSignPlanId,
    taskTemplates: taskTemplates,
    findTaskTemplate: findTaskTemplate,
    taskTemplateStatusLabel: taskTemplateStatusLabel,
    nextTaskPlanId: nextTaskPlanId,
    publishWatchRewardIssue: publishWatchRewardIssue,
    readWatchRewardIssue: readWatchRewardIssue,
    WATCH_REWARD_ISSUE_KEY: WATCH_REWARD_ISSUE_KEY,
    liveAudience: liveAudience,
    member360Seed: member360Seed,
    listMember360: listMember360,
    findMember360: findMember360
  };
})();
