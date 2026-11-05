/* 丰银宝 · 供应商视角 · 供应订单 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;

  var ORDERS = [
    { orderNo: 'ORD-2610312466502', lineNo: 'ORD-2610312466502-1', product: '火龙果', qty: 2, amount: '0.04', status: '待结款', type: '零售', time: '2026-10-31 13:58', supplier: '斯斯供应商商家' },
    { orderNo: 'ORD-2610312477895', lineNo: '—', product: '运费验收-快递常温2.5kg', qty: 1, amount: '0.01', status: '待结算', type: '代采', time: '2026-10-31 18:17', supplier: '斯斯供应商商家' },
    { orderNo: 'ORD-261016200015', lineNo: 'ORD-261016200015-2', product: '芒果干', qty: 2, amount: '0.64', status: '结款中', type: '零售', time: '2026-10-16 09:10', supplier: '斯斯供应商商家' },
    { orderNo: 'ORD-261013200012', lineNo: 'ORD-261013200012-1', product: '白芭乐-快递-ss', qty: 1, amount: '0.24', status: '已结款', type: '零售', time: '2026-10-13 10:22', supplier: '斯斯供应商商家' },
    { orderNo: 'ORD-2609033597216', lineNo: 'ORD-2609033597216-1', product: '火龙果', qty: 1, amount: '0.02', status: '部分结款', type: '零售', time: '2026-09-03 18:21', supplier: '斯斯供应商商家' },
    { orderNo: 'ORD-2610307754308', lineNo: 'ORD-2610307754308-1', product: '低糖养乐多', qty: 3, amount: '1.50', status: '已结款', type: '代采', time: '2026-10-30 18:05', supplier: '南京马群枢纽供应商' },
    { orderNo: 'ORD-261008200001', lineNo: 'ORD-261008200001-1', product: '马群-莲藕-快递配送', qty: 5, amount: '11.40', status: '待结算', type: '零售', time: '2026-10-08 14:20', supplier: '南京马群枢纽供应商' },
    { orderNo: 'ORD-2609104841852', lineNo: '353852301770752223', product: '低糖养乐多', qty: 1, amount: '0.01', status: '清分异常', type: '零售', time: '2026-09-10 11:05', supplier: '南京马群枢纽供应商' }
  ];

  var state = { filter: '全部' };
  var org = window.FybOrg.current();
  var orgEl = document.getElementById('saSupOrdersOrg');
  if (orgEl) orgEl.textContent = org.name + ' · 仅看本供应商相关订单行';

  function tagClass(status) {
    if (/已结款/.test(status) && !/部分/.test(status)) return 'is-ok';
    if (/异常|失败/.test(status)) return 'is-bad';
    return 'is-wait';
  }

  function rows() {
    return ORDERS.filter(function (o) {
      if (o.supplier !== org.name) return false;
      if (state.filter === '全部') return true;
      if (state.filter === '零售' || state.filter === '代采') return o.type === state.filter;
      return o.status === state.filter;
    });
  }

  function renderFilter() {
    var host = document.getElementById('saSupOrderFilter');
    if (!host) return;
    var chips = ['全部', '零售', '代采', '待结算', '待结款', '已结款'];
    host.innerHTML = chips
      .map(function (c) {
        return (
          '<button type="button" class="sa-sup-filter__chip' +
          (state.filter === c ? ' is-active' : '') +
          '" data-filter="' +
          c +
          '">' +
          c +
          '</button>'
        );
      })
      .join('');
  }

  function renderList() {
    var host = document.getElementById('saSupOrderList');
    if (!host) return;
    var list = rows();
    if (!list.length) {
      host.innerHTML = '<div class="sa-sup-empty">暂无订单</div>';
      return;
    }
    host.innerHTML = list
      .map(function (o) {
        return (
          '<article class="sa-sup-card">' +
          '<div class="sa-sup-card__row">' +
          '<div class="sa-sup-card__no">' +
          o.orderNo +
          '</div>' +
          '<span class="sa-sup-tag ' +
          tagClass(o.status) +
          '">' +
          o.status +
          '</span></div>' +
          '<h3 class="sa-sup-card__name">' +
          o.product +
          ' ×' +
          o.qty +
          '</h3>' +
          '<div class="sa-sup-card__row">' +
          '<div class="sa-sup-card__meta">' +
          o.type +
          ' · ' +
          o.time +
          (o.lineNo && o.lineNo !== '—' ? '<br>行号 ' + o.lineNo : '') +
          '</div>' +
          '<div class="sa-sup-card__amt">¥' +
          o.amount +
          '</div></div></article>'
        );
      })
      .join('');
  }

  function render() {
    renderFilter();
    renderList();
  }

  document.getElementById('saSupOrderFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    state.filter = btn.getAttribute('data-filter');
    render();
  });

  render();
})();
