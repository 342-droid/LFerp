/**
 * SKU 库存按配送仓独立维护，多门店 + 代采/商城/多场直播共享同一仓库存。
 *
 * 现货：仓储按仓维护；商品现货 = Σ 各仓现货；门店现货 = 所属仓现货（同仓门店同一数字）。
 * 可售：商品 SKU 配置（按现货库存×百分比 / 按具体数量）套到各仓现货上。
 * 「按现货库存」100% = 取现货；>100% 为溢出。旧值 follow / percent 视为该模式。
 * 预占分两类，按仓汇总，不按门店拆分：
 *   现货预占：锁当前可售/现货，扣减剩余可售；
 *   预售预占：锁未来到货，不扣当前剩余可售。
 * 剩余可售 = 仓可售 − 现货预占。
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

  function demoRows(skuKey) {
    var h = hashSeed(skuKey);
    return WAREHOUSES.map(function (wh, idx) {
      var live =
        idx === 0
          ? [{ sessionId: 'sess-ert', sessionName: 'ERT', spot: 2 + (h % 5), presale: 1 }]
          : idx === 2
            ? [{ sessionId: 'sess-it', sessionName: 'IT专场', spot: 1, presale: 2 }]
            : [];
      return {
        warehouseId: wh.id,
        spot: Math.max(6, 48 - idx * 7 + (h % 18)),
        reservedProxy: { spot: idx % 3, presale: idx === 0 ? 1 : 0 },
        reservedMall: { spot: 1 + (idx % 2), presale: idx % 2 },
        reservedLive: live
      };
    });
  }

  /** 兼容旧数据：数字或 { qty } 视为现货预占 */
  function qtyPair(value) {
    if (value && typeof value === 'object') {
      var spot = value.spot != null ? value.spot : value.qty;
      return { spot: parseNum(spot), presale: parseNum(value.presale) };
    }
    return { spot: parseNum(value), presale: 0 };
  }

  function livePairs(row) {
    return (row.reservedLive || []).map(function (item) {
      var pair = qtyPair(item);
      return {
        sessionId: item.sessionId,
        sessionName: item.sessionName,
        spot: pair.spot,
        presale: pair.presale
      };
    });
  }

  function reservedKindsOf(row) {
    var proxy = qtyPair(row.reservedProxy);
    var mall = qtyPair(row.reservedMall);
    var liveSpot = 0;
    var livePresale = 0;
    livePairs(row).forEach(function (item) {
      liveSpot += item.spot;
      livePresale += item.presale;
    });
    return {
      spot: proxy.spot + mall.spot + liveSpot,
      presale: proxy.presale + mall.presale + livePresale,
      proxy: proxy,
      mall: mall,
      liveSpot: liveSpot,
      livePresale: livePresale
    };
  }

  function reservedOf(row) {
    var kinds = reservedKindsOf(row);
    return kinds.spot + kinds.presale;
  }

  function sessionReservedOf(row, sessionId) {
    if (!sessionId) return 0;
    var list = livePairs(row);
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].sessionId === sessionId) return list[i].spot;
    }
    return 0;
  }

  function sellableOf(row, sku, spotTotal) {
    var spot = row.spot || 0;
    if (isFixedMode(sku)) {
      var fixed = Math.round(parseNum(sku.sellableFixed));
      if (!spotTotal) return 0;
      return Math.round(fixed * spot / spotTotal);
    }
    var percent = parseNum(sku && sku.sellablePercent);
    if (!percent) percent = 100;
    return Math.round((spot * percent) / 100);
  }

  function reservedKindParts(row, kind) {
    var kinds = reservedKindsOf(row);
    var parts = [];
    var proxyQty = kinds.proxy[kind];
    var mallQty = kinds.mall[kind];
    if (proxyQty) parts.push('代采 ' + proxyQty);
    if (mallQty) parts.push('商城 ' + mallQty);
    livePairs(row).forEach(function (item) {
      if (item[kind]) parts.push('直播' + (item.sessionName || item.sessionId) + ' ' + item[kind]);
    });
    return parts.length ? parts.join(' + ') : kind === 'presale' ? '无预售预占' : '无现货预占';
  }

  function reservedParts(row) {
    var spotText = reservedKindParts(row, 'spot');
    var presaleText = reservedKindParts(row, 'presale');
    return '现货预占 ' + spotText + '；预售预占 ' + presaleText;
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
    var rows = ensureRows(sku);
    var spotTotal = rows.reduce(function (sum, row) {
      return sum + (row.spot || 0);
    }, 0);
    var view = [];
    var reservedTotal = 0;
    var reservedSpotTotal = 0;
    var reservedPresaleTotal = 0;
    var sellableTotal = 0;
    var remainTotal = 0;
    var sessionReservedTotal = 0;
    var i;
    var allocated = 0;
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      var wh = warehouseById(row.warehouseId) || { name: row.warehouseId, stores: [] };
      var kinds = reservedKindsOf(row);
      var reserved = kinds.spot + kinds.presale;
      var sellable = sellableOf(row, sku, spotTotal);
      if (isFixedMode(sku) && i === rows.length - 1) {
        sellable = Math.max(0, Math.round(parseNum(sku.sellableFixed)) - allocated);
      }
      allocated += sellable;
      var remain = Math.max(0, sellable - kinds.spot);
      var sessionQty = sessionReservedOf(row, opts.sessionId);
      reservedTotal += reserved;
      reservedSpotTotal += kinds.spot;
      reservedPresaleTotal += kinds.presale;
      sellableTotal += sellable;
      remainTotal += remain;
      sessionReservedTotal += sessionQty;
      view.push({
        warehouseId: row.warehouseId,
        name: wh.name,
        stores: wh.stores || [],
        spot: row.spot || 0,
        reserved: reserved,
        reservedSpot: kinds.spot,
        reservedPresale: kinds.presale,
        sellable: sellable,
        remain: remain,
        reservedProxy: kinds.proxy,
        reservedMall: kinds.mall,
        reservedLive: livePairs(row),
        reservedSpotText: reservedKindParts(row, 'spot'),
        reservedPresaleText: reservedKindParts(row, 'presale'),
        reservedText: reservedParts(row),
        sessionReserved: sessionQty
      });
    }
    return {
      rows: view,
      spotTotal: spotTotal,
      reservedTotal: reservedTotal,
      reservedSpotTotal: reservedSpotTotal,
      reservedPresaleTotal: reservedPresaleTotal,
      sellableTotal: sellableTotal,
      remainTotal: remainTotal,
      sessionReservedTotal: sessionReservedTotal
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
    sku.reservedSpotStock = String(sum.reservedSpotTotal);
    sku.reservedPresaleStock = String(sum.reservedPresaleTotal);
    sku.sellableStock = String(sum.sellableTotal);
    return sum;
  }

  function renderTable(sum) {
    var body = (sum.rows || [])
      .map(function (row) {
        return (
          '<tr>' +
          '<td>' +
          escapeHtml(row.name) +
          '</td>' +
          '<td class="product-proxy-wh-stock__stores">' +
          escapeHtml((row.stores || []).join('、') || '—') +
          '</td>' +
          '<td class="product-proxy-wh-stock__num">' +
          row.spot +
          '</td>' +
          '<td class="product-proxy-wh-stock__num">' +
          row.sellable +
          '</td>' +
          '<td class="product-proxy-wh-stock__num" title="' +
          escapeHtml(row.reservedText) +
          '">' +
          row.reserved +
          '</td>' +
          '<td class="product-proxy-wh-stock__num" title="' +
          escapeHtml(row.reservedSpotText) +
          '">' +
          row.reservedSpot +
          '<span class="product-proxy-wh-stock__parts">' +
          escapeHtml(row.reservedSpotText) +
          '</span></td>' +
          '<td class="product-proxy-wh-stock__num" title="' +
          escapeHtml(row.reservedPresaleText) +
          '">' +
          row.reservedPresale +
          '<span class="product-proxy-wh-stock__parts">' +
          escapeHtml(row.reservedPresaleText) +
          '</span></td>' +
          '<td class="product-proxy-wh-stock__num">' +
          row.remain +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<table class="product-proxy-wh-stock">' +
      '<thead>' +
      '<tr>' +
      '<th>配送仓</th><th>共享门店</th>' +
      '<th>现货</th><th>可售</th>' +
      '<th>总预占</th><th>现货预占</th><th>预售预占</th>' +
      '<th>剩余可售</th>' +
      '</tr>' +
      '</thead><tbody>' +
      body +
      '</tbody><tfoot><tr>' +
      '<th>合计</th><th></th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.spotTotal +
      '</th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.sellableTotal +
      '</th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.reservedTotal +
      '</th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.reservedSpotTotal +
      '</th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.reservedPresaleTotal +
      '</th>' +
      '<th class="product-proxy-wh-stock__num">' +
      sum.remainTotal +
      '</th>' +
      '</tr></tfoot></table>'
    );
  }

  function applyStoreScope(sum, storeNames) {
    var names = (storeNames || []).filter(Boolean);
    if (!sum) return { rows: [], spotTotal: 0, reservedTotal: 0, reservedSpotTotal: 0, reservedPresaleTotal: 0, sellableTotal: 0, remainTotal: 0, sessionReservedTotal: 0 };
    if (!names.length) return sum;
    var rows = (sum.rows || [])
      .map(function (row) {
        var stores = (row.stores || []).filter(function (name) {
          return names.indexOf(name) >= 0;
        });
        if (!stores.length) return null;
        return Object.assign({}, row, { stores: stores });
      })
      .filter(Boolean);
    return {
      rows: rows,
      spotTotal: rows.reduce(function (n, r) { return n + (r.spot || 0); }, 0),
      reservedTotal: rows.reduce(function (n, r) { return n + (r.reserved || 0); }, 0),
      reservedSpotTotal: rows.reduce(function (n, r) { return n + (r.reservedSpot || 0); }, 0),
      reservedPresaleTotal: rows.reduce(function (n, r) { return n + (r.reservedPresale || 0); }, 0),
      sellableTotal: rows.reduce(function (n, r) { return n + (r.sellable || 0); }, 0),
      remainTotal: rows.reduce(function (n, r) { return n + (r.remain || 0); }, 0),
      sessionReservedTotal: rows.reduce(function (n, r) { return n + (r.sessionReserved || 0); }, 0)
    };
  }

  function summaryText(sum) {
    var n = (sum && sum.rows ? sum.rows.length : 0);
    return (
      '现货 ' +
      ((sum && sum.spotTotal) || 0) +
      ' · 可售 ' +
      ((sum && sum.sellableTotal) || 0) +
      ' · ' +
      n +
      ' 个仓'
    );
  }

  function renderPanel(sku, opts) {
    opts = opts || {};
    var sum = applyStoreScope(attachToSku(sku, opts), opts.storeNames);
    var scoped = opts.storeNames && opts.storeNames.length;
    var tip =
      opts.variant === 'live'
        ? '下表按<strong>配送仓 / 共享门店</strong>展示现货与可售。本场配额从仓剩余可售中占用（剩余可售=可售−现货预占）。代采、商城、其他场次直播与同仓门店共享该仓库存。'
        : scoped
          ? '下表仅展示<strong>售卖范围内门店</strong>对应的配送仓库存。现货由仓储按仓维护；可售按上方配置套在各仓现货上。'
          : '下表按<strong>配送仓 / 共享门店</strong>展示库存。现货由仓储按仓维护，商品现货=各仓之和；可售按上方配置计算。<strong>现货预占</strong>扣剩余可售，<strong>预售预占</strong>不扣当前现货。';
    return (
      '<div class="product-proxy-spec__field product-proxy-spec__field--wh-stock is-collapsed">' +
      '<button type="button" class="product-proxy-wh-stock__toggle" data-wh-stock-toggle aria-expanded="false">' +
      '<span class="product-proxy-wh-stock__toggle-title">仓店库存</span>' +
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

  function addChannelParts(parts, proxy, mall, live) {
    if (proxy) parts.push('代采 ' + proxy);
    if (mall) parts.push('商城 ' + mall);
    if (live) parts.push('直播 ' + live);
    return parts;
  }

  function reservedChannelTotals(sum) {
    var proxySpot = 0;
    var mallSpot = 0;
    var liveSpot = 0;
    var proxyPresale = 0;
    var mallPresale = 0;
    var livePresale = 0;
    (sum.rows || []).forEach(function (row) {
      var proxy = qtyPair(row.reservedProxy);
      var mall = qtyPair(row.reservedMall);
      proxySpot += proxy.spot;
      mallSpot += mall.spot;
      proxyPresale += proxy.presale;
      mallPresale += mall.presale;
      (row.reservedLive || []).forEach(function (item) {
        var pair = qtyPair(item);
        liveSpot += pair.spot;
        livePresale += pair.presale;
      });
    });
    var spotParts = addChannelParts([], proxySpot, mallSpot, liveSpot);
    var presaleParts = addChannelParts([], proxyPresale, mallPresale, livePresale);
    return {
      spot: proxySpot + mallSpot + liveSpot,
      presale: proxyPresale + mallPresale + livePresale,
      proxy: proxySpot + proxyPresale,
      mall: mallSpot + mallPresale,
      live: liveSpot + livePresale,
      spotText: spotParts.length ? spotParts.join(' + ') : '无现货预占',
      presaleText: presaleParts.length ? presaleParts.join(' + ') : '无预售预占',
      text: (spotParts.length || presaleParts.length)
        ? '现货预占 ' + (spotParts.join(' + ') || '0') + '；预售预占 ' + (presaleParts.join(' + ') || '0')
        : '无预占'
    };
  }

  global.MdmSkuWhStock = {
    WAREHOUSES: WAREHOUSES,
    demoRows: demoRows,
    summarize: summarize,
    attachToSku: attachToSku,
    applyStoreScope: applyStoreScope,
    renderTable: renderTable,
    renderPanel: renderPanel,
    summaryText: summaryText,
    reservedChannelTotals: reservedChannelTotals,
    normalizeSellableMode: normalizeSellableMode,
    parseNum: parseNum
  };
})(window);
