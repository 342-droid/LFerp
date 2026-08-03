(function () {
  var MARKETING_TYPES = ['普通售卖', '拉新赠品', '福袋奖品', '积分兑换'];

  function readMarketingFromRow(row) {
    if (!row) return '普通售卖';
    var el = row.querySelector('.order-tag--sale');
    return el ? el.textContent.trim() : '普通售卖';
  }

  function marketingTagHtml(label) {
    return '<span class="order-tag order-tag--sale">' + (label || '普通售卖') + '</span>';
  }

  function isProxyOrderPage() {
    return document.body && document.body.getAttribute('data-order-page') === 'proxy';
  }

  function getListCellIndices(row) {
    var sceneEl = row ? row.querySelector('.order-scene') : null;
    var hasDeliveryCol = !!(row && (row.getAttribute('data-delivery-mode') || row.querySelector('.order-delivery-mode')));
    if (isProxyOrderPage()) {
      return { goods: 7, discount: 8, paid: 12, payChannel: 13 };
    }
    if (sceneEl) {
      // 有履约方式列时：…场景(14) 履约(15) 支付(16) 状态(17)
      return {
        goods: 8,
        discount: 9,
        paid: 13,
        payChannel: hasDeliveryCol ? 16 : 15
      };
    }
    return { goods: 8, discount: 9, paid: 13, payChannel: 14 };
  }

  function retailDeliveryLabel(typeOrLabel) {
    var v = String(typeOrLabel || '').trim();
    if (v === 'EXPRESS' || v === 'express' || v === '快递') return '快递';
    if (v === 'SELF_PICKUP' || v === 'pickup' || v === '自提') return '自提';
    if (v === 'PROXY') return '-';
    return v || '自提';
  }

  function readDeliveryModeFromRow(row) {
    if (!row) return '自提';
    var el = row.querySelector('.order-delivery-mode');
    if (el) return retailDeliveryLabel(el.textContent);
    var attr = row.getAttribute('data-delivery-mode');
    if (attr) return retailDeliveryLabel(attr);
    return '自提';
  }

  var DETAILS = {
    'ORD-3212689201598341': {
      displayId: 'ORD-321268920159834112',
      progress: {
        completedSteps: 1,
        outcome: 'failed',
        status: '已关闭',
        submitTime: '2026-06-05 20:47',
        finishTime: '2026-06-05 20:48'
      },
      goods: [{
        name: '小龙虾',
        spec: '大小：小龙虾',
        img: '../user-app/assets/order-product-1.svg',
        spu: 'SPU-3208…',
        sku: 'SKU-3208…',
        weight: '-',
        price: '¥1.20',
        qty: '1',
        subtotal: '¥1.20',
        marketing: '普通售卖',
        aftersaleTag: '全额退款'
      }],
      amounts: {
        goods: '¥1.20',
        discount: '-¥1.19',
        shipping: '¥0.00',
        payable: '¥0.01',
        paid: '¥0.01',
        merchant: '¥0.00',
        refund: '¥0.01'
      },
      paymentCount: 1,
      /* 售后明细：一条售后单一行；状态与售后单一致 */
      aftersales: [{
        id: 'AS-8341-1',
        productName: '小龙虾',
        type: '仅退款',
        status: '已完成',
        returnQty: 1,
        refundAmount: '¥0.01',
        refundCoupon: '¥0.00',
        refundPoints: 0,
        adjustAmount: '¥0.00'
      }],
      customer: { nickname: '宋雨琦', phone: '15236806537', userId: '318605592681791488' },
      delivery: {
        type: 'SELF_PICKUP',
        name: '宋雨琦',
        phone: '15236806537',
        address: '浙江省杭州市上城区望江街道望江路16号',
        store: '华强北'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: '直播',
        payChannel: '-',
        marketing: '普通售卖',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-05 20:47', title: '订单已创建', desc: '订单创建，金额 ¥0.01' },
        { time: '2026-06-05 20:48', title: '订单已关闭', desc: '订单已取消，交易失败' }
      ],
      clearingEmpty: true
    },
    'ORD-3212689201588561': {
      displayId: 'ORD-3212689201588561',
      progress: {
        completedSteps: 1,
        outcome: null,
        status: '已创建',
        submitTime: '2026-06-05 20:46'
      },
      goods: [{
        id: 'g1',
        name: '微辣萝卜干 500g 4号…',
        spec: '规格：500g',
        img: '../user-app/assets/order-product-2.svg',
        spu: 'SPU-2101…',
        sku: 'SKU-2101…',
        barcode: '6901001001001',
        weight: '0.50',
        price: '¥0.90',
        qty: '1',
        subtotal: '¥0.90',
        marketing: '拉新赠品'
      }],
      amounts: {
        goods: '¥0.90',
        discount: '¥0.00',
        shipping: '¥0.00',
        payable: '¥0.90',
        paid: '¥0.90',
        merchant: '¥0.90',
        refund: '¥0.00'
      },
      paymentCount: 1,
      customer: { nickname: '赵金芝', phone: '13800001987', userId: '318605592681791401' },
      delivery: {
        type: 'EXPRESS',
        name: '刘十九',
        phone: '13800001987',
        address: '浙江省杭州市西湖区文三路168号',
        homeAddress: '浙江省杭州市西湖区文三路168号1幢502室',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: '商城',
        payChannel: '-',
        marketing: '拉新赠品',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-05 20:46', title: '订单已创建', desc: '订单创建，金额 ¥0.90' }
      ],
      clearingEmpty: true
    },
    'ORD-3212689201599001': {
      displayId: 'ORD-3212689201599001',
      progress: {
        completedSteps: 2,
        outcome: null,
        status: '待收货',
        submitTime: '2026-06-04 14:20'
      },
      goods: [{
        id: 'g1',
        name: '冷丰优选3J智利车厘子 3斤装',
        spec: '规格：3斤',
        img: '../user-app/assets/order-detail-cherry.svg',
        spu: 'SPU-1001…',
        sku: 'SKU-1001…',
        barcode: '6901002002002',
        weight: '1.50',
        price: '¥128.18',
        qty: '2',
        subtotal: '¥256.36',
        marketing: '积分兑换',
        aftersaleTag: '部分退款'
      }],
      amounts: {
        goods: '¥256.36',
        discount: '-¥10.00',
        shipping: '¥0.00',
        payable: '¥246.36',
        paid: '¥246.36',
        merchant: '¥246.36',
        refund: '¥118.18'
      },
      paymentCount: 1,
      aftersales: [{
        id: 'AS-9001-1',
        productName: '冷丰优选3J智利车厘子 3斤装',
        type: '仅退款',
        status: '已完成',
        returnQty: 1,
        refundAmount: '¥118.18',
        refundCoupon: '¥0.00',
        refundPoints: 50,
        adjustAmount: '¥0.00'
      }],
      customer: { nickname: '宁静致远', phone: '155****9061', userId: '318605592681791501' },
      delivery: {
        type: 'EXPRESS',
        name: '宁静致远',
        phone: '155****9061',
        address: '浙江省杭州市上城区望江街道望江路16号',
        homeAddress: '浙江省杭州市上城区望江街道望江路16号2单元801',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: '直播',
        payChannel: '微信',
        marketing: '积分兑换',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-04 14:20', title: '订单已创建', desc: '订单创建，金额 ¥118.18' },
        { time: '2026-06-05 09:30', title: '商家已发货', desc: '快递已发出，配送至用户收货地址' }
      ],
      clearingEmpty: true
    },
    'ORD-3212689201599002': {
      displayId: 'ORD-3212689201599002',
      progress: {
        completedSteps: 3,
        outcome: null,
        status: '待提货',
        submitTime: '2026-06-04 11:35'
      },
      goods: [{
        id: 'g1',
        name: '赣南脐橙 果大皮薄 5斤装',
        spec: '规格：5斤',
        img: '../user-app/assets/order-product-2.svg',
        spu: 'SPU-1002…',
        sku: 'SKU-1002…',
        weight: '2.50',
        price: '¥18.06',
        qty: '3',
        pickedQty: 2,
        subtotal: '¥54.18',
        marketing: '普通售卖',
        aftersaleTag: '退款中'
      }],
      amounts: {
        goods: '¥54.18',
        discount: '¥0.00',
        shipping: '¥0.00',
        payable: '¥54.18',
        paid: '¥54.18',
        merchant: '¥54.18',
        refund: '¥0.00'
      },
      paymentCount: 1,
      /* 仅退款已通过审核（退款中）：自提单不可核销；补货待收货不拦截核销规则 */
      aftersales: [{
        id: 'AS-9002-2',
        productName: '赣南脐橙 果大皮薄 5斤装',
        type: '仅退款',
        status: '退款中',
        returnQty: 1,
        refundAmount: '¥18.06',
        refundCoupon: '¥0.00',
        refundPoints: 0,
        adjustAmount: '¥0.00'
      }, {
        id: 'AS-9002-1',
        productName: '赣南脐橙 果大皮薄 5斤装',
        type: '补货',
        status: '待收货',
        applyRestockQty: 1,
        actualRestockQty: '-'
      }],
      customer: { nickname: '宋雨琦', phone: '15236806537', userId: '318605592681791488' },
      delivery: {
        type: 'SELF_PICKUP',
        name: '宋雨琦',
        phone: '15236806537',
        address: '浙江省杭州市上城区望江街道望江路16号',
        store: '华强北'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: '直播',
        payChannel: '支付宝',
        marketing: '普通售卖',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-04 11:35', type: 'create', title: '订单已创建', desc: '订单创建，金额 ¥54.18' },
        { time: '2026-06-05 08:15', type: 'arrival', title: '商品已到提货点', desc: '请尽快前往门店提货' },
        {
          time: '2026-06-05 15:30',
          type: 'pickup',
          title: '商品提货',
          desc: '赣南脐橙 果大皮薄 5斤装 提货 2 件（累计已提 2/3）',
          pickup: {
            productName: '赣南脐橙 果大皮薄 5斤装',
            sku: 'SKU-1002…',
            spu: 'SPU-1002…',
            qty: 2,
            pickedQty: 2,
            totalQty: 3,
            operator: '门店核销员'
          }
        },
        {
          time: '2026-06-05 15:30',
          type: 'pickup_partial',
          title: '部分提货',
          desc: '订单尚有商品待提：赣南脐橙 果大皮薄 5斤装（剩 1 件）'
        }
      ],
      clearingEmpty: true
    },
    'ORD-3212689201599003': {
      displayId: 'ORD-3212689201599003',
      progress: {
        completedSteps: 2,
        outcome: null,
        status: '待收货',
        submitTime: '2026-06-03 16:48'
      },
      goods: [{
        id: 'g1',
        name: '新鲜红颜草莓 香甜多汁 500g装',
        spec: '规格：500g',
        img: '../user-app/assets/order-product-1.svg',
        spu: 'SPU-1003…',
        sku: 'SKU-1003…',
        barcode: '6901003001003',
        weight: '0.50',
        price: '¥19.59',
        qty: '2',
        pickedQty: 0,
        subtotal: '¥39.18',
        marketing: '拉新赠品',
        aftersaleTag: '退款中'
      }, {
        id: 'g2',
        name: '进口香蕉 香甜软糯 3斤装',
        spec: '规格：3斤',
        img: '../user-app/assets/order-detail-orange.svg',
        spu: 'SPU-1004…',
        sku: 'SKU-1004…',
        barcode: '6901003001004',
        weight: '1.50',
        price: '¥12.00',
        qty: '1',
        pickedQty: 0,
        subtotal: '¥12.00',
        marketing: '拉新赠品',
        aftersaleTag: '退款中'
      }],
      amounts: {
        goods: '¥51.18',
        discount: '-¥5.00',
        shipping: '¥0.00',
        payable: '¥46.18',
        paid: '¥46.18',
        merchant: '¥46.18',
        refund: '¥0.00'
      },
      paymentCount: 1,
      /* 含仅退款 / 退货退款 / 补货，列表字段按类型展示 */
      aftersales: [{
        id: 'AS-9003-1',
        productName: '新鲜红颜草莓 香甜多汁 500g装',
        type: '退货退款',
        status: '待收货',
        returnQty: 1,
        refundAmount: '¥19.59',
        refundCoupon: '¥2.50',
        refundPoints: 0,
        adjustAmount: '¥0.00'
      }, {
        id: 'AS-9003-2',
        productName: '进口香蕉 香甜软糯 3斤装',
        type: '仅退款',
        status: '退款中',
        returnQty: 1,
        refundAmount: '¥12.00',
        refundCoupon: '¥0.00',
        refundPoints: 0,
        adjustAmount: '-¥1.00'
      }, {
        id: 'AS-9003-3',
        productName: '新鲜红颜草莓 香甜多汁 500g装',
        type: '补货',
        status: '待审批',
        applyRestockQty: 1,
        actualRestockQty: '-'
      }],
      customer: { nickname: '赵金芝', phone: '18715449646', userId: '318605592681791502' },
      delivery: {
        type: 'EXPRESS',
        name: '杜建锋',
        phone: '18715449646',
        address: '萧山区经济开发区鸿兴路158号',
        homeAddress: '浙江省杭州市萧山区鸿兴路158号锦绣家园3幢1201',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: '直播、商城',
        payChannel: '微信',
        marketing: '拉新赠品',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-03 16:48', title: '订单已创建', desc: '订单创建，金额 ¥46.18' },
        { time: '2026-06-04 10:00', title: '商家已发货', desc: '快递已发出，配送至用户收货地址' }
      ],
      clearingEmpty: true
    },
    'ORD-3212689201560682': {
      displayId: 'ORD-3212689201560682',
      progress: {
        completedSteps: 3,
        outcome: 'success',
        status: '已完成',
        submitTime: '2026-06-02 18:03',
        finishTime: '2026-06-03 11:20'
      },
      goods: [{
        id: 'g1',
        name: '精品牛腩 500g',
        spec: '规格：500g',
        img: '../user-app/assets/order-product-2.svg',
        spu: 'SPU-3301…',
        sku: 'SKU-3301…',
        weight: '0.50',
        price: '¥18.00',
        qty: '1',
        subtotal: '¥18.00',
        marketing: '福袋奖品',
        aftersaleTag: '已补发'
      }],
      amounts: {
        goods: '¥18.00',
        discount: '-¥3.00',
        shipping: '¥0.00',
        payable: '¥15.00',
        paid: '¥15.00',
        merchant: '¥15.00',
        refund: '¥0.00'
      },
      paymentCount: 1,
      aftersales: [{
        id: 'AS-0682-1',
        productName: '精品牛腩 500g',
        type: '补货',
        status: '已完成',
        applyRestockQty: 1,
        actualRestockQty: 1
      }],
      customer: { nickname: '赵金芝', phone: '13800001234', userId: '318605592681791499' },
      delivery: {
        type: 'EXPRESS',
        name: '李四',
        phone: '13800001234',
        address: '浙江省杭州市上城区望江街道望江路16号',
        homeAddress: '浙江省杭州市上城区望江街道望江路28号阳光公寓5-602',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: '直播',
        payChannel: '支付宝',
        marketing: '福袋奖品',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-02 18:03', type: 'create', title: '订单已创建', desc: '订单创建，金额 ¥15.00' },
        { time: '2026-06-03 09:00', type: 'ship', title: '商家已发货', desc: '快递已发出，配送至用户收货地址' },
        { time: '2026-06-03 11:20', type: 'success', title: '交易成功', desc: '用户已签收，订单已完成' }
      ],
      clearingEmpty: true
    }
  };

  var MID_STEPS = ['提交订单', '运输中', '待收货', '待提货'];
  var PROXY_MID_STEPS = ['提交订单', '运输中', '待收货'];

  function isRetailExpressDetail(detail, row) {
    if (isProxyOrderPage()) return false;
    if (detail && detail.delivery) {
      var typeLabel = retailDeliveryLabel(detail.delivery.type || detail.delivery.deliveryMode);
      if (typeLabel === '快递') return true;
    }
    if (row) {
      if ((row.getAttribute('data-delivery-mode') || '') === 'express') return true;
      if (readDeliveryModeFromRow(row) === '快递') return true;
    }
    return false;
  }

  function usesExpressProgress(detail, row) {
    return isProxyOrderPage() || isRetailExpressDetail(detail, row);
  }

  function getMidSteps(detail, row) {
    return usesExpressProgress(detail, row) ? PROXY_MID_STEPS : MID_STEPS;
  }

  function normalizeProxyProgress(progress) {
    if (!progress) return progress;
    var p = Object.assign({}, progress);
    if (p.status === '待提货' || p.status === '部分提货') {
      p.status = '待收货';
    }
    if (p.status === '待收货') {
      p.completedSteps = 2;
    } else if (p.status === '已完成' || p.outcome === 'success') {
      p.completedSteps = PROXY_MID_STEPS.length;
    } else if (p.status === '已关闭' || p.outcome === 'failed') {
      p.completedSteps = Math.min(p.completedSteps || 1, PROXY_MID_STEPS.length);
    }
    return p;
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function resolveProgress(progress, row) {
    if (progress && progress.status) return progress;
    return inferProgressFromRow(row);
  }

  function inferProgressFromRow(row) {
    var statusEl = row ? row.querySelector('.order-tag:not(.order-tag--sale)') : null;
    var statusText = statusEl ? statusEl.textContent.trim() : '';
    var cells = row ? row.querySelectorAll('td') : [];
    var submitTime = cells[1] ? cells[1].textContent.trim() : '';
    var base = {
      completedSteps: 1,
      outcome: null,
      status: '运输中',
      submitTime: submitTime
    };

    if (statusText === '已关闭' || statusText === '已取消') {
      return {
        completedSteps: 1,
        outcome: 'failed',
        status: '已关闭',
        submitTime: submitTime,
        finishTime: submitTime
      };
    }
    if (statusText === '已完成') {
      return {
        completedSteps: 4,
        outcome: 'success',
        status: '已完成',
        submitTime: submitTime,
        finishTime: submitTime
      };
    }
    if (statusText === '待提货') {
      return {
        completedSteps: 3,
        outcome: null,
        status: '待提货',
        submitTime: submitTime
      };
    }
    if (statusText === '部分提货') {
      return {
        completedSteps: 3,
        outcome: null,
        status: '待提货',
        submitTime: submitTime
      };
    }
    if (statusText === '待收货') {
      return {
        completedSteps: 2,
        outcome: null,
        status: '待收货',
        submitTime: submitTime
      };
    }
    return base;
  }

  function buildSteps(detail) {
    var progress = detail.progress || {};
    var wrap = el('div', 'order-detail-steps');
    var completedSteps = progress.completedSteps || 0;
    var outcome = progress.outcome || null;
    var midSteps = getMidSteps(detail);

    midSteps.forEach(function (label, index) {
      var step = el('div', 'order-detail-step');
      if (index < completedSteps) step.classList.add('is-done');
      if (!outcome && index === completedSteps) step.classList.add('is-current');
      var icon = el('div', 'order-detail-step__icon', String(index + 1));
      step.appendChild(icon);
      step.appendChild(el('div', 'order-detail-step__label', label));
      if (index === 0 && progress.submitTime) {
        step.appendChild(el('div', 'order-detail-step__time', progress.submitTime));
      }
      wrap.appendChild(step);
    });

    var finalStep = el('div', 'order-detail-step');
    var finalLabel = '交易成功';
    if (outcome === 'failed') {
      finalLabel = '交易失败';
      finalStep.classList.add('is-done', 'is-failed');
    } else if (outcome === 'success') {
      finalStep.classList.add('is-done', 'is-success');
    }
    var finalIcon = el('div', 'order-detail-step__icon', String(midSteps.length + 1));
    finalStep.appendChild(finalIcon);
    finalStep.appendChild(el('div', 'order-detail-step__label', finalLabel));
    if (progress.finishTime && outcome) {
      finalStep.appendChild(el('div', 'order-detail-step__time', progress.finishTime));
    }
    wrap.appendChild(finalStep);
    return wrap;
  }

  function getProgressStatusClass(status) {
    if (status === '已完成') return 'order-detail-status--completed';
    if (status === '已关闭') return 'order-detail-status--closed';
    if (status === '部分提货') return 'order-detail-status--partial';
    return 'order-detail-status--progress';
  }

  function buildProgressStatusTag(status) {
    return el('span', 'order-detail-status ' + getProgressStatusClass(status), status);
  }

  function parsePrice(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    return parseFloat(String(str).replace(/[¥,\s]/g, '')) || 0;
  }

  function formatMoney(n) {
    return '¥' + n.toFixed(2);
  }

  function formatNow() {
    var d = new Date();
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function normalizeGood(item, index) {
    var qty = parseInt(item.qty, 10) || 1;
    var pickedQty = item.pickedQty || 0;
    var unitPrice = item.unitPrice != null ? item.unitPrice : parsePrice(item.price);
    return {
      id: item.id || ('g' + (index + 1)),
      name: item.name,
      spec: item.spec,
      img: item.img,
      spu: item.spu,
      sku: item.sku,
      weight: item.weight,
      price: item.price || formatMoney(unitPrice),
      qty: qty,
      pickedQty: pickedQty,
      unitPrice: unitPrice,
      subtotal: item.subtotal || formatMoney(unitPrice * qty),
      marketing: item.marketing
    };
  }

  function isPickupOrder(status, detail, row) {
    if (isProxyOrderPage()) return false;
    if (isRetailExpressDetail(detail, row)) return false;
    return status === '待提货';
  }

  function hasPartialPickup(goods) {
    return goods.some(function (g) {
      return g.pickedQty > 0 && getGoodRemaining(g) > 0;
    });
  }

  function getGoodRemaining(g) {
    return Math.max(0, g.qty - g.pickedQty);
  }

  function getGoodPickupTag(g) {
    var remaining = getGoodRemaining(g);
    if (remaining === 0) return { text: '已提货', cls: 'order-tag--done' };
    if (g.pickedQty > 0) return { text: '部分提货（已提' + g.pickedQty + '件）', cls: 'order-tag--partial' };
    return { text: '待提货', cls: 'order-tag--pickup' };
  }

  function computeOrderPickupProgress(goods) {
    var allDone = goods.every(function (g) { return getGoodRemaining(g) === 0; });
    if (allDone) {
      return {
        status: '已完成',
        outcome: 'success',
        completedSteps: 4,
        finishTime: formatNow()
      };
    }
    return {
      status: '待提货',
      outcome: null,
      completedSteps: 3
    };
  }

  function inferLogType(log) {
    if (log.type) return log.type;
    var title = log.title || '';
    if (title.indexOf('提货') >= 0 && title !== '商品已到提货点') return 'pickup';
    if (title === '部分提货') return 'pickup_partial';
    if (title === '交易成功') return 'success';
    if (title === '商品已到提货点') return 'arrival';
    if (title.indexOf('创建') >= 0) return 'create';
    if (title.indexOf('关闭') >= 0) return 'closed';
    return 'default';
  }

  function countPickupLogs(logs) {
    return logs.filter(function (log) {
      var type = inferLogType(log);
      return type === 'pickup' || type === 'pickup_partial' || type === 'pickup_batch' || type === 'pickup_whole';
    }).length;
  }

  function buildVerifyLogPayload(applied, options) {
    var title = options.title || '批量核销';
    var type = options.type || 'pickup_batch';
    var summary = applied.map(function (item) {
      return item.good.name + ' ×' + item.qty;
    }).join('、');
    var totalQty = applied.reduce(function (sum, item) { return sum + item.qty; }, 0);
    var desc = (options.descPrefix || '批量核销：') + summary;
    if (options.orderCompleted) {
      desc += '，全部商品已核销，订单已完成';
    }
    return {
      time: formatNow(),
      type: type,
      title: title,
      desc: desc,
      pickup: {
        productName: applied.length > 1 ? ('共 ' + applied.length + ' 种商品') : applied[0].good.name,
        sku: '-',
        qty: totalQty,
        pickedQty: totalQty,
        totalQty: totalQty,
        itemsSummary: summary,
        operator: '门店核销员'
      }
    };
  }

  function buildPickupLogEntry(good, qty) {
    return {
      time: formatNow(),
      type: 'pickup',
      title: '商品提货',
      desc: good.name + ' 提货 ' + qty + ' 件（累计已提 ' + good.pickedQty + '/' + good.qty + '）',
      pickup: {
        productName: good.name,
        sku: good.sku,
        spu: good.spu,
        qty: qty,
        pickedQty: good.pickedQty,
        totalQty: good.qty,
        operator: '门店核销员'
      }
    };
  }

  function buildTimelineItem(log) {
    var li = el('li');
    var type = inferLogType(log);
    li.classList.add('order-detail-timeline__item--' + type);

    li.appendChild(el('div', 'order-detail-timeline__time', log.time));
    li.appendChild(el('div', 'order-detail-timeline__title', log.title));

    if ((type === 'pickup' || type === 'pickup_batch' || type === 'pickup_whole') && log.pickup) {
      var p = log.pickup;
      var qtyLabel = (type === 'pickup_batch' || type === 'pickup_whole') ? '本次核销' : '本次提货';
      var box = el('div', 'order-detail-timeline__pickup');
      box.innerHTML =
        '<div class="order-detail-timeline__pickup-row">' +
          '<span class="order-detail-timeline__pickup-label">商品</span>' +
          '<span class="order-detail-timeline__pickup-value">' + p.productName + '</span>' +
        '</div>' +
        (p.sku && p.sku !== '-'
          ? '<div class="order-detail-timeline__pickup-row">' +
              '<span class="order-detail-timeline__pickup-label">' + (isProxyOrderPage() ? '条形码' : '条码') + '</span>' +
              '<span class="order-detail-timeline__pickup-value">' + p.sku + '</span>' +
            '</div>'
          : '') +
        '<div class="order-detail-timeline__pickup-row">' +
          '<span class="order-detail-timeline__pickup-label">' + qtyLabel + '</span>' +
          '<span class="order-detail-timeline__pickup-value order-detail-timeline__pickup-qty">+' + p.qty + ' 件</span>' +
        '</div>' +
        '<div class="order-detail-timeline__pickup-row">' +
          '<span class="order-detail-timeline__pickup-label">累计进度</span>' +
          '<span class="order-detail-timeline__pickup-value">' + p.pickedQty + ' / ' + p.totalQty + ' 件</span>' +
        '</div>' +
        (p.itemsSummary
          ? '<div class="order-detail-timeline__pickup-row">' +
              '<span class="order-detail-timeline__pickup-label">明细</span>' +
              '<span class="order-detail-timeline__pickup-value">' + p.itemsSummary + '</span>' +
            '</div>'
          : '') +
        (p.operator
          ? '<div class="order-detail-timeline__pickup-row">' +
              '<span class="order-detail-timeline__pickup-label">操作人</span>' +
              '<span class="order-detail-timeline__pickup-value">' + p.operator + '</span>' +
            '</div>'
          : '');
      li.appendChild(box);
    } else if (type === 'pickup_partial') {
      var partial = el('div', 'order-detail-timeline__desc order-detail-timeline__desc--partial', log.desc || '');
      li.appendChild(partial);
    } else {
      li.appendChild(el('div', 'order-detail-timeline__desc', log.desc || ''));
    }
    return li;
  }

  function renderTimeline(timeline, logs) {
    timeline.innerHTML = '';
    logs.forEach(function (log) {
      timeline.appendChild(buildTimelineItem(log));
    });
  }

  function updateLogToggleBadge(toggle, logs) {
    if (!toggle) return;
    var badge = toggle.querySelector('.order-detail-log-badge');
    var pickupCount = countPickupLogs(logs);
    if (pickupCount > 0) {
      if (!badge) {
        badge = el('span', 'order-detail-log-badge', pickupCount + ' 条提货');
        var label = toggle.querySelector('.order-detail-log-toggle__label');
        if (label) label.appendChild(badge);
      } else {
        badge.textContent = pickupCount + ' 条提货';
      }
      badge.hidden = false;
    } else if (badge) {
      badge.hidden = true;
    }
  }

  /** 商品售后标签：退款中 / 部分退款 / 全额退款 / 补发中 / 已补发 */
  var GOODS_AS_TAG_CLASS = {
    '退款中': 'is-refunding',
    '部分退款': 'is-partial',
    '全额退款': 'is-full',
    '补发中': 'is-restocking',
    '已补发': 'is-restocked'
  };

  function goodsAftersaleTagHtml(tag) {
    if (!tag || !GOODS_AS_TAG_CLASS[tag]) return '';
    return '<span class="order-detail-goods-as-tag ' + GOODS_AS_TAG_CLASS[tag] + '">' + tag + '</span>';
  }

  /**
   * 由售后明细推导商品标签（未显式配置 aftersaleTag 时）。
   * 仅退款 / 退货退款均扣减商品数量：退款数 < 购买数 → 部分退款，否则全额退款。
   */
  function resolveGoodsAftersaleTag(item, aftersales) {
    if (item && item.aftersaleTag) return item.aftersaleTag;
    var list = (aftersales || []).filter(function (a) {
      return a.productName === item.name || a.goodId === item.id;
    });
    if (!list.length) return '';
    var refundOpen = ['待审批', '退款中', '待退货', '待收货', '退款异常'];
    var restockOpen = ['待审批', '待收货'];
    var hasRefundOpen = list.some(function (a) {
      return (a.type === '仅退款' || a.type === '退货退款') && refundOpen.indexOf(a.status) >= 0;
    });
    if (hasRefundOpen) return '退款中';
    var refundDone = list.filter(function (a) {
      return (a.type === '仅退款' || a.type === '退货退款') && a.status === '已完成';
    });
    if (refundDone.length) {
      var buyQty = parseInt(item.qty, 10) || 0;
      var returned = refundDone.reduce(function (s, a) {
        return s + (parseInt(a.returnQty, 10) || 0);
      }, 0);
      if (buyQty > 0 && returned > 0 && returned < buyQty) return '部分退款';
      return '全额退款';
    }
    if (list.some(function (a) {
      return a.type === '补货' && restockOpen.indexOf(a.status) >= 0;
    })) return '补发中';
    if (list.some(function (a) { return a.type === '补货' && a.status === '已完成'; })) {
      return '已补发';
    }
    return '';
  }

  function buildGoodsProductCell(item, aftersales) {
    var tag = resolveGoodsAftersaleTag(item, aftersales);
    return '<td><div class="order-detail-goods-product">' +
      '<img src="' + item.img + '" alt="">' +
      '<div><div class="order-detail-goods-product__name">' + item.name +
      goodsAftersaleTagHtml(tag) + '</div>' +
      '<div class="order-detail-goods-product__spec">' + item.spec + '</div></div>' +
      '</div></td>';
  }

  function buildPickupQtyControl(goodId, remaining, value) {
    var val = value != null
      ? Math.min(Math.max(1, value), remaining)
      : remaining;
    return '<div class="order-pickup-qty" data-good-id="' + goodId + '">' +
      '<button type="button" class="js-pickup-minus" aria-label="减少"' + (val <= 1 ? ' disabled' : '') + '>−</button>' +
      '<input type="number" class="js-pickup-qty-input" min="1" max="' + remaining + '" value="' + val + '">' +
      '<button type="button" class="js-pickup-plus" aria-label="增加"' + (val >= remaining ? ' disabled' : '') + '>+</button>' +
      '</div>';
  }

  function buildGoodsTableBody(goods, pickupMode, aftersales) {
    var tbody = el('tbody');
    var verifyBlocked = pickupMode && aftersalesHaveApprovedRefund(aftersales);
    goods.forEach(function (item) {
      var remaining = getGoodRemaining(item);
      var tr = document.createElement('tr');
      tr.setAttribute('data-good-id', item.id);
      if (remaining === 0) tr.classList.add('is-picked');

      var selectCell = '';
      var pickupCells = '';
      if (pickupMode) {
        var canPick = remaining > 0 && !verifyBlocked;
        var checkbox = canPick
          ? '<input type="checkbox" class="js-pickup-row-check" data-good-id="' + item.id + '">'
          : '';
        var qtyCtrl = canPick
          ? buildPickupQtyControl(item.id, remaining)
          : '—';
        var action;
        if (remaining <= 0) {
          action = '<span style="color:#c0c4cc">—</span>';
        } else if (verifyBlocked) {
          action =
            '<button type="button" class="order-pickup-line-btn js-pickup-line-confirm" data-good-id="' +
            item.id +
            '" disabled title="订单售后已通过审核，无法核销">核销</button>';
        } else {
          action =
            '<button type="button" class="order-pickup-line-btn js-pickup-line-confirm" data-good-id="' +
            item.id +
            '">核销</button>';
        }
        selectCell = '<td class="order-pickup-check-cell">' + checkbox + '</td>';
        pickupCells =
          '<td>' + item.pickedQty + '</td>' +
          '<td>' + remaining + '</td>' +
          '<td><div class="order-pickup-cell">' + qtyCtrl + action + '</div></td>';
      }

      tr.innerHTML =
        selectCell +
        buildGoodsProductCell(item, aftersales) +
        '<td>' + item.spu + '</td>' +
        '<td>' + (item.barcode || item.sku) + '</td>' +
        '<td>' + item.weight + '</td>' +
        '<td>' + item.price + '</td>' +
        '<td>' + item.qty + '</td>' +
        '<td>' + item.subtotal + '</td>' +
        (isProxyOrderPage() ? '' : '<td>' + marketingTagHtml(item.marketing) + '</td>') +
        pickupCells;
      tbody.appendChild(tr);
    });
    return tbody;
  }

  function buildPickupToolbar(aftersales) {
    var toolbar = el('div', 'order-pickup-toolbar');
    var verifyBlocked = aftersalesHaveApprovedRefund(aftersales);
    toolbar.innerHTML =
      '<label class="order-pickup-toolbar__select">' +
        '<input type="checkbox" class="js-pickup-select-all"' +
        (verifyBlocked ? ' disabled' : '') +
        '> 全选待提商品' +
      '</label>' +
      '<span class="order-pickup-toolbar__summary">已选 <em class="js-pickup-selected-count">0</em> 种商品</span>' +
      '<div class="order-pickup-toolbar__actions">' +
        '<button type="button" class="order-detail-btn order-detail-btn--primary js-pickup-batch"' +
        (verifyBlocked ? ' disabled title="订单售后已通过审核，无法核销"' : '') +
        '>批量核销</button>' +
      '</div>';
    if (verifyBlocked) {
      var tip = el('p', 'order-pickup-toolbar__block-tip');
      tip.textContent = '订单售后已通过审核，无法核销';
      toolbar.appendChild(tip);
    }
    return toolbar;
  }

  function buildGoodsTableHeadRow(pickupMode) {
    var barcodeCol = isProxyOrderPage() ? '条形码' : '条码';
    var headCols = '<th>商品</th><th>编码</th><th>' + barcodeCol + '</th><th>重量(kg)</th><th>单价</th><th>数量</th><th>小计</th>';
    if (!isProxyOrderPage()) headCols += '<th>营销</th>';
    if (pickupMode) {
      headCols = '<th class="order-pickup-check-head">选择</th>' + headCols + '<th>已提</th><th>待提</th><th>操作</th>';
    }
    return '<tr>' + headCols + '</tr>';
  }

  function buildGoodsPanel(goods, pickupMode, aftersales) {
    var wrap = el('div', 'order-detail-goods-panel');
    if (pickupMode) wrap.appendChild(buildPickupToolbar(aftersales));

    var table = el('table', 'order-detail-goods-table');
    table.innerHTML = '<thead>' + buildGoodsTableHeadRow(pickupMode) + '</thead>';
    table.appendChild(buildGoodsTableBody(goods, pickupMode, aftersales));
    wrap.appendChild(table);
    return wrap;
  }

  function buildGoodsTable(goods) {
    return buildGoodsPanel(goods, false);
  }

  /** 售后状态：一状态一色（与售后单列表共用语义色） */
  var AFTERSALE_STATUS_MOD = {
    '待审批': 'pending',
    '退款中': 'refunding',
    '已拒绝': 'rejected',
    '待退货': 'return',
    '待收货': 'receive',
    '退款异常': 'exception',
    '已完成': 'done',
    '已取消': 'cancelled'
  };

  var AFTERSALE_TYPE_MOD = {
    '仅退款': 'refund-only',
    '退货退款': 'return-refund',
    '补货': 'restock'
  };

  function aftersaleStatusTagHtml(status) {
    var s = status || '-';
    var mod = AFTERSALE_STATUS_MOD[s] || 'info';
    return '<span class="order-detail-as-status order-detail-as-status--' + mod + '">' + s + '</span>';
  }

  function aftersaleTypeTagHtml(type) {
    var t = type || '-';
    var mod = AFTERSALE_TYPE_MOD[t] || 'info';
    return '<span class="order-detail-as-type order-detail-as-type--' + mod + '">' + t + '</span>';
  }

  function aftersaleCellText(v) {
    return v == null || v === '' ? '-' : String(v);
  }

  /**
   * 单据明细 · 售后明细：一条售后单一行；展示仅退款/退货退款/补货。
   * 列随列表内类型动态调整：退款类出退货/退款字段，补货出补货数字段。
   */
  function buildAftersalePanel(aftersales) {
    var list = (Array.isArray(aftersales) ? aftersales : []).filter(function (a) {
      return a && (a.type === '仅退款' || a.type === '退货退款' || a.type === '补货');
    });
    if (!list.length) return buildEmptyState('暂无售后明细');

    var hasRefundType = list.some(function (a) {
      return a.type === '仅退款' || a.type === '退货退款';
    });
    var hasRestock = list.some(function (a) { return a.type === '补货'; });

    var columns = [
      { key: 'product', label: '商品', align: 'left' },
      { key: 'type', label: '售后类型', align: 'center' },
      { key: 'status', label: '售后状态', align: 'center' }
    ];
    if (hasRefundType) {
      columns = columns.concat([
        { key: 'returnQty', label: '退货数', align: 'center' },
        { key: 'refundAmount', label: '退款额', align: 'center' },
        { key: 'refundCoupon', label: '退券', align: 'center' },
        { key: 'refundPoints', label: '退积分', align: 'center' },
        { key: 'adjustAmount', label: '多退少补', align: 'center' }
      ]);
    }
    if (hasRestock) {
      columns = columns.concat([
        { key: 'applyRestockQty', label: '申请补货数', align: 'center' },
        { key: 'actualRestockQty', label: '实际补货数', align: 'center' }
      ]);
    }

    function cellHtml(item, key) {
      var isRefund = item.type === '仅退款' || item.type === '退货退款';
      var isRestock = item.type === '补货';
      if (key === 'product') return aftersaleCellText(item.productName);
      if (key === 'type') return aftersaleTypeTagHtml(item.type);
      if (key === 'status') return aftersaleStatusTagHtml(item.status);
      if (key === 'returnQty') {
        /* 仅退款、退货退款均扣减商品数量，都展示退货数 */
        if (item.type === '仅退款' || item.type === '退货退款') {
          return aftersaleCellText(item.returnQty);
        }
        return '-';
      }
      if (key === 'refundAmount' || key === 'refundCoupon' || key === 'refundPoints' || key === 'adjustAmount') {
        return isRefund ? aftersaleCellText(item[key]) : '-';
      }
      if (key === 'applyRestockQty' || key === 'actualRestockQty') {
        return isRestock ? aftersaleCellText(item[key]) : '-';
      }
      return '-';
    }

    var wrap = el('div', 'order-detail-aftersale-panel');
    var table = el('table', 'order-detail-aftersale-table');
    table.innerHTML =
      '<thead><tr>' +
      columns.map(function (c) {
        return '<th class="is-' + c.align + '">' + c.label + '</th>';
      }).join('') +
      '</tr></thead>';
    var tbody = el('tbody');
    list.forEach(function (item) {
      var tr = document.createElement('tr');
      if (item.id) tr.setAttribute('data-aftersale-id', item.id);
      if (item.type) tr.setAttribute('data-aftersale-type', item.type);
      tr.innerHTML = columns.map(function (c) {
        return '<td class="is-' + c.align + '">' + cellHtml(item, c.key) + '</td>';
      }).join('');
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function getRowPickupQty(tr) {
    var input = tr.querySelector('.js-pickup-qty-input');
    if (!input) return 1;
    var remaining = parseInt(input.getAttribute('max'), 10) || 1;
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) val = remaining;
    return Math.min(val, remaining);
  }

  function closeDetailVerifyConfirm() {
    var backdrop = document.getElementById('orderVerifyConfirmBackdrop');
    if (backdrop) backdrop.remove();
    if (!document.getElementById('orderDetailBackdrop')) {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  /** 详情内核销：存在进行中退款售后时弹出与列表一致的确认窗 */
  function showDetailRefundVerifyConfirm(onConfirm) {
    if (window.OrderVerifyUI && typeof window.OrderVerifyUI.showConfirm === 'function') {
      window.OrderVerifyUI.showConfirm('', onConfirm, { variant: 'refund' });
      return;
    }
    closeDetailVerifyConfirm();
    var backdrop = document.createElement('div');
    backdrop.className = 'order-verify-confirm-backdrop';
    backdrop.id = 'orderVerifyConfirmBackdrop';
    backdrop.innerHTML =
      '<div class="order-verify-confirm order-verify-confirm--refund" role="dialog" aria-labelledby="orderVerifyConfirmTitle">' +
        '<h3 id="orderVerifyConfirmTitle" class="order-verify-confirm__title">确认核销</h3>' +
        '<p class="order-verify-confirm__message">当前商品存在退款申请，核销后将关闭退款，是否已与客户确认？</p>' +
        '<div class="order-verify-confirm__actions">' +
          '<button type="button" class="order-detail-btn order-detail-btn--ghost js-order-verify-cancel">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-order-verify-ok">确认核销</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeDetailVerifyConfirm();
    });
    backdrop.querySelector('.js-order-verify-cancel').addEventListener('click', closeDetailVerifyConfirm);
    backdrop.querySelector('.js-order-verify-ok').addEventListener('click', function () {
      closeDetailVerifyConfirm();
      onConfirm();
    });
  }

  /**
   * 详情核销 / 批量核销：
   * - 仅退款/退货退款已通过审核 → 禁止核销
   * - 仅有待审批退款售后 → 二次确认后关闭售后再核销
   */
  function guardPickupVerify(drawer, pickups, options) {
    options = options || {};
    if (!drawer || !pickups || !pickups.length) return;
    var orderId = drawer._orderId;
    if (hasApprovedRefundAftersale(orderId, drawer._sourceRow)) {
      if (typeof showToast === 'function') showToast('订单售后已通过审核，无法核销', 'warning');
      return;
    }
    var hasOpen = hasOpenRefundAftersale(orderId, drawer._sourceRow);

    function proceed() {
      var closed = [];
      if (hasOpen) {
        closed = closeOpenRefundAftersalesOnVerify(orderId);
        if (drawer._pickupRefs && DETAILS[orderId]) {
          drawer._pickupRefs.aftersales = (DETAILS[orderId].aftersales || []).slice();
        }
        if (closed.length && drawer._pickupState && DETAILS[orderId] && DETAILS[orderId].logs) {
          var closeLog = DETAILS[orderId].logs[0];
          if (closeLog && closeLog.type === 'aftersale_close') {
            drawer._pickupState.logs.unshift(Object.assign({}, closeLog));
          }
          // 同步商品标签（去掉退款中）
          if (DETAILS[orderId].goods) {
            drawer._pickupState.goods.forEach(function (g) {
              var src = DETAILS[orderId].goods.find(function (x) {
                return x.id === g.id || x.name === g.name;
              });
              if (src && src.aftersaleTag !== '退款中') delete g.aftersaleTag;
              else if (g.aftersaleTag === '退款中') delete g.aftersaleTag;
            });
          }
        }
      }
      performPickup(drawer, pickups, Object.assign({}, options, { closedAftersales: closed }));
    }

    if (hasOpen) {
      showDetailRefundVerifyConfirm(proceed);
    } else {
      proceed();
    }
  }

  function performPickup(drawer, pickups, options) {
    options = options || {};
    var state = drawer._pickupState;
    if (!state || !pickups.length) return;

    var prevStatus = state.progress.status;
    var hadAnyPickedBefore = state.goods.some(function (g) { return g.pickedQty > 0; });
    var isBatchVerify = !!options.batch;
    var applied = [];

    pickups.forEach(function (pick) {
      var good = state.goods.find(function (g) { return g.id === pick.id; });
      if (!good) return;
      var remaining = getGoodRemaining(good);
      var qty = Math.min(Math.max(1, pick.qty), remaining);
      if (qty <= 0) return;
      good.pickedQty += qty;
      applied.push({ good: good, qty: qty });
    });

    if (!applied.length) return;

    var progress = computeOrderPickupProgress(state.goods);
    Object.assign(state.progress, progress);

    if (isBatchVerify) {
      state.logs.unshift(buildVerifyLogPayload(applied, {
        title: '批量核销',
        type: 'pickup_batch',
        descPrefix: '批量核销：',
        orderCompleted: progress.outcome === 'success'
      }));
    } else {
      state.logs.unshift(buildPickupLogEntry(applied[0].good, applied[0].qty));
      if (progress.outcome === 'success' && prevStatus !== '已完成') {
        state.logs.unshift({
          time: state.progress.finishTime || formatNow(),
          type: 'success',
          title: '交易成功',
          desc: '全部商品核销完成，订单已完成'
        });
      } else if (!hadAnyPickedBefore && hasPartialPickup(state.goods)) {
        var pendingDesc = state.goods
          .filter(function (g) { return getGoodRemaining(g) > 0; })
          .map(function (g) { return g.name + '（剩 ' + getGoodRemaining(g) + ' 件）'; })
          .join('、');
        state.logs.unshift({
          time: formatNow(),
          type: 'pickup_partial',
          title: '部分提货',
          desc: '订单尚有商品待提：' + pendingDesc
        });
      }
    }

    // 同步回 DETAILS，保证再次打开抽屉数据一致
    if (drawer._orderId && DETAILS[drawer._orderId]) {
      DETAILS[drawer._orderId].goods = state.goods.map(function (g) {
        return Object.assign({}, g);
      });
      DETAILS[drawer._orderId].logs = state.logs.slice();
      DETAILS[drawer._orderId].progress = Object.assign({}, state.progress);
    }

    refreshPickupDrawer(drawer);
    if (typeof showToast === 'function') {
      var closedCount = options.closedAftersales ? options.closedAftersales.length : 0;
      var msg = progress.outcome === 'success' ? '全部商品已核销，订单已完成' : '核销成功';
      if (closedCount > 0) {
        msg += '，已自动关闭 ' + closedCount + ' 笔退款售后（订单核销，自动关闭）';
      }
      showToast(msg, 'success');
    }
  }

  function updatePickupSelectionSummary(drawer) {
    var panel = drawer._pickupRefs && drawer._pickupRefs.goodsPanel;
    if (!panel) return;
    var checked = panel.querySelectorAll('.js-pickup-row-check:checked');
    var countEl = panel.querySelector('.js-pickup-selected-count');
    if (countEl) countEl.textContent = String(checked.length);
    var selectAll = panel.querySelector('.js-pickup-select-all');
    var rowChecks = panel.querySelectorAll('.js-pickup-row-check');
    if (selectAll && rowChecks.length) {
      selectAll.checked = checked.length === rowChecks.length;
      selectAll.indeterminate = checked.length > 0 && checked.length < rowChecks.length;
    }
  }

  function refreshPickupDrawer(drawer) {
    var state = drawer._pickupState;
    var refs = drawer._pickupRefs;
    if (!state || !refs) return;

    var status = state.progress.status;
    var pickupMode = isPickupOrder(status, { delivery: drawer._deliveryMeta }, drawer._sourceRow);

    refs.statusTag.textContent = status;
    refs.statusTag.className = 'order-detail-status ' + getProgressStatusClass(status);

    var newSteps = buildSteps({
      progress: state.progress,
      delivery: drawer._deliveryMeta
    });
    refs.stepsContainer.replaceWith(newSteps);
    refs.stepsContainer = newSteps;

    if (refs.pickupToolbar) {
      if (pickupMode) {
        refs.pickupToolbar.hidden = false;
      } else {
        refs.pickupToolbar.remove();
        refs.pickupToolbar = null;
      }
    }

    var thead = refs.goodsTable.querySelector('thead');
    if (thead) thead.innerHTML = buildGoodsTableHeadRow(pickupMode);

    var newBody = buildGoodsTableBody(state.goods, pickupMode, refs.aftersales || []);
    refs.goodsTable.querySelector('tbody').replaceWith(newBody);

    renderTimeline(refs.timeline, state.logs);
    updateLogToggleBadge(refs.logToggle, state.logs);

    updatePickupSelectionSummary(drawer);
  }

  function bindPickupEvents(drawer) {
    var panel = drawer._pickupRefs && drawer._pickupRefs.goodsPanel;
    if (!panel) return;

    panel.addEventListener('click', function (e) {
      var minus = e.target.closest('.js-pickup-minus');
      var plus = e.target.closest('.js-pickup-plus');
      var lineBtn = e.target.closest('.js-pickup-line-confirm');
      var batchBtn = e.target.closest('.js-pickup-batch');
      var selectAll = e.target.closest('.js-pickup-select-all');

      if (minus || plus) {
        var qtyWrap = e.target.closest('.order-pickup-qty');
        if (!qtyWrap) return;
        var input = qtyWrap.querySelector('.js-pickup-qty-input');
        var max = parseInt(input.getAttribute('max'), 10) || 1;
        var val = parseInt(input.value, 10) || 1;
        if (minus) val = Math.max(1, val - 1);
        if (plus) val = Math.min(max, val + 1);
        input.value = String(val);
        minus.disabled = val <= 1;
        plus.disabled = val >= max;
        return;
      }

      if (lineBtn) {
        var goodId = lineBtn.getAttribute('data-good-id');
        var tr = lineBtn.closest('tr');
        guardPickupVerify(drawer, [{ id: goodId, qty: getRowPickupQty(tr) }]);
        return;
      }

      if (batchBtn) {
        var pickups = [];
        panel.querySelectorAll('.js-pickup-row-check:checked').forEach(function (cb) {
          var row = cb.closest('tr');
          pickups.push({
            id: cb.getAttribute('data-good-id'),
            qty: getRowPickupQty(row)
          });
        });
        if (!pickups.length) {
          if (typeof showToast === 'function') showToast('请先选择待核销商品', 'warning');
          return;
        }
        guardPickupVerify(drawer, pickups, { batch: true });
        return;
      }

      if (selectAll) {
        var checked = selectAll.checked;
        panel.querySelectorAll('.js-pickup-row-check').forEach(function (cb) {
          cb.checked = checked;
        });
        updatePickupSelectionSummary(drawer);
      }
    });

    panel.addEventListener('change', function (e) {
      if (e.target.matches('.js-pickup-row-check')) {
        updatePickupSelectionSummary(drawer);
      }
    });

    panel.addEventListener('input', function (e) {
      if (!e.target.matches('.js-pickup-qty-input')) return;
      var input = e.target;
      var max = parseInt(input.getAttribute('max'), 10) || 1;
      var val = parseInt(input.value, 10) || 1;
      val = Math.min(Math.max(1, val), max);
      input.value = String(val);
      var wrap = input.closest('.order-pickup-qty');
      if (wrap) {
        var minus = wrap.querySelector('.js-pickup-minus');
        var plus = wrap.querySelector('.js-pickup-plus');
        if (minus) minus.disabled = val <= 1;
        if (plus) plus.disabled = val >= max;
      }
    });
  }

  function buildAmounts(amounts) {
    var box = el('div', 'order-detail-amount-box');
    box.innerHTML =
      '<div class="order-detail-amount-row"><span>商品金额</span><span>' + amounts.goods + '</span></div>' +
      '<div class="order-detail-amount-row"><span>优惠（促销+券+积分抵扣）</span><span>' + amounts.discount + '</span></div>' +
      '<div class="order-detail-amount-row"><span>+ 运费</span><span>' + amounts.shipping + '</span></div>' +
      '<div class="order-detail-amount-row order-detail-amount-row--due"><span>应付金额</span><span>' + amounts.payable + '</span></div>' +
      '<div class="order-detail-amount-row order-detail-amount-row--paid"><span>买家实付</span><span>' + amounts.paid + '</span></div>' +
      '<div class="order-detail-amount-foot"><span>商家实收 ' + amounts.merchant + '</span><span>退款 ' + amounts.refund + '</span></div>';
    return box;
  }

  function buildEmptyState(text) {
    return el('div', 'order-detail-empty', '<div class="order-detail-empty__icon" aria-hidden="true"></div>' + text);
  }

  function buildKv(rows) {
    var dl = el('dl', 'order-detail-kv');
    Object.keys(rows).forEach(function (label) {
      dl.appendChild(el('dt', '', label));
      var value = rows[label];
      if (label === '营销类型') {
        dl.appendChild(el('dd', '', marketingTagHtml(value)));
      } else if (label === '订单场景') {
        dl.appendChild(el('dd', '', '<span class="order-tag order-tag--scene">' + value + '</span>'));
      } else {
        dl.appendChild(el('dd', '', value));
      }
    });
    return dl;
  }

  function buildDrawerContent(detail, drawer) {
    var layout = el('div', 'order-detail-layout');
    var state = drawer && drawer._pickupState;
    var goods = state ? state.goods : detail.goods;
    var logs = state ? state.logs : detail.logs;
    var progress = state ? state.progress : detail.progress;
    var pickupMode = state && isPickupOrder(progress.status, detail, drawer && drawer._sourceRow);

    var main = el('div', 'order-detail-main');

    var progressCard = el('div', 'order-detail-card');
    var progressHead = el('div', 'order-detail-progress-head');
    progressHead.appendChild(el('h3', 'order-detail-card__title', '订单进度'));
    var statusTag = buildProgressStatusTag(progress.status || '运输中');
    progressHead.appendChild(statusTag);
    progressCard.appendChild(progressHead);
    var stepsEl = buildSteps({
      progress: progress,
      delivery: detail.delivery
    });
    progressCard.appendChild(stepsEl);
    main.appendChild(progressCard);

    var docCard = el('div', 'order-detail-card');
    docCard.appendChild(el('h3', 'order-detail-card__title', '单据明细'));
    var tabs = el('div', 'order-detail-doc-tabs');
    var tabDefs = [
      { id: 'goods', label: '商品明细' },
      { id: 'payment', label: '收款明细 (' + detail.paymentCount + ')' },
      { id: 'discount', label: '折扣明细' },
      { id: 'aftersale', label: '售后明细' }
    ];
    var panels = {};
    tabDefs.forEach(function (tab, index) {
      var btn = el('button', 'order-detail-doc-tab' + (index === 0 ? ' is-active' : ''), tab.label);
      btn.type = 'button';
      btn.setAttribute('data-doc-tab', tab.id);
      tabs.appendChild(btn);
      var panel = el('div', 'order-detail-doc-panel');
      panel.setAttribute('data-doc-panel', tab.id);
      if (index !== 0) panel.hidden = true;
      if (tab.id === 'goods') {
        var goodsPanel = buildGoodsPanel(goods, pickupMode, detail.aftersales);
        panel.appendChild(goodsPanel);
        panel.appendChild(buildAmounts(detail.amounts));
        if (drawer && pickupMode) {
          drawer._pickupRefs = drawer._pickupRefs || {};
          drawer._pickupRefs.goodsPanel = goodsPanel;
          drawer._pickupRefs.goodsTable = goodsPanel.querySelector('.order-detail-goods-table');
          drawer._pickupRefs.pickupToolbar = goodsPanel.querySelector('.order-pickup-toolbar');
          drawer._pickupRefs.statusTag = statusTag;
          drawer._pickupRefs.stepsContainer = stepsEl;
          drawer._pickupRefs.aftersales = detail.aftersales || [];
        }
      } else if (tab.id === 'payment') {
        panel.appendChild(buildEmptyState('暂无收款明细'));
      } else if (tab.id === 'aftersale') {
        panel.appendChild(buildAftersalePanel(detail.aftersales));
      } else {
        panel.appendChild(buildEmptyState('暂无' + tab.label));
      }
      panels[tab.id] = panel;
      docCard.appendChild(panel);
    });
    docCard.insertBefore(tabs, docCard.children[1]);
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-doc-tab]');
      if (!btn) return;
      var id = btn.getAttribute('data-doc-tab');
      tabs.querySelectorAll('.order-detail-doc-tab').forEach(function (el) {
        el.classList.toggle('is-active', el === btn);
      });
      Object.keys(panels).forEach(function (key) {
        panels[key].hidden = key !== id;
      });
    });
    main.appendChild(docCard);

    var clearingCard = el('div', 'order-detail-card');
    var clearingHead = el('div', 'order-detail-card__head');
    clearingHead.appendChild(el('h3', 'order-detail-card__title', '清分明细'));
    var recalcBtn = el('button', 'order-detail-btn order-detail-btn--primary', '重算分佣');
    recalcBtn.type = 'button';
    recalcBtn.addEventListener('click', function () {
      if (typeof showToast === 'function') showToast('重算分佣已提交（演示）', 'success');
    });
    clearingHead.appendChild(recalcBtn);
    clearingCard.appendChild(clearingHead);
    clearingCard.appendChild(buildEmptyState('暂无清分明细'));
    main.appendChild(clearingCard);

    var logCard = el('div', 'order-detail-card');
    var logToggle = el('button', 'order-detail-log-toggle');
    logToggle.type = 'button';
    var logToggleLabel = el('span', 'order-detail-log-toggle__label', '操作日志');
    logToggle.appendChild(logToggleLabel);
    updateLogToggleBadge(logToggle, logs);
    logToggle.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>');
    var logBody = el('div', 'order-detail-log-body');
    var timeline = el('ul', 'order-detail-timeline');
    renderTimeline(timeline, logs);
    logBody.appendChild(timeline);
    if (drawer) {
      drawer._pickupRefs = drawer._pickupRefs || {};
      drawer._pickupRefs.timeline = timeline;
      drawer._pickupRefs.logToggle = logToggle;
    }
    logToggle.addEventListener('click', function () {
      var collapsed = logToggle.classList.toggle('is-collapsed');
      logBody.hidden = collapsed;
    });
    logCard.appendChild(logToggle);
    logCard.appendChild(logBody);
    main.appendChild(logCard);

    var aside = el('div', 'order-detail-aside');

    var customerCard = el('div', 'order-detail-card');
    customerCard.appendChild(el('h3', 'order-detail-card__title', '客户信息'));
    customerCard.appendChild(buildKv({
      '昵称': detail.customer.nickname,
      '手机': detail.customer.phone,
      '用户ID': detail.customer.userId
    }));
    aside.appendChild(customerCard);

    var deliveryCard;
    var useExpressCard = window.OrderProxyExpress && (
      isProxyOrderPage() || isRetailExpressDetail(detail, drawer && drawer._sourceRow)
    );
    if (useExpressCard) {
      var expressOpts = {
        context: isProxyOrderPage() ? undefined : 'retail',
        goods: detail.goods,
        onRefresh: function () {
          if (!drawer) return;
          var orderId = drawer._orderId;
          var row = drawer._sourceRow;
          closeDrawer();
          openDrawer(orderId, row);
        }
      };
      if (!isProxyOrderPage()) {
        expressOpts.onUpload = function () {
          if (!drawer) return;
          OrderProxyExpress.openUploadModal(drawer._orderId, detail.goods, function () {
            var orderId = drawer._orderId;
            var row = drawer._sourceRow;
            closeDrawer();
            openDrawer(orderId, row);
          });
        };
      }
      deliveryCard = OrderProxyExpress.buildDeliveryCard(
        detail,
        drawer && drawer._orderId,
        drawer && drawer._sourceRow,
        expressOpts
      );
    } else {
      deliveryCard = el('div', 'order-detail-card');
      deliveryCard.appendChild(el('h3', 'order-detail-card__title', '收货 / 自提信息'));
      deliveryCard.appendChild(buildKv({
        '履约方式': retailDeliveryLabel(detail.delivery.deliveryMode || detail.delivery.type),
        '收货人': detail.delivery.name,
        '电话': detail.delivery.phone,
        '地址': detail.delivery.address,
        '门店': detail.delivery.store
      }));
    }
    aside.appendChild(deliveryCard);

    var tagCard = el('div', 'order-detail-card');
    tagCard.appendChild(el('h3', 'order-detail-card__title', '订单标记'));
    var tagRows = {
      '渠道': detail.tags.channel,
      '支付渠道': detail.tags.payChannel,
      'BD': detail.tags.bd,
      '结算状态': detail.tags.settleStatus,
      '分佣状态': detail.tags.commissionStatus
    };
    if (!isProxyOrderPage()) {
      tagRows['订单场景'] = detail.tags.orderScene || '直播';
      tagRows['营销类型'] = detail.tags.marketing;
      tagRows['直播时段'] = detail.tags.livePeriod;
    }
    tagCard.appendChild(buildKv(tagRows));
    aside.appendChild(tagCard);

    layout.appendChild(main);
    layout.appendChild(aside);
    return layout;
  }

  function fallbackDetail(orderId, row) {
    var productImg = row ? row.querySelector('.order-product-cell__thumb') : null;
    var productName = row ? row.querySelector('.order-product-cell__name') : null;
    var cells = row ? row.querySelectorAll('td') : [];
    var sceneEl = row ? row.querySelector('.order-scene') : null;
    var cellIdx = getListCellIndices(row);
    var marketingLabel = isProxyOrderPage() ? null : readMarketingFromRow(row);
    var progress = inferProgressFromRow(row);
    var statusText = progress.status;
    var logs = [
      {
        time: progress.submitTime || '',
        title: '订单已创建',
        desc: '订单创建，金额 ' + (cells[cellIdx.paid] ? cells[cellIdx.paid].textContent.trim() : '')
      }
    ];
    if (progress.outcome === 'failed') {
      logs.push({
        time: progress.finishTime || progress.submitTime || '',
        title: '订单已关闭',
        desc: '订单已取消或全额退款，交易失败'
      });
    } else if (progress.outcome === 'success') {
      logs.push({
        time: progress.finishTime || progress.submitTime || '',
        title: '交易成功',
        desc: isRetailExpressDetail(null, row)
          ? '用户已签收，订单已完成'
          : '全部商品核销完成，订单已完成'
      });
    }
    return {
      displayId: orderId,
      progress: progress,
      goods: [{
        name: productName ? productName.textContent.trim() : '商品',
        spec: '规格：默认',
        img: productImg ? productImg.getAttribute('src') : '../user-app/assets/order-product-1.svg',
        spu: 'SPU-0001…',
        sku: 'SKU-0001…',
        weight: '-',
        price: cells[cellIdx.goods] ? cells[cellIdx.goods].textContent.trim() : '¥0.00',
        qty: '1',
        subtotal: cells[cellIdx.goods] ? cells[cellIdx.goods].textContent.trim() : '¥0.00',
        marketing: marketingLabel || '普通售卖',
        aftersaleTag: progress.outcome === 'failed' ? '全额退款' : ''
      }],
      amounts: {
        goods: cells[cellIdx.goods] ? cells[cellIdx.goods].textContent.trim() : '¥0.00',
        discount: cells[cellIdx.discount] ? cells[cellIdx.discount].textContent.trim() : '¥0.00',
        shipping: '¥0.00',
        payable: cells[cellIdx.paid] ? cells[cellIdx.paid].textContent.trim() : '¥0.00',
        paid: cells[cellIdx.paid] ? cells[cellIdx.paid].textContent.trim() : '¥0.00',
        merchant: cells[cellIdx.paid] ? cells[cellIdx.paid].textContent.trim() : '¥0.00',
        refund: '¥0.00'
      },
      paymentCount: 1,
      aftersales: progress.outcome === 'failed' ? [{
        id: 'AS-fallback-1',
        productName: productName ? productName.textContent.trim() : '商品',
        type: '仅退款',
        status: '已完成',
        returnQty: 1,
        refundAmount: cells[cellIdx.paid] ? cells[cellIdx.paid].textContent.trim() : '¥0.00',
        refundCoupon: '¥0.00',
        refundPoints: 0,
        adjustAmount: '¥0.00'
      }] : [],
      customer: {
        nickname: cells[2] ? cells[2].textContent.trim() : '-',
        phone: cells[4] ? cells[4].textContent.trim() : '-',
        userId: '318605592681791488'
      },
      delivery: {
        type: isProxyOrderPage() ? 'PROXY' : (isRetailExpressDetail(null, row) ? 'EXPRESS' : 'SELF_PICKUP'),
        deliveryMode: isProxyOrderPage() ? '-' : readDeliveryModeFromRow(row),
        name: cells[3] ? cells[3].textContent.trim() : '-',
        phone: cells[4] ? cells[4].textContent.trim() : '-',
        address: isRetailExpressDetail(null, row)
          ? '浙江省杭州市西湖区文三路168号1幢502室'
          : '浙江省杭州市上城区望江街道望江路16号',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        orderScene: sceneEl ? sceneEl.textContent.trim() : '直播',
        payChannel: cells[cellIdx.payChannel] ? cells[cellIdx.payChannel].textContent.trim() : '-',
        marketing: marketingLabel || '普通售卖',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: logs,
      clearingEmpty: true
    };
  }

  function closeDrawer() {
    var backdrop = document.getElementById('orderDetailBackdrop');
    var drawer = document.getElementById('orderDetailDrawer');
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
    document.body.style.overflow = '';
  }

  function openDrawer(orderId, row) {
    closeDrawer();
    var detail = DETAILS[orderId] || fallbackDetail(orderId, row);
    if (row) {
      var sceneEl = row.querySelector('.order-scene');
      if (sceneEl) {
        detail.tags = detail.tags || {};
        detail.tags.orderScene = sceneEl.textContent.trim();
      }
      /* 支付渠道与列表一致：微信 / 支付宝 / - */
      var cellIdx = getListCellIndices(row);
      var cells = row.querySelectorAll('td');
      if (cells[cellIdx.payChannel]) {
        detail.tags = detail.tags || {};
        detail.tags.payChannel = cells[cellIdx.payChannel].textContent.trim() || '-';
      }
      var marketingLabel = isProxyOrderPage() ? null : readMarketingFromRow(row);
      if (!isProxyOrderPage()) {
        detail.tags = detail.tags || {};
        detail.tags.marketing = marketingLabel;
        if (detail.goods && detail.goods.length) {
          detail.goods = detail.goods.map(function (g) {
            return Object.assign({}, g, { marketing: marketingLabel });
          });
        }
        var modeLabel = readDeliveryModeFromRow(row);
        detail.delivery = detail.delivery || {};
        detail.delivery.deliveryMode = modeLabel;
        if (modeLabel === '快递') {
          detail.delivery.type = 'EXPRESS';
          if (detail.delivery.homeAddress) {
            detail.delivery.address = detail.delivery.homeAddress;
          }
        } else if (modeLabel === '自提') {
          detail.delivery.type = 'SELF_PICKUP';
        }
      }
    }
    detail.progress = resolveProgress(detail.progress, row);
    if (usesExpressProgress(detail, row)) {
      detail.progress = normalizeProxyProgress(detail.progress);
    }

    var backdrop = el('div', 'store-drawer-backdrop');
    backdrop.id = 'orderDetailBackdrop';
    backdrop.addEventListener('click', closeDrawer);

    var drawer = el('aside', 'store-drawer store-drawer--interactive order-detail-drawer');
    drawer.id = 'orderDetailDrawer';
    drawer._orderId = orderId;
    drawer._sourceRow = row;
    drawer._deliveryMeta = detail.delivery;

    var header = el('div', 'store-drawer__header');
    header.appendChild(el('h2', 'store-drawer__title', '订单详情 · ' + detail.displayId));
    var closeBtn = el('button', 'store-drawer__close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', closeDrawer);
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    if (isPickupOrder(detail.progress.status, detail, row)) {
      drawer._pickupState = {
        goods: detail.goods.map(normalizeGood),
        logs: detail.logs.slice(),
        progress: Object.assign({}, detail.progress)
      };
    }

    var body = el('div', 'store-drawer__body');
    body.appendChild(buildDrawerContent(detail, drawer));
    drawer.appendChild(body);

    if (drawer._pickupState && isPickupOrder(drawer._pickupState.progress.status, detail, row)) {
      bindPickupEvents(drawer);
    }

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', onEsc);
    function onEsc(e) {
      if (e.key === 'Escape') {
        if (window.OrderProxyExpress && document.getElementById('orderProxyTrackDrawer')) {
          window.OrderProxyExpress.closeTrackingDrawer();
          return;
        }
        closeDrawer();
        document.removeEventListener('keydown', onEsc);
      }
    }
  }

  function initViewLinks() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('.js-order-view');
      if (!link) return;
      e.preventDefault();
      var row = link.closest('tr');
      var orderId = link.getAttribute('data-order-id') || (row && row.getAttribute('data-order-id'));
      if (!orderId) return;
      openDrawer(orderId, row);
    });
  }

  /**
   * 待审批的退款类售后：核销时可二次确认并自动关闭。
   * 已通过审核的状态见 APPROVED_REFUND_STATUSES，禁止核销。
   */
  var OPEN_REFUND_STATUSES = ['待审批'];

  /** 仅退款 / 退货退款已通过审核、仍在履约中的状态（禁止核销） */
  var APPROVED_REFUND_STATUSES = ['退款中', '待退货', '待收货', '退款异常'];

  function isRefundAftersaleType(item) {
    return !!item && (item.type === '仅退款' || item.type === '退货退款');
  }

  function isOpenRefundAftersale(item) {
    return isRefundAftersaleType(item) && OPEN_REFUND_STATUSES.indexOf(item.status) >= 0;
  }

  function isApprovedRefundAftersale(item) {
    return isRefundAftersaleType(item) && APPROVED_REFUND_STATUSES.indexOf(item.status) >= 0;
  }

  function aftersalesHaveApprovedRefund(aftersales) {
    return (Array.isArray(aftersales) ? aftersales : []).some(isApprovedRefundAftersale);
  }

  /** 订单是否存在待审批的退款类售后（仅退款 / 退货退款） */
  function getOpenRefundAftersales(orderId, row) {
    var detail = DETAILS[orderId] || (row ? fallbackDetail(orderId, row) : null);
    if (!detail || !Array.isArray(detail.aftersales)) return [];
    return detail.aftersales.filter(isOpenRefundAftersale);
  }

  function hasOpenRefundAftersale(orderId, row) {
    return getOpenRefundAftersales(orderId, row).length > 0;
  }

  function getApprovedRefundAftersales(orderId, row) {
    var detail = DETAILS[orderId] || (row ? fallbackDetail(orderId, row) : null);
    if (!detail || !Array.isArray(detail.aftersales)) return [];
    return detail.aftersales.filter(isApprovedRefundAftersale);
  }

  function hasApprovedRefundAftersale(orderId, row) {
    return getApprovedRefundAftersales(orderId, row).length > 0;
  }

  /**
   * 核销时自动关闭进行中的退款类售后单
   * 关闭原因：订单核销，自动关闭
   */
  function closeOpenRefundAftersalesOnVerify(orderId) {
    var detail = DETAILS[orderId];
    if (!detail || !Array.isArray(detail.aftersales)) return [];
    var closed = [];
    var now = formatNow();
    detail.aftersales.forEach(function (a) {
      if (!isOpenRefundAftersale(a)) return;
      a.status = '已取消';
      a.closeReason = '订单核销，自动关闭';
      a.closedAt = now;
      closed.push(a);
    });
    if (closed.length && detail.goods) {
      detail.goods = detail.goods.map(function (g) {
        var next = Object.assign({}, g);
        if (next.aftersaleTag === '退款中') delete next.aftersaleTag;
        return next;
      });
    }
    if (closed.length) {
      detail.logs = detail.logs || [];
      detail.logs.unshift({
        time: now,
        type: 'aftersale_close',
        title: '售后单自动关闭',
        desc: '订单核销，自动关闭（共 ' + closed.length + ' 笔退款类售后）'
      });
    }
    return closed;
  }

  function verifyWholeOrder(orderId, options) {
    options = options || {};
    var detail = DETAILS[orderId];
    if (!detail || !detail.progress) return false;
    if (!isPickupOrder(detail.progress.status, detail)) return false;
    if (hasApprovedRefundAftersale(orderId)) {
      return { ok: false, blocked: true, reason: 'approved_refund' };
    }

    var closedAftersales = [];
    if (options.closeOpenRefunds !== false) {
      closedAftersales = closeOpenRefundAftersalesOnVerify(orderId);
    }

    var goods = detail.goods.map(normalizeGood);
    var pickupItems = [];
    goods.forEach(function (g) {
      var remaining = getGoodRemaining(g);
      if (remaining > 0) {
        g.pickedQty = g.qty;
        pickupItems.push({ name: g.name, qty: remaining });
      }
    });
    detail.goods = goods;

    detail.progress = Object.assign({}, detail.progress, {
      status: '已完成',
      outcome: 'success',
      completedSteps: 4,
      finishTime: formatNow()
    });

    if (pickupItems.length) {
      var applied = pickupItems.map(function (item) {
        return {
          good: { name: item.name },
          qty: item.qty
        };
      });
      detail.logs.unshift(buildVerifyLogPayload(applied, {
        title: '整单核销',
        type: 'pickup_whole',
        descPrefix: '整单核销：',
        orderCompleted: true
      }));
    }

    syncDrawerAfterWholeVerify(orderId);
    return { ok: true, closedAftersales: closedAftersales };
  }

  function syncDrawerAfterWholeVerify(orderId) {
    var drawer = document.getElementById('orderDetailDrawer');
    if (!drawer || drawer._orderId !== orderId || !drawer._pickupState) return;

    var detail = DETAILS[orderId];
    if (!detail) return;

    drawer._pickupState.goods = detail.goods.map(normalizeGood);
    drawer._pickupState.logs = detail.logs.slice();
    drawer._pickupState.progress = Object.assign({}, detail.progress);
    refreshPickupDrawer(drawer);
  }

  window.OrderLivePickup = {
    verifyWholeOrder: verifyWholeOrder,
    hasOpenRefundAftersale: hasOpenRefundAftersale,
    getOpenRefundAftersales: getOpenRefundAftersales,
    hasApprovedRefundAftersale: hasApprovedRefundAftersale,
    getApprovedRefundAftersales: getApprovedRefundAftersales,
    closeOpenRefundAftersalesOnVerify: closeOpenRefundAftersalesOnVerify
  };

  function confirmProxyReceipt(orderId) {
    var detail = DETAILS[orderId];
    if (!detail || !detail.progress) return false;
    if (detail.progress.status !== '待收货' && detail.progress.status !== '待提货') return false;

    detail.progress = Object.assign({}, detail.progress, {
      status: '已完成',
      outcome: 'success',
      completedSteps: 4,
      finishTime: formatNow()
    });
    detail.logs.unshift({
      time: formatNow(),
      type: 'success',
      title: '确认收货',
      desc: '商家已确认收货，订单已完成'
    });

    var drawer = document.getElementById('orderDetailDrawer');
    if (drawer && drawer._orderId === orderId) {
      closeDrawer();
      openDrawer(orderId, drawer._sourceRow);
    }
    return true;
  }

  if (isProxyOrderPage()) {
    window.OrderProxyReceipt = {
      confirmOrder: confirmProxyReceipt
    };
  }

  window.OrderLiveDetail = {
    resolveDetail: function (orderId, row) {
      var detail = DETAILS[orderId] || fallbackDetail(orderId, row);
      if (row && !isProxyOrderPage()) {
        var modeLabel = readDeliveryModeFromRow(row);
        detail.delivery = detail.delivery || {};
        detail.delivery.deliveryMode = modeLabel;
        if (modeLabel === '快递') {
          detail.delivery.type = 'EXPRESS';
          if (detail.delivery.homeAddress) {
            detail.delivery.address = detail.delivery.homeAddress;
          }
        } else if (modeLabel === '自提') {
          detail.delivery.type = 'SELF_PICKUP';
        }
      }
      detail.progress = resolveProgress(detail.progress, row);
      if (usesExpressProgress(detail, row)) {
        detail.progress = normalizeProxyProgress(detail.progress);
      }
      return detail;
    },
    openDrawer: openDrawer
  };

  function openFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var orderId = params.get('orderId');
      if (!orderId) return;
      var row = document.querySelector('tr[data-order-id="' + orderId.replace(/"/g, '') + '"]');
      if (!row) {
        document.querySelectorAll('tr[data-order-id]').forEach(function (tr) {
          if (row) return;
          var id = tr.getAttribute('data-order-id') || '';
          if (id === orderId || id.indexOf(orderId) === 0 || orderId.indexOf(id) === 0) row = tr;
        });
      }
      setTimeout(function () {
        openDrawer(orderId, row || null);
      }, 80);
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initViewLinks();
      openFromQuery();
    });
  } else {
    initViewLinks();
    openFromQuery();
  }
})();
