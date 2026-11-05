/**
 * 丰银宝 · 供应商 App 筛选工具
 * 时间快捷与 PC「近7天/近30天」口径一致；状态枚举须与 PC 同源，本文件只做便利交互。
 */
(function (global) {
  var TIME_PRESETS = [
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: 'all', label: '全部时间' }
  ];

  /** 与 PC 清分台账清分状态对齐 */
  var CLEAR_STATUSES = ['待清分', '已清分', '清分异常'];
  /** 与 PC 清分台账 / 供应商结算状态对齐（App 取商家高频） */
  var SETTLE_STATUSES = ['待结算', '待结款', '结款中', '部分结款', '已结款', '结款失败'];
  /** 结款单状态（供应商结算单据） */
  var BILL_STATUSES = ['待结款', '部分结款', '结款中', '已结款', '结款失败'];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** 以本地「今天」为结束日，向前推 days-1 天（含今天），对齐 PC 近 N 天 */
  function rangeForPreset(preset) {
    if (!preset || preset === 'all') return null;
    var end = new Date();
    end.setHours(23, 59, 59, 999);
    var start = new Date(end);
    var days = preset === '7d' ? 7 : preset === '30d' ? 30 : 0;
    if (!days) return null;
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return { from: ymd(start), to: ymd(end) };
  }

  function matchTime(timeStr, preset) {
    var range = rangeForPreset(preset);
    if (!range) return true;
    var day = String(timeStr || '').slice(0, 10);
    if (!day) return false;
    return day >= range.from && day <= range.to;
  }

  function chip(value, active, attr, label) {
    return (
      '<button type="button" class="sa-sup-filter__chip' +
      (active ? ' is-active' : '') +
      '" ' +
      attr +
      '="' +
      value +
      '">' +
      (label || value) +
      '</button>'
    );
  }

  function timeRowHtml(activePreset) {
    return (
      '<div class="sa-sup-filter__l2 sa-sup-filter__time" role="tablist" aria-label="时间区间">' +
      TIME_PRESETS.map(function (p) {
        return chip(p.key, activePreset === p.key, 'data-time', p.label);
      }).join('') +
      '</div>'
    );
  }

  global.FybSupplierFilters = {
    TIME_PRESETS: TIME_PRESETS,
    CLEAR_STATUSES: CLEAR_STATUSES,
    SETTLE_STATUSES: SETTLE_STATUSES,
    BILL_STATUSES: BILL_STATUSES,
    rangeForPreset: rangeForPreset,
    matchTime: matchTime,
    chip: chip,
    timeRowHtml: timeRowHtml
  };
})(typeof window !== 'undefined' ? window : this);
