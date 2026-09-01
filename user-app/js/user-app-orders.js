(function () {
  var TAB_PARAM = 'tab';

  function isFromRestock() {
    return new URLSearchParams(window.location.search).get('from') === 'restock.html';
  }

  function getAllowedTabs() {
    return isFromRestock()
      ? ['all', 'unpaid', 'pending_accept', 'shipping', 'review']
      : ['all', 'unpaid', 'pending_accept', 'shipping', 'pickup', 'review'];
  }

  function getActiveTab() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get(TAB_PARAM) || 'all';
    var allowed = getAllowedTabs();
    return allowed.indexOf(tab) !== -1 ? tab : 'all';
  }

  function applyRestockOrdersMode() {
    if (!isFromRestock()) {
      /* 零售列表：移除进货专用仓配演示卡 */
      document.querySelectorAll('.ua-order-card[data-restock-only="1"]').forEach(function (card) {
        card.remove();
      });
      return;
    }

    document.body.classList.add('ua-orders-from-restock');

    document.querySelectorAll('.ua-orders-tab[data-tab="pickup"]').forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll('.ua-order-card[data-status="pickup"]').forEach(function (card) {
      card.remove();
    });

    /* 进货：展示仓配演示卡，隐藏零售「自提待发货(to_store)/待自提」专属卡 */
    document.querySelectorAll('.ua-order-card[data-restock-only="1"]').forEach(function (card) {
      card.hidden = false;
    });
    document.querySelectorAll('.ua-order-card[data-detail-status="to_store"]').forEach(function (card) {
      card.remove();
    });

    document.querySelectorAll('.ua-orders-tab[data-tab="review"]').forEach(function (el) {
      el.textContent = '待收货';
    });

    /* 补货入口无「待自提」：快递/配送待收货挂到 review（展示为待收货） */
    document.querySelectorAll('.ua-order-card[data-status="receiving"]').forEach(function (card) {
      card.setAttribute('data-status', 'review');
    });

    document.querySelectorAll('.ua-order-card[data-status]').forEach(function (card) {
      var supplierName = card.getAttribute('data-supplier-name');
      var storeMerchant = card.querySelector('.ua-order-merchant--store');
      var supplierMerchant = card.querySelector('.ua-order-merchant--supplier');
      var supplierEl = card.querySelector('.ua-order-supplier');

      if (supplierName && supplierEl) {
        var displayName =
          window.MdmSupplierArchiveStore &&
          typeof window.MdmSupplierArchiveStore.getDisplayName === 'function'
            ? window.MdmSupplierArchiveStore.getDisplayName({
                id: card.getAttribute('data-supplier-id') || '',
                name: supplierName
              })
            : supplierName;
        supplierEl.textContent = displayName;
      }

      if (storeMerchant) storeMerchant.hidden = true;
      if (supplierMerchant) supplierMerchant.hidden = false;
    });

    document.querySelectorAll('.ua-order-card[data-detail-status]').forEach(function (card) {
      /* 演示订单链接含 orderNo，禁止被补货模式覆写成无单号链接 */
      if (card.getAttribute('data-demo-order') === '1') return;
      var detailStatus = card.getAttribute('data-detail-status');
      var supplier = card.getAttribute('data-supplier-name') || '';
      var closedReason = card.getAttribute('data-closed-reason');
      var cutoff = card.getAttribute('data-cutoff');
      var delivery = card.getAttribute('data-delivery');
      if (!detailStatus) return;
      var href =
        'order-detail.html?status=' +
        encodeURIComponent(detailStatus) +
        (isFromRestock() ? '&from=restock.html' : '') +
        (supplier ? '&supplier=' + encodeURIComponent(supplier) : '') +
        (closedReason ? '&reason=' + encodeURIComponent(closedReason) : '') +
        (cutoff ? '&cutoff=' + encodeURIComponent(cutoff) : '') +
        (delivery ? '&delivery=' + encodeURIComponent(delivery) : '');
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
      /* 待自提/待收货：自提单（pickup）与快递待收货（receiving）同屏 */
      var show =
        tab === 'all' ||
        status === tab ||
        (tab === 'pickup' && status === 'receiving');
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyEl) emptyEl.hidden = visible > 0;
    if (endEl) endEl.hidden = visible === 0;
  }

  function init() {
    injectDemoOrders();
    applyRestockOrdersMode();
    bindDemoOrderLinks();

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

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 点击时按存储最新状态跳转，避免列表「待发货」详情仍是「待付款」 */
  function bindDemoOrderLinks() {
    document.querySelectorAll('.ua-order-card[data-demo-order="1"]').forEach(function (card) {
      var orderNo = card.getAttribute('data-order-no');
      if (!orderNo) return;
      card.querySelectorAll('a[href*="order-detail.html"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          if (!window.UaOrdersStore || !window.UaOrdersStore.getByNo) return;
          var order = window.UaOrdersStore.getByNo(orderNo);
          if (!order) return;
          e.preventDefault();
          window.location.href = window.UaOrdersStore.buildDetailHref(order);
        });
      });
    });
  }

  function injectDemoOrders() {
    if (!window.UaOrdersStore || !window.UaOrdersStore.list) return;
    var list = window.UaOrdersStore.list();
    var wrap = document.querySelector('.ua-orders-list') || document.querySelector('#ordersList');
    if (!wrap || !list.length) return;
    var html = list
      .slice(0, 8)
      .map(function (order) {
        var fresh = window.UaOrdersStore.getByNo(order.orderNo) || order;
        var href = window.UaOrdersStore.buildDetailHref(fresh);
        var statusMap = {
          unpaid: '待付款',
          pending_accept: '待接单',
          shipping: '待发货',
          receipt: '待收货',
          completed: '已完成',
          closed: '已关闭'
        };
        var statusText = statusMap[fresh.status] || fresh.status;
        var imgs = (fresh.items || [])
          .slice(0, 3)
          .map(function (it) {
            return '<img src="' + escapeHtml(it.img || '../assets/order-product-1.svg') + '" alt="">';
          })
          .join('');
        if (!imgs) imgs = '<img src="../assets/order-product-1.svg" alt="">';
        var qty = (fresh.items || []).reduce(function (s, it) {
          return s + (Number(it.qty) || 0);
        }, 0);
        var hasPoints = (fresh.items || []).some(function (it) {
          return it.isPointsExchange;
        });
        var priceHtml = escapeHtml(fresh.payLabel || ('¥' + Number(fresh.payable || 0).toFixed(2)));
        var actions =
          fresh.status === 'unpaid'
            ? '<a href="' +
              href +
              '" class="ua-order-btn ua-order-btn--outline">查看详情</a>' +
              '<a href="' +
              href +
              '" class="ua-order-btn ua-order-btn--primary">去付款</a>'
            : '<a href="' + href + '" class="ua-order-btn ua-order-btn--outline">查看详情</a>';
        return (
          '<article class="ua-order-card" data-status="' +
          escapeHtml(fresh.status) +
          '" data-detail-status="' +
          escapeHtml(fresh.status) +
          '" data-demo-order="1" data-order-no="' +
          escapeHtml(fresh.orderNo) +
          '">' +
          '<a href="' +
          href +
          '" class="ua-order-card--link">' +
          '<div class="ua-order-card__head">' +
          '<span class="ua-order-merchant"><span class="ua-order-store">线上商城' +
          (hasPoints ? ' · 含积分兑换' : '') +
          '</span></span>' +
          '<span class="ua-order-status">' +
          escapeHtml(statusText) +
          '</span></div>' +
          '<div class="ua-order-card__body"><div class="ua-order-imgs">' +
          imgs +
          '</div><div class="ua-order-sum"><div class="ua-order-price">' +
          priceHtml +
          '</div><div class="ua-order-count">共' +
          qty +
          '件</div></div></div></a>' +
          '<div class="ua-order-card__foot"><div class="ua-order-meta"><span class="ua-order-date">' +
          escapeHtml(fresh.createdAt || '') +
          '</span></div><div class="ua-order-actions">' +
          actions +
          '</div></div></article>'
        );
      })
      .join('');
    wrap.insertAdjacentHTML('afterbegin', html);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
