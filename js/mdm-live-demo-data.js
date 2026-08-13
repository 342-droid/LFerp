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
        { id: 'tpl-c1', type: 'COUPON', typeName: '优惠券', name: '晚间满减券', stock: 500 },
        { id: 'tpl-b1', type: 'FORTUNE_BAG', typeName: '福袋', name: '开播福袋', stock: 200 }
      ],
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
      anchorUserId: '10086002',
      anchorName: '产地小哥',
      cover: '',
      intro: '早市产地专场，覆盖杭甬核心城区。',
      viewPermission: 'ALL',
      regions: [
        { code: '330100', label: '浙江省 杭州市（全市）' },
        { code: '330200', label: '浙江省 宁波市（全市）' }
      ],
      stores: [],
      pushUrl: 'rtmp://push.demo.lengfeng.com/live/sess-002?txSecret=****',
      playUrl: 'https://play.demo.lengfeng.com/live/sess-002.m3u8',
      templates: [],
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
      anchorUserId: '10086003',
      anchorName: '会员管家',
      cover: '',
      intro: '会员日定向门店闪购场。',
      viewPermission: 'STORE_MEMBER',
      regions: [],
      stores: [
        { id: 'store-001', name: '冷丰生鲜·城东店' },
        { id: 'store-002', name: '冷丰生鲜·高新店' }
      ],
      pushUrl: 'rtmp://push.demo.lengfeng.com/live/sess-003?txSecret=****',
      playUrl: 'https://play.demo.lengfeng.com/live/sess-003.m3u8',
      templates: [
        { id: 'tpl-s1', type: 'SIGN_IN', typeName: '签到', name: '会员日签到', stock: null }
      ],
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
        status: 'on_shelf',
        liveStatus: 'explaining',
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
        status: 'listing',
        liveStatus: 'displaying',
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
        liveStatus: 'selling',
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
        status: 'on_shelf',
        liveStatus: 'sold_out',
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
        status: 'on_shelf',
        liveStatus: 'selling',
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
        status: 'off_shelf',
        liveStatus: 'off_shelf',
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
        status: 'delisting',
        liveStatus: 'off_shelf',
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
      peakViewers: 3240,
      likes: 28640,
      orderCount: 428,
      orderGmv: 36820.5,
      salesAmount: 34210.0,
      recentOrders: [
        {
          id: 'o-1001',
          nickname: '果子狸',
          phone: '138****6521',
          productName: '云南高山西红柿',
          spec: '5斤装',
          qty: 2,
          amount: 39.8,
          statusLabel: '已支付',
          paid: true,
          time: '19:42:18'
        },
        {
          id: 'o-1002',
          nickname: '阿南',
          phone: '159****8830',
          productName: '冷鲜黑猪五花肉',
          spec: '500g',
          qty: 1,
          amount: 28.8,
          statusLabel: '已支付',
          paid: true,
          time: '19:41:05'
        },
        {
          id: 'o-1003',
          nickname: '小满',
          phone: '186****2209',
          productName: '鲜活基围虾',
          spec: '500g',
          qty: 3,
          amount: 119.7,
          statusLabel: '待支付',
          paid: false,
          time: '19:40:33'
        }
      ],
      chatMessages: [
        { id: 'c1', user: '果子狸', text: '西红柿还有吗？', time: '19:42:01' },
        { id: 'c2', user: '主播小丰', text: '有的，讲解中这款还有库存～', time: '19:42:08', isAnchor: true },
        { id: 'c3', user: '阿南', text: '五花肉包邮吗', time: '19:41:50' },
        { id: 'c4', user: '小满', text: '来个福袋！', time: '19:41:22' }
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
      chatMessages: []
    },
    'sess-003': {
      viewers: 0,
      totalViews: 9240,
      peakViewers: 2100,
      likes: 15200,
      orderCount: 420,
      orderGmv: 72100.0,
      salesAmount: 68240.0,
      recentOrders: [],
      chatMessages: [{ id: 'c9', user: '系统', text: '本场直播已结束', time: '13:00:00', isSys: true }]
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
      chatMessages: []
    }
  };

  var marketingTemplatePool = [
    { id: 'tpl-pool-c1', type: 'COUPON', typeName: '优惠券', name: '满99减10券', stock: 1000 },
    { id: 'tpl-pool-c2', type: 'COUPON', typeName: '优惠券', name: '新人专享券', stock: 300 },
    { id: 'tpl-pool-b1', type: 'FORTUNE_BAG', typeName: '福袋', name: '开播福袋', stock: 200 },
    { id: 'tpl-pool-b2', type: 'FORTUNE_BAG', typeName: '福袋', name: '整点福袋', stock: 100 },
    { id: 'tpl-pool-s1', type: 'SIGN_IN', typeName: '签到', name: '直播签到有礼', stock: null },
    { id: 'tpl-pool-t1', type: 'TASK', typeName: '观看任务', name: '观看满10分钟领积分', stock: null },
    { id: 'tpl-pool-t2', type: 'TASK', typeName: '观看任务', name: '观看满30分钟领券', stock: null }
  ];

  window.MdmLiveDemo = {
    rooms: rooms,
    timeslots: timeslots,
    sessions: sessions,
    categories: categories,
    productsBySession: productsBySession,
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
      { value: 'STORE_MEMBER', label: '仅门店会员' }
    ],
    templateTypeOptions: [
      { value: 'COUPON', label: '优惠券' },
      { value: 'FORTUNE_BAG', label: '福袋' },
      { value: 'SIGN_IN', label: '签到' },
      { value: 'TASK', label: '观看任务' }
    ]
  };
})();
