/**
 * 订单配置 · 包邮配置
 */
(function () {
  var api = window.MdmOrderFreeShip;

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'success');
      return;
    }
    window.alert(msg);
  }

  function readForm() {
    var rule = {};
    (api.ROWS || []).forEach(function (row) {
      var el = document.querySelector('input[name="fs-' + row.key + '"]:checked');
      rule[row.key] = !!(el && el.value === 'yes');
    });
    return rule;
  }

  function fillForm(rule) {
    rule = rule || api.load();
    (api.ROWS || []).forEach(function (row) {
      var yes = !!rule[row.key];
      document.querySelectorAll('input[name="fs-' + row.key + '"]').forEach(function (input) {
        input.checked = input.value === (yes ? 'yes' : 'no');
        var wrap = input.closest('.pts-rule-check-label');
        if (wrap) wrap.classList.toggle('is-checked', input.checked);
      });
    });
  }

  function bindRadios() {
    document.querySelectorAll('input[name^="fs-"]').forEach(function (input) {
      input.addEventListener('change', function () {
        var name = input.name;
        document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
          var wrap = el.closest('.pts-rule-check-label');
          if (wrap) wrap.classList.toggle('is-checked', el.checked);
        });
      });
    });
  }

  function init() {
    if (!api) return;
    fillForm(api.load());
    bindRadios();
    var saveBtn = document.getElementById('fsSaveBtn');
    var resetBtn = document.getElementById('fsResetBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        api.save(readForm());
        toast('包邮配置已保存', 'success');
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        fillForm(api.reset());
        toast('已恢复默认：配送不包邮，自提 / 快递包邮', 'success');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
