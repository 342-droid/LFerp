/**
 * 门店数据中心 · 演示数据与统计口径
 *
 * 数据来源：页面数值为演示数据，非生产系统接入结果。
 * 统计规则：按本期产品口径实现（见页面「指标说明」），与数据是否已接入无关。
 * 总览／经营／运营／佣金同口径同源。
 */
(function (global) {
  var STORE = { id: 'S-CN', name: '城南生鲜店' };
  var DEMO_TODAY = (function () {
    var d = new Date();
    function p(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  })();
  var UPDATED_AT = DEMO_TODAY + ' 21:30:00';

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }
  function money(n) {
    return round2(n).toFixed(2);
  }
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }
  function dateKeyOf(str) {
    var m = String(str || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
  }
  function parseDay(key) {
    var p = String(key || '').split('-');
    if (p.length < 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function shiftKey(key, delta) {
    var d = parseDay(key);
    if (!d) return '';
    d.setDate(d.getDate() + delta);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function daysBetween(a, b) {
    var da = parseDay(a);
    var db = parseDay(b);
    if (!da || !db) return 0;
    return Math.round((db - da) / 86400000);
  }
  function at(dayOffset, hm) {
    return shiftKey(DEMO_TODAY, dayOffset) + ' ' + (hm || '12:00:00');
  }
  function isTestName(name) {
    return /测试|test/i.test(String(name || ''));
  }

  /**
   * 零售有效销售订单（商城／直播）。
   * 不进成交／购买识别：免费赠品、纯积分、零元营销、积分＋现金补差（首期单独处理）。
   * customer 历史：C01 老客；C02 本期首购仅1次；C03 本期首购≥2次仍属首购；C04 跨商城+直播。
   */
  var RETAIL = [
    /* 老客本期购买 */
    {
      id: 'R-1001',
      channel: 'mall',
      customerId: 'C01',
      payTime: at(0, '10:12:00'),
      goodsPaid: 128.5,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 12.85,
      settleStatus: '已结算',
      commissionCreateTime: at(0, '10:20:00'),
      creditTime: at(0, '18:00:00'),
      orderStatus: '已完成',
      fulfillStatus: '已完成',
      goods: [{ name: '有机生菜', paid: 128.5, test: false }]
    },
    /* 首购仅1次 */
    {
      id: 'R-1002',
      channel: 'live',
      customerId: 'C02',
      payTime: at(0, '11:05:00'),
      goodsPaid: 59.9,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 5.99,
      settleStatus: '待结算',
      commissionCreateTime: at(0, '11:10:00'),
      creditTime: '',
      orderStatus: '待收货',
      fulfillStatus: '待收货',
      goods: [{ name: '直播专享水果盒', paid: 59.9, test: false }]
    },
    /* 首购≥2次（仍属首购） */
    {
      id: 'R-1003',
      channel: 'mall',
      customerId: 'C03',
      payTime: at(-1, '09:30:00'),
      goodsPaid: 86.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 8.6,
      settleStatus: '已结算',
      commissionCreateTime: at(-1, '09:40:00'),
      creditTime: at(-1, '20:00:00'),
      orderStatus: '已完成',
      fulfillStatus: '已完成',
      goods: [{ name: '鸡蛋礼盒', paid: 86.0, test: false }]
    },
    {
      id: 'R-1004',
      channel: 'live',
      customerId: 'C03',
      payTime: at(0, '15:20:00'),
      goodsPaid: 45.0,
      freightPaid: 0,
      refundGoods: 20.0,
      refundTime: at(0, '19:00:00'),
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 4.5,
      settleStatus: '结算中',
      commissionCreateTime: at(0, '15:30:00'),
      creditTime: '',
      orderStatus: '已完成',
      fulfillStatus: '已完成',
      aftersaleStatus: '部分退款',
      goods: [{ name: '鲜牛奶', paid: 45.0, test: false }]
    },
    /* 同人跨商城+直播 */
    {
      id: 'R-1005',
      channel: 'mall',
      customerId: 'C04',
      payTime: at(-2, '14:00:00'),
      goodsPaid: 199.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 19.9,
      settleStatus: '已结算',
      commissionCreateTime: at(-2, '14:10:00'),
      creditTime: at(-2, '21:00:00'),
      goods: [{ name: '牛排套餐', paid: 199.0, test: false }]
    },
    {
      id: 'R-1006',
      channel: 'live',
      customerId: 'C04',
      payTime: at(-2, '20:10:00'),
      goodsPaid: 39.0,
      freightPaid: 0,
      refundGoods: 39.0,
      refundTime: at(-1, '10:00:00'),
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 3.9,
      settleStatus: '已结算',
      commissionCreateTime: at(-2, '20:20:00'),
      creditTime: at(-1, '12:00:00'),
      goods: [{ name: '酸奶', paid: 39.0, test: false }]
    },
    /* 福利低价 */
    {
      id: 'R-1007',
      channel: 'mall',
      customerId: 'C01',
      payTime: at(-3, '16:00:00'),
      goodsPaid: 9.9,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: true,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 0.99,
      settleStatus: '已结算',
      commissionCreateTime: at(-3, '16:05:00'),
      creditTime: at(-3, '22:00:00'),
      goods: [{ name: '福利尝鲜装', paid: 9.9, test: false }]
    },
    /* 免费赠品 — 不计成交／购买 */
    {
      id: 'R-1008',
      channel: 'mall',
      customerId: 'C06',
      payTime: at(0, '08:00:00'),
      goodsPaid: 0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: true,
      pointsOnly: false,
      zeroPromo: false,
      commission: 0,
      settleStatus: '已取消',
      commissionCreateTime: '',
      creditTime: '',
      goods: [{ name: '赠品试吃包', paid: 0, test: false }]
    },
    /* 纯积分 */
    {
      id: 'R-1009',
      channel: 'mall',
      customerId: 'C07',
      payTime: at(-1, '12:00:00'),
      goodsPaid: 0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: true,
      pointsCashMix: false,
      zeroPromo: false,
      commission: 0,
      settleStatus: '已取消',
      commissionCreateTime: '',
      creditTime: '',
      goods: [{ name: '积分兑换毛巾', paid: 0, test: false }]
    },
    /* 积分＋现金补差 — 首期不纳入正常成交／购买统计 */
    {
      id: 'R-1014',
      channel: 'mall',
      customerId: 'C11',
      payTime: at(0, '13:40:00'),
      goodsPaid: 19.9,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      pointsCashMix: true,
      zeroPromo: false,
      commission: 0,
      settleStatus: '已取消',
      commissionCreateTime: '',
      creditTime: '',
      goods: [{ name: '积分加钱换购', paid: 19.9, test: false }]
    },
    /* 零元营销 */
    {
      id: 'R-1010',
      channel: 'live',
      customerId: 'C08',
      payTime: at(-4, '19:00:00'),
      goodsPaid: 0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: true,
      commission: 0,
      settleStatus: '已取消',
      commissionCreateTime: '',
      creditTime: '',
      goods: [{ name: '零元领券商品', paid: 0, test: false }]
    },
    /* 混合：正常+测试商品 → 主单计1，仅正常金额 */
    {
      id: 'R-1011',
      channel: 'mall',
      customerId: 'C01',
      payTime: at(-5, '11:00:00'),
      goodsPaid: 60.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 6.0,
      settleStatus: '已结算',
      commissionCreateTime: at(-5, '11:10:00'),
      creditTime: at(-5, '21:00:00'),
      goods: [
        { name: '西红柿', paid: 60.0, test: false },
        { name: '测试商品A', paid: 1.0, test: true }
      ]
    },
    /* 近7天更多成交，撑趋势 */
    {
      id: 'R-1012',
      channel: 'live',
      customerId: 'C09',
      payTime: at(-6, '18:40:00'),
      goodsPaid: 120.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 12.0,
      settleStatus: '已结算',
      commissionCreateTime: at(-6, '18:50:00'),
      creditTime: at(-6, '22:00:00'),
      goods: [{ name: '海鲜拼盘', paid: 120.0, test: false }]
    },
    {
      id: 'R-1013',
      channel: 'mall',
      customerId: 'C10',
      payTime: at(-8, '13:00:00'),
      goodsPaid: 78.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 7.8,
      settleStatus: '已结算',
      commissionCreateTime: at(-8, '13:10:00'),
      creditTime: at(-8, '20:00:00'),
      goods: [{ name: '大米10kg', paid: 78.0, test: false }]
    },
    /* 未配置佣金比例 — 佣金展示「—」 */
    {
      id: 'R-1015',
      channel: 'mall',
      customerId: 'C02',
      payTime: at(0, '16:45:00'),
      goodsPaid: 32.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: null,
      commissionConfigured: false,
      settleStatus: '待结算',
      commissionCreateTime: at(0, '16:50:00'),
      creditTime: '',
      goods: [{ name: '时令青菜', paid: 32.0, test: false }]
    },
    /* C01 历史首购（周期外）——保证老客判断 */
    {
      id: 'R-0900',
      channel: 'mall',
      customerId: 'C01',
      payTime: at(-40, '10:00:00'),
      goodsPaid: 50.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 5.0,
      settleStatus: '已结算',
      commissionCreateTime: at(-40, '10:10:00'),
      creditTime: at(-40, '20:00:00'),
      goods: [{ name: '历史首单蔬菜', paid: 50.0, test: false }]
    },
    {
      id: 'R-0901',
      channel: 'live',
      customerId: 'C04',
      payTime: at(-35, '19:00:00'),
      goodsPaid: 66.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 6.6,
      settleStatus: '已结算',
      commissionCreateTime: at(-35, '19:10:00'),
      creditTime: at(-35, '21:00:00'),
      goods: [{ name: '历史直播单', paid: 66.0, test: false }]
    },
    {
      id: 'R-0902',
      channel: 'mall',
      customerId: 'C09',
      payTime: at(-20, '12:00:00'),
      goodsPaid: 40.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 4.0,
      settleStatus: '已结算',
      commissionCreateTime: at(-20, '12:10:00'),
      creditTime: at(-20, '20:00:00'),
      goods: [{ name: '老客历史', paid: 40.0, test: false }]
    },
    {
      id: 'R-0903',
      channel: 'mall',
      customerId: 'C10',
      payTime: at(-25, '12:00:00'),
      goodsPaid: 33.0,
      freightPaid: 0,
      refundGoods: 0,
      refundTime: '',
      welfare: false,
      freeGift: false,
      pointsOnly: false,
      zeroPromo: false,
      commission: 3.3,
      settleStatus: '已结算',
      commissionCreateTime: at(-25, '12:10:00'),
      creditTime: at(-25, '20:00:00'),
      goods: [{ name: '老客历史2', paid: 33.0, test: false }]
    }
  ];

  /* 代采进货 */
  var PROXY = [
    {
      id: 'P-2001',
      payTime: at(0, '09:00:00'),
      goodsPaid: 860.0,
      freightPaid: 28.0,
      goodsRefund: 0,
      freightRefund: 0,
      refundTime: '',
      orderStatus: '已完成',
      goods: [{ name: '冷丰锅贴半成品箱', paid: 860.0 }]
    },
    {
      id: 'P-2002',
      payTime: at(-2, '09:30:00'),
      goodsPaid: 420.0,
      freightPaid: 18.0,
      goodsRefund: 40.0,
      freightRefund: 0,
      refundTime: at(-1, '16:00:00'),
      orderStatus: '已完成',
      goods: [{ name: '调味料组合装', paid: 420.0 }]
    },
    {
      id: 'P-2003',
      payTime: at(-5, '10:00:00'),
      goodsPaid: 1100.0,
      freightPaid: 35.0,
      goodsRefund: 0,
      freightRefund: 0,
      refundTime: '',
      orderStatus: '配送中',
      goods: [{ name: '冷冻食材周配', paid: 700.0 }, { name: '餐具耗材', paid: 400.0 }]
    },
    {
      id: 'P-2004',
      payTime: at(-9, '11:00:00'),
      goodsPaid: 650.0,
      freightPaid: 22.0,
      goodsRefund: 0,
      freightRefund: 0,
      refundTime: '',
      orderStatus: '已完成',
      goods: [{ name: '食用油整箱', paid: 650.0 }]
    },
    {
      id: 'P-2005',
      payTime: at(-1, '14:20:00'),
      goodsPaid: 318.0,
      freightPaid: 12.0,
      goodsRefund: 0,
      freightRefund: 0,
      refundTime: '',
      orderStatus: '待发货',
      goods: [{ name: '酱料试用装', paid: 318.0 }]
    },
    {
      id: 'P-2006',
      payTime: at(-3, '16:40:00'),
      goodsPaid: 520.0,
      freightPaid: 20.0,
      goodsRefund: 0,
      freightRefund: 0,
      refundTime: '',
      orderStatus: '已完成',
      goods: [{ name: '冷鲜肉卷', paid: 520.0 }]
    }
  ];

  if(global.BusinessReportFixtures) global.BusinessReportFixtures.rows.forEach(function(r){
    if(r.biz==='retail') RETAIL.push({id:r.id,channel:r.channel,customerId:'LINK-C',payTime:r.pay,goodsPaid:r.paid,freightPaid:0,refundGoods:r.refund||0,refundTime:r.refundAt||'',commission:r.store,settleStatus:'已结算',commissionCreateTime:r.settleAt,creditTime:r.settleAt,orderStatus:'已完成',fulfillStatus:'已完成',goods:[{name:r.name,paid:r.paid,test:false}]});
    else PROXY.push({id:r.id,payTime:r.pay,goodsPaid:r.paid,freightPaid:r.freight||0,goodsRefund:0,freightRefund:0,refundTime:'',orderStatus:'已完成',goods:[{name:r.name||'代采商品',paid:r.paid}]});
  });
  function effectiveGoodsPaid(o) {
    if (o.freeGift || o.pointsOnly || o.zeroPromo || o.pointsCashMix) return 0;
    var sum = 0;
    var hasNormal = false;
    (o.goods || []).forEach(function (g) {
      if (g.test || isTestName(g.name)) return;
      hasNormal = true;
      sum += Number(g.paid) || 0;
    });
    if (!(o.goods && o.goods.length)) {
      sum = Number(o.goodsPaid) || 0;
      hasNormal = sum > 0;
    }
    return hasNormal ? round2(sum) : 0;
  }

  function isCountableRetail(o) {
    if (!o || o.freeGift || o.pointsOnly || o.zeroPromo || o.pointsCashMix) return false;
    return effectiveGoodsPaid(o) > 0;
  }

  function effectiveCommission(o) {
    if (!isCountableRetail(o)) return null;
    if (o.commissionConfigured === false || o.commission == null) return null;
    var base = effectiveGoodsPaid(o);
    var raw = Number(o.goodsPaid) || 0;
    if (raw <= 0) return null;
    return round2((Number(o.commission) || 0) * (base / raw));
  }

  function commissionOrZero(o) {
    var v = effectiveCommission(o);
    return v == null ? 0 : v;
  }

  function firstPayKey(customerId) {
    var keys = RETAIL.filter(function (o) {
      return o.customerId === customerId && isCountableRetail(o);
    })
      .map(function (o) {
        return dateKeyOf(o.payTime);
      })
      .filter(Boolean)
      .sort();
    return keys[0] || '';
  }

  function resolveRange(range, custom) {
    var today = parseDay(DEMO_TODAY);
    var start = today;
    var endExclusive = new Date(today.getTime() + 86400000);
    var label = '今日';
    var r = range || 'today';
    /* 本周／本月已下线 */
    if (r === 'week' || r === 'month') r = 'today';
    if (r === 'yesterday') {
      start = new Date(today.getTime() - 86400000);
      endExclusive = today;
      label = '昨日';
    } else if (r === '7d') {
      /* 近7天：截至昨日的完整自然日 */
      endExclusive = today;
      start = new Date(today.getTime() - 7 * 86400000);
      label = '近7天';
    } else if (r === '30d') {
      endExclusive = today;
      start = new Date(today.getTime() - 30 * 86400000);
      label = '近30天';
    } else if (r === 'custom' && custom && custom.start && custom.end) {
      start = parseDay(custom.start);
      var endDay = parseDay(custom.end);
      endExclusive = endDay ? new Date(endDay.getTime() + 86400000) : endExclusive;
      label = '自定义';
    } else {
      r = 'today';
      label = '今日';
    }
    var endKeyDate = new Date(endExclusive.getTime() - 86400000);
    return {
      range: r,
      label: label,
      startKey: start.getFullYear() + '-' + pad2(start.getMonth() + 1) + '-' + pad2(start.getDate()),
      endKey: endKeyDate.getFullYear() + '-' + pad2(endKeyDate.getMonth() + 1) + '-' + pad2(endKeyDate.getDate()),
      startMs: start.getTime(),
      endMs: endExclusive.getTime(),
      isSingleDay: r === 'today' || r === 'yesterday' || (r === 'custom' && custom && custom.start === custom.end)
    };
  }

  /** 比较期 */
  function compareBounds(bounds) {
    var r = bounds.range;
    var today = parseDay(DEMO_TODAY);
    if (r === 'today') {
      /* 今日对比昨日同一已过时段 —— 原型按全日对比；文案统一为环比 */
      var y = new Date(today.getTime() - 86400000);
      return {
        startMs: y.getTime(),
        endMs: today.getTime(),
        startKey: dateKeyOf(shiftKey(DEMO_TODAY, -1)),
        endKey: dateKeyOf(shiftKey(DEMO_TODAY, -1)),
        label: '环比'
      };
    }
    if (r === 'yesterday') {
      var d2 = new Date(today.getTime() - 2 * 86400000);
      var d1 = new Date(today.getTime() - 86400000);
      return {
        startMs: d2.getTime(),
        endMs: d1.getTime(),
        startKey: dateKeyOf(shiftKey(DEMO_TODAY, -2)),
        endKey: dateKeyOf(shiftKey(DEMO_TODAY, -2)),
        label: '环比'
      };
    }
    var days = Math.max(1, Math.round((bounds.endMs - bounds.startMs) / 86400000));
    var prevEnd = bounds.startMs;
    var prevStart = bounds.startMs - days * 86400000;
    function keyFromMs(ms) {
      var d = new Date(ms);
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
    /* 近7／30天／自定义：对比上一等长周期 → 环比 */
    return {
      startMs: prevStart,
      endMs: prevEnd,
      startKey: keyFromMs(prevStart),
      endKey: keyFromMs(prevEnd - 86400000),
      label: '环比'
    };
  }

  function inBounds(timeStr, bounds) {
    var d = parseDay(dateKeyOf(timeStr));
    if (!d) return false;
    var t = d.getTime();
    return t >= bounds.startMs && t < bounds.endMs;
  }

  function retailPaidIn(bounds, channel) {
    return RETAIL.filter(function (o) {
      if (!isCountableRetail(o)) return false;
      if (channel && channel !== 'all' && o.channel !== channel) return false;
      return inBounds(o.payTime, bounds);
    });
  }

  function deltaPack(cur, prev) {
    var c = Number(cur) || 0;
    var p = Number(prev) || 0;
    var abs = round2(c - p);
    if (p === 0) {
      return { abs: abs, pct: null, up: abs > 0, flat: abs === 0, comparable: false, zeroBase: true };
    }
    var pct = round2(((c - p) / Math.abs(p)) * 100);
    return { abs: abs, pct: pct, up: abs > 0, flat: abs === 0, comparable: true, zeroBase: false };
  }

  function retailMetrics(bounds, channel, viewMode) {
    var mode = viewMode === 'event' ? 'event' : 'pay';
    var paidRows = retailPaidIn(bounds, channel);
    var paidAmt = round2(
      paidRows.reduce(function (s, o) {
        return s + effectiveGoodsPaid(o);
      }, 0)
    );
    var orderCnt = paidRows.length;
    var payUsers = {};
    paidRows.forEach(function (o) {
      payUsers[o.customerId] = true;
    });
    var payUserCnt = Object.keys(payUsers).length;
    var aov = orderCnt > 0 ? round2(paidAmt / orderCnt) : null;

    var refundAmt = 0;
    if (mode === 'pay') {
      /* A：关联截至更新时的退款，支付额保留，退款另列 */
      refundAmt = round2(
        paidRows.reduce(function (s, o) {
          return s + (Number(o.refundGoods) || 0);
        }, 0)
      );
    } else {
      /* B：退款按退款完成时间 */
      refundAmt = round2(
        RETAIL.filter(function (o) {
          return isCountableRetail(o) && Number(o.refundGoods) > 0 && inBounds(o.refundTime, bounds);
        }).reduce(function (s, o) {
          return s + (Number(o.refundGoods) || 0);
        }, 0)
      );
    }
    var netPaid = mode === 'event' ? round2(paidAmt - refundAmt) : round2(paidAmt - refundAmt);

    var incomeRows =
      mode === 'pay'
        ? paidRows
        : RETAIL.filter(function (o) {
            return (
              isCountableRetail(o) &&
              o.commissionCreateTime &&
              inBounds(o.commissionCreateTime, bounds) &&
              (!channel || channel === 'all' || o.channel === channel)
            );
          });
    var commission = round2(
      incomeRows.reduce(function (s, o) {
        return s + commissionOrZero(o);
      }, 0)
    );
    var incomeMall = 0;
    var incomeLive = 0;
    incomeRows.forEach(function (o) {
      var c = commissionOrZero(o);
      if (o.channel === 'live') incomeLive += c;
      else incomeMall += c;
    });

    function byChannel(ch) {
      var rows = paidRows.filter(function (o) {
        return o.channel === ch;
      });
      var amt = round2(
        rows.reduce(function (s, o) {
          return s + effectiveGoodsPaid(o);
        }, 0)
      );
      var users = {};
      rows.forEach(function (o) {
        users[o.customerId] = true;
      });
      return {
        channel: ch,
        paidAmount: amt,
        orderCount: rows.length,
        payUserCount: Object.keys(users).length,
        aov: rows.length ? round2(amt / rows.length) : null
      };
    }

    return {
      viewMode: mode,
      paidAmount: paidAmt,
      orderCount: orderCnt,
      payUserCount: payUserCnt,
      aov: aov,
      refundAmount: refundAmt,
      netPaidAmount: netPaid,
      storeIncome: commission,
      incomeByChannel: {
        mall: round2(incomeMall),
        live: round2(incomeLive)
      },
      mall: byChannel('mall'),
      live: byChannel('live'),
      orders: paidRows
    };
  }

  function customerMetrics(bounds) {
    var paidRows = retailPaidIn(bounds, 'all');
    var periodStartKey = bounds.startKey;
    var users = {};
    paidRows.forEach(function (o) {
      if (!users[o.customerId]) users[o.customerId] = { id: o.customerId, orders: 0 };
      users[o.customerId].orders += 1;
    });
    var first = 0;
    var old = 0;
    var multi = 0;
    var dist = { 1: 0, 2: 0, '3+': 0 };
    Object.keys(users).forEach(function (id) {
      var u = users[id];
      var firstKey = firstPayKey(id);
      var isFirst = firstKey && firstKey >= periodStartKey;
      if (isFirst) first += 1;
      else old += 1;
      if (u.orders >= 2) multi += 1;
      if (u.orders === 1) dist['1'] += 1;
      else if (u.orders === 2) dist['2'] += 1;
      else dist['3+'] += 1;
    });
    var payUserCnt = Object.keys(users).length;
    var orderCnt = paidRows.length;
    return {
      payUserCount: payUserCnt,
      firstBuyCount: first,
      oldBuyCount: old,
      oldShare: payUserCnt ? round2((old / payUserCnt) * 100) : null,
      multiBuyCount: multi,
      multiShare: payUserCnt ? round2((multi / payUserCnt) * 100) : null,
      avgOrders: payUserCnt ? round2(orderCnt / payUserCnt) : null,
      freqDist: dist
    };
  }

  function proxyMetrics(bounds) {
    var rows = PROXY.filter(function (o) {
      return inBounds(o.payTime, bounds);
    });
    var goodsPaid = round2(
      rows.reduce(function (s, o) {
        return s + (Number(o.goodsPaid) || 0);
      }, 0)
    );
    var freightPaid = round2(
      rows.reduce(function (s, o) {
        return s + (Number(o.freightPaid) || 0);
      }, 0)
    );
    var goodsRefund = round2(
      PROXY.filter(function (o) {
        return Number(o.goodsRefund) > 0 && inBounds(o.refundTime || o.payTime, bounds);
      }).reduce(function (s, o) {
        return s + (Number(o.goodsRefund) || 0);
      }, 0)
    );
    var freightRefund = round2(
      PROXY.filter(function (o) {
        return Number(o.freightRefund) > 0 && inBounds(o.refundTime || o.payTime, bounds);
      }).reduce(function (s, o) {
        return s + (Number(o.freightRefund) || 0);
      }, 0)
    );
    /* 有效代采支付自然日去重：同一天多次进货算一个进货日 */
    var days = {};
    rows.forEach(function (o) {
      var k = dateKeyOf(o.payTime);
      if (k) days[k] = true;
    });
    var dayKeys = Object.keys(days).sort();
    var firstDay = dayKeys.length ? dayKeys[0] : null;
    var lastDay = dayKeys.length ? dayKeys[dayKeys.length - 1] : null;
    /* 平均间隔＝（本期最近－本期最早）÷（本期进货天数－1）；少于2个进货日为 — */
    var avgGap =
      dayKeys.length >= 2 ? round2(daysBetween(firstDay, lastDay) / (dayKeys.length - 1)) : null;
    /* 全部历史最近一次进货，与本期指标分开展示 */
    var allDays = {};
    PROXY.forEach(function (o) {
      var k = dateKeyOf(o.payTime);
      if (k) allDays[k] = true;
    });
    var allKeys = Object.keys(allDays).sort();
    var lastPurchaseDayAll = allKeys.length ? allKeys[allKeys.length - 1] : null;
    return {
      goodsPaid: goodsPaid,
      freightPaid: freightPaid,
      totalPaid: round2(goodsPaid + freightPaid),
      orderCount: rows.length,
      goodsRefund: goodsRefund,
      freightRefund: freightRefund,
      /* 主展示：本期最近进货日（仅所选周期内） */
      lastPurchaseDay: lastDay,
      periodLastPurchaseDay: lastDay,
      periodFirstPurchaseDay: firstDay,
      lastPurchaseDayAll: lastPurchaseDayAll,
      purchaseDays: dayKeys.length,
      avgGapDays: avgGap,
      orders: rows
    };
  }

  /**
   * 营业额／营业额（一期仅商城＋直播；不含POS、代采进货、佣金）。
   */
  function storeRevenueMetrics(bounds) {
    var retail = retailMetrics(bounds, 'all', 'pay');
    var mall = retail.mall || { paidAmount: 0, orderCount: 0 };
    var live = retail.live || { paidAmount: 0, orderCount: 0 };
    var platform = {
      id: 'platformRetail',
      name: '营业额',
      status: 'ok',
      amount: retail.paidAmount,
      refundAmount: retail.refundAmount,
      netAmount: retail.netPaidAmount,
      children: [
        {
          id: 'mall',
          name: '商城',
          status: mall.paidAmount > 0 || mall.orderCount > 0 ? 'ok' : 'zero',
          amount: mall.paidAmount,
          orderCount: mall.orderCount
        },
        {
          id: 'live',
          name: '直播',
          status: live.paidAmount > 0 || live.orderCount > 0 ? 'ok' : 'zero',
          amount: live.paidAmount,
          orderCount: live.orderCount
        }
      ]
    };

    return {
      heroTitle: '营业额',
      coverNote: '',
      partial: false,
      amount: retail.paidAmount,
      refundAmount: retail.refundAmount,
      netAmount: retail.netPaidAmount,
      channels: [platform],
      platformRetail: platform,
      sourceNote: '仅含营业额（商城、直播）支付成交；代采进货、佣金不计入。'
    };
  }

  function metricValue(bounds, metric, channel) {
    if (metric === 'revenue' || metric === 'revenueNet' || metric === 'revenueRefund') {
      var rev = storeRevenueMetrics(bounds);
      if (metric === 'revenueNet') return rev.netAmount;
      if (metric === 'revenueRefund') return rev.refundAmount;
      return rev.amount;
    }
    if (metric === 'paid' || metric === 'orders' || metric === 'users') {
      var m = retailMetrics(bounds, channel || 'all', 'pay');
      if (metric === 'paid') return m.paidAmount;
      if (metric === 'orders') return m.orderCount;
      return m.payUserCount;
    }
    if (metric === 'proxy') {
      return proxyMetrics(bounds).totalPaid;
    }
    if (metric === 'income') {
      return retailMetrics(bounds, channel || 'all', 'pay').storeIncome;
    }
    var c = customerMetrics(bounds);
    if (metric === 'payUsers') return c.payUserCount;
    if (metric === 'first') return c.firstBuyCount;
    if (metric === 'old') return c.oldBuyCount;
    if (metric === 'multi') return c.multiBuyCount;
    return 0;
  }

  function buildTrend(bounds, metric, channel) {
    var points = [];
    /* 单日：按小时；多日：按日 */
    if (bounds.isSingleDay) {
      var dayKey = bounds.startKey;
      var hour;
      for (hour = 0; hour < 24; hour++) {
        var rows = RETAIL.filter(function (o) {
          if (!isCountableRetail(o)) return false;
          if (channel && channel !== 'all' && o.channel !== channel) return false;
          if (dateKeyOf(o.payTime) !== dayKey) return false;
          var hm = String(o.payTime || '').slice(11, 13);
          return Number(hm) === hour;
        });
        var v = 0;
        if (metric === 'paid') {
          v = round2(
            rows.reduce(function (s, o) {
              return s + effectiveGoodsPaid(o);
            }, 0)
          );
        } else if (metric === 'orders') {
          v = rows.length;
        } else if (metric === 'users' || metric === 'payUsers' || metric === 'first' || metric === 'old') {
          var users = {};
          rows.forEach(function (o) {
            users[o.customerId] = true;
          });
          if (metric === 'first' || metric === 'old') {
            var periodStartKey = dayKey;
            Object.keys(users).forEach(function (id) {
              var firstKey = firstPayKey(id);
              var isFirst = firstKey && firstKey >= periodStartKey;
              if (metric === 'first' && isFirst) v += 1;
              if (metric === 'old' && !isFirst) v += 1;
            });
          } else {
            v = Object.keys(users).length;
          }
        } else if (metric === 'proxy') {
          v = round2(
            PROXY.filter(function (o) {
              return dateKeyOf(o.payTime) === dayKey && Number(String(o.payTime).slice(11, 13)) === hour;
            }).reduce(function (s, o) {
              return s + (Number(o.goodsPaid) || 0) + (Number(o.freightPaid) || 0);
            }, 0)
          );
        } else if (metric === 'income') {
          v = round2(
            rows.reduce(function (s, o) {
              return s + commissionOrZero(o);
            }, 0)
          );
        } else if (metric === 'revenue' || metric === 'revenueNet' || metric === 'revenueRefund') {
          /* 小时粒度：平台零售按支付小时 */
          var retailHour = round2(
            rows.reduce(function (s, o) {
              return s + effectiveGoodsPaid(o);
            }, 0)
          );
          var retailRefundHour = round2(
            rows.reduce(function (s, o) {
              return s + (Number(o.refundGoods) || 0);
            }, 0)
          );
          if (metric === 'revenueRefund') v = retailRefundHour;
          else if (metric === 'revenueNet') v = round2(retailHour - retailRefundHour);
          else v = retailHour;
        }
        points.push({ key: dayKey + ' ' + pad2(hour), label: pad2(hour) + ':00', value: v });
      }
      /* 压缩：去掉两端全 0 小时，保留有数区间；全 0 则保留 0–23 精简为空态由 UI 处理 */
      var firstIdx = -1;
      var lastIdx = -1;
      points.forEach(function (p, i) {
        if (p.value) {
          if (firstIdx < 0) firstIdx = i;
          lastIdx = i;
        }
      });
      if (firstIdx >= 0) {
        points = points.slice(Math.max(0, firstIdx - 1), Math.min(points.length, lastIdx + 2));
      } else {
        points = [];
      }
      return { points: points, grain: 'hour' };
    }
    var cur = parseDay(bounds.startKey);
    var end = parseDay(bounds.endKey);
    if (!cur || !end) return { points: [], grain: 'day' };
    while (cur.getTime() <= end.getTime()) {
      var key =
        cur.getFullYear() + '-' + pad2(cur.getMonth() + 1) + '-' + pad2(cur.getDate());
      var dayBounds = {
        startMs: cur.getTime(),
        endMs: cur.getTime() + 86400000,
        startKey: key,
        endKey: key,
        isSingleDay: true
      };
      points.push({
        key: key,
        label: key.slice(5),
        value: metricValue(dayBounds, metric, channel)
      });
      cur.setDate(cur.getDate() + 1);
    }
    return { points: points, grain: 'day' };
  }

  function buildOverview(range, custom) {
    var bounds = resolveRange(range, custom);
    var cmp = compareBounds(bounds);
    var cur = retailMetrics(bounds, 'all', 'pay');
    var prev = retailMetrics(cmp, 'all', 'pay');
    var revenue = storeRevenueMetrics(bounds);
    var revenuePrev = storeRevenueMetrics(cmp);
    var cust = customerMetrics(bounds);
    var custPrev = customerMetrics(cmp);
    var proxy = proxyMetrics(bounds);
    return {
      store: STORE,
      updatedAt: UPDATED_AT,
      bounds: bounds,
      compareLabel: cmp.label,
      compareRange: { startKey: cmp.startKey, endKey: cmp.endKey },
      revenue: {
        heroTitle: revenue.heroTitle,
        coverNote: revenue.coverNote,
        partial: revenue.partial,
        amount: revenue.amount,
        refundAmount: revenue.refundAmount,
        netAmount: revenue.netAmount,
        amountDelta: deltaPack(revenue.amount, revenuePrev.amount),
        refundDelta: deltaPack(revenue.refundAmount, revenuePrev.refundAmount),
        netDelta: deltaPack(revenue.netAmount, revenuePrev.netAmount),
        channels: revenue.channels,
        sourceNote: revenue.sourceNote
      },
      retail: {
        paidAmount: cur.paidAmount,
        paidDelta: deltaPack(cur.paidAmount, prev.paidAmount),
        orderCount: cur.orderCount,
        orderDelta: deltaPack(cur.orderCount, prev.orderCount),
        aov: cur.aov,
        aovDelta: deltaPack(cur.aov || 0, prev.aov || 0),
        storeIncome: cur.storeIncome,
        incomeDelta: deltaPack(cur.storeIncome, prev.storeIncome),
        refundAmount: cur.refundAmount,
        netPaidAmount: cur.netPaidAmount,
        mall: cur.mall,
        live: cur.live
      },
      customers: {
        payUserCount: cust.payUserCount,
        firstBuyCount: cust.firstBuyCount,
        oldBuyCount: cust.oldBuyCount,
        multiBuyCount: cust.multiBuyCount,
        payUserDelta: deltaPack(cust.payUserCount, custPrev.payUserCount)
      },
      proxy: proxy,
      tips: {
        overview:
          '营业额为本店商城、直播订单的营业额合计。',
        revenue:
          '营业额为所选周期内支付成功订单的实付金额之和。退款金额为关联至这些支付订单的退款；退款后净营业额＝营业额−退款金额。代采进货、佣金不计入。',
        retailPaid: '商城、直播渠道成交均计入营业额。',
        storeIncome: '本店获得的佣金，以系统结算记录为准。',
        proxy: '进货支付总额为采购支出（商品款＋运费），不计入营业额；商品款、运费、进货天数等详见进货数据页。'
      }
    };
  }

  function buildOpsDetail(range, custom, viewMode, channel) {
    var bounds = resolveRange(range, custom);
    var cmp = compareBounds(bounds);
    var cur = retailMetrics(bounds, channel || 'all', viewMode);
    var prev = retailMetrics(cmp, channel || 'all', viewMode);
    return {
      store: STORE,
      updatedAt: UPDATED_AT,
      bounds: bounds,
      compareLabel: cmp.label,
      compareRange: { startKey: cmp.startKey, endKey: cmp.endKey },
      viewMode: viewMode === 'event' ? 'event' : 'pay',
      channel: channel || 'all',
      retail: cur,
      retailDelta: {
        paid: deltaPack(cur.paidAmount, prev.paidAmount),
        orders: deltaPack(cur.orderCount, prev.orderCount),
        users: deltaPack(cur.payUserCount, prev.payUserCount)
      },
      proxy: proxyMetrics(bounds),
      income: {
        amount: cur.storeIncome,
        delta: deltaPack(cur.storeIncome, prev.storeIncome),
        byChannel: cur.incomeByChannel,
        pending: round2(
          (cur.orders || []).reduce(function (s, o) {
            if (o.settleStatus !== '待结算' && o.settleStatus !== '结算中') return s;
            return s + commissionOrZero(o);
          }, 0)
        ),
        settled: round2(
          (cur.orders || []).reduce(function (s, o) {
            if (o.settleStatus !== '已结算') return s;
            return s + commissionOrZero(o);
          }, 0)
        ),
        tip: '本店获得的佣金，以系统结算记录为准。'
      },
      tips: {
        viewPay:
          '「支付订单归属」：先取周期内支付成功订单，再关联退款。营业额保留原支付金额，退款另列。',
        viewEvent:
          '「发生日期」：支付按支付成功时间，退款按退款完成时间。当期净营业额＝当期支付−当期成功退款。',
        proxy: '进货支付总额为采购支出（商品款＋运费），不计入营业额。',
        retailTab: '营业额仅含商城、直播成交。'
      }
    };
  }

  function buildOperateDetail(range, custom) {
    var bounds = resolveRange(range, custom);
    var cmp = compareBounds(bounds);
    var cust = customerMetrics(bounds);
    var custPrev = customerMetrics(cmp);
    var retail = retailMetrics(bounds, 'all', 'pay');
    return {
      store: STORE,
      updatedAt: UPDATED_AT,
      bounds: bounds,
      compareLabel: cmp.label,
      compareRange: { startKey: cmp.startKey, endKey: cmp.endKey },
      customers: cust,
      customerDelta: {
        payUsers: deltaPack(cust.payUserCount, custPrev.payUserCount),
        first: deltaPack(cust.firstBuyCount, custPrev.firstBuyCount),
        old: deltaPack(cust.oldBuyCount, custPrev.oldBuyCount)
      },
      sources: { mall: retail.mall, live: retail.live },
      check: {
        firstPlusOld: cust.firstBuyCount + cust.oldBuyCount,
        freqSum: cust.freqDist['1'] + cust.freqDist['2'] + cust.freqDist['3+']
      },
      tips: {
        firstOld:
          '首购以当前门店为范围。首购客户：期初从未在本店购买、本期首次购买；老客户：期初已在本店购买且本期有购买。本期首次购买后再次购买仍属本期首购。首购＋老客＝交易人数。客户换绑不迁移历史交易。',
        freq:
          '购买2次及以上人数可同时含首购与老客，不与两者相加。人均购买次数＝支付主订单数÷交易人数。不使用「复购率」。',
        source:
          '按订单实际来源划分。同一顾客在商城和直播购买，合计人数只计1人。本店直播成交≠分享贡献。来源切换不改变基于本店历史的首购／老客身份。'
      }
    };
  }

  var NICK_MAP = {
    C01: '阿悠',
    C02: '小新',
    C03: '果果',
    C04: '阿凯',
    C09: '海哥',
    C10: '米米',
    C11: '积分客'
  };

  function settleBucket(status) {
    if (status === '已结算') return 'settled';
    if (status === '待结算' || status === '结算中') return 'pending';
    if (status === '结算失败' || status === '已取消') return 'abnormal';
    return 'pending';
  }

  function listCommission(range, custom, dim) {
    var bounds = resolveRange(range || 'today', custom);
    /* pay＝下单口径（当前数据以支付成功时间代表有效下单）；settle＝实际入账时间。 */
    var mode = dim === 'settle' || dim === 'create' ? 'settle' : 'pay';
    return RETAIL.filter(function (o) {
      if (!isCountableRetail(o)) return false;
      if (mode === 'pay') return inBounds(o.payTime, bounds);
      return o.settleStatus === '已结算' && o.creditTime && inBounds(o.creditTime, bounds);
    }).map(function (o) {
      var comm = effectiveCommission(o);
      var goodsNames = (o.goods || [])
        .filter(function (g) {
          return !(g.test || isTestName(g.name));
        })
        .map(function (g) {
          return g.name;
        })
        .join('、');
      return {
        id: o.id,
        orderId: o.id,
        channel: o.channel === 'live' ? '直播' : '商城',
        channelKey: o.channel,
        customerId: o.customerId,
        nick: NICK_MAP[o.customerId] || o.customerId,
        phone: o.phone || '',
        payTime: o.payTime,
        paid: effectiveGoodsPaid(o),
        refund: Number(o.refundGoods) || 0,
        goods: goodsNames || '—',
        commission: comm,
        commissionText: comm == null ? '—' : money(comm),
        estimated: comm,
        credited: o.settleStatus === '已结算' ? comm : 0,
        settleStatus: o.settleStatus,
        settleBucket: settleBucket(o.settleStatus),
        commissionCreateTime: o.commissionCreateTime,
        creditTime: o.creditTime || '',
        fulfillStatus: o.fulfillStatus || '已完成',
        remark: o.remark || ''
      };
    });
  }

  function commissionSummary(range, custom, dim) {
    var list = listCommission(range, custom, dim);
    var estimated = 0;
    var pending = 0;
    var settled = 0;
    var estimatedCount = 0;
    var pendingCount = 0;
    var settledCount = 0;
    list.forEach(function (o) {
      var c = o.commission == null ? 0 : o.commission;
      if (o.settleBucket === 'abnormal') return;
      estimated = round2(estimated + c);
      estimatedCount += 1;
      if (o.settleBucket === 'pending') {
        pending = round2(pending + c);
        pendingCount += 1;
      }
      if (o.settleBucket === 'settled') {
        settled = round2(settled + (o.credited == null ? 0 : o.credited));
        settledCount += 1;
      }
    });
    return {
      list: list,
      estimated: estimated,
      estimatedCount: estimatedCount,
      pending: pending,
      pendingCount: pendingCount,
      settled: settled,
      settledCount: settledCount
    };
  }

  global.StoreAppBizDataCenter = {
    STORE: STORE,
    DEMO_TODAY: DEMO_TODAY,
    UPDATED_AT: UPDATED_AT,
    money: money,
    round2: round2,
    resolveRange: resolveRange,
    compareBounds: compareBounds,
    buildOverview: buildOverview,
    buildOpsDetail: buildOpsDetail,
    buildOperateDetail: buildOperateDetail,
    buildTrend: buildTrend,
    listCommission: listCommission,
    commissionSummary: commissionSummary,
    listRetailOrders: function (bounds, channel, view) {
      return RETAIL.filter(function (o) {
        return isCountableRetail(o) && (!channel || channel === 'all' || o.channel === channel) &&
          (inBounds(o.payTime, bounds) || (view === 'event' && Number(o.refundGoods) > 0 && inBounds(o.refundTime, bounds)));
      }).slice().sort(function (a, b) {
        return b.payTime.localeCompare(a.payTime) || a.id.localeCompare(b.id);
      });
    },
    retailMetrics: retailMetrics,
    storeRevenueMetrics: storeRevenueMetrics,
    customerMetrics: customerMetrics,
    OPEN_QUESTIONS: [],
    /* 开发备注勿写入 DATA_SOURCE_NOTE，避免弹层「通用规则」展示给店长 */
    DATA_SOURCE_NOTE: ''
  };
})(window);
