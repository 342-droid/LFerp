/**
 * 用户 APP — 积分明细
 * 顶部默认展示：当前 / 可用 / 冻结
 * 筛选：年/月二级联动下拉 + 积分类型
 */
(function () {
  var TYPE_LABEL = {
    '': '全部类型',
    consume: '消费赠送',
    upgrade: '会员升级',
    checkin: '签到',
    luckybag: '福袋',
    watch_task: '观看任务',
    exchange: '积分兑换',
    exchange_cancel: '积分兑换取消',
    cash: '积分抵现',
    exchange_refund: '积分兑换售后',
    cash_refund: '积分抵现售后'
  };

  var SUMMARY = {
    current:
      (window.UAProfile && window.UAProfile.DEMO_POINTS_CURRENT != null
        ? Number(window.UAProfile.DEMO_POINTS_CURRENT)
        : 206) || 206,
    available: 161,
    frozen: 45
  };

  /** 当前用户积分明细（原型演示） */
  var DETAIL_LIST = [
    {
      id: '1',
      type: 'consume',
      change: 45,
      date: '2026-07-26',
      status: '冻结',
      expireAt: '2027-07-26',
      remark: '支付成功赠送，待交易成功'
    },
    {
      id: '2',
      type: 'consume',
      change: 86,
      date: '2026-04-25',
      status: '可用',
      expireAt: '2027-04-25',
      remark: '订单交易成功'
    },
    {
      id: '3',
      type: 'cash',
      change: -60,
      date: '2026-04-25',
      status: '',
      expireAt: '',
      remark: '积分抵现'
    },
    {
      id: '3b',
      type: 'exchange_cancel',
      change: 80,
      date: '2026-04-24',
      status: '可用',
      expireAt: '2027-01-02',
      remark: '待支付订单取消，退回兑换积分'
    },
    {
      id: '4',
      type: 'consume',
      change: 50,
      date: '2026-04-20',
      status: '可用',
      expireAt: '2027-04-20',
      remark: '订单交易成功'
    },
    {
      id: '5',
      type: 'checkin',
      change: 5,
      date: '2026-04-18',
      status: '可用',
      expireAt: '2027-04-18',
      remark: '每日签到'
    },
    {
      id: '6',
      type: 'consume',
      change: 80,
      date: '2026-04-10',
      status: '可用',
      expireAt: '2027-04-10',
      remark: '订单交易成功'
    },
    {
      id: '7',
      type: 'cash_refund',
      change: 30,
      date: '2026-02-15',
      status: '',
      expireAt: '',
      remark: '积分抵现售后'
    },
    {
      id: '8',
      type: 'cash',
      change: -60,
      date: '2026-02-01',
      status: '',
      expireAt: '',
      remark: '积分抵现'
    },
    {
      id: '9',
      type: 'consume',
      change: 100,
      date: '2025-03-10',
      status: '过期',
      expireAt: '2026-03-10',
      remark: '历史消费赠送'
    },
    {
      id: '10',
      type: 'luckybag',
      change: 20,
      date: '2025-12-20',
      status: '可用',
      expireAt: '2026-12-20',
      remark: '直播福袋'
    },
    {
      id: '11',
      type: 'upgrade',
      change: 50,
      date: '2025-11-01',
      status: '可用',
      expireAt: '2026-11-01',
      remark: '会员升级奖励'
    },
    {
      id: '12',
      type: 'watch_task',
      change: 15,
      date: '2025-08-08',
      status: '过期',
      expireAt: '2026-08-08',
      remark: '观看任务'
    }
  ];

  var state = {
    year: 2026,
    month: 0, /* 0 = 全年 */
    type: ''
  };

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDotDate(iso) {
    var p = String(iso).split('-');
    if (p.length < 3) return iso;
    return p[0] + '.' + p[1] + '.' + p[2];
  }

  function monthKey(year, month) {
    return year + '-' + pad(month);
  }

  /** 年 -> 可用月份列表（二级联动数据源） */
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
      if (state.type && it.type !== state.type) return false;
      return true;
    }).sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function renderSummary() {
    var c = document.getElementById('pdCurrent');
    var a = document.getElementById('pdAvailable');
    var f = document.getElementById('pdFrozen');
    if (c) c.textContent = String(SUMMARY.current);
    if (a) a.textContent = String(SUMMARY.available);
    if (f) f.textContent = String(SUMMARY.frozen);
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
      document.getElementById('pdYearSelect'),
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
    /* 切换年份后：若当前非全年且该月不存在，回退到全年 */
    if (state.month > 0 && months.indexOf(state.month) < 0) {
      state.month = 0;
    }
    fillSelect(document.getElementById('pdMonthSelect'), options, state.month);
  }

  function renderTypeSelect() {
    fillSelect(
      document.getElementById('pdTypeSelect'),
      Object.keys(TYPE_LABEL).map(function (key) {
        return { value: key, label: TYPE_LABEL[key] };
      }),
      state.type
    );
  }

  function statusClass(status) {
    if (status === '可用') return 'ua-pd-item__status ua-pd-item__status--available';
    if (status === '冻结') return 'ua-pd-item__status ua-pd-item__status--frozen';
    if (status === '过期') return 'ua-pd-item__status ua-pd-item__status--expired';
    return '';
  }

  function renderList() {
    var list = document.getElementById('pdList');
    var end = document.getElementById('pdEnd');
    if (!list) return;
    var rows = getFiltered();
    if (!rows.length) {
      list.innerHTML =
        '<div class="ua-gd-empty">' +
        (state.month > 0 ? '本月' : '本年') +
        '暂无积分明细</div>';
      if (end) end.hidden = true;
      return;
    }
    list.innerHTML = rows
      .map(function (it) {
        var change = Number(it.change) || 0;
        var changeText = (change > 0 ? '+' : '') + change;
        var changeCls = change < 0 ? 'ua-gd-item__change is-minus' : 'ua-gd-item__change';
        var statusHtml = it.status
          ? '<span class="' + statusClass(it.status) + '">' + it.status + '</span>'
          : '';
        var expireHtml = it.expireAt
          ? '<div class="ua-pd-item__expire">过期 ' + formatDotDate(it.expireAt) + '</div>'
          : '';
        return (
          '<article class="ua-gd-item">' +
          '  <div class="ua-gd-item__meta">' +
          '    <div class="ua-gd-item__title">' +
          (TYPE_LABEL[it.type] || it.type) +
          '</div>' +
          '    <div class="ua-gd-item__date">' +
          formatDotDate(it.date) +
          '</div>' +
          expireHtml +
          '  </div>' +
          '  <div class="ua-pd-item__right">' +
          '    <div class="' +
          changeCls +
          '">' +
          changeText +
          '</div>' +
          statusHtml +
          '  </div>' +
          '</article>'
        );
      })
      .join('');
    if (end) end.hidden = false;
  }

  function refreshFiltersAndList(keepMonth) {
    var yearMonthMap = buildYearMonthMap();
    renderYearSelect(yearMonthMap);
    if (!keepMonth) {
      /* 切换年份时默认看全年，月份选项按该年联动 */
      state.month = 0;
    }
    renderMonthSelect(yearMonthMap);
    renderTypeSelect();
    renderList();
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

  function init() {
    if (window.UaNav) {
      /* 商城开启时从商城进入明细，返回商城；否则返回个人中心 */
      window.UaNav.applyBackLink(
        '.ua-gd-nav__back',
        isPointsMallEnabled() ? 'points-mall.html' : 'profile.html'
      );
    }

    renderSummary();
    refreshFiltersAndList(true);

    var yearSel = document.getElementById('pdYearSelect');
    var monthSel = document.getElementById('pdMonthSelect');
    var typeSel = document.getElementById('pdTypeSelect');

    if (yearSel) {
      yearSel.addEventListener('change', function () {
        state.year = Number(yearSel.value) || state.year;
        refreshFiltersAndList(false);
      });
    }
    if (monthSel) {
      monthSel.addEventListener('change', function () {
        state.month = Number(monthSel.value) || state.month;
        renderList();
      });
    }
    if (typeSel) {
      typeSel.addEventListener('change', function () {
        state.type = typeSel.value || '';
        renderList();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
