/* 供应商组织 · 订单视角：复用平台零售/代采列表与详情，仅收窄为本商家供货单并隐藏平台清分能力。 */
(function (global) {
  function readOrgId() {
    try {
      return localStorage.getItem('lfCurrentOrgId') || localStorage.getItem('spSettleSupplierId') || '';
    } catch (e) {
      return '';
    }
  }

  function isSupplierOrgId(id) {
    return String(id || '').indexOf('sup-') === 0;
  }

  function orderPageKind() {
    var page = document.body ? document.body.getAttribute('data-order-page') : '';
    return page === 'proxy' || page === 'retail' ? page : '';
  }

  function hashOrderId(id) {
    var s = String(id || '');
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /* 演示归属：未标 data-supplier-id 的行按订单号稳定映射到供货商家；约 1/3 仅平台可见。 */
  function ensureDemoSupplierTags() {
    var rows = document.querySelectorAll('.order-live-table tbody tr[data-order-id]');
    Array.prototype.forEach.call(rows, function (row) {
      if (row.getAttribute('data-supplier-id')) return;
      var orderId = row.getAttribute('data-order-id') || '';
      var bucket = hashOrderId(orderId) % 3;
      if (bucket === 2) return;
      row.setAttribute('data-supplier-id', bucket === 0 ? 'sup-ss' : 'sup-mq');
    });
  }

  function hidePlatformOnlyChrome() {
    [
      'orderRetailClearingExport',
      'orderProxyClearingExport',
      'orderRetailBatchUpload',
      'orderRetailBatchDelete',
      'orderRetailBatchRefund',
      'orderProxyBatchRefund'
    ].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.hidden = true;
    });
  }

  var api = {
    isActive: function () {
      return isSupplierOrgId(readOrgId()) && !!orderPageKind();
    },
    getSupplierId: function () {
      return readOrgId();
    },
    ownsRow: function (row) {
      if (!row) return false;
      var sid = row.getAttribute('data-supplier-id') || '';
      return !!sid && sid === readOrgId();
    },
    boot: function () {
      if (!api.isActive()) return;
      document.body.setAttribute('data-org-view', 'supplier');
      ensureDemoSupplierTags();
      hidePlatformOnlyChrome();
    }
  };

  global.LFSupplierOrderView = api;

  function run() {
    api.boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})(window);
