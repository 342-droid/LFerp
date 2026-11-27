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

  function openOrderDetails(data) {
    CUi.showDetailTable(
      '支付订单明细 · ' + CUi.filterHint(state),
      data.orderDetails,
      [
        { key: 'orderId', label: '主订单号', link: 'order' },
        { key: 'biz', label: '业务线' },
        { key: 'channel', label: '零售渠道' },
        { key: 'storeName', label: '门店' },
        { key: 'payTime', label: '支付时间' },
        { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
        { key: 'freightSales', label: '运费', num: true, format: 'money' }
      ],
      {
        pageSize: 10,
        exportName: '支付订单明细',
        summaryHtml: '<p class="ldb-tip">共 ' + CUi.intText(data.orderDetails.length) + ' 条原型示例订单</p>',
        filters: [
          { key: 'biz', label: '业务线', type: 'select' },
          { key: 'channel', label: '零售渠道', type: 'select' },
          { key: 'storeName', label: '门店', type: 'select' },
          {
            key: 'hasRefund',
            label: '是否有退款',
            type: 'select',
            options: [
              { value: '', label: '全部' },
              { value: '1', label: '有退款' },
              { value: '0', label: '无退款' }
            ],
            test: function (row, value) {
              if (!value) return true;
              var has = Number(row.refundAmount) > 0;
              return value === '1' ? has : !has;
            }
          }
        ]
      }
    );
  }

  function openPointsExchange(data) {
    CUi.showDetailTable(
      '积分兑换商品明细 · ' + CUi.filterHint(state),
      data.pointsExchangeDetails || [],
      [
        { key: 'orderId', label: '订单号' },
        { key: 'product', label: '商品' },
        { key: 'supplierCost', label: '供应商成本', num: true, format: 'money' },
        { key: 'paid', label: '实付', num: true, format: 'money' },
        { key: 'freightShare', label: '分摊运费', num: true, format: 'money' },
        { key: 'cost', label: '兑换成本', num: true, format: 'money' },
        { key: 'payTime', label: '支付时间' }
      ],
      {
        pageSize: 10,
        exportName: '积分兑换商品明细',
        summaryHtml:
          '<p class="ldb-tip">成本＝供应商成本−实付（含分摊运费）。筛选期合计 ' +
          CUi.money(data.pointsExchangeCost) +
          '。</p>',
        filters: [
          { key: 'product', label: '商品名', type: 'text' },
          { key: 'payTime', label: '时间范围', type: 'daterange' }
        ]
      }
    );
  }

  function openPointsCash(data) {
    CUi.showDetailTable(
      '订单积分抵现明细 · ' + CUi.filterHint(state),
      data.pointsCashDetails || [],
      [
        { key: 'orderId', label: '订单号' },
        { key: 'points', label: '抵现积分', num: true, format: 'int' },
        { key: 'amount', label: '抵现金额', num: true, format: 'money' },
        { key: 'storeName', label: '门店' },
        { key: 'channel', label: '渠道' },
        { key: 'payTime', label: '支付时间' }
      ],
      {
        pageSize: 10,
        exportName: '订单积分抵现明细',
        summaryHtml:
          '<p class="ldb-tip">1 积分＝0.1 元。筛选期合计 ' +
          CUi.money(data.pointsCashDeductAmount) +
          '（' +
          CUi.intText(data.pointsCashDeductPoints) +
          ' 积分）。</p>',
        filters: [
          { key: 'storeName', label: '门店', type: 'select' },
          { key: 'channel', label: '渠道', type: 'select' },
          { key: 'payTime', label: '时间范围', type: 'daterange' }
        ]
      }
    );
  }

  function openAftersaleDetails(data) {
    CUi.showDetailTable(
      '售后明细 · ' + CUi.filterHint(state),
      data.aftersaleDetails || [],
      [
        { key: 'asId', label: '售后单号' },
        { key: 'type', label: '类型' },
        { key: 'status', label: '状态' },
        { key: 'refundAmount', label: '退款金额', num: true, format: 'money' },
        { key: 'storeName', label: '门店' },
        { key: 'finishTime', label: '完结时间' }
      ],
      {
        pageSize: 10,
        unitLabel: '单',
        exportName: '售后明细',
        summaryHtml:
          '<p class="ldb-tip">共 ' +
          CUi.intText((data.aftersaleDetails || []).length) +
          ' 条售后演示明细</p>',
        filters: [
          { key: 'type', label: '售后类型', type: 'select' },
          { key: 'status', label: '状态', type: 'select' },
          { key: 'storeName', label: '门店', type: 'select' }
        ]
      }
    );
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
      '<p class="ldb-tip">GMV按<strong>支付成功时间</strong>统计实付金额（含运费），商品与运费拆分。' +
      '退款按<strong>成功退款发生时间</strong>单独展示，不冲减GMV；采购成本分<strong>支付时</strong>与<strong>退款后实际</strong>两套口径。' +
      '平台分佣分<strong>预计</strong>（支付时点）与<strong>实际</strong>（结算完成入账）。' +
      'ERP 平台分佣与食亨管理费分属不同数据域，本页仅汇总 ERP。' +
      '<strong>RBT 联营不计入本页 GMV / 平台分佣</strong>，见快捷入口「RBT」。' +
      '运营成本含 BD／直播运营组／门店分佣、汇付手续费、汇总后的<strong>积分成本</strong>（兑换商品＋订单抵现）；<strong>不含供应商货款、承运商结算</strong>（采购成本另列）。' +
      '直播流量仅 GB、不计入金额合计。' +
      '</p>';

    root.querySelector('[data-ldb-kpis]').innerHTML =
      '<div class="ldb-kpi-row ldb-kpi-row--6">' +
      CUi.kpiCard(
        'GMV',
        CUi.money(data.salesTotal),
        '',
        '商品 ' + CUi.money(data.goodsSales) + ' · 运费 ' + CUi.money(data.freightSales)
      ) +
      CUi.kpiCard(
        '成功退款',
        CUi.money(data.refundAmount),
        '',
        '退款商品数 ' + CUi.intText(data.refundQty) + '（不冲减GMV）'
      ) +
      CUi.kpiCard(
        '支付时采购成本',
        CUi.money(data.purchaseCostPay),
        '',
        '按支付成功时间汇总'
      ) +
      CUi.kpiCard(
        '退款后采购成本',
        CUi.money(data.purchaseCostAfterRefund),
        '',
        '成功退款后回写的实际成本'
      ) +
      CUi.kpiCard(
        '预计商品毛利',
        CUi.money(data.goodsMarginExpected != null ? data.goodsMarginExpected : data.goodsMargin),
        '',
        '按支付时采购成本'
      ) +
      CUi.kpiCard(
        '实际商品毛利',
        CUi.money(data.goodsMarginActual),
        '',
        '按退款后实际采购成本（结算）'
      ) +
      '</div>' +
      '<div class="ldb-kpi-row ldb-kpi-row--5" style="margin-top:12px">' +
      CUi.kpiCard(
        '平台预计分佣',
        CUi.money(data.platformCommissionExpected),
        '',
        '商品分佣 ' +
          CUi.money(data.platformGoodsCommission) +
          ' · 运费分佣 ' +
          CUi.money(data.freightCommission)
      ) +
      CUi.kpiCard(
        '平台实际分佣',
        CUi.money(data.platformCommissionActual),
        '',
        '按结算完成时间入账'
      ) +
      CUi.kpiCard(
        '支付主订单数',
        CUi.intText(data.orderCount),
        '',
        '零售 ' + CUi.intText(data.retailOrders) + ' · 代采 ' + CUi.intText(data.proxyOrders),
        { actionText: '查看订单明细', actionAttr: 'data-overview-orders' }
      ) +
      '</div>';
    var ordersBtn = root.querySelector('[data-overview-orders]');
    if (ordersBtn) {
      ordersBtn.addEventListener('click', function (event) {
        event.preventDefault();
        openOrderDetails(data);
      });
    }

    var refundRateText =
      data.aftersaleRefundRate == null
        ? '—'
        : (Number(data.aftersaleRefundRate) * 100).toFixed(2) + '%';
    var aftersaleHost = root.querySelector('[data-ldb-aftersale]');
    if (aftersaleHost) {
      aftersaleHost.innerHTML = CUi.sectionCard(
        '售后',
        '<div class="ldb-kpi-row ldb-kpi-row--5">' +
          CUi.kpiCard(
            '售后申请单数',
            CUi.intText(data.aftersaleApplyCount),
            '',
            '筛选期内创建的售后单'
          ) +
          CUi.kpiCard(
            '成功退款金额',
            CUi.money(data.refundAmount),
            '',
            '退款商品数 ' + CUi.intText(data.refundQty)
          ) +
          CUi.kpiCard('退款率', refundRateText, '', '成功退款金额 ÷ GMV') +
          CUi.kpiCard(
            '仅退款 / 退货退款 / 补货',
            CUi.intText(data.aftersaleRefundOnlyCount) +
              ' / ' +
              CUi.intText(data.aftersaleReturnRefundCount) +
              ' / ' +
              CUi.intText(data.aftersaleReshipCount),
            '',
            '按售后类型拆分'
          ) +
          CUi.kpiCard(
            '驳回单数',
            CUi.intText(data.aftersaleRejectCount),
            '',
            '平均处理 ' +
              (data.aftersaleAvgHandleHours == null
                ? '—'
                : Number(data.aftersaleAvgHandleHours).toFixed(1) + ' 小时'),
            { actionText: '查看售后明细', actionAttr: 'data-overview-aftersale' }
          ) +
          '</div>' +
          '<p class="ldb-tip" style="margin-top:10px">事件时间默认取成功退款／售后完结时间。驳回不计退款。</p>'
      );
      var asBtn = aftersaleHost.querySelector('[data-overview-aftersale]');
      if (asBtn) {
        asBtn.addEventListener('click', function (event) {
          event.preventDefault();
          openAftersaleDetails(data);
        });
      }
    }

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
        CUi.kpiCard('核销率', verifyRateText, '', '已核销订单数 ÷ 总下单数') +
        '</div>' +
        '<p class="ldb-tip" style="margin-top:10px">此处「核销」指订单走到<strong>交易成功</strong>，不是优惠券核销。</p>'
    );

    var opsRateText =
      data.opsGrossRate == null ? '—' : (Number(data.opsGrossRate) * 100).toFixed(2) + '%';
    var opsCostTotal = (data.expenseSummary || []).reduce(function (sum, row) {
      if (row.money === false || row.amount == null) return sum;
      return sum + (Number(row.amount) || 0);
    }, 0);
    root.querySelector('[data-ldb-ops]').innerHTML = CUi.sectionCard(
      '运营成本与毛利',
      '<div class="ldb-kpi-row">' +
        CUi.kpiCard(
          '运营成本合计',
          CUi.money(opsCostTotal),
          '',
          '分佣＋手续费＋积分成本（不含直播流量 GB、不含供应商货款／承运商结算）'
        ) +
        CUi.kpiCard(
          '运营毛利',
          CUi.money(data.opsGrossProfit),
          '',
          '对齐财务经营表演示合计数'
        ) +
        CUi.kpiCard('运营毛利率', opsRateText, '', '运营毛利 ÷ GMV') +
        '</div>' +
        CUi.simpleTable(
          [
            { key: 'type', label: '成本项' },
            { key: 'note', label: '说明' },
            {
              key: 'amount',
              label: '数值',
              num: true,
              render: function (row, value) {
                if (row.type === '直播流量使用情况') {
                  var gb = row.quantityGb == null ? data.liveTrafficGb : row.quantityGb;
                  return gb == null
                    ? '—'
                    : Number(gb).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + ' GB';
                }
                if (row.type === '积分成本') {
                  return (
                    CUi.money(value) +
                    ' <a href="#" data-overview-points-cost>兑换明细</a>' +
                    ' · <a href="#" data-overview-points-cash>抵现明细</a>'
                  );
                }
                return CUi.money(value);
              }
            }
          ],
          data.expenseSummary
        ) +
        '<p class="ldb-tip" style="margin-top:10px">采购成本不在本表展示。直播流量仅 GB、不计入运营成本合计。' +
        '运营毛利正式环境对齐财务核算公式；原型先按合计数验收。</p>'
    );
    var ptsBtn = root.querySelector('[data-overview-points-cost]');
    if (ptsBtn) {
      ptsBtn.addEventListener('click', function (event) {
        event.preventDefault();
        openPointsExchange(data);
      });
    }
    var cashBtn = root.querySelector('[data-overview-points-cash]');
    if (cashBtn) {
      cashBtn.addEventListener('click', function (event) {
        event.preventDefault();
        openPointsCash(data);
      });
    }

    var mid = root.querySelector('[data-ldb-mid]');
    mid.innerHTML =
      CUi.sectionCard(
        'GMV趋势',
        '<p class="ldb-tip ldb-tip--flush">按支付成功时间；与上方GMV同口径（含运费）。</p><div class="ldb-chart">' +
          CUi.renderBars(data.trend) +
          '</div>'
      ) +
      CUi.sectionCard(
        'GMV构成',
        CUi.renderCompositionPie(mix, {
          centerLabel: 'GMV',
          ariaLabel: 'GMV构成'
        }) +
          (breakdown && state.channel === 'all'
            ? '<p class="ldb-tip">占零售GMV · 商城 ' +
              CUi.money(breakdown.mall) +
              retailShare(breakdown.mall) +
              ' · 直播 ' +
              CUi.money(breakdown.live) +
              retailShare(breakdown.live) +
              '</p>'
            : '')
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
                    channel:
                      state.channel === 'retail' || state.channel === 'proxy' ? 'all' : state.channel,
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
      );
  }

  render();
})();
