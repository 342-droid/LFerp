/**
 * C 端 — 红包领取记录（小程序 / APP 共用）
 * 待领取可再次打开领取半屏；不展示发放失败数据；展示流水号
 */
(function () {
  'use strict';

  var RG = window.UaRegisterGift;
  var C = window.MdmMarketingCashRedpackStore;
  if (!RG || !C) return;

  var statusFilter = '';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusClass(st) {
    if (st === 'claimed') return 'ua-rp-status ua-rp-status--ok';
    if (st === 'pending') return 'ua-rp-status ua-rp-status--pending';
    return 'ua-rp-status ua-rp-status--muted';
  }

  function sceneText(scene) {
    return C.sceneLabel ? C.sceneLabel(scene) : scene === 'old_first_download' ? '老用户下载' : '新用户注册';
  }

  function render() {
    var listEl = document.getElementById('rpRecordsList');
    var endEl = document.getElementById('rpRecordsEnd');
    if (!listEl) return;

    var rows = RG.listMyCashRecords().filter(function (it) {
      if (!statusFilter) return true;
      return it.status === statusFilter;
    });

    if (!rows.length) {
      listEl.innerHTML = '<div class="ua-gd-empty">暂无红包记录</div>';
      if (endEl) endEl.hidden = true;
      return;
    }

    if (endEl) endEl.hidden = false;
    listEl.innerHTML = rows
      .map(function (it) {
        var canClaim = it.status === 'pending';
        var tag = canClaim
          ? '<span class="ua-rp-item__action">去领取</span>'
          : '<span class="' +
            statusClass(it.status) +
            '">' +
            escapeHtml(C.statusLabel(it.status)) +
            '</span>';
        var billNo = it.outBillNo || '';
        return (
          '<button type="button" class="ua-rp-item' +
          (canClaim ? ' ua-rp-item--claimable' : '') +
          '" data-id="' +
          escapeHtml(it.id) +
          '"' +
          (canClaim ? ' data-claim="1"' : '') +
          '>' +
          '<div class="ua-rp-item__meta">' +
          '<div class="ua-rp-item__title">' +
          escapeHtml(it.activityName || '现金红包') +
          '</div>' +
          '<div class="ua-rp-item__sub">' +
          escapeHtml(sceneText(it.scene)) +
          ' · ' +
          escapeHtml(it.grantedAt || '') +
          '</div>' +
          (billNo
            ? '<div class="ua-rp-item__bill">流水号 ' + escapeHtml(billNo) + '</div>'
            : '') +
          '</div>' +
          '<div class="ua-rp-item__right">' +
          '<div class="ua-rp-item__amount">' +
          escapeHtml(String(it.amount)) +
          '<em>元</em></div>' +
          tag +
          '</div></button>'
        );
      })
      .join('');
  }

  function bindFilter() {
    document.querySelectorAll('.ua-rp-filter__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.ua-rp-filter__btn').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        statusFilter = btn.getAttribute('data-status') || '';
        render();
      });
    });
  }

  function bindList() {
    var listEl = document.getElementById('rpRecordsList');
    if (!listEl) return;
    listEl.addEventListener('click', function (e) {
      var item = e.target && e.target.closest ? e.target.closest('[data-claim]') : null;
      if (!item) return;
      var id = item.getAttribute('data-id');
      if (!id) return;
      /* 待领取：再次打开用户领取弹窗；成功后关窗并刷新状态 */
      RG.goRedpackClaim(id, {
        onClaimed: function () {
          render();
        }
      });
    });
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-gd-nav__back', 'profile.html');
    }
    bindFilter();
    bindList();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
