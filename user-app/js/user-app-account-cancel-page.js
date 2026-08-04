/**
 * 用户 APP — 账号注销多步页（须知 → 确认 → 审核中）
 * 开发注解：注销成功后自动退出登录；已注销手机号可再次注册。
 */
(function () {
  var panels = {
    notice: document.getElementById('acPanelNotice'),
    confirm: document.getElementById('acPanelConfirm'),
    pending: document.getElementById('acPanelPending')
  };
  var titleEl = document.getElementById('acTitle');
  var reasonEl = document.getElementById('acReason');
  var countEl = document.getElementById('acReasonCount');
  var pollTimer = null;

  function toast(msg) {
    if (window.UaAccountCancel) window.UaAccountCancel.showToast(msg);
    else alert(msg);
  }

  function showPanel(name) {
    Object.keys(panels).forEach(function (key) {
      if (!panels[key]) return;
      panels[key].classList.toggle('is-active', key === name);
    });
    if (titleEl) {
      titleEl.textContent = name === 'pending' ? '注销进度' : '账号注销';
    }
  }

  function getProfile() {
    if (window.UAProfile && typeof window.UAProfile.load === 'function') {
      return window.UAProfile.load() || {};
    }
    try {
      var raw = localStorage.getItem('ua_member_profile_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function goConfirm() {
    var check = window.UaAccountCancel
      ? window.UaAccountCancel.checkCanCancel()
      : { ok: true };
    if (!check.ok) {
      toast(check.message || '暂无法注销');
      return;
    }
    showPanel('confirm');
  }

  function submit() {
    var reason = (reasonEl && reasonEl.value || '').trim();
    if (!reason) {
      toast('请填写注销原因');
      if (reasonEl) reasonEl.focus();
      return;
    }
    var check = window.UaAccountCancel
      ? window.UaAccountCancel.checkCanCancel()
      : { ok: true };
    if (!check.ok) {
      toast(check.message || '暂无法注销');
      return;
    }
    if (window.UaAccountCancel) {
      window.UaAccountCancel.submitCancel(reason, getProfile());
    }
    toast('注销申请已提交');
    showPanel('pending');
    startPendingPoll();
  }

  function revoke() {
    stopPendingPoll();
    if (window.UaAccountCancel) window.UaAccountCancel.revokeCancel();
    toast('已取消注销申请');
    setTimeout(function () {
      window.location.href = window.UaNav
        ? window.UaNav.getBackHref('settings-more.html')
        : 'settings-more.html';
    }, 600);
  }

  /** 注销成功：提示后自动退出登录 */
  function handleCancelSuccess() {
    stopPendingPoll();
    toast('注销成功，即将退出登录');
    setTimeout(function () {
      if (window.UaAccountCancel && typeof window.UaAccountCancel.finalizeCancelSuccess === 'function') {
        window.UaAccountCancel.finalizeCancelSuccess();
      } else {
        window.location.replace('login.html?cancelSuccess=1&force=1');
      }
    }, 900);
  }

  function startPendingPoll() {
    stopPendingPoll();
    pollTimer = setInterval(function () {
      if (!window.UaAccountCancel) return;
      if (window.UaAccountCancel.isCanceled()) {
        handleCancelSuccess();
      } else if (!window.UaAccountCancel.isPending()) {
        stopPendingPoll();
      }
    }, 1500);
  }

  function stopPendingPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('#acBack', 'settings-more.html');
    }

    /* URL 演示拦截：?block=orders|aftersale|clear ；演示通过：?demoApprove=1 */
    try {
      var params = new URLSearchParams(window.location.search || '');
      var block = params.get('block');
      if (block === 'orders') localStorage.setItem('ua_cancel_demo_orders', '1');
      else if (block === 'aftersale') localStorage.setItem('ua_cancel_demo_aftersale', '1');
      else if (block === 'clear') {
        localStorage.removeItem('ua_cancel_demo_orders');
        localStorage.removeItem('ua_cancel_demo_aftersale');
      }
      /* 本地演示：审核通过后立刻走成功退出 */
      if (params.get('demoApprove') === '1' && window.UaAccountCancel) {
        var cur = window.UaAccountCancel.read();
        window.UaAccountCancel.write(Object.assign({}, cur, {
          status: 'canceled',
          cancelTime: new Date().toISOString()
        }));
      }
    } catch (e) { /* ignore */ }

    if (window.UaAccountCancel && window.UaAccountCancel.isCanceled()) {
      showPanel('pending');
      var revokeBtn = document.getElementById('acRevokeBtn');
      if (revokeBtn) revokeBtn.style.display = 'none';
      var pendingTitle = document.querySelector('.ua-ac-pending__title');
      var pendingDesc = document.querySelector('.ua-ac-pending__desc');
      if (pendingTitle) pendingTitle.textContent = '账号已注销';
      if (pendingDesc) pendingDesc.textContent = '相关数据已清除，即将退出登录。该手机号可重新注册。';
      handleCancelSuccess();
    } else if (window.UaAccountCancel && window.UaAccountCancel.isPending()) {
      showPanel('pending');
      startPendingPoll();
    } else {
      showPanel('notice');
    }

    var continueBtn = document.getElementById('acContinueBtn');
    if (continueBtn) continueBtn.addEventListener('click', goConfirm);

    var cancelBtn = document.getElementById('acConfirmCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        showPanel('notice');
      });
    }

    var submitBtn = document.getElementById('acConfirmSubmit');
    if (submitBtn) submitBtn.addEventListener('click', submit);

    var revokeBtn2 = document.getElementById('acRevokeBtn');
    if (revokeBtn2) revokeBtn2.addEventListener('click', revoke);

    if (reasonEl && countEl) {
      reasonEl.addEventListener('input', function () {
        countEl.textContent = String(reasonEl.value.length);
      });
    }

    window.addEventListener('beforeunload', stopPendingPoll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
