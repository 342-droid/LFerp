/**
 * 门店数据中心 · 总览
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' },
    trendMetric: 'paid',
    showTrendData: false
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
    if (!d) return '';
    var abs = group(Math.abs(d.abs));
    var sign = d.flat ? '' : d.up ? '+' : '-';
    var pct = d.pct == null ? '—' : (d.pct > 0 ? '+' : '') + d.pct + '%';
    var arrow = d.flat ? '' : d.up ? '↑' : '↓';
    var cls = d.flat ? '' : d.up ? ' is-up' : ' is-down';
    return (
      '<span class="sa-dc-delta' +
      cls +
      '"><span class="sa-dc-delta__line">' +
      (label || '较对比期') +
      ' ' +
      sign +
      abs +
      ' ' +
      arrow +
      '</span><span class="sa-dc-delta__line">' +
      pct +
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
    if ($('dcCommLink')) $('dcCommLink').href = S().href('biz-commission.html', { from: 'report' });
    if ($('dcToOps')) $('dcToOps').href = S().href('biz-ops.html', { tab: 'retail' });
    if ($('dcToOperate')) $('dcToOperate').href = S().href('biz-operate.html', { tab: 'customers' });
    if ($('dcToOperate2')) $('dcToOperate2').href = S().href('biz-operate.html', { tab: 'customers' });
    if ($('dcToProxy')) $('dcToProxy').href = S().href('biz-ops.html', { tab: 'proxy' });
    if ($('dcToTp')) $('dcToTp').href = S().href('biz-ops.html', { tab: 'tp' });
    document.querySelectorAll('#dcTpBody [data-tp-mod]').forEach(function (a) {
      a.href = S().href('biz-ops.html', {
        tab: 'tp',
        tpModule: a.getAttribute('data-tp-mod'),
        tpChannel: 'all'
      });
    });
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
    if ($('dcPaid')) {
      $('dcPaid').innerHTML = group(ov.retail.paidAmount) + '<span class="sa-dc-hero__unit">元</span>';
    }
    if ($('dcPaidCmp')) $('dcPaidCmp').innerHTML = deltaHtml(ov.retail.paidDelta, ov.compareLabel);
    if ($('dcOrders')) $('dcOrders').textContent = group(ov.retail.orderCount);
    if ($('dcOrdersCmp')) $('dcOrdersCmp').innerHTML = deltaHtml(ov.retail.orderDelta, ov.compareLabel);
    if ($('dcAov')) $('dcAov').textContent = ov.retail.aov == null ? '—' : group(ov.retail.aov);
    if ($('dcAovCmp')) $('dcAovCmp').innerHTML = deltaHtml(ov.retail.aovDelta, ov.compareLabel);
    if ($('dcIncome')) $('dcIncome').textContent = group(ov.retail.storeIncome);
    if ($('dcIncomeCmp')) $('dcIncomeCmp').innerHTML = deltaHtml(ov.retail.incomeDelta, ov.compareLabel);

    if ($('dcPayUsers')) $('dcPayUsers').textContent = group(ov.customers.payUserCount);
    if ($('dcFirst')) $('dcFirst').textContent = group(ov.customers.firstBuyCount);
    if ($('dcOld')) $('dcOld').textContent = group(ov.customers.oldBuyCount);
    if ($('dcMulti')) $('dcMulti').textContent = group(ov.customers.multiBuyCount);

    var tp = ov.thirdParty;
    var tpBody = $('dcTpBody');
    if (tpBody) {
      if (!tp.connected || !(tp.modules && tp.modules.length)) {
        tpBody.innerHTML =
          '<div class="sa-dc-empty sa-dc-empty--compact">暂无第三方结算数据</div>';
      } else {
        tpBody.innerHTML = tp.modules
          .map(function (m) {
            var amt =
              m.hasBills && m.amount != null
                ? '结算金额 ' + group(m.amount) + ' 元'
                : '该时段暂无结算账单';
            return (
              '<div class="sa-dc-sum-row"><div><div class="sa-dc-sum-row__t">' +
              m.name +
              '</div><div class="sa-dc-muted">' +
              amt +
              '</div></div><a class="sa-dc-link" data-tp-mod="' +
              m.id +
              '" href="#">详情</a></div>'
            );
          })
          .join('');
        tpBody.querySelectorAll('[data-tp-mod]').forEach(function (a) {
          a.href = S().href('biz-ops.html', {
            tab: 'tp',
            tpModule: a.getAttribute('data-tp-mod'),
            tpChannel: 'all'
          });
        });
      }
      syncLinks();
    }

    var px = ov.proxy;
    if ($('dcProxySummary')) {
      $('dcProxySummary').innerHTML =
        '进货商品款 <strong>' +
        group(px.goodsPaid) +
        '</strong> 元 · 运费 <strong>' +
        group(px.freightPaid) +
        '</strong> 元<br>进货支付总额 <strong>' +
        group(px.totalPaid) +
        '</strong> 元 · ' +
        px.orderCount +
        ' 单<br>本期最近进货日 <strong>' +
        (px.periodLastPurchaseDay || px.lastPurchaseDay || '—') +
        '</strong>' +
        (px.purchaseDays != null
          ? ' · 进货天数 <strong>' + group(px.purchaseDays) + '</strong> 天'
          : '') +
        (px.avgGapDays != null
          ? '<br>平均进货间隔 <strong>' + px.avgGapDays + '</strong> 天'
          : '') +
        (px.lastPurchaseDayAll && px.lastPurchaseDayAll !== (px.periodLastPurchaseDay || px.lastPurchaseDay)
          ? '<br>最近一次进货（全部历史） <strong>' + px.lastPurchaseDayAll + '</strong>'
          : '');
    }

    var metric = state.trendMetric === 'users' ? 'payUsers' : 'paid';
    if ($('dcTrendUnit')) {
      $('dcTrendUnit').textContent = metric === 'paid' ? '单位：元' : '单位：人';
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
        var sections = [
          {
            title: '总览',
            items: [ov.tips.overview || '', ov.tips.retailPaid || '', ov.tips.storeIncome || ''].filter(Boolean)
          }
        ];
        var common = [ov.tips.thirdParty, ov.tips.proxy, D().DATA_SOURCE_NOTE]
          .filter(Boolean)
          .join('\n');
        $('dcSheetTitle').textContent = '总览说明';
        $('dcSheetBody').innerHTML = S().tipBodyHtml(sections, common);
        $('dcSheet').hidden = false;
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
    if ($('dcPaidHero')) {
      $('dcPaidHero').addEventListener('click', function () {
        location.href = S().href('biz-ops.html', { tab: 'retail' });
      });
    }
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
