/**
 * 用户 APP — 账号注销状态（与 B 端 mdm_member_cancel_list_v1 联动）
 *
 * 业务规则：
 * 1. 注销成功后自动退出登录
 * 2. 已注销手机号可再次注册成为新用户（原会员档案保留为「注销」）
 */
(function (global) {
  var STORAGE_KEY = 'ua_account_cancel_v1';
  var B_LIST_KEY = 'mdm_member_cancel_list_v1';
  var MEMBER_LIST_KEY = 'mdm_member_c_list_v1';
  var SESSION_KEY = 'ua_user_session_v1';
  var PROFILE_KEY = 'ua_member_profile_v1';
  var ACTIVE_MEMBER_KEY = 'ua_active_member_id_v1';
  var RELEASED_PHONES_KEY = 'ua_cancel_released_phones_v1';
  var DEFAULT_MEMBER_ID = 'UC10001';

  function formatNow() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : String(n); }
    return (
      d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    );
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '');
  }

  function getActiveMemberId() {
    try {
      return localStorage.getItem(ACTIVE_MEMBER_KEY) || DEFAULT_MEMBER_ID;
    } catch (e) {
      return DEFAULT_MEMBER_ID;
    }
  }

  function setActiveMemberId(id) {
    try {
      localStorage.setItem(ACTIVE_MEMBER_KEY, String(id || DEFAULT_MEMBER_ID));
    } catch (e) { /* ignore */ }
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { memberId: getActiveMemberId(), status: 'none' };
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return { memberId: getActiveMemberId(), status: 'none' };
      return data;
    } catch (e) {
      return { memberId: getActiveMemberId(), status: 'none' };
    }
  }

  function write(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
    } catch (e) { /* ignore */ }
  }

  function getStatus() {
    return String((read().status || 'none')).toLowerCase();
  }

  function isPending() {
    return getStatus() === 'pending';
  }

  function isCanceled() {
    return getStatus() === 'canceled';
  }

  function isRejected() {
    return getStatus() === 'rejected';
  }

  /** 最近一次审核驳回原因（B 端审核备注） */
  function getRejectReason() {
    var data = read();
    if (!isRejected()) return '';
    return String(data.adminRemark || data.rejectReason || '').trim();
  }

  function loadReleasedPhones() {
    try {
      var raw = localStorage.getItem(RELEASED_PHONES_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function markPhoneReleased(phone) {
    var digits = normalizePhone(phone);
    if (!digits) return;
    var list = loadReleasedPhones();
    var exists = false;
    for (var i = 0; i < list.length; i++) {
      if (normalizePhone(list[i] && list[i].phone) === digits) {
        list[i].releasedAt = formatNow();
        exists = true;
        break;
      }
    }
    if (!exists) {
      list.push({ phone: digits, releasedAt: formatNow() });
    }
    try {
      localStorage.setItem(RELEASED_PHONES_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function isPhoneReleased(phone) {
    var digits = normalizePhone(phone);
    if (!digits) return false;
    var list = loadReleasedPhones();
    for (var i = 0; i < list.length; i++) {
      if (normalizePhone(list[i] && list[i].phone) === digits) return true;
    }
    return false;
  }

  /**
   * 开发注解（确认注销前置校验）：
   * 需查询当前用户没有「交易中」商城订单，且没有「售后中」的商城售后单，才可提交注销申请。
   */
  function getDemoBlockers() {
    try {
      return {
        tradingOrders: localStorage.getItem('ua_cancel_demo_orders') === '1',
        aftersaleIng: localStorage.getItem('ua_cancel_demo_aftersale') === '1'
      };
    } catch (e) {
      return { tradingOrders: false, aftersaleIng: false };
    }
  }

  function checkCanCancel() {
    var blockers = getDemoBlockers();
    if (blockers.tradingOrders) {
      return { ok: false, message: '抱歉，您有交易中的商城订单，请完成后再注销' };
    }
    if (blockers.aftersaleIng) {
      return { ok: false, message: '抱歉，您有售后中的商城售后单，请处理完成后再注销' };
    }
    return { ok: true, message: '' };
  }

  function syncToBList(payload) {
    var item = {
      id: payload.memberId || getActiveMemberId(),
      nickname: payload.nickname || '宁静致远',
      phone: payload.phone || '155****9061',
      registerTime: payload.registerTime || '2025-06-18 12:00:00',
      channel: payload.channel || '微信小程序',
      platform: payload.platform || 'H5',
      status: payload.status === 'pending' ? '审核中'
        : payload.status === 'canceled' ? '已注销'
          : payload.status === 'rejected' ? '已驳回' : '审核中',
      remark: payload.adminRemark || '',
      reason: payload.reason || '',
      applyTime: payload.applyTime || formatNow(),
      cancelTime: payload.cancelTime || ''
    };
    try {
      var raw = localStorage.getItem(B_LIST_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      var found = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === item.id) {
          list[i] = Object.assign({}, list[i], item);
          found = true;
          break;
        }
      }
      if (!found) list.unshift(item);
      localStorage.setItem(B_LIST_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }

    try {
      var mRaw = localStorage.getItem(MEMBER_LIST_KEY);
      if (!mRaw) return;
      var members = JSON.parse(mRaw);
      if (!Array.isArray(members)) return;
      var mapStatus = item.status === '已注销' ? '注销'
        : item.status === '审核中' ? '注销中'
          : item.status === '已驳回' ? '正常' : '正常';
      for (var j = 0; j < members.length; j++) {
        if (members[j] && members[j].id === item.id) {
          members[j].status = mapStatus;
          break;
        }
      }
      localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(members));
    } catch (e2) { /* ignore */ }
  }

  function submitCancel(reason, profile) {
    profile = profile || {};
    var memberId = getActiveMemberId();
    var data = Object.assign({}, read(), {
      memberId: memberId,
      status: 'pending',
      reason: String(reason || '').trim(),
      applyTime: formatNow(),
      cancelTime: '',
      nickname: profile.nickname || '宁静致远',
      phone: profile.displayPhone || profile.phone || '155****9061',
      channel: '微信小程序',
      platform: 'H5',
      registerTime: '2025-06-18 12:00:00',
      adminRemark: '',
      rejectReason: ''
    });
    write(data);
    syncToBList(data);
    return data;
  }

  function revokeCancel() {
    var data = Object.assign({}, read(), {
      status: 'none',
      reason: '',
      applyTime: '',
      cancelTime: '',
      adminRemark: '',
      rejectReason: '',
      revokedAt: formatNow()
    });
    write(data);
    syncToBList(Object.assign({}, data, { status: 'rejected', adminRemark: '用户主动撤回注销申请' }));
    try {
      var mRaw = localStorage.getItem(MEMBER_LIST_KEY);
      if (mRaw) {
        var members = JSON.parse(mRaw);
        var mid = getActiveMemberId();
        if (Array.isArray(members)) {
          for (var i = 0; i < members.length; i++) {
            if (members[i] && members[i].id === mid) {
              members[i].status = '正常';
              break;
            }
          }
          localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(members));
        }
      }
    } catch (e) { /* ignore */ }
    return data;
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* ignore */ }
  }

  function clearProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (e) { /* ignore */ }
  }

  /**
   * 注销成功收尾：释放手机号 → 清登录态 → 清注销阻断 → 跳转登录
   * 开发注解：注销成功后自动退出登录；该手机号可再次注册成为新用户。
   */
  function finalizeCancelSuccess(options) {
    options = options || {};
    var data = read();
    var phone = data.phone || options.phone || '';
    markPhoneReleased(phone);

    /* 确保 B 端会员状态为注销 */
    syncToBList(Object.assign({}, data, {
      status: 'canceled',
      cancelTime: data.cancelTime || formatNow(),
      adminRemark: data.adminRemark || options.remark || ''
    }));

    write({
      memberId: data.memberId || getActiveMemberId(),
      status: 'none',
      lastCanceledPhone: normalizePhone(phone),
      lastCanceledAt: formatNow(),
      phoneReleased: true
    });

    clearSession();
    clearProfile();

    if (options.redirect === false) return;

    var loginUrl = 'login.html?cancelSuccess=1&force=1';
    try {
      global.location.replace(loginUrl);
    } catch (e) {
      global.location.href = loginUrl;
    }
  }

  /** 生成新会员 ID（原注销账号保留，再注册走新 ID） */
  function createNewMemberId() {
    return 'UC' + String(Date.now()).slice(-8);
  }

  /**
   * 已注销手机号再次登录/注册：创建全新会员，不复用已注销档案
   */
  function reRegisterWithPhone(phone, nickname) {
    var digits = normalizePhone(phone);
    var newId = createNewMemberId();
    setActiveMemberId(newId);

    var nick = nickname || '冷丰用户';
    var profile = {
      nickname: nick,
      displayPhone: digits || phone,
      birthday: '',
      district: '',
      avatar: '../assets/profile-avatar.svg'
    };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) { /* ignore */ }

    try {
      var raw = localStorage.getItem(MEMBER_LIST_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      list.unshift({
        id: newId,
        nickname: nick,
        avatarText: String(nick).charAt(0) || '会',
        phone: digits || phone,
        phoneMasked: digits && digits.length >= 7
          ? digits.slice(0, 3) + '****' + digits.slice(-4)
          : phone,
      gender: '保密',
      isMember: '是',
        level: '普通会员',
        tags: 'C端再注册',
        source: '微信小程序',
        bindMethod: '手机',
        channelCount: '1',
        points: '0',
        satisMinutes: '0',
        satisFeedback: '0',
        growthScore: '0',
        amount: '0.00',
        orderCount: '0',
        lastConsume: '—',
        status: '正常',
        birthday: '',
        district: '',
        reregisteredFrom: read().memberId || DEFAULT_MEMBER_ID,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(list));
    } catch (e2) { /* ignore */ }

    write({
      memberId: newId,
      status: 'none',
      phoneReleased: false,
      reregisteredAt: formatNow()
    });

    return { memberId: newId, profile: profile };
  }

  function showToast(msg) {
    var el = document.getElementById('uaCancelToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'uaCancelToast';
      el.className = 'ua-login-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.remove('is-show');
    }, 2200);
  }

  function showPendingLoginModal(onContact) {
    var old = document.getElementById('uaCancelPendingModal');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'uaCancelPendingModal';
    wrap.className = 'ua-cancel-modal';
    wrap.innerHTML =
      '<div class="ua-cancel-modal__mask"></div>' +
      '<div class="ua-cancel-modal__panel" role="dialog" aria-modal="true">' +
      '<p class="ua-cancel-modal__text">账号注销审核中，暂无法登录使用。如有疑问请联系客服。</p>' +
      '<div class="ua-cancel-modal__actions">' +
      '<button type="button" class="ua-cancel-modal__btn" data-act="close">我知道了</button>' +
      '<button type="button" class="ua-cancel-modal__btn ua-cancel-modal__btn--primary" data-act="cs">联系客服</button>' +
      '</div></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'cs' && typeof onContact === 'function') onContact();
      wrap.remove();
    });
  }

  global.UaAccountCancel = {
    DEFAULT_MEMBER_ID: DEFAULT_MEMBER_ID,
    getActiveMemberId: getActiveMemberId,
    setActiveMemberId: setActiveMemberId,
    read: read,
    write: write,
    getStatus: getStatus,
    isPending: isPending,
    isCanceled: isCanceled,
    isRejected: isRejected,
    getRejectReason: getRejectReason,
    checkCanCancel: checkCanCancel,
    getDemoBlockers: getDemoBlockers,
    submitCancel: submitCancel,
    revokeCancel: revokeCancel,
    finalizeCancelSuccess: finalizeCancelSuccess,
    reRegisterWithPhone: reRegisterWithPhone,
    markPhoneReleased: markPhoneReleased,
    isPhoneReleased: isPhoneReleased,
    loadReleasedPhones: loadReleasedPhones,
    showToast: showToast,
    showPendingLoginModal: showPendingLoginModal,
    syncToBList: syncToBList
  };
})(window);
