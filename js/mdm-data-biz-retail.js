(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var state = Ui.readStateFromUrl({ period: 'today', view: 'pay', channel: 'all' });
  var root = document.querySelector('[data-ldb-root]');

  function orderDetailRows(paid, asOfTs) {
    return Biz.metricsForPaidOrders(paid, asOfTs).detailRows || [];
  }

  function openOrderDrawer(rows, orderCount, payGoodsSum) {
    Ui.showDetailTable(
      '零售支付主订单明细',
      rows,
      [
        { key: 'orderId', label: '主订单号' },
        { key: 'channel', label: '来源' },
        { key: 'storeName', label: '门店' },
        { key: 'payTime', label: '支付时间' },
        { key: 'payGoods', label: '商品实付', num: true, format: 'money' },
        { key: 'netGoods', label: '净商品实付', num: true, format: 'money' },
        { key: 'margin', label: '毛利', num: true, format: 'money' }
      ],
      {
        summaryHtml:
          '<p class="ldb-tip ldb-tip--flush">共 <strong>' +
          Biz.intText(orderCount) +
          '</strong> 单（与支付主订单数一致）· 商品实付合计 <strong>' +
          Biz.money(payGoodsSum) +
          '</strong>。按主订单ID去重，供应商子单不重复计数。</p>'
      }
    );
  }

  function render() {
    Ui.writeStateToUrl(state);
    var period = Biz.resolvePeriod(state.period, state.from, state.to);
    var opts = {
      biz: 'retail',
      storeIds: Biz.storeFilterIds({ line: state.line, brand: state.brand, coopType: state.coopType })
    };
    if (state.channel && state.channel !== 'all') opts.channel = state.channel;

    var norm = Biz.filterNormOrders(opts);
    var paid = Biz.paidInPeriod(norm, period.start, period.end);
    var prevPaid = Biz.paidInPeriod(norm, period.compareStart, period.compareEnd);
    var payCur = Biz.metricsForPaidOrders(paid, period.asOf.getTime());
    var payPrev = Biz.metricsForPaidOrders(prevPaid, period.asOf.getTime());
    var cur =
      state.view === 'pay' ? payCur : Biz.metricsEventView(norm, period.start, period.end);
    var prev =
      state.view === 'pay'
        ? payPrev
        : Biz.metricsEventView(norm, period.compareStart, period.compareEnd);
    cur.aov = cur.orderCount ? Biz.round2(cur.payGoods / cur.orderCount) : null;
    prev.aov = prev.orderCount ? Biz.round2(prev.payGoods / prev.orderCount) : null;

    /* 明细／主订单数始终按支付归属圈单，与指标卡入口同范围 */
    var detailRows = orderDetailRows(paid, period.asOf.getTime());
    var orderCountForLink = payCur.orderCount;

    Ui.renderToolbar(Ui.$('[data-ldb-toolbar]', root), state, {
      showChannel: true,
      showStoreFilters: true
    });
    Ui.bindToolbar(Ui.$('[data-ldb-toolbar]', root), state, render);
    var meta = Ui.$('[data-ldb-meta]', root);
    if (meta) meta.textContent = period.label + ' · 对比 ' + period.compareLabel + ' · 零售';

    Ui.$('[data-ldb-tip]', root).innerHTML =
      '<p class="ldb-tip">零售来源按订单保存的商城货架／直播区分，不按曝光重归因。客单价仅统计正常销售货币支付；积分抵扣、纯积分、积分补差不进入正常客单价。</p>';

    var consumerText =
      state.view === 'pay' && cur.consumerCount != null ? Biz.intText(cur.consumerCount) : '—';
    var marginText =
      state.view === 'event' || cur.marginSum == null ? '—' : Biz.money(cur.marginSum);
    var marginHint =
      state.view === 'event'
        ? '请在支付归属视角查看毛利'
        : cur.marginRate == null
          ? '毛利率 —'
          : '毛利率 ' + Biz.pctText(cur.marginRate);

    Ui.$('[data-ldb-kpis]', root).innerHTML =
      Ui.kpiCard(
        '零售支付成交额',
        Biz.money(cur.payTotal),
        Biz.formatDelta(Biz.deltaPack(cur.payTotal, prev.payTotal), true),
        '当前无客户运费'
      ) +
      Ui.kpiCard(
        '支付主订单数',
        Biz.intText(orderCountForLink),
        Biz.formatDelta(Biz.deltaPack(orderCountForLink, payPrev.orderCount), false),
        '',
        { actionText: '查看订单明细', actionAttr: 'data-open-orders' }
      ) +
      Ui.kpiCard('支付人数', consumerText, '', '消费者唯一身份去重') +
      Ui.kpiCard(
        '零售客单价',
        cur.aov == null ? '—' : Biz.money(cur.aov),
        '',
        '金额÷主订单数，周期重算'
      ) +
      Ui.kpiCard('商品交易毛利', marginText, '', marginHint) +
      Ui.kpiCard(
        '零售商品分配所得',
        Biz.money(cur.platformRetailGoods),
        Biz.formatDelta(Biz.deltaPack(cur.platformRetailGoods, prev.platformRetailGoods), true)
      );

    var mallOpts = { biz: 'retail', storeIds: opts.storeIds, channel: 'mall' };
    var liveOpts = { biz: 'retail', storeIds: opts.storeIds, channel: 'live' };
    var mall = Biz.filterNormOrders(mallOpts);
    var live = Biz.filterNormOrders(liveOpts);
    var mallM = Biz.metricsForPaidOrders(
      Biz.paidInPeriod(mall, period.start, period.end),
      period.asOf.getTime()
    );
    var liveM = Biz.metricsForPaidOrders(
      Biz.paidInPeriod(live, period.start, period.end),
      period.asOf.getTime()
    );

    var retailTrend = Biz.trendSeries(norm, period, 'goods');
    Ui.$('[data-ldb-mid]', root).innerHTML =
      '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">支付趋势</h3><span class="ldb-card__extra">' +
      (retailTrend[0] && retailTrend[0].grain === 'hour' ? '按支付小时 · 商品实付' : '按支付日 · 商品实付') +
      '</span></div><div class="ldb-chart">' +
      Ui.renderBars(retailTrend) +
      '</div></section>' +
      '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">来源构成（支付归属）</h3></div>' +
      Ui.renderCompositionPie(
        [
          {
            name: '商城货架',
            value: mallM.payGoods,
            orders: mallM.orderCount,
            color: '#ff7019'
          },
          {
            name: '直播',
            value: liveM.payGoods,
            orders: liveM.orderCount,
            color: '#1677ff'
          }
        ],
        { centerLabel: '合计', ariaLabel: '零售来源支付成交额构成' }
      ) +
      '</section>';

    Ui.bindCompositionPie(Ui.$('[data-ldb-mid] [data-ldb-pie]', root));

    var tableHost = Ui.$('[data-ldb-table]', root);
    if (tableHost) tableHost.innerHTML = '';

    var openBtn = root.querySelector('[data-open-orders]');
    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openOrderDrawer(detailRows, orderCountForLink, payCur.payGoods);
      });
    }
  }

  render();
})();
