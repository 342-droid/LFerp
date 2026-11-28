/**
 * 供应商 · 数据中心交互
 * 一期五区：总览／商品表现／订单退款／履约售后／货款结款（不含独立门店分析）；状态：加载／空／失败
 */
(function () {
  var state = {
    tab: 'overview',
    range: '30d',
    custom: { from: '', to: '' },
    sort: 'paidGmv',
    keyword: '',
    loading: false,
    error: null,
    data: null
  };

  var TABS = [
    { id: 'overview', label: '经营总览' },
    { id: 'products', label: '商品表现' },
    { id: 'refunds', label: '订单退款' },
    { id: 'fulfill', label: '履约与售后' },
    { id: 'settle', label: '货款结款' }
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
    var note = opts.note
      ? '<i class="sa-sbiz-cell__note">' + esc(opts.note) + '</i>'
      : '';
    return (
      '<div class="sa-sbiz-cell' +
      (opts.wide ? ' is-wide' : '') +
      '"><span>' +
      esc(label) +
      '</span><b>' +
      esc(val) +
      '</b>' +
      note +
      '<em class="' +
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
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>交易与供货</h2></div>' +
      '<p class="sa-sbiz-tip">支付交易按支付成功时间统计；实际供货按履约完成统计。以下金额为供应商货款，不是消费者实付。</p>' +
      '<div class="sa-sbiz-grid">' +
      metricCell('销售额(元)', o.paidGmv, { note: '按支付成功' }) +
      metricCell('商品交易数量', o.paidQty, { kind: 'int', note: '按支付成功' }) +
      metricCell('订单数', o.orderCount, { kind: 'int', note: '按支付成功' }) +
      metricCell('实际供货数量', o.fulfillQty, { kind: 'int', note: '按履约完成' }) +
      metricCell('实际供货货款(元)', o.fulfillGoodsAmt, { note: '按履约完成' }) +
      metricCell('退款金额(元)', o.refundAmount, { note: '按退款完成' }) +
      '</div></section>' +
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>货款结款摘要</h2></div>' +
      '<p class="sa-sbiz-tip">应结、待结款、已结款分别展示，请勿直接相加。无记录显示 —，金额为 0 显示 0。</p>' +
      '<div class="sa-sbiz-grid">' +
      metricCell('应结货款(元)', o.duePayable) +
      metricCell('待结款(元)', o.pendingSettle) +
      metricCell('已结款(元)', o.settled) +
      '</div></section>'
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
      '<option value="paidGmv"' +
      (state.sort === 'paidGmv' ? ' selected' : '') +
      '>按销售额</option>' +
      '<option value="paidQty"' +
      (state.sort === 'paidQty' ? ' selected' : '') +
      '>按交易数量</option>' +
      '<option value="fulfillQty"' +
      (state.sort === 'fulfillQty' ? ' selected' : '') +
      '>按履约供货量</option>' +
      '<option value="aftersaleRate"' +
      (state.sort === 'aftersaleRate' ? ' selected' : '') +
      '>按售后率</option>' +
      '</select></div>';
    if (!list.length) {
      return (
        '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>商品表现</h2></div>' +
        bar +
        renderState('empty', '暂无商品数据') +
        '</section>'
      );
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
          esc(p.paidQty) +
          '</b></td><td><b>' +
          esc(p.fulfillQty) +
          '</b></td><td><b>' +
          money(p.paidGmv) +
          '</b></td><td>' +
          money(p.goodsPayable) +
          '</td><td>' +
          esc(p.refundQty) +
          '／' +
          money(p.refundAmount) +
          '</td><td>' +
          Number(p.aftersaleRate || 0).toFixed(1) + '%' +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>商品表现</h2></div>' +
      '<p class="sa-sbiz-tip">交易数量按支付成功统计；履约供货按履约完成统计。退数量与退款金额分开显示。</p>' +
      bar +
      '<div style="overflow:auto"><table class="sa-sbiz-table"><thead><tr>' +
      '<th>商品</th><th>交易数量</th><th>履约供货</th><th>销售额</th><th>货款</th><th>退数量／退款</th><th>售后率</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table></div></section>'
    );
  }

  function renderRefunds(data) {
    var list = data.refundOrders || [];
    if (!list.length) {
      return (
        '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>订单退款</h2></div>' +
        renderState('empty', '本时段暂无退款记录') +
        '</section>'
      );
    }
    var rows = list
      .map(function (r) {
        var adj =
          r.payableAdjust == null ? '—' : money(r.payableAdjust);
        return (
          '<tr><td>' +
          esc(r.orderNo) +
          '<div style="color:#999;font-size:11px">' +
          esc(r.goods) +
          '</div></td><td>' +
          esc(r.refundType) +
          '</td><td>' +
          money(r.customerRefund) +
          '</td><td>' +
          adj +
          '</td><td>' +
          esc(r.orderStatus) +
          '<div style="color:#999;font-size:11px">售后 ' +
          esc(r.aftersaleStatus) +
          ' · 结款 ' +
          esc(String(r.settleStatus).replace(/结算/g, '结款')) +
          '</div></td></tr>'
        );
      })
      .join('');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>订单退款</h2></div>' +
      '<p class="sa-sbiz-tip">顾客退款与货款调整分别取自系统记录，金额可能不同。订单、售后、结款状态分开显示。</p>' +
      '<div style="overflow:auto"><table class="sa-sbiz-table"><thead><tr>' +
      '<th>订单／商品</th><th>类型</th><th>顾客退款</th><th>货款调整</th><th>状态</th>' +
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
      '<p class="sa-sbiz-tip">实际供货按履约完成统计。售后申请或审核通过不等于退款完成。</p>' +
      '<div class="sa-sbiz-grid">' +
      '<div class="sa-sbiz-cell"><span>履约完成订单数</span><b>' +
      esc(f.fulfillOrderCount != null ? f.fulfillOrderCount : '—') +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>履约完成商品数</span><b>' +
      esc(f.fulfillQty != null ? f.fulfillQty : '—') +
      '</b></div>' +
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

  function renderSettle(data) {
    var s = data.settle;
    if (!s) return renderState('empty', '暂无结款数据');
    return (
      '<section class="sa-sbiz-card"><div class="sa-sbiz-card__hd"><h2>货款结款</h2>' +
      '<a class="sa-sbiz-link" href="' +
      esc(s.detailHref || 'supplier-settle.html') +
      '">结款单明细</a></div>' +
      '<p class="sa-sbiz-tip">货款取自供应商结款记录。应结、待结款、已结款分别展示，请勿直接相加。可进入结款单查看关联订单。</p>' +
      '<div class="sa-sbiz-grid">' +
      '<div class="sa-sbiz-cell"><span>应结货款(元)</span><b>' +
      money(s.duePayable) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>待结款(元)</span><b>' +
      money(s.pendingSettle) +
      '</b></div>' +
      '<div class="sa-sbiz-cell"><span>已结款(元)</span><b>' +
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
    else if (state.tab === 'products') html = renderProducts(data);
    else if (state.tab === 'refunds') html = renderRefunds(data);
    else if (state.tab === 'fulfill') html = renderFulfill(data);
    else if (state.tab === 'settle') html = renderSettle(data);
    else html = renderState('empty');
    host.innerHTML = html;
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
        state.sort = sort.value || 'paidGmv';
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
      '<option value="settle0">结款金额为零</option>' +
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
    /* 旧链接 tab=trends 回退总览 */
    try {
      var q = new URLSearchParams(location.search || '');
      var tabQ = q.get('tab');
      if (tabQ === 'trends') state.tab = 'overview';
      else if (tabQ === 'products' || tabQ === 'refunds' || tabQ === 'fulfill' || tabQ === 'settle' || tabQ === 'overview') {
        state.tab = tabQ;
      }
    } catch (e) {}
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
