/**
 * 营销活动 — 秒杀（localStorage）
 * Key: mdm_marketing_seckill_v1
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mdm_marketing_seckill_v1';
  var LOG_KEY = 'mdm_marketing_seckill_logs_v1';
  var WORKING_KEY = 'mdm_marketing_seckill_working_v1';

  var STATUS_LABEL = {
    upcoming: '未开始',
    active: '进行中',
    ended: '已结束',
    disabled: '已禁用'
  };

  var LIMIT_LABEL = {
    none: '不限购',
    order: '每单限购',
    daily: '每天限购',
    total: '累计限购'
  };

  var SCENE_LABEL = { mall: '商城', live: '直播' };
  var PORT_LABEL = { mini_program: '小程序', app: 'APP' };
  var BUY_LABEL = { all: '全部用户', neu: '新用户' };
  var SCOPE_LABEL = { all: '全部', region: '省市区', store: '门店' };

  var ACTION_LABEL = {
    create: '创建活动',
    update: '修改活动',
    enable: '启用活动',
    disable: '禁用活动',
    addProduct: '添加商品',
    editProduct: '编辑商品'
  };

  var CATEGORIES = [
    { id: '新鲜蔬菜', name: '新鲜蔬菜' },
    { id: '时令水果', name: '时令水果' },
    { id: '粮油调味', name: '粮油调味' },
    { id: '肉禽蛋品', name: '肉禽蛋品' },
    { id: '酒水饮料', name: '酒水饮料' },
    { id: '休闲零食', name: '休闲零食' },
    { id: '其他', name: '其他' }
  ];

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatNow() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad2(d.getMonth() + 1) +
      '-' +
      pad2(d.getDate()) +
      ' ' +
      pad2(d.getHours()) +
      ':' +
      pad2(d.getMinutes()) +
      ':' +
      pad2(d.getSeconds())
    );
  }

  function parseLocal(dt) {
    if (!dt) return null;
    var s = String(dt).trim().replace(' ', 'T');
    var t = Date.parse(s);
    return isNaN(t) ? null : t;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function skusOf(p) {
    if (p && p.skus && p.skus.length) return p.skus;
    if (!p) return [];
    return [
      {
        id: (p.id || 'x') + '-sku',
        specName: p.spec || '默认规格',
        displayName: p.spec || '默认规格',
        price: p.price,
        salePrice: p.price,
        marketPrice: p.marketPrice,
        linePrice: p.marketPrice,
        stock: p.stock,
        activityStock: p.stock,
        liveStock: p.stock
      }
    ];
  }

  function activityStockOf(sku) {
    if (!sku) return 0;
    if (sku.activityStock != null && sku.activityStock !== '') return Number(sku.activityStock) || 0;
    if (sku.liveStock != null && sku.liveStock !== '') return Number(sku.liveStock) || 0;
    return Number(sku.stock) || 0;
  }

  function makeSku(overrides) {
    var o = overrides || {};
    var stock = o.activityStock != null ? o.activityStock : o.stock != null ? o.stock : 80;
    return Object.assign(
      {
        id: 'sku-' + Math.random().toString(36).slice(2, 8),
        specName: '默认规格',
        displayName: o.specName || o.displayName || '默认规格',
        specValue: o.specValue || o.specName || '默认规格',
        barcode: o.barcode || '',
        baseUnit: o.baseUnit || o.unit || '份',
        purchasePrice: o.purchasePrice != null ? o.purchasePrice : 0.01,
        saleRatio: o.blankConfig ? '' : '1.000',
        saleUnit: o.blankConfig ? '' : o.saleUnit || '份',
        limitConfig: o.blankConfig ? '' : o.limitConfig || 'none',
        pointExchange: o.blankConfig ? '' : 'cash',
        salePrice: o.blankConfig ? '' : o.price != null ? o.price : 9.9,
        price: o.blankConfig ? '' : o.price != null ? o.price : 9.9,
        linePrice: o.blankConfig ? '' : o.marketPrice != null ? o.marketPrice : 19.9,
        marketPrice: o.blankConfig ? '' : o.marketPrice != null ? o.marketPrice : 19.9,
        minQty: o.blankConfig ? '' : 1,
        stock: o.blankConfig ? '' : stock,
        activityStock: o.blankConfig ? '' : stock,
        liveStock: o.blankConfig ? '' : stock,
        onShelf: true,
        enabled: true,
        img: o.img || ''
      },
      o
    );
  }

  function makeProduct(overrides) {
    var o = overrides || {};
    var skus = Array.isArray(o.skus) && o.skus.length ? o.skus.map(makeSku) : [makeSku(o)];
    var first = skus[0];
    var stockSum = skus.reduce(function (sum, s) {
      return sum + activityStockOf(s);
    }, 0);
    return Object.assign(
      {
        id: o.id || 'sp-' + Date.now().toString(36),
        sku: o.sku || o.code || '',
        name: o.name || '',
        category: o.category || '其他',
        categoryId: o.categoryId || o.category || '',
        spec: first.displayName || first.specName,
        price: first.salePrice != null ? first.salePrice : first.price,
        marketPrice: first.linePrice != null ? first.linePrice : first.marketPrice,
        stock: stockSum,
        status: o.status || 'draft',
        addedAt: o.addedAt || formatNow(),
        img: o.img || '',
        images: o.images || (o.img ? [o.img] : []),
        desc: o.desc || '',
        arrivalTime: o.arrivalTime || '',
        arrivalUnit: o.arrivalUnit || 'DAY',
        deliveryMode: o.deliveryMode == null ? 'express' : o.deliveryMode,
        displaySalesMode: o.displaySalesMode == null ? 'ACTUAL' : o.displaySalesMode,
        displaySales: o.displaySales || '',
        video: o.video || '',
        detailHtml: o.detailHtml || '',
        skus: skus
      },
      o,
      { skus: skus, stock: stockSum }
    );
  }

  var SEED = [
    {
      id: 'SK10005',
      name: '周末生鲜秒杀',
      timeMode: 'range',
      startAt: '2026-08-20T00:00',
      endAt: '2026-09-30T23:59',
      limitType: 'order',
      limitQty: 2,
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      portScope: 'all',
      salePorts: ['mini_program', 'app'],
      scenes: ['mall', 'live'],
      buyLimit: 'all',
      enabled: true,
      createdAt: '2026-08-18 10:00:00',
      updatedAt: '2026-08-28 16:20:11',
      products: [
        makeProduct({
          id: 'sp-10005-1',
          sku: 'SPU00113',
          name: '榴莲',
          category: '时令水果',
          img: 'https://picsum.photos/seed/spu00113/480/320',
          status: 'enabled',
          addedAt: '2026-08-18 10:12:00',
          skus: [
            makeSku({
              id: 'sku-durian-2',
              specName: '2斤装',
              displayName: '2斤装',
              specValue: '2斤装',
              price: 69.9,
              marketPrice: 99.9,
              activityStock: 50,
              barcode: '690000113002',
              sellableStock: 40
            }),
            makeSku({
              id: 'sku-durian-5',
              specName: '5斤装',
              displayName: '5斤装',
              specValue: '5斤装',
              price: 159.9,
              marketPrice: 219.9,
              activityStock: 30,
              barcode: '690000113005'
            })
          ]
        }),
        makeProduct({
          id: 'sp-10005-beef',
          sku: 'beef-tendon',
          mallProductId: 'beef-tendon',
          name: '精选金钱牛腱子肉 软嫩弹牙',
          category: '肉禽蛋品',
          img: '../user-app/assets/shop/beef-hero.svg',
          status: 'enabled',
          addedAt: '2026-08-18 11:00:00',
          deliveryMode: 'express',
          displaySalesMode: 'CUSTOM',
          displaySales: '888',
          skus: [
            makeSku({
              id: 'sku-beef-500',
              specName: '精选金钱牛腱子肉 500g',
              displayName: '精选金钱牛腱子肉 500g',
              specValue: '500g',
              price: 49.9,
              marketPrice: 68,
              activityStock: 30,
              sellableStock: 80,
              saleUnit: '份',
              limitConfig: 'none',
              minQty: 1
            }),
            makeSku({
              id: 'sku-beef-1kg',
              specName: '精选金钱牛腱子肉 1kg',
              displayName: '精选金钱牛腱子肉 1kg',
              specValue: '1kg',
              price: 88,
              marketPrice: 96.8,
              activityStock: 20,
              sellableStock: 15,
              saleUnit: '份',
              limitConfig: 'none',
              minQty: 1
            })
          ]
        }),
        makeProduct({
          id: 'sp-10005-2',
          sku: 'SPU00088',
          name: '红壳黄心鲜鸡蛋',
          category: '肉禽蛋品',
          img: 'https://picsum.photos/seed/spu00088/480/320',
          status: 'enabled',
          addedAt: '2026-08-18 10:20:00',
          skus: [
            makeSku({
              id: 'sku-egg-10',
              specName: '10枚装',
              displayName: '10枚装',
              specValue: '10枚装',
              price: 12.9,
              marketPrice: 18.9,
              activityStock: 200
            }),
            makeSku({
              id: 'sku-egg-30',
              specName: '30枚装',
              displayName: '30枚装',
              specValue: '30枚装',
              price: 32.9,
              marketPrice: 45.9,
              activityStock: 80
            })
          ]
        }),
        makeProduct({
          id: 'sp-10005-3',
          sku: 'SPU00085',
          name: '圆茄 优质',
          category: '新鲜蔬菜',
          img: 'https://picsum.photos/seed/spu00085/480/320',
          status: 'draft',
          addedAt: '2026-08-19 09:00:00',
          price: 6.9,
          marketPrice: 9.9,
          activityStock: 120
        })
      ]
    },
    {
      id: 'SK10004',
      name: '国庆预热秒杀',
      timeMode: 'range',
      startAt: '2026-10-01T00:00',
      endAt: '2026-10-07T23:59',
      limitType: 'none',
      limitQty: '',
      saleScope: 'region',
      saleRegions: { '110000': true },
      saleRegionSummary: [{ id: '110000', label: '北京市' }],
      saleStores: {},
      portScope: 'custom',
      salePorts: ['mini_program'],
      scenes: ['mall'],
      buyLimit: 'all',
      enabled: true,
      createdAt: '2026-08-25 14:00:00',
      updatedAt: '2026-08-25 14:00:00',
      products: [
        makeProduct({
          id: 'sp-10004-1',
          sku: 'SPU00090',
          name: '东北大米 5kg',
          category: '粮油调味',
          img: 'https://picsum.photos/seed/spu00090/480/320',
          status: 'enabled',
          price: 29.9,
          marketPrice: 49.9,
          activityStock: 300
        })
      ]
    },
    {
      id: 'SK10003',
      name: '夏季水果闪购',
      timeMode: 'range',
      startAt: '2026-06-01T00:00',
      endAt: '2026-08-31T23:59',
      limitType: 'daily',
      limitQty: 3,
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      portScope: 'all',
      salePorts: ['mini_program', 'app'],
      scenes: ['mall', 'live'],
      buyLimit: 'all',
      enabled: true,
      createdAt: '2026-05-20 11:00:00',
      updatedAt: '2026-08-31 23:59:00',
      products: [
        makeProduct({
          id: 'sp-10003-1',
          sku: 'SPU00101',
          name: '豌豆',
          category: '新鲜蔬菜',
          img: 'https://picsum.photos/seed/spu00101/480/320',
          status: 'disabled',
          price: 8.9,
          marketPrice: 12.9,
          activityStock: 0
        })
      ]
    },
    {
      id: 'SK10002',
      name: '新人专享秒杀（已下线）',
      timeMode: 'forever',
      startAt: '2026-03-01T00:00',
      endAt: '',
      limitType: 'total',
      limitQty: 1,
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      portScope: 'all',
      salePorts: ['mini_program', 'app'],
      scenes: ['mall'],
      buyLimit: 'neu',
      unqualifiedMode: 'origin',
      enabled: false,
      createdAt: '2026-02-18 11:05:00',
      updatedAt: '2026-07-02 11:08:00',
      products: [
        makeProduct({
          id: 'sp-10002-1',
          sku: 'SPU00082',
          name: '可口可乐摩登罐',
          category: '酒水饮料',
          img: 'https://picsum.photos/seed/spu00082/480/320',
          status: 'enabled',
          skus: [
            makeSku({
              id: 'sku-cola-330',
              specName: '330ml',
              displayName: '330ml',
              specValue: '330ml',
              price: 2.5,
              marketPrice: 3.5,
              activityStock: 500
            }),
            makeSku({
              id: 'sku-cola-6',
              specName: '6罐装',
              displayName: '6罐装',
              specValue: '6罐装',
              price: 12.9,
              marketPrice: 18.9,
              activityStock: 200
            })
          ]
        })
      ]
    },
    {
      id: 'SK10001',
      name: '直播间常驻秒杀',
      timeMode: 'forever',
      startAt: '2026-01-15T00:00',
      endAt: '',
      limitType: 'order',
      limitQty: 5,
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      portScope: 'custom',
      salePorts: ['app'],
      scenes: ['live'],
      buyLimit: 'all',
      enabled: true,
      createdAt: '2026-01-10 09:30:00',
      updatedAt: '2026-08-01 18:00:00',
      products: [
        makeProduct({
          id: 'sp-10001-1',
          sku: 'SPU00078',
          name: '长茄子 广茄',
          category: '新鲜蔬菜',
          img: 'https://picsum.photos/seed/spu00078/480/320',
          status: 'enabled',
          price: 5.9,
          marketPrice: 8.9,
          activityStock: 90
        }),
        makeProduct({
          id: 'sp-10001-2',
          sku: 'SPU00098',
          name: '茶叶',
          category: '休闲零食',
          img: 'https://picsum.photos/seed/spu00098/480/320',
          status: 'enabled',
          price: 39.9,
          marketPrice: 59.9,
          activityStock: 40
        })
      ]
    }
  ];

  var SEED_LOGS = [
    {
      id: 'log-sk10005-1',
      activityId: 'SK10005',
      timestamp: '2026-08-18 10:00:00',
      action: 'create',
      operator: '张征',
      success: true,
      httpMethod: 'POST',
      requestUri: '/marketing/seckill',
      clientIp: '127.0.0.1',
      service: 'marketing-admin',
      elapsedMs: 18,
      resource: 'seckill',
      resourceId: 'SK10005',
      requestParams: '{"name":"周末生鲜秒杀"}',
      changes: [{ field: 'name', oldValue: '', newValue: '周末生鲜秒杀' }]
    },
    {
      id: 'log-sk10005-2',
      activityId: 'SK10005',
      timestamp: '2026-08-18 10:12:00',
      action: 'addProduct',
      operator: '张征',
      success: true,
      httpMethod: 'POST',
      requestUri: '/marketing/seckill/SK10005/products',
      clientIp: '127.0.0.1',
      service: 'marketing-admin',
      elapsedMs: 12,
      resource: 'seckill',
      resourceId: 'SK10005',
      requestParams: '{"sku":"SPU00113"}',
      changes: [{ field: 'products', oldValue: '0', newValue: '1' }]
    },
    {
      id: 'log-sk10002-1',
      activityId: 'SK10002',
      timestamp: '2026-07-02 11:08:00',
      action: 'disable',
      operator: '张征',
      success: true,
      httpMethod: 'PUT',
      requestUri: '/marketing/seckill/SK10002/disable',
      clientIp: '127.0.0.1',
      service: 'marketing-admin',
      elapsedMs: 9,
      resource: 'seckill',
      resourceId: 'SK10002',
      requestParams: '{"enabled":false}',
      changes: [{ field: 'status', oldValue: '进行中', newValue: '已禁用' }]
    }
  ];

  var list = [];
  var logs = [];
  var loaded = false;

  function emptyItem() {
    return {
      id: '',
      name: '',
      timeMode: 'range',
      startAt: '',
      endAt: '',
      limitType: 'none',
      limitQty: '',
      saleScope: 'all',
      saleRegions: {},
      saleRegionSummary: [],
      saleStores: {},
      portScope: 'all',
      salePorts: ['mini_program', 'app'],
      scenes: ['mall'],
      buyLimit: 'all',
      unqualifiedMode: 'deny',
      enabled: true,
      createdAt: '',
      updatedAt: '',
      products: []
    };
  }

  function normalizeItem(raw) {
    var item = Object.assign(emptyItem(), raw || {});
    item.id = String(item.id || '');
    item.name = String(item.name || '').trim();
    item.timeMode = item.timeMode === 'forever' ? 'forever' : 'range';
    item.startAt = String(item.startAt || '').trim();
    item.endAt = item.timeMode === 'forever' ? '' : String(item.endAt || '').trim();
    if (item.limitType !== 'order' && item.limitType !== 'daily' && item.limitType !== 'total') {
      item.limitType = 'none';
    }
    var qty = Number(item.limitQty);
    item.limitQty = item.limitType === 'none' ? '' : isNaN(qty) || qty < 1 ? 1 : Math.round(qty);
    if (item.saleScope !== 'region' && item.saleScope !== 'store') item.saleScope = 'all';
    item.saleRegions = item.saleRegions && typeof item.saleRegions === 'object' ? item.saleRegions : {};
    item.saleRegionSummary = Array.isArray(item.saleRegionSummary) ? item.saleRegionSummary : [];
    item.saleStores = item.saleStores && typeof item.saleStores === 'object' ? item.saleStores : {};
    item.portScope = item.portScope === 'custom' ? 'custom' : 'all';
    var ports = Array.isArray(item.salePorts) ? item.salePorts.slice() : [];
    ports = ports.filter(function (p) {
      return p === 'mini_program' || p === 'app';
    });
    if (item.portScope === 'all' || !ports.length) ports = ['mini_program', 'app'];
    item.salePorts = ports;
    var scenes = Array.isArray(item.scenes) ? item.scenes.slice() : [];
    scenes = scenes.filter(function (s) {
      return s === 'mall' || s === 'live';
    });
    if (!scenes.length) scenes = ['mall'];
    item.scenes = scenes;
    item.buyLimit = item.buyLimit === 'neu' ? 'neu' : 'all';
    item.unqualifiedMode = item.unqualifiedMode === 'origin' ? 'origin' : 'deny';
    item.enabled = item.enabled !== false;
    var nowStr = formatNow();
    item.createdAt = String(item.createdAt || nowStr);
    item.updatedAt = String(item.updatedAt || nowStr);
    item.products = Array.isArray(item.products) ? item.products.map(function (p) {
      return makeProduct(p);
    }) : [];
    return item;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (e) {}
  }

  function load() {
    if (loaded) return;
    loaded = true;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          list = parsed.map(normalizeItem);
        }
      }
    } catch (e) {
      list = [];
    }
    if (!list.length) list = SEED.map(normalizeItem);
    try {
      var rawLogs = localStorage.getItem(LOG_KEY);
      if (rawLogs) {
        var parsedLogs = JSON.parse(rawLogs);
        if (Array.isArray(parsedLogs)) logs = parsedLogs;
      }
    } catch (e) {
      logs = [];
    }
    if (!logs.length) logs = SEED_LOGS.slice();
    ensureMallDemoProduct();
  }

  function ensureMallDemoProduct() {
    var idx = findIndex('SK10005');
    if (idx < 0) return;
    var item = list[idx];
    var has = (item.products || []).some(function (p) {
      return p.id === 'sp-10005-beef' || p.mallProductId === 'beef-tendon' || p.sku === 'beef-tendon';
    });
    if (has) return;
    var seed = (SEED[0] && SEED[0].products) || [];
    var beef = null;
    for (var i = 0; i < seed.length; i++) {
      if (seed[i].id === 'sp-10005-beef') {
        beef = seed[i];
        break;
      }
    }
    if (!beef) return;
    item.products = (item.products || []).concat([makeProduct(beef)]);
    persist();
  }

  function computeStatus(item, nowMs) {
    if (!item || item.enabled === false) return 'disabled';
    var now = nowMs != null ? nowMs : Date.now();
    var start = parseLocal(item.startAt);
    var end = item.timeMode === 'forever' ? null : parseLocal(item.endAt);
    if (start != null && now < start) return 'upcoming';
    if (end != null && now > end) return 'ended';
    return 'active';
  }

  function statusLabel(st) {
    return STATUS_LABEL[st] || '—';
  }

  function formatRange(item) {
    if (!item) return '—';
    if (item.timeMode === 'forever') {
      var start = String(item.startAt || '').replace('T', ' ');
      return start ? start + ' 起 永久有效' : '永久有效';
    }
    var a = String(item.startAt || '').replace('T', ' ');
    var b = String(item.endAt || '').replace('T', ' ');
    if (!a && !b) return '—';
    return (a || '—') + ' 至 ' + (b || '—');
  }

  function scenesText(item) {
    return ((item && item.scenes) || [])
      .map(function (s) {
        return SCENE_LABEL[s] || s;
      })
      .join('、') || '—';
  }

  function nextId() {
    load();
    var max = 10000;
    list.forEach(function (item) {
      var n = Number(String(item.id || '').replace(/^SK/i, ''));
      if (!isNaN(n) && n > max) max = n;
    });
    return 'SK' + (max + 1);
  }

  function getList() {
    load();
    return list.slice().sort(function (a, b) {
      return String(b.id).localeCompare(String(a.id), 'en', { numeric: true });
    });
  }

  function getById(id) {
    load();
    id = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return clone(list[i]);
    }
    return null;
  }

  function findIndex(id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  function productMatch(item, productName, productCode) {
    var nameKw = String(productName || '').trim().toLowerCase();
    var codeKw = String(productCode || '').trim().toLowerCase();
    if (!nameKw && !codeKw) return true;
    var products = (item && item.products) || [];
    return products.some(function (p) {
      var nameHit = !nameKw || String(p.name || '').toLowerCase().indexOf(nameKw) >= 0;
      if (!codeKw) return nameHit;
      var codes = [p.sku, p.id];
      skusOf(p).forEach(function (s) {
        codes.push(s.id, s.barcode);
      });
      var codeHit = codes.some(function (c) {
        return String(c || '').toLowerCase().indexOf(codeKw) >= 0;
      });
      return nameHit && codeHit;
    });
  }

  function timeOverlap(item, filterStart, filterEnd) {
    var fs = parseLocal(filterStart);
    var fe = parseLocal(filterEnd);
    if (fs == null && fe == null) return true;
    var start = parseLocal(item.startAt);
    var end = item.timeMode === 'forever' ? null : parseLocal(item.endAt);
    if (fs != null && end != null && end < fs) return false;
    if (fe != null && start != null && start > fe) return false;
    return true;
  }

  function filterList(q) {
    q = q || {};
    var idKw = String(q.id || '').trim().toLowerCase();
    var nameKw = String(q.name || '').trim().toLowerCase();
    var status = String(q.status || '').trim();
    return getList().filter(function (item) {
      if (idKw && String(item.id).toLowerCase().indexOf(idKw) < 0) return false;
      if (nameKw && String(item.name).toLowerCase().indexOf(nameKw) < 0) return false;
      if (status && computeStatus(item) !== status) return false;
      if (!timeOverlap(item, q.timeStart, q.timeEnd)) return false;
      if (!productMatch(item, q.productName, q.productCode)) return false;
      return true;
    });
  }

  function pushLog(item, action, changes, extra) {
    extra = extra || {};
    logs.unshift({
      id: 'log-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      activityId: item.id,
      timestamp: formatNow(),
      action: action,
      operator: extra.operator || '张征',
      success: extra.success !== false,
      httpMethod: extra.httpMethod || 'POST',
      requestUri: extra.requestUri || '/marketing/seckill/' + item.id,
      clientIp: extra.clientIp || '127.0.0.1',
      service: extra.service || 'marketing-admin',
      elapsedMs: extra.elapsedMs != null ? extra.elapsedMs : 8,
      resource: 'seckill',
      resourceId: item.id,
      requestParams: extra.requestParams || JSON.stringify({ id: item.id, name: item.name }),
      changes: changes || []
    });
    persist();
  }

  function saveItem(raw, opts) {
    load();
    opts = opts || {};
    var item = normalizeItem(raw);
    var idx = findIndex(item.id);
    var isNew = idx < 0;
    if (isNew) {
      if (!item.id) item.id = nextId();
      item.createdAt = item.createdAt || formatNow();
      item.updatedAt = formatNow();
      list.unshift(item);
      if (opts.log !== false) {
        pushLog(item, 'create', [{ field: 'name', oldValue: '', newValue: item.name }]);
      }
    } else {
      var before = list[idx];
      item.createdAt = before.createdAt;
      item.updatedAt = formatNow();
      list[idx] = item;
      if (opts.log !== false) {
        pushLog(item, 'update', [
          { field: 'name', oldValue: before.name, newValue: item.name }
        ]);
      }
    }
    persist();
    return clone(item);
  }

  function setEnabled(id, enabled) {
    load();
    var idx = findIndex(id);
    if (idx < 0) return null;
    var item = list[idx];
    var before = computeStatus(item);
    item.enabled = !!enabled;
    item.updatedAt = formatNow();
    persist();
    pushLog(item, enabled ? 'enable' : 'disable', [
      { field: 'status', oldValue: statusLabel(before), newValue: statusLabel(computeStatus(item)) }
    ]);
    return clone(item);
  }

  function listLogs(activityId, pageNum, pageSize) {
    load();
    var rows = logs.filter(function (row) {
      return row.activityId === activityId;
    });
    var page = Math.max(1, pageNum || 1);
    var size = pageSize || 10;
    var start = (page - 1) * size;
    return { list: rows.slice(start, start + size), total: rows.length };
  }

  function findLog(id) {
    load();
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].id === id) return logs[i];
    }
    return null;
  }

  function setWorking(item) {
    try {
      sessionStorage.setItem(WORKING_KEY, JSON.stringify(normalizeItem(item)));
    } catch (e) {}
    return getWorking();
  }

  function getWorking() {
    try {
      var raw = sessionStorage.getItem(WORKING_KEY);
      if (!raw) return null;
      return normalizeItem(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  function clearWorking() {
    try {
      sessionStorage.removeItem(WORKING_KEY);
    } catch (e) {}
  }

  function startWorking(source) {
    var item = source ? normalizeItem(source) : emptyItem();
    return setWorking(item);
  }

  function upsertWorkingProduct(product) {
    var working = getWorking();
    if (!working) return null;
    var next = makeProduct(product);
    var found = false;
    working.products = (working.products || []).map(function (p) {
      if (p.id === next.id) {
        found = true;
        return next;
      }
      return p;
    });
    if (!found) working.products.unshift(next);
    setWorking(working);
    return next;
  }

  function libraryItemToProduct(item) {
    return makeProduct({
      id: 'sp-' + Date.now().toString(36) + '-' + item.code,
      sku: item.code,
      mallProductId: item.code,
      name: item.name || item.code,
      category: item.category || '其他',
      categoryId: item.category || '其他',
      img: item.img || '',
      status: 'draft',
      addedAt: formatNow(),
      fromLibrary: true,
      deliveryMode: '',
      displaySalesMode: '',
      displaySales: '',
      skus: [
        makeSku({
          id: item.code + '-sku-1',
          specName: '默认规格',
          displayName: '默认规格',
          specValue: '默认规格',
          blankConfig: true,
          img: item.img || ''
        })
      ]
    });
  }

  function isBlank(v) {
    return v == null || String(v).trim() === '';
  }

  function productReadyCheck(product) {
    var p = product || {};
    if (p.deliveryMode !== 'express' && p.deliveryMode !== 'pickup') {
      return { ok: false, message: '请先编辑商品，补充配送方式后再上架' };
    }
    if (p.displaySalesMode !== 'ACTUAL' && p.displaySalesMode !== 'CUSTOM') {
      return { ok: false, message: '请先编辑商品，补充展示销量后再上架' };
    }
    if (p.displaySalesMode === 'CUSTOM' && isBlank(p.displaySales)) {
      return { ok: false, message: '请填写自定义展示销量后再上架' };
    }
    var skus = skusOf(p);
    if (!skus.length) return { ok: false, message: '请至少配置一个规格后再上架' };
    for (var i = 0; i < skus.length; i++) {
      var s = skus[i];
      var label = s.displayName || s.specName || s.id || '规格';
      if (isBlank(s.saleUnit)) return { ok: false, message: '请补充「' + label + '」的售卖单位后再上架' };
      if (isBlank(s.limitConfig)) return { ok: false, message: '请补充「' + label + '」的限购配置后再上架' };
      if (isBlank(s.pointExchange)) return { ok: false, message: '请补充「' + label + '」的积分兑换后再上架' };
      if (s.pointExchange !== 'points' && s.pointExchange !== 'POINTS_ONLY' && isBlank(s.salePrice) && isBlank(s.price)) {
        return { ok: false, message: '请补充「' + label + '」的秒杀价后再上架' };
      }
      if (isBlank(s.minQty)) return { ok: false, message: '请补充「' + label + '」的起售量后再上架' };
      if (isBlank(s.activityStock) && isBlank(s.liveStock) && isBlank(s.stock)) {
        return { ok: false, message: '请补充「' + label + '」的活动库存后再上架' };
      }
    }
    return { ok: true };
  }

  function realStockOf(sku) {
    if (!sku) return null;
    var n = sku.sellableStock != null && sku.sellableStock !== ''
      ? Number(sku.sellableStock)
      : sku.spotStock != null && sku.spotStock !== ''
        ? Number(sku.spotStock)
        : NaN;
    return isNaN(n) ? null : n;
  }

  function orderableStockOf(sku) {
    var act = activityStockOf(sku);
    var real = realStockOf(sku);
    if (real == null) return act;
    return Math.min(act, real);
  }

  global.MdmMarketingSeckillStore = {
    STATUS_LABEL: STATUS_LABEL,
    LIMIT_LABEL: LIMIT_LABEL,
    SCENE_LABEL: SCENE_LABEL,
    PORT_LABEL: PORT_LABEL,
    BUY_LABEL: BUY_LABEL,
    SCOPE_LABEL: SCOPE_LABEL,
    ACTION_LABEL: ACTION_LABEL,
    CATEGORIES: CATEGORIES,
    emptyItem: emptyItem,
    normalizeItem: normalizeItem,
    makeProduct: makeProduct,
    makeSku: makeSku,
    skusOf: skusOf,
    activityStockOf: activityStockOf,
    computeStatus: computeStatus,
    statusLabel: statusLabel,
    formatRange: formatRange,
    scenesText: scenesText,
    formatNow: formatNow,
    nextId: nextId,
    getList: getList,
    getById: getById,
    filterList: filterList,
    saveItem: saveItem,
    setEnabled: setEnabled,
    listLogs: listLogs,
    findLog: findLog,
    pushLog: pushLog,
    setWorking: setWorking,
    getWorking: getWorking,
    clearWorking: clearWorking,
    startWorking: startWorking,
    upsertWorkingProduct: upsertWorkingProduct,
    libraryItemToProduct: libraryItemToProduct,
    productReadyCheck: productReadyCheck,
    realStockOf: realStockOf,
    orderableStockOf: orderableStockOf
  };
})(window);
