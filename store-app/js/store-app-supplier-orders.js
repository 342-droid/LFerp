/* 丰银宝 · 供应商视角 · 客户订单
 * PC：零售/代采分页 + 多条件；App：类型→状态→时间，状态枚举与 PC 一致，主操作前置 */
(function () {
  if (!window.FybOrg || !window.FybOrg.ensureSupplierModeOrRedirect()) return;
  if (!window.FybSupplierOrders || !window.FybSupplierFilters) return;

  var F = window.FybSupplierFilters;

  /** 与 PC 零售订单状态筛选项对齐 */
  var RETAIL_STATUSES = [
    '待支付',
    '待接单',
    '待发货',
    '待收货',
    '待提货',
    '待核销',
    '交易成功',
    '交易失败',
    '发起退货/退款'
  ];
  /** 与 PC 代采订单状态筛选项对齐 */
  var PROXY_STATUSES = [
    '待支付',
    '待接单',
    '待发货',
    '待收货',
    '交易成功',
    '交易失败',
    '发起退货/退款'
  ];

  var state = { type: '零售', status: '全部', time: 'all' };
  var org = window.FybOrg.current();

  function tagClass(status) {
    if (/交易成功|已完成|已结款/.test(status) && !/部分|售后|退货/.test(status)) return 'is-ok';
    if (/异常|失败/.test(status)) return 'is-bad';
    return 'is-wait';
  }

  function statusListForType(type) {
    return type === '代采' ? PROXY_STATUSES : RETAIL_STATUSES;
  }

  function matchStatus(o, status) {
    if (!status || status === '全部') return true;
    if (status === '发起退货/退款') return !!o.aftersale;
    return o.status === status;
  }

  function rows() {
    return window.FybSupplierOrders.listBySupplier(org.name).filter(function (o) {
      if (o.type !== state.type) return false;
      if (!matchStatus(o, state.status)) return false;
      return F.matchTime(o.time, state.time);
    });
  }

  function renderFilter() {
    var host = document.getElementById('saSupOrderFilter');
    if (!host) return;
    var statuses = ['全部'].concat(statusListForType(state.type));
    if (statuses.indexOf(state.status) < 0) state.status = '全部';
    host.innerHTML =
      '<div class="sa-sup-filter__l1" role="tablist" aria-label="订单类型">' +
      F.chip('零售', state.type === '零售', 'data-type') +
      F.chip('代采', state.type === '代采', 'data-type') +
      '</div>' +
      '<div class="sa-sup-filter__l2" role="tablist" aria-label="订单状态">' +
      statuses
        .map(function (s) {
          return F.chip(s, state.status === s, 'data-status');
        })
        .join('') +
      '</div>' +
      F.timeRowHtml(state.time);
  }

  function actionHtml(o) {
    var btns = [];
    if (window.FybSupplierOrders.canShip(o)) {
      btns.push('<button type="button" class="sa-sup-card__act sa-sup-card__act--primary" data-act="ship">发货</button>');
    }
    if (window.FybSupplierOrders.canHandleAftersale(o)) {
      btns.push('<button type="button" class="sa-sup-card__act" data-act="aftersale">处理售后</button>');
    }
    btns.push('<button type="button" class="sa-sup-card__act" data-act="detail">详情</button>');
    return '<div class="sa-sup-card__actions">' + btns.join('') + '</div>';
  }

  function renderList() {
    var host = document.getElementById('saSupOrderList');
    if (!host) return;
    var list = rows();
    if (!list.length) {
      host.innerHTML = '<div class="sa-sup-empty">暂无订单</div>';
      return;
    }
    host.innerHTML = list
      .map(function (o) {
        return (
          '<article class="sa-sup-card" data-order-no="' +
          o.orderNo +
          '">' +
          '<div class="sa-sup-card__row">' +
          '<div class="sa-sup-card__no">' +
          o.orderNo +
          '</div>' +
          '<span class="sa-sup-tag ' +
          tagClass(o.status) +
          '">' +
          o.status +
          '</span></div>' +
          '<div class="sa-sup-card__row" style="align-items:flex-start">' +
          '<img class="sa-sup-card__goods-thumb" src="' +
          (o.productImg || '../../user-app/assets/order-product-1.svg') +
          '" alt="">' +
          '<div style="flex:1;min-width:0">' +
          '<h3 class="sa-sup-card__name" style="margin:0 0 4px">' +
          o.product +
          ' ×' +
          o.qty +
          '</h3>' +
          '<div class="sa-sup-card__meta">' +
          o.type +
          ' · ' +
          o.channel +
          ' · ' +
          o.fulfill +
          '<br>' +
          o.time +
          (o.settleStatus ? ' · 结算 ' + o.settleStatus : '') +
          (o.aftersale
            ? '<br>售后 ' + o.aftersale.type + ' · ' + o.aftersale.status
            : '') +
          '</div></div>' +
          '<div class="sa-sup-card__amt">¥' +
          o.amount +
          '</div></div>' +
          actionHtml(o) +
          '</article>'
        );
      })
      .join('');
  }

  function goDetail(orderNo) {
    window.location.href =
      'supplier-order-detail.html?orderNo=' + encodeURIComponent(orderNo || '');
  }

  function render() {
    renderFilter();
    renderList();
  }

  document.getElementById('saSupOrderFilter').addEventListener('click', function (e) {
    var typeBtn = e.target.closest('[data-type]');
    if (typeBtn) {
      state.type = typeBtn.getAttribute('data-type');
      state.status = '全部';
      render();
      return;
    }
    var statusBtn = e.target.closest('[data-status]');
    if (statusBtn) {
      state.status = statusBtn.getAttribute('data-status');
      render();
      return;
    }
    var timeBtn = e.target.closest('[data-time]');
    if (!timeBtn) return;
    state.time = timeBtn.getAttribute('data-time');
    render();
  });

  document.getElementById('saSupOrderList').addEventListener('click', function (e) {
    var card = e.target.closest('[data-order-no]');
    if (!card) return;
    var orderNo = card.getAttribute('data-order-no');
    var actBtn = e.target.closest('[data-act]');
    var act = actBtn ? actBtn.getAttribute('data-act') : 'detail';
    if (act === 'aftersale' || act === 'ship' || act === 'detail') {
      goDetail(orderNo);
    }
  });

  render();
})();
