(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var TABS = [
    { id: 'summary', label: '经营汇总' },
    { id: 'product', label: '商品明细' },
    { id: 'commission', label: '平台分佣' },
    { id: 'expense', label: '经营支出' },
    { id: 'orders', label: '订单明细' }
  ];

  var state = CUi.readState({ period: '30d', channel: 'all', tab: 'summary' });
  if (!state.tab) state.tab = 'summary';
  var root = document.querySelector('[data-ldb-root]');
  var pager = { page: 1, pageSize: 10 };
  var filterKey = '';

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

  function currentFilterKey() {
    return [state.period, state.from, state.to, state.storeId, state.line, state.channel, state.tab].join('|');
  }

  function resetPagerIfNeeded() {
    var next = currentFilterKey();
    if (next !== filterKey) {
      filterKey = next;
      pager.page = 1;
    }
  }

  function renderExpenseTable(data) {
    var host = root.querySelector('[data-ldb-body]');
    host.innerHTML = CUi.sectionCard(
      '经营支出 / 结算明细',
      '<p class="ldb-tip ldb-tip--flush">供应商货款、直播费用、BD结算、门店分佣。供应商货款不从商品毛利再次扣除。明细为<strong>原型示例数据</strong>，共 ' +
        data.expenseDetails.length +
        ' 条，可切换分页验证。</p>' +
        CUi.renderPagedTable(
          [
            { key: 'type', label: '支出类型' },
            { key: 'party', label: '对象' },
            { key: 'amount', label: '金额', num: true, format: 'money' },
            { key: 'status', label: '状态' },
            { key: 'bizTime', label: '业务日期' }
          ],
          data.expenseDetails,
          pager,
          { unitLabel: '条' }
        )
    );
    CUi.bindPagedTable(host, pager, function () {
      renderExpenseTable(data);
    });
  }

  function renderOrdersTable(data) {
    var host = root.querySelector('[data-ldb-body]');
    host.innerHTML = CUi.sectionCard(
      '订单明细',
      '<p class="ldb-tip ldb-tip--flush">主订单号可点击，跳转既有零售/代采订单页并用 <code>orderId</code> 打开详情抽屉。明细为<strong>原型示例数据</strong>，共 ' +
        data.orderDetails.length +
        ' 条。</p>' +
        CUi.renderPagedTable(
          [
            { key: 'orderId', label: '主订单号', render: CUi.orderIdCell },
            { key: 'biz', label: '业务' },
            { key: 'channel', label: '渠道' },
            { key: 'storeName', label: '门店' },
            { key: 'payTime', label: '支付成功时间' },
            { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
            { key: 'freightSales', label: '运费', num: true, format: 'money' },
            { key: 'purchaseCost', label: '采购成本', num: true, format: 'money' },
            { key: 'goodsMargin', label: '商品毛利', num: true, format: 'money' },
            { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
          ],
          data.orderDetails,
          pager,
          { unitLabel: '单' }
        )
    );
    CUi.bindPagedTable(host, pager, function () {
      renderOrdersTable(data);
    });
  }

  function renderBody(data) {
    var host = root.querySelector('[data-ldb-body]');
    if (state.tab === 'product') {
      host.innerHTML = CUi.sectionCard(
        '商品销售明细',
        '<p class="ldb-tip ldb-tip--flush">商品单价×实际销售数量；积分/优惠券不影响商品销售价。退款金额/数量单独展示，不冲减销售额或采购成本。</p>' +
          CUi.simpleTable(
            [
              { key: 'name', label: '商品' },
              { key: 'biz', label: '业务' },
              { key: 'supplier', label: '供应商' },
              { key: 'unitPrice', label: '单价', num: true, format: 'money' },
              { key: 'qty', label: '销售数量', num: true, format: 'int' },
              { key: 'sales', label: '商品销售额', num: true, format: 'money' },
              { key: 'cost', label: '采购成本', num: true, format: 'money' },
              { key: 'margin', label: '商品毛利', num: true, format: 'money' },
              { key: 'refundAmount', label: '退款金额', num: true, format: 'money' },
              { key: 'refundQty', label: '退款数量', num: true, format: 'int' }
            ],
            data.products
          )
      );
      return;
    }
    if (state.tab === 'commission') {
      host.innerHTML =
        '<div class="ldb-kpi-row">' +
        CUi.kpiCard('商品毛利', CUi.money(data.goodsMargin), '', '销售额−采购成本') +
        CUi.kpiCard('BD分佣', CUi.money(data.bdCommission), '', '') +
        CUi.kpiCard('直播分佣', CUi.money(data.liveCommission), '', '') +
        CUi.kpiCard('门店分佣', CUi.money(data.storeCommission), '', '') +
        '</div>' +
        CUi.sectionCard(
          '平台分佣构成',
          CUi.renderCompositionPie(
            [
              { name: '商品平台分佣', value: data.platformGoodsCommission, color: '#ff7019' },
              { name: '运费分佣', value: data.freightCommission, color: '#1677ff' }
            ],
            { centerLabel: '平台分佣收入', ariaLabel: '平台分佣构成' }
          ) +
            '<p class="ldb-tip" style="margin-top:12px">商品平台分佣＝商品毛利−BD分佣−直播分佣−门店分佣；运费分佣单独展示。ERP平台分佣收入＝商品分佣＋运费分佣。</p>'
        );
      CUi.bindCompositionPie(host.querySelector('[data-ldb-pie]'));
      return;
    }
    if (state.tab === 'expense') {
      renderExpenseTable(data);
      return;
    }
    if (state.tab === 'orders') {
      renderOrdersTable(data);
      return;
    }

    host.innerHTML =
      '<div class="ldb-grid-2">' +
      CUi.sectionCard(
        '销售额趋势',
        '<div class="ldb-chart">' + CUi.renderBars(data.trend) + '</div>'
      ) +
      CUi.sectionCard(
        '零售 / 代采构成',
        CUi.renderCompositionPie(data.mix, { centerLabel: '销售额', ariaLabel: '构成' })
      ) +
      '</div>' +
      CUi.sectionCard(
        '供应商摘要',
        CUi.simpleTable(
          [
            { key: 'name', label: '供应商' },
            { key: 'goodsSales', label: '商品销售额', num: true, format: 'money' },
            { key: 'purchaseCost', label: '采购成本', num: true, format: 'money' },
            { key: 'goodsMargin', label: '商品毛利', num: true, format: 'money' },
            { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
          ],
          data.suppliers
        ),
        '<a class="ldb-link-all" href="mdm_data_biz_supplier.html">供应商分析</a>'
      );
    CUi.bindCompositionPie(host.querySelector('[data-ldb-pie]'));
  }

  function render() {
    resetPagerIfNeeded();
    CUi.writeState(state);
    var data = Center.erpSnapshot(filters());

    CUi.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      showChannel: true,
      showExport: false,
      exportName: 'ERP经营分析'
    });
    CUi.bindToolbar(
      root.querySelector('[data-ldb-toolbar]'),
      state,
      function () {
        pager.page = 1;
        render();
      },
      { exportName: 'ERP经营分析' }
    );

    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.filterHint(state);

    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">本页仅 ERP 数据域。商品明细与订单行仅作下钻明细；不以「关联商品及销售明细」作为指标名称。</p>';

    root.querySelector('[data-ldb-tabs]').innerHTML = CUi.pageTabs(TABS, state.tab);
    root.querySelectorAll('[data-page-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-page-tab');
        pager.page = 1;
        render();
      });
    });

    root.querySelector('[data-ldb-kpis]').innerHTML =
      CUi.kpiCard('销售额', CUi.money(data.salesTotal), '', '含运费 · 支付成功') +
      CUi.kpiCard('商品销售额', CUi.money(data.goodsSales), '', '') +
      CUi.kpiCard('运费', CUi.money(data.freightSales), '', '') +
      CUi.kpiCard('采购成本', CUi.money(data.purchaseCost), '', '不因退款冲减') +
      CUi.kpiCard('商品毛利', CUi.money(data.goodsMargin), '', '') +
      CUi.kpiCard('成功退款', CUi.money(data.refundAmount), '', '单独展示');

    renderBody(data);
  }

  render();
})();
