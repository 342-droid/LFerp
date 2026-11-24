/**
 * 经营数据中心 · 原型示例数据与口径汇总
 * 数值均为「原型示例数据」，非 UAT 实数；食亨 POS 故意为空。
 */
(function (global) {
  'use strict';

  var AS_OF = '2026-11-19T17:00:00+08:00';
  var DEMO_LABEL = '原型示例数据';

  var STORES = [
    { id: 'ST-BJ-01', name: '冷丰锅贴·望京店', line: '餐饮', brand: '冷丰锅贴' },
    { id: 'ST-BJ-02', name: '冷丰锅贴·中关村店', line: '餐饮', brand: '冷丰锅贴' },
    { id: 'ST-HZ-01', name: '汉言·西溪店', line: '康美', brand: '汉言' },
    { id: 'ST-SH-01', name: '冷丰特选·徐汇店', line: '纯私域', brand: '冷丰特选' },
    { id: 'ST-CD-01', name: '冷丰食堂大钵刘·春熙路店', line: '餐饮', brand: '冷丰食堂大钵刘' },
    { id: 'ST-SZ-01', name: '冷丰锅贴·南山店', line: '餐饮', brand: '冷丰锅贴' },
    { id: 'ST-GZ-01', name: '汉言·天河店', line: '康美', brand: '汉言' }
  ];

  var SUPPLIERS = [
    { id: 'SUP-01', name: '鲜达优选供应链' },
    { id: 'SUP-02', name: '绿源生鲜批发' },
    { id: 'SUP-03', name: '汉言原料仓' }
  ];

  /** 食亨门店及其默认 ERP 对应关系（原型）。 */
  var POS_STORE_MAP = [
    { posId: 'POS-01', erpId: 'ST-BJ-01', erpName: '冷丰锅贴·望京店', posName: '冷丰锅贴·望京店', matched: true },
    { posId: 'POS-02', erpId: 'ST-BJ-02', erpName: '冷丰锅贴·中关村店', posName: '冷丰锅贴中关村店', matched: true },
    { erpId: 'ST-HZ-01', erpName: '汉言·西溪店', posName: '', matched: false },
    { posId: 'POS-03', erpId: 'ST-SH-01', erpName: '冷丰特选·徐汇店', posName: '冷丰特选徐汇', matched: true },
    { erpId: 'ST-CD-01', erpName: '冷丰食堂大钵刘·春熙路店', posName: '', matched: false },
    { posId: 'POS-04', erpId: '', erpName: '', posName: '食亨演示店·未映射', matched: false, posOnly: true }
  ];

  function scaleOf(period) {
    if (period === 'today') return 0.12;
    if (period === 'yesterday') return 0.11;
    if (period === '7d') return 0.55;
    if (period === '30d') return 1;
    if (period === 'custom') return 0.72;
    return 1;
  }

  function r2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function ri(n) {
    return Math.round(Number(n));
  }

  function storeMatch(filters, storeId) {
    if (!filters || !filters.storeId) return true;
    return storeId === filters.storeId;
  }

  function lineMatch(filters, line) {
    if (!filters || !filters.line) return true;
    return line === filters.line;
  }

  function channelMatch(filters, channel) {
    if (!filters || !filters.channel || filters.channel === 'all') return true;
    return channel === filters.channel;
  }

  function matchesPeriod(filters, time) {
    var biz = global.MdmDataBiz;
    if (!biz || !biz.resolvePeriod) return true;
    var f = filters || {};
    var range = biz.resolvePeriod(f.period || '30d', f.from, f.to, new Date(AS_OF));
    var timestamp = Date.parse(time.replace(' ', 'T') + ':00+08:00');
    return timestamp >= range.start.getTime() && timestamp < range.end.getTime() &&
      timestamp <= Date.parse(AS_OF);
  }

  function filterFactor(filters) {
    var f = filters || {};
    var s = 1;
    if (f.storeId) s *= 0.22;
    if (f.line) s *= 0.38;
    if (f.channel === 'live') s *= 0.42;
    if (f.channel === 'mall') s *= 0.58;
    return s;
  }

  /**
   * ERP 经营快照（支付成功口径）
   * 销售额含运费；退款单独按成功退款时间展示，不冲减销售额/采购成本
   * 商品平台分佣 = 商品毛利 − BD − 直播 − 门店；运费分佣单独；平台分佣收入 = 二者之和
   * 供应商货款等列在支出，不从商品毛利再扣
   */
  function erpSnapshot(filters) {
    var period = (filters && filters.period) || '30d';
    var s = scaleOf(period) * filterFactor(filters);
    var scope = (filters && filters.channel) || 'all';
    var channelFiltered = scope === 'mall' || scope === 'live';
    var retailOnly = scope === 'retail' || channelFiltered;
    var proxyOnly = scope === 'proxy';
    var retailScale = s;
    var proxyScale = s;
    if (retailOnly) s *= 0.72;
    if (proxyOnly) s *= 0.28;
    var goodsSales = r2(186420 * s);
    var freightSales = r2(12480 * s);
    var salesTotal = r2(goodsSales + freightSales);
    var purchaseCost = r2(112860 * s);
    var goodsMargin = r2(goodsSales - purchaseCost);
    var bdCommission = r2(8640 * s);
    var liveCommission = r2(6120 * s);
    var storeCommission = r2(14820 * s);
    var platformGoodsCommission = r2(goodsMargin - bdCommission - liveCommission - storeCommission);
    var freightCommission = r2(3260 * s);
    var platformIncome = r2(platformGoodsCommission + freightCommission);
    var refundAmount = r2(12860 * s);
    var refundQty = ri(186 * s);
    var supplierPayment = r2(98640 * s);
    var liveFee = r2(4200 * s);
    /* 对齐财务经营表：积分兑换成本、运营毛利（Excel 原公式格曾为 #REF!，原型按表内合计数演示）
     * 系统流量费／系统手续费：业务系统无对应数据源，不接入、不展示 */
    var pointsExchangeCost = r2(17991 * s);
    var opsGrossProfit = r2(8212 * s);
    var opsGrossRate = salesTotal ? opsGrossProfit / salesTotal : null;
    var retailOrders = proxyOnly ? 0 : ri(1480 * retailScale);
    var proxyOrders = retailOnly ? 0 : ri(362 * proxyScale);
    var orderCount = retailOrders + proxyOrders;
    /* 对齐运营管理表：总下单数 vs 交易成功（已核销）订单数／金额、核销率 */
    var placeOrderCount = ri(5945 * s);
    var verifiedOrderCount = ri(3296 * s);
    var verifiedOrderAmount = r2(110447 * s);
    var verifyRate = placeOrderCount ? verifiedOrderCount / placeOrderCount : null;

    var trendDays = period === 'today' || period === 'yesterday' ? 24 : period === '7d' ? 7 : 14;
    var trend = [];
    for (var i = 0; i < trendDays; i++) {
      var base = period === 'today' || period === 'yesterday' ? 3200 + (i % 5) * 280 : 9800 + (i % 7) * 860;
      trend.push({
        date: period === 'today' || period === 'yesterday' ? (i < 10 ? '0' + i : String(i)) + ':00' : '11-' + (6 + i),
        value: r2(base * s * (0.85 + (i % 4) * 0.05)),
        grain: period === 'today' || period === 'yesterday' ? 'hour' : 'day',
        label: period === 'today' || period === 'yesterday' ? (i % 3 === 0 ? (i < 10 ? '0' + i : String(i)) + ':00' : '') : undefined
      });
    }

    var products = [
      {
        name: '手工锅贴 20 只',
        biz: '零售',
        supplier: '鲜达优选供应链',
        unitPrice: 34,
        qty: ri(820 * s),
        sales: r2(27880 * s),
        cost: r2(16400 * s),
        margin: r2(11480 * s),
        refundAmount: r2(960 * s),
        refundQty: ri(28 * s)
      },
      {
        name: '库尔勒香梨 4kg',
        biz: '零售',
        supplier: '绿源生鲜批发',
        unitPrice: 48,
        qty: ri(620 * s),
        sales: r2(29760 * s),
        cost: r2(18600 * s),
        margin: r2(11160 * s),
        refundAmount: r2(720 * s),
        refundQty: ri(15 * s)
      },
      {
        name: '汉言原料箱',
        biz: '代采',
        supplier: '汉言原料仓',
        unitPrice: 120,
        qty: ri(210 * s),
        sales: r2(25200 * s),
        cost: r2(17220 * s),
        margin: r2(7980 * s),
        refundAmount: r2(360 * s),
        refundQty: ri(3 * s)
      },
      {
        name: '速冻菠菜',
        biz: '代采',
        supplier: '绿源生鲜批发',
        unitPrice: 42,
        qty: ri(380 * s),
        sales: r2(15960 * s),
        cost: r2(11400 * s),
        margin: r2(4560 * s),
        refundAmount: r2(210 * s),
        refundQty: ri(5 * s)
      },
      {
        name: '直播专供虾仁饺',
        biz: '零售',
        supplier: '鲜达优选供应链',
        unitPrice: 89,
        qty: ri(196 * s),
        sales: r2(17444 * s),
        cost: r2(7840 * s),
        margin: r2(9604 * s),
        refundAmount: r2(445 * s),
        refundQty: ri(5 * s)
      }
    ];

    var suppliers = [
      {
        id: 'SUP-01',
        name: '鲜达优选供应链',
        goodsSales: r2(64200 * s),
        purchaseCost: r2(38640 * s),
        goodsMargin: r2(25560 * s),
        refundAmount: r2(4200 * s)
      },
      {
        id: 'SUP-02',
        name: '绿源生鲜批发',
        goodsSales: r2(51840 * s),
        purchaseCost: r2(34200 * s),
        goodsMargin: r2(17640 * s),
        refundAmount: r2(2860 * s)
      },
      {
        id: 'SUP-03',
        name: '汉言原料仓',
        goodsSales: r2(38640 * s),
        purchaseCost: r2(24840 * s),
        goodsMargin: r2(13800 * s),
        refundAmount: r2(1860 * s)
      }
    ];

    var storeSales = STORES.filter(function (st) {
      return storeMatch(filters, st.id) && lineMatch(filters, st.line);
    }).map(function (st, idx) {
      var w = 1 - idx * 0.08;
      return {
        storeId: st.id,
        storeName: st.name,
        line: st.line,
        sales: r2(28600 * s * w),
        goodsSales: r2(26800 * s * w),
        freightSales: r2(1800 * s * w),
        orders: ri(220 * s * w),
        refundAmount: r2(1280 * s * w)
      };
    });

    var storeProxy = STORES.filter(function (st) {
      return storeMatch(filters, st.id) && lineMatch(filters, st.line);
    }).map(function (st, idx) {
      var w = 0.7 - idx * 0.06;
      if (w < 0.15) w = 0.15;
      return {
        storeId: st.id,
        storeName: st.name,
        line: st.line,
        sales: r2(18600 * s * w),
        goodsSales: r2(16200 * s * w),
        freightSales: r2(2400 * s * w),
        orders: ri(48 * s * w),
        refundAmount: r2(620 * s * w)
      };
    });

    /* 总览排行同时保留零售与代采的经营贡献；不再只以零售销售额作为排行内容。 */
    var storeRank = STORES.filter(function (st) {
      return storeMatch(filters, st.id) && lineMatch(filters, st.line);
    }).map(function (st, idx) {
      var retailWeight = 1 - idx * 0.08;
      var proxyWeight = 0.7 - idx * 0.06;
      if (proxyWeight < 0.15) proxyWeight = 0.15;
      var retailGoodsSales = proxyOnly ? 0 : r2(26800 * retailScale * retailWeight);
      var retailCost = r2(retailGoodsSales * 0.52);
      var proxyGoodsSales = retailOnly ? 0 : r2(16200 * proxyScale * proxyWeight);
      var proxyCost = r2(proxyGoodsSales * 0.68);
      var retailMargin = r2(retailGoodsSales - retailCost);
      var proxyMargin = r2(proxyGoodsSales - proxyCost);
      var goodsSalesTotal = r2(retailGoodsSales + proxyGoodsSales);
      var goodsMargin = r2(retailMargin + proxyMargin);
      /* 原型按结算后平台可得份额展示，零售与代采拆列，合计用于总览比较。 */
      var retailPlatformIncome = r2(retailMargin * 0.24);
      var proxyPlatformIncome = retailOnly
        ? 0
        : r2(proxyMargin * 0.2 + 2400 * proxyScale * proxyWeight * 0.12);
      return {
        storeId: st.id,
        storeName: st.name,
        line: st.line,
        goodsSales: goodsSalesTotal,
        goodsMargin: goodsMargin,
        goodsMarginRate: goodsSalesTotal ? goodsMargin / goodsSalesTotal : null,
        retailPlatformIncome: retailPlatformIncome,
        proxyPlatformIncome: proxyPlatformIncome,
        platformIncome: r2(retailPlatformIncome + proxyPlatformIncome)
      };
    }).sort(function (a, b) { return b.platformIncome - a.platformIncome; });

    /* 每行独立真实 data-order-id（零售/代采分池），避免多行共用同一深链 */
    var RETAIL_ORDER_IDS = [
      'ORD-3212689201588561',
      'ORD-3212689201599501',
      'ORD-3212689201599601',
      'ORD-3212689201599602',
      'ORD-3212689201599801',
      'ORD-3212689201599802',
      'ORD-3212689201599803',
      'ORD-3212689201599001',
      'ORD-3212689201599002',
      'ORD-3212689201599003',
      'ORD-3212689201599101',
      'ORD-3212689201599102',
      'ORD-3212689201599103',
      'ORD-3212689201599104',
      'ORD-3212689201599105',
      'ORD-3212689201599106',
      'ORD-3212689201599107',
      'ORD-3212689201599108',
      'ORD-3212689201599201',
      'ORD-3212689201599301',
      'ORD-3212689201599302',
      'ORD-3212689201599303',
      'ORD-3212689201599304',
      'ORD-3212689201560682',
      'ORD-3212689201560683'
    ];
    /* 优先选用代采列表中供应商演示视角可打开的 data-order-id */
    var PROXY_ORDER_IDS = [
      'ORD-3212689201599403',
      'ORD-3212689201588561',
      'ORD-3212689201599001',
      'ORD-3212689201560682',
      'ORD-3212689201598341',
      'ORD-3212689201562037-A',
      'ORD-3212689201599701'
    ];
    var storeNames = STORES.map(function (st) {
      return st.name;
    });
    var orderDetails = [];
    var retailSeq = 0;
    var proxySeq = 0;
    for (var oi = 0; oi < 32; oi++) {
      var isProxy = oi % 5 === 0;
      var productIndex = isProxy ? proxySeq % 2 : retailSeq % 3;
      var oid = isProxy
        ? PROXY_ORDER_IDS[proxySeq++ % PROXY_ORDER_IDS.length]
        : RETAIL_ORDER_IDS[retailSeq++ % RETAIL_ORDER_IDS.length];
      var goods = r2((isProxy ? 420 : 96) + (oi % 7) * 18);
      var freight = r2(isProxy ? 24 + (oi % 4) * 6 : oi % 3 === 0 ? 12 : 0);
      var cost = r2(goods * (isProxy ? 0.68 : 0.52));
      orderDetails.push({
        orderId: oid,
        productIndex: productIndex,
        biz: isProxy ? '代采' : '零售',
        channel: isProxy ? '—' : oi % 2 === 0 ? '商城' : '直播',
        storeName: storeNames[oi % storeNames.length],
        payTime: '2026-11-' + String(12 + (oi % 8)) + ' ' + String(10 + (oi % 7)) + ':20',
        goodsSales: goods,
        freightSales: freight,
        purchaseCost: cost,
        goodsMargin: r2(goods - cost),
        storeIncome: isProxy ? null : r2((goods - cost) * 0.16),
        platformIncome: r2((goods - cost) * (isProxy ? 0.20 : 0.24) + (isProxy ? freight * 0.12 : 0)),
        refundAmount: oi % 6 === 0 ? r2(goods * 0.12) : 0,
        _protoSample: true
      });
    }

    /* 筛选应作用于明细行本身，不能只缩放汇总数值。代采没有商城／直播来源，选择渠道时不纳入该筛选结果。 */
    var scopedOrders = orderDetails.filter(function (row) {
      var store = STORES.filter(function (st) { return st.name === row.storeName; })[0];
      if (filters && filters.storeId && (!store || store.id !== filters.storeId)) return false;
      if (filters && filters.line && (!store || store.line !== filters.line)) return false;
      if (scope === 'proxy') return row.biz === '代采';
      if (scope === 'retail') return row.biz === '零售';
      if (channelFiltered) {
        return row.biz === '零售' &&
          ((filters.channel === 'mall' && row.channel === '商城') ||
            (filters.channel === 'live' && row.channel === '直播'));
      }
      return true;
    });

    orderDetails = scopedOrders.filter(function (row) { return matchesPeriod(filters, row.payTime); });
    var expenseTypes = [
      { type: '供应商货款', parties: ['鲜达优选供应链', '绿源生鲜批发', '汉言原料仓'] },
      { type: '直播费用', parties: ['望京场次 #L112', '南山周末场 #L108', '徐汇专场 #L106'] },
      { type: 'BD结算', parties: ['BD·王敏', 'BD·李昂', 'BD·周晴'] },
      { type: '门店分佣', parties: storeNames },
      { type: '积分兑换成本', parties: ['积分商城 · 兑换订单'] }
    ];
    var expenseDetails = [];
    for (var ei = 0; ei < 32; ei++) {
      var et = expenseTypes[ei % 4];
      expenseDetails.push({
        type: et.type,
        party: et.parties[ei % et.parties.length],
        amount: r2(
          ((et.type === '供应商货款' ? 2800 : et.type === '门店分佣' ? 620 : 380) +
            (ei % 9) * 55) *
            s
        ),
        status: ei % 3 === 0 ? '待结算' : '已结算',
        bizTime: '2026-11-' + String(11 + (ei % 8)),
        _protoSample: true
      });
    }
    expenseTypes.push({ type: '承运商结算' });
    scopedOrders.filter(function (order) { return order.freightSales > 0; }).forEach(function (order) {
      var sequence = Number(order.orderId.replace(/\D/g, '').slice(-2));
      var settled = sequence % 3 !== 0;
      var settlementDay = Number(order.payTime.slice(8, 10)) + (settled ? 1 : 0);
      var statusTime = '2026-11-' + settlementDay + ' 12:00';
      if (!matchesPeriod(filters, statusTime)) return;
      expenseDetails.push({
        type: '承运商结算',
        party: '示例承运商',
        amount: 8 + sequence % 7,
        status: settled ? '已结算' : '待结算',
        bizTime: statusTime.slice(0, 10),
        _protoSample: true
      });
    });
    expenseDetails.push({
      type: '积分兑换成本',
      party: '积分商城 · 兑换订单',
      amount: pointsExchangeCost,
      status: '已入账',
      bizTime: '2026-11-16',
      _protoSample: true
    });
    var expenseSummary = expenseTypes.map(function (et) {
      var rows = expenseDetails.filter(function (row) { return row.type === et.type; });
      return {
        type: et.type,
        amount: r2(rows.reduce(function (total, row) { return total + row.amount; }, 0)),
        count: rows.length
      };
    });
    var pointsExchangeDetails = [
      {
        orderId: 'ORD-PTS-20261116-01',
        product: '积分兑换米',
        supplierCost: r2(28.5 * s + 8),
        paid: r2(12.2 * s + 2),
        freightShare: r2(1.8),
        cost: r2((28.5 * s + 8) - (12.2 * s + 2) - 1.8),
        payTime: '2026-11-16 11:20'
      },
      {
        orderId: 'ORD-PTS-20261116-02',
        product: '积分兑换帆布袋',
        supplierCost: r2(16.4 * s + 4),
        paid: 0,
        freightShare: 0,
        cost: r2(16.4 * s + 4),
        payTime: '2026-11-16 15:05'
      },
      {
        orderId: 'ORD-PTS-20261117-01',
        product: '积分兑换毛巾',
        supplierCost: r2(22.1 * s + 5),
        paid: r2(6.5 * s),
        freightShare: r2(0.9),
        cost: r2((22.1 * s + 5) - 6.5 * s - 0.9),
        payTime: '2026-11-17 09:40'
      }
    ];

    return {
      demo: true,
      salesTotal: salesTotal,
      goodsSales: goodsSales,
      freightSales: freightSales,
      orderCount: orderCount,
      retailOrders: retailOrders,
      proxyOrders: proxyOrders,
      placeOrderCount: placeOrderCount,
      verifiedOrderCount: verifiedOrderCount,
      verifiedOrderAmount: verifiedOrderAmount,
      verifyRate: verifyRate,
      refundAmount: refundAmount,
      refundQty: refundQty,
      purchaseCost: purchaseCost,
      goodsMargin: goodsMargin,
      bdCommission: bdCommission,
      liveCommission: liveCommission,
      storeCommission: storeCommission,
      platformGoodsCommission: platformGoodsCommission,
      freightCommission: freightCommission,
      platformIncome: platformIncome,
      supplierPayment: supplierPayment,
      liveFee: liveFee,
      pointsExchangeCost: pointsExchangeCost,
      opsGrossProfit: opsGrossProfit,
      opsGrossRate: opsGrossRate,
      pointsExchangeDetails: pointsExchangeDetails,
      trend: trend,
      products: products,
      suppliers: suppliers,
      retailBreakdown: scope === 'all' || scope === 'retail' ? {
        mall: r2(salesTotal * (scope === 'all' ? 0.72 : 1) * 0.58),
        live: r2(salesTotal * (scope === 'all' ? 0.72 : 1) * 0.42)
      } : null,
      storeSales: storeSales,
      storeProxy: storeProxy,
      storeRank: storeRank,
      orderDetails: orderDetails,
      expenseDetails: expenseDetails,
      expenseSummary: expenseSummary,
      mix: retailOnly
        ? [{ name: '零售销售额', value: salesTotal, orders: retailOrders, color: '#ff7019' }]
        : proxyOnly
          ? [{ name: '代采销售额', value: salesTotal, orders: proxyOrders, color: '#1677ff' }]
          : [
            { name: '零售销售额', value: r2(salesTotal * 0.72), orders: retailOrders, color: '#ff7019' },
            { name: '代采销售额', value: r2(salesTotal * 0.28), orders: proxyOrders, color: '#1677ff' }
          ]
    };
  }

  function storeDaily(filters, mode) {
    if (mode === 'all') {
      var retail = storeDaily(Object.assign({}, filters, { channel: 'retail' }), 'sales');
      var proxy = storeDaily(Object.assign({}, filters, { channel: 'proxy' }), 'proxy');
      function combine(a, b) {
        var row = Object.assign({}, a);
        ['sales', 'goodsSales', 'freightSales', 'orders', 'refundAmount'].forEach(function (key) {
          if (typeof a[key] === 'number') row[key] = r2(a[key] + b[key]);
        });
        return row;
      }
      return {
        kpis: combine(retail.kpis, proxy.kpis),
        retailKpis: retail.kpis,
        proxyKpis: proxy.kpis,
        daily: retail.daily.map(function (row, index) { return combine(row, proxy.daily[index]); }),
        stores: retail.stores.map(function (row, index) { return combine(row, proxy.stores[index]); }),
        orders: retail.orders.concat(proxy.orders),
        products: retail.products.concat(proxy.products).sort(function (a, b) { return b.sales - a.sales; })
      };
    }
    var snap = erpSnapshot(filters);
    var orders = snap.orderDetails.filter(function (row) {
      return row.biz === (mode === 'proxy' ? '代采' : '零售');
    });
    var products = snap.products.filter(function (row) {
      return row.biz === (mode === 'proxy' ? '代采' : '零售');
    }).map(function (row, index) {
      var matched = orders.filter(function (order) {
        return order.productIndex === index;
      });
      return Object.assign({}, row, {
        orders: new Set(matched.map(function (order) { return order.orderId; })).size,
        storeNames: Array.from(new Set(matched.map(function (order) { return order.storeName; }))),
        storeIncome: mode !== 'proxy' && matched.length ? r2(matched.reduce(function (sum, order) { return sum + order.storeIncome; }, 0)) : null,
        platformIncome: matched.length ? r2(matched.reduce(function (sum, order) { return sum + order.platformIncome; }, 0)) : null
      });
    }).sort(function (a, b) { return b.sales - a.sales; });
    var s = scaleOf((filters && filters.period) || '30d') * filterFactor(filters);
    var days = [];
    for (var i = 0; i < 7; i++) {
      var w = 0.7 + (i % 3) * 0.12;
      days.push({
        date: '2026-11-' + (13 + i),
        sales: r2((mode === 'proxy' ? 4200 : 8600) * s * w),
        goodsSales: r2((mode === 'proxy' ? 3600 : 8000) * s * w),
        freightSales: r2((mode === 'proxy' ? 600 : 600) * s * w),
        orders: ri((mode === 'proxy' ? 8 : 36) * s * w),
        refundAmount: r2((mode === 'proxy' ? 120 : 280) * s * w)
      });
    }
    return {
      demo: true,
      mode: mode,
      kpis: mode === 'proxy'
        ? {
            sales: snap.storeProxy.reduce(function (a, b) { return a + b.sales; }, 0),
            orders: snap.storeProxy.reduce(function (a, b) { return a + b.orders; }, 0),
            refundAmount: snap.storeProxy.reduce(function (a, b) { return a + b.refundAmount; }, 0)
          }
        : {
            sales: snap.storeSales.reduce(function (a, b) { return a + b.sales; }, 0),
            orders: snap.storeSales.reduce(function (a, b) { return a + b.orders; }, 0),
            refundAmount: snap.storeSales.reduce(function (a, b) { return a + b.refundAmount; }, 0)
          },
      daily: days,
      products: products,
      stores: mode === 'proxy' ? snap.storeProxy : snap.storeSales,
      orders: orders
    };
  }

  function storeDetail(storeId, filters, mode) {
    var st = null;
    for (var i = 0; i < STORES.length; i++) {
      if (STORES[i].id === storeId) {
        st = STORES[i];
        break;
      }
    }
    var local = Object.assign({}, filters || {}, { storeId: storeId });
    var data = storeDaily(local, mode || 'sales');
    data.store = st;
    return data;
  }

  function posSnapshot(filters) {
    var rows = [];
    var mapping = {};
    try {
      mapping = JSON.parse(global.localStorage.getItem('lf-biz-pos-store-mapping-v1') || '{}') || {};
    } catch (error) {
      // 本地存储不可用时使用示例映射。
    }
    for (var day = 19; day >= 14; day--) {
      var date = '2026-11-' + day;
      if (!matchesPeriod(filters, date + ' 12:00')) continue;
      POS_STORE_MAP.filter(function (store) { return store.posId; }).forEach(function (store, index) {
        var erpId = mapping[store.posId] == null ? store.erpId : mapping[store.posId];
        if (!storeMatch(filters, erpId)) return;
        var amount = 320 + day * 37 + index * 280;
        var dineAmount = channelMatch(filters, 'dine') ? r2(amount * 0.62) : 0;
        var takeoutAmount = channelMatch(filters, 'takeout') ? r2(amount * 0.38) : 0;
        amount = r2(dineAmount + takeoutAmount);
        if (!amount) return;
        var pending = day === 19 || (day + index) % 7 === 0;
        var fee = pending ? null : r2(amount * 0.035);
        rows.push({
          billDate: date, storeName: store.posName, dineAmount: dineAmount, takeoutAmount: takeoutAmount,
          billAmount: amount, merchantReceive: pending ? null : r2(amount - fee), manageFee: fee,
          splitStatus: pending ? '待分账' : '已分账'
        });
      });
    }
    return { rows: rows, empty: !rows.length, note: '当前筛选范围内暂无示例账单。' };
  }

  function marketingTemplates() {
    var s = 1;
    return {
      demo: true,
      templates: [
        {
          id: 'TPL-BAG',
          name: '直播福袋',
          type: '福袋',
          metrics: [
            { label: '参与数', value: ri(12600 * s) },
            { label: '中奖数', value: ri(860 * s) },
            { label: '实际奖励发放数', value: ri(842 * s) }
          ],
          lives: [{ name: '望京晚间专场 #L112', useCount: ri(860 * s) }],
          memberStrategies: []
        },
        {
          id: 'TPL-SIGN',
          name: '连续签到',
          type: '签到',
          metrics: [
            { label: '参与用户数', value: ri(3260 * s) },
            { label: '奖励发放数', value: ri(2980 * s) }
          ],
          lives: [{ name: '签到直播场次' }],
          memberStrategies: []
        },
        {
          id: 'TPL-WATCH',
          name: '观看任务',
          type: '观看任务',
          metrics: [
            { label: '完成人数', value: ri(1860 * s) },
            { label: '观看时长（分钟）', value: ri(42800 * s) },
            { label: '奖励发放数', value: ri(1740 * s) }
          ],
          lives: [{ name: '南山周末场 #L108', useCount: ri(920 * s) }],
          memberStrategies: []
        },
        {
          id: 'TPL-RED',
          name: '现金红包',
          type: '现金红包',
          metrics: [
            { label: '配置发放数', value: ri(2000 * s) },
            { label: '配置发放金额', value: r2(20000 * s), money: true },
            { label: '实际领取数', value: ri(1680 * s) },
            { label: '实际领取金额', value: r2(16800 * s), money: true },
            { label: '未领取/过期数', value: ri(320 * s) },
            { label: '未领取/过期金额', value: r2(3200 * s), money: true }
          ],
          lives: [{ name: '望京晚间专场 #L112', useCount: ri(980 * s) }],
          memberStrategies: []
        },
        {
          id: 'TPL-MEMBER',
          name: '会员等级礼遇',
          type: '会员策略',
          metrics: [
            { label: '触发人数', value: ri(940 * s) },
            { label: '触发次数', value: ri(1120 * s) },
            { label: '权益发放', value: ri(940 * s) },
            { label: '权益使用', value: ri(610 * s) }
          ],
          lives: [],
          memberStrategies: [
            {
              name: '银卡升级礼',
              triggerUsers: ri(940 * s),
              triggerTimes: ri(1120 * s),
              grant: ri(940 * s),
              used: ri(610 * s)
            }
          ]
        }
      ]
    };
  }

  function marketingSnapshot(filters) {
    var couponMetrics = [
      { key: 'issued', label: '优惠券发放数' },
      { key: 'redeemed', label: '优惠券核销次数' },
      { key: 'amount', label: '优惠券核销金额', money: true }
    ];
    function summarizeCoupons(records) {
      var issues = new Set(records.map(function (record) { return record.couponId; }));
      var redemptions = new Map();
      records.forEach(function (record) {
        if (record.redemptionId && channelMatch(filters, record.redeemChannel)) {
          redemptions.set(record.redemptionId, record.discountCents);
        }
      });
      return { issued: issues.size, redeemed: redemptions.size,
        amount: Array.from(redemptions.values()).reduce(function (sum, cents) { return sum + cents; }, 0) / 100 };
    }
    var couponTemplates = [
      { id: 'CP-001', name: '满 50 减 5', type: '满减', discountCents: 500 },
      { id: 'CP-002', name: '满 100 减 10', type: '满减', discountCents: 1000 },
      { id: 'CP-003', name: '无门槛 3 元券', type: '无门槛', discountCents: 300 },
      { id: 'CP-004', name: '无门槛 5 元券', type: '无门槛', discountCents: 500 }
    ].concat(Array.from({ length: 20 }, function (_, index) {
      var amount = 2 + index % 9;
      var minimum = 30 + index * 10;
      return {
        id: 'CP-' + String(index + 5).padStart(3, '0'),
        name: index % 2 ? '无门槛 ' + amount + ' 元券 · 第 ' + (index + 5) + ' 期' : '满 ' + minimum + ' 减 ' + amount,
        type: index % 2 ? '无门槛' : '满减',
        discountCents: amount * 100
      };
    }));
    function couponTemplateRows(records) {
      return couponTemplates.map(function (coupon) {
        return Object.assign({}, coupon, summarizeCoupons(records.filter(function (record) {
          return record.templateId === coupon.id;
        })));
      }).filter(function (row) { return row.issued > 0; });
    }
    var couponRecords = [];
    var templates = marketingTemplates().templates.flatMap(function (template) {
      var signIn = template.id === 'TPL-SIGN';
      if (!signIn && template.id !== 'TPL-BAG' && template.id !== 'TPL-WATCH') return [template];
      // UAT 营销模板「签到全流程」仅直播，签到奖励按次数配置。
      var rewards = [
        { type: '优惠券' },
        { type: '积分', label: '实发积分', value: 4200 },
        { type: '商品', label: '实发商品份数', value: 136 },
        { type: '现金红包', label: '现金红包实发金额', value: 3300, money: true }
      ];
      if (signIn) rewards.push({ type: '无奖励', label: '无奖励签到次数', value: 320 });
      return rewards.map(function (reward, index) {
        var metrics = template.metrics.filter(function (metric) { return !metric.money; }).map(function (metric) {
          return {
            label: metric.label,
            value: reward.type === '无奖励' ? 0 : Math.round(metric.value / 4)
          };
        });
        var commonMetricCount = metrics.length;
        if (reward.type !== '优惠券') metrics.push(reward);
        return Object.assign({}, template, {
          id: template.id + '-' + index, name: template.name + '（' + reward.type + '）',
          parentId: template.id, parentName: template.name,
          commonMetricCount: commonMetricCount,
          rewardType: reward.type, amountLabel: reward.money ? reward.label : '', metrics: metrics
        });
      });
    });
    var records = [];
    for (var i = 0; i < 42; i++) {
      var store = STORES[i % STORES.length];
      records.push({
        store: store,
        channel: i % 3 === 0 ? 'mall' : 'live',
        time: '2026-11-' + (12 + (i % 8)) + ' 14:00',
        sequence: i + 1
      });
    }
    var selected = records.filter(function (row) {
      return storeMatch(filters, row.store.id) && lineMatch(filters, row.store.line) &&
        channelMatch(filters, row.channel) && matchesPeriod(filters, row.time);
    });
    var liveRecords = records.filter(function (row) { return row.channel === 'live'; });
    templates = templates.map(function (template) {
      var eligible = template.lives.length && !template.memberStrategies.length ? liveRecords : records;
      var scoped = selected.filter(function (row) { return eligible.indexOf(row) >= 0; });
      // 示例活动用户在场次之间可重复，按用户编号聚合。
      var users = new Set();
      var liveUsers = new Set();
      var usersByRecord = {};
      scoped.forEach(function (row) {
        var ids = Array.from({ length: 30 + row.sequence % 21 }, function (_, index) {
          return (row.sequence * 17 + index) % 240;
        });
        usersByRecord[row.sequence] = ids;
        ids.forEach(function (id) {
          users.add(id);
          if (row.channel === 'live' && template.lives.length) liveUsers.add(id);
        });
      });
      template.userCount = users.size;
      template.liveUserCount = liveUsers.size;
      template.memberLevels = ['普通会员', '银卡会员', '金卡会员'].map(function (level, index) {
        return { level: level, count: Array.from(users).filter(function (id) { return id % 3 === index; }).length };
      });
      var share = scoped.length / eligible.length;
      var metricRows = {};
      var selectedIds = new Set(scoped.map(function (row) { return row.sequence; }));
      template.metrics.forEach(function (metric, index) {
        var units = Math.round(metric.value * (metric.money ? 100 : 1));
        var weights = eligible.map(function (row) { return 4 + (row.sequence * 13 % 17); });
        var totalWeight = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
        var accumulated = 0;
        var previous = 0;
        var filteredTotal = 0;
        eligible.forEach(function (row, position) {
          accumulated += weights[position];
          var allocated = Math.round(units * accumulated / totalWeight);
          var value = allocated - previous;
          previous = allocated;
          if (!selectedIds.has(row.sequence)) return;
          filteredTotal += value;
          if (!metricRows[row.sequence]) metricRows[row.sequence] = {};
          metricRows[row.sequence]['metric' + index] = metric.money ? value / 100 : value;
        });
        metric.value = metric.money ? filteredTotal / 100 : filteredTotal;
      });
      template.supportsLiveSessions = template.lives.length > 0;
      template.lives = template.supportsLiveSessions ? scoped.filter(function (row) {
        return row.channel === 'live';
      }).map(function (row) {
        return Object.assign({
          name: row.store.name + ' · 直播 #' + row.sequence,
          time: row.time,
          sequence: row.sequence,
          userCount: usersByRecord[row.sequence].length
        }, metricRows[row.sequence]);
      }).sort(function (a, b) { return b.time.localeCompare(a.time); }) : [];
      if (template.rewardType === '优惠券' || template.id === 'TPL-MEMBER') {
        var sourceRecords = eligible.filter(function (row) {
          return storeMatch(filters, row.store.id) && lineMatch(filters, row.store.line) && matchesPeriod(filters, row.time);
        }).flatMap(function (row) {
          return Array.from({ length: 3 + row.sequence % 8 }, function (_, index) {
            var id = template.id + '-' + row.sequence + '-' + index;
            var coupon = couponTemplates[(row.sequence + index + (template.id === 'TPL-MEMBER' ? 1 : 0)) % couponTemplates.length];
            return { couponId: id, sequence: row.sequence,
              source: template.parentId || template.id,
              type: coupon.type, templateId: coupon.id,
              redeemChannel: (row.sequence + index * 3) % 5 < 2 ? 'mall' : 'live',
              redemptionId: index % 3 ? 'R-' + id : '', discountCents: coupon.discountCents };
          });
        });
        couponRecords.push.apply(couponRecords, sourceRecords);
        var total = summarizeCoupons(sourceRecords);
        template.couponTemplates = couponTemplateRows(sourceRecords);
        template.couponMetrics = couponMetrics.map(function (metric) {
          return Object.assign({}, metric, { value: total[metric.key] });
        });
        if (template.rewardType === '优惠券') {
          var firstIndex = template.metrics.length;
          template.metrics = template.metrics.concat(template.couponMetrics);
          template.amountLabel = '优惠券核销金额';
          template.lives.forEach(function (row) {
            var totals = summarizeCoupons(sourceRecords.filter(function (record) { return record.sequence === row.sequence; }));
            couponMetrics.forEach(function (metric, index) { row['metric' + (firstIndex + index)] = totals[metric.key]; });
          });
        }
      }
      if (template.rewardType === '商品') {
        // 原型统一采用每份 12.50 元的示例成本。
        var quantityIndex = template.metrics.length - 1;
        var costIndex = template.metrics.length;
        template.lives.forEach(function (row) {
          row['metric' + costIndex] = r2(row['metric' + quantityIndex] * 12.5);
        });
        template.metrics.push({
          label: '商品成本', money: true,
          value: r2(template.lives.reduce(function (total, row) { return total + row['metric' + costIndex]; }, 0))
        });
        template.amountLabel = '商品成本';
      }
      template.memberStrategies = share ? template.memberStrategies.map(function (strategy) {
        return {
          name: strategy.name,
          triggerUsers: ri(strategy.triggerUsers * share),
          triggerTimes: ri(strategy.triggerTimes * share),
          grant: ri(strategy.grant * share),
          used: ri(strategy.used * share)
        };
      }) : [];
      return template;
    });
    return { demo: true, templates: templates, couponTemplates: couponTemplateRows(couponRecords), couponSummary: [
      Object.assign({ type: '合计' }, summarizeCoupons(couponRecords))
    ].concat(['满减', '无门槛'].map(function (type) {
      return Object.assign({ type: type }, summarizeCoupons(couponRecords.filter(function (record) { return record.type === type; })));
    })) };
  }

  function pointsSnapshot(filters) {
    var details = [
      { time: '2026-11-19 16:42', user: '138****6210', type: '发放', scene: '消费送积分', points: 128, balanceAfter: 1860, storeId: 'ST-BJ-01' },
      { time: '2026-11-19 15:18', user: '139****8831', type: '消耗', scene: '积分抵现', points: -50, balanceAfter: 420, storeId: 'ST-HZ-01',
        channel: 'mall', rateCents: 1, maxRatio: 50, deductionCents: 50 },
      { time: '2026-11-19 14:05', user: '136****2209', type: '发放', scene: '签到奖励', points: 10, balanceAfter: 310 },
      { time: '2026-11-18 21:30', user: '137****4412', type: '消耗', scene: '积分商城兑换', points: -200, balanceAfter: 80 },
      { time: '2026-11-18 11:02', user: '135****9088', type: '发放', scene: '注册有礼', points: 100, balanceAfter: 100 },
      { time: '2026-11-18 10:15', user: '138****6210', type: '发放', scene: '消费送积分', points: 85, balanceAfter: 1732, storeId: 'ST-BJ-01' },
      { time: '2026-11-17 13:20', user: '139****8831', type: '消耗', scene: '积分抵现', points: -30, balanceAfter: 470, storeId: 'ST-HZ-01',
        channel: 'mall', rateCents: 1, maxRatio: 50, deductionCents: 30 }
    ].concat(Array.from({ length: 30 }, function (_, index) {
      var spent = index % 3 === 0;
      var exchange = spent && index % 9 === 0;
      var live = !exchange && index % 2 === 0;
      var row = {
        time: '2026-11-' + (16 - Math.floor(index / 6)) + ' ' + (16 - index % 6) + ':00',
        user: '130****' + (7000 + index),
        type: spent ? '消耗' : '发放',
        scene: exchange ? '积分商城兑换' : spent ? '积分抵现' : live ? '观看任务奖励' : '消费送积分',
        points: spent ? -20 - index : 25 + index,
        balanceAfter: 200 + index * 5,
        storeId: index % 4 === 3 ? 'ST-HZ-01' : 'ST-BJ-01',
        channel: live ? 'live' : 'mall'
      };
      if (spent && !exchange) {
        // 示例订单记录的规则快照和成功抵现结果。
        row.rateCents = live ? 2 : 1;
        row.maxRatio = live ? 40 : 50;
        row.deductionCents = (20 + index) * row.rateCents;
      }
      return row;
    })).filter(function (row) {
      var store = STORES.find(function (entry) { return entry.id === row.storeId; });
      row.storeName = store ? store.name : '平台';
      row.line = store ? store.line : '—';
      row.channel = row.channel || (row.scene === '签到奖励' ? 'live' : row.scene === '注册有礼' ? '' : 'mall');
      return storeMatch(filters, row.storeId) && channelMatch(filters, row.channel) && matchesPeriod(filters, row.time);
    }).sort(function (a, b) { return b.time.localeCompare(a.time); });
    return {
      demo: true,
      issued: details.reduce(function (total, row) { return total + Math.max(0, row.points); }, 0),
      consumed: details.reduce(function (total, row) { return total + Math.max(0, -row.points); }, 0),
      balance: ri(1286400),
      details: details
    };
  }

  var GLOSSARY = [
    {
      name: '销售额',
      text: '支付成功订单的实付金额（含运费），按支付成功时间统计。商品金额与运费拆分展示。积分/优惠券不影响商品销售价口径。'
    },
    {
      name: '退款金额',
      text: '仅统计成功退款，按退款成功发生时间单独展示；售后驳回不计。退款金额不回写扣减销售额或采购成本。'
    },
    {
      name: '商品销售额',
      text: '订单商品快照：商品单价×实际销售数量（零售/代采取对应维护价格）。'
    },
    {
      name: '采购成本',
      text: '商品采购成本字段×实际销售数量；不因退款冲减。'
    },
    {
      name: '商品毛利',
      text: '商品销售额−采购成本。'
    },
    {
      name: '商品平台分佣',
      text: '商品毛利−BD分佣−直播分佣−门店分佣。'
    },
    {
      name: '平台分佣所得',
      text: '商品平台分佣＋运费分佣。与食亨管理费分属不同数据域，绝不合并。'
    },
    {
      name: '经营支出',
      text: '包含供应商货款、直播费用、BD结算、门店分佣、承运商结算与积分兑换成本。承运商支出取承运商结款金额。系统流量费、系统手续费无业务系统数据源，不接入本页。'
    },
    {
      name: '积分兑换成本',
      text: '运营成本（福利、秒杀优惠）项。取自研零售清分：商品类目为积分商品的订单，「供应商成本 − 订单实付金额（含分摊运费）」。不计入正常商品销售额。'
    },
    {
      name: '运营毛利 / 运营毛利率',
      text: '财务经营表「运营毛利及毛利率」。毛利率＝运营毛利÷销售额（销售收入）。运营毛利正式环境对齐财务核算公式；原型按经营表合计数演示（原表公式格曾为 #REF!）。不含系统流量费、系统手续费（无系统数据源）。'
    },
    {
      name: '总下单数',
      text: '筛选期内创建的主订单数（含未支付、取消等），不等于支付成功主订单数。'
    },
    {
      name: '已核销订单金额 / 已核销订单数',
      text: '订单状态为「交易成功」的主订单实付金额合计，及对应主订单数。与优惠券核销不是同一概念。'
    },
    {
      name: '核销率',
      text: '已核销订单数 ÷ 总下单数。'
    },
    {
      name: '门店销售 / 门店进货',
      text: '门店销售仅统计零售订单，金额称「销售额」。门店进货仅统计代采订单，金额称「进货额／代采进货额」，不称销售额。二者分开，不合并为门店营业额。'
    },
    {
      name: '食亨POS',
      text: '独立数据域。按账单日、门店、渠道展示账单金额、商户实收、管理费、分账状态。不与 ERP 重复汇总。'
    },
    {
      name: '营销活动',
      text: '计划、成功发放、实际领取与成功核销各按发生时间统计。计划发放、成功发放及领取金额由券面额与红包金额组成。实际使用金额由订单用券抵扣、红包到账、实发商品采购成本及订单实际积分抵现组成。积分同时按数量展示。涉及用户数按实际发放、领取或使用记录去重。'
    },
    {
      name: 'RBT联营 · 贸易商投入',
      text: '贸易商签约完成后划拨成功、进入发货中起计入。冻结不算投入。总投入不区分在途，含发货中已划拨。'
    },
    {
      name: 'RBT联营 · 约定回收',
      text: '发布成功进入待接单时固化：商品金额×当时门店结算系数（门店按合同应付的联营总额，不是门店营业额）。之后改渠道比例或产品系数不重算该快照。剩余＝约定−已履行净额。'
    },
    {
      name: 'RBT联营 · 已履行 / 三方拆分',
      text: '与 RBT 履约一致：最近营业日为预计履行（结算时间未执行），更早为已履行（次日 08:00）；一键履约支付成功即已履行。看板汇总只计已履行。拆分为贸易商回收、冷丰实得、服务商计提。不进经营总览销售额与 ERP 平台分佣。'
    },
    {
      name: 'RBT联营 · 营业基数',
      text: '所得佣金与门店经营中心渠道数据同源，再×本单渠道结算比例。一期不因消费者退款重算已落定履行。'
    },
    {
      name: '导出权限',
      text: '财务与管理员可查看；导出受当前账户权限与页面筛选条件约束。'
    }
  ];

  /**
   * RBT 联营专题快照（原型示例）。
   * 状态机对齐知页：发货中（已划拨投入）→ 收货后门店付款中（履约）→ 已完成。
   * 不进 GMV / ERP 平台分佣；公司无投入，只收已履行冷丰实得。
   */
  function rbtSnapshot(filters) {
    var f = filters || {};
    var period = f.period || '30d';
    var s = scaleOf(period);
    var raw = [
      {
        demandCode: 'XQ00031',
        storeId: 'ST-HZ-01',
        storeName: '汉言·西溪店',
        traderName: '杭州鲜达贸易有限公司',
        providerName: '',
        status: '发货中',
        goodsAmount: 50000,
        agreedRecoup: 80000,
        investAt: '2026-11-08 16:42:18',
        receiptAt: '',
        invest: 50000,
        fulfilled: 0,
        lengfeng: 0,
        provider: 0,
        traderShare: 0
      },
      {
        demandCode: 'XQ00028',
        storeId: 'ST-BJ-02',
        storeName: '冷丰锅贴·中关村店',
        traderName: '鲜达优选供应链',
        providerName: '华东联营服务商',
        status: '门店付款中',
        goodsAmount: 30000,
        agreedRecoup: 48000,
        investAt: '2026-11-05 11:20:00',
        receiptAt: '2026-11-07 09:15:00',
        invest: 30000,
        fulfilled: r2(12800 * s),
        lengfeng: r2(3200 * s),
        provider: r2(640 * s),
        traderShare: r2(8960 * s)
      },
      {
        demandCode: 'XQ00023',
        storeId: 'ST-SH-01',
        storeName: '冷丰特选·徐汇店',
        traderName: '绿源生鲜批发',
        providerName: '',
        status: '已完成',
        goodsAmount: 20000,
        agreedRecoup: 32000,
        investAt: '2026-10-12 14:08:00',
        receiptAt: '2026-10-15 10:00:00',
        invest: 20000,
        fulfilled: 32000,
        lengfeng: 8000,
        provider: 0,
        traderShare: 24000
      },
      {
        demandCode: 'XQ00019',
        storeId: 'ST-SZ-01',
        storeName: '冷丰锅贴·南山店',
        traderName: '杭州鲜达贸易有限公司',
        providerName: '',
        status: '门店付款中',
        goodsAmount: 15000,
        agreedRecoup: 24000,
        investAt: '2026-11-10 18:30:00',
        receiptAt: '2026-11-12 16:05:00',
        invest: 15000,
        fulfilled: r2(5600 * s),
        lengfeng: r2(1400 * s),
        provider: 0,
        traderShare: r2(4200 * s)
      }
    ];

    // 独立示例单用于展示多页与履约状态，不关联 RBT 需求详情。
    raw = raw.concat(Array.from({ length: 9 }, function (_, index) {
      var store = STORES[index % STORES.length];
      var completed = index % 3 === 2;
      var agreed = 18000 + index * 2000;
      var fulfilled = completed ? agreed : r2(agreed * [0.12, 0.53, 0.8][index % 3] * s);
      var provider = index % 2 ? r2(fulfilled * 0.05) : 0;
      var lengfeng = r2(fulfilled * 0.2);
      var date = '2026-11-' + String(10 + index).padStart(2, '0');
      return {
        demandCode: 'DEMO-RBT-' + String(index + 1).padStart(2, '0'),
        storeId: store.id, storeName: store.name, traderName: '示例贸易商 ' + (index % 3 + 1),
        providerName: provider ? '示例联营服务商' : '', status: completed ? '已完成' : '门店付款中',
        goodsAmount: agreed * 0.6, agreedRecoup: agreed, invest: agreed * 0.6,
        investAt: date + ' 09:00:00', receiptAt: date + ' 16:00:00',
        fulfilled: fulfilled, lengfeng: lengfeng, provider: provider,
        traderShare: r2(fulfilled - lengfeng - provider),
        riskGrade: completed ? '—' : ['预警', '正常', '—', '异常', '关注'][index % 5]
      };
    }));
    var statusKey = f.tab || f.rbtStatus || '';
    var statusMap = {
      shipping: '发货中',
      paying: '门店付款中',
      done: '已完成'
    };
    var wantStatus = statusMap[statusKey] || '';

    var rows = raw
      .filter(function (row) {
        if (!storeMatch(f, row.storeId)) return false;
        if (wantStatus && row.status !== wantStatus) return false;
        return true;
      })
      .map(function (row) {
        var remain = r2(Math.max(0, row.agreedRecoup - row.fulfilled));
        var progress =
          row.agreedRecoup > 0 ? r2((row.fulfilled / row.agreedRecoup) * 100) : 0;
        return Object.assign({}, row, {
          remain: remain,
          progress: progress,
          phase:
            row.status === '门店付款中' && remain > 0
              ? '履约中'
              : row.status === '已完成' || remain <= 0
                ? '已完成'
                : '发货中'
        });
      });

    function sum(key) {
      return r2(
        rows.reduce(function (total, row) {
          return total + (Number(row[key]) || 0);
        }, 0)
      );
    }

    var fulfillRows = [
      {
        demandCode: 'XQ00028',
        date: '2026-11-16',
        channel: 'POS',
        commission: r2(980 * s),
        ratio: '10.00%',
        actual: r2(98 * s),
        payMethod: '营业收入自动扣款',
        fulfillStatus: '已履行',
        lengfeng: r2(24.5 * s),
        provider: r2(4.9 * s),
        traderShare: r2(68.6 * s)
      },
      {
        demandCode: 'XQ00028',
        date: '2026-11-17',
        channel: '直播',
        commission: r2(560 * s),
        ratio: '10.00%',
        actual: r2(56 * s),
        payMethod: '营业收入自动扣款',
        fulfillStatus: '已履行',
        lengfeng: r2(14 * s),
        provider: r2(2.8 * s),
        traderShare: r2(39.2 * s)
      },
      {
        demandCode: 'XQ00028',
        date: '2026-11-18',
        channel: '一键履约',
        commission: null,
        ratio: '—',
        actual: r2(500 * s),
        payMethod: '支付宝',
        payTime: '15:20:08',
        fulfillStatus: '已履行',
        lengfeng: r2(125 * s),
        provider: r2(25 * s),
        traderShare: r2(350 * s)
      },
      {
        demandCode: 'XQ00019',
        date: '2026-11-18',
        channel: '商城',
        commission: r2(310 * s),
        ratio: '10.00%',
        actual: r2(31 * s),
        payMethod: '营业收入自动扣款',
        fulfillStatus: '预计履行',
        lengfeng: r2(7.75 * s),
        provider: 0,
        traderShare: r2(23.25 * s)
      }
    ].filter(function (row) {
      if (!rows.some(function (d) { return d.demandCode === row.demandCode; })) return false;
      return true;
    });

    return {
      demo: true,
      investTotal: sum('invest'),
      agreedTotal: sum('agreedRecoup'),
      fulfilledTotal: sum('fulfilled'),
      remainTotal: sum('remain'),
      lengfengConfirmed: r2(
        rows.reduce(function (total, row) {
          return total + (Number(row.lengfeng) || 0);
        }, 0)
      ),
      providerAccrued: sum('provider'),
      traderRecouped: sum('traderShare'),
      shippingCount: rows.filter(function (row) { return row.status === '发货中'; }).length,
      payingCount: rows.filter(function (row) { return row.status === '门店付款中'; }).length,
      doneCount: rows.filter(function (row) { return row.status === '已完成'; }).length,
      demands: rows,
      fulfillRows: fulfillRows
    };
  }

  global.MdmDataBizCenter = {
    AS_OF: AS_OF,
    DEMO_LABEL: DEMO_LABEL,
    STORES: STORES,
    SUPPLIERS: SUPPLIERS,
    POS_STORE_MAP: POS_STORE_MAP,
    LINES: ['餐饮', '康美', '纯私域'],
    GLOSSARY: GLOSSARY,
    erpSnapshot: erpSnapshot,
    storeDaily: storeDaily,
    storeDetail: storeDetail,
    posSnapshot: posSnapshot,
    marketingSnapshot: marketingSnapshot,
    pointsSnapshot: pointsSnapshot,
    rbtSnapshot: rbtSnapshot,
    scaleOf: scaleOf
  };
})(typeof window !== 'undefined' ? window : this);
