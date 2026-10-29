/**
 * SKU 库存。
 *
 * 快递：只配置本渠道可售件数，显示剩余可售。不取仓库现货，不按现货比例。
 * 自提 / 配送：按售卖范围涉及的仓库分别配置。现货由仓库给出。
 * 按现货比例时，可售上限 = 配额基数 × 比例。基数只随应分配的入库增加。
 * 已分配 = 预占 + 已售未出库 + 已履约。核销、损耗、领用不减基数。
 * 剩余可售 = min(上限 − 已分配, 当前现货)，最小为 0。下单和付款不减现货。
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

  function usesWarehouse(mode) {
    return mode === 'pickup' || mode === 'platform' || mode === '自提' || mode === '配送' || mode === '平台配送';
  }

  function sameProvince(a, b) {
    var x = String(a || '');
    var y = String(b || '');
    return x.length >= 2 && y.length >= 2 && x.slice(0, 2) === y.slice(0, 2);
  }

  function scopeWarehouses(opts) {
    opts = opts || {};
    var scope = opts.saleScope || 'all';
    var names = (opts.storeNames || []).filter(Boolean);
    var ids = opts.regionIds || [];
    if (scope === 'store') {
      if (!names.length) return { list: [], emptyReason: 'store' };
      var hit = {};
      WAREHOUSES.forEach(function (wh) {
        if ((wh.stores || []).some(function (name) { return names.indexOf(name) >= 0; })) hit[wh.id] = wh;
      });
      (opts.stores || []).forEach(function (store) {
        if (!store || names.indexOf(store.name) < 0) return;
        var listed = WAREHOUSES.some(function (wh) { return (wh.stores || []).indexOf(store.name) >= 0; });
        if (listed) return;
        WAREHOUSES.forEach(function (wh) {
          if ((wh.regionIds || []).some(function (rid) { return sameProvince(rid, store.regionId); })) hit[wh.id] = wh;
        });
      });
      var picked = WAREHOUSES.filter(function (wh) { return hit[wh.id]; });
      return { list: picked, emptyReason: picked.length ? '' : 'unmapped' };
    }
    if (scope === 'region') {
      if (!ids.length) return { list: [], emptyReason: 'region' };
      var regions = WAREHOUSES.filter(function (wh) {
        return (wh.regionIds || []).some(function (rid) {
          return ids.some(function (id) { return sameProvince(rid, id); });
        });
      });
      return { list: regions, emptyReason: regions.length ? '' : 'unmapped' };
    }
    return { list: WAREHOUSES.slice(), emptyReason: '' };
  }

  function ensureRowLedger(sku, row, idx) {
    var h = hashSeed((sku && (sku.id || sku.barcode || sku.specValue)) || 'sku');
    if (row.sold == null) row.sold = (h + idx * 5) % 6;
    if (row.reserved == null) row.reserved = (h + idx * 3) % 4;
    if (row.fulfilled == null) row.fulfilled = (h + idx * 7) % 5;
    if (row.loss == null) row.loss = (h + idx * 2) % 4;
    if (row.quotaBase == null) {
      row.quotaBase = Math.round(parseNum(row.spot)) + Math.round(parseNum(row.fulfilled)) + Math.round(parseNum(row.loss));
    }
    if (!row.sellableMode) row.sellableMode = normalizeSellableMode(sku && sku.sellableMode);
    if (row.sellablePercent == null || row.sellablePercent === '') {
      row.sellablePercent = sku && sku.sellablePercent != null && sku.sellablePercent !== '' ? sku.sellablePercent : '100';
    }
    if (row.sellableFixed == null) row.sellableFixed = '';
    return row;
  }

  function quoteRow(row) {
    var spot = Math.round(parseNum(row.spot));
    var sold = Math.round(parseNum(row.sold));
    var reserved = Math.round(parseNum(row.reserved));
    var fulfilled = Math.round(parseNum(row.fulfilled));
    var quotaBase = Math.round(parseNum(row.quotaBase));
    var allocated = reserved + sold + fulfilled;
    var mode = normalizeSellableMode(row.sellableMode);
    var cap;
    if (mode === 'fixed') {
      cap = Math.round(parseNum(row.sellableFixed));
    } else {
      var pctText = String(row.sellablePercent == null ? '' : row.sellablePercent).trim();
      var pct = pctText === '' ? 100 : parseNum(pctText);
      cap = Math.round((quotaBase * pct) / 100);
    }
    var remain = Math.max(0, cap - allocated);
    if (remain > spot) remain = spot;
    return {
      spot: spot,
      sold: sold,
      reserved: reserved,
      fulfilled: fulfilled,
      quotaBase: quotaBase,
      allocated: allocated,
      cap: cap,
      remain: remain,
      mode: mode
    };
  }

  function warehouseQuote(sku, opts) {
    var rows = ensureRows(sku);
    var scoped = scopeWarehouses(opts);
    var lines = [];
    scoped.list.forEach(function (wh) {
      var row = null;
      var idx = 0;
      var i;
      for (i = 0; i < rows.length; i++) {
        if (rows[i].warehouseId === wh.id) {
          row = rows[i];
          idx = i;
          break;
        }
      }
      if (!row) return;
      ensureRowLedger(sku, row, idx);
      var quote = quoteRow(row);
      lines.push({
        warehouseId: wh.id,
        name: wh.name,
        spot: quote.spot,
        sold: quote.sold,
        reserved: quote.reserved,
        fulfilled: quote.fulfilled,
        quotaBase: quote.quotaBase,
        allocated: quote.allocated,
        cap: quote.cap,
        remain: quote.remain,
        sellableMode: quote.mode,
        sellablePercent: row.sellablePercent,
        sellableFixed: row.sellableFixed == null ? '' : row.sellableFixed
      });
    });
    var totals = lines.reduce(function (acc, line) {
      acc.spot += line.spot;
      acc.sold += line.sold;
      acc.reserved += line.reserved;
      acc.fulfilled += line.fulfilled;
      acc.allocated += line.allocated;
      acc.cap += line.cap;
      acc.remain += line.remain;
      return acc;
    }, { spot: 0, sold: 0, reserved: 0, fulfilled: 0, allocated: 0, cap: 0, remain: 0 });
    return { lines: lines, totals: totals, emptyReason: scoped.emptyReason };
  }

  function expressQuote(sku, opts) {
    opts = opts || {};
    var channel = normalizeChannel(opts.channel, opts);
    var reserved = channelReservedOf(sku, channel);
    if ((sku.sellableFixed == null || sku.sellableFixed === '') && !sku.expressSellableInited) {
      sku.sellableFixed = String(Math.max(parseNum(sku.liveStock) + reserved, 30));
    }
    sku.expressSellableInited = true;
    var cap = Math.round(parseNum(sku.sellableFixed));
    var remain = Math.max(0, cap - reserved);
    return { cap: cap, remain: remain, reserved: reserved, channel: channel };
  }

  function applyQuoteToSku(sku, opts) {
    opts = opts || {};
    if (!usesWarehouse(opts.deliveryMode)) {
      var express = expressQuote(sku, opts);
      sku.sellableStock = String(express.cap);
      sku.remainStock = String(express.remain);
      sku.reservedStock = String(express.reserved);
      sku.spotStock = '';
      return {
        model: 'express',
        express: express,
        sellableTotal: express.cap,
        remainTotal: express.remain,
        reservedTotal: express.reserved,
        spotTotal: 0,
        sessionReservedTotal: sessionReservedOf(sku, opts.sessionId)
      };
    }
    var pack = warehouseQuote(sku, opts);
    sku.sellableStock = String(pack.totals.cap);
    sku.remainStock = String(pack.totals.remain);
    sku.reservedStock = String(pack.totals.allocated || 0);
    sku.spotStock = String(pack.totals.spot);
    return {
      model: 'warehouse',
      lines: pack.lines,
      totals: pack.totals,
      emptyReason: pack.emptyReason,
      sellableTotal: pack.totals.cap,
      remainTotal: pack.totals.remain,
      reservedTotal: pack.totals.reserved,
      spotTotal: pack.totals.spot,
      sessionReservedTotal: sessionReservedOf(sku, opts.sessionId)
    };
  }

  function readWarehouseFields(root, sku) {
    if (!root || !sku) return;
    var rows = ensureRows(sku);
    root.querySelectorAll('[data-wh-field]').forEach(function (input) {
      var id = input.getAttribute('data-wh-id');
      var field = input.getAttribute('data-wh-field');
      if (!id || !field) return;
      var i;
      for (i = 0; i < rows.length; i++) {
        if (rows[i].warehouseId === id) {
          rows[i][field] = input.value;
          break;
        }
      }
    });
  }

  function paintWarehouseQuote(root, sku, opts) {
    if (!root || !sku) return null;
    var pack = warehouseQuote(sku, opts);
    pack.lines.forEach(function (line) {
      var capEl = root.querySelector('[data-wh-cap="' + line.warehouseId + '"]');
      var remainEl = root.querySelector('[data-wh-remain="' + line.warehouseId + '"]');
      if (capEl) capEl.textContent = String(line.cap);
      if (remainEl) remainEl.textContent = String(line.remain);
    });
    var totalSpot = root.querySelector('[data-wh-spot-total]');
    var totalCap = root.querySelector('[data-wh-cap-total]');
    var totalRemain = root.querySelector('[data-wh-remain-total]');
    if (totalSpot) totalSpot.textContent = String(pack.totals.spot);
    if (totalCap) totalCap.textContent = String(pack.totals.cap);
    if (totalRemain) totalRemain.textContent = String(pack.totals.remain);
    sku.sellableStock = String(pack.totals.cap);
    sku.remainStock = String(pack.totals.remain);
    sku.spotStock = String(pack.totals.spot);
    return pack;
  }

  function emptyScopeText(reason) {
    if (reason === 'store') return '请先选择售卖门店。选定后，每个涉及的仓库单独配置可售库存、现货库存、剩余可售。';
    if (reason === 'region') return '请先选择售卖区域。选定后，每个涉及的仓库单独配置可售库存、现货库存、剩余可售。';
    return '所选范围没有对应的配送仓，无法按仓库配置库存。';
  }

  function renderSellCell(line) {
    var mode = line.sellableMode === 'fixed' ? 'fixed' : 'spot';
    var id = escapeHtml(line.warehouseId);
    var select =
      '<select class="product-proxy-spec__input" data-wh-id="' + id + '" data-wh-field="sellableMode" aria-label="' + escapeHtml(line.name) + '可售库存配置方式">' +
      '<option value="spot"' + (mode === 'spot' ? ' selected' : '') + '>按现货比例</option>' +
      '<option value="fixed"' + (mode === 'fixed' ? ' selected' : '') + '>按具体数量</option>' +
      '</select>';
    var extra = mode === 'fixed'
      ? '<input type="text" class="product-proxy-spec__input product-wh-config__qty" data-wh-id="' + id + '" data-wh-field="sellableFixed" inputmode="decimal" value="' + escapeHtml(line.sellableFixed) + '" placeholder="件数" aria-label="可售件数">'
      : '<span class="product-wh-config__pct"><input type="text" class="product-proxy-spec__input" data-wh-id="' + id + '" data-wh-field="sellablePercent" inputmode="decimal" value="' + escapeHtml(line.sellablePercent) + '" aria-label="现货比例"><span>%</span></span>';
    return (
      '<div class="product-wh-config__sell">' +
      select +
      extra +
      '<span class="product-wh-config__cap">上限 <strong data-wh-cap="' + id + '">' + line.cap + '</strong></span>' +
      '</div>'
    );
  }

  function renderWarehouseEditor(sum) {
    if (!sum.lines || !sum.lines.length) {
      return (
        '<div class="product-proxy-spec__field product-proxy-spec__field--wh-stock" data-stock-editor="warehouse">' +
        '<div class="mdm-biz-tip mdm-biz-tip--flush" role="note">' + emptyScopeText(sum.emptyReason) + '</div>' +
        '</div>'
      );
    }
    var body = sum.lines.map(function (line) {
      return (
        '<tr>' +
        '<td>' + escapeHtml(line.name) + '</td>' +
        '<td class="product-wh-config__num">' + line.spot + '</td>' +
        '<td>' + renderSellCell(line) + '</td>' +
        '<td class="product-wh-config__num"><strong data-wh-remain="' + escapeHtml(line.warehouseId) + '">' + line.remain + '</strong>' +
        '<div class="product-wh-config__sub">基数 ' + line.quotaBase + ' · 预占 ' + line.reserved + ' · 已售 ' + line.sold + ' · 已履约 ' + line.fulfilled + '</div></td>' +
        '</tr>'
      );
    }).join('');
    var totals = sum.totals || { spot: 0, cap: 0, remain: 0 };
    return (
      '<div class="product-proxy-spec__field product-proxy-spec__field--wh-stock" data-stock-editor="warehouse">' +
      '<div class="mdm-biz-tip mdm-biz-tip--flush" role="note">自提、配送按仓库分别配置。<strong>按现货比例</strong>时，可售上限 = 配额基数 × 比例。基数只随入库增加。下单记预占，付款转为已售，核销转为已履约，三笔都占已分配；核销、损耗、领用不减基数。剩余可售 = min(上限 − 已分配, 当前现货)。</div>' +
      '<div class="product-wh-config-scroll">' +
      '<table class="product-wh-config">' +
      '<thead><tr><th>仓库</th><th>现货库存</th><th>可售库存</th><th>剩余可售</th></tr></thead>' +
      '<tbody>' + body + '</tbody>' +
      '<tfoot><tr>' +
      '<th>合计</th>' +
      '<th class="product-wh-config__num" data-wh-spot-total>' + totals.spot + '</th>' +
      '<th class="product-wh-config__num" data-wh-cap-total>' + totals.cap + '</th>' +
      '<th class="product-wh-config__num" data-wh-remain-total>' + totals.remain + '</th>' +
      '</tr></tfoot></table></div></div>'
    );
  }

  function renderExpressEditor(sku, sum) {
    var express = sum.express || { cap: 0, remain: 0, reserved: 0 };
    return (
      '<div class="product-proxy-spec__field" data-stock-editor="express">' +
      '<label class="product-proxy-spec__label">可售库存</label>' +
      '<input type="text" class="product-proxy-spec__input" data-field="sellableFixed" inputmode="decimal" value="' +
      escapeHtml(sku.sellableFixed == null ? '' : sku.sellableFixed) +
      '" placeholder="本渠道可售件数" aria-label="可售库存">' +
      '<p class="product-proxy-spec__stock-tip">快递只配置可售件数，不取仓库现货。</p>' +
      '</div>' +
      '<div class="product-proxy-spec__field">' +
      '<label class="product-proxy-spec__label">剩余可售</label>' +
      '<input type="text" class="product-proxy-spec__input" data-remain-result value="' +
      escapeHtml(String(express.remain)) +
      '" readonly tabindex="-1" aria-label="剩余可售">' +
      '<p class="product-proxy-spec__stock-tip">剩余可售 = 可售库存 − 本渠道预占（当前预占 ' + express.reserved + '）。</p>' +
      '</div>'
    );
  }

  function renderStockEditor(sku, opts) {
    var sum = applyQuoteToSku(sku, opts || {});
    if (sum.model === 'warehouse') return renderWarehouseEditor(sum);
    return renderExpressEditor(sku, sum);
  }

  function attachToSku(sku, opts) {
    if (!sku) return null;
    if (opts && opts.deliveryMode) return applyQuoteToSku(sku, opts);
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
    /* 按具体数量配置可售时不展示仓店现货；按现货库存才需要对照仓行 */
    if (isFixedMode(sku)) return '';
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
        ? '本场配额不超过剩余可售（含本场已占）。'
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
    renderStockEditor: renderStockEditor,
    readWarehouseFields: readWarehouseFields,
    paintWarehouseQuote: paintWarehouseQuote,
    syncStock: applyQuoteToSku,
    usesWarehouse: usesWarehouse,
    summaryText: summaryText,
    reservedChannelTotals: reservedChannelTotals,
    normalizeSellableMode: normalizeSellableMode,
    normalizeChannel: normalizeChannel,
    channelLabel: channelLabel,
    parseNum: parseNum
  };
})(window);
