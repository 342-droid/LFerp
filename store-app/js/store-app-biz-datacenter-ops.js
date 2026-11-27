/**
 * 门店数据中心 · 经营数据（横向 Tab 真切换）
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' },
    view: 'pay',
    channel: 'all',
    tab: 'retail',
    showTrendData: false,
    openDd: ''
  };
  var TABS = ['retail', 'proxy', 'income'];
  var VIEW_LABELS = { pay: '支付订单归属', event: '发生日期' };
  var SOURCE_LABELS = { all: '全部来源', mall: '商城', live: '直播' };

  function $(id) {
    return document.getElementById(id);
  }
  function D() {
    return window.StoreAppBizDataCenter;
  }
  function S() {
    return window.StoreAppBizDcState;
  }
  function closeDropdowns() {
    state.openDd = '';
    document.querySelectorAll('.sa-dc-dd.is-open').forEach(function (el) {
      el.classList.remove('is-open');
      var btn = el.querySelector('.sa-dc-dd__btn');
      var menu = el.querySelector('.sa-dc-dd__menu');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
    });
  }
  function openDropdown(name) {
    closeDropdowns();
    var root = document.querySelector('.sa-dc-dd[data-dd="' + name + '"]');
    if (!root || root.hidden) return;
    state.openDd = name;
    root.classList.add('is-open');
    var btn = root.querySelector('.sa-dc-dd__btn');
    var menu = root.querySelector('.sa-dc-dd__menu');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (menu) menu.hidden = false;
  }
  function markDdOptions(menu, attr, value) {
    if (!menu) return;
    menu.querySelectorAll('.sa-dc-dd__opt').forEach(function (opt) {
      var on = opt.getAttribute(attr) === value;
      opt.classList.toggle('is-selected', on);
      opt.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  function syncRetailDd() {
    if ($('opsViewLabel')) {
      $('opsViewLabel').textContent = VIEW_LABELS[state.view] || VIEW_LABELS.pay;
    }
    if ($('opsChannelLabel')) {
      $('opsChannelLabel').textContent = SOURCE_LABELS[state.channel] || SOURCE_LABELS.all;
    }
    markDdOptions($('opsViewMenu'), 'data-view', state.view);
    markDdOptions($('opsChannelMenu'), 'data-channel', state.channel);
  }
  function group(n) {
    if (n == null || n === '') return '—';
    var v = Number(n) || 0;
    if (Math.abs(v - Math.round(v)) < 0.005) {
      return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    var f = D().money(v).split('.');
    return f[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + f[1];
  }

  function drawChart(svg, yEl, xEl, wrap, pts, color) {
    if (!svg || !wrap) return;
    color = color || '#ff6501';
    var vals = (pts || []).map(function (p) {
      return Number(p.value) || 0;
    });
    var nonzero = vals.filter(function (v) {
      return v > 0;
    });
    if (!vals.length || !nonzero.length) {
      wrap.classList.add('is-empty');
      svg.innerHTML = '';
      if (yEl) yEl.innerHTML = '';
      if (xEl) xEl.innerHTML = '<span class="sa-dc-empty sa-dc-empty--compact">本时段暂无趋势</span>';
      return;
    }
    wrap.classList.remove('is-empty');
    var max = Math.max.apply(null, vals.concat([1]));
    var w = 289;
    var single = nonzero.length === 1;
    var h = single ? 64 : 88;
    var pad = 8;
    wrap.classList.toggle('is-single', single);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var grid = '';
    for (var g = 0; g < 3; g++) {
      var gy = pad + ((h - pad * 2) * g) / 2;
      grid +=
        '<line x1="' +
        pad +
        '" y1="' +
        gy.toFixed(1) +
        '" x2="' +
        (w - pad) +
        '" y2="' +
        gy.toFixed(1) +
        '" stroke="#f1f2f5" stroke-width="1"/>';
    }
    if (single) {
      var only = vals.indexOf(nonzero[0]);
      var bw = 22;
      var x = w / 2 - bw / 2;
      var barH = Math.max(8, (nonzero[0] / max) * (h - pad * 2));
      var y = h - pad - barH;
      svg.innerHTML =
        grid +
        '<rect x="' +
        x +
        '" y="' +
        y +
        '" width="' +
        bw +
        '" height="' +
        barH +
        '" rx="3" fill="' +
        color +
        '"/>';
      if (xEl) {
        xEl.innerHTML =
          '<span></span><span>' +
          ((pts[only] && pts[only].label) || '') +
          ' · ' +
          group(nonzero[0]) +
          '</span><span></span>';
      }
    } else {
      var step = vals.length <= 1 ? w / 2 : (w - pad * 2) / (vals.length - 1);
      var coords = vals.map(function (v, i) {
        return { x: pad + i * step, y: h - pad - (v / max) * (h - pad * 2) };
      });
      var line = coords
        .map(function (c, i) {
          return (i ? 'L' : 'M') + c.x.toFixed(1) + ' ' + c.y.toFixed(1);
        })
        .join(' ');
      svg.innerHTML =
        grid +
        '<path d="' +
        line +
        '" fill="none" stroke="' +
        color +
        '" stroke-width="1.8"/>';
      if (xEl) {
        xEl.innerHTML =
          '<span>' +
          ((pts[0] && pts[0].label) || '') +
          '</span><span>' +
          ((pts[pts.length - 1] && pts[pts.length - 1].label) || '') +
          '</span>';
      }
    }
    if (yEl) yEl.innerHTML = '<span>' + group(max) + '</span><span>0</span>';
  }

  function setTab(tab) {
    if (TABS.indexOf(tab) < 0) tab = 'retail';
    state.tab = tab;
    closeDropdowns();
    TABS.forEach(function (t) {
      var panel = $('panel-' + t);
      if (panel) panel.hidden = false;
    });
    document.querySelectorAll('#opsTabs [data-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    persist();
  }

  function persist() {
    if (!S()) return;
    var patch = {
      range: state.range,
      start: state.custom.start,
      end: state.custom.end,
      view: state.view,
      channel: state.channel,
      tab: state.tab
    };
    S().write(patch);
    /* URL：非零售不带 view/channel（一期不含POS，不再写 tp 参数） */
    S().pushUrl(
      {
        range: state.range,
        start: state.custom.start,
        end: state.custom.end,
        tab: state.tab,
        view: state.tab === 'retail' ? state.view : '',
        channel: state.tab === 'retail' ? state.channel : ''
      },
      'ops'
    );
  }

  function openCustom() {
    var sheet = $('opsRangeSheet');
    if (!sheet) return;
    var def = S().customDefaults(state.range, state.custom, function (r, c) {
      return D().resolveRange(r, c);
    });
    $('opsCustomStart').value = def.start || D().DEMO_TODAY;
    $('opsCustomEnd').value = def.end || D().DEMO_TODAY;
    if ($('opsCustomErr')) {
      $('opsCustomErr').hidden = true;
      $('opsCustomErr').textContent = '';
    }
    sheet.hidden = false;
  }

  function openTip() {
    var data = D().buildOpsDetail(state.range, state.custom, state.view, state.channel);
    var tips = data.tips || {};
    var sections = [];
    var title = '指标说明';
    if (state.tab === 'retail') {
      title = '营业额说明';
      sections.push({
        title: '营业额',
        items: [
          tips.retailTab || '',
          tips.viewPay || '',
          tips.viewEvent || '',
          '客单价＝营业额÷支付订单数。'
        ].filter(Boolean)
      });
    } else if (state.tab === 'proxy') {
      title = '采购支出说明';
      sections.push({
        title: '采购支出',
        items: [tips.proxy || '本店采购商品及运费支出，不计入营业额。'].filter(Boolean)
      });
    } else if (state.tab === 'income') {
      title = '佣金说明';
      sections.push({
        title: '佣金',
        items: [
          (data.income && data.income.tip) || '本店获得的佣金，以系统结算记录为准。'
        ].filter(Boolean)
      });
    }
    $('opsSheetTitle').textContent = title;
    $('opsSheetBody').innerHTML = S().tipBodyHtml(sections);
    $('opsSheet').hidden = false;
    if ($('opsSheetBody')) $('opsSheetBody').scrollTop = 0;
  }

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  /**
   * 衔接历史「工作台 → 客户订单」。历史页仅支持 tab 状态筛选，不支持报表日期／来源；
   * 仅传递 returnTo／可选 order，避免伪造成功筛选。差异见交付说明。
   */
  function orderHref(id) {
    var q = new URLSearchParams({
      tab: '全部',
      returnTo: location.pathname + location.search
    });
    if (id) q.set('order', id);
    return 'store-orders.html?' + q.toString();
  }
  function restockHref() {
    var q = new URLSearchParams({
      returnTo: location.pathname + location.search
    });
    return 'restock-orders.html?' + q.toString();
  }
  function orderStatusText(o) {
    if (o.orderStatus) return o.orderStatus;
    if (o.fulfillStatus && o.fulfillStatus !== '—') return o.fulfillStatus;
    return '已完成';
  }
  function aftersaleText(o) {
    if (o.aftersaleStatus) return o.aftersaleStatus;
    var refund = Number(o.refundGoods) || 0;
    if (refund <= 0) return '';
    var paid = Number(o.goodsPaid) || 0;
    return refund >= paid && paid > 0 ? '全额退款' : '部分退款';
  }
  function renderOrders(list) {
    var root = $('opsOrderTable');
    if (!root) return;
    if ($('opsAllOrders')) $('opsAllOrders').href = orderHref();
    var rows = list.slice().sort(function (a,b) {
      return b.payTime.localeCompare(a.payTime) || a.id.localeCompare(b.id);
    });
    root.innerHTML = rows.slice(0,5).map(function (o) {
      var goods = (o.goods || []).filter(function (g) { return !g.test; });
      var title = goods.length ? goods[0].name + (goods.length > 1 ? ' 等' + goods.length + '种商品' : '') : o.id;
      var status = orderStatusText(o);
      var aftersale = aftersaleText(o);
      var statusLine = aftersale
        ? '订单状态 ' + status + ' · 售后 ' + aftersale
        : '订单状态 ' + status;
      return '<a class="sa-dc-list-row" style="color:inherit;text-decoration:none" href="' + escapeHtml(orderHref(o.id)) + '"><div><div class="sa-dc-list-row__title">' +
        escapeHtml((o.channel === 'live' ? '直播' : '商城') + ' · ' + title) +
        '</div><div class="sa-dc-list-row__meta">支付 ' + escapeHtml(o.payTime.slice(0,16)) + ' · ' + escapeHtml(o.id) +
        '</div><div class="sa-dc-muted">' + escapeHtml(statusLine) +
        '</div></div><div class="sa-dc-list-amt"><small>实付</small> ' + group(o.goodsPaid) + '元</div></a>';
    }).join('') || '<div class="sa-dc-empty">该时段暂无符合条件的订单</div>';
    if (rows.length > 5) root.innerHTML += '<div class="sa-dc-muted">仅展示最近5笔，完整列表见客户订单</div>';
  }

  function render() {
    if (!D()) return;
    persist();
    if ($('opsBack')) $('opsBack').href = S().href('biz-center.html');
    if ($('opsToComm')) {
      $('opsToComm').href = S().href('biz-commission.html', {
        from: 'report',
        dim: 'pay',
        range: state.range,
        start: state.custom.start,
        end: state.custom.end
      });
    }

    var data = D().buildOpsDetail(state.range, state.custom, state.view, state.channel);
    if (S()) S().renderRangeStrip($('opsRanges'), state.range);
    if ($('opsPeriod')) {
      $('opsPeriod').textContent = S().periodCaption(
        data.bounds,
        ''
      );
    }
    syncRetailDd();
    document.querySelectorAll('#opsSourceTabs [data-source]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-source') === state.channel);
    });
    if ($('opsAsOf')) {
      $('opsAsOf').hidden = false;
      $('opsAsOf').textContent = S().updatedCaption(data.updatedAt || D().UPDATED_AT);
    }

    var r = data.retail;
    if ($('opsPaidLabel')) $('opsPaidLabel').textContent = '营业额（元）';
    if ($('opsPaid')) $('opsPaid').textContent = group(r.paidAmount);
    if ($('opsOrders')) $('opsOrders').textContent = group(r.orderCount);
    if ($('opsUsers')) $('opsUsers').textContent = group(r.payUserCount);
    if ($('opsAov')) $('opsAov').textContent = r.aov == null ? '—' : group(r.aov);
    if ($('opsRefund')) $('opsRefund').textContent = group(r.refundAmount);
    if ($('opsNet')) $('opsNet').textContent = group(r.netPaidAmount);

    var trend = D().buildTrend(data.bounds, 'paid', state.channel);
    drawChart($('opsTrendSvg'), $('opsTrendY'), $('opsTrendX'), $('opsTrendWrap'), trend.points);
    var tbtn = $('opsTrendDataBtn');
    var ttable = $('opsTrendTable');
    if (tbtn && ttable) {
      tbtn.hidden = !(trend.points || []).length;
      ttable.hidden = !state.showTrendData;
      tbtn.textContent = state.showTrendData ? '收起数据' : '查看数据';
      if (state.showTrendData) {
        ttable.innerHTML =
          '<table><thead><tr><th>时间</th><th>成交额</th></tr></thead><tbody>' +
          trend.points
            .map(function (p) {
              return '<tr><td>' + p.label + '</td><td>' + group(p.value) + '</td></tr>';
            })
            .join('') +
          '</tbody></table>';
      }
    }
    renderOrders(D().listRetailOrders(data.bounds, state.channel, state.view));

    var px = data.proxy;
    if ($('opsPxGoods')) $('opsPxGoods').textContent = group(px.goodsPaid);
    if ($('opsPxFreight')) $('opsPxFreight').textContent = group(px.freightPaid);
    if ($('opsPxTotal')) $('opsPxTotal').textContent = group(px.totalPaid);
    if ($('opsPxOrders')) $('opsPxOrders').textContent = group(px.orderCount);
    if ($('opsPxGRefund')) $('opsPxGRefund').textContent = group(px.goodsRefund);
    if ($('opsPxFRefund')) $('opsPxFRefund').textContent = group(px.freightRefund);
    if ($('opsPxInfo')) {
      $('opsPxInfo').innerHTML =
        '<span>本期最近进货日 <strong>' +
        (px.periodLastPurchaseDay || px.lastPurchaseDay || '—') +
        '</strong></span><span>本期进货天数 <strong>' +
        group(px.purchaseDays) +
        '</strong></span><span>平均进货间隔 <strong>' +
        (px.avgGapDays == null ? '—' : px.avgGapDays + ' 天') +
        '</strong></span>' +
        (px.lastPurchaseDayAll
          ? '<span>最近一次进货（全部历史） <strong>' + px.lastPurchaseDayAll + '</strong></span>'
          : '');
    }
    var pxTrend = D().buildTrend(data.bounds, 'proxy', 'all');
    drawChart(
      $('opsPxTrendSvg'),
      $('opsPxTrendY'),
      $('opsPxTrendX'),
      $('opsPxTrendWrap'),
      pxTrend.points,
      '#0e76f5'
    );
    if ($('opsAllProxyOrders')) $('opsAllProxyOrders').href = restockHref();
    var pt = $('opsProxyTable');
    if (pt) {
      var proxyRows = (px.orders || []).slice().sort(function (a, b) {
        return String(b.payTime || '').localeCompare(String(a.payTime || '')) || String(a.id).localeCompare(String(b.id));
      });
      pt.innerHTML = proxyRows.length
        ? proxyRows.slice(0, 5).map(function (o) {
            var goodsAmt = Number(o.goodsPaid) || 0;
            var freight = Number(o.freightPaid) || 0;
            var total = Math.round((goodsAmt + freight) * 100) / 100;
            var goodsNames = (o.goods || []).map(function (g) { return g.name; }).filter(Boolean);
            var title = goodsNames.length
              ? goodsNames[0] + (goodsNames.length > 1 ? ' 等' + goodsNames.length + '种商品' : '')
              : o.goodsSummary || o.id;
            var status = o.orderStatus || '已支付';
            return (
              '<a class="sa-dc-list-row sa-dc-list-row--proxy" style="color:inherit;text-decoration:none" href="' +
              escapeHtml(restockHref()) +
              '"><div class="sa-dc-list-row__main"><div class="sa-dc-list-row__title">' +
              escapeHtml(title) +
              '</div><div class="sa-dc-list-row__meta">支付 ' +
              escapeHtml((o.payTime || '').slice(0, 16)) +
              ' · ' +
              escapeHtml(o.id) +
              '</div><div class="sa-dc-muted">订单状态 ' +
              escapeHtml(status) +
              '</div></div><div class="sa-dc-list-amt"><small>支付总额</small> ' +
              group(total) +
              '元</div></a>'
            );
          }).join('') + (proxyRows.length > 5 ? '<div class="sa-dc-muted">仅展示最近5笔，汇总与趋势仍按全部符合条件订单计算</div>' : '')
        : '<div class="sa-dc-empty">本时段暂无进货订单</div>';
    }

    if ($('opsIncome')) {
      $('opsIncome').innerHTML = group(data.income.amount) + '<span class="sa-dc-hero__unit">元</span>';
    }
    if ($('opsIncomePending')) $('opsIncomePending').textContent = group(data.income.pending);
    if ($('opsIncomeSettled')) $('opsIncomeSettled').textContent = group(data.income.settled);
    if ($('opsIncomeCmp')) {
      var d = data.income.delta;
      var pct = d.pct == null ? '—' : (d.pct > 0 ? '+' : '') + d.pct + '%';
      var cls = d.flat ? '' : d.up ? ' is-up' : ' is-down';
      $('opsIncomeCmp').innerHTML =
        '<span class="sa-dc-delta' +
        cls +
        '"><span class="sa-dc-delta__line">' +
        data.compareLabel +
        ' ' +
        (d.flat ? '' : d.up ? '+' : '-') +
        group(Math.abs(d.abs)) +
        ' ' +
        (d.flat ? '' : d.up ? '↑' : '↓') +
        '</span><span class="sa-dc-delta__line">' +
        pct +
        '</span></span>';
    }
    var by = data.income.byChannel || { mall: 0, live: 0 };
    if ($('opsIncomeSplit')) {
      $('opsIncomeSplit').innerHTML =
        '<div class="sa-dc-split__cell"><span>商城佣金</span><strong>' +
        group(by.mall) +
        '</strong></div><div class="sa-dc-split__cell"><span>直播佣金</span><strong>' +
        group(by.live) +
        '</strong></div>';
    }
    var incTrend = D().buildTrend(data.bounds, 'income', 'all');
    drawChart(
      $('opsIncTrendSvg'),
      $('opsIncTrendY'),
      $('opsIncTrendX'),
      $('opsIncTrendWrap'),
      incTrend.points
    );
  }

  function bind() {
    if ($('opsSourceTabs')) $('opsSourceTabs').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-source]');
      if (!btn) return;
      state.channel = btn.getAttribute('data-source');
      render();
    });
    document.querySelectorAll('#opsTabs [data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-tab'));
        render();
      });
    });
    if ($('opsRanges')) {
      $('opsRanges').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
        closeDropdowns();
        var id = btn.getAttribute('data-range');
        if (id === 'custom') {
          openCustom();
          return;
        }
        state.range = id;
        state.custom = { start: '', end: '' };
        render();
      });
    }
    if ($('opsRangeSheet')) {
      $('opsRangeSheet').addEventListener('click', function (e) {
        if (e.target === $('opsRangeSheet') || e.target.closest('[data-close-range]')) {
          $('opsRangeSheet').hidden = true;
        }
      });
    }
    if ($('opsCustomApply')) {
      $('opsCustomApply').addEventListener('click', function () {
        var a = $('opsCustomStart').value;
        var b = $('opsCustomEnd').value;
        var err = $('opsCustomErr');
        if (!a || !b) {
          if (err) {
            err.hidden = false;
            err.textContent = '请选择开始和结束日期';
          }
          return;
        }
        if (a > b) {
          if (err) {
            err.hidden = false;
            err.textContent = '开始日期不能晚于结束日期';
          }
          return;
        }
        if (err) err.hidden = true;
        state.range = 'custom';
        state.custom = { start: a, end: b };
        $('opsRangeSheet').hidden = true;
        render();
      });
    }
    document.addEventListener('click', function (e) {
      var opt = e.target.closest('.sa-dc-dd__opt');
      if (opt) {
        if (opt.hasAttribute('data-view')) {
          state.view = opt.getAttribute('data-view');
          closeDropdowns();
          render();
          return;
        }
        if (opt.hasAttribute('data-channel')) {
          state.channel = opt.getAttribute('data-channel');
          closeDropdowns();
          render();
          return;
        }
      }
      var ddBtn = e.target.closest('.sa-dc-dd__btn');
      if (ddBtn) {
        var dd = ddBtn.closest('.sa-dc-dd');
        var name = dd && dd.getAttribute('data-dd');
        if (!name) return;
        e.preventDefault();
        if (state.openDd === name) closeDropdowns();
        else openDropdown(name);
        return;
      }
      if (!e.target.closest('.sa-dc-dd')) closeDropdowns();
      var row = e.target.closest('[data-expand]');
      if (row) row.classList.toggle('is-open');
    });
    if ($('opsTrendDataBtn')) {
      $('opsTrendDataBtn').addEventListener('click', function () {
        state.showTrendData = !state.showTrendData;
        render();
      });
    }
    document.querySelectorAll('[data-tip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeDropdowns();
        openTip();
      });
    });
    if ($('opsSheet')) {
      $('opsSheet').addEventListener('click', function (e) {
        if (e.target === $('opsSheet') || e.target.closest('[data-close-sheet]')) {
          $('opsSheet').hidden = true;
        }
      });
    }
  }

  function init() {
    var f = S() ? S().merge('ops') : {};
    state.range = S().normalizeRange(f.range || 'today');
    state.custom = { start: f.start || '', end: f.end || '' };
    state.view = 'pay';
    state.channel = f.channel === 'mall' || f.channel === 'live' ? f.channel : 'all';
    /* 一期不含POS：旧链接 tab=tp 等未知 Tab 一律回退平台零售 */
    state.tab = S().normalizeTab(f.tab || f.section || 'retail') || 'retail';
    if (TABS.indexOf(state.tab) < 0) state.tab = 'retail';
    if (window.StoreAppBizSession && StoreAppBizSession.boot) StoreAppBizSession.boot({});
    window.addEventListener('pagehide', function () { sessionStorage.setItem('bizOpsScroll', String(document.querySelector('.sa-rpt-scroll') ? document.querySelector('.sa-rpt-scroll').scrollTop : window.scrollY)); });
    bind();
    setTab(state.tab);
    render();
    window.addEventListener('pageshow', function () {
      var y = Number(sessionStorage.getItem('bizOpsScroll')) || 0;
      var scroller = document.querySelector('.sa-rpt-scroll');
      requestAnimationFrame(function () { if (scroller) scroller.scrollTop = y; else window.scrollTo(0,y); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
