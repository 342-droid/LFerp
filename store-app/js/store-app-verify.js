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
    }, 1800);
  }

  function bindVerify() {
    var orderBtn = document.getElementById('saOrderVerifyBtn');
    if (!orderBtn) return;
    orderBtn.addEventListener('click', function () {
      var code = String((document.getElementById('saMemberCode') || {}).value || '').trim();
      if (!code) {
        toast('请扫描或输入会员码');
        return;
      }
      /* 补货随原订单核销，不单独核销补货单 */
      toast('会员码核销成功（演示）');
    });
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var mode = (params.get('mode') || '').trim();
    if (mode === 'scan') toast('请对准用户会员码扫码（演示）');
    bindVerify();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
