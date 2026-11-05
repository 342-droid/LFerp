/* 丰银宝 · 供应商 · 结款单详情 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierSettle) return;

  var org = window.FybOrg.current();
  var params = new URLSearchParams(location.search);
  var id = params.get('id') || '';
  var bill = window.FybSupplierSettle.findBill(id, org.name);
  var body = document.getElementById('saSupBillBody');
  var acc = window.FybSupplierSettle.accounts[org.id] || { accountName: '—', accountNo: '—' };

  function money(v) {
    var n = Number(v);
    return isNaN(n) ? '¥' + v : '¥' + n.toFixed(2);
  }

  function tagClass(status) {
    if (/已结款/.test(status) && !/部分/.test(status)) return 'is-ok';
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

  if (!bill) {
    body.innerHTML = '<div class="sa-sup-empty">未找到结款单，或无权查看</div>';
    return;
  }

  var lines = Array.isArray(bill.lines) ? bill.lines : [];
  var linesHtml = lines.length
    ? lines
        .map(function (ln) {
          return (
            '<article class="sa-sup-card sa-sup-card--nested">' +
            '<div class="sa-sup-card__row"><div class="sa-sup-card__no">' +
            '<a class="sa-sup-link" href="supplier-order-detail.html?orderNo=' +
            encodeURIComponent(ln.orderNo) +
            '&from=settle">' +
            ln.orderNo +
            '</a></div><span class="sa-sup-tag ' +
            tagClass(ln.status) +
            '">' +
            ln.status +
            '</span></div>' +
            '<div class="sa-sup-card__row"><div><strong>' +
            ln.product +
            '</strong><div class="sa-sup-card__meta">×' +
            ln.qty +
            (ln.ledgerId
              ? ' · <a class="sa-sup-link" href="supplier-settle-ledger-detail.html?id=' +
                encodeURIComponent(ln.ledgerId) +
                '">清分 ' +
                ln.ledgerId +
                '</a>'
              : '') +
            '</div></div><div class="sa-sup-card__amt">' +
            money(ln.net) +
            '</div></div>' +
            '<div class="sa-sup-card__meta">货款 ' +
            money(ln.goods) +
            ' · 服务费/佣金 ' +
            money(ln.fee) +
            '</div></article>'
          );
        })
        .join('')
    : '<div class="sa-sup-empty">暂无订单明细</div>';

  body.innerHTML =
    '<article class="sa-sup-card">' +
    '<div class="sa-sup-card__row"><div class="sa-sup-card__no">结款单 ' +
    bill.id +
    '</div><span class="sa-sup-tag ' +
    tagClass(bill.status) +
    '">' +
    bill.status +
    '</span></div>' +
    '<div class="sa-sup-od-grid">' +
    kv('单据类型', '供应商销售结算单') +
    kv('供应商', bill.supplier) +
    kv('结算周期', bill.cycle) +
    kv('订单数', String(bill.orders)) +
    kv('创建时间', bill.created) +
    kv('审核时间', bill.auditTime || '—') +
    '</div></article>' +
    '<article class="sa-sup-card">' +
    '<h3 class="sa-sup-card__name">结款金额</h3>' +
    '<div class="sa-sup-od-grid">' +
    kv('货款合计（应收）', money(bill.goods)) +
    kv('应付合计（服务费+佣金）', money(bill.payable)) +
    kv('应付供应商净额', money(bill.net)) +
    kv('已结款金额', money(bill.paid)) +
    kv('待结款金额', money(bill.unpaid)) +
    '</div></article>' +
    '<article class="sa-sup-card">' +
    '<h3 class="sa-sup-card__name">收付款信息</h3>' +
    '<div class="sa-sup-od-grid">' +
    kv('付款方', '平台') +
    kv('收款账户名称', acc.accountName) +
    kv('收款账户', acc.accountNo) +
    kv('收款时间', bill.payTime || '—') +
    kv('通道流水号', bill.flowNo || '—') +
    kv('异常原因', bill.exception || '—') +
    '</div></article>' +
    '<h3 class="sa-sup-section-title">订单明细</h3>' +
    linesHtml;
})();
