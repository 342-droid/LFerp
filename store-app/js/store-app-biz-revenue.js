/**
 * 丰银宝 · 营业额下级（按业务线）
 * 已有：直播、商城；未来：POS（堂食／外卖／团购核销）
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' }
  };

  var RANGE_LABEL = {
    today: '今日',
    yesterday: '昨天',
    '7d': '近七天',
    month: '本月',
    custom: '自定义'
  };

  function $(id) {
    return document.getElementById(id);
  }

  function D() {
    return window.StoreAppBizReportData;
  }

  function money(n) {
    return D() && D().money ? D().money(n) : Number(n || 0).toFixed(2);
  }

  function groupThousands(intPart) {
    return String(intPart).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fmt(n) {
    var v = Number(n) || 0;
    if (Math.abs(v - Math.round(v)) < 0.005) {
      return groupThousands(String(Math.round(v)));
    }
    var fixed = money(v);
    var parts = fixed.split('.');
    return groupThousands(parts[0]) + '.' + (parts[1] || '00');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    var el = $('rvToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1800);
  }

  function parseQuery() {
    var q = {};
    (location.search || '')
      .replace(/^\?/, '')
      .split('&')
      .forEach(function (pair) {
        if (!pair) return;
        var p = pair.split('=');
        q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    var allowed = { today: 1, yesterday: 1, '7d': 1, month: 1, custom: 1 };
    if (q.range && allowed[q.range]) state.range = q.range;
    if (q.start) state.custom.start = q.start;
    if (q.end) state.custom.end = q.end;
    if (state.range === 'custom' && (!state.custom.start || !state.custom.end)) {
      state.range = 'today';
    }
  }

  function syncChips() {
    var root = $('rvRange');
    if (!root) return;
    root.querySelectorAll('[data-range]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-range') === state.range);
    });
    if ($('rvRangeTag')) {
      $('rvRangeTag').textContent =
        state.range === 'custom' && state.custom.start
          ? state.custom.start + ' ~ ' + state.custom.end
          : RANGE_LABEL[state.range] || '今日';
    }
  }

  function openCustomSheet() {
    var sheet = $('rvTimeSheet');
    var today = (D() && D().DEMO_TODAY) || '';
    if ($('rvCustomStart')) $('rvCustomStart').value = state.custom.start || today;
    if ($('rvCustomEnd')) $('rvCustomEnd').value = state.custom.end || today;
    if ($('rvCustomErr')) {
      $('rvCustomErr').hidden = true;
      $('rvCustomErr').textContent = '';
    }
    if (sheet) sheet.hidden = false;
  }

  function closeCustomSheet() {
    var sheet = $('rvTimeSheet');
    if (sheet) sheet.hidden = true;
  }

  function renderLine(line) {
    var isComing = line.status === 'coming';
    var amountHtml = isComing
      ? '<span class="sa-rpt-bizline__soon">暂未获取</span>'
      : '<strong class="sa-rpt-bizline__amt">' + fmt(line.paid) + '</strong>';
    var metaHtml = isComing
      ? '<div class="sa-rpt-bizline__meta">' + esc(line.tip || '即将开通') + '</div>'
      : '<div class="sa-rpt-bizline__meta">' +
        (line.mainOrderCount || 0) +
        ' 单 · 占比 ' +
        (line.share || 0) +
        '%</div>';

    var childrenHtml = '';
    if (line.children && line.children.length) {
      childrenHtml =
        '<div class="sa-rpt-bizline__kids">' +
        line.children
          .map(function (c) {
            var plat =
              c.platforms && c.platforms.length
                ? '<span class="sa-rpt-bizline__plat">' + esc(c.platforms.join('、')) + '</span>'
                : '';
            return (
              '<div class="sa-rpt-bizline__kid">' +
              '<div class="sa-rpt-bizline__kid-main">' +
              '<span class="sa-rpt-bizline__kid-name">' +
              esc(c.name) +
              '</span>' +
              plat +
              '</div>' +
              '<span class="sa-rpt-bizline__soon">暂未获取</span>' +
              '</div>'
            );
          })
          .join('') +
        '</div>';
    }

    return (
      '<article class="sa-rpt-bizline' +
      (isComing ? ' is-coming' : '') +
      '" data-line="' +
      esc(line.id) +
      '">' +
      '<div class="sa-rpt-bizline__hd">' +
      '<div>' +
      '<div class="sa-rpt-bizline__name">' +
      esc(line.name) +
      (isComing ? '<em class="sa-rpt-bizline__badge">即将开通</em>' : '') +
      '</div>' +
      metaHtml +
      '</div>' +
      amountHtml +
      '</div>' +
      childrenHtml +
      '</article>'
    );
  }

  function render() {
    if (!D() || !D().buildBizLineRevenue) return;
    var data = D().buildBizLineRevenue(state.range, state.custom);
    if ($('rvTotal')) $('rvTotal').textContent = fmt(data.totalPaid);
    if ($('rvHint')) {
      $('rvHint').textContent =
        data.note || '门店实际营业额：顾客在本店实际付了多少钱，按已开通来源分开看。';
    }
    if ($('rvAsOf')) {
      var day = D().DEMO_TODAY || '';
      $('rvAsOf').textContent = '数据截至 ' + day + ' 09:30';
    }
    if ($('rvLines')) {
      $('rvLines').innerHTML = (data.lines || []).map(renderLine).join('');
    }
    syncChips();
  }

  function showHelp() {
    var sheet = $('rvSheet');
    var body = $('rvSheetBody');
    if (!sheet || !body) return;
    body.textContent =
      '这里看的是门店实际营业额：顾客在本店实际付了多少钱。\n\n' +
      '按已开通的来源分开展示（如直播、商城），便于对照各来源贡献了多少。';
    sheet.hidden = false;
  }

  function bind() {
    var chips = $('rvRange');
    if (chips) {
      chips.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
        var next = btn.getAttribute('data-range');
        if (next === 'custom') {
          openCustomSheet();
          return;
        }
        state.range = next;
        state.custom = { start: '', end: '' };
        render();
      });
    }

    var timeSheet = $('rvTimeSheet');
    if (timeSheet) {
      timeSheet.addEventListener('click', function (e) {
        if (e.target === timeSheet || e.target.closest('[data-close-rv-time]')) {
          closeCustomSheet();
        }
      });
    }

    var apply = $('rvCustomApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var start = ($('rvCustomStart') && $('rvCustomStart').value) || '';
        var end = ($('rvCustomEnd') && $('rvCustomEnd').value) || '';
        var err = $('rvCustomErr');
        if (!start || !end) {
          if (err) {
            err.hidden = false;
            err.textContent = '请选择完整的起止日期';
          } else {
            toast('请选择起止日期');
          }
          return;
        }
        if (start > end) {
          if (err) {
            err.hidden = false;
            err.textContent = '开始日期不能晚于结束日期';
          } else {
            toast('开始日期不能晚于结束日期');
          }
          return;
        }
        state.range = 'custom';
        state.custom = { start: start, end: end };
        closeCustomSheet();
        render();
      });
    }

    var help = $('rvHelpBtn');
    if (help) help.addEventListener('click', showHelp);

    var sheet = $('rvSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet || e.target.closest('[data-close-sheet]')) {
          sheet.hidden = true;
        }
      });
    }
  }

  parseQuery();
  if (window.StoreAppBizSession && typeof window.StoreAppBizSession.boot === 'function') {
    window.StoreAppBizSession.boot({ toast: toast });
  }
  bind();
  render();
})();
