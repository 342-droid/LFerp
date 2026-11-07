/* 供应商组织 · 售后视角：售后单/退款单仅看本商家；可操作范围见详情。 */
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

  function aftersalePageKind() {
    var path = (window.location.pathname || '').split('/').pop() || '';
    path = path.split('?')[0].toLowerCase();
    if (!path.endsWith('.html')) path += '.html';
    if (path.indexOf('mdm_aftersale_') !== 0) return '';
    if (path === 'mdm_aftersale_ticket.html' || path === 'mdm_aftersale_ticket_detail.html') return 'ticket';
    if (path === 'mdm_aftersale_refund.html') return 'refund';
    if (
      path === 'mdm_aftersale_guarantee.html' ||
      path === 'mdm_aftersale_report.html' ||
      path === 'mdm_aftersale_feedback.html'
    ) {
      return 'platform_only';
    }
    return 'other';
  }

  function hashId(id) {
    var s = String(id || '');
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /** 演示归属：稳定映射到供货商家（约 1/3 仅平台可见） */
  function demoSupplierIdForKey(key) {
    var bucket = hashId(key) % 3;
    if (bucket === 2) return '';
    return bucket === 0 ? 'sup-ss' : 'sup-mq';
  }

  var api = {
    isActive: function () {
      return isSupplierOrgId(readOrgId()) && !!aftersalePageKind();
    },
    getSupplierId: function () {
      return readOrgId();
    },
    pageKind: aftersalePageKind,
    demoSupplierIdForKey: demoSupplierIdForKey,
    ownsSupplierId: function (sid) {
      var mine = readOrgId();
      return !!sid && !!mine && String(sid) === String(mine);
    },
    ownsRow: function (row) {
      if (!row) return false;
      var sid = row.supplierId || row.supplier || '';
      if (!sid && row.id) sid = demoSupplierIdForKey(row.id);
      if (!sid && row.orderNo) sid = demoSupplierIdForKey(row.orderNo);
      return api.ownsSupplierId(sid);
    },
    /** 供应商可操作：仅快递履约的退货收货 / 补货发货 */
    canOperateTicket: function (row) {
      if (!api.isActive() || !api.ownsRow(row)) return false;
      if (String(row.fulfillment || '') !== '快递') return false;
      if (row.type === '退货退款' && row.status === '待收货') return true;
      if (row.type === '补货' && (row.status === '待收货' || row.status === '待发货' || row.status === '待寄出')) {
        return true;
      }
      return false;
    },
    boot: function () {
      if (!isSupplierOrgId(readOrgId())) return;
      var kind = aftersalePageKind();
      if (!kind) return;
      document.body.setAttribute('data-org-view', 'supplier');
      if (kind === 'platform_only') {
        var wp = window.wmsPath || { page: function (f) { return f; } };
        window.location.replace(wp.page('mdm_aftersale_ticket.html'));
      }
    }
  };

  global.LFAftersaleSupplierView = api;

  function run() {
    api.boot();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})(window);
