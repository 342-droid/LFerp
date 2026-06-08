(function () {
  var MESSAGE_KEY = 'ua_queue_store_messages';

  function loadStoreMessages() {
    try {
      return JSON.parse(localStorage.getItem(MESSAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function syncMemberMessages() {
    var messages = loadStoreMessages();
    document.querySelectorAll('.queue-table tbody tr[data-queue-nickname]').forEach(function (row) {
      var nickname = row.getAttribute('data-queue-nickname');
      var cell = row.querySelector('.js-queue-member-message');
      if (!cell || !nickname) return;
      var saved = messages[nickname];
      cell.textContent = saved && saved.text ? saved.text : '-';
    });
  }

  function initMessageSync() {
    syncMemberMessages();
    window.addEventListener('storage', function (e) {
      if (e.key === MESSAGE_KEY) syncMemberMessages();
    });
    window.addEventListener('ua-queue-message-sent', syncMemberMessages);
  }

  function initFilter() {
    var expandBtn = document.getElementById('queueFilterExpand');
    var expandLabel = document.getElementById('queueFilterExpandLabel');
    var extraGrid = document.getElementById('queueFilterExtra');
    var resetBtn = document.getElementById('queueFilterReset');
    var searchBtn = document.getElementById('queueFilterSearch');
    if (!expandBtn || !extraGrid) return;

    extraGrid.hidden = false;
    expandBtn.classList.remove('is-collapsed');
    if (expandLabel) expandLabel.textContent = '收起更多筛选';

    expandBtn.addEventListener('click', function () {
      var collapsed = !extraGrid.hidden;
      extraGrid.hidden = collapsed;
      expandBtn.classList.toggle('is-collapsed', collapsed);
      if (expandLabel) {
        expandLabel.textContent = collapsed ? '展开更多筛选' : '收起更多筛选';
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = document.getElementById('queueFilterForm');
        if (!form) return;
        form.reset();
        document.getElementById('qCreateStart').value = '2026-01-07';
        document.getElementById('qCreateEnd').value = '2026-01-07';
        extraGrid.hidden = false;
        expandBtn.classList.remove('is-collapsed');
        if (expandLabel) expandLabel.textContent = '收起更多筛选';
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        if (typeof showToast === 'function') {
          showToast('搜索完成（演示）', 'success');
        }
      });
    }
  }

  function init() {
    initFilter();
    initMessageSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
