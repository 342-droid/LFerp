(function () {
  var TAB_PARAM = 'tab';

  function isFromRestock() {
    return new URLSearchParams(window.location.search).get('from') === 'restock.html';
  }

  function getAllowedTabs() {
    return isFromRestock()
      ? ['all', 'unpaid', 'shipping', 'review']
      : ['all', 'unpaid', 'shipping', 'pickup', 'review'];
  }

  function getActiveTab() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get(TAB_PARAM) || 'all';
    var allowed = getAllowedTabs();
    return allowed.indexOf(tab) !== -1 ? tab : 'all';
  }

  function applyRestockOrdersMode() {
    if (!isFromRestock()) return;

    document.body.classList.add('ua-orders-from-restock');

    document.querySelectorAll('.ua-orders-tab[data-tab="pickup"]').forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll('.ua-order-card[data-status="pickup"]').forEach(function (card) {
      card.remove();
    });

    document.querySelectorAll('.ua-orders-tab[data-tab="review"]').forEach(function (el) {
      el.textContent = '待收货';
    });

    document.querySelectorAll('.ua-order-card[data-status]').forEach(function (card) {
      var supplierName = card.getAttribute('data-supplier-name');
      var storeMerchant = card.querySelector('.ua-order-merchant--store');
      var supplierMerchant = card.querySelector('.ua-order-merchant--supplier');
      var supplierEl = card.querySelector('.ua-order-supplier');

      if (supplierName && supplierEl) {
        supplierEl.textContent = supplierName;
      }

      if (storeMerchant) storeMerchant.hidden = true;
      if (supplierMerchant) supplierMerchant.hidden = false;
    });

    document.querySelectorAll('.ua-order-card[data-detail-status]').forEach(function (card) {
      var detailStatus = card.getAttribute('data-detail-status');
      var supplier = card.getAttribute('data-supplier-name') || '';
      var closedReason = card.getAttribute('data-closed-reason');
      var cutoff = card.getAttribute('data-cutoff');
      if (!detailStatus) return;
      var href =
        'order-detail.html?status=' +
        encodeURIComponent(detailStatus) +
        (isFromRestock() ? '&from=restock.html' : '') +
        (supplier ? '&supplier=' + encodeURIComponent(supplier) : '') +
        (closedReason ? '&reason=' + encodeURIComponent(closedReason) : '') +
        (cutoff ? '&cutoff=' + encodeURIComponent(cutoff) : '');
      card.querySelectorAll('a[href*="order-detail.html"]').forEach(function (link) {
        link.setAttribute('href', href);
      });
    });
  }

  function setActiveTab(tab, tabs) {
    tabs.forEach(function (el) {
      el.classList.toggle('ua-orders-tab--active', el.getAttribute('data-tab') === tab);
    });
  }

  function filterOrders(tab, cards, emptyEl, endEl) {
    var visible = 0;
    cards.forEach(function (card) {
      var status = card.getAttribute('data-status');
      var show = tab === 'all' || status === tab;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (endEl) endEl.hidden = visible === 0;
  }

  function init() {
    applyRestockOrdersMode();

    var backEl = document.querySelector('.ua-orders-back');
    if (backEl && isFromRestock()) {
      backEl.setAttribute('href', 'restock.html');
    }

    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ua-orders-tab'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ua-order-card[data-status]'));
    var emptyEl = document.getElementById('ordersEmpty');
    var endEl = document.querySelector('.ua-orders-end');
    if (!tabs.length || !cards.length) return;

    function applyTab(tab, pushState) {
      setActiveTab(tab, tabs);
      filterOrders(tab, cards, emptyEl, endEl);
      if (pushState) {
        var url = new URL(window.location.href);
        if (tab === 'all') {
          url.searchParams.delete(TAB_PARAM);
        } else {
          url.searchParams.set(TAB_PARAM, tab);
        }
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    }

    window.UaOrders = {
      setTab: function (tab) {
        applyTab(tab, true);
      }
    };

    tabs.forEach(function (tabEl) {
      tabEl.addEventListener('click', function (e) {
        e.preventDefault();
        applyTab(tabEl.getAttribute('data-tab'), true);
      });
    });

    applyTab(getActiveTab(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
