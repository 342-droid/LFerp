(function () {
  function toast(msg) {
    var el = document.getElementById('saToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'saToast';
      el.className = 'sa-toast';
      var shell = document.querySelector('.sa-shell');
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function goRestock() {
    window.location.href = '../../user-app/h5/restock.html?from=store-app';
  }

  function goWallet() {
    window.location.href = '../../user-app/h5/store-wallet.html?from=store-app';
  }

  function goBizCenter() {
    window.location.href = 'biz-center.html';
  }

  function goVerify(mode) {
    var qs = [];
    if (mode) qs.push('mode=' + encodeURIComponent(mode));
    window.location.href = 'verify.html' + (qs.length ? '?' + qs.join('&') : '');
  }

  function goOrders() {
    window.location.href = 'store-orders.html';
  }

  function bindActions() {
    document.querySelectorAll('[data-sa-action]:not([data-sa-action="queueCode"])').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-sa-action');
        if (action === 'restock') {
          goRestock();
          return;
        }
        if (action === 'wallet') {
          goWallet();
          return;
        }
        if (action === 'bizCenter') {
          goBizCenter();
          return;
        }
        if (action === 'scan') {
          if (window.LFScan && window.LFScan.open) {
            window.LFScan.open();
          }
          return;
        }
        if (action === 'code' || action === 'pending') {
          goVerify();
          return;
        }
        if (action === 'more') {
          window.location.href = 'more.html';
          return;
        }
        if (action === 'onboarding') {
          window.location.href = 'onboarding.html';
          return;
        }
        if (action === 'orders') {
          goOrders();
          return;
        }
        var labels = {
          aftersaleQuick: '售后',
          memberCode: '门店会员码',
          orders: '门店订单',
          receive: '收货',
          inventory: '库存查询',
          aftersale: '售后',
          settings: '设置',
          ai: 'AI'
        };
        toast((labels[action] || '功能') + '（演示）');
      });
    });
  }

  /** 未进件 / 草稿 / 驳回时显示红点；进件中或成功则隐藏 */
  function syncOnboardingDot() {
    var btn = document.querySelector('[data-sa-action="onboarding"]');
    if (!btn) return;
    var dot = btn.querySelector('.sa-tool__dot');
    var show = true;
    try {
      var all = JSON.parse(localStorage.getItem('mdm_unified_onboarding_records_v1') || '{}') || {};
      var rec = all['storeapp::store::MU20260315001'];
      if (rec) {
        if (rec.auditStatus === '审核成功' || rec.status === 'approved') show = false;
        else if (
          rec.status === 'submitted' &&
          rec.auditStatus &&
          rec.auditStatus !== '审核失败'
        ) {
          show = false;
        }
      }
    } catch (e) {
      /* ignore */
    }
    if (dot) dot.hidden = !show;
    else if (show) {
      var label = btn.querySelector('.sa-tool__label');
      if (label && !label.querySelector('.sa-tool__dot')) {
        var span = document.createElement('span');
        span.className = 'sa-tool__dot';
        span.setAttribute('aria-hidden', 'true');
        label.appendChild(span);
      }
    }
  }

  bindActions();
  syncOnboardingDot();

  if (window.LFScan && window.LFMockData) {
    window.LFScan.init(window.LFMockData, {
      openButton: document.querySelector('[data-sa-action="scan"]'),
      modal: document.getElementById('scan-modal'),
      simulateButton: document.getElementById('btn-scan-simulate'),
      cancelButton: document.getElementById('btn-scan-cancel')
    });
  }

  if (window.LFQRCode && window.LFMockData) {
    var store = window.LFMockData.store || {};
    window.LFQRCode.init(window.LFMockData, {
      openButton: document.getElementById('btn-queue-qr-open'),
      modal: document.getElementById('queue-qr-modal'),
      closeButton: document.getElementById('btn-queue-qr-close'),
      shareButton: document.getElementById('btn-queue-qr-share'),
      saveButton: document.getElementById('btn-queue-qr-save'),
      qrMount: document.getElementById('queue-qr-code-mount'),
      avatarEl: document.getElementById('queue-qr-avatar'),
      nameEl: document.getElementById('queue-qr-store-name'),
      qrUrl: store.queueCodeUrl,
      shareTitle: (store.companyName || '门店') + '排队码',
      shareText: '扫码在' + (store.companyName || '门店') + '排队取号',
      downloadSuffix: '_排队码'
    });
  }
})();
