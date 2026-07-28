/**
 * 物流单号输入限制（前后台共用）
 * 1. 长度 1～50
 * 2. 仅数字、英文字母、-_；禁止中文、空格及其他特殊符号
 * 3. 提交时去首尾空格；不校验物流公司编码规则
 */
(function (global) {
  var MAX_LEN = 50;
  var PATTERN = /^[A-Za-z0-9_-]+$/;

  var MSG = {
    empty: '请输入物流单号',
    format: '物流单号格式不正确，请重新输入',
    max: '物流单号长度不能超过50个字符'
  };

  function normalize(raw) {
    return String(raw == null ? '' : raw).trim();
  }

  /**
   * @param {*} raw
   * @param {{ required?: boolean }} [options]
   * @returns {{ ok: boolean, value: string, code?: string, message?: string }}
   */
  function validate(raw, options) {
    var required = !options || options.required !== false;
    var value = normalize(raw);
    if (!value) {
      if (!required) return { ok: true, value: '' };
      return { ok: false, value: '', code: 'empty', message: MSG.empty };
    }
    if (value.length > MAX_LEN) {
      return { ok: false, value: value, code: 'max', message: MSG.max };
    }
    if (!PATTERN.test(value)) {
      return { ok: false, value: value, code: 'format', message: MSG.format };
    }
    return { ok: true, value: value };
  }

  /** 拆分多物流单号（逗号/分号/空白），逐个校验 */
  function validateMany(raw, options) {
    var required = !options || options.required !== false;
    var text = normalize(raw);
    if (!text) {
      if (!required) return { ok: true, values: [], value: '' };
      return { ok: false, values: [], value: '', code: 'empty', message: MSG.empty };
    }
    var parts = text.split(/[,，;；\s]+/).map(normalize).filter(Boolean);
    if (!parts.length) {
      return { ok: false, values: [], value: '', code: 'empty', message: MSG.empty };
    }
    var values = [];
    var seen = {};
    for (var i = 0; i < parts.length; i++) {
      var one = validate(parts[i], { required: true });
      if (!one.ok) {
        return {
          ok: false,
          values: values.slice(),
          value: text,
          code: one.code,
          message: one.message
        };
      }
      if (seen[one.value]) continue;
      seen[one.value] = true;
      values.push(one.value);
    }
    return {
      ok: true,
      values: values,
      value: values.join(', ')
    };
  }

  function toastError(result, toastFn) {
    if (!result || result.ok) return false;
    var fn =
      toastFn ||
      (typeof global.showToast === 'function' ? global.showToast : null) ||
      (typeof showToast === 'function' ? showToast : null);
    if (typeof fn === 'function') fn(result.message, 'error');
    return true;
  }

  /** 绑定输入框：maxlength=50，失焦去首尾空格 */
  function bindInput(input) {
    if (!input || input.getAttribute('data-tracking-no-bound') === '1') return input;
    input.setAttribute('data-tracking-no-bound', '1');
    input.setAttribute('maxlength', String(MAX_LEN));
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.addEventListener('blur', function () {
      var next = normalize(input.value);
      if (input.value !== next) input.value = next;
    });
    return input;
  }

  global.LogisticsTrackingNo = {
    MAX_LEN: MAX_LEN,
    PATTERN: PATTERN,
    MSG: MSG,
    normalize: normalize,
    validate: validate,
    validateMany: validateMany,
    toastError: toastError,
    bindInput: bindInput
  };
})(typeof window !== 'undefined' ? window : this);
