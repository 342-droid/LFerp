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
    var total = Number(snap.depositActual || 0) + Number(snap.available || 0);
    var totalWithdraw = Number(snap.withdrawable || 0);
    setText('swTotalAmount', moneyPlain(total));
    setText('swTotalWithdrawable', moneyPlain(totalWithdraw));
    setText('swDepositActual', moneyPlain(snap.depositActual));
    setText('swDepositWithdrawable', '0.00');
    setText('swAvailable', moneyPlain(snap.available));
    setText('swWithdrawable', moneyPlain(snap.withdrawable));
    setText('swGoodsQuota', moneyPlain(snap.goodsQuota));
    var metaEl = document.getElementById('swDepositMeta');
    if (metaEl) {
      var gap = Number(snap.depositGap || 0);
      metaEl.textContent =
        '应保有 ¥' +
        moneyPlain(snap.depositRequired) +
        (gap > 0 ? ' · 缺口 ¥' + moneyPlain(gap) : '');
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /** 收入含平台佣金；支出含佣金回退 */
  var INCOME_TYPES = ['平台佣金', '佣金入账', '首次入金', '充值', '支付退回'];
  var EXPENSE_TYPES = ['佣金回退', '余额支付', '售后问责', '提现申请'];

  function matchTab(item) {
    if (tab === 'all') return true;
    var type = String(item.type || '');
    if (tab === 'in') {
      return item.dir === 'in' || INCOME_TYPES.indexOf(type) >= 0;
    }
    if (tab === 'out') {
      return item.dir === 'out' || EXPENSE_TYPES.indexOf(type) >= 0;
    }
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

  function accountLabel(account) {
    var a = String(account || '');
    if (a.indexOf('保证金') >= 0 && a.indexOf('余额') >= 0) return '保证金账户/余额账户';
    if (a.indexOf('保证金') >= 0) return '保证金账户';
    if (a.indexOf('余额') >= 0) return '余额账户';
    return a || '—';
  }

  function ledgerStatus(item) {
    if (item.type === '提现申请') {
      return { text: '处理中', cls: 'is-pending', action: '' };
    }
    if (item.dir === 'lock') {
      return { text: '已锁定', cls: 'is-lock', action: '' };
    }
    if (item.type === '余额支付') {
      return { text: '支付成功', cls: 'is-ok', action: '' };
    }
    if (item.type === '平台佣金' || item.type === '佣金入账') {
      return { text: '入账成功', cls: 'is-ok', action: '' };
    }
    if (item.type === '佣金回退') {
      return { text: '已回退', cls: '', action: '' };
    }
    if (item.dir === 'in') {
      return { text: '入账成功', cls: 'is-ok', action: '' };
    }
    return { text: '已完成', cls: '', action: '' };
  }

  function formatShortTime(t) {
    var s = String(t || '');
    var m = s.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
    if (m) return m[2] + '.' + m[3] + ' ' + m[4];
    return s;
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
        var st = ledgerStatus(item);
        var biz = item.bizNo || item.id;
        return (
          '<article class="ua-sw-ledger" data-ledger-id="' +
          escHtml(item.id) +
          '">' +
          '<div class="ua-sw-ledger__head">' +
          '<div class="ua-sw-ledger__id"><em>业务单号:</em>' +
          escHtml(biz) +
          '</div>' +
          '<button type="button" class="ua-sw-ledger__copy" data-sw-copy="' +
          escHtml(biz) +
          '" aria-label="复制业务单号">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<rect x="8" y="8" width="11" height="11" rx="2"/>' +
          '<path d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1"/>' +
          '</svg></button>' +
          '</div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">金额</span>' +
          '<span class="ua-sw-ledger__v ' +
          amtClass(item.dir) +
          '">' +
          amtPrefix(item.dir) +
          api.money(item.amount) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">业务类型</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(item.type) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">账户</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(accountLabel(item.account)) +
          '</span></div>' +
          '<div class="ua-sw-ledger__row"><span class="ua-sw-ledger__k">支付流水</span>' +
          '<span class="ua-sw-ledger__v">' +
          escHtml(item.channelNo || '—') +
          '</span></div>' +
          '<div class="ua-sw-ledger__foot">' +
          '<span class="ua-sw-ledger__time">' +
          escHtml(formatShortTime(item.time)) +
          '</span>' +
          '<span class="ua-sw-ledger__status ' +
          st.cls +
          '">' +
          escHtml(st.text) +
          '</span>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function bind() {
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || '';
    var back = document.getElementById('swBack');
    if (back) {
      if (from === 'store-app') {
        back.setAttribute('href', '../../store-app/h5/home.html');
      } else if (from.indexOf('biz-center') >= 0) {
        back.setAttribute('href', '../../store-app/h5/biz-center.html');
      } else if (from.indexOf('restock') >= 0) {
        back.setAttribute('href', 'restock.html?from=store-app&tab=me');
      }
    }

    document.querySelectorAll('[data-sw-help]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-sw-help');
        if (kind === 'deposit') {
          window.alert('保证金账户：入驻锁定资金，不可提现；售后问责/佣金回退可能占用；有缺口时入账优先补齐。');
          return;
        }
        if (kind === 'balance') {
          window.alert('余额账户：进货可支付；不可提现货款 + 可提现余额；佣金与后续充值计入可提现。');
        }
      });
    });

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
        var copyBtn = e.target.closest('[data-sw-copy]');
        if (!copyBtn) return;
        e.preventDefault();
        e.stopPropagation();
        var text = copyBtn.getAttribute('data-sw-copy') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              window.alert('已复制业务单号');
            },
            function () {
              window.alert(text);
            }
          );
        } else {
          window.alert('已复制：' + text);
        }
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
