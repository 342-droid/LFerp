/** 门店本人可见的食亨 POS / 抖音按日明细。 */
(function () {
  var D = window.StoreAppBizDataCenter;
  var S = window.StoreAppBizDcState;
  if (!D || !S) return;
  var state = { source: 'pos', range: 'today', custom: { start: '', end: '' } };
  function $(id) { return document.getElementById(id); }
  function money(n) {
    return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' 元';
  }
  function row(label, value) {
    var div = document.createElement('div');
    div.className = 'sa-dc-source-daily__row';
    var name = document.createElement('span');
    name.textContent = label;
    var amount = document.createElement('strong');
    amount.textContent = money(value);
    div.appendChild(name);
    div.appendChild(amount);
    return div;
  }
  function renderList(rows) {
    var root = $('sourceDailyList');
    root.textContent = '';
    if (!rows.length) {
      var empty = document.createElement('p');
      empty.className = 'sa-dc-empty sa-dc-empty--compact';
      empty.textContent = state.source === 'pos' ? '所选日期暂无食亨账单' : '所选日期暂无抖音数据';
      root.appendChild(empty);
      return;
    }
    rows.forEach(function (item) {
      var isPos = state.source === 'pos';
      var details = document.createElement(isPos ? 'details' : 'div');
      details.className = 'sa-dc-source-daily__day';
      var summary = document.createElement(isPos ? 'summary' : 'div');
      if (!isPos) summary.className = 'sa-dc-source-daily__day-head';
      var date = document.createElement('span');
      date.textContent = item.day;
      var amount = document.createElement('strong');
      amount.textContent = money(item.amount);
      summary.appendChild(date);
      summary.appendChild(amount);
      details.appendChild(summary);
      if (isPos) {
        var body = document.createElement('div');
        body.className = 'sa-dc-source-daily__body';
        body.appendChild(row('堂食', item.dine));
        body.appendChild(row('外卖', item.takeout));
        var platforms = document.createElement('div');
        platforms.className = 'sa-dc-external__platforms';
        platforms.appendChild(row('美团外卖', item.meituan));
        platforms.appendChild(row('京东秒送', item.jingdong));
        platforms.appendChild(row('淘宝闪购', item.taobao));
        body.appendChild(platforms);
        details.appendChild(body);
      }
      root.appendChild(details);
    });
  }
  function render() {
    S.pushUrl({ range: state.range, start: state.custom.start, end: state.custom.end }, 'center');
    var url = new URL(location.href);
    url.searchParams.set('source', state.source);
    history.replaceState(null, '', url);
    S.renderRangeStrip($('sourceRanges'), state.range);
    var bounds = D.resolveRange(state.range, state.custom);
    var rows = D.storeExternalSourceDaily(bounds, state.source);
    var days = Math.max(1, Math.round((bounds.endMs - bounds.startMs) / 86400000));
    var isPos = state.source === 'pos';
    $('sourceBack').href = S.href('biz-center.html', { range: state.range, start: state.custom.start, end: state.custom.end });
    $('sourcePeriod').textContent = '统计日期 ' + bounds.startKey + (bounds.startKey === bounds.endKey ? '' : ' 至 ' + bounds.endKey);
    $('sourceTitle').textContent = isPos ? '食亨 POS 每日账单' : '抖音每日数据';
    $('sourceTotalLabel').textContent = isPos ? '账单营业额' : '营业额';
    $('sourceTotal').textContent = rows.length ? money(rows.reduce(function (sum, item) { return sum + item.amount; }, 0)) : '暂无数据';
    $('sourceCoverage').textContent = (isPos ? '已取得 ' + rows.length + ' 个账单日' : '已取得 ' + rows.length + ' 个统计日') + '，所选周期共 ' + days + ' 天；未取得的日期不按 0 元计算。';
    $('sourceTabs').querySelectorAll('[data-source]').forEach(function (btn) {
      var active = btn.getAttribute('data-source') === state.source;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    renderList(rows);
  }
  function openCustomRange() {
    var defaults = S.customDefaults(state.range, state.custom, function (range, custom) {
      return D.resolveRange(range, custom);
    });
    $('sourceCustomStart').value = defaults.start || D.DEMO_TODAY;
    $('sourceCustomEnd').value = defaults.end || D.DEMO_TODAY;
    $('sourceCustomErr').hidden = true;
    $('sourceRangeSheet').hidden = false;
  }
  function init() {
    var f = S.merge('center');
    var query = new URLSearchParams(location.search);
    state.source = query.get('source') === 'douyin' ? 'douyin' : 'pos';
    state.range = S.normalizeRange(f.range || 'today');
    state.custom = { start: f.start || '', end: f.end || '' };
    if (window.StoreAppBizSession && StoreAppBizSession.boot) StoreAppBizSession.boot();
    $('sourceTabs').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-source]');
      if (!btn) return;
      state.source = btn.getAttribute('data-source');
      render();
    });
    $('sourceRanges').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-range]');
      if (!btn) return;
      var range = btn.getAttribute('data-range');
      if (range === 'custom') {
        openCustomRange();
        return;
      }
      state.range = range;
      state.custom = { start: '', end: '' };
      render();
    });
    $('sourceRangeSheet').addEventListener('click', function (event) {
      if (event.target === this || event.target.closest('[data-close-range]')) this.hidden = true;
    });
    $('sourceCustomApply').addEventListener('click', function () {
      var start = $('sourceCustomStart').value;
      var end = $('sourceCustomEnd').value;
      var err = $('sourceCustomErr');
      if (!start || !end) {
        err.textContent = '请选择开始和结束日期';
        err.hidden = false;
        return;
      }
      if (start > end) {
        err.textContent = '开始日期不能晚于结束日期';
        err.hidden = false;
        return;
      }
      state.range = 'custom';
      state.custom = { start: start, end: end };
      $('sourceRangeSheet').hidden = true;
      render();
    });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
