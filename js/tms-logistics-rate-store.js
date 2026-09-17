/**
 * 仓储 / TMS — 物流费率表（演示数据 + 匹配计费）
 *
 * 设计对齐 SCM/logistics_rate.html：
 * - 费用方案：重量计费（首重 + 续重）/ 金额计费（货款阶梯）
 * - 计费重量 = max(毛重, 抛重)；抛重 = 长×宽×高 / 5000 × (重抛比右/左)
 * - 订单渠道：零售订单、代采订单（原型有，费率表页一并补齐）
 * - 目的地多级匹配，越细越优先：区 > 市 > 省 > 全国（兜底）
 *   仅「该级写了、更细一级为空」的配置可在该级命中，区级专属费率不会当成市级兜底
 * - 常温 / 冷链费率不同，按商品温层匹配物流类型
 * - 同路线同物流类型只启用一家承运商，匹配取目的地粒度最高的一条
 * - 代采 / 直播编辑商品页按订单渠道命中展示物流费率（选品库不再展示）
 * - 是否包邮读商城 / 直播 / 代采编辑商品里履约方式旁的「是否包邮」
 * - 履约路径（代采配送）：始发=门店对应配送仓，目的=门店地址；一门店只对应一个配送仓，只展示一条线路
 */
(function (global) {
  var STORAGE_KEY = 'lf_tms_logistics_rate_v5';
  var CHANNEL_RETAIL = '零售订单';
  var CHANNEL_PROXY = '代采订单';
  var LEVELS = { district: 4, city: 3, province: 2, nationwide: 1 };
  var DEMO_DEST = { province: '江苏省', city: '南京市', district: '江宁区' };
  var DEMO_USER_DEST = { province: '江苏省', city: '南京市', district: '江宁区' };
  var DEMO_SUPPLIER = {
    id: '斯斯供应商商家',
    label: '斯斯供应商 · 江苏省南京市江宁区'
  };
  var STORE_PROFILES = {
    'st-001': { name: '振宁十足', warehouse: 'W002 嘉兴仓', dest: { province: '浙江省', city: '杭州市', district: '萧山区' } },
    'st-002': { name: '萧山万达店', warehouse: 'W002 嘉兴仓', dest: { province: '浙江省', city: '杭州市', district: '萧山区' } },
    'st-003': { name: '西湖文三路店', warehouse: 'W002 嘉兴仓', dest: { province: '浙江省', city: '杭州市', district: '西湖区' } },
    'st-004': { name: '滨江网商路店', warehouse: 'W002 嘉兴仓', dest: { province: '浙江省', city: '杭州市', district: '滨江区' } },
    'st-007': { name: '浦东陆家嘴店', warehouse: 'W003 上海仓', dest: { province: '上海市', city: '上海市', district: '浦东新区' } },
    'st-015': { name: '鼓楼湖南路店', warehouse: 'W001 南京仓', dest: { province: '江苏省', city: '南京市', district: '鼓楼区' } },
    'st-016': { name: '工业园金鸡湖店', warehouse: 'W001 南京仓', dest: { province: '江苏省', city: '苏州市', district: '工业园区' } },
    'st-jiangning': { name: '江宁科学园店', warehouse: 'W001 南京仓', dest: { province: '江苏省', city: '南京市', district: '江宁区' } }
  };
  var DEMO_STORES = [STORE_PROFILES['st-jiangning']];
  var WAREHOUSE_BY_REGION = {
    '320000': 'W001 南京仓',
    '330000': 'W002 嘉兴仓',
    '310000': 'W003 上海仓'
  };

  var SEED = [
    {
      id: 'R001',
      origin: 'W001 南京仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL],
      destProvince: '江苏省',
      destCity: '南京市',
      destDistrict: '江宁区',
      days: '1',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '0.95',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '8', cont: '2' },
        { start: '1', end: '5', price: '12', cont: '1.5' },
        { start: '5', end: '999', price: '20', cont: '1' }
      ]
    },
    {
      id: 'R002',
      origin: 'W001 南京仓',
      carrier: 'ZTO 中通快递',
      logisticsType: '冷链',
      channels: [CHANNEL_PROXY],
      destProvince: '江苏省',
      destCity: '南京市',
      destDistrict: '鼓楼区',
      days: '1',
      feeScheme: '重量计费',
      ratio: '1:4',
      extra: '是',
      extras: [
        { name: '保价费', amount: '5', min: '2', rate: '0.5' },
        { name: '派送费', amount: '8', min: '3', rate: '1' }
      ],
      freightDiscount: '0.95',
      settleDiscount: '0.90',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '12', cont: '3' },
        { start: '1', end: '10', price: '18', cont: '2' },
        { start: '10', end: '999', price: '30', cont: '1.5' }
      ]
    },
    {
      id: 'R003',
      origin: 'W002 嘉兴仓',
      carrier: 'YTO 圆通速递',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL],
      destProvince: '浙江省',
      destCity: '杭州市',
      destDistrict: '余杭区',
      days: '2',
      feeScheme: '金额计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '1.00',
      enabled: true,
      tiers: [
        { start: '0', end: '100', price: '6' },
        { start: '100', end: '500', price: '10' },
        { start: '500', end: '9999', price: '15' }
      ]
    },
    {
      id: 'R004',
      origin: 'W003 上海仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '冷链',
      channels: [CHANNEL_RETAIL],
      destProvince: '上海市',
      destCity: '上海市',
      destDistrict: '浦东新区',
      days: '1',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '是',
      extras: [
        { name: '保价费', amount: '6', min: '3', rate: '0.8' },
        { name: '派送费', amount: '10', min: '5', rate: '1.2' }
      ],
      freightDiscount: '0.90',
      settleDiscount: '0.88',
      enabled: true,
      tiers: [
        { start: '0', end: '2', price: '10', cont: '2.5' },
        { start: '2', end: '8', price: '16', cont: '2' },
        { start: '8', end: '999', price: '28', cont: '1.2' }
      ]
    },
    {
      id: 'R005',
      origin: 'W002 嘉兴仓',
      carrier: 'ZTO 中通快递',
      logisticsType: '常温',
      channels: [CHANNEL_PROXY],
      destProvince: '浙江省',
      destCity: '嘉兴市',
      destDistrict: '南湖区',
      days: '1',
      feeScheme: '金额计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '0.95',
      enabled: true,
      tiers: [
        { start: '0', end: '200', price: '7' },
        { start: '200', end: '800', price: '12' },
        { start: '800', end: '9999', price: '18' }
      ]
    },
    {
      id: 'R006',
      origin: 'W001 南京仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL, CHANNEL_PROXY],
      destProvince: '江苏省',
      destCity: '南京市',
      destDistrict: '',
      days: '2',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '0.95',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '10', cont: '2.5' },
        { start: '1', end: '5', price: '14', cont: '2' },
        { start: '5', end: '999', price: '22', cont: '1.2' }
      ]
    },
    {
      id: 'R007',
      origin: 'W001 南京仓',
      carrier: 'YTO 圆通速递',
      logisticsType: '常温',
      channels: [CHANNEL_PROXY],
      destProvince: '江苏省',
      destCity: '',
      destDistrict: '',
      days: '2',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '1.00',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '11', cont: '2.5' },
        { start: '1', end: '5', price: '15', cont: '2' },
        { start: '5', end: '999', price: '24', cont: '1.5' }
      ]
    },
    {
      id: 'R008',
      origin: 'W001 南京仓',
      carrier: 'ZTO 中通快递',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL, CHANNEL_PROXY],
      destProvince: '全国',
      destCity: '',
      destDistrict: '',
      days: '3',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '1.00',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '15', cont: '4' },
        { start: '1', end: '5', price: '22', cont: '3' },
        { start: '5', end: '999', price: '36', cont: '2' }
      ]
    },
    {
      id: 'R009',
      origin: 'W001 南京仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '冷链',
      channels: [CHANNEL_RETAIL, CHANNEL_PROXY],
      destProvince: '全国',
      destCity: '',
      destDistrict: '',
      days: '2',
      feeScheme: '重量计费',
      ratio: '1:4',
      extra: '否',
      extras: [],
      freightDiscount: '1.00',
      settleDiscount: '0.95',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '18', cont: '5' },
        { start: '1', end: '10', price: '28', cont: '3' },
        { start: '10', end: '999', price: '45', cont: '2' }
      ]
    },
    {
      id: 'R010',
      origin: 'W001 南京仓',
      carrier: 'YTO 圆通速递',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL],
      destProvince: '江苏省',
      destCity: '南京市',
      destDistrict: '江宁区',
      days: '2',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '是',
      extras: [{ name: '派送费', amount: '6', min: '3', rate: '0.8' }],
      freightDiscount: '0.90',
      settleDiscount: '0.92',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '6', cont: '1.5' },
        { start: '1', end: '5', price: '9', cont: '1.2' },
        { start: '5', end: '999', price: '16', cont: '0.8' }
      ]
    },
    {
      id: 'R011',
      origin: 'W001 南京仓',
      carrier: 'ZTO 中通快递',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL, CHANNEL_PROXY],
      destProvince: '江苏省',
      destCity: '南京市',
      destDistrict: '江宁区',
      days: '2',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '是',
      extras: [
        { name: '保价费', amount: '4', min: '2', rate: '0.4' },
        { name: '派送费', amount: '5', min: '2', rate: '0.6' }
      ],
      upstairs: {
        enabled: true,
        freeKg: '5',
        lift: { base: '5', weight: '0.2', floor: '2', qty: '0' },
        noLift: { base: '8', weight: '0.3', floor: '3', qty: '0' }
      },
      freightDiscount: '0.85',
      settleDiscount: '0.88',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '7', cont: '1.8' },
        { start: '1', end: '5', price: '11', cont: '1.4' },
        { start: '5', end: '999', price: '18', cont: '1' }
      ]
    },
    {
      id: 'R012',
      origin: 'W001 南京仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '冷链',
      channels: [CHANNEL_RETAIL],
      destProvince: '江苏省',
      destCity: '南京市',
      destDistrict: '江宁区',
      days: '1',
      feeScheme: '重量计费',
      ratio: '1:4',
      extra: '是',
      extras: [{ name: '保价费', amount: '8', min: '4', rate: '1' }],
      freightDiscount: '0.95',
      settleDiscount: '0.90',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '16', cont: '4' },
        { start: '1', end: '5', price: '24', cont: '3' },
        { start: '5', end: '999', price: '38', cont: '2' }
      ]
    },
    {
      id: 'R013',
      origin: 'W002 嘉兴仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL, CHANNEL_PROXY],
      destProvince: '浙江省',
      destCity: '',
      destDistrict: '',
      days: '2',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '否',
      extras: [],
      freightDiscount: '0.95',
      settleDiscount: '0.92',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '9', cont: '2' },
        { start: '1', end: '5', price: '13', cont: '1.6' },
        { start: '5', end: '999', price: '21', cont: '1.2' }
      ]
    },
    {
      id: 'R014',
      origin: 'W002 嘉兴仓',
      carrier: 'YTO 圆通速递',
      logisticsType: '常温',
      channels: [CHANNEL_RETAIL, CHANNEL_PROXY],
      destProvince: '全国',
      destCity: '',
      destDistrict: '',
      days: '3',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '是',
      extras: [{ name: '派送费', amount: '5', min: '2', rate: '0.6' }],
      freightDiscount: '0.90',
      settleDiscount: '0.90',
      enabled: true,
      tiers: [
        { start: '0', end: '1', price: '14', cont: '3' },
        { start: '1', end: '5', price: '20', cont: '2.4' },
        { start: '5', end: '999', price: '32', cont: '1.8' }
      ]
    },
    {
      id: 'R015',
      origin: 'W002 嘉兴仓',
      carrier: 'SF 顺丰速运',
      logisticsType: '常温',
      channels: [CHANNEL_PROXY],
      destProvince: '浙江省',
      destCity: '杭州市',
      destDistrict: '萧山区',
      days: '1',
      feeScheme: '重量计费',
      ratio: '1:3',
      extra: '是',
      extras: [
        { name: '保价费', amount: '', min: '2', rate: '0.4' },
        { name: '派送费', amount: '8', min: '', rate: '' }
      ],
      upstairs: {
        enabled: true,
        freeKg: '5',
        lift: { base: '5', weight: '0.2', floor: '2', qty: '0' },
        noLift: { base: '8', weight: '0.3', floor: '3', qty: '0' }
      },
      freightDiscount: '0.95',
      settleDiscount: '0.95',
      enabled: true,
      tiers: [
        { start: '0', end: '1', first: '1', price: '12', cont: '3' },
        { start: '1', end: '10', first: '1', price: '12', cont: '3' },
        { start: '10', end: '999', first: '1', price: '12', cont: '2' }
      ]
    },
    {
      id: 'R016',
      origin: 'W002 嘉兴仓',
      carrier: 'ZTO 中通快递',
      logisticsType: '冷链',
      channels: [CHANNEL_PROXY],
      destProvince: '浙江省',
      destCity: '杭州市',
      destDistrict: '',
      days: '1',
      feeScheme: '重量计费',
      ratio: '1:4',
      extra: '是',
      extras: [
        { name: '保价费', amount: '', min: '3', rate: '0.8' },
        { name: '派送费', amount: '6', min: '', rate: '' }
      ],
      upstairs: {
        enabled: true,
        freeKg: '5',
        lift: { base: '6', weight: '0.25', floor: '2.5', qty: '0' },
        noLift: { base: '10', weight: '0.4', floor: '4', qty: '0' }
      },
      freightDiscount: '0.95',
      settleDiscount: '0.90',
      enabled: true,
      tiers: [
        { start: '0', end: '1', first: '1', price: '16', cont: '4' },
        { start: '1', end: '8', first: '1', price: '24', cont: '2.5' },
        { start: '8', end: '999', first: '1', price: '38', cont: '2' }
      ]
    }
  ];

  var rows = [];

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
      /* ignore */
    }
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          rows = parsed;
          mergeMissingSeeds();
          return;
        }
      }
    } catch (e) {
      /* ignore */
    }
    rows = clone(SEED);
    persist();
  }

  function mergeMissingSeeds() {
    var have = {};
    rows.forEach(function (row) { have[row.id] = true; });
    var added = false;
    SEED.forEach(function (seed) {
      if (have[seed.id]) return;
      rows.push(clone(seed));
      added = true;
    });
    if (added) persist();
  }

  function ensureLoaded() {
    if (!rows.length) load();
    return rows;
  }

  function getAll() {
    return clone(ensureLoaded());
  }

  function formatFeeTiersHtml(scheme, tiers) {
    var isAmount = scheme === '金额计费';
    return (tiers || [])
      .map(function (tier) {
        if (isAmount) {
          return toNum(tier.price) <= 0
            ? tier.start + '~' + tier.end + '元 免运费'
            : tier.start + '~' + tier.end + '元 运费¥' + tier.price;
        }
        var firstW = firstWeightOf(tier);
        return tier.start + '~' + tier.end + 'kg 首重' + firstW + 'kg ¥' + tier.price + ' 续¥' + (tier.cont || '0') + '/KG';
      })
      .join('<br>');
  }

  function formatExtraHtml(extra, extras) {
    if (extra !== '是' || !extras || !extras.length) return '否';
    return extras
      .map(function (item) {
        if (item.name === '保价费') {
          return '保价费 max(最低¥' + toNum(item.min).toFixed(2) + '，货款×' + toNum(item.rate) + '%)';
        }
        if (item.name === '派送费') {
          return '派送费 每票¥' + toNum(item.amount).toFixed(2);
        }
        return item.name + ' 每票¥' + item.amount + ' 最低¥' + item.min + ' 费率' + item.rate + '%';
      })
      .join('<br>');
  }

  function formatUpstairsHtml(upstairs) {
    if (!upstairs || !upstairs.enabled) return '否';
    var lift = upstairs.lift || {};
    var noLift = upstairs.noLift || {};
    return [
      '免上楼' + toNum(upstairs.freeKg) + 'kg；1楼不上楼',
      '有电梯：基础¥' + toNum(lift.base) + ' + ' + toNum(lift.weight) + '×重量 + ' + toNum(lift.floor) + '×楼层',
      '无电梯：基础¥' + toNum(noLift.base) + ' + ' + toNum(noLift.weight) + '×重量 + ' + toNum(noLift.floor) + '×楼层'
    ].join('<br>');
  }

  function formatChannels(channels) {
    return (channels || []).join('、') || '—';
  }

  function formatDest(row) {
    if (!row) return '—';
    if (row.destProvince === '全国' || (!row.destCity && !row.destDistrict && row.destProvince === '全国')) {
      return '全国';
    }
    return [row.destProvince, row.destCity, row.destDistrict].filter(Boolean).join(' / ') || '—';
  }

  function parseRatio(ratio) {
    var parts = String(ratio || '1:3').split(':');
    var left = parseFloat(parts[0]);
    var right = parseFloat(parts[1]);
    return {
      left: left > 0 ? left : 1,
      right: right > 0 ? right : 1
    };
  }

  function toNum(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function firstWeightOf(tier) {
    var w = toNum(tier && (tier.first || tier.firstWeight));
    if (w > 0) return w;
    var start = toNum(tier && tier.start);
    return start === 0 ? 1 : start;
  }

  function roundKg(n) {
    return Math.round((Number(n) || 0) * 1000) / 1000;
  }

  function guessGrossFromSpec(product) {
    var text = String((product && (product.spec || product.title || product.name)) || '');
    var jin = text.match(/(\d+(?:\.\d+)?)\s*斤/);
    if (jin) return toNum(jin[1]) * 0.5;
    var kg = text.match(/(\d+(?:\.\d+)?)\s*k(?:g|ilo)/i);
    if (kg) return toNum(kg[1]);
    return 0;
  }

  function extraKeyOf(name) {
    if (name === '保价费') return 'insure';
    if (name === '派送费') return 'deliver';
    return '';
  }

  function findExtra(rate, name) {
    if (!rate || rate.extra !== '是') return null;
    var list = rate.extras || [];
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].name === name) return list[i];
    }
    return null;
  }

  function rateHasUpstairs(rate) {
    return !!(rate && rate.upstairs && rate.upstairs.enabled);
  }

  function calcInsureFee(extra, payable) {
    if (!extra) return 0;
    var min = toNum(extra.min);
    var fromRate = toNum(payable) * toNum(extra.rate) / 100;
    return roundMoney(Math.max(min, fromRate));
  }

  function calcDeliverFee(extra) {
    return extra ? roundMoney(toNum(extra.amount)) : 0;
  }

  function floorLayers(floor) {
    var n = parseInt(floor, 10);
    if (!isFinite(n) || n === 0) return 1;
    if (n >= 1) return n;
    return Math.abs(n) + 1;
  }

  function calcUpstairsFee(upstairs, weightKg, hasElevator, floor) {
    var empty = {
      amount: 0,
      free: true,
      reason: '未配置',
      weight: roundKg(weightKg),
      hasElevator: !!hasElevator,
      floor: floorLayers(floor),
      freeKg: 0
    };
    if (!upstairs || !upstairs.enabled) return empty;
    var layers = floorLayers(floor);
    var freeKg = toNum(upstairs.freeKg);
    var result = {
      amount: 0,
      free: false,
      reason: '',
      weight: roundKg(weightKg),
      hasElevator: !!hasElevator,
      floor: layers,
      freeKg: freeKg
    };
    if (layers <= 1) {
      result.free = true;
      result.reason = '1楼不上楼';
      return result;
    }
    if (toNum(weightKg) <= freeKg) {
      result.free = true;
      result.reason = '未超过免上楼重量';
      return result;
    }
    var cfg = hasElevator ? upstairs.lift : upstairs.noLift;
    cfg = cfg || {};
    result.amount = roundMoney(
      toNum(cfg.base) + toNum(cfg.weight) * toNum(weightKg) + toNum(cfg.floor) * layers
    );
    return result;
  }

  function roundMoney(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function formatMoney(n) {
    return '¥' + roundMoney(n).toFixed(2);
  }

  /** 温层 → 费率表物流类型：冷藏/冷冻走冷链 */
  function logisticsTypeFromTemp(tempLayer) {
    return tempLayer === '冷藏' || tempLayer === '冷冻' ? '冷链' : '常温';
  }

  /**
   * 计费重量：先算体积重 = 长×宽×高(cm³) / 5000。
   * 重抛比 1:3 表示体积重/毛重超过 3 才按抛货计，否则用毛重。
   */
  function chargeableKg(length, width, height, gross, ratioText) {
    var actual = toNum(gross);
    var vol = toNum(length) * toNum(width) * toNum(height);
    var volKg = vol > 0 ? vol / 5000 : 0;
    if (actual <= 0) return volKg;
    if (volKg <= 0) return actual;
    var ratio = parseRatio(ratioText);
    var threshold = ratio.right / ratio.left;
    return volKg / actual > threshold ? volKg : actual;
  }

  function rateLevel(rate) {
    if (!rate) return 0;
    if (rate.destProvince === '全国' || rate.destProvince === '') return LEVELS.nationwide;
    if (rate.destDistrict) return LEVELS.district;
    if (rate.destCity) return LEVELS.city;
    if (rate.destProvince) return LEVELS.province;
    return LEVELS.nationwide;
  }

  function levelLabel(level) {
    if (level === LEVELS.district) return '区';
    if (level === LEVELS.city) return '市';
    if (level === LEVELS.province) return '省';
    return '全国';
  }

  function destHitLabel(rate) {
    if (!rate) return '';
    if (rateLevel(rate) === LEVELS.nationwide) return '全国';
    return [rate.destProvince, rate.destCity, rate.destDistrict].filter(Boolean).join('');
  }

  function channelHit(rate, channel) {
    var list = rate && rate.channels;
    if (!list || !list.length) return true;
    return list.indexOf(channel) >= 0;
  }

  /**
   * 区 > 市 > 省 > 全国。
   * 市级配置要求区为空；省级要求市、区都为空；全国要求省为「全国」或空。
   */
  function matchScore(rate, dest) {
    dest = dest || {};
    var qProv = dest.province || '';
    var qCity = dest.city || '';
    var qDist = dest.district || '';
    var rProv = rate.destProvince || '';
    var rCity = rate.destCity || '';
    var rDist = rate.destDistrict || '';

    if (rProv === '全国' || !rProv) return LEVELS.nationwide;

    if (rDist) {
      return rProv === qProv && rCity === qCity && rDist === qDist ? LEVELS.district : 0;
    }
    if (rCity) {
      return rProv === qProv && rCity === qCity ? LEVELS.city : 0;
    }
    if (rProv) {
      return rProv === qProv ? LEVELS.province : 0;
    }
    return 0;
  }

  function findTier(tiers, value) {
    var list = tiers || [];
    var i;
    var last = null;
    for (i = 0; i < list.length; i++) {
      var start = toNum(list[i].start);
      var end = toNum(list[i].end);
      last = list[i];
      if (value >= start && value <= end) return list[i];
    }
    return last;
  }

  function explainWeightFee(rate, weightKg) {
    var empty = {
      scheme: '重量计费',
      weight: roundKg(weightKg),
      firstWeight: 0,
      firstPrice: 0,
      extraKg: 0,
      cont: 0,
      extraFee: 0,
      base: 0,
      discount: 1,
      amount: 0,
      tierStart: '',
      tierEnd: ''
    };
    var tier = findTier(rate && rate.tiers, weightKg);
    if (!tier) return empty;
    var firstW = firstWeightOf(tier);
    var firstPrice = toNum(tier.price);
    var cont = toNum(tier.cont);
    var extraKg = Math.max(0, toNum(weightKg) - firstW);
    var extraFee = extraKg * cont;
    var base = firstPrice + extraFee;
    var discount = toNum(rate.freightDiscount || 1);
    if (discount <= 0) discount = 1;
    return {
      scheme: '重量计费',
      weight: roundKg(weightKg),
      firstWeight: firstW,
      firstPrice: firstPrice,
      extraKg: roundKg(extraKg),
      cont: cont,
      extraFee: roundMoney(extraFee),
      base: roundMoney(base),
      discount: discount,
      amount: roundMoney(base * discount),
      tierStart: tier.start,
      tierEnd: tier.end
    };
  }

  function calcWeightFee(rate, weightKg) {
    return explainWeightFee(rate, weightKg).amount;
  }

  function explainAmountFee(rate, amount) {
    var tier = findTier(rate && rate.tiers, amount);
    var discount = toNum(rate && rate.freightDiscount || 1);
    if (discount <= 0) discount = 1;
    if (!tier) {
      return {
        scheme: '金额计费',
        goodsAmount: roundMoney(amount),
        price: 0,
        discount: discount,
        amount: 0,
        tierStart: '',
        tierEnd: ''
      };
    }
    var price = toNum(tier.price);
    return {
      scheme: '金额计费',
      goodsAmount: roundMoney(amount),
      price: price,
      discount: discount,
      amount: roundMoney(price * discount),
      tierStart: tier.start,
      tierEnd: tier.end
    };
  }

  function calcAmountFee(rate, amount) {
    return explainAmountFee(rate, amount).amount;
  }

  function destText(dest) {
    dest = dest || {};
    return [dest.province, dest.city, dest.district].filter(Boolean).join('') || '全国';
  }

  function parseRegionCascade(text) {
    var parts = String(text || '')
      .replace(/[／/]/g, '/')
      .split('/')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    return {
      province: parts[0] || '',
      city: parts[1] || '',
      district: parts[2] || ''
    };
  }

  function originHit(rate, originKey) {
    if (!originKey) return true;
    var a = String((rate && rate.origin) || '').replace(/\s+/g, '');
    var b = String(originKey || '').replace(/\s+/g, '');
    if (!a || !b) return true;
    return a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
  }

  function normalizeFulfill(mode) {
    if (!mode) return '';
    if (mode === 'pickup' || mode === '自提' || mode === '门店自提') return 'pickup';
    if (mode === 'platform' || mode === '配送' || mode === 'warehouse' || mode === 'delivery' || mode === '平台配送') {
      return 'platform';
    }
    if (mode === 'express' || mode === '快递' || mode === '快递到店' || mode === '快递配送' || mode === 'store' || mode === 'mail') {
      return 'express';
    }
    return '';
  }

  /** 是否向客户计费：先看包邮配置（渠道 × 履约），未配则仅代采配送计费 */
  function chargesFreight(channel, fulfill) {
    if (global.MdmOrderFreeShip && typeof global.MdmOrderFreeShip.isFreeShip === 'function') {
      return !global.MdmOrderFreeShip.isFreeShip(fulfill, channel);
    }
    if (channel !== CHANNEL_PROXY) return false;
    var f = normalizeFulfill(fulfill);
    return !f || f === 'platform';
  }

  function resolveSupplier(opts) {
    opts = opts || {};
    var product = opts.product || {};
    var id = opts.supplierId || product.supplierId || DEMO_SUPPLIER.id;
    if (global.MdmReceiveAddress && typeof global.MdmReceiveAddress.getDefault === 'function') {
      var addr = global.MdmReceiveAddress.getDefault('supplier', id);
      if (addr && addr.region) {
        var dest = parseRegionCascade(addr.region);
        return {
          id: id,
          label: (addr.receiverName || id) + ' · ' + destText(dest)
        };
      }
    }
    if (id && id !== DEMO_SUPPLIER.id) {
      return { id: id, label: id + ' · 江苏省南京市江宁区' };
    }
    return DEMO_SUPPLIER;
  }

  function storeFromPicker(id) {
    if (!global.MdmProxyStorePicker || typeof global.MdmProxyStorePicker.getStoreById !== 'function') {
      return null;
    }
    return global.MdmProxyStorePicker.getStoreById(id);
  }

  function profileStore(id) {
    var profile = STORE_PROFILES[id];
    if (profile) return profile;
    var picker = storeFromPicker(id);
    if (!picker) return null;
    var warehouse = WAREHOUSE_BY_REGION[picker.regionId] || 'W001 南京仓';
    var dest = { province: '', city: '', district: '' };
    if (picker.regionId === '320000') dest = { province: '江苏省', city: '', district: '' };
    else if (picker.regionId === '330000') dest = { province: '浙江省', city: '', district: '' };
    else if (picker.regionId === '310000') dest = { province: '上海市', city: '上海市', district: '' };
    else if (picker.regionId === '110000') dest = { province: '北京市', city: '北京市', district: '' };
    return { name: picker.name, warehouse: warehouse, dest: dest };
  }

  function resolveStores(opts) {
    opts = opts || {};
    var map = opts.saleStores || (opts.product && opts.product.saleStores) || {};
    var ids = Object.keys(map).filter(function (id) { return map[id]; });
    var list = [];
    var seen = {};
    ids.forEach(function (id) {
      var store = profileStore(id);
      if (!store) return;
      var key = store.warehouse + '|' + destText(store.dest);
      if (seen[key]) return;
      seen[key] = true;
      list.push(store);
    });
    /* 一门店只对应一个配送仓，费率展示只取一条仓→店线路 */
    if (list.length) return [list[0]];
    return DEMO_STORES.slice(0, 1);
  }

  var MALL_LIST_KEY = 'mdm_mall_product_list_v1';
  var PROXY_LIST_KEY = 'mdm_proxy_product_list_v1';
  var LIVE_SHIP_KEY = 'mdm_live_product_ship_v1';

  function productCodeOf(opts) {
    var product = (opts && opts.product) || {};
    return String(
      product.code || product.goodsId || product.sourceCode || product.sku || (opts && opts.code) || ''
    ).trim();
  }

  function readJsonStore(key) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function findListProduct(key, code) {
    if (!code) return null;
    var list = readJsonStore(key);
    if (!Array.isArray(list)) return null;
    var i;
    for (i = 0; i < list.length; i++) {
      var item = list[i];
      if (!item) continue;
      if (String(item.code || item.goodsId || item.sku || '') === code) return item;
    }
    return null;
  }

  function findLiveShip(code) {
    if (!code) return null;
    var map = readJsonStore(LIVE_SHIP_KEY);
    if (map && map[code]) return map[code];
    var Demo = global.MdmLiveDemo;
    if (!Demo || !Demo.productsBySession) return null;
    var found = null;
    Object.keys(Demo.productsBySession).forEach(function (sid) {
      (Demo.productsBySession[sid] || []).forEach(function (p) {
        var c = p && (p.sku || p.code || p.goodsId);
        if (String(c || '') === code) found = p;
      });
    });
    if (!found) return null;
    return {
      freeShip: found.freeShip !== false,
      deliveryMode: found.deliveryMode || 'express'
    };
  }

  function fulfillLabelOf(fulfill) {
    var f = normalizeFulfill(fulfill);
    if (f === 'pickup') return '自提';
    if (f === 'platform') return '配送';
    return '快递';
  }

  function parseListingFreeShip(raw, fulfill, channelKind) {
    if (raw === true || raw === 'yes' || raw === '是') return true;
    if (raw === false || raw === 'no' || raw === '否') return false;
    if (channelKind === 'proxy') return normalizeFulfill(fulfill) !== 'platform';
    return true;
  }

  function resolveShipConfig(opts) {
    opts = opts || {};
    var code = productCodeOf(opts);
    var saleChannels = (opts && opts.saleChannels) || [];
    var mall = findListProduct(MALL_LIST_KEY, code);
    var proxy = findListProduct(PROXY_LIST_KEY, code);
    var live = findLiveShip(code);
    var retailListings = [];
    if (mall) {
      var mallFulfill = normalizeFulfill(mall.deliveryMode || mall.fulfillmentMode) || 'express';
      retailListings.push({
        source: '商城',
        fulfill: mallFulfill,
        freeShip: parseListingFreeShip(mall.freeShip, mallFulfill, 'mall')
      });
    }
    if (live) {
      var liveFulfill = normalizeFulfill(live.deliveryMode || live.fulfillmentMode) || 'express';
      retailListings.push({
        source: '直播',
        fulfill: liveFulfill,
        freeShip: parseListingFreeShip(live.freeShip, liveFulfill, 'live')
      });
    } else if (!saleChannels.length || saleChannels.indexOf('live') >= 0) {
      retailListings.push({ source: '直播', fulfill: 'express', freeShip: true });
    }
    var retailCharge = retailListings.filter(function (x) { return !x.freeShip; });
    var proxyFulfill = 'platform';
    var proxyFree = false;
    var proxyListing = null;
    if (proxy) {
      proxyFulfill = normalizeFulfill(proxy.deliveryMode || proxy.fulfillmentMode) || 'platform';
      proxyFree = parseListingFreeShip(proxy.freeShip, proxyFulfill, 'proxy');
      proxyListing = { source: '代采', fulfill: proxyFulfill, freeShip: proxyFree };
    } else if (!saleChannels.length || saleChannels.indexOf('proxy') >= 0) {
      proxyListing = { source: '代采', fulfill: 'platform', freeShip: false };
    }
    return {
      code: code,
      retailListings: retailListings,
      retailFree: !retailCharge.length,
      retailFulfills: retailCharge.map(function (x) { return x.fulfill; }),
      proxyListing: proxyListing,
      proxyFree: !proxyListing || !!proxyListing.freeShip,
      proxyFulfills: proxyListing && !proxyListing.freeShip ? [proxyListing.fulfill] : []
    };
  }

  function allowChannel(opts, channel) {
    var mode = (opts && opts.channelMode) || 'both';
    var saleChannels = opts && opts.saleChannels;
    var code = productCodeOf(opts);
    var allowRetail = !saleChannels || !saleChannels.length || saleChannels.indexOf('live') >= 0
      || !!findListProduct(MALL_LIST_KEY, code);
    var allowProxy = !saleChannels || !saleChannels.length || saleChannels.indexOf('proxy') >= 0
      || !!findListProduct(PROXY_LIST_KEY, code);
    if (channel === CHANNEL_RETAIL) {
      return (mode === 'retail' || mode === 'both') && allowRetail;
    }
    return (mode === 'proxy' || mode === 'both') && allowProxy;
  }

  function allowFulfill(opts, fulfill) {
    var locked = normalizeFulfill(opts && opts.deliveryMode);
    return !locked || locked === fulfill;
  }

  function buildLanes(opts) {
    opts = opts || {};
    var stores = resolveStores(opts);
    var supplier = resolveSupplier(opts);
    var lanes = [];
    var seen = {};

    function pushLane(lane) {
      var key = [lane.channel, lane.originKey || lane.originLabel, destText(lane.dest)].join('|');
      if (seen[key]) return;
      seen[key] = true;
      lanes.push(lane);
    }

    if (allowChannel(opts, CHANNEL_RETAIL) && allowFulfill(opts, 'express')) {
      pushLane({
        channel: CHANNEL_RETAIL,
        fulfill: 'express',
        fulfillLabel: '快递',
        originKey: '',
        originLabel: supplier.label,
        dest: DEMO_USER_DEST,
        destLabel: '用户收货地址 · ' + destText(DEMO_USER_DEST)
      });
    }

    if (allowChannel(opts, CHANNEL_RETAIL) && allowFulfill(opts, 'pickup')) {
      stores.forEach(function (store) {
        pushLane({
          channel: CHANNEL_RETAIL,
          fulfill: 'pickup',
          fulfillLabel: '自提',
          originKey: store.warehouse,
          originLabel: store.warehouse,
          dest: store.dest,
          destLabel: store.name + ' · ' + destText(store.dest)
        });
      });
    }

    if (allowChannel(opts, CHANNEL_PROXY) && allowFulfill(opts, 'express')) {
      stores.forEach(function (store) {
        pushLane({
          channel: CHANNEL_PROXY,
          fulfill: 'express',
          fulfillLabel: '快递',
          originKey: '',
          originLabel: supplier.label,
          dest: store.dest,
          destLabel: store.name + ' · ' + destText(store.dest)
        });
      });
    }

    if (allowChannel(opts, CHANNEL_PROXY) && allowFulfill(opts, 'platform')) {
      stores.forEach(function (store) {
        pushLane({
          channel: CHANNEL_PROXY,
          fulfill: 'platform',
          fulfillLabel: '配送',
          originKey: store.warehouse,
          originLabel: store.warehouse,
          dest: store.dest,
          destLabel: store.name + ' · ' + destText(store.dest)
        });
      });
    }

    return lanes;
  }

  /**
   * 同路线同物流类型只启用一家。取目的地粒度最高的一条启用费率（区 > 市 > 省 > 全国）。
   * originKey 有值时还要卡始发仓。
   */
  function pickRatesByCarrier(channel, dest, logisticsType, originKey) {
    dest = dest || DEMO_DEST;
    var list = ensureLoaded();
    var best = null;
    var i;
    for (i = 0; i < list.length; i++) {
      var rate = list[i];
      if (rate.enabled === false) continue;
      if (!channelHit(rate, channel)) continue;
      if (logisticsType && rate.logisticsType && rate.logisticsType !== logisticsType) continue;
      if (!originHit(rate, originKey)) continue;
      var score = matchScore(rate, dest);
      if (!score) continue;
      if (!best || score > best.score) {
        best = { rate: rate, score: score, level: levelLabel(score) };
      }
    }
    return best ? [best] : [];
  }

  function pickRate(channel, dest, logisticsType) {
    var hits = pickRatesByCarrier(channel, dest, logisticsType);
    return hits.length ? hits[0] : null;
  }

  /**
   * 按 SKU 尺寸/重量 + 商品温层，计算某订单渠道命中运费。
   */
  function quoteSku(opts) {
    opts = opts || {};
    var channel = opts.channel;
    var dest = opts.dest || DEMO_DEST;
    var logisticsType = opts.logisticsType || logisticsTypeFromTemp(opts.tempLayer);
    if (!chargesFreight(channel, opts.fulfill || opts.fulfillmentMethod || opts.deliveryMode)) {
      return {
        ok: true,
        freeShip: true,
        text: '包邮',
        amount: 0,
        level: '',
        destLabel: '',
        channel: channel
      };
    }
    var hasDims = toNum(opts.length) > 0 && toNum(opts.width) > 0 && toNum(opts.height) > 0 && toNum(opts.gross) > 0;
    if (!hasDims) {
      return {
        ok: false,
        text: '待填写尺寸重量',
        amount: null,
        level: '',
        destLabel: '',
        channel: channel
      };
    }
    var hit = pickRate(channel, dest, logisticsType);
    if (!hit) {
      return {
        ok: false,
        text: '未命中费率',
        amount: null,
        level: '',
        destLabel: '',
        channel: channel
      };
    }
    var rate = hit.rate;
    var weight = chargeableKg(opts.length, opts.width, opts.height, opts.gross, rate.ratio);
    var amount = toNum(opts.price);
    var fee = rate.feeScheme === '金额计费' ? calcAmountFee(rate, amount) : calcWeightFee(rate, weight);
    return {
      ok: true,
      amount: fee,
      text: formatMoney(fee),
      level: hit.level,
      destLabel: destHitLabel(rate),
      channel: channel,
      rate: rate,
      weight: weight
    };
  }

  function quoteSkuByChannels(opts) {
    var saleChannels = opts && opts.saleChannels ? opts.saleChannels : [];
    var hasRetail = !saleChannels.length || saleChannels.indexOf('live') >= 0;
    var hasProxy = !saleChannels.length || saleChannels.indexOf('proxy') >= 0;
    return {
      retail: hasRetail ? quoteSku(Object.assign({}, opts, { channel: CHANNEL_RETAIL })) : null,
      proxy: hasProxy ? quoteSku(Object.assign({}, opts, { channel: CHANNEL_PROXY })) : null
    };
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inferTempLayerFromText(text) {
    var s = String(text || '');
    if (/冷冻/.test(s)) return '冷冻';
    if (/冷藏/.test(s)) return '冷藏';
    return '';
  }

  function lookupUaProduct(product) {
    var api = global.UAProductCatalog;
    var map = api && api.PRODUCT_CATALOG;
    if (!map) return null;
    var id = product && (product.id || product.spuId);
    if (!id) return null;
    if (map[id]) return map[id];
    var keys = Object.keys(map);
    var i;
    for (i = 0; i < keys.length; i++) {
      var item = map[keys[i]];
      if (item.spuId === id) return item;
      if ((item.specs || []).some(function (spec) { return spec.id === id; })) return item;
    }
    return null;
  }

  function lookupCatalogProduct(product) {
    var catalog = global.MdmProductCatalog;
    if (!catalog || typeof catalog.getByCode !== 'function') return null;
    var code = product && (product.code || product.goodsId || product.sourceCode);
    if (!code && product && global.UaProxySaleScope && typeof global.UaProxySaleScope.restockIdToSpu === 'function') {
      code = global.UaProxySaleScope.restockIdToSpu(product.id || product.spuId);
    }
    return code ? catalog.getByCode(code) : null;
  }

  function resolveTempLayer(product) {
    if (product && product.tempLayer) return product.tempLayer;
    var catalogItem = lookupCatalogProduct(product);
    if (catalogItem && catalogItem.tempLayer) return catalogItem.tempLayer;
    var guessed = inferTempLayerFromText(
      product && (product.title || product.name || product.id || product.spuId)
    );
    if (guessed) return guessed;
    var ua = lookupUaProduct(product);
    if (ua && ua.tempLayer) return ua.tempLayer;
    var params = (ua && ua.params) || [];
    var i;
    for (i = 0; i < params.length; i++) {
      if (params[i].label === '储存方式') {
        guessed = inferTempLayerFromText(params[i].value);
        if (guessed) return guessed;
      }
    }
    return '常温';
  }

  function lookupSpecDims(product) {
    var catalogItem = lookupCatalogProduct(product);
    var specs = catalogItem && catalogItem.specs;
    if (specs && specs.length) {
      return specs[0];
    }
    return product || {};
  }

  function normalizeQuoteItem(raw) {
    raw = raw || {};
    var qty = toNum(raw.qty) || 1;
    var price = toNum(raw.price != null ? raw.price : raw.priceNum);
    var tempLayer = resolveTempLayer(raw);
    var spec = lookupSpecDims(raw);
    return {
      id: raw.id || '',
      title: raw.title || raw.name || '',
      tempLayer: tempLayer,
      logisticsType: logisticsTypeFromTemp(tempLayer),
      fulfill: normalizeFulfill(raw.fulfillmentMethod || raw.deliveryMode || raw.fulfill || raw.fulfillType),
      freeShip: raw.freeShip === true ? true : raw.freeShip === false ? false : null,
      qty: qty,
      price: price,
      amount: roundMoney(price * qty),
      length: toNum(raw.length) || toNum(spec.length),
      width: toNum(raw.width) || toNum(spec.width),
      height: toNum(raw.height) || toNum(spec.height),
      gross: toNum(raw.gross) || toNum(spec.gross) || guessGrossFromSpec(raw)
    };
  }

  function emptyGroup(type, freeShip) {
    return {
      ok: true,
      empty: true,
      freeShip: !!freeShip,
      amount: 0,
      text: freeShip ? '免运费' : formatMoney(0),
      logisticsType: type,
      items: []
    };
  }

  function freeShipQuote(dest, items) {
    return {
      ambient: emptyGroup('常温', true),
      cold: emptyGroup('冷链', true),
      total: 0,
      baseTotal: 0,
      extras: [],
      serviceSummary: emptyServiceSummary(),
      serviceTotal: 0,
      text: '免运费',
      freeShip: true,
      dest: dest,
      destLabel: destText(dest),
      items: items || []
    };
  }

  function quoteGroup(opts) {
    opts = opts || {};
    var channel = opts.channel || CHANNEL_PROXY;
    var dest = opts.dest || DEMO_DEST;
    var type = opts.logisticsType || '常温';
    var items = (opts.items || []).map(function (item) {
      return item && item.logisticsType ? item : normalizeQuoteItem(item);
    }).filter(function (item) {
      return item.logisticsType === type;
    });
    if (!items.length) {
      return {
        ok: true,
        empty: true,
        amount: 0,
        text: formatMoney(0),
        logisticsType: type,
        items: []
      };
    }
    var hit = pickRate(channel, dest, type);
    if (!hit) {
      return {
        ok: false,
        empty: false,
        amount: 0,
        text: formatMoney(0),
        logisticsType: type,
        miss: '未命中费率',
        items: items
      };
    }
    var rate = hit.rate;
    var goodsAmount = items.reduce(function (sum, item) {
      return sum + item.amount;
    }, 0);
    var weight = items.reduce(function (sum, item) {
      return sum + chargeableKg(item.length, item.width, item.height, item.gross, rate.ratio) * item.qty;
    }, 0);
    var breakdown = rate.feeScheme === '金额计费'
      ? explainAmountFee(rate, goodsAmount)
      : explainWeightFee(rate, weight);
    var fee = breakdown.amount;
    return {
      ok: true,
      empty: false,
      amount: fee,
      baseAmount: fee,
      text: formatMoney(fee),
      logisticsType: type,
      feeScheme: rate.feeScheme,
      carrier: rate.carrier,
      level: hit.level,
      destLabel: destHitLabel(rate),
      goodsAmount: roundMoney(goodsAmount),
      weight: roundKg(weight),
      itemCount: items.reduce(function (sum, item) { return sum + item.qty; }, 0),
      items: items,
      rate: rate,
      breakdown: breakdown
    };
  }

  function emptyServiceSummary() {
    return {
      insure: { available: false, selected: false, amount: 0 },
      deliver: { available: false, selected: false, amount: 0 },
      upstairs: { available: false, selected: false, amount: 0, hasElevator: true, floor: 1, weight: 0 }
    };
  }

  function pickBestExtra(groups, name, payable) {
    var best = null;
    var bestAmt = -1;
    groups.forEach(function (group) {
      var extra = findExtra(group.rate, name);
      if (!extra) return;
      var amt = name === '保价费' ? calcInsureFee(extra, payable) : calcDeliverFee(extra);
      if (amt > bestAmt) {
        best = extra;
        bestAmt = amt;
      }
    });
    return best;
  }

  function pickUpstairsRate(groups, weightKg, hasElevator, floor) {
    var best = null;
    var bestAmt = -1;
    groups.forEach(function (group) {
      if (!rateHasUpstairs(group.rate)) return;
      var up = calcUpstairsFee(group.rate.upstairs, weightKg, hasElevator, floor);
      if (!best || up.amount > bestAmt) {
        best = { rate: group.rate, upstairs: up };
        bestAmt = up.amount;
      }
    });
    return best;
  }

  function applyOrderServices(ambient, cold, opts, payable) {
    var groups = [ambient, cold].filter(function (g) { return g && !g.empty && g.rate; });
    var totalWeight = roundKg((ambient.weight || 0) + (cold.weight || 0));
    var upOpts = opts.upstairs || {};
    var extras = [];
    var insure = pickBestExtra(groups, '保价费', payable);
    if (insure) {
      extras.push({
        key: 'insure',
        name: '保价费',
        amount: calcInsureFee(insure, payable),
        selected: true,
        hint: 'max(最低¥' + toNum(insure.min).toFixed(2) + '，货款×' + toNum(insure.rate) + '%)'
      });
    }
    var deliver = pickBestExtra(groups, '派送费', payable);
    if (deliver) {
      extras.push({
        key: 'deliver',
        name: '派送费',
        amount: calcDeliverFee(deliver),
        selected: true,
        hint: '每票¥' + toNum(deliver.amount).toFixed(2)
      });
    }
    var pickedUp = pickUpstairsRate(groups, totalWeight, upOpts.hasElevator !== false, upOpts.floor);
    if (pickedUp) {
      extras.push({
        key: 'upstairs',
        name: '上楼费',
        amount: pickedUp.upstairs.amount,
        selected: true,
        hint: (pickedUp.upstairs.hasElevator ? '有电梯' : '无电梯') +
          ' · ' + pickedUp.upstairs.floor + '层 · 计费' + pickedUp.upstairs.weight + 'kg' +
          (pickedUp.upstairs.reason ? '（' + pickedUp.upstairs.reason + '）' : ''),
        upstairs: pickedUp.upstairs
      });
    }
    var summary = emptyServiceSummary();
    summary.upstairs.hasElevator = upOpts.hasElevator !== false;
    summary.upstairs.floor = floorLayers(upOpts.floor);
    summary.upstairs.weight = totalWeight;
    extras.forEach(function (line) {
      var slot = summary[line.key];
      if (!slot) return;
      slot.available = true;
      slot.amount = line.amount;
      slot.selected = line.selected;
      if (line.key === 'upstairs' && line.upstairs) {
        slot.hasElevator = line.upstairs.hasElevator;
        slot.floor = line.upstairs.floor;
        slot.weight = line.upstairs.weight;
        slot.freeKg = line.upstairs.freeKg;
      }
    });
    var serviceTotal = extras.reduce(function (sum, line) {
      return sum + (line.selected ? line.amount : 0);
    }, 0);
    return {
      extras: extras,
      serviceSummary: summary,
      serviceTotal: roundMoney(serviceTotal)
    };
  }

  function quoteOrder(opts) {
    opts = opts || {};
    var channel = opts.channel || CHANNEL_PROXY;
    var dest = opts.dest || resolveExplainDest(opts) || DEMO_DEST;
    var lockedFulfill = normalizeFulfill(opts.fulfill || opts.fulfillmentMethod || opts.deliveryMode);
    if (!chargesFreight(channel, lockedFulfill || 'platform')) {
      return freeShipQuote(dest, (opts.items || []).map(normalizeQuoteItem));
    }
    var items = (opts.items || []).map(normalizeQuoteItem).filter(function (item) {
      if (item.freeShip === true) return false;
      return chargesFreight(channel, item.fulfill || lockedFulfill || 'platform');
    });
    if (!items.length) return freeShipQuote(dest, []);
    var ambient = quoteGroup({
      channel: channel,
      dest: dest,
      logisticsType: '常温',
      items: items
    });
    var cold = quoteGroup({
      channel: channel,
      dest: dest,
      logisticsType: '冷链',
      items: items
    });
    var payable = opts.payable != null
      ? toNum(opts.payable)
      : items.reduce(function (sum, item) { return sum + item.amount; }, 0);
    var applied = applyOrderServices(ambient, cold, opts, payable);
    var baseTotal = roundMoney((ambient.amount || 0) + (cold.amount || 0));
    var total = roundMoney(baseTotal + applied.serviceTotal);
    return {
      ambient: ambient,
      cold: cold,
      baseTotal: baseTotal,
      extras: applied.extras,
      serviceSummary: applied.serviceSummary,
      serviceTotal: applied.serviceTotal,
      payable: roundMoney(payable),
      total: total,
      text: total > 0 ? formatMoney(total) : '免运费',
      freeShip: total <= 0,
      dest: dest,
      destLabel: destText(dest),
      items: items
    };
  }

  function describePick(channel, pick) {
    var rate = pick.rate;
    return {
      ok: true,
      channel: channel,
      level: pick.level,
      destLabel: destHitLabel(rate),
      origin: rate.origin,
      carrier: rate.carrier,
      logisticsType: rate.logisticsType,
      days: rate.days,
      feeScheme: rate.feeScheme,
      feeHtml: formatFeeTiersHtml(rate.feeScheme, rate.tiers),
      ratio: rate.ratio,
      extra: rate.extra,
      extraHtml: formatExtraHtml(rate.extra, rate.extras),
      upstairsHtml: formatUpstairsHtml(rate.upstairs),
      freightDiscount: rate.freightDiscount,
      settleDiscount: rate.settleDiscount
    };
  }

  /** 只返回命中策略（同路线同温层一条），不算具体金额 */
  function describeHits(channel, dest, logisticsType, originKey) {
    dest = dest || DEMO_DEST;
    var picks = pickRatesByCarrier(channel, dest, logisticsType, originKey);
    if (!picks.length) {
      return [{ ok: false, channel: channel, text: '未命中费率' }];
    }
    return picks.map(function (pick) {
      return describePick(channel, pick);
    });
  }

  function describeHit(channel, dest, logisticsType, originKey) {
    return describeHits(channel, dest, logisticsType, originKey)[0];
  }

  function collectHits(opts) {
    opts = opts || {};
    var type = opts.logisticsType || logisticsTypeFromTemp(opts.tempLayer);
    var ship = resolveShipConfig(opts);
    var lanes = buildLanes(opts);
    var hits = [];
    var seenHit = {};
    lanes.forEach(function (lane) {
      if (lane.channel === CHANNEL_RETAIL) {
        if (ship.retailFree) return;
        if (ship.retailFulfills.length && ship.retailFulfills.indexOf(lane.fulfill) < 0) return;
      }
      if (lane.channel === CHANNEL_PROXY) {
        if (ship.proxyFree) return;
        if (ship.proxyFulfills.length && ship.proxyFulfills.indexOf(lane.fulfill) < 0) return;
      }
      var picks = pickRatesByCarrier(lane.channel, lane.dest, type, lane.originKey);
      picks.forEach(function (pick) {
        var hit = describePick(lane.channel, pick);
        hit.originLabel = lane.originLabel;
        hit.laneDestLabel = lane.destLabel;
        hit.fulfill = lane.fulfill;
        hit.fulfillLabel = lane.fulfillLabel;
        var key = [hit.channel, hit.originLabel, hit.laneDestLabel, hit.carrier, lane.fulfill].join('|');
        if (seenHit[key]) return;
        seenHit[key] = true;
        hits.push(hit);
      });
    });
    return hits;
  }

  function renderStrategyRow(hit, extra) {
    if (!hit || !hit.ok) {
      return (
        '<tr><td colspan="12" class="lf-freight-strategy__miss">' +
        escapeHtml(hit && hit.text ? hit.text : '未命中费率') +
        '</td></tr>'
      );
    }
    var typeCls = hit.logisticsType === '冷链' ? ' is-cold' : ' is-normal';
    var extraText = hit.extra === '是' && hit.extraHtml && hit.extraHtml !== '否'
      ? hit.extraHtml
      : '无';
    var upstairsText = hit.upstairsHtml && hit.upstairsHtml !== '否' ? hit.upstairsHtml : '无';
    var days = hit.days && hit.days !== '-' ? hit.days + ' 天' : '-';
    return (
      '<tr' + (extra ? ' class="lf-freight-strategy__extra" hidden' : '') + '>' +
      '<td class="lf-freight-strategy__path">' + escapeHtml(hit.originLabel || hit.origin || '-') + '</td>' +
      '<td class="lf-freight-strategy__path">' + escapeHtml(hit.laneDestLabel || hit.destLabel || '-') + '</td>' +
      '<td>' + escapeHtml(hit.carrier) + '</td>' +
      '<td><span class="lf-freight-strategy__type' + typeCls + '">' + escapeHtml(hit.logisticsType) + '</span></td>' +
      '<td><span class="lf-freight-strategy__level">命中' + escapeHtml(hit.level) + '</span> ' +
      escapeHtml(hit.destLabel) + '</td>' +
      '<td>' + escapeHtml(days) + '</td>' +
      '<td>' + escapeHtml(hit.feeScheme || '-') + '</td>' +
      '<td class="lf-freight-strategy__tiers">' + hit.feeHtml + '</td>' +
      '<td>' + escapeHtml(hit.ratio || '-') + '</td>' +
      '<td class="lf-freight-strategy__tiers">' + extraText + '</td>' +
      '<td class="lf-freight-strategy__tiers">' + upstairsText + '</td>' +
      '<td>' + escapeHtml(hit.freightDiscount || '-') + '</td>' +
      '</tr>'
    );
  }

  function renderStrategyTable(hits) {
    var head =
      '<tr>' +
      '<th>始发</th>' +
      '<th>目的</th>' +
      '<th>承运商</th>' +
      '<th>物流类型</th>' +
      '<th>命中范围</th>' +
      '<th>时效</th>' +
      '<th>费用方案</th>' +
      '<th>物流费用</th>' +
      '<th>重抛比</th>' +
      '<th>增值服务</th>' +
      '<th>上楼费</th>' +
      '<th>运费折扣</th>' +
      '</tr>';
    var rows = hits.map(function (hit) {
      return renderStrategyRow(hit, false);
    });
    return (
      '<div class="lf-freight-strategy__table-wrap">' +
      '<table class="lf-freight-strategy__table">' +
      '<thead>' + head + '</thead>' +
      '<tbody>' + rows.join('') + '</tbody>' +
      '</table></div>'
    );
  }

  function toggleStrategyGroup(btn) {
    if (!btn) return;
    var card = btn.closest('.lf-freight-strategy__group');
    if (!card) return;
    var extras = card.querySelectorAll('.lf-freight-strategy__extra');
    var expanded = card.classList.toggle('is-expanded');
    var i;
    for (i = 0; i < extras.length; i++) extras[i].hidden = !expanded;
    btn.textContent = expanded ? '收起' : ('展开其余 ' + extras.length + ' 条');
  }

  function renderStrategyGroup(channel, hits) {
    var okHits = (hits || []).filter(function (hit) { return hit && hit.ok; });
    var body = okHits.length
      ? renderStrategyTable(okHits)
      : '<p class="lf-freight-strategy__empty">当前路径未命中费率策略</p>';
    return (
      '<div class="lf-freight-strategy__group">' +
      '<div class="lf-freight-strategy__group-head">' +
      '<strong>' + escapeHtml(channel) + '</strong>' +
      '<em>' + (okHits.length ? '命中 ' + okHits.length + ' 条' : '未命中') + '</em>' +
      '</div>' +
      body +
      '</div>'
    );
  }

  function renderFreeShipGroup(title, text) {
    return (
      '<div class="lf-freight-strategy__group">' +
      '<div class="lf-freight-strategy__group-head">' +
      '<strong>' + escapeHtml(title) + '</strong>' +
      '<em>包邮</em>' +
      '</div>' +
      '<p class="lf-freight-strategy__empty">' + escapeHtml(text) + '</p>' +
      '</div>'
    );
  }

  function shipListingsText(listings, fallback) {
    if (!listings || !listings.length) return fallback;
    return listings.map(function (item) {
      return item.source + '（' + fulfillLabelOf(item.fulfill) + '）' + (item.freeShip ? '已包邮' : '不包邮，按费率计费');
    }).join('；');
  }

  function renderStrategyInner(opts) {
    var type = (opts && opts.logisticsType) || logisticsTypeFromTemp(opts && opts.tempLayer);
    var ship = resolveShipConfig(opts);
    var hits = collectHits(opts);
    var groups = [];
    if (allowChannel(opts, CHANNEL_RETAIL)) {
      if (ship.retailFree) {
        groups.push(renderFreeShipGroup(
          CHANNEL_RETAIL,
          shipListingsText(ship.retailListings, '商城 / 直播编辑商品已设为包邮，不收取运费')
        ));
      } else {
        groups.push(renderStrategyGroup(
          CHANNEL_RETAIL,
          hits.filter(function (hit) { return hit.channel === CHANNEL_RETAIL; })
        ));
      }
    }
    if (allowChannel(opts, CHANNEL_PROXY)) {
      if (ship.proxyFree) {
        groups.push(renderFreeShipGroup(
          CHANNEL_PROXY,
          shipListingsText(ship.proxyListing ? [ship.proxyListing] : [], '代采编辑商品已设为包邮，不收取运费')
        ));
      } else {
        groups.push(renderStrategyGroup(
          CHANNEL_PROXY,
          hits.filter(function (hit) { return hit.channel === CHANNEL_PROXY; })
        ));
      }
    }
    var tip =
      '物流费率按<strong>零售订单</strong>、<strong>代采订单</strong>命中展示。是否包邮以<strong>商城 / 直播 / 代采编辑商品</strong>里履约方式旁的「是否包邮」为准。未包邮时同路线同物流类型只启用一家承运商，一门店一条仓→店线路。当前匹配<strong>' +
      escapeHtml(type) +
      '</strong>，目的地优先级：<strong>区 &gt; 市 &gt; 省 &gt; 全国</strong>。';
    var body = groups.join('') || '<p class="lf-freight-strategy__empty">当前路径未命中费率策略</p>';
    return '<p class="lf-freight-strategy__tip">' + tip + '</p>' + body;
  }

  function renderStrategySection(opts) {
    opts = opts || {};
    var variant = opts.variant || 'selection';
    var inner = renderStrategyInner(opts);
    if (variant === 'proxy') {
      return (
        '<section class="product-proxy-form__section lf-freight-strategy">' +
        '<h3 class="product-proxy-form__section-title">物流费率</h3>' +
        '<div id="proxyFreightHost">' + inner + '</div>' +
        '</section>'
      );
    }
    if (variant === 'live') {
      return (
        '<div class="pts-rule-card lf-live-card lf-freight-strategy">' +
        '<div class="pts-rule-card__title">物流费率</div>' +
        '<div class="pts-rule-card__body">' + inner + '</div></div>'
      );
    }
    return (
      '<section class="product-add-section lf-freight-strategy" id="' +
      escapeHtml(opts.hostId || 'productFreightSection') +
      '">' +
      '<h3 class="product-add-section__title">物流费率</h3>' +
      inner +
      '</section>'
    );
  }

  var CITY_PROVINCE = {
    杭州市: '浙江省',
    嘉兴市: '浙江省',
    南京市: '江苏省',
    苏州市: '江苏省',
    上海市: '上海市',
    北京市: '北京市',
    天津市: '天津市',
    重庆市: '重庆市'
  };

  /* 一门店只对应一个配送仓：按门店地址省市区落到仓 */
  function warehouseByDest(dest) {
    dest = dest || {};
    var province = dest.province || '';
    var city = dest.city || '';
    if (province === '上海市' || city === '上海市') return { id: 'W003', name: 'W003 上海仓' };
    if (province === '江苏省' || city === '南京市' || city === '苏州市') {
      return { id: 'W001', name: 'W001 南京仓' };
    }
    if (province === '浙江省' || city === '杭州市') return { id: 'W002', name: 'W002 嘉兴仓' };
    return { id: 'W002', name: 'W002 嘉兴仓' };
  }

  function parseDestFromAddress(text) {
    var raw = String(text || '').trim();
    if (!raw) return null;
    if (raw.indexOf('/') >= 0) {
      var cascaded = parseRegionCascade(raw);
      if (cascaded.province || cascaded.city) {
        if (!cascaded.province && cascaded.city && CITY_PROVINCE[cascaded.city]) {
          cascaded.province = CITY_PROVINCE[cascaded.city];
        }
        return cascaded;
      }
    }
    var s = raw.replace(/\s+/g, '');
    var province = '';
    var city = '';
    var district = '';
    var rest = s;
    var mun = rest.match(/^(北京市|上海市|天津市|重庆市)/);
    if (mun) {
      province = mun[1];
      city = mun[1];
      rest = rest.slice(mun[1].length);
    } else {
      var pm = rest.match(/^(.+?(?:省|自治区))/);
      if (pm) {
        province = pm[1];
        rest = rest.slice(pm[1].length);
      }
      var cm = rest.match(/^(.+?(?:市|自治州|地区|盟))/);
      if (cm) {
        city = cm[1];
        rest = rest.slice(cm[1].length);
      }
    }
    var dm = rest.match(/^(.+?(?:区|县|市|旗))/);
    if (dm) district = dm[1];
    if (!province && city && CITY_PROVINCE[city]) province = CITY_PROVINCE[city];
    if (!province && !city && !district) return null;
    return { province: province, city: city, district: district };
  }

  function resolveExplainDest(opts) {
    opts = opts || {};
    if (opts.dest && (opts.dest.province || opts.dest.city || opts.dest.district)) {
      return opts.dest;
    }
    if (opts.regionCascade) {
      var cascaded = parseRegionCascade(opts.regionCascade);
      if (!cascaded.province && cascaded.city && CITY_PROVINCE[cascaded.city]) {
        cascaded.province = CITY_PROVINCE[cascaded.city];
      }
      if (cascaded.province || cascaded.city) return cascaded;
    }
    return parseDestFromAddress(opts.address) || DEMO_DEST;
  }

  function collectExplainHits(channel, dest) {
    return ['常温', '冷链'].map(function (type) {
      return {
        type: type,
        hits: pickRatesByCarrier(channel, dest, type, '').map(function (pick) {
          return describePick(channel, pick);
        })
      };
    });
  }

  function renderExplainTpl(hit) {
    var extra = hit.extra === '是' && hit.extraHtml && hit.extraHtml !== '否'
      ? hit.extraHtml
      : '无';
    return (
      '<div class="ua-freight-explain__tpl">' +
      '<div class="ua-freight-explain__tpl-head">' +
      '<strong>' + escapeHtml(hit.carrier) + '</strong>' +
      '<span>命中' + escapeHtml(hit.level) + ' · ' + escapeHtml(hit.destLabel) + '</span>' +
      '</div>' +
      '<p class="ua-freight-explain__tpl-meta">始发 ' + escapeHtml(hit.origin) +
      ' · ' + escapeHtml(hit.feeScheme) +
      (hit.days ? ' · 时效' + escapeHtml(hit.days) + '天' : '') +
      ' · 重抛比 ' + escapeHtml(hit.ratio || '—') +
      ' · 运费折扣 ' + escapeHtml(hit.freightDiscount || '1.00') +
      '</p>' +
      '<div class="ua-freight-explain__tpl-tiers">' + hit.feeHtml + '</div>' +
      '<p class="ua-freight-explain__tpl-extra">增值服务：' + extra + '</p>' +
      '<p class="ua-freight-explain__tpl-extra">上楼费：' +
      (hit.upstairsHtml && hit.upstairsHtml !== '否' ? hit.upstairsHtml : '无') +
      '</p>' +
      '</div>'
    );
  }

  function renderExplainHtml() {
    return (
      '<div class="ua-freight-explain">' +
      '<p class="ua-freight-explain__intro">进货运费按履约方式及货物计收。具体金额以确认订单运费明细为准。</p>' +

      '<div class="ua-freight-explain__section">' +
      '<h4 class="ua-freight-explain__title">1. 配送费与快递费</h4>' +
      '<p class="ua-freight-explain__p"><strong>平台配送</strong>收取配送费。<strong>快递</strong>免运费。</p>' +
      '<p class="ua-freight-explain__p">同一订单中，<strong>常温、冷链分别计费</strong>后计入配送费。</p>' +
      '</div>' +

      '<div class="ua-freight-explain__section">' +
      '<h4 class="ua-freight-explain__title">2. 配送费计收规则</h4>' +
      '<p class="ua-freight-explain__p">按计费重量计收：先收<strong>起步费</strong>，超出部分按续重计收。</p>' +
      '<p class="ua-freight-explain__p">计费重量取实际重量与体积折算重量中的较高值。</p>' +
      '<p class="ua-freight-explain__p">按货款金额计收时，依本单货款分档定额计收，不按重量计收。</p>' +
      '</div>' +

      '<div class="ua-freight-explain__section">' +
      '<h4 class="ua-freight-explain__title">3. 保价、派送与上楼</h4>' +
      '<p class="ua-freight-explain__p"><strong>保价费、派送费、上楼费</strong>计入配送费，下单后不予减免。</p>' +
      '<p class="ua-freight-explain__p"><strong>保价费</strong>按货款计收。<strong>派送费</strong>按单计收。</p>' +
      '<p class="ua-freight-explain__p"><strong>上楼费</strong>按有无电梯及送达楼层计收。送达 1 楼，或未超过免上楼标准的，不上楼费。请在收货地址处填写电梯及楼层，下次下单自动带出。</p>' +
      '</div>' +

      '<div class="ua-freight-explain__section">' +
      '<h4 class="ua-freight-explain__title">4. 本单金额查询</h4>' +
      '<p class="ua-freight-explain__p">购物车展示预估运费。确认订单点击「运费」，查看配送费、快递费明细。</p>' +
      '<p class="ua-freight-explain__p">总运费 = 配送费 + 快递费。</p>' +
      '</div>' +
      '</div>'
    );
  }

  global.TmsLogisticsRate = {
    CHANNEL_RETAIL: CHANNEL_RETAIL,
    CHANNEL_PROXY: CHANNEL_PROXY,
    DEMO_DEST: DEMO_DEST,
    DEMO_USER_DEST: DEMO_USER_DEST,
    buildLanes: buildLanes,
    getAll: getAll,
    load: load,
    formatFeeTiersHtml: formatFeeTiersHtml,
    formatExtraHtml: formatExtraHtml,
    formatUpstairsHtml: formatUpstairsHtml,
    formatChannels: formatChannels,
    formatDest: formatDest,
    logisticsTypeFromTemp: logisticsTypeFromTemp,
    resolveTempLayer: resolveTempLayer,
    chargeableKg: chargeableKg,
    pickRate: pickRate,
    pickRatesByCarrier: pickRatesByCarrier,
    describeHit: describeHit,
    describeHits: describeHits,
    quoteSku: quoteSku,
    quoteSkuByChannels: quoteSkuByChannels,
    quoteGroup: quoteGroup,
    quoteOrder: quoteOrder,
    renderStrategyInner: renderStrategyInner,
    renderStrategySection: renderStrategySection,
    toggleStrategyGroup: toggleStrategyGroup,
    parseDestFromAddress: parseDestFromAddress,
    warehouseByDest: warehouseByDest,
    renderExplainHtml: renderExplainHtml,
    normalizeFulfill: normalizeFulfill,
    chargesFreight: chargesFreight,
    resolveShipConfig: resolveShipConfig
  };
})(window);
