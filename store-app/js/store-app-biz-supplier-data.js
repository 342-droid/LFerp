/**
 * 供应商 · 数据中心数据适配层
 * - 正式实现：请求后端并按登录供应商主体隔离（后端必须校验）
 * - 本文件仅为可点原型演示数据，不得当作生产 Mock 定稿
 * - 验收场景：?demo=empty|aftersale|settle0|forbidden|normal 或验收面板
 */
(function (global) {
  var CFG = function () {
    return global.StoreAppBizSupplierConfig || {};
  };

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function money(n) {
    if (n == null || n === '') return '—';
    var v = round2(n);
    var parts = v.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function pct(n) {
    if (n == null || !isFinite(n)) return null;
    return round2(n);
  }

  var AS_OF = '2026-11-17 10:00';
  var DEMO_KEY = 'fybSupBizDemo';

  function currentSupplierId() {
    var org = global.FybOrg && global.FybOrg.current && global.FybOrg.current();
    return (org && org.id) || 'sup-ss';
  }

  function readDemoMode() {
    try {
      var q = new URLSearchParams(location.search || '');
      var fromQ = q.get('demo');
      if (fromQ) return fromQ;
      return localStorage.getItem(DEMO_KEY) || 'normal';
    } catch (e) {
      return 'normal';
    }
  }

  function setDemoMode(mode) {
    try {
      localStorage.setItem(DEMO_KEY, mode || 'normal');
    } catch (e) {}
  }

  var RANGE_OPTIONS = [
    { id: 'today', label: '今日' },
    { id: 'yesterday', label: '昨日' },
    { id: '7d', label: '近7天' },
    { id: '30d', label: '近30天' },
    { id: 'custom', label: '自定义' }
  ];

  /** 演示：按时段缩放周期指标；时点指标固定 */
  var RANGE_SCALE = {
    today: 0.08,
    yesterday: 0.1,
    '7d': 0.28,
    '30d': 1,
    custom: 0.65
  };

  var BASE = {
    /* 支付交易规模：按支付成功时间 */
    paidGmv: 64280,
    paidQty: 1240,
    orderCount: 168,
    /* 实际供货：按履约完成节点；与支付交易分列，不可混称供货量 */
    fulfillQty: 1180,
    fulfillGoodsAmt: 58640,
    refundAmount: 2180.6,
    refundQty: 46,
    aftersaleCount: 12,
    pendingShip: 8,
    avgShipHours: 18.6,
    stockoutCancel: 2,
    deliveryAbnormal: 1,
    /* 货款三项分列；未确认互斥前不得相加 */
    duePayable: 52840.2,
    pendingSettle: 9680.4,
    settled: 48600.5,
    writeOff: 1280.3,
    reconcileDiff: 1
  };

  var POINT = {
    pendingArrival: 7420.1
  };

  function scale(v, key) {
    return round2(v * (RANGE_SCALE[key] || 1));
  }

  function comparePair(cur, hasPrev) {
    if (!hasPrev) return { value: cur, prev: null, deltaPct: null };
    var prev = round2(cur * 0.86);
    var deltaPct = prev === 0 ? null : round2(((cur - prev) / prev) * 100);
    return { value: cur, prev: prev, deltaPct: deltaPct };
  }

  function buildProducts(rangeKey) {
    var s = RANGE_SCALE[rangeKey] || 1;
    return [
      {
        name: '火龙果',
        sku: 'SKU00196',
        paidQty: Math.round(320 * s),
        fulfillQty: Math.round(310 * s),
        paidGmv: round2(12800 * s),
        goodsPayable: round2(10240 * s),
        refundQty: Math.max(0, Math.round(4 * s)),
        refundAmount: round2(120 * s),
        aftersaleRate: 2.1,
        stock: 86
      },
      {
        name: '芒果干',
        sku: 'SPU00088',
        paidQty: Math.round(210 * s),
        fulfillQty: Math.round(190 * s),
        paidGmv: round2(8400 * s),
        goodsPayable: round2(6720 * s),
        refundQty: Math.max(0, Math.round(18 * s)),
        refundAmount: round2(960 * s),
        aftersaleRate: 11.2,
        stock: 14
      },
      {
        name: '白芭乐-快递-ss',
        sku: 'SKU00184',
        paidQty: Math.round(90 * s),
        fulfillQty: Math.round(88 * s),
        paidGmv: round2(3600 * s),
        goodsPayable: round2(2880 * s),
        refundQty: 0,
        refundAmount: 0,
        aftersaleRate: 0,
        stock: 0
      },
      {
        name: '低糖养乐多',
        sku: 'SPU00204',
        paidQty: Math.round(150 * s),
        fulfillQty: Math.round(146 * s),
        paidGmv: round2(7200 * s),
        goodsPayable: round2(5760 * s),
        refundQty: Math.max(0, Math.round(3 * s)),
        refundAmount: round2(180 * s),
        aftersaleRate: 3.4,
        stock: 42
      },
      {
        name: '运费验收-快递常温2.5kg',
        sku: 'SKU00217',
        paidQty: Math.round(40 * s),
        fulfillQty: Math.round(40 * s),
        paidGmv: round2(800 * s),
        goodsPayable: round2(640 * s),
        refundQty: 0,
        refundAmount: 0,
        aftersaleRate: 0,
        stock: 999
      }
    ];
  }

  /** 订单退款：顾客退款与供应商货款调整分列，金额不默认相等 */
  function buildRefundOrders(rangeKey) {
    var s = RANGE_SCALE[rangeKey] || 1;
    return [
      {
        orderNo: 'SO20261115088',
        goods: '芒果干 ×2',
        orderStatus: '交易成功',
        aftersaleStatus: '退款成功',
        settleStatus: '已冲销',
        refundType: '全部退货',
        customerRefund: round2(96 * s),
        payableAdjust: round2(76.8 * s),
        refundQty: Math.max(1, Math.round(2 * s))
      },
      {
        orderNo: 'SO20261114021',
        goods: '火龙果 ×1',
        orderStatus: '交易成功',
        aftersaleStatus: '退款成功',
        settleStatus: '待调整',
        refundType: '仅退金额',
        customerRefund: round2(12.5 * s),
        payableAdjust: round2(10 * s),
        refundQty: 0
      },
      {
        orderNo: 'SO20261112055',
        goods: '低糖养乐多 ×3',
        orderStatus: '部分退款',
        aftersaleStatus: '退货退款中',
        settleStatus: '未形成',
        refundType: '退数量',
        customerRefund: round2(36 * s),
        payableAdjust: null,
        refundQty: Math.max(1, Math.round(1 * s))
      }
    ];
  }

  function resolveGrain(rangeKey, custom) {
    var map = (CFG().TREND_GRAIN_BY_RANGE || {});
    if (rangeKey === 'today' || rangeKey === 'yesterday') return map.today || 'hour';
    if (rangeKey === '7d' || rangeKey === '30d') return map[rangeKey] || 'day';
    if (rangeKey === 'custom' && custom && custom.from && custom.to) {
      var a = new Date(custom.from.replace(/-/g, '/'));
      var b = new Date(custom.to.replace(/-/g, '/'));
      var days = Math.round((b - a) / 86400000) + 1;
      var max = map.customDayMax != null ? map.customDayMax : 14;
      return days <= max ? 'day' : 'week';
    }
    return 'day';
  }

  /**
   * 演示计数：原因文案必须落在 Config.AFTERSALE_REASONS（= C 端 REASONS）内
   * 正式实现按提交原因原文聚合，禁止粗分桶改写。
   */
  var REASON_DEMO_BASE = [
    { reason: '质量问题', count: 5, amount: 980.4 },
    { reason: '少件/漏发/少配件', count: 3, amount: 420.1 },
    { reason: '包装/商品破损/污渍', count: 2, amount: 360.2 },
    { reason: '收到商品破损/污渍等', count: 2, amount: 310.5 },
    { reason: '包裹少件/漏发', count: 2, amount: 286 },
    { reason: '卖家发错货', count: 1, amount: 198.8 },
    { reason: '不喜欢/不想要', count: 1, amount: 156 },
    { reason: '未按约定时间发货', count: 1, amount: 128.5 },
    { reason: '大小/尺寸/重量与商品描述不符', count: 1, amount: 96.2 },
    { reason: '商品信息描述不符', count: 1, amount: 88 }
  ];

  function allowedReasonSet() {
    var cat = (CFG().AFTERSALE_REASONS || {});
    var set = {};
    Object.keys(cat).forEach(function (scene) {
      (cat[scene] || []).forEach(function (r) {
        set[r] = true;
      });
    });
    return set;
  }

  function buildAftersaleReasons(rangeKey) {
    var s = RANGE_SCALE[rangeKey] || 1;
    var allow = allowedReasonSet();
    return REASON_DEMO_BASE.map(function (row) {
      return {
        reason: row.reason,
        count: Math.max(0, Math.round(row.count * s)),
        amount: round2(row.amount * s)
      };
    })
      .filter(function (r) {
        return r.count > 0 && (!Object.keys(allow).length || allow[r.reason]);
      })
      .sort(function (a, b) {
        return b.count - a.count || b.amount - a.amount;
      });
  }

  function buildAftersaleTypes(rangeKey) {
    var s = RANGE_SCALE[rangeKey] || 1;
    return [
      {
        type: '仅退款',
        applyCount: Math.max(1, Math.round(6 * s)),
        amount: round2(980.2 * s),
        doneCount: Math.max(0, Math.round(4 * s))
      },
      {
        type: '退货退款',
        applyCount: Math.max(1, Math.round(4 * s)),
        amount: round2(860.4 * s),
        doneCount: Math.max(0, Math.round(3 * s))
      },
      {
        type: '补货',
        applyCount: Math.max(0, Math.round(2 * s)),
        amount: round2(340 * s),
        doneCount: Math.max(0, Math.round(2 * s))
      }
    ].filter(function (t) {
      return t.applyCount > 0;
    });
  }

  /** 经营时段 → 售后列表 time 预设（列表仅支持 7d／30d／all） */
  function aftersaleTimePreset(rangeKey) {
    if (rangeKey === '7d') return '7d';
    if (rangeKey === '30d') return '30d';
    return 'all';
  }

  /**
   * @param {{range:string, custom?:{from:string,to:string}, grain?:string, sort?:string, keyword?:string, section?:string}} params
   * @returns {Promise<object>}
   */
  function fetchBundle(params) {
    params = params || {};
    var mode = readDemoMode();
    var supplierId = currentSupplierId();
    var rangeKey = params.range || '30d';
    if (rangeKey === 'custom' && !(params.custom && params.custom.from && params.custom.to)) {
      /* 未选自定义区间时按近30天演示 */
      rangeKey = '30d';
    }
    var grain = resolveGrain(rangeKey, params.custom);

    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        /* 越权：非供应商主体或演示 forbidden */
        var isSupplier = !!(global.FybOrg && global.FybOrg.isSupplier && global.FybOrg.isSupplier());
        if (!isSupplier || mode === 'forbidden') {
          reject({
            code: 403,
            message: '无权查看该供应商经营数据（主体隔离）'
          });
          return;
        }

        if (mode === 'empty') {
          resolve({
            meta: {
              asOf: AS_OF,
              supplierId: supplierId,
              range: params.range || '30d',
              grain: grain,
              empty: true,
              demo: true
            },
            overview: null,
            products: [],
            refundOrders: [],
            fulfillment: null,
            settle: null
          });
          return;
        }

        var hasPrev = rangeKey !== 'today';
        var paidGmv = scale(BASE.paidGmv, rangeKey);
        var paidQty = Math.round(scale(BASE.paidQty, rangeKey));
        var fulfillQty = Math.round(scale(BASE.fulfillQty, rangeKey));
        var fulfillGoodsAmt = scale(BASE.fulfillGoodsAmt, rangeKey);
        var orderCount = Math.round(scale(BASE.orderCount, rangeKey));
        var refund = scale(BASE.refundAmount, rangeKey);
        var refundQty = Math.round(scale(BASE.refundQty, rangeKey));
        var aftersaleCount = Math.round(scale(BASE.aftersaleCount, rangeKey));
        if (mode === 'aftersale') {
          refund = round2(refund * 3.2);
          refundQty = Math.round(refundQty * 3);
          aftersaleCount = Math.round(aftersaleCount * 3);
        }
        var aftersaleRate = orderCount ? pct((aftersaleCount / orderCount) * 100) : 0;
        var duePayable = mode === 'settle0' ? 0 : scale(BASE.duePayable, rangeKey);
        var pendingSettle = mode === 'settle0' ? 0 : scale(BASE.pendingSettle, rangeKey);
        var settledAmt = mode === 'settle0' ? 0 : scale(BASE.settled, rangeKey);

        var overview = {
          paidGmv: comparePair(paidGmv, hasPrev),
          paidQty: comparePair(paidQty, hasPrev),
          orderCount: comparePair(orderCount, hasPrev),
          fulfillQty: comparePair(fulfillQty, hasPrev),
          fulfillGoodsAmt: comparePair(fulfillGoodsAmt, hasPrev),
          refundAmount: comparePair(refund, hasPrev),
          refundQty: comparePair(refundQty, hasPrev),
          aftersaleRate: comparePair(aftersaleRate, hasPrev),
          duePayable: comparePair(duePayable, hasPrev && mode !== 'settle0'),
          pendingSettle: comparePair(pendingSettle, hasPrev && mode !== 'settle0'),
          settled: comparePair(settledAmt, hasPrev && mode !== 'settle0'),
          pendingShip: { value: BASE.pendingShip, prev: null, deltaPct: null, pointInTime: true }
        };

        var settle = {
          duePayable: duePayable,
          pendingSettle: pendingSettle,
          settled: settledAmt,
          writeOff: scale(BASE.writeOff, rangeKey),
          reconcileDiff: mode === 'settle0' ? 0 : BASE.reconcileDiff,
          pendingArrival: POINT.pendingArrival,
          /* 三项是否包含关系未确认，禁止前端相加展示合计 */
          sumForbidden: true,
          detailHref: 'supplier-settle.html'
        };

        var products = buildProducts(rangeKey);
        if (mode === 'aftersale') {
          products = products.map(function (p, i) {
            if (i === 1) {
              return Object.assign({}, p, {
                aftersaleRate: 18.6,
                refundAmount: round2(p.refundAmount * 4),
                refundQty: Math.max(1, p.refundQty * 3)
              });
            }
            return p;
          });
        }

        var kw = String(params.keyword || '')
          .trim()
          .toLowerCase();
        if (kw) {
          products = products.filter(function (p) {
            return (
              String(p.name).toLowerCase().indexOf(kw) >= 0 ||
              String(p.sku).toLowerCase().indexOf(kw) >= 0
            );
          });
        }
        var sort = params.sort || 'paidGmv';
        products = products.slice().sort(function (a, b) {
          if (sort === 'paidQty') return b.paidQty - a.paidQty;
          if (sort === 'fulfillQty') return b.fulfillQty - a.fulfillQty;
          if (sort === 'aftersaleRate') return b.aftersaleRate - a.aftersaleRate;
          return b.paidGmv - a.paidGmv;
        });

        var refundOrders = buildRefundOrders(rangeKey);
        if (mode === 'aftersale') {
          refundOrders = refundOrders.concat([
            {
              orderNo: 'SO20261110003',
              goods: '芒果干 ×1',
              orderStatus: '交易成功',
              aftersaleStatus: '退款成功',
              settleStatus: '已冲销',
              refundType: '全部退货',
              customerRefund: round2(48),
              payableAdjust: round2(38.4),
              refundQty: 1
            }
          ]);
        }

        var asTypes = buildAftersaleTypes(rangeKey);
        var asReasons = buildAftersaleReasons(rangeKey);
        if (mode === 'aftersale') {
          asTypes = asTypes.map(function (t) {
            return Object.assign({}, t, {
              applyCount: t.applyCount * 2,
              amount: round2(t.amount * 2.5)
            });
          });
          asReasons = asReasons.map(function (r) {
            return Object.assign({}, r, {
              count: r.count * 2,
              amount: round2(r.amount * 2.5)
            });
          });
        }
        var asTime = aftersaleTimePreset(rangeKey);
        var asHref =
          'supplier-aftersale.html' + (asTime && asTime !== 'all' ? '?time=' + encodeURIComponent(asTime) : '');

        resolve({
          meta: {
            asOf: AS_OF,
            supplierId: supplierId,
            range: params.range || '30d',
            custom: params.custom || null,
            grain: grain,
            empty: false,
            demo: true,
            demoMode: mode
          },
          overview: overview,
          products: products,
          refundOrders: refundOrders,
          fulfillment: {
            pendingShip: BASE.pendingShip,
            /* 现网无承诺时点，不上报准时率 */
            onTimeShipRate: null,
            fulfillQty: fulfillQty,
            fulfillOrderCount: Math.max(1, Math.round(orderCount * 0.92)),
            avgShipHours: BASE.avgShipHours,
            stockoutCancel: BASE.stockoutCancel,
            deliveryAbnormal: mode === 'aftersale' ? BASE.deliveryAbnormal + 3 : BASE.deliveryAbnormal,
            aftersaleTypes: asTypes,
            aftersaleReasons: asReasons,
            ordersHref: 'supplier-orders.html',
            aftersaleHref: asHref
          },
          settle: settle
        });
      }, 320);
    });
  }

  global.StoreAppBizSupplierData = {
    money: money,
    round2: round2,
    pct: pct,
    RANGE_OPTIONS: RANGE_OPTIONS,
    fetchBundle: fetchBundle,
    readDemoMode: readDemoMode,
    setDemoMode: setDemoMode,
    DEMO_KEY: DEMO_KEY
  };
})(window);
