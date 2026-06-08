(function () {
  var STORAGE_KEY = 'ua_queue_status';
  var ARRIVAL_KEY = 'ua_queue_arrival';
  var STATUS_NOT_ARRIVED = '未到店';
  var STATUS_ARRIVED = '已到店';
  var TIP_NOT_ARRIVED = '到店后需扫描门店二维码进行排队提货';
  var TIP_ARRIVED = '已扫码到店，请耐心等待叫号';

  var WIDGET_HTML =
    '<button type="button" class="ua-fab-queue" id="openQueueBtn">去排队</button>' +
    '<div class="ua-queue-mask" id="queueModal" hidden>' +
      '<div class="ua-queue-modal" role="dialog" aria-labelledby="queueModalTitle" aria-modal="true">' +
        '<div class="ua-queue-modal__header">' +
          '<h3 class="ua-queue-modal__title" id="queueModalTitle">排队信息</h3>' +
          '<button type="button" class="ua-queue-modal__close" id="closeQueueBtn" aria-label="关闭">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
              '<path d="M6 6l12 12M18 6L6 18"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="ua-queue-card">' +
          '<div class="ua-queue-card__bar">' +
            '<span>小帅</span>' +
            '<span id="queueArrivalStatus">未到店</span>' +
          '</div>' +
          '<div class="ua-queue-card__body">' +
            '<p class="ua-queue-reserve-label">在线预约</p>' +
            '<p class="ua-queue-reserve-title">预约成功</p>' +
            '<div class="ua-queue-divider"></div>' +
            '<p class="ua-queue-reserve-tip">到店后需扫描门店二维码进行排队提货</p>' +
            '<div class="ua-queue-wait-row">' +
              '<p class="ua-queue-wait-text">前方等待 <em>0</em> 人</p>' +
              '<button type="button" class="ua-queue-refresh">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
                  '<path d="M4 12a8 8 0 0113.7-5.7"/>' +
                  '<path d="M20 12a8 8 0 01-13.7 5.7"/>' +
                  '<path d="M16 4h4v4"/>' +
                  '<path d="M8 20H4v-4"/>' +
                '</svg>' +
                '刷新' +
              '</button>' +
            '</div>' +
            '<div class="ua-queue-bottom-wrap">' +
              '<div class="ua-queue-message">' +
                '<p class="ua-queue-message__title">我的留言</p>' +
                '<p class="ua-queue-message__placeholder">点击添加留言，方便导购了解您的需求</p>' +
              '</div>' +
              '<div class="ua-queue-actions">' +
                '<button type="button" class="ua-queue-btn ua-queue-btn--primary" id="viewPickupOrdersBtn">查看待提货订单</button>' +
                '<button type="button" class="ua-queue-btn ua-queue-btn--secondary" id="cancelQueueBtn">取消排队</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function isQueuing() {
    return sessionStorage.getItem(STORAGE_KEY) === 'queuing';
  }

  function setQueuing(queuing) {
    sessionStorage.setItem(STORAGE_KEY, queuing ? 'queuing' : 'idle');
  }

  function isArrived() {
    return sessionStorage.getItem(ARRIVAL_KEY) === 'arrived';
  }

  function setArrived(arrived) {
    sessionStorage.setItem(ARRIVAL_KEY, arrived ? 'arrived' : 'not_arrived');
  }

  function updateFabLabel(btn) {
    btn.textContent = isQueuing() ? '排队中' : '去排队';
  }

  function updateArrivalStatus() {
    var statusEl = document.getElementById('queueArrivalStatus');
    var tipEl = document.querySelector('.ua-queue-reserve-tip');
    if (!statusEl) return;

    if (isArrived()) {
      statusEl.textContent = STATUS_ARRIVED;
      statusEl.classList.add('ua-queue-arrival--arrived');
      statusEl.removeAttribute('title');
      if (tipEl) tipEl.textContent = TIP_ARRIVED;
    } else {
      statusEl.textContent = STATUS_NOT_ARRIVED;
      statusEl.classList.remove('ua-queue-arrival--arrived');
      statusEl.title = '演示：点击模拟扫码到店';
      if (tipEl) tipEl.textContent = TIP_NOT_ARRIVED;
    }
  }

  function handleStoreScan() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('storeScan')) return false;

    setQueuing(true);
    setArrived(true);
    params.delete('storeScan');
    var query = params.toString();
    var nextUrl = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
    window.history.replaceState(null, '', nextUrl);
    return true;
  }

  function init() {
    var shell = document.querySelector('.ua-mobile-shell');
    if (!shell) return;

    if (!shell.querySelector('#openQueueBtn')) {
      shell.insertAdjacentHTML('beforeend', WIDGET_HTML);
    }

    var mask = document.getElementById('queueModal');
    var openBtn = document.getElementById('openQueueBtn');
    var closeBtn = document.getElementById('closeQueueBtn');
    var cancelBtn = document.getElementById('cancelQueueBtn');
    var pickupOrdersBtn = document.getElementById('viewPickupOrdersBtn');

    var scanned = handleStoreScan();
    updateFabLabel(openBtn);
    updateArrivalStatus();

    function openModal() {
      if (!isQueuing()) {
        setQueuing(true);
        updateFabLabel(openBtn);
      }
      mask.hidden = false;
    }

    function closeModal() {
      mask.hidden = true;
    }

    function goToPickupOrders() {
      closeModal();
      var ordersUrl = new URL('orders.html', window.location.href);
      ordersUrl.searchParams.set('tab', 'pickup');
      var onOrdersPage = /\/orders\.html$/i.test(window.location.pathname);
      if (onOrdersPage && window.UaOrders && typeof window.UaOrders.setTab === 'function') {
        window.UaOrders.setTab('pickup');
        return;
      }
      window.location.href = ordersUrl.pathname + ordersUrl.search;
    }

    function cancelQueue() {
      setQueuing(false);
      setArrived(false);
      updateFabLabel(openBtn);
      updateArrivalStatus();
      closeModal();
    }

    if (scanned) {
      openModal();
    }

    var statusEl = document.getElementById('queueArrivalStatus');
    if (statusEl) {
      statusEl.addEventListener('click', function () {
        if (isArrived()) return;
        setQueuing(true);
        setArrived(true);
        updateFabLabel(openBtn);
        updateArrivalStatus();
      });
    }

    if (pickupOrdersBtn) {
      pickupOrdersBtn.addEventListener('click', goToPickupOrders);
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', cancelQueue);
    mask.addEventListener('click', function (e) {
      if (e.target === mask) closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
