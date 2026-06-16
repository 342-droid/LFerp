(function () {
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
        marketing: '普通售卖'
      }],
      amounts: {
        goods: '¥1.20',
        discount: '-¥1.19',
        shipping: '¥0.00',
        payable: '¥0.01',
        paid: '¥0.01',
        merchant: '¥0.00',
        refund: '¥0.00'
      },
      paymentCount: 1,
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
        status: '运输中',
        submitTime: '2026-06-05 20:46'
      },
      goods: [{
        name: '微辣萝卜干 500g 4号…',
        spec: '规格：500g',
        img: '../user-app/assets/order-product-2.svg',
        spu: 'SPU-2101…',
        sku: 'SKU-2101…',
        weight: '0.50',
        price: '¥0.90',
        qty: '1',
        subtotal: '¥0.90',
        marketing: '普通售卖'
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
        type: 'SELF_PICKUP',
        name: '刘十九',
        phone: '13800001987',
        address: '浙江省杭州市西湖区文三路168号',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        payChannel: '-',
        marketing: '普通售卖',
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
        completedSteps: 3,
        outcome: null,
        status: '待提货',
        submitTime: '2026-06-04 14:20'
      },
      goods: [{
        name: '冷丰优选3J智利车厘子 3斤装',
        spec: '规格：3斤',
        img: '../user-app/assets/order-detail-cherry.svg',
        spu: 'SPU-1001…',
        sku: 'SKU-1001…',
        weight: '1.50',
        price: '¥128.18',
        qty: '1',
        subtotal: '¥128.18',
        marketing: '普通售卖'
      }],
      amounts: {
        goods: '¥128.18',
        discount: '-¥10.00',
        shipping: '¥0.00',
        payable: '¥118.18',
        paid: '¥118.18',
        merchant: '¥118.18',
        refund: '¥0.00'
      },
      paymentCount: 1,
      customer: { nickname: '宁静致远', phone: '155****9061', userId: '318605592681791501' },
      delivery: {
        type: 'SELF_PICKUP',
        name: '宁静致远',
        phone: '155****9061',
        address: '浙江省杭州市上城区望江街道望江路16号',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        payChannel: '-',
        marketing: '普通售卖',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-04 14:20', title: '订单已创建', desc: '订单创建，金额 ¥118.18' },
        { time: '2026-06-05 09:30', title: '商品已到提货点', desc: '请尽快前往门店提货' }
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
        marketing: '普通售卖'
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
        payChannel: '-',
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
        completedSteps: 3,
        outcome: null,
        status: '待提货',
        submitTime: '2026-06-03 16:48'
      },
      goods: [{
        id: 'g1',
        name: '新鲜红颜草莓 香甜多汁 500g装',
        spec: '规格：500g',
        img: '../user-app/assets/order-product-1.svg',
        spu: 'SPU-1003…',
        sku: 'SKU-1003…',
        weight: '0.50',
        price: '¥19.59',
        qty: '2',
        pickedQty: 0,
        subtotal: '¥39.18',
        marketing: '普通售卖'
      }, {
        id: 'g2',
        name: '进口香蕉 香甜软糯 3斤装',
        spec: '规格：3斤',
        img: '../user-app/assets/order-detail-orange.svg',
        spu: 'SPU-1004…',
        sku: 'SKU-1004…',
        weight: '1.50',
        price: '¥12.00',
        qty: '1',
        pickedQty: 0,
        subtotal: '¥12.00',
        marketing: '普通售卖'
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
      customer: { nickname: '赵金芝', phone: '18715449646', userId: '318605592681791502' },
      delivery: {
        type: 'SELF_PICKUP',
        name: '杜建锋',
        phone: '18715449646',
        address: '萧山区经济开发区鸿兴路158号',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        payChannel: '-',
        marketing: '普通售卖',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-03 16:48', title: '订单已创建', desc: '订单创建，金额 ¥46.18' },
        { time: '2026-06-04 10:00', title: '商品已到提货点', desc: '请尽快前往门店提货' }
      ],
      clearingEmpty: true
    },
    'ORD-3212689201560682': {
      displayId: 'ORD-3212689201560682',
      progress: {
        completedSteps: 4,
        outcome: 'success',
        status: '已完成',
        submitTime: '2026-06-02 18:03',
        finishTime: '2026-06-03 11:20'
      },
      goods: [{
        name: '精品牛腩 500g',
        spec: '规格：500g',
        img: '../user-app/assets/order-product-2.svg',
        spu: 'SPU-3301…',
        sku: 'SKU-3301…',
        weight: '0.50',
        price: '¥18.00',
        qty: '1',
        subtotal: '¥18.00',
        marketing: '普通售卖'
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
      customer: { nickname: '赵金芝', phone: '13800001234', userId: '318605592681791499' },
      delivery: {
        type: 'SELF_PICKUP',
        name: '李四',
        phone: '13800001234',
        address: '浙江省杭州市上城区望江街道望江路16号',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        payChannel: '-',
        marketing: '普通售卖',
        livePeriod: '-',
        bd: '1',
        settleStatus: '-',
        commissionStatus: '-'
      },
      logs: [
        { time: '2026-06-02 18:03', type: 'create', title: '订单已创建', desc: '订单创建，金额 ¥15.00' },
        { time: '2026-06-03 09:00', type: 'arrival', title: '商品已到提货点', desc: '请尽快前往门店提货' },
        {
          time: '2026-06-03 11:18',
          type: 'pickup',
          title: '商品提货',
          desc: '精品牛腩 500g 提货 1 件（累计已提 1/1）',
          pickup: {
            productName: '精品牛腩 500g',
            sku: 'SKU-3301…',
            spu: 'SPU-3301…',
            qty: 1,
            pickedQty: 1,
            totalQty: 1,
            operator: '门店核销员'
          }
        },
        { time: '2026-06-03 11:20', type: 'success', title: '交易成功', desc: '全部商品核销完成，订单已完成' }
      ],
      clearingEmpty: true
    }
  };

  var MID_STEPS = ['提交订单', '运输中', '待收货', '待提货'];

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

    MID_STEPS.forEach(function (label, index) {
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
    var finalIcon = el('div', 'order-detail-step__icon', '5');
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

  function isPickupOrder(status) {
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
              '<span class="order-detail-timeline__pickup-label">条码</span>' +
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

  function buildGoodsProductCell(item) {
    return '<td><div class="order-detail-goods-product">' +
      '<img src="' + item.img + '" alt="">' +
      '<div><div class="order-detail-goods-product__name">' + item.name + '</div>' +
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

  function buildGoodsTableBody(goods, pickupMode) {
    var tbody = el('tbody');
    goods.forEach(function (item) {
      var remaining = getGoodRemaining(item);
      var tr = document.createElement('tr');
      tr.setAttribute('data-good-id', item.id);
      if (remaining === 0) tr.classList.add('is-picked');

      var selectCell = '';
      var pickupCells = '';
      if (pickupMode) {
        var canPick = remaining > 0;
        var checkbox = canPick
          ? '<input type="checkbox" class="js-pickup-row-check" data-good-id="' + item.id + '">'
          : '';
        var qtyCtrl = canPick
          ? buildPickupQtyControl(item.id, remaining)
          : '—';
        var action = canPick
          ? '<button type="button" class="order-pickup-line-btn js-pickup-line-confirm" data-good-id="' + item.id + '">核销</button>'
          : '<span style="color:#c0c4cc">—</span>';
        selectCell = '<td class="order-pickup-check-cell">' + checkbox + '</td>';
        pickupCells =
          '<td>' + item.pickedQty + '</td>' +
          '<td>' + remaining + '</td>' +
          '<td><div class="order-pickup-cell">' + qtyCtrl + action + '</div></td>';
      }

      tr.innerHTML =
        selectCell +
        buildGoodsProductCell(item) +
        '<td>' + item.spu + '</td>' +
        '<td>' + item.sku + '</td>' +
        '<td>' + item.weight + '</td>' +
        '<td>' + item.price + '</td>' +
        '<td>' + item.qty + '</td>' +
        '<td>' + item.subtotal + '</td>' +
        '<td><span class="order-tag order-tag--sale">' + item.marketing + '</span></td>' +
        pickupCells;
      tbody.appendChild(tr);
    });
    return tbody;
  }

  function buildPickupToolbar() {
    var toolbar = el('div', 'order-pickup-toolbar');
    toolbar.innerHTML =
      '<label class="order-pickup-toolbar__select">' +
        '<input type="checkbox" class="js-pickup-select-all"> 全选待提商品' +
      '</label>' +
      '<span class="order-pickup-toolbar__summary">已选 <em class="js-pickup-selected-count">0</em> 种商品</span>' +
      '<div class="order-pickup-toolbar__actions">' +
        '<button type="button" class="order-detail-btn order-detail-btn--primary js-pickup-batch">批量核销</button>' +
      '</div>';
    return toolbar;
  }

  function buildGoodsTableHeadRow(pickupMode) {
    var headCols = '<th>商品</th><th>编码</th><th>条码</th><th>重量(kg)</th><th>单价</th><th>数量</th><th>小计</th><th>营销</th>';
    if (pickupMode) {
      headCols = '<th class="order-pickup-check-head">选择</th>' + headCols + '<th>已提</th><th>待提</th><th>操作</th>';
    }
    return '<tr>' + headCols + '</tr>';
  }

  function buildGoodsPanel(goods, pickupMode) {
    var wrap = el('div', 'order-detail-goods-panel');
    if (pickupMode) wrap.appendChild(buildPickupToolbar());

    var table = el('table', 'order-detail-goods-table');
    table.innerHTML = '<thead>' + buildGoodsTableHeadRow(pickupMode) + '</thead>';
    table.appendChild(buildGoodsTableBody(goods, pickupMode));
    wrap.appendChild(table);
    return wrap;
  }

  function buildGoodsTable(goods) {
    return buildGoodsPanel(goods, false);
  }

  function getRowPickupQty(tr) {
    var input = tr.querySelector('.js-pickup-qty-input');
    if (!input) return 1;
    var remaining = parseInt(input.getAttribute('max'), 10) || 1;
    var val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) val = remaining;
    return Math.min(val, remaining);
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

    refreshPickupDrawer(drawer);
    if (typeof showToast === 'function') {
      var msg = progress.outcome === 'success' ? '全部商品已核销，订单已完成' : '核销成功';
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
    var pickupMode = isPickupOrder(status);

    refs.statusTag.textContent = status;
    refs.statusTag.className = 'order-detail-status ' + getProgressStatusClass(status);

    var newSteps = buildSteps({ progress: state.progress });
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

    var newBody = buildGoodsTableBody(state.goods, pickupMode);
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
        performPickup(drawer, [{ id: goodId, qty: getRowPickupQty(tr) }]);
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
        performPickup(drawer, pickups, { batch: true });
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
        dl.appendChild(el('dd', '', '<span class="order-tag order-tag--sale">' + value + '</span>'));
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
    var pickupMode = state && isPickupOrder(progress.status);

    var main = el('div', 'order-detail-main');

    var progressCard = el('div', 'order-detail-card');
    var progressHead = el('div', 'order-detail-progress-head');
    progressHead.appendChild(el('h3', 'order-detail-card__title', '订单进度'));
    var statusTag = buildProgressStatusTag(progress.status || '运输中');
    progressHead.appendChild(statusTag);
    progressCard.appendChild(progressHead);
    var stepsEl = buildSteps({ progress: progress });
    progressCard.appendChild(stepsEl);
    main.appendChild(progressCard);

    var docCard = el('div', 'order-detail-card');
    docCard.appendChild(el('h3', 'order-detail-card__title', '单据明细'));
    var tabs = el('div', 'order-detail-doc-tabs');
    var tabDefs = [
      { id: 'goods', label: '商品明细' },
      { id: 'payment', label: '收款明细 (' + detail.paymentCount + ')' },
      { id: 'discount', label: '折扣明细' },
      { id: 'refund', label: '退款明细' }
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
        var goodsPanel = buildGoodsPanel(goods, pickupMode);
        panel.appendChild(goodsPanel);
        panel.appendChild(buildAmounts(detail.amounts));
        if (drawer && pickupMode) {
          drawer._pickupRefs = drawer._pickupRefs || {};
          drawer._pickupRefs.goodsPanel = goodsPanel;
          drawer._pickupRefs.goodsTable = goodsPanel.querySelector('.order-detail-goods-table');
          drawer._pickupRefs.pickupToolbar = goodsPanel.querySelector('.order-pickup-toolbar');
          drawer._pickupRefs.statusTag = statusTag;
          drawer._pickupRefs.stepsContainer = stepsEl;
        }
      } else if (tab.id === 'payment') {
        panel.appendChild(buildEmptyState('暂无收款明细'));
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

    var deliveryCard = el('div', 'order-detail-card');
    deliveryCard.appendChild(el('h3', 'order-detail-card__title', '收货 / 自提信息'));
    deliveryCard.appendChild(buildKv({
      '配送': detail.delivery.type,
      '收货人': detail.delivery.name,
      '电话': detail.delivery.phone,
      '地址': detail.delivery.address,
      '门店': detail.delivery.store
    }));
    aside.appendChild(deliveryCard);

    var tagCard = el('div', 'order-detail-card');
    tagCard.appendChild(el('h3', 'order-detail-card__title', '订单标记'));
    tagCard.appendChild(buildKv({
      '渠道': detail.tags.channel,
      '支付渠道': detail.tags.payChannel,
      '营销类型': detail.tags.marketing,
      '直播时段': detail.tags.livePeriod,
      'BD': detail.tags.bd,
      '结算状态': detail.tags.settleStatus,
      '分佣状态': detail.tags.commissionStatus
    }));
    aside.appendChild(tagCard);

    layout.appendChild(main);
    layout.appendChild(aside);
    return layout;
  }

  function fallbackDetail(orderId, row) {
    var productImg = row ? row.querySelector('.order-product-cell__thumb') : null;
    var productName = row ? row.querySelector('.order-product-cell__name') : null;
    var cells = row ? row.querySelectorAll('td') : [];
    var progress = inferProgressFromRow(row);
    var statusText = progress.status;
    var logs = [
      {
        time: progress.submitTime || '',
        title: '订单已创建',
        desc: '订单创建，金额 ' + (cells[13] ? cells[13].textContent.trim() : '')
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
        desc: '全部商品核销完成，订单已完成'
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
        price: cells[8] ? cells[8].textContent.trim() : '¥0.00',
        qty: '1',
        subtotal: cells[8] ? cells[8].textContent.trim() : '¥0.00',
        marketing: '普通售卖'
      }],
      amounts: {
        goods: cells[8] ? cells[8].textContent.trim() : '¥0.00',
        discount: cells[9] ? cells[9].textContent.trim() : '¥0.00',
        shipping: '¥0.00',
        payable: cells[13] ? cells[13].textContent.trim() : '¥0.00',
        paid: cells[13] ? cells[13].textContent.trim() : '¥0.00',
        merchant: cells[13] ? cells[13].textContent.trim() : '¥0.00',
        refund: '¥0.00'
      },
      paymentCount: 1,
      customer: {
        nickname: cells[2] ? cells[2].textContent.trim() : '-',
        phone: cells[4] ? cells[4].textContent.trim() : '-',
        userId: '318605592681791488'
      },
      delivery: {
        type: 'SELF_PICKUP',
        name: cells[3] ? cells[3].textContent.trim() : '-',
        phone: cells[4] ? cells[4].textContent.trim() : '-',
        address: '浙江省杭州市上城区望江街道望江路16号',
        store: '悠悠生鲜超市'
      },
      tags: {
        channel: 'MINI_PROGRAM',
        payChannel: cells[14] ? cells[14].textContent.trim() : '-',
        marketing: '普通售卖',
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
    detail.progress = resolveProgress(detail.progress, row);

    var backdrop = el('div', 'store-drawer-backdrop');
    backdrop.id = 'orderDetailBackdrop';
    backdrop.addEventListener('click', closeDrawer);

    var drawer = el('aside', 'store-drawer store-drawer--interactive order-detail-drawer');
    drawer.id = 'orderDetailDrawer';
    drawer._orderId = orderId;

    var header = el('div', 'store-drawer__header');
    header.appendChild(el('h2', 'store-drawer__title', '订单详情 · ' + detail.displayId));
    var closeBtn = el('button', 'store-drawer__close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', closeDrawer);
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    if (isPickupOrder(detail.progress.status)) {
      drawer._pickupState = {
        goods: detail.goods.map(normalizeGood),
        logs: detail.logs.slice(),
        progress: Object.assign({}, detail.progress)
      };
    }

    var body = el('div', 'store-drawer__body');
    body.appendChild(buildDrawerContent(detail, drawer));
    drawer.appendChild(body);

    if (drawer._pickupState && isPickupOrder(drawer._pickupState.progress.status)) {
      bindPickupEvents(drawer);
    }

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', onEsc);
    function onEsc(e) {
      if (e.key === 'Escape') {
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

  function verifyWholeOrder(orderId) {
    var detail = DETAILS[orderId];
    if (!detail || !detail.progress) return false;
    if (!isPickupOrder(detail.progress.status)) return false;

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
    return true;
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
    verifyWholeOrder: verifyWholeOrder
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewLinks);
  } else {
    initViewLinks();
  }
})();
