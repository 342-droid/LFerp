/**
 * 用户 APP — 会员中心
 * 读取 MDM 会员等级（mdm_member_level_list_v1）与成长值规则（mdm_member_level_growth_rule_v1）
 */
(function () {
  var LEVEL_STORAGE_KEY = 'mdm_member_level_list_v1';
  var RULE_STORAGE_KEY = 'mdm_member_level_growth_rule_v1';

  var MODE_LABEL = {
    total: '累计赠送',
    monthly: '每月赠送',
    daily: '每日赠送'
  };

  var ACTIVITY_META = {
    signin: { label: '签到', href: 'checkin.html' },
    browse: { label: '浏览商品', href: 'restock.html?tab=category' },
    share: { label: '分享', href: '' },
    review: { label: '评价', href: 'orders.html?tab=review' }
  };

  var EARN_LINKS = {
    order: 'home.html',
    signin: 'checkin.html',
    browse: 'restock.html?tab=category',
    review: 'orders.html?tab=review'
  };

  /** 原型演示：当前用户成长值 */
  var CURRENT_USER = {
    name: '宁静致远',
    growthValue: 1485
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
        giftPoints: 0,
        giftCouponMode: 'total',
        giftCoupons: [],
        memberDiscount: 100,
        pointsRatio: 100,
        birthdayEnabled: false,
        birthdayCouponMode: 'total',
        birthdayCoupons: [],
        status: '启用'
      },
      {
        id: 'ML10003',
        name: '银牌会员',
        icon: levelIconSvg('#D7DEE8', '#5B6B7C', '银'),
        growthValue: 2000,
        giftPoints: 100,
        giftPointsDesc: '升级至银牌会员后立即到账 100 积分，可用于积分抵现与积分商城兑换。',
        giftCouponMode: 'total',
        giftCoupons: [
          { coupon: '满50减5券', qty: 2 },
          { coupon: '免运费券', qty: 1 }
        ],
        giftCouponDesc: '累计赠送满50减5券×2、免运费券×1，领取后请在优惠券有效期内使用，过期自动失效。',
        memberDiscount: 95,
        pointsRatio: 120,
        birthdayEnabled: true,
        birthdayCouponMode: 'total',
        birthdayCoupons: [
          { coupon: '生日专属券', qty: 1 },
          { coupon: '免运费券', qty: 1 }
        ],
        birthdayDesc: '生日当月可领取生日专属券×1、免运费券×1，完善生日信息后系统将在生日当天推送提醒。',
        liveEntryEffectEnabled: true,
        liveEntryEffectType: 'banner',
        liveEntryEffectDesc: '进场展示银色欢迎横幅',
        status: '启用'
      },
      {
        id: 'ML10002',
        name: '金牌会员',
        icon: levelIconSvg('#F5D78E', '#8A5A00', '金'),
        growthValue: 5000,
        giftPoints: 200,
        giftCouponMode: 'monthly',
        giftCoupons: [
          { coupon: '满100减15券', qty: 1 },
          { coupon: '满50减5券', qty: 2 }
        ],
        memberDiscount: 90,
        pointsRatio: 150,
        birthdayEnabled: true,
        birthdayCouponMode: 'total',
        birthdayCoupons: [{ coupon: '生日专属券', qty: 2 }],
        liveEntryEffectEnabled: true,
        liveEntryEffectType: 'vehicle',
        liveEntryEffectDesc: '进场展示金牌座驾特效',
        status: '启用'
      },
      {
        id: 'ML10001',
        name: '钻石会员',
        icon: levelIconSvg('#B8D4F8', '#1E4F8C', '钻'),
        growthValue: 10000,
        giftPoints: 500,
        giftCouponMode: 'daily',
        giftCoupons: [
          { coupon: '满200减30券', qty: 1 },
          { coupon: '满100减15券', qty: 1 },
          { coupon: '免运费券', qty: 1 }
        ],
        memberDiscount: 85,
        pointsRatio: 200,
        birthdayEnabled: true,
        birthdayCouponMode: 'total',
        birthdayCoupons: [
          { coupon: '生日专属券', qty: 1 },
          { coupon: '满200减30券', qty: 1 }
        ],
        liveEntryEffectEnabled: true,
        liveEntryEffectType: 'fullscreen',
        liveEntryEffectDesc: '进场展示钻石全屏特效',
        status: '启用'
      }
    ];
  }

  function defaultRule() {
    return {
      validityType: 'rolling',
      validityDays: 365,
      consumeEnabled: true,
      consumeAmount: 1,
      consumeGrowth: 1,
      activityEnabled: false,
      activities: {
        signin: { enabled: true, growth: 5, dailyLimit: 5 },
        browse: { enabled: true, growth: 1, dailyLimit: 10 },
        share: { enabled: false, growth: 20, dailyLimit: 40 },
        review: { enabled: true, growth: 10, dailyLimit: 30 }
      }
    };
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function loadRule() {
    try {
      var raw = localStorage.getItem(RULE_STORAGE_KEY);
      if (!raw) return defaultRule();
      var parsed = JSON.parse(raw);
      var rule = defaultRule();
      if (parsed.validityType) rule.validityType = parsed.validityType;
      if (parsed.validityDays != null) rule.validityDays = Number(parsed.validityDays) || rule.validityDays;
      if (typeof parsed.consumeEnabled === 'boolean') rule.consumeEnabled = parsed.consumeEnabled;
      if (parsed.consumeAmount != null) rule.consumeAmount = Number(parsed.consumeAmount);
      if (parsed.consumeGrowth != null) rule.consumeGrowth = Number(parsed.consumeGrowth);
      if (typeof parsed.activityEnabled === 'boolean') rule.activityEnabled = parsed.activityEnabled;
      if (parsed.activities) {
        Object.keys(rule.activities).forEach(function (key) {
          if (parsed.activities[key]) {
            var src = parsed.activities[key];
            if (typeof src.enabled === 'boolean') rule.activities[key].enabled = src.enabled;
            if (src.growth != null) rule.activities[key].growth = Number(src.growth);
            if (src.dailyLimit != null) rule.activities[key].dailyLimit = Number(src.dailyLimit);
          }
        });
      }
      /* 活跃获成长值待开发：C 端不展示活跃入口 */
      rule.activityEnabled = false;
      return rule;
    } catch (e) {
      return defaultRule();
    }
  }

  function sortLevels(list) {
    return list.slice().sort(function (a, b) {
      if (a.growthValue !== b.growthValue) return a.growthValue - b.growthValue;
      return String(a.name).localeCompare(String(b.name), 'zh-CN');
    });
  }

  function enabledLevels(list) {
    return sortLevels(list.filter(function (item) {
      return item.status !== '禁用';
    }));
  }

  function findCurrentIndex(levels, growth) {
    var idx = 0;
    for (var i = 0; i < levels.length; i++) {
      if (growth >= Number(levels[i].growthValue || 0)) idx = i;
    }
    return idx;
  }

  function formatGrowth(n) {
    var num = Number(n) || 0;
    return num % 1 === 0 ? String(num) : num.toFixed(2);
  }

  function formatCouponList(mode, items) {
    if (!items || !items.length) return '';
    var modeText = MODE_LABEL[mode] || MODE_LABEL.total;
    var detail = items.map(function (it) {
      return it.coupon + '×' + it.qty;
    }).join('、');
    return modeText + '：' + detail;
  }

  function formatDiscount(val) {
    var n = Number(val);
    if (isNaN(n) || n >= 100) return '';
    return (n / 10).toFixed(1).replace(/\.0$/, '') + ' 折';
  }

  function formatRatio(val) {
    var n = Number(val);
    if (isNaN(n)) return '1 倍';
    return (n / 100).toFixed(2).replace(/\.?0+$/, '') + ' 倍';
  }

  function loadUserBirthday() {
    try {
      var raw = localStorage.getItem('ua_member_profile_v1');
      if (!raw) return '';
      var parsed = JSON.parse(raw);
      return parsed && parsed.birthday ? String(parsed.birthday).trim() : '';
    } catch (e) {
      return '';
    }
  }

  function hasBirthdayFilled() {
    return !!loadUserBirthday();
  }

  function buildBenefits(level) {
    var items = [];
    var giftPointsOn = level.giftPointsEnabled == null ? level.giftPoints > 0 : !!level.giftPointsEnabled;
    if (giftPointsOn && level.giftPoints > 0) {
      items.push({
        key: 'points',
        name: '赠送积分',
        desc: (level.giftPointsDesc && String(level.giftPointsDesc).trim()) || (level.giftPoints + ' 分'),
        icon: 'points'
      });
    }
    var giftCouponOn = level.giftCouponEnabled == null
      ? !!(level.giftCoupons && level.giftCoupons.length)
      : !!level.giftCouponEnabled;
    var giftText = formatCouponList(level.giftCouponMode, level.giftCoupons);
    if (giftCouponOn && giftText) {
      items.push({
        key: 'coupon',
        name: '赠送优惠券',
        desc: (level.giftCouponDesc && String(level.giftCouponDesc).trim()) || giftText,
        icon: 'coupon'
      });
    }
    var discountOn = level.memberDiscountEnabled == null
      ? (level.memberDiscount != null && level.memberDiscount < 100)
      : !!level.memberDiscountEnabled;
    var discount = formatDiscount(level.memberDiscount);
    if (discountOn && discount) {
      items.push({
        key: 'discount',
        name: '会员折扣',
        desc: (level.memberDiscountDesc && String(level.memberDiscountDesc).trim()) || discount,
        icon: 'discount'
      });
    }
    var ratioOn = level.pointsRatioEnabled == null
      ? (level.pointsRatio != null && Number(level.pointsRatio) > 100)
      : !!level.pointsRatioEnabled;
    if (ratioOn && level.pointsRatio != null && Number(level.pointsRatio) > 100) {
      items.push({
        key: 'ratio',
        name: '消费积分等级赠送比例',
        desc: (level.pointsRatioDesc && String(level.pointsRatioDesc).trim()) || formatRatio(level.pointsRatio),
        icon: 'ratio'
      });
    }
    if (level.birthdayEnabled) {
      var birthDetail = '';
      if (level.birthdayCoupons && level.birthdayCoupons.length) {
        birthDetail = level.birthdayCoupons.map(function (it) {
          return it.coupon + '×' + it.qty;
        }).join('、');
      }
      items.push({
        key: 'birthday',
        name: '生日送券',
        desc: (level.birthdayDesc && String(level.birthdayDesc).trim()) || birthDetail || '生日月赠送，每年一次',
        icon: 'birthday',
        needBirthday: !hasBirthdayFilled()
      });
    }
    if (level.liveEntryEffectEnabled) {
      var effectLabels = {
        banner: '欢迎横幅',
        vehicle: '进场座驾',
        fullscreen: '全屏特效'
      };
      var effectName = effectLabels[level.liveEntryEffectType] || '欢迎横幅';
      items.push({
        key: 'liveEntry',
        name: '进入直播间特效',
        desc: (level.liveEntryEffectDesc && String(level.liveEntryEffectDesc).trim()) || effectName,
        icon: 'live'
      });
    }
    return items;
  }

  function benefitIconSvg(type) {
    var map = {
      points:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5h5M9.5 13.5h5"/></svg>',
      coupon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z"/><path d="M12 7v10"/></svg>',
      discount:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><path d="M16 8L8 16"/></svg>',
      ratio:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 16l4-8 3 5 2-3 5 6"/><path d="M4 19h16"/></svg>',
      birthday:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v4M8 6l1.5 2M16 6l-1.5 2"/><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M4 14h16"/></svg>',
      live:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8l4 3V9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2l-4 3V8z"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>'
    };
    return map[type] || map.points;
  }

  function profileEditHref() {
    /* 明确来源为会员中心，避免本地预览 pathname 识别失败导致 from 丢失 */
    if (window.UaNav) {
      return window.UaNav.withFrom('profile-edit.html', 'member-center.html');
    }
    return 'profile-edit.html?from=member-center.html';
  }

  function renderBenefitsHtml(benefits) {
    if (!benefits.length) {
      return '<div class="ua-mc-benefits ua-mc-benefits--empty">暂无权益</div>';
    }
    var editHref = profileEditHref();
    var cells = benefits.map(function (b) {
      var tipHtml = '';
      if (b.needBirthday) {
        tipHtml =
          '<div class="ua-mc-benefit-birthday-tip">' +
          '  <span class="ua-mc-benefit-birthday-tip__text">生日未填写无法发放</span>' +
          '  <a class="ua-mc-benefit-birthday-tip__link" href="' + escapeHtml(editHref) + '">去填写</a>' +
          '</div>';
      }
      return (
        '<div class="ua-mc-benefit-item' + (b.needBirthday ? ' ua-mc-benefit-item--need-birthday' : '') + '"' +
        ' data-benefit-key="' + escapeHtml(b.key || '') + '"' +
        ' data-benefit-name="' + escapeHtml(b.name) + '"' +
        ' data-benefit-desc="' + escapeHtml(b.desc) + '"' +
        ' data-need-birthday="' + (b.needBirthday ? '1' : '0') + '">' +
        '  <div class="ua-mc-benefit-icon">' + benefitIconSvg(b.icon) + '</div>' +
        '  <div class="ua-mc-benefit-name">' + escapeHtml(b.name) + '</div>' +
        '  <div class="ua-mc-benefit-desc-row">' +
        '    <div class="ua-mc-benefit-desc">' + escapeHtml(b.desc) + '</div>' +
        '    <span class="ua-mc-benefit-more" hidden aria-hidden="true">' +
        '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>' +
        '    </span>' +
        '  </div>' +
        tipHtml +
        '</div>'
      );
    }).join('');
    return '<div class="ua-mc-benefits"><div class="ua-mc-benefit-grid">' + cells + '</div></div>';
  }

  function ensureBenefitSheet() {
    var sheet = document.getElementById('mcBenefitSheet');
    if (sheet) return sheet;
    sheet = document.createElement('div');
    sheet.id = 'mcBenefitSheet';
    sheet.className = 'ua-mc-sheet';
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="ua-mc-sheet__mask" data-mc-sheet-close></div>' +
      '<div class="ua-mc-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="mcBenefitSheetTitle">' +
      '  <div class="ua-mc-sheet__head">' +
      '    <h3 id="mcBenefitSheetTitle">权益说明</h3>' +
      '    <button type="button" class="ua-mc-sheet__close" data-mc-sheet-close aria-label="关闭">' +
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '    </button>' +
      '  </div>' +
      '  <div class="ua-mc-sheet__body" id="mcBenefitSheetBody"></div>' +
      '</div>';
    var shell = document.querySelector('.ua-mobile-shell') || document.body;
    shell.appendChild(sheet);
    sheet.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-mc-sheet-close]')) closeBenefitSheet();
    });
    return sheet;
  }

  function openBenefitSheet(title, desc, opts) {
    opts = opts || {};
    var sheet = ensureBenefitSheet();
    var titleEl = document.getElementById('mcBenefitSheetTitle');
    var bodyEl = document.getElementById('mcBenefitSheetBody');
    if (titleEl) titleEl.textContent = title || '权益说明';
    if (bodyEl) {
      var html = '<div class="ua-mc-sheet__desc">' + escapeHtml(desc || '') + '</div>';
      if (opts.needBirthday) {
        html +=
          '<div class="ua-mc-sheet__birthday-tip">' +
          '  <p class="ua-mc-sheet__birthday-tip__text">生日未填写无法发放</p>' +
          '  <a class="ua-mc-sheet__birthday-tip__btn" href="' + escapeHtml(profileEditHref()) + '">去填写</a>' +
          '</div>';
      }
      bodyEl.innerHTML = html;
    }
    sheet.hidden = false;
    document.body.classList.add('ua-mc-sheet-open');
  }

  function closeBenefitSheet() {
    var sheet = document.getElementById('mcBenefitSheet');
    if (sheet) sheet.hidden = true;
    document.body.classList.remove('ua-mc-sheet-open');
  }

  function syncBenefitMoreButtons(root) {
    var scope = root || document;
    scope.querySelectorAll('.ua-mc-benefit-item').forEach(function (item) {
      var desc = item.querySelector('.ua-mc-benefit-desc');
      var more = item.querySelector('.ua-mc-benefit-more');
      if (!desc || !more) return;
      var overflow = desc.scrollHeight > desc.clientHeight + 1;
      more.hidden = !overflow;
      item.classList.toggle('has-more', overflow);
      if (overflow) {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', '查看' + (item.getAttribute('data-benefit-name') || '权益') + '完整说明');
      } else {
        item.removeAttribute('role');
        item.removeAttribute('tabindex');
        item.removeAttribute('aria-label');
      }
    });
  }

  function progressPercent(current, from, to) {
    if (to <= from) return current >= from ? 100 : 0;
    var p = ((current - from) / (to - from)) * 100;
    if (p < 0) return 0;
    if (p > 100) return 100;
    return Math.round(p);
  }

  function renderSlide(level, index, levels, currentIdx, growth) {
    var isCurrent = index === currentIdx;
    var isReached = index <= currentIdx;
    var next = levels[index + 1];
    var need = Math.max(0, Number(level.growthValue || 0) - growth);
    var title;
    var sub;

    if (isCurrent) {
      title = '当前等级：' + level.name;
      if (next) {
        sub = '再获取 ' + formatGrowth(next.growthValue - growth) + ' 成长值可升至「' + next.name + '」';
      } else {
        sub = '已达最高等级，继续积累成长值享更多权益';
      }
    } else if (isReached) {
      title = '已解锁：' + level.name;
      sub = '成长值门槛 ' + formatGrowth(level.growthValue);
    } else {
      title = '升至' + level.name + '享受权益';
      sub = need > 0
        ? '获取 ' + formatGrowth(need) + ' 成长值将升至该等级'
        : '成长值门槛 ' + formatGrowth(level.growthValue);
    }

    var navHtml =
      '<div class="ua-mc-slide__navs">' +
      '<button type="button" class="ua-mc-slide__nav" data-go="' + (index - 1) + '"' +
      (index <= 0 ? ' disabled' : '') + '>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>上一级' +
      '</button>' +
      '<button type="button" class="ua-mc-slide__nav" data-go="' + (index + 1) + '"' +
      (index >= levels.length - 1 ? ' disabled' : '') + '>' +
      '下一级<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>' +
      '</button>' +
      '</div>';

    var from = Number(level.growthValue || 0);
    var to = next ? Number(next.growthValue || 0) : from;
    var pct = next ? progressPercent(growth, from, to) : (isReached ? 100 : 0);
    var leftLabel = formatGrowth(from) + ' / ' + escapeHtml(level.name);
    var rightLabel = next
      ? formatGrowth(to) + ' / ' + escapeHtml(next.name)
      : '满级';

    var progressHtml =
      '<div class="ua-mc-progress">' +
      '  <div class="ua-mc-progress__labels"><span>' + leftLabel + '</span><span><strong>' +
      formatGrowth(growth) + '</strong></span><span>' + rightLabel + '</span></div>' +
      '  <div class="ua-mc-progress__bar"><div class="ua-mc-progress__fill" style="width:' + pct + '%"></div></div>' +
      '</div>';

    var iconSrc = level.icon
      ? String(level.icon)
      : levelIconSvg('#E8ECF0', '#6B7280', (level.name || '会').charAt(0));

    return (
      '<article class="ua-mc-slide" data-index="' + index + '">' +
      '  <div class="ua-mc-slide__head">' +
      '    <div class="ua-mc-slide__icon-wrap">' +
      '      <img class="ua-mc-slide__icon" src="' + escapeHtml(iconSrc) + '" alt="' + escapeHtml(level.name || '会员等级') + '">' +
      '    </div>' +
      '    <div class="ua-mc-slide__info">' +
      '      <div class="ua-mc-slide__title">' + escapeHtml(title) + '</div>' +
      '      <div class="ua-mc-slide__sub">' + escapeHtml(sub) + '</div>' +
      '    </div>' +
      navHtml +
      '  </div>' +
      progressHtml +
      renderBenefitsHtml(buildBenefits(level)) +
      '</article>'
    );
  }

  function buildEarnItems(rule) {
    var items = [];
    if (rule.consumeEnabled) {
      items.push({
        key: 'order',
        title: '下单',
        desc: '每支付 ' + formatGrowth(rule.consumeAmount) + ' 元获得 ' +
          formatGrowth(rule.consumeGrowth) + ' 成长值；订单售后成功会按照获取时的比例进行扣除。',
        href: EARN_LINKS.order
      });
    }
    if (rule.activityEnabled && rule.activities) {
      Object.keys(ACTIVITY_META).forEach(function (key) {
        var conf = rule.activities[key];
        var meta = ACTIVITY_META[key];
        if (!conf || !conf.enabled || !meta) return;
        items.push({
          key: key,
          title: meta.label,
          desc: '每次可获得 ' + formatGrowth(conf.growth) + ' 成长值' +
            (conf.dailyLimit > 0 ? '，单日上限 ' + formatGrowth(conf.dailyLimit) + ' 成长值。' : '。'),
          href: meta.href || ''
        });
      });
    }
    return items;
  }

  function renderEarnList(rule) {
    var list = document.getElementById('mcRuleList');
    if (!list) return;
    var items = buildEarnItems(rule);
    if (!items.length) {
      list.innerHTML = '<div class="ua-mc-empty">暂无获取成长值方式</div>';
      return;
    }
    list.innerHTML = items.map(function (it) {
      var arrow =
        '<span class="ua-mc-rule-item__arrow" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>' +
        '</span>';
      if (it.href) {
        var href = window.UaNav ? window.UaNav.withFrom(it.href) : it.href;
        return (
          '<a class="ua-mc-rule-item ua-mc-rule-item--link" href="' + escapeHtml(href) + '">' +
          '  <div class="ua-mc-rule-item__body">' +
          '    <div class="ua-mc-rule-item__title">' + escapeHtml(it.title) + '</div>' +
          '    <div class="ua-mc-rule-item__desc">' + escapeHtml(it.desc) + '</div>' +
          '  </div>' + arrow +
          '</a>'
        );
      }
      return (
        '<div class="ua-mc-rule-item">' +
        '  <div class="ua-mc-rule-item__body">' +
        '    <div class="ua-mc-rule-item__title">' + escapeHtml(it.title) + '</div>' +
        '    <div class="ua-mc-rule-item__desc">' + escapeHtml(it.desc) + '</div>' +
        '  </div>' +
        '</div>'
      );
    }).join('');
  }

  function renderLevelDesc(levels, currentIdx, rule) {
    var box = document.getElementById('mcLevelDesc');
    if (!box) return;
    var html = '';

    if (!levels.length) {
      html += '<div class="ua-mc-empty">暂无会员等级</div>';
    } else {
      html += levels.map(function (level, i) {
        var min = Number(level.growthValue || 0);
        var next = levels[i + 1];
        var rangeText = next
          ? formatGrowth(min) + ' &lt;= 成长值 &lt; ' + formatGrowth(next.growthValue)
          : '成长值 &gt;= ' + formatGrowth(min);
        var cls = i === currentIdx ? 'ua-mc-level-row is-current' : 'ua-mc-level-row';
        var iconSrc = level.icon
          ? String(level.icon)
          : levelIconSvg('#E8ECF0', '#6B7280', (level.name || '会').charAt(0));
        return (
          '<div class="' + cls + '">' +
          '<img class="ua-mc-level-row__icon" src="' + escapeHtml(iconSrc) + '" alt="">' +
          '<span class="ua-mc-level-row__name">' + escapeHtml(level.name) + '</span>：' + rangeText +
          '</div>'
        );
      }).join('');
    }

    var validityDesc = rule.validityType === 'permanent'
      ? '成长值永久有效，不会因时间过期失效。'
      : '成长值自获取之日起滚动 ' + formatGrowth(rule.validityDays) + ' 天内有效，过期后自动失效。';

    html +=
      '<div class="ua-mc-level-extra">' +
      '  <div class="ua-mc-level-extra__item">' +
      '    <div class="ua-mc-level-extra__title">成长值有效期</div>' +
      '    <div class="ua-mc-level-extra__desc">' + escapeHtml(validityDesc) + '</div>' +
      '  </div>' +
      '  <div class="ua-mc-level-extra__item">' +
      '    <div class="ua-mc-level-extra__title">升降级说明</div>' +
      '    <div class="ua-mc-level-extra__desc">当前成长值达到某等级门槛后立即升级；若成长值低于当前等级门槛，将于每日统一降级处理。</div>' +
      '  </div>' +
      '</div>';

    box.innerHTML = html;
  }

  function currentSlideIndex(carousel) {
    return Number(carousel.getAttribute('data-index') || 0) || 0;
  }

  function updateDots(activeIndex) {
    var dots = document.getElementById('mcDots');
    if (!dots) return;
    var nodes = dots.querySelectorAll('.ua-mc-dot');
    nodes.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === activeIndex);
    });
  }

  function syncCarouselHeight(carousel) {
    if (!carousel) return;
    var slides = carousel.querySelectorAll('.ua-mc-slide');
    if (!slides.length) return;
    var idx = currentSlideIndex(carousel);
    var slide = slides[idx];
    if (!slide) return;
    carousel.style.height = slide.offsetHeight + 'px';
  }

  function setTrackOffset(track, carousel, index, dragPx) {
    var width = carousel.clientWidth || 1;
    var base = -index * width;
    var x = base + (dragPx || 0);
    track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
  }

  function goToIndex(carousel, index, animate) {
    if (!carousel) return;
    var track = carousel.querySelector('.ua-mc-carousel__track');
    var slides = carousel.querySelectorAll('.ua-mc-slide');
    if (!track || !slides.length) return;
    var i = Math.max(0, Math.min(index, slides.length - 1));
    carousel.setAttribute('data-index', String(i));
    if (animate === false) {
      track.style.transition = 'none';
    } else {
      track.style.transition = '';
    }
    setTrackOffset(track, carousel, i, 0);
    updateDots(i);
    syncCarouselHeight(carousel);
    syncBenefitMoreButtons(carousel);
    if (animate === false) {
      // force reflow then restore transition
      void track.offsetHeight;
      track.style.transition = '';
    }
  }

  function bindCarouselSwipe(carousel) {
    var track = carousel.querySelector('.ua-mc-carousel__track');
    if (!track) return;

    var drag = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      dx: 0,
      dy: 0,
      axis: null,
      moved: false
    };

    function onPointerDown(ev) {
      if (ev.button != null && ev.button !== 0) return;
      if (ev.target.closest && ev.target.closest('button, a, .ua-mc-benefit-item.has-more')) return;
      drag.active = true;
      drag.pointerId = ev.pointerId;
      drag.startX = ev.clientX;
      drag.startY = ev.clientY;
      drag.dx = 0;
      drag.dy = 0;
      drag.axis = null;
      drag.moved = false;
      carousel.classList.add('is-dragging');
      track.style.transition = 'none';
      try { carousel.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    }

    function onPointerMove(ev) {
      if (!drag.active || (drag.pointerId != null && ev.pointerId !== drag.pointerId)) return;
      drag.dx = ev.clientX - drag.startX;
      drag.dy = ev.clientY - drag.startY;
      if (!drag.axis) {
        if (Math.abs(drag.dx) < 6 && Math.abs(drag.dy) < 6) return;
        drag.axis = Math.abs(drag.dx) > Math.abs(drag.dy) ? 'x' : 'y';
        if (drag.axis === 'y') {
          drag.active = false;
          carousel.classList.remove('is-dragging');
          track.style.transition = '';
          setTrackOffset(track, carousel, currentSlideIndex(carousel), 0);
          try { carousel.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
          return;
        }
      }
      if (drag.axis !== 'x') return;
      ev.preventDefault();
      drag.moved = true;
      var idx = currentSlideIndex(carousel);
      var max = carousel.querySelectorAll('.ua-mc-slide').length - 1;
      var resist = 1;
      if ((idx <= 0 && drag.dx > 0) || (idx >= max && drag.dx < 0)) resist = 0.35;
      setTrackOffset(track, carousel, idx, drag.dx * resist);
    }

    function onPointerUp(ev) {
      if (!drag.active || (drag.pointerId != null && ev.pointerId !== drag.pointerId)) return;
      drag.active = false;
      carousel.classList.remove('is-dragging');
      track.style.transition = '';
      try { carousel.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }

      var idx = currentSlideIndex(carousel);
      var width = carousel.clientWidth || 1;
      var threshold = Math.min(72, width * 0.18);
      var next = idx;
      if (drag.moved && Math.abs(drag.dx) >= threshold) {
        next = drag.dx < 0 ? idx + 1 : idx - 1;
      }
      goToIndex(carousel, next, true);
      drag.moved = false;
      drag.axis = null;
    }

    carousel.addEventListener('pointerdown', onPointerDown);
    carousel.addEventListener('pointermove', onPointerMove, { passive: false });
    carousel.addEventListener('pointerup', onPointerUp);
    carousel.addEventListener('pointercancel', onPointerUp);
  }

  function init() {
    var levels = enabledLevels(loadLevels());
    var rule = loadRule();
    var growth = CURRENT_USER.growthValue;
    var currentIdx = findCurrentIndex(levels, growth);
    var currentLevel = levels[currentIdx] || null;

    var nameEl = document.getElementById('mcUserName');
    var levelEl = document.getElementById('mcUserLevel');
    var growthEl = document.getElementById('mcGrowthValue');
    if (nameEl) nameEl.textContent = CURRENT_USER.name;
    if (levelEl) levelEl.textContent = currentLevel ? currentLevel.name : '暂无等级';
    if (growthEl) growthEl.textContent = formatGrowth(growth);

    var carousel = document.getElementById('mcCarousel');
    var dots = document.getElementById('mcDots');
    if (carousel) {
      if (!levels.length) {
        carousel.innerHTML =
          '<div class="ua-mc-carousel__track" id="mcTrack">' +
          '<div class="ua-mc-slide"><div class="ua-mc-empty">暂无会员等级</div></div>' +
          '</div>';
      } else {
        carousel.innerHTML =
          '<div class="ua-mc-carousel__track" id="mcTrack">' +
          levels.map(function (level, i) {
            return renderSlide(level, i, levels, currentIdx, growth);
          }).join('') +
          '</div>';
      }
    }
    if (dots) {
      dots.innerHTML = levels.map(function (_, i) {
        return '<span class="ua-mc-dot' + (i === currentIdx ? ' is-active' : '') + '"></span>';
      }).join('');
    }

    renderEarnList(rule);
    renderLevelDesc(levels, currentIdx, rule);

    if (carousel && levels.length) {
      carousel.setAttribute('data-index', String(currentIdx));
      bindCarouselSwipe(carousel);

      requestAnimationFrame(function () {
        goToIndex(carousel, currentIdx, false);
        syncBenefitMoreButtons(carousel);
      });

      carousel.addEventListener('click', function (ev) {
        /* 「去填写」走链接跳转，不打开权益弹窗 */
        if (ev.target.closest('.ua-mc-benefit-birthday-tip__link')) return;

        var benefitItem = ev.target.closest('.ua-mc-benefit-item.has-more, .ua-mc-benefit-item--need-birthday');
        if (benefitItem) {
          if (ev.target.closest('a')) return;
          ev.preventDefault();
          ev.stopPropagation();
          openBenefitSheet(
            benefitItem.getAttribute('data-benefit-name') || '权益说明',
            benefitItem.getAttribute('data-benefit-desc') || '',
            { needBirthday: benefitItem.getAttribute('data-need-birthday') === '1' }
          );
          return;
        }
        var btn = ev.target.closest('[data-go]');
        if (!btn || btn.disabled) return;
        var idx = Number(btn.getAttribute('data-go'));
        if (!isNaN(idx)) goToIndex(carousel, idx, true);
      });

      window.addEventListener('resize', function () {
        goToIndex(carousel, currentSlideIndex(carousel), false);
        syncBenefitMoreButtons(carousel);
      });
    }

    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-mc-nav__back', 'profile.html');
      var growthPill = document.getElementById('mcGrowthPill');
      if (growthPill) {
        growthPill.setAttribute(
          'href',
          window.UaNav.withFrom(growthPill.getAttribute('href') || 'growth-detail.html')
        );
      }
      var ruleLink = document.getElementById('mcRuleLink');
      if (ruleLink) {
        ruleLink.setAttribute(
          'href',
          window.UaNav.withFrom(ruleLink.getAttribute('href') || 'growth-rule-desc.html')
        );
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
