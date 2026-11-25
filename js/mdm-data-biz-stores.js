(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d', channel: 'all', mode: 'sales' });
  if (state.mode === 'proxy') state.channel = 'proxy';
  if (['all', 'retail', 'proxy', 'mall', 'live'].indexOf(state.channel) < 0) state.channel = 'all';
  var root = document.querySelector('[data-ldb-root]');
  var orderPager = { page: 1, pageSize: 10 };
  var incomeColumns = [
    { key: 'storeIncome', label: '门店所得', num: true, format: 'money' },
    { key: 'platformIncome', label: '平台所得', num: true, format: 'money' }
  ];

  function filters() {
    return {
      period: state.period,
      from: state.from,
      to: state.to,
      storeId: state.storeId,
      line: state.line,
      channel: state.channel
    };
  }

  function render() {
    state.mode = state.channel === 'proxy' ? 'proxy' : 'sales';
    CUi.writeState(state);
    var mode = state.channel === 'all' ? 'all' : state.mode;
    var all = mode === 'all';
    var data = Center.storeDaily(filters(), mode);
    var storeRank = Center.erpSnapshot(filters()).storeRank;

    CUi.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      salesScope: true,
      exportName: '门店分析'
    });
    CUi.bindToolbar(root.querySelector('[data-ldb-toolbar]'), state, function () {
      orderPager.page = 1;
      render();
    }, {
      exportName: '门店分析'
    });
    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.filterHint(state);

    root.querySelector('[data-ldb-tip]').innerHTML =
      all ? '<p class="ldb-tip">全部业务线汇总零售销售和代采进货，两类金额在总额下分列。</p>' : mode === 'proxy'
        ? '<p class="ldb-tip"><strong>门店进货</strong>仅统计代采订单；与门店销售分开，不合并。使用门店事业线字段筛选。</p>'
        : '<p class="ldb-tip"><strong>门店销售</strong>仅统计零售订单；与门店进货分开，不合并。使用门店事业线字段筛选。</p>';

    var amountLabel = all ? '支付总额' : mode === 'proxy' ? '代采进货额' : '销售额';
    var goodsAmountLabel = all ? '商品金额' : mode === 'proxy' ? '商品进货额' : '商品销售额';
    function commissionCard(label, key, noValueHint) {
      var entries = data.orders.filter(function (row) { return row[key] != null; });
      var amount = entries.reduce(function (sum, row) { return sum + row[key]; }, 0);
      return CUi.kpiCard(label, entries.length ? CUi.money(amount) : '—', '',
        entries.length ? '按当前筛选的订单清分示例汇总' : noValueHint);
    }

    root.querySelector('[data-ldb-kpis]').innerHTML =
      CUi.kpiCard(
        amountLabel,
        CUi.money(data.kpis.sales),
        '',
        all ? '零售 ' + CUi.money(data.retailKpis.sales) + ' · 代采 ' + CUi.money(data.proxyKpis.sales) :
          mode === 'proxy' ? '代采实付含运费' : '零售实付含运费'
      ) +
      CUi.kpiCard('订单数', CUi.intText(data.kpis.orders), '', '支付成功主订单') +
      CUi.kpiCard(
        '成功退款',
        CUi.money(data.kpis.refundAmount),
        '',
        mode === 'proxy' ? '单独展示，不冲减进货额' : '单独展示，不冲减销售额'
      ) +
      CUi.kpiCard(
        mode === 'proxy' ? '有进货门店' : '有成交门店',
        CUi.intText(data.stores.length),
        '',
        '当前筛选'
      ) +
      commissionCard('门店分佣所得', 'storeIncome', mode === 'proxy' ? '代采订单无门店分佣' : '当前筛选暂无门店分佣记录') +
      commissionCard('平台分佣所得', 'platformIncome', '当前筛选暂无平台分佣记录');

    root.querySelector('[data-ldb-mid]').innerHTML =
      CUi.sectionCard(
        all ? '每日支付总额' : mode === 'proxy' ? '每日进货额' : '每日金额',
        '<div class="ldb-chart">' +
          CUi.renderBars(
            data.daily.map(function (d) {
              return { date: d.date, value: d.sales, grain: 'day' };
            })
          ) +
          '</div>'
      );
    root.querySelector('[data-ldb-table]').innerHTML =
      CUi.sectionCard(
        '商品排行',
        CUi.simpleTable(
          [
            { key: 'name', label: '商品' },
            { key: 'biz', label: '业务线' },
            {
              key: 'storeNames', label: '成交门店',
              render: function (row) {
                var names = row.storeNames;
                if (names.length < 2) return CUi.esc(names[0] || '—');
                return '<details><summary>' + names.length + ' 家</summary>' +
                  names.map(function (name) { return '<div>' + CUi.esc(name) + '</div>'; }).join('') + '</details>';
              }
            },
            { key: 'sales', label: goodsAmountLabel, num: true, format: 'money' },
            { key: 'qty', label: '数量', num: true, format: 'int' },
            { key: 'orders', label: '样本订单数', num: true, format: 'int' },
            { key: 'margin', label: '商品毛利', num: true, format: 'money' },
            { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
          ].concat(incomeColumns),
          data.products.filter(function (product) { return product.orders > 0; }),
          '当前筛选暂无商品成交样本'
        ) + '<p class="ldb-tip">成交门店、样本订单数及所得按当前筛选的示例订单统计。</p>'
      ) +
      CUi.sectionCard(
        '门店列表',
        CUi.simpleTable(
          [
            { key: 'storeName', label: '门店' },
            { key: 'line', label: '事业线' },
            { key: 'goodsMargin', label: '商品交易毛利', num: true, format: 'money' },
            { key: 'goodsMarginRate', label: '毛利率', num: true, render: function (row, value) {
              return value == null ? '—' : (value * 100).toFixed(1) + '%';
            } },
            { key: 'retailPlatformIncome', label: '零售平台分配所得', num: true, format: 'money' },
            { key: 'proxyPlatformIncome', label: '代采平台分配所得', num: true, format: 'money' },
            { key: 'platformIncome', label: '平台分配所得', num: true, format: 'money' },
            {
              key: 'storeId',
              label: '操作',
              render: function (r) {
                return (
                  '<a href="' +
                  CUi.pageHref('mdm_data_biz_store_detail.html', {
                    storeId: r.storeId,
                    mode: all ? 'sales' : mode,
                    period: state.period,
                    line: state.line,
                    channel: state.channel === 'mall' || state.channel === 'live' ? state.channel : 'all',
                    from: state.from,
                    to: state.to,
                    back: all ? 'stores-all' : 'stores'
                  }) +
                  '">详情</a>'
                );
              }
            }
          ],
          storeRank
        )
      ) +
      CUi.sectionCard(
        '订单明细',
        CUi.renderPagedTable(
          [
            { key: 'orderId', label: '主订单号', render: CUi.orderIdCell },
            { key: 'biz', label: '业务线' },
            { key: 'storeName', label: '门店' },
            { key: 'payTime', label: '支付成功时间' },
            { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
            { key: 'freightSales', label: '运费', num: true, format: 'money' },
            { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
          ].concat(incomeColumns),
          data.orders, orderPager, { unitLabel: '单' }
        )
      );
    CUi.bindPagedTable(root.querySelector('[data-ldb-table]'), orderPager, render);
  }

  render();
})();
