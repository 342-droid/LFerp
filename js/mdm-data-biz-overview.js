(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var SORT_OPTIONS = [
    { id: 'retailPay', label: '零售支付成交额' },
    { id: 'retailMargin', label: '零售商品交易毛利' },
    { id: 'proxyPay', label: '代采商品支付金额' },
    { id: 'proxyMargin', label: '代采商品交易毛利' },
    { id: 'platformTotal', label: '平台分配所得' }
  ];
  var SORT_IDS = SORT_OPTIONS.map(function (x) {
    return x.id;
  });
  var PLAT_SCOPES = [
    { id: 'all', label: '全部业务' },
    { id: 'retail', label: '零售' },
    { id: 'proxy', label: '代采' }
  ];
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
  state.platScope = Ui.normalizePlatScope(state.platScope);
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

  /** 实际排序字段：平台所得随业务范围切换 */
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
    /* 缺失不按 0 参与排名，沉底 */
    if (v == null || v !== v) return Number.NEGATIVE_INFINITY;
    return v;
  }

  function marginBlock(amount, rate) {
    if (amount == null) {
      return '—<div class="ldb-sub">毛利率 —</div>';
    }
    return (
      Biz.money(amount) +
      '<div class="ldb-sub">' +
      (rate == null ? '毛利率 —' : '毛利率 ' + Biz.pctText(rate)) +
      '</div>'
    );
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
    return (
      Biz.money(amount) +
      (opts.partial ? '<div class="ldb-sub">部分已结算</div>' : '')
    );
  }

  function rankColumns(sortKey, platScope) {
    if (sortKey === 'proxyPay') {
      return {
        amountTh: '代采商品支付金额',
        ordersTh: '代采支付主订单数',
        extraTh: '代采商品毛利',
        incomeTh: '代采平台分配所得',
        tip: '代采商品支付金额不含运费；反映门店进货规模，不可与零售成交相加称为门店营业额。所得列为代采商品＋代采运费平台份额。'
      };
    }
    if (sortKey === 'proxyMargin') {
      return {
        amountTh: '代采商品交易毛利',
        ordersTh: '代采支付主订单数',
        extraTh: '代采商品支付金额',
        incomeTh: '代采平台分配所得',
        tip: '毛利按同批代采支付订单计算；所得列为代采商品＋代采运费平台份额，不改变毛利排序。'
      };
    }
    if (sortKey === 'retailMargin') {
      return {
        amountTh: '零售商品交易毛利',
        ordersTh: '零售支付主订单数',
        extraTh: '零售支付成交额',
        incomeTh: '零售平台分配所得',
        tip: '毛利按同批零售支付订单计算；所得列为该店零售商品带来的平台份额，不改变毛利排序。'
      };
    }
    if (sortKey === 'platformTotal') {
      if (platScope === 'retail') {
        return {
          amountTh: '零售平台分配所得',
          ordersTh: '所得说明',
          extraTh: null,
          incomeTh: null,
          tip: '仅按零售商品平台所得降序；业务范围指零售／代采，与事业线筛选无关。'
        };
      }
      if (platScope === 'proxy') {
        return {
          amountTh: '代采平台分配所得',
          ordersTh: '所得构成',
          extraTh: null,
          incomeTh: null,
          tip: '按代采商品＋代采运费平台所得合计降序；构成列展示商品／运费明细。'
        };
      }
      return {
        amountTh: '平台分配所得合计',
        ordersTh: '所得构成',
        extraTh: null,
        incomeTh: null,
        tip: '合计＝已形成的零售商品＋代采商品＋代采运费平台份额；较上期随业务范围同步。不可将零售成交与代采进货相加称为门店营业额。'
      };
    }
    return {
      amountTh: '零售支付成交额',
      ordersTh: '零售支付主订单数',
      extraTh: '零售商品毛利',
      incomeTh: '零售平台分配所得',
      tip: '零售成交反映门店消费者购买规模；代采进货另计，二者不可相加称为门店营业额。所得列不改变成交额排序。'
    };
  }

  function rankAmountCell(row, sortKey) {
    if (sortKey === 'proxyPay') return Biz.money(row.proxyPay);
    if (sortKey === 'proxyMargin') {
      if (row.proxyOrders == null) return '—<div class="ldb-sub">无代采成交</div>';
      if (row.proxyMargin == null) {
        return '—<div class="ldb-sub">' + (row.proxyMarginPending ? '成本未齐' : '毛利率 —') + '</div>';
      }
      return marginBlock(row.proxyMargin, row.proxyMarginRate);
    }
    if (sortKey === 'retailMargin') {
      if (row.retailOrders == null) return '—<div class="ldb-sub">无零售成交</div>';
      if (row.retailMargin == null) {
        return '—<div class="ldb-sub">' + (row.retailMarginPending ? '成本未齐' : '毛利率 —') + '</div>';
      }
      return marginBlock(row.retailMargin, row.retailMarginRate);
    }
    if (sortKey === 'platformTotal') {
      if (state.platScope === 'retail') {
        return platformIncomeCell(row.platformRetail, {
          partial: row.platformRetailPartial,
          pending: row.platformRetailSettlePending,
          emptyTip: row.retailOrders == null ? '无零售成交' : '无分配所得'
        });
      }
      if (state.platScope === 'proxy') {
        return platformIncomeCell(row.platformProxy, {
          partial: row.platformProxyPartial,
          pending: row.platformProxySettlePending,
          emptyTip: row.proxyOrders == null ? '无代采成交' : '无分配所得'
        });
      }
      return platformIncomeCell(row.platformTotal, {
        partial: row.platformTotalPartial,
        pending: row.settlePending
      });
    }
    return Biz.money(row.retailPay);
  }

  function rankDelta(row, sortKey) {
    if (sortKey === 'proxyPay') return Biz.deltaPack(row.proxyPay, row.proxyPayPrev);
    if (sortKey === 'proxyMargin') return Biz.deltaPack(row.proxyMargin, row.proxyMarginPrev);
    if (sortKey === 'retailMargin') return Biz.deltaPack(row.retailMargin, row.retailMarginPrev);
    if (sortKey === 'platformTotal') {
      if (state.platScope === 'retail') {
        return Biz.deltaPack(row.platformRetail, row.platformRetailPrev);
      }
      if (state.platScope === 'proxy') {
        return Biz.deltaPack(row.platformProxy, row.platformProxyPrev);
      }
      return Biz.deltaPack(row.platformTotal, row.platformTotalPrev);
    }
    return Biz.deltaPack(row.retailPay, row.retailPayPrev);
  }

  function rankOrdersCell(row, sortKey) {
    if (sortKey === 'proxyPay' || sortKey === 'proxyMargin') return Biz.intText(row.proxyOrders);
    if (sortKey === 'platformTotal') {
      if (state.platScope === 'retail') {
        return row.platformRetailPartial
          ? '<span class="ldb-sub">部分已结算</span>'
          : row.platformRetail == null
            ? '—'
            : '零售商品所得';
      }
      if (state.platScope === 'proxy') {
        if (row.platformProxy == null) return '—';
        return (
          '<div class="ldb-sub-stack">' +
          '<div>代采商品 ' +
          Biz.money(row.platformProxyGoods) +
          '</div>' +
          '<div>代采运费 ' +
          Biz.money(row.platformProxyFreight) +
          '</div>' +
          (row.platformProxyPartial ? '<div>部分已结算</div>' : '') +
          '</div>'
        );
      }
      if (row.platformTotal == null) return '—';
      return (
        '<div class="ldb-sub-stack">' +
        '<div>零售 ' +
        Biz.money(row.platformRetail) +
        '</div>' +
        '<div>代采 ' +
        Biz.money(row.platformProxy) +
        '</div>' +
        (row.platformTotalPartial ? '<div>部分已结算</div>' : '') +
        '</div>'
      );
    }
    return Biz.intText(row.retailOrders);
  }

  function rankExtraCell(row, sortKey) {
    if (sortKey === 'proxyPay') {
      if (row.proxyOrders == null) return '—<div class="ldb-sub">无代采成交</div>';
      if (row.proxyMargin == null) {
        return '—<div class="ldb-sub">' + (row.proxyMarginPending ? '成本未齐' : '毛利率 —') + '</div>';
      }
      return marginBlock(row.proxyMargin, row.proxyMarginRate);
    }
    if (sortKey === 'proxyMargin') return Biz.money(row.proxyPay);
    if (sortKey === 'retailMargin') return Biz.money(row.retailPay);
    if (sortKey === 'platformTotal') return null;
    if (row.retailOrders == null) return '—<div class="ldb-sub">无零售成交</div>';
    if (row.retailMargin == null) {
      return '—<div class="ldb-sub">' + (row.retailMarginPending ? '成本未齐' : '毛利率 —') + '</div>';
    }
    return marginBlock(row.retailMargin, row.retailMarginRate);
  }

  function rankIncomeCell(row, sortKey) {
    if (sortKey === 'proxyPay' || sortKey === 'proxyMargin') {
      return platformIncomeCell(row.platformProxy, {
        partial: row.platformProxyPartial,
        pending: row.platformProxySettlePending,
        emptyTip: row.proxyOrders == null ? '无代采成交' : '无分配所得'
      });
    }
    if (sortKey === 'retailPay' || sortKey === 'retailMargin') {
      return platformIncomeCell(row.platformRetail, {
        partial: row.platformRetailPartial,
        pending: row.platformRetailSettlePending,
        emptyTip: row.retailOrders == null ? '无零售成交' : '无分配所得'
      });
    }
    return null;
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
            : '毛利率 ' + Biz.pctText(cur.marginRate) + (cur.marginPending ? '（含未齐成本明细）' : ''),
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

    var cols = rankColumns(state.sort, state.platScope);
    var sortKey = activeSortKey();
    var rankAll = Biz.buildStoreRanking(period, filters()).sort(function (a, b) {
      var d = sortValue(b, sortKey) - sortValue(a, sortKey);
      if (d !== 0) return d;
      return String(a.storeName).localeCompare(String(b.storeName), 'zh');
    });
    /* 仅保留当前指标下有可排名数据的门店，再取前 10，不补齐 */
    var rankable = rankAll.filter(function (r) {
      var v = r[sortKey];
      return v != null && v === v;
    });
    var rank = rankable.slice(0, 10);
    var sortSel =
      '<div class="ldb-field ldb-rank-sort"><label>排行</label><select class="ldb-select" data-rank-sort>' +
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

    var headExtra =
      state.view === 'event'
        ? '<span class="ldb-badge-view" title="排行不跟随发生日期口径">按支付订单归属</span>'
        : '';

    var thead =
      '<th class="num">排名</th><th>门店</th><th>事业线</th><th>品牌</th>' +
      '<th class="num">' +
      Biz.esc(cols.amountTh) +
      '</th><th class="num">较上期</th><th class="num">' +
      Biz.esc(cols.ordersTh) +
      '</th>' +
      (cols.extraTh ? '<th class="num">' + Biz.esc(cols.extraTh) + '</th>' : '') +
      (cols.incomeTh ? '<th class="num">' + Biz.esc(cols.incomeTh) + '</th>' : '') +
      '<th>操作</th>';

    var colSpan = 7 + (cols.extraTh ? 1 : 0) + (cols.incomeTh ? 1 : 0) + 1;
    var storesLinkParams = Object.assign({}, state, {
      page: 1,
      pageSize: 10,
      q: '',
      platScope: state.platScope || 'all'
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
      scopeSel +
      '<a class="ldb-link-all" href="' +
      Ui.pageHref('mdm_data_biz_stores.html', storesLinkParams) +
      '">查看全部门店</a>' +
      '</div></div>' +
      '<p class="ldb-tip ldb-tip--flush">' +
      Biz.esc(cols.tip) +
      ' 对比期：' +
      Biz.esc(period.compareLabel) +
      '。本表展示前 ' +
      rank.length +
      ' 名（可排名 ' +
      rankable.length +
      ' 家）；完整列表见「查看全部门店」。</p>' +
      '<div class="ldb-table-wrap"><table class="ldb-table" data-rank-table data-rank-sort="' +
      Biz.esc(state.sort) +
      '" data-plat-scope="' +
      Biz.esc(state.platScope) +
      '"><thead><tr>' +
      thead +
      '</tr></thead><tbody>' +
      (rank.length
        ? rank
            .map(function (r, idx) {
              var extra = rankExtraCell(r, state.sort);
              var income = rankIncomeCell(r, state.sort);
              return (
                '<tr data-store-id="' +
                Biz.esc(r.storeId) +
                '">' +
                '<td class="num ldb-rank-no">' +
                (idx + 1) +
                '</td><td>' +
                Biz.esc(r.storeName) +
                '</td><td>' +
                Biz.esc(r.line) +
                '</td><td>' +
                Biz.esc(r.brand) +
                '</td><td class="num">' +
                rankAmountCell(r, state.sort) +
                '</td><td class="num ldb-delta-cell">' +
                Biz.formatDelta(rankDelta(r, state.sort), true, true) +
                '</td><td class="num">' +
                rankOrdersCell(r, state.sort) +
                '</td>' +
                (extra != null ? '<td class="num">' + extra + '</td>' : '') +
                (income != null ? '<td class="num">' + income + '</td>' : '') +
                '<td><a href="' +
                Ui.pageHref(
                  'mdm_data_biz_store_detail.html',
                  Object.assign({}, state, { storeId: r.storeId, back: 'overview' })
                ) +
                '">详情</a></td></tr>'
              );
            })
            .join('')
        : '<tr><td colspan="' +
          colSpan +
          '"><div class="ldb-empty">暂无可排名门店</div></td></tr>') +
      '</tbody></table></div></section>';

    var sortEl = Ui.$('[data-rank-sort]', root);
    if (sortEl) {
      sortEl.addEventListener('change', function () {
        var next = sortEl.value;
        if (SORT_IDS.indexOf(next) < 0) return;
        state.sort = next;
        render();
      });
    }
    root.querySelectorAll('[data-plat-scope-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.platScope = Ui.normalizePlatScope(btn.getAttribute('data-plat-scope-id'));
        render();
      });
    });

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
              { key: 'orderId', label: '主订单号' },
              { key: 'biz', label: '业务线' },
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
