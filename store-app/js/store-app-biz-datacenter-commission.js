/**
 * 门店数据中心 · 佣金明细
 * UI：2026-11-19 12:39 等价快照（sa-biz + store-app-biz-commission.css）
 * 口径：共享 StoreAppBizDataCenter；维度仅 pay｜settle
 */
(function () {
  var state = {
    range: 'today',
    custom: { start: '', end: '' },
    dim: 'pay',
    status: 'all',
    searchType: 'all',
    keyword: '',
    balanceHidden: false,
    withdrawable: 0
  };

  var SEARCH_TYPE_LABEL = {
    all: '综合',
    phone: '手机号',
    order: '订单编号',
    nick: '用户昵称',
    goods: '商品'
  };

  function $(id) {
    return document.getElementById(id);
  }
  function D() {
    return window.StoreAppBizDataCenter;
  }
  function S() {
    return window.StoreAppBizDcState;
  }
  function money(n) {
    return D().money(n);
  }
  function toast(msg) {
    var el = document.querySelector('.sa-biz-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'sa-biz-toast';
      var shell = document.querySelector('.sa-biz-shell');
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function persist() {
    if (!S()) return;
    S().pushUrl(
      {
        range: state.range,
        start: state.custom.start,
        end: state.custom.end,
        dim: state.dim
      },
      'commission'
    );
  }

  function amountNatureLabel() {
    return state.dim === 'settle' ? '已结算佣金' : '预估佣金';
  }

  function periodTitle(prefix) {
    return state.dim === 'settle' ? prefix + '已结算' : prefix + '预估';
  }

  function periodAmount(sum) {
    if (state.dim === 'settle') {
      return { amt: sum.settled, cnt: sum.settledCount };
    }
    return { amt: sum.estimated, cnt: sum.estimatedCount };
  }

  function listDateKey(o) {
    if (state.dim === 'settle') {
      return String(o.commissionCreateTime || '').slice(0, 10);
    }
    return String(o.payTime || '').slice(0, 10);
  }

  function fulfillOf(o) {
    return o.fulfillStatus || '';
  }

  function matchStatus(o) {
    if (state.status === 'all') return true;
    var f = fulfillOf(o);
    if (state.status === '待发货') return f === '待发货';
    if (state.status === '待履约') {
      return f === '待提货' || f === '待自提' || f === '待收货';
    }
    if (state.status === '已完成') return f === '已完成';
    return f === state.status;
  }

  function matchKeyword(o) {
    var kw = String(state.keyword || '').trim().toLowerCase();
    if (!kw) return true;
    var type = state.searchType;
    var goods = o.goods || '';
    var map = {
      all: [o.phone, o.id, o.nick, goods].join(' '),
      phone: o.phone,
      order: o.id,
      nick: o.nick,
      goods: goods
    };
    return String(map[type] != null ? map[type] : map.all)
      .toLowerCase()
      .indexOf(kw) >= 0;
  }

  function filtered(list) {
    return list.filter(function (o) {
      return matchStatus(o) && matchKeyword(o);
    });
  }

  function kvRow(label, valueHtml) {
    return (
      '<div class="sa-biz-kv__k">' +
      esc(label) +
      '</div><div class="sa-biz-kv__v">' +
      valueHtml +
      '</div>'
    );
  }

  function copyBtn(text) {
    if (!text || text === '-' || text === '—') return '';
    return (
      '<button type="button" class="sa-biz-copy" data-copy="' +
      esc(text) +
      '" aria-label="复制">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">' +
      '<path fill="currentColor" d="M8 4h9a2 2 0 012 2v11h-2V6H8V4zm-3 4h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2zm0 2v10h9V10H5z"/>' +
      '</svg></button>'
    );
  }

  function settleStatusClass(status) {
    var s = String(status || '');
    if (s === '已结算') return 'is-settled';
    if (s === '结算中') return 'is-settling';
    if (s === '待结算') return 'is-settle-wait';
    if (s === '结算失败') return 'is-settle-fail';
    if (s === '已取消') return 'is-settle-cancel';
    return '';
  }

  function fulfillStatusClass(status) {
    var s = String(status || '');
    if (s === '待发货') return 'is-ship';
    if (s === '待提货' || s === '待自提') return 'is-pickup';
    if (s === '待收货') return 'is-recv';
    if (s === '已完成') return 'is-done';
    if (s === '已关闭') return 'is-closed';
    return '';
  }

  function avatarHtml(o) {
    return (
      '<span class="sa-biz-order__avatar">' + esc((o.nick || '?').charAt(0)) + '</span>'
    );
  }

  function commissionAmt(o) {
    if (o.commissionConfigured === false || o.commission == null) return null;
    return Number(o.commission) || 0;
  }

  function renderOrder(o) {
    var fulfill = fulfillOf(o);
    var amt = commissionAmt(o);
    var amtText = amt == null ? '—' : money(amt) + '元';
    return (
      '<article class="sa-biz-order" data-order-id="' +
      esc(o.id) +
      '">' +
      '<div class="sa-biz-order__head">' +
      avatarHtml(o) +
      '<span class="sa-biz-order__nick">' +
      esc(o.nick) +
      '</span>' +
      '<span class="sa-biz-order__status ' +
      fulfillStatusClass(fulfill) +
      '">' +
      esc(fulfill || '—') +
      '</span>' +
      '</div>' +
      '<div class="sa-biz-kv">' +
      kvRow('订单编号', esc(o.id) + copyBtn(o.id)) +
      kvRow('联系人', esc(o.nick || '—')) +
      kvRow('联系电话', esc(o.phone || '—') + copyBtn(o.phone)) +
      kvRow('购买商品', esc(o.goods || '—')) +
      kvRow('实付金额', esc(money(o.paid)) + '元') +
      kvRow('退款金额', esc(money(o.refund || 0)) + '元') +
      kvRow('佣金', esc(amtText)) +
      kvRow(
        '结算状态',
        '<span class="sa-biz-settle ' +
          settleStatusClass(o.settleStatus) +
          '">' +
          esc(o.settleStatus || '—') +
          '</span>'
      ) +
      kvRow('支付时间', esc(o.payTime || '—')) +
      kvRow('结算单创建', esc(o.commissionCreateTime || '—')) +
      kvRow('备注', esc(o.remark || '—')) +
      '</div></article>'
    );
  }

  function formatDayDot(day) {
    if (!day) return '—';
    return String(day).replace(/-/g, '.');
  }

  function groupByDay(list) {
    var map = {};
    var keys = [];
    list.forEach(function (o) {
      var k = listDateKey(o) || '未入账';
      if (!map[k]) {
        map[k] = [];
        keys.push(k);
      }
      map[k].push(o);
    });
    keys.sort(function (a, b) {
      return a < b ? 1 : a > b ? -1 : 0;
    });
    return keys.map(function (k) {
      return { day: k, orders: map[k] };
    });
  }

  function formatPeriodAmt(n) {
    var v = Number(n) || 0;
    if (Math.abs(v - Math.round(v)) < 0.001) {
      return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return money(v);
  }

  function renderPeriodStrip() {
    var map = [
      { range: 'today', v: 'bizPeriodToday', c: 'bizPeriodTodayCnt', prefix: '今日' },
      { range: 'yesterday', v: 'bizPeriodYday', c: 'bizPeriodYdayCnt', prefix: '昨日' },
      { range: '7d', v: 'bizPeriodWeek', c: 'bizPeriodWeekCnt', prefix: '近7天' },
      { range: '30d', v: 'bizPeriodMonth', c: 'bizPeriodMonthCnt', prefix: '近30天' }
    ];
    var strip = $('bizPeriodStrip');
    if (strip) {
      strip.setAttribute(
        'aria-label',
        state.dim === 'settle' ? '分时段已结算佣金' : '分时段预估佣金'
      );
    }
    map.forEach(function (it) {
      var sum = D().commissionSummary(it.range, null, state.dim);
      var pack = periodAmount(sum);
      var cell = $(it.v);
      var cnt = $(it.c);
      var parent = cell && cell.parentElement;
      if (parent) {
        var tEl = parent.querySelector('.sa-biz-period__t');
        if (tEl) tEl.textContent = periodTitle(it.prefix);
      }
      if (cell) cell.textContent = formatPeriodAmt(pack.amt);
      if (cnt) cnt.textContent = pack.cnt + '单';
    });
  }

  function renderList() {
    var root = $('bizOrderList');
    if (!root) return;
    var sum = D().commissionSummary(state.range, state.custom, state.dim);
    var list = filtered(sum.list);
    var showAmt = 0;
    var showCnt = 0;
    list.forEach(function (o) {
      var a = commissionAmt(o);
      if (a != null) {
        showAmt += a;
        showCnt += 1;
      }
    });
    showAmt = Math.round(showAmt * 100) / 100;

    if ($('bizExtraLabel')) {
      $('bizExtraLabel').textContent =
        state.dim === 'settle'
          ? '口径：按结算时间 · 已结算佣金'
          : '口径：按支付时间 · 预估佣金';
      $('bizExtraLabel').hidden = false;
    }
    if ($('bizTotalLine')) {
      $('bizTotalLine').innerHTML =
        '所选期间佣金 <em>' + money(showAmt) + '</em> 元 <em>' + showCnt + '</em>单';
    }

    if (state.dim === 'pay' && state.status === 'all' && !state.keyword) {
      var ops = D().buildOpsDetail(state.range, state.custom, 'pay', 'all');
      if (Math.abs(ops.income.amount - sum.estimated) > 0.02) {
        console.warn('[dc] commission mismatch', ops.income.amount, sum.estimated);
      }
    }

    renderPeriodStrip();
    if (!list.length) {
      root.innerHTML = '<div class="sa-biz-empty">暂无符合条件的佣金明细</div>';
      return;
    }
    var dayLabel = amountNatureLabel();
    var groups = groupByDay(list);
    root.innerHTML = groups
      .map(function (g) {
        var dayAmt = 0;
        g.orders.forEach(function (o) {
          var a = commissionAmt(o);
          if (a != null) dayAmt += a;
        });
        dayAmt = Math.round(dayAmt * 100) / 100;
        return (
          '<section class="sa-biz-day">' +
          '<div class="sa-biz-day__head">' +
          '<strong>' +
          esc(formatDayDot(g.day)) +
          '</strong>' +
          '<span>' +
          esc(dayLabel) +
          ' ¥' +
          money(dayAmt) +
          '</span>' +
          '</div>' +
          g.orders.map(renderOrder).join('') +
          '</section>'
        );
      })
      .join('');
  }

  function renderBalance() {
    var el = $('bizWithdrawAmount');
    if (!el) return;
    el.textContent = state.balanceHidden ? '****' : money(state.withdrawable);
  }

  var EYE_VISIBLE =
    '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>';
  var EYE_HIDDEN =
    '<path d="M3 3l18 18"/><path d="M10.5 10.7A2.5 2.5 0 0012 14.5c.5 0 1-.1 1.4-.4"/><path d="M9.2 5.5C10.1 5.2 11 5 12 5c6.5 0 10 7 10 7a18 18 0 01-4.2 4.6"/><path d="M6.1 6.2A17 17 0 002 12s3.5 7 10 7c1.3 0 2.5-.3 3.6-.7"/>';

  function setEyeUi() {
    var btn = $('bizEyeBtn');
    var icon = $('bizEyeIcon');
    if (!btn || !icon) return;
    icon.innerHTML = state.balanceHidden ? EYE_HIDDEN : EYE_VISIBLE;
    btn.setAttribute('aria-pressed', state.balanceHidden ? 'true' : 'false');
  }

  function syncTabs() {
    document.querySelectorAll('#bizDimTabs [data-dim]').forEach(function (b) {
      var on = b.getAttribute('data-dim') === state.dim;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('#bizRangeTabs [data-range]').forEach(function (b) {
      var on = b.getAttribute('data-range') === state.range;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('#bizOrderTabs [data-status]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-status') === state.status);
    });
  }

  function openCustom() {
    var sheet = $('bizRangeSheet');
    if (!sheet) return;
    var def = S().customDefaults(state.range, state.custom, function (r, c) {
      return D().resolveRange(r, c);
    });
    $('bizCustomStart').value = def.start || D().DEMO_TODAY;
    $('bizCustomEnd').value = def.end || D().DEMO_TODAY;
    if ($('bizCustomErr')) {
      $('bizCustomErr').hidden = true;
      $('bizCustomErr').textContent = '';
    }
    sheet.hidden = false;
  }

  function render() {
    if (!D()) return;
    persist();
    if ($('bizBackOverview')) $('bizBackOverview').href = S().href('biz-center.html');
    if ($('commDcTab')) $('commDcTab').href = S().href('biz-center.html');
    var bounds = D().resolveRange(state.range, state.custom);
    var cmp = D().compareBounds(bounds);
    if ($('bizPeriodCaption')) {
      $('bizPeriodCaption').textContent = S().periodCaption(bounds, cmp.label, {
        startKey: cmp.startKey,
        endKey: cmp.endKey
      });
    }
    if ($('bizAsOf')) {
      $('bizAsOf').textContent = S().updatedCaption(D().UPDATED_AT);
    }
    syncTabs();
    renderBalance();
    renderList();
  }

  function bind() {
    var dims = $('bizDimTabs');
    if (dims) {
      dims.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-dim]');
        if (!btn) return;
        state.dim = btn.getAttribute('data-dim');
        render();
      });
    }
    var range = $('bizRangeTabs');
    if (range) {
      range.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
        var id = btn.getAttribute('data-range');
        if (id === 'custom') {
          openCustom();
          return;
        }
        state.range = id;
        state.custom = { start: '', end: '' };
        render();
      });
    }
    if ($('bizRangeSheet')) {
      $('bizRangeSheet').addEventListener('click', function (e) {
        if (e.target === $('bizRangeSheet') || e.target.closest('[data-close-range]')) {
          $('bizRangeSheet').hidden = true;
        }
      });
    }
    if ($('bizCustomApply')) {
      $('bizCustomApply').addEventListener('click', function () {
        var a = $('bizCustomStart').value;
        var b = $('bizCustomEnd').value;
        var err = $('bizCustomErr');
        if (!a || !b) {
          if (err) {
            err.hidden = false;
            err.textContent = '请选择开始和结束日期';
          }
          return;
        }
        if (a > b) {
          if (err) {
            err.hidden = false;
            err.textContent = '开始日期不能晚于结束日期';
          }
          return;
        }
        if (err) err.hidden = true;
        state.range = 'custom';
        state.custom = { start: a, end: b };
        $('bizRangeSheet').hidden = true;
        render();
      });
    }
    var tabs = $('bizOrderTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-status]');
        if (!btn) return;
        state.status = btn.getAttribute('data-status');
        render();
      });
    }
    var typeBtn = $('bizSearchTypeBtn');
    var menu = $('bizSearchTypeMenu');
    var typeLabel = $('bizSearchTypeLabel');
    if (typeBtn && menu) {
      typeBtn.addEventListener('click', function () {
        menu.hidden = !menu.hidden;
      });
      menu.addEventListener('click', function (e) {
        var b = e.target.closest('[data-type]');
        if (!b) return;
        state.searchType = b.getAttribute('data-type');
        if (typeLabel) typeLabel.textContent = SEARCH_TYPE_LABEL[state.searchType] || '综合';
        menu.hidden = true;
        render();
      });
    }
    var input = $('bizSearchInput');
    var searchBtn = $('bizSearchBtn');
    function doSearch() {
      state.keyword = input ? input.value : '';
      render();
    }
    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearch();
        }
      });
    }
    if ($('bizEyeBtn')) {
      $('bizEyeBtn').addEventListener('click', function () {
        state.balanceHidden = !state.balanceHidden;
        setEyeUi();
        renderBalance();
      });
    }
    if ($('bizWithdrawBtn')) {
      $('bizWithdrawBtn').addEventListener('click', function () {
        if (window.StoreAppBizSession && StoreAppBizSession.isBd && StoreAppBizSession.isBd()) return;
        location.href = '../../user-app/h5/store-wallet.html?from=biz-commission';
      });
    }
    if ($('commAiBtn')) {
      $('commAiBtn').addEventListener('click', function () {
        toast('AI助手演示中');
      });
    }
    if ($('bizOrderList')) {
      $('bizOrderList').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-copy]');
        if (!btn) return;
        var text = btn.getAttribute('data-copy') || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              toast('已复制');
            },
            function () {
              toast(text);
            }
          );
        } else {
          toast('已复制：' + text);
        }
      });
    }
  }

  function init() {
    if (window.StoreAppBizSession && StoreAppBizSession.isBd && StoreAppBizSession.isBd()) {
      if (StoreAppBizSession.boot) StoreAppBizSession.boot({ toast: toast });
      return;
    }
    var f = S() ? S().merge('commission') : {};
    state.range = S().normalizeRange(f.range || 'today');
    state.custom = { start: f.start || '', end: f.end || '' };
    state.dim = S().normalizeDim(f.dim || 'pay');
    var snap =
      window.StoreWalletDemo && typeof StoreWalletDemo.snapshot === 'function'
        ? StoreWalletDemo.snapshot()
        : null;
    state.withdrawable = snap && snap.withdrawable != null ? snap.withdrawable : 0;
    if (window.StoreAppBizSession && StoreAppBizSession.boot) {
      StoreAppBizSession.boot({ toast: toast });
    }
    bind();
    setEyeUi();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
