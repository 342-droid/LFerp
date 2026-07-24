/**
 * 售后详情 — 按状态/类型分支
 * 对齐用户端我要进货：仅退款 / 退货退款 / 补货 / 换货
 *
 * 状态矩阵要点：
 * - 仅退款：审核通过 → 退款中/待退款 →（通道）退款执行中 → 已完成/退款成功 或 退款异常/退款失败
 * - 退货退款：审核通过 → 待退货 → 操作退回 → 待收货 → 确认收货 → 退款中/待退款 → …
 *             门店拒绝收货签收后 → 已拒绝（不生成退款单）
 * - 补货：无退款单；审核通过 → 待收货（采购补货中）→ 已完成
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
      '<input class="aftersale-filter-field__input" id="asShipNo" type="text" maxlength="32" ' +
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

    function applyCourierFromTracking() {
      var inferred = inferCourierFromTrackingNo(trackingInput.value);
      if (inferred) courierSelect.value = inferred;
    }

    trackingInput.addEventListener('input', applyCourierFromTracking);
    trackingInput.addEventListener('blur', applyCourierFromTracking);
    applyCourierFromTracking();
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
    if (type === '补货') return '收到商品破损/污渍等';
    if (type === '换货') return '质量问题';
    if (type === '退货退款') return '质量问题';
    if (type === '仅退款' && isPreShipOrderStatus(orderStatus)) return '我不想要了';
    if (goodsStatus === '未收到货') return '不喜欢/不想要';
    return '质量问题';
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

  function refreshGoodsSummary(detail) {
    if (!detail || !detail.goods) return;
    var refundAmount = 0;
    var refundQty = 0;
    detail.goods.forEach(function (g) {
      refundAmount += Number(g.refundAmount) || 0;
      refundQty += Number(isRestockGoods(detail) ? g.restockQty || g.refundQty : g.refundQty) || 0;
    });
    detail.summary = detail.summary || {};
    detail.summary.refundAmount = Math.round(refundAmount * 100) / 100;
    detail.summary.refundQty = refundQty;
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
      g.refundQty = qty;
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
   * 退款单生成时机：
   * - 仅退款：审核通过后生成
   * - 退货退款：供应商确认收货后生成
   */
  function makeRefundTicket(trigger) {
    return {
      id: 'RF-' + String(Date.now()).slice(-12),
      createdAt: nowText(),
      /** approve | receive */
      trigger: trigger || 'approve',
      status: '待退款'
    };
  }

  function refundTicketTriggerLabel(trigger) {
    if (trigger === 'receive') return '供应商确认收货后生成';
    return '审核通过后生成';
  }

  function renderRefundTicketCard(detail) {
    var ticket = detail.refundTicket;
    if (!ticket || !ticket.id) return '';
    var refundStatus = ticket.status || '待退款';
    var canAdvance =
      detail.status === '退款中' ||
      detail.status === '退款异常' ||
      refundStatus === '待退款' ||
      refundStatus === '退款执行中' ||
      refundStatus === '退款失败';
    var actions = '';
    if (canAdvance && refundStatus !== '退款成功') {
      actions =
        '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
        (refundStatus === '待退款'
          ? '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asRefundExecuting">模拟支付通道退款中</button>'
          : '') +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asRefundSuccess">模拟退款成功</button>' +
        (refundStatus !== '退款失败'
          ? '<button type="button" class="aftersale-btn aftersale-btn--danger" id="asRefundFail">模拟退款失败</button>'
          : '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asRefundRetry">重新发起退款</button>') +
        '</div>';
    }
    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">退款单</h2>' +
      '<div class="aftersale-return-ship">' +
      '<div class="aftersale-return-ship__title">退款单据已生成</div>' +
      '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
      '<dt>退款单号</dt><dd>' +
      escapeHtml(ticket.id) +
      '</dd>' +
      '<dt>生成时机</dt><dd>' +
      escapeHtml(refundTicketTriggerLabel(ticket.trigger)) +
      '</dd>' +
      '<dt>生成时间</dt><dd>' +
      escapeHtml(ticket.createdAt || '-') +
      '</dd>' +
      '<dt>执行状态</dt><dd>' +
      escapeHtml(refundStatus) +
      '</dd></dl></div></div>' +
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

  function buildProgress(type, status, ticketId, applyTime, applicant) {
    var deliveryMode = (state.detail && state.detail.deliveryMode) || '';
    var returnDesc = isDeliveryFulfillment(deliveryMode)
      ? '用户寄回商品至仓库地址'
      : '用户寄回商品至供应商地址';
    var steps = [];
    if (type === '补货') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了补货申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
        { key: 'purchase', title: '采购补货', desc: '已向采购端下发补货指令，等待物流回传' },
        { key: 'done', title: '补货完成', desc: '补货流程完成' }
      ];
    } else if (type === '换货') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了换货申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
        { key: 'return', title: '寄回商品', desc: returnDesc },
        { key: 'ship', title: '换货寄出', desc: '平台发出换货商品' },
        { key: 'done', title: '换货完成', desc: '换货流程完成' }
      ];
    } else if (type === '退货退款') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了退货退款申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
        { key: 'return', title: '寄回商品', desc: returnDesc },
        { key: 'refund', title: '平台退款', desc: '退款处理中' },
        { key: 'done', title: '退款成功', desc: '退款完成' }
      ];
    } else {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了仅退款申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
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
          desc: '当前节点',
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
      return {
        title: s.title,
        time: done || current ? (idx === 0 ? applyTime : nowText()) : '',
        desc: current ? '当前节点' : s.desc + (s.key === 'done' && type.indexOf('退') >= 0 ? '，售后单号 ' + ticketId : ''),
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

  /** 履约方式枚举仅：快递、配送（兼容历史文案） */
  function normalizeFulfillmentMode(mode) {
    var m = String(mode || '').trim();
    if (!m) return '快递';
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

  function returnAddrTitle(detail) {
    if (isDeliveryFulfillment(detail && detail.deliveryMode)) return '仓库收货地址';
    return '供应商收货地址';
  }

  /**
   * 退货退款收货地址：
   * - 配送 → 仓库收货地址
   * - 快递 → 供应商收货地址
   * 补货不展示收货地址
   */
  function resolveReturnAddress(detail, preferredAddr) {
    if (!detail || detail.type === '补货') return null;
    if (detail.type !== '退货退款' && detail.type !== '换货') return preferredAddr || detail.returnAddress || null;
    if (isDeliveryFulfillment(detail.deliveryMode)) {
      return preferredAddr && preferredAddr.source === 'warehouse'
        ? preferredAddr
        : defaultWarehouseAddr();
    }
    if (preferredAddr && preferredAddr.source !== 'warehouse') {
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
   *   配送 → 仓库收货地址；快递 → 供应商收货地址
   *   待退货：展示地址；支持取消寄件 / 上传物流单号
   *   退货退款操作退回后 → 待收货；后台确认收货后触发退款
   *
   * 补货：
   *   不展示收货地址；审核通过后向采购端下发补货指令生成订货单
   *   采购回传物流后展示并可跟踪
   */
  function isProxyExpressToStore(detail) {
    return detail && detail.orderSource === '代采' && isExpressFulfillment(detail.deliveryMode);
  }

  function isProxyOrder(detail) {
    return detail && detail.orderSource === '代采';
  }

  function isPostAudit(status) {
    return status !== '待审批' && status !== '已拒绝' && status !== '已取消';
  }

  function makePurchaseOrder(detail) {
    var goods = (detail && detail.goods && detail.goods[0]) || {};
    return {
      id: 'PO-RS-' + String((detail && detail.id) || Date.now()).slice(-12),
      createdAt: nowText(),
      status: '已下发采购',
      productName: goods.name || '-',
      qty: goods.restockQty || goods.refundQty || 0,
      remark: '售后补货指令：请采购端生成订货单，并回传物流信息'
    };
  }

  function seedLogisticsByStatus(detail) {
    var type = detail.type;
    var status = detail.status;
    detail.shipments = detail.shipments || { returnShip: null, restockShip: null, exchangeOutShip: null };

    if (type === '补货') {
      detail.returnAddress = null;
      if (isPostAudit(status) && !detail.purchaseOrder) {
        detail.purchaseOrder = makePurchaseOrder(detail);
      }
      if (status === '已完成' && !detail.shipments.restockShip) {
        detail.shipments.restockShip = makeShip('申通快递', 'STO' + String(detail.id).slice(-11), '运输中');
      }
    } else if ((type === '退货退款' || type === '换货') && isPostAudit(status)) {
      detail.returnAddress = resolveReturnAddress(detail, detail.returnAddress);
    }

    // 退货退款已有寄回物流但状态仍为待退货时，对齐为待收货
    if (
      type === '退货退款' &&
      status === '待退货' &&
      detail.shipments &&
      detail.shipments.returnShip &&
      detail.shipments.returnShip.trackingNo
    ) {
      detail.status = '待收货';
      status = '待收货';
    }

    if (!isProxyOrder(detail)) return detail;

    if (type === '退货退款') {
      if (status === '退款中' || status === '待收货' || status === '已完成') {
        if (!detail.shipments.returnShip) {
          detail.shipments.returnShip = makeShip('顺丰速运', 'SF' + String(detail.id).slice(-12), '运输中');
        }
      }
    }

    if (type === '换货') {
      if (status === '待收货' || status === '退款中' || status === '已完成') {
        if (!detail.shipments.returnShip) {
          detail.shipments.returnShip = makeShip('中通快递', 'ZT' + String(detail.id).slice(-12), '已签收');
        }
      }
      if (status === '已完成') {
        if (!detail.shipments.exchangeOutShip) {
          detail.shipments.exchangeOutShip = makeShip('圆通速递', 'YT' + String(detail.id).slice(-12), '运输中');
        }
      }
    }

    // 按生成时机补齐演示用退款单：仅退款看审核后状态；退货退款看确认收货后状态
    if (!detail.refundTicket) {
      if (type === '仅退款' && (status === '已完成' || status === '退款中' || status === '退款异常')) {
        detail.refundTicket = {
          id: 'RF-' + String(detail.id).slice(-12),
          createdAt: detail.approval && detail.approval.time !== '-' ? detail.approval.time : nowText(),
          trigger: 'approve',
          status:
            status === '已完成' ? '退款成功' : status === '退款异常' ? '退款失败' : '待退款'
        };
      } else if (
        type === '退货退款' &&
        (status === '已完成' || status === '退款中' || status === '退款异常')
      ) {
        detail.refundTicket = {
          id: 'RF-' + String(detail.id).slice(-12),
          createdAt: nowText(),
          trigger: 'receive',
          status:
            status === '已完成' ? '退款成功' : status === '退款异常' ? '退款失败' : '待退款'
        };
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
    var orderSource = queryParam('orderSource') || '代采';
    var deliveryMode = normalizeFulfillmentMode(queryParam('delivery') || '快递');
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
      operationLogs: [],
      shipments: {
        returnShip: null,
        restockShip: null,
        exchangeOutShip: null
      },
      progress: buildProgress(type, status, id, applyTime, applicant)
    };

    return seedLogisticsByStatus(seedUserOpsByStatus(detail));
  }

  function pushOperationLog(detail, entry) {
    if (!detail) return;
    detail.operationLogs = detail.operationLogs || [];
    detail.operationLogs.unshift({
      type: entry.type,
      reason: entry.reason,
      time: entry.time || nowText(),
      source: entry.source || '用户端',
      operator: entry.operator || ''
    });
  }

  function seedUserOpsByStatus(detail) {
    var type = detail.type;
    var status = detail.status;
    var closeReason = queryParam('closeReason') || '';
    var canceledShip = queryParam('canceledShip') === '1' || closeReason === 'cancel_pickup';

    detail.userOps = detail.userOps || { cancelPickup: null, closeReturn: null };
    detail.operationLogs = detail.operationLogs || [];

    if ((type === '退货退款' || type === '换货') && status === '待退货') {
      // 审核通过后默认视为用户端已发起寄件，需先取消寄件才能上传物流
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
          pushOperationLog(detail, {
            type: '取消寄件',
            reason: detail.userOps.cancelPickup.reason,
            time: detail.userOps.cancelPickup.time,
            source: '用户端',
            operator: detail.userOps.cancelPickup.operator
          });
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
        pushOperationLog(detail, {
          type: '关闭退款',
          reason: detail.userOps.closeReturn.reason,
          time: detail.userOps.closeReturn.time,
          source: '用户端',
          operator: detail.userOps.closeReturn.operator
        });
      }
      if (status !== '已取消' && status !== '已拒绝' && closeReason === 'close_return') {
        detail.status = '已取消';
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

  function renderUserOpsPanel(detail) {
    var logs = detail.operationLogs || [];
    var ops = detail.userOps || {};
    if (!logs.length) {
      if (ops.cancelPickup) {
        logs = logs.concat([
          {
            type: '取消寄件',
            reason: ops.cancelPickup.reason,
            time: ops.cancelPickup.time,
            source: ops.cancelPickup.source,
            operator: ops.cancelPickup.operator
          }
        ]);
      }
      if (ops.closeReturn) {
        logs = logs.concat([
          {
            type: '关闭退款',
            reason: ops.closeReturn.reason,
            time: ops.closeReturn.time,
            source: ops.closeReturn.source,
            operator: ops.closeReturn.operator
          }
        ]);
      }
    }
    if (!logs.length) return '';

    var cards = logs
      .map(function (log) {
        return (
          '<div class="aftersale-user-ops__card">' +
          '<div class="aftersale-user-ops__row"><span class="aftersale-user-ops__label">操作类型</span><span class="aftersale-user-ops__value">' +
          escapeHtml(log.type) +
          '</span></div>' +
          '<div class="aftersale-user-ops__row"><span class="aftersale-user-ops__label">操作理由</span><span class="aftersale-user-ops__value">' +
          escapeHtml(log.reason || '-') +
          '</span></div>' +
          '<div class="aftersale-user-ops__row"><span class="aftersale-user-ops__label">操作来源</span><span class="aftersale-user-ops__value">' +
          escapeHtml(log.source || '-') +
          '</span></div>' +
          '<div class="aftersale-user-ops__row"><span class="aftersale-user-ops__label">操作人</span><span class="aftersale-user-ops__value">' +
          escapeHtml(log.operator || '-') +
          '</span></div>' +
          '<div class="aftersale-user-ops__row"><span class="aftersale-user-ops__label">操作时间</span><span class="aftersale-user-ops__value">' +
          escapeHtml(log.time || '-') +
          '</span></div></div>'
        );
      })
      .join('');

    return (
      '<section class="aftersale-detail-card">' +
      '<h2 class="aftersale-detail-card__title">操作理由</h2>' +
      '<div class="aftersale-user-ops">' +
      cards +
      '</div></section>'
    );
  }

  function field(label, value) {
    return (
      '<div class="aftersale-apply-field">' +
      '<span class="aftersale-apply-field__label">' +
      escapeHtml(label) +
      '</span>' +
      '<div class="aftersale-apply-field__value">' +
      escapeHtml(value) +
      '</div></div>'
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
      field('退款原因', a.refundReason || '/') +
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
    var qtyValue = isRestock ? g.restockQty || g.refundQty : g.refundQty;
    var qtyAria = isRestock ? '补货数量' : '退款数量';
    if (editable && state.editing.qtyIdx === idx) {
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
      (editable ? '' : ' disabled') +
      '>' +
      escapeHtml(qtyValue) +
      EDIT_SVG +
      '</button>'
    );
  }

  function renderGoods(detail, editable) {
    var isRestock = goodsTableType(detail) === '补货';
    var qtyLabel = isRestock ? '补货数量' : '退款数量';
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
      (isRestock ? '补货数量' : '退款数量') +
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
        '<div class="aftersale-addr-template__hint">配送订单审核通过后，用户寄回商品将使用仓库收货地址</div>' +
        '</div></div>'
      );
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
      (needsReturnAddrTemplate(state.approveType) ? renderAddrTemplateRow() : '') +
      '</div></section>'
    );
  }

  function renderApprovalInfo(detail) {
    var a = detail.approval;
    var resultCls =
      a.result === '已通过' ? 'aftersale-approve-row__ok' : a.result === '已拒绝' ? 'aftersale-approve-row__bad' : '';
    return (
      '<section class="aftersale-detail-card">' +
      '<h2 class="aftersale-detail-card__title">审批信息</h2>' +
      '<div class="aftersale-approve-grid"><div class="aftersale-approve-row">' +
      '<span>审批结果：<b class="' +
      resultCls +
      '">' +
      escapeHtml(a.result) +
      '</b></span>' +
      '<span>' +
      (createsRefundDoc(detail.type) ? '退款金额' : '申请金额') +
      '：<b>' +
      money(createsRefundDoc(detail.type) ? a.refundAmount : detail.applyAmount) +
      '</b></span>' +
      '<span>' +
      (createsRefundDoc(detail.type) ? '退款数量' : '申请数量') +
      '：<b>' +
      escapeHtml(a.refundQty) +
      '</b></span>' +
      (createsRefundDoc(detail.type)
        ? '<span>退还优惠券：<b>' +
          money(a.coupon) +
          '</b></span>' +
          '<span>退还积分：<b>' +
          escapeHtml(a.points) +
          '</b></span>'
        : '') +
      '<span>审批人：<b>' +
      escapeHtml(a.approver) +
      '</b></span></div>' +
      '<div class="aftersale-approve-row"><span>审批时间：<b>' +
      escapeHtml(a.time) +
      '</b></span><span>审核原因：<b>' +
      escapeHtml(a.remark) +
      '</b></span></div></div></section>'
    );
  }

  function renderReasons(detail, editable) {
    var html =
      '<section class="aftersale-detail-card"><h2 class="aftersale-detail-card__title">售后原因采集</h2>';
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
          '"' +
          (editable ? '' : ' disabled') +
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
    html += '</section>';
    return html;
  }

  function renderMerchantAddrCard(addr, title) {
    var head = title || '供应商收货地址';
    if (!addr) {
      return (
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">' +
        escapeHtml(head) +
        '</div>' +
        '<div class="aftersale-return-ship__wait">暂未选择供应商收货地址模板</div></div>'
      );
    }
    return (
      '<div class="aftersale-return-ship">' +
      '<div class="aftersale-return-ship__title">' +
      escapeHtml(head) +
      '</div>' +
      '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
      '<dt>收货人</dt><dd>' +
      escapeHtml(addr.receiverName) +
      '</dd>' +
      '<dt>联系电话</dt><dd>' +
      escapeHtml(addr.receiverPhone) +
      '</dd>' +
      '<dt>收货地址</dt><dd>' +
      escapeHtml(addr.region) +
      ' ' +
      escapeHtml(addr.detailAddress) +
      '</dd></dl></div></div>'
    );
  }

  function renderAwaitReturnPanel(detail) {
    var type = detail.type;
    var status = detail.status;
    // 换货确认收货后的待收货由换货寄出面板承接
    if (type !== '退货退款' && type !== '换货') return '';
    if (status === '待收货' && type === '换货') return '';
    if (status !== '待退货' && !(status === '待收货' && type === '退货退款')) {
      return '';
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
        '<div class="aftersale-return-ship__wait">退回已登记（快递退回供应商 / 退回仓库或门店），等待后台确认收货后触发退款</div>' +
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
    return (
      '<div class="aftersale-return-ship">' +
      '<div class="aftersale-return-ship__title">采购补货指令</div>' +
      '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
      '<dt>指令单号</dt><dd>' +
      escapeHtml(po.id) +
      '</dd>' +
      '<dt>下发时间</dt><dd>' +
      escapeHtml(po.createdAt || '-') +
      '</dd>' +
      '<dt>状态</dt><dd>' +
      escapeHtml(po.status || '-') +
      '</dd>' +
      '<dt>商品</dt><dd>' +
      escapeHtml(po.productName || '-') +
      '</dd>' +
      '<dt>补货数量</dt><dd>' +
      escapeHtml(po.qty) +
      '</dd>' +
      '<dt>说明</dt><dd>' +
      escapeHtml(po.remark || '-') +
      '</dd></dl></div></div>'
    );
  }

  function renderRestockPurchasePanel(detail) {
    if (detail.type !== '补货') return '';
    var status = detail.status;
    // 补货无退款单：审核通过后为待收货（采购补货中），完成后为已完成
    if (status !== '待收货' && status !== '已完成') {
      return '';
    }

    var ships = detail.shipments || {};
    var ship = ships.restockShip;
    var hasShip = !!(ship && ship.trackingNo);
    var done = status === '已完成';
    var po = detail.purchaseOrder || makePurchaseOrder(detail);
    detail.purchaseOrder = po;

    var title = done ? '补货处理 · 已完成' : '补货处理 · 采购补货中';
    var desc = done
      ? '采购端已回传物流，补货流程完成。'
      : '审核已通过，系统已向采购端下发补货指令并生成订货单；补货无需寄回，等待采购回传物流信息。';

    var shipHtml;
    if (hasShip || done) {
      shipHtml = renderShipInfoCard(ship, '补货物流（采购回传）', 'restockShip');
    } else {
      shipHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">补货物流（采购回传）</div>' +
        '<div class="aftersale-return-ship__wait">等待采购端回传物流信息</div>' +
        '<div class="aftersale-logistics-block__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asMockPurchaseShip">模拟采购回传物流</button>' +
        '</div></div>';
    }

    var actions = '';
    if (hasShip && !done) {
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asRestockComplete">确认补货完成</button>' +
        '</div>';
    }

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">' +
      escapeHtml(title) +
      '</h2>' +
      '<p class="aftersale-flow-card__desc">' +
      escapeHtml(desc) +
      '</p>' +
      renderPurchaseOrderCard(po) +
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
      return (
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">' +
        escapeHtml(title) +
        '</div>' +
        '<div class="aftersale-return-ship__wait">暂无物流信息</div></div>'
      );
    }
    return (
      '<div class="aftersale-return-ship">' +
      '<div class="aftersale-return-ship__title">' +
      escapeHtml(title) +
      '</div>' +
      '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
      '<dt>物流单号</dt><dd class="aftersale-logistics-no">' +
      escapeHtml(ship.trackingNo) +
      '</dd>' +
      '<dt>物流公司</dt><dd>' +
      escapeHtml(ship.company) +
      '</dd>' +
      '<dt>物流状态</dt><dd class="aftersale-return-ship__status"><span>' +
      escapeHtml(ship.status || '-') +
      '</span>' +
      '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="' +
      escapeHtml(shipKey || '') +
      '">跟踪信息</button></dd>' +
      (ship.uploadedAt ? '<dt>上传时间</dt><dd>' + escapeHtml(ship.uploadedAt) + '</dd>' : '') +
      '</dl></div></div>'
    );
  }

  function renderExchangeOutPanel(detail) {
    if (detail.type !== '换货') return '';
    var status = detail.status;
    if (status !== '待收货' && status !== '退款中' && status !== '已完成') {
      return '';
    }

    var ships = detail.shipments || {};
    var returnShip = ships.returnShip;
    var outShip = ships.exchangeOutShip;
    var hasOut = !!(outShip && outShip.trackingNo);
    var done = status === '已完成';

    var title = done ? '换货处理 · 已完成' : '换货处理 · 待供应商寄出';
    var desc = done
      ? '换货流程已完成，以下为全程地址与物流信息。'
      : '门店退货已签收，下一节点由供应商寄出换货商品至门店。';

    var returnHtml = returnShip
      ? renderShipInfoCard(returnShip, done ? '门店寄回物流' : '门店寄回物流（已签收）', 'returnShip')
      : '';

    var outHtml;
    if (done || hasOut) {
      outHtml = renderShipInfoCard(
        outShip,
        '供应商寄出物流（换出）',
        'exchangeOutShip'
      );
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
    if (!isProxyOrder(detail) || !isPostAudit(detail.status)) return '';

    var type = detail.type;
    var status = detail.status;
    // 退货/换货待退货、退货退款待收货、补货采购面板由专用区域承载，避免重复
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

    var ships = detail.shipments || {};
    var parts = [];

    parts.push(
      '<div class="aftersale-logistics-meta">订单来源：代采　履约方式：' +
        escapeHtml(detail.deliveryMode || '-') +
        '</div>'
    );

    if (type === '退货退款') {
      parts.push(renderAddrBlock(detail.returnAddress, returnAddrTitle(detail)));
      parts.push(
        renderShipBlock(ships.returnShip, '寄回物流', '暂无寄回物流', '', 'returnShip')
      );
    } else if (type === '换货') {
      parts.push(renderAddrBlock(detail.returnAddress, returnAddrTitle(detail)));
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
    var pending = isPending(detail.status);
    var editable = pending;
    var main =
      '<div class="aftersale-detail-main">' +
      renderStatusBanner(detail) +
      renderApply(detail) +
      renderGoods(detail, editable) +
      (pending ? renderApproveOps(detail) : renderApprovalInfo(detail)) +
      renderFlowPanel(detail) +
      renderUserOpsPanel(detail) +
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
      detail.refundTicket = makeRefundTicket('approve');
      detail.refundTicket.status = '待退款';
    } else if (type === '退货退款') {
      detail.returnAddress = resolveReturnAddress(detail, addr);
      detail.status = '待退货';
      detail.approval.refundAmount = detail.applyAmount;
      detail.refundTicket = null;
      detail.userPickupActive = true;
      detail.shipCanceled = false;
      detail.showShipUploadForm = false;
    } else if (type === '补货') {
      // 补货：不下发收货地址；向采购端下发补货指令
      detail.returnAddress = null;
      detail.purchaseOrder = makePurchaseOrder(detail);
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
      detail.userPickupActive = true;
      detail.shipCanceled = false;
      detail.showShipUploadForm = false;
    }
    detail.progress = buildProgress(type, detail.status, detail.id, detail.applyTime, detail.order.receiver);
    seedLogisticsByStatus(detail);
    renderPage();
    if (typeof showToast === 'function') {
      if (type === '仅退款') {
        showToast('审批通过，已生成退款单（待退款）', 'success');
      } else if (type === '退货退款') {
        showToast('审批通过，售后单待退货；买家退回后确认收货再生成退款单', 'success');
      } else if (type === '补货') {
        showToast('审批通过，已向采购端下发补货指令（无退款单）', 'success');
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
    pushOperationLog(detail, {
      type: '取消寄件',
      reason: reason,
      time: detail.userOps.cancelPickup.time,
      source: '售后管理',
      operator: '超级管理员'
    });
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
      if (!no) {
        if (typeof showToast === 'function') showToast('请填写重新寄回的物流单号', 'error');
        return;
      }
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
        var shipNo = String((($('asShipNo') || {}).value || '')).trim();
        if (!shipNo) {
          if (typeof showToast === 'function') showToast('请输入物流单号', 'error');
          return;
        }
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
      if (e.target.closest('#asMockPurchaseShip')) {
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.restockShip = makeShip(
          '申通快递',
          'STO' + String(Date.now()).slice(-11),
          '运输中'
        );
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
        state.detail.status = '已完成';
        if (state.detail.purchaseOrder) {
          state.detail.purchaseOrder.status = '补货完成';
        }
        state.detail.progress = buildProgress(
          '补货',
          '已完成',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        seedLogisticsByStatus(state.detail);
        renderPage();
        if (typeof showToast === 'function') showToast('补货流程已完成', 'success');
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
        var n2 = String((($('asShipNo') || {}).value || '')).trim();
        if (!n2) {
          if (typeof showToast === 'function') showToast('请输入物流单号', 'error');
          return;
        }
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
        // 退货退款：商家确认收货后生成退款单 → 售后单退款中 / 退款单待退款
        state.detail.refundTicket = makeRefundTicket('receive');
        state.detail.refundTicket.status = '待退款';
        state.detail.status = '退款中';
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
