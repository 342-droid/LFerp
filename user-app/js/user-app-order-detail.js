(function () {
  var STATUS_CONFIG = {
    unpaid: {
      title: '等待买家付款',
      sub: '逾期未支付订单将自动关闭',
      showLogistics: false,
      showPoints: true,
      showPayMethod: false,
      itemActions: 'none',
      footer: [
        { label: '取消订单', type: 'ghost', action: 'cancel' },
        { label: '立即付款', type: 'primary', action: 'pay' }
      ]
    },
    shipping: {
      title: '待发货',
      sub: '买家已付款，商家正在备货',
      showLogistics: false,
      showPoints: false,
      showPayMethod: true,
      itemActions: 'refund',
      footer: []
    },
    receipt: {
      title: '商家已发货',
      sub: '还剩14天23小时自动确认收货',
      showLogistics: false,
      showStoreDelivery: true,
      showPoints: false,
      showPayMethod: true,
      itemActions: 'refund',
      footer: [{ label: '确认收货', type: 'primary', action: 'confirm', single: true }]
    },
    completed: {
      title: '交易完成',
      sub: '',
      showLogistics: false,
      showPoints: false,
      showPayMethod: true,
      itemActions: 'aftersale',
      footer: [
        { label: '删除订单', type: 'ghost', action: 'delete' },
        { label: '加入购物车', type: 'primary', action: 'cart' }
      ]
    },
    closed: {
      title: '订单已关闭',
      sub: '订单已取消，欢迎下次光临',
      showLogistics: false,
      showPoints: false,
      showPayMethod: false,
      itemActions: 'none',
      footer: [
        { label: '删除订单', type: 'ghost', action: 'delete' },
        { label: '重新购买', type: 'primary', action: 'rebuy' }
      ]
    }
  };

  var CLOSED_REASONS = {
    cancel: {
      sub: '订单已取消，欢迎下次光临'
    },
    timeout: {
      sub: '超时未支付，订单已自动关闭'
    },
    refund: {
      sub: '订单已全额退款'
    }
  };

  var RESTOCK_STATUS_OVERRIDES = {
    unpaid: {
      title: '等待付款',
      sub: '逾期未支付订单将自动关闭',
      showStoreDelivery: false
    },
    shipping: {
      title: '待发货',
      sub: '供应商正在备货，将配送到门店',
      showStoreDelivery: false
    },
    receipt: {
      title: '配送到门店',
      sub: '还剩14天23小时自动确认收货',
      showStoreDelivery: true,
      footer: [{ label: '确认收货', type: 'primary', action: 'confirm', single: true }]
    },
    completed: {
      title: '交易完成',
      sub: '商品已送达门店',
      showStoreDelivery: false
    },
    closed: {
      title: '订单已关闭',
      showStoreDelivery: false
    }
  };

  var INVOICE_TYPES = {
    company: '公司',
    sole: '个体工商户'
  };

  function getInvoiceTypeLabel() {
    var key = (getParams().get('invoice') || 'company').trim();
    return INVOICE_TYPES[key] || INVOICE_TYPES.company;
  }

  function applyInvoiceType() {
    var invoiceTypeEl = document.getElementById('orderInvoiceType');
    if (invoiceTypeEl) invoiceTypeEl.textContent = getInvoiceTypeLabel();
  }

  function getClosedReason() {
    var reason = (getParams().get('reason') || 'cancel').trim();
    return CLOSED_REASONS[reason] ? reason : 'cancel';
  }

  function applyClosedReason(config) {
    if (getStatus() !== 'closed') return config;
    var reasonCfg = CLOSED_REASONS[getClosedReason()];
    if (reasonCfg && reasonCfg.sub) {
      config = Object.assign({}, config, { sub: reasonCfg.sub });
    }
    return config;
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getDeliveryType() {
    var delivery = (getParams().get('delivery') || '').trim();
    if (delivery === 'store' || delivery === 'warehouse') return delivery;
    return 'warehouse';
  }

  function isStoreDirectDelivery() {
    return getDeliveryType() === 'store';
  }

  /* 用户 APP 快递单：供应商直发到家（delivery=store）；补货场景仍为快递到店 */
  function isUserAppExpressHome() {
    return !isFromRestock() && isStoreDirectDelivery();
  }

  var DEMO_HOME_ADDRESS = {
    name: '武者',
    phone: '181****4215',
    text: '四川省成都市武侯区天府大道中段666号天府软件园A区'
  };

  function buildLogisticsHref(pkgIndex) {
    var params = getParams();
    var href = 'order-logistics.html?';
    var qs = [];
    if (params.get('from')) qs.push('from=' + encodeURIComponent(params.get('from')));
    qs.push('status=' + encodeURIComponent(getStatus()));
    if (params.get('supplier')) qs.push('supplier=' + encodeURIComponent(params.get('supplier')));
    if (params.get('delivery')) qs.push('delivery=' + encodeURIComponent(params.get('delivery')));
    if (params.get('cutoff')) qs.push('cutoff=' + encodeURIComponent(params.get('cutoff')));
    if (params.get('reason')) qs.push('reason=' + encodeURIComponent(params.get('reason')));
    if (pkgIndex != null) qs.push('pkg=' + encodeURIComponent(String(pkgIndex)));
    return href + qs.join('&');
  }

  var DEMO_EXPRESS_PACKAGES = [
    {
      status: '运输中',
      courier: '申通快递',
      trackingNo: '773075059702651',
      text: '【杭州市】快件已到达 杭州萧山转运中心'
    },
    {
      status: '派送中',
      courier: '中通快递',
      trackingNo: '788012345678901',
      text: '【杭州市】快件正在派送中，派送员：李师傅'
    }
  ];

  function getReceiptPackages() {
    var pkgs = getParams().get('pkgs');
    if (pkgs === '1') return DEMO_EXPRESS_PACKAGES.slice(0, 1);
    return DEMO_EXPRESS_PACKAGES;
  }

  function applyPendingLogisticsCard(status) {
    var pendingCard = document.getElementById('orderLogisticsPendingCard');
    if (!pendingCard) return;
    var show = isFromRestock() && status === 'shipping';
    pendingCard.hidden = !show;
  }

  function renderReceiptLogisticsTrack(status) {
    var wrap = document.getElementById('orderLogisticsTrackWrap');
    var scroll = document.getElementById('orderLogisticsTrackScroll');
    var dots = document.getElementById('orderLogisticsTrackDots');
    if (!wrap || !scroll) return;

    /* 仅快递配送到店展示物流；配送到门店不展示物流信息 */
    var show = isFromRestock() && status === 'receipt' && isStoreDirectDelivery();

    wrap.hidden = !show;
    if (!show) {
      scroll.innerHTML = '';
      if (dots) {
        dots.innerHTML = '';
        dots.hidden = true;
      }
      return;
    }

    var packages = getReceiptPackages();
    var chevron =
      '<svg class="ua-od-logistics__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

    scroll.innerHTML = packages
      .map(function (pkg, idx) {
        return (
          '<button type="button" class="ua-od-logistics-track__card" data-pkg-index="' +
          idx +
          '">' +
          '<span class="ua-od-logistics__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="8" width="13" height="9" rx="1"/><path d="M15 10h4l3 4v3h-7V10z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>' +
          '</span>' +
          '<div class="ua-od-logistics-track__body">' +
          '<div class="ua-od-logistics-track__head">' +
          '<span class="ua-od-logistics-track__status">' +
          pkg.status +
          '</span></div>' +
          '<div class="ua-od-logistics-track__courier">' +
          pkg.courier +
          ' ' +
          pkg.trackingNo +
          '</div>' +
          '<div class="ua-od-logistics-track__text">' +
          pkg.text +
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
              '<span class="ua-od-logistics-track__dot' +
              (idx === 0 ? ' is-active' : '') +
              '" data-dot-index="' +
              idx +
              '"></span>'
            );
          })
          .join('');
      } else {
        dots.hidden = true;
        dots.innerHTML = '';
      }
    }

    var expressCard = document.getElementById('orderExpressCard');
    if (expressCard) expressCard.hidden = true;
  }

  function applyStoreExpressCard(status) {
    var expressCard = document.getElementById('orderExpressCard');
    var logisticsBtn = document.getElementById('orderExpressLogisticsBtn');
    if (!expressCard) return;

    /* 进货场景改用横向物流卡；用户 APP 快递到家保留物流单卡 */
    var showExpress =
      !isFromRestock() && status === 'receipt' && isStoreDirectDelivery();
    expressCard.hidden = !showExpress;

    if (showExpress) {
      var statusEl = document.getElementById('orderExpressStatus');
      var textEl = document.getElementById('orderExpressText');
      if (statusEl) statusEl.textContent = '派送中';
      if (textEl) {
        textEl.textContent =
          '【杭州市】快件正在派送中，派送员：李师傅，请保持电话畅通';
      }
      if (logisticsBtn) logisticsBtn.setAttribute('href', buildLogisticsHref(0));
    }
  }

  /* 用户 APP 快递到家：顶部家庭收货地址；隐藏配送门店 / 配送到店卡片 */
  function applyUserAppExpressLayout(status, config) {
    var addressCard = document.getElementById('orderAddressCard');
    var storeCard = document.getElementById('orderStoreCard');
    var addrEdit = document.getElementById('orderAddrEdit');
    var isExpressHome = isUserAppExpressHome();

    if (addressCard) {
      addressCard.hidden = !isExpressHome;
      if (isExpressHome) {
        var nameEl = document.getElementById('orderAddrName');
        var phoneEl = document.getElementById('orderAddrPhone');
        var textEl = document.getElementById('orderAddrText');
        if (nameEl) nameEl.textContent = DEMO_HOME_ADDRESS.name;
        if (phoneEl) phoneEl.textContent = DEMO_HOME_ADDRESS.phone;
        if (textEl) textEl.textContent = DEMO_HOME_ADDRESS.text;
      }
    }

    if (storeCard) {
      /* 快递到家不展示门店；配送/补货仍展示配送门店 */
      storeCard.hidden = isExpressHome;
    }

    if (addrEdit) {
      addrEdit.hidden = !(isExpressHome && status === 'unpaid');
    }

    if (!isExpressHome) return config;

    config = Object.assign({}, config);
    config.showStoreDelivery = false;
    if (status === 'receipt') {
      config.title = '商家已发货';
      config.sub = '快递配送到家，还剩14天23小时自动确认收货';
    } else if (status === 'shipping') {
      config.sub = '供应商正在备货，将快递配送到家';
    }

    return config;
  }

  function applyDeliveryMode(status, config) {
    if (!isFromRestock() || status !== 'receipt') return config;

    config = Object.assign({}, config);

    if (isStoreDirectDelivery()) {
      config.showStoreDelivery = false;
      config.title = '快递配送到店';
      config.sub = '还剩14天23小时自动确认收货';
    } else {
      config.showStoreDelivery = true;
      config.title = '配送到门店';
      config.sub = '还剩14天23小时自动确认收货';
    }

    return config;
  }

  function isFromRestock() {
    return getParams().get('from') === 'restock.html';
  }

  function getStatus() {
    /* 有演示订单号时，以本地订单存储状态为准，避免列表已支付详情仍显示待付款 */
    var orderNo = getParams().get('orderNo');
    if (orderNo && window.UaOrdersStore && window.UaOrdersStore.getByNo) {
      var order = window.UaOrdersStore.getByNo(orderNo);
      if (order && order.status && STATUS_CONFIG[order.status]) {
        return order.status;
      }
    }
    var status = (getParams().get('status') || 'unpaid').trim();
    return STATUS_CONFIG[status] ? status : 'unpaid';
  }

  function isPlatformCutoffPassed() {
    var cutoff = (getParams().get('cutoff') || 'before').trim();
    return cutoff === 'after';
  }

  function applyShippingFooter(status, config) {
    if (status !== 'shipping') return config;
    config = Object.assign({}, config);
    if (!isPlatformCutoffPassed()) {
      config.footer = [{ label: '取消订单', type: 'ghost', action: 'cancel', single: true }];
    } else {
      config.footer = [];
    }
    return config;
  }

  function buildRefundQuery(itemIndex) {
    var p = getParams();
    var qs = [];
    qs.push('status=' + encodeURIComponent(getStatus()));
    if (p.get('from')) qs.push('from=' + encodeURIComponent(p.get('from')));
    if (p.get('supplier')) qs.push('supplier=' + encodeURIComponent(p.get('supplier')));
    if (p.get('delivery')) qs.push('delivery=' + encodeURIComponent(p.get('delivery')));
    if (p.get('cutoff')) qs.push('cutoff=' + encodeURIComponent(p.get('cutoff')));
    if (p.get('reason')) qs.push('reason=' + encodeURIComponent(p.get('reason')));
    if (p.get('orderNo')) qs.push('orderNo=' + encodeURIComponent(p.get('orderNo')));
    if (p.get('pointsItem')) qs.push('pointsItem=' + encodeURIComponent(p.get('pointsItem')));
    qs.push('item=' + encodeURIComponent(String(itemIndex == null ? 0 : itemIndex)));
    return qs.join('&');
  }

  function getRefundScene() {
    var status = getStatus();
    if (status === 'shipping') return 'pre_ship';
    if (status === 'completed') return 'aftersale';
    return 'post_ship';
  }

  function buildPreShipHref(itemIndex) {
    return 'order-refund-pre-ship.html?' + buildRefundQuery(itemIndex);
  }

  function buildItemRefundHref(itemIndex) {
    var scene = getRefundScene();
    if (scene === 'pre_ship') {
      return buildPreShipHref(itemIndex);
    }
    var query = buildRefundQuery(itemIndex);
    return 'order-refund-select.html?scene=' + encodeURIComponent(scene) + '&' + query;
  }

  function openCancelModal() {
    var modal = document.getElementById('orderCancelModal');
    if (modal) modal.hidden = false;
  }

  function closeCancelModal() {
    var modal = document.getElementById('orderCancelModal');
    if (modal) modal.hidden = true;
  }

  function confirmCancelOrder() {
    closeCancelModal();
    var p = getParams();
    var orderNo = p.get('orderNo');
    if (orderNo && window.UaOrdersStore) {
      window.UaOrdersStore.updateStatus(orderNo, 'closed', { closedReason: 'cancel' });
    }
    var href =
      'order-detail.html?status=closed&reason=cancel' +
      (orderNo ? '&orderNo=' + encodeURIComponent(orderNo) : '') +
      (p.get('pointsItem') ? '&pointsItem=' + encodeURIComponent(p.get('pointsItem')) : '') +
      (p.get('from') ? '&from=' + encodeURIComponent(p.get('from')) : '') +
      (p.get('supplier') ? '&supplier=' + encodeURIComponent(p.get('supplier')) : '') +
      (p.get('delivery') ? '&delivery=' + encodeURIComponent(p.get('delivery')) : '');
    window.location.href = href;
  }

  function payDemoOrder() {
    var p = getParams();
    var orderNo = p.get('orderNo');
    var order =
      (orderNo && window.UaOrdersStore && window.UaOrdersStore.getByNo(orderNo)) ||
      (window.UaOrdersStore && window.UaOrdersStore.getLatest());
    var paid = null;
    if (order && window.UaOrdersStore) {
      paid = window.UaOrdersStore.updateStatus(order.orderNo, 'shipping');
    }
    if (!paid && order) {
      paid = Object.assign({}, order, { status: 'shipping' });
      if (window.UaOrdersStore) paid = window.UaOrdersStore.upsert(paid);
    }
    var href =
      window.UaOrdersStore && paid
        ? window.UaOrdersStore.buildDetailHref(paid)
        : 'order-detail.html?status=shipping' +
          (orderNo ? '&orderNo=' + encodeURIComponent(orderNo) : '') +
          (p.get('pointsItem') ? '&pointsItem=' + encodeURIComponent(p.get('pointsItem')) : '');
    window.alert('支付成功（演示）');
    window.location.replace(href);
  }

  function escapeOdText(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pointsExchangeTagHtml() {
    return '<span class="ua-cart-item__tag">积分兑换</span>';
  }

  function applyPointsExchangeNameTags() {
    document.querySelectorAll('.ua-od-item[data-points-exchange="1"]').forEach(function (el) {
      var nameEl = el.querySelector('.ua-od-item__name');
      if (!nameEl) return;
      if (nameEl.querySelector('.ua-cart-item__tag')) return;
      nameEl.innerHTML = pointsExchangeTagHtml() + nameEl.innerHTML;
    });
  }

  /** 用演示订单快照覆盖详情商品与金额 */
  function applyDemoOrderSnapshot() {
    var p = getParams();
    var orderNo = p.get('orderNo');
    if (!orderNo || !window.UaOrdersStore) return null;
    var order = window.UaOrdersStore.getByNo(orderNo);
    if (!order) return null;

    var noEl = document.getElementById('orderNoText');
    if (noEl) noEl.textContent = order.orderNo;

    var items = order.items || [];
    document.querySelectorAll('.ua-od-item').forEach(function (el, idx) {
      var it = items[idx];
      if (!it) {
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.setAttribute('data-item-index', String(idx));
      if (it.isPointsExchange) el.setAttribute('data-points-exchange', '1');
      else el.removeAttribute('data-points-exchange');
      var img = el.querySelector('.ua-od-item__img');
      if (img && it.img) img.setAttribute('src', it.img);
      var nameEl = el.querySelector('.ua-od-item__name');
      if (nameEl) {
        nameEl.innerHTML =
          (it.isPointsExchange ? pointsExchangeTagHtml() : '') + escapeOdText(it.name || '');
      }
      var specEl = el.querySelector('.ua-od-item__spec');
      if (specEl) specEl.textContent = it.spec ? '规格：' + it.spec : '';
      var qtyEl = el.querySelector('.ua-od-item__qty');
      if (qtyEl) qtyEl.textContent = '× ' + (it.qty || 1);
      var saleEl = el.querySelector('.ua-od-item__sale');
      if (saleEl) {
        saleEl.innerHTML = it.isPointsExchange
          ? '<em>兑换</em>' +
            (Number(it.points) || 0) +
            '积分' +
            (Number(it.money) > 0 ? '+¥' + Number(it.money).toFixed(2) : '')
          : '<em>售价</em>¥' + Number(it.price || 0).toFixed(2);
      }
      var paidEl = el.querySelector('.ua-od-item__paid');
      if (paidEl) {
        paidEl.innerHTML = it.isPointsExchange
          ? '<em>实付</em>' +
            (Number(it.points) || 0) +
            '积分' +
            (Number(it.money) > 0 ? '+¥' + Number(it.money).toFixed(2) : '')
          : '<em>实付</em>¥' + Number(it.price || 0).toFixed(2);
      }
    });

    var goodsTotalEl = document.getElementById('orderGoodsTotal');
    if (goodsTotalEl) goodsTotalEl.textContent = '¥' + Number(order.goodsTotal || 0).toFixed(2);
    var freightEl = document.getElementById('orderFreight');
    if (freightEl) {
      freightEl.textContent =
        Number(order.freight || 0) > 0 ? '¥' + Number(order.freight).toFixed(2) : '免运费';
    }
    var deductRow = document.getElementById('orderPointsDeductRow');
    var deductEl = document.getElementById('orderPointsDeduct');
    if (deductRow && deductEl) {
      if (Number(order.deductAmount) > 0) {
        deductRow.hidden = false;
        deductEl.textContent = '-¥' + Number(order.deductAmount).toFixed(2);
      } else {
        deductRow.hidden = true;
      }
    }
    var exchangeRow = document.getElementById('orderExchangePointsRow');
    var exchangeEl = document.getElementById('orderExchangePoints');
    if (exchangeRow && exchangeEl) {
      if (Number(order.exchangePoints) > 0) {
        exchangeRow.hidden = false;
        exchangeEl.textContent = Number(order.exchangePoints) + '积分';
      } else {
        exchangeRow.hidden = false;
        exchangeEl.textContent = '0积分';
        /* 有积分兑换行才强调展示；纯普通单也显示 0 便于验收 */
        if (!(order.items || []).some(function (it) { return it.isPointsExchange; })) {
          exchangeRow.hidden = true;
        }
      }
    }
    var payTotalEl = document.getElementById('orderPayTotal');
    if (payTotalEl) {
      payTotalEl.textContent = order.payLabel || '¥' + Number(order.payable || 0).toFixed(2);
    }
    return order;
  }

  function toast(msg) {
    window.alert(msg + '（演示）');
  }

  function renderItemActions(mode) {
    var actionWraps = document.querySelectorAll('.ua-od-item__actions');
    if (!actionWraps.length) return;

    function makeBtn(label, itemIndex) {
      return (
        '<button type="button" class="ua-od-item__btn" data-item-action="' +
        (mode === 'aftersale' ? 'aftersale' : 'refund') +
        '" data-item-index="' +
        itemIndex +
        '">' +
        label +
        '</button>'
      );
    }

    actionWraps.forEach(function (wrap, index) {
      var itemEl = wrap.closest('.ua-od-item');
      var itemIndex = itemEl
        ? parseInt(itemEl.getAttribute('data-item-index') || String(index), 10)
        : index;
      if (mode === 'refund') {
        wrap.innerHTML = makeBtn('申请退款', itemIndex);
        return;
      }
      if (mode === 'aftersale') {
        wrap.innerHTML = makeBtn('申请售后', itemIndex);
        return;
      }
      wrap.innerHTML = '';
    });
  }

  function getAftersaleApi() {
    return window.UAOrderRefund || null;
  }

  function escapeOdHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getAftersaleBarIcon(kind) {
    if (kind === 'closed') {
      return (
        '<span class="ua-od-as-bar__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 7l10 10M17 7L7 17"/></svg>' +
        '</span>'
      );
    }
    if (kind === 'success') {
      return (
        '<span class="ua-od-as-bar__icon ua-od-as-bar__icon--success" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>' +
        '</span>'
      );
    }
    return (
      '<span class="ua-od-as-bar__icon ua-od-as-bar__icon--progress" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z"/></svg>' +
      '</span>'
    );
  }

  function getDemoOrderNo() {
    var el = document.getElementById('orderNoText');
    return (el && el.textContent && el.textContent.trim()) || '1089765423471123';
  }

  function buildAftersaleListFromDetailHref(itemIndex, extra) {
    var api = getAftersaleApi();
    var p = getParams();
    extra = extra || {};
    var payload = {
      fromDetail: '1',
      from: p.get('from') || 'restock.html',
      status: getStatus(),
      supplier: p.get('supplier') || '',
      delivery: p.get('delivery') || '',
      asItem: itemIndex != null ? String(itemIndex) : '',
      asFilter: extra.asFilter || 'all'
    };
    if (extra.asIds) payload.asIds = extra.asIds;
    if (api && api.buildAftersaleListHref) {
      return api.buildAftersaleListHref(payload);
    }
    var qs = [];
    Object.keys(payload).forEach(function (key) {
      if (payload[key] !== '' && payload[key] != null) {
        qs.push(key + '=' + encodeURIComponent(payload[key]));
      }
    });
    return 'order-aftersale-list.html?' + qs.join('&');
  }

  function canShowItemAftersale(status) {
    /* 待付款/已关闭：仅取消等订单操作，不展示售后进度与申请入口 */
    return status !== 'unpaid' && status !== 'closed';
  }

  function filterAftersaleBarsForStatus(bars, status) {
    var list = bars || [];
    /* 待发货：仅支持仅退款，不展示补货/换货进度条 */
    if (status === 'shipping') {
      return list.filter(function (bar) {
        return bar.group === 'refund';
      });
    }
    return list;
  }

  function renderItemAftersaleBars() {
    var status = getStatus();
    if (!canShowItemAftersale(status)) {
      [0, 1, 2].forEach(function (itemIndex) {
        var wrap = document.getElementById('orderItemAsBars' + itemIndex);
        if (wrap) wrap.innerHTML = '';
      });
      return;
    }

    var api = getAftersaleApi();
    if (!api || !api.getAftersaleProgressView) return;
    var orderNo = getDemoOrderNo();

    [0, 1, 2].forEach(function (itemIndex) {
      var wrap = document.getElementById('orderItemAsBars' + itemIndex);
      if (!wrap) return;
      var bars = filterAftersaleBarsForStatus(
        api.getAftersaleDisplayBars
          ? api.getAftersaleDisplayBars(itemIndex, orderNo)
          : [],
        status
      );
      if (!bars.length) {
        wrap.innerHTML = '';
        return;
      }

      wrap.innerHTML = bars
        .map(function (bar) {
          var rec = bar.record;
          var view = api.getAftersaleProgressView(rec);
          var asIds = (bar.records || [rec])
            .map(function (r) {
              return r.id;
            })
            .filter(Boolean)
            .join(',');
          var descHtml = '';

          if (bar.kind === 'merged_refund_success') {
            view.icon = 'success';
            view.title = '退款成功';
            view.showAmount = true;
            view.desc = '金额';
            view.amountText = '¥' + Number(bar.amount || 0).toFixed(2);
          }

          if (view.showAmount) {
            descHtml =
              escapeOdHtml(view.desc) +
              '<em class="ua-od-as-bar__amount">' +
              escapeOdHtml(view.amountText) +
              '</em>';
          } else if (view.desc) {
            descHtml = escapeOdHtml(view.desc);
          }

          return (
            '<button type="button" class="ua-od-as-bar" data-as-id="' +
            escapeOdHtml(rec.id) +
            '" data-as-kind="' +
            escapeOdHtml(bar.kind || 'single') +
            '" data-as-ids="' +
            escapeOdHtml(asIds) +
            '" data-item-index="' +
            itemIndex +
            '">' +
            getAftersaleBarIcon(view.icon) +
            '<span class="ua-od-as-bar__title">' +
            escapeOdHtml(view.title) +
            '</span>' +
            (descHtml
              ? '<span class="ua-od-as-bar__divider" aria-hidden="true"></span>' +
                '<span class="ua-od-as-bar__desc">' +
                descHtml +
                '</span>'
              : '<span class="ua-od-as-bar__desc"></span>') +
            '<svg class="ua-od-as-bar__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
            '</button>'
          );
        })
        .join('');
    });
  }

  function openAftersaleFromBar(asId, itemIndex, asKind, asIds) {
    var api = getAftersaleApi();
    if (!api) return;
    var orderNo = getDemoOrderNo();
    var p = getParams();
    var detailExtra = {
      from: p.get('from') || 'restock.html',
      status: getStatus(),
      supplier: p.get('supplier') || '',
      delivery: p.get('delivery') || 'warehouse',
      scene: getRefundScene()
    };

    /* 多笔成功退款合并：进列表，仅展示对应售后 */
    if (asKind === 'merged_refund_success') {
      window.location.href = buildAftersaleListFromDetailHref(itemIndex, {
        asFilter: 'done',
        asIds: asIds || asId
      });
      return;
    }

    var bars = filterAftersaleBarsForStatus(
      api.getAftersaleDisplayBars
        ? api.getAftersaleDisplayBars(itemIndex, orderNo)
        : [],
      getStatus()
    );
    var bar =
      bars.find(function (b) {
        return b.record && b.record.id === asId;
      }) || bars[0];
    var rec = bar && bar.record;
    if (!rec) {
      var records = api.getAftersaleRecordsByItem
        ? api.getAftersaleRecordsByItem(itemIndex, orderNo)
        : [];
      rec = records.find(function (r) {
        return r.id === asId;
      });
    }
    if (!rec) return;

    /* 仅对应一次申请：直达详情 */
    window.location.href = api.buildAftersaleDetailHref(rec, detailExtra);
  }

  function isPointsExchangeOrderItem(itemIndex) {
    var el = document.querySelector(
      '.ua-od-item[data-item-index="' + String(itemIndex) + '"]'
    );
    if (el && el.getAttribute('data-points-exchange') === '1') return true;
    try {
      var raw = sessionStorage.getItem('ua_last_order_items_v1');
      if (!raw) return false;
      var list = JSON.parse(raw);
      return !!(Array.isArray(list) && list[itemIndex] && list[itemIndex].isPointsExchange);
    } catch (e) {
      return false;
    }
  }

  function canStartAftersaleForItem(itemIndex, actionMode) {
    /* 积分兑换商品是否支持售后：读后台积分规则 exchange.refundEnabled */
    if (isPointsExchangeOrderItem(itemIndex)) {
      var cfg = window.MdmPointsMallConfig;
      var allowed =
        cfg && typeof cfg.isExchangeRefundEnabled === 'function'
          ? cfg.isExchangeRefundEnabled()
          : true;
      if (!allowed) {
        return { ok: false, msg: '抱歉，积分兑换商品暂不支持售后' };
      }
    }
    var api = getAftersaleApi();
    if (!api || !api.hasOpenAftersaleOfGroup) return { ok: true };
    /* 申请退款：同类型（退款/退货）进行中不可再发起 */
    if (actionMode === 'refund') {
      if (api.hasOpenAftersaleOfGroup(itemIndex, 'refund')) {
        return { ok: false, msg: '该商品已有进行中的退款/退货售后，请先处理完成后再申请' };
      }
    }
    return { ok: true };
  }

  /** 把上次结算写入的积分兑换行标记回订单详情商品卡（演示） */
  function applyLastOrderPointsFlags() {
    try {
      var raw = sessionStorage.getItem('ua_last_order_items_v1');
      if (!raw) return;
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      list.forEach(function (it, idx) {
        if (!it || !it.isPointsExchange) return;
        var el = document.querySelector(
          '.ua-od-item[data-item-index="' + String(idx) + '"]'
        );
        if (el) el.setAttribute('data-points-exchange', '1');
      });
    } catch (e) { /* ignore */ }
  }

  function renderFooter(actions) {
    var footer = document.getElementById('orderDetailFooter');
    if (!footer) return;

    if (!actions || !actions.length) {
      footer.innerHTML = '';
      return;
    }

    footer.innerHTML = actions
      .map(function (item) {
        var cls =
          'ua-od-footer__btn ua-od-footer__btn--' +
          (item.type === 'primary' ? 'primary' : 'ghost') +
          (item.single ? ' ua-od-footer__btn--single' : '');
        return (
          '<button type="button" class="' +
          cls +
          '" data-footer-action="' +
          item.action +
          '">' +
          item.label +
          '</button>'
        );
      })
      .join('');
  }

  function applyRestockMode(status, config) {
    if (!isFromRestock()) return config;

    document.body.classList.add('ua-order-detail-from-restock');

    var override = RESTOCK_STATUS_OVERRIDES[status] || {};
    config = Object.assign({}, config, override);

    var shopNameEl = document.getElementById('orderShopName');
    if (shopNameEl) {
      var supplier =
        getParams().get('supplier') ||
        shopNameEl.getAttribute('data-supplier-name') ||
        '冷丰优选供应链';
      shopNameEl.textContent = supplier;
    }

    var logisticsCard = document.getElementById('orderLogisticsCard');
    if (logisticsCard) logisticsCard.hidden = true;

    var storeDeliveryCard = document.getElementById('orderStoreDeliveryCard');
    if (storeDeliveryCard) {
      storeDeliveryCard.hidden = !config.showStoreDelivery;
      if (config.showStoreDelivery) {
        var statusEl = document.getElementById('orderStoreDeliveryStatus');
        var textEl = document.getElementById('orderStoreDeliveryText');
        var timeEl = document.getElementById('orderStoreDeliveryTime');
        if (statusEl) statusEl.textContent = '订单配送中';
        if (textEl) textEl.textContent = '商品正在配送到门店，请耐心等待';
        if (timeEl) timeEl.textContent = '预计 2026-03-09 18:00 前送达门店';
      }
    }

    applyPendingLogisticsCard(status);
    renderReceiptLogisticsTrack(status);
    applyStoreExpressCard(status);

    var backEl = document.getElementById('orderDetailBack');
    if (backEl) {
      var href = 'orders.html?from=restock.html';
      if (status !== 'unpaid') href += '&tab=' + encodeURIComponent(mapStatusToTab(status));
      backEl.setAttribute('href', href);
    }

    return config;
  }

  function mapStatusToTab(status) {
    /* 用户 APP：待收货归入「待自提/待收货」；补货入口仍用 review（展示为待收货） */
    if (status === 'receipt') return isFromRestock() ? 'review' : 'pickup';
    if (status === 'closed') return 'all';
    return status;
  }

  function bindEvents() {
    var copyBtn = document.getElementById('orderCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = (document.getElementById('orderNoText') || {}).textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              toast('已复制订单编号');
            },
            function () {
              toast('已复制订单编号');
            }
          );
        } else {
          toast('已复制订单编号');
        }
      });
    }

    var logisticsLink = document.getElementById('orderLogisticsLink');
    if (logisticsLink) {
      logisticsLink.addEventListener('click', function (e) {
        e.preventDefault();
        toast('查看物流');
      });
    }

    var trackScroll = document.getElementById('orderLogisticsTrackScroll');
    if (trackScroll) {
      trackScroll.addEventListener('click', function (e) {
        var card = e.target.closest('[data-pkg-index]');
        if (!card) return;
        var idx = parseInt(card.getAttribute('data-pkg-index'), 10) || 0;
        window.location.href = buildLogisticsHref(idx);
      });
      trackScroll.addEventListener('scroll', function () {
        var dots = document.getElementById('orderLogisticsTrackDots');
        if (!dots || dots.hidden) return;
        var card = trackScroll.querySelector('.ua-od-logistics-track__card');
        if (!card) return;
        var idx = Math.round(trackScroll.scrollLeft / (card.offsetWidth + 10));
        dots.querySelectorAll('.ua-od-logistics-track__dot').forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === idx);
        });
      });
    }

    document.getElementById('orderDetailFooter') &&
      document.getElementById('orderDetailFooter').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-footer-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-footer-action');
        if (action === 'cancel') {
          openCancelModal();
          return;
        }
        if (action === 'pay') {
          payDemoOrder();
          return;
        }
        var map = {
          pay: '立即付款',
          refund: '申请退款',
          logistics: '查看物流',
          confirm: '确认收货',
          delete: '删除订单',
          cart: '加入购物车',
          rebuy: '重新购买'
        };
        toast(map[action] || '操作');
      });

    document.querySelectorAll('.ua-od-item__actions').forEach(function (wrap) {
      wrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.ua-od-item__btn');
        if (!btn) return;
        var itemIndex = parseInt(btn.getAttribute('data-item-index') || '0', 10);
        var actionMode = btn.getAttribute('data-item-action') || 'refund';
        var check = canStartAftersaleForItem(itemIndex, actionMode);
        if (!check.ok) {
          window.alert(check.msg);
          return;
        }
        window.location.href = buildItemRefundHref(itemIndex);
      });
    });

    document.querySelectorAll('.ua-od-as-bars').forEach(function (wrap) {
      wrap.addEventListener('click', function (e) {
        var bar = e.target.closest('.ua-od-as-bar');
        if (!bar) return;
        openAftersaleFromBar(
          bar.getAttribute('data-as-id'),
          parseInt(bar.getAttribute('data-item-index') || '0', 10),
          bar.getAttribute('data-as-kind') || 'single',
          bar.getAttribute('data-as-ids') || ''
        );
      });
    });

    document.getElementById('orderCancelModalDismiss') &&
      document.getElementById('orderCancelModalDismiss').addEventListener('click', closeCancelModal);
    document.getElementById('orderCancelModalMask') &&
      document.getElementById('orderCancelModalMask').addEventListener('click', closeCancelModal);
    document.getElementById('orderCancelModalConfirm') &&
      document.getElementById('orderCancelModalConfirm').addEventListener('click', confirmCancelOrder);
  }

  function init() {
    var demoOrder = applyDemoOrderSnapshot();
    var status = getStatus();
    /* URL 与存储不一致时，校正地址栏，避免刷新后又变回待付款 */
    if (demoOrder && demoOrder.status && demoOrder.status !== (getParams().get('status') || '')) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('status', demoOrder.status);
        if (demoOrder.orderNo) url.searchParams.set('orderNo', demoOrder.orderNo);
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e) { /* ignore */ }
      status = demoOrder.status;
    }
    var config = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;
    applyLastOrderPointsFlags();
    /* URL 演示：?pointsItem=0 或 0,2 将对应行标为积分兑换商品 */
    var pointsItemParam = getParams().get('pointsItem');
    if (pointsItemParam) {
      String(pointsItemParam)
        .split(',')
        .forEach(function (raw) {
          var idx = parseInt(String(raw).trim(), 10);
          if (isNaN(idx)) return;
          var el = document.querySelector(
            '.ua-od-item[data-item-index="' + String(idx) + '"]'
          );
          if (el) el.setAttribute('data-points-exchange', '1');
        });
    }
    applyPointsExchangeNameTags();

    document.getElementById('orderDetailShell') &&
      document.getElementById('orderDetailShell').setAttribute('data-order-status', status);

    if (status === 'shipping') {
      document.getElementById('orderDetailShell') &&
        document.getElementById('orderDetailShell').setAttribute(
          'data-cutoff-passed',
          isPlatformCutoffPassed() ? 'true' : 'false'
        );
    }

    var supplier = getParams().get('supplier');
    if (supplier) {
      var shopNameEl = document.getElementById('orderShopName');
      if (shopNameEl) shopNameEl.setAttribute('data-supplier-name', supplier);
    }

    if (isFromRestock()) {
      config = applyRestockMode(status, config);
      config = applyDeliveryMode(status, config);
    } else {
      config = applyUserAppExpressLayout(status, config);
    }

    config = applyClosedReason(config);
    config = applyShippingFooter(status, config);

    var titleEl = document.getElementById('orderStatusTitle');
    var subEl = document.getElementById('orderStatusSub');
    if (titleEl) titleEl.textContent = config.title;
    if (subEl) {
      if (config.sub) {
        subEl.textContent = config.sub;
        subEl.hidden = false;
      } else {
        subEl.textContent = '';
        subEl.hidden = true;
      }
    }

    var logisticsCard = document.getElementById('orderLogisticsCard');
    if (logisticsCard) logisticsCard.hidden = true;

    var storeDeliveryCard = document.getElementById('orderStoreDeliveryCard');
    if (storeDeliveryCard) {
      storeDeliveryCard.hidden = !config.showStoreDelivery;
      if (config.showStoreDelivery && !isFromRestock()) {
        var statusEl = document.getElementById('orderStoreDeliveryStatus');
        var textEl = document.getElementById('orderStoreDeliveryText');
        var timeEl = document.getElementById('orderStoreDeliveryTime');
        if (statusEl) statusEl.textContent = '订单配送中';
        if (textEl) textEl.textContent = '商品正在配送到门店，请耐心等待';
        if (timeEl) timeEl.textContent = '预计 2026-03-09 18:00 前到达门店';
      }
    }

    applyPendingLogisticsCard(status);
    renderReceiptLogisticsTrack(status);
    applyStoreExpressCard(status);

    var pointsCard = document.getElementById('orderPointsCard');
    if (pointsCard) pointsCard.hidden = !config.showPoints;

    var payMethodRow = document.getElementById('orderPayMethodRow');
    if (payMethodRow) payMethodRow.hidden = !config.showPayMethod;

    renderItemActions(canShowItemAftersale(status) ? config.itemActions : 'none');
    renderItemAftersaleBars();
    renderFooter(config.footer);
    applyInvoiceType();

    var backEl = document.getElementById('orderDetailBack');
    if (backEl && !isFromRestock()) {
      var tab = mapStatusToTab(status);
      backEl.setAttribute('href', tab === 'all' ? 'orders.html' : 'orders.html?tab=' + encodeURIComponent(tab));
    }

    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
