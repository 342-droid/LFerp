/**
 * 售后原因枚举（与用户 APP / 门店进货售后理由一致）
 * 来源：user-app/js/user-app-order-refund.js → REASONS
 */
(function (global) {
  var REASONS = {
    pre_ship: [
      '订单信息拍错（规格/颜色等）',
      '我不想要了',
      '地址/电话信息填写错误',
      '没用/少用优惠',
      '缺货'
    ],
    not_received: ['不喜欢/不想要', '空包裹', '未按约定时间发货'],
    received: [
      '商品信息描述不符',
      '退运费',
      '质量问题',
      '少件/漏发/少配件',
      '包装/商品破损/污渍',
      '未按约定时间发货',
      '发票问题',
      '卖家发错货'
    ],
    return_refund: [
      '七天无理由退换货',
      '大小/尺寸/重量与商品描述不符',
      '颜色/图案/款式与商品描述不符',
      '少件/漏发/少配件',
      '包装/商品破损/污渍',
      '不喜欢/不想要',
      '质量问题',
      '做工粗糙/有瑕疵',
      '卖家发错货',
      '发票问题',
      '假冒品牌'
    ],
    restock: [
      '收到商品破损/污渍等',
      '包裹少件/漏发',
      '卖家发错货',
      '物流一直未送到',
      '协商一致'
    ],
    exchange: [
      '规格/颜色拍错',
      '大小/尺寸/重量与商品描述不符',
      '质量问题',
      '卖家发错货',
      '商品信息描述不符'
    ]
  };

  function uniqueConcat(lists) {
    var seen = {};
    var out = [];
    (lists || []).forEach(function (list) {
      (list || []).forEach(function (item) {
        if (!item || seen[item]) return;
        seen[item] = true;
        out.push(item);
      });
    });
    return out;
  }

  /** 后台售后类型 → 用户 APP 原因清单 */
  function getReasonsByType(type) {
    if (type === '退货退款') return REASONS.return_refund.slice();
    if (type === '补货') return REASONS.restock.slice();
    if (type === '换货') return REASONS.exchange.slice();
    if (type === '仅退款') {
      return uniqueConcat([REASONS.pre_ship, REASONS.not_received, REASONS.received]);
    }
    return uniqueConcat([
      REASONS.pre_ship,
      REASONS.not_received,
      REASONS.received,
      REASONS.return_refund,
      REASONS.restock,
      REASONS.exchange
    ]);
  }

  /**
   * 按类型 / 货物状态 / 是否发货前，取与用户 APP 一致的原因列表
   */
  function getReasonList(type, goodsStatus, orderStatus) {
    if (type === '退货退款') return REASONS.return_refund.slice();
    if (type === '补货') return REASONS.restock.slice();
    if (type === '换货') return REASONS.exchange.slice();
    if (type === '仅退款') {
      var preShip =
        orderStatus === '待发货' ||
        orderStatus === '待付款' ||
        orderStatus === 'pre_ship';
      if (preShip) return REASONS.pre_ship.slice();
      if (goodsStatus === '未收到货') return REASONS.not_received.slice();
      if (goodsStatus === '已收到货') return REASONS.received.slice();
      return getReasonsByType('仅退款');
    }
    return getReasonsByType('');
  }

  /** 列表/详情展示字段名（与用户 APP 一致） */
  function getReasonFieldLabel(type) {
    if (type === '补货') return '补货原因';
    if (type === '换货') return '换货原因';
    return '退款原因';
  }

  /** 演示种子：按类型轮询对应清单 */
  function pickDemoReason(type, index, opts) {
    opts = opts || {};
    var i = Math.max(0, Number(index) || 0);
    var list;
    if (type === '仅退款') {
      var bucket = i % 3;
      if (bucket === 0) list = REASONS.pre_ship;
      else if (bucket === 1) list = REASONS.not_received;
      else list = REASONS.received;
    } else {
      list = getReasonList(type, opts.goodsStatus, opts.orderStatus);
    }
    if (!list || !list.length) return '';
    return list[i % list.length];
  }

  function fillReasonSelect(selectEl, type, selected) {
    if (!selectEl) return;
    var prev = selected != null ? String(selected) : String(selectEl.value || '');
    var reasons = getReasonsByType(type || '');
    var html = '<option value="">全部</option>';
    reasons.forEach(function (reason) {
      html +=
        '<option value="' +
        String(reason).replace(/"/g, '&quot;') +
        '"' +
        (prev === reason ? ' selected' : '') +
        '>' +
        reason +
        '</option>';
    });
    selectEl.innerHTML = html;
    if (prev && reasons.indexOf(prev) >= 0) selectEl.value = prev;
    else selectEl.value = '';
  }

  global.MdmAftersaleReasons = {
    REASONS: REASONS,
    getReasonsByType: getReasonsByType,
    getReasonList: getReasonList,
    getReasonFieldLabel: getReasonFieldLabel,
    pickDemoReason: pickDemoReason,
    fillReasonSelect: fillReasonSelect
  };
})(typeof window !== 'undefined' ? window : this);
