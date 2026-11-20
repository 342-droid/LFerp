(function () {
  var Biz = window.MdmDataBiz;
  var Ui = window.MdmDataBizUi;
  if (!Biz || !Ui) return;

  var state = Ui.readStateFromUrl({ period: 'today', view: 'pay' });
  var root = document.querySelector('[data-ldb-root]');

  function openOrderDrawer(rows, orderCount, payGoodsSum, payFreightSum) {
    Ui.showDetailTable(
      '代采支付主订单明细',
      rows,
      [
        { key: 'orderId', label: '主订单号', link: 'order' },
        { key: 'storeName', label: '采购门店' },
        { key: 'payTime', label: '支付时间' },
        { key: 'payGoods', label: '商品实付', num: true, format: 'money' },
        { key: 'payFreight', label: '运费实付', num: true, format: 'money' },
        { key: 'netGoods', label: '净商品实付', num: true, format: 'money' },
        { key: 'margin', label: '毛利', num: true, format: 'money' }
      ],
      {
        summaryHtml:
          '<p class="ldb-tip ldb-tip--flush">共 <strong>' +
          Biz.intText(orderCount) +
          '</strong> 单（与支付主订单数一致）· 商品实付 <strong>' +
          Biz.money(payGoodsSum) +
          '</strong> · 运费实付 <strong>' +
          Biz.money(payFreightSum) +
          '</strong>。按主订单ID去重，供应商子单不重复计数。</p>'
      }
    );
  }

  function render() {
    Ui.writeStateToUrl(state);
    var period = Biz.resolvePeriod(state.period, state.from, state.to);
    var opts = {
      biz: 'proxy',
      storeIds: Biz.storeFilterIds({
        line: state.line,
        brand: state.brand,
        coopType: state.coopType
      })
    };
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

    var detailRows = payCur.detailRows || [];
    var orderCountForLink = payCur.orderCount;

    Ui.renderToolbar(Ui.$('[data-ldb-toolbar]', root), state, { showStoreFilters: true });
    Ui.bindToolbar(Ui.$('[data-ldb-toolbar]', root), state, render);
    var meta = Ui.$('[data-ldb-meta]', root);
    if (meta) meta.textContent = period.label + ' · 对比 ' + period.compareLabel + ' · 代采';

    Ui.$('[data-ldb-tip]', root).innerHTML =
      '<p class="ldb-tip">代采商品支付与运费支付分列。进货客单价不含运费。进货多只说明平台采购规模，不代表门店终端卖得好。混合订单无系统分摊时按商品实付占比剔除测试商品运费份额。</p>';

    Ui.$('[data-ldb-kpis]', root).innerHTML =
      Ui.kpiCard(
        '代采支付成交额',
        Biz.money(cur.payTotal),
        Biz.formatDelta(Biz.deltaPack(cur.payTotal, prev.payTotal), true),
        '商品 ' + Biz.money(cur.payGoods) + ' · 运费 ' + Biz.money(cur.payFreight)
      ) +
      Ui.kpiCard('商品支付金额', Biz.money(cur.payGoods), '', '已剔除运费') +
      Ui.kpiCard('运费支付金额', Biz.money(cur.payFreight), '', '测试商品运费份额已剔除') +
      Ui.kpiCard(
        '支付主订单数',
        Biz.intText(orderCountForLink),
        Biz.formatDelta(Biz.deltaPack(orderCountForLink, payPrev.orderCount), false),
        '',
        { actionText: '查看订单明细', actionAttr: 'data-open-orders' }
      ) +
      Ui.kpiCard(
        '支付门店数',
        state.view === 'pay' && cur.proxyStoreCount != null ? Biz.intText(cur.proxyStoreCount) : '—',
        '',
        '采购门店编号去重'
      ) +
      Ui.kpiCard(
        '代采进货客单价',
        cur.aov == null ? '—' : Biz.money(cur.aov),
        '',
        '商品实付÷主订单数'
      ) +
      Ui.kpiCard(
        '商品交易毛利',
        state.view === 'event' || cur.marginSum == null ? '—' : Biz.money(cur.marginSum),
        '',
        state.view === 'event'
          ? '请切支付归属视角'
          : cur.marginRate == null
            ? '毛利率 —'
            : '毛利率 ' + Biz.pctText(cur.marginRate)
      ) +
      Ui.kpiCard(
        '平台分配所得',
        Biz.money(Biz.round2((cur.platformProxyGoods || 0) + (cur.platformProxyFreight || 0))),
        '',
        '商品 ' +
          Biz.money(cur.platformProxyGoods) +
          ' · 运费平台份额 ' +
          Biz.money(cur.platformProxyFreight)
      );

    var proxyTrend = Biz.trendSeries(norm, period, 'goods');
    Ui.$('[data-ldb-mid]', root).innerHTML =
      '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">商品支付趋势</h3><span class="ldb-card__extra">' +
      (proxyTrend[0] && proxyTrend[0].grain === 'hour' ? '按支付小时 · 商品实付' : '按支付日 · 商品实付') +
      '</span></div><div class="ldb-chart">' +
      Ui.renderBars(proxyTrend) +
      '</div></section>' +
      '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">支付构成</h3></div>' +
      Ui.renderCompositionPie(
        [
          {
            name: '商品支付金额',
            value: cur.payGoods,
            orders: orderCountForLink,
            color: '#ff7019'
          },
          {
            name: '运费支付金额',
            value: cur.payFreight,
            color: '#1677ff'
          }
        ],
        { centerLabel: '合计', ariaLabel: '代采支付金额构成' }
      ) +
      '<p class="ldb-tip" style="margin-top:14px">商品实付与运费实付分列；进货客单价不含运费。平台运费份额取承运商结算单中的平台明细，不取承运商份额。</p></section>';

    Ui.$('[data-ldb-table]', root).innerHTML =
      '<section class="ldb-card"><div class="ldb-card__head"><h3 class="ldb-card__title">平台所得构成</h3></div>' +
      Ui.renderCompositionPie(
        [
          {
            name: '代采商品分配所得',
            value: cur.settleReady > 0 ? cur.platformProxyGoods : null,
            color: '#ff7019'
          },
          {
            name: '代采运费分配所得',
            value: cur.settleReady > 0 ? cur.platformProxyFreight : null,
            color: '#52c41a'
          }
        ],
        {
          centerLabel: '合计',
          ariaLabel: '代采平台分配所得构成',
          emptyText: cur.settleReady > 0 ? '暂无成交' : '结算未形成'
        }
      ) +
      '</section>';

    root.querySelectorAll('[data-ldb-pie]').forEach(function (el) {
      Ui.bindCompositionPie(el);
    });

    var openBtn = root.querySelector('[data-open-orders]');
    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openOrderDrawer(detailRows, orderCountForLink, payCur.payGoods, payCur.payFreight);
      });
    }
  }

  render();
})();
