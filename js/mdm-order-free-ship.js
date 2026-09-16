/**
 * 包邮配置（渠道 × 履约开关）
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

  function switchEl(channel, fulfill) {
    return document.querySelector(
      '.pts-rule-switch[data-channel="' + channel + '"][data-fulfill="' + fulfill + '"]'
    );
  }

  function isLockedBtn(btn) {
    if (!btn || !api) return false;
    if (typeof api.isLocked === 'function') {
      return api.isLocked(btn.getAttribute('data-channel'), btn.getAttribute('data-fulfill'));
    }
    return btn.getAttribute('data-locked') === '1';
  }

  function setSwitch(btn, on) {
    if (!btn) return;
    var locked = isLockedBtn(btn);
    var next = locked ? true : !!on;
    btn.classList.toggle('is-on', next);
    btn.setAttribute('aria-pressed', next ? 'true' : 'false');
    btn.disabled = locked;
    btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
    var text = btn.parentElement && btn.parentElement.querySelector('.pts-rule-switch__text');
    if (text) text.textContent = next ? (locked ? '开启（不可变更）' : '开启') : '关闭';
  }

  function readForm() {
    var rule = { retail: {}, proxy: {} };
    (api.CHANNELS || []).forEach(function (ch) {
      rule[ch.key] = {};
      ch.rows.forEach(function (row) {
        var btn = switchEl(ch.key, row.key);
        rule[ch.key][row.key] = !!(btn && btn.classList.contains('is-on'));
      });
    });
    return rule;
  }

  function fillForm(rule) {
    rule = rule || api.load();
    (api.CHANNELS || []).forEach(function (ch) {
      var src = (rule && rule[ch.key]) || {};
      ch.rows.forEach(function (row) {
        setSwitch(switchEl(ch.key, row.key), !!src[row.key]);
      });
    });
  }

  function bindSwitches() {
    document.querySelectorAll('.pts-rule-switch[data-channel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (isLockedBtn(btn)) return;
        setSwitch(btn, !btn.classList.contains('is-on'));
      });
    });
  }

  function init() {
    if (!api) return;
    fillForm(api.load());
    bindSwitches();
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
        toast('已恢复默认：零售自提/快递、代采快递固定包邮；代采配送关闭', 'success');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
