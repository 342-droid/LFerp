/**
 * BD / 供应商数据中心共用：日期、对比期、筛选保留、金额与趋势。
 * 统计周期只有今日、昨日、近7天、近30天、自定义。演示数据，不是生产接入结果。
 */
(function (global) {
  var DEMO_TODAY = (function () {
    var d = new Date();
    function p(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  })();
  var CUTOFF = '21:30:00';
  var UPDATED_AT = DEMO_TODAY + ' 21:30:00';
  var DATA_NOTE = '以上为演示数据，不是生产系统接入结果。正式环境必须由接口按角色和数据权限过滤。';
  var RANGES = [
    { id: 'today', name: '今日' },
    { id: 'yesterday', name: '昨日' },
    { id: '7d', name: '近7天' },
    { id: '30d', name: '近30天' },
    { id: 'custom', name: '自定义' }
  ];

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }
  function money(n) {
    return round2(n).toFixed(2);
  }
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }
  function dateKeyOf(str) {
    var m = String(str || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
  }
  function hmOf(str) {
    var m = String(str || '').match(/(\d{2}:\d{2}:\d{2})/);
    return m ? m[1] : '';
  }
  function parseDay(key) {
    var p = String(key || '').split('-');
    if (p.length < 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function keyFromDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function shiftKey(key, delta) {
    var d = parseDay(key);
    if (!d) return '';
    d.setDate(d.getDate() + delta);
    return keyFromDate(d);
  }
  function daysBetween(a, b) {
    var da = parseDay(a);
    var db = parseDay(b);
    if (!da || !db) return 0;
    return Math.round((db.getTime() - da.getTime()) / 86400000);
  }
  function at(dayOffset, hm) {
    return shiftKey(DEMO_TODAY, dayOffset) + ' ' + (hm || '12:00:00');
  }
  function isTestName(name) {
    return /测试|test/i.test(String(name || ''));
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeRange(raw) {
    var r = String(raw || '');
    if (r === 'week' || r === 'month' || r === '本周' || r === '本月') return 'today';
    if (r === 'today' || r === 'yesterday' || r === '7d' || r === '30d' || r === 'custom') return r;
    return 'today';
  }

  function resolveRange(range, custom) {
    var today = parseDay(DEMO_TODAY);
    var start = new Date(today.getTime());
    var endExclusive = new Date(today.getTime() + 86400000);
    var label = '今日';
    var r = normalizeRange(range || 'today');
    if (r === 'yesterday') {
      start = new Date(today.getTime() - 86400000);
      endExclusive = new Date(today.getTime());
      label = '昨日';
    } else if (r === '7d') {
      endExclusive = new Date(today.getTime());
      start = new Date(today.getTime() - 7 * 86400000);
      label = '近7天';
    } else if (r === '30d') {
      endExclusive = new Date(today.getTime());
      start = new Date(today.getTime() - 30 * 86400000);
      label = '近30天';
    } else if (r === 'custom' && custom && custom.start && custom.end && custom.start <= custom.end) {
      start = parseDay(custom.start);
      var endDay = parseDay(custom.end);
      endExclusive = endDay ? new Date(endDay.getTime() + 86400000) : endExclusive;
      label = '自定义';
    } else {
      r = 'today';
      label = '今日';
    }
    var endKeyDate = new Date(endExclusive.getTime() - 86400000);
    return {
      range: r,
      label: label,
      startKey: keyFromDate(start),
      endKey: keyFromDate(endKeyDate),
      startMs: start.getTime(),
      endMs: endExclusive.getTime(),
      isSingleDay: r === 'today' || r === 'yesterday' || (r === 'custom' && custom && custom.start === custom.end),
      cutoffHm: r === 'today' ? CUTOFF : ''
    };
  }

  function compareBounds(bounds) {
    var r = bounds.range;
    var today = parseDay(DEMO_TODAY);
    if (r === 'today') {
      var y = new Date(today.getTime() - 86400000);
      return {
        range: 'compare',
        startMs: y.getTime(),
        endMs: today.getTime(),
        startKey: shiftKey(DEMO_TODAY, -1),
        endKey: shiftKey(DEMO_TODAY, -1),
        cutoffHm: CUTOFF,
        label: '较昨日同时段'
      };
    }
    if (r === 'yesterday') {
      return {
        range: 'compare',
        startMs: today.getTime() - 2 * 86400000,
        endMs: today.getTime() - 86400000,
        startKey: shiftKey(DEMO_TODAY, -2),
        endKey: shiftKey(DEMO_TODAY, -2),
        cutoffHm: '',
        label: '较前日'
      };
    }
    var days = Math.max(1, Math.round((bounds.endMs - bounds.startMs) / 86400000));
    var prevEnd = bounds.startMs;
    var prevStart = bounds.startMs - days * 86400000;
    var label = r === '7d' ? '较前7天' : r === '30d' ? '较前30天' : '较上一周期';
    return {
      range: 'compare',
      startMs: prevStart,
      endMs: prevEnd,
      startKey: keyFromDate(new Date(prevStart)),
      endKey: keyFromDate(new Date(prevEnd - 86400000)),
      cutoffHm: '',
      label: label
    };
  }

  function inBounds(timeStr, bounds) {
    if (!bounds) return false;
    var key = dateKeyOf(timeStr);
    if (!key || key < bounds.startKey || key > bounds.endKey) return false;
    if (bounds.cutoffHm) {
      var hm = hmOf(timeStr);
      if (hm && hm > bounds.cutoffHm) return false;
    }
    return true;
  }

  function deltaPack(cur, prev) {
    if (cur == null || prev == null) return { na: true, abs: null, pct: null };
    var c = Number(cur) || 0;
    var p = Number(prev) || 0;
    var abs = round2(c - p);
    var pct = p === 0 ? (c === 0 ? 0 : null) : round2(((c - p) / Math.abs(p)) * 100);
    return { na: false, abs: abs, pct: pct, up: abs > 0, flat: abs === 0 };
  }

  function add(sum, n) {
    return round2(sum + (Number(n) || 0));
  }

  function periodCaption(bounds, compareLabel) {
    if (!bounds) return '';
    var span = bounds.startKey === bounds.endKey ? bounds.startKey : bounds.startKey + ' ~ ' + bounds.endKey;
    if (bounds.cutoffHm) span += ' 00:00–' + String(bounds.cutoffHm).slice(0, 5);
    return '统计周期 ' + span + (compareLabel ? ' · ' + compareLabel : '');
  }
  function updatedCaption(updatedAt) {
    return '数据更新至 ' + (updatedAt || UPDATED_AT) + '（演示数据）';
  }

  function moneyFmt(v) {
    if (v == null || v === '') return '—';
    var f = money(v).split('.');
    return f[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + f[1];
  }
  function intFmt(v) {
    if (v == null || v === '') return '—';
    return String(Math.round(Number(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function textFmt(v) {
    if (v == null || v === '') return '—';
    return String(v);
  }
  function intervalFmt(v) {
    if (v == null || v === '') return '—';
    var n = Math.round(Number(v) * 10) / 10;
    return (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1)) + ' 天';
  }

  function deltaHtml(d, label) {
    if (!d || d.na) return '<span class="sa-dc-delta">—</span>';
    var abs = moneyFmt(Math.abs(d.abs));
    var sign = d.flat ? '' : d.up ? '+' : '-';
    var pct = d.pct == null ? '—' : (d.pct > 0 ? '+' : '') + d.pct + '%';
    var arrow = d.flat ? '' : d.up ? '↑' : '↓';
    var cls = d.flat ? '' : d.up ? ' is-up' : ' is-down';
    return (
      '<span class="sa-dc-delta' +
      cls +
      '"><span class="sa-dc-delta__line">' +
      esc(label || '较对比期') +
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

  function grid(items, cols) {
    var n = cols === 2 ? 2 : 3;
    return (
      '<div class="sa-dc-grid sa-dc-grid--' +
      n +
      '">' +
      (items || [])
        .map(function (it) {
          return (
            '<div class="sa-dc-metric' + (it.wide ? ' sa-dc-metric--wide' : '') + '"><div class="sa-dc-metric__t">' +
            esc(it.t) +
            '</div><div class="sa-dc-metric__v">' +
            it.v +
            '</div>' +
            (it.f ? '<div class="sa-dc-metric__foot">' + it.f + '</div>' : '') +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function hero(title, valueHtml, footHtml) {
    return (
      '<div class="sa-dc-hero sa-dc-hero--soft"><div class="sa-dc-hero__t">' +
      esc(title) +
      '</div><div class="sa-dc-hero__v">' +
      valueHtml +
      '</div><div class="sa-dc-hero__foot">' +
      (footHtml || '') +
      '</div></div>'
    );
  }

  function chartBox(caption) {
    return (
      '<div class="sa-dc-chart"><div class="sa-dc-chart__meta"><span>' +
      esc(caption || '趋势') +
      '</span></div><div class="sa-dc-chart-wrap" id="dcTrendWrap"><div class="sa-dc-chart-y" id="dcTrendY"></div><svg id="dcTrendSvg" viewBox="0 0 289 88"></svg></div><div class="sa-dc-chart-x" id="dcTrendX"></div></div>'
    );
  }

  function drawChart(pts) {
    var svg = document.getElementById('dcTrendSvg');
    var yEl = document.getElementById('dcTrendY');
    var xEl = document.getElementById('dcTrendX');
    var wrap = document.getElementById('dcTrendWrap');
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
      if (xEl) xEl.innerHTML = '<span class="sa-dc-empty sa-dc-empty--compact">本时段暂无趋势数据</span>';
      return;
    }
    wrap.classList.remove('is-empty');
    var max = Math.max.apply(null, vals.concat([1]));
    var w = 289;
    var h = 88;
    var pad = 8;
    var n = vals.length;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var gridLines = '';
    var g;
    for (g = 0; g < 3; g++) {
      var gy = pad + ((h - pad * 2) * g) / 2;
      gridLines +=
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
    if (n === 1) {
      var bw = 22;
      var x = w / 2 - bw / 2;
      var barH = Math.max(8, (vals[0] / max) * (h - pad * 2));
      var y = h - pad - barH;
      svg.innerHTML =
        gridLines +
        '<rect x="' +
        x.toFixed(1) +
        '" y="' +
        y.toFixed(1) +
        '" width="' +
        bw +
        '" height="' +
        barH.toFixed(1) +
        '" rx="3" fill="#ff6501"/>';
    } else {
      var step = (w - pad * 2) / (n - 1);
      var line = vals
        .map(function (v, i) {
          var cx = pad + i * step;
          var cy = h - pad - (v / max) * (h - pad * 2);
          return (i ? 'L' : 'M') + cx.toFixed(1) + ' ' + cy.toFixed(1);
        })
        .join(' ');
      svg.innerHTML = gridLines + '<path d="' + line + '" fill="none" stroke="#ff6501" stroke-width="1.8"/>';
    }
    if (yEl) yEl.innerHTML = '<span>' + moneyFmt(max) + '</span><span>0</span>';
    if (xEl) {
      xEl.innerHTML =
        '<span>' +
        esc((pts[0] && pts[0].label) || '') +
        '</span><span>' +
        esc((pts[pts.length - 1] && pts[pts.length - 1].label) || '') +
        '</span>';
    }
  }

  function buildTrend(bounds, valueOf) {
    var points = [];
    if (bounds.isSingleDay) {
      var hour;
      var limit = bounds.cutoffHm ? Number(bounds.cutoffHm.slice(0, 2)) : 23;
      for (hour = 0; hour <= limit; hour++) {
        points.push({
          key: bounds.startKey + ' ' + pad2(hour),
          label: pad2(hour) + ':00',
          value: valueOf({ day: bounds.startKey, hour: hour })
        });
      }
      var first = -1;
      var last = -1;
      points.forEach(function (p, i) {
        if (p.value) {
          if (first < 0) first = i;
          last = i;
        }
      });
      if (first >= 0) points = points.slice(Math.max(0, first - 1), Math.min(points.length, last + 2));
      else points = [];
      return points;
    }
    var cur = parseDay(bounds.startKey);
    var end = parseDay(bounds.endKey);
    if (!cur || !end) return [];
    while (cur.getTime() <= end.getTime()) {
      var key = keyFromDate(cur);
      points.push({ key: key, label: key.slice(5), value: valueOf({ day: key, hour: null }) });
      cur.setDate(cur.getDate() + 1);
    }
    return points;
  }

  function createState(storageKey) {
    var current = null;
    function read() {
      try {
        var raw = localStorage.getItem(storageKey);
        var o = raw ? JSON.parse(raw) : null;
        return o && typeof o === 'object' ? o : {};
      } catch (e) {
        return {};
      }
    }
    function write(patch) {
      var next = Object.assign(read(), patch || {});
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) { /* ignore */ }
      current = next;
      return next;
    }
    function fromUrl() {
      var q = {};
      try {
        new URLSearchParams(location.search || '').forEach(function (v, k) {
          q[k] = v;
        });
      } catch (e2) { /* ignore */ }
      return q;
    }
    function load(defaults) {
      var saved = read();
      var url = fromUrl();
      var d = defaults || {};
      var range = normalizeRange(url.range || saved.range || d.range || 'today');
      current = {
        range: range,
        start: url.start || saved.start || '',
        end: url.end || saved.end || '',
        tab: url.tab || saved.tab || d.tab || '',
        scope: url.scope === 'history' || saved.scope === 'history' ? (url.scope || saved.scope) : 'current',
        dim: (url.dim || saved.dim) === 'settle' ? 'settle' : 'pay',
        settle: url.settle || saved.settle || 'all',
        source: url.source || saved.source || 'all',
        rank: url.rank || saved.rank || d.rank || '',
        store: url.storeId || url.store || saved.store || d.store || '',
        sku: url.sku || saved.sku || ''
      };
      if (url.scope) current.scope = url.scope === 'history' ? 'history' : 'current';
      write(current);
      return current;
    }
    function get() {
      return current || load({});
    }
    function update(patch) {
      var next = Object.assign({}, get(), patch || {});
      if (next.range !== 'custom') {
        /* 保留上次自定义日期，但当前不是自定义时不把它写进地址 */
      }
      write(next);
      try {
        var u = new URL(location.href);
        ['range', 'start', 'end', 'tab', 'scope', 'dim', 'settle', 'source', 'rank', 'store', 'sku'].forEach(function (k) {
          var v = next[k];
          if (k === 'start' || k === 'end') {
            if (next.range === 'custom' && v) u.searchParams.set(k, v);
            else u.searchParams.delete(k);
            return;
          }
          if (k === 'store') {
            if (v) u.searchParams.set('storeId', v);
            else u.searchParams.delete('storeId');
            u.searchParams.delete('store');
            return;
          }
          if (v) u.searchParams.set(k, v);
          else u.searchParams.delete(k);
        });
        ['week', 'month'].forEach(function (gone) {
          u.searchParams.delete(gone);
        });
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) { /* ignore */ }
      return next;
    }
    function href(path, extra) {
      var o = Object.assign({}, get(), extra || {});
      var parts = [];
      if (o.range) parts.push('range=' + encodeURIComponent(o.range));
      if (o.range === 'custom' && o.start) parts.push('start=' + encodeURIComponent(o.start));
      if (o.range === 'custom' && o.end) parts.push('end=' + encodeURIComponent(o.end));
      ['tab', 'scope', 'dim', 'settle', 'source', 'rank', 'sku'].forEach(function (k) {
        if (o[k]) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k]));
      });
      if (o.store) parts.push('storeId=' + encodeURIComponent(o.store));
      return path + (parts.length ? '?' + parts.join('&') : '');
    }
    function renderRanges(root, active) {
      if (!root) return;
      var id = normalizeRange(active);
      root.innerHTML = RANGES.map(function (r) {
        return (
          '<button type="button" class="sa-dc-ranges__btn' +
          (r.id === id ? ' is-active' : '') +
          '" data-range="' +
          r.id +
          '">' +
          r.name +
          '</button>'
        );
      }).join('');
    }
    return {
      load: load,
      get: get,
      update: update,
      href: href,
      renderRanges: renderRanges
    };
  }

  global.StoreAppRoleDc = {
    DEMO_TODAY: DEMO_TODAY,
    CUTOFF: CUTOFF,
    UPDATED_AT: UPDATED_AT,
    DATA_NOTE: DATA_NOTE,
    RANGES: RANGES,
    round2: round2,
    money: money,
    add: add,
    at: at,
    shiftKey: shiftKey,
    dateKeyOf: dateKeyOf,
    hmOf: hmOf,
    daysBetween: daysBetween,
    isTestName: isTestName,
    esc: esc,
    normalizeRange: normalizeRange,
    resolveRange: resolveRange,
    compareBounds: compareBounds,
    inBounds: inBounds,
    deltaPack: deltaPack,
    periodCaption: periodCaption,
    updatedCaption: updatedCaption,
    moneyFmt: moneyFmt,
    intFmt: intFmt,
    textFmt: textFmt,
    intervalFmt: intervalFmt,
    deltaHtml: deltaHtml,
    grid: grid,
    hero: hero,
    chartBox: chartBox,
    drawChart: drawChart,
    buildTrend: buildTrend,
    createState: createState
  };
})(typeof window !== 'undefined' ? window : global);
