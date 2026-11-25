(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d', channel: 'all' });
  var root = document.querySelector('[data-ldb-root]');

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
    CUi.writeState(state);
    var data = Center.erpSnapshot(filters());
    var breakdown = data.retailBreakdown;
    var mix = data.mix;
    if (state.channel === 'retail' && breakdown) {
      var mallOrders = Math.round(data.retailOrders * 0.58);
      mix = [
        { name: '商城', value: breakdown.mall, orders: mallOrders, color: '#ff7019' },
        { name: '直播', value: breakdown.live, orders: data.retailOrders - mallOrders, color: '#1677ff' }
      ];
    } else if (state.channel === 'mall' || state.channel === 'live') {
      mix = [Object.assign({}, mix[0], { name: state.channel === 'mall' ? '商城' : '直播' })];
    }
    function retailShare(amount) {
      var total = breakdown.mall + breakdown.live;
      return total ? '（' + (amount / total * 100).toFixed(1) + '%）' : '（—）';
    }

    CUi.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      showChannel: true,
      salesScope: true,
      exportName: '经营总览'
    });
    CUi.bindToolbar(root.querySelector('[data-ldb-toolbar]'), state, render, {
      exportName: '经营总览'
    });

    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.filterHint(state);

    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">销售额按<strong>支付成功时间</strong>统计实付金额（含运费），商品与运费拆分。' +
      '退款按<strong>成功退款发生时间</strong>单独展示，不冲减销售额或采购成本；售后驳回不计退款。' +
      'ERP 平台分佣与食亨管理费分属不同数据域，本页仅汇总 ERP。' +
      '<strong>RBT 联营不计入本页 GMV / 平台分佣</strong>，见快捷入口「RBT联营」。' +
      '下方补齐运营管理表中的<strong>总下单／已核销／核销率</strong>，以及财务表中的<strong>积分兑换成本、运营毛利／毛利率</strong>。' +
      '系统流量费、系统手续费无业务系统数据源，本页不展示。' +
      '</p>';

    root.querySelector('[data-ldb-kpis]').innerHTML =
      CUi.kpiCard(
        '销售额',
        CUi.money(data.salesTotal),
        '',
        '商品 ' + CUi.money(data.goodsSales) + ' · 运费 ' + CUi.money(data.freightSales)
      ) +
      CUi.kpiCard(
        '成功退款',
        CUi.money(data.refundAmount),
        '',
        '退款商品数 ' + CUi.intText(data.refundQty) + '（不冲减销售额）'
      ) +
      CUi.kpiCard(
        '商品毛利',
        CUi.money(data.goodsMargin),
        '',
        '采购成本 ' + CUi.money(data.purchaseCost)
      ) +
      CUi.kpiCard(
        '平台分佣所得',
        CUi.money(data.platformIncome),
        '',
        '商品分佣 ' +
          CUi.money(data.platformGoodsCommission) +
          ' · 运费分佣 ' +
          CUi.money(data.freightCommission)
      ) +
      CUi.kpiCard(
        '支付主订单数',
        CUi.intText(data.orderCount),
        '',
        '零售 ' + CUi.intText(data.retailOrders) + ' · 代采 ' + CUi.intText(data.proxyOrders),
        { actionText: '查看订单明细', actionAttr: 'data-overview-orders' }
      );
    root.querySelector('[data-overview-orders]').addEventListener('click', function (event) {
      event.preventDefault();
      CUi.showDetailTable('支付订单明细 · ' + CUi.filterHint(state), data.orderDetails, [
        { key: 'orderId', label: '主订单号', link: 'order' },
        { key: 'biz', label: '业务线' },
        { key: 'channel', label: '零售渠道' },
        { key: 'storeName', label: '门店' },
        { key: 'payTime', label: '支付成功时间' },
        { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
        { key: 'freightSales', label: '运费', num: true, format: 'money' }
      ], { pageSize: 10, summaryHtml: '<p class="ldb-tip">共 ' + CUi.intText(data.orderDetails.length) + ' 条原型示例订单</p>' });
    });

    var verifyRateText =
      data.verifyRate == null ? '—' : (Number(data.verifyRate) * 100).toFixed(2) + '%';
    root.querySelector('[data-ldb-fulfill]').innerHTML = CUi.sectionCard(
      '下单与核销',
      '<div class="ldb-kpi-row">' +
        CUi.kpiCard(
          '总下单数',
          CUi.intText(data.placeOrderCount),
          '',
          '含未支付／取消等，不等于上方支付主订单数'
        ) +
        CUi.kpiCard(
          '已核销订单金额',
          CUi.money(data.verifiedOrderAmount),
          '',
          '订单状态＝交易成功的实付合计'
        ) +
        CUi.kpiCard(
          '已核销订单数',
          CUi.intText(data.verifiedOrderCount),
          '',
          '订单状态＝交易成功的主订单数'
        ) +
        CUi.kpiCard(
          '核销率',
          verifyRateText,
          '',
          '已核销订单数 ÷ 总下单数'
        ) +
        '</div>' +
        '<p class="ldb-tip" style="margin-top:10px">此处「核销」指订单走到<strong>交易成功</strong>，不是优惠券核销。</p>'
    );

    var opsRateText =
      data.opsGrossRate == null ? '—' : (Number(data.opsGrossRate) * 100).toFixed(2) + '%';
    root.querySelector('[data-ldb-ops]').innerHTML = CUi.sectionCard(
      '运营成本与毛利',
      '<div class="ldb-kpi-row">' +
        CUi.kpiCard(
          '积分兑换成本',
          CUi.money(data.pointsExchangeCost),
          '',
          '福利／秒杀优惠 · 积分商品（供应商成本−实付含运费）',
          { actionText: '查看兑换明细', actionAttr: 'data-overview-points-cost' }
        ) +
        CUi.kpiCard(
          '运营毛利',
          CUi.money(data.opsGrossProfit),
          '',
          '对齐财务经营表演示合计数'
        ) +
        CUi.kpiCard(
          '运营毛利率',
          opsRateText,
          '',
          '运营毛利 ÷ 销售额'
        ) +
        '</div>' +
        '<p class="ldb-tip" style="margin-top:10px">运营毛利正式环境对齐财务核算公式；原表公式格曾为 #REF!，原型先按合计数验收展示。' +
        '系统流量费、系统手续费无业务系统数据源，不纳入本页。</p>'
    );
    var ptsBtn = root.querySelector('[data-overview-points-cost]');
    if (ptsBtn) {
      ptsBtn.addEventListener('click', function (event) {
        event.preventDefault();
        CUi.showDetailTable(
          '积分兑换成本明细 · ' + CUi.filterHint(state),
          data.pointsExchangeDetails || [],
          [
            { key: 'orderId', label: '订单号' },
            { key: 'product', label: '积分商品' },
            { key: 'supplierCost', label: '供应商成本', num: true, format: 'money' },
            { key: 'paid', label: '实付（含运费分摊）', num: true, format: 'money' },
            { key: 'freightShare', label: '分摊运费', num: true, format: 'money' },
            { key: 'cost', label: '兑换成本', num: true, format: 'money' },
            { key: 'payTime', label: '支付时间' }
          ],
          {
            pageSize: 10,
            summaryHtml:
              '<p class="ldb-tip">成本＝供应商成本−实付（含分摊运费）。筛选期合计 ' +
              CUi.money(data.pointsExchangeCost) +
              '。</p>'
          }
        );
      });
    }

    var mid = root.querySelector('[data-ldb-mid]');
    mid.innerHTML =
      CUi.sectionCard(
        '销售额趋势',
        '<p class="ldb-tip ldb-tip--flush">按支付成功时间；与上方销售额同口径（含运费）。</p><div class="ldb-chart">' +
          CUi.renderBars(data.trend) +
          '</div>'
      ) +
      CUi.sectionCard(
        '销售额构成',
        CUi.renderCompositionPie(mix, {
          centerLabel: '销售额',
          ariaLabel: '销售额构成'
        }) +
          (breakdown && state.channel === 'all' ? '<p class="ldb-tip">占零售销售额 · 商城 ' + CUi.money(breakdown.mall) + retailShare(breakdown.mall) +
            ' · 直播 ' + CUi.money(breakdown.live) + retailShare(breakdown.live) + '</p>' : '')
      );
    CUi.bindCompositionPie(mid.querySelector('[data-ldb-pie]'));

    root.querySelector('[data-ldb-tables]').innerHTML =
      CUi.sectionCard(
        '门店经营排行',
        CUi.simpleTable(
          [
            { key: 'storeName', label: '门店' },
            { key: 'line', label: '事业线' },
            { key: 'goodsMargin', label: '商品交易毛利', num: true, format: 'money' },
            {
              key: 'goodsMarginRate',
              label: '毛利率',
              num: true,
              render: function (r, v) {
                return v == null ? '—' : (Number(v) * 100).toFixed(1) + '%';
              }
            },
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
                    mode: state.channel === 'proxy' ? 'proxy' : 'sales',
                    period: state.period,
                    line: state.line,
                    channel: state.channel === 'retail' || state.channel === 'proxy' ? 'all' : state.channel,
                    from: state.from,
                    to: state.to,
                    back: 'overview'
                  }) +
                  '">详情</a>'
                );
              }
            }
          ],
          data.storeRank.slice(0, 10),
          '当前筛选暂无门店经营数据'
        ),
        '<span class="ldb-card__extra">按平台分配所得降序 · Top10</span>' +
        '<a class="ldb-link-all" href="' +
          CUi.pageHref('mdm_data_biz_stores.html', {
            mode: state.channel === 'proxy' ? 'proxy' : 'sales',
            period: state.period,
            line: state.line,
            channel: state.channel === 'retail' || state.channel === 'proxy' ? 'all' : state.channel,
            from: state.from,
            to: state.to,
            storeId: state.storeId
          }) +
          '">门店分析</a>'
      ) +
      CUi.sectionCard(
        '经营支出摘要',
        CUi.simpleTable(
          [
            { key: 'type', label: '类型' },
            { key: 'count', label: '结算项数', num: true, format: 'int' },
            { key: 'amount', label: '金额', num: true, format: 'money' }
          ],
          data.expenseSummary
        ) +
          '<p class="ldb-tip" style="margin-top:10px">含积分兑换成本。系统流量费、系统手续费无业务系统数据源，不纳入。有运费的订单可关联承运商结款；承运商支出按结款金额统计，订单实收运费列在销售额中。</p>'
      );
  }

  render();
})();
