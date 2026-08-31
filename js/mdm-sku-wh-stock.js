/**
 * SKU 库存按配送仓独立维护，多门店 + 代采/商城/多场直播共享同一仓库存。
 *
 * 现货：仓储按仓维护；商品现货 = Σ 各仓现货；门店现货 = 所属仓现货（同仓门店同一数字）。
 * 可售：商品 SKU 配置（取现货 / 百分比 / 固定）套到各仓现货上。
 * 预占分两类，按仓汇总，不按门店拆分：
 *   现货预占：锁当前可售/现货，扣减剩余可售；
 *   预售预占：锁未来到货，不扣当前剩余可售。
 * 剩余可售 = 仓可售 − 现货预占。
 */
(function (global) {
  var WAREHOUSES = [
    { id: 'wh-hz', name: '杭州配送仓', stores: ['鲜丰水果文一西路店', '鲜丰水果萧山万达店'] },
    { id: 'wh-bj', name: '北京配送仓', stores: ['鲜丰水果朝阳大悦城店'] },
    { id: 'wh-sh', name: '上海配送仓', stores: ['鲜丰水果陆家嘴店'] }
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

  function demoRows(skuKey) {
    var h = hashSeed(skuKey);
    return [
      {
        warehouseId: 'wh-hz',
        spot: 60 + (h % 40),
        reservedProxy: { spot: 3 + (h % 4), presale: 1 + (h % 2) },
        reservedMall: { spot: 4 + (h % 3), presale: h % 2 },
        reservedLive: [{ sessionId: 'sess-ert', sessionName: 'ERT', spot: 2 + (h % 5), presale: 1 }]
      },
      {
        warehouseId: 'wh-bj',
        spot: 18 + (h % 20),
        reservedProxy: { spot: h % 3, presale: 0 },
        reservedMall: { spot: 1 + (h % 2), presale: 1 },
        reservedLive: []
      },
      {
        warehouseId: 'wh-sh',
        spot: 10 + (h % 16),
        reservedProxy: { spot: 0, presale: h % 2 },
        reservedMall: { spot: h % 2, presale: 0 },
        reservedLive: [{ sessionId: 'sess-it', sessionName: 'IT专场', spot: 1, presale: 2 }]
      }
    ];
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
    var mode = sku && sku.sellableMode;
    var spot = row.spot || 0;
    if (mode === 'percent') return Math.round(spot * parseNum(sku.sellablePercent) / 100);
    if (mode === 'fixed') {
      var fixed = Math.round(parseNum(sku.sellableFixed));
      if (!spotTotal) return 0;
      return Math.round(fixed * spot / spotTotal);
    }
    return Math.round(spot);
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
    if (!sku.warehouseStocks || !sku.warehouseStocks.length) {
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
      if (sku && sku.sellableMode === 'fixed' && i === rows.length - 1) {
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
    if (sku.sellableMode !== 'percent' && sku.sellableMode !== 'fixed' && sku.sellableMode !== 'follow') {
      sku.sellableMode = 'follow';
    }
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

  function renderPanel(sku, opts) {
    opts = opts || {};
    var sum = attachToSku(sku, opts);
    var tip =
      opts.variant === 'live'
        ? '现货按<strong>配送仓</strong>独立维护。本场配额从仓剩余可售中占用（剩余可售=可售−现货预占）。<strong>代采、商城、其他场次直播</strong>与同仓多家门店共享该仓库存。'
        : '现货由仓储按<strong>配送仓</strong>独立维护，商品现货=各仓现货之和。同仓多家门店看到同一仓现货；<strong>代采、商城、各场直播</strong>共享该仓。<strong>现货预占</strong>扣剩余可售，<strong>预售预占</strong>不扣当前现货。';
    return (
      '<div class="product-proxy-spec__field product-proxy-spec__field--wh-stock">' +
      '<div class="mdm-biz-tip mdm-biz-tip--flush" role="note">' +
      tip +
      '</div>' +
      renderTable(sum) +
      '</div>'
    );
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
    renderTable: renderTable,
    renderPanel: renderPanel,
    reservedChannelTotals: reservedChannelTotals,
    parseNum: parseNum
  };
})(window);
