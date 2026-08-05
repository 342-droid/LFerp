/**
 * 门店支付密码演示（对公充值 / 平台提现共用）
 * - 仅 6 位数字；错误 4 次锁定当日，重置后立即解锁
 * - 短信验证码演示码：123456
 */
(function (global) {
  var KEY_PWD = 'sa_demo_pay_pwd';
  var KEY_LEGACY = 'sa_demo_withdraw_pwd';
  var KEY_FAIL = 'sa_demo_pay_pwd_fail';
  var KEY_LOCK = 'sa_demo_pay_pwd_lock';
  var KEY_SMS = 'sa_demo_pay_pwd_sms';
  var KEY_PENDING = 'sa_demo_pay_pending';
  var MAX_FAIL = 4;
  var SMS_CODE = '123456';
  var SMS_TTL_MS = 60 * 1000;
  var DEMO_PHONE = '+86 138****8001';
  var DEMO_PHONE_FULL = '+86 13812348001';

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, val) {
    try {
      if (val == null) localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch (e) {
      /* ignore */
    }
  }

  function readJson(key) {
    try {
      var raw = read(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, obj) {
    write(key, obj == null ? null : JSON.stringify(obj));
  }

  function getPassword() {
    var v = read(KEY_PWD);
    if (v) return v;
    var legacy = read(KEY_LEGACY);
    if (legacy) {
      write(KEY_PWD, legacy);
      return legacy;
    }
    return '';
  }

  function setPassword(pwd) {
    write(KEY_PWD, String(pwd || ''));
    write(KEY_LEGACY, null);
    clearLock();
  }

  function hasPassword() {
    return getPassword().length === 6;
  }

  function getFailState() {
    var s = readJson(KEY_FAIL) || {};
    if (s.day !== todayKey()) return { day: todayKey(), count: 0 };
    return { day: s.day, count: Number(s.count || 0) };
  }

  function setFailCount(n) {
    writeJson(KEY_FAIL, { day: todayKey(), count: n });
  }

  function isLocked() {
    var lock = readJson(KEY_LOCK);
    if (!lock) return false;
    return lock.day === todayKey();
  }

  function lockToday() {
    writeJson(KEY_LOCK, { day: todayKey() });
  }

  function clearLock() {
    write(KEY_LOCK, null);
    writeJson(KEY_FAIL, { day: todayKey(), count: 0 });
  }

  function remainTries() {
    if (isLocked()) return 0;
    return Math.max(0, MAX_FAIL - getFailState().count);
  }

  /**
   * @returns {{ ok: boolean, locked?: boolean, remain?: number, message?: string }}
   */
  function verify(pwd) {
    if (isLocked()) {
      return {
        ok: false,
        locked: true,
        remain: 0,
        message: '支付密码已锁定，请重置后重试'
      };
    }
    if (String(pwd || '') === getPassword()) {
      setFailCount(0);
      return { ok: true, remain: MAX_FAIL };
    }
    var next = getFailState().count + 1;
    setFailCount(next);
    if (next >= MAX_FAIL) {
      lockToday();
      return {
        ok: false,
        locked: true,
        remain: 0,
        message: '密码错误次数过多，今日提现/对公充值已锁定，请重置支付密码'
      };
    }
    return {
      ok: false,
      locked: false,
      remain: MAX_FAIL - next,
      message: '支付密码错误，还可尝试' + (MAX_FAIL - next) + '次'
    };
  }

  function getSms() {
    return readJson(KEY_SMS);
  }

  /** 距验证码过期剩余秒数（按墙钟，与 UI 倒计时同源） */
  function smsRemainSec() {
    var sms = getSms();
    if (!sms) return 0;
    var expireAt = Number(sms.expireAt || 0);
    if (!expireAt) return 0;
    return Math.max(0, Math.ceil((expireAt - Date.now()) / 1000));
  }

  function sendSms() {
    var now = Date.now();
    var payload = {
      code: SMS_CODE,
      sentAt: now,
      expireAt: now + SMS_TTL_MS
    };
    writeJson(KEY_SMS, payload);
    return {
      ok: true,
      phone: DEMO_PHONE,
      phoneFull: DEMO_PHONE_FULL,
      expireAt: payload.expireAt,
      ttlSec: Math.ceil(SMS_TTL_MS / 1000)
    };
  }

  /**
   * @returns {{ ok: boolean, message?: string }}
   */
  function verifySms(code) {
    var sms = getSms();
    if (!sms) {
      return { ok: false, message: '请先获取短信验证码' };
    }
    /* 与倒计时同一套墙钟：剩余秒数 > 0 即未过期，避免 setTimeout 漂移误判 */
    if (smsRemainSec() <= 0) {
      return { ok: false, message: '短信验证码已过期' };
    }
    if (String(code || '') !== String(sms.code)) {
      return { ok: false, message: '短信验证码错误' };
    }
    write(KEY_SMS, null);
    return { ok: true };
  }

  function setPending(action) {
    writeJson(KEY_PENDING, action || null);
  }

  function getPending() {
    return readJson(KEY_PENDING);
  }

  function clearPending() {
    write(KEY_PENDING, null);
  }

  global.StorePayPassword = {
    MAX_FAIL: MAX_FAIL,
    DEMO_PHONE: DEMO_PHONE,
    DEMO_PHONE_FULL: DEMO_PHONE_FULL,
    SMS_CODE: SMS_CODE,
    hasPassword: hasPassword,
    getPassword: getPassword,
    setPassword: setPassword,
    verify: verify,
    isLocked: isLocked,
    remainTries: remainTries,
    clearLock: clearLock,
    sendSms: sendSms,
    getSms: getSms,
    smsRemainSec: smsRemainSec,
    verifySms: verifySms,
    setPending: setPending,
    getPending: getPending,
    clearPending: clearPending
  };
})(typeof window !== 'undefined' ? window : this);
