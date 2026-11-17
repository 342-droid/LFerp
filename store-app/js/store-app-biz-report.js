/**
 * 丰银宝 · 经营总览交互（对齐设计稿）
 * - 佣金橙卡四格（待结／本月／年度／会员）
 * - 经营概览／顾客分析：右上角时间，点开底栏选择
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' },
    custRange: '30d',
    custCustom: { start: '', end: '' },
    trendMetric: 'paid',
    rangeTarget: 'ops'
  };

  var RANGE_LABEL = {
    today: '今日',
    yesterday: '昨天',
    '7d': '近七天',
    month: '本月',
    '30d': '近30天',
    custom: '自定义'
  };

  var OPS_RANGES = [
    { id: 'today', name: '今日' },
    { id: 'yesterday', name: '昨天' },
    { id: '7d', name: '近七天' },
    { id: 'month', name: '本月' },
    { id: 'custom', name: '自定义' }
  ];

  var CUST_RANGES = [
    { id: '7d', name: '近七天' },
    { id: '30d', name: '近30天' },
    { id: 'month', name: '本月' },
    { id: 'custom', name: '自定义' }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function D() {
    return window.StoreAppBizReportData;
  }

  function money(n) {
    return D() && D().money ? D().money(n) : Number(n || 0).toFixed(2);
  }

  /** 千分位用逗号；小数一律用 `.` */
  function groupThousands(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * @param {number} n
   * @param {{decimals?: boolean}} [opts] decimals=true 时固定两位小数（累计实付／剩余应付）
   */
  function fmtSnap(n, opts) {
    var v = Number(n) || 0;
    var needDec = !!(opts && opts.decimals) || Math.abs(v - Math.round(v)) >= 0.005;
    if (needDec) {
      var fixed = money(v);
      var parts = fixed.split('.');
      return groupThousands(parts[0]) + '.' + (parts[1] || '00');
    }
    return groupThousands(String(Math.round(v)));
  }

  function toast(msg) {
    var el = $('rptToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 2200);
  }

  function showSheet(title, bodyHtmlOrText, isHtml) {
    var sheet = $('rptSheet');
    if (!sheet) {
      toast(typeof bodyHtmlOrText === 'string' ? bodyHtmlOrText : title);
      return;
    }
    $('rptSheetTitle').textContent = title || '说明';
    var body = $('rptSheetBody');
    if (isHtml) body.innerHTML = bodyHtmlOrText;
    else body.textContent = bodyHtmlOrText || '';
    sheet.hidden = false;
  }

  function qs(params) {
    return Object.keys(params)
      .filter(function (k) {
        return params[k] != null && params[k] !== '';
      })
      .map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      })
      .join('&');
  }

  function commissionUrl(extra) {
    var p = Object.assign(
      {
        range: state.range === 'month' ? '30d' : state.range === '7d' ? '7d' : state.range,
        from: 'report'
      },
      extra || {}
    );
    if (state.range === 'custom') {
      p.range = 'custom';
      p.start = state.custom.start;
      p.end = state.custom.end;
    }
    return 'biz-commission.html?' + qs(p);
  }

  function deltaHtml(delta, prefix) {
    if (!delta) return '';
    var up = !!delta.up;
    var flat = !!delta.flat || Number(delta.abs) === 0;
    var cls = flat ? '' : up ? ' is-up' : ' is-down';
    var arrow = flat
      ? ''
      : up
        ? '<svg class="sa-rpt-delta__arrow" viewBox="0 0 10 10"><path d="M5 1.5v7M2.5 4L5 1.5 7.5 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg class="sa-rpt-delta__arrow" viewBox="0 0 10 10"><path d="M5 8.5v-7M2.5 6L5 8.5 7.5 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var pct = flat ? '持平' : Math.abs(Number(delta.pct) || 0) + '%';
    var absTxt = '';
    if (prefix) {
      var sign = flat ? '+' : up ? '+' : '-';
      var absVal = flat ? 0 : Math.abs(Number(delta.abs) || 0);
      absTxt =
        prefix +
        sign +
        (Number.isInteger(absVal) ? absVal : money(absVal));
    }
    return (
      (absTxt ? '<span>' + absTxt + '</span>' : '<span></span>') +
      '<span class="sa-rpt-delta' +
      cls +
      '">' +
      arrow +
      pct +
      '</span>'
    );
  }

  function deltaLine(delta, prefix) {
    if (!delta) return '';
    var up = !!delta.up;
    var flat = !!delta.flat || Number(delta.abs) === 0 || Number(delta.pct) === 0;
    if (flat) return '<span class="sa-rpt-cust__delta-txt">' + prefix + ' 持平</span>';
    var cls = up ? 'is-up' : 'is-down';
    var arrow = up ? '↑' : '↓';
    return (
      '<span class="sa-rpt-cust__delta-txt ' +
      cls +
      '">' +
      prefix +
      ' ' +
      arrow +
      Math.abs(Number(delta.pct) || 0) +
      '%</span>'
    );
  }

  /** 橙卡副文案：较昨日 +120／较上月 +8.5%／较去年 +120 */
  function heroFootAbs(prefix, delta) {
    if (!delta || delta.flat) return prefix + ' —';
    var sign = delta.up ? '+' : '-';
    return prefix + ' ' + sign + fmtSnap(Math.abs(Number(delta.abs) || 0));
  }

  function heroFootPct(prefix, delta) {
    if (!delta || delta.flat) return prefix + ' —';
    var sign = delta.up ? '+' : '-';
    return prefix + ' ' + sign + Math.abs(Number(delta.pct) || 0) + '%';
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
        String(p.label || '').replace(/</g, '') +
        '</text>';
    });
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML =
      grid +
      '<path d="' +
      path +
      '" fill="none" stroke="#FF6501" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      pts
        .map(function (p, i) {
          var x = xAt(i, pts.length);
          var y = yAt(Number(p.value) || 0);
          return (
            '<circle cx="' +
            x.toFixed(1) +
            '" cy="' +
            y.toFixed(1) +
            '" r="2.5" fill="#FF6501"/>'
          );
        })
        .join('') +
      labels;
  }

  function drawDonut(svg, newShare) {
    if (!svg) return;
    var n = Math.max(0, Math.min(100, Number(newShare) || 0));
    var r = 44;
    var c = 2 * Math.PI * r;
    var nLen = (n / 100) * c;
    var oLen = c - nLen;
    svg.innerHTML =
      '<circle cx="60" cy="60" r="' +
      r +
      '" fill="none" stroke="#e8eaef" stroke-width="12"/>' +
      '<circle cx="60" cy="60" r="' +
      r +
      '" fill="none" stroke="#0e76f5" stroke-width="12" stroke-dasharray="' +
      oLen +
      ' ' +
      c +
      '" transform="rotate(-90 60 60)"/>' +
      '<circle cx="60" cy="60" r="' +
      r +
      '" fill="none" stroke="#ff6501" stroke-width="12" stroke-dasharray="' +
      nLen +
      ' ' +
      c +
      '" stroke-dashoffset="' +
      -oLen +
      '" transform="rotate(-90 60 60)"/>';
  }

  function currentRangeValue(target) {
    return target === 'cust' ? state.custRange : state.range;
  }

  function currentCustom(target) {
    return target === 'cust' ? state.custCustom : state.custom;
  }

  function syncRangeLabels() {
    if ($('rptRangeLabel')) {
      $('rptRangeLabel').textContent =
        state.range === 'custom' && state.custom.start
          ? state.custom.start.slice(5) + '~' + (state.custom.end || '').slice(5)
          : RANGE_LABEL[state.range] || '今日';
    }
    if ($('rptCustRangeLabel')) {
      $('rptCustRangeLabel').textContent =
        state.custRange === 'custom' && state.custCustom.start
          ? state.custCustom.start.slice(5) + '~' + (state.custCustom.end || '').slice(5)
          : RANGE_LABEL[state.custRange] || '近30天';
    }
  }

  function closeRangeSheet() {
    var sheet = $('rptRangeSheet');
    if (sheet) sheet.hidden = true;
  }

  function openRangeSheet(target) {
    state.rangeTarget = target || 'ops';
    var sheet = $('rptRangeSheet');
    var list = $('rptRangeOptions');
    var custom = $('rptCustom');
    if (!sheet || !list) return;
    var opts = state.rangeTarget === 'cust' ? CUST_RANGES : OPS_RANGES;
    var cur = currentRangeValue(state.rangeTarget);
    var curCustom = currentCustom(state.rangeTarget);
    $('rptRangeSheetTitle').textContent = state.rangeTarget === 'cust' ? '顾客分析时间' : '经营概览时间';
    list.innerHTML = opts
      .map(function (o) {
        return (
          '<button type="button" class="sa-rpt-range__btn' +
          (o.id === cur ? ' is-active' : '') +
          '" data-pick-range="' +
          o.id +
          '" role="option">' +
          o.name +
          '</button>'
        );
      })
      .join('');
    if (custom) {
      custom.hidden = cur !== 'custom';
      if ($('rptCustomStart')) $('rptCustomStart').value = curCustom.start || (D() && D().DEMO_TODAY) || '';
      if ($('rptCustomEnd')) $('rptCustomEnd').value = curCustom.end || (D() && D().DEMO_TODAY) || '';
    }
    sheet.hidden = false;
  }

  function applyPickedRange(id) {
    var target = state.rangeTarget;
    if (id === 'custom') {
      var custom = $('rptCustom');
      if (custom) custom.hidden = false;
      listActive('custom');
      return;
    }
    if (target === 'cust') {
      state.custRange = id;
    } else {
      state.range = id;
    }
    closeRangeSheet();
    syncRangeLabels();
    render();
  }

  function listActive(id) {
    var list = $('rptRangeOptions');
    if (!list) return;
    list.querySelectorAll('[data-pick-range]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pick-range') === id);
    });
  }

  function render() {
    if (!D()) return;
    var ov = D().buildOverview(state.range, state.custom);
    var trend = D().buildTrend(state.range, state.custom, state.trendMetric);
    var cust = D().buildCustomers(state.custRange, state.custCustom);
    var cmpLabel = (ov.compare && ov.compare.label) || '较昨日';

    if ($('rptPendingSettle')) $('rptPendingSettle').textContent = fmtSnap(ov.hero.pendingSettle);
    if ($('rptPendingDelta')) {
      $('rptPendingDelta').textContent = heroFootAbs('较昨日', ov.hero.pendingSettleDelta);
    }
    if ($('rptMonthComm')) $('rptMonthComm').textContent = fmtSnap(ov.hero.monthCredited);
    if ($('rptMonthDelta')) {
      $('rptMonthDelta').textContent = heroFootPct('较上月', ov.hero.monthCreditedDelta);
    }
    if ($('rptYearComm')) $('rptYearComm').textContent = fmtSnap(ov.hero.yearCredited);
    if ($('rptYearDelta')) {
      $('rptYearDelta').textContent = heroFootAbs('较去年', ov.hero.yearCreditedDelta);
    }
    if ($('rptMembers')) $('rptMembers').textContent = fmtSnap(ov.hero.memberCount);
    if ($('rptMembersDelta')) {
      $('rptMembersDelta').textContent = heroFootAbs('较昨日', ov.hero.memberDelta);
    }

    syncRangeLabels();

    if ($('rptPaid')) $('rptPaid').textContent = fmtSnap(ov.trade.paidAmount);
    if ($('rptMainCnt')) $('rptMainCnt').textContent = fmtSnap(ov.trade.mainOrderCount);
    if ($('rptVerify')) $('rptVerify').textContent = fmtSnap(ov.trade.verifyCount);
    if ($('rptAov')) $('rptAov').textContent = ov.trade.aov == null ? '—' : fmtSnap(ov.trade.aov);

    if ($('rptPaidCmp')) $('rptPaidCmp').innerHTML = deltaHtml(ov.compare.paid, cmpLabel);
    if ($('rptOrdersCmp')) $('rptOrdersCmp').innerHTML = deltaHtml(ov.compare.orders, cmpLabel);
    if ($('rptVerifyCmp')) $('rptVerifyCmp').innerHTML = deltaHtml(ov.compare.verify, cmpLabel);
    if ($('rptAovCmp')) $('rptAovCmp').innerHTML = deltaHtml(ov.compare.aov, cmpLabel);

    drawLineChart($('rptTrendSvg'), $('rptTrendY'), trend.points);

    if ($('rptCustNew')) $('rptCustNew').textContent = String(cust.newCustomerCount);
    if ($('rptCustOld')) $('rptCustOld').textContent = String(cust.oldCustomerCount);
    if ($('rptCustNewShare')) $('rptCustNewShare').textContent = '占比 ' + cust.newShare + '%';
    if ($('rptCustOldShare')) $('rptCustOldShare').textContent = '占比 ' + cust.oldShare + '%';
    /* 环比文案强制跟右上角时段：近七天→较前7天（上下指标同一前缀） */
    var custCmp =
      (D().compareLabelForRange && D().compareLabelForRange(state.custRange)) ||
      cust.compareLabel ||
      '较上期';
    if ($('rptCustNewDelta')) $('rptCustNewDelta').innerHTML = deltaLine(cust.newDelta, custCmp);
    if ($('rptCustOldDelta')) $('rptCustOldDelta').innerHTML = deltaLine(cust.oldDelta, custCmp);
    if ($('rptRepurchaseRate')) $('rptRepurchaseRate').textContent = cust.repurchaseRate + '%';
    if ($('rptRepurchaseUsers')) $('rptRepurchaseUsers').textContent = String(cust.repurchaseUsers);
    if ($('rptLostMembers')) $('rptLostMembers').textContent = String(cust.lostMembers);
    if ($('rptRepurchaseRateDelta'))
      $('rptRepurchaseRateDelta').innerHTML = deltaLine(cust.repurchaseRateDelta, custCmp);
    if ($('rptRepurchaseUsersDelta'))
      $('rptRepurchaseUsersDelta').innerHTML = deltaLine(cust.repurchaseUsersDelta, custCmp);
    if ($('rptLostMembersDelta'))
      $('rptLostMembersDelta').innerHTML = deltaLine(cust.lostMembersDelta, custCmp);

    drawDonut($('rptDonutSvg'), cust.newShare);
    if ($('rptDonutCenter')) {
      $('rptDonutCenter').innerHTML =
        '<span>下单总人数</span><strong>' +
        groupThousands(String(cust.payUserCount)) +
        '</strong>';
    }

    if ($('rptAsOf')) {
      var nowLabel = (D().DEMO_TODAY || '') + ' 09:30';
      $('rptAsOf').textContent = '数据截至 ' + nowLabel;
    }

    var rbt = D().buildStoreRbt ? D().buildStoreRbt() : { hasRbt: false };
    var rbtCard = $('rptRbtCard');
    if (rbtCard) rbtCard.hidden = !rbt.hasRbt;
    if (rbt.hasRbt) {
      if ($('rptRbtAgreed')) $('rptRbtAgreed').textContent = fmtSnap(rbt.agreedPay);
      /* 累计实付／剩余应付固定两位小数，千分位用空格 */
      if ($('rptRbtPaid')) $('rptRbtPaid').textContent = fmtSnap(rbt.actualPay, { decimals: true });
      if ($('rptRbtRemain')) $('rptRbtRemain').textContent = fmtSnap(rbt.remainPay, { decimals: true });
      if ($('rptRbtStatus')) $('rptRbtStatus').textContent = rbt.status || '—';
      if ($('rptRbtCycle')) $('rptRbtCycle').textContent = rbt.paybackCycle || '—';
    }
  }

  function setActive(group, attr, value) {
    if (!group) return;
    group.querySelectorAll('[' + attr + ']').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === value);
    });
  }

  function bind() {
    document.querySelectorAll('[data-range-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openRangeSheet(btn.getAttribute('data-range-target'));
      });
    });

    var rangeSheet = $('rptRangeSheet');
    if (rangeSheet) {
      rangeSheet.addEventListener('click', function (e) {
        if (e.target === rangeSheet || e.target.closest('[data-close-range]')) {
          closeRangeSheet();
          return;
        }
        var pick = e.target.closest('[data-pick-range]');
        if (pick) {
          applyPickedRange(pick.getAttribute('data-pick-range'));
        }
      });
    }

    var apply = $('rptCustomApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var start = ($('rptCustomStart') && $('rptCustomStart').value) || '';
        var end = ($('rptCustomEnd') && $('rptCustomEnd').value) || '';
        if (!start || !end) {
          toast('请选择起止日期');
          return;
        }
        if (start > end) {
          toast('开始日期不能晚于结束日期');
          return;
        }
        if (state.rangeTarget === 'cust') {
          state.custRange = 'custom';
          state.custCustom = { start: start, end: end };
        } else {
          state.range = 'custom';
          state.custom = { start: start, end: end };
        }
        closeRangeSheet();
        syncRangeLabels();
        render();
      });
    }

    var trendSeg = $('rptTrendSeg');
    if (trendSeg) {
      trendSeg.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-metric]');
        if (!btn) return;
        state.trendMetric = btn.getAttribute('data-metric');
        setActive(trendSeg, 'data-metric', state.trendMetric);
        render();
      });
    }

    document.querySelectorAll('[data-tip]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var key = btn.getAttribute('data-tip');
        var ov = D().buildOverview(state.range, state.custom);
        var tips = (ov && ov.tips) || {};
        if (key === 'commission') showSheet('佣金说明', tips.commission || '');
        if (key === 'overview') showSheet('经营数据说明', tips.overview || '');
        if (key === 'overview-metrics') showSheet('经营概览指标', tips['overview-metrics'] || '');
        if (key === 'customers') showSheet('顾客分析', tips.customers || '');
        if (key === 'members') showSheet('会员数', tips.members || '本店会员人数。');
        if (key === 'repurchase') showSheet('复购说明', tips.repurchase || '');
        if (key === 'lost') showSheet('流失会员说明', tips.lost || '');
        if (key === 'rbt') showSheet('RBT 说明', tips.rbt || '');
        if (key === 'credited') showSheet('实际入账佣金', tips.credited || '');
        if (key === 'pending') showSheet('待结算佣金', (ov.commission && ov.commission.pendingSettleHint) || '');
      });
    });

    document.querySelectorAll('[data-drill]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var drill = btn.getAttribute('data-drill');
        if (drill === 'pending') {
          window.location.href = commissionUrl({ dim: 'order', settleStatus: '待结算' });
          return;
        }
        if (drill === 'credited') {
          window.location.href = commissionUrl({ dim: 'credit', range: '30d' });
          return;
        }
        if (drill === 'rbt') {
          window.location.href = 'biz-rbt.html';
          return;
        }
        if (drill === 'paid' || drill === 'orders') {
          window.location.href =
            'biz-commission.html?from=report&dim=order&' +
            qs({
              range:
                state.range === 'custom'
                  ? 'custom'
                  : state.range === 'month'
                    ? '30d'
                    : state.range === '7d'
                      ? '7d'
                      : state.range,
              start: state.custom.start,
              end: state.custom.end
            });
          return;
        }
        window.location.href = commissionUrl({ dim: 'order' });
      });
    });

    var sheet = $('rptSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.closest('[data-close-sheet]')) {
          sheet.hidden = true;
        }
      });
    }

    document.querySelectorAll('[data-sa-toast]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toast(btn.getAttribute('data-sa-toast') || '演示中');
      });
    });
  }

  function init() {
    var today = D() && D().DEMO_TODAY;
    if (today) {
      state.custom = { start: today, end: today };
      state.custCustom = { start: today, end: today };
    }
    bind();
    syncRangeLabels();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
