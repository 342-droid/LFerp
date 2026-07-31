(function (global) {
  var DEMO_ITEMS = [
    {
      id: 'item-1',
      name: '冷丰优选智利车厘子 鲜脆清甜 礼盒装',
      spec: '规格：2.5kg',
      img: '../assets/order-product-1.svg',
      priceNum: 43.95,
      paidAmount: 87.9,
      qty: 2,
      freight: 0,
      shippingFee: 0,
      orderSpecId: 'cherry-25',
      specs: [
        { id: 'cherry-125', label: '1.25kg', priceNum: 43.95, available: true },
        { id: 'cherry-25', label: '2.5kg', priceNum: 43.95, available: true },
        { id: 'cherry-50', label: '5kg', priceNum: 79.9, available: true }
      ]
    },
    {
      id: 'item-2',
      name: '新鲜红颜草莓 香甜多汁 500g装',
      spec: '规格：500g；颜色：红色',
      img: '../assets/order-product-2.svg',
      priceNum: 10,
      paidAmount: 10,
      qty: 1,
      freight: 0,
      shippingFee: 0,
      orderSpecId: 'berry-500',
      specs: [
        { id: 'berry-500', label: '500g', priceNum: 10, available: true },
        { id: 'berry-250', label: '250g', priceNum: 10, available: true },
        { id: 'berry-1kg', label: '1kg', priceNum: 18, available: true }
      ]
    },
    {
      id: 'item-3',
      name: '海南贵妃芒 香甜软糯 礼盒装',
      spec: '规格：2.5kg',
      img: '../assets/order-product-3.svg',
      priceNum: 39.9,
      paidAmount: 39.9,
      qty: 1,
      freight: 0,
      shippingFee: 0,
      orderSpecId: 'mango-25',
      specs: [
        { id: 'mango-125', label: '1.25kg', priceNum: 22.9, available: true },
        { id: 'mango-25', label: '2.5kg', priceNum: 39.9, available: true },
        { id: 'mango-50', label: '5kg', priceNum: 69.9, available: true }
      ]
    }
  ];

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
    exchange: ['规格/颜色拍错', '大小/尺寸/重量与商品描述不符', '质量问题', '卖家发错货', '商品信息描述不符']
  };

  var GOODS_STATUS = ['未收到货', '已收到货'];

  var STORAGE_KEY = 'ua_refund_application';
  var AFTERSALE_RECORDS_KEY = 'ua_aftersale_records_v4';
  var DEMO_ORDER_NO = '1089765423471123';

  var AFTERSALE_TYPE_LABEL = {
    refund_only: '退款',
    pre_ship: '退款',
    return: '退货',
    restock: '补货',
    exchange: '换货'
  };

  function getAftersaleTypeGroup(type) {
    if (type === 'restock') return 'restock';
    if (type === 'exchange') return 'exchange';
    return 'refund'; /* refund_only / return / pre_ship */
  }

  function isAftersaleFinished(rec) {
    if (!rec) return true;
    var stage = rec.stage || '';
    return stage === 'success' || stage === 'closed' || stage === 'failed';
  }

  function loadAftersaleRecords() {
    try {
      var raw = sessionStorage.getItem(AFTERSALE_RECORDS_KEY);
      var list = raw ? JSON.parse(raw) : null;
      if (Array.isArray(list) && list.length) return list;
    } catch (e) {
      /* ignore */
    }
    return seedDemoAftersaleRecords();
  }

  function saveAftersaleRecords(list) {
    try {
      sessionStorage.setItem(AFTERSALE_RECORDS_KEY, JSON.stringify(list || []));
    } catch (e) {
      /* ignore */
    }
  }

  function seedDemoAftersaleRecords() {
    var item0 = DEMO_ITEMS[0];
    var item1 = DEMO_ITEMS[1];
    var list = [
      /* 商品0：多次售后（不同类型/状态）—— 关闭后再发起并退款成功 + 补货中，关闭不展示 */
      {
        id: 'as-demo-refund-closed-0',
        orderNo: DEMO_ORDER_NO,
        itemIndex: 0,
        type: 'refund_only',
        stage: 'closed',
        closeReason: 'cancel',
        amount: 28.4,
        reason: '不想要了',
        productName: item0.name,
        productSpec: item0.spec,
        productImg: item0.img,
        shopName: '江南果蔬批发',
        applyTime: '2026-07-17 09:20:00',
        resultTime: '2026-07-17 20:00:00'
      },
      {
        id: 'as-demo-refund-0',
        orderNo: DEMO_ORDER_NO,
        itemIndex: 0,
        type: 'refund_only',
        stage: 'success',
        /* 演示：商品0整单退款成功，自提剩余可提数量为 0，无需核销 */
        qty: item0.qty,
        amount: 28.4,
        reason: '收到商品破损/污渍等',
        productName: item0.name,
        productSpec: item0.spec,
        productImg: item0.img,
        shopName: '江南果蔬批发',
        applyTime: '2026-07-18 10:20:00',
        resultTime: '2026-07-18 18:30:00'
      },
      {
        id: 'as-demo-restock-0',
        orderNo: DEMO_ORDER_NO,
        itemIndex: 0,
        type: 'restock',
        stage: 'reship',
        amount: 0,
        reason: '包裹少件/漏发',
        productName: item0.name,
        productSpec: item0.spec,
        productImg: item0.img,
        shopName: '江南果蔬批发',
        applyTime: '2026-07-18 11:05:00'
      },
      /* 商品1：仅一笔售后（已关闭）—— 显示退款关闭，点击直达详情 */
      {
        id: 'as-demo-closed-1',
        orderNo: DEMO_ORDER_NO,
        itemIndex: 1,
        type: 'return',
        stage: 'closed',
        closeReason: 'cancel',
        amount: 10,
        reason: '不喜欢/不想要',
        productName: item1.name,
        productSpec: item1.spec,
        productImg: item1.img,
        shopName: '江南果蔬批发',
        applyTime: '2026-07-17 16:40:00',
        resultTime: '2026-07-17 16:45:00'
      }
      /* 商品2：无售后 —— 可正常点「申请退款」发起 */
    ];
    saveAftersaleRecords(list);
    return list;
  }

  function upsertAftersaleRecord(rec) {
    if (!rec || !rec.id) return;
    var list = loadAftersaleRecords();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === rec.id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) list[idx] = Object.assign({}, list[idx], rec);
    else list.unshift(rec);
    saveAftersaleRecords(list);
    return list;
  }

  function getAftersaleRecordsByItem(itemIndex, orderNo) {
    var list = loadAftersaleRecords();
    var idx = Number(itemIndex);
    return list.filter(function (r) {
      if (Number(r.itemIndex) !== idx) return false;
      if (orderNo && r.orderNo && r.orderNo !== orderNo) return false;
      return true;
    });
  }

  function sortAftersaleByTimeDesc(list) {
    return (list || []).slice().sort(function (a, b) {
      return String(b.applyTime || b.resultTime || '').localeCompare(
        String(a.applyTime || a.resultTime || '')
      );
    });
  }

  /**
   * 订单详情商品下售后进度条展示规则：
   * - 有进行中：只显示进行中（同组关闭的不显示）
   * - 无进行中、有多笔退款成功：合并为一条
   * - 无进行中、仅关闭：显示最新一条关闭
   * - 不同售后类型（退款/补货/换货）可同时各展示一条（组）
   */
  function getAftersaleDisplayBars(itemIndex, orderNo) {
    var records = sortAftersaleByTimeDesc(getAftersaleRecordsByItem(itemIndex, orderNo));
    var bars = [];
    ['refund', 'restock', 'exchange'].forEach(function (group) {
      var groupRecs = records.filter(function (r) {
        return getAftersaleTypeGroup(r.type) === group;
      });
      if (!groupRecs.length) return;

      var openOnes = groupRecs.filter(function (r) {
        return !isAftersaleFinished(r);
      });
      var successOnes = groupRecs.filter(function (r) {
        return r.stage === 'success';
      });
      var closedOnes = groupRecs.filter(function (r) {
        return r.stage === 'closed' || r.stage === 'failed';
      });

      if (openOnes.length) {
        /* 有进行中：默认显示最新一次进行中，关闭不展示 */
        bars.push({
          kind: 'single',
          group: group,
          record: openOnes[0],
          records: [openOnes[0]]
        });
        return;
      }

      if (successOnes.length) {
        if (group === 'refund' && successOnes.length > 1) {
          bars.push({
            kind: 'merged_refund_success',
            group: group,
            record: successOnes[0],
            records: successOnes,
            amount: getMergedRefundAmount(successOnes)
          });
        } else {
          bars.push({
            kind: 'single',
            group: group,
            record: successOnes[0],
            records: [successOnes[0]]
          });
        }
        return;
      }

      if (closedOnes.length) {
        /* 仅发起过且已关闭：展示关闭 */
        bars.push({
          kind: 'single',
          group: group,
          record: closedOnes[0],
          records: [closedOnes[0]]
        });
      }
    });
    return bars;
  }

  function hasOpenAftersaleOfGroup(itemIndex, typeOrGroup) {
    var group =
      typeOrGroup === 'refund' || typeOrGroup === 'restock' || typeOrGroup === 'exchange'
        ? typeOrGroup
        : getAftersaleTypeGroup(typeOrGroup);
    return getAftersaleRecordsByItem(itemIndex).some(function (r) {
      return getAftersaleTypeGroup(r.type) === group && !isAftersaleFinished(r);
    });
  }

  function getMergedRefundAmount(records) {
    return (records || [])
      .filter(function (r) {
        return getAftersaleTypeGroup(r.type) === 'refund' && r.stage === 'success';
      })
      .reduce(function (sum, r) {
        return sum + (Number(r.amount) || 0);
      }, 0);
  }

  var PICKED_QTY_KEY = 'ua_item_picked_qty_v1';

  function isRefundPoolType(type) {
    return type === 'refund_only' || type === 'pre_ship' || type === 'return';
  }

  function getPurchaseQty(itemIndex) {
    var item = DEMO_ITEMS[itemIndex] || DEMO_ITEMS[0];
    return Number((item && item.qty) || 1) || 1;
  }

  /** 单条售后占用件数；成功单缺省 qty 时回退为购买数（兼容旧演示数据） */
  function getRecordOccupyQty(rec, purchaseQty) {
    if (!rec) return 0;
    var q = Number(rec.qty);
    if ((isNaN(q) || q <= 0) && rec.type === 'restock') {
      q = Number(rec.applyQty);
    }
    if (isNaN(q) || q <= 0) {
      if (rec.stage === 'success') return Number(purchaseQty) || 0;
      return 0;
    }
    return q;
  }

  function saveItemPickedQtyMap(map) {
    try {
      sessionStorage.setItem(PICKED_QTY_KEY, JSON.stringify(map || {}));
    } catch (e) {
      /* ignore */
    }
  }

  function getItemPickedQty(itemIndex) {
    try {
      var raw = sessionStorage.getItem(PICKED_QTY_KEY);
      if (!raw) return null;
      var map = JSON.parse(raw);
      if (!map || typeof map !== 'object') return null;
      var v = map[String(itemIndex)];
      if (v == null || v === '') return null;
      var n = Number(v);
      return isNaN(n) ? null : n;
    } catch (e) {
      return null;
    }
  }

  /**
   * 售后数量池
   * 1) 可退池（仅退款/退货退款）：购买数 − 已退成功 − 进行中退款类占用；与补货无关
   * 2) 补货池：购买数 − 已售后累计(进行中+已完成的退款/退货/补货/换货)；退款会扣补货上限，补货不扣可退
   */
  function getRefundSuccessQty(itemIndex, orderNo, excludeId) {
    var purchaseQty = getPurchaseQty(itemIndex);
    return getAftersaleRecordsByItem(itemIndex, orderNo).reduce(function (sum, r) {
      if (excludeId && r.id === excludeId) return sum;
      if (!isRefundPoolType(r.type) || r.stage !== 'success') return sum;
      return sum + getRecordOccupyQty(r, purchaseQty);
    }, 0);
  }

  function getRefundOpenQty(itemIndex, orderNo, excludeId) {
    var purchaseQty = getPurchaseQty(itemIndex);
    return getAftersaleRecordsByItem(itemIndex, orderNo).reduce(function (sum, r) {
      if (excludeId && r.id === excludeId) return sum;
      if (!isRefundPoolType(r.type) || isAftersaleFinished(r)) return sum;
      return sum + getRecordOccupyQty(r, purchaseQty);
    }, 0);
  }

  /** 可退上限；退货退款可再卡 ≤ pickedQty（已核销/已提货） */
  function getRefundableMaxQty(itemIndex, orderNo, opts) {
    opts = opts || {};
    var purchaseQty = getPurchaseQty(itemIndex);
    var max = Math.max(
      0,
      purchaseQty -
        getRefundSuccessQty(itemIndex, orderNo, opts.excludeId) -
        getRefundOpenQty(itemIndex, orderNo, opts.excludeId)
    );
    if (opts.forReturn) {
      var picked =
        opts.pickedQty != null ? Number(opts.pickedQty) : getItemPickedQty(itemIndex);
      if (picked != null && !isNaN(picked)) {
        max = Math.min(max, Math.max(0, picked));
      }
    }
    return max;
  }

  /** 已售后累计占用（进行中+已完成；关闭/失败不计）——用于补货上限 */
  function getAftersaleOccupiedQty(itemIndex, orderNo, excludeId) {
    var purchaseQty = getPurchaseQty(itemIndex);
    return getAftersaleRecordsByItem(itemIndex, orderNo).reduce(function (sum, r) {
      if (excludeId && r.id === excludeId) return sum;
      if (r.stage === 'closed' || r.stage === 'failed') return sum;
      var group = getAftersaleTypeGroup(r.type);
      if (group !== 'refund' && group !== 'restock' && group !== 'exchange') return sum;
      if (r.stage !== 'success' && isAftersaleFinished(r)) return sum;
      return sum + getRecordOccupyQty(r, purchaseQty);
    }, 0);
  }

  function getRestockMaxQty(itemIndex, orderNo, opts) {
    opts = opts || {};
    var purchaseQty = getPurchaseQty(itemIndex);
    return Math.max(
      0,
      purchaseQty - getAftersaleOccupiedQty(itemIndex, orderNo, opts.excludeId)
    );
  }

  /** 可退与可补都耗尽时，C 端申请售后入口隐藏 */
  function canShowAftersaleEntry(itemIndex, orderNo) {
    return (
      getRefundableMaxQty(itemIndex, orderNo) > 0 || getRestockMaxQty(itemIndex, orderNo) > 0
    );
  }

  /**
   * 已成功退款/退货占用数量（不含补货/换货；关闭/失败不计）
   * 用于自提订单：剩余可提数量 = 下单数量 - 已提 - 本函数结果
   */
  function getItemRefundedPickupQty(itemIndex, orderNo) {
    return getRefundSuccessQty(itemIndex, orderNo);
  }

  /** 自提/待收剩余履约数量 = 下单 - 已提(已收) - 已成功退款/退货 */
  function getItemRemainingPickupQty(itemIndex, orderQty, pickedQty, orderNo) {
    var order = Number(orderQty);
    if (isNaN(order) || order < 0) {
      order = Number((DEMO_ITEMS[itemIndex] && DEMO_ITEMS[itemIndex].qty) || 1) || 1;
    }
    var picked = Number(pickedQty) || 0;
    var refunded = getItemRefundedPickupQty(itemIndex, orderNo);
    return Math.max(0, order - picked - refunded);
  }

  /**
   * 零售订单履约状态（无「无需自提」）：
   * - 全部商品已退货退款/仅退款成功 → closed（已取消）
   * - 仍有待自提 → pickup；仍有快递待收货 → receipt
   * - 退款后剩余均已自提/已收货 → completed（已完成）
   * mode: 'pickup' | 'express'
   * items: [{ itemIndex, orderQty, pickedQty }]
   */
  function resolveRetailOrderFulfillmentStatus(items, orderNo, mode) {
    var list = items || [];
    var awaitKey = mode === 'express' ? 'receipt' : 'pickup';
    if (!list.length) return awaitKey;

    var hasAwait = false;
    var allFullyRefunded = true;

    list.forEach(function (it) {
      var orderQty = Number(it.orderQty);
      if (isNaN(orderQty) || orderQty < 0) orderQty = 1;
      var pickedQty = Number(it.pickedQty) || 0;
      var refunded = Math.min(
        getItemRefundedPickupQty(it.itemIndex, orderNo),
        orderQty
      );
      if (refunded < orderQty) allFullyRefunded = false;
      if (getItemRemainingPickupQty(it.itemIndex, orderQty, pickedQty, orderNo) > 0) {
        hasAwait = true;
      }
    });

    if (allFullyRefunded) return 'closed';
    if (hasAwait) return awaitKey;
    return 'completed';
  }

  function getAftersaleProgressView(rec) {
    var type = rec.type || 'refund_only';
    var stage = rec.stage || 'audit';
    var typeLabel = AFTERSALE_TYPE_LABEL[type] || '售后';
    var finished = isAftersaleFinished(rec);
    var view = {
      id: rec.id,
      type: type,
      stage: stage,
      icon: 'progress',
      title: typeLabel + '中',
      desc: '',
      amountText: '',
      showAmount: false
    };

    if (type === 'restock') {
      if (stage === 'success') {
        view.icon = 'success';
        view.title = '补货完成';
        view.desc = '补货已完成';
      } else if (stage === 'closed' || stage === 'failed') {
        view.icon = 'closed';
        view.title = '补货关闭';
        view.desc =
          rec.closeReason === 'cancel' ? '因您撤销，补货关闭' : '补货已关闭';
      } else {
        view.title = '补货中';
        if (stage === 'reship' && isWarehouseDelivery(rec.delivery)) {
          view.desc = rec.outShipped ? '仓库配送到店，待确认收货' : '供应商补发至仓库';
        } else if (stage === 'reship' && isPickupDelivery(rec.delivery)) {
          view.desc = rec.restockAwaitPickup
            ? '待自提'
            : rec.outShipped
              ? '补货到店中'
              : '补货处理中';
        } else {
          view.desc = stage === 'reship' ? '补货寄出中' : '请等待平台处理';
        }
      }
      return view;
    }

    if (type === 'exchange') {
      if (stage === 'success') {
        view.icon = 'success';
        view.title = '换货完成';
        view.desc = '换货已完成';
      } else if (stage === 'closed' || stage === 'failed') {
        view.icon = 'closed';
        view.title = '换货关闭';
        view.desc =
          rec.closeReason === 'cancel' ? '因您撤销，换货关闭' : '换货已关闭';
      } else {
        view.title = '换货中';
        view.desc = '请等待平台处理';
      }
      return view;
    }

    /* 退款 / 退货退款 */
    if (stage === 'success') {
      view.icon = 'success';
      view.title = '退款成功';
      view.showAmount = true;
      view.amountText = '¥' + Number(rec.amount || 0).toFixed(2);
      view.desc = '金额';
    } else if (stage === 'closed' || stage === 'failed') {
      view.icon = 'closed';
      view.title = '退款关闭';
      if (rec.closeReason === 'cancel' || rec.closeReason === 'close_return') {
        view.desc = '因您撤销，退款关闭';
      } else if (rec.closeReason === 'reject_receive') {
        view.desc = '因退货商品不符，退款关闭';
      } else if (rec.closeReason === 'timeout') {
        view.desc = '因超时未处理，退款关闭';
      } else {
        view.desc = '退款已关闭';
      }
    } else {
      view.icon = 'progress';
      view.title = '退款中';
      if (type === 'return' && isWarehouseDelivery(rec.delivery)) {
        if (stage === 'return') view.desc = '待取货';
        else if (stage === 'refund') {
          view.desc = rec.warehouseInbound ? '平台退款中' : '待入库';
        } else view.desc = '退货退款处理中';
      } else if (type === 'return' && isPickupDelivery(rec.delivery)) {
        if (stage === 'return') view.desc = '请退回门店';
        else if (stage === 'refund') view.desc = '门店已收货，退款中';
        else view.desc = '退货退款处理中';
      } else if (type === 'restock' && isPickupDelivery(rec.delivery)) {
        if (stage === 'reship') {
          view.desc = rec.restockAwaitPickup
            ? '待自提'
            : rec.outShipped
              ? '补货到店中'
              : '补货处理中';
        } else view.desc = '补货处理中';
      } else {
        view.desc = type === 'return' ? '退货退款处理中' : '请等待平台处理';
      }
    }
    return view;
  }

  function buildAftersaleDetailHref(rec, extra) {
    extra = extra || {};
    return buildDetailHref(
      Object.assign(
        {
          type: rec.type === 'pre_ship' ? 'refund_only' : rec.type || 'refund_only',
          stage: rec.stage || 'audit',
          item: rec.itemIndex != null ? String(rec.itemIndex) : '0',
          reason: rec.reason || '',
          closeReason: rec.closeReason || '',
          asId: rec.id || ''
        },
        extra
      )
    );
  }

  function buildAftersaleListHref(extra) {
    return 'order-aftersale-list.html?' + buildQuery(extra || {});
  }

  function syncAftersaleRecordFromApp(app, type, stage) {
    if (!app) return;
    var id = app.aftersaleId || app.refundNo || genRefundNo();
    app.aftersaleId = id;
    var amount =
      app.amount != null
        ? app.amount
        : app.restockItems
          ? 0
          : null;
    if (amount == null) {
      var item = getItem();
      amount =
        item.paidAmount != null ? item.paidAmount : (item.priceNum || 0) * (item.qty || 1);
    }
    var syncType = type || app.formType || 'refund_only';
    var syncQty =
      syncType === 'restock'
        ? getApplyRestockQty(app)
        : app.qty != null && app.qty !== ''
          ? Number(app.qty) || 0
          : app.applyQty != null && app.applyQty !== ''
            ? Number(app.applyQty) || 0
            : Number((getItem() && getItem().qty) || 1) || 1;
    upsertAftersaleRecord({
      id: id,
      orderNo: app.orderNo || '1089765423471123',
      itemIndex: app.itemIndex != null ? app.itemIndex : getItemIndex(),
      type: syncType,
      stage: stage || 'audit',
      closeReason: app.closeReason || '',
      amount: Number(amount) || 0,
      qty: syncQty,
      reason: app.reason || '',
      productName: app.productName || '',
      productSpec: app.productSpec || '',
      productImg: app.productImg || '',
      shopName: getParams().get('supplier') || '冷丰优选供应链',
      applyTime: app.applyTime || formatDateTime(),
      resultTime: app.resultTime || app.closedTime || '',
      delivery: app.delivery || getDelivery(),
      driverPickedUp: !!app.driverPickedUp,
      warehouseInbound: !!app.warehouseInbound,
      merchantConfirmedReceive: !!app.merchantConfirmedReceive,
      storeReceivedReturn: !!app.storeReceivedReturn,
      outShipped: !!app.outShipped,
      applyQty: syncType === 'restock' ? getApplyRestockQty(app) : app.applyQty,
      actualRestockQty:
        syncType === 'restock' ? getActualRestockQty(app) : app.actualRestockQty
    });
    saveApplication(app);
  }

  function getApplyRestockQty(app, item) {
    item = item || getItem();
    if (app && app.applyQty != null && app.applyQty !== '') return Number(app.applyQty) || 0;
    if (app && app.restockItems && app.restockItems.length) {
      return app.restockItems.reduce(function (sum, row) {
        return sum + (Number(row.qty) || 0);
      }, 0);
    }
    if (app && app.qty != null && app.qty !== '') return Number(app.qty) || 0;
    return Number((item && item.qty) || 1) || 1;
  }

  function getActualRestockQty(app) {
    if (!app || app.actualRestockQty == null || app.actualRestockQty === '') return null;
    var n = Number(app.actualRestockQty);
    return isNaN(n) ? null : n;
  }

  var RETURN_METHODS = ['快递上门取货'];

  /** 售后演示买家账号/地址（禁止再用「斯斯love家」及昆仑天籁地址） */
  var DEMO_BUYER = {
    account: '林晓棠家',
    contact: '林晓棠',
    phone: '13856781234',
    address: '浙江省杭州市西湖区文三路 西溪花园3幢2单元501室',
    postcode: '310012'
  };

  var PICKUP_ADDRESSES = [
    {
      id: 'addr-buyer',
      label: '杭州市 西湖区文三路西溪花园',
      contact: DEMO_BUYER.contact,
      phone: DEMO_BUYER.phone,
      full: DEMO_BUYER.address
    },
    {
      id: 'addr-1',
      label: '杭州市 西湖区文三路168号',
      contact: '刘十九',
      phone: '13800001987',
      full: '浙江省杭州市西湖区文三路168号1幢502室'
    },
    {
      id: 'addr-2',
      label: '杭州市 上城区望江路16号',
      contact: '宋雨琦',
      phone: '15236806537',
      full: '浙江省杭州市上城区望江街道望江路16号'
    }
  ];

  /** 地址簿演示数据（勿用设计稿中的账号/地址） */
  var ADDRESS_BOOK_GROUPS = [
    {
      id: 'ab-g1',
      name: '林晓棠',
      phone: '13856781234',
      phoneDisplay: '138 5678 1234',
      tags: ['家', '默认'],
      addresses: [
        {
          id: 'ab-a1',
          text: '浙江省杭州市西湖区文三路 西溪花园3幢2单元501室'
        },
        {
          id: 'ab-a2',
          text: '浙江省杭州市余杭区仓前街道 梦想小镇创业大街12号'
        }
      ]
    },
    {
      id: 'ab-g2',
      name: '周启明',
      phone: '15022338866',
      phoneDisplay: '150 2233 8866',
      tags: ['公司'],
      addresses: [
        {
          id: 'ab-a3',
          text: '浙江省杭州市滨江区网商路 阿里中心4号楼'
        },
        {
          id: 'ab-a4',
          text: '浙江省杭州市拱墅区莫干山路 远洋国际中心B座'
        },
        {
          id: 'ab-a5',
          text: '浙江省宁波市鄞州区中山东路 和丰创意广场'
        },
        {
          id: 'ab-a6',
          text: '浙江省嘉兴市南湖区中环南路 科技城孵化园'
        }
      ]
    },
    {
      id: 'ab-g3',
      name: '何雨桐',
      phone: '18699881200',
      phoneDisplay: '186 9988 1200',
      tags: ['父母'],
      addresses: [
        {
          id: 'ab-a7',
          text: '浙江省绍兴市越城区解放南路 镜湖新区公馆'
        }
      ]
    }
  ];
  var ADDRESS_BOOK_COLLAPSE_LIMIT = 2;
  var ADDRESS_BOOK_STORAGE_KEY = 'ua_refund_address_book';

  function getDemoBuyerReceiveAddress() {
    return (
      DEMO_BUYER.contact +
      '， ' +
      DEMO_BUYER.phone +
      '， ' +
      DEMO_BUYER.address +
      '， ' +
      DEMO_BUYER.postcode
    );
  }

  function getDemoSupplierName() {
    try {
      return (getParams().get('supplier') || '').trim() || '华东冷链供应商';
    } catch (e) {
      return '华东冷链供应商';
    }
  }

  function getDemoSupplierReturnAddress(supplierName) {
    var name = supplierName || getDemoSupplierName();
    return name + '， 021-58901234， 上海市浦东新区外高桥保税区 冷链物流园A区12号';
  }

  /** 门店进货（代采）入口：履约为配送/快递到店，售后逻辑保持原状 */
  function isFromRestock() {
    return getParams().get('from') === 'restock.html';
  }

  /**
   * 履约枚举：
   * - store：快递（零售=到家；进货=到店）
   * - warehouse：配送经仓（仅门店进货）
   * - pickup：自提（仅零售用户 APP）
   */
  function isExpressDelivery(delivery) {
    return (delivery || getDelivery()) === 'store';
  }

  /** 配送（经仓）：门店退回仓库，司机取货，无取件码（仅进货） */
  function isWarehouseDelivery(delivery) {
    return (delivery || getDelivery()) === 'warehouse';
  }

  /** 零售自提：退货退回门店；补货到店后随原订单出示会员码核销（不单独建补货单） */
  function isPickupDelivery(delivery) {
    return (delivery || getDelivery()) === 'pickup';
  }

  /** 零售用户 APP（非进货）：自提 / 快递到家 */
  function isRetailApp() {
    return !isFromRestock();
  }

  function isDeliveryDriverPicked(app) {
    return !!(app && app.driverPickedUp);
  }

  function isDeliveryWarehouseInbound(app) {
    return !!(app && app.warehouseInbound);
  }

  function formatWarehouseReturnAddressText() {
    var info = RETURN_ADDRESSES.warehouse;
    return info.name + '， ' + info.phone + '， ' + info.address;
  }

  function formatStoreReturnAddressText() {
    var info = RETURN_ADDRESSES.store;
    return info.name + '， ' + info.phone + '， ' + info.address;
  }

  /**
   * 退货回退地址文案：
   * - 配送(warehouse)：仓库地址（进货）
   * - 自提(pickup)：门店地址（零售）
   * - 快递(store)：供应商收货地址
   */
  function getReturnAddressText(app, supplierName) {
    var delivery = (app && app.delivery) || getDelivery();
    if (isPickupDelivery(delivery)) {
      return (app && app.returnAddress) || formatStoreReturnAddressText();
    }
    if (isWarehouseDelivery(delivery)) {
      if (app && app.returnAddress && String(app.returnAddress).indexOf('仓') >= 0) {
        return app.returnAddress;
      }
      return formatWarehouseReturnAddressText();
    }
    return (app && app.returnAddress) || getDemoSupplierReturnAddress(supplierName);
  }

  function ensureReturnAddressOnApp(app) {
    if (!app) return app;
    var delivery = app.delivery || getDelivery();
    app.delivery = delivery;
    if (isPickupDelivery(delivery)) {
      app.returnAddress = formatStoreReturnAddressText();
    } else if (isWarehouseDelivery(delivery)) {
      app.returnAddress = formatWarehouseReturnAddressText();
    } else if (!app.returnAddress) {
      app.returnAddress = getDemoSupplierReturnAddress();
    }
    return app;
  }

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
  var CLOSE_RETURN_MAX_TIMES = 3;
  var CLOSE_RETURN_REMAIN_KEY = 'ua_refund_close_remain';
  var PICKUP_EDIT_MAX_TIMES = 3;
  var PICKUP_EDIT_REMAIN_PREFIX = 'ua_refund_pickup_edit_remain_';

  /** 演示：已完成订单修改次数已用完，待收货等订单可正常修改 */
  function getOrderStatus() {
    return (getParams().get('status') || '').trim();
  }

  function isPickupEditExhaustedDemo() {
    return getOrderStatus() === 'completed';
  }

  function getPickupEditRemainKey(refundNo) {
    return (
      PICKUP_EDIT_REMAIN_PREFIX +
      getOrderStatus() +
      '_item' +
      getItemIndex() +
      '_' +
      String(refundNo || 'default')
    );
  }

  function getPickupEditRemain(refundNo) {
    if (isPickupEditExhaustedDemo()) return 0;
    try {
      var raw = sessionStorage.getItem(getPickupEditRemainKey(refundNo));
      if (raw == null || raw === '') return PICKUP_EDIT_MAX_TIMES;
      var n = parseInt(raw, 10);
      if (isNaN(n)) return PICKUP_EDIT_MAX_TIMES;
      return Math.max(0, Math.min(PICKUP_EDIT_MAX_TIMES, n));
    } catch (e) {
      return PICKUP_EDIT_MAX_TIMES;
    }
  }

  function setPickupEditRemain(refundNo, n) {
    if (isPickupEditExhaustedDemo()) return;
    try {
      sessionStorage.setItem(
        getPickupEditRemainKey(refundNo),
        String(Math.max(0, Math.min(PICKUP_EDIT_MAX_TIMES, n)))
      );
    } catch (e) {
      /* ignore */
    }
  }

  function consumePickupEditChance(refundNo) {
    if (isPickupEditExhaustedDemo()) return false;
    var remain = getPickupEditRemain(refundNo);
    if (remain <= 0) return false;
    setPickupEditRemain(refundNo, remain - 1);
    return true;
  }

  function getCloseReturnRemainKey() {
    return CLOSE_RETURN_REMAIN_KEY + '_item' + getItemIndex();
  }

  function getCloseReturnRemain() {
    try {
      var raw = sessionStorage.getItem(getCloseReturnRemainKey());
      if (raw == null || raw === '') return CLOSE_RETURN_MAX_TIMES;
      var n = parseInt(raw, 10);
      if (isNaN(n)) return CLOSE_RETURN_MAX_TIMES;
      return Math.max(0, Math.min(CLOSE_RETURN_MAX_TIMES, n));
    } catch (e) {
      return CLOSE_RETURN_MAX_TIMES;
    }
  }

  function setCloseReturnRemain(n) {
    try {
      sessionStorage.setItem(
        getCloseReturnRemainKey(),
        String(Math.max(0, Math.min(CLOSE_RETURN_MAX_TIMES, n)))
      );
    } catch (e) {
      /* ignore */
    }
  }

  function consumeCloseReturnChance() {
    var remain = getCloseReturnRemain();
    if (remain <= 0) return false;
    setCloseReturnRemain(remain - 1);
    return true;
  }

  var PICKUP_TIME_WINDOWS = [
    { start: '09:00', end: '11:00', label: '09:00–11:00' },
    { start: '11:00', end: '13:00', label: '11:00–13:00', popular: true },
    { start: '13:00', end: '15:00', label: '13:00–15:00' },
    // 原型演示：今日该档默认约满，点「今」即可看到「已约满」
    { start: '15:00', end: '17:00', label: '15:00–17:00', demoFull: true },
    { start: '17:00', end: '19:00', label: '17:00–19:00' }
  ];
  var PICKUP_SAME_DAY_CUTOFF_HOUR = 7;
  /** 晚上 8 点后，今日全部时段不可预约 */
  var PICKUP_DAY_CLOSE_HOUR = 20;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function startOfDay(date) {
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function parseTimeParts(hm) {
    var parts = String(hm || '').split(':');
    return {
      h: parseInt(parts[0], 10) || 0,
      m: parseInt(parts[1], 10) || 0
    };
  }

  /** 取件弹窗统一时钟；支持 ?pickupNow=20:05 或 ISO，便于演示「今晚 8 点后今日全不可约」 */
  function getPickupNow() {
    var raw = '';
    try {
      raw = (getParams().get('pickupNow') || '').trim();
    } catch (e) {
      raw = '';
    }
    if (!raw) return new Date();
    if (/^\d{1,2}:\d{2}$/.test(raw)) {
      var hm = parseTimeParts(raw);
      var d = new Date();
      d.setHours(hm.h, hm.m, 0, 0);
      return d;
    }
    var parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date();
  }

  /** 演示：?pickupFull=1 模拟当天所有时段已约满 */
  function isPickupTodayFullyBooked() {
    try {
      var v = (getParams().get('pickupFull') || '').trim().toLowerCase();
      return v === '1' || v === 'true' || v === 'all';
    } catch (e) {
      return false;
    }
  }

  function isTodayAllSlotsPassed(now) {
    now = now || getPickupNow();
    return !dateHasAvailablePickupSlot(startOfDay(now), now);
  }

  function canIncludeTodayInPickup(now) {
    now = now || getPickupNow();
    // 当天 7 点之后：预约从明天起；7 点前可预约今日
    return now.getHours() < PICKUP_SAME_DAY_CUTOFF_HOUR;
  }

  function getBookablePickupDays(now) {
    now = now || getPickupNow();
    var today = startOfDay(now);
    var start = canIncludeTodayInPickup(now) ? today : addDays(today, 1);
    return [start, addDays(start, 1), addDays(start, 2)];
  }

  function isPickupDayBookable(date, now) {
    now = now || getPickupNow();
    return getBookablePickupDays(now).some(function (d) {
      return sameDay(d, date);
    });
  }

  function getSelectablePickupDays(now) {
    now = now || getPickupNow();
    var today = startOfDay(now);
    var days = getBookablePickupDays(now).slice();
    // 「今」始终可点选：便于查看今日剩余/已不可约时段；能否提交由 bookable + 可用时段决定
    var hasToday = days.some(function (d) {
      return sameDay(d, today);
    });
    if (!hasToday) days.unshift(today);
    return days;
  }

  function dateHasAvailablePickupSlot(date, now) {
    now = now || getPickupNow();
    return PICKUP_TIME_WINDOWS.some(function (slot) {
      return !getPickupSlotBlockReason(date, slot, now);
    });
  }

  function getDefaultPickupDate(selectableDays, now) {
    now = now || getPickupNow();
    for (var i = 0; i < selectableDays.length; i++) {
      var day = selectableDays[i];
      if (isPickupDayBookable(day, now) && dateHasAvailablePickupSlot(day, now)) {
        return day;
      }
    }
    for (var j = 0; j < selectableDays.length; j++) {
      if (dateHasAvailablePickupSlot(selectableDays[j], now)) return selectableDays[j];
    }
    return selectableDays[0] || null;
  }

  function mondayOfWeek(date) {
    return addDays(date, -((date.getDay() + 6) % 7));
  }

  function sundayOfWeek(date) {
    return addDays(mondayOfWeek(date), 6);
  }

  /**
   * 今日时段不可约原因：
   * - 当天全部约满（?pickupFull=1）→ 已约满
   * - 超过晚上 8 点 → 时段已过（全部）
   * - 单档演示约满（demoFull）→ 已约满
   * - 已到/已过该档开始时间 → 时段已过
   */
  function getPickupSlotBlockReason(date, slot, now) {
    now = now || getPickupNow();
    if (!slot || !sameDay(date, now)) return '';
    if (isPickupTodayFullyBooked()) return '已约满';
    if (now.getHours() >= PICKUP_DAY_CLOSE_HOUR) return '时段已过';
    if (slot.demoFull) return '已约满';
    var start = parseTimeParts(slot.start);
    var startAt = new Date(date.getTime());
    startAt.setHours(start.h, start.m, 0, 0);
    if (now.getTime() >= startAt.getTime()) return '时段已过';
    return '';
  }

  function isPickupSlotPassed(date, slot, now) {
    return !!getPickupSlotBlockReason(date, slot, now);
  }

  function shouldFocusTodayPickupDemo(now) {
    now = now || getPickupNow();
    if (isPickupTodayFullyBooked()) return true;
    if (now.getHours() >= PICKUP_DAY_CLOSE_HOUR) return true;
    try {
      if ((getParams().get('pickupNow') || '').trim()) return true;
    } catch (e) {
      /* ignore */
    }
    // 今日已有不可约档时，打开直接落在「今」，避免被预填「明天」挡住标识
    var today = startOfDay(now);
    return PICKUP_TIME_WINDOWS.some(function (slot) {
      return !!getPickupSlotBlockReason(today, slot, now);
    });
  }

  function formatPickupDisplay(date, slotLabel) {
    var dayText = date.getMonth() + 1 + '月' + date.getDate() + '日';
    return slotLabel ? dayText + ' ' + slotLabel : dayText;
  }

  function normalizePickupSlotLabel(label) {
    return String(label || '').replace(/-/g, '–');
  }

  function parsePickupValue(value) {
    var text = String(value || '').trim();
    if (!text) return null;
    var m = text.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}[-–]\d{2}:\d{2})/);
    if (m) {
      return {
        date: new Date(+m[1], +m[2] - 1, +m[3]),
        slotLabel: normalizePickupSlotLabel(m[4])
      };
    }
    m = text.match(/(\d{1,2})月(\d{1,2})日(?:\s+(\d{2}:\d{2}[-–]\d{2}:\d{2}))?/);
    if (m) {
      var now = new Date();
      return {
        date: new Date(now.getFullYear(), +m[1] - 1, +m[2]),
        slotLabel: normalizePickupSlotLabel(m[3] || '')
      };
    }
    return null;
  }

  function getSlotDisplayLabel(slot, blockReason) {
    if (blockReason) return slot.label + ' (' + blockReason + ')';
    if (slot.popular) return slot.label + ' (常选时段)';
    return slot.label;
  }

  function findPickupSlot(label) {
    var normalized = normalizePickupSlotLabel(label);
    return (
      PICKUP_TIME_WINDOWS.find(function (s) {
        return s.label === normalized || s.label === label;
      }) || null
    );
  }

  /** 售后寄回快递公司（id=快递100编码；letter=拼音首字母，用于分组排序） */
  var COURIERS = [
    { id: 'shunfeng', name: '顺丰速运', abbr: '顺', letter: 'S' },
    { id: 'zhongtong', name: '中通快递', abbr: '中', letter: 'Z' },
    { id: 'yuantong', name: '圆通速递', abbr: '圆', letter: 'Y' },
    { id: 'yunda', name: '韵达快递', abbr: '韵', letter: 'Y' },
    { id: 'shentong', name: '申通快递', abbr: '申', letter: 'S' },
    { id: 'jtexpress', name: '极兔速递', abbr: '极', letter: 'J' },
    { id: 'jd', name: '京东物流', abbr: '京', letter: 'J' },
    { id: 'ems', name: 'EMS', abbr: 'E', letter: 'E' },
    { id: 'youzhengguonei', name: '邮政快递包裹', abbr: '邮', letter: 'Y' },
    { id: 'debangkuaidi', name: '德邦快递', abbr: '德', letter: 'D' },
    { id: 'debangwuliu', name: '德邦物流', abbr: '邦', letter: 'D' },
    { id: 'zhongtongkuaiyun', name: '中通快运', abbr: '通', letter: 'Z' },
    { id: 'annengwuliu', name: '安能物流', abbr: '安', letter: 'A' },
    { id: 'kuayue', name: '跨越速运', abbr: '跨', letter: 'K' },
    { id: 'yimidida', name: '壹米滴答', abbr: '壹', letter: 'Y' },
    { id: 'baishiwuliu', name: '百世快运', abbr: '快', letter: 'B' },
    { id: 'danniao', name: '丹鸟', abbr: '丹', letter: 'D' },
    { id: 'zhaijisong', name: '宅急送', abbr: '宅', letter: 'Z' },
    { id: 'yundakuaiyun', name: '韵达快运', abbr: '达', letter: 'Y' },
    { id: 'sxjdfreight', name: '顺心捷达', abbr: '心', letter: 'S' },
    { id: 'youshuwuliu', name: '优速快递', abbr: '优', letter: 'Y' },
    { id: 'fengwang', name: '丰网速运', abbr: '丰', letter: 'F' },
    { id: 'suning', name: '苏宁物流', abbr: '苏', letter: 'S' },
    { id: 'huitongkuaidi', name: '百世快递', abbr: '百', letter: 'B' }
  ];
  var COURIER_INDEX_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
  var FREQUENT_COURIER_KEY = 'ua_or_frequent_couriers_v1';
  var DEFAULT_FREQUENT_COURIER_IDS = ['shunfeng', 'zhongtong', 'yuantong'];

  function getCourierLetter(courier) {
    var letter = String((courier && courier.letter) || '').toUpperCase();
    if (/^[A-Z]$/.test(letter)) return letter;
    return '#';
  }

  function loadFrequentCourierIds() {
    try {
      var raw = localStorage.getItem(FREQUENT_COURIER_KEY);
      var list = raw ? JSON.parse(raw) : null;
      if (Array.isArray(list) && list.length) {
        return list.filter(function (id) {
          return COURIERS.some(function (c) {
            return c.id === id;
          });
        });
      }
    } catch (e) {
      /* ignore */
    }
    return DEFAULT_FREQUENT_COURIER_IDS.slice();
  }

  function rememberFrequentCourier(courierId) {
    if (!courierId) return;
    var list = loadFrequentCourierIds().filter(function (id) {
      return id !== courierId;
    });
    list.unshift(courierId);
    try {
      localStorage.setItem(FREQUENT_COURIER_KEY, JSON.stringify(list.slice(0, 5)));
    } catch (e) {
      /* ignore */
    }
  }

  function filterCouriersByKeyword(keyword) {
    var key = String(keyword || '')
      .trim()
      .toLowerCase();
    if (!key) return COURIERS.slice();
    return COURIERS.filter(function (c) {
      return (
        String(c.name).toLowerCase().indexOf(key) >= 0 ||
        String(c.id).toLowerCase().indexOf(key) >= 0 ||
        String(c.abbr).toLowerCase().indexOf(key) >= 0 ||
        String(c.letter).toLowerCase() === key
      );
    });
  }

  function groupCouriersByLetter(list) {
    var groups = {};
    list.forEach(function (c) {
      var letter = getCourierLetter(c);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });
    Object.keys(groups).forEach(function (letter) {
      groups[letter].sort(function (a, b) {
        return String(a.name).localeCompare(String(b.name), 'zh-CN');
      });
    });
    return groups;
  }

  function renderCourierPickerList(listEl, keyword, selectedId) {
    if (!listEl) return;
    var filtered = filterCouriersByKeyword(keyword);
    var groups = groupCouriersByLetter(filtered);
    var html = '';

    if (!keyword) {
      var frequentIds = loadFrequentCourierIds();
      var frequent = frequentIds
        .map(function (id) {
          return COURIERS.find(function (c) {
            return c.id === id;
          });
        })
        .filter(Boolean);
      if (frequent.length) {
        html +=
          '<div class="ua-or-courier-picker__section" data-letter="freq">' +
          '<div class="ua-or-courier-picker__section-title">我常用的快递</div>';
        frequent.forEach(function (c) {
          html +=
            '<button type="button" class="ua-or-courier-picker__item' +
            (c.id === selectedId ? ' is-selected' : '') +
            '" data-courier-id="' +
            escapeHtml(c.id) +
            '">' +
            escapeHtml(c.name) +
            '</button>';
        });
        html += '</div>';
      }
    }

    COURIER_INDEX_LETTERS.forEach(function (letter) {
      var items = groups[letter];
      if (!items || !items.length) return;
      html +=
        '<div class="ua-or-courier-picker__section" data-letter="' +
        escapeHtml(letter) +
        '" id="courierLetter-' +
        escapeHtml(letter) +
        '">' +
        '<div class="ua-or-courier-picker__letter">' +
        escapeHtml(letter) +
        '</div>';
      items.forEach(function (c) {
        html +=
          '<button type="button" class="ua-or-courier-picker__item' +
          (c.id === selectedId ? ' is-selected' : '') +
          '" data-courier-id="' +
          escapeHtml(c.id) +
          '">' +
          escapeHtml(c.name) +
          '</button>';
      });
      html += '</div>';
    });

    if (!html) {
      html = '<div class="ua-or-courier-picker__empty">未找到相关快递公司</div>';
    }
    listEl.innerHTML = html;
  }

  function renderCourierIndex(indexEl, keyword) {
    if (!indexEl) return;
    var filtered = filterCouriersByKeyword(keyword);
    var available = {};
    filtered.forEach(function (c) {
      available[getCourierLetter(c)] = true;
    });
    indexEl.innerHTML = COURIER_INDEX_LETTERS.map(function (letter) {
      var active = !!available[letter];
      return (
        '<button type="button" class="ua-or-courier-picker__index-item' +
        (active ? ' is-active' : '') +
        '" data-letter="' +
        escapeHtml(letter) +
        '"' +
        (active ? '' : ' disabled') +
        '>' +
        escapeHtml(letter) +
        '</button>'
      );
    }).join('');
  }

  function openCourierPicker(options) {
    options = options || {};
    var selectedId = options.selectedId || '';
    var onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;
    var sheet = document.getElementById('refundCourierSheet');
    var listEl = document.getElementById('refundCourierList');
    var indexEl = document.getElementById('refundCourierIndex');
    var searchEl = document.getElementById('refundCourierSearch');
    if (!sheet || !listEl) return;

    function refresh() {
      var keyword = searchEl ? searchEl.value : '';
      renderCourierPickerList(listEl, keyword, selectedId);
      renderCourierIndex(indexEl, keyword);
    }

    if (searchEl) {
      searchEl.value = '';
      searchEl.oninput = refresh;
    }

    listEl.onclick = function (e) {
      var btn = e.target.closest('[data-courier-id]');
      if (!btn) return;
      var id = btn.getAttribute('data-courier-id');
      var found = COURIERS.find(function (c) {
        return c.id === id;
      });
      if (!found) return;
      rememberFrequentCourier(found.id);
      if (onSelect) onSelect(found);
      closeSheet('refundCourierSheet');
    };

    if (indexEl) {
      indexEl.onclick = function (e) {
        var btn = e.target.closest('[data-letter]');
        if (!btn || btn.disabled) return;
        var letter = btn.getAttribute('data-letter');
        var target = listEl.querySelector('[data-letter="' + letter + '"]');
        if (!target) return;
        var y =
          target.getBoundingClientRect().top -
          listEl.getBoundingClientRect().top +
          listEl.scrollTop;
        listEl.scrollTop = y;
      };
    }

    refresh();
    openSheet('refundCourierSheet');
  }

  var RETURN_ADDRESSES = {
    store: {
      tip: '平台已同意退货，请将商品退回以下门店。门店确认收货后将为您退款。',
      name: '悠悠生鲜超市',
      phone: '15546758976',
      address: '萧山区经济开发区鸿兴路158号 长三角国际中心25楼1005'
    },
    supplier: {
      tip: '平台已同意退货，请将商品寄回以下供应商地址，并在下方填写退货物流信息。',
      name: '华东冷链供应商 售后组',
      phone: '021-58901234',
      address: '上海市浦东新区外高桥保税区 冷链物流园A区12号'
    },
    warehouse: {
      tip: '平台已同意退货，请将商品寄回以下仓库地址，并在下方填写退货物流信息。仓配订单商品需退回对应分拣仓。',
      name: '杭州萧山仓 售后组',
      phone: '0571-88887777',
      address: '浙江省杭州市萧山区宁围街道 冷丰仓储物流中心 A区退货组'
    }
  };

  var REFUND_ONLY_STEPS = ['提交申请', '平台审核', '退款成功'];
  var RETURN_STEPS = ['提交申请', '平台审核', '寄回商品', '平台退款', '退款成功'];
  /** 配送退货：寄回商品节点拆为待取货（后台待退货）→ 待入库（后台待收货） */
  var RETURN_STEPS_WAREHOUSE = [
    '提交申请',
    '平台审核',
    '待取货',
    '待入库',
    '平台退款',
    '退款成功'
  ];
  /** 零售自提退货：退回门店 → 门店确认收货触发退款 */
  var RETURN_STEPS_PICKUP = [
    '提交申请',
    '平台审核',
    '退回门店',
    '平台退款',
    '退款成功'
  ];
  var RESTOCK_STEPS = ['提交申请', '平台审核', '补货寄出', '补货完成'];
  /** 平台配送补货：仓配到店，无物流轨迹 */
  var RESTOCK_STEPS_WAREHOUSE = ['提交申请', '平台审核', '补货到店', '补货完成'];
  /** 零售自提补货：到店后待自提，随原订单扫会员码核销（不单独生成补货订单） */
  var RESTOCK_STEPS_PICKUP = [
    '提交申请',
    '平台审核',
    '补货到店',
    '待自提',
    '补货完成'
  ];
  var EXCHANGE_STEPS = ['提交申请', '平台审核', '寄回商品', '换货寄出', '换货完成'];

  function getDelivery() {
    var delivery = (getParams().get('delivery') || '').trim();
    if (delivery === 'express') delivery = 'store';
    if (delivery === 'store' || delivery === 'warehouse' || delivery === 'pickup') {
      return delivery;
    }
    /* 零售默认快递到家；进货默认配送经仓 */
    return isFromRestock() ? 'warehouse' : 'store';
  }

  function getReturnConfirmParty(delivery) {
    var mode = delivery || getDelivery();
    if (isPickupDelivery(mode)) return '门店';
    if (isExpressDelivery(mode)) return '商家';
    return '仓库';
  }

  function buildRefundStageNotice(delivery) {
    var party = getReturnConfirmParty(delivery);
    return (
      '您已提交退货物流信息，请等待' +
      party +
      '确认收货。' +
      party +
      '确认收货后将为您退款，若' +
      party +
      '超时未处理，系统将自动退款。'
    );
  }

  function buildRejectReturnNotice(delivery) {
    var party = getReturnConfirmParty(delivery);
    return (
      '因退货商品不符，' +
      party +
      '已拒收，商品正在退回。退回物流签收（已签收）后，本次售后单才会关闭，请留意物流信息。'
    );
  }

  function isRejectBackSigned(app) {
    return !!(app && (app.backLogisticsStatus === '已签收' || app.backSigned));
  }

  function markRejectBackSigned(app) {
    app = app || {};
    app.backLogisticsStatus = '已签收';
    app.backSigned = true;
    app.backSignedTime = app.backSignedTime || formatDateTime();
    saveApplication(app);
    return app;
  }

  function isReshipShipped(app) {
    var q = getParams().get('shipped');
    if (q === '1') return true;
    if (q === '0') return false;
    return !!(app && app.outShipped);
  }

  function isWarehouseRestock(app, refundType) {
    var type = refundType || (app && app.formType) || getRefundType();
    var delivery = (app && app.delivery) || getDelivery();
    return type === 'restock' && isWarehouseDelivery(delivery);
  }

  function isPickupRestock(app, refundType) {
    var type = refundType || (app && app.formType) || getRefundType();
    var delivery = (app && app.delivery) || getDelivery();
    return type === 'restock' && isPickupDelivery(delivery);
  }

  /** 平台配送 / 自提补货：无法获取物流轨迹，不展示补货物流板块 */
  function isNoTrackRestock(app, refundType) {
    return isWarehouseRestock(app, refundType) || isPickupRestock(app, refundType);
  }

  function markReshipShipped(app) {
    app = app || {};
    app.outShipped = true;
    app.outShipTime = app.outShipTime || formatDateTime();
    /* 平台配送 / 自提补货：不生成快递物流信息 */
    if (isNoTrackRestock(app)) {
      app.outCourier = '';
      app.outTrackingNo = '';
      if (isPickupRestock(app)) {
        app.outLogisticsStatus = '补货到店';
        app.outLogisticsText = '补货商品已安排到店，请到店自提核销';
        ensureRestockArriveStore(app);
      } else {
        app.outLogisticsStatus = '仓库配送到店';
        app.outLogisticsText = '供应商已补发至仓库，仓库配送到门店';
        app.restockAwaitReceiveAt = app.restockAwaitReceiveAt || app.outShipTime;
      }
    } else {
      app.outCourier = '申通快递';
      app.outTrackingNo = '773075059702651';
      app.outLogisticsStatus = '运输中';
      app.outLogisticsText = '【杭州市】快件已到达 杭州萧山转运中心';
    }
    saveApplication(app);
    return app;
  }

  function ensureReshipData(app) {
    app = app || {};
    /* 仅已寄出时补齐物流演示数据；待寄出不生成运单；配送/自提补货不补快递单号 */
    if (isReshipShipped(app)) {
      app.outShipped = true;
      if (isNoTrackRestock(app)) {
        app.outCourier = '';
        app.outTrackingNo = '';
        if (isPickupRestock(app)) {
          if (!app.outLogisticsStatus) app.outLogisticsStatus = '补货到店';
          if (!app.outLogisticsText) {
            app.outLogisticsText = '补货商品已安排到店，请到店自提核销';
          }
        } else {
          if (!app.outLogisticsStatus) app.outLogisticsStatus = '仓库配送到店';
          if (!app.outLogisticsText) {
            app.outLogisticsText = '供应商已补发至仓库，仓库配送到门店';
          }
        }
      } else {
        if (!app.outCourier || app.outCourier === '顺丰速运') app.outCourier = '申通快递';
        if (!app.outTrackingNo || String(app.outTrackingNo).indexOf('SF') === 0) {
          app.outTrackingNo = '773075059702651';
        }
        if (!app.outLogisticsStatus) app.outLogisticsStatus = '运输中';
        if (!app.outLogisticsText) {
          app.outLogisticsText = '【杭州市】快件已到达 杭州萧山转运中心';
        }
      }
      saveApplication(app);
    }
    return app;
  }

  function getReshipLogisticsPackages(app) {
    app = ensureReshipData(app || {});
    var primary = {
      status: app.outLogisticsStatus || '运输中',
      courier: app.outCourier || '申通快递',
      trackingNo: app.outTrackingNo || '773075059702651',
      text: app.outLogisticsText || '【杭州市】快件已到达 杭州萧山转运中心'
    };
    /* 补货寄出默认单包裹；pkgs=2 时演示多包裹 */
    if (getParams().get('pkgs') === '2' || getParams().get('multiPkg') === '1') {
      return [
        primary,
        {
          status: '派送中',
          courier: '中通快递',
          trackingNo: '788012345678901',
          text: '【杭州市】快件正在派送中，派送员：李师傅'
        }
      ];
    }
    return [primary];
  }

  function buildOrderLogisticsHref(pkgIndex, packageCount) {
    var count = packageCount != null ? packageCount : 1;
    var stage = getDetailStage() || 'return';
    var extra = {
      refundBack: '1',
      type: getRefundType(),
      /* 退货物流回跳仍停在寄回商品 / 当前阶段 */
      stage: stage,
      shipped: '1',
      pkg: pkgIndex != null ? String(pkgIndex) : '0',
      /* 单包裹跟踪页不展示包裹1/包裹2页签 */
      pkgs: count <= 1 ? '1' : String(count)
    };
    var item = getParams().get('item');
    if (item != null && item !== '') extra.item = item;
    var pickupPhase = getParams().get('pickupPhase') || '';
    if (pickupPhase) extra.pickupPhase = pickupPhase;
    return 'order-logistics.html?' + buildQuery(extra);
  }

  function renderReshipPendingCard(app, refundType) {
    var pending = document.getElementById('refundReshipPendingCard');
    var track = document.getElementById('refundReshipLogisticsTrack');
    var statusEl = pending && pending.querySelector('.ua-or-reship-pending__status');
    var textEl = pending && pending.querySelector('.ua-or-reship-pending__text');
    var warehouseRestock = isWarehouseRestock(app, refundType);
    if (pending) {
      pending.hidden = false;
      pending.classList.toggle('is-warehouse-restock', warehouseRestock);
      if (statusEl) {
        statusEl.textContent = warehouseRestock
          ? '供应商补发至仓库'
          : '由第三方物流配送';
      }
      if (textEl) {
        textEl.textContent = warehouseRestock
          ? '补货将由仓库配送到门店，无快递物流信息'
          : '请关注发货后物流详情';
      }
      pending.onclick = function () {
        /* 演示：点击待发货卡 → 模拟已寄出 */
        markReshipShipped(app);
        window.location.href = buildDetailHref({
          type: refundType,
          stage: 'reship',
          shipped: '1'
        });
      };
    }
    if (track) {
      track.hidden = true;
      var scroll = document.getElementById('refundReshipLogisticsScroll');
      if (scroll) scroll.innerHTML = '';
    }
  }

  /** 配送补货已发出：无物流单号，仅提示仓配到店待确认收货 */
  function renderWarehouseRestockShippedCard(app) {
    var pending = document.getElementById('refundReshipPendingCard');
    var track = document.getElementById('refundReshipLogisticsTrack');
    var statusEl = pending && pending.querySelector('.ua-or-reship-pending__status');
    var textEl = pending && pending.querySelector('.ua-or-reship-pending__text');
    if (pending) {
      pending.hidden = false;
      pending.classList.add('is-warehouse-restock', 'is-shipped');
      pending.onclick = null;
      pending.style.cursor = 'default';
      if (statusEl) statusEl.textContent = '仓库已配送到店';
      if (textEl) {
        textEl.textContent = '供应商补发至仓库后已配送到门店，请确认收货并完成入库';
      }
    }
    if (track) {
      track.hidden = true;
      var scroll = document.getElementById('refundReshipLogisticsScroll');
      if (scroll) scroll.innerHTML = '';
      var dots = document.getElementById('refundReshipLogisticsDots');
      if (dots) {
        dots.hidden = true;
        dots.innerHTML = '';
      }
    }
  }

  function renderReshipLogisticsTrack(app) {
    var section = document.getElementById('refundDetailReshipSection');
    var pending = document.getElementById('refundReshipPendingCard');
    var track = document.getElementById('refundReshipLogisticsTrack');
    var scroll = document.getElementById('refundReshipLogisticsScroll');
    var dots = document.getElementById('refundReshipLogisticsDots');
    if (!section || !scroll) return;

    if (pending) {
      pending.hidden = true;
      pending.onclick = null;
    }
    if (track) track.hidden = false;

    var packages = getReshipLogisticsPackages(app);
    var chevron =
      '<svg class="ua-or-reship-logistics__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
    var truckIcon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="13" height="9" rx="1"/><path d="M15 10h4l3 4v3h-7V10z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>';

    scroll.innerHTML = packages
      .map(function (pkg, idx) {
        return (
          '<button type="button" class="ua-or-reship-logistics__card" data-pkg-index="' +
          idx +
          '">' +
          '<span class="ua-or-reship-logistics__icon" aria-hidden="true">' +
          truckIcon +
          '</span>' +
          '<div class="ua-or-reship-logistics__body">' +
          '<div class="ua-or-reship-logistics__status">' +
          escapeHtml(pkg.status) +
          '</div>' +
          '<div class="ua-or-reship-logistics__courier">' +
          escapeHtml(pkg.courier) +
          ' ' +
          escapeHtml(pkg.trackingNo) +
          '</div>' +
          '<div class="ua-or-reship-logistics__text">' +
          escapeHtml(pkg.text) +
          '</div></div>' +
          chevron +
          '</button>'
        );
      })
      .join('');

    if (dots) {
      if (packages.length > 1) {
        dots.hidden = false;
        dots.innerHTML = packages
          .map(function (_, idx) {
            return (
              '<span class="ua-or-reship-logistics__dot' +
              (idx === 0 ? ' is-active' : '') +
              '"></span>'
            );
          })
          .join('');
      } else {
        dots.innerHTML = '';
        dots.hidden = true;
      }
    }

    scroll.querySelectorAll('.ua-or-reship-logistics__card').forEach(function (card) {
      card.addEventListener('click', function () {
        var idx = Number(card.getAttribute('data-pkg-index') || 0);
        window.location.href = buildOrderLogisticsHref(idx, packages.length);
      });
    });

    if (packages.length > 1 && dots) {
      scroll.addEventListener('scroll', function () {
        var card = scroll.querySelector('.ua-or-reship-logistics__card');
        if (!card) return;
        var idx = Math.round(scroll.scrollLeft / (card.offsetWidth + 10));
        dots.querySelectorAll('.ua-or-reship-logistics__dot').forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === idx);
        });
      });
    }
  }

  function renderReshipSection(app, refundType) {
    var section = document.getElementById('refundDetailReshipSection');
    if (!section) return;
    /* 平台配送 / 自提补货：无法获取物流轨迹，去掉补货物流板块 */
    if (isNoTrackRestock(app, refundType)) {
      section.hidden = true;
      var pending = document.getElementById('refundReshipPendingCard');
      var track = document.getElementById('refundReshipLogisticsTrack');
      if (pending) pending.hidden = true;
      if (track) {
        track.hidden = true;
        var scroll = document.getElementById('refundReshipLogisticsScroll');
        if (scroll) scroll.innerHTML = '';
      }
      return;
    }
    section.hidden = false;
    ensureReshipData(app);
    if (isReshipShipped(app)) {
      renderReshipLogisticsTrack(app);
    } else {
      renderReshipPendingCard(app, refundType);
    }
  }

  /**
   * 补货确认收货数量录入（演示）
   * - warehouse：门店入库单，填写实际入库数量（进货配送）
   * - express：确认收货弹层（进货快递到店）
   * - home：零售快递补货到家
   * 写入 actualRestockQty 并回写售后单
   */
  function openRestockReceiveSheet(app, refundType, item, mode) {
    item = item || getItem();
    app = app || {};
    mode = mode || (isWarehouseRestock(app, refundType) ? 'warehouse' : 'express');
    var sheet = document.getElementById('refundStoreInboundSheet');
    if (!sheet) {
      showToast('确认收货演示不可用');
      return;
    }
    var titleEl = sheet.querySelector('.ua-or-inbound-panel__title');
    var tipEl = document.getElementById('refundInboundTip');
    var nameEl = document.getElementById('refundInboundProductName');
    var specEl = document.getElementById('refundInboundProductSpec');
    var applyEl = document.getElementById('refundInboundApplyQty');
    var qtyLabelEl = document.getElementById('refundInboundQtyLabel');
    var qtyInput = document.getElementById('refundInboundQtyInput');
    var confirmBtn = document.getElementById('refundInboundConfirmBtn');
    var applyQty = getApplyRestockQty(app, item);
    var defaultQty =
      getActualRestockQty(app) != null ? getActualRestockQty(app) : applyQty;

    if (titleEl) {
      titleEl.textContent = mode === 'warehouse' ? '门店入库单' : '确认收货';
    }
    if (tipEl) {
      tipEl.textContent =
        mode === 'warehouse'
          ? '补货商品已送达门店，请填写实际入库数量，该数量将回写售后单。'
          : mode === 'home'
            ? '供应商补货已送达您的收货地址，请填写实际收到数量。'
            : '请填写实际收到的补货数量，该数量将记录在售后单中。';
    }
    if (nameEl) nameEl.textContent = app.productName || (item && item.name) || '补货商品';
    if (specEl) specEl.textContent = app.productSpec || (item && item.spec) || '';
    if (applyEl) applyEl.textContent = '申请补货数量：' + applyQty;
    if (qtyLabelEl) {
      qtyLabelEl.textContent = mode === 'warehouse' ? '实际入库数量' : '实际收到数量';
    }
    if (qtyInput) {
      qtyInput.value = String(defaultQty);
      qtyInput.max = String(Math.max(applyQty, defaultQty));
    }
    if (confirmBtn) {
      confirmBtn.textContent = mode === 'warehouse' ? '确认入库' : '确认收货';
    }
    openSheet('refundStoreInboundSheet');

    if (confirmBtn) {
      confirmBtn.onclick = function () {
        var raw = qtyInput ? String(qtyInput.value || '').trim() : '';
        var actual = parseInt(raw, 10);
        if (isNaN(actual) || actual < 0) {
          showToast(mode === 'warehouse' ? '请输入有效的入库数量' : '请输入有效的收到数量');
          return;
        }
        if (actual > applyQty) {
          showToast('实际数量不能超过申请补货数量（最多' + applyQty + '件）');
          return;
        }
        closeSheet('refundStoreInboundSheet');
        if (mode === 'warehouse') {
          app.storeInbound = true;
          app.storeInboundAt = formatDateTime();
        } else {
          app.expressReceived = true;
          app.expressReceivedAt = formatDateTime();
        }
        completeRestockCloseApp(
          app,
          refundType,
          mode === 'warehouse' ? 'store_inbound' : 'manual_client',
          actual
        );
        showToast(
          mode === 'warehouse'
            ? '入库成功，实际补货数量 ' + actual
            : '已确认收货，实际补货数量 ' + actual
        );
        window.setTimeout(function () {
          window.location.href = buildDetailHref({
            type: refundType,
            stage: 'success',
            shipped: '1'
          });
        }, 500);
      };
    }
  }

  /** @deprecated 使用 openRestockReceiveSheet */
  function openStoreInboundSheet(app, refundType, item) {
    openRestockReceiveSheet(app, refundType, item, 'warehouse');
  }

  function getReturnSectionTip(refundType, delivery) {
    if (refundType === 'exchange') {
      return '平台已同意换货，请将原商品寄回以下地址，并在下方填写退货物流信息。';
    }
    var mode = delivery || getDelivery();
    if (isPickupDelivery(mode)) return RETURN_ADDRESSES.store.tip;
    if (isExpressDelivery(mode)) return RETURN_ADDRESSES.supplier.tip;
    return RETURN_ADDRESSES.warehouse.tip;
  }

  function ensureRejectReturnData(app, state) {
    if (!app.rejectReceiveReason) {
      app.rejectReceiveReason = '退货商品与申请不符，不符合退货要求';
    }
    if (!app.backCourier) {
      app.backCourier = app.courier || (state && state.courier) || '顺丰速运';
    }
    if (!app.backTrackingNo) {
      app.backTrackingNo = 'SF9876543210987';
    }
    if (!app.backLogisticsStatus) {
      app.backLogisticsStatus = '运输中';
    }
    if (app.backSigned && app.backLogisticsStatus !== '已签收') {
      app.backLogisticsStatus = '已签收';
    }
    saveApplication(app);
    return app;
  }

  function getRefundType() {
    var type = (getParams().get('type') || '').trim();
    if (type === 'return' || type === 'restock' || type === 'exchange' || type === 'refund_only') {
      return type;
    }
    // 兼容旧链接：用 from / 本地申请单推断类型（如 from=restock.html&stage=failed）
    var from = String(getParams().get('from') || '').toLowerCase();
    if (from.indexOf('restock') >= 0) return 'restock';
    if (from.indexOf('exchange') >= 0) return 'exchange';
    if (from.indexOf('return') >= 0) return 'return';
    try {
      var app = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (app && app.formType) {
        if (app.formType === 'restock' || app.formType === 'exchange' || app.formType === 'return') {
          return app.formType;
        }
        if (app.formType === 'pre_ship' || app.formType === 'refund_only') return 'refund_only';
      }
    } catch (e) {
      /* ignore */
    }
    return 'refund_only';
  }

  function getDetailStage() {
    var stage = (getParams().get('stage') || 'audit').trim();
    if (['audit', 'return', 'refund', 'reship', 'reject_return', 'success', 'failed', 'closed'].indexOf(stage) >= 0) return stage;
    return 'audit';
  }

  function isResultStage(stage) {
    return stage === 'success' || stage === 'failed' || stage === 'closed';
  }

  function getCloseReason() {
    var reason = (getParams().get('closeReason') || 'cancel').trim();
    if (reason === 'timeout') return 'timeout';
    if (reason === 'reject_receive' || reason === 'rejected') return 'reject_receive';
    if (reason === 'close_return') return 'close_return';
    return 'cancel';
  }

  function buildRejectedReceiveCloseText(delivery) {
    var party = getReturnConfirmParty(delivery);
    var applyLabel = isAftersaleScene() ? '售后服务申请' : '退款申请';
    return '因退货商品不符，' + party + '拒收并已退回商品，本次' + applyLabel + '关闭';
  }

  function isAftersaleScene() {
    return getScene() === 'aftersale';
  }

  function getRejectMainText(refundType) {
    if (refundType === 'restock') return '平台拒绝了本次补货申请。';
    if (refundType === 'exchange') return '平台拒绝了本次换货申请。';
    return isAftersaleScene()
      ? '平台拒绝了本次售后服务申请。'
      : '平台拒绝了本次退款申请。';
  }

  function getResultTitle(refundType, stage) {
    if (refundType === 'restock') {
      if (stage === 'success') return '补货完成';
      if (stage === 'failed') return '补货失败';
      if (stage === 'closed') return '补货关闭';
    }
    if (refundType === 'exchange') {
      if (stage === 'success') return '换货完成';
      if (stage === 'failed') return '换货失败';
      if (stage === 'closed') return '换货关闭';
    }
    if (stage === 'success') return '退款成功';
    if (stage === 'failed') return '退款失败';
    if (stage === 'closed') return '退款关闭';
    return '退款成功';
  }

  function getDetailNavTitle(refundType) {
    if (refundType === 'restock') return '补货详情';
    if (refundType === 'exchange') return '换货详情';
    if (refundType === 'return') return '退货详情';
    return '退款详情';
  }

  function getDefaultRejectReason(refundType) {
    if (refundType === 'restock') return '补货申请不符合要求，已被拒绝';
    if (refundType === 'exchange') return '换货申请不符合要求，已被拒绝';
    return '客户自身原因导致商品损坏，不符退货要求。';
  }

  function computeRefundBreakdown(total) {
    return [{ label: '退回微信', amount: total }];
  }

  function buildReapplyHref(app) {
    var formType = (app && app.formType) || 'refund_only';
    var scene = getScene();
    if (formType === 'pre_ship' || scene === 'pre_ship') {
      return 'order-refund-pre-ship.html?' + buildQuery({ scene: 'pre_ship' });
    }
    if (formType === 'return') {
      return 'order-refund-return.html?' + buildQuery({ scene: scene });
    }
    if (formType === 'restock') {
      return 'order-refund-restock.html?' + buildQuery({ scene: scene });
    }
    if (formType === 'exchange') {
      return 'order-refund-exchange.html?' + buildQuery({ scene: scene });
    }
    if (scene === 'aftersale') {
      return 'order-refund-select.html?' + buildQuery({ scene: 'aftersale' });
    }
    return 'order-refund-select.html?' + buildQuery({ scene: scene || 'post_ship' });
  }

  function formatDateTime(date) {
    var d = date || new Date();
    var pad = function (n) {
      return n < 10 ? '0' + n : String(n);
    };
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function formatResultDateTime(date) {
    var d = date instanceof Date ? date : parseDateTimeText(date) || new Date();
    return (
      d.getFullYear() +
      '-' +
      (d.getMonth() + 1) +
      '-' +
      d.getDate() +
      ' ' +
      pad2(d.getHours()) +
      ':' +
      pad2(d.getMinutes())
    );
  }

  function isClosedHeroLayout(refundType, stage) {
    return stage === 'closed' && (refundType === 'return' || refundType === 'refund_only');
  }

  function getClosedHeroTexts(refundType, app) {
    var closeReason = getCloseReason();
    var isReturn = refundType === 'return';
    var title = '';
    var sub = '';
    var notice = '';
    if (closeReason === 'cancel') {
      title = '因您撤销，退款已关闭';
      sub = '若您的问题未解决，可在有效期内再次申请售后';
    } else if (closeReason === 'close_return') {
      title = '因您撤销，退款已关闭';
      sub = '若您的问题未解决，可在有效期内再次申请售后';
      notice = '关闭原因：' + (app.closeReturnReason || '计划有变，暂时不需要寄了');
    } else if (closeReason === 'timeout') {
      title = isReturn ? '因您超时未寄回，退款已关闭' : '因您超时未处理，退款已关闭';
      sub = '若您的问题未解决，可在有效期内再次申请售后';
    } else if (closeReason === 'reject_receive') {
      title = '因退货商品不符，退款已关闭';
      sub = '若您的问题未解决，可在有效期内再次申请售后';
      notice =
        '关闭原因：' +
        (app.rejectReceiveReason || '退货商品与申请不符，不符合退货要求');
    } else {
      title = getResultTitle(refundType, 'closed');
      sub = '若您的问题未解决，可在有效期内再次申请售后';
    }
    return { title: title, sub: sub, notice: notice };
  }

  function renderClosedHeroSteps(refundType) {
    var el = document.getElementById('refundDetailSteps');
    if (!el) return;
    var steps =
      refundType === 'return'
        ? RETURN_STEPS.slice()
        : refundType === 'refund_only'
          ? REFUND_ONLY_STEPS.slice()
          : RETURN_STEPS.slice();
    if (steps.length) steps[steps.length - 1] = '退款结束';
    var activeIdx = steps.length - 1;
    var checkSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>';
    el.innerHTML = steps
      .map(function (label, idx) {
        var cls = 'ua-or-detail-step';
        if (idx < activeIdx) cls += ' is-done';
        else if (idx === activeIdx) cls += ' is-active';
        else cls += ' is-pending';
        return (
          '<div class="' +
          cls +
          '"><div class="ua-or-detail-step__dot">' +
          (idx <= activeIdx ? checkSvg : '') +
          '</div><div class="ua-or-detail-step__label">' +
          escapeHtml(label) +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderClosedHeroResult(refundType, stage, app, item, delivery, resultTime) {
    var shell = document.querySelector('.ua-order-refund-detail-page');
    if (shell) {
      shell.classList.add('ua-order-refund-detail-page--closed-hero');
    }
    if (!app.resultTime) {
      app.resultTime = resultTime;
      saveApplication(app);
    }

    var closedHead = document.getElementById('refundClosedCancelHead');
    if (closedHead) closedHead.hidden = true;

    var hero = document.getElementById('refundDetailHero');
    var noticeEl = document.getElementById('refundDetailNotice');
    var returnSection = document.getElementById('refundDetailReturnSection');
    var resultHead = document.getElementById('refundResultHead');
    var breakdown = document.getElementById('refundResultBreakdown');
    var messageCard = document.getElementById('refundResultMessage');
    var infoTitle = document.getElementById('refundInfoSectionTitle');

    if (hero) hero.hidden = false;
    if (returnSection) returnSection.hidden = true;
    if (resultHead) resultHead.hidden = true;
    if (breakdown) breakdown.hidden = true;
    if (messageCard) messageCard.hidden = true;
    if (infoTitle) infoTitle.hidden = true;

    var copy = getClosedHeroTexts(refundType, app);
    var titleEl = document.getElementById('refundDetailStatusTitle');
    var timerEl = document.getElementById('refundDetailTimer');
    if (titleEl) titleEl.textContent = copy.title;
    if (timerEl) timerEl.textContent = copy.sub;

    if (noticeEl) {
      if (copy.notice) {
        noticeEl.hidden = false;
        noticeEl.textContent = copy.notice;
        noticeEl.classList.remove('ua-or-detail-notice--demo');
      } else {
        noticeEl.hidden = true;
        noticeEl.textContent = '';
      }
    }

    var stepsEl = document.getElementById('refundDetailSteps');
    if (stepsEl) {
      stepsEl.innerHTML = '';
      stepsEl.hidden = true;
    }

    renderDetailInfoCard(app, item, refundType);

    var footer = document.getElementById('refundDetailFooter');
    if (footer) {
      footer.innerHTML = '';
      footer.hidden = true;
    }
    if (shell) shell.classList.add('is-footer-hidden');
  }

  function isCancelClosedLayout(refundType, stage) {
    return (
      stage === 'closed' &&
      getCloseReason() === 'cancel' &&
      (refundType === 'return' || refundType === 'refund_only')
    );
  }

  function renderCancelClosedNavSteps(refundType) {
    var navSteps = document.getElementById('refundDetailNavSteps');
    if (!navSteps) return;
    var steps =
      refundType === 'return' ? ['商家处理', '寄回商品', '退款结束'] : ['商家处理', '退款结束'];
    var activeIdx = steps.length - 1;
    navSteps.hidden = false;
    navSteps.innerHTML = steps
      .map(function (label, idx) {
        var cls = 'ua-or-nav-step';
        if (idx < activeIdx) cls += ' is-done';
        else if (idx === activeIdx) cls += ' is-active';
        if (idx < activeIdx) {
          return (
            '<span class="' +
            cls +
            '"><span class="ua-or-nav-step__label">' +
            escapeHtml(label) +
            '</span><span class="ua-or-nav-step__mark" aria-hidden="true">✓</span></span>'
          );
        }
        return (
          '<span class="' +
          cls +
          '"><span class="ua-or-nav-step__mark">' +
          (idx + 1) +
          '</span><span class="ua-or-nav-step__label">' +
          escapeHtml(label) +
          '</span></span>'
        );
      })
      .join('');
  }

  function bindSellerFooterBtn() {
    var btn = document.getElementById('refundDetailSellerBtn');
    if (btn && !btn.getAttribute('data-bound')) {
      btn.setAttribute('data-bound', '1');
      btn.addEventListener('click', function () {
        showToast('正在连接卖家客服…');
      });
    }
  }

  function renderCancelClosedFooter() {
    var footer = document.getElementById('refundDetailFooter');
    var shell = document.querySelector('.ua-order-refund-detail-page');
    if (!footer) return;
    footer.hidden = false;
    if (shell) shell.classList.remove('is-footer-hidden');
    footer.className = 'ua-or-detail-footer ua-or-detail-footer--seller';
    footer.innerHTML =
      '<button type="button" class="ua-or-detail-footer__seller" id="refundDetailSellerBtn" aria-label="联系卖家">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6.5h16a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9l-5 3.5V8a1.5 1.5 0 011.5-1.5z"/></svg>' +
      '<span>卖家</span></button>';
    bindSellerFooterBtn();
  }

  function genRefundNo() {
    var d = new Date();
    var pad = function (n) {
      return n < 10 ? '0' + n : String(n);
    };
    return (
      'TK' +
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds()) +
      '001'
    );
  }

  function loadApplication() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveApplication(data) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function buildDetailHref(extra) {
    return 'order-refund-detail.html?' + buildQuery(extra);
  }

  function getPickupEditFrom() {
    var from = (getParams().get('pickupEditFrom') || '').trim();
    return from === 'pickup_order' ? 'pickup_order' : 'detail';
  }

  function getAddrFrom() {
    return (getParams().get('addrFrom') || '').trim();
  }

  function buildProfileReturnHref() {
    var from = getParams().get('from') || 'restock.html?tab=me';
    try {
      return decodeURIComponent(from);
    } catch (e) {
      return from;
    }
  }

  function buildCheckoutReturnHref() {
    var from = getParams().get('from') || 'restock.html';
    return 'checkout.html?from=' + encodeURIComponent(from);
  }

  function buildPickupEditReturnHref(extra) {
    extra = extra || {};
    var refundType = extra.type || getRefundType() || 'return';
    var stage = extra.stage || getDetailStage() || 'return';
    var from = extra.pickupEditFrom != null ? extra.pickupEditFrom : getPickupEditFrom();
    if (from === 'pickup_order') {
      var phase =
        extra.pickupPhase != null ? extra.pickupPhase : getParams().get('pickupPhase') || '';
      return buildPickupOrderHref({
        type: refundType,
        stage: stage,
        pickupPhase: phase || ''
      });
    }
    return buildDetailHref({
      type: refundType,
      stage: stage,
      pickupPhase: ''
    });
  }

  function buildPickupEditHref(extra) {
    extra = Object.assign({}, extra || {});
    if (!extra.pickupEditFrom) extra.pickupEditFrom = getPickupEditFrom();
    return 'order-refund-pickup-edit.html?' + buildQuery(extra);
  }

  function buildReturnShipHref(extra) {
    return 'order-refund-return-ship.html?' + buildQuery(extra || {});
  }

  function buildPickupOrderHref(extra) {
    return 'order-refund-pickup-order.html?' + buildQuery(extra || {});
  }

  /**
   * 寄回商品「退货物流」：进入寄件物流详情页（pickup-order），
   * 与门店/用户 APP 共用，节点样式为待取件 / 取件后进度面板，不是订单正向物流页。
   */
  function ensureReturnLogisticsDetailReady(app) {
    app = app || loadApplication() || {};
    var savedCourier =
      app.courier && app.courier !== '上门取件' ? app.courier : '';
    var savedWaybill = app.waybillNo || (savedCourier ? app.trackingNo : '') || '';
    var wantPhase =
      getEffectivePickupPhase(app) ||
      (savedWaybill || hasSelfShipTracking(app) ? 'picked' : '');

    if (!isPickupScheduled(app)) {
      autoSchedulePlatformPickup(app);
      app = loadApplication() || app;
    }
    ensurePickupBoardData(app);
    app = loadApplication() || app;

    if (wantPhase === 'transit') {
      markPickupInTransit(app);
    } else if (wantPhase === 'picked') {
      markPickupPickedUp(app);
    }
    app = loadApplication() || app;
    /* mark 后回写自行寄回的承运商/运单，避免被默认申通覆盖 */
    if (savedCourier || savedWaybill) {
      if (savedCourier) app.courier = savedCourier;
      if (savedWaybill) {
        app.waybillNo = savedWaybill;
        app.trackingNo = savedWaybill;
      }
      saveApplication(app);
    }
    return app;
  }

  function buildReturnLogisticsDetailHref(extra) {
    extra = extra || {};
    var app = ensureReturnLogisticsDetailReady(loadApplication() || {});
    var phase =
      extra.pickupPhase != null && extra.pickupPhase !== ''
        ? extra.pickupPhase
        : getEffectivePickupPhase(app) || '';
    var stage = extra.stage || getDetailStage() || 'return';
    /* 快递寄回后详情仍属寄回商品节点 */
    if (
      stage === 'refund' &&
      isExpressDelivery(app.delivery || getDelivery()) &&
      !isMerchantConfirmedReceive(app)
    ) {
      stage = 'return';
    }
    return buildPickupOrderHref({
      type: extra.type || getRefundType() || 'return',
      stage: stage,
      pickupPhase: phase
    });
  }

  function buildReturnGoodsHref(extra) {
    return 'order-refund-return-goods.html?' + buildQuery(extra || {});
  }

  function buildAddressBookHref(extra) {
    return 'order-refund-address-book.html?' + buildQuery(extra || {});
  }

  function buildAddressCreateHref(extra) {
    return 'order-refund-address-create.html?' + buildQuery(extra || {});
  }

  function buildPreShipHrefWithEdit() {
    return 'order-refund-pre-ship.html?' + buildQuery({ edit: '1' });
  }

  function buildFormHref(formType) {
    if (formType === 'pre_ship') return buildPreShipHrefWithEdit();
    if (formType === 'return') return 'order-refund-return.html?' + buildQuery({ edit: '1' });
    return 'order-refund-only.html?' + buildQuery({ edit: '1' });
  }

  function resetRefundFlowForNewApplication(app) {
    if (!app) return app;
    app.pickupScheduled = false;
    delete app.pickupPhase;
    delete app.pickupCode;
    delete app.pickupTime;
    delete app.expressOrderNo;
    delete app.expressOrderTime;
    delete app.waybillNo;
    delete app.pickupPickedTime;
    delete app.pickupTransitTime;
    delete app.pickupTransitDetail;
    delete app.shippingFeeGuard;
    delete app.pickupCanceled;
    app.pickupCourierStatus = '';
    if (!app.returnShipTab || app.returnShipTab === 'pickup') {
      delete app.courier;
      delete app.courierId;
      delete app.trackingNo;
    }
    return app;
  }

  function persistAndGoDetail(formType, payload) {
    var item = getItem();
    var existing = loadApplication() || {};
    var isEdit = getParams().get('edit') === '1';
    var app = Object.assign({}, existing, payload, {
      formType: formType,
      itemIndex: getItemIndex(),
      delivery: getDelivery(),
      applyTime: isEdit && existing.applyTime ? existing.applyTime : formatDateTime(),
      refundNo: isEdit && existing.refundNo ? existing.refundNo : genRefundNo(),
      productName: item.name,
      productSpec: item.spec,
      productImg: item.img
    });
    if (formType === 'restock') {
      app.applyQty = getApplyRestockQty(app, item);
      app.qty = app.applyQty;
    }
    if (!isEdit) {
      resetRefundFlowForNewApplication(app);
      app.aftersaleId = app.refundNo;
    }
    saveApplication(app);
    var typeMap = { return: 'return', restock: 'restock', exchange: 'exchange', pre_ship: 'refund_only' };
    var type = typeMap[formType] || 'refund_only';
    syncAftersaleRecordFromApp(app, type, 'audit');
    window.location.href = buildDetailHref({
      type: type,
      stage: 'audit',
      reason: app.reason || '',
      pickupPhase: '',
      asId: app.aftersaleId || app.refundNo || ''
    });
  }

  function bindDescAndUpload(state, descInput, descCount, uploadGrid, item, onChange) {
    if (descInput) {
      descInput.addEventListener('input', function () {
        var text = descInput.value.slice(0, 200);
        descInput.value = text;
        state.desc = text;
        if (descCount) descCount.textContent = String(text.length);
        if (typeof onChange === 'function') onChange();
      });
    }

    function renderUploads() {
      if (!uploadGrid) return;
      var html = state.images
        .map(function (src, idx) {
          return (
            '<div class="ua-or-upload__item">' +
            '<img src="' +
            src +
            '" alt="">' +
            '<button type="button" class="ua-or-upload__remove" data-remove-idx="' +
            idx +
            '">×</button></div>'
          );
        })
        .join('');
      if (state.images.length < 3) {
        html +=
          '<button type="button" class="ua-or-upload__add" id="refundUploadAdd">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>' +
          '<span>上传凭证<br><em>(最多3张)</em></span></button>';
      }
      uploadGrid.innerHTML = html;
      var addBtn = document.getElementById('refundUploadAdd');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          if (state.images.length >= 3) return;
          state.images.push(item.img);
          renderUploads();
          if (typeof onChange === 'function') onChange();
        });
      }
      uploadGrid.querySelectorAll('[data-remove-idx]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
          state.images.splice(idx, 1);
          renderUploads();
          if (typeof onChange === 'function') onChange();
        });
      });
    }

    renderUploads();
    return renderUploads;
  }

  function getDefaultPickupAddress() {
    return PICKUP_ADDRESSES[0];
  }

  function isPickupScheduled(app) {
    if (!app) return false;
    if (app.pickupScheduled === false) return false;
    return !!(app.pickupScheduled || app.expressOrderNo || (app.pickupTime && app.pickupCode));
  }

  function getPickupPhaseFromUrl() {
    var phase = getParams().get('pickupPhase') || '';
    if (phase === 'transit') return 'transit';
    if (phase === 'picked') return 'picked';
    return '';
  }

  /** URL 优先，其次应用态（避免仅写了 app.pickupPhase 时寄回态丢失） */
  function getEffectivePickupPhase(app) {
    var urlPhase = getPickupPhaseFromUrl();
    if (urlPhase) return urlPhase;
    if (app && (app.pickupPhase === 'transit' || app.pickupPhase === 'picked')) {
      return app.pickupPhase;
    }
    return '';
  }

  function isPickupPickedUp(app) {
    return getEffectivePickupPhase(app) === 'picked';
  }

  function isPickupInTransit(app) {
    return getEffectivePickupPhase(app) === 'transit';
  }

  function isPickupPostCollect(app) {
    var phase = getEffectivePickupPhase(app);
    return phase === 'picked' || phase === 'transit';
  }

  function isStoreReturnReceived(app) {
    return !!(app && app.storeReceivedReturn);
  }

  function markStoreReceivedReturn(app) {
    app = app || {};
    app.storeReceivedReturn = true;
    app.storeReceivedReturnAt = formatDateTime();
    saveApplication(app);
    return app;
  }

  /** 快递退货：商家/供应商确认收货后才进入平台退款（对齐门店快递退货） */
  function isMerchantConfirmedReceive(app) {
    return !!(app && app.merchantConfirmedReceive);
  }

  function markMerchantConfirmedReceive(app) {
    app = app || {};
    app.merchantConfirmedReceive = true;
    app.merchantConfirmedReceiveAt = formatDateTime();
    saveApplication(app);
    return app;
  }

  function isExpressReturnFlow(delivery) {
    var mode = delivery || getDelivery();
    return isExpressDelivery(mode);
  }

  /** 零售自提补货到店：标记待自提（随原订单核销，清理历史误生成的补货核销码） */
  function ensureRestockArriveStore(app) {
    app = app || {};
    if (!app.restockArriveStoreAt) {
      app.restockArriveStoreAt = formatDateTime();
    }
    app.restockAwaitPickup = true;
    /* 补货不单独建单/核销码，随原订单提货 */
    if (app.restockPickupCode) delete app.restockPickupCode;
    saveApplication(app);
    return app;
  }

  function isRestockAwaitPickup(app) {
    return !!(app && app.restockAwaitPickup && !app.restockPickedUp);
  }

  function markRestockPickedUp(app) {
    app = app || {};
    app.restockPickedUp = true;
    app.restockPickedUpAt = formatDateTime();
    app.restockAwaitPickup = false;
    if (app.restockPickupCode) delete app.restockPickupCode;
    saveApplication(app);
    return app;
  }

  var RESTOCK_AUTO_CONFIRM_DAYS = 10;

  /**
   * 补货关闭规则（演示）：
   * 1) 后台确认收货  2) 门店/用户端确认收货
   * 3) 快递上传物流满 10 天自动确认（实际数=申请数）
   * 4) 代采配送：待收货满 10 天自动确认；门店入库反写关闭（零售无此路径）
   * 5) 零售自提：待核销满 10 天自动确认（不再因原单全量核销反写关闭）
   */
  function getRestockAutoConfirmAnchor(app) {
    if (!app) return null;
    if (isPickupRestock(app)) return app.restockArriveStoreAt || app.outShipTime || null;
    if (isWarehouseRestock(app)) {
      return app.restockAwaitReceiveAt || app.outShipTime || app.applyTime || null;
    }
    return app.outShipTime || app.expressReceivedAt || null;
  }

  function isRestockAutoConfirmDue(app) {
    if (getParams().get('autoClose') === '1') return true;
    var anchor = getRestockAutoConfirmAnchor(app);
    var t = parseDateTimeText(anchor);
    if (!t) return false;
    return Date.now() - t.getTime() >= RESTOCK_AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000;
  }

  function completeRestockCloseApp(app, refundType, source, actualQty) {
    app = app || loadApplication() || {};
    refundType = refundType || 'restock';
    var applyQty = getApplyRestockQty(app);
    var actual = actualQty != null ? Number(actualQty) : applyQty;
    if (isNaN(actual) || actual < 0) actual = applyQty;
    if (actual > applyQty) actual = applyQty;
    app.applyQty = applyQty;
    app.qty = applyQty;
    app.actualRestockQty = actual;
    app.resultTime = formatDateTime();
    app.outShipped = true;
    app.restockCloseSource = source || 'manual';
    app.restockClosedAt = formatDateTime();
    if (source === 'store_inbound' || isWarehouseRestock(app, refundType)) {
      app.storeInbound = true;
      app.storeInboundAt = app.storeInboundAt || formatDateTime();
    }
    if (isPickupRestock(app, refundType)) {
      ensureRestockArriveStore(app);
    }
    saveApplication(app);
    syncAftersaleRecordFromApp(app, refundType, 'success');
    return app;
  }

  /** 详情页加载时尝试自动/反写关闭补货；返回是否已关闭并需跳转成功页 */
  function tryAutoCloseRestockOnDetail(app, refundType) {
    if (refundType !== 'restock') return false;
    var stage = getDetailStage();
    if (stage === 'success' || stage === 'failed' || stage === 'closed') return false;
    app = app || loadApplication() || {};
    if (!isReshipShipped(app) && !isWarehouseRestock(app, refundType) && !isPickupRestock(app, refundType)) {
      return false;
    }

    /* 代采配送：门店入库反写关闭（零售自提核销不反写关闭补货） */
    if (isWarehouseRestock(app, refundType) && app.storeInbound && getActualRestockQty(app) == null) {
      completeRestockCloseApp(app, refundType, 'store_inbound');
      return true;
    }
    if (isPickupRestock(app, refundType) && !app.restockArriveStoreAt && isReshipShipped(app)) {
      ensureRestockArriveStore(app);
    }
    if (isWarehouseRestock(app, refundType) && !app.restockAwaitReceiveAt && isReshipShipped(app)) {
      app.restockAwaitReceiveAt = app.outShipTime || formatDateTime();
      saveApplication(app);
    }
    if (!isRestockAutoConfirmDue(app)) return false;
    if (isPickupRestock(app, refundType)) {
      completeRestockCloseApp(app, refundType, 'auto_pickup');
      return true;
    }
    if (isWarehouseRestock(app, refundType)) {
      completeRestockCloseApp(app, refundType, 'auto_delivery');
      return true;
    }
    completeRestockCloseApp(app, refundType, 'auto_express');
    return true;
  }

  function isReturnShipCompleted(app) {
    if (!app) return false;
    var delivery = app.delivery || getDelivery();
    /* 零售自提：门店确认收到退货后进入平台退款 */
    if (isPickupDelivery(delivery)) {
      return isStoreReturnReceived(app);
    }
    /* 配送：司机取货后进入待仓库入库（对应后台待收货） */
    if (isWarehouseDelivery(delivery)) {
      return isDeliveryDriverPicked(app);
    }
    /* 快递：已预约取件并揽收 / 已填运单，即视为已寄回（仍停在寄回商品，待后台确认收货） */
    var urlPhase = getPickupPhaseFromUrl();
    if (
      app.pickupPhase === 'picked' ||
      app.pickupPhase === 'transit' ||
      urlPhase === 'picked' ||
      urlPhase === 'transit'
    ) {
      return true;
    }
    return hasSelfShipTracking(app);
  }

  function resetDeliveryReturnProgress(app) {
    app = app || {};
    app.driverPickedUp = false;
    app.warehouseInbound = false;
    delete app.driverPickedAt;
    delete app.warehouseInboundAt;
    saveApplication(app);
    return app;
  }

  function markDeliveryDriverPicked(app) {
    app = app || {};
    app.driverPickedUp = true;
    app.driverPickedAt = formatDateTime();
    /* 取货后进入待入库，入库标记必须清空，避免直接跳到平台退款 */
    app.warehouseInbound = false;
    delete app.warehouseInboundAt;
    saveApplication(app);
    return app;
  }

  function markDeliveryWarehouseInbound(app) {
    app = app || {};
    app.driverPickedUp = true;
    app.driverPickedAt = app.driverPickedAt || formatDateTime();
    app.warehouseInbound = true;
    app.warehouseInboundAt = formatDateTime();
    saveApplication(app);
    return app;
  }

  function truncateTrackingDisplay(no) {
    var s = String(no || '');
    if (s.length <= 6) return s;
    return s.slice(0, 4) + '...';
  }

  function formatDayHourMinTimer(remainMs) {
    var d = Math.floor(remainMs / 86400000);
    var h = Math.floor((remainMs % 86400000) / 3600000);
    var m = Math.floor((remainMs % 3600000) / 60000);
    return d + '天' + h + '时' + m + '分';
  }

  function renderRefundStageCards(app) {
    app = app || {};
    var section = document.getElementById('refundDetailRefundStage');
    if (!section) return;
    var courierLabel =
      app.courier && app.courier !== '上门取件' ? app.courier : '上门取件';
    var waybill =
      courierLabel === '上门取件'
        ? app.pickupCode || app.trackingNo || app.waybillNo || ''
        : app.waybillNo || app.trackingNo || app.pickupCode || '';
    var mainEl = document.getElementById('refundReturnLogisticsMain');
    var subEl = document.getElementById('refundReturnLogisticsSub');
    var feeEl = document.getElementById('refundReturnFeeGuardSub');
    if (mainEl) {
      mainEl.textContent =
        '退货物流：已下单 ' +
        courierLabel +
        ' 运单号:' +
        truncateTrackingDisplay(waybill);
    }
    if (subEl) subEl.textContent = '商品已经下单';
    if (feeEl) {
      var fee = app.shippingFeeGuard != null ? app.shippingFeeGuard : '5.40';
      feeEl.textContent =
        '您已享受全额保障' + (String(fee).indexOf('¥') >= 0 ? fee : String(fee) + '元');
    }
  }

  function syncDetailStageCards(refundType, stage, app) {
    var isReturn = refundType === 'return';
    var isExchange = refundType === 'exchange';
    var delivery = (app && app.delivery) || getDelivery();
    var warehouseReturn = isReturn && isWarehouseDelivery(delivery);
    var pickupReturn = isReturn && isPickupDelivery(delivery);
    var expressReturn = isReturn && isExpressReturnFlow(delivery);
    var shipDone = isReturnShipCompleted(app);
    var returnSection = document.getElementById('refundDetailReturnSection');
    var refundStageSection = document.getElementById('refundDetailRefundStage');
    var pickupActions = document.getElementById('refundPickupActions');
    /* 自提退货不走快递寄回/上门取件卡片 */
    var showReturnCard =
      !pickupReturn &&
      ((isReturn && stage === 'return') ||
        (isExchange && stage === 'return') ||
        (warehouseReturn && stage === 'refund'));
    /*
     * 快递退货：寄回商品（已填物流）与平台退款阶段都展示「退货物流」入口
     * 点击进入寄件物流详情页（pickup-order，待取件/取件后节点样式）
     * 已寄回后隐藏上门取件看板，避免与「退货物流」并存
     */
    var showLogisticsCard =
      expressReturn &&
      shipDone &&
      (stage === 'return' || stage === 'refund');
    var pickupReady =
      showReturnCard &&
      (warehouseReturn || (isPickupScheduled(app) && !(expressReturn && shipDone)));

    if (refundStageSection) refundStageSection.hidden = !showLogisticsCard;
    if (returnSection) returnSection.hidden = !pickupReady;
    if (pickupActions) pickupActions.hidden = !pickupReady || warehouseReturn;
    if (showLogisticsCard) renderRefundStageCards(app);
  }

  function truncateTrackingNo(no) {
    var s = String(no || '');
    if (s.length <= 8) return s;
    return s.slice(0, 4) + '...';
  }

  function getReturnShipCourier(app) {
    app = app || {};
    if (app.courier && app.courier !== '上门取件') return app.courier;
    return '申通快递';
  }

  function getReturnShipTrackingNo(app) {
    app = app || {};
    return app.waybillNo || app.trackingNo || '772071763686613';
  }

  function resetPickupPickedDemoState(app) {
    if (!app) return app;
    delete app.pickupPhase;
    delete app.waybillNo;
    delete app.pickupPickedTime;
    delete app.pickupTransitTime;
    delete app.pickupTransitDetail;
    if (isPickupScheduled(app)) {
      app.courier = '上门取件';
      app.trackingNo = app.pickupCode;
      app.pickupCourierStatus = app.pickupCourierStatus || '快递员已接单';
    }
    saveApplication(app);
    return app;
  }

  function markPickupPickedUp(app) {
    if (!app) return app;
    if (app.pickupPhase !== 'transit') app.pickupPhase = 'picked';
    if (!app.waybillNo) app.waybillNo = '772071763686613';
    if (!app.pickupPickedTime) app.pickupPickedTime = formatDateTime();
    app.courier = '申通快递';
    app.trackingNo = app.waybillNo;
    if (!isPickupInTransit(app)) {
      app.pickupCourierStatus = '快递员已取包裹，即将开始运输';
    }
    if (app.shippingFeeGuard == null) app.shippingFeeGuard = '5.40';
    saveApplication(app);
    return app;
  }

  function markPickupInTransit(app) {
    if (!app) return app;
    markPickupPickedUp(app);
    app.pickupPhase = 'transit';
    if (!app.pickupTransitTime) app.pickupTransitTime = formatDateTime();
    app.pickupTransitDetail =
      app.pickupTransitDetail ||
      '【杭州市】快件已发往 江苏江阴转运中心，可关注"申通快递"官方微信公众号获取实时物流信息';
    app.pickupCourierStatus = '运输中';
    saveApplication(app);
    return app;
  }

  function ensurePickupPickedData(app) {
    if (!app || !isPickupPickedUp(app)) return app;
    return markPickupPickedUp(app);
  }

  function ensurePickupPostCollectData(app) {
    if (!app || !isPickupPostCollect(app)) return app;
    markPickupPickedUp(app);
    if (isPickupInTransit(app)) markPickupInTransit(app);
    return app;
  }

  function clearPickupScheduled(app) {
    if (!app) return;
    var pickupCode = app.pickupCode;
    var mergeKey = app.pickupMergeKey;
    var memberId = getAppPickupMemberId(app);
    if (mergeKey) unregisterMergedPickupMember(mergeKey, memberId);
    app.pickupScheduled = false;
    delete app.pickupTime;
    delete app.pickupCode;
    delete app.expressOrderNo;
    delete app.expressOrderTime;
    delete app.pickupMergeKey;
    delete app.pickupMerged;
    app.pickupCourierStatus = '';
    delete app.pickupPhase;
    delete app.pickupPickedTime;
    delete app.pickupTransitTime;
    delete app.pickupTransitDetail;
    delete app.waybillNo;
    if (app.courier === '上门取件') {
      delete app.courier;
      delete app.courierId;
    }
    if (pickupCode && app.trackingNo === pickupCode) {
      delete app.trackingNo;
    }
    app.pickupCanceled = true;
    saveApplication(app);
  }

  function hasSelfShipTracking(app) {
    return !!(app && app.trackingNo && app.courier && app.courier !== '上门取件');
  }

  function autoSchedulePlatformPickup(app) {
    if (!app || isPickupScheduled(app)) return app;
    var addr = getDefaultPickupAddress();
    var defaultTime = formatPickupDisplay(addDays(startOfDay(new Date()), 1), '09:00–11:00');
    scheduleDoorPickup(app, {
      pickupAddressId: addr.id,
      pickupAddress: addr.label,
      pickupAddressFull: addr.full || addr.label,
      pickupContact: addr.contact + ' ' + addr.phone,
      pickupTime: defaultTime
    });
    delete app.pickupCanceled;
    return app;
  }

  function ensureReturnStagePickup(app) {
    var delivery = (app && app.delivery) || getDelivery();
    /* 配送退仓 / 自提退门店：不预约快递取件、不生成取件码 */
    if (isWarehouseDelivery(delivery) || isPickupDelivery(delivery)) return app;
    /* 已寄回（含 URL pickupPhase=picked）：不再自动预约上门取件 */
    if (
      hasSelfShipTracking(app) ||
      isPickupScheduled(app) ||
      app.pickupCanceled ||
      isReturnShipCompleted(app)
    ) {
      return app;
    }
    return autoSchedulePlatformPickup(app);
  }

  function shouldRedirectReturnShip(app) {
    var delivery = (app && app.delivery) || getDelivery();
    if (isWarehouseDelivery(delivery) || isPickupDelivery(delivery)) return false;
    return !hasSelfShipTracking(app) && !isPickupScheduled(app) && !!app.pickupCanceled;
  }

  function getSelfShipFormState(app) {
    app = app || {};
    if (app.courier === '上门取件' || isPickupScheduled(app)) {
      return { courierId: '', courierName: '', trackingNo: '' };
    }
    if (app.returnShipTab === 'self' && app.courier) {
      return {
        courierId: app.courierId || '',
        courierName: app.courier,
        trackingNo: app.trackingNo || ''
      };
    }
    return { courierId: '', courierName: '', trackingNo: '' };
  }

  function sanitizeReturnShipAppState(app) {
    if (!app || isPickupScheduled(app)) return app;
    var changed = false;
    if (app.courier === '上门取件') {
      delete app.courier;
      delete app.courierId;
      changed = true;
    }
    if (app.returnShipTab !== 'self' && app.trackingNo) {
      delete app.trackingNo;
      changed = true;
    }
    if (changed) saveApplication(app);
    return app;
  }

  function applySelfShipFormState(state, app) {
    var selfLogistics = getSelfShipFormState(app);
    state.courierId = selfLogistics.courierId;
    state.courierName = selfLogistics.courierName;
    state.trackingNo = selfLogistics.trackingNo;
  }

  function getMerchantReturnDisplay() {
    var delivery = getDelivery();
    var info;
    if (isPickupDelivery(delivery)) {
      info = RETURN_ADDRESSES.store;
    } else if (isWarehouseDelivery(delivery)) {
      info = RETURN_ADDRESSES.warehouse;
    } else {
      /* 快递退货退回供应商 */
      info = RETURN_ADDRESSES.supplier;
    }
    return {
      summary: info.address,
      full: info.address + ' ' + info.name + ' ' + info.phone,
      name: info.name,
      phone: info.phone,
      address: info.address,
      tip: info.tip || ''
    };
  }

  var MERGED_PICKUP_KEY = 'ua_refund_merged_pickup_v1';

  /** 需寄回商品的售后类型（退货/换货）可合并物流 */
  function getReturnShipTypeGroup(type) {
    if (type === 'exchange') return 'exchange';
    if (type === 'return' || type === 'goods') return 'return';
    return '';
  }

  function normalizeReturnAddressKey(addr) {
    return String(addr || '')
      .replace(/\s+/g, '')
      .replace(/，/g, ',')
      .toLowerCase();
  }

  function buildPickupMergeKey(delivery, shipType, returnAddress) {
    return (
      String(delivery || 'warehouse') +
      '|' +
      String(shipType || 'return') +
      '|' +
      normalizeReturnAddressKey(returnAddress)
    );
  }

  function getAppReturnAddressForMerge(app) {
    ensureReturnAddressOnApp(app || {});
    if (app && app.returnAddress) return app.returnAddress;
    var merchant = getMerchantReturnDisplay();
    return merchant.full || merchant.address || '';
  }

  function getAppPickupMemberId(app) {
    if (!app) return 'anon';
    return String(
      app.aftersaleId ||
        app.refundNo ||
        (app.orderNo || DEMO_ORDER_NO) + '_item' + (app.itemIndex != null ? app.itemIndex : getItemIndex())
    );
  }

  function loadMergedPickupPool() {
    try {
      var raw = sessionStorage.getItem(MERGED_PICKUP_KEY);
      var data = raw ? JSON.parse(raw) : null;
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function saveMergedPickupPool(pool) {
    try {
      sessionStorage.setItem(MERGED_PICKUP_KEY, JSON.stringify(pool || {}));
    } catch (e) {
      /* ignore */
    }
  }

  function findMergedPickupEntry(mergeKey) {
    var pool = loadMergedPickupPool();
    return pool[mergeKey] || null;
  }

  function upsertMergedPickupEntry(mergeKey, patch) {
    var pool = loadMergedPickupPool();
    var cur = pool[mergeKey] || {};
    pool[mergeKey] = Object.assign({}, cur, patch || {}, { mergeKey: mergeKey });
    saveMergedPickupPool(pool);
    return pool[mergeKey];
  }

  function registerMergedPickupMember(mergeKey, memberId, meta) {
    var entry = findMergedPickupEntry(mergeKey) || {};
    var members = Array.isArray(entry.members) ? entry.members.slice() : [];
    if (members.indexOf(memberId) < 0) members.push(memberId);
    return upsertMergedPickupEntry(
      mergeKey,
      Object.assign({}, entry, meta || {}, { members: members })
    );
  }

  function unregisterMergedPickupMember(mergeKey, memberId) {
    if (!mergeKey) return;
    var pool = loadMergedPickupPool();
    var entry = pool[mergeKey];
    if (!entry) return;
    var members = (entry.members || []).filter(function (id) {
      return id !== memberId;
    });
    if (!members.length) {
      delete pool[mergeKey];
    } else {
      entry.members = members;
      pool[mergeKey] = entry;
    }
    saveMergedPickupPool(pool);
  }

  /**
   * 同履约方式 + 同售后寄回类型 + 同回退地址 → 合并为同一物流单，共用取件码/快递单号
   * 快递(store)、配送(warehouse) 均适用
   */
  function resolveMergedPickupForApp(app, shipType) {
    app = app || {};
    var delivery = app.delivery || getDelivery();
    var typeGroup = getReturnShipTypeGroup(shipType || app.formType || getRefundType());
    if (!typeGroup) return null;
    var returnAddr = getAppReturnAddressForMerge(app);
    var mergeKey = buildPickupMergeKey(delivery, typeGroup, returnAddr);
    var existing = findMergedPickupEntry(mergeKey);
    var memberId = getAppPickupMemberId(app);
    if (existing && existing.pickupCode) {
      registerMergedPickupMember(mergeKey, memberId, {
        delivery: delivery,
        shipType: typeGroup,
        returnAddress: returnAddr,
        pickupCode: existing.pickupCode,
        expressOrderNo: existing.expressOrderNo,
        expressOrderTime: existing.expressOrderTime,
        pickupTime: existing.pickupTime || app.pickupTime,
        pickupCourierPhone: existing.pickupCourierPhone || '4008001234'
      });
      return {
        mergeKey: mergeKey,
        pickupCode: existing.pickupCode,
        expressOrderNo: existing.expressOrderNo,
        expressOrderTime: existing.expressOrderTime,
        pickupTime: existing.pickupTime,
        pickupCourierPhone: existing.pickupCourierPhone,
        merged: true,
        memberCount: (existing.members || []).length
      };
    }
    var pickupCode = app.pickupCode || String(Math.floor(1000 + Math.random() * 9000));
    var expressOrderNo = app.expressOrderNo || String(Date.now()).slice(-17);
    var expressOrderTime = app.expressOrderTime || formatDateTime();
    registerMergedPickupMember(mergeKey, memberId, {
      delivery: delivery,
      shipType: typeGroup,
      returnAddress: returnAddr,
      pickupCode: pickupCode,
      expressOrderNo: expressOrderNo,
      expressOrderTime: expressOrderTime,
      pickupTime: app.pickupTime || '',
      pickupCourierPhone: app.pickupCourierPhone || '4008001234'
    });
    return {
      mergeKey: mergeKey,
      pickupCode: pickupCode,
      expressOrderNo: expressOrderNo,
      expressOrderTime: expressOrderTime,
      pickupTime: app.pickupTime,
      pickupCourierPhone: app.pickupCourierPhone,
      merged: false,
      memberCount: 1
    };
  }

  function applyMergedPickupToApp(app, shipType) {
    if (!app) return app;
    var resolved = resolveMergedPickupForApp(app, shipType);
    if (!resolved) return app;
    app.pickupMergeKey = resolved.mergeKey;
    app.pickupCode = resolved.pickupCode;
    app.expressOrderNo = resolved.expressOrderNo;
    app.expressOrderTime = resolved.expressOrderTime || app.expressOrderTime;
    if (resolved.pickupTime && !app.pickupTime) app.pickupTime = resolved.pickupTime;
    if (resolved.pickupCourierPhone) app.pickupCourierPhone = resolved.pickupCourierPhone;
    app.pickupMerged = !!resolved.merged || (resolved.memberCount || 0) > 1;
    app.trackingNo = app.pickupCode;
    return app;
  }

  function scheduleDoorPickup(app, state) {
    if (!app) return;
    var addr = PICKUP_ADDRESSES.find(function (a) {
      return a.id === state.pickupAddressId;
    }) || getDefaultPickupAddress();
    app.pickupScheduled = true;
    app.returnShipTab = 'pickup';
    app.pickupTime = state.pickupTime;
    app.pickupAddressId = state.pickupAddressId || addr.id;
    app.pickupAddress = state.pickupAddressFull || addr.full || addr.label;
    app.pickupAddressLabel = state.pickupAddress || addr.label;
    app.pickupContact = state.pickupContact || addr.contact + ' ' + addr.phone;
    ensureReturnAddressOnApp(app);
    applyMergedPickupToApp(app, app.formType || getRefundType());
    /* 若合并池尚无预约时间，写入本次时间供后续售后复用 */
    if (app.pickupMergeKey && app.pickupTime) {
      var entry = findMergedPickupEntry(app.pickupMergeKey);
      if (entry && !entry.pickupTime) {
        upsertMergedPickupEntry(app.pickupMergeKey, { pickupTime: app.pickupTime });
      } else if (entry && entry.pickupTime && !state.pickupTime) {
        app.pickupTime = entry.pickupTime;
      }
    }
    app.expressOrderTime = app.expressOrderTime || formatDateTime();
    app.pickupCourierStatus = app.pickupCourierStatus || '快递员已接单';
    app.pickupCourierPhone = app.pickupCourierPhone || '4008001234';
    app.pickupFeeText = '¥0';
    app.pickupFeeSub = '平台承担退货运费';
    app.courier = '上门取件';
    app.trackingNo = app.pickupCode;
    delete app.pickupCanceled;
    saveApplication(app);
    if (app.aftersaleId || app.refundNo) {
      upsertAftersaleRecord({
        id: app.aftersaleId || app.refundNo,
        pickupCode: app.pickupCode,
        expressOrderNo: app.expressOrderNo,
        pickupMergeKey: app.pickupMergeKey,
        returnAddress: app.returnAddress,
        delivery: app.delivery || getDelivery()
      });
    }
  }

  function ensurePickupBoardData(app) {
    if (!app) return app;
    if (!isPickupScheduled(app)) return app;
    var addr = getDefaultPickupAddress();
    ensureReturnAddressOnApp(app);
    applyMergedPickupToApp(app, app.formType || getRefundType());
    if (!app.pickupCode) app.pickupCode = '0030';
    if (!app.pickupTime) {
      var merged = app.pickupMergeKey ? findMergedPickupEntry(app.pickupMergeKey) : null;
      app.pickupTime =
        (merged && merged.pickupTime) ||
        formatPickupDisplay(addDays(startOfDay(new Date()), 1), '09:00–11:00');
      if (app.pickupMergeKey) {
        upsertMergedPickupEntry(app.pickupMergeKey, { pickupTime: app.pickupTime });
      }
    }
    if (!app.pickupAddressId) app.pickupAddressId = addr.id;
    if (!app.pickupAddress) {
      app.pickupAddress = addr.full || addr.label;
    }
    if (!app.pickupAddressLabel) {
      app.pickupAddressLabel = addr.label;
    }
    if (!app.pickupContact) {
      app.pickupContact = addr.contact + ' ' + addr.phone;
    }
    if (!app.pickupCourierStatus) app.pickupCourierStatus = '快递员已接单';
    if (!app.pickupCourierPhone) app.pickupCourierPhone = '4008001234';
    app.pickupFeeText = '¥0';
    app.pickupFeeSub = '平台承担退货运费';
    app.trackingNo = app.pickupCode;
    saveApplication(app);
    return app;
  }

  function formatRelativePickupSchedule(pickupTime) {
    var parsed = parsePickupValue(pickupTime);
    var slot = '09:00–11:00';
    var dayLabel = '明天';
    if (parsed) {
      slot = parsed.slotLabel || slot;
      var today = startOfDay(new Date());
      if (sameDay(parsed.date, today)) dayLabel = '今天';
      else if (sameDay(parsed.date, addDays(today, 1))) dayLabel = '明天';
      else dayLabel = parsed.date.getMonth() + 1 + '月' + parsed.date.getDate() + '日';
    }
    return dayLabel + ' ' + slot;
  }

  function parsePickupFeeAmount(feeText) {
    var raw = String(feeText || '¥0').replace(/[¥￥,\s]/g, '');
    var num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
  }

  function formatPickupPaidDisplay(feeText) {
    return parsePickupFeeAmount(feeText).toFixed(2);
  }

  function formatPickupFeeCurrency(amount) {
    var num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) num = 0;
    return '¥' + num.toFixed(2);
  }

  function createPickupState(app) {
    var addr = getDefaultPickupAddress();
    if (app && app.pickupAddressId) {
      var found = PICKUP_ADDRESSES.find(function (a) {
        return a.id === app.pickupAddressId;
      });
      if (found) addr = found;
    }
    return {
      returnMethod: (app && app.returnMethod) || '快递上门取货',
      pickupAddressId: addr.id,
      pickupAddress: (app && app.pickupAddressLabel) || addr.label,
      pickupAddressFull: (app && app.pickupAddress) || addr.full || addr.label,
      pickupContact: (app && app.pickupContact) || addr.contact + ' ' + addr.phone,
      pickupTime: (app && app.pickupTime) || '',
      authMerchantWaybill: app && typeof app.authMerchantWaybill === 'boolean' ? app.authMerchantWaybill : true,
      evidenceOpen: !!(app && ((app.desc && app.desc.length) || (app.images && app.images.length))),
      onPickupSync: null
    };
  }

  function bindEvidenceToggle(state) {
    var toggle = document.getElementById('refundEvidenceToggle');
    var panel = document.getElementById('refundEvidencePanel');
    var hint = document.getElementById('refundEvidenceHint');
    if (!toggle || !panel) return;

    function syncEvidenceUI() {
      panel.hidden = !state.evidenceOpen;
      toggle.classList.toggle('is-open', !!state.evidenceOpen);
      if (!hint) return;
      var filled = (state.desc && state.desc.length) || (state.images && state.images.length);
      if (filled) {
        var parts = [];
        if (state.desc) parts.push('已填描述');
        if (state.images && state.images.length) parts.push(state.images.length + '张图');
        hint.textContent = parts.join(' · ');
        hint.classList.remove('ua-or-field__value--placeholder');
      } else {
        hint.textContent = hint.getAttribute('data-placeholder') || '上传有助处理退款';
        hint.classList.add('ua-or-field__value--placeholder');
      }
    }

    if (hint && !hint.getAttribute('data-placeholder')) {
      hint.setAttribute('data-placeholder', hint.textContent.trim() || '上传有助处理退款');
    }

    toggle.addEventListener('click', function () {
      state.evidenceOpen = !state.evidenceOpen;
      syncEvidenceUI();
    });

    syncEvidenceUI();
    return syncEvidenceUI;
  }

  function bindPickupReturnCard(state) {
    var methodCard = document.getElementById('refundReturnMethodCard');
    var methodValue = document.getElementById('refundReturnMethodValue');
    var addressText = document.getElementById('refundPickupAddressText');
    var contactText = document.getElementById('refundPickupContactText');
    var timeValue = document.getElementById('refundPickupTimeValue');
    var pickupFields = document.getElementById('refundPickupFields');
    var authRow = document.getElementById('refundAuthWaybillRow');
    var authInput = document.getElementById('refundAuthWaybill');
    /* 配送退仓 / 自提退门店：无需预约快递上门取货，整卡隐藏 */
    var warehouseDelivery = isWarehouseDelivery(getDelivery());
    var pickupDelivery = isPickupDelivery(getDelivery());
    var hideCourierPickup = warehouseDelivery || pickupDelivery;

    function isDoorPickup() {
      return !hideCourierPickup && state.returnMethod === '快递上门取货';
    }

    function syncPickupUI() {
      if (methodCard) methodCard.hidden = !!hideCourierPickup;
      if (hideCourierPickup) {
        state.returnMethod = pickupDelivery ? '退回门店' : '物流司机取货';
        state.pickupTime = '';
        state.authMerchantWaybill = false;
        if (typeof state.onPickupSync === 'function') state.onPickupSync();
        return;
      }
      if (methodValue) methodValue.textContent = state.returnMethod || '请选择';
      if (pickupFields) pickupFields.hidden = !isDoorPickup();
      if (authRow) authRow.hidden = !isDoorPickup();
      if (authInput) authInput.checked = !!state.authMerchantWaybill;
      if (addressText) addressText.textContent = state.pickupAddress || '';
      if (contactText) contactText.textContent = state.pickupContact || '';
      if (timeValue) {
        timeValue.textContent = state.pickupTime || '请选择上门时间';
        timeValue.classList.toggle('ua-or-field__value--placeholder', !state.pickupTime);
        timeValue.classList.toggle('ua-or-pickup-edit-time__value--placeholder', !state.pickupTime);
      }
      if (typeof state.onPickupSync === 'function') state.onPickupSync();
    }

    var methodRow = document.getElementById('refundReturnMethodRow');
    if (methodRow) {
      methodRow.addEventListener('click', function () {
        renderPickerOptions('refundReturnMethodList', RETURN_METHODS, state.returnMethod, 'returnMethod');
        openSheet('refundReturnMethodSheet');
      });
    }
    document.getElementById('refundReturnMethodConfirm') &&
      document.getElementById('refundReturnMethodConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundReturnMethodList', 'returnMethod');
        if (!val) return;
        state.returnMethod = val;
        syncPickupUI();
        closeSheet('refundReturnMethodSheet');
      });

    var addressRow = document.getElementById('refundPickupAddressRow');
    if (addressRow) {
      addressRow.addEventListener('click', function () {
        // 修改取件信息页：进入地址簿；申请表单页：仍用半遮罩选择
        if (document.querySelector('.ua-or-pickup-edit-page')) {
          window.location.href = buildAddressBookHref({
            type: getRefundType(),
            stage: getDetailStage() || 'return',
            pickupEditFrom: getPickupEditFrom()
          });
          return;
        }
        var labels = PICKUP_ADDRESSES.map(function (a) {
          return a.label + ' · ' + a.contact + ' ' + a.phone;
        });
        var selectedLabel = '';
        PICKUP_ADDRESSES.forEach(function (a) {
          if (a.id === state.pickupAddressId) {
            selectedLabel = a.label + ' · ' + a.contact + ' ' + a.phone;
          }
        });
        renderPickerOptions('refundPickupAddressList', labels, selectedLabel, 'pickupAddress');
        openSheet('refundPickupAddressSheet');
      });
    }
    document.getElementById('refundPickupAddressConfirm') &&
      document.getElementById('refundPickupAddressConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundPickupAddressList', 'pickupAddress');
        if (!val) return;
        var addr = PICKUP_ADDRESSES.find(function (a) {
          return val.indexOf(a.label) === 0;
        });
        if (!addr) return;
        state.pickupAddressId = addr.id;
        state.pickupAddress = addr.label;
        state.pickupAddressFull = addr.full || addr.label;
        state.pickupContact = addr.contact + ' ' + addr.phone;
        syncPickupUI();
        closeSheet('refundPickupAddressSheet');
      });

    var timeRow = document.getElementById('refundPickupTimeRow');
    var pickupTimeUi = {
      selectedDate: null,
      selectedSlot: '',
      selectableDays: []
    };

    function syncPickupConfirmBtn() {
      var btn = document.getElementById('refundPickupTimeConfirm');
      if (!btn) return;
      var now = getPickupNow();
      if (!pickupTimeUi.selectedDate) {
        btn.textContent = '请选择上门时间';
        btn.disabled = true;
        btn.classList.add('is-disabled');
        return;
      }
      if (!pickupTimeUi.selectedSlot) {
        btn.textContent = formatPickupDisplay(pickupTimeUi.selectedDate, '');
        btn.disabled = true;
        btn.classList.add('is-disabled');
        return;
      }
      var slot = findPickupSlot(pickupTimeUi.selectedSlot);
      var canConfirm =
        isPickupDayBookable(pickupTimeUi.selectedDate, now) &&
        slot &&
        !isPickupSlotPassed(pickupTimeUi.selectedDate, slot, now);
      btn.textContent = formatPickupDisplay(pickupTimeUi.selectedDate, pickupTimeUi.selectedSlot);
      btn.disabled = !canConfirm;
      btn.classList.toggle('is-disabled', !canConfirm);
    }

    function renderPickupSlots() {
      var list = document.getElementById('refundPickupTimeList');
      if (!list || !pickupTimeUi.selectedDate) return;
      var now = getPickupNow();
      var allPassed = !dateHasAvailablePickupSlot(pickupTimeUi.selectedDate, now);
      if (allPassed) pickupTimeUi.selectedSlot = '';
      list.classList.toggle('is-all-passed', allPassed);
      list.innerHTML = PICKUP_TIME_WINDOWS.map(function (slot) {
        var blockReason = getPickupSlotBlockReason(pickupTimeUi.selectedDate, slot, now);
        var passed = !!blockReason;
        var selected = !passed && pickupTimeUi.selectedSlot === slot.label;
        return (
          '<button type="button" class="ua-or-pickup-slot' +
          (passed ? ' is-disabled' : '') +
          (selected ? ' is-selected' : '') +
          '" data-slot="' +
          slot.label +
          '"' +
          (passed ? ' disabled' : '') +
          '>' +
          '<span class="ua-or-pickup-slot__label">' +
          getSlotDisplayLabel(slot, blockReason) +
          '</span>' +
          '<span class="ua-or-pickup-slot__radio" aria-hidden="true"></span>' +
          '</button>'
        );
      }).join('');

      list.querySelectorAll('.ua-or-pickup-slot:not(.is-disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          pickupTimeUi.selectedSlot = btn.getAttribute('data-slot') || '';
          renderPickupSlots();
          syncPickupConfirmBtn();
        });
      });
      syncPickupConfirmBtn();
    }

    function renderPickupCalendar() {
      var monthEl = document.getElementById('refundPickupCalMonth');
      var gridEl = document.getElementById('refundPickupCalGrid');
      if (!gridEl || !pickupTimeUi.selectableDays.length) return;

      var first = pickupTimeUi.selectableDays[0];
      var last = pickupTimeUi.selectableDays[pickupTimeUi.selectableDays.length - 1];
      var now = getPickupNow();
      var anchor = pickupTimeUi.selectedDate || first;
      if (monthEl) {
        monthEl.textContent = anchor.getFullYear() + '年' + (anchor.getMonth() + 1) + '月';
      }

      var today = startOfDay(now);
      // 始终至少展示两整周，覆盖跨周可选日（如周六、周日、周一）
      var gridStart = mondayOfWeek(first);
      var twoWeekEnd = addDays(gridStart, 13);
      var lastWeekEnd = sundayOfWeek(last);
      var gridEnd = lastWeekEnd.getTime() > twoWeekEnd.getTime() ? lastWeekEnd : twoWeekEnd;

      var selectableKeys = {};
      pickupTimeUi.selectableDays.forEach(function (d) {
        selectableKeys[dateKey(d)] = true;
      });

      var html = '';
      for (var cur = new Date(gridStart.getTime()); cur.getTime() <= gridEnd.getTime(); cur = addDays(cur, 1)) {
        var key = dateKey(cur);
        var selectable = !!selectableKeys[key];
        var isToday = sameDay(cur, today);
        var selected = pickupTimeUi.selectedDate && sameDay(cur, pickupTimeUi.selectedDate);
        var otherMonth = cur.getMonth() !== anchor.getMonth();
        var todayAllPassed = isToday && isTodayAllSlotsPassed(now);
        var label = isToday ? '今' : String(cur.getDate());
        html +=
          '<button type="button" class="ua-or-pickup-cal__day' +
          (selectable ? ' is-selectable' : '') +
          (isToday ? ' is-today' : '') +
          (selected ? ' is-selected' : '') +
          (otherMonth ? ' is-other-month' : '') +
          (todayAllPassed ? ' is-today-passed' : '') +
          '" data-date="' +
          key +
          '"' +
          (selectable ? '' : ' disabled') +
          '><span class="ua-or-pickup-cal__day-num">' +
          label +
          '</span></button>';
      }
      gridEl.innerHTML = html;

      gridEl.querySelectorAll('.ua-or-pickup-cal__day.is-selectable').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-date');
          var next = pickupTimeUi.selectableDays.find(function (d) {
            return dateKey(d) === key;
          });
          if (!next) return;
          pickupTimeUi.selectedDate = next;
          var slot = findPickupSlot(pickupTimeUi.selectedSlot);
          if (!slot || isPickupSlotPassed(next, slot, now)) {
            var firstAvail = PICKUP_TIME_WINDOWS.find(function (s) {
              return !isPickupSlotPassed(next, s, now);
            });
            pickupTimeUi.selectedSlot = firstAvail ? firstAvail.label : '';
          }
          renderPickupCalendar();
          renderPickupSlots();
          syncPickupConfirmBtn();
        });
      });
    }

    function openPickupTimeSheet() {
      var now = getPickupNow();
      var today = startOfDay(now);
      pickupTimeUi.selectableDays = getSelectablePickupDays(now);
      var parsed = parsePickupValue(state.pickupTime);
      pickupTimeUi.selectedDate = getDefaultPickupDate(pickupTimeUi.selectableDays, now);
      pickupTimeUi.selectedSlot = '';

      // 演示晚 8 点后 / 全约满 / pickupNow：直接落在「今」，避免被预填的「明天」挡住标识
      if (shouldFocusTodayPickupDemo(now)) {
        var todayDay = pickupTimeUi.selectableDays.find(function (d) {
          return sameDay(d, today);
        });
        if (todayDay) {
          pickupTimeUi.selectedDate = todayDay;
          pickupTimeUi.selectedSlot = '';
          renderPickupCalendar();
          renderPickupSlots();
          syncPickupConfirmBtn();
          openSheet('refundPickupTimeSheet');
          return;
        }
      }

      if (parsed) {
        var matched = pickupTimeUi.selectableDays.find(function (d) {
          return sameDay(d, parsed.date);
        });
        if (matched) {
          pickupTimeUi.selectedDate = matched;
          var slot = findPickupSlot(parsed.slotLabel);
          if (
            slot &&
            isPickupDayBookable(matched, now) &&
            !isPickupSlotPassed(matched, slot, now)
          ) {
            pickupTimeUi.selectedSlot = slot.label;
          }
        }
      }

      if (!pickupTimeUi.selectedSlot && pickupTimeUi.selectedDate) {
        if (isPickupDayBookable(pickupTimeUi.selectedDate, now)) {
          var firstAvailable = PICKUP_TIME_WINDOWS.find(function (s) {
            return !isPickupSlotPassed(pickupTimeUi.selectedDate, s, now);
          });
          pickupTimeUi.selectedSlot = firstAvailable ? firstAvailable.label : '';
        }
      }

      renderPickupCalendar();
      renderPickupSlots();
      syncPickupConfirmBtn();
      openSheet('refundPickupTimeSheet');
    }

    if (timeRow) {
      timeRow.addEventListener('click', openPickupTimeSheet);
    }
    document.getElementById('refundPickupTimeConfirm') &&
      document.getElementById('refundPickupTimeConfirm').addEventListener('click', function () {
        if (!pickupTimeUi.selectedDate || !pickupTimeUi.selectedSlot) return;
        state.pickupTime = formatPickupDisplay(pickupTimeUi.selectedDate, pickupTimeUi.selectedSlot);
        syncPickupUI();
        closeSheet('refundPickupTimeSheet');
      });

    if (authInput) {
      authInput.addEventListener('change', function () {
        state.authMerchantWaybill = !!authInput.checked;
      });
    }

    syncPickupUI();
    return {
      sync: syncPickupUI,
      validate: function () {
        if (hideCourierPickup) return true;
        if (!state.returnMethod) {
          window.alert('请选择退货方式');
          return false;
        }
        if (isDoorPickup() && !state.pickupTime) {
          window.alert('请选择上门时间');
          return false;
        }
        if (isDoorPickup() && !state.pickupAddress) {
          window.alert('请选择取件地址');
          return false;
        }
        return true;
      },
      payload: function () {
        if (pickupDelivery) {
          return {
            returnMethod: '退回门店',
            delivery: 'pickup',
            pickupAddressId: '',
            pickupAddress: '',
            pickupContact: '',
            pickupTime: '',
            authMerchantWaybill: false,
            pickupScheduled: false
          };
        }
        if (warehouseDelivery) {
          return {
            returnMethod: '物流司机取货',
            delivery: 'warehouse',
            pickupAddressId: '',
            pickupAddress: '',
            pickupContact: '',
            pickupTime: '',
            authMerchantWaybill: false,
            pickupScheduled: false
          };
        }
        return {
          returnMethod: state.returnMethod,
          pickupAddressId: state.pickupAddressId,
          pickupAddress: state.pickupAddress,
          pickupContact: state.pickupContact,
          pickupTime: state.pickupTime,
          authMerchantWaybill: !!state.authMerchantWaybill
        };
      }
    };
  }

  function renderSpecQtyList(containerId, specs, qtyMap, onChange, maxQtyMap) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = specs
      .map(function (spec) {
        var qty = qtyMap[spec.id] || 0;
        var maxQty =
          maxQtyMap && maxQtyMap[spec.id] != null ? Number(maxQtyMap[spec.id]) : 99;
        if (!(maxQty >= 0)) maxQty = 99;
        return (
          '<div class="ua-or-spec-row" data-spec-id="' +
          spec.id +
          '">' +
          '<div class="ua-or-spec-row__main">' +
          '<div class="ua-or-spec-row__info">' +
          '<div class="ua-or-spec-row__label">' +
          escapeHtml(spec.label) +
          '</div></div>' +
          '<div class="ua-or-stepper">' +
          '<button type="button" class="ua-or-spec-minus" data-spec-id="' +
          spec.id +
          '" aria-label="减少"' +
          (qty <= 0 ? ' disabled' : '') +
          '>-</button>' +
          '<input type="number" class="ua-or-spec-qty" data-spec-id="' +
          spec.id +
          '" value="' +
          qty +
          '" min="0" max="' +
          maxQty +
          '" readonly tabindex="-1">' +
          '<button type="button" class="ua-or-spec-plus" data-spec-id="' +
          spec.id +
          '" aria-label="增加"' +
          (qty >= maxQty ? ' disabled' : '') +
          '>+</button></div></div>' +
          '<p class="ua-or-spec-row__hint">最多可补寄' +
          maxQty +
          '件</p></div>'
        );
      })
      .join('');

    el.querySelectorAll('.ua-or-spec-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-spec-id');
        var val = Math.max(0, (qtyMap[id] || 0) - 1);
        qtyMap[id] = val;
        onChange();
      });
    });
    el.querySelectorAll('.ua-or-spec-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-spec-id');
        var maxQty =
          maxQtyMap && maxQtyMap[id] != null ? Number(maxQtyMap[id]) : 99;
        if (!(maxQty >= 0)) maxQty = 99;
        if ((qtyMap[id] || 0) >= maxQty) return;
        qtyMap[id] = Math.min(maxQty, (qtyMap[id] || 0) + 1);
        onChange();
      });
    });
  }

  function summarizeSpecQty(specs, qtyMap) {
    return specs
      .filter(function (spec) {
        return (qtyMap[spec.id] || 0) > 0;
      })
      .map(function (spec) {
        return spec.label + '×' + qtyMap[spec.id];
      })
      .join('、');
  }

  function initRestockPage() {
    var item = getItem();
    var orderSpec = getOrderSpec(item);
    var specs = orderSpec ? [orderSpec] : [];
    var app = loadApplication();
    var isEdit = getParams().get('edit') === '1';
    var excludeId = isEdit && app ? app.aftersaleId || app.refundNo || '' : '';
    /* 补货上限：购买 − 已售后累计（进行中+已完成）；与可退池独立，但退款会占用本上限 */
    var maxOrderQty = getRestockMaxQty(getItemIndex(), null, {
      excludeId: excludeId || undefined
    });
    var maxQtyMap = {};
    specs.forEach(function (spec) {
      maxQtyMap[spec.id] = maxOrderQty;
    });
    var state = {
      reason: '',
      specQtys: {},
      desc: '',
      images: []
    };
    specs.forEach(function (spec) {
      state.specQtys[spec.id] = 0;
    });

    initNav('补货', buildFormBackHref('restock'));
    renderProductCard('refundProductCard');

    var reasonValue = document.getElementById('refundReasonValue');
    var descInput = document.getElementById('refundDescInput');
    var descCount = document.getElementById('refundDescCount');
    var uploadGrid = document.getElementById('refundUploadGrid');
    var submitBtn = document.getElementById('refundSubmitBtn');

    function syncUI() {
      if (reasonValue) {
        reasonValue.textContent = state.reason || '请选择';
        reasonValue.classList.toggle('ua-or-field__value--placeholder', !state.reason);
      }
    }

    function refreshSpecList() {
      renderSpecQtyList(
        'refundRestockSpecList',
        specs,
        state.specQtys,
        refreshSpecList,
        maxQtyMap
      );
      syncUI();
    }

    refreshSpecList();

    document.getElementById('refundReasonRow') &&
      document.getElementById('refundReasonRow').addEventListener('click', function () {
        renderPickerOptions('refundReasonList', REASONS.restock, state.reason, 'refundReason');
        openSheet('refundReasonSheet');
      });

    document.getElementById('refundReasonConfirm') &&
      document.getElementById('refundReasonConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundReasonList', 'refundReason');
        if (!val) return;
        state.reason = val;
        syncUI();
        closeSheet('refundReasonSheet');
      });

    bindDescAndUpload(state, descInput, descCount, uploadGrid, item);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!state.reason) {
          window.alert('请选择补货原因');
          return;
        }
        if (!specs.length) {
          window.alert('暂无可补货规格');
          return;
        }
        var overLimit = specs.some(function (spec) {
          return (state.specQtys[spec.id] || 0) > maxOrderQty;
        });
        if (overLimit) {
          window.alert('补货数量不能超过可补上限（最多' + maxOrderQty + '件）');
          return;
        }
        var picked = specs.filter(function (spec) {
          return (state.specQtys[spec.id] || 0) > 0;
        });
        if (!picked.length) {
          window.alert('请选择需补商品的规格及数量');
          return;
        }
        var restockItems = picked.map(function (spec) {
          return { specId: spec.id, label: spec.label, priceNum: spec.priceNum, qty: state.specQtys[spec.id] };
        });
        persistAndGoDetail('restock', {
          reason: state.reason,
          restockItems: restockItems,
          restockSummary: summarizeSpecQty(specs, state.specQtys),
          desc: state.desc,
          images: state.images
        });
      });
    }

    bindSheetClose();
  }

  function initExchangePage() {
    var item = getItem();
    var specs = getItemSpecs(item);
    var orderSpec = getOrderSpec(item);
    var samePriceSpecs = specs.filter(function (spec) {
      return spec.priceNum === orderSpec.priceNum && spec.id !== orderSpec.id;
    });
    var app = loadApplication();
    var isEdit = getParams().get('edit') === '1';
    var state = {
      reason: '',
      sourceSpecId: orderSpec.id,
      sourceQty: item.qty,
      targetSpecId: samePriceSpecs.length ? samePriceSpecs[0].id : '',
      targetQty: item.qty,
      desc: '',
      images: []
    };
    Object.assign(state, createPickupState(isEdit ? app : null));
    if (isEdit && app) {
      if (app.reason) state.reason = app.reason;
      if (app.desc) state.desc = app.desc;
      if (app.images && app.images.length) state.images = app.images.slice();
      if (app.exchangeTo && app.exchangeTo.specId) state.targetSpecId = app.exchangeTo.specId;
      if (app.exchangeTo && app.exchangeTo.qty) state.targetQty = app.exchangeTo.qty;
    }

    initNav('换货', buildFormBackHref('exchange'));
    renderProductCard('refundProductCard');

    var reasonValue = document.getElementById('refundReasonValue');
    var sourceSpecEl = document.getElementById('refundExchangeSourceSpec');
    var sourceQtyEl = document.getElementById('refundExchangeSourceQty');
    var targetList = document.getElementById('refundExchangeTargetList');
    var targetQtyInput = document.getElementById('refundExchangeTargetQty');
    var targetQtyMinus = document.getElementById('refundExchangeTargetQtyMinus');
    var targetQtyPlus = document.getElementById('refundExchangeTargetQtyPlus');
    var exchangeHint = document.getElementById('refundExchangeHint');
    var descInput = document.getElementById('refundDescInput');
    var descCount = document.getElementById('refundDescCount');
    var uploadGrid = document.getElementById('refundUploadGrid');
    var submitBtn = document.getElementById('refundSubmitBtn');

    if (sourceSpecEl) sourceSpecEl.textContent = orderSpec.label;
    if (sourceQtyEl) sourceQtyEl.textContent = String(item.qty);
    if (descInput && state.desc) {
      descInput.value = state.desc;
      if (descCount) descCount.textContent = String(state.desc.length);
    }

    function getTargetSpec() {
      return samePriceSpecs.find(function (s) {
        return s.id === state.targetSpecId;
      });
    }

    function renderTargetOptions() {
      if (!targetList) return;
      if (!samePriceSpecs.length) {
        targetList.innerHTML =
          '<p class="ua-or-exchange-empty">暂无同等价位规格可换，不同价不支持换货</p>';
        return;
      }
      targetList.innerHTML = samePriceSpecs
        .map(function (spec) {
          var active = spec.id === state.targetSpecId;
          return (
            '<button type="button" class="ua-or-spec-chip' +
            (active ? ' ua-or-spec-chip--active' : '') +
            '" data-target-spec="' +
            spec.id +
            '">' +
            spec.label +
            '<em>' +
            formatPrice(spec.priceNum) +
            '/件</em></button>'
          );
        })
        .join('');
      targetList.querySelectorAll('[data-target-spec]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.targetSpecId = btn.getAttribute('data-target-spec');
          renderTargetOptions();
        });
      });
    }

    function syncUI() {
      if (reasonValue) {
        reasonValue.textContent = state.reason || '请选择';
        reasonValue.classList.toggle('ua-or-field__value--placeholder', !state.reason);
      }
      if (targetQtyInput) targetQtyInput.value = String(state.targetQty);
      if (targetQtyMinus) targetQtyMinus.disabled = state.targetQty <= 1;
      if (targetQtyPlus) targetQtyPlus.disabled = state.targetQty >= item.qty;
      if (exchangeHint) {
        exchangeHint.textContent =
          '仅支持同等价位（' +
          formatPrice(orderSpec.priceNum) +
          '/件）规格换货，不同价不支持换货';
      }
    }

    renderTargetOptions();
    syncUI();

    document.getElementById('refundReasonRow') &&
      document.getElementById('refundReasonRow').addEventListener('click', function () {
        renderPickerOptions('refundReasonList', REASONS.exchange, state.reason, 'refundReason');
        openSheet('refundReasonSheet');
      });

    document.getElementById('refundReasonConfirm') &&
      document.getElementById('refundReasonConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundReasonList', 'refundReason');
        if (!val) return;
        state.reason = val;
        syncUI();
        closeSheet('refundReasonSheet');
      });

    if (targetQtyMinus) {
      targetQtyMinus.addEventListener('click', function () {
        if (state.targetQty <= 1) return;
        state.targetQty -= 1;
        syncUI();
      });
    }
    if (targetQtyPlus) {
      targetQtyPlus.addEventListener('click', function () {
        if (state.targetQty >= item.qty) return;
        state.targetQty += 1;
        syncUI();
      });
    }

    var syncEvidenceUI = bindEvidenceToggle(state);
    bindDescAndUpload(state, descInput, descCount, uploadGrid, item, syncEvidenceUI);
    var pickupApi = bindPickupReturnCard(state);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!state.reason) {
          window.alert('请选择换货原因');
          return;
        }
        if (!samePriceSpecs.length) {
          window.alert('暂无同等价位规格可换，不同价不支持换货');
          return;
        }
        var targetSpec = getTargetSpec();
        if (!targetSpec) {
          window.alert('请选择换货规格');
          return;
        }
        if (state.targetQty <= 0) {
          window.alert('请选择换货数量');
          return;
        }
        if (!pickupApi.validate()) return;
        persistAndGoDetail(
          'exchange',
          Object.assign(
            {
              reason: state.reason,
              exchangeFrom: {
                specId: orderSpec.id,
                label: orderSpec.label,
                qty: item.qty,
                priceNum: orderSpec.priceNum
              },
              exchangeTo: {
                specId: targetSpec.id,
                label: targetSpec.label,
                qty: state.targetQty,
                priceNum: targetSpec.priceNum
              },
              exchangeSummary:
                orderSpec.label +
                '×' +
                item.qty +
                ' 换成 ' +
                targetSpec.label +
                '×' +
                state.targetQty,
              desc: state.desc,
              images: state.images
            },
            pickupApi.payload()
          )
        );
      });
    }

    bindSheetClose();
  }

  function showToast(msg, ms) {
    var el = document.getElementById('refundDetailToast');
    if (!el) {
      window.alert(msg);
      return;
    }
    el.textContent = msg;
    el.hidden = false;
    window.setTimeout(function () {
      el.hidden = true;
    }, ms || 2000);
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showToast(okMsg || '已复制');
        },
        function () {
          showToast(okMsg || '已复制');
        }
      );
    } else {
      showToast(okMsg || '已复制');
    }
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getScene() {
    var scene = (getParams().get('scene') || 'post_ship').trim();
    /* to_store：零售发货后到门店待收货，仅支持仅退款 */
    if (['pre_ship', 'post_ship', 'aftersale', 'to_store'].indexOf(scene) >= 0) {
      return scene;
    }
    return 'post_ship';
  }

  /**
   * 零售售后可选类型：
   * - to_store / pre_ship：仅退款
   * - post_ship / aftersale：仅退款、退货退款、补货（不含换货）
   * 进货（from=restock）保持原四类型可选
   */
  function getAllowedSelectServices(scene) {
    if (!isRetailApp()) {
      return ['refund_only', 'return_refund', 'restock', 'exchange'];
    }
    if (scene === 'pre_ship' || scene === 'to_store') {
      return ['refund_only'];
    }
    return ['refund_only', 'return_refund', 'restock'];
  }

  function getItemIndex() {
    var idx = parseInt(getParams().get('item') || '0', 10);
    return isNaN(idx) || idx < 0 ? 0 : idx;
  }

  function isPointsExchangeByIndex(itemIndex) {
    var idx = itemIndex == null ? getItemIndex() : Number(itemIndex);
    try {
      var raw = sessionStorage.getItem('ua_last_order_items_v1');
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list[idx] && list[idx].isPointsExchange) return true;
      }
    } catch (e) { /* ignore */ }
    try {
      var orderRaw = sessionStorage.getItem('ua_last_order_v1');
      if (orderRaw) {
        var order = JSON.parse(orderRaw);
        if (order && Array.isArray(order.items) && order.items[idx] && order.items[idx].isPointsExchange) {
          return true;
        }
      }
    } catch (e2) { /* ignore */ }
    var pointsItem = getParams().get('pointsItem') || '';
    return String(pointsItem)
      .split(',')
      .some(function (raw) {
        return parseInt(String(raw).trim(), 10) === idx;
      });
  }

  function pointsExchangeTagHtml() {
    return '<span class="ua-cart-item__tag">积分兑换</span>';
  }

  function formatProductNameHtml(name, itemIndex) {
    var safe = String(name == null ? '' : name)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    if (isPointsExchangeByIndex(itemIndex)) return pointsExchangeTagHtml() + safe;
    return safe;
  }

  function getItem() {
    var idx = getItemIndex();
    var base = DEMO_ITEMS[idx] || DEMO_ITEMS[0];
    try {
      var orderRaw = sessionStorage.getItem('ua_last_order_v1');
      if (orderRaw) {
        var order = JSON.parse(orderRaw);
        var it = order && Array.isArray(order.items) ? order.items[idx] : null;
        if (it) {
          return Object.assign({}, base, {
            name: it.name || base.name,
            spec: it.spec ? '规格：' + it.spec : base.spec,
            img: it.img || base.img,
            qty: it.qty || base.qty,
            isPointsExchange: !!it.isPointsExchange
          });
        }
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, base, {
      isPointsExchange: isPointsExchangeByIndex(idx)
    });
  }

  function formatPrice(num) {
    return '¥' + Number(num).toFixed(2);
  }

  function buildDetailBackHref() {
    var p = getParams();
    var status = p.get('status') || 'shipping';
    var delivery = p.get('delivery') || '';
    /* 零售待自提详情页独立 */
    if (status === 'pickup' && isRetailApp()) {
      var pickupHref = 'order-detail-pickup.html';
      var pickupQs = [];
      if (delivery) pickupQs.push('delivery=' + encodeURIComponent(delivery));
      if (p.get('from')) pickupQs.push('from=' + encodeURIComponent(p.get('from')));
      return pickupQs.length ? pickupHref + '?' + pickupQs.join('&') : pickupHref;
    }
    var href = 'order-detail.html?status=' + encodeURIComponent(status);
    if (p.get('from')) href += '&from=' + encodeURIComponent(p.get('from'));
    if (p.get('supplier')) href += '&supplier=' + encodeURIComponent(p.get('supplier'));
    if (delivery) href += '&delivery=' + encodeURIComponent(delivery);
    if (p.get('cutoff')) href += '&cutoff=' + encodeURIComponent(p.get('cutoff'));
    if (p.get('reason')) href += '&reason=' + encodeURIComponent(p.get('reason'));
    return href;
  }

  function buildQuery(extra) {
    var p = getParams();
    var keys = [
      'from',
      'status',
      'supplier',
      'delivery',
      'cutoff',
      'reason',
      'scene',
      'item',
      'type',
      'stage',
      'logistics',
      'closeReason',
      'expired',
      'pickupPhase',
      'pickupEditFrom',
      'addrFrom',
      'refundBack',
      'pkg',
      'pkgs',
      'multiPkg',
      'asId',
      'asIds',
      'asFilter',
      'asItem',
      'shipped'
    ];
    var qs = [];
    keys.forEach(function (key) {
      var val = p.get(key);
      if (val) qs.push(key + '=' + encodeURIComponent(val));
    });
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        if (extra[key] === '' || extra[key] == null) {
          qs = qs.filter(function (part) {
            return part.indexOf(key + '=') !== 0;
          });
          return;
        }
        var existing = qs.filter(function (part) {
          return part.indexOf(key + '=') === 0;
        });
        if (existing.length) {
          qs = qs.filter(function (part) {
            return part.indexOf(key + '=') !== 0;
          });
        }
        qs.push(key + '=' + encodeURIComponent(extra[key]));
      });
    }
    return qs.join('&');
  }

  function buildSelectHref() {
    return 'order-refund-select.html?' + buildQuery();
  }

  function buildOnlyHref() {
    return 'order-refund-only.html?' + buildQuery();
  }

  /** 零售 pre_ship / to_store：不进类型选择页，直达仅退款 */
  function skipsServiceSelectPage(scene) {
    var s = scene || getScene();
    return isRetailApp() && (s === 'pre_ship' || s === 'to_store');
  }

  /** 申请表单返回：跳过选择页的场景直接回订单详情，避免 select↔only 死循环 */
  function buildFormBackHref(formType) {
    if (skipsServiceSelectPage() || formType === 'pre_ship') {
      return buildDetailBackHref();
    }
    return buildSelectHref();
  }

  function getItemSpecs(item) {
    if (item.specs && item.specs.length) {
      return item.specs.filter(function (s) {
        return s.available !== false;
      });
    }
    return [{ id: 'default', label: item.spec.replace(/^规格：/, ''), priceNum: item.priceNum, available: true }];
  }

  function getOrderSpec(item) {
    var specs = getItemSpecs(item);
    var id = item.orderSpecId;
    if (id) {
      var found = specs.find(function (s) {
        return s.id === id;
      });
      if (found) return found;
    }
    return specs[0];
  }

  function formatSpecOption(spec) {
    return spec.label + '（' + formatPrice(spec.priceNum) + '/件）';
  }

  function buildReturnHref() {
    return 'order-refund-return.html?' + buildQuery();
  }

  function buildRestockHref() {
    return 'order-refund-restock.html?' + buildQuery();
  }

  function buildExchangeHref() {
    return 'order-refund-exchange.html?' + buildQuery();
  }

  function getReasonList(formType, goodsStatus) {
    if (formType === 'pre_ship') return REASONS.pre_ship;
    if (formType === 'return') return REASONS.return_refund;
    if (formType === 'restock') return REASONS.restock;
    if (formType === 'exchange') return REASONS.exchange;
    if (goodsStatus === '未收到货') return REASONS.not_received;
    return REASONS.received;
  }

  function renderProductCard(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var item = getItem();
    el.innerHTML =
      '<img class="ua-or-product__img" src="' +
      item.img +
      '" alt="">' +
      '<div class="ua-or-product__body">' +
      '<div class="ua-or-product__name">' +
      formatProductNameHtml(item.name, getItemIndex()) +
      '</div>' +
      '<div class="ua-or-product__spec">' +
      item.spec +
      '</div></div>';
  }

  function initNav(title, backHref) {
    var titleEl =
      document.getElementById('refundNavTitle') || document.getElementById('refundDetailNavTitle');
    var backEl = document.getElementById('refundNavBack') || document.getElementById('refundDetailBack');
    if (titleEl) titleEl.textContent = title;
    if (backEl) backEl.setAttribute('href', backHref || buildDetailBackHref());
  }

  function openSheet(sheetId) {
    var sheet = document.getElementById(sheetId);
    if (sheet) {
      sheet.hidden = false;
      document.body.classList.add('ua-or-sheet-open');
    }
  }

  function closeSheet(sheetId) {
    var sheet = document.getElementById(sheetId);
    if (sheet) sheet.hidden = true;
    if (!document.querySelector('.ua-or-sheet:not([hidden])')) {
      document.body.classList.remove('ua-or-sheet-open');
    }
  }

  function closeAllSheets() {
    document.querySelectorAll('.ua-or-sheet').forEach(function (sheet) {
      sheet.hidden = true;
    });
    document.body.classList.remove('ua-or-sheet-open');
  }

  function renderPickerOptions(listId, options, selected, name, radioEnd) {
    var el = document.getElementById(listId);
    if (!el) return;
    el.innerHTML = options
      .map(function (opt) {
        var active = opt === selected;
        if (radioEnd) {
          return (
            '<label class="ua-or-picker__option ua-or-picker__option--end">' +
            '<span class="ua-or-picker__text">' +
            opt +
            '</span>' +
            '<input type="radio" name="' +
            name +
            '" value="' +
            opt +
            '"' +
            (active ? ' checked' : '') +
            '>' +
            '<span class="ua-or-picker__radio"></span></label>'
          );
        }
        return (
          '<label class="ua-or-picker__option">' +
          '<input type="radio" name="' +
          name +
          '" value="' +
          opt +
          '"' +
          (active ? ' checked' : '') +
          '>' +
          '<span class="ua-or-picker__radio"></span>' +
          '<span class="ua-or-picker__text">' +
          opt +
          '</span></label>'
        );
      })
      .join('');
  }

  function getCheckedValue(containerId, name) {
    var container = document.getElementById(containerId);
    if (!container) return '';
    var checked = container.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function bindSheetClose() {
    document.querySelectorAll('[data-or-sheet-close]').forEach(function (el) {
      if (el.getAttribute('data-sheet-close-bound') === '1') return;
      el.setAttribute('data-sheet-close-bound', '1');
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-or-sheet-close'));
      });
    });
  }

  function bindCloseReturnSheet(app, refundType, triggerIds) {
    var ui = { selected: '' };
    var sheetId = 'refundCloseReturnSheet';

    function syncCloseReturnTip() {
      var tip = document.getElementById('refundCloseReturnTip');
      if (!tip) return;
      var remain = getCloseReturnRemain();
      tip.textContent =
        '最多可取消' + CLOSE_RETURN_MAX_TIMES + '次，您仅剩' + remain + '次取消机会';
    }

    function syncCloseReturnConfirm() {
      var btn = document.getElementById('refundCloseReturnConfirm');
      if (!btn) return;
      btn.disabled = false;
      btn.classList.remove('is-disabled');
    }

    function renderCloseReturnReasons() {
      var list = document.getElementById('refundCloseReturnList');
      if (!list) return;
      list.innerHTML = CLOSE_RETURN_REASONS.map(function (reason) {
        var selected = ui.selected === reason;
        return (
          '<button type="button" class="ua-or-close-return-option' +
          (selected ? ' is-selected' : '') +
          '" data-reason="' +
          escapeHtml(reason) +
          '" role="radio" aria-checked="' +
          (selected ? 'true' : 'false') +
          '">' +
          '<span class="ua-or-close-return-option__label">' +
          escapeHtml(reason) +
          '</span>' +
          '<span class="ua-or-close-return-option__radio" aria-hidden="true"></span>' +
          '</button>'
        );
      }).join('');
      list.querySelectorAll('.ua-or-close-return-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          ui.selected = btn.getAttribute('data-reason') || '';
          renderCloseReturnReasons();
          syncCloseReturnConfirm();
        });
      });
      syncCloseReturnConfirm();
    }

    function openCloseReturnSheet() {
      if (getCloseReturnRemain() <= 0) {
        showToast('取消次数已用完');
        return;
      }
      ui.selected = '';
      syncCloseReturnTip();
      renderCloseReturnReasons();
      openSheet(sheetId);
    }

    function confirmCloseReturn() {
      if (!ui.selected) {
        showToast('请选择关闭原因');
        return;
      }
      if (!consumeCloseReturnChance()) {
        showToast('取消次数已用完');
        return;
      }
      app.closeReturnReason = ui.selected;
      app.resultTime = formatDateTime();
      saveApplication(app);
      closeSheet(sheetId);
      window.location.href = buildDetailHref({
        type: refundType,
        stage: 'closed',
        closeReason: 'close_return'
      });
    }

    var confirmBtn = document.getElementById('refundCloseReturnConfirm');
    if (confirmBtn && !confirmBtn.getAttribute('data-close-return-bound')) {
      confirmBtn.setAttribute('data-close-return-bound', '1');
      confirmBtn.addEventListener('click', confirmCloseReturn);
    }

    function bindTrigger(el) {
      if (!el || el.getAttribute('data-close-return-trigger')) return;
      el.setAttribute('data-close-return-trigger', '1');
      el.addEventListener('click', function (e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        openCloseReturnSheet();
      });
    }

    (triggerIds || []).forEach(function (id) {
      bindTrigger(document.getElementById(id));
    });

    return { open: openCloseReturnSheet, bindTrigger: bindTrigger };
  }

  function bindCancelPickupSheet(app, refundType, triggerIds) {
    var ui = { selected: '' };
    var sheetId = 'refundCancelPickupSheet';

    function renderCancelPickupReasons() {
      var list = document.getElementById('refundCancelPickupList');
      if (!list) return;
      list.innerHTML = CANCEL_PICKUP_REASONS.map(function (reason) {
        var selected = ui.selected === reason;
        return (
          '<button type="button" class="ua-or-close-return-option' +
          (selected ? ' is-selected' : '') +
          '" data-reason="' +
          escapeHtml(reason) +
          '" role="radio" aria-checked="' +
          (selected ? 'true' : 'false') +
          '">' +
          '<span class="ua-or-close-return-option__label">' +
          escapeHtml(reason) +
          '</span>' +
          '<span class="ua-or-close-return-option__radio" aria-hidden="true"></span>' +
          '</button>'
        );
      }).join('');
      list.querySelectorAll('.ua-or-close-return-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          ui.selected = btn.getAttribute('data-reason') || '';
          renderCancelPickupReasons();
        });
      });
    }

    function openCancelPickupSheet() {
      ui.selected = '';
      renderCancelPickupReasons();
      openSheet(sheetId);
    }

    function confirmCancelPickup() {
      if (!ui.selected) {
        showToast('请选择取消原因');
        return;
      }
      app.cancelPickupReason = ui.selected;
      clearPickupScheduled(app);
      saveApplication(app);
      closeSheet(sheetId);
      window.location.href = buildReturnShipHref({
        type: refundType,
        stage: getDetailStage() || 'return'
      });
    }

    var confirmBtn = document.getElementById('refundCancelPickupConfirm');
    if (confirmBtn && !confirmBtn.getAttribute('data-cancel-pickup-bound')) {
      confirmBtn.setAttribute('data-cancel-pickup-bound', '1');
      confirmBtn.addEventListener('click', confirmCancelPickup);
    }

    (triggerIds || []).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.getAttribute('data-cancel-pickup-trigger')) {
        el.setAttribute('data-cancel-pickup-trigger', '1');
        el.addEventListener('click', openCancelPickupSheet);
      }
    });

    return { open: openCancelPickupSheet };
  }

  function initSelectPage() {
    var scene = getScene();
    /* 零售·待发货前 / 门店待收货：不进选择页，直达仅退款（防止从 only 误返后死循环） */
    if (skipsServiceSelectPage(scene)) {
      window.location.replace(
        scene === 'pre_ship'
          ? 'order-refund-pre-ship.html?' + buildQuery({ scene: scene })
          : buildOnlyHref()
      );
      return;
    }

    initNav(scene === 'aftersale' ? '选择售后类型' : '选择服务类型', buildDetailBackHref());
    renderProductCard('refundProductCard');

    var sectionTitle = document.getElementById('refundSectionTitle');
    if (sectionTitle) {
      sectionTitle.textContent = scene === 'aftersale' ? '选择售后类型' : '选择服务类型';
    }

    var allowed = getAllowedSelectServices(scene);
    var itemIndex = getItemIndex();
    var refundMax = getRefundableMaxQty(itemIndex);
    var returnMax = getRefundableMaxQty(itemIndex, null, {
      forReturn: true,
      pickedQty: getItemPickedQty(itemIndex)
    });
    var restockMax = getRestockMaxQty(itemIndex);
    document.querySelectorAll('.ua-or-service').forEach(function (row) {
      var service = row.getAttribute('data-service');
      var show = allowed.indexOf(service) >= 0;
      if (show && service === 'refund_only' && refundMax <= 0) show = false;
      if (show && service === 'return_refund' && returnMax <= 0) show = false;
      if (show && service === 'restock' && restockMax <= 0) show = false;
      row.hidden = !show;
    });

    var state = { service: '' };
    var refundOpt = document.getElementById('refundServiceRefund');
    var returnOpt = document.getElementById('refundServiceReturn');
    var restockOpt = document.getElementById('refundServiceRestock');
    var exchangeOpt = document.getElementById('refundServiceExchange');

    function syncRadio() {
      if (refundOpt) refundOpt.checked = state.service === 'refund_only';
      if (returnOpt) returnOpt.checked = state.service === 'return_refund';
      if (restockOpt) restockOpt.checked = state.service === 'restock';
      if (exchangeOpt) exchangeOpt.checked = state.service === 'exchange';
    }

    document.querySelectorAll('.ua-or-service').forEach(function (row) {
      row.addEventListener('click', function () {
        if (row.hidden) return;
        state.service = row.getAttribute('data-service');
        if (allowed.indexOf(state.service) < 0) {
          showToast('当前订单阶段不支持该售后类型');
          return;
        }
        syncRadio();
        var group =
          state.service === 'restock'
            ? 'restock'
            : state.service === 'exchange'
              ? 'exchange'
              : 'refund';
        if (hasOpenAftersaleOfGroup(getItemIndex(), group)) {
          var label =
            group === 'restock' ? '补货' : group === 'exchange' ? '换货' : '退款/退货';
          showToast('该商品已有进行中的' + label + '售后，请先处理完成后再申请');
          return;
        }
        window.setTimeout(function () {
          if (state.service === 'refund_only') {
            window.location.href = buildOnlyHref();
          } else if (state.service === 'return_refund') {
            window.location.href = buildReturnHref();
          } else if (state.service === 'restock') {
            window.location.href = buildRestockHref();
          } else if (state.service === 'exchange') {
            window.location.href = buildExchangeHref();
          }
        }, 120);
      });
    });

    syncRadio();
  }

  function createFormState(formType) {
    var item = getItem();
    var app = loadApplication();
    var isEdit = getParams().get('edit') === '1';
    var excludeId = isEdit && app ? app.aftersaleId || app.refundNo || '' : '';
    var isReturn = formType === 'return';
    /* 可退上限：购买−已退−进行中；退货退款再卡 ≤ 已提货/已核销 */
    var maxQty = getRefundableMaxQty(getItemIndex(), null, {
      excludeId: excludeId || undefined,
      forReturn: isReturn,
      pickedQty: isReturn ? getItemPickedQty(getItemIndex()) : null
    });
    if (!(maxQty >= 0)) maxQty = 0;
    var defaultQty = maxQty > 0 ? Math.min(Number(item.qty) || maxQty, maxQty) : 0;
    var state = {
      formType: formType,
      goodsStatus: isReturn ? '已收到货' : '',
      reason: '',
      qty: defaultQty,
      maxQty: maxQty,
      amount: item.priceNum * (defaultQty || 0),
      maxAmount: item.priceNum * (defaultQty || 0),
      freight: item.freight || 0,
      desc: '',
      images: []
    };
    if (isEdit && app) {
      if (app.reason) state.reason = app.reason;
      if (app.qty) state.qty = Math.min(Number(app.qty) || 0, state.maxQty);
      if (app.amount != null) state.amount = app.amount;
      if (app.goodsStatus) state.goodsStatus = app.goodsStatus;
      if (app.desc) state.desc = app.desc;
      if (app.images && app.images.length) state.images = app.images.slice();
    }
    if (state.qty < 1 && state.maxQty >= 1) state.qty = 1;
    if (state.qty > state.maxQty) state.qty = state.maxQty;
    if (isReturn) {
      Object.assign(state, createPickupState(isEdit ? app : null));
    }
    return state;
  }

  function initFormPage(formType) {
    var scene = getScene();
    var item = getItem();
    var state = createFormState(formType);
    var isPreShip = scene === 'pre_ship' || formType === 'pre_ship';
    var isReturn = formType === 'return';

    var pageTitle = isReturn ? '退货退款' : '仅退款';
    if (scene === 'aftersale' && !isReturn) pageTitle = '仅退款';
    initNav(pageTitle, buildFormBackHref(formType));
    renderProductCard('refundProductCard');

    var goodsRow = document.getElementById('refundGoodsStatusRow');
    var goodsValue = document.getElementById('refundGoodsStatusValue');
    var reasonValue = document.getElementById('refundReasonValue');
    var qtyInput = document.getElementById('refundQtyInput');
    var qtyMinus = document.getElementById('refundQtyMinus');
    var qtyPlus = document.getElementById('refundQtyPlus');
    var qtyHint = document.getElementById('refundQtyHint');
    var amountInput = document.getElementById('refundAmountInput');
    var amountHint = document.getElementById('refundAmountHint');
    var descInput = document.getElementById('refundDescInput');
    var descCount = document.getElementById('refundDescCount');
    var uploadGrid = document.getElementById('refundUploadGrid');
    var submitBtn = document.getElementById('refundSubmitBtn');
    var receivedTag = document.getElementById('refundReceivedTag');

    if (goodsRow) goodsRow.hidden = isPreShip || isReturn;
    if (receivedTag) receivedTag.hidden = !(isReturn || state.goodsStatus === '已收到货');

    function unitPrice() {
      return item.priceNum;
    }

    function syncAmountByQty() {
      state.amount = Math.round(unitPrice() * state.qty * 100) / 100;
      if (amountInput) amountInput.value = state.amount.toFixed(2);
      if (amountHint) {
        amountHint.textContent =
          '可修改，最多' + formatPrice(state.maxAmount) + '，含运费' + formatPrice(state.freight);
      }
    }

    function syncQtyUI() {
      if (qtyInput) qtyInput.value = String(state.qty);
      if (qtyMinus) qtyMinus.disabled = state.qty <= 1;
      if (qtyPlus) qtyPlus.disabled = state.qty >= state.maxQty;
      if (qtyHint) qtyHint.textContent = '最多可退' + state.maxQty + '件';
      state.maxAmount = Math.round(unitPrice() * state.qty * 100) / 100;
      syncAmountByQty();
    }

    function syncFieldValues() {
      if (goodsValue) goodsValue.textContent = state.goodsStatus || '请选择';
      if (goodsValue) goodsValue.classList.toggle('ua-or-field__value--placeholder', !state.goodsStatus);
      if (reasonValue) reasonValue.textContent = state.reason || '请选择';
      if (reasonValue) reasonValue.classList.toggle('ua-or-field__value--placeholder', !state.reason);
      if (receivedTag) receivedTag.hidden = !(isReturn || state.goodsStatus === '已收到货');
    }

    function openGoodsSheet() {
      renderPickerOptions('refundGoodsStatusList', GOODS_STATUS, state.goodsStatus, 'goodsStatus');
      openSheet('refundGoodsStatusSheet');
    }

    function openReasonSheet() {
      var list = getReasonList(isPreShip ? 'pre_ship' : isReturn ? 'return' : 'refund_only', state.goodsStatus);
      renderPickerOptions('refundReasonList', list, state.reason, 'refundReason');
      openSheet('refundReasonSheet');
    }

    syncQtyUI();
    syncFieldValues();
    if (descInput && state.desc) {
      descInput.value = state.desc;
      if (descCount) descCount.textContent = String(state.desc.length);
    }

    if (goodsRow) {
      goodsRow.addEventListener('click', openGoodsSheet);
    }
    document.getElementById('refundReasonRow') &&
      document.getElementById('refundReasonRow').addEventListener('click', function () {
        if (!isPreShip && !isReturn && !state.goodsStatus) {
          window.alert('请先选择货物状态');
          return;
        }
        openReasonSheet();
      });

    document.getElementById('refundGoodsStatusConfirm') &&
      document.getElementById('refundGoodsStatusConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundGoodsStatusList', 'goodsStatus');
        if (!val) return;
        state.goodsStatus = val;
        state.reason = '';
        syncFieldValues();
        closeSheet('refundGoodsStatusSheet');
      });

    document.getElementById('refundReasonConfirm') &&
      document.getElementById('refundReasonConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundReasonList', 'refundReason');
        if (!val) return;
        state.reason = val;
        syncFieldValues();
        closeSheet('refundReasonSheet');
      });

    if (qtyMinus) {
      qtyMinus.addEventListener('click', function () {
        if (state.qty <= 1) return;
        state.qty -= 1;
        syncQtyUI();
      });
    }
    if (qtyPlus) {
      qtyPlus.addEventListener('click', function () {
        if (state.qty >= state.maxQty) return;
        state.qty += 1;
        syncQtyUI();
      });
    }
    if (qtyInput) {
      qtyInput.addEventListener('change', function () {
        var val = parseInt(qtyInput.value, 10);
        if (isNaN(val) || val < 1) val = state.maxQty > 0 ? 1 : 0;
        if (val > state.maxQty) val = state.maxQty;
        state.qty = val;
        syncQtyUI();
      });
    }
    if (amountInput) {
      amountInput.addEventListener('change', function () {
        var val = parseFloat(amountInput.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > state.maxAmount) val = state.maxAmount;
        state.amount = Math.round(val * 100) / 100;
        amountInput.value = state.amount.toFixed(2);
      });
    }
    if (descInput) {
      descInput.addEventListener('input', function () {
        var text = descInput.value.slice(0, 200);
        descInput.value = text;
        state.desc = text;
        if (descCount) descCount.textContent = String(text.length);
        if (typeof syncEvidenceUI === 'function') syncEvidenceUI();
      });
    }

    function renderUploads() {
      if (!uploadGrid) return;
      var html = state.images
        .map(function (src, idx) {
          return (
            '<div class="ua-or-upload__item">' +
            '<img src="' +
            src +
            '" alt="">' +
            '<button type="button" class="ua-or-upload__remove" data-remove-idx="' +
            idx +
            '">×</button></div>'
          );
        })
        .join('');
      if (state.images.length < 3) {
        html +=
          '<button type="button" class="ua-or-upload__add" id="refundUploadAdd">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>' +
          '<span>上传凭证<br><em>(最多3张)</em></span></button>';
      }
      uploadGrid.innerHTML = html;
      var addBtn = document.getElementById('refundUploadAdd');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          if (state.images.length >= 3) return;
          state.images.push('../assets/order-product-1.svg');
          renderUploads();
          if (typeof syncEvidenceUI === 'function') syncEvidenceUI();
        });
      }
      uploadGrid.querySelectorAll('[data-remove-idx]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
          state.images.splice(idx, 1);
          renderUploads();
          if (typeof syncEvidenceUI === 'function') syncEvidenceUI();
        });
      });
    }

    renderUploads();

    var syncEvidenceUI = isReturn ? bindEvidenceToggle(state) : null;
    var pickupApi = isReturn ? bindPickupReturnCard(state) : null;

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!isPreShip && !isReturn && !state.goodsStatus) {
          window.alert('请选择货物状态');
          return;
        }
        if (!state.reason) {
          window.alert('请选择退款原因');
          return;
        }
        if (state.qty <= 0) {
          window.alert(isReturn ? '请填写退货件数' : '请填写申请件数');
          return;
        }
        if (state.qty > state.maxQty) {
          window.alert(
            (isReturn ? '退货件数' : '申请件数') +
              '不能超过可退上限（最多' +
              state.maxQty +
              '件）'
          );
          return;
        }
        if (state.amount <= 0) {
          window.alert('请填写退款金额');
          return;
        }
        if (pickupApi && !pickupApi.validate()) return;
        var payload = {
          reason: state.reason,
          qty: state.qty,
          amount: state.amount,
          goodsStatus: state.goodsStatus,
          desc: state.desc,
          images: state.images
        };
        if (pickupApi) Object.assign(payload, pickupApi.payload());
        persistAndGoDetail(isReturn ? 'return' : 'refund_only', payload);
      });
    }

    bindSheetClose();
  }

  function initPreShipPage() {
    var item = getItem();
    var app = loadApplication();
    var isEdit = getParams().get('edit') === '1';
    var excludeId = isEdit && app ? app.aftersaleId || app.refundNo || '' : '';
    var maxQty = getRefundableMaxQty(getItemIndex(), null, {
      excludeId: excludeId || undefined
    });
    if (!(maxQty >= 0)) maxQty = 0;
    var qty = maxQty > 0 ? Math.min(Number(item.qty) || maxQty, maxQty) : 0;
    var state = {
      reason: isEdit && app && app.reason ? app.reason : '',
      qty: qty,
      maxQty: maxQty,
      amount:
        item.paidAmount != null
          ? Math.round((item.paidAmount * (qty / Math.max(1, item.qty))) * 100) / 100
          : item.priceNum * qty,
      shippingFee: item.shippingFee != null ? item.shippingFee : item.freight || 0,
      desc: isEdit && app && app.desc ? app.desc : '',
      images: isEdit && app && app.images ? app.images.slice() : []
    };

    initNav('仅退款', buildDetailBackHref());
    renderProductCard('refundProductCard');

    var reasonValue = document.getElementById('refundReasonValue');
    var qtyInput = document.getElementById('refundQtyInput');
    var qtyHint = document.getElementById('refundQtyHint');
    var amountDisplay = document.getElementById('refundAmountDisplay');
    var amountHint = document.getElementById('refundAmountHint');
    var descInput = document.getElementById('refundDescInput');
    var descCount = document.getElementById('refundDescCount');
    var uploadGrid = document.getElementById('refundUploadGrid');
    var submitBtn = document.getElementById('refundSubmitBtn');

    function syncUI() {
      if (reasonValue) {
        reasonValue.textContent = state.reason || '请选择';
        reasonValue.classList.toggle('ua-or-field__value--placeholder', !state.reason);
      }
      if (qtyInput) qtyInput.value = String(state.qty);
      if (qtyHint) qtyHint.textContent = '最多可退' + state.maxQty + '件';
      if (amountDisplay) amountDisplay.textContent = formatPrice(state.amount);
      if (amountHint) {
        amountHint.textContent =
          '不可修改，最多' +
          formatPrice(state.amount) +
          '，含发货邮费' +
          formatPrice(state.shippingFee);
      }
    }

    function openReasonSheet() {
      renderPickerOptions('refundReasonList', REASONS.pre_ship, state.reason, 'refundReason', true);
      openSheet('refundReasonSheet');
    }

    syncUI();
    if (descInput && state.desc) {
      descInput.value = state.desc;
      if (descCount) descCount.textContent = String(state.desc.length);
    }

    document.getElementById('refundReasonRow') &&
      document.getElementById('refundReasonRow').addEventListener('click', openReasonSheet);

    document.getElementById('refundReasonConfirm') &&
      document.getElementById('refundReasonConfirm').addEventListener('click', function () {
        var val = getCheckedValue('refundReasonList', 'refundReason');
        if (!val) return;
        state.reason = val;
        syncUI();
        closeSheet('refundReasonSheet');
      });

    if (descInput) {
      descInput.addEventListener('input', function () {
        var text = descInput.value.slice(0, 200);
        descInput.value = text;
        state.desc = text;
        if (descCount) descCount.textContent = String(text.length);
      });
    }

    function renderUploads() {
      if (!uploadGrid) return;
      var html = state.images
        .map(function (src, idx) {
          return (
            '<div class="ua-or-upload__item">' +
            '<img src="' +
            src +
            '" alt="">' +
            '<button type="button" class="ua-or-upload__remove" data-remove-idx="' +
            idx +
            '">×</button></div>'
          );
        })
        .join('');
      if (state.images.length < 3) {
        html +=
          '<button type="button" class="ua-or-upload__add" id="refundUploadAdd">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>' +
          '<span>上传凭证<br><em>(最多3张)</em></span></button>';
      }
      uploadGrid.innerHTML = html;
      var addBtn = document.getElementById('refundUploadAdd');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          if (state.images.length >= 3) return;
          state.images.push(item.img);
          renderUploads();
        });
      }
      uploadGrid.querySelectorAll('[data-remove-idx]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
          state.images.splice(idx, 1);
          renderUploads();
        });
      });
    }

    renderUploads();

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (!state.reason) {
          window.alert('请选择退款原因');
          return;
        }
        persistAndGoDetail('pre_ship', {
          reason: state.reason,
          qty: state.qty,
          amount: state.amount,
          desc: state.desc,
          images: state.images
        });
      });
    }

    bindSheetClose();
  }

  function initDetailPage() {
    var refundType = getRefundType();
    var stage = getDetailStage();
    if (isResultStage(stage)) {
      renderResultDetail(refundType, stage);
      /* success/failed/closed 结果页也会打开「宝贝售后详情」等 sheet，需绑定关闭 */
      bindSheetClose();
      return;
    }
    if (refundType === 'restock') {
      var app = loadApplication() || {};
      if (tryAutoCloseRestockOnDetail(app, refundType)) {
        showToast(
          (app.restockCloseSource || '').indexOf('auto_') === 0
            ? '已满 ' + RESTOCK_AUTO_CONFIRM_DAYS + ' 天，系统自动确认收货并关闭补货'
            : app.restockCloseSource === 'store_inbound'
              ? '门店收货入库已反写，补货已关闭'
              : '补货已关闭'
        );
        window.location.replace(
          buildDetailHref({ type: 'restock', stage: 'success', shipped: '1' })
        );
        return;
      }
    }
    renderProgressDetail(refundType, stage);
  }

  function renderResultDetail(refundType, stage) {
    var delivery = getDelivery();
    var item = getItem();
    var app = loadApplication() || {};
    var isReturn = refundType === 'return';
    var isRestock = refundType === 'restock';
    var isExchange = refundType === 'exchange';
    var shell = document.querySelector('.ua-order-refund-detail-page');
    if (shell && isClosedHeroLayout(refundType, stage)) {
      shell.classList.add('ua-order-refund-detail-page--closed-hero');
    } else if (shell) {
      shell.classList.add('ua-order-refund-detail-page--result');
    }

    if (!app.refundNo) {
      app = Object.assign(
        {
          reason: getParams().get('reason') || '不想要或者多拍了',
          qty: item.qty,
          amount: item.paidAmount != null ? item.paidAmount : item.priceNum * item.qty,
          applyTime: formatDateTime(),
          refundNo: genRefundNo(),
          formType: isReturn ? 'return' : isRestock ? 'restock' : isExchange ? 'exchange' : 'refund_only',
          delivery: delivery,
          itemIndex: getItemIndex(),
          productName: item.name,
          productSpec: item.spec,
          productImg: item.img
        },
        app
      );
      saveApplication(app);
    }

    if (getParams().get('closeReason')) {
      app.closeReason = getParams().get('closeReason');
    }
    syncAftersaleRecordFromApp(app, refundType, stage);

    var resultTime = app.resultTime || app.closedTime || formatDateTime();
    if (stage === 'success' && !app.resultTime) {
      app.resultTime = resultTime;
      saveApplication(app);
    }

    var backEl = document.getElementById('refundDetailBack');
    if (backEl) backEl.setAttribute('href', buildDetailBackHref());
    initNav(getDetailNavTitle(refundType), buildDetailBackHref());

    var hero = document.getElementById('refundDetailHero');
    var noticeEl = document.getElementById('refundDetailNotice');
    var returnSection = document.getElementById('refundDetailReturnSection');
    var resultHead = document.getElementById('refundResultHead');
    var breakdown = document.getElementById('refundResultBreakdown');
    var messageCard = document.getElementById('refundResultMessage');
    var infoTitle = document.getElementById('refundInfoSectionTitle');

    if (isClosedHeroLayout(refundType, stage)) {
      renderClosedHeroResult(refundType, stage, app, item, delivery, resultTime);
      bindNegotiateHistoryPanel(app, item, refundType);
      var closedHistoryBtn = document.getElementById('refundHistoryRefundBtn');
      if (closedHistoryBtn && !closedHistoryBtn.getAttribute('data-bound')) {
        closedHistoryBtn.setAttribute('data-bound', '1');
        closedHistoryBtn.addEventListener('click', function () {
          openRefundHistorySheet(app, item, refundType);
        });
      }
      return;
    }

    if (hero) hero.hidden = true;
    if (noticeEl) noticeEl.hidden = true;
    if (returnSection) returnSection.hidden = true;
    if (resultHead) resultHead.hidden = false;
    if (infoTitle) {
      infoTitle.hidden = false;
      infoTitle.textContent = isRestock
        ? '补货信息'
        : isExchange
          ? '换货信息'
          : isReturn
            ? '退货信息'
            : '退款信息';
    }

    var resultTitleEl = document.getElementById('refundResultTitle');
    var resultTimeEl = document.getElementById('refundResultTime');
    if (resultTitleEl) resultTitleEl.textContent = getResultTitle(refundType, stage);
    if (resultTimeEl) resultTimeEl.textContent = resultTime;

    if (stage === 'success') {
      if (isRestock || isExchange) {
        if (breakdown) breakdown.hidden = true;
        if (messageCard) messageCard.hidden = false;
        var successMainEl = document.getElementById('refundResultMessageMain');
        var successSubEl = document.getElementById('refundResultMessageSub');
        var successReasonEl = document.getElementById('refundResultRejectReason');
        if (successSubEl) successSubEl.hidden = true;
        if (successReasonEl) successReasonEl.hidden = true;
        if (successMainEl) {
          successMainEl.textContent = isRestock
            ? isWarehouseDelivery(app.delivery || delivery)
              ? '补货已完成，商品已确认收货并入库。'
              : '补货已完成，请注意查收商品。'
            : '换货已完成，请注意查收商品。';
        }
      } else {
      if (breakdown) breakdown.hidden = false;
      if (messageCard) messageCard.hidden = true;
      var total = app.amount != null ? app.amount : item.priceNum * item.qty;
      var totalEl = document.getElementById('refundResultTotalAmount');
      if (totalEl) totalEl.textContent = formatPrice(total);
      var listEl = document.getElementById('refundResultBreakdownList');
      if (listEl) {
        listEl.innerHTML = computeRefundBreakdown(total)
          .map(function (part) {
            return (
              '<li class="ua-or-result-breakdown__item"><span>' +
              part.label +
              '</span><span>' +
              formatPrice(part.amount) +
              '</span></li>'
            );
          })
          .join('');
      }
      }
    } else {
      if (breakdown) breakdown.hidden = true;
      if (messageCard) messageCard.hidden = false;
      var mainEl = document.getElementById('refundResultMessageMain');
      var subEl = document.getElementById('refundResultMessageSub');
      var reasonEl = document.getElementById('refundResultRejectReason');
      if (subEl) subEl.hidden = true;
      if (reasonEl) reasonEl.hidden = true;

      if (stage === 'failed') {
        if (mainEl) mainEl.textContent = getRejectMainText(refundType);
        if (reasonEl) {
          reasonEl.hidden = false;
          reasonEl.textContent =
            '拒绝原因：' + (app.rejectReason || getDefaultRejectReason(refundType));
        }
        if (subEl && (isRestock || isExchange)) {
          subEl.hidden = false;
          subEl.textContent = isRestock
            ? '补货被拒，如问题未解决可重新发起补货申请'
            : '换货被拒，如问题未解决可重新发起换货申请';
        }
      } else if (stage === 'closed') {
        var closeReason = getCloseReason();
        var appDelivery = app.delivery || delivery;
        if (closeReason === 'cancel') {
          if (mainEl) {
            if (isRestock) {
              mainEl.textContent = '因您撤销补货申请，补货已关闭，交易将正常进行。';
            } else if (isExchange) {
              mainEl.textContent = '因您撤销换货申请，换货已关闭，交易将正常进行。';
            } else {
              mainEl.textContent = isAftersaleScene()
                ? '因您撤销售后服务申请，售后已关闭，交易将正常进行。请注意交易超时'
                : '因您撤销退款申请，退款已关闭，交易将正常进行。请注意交易超时';
            }
          }
        } else if (closeReason === 'close_return') {
          if (mainEl) {
            mainEl.textContent = isExchange
              ? '因您关闭退货寄回，本次换货申请已关闭，交易将正常进行。'
              : '因您关闭退货寄回，本次退货退款申请已关闭，交易将正常进行。';
          }
          if (subEl) {
            subEl.hidden = false;
            subEl.textContent = '如果您的问题未解决，您可以重新发起申请';
          }
          if (reasonEl) {
            reasonEl.hidden = false;
            reasonEl.textContent =
              '关闭原因：' + (app.closeReturnReason || '计划有变，暂时不需要寄了');
          }
        } else if (closeReason === 'reject_receive') {
          if (mainEl) mainEl.textContent = buildRejectedReceiveCloseText(appDelivery);
          if (subEl) {
            subEl.hidden = false;
            subEl.textContent = '如果您的问题未解决，您可以重新发起申请';
          }
          if (reasonEl) {
            reasonEl.hidden = false;
            reasonEl.textContent =
              '关闭原因：' +
              (app.rejectReceiveReason || '退货商品与申请不符，不符合退货要求');
          }
        } else if (closeReason === 'timeout') {
          if (isReturn) {
            if (mainEl) mainEl.textContent = '因您超时未寄回商品，本次申请关闭';
          } else if (isRestock) {
            if (mainEl) mainEl.textContent = '因超时未处理，本次补货申请关闭';
          } else if (isExchange) {
            if (mainEl) mainEl.textContent = '因超时未处理，本次换货申请关闭';
          } else {
            if (mainEl) mainEl.textContent = '因您超时未处理，本次申请关闭';
          }
          if (subEl) {
            subEl.hidden = false;
            subEl.textContent = '如果您的问题未解决，您可以重新发起申请';
          }
        }
      }
    }

    renderDetailInfoCard(app, item, refundType);

    var footer = document.getElementById('refundDetailFooter');
    if (footer) {
      footer.className = 'ua-or-detail-footer';
      if (stage === 'success') {
        footer.innerHTML = '';
      } else if (getParams().get('expired') === '1') {
        footer.innerHTML = '';
      } else {
        footer.className = 'ua-or-detail-footer ua-or-detail-footer--reapply';
        footer.innerHTML =
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--outline" id="refundDetailReapplyBtn">重新发起</button>';
        var reapplyBtn = document.getElementById('refundDetailReapplyBtn');
        if (reapplyBtn) {
          reapplyBtn.addEventListener('click', function () {
            try {
              sessionStorage.removeItem(STORAGE_KEY);
            } catch (e) {
              /* ignore */
            }
            window.location.href = buildReapplyHref(app);
          });
        }
      }
    }
  }

  function parseDateTimeText(text) {
    var m = String(text || '').match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/
    );
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  }

  function formatChineseDateTime(date) {
    var d = date instanceof Date ? date : parseDateTimeText(date) || new Date();
    return (
      d.getFullYear() +
      '-' +
      pad2(d.getMonth() + 1) +
      '-' +
      pad2(d.getDate()) +
      ' ' +
      pad2(d.getHours()) +
      '时' +
      pad2(d.getMinutes()) +
      '分' +
      pad2(d.getSeconds()) +
      '秒'
    );
  }

  function shiftSeconds(date, delta) {
    var d = new Date(date.getTime());
    d.setSeconds(d.getSeconds() + delta);
    return d;
  }

  function getNegotiateTypeLabels(refundType) {
    if (refundType === 'exchange') {
      return {
        action: '换货',
        goods: '换货商品',
        qty: '换货数量',
        reason: '换货原因',
        desc: '换货说明',
        agree: '换货'
      };
    }
    if (refundType === 'restock') {
      return {
        action: '补货',
        goods: '补货商品',
        qty: '补货数量',
        reason: '补货原因',
        desc: '补货说明',
        agree: '补货'
      };
    }
    if (refundType === 'return') {
      return {
        action: '退货退款',
        goods: '退货商品',
        qty: '退货数量',
        reason: '退货原因',
        desc: '退货说明',
        agree: '退货退款'
      };
    }
    return {
      action: '退款',
      goods: '退款商品',
      qty: '退款数量',
      reason: '退款原因',
      desc: '退款说明',
      agree: '退款'
    };
  }

  /** 协商历史演示数据，按时间倒序（最新在前） */
  function buildNegotiateHistory(app, item, refundType, stage) {
    var labels = getNegotiateTypeLabels(refundType);
    var buyerName = DEMO_BUYER.account;
    var sellerName = getDemoSupplierName();
    var applyRaw = app.applyTime || formatDateTime();
    var applyDate = parseDateTimeText(applyRaw) || new Date();
    var applyTime = formatDateTime(applyDate);
    var productName = app.productName || item.name || '';
    var productSpec = app.productSpec || item.spec || '';
    var qty =
      refundType === 'restock' ? getApplyRestockQty(app, item) : app.qty != null ? app.qty : item.qty;
    var actualQty = refundType === 'restock' ? getActualRestockQty(app) : null;
    var reason = app.reason || getParams().get('reason') || '七天无理由退换货';
    var receiveAddr = app.receiveAddress || getDemoBuyerReceiveAddress();
    var returnAddr = getReturnAddressText(app, sellerName);
    var agreeDate = shiftSeconds(applyDate, 14);
    var buyerFields = [
      { label: labels.goods, value: productName + (productSpec ? ' ' + productSpec : '') },
      {
        label: refundType === 'restock' ? '申请补货数量' : labels.qty,
        value: String(qty)
      }
    ];
    if (refundType === 'restock') {
      buyerFields.push({
        label: '实际补货数量',
        value: actualQty != null ? String(actualQty) : '待确认收货后回写'
      });
    }
    if (refundType === 'exchange' || refundType === 'return' || refundType === 'restock') {
      buyerFields.push({ label: '收货地址', value: receiveAddr });
    }
    buyerFields.push({ label: labels.reason, value: reason });
    buyerFields.push({ label: labels.desc, value: app.desc || '' });

    var entries = [
      {
        id: 'buyer-create',
        role: 'buyer',
        name: buyerName,
        avatar: '../assets/profile-avatar.svg',
        time: applyTime,
        timeMs: applyDate.getTime(),
        summary:
          '买家(' +
          buyerName +
          ')于' +
          formatChineseDateTime(applyDate) +
          '创建了' +
          labels.action +
          '申请',
        fields: buyerFields
      },
      {
        id: 'seller-agree',
        role: 'seller',
        name: sellerName,
        avatar: '../assets/restock/me-shop-avatar.svg',
        time: formatDateTime(agreeDate),
        timeMs: agreeDate.getTime(),
        summary: '卖家(' + sellerName + ')已同意' + labels.agree + '申请',
        fields: [
          { label: '退货地址', value: returnAddr },
          { label: '退货说明', value: app.returnDesc || '' }
        ],
        copyText: returnAddr,
        copyLabel: '复制地址'
      }
    ];

    entries.sort(function (a, b) {
      return b.timeMs - a.timeMs;
    });
    return entries;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderNegotiateHistoryList(entries) {
    var listEl = document.getElementById('refundNegotiateList');
    if (!listEl) return;
    listEl.innerHTML = entries
      .map(function (entry) {
        var avatarClass =
          'ua-or-negotiate-item__avatar ua-or-negotiate-item__avatar--' +
          (entry.role || 'buyer');
        var avatarHtml = entry.avatar
          ? '<img class="' +
            avatarClass +
            '" src="' +
            escapeHtml(entry.avatar) +
            '" alt="">'
          : '<span class="' + avatarClass + '" aria-hidden="true"></span>';
        var fieldsHtml = '';
        if (entry.fields && entry.fields.length) {
          fieldsHtml =
            '<p class="ua-or-negotiate-item__content-label">【内容】</p>' +
            '<ul class="ua-or-negotiate-item__fields">' +
            entry.fields
              .map(function (f) {
                return (
                  '<li class="ua-or-negotiate-item__field">' +
                  '<span class="ua-or-negotiate-item__field-label">' +
                  escapeHtml(f.label) +
                  '：</span>' +
                  '<span class="ua-or-negotiate-item__field-value">' +
                  escapeHtml(f.value == null ? '' : f.value) +
                  '</span>' +
                  '</li>'
                );
              })
              .join('') +
            '</ul>';
        }
        var actionsHtml = '';
        if (entry.copyText) {
          actionsHtml =
            '<div class="ua-or-negotiate-item__actions">' +
            '<button type="button" class="ua-or-negotiate-item__copy" data-copy="' +
            escapeHtml(entry.copyText) +
            '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
            '<rect x="8" y="8" width="11" height="13" rx="1.5"/>' +
            '<path d="M5 16V5.5A1.5 1.5 0 016.5 4H15"/>' +
            '</svg>' +
            '<span>' +
            escapeHtml(entry.copyLabel || '复制') +
            '</span>' +
            '</button>' +
            '</div>';
        }
        return (
          '<article class="ua-or-negotiate-item">' +
          '<div class="ua-or-negotiate-item__head">' +
          avatarHtml +
          '<div class="ua-or-negotiate-item__meta">' +
          '<span class="ua-or-negotiate-item__name">' +
          escapeHtml(entry.name) +
          '</span>' +
          '<span class="ua-or-negotiate-item__time">' +
          escapeHtml(entry.time) +
          '</span>' +
          '</div>' +
          '</div>' +
          '<p class="ua-or-negotiate-item__summary">' +
          escapeHtml(entry.summary) +
          '</p>' +
          fieldsHtml +
          actionsHtml +
          '</article>'
        );
      })
      .join('');

    listEl.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy') || '', '已复制地址');
      });
    });
  }

  function openNegotiateHistory(app, item, refundType, stage) {
    var panel = document.getElementById('refundNegotiatePanel');
    if (!panel) return;
    var entries = buildNegotiateHistory(app, item, refundType, stage || getDetailStage());
    renderNegotiateHistoryList(entries);
    panel.hidden = false;
    var shell = document.querySelector('.ua-order-refund-detail-page');
    if (shell) shell.classList.add('is-negotiate-open');
  }

  function closeNegotiateHistory() {
    var panel = document.getElementById('refundNegotiatePanel');
    if (panel) panel.hidden = true;
    var shell = document.querySelector('.ua-order-refund-detail-page');
    if (shell) shell.classList.remove('is-negotiate-open');
  }

  var negotiateHistoryCtx = { app: null, item: null, refundType: 'return' };

  function bindNegotiateHistoryPanel(app, item, refundType) {
    negotiateHistoryCtx.app = app || {};
    negotiateHistoryCtx.item = item || getItem();
    negotiateHistoryCtx.refundType = refundType || getRefundType();

    var negotiateBtn = document.getElementById('refundNegotiateHistoryBtn');
    if (negotiateBtn && !negotiateBtn.getAttribute('data-bound')) {
      negotiateBtn.setAttribute('data-bound', '1');
      negotiateBtn.addEventListener('click', function () {
        openNegotiateHistory(
          negotiateHistoryCtx.app,
          negotiateHistoryCtx.item,
          negotiateHistoryCtx.refundType,
          getDetailStage()
        );
      });
    }

    var backBtn = document.getElementById('refundNegotiateBack');
    if (backBtn && !backBtn.getAttribute('data-bound')) {
      backBtn.setAttribute('data-bound', '1');
      backBtn.addEventListener('click', closeNegotiateHistory);
    }
  }

  function renderDetailInfoCard(app, item, refundType, opts) {
    opts = opts || {};
    refundType = refundType || getRefundType();
    var isRestock = refundType === 'restock';
    var isExchange = refundType === 'exchange';
    var isReturn = refundType === 'return';
    var cancelClosed = !!opts.cancelClosed;

    var productEl = document.getElementById('refundDetailProduct');
    if (productEl) {
      var tags = [];
      if (!cancelClosed && (isReturn || app.reason === '七天无理由退换货')) {
        tags.push('7天无理由退换');
      }
      productEl.innerHTML =
        '<img class="ua-or-product__img" src="' +
        (app.productImg || item.img) +
        '" alt="">' +
        '<div class="ua-or-product__body">' +
        '<div class="ua-or-product__name">' +
        formatProductNameHtml(
          app.productName || item.name,
          app.itemIndex != null ? app.itemIndex : getItemIndex()
        ) +
        '</div>' +
        '<div class="ua-or-product__spec">' +
        (app.restockSummary || app.exchangeSummary || app.productSpec || item.spec) +
        '</div>' +
        (cancelClosed
          ? '<a href="#" class="ua-or-product__vip-link" id="refundDetailVipLink">88VIP退货包运费<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></a>'
          : tags.length
            ? '<div class="ua-or-product__tags">' + tags.join(' · ') + '</div>'
            : '') +
        '</div>';
      var vipLink = document.getElementById('refundDetailVipLink');
      if (vipLink) {
        vipLink.addEventListener('click', function (e) {
          e.preventDefault();
          showToast('88VIP 退货包运费');
        });
      }
    }

    var reasonLabelEl = document.querySelector('#refundDetailReason')
      ? document.querySelector('#refundDetailReason').previousElementSibling
      : null;
    if (reasonLabelEl && reasonLabelEl.classList.contains('ua-or-detail-info-row__label')) {
      reasonLabelEl.textContent = isRestock
        ? '补货原因'
        : isExchange
          ? '换货原因'
          : isReturn
            ? '退款原因'
            : '退款原因';
    }

    var reasonEl = document.getElementById('refundDetailReason');
    if (reasonEl) reasonEl.textContent = app.reason || getParams().get('reason') || '—';

    var applyQtyRow = document.getElementById('refundDetailApplyQtyRow');
    var applyQtyEl = document.getElementById('refundDetailApplyQty');
    var actualQtyRow = document.getElementById('refundDetailActualQtyRow');
    var actualQtyEl = document.getElementById('refundDetailActualQty');
    // 仅补货详情展示申请/实际补货数量；仅退款/退货退款/换货等页不展示
    if (isRestock) {
      var applyQty = getApplyRestockQty(app, item);
      var actualQty = getActualRestockQty(app);
      if (applyQtyRow) applyQtyRow.hidden = false;
      if (applyQtyEl) applyQtyEl.textContent = String(applyQty);
      if (actualQtyRow) actualQtyRow.hidden = false;
      if (actualQtyEl) {
        actualQtyEl.textContent = actualQty != null ? String(actualQty) : '—';
      }
    } else {
      if (applyQtyRow) applyQtyRow.hidden = true;
      if (applyQtyEl) applyQtyEl.textContent = '—';
      if (actualQtyRow) actualQtyRow.hidden = true;
      if (actualQtyEl) actualQtyEl.textContent = '—';
    }

    var amountRow = document.getElementById('refundDetailAmount');
    if (amountRow) {
      var amountRowWrap = amountRow.closest('.ua-or-detail-info-row');
      if (isRestock || isExchange) {
        if (amountRowWrap) amountRowWrap.hidden = true;
      } else {
        if (amountRowWrap) amountRowWrap.hidden = false;
        var amountNum =
          app.amount != null
            ? app.amount
            : item.paidAmount != null
              ? item.paidAmount
              : item.priceNum * item.qty;
        if (cancelClosed) {
          amountRow.className =
            'ua-or-detail-info-row__value ua-or-detail-info-row__value--amount ua-or-detail-info-row__value--amount-block';
          var discount = 0.05;
          var payLater = Math.round((amountNum - discount) * 100) / 100;
          amountRow.innerHTML =
            '<span class="ua-or-detail-info-row__amount-main">共' +
            amountNum.toFixed(2) +
            '元</span>' +
            '<span class="ua-or-detail-info-row__amount-sub">(恢复先用后付额度 ¥ ' +
            payLater.toFixed(2) +
            ', 优惠 ¥ ' +
            discount.toFixed(2) +
            ')</span>';
        } else {
          amountRow.className = 'ua-or-detail-info-row__value ua-or-detail-info-row__value--amount';
          amountRow.textContent = '共' + Number(amountNum).toFixed(2) + '元';
        }
      }
    }

    var timeEl = document.getElementById('refundDetailApplyTime');
    if (timeEl) {
      timeEl.textContent = cancelClosed
        ? formatResultDateTime(app.applyTime || formatDateTime())
        : app.applyTime || formatDateTime();
    }

    var noLabelEl = document.querySelector('#refundDetailNo')
      ? document.querySelector('#refundDetailNo').closest('.ua-or-detail-info-row')
      : null;
    if (noLabelEl) {
      var noLabel = noLabelEl.querySelector('.ua-or-detail-info-row__label');
      if (noLabel) {
        noLabel.textContent = isRestock
          ? '补货编号'
          : isExchange
            ? '换货编号'
            : isReturn
              ? '退款编号'
              : '退款编号';
      }
    }

    var noEl = document.getElementById('refundDetailNo');
    if (noEl) noEl.textContent = app.refundNo || genRefundNo();

    var copyBtn = document.getElementById('refundDetailCopyBtn');
    if (copyBtn) {
      if (cancelClosed) copyBtn.textContent = '· 复制';
      copyBtn.onclick = function (e) {
        e.stopPropagation();
        copyText(
          (noEl && noEl.textContent) || '',
          isRestock ? '已复制补货编号' : isExchange ? '已复制换货编号' : '已复制退款编号'
        );
      };
    }

    var aftersaleEl = document.getElementById('refundDetailAftersale');
    var toggleBtn = document.getElementById('refundAftersaleToggle');
    var toggleText = document.getElementById('refundAftersaleToggleText');

    function syncAftersaleToggle(open) {
      if (aftersaleEl) aftersaleEl.hidden = !open;
      if (toggleBtn) {
        toggleBtn.classList.toggle('is-open', open);
        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (toggleText) {
        toggleText.textContent = open ? '收起售后信息' : '查看全部售后信息';
      }
    }

    if (toggleBtn && !toggleBtn.getAttribute('data-bound')) {
      toggleBtn.setAttribute('data-bound', '1');
      toggleBtn.addEventListener('click', function () {
        var open = toggleBtn.getAttribute('aria-expanded') !== 'true';
        syncAftersaleToggle(open);
      });
    }
    syncAftersaleToggle(cancelClosed || (toggleBtn && toggleBtn.getAttribute('aria-expanded') === 'true'));

    bindNegotiateHistoryPanel(app, item, refundType);

    var historyBtn = document.getElementById('refundHistoryRefundBtn');
    if (historyBtn && !historyBtn.getAttribute('data-bound')) {
      historyBtn.setAttribute('data-bound', '1');
      historyBtn.addEventListener('click', function () {
        openRefundHistorySheet(app, item, refundType);
      });
    }
  }

  function buildRefundHistoryRecords(app, item, refundType) {
    var baseItem = item || getItem();
    var alt = DEMO_ITEMS[1] || baseItem;
    var name = (app && app.productName) || baseItem.name;
    var spec = (app && app.productSpec) || baseItem.spec;
    var img = (app && app.productImg) || baseItem.img;
    var qty = (app && app.qty != null ? app.qty : baseItem.qty) || 1;
    var amount =
      app && app.amount != null
        ? app.amount
        : baseItem.paidAmount != null
          ? baseItem.paidAmount
          : baseItem.priceNum * qty;

    return [
      {
        id: 'hist-processing',
        status: '退款中',
        statusKey: 'processing',
        name: name,
        spec: spec,
        img: img,
        qty: qty,
        amount: amount,
        stage: refundType === 'return' ? 'return' : 'audit'
      },
      {
        id: 'hist-closed',
        status: '已关闭',
        statusKey: 'closed',
        name: alt.name,
        spec: alt.spec,
        img: alt.img,
        qty: alt.qty || 1,
        amount: alt.paidAmount != null ? alt.paidAmount : alt.priceNum * (alt.qty || 1),
        stage: 'closed',
        closeReason: 'close_return'
      },
      {
        id: 'hist-success',
        status: '已成功',
        statusKey: 'success',
        name: name,
        spec: spec,
        img: img,
        qty: 1,
        amount: baseItem.priceNum || amount,
        stage: 'success'
      }
    ];
  }

  function openRefundHistorySheet(app, item, refundType) {
    var listEl = document.getElementById('refundHistoryList');
    if (!listEl) {
      showToast('历史退款记录（演示）');
      return;
    }
    var records = buildRefundHistoryRecords(app, item, refundType || getRefundType());
    listEl.innerHTML = records
      .map(function (row) {
        return (
          '<button type="button" class="ua-or-history-card" data-stage="' +
          escapeHtml(row.stage || '') +
          '" data-close="' +
          escapeHtml(row.closeReason || '') +
          '">' +
          '<span class="ua-or-history-card__thumb">' +
          '<img src="' +
          escapeHtml(row.img) +
          '" alt="">' +
          '<span class="ua-or-history-card__status">' +
          escapeHtml(row.status) +
          '</span>' +
          '</span>' +
          '<span class="ua-or-history-card__body">' +
          '<span class="ua-or-history-card__title">' +
          escapeHtml(row.name) +
          '</span>' +
          '<span class="ua-or-history-card__spec">' +
          escapeHtml(row.spec) +
          '</span>' +
          '<span class="ua-or-history-card__meta">数量' +
          escapeHtml(String(row.qty)) +
          '; <em>¥ ' +
          Number(row.amount).toFixed(2) +
          '</em></span>' +
          '</span>' +
          '<span class="ua-or-history-card__action">查看' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
          '</span>' +
          '</button>'
        );
      })
      .join('');

    listEl.querySelectorAll('.ua-or-history-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var stage = card.getAttribute('data-stage') || 'audit';
        var closeReason = card.getAttribute('data-close') || '';
        var extra = { type: refundType || getRefundType(), stage: stage };
        if (closeReason) extra.closeReason = closeReason;
        closeSheet('refundHistorySheet');
        window.location.href = buildDetailHref(extra);
      });
    });

    openSheet('refundHistorySheet');
  }

  function renderProgressDetail(refundType, stage) {
    var refundType = getRefundType();
    var stage = getDetailStage();
    var delivery = getDelivery();
    var item = getItem();
    var app = loadApplication() || {};
    var isReturn = refundType === 'return';
    var isRestock = refundType === 'restock';
    var isExchange = refundType === 'exchange';
    var logisticsEdit = getParams().get('logistics') === 'edit';
    var warehouseReturn = isReturn && isWarehouseDelivery(delivery);
    var pickupReturn = isReturn && isPickupDelivery(delivery);
    var pickupRestock = isRestock && isPickupDelivery(delivery);
    /* 零售快递补货：供应商补货到家（进货快递仍为到店，走原逻辑） */
    var retailHomeRestock = isRestock && isExpressDelivery(delivery) && isRetailApp();
    var steps = REFUND_ONLY_STEPS;
    if (isReturn) {
      if (warehouseReturn) steps = RETURN_STEPS_WAREHOUSE.slice();
      else if (pickupReturn) steps = RETURN_STEPS_PICKUP.slice();
      else steps = RETURN_STEPS.slice();
    } else if (isRestock) {
      steps = pickupRestock
        ? RESTOCK_STEPS_PICKUP.slice()
        : isRestock && isWarehouseDelivery(delivery)
          ? RESTOCK_STEPS_WAREHOUSE.slice()
          : RESTOCK_STEPS.slice();
    } else if (isExchange) {
      steps = EXCHANGE_STEPS;
    }

    if (!app.refundNo) {
      app = Object.assign(
        {
          reason: getParams().get('reason') || '我不想要了',
          qty: item.qty,
          amount: item.paidAmount != null ? item.paidAmount : item.priceNum * item.qty,
          applyTime: formatDateTime(),
          refundNo: genRefundNo(),
          formType: isReturn ? 'return' : isRestock ? 'restock' : isExchange ? 'exchange' : 'refund_only',
          delivery: delivery,
          itemIndex: getItemIndex(),
          productName: item.name,
          productSpec: item.spec,
          productImg: item.img
        },
        app
      );
      ensureReturnAddressOnApp(app);
      saveApplication(app);
    } else {
      ensureReturnAddressOnApp(app);
      app.delivery = app.delivery || delivery;
      saveApplication(app);
    }

    /* 配送退仓：清理误生成的取件码/上门取件态 */
    if (warehouseReturn && isPickupScheduled(app)) {
      clearPickupScheduled(app);
      app = loadApplication() || app;
    }

    /*
     * 配送退货必须逐步推进：平台审核 → 待取货 → 待入库 → 平台退款
     * 审核中清掉历史取货/入库标记，避免点审核后被旧状态直接拽到平台退款
     */
    if (warehouseReturn && stage === 'audit') {
      if (app.driverPickedUp || app.warehouseInbound) {
        resetDeliveryReturnProgress(app);
        app = loadApplication() || app;
      }
    }

    syncAftersaleRecordFromApp(app, refundType, stage);

    var state = {
      refundType: refundType,
      stage: stage,
      delivery: app.delivery || delivery,
      logisticsEdit: logisticsEdit,
      courier: app.courier || '顺丰速运',
      trackingNo: app.trackingNo || '',
      deadline:
        isReturn && (stage === 'return' || stage === 'refund')
          ? Date.now() + 7 * 24 * 60 * 60 * 1000 - 1000
          : Date.now() + 24 * 60 * 60 * 1000
    };

    var expressReturn = isReturn && isExpressReturnFlow(delivery);
    /*
     * 寄回后阶段对齐：
     * - 配送：司机已取货 → 待入库（refund）
     * - 自提：门店确认收货 → 平台退款（refund）
     * - 快递（到家/到店）：已填物流仍停在「寄回商品」（return），后台确认收货后才进「平台退款」
     */
    if (isReturn && stage === 'return' && isReturnShipCompleted(app)) {
      if (warehouseReturn) {
        if (app.warehouseInbound) {
          resetDeliveryReturnProgress(app);
          app = loadApplication() || app;
        } else {
          window.location.replace(
            buildDetailHref({ type: refundType, stage: 'refund', pickupPhase: '' })
          );
          return;
        }
      } else if (pickupReturn) {
        window.location.replace(
          buildDetailHref({ type: refundType, stage: 'refund', pickupPhase: '' })
        );
        return;
      }
      /* expressReturn：停留 return，不自动跳 refund */
    }

    if (isReturn && stage === 'refund') {
      if (!isReturnShipCompleted(app)) {
        if (warehouseReturn) {
          app.warehouseInbound = false;
          delete app.warehouseInboundAt;
          saveApplication(app);
        }
        window.location.replace(
          buildDetailHref({ type: refundType, stage: 'return', pickupPhase: '' })
        );
        return;
      }
      /* 快递已寄回但后台未确认收货：退回「寄回商品」节点 */
      if (expressReturn && !isMerchantConfirmedReceive(app)) {
        var keepPhase =
          app.pickupPhase || getPickupPhaseFromUrl() || (isReturnShipCompleted(app) ? 'picked' : '');
        window.location.replace(
          buildDetailHref({
            type: refundType,
            stage: 'return',
            pickupPhase: keepPhase
          })
        );
        return;
      }
    }

    initNav(getDetailNavTitle(refundType), buildDetailBackHref());
    var backEl = document.getElementById('refundDetailBack');
    if (backEl) backEl.setAttribute('href', buildDetailBackHref());

    var statusConfig = {
      audit: {
        title: isRestock
          ? '请等待平台处理补货'
          : isExchange
            ? '请等待平台处理换货'
            : '请等待平台审核',
        notice:
          isRestock
            ? '您已成功发起补货申请，请耐心等待平台审核处理。'
            : isExchange
              ? '您已成功发起换货申请，请耐心等待平台审核处理。'
              : '您已成功发起' +
                (isReturn ? '退货退款' : '退款') +
                '申请，请耐心等待平台审核。若平台在倒计时结束前未处理，系统将自动同意您的申请。'
      },
      return: {
        title: warehouseReturn
          ? '待取货'
          : pickupReturn
            ? '请退回门店'
            : expressReturn && isReturnShipCompleted(app)
              ? '待商家退款'
              : '请寄回退货商品',
        notice: warehouseReturn
          ? '平台已同意退货。配送订单由门店退回仓库，物流司机将上门取货。'
          : pickupReturn
            ? '平台已同意退货。请将商品退回提货门店，门店确认收货后将触发退款。'
            : expressReturn && isReturnShipCompleted(app)
              ? buildRefundStageNotice(delivery)
              : '平台已同意退货，请将商品寄回供应商地址，并在下方填写退货物流信息。'
      },
      refund: {
        title: warehouseReturn
          ? isDeliveryWarehouseInbound(app)
            ? '平台退款中'
            : '待入库'
          : pickupReturn
            ? '平台退款中'
            : isReturn
              ? '请等待平台退款'
              : '请等待平台退款',
        notice: warehouseReturn
          ? isDeliveryWarehouseInbound(app)
            ? '仓库已入库，平台正在处理退款，请耐心等待。'
            : '司机已取货，商品退回仓库途中，仓库入仓后将触发退款。'
          : pickupReturn
            ? '门店已确认收到退货，平台正在处理退款，请耐心等待。'
            : expressReturn
              ? '商家已确认收货，退款处理中，请耐心等待'
              : ''
      },
      reject_return: {
        title: '商品退回中',
        notice: ''
      },
      reship: {
        title: isRestock ? '请等待补货寄出' : '请等待换货寄出',
        notice: ''
      },
      success: {
        title: isRestock ? '补货完成' : isExchange ? '换货完成' : '退款成功',
        notice: isRestock
          ? pickupRestock
            ? '补货已完成，您已到店取货。'
            : isWarehouseDelivery(delivery)
              ? '补货已完成，商品已确认收货并入库。'
              : retailHomeRestock
                ? '补货已完成，商品已配送到家，请注意查收。'
                : '补货已完成，请注意查收商品。'
          : isExchange
            ? '换货已完成，请注意查收商品。'
            : '退款已成功，款项将按原路退回，请注意查收。'
      }
    };

    var cfg = statusConfig[stage] || statusConfig.audit;
    if (stage === 'refund' && !isReturn) {
      cfg = Object.assign({}, cfg, {
        notice: buildRefundStageNotice(state.delivery)
      });
    }
    if (stage === 'reject_return') {
      ensureRejectReturnData(app, state);
      cfg = Object.assign({}, cfg, {
        title: isRejectBackSigned(app) ? '退回已签收' : '商品退回中',
        notice: isRejectBackSigned(app)
          ? '退回物流已签收，本次售后单即将关闭。'
          : buildRejectReturnNotice(state.delivery)
      });
    }
    if (stage === 'reship') {
      ensureReshipData(app);
      var warehouseRestock = isRestock && isWarehouseDelivery(state.delivery);
      if (pickupRestock && isReshipShipped(app)) {
        ensureRestockArriveStore(app);
        app = loadApplication() || app;
      }
      if (isReshipShipped(app)) {
        if (pickupRestock) {
          cfg = Object.assign({}, cfg, {
            title: isRestockAwaitPickup(app) ? '待自提' : '请确认收货',
            notice: isRestockAwaitPickup(app)
              ? '补货商品已送达门店。请到店出示会员码，由门店按原订单核销提货（不单独生成补货订单）。'
              : '补货商品已到店，请尽快取货。'
          });
        } else {
          cfg = Object.assign({}, cfg, {
            title: warehouseRestock
              ? '请确认收货'
              : isRestock
                ? retailHomeRestock
                  ? '补货配送中'
                  : '补货已寄出'
                : '换货已寄出',
            notice: warehouseRestock
              ? '供应商已补发至仓库，仓库已配送到门店。确认收货后将进入门店入库。'
              : isRestock
                ? retailHomeRestock
                  ? '供应商已安排补货快递到家，请留意物流信息，确认收货后完成本次补货。'
                  : '补货商品已发出，请留意物流信息，确认收货后完成本次补货。'
                : '换货商品已发出，请留意物流信息，确认收货后完成本次换货。'
          });
        }
      } else {
        cfg = Object.assign({}, cfg, {
          title: pickupRestock
            ? '请等待补货到店'
            : warehouseRestock
              ? '请等待补货到店'
              : isRestock
                ? retailHomeRestock
                  ? '请等待供应商补货'
                  : '请等待补货寄出'
                : '请等待换货寄出',
          notice: pickupRestock
            ? '平台已同意补货。补货将先送达门店，到店后请出示会员码，由门店按原订单核销提货。'
            : warehouseRestock
              ? '平台已同意补货。供应商将补发至仓库，再由仓库配送到门店。'
              : retailHomeRestock
                ? '平台已同意补货。供应商将直接补货快递到您的收货地址。'
                : ''
        });
      }
    }

    var titleEl = document.getElementById('refundDetailStatusTitle');
    if (titleEl) titleEl.textContent = cfg.title;

    var noticeEl = document.getElementById('refundDetailNotice');
    if (noticeEl) {
      /* 快递退货·寄回后提醒走 notice；物流卡片单独展示 */
      if (!cfg.notice) {
        noticeEl.textContent = '';
        noticeEl.hidden = true;
      } else {
        noticeEl.hidden = false;
        noticeEl.textContent = cfg.notice;
        if (stage === 'refund' && !isReturn) {
          noticeEl.classList.add('ua-or-detail-notice--demo');
          noticeEl.title = '点击模拟拒收退回（演示）';
          noticeEl.addEventListener('click', function () {
            ensureRejectReturnData(app, state);
            window.location.href = buildDetailHref({
              type: refundType,
              stage: 'reject_return'
            });
          });
        }
        if (stage === 'reject_return') {
          noticeEl.classList.add('ua-or-detail-notice--demo');
          if (isRejectBackSigned(app)) {
            noticeEl.title = '退回已签收，点击关闭售后单（演示）';
            noticeEl.addEventListener('click', function () {
              app.closedTime = formatDateTime();
              app.closeReason = 'reject_receive';
              saveApplication(app);
              syncAftersaleRecordFromApp(app, refundType, 'closed');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'closed',
                closeReason: 'reject_receive'
              });
            });
          } else {
            noticeEl.title = '点击模拟退回物流已签收（演示）';
            noticeEl.addEventListener('click', function () {
              markRejectBackSigned(app);
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'reject_return'
              });
            });
          }
        }
      }
    }
    function getNextStage(current) {
      if (current === 'audit') {
        if (isExchange) return 'return';
        if (isRestock) return 'reship';
        return isReturn ? 'return' : 'success';
      }
      if (current === 'return') {
        if (isExchange) return 'reship';
        return 'refund';
      }
      if (current === 'reship') {
        /* 待寄出 → 已寄出；已寄出 → 确认收货完成（零售核销不反写关闭补货） */
        if (!isReshipShipped(app)) return 'reship_shipped';
        return 'success';
      }
      if (current === 'refund') {
        /* 配送：待仓库入库 → 平台退款 → 退款成功（对齐后台：待收货 → 退款中 → 已完成） */
        if (warehouseReturn && !isDeliveryWarehouseInbound(app)) return 'warehouse_inbound';
        return 'success';
      }
      if (current === 'reject_return') {
        return isRejectBackSigned(app) ? 'closed_reject' : 'reject_back_signed';
      }
      return null;
    }

    function getStepActiveIdx() {
      if (stage === 'success') return steps.length - 1;
      if (isRestock) {
        if (pickupRestock) {
          /* 提交0 审核1 补货到店2 待自提3 完成4 */
          if (stage === 'reship') {
            if (!isReshipShipped(app)) return 2;
            return isRestockAwaitPickup(app) ? 3 : 3;
          }
          return 1;
        }
        if (stage === 'reship') return 2;
        return 1;
      }
      if (isExchange) {
        if (stage === 'return') return 2;
        if (stage === 'reship') return 3;
        return 1;
      }
      if (isReturn) {
        if (warehouseReturn) {
          /* 提交申请0 平台审核1 待取货2 待入库3 平台退款4 退款成功5 */
          if (stage === 'return') return 2;
          if (stage === 'refund' || stage === 'reject_return') {
            return isDeliveryWarehouseInbound(app) ? 4 : 3;
          }
          return 1;
        }
        if (pickupReturn) {
          /* 提交0 审核1 退回门店2 平台退款3 成功4 */
          if (stage === 'return') return 2;
          if (stage === 'refund' || stage === 'reject_return') return 3;
          return 1;
        }
        if (stage === 'return') return 2;
        if (stage === 'refund' || stage === 'reject_return') return 3;
        return 1;
      }
      return 1;
    }

    function renderSteps() {
      var el = document.getElementById('refundDetailSteps');
      if (!el) return;
      var activeIdx = getStepActiveIdx();
      var checkSvg =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>';
      el.innerHTML = steps
        .map(function (label, idx) {
          var cls = 'ua-or-detail-step';
          if (idx < activeIdx) cls += ' is-done';
          else if (idx === activeIdx) cls += ' is-active';
          else cls += ' is-pending';
          /* 原型演示：当前高亮节点可点击进入下一阶段 */
          if (idx === activeIdx && stage !== 'success' && stage !== 'closed') {
            cls += ' is-tappable';
          }
          return (
            '<div class="' +
            cls +
            '" data-step-index="' +
            idx +
            '">' +
            '<div class="ua-or-detail-step__dot">' +
            (idx <= activeIdx ? checkSvg : '') +
            '</div>' +
            '<div class="ua-or-detail-step__label">' +
            label +
            '</div></div>'
          );
        })
        .join('');

      if (stage !== 'success' && stage !== 'closed') {
        el.querySelectorAll('.ua-or-detail-step.is-tappable').forEach(function (stepEl) {
          stepEl.addEventListener('click', function () {
            var next = getNextStage(stage);
            if (!next) return;
            /* 平台审核 → 待取货：重置配送进度，确保下一步停在待取货 */
            if (stage === 'audit' && next === 'return' && warehouseReturn) {
              resetDeliveryReturnProgress(app);
              app = loadApplication() || app;
            }
            if (stage === 'return' && next === 'refund') {
              if (warehouseReturn) {
                markDeliveryDriverPicked(app);
                app = loadApplication() || app;
              } else if (pickupReturn) {
                markStoreReceivedReturn(app);
                app = loadApplication() || app;
              } else if (expressReturn) {
                /* 快递：未寄回先补齐寄回态并停在寄回商品；已寄回则模拟后台确认收货 → 平台退款 */
                if (!isReturnShipCompleted(app)) {
                  ensurePickupBoardData(app);
                  markPickupPickedUp(app);
                  syncAftersaleRecordFromApp(app, refundType, 'return');
                  window.location.href = buildDetailHref({
                    type: refundType,
                    stage: 'return',
                    pickupPhase: 'picked'
                  });
                  return;
                }
                markMerchantConfirmedReceive(app);
                app = loadApplication() || app;
              } else {
                ensurePickupBoardData(app);
                markPickupPickedUp(app);
              }
            }
            if (next === 'restock_pickup') {
              /* 仅推进到店待自提；零售核销不再反写关闭补货 */
              ensureRestockArriveStore(app);
              syncAftersaleRecordFromApp(app, refundType, 'reship');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'reship',
                shipped: '1'
              });
              return;
            }
            if (stage === 'return' && next === 'reship') {
              ensurePickupBoardData(app);
              markPickupPickedUp(app);
              ensureReshipData(app);
              saveApplication(app);
            }
            if (next === 'reship' && isRestock) {
              ensureReshipData(app);
            }
            /* 待入库 → 平台退款：仅标记入库，仍停留 refund 阶段 */
            if (next === 'warehouse_inbound') {
              markDeliveryWarehouseInbound(app);
              syncAftersaleRecordFromApp(app, refundType, 'refund');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'refund'
              });
              return;
            }
            if (next === 'success') {
              /* 补货关闭：确认收货录入 / 代采门店入库反写 / 满 10 天自动；零售核销不反写关闭 */
              if (isRestock && isReshipShipped(app)) {
                openRestockReceiveSheet(
                  app,
                  refundType,
                  item,
                  isWarehouseRestock(app, refundType)
                    ? 'warehouse'
                    : retailHomeRestock
                      ? 'home'
                      : 'express'
                );
                return;
              }
              /* 配送退货不允许从中间节点一次跳到成功；须已完成取货+入库 */
              if (warehouseReturn) {
                if (!isDeliveryDriverPicked(app) || !isDeliveryWarehouseInbound(app)) {
                  return;
                }
              } else if (pickupReturn) {
                if (!isStoreReturnReceived(app)) {
                  markStoreReceivedReturn(app);
                }
              } else if (isReturn && !isReturnShipCompleted(app)) {
                ensurePickupBoardData(app);
                markPickupPickedUp(app);
              }
              app.resultTime = formatDateTime();
              saveApplication(app);
            }
            if (next === 'reject_back_signed') {
              markRejectBackSigned(app);
              syncAftersaleRecordFromApp(app, refundType, 'reject_return');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'reject_return'
              });
              return;
            }
            if (next === 'closed_reject') {
              if (!isRejectBackSigned(app)) {
                markRejectBackSigned(app);
              }
              ensureRejectReturnData(app, state);
              app.closedTime = formatDateTime();
              app.closeReason = 'reject_receive';
              saveApplication(app);
              syncAftersaleRecordFromApp(app, refundType, 'closed');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'closed',
                closeReason: 'reject_receive'
              });
              return;
            }
            if (next === 'reship_shipped') {
              markReshipShipped(app);
              syncAftersaleRecordFromApp(app, refundType, 'reship');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'reship',
                shipped: '1'
              });
              return;
            }
            if (next === 'reship') {
              app.outShipped = false;
              saveApplication(app);
              syncAftersaleRecordFromApp(app, refundType, 'reship');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'reship',
                shipped: '0'
              });
              return;
            }
            syncAftersaleRecordFromApp(app, refundType, next === 'closed_reject' ? 'closed' : next);
            window.location.href = buildDetailHref({
              type: refundType,
              stage: next,
              shipped: next === 'success' && (isRestock || isExchange) ? '1' : ''
            });
          });
        });
      }
    }

    renderSteps();

    var timerEl = document.getElementById('refundDetailTimer');
    var timerId = null;
    function tickTimer() {
      var remain = Math.max(0, state.deadline - Date.now());
      var h = Math.floor(remain / 3600000);
      var m = Math.floor((remain % 3600000) / 60000);
      var s = Math.floor((remain % 60000) / 1000);
      var pad = function (n) {
        return n < 10 ? '0' + n : String(n);
      };
      if (timerEl) {
        if (stage === 'success') {
          timerEl.textContent = '';
        } else if (isReturn && stage === 'refund') {
          timerEl.textContent = warehouseReturn
            ? isDeliveryWarehouseInbound(app)
              ? formatDayHourMinTimer(remain) + '后未退款将自动退款给你'
              : formatDayHourMinTimer(remain) + '后仓库未入库将自动处理'
            : formatDayHourMinTimer(remain) + '后未退款将自动退款给你';
        } else if (isReturn && stage === 'return') {
          timerEl.textContent = warehouseReturn
            ? formatDayHourMinTimer(remain) + '后未取货将撤销退货申请'
            : expressReturn && isReturnShipCompleted(app)
              ? formatDayHourMinTimer(remain) + '后商家未处理将自动退款给你'
              : formatDayHourMinTimer(remain) + '后未寄回将撤销退货申请';
        } else {
          timerEl.textContent = '剩余 ' + h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
        }
      }
    }
    tickTimer();
    timerId = window.setInterval(
      tickTimer,
      isReturn && (stage === 'return' || stage === 'refund') ? 60000 : 1000
    );

    renderDetailInfoCard(app, item, refundType);

    var returnSection = document.getElementById('refundDetailReturnSection');
    var rejectReturnSection = document.getElementById('refundDetailRejectReturnSection');
    var reshipSection = document.getElementById('refundDetailReshipSection');

    function renderDeliveryReturnBoard() {
      var board = document.getElementById('refundPickupBoard');
      var codeWrap = board && board.querySelector('.ua-or-pickup-board__code');
      var scheduleRow = document.getElementById('refundPickupScheduleRow');
      var scheduleEl = document.getElementById('refundPickupScheduleText');
      var addrEl = document.getElementById('refundPickupAddrText');
      var courierRow = document.getElementById('refundPickupCourierRow');
      var statusEl = document.getElementById('refundPickupCourierStatus');
      var phoneEl = document.getElementById('refundPickupCourierPhone');
      var feeRow = document.getElementById('refundPickupFeeRow');
      var feeValueEl = document.getElementById('refundPickupFeeValue');
      var feeSubEl = document.getElementById('refundPickupFeeSub');
      var guardEl = board && board.querySelector('.ua-or-pickup-board__guard');
      var guardTextEl = document.getElementById('refundPickupGuardText');
      var headEl = board && board.querySelector('.ua-or-pickup-board__head');
      var chevron = scheduleRow && scheduleRow.querySelector('.ua-or-pickup-board__chevron');
      var merchant = getMerchantReturnDisplay();
      var waitingInbound = stage === 'refund' || isDeliveryDriverPicked(app);

      if (board) board.classList.add('is-delivery-return');
      if (codeWrap) codeWrap.hidden = true;
      if (guardEl) guardEl.hidden = true;
      if (guardTextEl) guardTextEl.textContent = '';
      if (headEl) headEl.hidden = true;
      if (chevron) chevron.hidden = true;
      if (scheduleRow) {
        scheduleRow.classList.add('ua-or-pickup-board__row--static');
        scheduleRow.style.pointerEvents = 'none';
      }
      if (scheduleEl) {
        scheduleEl.textContent = waitingInbound
          ? isDeliveryWarehouseInbound(app)
            ? '仓库已入库，等待平台退款'
            : '司机已取货，商品退回仓库中'
          : '等待物流司机上门取货';
      }
      if (addrEl) {
        addrEl.textContent =
          '退回仓库：' + (merchant.name || '') + ' ' + (merchant.address || '');
      }
      /* 配送无司机电话，整行联系人去掉 */
      if (courierRow) courierRow.hidden = true;
      if (statusEl) statusEl.textContent = '';
      if (phoneEl) phoneEl.hidden = true;
      if (feeRow) feeRow.hidden = true;
      if (feeValueEl) feeValueEl.textContent = '¥0';
      if (feeSubEl) feeSubEl.textContent = '配送退仓，由物流司机取货';
    }

    function renderPickupBoard() {
      if (warehouseReturn) {
        renderDeliveryReturnBoard();
        return;
      }
      ensurePickupBoardData(app);
      var board = document.getElementById('refundPickupBoard');
      var codeWrap = board && board.querySelector('.ua-or-pickup-board__code');
      var headEl = board && board.querySelector('.ua-or-pickup-board__head');
      var guardEl = board && board.querySelector('.ua-or-pickup-board__guard');
      var codeEl = document.getElementById('refundPickupCode');
      var scheduleEl = document.getElementById('refundPickupScheduleText');
      var addrEl = document.getElementById('refundPickupAddrText');
      var courierRow = document.getElementById('refundPickupCourierRow');
      var statusEl = document.getElementById('refundPickupCourierStatus');
      var phoneEl = document.getElementById('refundPickupCourierPhone');
      var feeRow = document.getElementById('refundPickupFeeRow');
      var feeValueEl = document.getElementById('refundPickupFeeValue');
      var feeSubEl = document.getElementById('refundPickupFeeSub');
      var guardTextEl = document.getElementById('refundPickupGuardText');
      var scheduleLabel = formatRelativePickupSchedule(app.pickupTime);
      if (board) board.classList.remove('is-delivery-return');
      if (headEl) headEl.hidden = false;
      if (guardEl) guardEl.hidden = false;
      if (codeWrap) codeWrap.hidden = false;
      if (courierRow) courierRow.hidden = false;
      if (phoneEl) phoneEl.hidden = false;
      if (feeRow) feeRow.hidden = false;
      if (codeEl) codeEl.textContent = app.pickupCode || '0030';
      if (scheduleEl) {
        scheduleEl.innerHTML =
          '等待快递员<span class="is-hl">' + scheduleLabel + '</span>上门取件';
      }
      if (addrEl) {
        var contact = app.pickupContact || '';
        var parts = contact.split(/\s+/);
        var name = parts[0] || '';
        var phone = parts.slice(1).join(' ') || '';
        addrEl.textContent =
          (app.pickupAddress || '') +
          (name || phone ? '，' + name + (phone ? '，' + phone : '') : '');
      }
      if (statusEl) statusEl.textContent = app.pickupCourierStatus || '快递员已接单';
      if (phoneEl) phoneEl.href = 'tel:' + (app.pickupCourierPhone || '4008001234');
      if (feeValueEl) feeValueEl.textContent = app.pickupFeeText || '¥0';
      if (feeSubEl) feeSubEl.textContent = app.pickupFeeSub || '平台承担退货运费';
      if (guardTextEl) {
        guardTextEl.textContent = isExchange
          ? '本单享主动保障服务，平台同意换货'
          : '本单享主动保障服务，平台同意退货';
      }
    }

    if (isReturn && stage === 'reject_return') {
      if (returnSection) returnSection.hidden = true;
      if (rejectReturnSection) rejectReturnSection.hidden = false;
      var reasonTextEl = document.getElementById('refundRejectReasonText');
      var backCourierEl = document.getElementById('refundBackCourierDisplay');
      var backTrackingEl = document.getElementById('refundBackTrackingDisplay');
      var backStatusEl = document.getElementById('refundBackLogisticsStatus');
      if (reasonTextEl) {
        reasonTextEl.textContent =
          '拒收原因：' + (app.rejectReceiveReason || '退货商品与申请不符，不符合退货要求');
      }
      if (backCourierEl) backCourierEl.textContent = app.backCourier || '—';
      if (backTrackingEl) backTrackingEl.textContent = app.backTrackingNo || '—';
      if (backStatusEl) {
        backStatusEl.textContent = app.backLogisticsStatus || '运输中';
      }
      if (titleEl) {
        titleEl.textContent = isRejectBackSigned(app) ? '退回已签收' : '商品退回中';
      }
    } else if (rejectReturnSection) {
      rejectReturnSection.hidden = true;
    }

    if ((isRestock || isExchange) && stage === 'reship') {
      renderReshipSection(app, refundType);
    } else if (reshipSection) {
      reshipSection.hidden = true;
    }

    if (
      (isReturn && stage === 'return') ||
      (isExchange && stage === 'return') ||
      (warehouseReturn && stage === 'refund')
    ) {
      /* 自提退货：仅展示退回门店说明，不进快递寄回/上门取件 */
      if (pickupReturn) {
        ensureReturnAddressOnApp(app);
      } else if (!warehouseReturn && shouldRedirectReturnShip(app)) {
        window.location.href = buildReturnShipHref({ type: refundType, stage: stage });
        return;
      } else {
        if (!warehouseReturn && !(expressReturn && isReturnShipCompleted(app))) {
          ensureReturnStagePickup(app);
          app = loadApplication() || app;
        }

        /* 快递已寄回：只展示退货物流卡，不再渲染上门取件看板 */
        if (
          warehouseReturn ||
          (isPickupScheduled(app) && !(expressReturn && isReturnShipCompleted(app)))
        ) {
          if (!warehouseReturn && !isReturnShipCompleted(app)) {
            var pickedStatuses = ['快递员已取包裹，即将开始运输', '运输中'];
            if (pickedStatuses.indexOf(app.pickupCourierStatus) >= 0) {
              app.pickupCourierStatus = '快递员已接单';
              saveApplication(app);
            }
          }
          renderPickupBoard();
        } else if (expressReturn && isReturnShipCompleted(app)) {
          if (isPickupPostCollect(app) || isPickupScheduled(app)) {
            ensurePickupPostCollectData(app);
          } else if (!hasSelfShipTracking(app)) {
            markPickupPickedUp(app);
          }
          app = loadApplication() || app;
        }
      }
    }

    syncDetailStageCards(refundType, stage, app);

    function goPickupEditPage() {
      ensurePickupBoardData(app);
      var refundNo = app.refundNo || genRefundNo();
      if (!app.refundNo) {
        app.refundNo = refundNo;
        saveApplication(app);
      }
      if (getPickupEditRemain(refundNo) <= 0) {
        showToast('本单修改次数已用完');
        return;
      }
      window.location.href = buildPickupEditHref({
        type: refundType,
        stage: stage,
        pickupEditFrom: 'detail'
      });
    }

    document.getElementById('refundPickupScheduleRow') &&
      document.getElementById('refundPickupScheduleRow').addEventListener('click', function () {
        if (warehouseReturn) return;
        ensurePickupBoardData(app);
        resetPickupPickedDemoState(app);
        window.location.href = buildPickupOrderHref({
          type: refundType,
          stage: stage,
          pickupPhase: ''
        });
      });

    var returnLogisticsRow = document.getElementById('refundReturnLogisticsRow');
    if (returnLogisticsRow) {
      returnLogisticsRow.addEventListener('click', function (e) {
        e.preventDefault();
        /* 退货物流 → 寄件物流详情（pickup-order，门店/用户同一套节点样式） */
        window.location.href = buildReturnLogisticsDetailHref({
          type: refundType,
          stage: stage
        });
      });
    }

    document.getElementById('refundPickupModifyBtn') &&
      document.getElementById('refundPickupModifyBtn').addEventListener('click', goPickupEditPage);

    var closeReturnSheetApi = bindCloseReturnSheet(app, refundType, []);

    function renderFooter() {
      var footer = document.getElementById('refundDetailFooter');
      if (!footer) return;
      footer.className = 'ua-or-detail-footer';
      var shell = document.querySelector('.ua-order-refund-detail-page');
      if (stage === 'success' || stage === 'reject_return') {
        footer.innerHTML = '';
        footer.hidden = true;
        if (shell) shell.classList.add('is-footer-hidden');
        return;
      }
      if ((isRestock || isExchange) && stage === 'reship' && isReshipShipped(app)) {
        footer.hidden = false;
        if (shell) shell.classList.remove('is-footer-hidden');
        footer.className = 'ua-or-detail-footer ua-or-detail-footer--confirm-receipt';
        footer.innerHTML = isRestock
          ? '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--ghost" id="refundRestockAutoCloseBtn">模拟满10天自动确认</button>' +
            '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--primary" id="refundReshipConfirmBtn">确认收货</button>'
          : '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--primary" id="refundReshipConfirmBtn">确认收货</button>';
        var autoCloseBtn = document.getElementById('refundRestockAutoCloseBtn');
        if (autoCloseBtn) {
          autoCloseBtn.addEventListener('click', function () {
            var past = shiftSeconds(new Date(), -(RESTOCK_AUTO_CONFIRM_DAYS + 1) * 24 * 60 * 60);
            var pastText = formatDateTime(past);
            if (isPickupRestock(app, refundType)) {
              ensureRestockArriveStore(app);
              app.restockArriveStoreAt = pastText;
            } else if (isWarehouseRestock(app, refundType)) {
              app.restockAwaitReceiveAt = pastText;
              app.outShipTime = pastText;
              app.outShipped = true;
            } else {
              app.outShipTime = pastText;
              app.outShipped = true;
            }
            saveApplication(app);
            completeRestockCloseApp(
              app,
              refundType,
              isPickupRestock(app, refundType)
                ? 'auto_pickup'
                : isWarehouseRestock(app, refundType)
                  ? 'auto_delivery'
                  : 'auto_express'
            );
            showToast(
              '已模拟满 ' + RESTOCK_AUTO_CONFIRM_DAYS + ' 天自动确认收货（实际补货数=申请数）'
            );
            window.setTimeout(function () {
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'success',
                shipped: '1'
              });
            }, 400);
          });
        }
        var confirmBtn = document.getElementById('refundReshipConfirmBtn');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', function () {
            if (!isRestock) {
              app.resultTime = formatDateTime();
              app.outShipped = true;
              saveApplication(app);
              syncAftersaleRecordFromApp(app, refundType, 'success');
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'success',
                shipped: '1'
              });
              return;
            }
            /* 配送：门店入库单填实际入库数量；快递/到家：确认收货填实际收到数量 */
            openRestockReceiveSheet(
              app,
              refundType,
              item,
              isWarehouseRestock(app, refundType)
                ? 'warehouse'
                : retailHomeRestock
                  ? 'home'
                  : 'express'
            );
          });
        }
        return;
      }
      if (stage === 'reship') {
        footer.innerHTML = '';
        footer.hidden = true;
        if (shell) shell.classList.add('is-footer-hidden');
        return;
      }
      // 寄回商品阶段：底部浮条展示「关闭退货」；取件卡展示「取消寄件」「修改时间/地址」
      if ((isReturn || isExchange) && stage === 'return') {
        footer.hidden = false;
        if (shell) shell.classList.remove('is-footer-hidden');
        footer.className = 'ua-or-detail-footer ua-or-detail-footer--close-return';
        footer.innerHTML =
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--ghost" id="refundDetailCloseReturnBtn">关闭退货</button>';
        if (closeReturnSheetApi && closeReturnSheetApi.bindTrigger) {
          closeReturnSheetApi.bindTrigger(document.getElementById('refundDetailCloseReturnBtn'));
        }
        return;
      }
      if (isReturn && stage === 'refund') {
        footer.innerHTML = '';
        footer.hidden = true;
        if (shell) shell.classList.add('is-footer-hidden');
        return;
      }
      footer.hidden = false;
      if (shell) shell.classList.remove('is-footer-hidden');
      footer.innerHTML =
        '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--ghost" id="refundDetailCancelBtn">撤销申请</button>' +
        '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--outline" id="refundDetailModifyBtn">修改申请</button>';
    }

    renderFooter();

    function openCancelModal(mode) {
      var modal = document.getElementById('refundCancelModal');
      var titleEl = modal ? modal.querySelector('.ua-or-cancel-modal__title') : null;
      var textEl = modal ? modal.querySelector('.ua-or-cancel-modal__text') : null;
      if (mode === 'close_return') {
        if (titleEl) titleEl.textContent = '关闭退货';
        if (textEl) {
          textEl.textContent = '关闭后本次售后申请将关闭，如有需要可重新发起。确定关闭吗？';
        }
      } else {
        if (titleEl) titleEl.textContent = '撤销申请';
        if (textEl) {
          textEl.textContent = '撤销后本次售后申请将关闭，如有需要可重新发起。确定撤销吗？';
        }
      }
      if (modal) modal.hidden = false;
    }

    function closeCancelModal() {
      var modal = document.getElementById('refundCancelModal');
      if (modal) modal.hidden = true;
    }

    bindCancelPickupSheet(app, refundType, ['refundDetailCancelPickupBtn']);

    document.querySelectorAll('[data-or-cancel-close]').forEach(function (el) {
      el.addEventListener('click', closeCancelModal);
    });

    document.getElementById('refundCancelConfirmBtn') &&
      document.getElementById('refundCancelConfirmBtn').addEventListener('click', function () {
        closeCancelModal();
        app.resultTime = formatDateTime();
        saveApplication(app);
        window.location.href = buildDetailHref({
          type: refundType,
          stage: 'closed',
          closeReason: 'cancel'
        });
      });

    function bindFooterActions() {
      var cancelBtn = document.getElementById('refundDetailCancelBtn');
      if (cancelBtn)
        cancelBtn.addEventListener('click', function () {
          openCancelModal('cancel');
        });

      var modifyBtn = document.getElementById('refundDetailModifyBtn');
      if (modifyBtn) {
        modifyBtn.addEventListener('click', function () {
          if (getParams().get('processed') === '1') {
            showToast('平台已处理，无法修改');
            window.setTimeout(function () {
              window.location.href = buildDetailHref({
                type: refundType,
                stage: isReturn ? 'return' : isExchange ? 'return' : isRestock ? 'reship' : 'success'
              });
            }, 2000);
            return;
          }
          var formType = app.formType || (isReturn ? 'return' : 'refund_only');
          if (formType === 'pre_ship') {
            window.location.href = buildPreShipHrefWithEdit();
          } else {
            window.location.href = buildFormHref(formType);
          }
        });
      }
    }

    bindFooterActions();
    bindSheetClose();

    window.addEventListener('beforeunload', function () {
      if (timerId) window.clearInterval(timerId);
    });
  }

  function getSimplePickupDayOptions(now) {
    now = now || getPickupNow();
    var today = startOfDay(now);
    return [
      { date: today, label: '今天' },
      { date: addDays(today, 1), label: '明天' },
      { date: addDays(today, 2), label: '后天' }
    ];
  }

  function bindSimplePickupTimeSheet(state, options) {
    options = options || {};
    var timeRow = document.getElementById(options.timeRowId || 'pickupEditTimeRow');
    var timeValue = document.getElementById(options.timeValueId || 'pickupEditTimeValue');
    var datesEl = document.getElementById(options.datesId || 'pickupEditTimeDates');
    var slotsEl = document.getElementById(options.slotsId || 'pickupEditTimeSlots');
    var sheetId = options.sheetId || 'pickupEditTimeSheet';
    if (!timeRow || !datesEl || !slotsEl) return;

    var ui = {
      days: [],
      selectedDate: null,
      selectedSlot: ''
    };

    function syncTimeValue() {
      if (!timeValue) return;
      timeValue.textContent = state.pickupTime || '请选择上门时间';
      timeValue.classList.toggle('ua-or-pickup-edit-time__value--placeholder', !state.pickupTime);
      if (typeof options.onSync === 'function') options.onSync();
    }

    function renderSlots() {
      var now = getPickupNow();
      var date = ui.selectedDate;
      if (!date) {
        slotsEl.innerHTML = '';
        return;
      }
      var parsed = parsePickupValue(state.pickupTime);
      slotsEl.innerHTML = PICKUP_TIME_WINDOWS.map(function (slot) {
        var blockReason = getPickupSlotBlockReason(date, slot, now);
        var passed = !!blockReason;
        var selected =
          !passed &&
          parsed &&
          sameDay(parsed.date, date) &&
          normalizePickupSlotLabel(parsed.slotLabel) === slot.label;
        return (
          '<button type="button" class="ua-or-simple-time-panel__slot' +
          (passed ? ' is-disabled' : '') +
          (selected ? ' is-selected' : '') +
          '" data-slot="' +
          escapeHtml(slot.label) +
          '"' +
          (passed ? ' disabled' : '') +
          '>' +
          escapeHtml(getSlotDisplayLabel(slot, blockReason)) +
          '</button>'
        );
      }).join('');

      slotsEl.querySelectorAll('.ua-or-simple-time-panel__slot:not(.is-disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var slotLabel = btn.getAttribute('data-slot') || '';
          if (!slotLabel || !ui.selectedDate) return;
          ui.selectedSlot = slotLabel;
          state.pickupTime = formatPickupDisplay(ui.selectedDate, slotLabel);
          syncTimeValue();
          closeSheet(sheetId);
        });
      });
    }

    function renderDates() {
      datesEl.innerHTML = ui.days
        .map(function (day) {
          var selected = ui.selectedDate && sameDay(day.date, ui.selectedDate);
          return (
            '<button type="button" class="ua-or-simple-time-panel__date' +
            (selected ? ' is-selected' : '') +
            '" data-date="' +
            dateKey(day.date) +
            '" role="tab" aria-selected="' +
            (selected ? 'true' : 'false') +
            '">' +
            escapeHtml(day.label) +
            '</button>'
          );
        })
        .join('');

      datesEl.querySelectorAll('.ua-or-simple-time-panel__date').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-date');
          var next = ui.days.find(function (d) {
            return dateKey(d.date) === key;
          });
          if (!next) return;
          ui.selectedDate = next.date;
          renderDates();
          renderSlots();
        });
      });
    }

    function openSimpleTimeSheet() {
      var now = getPickupNow();
      ui.days = getSimplePickupDayOptions(now);
      var dayDates = ui.days.map(function (d) {
        return d.date;
      });
      ui.selectedDate = getDefaultPickupDate(dayDates, now) || dayDates[1] || dayDates[0];
      ui.selectedSlot = '';

      var parsed = parsePickupValue(state.pickupTime);
      if (parsed) {
        var matched = ui.days.find(function (d) {
          return sameDay(d.date, parsed.date);
        });
        if (matched) {
          ui.selectedDate = matched.date;
          var slot = findPickupSlot(parsed.slotLabel);
          if (slot && !isPickupSlotPassed(matched.date, slot, now)) {
            ui.selectedSlot = slot.label;
          }
        }
      }

      renderDates();
      renderSlots();
      openSheet(sheetId);
    }

    timeRow.addEventListener('click', openSimpleTimeSheet);
    syncTimeValue();
  }

  function initPickupEditPage() {
    var refundType = getRefundType() || 'return';
    var stage = getDetailStage() || 'return';
    var app = loadApplication() || {};
    ensurePickupBoardData(app);
    if (!app.refundNo) {
      app.refundNo = genRefundNo();
      saveApplication(app);
    }

    // 从地址簿带回选中地址
    try {
      var pickedRaw = sessionStorage.getItem('ua_refund_picked_address');
      if (pickedRaw) {
        var picked = JSON.parse(pickedRaw);
        sessionStorage.removeItem('ua_refund_picked_address');
        if (picked && picked.full) {
          app.pickupAddressId = picked.id || app.pickupAddressId;
          app.pickupAddress = picked.full;
          app.pickupAddressLabel = picked.label || picked.full;
          app.pickupContact = (picked.contact || '') + (picked.phone ? ' ' + picked.phone : '');
          saveApplication(app);
        }
      }
    } catch (e) {
      /* ignore */
    }

    var remain = getPickupEditRemain(app.refundNo);
    var backHref = buildPickupEditReturnHref({ type: refundType, stage: stage });
    var backEl = document.getElementById('pickupEditBack');
    if (backEl) backEl.setAttribute('href', backHref);

    var remainText = document.getElementById('pickupEditRemainText');
    function syncRemainText() {
      if (remainText) {
        remainText.textContent =
          '您一共可修改' + PICKUP_EDIT_MAX_TIMES + '次，目前剩余' + remain + '次';
      }
    }
    syncRemainText();

    var banner = document.getElementById('pickupEditBanner');
    var bannerClose = document.getElementById('pickupEditBannerClose');
    if (bannerClose) {
      bannerClose.addEventListener('click', function () {
        if (banner) banner.hidden = true;
      });
    }

    var contactEl = document.getElementById('pickupEditContact');
    var addressEl = document.getElementById('pickupEditAddress');
    var timeValueEl = document.getElementById('pickupEditTimeValue');
    var state = createPickupState(app);
    if (!state.pickupTime) state.pickupTime = app.pickupTime || '';

    function syncEditFields() {
      if (contactEl) contactEl.textContent = state.pickupContact || '';
      if (addressEl) {
        addressEl.textContent = state.pickupAddressFull || state.pickupAddress || '';
      }
      if (timeValueEl) {
        timeValueEl.textContent = state.pickupTime || '请选择上门时间';
        timeValueEl.classList.toggle('ua-or-pickup-edit-time__value--placeholder', !state.pickupTime);
      }
    }

    state.onPickupSync = syncEditFields;

    bindPickupReturnCard(state);
    bindSimplePickupTimeSheet(state, { onSync: syncEditFields });
    bindSheetClose();
    syncEditFields();

    var confirmBtn = document.getElementById('pickupEditConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (remain <= 0) {
          showToast('本单修改次数已用完');
          return;
        }
        if (!state.pickupTime) {
          showToast('请选择上门时间');
          return;
        }
        if (!consumePickupEditChance(app.refundNo)) {
          showToast('本单修改次数已用完');
          return;
        }
        remain = getPickupEditRemain(app.refundNo);
        syncRemainText();

        app.pickupAddressId = state.pickupAddressId;
        app.pickupAddressLabel = state.pickupAddress;
        app.pickupAddress = state.pickupAddressFull || state.pickupAddress;
        app.pickupContact = state.pickupContact;
        app.pickupTime = state.pickupTime;
        recordPickupProgressEdit(app, state.pickupTime);
        saveApplication(app);
        showToast('修改成功');
        window.setTimeout(function () {
          window.location.href = backHref;
        }, 500);
      });
    }
  }

  function loadAddressBookGroups() {
    try {
      var raw = sessionStorage.getItem(ADDRESS_BOOK_STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {
      /* ignore */
    }
    return ADDRESS_BOOK_GROUPS.map(function (g) {
      return {
        id: g.id,
        name: g.name,
        phone: g.phone,
        phoneDisplay: g.phoneDisplay,
        tags: (g.tags || []).slice(),
        addresses: (g.addresses || []).map(function (a) {
          return { id: a.id, text: a.text };
        })
      };
    });
  }

  function saveAddressBookGroups(groups) {
    try {
      sessionStorage.setItem(ADDRESS_BOOK_STORAGE_KEY, JSON.stringify(groups));
    } catch (e) {
      /* ignore */
    }
  }

  function formatPhoneDisplay(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.slice(0, 3) + ' ' + digits.slice(3, 7) + ' ' + digits.slice(7);
    }
    return String(phone || '');
  }

  function formatProgressShortTime(date) {
    var d = date instanceof Date ? date : parseDateTimeText(date);
    if (!d || isNaN(d.getTime())) return '';
    return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function formatProgressFullTime(date) {
    var d = date instanceof Date ? date : parseDateTimeText(date);
    if (!d || isNaN(d.getTime())) return '';
    return formatDateTime(d);
  }

  function maskPhoneDisplay(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 11) return digits.slice(0, 3) + '****' + digits.slice(7);
    return String(phone || '');
  }

  function getCourierServicePhone(courier) {
    var map = {
      顺丰速运: '95338',
      中通快递: '95311',
      圆通速递: '95554',
      韵达快递: '95546',
      申通快递: '95543',
      极兔速递: '956025',
      京东物流: '950616',
      EMS: '11183',
      邮政快递包裹: '11183',
      德邦快递: '95353',
      德邦物流: '95353',
      中通快运: '95311',
      安能物流: '4001040178',
      跨越速运: '95324',
      壹米滴答: '4001671688',
      百世快运: '4008856656',
      丹鸟: '9519165',
      宅急送: '4006789000',
      韵达快运: '95546',
      顺心捷达: '95352',
      优速快递: '4001111119',
      丰网速运: '95338',
      苏宁物流: '95315',
      百世快递: '9556'
    };
    return map[courier] || '95543';
  }

  function getCourierBrandAbbr(courier) {
    var found = COURIERS.find(function (c) {
      return c.name === courier;
    });
    if (found) return found.abbr;
    return String(courier || '快').charAt(0);
  }

  function formatExpectedPickupRange(app) {
    var parsed = parsePickupValue(app && app.pickupTime);
    if (!parsed) return '';
    var d = parsed.date;
    var dateStr = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    var slot = String(parsed.slotLabel || '').replace(/–/g, '-');
    var parts = slot.split('-').map(function (s) {
      return s.trim();
    });
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return dateStr + ' ' + parts[0] + '~' + dateStr + ' ' + parts[1];
    }
    return dateStr + (slot ? ' ' + slot : '');
  }

  function formatPickupEditTimeLabel(pickupTime) {
    var parsed = parsePickupValue(pickupTime);
    if (!parsed) return '';
    var slotStart = String(parsed.slotLabel || '').split(/[-–]/)[0] || '';
    slotStart = slotStart.trim();
    if (slotStart.length >= 5 && slotStart.charAt(2) === ':') {
      slotStart = slotStart.slice(0, 2) + '时' + slotStart.slice(3, 5);
    }
    return parsed.date.getDate() + '日' + slotStart;
  }

  function buildPickupOrderProgress(app) {
    app = app || {};
    ensurePickupBoardData(app);
    var orderTime = parseDateTimeText(app.expressOrderTime || app.applyTime) || new Date();
    var editTime = shiftSeconds(orderTime, 180);
    var edits = Array.isArray(app.pickupProgressEdits) ? app.pickupProgressEdits : [];
    var showDemoEdits = !edits.length && app.pickupProgressDemo !== false;
    var schedule = formatRelativePickupSchedule(app.pickupTime);
    var steps = [
      {
        kind: 'check',
        title: '下单成功',
        sub: '期望揽收时间' + formatExpectedPickupRange(app),
        time: formatProgressShortTime(orderTime)
      },
      {
        kind: 'dot',
        title: '订单分单至申通快递',
        time: formatProgressShortTime(orderTime)
      }
    ];

    if (showDemoEdits || edits.some(function (e) { return e.type === 'info'; })) {
      var infoTime = edits.find(function (e) { return e.type === 'info'; });
      steps.push({
        kind: 'dot',
        title: '您修改了寄件信息',
        time: formatProgressShortTime(infoTime ? infoTime.time : editTime)
      });
    }

    if (showDemoEdits || edits.some(function (e) { return e.type === 'time'; })) {
      var timeEdit = edits.find(function (e) { return e.type === 'time'; });
      steps.push({
        kind: 'dot',
        title:
          '您修改上门时间为' +
          (timeEdit && timeEdit.label ? timeEdit.label : formatPickupEditTimeLabel(app.pickupTime)),
        time: formatProgressShortTime(timeEdit ? timeEdit.time : editTime)
      });
    }

    if (isPickupInTransit(app)) {
      ensurePickupPostCollectData(app);
      var pickedTime =
        parseDateTimeText(app.pickupPickedTime) || shiftSeconds(orderTime, 3600);
      var transitTime = parseDateTimeText(app.pickupTransitTime) || new Date();
      steps.push({
        kind: 'dot',
        title: '待上门取件',
        sub: '预约' + schedule.replace(/–/g, '-') + '上门取件',
        time: formatProgressShortTime(pickedTime)
      });
      steps.push({
        kind: 'dot',
        title: '快递员已取包裹，即将开始运输',
        time: formatProgressFullTime(pickedTime)
      });
      steps.push({
        kind: 'active-check',
        title: '运输中',
        detail:
          app.pickupTransitDetail ||
          '【杭州市】快件已发往 江苏江阴转运中心，可关注"申通快递"官方微信公众号获取实时物流信息',
        time: formatProgressFullTime(transitTime)
      });
    } else if (isPickupPostCollect(app)) {
      ensurePickupPostCollectData(app);
      steps.push({
        kind: 'dot',
        title: '待上门取件',
        sub: '预约' + schedule.replace(/–/g, '-') + '上门取件',
        time: formatProgressShortTime(parseDateTimeText(app.pickupPickedTime) || shiftSeconds(orderTime, 3600))
      });
      steps.push({
        kind: 'active',
        title: '快递员已取包裹，即将开始运输',
        time: formatProgressFullTime(parseDateTimeText(app.pickupPickedTime) || new Date())
      });
    } else {
      steps.push({
        kind: 'active',
        title: '待上门取件',
        sub: '预约' + schedule.replace(/–/g, '-') + '上门取件'
      });
    }
    return steps;
  }

  function buildPickupProgressIntro(app) {
    app = app || {};
    if (!isPickupPostCollect(app)) return '';
    var courier = app.courier || '申通快递';
    var waybill = app.waybillNo || app.trackingNo || '';
    var merchant = getMerchantReturnDisplay();
    var addrText =
      '[收货地址] ' +
      (merchant.address || '') +
      (merchant.phone ? ' ' + maskPhoneDisplay(merchant.phone) : '');
    var servicePhone = getCourierServicePhone(courier);
    var brandAbbr = getCourierBrandAbbr(courier);
    var html = '<div class="ua-or-po-progress-intro">';
    if (waybill) {
      html +=
        '<div class="ua-or-po-progress-intro__row">' +
        '<div class="ua-or-po-progress-intro__rail">' +
        '<span class="ua-or-po-progress-intro__icon ua-or-po-progress-intro__icon--brand">' +
        escapeHtml(brandAbbr) +
        '</span></div>' +
        '<div class="ua-or-po-progress-intro__content">' +
        '<div class="ua-or-po-progress-intro__courier-line">' +
        '<span class="ua-or-po-progress-intro__courier-text">' +
        escapeHtml(courier + ' ' + waybill) +
        '</span>' +
        '<a class="ua-or-po-progress-intro__call" href="tel:' +
        escapeHtml(servicePhone) +
        '">打电话</a>' +
        '</div></div></div>';
    }
    html +=
      '<div class="ua-or-po-progress-intro__row">' +
      '<div class="ua-or-po-progress-intro__rail">' +
      '<span class="ua-or-po-progress-intro__icon ua-or-po-progress-intro__icon--recv">收</span>' +
      '</div>' +
      '<div class="ua-or-po-progress-intro__content">' +
      '<div class="ua-or-po-progress-intro__addr-text">' +
      escapeHtml(addrText) +
      '</div></div></div>' +
      '</div>';
    return html;
  }

  function renderPickupOrderProgressList(app) {
    var introEl = document.getElementById('pickupOrderProgressIntro');
    var listEl = document.getElementById('pickupOrderProgressList');
    if (!listEl) return;
    var checkSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>';
    var steps = buildPickupOrderProgress(app);
    steps = steps.slice().reverse();
    if (introEl) {
      var introHtml = buildPickupProgressIntro(app);
      introEl.innerHTML = introHtml;
      introEl.hidden = !introHtml;
    }
    listEl.innerHTML = steps
      .map(function (step) {
        var cls = 'ua-or-po-progress-item';
        if (step.kind === 'check') cls += ' is-done-check';
        else if (step.kind === 'dot') cls += ' is-done-dot';
        else if (step.kind === 'active-check') cls += ' is-active-check';
        else if (step.kind === 'active') cls += ' is-active';
        return (
          '<div class="' +
          cls +
          '">' +
          '<div class="ua-or-po-progress-item__rail">' +
          '<span class="ua-or-po-progress-item__dot">' +
          (step.kind === 'check' || step.kind === 'active-check' ? checkSvg : '') +
          '</span></div>' +
          '<div class="ua-or-po-progress-item__content">' +
          '<div class="ua-or-po-progress-item__title">' +
          escapeHtml(step.title) +
          '</div>' +
          (step.sub ? '<div class="ua-or-po-progress-item__sub">' + escapeHtml(step.sub) + '</div>' : '') +
          (step.time ? '<div class="ua-or-po-progress-item__time">' + escapeHtml(step.time) + '</div>' : '') +
          (step.detail
            ? '<div class="ua-or-po-progress-item__detail">' + escapeHtml(step.detail) + '</div>'
            : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderPickupOrderFeeSummary(app) {
    var showFee = isPickupPostCollect(app);
    var section = document.getElementById('pickupOrderFeeSummary');
    if (section) section.hidden = !showFee;
    if (!showFee) return;

    var paidAmount = formatPickupPaidDisplay(app && app.pickupFeeText);
    var paidEl = document.getElementById('pickupOrderPaidAmount');
    if (paidEl) paidEl.textContent = paidAmount;

    var baseAmount = parsePickupFeeAmount(app && app.pickupFeeText);
    var baseEl = document.getElementById('pickupOrderFeeSheetBase');
    var subsidyEl = document.getElementById('pickupOrderFeeSheetSubsidy');
    var sheetPaidEl = document.getElementById('pickupOrderFeeSheetPaid');
    var noteEl = document.getElementById('pickupOrderFeeSheetNote');
    if (baseEl) baseEl.textContent = formatPickupFeeCurrency(baseAmount);
    if (subsidyEl) {
      subsidyEl.textContent =
        baseAmount > 0 ? '-' + formatPickupFeeCurrency(baseAmount) : '-¥0.00';
    }
    if (sheetPaidEl) sheetPaidEl.textContent = formatPickupFeeCurrency(baseAmount);
    if (noteEl) {
      noteEl.textContent = (app && app.pickupFeeSub) || '平台承担退货运费';
    }
  }

  function openPickupOrderFeeSheet() {
    openSheet('pickupOrderFeeSheet');
  }

  function openPickupOrderProgressSheet(app) {
    renderPickupOrderProgressList(app);
    openSheet('pickupOrderProgressSheet');
  }

  function recordPickupProgressEdit(app, pickupTime) {
    if (!app) return;
    var now = formatDateTime();
    if (!Array.isArray(app.pickupProgressEdits)) app.pickupProgressEdits = [];
    app.pickupProgressEdits.push({ type: 'info', time: now });
    app.pickupProgressEdits.push({
      type: 'time',
      time: now,
      label: formatPickupEditTimeLabel(pickupTime)
    });
    app.pickupProgressDemo = false;
  }

  function initPickupOrderPage() {
    var refundType = getRefundType() || 'return';
    var stage = getDetailStage() || 'return';
    var app = loadApplication() || {};

    /*
     * 寄件物流详情：未预约时优先补齐看板（含自行寄回/URL 已取件），
     * 避免误弹回售后详情或误进正向订单物流页。
     */
    if (!isPickupScheduled(app)) {
      if (shouldRedirectReturnShip(app)) {
        window.location.href = buildReturnShipHref({ type: refundType, stage: stage });
        return;
      }
      /* 详情入口 / 直接打开链接：补齐寄件看板后展示本页（待取件或取件后） */
      app = ensureReturnLogisticsDetailReady(app);
      if (!isPickupScheduled(app)) {
        window.location.href = buildDetailHref({ type: refundType, stage: stage });
        return;
      }
    }

    /* 快递已寄回仍停在寄回商品；仅配送/自提确认后才回退到平台退款 */
    var backStage =
      isReturnShipCompleted(app) &&
      (isWarehouseDelivery(app.delivery || getDelivery()) ||
        isPickupDelivery(app.delivery || getDelivery()))
        ? 'refund'
        : stage === 'refund' && isExpressDelivery(app.delivery || getDelivery())
          ? 'return'
          : stage;
    var keepPhase = getPickupPhaseFromUrl() || getEffectivePickupPhase(app) || '';
    var backHref = buildDetailHref({
      type: refundType,
      stage: backStage,
      pickupPhase: keepPhase
    });
    var backEl = document.getElementById('pickupOrderBack');
    if (backEl) backEl.setAttribute('href', backHref);

    ensurePickupBoardData(app);
    if (isPickupPostCollect(app)) ensurePickupPostCollectData(app);
    app = loadApplication() || app;

    var postCollect = isPickupPostCollect(app);
    var inTransit = isPickupInTransit(app);
    var pageShell = document.querySelector('.ua-or-pickup-order-page');
    if (pageShell) {
      pageShell.classList.toggle('ua-or-pickup-order-page--picked', postCollect);
      pageShell.classList.toggle('ua-or-pickup-order-page--transit', inTransit);
    }

    var statusBtn = document.getElementById('pickupOrderStatusBtn');
    var scheduleEl = document.getElementById('pickupOrderScheduleText');
    if (inTransit) {
      if (statusBtn) {
        statusBtn.innerHTML =
          '运输中' +
          '<span class="ua-or-po-status__chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>' +
          '</span>';
      }
      if (scheduleEl) {
        scheduleEl.textContent = isExpressDelivery(getDelivery())
          ? '快件正在发往商家退货地址'
          : '快件正在发往仓库退货地址';
      }
    } else if (postCollect) {
      if (statusBtn) {
        statusBtn.innerHTML =
          '即将开始运输' +
          '<span class="ua-or-po-status__chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>' +
          '</span>';
      }
      if (scheduleEl) scheduleEl.textContent = '请耐心等待快递网点发件运输';
    } else {
      if (statusBtn) {
        statusBtn.innerHTML =
          '待上门取件' +
          '<span class="ua-or-po-status__chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>' +
          '</span>';
      }
      if (scheduleEl) {
        var schedule = formatRelativePickupSchedule(app.pickupTime);
        scheduleEl.textContent = '预约' + schedule.replace('–', '-') + ' 上门取件';
      }
    }

    var codeWrap = document.getElementById('pickupOrderCodeWrap');
    if (codeWrap) codeWrap.hidden = postCollect;

    var codeEl = document.getElementById('pickupOrderCode');
    if (codeEl && !postCollect) codeEl.textContent = app.pickupCode || '0030';

    if (codeWrap && !postCollect) {
      codeWrap.classList.add('is-tappable');
      codeWrap.setAttribute('role', 'button');
      codeWrap.setAttribute('tabindex', '0');
      codeWrap.setAttribute('aria-label', '寄件码，点击切换为快递员已取走');
      codeWrap.addEventListener('click', function () {
        markPickupPickedUp(app);
        window.location.href = buildPickupOrderHref({
          type: refundType,
          stage: stage,
          pickupPhase: 'picked'
        });
      });
    }

    var waybillRow = document.getElementById('pickupOrderWaybillRow');
    if (waybillRow) waybillRow.hidden = !postCollect;
    if (postCollect) {
      var waybillNo = app.waybillNo || app.trackingNo || '772071763686613';
      var courierNameEl = document.getElementById('pickupOrderCourierName');
      if (courierNameEl) courierNameEl.textContent = app.courier || '申通快递';
      var waybillNoEl = document.getElementById('pickupOrderWaybillNo');
      if (waybillNoEl) waybillNoEl.textContent = waybillNo;
    }

    var guardPhoneWrap = document.getElementById('pickupOrderGuardPhoneWrap');
    if (guardPhoneWrap) guardPhoneWrap.hidden = postCollect;

    var actionsSection = document.getElementById('pickupOrderActions');
    var editBtn = document.getElementById('pickupOrderEditBtn');
    var cancelBtn = document.getElementById('pickupOrderCancelBtn');
    if (editBtn) editBtn.hidden = postCollect;
    if (cancelBtn) cancelBtn.hidden = postCollect;
    if (actionsSection) {
      actionsSection.hidden = postCollect;
      actionsSection.classList.toggle('ua-or-po-actions--picked', postCollect);
    }

    var expressProgress = document.getElementById('pickupOrderExpressProgress');
    if (expressProgress) expressProgress.hidden = !postCollect;

    var expressProgressTime = document.getElementById('pickupOrderExpressProgressTime');
    var expressProgressText = document.getElementById('pickupOrderExpressProgressText');
    if (expressProgressTime) {
      expressProgressTime.textContent = inTransit
        ? app.pickupTransitTime || formatDateTime()
        : app.pickupPickedTime || formatDateTime();
    }
    if (expressProgressText) {
      expressProgressText.textContent = inTransit
        ? app.pickupTransitDetail ||
          '【杭州市】快件已发往 江苏江阴转运中心，可关注"申通快递"官方微信公众号获取实时物流信息'
        : app.pickupCourierStatus || '快递员已取包裹，即将开始运输';
    }

    var phoneEl = document.getElementById('pickupOrderPhoneBtn');
    if (phoneEl) phoneEl.setAttribute('href', 'tel:' + (app.pickupCourierPhone || '4008001234'));

    var sendContact = document.getElementById('pickupOrderSendContact');
    var sendAddr = document.getElementById('pickupOrderSendAddr');
    var contact = app.pickupContact || DEMO_BUYER.contact + ' ' + DEMO_BUYER.phone;
    var fullAddr = app.pickupAddress || DEMO_BUYER.address;
    if (sendContact) sendContact.textContent = contact;
    if (sendAddr) {
      var shortAddr = String(fullAddr || '');
      if (shortAddr.length > 18) shortAddr = shortAddr.slice(0, 16) + '...';
      sendAddr.textContent = shortAddr;
    }

    var item = getItem();
    var merchant = getMerchantReturnDisplay();
    var recvContact = document.getElementById('pickupOrderRecvContact');
    var recvAddr = document.getElementById('pickupOrderRecvAddr');
    if (recvContact) recvContact.textContent = merchant.name + ' ' + merchant.phone;
    if (recvAddr) recvAddr.textContent = merchant.address;

    var goodsImg = document.getElementById('pickupOrderGoodsImg');
    var goodsText = document.getElementById('pickupOrderGoodsText');
    if (goodsImg && item && item.img) goodsImg.src = item.img;
    if (goodsText) goodsText.textContent = '冷丰退货 | ' + (item && item.qty ? item.qty : 1) + '件';

    var orderNoEl = document.getElementById('pickupOrderNo');
    var orderTimeEl = document.getElementById('pickupOrderTime');
    var orderNo = app.expressOrderNo || '22281689699248315';
    if (!app.expressOrderNo) {
      app.expressOrderNo = orderNo;
      saveApplication(app);
    }
    if (orderNoEl) orderNoEl.textContent = orderNo;
    if (orderTimeEl) {
      orderTimeEl.textContent = app.expressOrderTime || app.applyTime || '2026-07-17 13:53:44';
    }

    renderPickupOrderFeeSummary(app);

    var shipCard = document.getElementById('pickupOrderShipCard');
    var toggleBtn = document.getElementById('pickupOrderToggleBtn');
    var collapsed = false;
    function syncCollapse() {
      if (!shipCard || !toggleBtn) return;
      shipCard.classList.toggle('is-collapsed', collapsed);
      toggleBtn.innerHTML =
        (collapsed ? '展开' : '收起') +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 14l6-6 6 6"/></svg>';
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        collapsed = !collapsed;
        syncCollapse();
      });
    }

    function copyText(text, okMsg) {
      var value = String(text || '');
      if (!value) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(
          function () {
            showToast(okMsg || '复制成功');
          },
          function () {
            showToast(okMsg || '复制成功');
          }
        );
        return;
      }
      showToast(okMsg || '复制成功');
    }

    document.getElementById('pickupOrderCopyBtn') &&
      document.getElementById('pickupOrderCopyBtn').addEventListener('click', function () {
        copyText(orderNo, '复制成功');
      });

    document.getElementById('pickupOrderShareNav') &&
      document.getElementById('pickupOrderShareNav').addEventListener('click', function () {
        showToast('分享功能演示');
      });

    document.getElementById('pickupOrderWaybillCopyBtn') &&
      document.getElementById('pickupOrderWaybillCopyBtn').addEventListener('click', function () {
        copyText(app.waybillNo || app.trackingNo || '772071763686613', '复制成功');
      });

    document.getElementById('pickupOrderExpressProgressBtn') &&
      document.getElementById('pickupOrderExpressProgressBtn').addEventListener('click', function () {
        if (isPickupPickedUp(app)) {
          markPickupInTransit(app);
          window.location.href = buildPickupOrderHref({
            type: refundType,
            stage: stage,
            pickupPhase: 'transit'
          });
          return;
        }
        openPickupOrderProgressSheet(app);
      });

    document.getElementById('pickupOrderStatusBtn') &&
      document.getElementById('pickupOrderStatusBtn').addEventListener('click', function () {
        openPickupOrderProgressSheet(app);
      });

    document.getElementById('pickupOrderFeeDetailBtn') &&
      document.getElementById('pickupOrderFeeDetailBtn').addEventListener('click', function () {
        openPickupOrderFeeSheet();
      });

    bindCancelPickupSheet(app, refundType, ['pickupOrderCancelBtn']);
    bindSheetClose();

    if (!postCollect) {
      document.getElementById('pickupOrderEditBtn') &&
        document.getElementById('pickupOrderEditBtn').addEventListener('click', function () {
          if (getPickupEditRemain(app.refundNo || genRefundNo()) <= 0) {
            showToast('本单修改次数已用完');
            return;
          }
          window.location.href = buildPickupEditHref({
            type: refundType,
            stage: stage,
            pickupEditFrom: 'pickup_order',
            pickupPhase: getPickupPhaseFromUrl() || ''
          });
        });
    }

    document.getElementById('pickupOrderGoodsLink') &&
      document.getElementById('pickupOrderGoodsLink').addEventListener('click', function () {
        window.location.href = buildReturnGoodsHref({
          type: refundType,
          stage: stage
        });
      });
  }

  function initReturnGoodsPage() {
    var refundType = getRefundType() || 'return';
    var stage = getDetailStage() || 'return';
    var backHref = buildPickupOrderHref({ type: refundType, stage: stage });
    var backEl = document.getElementById('returnGoodsBack');
    if (backEl) backEl.setAttribute('href', backHref);

    var app = loadApplication() || {};
    ensurePickupBoardData(app);
    app = loadApplication() || app;

    var item = getItem();
    var qty = (app && app.qty != null ? app.qty : item.qty) || 1;
    var productName = (app && app.productName) || item.name;
    var productSpec = (app && app.productSpec) || item.spec || '';
    var productImg = (app && app.productImg) || item.img;

    var schedule = formatRelativePickupSchedule(app.pickupTime);
    var timeEl = document.getElementById('returnGoodsPickupTime');
    if (timeEl) timeEl.textContent = schedule.replace('–', '-') + ' 上门';

    var contact = app.pickupContact || DEMO_BUYER.contact + ' ' + DEMO_BUYER.phone;
    var senderEl = document.getElementById('returnGoodsSender');
    if (senderEl) senderEl.textContent = '寄件信息：' + contact;

    var addrEl = document.getElementById('returnGoodsAddr');
    if (addrEl) addrEl.textContent = app.pickupAddress || DEMO_BUYER.address;

    var pickupImg = document.getElementById('returnGoodsPickupImg');
    var itemImg = document.getElementById('returnGoodsItemImg');
    if (pickupImg && productImg) pickupImg.src = productImg;
    if (itemImg && productImg) itemImg.src = productImg;

    var nameEl = document.getElementById('returnGoodsItemName');
    if (nameEl) nameEl.textContent = productName;

    var specEl = document.getElementById('returnGoodsItemSpec');
    if (specEl) specEl.textContent = productSpec.replace(/^规格：/, '规格:');

    var qtyEl = document.getElementById('returnGoodsItemQty');
    if (qtyEl) qtyEl.textContent = 'x' + qty;

    var card = document.querySelector('.ua-or-rg-card');
    var toggleBtn = document.getElementById('returnGoodsToggleBtn');
    var collapsed = false;

    function syncToggle() {
      if (!card || !toggleBtn) return;
      card.classList.toggle('is-collapsed', collapsed);
      toggleBtn.innerHTML =
        (collapsed ? '展开' : '收起') +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 14l6-6 6 6"/></svg>';
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        collapsed = !collapsed;
        syncToggle();
      });
    }

    document.getElementById('returnGoodsShare') &&
      document.getElementById('returnGoodsShare').addEventListener('click', function () {
        showToast('分享功能演示');
      });
  }

  function renderReturnShipProgressSteps(refundType) {
    var el = document.getElementById('refundDetailSteps');
    if (!el) return;
    var isReturn = refundType === 'return';
    var isExchange = refundType === 'exchange';
    var steps = isReturn ? RETURN_STEPS.slice() : isExchange ? EXCHANGE_STEPS.slice() : RETURN_STEPS.slice();
    var activeIdx = isExchange ? 2 : 2;
    var checkSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>';
    el.innerHTML = steps
      .map(function (label, idx) {
        var cls = 'ua-or-detail-step';
        if (idx < activeIdx) cls += ' is-done';
        else if (idx === activeIdx) cls += ' is-active';
        else cls += ' is-pending';
        return (
          '<div class="' +
          cls +
          '">' +
          '<div class="ua-or-detail-step__dot">' +
          (idx <= activeIdx ? checkSvg : '') +
          '</div>' +
          '<div class="ua-or-detail-step__label">' +
          label +
          '</div></div>'
        );
      })
      .join('');
  }

  function bindReturnShipPickupTime(state) {
    var timeRow = document.getElementById('returnShipTimeRow');
    var timeValue = document.getElementById('returnShipTimeValue');
    var pickupTimeUi = { selectedDate: null, selectedSlot: '', selectableDays: [] };

    function syncTimeDisplay() {
      if (!timeValue) return;
      timeValue.textContent = state.pickupTime || '请选择上门时间';
      timeValue.classList.toggle('ua-or-rs-field__value--placeholder', !state.pickupTime);
    }

    function syncPickupConfirmBtn() {
      var btn = document.getElementById('refundPickupTimeConfirm');
      if (!btn) return;
      var now = getPickupNow();
      if (!pickupTimeUi.selectedDate || !pickupTimeUi.selectedSlot) {
        btn.textContent = '请选择上门时间';
        btn.disabled = true;
        btn.classList.add('is-disabled');
        return;
      }
      var slot = findPickupSlot(pickupTimeUi.selectedSlot);
      var canConfirm =
        isPickupDayBookable(pickupTimeUi.selectedDate, now) &&
        slot &&
        !isPickupSlotPassed(pickupTimeUi.selectedDate, slot, now);
      btn.textContent = formatPickupDisplay(pickupTimeUi.selectedDate, pickupTimeUi.selectedSlot);
      btn.disabled = !canConfirm;
      btn.classList.toggle('is-disabled', !canConfirm);
    }

    function renderPickupSlots() {
      var list = document.getElementById('refundPickupTimeList');
      if (!list || !pickupTimeUi.selectedDate) return;
      var now = getPickupNow();
      list.innerHTML = PICKUP_TIME_WINDOWS.map(function (slot) {
        var blockReason = getPickupSlotBlockReason(pickupTimeUi.selectedDate, slot, now);
        var passed = !!blockReason;
        var selected = !passed && pickupTimeUi.selectedSlot === slot.label;
        return (
          '<button type="button" class="ua-or-pickup-slot' +
          (passed ? ' is-disabled' : '') +
          (selected ? ' is-selected' : '') +
          '" data-slot="' +
          slot.label +
          '"' +
          (passed ? ' disabled' : '') +
          '><span class="ua-or-pickup-slot__label">' +
          getSlotDisplayLabel(slot, blockReason) +
          '</span><span class="ua-or-pickup-slot__radio"></span></button>'
        );
      }).join('');
      list.querySelectorAll('.ua-or-pickup-slot:not(.is-disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          pickupTimeUi.selectedSlot = btn.getAttribute('data-slot') || '';
          renderPickupSlots();
          syncPickupConfirmBtn();
        });
      });
      syncPickupConfirmBtn();
    }

    function renderPickupCalendar() {
      var monthEl = document.getElementById('refundPickupCalMonth');
      var gridEl = document.getElementById('refundPickupCalGrid');
      if (!gridEl || !pickupTimeUi.selectableDays.length) return;
      var first = pickupTimeUi.selectableDays[0];
      var last = pickupTimeUi.selectableDays[pickupTimeUi.selectableDays.length - 1];
      var now = getPickupNow();
      var anchor = pickupTimeUi.selectedDate || first;
      if (monthEl) monthEl.textContent = anchor.getFullYear() + '年' + (anchor.getMonth() + 1) + '月';
      var gridStart = mondayOfWeek(first);
      var twoWeekEnd = addDays(gridStart, 13);
      var lastWeekEnd = sundayOfWeek(last);
      var gridEnd = lastWeekEnd.getTime() > twoWeekEnd.getTime() ? lastWeekEnd : twoWeekEnd;
      var selectableKeys = {};
      pickupTimeUi.selectableDays.forEach(function (d) {
        selectableKeys[dateKey(d)] = true;
      });
      var html = '';
      for (var cur = new Date(gridStart.getTime()); cur.getTime() <= gridEnd.getTime(); cur = addDays(cur, 1)) {
        var key = dateKey(cur);
        var selectable = !!selectableKeys[key];
        var isToday = sameDay(cur, startOfDay(now));
        var selected = pickupTimeUi.selectedDate && sameDay(cur, pickupTimeUi.selectedDate);
        var label = isToday ? '今' : String(cur.getDate());
        html +=
          '<button type="button" class="ua-or-pickup-cal__day' +
          (selectable ? ' is-selectable' : '') +
          (isToday ? ' is-today' : '') +
          (selected ? ' is-selected' : '') +
          '" data-date="' +
          key +
          '"' +
          (selectable ? '' : ' disabled') +
          '><span class="ua-or-pickup-cal__day-num">' +
          label +
          '</span></button>';
      }
      gridEl.innerHTML = html;
      gridEl.querySelectorAll('.ua-or-pickup-cal__day.is-selectable').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-date');
          var next = pickupTimeUi.selectableDays.find(function (d) {
            return dateKey(d) === key;
          });
          if (!next) return;
          pickupTimeUi.selectedDate = next;
          pickupTimeUi.selectedSlot = '';
          renderPickupCalendar();
          renderPickupSlots();
        });
      });
    }

    function openPickupTimeSheet() {
      var now = getPickupNow();
      pickupTimeUi.selectableDays = getSelectablePickupDays(now);
      pickupTimeUi.selectedDate = getDefaultPickupDate(pickupTimeUi.selectableDays, now);
      pickupTimeUi.selectedSlot = '';
      var parsed = parsePickupValue(state.pickupTime);
      if (parsed) {
        var matched = pickupTimeUi.selectableDays.find(function (d) {
          return sameDay(d, parsed.date);
        });
        if (matched) {
          pickupTimeUi.selectedDate = matched;
          var slot = findPickupSlot(parsed.slotLabel);
          if (slot && !isPickupSlotPassed(matched, slot, now)) {
            pickupTimeUi.selectedSlot = slot.label;
          }
        }
      }
      renderPickupCalendar();
      renderPickupSlots();
      syncPickupConfirmBtn();
      openSheet('refundPickupTimeSheet');
    }

    if (timeRow) timeRow.addEventListener('click', openPickupTimeSheet);
    var confirmBtn = document.getElementById('refundPickupTimeConfirm');
    if (confirmBtn && !confirmBtn.getAttribute('data-rs-time-bound')) {
      confirmBtn.setAttribute('data-rs-time-bound', '1');
      confirmBtn.addEventListener('click', function () {
        if (!pickupTimeUi.selectedDate || !pickupTimeUi.selectedSlot) return;
        state.pickupTime = formatPickupDisplay(pickupTimeUi.selectedDate, pickupTimeUi.selectedSlot);
        syncTimeDisplay();
        closeSheet('refundPickupTimeSheet');
      });
    }
    syncTimeDisplay();
  }

  function initReturnShipPage() {
    var refundType = getRefundType() || 'return';
    var stage = getDetailStage() || 'return';
    var delivery = getDelivery();
    var isExchange = refundType === 'exchange';
    var app = loadApplication() || {};
    app = sanitizeReturnShipAppState(app);
    var item = getItem();
    var merchant = getMerchantReturnDisplay();

    if (!app.refundNo) {
      app = Object.assign(
        {
          reason: getParams().get('reason') || '我不想要了',
          qty: item.qty,
          amount: item.paidAmount != null ? item.paidAmount : item.priceNum * item.qty,
          applyTime: formatDateTime(),
          refundNo: genRefundNo(),
          formType: isExchange ? 'exchange' : 'return',
          delivery: delivery,
          itemIndex: getItemIndex(),
          productName: item.name,
          productSpec: item.spec,
          productImg: item.img
        },
        app
      );
    }
    ensureReturnAddressOnApp(app);
    saveApplication(app);

    var backHref = buildDetailHref({ type: refundType, stage: stage });
    initNav(getDetailNavTitle(refundType), backHref);

    renderReturnShipProgressSteps(refundType);

    var titleEl = document.getElementById('refundDetailStatusTitle');
    if (titleEl) {
      titleEl.textContent = isExchange ? '请寄回换货商品' : '请寄回退货商品';
    }

    var timerEl = document.getElementById('refundDetailTimer');
    var deadline = Date.now() + 7 * 24 * 60 * 60 * 1000 - 1000;
    function tickReturnTimer() {
      if (!timerEl) return;
      var remain = Math.max(0, deadline - Date.now());
      var d = Math.floor(remain / 86400000);
      var h = Math.floor((remain % 86400000) / 3600000);
      var m = Math.floor((remain % 3600000) / 60000);
      var label = isExchange ? '换货' : '退货';
      timerEl.textContent = d + '天' + h + '时' + m + '分后未寄回将撤销' + label + '申请';
    }
    tickReturnTimer();
    window.setInterval(tickReturnTimer, 60000);

    var state = createPickupState(app);
    state.shipTab = app.returnShipTab === 'self' ? 'self' : 'pickup';
    applySelfShipFormState(state, app);

    function formatMyAddrLine() {
      return (
        (state.pickupAddressFull || state.pickupAddress || '') +
        ' ' +
        (state.pickupContact || '')
      ).trim();
    }

    function syncMerchantAddrs() {
      var summaryText = document.getElementById('returnShipMerchantSummaryText');
      if (summaryText) summaryText.textContent = merchant.full;
      var fullEl = document.getElementById('returnShipMerchantFull');
      if (fullEl) fullEl.textContent = merchant.full;
      var selfAddrEl = document.getElementById('returnShipSelfMerchantAddr');
      if (selfAddrEl) selfAddrEl.textContent = merchant.address;
      var selfContactEl = document.getElementById('returnShipSelfMerchantContact');
      if (selfContactEl) selfContactEl.textContent = merchant.name + ' ' + merchant.phone;
    }

    function syncMyAddrs() {
      var line = formatMyAddrLine();
      var el = document.getElementById('returnShipMyAddrText');
      if (el) el.textContent = line;
    }

    syncMerchantAddrs();
    syncMyAddrs();

    var tabs = document.querySelectorAll('.ua-or-rs-tab');
    var pickupPanel = document.getElementById('returnShipPickupPanel');
    var selfPanel = document.getElementById('returnShipSelfPanel');
    var promoEl = document.getElementById('returnShipPromo');
    var submitBtn = document.getElementById('returnShipSubmitBtn');

    function syncTabUI() {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute('data-tab') === state.shipTab;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (pickupPanel) pickupPanel.hidden = state.shipTab !== 'pickup';
      if (selfPanel) selfPanel.hidden = state.shipTab !== 'self';
      if (promoEl) {
        promoEl.hidden = state.shipTab === 'self';
        promoEl.textContent = '免费上门 免填地址 丢损必赔';
      }
      if (submitBtn) {
        submitBtn.textContent = state.shipTab === 'self' ? '提交物流信息' : '预约上门';
      }
      var courierValue = document.getElementById('returnShipCourierValue');
      if (courierValue) {
        courierValue.textContent = state.courierName || '请选择快递公司';
        courierValue.classList.toggle('ua-or-rs-field__value--placeholder', !state.courierName);
      }
      var trackingInput = document.getElementById('returnShipTrackingInput');
      if (trackingInput) {
        if (window.LogisticsTrackingNo) window.LogisticsTrackingNo.bindInput(trackingInput);
        trackingInput.value = state.shipTab === 'self' ? state.trackingNo || '' : '';
      }
    }

    function syncSelfShipFormState() {
      applySelfShipFormState(state, app);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.shipTab = tab.getAttribute('data-tab') || 'pickup';
        if (state.shipTab === 'self') syncSelfShipFormState();
        syncTabUI();
      });
    });

    function bindReturnShipAddressPicker() {
      function openAddressSheet() {
        var labels = PICKUP_ADDRESSES.map(function (a) {
          return a.label + ' · ' + a.contact + ' ' + a.phone;
        });
        var selectedLabel = '';
        PICKUP_ADDRESSES.forEach(function (a) {
          if (a.id === state.pickupAddressId) {
            selectedLabel = a.label + ' · ' + a.contact + ' ' + a.phone;
          }
        });
        renderPickerOptions('refundPickupAddressList', labels, selectedLabel, 'pickupAddress');
        openSheet('refundPickupAddressSheet');
      }
      document.getElementById('returnShipMyAddrRow') &&
        document.getElementById('returnShipMyAddrRow').addEventListener('click', openAddressSheet);
      document.getElementById('refundPickupAddressConfirm') &&
        document.getElementById('refundPickupAddressConfirm').addEventListener('click', function () {
          var val = getCheckedValue('refundPickupAddressList', 'pickupAddress');
          if (!val) return;
          var addr = PICKUP_ADDRESSES.find(function (a) {
            return a.label + ' · ' + a.contact + ' ' + a.phone === val;
          });
          if (addr) {
            state.pickupAddressId = addr.id;
            state.pickupAddress = addr.label;
            state.pickupAddressFull = addr.full || addr.label;
            state.pickupContact = addr.contact + ' ' + addr.phone;
            syncMyAddrs();
          }
          closeSheet('refundPickupAddressSheet');
        });
    }

    bindReturnShipPickupTime(state);
    bindReturnShipAddressPicker();

    var merchantExpanded = false;
    document.getElementById('returnShipMerchantRow') &&
      document.getElementById('returnShipMerchantRow').addEventListener('click', function () {
        merchantExpanded = !merchantExpanded;
        var detail = document.getElementById('returnShipMerchantDetail');
        var arrow = document.getElementById('returnShipMerchantArrow');
        if (detail) detail.hidden = !merchantExpanded;
        if (arrow) arrow.classList.toggle('is-open', merchantExpanded);
      });

    document.getElementById('returnShipCourierRow') &&
      document.getElementById('returnShipCourierRow').addEventListener('click', function () {
        openCourierPicker({
          selectedId: state.courierId,
          onSelect: function (found) {
            state.courierId = found.id;
            state.courierName = found.name;
            syncTabUI();
          }
        });
      });

    renderDetailInfoCard(app, item, refundType);

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        app.returnShipTab = state.shipTab;
        if (state.shipTab === 'pickup') {
          if (!state.pickupTime) {
            showToast('请选择上门时间');
            return;
          }
          scheduleDoorPickup(app, state);
          showToast('预约成功');
          window.setTimeout(function () {
            window.location.href = buildDetailHref({ type: refundType, stage: 'return' });
          }, 600);
          return;
        }
        var trackingInput = document.getElementById('returnShipTrackingInput');
        if (!state.courierName) {
          showToast('请选择快递公司');
          return;
        }
        var trackingCheck =
          window.LogisticsTrackingNo && typeof window.LogisticsTrackingNo.validate === 'function'
            ? window.LogisticsTrackingNo.validate(trackingInput ? trackingInput.value : '')
            : {
                ok: !!(trackingInput && String(trackingInput.value || '').trim()),
                value: trackingInput ? String(trackingInput.value || '').trim() : '',
                message: '请输入物流单号'
              };
        if (!trackingCheck.ok) {
          showToast(trackingCheck.message || '请输入物流单号');
          return;
        }
        var trackingNo = trackingCheck.value;
        if (trackingInput) trackingInput.value = trackingNo;
        app.pickupScheduled = false;
        app.returnShipTab = 'self';
        app.courier = state.courierName;
        app.courierId = state.courierId;
        app.trackingNo = trackingNo;
        app.waybillNo = trackingNo;
        if (app.shippingFeeGuard == null) app.shippingFeeGuard = '5.40';
        /*
         * 快递退货：自行填写运单后仍停在「寄回商品」，等后台确认收货再进「平台退款」
         * 配送/自提保持原跳转（自行寄回页主要用于快递）
         */
        var expressSelfShip = isExpressDelivery(app.delivery || getDelivery());
        if (expressSelfShip) {
          app.pickupPhase = 'picked';
          if (!app.pickupPickedTime) app.pickupPickedTime = formatDateTime();
        }
        saveApplication(app);
        showToast('物流信息已提交');
        window.setTimeout(function () {
          window.location.href = buildDetailHref({
            type: refundType,
            stage: expressSelfShip ? 'return' : 'refund',
            pickupPhase: expressSelfShip ? 'picked' : ''
          });
        }, 600);
      });
    }

    bindCloseReturnSheet(app, refundType, ['refundDetailCloseReturnBtn']);

    syncTabUI();
    bindSheetClose();

    if (app.pickupAddressId) {
      var found = PICKUP_ADDRESSES.find(function (a) {
        return a.id === app.pickupAddressId;
      });
      if (found) {
        state.pickupAddressId = found.id;
        state.pickupAddress = found.label;
        state.pickupAddressFull = found.full || found.label;
        state.pickupContact = found.contact + ' ' + found.phone;
        syncMyAddrs();
      }
    }
  }

  function initAddressBookPage() {
    var refundType = getRefundType() || 'return';
    var stage = getDetailStage() || 'return';
    var addrFrom = getAddrFrom();
    var backHref =
      addrFrom === 'checkout'
        ? buildCheckoutReturnHref()
        : addrFrom === 'profile'
          ? buildProfileReturnHref()
          : buildPickupEditHref({
              type: refundType,
              stage: stage,
              pickupEditFrom: getPickupEditFrom()
            });
    var backEl = document.getElementById('addrBookBack');
    if (backEl) backEl.setAttribute('href', backHref);

    var groups = loadAddressBookGroups();
    var ui = {
      keyword: '',
      batchMode: false,
      checked: {},
      expanded: {}
    };

    var listEl = document.getElementById('addrBookList');
    var searchEl = document.getElementById('addrBookSearch');
    var shell = document.querySelector('.ua-or-addrbook-page');
    var normalFooter = document.getElementById('addrBookFooter');
    var batchFooter = document.getElementById('addrBookBatchFooter');
    var batchDeleteBtn = document.getElementById('addrBookBatchDelete');

    function matchKeyword(group, addr, kw) {
      if (!kw) return true;
      var hay =
        group.name +
        ' ' +
        group.phone +
        ' ' +
        (group.phoneDisplay || '') +
        ' ' +
        (addr ? addr.text : '');
      return hay.toLowerCase().indexOf(kw) >= 0;
    }

    function getVisibleGroups() {
      var kw = String(ui.keyword || '').trim().toLowerCase();
      return groups
        .map(function (g) {
          var addrs = (g.addresses || []).filter(function (a) {
            return matchKeyword(g, a, kw);
          });
          if (!addrs.length && kw && !matchKeyword(g, null, kw)) return null;
          if (!addrs.length && kw) return null;
          return {
            id: g.id,
            name: g.name,
            phone: g.phone,
            phoneDisplay: g.phoneDisplay || formatPhoneDisplay(g.phone),
            tags: g.tags || [],
            addresses: kw ? addrs : g.addresses || []
          };
        })
        .filter(Boolean);
    }

    function getCheckedIds() {
      return Object.keys(ui.checked).filter(function (k) {
        return ui.checked[k];
      });
    }

    function syncBatchFooter() {
      var count = getCheckedIds().length;
      if (batchDeleteBtn) {
        batchDeleteBtn.disabled = false;
        batchDeleteBtn.textContent = '确认删除(' + count + ')';
      }
    }

    function setBatchMode(on) {
      ui.batchMode = !!on;
      ui.checked = {};
      if (shell) shell.classList.toggle('is-batch', ui.batchMode);
      if (normalFooter) normalFooter.hidden = ui.batchMode;
      if (batchFooter) batchFooter.hidden = !ui.batchMode;
      closeDeleteModal();
      syncBatchFooter();
      renderList();
    }

    function openDeleteModal() {
      var modal = document.getElementById('addrBookDeleteModal');
      if (modal) modal.hidden = false;
    }

    function closeDeleteModal() {
      var modal = document.getElementById('addrBookDeleteModal');
      if (modal) modal.hidden = true;
    }

    function performBatchDelete() {
      var ids = getCheckedIds();
      if (!ids.length) return;
      groups = groups
        .map(function (g) {
          return {
            id: g.id,
            name: g.name,
            phone: g.phone,
            phoneDisplay: g.phoneDisplay,
            tags: g.tags || [],
            addresses: (g.addresses || []).filter(function (a) {
              return ids.indexOf(a.id) < 0;
            })
          };
        })
        .filter(function (g) {
          return g.addresses && g.addresses.length;
        });
      saveAddressBookGroups(groups);
      ui.checked = {};
      closeDeleteModal();
      showToast('已删除' + ids.length + '条地址');
      setBatchMode(false);
    }

    function selectAddress(group, addr) {
      try {
        sessionStorage.setItem(
          'ua_refund_picked_address',
          JSON.stringify({
            id: addr.id,
            contact: group.name,
            phone: group.phone,
            label: addr.text,
            full: addr.text
          })
        );
      } catch (e) {
        /* ignore */
      }
      window.location.href = backHref;
    }

    function renderList() {
      if (!listEl) return;
      var visible = getVisibleGroups();
      if (!visible.length) {
        listEl.innerHTML = '<div class="ua-or-addrbook-empty">暂无匹配地址</div>';
        return;
      }

      listEl.innerHTML = visible
        .map(function (group) {
          var allAddrs = group.addresses || [];
          var multi = allAddrs.length > 1;
          var needCollapse = allAddrs.length > ADDRESS_BOOK_COLLAPSE_LIMIT;
          var expanded = !!ui.expanded[group.id];
          var showAddrs =
            needCollapse && !expanded
              ? allAddrs.slice(0, ADDRESS_BOOK_COLLAPSE_LIMIT)
              : allAddrs;

          var rows = showAddrs
            .map(function (addr) {
              var checked = !!ui.checked[addr.id];
              return (
                '<button type="button" class="ua-or-addrbook-row' +
                (checked ? ' is-checked' : '') +
                '" data-group="' +
                escapeHtml(group.id) +
                '" data-addr="' +
                escapeHtml(addr.id) +
                '">' +
                (ui.batchMode
                  ? '<span class="ua-or-addrbook-row__check" aria-hidden="true"></span>'
                  : '') +
                '<span class="ua-or-addrbook-row__text">' +
                escapeHtml(addr.text) +
                '</span>' +
                '<span class="ua-or-addrbook-row__edit" data-edit="' +
                escapeHtml(addr.id) +
                '" role="button" aria-label="编辑地址">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
                '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/>' +
                '<path d="M13.5 6.5l3 3"/>' +
                '</svg>' +
                '</span>' +
                '</button>'
              );
            })
            .join('');

          var moreHtml = '';
          if (needCollapse) {
            moreHtml =
              '<button type="button" class="ua-or-addrbook-card__more' +
              (expanded ? ' is-open' : '') +
              '" data-expand="' +
              escapeHtml(group.id) +
              '">' +
              (expanded ? '收起' : '展开更多') +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>' +
              '</button>';
          }

          return (
            '<section class="ua-or-addrbook-card' +
            (multi ? ' is-multi' : ' is-single') +
            '">' +
            '<div class="ua-or-addrbook-card__head">' +
            '<div class="ua-or-addrbook-card__name">' +
            escapeHtml(group.name) +
            '<span class="ua-or-addrbook-card__phone">' +
            escapeHtml(group.phoneDisplay || formatPhoneDisplay(group.phone)) +
            '</span>' +
            '</div>' +
            '</div>' +
            '<div class="ua-or-addrbook-card__rows">' +
            rows +
            '</div>' +
            moreHtml +
            '</section>'
          );
        })
        .join('');

      listEl.querySelectorAll('.ua-or-addrbook-row').forEach(function (row) {
        row.addEventListener('click', function (e) {
          var editEl = e.target.closest('[data-edit]');
          if (editEl) {
            e.stopPropagation();
            var editGroupId = row.getAttribute('data-group');
            var editAddrId = row.getAttribute('data-addr');
            if (!editGroupId || !editAddrId) return;
            window.location.href = buildAddressCreateHref({
              type: refundType,
              stage: stage,
              pickupEditFrom: getPickupEditFrom(),
              addrFrom: addrFrom || '',
              edit: '1',
              groupId: editGroupId,
              addrId: editAddrId
            });
            return;
          }
          var groupId = row.getAttribute('data-group');
          var addrId = row.getAttribute('data-addr');
          var group = groups.find(function (g) {
            return g.id === groupId;
          });
          var addr =
            group &&
            (group.addresses || []).find(function (a) {
              return a.id === addrId;
            });
          if (!group || !addr) return;

          if (ui.batchMode) {
            ui.checked[addrId] = !ui.checked[addrId];
            renderList();
            syncBatchFooter();
            return;
          }
          selectAddress(group, addr);
        });
      });

      listEl.querySelectorAll('[data-expand]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var gid = btn.getAttribute('data-expand');
          ui.expanded[gid] = !ui.expanded[gid];
          renderList();
        });
      });
    }

    if (searchEl) {
      searchEl.addEventListener('input', function () {
        ui.keyword = searchEl.value || '';
        renderList();
      });
    }

    document.getElementById('addrBookBatchBtn') &&
      document.getElementById('addrBookBatchBtn').addEventListener('click', function () {
        setBatchMode(true);
      });
    document.getElementById('addrBookBatchCancel') &&
      document.getElementById('addrBookBatchCancel').addEventListener('click', function () {
        setBatchMode(false);
      });
    document.getElementById('addrBookCreateBtn') &&
      document.getElementById('addrBookCreateBtn').addEventListener('click', function () {
        window.location.href = buildAddressCreateHref({
          type: refundType,
          stage: stage,
          pickupEditFrom: getPickupEditFrom(),
          addrFrom: addrFrom || ''
        });
      });
    if (batchDeleteBtn) {
      batchDeleteBtn.addEventListener('click', function () {
        var ids = getCheckedIds();
        if (!ids.length) {
          showToast('请选择要删除的地址');
          return;
        }
        openDeleteModal();
      });
    }

    document.querySelectorAll('[data-addrbook-modal-close]').forEach(function (el) {
      el.addEventListener('click', closeDeleteModal);
    });

    document.getElementById('addrBookDeleteConfirm') &&
      document.getElementById('addrBookDeleteConfirm').addEventListener('click', performBatchDelete);

    renderList();
  }

  var CITY_DISTRICT_NONE = '暂不识别';

  var CITY_REGION_TREE = {
    北京市: {
      北京市: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区', '昌平区']
    },
    天津市: {
      天津市: ['和平区', '河东区', '河西区', '南开区', '河北区']
    },
    河北省: {
      石家庄市: ['长安区', '桥西区', '新华区', '裕华区'],
      唐山市: ['路南区', '路北区', '丰南区']
    },
    山西省: {
      太原市: ['小店区', '迎泽区', '杏花岭区']
    },
    辽宁省: {
      沈阳市: ['和平区', '沈河区', '大东区', '铁西区'],
      大连市: ['中山区', '西岗区', '沙河口区', '甘井子区']
    },
    吉林省: {
      长春市: ['南关区', '宽城区', '朝阳区', '二道区'],
      吉林市: ['昌邑区', '龙潭区', '船营区']
    },
    黑龙江省: {
      哈尔滨市: ['道里区', '南岗区', '道外区', '香坊区'],
      齐齐哈尔市: ['龙沙区', '建华区', '铁锋区']
    },
    上海: {
      上海市: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '闵行区', '松江区', '嘉定区']
    },
    江苏省: {
      南京市: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '栖霞区', '雨花台区', '江宁区'],
      无锡市: ['锡山区', '惠山区', '滨湖区', '梁溪区'],
      徐州市: ['鼓楼区', '云龙区', '贾汪区', '泉山区'],
      常州市: ['天宁区', '钟楼区', '新北区', '武进区'],
      苏州市: ['姑苏区', '虎丘区', '吴中区', '相城区', '工业园区'],
      南通市: ['崇川区', '通州区']
    },
    浙江省: {
      杭州市: ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '临平区', '钱塘区'],
      宁波市: ['海曙区', '江北区', '鄞州区', '镇海区'],
      温州市: ['鹿城区', '龙湾区', '瓯海区'],
      嘉兴市: ['南湖区', '秀洲区']
    },
    安徽省: {
      合肥市: ['瑶海区', '庐阳区', '蜀山区', '包河区'],
      芜湖市: ['镜湖区', '弋江区', '鸠江区']
    },
    福建省: {
      福州市: ['鼓楼区', '台江区', '仓山区', '晋安区'],
      厦门市: ['思明区', '湖里区', '集美区', '海沧区']
    },
    江西省: {
      南昌市: ['东湖区', '西湖区', '青云谱区', '青山湖区']
    },
    山东省: {
      济南市: ['历下区', '市中区', '槐荫区', '历城区'],
      青岛市: ['市南区', '市北区', '崂山区', '黄岛区']
    },
    河南省: {
      郑州市: ['中原区', '二七区', '金水区', '惠济区']
    },
    湖北省: {
      武汉市: ['江岸区', '江汉区', '硚口区', '武昌区', '洪山区']
    },
    湖南省: {
      长沙市: ['芙蓉区', '天心区', '岳麓区', '开福区']
    },
    广东省: {
      广州市: ['越秀区', '荔湾区', '海珠区', '天河区', '白云区', '番禺区'],
      深圳市: ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区'],
      东莞市: ['东城街道', '南城街道', '莞城街道', '万江街道', '虎门镇'],
      佛山市: ['禅城区', '南海区', '顺德区']
    },
    四川省: {
      成都市: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '高新区']
    },
    重庆市: {
      重庆市: ['渝中区', '江北区', '南岸区', '渝北区', '沙坪坝区']
    },
    陕西省: {
      西安市: ['新城区', '碑林区', '雁塔区', '未央区']
    }
  };

  var CITY_HOT_LIST = [
    { label: '北京', province: '北京市', city: '北京市' },
    { label: '上海', province: '上海', city: '上海市' },
    { label: '广州', province: '广东省', city: '广州市' },
    { label: '深圳', province: '广东省', city: '深圳市' },
    { label: '东莞', province: '广东省', city: '东莞市' },
    { label: '杭州', province: '浙江省', city: '杭州市' },
    { label: '成都', province: '四川省', city: '成都市' },
    { label: '南京', province: '江苏省', city: '南京市' }
  ];

  var CITY_WHEEL_ITEM_H = 36;

  function getCityProvinces() {
    return Object.keys(CITY_REGION_TREE);
  }

  function getCityCities(province) {
    var node = CITY_REGION_TREE[province];
    return node ? Object.keys(node) : [];
  }

  function getCityDistricts(province, city) {
    var node = CITY_REGION_TREE[province];
    var list = node && city && node[city] ? node[city].slice() : [];
    return [CITY_DISTRICT_NONE].concat(
      list.filter(function (d) {
        return d !== CITY_DISTRICT_NONE;
      })
    );
  }

  function formatCityRegion(province, city, district) {
    return [province, city, district].filter(Boolean).join(' ');
  }

  function parseCityRegionParts(text) {
    var raw = String(text || '').trim();
    if (!raw) return null;
    var compact = raw.replace(/\s+/g, '');
    var provinces = getCityProvinces().slice().sort(function (a, b) {
      return b.length - a.length;
    });
    var province = '';
    for (var i = 0; i < provinces.length; i++) {
      var p = provinces[i];
      var pCompact = p.replace(/\s+/g, '');
      if (compact.indexOf(pCompact) === 0 || raw.indexOf(p) === 0) {
        province = p;
        break;
      }
      if (p === '上海' && (compact.indexOf('上海市') === 0 || compact.indexOf('上海') === 0)) {
        province = p;
        break;
      }
      if (p === '北京市' && compact.indexOf('北京') === 0) {
        province = p;
        break;
      }
    }
    if (!province) return null;
    var rest = compact;
    if (province === '上海') {
      if (rest.indexOf('上海市') === 0) rest = rest.slice(3);
      else if (rest.indexOf('上海') === 0) rest = rest.slice(2);
    } else if (rest.indexOf(province.replace(/\s+/g, '')) === 0) {
      rest = rest.slice(province.replace(/\s+/g, '').length);
    }

    var cities = getCityCities(province).slice().sort(function (a, b) {
      return b.length - a.length;
    });
    var city = '';
    for (var c = 0; c < cities.length; c++) {
      var cityName = cities[c];
      if (rest.indexOf(cityName) === 0) {
        city = cityName;
        rest = rest.slice(cityName.length);
        break;
      }
    }
    if (!city) city = cities[0] || '';
    var districts = getCityDistricts(province, city);
    var district = CITY_DISTRICT_NONE;
    for (var d = 0; d < districts.length; d++) {
      if (rest.indexOf(districts[d]) === 0) {
        district = districts[d];
        break;
      }
    }
    return { province: province, city: city, district: district };
  }

  function flattenCitySearchIndex() {
    var rows = [];
    getCityProvinces().forEach(function (province) {
      getCityCities(province).forEach(function (city) {
        getCityDistricts(province, city).forEach(function (district) {
          rows.push({
            province: province,
            city: city,
            district: district,
            label: formatCityRegion(province, city, district),
            keywords: (province + city + district).toLowerCase()
          });
        });
      });
    });
    return rows;
  }

  function parseSmartAddressText(text) {
    var raw = String(text || '').trim();
    if (!raw) return null;
    var phoneMatch = raw.match(/1\d{10}|\d{3,4}-\d{7,8}/);
    var phone = phoneMatch ? phoneMatch[0] : '';
    var withoutPhone = phone ? raw.replace(phone, ' ') : raw;
    var parts = withoutPhone
      .split(/[，,；;、\s]+/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    var name = '';
    var region = '';
    var detail = '';
    parts.forEach(function (p) {
      if (!name && p.length <= 4 && !/省|市|区|县|路|街|号|小区|园/.test(p)) {
        name = p;
        return;
      }
      if (!region && /省|市|区|县/.test(p)) {
        region = p;
        return;
      }
      detail = detail ? detail + p : p;
    });
    if (!detail && parts.length) detail = parts[parts.length - 1];
    return { name: name, phone: phone, region: region, detail: detail };
  }

  function splitStoredAddress(full) {
    var text = String(full || '').trim();
    if (!text) return { region: '', detail: '' };
    var parts = parseCityRegionParts(text);
    if (parts) {
      var region = formatCityRegion(parts.province, parts.city, parts.district);
      var regionCompact = region.replace(/\s+/g, '');
      var textCompact = text.replace(/\s+/g, '');
      var detail = '';
      if (textCompact.indexOf(regionCompact) === 0) {
        var i = 0;
        var j = 0;
        while (i < text.length && j < regionCompact.length) {
          if (/\s/.test(text.charAt(i))) {
            i += 1;
            continue;
          }
          if (text.charAt(i) === regionCompact.charAt(j)) {
            i += 1;
            j += 1;
            continue;
          }
          break;
        }
        detail = text.slice(i).trim();
      } else {
        detail = text;
      }
      return { region: region, detail: detail };
    }
    var m = text.match(/^((?:[^省]+省)?(?:[^市]+市)?(?:[^区县]+[区县]))\s*(.+)$/);
    if (m) {
      var regionRaw = m[1].replace(/([省市])/g, '$1 ').replace(/\s+/g, ' ').trim();
      return { region: regionRaw, detail: m[2].trim() };
    }
    return { region: '', detail: text };
  }

  function initAddressCreatePage() {
    var refundType = getRefundType() || 'return';
    var stage = getDetailStage() || 'return';
    var params = getParams();
    var editGroupId = params.get('groupId') || '';
    var editAddrId = params.get('addrId') || '';
    var isEdit = params.get('edit') === '1' && !!editGroupId && !!editAddrId;
    var backHref = buildAddressBookHref({
      type: refundType,
      stage: stage,
      pickupEditFrom: getPickupEditFrom(),
      addrFrom: getAddrFrom() || ''
    });
    var backEl = document.getElementById('addrCreateBack');
    if (backEl) backEl.setAttribute('href', backHref);

    var titleEl = document.getElementById('addrCreateTitle');
    if (isEdit) {
      if (titleEl) titleEl.textContent = '编辑寄件人信息';
      document.title = '编辑寄件人信息 · 用户 APP';
    }

    var state = {
      landline: false,
      region: '',
      editGroupId: editGroupId,
      editAddrId: editAddrId,
      isEdit: isEdit
    };

    var smartOpen = document.getElementById('addrCreateSmartOpen');
    var smartExpanded = document.getElementById('addrCreateSmartExpanded');
    var smartInput = document.getElementById('addrCreateSmartInput');
    var recognizeBtn = document.getElementById('addrCreateRecognizeBtn');
    var nameEl = document.getElementById('addrCreateName');
    var phoneEl = document.getElementById('addrCreatePhone');
    var phoneLabel = document.getElementById('addrCreatePhoneLabel');
    var phoneSwitch = document.getElementById('addrCreatePhoneSwitch');
    var regionRow = document.getElementById('addrCreateRegionRow');
    var regionValue = document.getElementById('addrCreateRegionValue');
    var detailEl = document.getElementById('addrCreateDetail');
    var saveBtn = document.getElementById('addrCreateSaveBtn');

    if (isEdit) {
      var groupsForEdit = loadAddressBookGroups();
      var editGroup = groupsForEdit.find(function (g) {
        return g.id === editGroupId;
      });
      var editAddr =
        editGroup &&
        (editGroup.addresses || []).find(function (a) {
          return a.id === editAddrId;
        });
      if (editGroup && editAddr) {
        if (nameEl) nameEl.value = editGroup.name || '';
        if (phoneEl) phoneEl.value = editGroup.phone || '';
        var split = splitStoredAddress(editAddr.text);
        if (split.region) {
          state.region = split.region;
          if (regionValue) {
            regionValue.textContent = split.region;
            regionValue.classList.remove('ua-or-addr-create-row__value--placeholder');
          }
        }
        if (detailEl) detailEl.value = split.detail || '';
      }
    }

    var baseline = {
      name: ((nameEl && nameEl.value) || '').trim(),
      phone: ((phoneEl && phoneEl.value) || '').trim().replace(/\D/g, ''),
      region: state.region || '',
      detail: ((detailEl && detailEl.value) || '').trim()
    };

    function getFormSnapshot() {
      return {
        name: ((nameEl && nameEl.value) || '').trim(),
        phone: ((phoneEl && phoneEl.value) || '').trim().replace(/\D/g, ''),
        region: state.region || '',
        detail: ((detailEl && detailEl.value) || '').trim()
      };
    }

    function isAddressDirty() {
      if (!state.isEdit) return true;
      var cur = getFormSnapshot();
      return (
        cur.name !== baseline.name ||
        cur.phone !== baseline.phone ||
        cur.region !== baseline.region ||
        cur.detail !== baseline.detail
      );
    }

    function syncSaveBtn() {
      if (!saveBtn) return;
      if (!state.isEdit) {
        saveBtn.classList.add('is-active');
        return;
      }
      saveBtn.classList.toggle('is-active', isAddressDirty());
    }

    function expandSmart() {
      if (smartOpen) smartOpen.hidden = true;
      if (smartExpanded) smartExpanded.hidden = false;
      if (smartInput) {
        window.setTimeout(function () {
          smartInput.focus();
        }, 50);
      }
    }

    if (smartOpen) smartOpen.addEventListener('click', expandSmart);

    function syncRecognizeBtn() {
      if (!recognizeBtn) return;
      var hasText = !!(smartInput && String(smartInput.value || '').trim());
      recognizeBtn.classList.toggle('is-active', hasText);
      recognizeBtn.disabled = !hasText;
    }

    if (smartInput) {
      smartInput.addEventListener('input', syncRecognizeBtn);
      smartInput.addEventListener('paste', function () {
        window.setTimeout(syncRecognizeBtn, 0);
      });
    }
    syncRecognizeBtn();

    if (recognizeBtn) {
      recognizeBtn.addEventListener('click', function () {
        if (recognizeBtn.disabled || !recognizeBtn.classList.contains('is-active')) return;
        var parsed = parseSmartAddressText(smartInput && smartInput.value);
        if (!parsed || (!parsed.name && !parsed.phone && !parsed.detail && !parsed.region)) {
          showToast('未能识别地址，请完善文本');
          return;
        }
        if (nameEl && parsed.name) nameEl.value = parsed.name;
        if (phoneEl && parsed.phone) {
          phoneEl.value = parsed.phone;
          if (parsed.phone.indexOf('-') >= 0 && !state.landline) {
            phoneSwitch && phoneSwitch.click();
          }
        }
        if (parsed.region) {
          state.region = parsed.region;
          if (regionValue) {
            regionValue.textContent = parsed.region;
            regionValue.classList.remove('ua-or-addr-create-row__value--placeholder');
          }
        }
        if (detailEl && parsed.detail) detailEl.value = parsed.detail;
        syncSaveBtn();
        showToast('识别完成');
      });
    }

    if (phoneSwitch) {
      phoneSwitch.addEventListener('click', function () {
        state.landline = !state.landline;
        if (phoneLabel) phoneLabel.textContent = state.landline ? '座机号' : '手机号';
        if (phoneEl) {
          phoneEl.placeholder = state.landline ? '请输入座机号' : '请输入手机号';
          phoneEl.type = state.landline ? 'text' : 'tel';
          phoneEl.setAttribute('inputmode', state.landline ? 'numeric' : 'tel');
        }
        phoneSwitch.textContent = state.landline ? '切换手机' : '切换座机';
      });
    }

    if (regionRow) {
      regionRow.addEventListener('click', function () {
        openCityRegionSheet();
      });
    }

    var cityPicker = {
      province: '江苏省',
      city: '南京市',
      district: CITY_DISTRICT_NONE,
      searchIndex: null,
      bound: false
    };

    function getCitySearchIndex() {
      if (!cityPicker.searchIndex) cityPicker.searchIndex = flattenCitySearchIndex();
      return cityPicker.searchIndex;
    }

    function syncHotActive() {
      var grid = document.getElementById('cityHotGrid');
      if (!grid) return;
      grid.querySelectorAll('.ua-or-city-hot__btn').forEach(function (btn) {
        var p = btn.getAttribute('data-province');
        var c = btn.getAttribute('data-city');
        btn.classList.toggle('is-active', p === cityPicker.province && c === cityPicker.city);
      });
    }

    function renderHotCities() {
      var grid = document.getElementById('cityHotGrid');
      if (!grid) return;
      grid.innerHTML = CITY_HOT_LIST.map(function (item) {
        return (
          '<button type="button" class="ua-or-city-hot__btn" data-province="' +
          escapeHtml(item.province) +
          '" data-city="' +
          escapeHtml(item.city) +
          '">' +
          escapeHtml(item.label) +
          '</button>'
        );
      }).join('');
      grid.querySelectorAll('.ua-or-city-hot__btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cityPicker.province = btn.getAttribute('data-province');
          cityPicker.city = btn.getAttribute('data-city');
          cityPicker.district = CITY_DISTRICT_NONE;
          renderCityWheels();
          syncHotActive();
        });
      });
      syncHotActive();
    }

    function renderWheelColumn(wheelEl, items, selected, onSelect) {
      if (!wheelEl) return;
      var html =
        '<div class="ua-or-city-wheel__pad"></div>' +
        items
          .map(function (item) {
            return (
              '<div class="ua-or-city-wheel__item' +
              (item === selected ? ' is-selected' : '') +
              '" data-value="' +
              escapeHtml(item) +
              '">' +
              escapeHtml(item) +
              '</div>'
            );
          })
          .join('') +
        '<div class="ua-or-city-wheel__pad"></div>';
      wheelEl.innerHTML = html;
      var idx = Math.max(0, items.indexOf(selected));
      wheelEl._cityItems = items;
      wheelEl._cityOnSelect = onSelect;
      window.requestAnimationFrame(function () {
        var padH = Math.max(0, wheelEl.clientHeight / 2 - CITY_WHEEL_ITEM_H / 2);
        wheelEl.querySelectorAll('.ua-or-city-wheel__pad').forEach(function (pad) {
          pad.style.height = padH + 'px';
        });
        wheelEl.scrollTop = idx * CITY_WHEEL_ITEM_H;
      });
    }

    function readWheelIndex(wheelEl) {
      var items = wheelEl._cityItems || [];
      if (!items.length) return 0;
      var idx = Math.round(wheelEl.scrollTop / CITY_WHEEL_ITEM_H);
      if (idx < 0) idx = 0;
      if (idx > items.length - 1) idx = items.length - 1;
      return idx;
    }

    function applyWheelSelection(wheelEl, snap) {
      var items = wheelEl._cityItems || [];
      if (!items.length) return;
      var idx = readWheelIndex(wheelEl);
      if (snap) {
        wheelEl.scrollTop = idx * CITY_WHEEL_ITEM_H;
      }
      var value = items[idx];
      wheelEl.querySelectorAll('.ua-or-city-wheel__item').forEach(function (itemEl, i) {
        itemEl.classList.toggle('is-selected', i === idx);
      });
      if (typeof wheelEl._cityOnSelect === 'function') {
        wheelEl._cityOnSelect(value, idx);
      }
    }

    function bindCityWheel(wheelEl) {
      if (!wheelEl || wheelEl._cityBound) return;
      wheelEl._cityBound = true;
      wheelEl.addEventListener('scroll', function () {
        var idx = readWheelIndex(wheelEl);
        wheelEl.querySelectorAll('.ua-or-city-wheel__item').forEach(function (itemEl, i) {
          itemEl.classList.toggle('is-selected', i === idx);
        });
        window.clearTimeout(wheelEl._cityTimer);
        wheelEl._cityTimer = window.setTimeout(function () {
          applyWheelSelection(wheelEl, true);
        }, 80);
      });
      wheelEl.addEventListener('click', function (e) {
        var itemEl = e.target.closest('.ua-or-city-wheel__item');
        if (!itemEl || !wheelEl.contains(itemEl)) return;
        var items = wheelEl._cityItems || [];
        var value = itemEl.getAttribute('data-value');
        var idx = items.indexOf(value);
        if (idx < 0) return;
        wheelEl.scrollTop = idx * CITY_WHEEL_ITEM_H;
        applyWheelSelection(wheelEl, true);
      });
    }

    function renderCityWheels() {
      var provWheel = document.getElementById('cityProvWheel');
      var cityWheel = document.getElementById('cityCityWheel');
      var distWheel = document.getElementById('cityDistWheel');
      [provWheel, cityWheel, distWheel].forEach(function (el) {
        if (el && el._cityTimer) window.clearTimeout(el._cityTimer);
      });
      var provinces = getCityProvinces();
      if (provinces.indexOf(cityPicker.province) < 0) cityPicker.province = provinces[0] || '';
      var cities = getCityCities(cityPicker.province);
      if (cities.indexOf(cityPicker.city) < 0) cityPicker.city = cities[0] || '';
      var districts = getCityDistricts(cityPicker.province, cityPicker.city);
      if (districts.indexOf(cityPicker.district) < 0) cityPicker.district = CITY_DISTRICT_NONE;

      renderWheelColumn(provWheel, provinces, cityPicker.province, function (value) {
        if (value === cityPicker.province) return;
        cityPicker.province = value;
        var nextCities = getCityCities(value);
        cityPicker.city = nextCities[0] || '';
        cityPicker.district = CITY_DISTRICT_NONE;
        renderCityWheels();
        syncHotActive();
      });
      renderWheelColumn(cityWheel, cities, cityPicker.city, function (value) {
        if (value === cityPicker.city) return;
        cityPicker.city = value;
        cityPicker.district = CITY_DISTRICT_NONE;
        renderCityWheels();
        syncHotActive();
      });
      renderWheelColumn(distWheel, districts, cityPicker.district, function (value) {
        cityPicker.district = value;
      });

      bindCityWheel(provWheel);
      bindCityWheel(cityWheel);
      bindCityWheel(distWheel);
      syncHotActive();
    }

    function setCitySearchMode(on) {
      var body = document.getElementById('cityRegionBody');
      var results = document.getElementById('citySearchResults');
      if (body) body.hidden = !!on;
      if (results) results.hidden = !on;
    }

    function renderCitySearch(keyword) {
      var results = document.getElementById('citySearchResults');
      if (!results) return;
      var q = String(keyword || '').trim().toLowerCase();
      if (!q) {
        setCitySearchMode(false);
        return;
      }
      setCitySearchMode(true);
      var matched = getCitySearchIndex()
        .filter(function (row) {
          return row.keywords.indexOf(q) >= 0 || row.label.toLowerCase().indexOf(q) >= 0;
        })
        .slice(0, 40);
      if (!matched.length) {
        results.innerHTML = '<div class="ua-or-city-search-empty">未找到相关地区</div>';
        return;
      }
      results.innerHTML = matched
        .map(function (row) {
          return (
            '<button type="button" class="ua-or-city-search-item" data-province="' +
            escapeHtml(row.province) +
            '" data-city="' +
            escapeHtml(row.city) +
            '" data-district="' +
            escapeHtml(row.district) +
            '">' +
            '<div>' +
            escapeHtml(row.district === CITY_DISTRICT_NONE ? row.city : row.district) +
            '</div>' +
            '<div class="ua-or-city-search-item__path">' +
            escapeHtml(row.label) +
            '</div>' +
            '</button>'
          );
        })
        .join('');
      results.querySelectorAll('.ua-or-city-search-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cityPicker.province = btn.getAttribute('data-province');
          cityPicker.city = btn.getAttribute('data-city');
          cityPicker.district = btn.getAttribute('data-district');
          var searchInput = document.getElementById('cityRegionSearch');
          if (searchInput) searchInput.value = '';
          setCitySearchMode(false);
          renderCityWheels();
          syncHotActive();
        });
      });
    }

    function openCityRegionSheet() {
      var parsed = parseCityRegionParts(state.region);
      if (parsed) {
        cityPicker.province = parsed.province;
        cityPicker.city = parsed.city;
        cityPicker.district = parsed.district;
      } else {
        cityPicker.province = '江苏省';
        cityPicker.city = '南京市';
        cityPicker.district = CITY_DISTRICT_NONE;
      }
      var searchInput = document.getElementById('cityRegionSearch');
      if (searchInput) searchInput.value = '';
      setCitySearchMode(false);
      openSheet('addrCreateRegionSheet');
      renderHotCities();
      renderCityWheels();
    }

    if (!cityPicker.bound) {
      cityPicker.bound = true;
      var searchInputEl = document.getElementById('cityRegionSearch');
      if (searchInputEl) {
        searchInputEl.addEventListener('input', function () {
          renderCitySearch(searchInputEl.value);
        });
      }
      document.getElementById('addrCreateRegionConfirm') &&
        document.getElementById('addrCreateRegionConfirm').addEventListener('click', function () {
          var val = formatCityRegion(cityPicker.province, cityPicker.city, cityPicker.district);
          if (!cityPicker.province || !cityPicker.city) {
            showToast('请选择城市地区');
            return;
          }
          state.region = val;
          if (regionValue) {
            regionValue.textContent = val;
            regionValue.classList.remove('ua-or-addr-create-row__value--placeholder');
          }
          closeSheet('addrCreateRegionSheet');
          syncSaveBtn();
        });
    }

    [nameEl, phoneEl, detailEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', syncSaveBtn);
    });
    syncSaveBtn();

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (state.isEdit && !isAddressDirty()) {
          showToast('地址未修改，无需保存');
          return;
        }
        var name = ((nameEl && nameEl.value) || '').trim();
        var phone = ((phoneEl && phoneEl.value) || '').trim();
        var detail = ((detailEl && detailEl.value) || '').trim();
        if (!name) {
          showToast('请输入姓名');
          return;
        }
        if (!phone) {
          showToast(state.landline ? '请输入座机号' : '请输入手机号');
          return;
        }
        if (!state.region) {
          showToast('请选择省市区');
          return;
        }
        if (!detail) {
          showToast('请输入详细地址');
          return;
        }

        var groups = loadAddressBookGroups();
        var full = state.region + ' ' + detail;
        var phoneDigits = phone.replace(/\D/g, '');
        var addrId = state.isEdit ? state.editAddrId : 'ab-a' + Date.now();

        if (state.isEdit) {
          groups.forEach(function (g) {
            g.addresses = (g.addresses || []).filter(function (a) {
              return a.id !== state.editAddrId;
            });
          });
          groups = groups.filter(function (g) {
            return (g.addresses || []).length > 0;
          });
        }

        var group = groups.find(function (g) {
          return g.name === name && String(g.phone).replace(/\D/g, '') === phoneDigits;
        });
        if (group) {
          group.addresses = group.addresses || [];
          group.addresses.push({ id: addrId, text: full });
          group.phone = phone;
          group.phoneDisplay = formatPhoneDisplay(phone);
        } else {
          groups.unshift({
            id: 'ab-g' + Date.now(),
            name: name,
            phone: phone,
            phoneDisplay: formatPhoneDisplay(phone),
            tags: [],
            addresses: [{ id: addrId, text: full }]
          });
        }
        saveAddressBookGroups(groups);
        showToast(state.isEdit ? '地址已更新' : '地址已保存');
        window.setTimeout(function () {
          window.location.href = backHref;
        }, 400);
      });
    }

    bindSheetClose();
  }

  function initAftersaleListPage() {
    var params = getParams();
    var filter = params.get('asFilter') || 'processing';
    if (filter !== 'done' && filter !== 'all') filter = 'processing';
    var itemFilter = params.get('asItem');
    var asIdsRaw = params.get('asIds') || '';
    var asIdSet = null;
    if (asIdsRaw) {
      asIdSet = {};
      asIdsRaw.split(',').forEach(function (id) {
        var trimmed = String(id || '').trim();
        if (trimmed) asIdSet[trimmed] = true;
      });
    }

    /* 按 asIds 限定时，优先展示对应完结记录 */
    if (asIdSet && !params.get('asFilter')) filter = 'done';

    var backHref = 'restock.html?tab=me';
    if (params.get('fromDetail') === '1') {
      var odQs = [];
      ['from', 'status', 'supplier', 'delivery', 'cutoff', 'reason', 'scene'].forEach(function (key) {
        var val = params.get(key);
        if (val) odQs.push(key + '=' + encodeURIComponent(val));
      });
      if (!params.get('status')) odQs.push('status=receipt');
      backHref = 'order-detail.html?' + odQs.join('&');
    }

    var backEl = document.getElementById('aftersaleListBack');
    if (backEl) backEl.setAttribute('href', backHref);

    var listEl = document.getElementById('aftersaleList');
    var emptyEl = document.getElementById('aftersaleListEmpty');
    var tabs = document.querySelectorAll('[data-as-filter]');

    function isProcessing(rec) {
      return !isAftersaleFinished(rec);
    }

    function getVisible() {
      var all = loadAftersaleRecords();
      return all.filter(function (rec) {
        if (asIdSet && !asIdSet[rec.id]) return false;
        if (itemFilter != null && itemFilter !== '' && String(rec.itemIndex) !== String(itemFilter)) {
          return false;
        }
        if (filter === 'processing') return isProcessing(rec);
        if (filter === 'done') return !isProcessing(rec);
        return true;
      });
    }

    function renderTabs() {
      tabs.forEach(function (tab) {
        var key = tab.getAttribute('data-as-filter');
        tab.classList.toggle('is-active', key === filter);
      });
    }

    function renderList() {
      var rows = getVisible();
      renderTabs();
      if (!listEl) return;
      if (!rows.length) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      listEl.innerHTML = rows
        .map(function (rec) {
          var view = getAftersaleProgressView(rec);
          var typeLabel = AFTERSALE_TYPE_LABEL[rec.type] || '售后';
          var amountLine =
            getAftersaleTypeGroup(rec.type) === 'refund' && Number(rec.amount) > 0
              ? '<div class="ua-as-card__amount">退款: ¥ ' +
                Number(rec.amount).toFixed(2) +
                '</div>'
              : '';
          var barDesc = view.showAmount
            ? escapeHtml(view.desc) +
              '<em class="ua-as-bar__amount">' +
              escapeHtml(view.amountText) +
              '</em>'
            : escapeHtml(view.desc);
          var actions = '';
          if (isProcessing(rec)) {
            actions =
              '<button type="button" class="ua-as-card__btn ua-as-card__btn--primary" data-as-open="' +
              escapeHtml(rec.id) +
              '">查看详情</button>';
          } else {
            actions =
              '<button type="button" class="ua-as-card__btn" data-as-open="' +
              escapeHtml(rec.id) +
              '">查看详情</button>' +
              '<button type="button" class="ua-as-card__btn ua-as-card__btn--primary" data-as-open="' +
              escapeHtml(rec.id) +
              '">删除记录</button>';
          }

          return (
            '<article class="ua-as-card" data-as-id="' +
            escapeHtml(rec.id) +
            '">' +
            '<div class="ua-as-card__head">' +
            '<span class="ua-as-card__shop">' +
            escapeHtml(rec.shopName || '冷丰优选供应链') +
            '</span>' +
            '<span class="ua-as-card__type">' +
            escapeHtml(typeLabel) +
            '</span></div>' +
            '<button type="button" class="ua-as-card__product" data-as-open="' +
            escapeHtml(rec.id) +
            '">' +
            '<img class="ua-as-card__img" src="' +
            escapeHtml(rec.productImg || '../assets/order-product-1.svg') +
            '" alt="">' +
            '<span class="ua-as-card__info">' +
            '<span class="ua-as-card__name">' +
            escapeHtml(rec.productName || '') +
            '</span>' +
            '<span class="ua-as-card__spec">' +
            escapeHtml(rec.productSpec || '') +
            '</span>' +
            amountLine +
            '</span></button>' +
            '<button type="button" class="ua-as-bar" data-as-open="' +
            escapeHtml(rec.id) +
            '">' +
            '<span class="ua-as-bar__title">' +
            escapeHtml(view.title) +
            '</span>' +
            (barDesc
              ? '<span class="ua-as-bar__desc">' + barDesc + '</span>'
              : '') +
            '<svg class="ua-as-bar__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
            '</button>' +
            '<div class="ua-as-card__actions">' +
            actions +
            '</div></article>'
          );
        })
        .join('');

      listEl.querySelectorAll('[data-as-open]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var id = el.getAttribute('data-as-open');
          var rec = loadAftersaleRecords().find(function (r) {
            return r.id === id;
          });
          if (!rec) return;
          if (el.textContent && el.textContent.indexOf('删除') >= 0) {
            showToast('已删除（演示）');
            return;
          }
          window.location.href = buildAftersaleDetailHref(rec, {
            from: params.get('from') || 'restock.html',
            status: params.get('status') || 'receipt',
            supplier: rec.shopName || params.get('supplier') || '',
            delivery: params.get('delivery') || 'warehouse',
            scene: params.get('scene') || 'post_ship'
          });
        });
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        filter = tab.getAttribute('data-as-filter') || 'processing';
        renderList();
      });
    });

    renderList();
  }

  global.UAOrderRefund = {
    DEMO_ITEMS: DEMO_ITEMS,
    getParams: getParams,
    getScene: getScene,
    getItem: getItem,
    getItemIndex: getItemIndex,
    buildDetailBackHref: buildDetailBackHref,
    buildQuery: buildQuery,
    buildSelectHref: buildSelectHref,
    buildOnlyHref: buildOnlyHref,
    buildReturnHref: buildReturnHref,
    buildRestockHref: buildRestockHref,
    buildExchangeHref: buildExchangeHref,
    initSelectPage: initSelectPage,
    initFormPage: initFormPage,
    initPreShipPage: initPreShipPage,
    initRestockPage: initRestockPage,
    initExchangePage: initExchangePage,
    initDetailPage: initDetailPage,
    initPickupEditPage: initPickupEditPage,
    initPickupOrderPage: initPickupOrderPage,
    initReturnGoodsPage: initReturnGoodsPage,
    initReturnShipPage: initReturnShipPage,
    initAddressBookPage: initAddressBookPage,
    initAddressCreatePage: initAddressCreatePage,
    initAftersaleListPage: initAftersaleListPage,
    loadAftersaleRecords: loadAftersaleRecords,
    getAftersaleRecordsByItem: getAftersaleRecordsByItem,
    getAftersaleDisplayBars: getAftersaleDisplayBars,
    getAftersaleProgressView: getAftersaleProgressView,
    getAftersaleTypeGroup: getAftersaleTypeGroup,
    hasOpenAftersaleOfGroup: hasOpenAftersaleOfGroup,
    getMergedRefundAmount: getMergedRefundAmount,
    getItemRefundedPickupQty: getItemRefundedPickupQty,
    getItemRemainingPickupQty: getItemRemainingPickupQty,
    getRefundableMaxQty: getRefundableMaxQty,
    getRestockMaxQty: getRestockMaxQty,
    getRefundSuccessQty: getRefundSuccessQty,
    getAftersaleOccupiedQty: getAftersaleOccupiedQty,
    canShowAftersaleEntry: canShowAftersaleEntry,
    saveItemPickedQtyMap: saveItemPickedQtyMap,
    getItemPickedQty: getItemPickedQty,
    resolveRetailOrderFulfillmentStatus: resolveRetailOrderFulfillmentStatus,
    DEMO_ORDER_NO: DEMO_ORDER_NO,
    isAftersaleFinished: isAftersaleFinished,
    buildAftersaleDetailHref: buildAftersaleDetailHref,
    buildAftersaleListHref: buildAftersaleListHref,
    AFTERSALE_TYPE_LABEL: AFTERSALE_TYPE_LABEL,
    buildDetailHref: buildDetailHref,
    buildPickupEditHref: buildPickupEditHref,
    buildPickupOrderHref: buildPickupOrderHref,
    buildReturnShipHref: buildReturnShipHref,
    buildReturnGoodsHref: buildReturnGoodsHref,
    buildAddressBookHref: buildAddressBookHref,
    buildAddressCreateHref: buildAddressCreateHref,
    renderProductCard: renderProductCard,
    initNav: initNav
  };
})(typeof window !== 'undefined' ? window : this);
