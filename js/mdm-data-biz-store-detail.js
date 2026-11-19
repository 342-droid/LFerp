(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var state = Ui.readStateFromUrl({ period: '30d', view: 'pay' });
  state.view = 'pay';
  var root = document.querySelector('[data-ldb-root]');

  function render() {
    var store = Biz.storeById(state.storeId);
    if (!store) {
      root.innerHTML = '<div class="ldb-empty">未找到门店</div>';
      return;
    }

    Ui.writeStateToUrl(state);
    var period = Biz.resolvePeriod(state.period, state.from, state.to);
    var backParams = Object.assign({}, state);
    delete backParams.storeId;
    var fromPage = state.back === 'overview' ? 'overview' : 'stores';
    delete backParams.back;
    var backFile =
      fromPage === 'overview' ? 'mdm_data_biz_overview.html' : 'mdm_data_biz_stores.html';
    var backLabel = fromPage === 'overview' ? '← 返回经营总览' : '← 返回门店经营比较';

    Ui.renderToolbar(Ui.$('[data-ldb-toolbar]', root), state, { showView: false });
    Ui.bindToolbar(Ui.$('[data-ldb-toolbar]', root), state, render);

    Ui.$('[data-ldb-back]', root).innerHTML =
      '<a class="ldb-back" href="' + Ui.pageHref(backFile, backParams) + '">' + backLabel + '</a>';

    var retail = Biz.metricsForPaidOrders(
      Biz.paidInPeriod(Biz.filterNormOrders({ biz: 'retail', storeId: store.id }), period.start, period.end),
      period.asOf.getTime()
    );
    var proxy = Biz.metricsForPaidOrders(
      Biz.paidInPeriod(Biz.filterNormOrders({ biz: 'proxy', storeId: store.id }), period.start, period.end),
      period.asOf.getTime()
    );
    retail.aov = retail.orderCount ? Biz.round2(retail.payGoods / retail.orderCount) : null;
    proxy.aov = proxy.orderCount ? Biz.round2(proxy.payGoods / proxy.orderCount) : null;

    var rankRows = Biz.buildStoreRanking(period, {});
    var row = rankRows.filter(function (r) {
      return r.storeId === store.id;
    })[0];

    var retailHas = retail.orderCount > 0;
    var proxyHas = proxy.orderCount > 0;
    var platformFormed = retail.settleReady + proxy.settleReady > 0;
    var platformPending = retail.settlePending + proxy.settlePending;
    var platformTotal = platformFormed
      ? Biz.round2(retail.platformRetailGoods + proxy.platformProxyGoods + proxy.platformProxyFreight)
      : null;
    var retailMarginTip =
      !retailHas
        ? '无零售成交'
        : retail.marginSum == null
          ? retail.marginPending
            ? '成本未齐'
            : '毛利率 —'
          : retail.marginRate == null
            ? '毛利率 —'
            : '毛利率 ' + Biz.pctText(retail.marginRate);
    var proxyMarginTip =
      !proxyHas
        ? '无代采成交'
        : proxy.marginSum == null
          ? proxy.marginPending
            ? '成本未齐'
            : '毛利率 —'
          : proxy.marginRate == null
            ? '毛利率 —'
            : '毛利率 ' + Biz.pctText(proxy.marginRate);
    var platformTip = platformFormed
      ? ''
      : platformPending > 0
        ? '结算未形成'
        : '无分配所得';

    Ui.$('[data-ldb-title]', root).innerHTML =
      '<h2 style="margin:0;font-size:18px;">' +
      Biz.esc(store.name) +
      '</h2>' +
      '<p class="ldb-tip" style="margin-top:8px">' +
      Biz.esc(store.line) +
      ' · ' +
      Biz.esc(store.brand) +
      ' · ' +
      Biz.esc(store.coopType) +
      '。无成交不直接判断停业；业绩归属下单时门店快照。</p>';

    Ui.$('[data-ldb-blocks]', root).innerHTML =
      '<section class="ldb-card"><h3 class="ldb-card__title">零售经营</h3>' +
      '<div class="ldb-kpi-row">' +
      Ui.kpiCard('支付成交额', retailHas ? Biz.money(retail.payGoods) : '—', '', retailHas ? '' : '无零售成交') +
      Ui.kpiCard(
        '主订单数',
        retailHas ? Biz.intText(retail.orderCount) : '—',
        '',
        '',
        retailHas
          ? { actionText: '查看订单明细', actionAttr: 'data-open-orders="retail"' }
          : null
      ) +
      Ui.kpiCard('支付人数', retailHas ? Biz.intText(retail.consumerCount) : '—') +
      Ui.kpiCard('客单价', retail.aov == null ? '—' : Biz.money(retail.aov)) +
      Ui.kpiCard('商品毛利', retailHas ? Biz.money(retail.marginSum) : '—', '', retailMarginTip) +
      Ui.kpiCard(
        '有支付天数',
        retailHas ? Biz.intText(row ? row.retailDays : null) : '—',
        '',
        '最近支付 ' + (row && row.retailLastPay ? row.retailLastPay : '—')
      ) +
      '</div></section>' +
      '<section class="ldb-card"><h3 class="ldb-card__title">代采进货</h3>' +
      '<div class="ldb-kpi-row">' +
      Ui.kpiCard('商品支付金额', proxyHas ? Biz.money(proxy.payGoods) : '—', '', proxyHas ? '' : '无代采成交') +
      Ui.kpiCard(
        '主订单数',
        proxyHas ? Biz.intText(proxy.orderCount) : '—',
        '',
        '',
        proxyHas
          ? { actionText: '查看订单明细', actionAttr: 'data-open-orders="proxy"' }
          : null
      ) +
      Ui.kpiCard('进货客单价', proxy.aov == null ? '—' : Biz.money(proxy.aov)) +
      Ui.kpiCard('商品毛利', proxyHas ? Biz.money(proxy.marginSum) : '—', '', proxyMarginTip) +
      Ui.kpiCard(
        '有进货天数',
        proxyHas ? Biz.intText(row ? row.proxyDays : null) : '—',
        '',
        '最近进货 ' + (row && row.proxyLastPay ? row.proxyLastPay : '—')
      ) +
      Ui.kpiCard('相邻进货间隔', row && row.proxyAvgGap != null ? Biz.intText(row.proxyAvgGap) + ' 天' : '—') +
      '</div></section>' +
      '<section class="ldb-card"><h3 class="ldb-card__title">平台分配所得</h3>' +
      '<div class="ldb-kpi-row">' +
      Ui.kpiCard(
        '零售商品所得',
        platformFormed ? Biz.money(retail.platformRetailGoods) : '—',
        '',
        platformTip
      ) +
      Ui.kpiCard('代采商品所得', platformFormed ? Biz.money(proxy.platformProxyGoods) : '—') +
      Ui.kpiCard('代采运费所得', platformFormed ? Biz.money(proxy.platformProxyFreight) : '—') +
      Ui.kpiCard('合计', Biz.money(platformTotal), '', platformTip) +
      '</div></section>';

    root.querySelectorAll('[data-open-orders]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var kind = btn.getAttribute('data-open-orders');
        var rows = kind === 'proxy' ? proxy.detailRows || [] : retail.detailRows || [];
        var count = kind === 'proxy' ? proxy.orderCount : retail.orderCount;
        var goods = kind === 'proxy' ? proxy.payGoods : retail.payGoods;
        Ui.showDetailTable(
          kind === 'proxy' ? '本店代采支付主订单' : '本店零售支付主订单',
          rows,
          [
            { key: 'orderId', label: '主订单号' },
            { key: 'biz', label: '业务线' },
            { key: 'channel', label: '来源' },
            { key: 'payTime', label: '支付时间' },
            { key: 'payGoods', label: '商品实付', num: true, format: 'money' },
            { key: 'payFreight', label: '运费', num: true, format: 'money' },
            { key: 'margin', label: '毛利', num: true, format: 'money' }
          ],
          {
            summaryHtml:
              '<p class="ldb-tip ldb-tip--flush">共 <strong>' +
              Biz.intText(count) +
              '</strong> 单（与主订单数一致）· 商品实付合计 <strong>' +
              Biz.money(goods) +
              '</strong>。按主订单ID去重。</p>'
          }
        );
      });
    });
  }

  render();
})();
