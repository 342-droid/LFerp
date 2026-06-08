(function () {
  var STORAGE_KEY = 'ua_queue_status';

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
            '<span>未到店</span>' +
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
                '<button type="button" class="ua-queue-btn ua-queue-btn--primary">查看待提货订单</button>' +
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

  function updateFabLabel(btn) {
    btn.textContent = isQueuing() ? '排队中' : '去排队';
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

    updateFabLabel(openBtn);

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

    function cancelQueue() {
      setQueuing(false);
      updateFabLabel(openBtn);
      closeModal();
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
