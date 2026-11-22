/**
 * 平台经营概览 · 演示数据
 * 角色：平台 / 门店 / 供应商 / 仓库；范围：该角色全部 / 指定主体（平台仅全部）
 * 平台收益与 GMV 分列，不可相加（CO_REV / 分佣 / RBT 冷丰营收）
 */
(function (global) {
  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function scaleOf(range) {
    if (range === 'today') return 0.08;
    if (range === '7d') return 0.28;
    if (range === 'custom') return 0.65;
    return 1;
  }

  function normalizeRange(range) {
    if (range === 'today' || range === '7d' || range === 'custom') return range;
    return '30d';
  }

  function normalizeRole(role) {
    if (role === 'platform' || role === 'supplier' || role === 'warehouse') return role;
    return 'store';
  }

  /** 平台收益演示基准（近30天）；与门店 GMV 分列 */
  var PLATFORM_BASE = {
    orders: 528,
    gmv: 61420,
    storeComm: 8640.5,
    storeCommPending: 2180.2,
    storeCommCredited: 6460.3,
    supplierShare: 41280.6,
    supplierSettled: 28600,
    supplierArrived: 24100,
    rbtAgreed: 111000,
    rbtActual: 39700.5,
    rbtRemain: 71299.5,
    platformFee: 1860.4,
    trendRev: [820, 960, 780, 1100, 1050, 980, 1200],
    trendOrders: [62, 71, 58, 80, 76, 70, 88]
  };

  var STORES = [
    {
      code: 'ONS00001',
      name: '西湖中心生鲜店',
      base: { paid: 18620, refund: 820, orders: 146, activeDays: 22 },
      trend: [420, 510, 380, 620, 710, 580, 640],
      jv: { agreed: 28600, actual: 12800.5, remain: 15799.5 },
      asAmount: 920,
      asCount: 18
    },
    {
      code: 'ONS00002',
      name: '东城和平里生鲜店',
      base: { paid: 9800, refund: 460, orders: 88, activeDays: 18 },
      trend: [280, 260, 300, 240, 310, 290, 270],
      jv: { agreed: 19800, actual: 6200, remain: 13600 },
      asAmount: 480,
      asCount: 11
    },
    {
      code: 'ONS00003',
      name: '河东大桥道自提点',
      base: { paid: 4200, refund: 180, orders: 52, activeDays: 14 },
      trend: [120, 90, 140, 110, 130, 100, 150],
      jv: { agreed: 12000, actual: 0, remain: 12000 },
      asAmount: 210,
      asCount: 5
    },
    {
      code: 'ONS00004',
      name: '五角场体验店',
      base: { paid: 22400, refund: 960, orders: 178, activeDays: 24 },
      trend: [600, 720, 580, 810, 760, 690, 800],
      jv: { agreed: 42000, actual: 18600, remain: 23400 },
      asAmount: 1280,
      asCount: 24
    },
    {
      code: 'ONS00005',
      name: '余杭仓前便利店',
      base: { paid: 6400, refund: 320, orders: 64, activeDays: 16 },
      trend: [180, 160, 200, 150, 210, 170, 190],
      jv: { agreed: 8600, actual: 2100, remain: 6500 },
      asAmount: 360,
      asCount: 8
    }
  ];

  /** 供应商：供货规模 / 履约 / 结算（对齐供应商数据中心口径，演示） */
  var SUPPLIERS = [
    {
      code: 'SUP00001',
      name: '鲜达优选供应链',
      base: {
        gmv: 64280,
        orders: 168,
        pendingShip: 8,
        shipped: 152,
        settleable: 18620.5,
        settled: 12400,
        arrived: 9800,
        asCount: 12,
        asAmount: 2180.6
      },
      trend: [5200, 6100, 4800, 7200, 6900, 6400, 7800]
    },
    {
      code: 'SUP00002',
      name: '绿源生鲜批发',
      base: {
        gmv: 42800,
        orders: 126,
        pendingShip: 5,
        shipped: 118,
        settleable: 13200,
        settled: 9100,
        arrived: 7600,
        asCount: 7,
        asAmount: 980
      },
      trend: [3800, 4200, 3600, 4500, 4300, 4100, 4800]
    },
    {
      code: 'SUP00003',
      name: '海河冷链食材',
      base: {
        gmv: 28600,
        orders: 94,
        pendingShip: 11,
        shipped: 78,
        settleable: 8600,
        settled: 5400,
        arrived: 4100,
        asCount: 9,
        asAmount: 1420
      },
      trend: [2400, 2800, 2200, 3100, 2900, 2700, 3200]
    },
    {
      code: 'SUP00004',
      name: '田园直供合作社',
      base: {
        gmv: 19800,
        orders: 72,
        pendingShip: 3,
        shipped: 66,
        settleable: 6200,
        settled: 4800,
        arrived: 4500,
        asCount: 4,
        asAmount: 560
      },
      trend: [1800, 2100, 1600, 2300, 2200, 2000, 2500]
    }
  ];

  /** 仓库：出入库 / 履约节点（演示） */
  var WAREHOUSES = [
    {
      code: 'WH00001',
      name: '杭州余杭中心仓',
      base: {
        outbound: 1860,
        pendingOut: 42,
        shipped: 1780,
        arrivedStore: 1690,
        stockout: 18,
        abnormal: 6,
        skuSku: 3200,
        asCount: 14
      },
      trend: [210, 240, 190, 260, 250, 230, 280]
    },
    {
      code: 'WH00002',
      name: '上海嘉定仓',
      base: {
        outbound: 1420,
        pendingOut: 28,
        shipped: 1360,
        arrivedStore: 1290,
        stockout: 12,
        abnormal: 4,
        skuSku: 2480,
        asCount: 9
      },
      trend: [160, 180, 150, 200, 190, 170, 210]
    },
    {
      code: 'WH00003',
      name: '天津武清仓',
      base: {
        outbound: 980,
        pendingOut: 35,
        shipped: 920,
        arrivedStore: 860,
        stockout: 22,
        abnormal: 8,
        skuSku: 1860,
        asCount: 11
      },
      trend: [110, 130, 100, 150, 140, 120, 160]
    }
  ];

  function applyScale(base, range, keys) {
    var s = scaleOf(range);
    var out = {};
    keys.forEach(function (k) {
      var v = base[k];
      if (typeof v === 'number') {
        out[k] = k.indexOf('pending') >= 0 || k === 'skuSku' ? Math.max(0, Math.round(v * (range === 'today' ? 1 : s === 1 ? 1 : Math.max(0.4, s)))) : round2(v * s);
        if (k === 'pendingShip' || k === 'pendingOut' || k === 'stockout' || k === 'abnormal' || k === 'asCount' || k === 'orders' || k === 'shipped' || k === 'outbound' || k === 'arrivedStore' || k === 'activeDays') {
          out[k] = Math.round(out[k]);
        }
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  function scaleTrend(trend, range) {
    var s = scaleOf(range);
    return (trend || []).map(function (v) {
      return round2(Number(v) * s);
    });
  }

  function findByCode(list, code) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === code) return list[i];
    }
    return null;
  }

  function listEntities(role) {
    var r = normalizeRole(role);
    if (r === 'supplier') {
      return SUPPLIERS.map(function (x) {
        return { code: x.code, name: x.name };
      });
    }
    if (r === 'warehouse') {
      return WAREHOUSES.map(function (x) {
        return { code: x.code, name: x.name };
      });
    }
    return STORES.map(function (x) {
      return { code: x.code, name: x.name };
    });
  }

  function roleMeta(role) {
    var r = normalizeRole(role);
    if (r === 'platform') {
      return {
        role: 'platform',
        roleLabel: '平台',
        entityLabel: '平台',
        allLabel: '平台整体',
        hideEntity: true
      };
    }
    if (r === 'supplier') {
      return {
        role: 'supplier',
        roleLabel: '供应商',
        entityLabel: '供应商',
        allLabel: '全部供应商'
      };
    }
    if (r === 'warehouse') {
      return {
        role: 'warehouse',
        roleLabel: '仓库',
        entityLabel: '仓库',
        allLabel: '全部仓库'
      };
    }
    return {
      role: 'store',
      roleLabel: '门店',
      entityLabel: '门店',
      allLabel: '全部门店'
    };
  }

  function buildPlatformPack(range) {
    var rangeKey = normalizeRange(range);
    var s = scaleOf(rangeKey);
    var orders = Math.round(PLATFORM_BASE.orders * s);
    var gmv = round2(PLATFORM_BASE.gmv * s);
    var storeComm = round2(PLATFORM_BASE.storeComm * s);
    var storePending = round2(PLATFORM_BASE.storeCommPending * s);
    var storeCredited = round2(PLATFORM_BASE.storeCommCredited * s);
    var supplierShare = round2(PLATFORM_BASE.supplierShare * s);
    var supplierSettled = round2(PLATFORM_BASE.supplierSettled * s);
    var supplierArrived = round2(PLATFORM_BASE.supplierArrived * s);
    var rbtAgreed = PLATFORM_BASE.rbtAgreed;
    var rbtActual = round2(PLATFORM_BASE.rbtActual * Math.min(1, s + 0.15));
    var rbtRemain = round2(Math.max(0, rbtAgreed - rbtActual));
    var platformFee = round2(PLATFORM_BASE.platformFee * s);
    /* 平台营收演示＝佣金差额型费项 + RBT 已回收中的平台份（演示取已回收）+ 其它费项；与分出金额分列 */
    var platformRev = round2(platformFee + rbtActual * 0.12);
    var trend = (PLATFORM_BASE.trendRev || []).map(function (v) {
      return round2(v * s);
    });

    var composition = [
      {
        id: 'store',
        label: '门店分佣',
        value: storeComm,
        color: '#1677ff',
        tip: '按商品实付清分给门店的佣金（含待结／已入账）'
      },
      {
        id: 'supplier',
        label: '供应商分佣',
        value: supplierShare,
        color: '#13c2c2',
        tip: '供应商货款结算口径（演示）；≠ 平台营收'
      },
      {
        id: 'rbt',
        label: 'RBT 平台营收',
        value: round2(rbtActual * 0.12),
        color: '#fa8c16',
        tip: '联营回收中归属平台的部分（演示按已回收×平台份额）'
      },
      {
        id: 'fee',
        label: '其它平台费项',
        value: platformFee,
        color: '#722ed1',
        tip: '服务费／差额等（费项清单细表暂缓，演示汇总）'
      }
    ];
    var compositionTotal = composition.reduce(function (acc, row) {
      return round2(acc + row.value);
    }, 0);

    return {
      empty: false,
      entityCode: '',
      entityName: '',
      hideEntity: true,
      kpis: [
        { label: '平台订单量', value: orders, format: 'int', hint: '时段内支付成功主订单数' },
        { label: '支付 GMV', value: gmv, format: 'money', hint: '与平台营收分列，请勿相加' },
        { label: '平台营收', value: platformRev, format: 'money', hint: 'RBT 平台份＋其它费项（演示）' },
        { label: '门店分佣', value: storeComm, format: 'money', hint: '待结＋已入账' },
        { label: '供应商分佣', value: supplierShare, format: 'money', hint: '货款结算口径' }
      ],
      trend: trend,
      trendTitle: '平台营收趋势',
      composition: composition,
      compositionTotal: compositionTotal,
      compositionTitle: '收益构成（直观对照）',
      rankingTitle: '收益构成明细',
      rankingCols: [
        { key: 'value', label: '金额', format: 'money' },
        { key: 'share', label: '占比', format: 'text' },
        { key: 'tip', label: '说明', format: 'text' }
      ],
      ranking: composition.map(function (row) {
        var pct =
          compositionTotal > 0 ? round2((row.value / compositionTotal) * 100) + '%' : '—';
        return {
          code: row.id,
          name: row.label,
          value: row.value,
          share: pct,
          tip: row.tip
        };
      }),
      panels: [
        {
          title: '门店分佣',
          metrics: [
            { label: '分佣合计', value: storeComm, format: 'money' },
            { label: '待结佣金', value: storePending, format: 'money' },
            { label: '已入账', value: storeCredited, format: 'money' }
          ]
        },
        {
          title: '供应商分佣（货款）',
          metrics: [
            { label: '应结货款', value: supplierShare, format: 'money' },
            { label: '已结算', value: supplierSettled, format: 'money' },
            { label: '已到账', value: supplierArrived, format: 'money' }
          ]
        },
        {
          title: 'RBT 平台营收',
          metrics: [
            { label: '约定回收（门店侧）', value: rbtAgreed, format: 'money' },
            { label: '已回收', value: rbtActual, format: 'money' },
            { label: '平台营收份', value: round2(rbtActual * 0.12), format: 'money' },
            { label: '剩余回收', value: rbtRemain, format: 'money' }
          ]
        }
      ],
      hint:
        '当前角色：平台 · 平台订单量／门店分佣／供应商分佣／RBT 平台营收分列展示；GMV 与平台营收不可相加'
    };
  }

  function buildStorePack(scope, code, range) {
    var rangeKey = normalizeRange(range);
    var keys = ['paid', 'refund', 'orders', 'activeDays'];
    function rowPack(row) {
      var b = applyScale(row.base, rangeKey, keys);
      var asCount = Math.round(row.asCount * scaleOf(rangeKey));
      var asAmount = round2(row.asAmount * scaleOf(rangeKey));
      return {
        code: row.code,
        name: row.name,
        paid: b.paid,
        refund: b.refund,
        net: round2(b.paid - b.refund),
        orders: b.orders,
        activeDays: b.activeDays,
        trend: scaleTrend(row.trend, rangeKey),
        jvAgreed: row.jv.agreed,
        jvActual: round2(row.jv.actual * Math.min(1, scaleOf(rangeKey) + 0.2)),
        jvRemain: row.jv.remain,
        asCount: asCount,
        asAmount: asAmount
      };
    }

    if (scope === 'one') {
      var one = findByCode(STORES, code);
      if (!one) {
        return { empty: true, tip: '未找到该门店，请重新选择' };
      }
      var p = rowPack(one);
      return {
        empty: false,
        entityCode: p.code,
        entityName: p.name,
        kpis: [
          { label: '支付 GMV', value: p.paid, format: 'money' },
          { label: '净成交额', value: p.net, format: 'money' },
          { label: '订单数', value: p.orders, format: 'int' },
          { label: '退款额', value: p.refund, format: 'money' },
          { label: '活跃天数', value: p.activeDays, format: 'int', hint: '时段内有支付成交的天数' }
        ],
        trend: p.trend,
        trendTitle: '成交趋势',
        rankingTitle: '门店排行（按支付 GMV）',
        rankingCols: [
          { key: 'paid', label: '支付 GMV', format: 'money' },
          { key: 'orders', label: '订单', format: 'int' },
          { key: 'net', label: '净成交', format: 'money' }
        ],
        ranking: [{ code: p.code, name: p.name, paid: p.paid, orders: p.orders, net: p.net }],
        panels: [
          {
            title: '联营回收摘要',
            metrics: [
              { label: '约定回收', value: p.jvAgreed, format: 'money' },
              { label: '实际回收', value: p.jvActual, format: 'money' },
              { label: '剩余金额', value: p.jvRemain, format: 'money' }
            ]
          },
          {
            title: '售后摘要',
            metrics: [
              { label: '售后单量', value: p.asCount, format: 'int' },
              { label: '售后金额', value: p.asAmount, format: 'money' }
            ]
          }
        ],
        hint: '当前角色：门店 · ' + p.name + ' · 成交按支付成功统计'
      };
    }

    var packs = STORES.map(rowPack);
    var paid = 0;
    var refund = 0;
    var orders = 0;
    var active = 0;
    var jvA = 0;
    var jvB = 0;
    var jvC = 0;
    var asC = 0;
    var asA = 0;
    var trend = [];
    packs.forEach(function (p, idx) {
      paid += p.paid;
      refund += p.refund;
      orders += p.orders;
      if (p.paid > 0) active += 1;
      jvA += p.jvAgreed;
      jvB += p.jvActual;
      jvC += p.jvRemain;
      asC += p.asCount;
      asA += p.asAmount;
      p.trend.forEach(function (v, i) {
        trend[i] = round2((trend[i] || 0) + v);
      });
    });
    var ranking = packs
      .map(function (p) {
        return { code: p.code, name: p.name, paid: p.paid, orders: p.orders, net: p.net };
      })
      .sort(function (a, b) {
        return b.paid - a.paid;
      });

    return {
      empty: false,
      entityCode: '',
      entityName: '',
      kpis: [
        { label: '支付 GMV', value: round2(paid), format: 'money' },
        { label: '净成交额', value: round2(paid - refund), format: 'money' },
        { label: '订单数', value: orders, format: 'int' },
        { label: '退款额', value: round2(refund), format: 'money' },
        {
          label: '活跃门店',
          value: active + ' / ' + packs.length,
          format: 'text',
          hint: '有成交门店 / 纳入统计门店'
        }
      ],
      trend: trend,
      trendTitle: '成交趋势',
      rankingTitle: '门店排行（按支付 GMV）',
      rankingCols: [
        { key: 'paid', label: '支付 GMV', format: 'money' },
        { key: 'orders', label: '订单', format: 'int' },
        { key: 'net', label: '净成交', format: 'money' }
      ],
      ranking: ranking,
      panels: [
        {
          title: '联营回收摘要',
          metrics: [
            { label: '约定回收', value: round2(jvA), format: 'money' },
            { label: '实际回收', value: round2(jvB), format: 'money' },
            { label: '剩余金额', value: round2(jvC), format: 'money' }
          ]
        },
        {
          title: '售后摘要',
          metrics: [
            { label: '售后单量', value: asC, format: 'int' },
            { label: '售后金额', value: round2(asA), format: 'money' }
          ]
        }
      ],
      hint: '当前角色：门店 · 全部门店 · 默认剔除测试门店 · 成交按支付成功统计'
    };
  }

  function buildSupplierPack(scope, code, range) {
    var rangeKey = normalizeRange(range);
    var keys = [
      'gmv',
      'orders',
      'pendingShip',
      'shipped',
      'settleable',
      'settled',
      'arrived',
      'asCount',
      'asAmount'
    ];
    function rowPack(row) {
      var b = applyScale(row.base, rangeKey, keys);
      return {
        code: row.code,
        name: row.name,
        gmv: b.gmv,
        orders: b.orders,
        pendingShip: b.pendingShip,
        shipped: b.shipped,
        settleable: b.settleable,
        settled: b.settled,
        arrived: b.arrived,
        asCount: b.asCount,
        asAmount: b.asAmount,
        trend: scaleTrend(row.trend, rangeKey)
      };
    }

    if (scope === 'one') {
      var one = findByCode(SUPPLIERS, code);
      if (!one) return { empty: true, tip: '未找到该供应商，请重新选择' };
      var p = rowPack(one);
      return {
        empty: false,
        entityCode: p.code,
        entityName: p.name,
        kpis: [
          { label: '供货金额', value: p.gmv, format: 'money' },
          { label: '供货订单', value: p.orders, format: 'int' },
          { label: '待发货', value: p.pendingShip, format: 'int' },
          { label: '已发货', value: p.shipped, format: 'int' },
          { label: '可结算金额', value: p.settleable, format: 'money' }
        ],
        trend: p.trend,
        trendTitle: '供货金额趋势',
        rankingTitle: '供应商排行（按供货金额）',
        rankingCols: [
          { key: 'gmv', label: '供货金额', format: 'money' },
          { key: 'orders', label: '订单', format: 'int' },
          { key: 'pendingShip', label: '待发', format: 'int' }
        ],
        ranking: [
          {
            code: p.code,
            name: p.name,
            gmv: p.gmv,
            orders: p.orders,
            pendingShip: p.pendingShip
          }
        ],
        panels: [
          {
            title: '结算摘要',
            metrics: [
              { label: '可结算', value: p.settleable, format: 'money' },
              { label: '已结算', value: p.settled, format: 'money' },
              { label: '已到账', value: p.arrived, format: 'money' }
            ]
          },
          {
            title: '售后摘要',
            metrics: [
              { label: '售后单量', value: p.asCount, format: 'int' },
              { label: '售后金额', value: p.asAmount, format: 'money' }
            ]
          }
        ],
        hint: '当前角色：供应商 · ' + p.name + ' · 供货按订单履约统计，不含平台毛利'
      };
    }

    var packs = SUPPLIERS.map(rowPack);
    var sum = {
      gmv: 0,
      orders: 0,
      pendingShip: 0,
      shipped: 0,
      settleable: 0,
      settled: 0,
      arrived: 0,
      asCount: 0,
      asAmount: 0
    };
    var trend = [];
    packs.forEach(function (p) {
      Object.keys(sum).forEach(function (k) {
        sum[k] += p[k];
      });
      p.trend.forEach(function (v, i) {
        trend[i] = round2((trend[i] || 0) + v);
      });
    });
    Object.keys(sum).forEach(function (k) {
      if (k === 'gmv' || k === 'settleable' || k === 'settled' || k === 'arrived' || k === 'asAmount') {
        sum[k] = round2(sum[k]);
      }
    });
    var ranking = packs
      .map(function (p) {
        return {
          code: p.code,
          name: p.name,
          gmv: p.gmv,
          orders: p.orders,
          pendingShip: p.pendingShip
        };
      })
      .sort(function (a, b) {
        return b.gmv - a.gmv;
      });

    return {
      empty: false,
      entityCode: '',
      entityName: '',
      kpis: [
        { label: '供货金额', value: sum.gmv, format: 'money' },
        { label: '供货订单', value: sum.orders, format: 'int' },
        { label: '待发货', value: sum.pendingShip, format: 'int' },
        { label: '已发货', value: sum.shipped, format: 'int' },
        {
          label: '供应商数',
          value: packs.length,
          format: 'int',
          hint: '纳入统计的供应商主体数'
        }
      ],
      trend: trend,
      trendTitle: '供货金额趋势',
      rankingTitle: '供应商排行（按供货金额）',
      rankingCols: [
        { key: 'gmv', label: '供货金额', format: 'money' },
        { key: 'orders', label: '订单', format: 'int' },
        { key: 'pendingShip', label: '待发', format: 'int' }
      ],
      ranking: ranking,
      panels: [
        {
          title: '结算摘要',
          metrics: [
            { label: '可结算', value: sum.settleable, format: 'money' },
            { label: '已结算', value: sum.settled, format: 'money' },
            { label: '已到账', value: sum.arrived, format: 'money' }
          ]
        },
        {
          title: '售后摘要',
          metrics: [
            { label: '售后单量', value: sum.asCount, format: 'int' },
            { label: '售后金额', value: sum.asAmount, format: 'money' }
          ]
        }
      ],
      hint: '当前角色：供应商 · 全部供应商 · 供货按订单履约统计，不含平台毛利'
    };
  }

  function buildWarehousePack(scope, code, range) {
    var rangeKey = normalizeRange(range);
    var keys = [
      'outbound',
      'pendingOut',
      'shipped',
      'arrivedStore',
      'stockout',
      'abnormal',
      'skuSku',
      'asCount'
    ];
    function rowPack(row) {
      var b = applyScale(row.base, rangeKey, keys);
      return {
        code: row.code,
        name: row.name,
        outbound: b.outbound,
        pendingOut: b.pendingOut,
        shipped: b.shipped,
        arrivedStore: b.arrivedStore,
        stockout: b.stockout,
        abnormal: b.abnormal,
        skuSku: row.base.skuSku,
        asCount: b.asCount,
        trend: scaleTrend(row.trend, rangeKey)
      };
    }

    if (scope === 'one') {
      var one = findByCode(WAREHOUSES, code);
      if (!one) return { empty: true, tip: '未找到该仓库，请重新选择' };
      var p = rowPack(one);
      return {
        empty: false,
        entityCode: p.code,
        entityName: p.name,
        kpis: [
          { label: '出库单量', value: p.outbound, format: 'int' },
          { label: '待出库', value: p.pendingOut, format: 'int' },
          { label: '已发货', value: p.shipped, format: 'int' },
          { label: '已到店', value: p.arrivedStore, format: 'int' },
          { label: '缺货单', value: p.stockout, format: 'int' }
        ],
        trend: p.trend,
        trendTitle: '出库量趋势',
        rankingTitle: '仓库排行（按出库单量）',
        rankingCols: [
          { key: 'outbound', label: '出库单', format: 'int' },
          { key: 'arrivedStore', label: '到店', format: 'int' },
          { key: 'stockout', label: '缺货', format: 'int' }
        ],
        ranking: [
          {
            code: p.code,
            name: p.name,
            outbound: p.outbound,
            arrivedStore: p.arrivedStore,
            stockout: p.stockout
          }
        ],
        panels: [
          {
            title: '履约异常',
            metrics: [
              { label: '缺货单', value: p.stockout, format: 'int' },
              { label: '异常单', value: p.abnormal, format: 'int' },
              { label: '售后关联', value: p.asCount, format: 'int' }
            ]
          },
          {
            title: '库存概况',
            metrics: [
              { label: '在库 SKU', value: p.skuSku, format: 'int' },
              { label: '待出库', value: p.pendingOut, format: 'int' }
            ]
          }
        ],
        hint: '当前角色：仓库 · ' + p.name + ' · 出库／到店按仓配履约节点统计'
      };
    }

    var packs = WAREHOUSES.map(rowPack);
    var sum = {
      outbound: 0,
      pendingOut: 0,
      shipped: 0,
      arrivedStore: 0,
      stockout: 0,
      abnormal: 0,
      asCount: 0,
      skuSku: 0
    };
    var trend = [];
    packs.forEach(function (p) {
      Object.keys(sum).forEach(function (k) {
        sum[k] += p[k];
      });
      p.trend.forEach(function (v, i) {
        trend[i] = round2((trend[i] || 0) + v);
      });
    });
    var ranking = packs
      .map(function (p) {
        return {
          code: p.code,
          name: p.name,
          outbound: p.outbound,
          arrivedStore: p.arrivedStore,
          stockout: p.stockout
        };
      })
      .sort(function (a, b) {
        return b.outbound - a.outbound;
      });

    return {
      empty: false,
      entityCode: '',
      entityName: '',
      kpis: [
        { label: '出库单量', value: sum.outbound, format: 'int' },
        { label: '待出库', value: sum.pendingOut, format: 'int' },
        { label: '已发货', value: sum.shipped, format: 'int' },
        { label: '已到店', value: sum.arrivedStore, format: 'int' },
        {
          label: '仓库数',
          value: packs.length,
          format: 'int',
          hint: '纳入统计的仓库数'
        }
      ],
      trend: trend,
      trendTitle: '出库量趋势',
      rankingTitle: '仓库排行（按出库单量）',
      rankingCols: [
        { key: 'outbound', label: '出库单', format: 'int' },
        { key: 'arrivedStore', label: '到店', format: 'int' },
        { key: 'stockout', label: '缺货', format: 'int' }
      ],
      ranking: ranking,
      panels: [
        {
          title: '履约异常',
          metrics: [
            { label: '缺货单', value: sum.stockout, format: 'int' },
            { label: '异常单', value: sum.abnormal, format: 'int' },
            { label: '售后关联', value: sum.asCount, format: 'int' }
          ]
        },
        {
          title: '库存概况',
          metrics: [
            { label: '在库 SKU', value: sum.skuSku, format: 'int' },
            { label: '待出库', value: sum.pendingOut, format: 'int' }
          ]
        }
      ],
      hint: '当前角色：仓库 · 全部仓库 · 出库／到店按仓配履约节点统计'
    };
  }

  function build(opts) {
    var o = opts || {};
    var role = normalizeRole(o.role);
    var scope = role === 'platform' ? 'all' : o.scope === 'one' ? 'one' : 'all';
    var range = normalizeRange(o.range);
    var code = o.entityCode || '';
    var meta = roleMeta(role);
    var pack;
    if (role === 'platform') pack = buildPlatformPack(range);
    else if (role === 'supplier') pack = buildSupplierPack(scope, code, range);
    else if (role === 'warehouse') pack = buildWarehousePack(scope, code, range);
    else pack = buildStorePack(scope, code, range);

    if (pack.empty) {
      return Object.assign({ role: role, scope: scope, range: range }, meta, pack);
    }
    return Object.assign({ role: role, scope: scope, range: range }, meta, pack);
  }

  global.MdmOpsBizOverviewData = {
    ROLE_OPTIONS: [
      { id: 'platform', label: '平台' },
      { id: 'store', label: '门店' },
      { id: 'supplier', label: '供应商' },
      { id: 'warehouse', label: '仓库' }
    ],
    RANGE_OPTIONS: [
      { id: 'today', label: '今日' },
      { id: '7d', label: '近7天' },
      { id: '30d', label: '近30天' },
      { id: 'custom', label: '自定义' }
    ],
    roleMeta: roleMeta,
    listEntities: listEntities,
    build: build
  };
})(window);
