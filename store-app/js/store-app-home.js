(function () {
  function toast(msg) {
    var el = document.getElementById('saToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'saToast';
      el.className = 'sa-toast';
      var shell = document.querySelector('.sa-shell');
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function goRestock() {
    window.location.href = '../../user-app/h5/restock.html?from=store-app';
  }

  function goWallet() {
    window.location.href = '../../user-app/h5/store-wallet.html?from=store-app';
  }

  function goBizCenter() {
    window.location.href = 'biz-center.html';
  }

  function goVerify(mode) {
    var qs = [];
    if (mode) qs.push('mode=' + encodeURIComponent(mode));
    window.location.href = 'verify.html' + (qs.length ? '?' + qs.join('&') : '');
  }

  function bindActions() {
    document.querySelectorAll('[data-sa-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-sa-action');
        if (action === 'restock') {
          goRestock();
          return;
        }
        if (action === 'wallet') {
          goWallet();
          return;
        }
        if (action === 'bizCenter') {
          goBizCenter();
          return;
        }
        /* 核销入口：仅原订单核销（补货随原订单提货，不单独建补货单） */
        if (action === 'scan') {
          goVerify('scan');
          return;
        }
        if (action === 'code' || action === 'pending') {
          goVerify();
          return;
        }
        if (action === 'more') {
          window.location.href = 'more.html';
          return;
        }
        var labels = {
          aftersaleQuick: '售后',
          memberCode: '门店会员码',
          orders: '门店订单',
          receive: '收货',
          inventory: '库存查询',
          aftersale: '售后',
          onboarding: '商户进件',
          settings: '设置',
          ai: 'AI'
        };
        toast((labels[action] || '功能') + '（演示）');
      });
    });
  }

  bindActions();
})();
