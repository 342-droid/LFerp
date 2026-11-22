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
    tpModule: '',
    tpChannel: 'all',
    showTrendData: false
  };
  var TABS = ['retail', 'proxy', 'income', 'tp'];

  function $(id) {
    return document.getElementById(id);
  }
  function D() {
    return window.StoreAppBizDataCenter;
  }
  function S() {
    return window.StoreAppBizDcState;
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
    TABS.forEach(function (t) {
      var panel = $('panel-' + t);
      if (panel) panel.hidden = t !== tab;
    });
    document.querySelectorAll('#opsTabs [data-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    persist();
  }

  function renderTp() {
    var bounds = D().resolveRange(state.range, state.custom);
    var tp = D().thirdPartyMetrics(bounds, state.tpModule, state.tpChannel);
    var emptyEl = $('opsTpEmpty');
    var contentEl = $('opsTpContent');
    if (!tp.connected || !(tp.modules && tp.modules.length)) {
      if (emptyEl) emptyEl.hidden = false;
      if (contentEl) contentEl.hidden = true;
      state.tpModule = '';
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    if (contentEl) contentEl.hidden = false;

    state.tpModule = tp.activeModule.id;
    state.tpChannel = tp.takeoutChannel || 'all';

    var mods = $('opsTpModules');
    if (mods) {
      mods.innerHTML = tp.modules
        .map(function (m) {
          return (
            '<button type="button" class="sa-dc-subtabs__btn' +
            (m.id === state.tpModule ? ' is-active' : '') +
            '" data-tp-module="' +
            m.id +
            '" role="tab">' +
            m.name +
            '</button>'
          );
        })
        .join('');
    }

    var chWrap = $('opsTpChannelWrap');
    var chRoot = $('opsTpChannels');
    /* 外卖渠道仅外卖模块展示；堂食／团购／储值必须隐藏 */
    if (tp.activeModule.id === 'takeout' && tp.activeModule.channels && tp.activeModule.channels.length) {
      if (chWrap) {
        chWrap.hidden = false;
        chWrap.setAttribute('aria-hidden', 'false');
      }
      if (chRoot) {
        chRoot.innerHTML =
          '<button type="button" class="sa-dc-subtabs__btn' +
          (state.tpChannel === 'all' ? ' is-active' : '') +
          '" data-tp-channel="all">全部</button>' +
          tp.activeModule.channels
            .map(function (c) {
              return (
                '<button type="button" class="sa-dc-subtabs__btn' +
                (state.tpChannel === c.id ? ' is-active' : '') +
                '" data-tp-channel="' +
                c.id +
                '">' +
                c.name +
                '</button>'
              );
            })
            .join('');
      }
    } else {
      if (chWrap) {
        chWrap.hidden = true;
        chWrap.setAttribute('aria-hidden', 'true');
      }
      if (chRoot) chRoot.innerHTML = '';
      state.tpChannel = 'all';
    }

    var label = $('opsTpAmountLabel');
    if (label) {
      label.textContent =
        tp.activeModule.name +
        (tp.activeModule.id === 'takeout' && state.tpChannel !== 'all'
          ? ' · ' +
            (tp.activeModule.channels.filter(function (c) {
              return c.id === state.tpChannel;
            })[0] || { name: '' }).name
          : '') +
        ' · 结算金额（元）';
    }
    if ($('opsTpAmount')) {
      $('opsTpAmount').textContent = tp.hasBills ? group(tp.amount) : '—';
    }

    var list = $('opsTpList');
    if (!list) return;
    if (!tp.hasBills) {
      list.innerHTML = '<div class="sa-dc-empty sa-dc-empty--compact">该时段暂无结算账单</div>';
      return;
    }
    list.innerHTML = tp.bills
      .map(function (b) {
        return (
          '<div class="sa-dc-tp-row"><div><div class="sa-dc-list-row__title">' +
          (b.channelName || b.moduleName) +
          '</div><div class="sa-dc-muted">结算周期 ' +
          b.cycleLabel +
          '</div></div><div class="sa-dc-tp-amt">' +
          group(b.amount) +
          '<span class="sa-dc-hero__unit">元</span></div></div>'
        );
      })
      .join('');
  }

  function persist() {
    if (!S()) return;
    var patch = {
      range: state.range,
      start: state.custom.start,
      end: state.custom.end,
      view: state.view,
      channel: state.channel,
      tab: state.tab,
      tpModule: state.tpModule,
      tpChannel: state.tpChannel
    };
    S().write(patch);
    /* URL 不携带隐藏模块筛选；空字符串表示从地址栏移除 */
    S().pushUrl(
      {
        range: state.range,
        start: state.custom.start,
        end: state.custom.end,
        tab: state.tab,
        view: state.tab === 'retail' ? state.view : '',
        channel: state.tab === 'retail' ? state.channel : '',
        tpModule: state.tab === 'tp' ? state.tpModule : '',
        tpChannel: state.tab === 'tp' ? state.tpChannel : ''
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
      title = '零售说明';
      sections.push({
        title: '零售成交',
        items: [
          tips.viewPay || '',
          tips.viewEvent || '',
          '支付成交额保留原支付金额，退款另列；客单价＝支付成交额÷支付订单数。'
        ].filter(Boolean)
      });
    } else if (state.tab === 'proxy') {
      title = '进货说明';
      sections.push({
        title: '代采进货',
        items: [
          '进货商品款、运费分开展示；进货支付总额＝商品款＋运费。',
          '商品退款、运费退款按各自成功退款时间归入统计周期。',
          '本期最近进货日、进货天数仅取所选周期内有效进货支付日（自然日去重）。',
          '公式：平均进货间隔＝（本期最近进货日－本期最早进货日）÷（本期进货天数－1）；少于 2 个进货日显示—。',
          '代采是采购支出，不进入第三方结算，不可与零售成交额相加作为营业额。',
          '「最近一次进货（全部历史）」另标，不与本期混用。'
        ]
      });
    } else if (state.tab === 'income') {
      title = '佣金说明';
      sections.push({
        title: '佣金',
        items: [data.income && data.income.tip ? data.income.tip : ''].filter(Boolean)
      });
    } else {
      title = '第三方结算说明';
      sections.push({
        title: '第三方结算',
        items: [tips.thirdParty || ''].filter(Boolean)
      });
    }
    $('opsSheetTitle').textContent = title;
    $('opsSheetBody').innerHTML = S().tipBodyHtml(sections, D().DATA_SOURCE_NOTE || '');
    $('opsSheet').hidden = false;
  }

  function renderOrders(list) {
    var root = $('opsOrderTable');
    if (!root) return;
    if (!list.length) {
      root.innerHTML = '<div class="sa-dc-empty">暂无订单</div>';
      return;
    }
    root.innerHTML = list
      .slice(0, 30)
      .map(function (o) {
        var goods = (o.goods || [])
          .filter(function (g) {
            return !g.test;
          })
          .map(function (g) {
            return g.name;
          })
          .join('、');
        var comm = o.commissionConfigured === false || o.commission == null ? '—' : group(o.commission);
        return (
          '<div class="sa-dc-list-row" data-expand>' +
          '<div><div class="sa-dc-list-row__title">' +
          (o.channel === 'live' ? '直播' : '商城') +
          ' · ' +
          (goods || o.id) +
          '</div><div class="sa-dc-list-row__meta">' +
          (o.payTime || '').slice(0, 16) +
          ' · ' +
          o.id +
          '</div><div class="sa-dc-list-row__detail">实付 ' +
          group(o.goodsPaid) +
          ' · 退款 ' +
          group(o.refundGoods || 0) +
          ' · 佣金 ' +
          comm +
          ' · ' +
          (o.settleStatus || '') +
          '</div></div>' +
          '<div class="sa-dc-list-amt">' +
          group(o.goodsPaid) +
          '</div></div>'
        );
      })
      .join('');
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
        data.compareLabel,
        data.compareRange
      );
    }
    if ($('opsAsOf')) {
      $('opsAsOf').hidden = false;
      $('opsAsOf').textContent = S().updatedCaption(data.updatedAt || D().UPDATED_AT);
    }

    var r = data.retail;
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
    renderOrders(r.orders || []);

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
    var pt = $('opsProxyTable');
    if (pt) {
      pt.innerHTML = (px.orders || []).length
        ? px.orders
            .map(function (o) {
              var goods = Number(o.goodsPaid) || 0;
              var freight = Number(o.freightPaid) || 0;
              var total = Math.round((goods + freight) * 100) / 100;
              return (
                '<div class="sa-dc-list-row sa-dc-list-row--proxy">' +
                '<div class="sa-dc-list-row__main">' +
                '<div class="sa-dc-list-row__title">' +
                o.id +
                '</div>' +
                '<div class="sa-dc-list-row__meta">' +
                (o.payTime || '').slice(0, 16) +
                '</div></div>' +
                '<div class="sa-dc-list-amts" aria-label="金额明细">' +
                '<div class="sa-dc-list-amts__row"><span>商品款</span><em>' +
                group(goods) +
                '<i>元</i></em></div>' +
                '<div class="sa-dc-list-amts__row"><span>运费</span><em>' +
                group(freight) +
                '<i>元</i></em></div>' +
                '<div class="sa-dc-list-amts__row is-total"><span>支付总额</span><em>' +
                group(total) +
                '<i>元</i></em></div>' +
                '</div></div>'
              );
            })
            .join('')
        : '<div class="sa-dc-empty">本时段暂无代采</div>';
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

    renderTp();
  }

  function bind() {
    document.querySelectorAll('#opsTabs [data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-tab'));
        render();
      });
    });
    if ($('opsTpModules')) {
      $('opsTpModules').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-tp-module]');
        if (!btn) return;
        state.tpModule = btn.getAttribute('data-tp-module');
        state.tpChannel = 'all';
        render();
      });
    }
    if ($('opsTpChannels')) {
      $('opsTpChannels').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-tp-channel]');
        if (!btn) return;
        state.tpChannel = btn.getAttribute('data-tp-channel');
        render();
      });
    }
    if ($('opsRanges')) {
      $('opsRanges').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
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
    function seg(id, attr, key) {
      var root = $(id);
      if (!root) return;
      root.addEventListener('click', function (e) {
        var btn = e.target.closest('[' + attr + ']');
        if (!btn) return;
        state[key] = btn.getAttribute(attr);
        root.querySelectorAll('[' + attr + ']').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        render();
      });
    }
    seg('opsViewSeg', 'data-view', 'view');
    seg('opsChannelSeg', 'data-channel', 'channel');
    if ($('opsTrendDataBtn')) {
      $('opsTrendDataBtn').addEventListener('click', function () {
        state.showTrendData = !state.showTrendData;
        render();
      });
    }
    document.addEventListener('click', function (e) {
      var row = e.target.closest('[data-expand]');
      if (!row) return;
      row.classList.toggle('is-open');
    });
    document.querySelectorAll('[data-tip]').forEach(function (btn) {
      btn.addEventListener('click', openTip);
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
    state.view = f.view || 'pay';
    state.channel = f.channel || 'all';
    state.tpModule = f.tpModule || '';
    state.tpChannel = f.tpChannel || 'all';
    state.tab = S().normalizeTab(f.tab || f.section || 'retail') || 'retail';
    if (TABS.indexOf(state.tab) < 0) state.tab = 'retail';
    if (window.StoreAppBizSession && StoreAppBizSession.boot) StoreAppBizSession.boot({});
    bind();
    document.querySelectorAll('#opsViewSeg [data-view]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-view') === state.view);
    });
    document.querySelectorAll('#opsChannelSeg [data-channel]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-channel') === state.channel);
    });
    setTab(state.tab);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
