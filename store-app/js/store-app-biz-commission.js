/**
 * 佣金明细（自经营中心列表扩展）
 * - 时间维：支付时间 / 下单日期 / 入账时间（下单日期≠支付时间）
 * - 展示主订单、子订单、预估/入账/回退佣金
 * - 演示数据优先取 StoreAppBizReportData，与经营总览一致
 */
(function () {
  var state = {
    range: '30d',
    status: 'all',
    searchType: 'all',
    keyword: '',
    balanceHidden: false,
    withdrawable: 0,
    dim: 'order'
  };

  var SEARCH_TYPE_LABEL = {
    all: '综合',
    phone: '手机号',
    order: '订单编号',
    nick: '用户昵称',
    goods: '商品'
  };

  /* 门店可见：不出现 PC／代收待转／口径 等内部词 */
  var DIM_HINT = {
    pay: '按顾客支付成功时间筛选。结算状态为：待结算、结算中、已结算、结算失败、已取消。',
    order: '按下单日期筛选（下单日期不一定等于支付成功时间）。',
    credit: '按佣金实际入账时间筛选（仅已入账成功）。'
  };

  function $(id) {
    return document.getElementById(id);
  }

  function money(n) {
    return Number(n || 0).toFixed(2);
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

  function loadOrders() {
    if (window.StoreAppBizReportData && typeof StoreAppBizReportData.listCommissionOrders === 'function') {
      return StoreAppBizReportData.listCommissionOrders();
    }
    return (window.StoreAppBizOrders && StoreAppBizOrders.list) || [];
  }

  var ORDERS = loadOrders();

  function earnedOf(o) {
    if (window.StoreAppBizReportData && typeof StoreAppBizReportData.estimatedCommission === 'function') {
      return StoreAppBizReportData.estimatedCommission(o);
    }
    if (window.StoreAppBizOrders && typeof StoreAppBizOrders.earnedCommission === 'function') {
      return StoreAppBizOrders.earnedCommission(o);
    }
    return Number(o.commission) || 0;
  }

  function creditedOf(o) {
    if (window.StoreAppBizReportData && typeof StoreAppBizReportData.creditedCommission === 'function') {
      return StoreAppBizReportData.creditedCommission(o);
    }
    return o.settleStatus === '已结算' ? Number(o.creditedAmount != null ? o.creditedAmount : o.commission) || 0 : 0;
  }

  function listDateKey(order) {
    if (state.dim === 'credit') {
      if (!order || order.settleStatus !== '已结算') return '';
      return String(order.creditTime || order.settleTime || '').slice(0, 10);
    }
    if (state.dim === 'order') {
      return order.dayKey || order.date || String(order.orderTime || '').slice(0, 10);
    }
    return String(order.payTime || '').slice(0, 10);
  }

  function parseDay(str) {
    var p = String(str || '').split('-');
    if (p.length < 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function inRange(order) {
    var key = listDateKey(order);
    if (!key) return false;
    var d = parseDay(key);
    if (!d) return false;
    var pivot =
      (window.StoreAppBizReportData && StoreAppBizReportData.DEMO_TODAY) ||
      (window.StoreAppBizOrders && StoreAppBizOrders.DEMO_TODAY) ||
      '';
    var today = pivot ? parseDay(pivot) : new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var start = today;
    var end = new Date(today.getTime() + 86400000);
    if (state.range === 'yesterday') {
      start = new Date(today.getTime() - 86400000);
      end = today;
    } else if (state.range === '7d') {
      start = new Date(today.getTime() - 6 * 86400000);
    } else if (state.range === '30d') {
      start = new Date(today.getTime() - 29 * 86400000);
    } else if (state.range === 'custom') {
      var cs = parseDay(state.customStart);
      var ce = parseDay(state.customEnd);
      if (cs) start = cs;
      if (ce) end = new Date(ce.getTime() + 86400000);
    } else if (state.range !== 'today') {
      start = new Date(today.getTime() - 29 * 86400000);
    }
    return d.getTime() >= start.getTime() && d.getTime() < end.getTime();
  }

  function fulfillOf(order) {
    return order.fulfillStatus || order.statusText || '';
  }

  function matchStatus(order) {
    if (state.status === 'all') return true;
    /* URL 仍可能带结算态；设计稿主筛为履约态 */
    if (
      state.status === '待结算' ||
      state.status === '结算中' ||
      state.status === '已结算' ||
      state.status === '结算失败' ||
      state.status === '已取消'
    ) {
      return String(order.settleStatus) === String(state.status);
    }
    var f = fulfillOf(order);
    if (state.status === '待发货') return f === '待发货';
    if (state.status === '待履约') {
      return f === '待提货' || f === '待自提' || f === '待收货';
    }
    if (state.status === '已完成') return f === '已完成';
    return f === state.status;
  }

  function matchKeyword(order) {
    var kw = String(state.keyword || '').trim().toLowerCase();
    if (!kw) return true;
    var type = state.searchType;
    var goods = order.goods || '';
    var map = {
      all: [order.phone, order.id, order.mainOrderId, order.nick, order.contact, goods].join(' '),
      phone: order.phone,
      order: [order.id, order.mainOrderId].join(' '),
      nick: order.nick + ' ' + order.contact,
      goods: goods
    };
    var hay = String(map[type] != null ? map[type] : map.all);
    return hay.toLowerCase().indexOf(kw) >= 0;
  }

  function filteredOrders() {
    return ORDERS.filter(function (o) {
      return inRange(o) && matchStatus(o) && matchKeyword(o);
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  /** 图1：复制为图标，紧贴字段值 */
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

  function dash(v) {
    return v && String(v) !== '-' ? String(v) : '—';
  }

  /** 图1 日期：2026.07.17 */
  function formatDayDot(day) {
    if (!day || day === '未入账') return day || '—';
    return String(day).replace(/-/g, '.');
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
    if (o.avatar) {
      return (
        '<span class="sa-biz-order__avatar sa-biz-order__avatar--img" style="background-image:url(\'' +
        esc(o.avatar) +
        '\')"></span>'
      );
    }
    return (
      '<span class="sa-biz-order__avatar">' + esc((o.nick || '?').charAt(0)) + '</span>'
    );
  }

  function renderOrder(o) {
    var fulfill = fulfillOf(o);
    var settleTime =
      o.settleStatus === '已结算' ? o.creditTime || o.settleTime || '' : '';
    var goodsLabel = o.goods || '—';
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
      esc(fulfill) +
      '</span>' +
      '</div>' +
      '<div class="sa-biz-kv">' +
      kvRow('订单编号', esc(o.id) + copyBtn(o.id)) +
      kvRow('联系人', esc(o.contact || o.nick || '—')) +
      kvRow('联系电话', esc(o.phone || '—') + copyBtn(o.phone)) +
      kvRow('履约方式', esc(o.shipMode || '—')) +
      kvRow(
        '购买商品',
        '<a class="sa-biz-goods-link" href="biz-order-goods.html?id=' +
          encodeURIComponent(o.id) +
          '">' +
          esc(goodsLabel) +
          ' ›</a>'
      ) +
      kvRow('实付金额', esc(money(o.paid)) + '元') +
      kvRow('退款金额', esc(money(o.refund || 0)) + '元') +
      kvRow('所得佣金', esc(money(earnedOf(o))) + '元') +
      kvRow(
        '结算状态',
        '<span class="sa-biz-settle ' +
          settleStatusClass(o.settleStatus) +
          '">' +
          esc(o.settleStatus || '—') +
          '</span>'
      ) +
      kvRow('支付时间', esc(dash(o.payTime))) +
      kvRow('配送时间', esc(dash(o.deliveryTime))) +
      kvRow('完结时间', esc(dash(o.finishTime))) +
      kvRow('结算时间', esc(dash(settleTime))) +
      kvRow('备注', esc(o.remark || '—')) +
      '</div></article>'
    );
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

  function renderList() {
    var root = $('bizOrderList');
    if (!root) return;
    var list = filteredOrders();
    var sumAmt = 0;
    list.forEach(function (o) {
      sumAmt += state.dim === 'credit' ? creditedOf(o) : earnedOf(o);
    });
    var extra = $('bizExtraLabel');
    if (extra) {
      extra.textContent = state.dim === 'credit' ? '实际到账佣金' : '累计总佣金';
      extra.hidden = state.dim !== 'credit';
    }
    var line = $('bizTotalLine');
    if (line) {
      var label =
        state.dim === 'credit' ? '累计实际到账佣金' : '累计总佣金';
      line.innerHTML =
        esc(label) +
        ' <em>' +
        money(sumAmt) +
        '</em> 元 <em>' +
        list.length +
        '</em>单';
    }
    renderPeriodStrip();
    if (!list.length) {
      root.innerHTML = '<div class="sa-biz-empty">暂无符合条件的佣金明细</div>';
      return;
    }
    var groups = groupByDay(list);
    root.innerHTML = groups
      .map(function (g) {
        var dayAmt = 0;
        g.orders.forEach(function (o) {
          dayAmt += state.dim === 'credit' ? creditedOf(o) : earnedOf(o);
        });
        return (
          '<section class="sa-biz-day">' +
          '<div class="sa-biz-day__head">' +
          '<strong>' +
          esc(formatDayDot(g.day)) +
          '</strong>' +
          '<span>预估佣金 ¥' +
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

  function periodStats(rangeKey) {
    if (window.StoreAppBizReportData && typeof StoreAppBizReportData.buildOverview === 'function') {
      var ov = StoreAppBizReportData.buildOverview(rangeKey, {});
      var amt =
        state.dim === 'credit'
          ? ov.commission.credited
          : ov.commission.estimated;
      var cnt =
        state.dim === 'credit'
          ? ov.commission.creditedCount || ov.trade.subOrderCount
          : ov.trade.subOrderCount;
      return { amt: amt, cnt: cnt || 0 };
    }
    return { amt: 0, cnt: 0 };
  }

  function formatPeriodAmt(n) {
    var v = Number(n) || 0;
    if (Math.abs(v - Math.round(v)) < 0.001) {
      return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return money(v);
  }

  function renderPeriodStrip() {
    var prefix = state.dim === 'credit' ? '到账' : '预到账';
    var map = [
      { range: 'today', v: 'bizPeriodToday', c: 'bizPeriodTodayCnt', t: '今日' },
      { range: 'yesterday', v: 'bizPeriodYday', c: 'bizPeriodYdayCnt', t: '昨日' },
      { range: '7d', v: 'bizPeriodWeek', c: 'bizPeriodWeekCnt', t: '本周' },
      { range: 'month', v: 'bizPeriodMonth', c: 'bizPeriodMonthCnt', t: '本月' }
    ];
    map.forEach(function (it) {
      var cell = $(it.v);
      var cnt = $(it.c);
      var parent = cell && cell.parentElement;
      if (parent) {
        var tEl = parent.querySelector('.sa-biz-period__t');
        if (tEl) tEl.textContent = it.t + prefix;
      }
      var st = periodStats(it.range);
      if (cell) cell.textContent = formatPeriodAmt(st.amt);
      if (cnt) cnt.textContent = st.cnt + '单';
    });
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

  function applyQuery() {
    var params = new URLSearchParams(location.search);
    if (params.get('range')) state.range = params.get('range');
    if (params.get('dim')) state.dim = params.get('dim');
    if (params.get('start')) state.customStart = params.get('start');
    if (params.get('end')) state.customEnd = params.get('end');
    if (params.get('settleStatus')) state.status = params.get('settleStatus');
    if (params.get('focus') === 'credited') state.dim = 'credit';
  }

  function syncTabs() {
    var dims = $('bizDimTabs');
    if (dims) {
      var payBtn = dims.querySelector('[data-dim="pay"]');
      if (payBtn) {
        if (state.dim === 'pay') {
          payBtn.hidden = false;
          dims.style.width = '288px';
        } else if (!payBtn.hidden && state.dim !== 'pay') {
          // 保持支付维入口可点；无选中时仍可藏起以贴设计稿双段
          payBtn.hidden = true;
          dims.style.width = '196px';
        }
      }
      dims.querySelectorAll('[data-dim]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-dim') === state.dim);
      });
    }
    var hint = $('bizDimHint');
    if (hint) hint.textContent = DIM_HINT[state.dim] || '';
    var range = $('bizRangeTabs');
    if (range) {
      range.querySelectorAll('[data-range]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-range') === state.range);
      });
    }
    var tabs = $('bizOrderTabs');
    if (tabs) {
      tabs.querySelectorAll('[data-status]').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-status') === state.status);
      });
    }
  }

  function bind() {
    var dims = $('bizDimTabs');
    if (dims) {
      dims.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-dim]');
        if (!btn) return;
        state.dim = btn.getAttribute('data-dim');
        syncTabs();
        renderList();
      });
    }

    var range = $('bizRangeTabs');
    if (range) {
      range.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
        state.range = btn.getAttribute('data-range');
        syncTabs();
        renderList();
      });
    }

    var tabs = $('bizOrderTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-status]');
        if (!btn) return;
        state.status = btn.getAttribute('data-status');
        syncTabs();
        renderList();
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
        renderList();
      });
      document.addEventListener('click', function (e) {
        if (!menu.hidden && !menu.contains(e.target) && !typeBtn.contains(e.target)) {
          menu.hidden = true;
        }
      });
    }

    var input = $('bizSearchInput');
    var searchBtn = $('bizSearchBtn');
    function doSearch() {
      state.keyword = input ? input.value : '';
      renderList();
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

    var eye = $('bizEyeBtn');
    if (eye) {
      eye.addEventListener('click', function () {
        state.balanceHidden = !state.balanceHidden;
        setEyeUi();
        renderBalance();
      });
    }

    var withdraw = $('bizWithdrawBtn');
    if (withdraw) {
      withdraw.addEventListener('click', function () {
        if (window.StoreAppBizSession && window.StoreAppBizSession.isBd && window.StoreAppBizSession.isBd()) {
          return;
        }
        window.location.href = '../../user-app/h5/store-wallet.html?from=biz-commission';
      });
    }

    var aiBtn = $('commAiBtn');
    if (aiBtn) {
      aiBtn.addEventListener('click', function () {
        toast('AI助手演示中');
      });
    }

    var list = $('bizOrderList');
    if (list) {
      list.addEventListener('click', function (e) {
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
    /* BD 不开放佣金明细：会话层会重定向到总览 */
    if (
      window.StoreAppBizSession &&
      window.StoreAppBizSession.isBd &&
      window.StoreAppBizSession.isBd()
    ) {
      if (typeof window.StoreAppBizSession.boot === 'function') {
        window.StoreAppBizSession.boot({ toast: toast });
      }
      return;
    }
    applyQuery();
    var snap =
      window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
        ? window.StoreWalletDemo.snapshot()
        : null;
    state.withdrawable = snap && snap.withdrawable != null ? snap.withdrawable : 0;
    if (window.StoreAppBizSession && typeof window.StoreAppBizSession.boot === 'function') {
      window.StoreAppBizSession.boot({ toast: toast });
    }
    bind();
    syncTabs();
    setEyeUi();
    renderBalance();
    renderList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
