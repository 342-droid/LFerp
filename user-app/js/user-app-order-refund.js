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
    restock: ['少件/漏发/少配件', '包装/商品破损/污渍', '质量问题', '卖家发错货', '商品信息描述不符'],
    exchange: ['规格/颜色拍错', '大小/尺寸/重量与商品描述不符', '质量问题', '卖家发错货', '商品信息描述不符']
  };

  var GOODS_STATUS = ['未收到货', '已收到货'];

  var STORAGE_KEY = 'ua_refund_application';

  var COURIERS = [
    { id: 'sf', name: '顺丰速运', abbr: '顺' },
    { id: 'sto', name: '申通快递', abbr: '申' },
    { id: 'yto', name: '圆通速递', abbr: '圆' },
    { id: 'zto', name: '中通快递', abbr: '中' },
    { id: 'yd', name: '韵达快递', abbr: '韵' },
    { id: 'best', name: '百世快递', abbr: '百' },
    { id: 'jd', name: '京东物流', abbr: '京' },
    { id: 'jt', name: '极兔速递', abbr: '极' }
  ];

  var RETURN_ADDRESSES = {
    store: {
      tip: '平台已同意退货，请将商品寄回以下地址，并在下方填写退货物流信息。',
      name: '冷丰优选杭州文一西路店',
      phone: '13800138000',
      address: '浙江省杭州市西湖区文一西路969号 冷丰优选门店'
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
  var RESTOCK_STEPS = ['提交申请', '平台审核', '补货寄出', '补货完成'];
  var EXCHANGE_STEPS = ['提交申请', '平台审核', '寄回商品', '换货寄出', '换货完成'];

  function getDelivery() {
    var delivery = (getParams().get('delivery') || '').trim();
    if (delivery === 'store' || delivery === 'warehouse') return delivery;
    return 'warehouse';
  }

  function getReturnConfirmParty(delivery) {
    return delivery === 'store' ? '商家' : '仓库';
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
    return '因退货商品不符，' + party + '已拒收，商品正在退回，请留意物流信息。';
  }

  function ensureReshipData(app) {
    if (!app.outCourier) app.outCourier = '顺丰速运';
    if (!app.outTrackingNo) app.outTrackingNo = 'SF1122334455667';
    saveApplication(app);
    return app;
  }

  function getReturnSectionTip(refundType, delivery) {
    if (refundType === 'exchange') {
      return '平台已同意换货，请将原商品寄回以下地址，并在下方填写退货物流信息。';
    }
    return (RETURN_ADDRESSES[delivery] || RETURN_ADDRESSES.warehouse).tip;
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

  function buildPreShipHrefWithEdit() {
    return 'order-refund-pre-ship.html?' + buildQuery({ edit: '1' });
  }

  function buildFormHref(formType) {
    if (formType === 'pre_ship') return buildPreShipHrefWithEdit();
    if (formType === 'return') return 'order-refund-return.html?' + buildQuery({ edit: '1' });
    return 'order-refund-only.html?' + buildQuery({ edit: '1' });
  }

  function persistAndGoDetail(formType, payload) {
    var item = getItem();
    var existing = loadApplication() || {};
    var app = Object.assign({}, existing, payload, {
      formType: formType,
      itemIndex: getItemIndex(),
      delivery: getDelivery(),
      applyTime: existing.applyTime || formatDateTime(),
      refundNo: existing.refundNo || genRefundNo(),
      productName: item.name,
      productSpec: item.spec,
      productImg: item.img
    });
    saveApplication(app);
    var typeMap = { return: 'return', restock: 'restock', exchange: 'exchange' };
    var type = typeMap[formType] || 'refund_only';
    window.location.href = buildDetailHref({
      type: type,
      stage: 'audit',
      reason: app.reason || ''
    });
  }

  function bindDescAndUpload(state, descInput, descCount, uploadGrid, item) {
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
    return renderUploads;
  }

  function renderSpecQtyList(containerId, specs, qtyMap, onChange) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = specs
      .map(function (spec) {
        var qty = qtyMap[spec.id] || 0;
        return (
          '<div class="ua-or-spec-row" data-spec-id="' +
          spec.id +
          '">' +
          '<div class="ua-or-spec-row__info">' +
          '<div class="ua-or-spec-row__label">' +
          spec.label +
          '</div>' +
          '<div class="ua-or-spec-row__price">' +
          formatPrice(spec.priceNum) +
          '/件</div></div>' +
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
          '" min="0" readonly tabindex="-1">' +
          '<button type="button" class="ua-or-spec-plus" data-spec-id="' +
          spec.id +
          '" aria-label="增加">+</button></div></div>'
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
        qtyMap[id] = Math.min(99, (qtyMap[id] || 0) + 1);
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
    var specs = getItemSpecs(item);
    var state = {
      reason: '',
      specQtys: {},
      desc: '',
      images: []
    };
    specs.forEach(function (spec) {
      state.specQtys[spec.id] = 0;
    });

    initNav('补货', buildSelectHref());
    renderProductCard('refundProductCard');

    var reasonValue = document.getElementById('refundReasonValue');
    var specList = document.getElementById('refundRestockSpecList');
    var specSummary = document.getElementById('refundRestockSpecSummary');
    var descInput = document.getElementById('refundDescInput');
    var descCount = document.getElementById('refundDescCount');
    var uploadGrid = document.getElementById('refundUploadGrid');
    var submitBtn = document.getElementById('refundSubmitBtn');

    function syncUI() {
      if (reasonValue) {
        reasonValue.textContent = state.reason || '请选择';
        reasonValue.classList.toggle('ua-or-field__value--placeholder', !state.reason);
      }
      if (specSummary) {
        var summary = summarizeSpecQty(specs, state.specQtys);
        specSummary.textContent = summary || '请选择需补商品的规格及数量';
        specSummary.classList.toggle('ua-or-field__value--placeholder', !summary);
      }
    }

    function refreshSpecList() {
      renderSpecQtyList('refundRestockSpecList', specs, state.specQtys, refreshSpecList);
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
    var state = {
      reason: '',
      sourceSpecId: orderSpec.id,
      sourceQty: item.qty,
      targetSpecId: samePriceSpecs.length ? samePriceSpecs[0].id : '',
      targetQty: item.qty,
      desc: '',
      images: []
    };

    initNav('换货', buildSelectHref());
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

    bindDescAndUpload(state, descInput, descCount, uploadGrid, item);

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
        persistAndGoDetail('exchange', {
          reason: state.reason,
          exchangeFrom: { specId: orderSpec.id, label: orderSpec.label, qty: item.qty, priceNum: orderSpec.priceNum },
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
        });
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
    if (['pre_ship', 'post_ship', 'aftersale'].indexOf(scene) >= 0) return scene;
    return 'post_ship';
  }

  function getItemIndex() {
    var idx = parseInt(getParams().get('item') || '0', 10);
    return isNaN(idx) || idx < 0 ? 0 : idx;
  }

  function getItem() {
    var idx = getItemIndex();
    return DEMO_ITEMS[idx] || DEMO_ITEMS[0];
  }

  function formatPrice(num) {
    return '¥' + Number(num).toFixed(2);
  }

  function buildDetailBackHref() {
    var p = getParams();
    var status = p.get('status') || 'shipping';
    var href = 'order-detail.html?status=' + encodeURIComponent(status);
    if (p.get('from')) href += '&from=' + encodeURIComponent(p.get('from'));
    if (p.get('supplier')) href += '&supplier=' + encodeURIComponent(p.get('supplier'));
    if (p.get('delivery')) href += '&delivery=' + encodeURIComponent(p.get('delivery'));
    if (p.get('cutoff')) href += '&cutoff=' + encodeURIComponent(p.get('cutoff'));
    if (p.get('reason')) href += '&reason=' + encodeURIComponent(p.get('reason'));
    return href;
  }

  function buildQuery(extra) {
    var p = getParams();
    var keys = ['from', 'status', 'supplier', 'delivery', 'cutoff', 'reason', 'scene', 'item', 'type', 'stage', 'logistics', 'closeReason', 'expired'];
    var qs = [];
    keys.forEach(function (key) {
      var val = p.get(key);
      if (val) qs.push(key + '=' + encodeURIComponent(val));
    });
    if (extra) {
      Object.keys(extra).forEach(function (key) {
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
      item.name +
      '</div>' +
      '<div class="ua-or-product__spec">' +
      item.spec +
      '</div></div>';
  }

  function initNav(title, backHref) {
    var titleEl = document.getElementById('refundNavTitle');
    var backEl = document.getElementById('refundNavBack');
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
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-or-sheet-close'));
      });
    });
  }

  function initSelectPage() {
    var scene = getScene();
    initNav(scene === 'aftersale' ? '选择售后类型' : '选择服务类型', buildDetailBackHref());
    renderProductCard('refundProductCard');

    var sectionTitle = document.getElementById('refundSectionTitle');
    if (sectionTitle) {
      sectionTitle.textContent = scene === 'aftersale' ? '选择售后类型' : '选择服务类型';
    }

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
        state.service = row.getAttribute('data-service');
        syncRadio();
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
    var state = {
      formType: formType,
      goodsStatus: formType === 'return' ? '已收到货' : '',
      reason: '',
      qty: item.qty,
      maxQty: item.qty,
      amount: item.priceNum * item.qty,
      maxAmount: item.priceNum * item.qty,
      freight: item.freight || 0,
      desc: '',
      images: []
    };
    var app = loadApplication();
    var isEdit = getParams().get('edit') === '1';
    if (isEdit && app) {
      if (app.reason) state.reason = app.reason;
      if (app.qty) state.qty = app.qty;
      if (app.amount != null) state.amount = app.amount;
      if (app.goodsStatus) state.goodsStatus = app.goodsStatus;
      if (app.desc) state.desc = app.desc;
      if (app.images && app.images.length) state.images = app.images.slice();
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
    initNav(pageTitle, isPreShip ? buildDetailBackHref() : buildSelectHref());
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
        if (isNaN(val) || val < 1) val = 1;
        if (val > item.qty) val = item.qty;
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
        if (!isPreShip && !isReturn && !state.goodsStatus) {
          window.alert('请选择货物状态');
          return;
        }
        if (!state.reason) {
          window.alert('请选择退款原因');
          return;
        }
        if (state.qty <= 0) {
          window.alert('请选择退款件数');
          return;
        }
        if (state.amount <= 0) {
          window.alert('请填写退款金额');
          return;
        }
        persistAndGoDetail(isReturn ? 'return' : 'refund_only', {
          reason: state.reason,
          qty: state.qty,
          amount: state.amount,
          goodsStatus: state.goodsStatus,
          desc: state.desc,
          images: state.images
        });
      });
    }

    bindSheetClose();
  }

  function initPreShipPage() {
    var item = getItem();
    var app = loadApplication();
    var isEdit = getParams().get('edit') === '1';
    var state = {
      reason: isEdit && app && app.reason ? app.reason : '',
      qty: item.qty,
      amount: item.paidAmount != null ? item.paidAmount : item.priceNum * item.qty,
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
      if (qtyHint) qtyHint.textContent = '最多可退' + item.qty + '件';
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
      return;
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
    if (shell) shell.classList.add('ua-order-refund-detail-page--result');

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
            ? '补货已完成，请注意查收商品。'
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

  function renderDetailInfoCard(app, item, refundType) {
    refundType = refundType || getRefundType();
    var isRestock = refundType === 'restock';
    var isExchange = refundType === 'exchange';
    var isReturn = refundType === 'return';

    var productEl = document.getElementById('refundDetailProduct');
    if (productEl) {
      productEl.innerHTML =
        '<img class="ua-or-product__img" src="' +
        (app.productImg || item.img) +
        '" alt="">' +
        '<div class="ua-or-product__body">' +
        '<div class="ua-or-product__name">' +
        (app.productName || item.name) +
        '</div>' +
        '<div class="ua-or-product__spec">' +
        (app.restockSummary || app.exchangeSummary || app.productSpec || item.spec) +
        '</div></div>';
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
            ? '退货原因'
            : '退款原因';
    }

    var reasonEl = document.getElementById('refundDetailReason');
    if (reasonEl) reasonEl.textContent = app.reason || '—';

    var amountRow = document.getElementById('refundDetailAmount');
    if (amountRow) {
      var amountRowWrap = amountRow.closest('.ua-or-detail-info-row');
      if (isRestock || isExchange) {
        if (amountRowWrap) amountRowWrap.hidden = true;
      } else {
        if (amountRowWrap) amountRowWrap.hidden = false;
        amountRow.textContent = formatPrice(app.amount != null ? app.amount : item.priceNum * item.qty);
      }
    }

    var timeEl = document.getElementById('refundDetailApplyTime');
    if (timeEl) timeEl.textContent = app.applyTime || formatDateTime();

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
              ? '退货编号'
              : '退款编号';
      }
    }

    var noEl = document.getElementById('refundDetailNo');
    if (noEl) noEl.textContent = app.refundNo || genRefundNo();

    var copyBtn = document.getElementById('refundDetailCopyBtn');
    if (copyBtn) {
      copyBtn.onclick = function () {
        copyText(
          (noEl && noEl.textContent) || '',
          isRestock ? '已复制补货编号' : isExchange ? '已复制换货编号' : '已复制退款编号'
        );
      };
    }
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
    var steps = REFUND_ONLY_STEPS;
    if (isReturn) steps = RETURN_STEPS;
    else if (isRestock) steps = RESTOCK_STEPS;
    else if (isExchange) steps = EXCHANGE_STEPS;

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
      saveApplication(app);
    }

    var state = {
      refundType: refundType,
      stage: stage,
      delivery: app.delivery || delivery,
      logisticsEdit: logisticsEdit,
      courier: app.courier || '顺丰速运',
      trackingNo: app.trackingNo || '',
      deadline: Date.now() + 24 * 60 * 60 * 1000
    };

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
        title: '请寄回退货商品',
        notice: ''
      },
      refund: {
        title: '请等待平台退款',
        notice: ''
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
          ? '补货已完成，请注意查收商品。'
          : isExchange
            ? '换货已完成，请注意查收商品。'
            : '退款已成功，款项将按原路退回，请注意查收。'
      }
    };

    var cfg = statusConfig[stage] || statusConfig.audit;
    if (stage === 'refund') {
      cfg = Object.assign({}, cfg, {
        notice: buildRefundStageNotice(state.delivery)
      });
    }
    if (stage === 'reject_return') {
      cfg = Object.assign({}, cfg, {
        notice: buildRejectReturnNotice(state.delivery)
      });
      ensureRejectReturnData(app, state);
    }
    if (stage === 'reship') {
      ensureReshipData(app);
      cfg = Object.assign({}, cfg, {
        notice: isRestock
          ? '平台已同意补货，正在为您安排寄出，请留意物流信息。'
          : '平台已收到退回商品，正在为您安排换货寄出，请留意物流信息。'
      });
    }

    var titleEl = document.getElementById('refundDetailStatusTitle');
    if (titleEl) titleEl.textContent = cfg.title;

    var noticeEl = document.getElementById('refundDetailNotice');
    if (noticeEl) {
      noticeEl.textContent = cfg.notice;
      if (stage === 'refund' && isReturn) {
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
        noticeEl.title = '点击进入关闭结果（演示）';
        noticeEl.addEventListener('click', function () {
          app.closedTime = formatDateTime();
          saveApplication(app);
          window.location.href = buildDetailHref({
            type: refundType,
            stage: 'closed',
            closeReason: 'reject_receive'
          });
        });
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
      if (current === 'reship') return 'success';
      if (current === 'refund') return 'success';
      if (current === 'reject_return') return 'closed_reject';
      return null;
    }

    function getStepActiveIdx() {
      if (stage === 'success') return steps.length - 1;
      if (isRestock) {
        if (stage === 'reship') return 2;
        return 1;
      }
      if (isExchange) {
        if (stage === 'return') return 2;
        if (stage === 'reship') return 3;
        return 1;
      }
      if (isReturn) {
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
          if (idx === activeIdx && stage !== 'success') cls += ' is-tappable';
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

      if (stage !== 'success') {
        el.querySelectorAll('.ua-or-detail-step.is-tappable').forEach(function (stepEl) {
          stepEl.addEventListener('click', function () {
            var next = getNextStage(stage);
            if (!next) return;
            if (stage === 'return' && next === 'refund') {
              if (!app.courier) app.courier = state.courier || '顺丰速运';
              if (!app.trackingNo) app.trackingNo = state.trackingNo || 'SF1234567890123';
              saveApplication(app);
            }
            if (stage === 'return' && next === 'reship') {
              if (!app.courier) app.courier = state.courier || '顺丰速运';
              if (!app.trackingNo) app.trackingNo = state.trackingNo || 'SF1234567890123';
              ensureReshipData(app);
              saveApplication(app);
            }
            if (next === 'reship' && isRestock) {
              ensureReshipData(app);
            }
            if (next === 'success') {
              app.resultTime = formatDateTime();
              saveApplication(app);
            }
            if (next === 'closed_reject') {
              ensureRejectReturnData(app, state);
              app.closedTime = formatDateTime();
              saveApplication(app);
              window.location.href = buildDetailHref({
                type: refundType,
                stage: 'closed',
                closeReason: 'reject_receive'
              });
              return;
            }
            window.location.href = buildDetailHref({ type: refundType, stage: next });
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
        } else {
          timerEl.textContent = '剩余 ' + h + 'h ' + pad(m) + 'm ' + pad(s) + 's';
        }
      }
    }
    tickTimer();
    timerId = window.setInterval(tickTimer, 1000);

    renderDetailInfoCard(app, item, refundType);

    var returnSection = document.getElementById('refundDetailReturnSection');
    var rejectReturnSection = document.getElementById('refundDetailRejectReturnSection');
    var reshipSection = document.getElementById('refundDetailReshipSection');
    var addrEl = document.getElementById('refundDetailReturnAddr');
    var logisticsForm = document.getElementById('refundDetailLogisticsForm');
    var logisticsView = document.getElementById('refundDetailLogisticsView');
    var companyValue = document.getElementById('refundLogisticsCompanyValue');
    var trackingInput = document.getElementById('refundTrackingInput');
    var companyDisplay = document.getElementById('refundLogisticsCompanyDisplay');
    var trackingDisplay = document.getElementById('refundTrackingDisplay');

    function renderReturnAddr() {
      var addr = RETURN_ADDRESSES[state.delivery] || RETURN_ADDRESSES.warehouse;
      if (!addrEl) return;
      addrEl.innerHTML =
        '<p class="ua-or-detail-return__tip">' +
        getReturnSectionTip(refundType, state.delivery) +
        '</p>' +
        '<p class="ua-or-detail-return__line"><em>收件人</em>' +
        addr.name +
        '</p>' +
        '<p class="ua-or-detail-return__line"><em>联系电话</em>' +
        addr.phone +
        '</p>' +
        '<p class="ua-or-detail-return__line"><em>退货地址</em>' +
        addr.address +
        '</p>';
    }

    function syncLogisticsUI() {
      if (companyValue) {
        companyValue.textContent = state.courier || '请选择';
        companyValue.classList.toggle('ua-or-field__value--placeholder', !state.courier);
      }
      if (trackingInput) trackingInput.value = state.trackingNo || '';
      if (companyDisplay) companyDisplay.textContent = state.courier || '—';
      if (trackingDisplay) trackingDisplay.textContent = state.trackingNo || '—';
    }

    if (isReturn && stage === 'reject_return') {
      if (returnSection) returnSection.hidden = true;
      if (rejectReturnSection) rejectReturnSection.hidden = false;
      var reasonTextEl = document.getElementById('refundRejectReasonText');
      var backCourierEl = document.getElementById('refundBackCourierDisplay');
      var backTrackingEl = document.getElementById('refundBackTrackingDisplay');
      if (reasonTextEl) {
        reasonTextEl.textContent =
          '拒收原因：' + (app.rejectReceiveReason || '退货商品与申请不符，不符合退货要求');
      }
      if (backCourierEl) backCourierEl.textContent = app.backCourier || '—';
      if (backTrackingEl) backTrackingEl.textContent = app.backTrackingNo || '—';
    } else if (rejectReturnSection) {
      rejectReturnSection.hidden = true;
    }

    if ((isRestock || isExchange) && stage === 'reship') {
      if (reshipSection) reshipSection.hidden = false;
      ensureReshipData(app);
      var outCourierEl = document.getElementById('refundOutCourierDisplay');
      var outTrackingEl = document.getElementById('refundOutTrackingDisplay');
      if (outCourierEl) outCourierEl.textContent = app.outCourier || '—';
      if (outTrackingEl) outTrackingEl.textContent = app.outTrackingNo || '—';
    } else if (reshipSection) {
      reshipSection.hidden = true;
    }

    if ((isReturn && (stage === 'return' || stage === 'refund')) || (isExchange && stage === 'return')) {
      if (returnSection) returnSection.hidden = false;
      renderReturnAddr();
      syncLogisticsUI();
      var showForm = stage === 'return' || (stage === 'refund' && state.logisticsEdit);
      if (logisticsForm) logisticsForm.hidden = !showForm;
      if (logisticsView) logisticsView.hidden = showForm;
    } else if (returnSection) {
      returnSection.hidden = true;
    }

    function renderCourierList() {
      var el = document.getElementById('refundCourierList');
      if (!el) return;
      el.innerHTML = COURIERS.map(function (c) {
        var active = c.name === state.courier;
        return (
          '<label class="ua-or-courier__option">' +
          '<span class="ua-or-courier__logo">' +
          c.abbr +
          '</span>' +
          '<span class="ua-or-courier__name">' +
          c.name +
          '</span>' +
          '<input type="radio" name="courier" value="' +
          c.name +
          '"' +
          (active ? ' checked' : '') +
          '>' +
          '<span class="ua-or-courier__radio"></span></label>'
        );
      }).join('');
      el.querySelectorAll('input[name="courier"]').forEach(function (input) {
        input.addEventListener('change', function () {
          state.courier = input.value;
          syncLogisticsUI();
          closeSheet('refundCourierSheet');
        });
      });
    }

    document.getElementById('refundLogisticsCompanyRow') &&
      document.getElementById('refundLogisticsCompanyRow').addEventListener('click', function () {
        renderCourierList();
        openSheet('refundCourierSheet');
      });

    if (trackingInput) {
      trackingInput.addEventListener('input', function () {
        state.trackingNo = trackingInput.value.trim();
      });
    }

    function renderFooter() {
      var footer = document.getElementById('refundDetailFooter');
      if (!footer) return;
      footer.className = 'ua-or-detail-footer';
      if (stage === 'success' || stage === 'reject_return' || stage === 'reship') {
        footer.innerHTML = '';
        return;
      }
      if ((isReturn || isExchange) && stage === 'return') {
        footer.innerHTML =
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--ghost" id="refundDetailCancelBtn">撤销申请</button>' +
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--primary" id="refundDetailSubmitLogisticsBtn">提交</button>';
        return;
      }
      if (isReturn && stage === 'refund' && !state.logisticsEdit) {
        footer.className = 'ua-or-detail-footer ua-or-detail-footer--single';
        footer.innerHTML =
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--outline" id="refundDetailEditLogisticsBtn">修改物流信息</button>';
        return;
      }
      if (isReturn && stage === 'refund' && state.logisticsEdit) {
        footer.innerHTML =
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--ghost" id="refundDetailCancelBtn">撤销申请</button>' +
          '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--primary" id="refundDetailSubmitLogisticsBtn">提交</button>';
        return;
      }
      footer.innerHTML =
        '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--ghost" id="refundDetailCancelBtn">撤销申请</button>' +
        '<button type="button" class="ua-or-detail-footer__btn ua-or-detail-footer__btn--outline" id="refundDetailModifyBtn">修改申请</button>';
    }

    renderFooter();

    function openCancelModal() {
      var modal = document.getElementById('refundCancelModal');
      if (modal) modal.hidden = false;
    }

    function closeCancelModal() {
      var modal = document.getElementById('refundCancelModal');
      if (modal) modal.hidden = true;
    }

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
      if (cancelBtn) cancelBtn.addEventListener('click', openCancelModal);

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

      var submitLogisticsBtn = document.getElementById('refundDetailSubmitLogisticsBtn');
      if (submitLogisticsBtn) {
        submitLogisticsBtn.addEventListener('click', function () {
          if (!state.courier) {
            window.alert('请选择物流公司');
            return;
          }
          if (!state.trackingNo) {
            window.alert('请输入退货单号');
            return;
          }
          app.courier = state.courier;
          app.trackingNo = state.trackingNo;
          saveApplication(app);
          if (isExchange) {
            ensureReshipData(app);
            window.location.href = buildDetailHref({ type: 'exchange', stage: 'reship' });
          } else {
            window.location.href = buildDetailHref({ type: 'return', stage: 'refund' });
          }
        });
      }

      var editLogisticsBtn = document.getElementById('refundDetailEditLogisticsBtn');
      if (editLogisticsBtn) {
        editLogisticsBtn.addEventListener('click', function () {
          window.location.href = buildDetailHref({ type: 'return', stage: 'refund', logistics: 'edit' });
        });
      }
    }

    bindFooterActions();
    bindSheetClose();

    window.addEventListener('beforeunload', function () {
      if (timerId) window.clearInterval(timerId);
    });
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
    buildDetailHref: buildDetailHref,
    renderProductCard: renderProductCard,
    initNav: initNav
  };
})(typeof window !== 'undefined' ? window : this);
