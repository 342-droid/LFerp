/* 丰银宝 · 供应商售后物流跟踪（结构对齐用户 APP / 门店订单跟踪） */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    if (window.StoreAppToast && typeof window.StoreAppToast.show === 'function') {
      window.StoreAppToast.show(msg);
      return;
    }
    alert(msg);
  }

  function readPending() {
    try {
      var raw = sessionStorage.getItem('pendingExpressOrder');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  var params = new URLSearchParams(window.location.search || '');
  var org = window.FybOrg.current();
  var ticketId = params.get('id') || '';
  var pending = readPending();
  var ticket =
    window.FybSupplierAftersale && ticketId
      ? window.FybSupplierAftersale.findTicket(ticketId, org.name)
      : null;

  if ((!pending || (ticketId && pending.id !== ticketId)) && ticket) {
    pending = window.FybSupplierAftersale.buildLogisticsPayload(ticket);
  }

  var back = document.getElementById('saSupAsLogBack');
  if (back) {
    try {
      var savedBack = sessionStorage.getItem('saSupAsLogisticsBack');
      if (savedBack) back.setAttribute('href', savedBack);
      else if (ticketId) {
        back.setAttribute(
          'href',
          'supplier-aftersale-detail.html?id=' + encodeURIComponent(ticketId)
        );
      }
    } catch (e) {}
  }

  if (!pending || !pending.express) {
    document.getElementById('logisticsMainStatus').textContent = '暂无物流信息';
    document.getElementById('logisticsTimeline').innerHTML =
      '<div class="ua-ol-timeline__empty">暂无物流轨迹</div>';
    return;
  }

  var express = pending.express;
  var items = express.items || [];
  var timeline = express.timeline || [];

  document.getElementById('logisticsMainStatus').textContent =
    express.logisticsStatus || pending.status || '运输中';
  document.getElementById('logisticsCourierName').textContent = express.courier || '快递';
  document.getElementById('logisticsTrackingNo').textContent = express.trackingNo || '—';

  var scroll = document.getElementById('logisticsProductsScroll');
  var totalEl = document.getElementById('logisticsProductsTotal');
  var totalQty = items.reduce(function (sum, it) {
    return sum + (Number(it.qty) || 0);
  }, 0);
  if (scroll) {
    scroll.innerHTML = items
      .map(function (it) {
        var badge =
          Number(it.qty) > 1
            ? '<span class="ua-ol-products__badge">' + Number(it.qty) + '</span>'
            : '';
        return (
          '<div class="ua-ol-products__item' +
          (badge ? ' ua-ol-products__item--badge' : '') +
          '"><img src="' +
          escapeHtml(it.image || '../../user-app/assets/order-product-1.svg') +
          '" alt="">' +
          badge +
          '</div>'
        );
      })
      .join('');
  }
  if (totalEl) totalEl.textContent = '共' + totalQty + '件';

  var timelineEl = document.getElementById('logisticsTimeline');
  if (timelineEl) {
    if (!timeline.length) {
      timelineEl.innerHTML =
        '<div class="ua-ol-tl-row"><div class="ua-ol-tl-content"><div class="ua-ol-tl-desc">暂无物流轨迹</div></div></div>';
    } else {
      timelineEl.innerHTML = timeline
        .map(function (node) {
          var active = !!node.active;
          return (
            '<div class="ua-ol-tl-row">' +
            '<div class="ua-ol-tl-time">' +
            escapeHtml(node.time || '').replace(/\n/g, '<br>') +
            '</div>' +
            '<div class="ua-ol-tl-axis"><span class="ua-ol-tl-node' +
            (active ? ' ua-ol-tl-node--active' : '') +
            '"></span></div>' +
            '<div class="ua-ol-tl-content">' +
            '<div class="ua-ol-tl-title' +
            (active ? ' ua-ol-tl-title--active' : '') +
            '">' +
            escapeHtml(node.title || '') +
            '</div>' +
            (node.desc
              ? '<div class="ua-ol-tl-desc">' + escapeHtml(node.desc) + '</div>'
              : '') +
            '</div></div>'
          );
        })
        .join('');
    }
  }

  var copyBtn = document.getElementById('logisticsCopyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var no = express.trackingNo || '';
      if (!no) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(no).then(
          function () {
            toast('已复制运单号');
          },
          function () {
            toast(no);
          }
        );
      } else {
        toast(no);
      }
    });
  }
})();
