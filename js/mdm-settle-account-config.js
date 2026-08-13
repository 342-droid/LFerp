/**
 * 结算 · 账户配置 — 订单配置 + 账户配置（同页，账户在订单下方）
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
    var root = $('sacOrderConfigRoot');
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
      namePrefix: 'sacOrder',
      nameSuffix: '',
      required: true,
      onHint: copy.storeQueueOn
    });

    ui.appendOrderConfigItem({
      root: root,
      fieldKey: 'pendingShipmentVerify',
      label: '待发货订单核销',
      settings: settings,
      namePrefix: 'sacOrder',
      nameSuffix: '',
      required: true,
      staticHint: copy.pendingVerifyDesc,
      warnTip: copy.pendingVerifyWarn
    });

    return root;
  }

  function readOrderForm(root) {
    if (!root || !window.OrderConfigUi) return Object.assign({}, ORDER_DEFAULTS);
    return window.OrderConfigUi.readOrderConfigValues(root, 'sacOrder', '', [
      'storeQueue',
      'pendingShipmentVerify'
    ]);
  }

  function saveOrderForm(root) {
    var data = readOrderForm(root);
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function readAccountForm() {
    var deposit = Number(($('sacDepositRequired') && $('sacDepositRequired').value) || '');
    var goods = Number(($('sacGoodsQuotaRequired') && $('sacGoodsQuotaRequired').value) || '');
    var affectEl = document.querySelector('input[name="sacAffectHistory"]:checked');
    return {
      depositRequired: deposit,
      goodsQuotaRequired: goods,
      affectHistory: affectEl ? affectEl.value : 'no'
    };
  }

  function fillAccountForm(cfg) {
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
    var api = window.StoreAccountConfig;
    if (!api) return;

    var orderRoot = mountOrderConfig();
    fillAccountForm(api.getPlatform());

    bindCollapse('sacOrderSection', 'sacOrderSectionToggle');
    bindCollapse('sacStoreSection', 'sacStoreSectionToggle');

    var resetBtn = $('sacResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        fillAccountForm(api.DEFAULT_PLATFORM);
        if (orderRoot) {
          localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(ORDER_DEFAULTS));
          mountOrderConfig();
          orderRoot = $('sacOrderConfigRoot');
        }
        toast('已恢复默认值，请点击保存生效', 'success');
      });
    }

    var saveBtn = $('sacSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var form = readAccountForm();
        var err = validateAccount(form);
        if (err) {
          toast(err, 'error');
          return;
        }
        if (orderRoot) saveOrderForm(orderRoot);
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
