/* 丰银宝 · 供应商视角 · 结算中心 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;

  var LEDGER = [
    { id: '1721', orderNo: 'ORD-2610312477895', product: '运费验收-快递常温2.5kg', net: '0.01', clearStatus: '已清分', settleStatus: '待结算', time: '2026-10-31 18:17', supplier: '斯斯供应商商家' },
    { id: '1719', orderNo: 'ORD-2610312466502', product: '火龙果', net: '0.04', clearStatus: '已清分', settleStatus: '待结款', time: '2026-10-31 13:58', supplier: '斯斯供应商商家' },
    { id: '1705', orderNo: 'ORD-261016200015', product: '芒果干', net: '0.64', clearStatus: '已清分', settleStatus: '结款中', time: '2026-10-16 09:10', supplier: '斯斯供应商商家' },
    { id: '1708', orderNo: 'ORD-261013200012', product: '白芭乐-快递-ss', net: '0.24', clearStatus: '已清分', settleStatus: '已结款', time: '2026-10-13 10:22', supplier: '斯斯供应商商家' },
    { id: '1716', orderNo: 'ORD-2610307754308', product: '低糖养乐多', net: '1.50', clearStatus: '已清分', settleStatus: '已结款', time: '2026-10-30 18:05', supplier: '南京马群枢纽供应商' },
    { id: '1699', orderNo: 'ORD-261008200001', product: '马群-莲藕-快递配送', net: '11.40', clearStatus: '已清分', settleStatus: '待结算', time: '2026-10-08 14:20', supplier: '南京马群枢纽供应商' },
    { id: '1690', orderNo: 'ORD-2609104841852', product: '低糖养乐多', net: '0.01', clearStatus: '清分异常', settleStatus: '待结算', time: '2026-09-10 11:05', supplier: '南京马群枢纽供应商' }
  ];

  var BILLS = [
    { id: 'ST_357556279620669440', net: '0.01', orders: 1, status: '待结款', created: '2026-09-14 00:01', cycle: '2026-09-12', supplier: '斯斯供应商商家' },
    { id: 'ST_353846837167284224', net: '0.04', orders: 2, status: '部分结款', created: '2026-09-03 18:21', cycle: '2026-09-03', supplier: '斯斯供应商商家' },
    { id: 'ST_2088198765544431618', net: '0.24', orders: 1, status: '已结款', created: '2026-08-15 18:21', cycle: '2026-08-14', supplier: '斯斯供应商商家' },
    { id: 'ST_2086759712106688514', net: '0.64', orders: 1, status: '结款中', created: '2026-08-10 18:21', cycle: '2026-08-10', supplier: '斯斯供应商商家' },
    { id: 'ST_358643443066482688', net: '0.02', orders: 2, status: '待结款', created: '2026-09-17 00:01', cycle: '2026-09-10', supplier: '南京马群枢纽供应商' },
    { id: 'ST_351310165011607552', net: '1.50', orders: 1, status: '已结款', created: '2026-08-27 18:21', cycle: '2026-08-27', supplier: '南京马群枢纽供应商' }
  ];

  var ACCOUNTS = {
    'sup-ss': { accountName: '小牛供应链有限公司', accountNo: '6666000218008801' },
    'sup-mq': { accountName: '南京冷链物流服务有限公司', accountNo: '6666000219001108' }
  };

  var org = window.FybOrg.current();
  var state = { tab: 'account' };
  var orgEl = document.getElementById('saSupSettleOrg');
  if (orgEl) orgEl.textContent = org.name;

  function money(v) {
    var n = Number(v);
    return isNaN(n) ? '¥' + v : '¥' + n.toFixed(2);
  }

  function tagClass(status) {
    if (/已结款/.test(status) && !/部分/.test(status)) return 'is-ok';
    if (/异常|失败/.test(status)) return 'is-bad';
    return 'is-wait';
  }

  function mineLedger() {
    return LEDGER.filter(function (x) {
      return x.supplier === org.name;
    });
  }

  function mineBills() {
    return BILLS.filter(function (x) {
      return x.supplier === org.name;
    });
  }

  function renderAccount() {
    var ledger = mineLedger();
    var pending = 0;
    var settled = 0;
    ledger.forEach(function (x) {
      var n = Number(x.net) || 0;
      if (x.settleStatus === '已结款') settled += n;
      else pending += n;
    });
    var acc = ACCOUNTS[org.id] || { accountName: '—', accountNo: '—' };
    return (
      '<div class="sa-sup-summary">' +
      '<div class="sa-sup-summary__item"><span>待结算/在途</span><strong>' +
      money(pending) +
      '</strong></div>' +
      '<div class="sa-sup-summary__item"><span>已结款</span><strong>' +
      money(settled) +
      '</strong></div></div>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">收款账户</h3>' +
      '<div class="sa-sup-card__meta">账户名称 ' +
      acc.accountName +
      '<br>商户号 ' +
      acc.accountNo +
      '<br>口径：按本商家订单归集，不展示平台共用汇付余额</div></article>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">结算说明</h3>' +
      '<div class="sa-sup-card__meta">起算节点与周期以供应商档案配置为准；平台改默认后，跟随平台的配置会自动同步。<br>已生成清分不变，新增清分按新配置。多商品按行分别入池。</div></article>'
    );
  }

  function renderLedger() {
    var list = mineLedger();
    if (!list.length) return '<div class="sa-sup-empty">暂无清分明细</div>';
    return list
      .map(function (x) {
        return (
          '<article class="sa-sup-card">' +
          '<div class="sa-sup-card__row"><div class="sa-sup-card__no">' +
          x.orderNo +
          '</div><span class="sa-sup-tag ' +
          tagClass(x.settleStatus) +
          '">' +
          x.settleStatus +
          '</span></div>' +
          '<h3 class="sa-sup-card__name">' +
          x.product +
          '</h3>' +
          '<div class="sa-sup-card__row"><div class="sa-sup-card__meta">清分 ' +
          x.clearStatus +
          ' · ' +
          x.time +
          '</div><div class="sa-sup-card__amt">' +
          money(x.net) +
          '</div></div></article>'
        );
      })
      .join('');
  }

  function renderBills() {
    var list = mineBills();
    if (!list.length) return '<div class="sa-sup-empty">暂无结款单</div>';
    return list
      .map(function (x) {
        return (
          '<article class="sa-sup-card">' +
          '<div class="sa-sup-card__row"><div class="sa-sup-card__no">' +
          x.id +
          '</div><span class="sa-sup-tag ' +
          tagClass(x.status) +
          '">' +
          x.status +
          '</span></div>' +
          '<div class="sa-sup-card__row"><div class="sa-sup-card__meta">账期 ' +
          x.cycle +
          '<br>创建 ' +
          x.created +
          ' · ' +
          x.orders +
          ' 单</div><div class="sa-sup-card__amt">' +
          money(x.net) +
          '</div></div></article>'
        );
      })
      .join('');
  }

  function render() {
    var body = document.getElementById('saSupSettleBody');
    if (!body) return;
    if (state.tab === 'ledger') body.innerHTML = renderLedger();
    else if (state.tab === 'bills') body.innerHTML = renderBills();
    else body.innerHTML = renderAccount();
  }

  document.querySelector('.sa-sup-tabs').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-tab]');
    if (!btn) return;
    state.tab = btn.getAttribute('data-tab');
    document.querySelectorAll('.sa-sup-tabs__btn').forEach(function (b) {
      b.classList.toggle('is-active', b === btn);
    });
    render();
  });

  render();
})();
