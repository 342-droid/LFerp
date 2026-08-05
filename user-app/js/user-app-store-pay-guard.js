/**
 * 对公充值 / 平台提现 — 支付密码门禁
 * 使用前需加载 store-pay-password.js
 */
(function (global) {
  function buildPayPasswordUrl(opts) {
    opts = opts || {};
    var step = opts.step || 'set';
    var q = new URLSearchParams();
    q.set('step', step);
    if (opts.from) q.set('from', opts.from);
    if (opts.returnUrl) q.set('return', opts.returnUrl);
    if (opts.appFrom) q.set('appFrom', opts.appFrom);
    return 'store-pay-password.html?' + q.toString();
  }

  /**
   * @param {object} opts
   * @param {string} opts.from 'withdraw' | 'recharge'
   * @param {string} opts.returnUrl 当前页完整相对路径（含 query）
   * @param {string} [opts.appFrom]
   * @param {boolean} [opts.inlineVerify=false] true 时已设密且未锁定返回 'verify'，由页面半屏弹框承接
   * @param {object} pending 待执行业务，写入 StorePayPassword.setPending
   * @returns {'blocked'|'redirect'|'verify'}
   */
  function gatePayPassword(opts, pending) {
    var api = global.StorePayPassword;
    if (!api) {
      window.alert('支付密码模块未加载');
      return 'blocked';
    }
    if (pending) api.setPending(pending);

    var appFrom = opts.appFrom || '';
    var returnUrl = opts.returnUrl || '';
    var from = opts.from || 'withdraw';
    var inlineVerify = !!opts.inlineVerify;

    if (!api.hasPassword()) {
      window.location.href = buildPayPasswordUrl({
        step: 'set',
        from: from,
        returnUrl: returnUrl,
        appFrom: appFrom
      });
      return 'redirect';
    }
    if (api.isLocked()) {
      window.location.href = buildPayPasswordUrl({
        step: 'sms',
        from: from,
        returnUrl: returnUrl,
        appFrom: appFrom
      });
      return 'redirect';
    }
    if (inlineVerify) return 'verify';
    window.location.href = buildPayPasswordUrl({
      step: 'verify',
      from: from,
      returnUrl: returnUrl,
      appFrom: appFrom
    });
    return 'redirect';
  }

  global.StorePayPasswordGuard = {
    buildPayPasswordUrl: buildPayPasswordUrl,
    gatePayPassword: gatePayPassword
  };
})(typeof window !== 'undefined' ? window : this);
