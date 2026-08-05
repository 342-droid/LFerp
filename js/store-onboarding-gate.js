/**
 * 门店商户进件状态门禁（钱包充值绑卡 / 提现共用）
 * 记录键与 store-app 进件页一致：storeapp::store::MU20260315001
 * 提示统一为居中消息条，约 2s 自动隐藏
 */
(function (global) {
  var KEY = 'mdm_unified_onboarding_records_v1';
  var STORE_ID = 'MU20260315001';
  var RECORD_KEY = 'storeapp::store::' + STORE_ID;
  var TOAST_MS = 2000;

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function getRecord() {
    return readAll()[RECORD_KEY] || null;
  }

  /**
   * none | draft | pending | success | fail
   */
  function getPhase(rec) {
    rec = rec || getRecord();
    if (!rec) return 'none';
    if (rec.auditStatus === '审核成功' || rec.status === 'approved') return 'success';
    if (rec.auditStatus === '审核失败' || rec.status === 'rejected') return 'fail';
    if (rec.status === 'draft') return 'draft';
    if (
      rec.status === 'submitted' ||
      rec.auditStatus === '待BD审核' ||
      rec.auditStatus === '待总监审核' ||
      rec.auditStatus === '待财务审核' ||
      rec.auditStatus === '待汇付审核'
    ) {
      return 'pending';
    }
    return 'none';
  }

  /** 已提交且带身份证信息（无需等到审核通过） */
  function hasSubmittedIdentity(rec) {
    rec = rec || getRecord();
    if (!rec) return false;
    var phase = getPhase(rec);
    if (phase !== 'pending' && phase !== 'success') return false;
    var f = rec.fields || {};
    var hasId =
      !!f.legal_cert_front_pic ||
      !!f.legal_cert_back_pic ||
      !!(f.legal_cert_no || f.idNumber) ||
      !!f.license_pic;
    return hasId;
  }

  /** 可添加银行卡充值 */
  function canAddBankCardForRecharge(rec) {
    return hasSubmittedIdentity(rec);
  }

  function rechargeAddCardBlockMessage(rec) {
    if (canAddBankCardForRecharge(rec)) return '';
    return '商户进件未完成，请先完成进件后充值';
  }

  /**
   * 绑卡时身份校验（已提交但证照缺失 / 演示失败标记）
   * @returns {{ ok: boolean, message?: string }}
   */
  function checkIdentityForBindCard(rec) {
    rec = rec || getRecord();
    var phase = getPhase(rec);
    if (phase === 'none' || phase === 'draft' || phase === 'fail') {
      return { ok: false, message: '商户进件未完成，请先完成进件后充值', goOnboarding: true };
    }
    if (rec && rec.identityVerifyFail) {
      return {
        ok: false,
        message: '身份信息校验失败，请完成商户进件后再充值。',
        goOnboarding: true
      };
    }
    var f = (rec && rec.fields) || {};
    var hasId = !!f.legal_cert_front_pic || !!f.legal_cert_back_pic;
    if (!hasId) {
      return {
        ok: false,
        message: '身份信息校验失败，请完成商户进件后再充值。',
        goOnboarding: true
      };
    }
    return { ok: true };
  }

  /** 仅进件完全成功（已有对公账户）可提现 */
  function canWithdraw(rec) {
    return getPhase(rec) === 'success';
  }

  function withdrawBlockMessage(rec) {
    var phase = getPhase(rec);
    if (phase === 'success') return '';
    if (phase === 'pending') return '商户进件审核中，审核通过后即可提现。';
    if (phase === 'fail') return '商户进件未通过，请重新提交资料后再提现。';
    return '商户进件未完成，暂无法提现';
  }

  function onboardingHref(opts) {
    opts = opts || {};
    var q = new URLSearchParams();
    if (opts.from) q.set('from', opts.from);
    if (opts.returnUrl) q.set('return', opts.returnUrl);
    var s = q.toString();
    /* 兼容从 user-app/h5 与 store-app/h5 发起跳转 */
    var inStoreApp = /\/store-app\//.test(String(window.location.pathname || ''));
    var base = inStoreApp ? 'onboarding.html' : '../../store-app/h5/onboarding.html';
    return base + (s ? '?' + s : '');
  }

  function ensureToastStyle() {
    if (document.getElementById('sa-ob-gate-toast-style')) return;
    var style = document.createElement('style');
    style.id = 'sa-ob-gate-toast-style';
    style.textContent =
      '.sa-ob-gate-toast{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);' +
      'z-index:9999;max-width:78%;padding:12px 18px;border-radius:8px;' +
      'background:rgba(0,0,0,.78);color:#fff;font-size:14px;line-height:1.45;' +
      'text-align:center;pointer-events:none;box-sizing:border-box}' +
      '.sa-ob-gate-toast[hidden]{display:none!important}';
    document.head.appendChild(style);
  }

  /** 居中消息条，默认约 2 秒自动隐藏 */
  function toast(message, ms) {
    ensureToastStyle();
    var host =
      document.querySelector('.sa-shell') ||
      document.querySelector('.ua-mobile-shell') ||
      document.querySelector('.ua-sw-page') ||
      document.querySelector('.ua-wd-page') ||
      document.querySelector('.ua-bc-page') ||
      document.body;
    var el = host.querySelector(':scope > .sa-ob-gate-toast') || document.querySelector('.sa-ob-gate-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-ob-gate-toast';
      host.appendChild(el);
    }
    /* 壳内 absolute 更稳；否则用 fixed */
    if (host !== document.body && window.getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }
    if (host !== document.body) {
      el.style.position = 'absolute';
    } else {
      el.style.position = 'fixed';
    }
    el.textContent = message || '';
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, ms || TOAST_MS);
  }

  /**
   * 消息条提示后跳转进件
   */
  function blockAndGoOnboarding(message, opts) {
    opts = opts || {};
    var href = opts.href || onboardingHref(opts);
    var delay = opts.delay != null ? opts.delay : TOAST_MS;
    toast(message, delay);
    clearTimeout(blockAndGoOnboarding._t);
    blockAndGoOnboarding._t = setTimeout(function () {
      window.location.href = href;
    }, delay);
  }

  global.StoreOnboardingGate = {
    STORE_ID: STORE_ID,
    RECORD_KEY: RECORD_KEY,
    TOAST_MS: TOAST_MS,
    getRecord: getRecord,
    getPhase: getPhase,
    hasSubmittedIdentity: hasSubmittedIdentity,
    canAddBankCardForRecharge: canAddBankCardForRecharge,
    rechargeAddCardBlockMessage: rechargeAddCardBlockMessage,
    checkIdentityForBindCard: checkIdentityForBindCard,
    canWithdraw: canWithdraw,
    withdrawBlockMessage: withdrawBlockMessage,
    onboardingHref: onboardingHref,
    toast: toast,
    blockAndGoOnboarding: blockAndGoOnboarding
  };
})(typeof window !== 'undefined' ? window : this);
