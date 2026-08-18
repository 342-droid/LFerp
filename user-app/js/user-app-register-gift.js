/**
 * C 端 — 注册有礼 + 现金红包（小程序 / APP 共用）
 *
 * 客户端模式：localStorage ua_client_mode = 'mini' | 'app'
 * 演示开关（ua_register_gift_demo_v1）：
 *   hasUnionId, phoneBound, appInstalled, deviceBoundPhone, isNewUser
 *
 * 注释：仓库无独立小程序目录，用 clientMode 区分小程序/APP 流程以便验收。
 */
(function (global) {
  'use strict';

  var CLIENT_KEY = 'ua_client_mode';
  var DEMO_KEY = 'ua_register_gift_demo_v1';
  var PENDING_KEY = 'ua_register_gift_pending_v1';
  var SESSION_KEY = 'ua_user_session_v1';
  var GRANTED_KEY = 'ua_register_gift_granted_v1';
  /* 引导下载/打开 APP 浮窗：本次启动关闭后不再展示，下次启动再出 */
  var FLOAT_CLOSED_KEY = 'ua_rg_float_closed_v1';

  var DEFAULT_DEMO = {
    hasUnionId: false,
    phoneBound: false,
    appInstalled: false,
    deviceBoundPhone: false,
    isNewUser: true,
    /** 演示：准备发放时商户余额不足 → 发放失败（C 端不展示该记录） */
    merchantBalanceInsufficient: false
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  function getClientMode() {
    var params = new URLSearchParams(global.location.search || '');
    var q = params.get('client') || params.get('port');
    if (q === 'app' || q === 'mini') {
      setClientMode(q);
      return q;
    }
    var stored = localStorage.getItem(CLIENT_KEY);
    return stored === 'app' ? 'app' : 'mini';
  }

  function setClientMode(mode) {
    var m = mode === 'app' ? 'app' : 'mini';
    try {
      localStorage.setItem(CLIENT_KEY, m);
    } catch (e) {}
    return m;
  }

  function getDemo() {
    return Object.assign({}, DEFAULT_DEMO, readJson(DEMO_KEY, {}));
  }

  function setDemo(patch) {
    var next = Object.assign(getDemo(), patch || {});
    writeJson(DEMO_KEY, next);
    return next;
  }

  function getSession() {
    return readJson(SESSION_KEY, null);
  }

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return d || '用户';
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  function GiftStore() {
    return global.MdmMarketingRegisterGiftStore || null;
  }

  function CashStore() {
    return global.MdmMarketingCashRedpackStore || null;
  }

  function getActiveActivity(port) {
    var S = GiftStore();
    if (!S || typeof S.getActiveByPort !== 'function') return null;
    return S.getActiveByPort(port || getClientMode());
  }

  function getSceneReward(activity, scene) {
    if (!activity || !activity.rewards) return null;
    var S = GiftStore();
    var raw = activity.rewards[scene];
    return S ? S.normalizeReward(raw) : raw;
  }

  function activityHasScene(activity, scene) {
    return !!(activity && Array.isArray(activity.scenes) && activity.scenes.indexOf(scene) >= 0);
  }

  /** 弹窗/列表用奖励文案（额度耗尽不展示红包） */
  function rewardLines(reward) {
    var S = GiftStore();
    if (S && typeof S.rewardDisplayLines === 'function') {
      return S.rewardDisplayLines(reward, { includeCash: true });
    }
    return [];
  }

  function hasBeenGranted(activityId, scene, phone) {
    var map = readJson(GRANTED_KEY, {});
    var key = [activityId, scene, phone || 'anon'].join('|');
    return !!map[key];
  }

  function markGranted(activityId, scene, phone) {
    var map = readJson(GRANTED_KEY, {});
    var key = [activityId, scene, phone || 'anon'].join('|');
    map[key] = Date.now();
    writeJson(GRANTED_KEY, map);
  }

  /**
   * 发放奖励；含红包时写入现金红包明细与 pending 领取单
   * @returns {{ ok: boolean, lines: string[], cashRecord: object|null, amount: number, message?: string }}
   */
  function grantRewards(opts) {
    opts = opts || {};
    var S = GiftStore();
    var C = CashStore();
    var activity = opts.activity || getActiveActivity(opts.port);
    var scene = opts.scene || 'new_register';
    if (!activity) return { ok: false, lines: [], cashRecord: null, amount: 0, message: '暂无有效活动' };
    if (!activityHasScene(activity, scene)) {
      return { ok: false, lines: [], cashRecord: null, amount: 0, message: '活动未配置该场景' };
    }

    var phone = opts.phone || (getSession() && getSession().phone) || '';
    if (opts.skipDuplicate !== false && hasBeenGranted(activity.id, scene, phone)) {
      return { ok: false, lines: [], cashRecord: null, amount: 0, message: '已领取过该奖励', already: true };
    }

    var reward = getSceneReward(activity, scene);
    var lines = rewardLines(reward);
    var cashRecord = null;
    var amount = 0;

    var cashDispatched = false;
    var cashFailed = false;

    if (S && S.isCashAvailable(reward)) {
      amount = S.rollCashAmount(reward);
      if (amount > 0) {
        S.addCashBudgetUsed(activity.id, scene, amount);
        if (C) {
          /* 先落库商户单号，再调微信转账发放：成功→待领取；余额不足→发放失败 */
          cashRecord = C.addRecord({
            amount: amount,
            userName: opts.userName || (getSession() && getSession().nickname) || '用户',
            userPhone: maskPhone(phone),
            userId: opts.userId || (getSession() && (getSession().userId || getSession().id)) || '',
            activityType: 'register_gift',
            activityId: activity.id,
            activityName: activity.name,
            scene: scene,
            port: activity.port,
            status: 'pending'
          });
          var dispatch = C.dispatchTransfer(cashRecord.id, {
            insufficient: !!(getDemo() && getDemo().merchantBalanceInsufficient)
          });
          cashRecord = dispatch.record || cashRecord;
          cashDispatched = !!(dispatch && dispatch.ok);
          cashFailed = !!(dispatch && !dispatch.ok);
          if (cashFailed) amount = cashRecord.amount || amount;
        }
        lines = rewardLines(getSceneReward(S.getById(activity.id), scene));
        /* 已发放金额写入展示：固定展示本次金额（仅发放成功时计入弹窗红包引导） */
        var withoutCash = lines.filter(function (l) {
          return String(l).indexOf('现金红包') < 0;
        });
        if (cashDispatched) {
          withoutCash.push('现金红包：' + amount + '元');
        }
        lines = withoutCash;
      }
    }

    markGranted(activity.id, scene, phone);

    var pending = {
      activityId: activity.id,
      activityName: activity.name,
      scene: scene,
      lines: lines,
      cashId: cashDispatched && cashRecord ? cashRecord.id : '',
      amount: cashDispatched ? amount : 0,
      port: activity.port,
      grantedAt: Date.now(),
      status: cashRecord ? cashRecord.status : ''
    };
    writeJson(PENDING_KEY, pending);

    return {
      ok: true,
      lines: lines,
      cashRecord: cashRecord,
      amount: cashDispatched ? amount : 0,
      cashFailed: cashFailed,
      pending: pending
    };
  }

  function readPending() {
    return readJson(PENDING_KEY, null);
  }

  function clearPending() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch (e) {}
  }

  function syncPendingFromRecord(record) {
    if (!record) return null;
    var pending = {
      activityId: record.activityId,
      activityName: record.activityName,
      scene: record.scene,
      lines: [],
      cashId: record.id,
      amount: record.amount,
      port: record.port,
      grantedAt: Date.now(),
      claimed: record.status === 'claimed',
      status: record.status
    };
    writeJson(PENDING_KEY, pending);
    return pending;
  }

  /**
   * 用户确认领取（待领取：商户已发放成功，仅用户侧确认收款）
   */
  function claimCash(cashId) {
    var C = CashStore();
    var id = String(cashId || '').trim();
    if (!C || !id) return { ok: false, message: '暂无可领取的红包' };

    var record = C.getById(id);
    if (!record) return { ok: false, message: '红包不存在或已失效' };

    if (record.status === 'claimed') {
      return { ok: false, message: '红包已领取', already: true, record: record };
    }
    if (record.status === 'revoked' || record.status === 'expired') {
      return { ok: false, message: '红包已失效', record: record };
    }
    if (record.status === 'failed') {
      return {
        ok: false,
        message: '您来晚了，红包已经发放完毕',
        late: true,
        record: record
      };
    }
    if (record.status !== 'pending') {
      return { ok: false, message: '当前状态不可领取', record: record };
    }

    var updated = C.updateStatus(id, 'claimed');
    var pending = readPending();
    if (pending && pending.cashId === id) {
      pending.claimed = true;
      pending.status = 'claimed';
      writeJson(PENDING_KEY, pending);
    }
    return { ok: true, message: '红包领取成功', record: updated };
  }

  function claimPendingCash() {
    var pending = readPending();
    if (!pending || !pending.cashId) return null;
    var result = claimCash(pending.cashId);
    return result && result.record ? result.record : null;
  }

  /** 当前用户可见的红包领取记录（按发放时间倒序；不展示发放失败） */
  function listMyCashRecords() {
    var C = CashStore();
    if (!C) return [];
    var session = getSession() || {};
    var phoneDigits = String(session.phone || '').replace(/\D/g, '');
    var masked = phoneDigits.length === 11 ? maskPhone(phoneDigits) : '159****4315';
    var userId = String(session.userId || session.id || '').trim();

    return C.getAll().filter(function (it) {
      if (it.status === 'failed') return false;
      if (userId && it.userId && String(it.userId) === userId) return true;
      return String(it.userPhone || '') === masked;
    });
  }

  function linesWithoutCash(lines) {
    return (lines || []).filter(function (l) {
      return String(l).indexOf('现金红包') < 0;
    });
  }

  function showUaToast(msg) {
    var text = String(msg || '').trim();
    if (!text) return;
    ensureStyle();
    var el = document.getElementById('uaRgToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'uaRgToast';
      el.className = 'ua-rg-toast';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('is-show');
    clearTimeout(showUaToast._t);
    showUaToast._t = setTimeout(function () {
      el.classList.remove('is-show');
    }, 2200);
  }

  function closeRedpackClaimSheet() {
    closeModal('uaRpClaimSheet');
  }

  /** 红包领取页：底部半屏弹窗（待领取可再次打开） */
  function showRedpackClaimSheet(cashId, opts) {
    opts = opts || {};
    ensureStyle();
    closeRedpackClaimSheet();
    var C = CashStore();
    var id = String(cashId || '').trim();
    var record = id && C ? C.getById(id) : null;
    if (record) syncPendingFromRecord(record);

    function sceneText(scene) {
      return C && C.sceneLabel
        ? C.sceneLabel(scene)
        : scene === 'old_first_download'
          ? '老用户下载'
          : '新用户注册';
    }

    var amountHtml = record
      ? escapeHtml(String(record.amount || 0)) + '<em>元</em>'
      : '—<em>元</em>';
    var metaText = record
      ? (record.activityName || '注册有礼') + ' · ' + sceneText(record.scene)
      : '暂无可领取的红包';
    var labelText = '恭喜获得现金红包';
    var btnText = '立即领取';
    var btnDisabled = !record || record.status !== 'pending';
    var doneHidden = true;
    var failHidden = true;

    if (record) {
      if (record.status === 'claimed') {
        labelText = '红包已领取';
        btnText = '已领取';
        doneHidden = false;
      } else if (record.status === 'failed') {
        labelText = '红包发放失败';
        btnText = '无法领取';
        failHidden = false;
      } else if (record.status === 'expired' || record.status === 'revoked') {
        labelText = '红包已失效';
        btnText = '已失效';
      }
    } else {
      btnText = '暂无红包';
    }

    var wrap = document.createElement('div');
    wrap.id = 'uaRpClaimSheet';
    wrap.className = 'ua-rp-sheet';
    wrap.innerHTML =
      '<div class="ua-rp-sheet__mask" data-rp-close></div>' +
      '<div class="ua-rp-sheet__panel" role="dialog" aria-modal="true" aria-label="领取红包">' +
      '<div class="ua-rp-sheet__head">' +
      '<h3 class="ua-rp-sheet__title">领取红包</h3>' +
      '<button type="button" class="ua-rp-sheet__close" data-rp-close aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="ua-rp-card" id="uaRpSheetCard">' +
      '<p class="ua-rp-card__label" id="uaRpSheetLabel">' +
      escapeHtml(labelText) +
      '</p>' +
      '<p class="ua-rp-card__amount" id="uaRpSheetAmount">' +
      amountHtml +
      '</p>' +
      '<p class="ua-rp-card__meta" id="uaRpSheetMeta">' +
      escapeHtml(metaText) +
      '</p>' +
      '<button type="button" class="ua-rp-card__btn" id="uaRpSheetClaimBtn"' +
      (btnDisabled ? ' disabled' : '') +
      '>' +
      escapeHtml(btnText) +
      '</button>' +
      '<p class="ua-rp-card__done" id="uaRpSheetDone"' +
      (doneHidden ? ' hidden' : '') +
      '>已放入微信零钱（演示）</p>' +
      '<p class="ua-rp-card__fail" id="uaRpSheetFail"' +
      (failHidden ? ' hidden' : '') +
      '>您来晚了，红包已经发放完毕</p>' +
      '<a class="ua-rp-card__link" href="redpack-records.html">查看红包领取记录</a>' +
      '</div></div>';

    document.body.appendChild(wrap);

    function paint(rec) {
      var amountEl = document.getElementById('uaRpSheetAmount');
      var metaEl = document.getElementById('uaRpSheetMeta');
      var labelEl = document.getElementById('uaRpSheetLabel');
      var btn = document.getElementById('uaRpSheetClaimBtn');
      var done = document.getElementById('uaRpSheetDone');
      var failEl = document.getElementById('uaRpSheetFail');
      if (!rec) return;
      if (amountEl) amountEl.innerHTML = escapeHtml(String(rec.amount || 0)) + '<em>元</em>';
      if (metaEl) {
        metaEl.textContent = (rec.activityName || '注册有礼') + ' · ' + sceneText(rec.scene);
      }
      if (done) done.hidden = true;
      if (failEl) failEl.hidden = true;
      if (rec.status === 'claimed') {
        if (labelEl) labelEl.textContent = '红包已领取';
        if (btn) {
          btn.disabled = true;
          btn.textContent = '已领取';
        }
        if (done) done.hidden = false;
        return;
      }
      if (rec.status === 'failed') {
        if (labelEl) labelEl.textContent = '红包发放失败';
        if (btn) {
          btn.disabled = true;
          btn.textContent = '无法领取';
        }
        if (failEl) failEl.hidden = false;
        return;
      }
      if (rec.status === 'expired' || rec.status === 'revoked') {
        if (labelEl) labelEl.textContent = '红包已失效';
        if (btn) {
          btn.disabled = true;
          btn.textContent = '已失效';
        }
        return;
      }
      if (labelEl) labelEl.textContent = '恭喜获得现金红包';
      if (btn) {
        btn.disabled = false;
        btn.textContent = '立即领取';
      }
    }

    wrap.addEventListener('click', function (e) {
      if (e.target.getAttribute('data-rp-close') != null) {
        closeRedpackClaimSheet();
        if (typeof opts.onClose === 'function') opts.onClose();
        return;
      }
      if (e.target.closest && e.target.closest('#uaRpSheetClaimBtn')) {
        if (!id) return;
        var result = claimCash(id);
        if (result.ok) {
          showUaToast(result.message || '红包领取成功');
          closeRedpackClaimSheet();
          if (typeof opts.onClaimed === 'function') opts.onClaimed(result.record);
          return;
        }
        if (result.late) {
          paint(result.record || (C && C.getById(id)));
          showUaToast(result.message || '您来晚了，红包已经发放完毕');
          return;
        }
        if (result.already) {
          paint(result.record || (C && C.getById(id)));
          showUaToast(result.message || '红包已领取');
          return;
        }
        showUaToast(result.message || '领取失败');
        if (result.record) paint(result.record);
      }
    });
  }

  /**
   * 去领取红包：仅对待领取（商户已发放）打开用户领取半屏；发放失败直接提示
   */
  function goRedpackClaim(cashId, opts) {
    opts = opts || {};
    var C = CashStore();
    var id = cashId || (readPending() && readPending().cashId) || '';
    if (!id) {
      showUaToast('暂无可领取的红包');
      return false;
    }
    var record = C ? C.getById(id) : null;
    if (!record) {
      showUaToast('红包不存在或已失效');
      return false;
    }
    if (record.status === 'failed') {
      showUaToast('您来晚了，红包已经发放完毕');
      return false;
    }
    if (record.status === 'revoked' || record.status === 'expired') {
      showUaToast('红包已失效');
      return false;
    }
    if (record.status !== 'pending' && record.status !== 'claimed') {
      showUaToast('当前状态不可领取');
      return false;
    }
    showRedpackClaimSheet(id, opts);
    return true;
  }

  function goRedpackRecords() {
    global.location.href = 'redpack-records.html';
  }

  /** 小程序：是否应弹出注册有礼引导 */
  function shouldShowMiniInvite() {
    if (getClientMode() !== 'mini') return false;
    var demo = getDemo();
    var activity = getActiveActivity('mini');
    if (!activity || !activityHasScene(activity, 'new_register')) return false;
    /* 没有 unionID，或 unionID 未绑定手机号 */
    if (!demo.hasUnionId) return true;
    if (!demo.phoneBound) return true;
    return false;
  }

  /** APP：设备未绑定手机号时弹出新用户注册场景奖励 */
  function shouldShowAppInvite() {
    if (getClientMode() !== 'app') return false;
    var demo = getDemo();
    if (demo.deviceBoundPhone) return false;
    var activity = getActiveActivity('app');
    if (!activity || !activityHasScene(activity, 'new_register')) return false;
    return true;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureStyle() {
    if (document.getElementById('uaRgStyle')) return;
    var link = document.createElement('link');
    link.id = 'uaRgStyle';
    link.rel = 'stylesheet';
    link.href = '../css/user-app-register-gift.css';
    document.head.appendChild(link);
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  function showRewardModal(options) {
    options = options || {};
    ensureStyle();
    closeModal('uaRgModal');
    /* 现金红包不在奖励弹窗直接展示，引导点击「去领取红包」 */
    var rawLines = options.lines || [];
    var lines = linesWithoutCash(rawLines);
    var title = options.title || '注册有礼';
    var desc = options.desc || '';
    var primaryText = options.primaryText || '知道了';
    var secondaryText = options.secondaryText || '';
    var cashOnlyHint =
      options.amount > 0
        ? '还有现金红包待领取'
        : rawLines.length && !lines.length
          ? '含现金红包奖励'
          : '';
    var listHtml = lines.length
      ? '<ul class="ua-rg-modal__list">' +
        lines
          .map(function (l) {
            return '<li>' + escapeHtml(l) + '</li>';
          })
          .join('') +
        '</ul>'
      : '<p class="ua-rg-modal__empty">' +
        escapeHtml(cashOnlyHint || '暂无奖励配置') +
        '</p>';

    var wrap = document.createElement('div');
    wrap.id = 'uaRgModal';
    wrap.className = 'ua-rg-modal';
    wrap.innerHTML =
      '<div class="ua-rg-modal__mask" data-rg-close></div>' +
      '<div class="ua-rg-modal__panel" role="dialog" aria-modal="true">' +
      '<h3 class="ua-rg-modal__title">' +
      escapeHtml(title) +
      '</h3>' +
      (desc ? '<p class="ua-rg-modal__desc">' + escapeHtml(desc) + '</p>' : '') +
      listHtml +
      '<div class="ua-rg-modal__actions">' +
      (secondaryText
        ? '<button type="button" class="ua-rg-modal__btn" data-rg-secondary>' +
          escapeHtml(secondaryText) +
          '</button>'
        : '') +
      '<button type="button" class="ua-rg-modal__btn ua-rg-modal__btn--primary" data-rg-primary>' +
      escapeHtml(primaryText) +
      '</button>' +
      '</div></div>';

    document.body.appendChild(wrap);

    wrap.addEventListener('click', function (e) {
      if (e.target.getAttribute('data-rg-close') != null) {
        if (typeof options.onClose === 'function') options.onClose();
        closeModal('uaRgModal');
        return;
      }
      if (e.target.closest('[data-rg-primary]')) {
        closeModal('uaRgModal');
        if (typeof options.onPrimary === 'function') options.onPrimary();
        return;
      }
      if (e.target.closest('[data-rg-secondary]')) {
        closeModal('uaRgModal');
        if (typeof options.onSecondary === 'function') options.onSecondary();
      }
    });
  }

  function goLogin() {
    var next = (global.location.pathname || '').split('/').pop() || 'home.html';
    if (String(next).indexOf('rg=') < 0) {
      next += (next.indexOf('?') >= 0 ? '&' : '?') + 'rg=1';
    }
    global.location.href = 'login.html?next=' + encodeURIComponent(next);
  }

  /** 登录成功后由业务调用：按端发放并发放弹窗 */
  function onAuthSuccess(session) {
    session = session || getSession() || {};
    var mode = getClientMode();
    var demo = getDemo();
    var phone = session.phone || '';

    if (mode === 'mini') {
      var miniAct = getActiveActivity('mini');
      if (!miniAct) return;
      var result = grantRewards({
        activity: miniAct,
        scene: 'new_register',
        phone: phone,
        userName: session.nickname || '用户',
        port: 'mini'
      });
      if (!result.ok && result.already) return;
      if (result.cashFailed) {
        showUaToast('您来晚了，红包已经发放完毕');
      }
      showRewardModal({
        title: '奖励已发放',
        desc: '奖励已发放：',
        lines: result.lines,
        amount: result.amount,
        primaryText: result.amount > 0 ? '去领取红包' : '太棒了',
        onPrimary: function () {
          if (result.amount > 0) goRedpackClaim(result.cashRecord && result.cashRecord.id);
        }
      });
      setDemo({ phoneBound: true, hasUnionId: true });
      return;
    }

    /* APP */
    var appAct = getActiveActivity('app');
    if (!appAct) {
      showRewardModal({
        title: '提示',
        desc: '抱歉，您不是新用户，无法领取新用户注册奖励~',
        lines: [],
        primaryText: '知道了'
      });
      setDemo({ deviceBoundPhone: true });
      return;
    }

    var isNew = demo.isNewUser !== false;
    if (isNew) {
      var newResult = grantRewards({
        activity: appAct,
        scene: 'new_register',
        phone: phone,
        userName: session.nickname || '用户',
        port: 'app'
      });
      if (!newResult.ok && newResult.already) {
        setDemo({ deviceBoundPhone: true });
        return;
      }
      if (newResult.cashFailed) {
        showUaToast('您来晚了，红包已经发放完毕');
      }
      showRewardModal({
        title: '奖励已发放',
        desc: '新用户注册奖励：',
        lines: newResult.ok ? newResult.lines : [],
        amount: newResult.amount,
        primaryText: newResult.amount > 0 ? '去领取红包' : '知道了',
        onPrimary: function () {
          if (newResult.amount > 0) {
            goRedpackClaim(newResult.cashRecord && newResult.cashRecord.id);
          }
        }
      });
    } else if (activityHasScene(appAct, 'old_first_download')) {
      var oldResult = grantRewards({
        activity: appAct,
        scene: 'old_first_download',
        phone: phone,
        userName: session.nickname || '用户',
        port: 'app'
      });
      if (!oldResult.ok && oldResult.already) {
        setDemo({ deviceBoundPhone: true });
        return;
      }
      if (oldResult.cashFailed) {
        showUaToast('您来晚了，红包已经发放完毕');
      }
      showRewardModal({
        title: '老用户下载奖励',
        desc: '您已注册会员触发老用户下载 app 奖励：',
        lines: oldResult.ok ? oldResult.lines : [],
        amount: oldResult.amount,
        primaryText: oldResult.amount > 0 ? '去领取红包' : '知道了',
        onPrimary: function () {
          if (oldResult.amount > 0) {
            goRedpackClaim(oldResult.cashRecord && oldResult.cashRecord.id);
          }
        }
      });
    } else {
      showRewardModal({
        title: '提示',
        desc: '抱歉，您不是新用户，无法领取新用户注册奖励~',
        lines: [],
        primaryText: '知道了'
      });
    }
    setDemo({ deviceBoundPhone: true });
  }

  function isFloatClosedThisLaunch() {
    try {
      return sessionStorage.getItem(FLOAT_CLOSED_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function markFloatClosedThisLaunch() {
    try {
      sessionStorage.setItem(FLOAT_CLOSED_KEY, '1');
    } catch (e) {}
  }

  function clearFloatClosedThisLaunch() {
    try {
      sessionStorage.removeItem(FLOAT_CLOSED_KEY);
    } catch (e) {}
  }

  function renderFloatBar() {
    if (getClientMode() !== 'mini') return;
    if (isFloatClosedThisLaunch()) return;
    ensureStyle();
    var old = document.getElementById('uaRgFloat');
    if (old) old.remove();
    var demo = getDemo();
    var installed = !!demo.appInstalled;
    var bar = document.createElement('div');
    bar.id = 'uaRgFloat';
    bar.className = 'ua-rg-float';
    bar.innerHTML =
      '<div class="ua-rg-float__inner">' +
      '<span class="ua-rg-float__text">' +
      (installed ? '检测到已安装冷丰 APP' : '打开冷丰 APP，体验更完整') +
      '</span>' +
      '<button type="button" class="ua-rg-float__btn" id="uaRgFloatBtn">' +
      (installed ? '打开 APP' : '下载 APP') +
      '</button>' +
      '<button type="button" class="ua-rg-float__close" id="uaRgFloatClose" aria-label="关闭">×</button>' +
      '</div>';
    document.body.appendChild(bar);
    document.getElementById('uaRgFloatBtn').addEventListener('click', function () {
      alert(installed ? '原型演示：已唤起 APP' : '原型演示：跳转应用商店下载 APP');
    });
    document.getElementById('uaRgFloatClose').addEventListener('click', function () {
      markFloatClosedThisLaunch();
      bar.remove();
    });
  }

  function renderDemoPanel() {
    ensureStyle();
    var old = document.getElementById('uaRgDemo');
    if (old) old.remove();
    var mode = getClientMode();
    var demo = getDemo();
    var panel = document.createElement('div');
    panel.id = 'uaRgDemo';
    panel.className = 'ua-rg-demo';
    panel.innerHTML =
      '<div class="ua-rg-demo__title">注册有礼验收开关</div>' +
      '<label class="ua-rg-demo__row">客户端' +
      '<select id="uaRgDemoClient">' +
      '<option value="mini"' +
      (mode === 'mini' ? ' selected' : '') +
      '>小程序</option>' +
      '<option value="app"' +
      (mode === 'app' ? ' selected' : '') +
      '>APP</option></select></label>' +
      (mode === 'mini'
        ? '<label class="ua-rg-demo__row"><input type="checkbox" id="uaRgDemoUnion"' +
          (demo.hasUnionId ? ' checked' : '') +
          '> 有 unionID</label>' +
          '<label class="ua-rg-demo__row"><input type="checkbox" id="uaRgDemoPhoneBound"' +
          (demo.phoneBound ? ' checked' : '') +
          '> unionID 已绑手机</label>' +
          '<label class="ua-rg-demo__row"><input type="checkbox" id="uaRgDemoInstalled"' +
          (demo.appInstalled ? ' checked' : '') +
          '> 已安装 APP</label>'
        : '<label class="ua-rg-demo__row"><input type="checkbox" id="uaRgDemoDeviceBound"' +
          (demo.deviceBoundPhone ? ' checked' : '') +
          '> 设备已绑手机</label>' +
          '<label class="ua-rg-demo__row"><input type="checkbox" id="uaRgDemoIsNew"' +
          (demo.isNewUser !== false ? ' checked' : '') +
          '> 登录后视为新用户</label>') +
      '<label class="ua-rg-demo__row"><input type="checkbox" id="uaRgDemoBalanceFail"' +
      (demo.merchantBalanceInsufficient ? ' checked' : '') +
      '> 发放时商户余额不足</label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaRgDemoApply">应用并刷新引导</button>';

    document.body.appendChild(panel);

    document.getElementById('uaRgDemoApply').addEventListener('click', function () {
      var clientEl = document.getElementById('uaRgDemoClient');
      setClientMode(clientEl.value);
      var balanceFail = !!(document.getElementById('uaRgDemoBalanceFail') || {}).checked;
      if (clientEl.value === 'mini') {
        setDemo({
          hasUnionId: !!(document.getElementById('uaRgDemoUnion') || {}).checked,
          phoneBound: !!(document.getElementById('uaRgDemoPhoneBound') || {}).checked,
          appInstalled: !!(document.getElementById('uaRgDemoInstalled') || {}).checked,
          merchantBalanceInsufficient: balanceFail
        });
      } else {
        setDemo({
          deviceBoundPhone: !!(document.getElementById('uaRgDemoDeviceBound') || {}).checked,
          isNewUser: !!(document.getElementById('uaRgDemoIsNew') || {}).checked,
          merchantBalanceInsufficient: balanceFail
        });
      }
      try {
        localStorage.removeItem(GRANTED_KEY);
      } catch (e) {}
      /* 验收：刷新引导时允许本轮再次展示浮窗 */
      clearFloatClosedThisLaunch();
      bootPage();
    });
  }

  function showMiniInviteIfNeeded() {
    if (!shouldShowMiniInvite()) return;
    var activity = getActiveActivity('mini');
    var reward = getSceneReward(activity, 'new_register');
    var lines = rewardLines(reward);
    showRewardModal({
      title: '注册有礼',
      desc: '登录即可领取以下奖励',
      lines: lines,
      primaryText: '立即登录',
      secondaryText: '稍后再说',
      onPrimary: goLogin
    });
  }

  function showAppInviteIfNeeded() {
    if (!shouldShowAppInvite()) return;
    var activity = getActiveActivity('app');
    var reward = getSceneReward(activity, 'new_register');
    var lines = rewardLines(reward);
    showRewardModal({
      title: '新用户注册',
      desc: '注册登录即可领取以下奖励',
      lines: lines,
      primaryText: '立即登录',
      secondaryText: '稍后再说',
      onPrimary: goLogin
    });
  }

  function consumeAuthFlag() {
    var params = new URLSearchParams(global.location.search || '');
    if (params.get('rg') !== '1' && params.get('rgGrant') !== '1') return false;
    var session = getSession();
    if (!session || !session.loggedIn) return false;
    params.delete('rg');
    params.delete('rgGrant');
    var qs = params.toString();
    var page = (global.location.pathname || '').split('/').pop() || 'home.html';
    try {
      history.replaceState(null, '', page + (qs ? '?' + qs : '') + (global.location.hash || ''));
    } catch (e) {}
    onAuthSuccess(session);
    return true;
  }

  function bootPage() {
    ensureStyle();
    renderDemoPanel();
    if (getClientMode() === 'mini') {
      renderFloatBar();
    } else {
      var float = document.getElementById('uaRgFloat');
      if (float) float.remove();
    }
    if (consumeAuthFlag()) return;
    if (getClientMode() === 'mini') showMiniInviteIfNeeded();
    else showAppInviteIfNeeded();
  }

  function initHome() {
    bootPage();
  }

  global.UaRegisterGift = {
    CLIENT_KEY: CLIENT_KEY,
    getClientMode: getClientMode,
    setClientMode: setClientMode,
    getDemo: getDemo,
    setDemo: setDemo,
    getActiveActivity: getActiveActivity,
    rewardLines: rewardLines,
    grantRewards: grantRewards,
    onAuthSuccess: onAuthSuccess,
    readPending: readPending,
    clearPending: clearPending,
    syncPendingFromRecord: syncPendingFromRecord,
    claimCash: claimCash,
    claimPendingCash: claimPendingCash,
    listMyCashRecords: listMyCashRecords,
    showRedpackClaimSheet: showRedpackClaimSheet,
    shouldShowMiniInvite: shouldShowMiniInvite,
    shouldShowAppInvite: shouldShowAppInvite,
    showRewardModal: showRewardModal,
    goRedpackClaim: goRedpackClaim,
    goRedpackRecords: goRedpackRecords,
    renderFloatBar: renderFloatBar,
    initHome: initHome,
    bootPage: bootPage
  };
})(window);
