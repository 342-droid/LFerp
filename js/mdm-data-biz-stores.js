(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d', channel: 'all', mode: 'sales' });
  if (state.mode === 'proxy') state.channel = 'proxy';
  if (['all', 'retail', 'proxy', 'mall', 'live'].indexOf(state.channel) < 0) state.channel = 'all';
  var root = document.querySelector('[data-ldb-root]');
  var storePager = { page: 1, pageSize: 10 };
  var orderPager = { page: 1, pageSize: 10 };
  var storeExportColumns = [
    { key: 'storeName', label: '门店' },
    { key: 'line', label: '事业线' },
    { key: 'goodsMargin', label: '商品交易毛利', num: true, format: 'money' },
    {
      key: 'goodsMarginRate',
      label: '毛利率',
      num: true,
      format: 'pct',
      render: function (row, value) {
        return value == null ? '—' : (Number(value) * 100).toFixed(1) + '%';
      }
    },
    { key: 'retailPlatformIncome', label: '零售平台预计所得', num: true, format: 'money' },
    { key: 'retailPlatformIncomeActual', label: '零售平台实际所得', num: true, format: 'money' },
    { key: 'proxyPlatformIncome', label: '代采平台预计所得', num: true, format: 'money' },
    { key: 'proxyPlatformIncomeActual', label: '代采平台实际所得', num: true, format: 'money' },
    { key: 'platformIncome', label: '平台预计所得', num: true, format: 'money' },
    { key: 'platformIncomeActual', label: '平台实际所得', num: true, format: 'money' }
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
      storePager.page = 1;
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

    var goodsAmountLabel = all ? '商品金额' : mode === 'proxy' ? '商品进货额' : '商品销售额';
    root.querySelector('[data-ldb-kpis]').innerHTML = CUi.renderStoreKpis(data, mode, true);

    root.querySelector('[data-ldb-mid]').innerHTML =
      CUi.sectionCard(
        mode === 'proxy' ? '每日进货额' : '每日销售额',
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
          ].concat(CUi.storeIncomeColumns),
          data.products.filter(function (product) { return product.orders > 0; }),
          '当前筛选暂无商品成交样本'
        ) + '<p class="ldb-tip">成交门店、样本订单数及所得按当前筛选的示例订单统计。</p>'
      ) +
      '<div data-ldb-store-list>' +
      CUi.sectionCard(
        '门店列表',
        CUi.renderPagedTable(
          storeExportColumns.concat([
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
          ]),
          storeRank,
          storePager,
          { unitLabel: '家', emptyText: '当前筛选暂无门店经营数据' }
        ),
        '<div class="ldb-card__actions">' +
          '<button type="button" class="ldb-chip is-active" data-store-list-export data-lf-skip-export-notify>导出</button>' +
          '</div>'
      ) +
      '</div>' +
      '<div data-ldb-order-list style="margin-top:14px">' +
      CUi.sectionCard(
        '订单明细',
        CUi.renderPagedTable(CUi.storeOrderColumns, data.orders, orderPager, { unitLabel: '单' }) +
          '<p class="ldb-tip">订单按支付成功时间筛选，实际分佣列仅显示筛选期内已结算的金额。</p>',
        '<div class="ldb-card__actions">' +
          '<button type="button" class="ldb-chip is-active" data-store-orders-export data-lf-skip-export-notify>导出</button>' +
          '</div>'
      ) +
      '</div>';
    CUi.bindPagedTable(root.querySelector('[data-ldb-store-list]'), storePager, render);
    CUi.bindPagedTable(root.querySelector('[data-ldb-order-list]'), orderPager, render);
    var storeExportBtn = root.querySelector('[data-store-list-export]');
    if (storeExportBtn) {
      storeExportBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        CUi.openTableExport({
          title: '导出门店列表',
          exportName: '门店列表',
          unitLabel: '家',
          rows: storeRank || [],
          columns: storeExportColumns
        });
      });
    }
    var orderExportBtn = root.querySelector('[data-store-orders-export]');
    if (orderExportBtn) {
      orderExportBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        CUi.openTableExport({
          title: '导出订单明细',
          exportName: '门店订单明细',
          unitLabel: '单',
          rows: data.orders || [],
          columns: CUi.storeOrderColumns
        });
      });
    }
  }

  render();
})();
