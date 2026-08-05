/**
 * 经营中心订单演示数据（列表 / 商品明细共用）
 */
(function (global) {
  var IMG = {
    p1: '../../user-app/assets/order-product-1.svg',
    p2: '../../user-app/assets/order-product-2.svg',
    p3: '../../user-app/assets/order-product-3.svg',
    p4: '../../user-app/assets/order-product-4.svg'
  };

  var ORDERS = [
    {
      id: '612965464845',
      date: '2021-12-28',
      nick: '斯斯',
      contact: '斯斯',
      phone: '15988434315',
      verifyCode: 'HX8843',
      shipMode: '快递',
      goods: '[益力多]乳酸菌乳饮品（原味）【100ml*5支*2排】 * 1 共1件商品',
      paid: 21.4,
      refund: 21.4,
      commission: 0,
      goodsCount: 1,
      payTime: '2021-12-23 15:15:19',
      deliveryTime: '2021-12-24 16:00-17:00',
      refundTime: '2021-12-25 10:22:08',
      finishTime: '-',
      remark: '',
      status: 'done',
      statusText: '交易成功',
      dayKey: '2021-12-28',
      goodsItems: [
        {
          name: '[益力多]乳酸菌乳饮品（原味）【100ml*5支*2排】 100ml*5支*2排 / 份',
          img: IMG.p1,
          qty: 1,
          paid: 21.4,
          commission: 1.07
        }
      ],
      refundItems: [
        {
          name: '[益力多]乳酸菌乳饮品（原味）【100ml*5支*2排】 / 份',
          img: IMG.p1,
          qty: 1,
          refund: 21.4,
          commissionRefund: 1.07
        }
      ]
    },
    {
      id: '612965464901',
      date: '2026-08-03',
      nick: '阿杰',
      contact: '王杰',
      phone: '13800138001',
      verifyCode: 'HX9001',
      shipMode: '快递',
      goods: '赣南脐橙 5斤装 * 2 共2件商品',
      paid: 56.0,
      refund: 0,
      commission: 8.4,
      goodsCount: 2,
      payTime: '2026-08-03 09:12:08',
      deliveryTime: '-',
      finishTime: '-',
      remark: '尽快发货',
      status: 'pending_ship',
      statusText: '待发货',
      dayKey: '2026-08-03',
      goodsItems: [
        {
          name: '赣南脐橙 果大皮薄 5斤装 / 份',
          img: IMG.p2,
          qty: 2,
          paid: 56.0,
          commission: 8.4
        }
      ],
      refundItems: []
    },
    {
      id: '612965464902',
      date: '2026-08-03',
      nick: '小满',
      contact: '林小满',
      phone: '13700001101',
      verifyCode: 'HX9002',
      shipMode: '自提',
      goods: '阳光番茄 500g * 2 共2件商品',
      paid: 59.8,
      refund: 0,
      commission: 6.0,
      goodsCount: 2,
      payTime: '2026-08-03 10:20:33',
      deliveryTime: '到店自提',
      finishTime: '-',
      remark: '',
      status: 'pending_pickup',
      statusText: '待自提',
      dayKey: '2026-08-03',
      goodsItems: [
        {
          name: '阳光番茄 500g / 份',
          img: IMG.p1,
          qty: 2,
          paid: 59.8,
          commission: 6.0
        }
      ],
      refundItems: []
    },
    {
      id: '612965464903',
      date: '2026-08-02',
      nick: '韩梅',
      contact: '韩冬梅',
      phone: '13700001103',
      verifyCode: 'HX9003',
      shipMode: '快递',
      goods: '紫薯 1kg * 1 共1件商品',
      paid: 29.9,
      refund: 0,
      commission: 4.5,
      goodsCount: 1,
      payTime: '2026-08-02 16:08:11',
      deliveryTime: '2026-08-03 10:00-12:00',
      finishTime: '-',
      remark: '',
      status: 'pending_receipt',
      statusText: '待收货',
      dayKey: '2026-08-02',
      goodsItems: [
        {
          name: '紫薯 1kg / 份',
          img: IMG.p3,
          qty: 1,
          paid: 29.9,
          commission: 4.5
        }
      ],
      refundItems: []
    },
    {
      id: '612965464904',
      date: '2026-08-01',
      nick: '文博',
      contact: '马文博',
      phone: '13700001106',
      verifyCode: 'HX9004',
      shipMode: '自提',
      goods: '黄瓜 500g * 2 共2件商品',
      paid: 59.8,
      refund: 0,
      commission: 10.97,
      goodsCount: 2,
      payTime: '2026-08-01 11:45:02',
      deliveryTime: '到店自提',
      finishTime: '2026-08-01 18:20:40',
      remark: '',
      status: 'done',
      statusText: '交易成功',
      dayKey: '2026-08-01',
      goodsItems: [
        {
          name: '黄瓜 500g / 份',
          img: IMG.p4,
          qty: 2,
          paid: 59.8,
          commission: 10.97
        }
      ],
      refundItems: []
    }
  ];

  function getById(id) {
    return ORDERS.find(function (o) {
      return o.id === String(id || '');
    }) || null;
  }

  global.StoreAppBizOrders = {
    list: ORDERS,
    getById: getById
  };
})(window);
