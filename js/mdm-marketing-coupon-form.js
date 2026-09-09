/**
 * 营销活动 — 优惠券新建 / 编辑 / 查看 / 审核
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCouponStore;
  var FormUi = window.MdmMarketingCouponFormUi;
  if (!Store || !FormUi) return;
  var wp = window.wmsPath || { page: function (f) { return f; } };

  var mode = 'add';
  var couponId = '';
  var auditId = '';
  var fromAudit = false;
  var item = null;
  var audit = null;
  var bound = false;

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function qs(name) {
    var u = new URLSearchParams(window.location.search);
    return u.get(name) || '';
  }

  function listHref() {
    if (fromAudit) return wp.page('mdm_audit_coupon.html');
    return wp.page('mdm_marketing_coupon.html');
  }

  function isLocked() {
    return mode === 'view' || mode === 'audit';
  }

  function canEditFooter() {
    return mode === 'add' || mode === 'edit';
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
  }

  function paint() {
    var host = document.getElementById('cpFormPanel');
    var model = item ? FormUi.fillFromItem(item) : FormUi.emptyModel();
    if (audit && audit.snapshot && (mode === 'view' || mode === 'audit')) {
      model = FormUi.fillFromItem(audit.snapshot);
    }
    FormUi.render(host, {
      locked: isLocked(),
      model: model
    });
    if (!bound) {
      FormUi.bind(host);
      FormUi.bindSkuModal();
      bound = true;
    }
  }

  function goBack() {
    window.location.href = listHref();
  }

  function saveDraft() {
    var model = FormUi.collect();
    var saved = Store.saveDraft(couponId, model);
    toast('已保存为草稿', 'success');
    window.location.href = wp.page('mdm_marketing_coupon.html') + '?created=1';
    return saved;
  }

  function submitNow() {
    var err = FormUi.validate();
    if (err) {
      toast(err, 'error');
      return;
    }
    var model = FormUi.collect();
    Store.submitCoupon(couponId, model);
    toast('已提交，进入待审核', 'success');
    window.location.href = wp.page('mdm_marketing_coupon.html');
  }

  function approve() {
    if (!auditId) return;
    if (!window.confirm('确认审核通过？优惠券将变为审核成功，需再启用后才可被发放场景选择。')) return;
    Store.approveAudit(auditId);
    toast('审核成功', 'success');
    window.location.href = wp.page('mdm_audit_coupon.html');
  }

  function openReject() {
    var inp = document.getElementById('cpRejectReason');
    if (inp) inp.value = '';
    setHidden(document.getElementById('cpRejectBackdrop'), false);
  }

  function confirmReject() {
    var inp = document.getElementById('cpRejectReason');
    var reason = inp ? String(inp.value || '').trim() : '';
    if (!reason) {
      toast('请填写审核失败原因', 'error');
      return;
    }
    Store.rejectAudit(auditId, reason);
    toast('已审核失败', 'success');
    window.location.href = wp.page('mdm_audit_coupon.html');
  }

  document.addEventListener('DOMContentLoaded', function () {
    mode = qs('mode') || 'add';
    couponId = qs('id');
    auditId = qs('auditId');
    fromAudit = qs('from') === 'audit' || mode === 'audit' || !!auditId;
    if (couponId) item = Store.findById(couponId);
    if (auditId) audit = Store.findAudit(auditId);
    if (mode === 'audit' && audit && audit.status !== 'PENDING') mode = 'view';
    if ((mode === 'edit' || mode === 'view' || mode === 'audit') && !item && audit && audit.snapshot) {
      item = audit.snapshot;
    }
    if ((mode === 'edit' || mode === 'view') && !item) {
      toast('未找到该优惠券', 'warning');
      goBack();
      return;
    }
    if (mode === 'edit' && item && (item.status === 'PENDING' || item.status === 'ACTIVE')) {
      toast(item.status === 'ACTIVE' ? '启用中的优惠券请先禁用再编辑' : '待审核优惠券不可编辑', 'warning');
      goBack();
      return;
    }

    var tab = document.getElementById('cpFormTab');
    var titles = { add: '新建优惠券', edit: '编辑优惠券', view: '查看优惠券', audit: '审核优惠券' };
    if (tab) tab.textContent = titles[mode] || '优惠券';
    document.title = '冷丰WMS - ' + (titles[mode] || '优惠券');
    var back = document.getElementById('cpFormBack');
    if (back) {
      back.href = listHref();
      back.textContent = fromAudit ? '← 返回优惠券审核' : '← 返回优惠券';
    }

    var tip = document.getElementById('cpFormTip');
    if (tip) {
      if (mode === 'add' || mode === 'edit') {
        tip.hidden = false;
        tip.innerHTML =
          '点击<strong>保存</strong>进入草稿，草稿不校验必填；点击<strong>提交</strong>需填齐全部必填项，并生成一条待审核记录进入审核中心-优惠券。';
      } else if (mode === 'audit') {
        tip.hidden = false;
        tip.innerHTML = '以下为提交时的券模板全部信息，只读。审核通过后状态为<strong>审核成功</strong>，需运营再启用才可被各发放场景选择。';
      } else {
        tip.hidden = true;
      }
    }

    document.getElementById('cpBtnCancel').addEventListener('click', goBack);
    document.getElementById('cpBtnSave').addEventListener('click', saveDraft);
    document.getElementById('cpBtnSubmit').addEventListener('click', submitNow);
    document.getElementById('cpBtnApprove').addEventListener('click', approve);
    document.getElementById('cpBtnReject').addEventListener('click', openReject);
    document.getElementById('cpRejectCancel').addEventListener('click', function () {
      setHidden(document.getElementById('cpRejectBackdrop'), true);
    });
    document.getElementById('cpRejectClose').addEventListener('click', function () {
      setHidden(document.getElementById('cpRejectBackdrop'), true);
    });
    document.getElementById('cpRejectOk').addEventListener('click', confirmReject);

    setHidden(document.getElementById('cpBtnSave'), !canEditFooter());
    setHidden(document.getElementById('cpBtnSubmit'), !canEditFooter());
    setHidden(document.getElementById('cpBtnApprove'), mode !== 'audit');
    setHidden(document.getElementById('cpBtnReject'), mode !== 'audit');

    paint();
  });
})();
