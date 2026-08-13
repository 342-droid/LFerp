/**
 * 基础设置 · 门店配置 — 订单配置 / 账户配置（各板块独立保存）
 */
(function () {
  var ORDER_STORAGE_KEY = 'lf_basic_settings_order_config';
  var ORDER_DEFAULTS = { storeQueue: 'on', pendingShipmentVerify: 'on' };

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
    else window.alert(msg);
  }

  function bindCollapse(sectionId, toggleId) {
    var section = $(sectionId);
    var toggle = $(toggleId);
    if (!toggle || !section) return;
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

  function loadOrderSettings() {
    try {
      var raw = localStorage.getItem(ORDER_STORAGE_KEY);
      if (!raw) return Object.assign({}, ORDER_DEFAULTS);
      return Object.assign({}, ORDER_DEFAULTS, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, ORDER_DEFAULTS);
    }
  }

  function mountOrderConfig() {
    var root = $('bsOrderConfigRoot');
    var ui = window.OrderConfigUi;
    if (!root || !ui) return null;
    root.innerHTML = '';
    var settings = loadOrderSettings();
    var copy = ui.STORE_COPY || {};

    ui.appendOrderConfigItem({
      root: root,
      fieldKey: 'storeQueue',
      label: '门店排队',
      settings: settings,
      namePrefix: 'basicOrder',
      nameSuffix: '',
      required: true,
      onHint: copy.storeQueueOn
    });

    ui.appendOrderConfigItem({
      root: root,
      fieldKey: 'pendingShipmentVerify',
      label: '待发货订单核销',
      settings: settings,
      namePrefix: 'basicOrder',
      nameSuffix: '',
      required: true,
      staticHint: copy.pendingVerifyDesc,
      warnTip: copy.pendingVerifyWarn
    });
    return root;
  }

  function readAccountForm() {
    var deposit = Number(($('bsDepositRequired') && $('bsDepositRequired').value) || '');
    var goods = Number(($('bsGoodsQuotaRequired') && $('bsGoodsQuotaRequired').value) || '');
    var affectEl = document.querySelector('input[name="bsAffectHistory"]:checked');
    return {
      depositRequired: deposit,
      goodsQuotaRequired: goods,
      affectHistory: affectEl ? affectEl.value : 'no'
    };
  }

  function fillAccountForm(cfg) {
    if ($('bsDepositRequired')) {
      $('bsDepositRequired').value =
        cfg.depositRequired != null ? String(cfg.depositRequired) : '';
    }
    if ($('bsGoodsQuotaRequired')) {
      $('bsGoodsQuotaRequired').value =
        cfg.goodsQuotaRequired != null ? String(cfg.goodsQuotaRequired) : '';
    }
    var val = cfg.affectHistory === 'yes' ? 'yes' : 'no';
    document.querySelectorAll('input[name="bsAffectHistory"]').forEach(function (r) {
      r.checked = r.value === val;
    });
  }

  function validateAccount(form) {
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
    var orderRoot = mountOrderConfig();
    bindCollapse('bsOrderSection', 'bsOrderSectionToggle');
    bindCollapse('bsAccountSection', 'bsAccountSectionToggle');

    var orderSaveBtn = $('bsOrderSaveBtn');
    if (orderSaveBtn && orderRoot && window.OrderConfigUi) {
      orderSaveBtn.addEventListener('click', function () {
        var data = window.OrderConfigUi.readOrderConfigValues(
          orderRoot,
          'basicOrder',
          '',
          ['storeQueue', 'pendingShipmentVerify']
        );
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data));
        toast('订单配置已保存（演示）', 'success');
      });
    }

    var api = window.StoreAccountConfig;
    if (api) {
      fillAccountForm(api.getPlatform());
      var accountSaveBtn = $('bsAccountSaveBtn');
      if (accountSaveBtn) {
        accountSaveBtn.addEventListener('click', function () {
          var form = readAccountForm();
          var err = validateAccount(form);
          if (err) {
            toast(err, 'error');
            return;
          }
          var saved = api.savePlatform(form);
          applyHistoryIfNeeded(saved);
          toast(
            saved.affectHistory === 'yes'
              ? '账户配置已保存，并按新规则同步调整历史演示数据'
              : '账户配置已保存，仅影响新增数据',
            'success'
          );
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
