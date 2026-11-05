/* 丰银宝 · 供应商 · 清分明细详情；订单号可跳转客户订单 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierSettle) return;

  var org = window.FybOrg.current();
  var params = new URLSearchParams(location.search);
  var id = params.get('id') || '';
  var row = window.FybSupplierSettle.findLedger(id, org.name);
  var body = document.getElementById('saSupLedgerBody');

  function money(v) {
    var n = Number(v);
    return isNaN(n) ? '¥' + v : '¥' + n.toFixed(2);
  }

  function tagClass(status) {
    if (/已结款|已清分|已入账/.test(status) && !/部分|异常/.test(status)) return 'is-ok';
    if (/异常|失败/.test(status)) return 'is-bad';
    return 'is-wait';
  }

  function kv(label, value) {
    return (
      '<div class="sa-sup-od-kv"><span>' +
      label +
      '</span><strong>' +
      (value || '—') +
      '</strong></div>'
    );
  }

  if (!body) return;

  if (!row) {
    body.innerHTML = '<div class="sa-sup-empty">未找到清分明细，或无权查看</div>';
    return;
  }

  body.innerHTML =
    '<article class="sa-sup-card">' +
    '<div class="sa-sup-card__row"><div class="sa-sup-card__no">清分单 ' +
    row.id +
    '</div><span class="sa-sup-tag ' +
    tagClass(row.settleStatus) +
    '">' +
    row.settleStatus +
    '</span></div>' +
    '<div class="sa-sup-od-grid">' +
    kv(
      '订单编号',
      '<a class="sa-sup-link" href="supplier-order-detail.html?orderNo=' +
        encodeURIComponent(row.orderNo) +
        '&from=settle">' +
        row.orderNo +
        '</a>'
    ) +
    kv('商品行号', row.lineNo) +
    kv('订单类型', row.orderType + ' · ' + row.channel) +
    kv('下单门店', row.storeName) +
    kv('下单时间', row.time) +
    '</div></article>' +
    '<article class="sa-sup-card">' +
    '<h3 class="sa-sup-card__name">商品</h3>' +
    '<div class="sa-sup-card__meta">编码 ' +
    row.sku +
    (row.lineNo && row.lineNo !== '—' ? '<br>行号 ' + row.lineNo : '') +
    '</div>' +
    '<div class="sa-sup-card__row" style="margin-top:8px">' +
    '<div><strong>' +
    row.product +
    '</strong><div class="sa-sup-card__meta">' +
    (row.spec || '') +
    ' ×' +
    row.qty +
    '</div></div>' +
    '<div class="sa-sup-card__amt">' +
    money(row.net) +
    '</div></div></article>' +
    '<article class="sa-sup-card">' +
    '<h3 class="sa-sup-card__name">清分金额</h3>' +
    '<div class="sa-sup-od-grid">' +
    kv('采购款', money(row.purchase)) +
    kv('销售价', money(row.sales)) +
    kv('应收金额', money(row.receivable)) +
    kv('退款金额', money(row.refund)) +
    kv('清分净额', money(row.net)) +
    '</div></article>' +
    '<article class="sa-sup-card">' +
    '<h3 class="sa-sup-card__name">状态与时间</h3>' +
    '<div class="sa-sup-od-grid">' +
    kv(
      '清分状态',
      '<span class="sa-sup-tag ' + tagClass(row.clearStatus) + '">' + row.clearStatus + '</span>'
    ) +
    kv(
      '结算状态',
      '<span class="sa-sup-tag ' + tagClass(row.settleStatus) + '">' + row.settleStatus + '</span>'
    ) +
    kv(
      '入账状态',
      '<span class="sa-sup-tag ' + tagClass(row.postingStatus) + '">' + row.postingStatus + '</span>'
    ) +
    kv('清分时间', row.clearTime) +
    kv('结款时间', row.settleTime) +
    kv(
      '关联结款单',
      row.billId
        ? '<a class="sa-sup-link" href="supplier-settle-bill-detail.html?id=' +
            encodeURIComponent(row.billId) +
            '">' +
            row.billId +
            '</a>'
        : '—'
    ) +
    kv('备注', row.remark) +
    '</div></article>' +
    '<div class="sa-sup-card__actions" style="justify-content:stretch;gap:8px;padding:0;border:0;display:flex">' +
    (row.billId
      ? '<a class="sa-sup-od-btn" style="flex:1;text-align:center;text-decoration:none" href="supplier-settle-bill-detail.html?id=' +
        encodeURIComponent(row.billId) +
        '">结款详情</a>'
      : '') +
    '<a class="sa-sup-od-btn sa-sup-od-btn--primary" style="flex:1;text-align:center;text-decoration:none" href="supplier-order-detail.html?orderNo=' +
    encodeURIComponent(row.orderNo) +
    '&from=settle">查看客户订单</a></div>';
})();
