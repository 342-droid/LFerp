/* 丰银宝 · 供应商结算中心
 * PC：清分台账全量筛 / 供应商结算对账；App：本商家归集，时间+状态快捷，结款/清分详情可跳转 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierSettle || !window.FybSupplierFilters) return;

  var F = window.FybSupplierFilters;
  var org = window.FybOrg.current();
  var initTab = new URLSearchParams(location.search).get('tab');
  var state = {
    tab: initTab === 'ledger' || initTab === 'bills' || initTab === 'account' ? initTab : 'account',
    time: 'all',
    clearStatus: '全部',
    settleStatus: '全部',
    billStatus: '全部'
  };
  var orgEl = document.getElementById('saSupSettleOrg');
  if (orgEl) orgEl.textContent = org.name + ' · 按本商家订单归集';

  function money(v) {
    var n = Number(v);
    return isNaN(n) ? '¥' + v : '¥' + n.toFixed(2);
  }

  function tagClass(status) {
    if (/已结款|已清分|已入账/.test(status) && !/部分|异常/.test(status)) return 'is-ok';
    if (/异常|失败/.test(status)) return 'is-bad';
    return 'is-wait';
  }

  function mineLedger() {
    return window.FybSupplierSettle.listLedgerBySupplier(org.name).filter(function (x) {
      if (state.clearStatus !== '全部' && x.clearStatus !== state.clearStatus) return false;
      if (state.settleStatus !== '全部' && x.settleStatus !== state.settleStatus) return false;
      return F.matchTime(x.time, state.time);
    });
  }

  function mineBills() {
    return window.FybSupplierSettle.listBillsBySupplier(org.name).filter(function (x) {
      if (state.billStatus !== '全部' && x.status !== state.billStatus) return false;
      return F.matchTime(x.created, state.time);
    });
  }

  function allLedger() {
    return window.FybSupplierSettle.listLedgerBySupplier(org.name);
  }

  function renderAccount() {
    var ledger = allLedger();
    var pending = 0;
    var settled = 0;
    ledger.forEach(function (x) {
      var n = Number(x.net) || 0;
      if (x.settleStatus === '已结款') settled += n;
      else pending += n;
    });
    var acc = window.FybSupplierSettle.accounts[org.id] || { accountName: '—', accountNo: '—' };
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
      '</div></article>' +
      '<article class="sa-sup-card">' +
      '<h3 class="sa-sup-card__name">结算信息</h3>' +
      '<div class="sa-sup-card__meta">起算节点与周期以供应商档案配置为准；平台改默认后，跟随平台的配置会自动同步。<br>已生成清分不变，新增清分按新配置。多商品按行分别入池。</div></article>'
    );
  }

  function filterBar(kind) {
    var html = F.timeRowHtml(state.time);
    if (kind === 'ledger') {
      html +=
        '<div class="sa-sup-filter__l2" role="tablist" aria-label="清分状态">' +
        ['全部']
          .concat(F.CLEAR_STATUSES)
          .map(function (s) {
            return F.chip(s, state.clearStatus === s, 'data-clear');
          })
          .join('') +
        '</div>';
      html +=
        '<div class="sa-sup-filter__l2" role="tablist" aria-label="结算状态">' +
        ['全部']
          .concat(F.SETTLE_STATUSES)
          .map(function (s) {
            return F.chip(s, state.settleStatus === s, 'data-settle');
          })
          .join('') +
        '</div>';
    } else if (kind === 'bills') {
      html +=
        '<div class="sa-sup-filter__l2" role="tablist" aria-label="结款状态">' +
        ['全部']
          .concat(F.BILL_STATUSES)
          .map(function (s) {
            return F.chip(s, state.billStatus === s, 'data-bill-status');
          })
          .join('') +
        '</div>';
    }
    return '<div class="sa-sup-filter" id="saSupSettleFilter">' + html + '</div>';
  }

  function renderLedger() {
    var list = mineLedger();
    var bar = filterBar('ledger');
    if (!list.length) return bar + '<div class="sa-sup-empty">暂无清分明细</div>';
    return (
      bar +
      list
        .map(function (x) {
          return (
            '<article class="sa-sup-card sa-sup-card--tap" data-ledger-id="' +
            x.id +
            '">' +
            '<div class="sa-sup-card__row"><div class="sa-sup-card__no">' +
            '<a class="sa-sup-link" href="supplier-order-detail.html?orderNo=' +
            encodeURIComponent(x.orderNo) +
            '&from=settle" data-act="order">' +
            x.orderNo +
            '</a>' +
            '</div><span class="sa-sup-tag ' +
            tagClass(x.settleStatus) +
            '">' +
            x.settleStatus +
            '</span></div>' +
            '<h3 class="sa-sup-card__name">' +
            x.product +
            '</h3>' +
            '<div class="sa-sup-card__row"><div class="sa-sup-card__meta">' +
            (x.orderType || '') +
            ' · 清分 ' +
            x.clearStatus +
            ' · 入账 ' +
            (x.postingStatus || '—') +
            '<br>' +
            x.time +
            ' · 清分单 ' +
            x.id +
            (x.billId
              ? '<br>结款单 <a class="sa-sup-link" href="supplier-settle-bill-detail.html?id=' +
                encodeURIComponent(x.billId) +
                '" data-act="order">' +
                x.billId +
                '</a>'
              : '') +
            '</div><div class="sa-sup-card__amt">' +
            money(x.net) +
            '</div></div>' +
            '<div class="sa-sup-card__actions"><button type="button" class="sa-sup-card__act" data-act="detail">查看详情</button></div>' +
            '</article>'
          );
        })
        .join('')
    );
  }

  function renderBills() {
    var list = mineBills();
    var bar = filterBar('bills');
    if (!list.length) return bar + '<div class="sa-sup-empty">暂无结款单</div>';
    return (
      bar +
      list
        .map(function (x) {
          return (
            '<article class="sa-sup-card sa-sup-card--tap" data-bill-id="' +
            x.id +
            '">' +
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
            ' 单' +
            (x.unpaid != null ? '<br>待结款 ' + money(x.unpaid) : '') +
            '</div><div class="sa-sup-card__amt">' +
            money(x.net) +
            '</div></div>' +
            '<div class="sa-sup-card__actions"><button type="button" class="sa-sup-card__act" data-act="bill-detail">结款详情</button></div>' +
            '</article>'
          );
        })
        .join('')
    );
  }

  function goLedgerDetail(id) {
    window.location.href =
      'supplier-settle-ledger-detail.html?id=' + encodeURIComponent(id || '');
  }

  function goBillDetail(id) {
    window.location.href =
      'supplier-settle-bill-detail.html?id=' + encodeURIComponent(id || '');
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

  document.getElementById('saSupSettleBody').addEventListener('click', function (e) {
    var filterHost = e.target.closest('#saSupSettleFilter');
    if (filterHost) {
      var timeBtn = e.target.closest('[data-time]');
      if (timeBtn) {
        state.time = timeBtn.getAttribute('data-time');
        render();
        return;
      }
      var clearBtn = e.target.closest('[data-clear]');
      if (clearBtn) {
        state.clearStatus = clearBtn.getAttribute('data-clear');
        render();
        return;
      }
      var settleBtn = e.target.closest('[data-settle]');
      if (settleBtn) {
        state.settleStatus = settleBtn.getAttribute('data-settle');
        render();
        return;
      }
      var billStatusBtn = e.target.closest('[data-bill-status]');
      if (billStatusBtn) {
        state.billStatus = billStatusBtn.getAttribute('data-bill-status');
        render();
        return;
      }
      return;
    }
    var orderLink = e.target.closest('[data-act="order"]');
    if (orderLink) return;
    var billCard = e.target.closest('[data-bill-id]');
    if (billCard) {
      e.preventDefault();
      goBillDetail(billCard.getAttribute('data-bill-id'));
      return;
    }
    var card = e.target.closest('[data-ledger-id]');
    if (!card) return;
    e.preventDefault();
    goLedgerDetail(card.getAttribute('data-ledger-id'));
  });

  document.querySelectorAll('.sa-sup-tabs__btn').forEach(function (b) {
    b.classList.toggle('is-active', b.getAttribute('data-tab') === state.tab);
  });
  render();
})();
