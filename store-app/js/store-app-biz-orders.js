/**
 * 经营中心订单演示数据（列表 / 商品明细共用）
 *
 * 结算规则（清分 / 门店分佣）：
 * - 用户支付成功后即生成清分数据，对应门店端分佣信息（门店明细）
 * - 若结算未配置门店佣金比例，则门店无佣金，不生成清分数据（门店明细）
 * - hasStoreClearing / storeCommissionRate 用于演示上述口径
 * - settleStatus 佣金结算状态：待结算 | 结算中 | 已结算 | 结算失败 | 已取消
 */
(function (global) {
  var IMG = {
    p1: '../../user-app/assets/order-product-1.svg',
    p2: '../../user-app/assets/order-product-2.svg',
    p3: '../../user-app/assets/order-product-3.svg',
    p4: '../../user-app/assets/order-product-4.svg'
  };

  /** 结算状态枚举（展示名与枚举一致） */
  var SETTLE_STATUSES = ['待结算', '结算中', '已结算', '结算失败', '已取消'];

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
      /* 支付时已按比例生成清分；全额退款后佣金冲回为 0，门店明细仍保留 */
      storeCommissionRate: 0.05,
      hasStoreClearing: true,
      commission: 0,
      /* 佣金因退款失效 */
      settleStatus: '已取消',
      settleTime: '2021-12-25 10:22:08',
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
      storeCommissionRate: 0.15,
      hasStoreClearing: true,
      commission: 8.4,
      /* 订单未完成，佣金未达结算条件 */
      settleStatus: '待结算',
      settleTime: '-',
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
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 6.0,
      /* 已触发结算，处理中 */
      settleStatus: '结算中',
      settleTime: '-',
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
      storeCommissionRate: 0.15,
      hasStoreClearing: true,
      commission: 4.5,
      /* 佣金结算异常 */
      settleStatus: '结算失败',
      settleTime: '2026-08-03 02:10:05',
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
      storeCommissionRate: 0.1834,
      hasStoreClearing: true,
      commission: 10.97,
      /* 已结算入门店余额账户 */
      settleStatus: '已结算',
      settleTime: '2026-08-02 18:30:00',
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
    },
    {
      /* 已支付，但结算未配置门店佣金比例 → 无佣金、不生成清分（门店明细） */
      id: '612965464905',
      date: '2026-08-03',
      nick: '阿哲',
      contact: '李哲',
      phone: '13600002208',
      verifyCode: 'HX9005',
      shipMode: '快递',
      goods: '香蕉 1kg * 1 共1件商品',
      paid: 12.8,
      refund: 0,
      storeCommissionRate: null,
      hasStoreClearing: false,
      commission: 0,
      settleStatus: '',
      settleTime: '-',
      goodsCount: 1,
      payTime: '2026-08-03 14:05:40',
      deliveryTime: '-',
      finishTime: '-',
      remark: '结算未配置门店佣金比例',
      status: 'pending_ship',
      statusText: '待发货',
      dayKey: '2026-08-03',
      goodsItems: [
        {
          name: '香蕉 1kg / 份',
          img: IMG.p2,
          qty: 1,
          paid: 12.8,
          commission: 0
        }
      ],
      refundItems: []
    }
  ];

  /** 结算已配置门店佣金比例且支付后生成了清分（门店明细） */
  function hasStoreClearing(order) {
    if (!order) return false;
    if (order.hasStoreClearing === true) return true;
    if (order.hasStoreClearing === false) return false;
    var rate = order.storeCommissionRate;
    if (rate == null || rate === '') return false;
    return Number(rate) > 0 && !!order.payTime;
  }

  function listStoreClearing() {
    return ORDERS.filter(hasStoreClearing);
  }

  function getById(id) {
    return (
      ORDERS.find(function (o) {
        return o.id === String(id || '');
      }) || null
    );
  }

  global.StoreAppBizOrders = {
    list: ORDERS,
    listStoreClearing: listStoreClearing,
    hasStoreClearing: hasStoreClearing,
    getById: getById,
    SETTLE_STATUSES: SETTLE_STATUSES
  };
})(window);
