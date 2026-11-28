(function () {
  var Center = window.MdmDataBizCenter;
  var Ui = window.MdmDataBizCenterUi;
  if (!Center || !Ui) return;

  var state = Ui.readState({ period: '30d', channel: 'all' });
  state.storeId = '';
  state.line = '';
  var root = document.querySelector('[data-ldb-root]');
  var table = root.querySelector('[data-ldb-table]');
  var toolbar = root.querySelector('[data-ldb-toolbar]');
  var pager = { page: 1, pageSize: 10 };
  var exampleProducts = Center.erpSnapshot({ period: '30d' }).products;
  var suppliers = Center.SUPPLIERS.concat(Array.from({ length: 12 }, function (_, index) {
    return { id: 'SUP-DEMO-' + (index + 1), name: '示例供应商 ' + (index + 1) };
  }));
  var amounts = [
    moneyColumn('sales', '商品销售额'),
    moneyColumn('refundAmount', '退款金额'),
    moneyColumn('cost', '支付时采购成本'),
    moneyColumn('costAfterRefund', '退款后采购成本'),
    moneyColumn('margin', '预计商品毛利'),
    moneyColumn('actualMargin', '实际商品毛利'),
    moneyColumn('platformIncome', '平台预计所得'),
    moneyColumn('platformIncomeActual', '平台实际所得')
  ];
  var splitKeys = ['sales', 'cost', 'costAfterRefund', 'margin', 'actualMargin', 'platformIncome', 'platformIncomeActual'];
  var businessLines = ['零售', '代采'];
  var listAmounts = amounts.flatMap(function (column) {
    if (!['sales', 'margin', 'actualMargin', 'platformIncome', 'platformIncomeActual'].includes(column.key)) return [column];
    return businessLines.map(function (biz) {
      return Object.assign({}, column, { key: column.key + biz, label: biz + column.label });
    });
  });
  var orderColumn = { key: 'orders', label: '订单数', num: true, format: 'int' };

  function moneyColumn(key, label) {
    return { key: key, label: label, num: true, format: 'money' };
  }

  function orderCount(rows) {
    var ids = new Set();
    rows.forEach(function (row) { row.orderIds.forEach(function (id) { ids.add(id); }); });
    return ids.size;
  }

  function productRows(supplier) {
    var known = exampleProducts.filter(function (product) {
      return product.supplier === supplier.name;
    });
    var scale = Center.scaleOf(state.period);
    var rows = [];
    for (var index = 0; index < 12; index++) {
      var product = known[index];
      var id = supplier.id + '-' + (index + 1);
      var name = product ? product.name : '示例商品 ' + (index + 1);
      [
        { key: 'mall', biz: '零售', channel: '商城', share: 0.42, sampleIncomePerOrder: 1.20 },
        { key: 'live', biz: '零售', channel: '直播', share: 0.30, sampleIncomePerOrder: 1.05 },
        { key: 'proxy', biz: '代采', channel: '—', share: 0.28, sampleIncomePerOrder: 1.40 }
      ].forEach(function (scope) {
        if (state.channel === 'retail' && scope.key === 'proxy') return;
        if (state.channel !== 'all' && state.channel !== 'retail' && state.channel !== scope.key) return;
        var factor = scale * scope.share;
        var sales = Math.round((product ? product.sales : 4800 + index * 145) * factor * 100);
        var cost = Math.round((product ? product.cost : 2800 + index * 100) * factor * 100);
        var qty = Math.round((product ? product.qty : 120 + index * 10) * factor);
        var orderIds = Array.from({ length: Math.ceil(qty / 4) }, function (_, orderIndex) {
          return scope.key + '-' + (index * 5 + orderIndex);
        });
        var returnedQty = Math.min(qty, Math.round((product ? product.refundQty : index % 4) * factor));
        var costAfterRefund = qty ? cost - Math.round(cost * returnedQty / qty) : cost;
        // 原型样本中部分商品订单仍待结算，已结算部分按相同清分单价计入。
        var settledCount = Math.floor(orderIds.length * (index % 3 === 0 ? 0.7 : 0.9));
        rows.push({
          id: id, name: name, biz: scope.biz, channel: scope.channel,
          qty: qty, orderIds: orderIds, orders: orderIds.length,
          sales: sales / 100, cost: cost / 100, costAfterRefund: costAfterRefund / 100,
          margin: (sales - cost) / 100, actualMargin: (sales - costAfterRefund) / 100,
          refundAmount: Math.round((product ? product.refundAmount : 80 + index * 15) * factor * 100) / 100,
          platformIncome: Math.round(orderIds.length * scope.sampleIncomePerOrder * 100) / 100,
          platformIncomeActual: settledCount ? Math.round(settledCount * scope.sampleIncomePerOrder * 100) / 100 : null
        });
      });
    }
    return rows;
  }

  function sum(rows, key) {
    var available = rows.filter(function (row) { return row[key] != null; });
    return available.length ? available.reduce(function (total, row) {
      return total + Math.round(row[key] * 100);
    }, 0) / 100 : null;
  }

  function render() {
    Ui.writeState(state);
    var selected = suppliers.find(function (supplier) { return supplier.id === state.supplierId; });
    var rows = (selected ? [selected] : suppliers).map(function (supplier) {
      var products = productRows(supplier);
      var row = Object.assign({ products: products, orders: orderCount(products) }, supplier);
      amounts.forEach(function (column) { row[column.key] = sum(products, column.key); });
      businessLines.forEach(function (biz) {
        var matching = products.filter(function (product) { return product.biz === biz; });
        splitKeys.forEach(function (key) {
          row[key + biz] = matching.length ? sum(matching, key) : null;
        });
      });
      return row;
    });
    Ui.renderToolbar(toolbar, state, {
      salesScope: true, showStore: false, showLine: false, showSupplier: true, suppliers: suppliers
    });
    Ui.bindToolbar(toolbar, state, function () {
      pager.page = 1;
      render();
    }, { exportName: '供应商分析' });
    toolbar.querySelector('[data-ldb-meta]').textContent = Ui.periodLabel(state) + ' · ' +
      (selected ? selected.name : '全部供应商');
    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">按商品供应商归属汇总。商品明细按商品、业务线和渠道列出。预计毛利按支付时采购成本计算，实际毛利按退款后采购成本计算。平台预计所得和实际所得分别展示支付时的预计清分与已完成结算的示例金额。</p>';
    root.querySelector('[data-ldb-kpis]').innerHTML = amounts.map(function (column) {
      var scoped = state.channel === 'all' ? businessLines : [state.channel === 'proxy' ? '代采' : '零售'];
      var hint = splitKeys.indexOf(column.key) < 0 ? '' : scoped.map(function (biz) {
        return biz + ' ' + Ui.money(sum(rows, column.key + biz));
      }).join(' · ');
      return Ui.kpiCard(column.label, Ui.money(sum(rows, column.key)), '', hint);
    }).join('') + Ui.kpiCard('支付主订单数', Ui.intText(orderCount(rows.flatMap(function (row) {
      return row.products;
    }))), '', '按示例支付主订单去重');

    table.innerHTML = Ui.sectionCard('供应商列表', Ui.renderPagedTable([
      {
        key: 'name', label: '供应商',
        render: function (row) {
          return '<button type="button" class="ldb-link-all" style="border:0;background:none;cursor:pointer" data-products="' +
            Ui.esc(row.id) + '">' + Ui.esc(row.name) + '</button>';
        }
      }
    ].concat(orderColumn, listAmounts), rows, pager, { unitLabel: '家' }));
    Ui.bindPagedTable(table, pager, render);
    table.querySelectorAll('[data-products]').forEach(function (button) {
      button.addEventListener('click', function () {
        var row = rows.find(function (entry) { return entry.id === button.getAttribute('data-products'); });
        Ui.showDetailTable(row.name + ' · 商品明细', row.products, [
          { key: 'id', label: '商品编号' },
          { key: 'name', label: '商品' },
          { key: 'biz', label: '业务线' },
          { key: 'channel', label: '渠道' },
          { key: 'qty', label: '销售数量', num: true, format: 'int' }
        ].concat(orderColumn, amounts), {
          pageSize: 10,
          unitLabel: '条',
          exportName: row.name + '商品明细',
          summaryHtml: '<p class="ldb-tip">共 ' + row.products.length + ' 条商品业务明细</p>',
          filters: [
            { key: 'name', label: '商品名', type: 'text' },
            { key: 'biz', label: '业务线', type: 'select' }
          ]
        });
      });
    });
  }

  render();
})();
