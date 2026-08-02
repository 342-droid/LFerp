(function () {
  var api = window.StoreWalletDemo;
  if (!api) return;

  var tab = 'all';
  var snap = api.snapshot();

  function moneyPlain(n) {
    return Number(n).toFixed(2);
  }

  function renderSummary() {
    snap = api.snapshot();
    var depEl = document.getElementById('swDepositActual');
    var metaEl = document.getElementById('swDepositMeta');
    var gapEl = document.getElementById('swDepositGap');
    if (depEl) depEl.textContent = api.money(snap.depositActual);
    if (metaEl) {
      metaEl.textContent =
        '应保有 ' + api.money(snap.depositRequired) + ' · 不可提现 · 售后问责/佣金回退';
    }
    if (gapEl) {
      if (snap.depositGap > 0) {
        gapEl.textContent = '缺口 ' + api.money(snap.depositGap);
        gapEl.classList.add('is-warn');
      } else {
        gapEl.textContent = '无缺口';
        gapEl.classList.remove('is-warn');
      }
    }
    setText('swAvailable', moneyPlain(snap.available));
    setText('swGoodsQuota', api.money(snap.goodsQuota));
    setText('swWithdrawable', api.money(snap.withdrawable));
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function matchTab(item) {
    if (tab === 'all') return true;
    if (tab === 'in') return item.dir === 'in';
    if (tab === 'out') return item.dir === 'out';
    if (tab === 'lock') return item.dir === 'lock';
    return true;
  }

  function amtClass(dir) {
    if (dir === 'in') return 'is-in';
    if (dir === 'lock') return 'is-lock';
    return 'is-out';
  }

  function amtPrefix(dir) {
    if (dir === 'in') return '+';
    if (dir === 'out') return '-';
    return '';
  }

  function renderList() {
    var host = document.getElementById('swLedgerList');
    if (!host) return;
    var list = (snap.ledgers || []).filter(matchTab);
    if (!list.length) {
      host.innerHTML = '<div class="ua-sw-empty">暂无流水</div>';
      return;
    }
    host.innerHTML = list
      .map(function (item) {
        return (
          '<button type="button" class="ua-sw-ledger" data-ledger-id="' +
          item.id +
          '">' +
          '<div>' +
          '<div class="ua-sw-ledger__title">' +
          item.type +
          ' · ' +
          item.account +
          '</div>' +
          '<div class="ua-sw-ledger__sub">' +
          item.time +
          '<br>' +
          (item.remark || item.bizNo || '') +
          '</div>' +
          '</div>' +
          '<div class="ua-sw-ledger__amt ' +
          amtClass(item.dir) +
          '">' +
          amtPrefix(item.dir) +
          api.money(item.amount) +
          '</div>' +
          '</button>'
        );
      })
      .join('');
  }

  function openDetail(id) {
    var item = (snap.ledgers || []).find(function (x) {
      return x.id === id;
    });
    if (!item) return;
    var sheet = document.getElementById('swDetailSheet');
    var title = document.getElementById('swDetailTitle');
    var body = document.getElementById('swDetailBody');
    if (!sheet || !body) return;
    if (title) title.textContent = item.type;
    var rows =
      row('时间', item.time) +
      row('账户', item.account) +
      row('金额', amtPrefix(item.dir) + api.money(item.amount)) +
      row('业务单号', item.bizNo || '—') +
      row('渠道流水', item.channelNo || '—') +
      row('说明', item.remark || '—');
    if (item.detailEvents && item.detailEvents.length) {
      rows +=
        '<div class="ua-sw-sheet__events"><h4>资金事件</h4>' +
        item.detailEvents
          .map(function (ev) {
            return '<div class="ua-sw-sheet__row"><span>' + ev.name + '</span><span>' + api.money(ev.amount) + '</span></div>';
          })
          .join('') +
        '</div>';
    }
    body.innerHTML = rows;
    sheet.hidden = false;
  }

  function row(k, v) {
    return '<div class="ua-sw-sheet__row"><span>' + k + '</span><span>' + v + '</span></div>';
  }

  function bind() {
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || '';
    var back = document.getElementById('swBack');
    if (back) {
      if (from === 'store-app') {
        back.setAttribute('href', '../../store-app/h5/home.html');
      } else if (from.indexOf('restock') >= 0) {
        back.setAttribute('href', 'restock.html?from=store-app&tab=me');
      }
    }

    document.querySelectorAll('[data-sw-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab = btn.getAttribute('data-sw-tab');
        document.querySelectorAll('[data-sw-tab]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderList();
      });
    });

    document.getElementById('swLedgerList') &&
      document.getElementById('swLedgerList').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-ledger-id]');
        if (!btn) return;
        openDetail(btn.getAttribute('data-ledger-id'));
      });

    document.querySelectorAll('[data-sw-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        var sheet = document.getElementById('swDetailSheet');
        if (sheet) sheet.hidden = true;
      });
    });

    document.getElementById('swRechargeBtn') &&
      document.getElementById('swRechargeBtn').addEventListener('click', function () {
        window.alert('充值（演示）：后续入金默认可提现；若有保证金缺口将优先补齐。');
      });

    document.getElementById('swWithdrawBtn') &&
      document.getElementById('swWithdrawBtn').addEventListener('click', function () {
        snap = api.snapshot();
        if (snap.depositGap > 0) {
          window.alert('保证金存在缺口 ' + api.money(snap.depositGap) + '，请先补齐后再提现。');
          return;
        }
        window.alert(
          '提现（演示·P3）：可提现 ' +
            api.money(snap.withdrawable) +
            '。保证金与不可提现货款不可提现。'
        );
      });

    var resetBtn = document.getElementById('swResetDemo');
    if (resetBtn) {
      resetBtn.hidden = false;
      resetBtn.addEventListener('click', function () {
        if (!window.confirm('重置门店钱包演示数据？')) return;
        if (typeof api.resetDemo === 'function') api.resetDemo();
        renderSummary();
        renderList();
      });
    }
  }

  renderSummary();
  renderList();
  bind();
})();
