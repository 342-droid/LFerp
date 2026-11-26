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
  var incomeColumns = [
    { key: 'storeIncome', label: '门店所得', num: true, format: 'money' },
    { key: 'platformIncome', label: '平台所得', num: true, format: 'money' }
  ];
  var orderColumns = [
    { key: 'orderId', label: '主订单号', render: CUi.orderIdCell },
    { key: 'biz', label: '业务线' },
    { key: 'storeName', label: '门店' },
    { key: 'payTime', label: '支付成功时间' },
    { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
    { key: 'freightSales', label: '运费', num: true, format: 'money' },
    { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
  ].concat(incomeColumns);
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
    { key: 'retailPlatformIncome', label: '零售平台分配所得', num: true, format: 'money' },
    { key: 'proxyPlatformIncome', label: '代采平台分配所得', num: true, format: 'money' },
    { key: 'platformIncome', label: '平台分配所得', num: true, format: 'money' }
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

  function openTableExport(opts) {
    var title = opts.title || '导出明细';
    var exportName = opts.exportName || title;
    var unitLabel = opts.unitLabel || '条';
    var rows = opts.rows || [];
    var columns = opts.columns || [];
    var checked = {};
    columns.forEach(function (c) {
      checked[c.key] = true;
    });
    function paint() {
      CUi.showDrawer(
        title,
        '<p class="ldb-tip ldb-tip--flush">勾选导出列（默认全选），提交后生成文件中心下载任务。当前筛选共 ' +
          CUi.intText(rows.length) +
          ' ' +
          CUi.esc(unitLabel) +
          '。</p>' +
          '<div class="ldb-drawer-export__cols">' +
          columns
            .map(function (c) {
              return (
                '<label class="ldb-drawer-export__col">' +
                '<input type="checkbox" data-export-col="' +
                CUi.esc(c.key) +
                '"' +
                (checked[c.key] ? ' checked' : '') +
                '> ' +
                CUi.esc(c.label) +
                '</label>'
              );
            })
            .join('') +
          '</div>' +
          '<div class="ldb-drawer-export__actions" style="margin-top:12px">' +
          '<button type="button" class="ldb-chip" data-export-all>全选</button>' +
          '<button type="button" class="ldb-chip is-active" data-export-submit data-lf-skip-export-notify>导出到文件中心</button>' +
          '<button type="button" class="ldb-chip" data-export-cancel>取消</button>' +
          '</div>'
      );
      var body = document.querySelector('[data-ldb-drawer-body]');
      if (!body) return;
      body.querySelectorAll('[data-export-col]').forEach(function (box) {
        box.addEventListener('change', function () {
          checked[box.getAttribute('data-export-col')] = !!box.checked;
        });
      });
      var allBtn = body.querySelector('[data-export-all]');
      if (allBtn) {
        allBtn.addEventListener('click', function () {
          columns.forEach(function (c) {
            checked[c.key] = true;
          });
          paint();
        });
      }
      var cancel = body.querySelector('[data-export-cancel]');
      if (cancel) {
        cancel.addEventListener('click', function () {
          if (typeof CUi.closeDrawer === 'function') CUi.closeDrawer();
        });
      }
      var submit = body.querySelector('[data-export-submit]');
      if (submit) {
        submit.addEventListener('click', function (ev) {
          var picked = columns
            .filter(function (c) {
              return checked[c.key];
            })
            .map(function (c) {
              return c.key;
            });
          CUi.exportRowsToFileCenter(exportName, rows, columns, ev, { columns: picked });
          if (typeof CUi.closeDrawer === 'function') CUi.closeDrawer();
        });
      }
    }
    paint();
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
        CUi.renderPagedTable(orderColumns, data.orders, orderPager, { unitLabel: '单' }),
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
        openTableExport({
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
        openTableExport({
          title: '导出订单明细',
          exportName: '门店订单明细',
          unitLabel: '单',
          rows: data.orders || [],
          columns: orderColumns
        });
      });
    }
  }

  render();
})();
