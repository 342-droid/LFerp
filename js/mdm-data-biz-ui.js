/**
 * 平台数据中心 · 经营数据 · 页面公共 UI
 */
(function (global) {
  'use strict';
  var Biz = global.MdmDataBiz;
  if (!Biz) return;
  var wp = global.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function normalizePeriodKey(key) {
    /* 已废弃本周／本月；旧链接落到近7天／近30天 */
    if (key === 'week') return '7d';
    if (key === 'month') return '30d';
    if (key === 'today' || key === 'yesterday' || key === '7d' || key === '30d' || key === 'custom') {
      return key;
    }
    return 'today';
  }

  function readStateFromUrl(defaults) {
    var q = new URLSearchParams(window.location.search);
    var period = normalizePeriodKey(q.get('period') || defaults.period || 'today');
    return {
      period: period,
      view: q.get('view') || defaults.view || 'pay',
      channel: q.get('channel') || defaults.channel || 'all',
      line: q.get('line') || '',
      brand: q.get('brand') || '',
      coopType: q.get('coopType') || '',
      from: q.get('from') || '',
      to: q.get('to') || '',
      storeId: q.get('storeId') || '',
      sort: q.get('sort') || defaults.sort || 'retailPay',
      /* 平台所得排行业务范围：all | retail | proxy（与事业线筛选无关） */
      platScope: normalizePlatScope(q.get('platScope') || defaults.platScope || 'all'),
      trendMetric: q.get('trendMetric') || defaults.trendMetric || 'total',
      page: Math.max(1, Number(q.get('page') || defaults.page || 1) || 1),
      pageSize: normalizePageSize(q.get('pageSize') || defaults.pageSize || 10),
      q: q.get('q') || defaults.q || '',
      /* 详情返回来源：overview | stores（勿与自定义日期 from 混淆） */
      back: q.get('back') || defaults.back || ''
    };
  }

  function normalizePlatScope(v) {
    if (v === 'retail' || v === 'proxy' || v === 'all') return v;
    return 'all';
  }

  function normalizePageSize(v) {
    var n = Number(v);
    if (n === 20 || n === 50) return n;
    return 10;
  }

  function writeStateToUrl(state, keepKeys) {
    var q = new URLSearchParams(window.location.search);
    Object.keys(state).forEach(function (k) {
      if (keepKeys && keepKeys.indexOf(k) < 0) return;
      var v = state[k];
      /* platScope=all 仍写入，便于刷新／返回保留业务范围 */
      if (k === 'platScope') {
        if (v == null || v === '') q.delete(k);
        else q.set(k, String(v));
        return;
      }
      if (v == null || v === '' || v === 'all') q.delete(k);
      else q.set(k, String(v));
    });
    var qs = q.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    history.replaceState(null, '', url);
  }

  function renderToolbar(host, state, opts) {
    opts = opts || {};
    var periods = [
      { id: 'today', label: '今日' },
      { id: 'yesterday', label: '昨日' },
      { id: '7d', label: '近7天' },
      { id: '30d', label: '近30天' },
      { id: 'custom', label: '自定义' }
    ];
    var html =
      '<div class="ldb-demo-banner">演示数据 · 数据截止 ' +
      Biz.esc(Biz.AS_OF.replace('T', ' ').replace('+08:00', '')) +
      '（北京时间）</div>' +
      '<div class="ldb-toolbar">' +
      '<div class="ldb-field"><label>周期</label><div class="ldb-chips" data-ldb-periods>';
    periods.forEach(function (p) {
      html +=
        '<button type="button" class="ldb-chip' +
        (state.period === p.id ? ' is-active' : '') +
        '" data-period="' +
        p.id +
        '">' +
        p.label +
        '</button>';
    });
    html +=
      '</div></div>' +
      '<div class="ldb-custom' +
      (state.period === 'custom' ? ' is-open' : '') +
      '" data-ldb-custom>' +
      '<input class="ldb-input" type="date" data-from value="' +
      Biz.esc(state.from || '') +
      '">' +
      '<span>至</span>' +
      '<input class="ldb-input" type="date" data-to value="' +
      Biz.esc(state.to || '') +
      '">' +
      '<button type="button" class="btn btn-primary" data-apply-custom style="height:32px;padding:0 12px;">应用</button>' +
      '</div>';

    if (opts.showView !== false) {
      html +=
        '<div class="ldb-view-tabs" role="tablist">' +
        '<button type="button" class="' +
        (state.view === 'pay' ? 'is-active' : '') +
        '" data-view="pay">支付订单归属</button>' +
        '<button type="button" class="' +
        (state.view === 'event' ? 'is-active' : '') +
        '" data-view="event">发生日期</button>' +
        '</div>';
    }

    if (opts.showChannel) {
      html +=
        '<div class="ldb-field"><label>零售来源</label><div class="ldb-chips" data-ldb-channel>' +
        ['all|全部', 'mall|商城货架', 'live|直播']
          .map(function (x) {
            var p = x.split('|');
            return (
              '<button type="button" class="ldb-chip' +
              (state.channel === p[0] ? ' is-active' : '') +
              '" data-channel="' +
              p[0] +
              '">' +
              p[1] +
              '</button>'
            );
          })
          .join('') +
        '</div></div>';
    }

    if (opts.showStoreFilters) {
      html +=
        '<div class="ldb-field"><label>事业线</label><select class="ldb-select" data-filter="line">' +
        '<option value="">全部</option>' +
        Biz.lines()
          .map(function (l) {
            return (
              '<option value="' +
              Biz.esc(l) +
              '"' +
              (state.line === l ? ' selected' : '') +
              '>' +
              Biz.esc(l) +
              '</option>'
            );
          })
          .join('') +
        '</select></div>' +
        '<div class="ldb-field"><label>品牌</label><select class="ldb-select" data-filter="brand">' +
        '<option value="">全部</option>' +
        Biz.brands(state.line || '')
          .map(function (b) {
            return (
              '<option value="' +
              Biz.esc(b) +
              '"' +
              (state.brand === b ? ' selected' : '') +
              '>' +
              Biz.esc(b) +
              '</option>'
            );
          })
          .join('') +
        '</select></div>' +
        '<div class="ldb-field"><label>合作类型</label><select class="ldb-select" data-filter="coopType">' +
        ['', '加盟店', '联营店', '直营店']
          .map(function (c) {
            return (
              '<option value="' +
              c +
              '"' +
              (state.coopType === c ? ' selected' : '') +
              '>' +
              (c || '全部') +
              '</option>'
            );
          })
          .join('') +
        '</select></div>';
    }

    html +=
      '<div class="ldb-meta" data-ldb-meta></div>' +
      '<button type="button" class="btn btn-secondary" data-open-glossary style="height:32px;padding:0 12px;">指标释义</button>' +
      '</div>';

    host.innerHTML = html;
  }

  function bindToolbar(host, state, onChange) {
    host.querySelectorAll('[data-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.period = btn.getAttribute('data-period');
        onChange();
      });
    });
    host.querySelectorAll('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.view = btn.getAttribute('data-view');
        onChange();
      });
    });
    host.querySelectorAll('[data-channel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.channel = btn.getAttribute('data-channel');
        onChange();
      });
    });
    var apply = host.querySelector('[data-apply-custom]');
    if (apply) {
      apply.addEventListener('click', function () {
        state.from = (host.querySelector('[data-from]') || {}).value || '';
        state.to = (host.querySelector('[data-to]') || {}).value || '';
        state.period = 'custom';
        onChange();
      });
    }
    host.querySelectorAll('[data-filter]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        state[sel.getAttribute('data-filter')] = sel.value;
        if (sel.getAttribute('data-filter') === 'line') state.brand = '';
        onChange();
      });
    });
    var g = host.querySelector('[data-open-glossary]');
    if (g) g.addEventListener('click', openGlossary);
  }

  /**
   * KPI 卡片
   * opts 可为历史 clickKey 字符串，或 { clickKey, actionText, actionAttr, actionHtml }
   */
  function kpiCard(label, valueHtml, deltaHtml, hint, opts) {
    if (typeof opts === 'string') opts = { clickKey: opts };
    opts = opts || {};
    var clickKey = opts.clickKey || '';
    var actionHtml = opts.actionHtml || '';
    if (!actionHtml && opts.actionText) {
      actionHtml =
        '<a href="javascript:;" class="ldb-kpi__link"' +
        (opts.actionAttr ? ' ' + opts.actionAttr : '') +
        '>' +
        Biz.esc(opts.actionText) +
        '</a>';
    }
    return (
      '<div class="ldb-kpi' +
      (clickKey ? ' is-clickable' : '') +
      '"' +
      (clickKey ? ' data-drill="' + Biz.esc(clickKey) + '"' : '') +
      '>' +
      '<p class="ldb-kpi__label">' +
      Biz.esc(label) +
      '</p>' +
      '<p class="ldb-kpi__value">' +
      valueHtml +
      '</p>' +
      (deltaHtml ? '<p class="ldb-kpi__delta">' + deltaHtml + '</p>' : '') +
      (hint ? '<p class="ldb-kpi__hint">' + Biz.esc(hint) + '</p>' : '') +
      (actionHtml ? '<p class="ldb-kpi__action">' + actionHtml + '</p>' : '') +
      '</div>'
    );
  }

  function renderBars(series) {
    if (!series || !series.length) return '<div class="ldb-empty">暂无趋势数据</div>';
    var grain = series[0].grain || 'day';
    var max = Math.max.apply(
      null,
      series.map(function (x) {
        return x.value;
      }).concat([1])
    );
    return (
      '<div class="ldb-bars' +
      (grain === 'hour' ? ' ldb-bars--hour' : '') +
      '">' +
      series
        .map(function (x, i) {
          var h = x.value > 0 ? Math.max(4, Math.round((x.value / max) * 160)) : 2;
          var label =
            x.label ||
            (grain === 'hour'
              ? i % 3 === 0
                ? x.date
                : ''
              : String(x.date).slice(5));
          return (
            '<div class="ldb-bar' +
            (x.value <= 0 ? ' is-empty' : '') +
            '" title="' +
            Biz.esc((x.tip || x.date) + '：' + Biz.money(x.value)) +
            '">' +
            '<div class="ldb-bar__fill" style="height:' +
            h +
            'px"></div>' +
            '<div class="ldb-bar__label">' +
            Biz.esc(label) +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function openGlossary() {
    ensureDrawer();
    var body =
      '<dl class="ldb-glossary">' +
      Biz.GLOSSARY.map(function (g) {
        return '<dt>' + Biz.esc(g.name) + '</dt><dd>' + Biz.esc(g.text) + '</dd>';
      }).join('') +
      '</dl>' +
      '<p class="ldb-tip" style="margin-top:16px">测试排除仅匹配<strong>门店名称</strong>与<strong>商品名称</strong>中含「测试」或「test」的对象。支付归属与发生日期请用页顶页签切换，勿混算。</p>';
    showDrawer('指标释义', body);
  }

  function ensureDrawer() {
    if ($('[data-ldb-mask]')) return;
    var mask = document.createElement('div');
    mask.className = 'ldb-drawer-mask';
    mask.setAttribute('data-ldb-mask', '1');
    mask.innerHTML =
      '<aside class="ldb-drawer" data-ldb-drawer>' +
      '<div class="ldb-drawer__head"><h3 class="ldb-drawer__title" data-ldb-drawer-title></h3>' +
      '<button type="button" class="ldb-drawer__close" data-ldb-drawer-close aria-label="关闭">×</button></div>' +
      '<div class="ldb-drawer__body" data-ldb-drawer-body></div></aside>';
    document.body.appendChild(mask);
    mask.addEventListener('click', function (e) {
      if (e.target === mask) closeDrawer();
    });
    mask.querySelector('[data-ldb-drawer-close]').addEventListener('click', closeDrawer);
  }

  function showDrawer(title, html) {
    ensureDrawer();
    $('[data-ldb-drawer-title]').textContent = title;
    $('[data-ldb-drawer-body]').innerHTML = html;
    $('[data-ldb-mask]').classList.add('is-open');
    $('[data-ldb-drawer]').classList.add('is-open');
  }

  function closeDrawer() {
    var mask = $('[data-ldb-mask]');
    if (!mask) return;
    mask.classList.remove('is-open');
    $('[data-ldb-drawer]').classList.remove('is-open');
  }

  /**
   * 明细抽屉表（支持分页）
   * opts: { pageSize, summaryHtml }
   */
  function showDetailTable(title, rows, columns, opts) {
    opts = opts || {};
    rows = rows || [];
    if (!rows.length) {
      showDrawer(title, '<div class="ldb-empty">暂无明细</div>');
      return;
    }
    var pagerState = {
      page: 1,
      pageSize: normalizePageSize(opts.pageSize || 10)
    };

    function paint() {
      var paged = paginateRows(rows, pagerState.page, pagerState.pageSize);
      pagerState.page = paged.page;
      pagerState.pageSize = paged.pageSize;
      var head = columns
        .map(function (c) {
          return '<th class="' + (c.num ? 'num' : '') + '">' + Biz.esc(c.label) + '</th>';
        })
        .join('');
      var body = paged.rows
        .map(function (r) {
          return (
            '<tr>' +
            columns
              .map(function (c) {
                var v = r[c.key];
                var text =
                  c.format === 'money'
                    ? Biz.money(v)
                    : c.format === 'pct'
                      ? Biz.pctText(v)
                      : v == null || v === ''
                        ? '—'
                        : Biz.esc(v);
                return '<td class="' + (c.num ? 'num' : '') + '">' + text + '</td>';
              })
              .join('') +
            '</tr>'
          );
        })
        .join('');
      var summary =
        opts.summaryHtml ||
        '<p class="ldb-tip ldb-tip--flush">共 ' +
          paged.total +
          ' 单（按主订单去重）</p>';
      showDrawer(
        title,
        summary +
          '<div class="ldb-table-wrap"><table class="ldb-table"><thead><tr>' +
          head +
          '</tr></thead><tbody>' +
          body +
          '</tbody></table></div>' +
          renderPager({
            total: paged.total,
            page: paged.page,
            pageSize: paged.pageSize,
            unitLabel: '单',
            rangeUnit: '单',
            rangeText: paged.total
              ? '当前展示第 ' + paged.from + '–' + paged.to + ' 单'
              : '当前无展示'
          })
      );
      bindPager($('[data-ldb-drawer-body] [data-ldb-pager]'), pagerState, paint);
    }

    paint();
  }

  function pageHref(file, params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      /* platScope=all 仍写入，保证总览→门店比较业务范围可带回 */
      if (k === 'platScope') {
        if (v == null || v === '') return;
        q.set(k, String(v));
        return;
      }
      if (v == null || v === '' || v === 'all') return;
      q.set(k, String(v));
    });
    var qs = q.toString();
    return wp.page(file) + (qs ? '?' + qs : '');
  }

  /** 分页条：总数、每页条数、上一页／下一页、页码跳转 */
  function renderPager(opts) {
    opts = opts || {};
    var total = opts.total || 0;
    var page = Math.max(1, opts.page || 1);
    var pageSize = normalizePageSize(opts.pageSize);
    var totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > totalPages) page = totalPages;
    var from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    var to = Math.min(total, page * pageSize);
    var unit = opts.unitLabel || '家门店';
    var rangeUnit = opts.rangeUnit || (unit === '家门店' ? '家' : unit);
    return (
      '<div class="ldb-pager" data-ldb-pager>' +
      '<span class="ldb-pager__total">共 ' +
      total +
      ' ' +
      Biz.esc(unit) +
      (opts.rangeText
        ? '，' + Biz.esc(opts.rangeText)
        : total
          ? '，当前展示第 ' + from + '–' + to + ' ' + Biz.esc(rangeUnit)
          : '') +
      '</span>' +
      '<div class="ldb-pager__controls">' +
      '<label class="ldb-pager__size">每页<select class="ldb-select ldb-select--sm" data-page-size>' +
      [10, 20, 50]
        .map(function (n) {
          return (
            '<option value="' +
            n +
            '"' +
            (pageSize === n ? ' selected' : '') +
            '>' +
            n +
            ' 条</option>'
          );
        })
        .join('') +
      '</select></label>' +
      '<button type="button" data-page-prev' +
      (page <= 1 ? ' disabled' : '') +
      '>上一页</button>' +
      '<span class="ldb-pager__page">第 <input class="ldb-pager__jump" data-page-jump type="number" min="1" max="' +
      totalPages +
      '" value="' +
      page +
      '"> / ' +
      totalPages +
      ' 页</span>' +
      '<button type="button" data-page-go>跳转</button>' +
      '<button type="button" data-page-next' +
      (page >= totalPages ? ' disabled' : '') +
      '>下一页</button>' +
      '</div></div>'
    );
  }

  function bindPager(host, state, render) {
    if (!host) return;
    var sizeEl = host.querySelector('[data-page-size]');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = normalizePageSize(sizeEl.value);
        state.page = 1;
        render();
      });
    }
    var prev = host.querySelector('[data-page-prev]');
    var next = host.querySelector('[data-page-next]');
    var jump = host.querySelector('[data-page-jump]');
    var go = host.querySelector('[data-page-go]');
    if (prev) {
      prev.addEventListener('click', function () {
        if (state.page > 1) {
          state.page -= 1;
          render();
        }
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        state.page += 1;
        render();
      });
    }
    function applyJump() {
      var n = Math.max(1, Number((jump && jump.value) || state.page) || 1);
      state.page = n;
      render();
    }
    if (go) go.addEventListener('click', applyJump);
    if (jump) {
      jump.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') applyJump();
      });
    }
  }

  function paginateRows(rows, page, pageSize) {
    pageSize = normalizePageSize(pageSize);
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    page = Math.max(1, Math.min(page || 1, totalPages));
    var start = (page - 1) * pageSize;
    return {
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(total, start + pageSize),
      rows: rows.slice(start, start + pageSize)
    };
  }

  function polar(cx, cy, r, deg) {
    var rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function donutSlicePath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    if (endDeg - startDeg >= 359.999) endDeg = startDeg + 359.999;
    var large = endDeg - startDeg > 180 ? 1 : 0;
    var o0 = polar(cx, cy, rOuter, startDeg);
    var o1 = polar(cx, cy, rOuter, endDeg);
    var i1 = polar(cx, cy, rInner, endDeg);
    var i0 = polar(cx, cy, rInner, startDeg);
    return [
      'M',
      o0[0],
      o0[1],
      'A',
      rOuter,
      rOuter,
      0,
      large,
      1,
      o1[0],
      o1[1],
      'L',
      i1[0],
      i1[1],
      'A',
      rInner,
      rInner,
      0,
      large,
      0,
      i0[0],
      i0[1],
      'Z'
    ].join(' ');
  }

  /**
   * 统一环形构成图：左侧甜甜圈＋右侧明细
   * parts: [{ name, value, color, orders? }]
   *   value 为 null／NaN 表示未形成 → 明细显示「—」，不参与占比
   * opts: { centerLabel, ariaLabel, emptyText }
   */
  function renderCompositionPie(parts, opts) {
    opts = opts || {};
    var centerLabel = opts.centerLabel || '合计';
    var ariaLabel = opts.ariaLabel || '构成';
    var emptyText = opts.emptyText || '暂无成交';

    parts = (parts || []).map(function (p, idx) {
      var raw = p.value;
      var formed = raw != null && raw === raw && isFinite(Number(raw));
      var value = formed ? Number(raw) : null;
      var orders =
        p.orders == null || p.orders !== p.orders || !isFinite(Number(p.orders))
          ? null
          : Number(p.orders);
      return {
        name: p.name,
        value: value,
        formed: formed,
        color: p.color || DEFAULT_PIE_COLORS[idx % DEFAULT_PIE_COLORS.length],
        orders: orders,
        hasOrders: p.orders !== undefined
      };
    });

    var total = parts.reduce(function (s, p) {
      return s + (p.formed && p.value > 0 ? p.value : p.formed ? p.value : 0);
    }, 0);
    /* 仅已形成且＞0 的项画扇区；合计≤0 视为无成交 */
    var hasData = total > 0;
    var cx = 80;
    var cy = 80;
    var rOuter = 72;
    var rInner = 46;
    var svgInner = '';

    if (!hasData) {
      svgInner =
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        (rOuter + rInner) / 2 +
        '" fill="none" stroke="#ebeef5" stroke-width="' +
        (rOuter - rInner) +
        '" />';
    } else {
      var cursor = 0;
      svgInner = parts
        .filter(function (p) {
          return p.formed && p.value > 0;
        })
        .map(function (p) {
          var sweep = (p.value / total) * 360;
          var start = cursor;
          var end = cursor + sweep;
          cursor = end;
          var pct = ((p.value / total) * 100).toFixed(1) + '%';
          var tipParts = [p.name, Biz.money(p.value), pct];
          if (p.hasOrders) {
            tipParts.push(p.orders == null ? '订单数 —' : Biz.intText(p.orders) + '单');
          }
          var tip = tipParts.join(' · ');
          return (
            '<path class="ldb-pie-slice" data-pie-slice="1" data-tip="' +
            Biz.esc(tip) +
            '" d="' +
            donutSlicePath(cx, cy, rOuter, rInner, start, end) +
            '" fill="' +
            p.color +
            '"><title>' +
            Biz.esc(tip) +
            '</title></path>'
          );
        })
        .join('');
    }

    var legend = parts
      .map(function (p) {
        var amountText = !p.formed ? '—' : hasData ? Biz.money(p.value) : '—';
        var pctText =
          !p.formed || !hasData
            ? '—'
            : ((p.value / total) * 100).toFixed(1) + '%';
        var metaBits = [];
        if (p.formed && hasData) {
          metaBits.push(amountText);
          metaBits.push(pctText);
        } else {
          metaBits.push(amountText);
          metaBits.push(pctText);
        }
        if (p.hasOrders) {
          metaBits.push(p.orders == null ? '—单' : Biz.intText(p.orders) + '单');
        }
        return (
          '<div class="ldb-pie-legend__row">' +
          '<span class="ldb-pie-legend__name"><span class="ldb-dot" style="background:' +
          p.color +
          '"></span>' +
          Biz.esc(p.name) +
          '</span>' +
          '<span class="ldb-pie-legend__meta">' +
          metaBits
            .map(function (bit, i) {
              return (
                '<strong class="ldb-pie-legend__val">' +
                bit +
                '</strong>' +
                (i < metaBits.length - 1 ? '<span class="ldb-pie-legend__sep">·</span>' : '')
              );
            })
            .join('') +
          '</span></div>'
        );
      })
      .join('');

    var centerHtml = hasData
      ? '<span>' +
        Biz.esc(centerLabel) +
        '</span><strong>' +
        Biz.money(total) +
        '</strong>'
      : '<strong class="is-empty">' + Biz.esc(emptyText) + '</strong>';

    return (
      '<div class="ldb-pie-panel" data-ldb-pie>' +
      '<div class="ldb-pie-donut">' +
      '<svg viewBox="0 0 160 160" role="img" aria-label="' +
      Biz.esc(ariaLabel) +
      '">' +
      svgInner +
      '</svg>' +
      '<div class="ldb-pie-center">' +
      centerHtml +
      '</div>' +
      '<div class="ldb-pie-tooltip" hidden></div>' +
      '</div>' +
      '<div class="ldb-pie-side"><div class="ldb-pie-legend">' +
      legend +
      '</div></div></div>'
    );
  }

  var DEFAULT_PIE_COLORS = ['#ff7019', '#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#faad14'];

  /** @deprecated 使用 renderCompositionPie */
  function renderBizLinePie(parts, opts) {
    return renderCompositionPie(parts, opts);
  }

  function bindCompositionPie(host) {
    if (!host) return;
    var tip = host.querySelector('.ldb-pie-tooltip');
    var donut = host.querySelector('.ldb-pie-donut');
    if (!tip || !donut) return;
    host.querySelectorAll('[data-pie-slice]').forEach(function (slice) {
      slice.addEventListener('mouseenter', function () {
        tip.textContent = slice.getAttribute('data-tip') || '';
        tip.hidden = false;
        tip.classList.add('is-open');
      });
      slice.addEventListener('mousemove', function (e) {
        var rect = donut.getBoundingClientRect();
        tip.style.left = e.clientX - rect.left + 12 + 'px';
        tip.style.top = e.clientY - rect.top + 12 + 'px';
      });
      slice.addEventListener('mouseleave', function () {
        tip.hidden = true;
        tip.classList.remove('is-open');
      });
    });
  }

  function bindBizLinePie(host) {
    bindCompositionPie(host);
  }

  global.MdmDataBizUi = {
    $: $,
    readStateFromUrl: readStateFromUrl,
    writeStateToUrl: writeStateToUrl,
    renderToolbar: renderToolbar,
    bindToolbar: bindToolbar,
    kpiCard: kpiCard,
    renderBars: renderBars,
    renderCompositionPie: renderCompositionPie,
    bindCompositionPie: bindCompositionPie,
    renderBizLinePie: renderBizLinePie,
    bindBizLinePie: bindBizLinePie,
    renderPager: renderPager,
    bindPager: bindPager,
    paginateRows: paginateRows,
    normalizePageSize: normalizePageSize,
    normalizePeriodKey: normalizePeriodKey,
    normalizePlatScope: normalizePlatScope,
    openGlossary: openGlossary,
    showDrawer: showDrawer,
    closeDrawer: closeDrawer,
    showDetailTable: showDetailTable,
    pageHref: pageHref
  };
})(typeof window !== 'undefined' ? window : this);
