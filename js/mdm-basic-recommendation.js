/**
 * 基础设置 — 商城推荐位关联优惠券
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCouponStore;
  if (!Store) return;

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function optionsHtml(selected) {
    var list = Store.listSelectable('MALL');
    var html = '<option value="">不关联优惠券</option>';
    if (!list.length) {
      html = '<option value="">暂无已启用且发放场景含「商城推荐位」的优惠券</option>';
      return html;
    }
    list.forEach(function (c) {
      html +=
        '<option value="' +
        escapeHtml(c.id) +
        '"' +
        (String(selected) === String(c.id) ? ' selected' : '') +
        '>' +
        escapeHtml(c.name + '（' + c.id + '）') +
        '</option>';
    });
    return html;
  }

  function render() {
    var tbody = document.getElementById('recTableBody');
    if (!tbody) return;
    var slots = Store.listRecSlots();
    tbody.innerHTML = slots
      .map(function (s) {
        var coupon = s.couponId ? Store.findById(s.couponId) : null;
        var selectable = coupon && Store.matchesScene(coupon, 'MALL');
        return (
          '<tr data-slot="' +
          escapeHtml(s.id) +
          '">' +
          '<td>' +
          escapeHtml(s.name) +
          '</td>' +
          '<td><select class="mkt-rec-coupon-select" data-slot="' +
          escapeHtml(s.id) +
          '">' +
          optionsHtml(selectable ? s.couponId : '') +
          '</select></td>' +
          '<td>' +
          escapeHtml(selectable ? Store.faceValueText(coupon) : '—') +
          '</td>' +
          '<td>' +
          escapeHtml(selectable ? Store.channelLabel(coupon.applicableChannel) : '—') +
          '</td>' +
          '<td class="action-links"><button type="button" class="erp-btn erp-btn--primary" data-act="save" data-slot="' +
          escapeHtml(s.id) +
          '">保存</button></td></tr>'
        );
      })
      .join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var tbody = document.getElementById('recTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act="save"]');
      if (!btn) return;
      var slot = btn.getAttribute('data-slot');
      var sel = tbody.querySelector('select[data-slot="' + slot + '"]');
      Store.bindRecCoupon(slot, sel ? sel.value : '');
      toast('推荐位优惠券已保存', 'success');
      render();
    });
    render();
  });
})();
