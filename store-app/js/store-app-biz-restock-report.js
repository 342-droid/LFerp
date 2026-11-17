/**
 * 丰银宝 · 进货概况（对齐经营参谋视觉）
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function D() {
    return window.StoreAppBizReportData;
  }

  function money(n) {
    return D() && D().money ? D().money(n) : Number(n || 0).toFixed(2);
  }

  function fmt(n) {
    var v = Number(n) || 0;
    if (Math.abs(v - Math.round(v)) < 0.001) {
      return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return money(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    var el = $('rrToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1800);
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
        String(p.label).replace(/</g, '') +
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
            '" r="3.2" fill="#fff" stroke="#FF6501" stroke-width="1.5"/>'
          );
        })
        .join('') +
      labels;
  }

  function render() {
    if (!D()) return;
    var data = D().buildRestock(state.range, state.custom);
    if ($('rrUpdated')) $('rrUpdated').textContent = data.updatedAt;
    if ($('rrNetPaid')) $('rrNetPaid').textContent = fmt(data.netPaid != null ? data.netPaid : data.paidAmount);
    if ($('rrPaid')) $('rrPaid').textContent = fmt(data.paidAmount);
    if ($('rrRefundHero')) $('rrRefundHero').textContent = fmt(data.refundAmount);
    if ($('rrOrderCnt')) $('rrOrderCnt').textContent = String(data.mainOrderCount || 0);
    if ($('rrNetHint')) {
      $('rrNetHint').textContent =
        '实际支出＝进货支出 ' +
        fmt(data.paidAmount) +
        ' − 本期退款 ' +
        fmt(data.refundAmount);
    }
    if ($('rrRefund')) $('rrRefund').textContent = fmt(data.refundAmount);
    if ($('rrRefundGoods')) $('rrRefundGoods').textContent = fmt(data.refundGoods);
    if ($('rrRefundFreight')) $('rrRefundFreight').textContent = fmt(data.refundFreight);

    drawLineChart($('rrTrendSvg'), $('rrTrendY'), data.trend);

    var rank = $('rrGoodsRank');
    if (!rank) return;
    if (!data.goodsRank.length) {
      rank.innerHTML = '<div class="sa-rpt-empty">暂无进货商品</div>';
    } else {
      rank.innerHTML = data.goodsRank
        .slice(0, 8)
        .map(function (it, idx) {
          return (
            '<div class="sa-rpt-rank__row">' +
            '<span class="sa-rpt-rank__idx' +
            (idx < 3 ? ' is-top' : '') +
            '">' +
            (idx + 1) +
            '</span>' +
            '<img class="sa-rpt-rank__img" src="' +
            esc(it.img) +
            '" alt="">' +
            '<div class="sa-rpt-rank__main"><div class="sa-rpt-rank__name">' +
            esc(it.name) +
            '</div><div class="sa-rpt-rank__meta">数量 ' +
            it.qty +
            '</div></div>' +
            '<div class="sa-rpt-rank__val">¥' +
            fmt(it.paid) +
            '</div></div>'
          );
        })
        .join('');
    }

    var list = $('rrOrderList');
    if (!list) return;
    if (!data.orders.length) {
      list.innerHTML = '<div class="sa-rpt-empty">本统计期暂无进货订单</div>';
      return;
    }
    list.innerHTML = data.orders
      .map(function (o) {
        var refund =
          Number(o.refundGoods) > 0 || Number(o.refundFreight) > 0
            ? '<div class="sa-rpt-oitem__refund">退货款 ¥' +
              fmt(o.refundGoods) +
              ' · 退运费 ¥' +
              fmt(o.refundFreight) +
              (o.refundTime ? ' · ' + esc(o.refundTime) : '') +
              '</div>'
            : '';
        return (
          '<article class="sa-rpt-oitem">' +
          '<div class="sa-rpt-oitem__hd">' +
          '<div class="sa-rpt-oitem__name">' +
          esc(o.supplierName) +
          '</div>' +
          '<div class="sa-rpt-oitem__amt">¥' +
          fmt(o.paid) +
          '</div>' +
          '</div>' +
          '<div class="sa-rpt-oitem__meta">' +
          '主单 ' +
          esc(o.mainOrderId) +
          ' · 子单 ' +
          esc((o.subOrderIds || []).join('、') || '-') +
          '<br>支付时间 ' +
          esc(o.payTime) +
          '<br>货款 ¥' +
          fmt(o.goodsPaid) +
          ' · 运费 ¥' +
          fmt(o.freightPaid) +
          '</div>' +
          '<div class="sa-rpt-oitem__pay">' +
          payMethodLine(o) +
          '</div>' +
          refund +
          '</article>'
        );
      })
      .join('');
  }

  /** 进货混合支付三腿：钱包货款 → 可提现余额 → 微信/支付宝 */
  function payMethodLine(o) {
    var pm = o.payMethods || {};
    var channel = pm.thirdPartyChannel || '微信/支付宝';
    var parts = [];
    if (Number(pm.goodsQuota) > 0) parts.push('钱包货款 ¥' + fmt(pm.goodsQuota));
    if (Number(pm.withdrawable) > 0) parts.push('可提现余额 ¥' + fmt(pm.withdrawable));
    if (Number(pm.thirdParty) > 0) parts.push(channel + ' ¥' + fmt(pm.thirdParty));
    if (!parts.length) {
      parts.push('钱包货款 ¥0 · 可提现余额 ¥0 · 微信/支付宝 ¥0');
    }
    return parts.join(' · ');
  }

  function setActive(group, attr, value) {
    if (!group) return;
    group.querySelectorAll('[' + attr + ']').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === value);
    });
  }

  function openCustomSheet() {
    var sheet = $('rrTimeSheet');
    var today = (D() && D().DEMO_TODAY) || '';
    if ($('rrCustomStart')) $('rrCustomStart').value = state.custom.start || today;
    if ($('rrCustomEnd')) $('rrCustomEnd').value = state.custom.end || today;
    if ($('rrCustomErr')) {
      $('rrCustomErr').hidden = true;
      $('rrCustomErr').textContent = '';
    }
    if (sheet) sheet.hidden = false;
  }

  function closeCustomSheet() {
    var sheet = $('rrTimeSheet');
    if (sheet) sheet.hidden = true;
  }

  function bind() {
    var range = $('rrRange');
    if (range) {
      range.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
        var next = btn.getAttribute('data-range');
        if (next === 'custom') {
          openCustomSheet();
          return;
        }
        state.range = next;
        setActive(range, 'data-range', state.range);
        render();
      });
    }

    var sheet = $('rrTimeSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.closest('[data-close-rr-time]')) {
          closeCustomSheet();
        }
      });
    }

    var apply = $('rrCustomApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var start = ($('rrCustomStart') && $('rrCustomStart').value) || '';
        var end = ($('rrCustomEnd') && $('rrCustomEnd').value) || '';
        var err = $('rrCustomErr');
        if (!start || !end) {
          if (err) {
            err.hidden = false;
            err.textContent = '请选择完整的起止日期';
          } else {
            toast('请选择起止日期');
          }
          return;
        }
        if (start > end) {
          if (err) {
            err.hidden = false;
            err.textContent = '开始日期不能晚于结束日期';
          } else {
            toast('开始日期不能晚于结束日期');
          }
          return;
        }
        state.custom = { start: start, end: end };
        state.range = 'custom';
        setActive($('rrRange'), 'data-range', 'custom');
        closeCustomSheet();
        render();
      });
    }
  }

  function init() {
    var today = D() && D().DEMO_TODAY;
    if (today) {
      if ($('rrCustomStart')) $('rrCustomStart').value = today;
      if ($('rrCustomEnd')) $('rrCustomEnd').value = today;
    }
    var params = new URLSearchParams(location.search);
    if (params.get('range')) state.range = params.get('range');
    if (params.get('start')) state.custom.start = params.get('start');
    if (params.get('end')) state.custom.end = params.get('end');
    if (window.StoreAppBizSession && typeof window.StoreAppBizSession.boot === 'function') {
      window.StoreAppBizSession.boot();
    }
    /* BD 不开放进货概况：会话层会重定向到总览 */
    if (
      window.StoreAppBizSession &&
      window.StoreAppBizSession.isBd &&
      window.StoreAppBizSession.isBd()
    ) {
      return;
    }
    bind();
    setActive($('rrRange'), 'data-range', state.range);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
