/**
 * 门店数据中心 · 运营数据（横向 Tab 真切换）
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' },
    tab: 'customers',
    custMetric: 'payUsers',
    showCustData: false
  };
  var TABS = ['customers', 'freq', 'source'];
  var TAB_TITLE = {
    customers: '购买客户',
    freq: '购买频次',
    source: '来源表现'
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
  /** 金额统一两位小数 */
  function moneyGroup(n) {
    var f = D().money(n).split('.');
    return f[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + f[1];
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
        '" rx="3" fill="#0e76f5"/>';
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
        '" fill="none" stroke="#0e76f5" stroke-width="1.8"/>';
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

  function syncTabUi(tab) {
    TABS.forEach(function (t) {
      var panel = $('panel-' + t);
      if (panel) {
        panel.hidden = t !== tab;
        panel.setAttribute('aria-hidden', t !== tab ? 'true' : 'false');
      }
    });
    document.querySelectorAll('#opTabs [data-tab]').forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.setAttribute('tabindex', on ? '0' : '-1');
    });
  }

  function setTab(tab) {
    if (TABS.indexOf(tab) < 0) tab = 'customers';
    state.tab = tab;
    syncTabUi(tab);
    if (S()) {
      S().pushUrl(
        {
          range: state.range,
          start: state.custom.start,
          end: state.custom.end,
          tab: tab
        },
        'operate'
      );
    }
  }

  function persist() {
    if (!S()) return;
    S().pushUrl(
      {
        range: state.range,
        start: state.custom.start,
        end: state.custom.end,
        tab: state.tab
      },
      'operate'
    );
  }

  function openCustom() {
    var sheet = $('opRangeSheet');
    if (!sheet) return;
    var def = S().customDefaults(state.range, state.custom, function (r, c) {
      return D().resolveRange(r, c);
    });
    $('opCustomStart').value = def.start || D().DEMO_TODAY;
    $('opCustomEnd').value = def.end || D().DEMO_TODAY;
    if ($('opCustomErr')) {
      $('opCustomErr').hidden = true;
      $('opCustomErr').textContent = '';
    }
    sheet.hidden = false;
  }

  function openTip() {
    var data = D().buildOperateDetail(state.range, state.custom);
    var tips = data.tips || {};
    var sections = [];
    if (state.tab === 'customers') {
      sections.push({
        title: '购买客户',
        items: [
          '首购以当前门店为范围。',
          '首购客户：期初从未在本店购买、本期首次购买。',
          '老客户：期初已在本店购买且本期有购买。',
          '本期首次购买后再次购买仍属本期首购。',
          '公式：首购＋老客＝交易人数。',
          '客户换绑不迁移历史交易。'
        ]
      });
    } else if (state.tab === 'freq') {
      sections.push({
        title: '购买频次',
        items: [
          '购买2次及以上人数可同时含首购与老客，不与两者相加。',
          '公式：人均购买次数＝支付主订单数÷交易人数。',
          '不使用「复购率」。',
          '频次分布按本期支付主订单次数分档（1次／2次／3次及以上）。'
        ]
      });
    } else {
      sections.push({
        title: '来源表现',
        items: [
          '按订单实际来源划分（商城／直播）。',
          '同一顾客在商城和直播购买，合计人数只计1人。',
          '本店直播成交≠分享贡献。',
          '来源切换不改变基于本店历史的首购／老客身份。',
          '无支付订单时，客单价显示 —。'
        ]
      });
    }
    $('opSheetTitle').textContent = (TAB_TITLE[state.tab] || '指标') + '说明';
    $('opSheetBody').innerHTML = S().tipBodyHtml(sections, D().DATA_SOURCE_NOTE || tips.common || '');
    $('opSheet').hidden = false;
    syncTabUi(state.tab);
  }

  function render() {
    if (!D()) return;
    persist();
    syncTabUi(state.tab);
    if ($('opBack')) $('opBack').href = S().href('biz-center.html');
    var data = D().buildOperateDetail(state.range, state.custom);
    var c = data.customers;
    if (S()) S().renderRangeStrip($('opRanges'), state.range);
    if ($('opPeriod')) {
      /* 运营页各 Tab 主区均未展示增减结果，顶部只写统计日期 */
      $('opPeriod').textContent = S().periodDateCaption(data.bounds);
    }
    if ($('opAsOf')) {
      $('opAsOf').hidden = false;
      $('opAsOf').textContent = S().updatedCaption(data.updatedAt || D().UPDATED_AT);
    }
    if ($('opPayUsers')) $('opPayUsers').textContent = group(c.payUserCount);
    if ($('opFirst')) $('opFirst').textContent = group(c.firstBuyCount);
    if ($('opOld')) $('opOld').textContent = group(c.oldBuyCount);
    if ($('opOldShare')) {
      $('opOldShare').textContent = c.oldShare == null ? '—' : c.oldShare + '%';
    }
    if ($('opMulti')) $('opMulti').textContent = group(c.multiBuyCount);
    if ($('opMultiShare')) {
      $('opMultiShare').textContent = c.multiShare == null ? '—' : c.multiShare + '%';
    }
    if ($('opAvgOrders')) {
      $('opAvgOrders').textContent = c.avgOrders == null ? '—' : group(c.avgOrders);
    }

    var dist = c.freqDist;
    var maxD = Math.max(dist['1'], dist['2'], dist['3+'], 1);
    if ($('opFreqBars')) {
      $('opFreqBars').innerHTML = [
        { k: '购买1次', v: dist['1'] },
        { k: '购买2次', v: dist['2'] },
        { k: '购买3次及以上', v: dist['3+'] }
      ]
        .map(function (row) {
          var w = Math.round((row.v / maxD) * 100);
          return (
            '<div class="sa-dc-bar"><span>' +
            row.k +
            '</span><i style="width:' +
            w +
            '%"></i><em>' +
            row.v +
            ' 人</em></div>'
          );
        })
        .join('');
    }

    var mall = data.sources.mall;
    var live = data.sources.live;
    if ($('opSourceCards')) {
      function card(name, s) {
        var aovText =
          !s.orderCount || s.aov == null ? '—' : moneyGroup(s.aov);
        return (
          '<article class="sa-dc-source-card">' +
          '<h3 class="sa-dc-source-card__name">' +
          name +
          '</h3>' +
          '<div class="sa-dc-source-card__hero">' +
          '<div class="sa-dc-source-card__label">营业额（元）</div>' +
          '<div class="sa-dc-source-card__amt">' +
          moneyGroup(s.paidAmount) +
          '</div></div>' +
          '<div class="sa-dc-source-card__grid">' +
          '<div class="sa-dc-source-card__cell"><div class="sa-dc-source-card__t">支付订单数（单）</div><div class="sa-dc-source-card__v">' +
          group(s.orderCount) +
          '</div></div>' +
          '<div class="sa-dc-source-card__cell"><div class="sa-dc-source-card__t">交易人数（人）</div><div class="sa-dc-source-card__v">' +
          group(s.payUserCount) +
          '</div></div>' +
          '<div class="sa-dc-source-card__cell"><div class="sa-dc-source-card__t">客单价（元）</div><div class="sa-dc-source-card__v">' +
          aovText +
          '</div></div>' +
          '</div></article>'
        );
      }
      $('opSourceCards').innerHTML = card('商城', mall) + card('直播', live);
    }

    var custTrend = D().buildTrend(data.bounds, state.custMetric, 'all');
    drawChart(
      $('opCustTrendSvg'),
      $('opCustTrendY'),
      $('opCustTrendX'),
      $('opCustTrendWrap'),
      custTrend.points
    );
    var cbtn = $('opCustDataBtn');
    var ctable = $('opCustTrendTable');
    if (cbtn && ctable) {
      cbtn.hidden = !(custTrend.points || []).length;
      ctable.hidden = !state.showCustData;
      cbtn.textContent = state.showCustData ? '收起数据' : '查看数据';
      if (state.showCustData) {
        ctable.innerHTML =
          '<table><thead><tr><th>时间</th><th>数值</th></tr></thead><tbody>' +
          custTrend.points
            .map(function (p) {
              return '<tr><td>' + p.label + '</td><td>' + group(p.value) + '</td></tr>';
            })
            .join('') +
          '</tbody></table>';
      }
    }
  }

  function bind() {
    document.querySelectorAll('#opTabs [data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-tab'));
        render();
      });
    });
    if ($('opRanges')) {
      $('opRanges').addEventListener('click', function (e) {
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
    if ($('opRangeSheet')) {
      $('opRangeSheet').addEventListener('click', function (e) {
        if (e.target === $('opRangeSheet') || e.target.closest('[data-close-range]')) {
          $('opRangeSheet').hidden = true;
          syncTabUi(state.tab);
        }
      });
    }
    if ($('opCustomApply')) {
      $('opCustomApply').addEventListener('click', function () {
        var a = $('opCustomStart').value;
        var b = $('opCustomEnd').value;
        var err = $('opCustomErr');
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
        $('opRangeSheet').hidden = true;
        render();
      });
    }
    var seg = $('opCustTrendSeg');
    if (seg) {
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-metric]');
        if (!btn) return;
        state.custMetric = btn.getAttribute('data-metric');
        seg.querySelectorAll('[data-metric]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        render();
      });
    }
    if ($('opCustDataBtn')) {
      $('opCustDataBtn').addEventListener('click', function () {
        state.showCustData = !state.showCustData;
        render();
      });
    }
    document.querySelectorAll('[data-tip]').forEach(function (btn) {
      btn.addEventListener('click', openTip);
    });
    if ($('opSheet')) {
      $('opSheet').addEventListener('click', function (e) {
        if (e.target === $('opSheet') || e.target.closest('[data-close-sheet]')) {
          $('opSheet').hidden = true;
          syncTabUi(state.tab);
        }
      });
    }
  }

  function init() {
    var f = S() ? S().merge('operate') : {};
    state.range = S().normalizeRange(f.range || 'today');
    state.custom = { start: f.start || '', end: f.end || '' };
    state.tab = S().normalizeTab(f.tab || 'customers');
    if (TABS.indexOf(state.tab) < 0) state.tab = 'customers';
    if (window.StoreAppBizSession && StoreAppBizSession.boot) StoreAppBizSession.boot({});
    bind();
    setTab(state.tab);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
