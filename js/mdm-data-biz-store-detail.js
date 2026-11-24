(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d', channel: 'all', mode: 'sales', back: 'stores' });
  if (state.mode !== 'proxy') state.mode = 'sales';
  var root = document.querySelector('[data-ldb-root]');

  function filters() {
    return {
      period: state.period,
      from: state.from,
      to: state.to,
      line: state.line,
      channel: state.channel
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
    CUi.bindToolbar(root.querySelector('[data-ldb-toolbar]'), state, render, {
      exportName: '单店详情'
    });
    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.filterHint(state);

    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">本店「门店销售」与「门店进货」分开展示，不合并。</p>';

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
        render();
      });
    });

    var amountLabel = mode === 'proxy' ? '代采进货额' : '销售额';
    var goodsAmountLabel = mode === 'proxy' ? '商品进货额' : '商品销售额';

    root.querySelector('[data-ldb-kpis]').innerHTML =
      CUi.kpiCard(amountLabel, CUi.money(data.kpis.sales), '', mode === 'proxy' ? '代采实付含运费' : '零售实付含运费') +
      CUi.kpiCard('订单数', CUi.intText(data.kpis.orders), '', '') +
      CUi.kpiCard(
        '成功退款',
        CUi.money(data.kpis.refundAmount),
        '',
        mode === 'proxy' ? '不冲减进货额' : '不冲减销售额'
      );

    root.querySelector('[data-ldb-blocks]').innerHTML =
      '<div class="ldb-grid-2">' +
      CUi.sectionCard(
        mode === 'proxy' ? '每日进货额' : '每日金额',
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
      '</div>' +
      CUi.sectionCard(
        '订单明细',
        CUi.simpleTable(
          [
            { key: 'orderId', label: '主订单号', render: CUi.orderIdCell },
            { key: 'payTime', label: '支付成功时间' },
            { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
            { key: 'freightSales', label: '运费', num: true, format: 'money' },
            { key: 'purchaseCost', label: '采购成本', num: true, format: 'money' },
            { key: 'goodsMargin', label: '商品毛利', num: true, format: 'money' },
            { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
          ],
          data.orders
        )
      );
  }

  render();
})();
