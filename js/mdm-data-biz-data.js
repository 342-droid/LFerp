/**
 * 平台数据中心 · 经营数据 · 演示数据
 * 固定 asOf，保证周期对比可复现；页面须标明「演示数据」。
 */
(function (global) {
  'use strict';

  /** 演示「当前时刻」：北京时间 2026-11-19 17:00 */
  var AS_OF = '2026-11-19T17:00:00+08:00';

  var stores = [
    {
      id: 'ST-BJ-01',
      name: '冷丰锅贴·望京店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '加盟店',
      openDate: '2026-08-01'
    },
    {
      id: 'ST-BJ-02',
      name: '冷丰锅贴·中关村店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '联营店',
      openDate: '2026-09-15'
    },
    {
      id: 'ST-HZ-01',
      name: '汉言·西溪店',
      line: '康美',
      brand: '汉言',
      coopType: '加盟店',
      openDate: '2026-07-01'
    },
    {
      id: 'ST-SH-01',
      name: '冷丰特选·徐汇店',
      line: '纯私域',
      brand: '冷丰特选',
      coopType: '加盟店',
      openDate: '2026-10-20'
    },
    {
      id: 'ST-TEST-01',
      name: '测试门店·勿下单',
      line: '集团内部',
      brand: '集团内部',
      coopType: '直营店',
      openDate: '2026-01-01'
    },
    {
      id: 'ST-NEW-01',
      name: '冷丰食堂大钵刘·新店',
      line: '餐饮',
      brand: '冷丰食堂大钵刘',
      coopType: '加盟店',
      openDate: '2026-11-12'
    },
    {
      id: 'ST-BJ-03',
      name: '冷丰锅贴·朝阳大悦城店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '加盟店',
      openDate: '2026-06-01'
    },
    {
      id: 'ST-BJ-04',
      name: '冷丰锅贴·通州万达店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '加盟店',
      openDate: '2026-05-12'
    },
    {
      id: 'ST-BJ-05',
      name: '冷丰锅贴·亦庄店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '联营店',
      openDate: '2026-04-08'
    },
    {
      id: 'ST-BJ-06',
      name: '冷丰锅贴·上地店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '直营店',
      openDate: '2026-03-20'
    },
    {
      id: 'ST-HZ-02',
      name: '汉言·湖滨银泰店',
      line: '康美',
      brand: '汉言',
      coopType: '加盟店',
      openDate: '2026-08-18'
    },
    {
      id: 'ST-HZ-03',
      name: '汉言·城西银泰店',
      line: '康美',
      brand: '汉言',
      coopType: '联营店',
      openDate: '2026-09-01'
    },
    {
      id: 'ST-HZ-04',
      name: '汉言·下沙宝龙店',
      line: '康美',
      brand: '汉言',
      coopType: '加盟店',
      openDate: '2026-05-30'
    },
    {
      id: 'ST-SH-02',
      name: '冷丰特选·静安店',
      line: '纯私域',
      brand: '冷丰特选',
      coopType: '加盟店',
      openDate: '2026-07-22'
    },
    {
      id: 'ST-SH-03',
      name: '冷丰特选·浦东店',
      line: '纯私域',
      brand: '冷丰特选',
      coopType: '联营店',
      openDate: '2026-08-05'
    },
    {
      id: 'ST-SH-04',
      name: '冷丰特选·闵行店',
      line: '纯私域',
      brand: '冷丰特选',
      coopType: '加盟店',
      openDate: '2026-09-28'
    },
    {
      id: 'ST-CD-01',
      name: '冷丰食堂大钵刘·春熙路店',
      line: '餐饮',
      brand: '冷丰食堂大钵刘',
      coopType: '加盟店',
      openDate: '2026-06-15'
    },
    {
      id: 'ST-CD-02',
      name: '冷丰食堂大钵刘·高新店',
      line: '餐饮',
      brand: '冷丰食堂大钵刘',
      coopType: '加盟店',
      openDate: '2026-07-09'
    },
    {
      id: 'ST-CD-03',
      name: '冷丰食堂大钵刘·双流店',
      line: '餐饮',
      brand: '冷丰食堂大钵刘',
      coopType: '联营店',
      openDate: '2026-10-02'
    },
    {
      id: 'ST-SZ-01',
      name: '冷丰锅贴·南山店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '加盟店',
      openDate: '2026-04-16'
    },
    {
      id: 'ST-SZ-02',
      name: '冷丰锅贴·福田店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '直营店',
      openDate: '2026-05-21'
    },
    {
      id: 'ST-GZ-01',
      name: '汉言·天河店',
      line: '康美',
      brand: '汉言',
      coopType: '加盟店',
      openDate: '2026-06-28'
    },
    {
      id: 'ST-GZ-02',
      name: '汉言·珠江新城店',
      line: '康美',
      brand: '汉言',
      coopType: '联营店',
      openDate: '2026-08-11'
    },
    {
      id: 'ST-NJ-01',
      name: '冷丰特选·新街口店',
      line: '纯私域',
      brand: '冷丰特选',
      coopType: '加盟店',
      openDate: '2026-09-03'
    },
    {
      id: 'ST-WH-01',
      name: '冷丰食堂大钵刘·光谷店',
      line: '餐饮',
      brand: '冷丰食堂大钵刘',
      coopType: '加盟店',
      openDate: '2026-10-15'
    },
    {
      id: 'ST-XM-01',
      name: '冷丰锅贴·思明店',
      line: '餐饮',
      brand: '冷丰锅贴',
      coopType: '加盟店',
      openDate: '2026-11-01'
    }
  ];

  /**
   * 主订单演示集
   * saleKind: normal | gift_only | points_pure | points_cashmix
   * lines.cashShare: 该行实际货币商品实付（不含运费）
   * lines.cost: 行采购成本（下单快照）
   * lines.qty / purchaseQty: 销售数量 / 采购数量（可换算）
   */
  var orders = [
    /* —— 零售商城：望京 —— */
    {
      id: 'RO-1001',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-BJ-01',
      storeName: '冷丰锅贴·望京店',
      consumerId: 'C-001',
      payTime: '2026-11-19T10:20:00+08:00',
      saleKind: 'normal',
      cashGoods: 128.0,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [
        { id: 'L1', name: '手工锅贴 20 只', cashShare: 68, cost: 32, qty: 2, purchaseQty: 2 },
        { id: 'L2', name: '黑胡椒牛肉丸', cashShare: 60, cost: 28, qty: 1, purchaseQty: 1 }
      ]
    },
    {
      id: 'RO-1002',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-BJ-01',
      storeName: '冷丰锅贴·望京店',
      consumerId: 'C-002',
      payTime: '2026-11-18T15:10:00+08:00',
      saleKind: 'normal',
      cashGoods: 100.0,
      cashFreight: 0,
      pointsDeduct: 20,
      lines: [{ id: 'L1', name: '酸菜馅锅贴', cashShare: 100, cost: 70, qty: 1, purchaseQty: 1 }]
    },
    /* 跨门店同一消费者 C-001 */
    {
      id: 'RO-1003',
      biz: 'retail',
      channel: 'live',
      storeId: 'ST-BJ-02',
      storeName: '冷丰锅贴·中关村店',
      consumerId: 'C-001',
      payTime: '2026-11-19T12:05:00+08:00',
      saleKind: 'normal',
      cashGoods: 89.0,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [{ id: 'L1', name: '直播专供虾仁饺', cashShare: 89, cost: 40, qty: 1, purchaseQty: 1 }]
    },
    /* 负毛利：低售价（保留未退） */
    {
      id: 'RO-1004',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-HZ-01',
      storeName: '汉言·西溪店',
      consumerId: 'C-003',
      payTime: '2026-11-17T09:40:00+08:00',
      saleKind: 'normal',
      cashGoods: 39.0,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [{ id: 'L1', name: '汉言体验护理体验', cashShare: 39, cost: 55, qty: 1, purchaseQty: 1 }]
    },
    /* 全部退货退款 */
    {
      id: 'RO-1010',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-HZ-01',
      storeName: '汉言·西溪店',
      consumerId: 'C-010',
      payTime: '2026-11-16T09:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 56.0,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [{ id: 'L1', name: '汉言旅行装', cashShare: 56, cost: 30, qty: 1, purchaseQty: 1 }]
    },
    /* 正常购买 + 赠品：主单计 1，赠品不增订单数 */
    {
      id: 'RO-1005',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-BJ-02',
      storeName: '冷丰锅贴·中关村店',
      consumerId: 'C-004',
      payTime: '2026-11-16T20:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 158.0,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [
        { id: 'L1', name: '家庭装锅贴组合', cashShare: 158, cost: 90, qty: 1, purchaseQty: 1 },
        { id: 'L2', name: '试吃醋包', cashShare: 0, cost: 0, qty: 1, purchaseQty: 1, gift: true }
      ]
    },
    /* 纯积分兑换：不进正常销售 */
    {
      id: 'RO-1006',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-SH-01',
      storeName: '冷丰特选·徐汇店',
      consumerId: 'C-005',
      payTime: '2026-11-15T11:00:00+08:00',
      saleKind: 'points_pure',
      cashGoods: 0,
      cashFreight: 0,
      pointsDeduct: 500,
      lines: [{ id: 'L1', name: '积分兑换帆布袋', cashShare: 0, cost: 8, qty: 1, purchaseQty: 1 }]
    },
    /* 积分+现金补差：营销单独，不进正常客单价 */
    {
      id: 'RO-1007',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-SH-01',
      storeName: '冷丰特选·徐汇店',
      consumerId: 'C-006',
      payTime: '2026-11-14T16:30:00+08:00',
      saleKind: 'points_cashmix',
      cashGoods: 19.9,
      cashFreight: 0,
      pointsDeduct: 200,
      lines: [{ id: 'L1', name: '积分换购牛奶', cashShare: 19.9, cost: 12, qty: 1, purchaseQty: 1 }]
    },
    /* 混合：正常商品 + 测试商品行 */
    {
      id: 'RO-1008',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-BJ-01',
      storeName: '冷丰锅贴·望京店',
      consumerId: 'C-007',
      payTime: '2026-11-13T13:20:00+08:00',
      saleKind: 'normal',
      cashGoods: 120.0,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [
        { id: 'L1', name: '菌菇三鲜饺', cashShare: 100, cost: 48, qty: 1, purchaseQty: 1 },
        { id: 'L2', name: '测试商品勿拍', cashShare: 20, cost: 5, qty: 1, purchaseQty: 1 }
      ]
    },
    /* 测试门店整单 */
    {
      id: 'RO-1099',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-TEST-01',
      storeName: '测试门店·勿下单',
      consumerId: 'C-999',
      payTime: '2026-11-19T09:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 200,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [{ id: 'L1', name: '任意商品', cashShare: 200, cost: 80, qty: 1, purchaseQty: 1 }]
    },
    /* 历史支付：供跨期退款／延后结算 */
    {
      id: 'RO-0901',
      biz: 'retail',
      channel: 'live',
      storeId: 'ST-BJ-01',
      storeName: '冷丰锅贴·望京店',
      consumerId: 'C-008',
      payTime: '2026-11-05T19:30:00+08:00',
      saleKind: 'normal',
      cashGoods: 210,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [
        { id: 'L1', name: '直播组合 A', cashShare: 120, cost: 60, qty: 2, purchaseQty: 2 },
        { id: 'L2', name: '直播组合 B', cashShare: 90, cost: 45, qty: 1, purchaseQty: 1 }
      ]
    },
    {
      id: 'RO-0801',
      biz: 'retail',
      channel: 'mall',
      storeId: 'ST-HZ-01',
      storeName: '汉言·西溪店',
      consumerId: 'C-009',
      payTime: '2026-10-28T10:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 88,
      cashFreight: 0,
      pointsDeduct: 0,
      lines: [{ id: 'L1', name: '汉言护手霜', cashShare: 88, cost: null, qty: 1, purchaseQty: 1 }]
    },

    /* —— 代采 —— */
    {
      id: 'PO-2001',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-BJ-01',
      storeName: '冷丰锅贴·望京店',
      consumerId: null,
      payTime: '2026-11-19T08:30:00+08:00',
      saleKind: 'normal',
      cashGoods: 860,
      cashFreight: 36,
      pointsDeduct: 0,
      freightAlloc: [
        { lineId: 'L1', freightShare: 24 },
        { lineId: 'L2', freightShare: 12 }
      ],
      lines: [
        { id: 'L1', name: '冷冻猪肉馅 10kg', cashShare: 560, cost: 420, qty: 2, purchaseQty: 20 },
        { id: 'L2', name: '饺子皮 5kg', cashShare: 300, cost: 180, qty: 3, purchaseQty: 15 }
      ]
    },
    {
      id: 'PO-2002',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-BJ-02',
      storeName: '冷丰锅贴·中关村店',
      consumerId: null,
      payTime: '2026-11-18T09:10:00+08:00',
      saleKind: 'normal',
      cashGoods: 420,
      cashFreight: 18,
      pointsDeduct: 0,
      freightAlloc: null,
      lines: [{ id: 'L1', name: '速冻菠菜', cashShare: 420, cost: 300, qty: 10, purchaseQty: 50 }]
    },
    {
      id: 'PO-2003',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-HZ-01',
      storeName: '汉言·西溪店',
      consumerId: null,
      payTime: '2026-11-12T14:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 600,
      cashFreight: 24,
      pointsDeduct: 0,
      freightAlloc: null,
      lines: [{ id: 'L1', name: '汉言原料箱', cashShare: 600, cost: 410, qty: 5, purchaseQty: 5 }]
    },
    /* 混合运费分摊：正常 100 + 测试 20 + 运费 12 → 保留运费 10 */
    {
      id: 'PO-2004',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-BJ-01',
      storeName: '冷丰锅贴·望京店',
      consumerId: null,
      payTime: '2026-11-10T11:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 120,
      cashFreight: 12,
      pointsDeduct: 0,
      freightAlloc: null,
      lines: [
        { id: 'L1', name: '面粉 25kg', cashShare: 100, cost: 70, qty: 1, purchaseQty: 1 },
        { id: 'L2', name: 'test 调料样品', cashShare: 20, cost: 8, qty: 1, purchaseQty: 1 }
      ]
    },
    {
      id: 'PO-2099',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-TEST-01',
      storeName: '测试门店·勿下单',
      consumerId: null,
      payTime: '2026-11-18T08:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 500,
      cashFreight: 20,
      pointsDeduct: 0,
      freightAlloc: null,
      lines: [{ id: 'L1', name: '测试进货', cashShare: 500, cost: 300, qty: 1, purchaseQty: 1 }]
    },
    {
      id: 'PO-2010',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-NEW-01',
      storeName: '冷丰食堂大钵刘·新店',
      consumerId: null,
      payTime: '2026-11-18T16:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 260,
      cashFreight: 15,
      pointsDeduct: 0,
      freightAlloc: null,
      lines: [{ id: 'L1', name: '食堂米面油套装', cashShare: 260, cost: 190, qty: 1, purchaseQty: 1 }]
    },
    {
      id: 'PO-0901',
      biz: 'proxy',
      channel: null,
      storeId: 'ST-BJ-02',
      storeName: '冷丰锅贴·中关村店',
      consumerId: null,
      payTime: '2026-11-02T10:00:00+08:00',
      saleKind: 'normal',
      cashGoods: 980,
      cashFreight: 40,
      pointsDeduct: 0,
      freightAlloc: null,
      lines: [{ id: 'L1', name: '大宗冻品', cashShare: 980, cost: 720, qty: 4, purchaseQty: 40 }]
    }
  ];

  /**
   * 退款完成记录
   * mode: qty_partial | amount_only | full
   */
  var refunds = [
    /* 仅金额退：RO-1002 实付100 成本70 退30 → 成本不变，毛利0 */
    {
      id: 'RF-01',
      orderId: 'RO-1002',
      completeTime: '2026-11-19T11:00:00+08:00',
      mode: 'amount_only',
      goodsAmount: 30,
      freightAmount: 0,
      lineId: 'L1',
      qtyRefund: 0
    },
    /* 退部分数量：RO-0901 L1 退 1 件（原 qty2） */
    {
      id: 'RF-02',
      orderId: 'RO-0901',
      completeTime: '2026-11-18T18:00:00+08:00',
      mode: 'qty_partial',
      goodsAmount: 60,
      freightAmount: 0,
      lineId: 'L1',
      qtyRefund: 1,
      purchaseQtyRefund: 1
    },
    /* 全退 */
    {
      id: 'RF-03',
      orderId: 'RO-1010',
      completeTime: '2026-11-18T10:00:00+08:00',
      mode: 'full',
      goodsAmount: 56,
      freightAmount: 0,
      lineId: 'L1',
      qtyRefund: 1,
      purchaseQtyRefund: 1
    },
    /* 代采运费退款：不冲商品成本 */
    {
      id: 'RF-04',
      orderId: 'PO-2001',
      completeTime: '2026-11-19T14:00:00+08:00',
      mode: 'freight_only',
      goodsAmount: 0,
      freightAmount: 12,
      lineId: null,
      qtyRefund: 0
    },
    /* 跨期：历史支付、本期退 */
    {
      id: 'RF-05',
      orderId: 'PO-0901',
      completeTime: '2026-11-19T09:30:00+08:00',
      mode: 'amount_only',
      goodsAmount: 80,
      freightAmount: 0,
      lineId: 'L1',
      qtyRefund: 0
    }
  ];

  /**
   * 结算单：佣金清算（平台商品份额）／承运商结算（平台运费份额）
   * 创建即计入；演示中部分订单延后结算、部分未形成
   */
  var settlements = [
    {
      id: 'CM-7001',
      type: 'commission',
      kind: 'goods',
      biz: 'retail',
      orderId: 'RO-1001',
      createdAt: '2026-11-19T12:00:00+08:00',
      platformShare: 18.5
    },
    {
      id: 'CM-7002',
      type: 'commission',
      kind: 'goods',
      biz: 'retail',
      orderId: 'RO-1003',
      createdAt: '2026-11-19T15:00:00+08:00',
      /* 中关村零售所得高于望京，便于验证「零售／代采」业务范围切换后排名变化 */
      platformShare: 25.0
    },
    {
      id: 'CM-7003',
      type: 'commission',
      kind: 'goods',
      biz: 'retail',
      orderId: 'RO-1002',
      createdAt: '2026-11-19T16:00:00+08:00',
      platformShare: 8.0
    },
    {
      id: 'CM-7010',
      type: 'commission',
      kind: 'goods',
      biz: 'proxy',
      orderId: 'PO-2001',
      createdAt: '2026-11-19T13:00:00+08:00',
      platformShare: 45.0
    },
    {
      id: 'CM-7011',
      type: 'commission',
      kind: 'goods',
      biz: 'proxy',
      orderId: 'PO-2002',
      createdAt: '2026-11-19T13:30:00+08:00',
      platformShare: 22.0
    },
    /* 延后结算：历史支付订单本周才出结算 */
    {
      id: 'CM-7020',
      type: 'commission',
      kind: 'goods',
      biz: 'retail',
      orderId: 'RO-0901',
      createdAt: '2026-11-17T10:00:00+08:00',
      platformShare: 28.0
    },
    {
      id: 'CR-8001',
      type: 'carrier',
      kind: 'freight',
      biz: 'proxy',
      orderId: 'PO-2001',
      createdAt: '2026-11-19T14:20:00+08:00',
      platformShare: 6.0,
      carrierShare: 18.0
    },
    {
      id: 'CR-8002',
      type: 'carrier',
      kind: 'freight',
      biz: 'proxy',
      orderId: 'PO-2002',
      createdAt: '2026-11-19T14:25:00+08:00',
      platformShare: 3.0,
      carrierShare: 15.0
    },
    {
      id: 'CR-8003',
      type: 'carrier',
      kind: 'freight',
      biz: 'proxy',
      orderId: 'PO-2004',
      createdAt: '2026-11-11T09:00:00+08:00',
      platformShare: 2.0,
      carrierShare: 8.0
    },
    /* 测试门店结算：应被排除 */
    {
      id: 'CM-7999',
      type: 'commission',
      kind: 'goods',
      biz: 'retail',
      orderId: 'RO-1099',
      createdAt: '2026-11-19T10:00:00+08:00',
      platformShare: 30.0
    }
  ];

  if(global.BusinessReportFixtures){
    AS_OF=global.BusinessReportFixtures.asOf.replace(' ','T')+'+08:00';
    stores.push({id:'S-CN',name:'城南生鲜店',line:'餐饮',brand:'冷丰锅贴',coopType:'加盟店',openDate:'2026-01-01'});
    global.BusinessReportFixtures.rows.forEach(function(r){
      orders.push({id:r.id,biz:r.biz,channel:r.channel,storeId:r.storeId,storeName:r.storeName,consumerId:'LINK-C',payTime:r.pay.replace(' ','T')+'+08:00',saleKind:'normal',cashGoods:r.paid,cashFreight:r.freight||0,pointsDeduct:0,lines:[{id:r.sku,name:r.name,cashShare:r.paid,cost:r.cost,qty:r.qty,purchaseQty:r.qty}]});
      if(r.refund) refunds.push({id:'RF-'+r.id,orderId:r.id,lineId:r.sku,completeTime:r.refundAt.replace(' ','T')+'+08:00',mode:r.refundQty?'qty_partial':'amount_only',goodsAmount:r.refund,freightAmount:0,qtyRefund:r.refundQty||0,purchaseQtyRefund:r.refundQty||0});
      settlements.push({id:'PL-'+r.id,type:'commission',kind:'goods',biz:r.biz,orderId:r.id,createdAt:r.settleAt.replace(' ','T')+'+08:00',platformShare:r.platform});
    });
  }
  global.MdmDataBizData = {
    AS_OF: AS_OF,
    DEMO_LABEL: '演示数据',
    stores: stores,
    orders: orders,
    refunds: refunds,
    settlements: settlements
  };
})(typeof window !== 'undefined' ? window : this);
