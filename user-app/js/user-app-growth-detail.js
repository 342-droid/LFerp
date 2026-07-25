/**
 * 用户 APP — 我的成长值（明细 + 按月筛选）
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

  var SUB_LABEL = {
    order_complete: '订单完成',
    aftersale_complete: '售后完成',
    signin: '每日签到',
    browse: '浏览商品',
    share: '分享邀请',
    review: '评价订单',
    manual_add: '手工增加',
    manual_sub: '手工减少'
  };

  /** 当前用户成长值明细（原型演示） */
  var DETAIL_LIST = [
    { id: '1', title: '站内活跃', sub: 'signin', type: 'activity', change: 10, date: '2026-07-21' },
    { id: '2', title: '购物消费', sub: 'order_complete', type: 'consume', change: 86, date: '2026-07-18' },
    { id: '3', title: '站内活跃', sub: 'browse', type: 'activity', change: 1, date: '2026-07-16' },
    { id: '4', title: '站内活跃', sub: 'review', type: 'activity', change: 10, date: '2026-07-12' },
    { id: '5', title: '购物消费', sub: 'order_complete', type: 'consume', change: 129, date: '2026-06-28' },
    { id: '6', title: '站内活跃', sub: 'signin', type: 'activity', change: 5, date: '2026-06-20' },
    { id: '7', title: '购物消费', sub: 'aftersale_complete', type: 'consume', change: -30, date: '2026-06-15' },
    { id: '8', title: '站内活跃', sub: 'signin', type: 'activity', change: 5, date: '2026-05-08' }
  ];

  var state = {
    year: 2026,
    month: 7,
    panelOpen: false
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

  function parseMonthKey(key) {
    var p = String(key).split('-');
    return { year: Number(p[0]), month: Number(p[1]) };
  }

  function collectMonths() {
    var map = {};
    DETAIL_LIST.forEach(function (it) {
      var key = String(it.date).slice(0, 7);
      map[key] = true;
    });
    var nowKey = monthKey(state.year, state.month);
    map[nowKey] = true;
    return Object.keys(map).sort().reverse();
  }

  function filterByMonth(year, month) {
    var prefix = monthKey(year, month);
    return DETAIL_LIST.filter(function (it) {
      return String(it.date).slice(0, 7) === prefix;
    }).sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function renderMonthLabel() {
    var el = document.getElementById('gdMonthLabel');
    if (el) el.textContent = state.year + '年' + state.month + '月';
  }

  function renderMonthPanel() {
    var panel = document.getElementById('gdMonthPanel');
    if (!panel) return;
    var months = collectMonths();
    var active = monthKey(state.year, state.month);
    panel.innerHTML = months.map(function (key) {
      var m = parseMonthKey(key);
      var label = m.year + '年' + m.month + '月';
      var cls = key === active ? 'ua-gd-month__option is-active' : 'ua-gd-month__option';
      return '<button type="button" class="' + cls + '" data-month="' + key + '">' + label + '</button>';
    }).join('');
  }

  function setPanelOpen(open) {
    state.panelOpen = !!open;
    var panel = document.getElementById('gdMonthPanel');
    var trigger = document.getElementById('gdMonthTrigger');
    if (panel) panel.hidden = !state.panelOpen;
    if (trigger) trigger.setAttribute('aria-expanded', state.panelOpen ? 'true' : 'false');
  }

  function renderList() {
    var list = document.getElementById('gdList');
    var end = document.getElementById('gdEnd');
    if (!list) return;
    var rows = filterByMonth(state.year, state.month);
    if (!rows.length) {
      list.innerHTML = '<div class="ua-gd-empty">本月暂无成长值明细</div>';
      if (end) end.hidden = true;
      return;
    }
    list.innerHTML = rows.map(function (it) {
      var change = Number(it.change) || 0;
      var changeText = (change > 0 ? '+' : '') + change;
      var changeCls = change < 0 ? 'ua-gd-item__change is-minus' : 'ua-gd-item__change';
      var subHint = SUB_LABEL[it.sub] ? ' · ' + SUB_LABEL[it.sub] : '';
      return (
        '<article class="ua-gd-item">' +
        '  <div class="ua-gd-item__meta">' +
        '    <div class="ua-gd-item__title">' + itemTitle(it) + subHint + '</div>' +
        '    <div class="ua-gd-item__date">' + formatDotDate(it.date) + '</div>' +
        '  </div>' +
        '  <div class="' + changeCls + '">' + changeText + '</div>' +
        '</article>'
      );
    }).join('');
    if (end) end.hidden = false;
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

    renderMonthLabel();
    renderMonthPanel();
    renderList();

    var trigger = document.getElementById('gdMonthTrigger');
    var panel = document.getElementById('gdMonthPanel');
    var wrap = document.getElementById('gdMonthWrap');

    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        setPanelOpen(!state.panelOpen);
      });
    }
    if (panel) {
      panel.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-month]');
        if (!btn) return;
        var m = parseMonthKey(btn.getAttribute('data-month'));
        state.year = m.year;
        state.month = m.month;
        renderMonthLabel();
        renderMonthPanel();
        renderList();
        setPanelOpen(false);
      });
    }
    document.addEventListener('click', function (e) {
      if (!state.panelOpen) return;
      if (wrap && wrap.contains(e.target)) return;
      setPanelOpen(false);
    });

    var infoBtn = document.getElementById('gdInfoBtn');
    var tipEl = document.getElementById('gdInfoTip');
    var titleWrap = document.getElementById('gdDetailTitle');
    if (tipEl) {
      if (rule.validityType === 'permanent') {
        tipEl.textContent = '成长值永久有效，失效的成长值将不再明细中展示。';
      } else {
        tipEl.textContent =
          '成长值有效期为获取后' + (rule.validityDays || 365) + '天，失效的成长值将不再明细中展示。';
      }
    }
    if (infoBtn && titleWrap) {
      infoBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        titleWrap.classList.toggle('is-tip-open');
      });
      document.addEventListener('click', function (e) {
        if (!titleWrap.contains(e.target)) titleWrap.classList.remove('is-tip-open');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
