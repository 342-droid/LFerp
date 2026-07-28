/**
 * 用户 APP — 会员资料本地存储（个人中心 / 编辑页共用）
 * 个人中心等级角标读取 MDM 会员等级（mdm_member_level_list_v1）
 */
(function (global) {
  var STORAGE_KEY = 'ua_member_profile_v1';
  var LEVEL_STORAGE_KEY = 'mdm_member_level_list_v1';
  /** 同步到 B 端会员管理的列表存储 */
  var MEMBER_LIST_KEY = 'mdm_member_c_list_v1';
  /** C 端演示会员固定 ID，便于 B 端识别与更新 */
  var C_MEMBER_ID = 'UC10001';
  /** 与会员中心演示成长值保持一致 */
  var DEMO_GROWTH = 1485;
  /** 与积分明细页「当前积分」保持一致（可用+冻结） */
  var DEMO_POINTS_CURRENT = 206;

  var DEFAULT_PROFILE = {
    nickname: '宁静致远',
    displayPhone: '15589069061',
    birthday: '',
    district: '',
    avatar: '../assets/profile-avatar.svg'
  };

  function levelIconSvg(bg, fg, label) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">' +
      '<rect width="72" height="72" rx="14" fill="' + bg + '"/>' +
      '<text x="36" y="42" text-anchor="middle" font-size="22" font-weight="700" fill="' + fg + '" ' +
      'font-family="PingFang SC,Microsoft YaHei,sans-serif">' + label + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function defaultLevels() {
    return [
      {
        id: 'ML10004',
        name: '普通会员',
        icon: levelIconSvg('#E8ECF0', '#6B7280', '普'),
        growthValue: 0,
        status: '启用'
      },
      {
        id: 'ML10003',
        name: '银牌会员',
        icon: levelIconSvg('#D7DEE8', '#5B6B7C', '银'),
        growthValue: 2000,
        status: '启用'
      },
      {
        id: 'ML10002',
        name: '金牌会员',
        icon: levelIconSvg('#F5D78E', '#8A5A00', '金'),
        growthValue: 5000,
        status: '启用'
      },
      {
        id: 'ML10001',
        name: '钻石会员',
        icon: levelIconSvg('#B8D4F8', '#1E4F8C', '钻'),
        growthValue: 10000,
        status: '启用'
      }
    ];
  }

  function loadLevels() {
    try {
      var raw = localStorage.getItem(LEVEL_STORAGE_KEY);
      if (!raw) return defaultLevels();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return defaultLevels();
      return parsed;
    } catch (e) {
      return defaultLevels();
    }
  }

  function resolveCurrentLevel(growth) {
    var levels = loadLevels()
      .filter(function (item) {
        return item && item.status !== '禁用';
      })
      .slice()
      .sort(function (a, b) {
        if (a.growthValue !== b.growthValue) return a.growthValue - b.growthValue;
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
      });
    if (!levels.length) {
      return { name: '普通会员', icon: levelIconSvg('#E8ECF0', '#6B7280', '普') };
    }
    var current = levels[0];
    for (var i = 0; i < levels.length; i++) {
      if (growth >= Number(levels[i].growthValue || 0)) current = levels[i];
    }
    var icon = current.icon
      ? String(current.icon)
      : levelIconSvg('#E8ECF0', '#6B7280', String(current.name || '会').charAt(0));
    return { name: current.name || '普通会员', icon: icon };
  }

  function maskPhone(phone) {
    var s = String(phone || '').replace(/\D/g, '');
    if (s.length < 7) return phone || '';
    return s.slice(0, 3) + '****' + s.slice(-4);
  }

  function loadProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_PROFILE);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_PROFILE, parsed || {});
    } catch (e) {
      return Object.assign({}, DEFAULT_PROFILE);
    }
  }

  /** 清空演示会员 UC10001 的生日（C 端资料 + B 端会员列表） */
  function clearDemoMemberBirthday() {
    try {
      var profile = loadProfile();
      profile.birthday = '';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

      var list = loadMemberList();
      var changed = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === C_MEMBER_ID) {
          list[i].birthday = '';
          changed = true;
        }
      }
      if (changed) saveMemberList(list);
      else syncProfileToMemberList(profile);
    } catch (e) { /* ignore */ }
  }

  /* 按需清空：打开任一引用本脚本的页面时执行一次 */
  (function clearBirthdayOnce() {
    var FLAG = 'ua_uc10001_birthday_cleared_20260725b';
    try {
      if (localStorage.getItem(FLAG) === '1') return;
      clearDemoMemberBirthday();
      localStorage.setItem(FLAG, '1');
    } catch (e) { /* ignore */ }
  })();

  function loadMemberList() {
    try {
      var raw = localStorage.getItem(MEMBER_LIST_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveMemberList(list) {
    localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(list || []));
  }

  function profileToMemberRecord(profile) {
    var level = resolveCurrentLevel(DEMO_GROWTH);
    var nick = profile.nickname || DEFAULT_PROFILE.nickname;
    var phone = profile.displayPhone || DEFAULT_PROFILE.displayPhone;
    return {
      id: C_MEMBER_ID,
      nickname: nick,
      avatarText: String(nick).charAt(0) || '会',
      phone: phone,
      phoneMasked: maskPhone(phone),
      gender: '未知',
      isMember: '是',
      level: level.name,
      tags: 'C端注册',
      source: '微信小程序',
      bindMethod: '手机',
      channelCount: '1',
      points: String(DEMO_POINTS_CURRENT),
      satisMinutes: '0',
      satisFeedback: '0',
      growthScore: String(DEMO_GROWTH),
      growthTotal: String(DEMO_GROWTH),
      amount: '0.00',
      orderCount: '0',
      lastConsume: '—',
      status: '正常',
      birthday: profile.birthday || '',
      district: profile.district || '',
      avatar: profile.avatar || DEFAULT_PROFILE.avatar,
      updatedAt: new Date().toISOString()
    };
  }

  function syncProfileToMemberList(profile) {
    var list = loadMemberList();
    var rec = profileToMemberRecord(profile);
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === C_MEMBER_ID) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      list[idx] = Object.assign({}, list[idx], rec);
    } else {
      list.unshift(rec);
    }
    saveMemberList(list);
    return rec;
  }

  function saveProfile(data) {
    var next = Object.assign({}, DEFAULT_PROFILE, data || {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    /* 同步到 B 端会员管理，便于列表展示与详情读取 */
    try {
      syncProfileToMemberList(next);
    } catch (e) { /* ignore */ }
    return next;
  }

  function applyLevelBadge() {
    var nameEl = document.getElementById('uaProfileLevelName');
    var iconEl = document.getElementById('uaProfileLevelIcon');
    if (!nameEl && !iconEl) return;
    var level = resolveCurrentLevel(DEMO_GROWTH);
    if (nameEl) nameEl.textContent = level.name;
    if (iconEl) {
      iconEl.src = level.icon;
      iconEl.alt = level.name;
      iconEl.hidden = !level.icon;
    }
    var vipText = document.querySelector('.ua-vip-card__head-right span');
    if (vipText) vipText.textContent = '您当前会员等级：' + level.name;
  }

  function isPointsMallEnabled() {
    try {
      var raw = localStorage.getItem('mdm_member_points_rule_v1');
      if (!raw) return true;
      var parsed = JSON.parse(raw);
      if (parsed.enabled === false) return false;
      if (parsed.exchange && parsed.exchange.enabled === false) return false;
      return true;
    } catch (e) {
      return true;
    }
  }

  function applyProfileToPage(profile) {
    var nameEl = document.getElementById('uaProfileName');
    var phoneEl = document.getElementById('uaProfilePhone');
    var avatarEl = document.getElementById('uaProfileAvatar');
    var pointsEl = document.getElementById('uaProfilePoints');
    var pointsLink = document.getElementById('uaProfilePointsLink');
    if (nameEl) nameEl.textContent = profile.nickname || DEFAULT_PROFILE.nickname;
    if (phoneEl) phoneEl.textContent = maskPhone(profile.displayPhone || DEFAULT_PROFILE.displayPhone);
    if (avatarEl && profile.avatar) avatarEl.src = profile.avatar;
    /* 我的积分：展示当前积分（可用+冻结） */
    if (pointsEl) pointsEl.textContent = String(DEMO_POINTS_CURRENT);
    /* 开启积分商城 → 进商城；关闭 → 直接进积分明细 */
    if (pointsLink) {
      var target = isPointsMallEnabled() ? 'points-mall.html' : 'points-detail.html';
      pointsLink.href =
        window.UaNav && window.UaNav.withFrom ? window.UaNav.withFrom(target) : target;
      pointsLink.setAttribute(
        'aria-label',
        isPointsMallEnabled() ? '我的积分，进入积分商城' : '我的积分，查看明细'
      );
    }
    applyLevelBadge();
  }

  global.UAProfile = {
    STORAGE_KEY: STORAGE_KEY,
    MEMBER_LIST_KEY: MEMBER_LIST_KEY,
    C_MEMBER_ID: C_MEMBER_ID,
    DEFAULT_PROFILE: DEFAULT_PROFILE,
    DEMO_POINTS_CURRENT: DEMO_POINTS_CURRENT,
    maskPhone: maskPhone,
    load: loadProfile,
    save: saveProfile,
    applyToPage: applyProfileToPage,
    resolveCurrentLevel: resolveCurrentLevel,
    loadMemberList: loadMemberList,
    syncProfileToMemberList: syncProfileToMemberList,
    clearDemoMemberBirthday: clearDemoMemberBirthday
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (
      document.getElementById('uaProfileName') ||
      document.getElementById('uaProfileAvatar') ||
      document.getElementById('uaProfileLevel')
    ) {
      applyProfileToPage(loadProfile());
    }
  });
})(window);
