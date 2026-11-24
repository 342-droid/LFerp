(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d' });
  delete state.line;
  var root = document.querySelector('[data-ldb-root]');
  var pager = { page: 1, pageSize: 10 };

  function filters() {
    return {
      period: state.period,
      from: state.from,
      to: state.to,
      storeId: state.storeId
    };
  }

  function render() {
    CUi.writeState(state);
    var data = Center.pointsSnapshot(filters());

    CUi.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      showChannel: false,
      showLine: false,
      exportName: '积分'
    });
    CUi.bindToolbar(root.querySelector('[data-ldb-toolbar]'), state, function () {
      pager.page = 1;
      render();
    }, {
      exportName: '积分'
    });
    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.periodLabel(state) + ' · ' +
      (state.storeId ? '指定门店' : '全部门店及平台');

    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">发放和消耗根据筛选后的积分流水汇总。选择门店时，仅展示归属该门店的流水。积分余额为平台当前快照。</p>';

    root.querySelector('[data-ldb-kpis]').innerHTML =
      CUi.kpiCard('发放', CUi.intText(data.issued), '', '筛选期内发放成功') +
      CUi.kpiCard('消耗', CUi.intText(data.consumed), '', '筛选期内消耗成功') +
      CUi.kpiCard('平台当前积分余额', CUi.intText(data.balance), '', '全平台会员积分余额合计（原型）');

    var results = root.querySelector('[data-ldb-table]');
    var columns = [
      { key: 'time', label: '时间' },
      { key: 'user', label: '用户' },
      { key: 'type', label: '类型' },
      { key: 'scene', label: '场景' },
      { key: 'storeName', label: '归属门店' },
      { key: 'line', label: '事业线' },
      { key: 'points', label: '积分变动', num: true, render: function (row) {
        return (row.points > 0 ? '+' : '') + CUi.intText(row.points);
      } },
      { key: 'balanceAfter', label: '变动后积分余额', num: true, format: 'int' }
    ];
    function renderDetails() {
      results.innerHTML = CUi.sectionCard('积分明细', CUi.renderPagedTable(columns, data.details, pager, {
        unitLabel: '条', emptyText: '当前筛选范围内暂无积分流水'
      }));
      CUi.bindPagedTable(results, pager, renderDetails);
    }
    renderDetails();
  }

  render();
})();
