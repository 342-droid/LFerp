/**
 * 平台经营驾驶舱 · 公共工具
 * 平台筛：主体选择（业务伙伴·所有主体）；门店经营筛：区域＋门店。
 * 不含事业线／业务线／下单渠道；未接入／未获取不得展示为 0。
 */
(function (global) {
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isPending(value) {
    return value === 'pending' || value === 'unavailable' || (value && value.__pending);
  }

  function pendingText(value) {
    if (value && value.__pending) return value.label || '待接入';
    if (value === 'unavailable') return '未获取';
    return '待接入';
  }

  function money(n) {
    if (isPending(n)) return pendingText(n);
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    return (
      '¥' +
      Number(n).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function intText(n) {
    if (isPending(n)) return pendingText(n);
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    return Number(n).toLocaleString('zh-CN');
  }

  function pct(n) {
    if (isPending(n)) return pendingText(n);
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    return (Math.round(Number(n) * 1000) / 10).toFixed(1) + '%';
  }

  function format(value, type) {
    if (type === 'money') return money(value);
    if (type === 'int') return intText(value);
    if (type === 'pct') return pct(value);
    if (isPending(value)) return pendingText(value);
    if (value == null || value === '') return '—';
    return String(value);
  }

  function valueClass(value) {
    return isPending(value) ? 'is-pending' : '';
  }

  function pageHref(file) {
    var wp = global.wmsPath;
    if (wp && typeof wp.page === 'function') return wp.page(file);
    return file;
  }

  function renderMeta(el, meta) {
    if (!el || !meta) return;
    /* 页面只展示统计时间与更新时间；口径说明不对运营露出 */
    el.innerHTML =
      '<span><strong>统计时间</strong> ' +
      esc(meta.statRange || '—') +
      '</span>' +
      '<span><strong>数据更新</strong> ' +
      esc(meta.updatedAt || '—') +
      '</span>';
  }

  /**
   * 演示主体（门店／供应商／仓库；贸易商本期先不进主体选择）
   * value 形如 type:id，便于筛选态携带类型
   */
  var PARTY_OPTIONS = [
    { type: '门店', id: 'ONS00001', name: '西湖中心生鲜店' },
    { type: '门店', id: 'ONS00004', name: '五角场体验店' },
    { type: '门店', id: 'ONS00002', name: '东城和平里生鲜店' },
    { type: '供应商', id: 'SUP00001', name: '鲜达优选供应链' },
    { type: '供应商', id: 'SUP00002', name: '绿源生鲜批发' },
    { type: '仓库', id: 'WH00001', name: '杭州余杭中心仓' },
    { type: '仓库', id: 'WH00002', name: '上海嘉定仓' }
  ];

  /** 主体选择可选类型（不含贸易商） */
  var PARTY_SELECT_TYPES = ['门店', '供应商', '仓库'];

  function partyTypeOf(party) {
    if (!party || party === 'all') return 'all';
    return String(party).split(':')[0] || 'all';
  }

  /**
   * 主体类型 → 可用订单来源（级联）
   * 门店：零售／代采／POS；供应商：代采为主；仓库：履约相关零售＋代采；贸易商：不按来源切
   */
  function sourceOptionsFor(partyType) {
    if (partyType === '供应商') {
      return [
        { value: 'all', label: '全部来源' },
        { value: 'proxy', label: '代采订单（门店进货）' },
        { value: 'retail', label: '零售供货（商城＋直播）' }
      ];
    }
    if (partyType === '仓库') {
      return [
        { value: 'all', label: '全部来源' },
        { value: 'retail', label: '零售订单（商城＋直播）' },
        { value: 'proxy', label: '代采订单（门店进货）' }
      ];
    }
    if (partyType === '贸易商') {
      return [{ value: 'all', label: '全部来源（贸易商不按订单来源切）' }];
    }
    return [
      { value: 'all', label: '全部来源' },
      { value: 'retail', label: '零售订单（商城＋直播）' },
      { value: 'proxy', label: '代采订单（门店进货）' },
      { value: 'pos', label: 'POS／食亨（待接入）' }
    ];
  }

  /**
   * 主体类型 → 可用履约方式（级联）
   * 门店／仓库：自提＋快递；供应商／贸易商：不按履约切
   */
  function fulfillOptionsFor(partyType) {
    if (partyType === '供应商' || partyType === '贸易商') {
      return [
        {
          value: 'all',
          label:
            partyType === '供应商'
              ? '全部履约（供应商不按履约切）'
              : '全部履约（贸易商不按履约切）'
        }
      ];
    }
    return [
      { value: 'all', label: '全部履约' },
      { value: 'pickup', label: '自提' },
      { value: 'express', label: '快递' }
    ];
  }

  function syncLinkedFilters(state) {
    var type = partyTypeOf(state.party);
    /* 贸易商已从主体选择剔除：若残留旧态则回全部 */
    if (type === '贸易商') {
      state.party = 'all';
      type = 'all';
    }
    var sources = sourceOptionsFor(type).map(function (o) {
      return o.value;
    });
    var fulfills = fulfillOptionsFor(type).map(function (o) {
      return o.value;
    });
    if (sources.indexOf(state.source) < 0) state.source = 'all';
    if (fulfills.indexOf(state.fulfill) < 0) state.fulfill = 'all';
  }

  function optionsHtml(list, selected) {
    return list
      .map(function (o) {
        return (
          '<option value="' +
          esc(o.value) +
          '"' +
          (selected === o.value ? ' selected' : '') +
          '>' +
          esc(o.label) +
          '</option>'
        );
      })
      .join('');
  }

  function partySelectHtml(state) {
    var types = PARTY_SELECT_TYPES;
    var html =
      '<div class="ops-ck__field"><label>主体选择</label><select data-f="party">' +
      '<option value="all"' +
      (state.party === 'all' ? ' selected' : '') +
      '>全部</option>';
    types.forEach(function (type) {
      html += '<optgroup label="' + esc(type) + '">';
      PARTY_OPTIONS.filter(function (p) {
        return p.type === type;
      }).forEach(function (p) {
        var val = p.type + ':' + p.id;
        html +=
          '<option value="' +
          esc(val) +
          '"' +
          (state.party === val ? ' selected' : '') +
          '>' +
          esc(p.name) +
          '</option>';
      });
      html += '</optgroup>';
    });
    html += '</select></div>';
    return html;
  }

  function rangeChipsHtml(state) {
    return (
      '<div class="ops-ck__field"><label>统计日期</label>' +
      '<div class="ops-ck__chips" data-ck-range>' +
      [
        { id: 'today', label: '今日' },
        { id: '7d', label: '近7天' },
        { id: '30d', label: '近30天' },
        { id: 'custom', label: '自定义' }
      ]
        .map(function (opt) {
          return (
            '<button type="button" class="ops-ck-chip' +
            (state.range === opt.id ? ' is-active' : '') +
            '" data-range="' +
            opt.id +
            '">' +
            opt.label +
            '</button>'
          );
        })
        .join('') +
      '</div></div>'
    );
  }

  function bindFilterEvents(host, state, onChange) {
    host.querySelectorAll('[data-range]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.range = btn.getAttribute('data-range') || '30d';
        if (typeof onChange === 'function') onChange();
      });
    });
    host.querySelectorAll('select[data-f]').forEach(function (sel) {
      var key = sel.getAttribute('data-f');
      if (state[key]) sel.value = state[key];
      sel.addEventListener('change', function () {
        state[key] = sel.value;
        if (key === 'party') syncLinkedFilters(state);
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  /**
   * @param {object} [opts]
   * @param {'platform'|'store'} [opts.mode] platform=主体选择；store=区域+门店
   */
  function renderFilters(host, state, onChange, opts) {
    if (!host) return;
    var mode = (opts && opts.mode) || 'platform';
    if (!state.party) state.party = 'all';
    if (!state.source) state.source = 'all';
    if (!state.fulfill) state.fulfill = 'all';
    if (!state.store) state.store = 'all';
    if (!state.region) state.region = 'all';
    syncLinkedFilters(state);

    var html = rangeChipsHtml(state);
    if (mode === 'store') {
      html +=
        '<div class="ops-ck__field"><label>区域</label><select data-f="region">' +
        '<option value="all">全部区域</option><option value="zj">浙江</option><option value="sh">上海</option>' +
        '<option value="bj">北京</option></select></div>' +
        '<div class="ops-ck__field"><label>门店选择</label><select data-f="store">' +
        '<option value="all">全部门店</option>';
      PARTY_OPTIONS.filter(function (p) {
        return p.type === '门店';
      }).forEach(function (p) {
        html += '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
      });
      html += '</select></div>';
    } else {
      var pType = partyTypeOf(state.party);
      html += partySelectHtml(state);
      html +=
        '<div class="ops-ck__field"><label>订单来源</label><select data-f="source">' +
        optionsHtml(sourceOptionsFor(pType), state.source) +
        '</select></div>' +
        '<div class="ops-ck__field"><label>履约方式</label><select data-f="fulfill">' +
        optionsHtml(fulfillOptionsFor(pType), state.fulfill) +
        '</select></div>';
    }

    host.innerHTML = html;
    bindFilterEvents(host, state, onChange);
  }

  function kpiHtml(kpi) {
    var cls = valueClass(kpi.value);
    var click = kpi.href ? ' is-clickable" data-href="' + esc(kpi.href) + '"' : '"';
    return (
      '<div class="ops-ck-kpi' +
      click +
      '>' +
      (kpi.href ? '<span class="ops-ck-kpi__link">更多 ›</span>' : '') +
      '<p class="ops-ck-kpi__label">' +
      esc(kpi.label) +
      '</p>' +
      '<p class="ops-ck-kpi__value ' +
      cls +
      '">' +
      esc(format(kpi.value, kpi.format || 'text')) +
      '</p>' +
      (kpi.hint ? '<p class="ops-ck-kpi__hint">' + esc(kpi.hint) + '</p>' : '') +
      '</div>'
    );
  }

  global.MdmOpsCockpitShared = {
    esc: esc,
    isPending: isPending,
    pendingText: pendingText,
    money: money,
    intText: intText,
    pct: pct,
    format: format,
    valueClass: valueClass,
    pageHref: pageHref,
    renderMeta: renderMeta,
    renderFilters: renderFilters,
    kpiHtml: kpiHtml,
    partyTypeOf: partyTypeOf,
    sourceOptionsFor: sourceOptionsFor,
    fulfillOptionsFor: fulfillOptionsFor,
    syncLinkedFilters: syncLinkedFilters,
    PARTY_OPTIONS: PARTY_OPTIONS,
    PARTY_SELECT_TYPES: PARTY_SELECT_TYPES,
    PENDING: { __pending: true, label: '待接入' },
    UNAVAILABLE: { __pending: true, label: '未获取' }
  };
})(window);
