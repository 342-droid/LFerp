(function () {
  var TAB_PARAM = 'tab';

  function isRestockHostPage() {
    return !!(
      window.LfAppShell &&
      typeof window.LfAppShell.isRestockOrdersPage === 'function' &&
      window.LfAppShell.isRestockOrdersPage()
    );
  }

  function isFromRestock() {
    if (isRestockHostPage()) return true;
    return new URLSearchParams(window.location.search).get('from') === 'restock.html';
  }

  function uaPage(href) {
    return window.LfAppShell && typeof window.LfAppShell.userAppPage === 'function'
      ? window.LfAppShell.userAppPage(href)
      : href;
  }

  function resolveUaAsset(src) {
    return window.LfAppShell && typeof window.LfAppShell.resolveAsset === 'function'
      ? window.LfAppShell.resolveAsset(src)
      : src || '../assets/order-product-1.svg';
  }

  function getAllowedTabs() {
    return isFromRestock()
      ? ['all', 'unpaid', 'pending_accept', 'shipping', 'review']
      : ['all', 'unpaid', 'shipping', 'pickup', 'review'];
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
      document.querySelectorAll('.ua-orders-tab[data-tab="pending_accept"]').forEach(function (el) {
        el.remove();
      });
      return;
    }

    document.body.classList.add('ua-orders-from-restock');

    document.querySelectorAll('.ua-orders-tab[data-tab="pickup"]').forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll('.ua-orders-tab[data-tab="pending_accept"]').forEach(function (el) {
      el.hidden = false;
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

    applyOrderCardTitles();

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
      if (isStoreAppPort() && window.LfAppShell && window.LfAppShell.restockDetailHref) {
        href = window.LfAppShell.restockDetailHref(card.getAttribute('data-order-no') || '');
      }
      card
        .querySelectorAll('a[href*="order-detail.html"], a[href*="restock-order-detail.html"]')
        .forEach(function (link) {
          link.setAttribute('href', href);
        });
    });
  }

  function supplierDisplayName(name, id) {
    if (
      window.MdmSupplierArchiveStore &&
      typeof window.MdmSupplierArchiveStore.getDisplayName === 'function'
    ) {
      return (
        window.MdmSupplierArchiveStore.getDisplayName({
          id: id || '',
          name: name || ''
        }) || name || ''
      );
    }
    return name || '';
  }

  /** 零售：供应商；进货快递：供应商；进货配送：仓库 */
  function cardShopTitle(card) {
    var supplier = card.getAttribute('data-supplier-name') || '';
    var warehouse = card.getAttribute('data-warehouse-name') || '';
    var delivery = card.getAttribute('data-delivery') || '';
    if (isFromRestock() && (delivery === 'warehouse' || (warehouse && delivery !== 'store'))) {
      return warehouse || '配送仓';
    }
    return supplierDisplayName(supplier, card.getAttribute('data-supplier-id')) || supplier;
  }

  function applyOrderCardTitles() {
    document.querySelectorAll('.ua-order-card[data-status]').forEach(function (card) {
      var title = cardShopTitle(card);
      var storeMerchant = card.querySelector('.ua-order-merchant--store');
      var supplierMerchant = card.querySelector('.ua-order-merchant--supplier');
      var supplierEl = card.querySelector('.ua-order-supplier');
      var storeEl = card.querySelector('.ua-order-store');
      if (supplierEl && title) supplierEl.textContent = title;
      if (storeEl && title && !supplierMerchant) storeEl.textContent = title;
      if (storeMerchant) storeMerchant.hidden = true;
      if (supplierMerchant) supplierMerchant.hidden = false;
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

  function readCardPayable(card) {
    var orderNo = card ? card.getAttribute('data-order-no') : '';
    if (orderNo && window.UaOrdersStore && window.UaOrdersStore.getByNo) {
      var order = window.UaOrdersStore.getByNo(orderNo);
      if (order && order.payable != null) return Math.max(0, Number(order.payable) || 0);
    }
    var price = card ? card.querySelector('.ua-order-price') : null;
    var n = Number(price ? String(price.textContent || '').replace(/[^\d.]/g, '') : '');
    return n > 0 ? n : 0;
  }

  function markCardPaid(card, extra) {
    var nextStatus = isFromRestock() ? 'pending_accept' : 'shipping';
    var orderNo = card.getAttribute('data-order-no');
    if (orderNo && window.UaOrdersStore && window.UaOrdersStore.updateStatus) {
      window.UaOrdersStore.updateStatus(orderNo, nextStatus, extra || {});
    }
    card.setAttribute('data-status', nextStatus);
    card.setAttribute('data-detail-status', nextStatus);
    var statusEl = card.querySelector('.ua-order-status');
    if (statusEl) {
      statusEl.textContent = isFromRestock() ? '待接单' : '待发货';
      statusEl.classList.remove('ua-order-status--red');
    }
    var payBtn = card.querySelector('[data-order-pay]');
    if (payBtn) payBtn.remove();
    var supplier = card.getAttribute('data-supplier-name') || '';
    var href =
      (orderNo && window.UaOrdersStore && window.UaOrdersStore.getByNo
        ? window.UaOrdersStore.buildDetailHref(window.UaOrdersStore.getByNo(orderNo))
        : 'order-detail.html?status=' + encodeURIComponent(nextStatus)) ||
      'order-detail.html?status=' + encodeURIComponent(nextStatus);
    if (isFromRestock() && href.indexOf('from=') < 0) {
      href += (href.indexOf('?') >= 0 ? '&' : '?') + 'from=restock.html';
    }
    if (supplier && href.indexOf('supplier=') < 0) {
      href += (href.indexOf('?') >= 0 ? '&' : '?') + 'supplier=' + encodeURIComponent(supplier);
    }
    card.querySelectorAll('a[href*="order-detail.html"], a[href*="restock-order-detail.html"]').forEach(function (link) {
      link.setAttribute('href', href);
    });
  }

  function bindOrderPayButtons() {
    var list = document.querySelector('.ua-orders-list');
    if (!list || list.dataset.orderPayBound) return;
    list.dataset.orderPayBound = '1';
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-order-pay]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      var card = btn.closest('.ua-order-card');
      if (!card || !window.UaOrderPaySheet) return;
      window.UaOrderPaySheet.open({
        isRestock: isFromRestock(),
        getPayable: function () {
          return readCardPayable(card);
        },
        onPaid: function (extra) {
          markCardPaid(card, extra);
          if (typeof window.__uaOrdersRefilter === 'function') window.__uaOrdersRefilter();
          var link = card.querySelector(
            'a[href*="order-detail.html"], a[href*="restock-order-detail.html"]'
          );
          var storeApp = isStoreAppPort();
          return {
            orderHref: link
              ? link.getAttribute('href')
              : storeApp && window.LfAppShell
                ? window.LfAppShell.restockOrdersHref()
                : 'orders.html?from=restock.html',
            homeHref: isFromRestock()
              ? storeApp
                ? uaPage('restock.html?from=store-app')
                : 'restock.html'
              : 'home.html',
            unpaidHref: isFromRestock()
              ? storeApp && window.LfAppShell
                ? window.LfAppShell.restockOrdersHref() + '?tab=unpaid'
                : 'orders.html?from=restock.html&tab=unpaid'
              : 'orders.html?tab=unpaid'
          };
        }
      });
    });
  }

  function isStoreAppPort() {
    if (window.LfAppShell && typeof window.LfAppShell.isStoreApp === 'function') {
      return window.LfAppShell.isStoreApp();
    }
    var p = new URLSearchParams(window.location.search);
    return p.get('port') === 'store-app' || p.get('from') === 'store-app';
  }

  function init() {
    if (isStoreAppPort() && !isRestockHostPage()) {
      window.location.replace(
        window.LfAppShell && window.LfAppShell.restockOrdersHref
          ? window.LfAppShell.restockOrdersHref()
          : '../../store-app/h5/restock-orders.html'
      );
      return;
    }
    injectDemoOrders();
    applyRestockOrdersMode();
    if (!isFromRestock()) applyOrderCardTitles();
    bindDemoOrderLinks();
    bindOrderPayButtons();
    if (window.UaOrderPaySheet && isFromRestock()) {
      window.UaOrderPaySheet.mountDemoPanel(true);
    }

    var backEl = document.querySelector('.ua-orders-back');
    if (backEl && isFromRestock()) {
      backEl.setAttribute(
        'href',
        isStoreAppPort() ? uaPage('restock.html?from=store-app') : 'restock.html'
      );
    }

    var tabs = Array.prototype.slice.call(document.querySelectorAll('.ua-orders-tab'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ua-order-card[data-status]'));
    var emptyEl = document.getElementById('ordersEmpty');
    var endEl = document.querySelector('.ua-orders-end');
    if (!tabs.length || !cards.length) return;

    function applyTab(tab, pushState) {
      setActiveTab(tab, tabs);
      filterOrders(tab, cards, emptyEl, endEl);
      if (window.UaOrderMatrixDemo && window.UaOrderMatrixDemo.hideStaticCardsIfFiltered) {
        window.UaOrderMatrixDemo.hideStaticCardsIfFiltered();
      }
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
    window.__uaOrdersRefilter = function () {
      applyTab(getActiveTab(), false);
    };

    tabs.forEach(function (tabEl) {
      tabEl.addEventListener('click', function (e) {
        e.preventDefault();
        applyTab(tabEl.getAttribute('data-tab'), true);
      });
    });

    applyTab(getActiveTab(), false);
    if (window.UaOrderMatrixDemo && window.UaOrderMatrixDemo.hideStaticCardsIfFiltered) {
      window.UaOrderMatrixDemo.hideStaticCardsIfFiltered();
    }
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
      card
        .querySelectorAll('a[href*="order-detail.html"], a[href*="restock-order-detail.html"]')
        .forEach(function (link) {
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
    if (isFromRestock() && window.UaOrdersStore.ensureRestockDemoList) {
      window.UaOrdersStore.ensureRestockDemoList();
    } else if (window.UaOrderMatrixDemo && window.UaOrderMatrixDemo.ensureSeed) {
      window.UaOrderMatrixDemo.ensureSeed();
    }
    var list = (window.UaOrdersStore.list() || []).filter(function (order) {
      var restock = !!(order && (order.from === 'restock.html' || order.fulfillType || order.splitKind));
      return isFromRestock() ? restock : !restock;
    });
    var wrap = document.querySelector('.ua-orders-list') || document.querySelector('#ordersList');
    if (!wrap || !list.length) return;
    var html = list
      .map(function (order) {
        var fresh = window.UaOrdersStore.getByNo(order.orderNo) || order;
        var href = window.UaOrdersStore.buildDetailHref(fresh);
        var statusMap = {
          unpaid: '待付款',
          pending_accept: '待接单',
          shipping: '待发货',
          pickup: '待自提',
          receipt: '待收货',
          completed: '已完成',
          closed: '已关闭'
        };
        var statusText = statusMap[fresh.status] || fresh.status;
        var listStatus = fresh.status;
        if (isFromRestock() && (fresh.status === 'receipt' || fresh.status === 'receiving')) {
          listStatus = 'review';
        } else if (!isFromRestock() && fresh.status === 'receipt') {
          listStatus = 'receiving';
        }
        var imgs = (fresh.items || [])
          .slice(0, 3)
          .map(function (it) {
            return (
              '<img src="' +
              escapeHtml(resolveUaAsset(it.img || '../assets/order-product-1.svg')) +
              '" alt="">'
            );
          })
          .join('');
        if (!imgs) imgs = '<img src="' + escapeHtml(resolveUaAsset('../assets/order-product-1.svg')) + '" alt="">';
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
              '<button type="button" class="ua-order-btn ua-order-btn--primary" data-order-pay="1">去付款</button>'
            : '<a href="' + href + '" class="ua-order-btn ua-order-btn--outline">查看详情</a>';
        return (
          '<article class="ua-order-card" data-status="' +
          escapeHtml(listStatus) +
          '" data-detail-status="' +
          escapeHtml(fresh.status) +
          '" data-demo-order="1"' +
          (fresh.matrixDemo ? ' data-matrix-demo="1"' : '') +
          (fresh.asFilter ? ' data-as-filter="' + escapeHtml(fresh.asFilter) + '"' : '') +
          ' data-order-no="' +
          escapeHtml(fresh.orderNo) +
          '" data-supplier-name="' +
          escapeHtml(fresh.supplierName || '') +
          '" data-warehouse-name="' +
          escapeHtml(fresh.warehouse || '') +
          '" data-delivery="' +
          escapeHtml(
            isFromRestock()
              ? window.UaOrdersStore.isRestockDelivery && window.UaOrdersStore.isRestockDelivery(fresh)
                ? 'warehouse'
                : 'store'
              : ''
          ) +
          '">' +
          '<a href="' +
          href +
          '" class="ua-order-card--link">' +
          '<div class="ua-order-card__head">' +
          '<span class="ua-order-merchant"><span class="ua-order-store">' +
          escapeHtml(
            (function () {
              var title = isFromRestock()
                ? window.UaOrdersStore.restockShopTitle
                  ? window.UaOrdersStore.restockShopTitle(fresh)
                  : fresh.warehouse || fresh.supplierName || '进货商城'
                : fresh.supplierName || '冷丰优选供应链';
              if (hasPoints) title += ' · 含积分兑换';
              return title;
            })()
          ) +
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
