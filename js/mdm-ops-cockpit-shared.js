/**
 * 平台经营驾驶舱 · 公共工具
 * - 未接入／未获取不得展示为 0
 * - 金额类与 GMV／RBT／财务确认收入分列展示
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
    el.innerHTML =
      '<span><strong>统计时间</strong> ' +
      esc(meta.statRange || '—') +
      '</span>' +
      '<span><strong>数据更新</strong> ' +
      esc(meta.updatedAt || '—') +
      '</span>' +
      '<span><strong>口径</strong> ' +
      esc(meta.口径 || meta.caliber || '—') +
      '</span>';
  }

  function renderFilters(host, state, onChange) {
    if (!host) return;
    host.innerHTML =
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
      '</div></div>' +
      '<div class="ops-ck__field"><label>组织</label><select data-f="org">' +
      '<option value="all">全部组织</option><option value="hz">华东</option><option value="bj">华北</option></select></div>' +
      '<div class="ops-ck__field"><label>事业线</label><select data-f="bu">' +
      '<option value="all">全部事业线</option><option value="fresh">生鲜</option></select></div>' +
      '<div class="ops-ck__field"><label>业务线</label><select data-f="line">' +
      '<option value="all">全部（消费者交易）</option><option value="live">直播</option>' +
      '<option value="mall">商城</option><option value="pos">POS</option></select></div>' +
      '<div class="ops-ck__field"><label>渠道</label><select data-f="channel">' +
      '<option value="all">全部渠道</option><option value="app">APP</option><option value="mini">小程序</option></select></div>' +
      '<div class="ops-ck__field"><label>门店</label><select data-f="store">' +
      '<option value="all">全部门店</option><option value="ONS00001">西湖中心生鲜店</option>' +
      '<option value="ONS00004">五角场体验店</option></select></div>' +
      '<div class="ops-ck__field"><label>区域</label><select data-f="region">' +
      '<option value="all">全部区域</option><option value="zj">浙江</option><option value="sh">上海</option></select></div>';

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
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  function kpiHtml(kpi) {
    var cls = valueClass(kpi.value);
    var click = kpi.href
      ? ' is-clickable" data-href="' + esc(kpi.href) + '"'
      : '"';
    return (
      '<div class="ops-ck-kpi' +
      click +
      '>' +
      (kpi.href ? '<span class="ops-ck-kpi__link">下钻 ›</span>' : '') +
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
    PENDING: { __pending: true, label: '待接入' },
    UNAVAILABLE: { __pending: true, label: '未获取' }
  };
})(window);
