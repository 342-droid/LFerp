/** 经营总览 TOP10 与门店经营比较共用的表头、排序和展示。 */
(function (global) {
  'use strict';
  var options = [
    { key: 'retailSales', prev: 'retailSalesPrev', label: '零售支付成交额' },
    { key: 'proxyGoodsSales', prev: 'proxyGoodsSalesPrev', label: '代采商品支付金额' },
    { key: 'platformIncome', prev: 'platformIncomePrev', label: '平台分配所得合计' }
  ];
  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function money(value) {
    return value == null || !isFinite(value) ? '—' : '¥' + Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
  function metric(key) {
    return options.filter(function (item) { return item.key === key; })[0] || options[0];
  }
  function sortRows(rows, key, query) {
    var term = String(query || '').trim().toLowerCase();
    return (rows || []).filter(function (row) {
      return !term || String(row.storeName || '').toLowerCase().indexOf(term) >= 0;
    }).slice().sort(function (a, b) {
      return (Number(b[key]) || 0) - (Number(a[key]) || 0) ||
        String(a.storeId).localeCompare(String(b.storeId));
    });
  }
  function controls(state, full) {
    var html = '<div class="ldb-rank-controls"><label>排序指标 <select data-rank-sort>';
    options.forEach(function (item) {
      html += '<option value="' + item.key + '"' + (state.sort === item.key ? ' selected' : '') + '>' + item.label + '</option>';
    });
    html += '</select></label>';
    if (full) {
      html += '<label>门店名称 <input data-rank-query placeholder="搜索门店" value="' + esc(state.query || '') + '"></label>' +
        '<button type="button" data-rank-clear>清空</button>';
    }
    return html + '</div>';
  }
  function table(rows, state, detailHref, full) {
    var selected = metric(state.sort);
    var sorted = sortRows(rows, selected.key, full ? state.query : '');
    var pageSize = full ? Number(state.pageSize) || 10 : 10;
    var pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    var page = full ? Math.min(Math.max(1, Number(state.page) || 1), pages) : 1;
    state.page = page;
    var visible = full ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted.slice(0, 10);
    var columns = [
      { key: 'retailSales', label: '支付成交额', money: true },
      { key: 'retailOrders', label: '支付主订单数' },
      { key: 'retailMargin', label: '商品交易毛利', money: true },
      { key: 'retailMarginRate', label: '毛利率', pct: true },
      { key: 'proxyGoodsSales', label: '商品支付金额', money: true },
      { key: 'proxyFreightSales', label: '运费支付金额', money: true },
      { key: 'proxyOrders', label: '支付主订单数' },
      { key: 'retailPlatformIncome', label: '零售商品所得', money: true },
      { key: 'proxyPlatformGoodsIncome', label: '代采商品所得', money: true },
      { key: 'proxyPlatformFreightIncome', label: '代采运费所得', money: true },
      { key: 'platformIncome', label: '所得合计', money: true }
    ];
    var html = controls(state, full) + '<div class="ldb-table-wrap ldb-table-wrap--rank">' +
      '<table class="ldb-table ldb-table--unified"><thead><tr class="ldb-th-group">' +
      '<th colspan="4">基础信息</th><th colspan="4">零售经营</th><th colspan="3">代采进货</th>' +
      '<th colspan="4">平台分配所得</th><th colspan="2">对比与操作</th></tr>' +
      '<tr class="ldb-th-sub"><th class="ldb-col-sticky-left">排名</th><th class="ldb-col-sticky-left ldb-col-sticky-left--2">门店</th><th>事业线</th><th>品牌</th>' +
      columns.map(function (col) { return '<th class="num' + (col.key === selected.key ? ' is-sort-col' : '') + '">' + col.label + '</th>'; }).join('') +
      '<th class="num">较上期变化</th><th class="ldb-col-sticky-right">操作</th></tr></thead><tbody>';
    visible.forEach(function (row, index) {
      var current = Number(row[selected.key]) || 0;
      var previous = Number(row[selected.prev]) || 0;
      var delta = previous ? ((current - previous) / previous * 100) : null;
      var deltaText = delta == null ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(1) + '%';
      html += '<tr><td class="ldb-col-sticky-left">' + ((page - 1) * pageSize + index + 1) + '</td>' +
        '<td class="ldb-col-sticky-left ldb-col-sticky-left--2">' + esc(row.storeName) + '</td>' +
        '<td>' + esc(row.line) + '</td><td>' + esc(row.brand) + '</td>' +
        columns.map(function (col) {
          var value = row[col.key];
          var label = col.money ? money(value) : col.pct ? (value == null ? '—' : (value * 100).toFixed(1) + '%') : esc(value == null ? '—' : value);
          return '<td class="num' + (col.key === selected.key ? ' is-sort-col' : '') + '">' + label + '</td>';
        }).join('') +
        '<td class="num">' + deltaText + '</td><td class="ldb-col-sticky-right"><a href="' + esc(detailHref(row)) + '">详情</a></td></tr>';
    });
    if (!visible.length) html += '<tr><td colspan="17" class="ldb-empty">当前筛选暂无门店经营数据</td></tr>';
    html += '</tbody></table></div>';
    if (full) {
      html += '<div class="ldb-rank-pager"><span>共 ' + sorted.length + ' 家</span><label>每页 <select data-rank-size>' +
        [10, 20, 50].map(function (n) { return '<option value="' + n + '"' + (pageSize === n ? ' selected' : '') + '>' + n + ' 家</option>'; }).join('') +
        '</select></label><button type="button" data-rank-prev' + (page <= 1 ? ' disabled' : '') + '>上一页</button>' +
        '<span>第 ' + page + ' / ' + pages + ' 页</span><button type="button" data-rank-next' + (page >= pages ? ' disabled' : '') + '>下一页</button></div>';
    }
    return html;
  }
  function bind(host, state, render) {
    host.querySelector('[data-rank-sort]').addEventListener('change', function (event) {
      state.sort = event.target.value;
      state.page = 1;
      render();
    });
    var query = host.querySelector('[data-rank-query]');
    if (query) query.addEventListener('change', function (event) { state.query = event.target.value; state.page = 1; render(); });
    var clear = host.querySelector('[data-rank-clear]');
    if (clear) clear.addEventListener('click', function () { state.query = ''; state.page = 1; render(); });
    var size = host.querySelector('[data-rank-size]');
    if (size) size.addEventListener('change', function (event) { state.pageSize = Number(event.target.value); state.page = 1; render(); });
    var prev = host.querySelector('[data-rank-prev]');
    if (prev) prev.addEventListener('click', function () { state.page--; render(); });
    var next = host.querySelector('[data-rank-next]');
    if (next) next.addEventListener('click', function () { state.page++; render(); });
  }
  global.MdmDataBizStoreRank = { options: options, sortRows: sortRows, table: table, bind: bind };
})(typeof window !== 'undefined' ? window : this);
