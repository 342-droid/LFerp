/**
 * SKU 库存：现货按配送仓；可售 / 预占按放单渠道。
 *
 * 现货：SKU × 配送仓。仓储按仓维护；商品现货 = Σ 各仓现货。仓店表只展示这一列。
 * 可售：SKU × 放单渠道。代采页=代采可售，商城页=商城可售，各自独立。
 *       直播页不配可售，只读数按现货算出，用来卡本场配额。没有中央可售账本。
 * 预占：SKU × 放单渠道。与可售同一维度。剩余可售 = 本渠道可售 − 本渠道预占。
 *       履约只决定何时释放，不把预占再记到仓或门店。
 */
(function (global) {
  var WAREHOUSES = [
    { id: 'wh-hz', name: '杭州配送仓', regionIds: ['330000'], stores: ['振宁十足', '萧山万达店', '西湖文三路店', '滨江网商路店'] },
    { id: 'wh-bj', name: '北京配送仓', regionIds: ['110000'], stores: ['朝阳大悦城店', '海淀中关村店'] },
    { id: 'wh-sh', name: '上海配送仓', regionIds: ['310000'], stores: ['浦东陆家嘴店', '静安南京西路店'] },
    { id: 'wh-nj', name: '南京配送仓', regionIds: ['320000'], stores: ['鼓楼湖南路店', '工业园金鸡湖店'] },
    { id: 'wh-gz', name: '广州配送仓', regionIds: ['440000'], stores: ['天河城店', '南山科技园店'] },
    { id: 'wh-cd', name: '成都配送仓', regionIds: ['510000', '420000'], stores: ['武侯祠店', '锦江春熙路店', '江汉路店', '洪山光谷店'] },
    { id: 'wh-north', name: '华北配送仓', regionIds: ['120000', '130000'], stores: ['和平路店', '河西陈塘庄店', '裕华万达店', '长安勒泰店'] }
  ];

  var CHANNELS = ['proxy', 'mall', 'live', 'retail'];
  var CHANNEL_LABEL = {
    proxy: '代采',
    mall: '商城',
    live: '直播',
    retail: '零售'
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseNum(value) {
    var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function warehouseById(id) {
    for (var i = 0; i < WAREHOUSES.length; i++) {
      if (WAREHOUSES[i].id === id) return WAREHOUSES[i];
    }
    return null;
  }

  function hashSeed(key) {
    var s = String(key || 'sku');
    var n = 0;
    var i;
    for (i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    return n;
  }

  function normalizeSellableMode(value) {
    if (value === 'fixed') return 'fixed';
    return 'spot';
  }

  function isFixedMode(sku) {
    return normalizeSellableMode(sku && sku.sellableMode) === 'fixed';
  }

  function normalizeChannel(value, opts) {
    opts = opts || {};
    if (value && CHANNEL_LABEL[value]) return value;
    if (opts.variant === 'live' || opts.channel === 'live') return 'live';
    if (opts.channel && CHANNEL_LABEL[opts.channel]) return opts.channel;
    return 'proxy';
  }

  function channelLabel(channel) {
    return CHANNEL_LABEL[channel] || '本渠道';
  }

  /** 兼容旧 { spot, presale } / 数字，页面只当一笔预占 */
  function qtyOf(value) {
    if (value && typeof value === 'object') {
      var base = value.qty != null ? value.qty : value.spot;
      return parseNum(base) + parseNum(value.presale);
    }
    return parseNum(value);
  }

  function demoRows(skuKey) {
    var h = hashSeed(skuKey);
    return WAREHOUSES.map(function (wh, idx) {
      return {
        warehouseId: wh.id,
        spot: Math.max(6, 48 - idx * 7 + (h % 18))
      };
    });
  }

  function demoChannelReserved(skuKey) {
    var h = hashSeed(skuKey);
    return {
      proxy: 8 + (h % 5),
      mall: 3 + (h % 3),
      live: 2 + (h % 2),
      retail: 5 + (h % 4)
    };
  }

  function storeReservedMap(row) {
    var src = row.reservedStores || {};
    var out = {};
    Object.keys(src).forEach(function (name) {
      var raw = src[name];
      var pickup = raw && typeof raw === 'object' ? qtyOf(raw.pickup) : qtyOf(raw);
      var proxyExpress = raw && typeof raw === 'object' ? qtyOf(raw.proxyExpress) : 0;
      out[name] = { pickup: pickup, proxyExpress: proxyExpress, qty: pickup + proxyExpress };
    });
    return out;
  }

  function migrateLocationReserved(sku) {
    var rows = sku && sku.warehouseStocks;
    if (!rows || !rows.length) return null;
    var proxyDelivery = 0;
    var proxyExpress = 0;
    var pickup = 0;
    var hasLoc = false;
    rows.forEach(function (row) {
      if (row.reservedProxyDelivery != null || row.reservedProxy != null || row.reservedStores) hasLoc = true;
      proxyDelivery += qtyOf(row.reservedProxyDelivery != null ? row.reservedProxyDelivery : row.reservedProxy);
      var map = storeReservedMap(row);
      Object.keys(map).forEach(function (name) {
        pickup += map[name].pickup;
        proxyExpress += map[name].proxyExpress;
      });
    });
    if (!hasLoc && sku.reservedDirectRetail == null && sku.reservedDirectMall == null && sku.reservedDirectLive == null && sku.reservedDirect == null) {
      return null;
    }
    var retail = qtyOf(sku && sku.reservedDirectRetail);
    var mall = qtyOf(sku && sku.reservedDirectMall);
    var live = 0;
    var list = sku && sku.reservedDirectLive;
    if (Array.isArray(list)) {
      list.forEach(function (item) {
        live += qtyOf(item);
      });
    } else {
      live = qtyOf(list);
    }
    if (!retail && !mall && !live && sku && sku.reservedDirect != null) {
      mall = qtyOf(sku.reservedDirect);
    }
    return {
      proxy: proxyDelivery + proxyExpress,
      mall: mall,
      live: live,
      retail: pickup + retail
    };
  }

  function ensureChannelReserved(sku) {
    if (sku && sku.reservedByChannel && typeof sku.reservedByChannel === 'object') {
      return sku.reservedByChannel;
    }
    var migrated = migrateLocationReserved(sku);
    var demo = demoChannelReserved((sku && (sku.id || sku.barcode || sku.specValue)) || 'sku');
    var map = migrated || demo;
    CHANNELS.forEach(function (ch) {
      if (map[ch] == null) map[ch] = demo[ch];
    });
    if (sku) sku.reservedByChannel = map;
    return map;
  }

  function channelReservedOf(sku, channel) {
    var map = ensureChannelReserved(sku);
    return qtyOf(map[channel] != null ? map[channel] : 0);
  }

  function sessionReservedOf(sku, sessionId) {
    if (!sessionId) return 0;
    var list = sku && sku.reservedDirectLive;
    if (!Array.isArray(list)) return qtyOf(sku && sku.reservedDirectLive);
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].sessionId === sessionId) return qtyOf(list[i]);
    }
    return 0;
  }

  function ensureLiveSessionDemo(sku, liveQty) {
    if (!sku) return;
    if (Array.isArray(sku.reservedDirectLive)) return;
    sku.reservedDirectLive = [{ sessionId: 'sess-ert', sessionName: 'ERT', qty: Math.min(2, liveQty || 0) }];
  }

  function channelSellableOf(sku, spotTotal) {
    if (isFixedMode(sku)) return Math.round(parseNum(sku.sellableFixed));
    var percent = parseNum(sku && sku.sellablePercent);
    if (!percent) percent = 100;
    return Math.round((spotTotal * percent) / 100);
  }

  function ensureRows(sku) {
    if (!sku) return demoRows('sku');
    if (!sku.warehouseStocks || sku.warehouseStocks.length !== WAREHOUSES.length) {
      sku.warehouseStocks = demoRows(sku.id || sku.barcode || sku.specValue);
    }
    return sku.warehouseStocks;
  }

  function summarize(sku, opts) {
    opts = opts || {};
    var channel = normalizeChannel(opts.channel, opts);
    var rows = ensureRows(sku);
    var reservedMap = ensureChannelReserved(sku);
    var reserved = channelReservedOf(sku, channel);
    if (channel === 'live') ensureLiveSessionDemo(sku, reserved);
    var sessionQty = sessionReservedOf(sku, opts.sessionId);
    var spotTotal = rows.reduce(function (sum, row) {
      return sum + (row.spot || 0);
    }, 0);
    var sellableTotal = channelSellableOf(sku, spotTotal);
    var remainTotal = Math.max(0, sellableTotal - reserved);
    var view = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      var wh = warehouseById(row.warehouseId) || { name: row.warehouseId, stores: [] };
      var storeNames = wh.stores || [];
      view.push({
        kind: 'warehouse',
        warehouseId: row.warehouseId,
        name: wh.name,
        storeName: '',
        stores: storeNames.slice(),
        spot: row.spot || 0,
        reserved: '',
        sellable: '',
        remain: ''
      });
      storeNames.forEach(function (storeName) {
        view.push({
          kind: 'store',
          warehouseId: row.warehouseId,
          name: wh.name,
          storeName: storeName,
          stores: [storeName],
          spot: '',
          reserved: '',
          sellable: '',
          remain: ''
        });
      });
    }
    return {
      channel: channel,
      channelLabel: channelLabel(channel),
      rows: view,
      spotTotal: spotTotal,
      reservedTotal: reserved,
      reservedByChannel: {
        proxy: qtyOf(reservedMap.proxy),
        mall: qtyOf(reservedMap.mall),
        live: qtyOf(reservedMap.live),
        retail: qtyOf(reservedMap.retail)
      },
      sellableTotal: sellableTotal,
      remainTotal: remainTotal,
      sessionReservedTotal: sessionQty
    };
  }

  function attachToSku(sku, opts) {
    if (!sku) return null;
    sku.sellableMode = normalizeSellableMode(sku.sellableMode);
    if (sku.sellablePercent == null || sku.sellablePercent === '') sku.sellablePercent = '100';
    if (sku.sellableFixed == null) sku.sellableFixed = '';
    var sum = summarize(sku, opts);
    sku.spotStock = String(sum.spotTotal);
    sku.reservedStock = String(sum.reservedTotal);
    sku.sellableStock = String(sum.sellableTotal);
    sku.remainStock = String(sum.remainTotal);
    return sum;
  }

  function warehouseRowsOf(sum) {
    return (sum.rows || []).filter(function (row) {
      return row.kind !== 'store';
    });
  }

  function renderTable(sum) {
    var body = (sum.rows || [])
      .map(function (row) {
        var isStore = row.kind === 'store';
        return (
          '<tr class="' +
          (isStore ? 'product-proxy-wh-stock__store-row' : '') +
          '">' +
          '<td>' +
          (isStore ? '' : escapeHtml(row.name)) +
          '</td>' +
          '<td class="' +
          (isStore ? 'product-proxy-wh-stock__store-name' : '') +
          '">' +
          escapeHtml(isStore ? row.storeName : '仓') +
          '</td>' +
          '<td class="product-proxy-wh-stock__num">' +
          (isStore ? '—' : row.spot) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="product-proxy-wh-stock">' +
      '<thead>' +
      '<tr>' +
      '<th>配送仓</th><th>门店</th>' +
      '<th>现货</th>' +
      '</tr>' +
      '</thead><tbody>' +
      body +
      '</tbody><tfoot><tr>' +
      '<th>合计</th><th></th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.spotTotal +
      '</th>' +
      '</tr></tfoot></table>'
    );
  }

  function applyStoreScope(sum, storeNames) {
    var names = (storeNames || []).filter(Boolean);
    if (!sum) {
      return {
        rows: [],
        channel: 'proxy',
        channelLabel: '代采',
        spotTotal: 0,
        reservedTotal: 0,
        sellableTotal: 0,
        remainTotal: 0,
        sessionReservedTotal: 0,
        reservedByChannel: { proxy: 0, mall: 0, live: 0, retail: 0 }
      };
    }
    if (!names.length) return sum;
    var keepWh = {};
    (sum.rows || []).forEach(function (row) {
      if (row.kind === 'store' && names.indexOf(row.storeName) >= 0) keepWh[row.warehouseId] = true;
    });
    var rows = (sum.rows || [])
      .map(function (row) {
        if (!keepWh[row.warehouseId]) return null;
        if (row.kind === 'store') {
          return names.indexOf(row.storeName) >= 0 ? row : null;
        }
        var stores = (row.stores || []).filter(function (name) {
          return names.indexOf(name) >= 0;
        });
        return Object.assign({}, row, { stores: stores });
      })
      .filter(Boolean);
    var whRows = rows.filter(function (row) {
      return row.kind !== 'store';
    });
    return {
      channel: sum.channel,
      channelLabel: sum.channelLabel,
      rows: rows,
      spotTotal: whRows.reduce(function (n, r) { return n + (r.spot || 0); }, 0),
      reservedTotal: sum.reservedTotal || 0,
      reservedByChannel: sum.reservedByChannel,
      sellableTotal: sum.sellableTotal || 0,
      remainTotal: sum.remainTotal || 0,
      sessionReservedTotal: sum.sessionReservedTotal || 0
    };
  }

  function summaryText(sum) {
    var n = warehouseRowsOf(sum).length;
    return (
      '现货 ' +
      ((sum && sum.spotTotal) || 0) +
      ' · ' +
      n +
      ' 个仓'
    );
  }

  function renderPanel(sku, opts) {
    opts = opts || {};
    var channel = normalizeChannel(opts.channel, opts);
    var sum = applyStoreScope(attachToSku(sku, opts), opts.storeNames);
    var scoped = opts.storeNames && opts.storeNames.length;
    var chName = channelLabel(channel);
    var tip =
      '仓行只展示<strong>现货</strong>（仓储按仓维护）。' +
      '<strong>可售库存</strong>和<strong>预占库存</strong>都在<strong>放单渠道</strong>：本页看' +
      chName +
      '渠道该 SKU，不摊到仓、不与其它渠道加总。' +
      '<strong>剩余可售</strong> = 本渠道可售 − 本渠道预占。' +
      (opts.variant === 'live'
        ? '直播不单独配可售，可售按现货合计算出（默认 100%），用来卡本场配额。本场配额不超过剩余可售（含本场已占）。'
        : '') +
      (scoped ? '下表已按售卖范围门店过滤。' : '');
    return (
      '<div class="product-proxy-spec__field product-proxy-spec__field--wh-stock is-collapsed">' +
      '<button type="button" class="product-proxy-wh-stock__toggle" data-wh-stock-toggle aria-expanded="false">' +
      '<span class="product-proxy-wh-stock__toggle-title">仓店现货</span>' +
      '<span class="product-proxy-wh-stock__toggle-sum" data-wh-stock-sum>' +
      escapeHtml(summaryText(sum)) +
      '</span>' +
      '<span class="product-proxy-wh-stock__toggle-act" data-wh-stock-toggle-label>展开</span>' +
      '</button>' +
      '<div class="product-proxy-wh-stock__body" data-wh-stock-body hidden>' +
      '<div class="mdm-biz-tip mdm-biz-tip--flush" role="note">' +
      tip +
      '</div>' +
      '<div data-wh-stock>' +
      renderTable(sum) +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  if (typeof document !== 'undefined' && !document._whStockToggleBound) {
    document._whStockToggleBound = true;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wh-stock-toggle]');
      if (!btn) return;
      var wrap = btn.closest('.product-proxy-spec__field--wh-stock');
      if (!wrap) return;
      var open = wrap.classList.contains('is-collapsed');
      wrap.classList.toggle('is-collapsed', !open);
      wrap.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = btn.querySelector('[data-wh-stock-toggle-label]');
      if (label) label.textContent = open ? '收起' : '展开';
      var body = wrap.querySelector('[data-wh-stock-body]');
      if (body) body.hidden = !open;
    });
  }

  function reservedChannelTotals(sum) {
    var map = (sum && sum.reservedByChannel) || {};
    var parts = [];
    CHANNELS.forEach(function (ch) {
      if (map[ch]) parts.push(CHANNEL_LABEL[ch] + ' ' + map[ch]);
    });
    return {
      reserved: (sum && sum.reservedTotal) || 0,
      channel: sum && sum.channel,
      byChannel: map,
      text: parts.length ? parts.join(' + ') : '无预占'
    };
  }

  global.MdmSkuWhStock = {
    WAREHOUSES: WAREHOUSES,
    CHANNELS: CHANNELS,
    CHANNEL_LABEL: CHANNEL_LABEL,
    demoRows: demoRows,
    summarize: summarize,
    attachToSku: attachToSku,
    applyStoreScope: applyStoreScope,
    renderTable: renderTable,
    renderPanel: renderPanel,
    summaryText: summaryText,
    reservedChannelTotals: reservedChannelTotals,
    normalizeSellableMode: normalizeSellableMode,
    normalizeChannel: normalizeChannel,
    channelLabel: channelLabel,
    parseNum: parseNum
  };
})(window);
