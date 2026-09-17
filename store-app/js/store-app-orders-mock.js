/**
 * 原型 Mock 数据：店铺概览、趋势图、会员列表、订单列表、模拟扫码订单
 */
(function (global) {
  const mockData = {
    store: {
      storeId: "ONS303445581201",
      companyName: "冷丰生鲜超市",
      roleLabel: "根组织管理",
      avatarLetter: "y",
      miniProgramUrl: "https://example.com/wandoujia/store?id=wdj001",
      queueCodeUrl: "https://example.com/wandoujia/queue?id=wdj001",
      promoCodeUrl: "lengfeng-store:ONS303445581201",
      staff: {
        id: "STAFF-001",
        name: "牛店长",
        phone: "13812348001",
        role: "店长"
      }
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
          id: "o6-split-spot",
          orderNo: "ORD-3212689201599601",
          createdAt: "2026-09-14 10:22",
          status: "待核销",
          cutoff: true,
          amount: 13.6,
          items: [
            {
              name: "门店现货·有机上海青 500g",
              qty: 2,
              price: 6.8,
              fulfillTag: "现货直核",
              skipDemandSummary: true,
              image: "../user-app/assets/order-product-1.svg",
            },
          ],
        },
        {
          id: "o6-spot",
          orderNo: "ORD-3212689201599501",
          createdAt: "2026-09-13 09:18",
          status: "待核销",
          cutoff: true,
          amount: 13.6,
          items: [
            {
              name: "门店现货·有机上海青 500g",
              qty: 2,
              price: 6.8,
              fulfillTag: "现货直核",
              skipDemandSummary: true,
              image: "../user-app/assets/order-product-1.svg",
            },
          ],
        },
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
            { name: "鲜切牛排 200g", qty: 2, price: 86, image: "https://placehold.co/80x80/f5f5f5/999?text=牛排", aftersaleType: "补货", restockQty: 1, aftersaleStatus: "补货中" },
            { name: "有机西兰花 500g", qty: 1, price: 80, image: "https://placehold.co/80x80/f5f5f5/999?text=西兰花" },
          ],
        },
        {
          id: "o6-6",
          orderNo: "WDJ20260331008",
          createdAt: "2026-03-31 08:42",
          status: "待收货",
          cutoff: true,
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
            { name: "有机大米 5kg", qty: 1, price: 88, image: "https://placehold.co/80x80/f5f5f5/999?text=大米", aftersaleType: "退货退款", refundStatus: "待退货", refund: { returnQty: 1, refundAmount: 88, type: "退货退款" } },
          ],
        },
        {
          id: "o6-8",
          orderNo: "WDJ20260331102",
          createdAt: "2026-03-31 10:05",
          status: "待提货",
          amount: 84,
          items: [
            { name: "精品坚果礼盒", qty: 2, price: 84, image: "https://placehold.co/80x80/f5f5f5/999?text=坚果", aftersaleType: "退货退款", refundStatus: "待审批", refund: { returnQty: 1, refundAmount: 84, type: "退货退款" } },
          ],
        },
        {
          id: "o6-9",
          orderNo: "WDJ20260331020",
          createdAt: "2026-03-31 09:30",
          status: "待收货",
          cutoff: true,
          amount: 198,
          items: [
            { name: "有机水果礼盒 A款", qty: 1, price: 198, image: "https://placehold.co/80x80/f5f5f5/999?text=水果A", refunding: true, refundStatus: "退款中" },
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
            cutoff: true,
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
        id: "oSpot1",
        orderNo: "ORD-3212689201599501",
        status: "待核销",
        cutoff: true,
        amount: 13.6,
        createdAt: "2026-09-13 09:18",
        customer: "赵金芝",
        phone: "138****9501",
        pickupTime: "2026-09-13 09:18",
        items: [
          {
            name: "门店现货·有机上海青 500g",
            qty: 2,
            price: 6.8,
            fulfillTag: "现货直核",
            skipDemandSummary: true,
          },
        ],
      },
      {
        id: "oSplitSpot",
        orderNo: "ORD-3212689201599601",
        status: "待核销",
        cutoff: true,
        amount: 13.6,
        createdAt: "2026-09-14 10:22",
        customer: "赵金芝",
        phone: "138****9601",
        pickupTime: "2026-09-14 10:22",
        items: [
          {
            name: "门店现货·有机上海青 500g",
            qty: 2,
            price: 6.8,
            fulfillTag: "现货直核",
            skipDemandSummary: true,
          },
        ],
      },
      {
        id: "oSplitWh",
        orderNo: "ORD-3212689201599602",
        status: "待发货",
        cutoff: true,
        amount: 96.8,
        createdAt: "2026-09-14 10:22",
        customer: "赵金芝",
        phone: "138****9601",
        items: [
          {
            name: "精选金钱牛腱子肉 1kg",
            qty: 1,
            price: 96.8,
          },
        ],
      },
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
          {
            name: "有机水果礼盒 A款",
            qty: 1,
            price: 198,
            aftersaleType: "补货",
            restockQty: 1,
            aftersaleStatus: "补货中",
          },
          {
            name: "有机水果礼盒 B款",
            qty: 3,
            price: 130,
            _verifiedQty: 2,
            _lastVerifyTime: "2026-04-01 10:48",
            aftersaleType: "退货退款",
            refundStatus: "待退货",
            refund: { returnQty: 1, refundAmount: 130, type: "退货退款" },
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
          {
            name: "冷冻虾仁 500g",
            qty: 4,
            price: 99,
            _verifiedQty: 2,
            _lastVerifyTime: "2026-04-01 11:05",
            aftersaleType: "补货",
            restockQty: 2,
            aftersaleStatus: "补货中",
          },
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
        cutoff: true,
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
          { name: "有机大米 5kg", qty: 1, price: 88, aftersaleType: "退货退款", refundStatus: "待退货", refund: { returnQty: 1, refundAmount: 88, type: "退货退款" } },
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
            { name: "精品坚果礼盒", qty: 2, price: 84, aftersaleType: "退货退款", refundStatus: "待审批", refund: { returnQty: 1, refundAmount: 84, type: "退货退款" } },
        ],
      },
      {
        id: "o2h",
        orderNo: "WDJ20260331020",
        status: "待收货",
        cutoff: true,
        amount: 198,
        createdAt: "2026-03-31 09:30",
        customer: "王小明",
        phone: "138****1024",
        items: [
          { name: "有机水果礼盒 A款", qty: 1, price: 198, refunding: true, refundStatus: "退款中", refund: { returnQty: 1, refundAmount: 198 } },
        ],
      },
      {
        id: "oShip1",
        orderNo: "WDJ20260402001",
        status: "待发货",
        cutoff: true,
        amount: 86,
        createdAt: "2026-04-02 07:20",
        customer: "李芳",
        phone: "159****8891",
        items: [
          { name: "鲜切牛排 200g", qty: 1, price: 86 },
        ],
      },
      {
        id: "oShip2",
        orderNo: "WDJ20260402002",
        status: "待发货",
        cutoff: false,
        amount: 80,
        createdAt: "2026-04-02 09:10",
        customer: "陈晨",
        phone: "186****2233",
        items: [
          { name: "有机西兰花 500g", qty: 1, price: 80 },
        ],
      },
      {
        id: "oRecvOpen",
        orderNo: "WDJ20260402003",
        status: "待收货",
        cutoff: false,
        amount: 99,
        createdAt: "2026-04-02 08:05",
        customer: "刘洋",
        phone: "177****5566",
        items: [
          { name: "新鲜牛奶 24盒装", qty: 1, price: 99 },
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
        refund: { returnQty: 1, refundAmount: 140, type: "退货退款" },
        items: [
          { name: "精品水果礼盒", qty: 1, price: 380 },
          { name: "坚果零食大礼包", qty: 1, price: 140, aftersaleType: "退货退款", refundStatus: "待退货", refund: { returnQty: 1, refundAmount: 140, type: "退货退款" } },
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
      {
        id: "oExp1",
        orderNo: "WDJ20260405011",
        shipMode: "快递",
        status: "待收货",
        amount: 168,
        createdAt: "2026-04-05 09:20",
        customer: "赵敏",
        phone: "135****6618",
        items: [
          { name: "有机杂粮礼盒", qty: 1, price: 168 },
        ],
        express: {
          courier: "申通快递",
          trackingNo: "773075059702651",
          logisticsStatus: "派送中",
          address: {
            name: "赵敏",
            phone: "135****6618",
            text: "四川省成都市武侯区天府大道中段666号天府软件园A区",
          },
          timeline: [
            { type: "address", text: "【收货地址】四川省成都市武侯区天府大道中段666号天府软件园A区 赵敏 135****6618" },
            { time: "04-06\n09:10", title: "派送中", desc: "【成都市】快件正在派送中，派送员：李师傅，请保持电话畅通", active: true },
            { time: "04-06\n06:40", title: "运输中", desc: "【成都市】快件已到达 成都双流转运中心" },
            { time: "04-05\n20:15", title: "运输中", desc: "【重庆市】快件离开 重庆转运中心，下一站 成都双流转运中心" },
            { time: "04-05\n15:00", title: "已揽件", desc: "【重庆市】快件已在 重庆渝北营业部 揽收" },
            { time: "04-05\n14:20", title: "已发货", desc: "包裹正在等待揽收" },
            { time: "04-05\n09:20", title: "已下单", desc: "商品已经下单" },
          ],
        },
      },
      {
        id: "oExp2",
        orderNo: "WDJ20260405012",
        shipMode: "快递",
        status: "待发货",
        amount: 266,
        createdAt: "2026-04-05 11:06",
        customer: "孙悦",
        phone: "151****2290",
        items: [
          { name: "鲜切牛排 200g", qty: 2, price: 86 },
          { name: "有机西兰花 500g", qty: 1, price: 94 },
        ],
        express: {
          courier: "",
          trackingNo: "",
          logisticsStatus: "待发货",
          address: {
            name: "孙悦",
            phone: "151****2290",
            text: "浙江省杭州市西湖区文三路478号华星时代广场",
          },
          timeline: [
            { type: "address", text: "【收货地址】浙江省杭州市西湖区文三路478号华星时代广场 孙悦 151****2290" },
            { time: "04-05\n11:06", title: "已下单", desc: "商品已经下单，仓库备货中", active: true },
          ],
        },
      },
      {
        id: "oExp3",
        orderNo: "WDJ20260403008",
        shipMode: "快递",
        status: "已完成",
        amount: 198,
        createdAt: "2026-04-03 16:40",
        customer: "周文静",
        phone: "159****8832",
        items: [
          { name: "有机水果礼盒 A款", qty: 1, price: 198 },
        ],
        express: {
          courier: "中通快递",
          trackingNo: "788012345678901",
          logisticsStatus: "已签收",
          address: {
            name: "周文静",
            phone: "159****8832",
            text: "广东省深圳市南山区科技园南路18号",
          },
          timeline: [
            { type: "address", text: "【收货地址】广东省深圳市南山区科技园南路18号 周文静 159****8832" },
            { time: "04-05\n12:00", title: "已签收", desc: "期待再次为您服务", active: true },
            { time: "04-05\n08:20", title: "派送中", desc: "【深圳市】快件正在派送中，派送员：王师傅，请保持电话畅通" },
            { time: "04-04\n22:15", title: "运输中", desc: "【深圳市】快件离开 深圳转运中心" },
            { time: "04-04\n10:05", title: "已揽件", desc: "【广州市】快件已揽收" },
            { time: "04-03\n16:40", title: "已下单", desc: "商品已经下单" },
          ],
        },
      },
      {
        id: "oExpMulti",
        orderNo: "WDJ20260406021",
        shipMode: "快递",
        status: "待收货",
        amount: 434,
        createdAt: "2026-04-06 10:18",
        customer: "吴芳",
        phone: "139****8800",
        items: [
          { name: "有机杂粮礼盒", qty: 1, price: 168 },
          { name: "鲜切牛排 200g", qty: 2, price: 86 },
          { name: "有机西兰花 500g", qty: 1, price: 94 },
        ],
        packages: [
          {
            courier: "申通快递",
            trackingNo: "773075059702888",
            logisticsStatus: "运输中",
            items: [{ name: "有机杂粮礼盒", qty: 1, price: 168 }],
            address: {
              name: "吴芳",
              phone: "139****8800",
              text: "重庆市渝北区金开大道西段88号",
            },
            timeline: [
              { type: "address", text: "【收货地址】重庆市渝北区金开大道西段88号 吴芳 139****8800" },
              { time: "04-07\n08:20", title: "运输中", desc: "【重庆市】快件离开 重庆转运中心，下一站 渝北营业部", active: true },
              { time: "04-06\n22:10", title: "运输中", desc: "【成都市】快件已到达 成都双流转运中心" },
              { time: "04-06\n16:40", title: "已揽件", desc: "【成都市】快件已在 成都高新营业部 揽收" },
              { time: "04-06\n15:10", title: "已发货", desc: "包裹正在等待揽收" },
              { time: "04-06\n10:18", title: "已下单", desc: "商品已经下单" },
            ],
          },
          {
            courier: "中通快递",
            trackingNo: "788012345678902",
            logisticsStatus: "派送中",
            items: [
              { name: "鲜切牛排 200g", qty: 2, price: 86 },
              { name: "有机西兰花 500g", qty: 1, price: 94 },
            ],
            address: {
              name: "吴芳",
              phone: "139****8800",
              text: "重庆市渝北区金开大道西段88号",
            },
            timeline: [
              { type: "address", text: "【收货地址】重庆市渝北区金开大道西段88号 吴芳 139****8800" },
              { time: "04-07\n09:15", title: "派送中", desc: "【重庆市】快件正在派送中，派送员：周师傅，请保持电话畅通", active: true },
              { time: "04-07\n06:50", title: "运输中", desc: "【重庆市】快件已到达 渝北转运中心" },
              { time: "04-06\n20:05", title: "运输中", desc: "【成都市】快件离开 成都双流转运中心" },
              { time: "04-06\n14:30", title: "已揽件", desc: "【成都市】快件已揽收" },
              { time: "04-06\n13:40", title: "已发货", desc: "包裹正在等待揽收" },
              { time: "04-06\n10:18", title: "已下单", desc: "商品已经下单" },
            ],
          },
        ],
        express: {
          courier: "申通快递",
          trackingNo: "773075059702888",
          logisticsStatus: "运输中",
        },
      },
      {
        id: "oExp4",
        orderNo: "WDJ20260401055",
        shipMode: "快递",
        status: "已关闭",
        amount: 80,
        createdAt: "2026-04-01 19:12",
        customer: "陈晨",
        phone: "186****2233",
        items: [
          { name: "有机西兰花 500g", qty: 1, price: 80 },
        ],
        express: {
          courier: "",
          trackingNo: "",
          logisticsStatus: "已关闭",
          address: {
            name: "陈晨",
            phone: "186****2233",
            text: "上海市浦东新区张江路1200号",
          },
          timeline: [
            { type: "address", text: "【收货地址】上海市浦东新区张江路1200号 陈晨 186****2233" },
            { time: "04-01\n20:05", title: "已关闭", desc: "超时未支付，订单已关闭", active: true },
            { time: "04-01\n19:12", title: "已下单", desc: "商品已经下单" },
          ],
        },
      },
      {
        id: "oClose1",
        orderNo: "WDJ20260401056",
        status: "已关闭",
        amount: 99,
        createdAt: "2026-04-01 20:18",
        customer: "刘洋",
        phone: "177****5566",
        items: [
          { name: "新鲜牛奶 24盒装", qty: 1, price: 99 },
        ],
      },
    ],
  };

  var DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160&h=160&fit=crop";
  var PRODUCT_INFO = {
    "有机水果礼盒 A款": { spec: "A款", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160&h=160&fit=crop" },
    "有机水果礼盒 B款": { spec: "B款", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=160&h=160&fit=crop" },
    "有机水果礼盒": { spec: "1盒", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160&h=160&fit=crop" },
    "精品水果礼盒": { spec: "1盒", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=160&h=160&fit=crop" },
    "冷冻虾仁 500g": { spec: "500g", image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=160&h=160&fit=crop" },
    "有机鸡蛋 30枚": { spec: "30枚", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=160&h=160&fit=crop" },
    "纯牛奶 24盒装": { spec: "24盒", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=160&h=160&fit=crop" },
    "新鲜牛奶 24盒装": { spec: "24盒", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=160&h=160&fit=crop" },
    "精品坚果礼盒": { spec: "1盒", image: "https://images.unsplash.com/photo-1599599810769-628e4c8b3d80?w=160&h=160&fit=crop" },
    "坚果零食大礼包": { spec: "1包", image: "https://images.unsplash.com/photo-1599599810769-628e4c8b3d80?w=160&h=160&fit=crop" },
    "有机杂粮礼盒": { spec: "1盒", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&h=160&fit=crop" },
    "有机大米 5kg": { spec: "5kg", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&h=160&fit=crop" },
    "鲜切牛排 200g": { spec: "200g", image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=160&h=160&fit=crop" },
    "有机西兰花 500g": { spec: "500g", image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=160&h=160&fit=crop" },
    "有机苹果礼盒 3斤装": { spec: "3斤", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=160&h=160&fit=crop" },
    "新鲜橙子 5斤装": { spec: "5斤", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=160&h=160&fit=crop" },
  };

  function inferSpec(name) {
    var m = String(name || "").match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|L|枚|盒|斤|袋|包)|A款|B款|\d+盒装)/i);
    return m ? m[1].replace(/\s+/g, "") : "1份";
  }

  function enrichItems(items) {
    (items || []).forEach(function (item) {
      var info = PRODUCT_INFO[item.name] || {};
      if (!item.spec) item.spec = info.spec || inferSpec(item.name);
      var broken = !item.image || /goods-guava|placehold\.co/.test(item.image);
      if (broken) item.image = info.image || DEFAULT_PRODUCT_IMAGE;
    });
  }

  function enrichOrderList(list) {
    (list || []).forEach(function (o) {
      enrichItems(o.items);
      (o.packages || []).forEach(function (pkg) {
        enrichItems(pkg.items);
      });
    });
  }

  enrichOrderList(mockData.orders);
  if (mockData.pendingVerifyOrder) enrichOrderList(mockData.pendingVerifyOrder.orders);
  if (mockData.verifyOrdersByPhone) {
    Object.keys(mockData.verifyOrdersByPhone).forEach(function (phone) {
      enrichOrderList(mockData.verifyOrdersByPhone[phone].orders);
    });
  }

  var VERIFY_DEMO_KEY = "lf_store_verify_demo_v1";
  var PLATFORM_ORDER_KEY = "lf_basic_settings_order_config";
  var STORE_ORDER_KEY = "lf_store_order_config_" + (mockData.store && mockData.store.storeId ? mockData.store.storeId : "ONS303445581201");
  var VERIFY_DEMO_SCENES = [
    { id: "mixed", label: "默认混合列表" },
    { id: "cutoff", label: "已截单可核三态" },
    { id: "nocutoff", label: "未截单不可核" },
    { id: "multi", label: "多会员可核销" },
    { id: "pending", label: "售后待审批" },
    { id: "approved", label: "售后已过审" },
    { id: "partial", label: "部分核销" },
    { id: "done", label: "已全部核销" },
  ];
  var DEFAULT_ORDERS = JSON.parse(JSON.stringify(mockData.orders));

  function getVerifyDemoScene() {
    try {
      var saved = localStorage.getItem(VERIFY_DEMO_KEY);
      if (VERIFY_DEMO_SCENES.some(function (s) { return s.id === saved; })) return saved;
    } catch (e) {
      /* ignore */
    }
    return "mixed";
  }

  function pickOrders(ids) {
    var map = {};
    DEFAULT_ORDERS.forEach(function (o) { map[o.id] = o; });
    return ids.map(function (id) {
      return map[id] ? JSON.parse(JSON.stringify(map[id])) : null;
    }).filter(Boolean);
  }

  function mergeRefundFromSeed(list) {
    var seedMap = {};
    DEFAULT_ORDERS.forEach(function (o) {
      if (o && o.id) seedMap[o.id] = o;
    });
    (list || []).forEach(function (o) {
      var seed = seedMap[o.id];
      if (!seed) return;
      if (!o.refund && seed.refund) o.refund = JSON.parse(JSON.stringify(seed.refund));
      (o.items || []).forEach(function (item, idx) {
        var seedItem = seed.items && seed.items[idx];
        if (!seedItem || seedItem.name !== item.name) {
          seedItem = (seed.items || []).filter(function (it) { return it.name === item.name; })[0];
        }
        if (!seedItem) return;
        if (!item.refund && seedItem.refund) item.refund = JSON.parse(JSON.stringify(seedItem.refund));
        if (!item.refundStatus && seedItem.refundStatus) item.refundStatus = seedItem.refundStatus;
        if (item.refunding == null && seedItem.refunding) item.refunding = seedItem.refunding;
        if (!item.aftersaleType && seedItem.aftersaleType) item.aftersaleType = seedItem.aftersaleType;
        if (!item.aftersaleStatus && seedItem.aftersaleStatus) item.aftersaleStatus = seedItem.aftersaleStatus;
        if (item.restockQty == null && seedItem.restockQty != null) item.restockQty = seedItem.restockQty;
        if (!item.aftersales && seedItem.aftersales) item.aftersales = JSON.parse(JSON.stringify(seedItem.aftersales));
      });
    });
  }

  function stripItemAftersale(item) {
    delete item.refunding;
    delete item.refundStatus;
    delete item.aftersaleStatus;
    delete item.aftersaleType;
    delete item.aftersales;
    delete item.restockQty;
    delete item.refund;
    delete item.refunded;
    delete item.refundQty;
    delete item.refundAmount;
  }

  function applyVerifyDemoScene(scene) {
    var list;
    if (scene === "multi") {
      list = pickOrders(["o2c", "o2d", "o2e", "o2f"]);
      list.forEach(function (o) {
        delete o.refund;
        (o.items || []).forEach(stripItemAftersale);
      });
    } else if (scene === "pending") {
      list = pickOrders(["o2g", "o2c"]);
    } else if (scene === "approved") {
      list = pickOrders(["o2h", "o2d"]);
    } else if (scene === "partial") {
      list = pickOrders(["o1", "o2", "o5"]);
    } else if (scene === "done") {
      list = pickOrders(["o4"]);
    } else if (scene === "cutoff") {
      list = pickOrders(["oShip1", "o2e", "o2d"]);
    } else if (scene === "nocutoff") {
      list = pickOrders(["oShip2", "oRecvOpen", "o2d"]);
    } else {
      list = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
    }
    enrichOrderList(list);
    mockData.orders = list;
  }

  applyVerifyDemoScene(getVerifyDemoScene());

  try {
    var savedOrders = sessionStorage.getItem("lfStoreAppOrdersState");
    if (savedOrders) {
      var parsed = JSON.parse(savedOrders);
      if (Array.isArray(parsed) && parsed.length) {
        var have = {};
        parsed.forEach(function (o) { if (o && o.id) have[o.id] = true; });
        DEFAULT_ORDERS.forEach(function (seed) {
          if (!have[seed.id] && (isExpressOrder(seed) || seed.id === "oClose1")) {
            parsed.push(JSON.parse(JSON.stringify(seed)));
          }
        });
        mergeRefundFromSeed(parsed);
        enrichOrderList(parsed);
        mockData.orders = parsed;
      }
    }
  } catch (e) {
    /* ignore */
  }

  function readJsonSetting(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return Object.assign({}, fallback);
      return Object.assign({}, fallback, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, fallback);
    }
  }

  function writePendingShipmentSwitch(key, enabled) {
    var current = readJsonSetting(key, { storeQueue: "on", pendingShipmentVerify: "on" });
    current.pendingShipmentVerify = enabled ? "on" : "off";
    try {
      localStorage.setItem(key, JSON.stringify(current));
    } catch (e) {
      /* ignore */
    }
  }

  function isPendingShipmentVerifyEnabled() {
    var platform = readJsonSetting(PLATFORM_ORDER_KEY, { pendingShipmentVerify: "on" });
    var store = readJsonSetting(STORE_ORDER_KEY, { pendingShipmentVerify: "on" });
    return platform.pendingShipmentVerify !== "off" && store.pendingShipmentVerify !== "off";
  }

  function isOrderCutoff(order) {
    if (!order) return false;
    if (order.cutoff === true || order.cutoffPassed === true) return true;
    if (order.cutoff === false || order.cutoffPassed === false) return false;
    return order.status === "待提货" || order.status === "待核销" || order.status === "部分核销" || order.status === "已完成";
  }

  function isExpressOrder(order) {
    return !!(order && (order.shipMode === "快递" || order.deliveryMode === "express"));
  }

  function isFulfillmentVerifiable(order) {
    if (!order || isExpressOrder(order)) return false;
    var status = order.status;
    if (status === "待提货" || status === "待核销" || status === "部分核销") return true;
    if (status !== "待发货" && status !== "待收货") return false;
    return isPendingShipmentVerifyEnabled() && isOrderCutoff(order);
  }

  global.LFMockData = mockData;
  global.LFSaveStoreOrders = function () {
    try {
      sessionStorage.setItem("lfStoreAppOrdersState", JSON.stringify(mockData.orders || []));
    } catch (err) {
      /* ignore */
    }
  };
  global.LFStoreVerifyPolicy = {
    storeId: mockData.store.storeId,
    isEnabled: isPendingShipmentVerifyEnabled,
    isCutoff: isOrderCutoff,
    isExpress: isExpressOrder,
    isVerifiable: isFulfillmentVerifiable,
    getSwitches: function () {
      var platform = readJsonSetting(PLATFORM_ORDER_KEY, { pendingShipmentVerify: "on" });
      var store = readJsonSetting(STORE_ORDER_KEY, { pendingShipmentVerify: "on" });
      return {
        platform: platform.pendingShipmentVerify !== "off",
        store: store.pendingShipmentVerify !== "off",
      };
    },
  };
  global.LFStoreVerifyDemo = {
    key: VERIFY_DEMO_KEY,
    scenes: VERIFY_DEMO_SCENES,
    getScene: getVerifyDemoScene,
    applyAndReload: function (scene, switches) {
      try {
        localStorage.setItem(VERIFY_DEMO_KEY, scene);
      } catch (e) {
        /* ignore */
      }
      if (switches) {
        writePendingShipmentSwitch(PLATFORM_ORDER_KEY, !!switches.platform);
        writePendingShipmentSwitch(STORE_ORDER_KEY, !!switches.store);
      }
      try {
        sessionStorage.removeItem("lfStoreAppOrdersState");
      } catch (e2) {
        /* ignore */
      }
      location.reload();
    },
  };

  function escapeAftersaleHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeAftersaleType(raw) {
    var t = String(raw || "").trim();
    if (t === "restock" || t === "补货") return "补货";
    if (t === "return" || t === "退货退款" || t === "退货") return "退货退款";
    if (t === "refund_only" || t === "pre_ship" || t === "仅退款" || t === "退款") return "仅退款";
    return "";
  }

  function aftersaleLineKey(line) {
    return [line.type, line.qty, line.amount].join("|");
  }

  function pushAftersaleLine(lines, line) {
    if (!line || !line.type) return;
    var key = aftersaleLineKey(line);
    if (lines.some(function (it) { return aftersaleLineKey(it) === key; })) return;
    lines.push(line);
  }

  function collectAftersaleLines(item, order, idx) {
    var lines = [];
    if (!item) return lines;
    (item.aftersales || []).forEach(function (as) {
      var type = normalizeAftersaleType(as.type || as.aftersaleType);
      if (!type) return;
      pushAftersaleLine(lines, {
        type: type,
        status: as.status || as.aftersaleStatus || "",
        qty: Number(as.qty != null ? as.qty : as.returnQty != null ? as.returnQty : as.restockQty) || 0,
        amount: as.amount != null ? Number(as.amount) : as.refundAmount != null ? Number(as.refundAmount) : null
      });
    });
    var type = normalizeAftersaleType(
      item.aftersaleType || item.refundType || (item.refund && item.refund.type)
    );
    var qty = 0;
    var amount = null;
    if (item.refund && item.refund.returnQty != null) qty = Number(item.refund.returnQty) || 0;
    else if (item.refundQty != null) qty = Number(item.refundQty) || 0;
    if (item.refund && item.refund.refundAmount != null) amount = Number(item.refund.refundAmount);
    else if (item.refundAmount != null) amount = Number(item.refundAmount);
    if (type === "补货") {
      qty = Number(item.restockQty != null ? item.restockQty : qty || item.qty) || 0;
      amount = null;
    }
    if (!type && (qty > 0 || amount != null || item.refunding || item.refundStatus)) {
      type = item.refundStatus === "待退货" ? "退货退款" : "仅退款";
    }
    if (type) {
      pushAftersaleLine(lines, {
        type: type,
        status: item.aftersaleStatus || item.refundStatus || "",
        qty: qty,
        amount: amount
      });
    }
    if (!lines.length && order && order.refund) {
      var items = order.items || [];
      var matchIdx = -1;
      items.forEach(function (it, i) {
        if (it.refund || it.aftersaleType || it.restockQty != null) return;
        if (it.price === order.refund.refundAmount || it.price * it.qty === order.refund.refundAmount) {
          if (matchIdx < 0) matchIdx = i;
        }
      });
      if (matchIdx < 0 && items.length) matchIdx = items.length - 1;
      if (matchIdx === idx) {
        pushAftersaleLine(lines, {
          type: normalizeAftersaleType(order.refund.type) || "退货退款",
          status: "",
          qty: Number(order.refund.returnQty) || 0,
          amount: order.refund.refundAmount != null ? Number(order.refund.refundAmount) : null
        });
      }
    }
    return lines;
  }

  function aftersaleBarHtml(item, order, idx) {
    var lines = collectAftersaleLines(item, order, idx);
    if (!lines.length) return "";
    return lines.map(function (line) {
      var cls = "order-card__item-refund";
      if (line.type === "补货") cls += " order-card__item-refund--restock";
      else if (line.type === "退货退款") cls += " order-card__item-refund--return";
      var title = line.status && line.status !== line.type ? line.type : line.type;
      if (line.status === "待审批") title = line.type;
      var desc = "";
      if (line.type === "补货") {
        desc = "补货数量 " + (line.qty || 0);
        if (line.status) desc += "　" + line.status;
      } else if (line.type === "退货退款") {
        desc = "退货数量 " + (line.qty || 0);
        if (line.amount != null) {
          desc += "　退款金额 <em>¥" + Number(line.amount || 0).toFixed(2) + "</em>";
        }
      } else {
        desc = "退款数量 " + (line.qty || 0);
        if (line.amount != null) {
          desc += "　退款金额 <em>¥" + Number(line.amount || 0).toFixed(2) + "</em>";
        }
      }
      return (
        '<div class="' + cls + '">' +
        '<span class="order-card__item-refund-title">' + escapeAftersaleHtml(title) + "</span>" +
        '<span class="order-card__item-refund-split" aria-hidden="true"></span>' +
        '<span class="order-card__item-refund-desc">' + desc + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function loadUaAftersaleRecords() {
    try {
      var raw = sessionStorage.getItem("ua_aftersale_records_v4");
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function isUaAftersaleVisible(rec) {
    if (!rec) return false;
    var stage = rec.stage || "";
    return stage !== "closed" && stage !== "failed";
  }

  function applyUaAftersalesToOrders(orders) {
    var recs = loadUaAftersaleRecords().filter(isUaAftersaleVisible);
    if (!recs.length) return orders;
    (orders || []).forEach(function (order) {
      if (!order) return;
      recs.forEach(function (rec) {
        if (String(rec.orderNo || "") !== String(order.orderNo || "")) return;
        var type = normalizeAftersaleType(rec.type);
        if (!type) return;
        var items = order.items || [];
        var target = items[rec.itemIndex];
        if (!target || (rec.productName && target.name && rec.productName !== target.name)) {
          target = items.filter(function (it) { return it.name === rec.productName; })[0];
        }
        if (!target && items.length === 1) target = items[0];
        if (!target) return;
        if (!target.aftersales) target.aftersales = [];
        var qty = Number(rec.qty) || 0;
        var amount = rec.amount != null ? Number(rec.amount) : null;
        var exists = target.aftersales.some(function (as) {
          return normalizeAftersaleType(as.type) === type && Number(as.qty || 0) === qty;
        });
        if (!exists) {
          target.aftersales.push({
            type: type,
            qty: qty,
            amount: amount,
            status: rec.stage === "success" ? (type === "补货" ? "补货完成" : "已完成") : (type === "补货" ? "补货中" : rec.stage || "")
          });
        }
        if (!target.aftersaleType) target.aftersaleType = type;
        if (type === "补货" && target.restockQty == null) target.restockQty = qty || 1;
        if (type !== "补货" && !target.refund && (qty > 0 || amount != null)) {
          target.refund = { returnQty: qty || 1, refundAmount: amount, type: type };
        }
      });
    });
    return orders;
  }

  applyUaAftersalesToOrders(mockData.orders);
  if (mockData.pendingVerifyOrder) applyUaAftersalesToOrders(mockData.pendingVerifyOrder.orders);
  if (mockData.verifyOrdersByPhone) {
    Object.keys(mockData.verifyOrdersByPhone).forEach(function (phone) {
      applyUaAftersalesToOrders(mockData.verifyOrdersByPhone[phone].orders);
    });
  }

  var AFTERSALE_DEMO_KEY = "lf_store_aftersale_demo_v1";
  var AFTERSALE_DEMO_SCENES = [
    { id: "all", label: "全部订单" },
    { id: "aftersale", label: "三类售后" },
    { id: "return", label: "退货退款" },
    { id: "restock", label: "补货" },
    { id: "refund", label: "仅退款" }
  ];

  function getAftersaleDemoScene() {
    try {
      var saved = localStorage.getItem(AFTERSALE_DEMO_KEY);
      if (AFTERSALE_DEMO_SCENES.some(function (s) { return s.id === saved; })) return saved;
    } catch (e) {
      /* ignore */
    }
    return "all";
  }

  function orderMatchesAftersaleScene(order, scene) {
    if (!order || !scene || scene === "all") return true;
    var types = [];
    (order.items || []).forEach(function (item, idx) {
      collectAftersaleLines(item, order, idx).forEach(function (line) {
        if (line && line.type && types.indexOf(line.type) < 0) types.push(line.type);
      });
    });
    if (scene === "aftersale") return types.length > 0;
    if (scene === "return") return types.indexOf("退货退款") >= 0;
    if (scene === "restock") return types.indexOf("补货") >= 0;
    if (scene === "refund") return types.indexOf("仅退款") >= 0;
    return true;
  }

  function applyAftersaleDemoScene(scene) {
    scene = scene || getAftersaleDemoScene();
    if (scene === "all") return;
    var source = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
    applyUaAftersalesToOrders(source);
    enrichOrderList(source);
    mockData.orders = source.filter(function (order) {
      return orderMatchesAftersaleScene(order, scene);
    });
  }

  applyAftersaleDemoScene(getAftersaleDemoScene());

  global.LFStoreAftersale = {
    normalizeType: normalizeAftersaleType,
    collectLines: collectAftersaleLines,
    barHtml: aftersaleBarHtml,
    applyToOrders: applyUaAftersalesToOrders
  };
  global.LFStoreAftersaleDemo = {
    key: AFTERSALE_DEMO_KEY,
    scenes: AFTERSALE_DEMO_SCENES,
    getScene: getAftersaleDemoScene,
    applyAndReload: function (scene) {
      try {
        localStorage.setItem(AFTERSALE_DEMO_KEY, scene || "all");
      } catch (e) {
        /* ignore */
      }
      try {
        sessionStorage.removeItem("lfStoreAppOrdersState");
      } catch (e2) {
        /* ignore */
      }
      location.reload();
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
