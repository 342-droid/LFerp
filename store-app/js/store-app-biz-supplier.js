/**
 * 供应商 · 数据中心交互
 * 六区：总览／趋势／商品／履约售后／门店／结算；状态：加载／空／失败
 */
(function () {
  var state = {
    tab: 'overview',
    range: '30d',
    custom: { from: '', to: '' },
    sort: 'gmv',
    keyword: '',
    trendMetric: 'gmv',
    loading: false,
    error: null,
    data: null
  };

  var TABS = [
    { id: 'overview', label: '经营总览' },
    { id: 'trends', label: '趋势分析' },
    { id: 'products', label: '商品分析' },
    { id: 'fulfill', label: '履约与售后' },
    { id: 'stores', label: '门店采购' },
    { id: 'settle', label: '结算概览' }
  ];

  function cfg() {
    return window.StoreAppBizSupplierConfig || {};
  }

  function api() {
    return window.StoreAppBizSupplierData;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(n) {
    var A = api();
    return A && A.money ? A.money(n) : String(n == null ? '—' : n);
  }

  function compareText(pair) {
    var empty = (cfg().COMPARE_EMPTY != null ? cfg().COMPARE_EMPTY : '--');
    if (!pair || pair.deltaPct == null || !isFinite(pair.deltaPct)) {
      return { text: '环比 ' + empty, cls: '' };
    }
    var v = Number(pair.deltaPct);
    var sign = v > 0 ? '+' : '';
    return {
      text: '环比 ' + sign + v.toFixed(1) + '%',
      cls: v > 0 ? 'is-up' : v < 0 ? 'is-down' : ''
    };
  }

  function drawLineChart(svg, yEl, pts) {
    if (!svg) return;
    var w = 289;
    var h = 112;
    var padL = 4;
    var padR = 4;
    var padT = 8;
    var padB = 18;
    if (!pts || !pts.length) {
      svg.innerHTML = '';
      if (yEl) yEl.innerHTML = '';
      return;
    }
    var vals = pts.map(function (p) {
      return Number(p.value) || 0;
    });
    var maxV = Math.max.apply(null, vals.concat([1]));
    var niceMax = Math.ceil(maxV / 100) * 100;
    if (niceMax < maxV) niceMax = Math.ceil(maxV);
    if (niceMax <= 0) niceMax = 1;
    var ticks = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];
    if (yEl) {
      yEl.innerHTML = ticks
        .map(function (t) {
          return '<span>' + t + '</span>';
        })
        .join('');
    }
    var innerW = w - padL - padR;
    var innerH = h - padT - padB;
    function xAt(i, n) {
      if (n <= 1) return padL + innerW / 2;
      return padL + (innerW * i) / (n - 1);
    }
    function yAt(v) {
      return padT + innerH * (1 - v / niceMax);
    }
    var path = pts
      .map(function (p, i) {
        return (i === 0 ? 'M' : 'L') + xAt(i, pts.length).toFixed(1) + ' ' + yAt(Number(p.value) || 0).toFixed(1);
      })
      .join(' ');
    var grid = '';
    ticks.forEach(function (t, i) {
      if (i === ticks.length - 1) return;
      var y = yAt(t);
      grid +=
        '<line x1="' +
        padL +
        '" y1="' +
        y.toFixed(1) +
        '" x2="' +
        (w - padR) +
        '" y2="' +
        y.toFixed(1) +
        '" stroke="#eef0f4" stroke-width="1" stroke-dasharray="3 4"/>';
    });
    var labels = '';
    var step = Math.max(1, Math.ceil(pts.length / 5));
    pts.forEach(function (p, i) {
      if (i % step !== 0 && i !== pts.length - 1) return;
      labels +=
        '<text x="' +
        xAt(i, pts.length).toFixed(1) +
        '" y="' +
        (h - 2) +
        '" text-anchor="middle" fill="#71727A" font-size="10">' +
        esc(p.label || '') +
        '</text>';
    });
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML =
      grid +
      '<path d="' +
      path +
      '" fill="none" stroke="#FF7019" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      pts
        .map(function (p, i) {
          var x = xAt(i, pts.length);
          var y = yAt(Number(p.value) || 0);
          return (
            '<circle cx="' +
            x.toFixed(1) +
            '" cy="' +
            y.toFixed(1) +
            '" r="2.5" fill="#FF7019"/>'
          );
        })
        .join('') +
      labels;
  }

  function riskTags(p) {
    var r = (cfg().RISK || {});
    var tags = [];
    var stock = Number(p.stock);
    if (stock <= (r.outOfStockQty != null ? r.outOfStockQty : 0)) {
      tags.push({ t: '缺货', c: 'danger' });
    } else if (stock <= (r.lowStockQty != null ? r.lowStockQty : 20)) {
      tags.push({ t: '低库存', c: 'warn' });
    }
    if (Number(p.aftersaleRate) >= (r.highAftersaleRatePct != null ? r.highAftersaleRatePct : 8)) {
      tags.push({ t: '高售后', c: 'danger' });
    }
    return tags
      .map(function (x) {
        return '<span class="sa-sbiz-tag sa-sbiz-tag--' + x.c + '">' + esc(x.t) + '</span>';
      })
      .join('');
  }

  function metricCell(label, pair, opts) {
    opts = opts || {};
    var cmp = compareText(pair);
    var val =
      opts.kind === 'pct'
        ? pair && pair.value != null
          ? Number(pair.value).toFixed(1) + '%'
          : '—'
        : opts.kind === 'int'
          ? pair && pair.value != null
            ? String(pair.value)
            : '—'
          : money(pair && pair.value);
    return (
      '<div class="sa-sbiz-cell' +
      (opts.wide ? ' is-wide' : '') +
      '"><span>' +
      esc(label) +
      '</span><b>' +
      esc(val) +
      '</b><em class="' +
      cmp.cls +
      '">' +
      esc(cmp.text) +
      '</em></div>'
    );
  }

  function renderState(type, msg) {
    if (type === 'loading') {
      return '<div class="sa-sbiz-state" role="status">加载中…</div>';
    }
    if (type === 'error') {
      return (
        '<div class="sa-sbiz-state sa-sbiz-state--err" role="alert">' +
        esc(msg || '加载失败') +
        '<div><button type="button" class="sa-sbiz-state__act" data-act="retry">重试</button></div></div>'
      );
    }
    return (
      '<div class="sa-sbiz-state" role="status">' +
      esc(msg || '暂无数据') +
      '</div>'
    );
  }

  function renderOverview(data) {
    var o = data.overview;
    if (!o) return renderState('empty', '本时段暂无经营数据');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>核心指标</h2></div>' +
      '<div class="sa-sbiz-grid">' +
      metricCell('成交额(元)', o.gmv) +
      metricCell('销量', o.qty, { kind: 'int' }) +
      metricCell('订单数', o.orderCount, { kind: 'int' }) +
      metricCell('退款金额(元)', o.refundAmount) +
      metricCell('售后率', o.aftersaleRate, { kind: 'pct' }) +
      metricCell('待发货数', o.pendingShip, { kind: 'int' }) +
      metricCell('可结算金额(元)', o.settleable, { wide: true }) +
      '</div></section>'
    );
  }

  function renderTrends(data) {
    var t = data.trends || {};
    var seriesMap = {
      gmv: { title: '成交额趋势', pts: t.gmv },
      orders: { title: '订单数趋势', pts: t.orders },
      qty: { title: '销量趋势', pts: t.qty }
    };
    var cur = seriesMap[state.trendMetric] || seriesMap.gmv;
    var asPts = t.aftersaleAmount || [];
    var asRate = t.aftersaleRate || [];
    var emptyMain = !(cur.pts && cur.pts.length);
    /* 粒度跟随顶栏时段，卡片上不展示「按天／按周」标识 */
    var html =
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>经营趋势</h2></div>' +
      '<div class="sa-sbiz-metric-tabs">' +
      ['gmv', 'orders', 'qty']
        .map(function (k) {
          var lab = k === 'gmv' ? '成交额' : k === 'orders' ? '订单数' : '销量';
          return (
            '<button type="button" class="sa-sbiz-chip' +
            (state.trendMetric === k ? ' is-on' : '') +
            '" data-trend-metric="' +
            k +
            '">' +
            lab +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      (emptyMain
        ? renderState('empty', '暂无趋势数据')
        : '<div class="sa-sbiz-chart-wrap"><div class="sa-sbiz-chart-y" id="sbizTrendY"></div>' +
          '<svg class="sa-sbiz-chart" id="sbizTrendSvg" viewBox="0 0 289 112"></svg></div>') +
      '</section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>售后金额趋势</h2></div>' +
      (!(asPts && asPts.length)
        ? renderState('empty', '暂无售后金额趋势')
        : '<div class="sa-sbiz-chart-wrap"><div class="sa-sbiz-chart-y" id="sbizAsAmtY"></div>' +
          '<svg class="sa-sbiz-chart" id="sbizAsAmtSvg" viewBox="0 0 289 112"></svg></div>') +
      '</section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>售后率趋势</h2></div>' +
      (!(asRate && asRate.length)
        ? renderState('empty', '暂无售后率趋势')
        : '<div class="sa-sbiz-chart-wrap"><div class="sa-sbiz-chart-y" id="sbizAsRateY"></div>' +
          '<svg class="sa-sbiz-chart" id="sbizAsRateSvg" viewBox="0 0 289 112"></svg></div>') +
      '</section>';
    return html;
  }

  function paintCharts(data) {
    if (state.tab !== 'trends' || !data || !data.trends) return;
    var t = data.trends;
    var map = { gmv: t.gmv, orders: t.orders, qty: t.qty };
    drawLineChart(
      document.getElementById('sbizTrendSvg'),
      document.getElementById('sbizTrendY'),
      map[state.trendMetric] || t.gmv
    );
    drawLineChart(
      document.getElementById('sbizAsAmtSvg'),
      document.getElementById('sbizAsAmtY'),
      t.aftersaleAmount
    );
    drawLineChart(
      document.getElementById('sbizAsRateSvg'),
      document.getElementById('sbizAsRateY'),
      t.aftersaleRate
    );
  }

  function renderProducts(data) {
    var list = data.products || [];
    var bar =
      '<div class="sa-sbiz-toolbar">' +
      '<input class="sa-sbiz-search" id="sbizKw" type="search" placeholder="搜索商品／SKU" value="' +
      esc(state.keyword) +
      '"/>' +
      '<select class="sa-sbiz-select" id="sbizSort">' +
      '<option value="gmv"' +
      (state.sort === 'gmv' ? ' selected' : '') +
      '>按成交额</option>' +
      '<option value="qty"' +
      (state.sort === 'qty' ? ' selected' : '') +
      '>按销量</option>' +
      '<option value="aftersaleRate"' +
      (state.sort === 'aftersaleRate' ? ' selected' : '') +
      '>按售后率</option>' +
      '</select></div>';
    if (!list.length) {
      return '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>商品／SKU 排行</h2></div>' + bar + renderState('empty', '暂无商品数据') + '</section>';
    }
    var rows = list
      .map(function (p) {
        return (
          '<tr><td>' +
          esc(p.name) +
          '<div>' +
          riskTags(p) +
          '</div><div style="color:#999;font-size:11px">' +
          esc(p.sku) +
          '</div></td><td><b>' +
          esc(p.qty) +
          '</b></td><td><b>' +
          money(p.gmv) +
          '</b></td><td>' +
          money(p.refund) +
          '</td><td>' +
          Number(p.aftersaleRate).toFixed(1) +
          '%</td><td>' +
          esc(p.stock) +
          '</td><td>' +
          esc(p.activeStores) +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>商品／SKU 排行</h2></div>' +
      bar +
      '<div style="overflow:auto"><table class="sa-sbiz-table"><thead><tr>' +
      '<th>商品</th><th>销量</th><th>成交额</th><th>退款</th><th>售后率</th><th>库存</th><th>动销门店</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table></div></section>'
    );
  }

  function renderFulfill(data) {
    var f = data.fulfillment;
    if (!f) return renderState('empty', '暂无履约与售后数据');
    var types = (f.aftersaleTypes || [])
      .map(function (t) {
        return (
          '<div class="sa-sbiz-row"><span>' +
          esc(t.type) +
          ' · 申请 ' +
          esc(t.applyCount) +
          '／完成 ' +
          esc(t.doneCount) +
          '</span><b>' +
          money(t.amount) +
          '</b></div>'
        );
      })
      .join('');
    /* 原因行仅展示统计，不下钻筛选（售后列表暂不支持按原因筛） */
    var reasons = (f.aftersaleReasons || [])
      .map(function (r) {
        return (
          '<div class="sa-sbiz-row"><span>' +
          esc(r.reason) +
          ' · ' +
          esc(r.count) +
          ' 笔</span><b>' +
          money(r.amount) +
          '</b></div>'
        );
      })
      .join('');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>履约指标</h2>' +
      '<a class="sa-sbiz-link" href="' +
      esc(f.ordersHref || 'supplier-orders.html') +
      '">客户订单</a></div>' +
      '<div class="sa-sbiz-grid">' +
      '<div class="sa-sbiz-cell"><span>待发货数</span><b>' +
      esc(f.pendingShip) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>平均发货时长(小时)</span><b>' +
      Number(f.avgShipHours).toFixed(1) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>缺货取消数</span><b>' +
      esc(f.stockoutCancel) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>配送异常数</span><b>' +
      esc(f.deliveryAbnormal) +
      '</b></div></div></section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>售后类型</h2>' +
      '<a class="sa-sbiz-link" href="' +
      esc(f.aftersaleHref || 'supplier-aftersale.html') +
      '">售后管理</a></div>' +
      types +
      '</section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>售后原因</h2></div>' +
      reasons +
      '</section>'
    );
  }

  function renderStores(data) {
    var s = data.stores || {};
    var sum = s.summary;
    if (!sum) return renderState('empty', '暂无门店采购数据');
    var idle = sum.silentIdleDays || 30;
    var maxR = Math.max.apply(
      null,
      (s.regions || []).map(function (r) {
        return r.value;
      }).concat([1])
    );
    var regions = (s.regions || [])
      .map(function (r) {
        var w = Math.round((r.value / maxR) * 100);
        return (
          '<div class="sa-sbiz-bar"><span style="width:48px">' +
          esc(r.name) +
          '</span><div class="sa-sbiz-bar__track"><div class="sa-sbiz-bar__fill" style="width:' +
          w +
          '%"></div></div><b>' +
          esc(r.value) +
          '%</b></div>'
        );
      })
      .join('');
    var rows = (s.list || [])
      .map(function (st) {
        return (
          '<tr><td>' +
          esc(st.name) +
          (st.silent
            ? ' <span class="sa-sbiz-tag sa-sbiz-tag--warn">沉默</span>'
            : '') +
          '</td><td>' +
          esc(st.region) +
          '</td><td>' +
          esc(st.orders) +
          '</td><td><b>' +
          money(st.gmv) +
          '</b></td><td>' +
          esc(st.lastPurchase) +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>门店采购概览</h2></div>' +
      '<div class="sa-sbiz-grid">' +
      '<div class="sa-sbiz-cell"><span>采购门店数</span><b>' +
      esc(sum.storeCount) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>复购门店数</span><b>' +
      esc(sum.repurchaseStoreCount) +
      '</b></div>' +
      '<div class="sa-sbiz-cell is-wide"><span>沉默采购门店</span><b>' +
      esc(sum.silentStoreCount) +
      '</b><em>近 ' +
      esc(idle) +
      ' 天无采购</em></div></div></section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>区域分布</h2></div>' +
      (regions || renderState('empty', '暂无区域数据')) +
      '</section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>门店贡献</h2></div>' +
      (rows
        ? '<div style="overflow:auto"><table class="sa-sbiz-table"><thead><tr><th>门店</th><th>区域</th><th>订单数</th><th>成交额</th><th>最近采购</th></tr></thead><tbody>' +
          rows +
          '</tbody></table></div>'
        : renderState('empty', '暂无门店列表')) +
      '</section>'
    );
  }

  function renderSettle(data) {
    var s = data.settle;
    if (!s) return renderState('empty', '暂无结算数据');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>结算概览</h2>' +
      '<a class="sa-sbiz-link" href="' +
      esc(s.detailHref || 'supplier-settle.html') +
      '">结算中心</a></div>' +
      '<div class="sa-sbiz-grid">' +
      '<div class="sa-sbiz-cell"><span>应收金额(元)</span><b>' +
      money(s.receivable) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>可结算金额(元)</span><b>' +
      money(s.settleable) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>结算中金额(元)</span><b>' +
      money(s.settling) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>已结算金额(元)</span><b>' +
      money(s.settled) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>售后／退款冲销(元)</span><b>' +
      money(s.writeOff) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>对账差异数</span><b>' +
      esc(s.reconcileDiff) +
      '</b></div></div></section>'
    );
  }

  function renderBody() {
    var host = document.getElementById('saSupBizBody');
    if (!host) return;
    if (state.loading) {
      host.innerHTML = renderState('loading');
      return;
    }
    if (state.error) {
      host.innerHTML = renderState('error', state.error);
      return;
    }
    var data = state.data;
    if (!data) {
      host.innerHTML = renderState('empty');
      return;
    }
    if (data.meta && data.meta.empty && state.tab === 'overview') {
      host.innerHTML = renderState('empty', '本时段暂无经营数据');
      return;
    }
    var html = '';
    if (state.tab === 'overview') html = renderOverview(data);
    else if (state.tab === 'trends') html = renderTrends(data);
    else if (state.tab === 'products') html = renderProducts(data);
    else if (state.tab === 'fulfill') html = renderFulfill(data);
    else if (state.tab === 'stores') html = renderStores(data);
    else if (state.tab === 'settle') html = renderSettle(data);
    else html = renderState('empty');
    host.innerHTML = html;
    paintCharts(data);
    bindBodyControls();
  }

  function renderChrome() {
    var asOf = document.getElementById('saSupBizAsOf');
    if (asOf) {
      var t = state.data && state.data.meta && state.data.meta.asOf;
      asOf.textContent = '数据截至 ' + (t || '—');
    }
    var ranges = document.getElementById('saSupBizRanges');
    if (ranges && api()) {
      ranges.innerHTML = (api().RANGE_OPTIONS || [])
        .map(function (opt) {
          var on = opt.id === state.range;
          var label = opt.label;
          if (opt.id === 'custom' && state.custom.from && state.custom.to) {
            label = state.custom.from.slice(5) + '~' + state.custom.to.slice(5);
          }
          return (
            '<button type="button" class="sa-sbiz-chip' +
            (on ? ' is-on' : '') +
            '" data-range="' +
            esc(opt.id) +
            '">' +
            esc(label) +
            '</button>'
          );
        })
        .join('');
    }
    var tabs = document.getElementById('saSupBizTabs');
    if (tabs) {
      tabs.innerHTML = TABS.map(function (t) {
        return (
          '<button type="button" class="sa-sbiz-tab' +
          (t.id === state.tab ? ' is-on' : '') +
          '" data-tab="' +
          t.id +
          '">' +
          esc(t.label) +
          '</button>'
        );
      }).join('');
    }
  }

  function load() {
    if (!api() || !api().fetchBundle) return;
    state.loading = true;
    state.error = null;
    renderChrome();
    renderBody();
    api()
      .fetchBundle({
        range: state.range,
        custom: state.custom,
        sort: state.sort,
        keyword: state.keyword,
        section: state.tab
      })
      .then(function (data) {
        state.loading = false;
        state.data = data;
        renderChrome();
        renderBody();
      })
      .catch(function (err) {
        state.loading = false;
        state.data = null;
        state.error = (err && err.message) || '加载失败';
        renderChrome();
        renderBody();
      });
  }

  function openCustomSheet() {
    var sheet = document.getElementById('saSupBizSheet');
    if (!sheet) return;
    var from = document.getElementById('saSupBizFrom');
    var to = document.getElementById('saSupBizTo');
    if (from) from.value = state.custom.from || '';
    if (to) to.value = state.custom.to || '';
    sheet.hidden = false;
  }

  function closeCustomSheet() {
    var sheet = document.getElementById('saSupBizSheet');
    if (sheet) sheet.hidden = true;
  }

  function bindBodyControls() {
    var kw = document.getElementById('sbizKw');
    var sort = document.getElementById('sbizSort');
    if (kw) {
      kw.addEventListener('change', function () {
        state.keyword = kw.value || '';
        load();
      });
      kw.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          state.keyword = kw.value || '';
          load();
        }
      });
    }
    if (sort) {
      sort.addEventListener('change', function () {
        state.sort = sort.value || 'gmv';
        load();
      });
    }
  }

  function bind() {
    var root = document.getElementById('saSupBizRoot');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-range]');
      if (t) {
        var r = t.getAttribute('data-range');
        if (r === 'custom') {
          openCustomSheet();
          return;
        }
        state.range = r || '30d';
        load();
        return;
      }
      var tab = e.target.closest('[data-tab]');
      if (tab) {
        state.tab = tab.getAttribute('data-tab') || 'overview';
        renderChrome();
        renderBody();
        return;
      }
      var tm = e.target.closest('[data-trend-metric]');
      if (tm) {
        state.trendMetric = tm.getAttribute('data-trend-metric') || 'gmv';
        renderBody();
        return;
      }
      if (e.target.closest('[data-act="retry"]')) {
        load();
      }
    });

    var sheetOk = document.getElementById('saSupBizSheetOk');
    var sheet = document.getElementById('saSupBizSheet');
    /* C 端：点蒙层空白关闭，不设关闭按钮 */
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet) closeCustomSheet();
      });
    }
    if (sheetOk) {
      sheetOk.addEventListener('click', function () {
        var from = document.getElementById('saSupBizFrom');
        var to = document.getElementById('saSupBizTo');
        var f = from && from.value;
        var t = to && to.value;
        if (!f || !t) return;
        if (f > t) {
          var tmp = f;
          f = t;
          t = tmp;
        }
        state.custom = { from: f, to: t };
        state.range = 'custom';
        closeCustomSheet();
        load();
      });
    }
  }

  function mountDemo() {
    if (document.getElementById('saSupBizDemo')) return;
    var box = document.createElement('div');
    box.id = 'saSupBizDemo';
    box.className = 'sa-sbiz-demo';
    box.innerHTML =
      '<h4>供应商经营验收开关</h4>' +
      '<label>场景</label>' +
      '<select id="saSupBizDemoSel">' +
      '<option value="normal">正常有数</option>' +
      '<option value="empty">无数据</option>' +
      '<option value="aftersale">售后异常</option>' +
      '<option value="settle0">结算金额为零</option>' +
      '<option value="forbidden">越权访问</option>' +
      '</select>' +
      '<button type="button" id="saSupBizDemoApply">应用并刷新</button>';
    document.body.appendChild(box);
    var sel = document.getElementById('saSupBizDemoSel');
    var A = api();
    if (sel && A) sel.value = A.readDemoMode() || 'normal';
    document.getElementById('saSupBizDemoApply').addEventListener('click', function () {
      if (A) A.setDemoMode(sel.value);
      load();
    });
  }

  function boot() {
    if (window.FybOrg && window.FybOrg.ensureSupplierModeOrRedirect) {
      if (!window.FybOrg.ensureSupplierModeOrRedirect('home.html')) return;
    }
    bind();
    mountDemo();
    renderChrome();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
