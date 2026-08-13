(function () {
  var api = window.StoreWalletDemo;
  if (!api) return;

  function moneyPlain(n) {
    return Number(n || 0).toFixed(2);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusMeta(item) {
    var st = item.withdrawStatus || 'done';
    if (st === 'pending') return { text: '处理中', cls: '' };
    if (st === 'fail') return { text: '提现失败', cls: 'is-fail' };
    return { text: '已到账', cls: 'is-done' };
  }

  function render() {
    var root = document.getElementById('wdrList');
    if (!root) return;
    var snap = api.snapshot();
    var list = (snap.ledgers || []).filter(function (item) {
      return item.type === '提现申请';
    });
    if (!list.length) {
      root.innerHTML = '<div class="ua-wd-empty">暂无提现记录</div>';
      return;
    }
    root.innerHTML = list
      .map(function (item) {
        var st = statusMeta(item);
        var bank =
          item.bankName && item.bankTail
            ? item.bankName + '(' + item.bankTail + ')'
            : item.remark || '银行卡';
        return (
          '<article class="ua-wd-record">' +
          '<div class="ua-wd-record__top">' +
          '<div class="ua-wd-record__title">提现</div>' +
          '<div class="ua-wd-record__amt">-¥' +
          moneyPlain(item.amount) +
          '</div>' +
          '</div>' +
          '<div class="ua-wd-record__meta">' +
          esc(bank) +
          '<br>' +
          esc(item.time || '') +
          '</div>' +
          '<div class="ua-wd-record__status ' +
          st.cls +
          '">' +
          st.text +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function bind() {
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || '';
    var q = from ? '?from=' + encodeURIComponent(from) : '';
    var back = document.getElementById('wdrBack');
    if (back) back.setAttribute('href', 'store-withdraw.html' + q);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
