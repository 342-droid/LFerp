/**
 * 经营中心（原推客中心视觉）
 * 订单主 Tab：全部订单 / 待发货 / 待自提·待收货 / 已完成；无二级子菜单
 */
(function () {
  var state = {
    range: '30d',
    status: 'all',
    searchType: 'phone',
    keyword: '',
    balanceHidden: false,
    withdrawable: 0
  };

  var SEARCH_TYPE_LABEL = {
    phone: '手机号',
    order: '订单编号',
    code: '会员码',
    nick: '用户昵称',
    goods: '商品'
  };

  var SUMMARY = {
    totalAmt: 29.87,
    totalCnt: 4,
    todayAmt: 0,
    todayCnt: 0,
    yestAmt: 0,
    yestCnt: 0,
    weekAmt: 0,
    weekCnt: 0,
    monthAmt: 0,
    monthCnt: 0
  };

  /** status: pending_ship | pending_pickup | pending_receipt | done — 数据见 store-app-biz-orders.js */
  var ORDERS =
    (window.StoreAppBizOrders && window.StoreAppBizOrders.list) || [];

  function $(id) {
    return document.getElementById(id);
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

  function money(n) {
    return Number(n || 0).toFixed(2);
  }

  function parseDay(str) {
    var p = String(str || '').split('-');
    if (p.length < 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function inRange(order) {
    var d = parseDay(order.dayKey || order.date);
    if (!d) return true;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var start;
    if (state.range === 'today') {
      start = today;
      return d.getTime() >= start.getTime() && d.getTime() < start.getTime() + 86400000;
    }
    if (state.range === 'yesterday') {
      start = new Date(today.getTime() - 86400000);
      return d.getTime() >= start.getTime() && d.getTime() < today.getTime();
    }
    if (state.range === '7d') {
      start = new Date(today.getTime() - 6 * 86400000);
      return d.getTime() >= start.getTime();
    }
    /* 近1个月：演示数据含历史单，默认放宽到全部；若需严格可改为 29 天 */
    if (state.range === '30d') return true;
    return true;
  }

  function matchStatus(order) {
    if (state.status === 'all') return true;
    if (state.status === 'pending_ship') return order.status === 'pending_ship';
    if (state.status === 'pending_pickup') {
      return order.status === 'pending_pickup' || order.status === 'pending_receipt';
    }
    if (state.status === 'done') return order.status === 'done';
    return true;
  }

  function matchKeyword(order) {
    var kw = String(state.keyword || '').trim().toLowerCase();
    if (!kw) return true;
    var type = state.searchType;
    var map = {
      phone: order.phone,
      order: order.id,
      code: order.verifyCode,
      nick: order.nick + ' ' + order.contact,
      goods: order.goods
    };
    var hay = String(map[type] != null ? map[type] : [order.phone, order.id, order.verifyCode, order.nick, order.goods].join(' '));
    return hay.toLowerCase().indexOf(kw) >= 0;
  }

  function filteredOrders() {
    return ORDERS.filter(function (o) {
      return inRange(o) && matchStatus(o) && matchKeyword(o);
    });
  }

  function statusClass(status) {
    if (status === 'pending_ship') return 'is-ship';
    if (status === 'pending_pickup' || status === 'pending_receipt') return 'is-pending';
    return '';
  }

  function groupByDay(list) {
    var map = {};
    var keys = [];
    list.forEach(function (o) {
      var k = o.dayKey || o.date;
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

  function daySummary(orders) {
    var cnt = orders.length;
    var amt = 0;
    orders.forEach(function (o) {
      amt += Number(o.commission) || 0;
    });
    return { cnt: cnt, amt: amt };
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

  function hasRefund(o) {
    if (Number(o.refund) > 0) return true;
    return Array.isArray(o.refundItems) && o.refundItems.length > 0;
  }

  function renderOrder(o) {
    var shipCls = o.shipMode === '快递' || o.shipMode === '自提' ? ' sa-biz-kv__v--ship' : '';
    var refundTimeRow = hasRefund(o)
      ? kvRow('退款时间', esc(o.refundTime || '-'))
      : '';
    return (
      '<article class="sa-biz-order" data-order-id="' +
      esc(o.id) +
      '">' +
      '<div class="sa-biz-order__head">' +
      '<span class="sa-biz-order__avatar">' +
      esc((o.nick || '?').charAt(0)) +
      '</span>' +
      '<span class="sa-biz-order__nick">' +
      esc(o.nick) +
      '</span>' +
      '<span class="sa-biz-order__status ' +
      statusClass(o.status) +
      '">' +
      esc(o.statusText) +
      '</span>' +
      '</div>' +
      '<div class="sa-biz-kv">' +
      kvRow(
        '订单编号',
        esc(o.id) +
          '<button type="button" class="sa-biz-copy" data-copy="' +
          esc(o.id) +
          '">复制</button>'
      ) +
      kvRow('联系人', esc(o.contact)) +
      kvRow(
        '联系电话',
        esc(o.phone) +
          '<button type="button" class="sa-biz-copy" data-copy="' +
          esc(o.phone) +
          '">复制</button>'
      ) +
      kvRow('履约方式', '<span class="' + shipCls.trim() + '">' + esc(o.shipMode) + '</span>') +
      kvRow(
        '购买商品',
        '<a class="sa-biz-goods-link" href="biz-order-goods.html?id=' +
          encodeURIComponent(o.id) +
          '">' +
          esc(o.goods) +
          '</a>'
      ) +
      kvRow('实付金额', esc(money(o.paid)) + '元') +
      kvRow('退款金额', esc(money(o.refund)) + '元') +
      kvRow('所得佣金', esc(money(o.commission)) + '元') +
      kvRow('支付时间', esc(o.payTime || '-')) +
      kvRow('配送时间', esc(o.deliveryTime || '-')) +
      refundTimeRow +
      kvRow('完成时间', esc(o.finishTime || '-')) +
      kvRow('备注', esc(o.remark || '')) +
      '</div></article>'
    );
  }

  function renderList() {
    var root = $('bizOrderList');
    if (!root) return;
    var list = filteredOrders();
    if (!list.length) {
      root.innerHTML = '<div class="sa-biz-empty">暂无符合条件的订单</div>';
      return;
    }
    var groups = groupByDay(list);
    root.innerHTML = groups
      .map(function (g) {
        var sum = daySummary(g.orders);
        return (
          '<section class="sa-biz-day">' +
          '<div class="sa-biz-day__head">' +
          '<strong>' +
          esc(g.day) +
          '</strong>' +
          '<span>共' +
          sum.cnt +
          '笔有效订单，预估佣金 ¥ ' +
          money(sum.amt).replace(/\.00$/, '') +
          '</span>' +
          '</div>' +
          g.orders.map(renderOrder).join('') +
          '</section>'
        );
      })
      .join('');
  }

  function renderSummary() {
    var line = $('bizTotalLine');
    if (line) {
      line.innerHTML =
        '累计总佣金 <em>' +
        money(SUMMARY.totalAmt) +
        '</em>元 <em>' +
        SUMMARY.totalCnt +
        '</em>单';
    }
    var grid = $('bizPeriodGrid');
    if (grid) {
      grid.querySelectorAll('[data-k]').forEach(function (el) {
        var k = el.getAttribute('data-k');
        if (k && SUMMARY[k] != null) {
          el.textContent = String(k.indexOf('Amt') >= 0 ? money(SUMMARY[k]) : SUMMARY[k]);
        }
      });
    }
    renderBalance();
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
    btn.setAttribute('aria-label', state.balanceHidden ? '显示余额' : '隐藏余额');
    btn.setAttribute('title', state.balanceHidden ? '显示余额' : '隐藏余额');
  }

  function bind() {
    var range = $('bizRangeTabs');
    if (range) {
      range.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-range]');
        if (!btn) return;
        state.range = btn.getAttribute('data-range');
        range.querySelectorAll('.sa-biz-range__btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        renderList();
      });
    }

    var tabs = $('bizOrderTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-status]');
        if (!btn) return;
        state.status = btn.getAttribute('data-status');
        tabs.querySelectorAll('.sa-biz-ordertabs__btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
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
        if (typeLabel) typeLabel.textContent = SEARCH_TYPE_LABEL[state.searchType] || '手机号';
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
        window.location.href = '../../user-app/h5/store-wallet.html?from=biz-center';
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
    var snap =
      window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function'
        ? window.StoreWalletDemo.snapshot()
        : null;
    state.withdrawable = snap && snap.withdrawable != null ? snap.withdrawable : 0;
    bind();
    setEyeUi();
    renderSummary();
    renderList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
