(function () {
  var STORAGE_KEY = 'mdm_proxy_order_shipments_v1';

  var COURIERS = ['申通快递', '顺丰速运', '圆通速递', '韵达快递', '京东物流', '中通快递'];

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
        { id: 'g1', name: '新鲜红颜草莓 香甜多汁 500g装' },
        { id: 'g2', name: '进口香蕉 香甜软糯 3斤装' }
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
        return { id: g.id, name: g.name };
      });
    }
    if (shipment.goodName) {
      return [{ id: shipment.goodId || 'g1', name: shipment.goodName }];
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
          '<dt>发货单流水号</dt><dd>' + escapeHtml(shipment.serialNo) + '</dd>' +
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

  function canUploadExpressStatus(status, context) {
    // 代采快递由采购单回传，订单侧不再上传；仅零售快递可上传
    if (context === 'retail') {
      if (!status) return false;
      return status !== '已完成' && status !== '已关闭' && status !== '已取消';
    }
    return false;
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
        '<dt>所属门店</dt><dd>' + escapeHtml(detail.delivery.store) + '</dd>';
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

      if (allowManage && canUploadExpressStatus(orderStatus, 'retail')) {
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
            '<input class="order-proxy-upload-field__input" id="proxyUploadTrackingNo" type="text" placeholder="请输入物流单号，将自动识别快递公司" maxlength="32" value="' +
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

      var trackingNo = trackingInput ? trackingInput.value.trim() : '';
      if (!trackingNo) {
        if (typeof showToast === 'function') showToast('请输入物流单号', 'error');
        return;
      }

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

  function downloadBatchExpressTemplate() {
    var csv =
      '\uFEFF订单号,物流单号,快递公司\n' +
      'ORD-3212689201588561,773075059702651,申通快递\n' +
      'ORD-3212689201599001,SF1234567890123,顺丰速运\n' +
      'ORD-3212689201599003,773088899900011,申通快递\n';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '批量上传快递单模板.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openBatchUploadModal(options) {
    var opts = options || {};
    var hint = opts.hint ||
      '通过 Excel / CSV 批量上传快递单号。请先下载模板，按「订单号、物流单号、快递公司」填写后上传。';

    closeOverlay('orderProxyBatchUploadBackdrop');
    var backdrop = el('div', 'order-proxy-express-overlay');
    backdrop.id = 'orderProxyBatchUploadBackdrop';
    backdrop.innerHTML =
      '<div class="order-proxy-upload-modal order-proxy-batch-upload-modal" role="dialog" aria-labelledby="orderProxyBatchUploadTitle">' +
        '<div class="order-proxy-upload-modal__head">' +
          '<h3 id="orderProxyBatchUploadTitle" class="order-proxy-upload-modal__title">批量上传快递单</h3>' +
          '<button type="button" class="order-proxy-upload-modal__close js-batch-express-close" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__body">' +
          '<p class="order-proxy-upload-modal__hint">' + escapeHtml(hint) + '</p>' +
          '<div class="order-proxy-batch-upload__template">' +
            '<button type="button" class="order-proxy-upload-field__link js-batch-express-template">下载导入模板</button>' +
          '</div>' +
          '<div class="order-proxy-upload-field">' +
            '<label class="order-proxy-upload-field__label" for="orderProxyBatchFile">上传文件</label>' +
            '<div class="order-proxy-batch-upload__file-row">' +
              '<input type="file" id="orderProxyBatchFile" class="order-proxy-batch-upload__file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv">' +
              '<span class="order-proxy-batch-upload__file-name js-batch-express-file-name">未选择文件</span>' +
            '</div>' +
            '<p class="order-proxy-upload-field__auto-hint">支持 .xlsx / .xls / .csv，单次建议不超过 1000 条</p>' +
          '</div>' +
        '</div>' +
        '<div class="order-proxy-upload-modal__foot">' +
          '<button type="button" class="order-detail-btn js-batch-express-close">取消</button>' +
          '<button type="button" class="order-detail-btn order-detail-btn--primary js-batch-express-submit">确认上传</button>' +
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
      downloadBatchExpressTemplate();
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
        if (typeof showToast === 'function') showToast('请先选择 Excel 文件', 'error');
        return;
      }
      var name = String(file.name || '').toLowerCase();
      if (!/\.(xlsx|xls|csv)$/.test(name)) {
        if (typeof showToast === 'function') showToast('请上传 .xlsx / .xls / .csv 文件', 'error');
        return;
      }
      closeOverlay('orderProxyBatchUploadBackdrop');
      if (typeof showToast === 'function') {
        showToast('已解析「' + file.name + '」并完成快递单号批量上传（演示）', 'success');
      }
      if (typeof opts.onSuccess === 'function') opts.onSuccess(file);
    });
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
    closeOverlay: closeOverlay,
    closeTrackingDrawer: closeTrackingDrawer
  };
})();
