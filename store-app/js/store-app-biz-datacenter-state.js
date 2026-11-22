/**
 * 门店数据中心 · 筛选条件保留（门店／日期／Tab／视角等）
 * 公共日期跨页共享；模块独立条件分键保存；URL 仅写本页适用参数。
 */
(function (global) {
  var KEY = 'sa_biz_dc_filters_v1';

  var PAGE_KEYS = {
    center: ['range', 'start', 'end'],
    ops: ['range', 'start', 'end', 'view', 'channel', 'tab', 'tpModule', 'tpChannel'],
    operate: ['range', 'start', 'end', 'tab'],
    commission: ['range', 'start', 'end', 'dim']
  };

  /* tab 在经营／运营页含义不同，存储分键 */
  var TAB_STORAGE = {
    ops: 'opsTab',
    operate: 'operateTab'
  };

  var ALL_URL_KEYS = [
    'range',
    'start',
    'end',
    'view',
    'channel',
    'tab',
    'dim',
    'settle',
    'tpModule',
    'tpChannel',
    'section'
  ];

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === 'object' ? o : {};
    } catch (e) {
      return {};
    }
  }

  function write(patch) {
    var next = Object.assign(read(), patch || {});
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      /* ignore */
    }
    return next;
  }

  function fromUrl() {
    var q = {};
    try {
      var sp = new URLSearchParams(location.search || '');
      sp.forEach(function (v, k) {
        q[k] = v;
      });
    } catch (e) {
      /* ignore */
    }
    return q;
  }

  function pageOf(path) {
    var p = String(path || location.pathname || '');
    if (/biz-commission/i.test(p)) return 'commission';
    if (/biz-operate/i.test(p)) return 'operate';
    if (/biz-ops/i.test(p)) return 'ops';
    return 'center';
  }

  function normalizeTab(raw) {
    var t = String(raw || '');
    if (t === 'proxy' || t === '采购' || t === '进货') return 'proxy';
    if (t === 'tp' || t === 'third' || t === '第三方') return 'tp';
    if (t === 'income' || t === '所得' || t === '佣金' || t === '本店所得') return 'income';
    if (t === 'retail' || t === '零售') return 'retail';
    if (t === 'customers' || t === '客户') return 'customers';
    if (t === 'freq' || t === '频次') return 'freq';
    if (t === 'source' || t === '来源') return 'source';
    return t;
  }

  function normalizeRange(raw) {
    var r = String(raw || '');
    /* 本周／本月已下线：旧参数统一回退今日 */
    if (r === 'week' || r === 'month' || r === '本周' || r === '本月') return 'today';
    if (r === 'today' || r === 'yesterday' || r === '7d' || r === '30d' || r === 'custom') {
      return r;
    }
    return r || 'today';
  }

  function normalizeDim(raw) {
    var d = String(raw || '');
    if (d === 'settle' || d === 'create') return 'settle';
    if (d === 'credit' || d === 'order') return 'pay';
    return d === 'pay' ? 'pay' : 'pay';
  }

  function pick(obj, keys) {
    var out = {};
    (keys || []).forEach(function (k) {
      if (obj[k] != null && obj[k] !== '') out[k] = obj[k];
    });
    return out;
  }

  /**
   * @param {string} [page] center|ops|operate|commission
   */
  function merge(page) {
    var scope = page || pageOf();
    var keys = PAGE_KEYS[scope] || PAGE_KEYS.center;
    var saved = read();
    var url = fromUrl();
    var tabStoreKey = TAB_STORAGE[scope];

    var range = normalizeRange(url.range || saved.range || 'today');
    var out = {
      range: range,
      start: range === 'custom' ? url.start || saved.start || '' : '',
      end: range === 'custom' ? url.end || saved.end || '' : ''
    };

    if (keys.indexOf('view') >= 0) {
      out.view = url.view || saved.view || 'pay';
    }
    if (keys.indexOf('channel') >= 0) {
      out.channel = url.channel || saved.channel || 'all';
    }
    if (keys.indexOf('dim') >= 0) {
      out.dim = normalizeDim(url.dim || saved.dim || 'pay');
    }
    if (keys.indexOf('tpModule') >= 0) {
      out.tpModule = url.tpModule || saved.tpModule || '';
    }
    if (keys.indexOf('tpChannel') >= 0) {
      out.tpChannel = url.tpChannel || saved.tpChannel || 'all';
    }
    if (keys.indexOf('tab') >= 0) {
      var rawTab =
        url.tab ||
        url.section ||
        (tabStoreKey ? saved[tabStoreKey] : '') ||
        saved.tab ||
        '';
      out.tab = normalizeTab(rawTab);
      out.section = out.tab;
    }

    var persist = {
      range: out.range,
      start: out.start,
      end: out.end
    };
    if (out.view != null) persist.view = out.view;
    if (out.channel != null) persist.channel = out.channel;
    if (out.dim != null) persist.dim = out.dim;
    if (out.tpModule != null) persist.tpModule = out.tpModule;
    if (out.tpChannel != null) persist.tpChannel = out.tpChannel;
    if (out.tab != null) {
      if (tabStoreKey) persist[tabStoreKey] = out.tab;
      persist.tab = out.tab;
      persist.section = out.tab;
    }
    write(persist);
    return out;
  }

  function qs(extra, page) {
    var scope = page || pageOf((extra && extra.__path) || '');
    if (extra && extra.__path) {
      extra = Object.assign({}, extra);
      delete extra.__path;
    }
    var keys = PAGE_KEYS[scope] || PAGE_KEYS.center;
    var saved = read();
    var base = {};
    keys.forEach(function (k) {
      if (k === 'tab') {
        var sk = TAB_STORAGE[scope];
        base.tab = saved[sk] || saved.tab || '';
        return;
      }
      if (saved[k] != null && saved[k] !== '') base[k] = saved[k];
    });
    var o = Object.assign({}, pick(base, keys), pick(extra || {}, keys.concat(['range', 'start', 'end'])));
    if (o.range !== 'custom') {
      delete o.start;
      delete o.end;
    }
    var parts = [];
    keys.forEach(function (k) {
      if (o[k] == null || o[k] === '') return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k]));
    });
    if (global.StoreAppBizSession && global.StoreAppBizSession.qsParams) {
      var sess = global.StoreAppBizSession.qsParams();
      Object.keys(sess).forEach(function (k) {
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(sess[k]));
      });
    }
    return parts.join('&');
  }

  function href(path, extra) {
    var scope = pageOf(path);
    var pair = qs(Object.assign({ __path: path }, extra || {}), scope);
    return path + (pair ? '?' + pair : '');
  }

  /**
   * 仅写入本页适用参数到 URL，并清除其他数据中心筛选参数。
   * @param {object} extra
   * @param {string} [page]
   */
  function pushUrl(extra, page) {
    try {
      var scope = page || pageOf();
      var keys = PAGE_KEYS[scope] || PAGE_KEYS.center;
      var patch = Object.assign({}, extra || {});
      var tabStoreKey = TAB_STORAGE[scope];
      var toStore = {};
      Object.keys(patch).forEach(function (k) {
        if (patch[k] == null || patch[k] === '') return;
        toStore[k] = patch[k];
      });
      if (toStore.tab != null && tabStoreKey) {
        toStore[tabStoreKey] = toStore.tab;
      }
      var next = write(toStore);
      var u = new URL(location.href);
      ALL_URL_KEYS.forEach(function (k) {
        u.searchParams.delete(k);
      });
      keys.forEach(function (k) {
        var v = Object.prototype.hasOwnProperty.call(patch, k) ? patch[k] : next[k];
        if (k === 'tab' && tabStoreKey && toStore[tabStoreKey] != null && !Object.prototype.hasOwnProperty.call(patch, 'tab')) {
          v = toStore[tabStoreKey];
        }
        if (k === 'start' || k === 'end') {
          var range = Object.prototype.hasOwnProperty.call(patch, 'range') ? patch.range : next.range;
          if (range !== 'custom') {
            u.searchParams.delete(k);
            return;
          }
        }
        if (v != null && v !== '') u.searchParams.set(k, v);
        else u.searchParams.delete(k);
      });
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {
      /* ignore */
    }
  }

  var RANGES = [
    { id: 'today', name: '今日' },
    { id: 'yesterday', name: '昨日' },
    { id: '7d', name: '近7天' },
    { id: '30d', name: '近30天' },
    { id: 'custom', name: '自定义' }
  ];

  function renderRangeStrip(root, activeId) {
    if (!root) return;
    var active = normalizeRange(activeId);
    root.innerHTML = RANGES.map(function (r) {
      return (
        '<button type="button" class="sa-dc-ranges__btn' +
        (r.id === active ? ' is-active' : '') +
        '" data-range="' +
        r.id +
        '">' +
        r.name +
        '</button>'
      );
    }).join('');
  }

  /** 仅统计日期，不含「较／比…」（无对比结果的模块用） */
  function periodDateCaption(bounds) {
    if (!bounds) return '';
    if (bounds.startKey === bounds.endKey) {
      return '统计日期：' + bounds.startKey;
    }
    return '统计日期：' + bounds.startKey + ' 至 ' + bounds.endKey;
  }

  /**
   * 有对比结果的模块：统计周期 + 明确对比文案，并可带对比日期
   * @param compareLabel 如「比前7天」
   * @param compareRange {startKey,endKey} 可选
   */
  function periodCaption(bounds, compareLabel, compareRange) {
    if (!bounds) return '';
    var span =
      bounds.startKey === bounds.endKey
        ? bounds.startKey
        : bounds.startKey + ' ~ ' + bounds.endKey;
    var text = '统计周期 ' + span;
    if (!compareLabel) return text;
    text += ' · ' + compareLabel;
    if (compareRange && compareRange.startKey) {
      var cspan =
        compareRange.startKey === compareRange.endKey
          ? compareRange.startKey
          : compareRange.startKey + ' 至 ' + compareRange.endKey;
      text += '（对比 ' + cspan + '）';
    }
    return text;
  }

  function updatedCaption(updatedAt) {
    if (!updatedAt) return '';
    return '数据更新至 ' + String(updatedAt);
  }

  /** 打开自定义时默认带入当前生效起止；已有自定义则保留 */
  function customDefaults(range, custom, resolveRangeFn) {
    if (range === 'custom' && custom && custom.start && custom.end) {
      return { start: custom.start, end: custom.end };
    }
    if (typeof resolveRangeFn === 'function') {
      var b = resolveRangeFn(range, custom || {});
      if (b && b.startKey && b.endKey) return { start: b.startKey, end: b.endKey };
    }
    return { start: '', end: '' };
  }

  /**
   * 说明弹层 HTML：短标题 + 分条 + 可展开通用规则
   * @param {{title:string, items:string[]}[]} sections
   * @param {string} [commonNote]
   */
  function tipBodyHtml(sections, commonNote) {
    var html = (sections || [])
      .map(function (sec) {
        if (!sec || !sec.items || !sec.items.length) return '';
        return (
          '<section class="sa-dc-tip-sec">' +
          (sec.title ? '<h3 class="sa-dc-tip-sec__t">' + escHtml(sec.title) + '</h3>' : '') +
          '<ul class="sa-dc-tip-sec__list">' +
          sec.items
            .map(function (it) {
              return '<li>' + escHtml(it) + '</li>';
            })
            .join('') +
          '</ul></section>'
        );
      })
      .join('');
    if (commonNote) {
      html +=
        '<details class="sa-dc-tip-common"><summary>通用规则</summary><p>' +
        escHtml(commonNote) +
        '</p></details>';
    }
    return html;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.StoreAppBizDcState = {
    read: read,
    write: write,
    merge: merge,
    qs: qs,
    href: href,
    pushUrl: pushUrl,
    pageOf: pageOf,
    PAGE_KEYS: PAGE_KEYS,
    normalizeTab: normalizeTab,
    normalizeRange: normalizeRange,
    normalizeDim: normalizeDim,
    RANGES: RANGES,
    renderRangeStrip: renderRangeStrip,
    periodCaption: periodCaption,
    periodDateCaption: periodDateCaption,
    updatedCaption: updatedCaption,
    customDefaults: customDefaults,
    tipBodyHtml: tipBodyHtml
  };
})(window);
