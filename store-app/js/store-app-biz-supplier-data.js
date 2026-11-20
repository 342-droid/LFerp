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
    { id: '7d', label: '近7天' },
    { id: '30d', label: '近30天' },
    { id: 'custom', label: '自定义' }
  ];

  /** 演示：按时段缩放周期指标；时点指标固定 */
  var RANGE_SCALE = {
    today: 0.08,
    '7d': 0.28,
    '30d': 1,
    custom: 0.65
  };

  var BASE = {
    gmv: 64280,
    qty: 1240,
    orderCount: 168,
    refundAmount: 2180.6,
    aftersaleCount: 12,
    pendingShip: 8,
    settleable: 18620.5,
    avgShipHours: 18.6,
    stockoutCancel: 2,
    deliveryAbnormal: 1,
    storeCount: 26,
    repurchaseStoreCount: 14,
    silentStoreCount: 3,
    receivable: 64280,
    settling: 9680.4,
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
        qty: Math.round(320 * s),
        gmv: round2(12800 * s),
        refund: round2(120 * s),
        aftersaleRate: 2.1,
        stock: 86,
        activeStores: 12
      },
      {
        name: '芒果干',
        sku: 'SPU00088',
        qty: Math.round(210 * s),
        gmv: round2(8400 * s),
        refund: round2(960 * s),
        aftersaleRate: 11.2,
        stock: 14,
        activeStores: 8
      },
      {
        name: '白芭乐-快递-ss',
        sku: 'SKU00184',
        qty: Math.round(90 * s),
        gmv: round2(3600 * s),
        refund: 0,
        aftersaleRate: 0,
        stock: 0,
        activeStores: 5
      },
      {
        name: '低糖养乐多',
        sku: 'SPU00204',
        qty: Math.round(150 * s),
        gmv: round2(7200 * s),
        refund: round2(180 * s),
        aftersaleRate: 3.4,
        stock: 42,
        activeStores: 9
      },
      {
        name: '运费验收-快递常温2.5kg',
        sku: 'SKU00217',
        qty: Math.round(40 * s),
        gmv: round2(800 * s),
        refund: 0,
        aftersaleRate: 0,
        stock: 999,
        activeStores: 4
      }
    ];
  }

  function resolveGrain(rangeKey, custom) {
    var map = (CFG().TREND_GRAIN_BY_RANGE || {});
    if (rangeKey === 'today') return map.today || 'hour';
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

  function buildTrend(rangeKey, grain) {
    var n =
      grain === 'week' ? 6 : grain === 'hour' ? 8 : rangeKey === '7d' ? 7 : rangeKey === 'today' ? 8 : 14;
    var gmv = [];
    var orders = [];
    var qty = [];
    var asAmt = [];
    var asRate = [];
    for (var i = 0; i < n; i++) {
      var label =
        grain === 'week'
          ? 'W' + (i + 1)
          : grain === 'hour'
            ? i * 3 + ':00'
            : '11-' + String(3 + i).padStart(2, '0');
      var factor = 0.6 + (i % 5) * 0.12;
      gmv.push({ label: label, value: round2(3200 * factor * (RANGE_SCALE[rangeKey] || 1) * 3) });
      orders.push({ label: label, value: Math.round(12 * factor * (RANGE_SCALE[rangeKey] || 1) * 3) });
      qty.push({ label: label, value: Math.round(80 * factor * (RANGE_SCALE[rangeKey] || 1) * 3) });
      asAmt.push({ label: label, value: round2(90 * factor) });
      asRate.push({ label: label, value: round2(2 + (i % 4) * 1.1) });
    }
    return {
      grain: grain,
      gmv: gmv,
      orders: orders,
      qty: qty,
      aftersaleAmount: asAmt,
      aftersaleRate: asRate
    };
  }

  function buildStores(rangeKey) {
    var idle = (CFG().SILENT_STORE && CFG().SILENT_STORE.idleDays) || 30;
    return [
      {
        name: '斯斯门店商家2',
        region: '华东 · 杭州',
        orders: Math.round(48 * (RANGE_SCALE[rangeKey] || 1)),
        gmv: round2(18600 * (RANGE_SCALE[rangeKey] || 1)),
        lastPurchase: '2026-11-16',
        silent: false
      },
      {
        name: '德清乾元天恩冷鲜超市',
        region: '华东 · 湖州',
        orders: Math.round(22 * (RANGE_SCALE[rangeKey] || 1)),
        gmv: round2(9200 * (RANGE_SCALE[rangeKey] || 1)),
        lastPurchase: '2026-11-12',
        silent: false
      },
      {
        name: '南京马群生鲜店',
        region: '华东 · 南京',
        orders: Math.round(15 * (RANGE_SCALE[rangeKey] || 1)),
        gmv: round2(6100 * (RANGE_SCALE[rangeKey] || 1)),
        lastPurchase: '2026-09-28',
        silent: true,
        idleDays: idle
      },
      {
        name: '苏州园区联营点',
        region: '华东 · 苏州',
        orders: Math.round(9 * (RANGE_SCALE[rangeKey] || 1)),
        gmv: round2(3400 * (RANGE_SCALE[rangeKey] || 1)),
        lastPurchase: '2026-10-02',
        silent: true,
        idleDays: idle
      }
    ];
  }

  function buildRegions() {
    return [
      { name: '杭州', value: 42 },
      { name: '湖州', value: 18 },
      { name: '南京', value: 15 },
      { name: '苏州', value: 12 },
      { name: '其它', value: 13 }
    ];
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
          trends: { grain: grain, gmv: [], orders: [], qty: [], aftersaleAmount: [], aftersaleRate: [] },
            products: [],
            fulfillment: null,
            stores: { summary: null, list: [], regions: [] },
            settle: null
          });
          return;
        }

        var hasPrev = rangeKey !== 'today';
        var gmv = scale(BASE.gmv, rangeKey);
        var qty = Math.round(scale(BASE.qty, rangeKey));
        var orderCount = Math.round(scale(BASE.orderCount, rangeKey));
        var refund = scale(BASE.refundAmount, rangeKey);
        var aftersaleCount = Math.round(scale(BASE.aftersaleCount, rangeKey));
        if (mode === 'aftersale') {
          refund = round2(refund * 3.2);
          aftersaleCount = Math.round(aftersaleCount * 3);
        }
        var aftersaleRate = orderCount ? pct((aftersaleCount / orderCount) * 100) : 0;

        var overview = {
          gmv: comparePair(gmv, hasPrev),
          qty: comparePair(qty, hasPrev),
          orderCount: comparePair(orderCount, hasPrev),
          refundAmount: comparePair(refund, hasPrev),
          aftersaleRate: comparePair(aftersaleRate, hasPrev),
          pendingShip: { value: BASE.pendingShip, prev: null, deltaPct: null, pointInTime: true },
          settleable: comparePair(
            mode === 'settle0' ? 0 : scale(BASE.settleable, rangeKey),
            hasPrev && mode !== 'settle0'
          )
        };

        var settle = {
          receivable: scale(BASE.receivable, rangeKey),
          settleable: mode === 'settle0' ? 0 : scale(BASE.settleable, rangeKey),
          settling: mode === 'settle0' ? 0 : scale(BASE.settling, rangeKey),
          settled: mode === 'settle0' ? 0 : scale(BASE.settled, rangeKey),
          writeOff: scale(BASE.writeOff, rangeKey),
          reconcileDiff: mode === 'settle0' ? 0 : BASE.reconcileDiff,
          pendingArrival: POINT.pendingArrival,
          detailHref: 'supplier-settle.html'
        };

        var products = buildProducts(rangeKey);
        if (mode === 'aftersale') {
          products = products.map(function (p, i) {
            if (i === 1) return Object.assign({}, p, { aftersaleRate: 18.6, refund: round2(p.refund * 4) });
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
        var sort = params.sort || 'gmv';
        products = products.slice().sort(function (a, b) {
          if (sort === 'qty') return b.qty - a.qty;
          if (sort === 'aftersaleRate') return b.aftersaleRate - a.aftersaleRate;
          return b.gmv - a.gmv;
        });

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
          trends: buildTrend(rangeKey, grain),
          products: products,
          fulfillment: {
            pendingShip: BASE.pendingShip,
            /* 现网无承诺时点，不上报准时率 */
            onTimeShipRate: null,
            avgShipHours: BASE.avgShipHours,
            stockoutCancel: BASE.stockoutCancel,
            deliveryAbnormal: mode === 'aftersale' ? BASE.deliveryAbnormal + 3 : BASE.deliveryAbnormal,
            aftersaleTypes: asTypes,
            aftersaleReasons: asReasons,
            ordersHref: 'supplier-orders.html',
            aftersaleHref: asHref
          },
          stores: {
            summary: {
              storeCount: BASE.storeCount,
              repurchaseStoreCount: BASE.repurchaseStoreCount,
              silentStoreCount: BASE.silentStoreCount,
              silentIdleDays: (CFG().SILENT_STORE && CFG().SILENT_STORE.idleDays) || 30
            },
            list: buildStores(rangeKey),
            regions: buildRegions()
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
