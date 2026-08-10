/**
 * 结算 · 账户配置 — 门店账户设置
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
    else window.alert(msg);
  }

  function readForm() {
    var deposit = Number(($('sacDepositRequired') && $('sacDepositRequired').value) || '');
    var goods = Number(($('sacGoodsQuotaRequired') && $('sacGoodsQuotaRequired').value) || '');
    var affectEl = document.querySelector('input[name="sacAffectHistory"]:checked');
    return {
      depositRequired: deposit,
      goodsQuotaRequired: goods,
      affectHistory: affectEl ? affectEl.value : 'no'
    };
  }

  function fillForm(cfg) {
    if ($('sacDepositRequired')) {
      $('sacDepositRequired').value =
        cfg.depositRequired != null ? String(cfg.depositRequired) : '';
    }
    if ($('sacGoodsQuotaRequired')) {
      $('sacGoodsQuotaRequired').value =
        cfg.goodsQuotaRequired != null ? String(cfg.goodsQuotaRequired) : '';
    }
    var val = cfg.affectHistory === 'yes' ? 'yes' : 'no';
    document.querySelectorAll('input[name="sacAffectHistory"]').forEach(function (r) {
      r.checked = r.value === val;
    });
  }

  function validate(form) {
    if (!(form.depositRequired >= 0) || Number.isNaN(form.depositRequired)) {
      return '请填写有效的保证金账户金额';
    }
    if (!(form.goodsQuotaRequired >= 0) || Number.isNaN(form.goodsQuotaRequired)) {
      return '请填写有效的货款金额';
    }
    return '';
  }

  function applyHistoryIfNeeded(cfg) {
    if (cfg.affectHistory !== 'yes') return;
    if (
      !window.StoreWalletDemo ||
      typeof window.StoreWalletDemo.applyPlatformAccountRule !== 'function'
    ) {
      return;
    }
    window.StoreWalletDemo.applyPlatformAccountRule({
      depositRequired: cfg.depositRequired,
      goodsQuotaRequired: cfg.goodsQuotaRequired
    });
  }

  function bind() {
    var api = window.StoreAccountConfig;
    if (!api) return;

    fillForm(api.getPlatform());

    var section = $('sacStoreSection');
    var toggle = $('sacStoreSectionToggle');
    if (toggle && section) {
      toggle.addEventListener('click', function () {
        section.classList.toggle('is-collapsed');
      });
      toggle.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          section.classList.toggle('is-collapsed');
        }
      });
    }

    var resetBtn = $('sacResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        fillForm(api.DEFAULT_PLATFORM);
        toast('已恢复默认值，请点击保存生效', 'success');
      });
    }

    var saveBtn = $('sacSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var form = readForm();
        var err = validate(form);
        if (err) {
          toast(err, 'error');
          return;
        }
        var saved = api.savePlatform(form);
        applyHistoryIfNeeded(saved);
        toast(
          saved.affectHistory === 'yes'
            ? '已保存，并按新规则同步调整历史演示数据'
            : '已保存，仅影响新增数据',
          'success'
        );
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
