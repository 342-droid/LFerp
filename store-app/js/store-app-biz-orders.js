/**
 * 经营中心订单演示数据（列表 / 商品明细共用）
 *
 * 结算规则（清分 / 门店分佣）：
 * - 用户支付成功后即生成清分数据，对应门店端分佣信息（门店明细）
 * - 若结算未配置门店佣金比例，则门店无佣金，不生成清分数据（门店明细）
 * - hasStoreClearing / storeCommissionRate 用于演示上述口径
 * - settleStatus 佣金结算状态：待结算 | 结算中 | 已结算 | 结算失败 | 已取消
 *
 * 所得佣金：
 * - 按「实付 − 退款」× 门店佣金比例计算，随退款变动
 * - 生成结算单后（结算中 / 已结算）金额锁死，线上退款关闭
 * - 无清分 / 结算已取消 / 订单已关闭：不计有效订单，所得为 0
 * 预估佣金：同一天内所有有效订单的所得佣金之和
 *
 * 订单状态与门店 APP「客户订单」一致：
 * 待发货 / 待收货 / 待提货/待收货 / 已完成 / 已关闭
 * - 待收货：门店端收货（仓配到店，非快递）
 * - 待提货/待收货：用户自提单待提货（含部分核销）或用户快递单待收货
 * 原型演示组合（订单状态 × 结算状态）：
 * - 待发货 × 待结算：已支付并生成清分，订单未完成
 * - 待发货 × —（无清分）：已支付，但结算未配置门店佣金比例
 * - 待提货 × 待结算：已支付并生成清分，订单未完成
 * - 待收货 × 待结算：已支付并生成清分，订单未完成
 * - 已完成 × 结算失败：结算异常
 * - 已完成 × 已结算：交易完成，佣金入账
 * - 已关闭 × 已取消：曾生成清分，后因全额退款等佣金冲回为 0
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

  /** 订单状态：与门店 APP 客户订单一致 */
  var ORDER_STATUSES = ['待发货', '待收货', '待提货/待收货', '已完成', '已关闭'];
  var ORDER_STATUS_TEXT = {
    pending_ship: '待发货',
    store_receive: '待收货',
    pending_receipt: '待收货',
    pending_pickup: '待提货',
    partial: '待提货',
    done: '已完成',
    failed: '已关闭'
  };

  function isExpressOrder(order) {
    return !!(order && (order.shipMode === '快递' || order.deliveryMode === 'express'));
  }

  /** 用户自提单待提货（含部分核销） */
  function isPickupOrder(order) {
    if (!order || isExpressOrder(order)) return false;
    var st = String(order.status || '');
    var text = String(order.statusText || '');
    return st === 'pending_pickup' || st === 'partial' || text === '待提货' || text === '部分核销';
  }

  /** 门店端收货：非快递待收货（仓配到店） */
  function isStoreReceiveOrder(order) {
    if (!order || isExpressOrder(order)) return false;
    var st = String(order.status || '');
    var text = String(order.statusText || '');
    return (
      st === 'store_receive' ||
      st === 'pending_store_receive' ||
      st === 'pending_receipt' ||
      text === '待收货'
    );
  }

  /** 待提货/待收货：用户自提待提货，或用户快递待收货 */
  function isUserFulfillOrder(order) {
    if (!order) return false;
    if (isExpressOrder(order)) {
      var st = String(order.status || '');
      var text = String(order.statusText || '');
      return st === 'pending_receipt' || text === '待收货';
    }
    return isPickupOrder(order);
  }

  function orderStatusText(order) {
    if (!order) return '—';
    if (isPickupOrder(order)) return '待提货';
    if (isStoreReceiveOrder(order) || order.status === 'pending_receipt') return '待收货';
    if (order.statusText) return order.statusText;
    return ORDER_STATUS_TEXT[order.status] || '—';
  }

  var ORDERS = [
    {
      /* 已关闭 × 已取消：曾生成清分，全额退款后佣金冲回为 0 */
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
      storeCommissionRate: 0.05,
      hasStoreClearing: true,
      commission: 0,
      settleStatus: '已取消',
      settleTime: '2021-12-25 10:22:08',
      goodsCount: 1,
      payTime: '2021-12-23 15:15:19',
      deliveryTime: '2021-12-24 16:00-17:00',
      refundTime: '2021-12-25 10:22:08',
      finishTime: '-',
      remark: '',
      status: 'failed',
      statusText: '已关闭',
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
      /* 待发货 × 待结算：已支付并生成清分，订单未完成 */
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
      /* 待提货 × 待结算：已支付并生成清分，订单未完成 */
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
      settleStatus: '待结算',
      settleTime: '-',
      goodsCount: 2,
      payTime: '2026-08-03 10:20:33',
      deliveryTime: '-',
      finishTime: '-',
      remark: '',
      status: 'pending_pickup',
      statusText: '待提货',
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
      /* 门店端待收货 × 待结算：仓配到店、门店尚未收货 */
      id: '612965464907',
      date: '2026-08-03',
      nick: '阿南',
      contact: '赵南',
      phone: '13700001107',
      verifyCode: 'HX9007',
      shipMode: '自提',
      goods: '土豆 2.5kg * 1 共1件商品',
      paid: 18.6,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 1.86,
      settleStatus: '待结算',
      settleTime: '-',
      goodsCount: 1,
      payTime: '2026-08-03 08:40:12',
      deliveryTime: '-',
      finishTime: '-',
      remark: '仓配到店，待门店收货',
      status: 'store_receive',
      statusText: '待收货',
      dayKey: '2026-08-03',
      goodsItems: [
        {
          name: '土豆 2.5kg / 份',
          img: IMG.p3,
          qty: 1,
          paid: 18.6,
          commission: 1.86
        }
      ],
      refundItems: []
    },
    {
      /* 用户快递待收货 × 待结算：归属「待提货/待收货」 */
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
      settleStatus: '待结算',
      settleTime: '-',
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
      /* 已完成 × 已结算：交易完成，佣金入账 */
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
      commissionLocked: 10.97,
      settleStatus: '已结算',
      settleTime: '2026-08-02 18:30:00',
      goodsCount: 2,
      payTime: '2026-08-01 11:45:02',
      deliveryTime: '到店自提',
      finishTime: '2026-08-01 18:20:40',
      remark: '',
      status: 'done',
      statusText: '已完成',
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
      /* 待发货 × —（无清分）：已支付，但结算未配置门店佣金比例 */
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
      /* 无清分：结算状态展示为 — */
      settleStatus: '—',
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
    },
    {
      /* 已完成 × 结算失败：结算异常 */
      id: '612965464906',
      date: '2026-07-30',
      nick: '阿敏',
      contact: '陈敏',
      phone: '13500003309',
      verifyCode: 'HX9006',
      shipMode: '快递',
      goods: '有机生菜 300g * 3 共3件商品',
      paid: 38.7,
      refund: 0,
      storeCommissionRate: 0.12,
      hasStoreClearing: true,
      commission: 4.64,
      settleStatus: '结算失败',
      settleTime: '2026-08-01 03:15:22',
      goodsCount: 3,
      payTime: '2026-07-30 19:22:10',
      deliveryTime: '2026-07-31 09:00-11:00',
      finishTime: '2026-07-31 14:08:33',
      remark: '',
      status: 'done',
      statusText: '已完成',
      dayKey: '2026-07-30',
      goodsItems: [
        {
          name: '有机生菜 300g / 份',
          img: IMG.p3,
          qty: 3,
          paid: 38.7,
          commission: 4.64
        }
      ],
      refundItems: []
    },
    {
      /* 待提货 × 待结算 × 部分退款：所得佣金随退款从 8.00 降为 6.00 */
      id: '612965464908',
      date: '2026-08-03',
      nick: '阿琪',
      contact: '周琪',
      phone: '13700001108',
      verifyCode: 'HX9008',
      shipMode: '自提',
      goods: '油麦菜 300g * 4 共4件商品',
      paid: 80,
      refund: 20,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 8,
      settleStatus: '待结算',
      settleTime: '-',
      goodsCount: 4,
      payTime: '2026-08-03 11:05:18',
      deliveryTime: '到店自提',
      refundTime: '2026-08-03 15:40:00',
      finishTime: '-',
      remark: '部分退款，所得佣金按实付−退款重算，结算前仍可变动',
      status: 'pending_pickup',
      statusText: '待提货',
      dayKey: '2026-08-03',
      goodsItems: [
        {
          name: '油麦菜 300g / 份',
          img: IMG.p1,
          qty: 4,
          paid: 80,
          commission: 8
        }
      ],
      refundItems: [
        {
          name: '油麦菜 300g / 份',
          img: IMG.p1,
          qty: 1,
          refund: 20,
          commissionRefund: 2
        }
      ]
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

  function roundMoney(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  /** 结算单已生成：所得佣金锁死，线上退款关闭 */
  function isCommissionLocked(order) {
    var s = String((order && order.settleStatus) || '');
    return s === '已结算' || s === '结算中';
  }

  /**
   * 有效订单：已生成清分、未关闭、结算未取消。
   * 无清分（未配比例）与已关闭 / 已取消不计入预估佣金。
   */
  function isValidCommissionOrder(order) {
    if (!hasStoreClearing(order)) return false;
    if (order.status === 'failed' || order.statusText === '已关闭') return false;
    if (order.settleStatus === '已取消') return false;
    return true;
  }

  /**
   * 所得佣金：扣退款后的门店佣金。
   * 未出结算单：max(实付 − 退款, 0) × 比例，随退款变。
   * 已出结算单：取锁定额（commissionLocked / commission）。
   */
  function earnedCommission(order) {
    if (!order || !hasStoreClearing(order)) return 0;
    if (order.settleStatus === '已取消') return 0;
    if (isCommissionLocked(order)) {
      var locked = order.commissionLocked != null ? order.commissionLocked : order.commission;
      return roundMoney(locked);
    }
    var rate = Number(order.storeCommissionRate);
    var paid = Number(order.paid) || 0;
    var refund = Number(order.refund) || 0;
    var base = Math.max(0, paid - refund);
    if (rate > 0) return roundMoney(base * rate);
    return roundMoney(order.commission);
  }

  function sumEarnedCommission(list) {
    var amt = 0;
    var cnt = 0;
    (list || []).forEach(function (o) {
      if (!isValidCommissionOrder(o)) return;
      amt += earnedCommission(o);
      cnt += 1;
    });
    return { amt: roundMoney(amt), cnt: cnt };
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
    orderStatusText: orderStatusText,
    isPickupOrder: isPickupOrder,
    isExpressOrder: isExpressOrder,
    isStoreReceiveOrder: isStoreReceiveOrder,
    isUserFulfillOrder: isUserFulfillOrder,
    isCommissionLocked: isCommissionLocked,
    isValidCommissionOrder: isValidCommissionOrder,
    earnedCommission: earnedCommission,
    sumEarnedCommission: sumEarnedCommission,
    ORDER_STATUSES: ORDER_STATUSES,
    ORDER_STATUS_TEXT: ORDER_STATUS_TEXT,
    SETTLE_STATUSES: SETTLE_STATUSES
  };
})(window);
