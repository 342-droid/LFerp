(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  if (!Center || !CUi) return;

  var state = CUi.readState({ period: '30d', channel: 'all' });
  var root = document.querySelector('[data-ldb-root]');
  var pager = { page: 1, pageSize: 10 };

  function render() {
    CUi.writeState(state);
    var data = Center.posSnapshot(state);

    var channelExtra =
      '<div class="ldb-field"><label>POS渠道</label><div class="ldb-chips" data-ldb-channel>' +
      ['all|全部', 'dine|堂食', 'takeout|外卖']
        .map(function (x) {
          var p = x.split('|');
          return (
            '<button type="button" class="ldb-chip' +
            (state.channel === p[0] ? ' is-active' : '') +
            '" data-channel="' +
            p[0] +
            '">' +
            p[1] +
            '</button>'
          );
        })
        .join('') +
      '</div></div>';

    CUi.renderToolbar(root.querySelector('[data-ldb-toolbar]'), state, {
      showChannel: false,
      showLine: false,
      showExport: true,
      exportName: '食亨POS',
      extraHtml: channelExtra
    });
    CUi.bindToolbar(root.querySelector('[data-ldb-toolbar]'), state, function () {
      pager.page = 1;
      render();
    }, {
      exportName: '食亨POS'
    });
    var meta = root.querySelector('[data-ldb-meta]');
    if (meta) meta.textContent = CUi.periodLabel(state) + ' · 按账单日筛选 · 独立数据域';

    root.querySelector('[data-ldb-tip]').innerHTML =
      '<p class="ldb-tip">下方为食亨 POS 示例账单。门店筛选按已保存的 ERP 门店关联匹配。' +
      '食亨管理费只属于食亨；ERP 平台分佣只属于 ERP。' +
      '<a href="mdm_data_biz_pos_mapping.html">查看/维护 ERP 与食亨门店关系</a></p>';

    if (data.empty) {
      root.querySelector('[data-ldb-body]').innerHTML =
        CUi.emptyBlock(data.note) +
        '<section class="ldb-card" style="margin-top:12px"><div class="ldb-card__head"><h3 class="ldb-card__title">账单列表</h3></div>' +
        '<div class="ldb-table-wrap"><table class="ldb-table"><thead><tr>' +
        '<th>账单日</th><th>门店</th><th>账单总额</th><th>堂食金额</th><th>外卖金额</th><th>商户实收</th><th>管理费</th><th>分账状态</th>' +
        '</tr></thead><tbody><tr><td colspan="8"><div class="ldb-empty">暂无 POS 账单</div></td></tr></tbody></table></div></section>';
      return;
    }

    var body = root.querySelector('[data-ldb-body]');
    body.innerHTML = CUi.sectionCard(
      '账单列表',
      CUi.renderPagedTable(
        [
          { key: 'billDate', label: '账单日' },
          { key: 'storeName', label: '门店' },
          { key: 'billAmount', label: '账单总额', num: true, format: 'money' },
          { key: 'dineAmount', label: '堂食金额', num: true, format: 'money' },
          { key: 'takeoutAmount', label: '外卖金额', num: true, format: 'money' },
          { key: 'merchantReceive', label: '商户实收', num: true, format: 'money' },
          { key: 'manageFee', label: '管理费', num: true, format: 'money' },
          { key: 'splitStatus', label: '分账状态' }
        ],
        data.rows, pager, { unitLabel: '行' }
      )
    );
    CUi.bindPagedTable(body, pager, render);
  }

  render();
})();
