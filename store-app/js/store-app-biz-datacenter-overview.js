/**
 * 门店数据中心 · 总览
 */
(function () {
  var SCROLL_KEY = 'sa_biz_dc_overview_scroll_v1';
  var CHANNEL_COLORS = [
    '#ff5a5f',
    '#ff8a3d',
    '#f5c542',
    '#3ecfcf',
    '#4b9bff',
    '#7b6cff',
    '#c56bff',
    '#ff6b9d',
    '#36cfc9',
    '#faad14'
  ];
  var state = {
    range: 'today',
    custom: { start: '', end: '' },
    trendMetric: 'revenue',
    showTrendData: false,
    scrollRestored: false,
  };

  function $(id) {
    return document.getElementById(id);
  }
  function D() {
    return window.StoreAppBizDataCenter;
  }
  function S() {
    return window.StoreAppBizDcState;
  }
  function scrollRoot() {
    return $('dcScroll') || document.querySelector('.sa-rpt-scroll');
  }
  function saveScroll() {
    var el = scrollRoot();
    if (!el) return;
    try {
      sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop || 0));
    } catch (e) {
      /* ignore */
    }
  }
  function restoreScroll() {
    if (state.scrollRestored) return;
    var el = scrollRoot();
    if (!el) return;
    var y = 0;
    try {
      y = Number(sessionStorage.getItem(SCROLL_KEY) || '');
    } catch (e) {
      y = 0;
    }
    if (!y || isNaN(y) || y < 1) {
      state.scrollRestored = true;
      return;
    }
    state.scrollRestored = true;
    requestAnimationFrame(function () {
      el.scrollTop = y;
      setTimeout(function () {
        el.scrollTop = y;
      }, 0);
    });
  }
  function group(n) {
    var v = Number(n) || 0;
    if (Math.abs(v - Math.round(v)) < 0.005) {
      return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    var f = D().money(v).split('.');
    return f[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + f[1];
  }
  function toast(msg) {
    var el = $('dcToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 2000);
  }

  function deltaHtml(d, label) {
    if (!d) return '<span class="sa-dc-delta">暂无可比数据</span>';
    var tag = label || '环比';
    var abs = group(Math.abs(d.abs));
    var sign = d.flat ? '' : d.up ? '+' : '-';
    var line1 = d.flat ? tag + '持平' : tag + ' ' + sign + abs + '元';
    var zeroBase = d.zeroBase || (d.pct == null && d.comparable === false) || (d.pct == null && !d.flat && d.abs != null);
    /* comparable=false 且 prev=0：datacenter-data 用 pct=null */
    if (d.pct == null && !d.flat && Number(d.abs) !== 0) zeroBase = true;
    var line2 = zeroBase
      ? '对比期为0'
      : d.pct == null
        ? '暂无可比数据'
        : d.flat
          ? '0%'
          : sign + Math.abs(d.pct) + '%';
    var cls = d.flat ? '' : d.up ? ' is-up' : ' is-down';
    return (
      '<span class="sa-dc-delta' +
      cls +
      '"><span class="sa-dc-delta__line">' +
      line1 +
      '</span><span class="sa-dc-delta__line">' +
      line2 +
      '</span></span>'
    );
  }

  function drawChart(svg, yEl, xEl, wrap, pts) {
    if (!svg || !wrap) return;
    var vals = (pts || []).map(function (p) {
      return Number(p.value) || 0;
    });
    var nonzero = vals.filter(function (v) {
      return v > 0;
    });
    if (!vals.length || !nonzero.length) {
      wrap.classList.add('is-empty');
      wrap.classList.remove('is-single');
      svg.innerHTML = '';
      if (yEl) yEl.innerHTML = '';
      if (xEl) xEl.innerHTML = '<span class="sa-dc-empty sa-dc-empty--compact">本时段暂无趋势数据</span>';
      return;
    }
    wrap.classList.remove('is-empty');
    var max = Math.max.apply(null, vals.concat([1]));
    var w = 289;
    var h = nonzero.length === 1 ? 64 : 88;
    var pad = 8;
    var n = vals.length;
    wrap.classList.toggle('is-single', nonzero.length === 1);
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

    if (nonzero.length === 1) {
      var only = vals.indexOf(nonzero[0]);
      var bw = 22;
      var x = w / 2 - bw / 2;
      var barH = Math.max(8, (nonzero[0] / max) * (h - pad * 2));
      var y = h - pad - barH;
      svg.innerHTML =
        grid +
        '<rect x="' +
        x.toFixed(1) +
        '" y="' +
        y.toFixed(1) +
        '" width="' +
        bw +
        '" height="' +
        barH.toFixed(1) +
        '" rx="3" fill="#ff6501"/>';
      if (xEl) {
        xEl.innerHTML =
          '<span></span><span>' +
          ((pts[only] && pts[only].label) || '') +
          ' · ' +
          group(nonzero[0]) +
          '</span><span></span>';
      }
    } else {
      var step = n <= 1 ? w / 2 : (w - pad * 2) / (n - 1);
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
        '" fill="none" stroke="#ff6501" stroke-width="1.8"/>';
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

  function syncLinks() {
    if (!S()) return;
    /* 顶栏「佣金明细」沿用自身筛选；指标下钻强制支付归属口径并带当前日期 */
    if ($('dcCommLink')) $('dcCommLink').href = S().href('biz-commission.html', { from: 'report' });
    if ($('dcToCommMetric')) {
      $('dcToCommMetric').href = S().href('biz-commission.html', {
        from: 'report',
        dim: 'pay',
        range: state.range,
        start: state.range === 'custom' ? state.custom.start : '',
        end: state.range === 'custom' ? state.custom.end : ''
      });
    }
    if ($('dcToOps')) $('dcToOps').href = S().href('biz-ops.html', { tab: 'retail' });
    if ($('dcToOperate')) $('dcToOperate').href = S().href('biz-operate.html', { tab: 'customers' });
    if ($('dcToProxy')) $('dcToProxy').href = S().href('biz-ops.html', { tab: 'proxy' });
  }

  function persist() {
    if (!S()) return;
    S().pushUrl(
      {
        range: state.range,
        start: state.custom.start,
        end: state.custom.end
      },
      'center'
    );
  }

  function syncRangeUi() {
    if (S()) S().renderRangeStrip($('dcRanges'), state.range);
  }

  function channelUsable(ch) {
    return ch && ch.status !== 'pending' && ch.status !== 'missing' && ch.amount != null;
  }

  /** 全部渠道：展开到叶子（一期仅商城／直播） */
  function slicesAllChannels(list) {
    var out = [];
    (list || []).forEach(function (ch) {
      var leaves = ch.children && ch.children.length ? ch.children : [ch];
      leaves.forEach(function (c) {
        if (!channelUsable(c)) return;
        out.push({
          id: c.id,
          name: c.name,
          amount: Number(c.amount) || 0,
          status: c.status
        });
      });
    });
    return out;
  }

  /**
   * 业务线渠道（一期不含POS）：商城、零售（直播）
   * 与「全部渠道」同为平台零售拆分，仅名称口径不同。
   */
  function slicesBusinessLine(list) {
    var mall = { id: 'mall', name: '商城', amount: 0, status: 'missing' };
    var retail = { id: 'retail', name: '零售（直播）', amount: 0, status: 'missing' };
    (list || []).forEach(function (ch) {
      if (ch.id !== 'platformRetail') return;
      (ch.children || []).forEach(function (c) {
        if (c.id === 'mall') {
          mall.status = c.status;
          if (channelUsable(c)) mall.amount = Number(c.amount) || 0;
        }
        if (c.id === 'live') {
          retail.status = c.status;
          if (channelUsable(c)) retail.amount = Number(c.amount) || 0;
        }
      });
    });
    return [mall, retail].filter(function (s) {
      return s.status !== 'pending' && s.status !== 'missing';
    });
  }

  function polar(cx, cy, r, deg) {
    var a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function donutSlicePath(cx, cy, rOut, rIn, startDeg, endDeg) {
    if (endDeg - startDeg >= 359.99) {
      return (
        'M ' +
        (cx + rOut) +
        ' ' +
        cy +
        ' A ' +
        rOut +
        ' ' +
        rOut +
        ' 0 1 1 ' +
        (cx - rOut) +
        ' ' +
        cy +
        ' A ' +
        rOut +
        ' ' +
        rOut +
        ' 0 1 1 ' +
        (cx + rOut) +
        ' ' +
        cy +
        ' M ' +
        (cx + rIn) +
        ' ' +
        cy +
        ' A ' +
        rIn +
        ' ' +
        rIn +
        ' 0 1 0 ' +
        (cx - rIn) +
        ' ' +
        cy +
        ' A ' +
        rIn +
        ' ' +
        rIn +
        ' 0 1 0 ' +
        (cx + rIn) +
        ' ' +
        cy +
        ' Z'
      );
    }
    var large = endDeg - startDeg > 180 ? 1 : 0;
    var o1 = polar(cx, cy, rOut, startDeg);
    var o2 = polar(cx, cy, rOut, endDeg);
    var i2 = polar(cx, cy, rIn, endDeg);
    var i1 = polar(cx, cy, rIn, startDeg);
    return (
      'M ' +
      o1.x.toFixed(2) +
      ' ' +
      o1.y.toFixed(2) +
      ' A ' +
      rOut +
      ' ' +
      rOut +
      ' 0 ' +
      large +
      ' 1 ' +
      o2.x.toFixed(2) +
      ' ' +
      o2.y.toFixed(2) +
      ' L ' +
      i2.x.toFixed(2) +
      ' ' +
      i2.y.toFixed(2) +
      ' A ' +
      rIn +
      ' ' +
      rIn +
      ' 0 ' +
      large +
      ' 0 ' +
      i1.x.toFixed(2) +
      ' ' +
      i1.y.toFixed(2) +
      ' Z'
    );
  }

  function renderChannels(list) {
    var root = $('dcChannelBody');
    if (!root) return;
    /* 固定展示商城／直播，按订单来源统计；不再提供业务线／全部渠道切换 */
    var slices = slicesAllChannels(list);
    var total = 0;
    slices.forEach(function (s) {
      total = D().round2(total + (Number(s.amount) || 0));
    });

    var head = '<div class="sa-dc-channel__hd"><span>营业额渠道构成</span></div>';

    if (!slices.length || total <= 0) {
      root.innerHTML =
        head + '<div class="sa-dc-empty sa-dc-empty--compact">本时段暂无渠道成交额</div>';
      return;
    }

    /* 一期仅商城／直播：紧凑占比条，避免环形图占屏过高 */
    var rows = slices
      .map(function (s, i) {
        var amt = Number(s.amount) || 0;
        var pct = total > 0 ? D().round2((amt / total) * 100) : 0;
        var color = CHANNEL_COLORS[i % CHANNEL_COLORS.length];
        var width = Math.max(pct, pct > 0 ? 2 : 0);
        return (
          '<div class="sa-dc-channel-bar">' +
          '<div class="sa-dc-channel-bar__hd">' +
          '<span class="sa-dc-channel-bar__name"><i class="sa-dc-channel__dot" style="background:' +
          color +
          '"></i>' +
          s.name +
          '</span>' +
          '<span class="sa-dc-channel-bar__pct">' +
          pct +
          '%</span></div>' +
          '<div class="sa-dc-channel-bar__track"><i style="width:' +
          width +
          '%;background:' +
          color +
          '"></i></div>' +
          '<div class="sa-dc-channel-bar__amt">' +
          group(amt) +
          '<span class="sa-dc-hero__unit">元</span></div></div>'
        );
      })
      .join('');

    root.innerHTML = head + '<div class="sa-dc-channel-bars">' + rows + '</div>';
  }

  function render() {
    if (!D()) return;
    persist();
    syncLinks();
    syncRangeUi();
    var ov = D().buildOverview(state.range, state.custom);
    if ($('dcPeriod')) {
      $('dcPeriod').textContent = S().periodCaption(
        ov.bounds,
        ov.compareLabel,
        ov.compareRange
      );
    }
    if ($('dcAsOf')) {
      $('dcAsOf').hidden = false;
      $('dcAsOf').textContent = S().updatedCaption(ov.updatedAt || D().UPDATED_AT);
    }
    var rev = ov.revenue || {};
    if ($('dcHeroTitle')) $('dcHeroTitle').textContent = rev.heroTitle || '支付成交额';
    if ($('dcCoverNote')) {
      if (rev.partial && rev.coverNote) {
        $('dcCoverNote').hidden = false;
        $('dcCoverNote').textContent = rev.coverNote;
      } else {
        $('dcCoverNote').hidden = true;
        $('dcCoverNote').textContent = '';
      }
    }
    if ($('dcPaid')) {
      $('dcPaid').innerHTML = group(rev.amount) + '<span class="sa-dc-hero__unit">元</span>';
    }
    if ($('dcPaidCmp')) $('dcPaidCmp').innerHTML = deltaHtml(rev.amountDelta, ov.compareLabel);
    if ($('dcRefund')) $('dcRefund').textContent = group(rev.refundAmount);
    if ($('dcRefundCmp')) $('dcRefundCmp').innerHTML = deltaHtml(rev.refundDelta, ov.compareLabel);
    if ($('dcNet')) $('dcNet').textContent = group(rev.netAmount);
    if ($('dcNetCmp')) $('dcNetCmp').innerHTML = deltaHtml(rev.netDelta, ov.compareLabel);
    if ($('dcIncome')) $('dcIncome').textContent = group(ov.retail.storeIncome);
    if ($('dcIncomeCmp')) $('dcIncomeCmp').innerHTML = deltaHtml(ov.retail.incomeDelta, ov.compareLabel);
    renderChannels(rev.channels || []);

    if ($('dcPayUsers')) $('dcPayUsers').textContent = group(ov.customers.payUserCount);
    if ($('dcFirst')) $('dcFirst').textContent = group(ov.customers.firstBuyCount);
    if ($('dcOld')) $('dcOld').textContent = group(ov.customers.oldBuyCount);
    if ($('dcMulti')) $('dcMulti').textContent = group(ov.customers.multiBuyCount);

    var px = ov.proxy;
    if ($('dcProxySummary')) {
      $('dcProxySummary').innerHTML =
        '<div class="sa-dc-grid sa-dc-grid--2">' +
        '<div class="sa-dc-metric"><div class="sa-dc-metric__t">进货支付总额（元）</div><div class="sa-dc-metric__v">' +
        group(px.totalPaid) +
        '</div></div>' +
        '<div class="sa-dc-metric"><div class="sa-dc-metric__t">进货订单数（单）</div><div class="sa-dc-metric__v">' +
        group(px.orderCount) +
        '</div></div></div>';
    }

    var metric =
      state.trendMetric === 'users'
        ? 'payUsers'
        : state.trendMetric === 'revenueNet'
          ? 'revenueNet'
          : state.trendMetric === 'revenueRefund'
            ? 'revenueRefund'
            : 'revenue';
    if ($('dcTrendUnit')) {
      $('dcTrendUnit').textContent = metric === 'payUsers' ? '单位：人' : '单位：元';
    }
    var trend = D().buildTrend(ov.bounds, metric, 'all');
    drawChart($('dcTrendSvg'), $('dcTrendY'), $('dcTrendX'), $('dcTrendWrap'), trend.points);
    var btn = $('dcTrendDataBtn');
    var table = $('dcTrendTable');
    if (btn && table) {
      var has = (trend.points || []).length > 0;
      btn.hidden = !has;
      if (!has) state.showTrendData = false;
      table.hidden = !state.showTrendData;
      if (state.showTrendData) {
        table.innerHTML =
          '<table><thead><tr><th>时间</th><th>数值</th></tr></thead><tbody>' +
          trend.points
            .map(function (p) {
              return '<tr><td>' + p.label + '</td><td>' + group(p.value) + '</td></tr>';
            })
            .join('') +
          '</tbody></table>';
      }
      btn.textContent = state.showTrendData ? '收起数据' : '查看数据';
    }
    restoreScroll();
  }

  function openCustom() {
    var sheet = $('dcRangeSheet');
    if (!sheet) return;
    var def = S().customDefaults(state.range, state.custom, function (r, c) {
      return D().resolveRange(r, c);
    });
    $('dcCustomStart').value = def.start || D().DEMO_TODAY;
    $('dcCustomEnd').value = def.end || D().DEMO_TODAY;
    if ($('dcCustomErr')) {
      $('dcCustomErr').hidden = true;
      $('dcCustomErr').textContent = '';
    }
    sheet.hidden = false;
  }

  function bind() {
    if ($('dcRanges')) {
      $('dcRanges').addEventListener('click', function (e) {
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
    var sheet = $('dcRangeSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.closest('[data-close-range]')) sheet.hidden = true;
      });
    }
    if ($('dcCustomApply')) {
      $('dcCustomApply').addEventListener('click', function () {
        var a = $('dcCustomStart').value;
        var b = $('dcCustomEnd').value;
        var err = $('dcCustomErr');
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
        state.range = 'custom';
        state.custom = { start: a, end: b };
        $('dcRangeSheet').hidden = true;
        render();
      });
    }
    var metricRoot = $('dcTrendMetric');
    if (metricRoot) {
      metricRoot.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-metric]');
        if (!btn) return;
        state.trendMetric = btn.getAttribute('data-metric');
        metricRoot.querySelectorAll('[data-metric]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        render();
      });
    }
    if ($('dcTrendDataBtn')) {
      $('dcTrendDataBtn').addEventListener('click', function () {
        state.showTrendData = !state.showTrendData;
        render();
      });
    }
    document.querySelectorAll('[data-tip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ov = D().buildOverview(state.range, state.custom);
        var tip = ov.tips || {};
        var sections = [
          {
            title: '支付成交额',
            items: [tip.overview || '', tip.revenue || '', tip.retailPaid || ''].filter(Boolean)
          },
          {
            title: '佣金',
            items: [tip.storeIncome || ''].filter(Boolean)
          },
          {
            title: '采购支出',
            items: [tip.proxy || ''].filter(Boolean)
          }
        ];
        $('dcSheetTitle').textContent = '指标说明';
        $('dcSheetBody').innerHTML = S().tipBodyHtml(sections);
        $('dcSheet').hidden = false;
        if ($('dcSheetBody')) $('dcSheetBody').scrollTop = 0;
      });
    });
    var tipSheet = $('dcSheet');
    if (tipSheet) {
      tipSheet.addEventListener('click', function (e) {
        if (e.target === tipSheet || e.target.closest('[data-close-sheet]')) tipSheet.hidden = true;
      });
    }
    document.querySelectorAll('[data-sa-toast]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toast(btn.getAttribute('data-sa-toast'));
      });
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (/biz-(ops|operate|commission)/i.test(href)) saveScroll();
    });
    window.addEventListener('pagehide', saveScroll);
    window.addEventListener('pageshow', function () {
      state.scrollRestored = false;
      restoreScroll();
    });
  }

  function init() {
    var f = S() ? S().merge('center') : {};
    state.range = S().normalizeRange(f.range || 'today');
    state.custom = { start: f.start || '', end: f.end || '' };
    if (window.StoreAppBizSession && StoreAppBizSession.boot) {
      StoreAppBizSession.boot({ toast: toast });
    }
    bind();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
