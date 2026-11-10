/**
 * 丰银宝 · 供应商客户订单演示数据（列表 / 详情共用）
 * 履约：待发货可上传快递单；售后：退货待收货 / 补货待寄出由供应商处理。
 */
(function (global) {
  var ORDERS = [
    {
      orderNo: 'ORD-2610312466502',
      lineNo: 'ORD-2610312466502-1',
      product: '火龙果',
      spec: '白心 / 袋',
      code: 'SPU00196',
      barcode: '6901234567890',
      qty: 2,
      amount: '0.06',
      purchase: '0.04',
      status: '待发货',
      settleStatus: '待结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-10-31 13:58',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      aftersale: null,
      /* 演示：一单多商品，上传快递单可选关联商品（对齐 PC） */
      goods: [
        { id: 'ORD-2610312466502-1', name: '火龙果 白心 / 袋 ×2' },
        { id: 'ORD-2610312466502-2', name: '冰袋赠品 标准装 ×1' }
      ]
    },
    {
      orderNo: 'ORD-2610312477895',
      lineNo: '—',
      product: '运费验收-快递常温2.5kg',
      spec: '2.5kg',
      code: 'SKU00217',
      barcode: '6901111222233',
      qty: 1,
      amount: '1.00',
      purchase: '0.01',
      status: '待发货',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-10-31 18:17',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      aftersale: null
    },
    {
      orderNo: 'ORD-261016200015',
      lineNo: 'ORD-261016200015-2',
      product: '芒果干',
      spec: '200g',
      code: 'SPU00088',
      barcode: '6905555666688',
      qty: 2,
      amount: '0.80',
      purchase: '0.64',
      status: '交易成功',
      settleStatus: '结款中',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-10-16 09:10',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      aftersale: {
        id: 'AS-26101601',
        type: '退货退款',
        status: '待收货',
        amount: '0.80',
        tip: '用户已寄回，待供应商确认收货',
        courier: '顺丰速运',
        trackingNo: 'SF261016200015',
        logisticsStatus: '运输中',
        logisticsText: '【杭州市】快件已到达杭州转运中心'
      }
    },
    {
      orderNo: 'ORD-261013200012',
      lineNo: 'ORD-261013200012-1',
      product: '白芭乐-快递-ss',
      spec: '100g / L',
      code: 'SPU00184',
      barcode: '6901234567801',
      qty: 1,
      amount: '0.30',
      purchase: '0.24',
      status: '交易成功',
      settleStatus: '已结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-10-13 10:22',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      expressNo: 'SF1234567890',
      aftersale: null
    },
    {
      orderNo: 'ORD-2609033597216',
      lineNo: 'ORD-2609033597216-1',
      product: '火龙果',
      spec: '白心 / 袋',
      code: 'SPU00196',
      barcode: '6901234567890',
      qty: 1,
      amount: '0.03',
      purchase: '0.02',
      status: '交易成功',
      settleStatus: '部分结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-09-03 18:21',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      aftersale: {
        id: 'AS-26090301',
        type: '补货',
        status: '待寄出',
        amount: '0.03',
        tip: '补货待供应商寄出并上传快递单'
      }
    },
    {
      orderNo: 'ORD-2610307754308',
      lineNo: 'ORD-2610307754308-1',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 3,
      amount: '3.00',
      purchase: '1.50',
      status: '交易成功',
      settleStatus: '已结款',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-10-30 18:05',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      expressNo: 'YT9988776655',
      aftersale: null
    },
    {
      orderNo: 'ORD-261008200001',
      lineNo: 'ORD-261008200001-1',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 5,
      amount: '12.00',
      purchase: '11.40',
      status: '待发货',
      settleStatus: '待结算',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-10-08 14:20',
      supplier: '南京马群枢纽供应商',
      buyer: '野子文化',
      phone: '157****3322',
      address: '浙江省杭州市拱墅区',
      aftersale: null
    },
    {
      orderNo: 'ORD-2609104841852',
      lineNo: '353852301770752223',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 1,
      amount: '0.02',
      purchase: '0.01',
      status: '待收货',
      settleStatus: '待结算',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-09-10 11:05',
      supplier: '南京马群枢纽供应商',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区',
      expressNo: 'ZTO5566778899',
      aftersale: null
    },
    {
      orderNo: 'ORD-261101100001',
      lineNo: 'ORD-261101100001-1',
      product: '火龙果',
      spec: '白心 / 袋',
      code: 'SPU00196',
      barcode: '6901234567890',
      qty: 1,
      amount: '0.03',
      purchase: '0.02',
      status: '待接单',
      settleStatus: '待结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-01 09:12',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      aftersale: null
    },
    {
      orderNo: 'ORD-261101100002',
      lineNo: 'ORD-261101100002-1',
      product: '芒果干',
      spec: '200g',
      code: 'SPU00088',
      barcode: '6905555666688',
      qty: 1,
      amount: '0.40',
      purchase: '0.32',
      status: '待提货',
      settleStatus: '待结款',
      type: '零售',
      channel: '商城',
      fulfill: '自提',
      time: '2026-11-01 10:05',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区门店自提',
      aftersale: null
    },
    {
      orderNo: 'ORD-261101100003',
      lineNo: 'ORD-261101100003-1',
      product: '白芭乐-快递-ss',
      spec: '100g / L',
      code: 'SPU00184',
      barcode: '6901234567801',
      qty: 2,
      amount: '0.60',
      purchase: '0.48',
      status: '交易失败',
      settleStatus: '—',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-01 11:20',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      aftersale: null
    },
    {
      orderNo: 'ORD-261101200001',
      lineNo: '—',
      product: '运费验收-快递常温2.5kg',
      spec: '2.5kg',
      code: 'SKU00217',
      barcode: '6901111222233',
      qty: 2,
      amount: '2.00',
      purchase: '0.02',
      status: '待收货',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-01 15:40',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      expressNo: 'SF9988001122',
      aftersale: null
    },
    {
      orderNo: 'ORD-261101200002',
      lineNo: '—',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 1,
      amount: '1.00',
      purchase: '0.50',
      status: '交易失败',
      settleStatus: '—',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-01 16:08',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      aftersale: null
    },
    /* —— 零售：补齐各状态（斯斯） —— */
    {
      orderNo: 'ORD-261105R001',
      lineNo: 'ORD-261105R001-1',
      product: '海南贵妃芒礼盒',
      spec: '2.5kg / 盒',
      code: 'SPU00181',
      barcode: '6903333444455',
      qty: 1,
      amount: '68.00',
      purchase: '45.00',
      status: '待支付',
      settleStatus: '—',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-05 08:12',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105R002',
      lineNo: 'ORD-261105R002-1',
      product: '火龙果',
      spec: '红心 / 袋',
      code: 'SPU00196',
      barcode: '6901234567890',
      qty: 3,
      amount: '0.09',
      purchase: '0.06',
      status: '待收货',
      settleStatus: '待结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-04 16:40',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      expressNo: 'YT6611002299',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105R003',
      lineNo: 'ORD-261105R003-1',
      product: '芒果干',
      spec: '200g',
      code: 'SPU00088',
      barcode: '6905555666688',
      qty: 2,
      amount: '0.80',
      purchase: '0.64',
      status: '待核销',
      settleStatus: '待结款',
      type: '零售',
      channel: '商城',
      fulfill: '自提',
      time: '2026-11-04 11:28',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区门店自提',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105R004',
      lineNo: 'ORD-261105R004-1',
      product: '白芭乐-快递-ss',
      spec: '100g / L',
      code: 'SPU00184',
      barcode: '6901234567801',
      qty: 1,
      amount: '0.30',
      purchase: '0.24',
      status: '待发货',
      settleStatus: '待结款',
      type: '零售',
      channel: '直播',
      fulfill: '快递',
      time: '2026-11-05 09:55',
      supplier: '斯斯供应商商家',
      buyer: '野子文化',
      phone: '157****3322',
      address: '浙江省杭州市拱墅区',
      /* 演示：待发货但存在退货退款售后 → 不可发货 */
      aftersale: {
        id: 'AS-261105R004',
        type: '退货退款',
        status: '待审核',
        amount: '0.30',
        tip: '用户已申请退货退款，审核中不可发货'
      }
    },
    {
      orderNo: 'ORD-261105R005',
      lineNo: 'ORD-261105R005-1',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 1,
      amount: '1.00',
      purchase: '0.50',
      status: '交易成功',
      settleStatus: '已结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-02 14:18',
      supplier: '斯斯供应商商家',
      buyer: '斯斯门店商家2',
      phone: '138****2210',
      address: '浙江省杭州市西湖区文一西路 XX 号',
      expressNo: 'SF7788990011',
      aftersale: {
        id: 'AS-26110501',
        type: '仅退款',
        status: '退款中',
        amount: '1.00',
        tip: '用户发起仅退款，待平台处理'
      }
    },
    /* —— 代采：补齐各状态（斯斯） —— */
    {
      orderNo: 'ORD-261105P001',
      lineNo: '—',
      product: '运费验收-快递常温2.5kg',
      spec: '2.5kg',
      code: 'SKU00217',
      barcode: '6901111222233',
      qty: 1,
      amount: '1.00',
      purchase: '0.01',
      status: '待支付',
      settleStatus: '—',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-05 07:40',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105P002',
      lineNo: '—',
      product: '海南贵妃芒礼盒',
      spec: '2.5kg / 盒',
      code: 'SPU00181',
      barcode: '6903333444455',
      qty: 4,
      amount: '272.00',
      purchase: '180.00',
      status: '待接单',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-05 10:06',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105P003',
      lineNo: '—',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 6,
      amount: '6.00',
      purchase: '3.00',
      status: '交易成功',
      settleStatus: '已结款',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-03 12:30',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      expressNo: 'ZTO1122334455',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105P004',
      lineNo: '—',
      product: '火龙果',
      spec: '白心 / 袋',
      code: 'SPU00196',
      barcode: '6901234567890',
      qty: 10,
      amount: '0.30',
      purchase: '0.20',
      status: '交易成功',
      settleStatus: '结款中',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-02 09:18',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      expressNo: 'YT3344556677',
      aftersale: {
        id: 'AS-261105P1',
        type: '退货退款',
        status: '待收货',
        amount: '0.30',
        tip: '门店已寄回，待供应商确认收货',
        courier: '中通快递',
        trackingNo: 'ZT261105P1001',
        logisticsStatus: '派送中',
        logisticsText: '【杭州市】快递员正在派送'
      }
    },
    {
      orderNo: 'ORD-261105P005',
      lineNo: '—',
      product: '芒果干',
      spec: '200g',
      code: 'SPU00088',
      barcode: '6905555666688',
      qty: 8,
      amount: '3.20',
      purchase: '2.56',
      status: '待发货',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-05 11:22',
      supplier: '斯斯供应商商家',
      buyer: '德清乾元天恩冷鲜超市',
      phone: '157****1001',
      address: '浙江省湖州市德清县乾元镇',
      aftersale: null
    },
    /* —— 马群供应商：零售/代采各状态样例 —— */
    {
      orderNo: 'ORD-261105M001',
      lineNo: 'ORD-261105M001-1',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 2,
      amount: '4.80',
      purchase: '4.56',
      status: '待支付',
      settleStatus: '—',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-05 08:50',
      supplier: '南京马群枢纽供应商',
      buyer: '野子文化',
      phone: '157****3322',
      address: '浙江省杭州市拱墅区',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M002',
      lineNo: 'ORD-261105M002-1',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 2,
      amount: '2.00',
      purchase: '1.00',
      status: '待接单',
      settleStatus: '待结算',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-05 09:10',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M003',
      lineNo: 'ORD-261105M003-1',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 1,
      amount: '2.40',
      purchase: '2.28',
      status: '待提货',
      settleStatus: '待结算',
      type: '零售',
      channel: '商城',
      fulfill: '自提',
      time: '2026-11-04 17:05',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群门店自提',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M004',
      lineNo: 'ORD-261105M004-1',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 1,
      amount: '1.00',
      purchase: '0.50',
      status: '待核销',
      settleStatus: '待结算',
      type: '零售',
      channel: '商城',
      fulfill: '自提',
      time: '2026-11-04 18:20',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群门店自提',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M005',
      lineNo: 'ORD-261105M005-1',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 3,
      amount: '7.20',
      purchase: '6.84',
      status: '交易失败',
      settleStatus: '—',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-03 13:40',
      supplier: '南京马群枢纽供应商',
      buyer: '野子文化',
      phone: '157****3322',
      address: '浙江省杭州市拱墅区',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M006',
      lineNo: 'ORD-261105M006-1',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 2,
      amount: '2.00',
      purchase: '1.00',
      status: '交易成功',
      settleStatus: '部分结款',
      type: '零售',
      channel: '商城',
      fulfill: '快递',
      time: '2026-11-01 19:12',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      expressNo: 'SF5566778899',
      aftersale: {
        id: 'AS-261105M1',
        type: '补货',
        status: '待寄出',
        amount: '1.00',
        tip: '补货待供应商寄出并上传快递单'
      }
    },
    {
      orderNo: 'ORD-261105M101',
      lineNo: '—',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 5,
      amount: '5.00',
      purchase: '2.50',
      status: '待支付',
      settleStatus: '—',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-05 08:05',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M102',
      lineNo: '—',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 20,
      amount: '48.00',
      purchase: '45.60',
      status: '待接单',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-05 09:40',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M103',
      lineNo: '—',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 12,
      amount: '12.00',
      purchase: '6.00',
      status: '待发货',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-05 10:15',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M104',
      lineNo: '—',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 8,
      amount: '19.20',
      purchase: '18.24',
      status: '待收货',
      settleStatus: '待结算',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-04 15:33',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      expressNo: 'YT8899001122',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M105',
      lineNo: '—',
      product: '低糖养乐多',
      spec: '低糖芒果味 / 箱',
      code: 'SPU00204',
      barcode: '6909876543210',
      qty: 3,
      amount: '3.00',
      purchase: '1.50',
      status: '交易失败',
      settleStatus: '—',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-03 11:08',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      aftersale: null
    },
    {
      orderNo: 'ORD-261105M106',
      lineNo: '—',
      product: '马群-莲藕-快递配送',
      spec: '粉糯莲藕 / 包',
      code: 'SPU00142',
      barcode: '6902222333344',
      qty: 6,
      amount: '14.40',
      purchase: '13.68',
      status: '交易成功',
      settleStatus: '结款中',
      type: '代采',
      channel: '代采',
      fulfill: '快递',
      time: '2026-11-02 16:50',
      supplier: '南京马群枢纽供应商',
      buyer: '南京马群枢纽供应商店',
      phone: '159****7788',
      address: '江苏省南京市栖霞区马群街道',
      expressNo: 'SF2233445566',
      aftersale: {
        id: 'AS-261105M2',
        type: '退货退款',
        status: '待收货',
        amount: '4.80',
        tip: '部分退货已寄回，待供应商确认收货'
      }
    }
  ];

  var DEMO_IMGS = [
    '../../user-app/assets/order-product-1.svg',
    '../../user-app/assets/order-product-2.svg',
    '../../user-app/assets/order-product-3.svg',
    '../../user-app/assets/order-product-4.svg',
    '../../user-app/assets/order-detail-cherry.svg',
    '../../user-app/assets/order-detail-orange.svg',
    '../../user-app/assets/restock/product-egg.svg',
    '../../user-app/assets/restock/product-leaf.svg',
    '../../user-app/assets/restock/product-tomato.svg',
    '../../user-app/assets/restock/product-tea.svg'
  ];

  function hashStr(s) {
    var h = 0;
    var str = String(s || '');
    for (var i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  ORDERS.forEach(function (o) {
    if (!o.productImg) {
      o.productImg = DEMO_IMGS[hashStr(o.product || o.orderNo) % DEMO_IMGS.length];
    }
  });

  /** 列表发货后跨页保留（详情重新加载脚本时仍可读到待收货） */
  var SHIP_PATCH_KEY = 'fyb_supplier_order_ship_patches_v1';

  function readShipPatches() {
    try {
      var raw = sessionStorage.getItem(SHIP_PATCH_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeShipPatches(map) {
    try {
      sessionStorage.setItem(SHIP_PATCH_KEY, JSON.stringify(map || {}));
    } catch (e) {}
  }

  function applyShipPatch(order, patch) {
    if (!order || !patch) return order;
    if (patch.status) order.status = patch.status;
    if (patch.expressNo != null) order.expressNo = patch.expressNo;
    if (patch.courier != null) order.courier = patch.courier;
    if (patch.shippedGoods) order.shippedGoods = patch.shippedGoods;
    return order;
  }

  function hydrateShipPatches() {
    var map = readShipPatches();
    ORDERS.forEach(function (o) {
      if (o && o.orderNo && map[o.orderNo]) applyShipPatch(o, map[o.orderNo]);
    });
  }

  hydrateShipPatches();

  /** 发货成功：写内存 + sessionStorage，列表/详情共用 */
  function applyShip(order, payload) {
    if (!order || !order.orderNo) return null;
    var patch = {
      status: '待收货',
      expressNo: payload && payload.trackingNo != null ? payload.trackingNo : order.expressNo,
      courier: payload && payload.courier != null ? payload.courier : order.courier,
      shippedGoods: payload && payload.goods ? payload.goods : order.shippedGoods || null
    };
    applyShipPatch(order, patch);
    var map = readShipPatches();
    map[order.orderNo] = patch;
    writeShipPatches(map);
    return order;
  }

  function listBySupplier(name) {
    return ORDERS.filter(function (o) {
      return o.supplier === name;
    });
  }

  function find(orderNo, supplierName) {
    var no = String(orderNo || '').trim();
    for (var i = 0; i < ORDERS.length; i++) {
      var o = ORDERS[i];
      if (o.orderNo === no && (!supplierName || o.supplier === supplierName)) return o;
    }
    return null;
  }

  /**
   * 存在退货退款类售后则不可发货（与 PC canUploadRetailExpress 对齐）。
   * 退货退款 / 仅退款一律拦截；补货不拦订单发货。
   */
  function hasBlockingAftersale(o) {
    if (!o || !o.aftersale) return false;
    var a = o.aftersale;
    var type = String(a.type || '');
    if (type === '补货') return false;
    if (type === '退货退款' || type === '仅退款') return true;
    /* 无明确 type 时，按售后状态文案兜底（对齐 PC RETURN_REFUND 状态） */
    var s = String(a.status || a.tip || '').replace(/\s+/g, '');
    if (!s) return false;
    return [
      '待审核',
      '待审批',
      '退货中',
      '待退货',
      '退款中',
      '退款异常',
      '退货成功',
      '退款成功',
      '待收货'
    ].some(function (st) {
      return s === st || s.indexOf(st) >= 0;
    });
  }

  function canShip(o) {
    if (!o || o.fulfill !== '快递') return false;
    if (o.status !== '待发货' && o.status !== '待接单') return false;
    /* 存在退货退款类售后 → 不可发货 */
    if (hasBlockingAftersale(o)) return false;
    return true;
  }

  function canHandleAftersale(o) {
    if (!o || !o.aftersale) return false;
    var a = o.aftersale;
    if (a.type === '退货退款' && a.status === '待收货') return true;
    if (a.type === '补货' && (a.status === '待寄出' || a.status === '待发货')) return true;
    return false;
  }

  global.FybSupplierOrders = {
    all: ORDERS,
    listBySupplier: listBySupplier,
    find: find,
    canShip: canShip,
    hasBlockingAftersale: hasBlockingAftersale,
    canHandleAftersale: canHandleAftersale,
    applyShip: applyShip
  };
})(typeof window !== 'undefined' ? window : this);
