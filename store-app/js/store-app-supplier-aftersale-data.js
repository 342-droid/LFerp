/**
 * 丰银宝 · 供应商售后管理演示数据
 * 与 PC 售后单/退款单同源语义：仅本商家；快递退货收货 / 快递补货发货可操作；配送/自提只读。
 */
(function (global) {
  var IMG = {
    durian: '../../user-app/assets/order-detail-orange.svg',
    fruit1: '../../user-app/assets/order-product-1.svg',
    fruit2: '../../user-app/assets/order-product-2.svg',
    fruit3: '../../user-app/assets/order-product-3.svg',
    fruit4: '../../user-app/assets/order-product-4.svg',
    cherry: '../../user-app/assets/order-detail-cherry.svg',
    egg: '../../user-app/assets/restock/product-egg.svg',
    leaf: '../../user-app/assets/restock/product-leaf.svg',
    tomato: '../../user-app/assets/restock/product-tomato.svg',
    tea: '../../user-app/assets/restock/product-tea.svg'
  };

  function demoTimeline(trackingNo, status) {
    var no = trackingNo || 'SF0000000000';
    if (status === '已签收') {
      return [
        { time: '10-17\n11:20', title: '已签收', desc: '快件已签收，签收人：前台', active: true },
        { time: '10-17\n08:12', title: '派送中', desc: '【杭州市】快递员正在派送' },
        { time: '10-16\n21:05', title: '运输中', desc: '【杭州市】快件已到达杭州转运中心' },
        { time: '10-16\n15:40', title: '已揽收', desc: '【深圳市】商家已交件，运单 ' + no }
      ];
    }
    return [
      { time: '10-16\n21:05', title: '运输中', desc: '【杭州市】快件已到达杭州转运中心', active: true },
      { time: '10-16\n18:22', title: '运输中', desc: '【南昌市】快件已发往杭州转运中心' },
      { time: '10-16\n15:40', title: '已揽收', desc: '【深圳市】商家已交件，运单 ' + no }
    ];
  }

  var TICKETS = [
    {
      id: 'AS-26101601',
      orderNo: 'ORD-261016880011',
      type: '退货退款',
      status: '待收货',
      orderSource: '零售',
      fulfill: '快递',
      product: '猫山王榴莲',
      spec: '液氮冷冻 / 盒',
      productImg: IMG.durian,
      qty: 1,
      amount: '0.80',
      reason: '商品破损',
      applyTime: '2026-10-16 14:20',
      supplier: '斯斯供应商商家',
      tip: '用户已寄回，待确认收货',
      courier: '顺丰速运',
      trackingNo: 'SF2610168800',
      logisticsStatus: '运输中',
      logisticsText: '【杭州市】快件已到达杭州转运中心',
      refundId: ''
    },
    {
      id: 'AS-26090301',
      orderNo: 'ORD-2609033597216',
      type: '补货',
      status: '待寄出',
      orderSource: '零售',
      fulfill: '快递',
      product: '火龙果',
      spec: '白心 / 袋',
      productImg: IMG.fruit1,
      qty: 1,
      amount: '0.03',
      reason: '少件/漏发',
      applyTime: '2026-09-04 09:10',
      supplier: '斯斯供应商商家',
      tip: '请上传补货快递单并发货',
      courier: '',
      trackingNo: '',
      logisticsStatus: '',
      logisticsText: '',
      refundId: ''
    },
    {
      id: 'AS-26102811',
      orderNo: 'ORD-261028110022',
      type: '补货',
      status: '待收货',
      orderSource: '零售',
      fulfill: '快递',
      product: '白芭乐-快递-ss',
      spec: '100g / L',
      productImg: IMG.fruit2,
      qty: 2,
      amount: '0.60',
      reason: '收到商品破损',
      applyTime: '2026-10-28 11:05',
      supplier: '斯斯供应商商家',
      tip: '补货已寄出，待用户签收',
      courier: '圆通速递',
      trackingNo: 'YT8877665544',
      logisticsStatus: '派送中',
      logisticsText: '【杭州市】快递员正在派送',
      refundId: ''
    },
    {
      id: 'AS-26102055',
      orderNo: 'ORD-261020550033',
      type: '退货退款',
      status: '待收货',
      orderSource: '零售',
      fulfill: '自提',
      product: '葡萄柚',
      spec: '精品 / 份',
      productImg: IMG.fruit3,
      qty: 1,
      amount: '1.20',
      reason: '不想要了',
      applyTime: '2026-10-20 16:40',
      supplier: '斯斯供应商商家',
      tip: '自提单退货由门店处理',
      courier: '',
      trackingNo: '',
      logisticsStatus: '',
      logisticsText: '',
      refundId: ''
    },
    {
      id: 'AS-26101877',
      orderNo: 'ORD-261018770044',
      type: '退货退款',
      status: '待收货',
      orderSource: '代采',
      fulfill: '配送',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      productImg: IMG.tea,
      qty: 2,
      amount: '2.00',
      reason: '质量问题',
      applyTime: '2026-10-18 10:22',
      supplier: '斯斯供应商商家',
      tip: '配送单退货由门店/仓库处理',
      courier: '',
      trackingNo: '',
      logisticsStatus: '',
      logisticsText: '',
      refundId: ''
    },
    {
      id: 'AS-26101233',
      orderNo: 'ORD-261012330055',
      type: '仅退款',
      status: '退款中',
      orderSource: '零售',
      fulfill: '快递',
      product: '红心火龙果',
      spec: '盒装',
      productImg: IMG.fruit4,
      qty: 1,
      amount: '0.50',
      reason: '未按约定时间发货',
      applyTime: '2026-10-12 08:30',
      supplier: '斯斯供应商商家',
      tip: '仅退款无需收货',
      courier: '',
      trackingNo: '',
      logisticsStatus: '',
      logisticsText: '',
      refundId: 'RF-2610123301'
    },
    {
      id: 'AS-26100109',
      orderNo: 'ORD-261001090066',
      type: '退货退款',
      status: '已完成',
      orderSource: '零售',
      fulfill: '快递',
      product: '车厘子',
      spec: 'JJ / 盒',
      productImg: IMG.cherry,
      qty: 1,
      amount: '3.50',
      reason: '大小与描述不符',
      applyTime: '2026-10-01 19:00',
      supplier: '斯斯供应商商家',
      tip: '已确认收货并退款完成',
      courier: '中通快递',
      trackingNo: 'ZT9988776655',
      logisticsStatus: '已签收',
      logisticsText: '快件已签收，签收人：前台',
      refundId: 'RF-2610010901'
    },
    {
      id: 'AS-26102588',
      orderNo: 'ORD-261025880077',
      type: '退货退款',
      status: '待收货',
      orderSource: '代采',
      fulfill: '快递',
      product: '进口香蕉',
      spec: '箱',
      productImg: IMG.leaf,
      qty: 5,
      amount: '12.50',
      reason: '压伤',
      applyTime: '2026-10-25 15:18',
      supplier: '南京马群枢纽供应商',
      tip: '用户已寄回，待确认收货',
      courier: '顺丰速运',
      trackingNo: 'SF2610258800',
      logisticsStatus: '运输中',
      logisticsText: '【南京市】快件已到达南京转运中心',
      refundId: ''
    },
    {
      id: 'AS-26102266',
      orderNo: 'ORD-261022660088',
      type: '补货',
      status: '待寄出',
      orderSource: '零售',
      fulfill: '快递',
      product: '阳光玫瑰',
      spec: '精品 / 盒',
      productImg: IMG.tomato,
      qty: 1,
      amount: '4.80',
      reason: '少件/漏发',
      applyTime: '2026-10-22 13:05',
      supplier: '南京马群枢纽供应商',
      tip: '请上传补货快递单并发货',
      courier: '',
      trackingNo: '',
      logisticsStatus: '',
      logisticsText: '',
      refundId: ''
    },
    {
      id: 'AS-26101544',
      orderNo: 'ORD-261015440099',
      type: '补货',
      status: '待收货',
      orderSource: '代采',
      fulfill: '配送',
      product: '冷冻虾仁',
      spec: '500g',
      productImg: IMG.egg,
      qty: 3,
      amount: '9.90',
      reason: '收到商品破损',
      applyTime: '2026-10-15 17:40',
      supplier: '南京马群枢纽供应商',
      tip: '配送补货由仓库处理',
      courier: '',
      trackingNo: '',
      logisticsStatus: '',
      logisticsText: '',
      refundId: ''
    }
  ];

  var REFUNDS = [
    {
      id: 'RF-2610123301',
      orderNo: 'ORD-261012330055',
      aftersaleId: 'AS-26101233',
      source: '售后单',
      status: '退款执行中',
      amount: '0.50',
      method: '原路退回',
      createdAt: '2026-10-12 09:10',
      supplier: '斯斯供应商商家',
      product: '红心火龙果',
      productImg: IMG.fruit4
    },
    {
      id: 'RF-2610010901',
      orderNo: 'ORD-261001090066',
      aftersaleId: 'AS-26100109',
      source: '售后单',
      status: '退款成功',
      amount: '3.50',
      method: '原路退回',
      createdAt: '2026-10-02 11:20',
      supplier: '斯斯供应商商家',
      product: '车厘子',
      productImg: IMG.cherry
    },
    {
      id: 'RF-2610192201',
      orderNo: 'ORD-261019220101',
      aftersaleId: 'AS-26101922',
      source: '售后单',
      status: '待退款',
      amount: '1.80',
      method: '原路退回',
      createdAt: '2026-10-19 16:05',
      supplier: '斯斯供应商商家',
      product: '奇异果',
      productImg: IMG.fruit2
    },
    {
      id: 'RF-2610087701',
      orderNo: 'ORD-261008770202',
      aftersaleId: '',
      source: '仅退款',
      status: '退款成功',
      amount: '0.20',
      method: '原路退回',
      createdAt: '2026-10-08 12:00',
      supplier: '斯斯供应商商家',
      product: '白芭乐-快递-ss',
      productImg: IMG.fruit1
    },
    {
      id: 'RF-2610261101',
      orderNo: 'ORD-261026110303',
      aftersaleId: 'AS-26102611',
      source: '售后单',
      status: '退款成功',
      amount: '12.50',
      method: '原路退回',
      createdAt: '2026-10-26 10:30',
      supplier: '南京马群枢纽供应商',
      product: '进口香蕉',
      productImg: IMG.leaf
    },
    {
      id: 'RF-2610215501',
      orderNo: 'ORD-261021550404',
      aftersaleId: '',
      source: '取消订单',
      status: '退款成功',
      amount: '2.20',
      method: '原路退回',
      createdAt: '2026-10-21 09:45',
      supplier: '南京马群枢纽供应商',
      product: '阳光玫瑰',
      productImg: IMG.tomato
    }
  ];

  function listTickets(supplierName) {
    return TICKETS.filter(function (t) {
      return t.supplier === supplierName;
    });
  }

  function listRefunds(supplierName) {
    return REFUNDS.filter(function (r) {
      return r.supplier === supplierName;
    });
  }

  function findTicket(id, supplierName) {
    var key = String(id || '').trim();
    for (var i = 0; i < TICKETS.length; i++) {
      var t = TICKETS[i];
      if (t.id === key && (!supplierName || t.supplier === supplierName)) return t;
    }
    return null;
  }

  function findRefund(id, supplierName) {
    var key = String(id || '').trim();
    for (var i = 0; i < REFUNDS.length; i++) {
      var r = REFUNDS[i];
      if (r.id === key && (!supplierName || r.supplier === supplierName)) return r;
    }
    return null;
  }

  function canOperate(ticket) {
    if (!ticket || ticket.fulfill !== '快递') return false;
    if (ticket.type === '退货退款' && ticket.status === '待收货') return true;
    if (ticket.type === '补货' && (ticket.status === '待寄出' || ticket.status === '待发货')) return true;
    return false;
  }

  function isPendingBucket(ticket) {
    return canOperate(ticket);
  }

  function isDoneBucket(ticket) {
    return /已完成|已取消|已拒绝|已拒收/.test(String((ticket && ticket.status) || ''));
  }

  function hasTrackableLogistics(ticket) {
    return !!(ticket && ticket.fulfill === '快递' && ticket.trackingNo);
  }

  function buildLogisticsPayload(ticket) {
    if (!ticket || !ticket.trackingNo) return null;
    return {
      id: ticket.id,
      orderNo: ticket.orderNo,
      status: ticket.logisticsStatus || '运输中',
      express: {
        courier: ticket.courier || '快递',
        trackingNo: ticket.trackingNo,
        logisticsStatus: ticket.logisticsStatus || '运输中',
        items: [
          {
            name: ticket.product,
            image: ticket.productImg || IMG.fruit1,
            qty: ticket.qty || 1
          }
        ],
        timeline: demoTimeline(ticket.trackingNo, ticket.logisticsStatus)
      }
    };
  }

  global.FybSupplierAftersale = {
    listTickets: listTickets,
    listRefunds: listRefunds,
    findTicket: findTicket,
    findRefund: findRefund,
    canOperate: canOperate,
    isPendingBucket: isPendingBucket,
    isDoneBucket: isDoneBucket,
    hasTrackableLogistics: hasTrackableLogistics,
    buildLogisticsPayload: buildLogisticsPayload,
    defaultImg: IMG.fruit1
  };
})(typeof window !== 'undefined' ? window : this);
