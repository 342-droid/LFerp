(function () {
  var STORAGE_KEY = 'ua_queue_status';
  var ARRIVAL_KEY = 'ua_queue_arrival';
  var ARRIVAL_TIME_KEY = 'ua_queue_arrival_time';
  var CALLING_KEY = 'ua_queue_calling';
  var MESSAGE_KEY = 'ua_queue_store_messages';
  var QUEUE_NICKNAME = '小帅';
  var QUEUE_NUMBER = '1';
  var STATUS_NOT_ARRIVED = '未到店';
  var STATUS_ARRIVED = '已到店';
  var TIP_NOT_ARRIVED = '到店后需扫描门店二维码进行排队提货';
  var TIP_ARRIVED = '已扫码到店，请耐心等待叫号';
  var TIP_CALLING = '请留意叫号，点击刷新可更新最新排队信息';

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
        '<div class="ua-queue-card" id="queueCard">' +
          '<div class="ua-queue-card__bar">' +
            '<span>' + QUEUE_NICKNAME + '</span>' +
            '<span id="queueArrivalStatus">未到店</span>' +
          '</div>' +
          '<div class="ua-queue-call-banner" id="queueCallBanner" hidden>' +
            QUEUE_NICKNAME + ' 正在呼叫您' +
          '</div>' +
          '<div class="ua-queue-card__body">' +
            '<div class="ua-queue-view" id="queueViewWaiting">' +
              '<p class="ua-queue-reserve-label">在线预约</p>' +
              '<p class="ua-queue-reserve-title">预约成功</p>' +
              '<div class="ua-queue-divider"></div>' +
              '<p class="ua-queue-reserve-tip" id="queueReserveTip">' + TIP_NOT_ARRIVED + '</p>' +
            '</div>' +
            '<div class="ua-queue-view" id="queueViewCalling" hidden>' +
              '<p class="ua-queue-number-label">您的排队号</p>' +
              '<div class="ua-queue-number">' +
                '<span class="ua-queue-number__value">' + QUEUE_NUMBER + '</span>' +
                '<span class="ua-queue-number__unit">号</span>' +
              '</div>' +
              '<p class="ua-queue-arrival-time" id="queueArrivalTime">到店时间 --:--</p>' +
              '<div class="ua-queue-divider"></div>' +
              '<p class="ua-queue-call-tip">' + TIP_CALLING + '</p>' +
            '</div>' +
            '<div class="ua-queue-wait-row">' +
              '<p class="ua-queue-wait-text">前方等待 <em>0</em> 人</p>' +
              '<button type="button" class="ua-queue-refresh" id="queueRefreshBtn">' +
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
                '<form class="ua-queue-message__form" id="queueMessageForm">' +
                  '<textarea id="queueMessageInput" class="ua-queue-message__input" rows="2" enterkeyhint="send" placeholder="点击添加留言，方便导购了解您的需求"></textarea>' +
                  '<p class="ua-queue-message__status" id="queueMessageStatus" hidden></p>' +
                '</form>' +
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

  function isCalling() {
    return sessionStorage.getItem(CALLING_KEY) === 'calling';
  }

  function setCalling(calling) {
    if (calling) {
      sessionStorage.setItem(CALLING_KEY, 'calling');
    } else {
      sessionStorage.removeItem(CALLING_KEY);
    }
  }

  function setArrived(arrived) {
    sessionStorage.setItem(ARRIVAL_KEY, arrived ? 'arrived' : 'not_arrived');
    if (arrived) {
      sessionStorage.setItem(ARRIVAL_TIME_KEY, new Date().toISOString());
    } else {
      sessionStorage.removeItem(ARRIVAL_TIME_KEY);
      setCalling(false);
    }
  }

  function formatArrivalTime() {
    var iso = sessionStorage.getItem(ARRIVAL_TIME_KEY);
    if (!iso) return '--:--';
    var d = new Date(iso);
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function updateFabLabel(btn) {
    btn.textContent = isQueuing() ? '排队中' : '去排队';
  }

  function updateArrivalStatus() {
    var statusEl = document.getElementById('queueArrivalStatus');
    var tipEl = document.getElementById('queueReserveTip');
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

  function renderQueueView() {
    var card = document.getElementById('queueCard');
    var waitingView = document.getElementById('queueViewWaiting');
    var callingView = document.getElementById('queueViewCalling');
    var callBanner = document.getElementById('queueCallBanner');
    var arrivalTimeEl = document.getElementById('queueArrivalTime');
    if (!card || !waitingView || !callingView) return;

    var calling = isArrived() && isCalling();
    waitingView.hidden = calling;
    callingView.hidden = !calling;
    if (callBanner) callBanner.hidden = !calling;
    if (arrivalTimeEl) arrivalTimeEl.textContent = '到店时间 ' + formatArrivalTime();

    card.classList.toggle('is-calling', calling);
    card.classList.toggle('is-callable', isArrived() && !calling);
  }

  function loadStoreMessages() {
    try {
      return JSON.parse(localStorage.getItem(MESSAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveStoreMessage(text) {
    var messages = loadStoreMessages();
    messages[QUEUE_NICKNAME] = {
      text: text,
      sentAt: new Date().toISOString()
    };
    localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('ua-queue-message-sent', {
      detail: messages[QUEUE_NICKNAME]
    }));
  }

  function formatSentTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' 已发送至门店';
  }

  function initQueueMessage() {
    var form = document.getElementById('queueMessageForm');
    var input = document.getElementById('queueMessageInput');
    var statusEl = document.getElementById('queueMessageStatus');
    if (!form || !input) return;

    var saved = loadStoreMessages()[QUEUE_NICKNAME];
    if (saved && saved.text) {
      input.value = saved.text;
      if (statusEl) {
        statusEl.textContent = formatSentTime(saved.sentAt);
        statusEl.hidden = false;
      }
    }

    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;
      saveStoreMessage(text);
      if (statusEl) {
        statusEl.textContent = formatSentTime(new Date().toISOString());
        statusEl.hidden = false;
      }
      input.blur();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
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

  function isQueueFabPage() {
    return /\/(?:profile|orders|order-detail-(?:shipping|pickup))\.html$/i.test(window.location.pathname);
  }

  function init() {
    if (!isQueueFabPage()) return;

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
    var queueCard = document.getElementById('queueCard');
    var refreshBtn = document.getElementById('queueRefreshBtn');

    var scanned = handleStoreScan();
    updateFabLabel(openBtn);
    updateArrivalStatus();
    renderQueueView();
    initQueueMessage();

    function openModal() {
      if (!isQueuing()) {
        setQueuing(true);
        updateFabLabel(openBtn);
      }
      mask.hidden = false;
      openBtn.classList.add('ua-fab-queue--over-modal');
      renderQueueView();
    }

    function closeModal() {
      mask.hidden = true;
      openBtn.classList.remove('ua-fab-queue--over-modal');
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
      setCalling(false);
      updateFabLabel(openBtn);
      updateArrivalStatus();
      renderQueueView();
      closeModal();
    }

    function triggerCalling() {
      if (!isArrived() || isCalling()) return;
      setCalling(true);
      renderQueueView();
    }

    if (scanned) {
      openModal();
    }

    var statusEl = document.getElementById('queueArrivalStatus');
    if (statusEl) {
      statusEl.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isArrived()) return;
        setQueuing(true);
        setArrived(true);
        updateFabLabel(openBtn);
        updateArrivalStatus();
        renderQueueView();
      });
    }

    if (queueCard) {
      queueCard.addEventListener('click', function (e) {
        if (e.target.closest('button, a, textarea, input, select, #queueArrivalStatus, .ua-queue-message__form')) {
          return;
        }
        triggerCalling();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        renderQueueView();
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
