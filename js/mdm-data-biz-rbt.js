/**
 * 经营数据中心 · RBT 联营与回收（独立专题）
 * 口径见会话确认：不进 GMV；投入=划拨；约定=发布快照；已履行跟履约域。
 */
(function () {
  var Center = window.MdmDataBizCenter;
  var Ui = window.MdmDataBizCenterUi;
  if (!Center || !Ui || !Center.rbtSnapshot) return;

  var state = Ui.readState({ period: '30d', tab: '' });
  state.channel = 'all';
  state.line = '';
  var root = document.querySelector('[data-ldb-root]');
  var pager = { page: 1, pageSize: 10 };
  var fulfillPager = { page: 1, pageSize: 10 };
  function statusBadge(status) {
    var cls =
      status === '已完成' || status === '已履行'
        ? 'ldb-badge ldb-badge--ok'
        : status === '门店付款中' || status === '预计履行'
          ? 'ldb-badge ldb-badge--warn'
          : 'ldb-badge';
    return '<span class="' + cls + '">' + Ui.esc(status) + '</span>';
  }

  function demandHref(code) {
    return '../RBT/rbt_demand.html?demandCode=' + encodeURIComponent(code || '');
  }

  function demandLink(code) {
    if (!code) return '—';
    if (code.startsWith('DEMO-RBT-')) return Ui.esc(code);
    return (
      '<a href="' +
      Ui.esc(demandHref(code)) +
      '" target="_blank" rel="noopener">' +
      Ui.esc(code) +
      '</a>'
    );
  }

  function filters() {
    return {
      period: state.period,
      from: state.from,
      to: state.to,
      storeId: state.storeId,
      tab: state.tab || ''
    };
  }

  function riskBadge(grade) {
    var map = {
      正常: 'ldb-badge ldb-badge--ok',
      关注: 'ldb-badge ldb-badge--warn',
      预警: 'ldb-badge ldb-badge--warn',
      异常: 'ldb-badge'
    };
    return '<span class="' + (map[grade] || 'ldb-badge') + '">' + Ui.esc(grade || '—') + '</span>';
  }

  function perfRows(demands) {
    return (demands || [])
      .filter(function (row) {
        return row.status === '门店付款中' || row.status === '已完成';
      })
      .map(function (row) {
        /* 演示日均：累计进度 ÷ 示意已履约天数；正式跟 RBT 履约同一套风控计算 */
        var dayCount = row.status === '已完成' ? 0 : 14;
        var progress =
          row.status === '已完成' || !(row.agreedRecoup > 0)
            ? '—'
            : (row.progress / dayCount).toFixed(2) + '%';
        var risk =
          row.status === '已完成'
            ? '—'
            : row.progress < 40
              ? '关注'
              : '正常';
        return {
          demandCode: row.demandCode,
          storeName: row.storeName,
          storeCode: row.storeId,
          traderName: row.traderName,
          providerName: row.providerName || '—',
          amount: row.agreedRecoup,
          fulfilledAmount: row.fulfilled,
          fulfillGap: row.remain,
          fulfillProgress: row.status === '已完成' ? '—' : progress,
          riskGrade: row.riskGrade || risk,
          repayCycle: '日结',
          repayMethod: '比例付',
          fulfillPhase: row.phase,
          updatedAt: row.receiptAt || row.investAt || '—'
        };
      });
  }

  function render() {
    Ui.writeState(state);
    var data = Center.rbtSnapshot(filters());

    Ui.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      showChannel: false,
      showLine: false,
      showStore: true,
      showExport: false,
      extraHtml:
        '<div class="ldb-field"><label>需求状态</label><select class="ldb-select" data-filter="tab">' +
        '<option value=""' +
        (!state.tab ? ' selected' : '') +
        '>全部</option>' +
        '<option value="shipping"' +
        (state.tab === 'shipping' ? ' selected' : '') +
        '>发货中</option>' +
        '<option value="paying"' +
        (state.tab === 'paying' ? ' selected' : '') +
        '>门店付款中</option>' +
        '<option value="done"' +
        (state.tab === 'done' ? ' selected' : '') +
        '>已完成</option>' +
        '</select></div>'
    });
    Ui.bindToolbar(
      root.querySelector('[data-ldb-toolbar]'),
      state,
      function () {
        pager.page = 1;
        fulfillPager.page = 1;
        render();
      },
      { showExport: false }
    );

    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) {
      meta.textContent =
        Ui.periodLabel(state) +
        ' · 发货中 ' +
        data.shippingCount +
        ' · 履约中 ' +
        data.payingCount +
        ' · 已完成 ' +
        data.doneCount;
    }

    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">' +
      '本专题为 <strong>RBT 联营与回收</strong>，<strong>不计入</strong>经营总览销售额 / ERP 平台分佣。' +
      '贸易商投入以<strong>划拨成功进入发货中</strong>起计（冻结不算）；' +
      '约定回收在<strong>发布成功</strong>时按「商品金额 × 门店结算系数」固化；' +
      '下方「履约」表与 <a href="../RBT/rbt_performance.html" target="_blank" rel="noopener">RBT 履约</a> 列表字段一致。' +
      '冷丰实得、贸易商回收、服务商计提按已履行拆分展示。渠道比例可改至门店付款中，只影响日后应扣。' +
      '</p>';

    var kpis = root.querySelector('[data-ldb-kpis]');
    if (kpis) {
      kpis.className = 'ldb-kpi-row ldb-kpi-row--6';
      kpis.innerHTML =
        Ui.kpiCard('贸易商总投入', Ui.money(data.investTotal), '', '划拨成功起计 · 含发货中') +
        Ui.kpiCard(
          '约定回收',
          Ui.money(data.agreedTotal),
          '',
          '发布时固化 · 商品金额×门店结算系数'
        ) +
        Ui.kpiCard(
          '已履行净额',
          Ui.money(data.fulfilledTotal),
          '',
          '剩余 ' + Ui.money(data.remainTotal)
        ) +
        Ui.kpiCard('冷丰实得', Ui.money(data.lengfengConfirmed), '', '已履行中拆给冷丰的服务费') +
        Ui.kpiCard('贸易商回收', Ui.money(data.traderRecouped), '', '已履行中拆给贸易商') +
        Ui.kpiCard('服务商计提', Ui.money(data.providerAccrued), '', '已履行中拆给服务商');
    }

    var demandHost = root.querySelector('[data-ldb-demands]');
    demandHost.innerHTML = Ui.sectionCard(
      '联营需求单',
      Ui.renderPagedTable(
        [
          {
            key: 'demandCode',
            label: '需求单号',
            render: function (row) {
              return demandLink(row.demandCode);
            }
          },
          { key: 'storeName', label: '门店' },
          { key: 'traderName', label: '贸易商' },
          {
            key: 'status',
            label: '状态',
            render: function (row) {
              return statusBadge(row.status);
            }
          },
          {
            key: 'phase',
            label: '履约阶段',
            render: function (row) {
              return Ui.esc(row.phase);
            }
          },
          { key: 'invest', label: '贸易商投入', num: true, format: 'money' },
          { key: 'agreedRecoup', label: '约定回收', num: true, format: 'money' },
          { key: 'fulfilled', label: '已履行', num: true, format: 'money' },
          { key: 'remain', label: '剩余', num: true, format: 'money' },
          {
            key: 'progress',
            label: '进度',
            render: function (row) {
              return Ui.esc(row.progress.toFixed(1) + '%');
            }
          },
          { key: 'traderShare', label: '贸易商回收', num: true, format: 'money' },
          { key: 'lengfeng', label: '冷丰实得', num: true, format: 'money' },
          { key: 'provider', label: '服务商计提', num: true, format: 'money' }
        ],
        data.demands,
        pager,
        { emptyText: '当前筛选暂无联营需求', unitLabel: '笔' }
      ),
      '<span class="ldb-card__extra">贸易商回收 + 冷丰实得 + 服务商计提 = 已履行</span>'
    );
    Ui.bindPagedTable(demandHost, pager, render);

    var perf = perfRows(data.demands);
    var fulfillHost = root.querySelector('[data-ldb-fulfill]');
    fulfillHost.innerHTML = Ui.sectionCard(
      '履约',
      '<p class="ldb-tip" style="margin:0 0 10px">履约列表包含门店付款中和已完成的需求。带链接的需求单号可打开详情，DEMO-RBT 单号为独立示例。</p>' +
        Ui.renderPagedTable(
          [
            {
              key: 'demandCode',
              label: '需求单号',
              render: function (row) {
                return demandLink(row.demandCode);
              }
            },
            { key: 'storeName', label: '门店' },
            { key: 'storeCode', label: '门店编码' },
            { key: 'traderName', label: '贸易商' },
            { key: 'providerName', label: '服务商' },
            { key: 'amount', label: '总金额', num: true, format: 'money' },
            { key: 'fulfilledAmount', label: '已履行金额', num: true, format: 'money' },
            { key: 'fulfillGap', label: '剩余履行额', num: true, format: 'money' },
            { key: 'fulfillProgress', label: '日均履行进度' },
            {
              key: 'riskGrade',
              label: '履约风险等级',
              render: function (row) {
                return row.riskGrade === '—' ? '—' : riskBadge(row.riskGrade);
              }
            },
            { key: 'repayCycle', label: '结算周期' },
            { key: 'repayMethod', label: '结算方式' },
            {
              key: 'fulfillPhase',
              label: '履约阶段',
              render: function (row) {
                return statusBadge(row.fulfillPhase);
              }
            },
            { key: 'updatedAt', label: '更新时间' }
          ],
          perf,
          fulfillPager,
          { emptyText: '暂无履约中或已完成的需求', unitLabel: '笔' }
        ),
      '<a class="ldb-link-all" href="../RBT/rbt_performance.html" target="_blank" rel="noopener">打开 RBT 履约</a>'
    );
    Ui.bindPagedTable(fulfillHost, fulfillPager, render);
  }

  render();
})();
