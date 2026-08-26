/**
 * 原型 Mock 数据：店铺概览、趋势图、会员列表、订单列表、模拟扫码订单
 */
(function (global) {
  const mockData = {
    store: {
      companyName: "冷丰生鲜超市",
      roleLabel: "根组织管理",
      avatarLetter: "y",
      miniProgramUrl: "https://example.com/wandoujia/store?id=wdj001",
      queueCodeUrl: "https://example.com/wandoujia/queue?id=wdj001",
    },

    overview: {
      /** 今日维度 */
      today: {
        orders: 48,
        pickups: 12,
        newMembers: 6,
        orderAmount: 12860.5,
      },
      /** 全部时间（订单总数 / 会员总数 / 订单总金额） */
      all: {
        orders: 12580,
        newMembers: 8920,
        orderAmount: 2650080.5,
      },
    },

    /**
     * 趋势数据：主维度 orders | members | revenue
     * 子维度 day | week | month —— 值为与标签一一对应的序列
     */
    trends: {
      orders: {
        day: {
          labels: ["24日", "25日", "26日", "27日", "28日", "29日", "30日"],
          values: [32, 45, 38, 52, 48, 56, 48],
          month: 3,
        },
        month: {
          labels: ["10月", "11月", "12月", "1月", "2月", "3月"],
          values: [1860, 2045, 1928, 2156, 1872, 2340],
          years: [2025, 2025, 2025, 2026, 2026, 2026],
        },
        /** 日模式下滑动查看更早月份的历史数据（最后一条 = 当前月）；month 为该段 X 轴「日」所属月份 */
        day_history: [
          { labels: ["1日", "2日", "3日", "4日", "5日", "6日", "7日"], values: [28, 35, 30, 42, 38, 45, 40], month: 2 },
          { labels: ["8日", "9日", "10日", "11日", "12日", "13日", "14日"], values: [33, 40, 36, 48, 44, 50, 45], month: 2 },
          { labels: ["15日", "16日", "17日", "18日", "19日", "20日", "21日"], values: [30, 38, 42, 36, 45, 50, 46], month: 2 },
          { labels: ["22日", "23日", "24日", "25日", "26日", "27日", "28日"], values: [35, 42, 32, 45, 38, 52, 48], month: 3 },
          { labels: ["24日", "25日", "26日", "27日", "28日", "29日", "30日"], values: [32, 45, 38, 52, 48, 56, 48], month: 3 },
        ],
      },
      members: {
        day: {
          labels: ["24日", "25日", "26日", "27日", "28日", "29日", "30日"],
          values: [3, 5, 4, 6, 5, 7, 6],
          month: 3,
        },
        month: {
          labels: ["10月", "11月", "12月", "1月", "2月", "3月"],
          values: [85, 96, 88, 102, 94, 118],
          years: [2025, 2025, 2025, 2026, 2026, 2026],
        },
        day_history: [
          { labels: ["1日", "2日", "3日", "4日", "5日", "6日", "7日"], values: [2, 3, 2, 4, 3, 5, 4], month: 2 },
          { labels: ["8日", "9日", "10日", "11日", "12日", "13日", "14日"], values: [3, 4, 3, 5, 4, 6, 5], month: 2 },
          { labels: ["15日", "16日", "17日", "18日", "19日", "20日", "21日"], values: [2, 4, 5, 3, 5, 6, 5], month: 2 },
          { labels: ["22日", "23日", "24日", "25日", "26日", "27日", "28日"], values: [3, 5, 3, 5, 4, 6, 5], month: 3 },
          { labels: ["24日", "25日", "26日", "27日", "28日", "29日", "30日"], values: [3, 5, 4, 6, 5, 7, 6], month: 3 },
        ],
      },
      revenue: {
        day: {
          labels: ["24日", "25日", "26日", "27日", "28日", "29日", "30日"],
          values: [4860, 5620, 4890, 6280, 5820, 6890, 6820],
          month: 3,
        },
        month: {
          labels: ["10月", "11月", "12月", "1月", "2月", "3月"],
          values: [125680, 138920, 129840, 148520, 135680, 162840],
          years: [2025, 2025, 2025, 2026, 2026, 2026],
        },
        day_history: [
          { labels: ["1日", "2日", "3日", "4日", "5日", "6日", "7日"], values: [4200, 5100, 4680, 5400, 4900, 5800, 5200], month: 2 },
          { labels: ["8日", "9日", "10日", "11日", "12日", "13日", "14日"], values: [4500, 5400, 4800, 6000, 5500, 6200, 5600], month: 2 },
          { labels: ["15日", "16日", "17日", "18日", "19日", "20日", "21日"], values: [4300, 5200, 5600, 4900, 5800, 6400, 5800], month: 2 },
          { labels: ["22日", "23日", "24日", "25日", "26日", "27日", "28日"], values: [4600, 5400, 4860, 5620, 4890, 6280, 5820], month: 3 },
          { labels: ["24日", "25日", "26日", "27日", "28日", "29日", "30日"], values: [4860, 5620, 4890, 6280, 5820, 6890, 6820], month: 3 },
        ],
      },
    },

    /**
     * 扫码获取的订单详情（会员条码关联多订单场景）
     * orders 数组：同时包含待收货、待提货订单，支持一码多订单勾选核销
     * shared 字段：买家共享信息
     */
    pendingVerifyOrder: {
      orderNo: "WDJ20260331001",
      /** 买家共享信息 */
      shared: {
        customer: "周文静",
        phone: "159****8832",
      },
      /**
       * 子订单列表（可勾选核销）
       * 扫码后同时展示待收货与待提货订单，支持订单级 + 商品级勾选。
       */
      orders: [
        {
          id: "o6-2",
          orderNo: "WDJ20260401001",
          createdAt: "2026-04-01 10:20",
          status: "待提货",
          amount: 396,
          items: [
            {
              name: "冷冻虾仁 500g",
              qty: 4,
              price: 99,
              image: "https://placehold.co/80x80/f5f5f5/999?text=虾仁",
              _verifiedQty: 2,
              _lastVerifyTime: "2026-04-01 11:05",
            },
          ],
        },
        {
          id: "o6-1",
          orderNo: "WDJ20260330001",
          createdAt: "2026-03-30 09:15",
          status: "待提货",
          amount: 588,
          items: [
            { name: "有机水果礼盒 A款", qty: 1, price: 198, image: "https://placehold.co/80x80/f5f5f5/999?text=水果A" },
            { name: "有机水果礼盒 B款", qty: 3, price: 130, image: "https://placehold.co/80x80/f5f5f5/999?text=水果B" },
          ],
        },
        {
          id: "o6-3",
          orderNo: "WDJ20260401002",
          createdAt: "2026-04-01 11:35",
          status: "待提货",
          amount: 536,
          items: [
            { name: "有机鸡蛋 30枚", qty: 2, price: 68, image: "https://placehold.co/80x80/f5f5f5/999?text=鸡蛋" },
            { name: "纯牛奶 24盒装", qty: 3, price: 99, image: "https://placehold.co/80x80/f5f5f5/999?text=牛奶" },
            { name: "精品坚果礼盒", qty: 1, price: 103, image: "https://placehold.co/80x80/f5f5f5/999?text=坚果" },
          ],
        },
        {
          id: "o6-4",
          orderNo: "WDJ20260401003",
          createdAt: "2026-04-01 14:08",
          status: "待提货",
          amount: 168,
          items: [
            { name: "有机杂粮礼盒", qty: 1, price: 168, image: "https://placehold.co/80x80/f5f5f5/999?text=杂粮" },
          ],
        },
        {
          id: "o6-5",
          orderNo: "WDJ20260401004",
          createdAt: "2026-04-01 15:42",
          status: "待提货",
          amount: 252,
          items: [
            { name: "鲜切牛排 200g", qty: 2, price: 86, image: "https://placehold.co/80x80/f5f5f5/999?text=牛排" },
            { name: "有机西兰花 500g", qty: 1, price: 80, image: "https://placehold.co/80x80/f5f5f5/999?text=西兰花" },
          ],
        },
        {
          id: "o6-6",
          orderNo: "WDJ20260331008",
          createdAt: "2026-03-31 08:42",
          status: "待收货",
          amount: 99,
          items: [
            { name: "新鲜牛奶 24盒装", qty: 1, price: 99, image: "https://placehold.co/80x80/f5f5f5/999?text=牛奶" },
          ],
        },
        {
          id: "o6-7",
          orderNo: "WDJ20260330102",
          createdAt: "2026-03-30 14:28",
          status: "待提货",
          amount: 168,
          items: [
            { name: "有机杂粮礼盒", qty: 1, price: 168, image: "https://placehold.co/80x80/f5f5f5/999?text=杂粮" },
            { name: "有机大米 5kg", qty: 1, price: 88, image: "https://placehold.co/80x80/f5f5f5/999?text=大米", refund: { returnQty: 1, refundAmount: 88 } },
          ],
        },
        {
          id: "o6-8",
          orderNo: "WDJ20260331102",
          createdAt: "2026-03-31 10:05",
          status: "待提货",
          amount: 84,
          items: [
            { name: "精品坚果礼盒", qty: 2, price: 84, image: "https://placehold.co/80x80/f5f5f5/999?text=坚果", refund: { returnQty: 1, refundAmount: 84 } },
          ],
        },
        {
          id: "o6-9",
          orderNo: "WDJ20260331020",
          createdAt: "2026-03-31 09:30",
          status: "待收货",
          amount: 198,
          items: [
            { name: "有机水果礼盒 A款", qty: 1, price: 198, image: "https://placehold.co/80x80/f5f5f5/999?text=水果A", refunding: true },
          ],
        },
      ],
    },

    members: [
      { id: "m1", name: "王小明", phone: "138****1024", level: "金卡", joinAt: "2026-03-28", orderCount: 12, totalAmount: 2680.5, lastOrderAt: "2026-03-30" },
      { id: "m2", name: "李芳", phone: "159****8891", level: "银卡", joinAt: "2026-03-29", orderCount: 5, totalAmount: 680.0, lastOrderAt: "2026-03-30" },
      { id: "m3", name: "陈晨", phone: "186****2233", level: "普通", joinAt: "2026-03-30", orderCount: 3, totalAmount: 1260.0, lastOrderAt: "2026-03-29" },
      { id: "m4", name: "刘洋", phone: "177****5566", level: "金卡", joinAt: "2026-03-25", orderCount: 8, totalAmount: 1896.0, lastOrderAt: "2026-03-28" },
    ],

    /**
     * 按手机号匹配的核销订单（头像跳转核销页时使用，优先于 orders 列表）
     */
    verifyOrdersByPhone: {
      "177****5566": {
        shared: { customer: "小帅", phone: "177****5566" },
        orders: [
          {
            id: "qv-1",
            orderNo: "WDJ20260107001",
            createdAt: "2026-01-07 17:50",
            status: "待提货",
            amount: 168,
            items: [
              { name: "有机水果礼盒", qty: 1, price: 168, image: "https://placehold.co/80x80/f5f5f5/999?text=水果" },
            ],
          },
        ],
      },
      "186****2233": {
        shared: { customer: "王小明", phone: "186****2233" },
        orders: [
          {
            id: "qv-2",
            orderNo: "WDJ20260107002",
            createdAt: "2026-01-07 18:40",
            status: "待收货",
            amount: 268,
            items: [
              { name: "有机苹果礼盒 3斤装", qty: 1, price: 168, image: "https://placehold.co/80x80/f5f5f5/999?text=苹果" },
              { name: "新鲜橙子 5斤装", qty: 2, price: 50, image: "https://placehold.co/80x80/f5f5f5/999?text=橙子" },
            ],
          },
        ],
      },
    },

    /**
     * 排队记录
     * source: scan 扫码排队（已到店）| appointment 在线预约（未到店）
     */
    queueRecords: [
      {
        id: "q1",
        customer: "小帅",
        phone: "138****1024",
        avatar: "https://placehold.co/80x80/e8f5e9/27ae60?text=帅",
        source: "appointment",
        queueStatus: "未到店",
        appointmentTime: "18:08",
        note: "",
      },
      {
        id: "q2",
        customer: "李芳",
        phone: "159****8891",
        avatar: "https://placehold.co/80x80/e3f2fd/2980b9?text=芳",
        source: "scan",
        queueStatus: "已到店",
        queueNo: 2,
        arriveTime: "2026-01-07 17:32:15",
        queueTime: "17:32",
        waitMinutes: 25,
        memberMessage: "请帮我留冰袋，谢谢",
        note: "",
      },
      {
        id: "q3",
        customer: "王小明",
        phone: "186****2233",
        avatar: "https://placehold.co/80x80/fff3e0/e67e00?text=王",
        source: "appointment",
        queueStatus: "未到店",
        appointmentTime: "19:00",
        note: "需要试吃样品",
      },
      {
        id: "q4",
        customer: "小帅",
        phone: "177****5566",
        avatar: "https://placehold.co/80x80/e8f5e9/27ae60?text=帅",
        source: "scan",
        queueStatus: "已到店",
        callStatus: "calling",
        callerName: "小帅",
        callTime: "18:55",
        queueNo: 1,
        arriveTime: "2026-01-07 18:17:01",
        queueTime: "18:17",
        waitMinutes: 38,
        memberMessage: "",
        note: "",
      },
    ],

    orders: [
      {
        id: "o1",
        orderNo: "WDJ20260330001",
        status: "待提货",
        amount: 588,
        createdAt: "2026-03-30 09:15",
        customer: "周文静",
        phone: "159****8832",
        pickupTime: "2026-04-01 10:00",
        items: [
          { name: "有机水果礼盒 A款", qty: 1, price: 198 },
          {
            name: "有机水果礼盒 B款",
            qty: 3,
            price: 130,
            _verifiedQty: 2,
            _lastVerifyTime: "2026-04-01 10:48",
          },
        ],
      },
      {
        id: "o2",
        orderNo: "WDJ20260401001",
        status: "待提货",
        amount: 396,
        createdAt: "2026-04-01 10:20",
        customer: "周文静",
        phone: "159****8832",
        pickupTime: "2026-04-01 14:00",
        items: [
          { name: "冷冻虾仁 500g", qty: 4, price: 99, _verifiedQty: 2, _lastVerifyTime: "2026-04-01 11:05" },
        ],
      },
      {
        id: "o2b",
        orderNo: "WDJ20260401002",
        status: "待提货",
        amount: 536,
        createdAt: "2026-04-01 11:35",
        customer: "周文静",
        phone: "159****8832",
        pickupTime: "2026-04-01 16:00",
        items: [
          { name: "有机鸡蛋 30枚", qty: 2, price: 68 },
          { name: "纯牛奶 24盒装", qty: 3, price: 99 },
          { name: "精品坚果礼盒", qty: 1, price: 103 },
        ],
      },
      {
        id: "o2c",
        orderNo: "WDJ20260401003",
        status: "待提货",
        amount: 168,
        createdAt: "2026-04-01 14:08",
        customer: "李芳",
        phone: "159****8891",
        pickupTime: "2026-04-01 18:00",
        items: [
          { name: "有机杂粮礼盒", qty: 1, price: 168 },
        ],
      },
      {
        id: "o2d",
        orderNo: "WDJ20260401004",
        status: "待提货",
        amount: 252,
        createdAt: "2026-04-01 15:42",
        customer: "王小明",
        phone: "138****1024",
        pickupTime: "2026-04-02 10:00",
        items: [
          { name: "鲜切牛排 200g", qty: 2, price: 86 },
          { name: "有机西兰花 500g", qty: 1, price: 80 },
        ],
      },
      {
        id: "o2e",
        orderNo: "WDJ20260331008",
        status: "待收货",
        amount: 99,
        createdAt: "2026-03-31 08:42",
        customer: "周文静",
        phone: "159****8832",
        items: [
          { name: "新鲜牛奶 24盒装", qty: 1, price: 99 },
        ],
      },
      {
        id: "o2f",
        orderNo: "WDJ20260330102",
        status: "待提货",
        amount: 168,
        createdAt: "2026-03-30 14:28",
        customer: "周文静",
        phone: "159****8832",
        pickupTime: "2026-03-31 10:00",
        items: [
          { name: "有机杂粮礼盒", qty: 1, price: 168 },
          { name: "有机大米 5kg", qty: 1, price: 88 },
        ],
      },
      {
        id: "o2g",
        orderNo: "WDJ20260331102",
        status: "待提货",
        amount: 84,
        createdAt: "2026-03-31 10:05",
        customer: "周文静",
        phone: "159****8832",
        pickupTime: "2026-04-01 12:00",
        items: [
          { name: "精品坚果礼盒", qty: 2, price: 84 },
        ],
      },
      {
        id: "o2h",
        orderNo: "WDJ20260331020",
        status: "待收货",
        amount: 198,
        createdAt: "2026-03-31 09:30",
        customer: "王小明",
        phone: "138****1024",
        items: [
          { name: "有机水果礼盒 A款", qty: 1, price: 198 },
        ],
      },
      {
        id: "o3",
        orderNo: "WDJ20260329188",
        status: "待提货",
        amount: 520,
        createdAt: "2026-03-29 18:40",
        customer: "陈晨",
        phone: "186****2233",
        pickupTime: "2026-03-31 10:00",
        refund: { returnQty: 1, refundAmount: 140 },
        items: [
          { name: "精品水果礼盒", qty: 1, price: 380 },
          { name: "坚果零食大礼包", qty: 1, price: 140 },
        ],
      },
      {
        id: "o4",
        orderNo: "WDJ20260329102",
        status: "已完成",
        amount: 328,
        createdAt: "2026-03-28 16:30",
        customer: "刘洋",
        phone: "177****5566",
        verifyTime: "2026-03-29 11:20",
        items: [
          { name: "有机杂粮礼盒", qty: 1, price: 188, _verified: true, _verifyTime: "2026-03-29 11:20" },
          { name: "纯牛奶 24盒装", qty: 1, price: 140, _verified: true, _verifyTime: "2026-03-29 11:20" },
        ],
      },
      {
        id: "o5",
        orderNo: "WDJ20260330008",
        status: "待提货",
        amount: 672,
        createdAt: "2026-03-30 08:30",
        customer: "张伟",
        phone: "136****7701",
        pickupTime: "2026-04-02 11:00",
        items: [
          { name: "有机水果礼盒 A款", qty: 1, price: 198, _verifiedQty: 1, _lastVerifyTime: "2026-03-31 09:15" },
          {
            name: "有机水果礼盒 B款",
            qty: 3,
            price: 158,
            _verifiedQty: 2,
            _lastVerifyTime: "2026-04-01 10:48",
          },
        ],
      },
    ],
  };

  global.LFMockData = mockData;
})(typeof window !== "undefined" ? window : globalThis);
