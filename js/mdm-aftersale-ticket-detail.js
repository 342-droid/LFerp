/**
 * 售后详情 — 按状态/类型分支
 * 对齐用户端我要进货：仅退款 / 退货退款 / 补货 / 换货
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
  var SUPPLIER_RECEIVE_ADDR_KEY = 'mdm_supplier_receive_addr_v1';
  var DEMO_SUPPLIER_ID = 'SUP-DEMO-001';

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
    addrList: []
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
    var steps = [];
    if (type === '补货') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了补货申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
        { key: 'ship', title: '补货寄出', desc: '平台安排补货发货' },
        { key: 'done', title: '补货完成', desc: '补货流程完成' }
      ];
    } else if (type === '换货') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了换货申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
        { key: 'return', title: '寄回商品', desc: '用户寄回原商品' },
        { key: 'ship', title: '换货寄出', desc: '平台发出换货商品' },
        { key: 'done', title: '换货完成', desc: '换货流程完成' }
      ];
    } else if (type === '退货退款') {
      steps = [
        { key: 'submit', title: '用户提交申请', desc: '用户发起了退货退款申请' },
        { key: 'audit', title: '等待管理员审核', desc: '当前节点', current: true },
        { key: 'return', title: '寄回商品', desc: '用户寄回商品至供应商地址' },
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
      return [
        {
          title: steps[0].title,
          time: applyTime,
          desc: steps[0].desc,
          operator: applicant,
          done: true
        },
        {
          title: status === '已拒绝' ? '审批拒绝' : '已取消',
          time: nowText(),
          desc: status === '已拒绝' ? '管理员已拒绝该申请' : '售后单已取消',
          operator: '超级管理员',
          done: true
        }
      ];
    }

    // 已通过后续流程
    var mark = {};
    if (status === '待退货') {
      mark = { submit: 1, audit: 1, return: 'current' };
    } else if (status === '已收货' || status === '退款中') {
      mark = { submit: 1, audit: 1, return: 1, refund: 'current', ship: 'current' };
    } else if (status === '退款异常') {
      mark = { submit: 1, audit: 1, return: 1, refund: 1 };
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

  function defaultSupplierAddr() {
    ensureAddrState();
    return getSelectedAddr() || {
      id: 'addr-default',
      receiverName: '仓库收货人',
      receiverPhone: '13800138000',
      region: '浙江省杭州市萧山区',
      detailAddress: '宁围街道冷丰供应链仓 A区',
      isDefault: true
    };
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
   * 代采 + 快递到店：物流信息按售后类型 × 状态透出
   *
   * 补货：
   *   待审批：不展示
   *   审核后（退款中等）：展示供应商收货地址；补货物流单号待填写/已填
   *   已完成：地址 + 补货物流（可跟踪）
   *
   * 退货退款：
   *   待审批：审批区可选地址；通过后写入
   *   待退货：展示地址；寄回物流待门店上传
   *   退款中/已收货/已完成：地址 + 寄回物流（可跟踪）
   *
   * 换货：
   *   待审批：审批区可选地址
   *   待退货：展示地址；寄回物流待上传/已上传
   *   已收货/退款中：地址 + 寄回物流；换出物流待填/已填
   *   已完成：地址 + 寄回物流 + 换出物流（均可跟踪）
   */
  function isProxyExpressToStore(detail) {
    return detail && detail.orderSource === '代采' && detail.deliveryMode === '快递到店';
  }

  function isPostAudit(status) {
    return status !== '待审批' && status !== '已拒绝' && status !== '已取消';
  }

  function seedLogisticsByStatus(detail) {
    var type = detail.type;
    var status = detail.status;
    detail.shipments = detail.shipments || { returnShip: null, restockShip: null, exchangeOutShip: null };

    if (!isProxyExpressToStore(detail)) return detail;

    if ((type === '退货退款' || type === '换货' || type === '补货') && isPostAudit(status)) {
      if (!detail.returnAddress) detail.returnAddress = defaultSupplierAddr();
    }

    // 待退货：一律确保有商家收货地址卡片数据（含非代采演示）
    if ((type === '退货退款' || type === '换货') && status === '待退货') {
      if (!detail.returnAddress) detail.returnAddress = defaultSupplierAddr();
    }

    if (type === '退货退款') {
      if (status === '退款中' || status === '已收货' || status === '已完成') {
        if (!detail.shipments.returnShip) {
          detail.shipments.returnShip = makeShip('顺丰速运', 'SF' + String(detail.id).slice(-12), '运输中');
        }
      }
    }

    if (type === '换货') {
      if (status === '已收货' || status === '退款中' || status === '已完成') {
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

    if (type === '补货') {
      if (status === '已完成') {
        if (!detail.shipments.restockShip) {
          detail.shipments.restockShip = makeShip('申通快递', 'STO' + String(detail.id).slice(-11), '运输中');
        }
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

    // 代采快递到店场景演示（可用 query 覆盖：delivery=平台配送）
    var deliveryMode = queryParam('delivery') || '快递到店';
    var orderSource = queryParam('orderSource') || '代采';

    var detail = {
      id: id,
      status: status,
      type: type,
      applyTime: applyTime,
      applyAmount: amount,
      waitTime: '-',
      orderSource: orderSource,
      deliveryMode: deliveryMode,
      apply: {
        reasonL1: isDone ? '质量问题' : '其他',
        reasonL2: '-',
        ratio: '-',
        desc: isDone ? '1111111' : 'eee',
        proofCount: isDone ? 1 : 0
      },
      goods: [
        {
          name: productName,
          spec: productSpec,
          refundAmount: amount,
          refundQty: qty,
          applyAmount: amount,
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
        refundAmount: amount,
        refundQty: qty,
        coupon: 0,
        points: 0,
        growth: '-'
      },
      approval: {
        result: status === '已完成' ? '已通过' : status === '已拒绝' ? '已拒绝' : '-',
        refundAmount: amount,
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
        status: isDone ? '已关闭' : '已完成',
        source: orderSource,
        store: '德清乾元天恩冷丰店'
      },
      supplier: {
        id: DEMO_SUPPLIER_ID,
        name: isDone ? '-' : '冷丰示范供应商',
        buyer: '-'
      },
      returnAddress: null,
      shipments: {
        returnShip: null,
        restockShip: null,
        exchangeOutShip: null
      },
      progress: buildProgress(type, status, id, applyTime, applicant)
    };

    return seedLogisticsByStatus(detail);
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
      '<div class="aftersale-status-banner__item"><span>申请退款金额</span><b class="is-money">' +
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
      field('一级退款原因', a.reasonL1) +
      field('二级退款原因', a.reasonL2) +
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

  function renderGoods(detail, editable) {
    var rows = detail.goods
      .map(function (g) {
        // 设计稿已完成态仍展示橙色编辑态单元格
        var amtCell =
          '<button type="button" class="aftersale-goods-edit js-as-edit-amount"' +
          (editable ? '' : ' disabled') +
          '>' +
          money(g.refundAmount) +
          EDIT_SVG +
          '</button>';
        var qtyCell =
          '<button type="button" class="aftersale-goods-edit js-as-edit-qty"' +
          (editable ? '' : ' disabled') +
          '>' +
          escapeHtml(g.refundQty) +
          EDIT_SVG +
          '</button>';
        return (
          '<tr>' +
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
          money(g.applyAmount) +
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
      '<th>退款金额</th><th>退款数量</th><th>用户申请金额</th><th>购买数量</th>' +
      '<th>实付金额</th><th>优惠券分摊金额</th><th>积分分摊金额</th><th>SKU编码</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      '<div class="aftersale-goods-summary">' +
      '<div class="aftersale-goods-summary__item">总计退款金额<strong class="is-money">' +
      money(s.refundAmount) +
      '</strong></div>' +
      '<div class="aftersale-goods-summary__item">总计退款数量<strong>' +
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
    return type === '退货退款' || type === '换货';
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
      '<div class="aftersale-addr-template__hint">审核通过后，门店端寄回商品将使用该地址</div>' +
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
      '<div class="aftersale-approve-ops__row aftersale-approve-ops__row--top">' +
      '<span class="aftersale-approve-ops__label">审批备注</span>' +
      '<div class="aftersale-approve-ops__field">' +
      '<textarea class="aftersale-approve-textarea" id="asApproveRemark" maxlength="200" placeholder="请输入审批备注">' +
      escapeHtml(state.remark) +
      '</textarea>' +
      '<div class="aftersale-approve-counter"><span id="asRemarkCount">' +
      String(state.remark.length) +
      '</span>/200</div>' +
      '</div></div>' +
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
      '<span>退款金额：<b>' +
      money(a.refundAmount) +
      '</b></span>' +
      '<span>退款数量：<b>' +
      escapeHtml(a.refundQty) +
      '</b></span>' +
      '<span>退还优惠券：<b>' +
      money(a.coupon) +
      '</b></span>' +
      '<span>退还积分：<b>' +
      escapeHtml(a.points) +
      '</b></span>' +
      '<span>审批人：<b>' +
      escapeHtml(a.approver) +
      '</b></span></div>' +
      '<div class="aftersale-approve-row"><span>审批时间：<b>' +
      escapeHtml(a.time) +
      '</b></span><span>审批备注：<b>' +
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
        '<div class="aftersale-recv-card">' +
        '<div class="aftersale-recv-card__head">' +
        escapeHtml(head) +
        '</div>' +
        '<div class="aftersale-logistics-block__empty">暂未选择供应商收货地址模板</div></div>'
      );
    }
    return (
      '<div class="aftersale-recv-card">' +
      '<div class="aftersale-recv-card__head">' +
      escapeHtml(head) +
      '</div>' +
      '<div class="aftersale-recv-card__tip">审核通过时已选定的供应商收货地址模板，门店寄回商品使用该地址</div>' +
      '<div class="aftersale-recv-card__row"><span>收货人</span><b>' +
      escapeHtml(addr.receiverName) +
      '</b></div>' +
      '<div class="aftersale-recv-card__row"><span>联系电话</span><b>' +
      escapeHtml(addr.receiverPhone) +
      '</b></div>' +
      '<div class="aftersale-recv-card__row"><span>收货地址</span><b>' +
      escapeHtml(addr.region) +
      ' ' +
      escapeHtml(addr.detailAddress) +
      '</b></div></div>'
    );
  }

  function renderAwaitReturnPanel(detail) {
    var type = detail.type;
    var status = detail.status;
    if (status !== '待退货' || (type !== '退货退款' && type !== '换货')) return '';

    var ships = detail.shipments || {};
    var ship = ships.returnShip;
    var hasShip = !!(ship && ship.trackingNo);
    var title = type === '换货' ? '换货处理 · 待退货' : '退货退款 · 待退货';
    var addrTitle = '供应商收货地址';

    var shipHtml;
    if (!hasShip) {
      shipHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__wait">等待门店上传寄回物流信息</div>' +
        '<div class="aftersale-logistics-block__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--ghost" id="asMockReturnShip">模拟门店上传寄回单号</button>' +
        '</div></div>';
    } else {
      shipHtml =
        '<div class="aftersale-return-ship">' +
        '<div class="aftersale-return-ship__title">寄回物流信息</div>' +
        '<div class="aftersale-return-ship__card">' +
        '<dl class="aftersale-return-ship__kv">' +
        '<dt>物流公司</dt><dd>' +
        escapeHtml(ship.company) +
        '</dd>' +
        '<dt>物流单号</dt><dd class="aftersale-logistics-no">' +
        escapeHtml(ship.trackingNo) +
        '</dd>' +
        '<dt>物流状态</dt><dd class="aftersale-return-ship__status">' +
        '<span>' +
        escapeHtml(ship.status || '运输中') +
        '</span>' +
        '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="returnShip">跟踪信息</button>' +
        '</dd>' +
        (ship.uploadedAt ? '<dt>上传时间</dt><dd>' + escapeHtml(ship.uploadedAt) + '</dd>' : '') +
        '</dl></div></div>';
    }

    var actions = '';
    if (hasShip) {
      var confirmId = type === '换货' ? 'asExchangeReceived' : 'asReturnReceived';
      var confirmText = type === '换货' ? '确认收货' : '确认收货并退款';
      actions =
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="' +
        confirmId +
        '">' +
        confirmText +
        '</button></div>';
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

  function renderExchangeOutPanel(detail) {
    if (detail.type !== '换货' || (detail.status !== '已收货' && detail.status !== '退款中')) {
      return '';
    }
    var ships = detail.shipments || {};
    var returnShip = ships.returnShip;
    var outShip = ships.exchangeOutShip;
    var hasOut = !!(outShip && outShip.trackingNo);

    var returnSummary = returnShip
      ? '<div class="aftersale-return-ship">' +
        '<div class="aftersale-return-ship__title">门店寄回物流（已收货）</div>' +
        '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
        '<dt>物流公司</dt><dd>' +
        escapeHtml(returnShip.company) +
        '</dd>' +
        '<dt>物流单号</dt><dd class="aftersale-logistics-no">' +
        escapeHtml(returnShip.trackingNo) +
        '</dd>' +
        '<dt>物流状态</dt><dd class="aftersale-return-ship__status"><span>' +
        escapeHtml(returnShip.status || '已签收') +
        '</span>' +
        '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="returnShip">跟踪信息</button></dd>' +
        '</dl></div></div>'
      : '';

    var outHtml;
    if (!hasOut) {
      outHtml =
        '<div class="aftersale-return-ship aftersale-return-ship--waiting">' +
        '<div class="aftersale-return-ship__title">供应商寄出物流（换出）</div>' +
        '<div class="aftersale-return-ship__wait">已收到门店退货，请填写供应商寄出换货商品的物流信息</div>' +
        '<div class="aftersale-flow-form">' +
        '<label>物流公司<input class="aftersale-filter-field__input" id="asShipCompany" placeholder="请输入物流公司"></label>' +
        '<label>物流单号<input class="aftersale-filter-field__input" id="asShipNo" placeholder="请输入物流单号"></label>' +
        '</div>' +
        '<div class="aftersale-flow-card__actions" style="margin-top:12px">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asExchangeShip">确认换货寄出</button>' +
        '</div></div>';
    } else {
      outHtml =
        '<div class="aftersale-return-ship">' +
        '<div class="aftersale-return-ship__title">供应商寄出物流（换出）</div>' +
        '<div class="aftersale-return-ship__card"><dl class="aftersale-return-ship__kv">' +
        '<dt>物流公司</dt><dd>' +
        escapeHtml(outShip.company) +
        '</dd>' +
        '<dt>物流单号</dt><dd class="aftersale-logistics-no">' +
        escapeHtml(outShip.trackingNo) +
        '</dd>' +
        '<dt>物流状态</dt><dd class="aftersale-return-ship__status"><span>' +
        escapeHtml(outShip.status || '运输中') +
        '</span>' +
        '<button type="button" class="aftersale-track-link js-as-track" data-ship-key="exchangeOutShip">跟踪信息</button></dd>' +
        '</dl></div></div>';
    }

    return (
      '<section class="aftersale-detail-card aftersale-flow-card">' +
      '<h2 class="aftersale-detail-card__title">换货处理 · 待供应商寄出</h2>' +
      '<p class="aftersale-flow-card__desc">门店退货已签收，下一节点由供应商寄出换货商品至门店。</p>' +
      returnSummary +
      outHtml +
      '</section>'
    );
  }

  function renderFlowPanel(detail) {
    var type = detail.type;
    var status = detail.status;

    var awaitReturn = renderAwaitReturnPanel(detail);
    if (awaitReturn) return awaitReturn;

    var exchangeOut = renderExchangeOutPanel(detail);
    if (exchangeOut) return exchangeOut;

    if (type === '补货' && (status === '退款中' || status === '已收货')) {
      var restock = (detail.shipments && detail.shipments.restockShip) || {};
      return (
        '<section class="aftersale-detail-card aftersale-flow-card">' +
        '<h2 class="aftersale-detail-card__title">补货处理</h2>' +
        '<p class="aftersale-flow-card__desc">平台审核已通过，请填写补货物流信息并寄出。</p>' +
        '<div class="aftersale-flow-form">' +
        '<label>物流公司<input class="aftersale-filter-field__input" id="asShipCompany" placeholder="请输入物流公司" value="' +
        escapeHtml(restock.company || '') +
        '"></label>' +
        '<label>物流单号<input class="aftersale-filter-field__input" id="asShipNo" placeholder="请输入物流单号" value="' +
        escapeHtml(restock.trackingNo || '') +
        '"></label>' +
        '</div>' +
        '<div class="aftersale-flow-card__actions">' +
        '<button type="button" class="aftersale-btn aftersale-btn--primary" id="asRestockShip">确认补货寄出</button>' +
        '</div></section>'
      );
    }
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
      '<div class="aftersale-aside-kv"><span>配送方式</span><span>' +
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
      '<div class="aftersale-aside-kv"><span>物流公司</span><span>' +
      escapeHtml(ship.company) +
      '</span></div>' +
      '<div class="aftersale-aside-kv"><span>物流单号</span><span class="aftersale-logistics-no">' +
      escapeHtml(ship.trackingNo) +
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
    if (!isProxyExpressToStore(detail) || !isPostAudit(detail.status)) return '';

    var type = detail.type;
    var status = detail.status;
    // 待退货由专用面板承载地址 + 寄回物流，避免重复
    if (status === '待退货' && (type === '退货退款' || type === '换货')) return '';

    var ships = detail.shipments || {};
    var parts = [];

    parts.push('<div class="aftersale-logistics-meta">订单来源：代采　配送方式：快递到店</div>');

    if (type === '补货') {
      parts.push(renderAddrBlock(detail.returnAddress, '供应商收货地址'));
      parts.push(
        renderShipBlock(
          ships.restockShip,
          '补货物流',
          status === '已完成' ? '暂无补货物流' : '待平台填写补货物流单号',
          '',
          'restockShip'
        )
      );
    } else if (type === '退货退款') {
      parts.push(renderAddrBlock(detail.returnAddress, '供应商收货地址'));
      parts.push(
        renderShipBlock(ships.returnShip, '寄回物流', '暂无寄回物流', '', 'returnShip')
      );
    } else if (type === '换货') {
      parts.push(renderAddrBlock(detail.returnAddress, '供应商收货地址'));
      parts.push(
        renderShipBlock(ships.returnShip, '寄回物流（门店→供应商）', '暂无寄回物流', '', 'returnShip')
      );
      if (status === '已收货' || status === '退款中' || status === '已完成') {
        // 待供应商寄出由专用面板承载，物流总览在已完成后保留两侧物流
        if (status === '已完成') {
          parts.push(
            renderShipBlock(
              ships.exchangeOutShip,
              '换出物流（供应商→门店）',
              '暂无换出物流',
              '',
              'exchangeOutShip'
            )
          );
        }
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
    var pending = isPending(detail.status);
    var editable = pending;
    var main =
      '<div class="aftersale-detail-main">' +
      renderStatusBanner(detail) +
      renderApply(detail) +
      renderGoods(detail, editable) +
      (pending ? renderApproveOps(detail) : renderApprovalInfo(detail)) +
      renderFlowPanel(detail) +
      renderLogisticsSection(detail) +
      renderReasons(detail, pending) +
      '</div>';
    body.innerHTML = main + renderAside(detail);
    renderFooter(detail);
    var page = $('asDetailPage');
    if (page) page.classList.toggle('has-footer', pending);
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
    if (addr) detail.returnAddress = addr;
    else if (type === '补货' && isProxyExpressToStore(detail)) {
      detail.returnAddress = defaultSupplierAddr();
    }

    detail.shipments = detail.shipments || {
      returnShip: null,
      restockShip: null,
      exchangeOutShip: null
    };

    if (type === '仅退款') {
      detail.status = '已完成';
    } else if (type === '退货退款') {
      detail.status = '待退货';
    } else if (type === '补货') {
      detail.status = '退款中';
    } else if (type === '换货') {
      detail.status = '待退货';
    }
    detail.progress = buildProgress(type, detail.status, detail.id, detail.applyTime, detail.order.receiver);
    seedLogisticsByStatus(detail);
    renderPage();
    if (typeof showToast === 'function') {
      showToast('审批通过（' + typeActionLabel(type) + '）', 'success');
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
      var editAmt = e.target.closest('.js-as-edit-amount');
      if (editAmt) {
        if (typeof showToast === 'function') showToast('修改退款金额（演示）', 'success');
        return;
      }
      var editQty = e.target.closest('.js-as-edit-qty');
      if (editQty) {
        if (typeof showToast === 'function') showToast('修改退款数量（演示）', 'success');
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
      if (e.target.closest('#asRestockShip')) {
        var company = ($('asShipCompany') || {}).value || '';
        var no = ($('asShipNo') || {}).value || '';
        if (!company || !no) {
          if (typeof showToast === 'function') showToast('请填写物流公司与单号', 'error');
          return;
        }
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.restockShip = makeShip(company, no, '运输中');
        state.detail.status = '已完成';
        state.detail.progress = buildProgress(
          state.detail.type,
          '已完成',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        seedLogisticsByStatus(state.detail);
        renderPage();
        if (typeof showToast === 'function') showToast('补货已寄出，流程完成', 'success');
        return;
      }
      if (e.target.closest('#asMockReturnShip')) {
        state.detail.shipments = state.detail.shipments || {};
        state.detail.shipments.returnShip = makeShip(
          '顺丰速运',
          'SF' + String(Date.now()).slice(-12),
          '运输中'
        );
        // 仍停在待退货：先出现单号/跟踪，再显示确认收货
        state.detail.status = '待退货';
        if (!state.detail.returnAddress) {
          state.detail.returnAddress = defaultSupplierAddr();
        }
        state.detail.progress = buildProgress(
          state.detail.type,
          '待退货',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') showToast('门店已上传寄回物流，可跟踪并确认收货', 'success');
        return;
      }
      var trackBtn = e.target.closest('.js-as-track');
      if (trackBtn) {
        var key = trackBtn.getAttribute('data-ship-key');
        var ship = (state.detail.shipments || {})[key];
        openAsTrackDrawer(ship);
        return;
      }
      if (e.target.closest('#asExchangeReceived')) {
        state.detail.status = '已收货';
        if (!state.detail.shipments.returnShip) {
          state.detail.shipments.returnShip = makeShip(
            '中通快递',
            'ZT' + String(Date.now()).slice(-12),
            '已签收'
          );
        }
        state.detail.progress = buildProgress(
          '换货',
          '已收货',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        renderPage();
        if (typeof showToast === 'function') showToast('已确认收货，可换货寄出', 'success');
        return;
      }
      if (e.target.closest('#asExchangeShip')) {
        var c2 = ($('asShipCompany') || {}).value || '';
        var n2 = ($('asShipNo') || {}).value || '';
        if (!c2 || !n2) {
          if (typeof showToast === 'function') showToast('请填写物流公司与单号', 'error');
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
        state.detail.status = '已完成';
        if (!state.detail.shipments.returnShip) {
          state.detail.shipments.returnShip = makeShip(
            '顺丰速运',
            'SF' + String(Date.now()).slice(-12),
            '已签收'
          );
        }
        state.detail.progress = buildProgress(
          '退货退款',
          '已完成',
          state.detail.id,
          state.detail.applyTime,
          state.detail.order.receiver
        );
        seedLogisticsByStatus(state.detail);
        renderPage();
        if (typeof showToast === 'function') showToast('已收货并退款成功', 'success');
      }
    }

    if (body) body.addEventListener('click', onRootClick);
    if (body) {
      body.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'asApproveType') {
          state.approveType = e.target.value;
          if (needsReturnAddrTemplate(state.approveType)) ensureAddrState();
          renderPage();
          return;
        }
        if (e.target && e.target.id === 'asReturnAddrSelect') {
          state.selectedAddrId = e.target.value || '';
          renderPage();
        }
      });
      body.addEventListener('input', function (e) {
        if (e.target && e.target.id === 'asApproveRemark') {
          state.remark = e.target.value || '';
          var count = $('asRemarkCount');
          if (count) count.textContent = String(state.remark.length);
        }
      });
    }

    if (footer) {
      footer.addEventListener('click', function (e) {
        if (e.target.closest('#asReject')) {
          state.detail.status = '已拒绝';
          state.detail.approval.result = '已拒绝';
          state.detail.approval.approver = '超级管理员';
          state.detail.approval.time = nowText();
          state.detail.approval.remark = state.remark || '-';
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
        if (e.target.closest('#asApprove')) {
          if (needsReturnAddrTemplate(state.approveType)) {
            ensureAddrState();
            var addr = getSelectedAddr();
            if (!addr) {
              if (typeof showToast === 'function') showToast('请选择供应商收货地址模板', 'error');
              return;
            }
            applyApprovePass(addr);
            return;
          }
          applyApprovePass(null);
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
