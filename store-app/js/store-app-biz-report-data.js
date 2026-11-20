/**
 * 丰银宝 · 经营报表演示数据与汇总
 *
 * 口径要点（与产品确认范围一致）：
 * - 统计范围：当前门店；跨店主订单仅汇总本店金额，主订单号本店去重
 * - 支付订单数 = 支付成功主订单去重；子订单数单独统计
 * - 支付金额（含实付运费）= 顾客实际支付；明细分列商品实付 / 运费实付
 *   · 包邮：运费实付 0；平台全额/部分补贴运费时，平台补贴单列，不计入支付金额、不直接计入佣金
 * - 客单价 = 支付金额 ÷ 支付主订单数（分母 0 显示 —）
 * - 净成交额 = 当期支付 − 当期退款（退款按订单退款成功时间，可为负）
 * - 支付人数 / 新客：仅本店子订单顾客去重；新客＝首次在本店支付成功（他店购买不影响）
 * - 清分最小单位＝SKU；预估佣金＝Σ(SKU商品实付−商品退款)×门店比例；运费不参与分佣
 * - 门店端佣金结算状态仅五态：待结算｜结算中｜已结算｜结算失败｜已取消
 *   · 「代收待转」为平台内部资金处理态，仅 PC 异常订单展示，门店端不单独展示
 *   · 「代收待转」≠「结算失败」，不可映射为失败；门店仅在佣金结算确失败时显示「结算失败」
 * - 结算中/已结算取锁定额；待结算仅「待结算」状态
 * - 实际入账佣金按入账时间；佣金回退按回退成功时间单独列示（≠ 订单退款时间）
 * - 可提现余额取钱包当前口径，不随日期筛选变化
 * - 进货独立，不计入顾客成交额/佣金
 *
 * 拆单：代采按履约+供应商；零售按履约+商户主体（快递=供应商；自提统一=门店，无供应商自提例外）
 * 主订单 / 业务子订单 / 履约明细三者不一一对应
 */
(function (global) {
  var IMG = {
    p1: '../../user-app/assets/order-product-1.svg',
    p2: '../../user-app/assets/order-product-2.svg',
    p3: '../../user-app/assets/order-product-3.svg',
    p4: '../../user-app/assets/order-product-4.svg'
  };

  var STORE = {
    id: 'STORE-YY',
    name: '悠悠生鲜超市'
  };

  var DEMO_PIVOT = '2026-11-14';
  var DEMO_TODAY = '2026-11-14';
  var UPDATED_AT = '2026-11-14 09:58:00';

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function money(n) {
    return round2(n).toFixed(2);
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function todayKeyNow() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function dateKeyOf(str) {
    var m = String(str || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
  }

  function shiftDateKey(key, delta) {
    var p = String(key || '').split('-');
    if (p.length < 3) return '';
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() + delta);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function daysBetweenKeys(fromKey, toKey) {
    var from = dateKeyOf(fromKey).split('-');
    var to = dateKeyOf(toKey).split('-');
    if (from.length < 3 || to.length < 3) return 0;
    var a = new Date(Number(from[0]), Number(from[1]) - 1, Number(from[2]));
    var b = new Date(Number(to[0]), Number(to[1]) - 1, Number(to[2]));
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function rewriteDemoDateString(value, delta) {
    return String(value).replace(/2026-\d{2}-\d{2}/g, function (key) {
      return shiftDateKey(key, delta);
    });
  }

  function walkDemoDates(node, delta) {
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach(function (key) {
      var value = node[key];
      if (typeof value === 'string' && /2026-\d{2}-\d{2}/.test(value)) {
        node[key] = rewriteDemoDateString(value, delta);
      } else if (value && typeof value === 'object') {
        walkDemoDates(value, delta);
      }
    });
  }

  function hourOf(str) {
    var m = String(str || '').match(/\s(\d{2}):/);
    return m ? Number(m[1]) : 0;
  }

  function isCommissionLocked(row) {
    var s = String(row.settleStatus || '');
    return s === '已结算' || s === '结算中';
  }

  function hasStoreClearing(row) {
    if (row.hasStoreClearing === false) return false;
    if (row.hasStoreClearing === true) return true;
    return Number(row.storeCommissionRate) > 0;
  }

  /** 商品侧退款（清分按 SKU；运费退款不进计佣基数） */
  function goodsRefundAmount(row) {
    var items = row.refundItems || [];
    if (items.length) {
      return round2(
        items.reduce(function (s, g) {
          return s + (Number(g.refund) || 0);
        }, 0)
      );
    }
    var goodsPaid = round2(row.goodsPaid != null ? row.goodsPaid : Number(row.paid) || 0);
    return Math.min(round2(row.refund || 0), goodsPaid);
  }

  /** SKU 商品实付合计（不含运费；与清分最小单位对齐） */
  function goodsPaidAmount(row) {
    var items = row.goodsItems || [];
    if (items.length) {
      return round2(
        items.reduce(function (s, g) {
          return s + (Number(g.paid) || 0);
        }, 0)
      );
    }
    if (row.goodsPaid != null) return round2(row.goodsPaid);
    return Math.max(0, round2(row.paid) - round2(row.freightPaid || row.freight || 0));
  }

  /**
   * 预估/所得佣金：清分最小单位为 SKU。
   * 结算前：max(ΣSKU商品实付 − 商品退款, 0) × 门店比例（运费不参与分佣）。
   * 结算中/已结算：取锁定额。
   */
  function estimatedCommission(row) {
    if (!hasStoreClearing(row)) return 0;
    if (row.settleStatus === '已取消') return 0;
    if (isCommissionLocked(row)) {
      return round2(row.commissionLocked != null ? row.commissionLocked : row.commission);
    }
    var rate = Number(row.storeCommissionRate) || 0;
    var base = Math.max(0, goodsPaidAmount(row) - goodsRefundAmount(row));
    return round2(base * rate);
  }

  function creditedCommission(row) {
    if (row.settleStatus !== '已结算') return 0;
    return round2(row.creditedAmount != null ? row.creditedAmount : estimatedCommission(row));
  }

  /** 顾客实付拆解：支付金额＝商品实付＋运费实付；平台运费补贴不计入支付金额 */
  function normalizeSubOrder(row) {
    if (row.goodsPaid == null) {
      row.goodsPaid = round2((Number(row.goodsAmount) || 0) - (Number(row.discount) || 0));
    } else {
      row.goodsPaid = round2(row.goodsPaid);
    }
    if (row.freightPaid == null) {
      row.freightPaid = round2(Number(row.freight) || 0);
    } else {
      row.freightPaid = round2(row.freightPaid);
    }
    if (row.platformFreightSubsidy == null) {
      row.platformFreightSubsidy = 0;
    } else {
      row.platformFreightSubsidy = round2(row.platformFreightSubsidy);
    }
    /* 以商品实付+运费实付为准重算支付金额，避免把平台补贴混入 */
    row.paid = round2(row.goodsPaid + row.freightPaid);
    row.paidIncludesFreight = true;
    if (!row.freightTag) {
      if (row.freightPaid === 0 && row.platformFreightSubsidy > 0) {
        row.freightTag = '平台全额补贴运费';
      } else if (row.freightPaid === 0) {
        row.freightTag = '包邮';
      } else if (row.platformFreightSubsidy > 0) {
        row.freightTag = '平台部分补贴运费';
      } else {
        row.freightTag = '';
      }
    }
    if (Number(row.commissionRefund) > 0 && !row.commissionRefundStatus) {
      row.commissionRefundStatus = row.commissionRefundTime ? '成功' : '处理中';
    }
    if (row.fulfillMode === '自提') {
      /* 确认：自提商户主体一律按门店，无供应商自提例外 */
      row.merchantSubject = STORE.name;
    }
    return row;
  }

  /** 仅「回退成功」计入佣金回退金额；处理中 / 失败不计 */
  function isCommissionRefundSuccess(row) {
    if (!(Number(row.commissionRefund) > 0)) return false;
    return String(row.commissionRefundStatus || '') === '成功' && !!dateKeyOf(row.commissionRefundTime);
  }

  function settleBucketAmount(row) {
    return estimatedCommission(row);
  }

  /**
   * 业务子订单（门店视角）。id = 子订单号；mainOrderId = 支付主订单。
   * packages = 履约明细数，不等于子订单数。
   */
  var SUB_ORDERS = [
    /* —— 示例：一笔主订单 120 元拆成 3 笔供应商子订单 —— */
    {
      id: 'SO-120-A',
      mainOrderId: 'MO-PAY-120',
      customerId: 'C-LIN',
      nick: '小林',
      phone: '13800001201',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '赣南果园供应链',
      supplierName: '赣南果园供应链',
      goodsAmount: 38,
      discount: 0,
      freight: 2,
      paid: 40,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 3.8,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 09:10:00',
      payTime: '2026-11-14 09:12:08',
      packages: 1,
      goodsItems: [{ name: '赣南脐橙 5斤装', img: IMG.p2, qty: 1, paid: 38, freightShare: 2, commission: 3.8 }],
      remark: '主单 MO-PAY-120 拆单·供应商A·快递；计佣按 SKU 商品实付 38（运费 2 不参与）'
    },
    {
      id: 'SO-120-B',
      mainOrderId: 'MO-PAY-120',
      customerId: 'C-LIN',
      nick: '小林',
      phone: '13800001201',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 45,
      discount: 0,
      freight: 0,
      paid: 45,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.12,
      hasStoreClearing: true,
      commission: 5.4,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 09:10:00',
      payTime: '2026-11-14 09:12:08',
      packages: 2,
      goodsItems: [
        { name: '阳光番茄 500g', img: IMG.p1, qty: 2, paid: 30, freightShare: 0, commission: 3.6 },
        { name: '黄瓜 500g', img: IMG.p4, qty: 1, paid: 15, freightShare: 0, commission: 1.8 }
      ],
      remark: '同主单；1 子订单 2 履约包裹'
    },
    {
      id: 'SO-120-C',
      mainOrderId: 'MO-PAY-120',
      customerId: 'C-LIN',
      nick: '小林',
      phone: '13800001201',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '本店现货',
      goodsAmount: 35,
      discount: 0,
      freight: 0,
      paid: 35,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 3.5,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 09:10:00',
      payTime: '2026-11-14 09:12:08',
      packages: 1,
      goodsItems: [{ name: '油麦菜 300g', img: IMG.p1, qty: 2, paid: 35, freightShare: 0, commission: 3.5 }],
      remark: '同主单·自提·商户主体=门店'
    },

    /* —— 同供应商因不同履约方式拆单 —— */
    {
      id: 'SO-SAME-EXP',
      mainOrderId: 'MO-SAME-SUP',
      customerId: 'C-HAN',
      nick: '韩梅',
      phone: '13700001103',
      isNewAtStore: false,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 48,
      discount: 3,
      freight: 6,
      paid: 51,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.15,
      hasStoreClearing: true,
      commission: 6.75,
      settleStatus: '结算中',
      settleTime: '2026-11-14 08:00:00',
      creditTime: '-',
      creditedAmount: 0,
      commissionLocked: 6.75,
      commissionRefund: 0,
      orderTime: '2026-11-13 20:05:00',
      payTime: '2026-11-13 20:06:22',
      packages: 1,
      goodsItems: [{ name: '紫薯 1kg', img: IMG.p3, qty: 2, paid: 45, freightShare: 6, commission: 6.75 }],
      remark: '同供应商·快递子单；商品实付 45（48−优惠3），运费不参与分佣'
    },
    {
      id: 'SO-SAME-PICK',
      mainOrderId: 'MO-SAME-SUP',
      customerId: 'C-HAN',
      nick: '韩梅',
      phone: '13700001103',
      isNewAtStore: false,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '冷丰优选供应链',
      goodsAmount: 29.9,
      discount: 0,
      freight: 0,
      paid: 29.9,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 2.99,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-13 20:05:00',
      payTime: '2026-11-13 20:06:22',
      packages: 1,
      goodsItems: [{ name: '有机生菜 300g', img: IMG.p3, qty: 1, paid: 29.9, freightShare: 0, commission: 2.99 }],
      remark: '同供应商·自提子单（商户主体=门店）'
    },

    /* —— 部分退款（本期支付本期退） —— */
    {
      id: 'SO-PART-REF',
      mainOrderId: 'MO-PART-REF',
      customerId: 'C-QI',
      nick: '阿琪',
      phone: '13700001108',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '本店现货',
      goodsAmount: 80,
      discount: 0,
      freight: 0,
      paid: 80,
      paidIncludesFreight: true,
      refund: 20,
      refundTime: '2026-11-14 15:40:00',
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 8,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 11:00:00',
      payTime: '2026-11-14 11:05:18',
      packages: 1,
      goodsItems: [{ name: '油麦菜 300g', img: IMG.p1, qty: 4, paid: 80, freightShare: 0, commission: 8 }],
      refundItems: [{ name: '油麦菜 300g', qty: 1, refund: 20, commissionRefund: 2 }],
      remark: '部分退款，预估佣金随退款从 8.00 调为 6.00'
    },

    /* —— 全额退款 + 佣金冲回已取消 —— */
    {
      id: 'SO-FULL-REF',
      mainOrderId: 'MO-FULL-REF',
      customerId: 'C-SI',
      nick: '斯斯',
      phone: '15988434315',
      isNewAtStore: false,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '益力多乳品',
      supplierName: '益力多乳品',
      goodsAmount: 18.4,
      discount: 0,
      freight: 3,
      paid: 21.4,
      paidIncludesFreight: true,
      refund: 21.4,
      refundTime: '2026-11-10 10:22:08',
      storeCommissionRate: 0.05,
      hasStoreClearing: true,
      commission: 0,
      settleStatus: '已取消',
      settleTime: '2026-11-10 10:22:08',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0.92,
      commissionRefundStatus: '成功',
      commissionRefundTime: '2026-11-10 10:22:08',
      relatedCommissionId: 'CLR-FULL-REF',
      orderTime: '2026-11-08 15:10:00',
      payTime: '2026-11-08 15:15:19',
      packages: 1,
      goodsItems: [{ name: '[益力多]乳酸菌乳饮品', img: IMG.p1, qty: 1, paid: 18.4, freightShare: 3, commission: 0.92 }],
      remark: '全额退款：原计佣按商品实付 18.4×5%=0.92（运费不参与）；回退成功 0.92'
    },

    /* —— 历史订单在本期退款（支付不在本期，退款在本期） —— */
    {
      id: 'SO-HIST-REF',
      mainOrderId: 'MO-HIST-REF',
      customerId: 'C-WEN',
      nick: '文博',
      phone: '13700001106',
      isNewAtStore: false,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '本店现货',
      goodsAmount: 59.8,
      discount: 0,
      freight: 0,
      paid: 59.8,
      paidIncludesFreight: true,
      refund: 59.8,
      refundTime: '2026-11-14 08:30:00',
      storeCommissionRate: 0.1834,
      hasStoreClearing: true,
      commission: 10.97,
      commissionLocked: 10.97,
      settleStatus: '已结算',
      settleTime: '2026-10-20 18:30:00',
      creditTime: '2026-10-20 18:30:00',
      creditedAmount: 10.97,
      commissionRefund: 10.97,
      commissionRefundStatus: '成功',
      commissionRefundTime: '2026-11-14 09:05:00',
      relatedCommissionId: 'CLR-HIST-REF',
      orderTime: '2026-10-18 11:40:00',
      payTime: '2026-10-18 11:45:02',
      packages: 1,
      goodsItems: [{ name: '黄瓜 500g', img: IMG.p4, qty: 2, paid: 59.8, freightShare: 0, commission: 10.97 }],
      remark: '历史已入账订单：退款成功 08:30，佣金回退成功 09:05（时点不同，分别归期）'
    },

    /* —— 已入账佣金 —— */
    {
      id: 'SO-CREDITED',
      mainOrderId: 'MO-CREDITED',
      customerId: 'C-HE',
      nick: '阿禾',
      phone: '13800009009',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 28,
      discount: 0,
      freight: 4,
      paid: 32,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 2.8,
      commissionLocked: 2.8,
      settleStatus: '已结算',
      settleTime: '2026-11-14 18:05:00',
      creditTime: '2026-11-14 18:05:00',
      creditedAmount: 2.8,
      commissionRefund: 0,
      orderTime: '2026-11-14 16:18:00',
      payTime: '2026-11-14 16:20:00',
      packages: 1,
      goodsItems: [{ name: '冰糖橙 2kg', img: IMG.p2, qty: 1, paid: 28, freightShare: 4, commission: 2.8 }],
      remark: '本期支付并实际入账；计佣 28×10%=2.8（运费 4 不参与）'
    },

    /* —— 昨日支付 / 近7天 / 本月 —— */
    {
      id: 'SO-YEST',
      mainOrderId: 'MO-YEST',
      customerId: 'C-MIN',
      nick: '阿敏',
      phone: '13500003309',
      isNewAtStore: false,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 38.7,
      discount: 0,
      freight: 0,
      paid: 38.7,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.12,
      hasStoreClearing: true,
      commission: 4.64,
      commissionLocked: 4.64,
      settleStatus: '已结算',
      settleTime: '2026-11-13 21:00:00',
      creditTime: '2026-11-13 21:00:00',
      creditedAmount: 4.64,
      commissionRefund: 0,
      orderTime: '2026-11-13 09:20:00',
      payTime: '2026-11-13 09:22:10',
      packages: 1,
      goodsItems: [{ name: '有机生菜 300g', img: IMG.p3, qty: 3, paid: 38.7, freightShare: 0, commission: 4.64 }],
      remark: '昨日成交并入账'
    },
    {
      id: 'SO-WEEK',
      mainOrderId: 'MO-WEEK',
      customerId: 'C-NING',
      nick: '阿宁',
      phone: '13800009010',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '本店现货',
      goodsAmount: 16.8,
      discount: 0,
      freight: 0,
      paid: 16.8,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 1.68,
      commissionLocked: 1.68,
      settleStatus: '已结算',
      settleTime: '2026-11-11 15:10:00',
      creditTime: '2026-11-11 15:10:00',
      creditedAmount: 1.68,
      commissionRefund: 0,
      orderTime: '2026-11-11 09:18:00',
      payTime: '2026-11-11 09:18:00',
      packages: 1,
      goodsItems: [{ name: '西兰花 400g', img: IMG.p2, qty: 1, paid: 16.8, freightShare: 0, commission: 1.68 }],
      remark: '近7天入账'
    },
    {
      id: 'SO-MONTH',
      mainOrderId: 'MO-MONTH',
      customerId: 'C-LAN',
      nick: '阿兰',
      phone: '13800009012',
      isNewAtStore: false,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 62,
      discount: 0,
      freight: 6,
      paid: 68,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 6.2,
      commissionLocked: 6.2,
      settleStatus: '已结算',
      settleTime: '2026-10-30 09:30:00',
      creditTime: '2026-10-30 09:30:00',
      creditedAmount: 6.2,
      commissionRefund: 0,
      orderTime: '2026-10-25 13:40:00',
      payTime: '2026-10-25 13:40:00',
      packages: 1,
      goodsItems: [{ name: '车厘子 500g', img: IMG.p2, qty: 1, paid: 62, freightShare: 6, commission: 6.2 }],
      remark: '本月较早入账样例；计佣按商品实付 62（运费不参与）'
    },

    /* —— 无清分（不计预估佣金） —— */
    {
      id: 'SO-NO-RATE',
      mainOrderId: 'MO-NO-RATE',
      customerId: 'C-ZHE',
      nick: '阿哲',
      phone: '13600002208',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 12.8,
      discount: 0,
      freight: 0,
      paid: 12.8,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: null,
      hasStoreClearing: false,
      commission: 0,
      settleStatus: '—',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 14:00:00',
      payTime: '2026-11-14 14:05:40',
      packages: 1,
      goodsItems: [{ name: '香蕉 1kg', img: IMG.p2, qty: 1, paid: 12.8, freightShare: 0, commission: 0 }],
      remark: '结算未配置门店佣金比例'
    },

    /* —— 跨门店主订单：仅本店金额计入；支付人数/新客只按本店子单顾客 —— */
    {
      id: 'SO-CROSS-LOCAL',
      mainOrderId: 'MO-CROSS-STORE',
      customerId: 'C-CROSS',
      nick: '跨店客',
      phone: '13900009999',
      isNewAtStore: true,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '本店现货',
      goodsAmount: 40,
      discount: 0,
      freight: 0,
      paid: 40,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 4,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 12:00:00',
      payTime: '2026-11-14 12:01:00',
      packages: 1,
      crossStoreMainPaid: 100,
      otherStorePaid: 60,
      boughtAtOtherStoreBefore: true,
      goodsItems: [{ name: '土豆 2.5kg', img: IMG.p3, qty: 2, paid: 40, freightShare: 0, commission: 4 }],
      remark: '主单实付100，他店60，本店仅计40；顾客虽在他店买过，首次在本店支付仍计本店新客；支付人数按本店子单顾客去重'
    },

    /* —— 包邮：运费实付 0 —— */
    {
      id: 'SO-FREE-SHIP',
      mainOrderId: 'MO-FREE-SHIP',
      customerId: 'C-FREE',
      nick: '包邮客',
      phone: '13800008801',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 36,
      discount: 0,
      freight: 0,
      goodsPaid: 36,
      freightPaid: 0,
      platformFreightSubsidy: 0,
      freightTag: '包邮',
      paid: 36,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 3.6,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 13:10:00',
      payTime: '2026-11-14 13:12:00',
      packages: 1,
      goodsItems: [{ name: '香蕉 1kg', img: IMG.p2, qty: 2, paid: 36, freightShare: 0, commission: 3.6 }],
      remark: '包邮：运费实付 0，支付金额＝商品实付'
    },

    /* —— 平台全额补贴运费：运费实付 0，平台补贴单列 —— */
    {
      id: 'SO-PLAT-FULL',
      mainOrderId: 'MO-PLAT-FULL',
      customerId: 'C-PLAT',
      nick: '补贴客',
      phone: '13800008802',
      isNewAtStore: false,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '赣南果园供应链',
      supplierName: '赣南果园供应链',
      goodsAmount: 50,
      discount: 0,
      freight: 0,
      goodsPaid: 50,
      freightPaid: 0,
      platformFreightSubsidy: 8,
      freightTag: '平台全额补贴运费',
      paid: 50,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 5,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 13:40:00',
      payTime: '2026-11-14 13:42:00',
      packages: 1,
      goodsItems: [{ name: '赣南脐橙 5斤装', img: IMG.p2, qty: 1, paid: 50, freightShare: 0, commission: 5 }],
      remark: '平台全额补贴运费 8 元：不计入支付金额，也不直接计入门店佣金'
    },

    /* —— 平台部分补贴运费：仅顾客承担运费计入支付金额 —— */
    {
      id: 'SO-PLAT-PART',
      mainOrderId: 'MO-PLAT-PART',
      customerId: 'C-PART',
      nick: '分摊客',
      phone: '13800008803',
      isNewAtStore: true,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 40,
      discount: 0,
      freight: 3,
      goodsPaid: 40,
      freightPaid: 3,
      platformFreightSubsidy: 5,
      freightTag: '平台部分补贴运费',
      paid: 43,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 4,
      settleStatus: '待结算',
      settleTime: '-',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-14 14:20:00',
      payTime: '2026-11-14 14:22:00',
      packages: 1,
      goodsItems: [{ name: '阳光番茄 500g', img: IMG.p1, qty: 2, paid: 40, freightShare: 3, commission: 4 }],
      remark: '运费原价 8，平台补贴 5，顾客运费实付 3；支付金额＝40＋3＝43；计佣仅商品 40×10%=4'
    },

    /* —— 结算失败（不计入待结算） —— */
    {
      id: 'SO-SETTLE-FAIL',
      mainOrderId: 'MO-SETTLE-FAIL',
      customerId: 'C-FAIL',
      nick: '失败客',
      phone: '13800008804',
      isNewAtStore: false,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '益力多乳品',
      supplierName: '益力多乳品',
      goodsAmount: 22,
      discount: 0,
      freight: 3,
      paid: 25,
      paidIncludesFreight: true,
      refund: 0,
      storeCommissionRate: 0.08,
      hasStoreClearing: true,
      commission: 1.76,
      commissionLocked: 1.76,
      settleStatus: '结算失败',
      settleTime: '2026-11-14 10:00:00',
      creditTime: '-',
      creditedAmount: 0,
      commissionRefund: 0,
      orderTime: '2026-11-12 18:00:00',
      payTime: '2026-11-12 18:05:00',
      packages: 1,
      goodsItems: [{ name: '[益力多]乳酸菌乳饮品', img: IMG.p1, qty: 1, paid: 22, freightShare: 3, commission: 1.76 }],
      remark: '门店佣金结算确失败（非代收待转）；计佣 22×8%=1.76；不计入待结算。代收待转仅 PC 可见'
    },

    /* —— 订单已退款成功，佣金回退处理中（不计已成功回退） —— */
    {
      id: 'SO-COMM-REF-PENDING',
      mainOrderId: 'MO-COMM-REF-PENDING',
      customerId: 'C-PEND',
      nick: '回退中',
      phone: '13800008805',
      isNewAtStore: false,
      channel: '直播',
      bizType: '零售订单',
      fulfillMode: '自提',
      merchantSubject: '悠悠生鲜超市',
      supplierName: '本店现货',
      goodsAmount: 30,
      discount: 0,
      freight: 0,
      paid: 30,
      paidIncludesFreight: true,
      refund: 30,
      refundTime: '2026-11-14 09:10:00',
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 3,
      commissionLocked: 3,
      settleStatus: '已结算',
      settleTime: '2026-11-10 12:00:00',
      creditTime: '2026-11-10 12:00:00',
      creditedAmount: 3,
      commissionRefund: 3,
      commissionRefundStatus: '处理中',
      commissionRefundTime: '',
      relatedCommissionId: 'CLR-COMM-REF-PENDING',
      orderTime: '2026-11-09 16:00:00',
      payTime: '2026-11-09 16:05:00',
      packages: 1,
      goodsItems: [{ name: '黄瓜 500g', img: IMG.p4, qty: 1, paid: 30, freightShare: 0, commission: 3 }],
      remark: '订单退款成功时间与佣金回退时间分列；回退处理中不计已成功回退金额'
    },

    /* —— 佣金回退失败（不计已成功回退） —— */
    {
      id: 'SO-COMM-REF-FAIL',
      mainOrderId: 'MO-COMM-REF-FAIL',
      customerId: 'C-CREF',
      nick: '回退败',
      phone: '13800008806',
      isNewAtStore: false,
      channel: '商城',
      bizType: '零售订单',
      fulfillMode: '快递',
      merchantSubject: '冷丰优选供应链',
      supplierName: '冷丰优选供应链',
      goodsAmount: 24,
      discount: 0,
      freight: 4,
      paid: 28,
      paidIncludesFreight: true,
      refund: 28,
      refundTime: '2026-11-13 17:00:00',
      storeCommissionRate: 0.1,
      hasStoreClearing: true,
      commission: 2.4,
      commissionLocked: 2.4,
      settleStatus: '已结算',
      settleTime: '2026-11-08 20:00:00',
      creditTime: '2026-11-08 20:00:00',
      creditedAmount: 2.4,
      commissionRefund: 2.4,
      commissionRefundStatus: '失败',
      commissionRefundTime: '',
      relatedCommissionId: 'CLR-COMM-REF-FAIL',
      orderTime: '2026-11-07 11:00:00',
      payTime: '2026-11-07 11:08:00',
      packages: 1,
      goodsItems: [{ name: '紫薯 1kg', img: IMG.p3, qty: 1, paid: 24, freightShare: 4, commission: 2.4 }],
      remark: '佣金回退失败：原计佣 24×10%=2.4；失败不计已成功回退'
    }
  ];

  SUB_ORDERS.forEach(normalizeSubOrder);

  /** 门店进货（代采）演示：含货款+运费、混合支付、退货款/退运费 */
  var RESTOCK_ORDERS = [
    {
      id: 'RO-MIX-01',
      mainOrderId: 'RMO-MIX-01',
      subOrderIds: ['RSO-MIX-01A', 'RSO-MIX-01B'],
      supplierName: '冷丰优选供应链',
      fulfillMode: '配送到店',
      orderTime: '2026-11-14 07:30:00',
      payTime: '2026-11-14 07:32:10',
      goodsPaid: 860,
      freightPaid: 40,
      paid: 900,
      payMethods: { goodsQuota: 400, withdrawable: 200, thirdParty: 300, thirdPartyChannel: '微信' },
      refundGoods: 0,
      refundFreight: 0,
      refundTime: '',
      goodsItems: [
        { name: '土豆 2.5kg（箱）', img: IMG.p3, qty: 20, paid: 500 },
        { name: '黄瓜 500g（箱）', img: IMG.p4, qty: 12, paid: 360 }
      ],
      remark: ''
    },
    {
      id: 'RO-REF-02',
      mainOrderId: 'RMO-REF-02',
      subOrderIds: ['RSO-REF-02A'],
      supplierName: '赣南果园供应链',
      fulfillMode: '配送到店',
      orderTime: '2026-11-12 10:00:00',
      payTime: '2026-11-12 10:05:00',
      goodsPaid: 320,
      freightPaid: 25,
      paid: 345,
      payMethods: { goodsQuota: 345, withdrawable: 0, thirdParty: 0, thirdPartyChannel: '' },
      refundGoods: 80,
      refundFreight: 10,
      refundTime: '2026-11-14 11:20:00',
      goodsItems: [{ name: '赣南脐橙 5斤装（箱）', img: IMG.p2, qty: 8, paid: 320 }],
      remark: ''
    },
    {
      id: 'RO-WEEK-03',
      mainOrderId: 'RMO-WEEK-03',
      subOrderIds: ['RSO-WEEK-03A', 'RSO-WEEK-03B', 'RSO-WEEK-03C'],
      supplierName: '冷丰优选供应链',
      fulfillMode: '配送到店',
      orderTime: '2026-11-10 16:00:00',
      payTime: '2026-11-10 16:08:00',
      goodsPaid: 520,
      freightPaid: 30,
      paid: 550,
      payMethods: { goodsQuota: 0, withdrawable: 150, thirdParty: 400, thirdPartyChannel: '支付宝' },
      refundGoods: 0,
      refundFreight: 0,
      refundTime: '',
      goodsItems: [
        { name: '阳光番茄 500g（箱）', img: IMG.p1, qty: 10, paid: 280 },
        { name: '西兰花 400g（箱）', img: IMG.p2, qty: 8, paid: 240 }
      ],
      remark: '近7天进货，1 主单 3 子单'
    }
  ];

  function anchorDemo() {
    DEMO_TODAY = todayKeyNow();
    var delta = daysBetweenKeys(DEMO_PIVOT, DEMO_TODAY);
    if (delta) {
      SUB_ORDERS.forEach(function (row) {
        walkDemoDates(row, delta);
      });
      RESTOCK_ORDERS.forEach(function (row) {
        walkDemoDates(row, delta);
      });
    }
    UPDATED_AT = DEMO_TODAY + ' 09:58:00';
  }
  anchorDemo();

  function parseDay(str) {
    var p = String(str || '').split('-');
    if (p.length < 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  /** 环比前缀：与所选时段对齐（近七天→较前7天，近30天→较前30天） */
  function compareLabelForRange(range) {
    if (range === 'today') return '较昨日';
    if (range === 'yesterday') return '较前日';
    if (range === '7d') return '较前7天';
    if (range === '30d') return '较前30天';
    if (range === 'month') return '较上月';
    if (range === 'year') return '较去年';
    return '较上期';
  }

  /** 解析统计期：today / yesterday / 7d / month / custom */
  function resolveRange(range, custom) {
    var today = parseDay(DEMO_TODAY);
    var start = today;
    var endExclusive = new Date(today.getTime() + 86400000);
    var label = '今日';
    if (range === 'yesterday') {
      start = new Date(today.getTime() - 86400000);
      endExclusive = today;
      label = '昨日';
    } else if (range === '7d') {
      start = new Date(today.getTime() - 6 * 86400000);
      label = '近7天';
    } else if (range === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      label = '本月';
    } else if (range === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
      label = '本年';
    } else if (range === '30d') {
      start = new Date(today.getTime() - 29 * 86400000);
      label = '近30天';
    } else if (range === 'custom' && custom && custom.start && custom.end) {
      start = parseDay(custom.start);
      var endDay = parseDay(custom.end);
      endExclusive = endDay ? new Date(endDay.getTime() + 86400000) : endExclusive;
      label = custom.start + ' ~ ' + custom.end;
    }
    return {
      range: range || 'today',
      label: label,
      startKey: start
        ? start.getFullYear() + '-' + pad2(start.getMonth() + 1) + '-' + pad2(start.getDate())
        : DEMO_TODAY,
      endKey: dateKeyOf(
        new Date(endExclusive.getTime() - 86400000).getFullYear() +
          '-' +
          pad2(new Date(endExclusive.getTime() - 86400000).getMonth() + 1) +
          '-' +
          pad2(new Date(endExclusive.getTime() - 86400000).getDate())
      ),
      startMs: start ? start.getTime() : 0,
      endMs: endExclusive ? endExclusive.getTime() : 0,
      isSingleDay: range === 'today' || range === 'yesterday' || (range === 'custom' && custom && custom.start === custom.end)
    };
  }

  function inTimeRange(timeStr, bounds) {
    var key = dateKeyOf(timeStr);
    if (!key) return false;
    var d = parseDay(key);
    if (!d) return false;
    var t = d.getTime();
    return t >= bounds.startMs && t < bounds.endMs;
  }

  function compareBounds(bounds) {
    var days = Math.max(1, Math.round((bounds.endMs - bounds.startMs) / 86400000));
    var prevEnd = bounds.startMs;
    var prevStart = bounds.startMs - days * 86400000;
    return {
      startMs: prevStart,
      endMs: prevEnd,
      startKey: (function () {
        var d = new Date(prevStart);
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      })(),
      endKey: (function () {
        var d = new Date(prevEnd - 86400000);
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
      })()
    };
  }

  function uniqueMainCount(rows, timeField) {
    var map = {};
    (rows || []).forEach(function (r) {
      if (!r.mainOrderId) return;
      map[r.mainOrderId] = true;
    });
    return Object.keys(map).length;
  }

  function sumPaidInRange(bounds) {
    return SUB_ORDERS.filter(function (r) {
      return inTimeRange(r.payTime, bounds);
    });
  }

  function sumRefundInRange(bounds) {
    return SUB_ORDERS.filter(function (r) {
      return Number(r.refund) > 0 && inTimeRange(r.refundTime, bounds);
    });
  }

  function buildOverview(range, custom) {
    var bounds = resolveRange(range, custom);
    var paidRows = sumPaidInRange(bounds);
    var refundRows = sumRefundInRange(bounds);
    var paidAmt = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.paid) || 0);
      }, 0)
    );
    var goodsPaidAmt = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.goodsPaid) || 0);
      }, 0)
    );
    var freightPaidAmt = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.freightPaid) || 0);
      }, 0)
    );
    var platformFreightSubsidyAmt = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.platformFreightSubsidy) || 0);
      }, 0)
    );
    var refundAmt = round2(
      refundRows.reduce(function (s, r) {
        return s + (Number(r.refund) || 0);
      }, 0)
    );
    var net = round2(paidAmt - refundAmt);
    var mainCnt = uniqueMainCount(paidRows);
    var subCnt = paidRows.length;
    /* 支付人数/新客：仅归属本店的子订单顾客，按顾客身份去重；他店购买不影响本店新客 */
    var customerMap = {};
    var newCnt = 0;
    paidRows.forEach(function (r) {
      if (!r.customerId || customerMap[r.customerId]) return;
      customerMap[r.customerId] = { isNew: !!r.isNewAtStore };
      if (r.isNewAtStore) newCnt += 1;
    });
    var payUserCnt = Object.keys(customerMap).length;
    var oldCnt = payUserCnt - newCnt;
    var aov = mainCnt > 0 ? round2(paidAmt / mainCnt) : null;

    /* 预估：统计期内支付且仍有效清分的所得佣金（含待结算/结算中/已结算/结算失败） */
    var estimated = round2(
      SUB_ORDERS.filter(function (r) {
        if (!hasStoreClearing(r) || r.settleStatus === '已取消') return false;
        if (r.settleStatus === '已结算' || r.settleStatus === '结算中' || r.settleStatus === '结算失败') {
          return inTimeRange(r.payTime, bounds) || inTimeRange(r.settleTime, bounds);
        }
        return inTimeRange(r.payTime, bounds);
      }).reduce(function (s, r) {
        return s + estimatedCommission(r);
      }, 0)
    );

    /* 待结算：总览橙卡展示全量库存；经营概览内仍按统计期筛选 */
    var pendingRowsAll = SUB_ORDERS.filter(function (r) {
      return r.settleStatus === '待结算' && hasStoreClearing(r);
    });
    var pendingRows = pendingRowsAll.filter(function (r) {
      return inTimeRange(r.payTime, bounds);
    });
    var settlingRows = SUB_ORDERS.filter(function (r) {
      return r.settleStatus === '结算中' && hasStoreClearing(r) && inTimeRange(r.payTime, bounds);
    });
    var settleFailRows = SUB_ORDERS.filter(function (r) {
      return r.settleStatus === '结算失败' && hasStoreClearing(r) && inTimeRange(r.payTime, bounds);
    });
    var pendingSettle = round2(
      pendingRowsAll.reduce(function (s, r) {
        return s + settleBucketAmount(r);
      }, 0)
    );
    var pendingSettlePeriod = round2(
      pendingRows.reduce(function (s, r) {
        return s + settleBucketAmount(r);
      }, 0)
    );
    var settlingAmt = round2(
      settlingRows.reduce(function (s, r) {
        return s + settleBucketAmount(r);
      }, 0)
    );
    var settleFailAmt = round2(
      settleFailRows.reduce(function (s, r) {
        return s + settleBucketAmount(r);
      }, 0)
    );

    var credited = round2(
      SUB_ORDERS.filter(function (r) {
        return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, bounds);
      }).reduce(function (s, r) {
        return s + creditedCommission(r);
      }, 0)
    );

    /* 佣金回退：仅成功回退，且按佣金回退成功时间归期（不用订单退款时间兜底） */
    var commissionRefundAmt = round2(
      SUB_ORDERS.filter(function (r) {
        return isCommissionRefundSuccess(r) && inTimeRange(r.commissionRefundTime, bounds);
      }).reduce(function (s, r) {
        return s + (Number(r.commissionRefund) || 0);
      }, 0)
    );

    var wallet =
      global.StoreWalletDemo && typeof global.StoreWalletDemo.snapshot === 'function'
        ? global.StoreWalletDemo.snapshot()
        : { withdrawable: 3000 };

    /* 核销数：统计期内自提且已完结（已结算）的子单 */
    var verifyCnt = SUB_ORDERS.filter(function (r) {
      return r.fulfillMode === '自提' && r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime || r.payTime, bounds);
    }).length;

    var monthOv = resolveRange('month', {});
    var yearOv = resolveRange('year', {});
    var ydayOv = resolveRange('yesterday', {});
    var monthCredited = round2(
      SUB_ORDERS.filter(function (r) {
        return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, monthOv);
      }).reduce(function (s, r) {
        return s + creditedCommission(r);
      }, 0)
    );
    var yearCredited = round2(
      SUB_ORDERS.filter(function (r) {
        return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, yearOv);
      }).reduce(function (s, r) {
        return s + creditedCommission(r);
      }, 0)
    );
    /* 环比演示：上月／去年同期入账，供橙卡「较上月％／较去年」 */
    var todayDay = parseDay(DEMO_TODAY);
    var prevMonthBounds = {
      startMs: new Date(todayDay.getFullYear(), todayDay.getMonth() - 1, 1).getTime(),
      endMs: new Date(todayDay.getFullYear(), todayDay.getMonth(), 1).getTime()
    };
    var prevYearBounds = {
      startMs: new Date(todayDay.getFullYear() - 1, 0, 1).getTime(),
      endMs: new Date(todayDay.getFullYear(), 0, 1).getTime()
    };
    var prevMonthCredited = round2(
      SUB_ORDERS.filter(function (r) {
        return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, prevMonthBounds);
      }).reduce(function (s, r) {
        return s + creditedCommission(r);
      }, 0)
    );
    var prevYearCredited = round2(
      SUB_ORDERS.filter(function (r) {
        return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, prevYearBounds);
      }).reduce(function (s, r) {
        return s + creditedCommission(r);
      }, 0)
    );
    var memberIds = {};
    SUB_ORDERS.forEach(function (r) {
      if (r.customerId) memberIds[r.customerId] = true;
    });
    var memberCount = Object.keys(memberIds).length;
    var ydayMembers = {};
    SUB_ORDERS.filter(function (r) {
      return inTimeRange(r.payTime, ydayOv);
    }).forEach(function (r) {
      if (r.customerId) ydayMembers[r.customerId] = true;
    });
    var todayMembers = {};
    SUB_ORDERS.filter(function (r) {
      return inTimeRange(r.payTime, resolveRange('today', {}));
    }).forEach(function (r) {
      if (r.customerId) todayMembers[r.customerId] = true;
    });

    var prev = compareBounds(bounds);
    var prevPaidRows = sumPaidInRange(prev);
    var prevRefundRows = sumRefundInRange(prev);
    var prevPaidAmt = round2(
      prevPaidRows.reduce(function (s, r) {
        return s + (Number(r.paid) || 0);
      }, 0)
    );
    var prevRefundAmt = round2(
      prevRefundRows.reduce(function (s, r) {
        return s + (Number(r.refund) || 0);
      }, 0)
    );
    var prevMainCnt = uniqueMainCount(prevPaidRows);
    var prevAov = prevMainCnt > 0 ? round2(prevPaidAmt / prevMainCnt) : null;
    var prevVerifyCnt = SUB_ORDERS.filter(function (r) {
      return r.fulfillMode === '自提' && r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime || r.payTime, prev);
    }).length;
    var prevPending = round2(
      SUB_ORDERS.filter(function (r) {
        return r.settleStatus === '待结算' && hasStoreClearing(r) && inTimeRange(r.payTime, ydayOv);
      }).reduce(function (s, r) {
        return s + settleBucketAmount(r);
      }, 0)
    );

    function deltaOf(cur, prevVal) {
      var c = Number(cur) || 0;
      var p = Number(prevVal) || 0;
      var abs = round2(c - p);
      var pct = p === 0 ? (c === 0 ? 0 : 100) : round2(((c - p) / Math.abs(p)) * 100);
      return { abs: abs, pct: pct, up: abs > 0, flat: abs === 0 };
    }

    return {
      store: STORE,
      updatedAt: UPDATED_AT,
      bounds: bounds,
      hero: {
        pendingSettle: pendingSettle,
        pendingSettleDelta: deltaOf(pendingSettle, prevPending),
        monthCredited: monthCredited,
        monthCreditedDelta: deltaOf(monthCredited, prevMonthCredited),
        yearCredited: yearCredited,
        yearCreditedDelta: deltaOf(yearCredited, prevYearCredited),
        memberCount: memberCount,
        memberDelta: deltaOf(Object.keys(todayMembers).length, Object.keys(ydayMembers).length)
      },
      compare: {
        paid: deltaOf(paidAmt, prevPaidAmt),
        orders: deltaOf(mainCnt, prevMainCnt),
        verify: deltaOf(verifyCnt, prevVerifyCnt),
        aov: deltaOf(aov || 0, prevAov || 0),
        /* 环比文案随所选时段：选「昨天」为较前日，禁止「昨日较昨日」 */
        label: compareLabelForRange(range || bounds.range || 'today')
      },
      commission: {
        credited: credited,
        estimated: estimated,
        pendingSettle: pendingSettle,
        pendingSettlePeriod: pendingSettlePeriod,
        pendingSettleCount: pendingRowsAll.length,
        settling: settlingAmt,
        settlingCount: settlingRows.length,
        settleFailed: settleFailAmt,
        settleFailedCount: settleFailRows.length,
        commissionRefund: commissionRefundAmt,
        withdrawable: round2(wallet.withdrawable),
        monthCredited: monthCredited,
        yearCredited: yearCredited,
        pendingSettleHint:
          '待结算佣金：仅统计结算状态为「待结算」的所得佣金（清分有效）。总览橙卡展示全量待结算；不含「结算中」「结算失败」「已取消」。',
        settlingHint: '结算中：已发起结算、佣金已锁定，尚未入账。不计入待结算，也不计入实际入账。',
        settleFailedHint:
          '结算失败：仅当「本店佣金」结算确失败时展示，不计入待结算与实际入账。门店端只展示佣金五态（待结算/结算中/已结算/结算失败/已取消）。「代收待转」是平台内部资金处理状态，仅 PC 异常订单可见，门店端不展示，且不等于结算失败、不可映射为失败。',
        commissionRefundHint:
          '佣金回退按「佣金回退成功时间」归入统计期，与「订单退款成功时间」分列。仅统计回退成功金额；处理中 / 失败不计。回退失败属钱包出账失败，走冲正/补偿流水或原指令重试，不计入已成功回退，也不虚增补偿收入。'
      },
      trade: {
        paidAmount: paidAmt,
        goodsPaidAmount: goodsPaidAmt,
        freightPaidAmount: freightPaidAmt,
        platformFreightSubsidy: platformFreightSubsidyAmt,
        refundAmount: refundAmt,
        netAmount: net,
        mainOrderCount: mainCnt,
        subOrderCount: subCnt,
        verifyCount: verifyCnt,
        payUserCount: payUserCnt,
        newCustomerCount: newCnt,
        oldCustomerCount: oldCnt,
        aov: aov,
        paidIncludesFreightNote:
          '营业额（支付金额，含实付运费）＝商品实付＋运费实付，只统计顾客实际支付。包邮：运费实付为 0。平台运费补贴单列，不计入支付金额。清分最小单位为 SKU：门店佣金按商品实付计，运费不参与分佣。'
      },
      /* tips.* 仅门店经营者可读文案；内部术语见 docs/经营报表体系 */
      tips: {
        net:
          '净成交额＝顾客支付金额（含实付运费）减去退款金额。退款按退款成功时间计入，可能包含以前下的单在本期退款。净成交额不是门店实际到账收入。',
        commission:
          '顶部橙卡看本店佣金与会员。\n· 待结佣金：已产生、尚未入账成功的佣金。\n· 本月／年度佣金：按佣金入账成功时间统计，已记入门店收益，不等于已提现到银行卡。\n· 会员数：本店会员人数。\n与下方经营数据不是同一笔钱，请勿相加。',
        overview:
          '本区从营业额角度看本店经营。\n· 按顾客支付成功时间统计。\n· 点卡片右上角可切换时间，只影响经营概览与经营趋势，不影响上方佣金。\n· 佣金与经营是两套数字，请勿相加当作「收入」。',
        'overview-metrics':
          '营业额＝门店实际营业额，即顾客在本店实际付了多少钱。点营业额可按已开通来源查看。\n订单数＝支付成功的主订单数。\n核销数＝到店自提且已核销的笔数。\n客单价＝营业额÷主订单数。',
        credited: '本月／年度佣金按佣金入账成功时间统计，表示已记入门店收益，不等于已提现到银行卡。',
        withdrawable: '当前可提现余额来自门店钱包，不随历史日期筛选变化。',
        members: '会员数：本店会员人数。',
        customers:
          '下单人数：在本店下过单的顾客（同一人只算一次）。\n新客＝第一次在本店支付成功的顾客。\n老客＝非新客。\n新客＋老客＝下单人数。',
        repurchase:
          '复购人数：所选时段内在本店支付成功的顾客中，历史上在本店累计支付成功达到2次及以上的人数。\n复购率＝复购人数÷该时段下单人数。',
        lost:
          '流失会员：连续30天未在本店支付成功的会员。\n再次在本店支付成功后，不再计为流失。',
        rbt:
          'RBT 表示本店联营采购的付款账单进度。\n· 约定付款：约定需要付清的总额。\n· 累计实付：已成功按日扣款的合计。\n· 剩余应付＝约定付款−累计实付。\n· 状态「付款中」＝仍在按日付款。\n· 预计回本周期：按本店投入与付款进度估算的天数；暂无法估算时显示「不适用」。\n本卡为当前进度，不随上方时间筛选变化。点指标可查看付款账单。',
        pickupMerchant: '到店自提统一由本店核销。',
        aftersale:
          '售后按履约方式拆开看：\n· 快递到家：顾客收货后的退款／售后。\n· 到店自提：顾客到店核销相关的售后，与本店关联更强，请优先关注商品与核销问题。\n售后金额按退款成功时间统计，随本卡片右上角时间变化。',
        'pickup-sales':
          '自提销售只统计到店自提订单：\n· 自提订单＝支付成功的自提单数。\n· 已核销＝到店完成核销的笔数。\n· 待核销＝已支付尚未核销。\n· 下方排行按自提商品成交额排序，便于备货。'
      }
    };
  }

  /** 验收开关：paying 付款中｜none 无RBT｜done 已完成付款；URL ?rbt=0|none|done|paying 可覆盖 */
  var RBT_DEMO_KEY = 'sa_biz_rbt_demo_v1';

  function readRbtDemoMode() {
    var q = typeof location !== 'undefined' ? location.search || '' : '';
    if (/(?:\?|&)rbt=(?:0|none)(?:&|$)/.test(q)) return 'none';
    if (/(?:\?|&)rbt=(?:done|finished|2)(?:&|$)/.test(q)) return 'done';
    if (/(?:\?|&)rbt=(?:1|paying|on)(?:&|$)/.test(q)) return 'paying';
    try {
      var v = localStorage.getItem(RBT_DEMO_KEY);
      if (v === 'none' || v === 'done' || v === 'paying') return v;
    } catch (e) { /* ignore */ }
    return 'paying';
  }

  function writeRbtDemoMode(mode) {
    var next = mode === 'none' || mode === 'done' ? mode : 'paying';
    try {
      localStorage.setItem(RBT_DEMO_KEY, next);
    } catch (e) { /* ignore */ }
    return next;
  }

  function buildStoreRbt() {
    var mode = readRbtDemoMode();
    if (mode === 'none') {
      return { hasRbt: false, demoMode: 'none' };
    }
    if (mode === 'done') {
      return {
        hasRbt: true,
        demoMode: 'done',
        agreedPay: 48000,
        actualPay: 48000,
        remainPay: 0,
        status: '已完成付款',
        paybackCycle: '已回本',
        dailyRows: [
          { d: '10-28', m: '日结付款', a: 980 },
          { d: '10-20', m: '日结付款', a: 1200 },
          { d: '10-12', m: '日结付款', a: 1560 },
          { d: '09-30', m: '日结付款', a: 2100 },
          { d: '09-15', m: '结清尾款', a: 42160 }
        ]
      };
    }
    return {
      hasRbt: true,
      demoMode: 'paying',
      agreedPay: 48000,
      /* 累计实付／剩余应付可带小数：千分位逗号 + 小数点 */
      actualPay: 12360.5,
      remainPay: 35639.5,
      status: '付款中',
      paybackCycle: '约 86 天',
      dailyRows: [
        { d: '11-16', m: '日结付款', a: 420.5 },
        { d: '11-15', m: '日结付款', a: 386.0 },
        { d: '11-14', m: '日结付款', a: 512.3 },
        { d: '11-13', m: '日结付款', a: 298.0 },
        { d: '11-12', m: '日结付款', a: 176.2 }
      ]
    };
  }

  /** 侧边「RBT验收开关」；业务态锁死时仍可切换 */
  function mountRbtDemoPanel(opts) {
    if (typeof document === 'undefined') return;
    if (document.getElementById('saRbtDemoPanel')) return;
    var o = opts || {};
    var panel = document.createElement('div');
    panel.id = 'saRbtDemoPanel';
    panel.className = 'sa-lp-demo sa-lp-demo--rbt';
    panel.setAttribute('aria-label', 'RBT验收开关');
    var cur = readRbtDemoMode();
    panel.innerHTML =
      '<div class="sa-lp-demo__title">RBT验收开关</div>' +
      '<label class="sa-lp-demo__row">RBT状态' +
      '<select id="saRbtDemoMode" aria-label="RBT状态">' +
      '<option value="paying">付款中</option>' +
      '<option value="none">无RBT模块</option>' +
      '<option value="done">已完成付款</option>' +
      '</select></label>' +
      '<button type="button" class="sa-lp-demo__apply" id="saRbtDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var sel = document.getElementById('saRbtDemoMode');
    if (sel) sel.value = cur;
    var apply = document.getElementById('saRbtDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var next = (sel && sel.value) || 'paying';
        writeRbtDemoMode(next);
        if (typeof o.onApply === 'function') {
          o.onApply(next);
          return;
        }
        /* 无 RBT 时若在账单页，回总览验收隐藏卡 */
        if (next === 'none' && /biz-rbt\.html/i.test(location.pathname || '')) {
          location.href = 'biz-center.html';
          return;
        }
        location.reload();
      });
    }
  }

  function buildTrend(range, custom, metric) {
    var bounds = resolveRange(range, custom);
    var prev = compareBounds(bounds);
    var points = [];
    var comparePoints = [];
    var m = metric || 'net';

    function valueForBucket(rowsPaid, rowsRefund, rowsCredit) {
      if (m === 'orders') {
        return uniqueMainCount(rowsPaid);
      }
      if (m === 'newCustomers') {
        var seen = {};
        var n = 0;
        rowsPaid.forEach(function (r) {
          if (!r.customerId || seen[r.customerId]) return;
          seen[r.customerId] = true;
          if (r.isNewAtStore) n += 1;
        });
        return n;
      }
      if (m === 'verify') {
        return rowsPaid.filter(function (r) {
          return r.fulfillMode === '自提' && r.settleStatus === '已结算';
        }).length;
      }
      if (m === 'credited') {
        return round2(
          rowsCredit.reduce(function (s, r) {
            return s + creditedCommission(r);
          }, 0)
        );
      }
      /* 默认营业额：支付金额（设计稿「营业额」） */
      if (m === 'paid' || m === 'turnover') {
        return round2(
          rowsPaid.reduce(function (s, r) {
            return s + (Number(r.paid) || 0);
          }, 0)
        );
      }
      var paid = rowsPaid.reduce(function (s, r) {
        return s + (Number(r.paid) || 0);
      }, 0);
      var refund = rowsRefund.reduce(function (s, r) {
        return s + (Number(r.refund) || 0);
      }, 0);
      return round2(paid - refund);
    }

    if (bounds.isSingleDay || range === 'today' || range === 'yesterday') {
      var nowHour = range === 'today' ? new Date().getHours() : 23;
      for (var h = 0; h <= Math.min(23, nowHour); h++) {
        var paidH = SUB_ORDERS.filter(function (r) {
          return inTimeRange(r.payTime, bounds) && hourOf(r.payTime) === h;
        });
        var refundH = SUB_ORDERS.filter(function (r) {
          return Number(r.refund) > 0 && inTimeRange(r.refundTime, bounds) && hourOf(r.refundTime) === h;
        });
        var creditH = SUB_ORDERS.filter(function (r) {
          return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, bounds) && hourOf(r.creditTime || r.settleTime) === h;
        });
        points.push({ label: pad2(h) + ':00', value: valueForBucket(paidH, refundH, creditH) });

        var paidP = SUB_ORDERS.filter(function (r) {
          return inTimeRange(r.payTime, prev) && hourOf(r.payTime) === h;
        });
        var refundP = SUB_ORDERS.filter(function (r) {
          return Number(r.refund) > 0 && inTimeRange(r.refundTime, prev) && hourOf(r.refundTime) === h;
        });
        var creditP = SUB_ORDERS.filter(function (r) {
          return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, prev) && hourOf(r.creditTime || r.settleTime) === h;
        });
        comparePoints.push({ label: pad2(h) + ':00', value: valueForBucket(paidP, refundP, creditP) });
      }
    } else {
      var cursor = bounds.startMs;
      while (cursor < bounds.endMs) {
        var d = new Date(cursor);
        var key = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
        var dayBounds = { startMs: cursor, endMs: cursor + 86400000 };
        var paidD = SUB_ORDERS.filter(function (r) {
          return inTimeRange(r.payTime, dayBounds);
        });
        var refundD = SUB_ORDERS.filter(function (r) {
          return Number(r.refund) > 0 && inTimeRange(r.refundTime, dayBounds);
        });
        var creditD = SUB_ORDERS.filter(function (r) {
          return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, dayBounds);
        });
        points.push({
          label: pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()),
          key: key,
          value: valueForBucket(paidD, refundD, creditD)
        });
        cursor += 86400000;
      }
      cursor = prev.startMs;
      while (cursor < prev.endMs) {
        var d2 = new Date(cursor);
        var dayBounds2 = { startMs: cursor, endMs: cursor + 86400000 };
        var paidD2 = SUB_ORDERS.filter(function (r) {
          return inTimeRange(r.payTime, dayBounds2);
        });
        var refundD2 = SUB_ORDERS.filter(function (r) {
          return Number(r.refund) > 0 && inTimeRange(r.refundTime, dayBounds2);
        });
        var creditD2 = SUB_ORDERS.filter(function (r) {
          return r.settleStatus === '已结算' && inTimeRange(r.creditTime || r.settleTime, dayBounds2);
        });
        comparePoints.push({
          label: pad2(d2.getMonth() + 1) + '-' + pad2(d2.getDate()),
          value: valueForBucket(paidD2, refundD2, creditD2)
        });
        cursor += 86400000;
      }
    }

    var curTotal = round2(
      points.reduce(function (s, p) {
        return s + (Number(p.value) || 0);
      }, 0)
    );
    var prevTotal = round2(
      comparePoints.reduce(function (s, p) {
        return s + (Number(p.value) || 0);
      }, 0)
    );
    var comparable = comparePoints.length > 0 && !(prevTotal === 0 && comparePoints.every(function (p) { return !p.value; }));
    var deltaPct = null;
    if (comparable && prevTotal !== 0) {
      deltaPct = round2(((curTotal - prevTotal) / Math.abs(prevTotal)) * 100);
    } else if (comparable && prevTotal === 0 && curTotal === 0) {
      comparable = false;
    } else if (comparable && prevTotal === 0) {
      comparable = false;
    }

    return {
      metric: m,
      points: points,
      comparePoints: comparePoints,
      currentTotal: curTotal,
      previousTotal: prevTotal,
      comparable: comparable,
      deltaPct: deltaPct,
      compareHint: comparable ? null : '暂无可比数据'
    };
  }

  function buildComposition(range, custom, dim) {
    var bounds = resolveRange(range, custom);
    var rows = sumPaidInRange(bounds);
    var keyField = dim === 'channel' ? 'channel' : dim === 'fulfill' ? 'fulfillMode' : 'bizType';
    var map = {};
    rows.forEach(function (r) {
      var k = r[keyField] || '其他';
      if (!map[k]) map[k] = { name: k, paid: 0, orders: 0, mains: {}, commission: 0 };
      map[k].paid = round2(map[k].paid + Number(r.paid));
      map[k].orders += 1;
      map[k].mains[r.mainOrderId] = true;
      map[k].commission = round2(map[k].commission + estimatedCommission(r));
    });
    var list = Object.keys(map).map(function (k) {
      var item = map[k];
      return {
        name: item.name,
        paid: item.paid,
        subOrderCount: item.orders,
        mainOrderCount: Object.keys(item.mains).length,
        commission: item.commission
      };
    });
    var totalPaid = list.reduce(function (s, x) {
      return s + x.paid;
    }, 0);
    list.forEach(function (x) {
      x.share = totalPaid > 0 ? round2((x.paid / totalPaid) * 100) : 0;
    });
    list.sort(function (a, b) {
      return b.paid - a.paid;
    });
    return { dim: dim || 'bizType', totalPaid: round2(totalPaid), items: list, label: bounds.label };
  }

  /**
   * 营业额下级：按业务线拆分本店支付成功金额。
   * 已有：直播、商城；未来：POS（堂食／外卖平台／团购核销平台）。
   */
  function buildBizLineRevenue(range, custom) {
    var bounds = resolveRange(range, custom);
    var comp = buildComposition(range, custom, 'channel');
    var byName = {};
    (comp.items || []).forEach(function (x) {
      byName[x.name] = x;
    });

    function activeLine(id, name) {
      var item = byName[name];
      return {
        id: id,
        name: name,
        status: 'active',
        paid: item ? item.paid : 0,
        mainOrderCount: item ? item.mainOrderCount : 0,
        share: item ? item.share : 0,
        children: null
      };
    }

    var live = activeLine('live', '直播');
    var mall = activeLine('mall', '商城');
    var activePaid = round2(live.paid + mall.paid);
    if (activePaid > 0) {
      live.share = round2((live.paid / activePaid) * 100);
      mall.share = round2((mall.paid / activePaid) * 100);
    }

    var pos = {
      id: 'pos',
      name: 'POS',
      status: 'coming',
      paid: null,
      mainOrderCount: null,
      share: null,
      tip: '即将开通，暂未获取',
      children: [
        {
          id: 'pos-dine',
          name: '堂食',
          status: 'coming',
          paid: null,
          platforms: []
        },
        {
          id: 'pos-takeout',
          name: '外卖',
          status: 'coming',
          paid: null,
          platforms: ['京东', '美团', '淘闪']
        },
        {
          id: 'pos-group',
          name: '团购核销',
          status: 'coming',
          paid: null,
          platforms: ['大众', '美团', '抖音']
        }
      ]
    };

    return {
      range: range,
      label: bounds.label,
      totalPaid: activePaid,
      note: '门店实际营业额：顾客在本店实际付了多少钱，按已开通来源分开看。',
      lines: [live, mall, pos]
    };
  }

  function buildGoodsRank(range, custom, sortBy) {
    var bounds = resolveRange(range, custom);
    var paidRows = sumPaidInRange(bounds);
    var refundRows = sumRefundInRange(bounds);
    var map = {};

    function ensure(name, img) {
      if (!map[name]) {
        map[name] = { name: name, img: img || IMG.p1, qty: 0, goodsPaid: 0, goodsRefund: 0, commission: 0 };
      }
      return map[name];
    }

    paidRows.forEach(function (r) {
      (r.goodsItems || []).forEach(function (g) {
        var item = ensure(g.name, g.img);
        item.qty += Number(g.qty) || 0;
        item.goodsPaid = round2(item.goodsPaid + (Number(g.paid) || 0));
        item.commission = round2(item.commission + (Number(g.commission) || 0));
      });
    });
    refundRows.forEach(function (r) {
      (r.refundItems || []).forEach(function (g) {
        var item = ensure(g.name, g.img);
        item.goodsRefund = round2(item.goodsRefund + (Number(g.refund) || 0));
      });
      if (!(r.refundItems && r.refundItems.length) && Number(r.refund) > 0) {
        var g0 = (r.goodsItems || [])[0];
        if (g0) {
          var item = ensure(g0.name, g0.img);
          item.goodsRefund = round2(item.goodsRefund + (Number(r.refund) || 0));
        }
      }
    });

    var list = Object.keys(map).map(function (k) {
      var x = map[k];
      return {
        name: x.name,
        img: x.img,
        qty: x.qty,
        netAmount: round2(x.goodsPaid - x.goodsRefund),
        commission: x.commission
      };
    });
    var sort = sortBy || 'qty';
    list.sort(function (a, b) {
      if (sort === 'net') return b.netAmount - a.netAmount;
      if (sort === 'commission') return b.commission - a.commission;
      return b.qty - a.qty;
    });
    return { sortBy: sort, items: list, note: '清分按 SKU：商品金额与佣金均不含运费，佣金按各 SKU 商品实付归属' };
  }

  function buildCustomers(range, custom) {
    var ov = buildOverview(range || '30d', custom);
    var total = ov.trade.payUserCount;
    var prev = compareBounds(ov.bounds);
    var prevStart = new Date(prev.startMs);
    var prevEnd = new Date(prev.endMs - 86400000);
    var prevOv = buildOverview('custom', {
      start:
        prevStart.getFullYear() +
        '-' +
        pad2(prevStart.getMonth() + 1) +
        '-' +
        pad2(prevStart.getDate()),
      end:
        prevEnd.getFullYear() + '-' + pad2(prevEnd.getMonth() + 1) + '-' + pad2(prevEnd.getDate())
    });
    /* 复购：本期老客中，历史在本店支付≥2次的顾客（演示口径） */
    var payFreq = {};
    SUB_ORDERS.forEach(function (r) {
      if (!r.customerId) return;
      payFreq[r.customerId] = (payFreq[r.customerId] || 0) + 1;
    });
    var repurchaseUsers = 0;
    var paidInRange = sumPaidInRange(ov.bounds);
    var seenCust = {};
    paidInRange.forEach(function (r) {
      if (!r.customerId || seenCust[r.customerId]) return;
      seenCust[r.customerId] = true;
      if (payFreq[r.customerId] >= 2) repurchaseUsers += 1;
    });
    var repurchaseRate = total ? round2((repurchaseUsers / total) * 100) : 0;
    var lostMembers = Math.max(
      0,
      ((prevOv.trade && prevOv.trade.oldCustomerCount) || 0) - (ov.trade.oldCustomerCount || 0)
    );
    if (lostMembers > 20) lostMembers = 8;
    function dlt(cur, prevV) {
      var c = Number(cur) || 0;
      var p = Number(prevV) || 0;
      var abs = round2(c - p);
      var pct = p === 0 ? (c === 0 ? 0 : 100) : round2(((c - p) / Math.abs(p)) * 100);
      return { abs: abs, pct: pct, up: abs > 0, flat: abs === 0 };
    }
    return {
      payUserCount: total,
      newCustomerCount: ov.trade.newCustomerCount,
      oldCustomerCount: ov.trade.oldCustomerCount,
      newShare: total ? round2((ov.trade.newCustomerCount / total) * 100) : 0,
      oldShare: total ? round2((ov.trade.oldCustomerCount / total) * 100) : 0,
      newDelta: dlt(ov.trade.newCustomerCount, prevOv.trade.newCustomerCount),
      oldDelta: dlt(ov.trade.oldCustomerCount, prevOv.trade.oldCustomerCount),
      repurchaseRate: repurchaseRate,
      repurchaseUsers: repurchaseUsers,
      repurchaseRateDelta: dlt(repurchaseRate, 26.6),
      repurchaseUsersDelta: dlt(repurchaseUsers, Math.max(0, repurchaseUsers - 60)),
      lostMembers: lostMembers || 8,
      lostMembersDelta: { abs: -1, pct: -12, up: false },
      compareLabel: compareLabelForRange(range || '30d'),
      note:
        '支付人数仅统计本店子订单顾客去重。新客＝首次在当前门店支付成功（他店购买不影响）；新客＋老客＝支付人数。复购人数＝本期支付顾客中历史支付≥2次者。'
    };
  }

  function buildRestock(range, custom) {
    var bounds = resolveRange(range, custom);
    var paidRows = RESTOCK_ORDERS.filter(function (r) {
      return inTimeRange(r.payTime, bounds);
    });
    var refundRows = RESTOCK_ORDERS.filter(function (r) {
      return (Number(r.refundGoods) > 0 || Number(r.refundFreight) > 0) && inTimeRange(r.refundTime, bounds);
    });
    var paid = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.paid) || 0);
      }, 0)
    );
    var goodsPaid = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.goodsPaid) || 0);
      }, 0)
    );
    var freightPaid = round2(
      paidRows.reduce(function (s, r) {
        return s + (Number(r.freightPaid) || 0);
      }, 0)
    );
    var refundGoods = round2(
      refundRows.reduce(function (s, r) {
        return s + (Number(r.refundGoods) || 0);
      }, 0)
    );
    var refundFreight = round2(
      refundRows.reduce(function (s, r) {
        return s + (Number(r.refundFreight) || 0);
      }, 0)
    );
    var mainCnt = uniqueMainCount(paidRows);
    var subCnt = paidRows.reduce(function (s, r) {
      return s + (r.subOrderIds ? r.subOrderIds.length : 1);
    }, 0);

    var goodsMap = {};
    paidRows.forEach(function (r) {
      (r.goodsItems || []).forEach(function (g) {
        if (!goodsMap[g.name]) goodsMap[g.name] = { name: g.name, img: g.img, qty: 0, paid: 0 };
        goodsMap[g.name].qty += Number(g.qty) || 0;
        goodsMap[g.name].paid = round2(goodsMap[g.name].paid + (Number(g.paid) || 0));
      });
    });
    var goodsRank = Object.keys(goodsMap)
      .map(function (k) {
        return goodsMap[k];
      })
      .sort(function (a, b) {
        return b.paid - a.paid;
      });

    var trend = [];
    if (bounds.isSingleDay || range === 'today' || range === 'yesterday') {
      var nowHour = range === 'today' ? new Date().getHours() : 23;
      for (var h = 0; h <= Math.min(23, nowHour); h++) {
        var amt = paidRows
          .filter(function (r) {
            return hourOf(r.payTime) === h;
          })
          .reduce(function (s, r) {
            return s + (Number(r.paid) || 0);
          }, 0);
        trend.push({ label: pad2(h) + ':00', value: round2(amt) });
      }
    } else {
      var cursor = bounds.startMs;
      while (cursor < bounds.endMs) {
        var d = new Date(cursor);
        var dayBounds = { startMs: cursor, endMs: cursor + 86400000 };
        var amt2 = RESTOCK_ORDERS.filter(function (r) {
          return inTimeRange(r.payTime, dayBounds);
        }).reduce(function (s, r) {
          return s + (Number(r.paid) || 0);
        }, 0);
        trend.push({
          label: pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()),
          value: round2(amt2)
        });
        cursor += 86400000;
      }
    }

    var refundAmount = round2(refundGoods + refundFreight);
    /* 实际支出＝本期进货支出−本期退款（店长一眼看净支出） */
    var netPaid = round2(paid - refundAmount);
    return {
      bounds: bounds,
      updatedAt: UPDATED_AT,
      paidAmount: paid,
      netPaid: netPaid,
      goodsPaid: goodsPaid,
      freightPaid: freightPaid,
      refundGoods: refundGoods,
      refundFreight: refundFreight,
      refundAmount: refundAmount,
      mainOrderCount: mainCnt,
      subOrderCount: subCnt,
      trend: trend,
      goodsRank: goodsRank,
      orders: paidRows.concat(
        refundRows.filter(function (r) {
          return paidRows.indexOf(r) < 0;
        })
      ),
      note: '实际支出＝进货支出−本期退款。进货与退款按各自成功时间归期，可能跨期。'
    };
  }

  function filterSubOrders(filters) {
    filters = filters || {};
    var bounds = resolveRange(filters.range || '30d', filters.custom);
    /* 兼容佣金明细：30d ≈ 近1个月展示 */
    if (filters.range === '30d') {
      var today = parseDay(DEMO_TODAY);
      bounds = {
        startMs: today.getTime() - 29 * 86400000,
        endMs: today.getTime() + 86400000,
        startKey: shiftDateKey(DEMO_TODAY, -29),
        endKey: DEMO_TODAY,
        label: '近1个月',
        range: '30d',
        isSingleDay: false
      };
    }
    var dim = filters.dim || 'pay';
    return SUB_ORDERS.filter(function (r) {
      var timeStr =
        dim === 'credit'
          ? r.creditTime && r.creditTime !== '-'
            ? r.creditTime
            : ''
          : dim === 'order'
            ? r.orderTime || r.payTime
            : r.payTime;
      if (dim === 'credit' && r.settleStatus !== '已结算') return false;
      if (!inTimeRange(timeStr, bounds)) return false;
      if (filters.settleStatus && filters.settleStatus !== 'all') {
        if (String(r.settleStatus) !== String(filters.settleStatus)) return false;
      }
      var kw = String(filters.keyword || '').trim().toLowerCase();
      if (kw) {
        var hay = [r.id, r.mainOrderId, r.phone, r.nick, r.supplierName, (r.goodsItems || []).map(function (g) { return g.name; }).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(kw) < 0) return false;
      }
      return true;
    }).map(function (r) {
      return Object.assign({}, r, {
        estimatedCommission: estimatedCommission(r),
        creditedCommission: creditedCommission(r)
      });
    });
  }

  /** 履约态（列表筛选用，与结算五态分列） */
  function fulfillStatusOf(r) {
    if (r.settleStatus === '已取消') return '已关闭';
    if (r.settleStatus === '已结算') return '已完成';
    if (r.fulfillMode === '自提') {
      return r.settleStatus === '结算中' ? '待自提' : '待提货';
    }
    if (r.settleStatus === '结算中' || r.settleStatus === '结算失败') return '待收货';
    return '待发货';
  }

  /** 映射为经营中心列表兼容结构，便于佣金明细复用 */
  function toCommissionListItem(r) {
    var goodsCount = (r.goodsItems || []).reduce(function (s, g) {
      return s + (Number(g.qty) || 0);
    }, 0);
    var firstGoods = (r.goodsItems && r.goodsItems[0] && r.goodsItems[0].name) || '';
    var fulfillStatus = fulfillStatusOf(r);
    return {
      id: r.id,
      mainOrderId: r.mainOrderId,
      date: dateKeyOf(r.orderTime || r.payTime),
      dayKey: dateKeyOf(r.orderTime || r.payTime),
      nick: r.nick,
      contact: r.nick,
      phone: r.phone,
      verifyCode: '',
      shipMode: r.fulfillMode,
      channel: r.channel,
      bizType: r.bizType,
      merchantSubject: r.merchantSubject,
      supplierName: r.supplierName,
      goods: firstGoods
        ? firstGoods.replace(/\s+/g, '') + (goodsCount > 0 ? ' 共' + goodsCount + '件' : '')
        : (r.goodsItems || [])
            .map(function (g) {
              return g.name + ' * ' + g.qty;
            })
            .join('；'),
      goodsCount: goodsCount,
      goodsThumb: (r.goodsItems && r.goodsItems[0] && r.goodsItems[0].img) || '',
      avatar: r.avatar || '',
      paid: r.paid,
      goodsPaid: r.goodsPaid,
      freightPaid: r.freightPaid,
      platformFreightSubsidy: r.platformFreightSubsidy || 0,
      freightTag: r.freightTag || '',
      refund: r.refund || 0,
      storeCommissionRate: r.storeCommissionRate,
      hasStoreClearing: r.hasStoreClearing,
      commission: r.commission,
      commissionLocked: r.commissionLocked,
      settleStatus: r.settleStatus,
      settleTime: r.settleTime,
      creditTime: r.creditTime,
      creditedAmount: r.creditedAmount,
      commissionRefund: r.commissionRefund || 0,
      commissionRefundStatus: r.commissionRefundStatus || '',
      commissionRefundTime: r.commissionRefundTime || '',
      relatedCommissionId: r.relatedCommissionId || '',
      payTime: r.payTime,
      orderTime: r.orderTime,
      deliveryTime: r.fulfillMode === '自提' ? '-' : '-',
      refundTime: r.refundTime || '',
      finishTime: r.settleStatus === '已结算' ? r.creditTime : '-',
      remark: r.remark || '',
      fulfillStatus: fulfillStatus,
      status:
        fulfillStatus === '已完成'
          ? 'done'
          : fulfillStatus === '已关闭'
            ? 'failed'
            : fulfillStatus === '待发货'
              ? 'pending_ship'
              : 'pending_pickup',
      statusText: fulfillStatus,
      goodsItems: r.goodsItems || [],
      refundItems: r.refundItems || [],
      packages: r.packages || 0
    };
  }

  /**
   * BD 关联门店经营总览（演示）
   * 预警白话给 BD；AL 编号仅内部注释（Q-AL-01～08，一期不做 06/07）
   */
  var BD_STORES = [
    {
      id: 'S-XX',
      name: '西溪社区店',
      area: '江北',
      paid7d: 18620,
      pendingSettle: 1280.5,
      rbtStatus: '付款中',
      alerts: []
    },
    {
      id: 'S-BJ',
      name: '滨江鲜选店',
      area: '滨江',
      paid7d: 6420,
      pendingSettle: 860,
      rbtStatus: '付款中',
      /* AL-01 GMV 下降；AL-08 售后集中（须写明履约类型） */
      alerts: [
        {
          code: 'AL-01',
          level: 'warn',
          title: '营业额下降',
          tip: '近两周营业额较前两周下降超过 20%，建议协助门店盘点引流与主推品。'
        },
        {
          code: 'AL-08',
          level: 'warn',
          title: '自提售后偏多',
          tip: '近 7 天到店自提售后笔数／金额偏高（相对快递到家），建议协助门店核对到店商品与核销。'
        }
      ]
    },
    {
      id: 'S-CN',
      name: '城南生鲜店',
      area: '城南',
      paid7d: 0,
      pendingSettle: 120,
      rbtStatus: '无',
      idleDays: 8,
      /* AL-02 连续无成交：页内须写出连续天数 */
      alerts: [
        {
          code: 'AL-02',
          level: 'danger',
          title: '连续 8 天无成交',
          tip: '已连续 8 天无顾客支付成功订单，请尽快上门了解是否停业或断货。',
          idleDays: 8
        }
      ]
    },
    {
      id: 'S-HP',
      name: '湖畔优选店',
      area: '西湖',
      paid7d: 11280,
      pendingSettle: 2460,
      rbtStatus: '付款中',
      /* 日结扣款金额不固定，预警看回本周期是否明显拉长（演示阈值：较约定延长 ≥30 天） */
      alerts: [
        {
          code: 'AL-03',
          level: 'warn',
          title: '预计回本周期延长超 30 天',
          tip: '按近期日均实付估算，预计回本约 86 天，较约定进度延长超过 30 天，建议协助门店提升联营销售与日结实付。'
        }
      ]
    },
    {
      id: 'S-DC',
      name: '东城交接店',
      area: '东城',
      paid7d: 3200,
      pendingSettle: 0,
      rbtStatus: '无',
      scope: 'history',
      alerts: []
    }
  ];

  function getBdStoreById(storeId) {
    var id = String(storeId || '').trim();
    var aliases = {
      'STORE-YY': 'S-XX',
      'STORE-CN': 'S-CN',
      'STORE-HP': 'S-HP',
      'STORE-BJ': 'S-BJ',
      'STORE-DC': 'S-DC'
    };
    var want = aliases[id] || id;
    for (var i = 0; i < BD_STORES.length; i++) {
      if (BD_STORES[i].id === want) return BD_STORES[i];
    }
    /* 禁止找不到时静默回退默认店 */
    return null;
  }

  /**
   * 售后情况：按履约方式拆「快递到家 / 到店自提」
   * 自提售后与门店关联更强，页内单独成列便于门店／BD 关注
   */
  function buildAftersaleSummary(range, custom) {
    var bounds = resolveRange(range, custom);
    var rows = SUB_ORDERS.filter(function (r) {
      return Number(r.refund) > 0 && inTimeRange(r.refundTime || r.payTime, bounds);
    });
    var express = { count: 0, amount: 0 };
    var pickup = { count: 0, amount: 0 };
    rows.forEach(function (r) {
      var amt = round2(Number(r.refund) || 0);
      if (r.fulfillMode === '自提') {
        pickup.count += 1;
        pickup.amount = round2(pickup.amount + amt);
      } else {
        express.count += 1;
        express.amount = round2(express.amount + amt);
      }
    });
    var paidRows = sumPaidInRange(bounds);
    var paidAmt = paidRows.reduce(function (s, r) {
      return s + (Number(r.paid) || 0);
    }, 0);
    var refundAmt = round2(express.amount + pickup.amount);
    return {
      label: bounds.label,
      totalCount: rows.length,
      totalAmount: refundAmt,
      expressCount: express.count,
      expressAmount: express.amount,
      pickupCount: pickup.count,
      pickupAmount: pickup.amount,
      refundRate: paidAmt > 0 ? round2((refundAmt / paidAmt) * 100) : 0
    };
  }

  /**
   * 商品销售（自提／核销）：到店自提成交与已核销
   */
  function buildPickupSales(range, custom) {
    var bounds = resolveRange(range, custom);
    var pickupPaid = SUB_ORDERS.filter(function (r) {
      return r.fulfillMode === '自提' && inTimeRange(r.payTime, bounds);
    });
    var verified = pickupPaid.filter(function (r) {
      return r.settleStatus === '已结算';
    });
    var paidAmt = round2(
      pickupPaid.reduce(function (s, r) {
        return s + (Number(r.paid) || 0);
      }, 0)
    );
    var goodsMap = {};
    pickupPaid.forEach(function (r) {
      var items = r.goodsItems || [];
      if (!items.length) {
        items = [{ name: '自提商品', qty: 1, paid: Number(r.paid) || 0 }];
      }
      items.forEach(function (g) {
        var name = g.name || '商品';
        if (!goodsMap[name]) goodsMap[name] = { name: name, qty: 0, paid: 0, verify: 0 };
        goodsMap[name].qty += Number(g.qty) || 1;
        goodsMap[name].paid = round2(goodsMap[name].paid + (Number(g.paid) || 0));
        if (r.settleStatus === '已结算') goodsMap[name].verify += Number(g.qty) || 1;
      });
    });
    var topGoods = Object.keys(goodsMap)
      .map(function (k) {
        return goodsMap[k];
      })
      .sort(function (a, b) {
        return b.paid - a.paid;
      })
      .slice(0, 5);
    return {
      label: bounds.label,
      pickupOrderCount: pickupPaid.length,
      verifyCount: verified.length,
      pickupPaidAmount: paidAmt,
      pendingVerify: Math.max(0, pickupPaid.length - verified.length),
      topGoods: topGoods
    };
  }

  function buildBdPortfolio(filter) {
    var f = filter || 'all';
    var list = BD_STORES.map(function (s) {
      return {
        id: s.id,
        name: s.name,
        area: s.area,
        paid7d: s.paid7d,
        pendingSettle: s.pendingSettle,
        rbtStatus: s.rbtStatus,
        idleDays: s.idleDays || 0,
        alertCount: (s.alerts || []).length,
        alerts: (s.alerts || []).slice(),
        hasAlert: !!(s.alerts && s.alerts.length)
      };
    });
    if (f === 'alert') {
      list = list.filter(function (s) {
        return s.hasAlert;
      });
    }
    var alertStores = BD_STORES.filter(function (s) {
      return s.alerts && s.alerts.length;
    }).length;
    var alertItems = [];
    BD_STORES.forEach(function (s) {
      (s.alerts || []).forEach(function (a) {
        alertItems.push({
          storeId: s.id,
          storeName: s.name,
          code: a.code,
          level: a.level,
          title: a.title,
          tip: a.tip
        });
      });
    });
    return {
      storeCount: BD_STORES.length,
      alertStoreCount: alertStores,
      alertCount: alertItems.length,
      stores: list,
      alerts: alertItems,
      asOf: UPDATED_AT
    };
  }

  global.StoreAppBizReportData = {
    STORE: STORE,
    BD_STORES: BD_STORES,
    getBdStoreById: getBdStoreById,
    buildBdPortfolio: buildBdPortfolio,
    DEMO_TODAY: DEMO_TODAY,
    UPDATED_AT: UPDATED_AT,
    listSubOrders: function () {
      return SUB_ORDERS.slice();
    },
    listRestockOrders: function () {
      return RESTOCK_ORDERS.slice();
    },
    listCommissionOrders: function () {
      return SUB_ORDERS.map(toCommissionListItem);
    },
    money: money,
    round2: round2,
    estimatedCommission: estimatedCommission,
    creditedCommission: creditedCommission,
    resolveRange: resolveRange,
    compareLabelForRange: compareLabelForRange,
    buildOverview: buildOverview,
    buildTrend: buildTrend,
    buildComposition: buildComposition,
    buildBizLineRevenue: buildBizLineRevenue,
    buildGoodsRank: buildGoodsRank,
    buildCustomers: buildCustomers,
    buildAftersaleSummary: buildAftersaleSummary,
    buildPickupSales: buildPickupSales,
    buildRestock: buildRestock,
    buildStoreRbt: buildStoreRbt,
    readRbtDemoMode: readRbtDemoMode,
    writeRbtDemoMode: writeRbtDemoMode,
    mountRbtDemoPanel: mountRbtDemoPanel,
    RBT_DEMO_KEY: RBT_DEMO_KEY,
    filterSubOrders: filterSubOrders,
    /**
     * 知识库 + 产品确认口径（知页结算文档 / 门店钱包 PRD / 本轮确认）
     */
    KB_COMMISSION_NOTES: {
      commissionBase:
        '清分最小单位＝SKU（已确认）。预估/所得佣金＝max(ΣSKU商品实付−商品退款,0)×门店比例；承运商运费不参与分佣；平台运费补贴不进支付金额。',
      storeSettleStatuses:
        '门店端仅展示与门店佣金相关的五态：待结算、结算中、已结算、结算失败、已取消。「代收待转」为平台内部资金处理状态，仅 PC 异常订单展示，门店端不单独展示。代收待转≠结算失败，不可映射为失败；门店端按该笔门店佣金的实际结算状态展示，仅当佣金结算确失败时显示「结算失败」。',
      settleFailedRetry:
        'PC：延迟户侧可【重新执行】/【放行】；供应商→门店失败且已入平台基本户时，PC 可同时有「结算失败」凭证单与「代收待转」处理单，后者转补偿结款。门店端不展示代收待转，只反映本店佣金结算是否确为「结算失败」。失败后不自动回到待结算。',
      commissionRefundFail:
        '佣金回退属逆向/账务扣款，不进异常订单补偿链路。回退出余额账户（不扣货款），不足则失败；失败走冲正/补偿流水或原指令重试。报表「佣金回退」只统计成功金额。'
    },
    OPEN_QUESTIONS: []
  };
})(window);
