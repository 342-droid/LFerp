(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var SORT_OPTIONS = Ui.UNIFIED_SORT_OPTIONS;
  var SORT_IDS = SORT_OPTIONS.map(function (x) {
    return x.id;
  });
  var TREND_METRICS = [
    { id: 'total', label: '成交额合计' },
    { id: 'goods', label: '商品实付' },
    { id: 'freight', label: '运费实付' }
  ];

  var state = Ui.readStateFromUrl({
    period: 'today',
    view: 'pay',
    sort: 'retailPay',
    platScope: 'all'
  });
  if (SORT_IDS.indexOf(state.sort) < 0) state.sort = 'retailPay';
  state.platScope = 'all';
  if (['total', 'goods', 'freight'].indexOf(state.trendMetric) < 0) state.trendMetric = 'total';
  /* 总览排行固定 TOP10，不再读写分页参数 */
  delete state.page;
  delete state.pageSize;
  var root = document.querySelector('[data-ldb-root]');

  function filters() {
    return {
      line: state.line,
      brand: state.brand,
      coopType: state.coopType
    };
  }

  function sortValue(row, key) {
    return Ui.unifiedSortValue(row, key);
  }

  function trendMetricLabel(id) {
    if (id === 'goods') return '商品实付';
    if (id === 'freight') return '运费实付';
    return '商品＋运费（与支付成交额同口径）';
  }

  function render() {
    /* 清掉历史分页参数，避免总览 URL 残留 page／pageSize */
    state.page = '';
    state.pageSize = '';
    Ui.writeStateToUrl(state);
    delete state.page;
    delete state.pageSize;
    var period = Biz.resolvePeriod(state.period, state.from, state.to);
    var data = Biz.composeOverview(period, state.view, filters());
    var storeIds = Biz.storeFilterIds(filters());
    var allNorm = Biz.filterNormOrders({ storeIds: storeIds });

    Ui.renderToolbar(Ui.$('[data-ldb-toolbar]', root), state, { showStoreFilters: true });
    Ui.bindToolbar(Ui.$('[data-ldb-toolbar]', root), state, function () {
      render();
    });

    var meta = Ui.$('[data-ldb-meta]', root);
    if (meta) {
      meta.textContent =
        period.label +
        ' · 对比 ' +
        period.compareLabel +
        ' · ' +
        (state.view === 'pay' ? '支付订单归属' : '发生日期');
    }

    var cur = data.current;
    var prev = data.previous;

    Ui.$('[data-ldb-tip]', root).innerHTML =
      state.view === 'pay'
        ? '<p class="ldb-tip">按支付成功时间看经营表现；退款、成本与平台所得关联到对应支付订单。详细口径见「指标释义」。对比期：' +
          Biz.esc(period.compareLabel) +
          '。</p>'
        : '<p class="ldb-tip">按支付／退款完成／结算创建的发生日观察节奏。净成交不可直接用于计算商品毛利；详细口径见「指标释义」。对比期：' +
          Biz.esc(period.compareLabel) +
          '。</p>';

    var kpiHost = Ui.$('[data-ldb-kpis]', root);
    if (state.view === 'pay') {
      kpiHost.className = 'ldb-kpi-row ldb-kpi-row--5';
      kpiHost.innerHTML =
        Ui.kpiCard(
          '平台支付成交额',
          Biz.money(cur.payTotal),
          Biz.formatDelta(Biz.deltaPack(cur.payTotal, prev.payTotal), true),
          '商品 ' + Biz.money(cur.payGoods) + ' · 运费 ' + Biz.money(cur.payFreight),
          'pay'
        ) +
        Ui.kpiCard(
          '商品交易毛利',
          cur.marginSum == null && cur.marginPending > 0 && cur.marginReady === 0
            ? '—'
            : Biz.money(cur.marginSum),
          '',
          cur.marginRate == null
            ? '毛利率 —'
            : '毛利率 ' + Biz.pctText(cur.marginRate) + (cur.marginPending ? '（成本未齐）' : ''),
          'margin'
        ) +
        Ui.kpiCard(
          '平台分配所得',
          Biz.money(cur.platformTotal),
          Biz.formatDelta(Biz.deltaPack(cur.platformTotal, prev.platformTotal), true),
          '零售商品 ' +
            Biz.money(cur.platformRetailGoods) +
            ' · 代采商品 ' +
            Biz.money(cur.platformProxyGoods) +
            ' · 代采运费 ' +
            Biz.money(cur.platformProxyFreight),
          'platform'
        ) +
        Ui.kpiCard(
          '支付主订单数',
          Biz.intText(cur.orderCount),
          Biz.formatDelta(Biz.deltaPack(cur.orderCount, prev.orderCount), false),
          '零售人数 ' + Biz.intText(data.retail.consumerCount) + ' · 代采门店 ' + Biz.intText(data.proxy.proxyStoreCount)
        ) +
        Ui.kpiCard(
          '成交门店覆盖',
          Biz.intText(
            (cur.retailStoreCount || 0) + (cur.proxyStoreCount || 0) - (cur.bothStoreCount || 0)
          ),
          '',
          '有零售成交 ' +
            Biz.intText(cur.retailStoreCount) +
            ' · 有代采进货 ' +
            Biz.intText(cur.proxyStoreCount) +
            ' · 两者均有 ' +
            Biz.intText(cur.bothStoreCount)
        );
    } else {
      kpiHost.className = 'ldb-kpi-row';
      kpiHost.innerHTML =
        Ui.kpiCard(
          '当期支付成交额',
          Biz.money(cur.payTotal),
          Biz.formatDelta(Biz.deltaPack(cur.payTotal, prev.payTotal), true),
          '商品 ' + Biz.money(cur.payGoods) + ' · 运费 ' + Biz.money(cur.payFreight)
        ) +
        Ui.kpiCard(
          '当期成功退款',
          Biz.money(cur.refundGoods + cur.refundFreight),
          '',
          '商品退 ' + Biz.money(cur.refundGoods) + ' · 运费退 ' + Biz.money(cur.refundFreight)
        ) +
        Ui.kpiCard(
          '当期净成交额',
          Biz.money(cur.netTotal),
          Biz.formatDelta(Biz.deltaPack(cur.netTotal, prev.netTotal), true),
          '支付−退款，可含历史单本期退'
        ) +
        Ui.kpiCard(
          '当期平台分配所得',
          Biz.money(cur.platformTotal),
          Biz.formatDelta(Biz.deltaPack(cur.platformTotal, prev.platformTotal), true),
          '按结算单创建日'
        );
    }

    var sortKey = state.sort;
    var rankAll = Biz.buildStoreRanking(period, filters()).sort(function (a, b) {
      var d = sortValue(b, sortKey) - sortValue(a, sortKey);
      if (d !== 0) return d;
      return String(a.storeName).localeCompare(String(b.storeName), 'zh');
    });
    /* 统一门店集合：不因排序指标过滤成三套门店；TOP10 取排序后前 10 */
    var rank = rankAll.slice(0, 10);
    var sortSel =
      '<div class="ldb-field ldb-rank-sort"><label>排序指标</label><select class="ldb-select" data-rank-sort>' +
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
      '</select></div>';

    var headExtra =
      state.view === 'event'
        ? '<span class="ldb-badge-view" title="排行不跟随发生日期口径">按支付订单归属</span>'
        : '';

    var storesLinkParams = Object.assign({}, state, {
      page: 1,
      pageSize: 10,
      q: '',
      platScope: 'all'
    });
    delete storesLinkParams.trendMetric;
    delete storesLinkParams.storeId;
    delete storesLinkParams.back;

    Ui.$('[data-ldb-rank]', root).innerHTML =
      '<section class="ldb-card ldb-card--rank">' +
      '<div class="ldb-card__head">' +
      '<h3 class="ldb-card__title">门店经营排行 TOP10' +
      headExtra +
      '</h3>' +
      '<div class="ldb-card__actions">' +
      sortSel +
      '<a class="ldb-link-all" href="' +
      Ui.pageHref('mdm_data_biz_stores.html', storesLinkParams) +
      '">查看全部门店</a>' +
      '</div></div>' +
      '<p class="ldb-tip ldb-tip--flush">零售、代采、平台所得分列同表展示，切换排序仅改变名次与强调列，不切换表头、不合成门店营业额。' +
      Ui.unifiedSortDeltaLabel(sortKey) +
      '随排序指标同步。对比期：' +
      Biz.esc(period.compareLabel) +
      '。本表展示前 ' +
      rank.length +
      ' 名（筛选后门店 ' +
      rankAll.length +
      ' 家）；完整列表见「查看全部门店」。</p>' +
      Ui.renderUnifiedStoreTableHtml(rank, {
        sortKey: sortKey,
        emptyText: '暂无符合条件的门店',
        detailHref: function (r) {
          return Ui.pageHref(
            'mdm_data_biz_store_detail.html',
            Object.assign({}, state, { storeId: r.storeId, back: 'overview' })
          );
        }
      }) +
      '</section>';

    var sortEl = Ui.$('[data-rank-sort]', root);
    if (sortEl) {
      sortEl.addEventListener('change', function () {
        var next = sortEl.value;
        if (SORT_IDS.indexOf(next) < 0) return;
        state.sort = next;
        render();
      });
    }

    var mid = Ui.$('[data-ldb-mid]', root);
    if (state.view === 'pay') {
      var trend = Biz.trendSeries(allNorm, period, state.trendMetric);
      var trendGrain = trend[0] && trend[0].grain === 'hour' ? 'hour' : 'day';
      var trendChips =
        '<div class="ldb-chips ldb-trend-metrics" data-trend-metric>' +
        TREND_METRICS.map(function (m) {
          return (
            '<button type="button" class="ldb-chip' +
            (state.trendMetric === m.id ? ' is-active' : '') +
            '" data-trend="' +
            m.id +
            '">' +
            m.label +
            '</button>'
          );
        }).join('') +
        '</div>';
      mid.innerHTML =
        '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">支付成交额趋势</h3>' +
        trendChips +
        '</div>' +
        '<p class="ldb-tip ldb-tip--flush">' +
        (trendGrain === 'hour' ? '按支付小时' : '按支付日') +
        ' · 当前展示：' +
        trendMetricLabel(state.trendMetric) +
        '。默认「成交额合计」与上方平台支付成交额同口径。</p>' +
        '<div class="ldb-chart">' +
        Ui.renderBars(trend) +
        '</div></section>' +
        '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">业务线构成</h3></div>' +
        Ui.renderCompositionPie(
          [
            {
              name: '零售支付成交额',
              value: data.retail.payTotal,
              orders: data.retail.orderCount,
              color: '#ff7019'
            },
            {
              name: '代采支付成交额',
              value: data.proxy.payTotal,
              orders: data.proxy.orderCount,
              color: '#1677ff'
            }
          ],
          { centerLabel: '合计', ariaLabel: '业务线支付成交额构成' }
        ) +
        '<p class="ldb-tip" style="margin-top:14px">零售与代采为两类业务，分别观察，不合成为门店营业额；零售客单价与代采进货客单价也不混合计算。当前零售客单价 ' +
        (data.retail.aov == null ? '—' : Biz.money(data.retail.aov)) +
        ' · 代采进货客单价 ' +
        (data.proxy.aov == null ? '—' : Biz.money(data.proxy.aov)) +
        '（不含运费）。</p>' +
        '</section>';

      mid.querySelectorAll('[data-trend]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.trendMetric = btn.getAttribute('data-trend');
          render();
        });
      });
      Ui.bindCompositionPie(mid.querySelector('[data-ldb-pie]'));
    } else {
      mid.innerHTML =
        '<section class="ldb-card" style="grid-column:1/-1"><div class="ldb-card__head"><h3 class="ldb-card__title">发生日说明</h3></div>' +
        '<p class="ldb-tip">用于观察收退与结算发生节奏。商品交易毛利请切换到「支付订单归属」。不可用本期净成交扣另一批订单成本，也不可用本期结算所得÷本期支付额冒充同批所得率。</p></section>';
    }

    root.querySelectorAll('[data-drill]').forEach(function (el) {
      el.addEventListener('click', function () {
        var key = el.getAttribute('data-drill');
        if (key === 'pay' || key === 'margin') {
          Ui.showDetailTable(
            key === 'pay' ? '支付订单明细（演示）' : '毛利明细（演示）',
            cur.detailRows || [],
            [
              { key: 'orderId', label: '主订单号', link: 'order' },
              { key: 'biz', label: '业务线', format: 'biz' },
              { key: 'storeName', label: '门店' },
              { key: 'payTime', label: '支付时间' },
              { key: 'payGoods', label: '商品实付', num: true, format: 'money' },
              { key: 'netGoods', label: '净商品实付', num: true, format: 'money' },
              { key: 'remainCost', label: '剩余成本', num: true, format: 'money' },
              { key: 'margin', label: '毛利', num: true, format: 'money' }
            ]
          );
        } else if (key === 'platform') {
          var platformFormed = cur.settleReady > 0;
          var drawerHost = document.createElement('div');
          drawerHost.innerHTML =
            Ui.renderCompositionPie(
              [
                {
                  name: '零售商品分配所得',
                  value: platformFormed ? cur.platformRetailGoods : null,
                  color: '#ff7019'
                },
                {
                  name: '代采商品分配所得',
                  value: platformFormed ? cur.platformProxyGoods : null,
                  color: '#1677ff'
                },
                {
                  name: '代采运费分配所得',
                  value: platformFormed ? cur.platformProxyFreight : null,
                  color: '#52c41a'
                }
              ],
              {
                centerLabel: '合计',
                ariaLabel: '平台分配所得构成',
                emptyText: platformFormed ? '暂无成交' : '结算未形成'
              }
            ) +
            '<p class="ldb-tip" style="margin-top:12px">取佣金清算／承运商结算单中归平台的明细，按结算单创建时间关联。不取供应商货款，不取承运商份额。</p>';
          Ui.showDrawer('平台分配所得构成', drawerHost.innerHTML);
          Ui.bindCompositionPie(document.querySelector('[data-ldb-mask] [data-ldb-pie]'));
        }
      });
    });
  }

  render();
})();
