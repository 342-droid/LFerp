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
        giftCouponMode: 'total',
        giftCoupons: [
          { coupon: '满50减5券', qty: 2 },
          { coupon: '免运费券', qty: 1 }
        ],
        memberDiscount: 95,
        pointsRatio: 120,
        birthdayEnabled: true,
        birthdayCouponMode: 'total',
        birthdayCoupons: [
          { coupon: '生日专属券', qty: 1 },
          { coupon: '免运费券', qty: 1 }
        ],
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
        birthdayCouponMode: 'monthly',
        birthdayCoupons: [
          { coupon: '生日专属券', qty: 1 },
          { coupon: '满200减30券', qty: 1 }
        ],
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
      activityEnabled: true,
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
      ? (level.pointsRatio != null && Number(level.pointsRatio) !== 100)
      : !!level.pointsRatioEnabled;
    if (ratioOn && level.pointsRatio != null) {
      items.push({
        key: 'ratio',
        name: '积分倍率',
        desc: (level.pointsRatioDesc && String(level.pointsRatioDesc).trim()) || formatRatio(level.pointsRatio),
        icon: 'ratio'
      });
    }
    if (level.birthdayEnabled) {
      var birthText = formatCouponList(level.birthdayCouponMode, level.birthdayCoupons);
      items.push({
        key: 'birthday',
        name: '生日特权',
        desc: (level.birthdayDesc && String(level.birthdayDesc).trim()) || birthText || '生日送券',
        icon: 'birthday'
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
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v4M8 6l1.5 2M16 6l-1.5 2"/><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M4 14h16"/></svg>'
    };
    return map[type] || map.points;
  }

  function renderBenefitsHtml(benefits) {
    if (!benefits.length) {
      return '<div class="ua-mc-benefits ua-mc-benefits--empty">暂无权益</div>';
    }
    var cells = benefits.map(function (b) {
      return (
        '<div class="ua-mc-benefit-item">' +
        '  <div class="ua-mc-benefit-icon">' + benefitIconSvg(b.icon) + '</div>' +
        '  <div class="ua-mc-benefit-name">' + escapeHtml(b.name) + '</div>' +
        '  <div class="ua-mc-benefit-desc">' + escapeHtml(b.desc) + '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="ua-mc-benefits"><div class="ua-mc-benefit-grid">' + cells + '</div></div>';
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

    return (
      '<article class="ua-mc-slide" data-index="' + index + '">' +
      '  <div class="ua-mc-slide__head">' +
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
        return (
          '<a class="ua-mc-rule-item ua-mc-rule-item--link" href="' + escapeHtml(it.href) + '">' +
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
        return (
          '<div class="' + cls + '">' +
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
      if (ev.target.closest && ev.target.closest('button, a')) return;
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
      });

      carousel.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-go]');
        if (!btn || btn.disabled) return;
        var idx = Number(btn.getAttribute('data-go'));
        if (!isNaN(idx)) goToIndex(carousel, idx, true);
      });

      window.addEventListener('resize', function () {
        goToIndex(carousel, currentSlideIndex(carousel), false);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
