/**
 * 售后 — 售后单列表
 */
(function () {
  var PAGE_SIZE_OPTIONS = [20, 50, 100];

  var SOURCES = ['用户自助发起', '运营代用户发起'];
  var TYPES = ['仅退款', '退货退款', '补货', '换货'];
  var STATUSES = ['待审批', '退款中', '已拒绝', '待退货', '待收货', '退款异常', '已完成', '已取消'];
  /** 订单来源仅：零售、代采 */
  var ORDER_SOURCES = ['零售', '代采'];
  var LIVE_SESSIONS = ['默认经营池', 'ZB20260714-晚场', 'ZB20260713-早场'];
  var NICKNAMES = ['牛小牛呀', '冷丰用户', '悠悠生鲜粉', '门店会员A'];
  var PHONES = ['17739589272', '13800138000', '15922345621', '18600001111'];
  var STORES = ['南京万达店', '斯斯门店商家2', '杭州西湖店', '上海徐家汇店'];
  var ADDRESSES = [
    '浙江省杭州市萧山区宁围街道...',
    '江苏省南京市建邺区河西大街...',
    '上海市徐汇区漕溪北路...',
    '浙江省杭州市上城区望江路...'
  ];
  var PRODUCTS = [
    '牛牛专用大胖猫',
    '牛牛专用香蕉蕉',
    '冷丰优选车厘子',
    '精品牛腩'
  ];
  var PRODUCT_SPECS = ['甜糯', '酸甜', '3斤装', '500g'];
  var PRODUCT_SKUS = ['SKU00148', 'SKU00149', 'SKU00089', 'SKU00091'];
  var APPROVERS = ['系统', '超级管理员'];

  function pickRowReason(type, i) {
    if (window.MdmAftersaleReasons && typeof window.MdmAftersaleReasons.pickDemoReason === 'function') {
      return window.MdmAftersaleReasons.pickDemoReason(type, i);
    }
    return '质量问题';
  }

  function syncReasonFilterOptions(keepSelected) {
    var typeEl = $('asType');
    var reasonEl = $('asReason');
    if (!reasonEl || !window.MdmAftersaleReasons) return;
    var type = (typeEl && typeEl.value) || '';
    var selected = keepSelected ? reasonEl.value : '';
    window.MdmAftersaleReasons.fillReasonSelect(reasonEl, type, selected);
  }
  var REFUND_EXEC = ['未发起退款', '待退款', '退款执行中', '退款成功', '退款失败'];
  /** 结算状态：待结算 | 待结款 | 结款中 | 已结款（待结款由结算单生成触发，文案不再带说明） */
  var SETTLE_STATUSES = ['待结算', '待结款', '结款中', '已结款'];

  /** 仅退款、退货退款会生成退款单；换货、补货不产生退款 */
  function createsRefundDoc(type) {
    return type === '仅退款' || type === '退货退款';
  }

  function settleStatusLabel(status) {
    return status || '待结算';
  }

  function isPostSettlement(settleStatus) {
    return settleStatus === '待结款' || settleStatus === '结款中' || settleStatus === '已结款';
  }

  /**
   * 演示用结算状态：
   * - 结算表生成前：待结算（退款单走原路退回）
   * - 结算表生成后：待结款 / 结款中 / 已结款（仍生成退款单，退款方式为线下付款，在退款单页上传凭证）
   */
  function resolveSettleStatus(type, status, i) {
    if (status === '待审批' || status === '待退货' || status === '待收货') {
      return i % 5 === 0 ? '待结款' : '待结算';
    }
    /**
     * 退款中：结算前 / 结算后约各一半。
     * 注意：仅退款的「退款中」在矩阵里常落在奇数 i，退货退款常落偶数 i；
     * 不能用单纯 i%2，否则仅退款会全部变成结算后，原路退款演示断掉。
     */
    if (status === '退款中') {
      var preSettle = i % 4 === 0 || i % 4 === 1;
      if (preSettle) return '待结算';
      return SETTLE_STATUSES[1 + ((i >> 2) % 3)];
    }
    // 退款异常仅结算前有支付通道失败；结算后线下付款无失败态
    if (status === '退款异常') {
      return '待结算';
    }
    if (status === '已完成' && createsRefundDoc(type)) {
      return i % 3 === 0 ? '已结款' : i % 3 === 1 ? '待结算' : '结款中';
    }
    return '待结算';
  }

  /**
   * 退款执行状态（与售后单状态矩阵对齐）：
   * - 仅退款审核通过 / 退货退款确认收货 → 生成退款单（结算前后统一）
   * - 结算前：待退款 / 退款执行中（可筛选演示原路通道）
   * - 结算后线下付款：仅待退款 / 退款成功（无失败、无「退款执行中」）
   * - 补货 / 换货：始终「未发起退款」
   */
  function resolveRefundExec(type, status, i, settleStatus) {
    if (!createsRefundDoc(type)) return '未发起退款';

    if (type === '退货退款') {
      // 确认收货前（待审批/待退货/待收货/已拒绝/已取消）均未生成退款单
      if (status === '已完成') return '退款成功';
      if (status === '退款中') {
        if (isPostSettlement(settleStatus)) return '待退款';
        // 结算前：退货退款与仅退款都能筛到「退款执行中」
        return i % 16 === 0 ? '退款执行中' : '待退款';
      }
      if (status === '退款异常') return '退款失败';
      return '未发起退款';
    }

    // 仅退款：审核通过后即有退款单
    if (status === '已完成') return '退款成功';
    if (status === '退款中') {
      if (isPostSettlement(settleStatus)) return '待退款';
      return i % 4 === 1 ? '退款执行中' : '待退款';
    }
    if (status === '退款异常') return '退款失败';
    return '未发起退款';
  }

  /** 换货 / 补货不走退款态；仅退款不走退货环节 */
  function resolveTicketStatus(type, i) {
    if (type === '换货') {
      var exchangeStatuses = ['待审批', '已拒绝', '待退货', '待收货', '已完成', '已取消'];
      return i % 2 === 0 ? '已完成' : exchangeStatuses[Math.floor(i / 2) % exchangeStatuses.length];
    }
    if (type === '补货') {
      var restockStatuses = ['待审批', '已拒绝', '待收货', '已完成', '已取消'];
      return i % 2 === 0 ? '已完成' : restockStatuses[Math.floor(i / 2) % restockStatuses.length];
    }
    if (type === '仅退款') {
      var refundOnlyStatuses = ['待审批', '退款中', '已拒绝', '退款异常', '已完成', '已取消'];
      return i % 2 === 0 ? '已完成' : refundOnlyStatuses[Math.floor(i / 2) % refundOnlyStatuses.length];
    }
    if (type === '退货退款') {
      var returnRefundStatuses = ['待审批', '已拒绝', '待退货', '待收货', '退款中', '退款异常', '已完成', '已取消'];
      return i % 2 === 0 ? '已完成' : returnRefundStatuses[Math.floor(i / 2) % returnRefundStatuses.length];
    }
    return i % 2 === 0 ? '已完成' : STATUSES[Math.floor(i / 2) % STATUSES.length];
  }

  /**
   * 履约方式：
   * - 代采：快递 / 配送
   * - 零售：快递 / 自提
   */
  function resolveFulfillment(orderSource, i) {
    if (orderSource === '代采') return i % 2 === 0 ? '快递' : '配送';
    return i % 2 === 0 ? '快递' : '自提';
  }

  /** 商品信息展示用履约后缀：平台配送 / 快递配送 / 门店自提 */
  function productFulfillmentLabel(fulfillment) {
    if (fulfillment === '配送') return '平台配送';
    if (fulfillment === '自提') return '门店自提';
    return '快递配送';
  }

  function buildProductTitle(name, fulfillment) {
    return String(name || '') + '-' + productFulfillmentLabel(fulfillment);
  }

  /**
   * 各售后类型对应业务状态（与详情状态矩阵对齐）
   * - 仅退款：无寄回环节
   * - 退货退款：含待退货 / 待收货 / 退款中
   * - 补货：无退款态，审核后待收货
   * - 换货：无退款态
   */
  function statusListByType(type) {
    if (type === '仅退款') {
      return ['待审批', '已拒绝', '退款中', '退款异常', '已完成', '已取消'];
    }
    if (type === '退货退款') {
      return ['待审批', '已拒绝', '待退货', '待收货', '退款中', '退款异常', '已完成', '已取消'];
    }
    if (type === '补货') {
      return ['待审批', '已拒绝', '待收货', '已完成', '已取消'];
    }
    if (type === '换货') {
      return ['待审批', '已拒绝', '待退货', '待收货', '已完成', '已取消'];
    }
    return STATUSES.slice();
  }

  /**
   * 按订单来源 × 履约方式 × 售后类型 × 状态铺演示数据，保证筛选可覆盖全矩阵
   */
  function buildMatrixRows(opts) {
    var orderSource = opts.orderSource;
    var fulfillments = opts.fulfillments || [];
    var types = opts.types || TYPES;
    var idPrefix = opts.idPrefix || 'AS-335';
    var seqBase = opts.seqBase || 0;
    var list = [];
    var seq = 0;
    types.forEach(function (type) {
      fulfillments.forEach(function (fulfillment) {
        statusListByType(type).forEach(function (status) {
          list.push(
            makeRow(
              {
                type: type,
                status: status,
                orderSource: orderSource,
                fulfillment: fulfillment,
                idPrefix: idPrefix,
                applyAmt:
                  type === '退货退款' || type === '仅退款'
                    ? orderSource === '代采'
                      ? 12.5
                      : 9.9
                    : orderSource === '代采'
                      ? 8.8
                      : 6.6
              },
              seqBase + seq++
            )
          );
        });
      });
    });
    return list;
  }

  function pad(n, len) {
    var s = String(n);
    while (s.length < (len || 2)) s = '0' + s;
    return s;
  }

  function money(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function makeRow(opts, i) {
    var type = opts.type;
    var status = opts.status;
    var orderSource = opts.orderSource;
    var fulfillment = opts.fulfillment;
    var applyAmt = opts.applyAmt != null ? opts.applyAmt : [0.03, 0.02, 2.75, 0.75, 2.0, 0.1, 0.04, 1.2][i % 8];
    var settleStatus = opts.settleStatus || resolveSettleStatus(type, status, i);
    var refundExec = resolveRefundExec(type, status, i, settleStatus);
    var hasRefund = createsRefundDoc(type);
    var day = pad((i % 28) + 1);
    var hour = pad(10 + (i % 10));
    var minute = pad((i * 3) % 60);
    var second = pad((i * 7) % 60);
    var occurAt = '2026-07-14 ' + hour + ':' + minute + ':' + second;
    var applyAt = '2026-07-14 ' + hour + ':' + minute + ':' + pad(Math.max(0, parseInt(second, 10) - 1), 2);
    var idPrefix = opts.idPrefix || 'AS-335';
    return {
      id: idPrefix + String(300000000000000 + i * 117 + day).slice(0, 15),
      source: SOURCES[i % SOURCES.length],
      type: type,
      status: status,
      orderSource: orderSource,
      liveSession: '-',
      fulfillment: fulfillment,
      nickname: NICKNAMES[i % NICKNAMES.length],
      phone: PHONES[i % PHONES.length],
      store: STORES[i % STORES.length],
      storeAddress: ADDRESSES[i % ADDRESSES.length],
      productName: opts.productName || PRODUCTS[i % PRODUCTS.length],
      productSpec: opts.productSpec || PRODUCT_SPECS[i % PRODUCT_SPECS.length],
      productSku: opts.productSku || PRODUCT_SKUS[i % PRODUCT_SKUS.length],
      productTitle: buildProductTitle(
        opts.productName || PRODUCTS[i % PRODUCTS.length],
        fulfillment
      ),
      applyAmount: money(applyAmt),
      approveAmount: money(applyAmt),
      refundExecStatus: refundExec,
      actualAmount:
        hasRefund && refundExec === '退款成功'
          ? money(applyAmt)
          : hasRefund && refundExec !== '未发起退款'
            ? money(applyAmt)
            : '0.00',
      couponAmount: '0.00',
      pointsAmount: 0,
      reason: pickRowReason(type, i),
      approver: APPROVERS[i % APPROVERS.length],
      settleStatus: settleStatus,
      occurTime: occurAt,
      approveTime: occurAt,
      applyTime: applyAt,
      updateTime:
        '2026-07-14 ' + hour + ':' + pad((parseInt(minute, 10) + 1) % 60) + ':' + pad((parseInt(second, 10) + 8) % 60),
      orderNo: 'ORD-3212689' + pad(200000 + i, 7)
    };
  }

  /**
   * 代采演示矩阵：仅退款/退货退款/补货/换货 × 快递/配送 × 各业务状态
   * 筛「订单来源=代采」可覆盖配送、快递全状态
   */
  function buildProxyDemoRows(seqBase) {
    return buildMatrixRows({
      orderSource: '代采',
      fulfillments: ['快递', '配送'],
      types: ['仅退款', '退货退款', '补货', '换货'],
      idPrefix: 'AS-PX',
      seqBase: seqBase || 0
    });
  }

  /**
   * 零售演示矩阵：仅退款/退货退款/补货/换货 × 快递/自提 × 各业务状态
   * 筛「订单来源=零售」可覆盖自提、快递全状态
   */
  function buildRetailDemoRows(seqBase) {
    return buildMatrixRows({
      orderSource: '零售',
      fulfillments: ['快递', '自提'],
      types: ['仅退款', '退货退款', '补货', '换货'],
      idPrefix: 'AS-RT',
      seqBase: seqBase || 0
    });
  }

  /** 零售 / 代采交错排列，避免首页全是代采 */
  function buildMockRows() {
    var retail = buildRetailDemoRows(0);
    var proxy = buildProxyDemoRows(retail.length);
    var list = [];
    var max = Math.max(retail.length, proxy.length);
    var i;
    for (i = 0; i < max; i++) {
      if (i < retail.length) list.push(retail[i]);
      if (i < proxy.length) list.push(proxy[i]);
    }
    return list;
  }

  var persistedFreightRows =
    window.FreightRefundAftersaleStore &&
    typeof window.FreightRefundAftersaleStore.read === 'function'
      ? window.FreightRefundAftersaleStore.read()
      : [];
  var ALL_ROWS = persistedFreightRows.concat(buildMockRows());

  var state = {
    page: 1,
    pageSize: 20,
    collapsed: false,
    filters: {},
    filtered: ALL_ROWS.slice()
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 售后状态：一状态一色，便于列表扫读 */
  function statusTag(status) {
    var modMap = {
      '待审批': 'pending',
      '退款中': 'refunding',
      '已拒绝': 'rejected',
      '待退货': 'return',
      '待收货': 'receive',
      '退款异常': 'exception',
      '已完成': 'done',
      '已取消': 'cancelled'
    };
    var mod = modMap[status] || 'info';
    return (
      '<span class="aftersale-tag aftersale-tag--' +
      mod +
      '">' +
      escapeHtml(status) +
      '</span>'
    );
  }

  function refundExecTag(status) {
    var cls = 'aftersale-tag aftersale-tag--info';
    if (status === '退款成功') cls = 'aftersale-tag aftersale-tag--success';
    else if (status === '退款失败') cls = 'aftersale-tag aftersale-tag--danger';
    else if (status === '待退款' || status === '退款执行中') {
      cls = 'aftersale-tag aftersale-tag--warning';
    }
    return '<span class="' + cls + '">' + escapeHtml(status) + '</span>';
  }

  function settleStatusTag(status) {
    var cls = 'aftersale-tag aftersale-tag--info';
    if (status === '已结款') cls = 'aftersale-tag aftersale-tag--success';
    else if (status === '结款中' || status === '待结款') cls = 'aftersale-tag aftersale-tag--warning';
    return '<span class="' + cls + '" title="' + escapeHtml(settleStatusLabel(status)) + '">' + escapeHtml(settleStatusLabel(status)) + '</span>';
  }

  /**
   * 商品信息：单行省略「商品名-履约后缀」；悬停黑底气泡展示全称 / 规格 / SKU
   */
  function renderProductCell(row) {
    var title = row.productTitle || buildProductTitle(row.productName, row.fulfillment);
    var spec = row.productSpec || '-';
    var sku = row.productSku || '-';
    return (
      '<div class="aftersale-product-cell">' +
      '<span class="aftersale-product-cell__text">' +
      escapeHtml(title) +
      '</span>' +
      '<div class="aftersale-product-tip" role="tooltip">' +
      '<div class="aftersale-product-tip__line">' +
      escapeHtml(title) +
      '</div>' +
      '<div class="aftersale-product-tip__line">' +
      escapeHtml(spec) +
      '</div>' +
      '<div class="aftersale-product-tip__line">' +
      escapeHtml(sku) +
      '</div>' +
      '</div></div>'
    );
  }

  function detailLinkAttrs(row) {
    return (
      ' class="aftersale-link js-as-detail" data-id="' +
      escapeHtml(row.id) +
      '" data-status="' +
      escapeHtml(row.status) +
      '" data-type="' +
      escapeHtml(row.type) +
      '" data-order-source="' +
      escapeHtml(row.orderSource) +
      '" data-delivery="' +
      escapeHtml(row.fulfillment) +
      '" data-settle-status="' +
      escapeHtml(row.settleStatus || '待结算') +
      '" data-refund-exec="' +
      escapeHtml(row.refundExecStatus || '') +
      '" data-reason="' +
      escapeHtml(row.reason || '') +
      '" data-refund-scene="' +
      escapeHtml(row.refundScene || '') +
      '"'
    );
  }

  function renderActionCell(row) {
    var html =
      '<td class="aftersale-table__td aftersale-table__td--action">' +
      '<div class="aftersale-action">' +
      '<a href="#"' +
      detailLinkAttrs(row) +
      '>查看详情</a>';
    if (row.status === '待审批') {
      html +=
        '<div class="aftersale-more">' +
        '<button type="button" class="aftersale-more__trigger js-as-more" aria-expanded="false" data-id="' +
        escapeHtml(row.id) +
        '">更多<svg class="aftersale-more__caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="aftersale-more__menu" role="menu">' +
        '<button type="button" class="aftersale-more__item js-as-cancel" role="menuitem" data-id="' +
        escapeHtml(row.id) +
        '">取消售后单</button>' +
        '</div>' +
        '</div>';
    }
    html += '</div></td>';
    return html;
  }

  function readFilters() {
    state.filters = {
      ticketNo: (($('asTicketNo') || {}).value || '').trim(),
      orderNo: (($('asOrderNo') || {}).value || '').trim(),
      orderSource: ($('asOrderSource') || {}).value || '',
      phone: (($('asUserPhone') || {}).value || '').trim(),
      productName: (($('asProductName') || {}).value || '').trim(),
      type: ($('asType') || {}).value || '',
      status: ($('asStatus') || {}).value || '',
      refundExecStatus: ($('asRefundExecStatus') || {}).value || '',
      reason: ($('asReason') || {}).value || '',
      applyMin: ($('asApplyAmountMin') || {}).value || '',
      applyMax: ($('asApplyAmountMax') || {}).value || '',
      approver: ($('asApprover') || {}).value || '',
      execMin: ($('asExecAmountMin') || {}).value || '',
      execMax: ($('asExecAmountMax') || {}).value || '',
      source: ($('asSource') || {}).value || '',
      liveSession: (($('asLiveSession') || {}).value || '').trim(),
      applyStart: (($('asApplyTimeStart') || {}).value || '').trim(),
      applyEnd: (($('asApplyTimeEnd') || {}).value || '').trim(),
      approveStart: (($('asApproveTimeStart') || {}).value || '').trim(),
      approveEnd: (($('asApproveTimeEnd') || {}).value || '').trim(),
      refundStart: (($('asRefundTimeStart') || {}).value || '').trim(),
      refundEnd: (($('asRefundTimeEnd') || {}).value || '').trim()
    };
  }

  function inRange(val, min, max) {
    var n = parseFloat(val);
    if (isNaN(n)) return false;
    if (min !== '' && !isNaN(parseFloat(min)) && n < parseFloat(min)) return false;
    if (max !== '' && !isNaN(parseFloat(max)) && n > parseFloat(max)) return false;
    return true;
  }

  function matchRow(row) {
    var f = state.filters;
    if (f.ticketNo && row.id.indexOf(f.ticketNo) < 0) return false;
    if (f.orderNo && String(row.orderNo).indexOf(f.orderNo) < 0) return false;
    if (f.orderSource && row.orderSource !== f.orderSource) return false;
    if (f.phone && row.phone.indexOf(f.phone) < 0) return false;
    if (
      f.productName &&
      row.productName.indexOf(f.productName) < 0 &&
      String(row.productTitle || '').indexOf(f.productName) < 0 &&
      String(row.productSku || '').indexOf(f.productName) < 0
    ) {
      return false;
    }
    if (f.type && row.type !== f.type) return false;
    if (f.status && row.status !== f.status) return false;
    if (f.refundExecStatus && row.refundExecStatus !== f.refundExecStatus) return false;
    if (f.reason && row.reason !== f.reason) return false;
    if ((f.applyMin || f.applyMax) && !inRange(row.applyAmount, f.applyMin, f.applyMax)) return false;
    if (f.approver && row.approver !== f.approver) return false;
    if ((f.execMin || f.execMax) && !inRange(row.actualAmount, f.execMin, f.execMax)) return false;
    if (f.source && row.source !== f.source) return false;
    if (f.liveSession && row.liveSession.indexOf(f.liveSession) < 0) return false;
    if (f.applyStart && row.applyTime < f.applyStart) return false;
    if (f.applyEnd && row.applyTime > f.applyEnd) return false;
    if (f.approveStart && row.approveTime < f.approveStart) return false;
    if (f.approveEnd && row.approveTime > f.approveEnd) return false;
    if (f.refundStart && row.updateTime < f.refundStart) return false;
    if (f.refundEnd && row.updateTime > f.refundEnd) return false;
    return true;
  }

  function applyFilters() {
    state.filtered = ALL_ROWS.filter(matchRow);
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function renderTable() {
    var tbody = $('asTicketTableBody');
    var empty = $('asTicketEmpty');
    var totalEl = $('asTicketTotal');
    if (!tbody) return;

    var start = (state.page - 1) * state.pageSize;
    var rows = state.filtered.slice(start, start + state.pageSize);
    if (totalEl) totalEl.textContent = '共 ' + state.filtered.length + ' 条';

    if (!rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
      renderPagination();
      return;
    }
    if (empty) empty.hidden = true;

    tbody.innerHTML = rows
      .map(function (row) {
        return (
          '<tr data-id="' +
          escapeHtml(row.id) +
          '" data-order-no="' +
          escapeHtml(row.orderNo) +
          '" data-type="' +
          escapeHtml(row.type) +
          '" data-status="' +
          escapeHtml(row.status) +
          '" data-order-source="' +
          escapeHtml(row.orderSource) +
          '" data-apply-amount="' +
          escapeHtml(row.applyAmount) +
          '" data-refund-exec="' +
          escapeHtml(row.refundExecStatus) +
          '" data-refund-scene="' +
          escapeHtml(row.refundScene || '') +
          '">' +
          '<td class="aftersale-table__td aftersale-table__td--ticket"><a href="#"' +
          detailLinkAttrs(row) +
          '>' +
          escapeHtml(row.id) +
          '</a></td>' +
          '<td>' +
          escapeHtml(row.source) +
          '</td>' +
          '<td>' +
          escapeHtml(row.type) +
          '</td>' +
          '<td>' +
          statusTag(row.status) +
          '</td>' +
          '<td>' +
          escapeHtml(row.orderSource) +
          '</td>' +
          '<td>' +
          escapeHtml(row.liveSession) +
          '</td>' +
          '<td>' +
          escapeHtml(row.fulfillment) +
          '</td>' +
          '<td><div class="aftersale-user"><span>' +
          escapeHtml(row.nickname) +
          '</span><span class="aftersale-user__phone">' +
          escapeHtml(row.phone) +
          '</span></div></td>' +
          '<td>' +
          escapeHtml(row.store) +
          '</td>' +
          '<td><span class="aftersale-ellipsis" title="' +
          escapeHtml(row.storeAddress) +
          '">' +
          escapeHtml(row.storeAddress) +
          '</span></td>' +
          '<td class="aftersale-table__td--product">' +
          renderProductCell(row) +
          '</td>' +
          '<td>' +
          escapeHtml(row.applyAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.approveAmount) +
          '</td>' +
          '<td>' +
          refundExecTag(row.refundExecStatus) +
          '</td>' +
          '<td>' +
          escapeHtml(row.actualAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.couponAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.pointsAmount) +
          '</td>' +
          '<td>' +
          escapeHtml(row.reason) +
          '</td>' +
          '<td>' +
          escapeHtml(row.approver) +
          '</td>' +
          '<td>' +
          settleStatusTag(row.settleStatus) +
          '</td>' +
          '<td>' +
          escapeHtml(row.occurTime) +
          '</td>' +
          '<td>' +
          escapeHtml(row.approveTime) +
          '</td>' +
          '<td>' +
          escapeHtml(row.applyTime) +
          '</td>' +
          '<td>' +
          escapeHtml(row.updateTime) +
          '</td>' +
          renderActionCell(row) +
          '</tr>'
        );
      })
      .join('');

    renderPagination();
  }

  function renderPagination() {
    var pagesEl = $('asTicketPages');
    var jumpEl = $('asTicketJump');
    if (!pagesEl) return;
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    var page = state.page;
    if (jumpEl) jumpEl.value = String(page);

    var html =
      '<button type="button" class="aftersale-page-btn" data-page="' +
      (page - 1) +
      '"' +
      (page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>';

    var start = Math.max(1, page - 2);
    var end = Math.min(totalPages, start + 5);
    start = Math.max(1, end - 5);
    for (var i = start; i <= end; i++) {
      html +=
        '<button type="button" class="aftersale-page-btn' +
        (i === page ? ' is-active' : '') +
        '" data-page="' +
        i +
        '">' +
        i +
        '</button>';
    }
    html +=
      '<button type="button" class="aftersale-page-btn" data-page="' +
      (page + 1) +
      '"' +
      (page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function refresh(resetPage) {
    if (resetPage) state.page = 1;
    readFilters();
    applyFilters();
    renderTable();
  }

  function bindEvents() {
    var queryBtn = $('asTicketQuery');
    var resetBtn = $('asTicketReset');
    var collapseBtn = $('asTicketCollapse');
    var sizeEl = $('asTicketPageSize');
    var pagesEl = $('asTicketPages');
    var jumpGo = $('asTicketJumpGo');
    var jumpEl = $('asTicketJump');
    var tbody = $('asTicketTableBody');

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        refresh(true);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = $('asTicketFilterForm');
        if (form) form.reset();
        syncReasonFilterOptions(false);
        refresh(true);
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        state.collapsed = !state.collapsed;
        var grid = $('asTicketFilterGrid');
        var label = $('asTicketCollapseLabel');
        if (grid) grid.classList.toggle('is-collapsed', state.collapsed);
        if (label) label.textContent = state.collapsed ? '展开' : '收起';
        collapseBtn.setAttribute('aria-expanded', state.collapsed ? 'false' : 'true');
        var svg = collapseBtn.querySelector('svg path');
        if (svg) svg.setAttribute('d', state.collapsed ? 'M6 9l6 6 6-6' : 'M18 15l-6-6-6 6');
      });
    }

    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        refresh(true);
      });
    }

    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.aftersale-page-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.getAttribute('data-page'), 10);
        if (!p || p === state.page) return;
        state.page = p;
        renderTable();
      });
    }

    function jumpTo() {
      var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      var val = parseInt((jumpEl && jumpEl.value) || '1', 10);
      if (!val || val < 1) val = 1;
      if (val > totalPages) val = totalPages;
      state.page = val;
      renderTable();
    }

    if (jumpGo) jumpGo.addEventListener('click', jumpTo);
    if (jumpEl) {
      jumpEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          jumpTo();
        }
      });
    }

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var moreBtn = e.target.closest('.js-as-more');
        if (moreBtn) {
          e.preventDefault();
          e.stopPropagation();
          var wrap = moreBtn.closest('.aftersale-more');
          var willOpen = wrap && !wrap.classList.contains('is-open');
          closeAllMoreMenus();
          if (willOpen && wrap) {
            wrap.classList.add('is-open');
            moreBtn.setAttribute('aria-expanded', 'true');
            var actionTd = wrap.closest('.aftersale-table__td--action');
            if (actionTd) actionTd.classList.add('is-more-open');
            positionMoreMenu(wrap, moreBtn);
          }
          return;
        }

        var cancelBtn = e.target.closest('.js-as-cancel');
        if (cancelBtn) {
          e.preventDefault();
          e.stopPropagation();
          var cancelId = cancelBtn.getAttribute('data-id');
          cancelAftersale(cancelId);
          closeAllMoreMenus();
          return;
        }

        var link = e.target.closest('.js-as-detail');
        if (!link) return;
        e.preventDefault();
        var id = link.getAttribute('data-id');
        var status = link.getAttribute('data-status') || '';
        var type = link.getAttribute('data-type') || '';
        var orderSource = link.getAttribute('data-order-source') || '';
        var delivery = link.getAttribute('data-delivery') || '';
        var settleStatus = link.getAttribute('data-settle-status') || '待结算';
        var refundExec = link.getAttribute('data-refund-exec') || '';
        var reason = link.getAttribute('data-reason') || '';
        var refundScene = link.getAttribute('data-refund-scene') || '';
        var wp = window.wmsPath;
        var base =
          wp && typeof wp.page === 'function'
            ? wp.page('mdm_aftersale_ticket_detail.html')
            : 'mdm_aftersale_ticket_detail.html';
        window.location.href =
          base +
          '?id=' +
          encodeURIComponent(id || '') +
          '&status=' +
          encodeURIComponent(status) +
          '&type=' +
          encodeURIComponent(type) +
          '&orderSource=' +
          encodeURIComponent(orderSource) +
          '&delivery=' +
          encodeURIComponent(delivery) +
          '&settleStatus=' +
          encodeURIComponent(settleStatus) +
          (refundExec
            ? '&refundExec=' + encodeURIComponent(refundExec)
            : '') +
          (reason ? '&reason=' + encodeURIComponent(reason) : '') +
          (refundScene ? '&refundScene=' + encodeURIComponent(refundScene) : '');
      });
    }

    var typeFilter = $('asType');
    if (typeFilter) {
      typeFilter.addEventListener('change', function () {
        syncReasonFilterOptions(true);
      });
    }

    document.addEventListener('click', function () {
      closeAllMoreMenus();
    });

    var tableWrap = document.querySelector('.aftersale-table-wrap');
    if (tableWrap) {
      tableWrap.addEventListener('scroll', function () {
        closeAllMoreMenus();
      });
    }
    window.addEventListener('resize', function () {
      closeAllMoreMenus();
    });
  }

  function closeAllMoreMenus() {
    document.querySelectorAll('.aftersale-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
      var btn = el.querySelector('.js-as-more');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      var td = el.closest('.aftersale-table__td--action');
      if (td) td.classList.remove('is-more-open');
      var menu = el.querySelector('.aftersale-more__menu');
      if (menu) {
        menu.classList.remove('is-fixed');
        menu.style.top = '';
        menu.style.left = '';
      }
    });
  }

  function positionMoreMenu(wrap, trigger) {
    var menu = wrap.querySelector('.aftersale-more__menu');
    if (!menu || !trigger) return;
    var rect = trigger.getBoundingClientRect();
    var menuWidth = Math.max(108, menu.offsetWidth || 108);
    var left = rect.left + rect.width / 2 - menuWidth / 2;
    var top = rect.bottom + 10;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    menu.classList.add('is-fixed');
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }

  function cancelAftersale(id) {
    var found = null;
    for (var i = 0; i < ALL_ROWS.length; i++) {
      if (ALL_ROWS[i].id === id) {
        found = ALL_ROWS[i];
        found.status = '已取消';
        found.refundExecStatus = '未发起退款';
        break;
      }
    }
    if (!found) return;
    applyFilters();
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    renderTable();
    if (typeof showToast === 'function') showToast('已取消售后单：' + id, 'success');
  }

  function init() {
    syncReasonFilterOptions(false);
    bindEvents();
    refresh(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
