(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var SORT_OPTIONS = [
    ['retailPay', '零售支付成交额'],
    ['retailMargin', '零售商品交易毛利'],
    ['proxyPay', '代采商品支付金额'],
    ['proxyMargin', '代采商品交易毛利'],
    ['platformTotal', '平台分配所得']
  ];
  var SORT_IDS = SORT_OPTIONS.map(function (x) {
    return x[0];
  });
  var PLAT_SCOPES = [
    { id: 'all', label: '全部业务' },
    { id: 'retail', label: '零售' },
    { id: 'proxy', label: '代采' }
  ];

  var state = Ui.readStateFromUrl({
    period: '30d',
    view: 'pay',
    sort: 'retailPay',
    platScope: 'all',
    page: 1,
    pageSize: 10,
    q: ''
  });
  state.view = 'pay';
  if (SORT_IDS.indexOf(state.sort) < 0) state.sort = 'retailPay';
  state.platScope = Ui.normalizePlatScope(state.platScope);
  state.pageSize = Ui.normalizePageSize(state.pageSize);
  var root = document.querySelector('[data-ldb-root]');

  function activeSortKey() {
    if (state.sort === 'platformTotal') {
      if (state.platScope === 'retail') return 'platformRetail';
      if (state.platScope === 'proxy') return 'platformProxy';
      return 'platformTotal';
    }
    return state.sort;
  }

  function sortValue(row, key) {
    var v = row[key];
    return v == null || v !== v ? Number.NEGATIVE_INFINITY : v;
  }

  function platformIncomeCell(amount, opts) {
    opts = opts || {};
    if (amount == null) {
      return (
        '—<div class="ldb-sub">' +
        (opts.pending > 0 ? '结算未形成' : opts.emptyTip || '无分配所得') +
        '</div>'
      );
    }
    return Biz.money(amount) + (opts.partial ? '<div class="ldb-sub">部分已结算</div>' : '');
  }

  function render() {
    Ui.writeStateToUrl(state);
    var period = Biz.resolvePeriod(state.period, state.from, state.to);
    var filters = {
      line: state.line,
      brand: state.brand,
      coopType: state.coopType
    };
    var keyword = String(state.q || '')
      .trim()
      .toLowerCase();
    var rows = Biz.buildStoreRanking(period, filters).filter(function (r) {
      if (!keyword) return true;
      return (
        String(r.storeName || '')
          .toLowerCase()
          .indexOf(keyword) >= 0
      );
    });

    Ui.renderToolbar(Ui.$('[data-ldb-toolbar]', root), state, {
      showView: false,
      showStoreFilters: true
    });
    Ui.bindToolbar(Ui.$('[data-ldb-toolbar]', root), state, function () {
      state.page = 1;
      render();
    });
    var meta = Ui.$('[data-ldb-meta]', root);
    if (meta) {
      meta.textContent =
        period.label + ' · 支付订单归属 · 筛选后门店 ' + rows.length + ' 家';
    }

    Ui.$('[data-ldb-tip]', root).innerHTML =
      '<p class="ldb-tip">零售成交与代采进货分列展示，不合成门店营业额。平台所得分「零售平台分配所得」「代采平台分配所得」；选择「平台分配所得」排序时可按全部业务／零售／代采切换（与事业线筛选无关）。排序与分页口径与总览门店经营排行一致。</p>';

    var sortKey = activeSortKey();
    rows.sort(function (a, b) {
      var d = sortValue(b, sortKey) - sortValue(a, sortKey);
      if (d !== 0) return d;
      return String(a.storeName).localeCompare(String(b.storeName), 'zh');
    });
    var paged = Ui.paginateRows(rows, state.page, state.pageSize);
    state.page = paged.page;
    state.pageSize = paged.pageSize;
    var pageRows = paged.rows;

    var scopeSel =
      state.sort === 'platformTotal'
        ? '<div class="ldb-field ldb-rank-scope"><label>业务范围</label><div class="ldb-chips" data-plat-scope>' +
          PLAT_SCOPES.map(function (s) {
            return (
              '<button type="button" class="ldb-chip' +
              (state.platScope === s.id ? ' is-active' : '') +
              '" data-plat-scope-id="' +
              s.id +
              '">' +
              s.label +
              '</button>'
            );
          }).join('') +
          '</div></div>'
        : '';

    var searchBar =
      '<div class="ldb-search-bar">' +
      '<div class="ldb-field"><label>门店名称</label>' +
      '<input class="ldb-input" type="search" data-store-q placeholder="输入门店名称关键词" value="' +
      Biz.esc(state.q || '') +
      '"></div>' +
      '<button type="button" class="btn btn-primary" data-store-search style="height:32px;padding:0 12px;">搜索</button>' +
      '<button type="button" class="btn btn-secondary" data-store-clear style="height:32px;padding:0 12px;">清空</button>' +
      '<div class="ldb-field"><label>排序</label><select class="ldb-select" data-sort>' +
      SORT_OPTIONS.map(function (x) {
        return (
          '<option value="' +
          x[0] +
          '"' +
          (state.sort === x[0] ? ' selected' : '') +
          '>' +
          x[1] +
          '</option>'
        );
      }).join('') +
      '</select></div>' +
      scopeSel +
      '</div>';

    Ui.$('[data-ldb-table]', root).innerHTML =
      '<section class="ldb-card">' +
      '<div class="ldb-card__head"><h3 class="ldb-card__title">门店经营比较</h3>' +
      '<span class="ldb-card__extra">共 ' +
      paged.total +
      ' 家门店' +
      (paged.total ? '，当前展示第 ' + paged.from + '–' + paged.to + ' 家' : '') +
      '</span></div>' +
      searchBar +
      '<div class="ldb-table-wrap"><table class="ldb-table"><thead><tr>' +
      '<th class="num">排名</th><th>门店</th><th>事业线</th><th>品牌</th><th>合作类型</th>' +
      '<th class="num">零售成交</th><th class="num">零售单数</th><th class="num">零售人数</th><th class="num">零售客单</th><th class="num">零售毛利</th>' +
      '<th class="num">零售平台分配所得</th>' +
      '<th class="num">代采商品</th><th class="num">代采单数</th><th class="num">进货客单</th><th class="num">代采毛利</th>' +
      '<th class="num">代采平台分配所得</th>' +
      '<th class="num">进货间隔(天)</th><th class="num">平台所得合计</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      (pageRows.length
        ? pageRows
            .map(function (r, idx) {
              var rankNo = (paged.page - 1) * paged.pageSize + idx + 1;
              return (
                '<tr>' +
                '<td class="num ldb-rank-no">' +
                rankNo +
                '</td><td>' +
                Biz.esc(r.storeName) +
                '</td><td>' +
                Biz.esc(r.line) +
                '</td><td>' +
                Biz.esc(r.brand) +
                '</td><td>' +
                Biz.esc(r.coopType) +
                '</td>' +
                '<td class="num">' +
                Biz.money(r.retailPay) +
                '</td><td class="num">' +
                Biz.intText(r.retailOrders) +
                '</td><td class="num">' +
                Biz.intText(r.retailConsumers) +
                '</td><td class="num">' +
                (r.retailAov == null ? '—' : Biz.money(r.retailAov)) +
                '</td><td class="num">' +
                (r.retailOrders == null
                  ? '—'
                  : r.retailMargin == null
                    ? '—<div class="ldb-sub">' +
                      (r.retailMarginPending ? '成本未齐' : '毛利率 —') +
                      '</div>'
                    : Biz.money(r.retailMargin)) +
                '</td>' +
                '<td class="num">' +
                platformIncomeCell(r.platformRetail, {
                  partial: r.platformRetailPartial,
                  pending: r.platformRetailSettlePending,
                  emptyTip: r.retailOrders == null ? '无零售成交' : '无分配所得'
                }) +
                '</td>' +
                '<td class="num">' +
                Biz.money(r.proxyPay) +
                '</td><td class="num">' +
                Biz.intText(r.proxyOrders) +
                '</td><td class="num">' +
                (r.proxyAov == null ? '—' : Biz.money(r.proxyAov)) +
                '</td><td class="num">' +
                (r.proxyOrders == null
                  ? '—'
                  : r.proxyMargin == null
                    ? '—<div class="ldb-sub">' +
                      (r.proxyMarginPending ? '成本未齐' : '毛利率 —') +
                      '</div>'
                    : Biz.money(r.proxyMargin)) +
                '</td>' +
                '<td class="num">' +
                platformIncomeCell(r.platformProxy, {
                  partial: r.platformProxyPartial,
                  pending: r.platformProxySettlePending,
                  emptyTip: r.proxyOrders == null ? '无代采成交' : '无分配所得'
                }) +
                '</td>' +
                '<td class="num">' +
                (r.proxyAvgGap == null ? '—' : Biz.intText(r.proxyAvgGap)) +
                '</td><td class="num">' +
                platformIncomeCell(r.platformTotal, {
                  partial: r.platformTotalPartial,
                  pending: r.settlePending
                }) +
                '</td>' +
                '<td><a href="' +
                Ui.pageHref(
                  'mdm_data_biz_store_detail.html',
                  Object.assign({}, state, { storeId: r.storeId, back: 'stores' })
                ) +
                '">详情</a></td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="19"><div class="ldb-empty">暂无符合条件的门店</div></td></tr>') +
      '</tbody></table></div>' +
      Ui.renderPager({
        total: paged.total,
        page: paged.page,
        pageSize: paged.pageSize
      }) +
      '</section>';

    var sortEl = Ui.$('[data-sort]', root);
    if (sortEl) {
      sortEl.addEventListener('change', function () {
        state.sort = sortEl.value;
        state.page = 1;
        render();
      });
    }
    root.querySelectorAll('[data-plat-scope-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.platScope = Ui.normalizePlatScope(btn.getAttribute('data-plat-scope-id'));
        state.page = 1;
        render();
      });
    });
    var qInput = Ui.$('[data-store-q]', root);
    var searchBtn = Ui.$('[data-store-search]', root);
    var clearBtn = Ui.$('[data-store-clear]', root);
    function applySearch() {
      state.q = (qInput && qInput.value) || '';
      state.page = 1;
      render();
    }
    if (searchBtn) searchBtn.addEventListener('click', applySearch);
    if (qInput) {
      qInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') applySearch();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state.q = '';
        state.page = 1;
        render();
      });
    }
    Ui.bindPager(Ui.$('[data-ldb-pager]', root), state, render);
  }

  render();
})();
