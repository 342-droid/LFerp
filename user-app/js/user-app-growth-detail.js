/**
 * 用户 APP — 我的成长值（明细 + 年/月二级筛选，最大支持按年）
 */
(function () {
  var RULE_STORAGE_KEY = 'mdm_member_level_growth_rule_v1';

  var CURRENT_USER = {
    growthValue: 1485
  };

  var TYPE_LABEL = {
    consume: '购物消费',
    activity: '站内活跃',
    manual: '手工调整'
  };

  /* 与 js/mdm-member-growth-acquire.js 保持一致：支付完成 / 交易完成 / 售后完成 */
  var SUB_LABEL = (window.MdmMemberGrowthAcquire && window.MdmMemberGrowthAcquire.SUB_LABEL) || {
    payment_complete: '支付完成',
    trade_complete: '交易完成',
    aftersale_complete: '售后完成',
    order_complete: '交易完成',
    signin: '每日签到',
    browse: '浏览商品',
    share: '分享邀请',
    review: '评价订单',
    manual_add: '手工增加',
    manual_sub: '手工减少'
  };

  /** 当前用户成长值明细（原型演示） */
  var DETAIL_LIST = [
    { id: '1', title: '站内活跃', sub: 'signin', type: 'activity', change: 10, date: '2026-07-21', status: '有效' },
    { id: '2', title: '购物消费', sub: 'payment_complete', type: 'consume', change: 86, date: '2026-07-18', status: '有效' },
    { id: '3', title: '站内活跃', sub: 'browse', type: 'activity', change: 1, date: '2026-07-16', status: '有效' },
    { id: '4', title: '站内活跃', sub: 'review', type: 'activity', change: 10, date: '2026-07-12', status: '有效' },
    { id: '5', title: '购物消费', sub: 'trade_complete', type: 'consume', change: 129, date: '2026-06-28', status: '有效' },
    { id: '6', title: '站内活跃', sub: 'signin', type: 'activity', change: 5, date: '2026-06-20', status: '有效' },
    { id: '7', title: '购物消费', sub: 'aftersale_complete', type: 'consume', change: -30, date: '2026-06-15', status: '有效' },
    { id: '8', title: '站内活跃', sub: 'signin', type: 'activity', change: 5, date: '2026-05-08', status: '有效' },
    { id: '9', title: '购物消费', sub: 'payment_complete', type: 'consume', change: 58, date: '2025-12-18', status: '过期' },
    { id: '10', title: '站内活跃', sub: 'signin', type: 'activity', change: 5, date: '2025-11-02', status: '过期' },
    { id: '11', title: '站内活跃', sub: 'share', type: 'activity', change: 20, date: '2025-08-20', status: '过期' }
  ];

  var state = {
    year: 2026,
    month: 0 /* 0 = 全年，最大按年筛选 */
  };

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDotDate(iso) {
    var p = String(iso).split('-');
    if (p.length < 3) return iso;
    return p[0] + '.' + p[1] + '.' + p[2];
  }

  function loadRule() {
    try {
      var raw = localStorage.getItem(RULE_STORAGE_KEY);
      if (!raw) return { validityType: 'rolling', validityDays: 365 };
      var parsed = JSON.parse(raw);
      return {
        validityType: parsed.validityType || 'rolling',
        validityDays: Number(parsed.validityDays) || 365
      };
    } catch (e) {
      return { validityType: 'rolling', validityDays: 365 };
    }
  }

  function computeValidRange(rule) {
    if (rule.validityType === 'permanent') return '永久有效';
    var end = new Date(2026, 6, 16);
    var start = new Date(end);
    start.setDate(start.getDate() - (rule.validityDays || 365) + 1);
    return (
      start.getFullYear() + '.' + pad(start.getMonth() + 1) + '.' + pad(start.getDate()) +
      '-' +
      end.getFullYear() + '.' + pad(end.getMonth() + 1) + '.' + pad(end.getDate())
    );
  }

  function itemTitle(item) {
    if (item.title) return item.title;
    if (item.type === 'activity') return TYPE_LABEL.activity;
    return TYPE_LABEL[item.type] || SUB_LABEL[item.sub] || '成长值变动';
  }

  function monthKey(year, month) {
    return year + '-' + pad(month);
  }

  /** 年 -> 可用月份列表（二级联动） */
  function buildYearMonthMap() {
    var map = {};
    DETAIL_LIST.forEach(function (it) {
      var y = String(it.date).slice(0, 4);
      var m = Number(String(it.date).slice(5, 7));
      if (!map[y]) map[y] = {};
      map[y][m] = true;
    });
    var cy = String(state.year);
    if (!map[cy]) map[cy] = {};
    if (state.month > 0) map[cy][state.month] = true;
    Object.keys(map).forEach(function (y) {
      map[y] = Object.keys(map[y])
        .map(Number)
        .sort(function (a, b) {
          return b - a;
        });
    });
    return map;
  }

  function getFiltered() {
    return DETAIL_LIST.filter(function (it) {
      var date = String(it.date);
      if (date.slice(0, 4) !== String(state.year)) return false;
      if (state.month > 0 && date.slice(0, 7) !== monthKey(state.year, state.month)) return false;
      return true;
    }).sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function fillSelect(sel, options, selected) {
    if (!sel) return;
    sel.innerHTML = options
      .map(function (opt) {
        var selectedAttr = String(opt.value) === String(selected) ? ' selected' : '';
        return (
          '<option value="' +
          opt.value +
          '"' +
          selectedAttr +
          '>' +
          opt.label +
          '</option>'
        );
      })
      .join('');
  }

  function renderYearSelect(yearMonthMap) {
    var years = Object.keys(yearMonthMap).sort().reverse();
    if (years.indexOf(String(state.year)) < 0) {
      state.year = Number(years[0]) || state.year;
    }
    fillSelect(
      document.getElementById('gdYearSelect'),
      years.map(function (y) {
        return { value: y, label: y + '年' };
      }),
      state.year
    );
  }

  function renderMonthSelect(yearMonthMap) {
    var months = yearMonthMap[String(state.year)] || [];
    var options = [{ value: 0, label: '全年' }].concat(
      months.map(function (m) {
        return { value: m, label: m + '月' };
      })
    );
    if (state.month > 0 && months.indexOf(state.month) < 0) {
      state.month = 0;
    }
    fillSelect(document.getElementById('gdMonthSelect'), options, state.month);
  }

  function statusClass(status) {
    if (status === '有效') return 'ua-gd-item__status ua-gd-item__status--valid';
    if (status === '过期') return 'ua-gd-item__status ua-gd-item__status--expired';
    return 'ua-gd-item__status';
  }

  function renderList() {
    var list = document.getElementById('gdList');
    var end = document.getElementById('gdEnd');
    if (!list) return;
    var rows = getFiltered();
    if (!rows.length) {
      list.innerHTML =
        '<div class="ua-gd-empty">' +
        (state.month > 0 ? '本月' : '本年') +
        '暂无成长值明细</div>';
      if (end) end.hidden = true;
      return;
    }
    list.innerHTML = rows.map(function (it) {
      var change = Number(it.change) || 0;
      var changeText = (change > 0 ? '+' : '') + change;
      var changeCls = change < 0 ? 'ua-gd-item__change is-minus' : 'ua-gd-item__change';
      var subHint = '';
      if (window.MdmMemberGrowthAcquire && typeof window.MdmMemberGrowthAcquire.labelOf === 'function') {
        var subText = window.MdmMemberGrowthAcquire.labelOf(it.sub);
        if (subText && subText !== '—') subHint = ' · ' + subText;
      } else if (SUB_LABEL[it.sub]) {
        subHint = ' · ' + SUB_LABEL[it.sub];
      }
      var statusText = it.status || '有效';
      return (
        '<article class="ua-gd-item">' +
        '  <div class="ua-gd-item__meta">' +
        '    <div class="ua-gd-item__title">' + itemTitle(it) + subHint + '</div>' +
        '    <div class="ua-gd-item__date">' + formatDotDate(it.date) + '</div>' +
        '  </div>' +
        '  <div class="ua-gd-item__right">' +
        '    <div class="' + changeCls + '">' + changeText + '</div>' +
        '    <span class="' + statusClass(statusText) + '">' + statusText + '</span>' +
        '  </div>' +
        '</article>'
      );
    }).join('');
    if (end) end.hidden = false;
  }

  function refreshFiltersAndList(keepMonth) {
    var yearMonthMap = buildYearMonthMap();
    renderYearSelect(yearMonthMap);
    if (!keepMonth) {
      state.month = 0;
    }
    renderMonthSelect(yearMonthMap);
    renderList();
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-gd-nav__back', 'member-center.html');
      var ruleLink = document.querySelector('.ua-gd-summary__rule');
      if (ruleLink) {
        ruleLink.setAttribute(
          'href',
          window.UaNav.withFrom(ruleLink.getAttribute('href') || 'growth-rule-desc.html')
        );
      }
    }
    var rule = loadRule();
    var totalEl = document.getElementById('gdTotalValue');
    var rangeEl = document.getElementById('gdValidRange');
    if (totalEl) totalEl.textContent = String(CURRENT_USER.growthValue);
    if (rangeEl) rangeEl.textContent = computeValidRange(rule);

    refreshFiltersAndList(true);

    var yearSel = document.getElementById('gdYearSelect');
    var monthSel = document.getElementById('gdMonthSelect');
    if (yearSel) {
      yearSel.addEventListener('change', function () {
        state.year = Number(yearSel.value) || state.year;
        refreshFiltersAndList(false);
      });
    }
    if (monthSel) {
      monthSel.addEventListener('change', function () {
        state.month = Number(monthSel.value) || 0;
        renderList();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
