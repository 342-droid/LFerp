/**
 * 用户 APP — 设置页
 */
(function () {
  function toast(msg) {
    if (window.UaAccountCancel && window.UaAccountCancel.showToast) {
      window.UaAccountCancel.showToast(msg);
      return;
    }
    var el = document.getElementById('uaCancelToast');
    if (!el) {
      alert(msg);
      return;
    }
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove('is-show');
    }, 2200);
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-pe-nav__back', 'profile.html');
      ['setChangePwd', 'setMore'].forEach(function (id) {
        var a = document.getElementById(id);
        if (a && a.tagName === 'A' && window.UaNav.withFrom) {
          a.href = window.UaNav.withFrom(a.getAttribute('href') || '');
        }
      });
    }

    var clearBtn = document.getElementById('setClearCache');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        var sizeEl = document.getElementById('setCacheSize');
        if (sizeEl) sizeEl.textContent = '0 MB';
        toast('缓存已清除');
      });
    }

    var agreeBtn = document.getElementById('setUserAgreement');
    if (agreeBtn) {
      agreeBtn.addEventListener('click', function () {
        toast('用户协议内容由基础设置维护（演示）');
      });
    }

    var downloadBtn = document.getElementById('setDownloadApp');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        var installed = false;
        try {
          var raw = localStorage.getItem('ua_register_gift_demo_v1');
          if (raw) {
            var demo = JSON.parse(raw);
            installed = !!(demo && demo.appInstalled);
          }
        } catch (e) {}
        toast(installed ? '检测到已安装，演示唤起 APP' : '跳转应用商店下载冷丰 APP（演示）');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
