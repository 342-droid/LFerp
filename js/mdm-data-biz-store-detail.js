(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d', channel: 'all', mode: 'sales', back: 'stores' });
  if (state.mode !== 'proxy') state.mode = 'sales';
  var root = document.querySelector('[data-ldb-root]');
  var orderPager = { page: 1, pageSize: 10 };
  var orderColumns = CUi.storeOrderColumns.slice(0, 7).concat([
    { key: 'actualPurchaseCost', label: '采购成本', num: true, format: 'money' },
    { key: 'actualGoodsMargin', label: '商品毛利', num: true, format: 'money' }
  ], CUi.storeOrderColumns.slice(7));

  function filters() {
    return {
      period: state.period,
      from: state.from,
      to: state.to,
      line: state.line,
      channel: state.mode === 'proxy' || state.channel === 'proxy' ? 'all' : state.channel
    };
  }

  function render() {
    CUi.writeState(state);
    if (!state.storeId) {
      root.querySelector('[data-ldb-blocks]').innerHTML = CUi.emptyBlock('未指定门店');
      return;
    }
    var mode = state.mode === 'proxy' ? 'proxy' : 'sales';
    var data = Center.storeDetail(state.storeId, filters(), mode);
    var st = data.store;

    var backHref =
      state.back === 'overview'
        ? CUi.pageHref('mdm_data_biz_overview.html', {
            period: state.period,
            line: state.line,
            channel: state.channel
          })
        : CUi.pageHref('mdm_data_biz_stores.html', {
            mode: state.back === 'stores-all' ? 'sales' : mode,
            period: state.period,
            line: state.line,
            channel: state.back === 'stores-all' ? 'all' : state.channel,
            from: state.from,
            to: state.to
          });

    root.querySelector('[data-ldb-back]').innerHTML =
      '<a class="ldb-back" href="' + backHref + '">← 返回</a>';
    root.querySelector('[data-ldb-title]').innerHTML =
      '<h2 class="ldb-section-title" style="margin:0 0 8px">' +
      CUi.esc(st ? st.name : state.storeId) +
      (st ? ' · ' + CUi.esc(st.line) + ' / ' + CUi.esc(st.brand) : '') +
      '</h2>';

    CUi.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      showStore: false,
      showChannel: mode === 'sales',
      exportName: '单店详情'
    });
    CUi.bindToolbar(root.querySelector('[data-ldb-toolbar]'), state, function () {
      orderPager.page = 1;
      render();
    }, {
      exportName: '单店详情'
    });
    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.filterHint(state);

    root.querySelector('[data-ldb-tabs]').innerHTML = CUi.pageTabs(
      [
        { id: 'sales', label: '门店销售（零售）' },
        { id: 'proxy', label: '门店进货（代采）' }
      ],
      mode
    );
    root.querySelectorAll('[data-page-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.mode = btn.getAttribute('data-page-tab');
        orderPager.page = 1;
        render();
      });
    });

    var goodsAmountLabel = mode === 'proxy' ? '商品进货额' : '商品销售额';
    root.querySelector('[data-ldb-kpis]').innerHTML = CUi.renderStoreKpis(data, mode, false);

    root.querySelector('[data-ldb-blocks]').innerHTML =
      '<div class="ldb-grid-2">' +
      CUi.sectionCard(
        mode === 'proxy' ? '每日进货额' : '每日销售额',
        '<div class="ldb-chart">' +
          CUi.renderBars(
            data.daily.map(function (d) {
              return { date: d.date, value: d.sales, grain: 'day' };
            })
          ) +
          '</div>'
      ) +
      CUi.sectionCard(
        '商品排行',
        CUi.simpleTable(
          [
            { key: 'name', label: '商品' },
            { key: 'sales', label: goodsAmountLabel, num: true, format: 'money' },
            { key: 'qty', label: '数量', num: true, format: 'int' },
            { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
          ],
          data.products
        )
      ) +
      '</div><div data-ldb-single-store-orders>' +
      CUi.sectionCard(
        '订单明细',
        CUi.renderPagedTable(orderColumns, data.orders, orderPager, { unitLabel: '单' }) +
          '<p class="ldb-tip">订单按支付成功时间筛选，实际分佣列仅显示筛选期内已结算的金额。</p>',
        '<div class="ldb-card__actions"><button type="button" class="ldb-chip is-active" ' +
          'data-order-list-export data-lf-skip-export-notify' + (data.orders.length ? '' : ' disabled') +
          '>导出</button></div>'
      ) + '</div>';

    CUi.bindPagedTable(root.querySelector('[data-ldb-single-store-orders]'), orderPager, render);
    root.querySelector('[data-order-list-export]').addEventListener('click', function () {
      CUi.openTableExport({
        title: '导出订单明细',
        exportName: (st ? st.name : state.storeId) + (mode === 'proxy' ? '代采' : '零售') + '订单明细',
        unitLabel: '单',
        rows: data.orders,
        columns: orderColumns
      });
    });
  }

  render();
})();
