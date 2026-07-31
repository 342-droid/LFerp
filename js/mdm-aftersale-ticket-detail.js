/**
 * 售后详情 — 按状态/类型分支
 * 对齐用户端我要进货：仅退款 / 退货退款 / 补货 / 换货
 *
 * 状态矩阵要点：
 * - 仅退款：审核通过 → 退款中/待退款 →（通道）退款执行中 → 已完成/退款成功 或 退款异常/退款失败
 * - 退货退款（快递）：审核通过 → 待退货 → 上传物流 → 待收货 → 确认收货 → 退款中/待退款 → …
 * - 退货退款（自提）：审核通过 → 待退货（退回门店）→ 门店确认收货 → 退款中（自动生成退款单）
 * - 退货退款（配送）：审核通过 → 待退货 → 已取货 → 待收货 → 仓库入仓 → 退款中
 * - 换货：退货腿同履约（自提门店 / 配送入仓 / 快递寄回），收货后进入换出
 * - 补货：无退款单；审核通过 → 待收货 → 已完成
 *   · 代采（快递/配送）、零售自提：下发「采购补货指令」（字段「订货单号」）
 *   · 零售快递：绕过仓储，直接与供应商对接补货，无采购补货指令；
 *     供应商寄回后由后台上传物流，确认收货时填写实际收到数量
 *   · 关闭补货（实际数量回写售后单）：
 *     1) 后台「确认收货」；2) 门店/用户端「确认收货」；
 *     3) 快递：上传物流后满 10 天自动确认（实际补货数=申请数）；
 *     4) 代采配送：待收货满 10 天自动确认；门店收货入库反写关闭；
 *     5) 零售自提：待核销满 10 天自动确认（原单核销不反写关闭补货）
 */
(function () {
  var CHECK_SVG =
    '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHECK_LG_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5l4 4 8-9" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var EDIT_SVG =
    '<svg class="aftersale-goods-edit__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 10.5l.4-1.8L10.8 3.3a1 1 0 011.4 0l.5.5a1 1 0 010 1.4L7.3 10.1 5.5 10.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  var FILE_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6"/><path d="M14 3v5h5" stroke="currentColor" stroke-width="1.6"/></svg>';

  var ALL_TYPES = ['仅退款', '退货退款', '补货', '换货'];
  var GOODS_STATUS_OPTIONS = ['已收到货', '未收到货'];
  var SUPPLIER_RECEIVE_ADDR_KEY = 'mdm_supplier_receive_addr_v1';
  var DEMO_SUPPLIER_ID = 'SUP-DEMO-001';
  /** 售后寄回物流公司下拉（快递100常用热门，含扩展项） */
  var COURIERS = [
    '顺丰速运',
    '中通快递',
    '圆通速递',
    '韵达快递',
    '申通快递',
    '极兔速递',
    '京东物流',
    'EMS',
    '邮政快递包裹',
    '德邦快递',
    '德邦物流',
    '中通快运',
    '安能物流',
    '跨越速运',
    '壹米滴答',
    '百世快运',
    '丹鸟',
    '宅急送',
    '韵达快运',
    '顺心捷达',
    '优速快递',
    '丰网速运',
    '苏宁物流',
    '百世快递'
  ];
  /** 与用户端取消寄件 / 关闭退货原因保持一致 */
  var CANCEL_PICKUP_REASONS = [
    '信息填错了(需修改取件时间/地址等)',
    '想去附近的服务点寄件',
    '计划有变，暂时不需要寄了',
    '我想换个上门取件时间',
    '快递员未按时上门/上门慢',
    '快递员不上门',
    '快递员服务不好（不上门/推脱/态度差）',
    '物品类型无法邮寄',
    '快递员反馈因运力紧张暂无法揽收'
  ];
  var CLOSE_RETURN_REASONS = CANCEL_PICKUP_REASONS.slice();
  var TRACKING_COURIER_RULES = [
    { courier: '顺丰速运', test: function (no) { return /^SF/i.test(no); } },
    { courier: '圆通速递', test: function (no) { return /^YT/i.test(no); } },
    { courier: '京东物流', test: function (no) { return /^JD/i.test(no) || /^VA/i.test(no); } },
    {
      courier: '中通快递',
      test: function (no) {
        return /^ZT/i.test(no) || /^75\d{11,}$/.test(no) || /^78\d{11,}$/.test(no);
      }
    },
    {
      courier: '申通快递',
      test: function (no) {
        return /^77\d{11,}$/.test(no) || /^772\d{10,}$/.test(no);
      }
    },
    {
      courier: '韵达快递',
      test: function (no) {
        return /^43\d{11,}$/.test(no) || /^31\d{11,}$/.test(no);
      }
    }
  ];

  function inferCourierFromTrackingNo(trackingNo) {
    var no = String(trackingNo || '').trim().toUpperCase();
    if (!no) return '';
    for (var i = 0; i < TRACKING_COURIER_RULES.length; i++) {
      if (TRACKING_COURIER_RULES[i].test(no)) return TRACKING_COURIER_RULES[i].courier;
    }
    return '';
  }

  function renderCourierOptions(selected) {
    var cur = selected || '';
    return (
      '<option value="">请选择物流公司</option>' +
      COURIERS.map(function (c) {
        return (
          '<option value="' +
          escapeHtml(c) +
          '"' +
          (cur === c ? ' selected' : '') +
          '>' +
          escapeHtml(c) +
          '</option>'
        );
      }).join('')
    );
  }

  /** 物流单号在前，物流公司下拉在后；输入单号可自动识别公司 */
  function renderShipFormFields(company, trackingNo) {
    return (
      '<div class="aftersale-flow-form">' +
      '<label class="aftersale-flow-form__field">物流单号' +
      '<input class="aftersale-filter-field__input" id="asShipNo" type="text" maxlength="50" ' +
      'placeholder="请输入物流单号，将自动识别物流公司" value="' +
      escapeHtml(trackingNo || '') +
      '"></label>' +
      '<label class="aftersale-flow-form__field">物流公司' +
      '<select class="aftersale-filter-field__input aftersale-flow-form__select" id="asShipCompany" aria-label="物流公司">' +
      renderCourierOptions(company) +
      '</select>' +
      '</label></div>'
    );
  }

  function bindShipFormAutoCourier() {
    var trackingInput = $('asShipNo');
    var courierSelect = $('asShipCompany');
    if (!trackingInput || !courierSelect) return;
    if (window.LogisticsTrackingNo) window.LogisticsTrackingNo.bindInput(trackingInput);

    function applyCourierFromTracking() {
      var inferred = inferCourierFromTrackingNo(trackingInput.value);
      if (inferred) courierSelect.value = inferred;
    }

    trackingInput.addEventListener('input', applyCourierFromTracking);
    trackingInput.addEventListener('blur', applyCourierFromTracking);
    applyCourierFromTracking();
  }

  function readValidatedTrackingNo(inputId) {
    var el = $(inputId);
    var raw = el ? el.value : '';
    var result =
      window.LogisticsTrackingNo && typeof window.LogisticsTrackingNo.validate === 'function'
        ? window.LogisticsTrackingNo.validate(raw)
        : {
            ok: !!String(raw || '').trim(),
            value: String(raw || '').trim(),
            message: '请输入物流单号'
          };
    if (!result.ok) {
      if (window.LogisticsTrackingNo && window.LogisticsTrackingNo.toastError) {
        window.LogisticsTrackingNo.toastError(result);
      } else if (typeof showToast === 'function') {
        showToast(result.message || '请输入物流单号', 'error');
      }
      return null;
    }
    if (el) el.value = result.value;
    return result.value;
  }

  var REASON_GROUPS = [
    { key: 'customer', label: '客户原因', tags: ['保存不当', '取货时间太晚', '恶意售后'] },
    { key: 'store', label: '门店原因', tags: ['保存不当', '丢失', '恶意售后'] },
    { key: 'delivery', label: '配送原因', tags: ['压伤', '失温', '晚点', '丢失'] },
    { key: 'warehouse', label: '仓库原因', tags: ['保存不当', '压伤', '分拣不及时', '分拣少件'] },
    { key: 'supplier', label: '供应商原因', tags: ['以次充好', '缺斤少两'] }
  ];

  var state = {
    detail: null,
    approveType: '仅退款',
    remark: '',
    selectedAddrId: '',
    addrList: [],
    cancelShipReason: '',
    auditAction: '',
    /** 行内编辑：货物状态下拉 / 商品明细文本框 */
    editing: {
      goodsStatus: false,
      amountIdx: -1,
      qtyIdx: -1
    }
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

  function queryParam(name) {
    var m = new RegExp('(?:\\?|&)' + name + '=([^&]*)').exec(window.location.search || '');
    return m ? decodeURIComponent(m[1]) : '';
  }

  function money(n) {
    var num = typeof n === 'number' ? n : parseFloat(n);
    if (isNaN(num)) return '¥0.00';
    return '¥' + (Math.round(num * 100) / 100).toFixed(2);
  }

  function listHref() {
    var wp = window.wmsPath;
    if (wp && typeof wp.page === 'function') return wp.page('mdm_aftersale_ticket.html');
    return 'mdm_aftersale_ticket.html';
  }

  function nowText() {
    var d = new Date();
    function p(n) {
      return n < 10 ? '0' + n : '' + n;
    }
    return (
      d.getFullYear() +
      '-' +
      p(d.getMonth() + 1) +
      '-' +
      p(d.getDate()) +
      ' ' +
      p(d.getHours()) +
      ':' +
      p(d.getMinutes()) +
      ':' +
      p(d.getSeconds())
    );
  }

  function isPending(status) {
    return status === '待审批';
  }

  function isApprovedDone(status) {
    return status === '已完成';
  }

  function typeActionLabel(type) {
    if (type === '补货') return '补货';
    if (type === '换货') return '换货';
    if (type === '退货退款') return '退货退款';
    return '仅退款';
  }

  /** 仅「仅退款 / 退货退款」会生成退款单；换货、补货不产生退款 */
  function createsRefundDoc(type) {
    return type === '仅退款' || type === '退货退款';
  }

  /** 结算状态：待结算 | 待结款 | 结款中 | 已结款 */
  function settleStatusLabel(status) {
    return status || '待结算';
  }

  /**
   * 结算表已生成之后：待结款 / 结款中 / 已结款
   * 仍统一生成退款单；退款方式为线下付款，由平台在「退款单」上传凭证
   */
  function isPostSettlement(detail) {
    var s = detail && detail.settleStatus;
    return s === '待结款' || s === '结款中' || s === '已结款';
  }

  /** 仅退款 / 退货退款在到达退款节点时统一生成退款单（零售、代采，结算前后均适用） */
  function shouldAutoCreateRefundTicket(detail) {
    return createsRefundDoc(detail && detail.type);
  }

  function isOfflineRefundTicket(ticket, detail) {
    if (ticket && ticket.method === '线下付款') return true;
    return !!(detail && isPostSettlement(detail));
  }

  /** 申请时订单处于待收货 / 待自提 / 已完成 */
  function isPostReceiveOrderStatus(orderStatus) {
    return orderStatus === '待收货' || orderStatus === '待自提' || orderStatus === '已完成';
  }

  function isPreShipOrderStatus(orderStatus) {
    return orderStatus === '待发货';
  }

  function applyInfoType(detail) {
    return isPending(detail.status) ? state.approveType : detail.type;
  }

  /**
   * 货物状态展示规则（按售后类型 + 申请时订单状态）：
   * - 补货 / 待发货仅退款：展示「/」，不可改
   * - 待收货(待自提)/已完成 + 仅退款：可选已收到货/未收到货，待审批时可改
   * - 待收货(待自提)/已完成 + 退货退款：固定已收到货，不可改
   */
  function resolveGoodsStatusMode(type, orderStatus) {
    if (type === '补货') {
      return { mode: 'na', value: '/' };
    }
    if (type === '仅退款' && isPreShipOrderStatus(orderStatus)) {
      return { mode: 'na', value: '/' };
    }
    if (type === '仅退款' && isPostReceiveOrderStatus(orderStatus)) {
      return { mode: 'editable', value: null };
    }
    if (type === '退货退款' && isPostReceiveOrderStatus(orderStatus)) {
      return { mode: 'fixed', value: '已收到货' };
    }
    if (type === '换货' && isPostReceiveOrderStatus(orderStatus)) {
      return { mode: 'fixed', value: '已收到货' };
    }
    return { mode: 'na', value: '/' };
  }

  function demoRefundReason(type, goodsStatus, orderStatus) {
    var fromQuery = queryParam('reason');
    if (fromQuery) return fromQuery;
    if (
      window.MdmAftersaleReasons &&
      typeof window.MdmAftersaleReasons.pickDemoReason === 'function'
    ) {
      var list =
        typeof window.MdmAftersaleReasons.getReasonList === 'function'
          ? window.MdmAftersaleReasons.getReasonList(type, goodsStatus, orderStatus)
          : [];
      if (list && list.length) return list[0];
      return window.MdmAftersaleReasons.pickDemoReason(type, 0, {
        goodsStatus: goodsStatus,
        orderStatus: orderStatus
      });
    }
    if (type === '补货') return '收到商品破损/污渍等';
    if (type === '换货') return '质量问题';
    if (type === '退货退款') return '质量问题';
    if (type === '仅退款' && isPreShipOrderStatus(orderStatus)) return '我不想要了';
    if (goodsStatus === '未收到货') return '不喜欢/不想要';
    return '质量问题';
  }

  function reasonFieldLabel(type) {
    if (
      window.MdmAftersaleReasons &&
      typeof window.MdmAftersaleReasons.getReasonFieldLabel === 'function'
    ) {
      return window.MdmAftersaleReasons.getReasonFieldLabel(type);
    }
    if (type === '补货') return '补货原因';
    if (type === '换货') return '换货原因';
    return '退款原因';
  }

  function syncGoodsStatusForType(detail, type) {
    if (!detail || !detail.apply) return;
    var mode = resolveGoodsStatusMode(type, detail.orderApplyStatus);
    if (mode.mode === 'fixed') {
      detail.apply.goodsStatus = mode.value;
    } else if (mode.mode === 'editable' && GOODS_STATUS_OPTIONS.indexOf(detail.apply.goodsStatus) < 0) {
      detail.apply.goodsStatus = '未收到货';
    }
  }

  function clearInlineEditing() {
    state.editing.goodsStatus = false;
    state.editing.amountIdx = -1;
    state.editing.qtyIdx = -1;
  }

  function getGoodsRestockDisplayQty(g) {
    if (!g) return 0;
    if (g.actualRestockQty != null && g.actualRestockQty !== '') {
      return Number(g.actualRestockQty) || 0;
    }
    return Number(g.restockQty || g.refundQty) || 0;
  }

  function refreshGoodsSummary(detail) {
    if (!detail || !detail.goods) return;
    var refundAmount = 0;
    var refundQty = 0;
    detail.goods.forEach(function (g) {
      refundAmount += Number(g.refundAmount) || 0;
      if (isRestockGoods(detail)) {
        refundQty += getGoodsRestockDisplayQty(g);
      } else {
        refundQty += Number(g.refundQty) || 0;
      }
    });
    detail.summary = detail.summary || {};
    detail.summary.refundAmount = Math.round(refundAmount * 100) / 100;
    detail.summary.refundQty = refundQty;
  }

  function applyActualRestockQty(detail, actualQty) {
    if (!detail || !detail.goods) return;
    detail.goods.forEach(function (g) {
      g.actualRestockQty = actualQty;
      g.restockQty = actualQty;
    });
    detail.actualRestockQty = actualQty;
    detail.actualRestockAt = nowText();
    refreshGoodsSummary(detail);
    if (detail.approval) detail.approval.refundQty = actualQty;
    if (detail.purchaseOrder) detail.purchaseOrder.actualQty = actualQty;
  }

  var RESTOCK_AUTO_CONFIRM_DAYS = 10;

  function parseDateTimeLoose(text) {
    if (!text) return null;
    var d = new Date(String(text).replace(/-/g, '/'));
    return isNaN(d.getTime()) ? null : d;
  }

  function getApplyRestockQtyFromDetail(detail) {
    var g = (detail && detail.goods && detail.goods[0]) || {};
    return Number(g.applyQty != null ? g.applyQty : g.restockQty || g.refundQty) || 0;
  }

  /** 补货自动确认计时锚点：快递=物流上传时间；配送/自提=进入待收货时间 */
  function getRestockAutoConfirmAnchor(detail) {
    if (!detail || detail.type !== '补货') return null;
    if (isDeliveryFulfillment(detail.deliveryMode) || isPickupFulfillment(detail.deliveryMode)) {
      return detail.restockAwaitReceiveAt || detail.approvalAt || detail.applyTime || null;
    }
    var ship = (detail.shipments || {}).restockShip;
    return (
      detail.restockShippedAt ||
      (ship && ship.uploadedAt) ||
      detail.approvalAt ||
      null
    );
  }

  function isRestockAutoConfirmDue(detail) {
    if (queryParam('autoClose') === '1') return true;
    var anchor = getRestockAutoConfirmAnchor(detail);
    var t = parseDateTimeLoose(anchor);
    if (!t) return false;
    return Date.now() - t.getTime() >= RESTOCK_AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000;
  }

  /**
   * 关闭补货并回写实际数量
   * source: manual_admin | auto_express | auto_delivery | auto_pickup | store_inbound
   * （零售自提核销不作为关闭来源；代采门店入库 store_inbound 仍有效）
   */
  function completeRestockClose(detail, actualQty, source) {
    if (!detail || detail.type !== '补货' || detail.status === '已完成') return false;
    var applyQty = getApplyRestockQtyFromDetail(detail);
    var actual = actualQty != null ? Number(actualQty) : applyQty;
    if (isNaN(actual) || actual < 0) actual = applyQty;
    if (actual > applyQty) actual = applyQty;
    applyActualRestockQty(detail, actual);
    detail.status = '已完成';
    detail.restockCloseSource = source || 'manual_admin';
    detail.restockClosedAt = nowText();
    if (detail.purchaseOrder) {
      detail.purchaseOrder.status = '补货完成';
      detail.purchaseOrder.actualQty = actual;
    }
    detail.progress = buildProgress(
      '补货',
      '已完成',
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    seedLogisticsByStatus(detail);
    return true;
  }

  /** 待收货补货：到点自动确认（实际数=申请数）；代采门店入库反写关闭 */
  function tryAutoCloseRestock(detail) {
    if (!detail || detail.type !== '补货' || detail.status !== '待收货') return false;
    var applyQty = getApplyRestockQtyFromDetail(detail);
    /* 代采配送：门店收货入库反写关闭；零售自提核销不反写 */
    if (detail.storeInboundDone) {
      return completeRestockClose(detail, applyQty, 'store_inbound');
    }
    if (!isRestockAutoConfirmDue(detail)) return false;
    if (isPickupFulfillment(detail.deliveryMode)) {
      return completeRestockClose(detail, applyQty, 'auto_pickup');
    }
    if (isDeliveryFulfillment(detail.deliveryMode)) {
      return completeRestockClose(detail, applyQty, 'auto_delivery');
    }
    var ship = (detail.shipments || {}).restockShip;
    if (ship && ship.trackingNo) {
      return completeRestockClose(detail, applyQty, 'auto_express');
    }
    return false;
  }

  function isRestockGoods(detail) {
    return goodsTableType(detail) === '补货';
  }

  function focusActiveEditor() {
    var sel = $('asGoodsStatus');
    if (sel) {
      sel.focus();
      return;
    }
    var inp = document.querySelector('.js-as-goods-input');
    if (inp) {
      inp.focus();
      if (typeof inp.select === 'function') inp.select();
    }
  }

  /** 将行内输入写入模型；校验失败返回 false */
  function applyGoodsInputValue(input) {
    if (!input || !state.detail || !state.detail.goods) return true;
    var idx = parseInt(input.getAttribute('data-idx'), 10);
    var editType = input.getAttribute('data-edit');
    var g = state.detail.goods[idx];
    if (!g || isNaN(idx)) return true;
    var raw = String(input.value || '').trim();
    if (editType === 'amount') {
      var amount = parseFloat(raw);
      if (isNaN(amount) || amount < 0) {
        if (typeof showToast === 'function') showToast('请输入有效的退款金额', 'error');
        return false;
      }
      g.refundAmount = Math.round(amount * 100) / 100;
    } else if (editType === 'qty') {
      var qty = parseInt(raw, 10);
      if (isNaN(qty) || qty < 0) {
        if (typeof showToast === 'function') {
          showToast(
            isRestockGoods(state.detail) ? '请输入有效的补货数量' : '请输入有效的退款数量',
            'error'
          );
        }
        return false;
      }
      /* 演示上限：不超过购买数量（可退/可补池细则以 C 端申请为准） */
      var buyCap = Number(g.buyQty);
      if (!isNaN(buyCap) && buyCap >= 0 && qty > buyCap) {
        if (typeof showToast === 'function') {
          showToast('数量不能超过购买数量（最多' + buyCap + '件）', 'error');
        }
        return false;
      }
      g.refundQty = qty;
      g.applyQty = qty;
      if (isRestockGoods(state.detail)) g.restockQty = qty;
    }
    refreshGoodsSummary(state.detail);
    return true;
  }

  function commitGoodsInput(input) {
    if (!applyGoodsInputValue(input)) {
      focusActiveEditor();
      return;
    }
    clearInlineEditing();
    renderPage();
  }

  function commitOpenGoodsInput() {
    var inp = document.querySelector('.js-as-goods-input');
    if (inp) applyGoodsInputValue(inp);
  }

  /**
   * 退款单：审核通过（仅退款）或确认收货（退货退款）后统一生成
   * - 结算前：原路退回（支付通道退款）
   * - 结算后：线下付款（平台在退款单页上传付款凭证）
   */
  function makeRefundTicket(trigger, detail) {
    var offline = isPostSettlement(detail);
    return {
      id: 'RF-' + String(Date.now()).slice(-12),
      createdAt: nowText(),
      /** approve | receive */
      trigger: trigger || 'approve',
      status: '待退款',
      method: offline ? '线下付款' : '原路退回'
    };
  }

  function refundTicketTriggerLabel(trigger) {
    if (trigger === 'receive') {
      if (state.detail && isPickupFulfillment(state.detail.deliveryMode)) {
        return '门店确认收货后生成';
      }
      if (state.detail && isDeliveryFulfillment(state.detail.deliveryMode)) {
        return '仓库入仓结果返回后生成';
      }
      return '供应商确认收货后生成';
    }
    return '审核通过后生成';
  }

  function refundListHref(detail, ticket) {
    var wp = window.wmsPath;
    var base =
      wp && typeof wp.page === 'function'
        ? wp.page('mdm_aftersale_refund.html')
        : 'mdm_aftersale_refund.html';
    var cash =
      detail.approval && detail.approval.refundAmount != null
        ? detail.approval.refundAmount
        : detail.applyAmount;
    var qs = [
      'refundNo=' + encodeURIComponent(ticket.id || ''),
      'aftersaleId=' + encodeURIComponent(detail.id || ''),
      'orderNo=' + encodeURIComponent((detail.order && detail.order.orderNo) || ''),
      'cash=' + encodeURIComponent(String(cash != null ? cash : '')),
      'method=' + encodeURIComponent(ticket.method || '线下付款'),
      'status=' + encodeURIComponent(ticket.status || '待退款'),
      'source=' + encodeURIComponent('售后退款'),
      'createdAt=' + encodeURIComponent(ticket.createdAt || '')
    ];
    return base + '?' + qs.join('&');
  }

  function renderRefundTicketCard(detail) {
    var ticket = detail.refundTicket;
    if (!ticket || !ticket.id) return '';
    var refundStatus = ticket.status || '待退款';
    var offline = isOfflineRefundTicket(ticket, detail);
    if (!ticket.method) ticket.method = offline ? '线下付款' : '原路退回';

    // 线下付款：售后单内不展示支付通道模拟操作（凭证在退款单处理）
    var canAdvance =
      !offline &&
      (detail.status === '退款中' ||
        detail.status === '退款异常' ||
        refundStatus === '待退款' ||
        refundStatus === '退款执行中' ||
        refundStatus === '退款失败');
    var actions = '';
    if (canAdvance && refundStatus !== '退款成功') {
      actions =
        '<div class="aftersale-flow-card__actions aftersale-info-panel__actions">' +
        (refundStatus === '待退款'
          ? '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asRefundExecuting">模拟支付通道退款中</button>'
          : '') +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asRefundSuccess">模拟退款成功</button>' +
        (refundStatus !== '退款失败'
          ? '<button type="button" class="aftersale-btn aftersale-btn--danger" id="asRefundFail">模拟退款失败</button>'
          : '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asRefundRetry">重新发起退款</button>') +
        '</div>';
    } else if (offline && refundStatus !== '退款成功') {
      actions =
        '<div class="aftersale-flow-card__actions aftersale-info-panel__actions">' +
        '<a class="aftersale-btn aftersale-btn--primary" href="' +
        escapeHtml(refundListHref(detail, ticket)) +
        '">去退款单上传凭证</a>' +
        '</div>';
    }

    var statusCls =
      refundStatus === '退款成功'
        ? 'is-ok'
        : refundStatus === '退款失败'
          ? 'is-bad'
          : refundStatus === '待退款' || refundStatus === '退款执行中'
            ? 'is-warn'
            : '';
    var grid = renderInfoGrid(
      field('退款单号', ticket.id) +
        field('退款方式', ticket.method || (offline ? '线下付款' : '原路退回')) +
        field('生成时机', refundTicketTriggerLabel(ticket.trigger)) +
        field('生成时间', ticket.createdAt || '--') +
        field('执行状态', refundStatus, {
          html:
            '<span class="aftersale-apply-field__value-text ' +
            statusCls +
            '">' +
            escapeHtml(refundStatus) +
            '</span>'
        }),
      4
    );
    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">退款单</h2>' +
      renderInfoPanel('退款单已生成', grid) +
      actions +
      '</section>'
    );
  }

  /** 退款单状态推进：同步售后单状态 */
  function applyRefundTicketStatus(nextRefundStatus) {
    var detail = state.detail;
    if (!detail || !detail.refundTicket) return;
    detail.refundTicket.status = nextRefundStatus;
    if (nextRefundStatus === '待退款' || nextRefundStatus === '退款执行中') {
      detail.status = '退款中';
    } else if (nextRefundStatus === '退款成功') {
      detail.status = '已完成';
    } else if (nextRefundStatus === '退款失败') {
      detail.status = '退款异常';
    }
    detail.progress = buildProgress(
      detail.type,
      detail.status,
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    renderPage();
  }

  function loadSupplierAddresses() {
    var list = [];
    try {
      var map = JSON.parse(localStorage.getItem(SUPPLIER_RECEIVE_ADDR_KEY) || '{}');
      var arr = map[DEMO_SUPPLIER_ID] || map['id:' + DEMO_SUPPLIER_ID] || [];
      if (Array.isArray(arr) && arr.length) list = arr;
    } catch (e) {}
    if (!list.length) {
      list = [
        {
          id: 'addr-default',
          receiverName: '仓库收货人',
          receiverPhone: '13800138000',
          region: '浙江省杭州市萧山区',
          detailAddress: '宁围街道冷丰供应链仓 A区',
          isDefault: true
        },
        {
          id: 'addr-2',
          receiverName: '退货仓值班',
          receiverPhone: '13900139000',
          region: '江苏省南京市建邺区',
          detailAddress: '河西大街冷丰退货中心 2号门',
          isDefault: false
        }
      ];
    }
    return list;
  }

  function buildProgress(type, status, ticketId, applyTime, applicant, detailCtx) {
    var detailRef = detailCtx || state.detail;
    var deliveryMode = (detailRef && detailRef.deliveryMode) || '';
    var returnDesc = isPickupFulfillment(deliveryMode)
      ? '用户到店退回商品'
      : isDeliveryFulfillment(deliveryMode)
        ? '门店退回仓库'
        : '用户寄回商品至供应商地址';
    var returnTitle = isPickupFulfillment(deliveryMode) ? '退回门店' : '寄回商品';
    var steps = [];
    if (type === '补货') {
      var noTrackRestock =
        isDeliveryFulfillment(deliveryMode) || isPickupFulfillment(deliveryMode);
      var withPurchaseOrder = hasPurchaseRestockOrder(detailRef);
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了补货申请' },
        { key: 'audit', title: '等待管理员审核', desc: '等待管理员审核补货申请' },
        {
          key: 'purchase',
          title: withPurchaseOrder ? '采购补货' : '供应商补货',
          desc: noTrackRestock
            ? isPickupFulfillment(deliveryMode)
              ? '补货到店后由用户自提核销'
              : '供应商补发至仓库，仓库配送到门店'
            : withPurchaseOrder
              ? '已向采购端下发补货指令，等待物流回传'
              : '零售快递绕过仓储，直接与供应商对接补货；供应商寄回后后台上传物流'
        },
        { key: 'done', title: '补货完成', desc: '补货流程完成' }
      ];
    } else if (type === '换货') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了换货申请' },
        { key: 'audit', title: '等待管理员审核', desc: '等待管理员审核换货申请' },
        { key: 'return', title: returnTitle, desc: returnDesc },
        {
          key: 'ship',
          title: '换货寄出',
          desc: isPickupFulfillment(deliveryMode)
            ? '换货商品到店，用户自提'
            : isDeliveryFulfillment(deliveryMode)
              ? '换货商品配送到门店'
              : '平台发出换货商品'
        },
        { key: 'done', title: '换货完成', desc: '换货流程完成' }
      ];
    } else if (type === '退货退款') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了退货退款申请' },
        { key: 'audit', title: '等待管理员审核', desc: '等待管理员审核退货退款申请' },
        { key: 'return', title: returnTitle, desc: returnDesc },
        { key: 'refund', title: '平台退款', desc: '退款处理中' },
        { key: 'done', title: '退款成功', desc: '退款完成' }
      ];
    } else {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了仅退款申请' },
        { key: 'audit', title: '等待管理员审核', desc: '等待管理员审核仅退款申请' },
        { key: 'refund', title: '发起退款', desc: '已发起退款' },
        { key: 'done', title: '退款成功', desc: '退款完成' }
      ];
    }

    if (status === '待审批') {
      return [
        {
          title: steps[0].title,
          time: applyTime,
          desc: steps[0].desc,
          operator: applicant,
          done: true
        },
        {
          title: steps[1].title,
          time: '',
          desc: steps[1].desc,
          operator: '',
          done: false,
          current: true,
          hollow: true
        }
      ];
    }

    if (status === '已拒绝' || status === '已取消') {
      var cancelDesc = '售后单已取消';
      var rejectReceive = state.detail && state.detail.rejectReceive;
      if (rejectReceive) {
        var rejectMode = rejectReceive.mode || '重新寄回';
        cancelDesc =
          rejectMode === '原路退回'
            ? '门店/供应商拒绝收货，退回物流已签收，售后关闭'
            : '门店/供应商拒绝收货并重新寄回，退回物流已签收，售后关闭';
      }
      return [
        {
          title: steps[0].title,
          time: applyTime,
          desc: steps[0].desc,
          operator: applicant,
          done: true
        },
        {
          title: rejectReceive ? '拒绝收货' : status === '已拒绝' ? '审批拒绝' : '用户取消',
          time: nowText(),
          desc:
            rejectReceive
              ? cancelDesc
              : status === '已拒绝'
                ? '管理员已拒绝该申请'
                : cancelDesc,
          operator: rejectReceive || status === '已拒绝' ? '超级管理员' : applicant,
          done: true
        }
      ];
    }

    // 已通过后续流程
    var mark = {};
    if (type === '补货') {
      if (status === '已完成') {
        mark = { submit: 1, audit: 1, purchase: 1, done: 1 };
      } else if (status === '待收货') {
        mark = { submit: 1, audit: 1, purchase: 'current' };
      } else {
        mark = { submit: 1, audit: 1, purchase: 'current' };
      }
    } else if (status === '待退货') {
      mark = { submit: 1, audit: 1, return: 'current' };
    } else if (status === '待收货') {
      // 退货已寄回，等待商家确认收货（尚未生成退款单）
      mark = { submit: 1, audit: 1, return: 'current' };
    } else if (status === '退款中') {
      mark = { submit: 1, audit: 1, return: 1, refund: 'current', ship: 'current' };
    } else if (status === '退款异常') {
      mark = { submit: 1, audit: 1, return: 1, refund: 'current' };
    } else if (status === '已完成') {
      mark = { submit: 1, audit: 1, return: 1, refund: 1, ship: 1, done: 1 };
    } else {
      mark = { submit: 1, audit: 1, refund: 'current', ship: 'current' };
    }

    return steps.map(function (s, idx) {
      var m = mark[s.key];
      var done = m === 1;
      var current = m === 'current';
      var descText = s.desc || '';
      if (s.key === 'done' && type.indexOf('退') >= 0 && ticketId) {
        descText = descText + '，售后单号 ' + ticketId;
      }
      return {
        title: s.title,
        time: done || current ? (idx === 0 ? applyTime : nowText()) : '',
        /* 当前节点展示具体事项文案，不再用「当前节点」占位 */
        desc: descText,
        operator: done || current ? (idx === 0 ? applicant : '系统') : '',
        done: done,
        current: current,
        hollow: current
      };
    });
  }

  var DEFAULT_TIMELINE = [
    {
      time: '07-12\n18:20',
      title: '已签收',
      desc: '快件已签收，签收人：门店前台',
      active: true
    },
    {
      time: '07-12\n10:15',
      title: '派送中',
      desc: '【杭州市】快件正在派送中，派送员：王帅，请保持电话畅通'
    },
    {
      time: '07-11\n22:40',
      title: '运输中',
      desc: '【杭州市】快件到达 杭州萧山转运中心'
    },
    {
      time: '07-11\n18:05',
      title: '已揽件',
      desc: '【杭州市】快件已在 杭州萧山营业部 揽收'
    },
    {
      time: '07-11\n17:30',
      title: '已发货',
      desc: '商家已上传快递单号，包裹等待揽收'
    }
  ];

  function defaultWarehouseAddr() {
    return {
      id: 'wh-default',
      source: 'warehouse',
      receiverName: '杭州萧山仓 售后组',
      receiverPhone: '0571-88887777',
      region: '浙江省杭州市萧山区',
      detailAddress: '宁围街道冷丰仓储物流中心 A区退货组',
      isDefault: true
    };
  }

  function defaultSupplierReceiveAddr() {
    ensureAddrState();
    var selected = getSelectedAddr();
    if (selected) {
      return Object.assign({}, selected, { source: 'supplier' });
    }
    return {
      id: 'sup-default',
      source: 'supplier',
      receiverName: '鲜丰蔬菜批发 退货处',
      receiverPhone: '021-58901234',
      region: '上海市浦东新区',
      detailAddress: '外高桥保税区冷链物流园A区12号',
      isDefault: true
    };
  }

  /** 履约方式：快递、配送、自提（兼容历史文案） */
  function normalizeFulfillmentMode(mode) {
    var m = String(mode || '').trim();
    if (!m) return '快递';
    if (m === '自提' || m === 'pickup' || m.indexOf('自提') >= 0) return '自提';
    if (m === '快递' || m.indexOf('快递') >= 0 || m === 'express' || m === 'store') return '快递';
    if (
      m === '配送' ||
      m.indexOf('配送') >= 0 ||
      m === 'warehouse' ||
      m === 'platform' ||
      m === 'delivery'
    ) {
      return '配送';
    }
    return '快递';
  }

  function isExpressFulfillment(mode) {
    return normalizeFulfillmentMode(mode) === '快递';
  }

  function isDeliveryFulfillment(mode) {
    return normalizeFulfillmentMode(mode) === '配送';
  }

  function isPickupFulfillment(mode) {
    return normalizeFulfillmentMode(mode) === '自提';
  }

  /** 平台配送 / 自提补货：无法获取物流轨迹，不展示补货物流 */
  function isNoTrackRestock(detail) {
    if (!detail || detail.type !== '补货') return false;
    return isDeliveryFulfillment(detail.deliveryMode) || isPickupFulfillment(detail.deliveryMode);
  }

  function returnAddrTitle(detail) {
    if (isPickupFulfillment(detail && detail.deliveryMode)) return '门店收货地址';
    if (isDeliveryFulfillment(detail && detail.deliveryMode)) return '仓库收货地址';
    return '供应商收货地址';
  }

  /** 零售自提退货/换货：退回提货门店 */
  function defaultStoreAddr(detail) {
    var storeName =
      (detail && detail.order && detail.order.store) ||
      (state.detail && state.detail.order && state.detail.order.store) ||
      '提货门店';
    return {
      id: 'store-default',
      source: 'store',
      receiverName: storeName + ' 售后',
      receiverPhone: '400-800-6688',
      region: '门店地址',
      detailAddress: storeName + '（用户到店退货，无需快递寄回）',
      isDefault: true
    };
  }

  /**
   * 退货退款 / 换货收货地址：
   * - 自提 → 门店收货地址（用户到店退回）
   * - 配送 → 仓库收货地址
   * - 快递 → 供应商收货地址
   * 补货不展示收货地址
   */
  function resolveReturnAddress(detail, preferredAddr) {
    if (!detail || detail.type === '补货') return null;
    if (detail.type !== '退货退款' && detail.type !== '换货') {
      return preferredAddr || detail.returnAddress || null;
    }
    if (isPickupFulfillment(detail.deliveryMode)) {
      return preferredAddr && preferredAddr.source === 'store'
        ? preferredAddr
        : defaultStoreAddr(detail);
    }
    if (isDeliveryFulfillment(detail.deliveryMode)) {
      return preferredAddr && preferredAddr.source === 'warehouse'
        ? preferredAddr
        : defaultWarehouseAddr();
    }
    if (preferredAddr && preferredAddr.source === 'supplier') {
      return Object.assign({}, preferredAddr, { source: 'supplier' });
    }
    if (preferredAddr && preferredAddr.source !== 'warehouse' && preferredAddr.source !== 'store') {
      return Object.assign({}, preferredAddr, { source: 'supplier' });
    }
    return defaultSupplierReceiveAddr();
  }

  function defaultSupplierAddr() {
    return resolveReturnAddress(
      state.detail || { type: '退货退款', deliveryMode: '快递' },
      null
    ) || defaultSupplierReceiveAddr();
  }

  function makeShip(company, trackingNo, statusLabel) {
    return {
      id: 'AS-SHIP-' + trackingNo,
      company: company,
      trackingNo: trackingNo,
      status: statusLabel || '运输中',
      uploadedAt: nowText(),
      timeline: DEFAULT_TIMELINE
    };
  }

  /**
   * 售后物流/地址透出规则（售后管理端）
   *
   * 退货退款 / 换货：
   *   自提 → 门店收货地址；用户到店退货，门店确认收货后触发退款（换货则进入换出）
   *   配送 → 仓库收货地址；已取货 → 待收货 → 仓库入仓
   *   快递 → 供应商收货地址；取消寄件 / 上传物流 → 确认收货
   *
   * 补货：
   *   不展示收货地址
   *   代采（快递/配送）、零售自提：审核通过后下发采购补货指令
   *   零售快递：绕过仓储，直接与供应商对接补货（无采购补货指令）；
   *   供应商寄回后由后台上传物流
   *   快递有物流；平台配送 / 自提无轨迹
   */
  function isProxyExpressToStore(detail) {
    return detail && detail.orderSource === '代采' && isExpressFulfillment(detail.deliveryMode);
  }

  function isProxyOrder(detail) {
    return detail && detail.orderSource === '代采';
  }

  /**
   * 是否下发/展示「采购补货指令」
   * 代采快递、代采配送、零售自提有；零售快递无（直连供应商补货）
   */
  function hasPurchaseRestockOrder(detail) {
    if (!detail) return false;
    if (detail.orderSource === '代采') return true;
    return isPickupFulfillment(detail.deliveryMode);
  }

  function isPostAudit(status) {
    return status !== '待审批' && status !== '已拒绝' && status !== '已取消';
  }

  function makePurchaseOrder(detail) {
    var goods = (detail && detail.goods && detail.goods[0]) || {};
    var noTrack = isNoTrackRestock(detail);
    var pickupRestock = isPickupFulfillment(detail && detail.deliveryMode);
    var remark;
    if (pickupRestock) {
      remark = '售后补货指令：补货到店后用户自提；门店按原订单核销，回写实际补货数量';
    } else if (noTrack) {
      remark = '售后补货指令：供应商补发至仓库，仓库配送到门店；门店入库后回写实际补货数量';
    } else {
      remark = '售后补货指令：请采购端生成订货单，并回传物流信息；确认收货时填写实际收到数量';
    }
    return {
      id: 'PO-RS-' + String((detail && detail.id) || Date.now()).slice(-12),
      createdAt: nowText(),
      status: '已下发订货',
      productName: goods.name || '-',
      qty: goods.applyQty != null ? goods.applyQty : goods.restockQty || goods.refundQty || 0,
      actualQty: goods.actualRestockQty != null ? goods.actualRestockQty : null,
      remark: remark
    };
  }

  function seedLogisticsByStatus(detail) {
    var type = detail.type;
    var status = detail.status;
    detail.shipments = detail.shipments || { returnShip: null, restockShip: null, exchangeOutShip: null };

    if (type === '补货') {
      detail.returnAddress = null;
      if (isPostAudit(status) && hasPurchaseRestockOrder(detail) && !detail.purchaseOrder) {
        detail.purchaseOrder = makePurchaseOrder(detail);
      }
      if (!hasPurchaseRestockOrder(detail)) {
        detail.purchaseOrder = null;
      }
      if (status === '待收货' && !detail.restockAwaitReceiveAt) {
        detail.restockAwaitReceiveAt = detail.approvalAt || detail.applyTime || nowText();
      }
      if (
        (detail.shipments.restockShip && detail.shipments.restockShip.trackingNo) &&
        !detail.restockShippedAt
      ) {
        detail.restockShippedAt =
          detail.shipments.restockShip.uploadedAt || detail.restockAwaitReceiveAt || nowText();
      }
      /* 平台配送/自提无物流轨迹；仅快递补货完成时补演示物流 */
      if (status === '已完成' && !isNoTrackRestock(detail) && !detail.shipments.restockShip) {
        detail.shipments.restockShip = makeShip('申通快递', 'STO' + String(detail.id).slice(-11), '运输中');
      }
      if (isNoTrackRestock(detail)) {
        detail.shipments.restockShip = null;
      }
      if (status === '已完成' && detail.actualRestockQty == null) {
        var g0 = (detail.goods && detail.goods[0]) || {};
        var seedQty =
          g0.actualRestockQty != null
            ? g0.actualRestockQty
            : g0.restockQty || g0.applyQty || g0.refundQty || detail.summary.refundQty || 0;
        applyActualRestockQty(detail, Number(seedQty) || 0);
      }
    } else if ((type === '退货退款' || type === '换货') && isPostAudit(status)) {
      detail.returnAddress = resolveReturnAddress(detail, detail.returnAddress);
    }

    // 快递退货退款：已有寄回物流但状态仍为待退货时，对齐为待收货（自提/配送不走快递对齐）
    if (
      type === '退货退款' &&
      status === '待退货' &&
      isExpressFulfillment(detail.deliveryMode) &&
      detail.shipments &&
      detail.shipments.returnShip &&
      detail.shipments.returnShip.trackingNo
    ) {
      detail.status = '待收货';
      status = '待收货';
    }

    // 按生成时机补齐演示用退款单（零售 / 代采、结算前后均统一生成）
    // 结算后线下付款只有成功路径，不 seed「退款失败」
    // 列表带入的 refundExec（如「退款执行中」）优先用于演示原路通道
    if (!detail.refundTicket && shouldAutoCreateRefundTicket(detail)) {
      var offlineSeed = isPostSettlement(detail);
      var listRefundExec = queryParam('refundExec') || '';
      var seedFromListExec =
        !offlineSeed &&
        status === '退款中' &&
        (listRefundExec === '退款执行中' || listRefundExec === '待退款')
          ? listRefundExec
          : '';
      if (type === '仅退款' && (status === '已完成' || status === '退款中' || status === '退款异常')) {
        var onlyStatus =
          status === '已完成'
            ? '退款成功'
            : status === '退款异常' && !offlineSeed
              ? '退款失败'
              : seedFromListExec || '待退款';
        if (status === '退款异常' && offlineSeed) {
          detail.status = '退款中';
          status = '退款中';
        }
        detail.refundTicket = {
          id: 'RF-' + String(detail.id).slice(-12),
          createdAt: detail.approval && detail.approval.time !== '-' ? detail.approval.time : nowText(),
          trigger: 'approve',
          status: onlyStatus,
          method: offlineSeed ? '线下付款' : '原路退回'
        };
      } else if (
        type === '退货退款' &&
        (status === '已完成' || status === '退款中' || status === '退款异常')
      ) {
        var rrStatus =
          status === '已完成'
            ? '退款成功'
            : status === '退款异常' && !offlineSeed
              ? '退款失败'
              : seedFromListExec || '待退款';
        if (status === '退款异常' && offlineSeed) {
          detail.status = '退款中';
          status = '退款中';
        }
        detail.refundTicket = {
          id: 'RF-' + String(detail.id).slice(-12),
          createdAt: nowText(),
          trigger: 'receive',
          status: rrStatus,
          method: offlineSeed ? '线下付款' : '原路退回'
        };
      }
    }

    // 快递寄回物流：零售 / 代采均补演示数据（进入退款后流程面板收起，物流区仍要能展示）
    if (
      type === '退货退款' &&
      isExpressFulfillment(detail.deliveryMode) &&
      (status === '退款中' || status === '待收货' || status === '已完成' || status === '退款异常')
    ) {
      if (!detail.shipments.returnShip) {
        detail.shipments.returnShip = makeShip(
          '顺丰速运',
          'SF' + String(detail.id).slice(-12),
          status === '待收货' ? '运输中' : '已签收'
        );
      }
    }

    // 换货快递物流：零售 / 代采均补（自提/配送无运单）
    if (type === '换货' && isExpressFulfillment(detail.deliveryMode)) {
      if (status === '待收货' || status === '已完成') {
        if (!detail.shipments.returnShip) {
          detail.shipments.returnShip = makeShip(
            '中通快递',
            'ZT' + String(detail.id).slice(-12),
            '已签收'
          );
        }
      }
      if (status === '已完成' && !detail.shipments.exchangeOutShip) {
        detail.shipments.exchangeOutShip = makeShip(
          '圆通速递',
          'YT' + String(detail.id).slice(-12),
          '运输中'
        );
      }
    }

    // 自提 / 配送：不 seed 快递运单
    if (isPickupFulfillment(detail.deliveryMode) || isDeliveryFulfillment(detail.deliveryMode)) {
      if (type === '退货退款' || type === '换货') {
        detail.shipments.returnShip = null;
        if (type === '换货') detail.shipments.exchangeOutShip = null;
      }
    }

    return detail;
  }

  function buildDetail() {
    var id = queryParam('id') || 'AS-333524494855454720';
    var status = queryParam('status') || '待审批';
    var type = queryParam('type') || '仅退款';
    if (ALL_TYPES.indexOf(type) < 0) type = '仅退款';

    var isDone = status === '已完成';
    var applyTime = isDone ? '2026-07-11 17:06:01' : '2026-07-09 16:27:16';
    var applicant = isDone ? '奶糖' : '张大大';
    var amount = isDone ? 8 : 0.6;
    var qty = isDone ? 2 : 6;
    var productName = isDone ? '娃哈哈爽歪歪 200g*4瓶一排装' : '猫山王榴莲-6.25到货';
    var productSpec = isDone ? '酸甜' : '甜糯';

    if (isDone && (!queryParam('id') || id.indexOf('AS-333') === 0)) {
      id = queryParam('id') || 'AS-334259025065558016';
    }

    // 履约方式枚举仅：快递、配送（可用 query delivery 覆盖，历史值会归一化）
    var orderSource = queryParam('orderSource') || '零售';
    if (orderSource === '商城' || orderSource === '直播') orderSource = '零售';
    var deliveryMode = normalizeFulfillmentMode(queryParam('delivery') || '快递');
    // 结算状态：待结算 | 待结款 | 结款中 | 已结款（可用 query settleStatus 覆盖）
    var settleStatus = queryParam('settleStatus') || '待结算';
    if (['待结算', '待结款', '结款中', '已结款'].indexOf(settleStatus) < 0) {
      settleStatus = '待结算';
    }
    // 申请时订单状态：待发货 / 待收货 / 待自提 / 已完成（可用 query orderStatus 覆盖）
    var orderApplyStatus = queryParam('orderStatus') || '';
    if (!orderApplyStatus) {
      if (type === '仅退款' && queryParam('preShip') === '1') {
        orderApplyStatus = '待发货';
      } else if (type === '补货' || type === '换货' || type === '退货退款') {
        orderApplyStatus = isDone ? '已完成' : '待收货';
      } else {
        orderApplyStatus = isDone ? '已完成' : '待收货';
      }
    }

    var goodsStatusSeed = '';
    var goodsModeSeed = resolveGoodsStatusMode(type, orderApplyStatus);
    if (goodsModeSeed.mode === 'fixed') {
      goodsStatusSeed = goodsModeSeed.value;
    } else if (goodsModeSeed.mode === 'editable') {
      goodsStatusSeed = queryParam('goodsStatus') || (isDone ? '已收到货' : '未收到货');
      if (GOODS_STATUS_OPTIONS.indexOf(goodsStatusSeed) < 0) goodsStatusSeed = '未收到货';
    }

    var detail = {
      id: id,
      status: status,
      type: type,
      applyTime: applyTime,
      applyAmount: amount,
      waitTime: '-',
      orderSource: orderSource,
      deliveryMode: deliveryMode,
      settleStatus: settleStatus,
      orderApplyStatus: orderApplyStatus,
      apply: {
        goodsStatus: goodsStatusSeed,
        refundReason: demoRefundReason(type, goodsStatusSeed, orderApplyStatus),
        ratio: '-',
        desc: isDone ? '1111111' : 'eee',
        proofCount: isDone ? 1 : 0
      },
      goods: [
        {
          name: productName,
          spec: productSpec,
          refundAmount: type === '补货' ? 0 : amount,
          refundQty: qty,
          applyAmount: amount,
          applyQty: qty,
          buyQty: qty,
          paidAmount: amount,
          couponShare: 0,
          pointsShare: 0,
          sku: 'SKU00089',
          exchangeTo: type === '换货' ? productName + ' / 换出规格' : '',
          restockQty: type === '补货' ? qty : 0
        }
      ],
      summary: {
        refundAmount: type === '补货' ? 0 : amount,
        refundQty: qty,
        coupon: 0,
        points: 0,
        growth: '-'
      },
      approval: {
        result: status === '已完成' ? '已通过' : status === '已拒绝' ? '已拒绝' : '-',
        refundAmount: type === '补货' ? 0 : amount,
        refundQty: qty,
        coupon: 0,
        points: 0,
        approver: status === '待审批' ? '-' : '超级管理员',
        time: status === '待审批' ? '-' : isDone ? '2026-07-11 17:07:22' : '2026-07-09 17:07:22',
        remark: '-'
      },
      reasons: { customer: [], store: [], delivery: [], warehouse: [], supplier: [] },
      customer: {
        level: '-',
        purchaseCount: '-',
        aftersaleCount: '-',
        aftersaleAmount: '-',
        aftersaleRatio: '-'
      },
      order: {
        orderNo: isDone ? 'ORD-2607090218032' : 'ORD-2607097723704',
        orderTime: isDone ? '2026-07-09 10:07:07' : '2026-07-09 16:13:39',
        receiver: applicant,
        phone: isDone ? '17739589272' : '15236806537',
        amount: isDone ? 17 : 0.6,
        status: isDone ? '已关闭' : orderApplyStatus,
        source: orderSource,
        store: '德清乾元天恩冷丰店'
      },
      supplier: {
        id: DEMO_SUPPLIER_ID,
        name: isDone ? '-' : '冷丰示范供应商',
        buyer: '-'
      },
      returnAddress: null,
      refundTicket: null,
      userPickupActive: false,
      shipCanceled: false,
      showShipUploadForm: false,
      userOps: {
        cancelPickup: null,
        closeReturn: null
      },
      shipments: {
        returnShip: null,
        restockShip: null,
        exchangeOutShip: null
      },
      progress: null
    };
    detail.progress = buildProgress(type, status, id, applyTime, applicant, detail);

    return seedLogisticsByStatus(seedUserOpsByStatus(detail));
  }

  function seedUserOpsByStatus(detail) {
    var type = detail.type;
    var status = detail.status;
    var closeReason = queryParam('closeReason') || '';
    var canceledShip = queryParam('canceledShip') === '1' || closeReason === 'cancel_pickup';

    detail.userOps = detail.userOps || { cancelPickup: null, closeReturn: null };

    if ((type === '退货退款' || type === '换货') && status === '待退货') {
      // 自提：退回门店；配送：门店退仓——均不走快递寄件
      if (
        isPickupFulfillment(detail.deliveryMode) ||
        isDeliveryFulfillment(detail.deliveryMode)
      ) {
        detail.userPickupActive = false;
        detail.shipCanceled = false;
        detail.showShipUploadForm = false;
        detail.shipments = detail.shipments || {};
        detail.shipments.returnShip = null;
        if (isDeliveryFulfillment(detail.deliveryMode)) {
          detail.driverPickedUp = !!detail.driverPickedUp;
        }
      } else {
        // 快递：审核通过后默认视为用户端已发起寄件，需先取消寄件才能上传物流
        detail.userPickupActive = !canceledShip;
        if (canceledShip) {
          detail.shipCanceled = true;
          detail.showShipUploadForm = false;
          if (!detail.userOps.cancelPickup) {
            detail.userOps.cancelPickup = {
              reason: CANCEL_PICKUP_REASONS[2],
              time: nowText(),
              source: '用户端',
              operator: detail.order.receiver || '用户'
            };
          }
        }
      }
    }

    if (
      (type === '退货退款' || type === '换货' || type === '仅退款') &&
      !detail.rejectReceive &&
      (closeReason === 'close_return' || (status === '已取消' && closeReason !== 'reject'))
    ) {
      if (!detail.userOps.closeReturn) {
        detail.userOps.closeReturn = {
          reason: CLOSE_RETURN_REASONS[2],
          time: nowText(),
          source: '用户端',
          operator: detail.order.receiver || '用户'
        };
      }
      if (status !== '已取消' && status !== '已拒绝' && closeReason === 'close_return') {
        detail.status = '已取消';
      }
    }

    // 配送退货/换货·待收货：演示态默认已取货，等待仓库入仓（换货入仓前不进换出）
    if (
      (type === '退货退款' || type === '换货') &&
      isDeliveryFulfillment(detail.deliveryMode) &&
      status === '待收货' &&
      !detail.warehouseInbound
    ) {
      detail.userPickupActive = false;
      detail.showShipUploadForm = false;
      detail.shipments = detail.shipments || {};
      detail.shipments.returnShip = null;
      if (!detail.driverPickedUp) {
        detail.driverPickedUp = true;
        detail.driverPickedAt = detail.driverPickedAt || nowText();
      }
    }

    return detail;
  }

  function hasActivePickup(detail) {
    var ship = detail.shipments && detail.shipments.returnShip;
    /* 仅「未产生可跟踪物流」的取件预约算可取消寄件 */
    return !!(detail.userPickupActive && !(ship && ship.trackingNo));
  }

  /** 已有可跟踪物流信息（含单号）→ 视为已进入寄递跟踪，不可再取消/改传单号 */
  function hasTrackableReturnShip(detail) {
    var ship = detail.shipments && detail.shipments.returnShip;
    return !!(ship && ship.trackingNo);
  }

  function canCancelShip(detail) {
    return !hasTrackableReturnShip(detail) && (hasActivePickup(detail) || !!detail.userPickupActive);
  }

  /** 信息块：上标签下取值；空值统一展示 -- */
  function field(label, value, opts) {
    opts = opts || {};
    var empty = value == null || value === '' || value === '-' || value === '—';
    var display = empty ? '--' : value;
    var valueHtml = opts.html != null ? opts.html : escapeHtml(display);
    var cls = 'aftersale-apply-field' + (opts.className ? ' ' + opts.className : '');
    return (
      '<div class="' +
      cls +
      '">' +
      '<span class="aftersale-apply-field__label">' +
      escapeHtml(label) +
      '</span>' +
      '<div class="aftersale-apply-field__value">' +
      valueHtml +
      '</div></div>'
    );
  }

  /** 内嵌信息面板（如「退款单已生成」） */
  function renderInfoPanel(title, bodyHtml) {
    return (
      '<div class="aftersale-info-panel">' +
      (title
        ? '<div class="aftersale-info-panel__title">' + escapeHtml(title) + '</div>'
        : '') +
      bodyHtml +
      '</div>'
    );
  }

  function renderInfoGrid(fieldsHtml, cols) {
    cols = cols || 4;
    return (
      '<div class="aftersale-apply-grid aftersale-apply-grid--' +
      cols +
      '">' +
      fieldsHtml +
      '</div>'
    );
  }

  function renderStatusBanner(detail) {
    var status = detail.status;
    var variant = 'pending';
    var icon = FILE_SVG;
    if (status === '已完成') {
      variant = 'success';
      icon = CHECK_LG_SVG;
    } else if (status === '已拒绝' || status === '已取消' || status === '退款异常') {
      variant = 'danger';
      icon = FILE_SVG;
    } else if (!isPending(status)) {
      variant = 'processing';
      icon = FILE_SVG;
    }

    var meta =
      '<div class="aftersale-status-banner__item"><span>售后单号</span><b>' +
      escapeHtml(detail.id) +
      '</b></div>' +
      '<div class="aftersale-status-banner__item"><span>申请时间</span><b>' +
      escapeHtml(detail.applyTime) +
      '</b></div>' +
      '<div class="aftersale-status-banner__item"><span>申请类型</span><b>' +
      escapeHtml(detail.type) +
      '</b></div>' +
      '<div class="aftersale-status-banner__item"><span>' +
      (createsRefundDoc(detail.type) ? '申请退款金额' : '申请金额') +
      '</span><b class="is-money">' +
      money(detail.applyAmount) +
      '</b></div>';

    // 待审批态额外展示订单状态；已完成态按设计仅四列
    if (isPending(status)) {
      meta +=
        '<div class="aftersale-status-banner__item"><span>订单状态</span><b class="is-orange">' +
        escapeHtml(detail.order.status) +
        '</b></div>';
    }

    return (
      '<section class="aftersale-status-banner aftersale-status-banner--' +
      variant +
      '">' +
      '<div class="aftersale-status-banner__status">' +
      '<span class="aftersale-status-banner__icon">' +
      icon +
      '</span>' +
      '<div><div class="aftersale-status-banner__name">' +
      escapeHtml(status) +
      '</div><div class="aftersale-status-banner__wait">等待时间：' +
      escapeHtml(detail.waitTime) +
      '</div></div></div>' +
      '<div class="aftersale-status-banner__meta">' +
      meta +
      '</div></section>'
    );
  }

  function renderGoodsStatusField(detail) {
    var type = applyInfoType(detail);
    var mode = resolveGoodsStatusMode(type, detail.orderApplyStatus);
    var pending = isPending(detail.status);
    var label = '<span class="aftersale-apply-field__label">货物状态</span>';

    if (mode.mode === 'na') {
      return (
        '<div class="aftersale-apply-field">' +
        label +
        '<div class="aftersale-apply-field__value">/</div></div>'
      );
    }

    if (mode.mode === 'fixed') {
      return (
        '<div class="aftersale-apply-field">' +
        label +
        '<div class="aftersale-apply-field__value">' +
        escapeHtml(mode.value) +
        '</div></div>'
      );
    }

    // editable：默认展示值+编辑图标；点击后变为下拉
    var current =
      GOODS_STATUS_OPTIONS.indexOf(detail.apply.goodsStatus) >= 0
        ? detail.apply.goodsStatus
        : '未收到货';
    if (pending && state.editing.goodsStatus) {
      var options = GOODS_STATUS_OPTIONS.map(function (opt) {
        return (
          '<option value="' +
          escapeHtml(opt) +
          '"' +
          (opt === current ? ' selected' : '') +
          '>' +
          escapeHtml(opt) +
          '</option>'
        );
      }).join('');
      return (
        '<div class="aftersale-apply-field">' +
        label +
        '<select class="aftersale-apply-field__select" id="asGoodsStatus" aria-label="货物状态">' +
        options +
        '</select></div>'
      );
    }
    return (
      '<div class="aftersale-apply-field">' +
      label +
      '<button type="button" class="aftersale-goods-edit js-as-edit-goods-status"' +
      (pending ? '' : ' disabled') +
      '>' +
      escapeHtml(current) +
      EDIT_SVG +
      '</button></div>'
    );
  }

  function renderApply(detail) {
    var a = detail.apply;
    var proofInner =
      a.proofCount > 0
        ? '<div class="aftersale-apply-proof__thumbs"><span class="aftersale-apply-proof__thumb" role="img" aria-label="凭证缩略图"></span></div>'
        : '<div class="aftersale-apply-field__value">-</div>';
    return (
      '<section class="aftersale-detail-card">' +
      '<h2 class="aftersale-detail-card__title">售后申请信息</h2>' +
      '<div class="aftersale-apply-grid">' +
      renderGoodsStatusField(detail) +
      field(reasonFieldLabel(detail.type), a.refundReason || '/') +
      field('此类问题出现比例', a.ratio) +
      '<div class="aftersale-apply-field aftersale-apply-field--desc">' +
      '<span class="aftersale-apply-field__label">补充描述</span>' +
      '<div class="aftersale-apply-field__value">' +
      escapeHtml(a.desc) +
      '</div></div>' +
      '<div class="aftersale-apply-field aftersale-apply-proof">' +
      '<span class="aftersale-apply-field__label">凭证图片/视频（共 ' +
      a.proofCount +
      ' 张）</span>' +
      proofInner +
      '</div></div></section>'
    );
  }

  function goodsTableType(detail) {
    return isPending(detail.status) ? state.approveType : detail.type;
  }

  function renderGoodsAmountCell(g, idx, editable, isRestock) {
    if (isRestock) {
      return '<span class="aftersale-goods-fixed">' + money(0) + '</span>';
    }
    if (editable && state.editing.amountIdx === idx) {
      return (
        '<input type="text" class="aftersale-goods-input js-as-goods-input" data-edit="amount" data-idx="' +
        idx +
        '" value="' +
        escapeHtml(g.refundAmount) +
        '" inputmode="decimal" aria-label="退款金额">'
      );
    }
    return (
      '<button type="button" class="aftersale-goods-edit js-as-edit-amount" data-idx="' +
      idx +
      '"' +
      (editable ? '' : ' disabled') +
      '>' +
      money(g.refundAmount) +
      EDIT_SVG +
      '</button>'
    );
  }

  function renderGoodsQtyCell(g, idx, editable, isRestock) {
    var hasActual = isRestock && g.actualRestockQty != null && g.actualRestockQty !== '';
    var qtyValue = isRestock
      ? hasActual
        ? g.actualRestockQty
        : g.restockQty != null
          ? g.restockQty
          : g.refundQty
      : g.refundQty;
    var qtyAria = isRestock ? (hasActual ? '实际补货数量' : '补货数量') : '退款数量';
    /* 已录入实际数量后不可再改 */
    var canEdit = editable && !(isRestock && hasActual);
    if (canEdit && state.editing.qtyIdx === idx) {
      return (
        '<input type="text" class="aftersale-goods-input js-as-goods-input" data-edit="qty" data-idx="' +
        idx +
        '" value="' +
        escapeHtml(qtyValue) +
        '" inputmode="numeric" aria-label="' +
        qtyAria +
        '">'
      );
    }
    return (
      '<button type="button" class="aftersale-goods-edit js-as-edit-qty" data-idx="' +
      idx +
      '"' +
      (canEdit ? '' : ' disabled') +
      '>' +
      escapeHtml(qtyValue) +
      (canEdit ? EDIT_SVG : '') +
      '</button>'
    );
  }

  function renderGoods(detail, editable) {
    var isRestock = goodsTableType(detail) === '补货';
    var hasAnyActual =
      isRestock &&
      detail.goods.some(function (g) {
        return g.actualRestockQty != null && g.actualRestockQty !== '';
      });
    var qtyLabel = isRestock
      ? hasAnyActual || detail.status === '已完成'
        ? '实际补货数量'
        : '补货数量'
      : '退款数量';
    var applyLabel = isRestock ? '用户申请数量' : '用户申请金额';
    var rows = detail.goods
      .map(function (g, idx) {
        var amtCell = renderGoodsAmountCell(g, idx, editable, isRestock);
        var qtyCell = renderGoodsQtyCell(g, idx, editable, isRestock);
        var applyCell = isRestock
          ? escapeHtml(g.applyQty != null ? g.applyQty : g.refundQty)
          : money(g.applyAmount);
        return (
          '<tr' +
          (state.editing.amountIdx === idx || state.editing.qtyIdx === idx
            ? ' class="is-editing"'
            : '') +
          '>' +
          '<td class="aftersale-goods-table__td--product"><div class="aftersale-goods-product">' +
          '<span class="aftersale-goods-product__img" role="img" aria-label="商品图"></span>' +
          '<div><div class="aftersale-goods-product__name">' +
          escapeHtml(g.name) +
          '</div><div class="aftersale-goods-product__spec">规格：' +
          escapeHtml(g.spec) +
          '</div></div></div></td>' +
          '<td>' +
          amtCell +
          '</td><td>' +
          qtyCell +
          '</td><td>' +
          applyCell +
          '</td><td>' +
          escapeHtml(g.buyQty) +
          '</td><td>' +
          money(g.paidAmount) +
          '</td><td>' +
          money(g.couponShare) +
          '</td><td>' +
          escapeHtml(g.pointsShare) +
          '</td><td>' +
          escapeHtml(g.sku) +
          '</td></tr>'
        );
      })
      .join('');
    var s = detail.summary;
    return (
      '<section class="aftersale-detail-card">' +
      '<h2 class="aftersale-detail-card__title">商品明细（共 ' +
      detail.goods.length +
      ' 件商品）</h2>' +
      '<div class="aftersale-goods-table-wrap"><table class="aftersale-goods-table"><thead><tr>' +
      '<th class="aftersale-goods-table__th--product">商品</th>' +
      '<th>退款金额</th><th>' +
      qtyLabel +
      '</th><th>' +
      applyLabel +
      '</th><th>购买数量</th>' +
      '<th>实付金额</th><th>优惠券分摊金额</th><th>积分分摊金额</th><th>SKU编码</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      '<div class="aftersale-goods-summary">' +
      '<div class="aftersale-goods-summary__item">总计退款金额<strong class="is-money">' +
      money(isRestock ? 0 : s.refundAmount) +
      '</strong></div>' +
      '<div class="aftersale-goods-summary__item">总计' +
      (isRestock
        ? hasAnyActual || detail.status === '已完成'
          ? '实际补货数量'
          : '补货数量'
        : '退款数量') +
      '<strong>' +
      escapeHtml(s.refundQty) +
      '</strong></div>' +
      '<div class="aftersale-goods-summary__item">总计退还优惠券<strong>' +
      money(s.coupon) +
      '</strong></div>' +
      '<div class="aftersale-goods-summary__item">总计退还积分<strong>' +
      escapeHtml(s.points) +
      '</strong></div>' +
      '<div class="aftersale-goods-summary__item">总计退还成长值<strong>' +
      escapeHtml(s.growth) +
      '</strong></div></div></div></section>'
    );
  }

  function needsReturnAddrTemplate(type) {
    /* 补货不展示收货地址；仅退货退款/换货需要 */
    return type === '退货退款' || type === '换货';
  }

  function needsExpressAddrPick(type, deliveryMode) {
    return needsReturnAddrTemplate(type) && isExpressFulfillment(deliveryMode);
  }

  function needsWarehouseAddrOnly(type, deliveryMode) {
    return needsReturnAddrTemplate(type) && isDeliveryFulfillment(deliveryMode);
  }

  /** 自提退货/换货：审批只展示门店地址，不出现供应商模板 */
  function needsStoreAddrOnly(type, deliveryMode) {
    return needsReturnAddrTemplate(type) && isPickupFulfillment(deliveryMode);
  }

  function ensureAddrState() {
    state.addrList = loadSupplierAddresses();
    var stillValid = state.addrList.some(function (a) {
      return a.id === state.selectedAddrId;
    });
    if (!stillValid) {
      var def = state.addrList.find(function (a) {
        return a.isDefault;
      });
      state.selectedAddrId = (def && def.id) || (state.addrList[0] && state.addrList[0].id) || '';
    }
  }

  function getSelectedAddr() {
    return (
      state.addrList.find(function (a) {
        return a.id === state.selectedAddrId;
      }) || null
    );
  }

  function formatAddrOption(a) {
    return (
      (a.isDefault ? '【默认】' : '') +
      a.receiverName +
      ' ' +
      a.receiverPhone +
      ' · ' +
      a.region +
      ' ' +
      a.detailAddress
    );
  }

  function renderAddrTemplateRow() {
    var deliveryMode = (state.detail && state.detail.deliveryMode) || '';
    if (needsStoreAddrOnly(state.approveType, deliveryMode)) {
      var store = defaultStoreAddr(state.detail);
      return (
        '<div class="aftersale-approve-ops__row aftersale-approve-ops__row--top aftersale-addr-template">' +
        '<span class="aftersale-approve-ops__label">门店收货地址</span>' +
        '<div class="aftersale-approve-ops__field">' +
        '<div class="aftersale-addr-template__preview">' +
        '<div>收货人：' +
        escapeHtml(store.receiverName) +
        '　' +
        escapeHtml(store.receiverPhone) +
        '<span class="aftersale-addr-card__tag">门店</span></div>' +
        '<div>地址：' +
        escapeHtml(store.region) +
        ' ' +
        escapeHtml(store.detailAddress) +
        '</div></div>' +
        '<div class="aftersale-addr-template__hint">自提单审核通过后，用户到店退回该提货门店；门店确认收货后自动触发退款</div>' +
        '</div></div>'
      );
    }
    if (needsWarehouseAddrOnly(state.approveType, deliveryMode)) {
      var wh = defaultWarehouseAddr();
      return (
        '<div class="aftersale-approve-ops__row aftersale-approve-ops__row--top aftersale-addr-template">' +
        '<span class="aftersale-approve-ops__label">仓库收货地址</span>' +
        '<div class="aftersale-approve-ops__field">' +
        '<div class="aftersale-addr-template__preview">' +
        '<div>收货人：' +
        escapeHtml(wh.receiverName) +
        '　' +
        escapeHtml(wh.receiverPhone) +
        '<span class="aftersale-addr-card__tag">仓库</span></div>' +
        '<div>地址：' +
        escapeHtml(wh.region) +
        ' ' +
        escapeHtml(wh.detailAddress) +
        '</div></div>' +
        '<div class="aftersale-addr-template__hint">配送订单审核通过后，门店退回仓库将使用仓库收货地址</div>' +
        '</div></div>'
      );
    }
    if (!needsExpressAddrPick(state.approveType, deliveryMode)) {
      return '';
    }

    ensureAddrState();
    var options = state.addrList
      .map(function (a) {
        return (
          '<option value="' +
          escapeHtml(a.id) +
          '"' +
          (a.id === state.selectedAddrId ? ' selected' : '') +
          '>' +
          escapeHtml(formatAddrOption(a)) +
          '</option>'
        );
      })
      .join('');
    var selected = getSelectedAddr();
    var preview = selected
      ? '<div class="aftersale-addr-template__preview">' +
        '<div>收货人：' +
        escapeHtml(selected.receiverName) +
        '　' +
        escapeHtml(selected.receiverPhone) +
        (selected.isDefault ? '<span class="aftersale-addr-card__tag">默认</span>' : '') +
        '</div>' +
        '<div>地址：' +
        escapeHtml(selected.region) +
        ' ' +
        escapeHtml(selected.detailAddress) +
        '</div></div>'
      : '<div class="aftersale-addr-template__preview is-empty">暂无可用收货地址，请先在供应商档案中维护</div>';

    return (
      '<div class="aftersale-approve-ops__row aftersale-approve-ops__row--top aftersale-addr-template">' +
      '<span class="aftersale-approve-ops__label">供应商收货地址</span>' +
      '<div class="aftersale-approve-ops__field">' +
      '<select class="aftersale-addr-template__select" id="asReturnAddrSelect" aria-label="供应商收货地址模板">' +
      options +
      '</select>' +
      preview +
      '<div class="aftersale-addr-template__hint">快递订单审核通过后，用户寄回商品将使用该供应商收货地址</div>' +
      '</div></div>'
    );
  }

  function renderApproveOps(detail) {
    var radios = ALL_TYPES.map(function (t) {
      var checked = state.approveType === t ? ' checked' : '';
      return (
        '<label class="aftersale-radio">' +
        '<input type="radio" name="asApproveType" value="' +
        escapeHtml(t) +
        '"' +
        checked +
        '>' +
        '<span>' +
        escapeHtml(t) +
        '</span></label>'
      );
    }).join('');
    return (
      '<section class="aftersale-detail-card">' +
      '<h2 class="aftersale-detail-card__title">审批操作</h2>' +
      '<div class="aftersale-approve-ops">' +
      '<div class="aftersale-approve-ops__row">' +
      '<span class="aftersale-approve-ops__label">修改售后类型</span>' +
      '<div class="aftersale-radio-group">' +
      radios +
      '</div></div>' +
      (needsExpressAddrPick(state.approveType, (state.detail && state.detail.deliveryMode) || '') ||
      needsWarehouseAddrOnly(state.approveType, (state.detail && state.detail.deliveryMode) || '') ||
      needsStoreAddrOnly(state.approveType, (state.detail && state.detail.deliveryMode) || '')
        ? renderAddrTemplateRow()
        : '') +
      '</div></section>'
    );
  }

  function renderApprovalInfo(detail) {
    var a = detail.approval;
    var isRefund = createsRefundDoc(detail.type);
    var resultCls =
      a.result === '已通过' ? 'is-ok' : a.result === '已拒绝' ? 'is-bad' : '';
    var fields =
      field('审批结果', a.result, {
        html:
          '<span class="aftersale-apply-field__value-text ' +
          resultCls +
          '">' +
          escapeHtml(a.result || '--') +
          '</span>'
      }) +
      field(isRefund ? '退款金额' : '申请金额', money(isRefund ? a.refundAmount : detail.applyAmount)) +
      field(isRefund ? '退款数量' : '申请数量', a.refundQty) +
      (isRefund ? field('退还优惠券', money(a.coupon)) + field('退还积分', a.points) : '') +
      field('审批人', a.approver) +
      field('审批时间', a.time) +
      field('审批备注', a.remark);
    return (
      '<section class="aftersale-detail-card">' +
      '<h2 class="aftersale-detail-card__title">审批信息</h2>' +
      renderInfoGrid(fields, 4) +
      '</section>'
    );
  }

  function renderReasons(detail, editable) {
    var html =
      '<section class="aftersale-detail-card"><h2 class="aftersale-detail-card__title">售后原因采集</h2>';

    if (!editable) {
      var selectedParts = [];
      REASON_GROUPS.forEach(function (group) {
        var selected = detail.reasons[group.key] || [];
        if (selected.length) {
          selectedParts.push(group.label + '：' + selected.join('、'));
        }
      });
      html += renderInfoGrid(
        field('采集结果', selectedParts.length ? selectedParts.join('；') : '--', {
          className: 'aftersale-apply-field--wide'
        }),
        4
      );
      html += '</section>';
      return html;
    }

    html += '<div class="aftersale-reason-collect">';
    REASON_GROUPS.forEach(function (group) {
      var selected = detail.reasons[group.key] || [];
      html +=
        '<div class="aftersale-reason-row"><div class="aftersale-reason-row__label">' +
        escapeHtml(group.label) +
        '</div><div class="aftersale-reason-row__tags">';
      group.tags.forEach(function (tag) {
        var active = selected.indexOf(tag) >= 0;
        html +=
          '<button type="button" class="aftersale-reason-tag' +
          (active ? ' is-active' : '') +
          ' data-group="' +
          escapeHtml(group.key) +
          '" data-tag="' +
          escapeHtml(tag) +
          '">' +
          escapeHtml(tag) +
          '</button>';
      });
      html += '</div></div>';
    });
    html += '</div></section>';
    return html;
  }

  function renderMerchantAddrCard(addr, title) {
    var head = title || '供应商收货地址';
    if (!addr) {
      var emptyHint =
        head.indexOf('门店') >= 0
          ? '暂未配置门店收货地址'
          : head.indexOf('仓库') >= 0
            ? '暂未配置仓库收货地址'
            : '暂未选择供应商收货地址模板';
      return renderInfoPanel(
        head,
        '<div class="aftersale-info-panel__empty">' + escapeHtml(emptyHint) + '</div>'
      );
    }
    var fullAddr = (addr.region || '') + ' ' + (addr.detailAddress || '');
    return renderInfoPanel(
      head,
      renderInfoGrid(
        field('收货人', addr.receiverName) +
          field('联系电话', addr.receiverPhone) +
          field('收货地址', fullAddr.trim(), { className: 'aftersale-apply-field--span2' }),
        4
      )
    );
  }

  function renderDeliveryReturnPanel(detail) {
    var status = detail.status;
    var isExchange = detail.type === '换货';
    var title =
      status === '待收货'
        ? (isExchange ? '换货处理 · 待收货' : '退货退款 · 待收货')
        : isExchange
          ? '换货处理 · 待退货'
          : '退货退款 · 待退货';
    var bodyHtml;
    var actions;
    var inboundLabel = isExchange
      ? '模拟仓库入仓（进入换出）'
      : '模拟仓库入仓（触发退款）';
    var inboundHint = isExchange
      ? '仓库入仓结果返回后，进入换货寄出环节。'
      : '仓库入仓结果返回后将触发退款。';

    if (status === '待退货') {
      bodyHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">门店退回仓库</div>' +
        '<div class="aftersale-return-ship__wait">配送订单由门店退回仓库，无需填写物流单号。物流司机取货后，请操作「已取货」。</div>' +
        '</div>';
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asDeliveryPicked">已取货</button>' +
        '</div>';
    } else {
      bodyHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">退仓进度</div>' +
        '<div class="aftersale-return-ship__wait">' +
        (detail.driverPickedUp
          ? '物流司机已取货，商品退回仓库途中。' + inboundHint
          : '待仓库入仓。' + inboundHint) +
        (detail.driverPickedAt
          ? '<br>取货时间：' + escapeHtml(detail.driverPickedAt)
          : '') +
        '</div></div>';
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asWarehouseInbound">' +
        escapeHtml(inboundLabel) +
        '</button>' +
        '</div>';
    }

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">' +
      escapeHtml(title) +
      '</h2>' +
      renderMerchantAddrCard(detail.returnAddress, returnAddrTitle(detail)) +
      bodyHtml +
      actions +
      '</section>'
    );
  }

  /** 零售自提：用户到店退回门店，门店确认收货后触发退款/换出 */
  function renderPickupReturnPanel(detail) {
    var type = detail.type;
    var isExchange = type === '换货';
    var title = isExchange ? '换货处理 · 退回门店' : '退货退款 · 退回门店';
    var tip = isExchange
      ? '自提换货由用户到提货门店退货，无需快递寄回。门店确认收货后进入换货到店环节。'
      : '自提退货由用户到提货门店退货，无需快递寄回。门店确认收货后将自动生成退款单。';
    var btnText = isExchange ? '门店已确认收货（进入换出）' : '门店已确认收货（触发退款）';

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">' +
      escapeHtml(title) +
      '</h2>' +
      renderMerchantAddrCard(detail.returnAddress, returnAddrTitle(detail)) +
      '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
      '<div class="aftersale-return-ship__title">到店退货</div>' +
      '<div class="aftersale-return-ship__wait">' +
      escapeHtml(tip) +
      '</div></div>' +
      '<div class="aftersale-flow-card__actions">' +
      '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asStoreReturnReceived">' +
      escapeHtml(btnText) +
      '</button></div></section>'
    );
  }

  function renderAwaitReturnPanel(detail) {
    var type = detail.type;
    var status = detail.status;
    // 换货确认收货后的待收货由换货寄出面板承接（配送未入仓除外）
    if (type !== '退货退款' && type !== '换货') return '';
    if (status === '待收货' && type === '换货') {
      if (isDeliveryFulfillment(detail.deliveryMode) && !detail.warehouseInbound) {
        return renderDeliveryReturnPanel(detail);
      }
      return '';
    }
    if (status !== '待退货' && !(status === '待收货' && type === '退货退款')) {
      return '';
    }

    // 自提：退回门店
    if (isPickupFulfillment(detail.deliveryMode)) {
      return renderPickupReturnPanel(detail);
    }

    // 配送：已取货 / 仓库入仓（退货退款与换货共用）
    if (isDeliveryFulfillment(detail.deliveryMode)) {
      return renderDeliveryReturnPanel(detail);
    }

    var ships = detail.shipments || {};
    var ship = ships.returnShip;
    var hasShip = hasTrackableReturnShip(detail);
    var awaitingReceive = status === '待收货' && type === '退货退款';
    var activePickup = !awaitingReceive && hasActivePickup(detail);
    var canUpload = !awaitingReceive && !hasShip && !activePickup && !!detail.shipCanceled;
    var showUpload = canUpload && !!detail.showShipUploadForm;
    var awaitingShip = canUpload;
    var title;
    if (awaitingReceive) {
      title = '退货退款 · 待收货';
    } else if (type === '换货') {
      title = hasShip
        ? '换货处理 · 待退货'
        : activePickup
          ? '换货处理 · 待揽收'
          : awaitingShip
            ? '换货处理 · 待寄件'
            : '换货处理 · 待退货';
    } else {
      title = hasShip
        ? '退货退款 · 待收货'
        : activePickup
          ? '退货退款 · 待揽收'
          : awaitingShip
            ? '退货退款 · 待寄件'
            : '退货退款 · 待退货';
    }
    var addrTitle = returnAddrTitle(detail);

    var shipHtml;
    if (hasShip) {
      shipHtml =
        '<div class="aftersale-return-ship">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__card">' +
        '<dl class="aftersale-return-ship__kv">' +
        '<dt>物流单号</dt><dd class="aftersale-logistics-no">' +
        escapeHtml(ship.trackingNo) +
        '</dd>' +
        '<dt>物流公司</dt><dd>' +
        escapeHtml(ship.company) +
        '</dd>' +
        '<dt>物流状态</dt><dd class="aftersale-return-ship__status">' +
        '<span>' +
        escapeHtml(ship.status || '运输中') +
        '</span>' +
        '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="returnShip">跟踪信息</button>' +
        '</dd>' +
        (ship.uploadedAt ? '<dt>上传时间</dt><dd>' + escapeHtml(ship.uploadedAt) + '</dd>' : '') +
        '</dl></div></div>';
    } else if (awaitingReceive) {
      shipHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__wait">退回已登记，等待后台确认收货后触发退款</div>' +
        '</div>';
    } else if (showUpload) {
      shipHtml =
        '<div class="aftersale-return-ship">' +
        '<div class="aftersale-return-ship__title">上传物流单号</div>' +
        renderShipFormFields('', '') +
        '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
        '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asHideShipUpload">取消</button>' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asSubmitReturnShip">提交</button>' +
        '</div></div>';
    } else if (activePickup) {
      var pickupWait =
        detail.userOps && detail.userOps.cancelPickup
          ? '待揽收：用户端已再次发起寄件'
          : '待揽收：用户端已预约寄件';
      shipHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__wait">' +
        escapeHtml(pickupWait) +
        '</div></div>';
    } else if (canUpload) {
      shipHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__wait">寄件已取消，处于待寄件状态</div>' +
        '</div>';
    } else {
      shipHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__wait">等待寄回物流信息</div>' +
        '</div>';
    }

    var actions = '';
    if (showUpload) {
      actions = '';
    } else if (awaitingReceive || hasShip) {
      /* 退货退款·待收货 / 换货已寄回：确认或拒绝收货 */
      var confirmId = type === '换货' ? 'asExchangeReceived' : 'asReturnReceived';
      var confirmText = type === '退货退款' ? '确认收货并退款' : '确认收货';
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--danger" id="asRejectReceive">拒绝收货</button>' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="' +
        confirmId +
        '">' +
        confirmText +
        '</button></div>';
    } else if (activePickup) {
      /* 揽收前：可取消寄件；上传需先取消 */
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asCancelShip">取消寄件</button>' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asShowShipUpload">上传物流单号</button>' +
        '</div>';
    } else if (canUpload) {
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asMockUserReship">模拟用户再次寄件</button>' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asShowShipUpload">上传物流单号</button>' +
        '</div>';
    }

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">' +
      escapeHtml(title) +
      '</h2>' +
      renderMerchantAddrCard(detail.returnAddress, addrTitle) +
      shipHtml +
      actions +
      '</section>'
    );
  }

  function renderPurchaseOrderCard(po) {
    if (!po) return '';
    /* 展示层：采购单号→订货单号；历史「已下发采购」统一显示为「已下发订货」 */
    var statusText = po.status === '已下发采购' ? '已下发订货' : po.status;
    var fields =
      field('订货单号', po.id) +
      field('下发时间', po.createdAt) +
      field('状态', statusText) +
      field('商品', po.productName) +
      field('申请补货数量', po.qty) +
      (po.actualQty != null ? field('实际补货数量', po.actualQty) : field('实际补货数量', '--')) +
      field('说明', po.remark, { className: 'aftersale-apply-field--span2' });
    return renderInfoPanel('采购补货指令', renderInfoGrid(fields, 4));
  }

  function renderRestockPurchasePanel(detail) {
    if (detail.type !== '补货') return '';
    var status = detail.status;
    // 补货无退款单：审核通过后为待收货，完成后为已完成
    if (status !== '待收货' && status !== '已完成') {
      return '';
    }

    var ships = detail.shipments || {};
    var ship = ships.restockShip;
    var hasShip = !!(ship && ship.trackingNo);
    var done = status === '已完成';
    var noTrack = isNoTrackRestock(detail);
    var pickupRestock = isPickupFulfillment(detail.deliveryMode);
    var deliveryRestock = isDeliveryFulfillment(detail.deliveryMode);
    var withPo = hasPurchaseRestockOrder(detail);
    var po = null;
    if (withPo) {
      po = detail.purchaseOrder || makePurchaseOrder(detail);
      detail.purchaseOrder = po;
      if (done && detail.actualRestockQty != null && po.actualQty == null) {
        po.actualQty = detail.actualRestockQty;
      }
    } else {
      detail.purchaseOrder = null;
    }

    var title = done
      ? '补货处理 · 已完成'
      : pickupRestock
        ? '补货处理 · 到店自提'
        : deliveryRestock
          ? '补货处理 · 仓配到店'
          : withPo
            ? '补货处理 · 采购补货中'
            : '补货处理 · 供应商补货中';
    var desc;
    if (done) {
      desc = noTrack
        ? pickupRestock
          ? '已确认到店并回写实际补货数量，补货流程完成。'
          : '门店已确认入库，实际补货数量已回写售后单。'
        : '已确认收货并记录实际补货数量，补货流程完成。';
    } else if (pickupRestock) {
      desc =
        '审核已通过，补货将送达门店；到店后用户出示会员码随原单核销提货。也可后台确认到店并录入实际数量；待核销满 10 天将自动确认收货（实际补货数=申请数）。原单核销不反写关闭补货。';
    } else if (deliveryRestock) {
      desc =
        '审核已通过，供应商补发至仓库，仓库配送到门店。请确认收货并录入实际补货数量；门店收货入库将反写关闭补货。待收货满 10 天将自动确认（实际补货数=申请数）。';
    } else if (withPo) {
      desc =
        '审核已通过，系统已向采购端下发补货指令并生成采购单；等待采购回传物流后确认收货。上传物流满 10 天未确认将自动确认收货（实际补货数=申请数）。';
    } else {
      desc =
        '审核已通过，零售快递补货绕过仓储系统，直接与供应商对接补发；供应商寄回后后台上传物流并确认收货。上传物流满 10 天未确认将自动确认收货（实际补货数=申请数）。';
    }

    /* 平台配送 / 自提：去掉补货物流板块；仅快递补货展示物流 */
    var shipHtml = '';
    if (!noTrack) {
      var shipTitle = withPo ? '补货物流（采购回传）' : '补货物流';
      var showRestockUpload = !withPo && !!detail.showShipUploadForm;
      if (hasShip || done) {
        shipHtml = renderShipInfoCard(ship, shipTitle, 'restockShip');
      } else if (showRestockUpload) {
        /* 零售快递：后台上传补货物流 */
        shipHtml =
          '<div class="aftersale-return-ship">' +
          '<div class="aftersale-return-ship__title">上传物流单号</div>' +
          renderShipFormFields('', '') +
          '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
          '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asHideShipUpload">取消</button>' +
          '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asSubmitRestockShip">提交</button>' +
          '</div></div>';
      } else if (withPo) {
        shipHtml =
          '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
          '<div class="aftersale-return-ship__title">' +
          escapeHtml(shipTitle) +
          '</div>' +
          '<div class="aftersale-return-ship__wait">等待采购端回传物流信息</div>' +
          '<div class="aftersale-logistics-block__actions">' +
          '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asMockPurchaseShip">模拟采购回传物流</button>' +
          '</div></div>';
      } else {
        shipHtml =
          '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
          '<div class="aftersale-return-ship__title">' +
          escapeHtml(shipTitle) +
          '</div>' +
          '<div class="aftersale-return-ship__wait">供应商寄回后，请上传补货物流信息</div>' +
          '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
          '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asShowRestockShipUpload">上传物流信息</button>' +
          '</div></div>';
      }
    }

    var actions = '';
    if (!done && (noTrack || hasShip)) {
      var extraDemo = '';
      /* 仅代采配送保留「门店入库反写」；零售自提核销反写已取消 */
      if (deliveryRestock) {
        extraDemo =
          '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asRestockStoreInboundDemo">模拟门店入库反写</button>';
      }
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asRestockAutoCloseDemo">模拟满10天自动确认</button>' +
        extraDemo +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asRestockComplete">' +
        (pickupRestock
          ? '确认到店并录入数量'
          : deliveryRestock
            ? '确认收货并录入入库数量'
            : '确认收货并录入实际数量') +
        '</button></div>';
    }

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">' +
      escapeHtml(title) +
      '</h2>' +
      '<p class="aftersale-flow-card__desc">' +
      escapeHtml(desc) +
      '</p>' +
      (withPo ? renderPurchaseOrderCard(po) : '') +
      shipHtml +
      actions +
      '</section>'
    );
  }

  function isRejectBackSigned(reject) {
    if (!reject) return false;
    if (reject.signed) return true;
    return !!(reject.backShip && reject.backShip.status === '已签收');
  }

  function isRejectReturnPending(detail) {
    return !!(detail && detail.rejectReceive && !isRejectBackSigned(detail.rejectReceive));
  }

  function renderRejectReceivePanel(detail) {
    var reject = detail.rejectReceive;
    if (!reject) return '';
    if (detail.type !== '退货退款' && detail.type !== '换货') return '';

    var ships = detail.shipments || {};
    var mode = reject.mode || '重新寄回';
    var signed = isRejectBackSigned(reject);
    var closed = detail.status === '已取消' || detail.status === '已拒绝';

    /* 退回未签收：售后单仍未关闭 */
    if (!signed) {
      var pendingDesc =
        mode === '原路退回'
          ? '已拒绝签收，商品正由承运商原路退回；用户端退回物流「已签收」后，本售后单才会关闭。'
          : '已拒收并重新寄回；用户端退回物流「已签收」后，本售后单才会关闭。';
      var pendingBackTitle = mode === '原路退回' ? '原路退回物流' : '重新寄回物流';
      return (
        '<section class="aftersale-detail-card aftersale-flow-card">' +
        '<h2 class="aftersale-detail-card__title">退货处理 · 商品退回中</h2>' +
        '<p class="aftersale-flow-card__desc">' +
        escapeHtml(pendingDesc) +
        '</p>' +
        renderMerchantAddrCard(detail.returnAddress, returnAddrTitle(detail)) +
        renderShipInfoCard(ships.returnShip, '寄回物流（已拒收）', 'returnShip') +
        '<div class="aftersale-return-ship">' +
        '<div class="aftersale-return-ship__title">拒收说明</div>' +
        '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
        '<dt>退回方式</dt><dd>' +
        escapeHtml(mode) +
        '</dd>' +
        '<dt>拒收原因</dt><dd>' +
        escapeHtml(reject.reason || '-') +
        '</dd>' +
        '<dt>操作时间</dt><dd>' +
        escapeHtml(reject.time || '-') +
        '</dd>' +
        '<dt>操作人</dt><dd>' +
        escapeHtml(reject.operator || '超级管理员') +
        '</dd></dl></div></div>' +
        renderShipInfoCard(reject.backShip, pendingBackTitle, 'rejectBackShip') +
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asConfirmBackSigned">模拟退回已签收并关闭售后</button>' +
        '</div></section>'
      );
    }

    if (!closed) return '';

    var desc =
      mode === '原路退回'
        ? '退回物流已签收，商品原路退回完成；本次售后已关闭，不发起退款。'
        : '退回物流已签收，重新寄回完成；本次售后已关闭，不发起退款。';
    var backTitle = mode === '原路退回' ? '原路退回物流' : '重新寄回物流';
    var backHtml =
      mode === '原路退回'
        ? renderShipInfoCard(
            reject.backShip || ships.returnShip,
            backTitle,
            reject.backShip ? 'rejectBackShip' : 'returnShip'
          )
        : renderShipInfoCard(reject.backShip, backTitle, 'rejectBackShip');

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">退货处理 · 已拒收</h2>' +
      '<p class="aftersale-flow-card__desc">' +
      escapeHtml(desc) +
      '</p>' +
      renderMerchantAddrCard(detail.returnAddress, returnAddrTitle(detail)) +
      renderShipInfoCard(ships.returnShip, '寄回物流（已拒收）', 'returnShip') +
      '<div class="aftersale-return-ship">' +
      '<div class="aftersale-return-ship__title">拒收说明</div>' +
      '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
      '<dt>退回方式</dt><dd>' +
      escapeHtml(mode) +
      '</dd>' +
      '<dt>拒收原因</dt><dd>' +
      escapeHtml(reject.reason || '-') +
      '</dd>' +
      '<dt>操作时间</dt><dd>' +
      escapeHtml(reject.time || '-') +
      '</dd>' +
      '<dt>操作人</dt><dd>' +
      escapeHtml(reject.operator || '超级管理员') +
      '</dd></dl></div></div>' +
      backHtml +
      '</section>'
    );
  }

  function renderShipInfoCard(ship, title, shipKey) {
    if (!ship || !ship.trackingNo) {
      return renderInfoPanel(
        title,
        '<div class="aftersale-info-panel__empty">暂无物流信息</div>'
      );
    }
    var statusHtml =
      '<span>' +
      escapeHtml(ship.status || '--') +
      '</span> ' +
      '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="' +
      escapeHtml(shipKey || '') +
      '">跟踪信息</button>';
    return renderInfoPanel(
      title,
      renderInfoGrid(
        field('物流单号', ship.trackingNo) +
          field('物流公司', ship.company) +
          field('物流状态', ship.status, { html: statusHtml }) +
          field('上传时间', ship.uploadedAt || '--'),
        4
      )
    );
  }

  function renderExchangeOutPanel(detail) {
    if (detail.type !== '换货') return '';
    var status = detail.status;
    if (status !== '待收货' && status !== '退款中' && status !== '已完成') {
      return '';
    }
    // 配送换货：入仓前仍走退仓面板
    if (
      isDeliveryFulfillment(detail.deliveryMode) &&
      status === '待收货' &&
      !detail.warehouseInbound
    ) {
      return '';
    }

    var ships = detail.shipments || {};
    var returnShip = ships.returnShip;
    var outShip = ships.exchangeOutShip;
    var hasOut = !!(outShip && outShip.trackingNo);
    var done = status === '已完成';
    var noTrackOut =
      isPickupFulfillment(detail.deliveryMode) || isDeliveryFulfillment(detail.deliveryMode);

    var title = done
      ? '换货处理 · 已完成'
      : noTrackOut
        ? '换货处理 · 待换货到店'
        : '换货处理 · 待供应商寄出';
    var desc = done
      ? noTrackOut
        ? '换货流程已完成（无快递运单）。'
        : '换货流程已完成，以下为全程地址与物流信息。'
      : isPickupFulfillment(detail.deliveryMode)
        ? '门店已确认收到退货，请安排换货商品到店供用户自提。'
        : isDeliveryFulfillment(detail.deliveryMode)
          ? '仓库已入仓，请安排换货商品配送到门店（无快递运单）。'
          : '门店退货已签收，下一节点由供应商寄出换货商品至门店。';

    var returnHtml = returnShip
      ? renderShipInfoCard(returnShip, done ? '门店寄回物流' : '门店寄回物流（已签收）', 'returnShip')
      : noTrackOut
        ? '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
          '<div class="aftersale-return-ship__title">退货进度</div>' +
          '<div class="aftersale-return-ship__wait">' +
          (isPickupFulfillment(detail.deliveryMode)
            ? '用户已到店退货，门店已确认收货。'
            : '门店退仓已入仓。') +
          '</div></div>'
        : '';

    var outHtml;
    if (done) {
      outHtml = hasOut
        ? renderShipInfoCard(outShip, '供应商寄出物流（换出）', 'exchangeOutShip')
        : noTrackOut
          ? '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
            '<div class="aftersale-return-ship__title">换出进度</div>' +
            '<div class="aftersale-return-ship__wait">换货商品已到店，流程完成。</div></div>'
          : '';
    } else if (noTrackOut) {
      outHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">换货到店</div>' +
        '<div class="aftersale-return-ship__wait">无需填写快递单号，确认换货商品已到店即可完结。</div>' +
        '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asExchangeArriveStore">模拟换货到店完成</button>' +
        '</div></div>';
    } else if (hasOut) {
      outHtml = renderShipInfoCard(outShip, '供应商寄出物流（换出）', 'exchangeOutShip');
    } else {
      outHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">供应商寄出物流（换出）</div>' +
        '<div class="aftersale-return-ship__wait">已收到门店退货，请填写供应商寄出换货商品的物流信息</div>' +
        renderShipFormFields('', '') +
        '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asExchangeShip">确认换货寄出</button>' +
        '</div></div>';
    }

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">' +
      escapeHtml(title) +
      '</h2>' +
      '<p class="aftersale-flow-card__desc">' +
      escapeHtml(desc) +
      '</p>' +
      renderMerchantAddrCard(detail.returnAddress, returnAddrTitle(detail)) +
      returnHtml +
      outHtml +
      '</section>'
    );
  }

  function renderFlowPanel(detail) {
    var type = detail.type;
    var status = detail.status;

    var rejectPanel = renderRejectReceivePanel(detail);
    if (rejectPanel) return rejectPanel;

    /* 退回中待签收时不再展示待退货操作区 */
    if (isRejectReturnPending(detail)) return '';

    var awaitReturn = renderAwaitReturnPanel(detail);
    if (awaitReturn) return awaitReturn;

    var exchangeOut = renderExchangeOutPanel(detail);
    if (exchangeOut) return exchangeOut;

    var restockPanel = renderRestockPurchasePanel(detail);
    if (restockPanel) return restockPanel;

    return '';
  }

  function renderAside(detail) {
    var c = detail.customer;
    var o = detail.order;
    var progressHtml = detail.progress
      .map(function (p) {
        return (
          '<div class="aftersale-timeline__item' +
          (p.current ? ' is-current' : '') +
          '">' +
          '<span class="aftersale-timeline__dot' +
          (p.hollow ? ' aftersale-timeline__dot--hollow' : '') +
          '">' +
          (p.hollow ? '' : CHECK_SVG) +
          '</span>' +
          '<div class="aftersale-timeline__title">' +
          escapeHtml(p.title) +
          (p.time ? '<span class="aftersale-timeline__time">' + escapeHtml(p.time) + '</span>' : '') +
          (p.current ? '<span class="aftersale-timeline__badge">当前节点</span>' : '') +
          '</div>' +
          (p.desc ? '<div class="aftersale-timeline__desc">' + escapeHtml(p.desc) + '</div>' : '') +
          (p.operator ? '<div class="aftersale-timeline__ops">操作人：' + escapeHtml(p.operator) + '</div>' : '') +
          '</div>'
        );
      })
      .join('');

    return (
      '<aside class="aftersale-detail-aside">' +
      '<div><h3 class="aftersale-aside-section__title">客户信息</h3>' +
      '<div class="aftersale-aside-kv"><span>客户等级</span><span>' +
      escapeHtml(c.level) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>购买次数</span><span>' +
      escapeHtml(c.purchaseCount) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>售后次数</span><span>' +
      escapeHtml(c.aftersaleCount) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>售后总金额</span><span>' +
      escapeHtml(c.aftersaleAmount) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>售后总金额占比</span><span>' +
      escapeHtml(c.aftersaleRatio) +
      '</span></div></div>' +
      '<div><h3 class="aftersale-aside-section__title">订单信息</h3>' +
      '<div class="aftersale-aside-kv"><span>订单号</span><span>' +
      escapeHtml(o.orderNo) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>下单时间</span><span>' +
      escapeHtml(o.orderTime) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>收货人名称</span><span>' +
      escapeHtml(o.receiver) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>收货人电话</span><span>' +
      escapeHtml(o.phone) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>订单金额</span><span>' +
      money(o.amount) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>订单状态</span><span class="aftersale-aside-status">' +
      escapeHtml(o.status) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>订单来源</span><span>' +
      escapeHtml(o.source) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>履约方式</span><span>' +
      escapeHtml(detail.deliveryMode || '-') +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>结算状态</span><span class="' +
      (isPostSettlement(detail) ? 'aftersale-aside-status' : '') +
      '">' +
      escapeHtml(settleStatusLabel(detail.settleStatus)) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>提货门店</span><span>' +
      escapeHtml(o.store) +
      '</span></div></div>' +
      '<div><h3 class="aftersale-aside-section__title">采购供应商信息</h3>' +
      '<div class="aftersale-aside-kv"><span>供应商</span><span>' +
      escapeHtml(detail.supplier.name) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>采购员</span><span>' +
      escapeHtml(detail.supplier.buyer) +
      '</span></div></div>' +
      '<div><h3 class="aftersale-aside-section__title">售后处理进度</h3>' +
      '<div class="aftersale-timeline">' +
      progressHtml +
      '</div></div></aside>'
    );
  }

  function renderAddrBlock(addr, title) {
    if (!addr) {
      return (
        '<div class="aftersale-logistics-block">' +
        '<div class="aftersale-logistics-block__title">' +
        escapeHtml(title || '供应商收货地址') +
        '</div>' +
        '<div class="aftersale-logistics-block__empty">暂未选择收货地址</div></div>'
      );
    }
    return (
      '<div class="aftersale-logistics-block">' +
      '<div class="aftersale-logistics-block__title">' +
      escapeHtml(title || '供应商收货地址') +
      '</div>' +
      '<div class="aftersale-aside-kv"><span>收货人</span><span>' +
      escapeHtml(addr.receiverName) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>联系电话</span><span>' +
      escapeHtml(addr.receiverPhone) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>收货地址</span><span>' +
      escapeHtml(addr.region) +
      ' ' +
      escapeHtml(addr.detailAddress) +
      '</span></div></div>'
    );
  }

  function renderShipBlock(ship, title, emptyText, extras, shipKey) {
    extras = extras || '';
    if (!ship || !ship.trackingNo) {
      return (
        '<div class="aftersale-logistics-block">' +
        '<div class="aftersale-logistics-block__title">' +
        escapeHtml(title) +
        '</div>' +
        '<div class="aftersale-logistics-block__empty">' +
        escapeHtml(emptyText || '暂无物流信息') +
        '</div>' +
        extras +
        '</div>'
      );
    }
    return (
      '<div class="aftersale-logistics-block">' +
      '<div class="aftersale-logistics-block__title">' +
      escapeHtml(title) +
      '</div>' +
      '<div class="aftersale-aside-kv"><span>物流单号</span><span class="aftersale-logistics-no">' +
      escapeHtml(ship.trackingNo) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>物流公司</span><span>' +
      escapeHtml(ship.company) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>物流状态</span><span>' +
      escapeHtml(ship.status || '-') +
      '</span></div>' +
      (ship.uploadedAt
        ? '<div class="aftersale-aside-kv"><span>上传时间</span><span>' + escapeHtml(ship.uploadedAt) + '</span></div>'
        : '') +
      '<div class="aftersale-logistics-block__actions">' +
      '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="' +
      escapeHtml(shipKey || '') +
      '">跟踪信息</button>' +
      '</div>' +
      extras +
      '</div>'
    );
  }

  function renderLogisticsSection(detail) {
    var type = detail.type;
    var status = detail.status;
    var ships = detail.shipments || {};

    // 退货/换货待退货、退货退款待收货、补货/换货专用面板由流程区承载，避免重复
    if ((type === '退货退款' || type === '换货') && status === '待退货') {
      return '';
    }
    if (type === '退货退款' && status === '待收货') {
      return '';
    }
    if (
      type === '换货' &&
      (status === '待收货' || status === '退款中' || status === '已完成')
    ) {
      return '';
    }
    if (type === '补货' && (status === '待收货' || status === '已完成')) {
      return '';
    }
    if (detail.rejectReceive && (status === '已取消' || status === '已拒绝' || isRejectReturnPending(detail))) {
      return '';
    }

    /**
     * 物流信息展示：
     * - 代采：审核后展示（与原先一致）
     * - 零售：进入退款中/已完成等阶段后，流程操作区已收起，仍需保留供应商收货地址与寄回物流（历史信息不消失）
     */
    var persistStatus =
      status === '退款中' ||
      status === '已完成' ||
      status === '退款异常' ||
      status === '已取消' ||
      status === '已拒绝';
    var hasReturnPersist =
      (type === '退货退款' || type === '换货') &&
      (detail.returnAddress || (ships.returnShip && ships.returnShip.trackingNo));
    var showForProxy = isProxyOrder(detail) && isPostAudit(status);
    var showForRetailPersist = !isProxyOrder(detail) && persistStatus && hasReturnPersist;
    if (!showForProxy && !showForRetailPersist) return '';

    var parts = [];
    parts.push(
      '<div class="aftersale-logistics-meta">订单来源：' +
        escapeHtml(detail.orderSource || '-') +
        '　履约方式：' +
        escapeHtml(detail.deliveryMode || '-') +
        '</div>'
    );

    if (type === '退货退款') {
      parts.push(renderAddrBlock(detail.returnAddress, returnAddrTitle(detail)));
      // 自提退门店 / 配送退仓：不展示快递运单
      if (isExpressFulfillment(detail.deliveryMode)) {
        parts.push(
          renderShipBlock(ships.returnShip, '寄回物流', '暂无寄回物流', '', 'returnShip')
        );
      }
    } else if (type === '换货') {
      parts.push(renderAddrBlock(detail.returnAddress, returnAddrTitle(detail)));
      if (isExpressFulfillment(detail.deliveryMode)) {
        parts.push(
          renderShipBlock(ships.returnShip, '寄回物流（门店→收货方）', '暂无寄回物流', '', 'returnShip')
        );
        parts.push(
          renderShipBlock(
            ships.exchangeOutShip,
            '换出物流（收货方→门店）',
            '暂无换出物流',
            '',
            'exchangeOutShip'
          )
        );
      }
    } else {
      return '';
    }

    return (
      '<section class="aftersale-detail-card aftersale-logistics-card">' +
      '<h2 class="aftersale-detail-card__title">物流信息</h2>' +
      parts.join('') +
      '</section>'
    );
  }

  function closeAsTrackDrawer() {
    var backdrop = document.getElementById('asTrackBackdrop');
    var drawer = document.getElementById('asTrackDrawer');
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
    document.body.style.overflow = '';
  }

  function openAsTrackDrawer(ship) {
    if (!ship || !ship.trackingNo) {
      if (typeof showToast === 'function') showToast('暂无物流信息', 'error');
      return;
    }
    closeAsTrackDrawer();
    var backdrop = document.createElement('div');
    backdrop.className = 'store-drawer-backdrop';
    backdrop.id = 'asTrackBackdrop';
    backdrop.addEventListener('click', closeAsTrackDrawer);

    var drawer = document.createElement('aside');
    drawer.className = 'store-drawer aftersale-track-drawer';
    drawer.id = 'asTrackDrawer';
    drawer.setAttribute('role', 'dialog');

    var timeline = (ship.timeline || DEFAULT_TIMELINE)
      .map(function (item, idx) {
        return (
          '<div class="aftersale-track-row">' +
          '<div class="aftersale-track-time">' +
          String(item.time || '').replace('\n', '<br>') +
          '</div>' +
          '<div class="aftersale-track-axis"><span class="aftersale-track-node' +
          (item.active || idx === 0 ? ' is-active' : '') +
          '"></span></div>' +
          '<div class="aftersale-track-content"><div class="aftersale-track-title' +
          (item.active || idx === 0 ? ' is-active' : '') +
          '">' +
          escapeHtml(item.title) +
          '</div><div class="aftersale-track-desc">' +
          (item.desc || '') +
          '</div></div></div>'
        );
      })
      .join('');

    drawer.innerHTML =
      '<div class="store-drawer__header"><h2 class="store-drawer__title">订单跟踪</h2>' +
      '<button type="button" class="store-drawer__close" id="asTrackClose" aria-label="关闭">×</button></div>' +
      '<div class="store-drawer__body aftersale-track-drawer__body">' +
      '<div class="aftersale-track-courier">' +
      '<span class="aftersale-track-courier__name">' +
      escapeHtml(ship.company) +
      '</span>' +
      '<span class="aftersale-track-courier__no">' +
      escapeHtml(ship.trackingNo) +
      '</span>' +
      '<button type="button" class="aftersale-track-link js-as-copy-track" data-no="' +
      escapeHtml(ship.trackingNo) +
      '">复制</button></div>' +
      '<div class="aftersale-track-timeline">' +
      timeline +
      '</div></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';

    drawer.querySelector('#asTrackClose').addEventListener('click', closeAsTrackDrawer);
    drawer.querySelector('.js-as-copy-track').addEventListener('click', function () {
      var no = ship.trackingNo;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(no).then(function () {
          if (typeof showToast === 'function') showToast('已复制运单号', 'success');
        });
      } else if (typeof showToast === 'function') {
        showToast('已复制运单号', 'success');
      }
    });
  }

  function renderFooter(detail) {
    var footer = $('asDetailFooter');
    if (!footer) return;
    if (isPending(detail.status)) {
      footer.hidden = false;
      footer.innerHTML =
        '<button type="button" class="aftersale-btn aftersale-btn--danger" id="asReject">拒绝</button>' +
        '<button type="button" class="aftersale-btn aftersale-btn--success" id="asApprove">审批通过</button>';
    } else {
      footer.hidden = true;
      footer.innerHTML = '';
    }
  }

  function renderPage() {
    var detail = state.detail;
    var body = $('asDetailBody');
    if (!body || !detail) return;
    if (tryAutoCloseRestock(detail)) {
      if (typeof showToast === 'function') {
        var src = detail.restockCloseSource || '';
        var tip =
          src.indexOf('auto_') === 0
            ? '已满 ' + RESTOCK_AUTO_CONFIRM_DAYS + ' 天，系统自动确认收货并关闭补货（实际数=申请数）'
            : src === 'store_inbound'
              ? '门店收货入库已反写，补货已关闭'
              : '补货已关闭';
        showToast(tip, 'success');
      }
    }
    var pending = isPending(detail.status);
    var editable = pending;
    var main =
      '<div class="aftersale-detail-main">' +
      renderStatusBanner(detail) +
      renderApply(detail) +
      renderGoods(detail, editable) +
      (pending ? renderApproveOps(detail) : renderApprovalInfo(detail)) +
      renderFlowPanel(detail) +
      renderRefundTicketCard(detail) +
      renderLogisticsSection(detail) +
      renderReasons(detail, pending) +
      '</div>';
    body.innerHTML = main + renderAside(detail);
    renderFooter(detail);
    bindShipFormAutoCourier();
    var page = $('asDetailPage');
    if (page) page.classList.toggle('has-footer', pending);
    focusActiveEditor();
  }

  function openAddrModal(onConfirm) {
    state.addrList = loadSupplierAddresses();
    var def = state.addrList.find(function (a) {
      return a.isDefault;
    });
    state.selectedAddrId = (def && def.id) || (state.addrList[0] && state.addrList[0].id) || '';
    var modal = $('asAddrModal');
    var body = $('asAddrModalBody');
    if (!modal || !body) return;
    body.innerHTML = state.addrList
      .map(function (a) {
        return (
          '<label class="aftersale-addr-card' +
          (a.id === state.selectedAddrId ? ' is-selected' : '') +
          '">' +
          '<input type="radio" name="asReturnAddr" value="' +
          escapeHtml(a.id) +
          '"' +
          (a.id === state.selectedAddrId ? ' checked' : '') +
          '>' +
          '<div class="aftersale-addr-card__body">' +
          '<div class="aftersale-addr-card__name">' +
          escapeHtml(a.receiverName) +
          ' ' +
          escapeHtml(a.receiverPhone) +
          (a.isDefault ? '<span class="aftersale-addr-card__tag">默认</span>' : '') +
          '</div>' +
          '<div class="aftersale-addr-card__addr">' +
          escapeHtml(a.region) +
          ' ' +
          escapeHtml(a.detailAddress) +
          '</div></div></label>'
        );
      })
      .join('');
    modal.hidden = false;
    modal._onConfirm = onConfirm;
  }

  function closeAddrModal() {
    var modal = $('asAddrModal');
    if (modal) {
      modal.hidden = true;
      modal._onConfirm = null;
    }
  }

  function applyApprovePass(addr) {
    var detail = state.detail;
    var type = state.approveType;
    detail.type = type;
    detail.approval.result = '已通过';
    detail.approval.approver = '超级管理员';
    detail.approval.time = nowText();
    detail.approval.remark = state.remark || '-';
    detail.showShipUploadForm = false;
    detail.shipCanceled = false;

    detail.shipments = detail.shipments || {
      returnShip: null,
      restockShip: null,
      exchangeOutShip: null
    };

    if (type === '仅退款') {
      detail.returnAddress = null;
      detail.status = '退款中';
      detail.approval.refundAmount = detail.applyAmount;
      detail.refundTicket = makeRefundTicket('approve', detail);
      detail.refundTicket.status = '待退款';
    } else if (type === '退货退款') {
      detail.returnAddress = resolveReturnAddress(detail, addr);
      detail.status = '待退货';
      detail.approval.refundAmount = detail.applyAmount;
      detail.refundTicket = null;
      detail.showShipUploadForm = false;
      detail.shipCanceled = false;
      // 自提退回门店 / 配送退仓：不进入快递寄件态；快递默认用户已发起寄件
      if (
        isPickupFulfillment(detail.deliveryMode) ||
        isDeliveryFulfillment(detail.deliveryMode)
      ) {
        detail.userPickupActive = false;
        detail.shipments.returnShip = null;
        if (isDeliveryFulfillment(detail.deliveryMode)) {
          detail.driverPickedUp = false;
          detail.warehouseInbound = false;
        }
      } else {
        detail.userPickupActive = true;
      }
    } else if (type === '补货') {
      // 补货：不下发收货地址；代采/零售自提下发采购补货指令，零售快递直连供应商
      detail.returnAddress = null;
      detail.purchaseOrder = hasPurchaseRestockOrder(detail) ? makePurchaseOrder(detail) : null;
      detail.status = '待收货';
      detail.approval.refundAmount = 0;
      detail.approval.coupon = 0;
      detail.approval.points = 0;
      detail.refundTicket = null;
    } else if (type === '换货') {
      detail.returnAddress = resolveReturnAddress(detail, addr);
      detail.status = '待退货';
      detail.approval.refundAmount = 0;
      detail.approval.coupon = 0;
      detail.approval.points = 0;
      detail.refundTicket = null;
      detail.shipCanceled = false;
      detail.showShipUploadForm = false;
      if (
        isPickupFulfillment(detail.deliveryMode) ||
        isDeliveryFulfillment(detail.deliveryMode)
      ) {
        detail.userPickupActive = false;
        detail.shipments.returnShip = null;
        detail.shipments.exchangeOutShip = null;
        if (isDeliveryFulfillment(detail.deliveryMode)) {
          detail.driverPickedUp = false;
          detail.warehouseInbound = false;
        }
      } else {
        detail.userPickupActive = true;
      }
    }
    detail.progress = buildProgress(type, detail.status, detail.id, detail.applyTime, detail.order.receiver);
    seedLogisticsByStatus(detail);
    renderPage();
    if (typeof showToast === 'function') {
      if (type === '仅退款') {
        showToast('审批通过，已生成退款单（待退款）', 'success');
      } else if (type === '退货退款') {
        showToast(
          isPickupFulfillment(detail.deliveryMode)
            ? '审批通过，售后单待退货；用户到店退回门店，门店确认收货后触发退款'
            : isDeliveryFulfillment(detail.deliveryMode)
              ? '审批通过，售后单待退货；门店退仓，司机取货后操作「已取货」'
              : '审批通过，售后单待退货；买家寄回后确认收货再生成退款单',
          'success'
        );
      } else if (type === '补货') {
        detail.restockAwaitReceiveAt = detail.restockAwaitReceiveAt || nowText();
        showToast(
          hasPurchaseRestockOrder(detail)
            ? '审批通过，已向采购端下发补货指令（无退款单）'
            : '审批通过，已通知供应商直接补发（无退款单）',
          'success'
        );
      } else if (type === '换货') {
        showToast(
          isPickupFulfillment(detail.deliveryMode)
            ? '审批通过，售后单待退货；用户到店退回门店'
            : isDeliveryFulfillment(detail.deliveryMode)
              ? '审批通过，售后单待退货；门店退仓后入仓再换出'
              : '审批通过（换货）',
          'success'
        );
      } else {
        showToast('审批通过（' + typeActionLabel(type) + '）', 'success');
      }
    }
  }

  function closeAuditConfirmModal() {
    var modal = $('asAuditConfirmModal');
    if (modal) modal.hidden = true;
    state.auditAction = '';
  }

  function openAuditConfirmModal(action) {
    var modal = $('asAuditConfirmModal');
    var title = $('asAuditConfirmTitle');
    var tip = $('asAuditConfirmTip');
    var reason = $('asAuditReason');
    var count = $('asAuditReasonCount');
    var btn = $('asAuditConfirmBtn');
    if (!modal || !btn) return;

    if (action === 'pass') {
      var approveType = state.approveType;
      var deliveryMode = (state.detail && state.detail.deliveryMode) || '';
      if (needsExpressAddrPick(approveType, deliveryMode)) {
        ensureAddrState();
        if (!getSelectedAddr()) {
          if (typeof showToast === 'function') showToast('请先选择供应商收货地址模板', 'error');
          return;
        }
      }
    }

    state.auditAction = action;
    if (title) title.textContent = action === 'pass' ? '确认审批通过' : '确认拒绝申请';
    if (tip) {
      tip.className =
        'aftersale-audit-modal__tip' + (action === 'reject' ? ' is-reject' : '');
      tip.textContent =
        action === 'pass'
          ? '确认通过该售后申请？通过后将按所选售后类型进入后续流程，请填写审核原因。'
          : '确认拒绝该售后申请？拒绝后售后单将关闭，请填写审核原因。';
    }
    if (reason) {
      reason.value = state.remark || '';
      reason.placeholder =
        action === 'pass' ? '请输入通过原因，如：符合售后政策，同意退货退款' : '请输入拒绝原因，如：不符合售后条件';
    }
    if (count) count.textContent = String((reason && reason.value ? reason.value.length : 0));
    btn.textContent = action === 'pass' ? '确认通过' : '确认拒绝';
    btn.className =
      'aftersale-btn ' + (action === 'pass' ? 'aftersale-btn--success' : 'aftersale-btn--danger');
    modal.hidden = false;
    if (reason) reason.focus();
  }

  function confirmAuditAction() {
    var reason = String((($('asAuditReason') || {}).value || '')).trim();
    if (!reason) {
      if (typeof showToast === 'function') showToast('请填写审核原因', 'error');
      return;
    }
    state.remark = reason;
    var action = state.auditAction;
    closeAuditConfirmModal();

    if (action === 'reject') {
      state.detail.status = '已拒绝';
      state.detail.approval.result = '已拒绝';
      state.detail.approval.approver = '超级管理员';
      state.detail.approval.time = nowText();
      state.detail.approval.remark = reason;
      state.detail.type = state.approveType;
      state.detail.progress = buildProgress(
        state.approveType,
        '已拒绝',
        state.detail.id,
        state.detail.applyTime,
        state.detail.order.receiver
      );
      renderPage();
      if (typeof showToast === 'function') showToast('已拒绝该售后申请', 'success');
      return;
    }

    if (action === 'pass') {
      var approveType = state.approveType;
      var deliveryMode = (state.detail && state.detail.deliveryMode) || '';
      if (needsStoreAddrOnly(approveType, deliveryMode)) {
        applyApprovePass(defaultStoreAddr(state.detail));
        return;
      }
      if (needsWarehouseAddrOnly(approveType, deliveryMode)) {
        applyApprovePass(defaultWarehouseAddr());
        return;
      }
      if (needsExpressAddrPick(approveType, deliveryMode)) {
        ensureAddrState();
        var addr = getSelectedAddr();
        if (!addr) {
          if (typeof showToast === 'function') showToast('请选择供应商收货地址模板', 'error');
          return;
        }
        applyApprovePass(Object.assign({}, addr, { source: 'supplier' }));
        return;
      }
      applyApprovePass(null);
    }
  }

  function closeCancelShipModal() {
    var modal = $('asCancelShipModal');
    if (modal) modal.hidden = true;
    state.cancelShipReason = '';
  }

  function closePickupConfirmModal() {
    var modal = $('asPickupConfirmModal');
    if (modal) modal.hidden = true;
  }

  function closeRestockQtyModal() {
    var modal = $('asRestockQtyModal');
    if (modal) modal.hidden = true;
  }

  function openRestockQtyModal() {
    var modal = $('asRestockQtyModal');
    if (!modal || !state.detail) return;
    var deliveryRestock = isDeliveryFulfillment(state.detail.deliveryMode);
    var pickupRestock = isPickupFulfillment(state.detail.deliveryMode);
    var g = (state.detail.goods && state.detail.goods[0]) || {};
    var applyQty = Number(g.applyQty != null ? g.applyQty : g.restockQty || g.refundQty) || 0;
    var title = $('asRestockQtyTitle');
    var tip = $('asRestockQtyTip');
    var meta = $('asRestockQtyMeta');
    var input = $('asRestockActualQty');
    var btn = $('asRestockQtyConfirm');
    if (title) {
      title.textContent = pickupRestock
        ? '确认到店数量'
        : deliveryRestock
          ? '确认入库数量'
          : '确认收货';
    }
    if (tip) {
      tip.textContent = pickupRestock
        ? '请填写实际到店补货数量，该数量将回写售后单。'
        : deliveryRestock
          ? '请填写门店实际入库数量，该数量将回写售后单的实际补货数量。'
          : '请填写实际收到的补货数量，该数量将记录在售后单中。';
    }
    if (meta) {
      meta.innerHTML =
        '<div>商品：<strong>' +
        escapeHtml(g.name || '-') +
        '</strong></div>' +
        '<div>申请补货数量：<strong>' +
        escapeHtml(applyQty) +
        '</strong></div>';
    }
    if (input) {
      input.value = String(
        g.actualRestockQty != null ? g.actualRestockQty : applyQty
      );
      input.max = String(applyQty);
    }
    if (btn) {
      btn.textContent = pickupRestock
        ? '确认到店并完成'
        : deliveryRestock
          ? '确认入库并完成'
          : '确认收货并完成补货';
    }
    modal.hidden = false;
    if (input) input.focus();
  }

  function confirmRestockQtyAndComplete() {
    if (!state.detail || state.detail.type !== '补货') return;
    var applyQty = getApplyRestockQtyFromDetail(state.detail);
    var raw = String((($('asRestockActualQty') || {}).value || '')).trim();
    var actual = parseInt(raw, 10);
    if (isNaN(actual) || actual < 0) {
      if (typeof showToast === 'function') showToast('请输入有效的实际补货数量', 'error');
      return;
    }
    if (actual > applyQty) {
      if (typeof showToast === 'function') {
        showToast('实际数量不能超过申请补货数量（最多' + applyQty + '件）', 'error');
      }
      return;
    }
    completeRestockClose(state.detail, actual, 'manual_admin');
    closeRestockQtyModal();
    renderPage();
    if (typeof showToast === 'function') {
      showToast('已记录实际补货数量 ' + actual + '，补货完成', 'success');
    }
  }

  function openPickupConfirmModal() {
    var modal = $('asPickupConfirmModal');
    if (!modal) return;
    if (
      !state.detail ||
      (state.detail.type !== '退货退款' && state.detail.type !== '换货') ||
      !isDeliveryFulfillment(state.detail.deliveryMode) ||
      state.detail.status !== '待退货'
    ) {
      if (typeof showToast === 'function') showToast('当前状态不可操作已取货', 'error');
      return;
    }
    modal.hidden = false;
  }

  function applyDeliveryPickedUp() {
    var detail = state.detail;
    if (
      !detail ||
      (detail.type !== '退货退款' && detail.type !== '换货') ||
      !isDeliveryFulfillment(detail.deliveryMode)
    ) {
      return;
    }
    if (detail.status !== '待退货') {
      if (typeof showToast === 'function') showToast('当前状态不可操作已取货', 'error');
      return;
    }
    detail.driverPickedUp = true;
    detail.driverPickedAt = nowText();
    detail.warehouseInbound = false;
    detail.status = '待收货';
    detail.shipments = detail.shipments || {};
    detail.shipments.returnShip = null;
    if (!detail.returnAddress) {
      detail.returnAddress = resolveReturnAddress(detail, null);
    }
    detail.progress = buildProgress(
      detail.type,
      detail.status,
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    closePickupConfirmModal();
    renderPage();
    if (typeof showToast === 'function') {
      showToast('已确认取货，售后单已变更为待收货', 'success');
    }
  }

  function applyWarehouseInboundRefund() {
    var detail = state.detail;
    if (
      !detail ||
      (detail.type !== '退货退款' && detail.type !== '换货') ||
      !isDeliveryFulfillment(detail.deliveryMode)
    ) {
      return;
    }
    if (detail.status !== '待收货') {
      if (typeof showToast === 'function') showToast('当前状态不可模拟入仓', 'error');
      return;
    }
    detail.warehouseInbound = true;
    detail.warehouseInboundAt = nowText();
    detail.shipments = detail.shipments || {};
    detail.shipments.returnShip = null;

    if (detail.type === '换货') {
      detail.status = '待收货';
      detail.progress = buildProgress(
        '换货',
        '待收货',
        detail.id,
        detail.applyTime,
        detail.order.receiver
      );
      seedLogisticsByStatus(detail);
      renderPage();
      if (typeof showToast === 'function') {
        showToast('仓库已入仓，可安排换货到店', 'success');
      }
      return;
    }

    detail.status = '退款中';
    detail.refundTicket = makeRefundTicket('receive', detail);
    detail.refundTicket.status = '待退款';
    detail.progress = buildProgress(
      '退货退款',
      '退款中',
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    seedLogisticsByStatus(detail);
    renderPage();
    if (typeof showToast === 'function') {
      showToast('仓库已入仓，已生成退款单（待退款）', 'success');
    }
  }

  /** 自提：门店确认收到退货 → 退款中生成退款单 / 换货进入换出 */
  function applyStoreReturnReceived() {
    var detail = state.detail;
    if (
      !detail ||
      !isPickupFulfillment(detail.deliveryMode) ||
      (detail.type !== '退货退款' && detail.type !== '换货')
    ) {
      return;
    }
    if (detail.status !== '待退货' && detail.status !== '待收货') {
      if (typeof showToast === 'function') showToast('当前状态不可确认门店收货', 'error');
      return;
    }
    detail.returnAddress = resolveReturnAddress(detail, detail.returnAddress);
    detail.userPickupActive = false;
    detail.shipments = detail.shipments || {};
    detail.shipments.returnShip = null;
    if (detail.type === '换货') {
      detail.status = '待收货';
      detail.progress = buildProgress(
        '换货',
        '待收货',
        detail.id,
        detail.applyTime,
        detail.order.receiver
      );
      seedLogisticsByStatus(detail);
      renderPage();
      if (typeof showToast === 'function') {
        showToast('门店已确认收货，可安排换货到店', 'success');
      }
      return;
    }

    detail.status = '退款中';
    detail.refundTicket = makeRefundTicket('receive', detail);
    detail.refundTicket.status = '待退款';
    detail.progress = buildProgress(
      '退货退款',
      '退款中',
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    seedLogisticsByStatus(detail);
    renderPage();
    if (typeof showToast === 'function') {
      showToast('门店已确认收货，已生成退款单（待退款）', 'success');
    }
  }

  function openCancelShipModal() {
    if (hasTrackableReturnShip(state.detail)) {
      if (typeof showToast === 'function') {
        showToast('物流已可跟踪（已揽收），不可取消寄件', 'error');
      }
      return;
    }
    if (!canCancelShip(state.detail)) {
      if (typeof showToast === 'function') showToast('当前无可取消的寄件', 'error');
      return;
    }
    var modal = $('asCancelShipModal');
    var list = $('asCancelShipReasonList');
    if (!modal || !list) return;
    state.cancelShipReason = state.cancelShipReason || '';
    list.innerHTML = CANCEL_PICKUP_REASONS.map(function (reason, idx) {
      var id = 'asCancelShipReason_' + idx;
      var checked = state.cancelShipReason === reason;
      return (
        '<label class="aftersale-reason-list__item' +
        (checked ? ' is-selected' : '') +
        '" for="' +
        id +
        '">' +
        '<input type="radio" name="asCancelShipReason" id="' +
        id +
        '" value="' +
        escapeHtml(reason) +
        '"' +
        (checked ? ' checked' : '') +
        '>' +
        '<span>' +
        escapeHtml(reason) +
        '</span></label>'
      );
    }).join('');
    modal.hidden = false;
  }

  function applyCancelShip() {
    if (hasTrackableReturnShip(state.detail)) {
      if (typeof showToast === 'function') {
        showToast('物流已可跟踪（已揽收），不可取消寄件', 'error');
      }
      closeCancelShipModal();
      return;
    }
    var reason = state.cancelShipReason;
    if (!reason) {
      if (typeof showToast === 'function') showToast('请选择取消原因', 'error');
      return;
    }
    var detail = state.detail;
    detail.shipments = detail.shipments || {};
    detail.shipments.returnShip = null;
    detail.userPickupActive = false;
    detail.shipCanceled = true;
    detail.showShipUploadForm = false;
    detail.status = '待退货';
    detail.userOps = detail.userOps || {};
    detail.userOps.cancelPickup = {
      reason: reason,
      time: nowText(),
      source: '售后管理',
      operator: '超级管理员'
    };
    detail.progress = buildProgress(
      detail.type,
      '待退货',
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    closeCancelShipModal();
    renderPage();
    if (typeof showToast === 'function') showToast('已取消寄件，可上传物流单号或等待用户再次寄件', 'success');
  }

  function closeRejectModal() {
    var modal = $('asRejectModal');
    if (modal) modal.hidden = true;
  }

  function bindRejectShipAutoCourier() {
    var trackingInput = $('asRejectShipNo');
    var courierSelect = $('asRejectShipCompany');
    if (!trackingInput || !courierSelect) return;
    if (window.LogisticsTrackingNo) window.LogisticsTrackingNo.bindInput(trackingInput);

    function applyCourierFromTracking() {
      var inferred = inferCourierFromTrackingNo(trackingInput.value);
      if (inferred) courierSelect.value = inferred;
    }

    trackingInput.addEventListener('input', applyCourierFromTracking);
    trackingInput.addEventListener('blur', applyCourierFromTracking);
  }

  function syncRejectModeUI() {
    var modeInput = document.querySelector('input[name="asRejectMode"]:checked');
    var mode = (modeInput && modeInput.value) || '原路退回';
    var shipBlock = $('asRejectReshipBlock');
    if (shipBlock) shipBlock.hidden = mode !== '重新寄回';
    document.querySelectorAll('.aftersale-reject-mode__item').forEach(function (item) {
      var input = item.querySelector('input');
      item.classList.toggle('is-selected', !!(input && input.checked));
    });
  }

  function openRejectModal() {
    var modal = $('asRejectModal');
    if (!modal) return;
    var reason = $('asRejectReason');
    var count = $('asRejectReasonCount');
    var noInput = $('asRejectShipNo');
    var companySelect = $('asRejectShipCompany');
    if (reason) reason.value = '';
    if (count) count.textContent = '0';
    if (noInput) noInput.value = '';
    if (companySelect) companySelect.innerHTML = renderCourierOptions('');
    var originRadio = modal.querySelector('input[name="asRejectMode"][value="原路退回"]');
    if (originRadio) originRadio.checked = true;
    syncRejectModeUI();
    modal.hidden = false;
    bindRejectShipAutoCourier();
    if (reason) reason.focus();
  }

  function applyRejectReceive() {
    var reason = String((($('asRejectReason') || {}).value || '')).trim();
    var modeInput = document.querySelector('input[name="asRejectMode"]:checked');
    var mode = (modeInput && modeInput.value) || '';
    var no = String((($('asRejectShipNo') || {}).value || '')).trim();
    var company = String((($('asRejectShipCompany') || {}).value || '')).trim();
    if (!reason) {
      if (typeof showToast === 'function') showToast('请填写拒收原因', 'error');
      return;
    }
    if (mode !== '原路退回' && mode !== '重新寄回') {
      if (typeof showToast === 'function') showToast('请选择退回方式', 'error');
      return;
    }
    if (mode === '重新寄回') {
      no = readValidatedTrackingNo('asRejectShipNo');
      if (!no) return;
      company = String((($('asRejectShipCompany') || {}).value || '')).trim();
      if (!company) {
        if (typeof showToast === 'function') showToast('请选择重新寄回的物流公司', 'error');
        return;
      }
    }

    var detail = state.detail;
    detail.shipments = detail.shipments || {};
    var returnShip = detail.shipments.returnShip;
    if (returnShip) {
      returnShip.status = mode === '原路退回' ? '原路退回中' : '已拒收';
    }

    var backShip = null;
    if (mode === '重新寄回') {
      backShip = makeShip(company, no, '退回中');
    } else if (returnShip && returnShip.trackingNo) {
      backShip = {
        id: returnShip.id || 'AS-SHIP-BACK',
        company: returnShip.company,
        trackingNo: returnShip.trackingNo,
        status: '原路退回中',
        uploadedAt: nowText(),
        timeline: returnShip.timeline || DEFAULT_TIMELINE
      };
    }

    detail.rejectReceive = {
      mode: mode,
      reason: reason,
      time: nowText(),
      operator: '超级管理员',
      backShip: backShip,
      signed: false
    };
    /* 退回物流未签收前售后单不关闭，保持待退货 */
    detail.status = '待退货';
    detail.progress = buildProgress(
      detail.type,
      '待退货',
      detail.id,
      detail.applyTime,
      detail.order.receiver
    );
    closeRejectModal();
    renderPage();
    if (typeof showToast === 'function') {
      showToast(
        mode === '原路退回'
          ? '已拒绝签收，等待退回物流签收后关闭售后'
          : '已拒收并重新寄回，等待退回物流签收后关闭售后',
        'success'
      );
    }
  }

  function bindEvents() {
    var closeBtn = $('asDetailClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        window.location.href = listHref();
      });
    }

    var body = $('asDetailBody');
    var footer = $('asDetailFooter');
    var modal = $('asAddrModal');

    function onRootClick(e) {
      var editGoodsStatus = e.target.closest('.js-as-edit-goods-status');
      if (editGoodsStatus) {
        if (editGoodsStatus.disabled) return;
        commitOpenGoodsInput();
        state.editing.goodsStatus = true;
        state.editing.amountIdx = -1;
        state.editing.qtyIdx = -1;
        renderPage();
        return;
      }
      var editAmt = e.target.closest('.js-as-edit-amount');
      if (editAmt) {
        if (editAmt.disabled) return;
        commitOpenGoodsInput();
        var amtIdx = parseInt(editAmt.getAttribute('data-idx'), 10);
        state.editing.goodsStatus = false;
        state.editing.amountIdx = isNaN(amtIdx) ? 0 : amtIdx;
        state.editing.qtyIdx = -1;
        renderPage();
        return;
      }
      var editQty = e.target.closest('.js-as-edit-qty');
      if (editQty) {
        if (editQty.disabled) return;
        commitOpenGoodsInput();
        var qtyIdx = parseInt(editQty.getAttribute('data-idx'), 10);
        state.editing.goodsStatus = false;
        state.editing.amountIdx = -1;
        state.editing.qtyIdx = isNaN(qtyIdx) ? 0 : qtyIdx;
        renderPage();
        return;
      }
      var tag = e.target.closest('.aftersale-reason-tag');
      if (tag && !tag.disabled) {
        var group = tag.getAttribute('data-group');
        var name = tag.getAttribute('data-tag');
        var list = state.detail.reasons[group] || (state.detail.reasons[group] = []);
        var idx = list.indexOf(name);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(name);
        tag.classList.toggle('is-active');
        return;
      }
      if (e.target.closest('#asCancelShip')) {
        openCancelShipModal();
        return;
      }
      if (e.target.closest('#asDeliveryPicked')) {
        openPickupConfirmModal();
        return;
      }
      if (e.target.closest('#asWarehouseInbound')) {
        applyWarehouseInboundRefund();
        return;
      }
      if (e.target.closest('#asStoreReturnReceived')) {
        applyStoreReturnReceived();
        return;
      }
      if (e.target.closest('#asExchangeArriveStore')) {
        if (!state.detail || state.detail.type !== '换货') return;
        state.detail.status = '已完成';
        state.detail.progress = buildProgress(
          '换货',
          '已完成',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        seedLogisticsByStatus(state.detail);
        renderPage();
        if (typeof showToast === 'function') showToast('换货已到店，流程完成', 'success');
        return;
      }
      if (e.target.closest('#asShowShipUpload')) {
        if (hasTrackableReturnShip(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('已有可跟踪物流，不可再上传物流单号', 'error');
          }
          return;
        }
        if (hasActivePickup(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('请先取消寄件后再上传物流单号', 'error');
          }
          return;
        }
        if (!state.detail.shipCanceled) {
          if (typeof showToast === 'function') {
            showToast('请先取消寄件后再上传物流单号', 'error');
          }
          return;
        }
        state.detail.showShipUploadForm = true;
        renderPage();
        return;
      }
      if (e.target.closest('#asHideShipUpload')) {
        state.detail.showShipUploadForm = false;
        renderPage();
        return;
      }
      if (e.target.closest('#asMockUserReship')) {
        state.detail.userPickupActive = true;
        state.detail.shipCanceled = false;
        state.detail.showShipUploadForm = false;
        state.detail.shipments = state.detail.shipments || {};
        /* 用户再次寄件：默认进入待揽收；若演示需直接出物流，可用已有物流单号状态 */
        state.detail.shipments.returnShip = null;
        renderPage();
        if (typeof showToast === 'function') {
          showToast('用户已再次发起寄件（待揽收）', 'success');
        }
        return;
      }
      if (e.target.closest('#asSubmitReturnShip')) {
        var shipCompany = String((($('asShipCompany') || {}).value || '')).trim();
        var shipNo = readValidatedTrackingNo('asShipNo');
        if (!shipNo) return;
        if (!shipCompany) {
          if (typeof showToast === 'function') showToast('请选择物流公司', 'error');
          return;
        }
        if (hasTrackableReturnShip(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('已有可跟踪物流，不可再上传物流单号', 'error');
          }
          return;
        }
        if (hasActivePickup(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('请先取消寄件后再上传物流单号', 'error');
          }
          return;
        }
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.returnShip = makeShip(shipCompany, shipNo, '运输中');
        state.detail.shipCanceled = false;
        state.detail.showShipUploadForm = false;
        state.detail.userPickupActive = false;
        if (!state.detail.returnAddress) {
          state.detail.returnAddress = resolveReturnAddress(state.detail, null);
        }
        // 退货退款：操作退回后进入待收货，后台确认收货再触发退款
        if (state.detail.type === '退货退款') {
          state.detail.status = '待收货';
        }
        state.detail.progress = buildProgress(
          state.detail.type,
          state.detail.status,
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') {
          showToast(
            state.detail.type === '退货退款'
              ? '退回已登记，售后单已变更为待收货'
              : '物流信息已提交，可跟踪物流',
            'success'
          );
        }
        return;
      }
      if (e.target.closest('#asShowRestockShipUpload')) {
        if (state.detail.type !== '补货' || isNoTrackRestock(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('当前补货场景无需上传物流', 'error');
          }
          return;
        }
        if ((state.detail.shipments || {}).restockShip) {
          if (typeof showToast === 'function') {
            showToast('已有补货物流，不可再上传', 'error');
          }
          return;
        }
        state.detail.showShipUploadForm = true;
        renderPage();
        return;
      }
      if (e.target.closest('#asSubmitRestockShip')) {
        if (state.detail.type !== '补货') return;
        var restockCompany = String((($('asShipCompany') || {}).value || '')).trim();
        var restockNo = readValidatedTrackingNo('asShipNo');
        if (!restockNo) return;
        if (!restockCompany) {
          if (typeof showToast === 'function') showToast('请选择物流公司', 'error');
          return;
        }
        if ((state.detail.shipments || {}).restockShip) {
          if (typeof showToast === 'function') {
            showToast('已有补货物流，不可再上传', 'error');
          }
          return;
        }
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.restockShip = makeShip(restockCompany, restockNo, '运输中');
        state.detail.restockShippedAt = state.detail.shipments.restockShip.uploadedAt || nowText();
        state.detail.showShipUploadForm = false;
        if (state.detail.status !== '已完成') state.detail.status = '待收货';
        state.detail.progress = buildProgress(
          '补货',
          state.detail.status,
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') showToast('补货物流已上传', 'success');
        return;
      }
      if (e.target.closest('#asMockPurchaseShip')) {
        if (isNoTrackRestock(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('平台配送/自提补货无物流轨迹，无需回传物流', 'error');
          }
          return;
        }
        /* 仅代采/有采购补货指令场景：模拟采购回传 */
        if (!hasPurchaseRestockOrder(state.detail)) {
          if (typeof showToast === 'function') {
            showToast('零售快递补货请在后台上传物流信息', 'error');
          }
          return;
        }
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.restockShip = makeShip(
          '申通快递',
          'STO' + String(Date.now()).slice(-11),
          '运输中'
        );
        state.detail.restockShippedAt =
          state.detail.shipments.restockShip.uploadedAt || nowText();
        if (state.detail.purchaseOrder) {
          state.detail.purchaseOrder.status = '采购已回传物流';
        }
        if (state.detail.status !== '已完成') state.detail.status = '待收货';
        state.detail.progress = buildProgress(
          '补货',
          state.detail.status,
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') showToast('采购端已回传补货物流', 'success');
        return;
      }
      if (e.target.closest('#asRestockComplete')) {
        openRestockQtyModal();
        return;
      }
      if (e.target.closest('#asRestockStoreInboundDemo')) {
        if (!state.detail || state.detail.type !== '补货') return;
        state.detail.storeInboundDone = true;
        if (tryAutoCloseRestock(state.detail)) {
          renderPage();
          if (typeof showToast === 'function') {
            showToast('门店收货入库已反写，补货已关闭（实际补货数=申请数）', 'success');
          }
        }
        return;
      }
      if (e.target.closest('#asRestockAutoCloseDemo')) {
        if (!state.detail || state.detail.type !== '补货') return;
        /* 演示：将计时锚点拨到 10 天前，触发自动确认（实际数=申请数） */
        var demoAnchor = new Date(Date.now() - (RESTOCK_AUTO_CONFIRM_DAYS + 1) * 24 * 60 * 60 * 1000);
        function pad(n) {
          return n < 10 ? '0' + n : '' + n;
        }
        var demoText =
          demoAnchor.getFullYear() +
          '-' +
          pad(demoAnchor.getMonth() + 1) +
          '-' +
          pad(demoAnchor.getDate()) +
          ' ' +
          pad(demoAnchor.getHours()) +
          ':' +
          pad(demoAnchor.getMinutes()) +
          ':' +
          pad(demoAnchor.getSeconds());
        if (isDeliveryFulfillment(state.detail.deliveryMode) || isPickupFulfillment(state.detail.deliveryMode)) {
          state.detail.restockAwaitReceiveAt = demoText;
        } else {
          state.detail.restockShippedAt = demoText;
          state.detail.shipments = state.detail.shipments || {};
          if (!state.detail.shipments.restockShip) {
            state.detail.shipments.restockShip = makeShip(
              '申通快递',
              'STO' + String(Date.now()).slice(-11),
              '运输中'
            );
          }
          state.detail.shipments.restockShip.uploadedAt = demoText;
        }
        if (tryAutoCloseRestock(state.detail)) {
          renderPage();
          if (typeof showToast === 'function') {
            showToast(
              '已模拟满 ' + RESTOCK_AUTO_CONFIRM_DAYS + ' 天自动确认收货（实际补货数=申请数）',
              'success'
            );
          }
        }
        return;
      }
      var trackBtn = e.target.closest('.js-as-track');
      if (trackBtn) {
        var key = trackBtn.getAttribute('data-ship-key');
        var ship =
          key === 'rejectBackShip'
            ? (state.detail.rejectReceive || {}).backShip
            : (state.detail.shipments || {})[key];
        openAsTrackDrawer(ship);
        return;
      }
      if (e.target.closest('#asConfirmBackSigned')) {
        var reject = state.detail.rejectReceive;
        if (!reject) return;
        if (reject.backShip) {
          reject.backShip.status = '已签收';
        } else {
          reject.backShip = makeShip('顺丰速运', 'SF' + String(Date.now()).slice(-12), '已签收');
        }
        reject.signed = true;
        reject.signedTime = nowText();
        if (state.detail.shipments && state.detail.shipments.returnShip) {
          state.detail.shipments.returnShip.status = '已拒收';
        }
        state.detail.status = '已拒绝';
        state.detail.progress = buildProgress(
          state.detail.type,
          '已拒绝',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') {
          showToast('退回物流已签收，售后单已拒绝关闭（未生成退款单）', 'success');
        }
        return;
      }
      if (e.target.closest('#asRejectReceive')) {
        openRejectModal();
        return;
      }
      if (e.target.closest('#asExchangeReceived')) {
        state.detail.status = '待收货';
        if (!state.detail.shipments.returnShip) {
          state.detail.shipments.returnShip = makeShip(
            '中通快递',
            'ZT' + String(Date.now()).slice(-12),
            '已签收'
          );
        }
        state.detail.progress = buildProgress(
          '换货',
          '待收货',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') showToast('已确认收货，可换货寄出', 'success');
        return;
      }
      if (e.target.closest('#asExchangeShip')) {
        var c2 = String((($('asShipCompany') || {}).value || '')).trim();
        var n2 = readValidatedTrackingNo('asShipNo');
        if (!n2) return;
        if (!c2) {
          if (typeof showToast === 'function') showToast('请选择物流公司', 'error');
          return;
        }
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.exchangeOutShip = makeShip(c2, n2, '运输中');
        state.detail.status = '已完成';
        state.detail.progress = buildProgress(
          '换货',
          '已完成',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        seedLogisticsByStatus(state.detail);
        renderPage();
        if (typeof showToast === 'function') showToast('换货已寄出，流程完成', 'success');
        return;
      }
      if (e.target.closest('#asReturnReceived')) {
        if (state.detail.shipments.returnShip) {
          state.detail.shipments.returnShip.status = '已签收';
        } else {
          state.detail.shipments.returnShip = makeShip(
            '顺丰速运',
            'SF' + String(Date.now()).slice(-12),
            '已签收'
          );
        }
        // 退货退款：确认收货后统一生成退款单（结算后为线下付款）
        state.detail.status = '退款中';
        state.detail.refundTicket = makeRefundTicket('receive', state.detail);
        state.detail.refundTicket.status = '待退款';
        state.detail.progress = buildProgress(
          '退货退款',
          '退款中',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        seedLogisticsByStatus(state.detail);
        renderPage();
        if (typeof showToast === 'function') {
          showToast('已确认收货，已生成退款单（待退款）', 'success');
        }
        return;
      }
      if (e.target.closest('#asRefundExecuting')) {
        applyRefundTicketStatus('退款执行中');
        if (typeof showToast === 'function') showToast('支付通道退款中', 'success');
        return;
      }
      if (e.target.closest('#asRefundSuccess')) {
        applyRefundTicketStatus('退款成功');
        if (typeof showToast === 'function') showToast('退款成功，售后单已完成', 'success');
        return;
      }
      if (e.target.closest('#asRefundFail')) {
        applyRefundTicketStatus('退款失败');
        if (typeof showToast === 'function') showToast('退款失败，售后单进入退款异常', 'error');
        return;
      }
      if (e.target.closest('#asRefundRetry')) {
        applyRefundTicketStatus('待退款');
        if (typeof showToast === 'function') showToast('已重新发起退款（待退款）', 'success');
        return;
      }
    }

    if (body) body.addEventListener('click', onRootClick);
    if (body) {
      body.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'asApproveType') {
          state.approveType = e.target.value;
          if (needsReturnAddrTemplate(state.approveType)) ensureAddrState();
          syncGoodsStatusForType(state.detail, state.approveType);
          clearInlineEditing();
          renderPage();
          return;
        }
        if (e.target && e.target.id === 'asGoodsStatus') {
          if (state.detail && state.detail.apply) {
            state.detail.apply.goodsStatus = e.target.value || '';
          }
          state.editing.goodsStatus = false;
          renderPage();
          return;
        }
        if (e.target && e.target.id === 'asReturnAddrSelect') {
          state.selectedAddrId = e.target.value || '';
          renderPage();
        }
      });

      body.addEventListener('focusout', function (e) {
        if (e.target && e.target.id === 'asGoodsStatus') {
          // 下拉展开选项时可能触发 blur，延迟关闭避免误关
          setTimeout(function () {
            if (state.editing.goodsStatus && document.activeElement !== $('asGoodsStatus')) {
              state.editing.goodsStatus = false;
              renderPage();
            }
          }, 150);
          return;
        }
        if (e.target && e.target.classList && e.target.classList.contains('js-as-goods-input')) {
          var input = e.target;
          var idx = parseInt(input.getAttribute('data-idx'), 10);
          var editType = input.getAttribute('data-edit');
          var ok = applyGoodsInputValue(input);
          setTimeout(function () {
            if (!ok) {
              focusActiveEditor();
              return;
            }
            if (editType === 'amount' && state.editing.amountIdx !== idx) return;
            if (editType === 'qty' && state.editing.qtyIdx !== idx) return;
            if (document.activeElement && document.activeElement.classList.contains('js-as-goods-input')) {
              return;
            }
            clearInlineEditing();
            renderPage();
          }, 0);
        }
      });

      body.addEventListener('keydown', function (e) {
        if (!e.target || !e.target.classList || !e.target.classList.contains('js-as-goods-input')) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          commitGoodsInput(e.target);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          clearInlineEditing();
          renderPage();
        }
      });
    }

    if (footer) {
      footer.addEventListener('click', function (e) {
        if (e.target.closest('#asReject')) {
          openAuditConfirmModal('reject');
          return;
        }
        if (e.target.closest('#asApprove')) {
          openAuditConfirmModal('pass');
        }
      });
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.closest('[data-addr-close]')) {
          closeAddrModal();
          return;
        }
        var radio = e.target.closest('input[name="asReturnAddr"]');
        if (radio) {
          state.selectedAddrId = radio.value;
          modal.querySelectorAll('.aftersale-addr-card').forEach(function (card) {
            card.classList.toggle('is-selected', card.querySelector('input').value === state.selectedAddrId);
          });
        }
        if (e.target.closest('#asAddrConfirm')) {
          var addr = state.addrList.find(function (a) {
            return a.id === state.selectedAddrId;
          });
          if (!addr) {
            if (typeof showToast === 'function') showToast('请选择收货地址', 'error');
            return;
          }
          var cb = modal._onConfirm;
          closeAddrModal();
          if (typeof cb === 'function') cb(addr);
        }
      });
    }

    var rejectModal = $('asRejectModal');
    if (rejectModal) {
      rejectModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-reject-close]')) {
          closeRejectModal();
          return;
        }
        if (e.target.closest('#asRejectConfirm')) {
          applyRejectReceive();
          return;
        }
        var modeRadio = e.target.closest('input[name="asRejectMode"]');
        if (modeRadio) syncRejectModeUI();
      });
      rejectModal.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'asRejectMode') {
          syncRejectModeUI();
        }
      });
      rejectModal.addEventListener('input', function (e) {
        if (e.target && e.target.id === 'asRejectReason') {
          var countEl = $('asRejectReasonCount');
          if (countEl) countEl.textContent = String((e.target.value || '').length);
        }
      });
    }

    var cancelShipModal = $('asCancelShipModal');
    if (cancelShipModal) {
      cancelShipModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-cancel-ship-close]')) {
          closeCancelShipModal();
          return;
        }
        if (e.target.closest('#asCancelShipConfirm')) {
          applyCancelShip();
          return;
        }
        var reasonRadio = e.target.closest('input[name="asCancelShipReason"]');
        if (reasonRadio) {
          state.cancelShipReason = reasonRadio.value || '';
          cancelShipModal.querySelectorAll('.aftersale-reason-list__item').forEach(function (item) {
            var input = item.querySelector('input');
            item.classList.toggle('is-selected', !!(input && input.checked));
          });
        }
      });
      cancelShipModal.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'asCancelShipReason') {
          state.cancelShipReason = e.target.value || '';
          cancelShipModal.querySelectorAll('.aftersale-reason-list__item').forEach(function (item) {
            var input = item.querySelector('input');
            item.classList.toggle('is-selected', !!(input && input.checked));
          });
        }
      });
    }

    var auditModal = $('asAuditConfirmModal');
    if (auditModal) {
      auditModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-audit-close]')) {
          closeAuditConfirmModal();
          return;
        }
        if (e.target.closest('#asAuditConfirmBtn')) {
          confirmAuditAction();
        }
      });
      auditModal.addEventListener('input', function (e) {
        if (e.target && e.target.id === 'asAuditReason') {
          var countEl = $('asAuditReasonCount');
          if (countEl) countEl.textContent = String((e.target.value || '').length);
        }
      });
    }

    var pickupModal = $('asPickupConfirmModal');
    if (pickupModal) {
      pickupModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-pickup-close]')) {
          closePickupConfirmModal();
          return;
        }
        if (e.target.closest('#asPickupConfirmBtn')) {
          applyDeliveryPickedUp();
        }
      });
    }

    var restockQtyModal = $('asRestockQtyModal');
    if (restockQtyModal) {
      restockQtyModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-restock-qty-close]')) {
          closeRestockQtyModal();
          return;
        }
        if (e.target.closest('#asRestockQtyConfirm')) {
          confirmRestockQtyAndComplete();
        }
      });
    }
  }

  function init() {
    state.detail = buildDetail();
    state.approveType = state.detail.type;
    if (needsReturnAddrTemplate(state.approveType)) ensureAddrState();
    renderPage();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
