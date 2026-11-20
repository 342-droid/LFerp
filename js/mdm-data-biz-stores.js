(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var SORT_OPTIONS = Ui.UNIFIED_SORT_OPTIONS;
  var SORT_IDS = SORT_OPTIONS.map(function (x) {
    return x.id;
  });

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
  state.platScope = 'all';
  state.pageSize = Ui.normalizePageSize(state.pageSize);
  var root = document.querySelector('[data-ldb-root]');

  function sortValue(row, key) {
    return Ui.unifiedSortValue(row, key);
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
      '<p class="ldb-tip">零售、代采、平台所得分列同表；切换排序仅改变名次与强调列，不切换表头、不合成门店营业额。' +
      Ui.unifiedSortDeltaLabel(state.sort) +
      '随排序指标同步。口径与总览 TOP10 一致。</p>';

    var sortKey = state.sort;
    rows.sort(function (a, b) {
      var d = sortValue(b, sortKey) - sortValue(a, sortKey);
      if (d !== 0) return d;
      return String(a.storeName).localeCompare(String(b.storeName), 'zh');
    });
    var paged = Ui.paginateRows(rows, state.page, state.pageSize);
    state.page = paged.page;
    state.pageSize = paged.pageSize;
    var pageRows = paged.rows;
    var startRank = (paged.page - 1) * paged.pageSize + 1;

    var searchBar =
      '<div class="ldb-search-bar">' +
      '<div class="ldb-field"><label>门店名称</label>' +
      '<input class="ldb-input" type="search" data-store-q placeholder="输入门店名称关键词" value="' +
      Biz.esc(state.q || '') +
      '"></div>' +
      '<button type="button" class="btn btn-primary" data-store-search style="height:32px;padding:0 12px;">搜索</button>' +
      '<button type="button" class="btn btn-secondary" data-store-clear style="height:32px;padding:0 12px;">清空</button>' +
      '<div class="ldb-field"><label>排序指标</label><select class="ldb-select" data-sort>' +
      SORT_OPTIONS.map(function (x) {
        return (
          '<option value="' +
          x.id +
          '"' +
          (state.sort === x.id ? ' selected' : '') +
          '>' +
          x.label +
          '</option>'
        );
      }).join('') +
      '</select></div></div>';

    Ui.$('[data-ldb-table]', root).innerHTML =
      '<section class="ldb-card">' +
      '<div class="ldb-card__head"><h3 class="ldb-card__title">门店经营比较</h3>' +
      '<span class="ldb-card__extra">共 ' +
      paged.total +
      ' 家门店' +
      (paged.total ? '，当前展示第 ' + paged.from + '–' + paged.to + ' 家' : '') +
      '</span></div>' +
      searchBar +
      Ui.renderUnifiedStoreTableHtml(pageRows, {
        sortKey: sortKey,
        startRank: startRank,
        emptyText: '暂无符合条件的门店',
        detailHref: function (r) {
          return Ui.pageHref(
            'mdm_data_biz_store_detail.html',
            Object.assign({}, state, { storeId: r.storeId, back: 'stores' })
          );
        }
      }) +
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
