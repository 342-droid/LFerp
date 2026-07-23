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

  function bindActions() {
    document.querySelectorAll('[data-sa-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-sa-action');
        if (action === 'restock') {
          goRestock();
          return;
        }
        var labels = {
          scan: '扫码核销',
          code: '输码核销',
          pending: '待核销',
          aftersaleQuick: '售后',
          memberCode: '门店会员码',
          orders: '门店订单',
          receive: '收货',
          inventory: '库存查询',
          aftersale: '售后',
          onboarding: '商户进件',
          settings: '设置',
          ai: 'AI',
          more: '更多'
        };
        toast((labels[action] || '功能') + '（演示）');
      });
    });
  }

  bindActions();
})();
