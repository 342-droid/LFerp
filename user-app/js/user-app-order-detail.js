(function () {
  var STATUS_CONFIG = {
    unpaid: {
      title: '等待买家付款',
      sub: '逾期未支付订单将自动关闭',
      showLogistics: false,
      showPoints: true,
      showPayMethod: false,
      itemActions: 'none',
      footer: [
        { label: '取消订单', type: 'ghost', action: 'cancel' },
        { label: '立即付款', type: 'primary', action: 'pay' }
      ]
    },
    shipping: {
      title: '买家已付款',
      sub: '',
      showLogistics: false,
      showPoints: false,
      showPayMethod: true,
      itemActions: 'refund',
      footer: []
    },
    receipt: {
      title: '商家已发货',
      sub: '还剩14天23小时自动确认收货',
      showLogistics: false,
      showStoreDelivery: true,
      showPoints: false,
      showPayMethod: true,
      itemActions: 'refund',
      footer: [{ label: '确认收货', type: 'primary', action: 'confirm', single: true }]
    },
    completed: {
      title: '交易完成',
      sub: '',
      showLogistics: false,
      showPoints: false,
      showPayMethod: true,
      itemActions: 'aftersale',
      footer: [
        { label: '删除订单', type: 'ghost', action: 'delete' },
        { label: '加入购物车', type: 'primary', action: 'cart' }
      ]
    },
    closed: {
      title: '订单已关闭',
      sub: '订单已取消，欢迎下次光临',
      showLogistics: false,
      showPoints: false,
      showPayMethod: false,
      itemActions: 'none',
      footer: [
        { label: '删除订单', type: 'ghost', action: 'delete' },
        { label: '重新购买', type: 'primary', action: 'rebuy' }
      ]
    }
  };

  var CLOSED_REASONS = {
    cancel: {
      sub: '订单已取消，欢迎下次光临'
    },
    timeout: {
      sub: '超时未支付，订单已自动关闭'
    },
    refund: {
      sub: '订单已全额退款'
    }
  };

  var RESTOCK_STATUS_OVERRIDES = {
    unpaid: {
      title: '等待付款',
      sub: '逾期未支付订单将自动关闭',
      showStoreDelivery: false
    },
    shipping: {
      title: '买家已付款',
      sub: '供应商正在备货，将配送到门店',
      showStoreDelivery: false
    },
    receipt: {
      title: '配送到门店',
      sub: '还剩14天23小时自动确认收货',
      showStoreDelivery: true,
      footer: [{ label: '确认收货', type: 'primary', action: 'confirm', single: true }]
    },
    completed: {
      title: '交易完成',
      sub: '商品已送达门店',
      showStoreDelivery: false
    },
    closed: {
      title: '订单已关闭',
      showStoreDelivery: false
    }
  };

  var INVOICE_TYPES = {
    company: '公司',
    sole: '个体工商户'
  };

  function getInvoiceTypeLabel() {
    var key = (getParams().get('invoice') || 'company').trim();
    return INVOICE_TYPES[key] || INVOICE_TYPES.company;
  }

  function applyInvoiceType() {
    var invoiceTypeEl = document.getElementById('orderInvoiceType');
    if (invoiceTypeEl) invoiceTypeEl.textContent = getInvoiceTypeLabel();
  }

  function getClosedReason() {
    var reason = (getParams().get('reason') || 'cancel').trim();
    return CLOSED_REASONS[reason] ? reason : 'cancel';
  }

  function applyClosedReason(config) {
    if (getStatus() !== 'closed') return config;
    var reasonCfg = CLOSED_REASONS[getClosedReason()];
    if (reasonCfg && reasonCfg.sub) {
      config = Object.assign({}, config, { sub: reasonCfg.sub });
    }
    return config;
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getDeliveryType() {
    var delivery = (getParams().get('delivery') || '').trim();
    if (delivery === 'store' || delivery === 'warehouse') return delivery;
    return 'warehouse';
  }

  function isStoreDirectDelivery() {
    return getDeliveryType() === 'store';
  }

  function buildLogisticsHref() {
    var params = getParams();
    var href = 'order-logistics.html?';
    var qs = [];
    if (params.get('from')) qs.push('from=' + encodeURIComponent(params.get('from')));
    qs.push('status=' + encodeURIComponent(getStatus()));
    if (params.get('supplier')) qs.push('supplier=' + encodeURIComponent(params.get('supplier')));
    if (params.get('delivery')) qs.push('delivery=' + encodeURIComponent(params.get('delivery')));
    if (params.get('cutoff')) qs.push('cutoff=' + encodeURIComponent(params.get('cutoff')));
    if (params.get('reason')) qs.push('reason=' + encodeURIComponent(params.get('reason')));
    return href + qs.join('&');
  }

  function applyStoreExpressCard(status) {
    var expressCard = document.getElementById('orderExpressCard');
    var logisticsBtn = document.getElementById('orderExpressLogisticsBtn');
    if (!expressCard) return;

    var showExpress = isFromRestock() && status === 'receipt' && isStoreDirectDelivery();
    expressCard.hidden = !showExpress;

    if (logisticsBtn && showExpress) {
      logisticsBtn.setAttribute('href', buildLogisticsHref());
    }
  }

  function applyDeliveryMode(status, config) {
    if (!isFromRestock() || status !== 'receipt') return config;

    config = Object.assign({}, config);

    if (isStoreDirectDelivery()) {
      config.showStoreDelivery = false;
      config.title = '快递配送到店';
      config.sub = '还剩14天23小时自动确认收货';
    } else {
      config.showStoreDelivery = true;
      config.title = '配送到门店';
      config.sub = '还剩14天23小时自动确认收货';
    }

    return config;
  }

  function isFromRestock() {
    return getParams().get('from') === 'restock.html';
  }

  function getStatus() {
    var status = (getParams().get('status') || 'unpaid').trim();
    return STATUS_CONFIG[status] ? status : 'unpaid';
  }

  function isPlatformCutoffPassed() {
    var cutoff = (getParams().get('cutoff') || 'before').trim();
    return cutoff === 'after';
  }

  function applyShippingFooter(status, config) {
    if (status !== 'shipping') return config;
    config = Object.assign({}, config);
    if (!isPlatformCutoffPassed()) {
      config.footer = [{ label: '取消订单', type: 'ghost', action: 'cancel', single: true }];
    } else {
      config.footer = [];
    }
    return config;
  }

  function buildRefundQuery(itemIndex) {
    var p = getParams();
    var qs = [];
    qs.push('status=' + encodeURIComponent(getStatus()));
    if (p.get('from')) qs.push('from=' + encodeURIComponent(p.get('from')));
    if (p.get('supplier')) qs.push('supplier=' + encodeURIComponent(p.get('supplier')));
    if (p.get('delivery')) qs.push('delivery=' + encodeURIComponent(p.get('delivery')));
    if (p.get('cutoff')) qs.push('cutoff=' + encodeURIComponent(p.get('cutoff')));
    if (p.get('reason')) qs.push('reason=' + encodeURIComponent(p.get('reason')));
    qs.push('item=' + encodeURIComponent(String(itemIndex == null ? 0 : itemIndex)));
    return qs.join('&');
  }

  function getRefundScene() {
    var status = getStatus();
    if (status === 'shipping') return 'pre_ship';
    if (status === 'completed') return 'aftersale';
    return 'post_ship';
  }

  function buildPreShipHref(itemIndex) {
    return 'order-refund-pre-ship.html?' + buildRefundQuery(itemIndex);
  }

  function buildItemRefundHref(itemIndex) {
    var scene = getRefundScene();
    if (scene === 'pre_ship') {
      return buildPreShipHref(itemIndex);
    }
    var query = buildRefundQuery(itemIndex);
    return 'order-refund-select.html?scene=' + encodeURIComponent(scene) + '&' + query;
  }

  function openCancelModal() {
    var modal = document.getElementById('orderCancelModal');
    if (modal) modal.hidden = false;
  }

  function closeCancelModal() {
    var modal = document.getElementById('orderCancelModal');
    if (modal) modal.hidden = true;
  }

  function confirmCancelOrder() {
    closeCancelModal();
    var p = getParams();
    var href =
      'order-detail.html?status=closed&reason=cancel' +
      (p.get('from') ? '&from=' + encodeURIComponent(p.get('from')) : '') +
      (p.get('supplier') ? '&supplier=' + encodeURIComponent(p.get('supplier')) : '') +
      (p.get('delivery') ? '&delivery=' + encodeURIComponent(p.get('delivery')) : '');
    window.location.href = href;
  }

  function toast(msg) {
    window.alert(msg + '（演示）');
  }

  function renderItemActions(mode) {
    var primary = document.getElementById('orderItemActionsPrimary');
    var secondary = document.getElementById('orderItemActionsSecondary');
    if (!primary || !secondary) return;

    function makeBtn(label, itemIndex) {
      return (
        '<button type="button" class="ua-od-item__btn" data-item-action="' +
        (mode === 'aftersale' ? 'aftersale' : 'refund') +
        '" data-item-index="' +
        itemIndex +
        '">' +
        label +
        '</button>'
      );
    }

    if (mode === 'refund') {
      primary.innerHTML = makeBtn('申请退款', 0);
      secondary.innerHTML = makeBtn('申请退款', 1);
      return;
    }

    if (mode === 'aftersale') {
      primary.innerHTML = makeBtn('申请售后', 0);
      secondary.innerHTML = makeBtn('申请售后', 1);
      return;
    }

    primary.innerHTML = '';
    secondary.innerHTML = '';
  }

  function renderFooter(actions) {
    var footer = document.getElementById('orderDetailFooter');
    if (!footer) return;

    if (!actions || !actions.length) {
      footer.innerHTML = '';
      return;
    }

    footer.innerHTML = actions
      .map(function (item) {
        var cls =
          'ua-od-footer__btn ua-od-footer__btn--' +
          (item.type === 'primary' ? 'primary' : 'ghost') +
          (item.single ? ' ua-od-footer__btn--single' : '');
        return (
          '<button type="button" class="' +
          cls +
          '" data-footer-action="' +
          item.action +
          '">' +
          item.label +
          '</button>'
        );
      })
      .join('');
  }

  function applyRestockMode(status, config) {
    if (!isFromRestock()) return config;

    document.body.classList.add('ua-order-detail-from-restock');

    var override = RESTOCK_STATUS_OVERRIDES[status] || {};
    config = Object.assign({}, config, override);

    var shopNameEl = document.getElementById('orderShopName');
    if (shopNameEl) {
      var supplier =
        getParams().get('supplier') ||
        shopNameEl.getAttribute('data-supplier-name') ||
        '冷丰优选供应链';
      shopNameEl.textContent = supplier;
    }

    var logisticsCard = document.getElementById('orderLogisticsCard');
    if (logisticsCard) logisticsCard.hidden = true;

    var storeDeliveryCard = document.getElementById('orderStoreDeliveryCard');
    if (storeDeliveryCard) {
      storeDeliveryCard.hidden = !config.showStoreDelivery;
      if (config.showStoreDelivery) {
        var statusEl = document.getElementById('orderStoreDeliveryStatus');
        var textEl = document.getElementById('orderStoreDeliveryText');
        var timeEl = document.getElementById('orderStoreDeliveryTime');
        if (statusEl) statusEl.textContent = '订单配送中';
        if (textEl) textEl.textContent = '商品正在配送到门店，请耐心等待';
        if (timeEl) timeEl.textContent = '预计 2026-03-09 18:00 前送达门店';
      }
    }

    applyStoreExpressCard(status);

    var backEl = document.getElementById('orderDetailBack');
    if (backEl) {
      var href = 'orders.html?from=restock.html';
      if (status !== 'unpaid') href += '&tab=' + encodeURIComponent(mapStatusToTab(status));
      backEl.setAttribute('href', href);
    }

    return config;
  }

  function mapStatusToTab(status) {
    if (status === 'receipt') return 'review';
    if (status === 'closed') return 'all';
    return status;
  }

  function bindEvents() {
    var copyBtn = document.getElementById('orderCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = (document.getElementById('orderNoText') || {}).textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              toast('已复制订单编号');
            },
            function () {
              toast('已复制订单编号');
            }
          );
        } else {
          toast('已复制订单编号');
        }
      });
    }

    var logisticsLink = document.getElementById('orderLogisticsLink');
    if (logisticsLink) {
      logisticsLink.addEventListener('click', function (e) {
        e.preventDefault();
        toast('查看物流');
      });
    }

    document.getElementById('orderDetailFooter') &&
      document.getElementById('orderDetailFooter').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-footer-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-footer-action');
        if (action === 'cancel') {
          openCancelModal();
          return;
        }
        var map = {
          pay: '立即付款',
          refund: '申请退款',
          logistics: '查看物流',
          confirm: '确认收货',
          delete: '删除订单',
          cart: '加入购物车',
          rebuy: '重新购买'
        };
        toast(map[action] || '操作');
      });

    document.querySelectorAll('.ua-od-item__actions').forEach(function (wrap) {
      wrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.ua-od-item__btn');
        if (!btn) return;
        var itemIndex = btn.getAttribute('data-item-index') || '0';
        window.location.href = buildItemRefundHref(parseInt(itemIndex, 10));
      });
    });

    document.getElementById('orderCancelModalDismiss') &&
      document.getElementById('orderCancelModalDismiss').addEventListener('click', closeCancelModal);
    document.getElementById('orderCancelModalMask') &&
      document.getElementById('orderCancelModalMask').addEventListener('click', closeCancelModal);
    document.getElementById('orderCancelModalConfirm') &&
      document.getElementById('orderCancelModalConfirm').addEventListener('click', confirmCancelOrder);
  }

  function init() {
    var status = getStatus();
    var config = STATUS_CONFIG[status];

    document.getElementById('orderDetailShell') &&
      document.getElementById('orderDetailShell').setAttribute('data-order-status', status);

    if (status === 'shipping') {
      document.getElementById('orderDetailShell') &&
        document.getElementById('orderDetailShell').setAttribute(
          'data-cutoff-passed',
          isPlatformCutoffPassed() ? 'true' : 'false'
        );
    }

    var supplier = getParams().get('supplier');
    if (supplier) {
      var shopNameEl = document.getElementById('orderShopName');
      if (shopNameEl) shopNameEl.setAttribute('data-supplier-name', supplier);
    }

    if (isFromRestock()) {
      config = applyRestockMode(status, config);
      config = applyDeliveryMode(status, config);
    }

    config = applyClosedReason(config);
    config = applyShippingFooter(status, config);

    var titleEl = document.getElementById('orderStatusTitle');
    var subEl = document.getElementById('orderStatusSub');
    if (titleEl) titleEl.textContent = config.title;
    if (subEl) {
      if (config.sub) {
        subEl.textContent = config.sub;
        subEl.hidden = false;
      } else {
        subEl.textContent = '';
        subEl.hidden = true;
      }
    }

    var logisticsCard = document.getElementById('orderLogisticsCard');
    if (logisticsCard) logisticsCard.hidden = true;

    var storeDeliveryCard = document.getElementById('orderStoreDeliveryCard');
    if (storeDeliveryCard) {
      storeDeliveryCard.hidden = !config.showStoreDelivery;
      if (config.showStoreDelivery && !isFromRestock()) {
        var statusEl = document.getElementById('orderStoreDeliveryStatus');
        var textEl = document.getElementById('orderStoreDeliveryText');
        var timeEl = document.getElementById('orderStoreDeliveryTime');
        if (statusEl) statusEl.textContent = '订单配送中';
        if (textEl) textEl.textContent = '商品正在配送到门店，请耐心等待';
        if (timeEl) timeEl.textContent = '预计 2026-03-09 18:00 前送达门店';
      }
    }

    applyStoreExpressCard(status);

    var pointsCard = document.getElementById('orderPointsCard');
    if (pointsCard) pointsCard.hidden = !config.showPoints;

    var payMethodRow = document.getElementById('orderPayMethodRow');
    if (payMethodRow) payMethodRow.hidden = !config.showPayMethod;

    renderItemActions(config.itemActions);
    renderFooter(config.footer);
    applyInvoiceType();

    var backEl = document.getElementById('orderDetailBack');
    if (backEl && !isFromRestock()) {
      var tab = mapStatusToTab(status);
      backEl.setAttribute('href', tab === 'all' ? 'orders.html' : 'orders.html?tab=' + encodeURIComponent(tab));
    }

    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
