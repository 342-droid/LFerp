(function () {
  var STORAGE_KEY = 'mdm_proxy_order_shipments_v1';

  /** 物流公司下拉（与售后寄回枚举对齐，快递100常用热门） */
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

  var TRACKING_COURIER_RULES = [
    { courier: '顺丰速运', test: function (no) { return /^SF/i.test(no); } },
    { courier: '圆通速递', test: function (no) { return /^YT/i.test(no); } },
    { courier: '京东物流', test: function (no) { return /^JD/i.test(no) || /^VA/i.test(no); } },
    { courier: '中通快递', test: function (no) { return /^ZT/i.test(no) || /^75\d{11,}$/.test(no) || /^78\d{11,}$/.test(no); } },
    { courier: '申通快递', test: function (no) { return /^77\d{11,}$/.test(no) || /^772\d{10,}$/.test(no); } },
    { courier: '韵达快递', test: function (no) { return /^43\d{11,}$/.test(no) || /^31\d{11,}$/.test(no); } }
  ];

  function inferCourierFromTrackingNo(trackingNo) {
    var no = String(trackingNo || '').trim().toUpperCase();
    if (!no) return '';
    for (var i = 0; i < TRACKING_COURIER_RULES.length; i++) {
      if (TRACKING_COURIER_RULES[i].test(no)) return TRACKING_COURIER_RULES[i].courier;
    }
    return '';
  }

  function formatGoodsLabel(goods) {
    if (!goods || !goods.length) return '商品';
    if (goods.length === 1) return goods[0].name;
    return goods[0].name + ' 等' + goods.length + '种';
  }

  var DEFAULT_TIMELINE = [
    {
      type: 'address',
      text: '【收货地址】浙江省杭州市上城区望江街道望江路16号 15236806537'
    },
    {
      time: '12-01\n12:00',
      title: '已签收',
      desc: '期待再次为您服务',
      active: true
    },
    {
      time: '12-01\n10:30',
      title: '待取件',
      desc: '快件已被【蜂站】开开心心物业服务中心站点代收，请凭取件码取件，联系电话 <span class="order-proxy-track-phone">15977234567</span>'
    },
    {
      time: '12-01\n08:20',
      title: '派送中',
      desc: '【宁波市】快件正在派送中，派送员：王帅，联系电话 <span class="order-proxy-track-phone">18084567234</span>，请保持电话畅通'
    },
    {
      time: '12-01\n06:00',
      title: '运输中',
      desc: '【宁波市】快件已到达 宁波象山转运中心'
    },
    {
      time: '11-30\n22:15',
      title: '运输中',
      desc: '【宁波市】快件离开 宁波转运中心，下一站 宁波象山转运中心'
    },
    {
      time: '11-30\n18:40',
      title: '运输中',
      desc: '【宁波市】快件到达 宁波转运中心'
    },
    {
      time: '11-30\n14:20',
      title: '运输中',
      desc: '【杭州市】快件离开 杭州萧山转运中心，下一站 宁波转运中心'
    },
    {
      time: '11-30\n10:05',
      title: '运输中',
      desc: '【杭州市】快件到达 杭州萧山转运中心'
    },
    {
      time: '11-30\n08:30',
      title: '已揽件',
      desc: '【杭州市】快件已在 杭州萧山营业部 揽收，揽件员：王帅，联系电话 <span class="order-proxy-track-phone">15922345621</span>'
    },
    {
      time: '11-30\n08:00',
      title: '已发货',
      desc: '包裹正在等待揽收'
    },
    {
      time: '11-29\n16:20',
      title: '已下单',
      desc: '商品已经下单'
    }
  ];

  var PROXY_FULFILLMENT = {
    'ORD-3212689201598341': 'WAREHOUSE',
    'ORD-3212689201588561': 'STORE',
    'ORD-3212689201588561-B': 'STORE',
    'ORD-3212689201584693': 'WAREHOUSE',
    'ORD-3212689201562037-A': 'WAREHOUSE',
    'ORD-3212689201562037-B': 'STORE',
    'ORD-3212689201560683': 'WAREHOUSE',
    'ORD-3212689201599001': 'STORE',
    'ORD-3212689201599002': 'STORE',
    'ORD-3212689201599003': 'STORE',
    'ORD-3212689201560682': 'STORE'
  };

  var SEED_SHIPMENTS = {
    'ORD-3212689201588561': [{
      id: 'SH-1588561-1',
      serialNo: '1234567890',
      courier: '申通快递',
      trackingNo: '773075059702651',
      status: '待揽件',
      goodId: 'g1',
      goodName: '微辣萝卜干 500g 4号…',
      goods: [{ id: 'g1', name: '微辣萝卜干 500g 4号…', barcode: '6901001001001' }],
      timeline: [{
        time: '06-05\n20:50',
        title: '已发货',
        desc: '商家已上传快递单号，包裹等待揽收',
        active: true
      }]
    }],
    'ORD-3212689201599001': [{
      id: 'SH-1599001-1',
      serialNo: '9876543210',
      courier: '顺丰速运',
      trackingNo: 'SF1234567890123',
      status: '已签收',
      goodId: 'g1',
      goodName: '冷丰优选3J智利车厘子 3斤装',
      timeline: DEFAULT_TIMELINE
    }, {
      id: 'SH-1599001-2',
      serialNo: '9876543211',
      courier: '顺丰速运',
      trackingNo: 'SF1234567890124',
      status: '运输中',
      goodId: 'g1',
      goodName: '冷丰优选3J智利车厘子 3斤装（分包裹2）',
      timeline: [
        {
          type: 'address',
          text: '【收货地址】浙江省杭州市上城区望江街道望江路16号 155****9061'
        },
        {
          time: '12-02\n09:00',
          title: '运输中',
          desc: '【杭州市】快件离开 杭州萧山转运中心，下一站 宁波转运中心',
          active: true
        },
        {
          time: '12-02\n06:30',
          title: '运输中',
          desc: '【杭州市】快件到达 杭州萧山转运中心'
        },
        {
          time: '12-01\n18:20',
          title: '已揽件',
          desc: '【杭州市】快件已在 杭州萧山营业部 揽收，揽件员：李强，联系电话 <span class="order-proxy-track-phone">13800138000</span>'
        },
        {
          time: '12-01\n17:50',
          title: '已发货',
          desc: '包裹正在等待揽收'
        },
        {
          time: '12-01\n16:20',
          title: '已下单',
          desc: '商品已经下单'
        }
      ]
    }],
    'ORD-3212689201560682': [{
      id: 'SH-1560682-1',
      serialNo: '5566778899',
      courier: '圆通速递',
      trackingNo: 'YT887766554433',
      status: '已签收',
      goodId: 'g1',
      goodName: '精品牛腩 500g',
      timeline: DEFAULT_TIMELINE
    }],
    'ORD-3212689201599003': [{
      id: 'SH-1599003-1',
      serialNo: '3344556677',
      courier: '申通快递',
      trackingNo: '773088899900011',
      status: '在途中',
      goodId: 'g1',
      goodIds: ['g1', 'g2'],
      goodName: '新鲜红颜草莓 香甜多汁 500g装 等2种',
      goods: [
        { id: 'g1', name: '新鲜红颜草莓 香甜多汁 500g装', barcode: '6901003001003' },
        { id: 'g2', name: '进口香蕉 香甜软糯 3斤装', barcode: '6901003001004' }
      ],
      timeline: DEFAULT_TIMELINE
    }]
  };

  function readStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getFulfillmentMode(orderId, row) {
    if (row) {
      var mode = row.getAttribute('data-fulfillment-mode');
      if (mode === 'store') return 'STORE';
      if (mode === 'warehouse') return 'WAREHOUSE';
    }
    return PROXY_FULFILLMENT[orderId] || 'STORE';
  }

  function fulfillmentLabel(mode, context) {
    if (context === 'retail') return '快递';
    return mode === 'WAREHOUSE' ? '配送' : '快递';
  }

  function isRetailExpressContext(options) {
    return !!(options && options.context === 'retail');
  }

  function getShipments(orderId) {
    var store = readStore();
    if (store[orderId] && store[orderId].length) return store[orderId].slice();
    return (SEED_SHIPMENTS[orderId] || []).slice();
  }

  function saveShipments(orderId, shipments) {
    var store = readStore();
    store[orderId] = shipments;
    writeStore(store);
  }

  function addShipment(orderId, payload) {
    var list = getShipments(orderId);
    var goods = payload.goods && payload.goods.length
      ? payload.goods
      : [{ id: payload.goodId, name: payload.goodName }];
    var shipment = {
      id: 'SH-' + Date.now(),
      serialNo: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      courier: payload.courier,
      trackingNo: payload.trackingNo,
      status: '待揽件',
      goodId: goods[0].id,
      goodIds: goods.map(function (g) { return g.id; }),
      goodName: formatGoodsLabel(goods),
      goods: goods,
      timeline: [{
        time: formatNowShort(),
        title: '已发货',
        desc: '商家已上传快递单号，包裹等待揽收',
        active: true
      }]
    };
    list.push(shipment);
    saveShipments(orderId, list);
    return shipment;
  }

  function updateShipment(orderId, shipmentId, payload) {
    var list = getShipments(orderId);
    var idx = -1;
    var current = null;
    list.forEach(function (item, i) {
      if (item.id === shipmentId) {
        idx = i;
        current = item;
      }
    });
    if (idx < 0 || !current) return null;
    if (current.status !== '待揽件') return null;

    var goods = payload.goods && payload.goods.length
      ? payload.goods
      : [{ id: payload.goodId, name: payload.goodName }];
    var next = Object.assign({}, current, {
      courier: payload.courier,
      trackingNo: payload.trackingNo,
      goodId: goods[0].id,
      goodIds: goods.map(function (g) { return g.id; }),
      goodName: formatGoodsLabel(goods),
      goods: goods,
      timeline: [{
        time: formatNowShort(),
        title: '已发货',
        desc: '商家已修改快递单号，包裹等待揽收',
        active: true
      }]
    });
    list[idx] = next;
    saveShipments(orderId, list);
    return next;
  }

  function deleteShipment(orderId, shipmentId) {
    var list = getShipments(orderId);
    var target = null;
    list.forEach(function (item) {
      if (item.id === shipmentId) target = item;
    });
    if (!target || target.status !== '待揽件') return false;
    var next = list.filter(function (item) { return item.id !== shipmentId; });
    saveShipments(orderId, next);
    return true;
  }

  function canEditShipment(shipment) {
    return !!(shipment && shipment.status === '待揽件');
  }

  function formatNowShort() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    return mm + '-' + dd + '\n' + hh + ':' + mi;
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function closeOverlay(id) {
    var node = document.getElementById(id);
    if (node) node.remove();
    syncBodyOverflow();
  }

  function closeTrackingDrawer() {
    var backdrop = document.getElementById('orderProxyTrackBackdrop');
    var drawer = document.getElementById('orderProxyTrackDrawer');
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
    syncBodyOverflow();
  }

  function syncBodyOverflow() {
    if (
      !document.getElementById('orderDetailBackdrop') &&
      !document.getElementById('orderProxyExpressOverlay') &&
      !document.getElementById('orderProxyTrackBackdrop') &&
      !document.getElementById('orderProxyBatchUploadBackdrop')
    ) {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }

  function getShipmentGoods(shipment) {
    if (shipment.goods && shipment.goods.length) {
      return shipment.goods.map(function (g) {
        return {
          id: g.id,
          name: g.name,
          barcode: g.barcode || g.sku || ''
        };
      });
    }
    if (shipment.goodName) {
      return [{
        id: shipment.goodId || 'g1',
        name: shipment.goodName,
        barcode: shipment.barcode || ''
      }];
    }
    return [];
  }

  function buildShipmentGoodsHtml(shipment) {
    var goods = getShipmentGoods(shipment);
    if (!goods.length) return '';
    var strips = goods.map(function (g) {
      return '<div class="order-proxy-goods-strip">' + escapeHtml(g.name) + '</div>';
    }).join('');
    return (
      '<div class="order-proxy-goods-card">' +
        '<div class="order-proxy-goods-card__title">关联商品</div>' +
        '<div class="order-proxy-goods-strip-list">' + strips + '</div>' +
      '</div>'
    );
  }

  function buildTrackGoodsHtml(shipment) {
    var goods = getShipmentGoods(shipment);
    if (!goods.length) return '';
    var chips = goods.map(function (g) {
      return (
        '<div class="order-proxy-goods-chip">' +
          '<span class="order-proxy-goods-chip__name">' + escapeHtml(g.name) + '</span>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="order-proxy-goods-card">' +
        '<div class="order-proxy-goods-card__title">关联商品</div>' +
        '<div class="order-proxy-goods-card__list">' + chips + '</div>' +
      '</div>'
    );
  }

  function buildShipmentBlock(shipment, index, orderId, handlers) {
    handlers = handlers || {};
    var allowManage = handlers.allowManage === true && canEditShipment(shipment);
    /* 零售订单详情不展示发货单流水号 */
    var isRetailPage =
      typeof document !== 'undefined' &&
      document.body &&
      document.body.getAttribute('data-order-page') === 'retail';
    var block = el('div', 'order-proxy-shipment');
    block.innerHTML =
      '<div class="order-proxy-shipment__head">' +
        '<span class="order-proxy-shipment__label">包裹' + (index + 1) + '</span>' +
        (allowManage
          ? '<div class="order-proxy-shipment__actions">' +
              '<button type="button" class="order-proxy-shipment__action js-proxy-shipment-edit">修改</button>' +
              '<button type="button" class="order-proxy-shipment__action order-proxy-shipment__action--danger js-proxy-shipment-del">删除</button>' +
            '</div>'
          : '') +
      '</div>' +
      buildShipmentGoodsHtml(shipment) +
      '<div class="order-proxy-shipment__card">' +
        '<dl class="order-detail-kv order-proxy-shipment__kv">' +
          (isRetailPage
            ? ''
            : '<dt>发货单流水号</dt><dd>' + escapeHtml(shipment.serialNo) + '</dd>') +
          '<dt>物流单号</dt><dd>' + escapeHtml(shipment.trackingNo) + '</dd>' +
          '<dt>物流公司</dt><dd>' + escapeHtml(shipment.courier) + '</dd>' +
          '<dt>配送状态</dt><dd class="order-proxy-shipment__status">' +
            '<span>' + escapeHtml(shipment.status) + '</span>' +
            '<button type="button" class="order-proxy-shipment__track js-proxy-track" data-shipment-id="' + escapeHtml(shipment.id) + '">跟踪信息</button>' +
          '</dd>' +
        '</dl>' +
      '</div>';
    block.querySelector('.js-proxy-track').addEventListener('click', function () {
      openTrackingModal(orderId, shipment.id);
    });
    var editBtn = block.querySelector('.js-proxy-shipment-edit');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        if (typeof handlers.onEdit === 'function') handlers.onEdit(shipment);
      });
    }
    var delBtn = block.querySelector('.js-proxy-shipment-del');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (typeof handlers.onDelete === 'function') handlers.onDelete(shipment);
      });
    }
    return block;
  }

  var BATCH_REFUND_STATUSES = ['待审核', '退货中', '退款中', '退货成功', '退款成功', '发起退货/退款'];

  function canUploadExpressStatus(status, context) {
    // 代采快递由采购单回传，订单侧不再上传；仅零售快递可上传。售后态不写进订单状态。
    // 未截单提前发货：由发货事件当场补截单（不走配置时刻），底层一次完成接单+发货，状态变为待收货；页面不另呈现。
    if (context === 'retail') {
      if (!status) return false;
      if (window.OrderRetailStatus && window.OrderRetailStatus.isTerminal(status)) return false;
      return status !== '已完成' && status !== '已关闭' && status !== '已取消' &&
        status !== '交易成功' && status !== '交易失败';
    }
    return false;
  }

  function rowHasReturnRefundAftersale(row) {
    if (!row) return false;
    var texts = [row.getAttribute('data-as-status') || '', row.getAttribute('data-demo-as') || ''];
    row.querySelectorAll('.order-detail-goods-as-tag').forEach(function (el) {
      texts.push(el.textContent || '');
    });
    return texts.some(function (text) {
      var s = String(text || '').replace(/\s+/g, '');
      return BATCH_REFUND_STATUSES.some(function (status) {
        return s === status || s.indexOf(status) >= 0;
      });
    });
  }

  function buildDeliveryCard(detail, orderId, row, options) {
    var handlers = typeof options === 'function'
      ? { onUpload: options }
      : (options || {});
    var goods = handlers.goods || (detail && detail.goods) || [];
    var onRefresh = handlers.onRefresh;
    var onUpload = handlers.onUpload;
    var isRetail = isRetailExpressContext(handlers);

    // 零售快递与代采快递到店共用快递单上传/跟踪；零售强制走 STORE 快递区块
    var mode = isRetail ? 'STORE' : getFulfillmentMode(orderId, row);
    var card = el('div', 'order-detail-card order-proxy-delivery-card');
    card.appendChild(el('h3', 'order-detail-card__title', '配送信息'));

    var baseKv = el('dl', 'order-detail-kv');
    if (isRetail) {
      baseKv.innerHTML =
        '<dt>履约方式</dt><dd><span class="order-tag order-tag--scene">' + fulfillmentLabel(mode, 'retail') + '</span></dd>' +
        '<dt>收货人</dt><dd>' + escapeHtml(detail.delivery.name) + '</dd>' +
        '<dt>电话</dt><dd>' + escapeHtml(detail.delivery.phone) + '</dd>' +
        '<dt>收货地址</dt><dd>' + escapeHtml(detail.delivery.address) + '</dd>' +
        (detail.delivery.store
          ? '<dt>下单门店</dt><dd>' + escapeHtml(detail.delivery.store) + '</dd>'
          : '');
    } else {
      baseKv.innerHTML =
        '<dt>履约方式</dt><dd><span class="order-tag order-tag--scene">' + fulfillmentLabel(mode) + '</span></dd>' +
        '<dt>收货人</dt><dd>' + escapeHtml(detail.delivery.name) + '</dd>' +
        '<dt>电话</dt><dd>' + escapeHtml(detail.delivery.phone) + '</dd>' +
        '<dt>地址</dt><dd>' + escapeHtml(detail.delivery.address) + '</dd>' +
        '<dt>门店</dt><dd>' + escapeHtml(detail.delivery.store) + '</dd>';
    }
    card.appendChild(baseKv);

    if (mode === 'STORE') {
      var shipments = getShipments(orderId);
      var expressWrap = el('div', 'order-proxy-express-section');
      expressWrap.appendChild(el('div', 'order-proxy-express-section__title', '快递信息'));
      var allowManage = isRetail;

      function refreshAfterChange() {
        if (typeof onRefresh === 'function') onRefresh();
        else if (typeof onUpload === 'function') {
          /* legacy upload-only callback path has no refresh */
        }
      }

      if (shipments.length) {
        var list = el('div', 'order-proxy-shipment-list');
        shipments.forEach(function (sh, idx) {
          var shipmentHandlers = { allowManage: allowManage };
          if (allowManage) {
            shipmentHandlers.onEdit = function (shipment) {
              openUploadModal(orderId, goods, refreshAfterChange, shipment);
            };
            shipmentHandlers.onDelete = function (shipment) {
              if (!canEditShipment(shipment)) {
                if (typeof showToast === 'function') showToast('仅待揽件包裹可删除', 'error');
                return;
              }
              if (!window.confirm('确认删除该包裹快递信息？删除后不可恢复。')) return;
              if (!deleteShipment(orderId, shipment.id)) {
                if (typeof showToast === 'function') showToast('删除失败，包裹可能已发货', 'error');
                return;
              }
              if (typeof showToast === 'function') showToast('包裹已删除', 'success');
              refreshAfterChange();
            };
          }
          list.appendChild(buildShipmentBlock(sh, idx, orderId, shipmentHandlers));
        });
        expressWrap.appendChild(list);
      } else {
        expressWrap.appendChild(el(
          'div',
          'order-proxy-express-empty',
          isRetail ? '暂未上传快递单号' : '暂无快递信息，将由采购单回传'
        ));
      }

      var orderStatus = detail.progress && detail.progress.status ? detail.progress.status : '';
      if (row) {
        var statusEl = row.querySelector('td:nth-last-child(2) .order-tag');
        if (statusEl) orderStatus = statusEl.textContent.trim();
      }

      if (allowManage && canUploadExpressStatus(orderStatus, 'retail') && !rowHasReturnRefundAftersale(row)) {
        var uploadBtn = el('button', 'order-detail-btn order-detail-btn--primary order-proxy-upload-btn', '+ 上传快递单');
        uploadBtn.type = 'button';
        uploadBtn.addEventListener('click', function () {
          if (typeof onUpload === 'function') {
            onUpload();
            return;
          }
          openUploadModal(orderId, goods, refreshAfterChange);
        });
        expressWrap.appendChild(uploadBtn);
      }
      card.appendChild(expressWrap);
    }

    return card;
  }

  function renderTimeline(container, timeline) {
    container.innerHTML = (timeline || DEFAULT_TIMELINE).map(function (item) {
      if (item.type === 'address') {
        return (
          '<div class="order-proxy-track-row order-proxy-track-row--address">' +
          '<div class="order-proxy-track-time order-proxy-track-time--empty">—</div>' +
          '<div class="order-proxy-track-axis"><span class="order-proxy-track-node order-proxy-track-node--receive">收</span></div>' +
          '<div class="order-proxy-track-content"><div class="order-proxy-track-desc order-proxy-track-desc--address">' + item.text + '</div></div>' +
          '</div>'
        );
      }
      var nodeCls = 'order-proxy-track-node' + (item.active ? ' order-proxy-track-node--active' : '');
      var titleCls = 'order-proxy-track-title' + (item.active ? ' order-proxy-track-title--active' : '');
      return (
        '<div class="order-proxy-track-row">' +
        '<div class="order-proxy-track-time">' + (item.time || '').replace('\n', '<br>') + '</div>' +
        '<div class="order-proxy-track-axis"><span class="' + nodeCls + '"></span></div>' +
        '<div class="order-proxy-track-content">' +
        '<div class="' + titleCls + '">' + escapeHtml(item.title) + '</div>' +
        (item.desc ? '<div class="order-proxy-track-desc">' + item.desc + '</div>' : '') +
        '</div></div>'
      );
    }).join('');
  }

  function renderTrackingPanel(container, shipment) {
    var goodsEl = container.querySelector('#orderProxyTrackGoods');
    var courierRow = container.querySelector('.order-proxy-track-courier');
    var timelineEl = container.querySelector('#orderProxyTrackTimeline');
    if (goodsEl) {
      goodsEl.innerHTML = buildTrackGoodsHtml(shipment);
      goodsEl.hidden = !getShipmentGoods(shipment).length;
      goodsEl.className = getShipmentGoods(shipment).length ? 'order-proxy-track-goods-wrap' : '';
    }
    if (courierRow) {
      courierRow.innerHTML =
        '<span class="order-proxy-track-courier__name">' + escapeHtml(shipment.courier) + '</span>' +
        '<span class="order-proxy-track-courier__no">' + escapeHtml(shipment.trackingNo) + '</span>' +
        '<button type="button" class="order-proxy-track-courier__copy js-proxy-copy-no" aria-label="复制运单号">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>' +
        '</button>';
      courierRow.querySelector('.js-proxy-copy-no').addEventListener('click', function () {
        copyTrackingNo(shipment.trackingNo);
      });
    }
    if (timelineEl) {
      renderTimeline(timelineEl, shipment.timeline);
    }
  }

  function copyTrackingNo(trackingNo) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(trackingNo).then(function () {
        if (typeof showToast === 'function') showToast('已复制运单号', 'success');
      });
    } else if (typeof showToast === 'function') {
      showToast('已复制运单号', 'success');
    }
  }

  function openTrackingModal(orderId, activeShipmentId) {
    var shipments = getShipments(orderId);
    if (!shipments.length) {
      if (typeof showToast === 'function') showToast('暂无物流信息', 'error');
      return;
    }

    var activeIdx = 0;
    if (activeShipmentId) {
      shipments.forEach(function (sh, idx) {
        if (sh.id === activeShipmentId) activeIdx = idx;
      });
    }
    var activeShipment = shipments[activeIdx];

    closeTrackingDrawer();

    var backdrop = el('div', 'store-drawer-backdrop order-proxy-track-backdrop');
    backdrop.id = 'orderProxyTrackBackdrop';
    backdrop.addEventListener('click', closeTrackingDrawer);

    var drawer = el('aside', 'store-drawer order-proxy-track-drawer');
    drawer.id = 'orderProxyTrackDrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-labelledby', 'orderProxyTrackTitle');

    var header = el('div', 'store-drawer__header');
    var title = el('h2', 'store-drawer__title', '订单跟踪');
    title.id = 'orderProxyTrackTitle';
    header.appendChild(title);
    var closeBtn = el('button', 'store-drawer__close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', closeTrackingDrawer);
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    if (shipments.length > 1) {
      var tabsWrap = el('div', 'order-proxy-track-tabs');
      tabsWrap.setAttribute('role', 'tablist');
      shipments.forEach(function (sh, idx) {
        var tab = el('button', 'order-proxy-track-tab' + (idx === activeIdx ? ' is-active' : ''), '包裹' + (idx + 1));
        tab.type = 'button';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('data-shipment-index', String(idx));
        tab.setAttribute('aria-selected', idx === activeIdx ? 'true' : 'false');
        tabsWrap.appendChild(tab);
      });
      drawer.appendChild(tabsWrap);
    }

    var body = el('div', 'store-drawer__body order-proxy-track-drawer__body');
    body.innerHTML =
      '<div class="order-proxy-track-goods-wrap" id="orderProxyTrackGoods"></div>' +
      '<div class="order-proxy-track-card">' +
        '<div class="order-proxy-track-courier"></div>' +
        '<div class="order-proxy-track-timeline" id="orderProxyTrackTimeline"></div>' +
      '</div>';
    drawer.appendChild(body);

    renderTrackingPanel(body, activeShipment);

    if (shipments.length > 1) {
      drawer.querySelectorAll('.order-proxy-track-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var idx = parseInt(tab.getAttribute('data-shipment-index'), 10) || 0;
          drawer.querySelectorAll('.order-proxy-track-tab').forEach(function (el) {
            var active = el === tab;
            el.classList.toggle('is-active', active);
            el.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          renderTrackingPanel(body, shipments[idx]);
        });
      });
    }

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    syncBodyOverflow();

    function onEsc(e) {
      if (e.key === 'Escape') {
        closeTrackingDrawer();
        document.removeEventListener('keydown', onEsc);
      }
    }
    document.addEventListener('keydown', onEsc);
  }

  function openUploadModal(orderId, goods, onSaved, editShipment) {
    closeOverlay('orderProxyExpressOverlay');
    var isEdit = !!(editShipment && editShipment.id);
    if (isEdit && !canEditShipment(editShipment)) {
      if (typeof showToast === 'function') showToast('仅待揽件包裹可修改', 'error');
      return;
    }

    var normalized = (goods || []).map(function (g, idx) {
      return {
        id: g.id || ('g' + (idx + 1)),
        name: g.name
      };
    });
    if (!normalized.length) {
      normalized.push({ id: 'g1', name: '商品' });
    }

    var selectedMap = {};
    if (isEdit) {
      getShipmentGoods(editShipment).forEach(function (g) {
        selectedMap[g.id] = true;
      });
    }

    var courierOptions = '<option value="">请选择快递公司</option>' + COURIERS.map(function (c) {
      return '<option value="' + escapeHtml(c) + '"' +
        (isEdit && editShipment.courier === c ? ' selected' : '') + '>' +
        escapeHtml(c) + '</option>';
    }).join('');

    var goodsHtml = normalized.map(function (g) {
      var checked = isEdit ? !!selectedMap[g.id] : true;
      if (isEdit && !Object.keys(selectedMap).length) checked = true;
      return (
        '<label class="order-proxy-upload-good">' +
          '<input type="checkbox" class="order-proxy-upload-good__check js-proxy-upload-good" value="' + escapeHtml(g.id) + '"' +
          (checked ? ' checked' : '') + '>' +
          '<span class="order-proxy-upload-good__name">' + escapeHtml(g.name) + '</span>' +
        '</label>'
      );
    }).join('');

    var backdrop = el('div', 'order-proxy-express-overlay');
    backdrop.id = 'orderProxyExpressOverlay';
    backdrop.innerHTML =
      '<div class="order-proxy-upload-modal" role="dialog" aria-labelledby="orderProxyUploadTitle">' +
        '<div class="order-proxy-upload-modal__head">' +
          '<h3 id="orderProxyUploadTitle" class="order-proxy-upload-modal__title">' +
            (isEdit ? '修改快递单' : '上传快递单') +
          '</h3>' +
          '<button type="button" class="order-proxy-upload-modal__close js-proxy-express-close" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__body">' +
          '<div class="order-proxy-upload-field">' +
            '<div class="order-proxy-upload-field__label-row">' +
              '<label class="order-proxy-upload-field__label">关联商品</label>' +
              '<button type="button" class="order-proxy-upload-field__link js-proxy-upload-toggle-all">全选</button>' +
            '</div>' +
            '<div class="order-proxy-upload-goods" id="proxyUploadGoods">' + goodsHtml + '</div>' +
          '</div>' +
          '<div class="order-proxy-upload-field">' +
            '<label class="order-proxy-upload-field__label" for="proxyUploadTrackingNo">物流单号</label>' +
            '<input class="order-proxy-upload-field__input" id="proxyUploadTrackingNo" type="text" placeholder="请输入物流单号，将自动识别快递公司" maxlength="50" value="' +
              (isEdit ? escapeHtml(editShipment.trackingNo || '') : '') + '">' +
          '</div>' +
          '<div class="order-proxy-upload-field">' +
            '<label class="order-proxy-upload-field__label" for="proxyUploadCourier">物流公司</label>' +
            '<select class="order-proxy-upload-field__input order-proxy-upload-field__input--courier" id="proxyUploadCourier">' + courierOptions + '</select>' +
            '<p class="order-proxy-upload-field__auto-hint" id="proxyUploadCourierHint" hidden></p>' +
          '</div>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__foot">' +
          '<button type="button" class="order-detail-btn js-proxy-express-close">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-proxy-upload-submit">' +
            (isEdit ? '确认保存' : '确认上传') +
          '</button>' +
        '</div>' +
      '</div>';

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeOverlay('orderProxyExpressOverlay');
    });
    backdrop.querySelectorAll('.js-proxy-express-close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeOverlay('orderProxyExpressOverlay');
      });
    });

    var trackingInput = backdrop.querySelector('#proxyUploadTrackingNo');
    var courierSelect = backdrop.querySelector('#proxyUploadCourier');
    var courierHint = backdrop.querySelector('#proxyUploadCourierHint');
    var toggleAllBtn = backdrop.querySelector('.js-proxy-upload-toggle-all');
    var goodChecks = backdrop.querySelectorAll('.js-proxy-upload-good');

    function updateToggleAllLabel() {
      if (!toggleAllBtn) return;
      var allChecked = Array.prototype.every.call(goodChecks, function (cb) { return cb.checked; });
      toggleAllBtn.textContent = allChecked ? '取消全选' : '全选';
    }

    function applyCourierFromTracking() {
      if (!trackingInput || !courierSelect) return;
      var inferred = inferCourierFromTrackingNo(trackingInput.value);
      if (inferred) {
        courierSelect.value = inferred;
        if (courierHint) {
          courierHint.hidden = false;
          courierHint.textContent = '已根据物流单号自动识别：' + inferred;
        }
      } else if (courierHint) {
        courierHint.hidden = true;
        courierHint.textContent = '';
      }
    }

    if (courierSelect) {
      courierSelect.addEventListener('change', function () {
        if (courierHint && courierSelect.value) {
          courierHint.hidden = false;
          courierHint.textContent = '当前物流公司：' + courierSelect.value;
        }
      });
    }

    if (trackingInput) {
      if (window.LogisticsTrackingNo) window.LogisticsTrackingNo.bindInput(trackingInput);
      trackingInput.addEventListener('input', applyCourierFromTracking);
      trackingInput.addEventListener('blur', applyCourierFromTracking);
    }

    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', function () {
        var allChecked = Array.prototype.every.call(goodChecks, function (cb) { return cb.checked; });
        goodChecks.forEach(function (cb) {
          cb.checked = !allChecked;
        });
        updateToggleAllLabel();
      });
    }

    goodChecks.forEach(function (cb) {
      cb.addEventListener('change', updateToggleAllLabel);
    });
    updateToggleAllLabel();

    backdrop.querySelector('.js-proxy-upload-submit').addEventListener('click', function () {
      var selectedGoods = [];
      goodChecks.forEach(function (cb) {
        if (!cb.checked) return;
        var good = normalized.find(function (g) { return g.id === cb.value; });
        if (good) selectedGoods.push(good);
      });
      if (!selectedGoods.length) {
        if (typeof showToast === 'function') showToast('请至少选择一个关联商品', 'error');
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
        if (window.LogisticsTrackingNo && window.LogisticsTrackingNo.toastError) {
          window.LogisticsTrackingNo.toastError(trackingCheck);
        } else if (typeof showToast === 'function') {
          showToast(trackingCheck.message || '请输入物流单号', 'error');
        }
        return;
      }
      if (trackingInput) trackingInput.value = trackingCheck.value;
      var trackingNo = trackingCheck.value;

      applyCourierFromTracking();
      var courier = courierSelect ? courierSelect.value : '';
      if (!courier) {
        if (typeof showToast === 'function') showToast('未能识别快递公司，请手动选择物流公司', 'error');
        return;
      }

      var payload = {
        goods: selectedGoods,
        courier: courier,
        trackingNo: trackingNo
      };

      if (isEdit) {
        if (!updateShipment(orderId, editShipment.id, payload)) {
          if (typeof showToast === 'function') showToast('修改失败，包裹可能已发货', 'error');
          return;
        }
        closeOverlay('orderProxyExpressOverlay');
        if (typeof showToast === 'function') showToast('快递单已更新', 'success');
      } else {
        addShipment(orderId, payload);
        closeOverlay('orderProxyExpressOverlay');
        if (typeof showToast === 'function') showToast('快递单号上传成功', 'success');
      }
      if (typeof onSaved === 'function') onSaved();
    });

    document.body.appendChild(backdrop);
    syncBodyOverflow();
    if (trackingInput) trackingInput.focus();
  }

  function splitCsvLine(line) {
    var result = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (ch === '"') {
        if (inQuotes && line.charAt(i + 1) === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === ',' || ch === '\t') && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function normalizeGoodsText(val) {
    return String(val || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/^规格[:：]/, '')
      .toLowerCase();
  }

  function goodSpecOf(good) {
    if (!good) return '';
    return String(good.spec || good.specName || good.skuName || '').trim();
  }

  function goodBarcodeOf(good) {
    if (!good) return '';
    return String(good.barcode || good.sku || good.id || '').trim();
  }

  function goodMatchesNameSpec(good, name, spec) {
    if (!good || !name || !spec) return false;
    if (normalizeGoodsText(good.name) !== normalizeGoodsText(name)) return false;
    var gSpec = normalizeGoodsText(goodSpecOf(good));
    var tSpec = normalizeGoodsText(spec);
    if (!gSpec || !tSpec) return false;
    return gSpec === tSpec || gSpec.indexOf(tSpec) >= 0 || tSpec.indexOf(gSpec) >= 0;
  }

  function resolveOrderGoodsList(orderId) {
    if (window.OrderLiveDetail && typeof window.OrderLiveDetail.resolveDetail === 'function') {
      var detail = window.OrderLiveDetail.resolveDetail(orderId, null);
      if (detail && detail.goods && detail.goods.length) return detail.goods;
    }
    return [];
  }

  function resolveGoodByNameSpec(orderId, name, spec) {
    var goods = resolveOrderGoodsList(orderId);
    for (var i = 0; i < goods.length; i++) {
      if (goodMatchesNameSpec(goods[i], name, spec)) {
        return {
          id: goods[i].id || ('g' + (i + 1)),
          name: goods[i].name || String(name).trim(),
          spec: goodSpecOf(goods[i]) || String(spec).trim(),
          barcode: goodBarcodeOf(goods[i])
        };
      }
    }
    return {
      id: 'ns-' + normalizeGoodsText(name) + '-' + normalizeGoodsText(spec),
      name: String(name).trim(),
      spec: String(spec).trim(),
      barcode: ''
    };
  }

  function parseBatchExpressGrid(matrix) {
    var lines = [];
    (matrix || []).forEach(function (row) {
      var cols = (row || []).map(function (cell) {
        return String(cell == null ? '' : cell).replace(/^\uFEFF/, '').trim();
      });
      var hasValue = cols.some(function (cell) {
        return !!cell;
      });
      if (hasValue) lines.push(cols);
    });
    if (lines.length < 2) return { rows: [], error: '文件无有效数据行' };

    var headers = lines[0];
    var idxOrder = -1;
    var idxName = -1;
    var idxSpec = -1;
    var idxTracking = -1;
    var idxCourier = -1;
    headers.forEach(function (h, i) {
      if (/订单号|订单编号/.test(h)) idxOrder = i;
      else if (/商品信息|商品名称|商品名|品名/.test(h)) idxName = i;
      else if (/规格/.test(h)) idxSpec = i;
      else if (/物流单号|快递单号|运单号/.test(h)) idxTracking = i;
      else if (/快递公司|物流名称|物流公司/.test(h)) idxCourier = i;
    });
    if (idxOrder < 0 || idxTracking < 0) {
      if (headers.length >= 4 && idxName < 0) {
        idxOrder = 0;
        idxName = 1;
        idxSpec = 2;
        idxTracking = 3;
      } else if (headers.length >= 3) {
        idxOrder = 0;
        idxName = 1;
        idxTracking = 2;
      } else if (headers.length >= 2) {
        idxOrder = 0;
        idxTracking = 1;
      } else {
        return { rows: [], error: '表头需包含：订单号、物流单号' };
      }
    }

    var rows = [];
    for (var r = 1; r < lines.length; r++) {
      var cols = lines[r];
      var orderId = String(cols[idxOrder] || '').trim();
      var productName = idxName >= 0 ? String(cols[idxName] || '').trim() : '';
      var spec = idxSpec >= 0 ? String(cols[idxSpec] || '').trim() : '';
      var trackingNo = String(cols[idxTracking] || '').trim();
      var courier = idxCourier >= 0 ? String(cols[idxCourier] || '').trim() : '';
      if (!orderId && !productName && !spec && !trackingNo && !courier) continue;
      rows.push({
        orderId: orderId,
        productName: productName,
        spec: spec,
        trackingNo: trackingNo,
        courier: courier,
        line: r + 1
      });
    }
    return { rows: rows, error: '' };
  }

  function parseBatchExpressRows(text) {
    var lines = String(text || '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/);
    var matrix = [];
    for (var i = 0; i < lines.length; i++) {
      if (!String(lines[i] || '').trim()) continue;
      matrix.push(splitCsvLine(lines[i]));
    }
    return parseBatchExpressGrid(matrix);
  }

  function parseBatchExpressWorkbook(buffer) {
    if (!window.XLSX || typeof window.XLSX.read !== 'function') {
      return { rows: [], error: 'Excel 解析组件未加载' };
    }
    try {
      var wb = window.XLSX.read(buffer, { type: 'array', cellDates: false, raw: false });
      var sheetName = wb.SheetNames && wb.SheetNames[0];
      if (!sheetName || !wb.Sheets[sheetName]) return { rows: [], error: '文件无有效数据行' };
      var matrix = window.XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header: 1,
        raw: false,
        defval: ''
      });
      return parseBatchExpressGrid(matrix);
    } catch (err) {
      return { rows: [], error: 'Excel 文件解析失败，请检查文件格式' };
    }
  }

  function readBatchExpressFile(file, onDone) {
    var name = String((file && file.name) || '').toLowerCase();
    if (!file) {
      onDone({ rows: [], error: '请先选择文件' });
      return;
    }
    if (!/\.(csv|xlsx|xls)$/.test(name)) {
      onDone({ rows: [], error: '请上传 .xlsx、.xls 或 .csv 文件' });
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      onDone({ rows: [], error: '文件读取失败' });
    };
    if (/\.csv$/.test(name)) {
      reader.onload = function () {
        onDone(parseBatchExpressRows(String(reader.result || '')));
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }
    reader.onload = function () {
      onDone(parseBatchExpressWorkbook(reader.result));
    };
    reader.readAsArrayBuffer(file);
  }

  function findRetailOrderRow(orderId) {
    var id = String(orderId || '').trim();
    if (!id) return null;
    var rows = document.querySelectorAll('.order-live-table tbody tr[data-order-id]');
    var i;
    for (i = 0; i < rows.length; i++) {
      if ((rows[i].getAttribute('data-order-id') || '') === id) return rows[i];
    }
    for (i = 0; i < rows.length; i++) {
      var link = rows[i].querySelector('a.js-order-view');
      var text = link ? String(link.textContent || '').trim() : '';
      if (text === id) return rows[i];
    }
    return null;
  }

  function getRetailOrderMeta(orderId) {
    var row = findRetailOrderRow(orderId);
    if (!row) return null;
    var nameEl = row.querySelector('.order-product-cell__name');
    var statusEl = row.querySelector('.order-status-cell .order-tag');
    var modeEl = row.querySelector('.order-delivery-mode');
    return {
      row: row,
      orderId: row.getAttribute('data-order-id') || orderId,
      productName: nameEl ? String(nameEl.textContent || '').trim() : '',
      status: statusEl ? String(statusEl.textContent || '').trim() : '',
      deliveryMode: row.getAttribute('data-delivery-mode') || '',
      deliveryLabel: modeEl ? String(modeEl.textContent || '').trim() : ''
    };
  }

  function validateBatchExpressRow(row) {
    var orderId = String((row && row.orderId) || '').trim();
    var trackingNo = String((row && row.trackingNo) || '').trim();
    var courier = String((row && row.courier) || '').trim();
    var productName = String((row && row.productName) || '').trim();
    if (!orderId) {
      return { level: 'error', reason: '订单号不能为空' };
    }
    if (!trackingNo) {
      return { level: 'error', reason: '物流单号不能为空' };
    }
    var trackingCheck =
      window.LogisticsTrackingNo && typeof window.LogisticsTrackingNo.validate === 'function'
        ? window.LogisticsTrackingNo.validate(trackingNo)
        : { ok: true, value: trackingNo };
    if (!trackingCheck.ok) {
      return { level: 'error', reason: trackingCheck.message || '物流单号格式不正确' };
    }
    var inferred = inferCourierFromTrackingNo(trackingCheck.value);
    courier = inferred || courier;
    if (!courier) {
      return { level: 'error', reason: '未能根据物流单号识别快递公司' };
    }
    var meta = getRetailOrderMeta(orderId);
    if (!meta) {
      return {
        level: 'error',
        reason: '未找到该订单',
        trackingNo: trackingCheck.value,
        courier: courier,
        productName: productName
      };
    }
    if (!productName) productName = meta.productName;
    if (meta.deliveryMode && meta.deliveryMode !== 'express') {
      return {
        level: 'error',
        reason: '订单履约方式不是快递，无法上传快递单',
        trackingNo: trackingCheck.value,
        courier: courier,
        productName: productName,
        meta: meta
      };
    }
    if (rowHasReturnRefundAftersale(meta.row)) {
      return {
        level: 'error',
        reason: '该订单下存在申请退款中的商品，请先处理退款申请！',
        trackingNo: trackingCheck.value,
        courier: courier,
        productName: productName,
        meta: meta
      };
    }
    if (!canUploadExpressStatus(meta.status, 'retail')) {
      return {
        level: 'error',
        reason: '订单状态不允许上传',
        trackingNo: trackingCheck.value,
        courier: courier,
        productName: productName,
        meta: meta
      };
    }
    var list = getShipments(meta.orderId);
    var existing = findShipmentByTracking(list, trackingCheck.value);
    if (existing) {
      if (!row.spec || shipmentHasNameSpec(existing, productName, row.spec)) {
        return {
          level: 'warn',
          reason: '运单号已存在，将跳过不重复上传',
          trackingNo: trackingCheck.value,
          courier: courier || existing.courier || '',
          productName: productName,
          meta: meta
        };
      }
    }
    return {
      level: 'ok',
      reason: '',
      trackingNo: trackingCheck.value,
      courier: courier,
      productName: productName,
      meta: meta
    };
  }

  function decorateBatchExpressRows(rows) {
    return (rows || []).map(function (row, index) {
      var check = validateBatchExpressRow(row);
      return {
        orderId: String(row.orderId || '').trim(),
        productName: check.productName || String(row.productName || '').trim(),
        uploadedProductName: String(row.productName || '').trim(),
        spec: String(row.spec || '').trim(),
        trackingNo: check.trackingNo || String(row.trackingNo || '').trim(),
        courier: check.courier || String(row.courier || '').trim(),
        line: row.line || index + 2,
        index: index + 1,
        level: check.level,
        reason: check.reason || '',
        meta: check.meta || null
      };
    });
  }

  function findShipmentByTracking(list, trackingNo) {
    var no = String(trackingNo || '').trim();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].trackingNo || '').trim() === no) return list[i];
    }
    return null;
  }

  function shipmentHasNameSpec(shipment, name, spec) {
    var goods = getShipmentGoods(shipment);
    for (var i = 0; i < goods.length; i++) {
      if (goodMatchesNameSpec(goods[i], name, spec)) return true;
    }
    return false;
  }

  function rebuildShipmentGoodsMeta(shipment, goods) {
    shipment.goods = goods;
    shipment.goodIds = goods.map(function (g) {
      return g.id;
    });
    shipment.goodId = goods[0] ? goods[0].id : '';
    shipment.goodName = formatGoodsLabel(goods);
    return shipment;
  }

  function toBatchFailRow(row, reason) {
    return {
      orderId: String((row && row.orderId) || '').trim(),
      productName: String((row && row.productName) || '').trim(),
      courier: String((row && row.courier) || '').trim(),
      trackingNo: String((row && row.trackingNo) || '').trim(),
      reason: reason || '导入失败'
    };
  }

  function applyBatchExpressUpload(rows) {
    var added = 0;
    var merged = 0;
    var skipped = 0;
    var invalid = 0;
    var failures = [];
    var decorated = decorateBatchExpressRows(rows);

    decorated.forEach(function (row) {
      if (row.level === 'error') {
        invalid += 1;
        failures.push(toBatchFailRow(row, row.reason));
        return;
      }
      if (row.level === 'warn') {
        skipped += 1;
        return;
      }
      var orderKey = (row.meta && row.meta.orderId) || row.orderId;
      var goods = [];
      if (row.productName && row.spec) {
        goods = [resolveGoodByNameSpec(orderKey, row.productName, row.spec)];
      } else {
        goods = resolveOrderGoodsList(orderKey);
        if (!goods.length && row.productName) {
          goods = [{ id: 'ns-' + normalizeGoodsText(row.productName), name: row.productName, spec: row.spec || '' }];
        }
      }
      var list = getShipments(orderKey);
      var existing = findShipmentByTracking(list, row.trackingNo);
      if (existing) {
        if (!row.spec || shipmentHasNameSpec(existing, row.productName, row.spec)) {
          skipped += 1;
          return;
        }
        var nextGoods = getShipmentGoods(existing).slice();
        nextGoods.push(goods[0] || resolveGoodByNameSpec(orderKey, row.productName, row.spec));
        rebuildShipmentGoodsMeta(existing, nextGoods);
        saveShipments(
          orderKey,
          list.map(function (item) {
            return item.id === existing.id ? existing : item;
          })
        );
        merged += 1;
        return;
      }
      addShipment(orderKey, {
        courier: row.courier || inferCourierFromTrackingNo(row.trackingNo),
        trackingNo: row.trackingNo,
        goods: goods.length ? goods : [{ id: 'g-unknown', name: row.productName || '商品' }]
      });
      added += 1;
    });

    return {
      added: added,
      merged: merged,
      skipped: skipped,
      invalid: invalid,
      failures: failures,
      success: added + merged,
      failed: failures.length
    };
  }

  function applyBatchExpressDelete(rows) {
    var removed = 0;
    var cleared = 0;
    var skipped = 0;
    var invalid = 0;
    var notFound = 0;

    (rows || []).forEach(function (row) {
      if (!row.orderId || !row.productName || !row.spec || !row.trackingNo) {
        invalid += 1;
        return;
      }
      var list = getShipments(row.orderId);
      var existing = findShipmentByTracking(list, row.trackingNo);
      if (!existing) {
        notFound += 1;
        return;
      }
      if (!canEditShipment(existing)) {
        skipped += 1;
        return;
      }
      if (!shipmentHasNameSpec(existing, row.productName, row.spec)) {
        notFound += 1;
        return;
      }
      var nextGoods = getShipmentGoods(existing).filter(function (g) {
        return !goodMatchesNameSpec(g, row.productName, row.spec);
      });
      if (!nextGoods.length) {
        saveShipments(
          row.orderId,
          list.filter(function (item) {
            return item.id !== existing.id;
          })
        );
        cleared += 1;
        removed += 1;
        return;
      }
      rebuildShipmentGoodsMeta(existing, nextGoods);
      saveShipments(
        row.orderId,
        list.map(function (item) {
          return item.id === existing.id ? existing : item;
        })
      );
      removed += 1;
    });

    return { removed: removed, cleared: cleared, skipped: skipped, invalid: invalid, notFound: notFound };
  }

  function downloadCsvFile(filename, csv) {
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(val) {
    var text = String(val == null ? '' : val);
    if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function getBatchExpressTemplateRows() {
    return [
      ['订单号', '商品信息', '物流单号'],
      ['ORD-3212689201588561', '小龙虾', '773075059702651'],
      ['ORD-3212689201599001', '', 'SF9988776655443'],
      ['ORD-3212689201599003', '哈密瓜-自提', 'SF5116882004079'],
      ['ORD-3212689201560682', '', 'SF5116882004080']
    ];
  }

  function downloadBatchExpressTemplate() {
    var aoa = getBatchExpressTemplateRows();
    if (window.XLSX && window.XLSX.utils && typeof window.XLSX.writeFile === 'function') {
      var wb = window.XLSX.utils.book_new();
      var ws = window.XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }];
      window.XLSX.utils.book_append_sheet(wb, ws, '批量上传快递单');
      window.XLSX.writeFile(wb, '批量上传快递单模板.xlsx');
      return;
    }
    var csv = '\uFEFF' + aoa.map(function (row) {
      return row.map(csvCell).join(',');
    }).join('\n') + '\n';
    downloadCsvFile('批量上传快递单模板.csv', csv);
  }

  function downloadBatchExpressFailDetails(failures) {
    var csv = '\uFEFF订单号,商品名称,物流名称,物流单号,失败原因\n';
    (failures || []).forEach(function (row) {
      csv +=
        [
          csvCell(row.orderId),
          csvCell(row.productName),
          csvCell(row.courier),
          csvCell(row.trackingNo),
          csvCell(row.reason)
        ].join(',') + '\n';
    });
    var stamp = new Date();
    function p(n) {
      return String(n).padStart(2, '0');
    }
    var name =
      '批量上传快递单_失败详情_' +
      stamp.getFullYear() +
      p(stamp.getMonth() + 1) +
      p(stamp.getDate()) +
      p(stamp.getHours()) +
      p(stamp.getMinutes()) +
      p(stamp.getSeconds()) +
      '.csv';
    downloadCsvFile(name, csv);
  }

  function downloadBatchExpressDeleteTemplate() {
    var csv =
      '\uFEFF订单号,商品名称,规格,物流单号\n' +
      'ORD-3212689201599003,进口香蕉 香甜软糯 3斤装,规格：3斤,773088899900011\n' +
      'ORD-3212689201588561,微辣萝卜干 500g 4号…,规格：500g,773075059702651\n';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '批量删除快递单模板.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openBatchDeleteModal(opts) {
    var hint =
      opts.hint ||
      '通过 Excel / CSV 批量删除快递单。请先下载模板，按「订单号、商品名称、规格、物流单号」填写：一商品一行。同一物流含多商品时，删除其中一条仅从该物流中移除对应商品；若移除后无商品则删除整条物流。';

    closeOverlay('orderProxyBatchUploadBackdrop');
    var backdrop = el('div', 'order-proxy-express-overlay');
    backdrop.id = 'orderProxyBatchUploadBackdrop';
    backdrop.innerHTML =
      '<div class="order-proxy-upload-modal order-proxy-batch-upload-modal" role="dialog" aria-labelledby="orderProxyBatchUploadTitle">' +
        '<div class="order-proxy-upload-modal__head">' +
          '<h3 id="orderProxyBatchUploadTitle" class="order-proxy-upload-modal__title">批量删除快递单</h3>' +
          '<button type="button" class="order-proxy-upload-modal__close js-batch-express-close" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__body">' +
          '<p class="order-proxy-upload-modal__hint">' + escapeHtml(hint) + '</p>' +
          '<div class="order-proxy-batch-upload__template">' +
            '<button type="button" class="order-proxy-upload-field__link js-batch-express-template">下载删除模板</button>' +
          '</div>' +
          '<div class="order-proxy-upload-field">' +
            '<label class="order-proxy-upload-field__label" for="orderProxyBatchFile">上传文件</label>' +
            '<div class="order-proxy-batch-upload__file-row">' +
              '<input type="file" id="orderProxyBatchFile" class="order-proxy-batch-upload__file" accept=".csv,text/csv">' +
              '<span class="order-proxy-batch-upload__file-name js-batch-express-file-name">未选择文件</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__foot">' +
          '<button type="button" class="order-filter-btn order-filter-btn--default js-batch-express-close">取消</button>' +
          '<button type="button" class="order-filter-btn order-filter-btn--primary js-batch-express-submit">确认删除</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);
    syncBodyOverflow();

    var fileInput = backdrop.querySelector('#orderProxyBatchFile');
    var fileNameEl = backdrop.querySelector('.js-batch-express-file-name');
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeOverlay('orderProxyBatchUploadBackdrop');
    });
    backdrop.querySelectorAll('.js-batch-express-close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeOverlay('orderProxyBatchUploadBackdrop');
      });
    });
    backdrop.querySelector('.js-batch-express-template').addEventListener('click', function () {
      downloadBatchExpressDeleteTemplate();
      if (typeof showToast === 'function') showToast('模板已下载', 'success');
    });
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (fileNameEl) fileNameEl.textContent = file ? file.name : '未选择文件';
      });
    }
    backdrop.querySelector('.js-batch-express-submit').addEventListener('click', function () {
      var file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) {
        if (typeof showToast === 'function') showToast('请先选择 CSV 文件', 'error');
        return;
      }
      if (!/\.csv$/i.test(file.name || '')) {
        if (typeof showToast === 'function') showToast('请上传 CSV 文件（可用 Excel 另存为）', 'error');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = parseBatchExpressRows(String(reader.result || ''));
        if (parsed.error) {
          if (typeof showToast === 'function') showToast(parsed.error, 'error');
          return;
        }
        if (!parsed.rows.length) {
          if (typeof showToast === 'function') showToast('文件中没有可处理的数据', 'error');
          return;
        }
        closeOverlay('orderProxyBatchUploadBackdrop');
        var delResult = applyBatchExpressDelete(parsed.rows);
        if (typeof showToast === 'function') {
          showToast(
            '删除完成：移除 ' +
              delResult.removed +
              ' 条商品（其中清空物流 ' +
              delResult.cleared +
              '），跳过 ' +
              delResult.skipped +
              '，未匹配 ' +
              delResult.notFound +
              (delResult.invalid ? '，无效 ' + delResult.invalid : ''),
            'success'
          );
        }
        if (typeof opts.onSuccess === 'function') opts.onSuccess(file, delResult);
      };
      reader.onerror = function () {
        if (typeof showToast === 'function') showToast('文件读取失败', 'error');
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  function wizardStepHtml(current) {
    function item(step, label) {
      var cls = 'order-batch-wizard__step';
      if (current > step) cls += ' is-done';
      else if (current === step) cls += ' is-current';
      return (
        '<span class="' + cls + '">' +
          '<span class="order-batch-wizard__dot"></span>' +
          '<svg class="order-batch-wizard__check" viewBox="0 0 16 16" aria-hidden="true">' +
            '<circle cx="8" cy="8" r="8" fill="#67c23a"></circle>' +
            '<path d="M4.6 8.2l2.1 2.1 4.7-4.7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>' +
          '</svg>' +
          '<span>' + label + '</span>' +
        '</span>'
      );
    }
    return (
      '<div class="order-batch-wizard__steps">' +
        item(1, '上传文件') +
        '<span class="order-batch-wizard__chevron">›</span>' +
        item(2, '数据预览') +
        '<span class="order-batch-wizard__chevron">›</span>' +
        item(3, '导入结果') +
      '</div>'
    );
  }

  function openBatchUploadWizard(opts) {
    var hint =
      opts.hint ||
      '通过 Excel / CSV 批量上传快递单号。请先下载模板，按「订单号、商品信息、物流单号」填写后上传，商品信息非必填。上传成功即触发发货，同一订单可分多次上传以补充多个包裹（运单号自动去重）。';
    var state = {
      step: 1,
      file: null,
      previewRows: [],
      onlyError: false,
      result: null
    };

    closeOverlay('orderProxyBatchUploadBackdrop');
    var backdrop = el('div', 'order-proxy-express-overlay');
    backdrop.id = 'orderProxyBatchUploadBackdrop';
    document.body.appendChild(backdrop);
    syncBodyOverflow();

    function closeWizard() {
      closeOverlay('orderProxyBatchUploadBackdrop');
    }

    function countPreview(rows) {
      var total = rows.length;
      var err = 0;
      var warn = 0;
      rows.forEach(function (row) {
        if (row.level === 'error') err += 1;
        else if (row.level === 'warn') warn += 1;
      });
      return { total: total, valid: total - err, error: err, warn: warn };
    }

    function renderPreviewTable(rows) {
      var list = state.onlyError ? rows.filter(function (row) { return row.level === 'error'; }) : rows;
      if (!list.length) {
        return '<div class="order-batch-wizard__table-wrap"><table class="order-batch-wizard__table"><tbody><tr><td>没有可展示的数据</td></tr></tbody></table></div>';
      }
      var html =
        '<div class="order-batch-wizard__table-wrap"><table class="order-batch-wizard__table">' +
        '<thead><tr><th>#</th><th>订单号</th><th>商品信息</th><th>物流单号</th><th>快递公司</th><th>校验</th></tr></thead><tbody>';
      list.forEach(function (row) {
        var trCls = row.level === 'error' ? ' is-error' : row.level === 'warn' ? ' is-warn' : '';
        var mark = row.level === 'error' ? row.reason : row.level === 'warn' ? row.reason : '有效';
        html +=
          '<tr class="' + trCls + '">' +
            '<td>' + row.index + '</td>' +
            '<td>' + escapeHtml(row.orderId) + '</td>' +
            '<td>' + escapeHtml(row.uploadedProductName || '') + '</td>' +
            '<td>' + escapeHtml(row.trackingNo) + '</td>' +
            '<td>' + escapeHtml(row.courier) + '</td>' +
            '<td>' + escapeHtml(mark) + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    }

    function renderFailTable(failures) {
      if (!failures || !failures.length) return '';
      var html =
        '<div class="order-batch-wizard__table-wrap"><table class="order-batch-wizard__table">' +
        '<thead><tr><th>订单号</th><th>商品名称</th><th>物流名称</th><th>物流单号</th><th>失败原因</th></tr></thead><tbody>';
      failures.forEach(function (row) {
        html +=
          '<tr>' +
            '<td>' + escapeHtml(row.orderId) + '</td>' +
            '<td>' + escapeHtml(row.productName) + '</td>' +
            '<td>' + escapeHtml(row.courier) + '</td>' +
            '<td>' + escapeHtml(row.trackingNo) + '</td>' +
            '<td>' + escapeHtml(row.reason) + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    }

    function render() {
      var body = '';
      var foot = '';
      if (state.step === 1) {
        body =
          wizardStepHtml(1) +
          '<div class="order-batch-wizard__drop js-batch-drop">' +
            '<svg class="order-batch-wizard__drop-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
              '<path d="M8 30v6a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
              '<path d="M24 8v24M16 16l8-8 8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            '<p class="order-batch-wizard__drop-title">将文件拖到此处，或点击上传</p>' +
            '<p class="order-batch-wizard__drop-sub">支持 .xlsx、.xls、.csv 格式</p>' +
            (state.file ? '<p class="order-batch-wizard__drop-name">' + escapeHtml(state.file.name) + '</p>' : '') +
            '<input type="file" id="orderProxyBatchFile" accept=".csv,.xlsx,.xls,text/csv" hidden>' +
          '</div>' +
          '<button type="button" class="order-batch-wizard__tpl js-batch-express-template">下载导入模板</button>';
        foot =
          '<div class="order-proxy-upload-modal__foot">' +
            '<button type="button" class="order-filter-btn order-filter-btn--default js-batch-express-close">取消</button>' +
          '</div>';
      } else if (state.step === 2) {
        var stats = countPreview(state.previewRows);
        body =
          wizardStepHtml(2) +
          '<div class="order-batch-wizard__stats">' +
            '<span>总计 <strong>' + stats.total + '</strong></span>' +
            '<span class="order-batch-wizard__stat--ok">有效 <strong>' + stats.valid + '</strong></span>' +
            '<span class="order-batch-wizard__stat--err">错误 <strong>' + stats.error + '</strong></span>' +
            '<span class="order-batch-wizard__stat--warn">警告 <strong>' + stats.warn + '</strong></span>' +
          '</div>' +
          '<div class="order-batch-wizard__toolbar">' +
            '<span class="order-batch-wizard__toggle' + (state.onlyError ? ' is-on' : '') + ' js-batch-only-error">' +
              '<span class="order-batch-wizard__switch"></span>仅显示错误行' +
            '</span>' +
          '</div>' +
          renderPreviewTable(state.previewRows);
        foot =
          '<div class="order-proxy-upload-modal__foot is-split">' +
            '<button type="button" class="order-filter-btn order-filter-btn--default js-batch-express-close">取消</button>' +
            '<div class="order-proxy-upload-modal__foot-right">' +
              '<button type="button" class="order-filter-btn order-filter-btn--default js-batch-prev">上一步</button>' +
              '<button type="button" class="order-filter-btn order-filter-btn--primary js-batch-submit">提交导入</button>' +
            '</div>' +
          '</div>';
      } else {
        var result = state.result || { success: 0, failed: 0, failures: [] };
        var total = result.success + result.failed;
        var allOk = result.failed === 0;
        body =
          wizardStepHtml(3) +
          '<div class="order-batch-wizard__result">' +
            '<div class="order-batch-wizard__result-icon' + (allOk ? ' is-ok' : '') + '">' +
              (allOk ? '✓' : '!') +
            '</div>' +
            '<p class="order-batch-wizard__result-title">成功导入 ' + result.success + '，导入失败 ' + result.failed + '</p>' +
          '</div>' +
          (result.failed
            ? '<div class="order-batch-wizard__result-head">' +
                '<div class="order-batch-wizard__stats">' +
                  '<span>' + total + '总计</span>' +
                  '<span class="order-batch-wizard__stat--ok">' + result.success + '成功导入</span>' +
                  '<span class="order-batch-wizard__stat--err">' + result.failed + '导入失败</span>' +
                '</div>' +
              '</div>' +
              renderFailTable(result.failures)
            : '');
        foot =
          '<div class="order-proxy-upload-modal__foot">' +
            (result.failed
              ? '<button type="button" class="order-filter-btn order-filter-btn--outline js-batch-download-fail">下载失败详情</button>'
              : '') +
            '<button type="button" class="order-filter-btn order-filter-btn--default js-batch-reimport">重新导入</button>' +
            '<button type="button" class="order-filter-btn order-filter-btn--primary js-batch-done">完成</button>' +
          '</div>';
      }

      backdrop.innerHTML =
        '<div class="order-proxy-upload-modal order-proxy-batch-wizard" role="dialog" aria-labelledby="orderProxyBatchUploadTitle">' +
          '<div class="order-proxy-upload-modal__head">' +
            '<h3 id="orderProxyBatchUploadTitle" class="order-proxy-upload-modal__title">批量上传快递单</h3>' +
            '<button type="button" class="order-proxy-upload-modal__close js-batch-express-close" aria-label="关闭">×</button>' +
          '</div>' +
          '<div class="order-proxy-upload-modal__body">' +
            '<p class="order-proxy-upload-modal__hint">' + escapeHtml(hint) + '</p>' +
            body +
          '</div>' +
          foot +
        '</div>';

      bind();
    }

    function goPreviewFromFile(file) {
      readBatchExpressFile(file, function (parsed) {
        if (parsed.error) {
          if (typeof showToast === 'function') showToast(parsed.error, 'error');
          return;
        }
        if (!parsed.rows.length) {
          if (typeof showToast === 'function') showToast('文件中没有可处理的数据', 'error');
          return;
        }
        state.file = file;
        state.previewRows = decorateBatchExpressRows(parsed.rows);
        state.onlyError = false;
        state.step = 2;
        render();
      });
    }

    function bind() {
      backdrop.querySelectorAll('.js-batch-express-close').forEach(function (btn) {
        btn.addEventListener('click', closeWizard);
      });
      var drop = backdrop.querySelector('.js-batch-drop');
      var fileInput = backdrop.querySelector('#orderProxyBatchFile');
      if (drop && fileInput) {
        drop.addEventListener('click', function (e) {
          if (e.target === fileInput) return;
          fileInput.value = '';
          fileInput.click();
        });
        drop.addEventListener('dragover', function (e) {
          e.preventDefault();
          drop.classList.add('is-dragover');
        });
        drop.addEventListener('dragleave', function () {
          drop.classList.remove('is-dragover');
        });
        drop.addEventListener('drop', function (e) {
          e.preventDefault();
          drop.classList.remove('is-dragover');
          var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          if (file) goPreviewFromFile(file);
        });
        fileInput.addEventListener('change', function () {
          var file = fileInput.files && fileInput.files[0];
          if (file) goPreviewFromFile(file);
        });
      }
      var tplBtn = backdrop.querySelector('.js-batch-express-template');
      if (tplBtn) {
        tplBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          downloadBatchExpressTemplate();
          if (typeof showToast === 'function') showToast('模板已下载', 'success');
        });
      }
      var onlyError = backdrop.querySelector('.js-batch-only-error');
      if (onlyError) {
        onlyError.addEventListener('click', function () {
          state.onlyError = !state.onlyError;
          render();
        });
      }
      var prevBtn = backdrop.querySelector('.js-batch-prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          state.step = 1;
          render();
        });
      }
      var submitBtn = backdrop.querySelector('.js-batch-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          var upResult = applyBatchExpressUpload(state.previewRows);
          state.result = upResult;
          state.step = 3;
          render();
          if (typeof opts.onSuccess === 'function') opts.onSuccess(state.file, upResult);
        });
      }
      var downloadBtn = backdrop.querySelector('.js-batch-download-fail');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
          downloadBatchExpressFailDetails((state.result && state.result.failures) || []);
          if (typeof showToast === 'function') showToast('失败详情已下载', 'success');
        });
      }
      var reimportBtn = backdrop.querySelector('.js-batch-reimport');
      if (reimportBtn) {
        reimportBtn.addEventListener('click', function () {
          state.step = 1;
          state.file = null;
          state.previewRows = [];
          state.result = null;
          state.onlyError = false;
          render();
        });
      }
      var doneBtn = backdrop.querySelector('.js-batch-done');
      if (doneBtn) {
        doneBtn.addEventListener('click', closeWizard);
      }
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeWizard();
    });
    render();
  }

  function openBatchUploadModal(options) {
    var opts = options || {};
    if (opts.mode === 'delete') openBatchDeleteModal(opts);
    else openBatchUploadWizard(opts);
  }

  window.OrderProxyExpress = {
    getFulfillmentMode: getFulfillmentMode,
    fulfillmentLabel: fulfillmentLabel,
    getShipments: getShipments,
    canEditShipment: canEditShipment,
    canUploadExpressStatus: canUploadExpressStatus,
    buildDeliveryCard: buildDeliveryCard,
    openUploadModal: openUploadModal,
    openTrackingModal: openTrackingModal,
    openBatchUploadModal: openBatchUploadModal,
    downloadBatchExpressTemplate: downloadBatchExpressTemplate,
    downloadBatchExpressDeleteTemplate: downloadBatchExpressDeleteTemplate,
    applyBatchExpressUpload: applyBatchExpressUpload,
    applyBatchExpressDelete: applyBatchExpressDelete,
    closeOverlay: closeOverlay,
    closeTrackingDrawer: closeTrackingDrawer
  };
})();
