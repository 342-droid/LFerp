(function () {
  var TAB_PARAM = 'tab';

  function getActiveTab() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get(TAB_PARAM) || 'all';
    var allowed = ['all', 'unpaid', 'shipping', 'pickup', 'review'];
    return allowed.indexOf(tab) !== -1 ? tab : 'all';
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
