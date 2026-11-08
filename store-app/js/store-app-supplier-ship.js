/**
 * 丰银宝 · 供应商发货上传快递单
 * 字段与 PC OrderProxyExpress 对齐：关联商品、物流单号、物流公司；交互为 App 底部半屏。
 */
(function (global) {
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

  var SHEET_ID = 'saSupShipSheet';
  var PICKER_ID = 'saSupShipCourierPicker';
  var SCAN_ID = 'saSupShipScan';

  /** 演示：扫运单条码回填的样例单号（可触发自动识别公司） */
  var MOCK_SCAN_NOS = ['SF1688990011223', 'YT8877665544332', '773088899900011', 'JDVA12345678901'];
  var mockScanIdx = 0;

  var SCAN_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">' +
    '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/>' +
    '<path d="M7 12h10M9 9v6M15 9v6"/>' +
    '</svg>';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    if (global.StoreAppToast && typeof global.StoreAppToast.show === 'function') {
      global.StoreAppToast.show(msg);
      return;
    }
    if (global.LFToast && global.LFToast.show) {
      global.LFToast.show(msg);
      return;
    }
    if (typeof global.showToast === 'function') global.showToast(msg);
  }

  function inferCourierFromTrackingNo(trackingNo) {
    var no = String(trackingNo || '').trim().toUpperCase();
    if (!no) return '';
    for (var i = 0; i < TRACKING_COURIER_RULES.length; i++) {
      if (TRACKING_COURIER_RULES[i].test(no)) return TRACKING_COURIER_RULES[i].courier;
    }
    return '';
  }

  function orderGoods(order) {
    if (order && order.goods && order.goods.length) {
      return order.goods.map(function (g, idx) {
        return {
          id: g.id || 'g' + (idx + 1),
          name: g.name || order.product || '商品'
        };
      });
    }
    var name = (order && order.product) || '商品';
    if (order && order.spec) name += ' ' + order.spec;
    if (order && order.qty) name += ' ×' + order.qty;
    return [
      {
        id: (order && order.lineNo && order.lineNo !== '—') ? order.lineNo : 'g1',
        name: name
      }
    ];
  }

  function closePicker() {
    var el = document.getElementById(PICKER_ID);
    if (el) el.remove();
  }

  function closeScan() {
    var el = document.getElementById(SCAN_ID);
    if (el) el.remove();
  }

  function closeSheet() {
    closeScan();
    closePicker();
    var el = document.getElementById(SHEET_ID);
    if (el) el.remove();
  }

  function openCourierPicker(current, onPick) {
    closePicker();
    var host = document.getElementById(SHEET_ID) || document.body;
    var wrap = document.createElement('div');
    wrap.id = PICKER_ID;
    wrap.className = 'sa-sup-ship-picker';
    wrap.innerHTML =
      '<div class="sa-sup-ship-picker__mask" data-pick-close></div>' +
      '<div class="sa-sup-ship-picker__panel" role="dialog" aria-label="选择物流公司">' +
      '<div class="sa-sup-ship-picker__head">' +
      '<h4 class="sa-sup-ship-picker__title">物流公司</h4>' +
      '<button type="button" class="sa-sup-ship-picker__close" data-pick-close aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="sa-sup-ship-picker__list">' +
      COURIERS.map(function (c) {
        return (
          '<button type="button" class="sa-sup-ship-picker__item' +
          (c === current ? ' is-active' : '') +
          '" data-courier="' +
          escapeHtml(c) +
          '">' +
          escapeHtml(c) +
          '</button>'
        );
      }).join('') +
      '</div></div>';
    host.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-pick-close]')) {
        closePicker();
        return;
      }
      var item = e.target.closest('[data-courier]');
      if (!item) return;
      onPick(item.getAttribute('data-courier') || '');
      closePicker();
    });
  }

  /**
   * @param {object} order
   * @param {{ title?: string, onSaved?: function }} [opts]
   */
  function open(order, opts) {
    opts = opts || {};
    if (!order) return;
    if (global.FybSupplierOrders && typeof global.FybSupplierOrders.canShip === 'function') {
      if (!global.FybSupplierOrders.canShip(order)) {
        toast('当前订单状态不可上传快递单');
        return;
      }
    }

    closeSheet();
    var goods = orderGoods(order);
    var selected = {};
    goods.forEach(function (g) {
      selected[g.id] = true;
    });
    var courier = order.courier || '';
    var shell = document.querySelector('.sa-shell') || document.body;

    var goodsHtml = goods
      .map(function (g) {
        return (
          '<label class="sa-sup-ship-good">' +
          '<input type="checkbox" class="sa-sup-ship-good__check" value="' +
          escapeHtml(g.id) +
          '" checked>' +
          '<span class="sa-sup-ship-good__name">' +
          escapeHtml(g.name) +
          '</span></label>'
        );
      })
      .join('');

    var mask = document.createElement('div');
    mask.id = SHEET_ID;
    mask.className = 'sa-sup-ship-sheet';
    mask.innerHTML =
      '<div class="sa-sup-ship-sheet__mask" data-ship-close></div>' +
      '<div class="sa-sup-ship-sheet__panel" role="dialog" aria-labelledby="saSupShipTitle">' +
      '<div class="sa-sup-ship-sheet__head">' +
      '<h3 id="saSupShipTitle" class="sa-sup-ship-sheet__title">' +
      escapeHtml(opts.title || '上传快递单') +
      '</h3>' +
      '<button type="button" class="sa-sup-ship-sheet__close" data-ship-close aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="sa-sup-ship-sheet__body">' +
      '<div class="sa-sup-ship-field">' +
      '<div class="sa-sup-ship-field__label-row">' +
      '<span class="sa-sup-ship-field__label">关联商品</span>' +
      '<button type="button" class="sa-sup-ship-field__link" data-ship-toggle-all>取消全选</button>' +
      '</div>' +
      '<div class="sa-sup-ship-goods">' +
      goodsHtml +
      '</div></div>' +
      '<div class="sa-sup-ship-field sa-sup-ship-field--input">' +
      '<span class="sa-sup-ship-field__label">物流单号</span>' +
      '<input type="text" class="sa-sup-ship-field__input" id="saSupShipTracking" maxlength="50" autocomplete="off" spellcheck="false" placeholder="请输入物流单号，将自动识别快递公司" value="' +
      escapeHtml(order.expressNo || order.trackingNo || '') +
      '">' +
      '<button type="button" class="sa-sup-ship-field__scan" id="saSupShipScanBtn" aria-label="扫一扫">' +
      SCAN_SVG +
      '<span class="sa-sup-ship-field__scan-txt">扫一扫</span>' +
      '</button></div>' +
      '<button type="button" class="sa-sup-ship-field sa-sup-ship-field--tap" id="saSupShipCourierRow">' +
      '<span class="sa-sup-ship-field__label">物流公司</span>' +
      '<span class="sa-sup-ship-field__value' +
      (courier ? '' : ' sa-sup-ship-field__value--ph') +
      '" id="saSupShipCourierValue">' +
      escapeHtml(courier || '请选择快递公司') +
      '</span>' +
      '<span class="sa-sup-ship-field__arrow" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
      '</span></button>' +
      '</div>' +
      '<div class="sa-sup-ship-sheet__foot">' +
      '<button type="button" class="sa-sup-ship-sheet__btn" data-ship-close>取消</button>' +
      '<button type="button" class="sa-sup-ship-sheet__btn sa-sup-ship-sheet__btn--primary" data-ship-submit>确认上传</button>' +
      '</div></div>';

    shell.appendChild(mask);
    requestAnimationFrame(function () {
      mask.classList.add('is-open');
    });

    var trackingInput = mask.querySelector('#saSupShipTracking');
    var courierValueEl = mask.querySelector('#saSupShipCourierValue');
    var toggleAllBtn = mask.querySelector('[data-ship-toggle-all]');
    var goodChecks = mask.querySelectorAll('.sa-sup-ship-good__check');

    function setCourier(next) {
      courier = next || '';
      if (courierValueEl) {
        courierValueEl.textContent = courier || '请选择快递公司';
        courierValueEl.classList.toggle('sa-sup-ship-field__value--ph', !courier);
      }
    }

    function updateToggleAllLabel() {
      if (!toggleAllBtn) return;
      var allChecked = Array.prototype.every.call(goodChecks, function (cb) {
        return cb.checked;
      });
      toggleAllBtn.textContent = allChecked ? '取消全选' : '全选';
    }

    function applyCourierFromTracking() {
      var inferred = inferCourierFromTrackingNo(trackingInput ? trackingInput.value : '');
      if (inferred) setCourier(inferred);
    }

    function fillTrackingFromScan(no) {
      if (!trackingInput) return;
      trackingInput.value = no;
      applyCourierFromTracking();
    }

    function openScanOverlay() {
      closeScan();
      var wrap = document.createElement('div');
      wrap.id = SCAN_ID;
      wrap.className = 'sa-sup-ship-scan';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-label', '扫描快递单号');
      wrap.innerHTML =
        '<div class="sa-sup-ship-scan__mask" data-scan-close></div>' +
        '<div class="sa-sup-ship-scan__panel">' +
        '<h4 class="sa-sup-ship-scan__title">扫一扫</h4>' +
        '<p class="sa-sup-ship-scan__hint">对准快递面单条码 / 二维码</p>' +
        '<div class="sa-sup-ship-scan__frame" aria-hidden="true"><div class="sa-sup-ship-scan__line"></div></div>' +
        '<button type="button" class="sa-sup-ship-scan__simulate" data-scan-simulate>模拟扫描到运单号</button>' +
        '<button type="button" class="sa-sup-ship-scan__cancel" data-scan-close>取消</button>' +
        '</div>';
      mask.appendChild(wrap);
      wrap.addEventListener('click', function (e) {
        if (e.target.closest('[data-scan-close]')) {
          closeScan();
          return;
        }
        if (!e.target.closest('[data-scan-simulate]')) return;
        var no = MOCK_SCAN_NOS[mockScanIdx % MOCK_SCAN_NOS.length];
        mockScanIdx += 1;
        closeScan();
        fillTrackingFromScan(no);
      });
    }

    if (global.LogisticsTrackingNo && trackingInput) {
      global.LogisticsTrackingNo.bindInput(trackingInput);
    }
    if (trackingInput) {
      trackingInput.addEventListener('input', applyCourierFromTracking);
      trackingInput.addEventListener('blur', applyCourierFromTracking);
    }
    if (courier) setCourier(courier);

    var scanBtn = mask.querySelector('#saSupShipScanBtn');
    if (scanBtn) {
      scanBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openScanOverlay();
      });
    }

    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', function () {
        var allChecked = Array.prototype.every.call(goodChecks, function (cb) {
          return cb.checked;
        });
        goodChecks.forEach(function (cb) {
          cb.checked = !allChecked;
          selected[cb.value] = !allChecked;
        });
        updateToggleAllLabel();
      });
    }
    goodChecks.forEach(function (cb) {
      cb.addEventListener('change', function () {
        selected[cb.value] = !!cb.checked;
        updateToggleAllLabel();
      });
    });
    updateToggleAllLabel();

    var courierRow = mask.querySelector('#saSupShipCourierRow');
    if (courierRow) {
      courierRow.addEventListener('click', function () {
        openCourierPicker(courier, function (picked) {
          setCourier(picked);
        });
      });
    }

    mask.addEventListener('click', function (e) {
      if (e.target.closest('[data-ship-close]')) {
        closeSheet();
        return;
      }
      if (!e.target.closest('[data-ship-submit]')) return;

      var pickedGoods = [];
      goodChecks.forEach(function (cb) {
        if (!cb.checked) return;
        var g = goods.find(function (item) {
          return item.id === cb.value;
        });
        if (g) pickedGoods.push(g);
      });
      if (!pickedGoods.length) {
        toast('请至少选择一个关联商品');
        return;
      }

      var trackingCheck =
        global.LogisticsTrackingNo && typeof global.LogisticsTrackingNo.validate === 'function'
          ? global.LogisticsTrackingNo.validate(trackingInput ? trackingInput.value : '')
          : {
              ok: !!(trackingInput && String(trackingInput.value || '').trim()),
              value: trackingInput ? String(trackingInput.value || '').trim() : '',
              message: '请输入物流单号'
            };
      if (!trackingCheck.ok) {
        if (global.LogisticsTrackingNo && global.LogisticsTrackingNo.toastError) {
          global.LogisticsTrackingNo.toastError(trackingCheck, toast);
        } else {
          toast(trackingCheck.message || '请输入物流单号');
        }
        return;
      }
      if (trackingInput) trackingInput.value = trackingCheck.value;
      applyCourierFromTracking();
      if (!courier) {
        toast('未能识别快递公司，请手动选择物流公司');
        return;
      }

      var payload = {
        goods: pickedGoods,
        courier: courier,
        trackingNo: trackingCheck.value
      };
      if (global.FybSupplierOrders && typeof global.FybSupplierOrders.applyShip === 'function') {
        global.FybSupplierOrders.applyShip(order, payload);
      } else {
        order.expressNo = trackingCheck.value;
        order.courier = courier;
        order.status = '待收货';
        order.shippedGoods = pickedGoods;
      }
      closeSheet();
      if (typeof opts.onSaved === 'function') opts.onSaved(order, payload);
    });
  }

  global.FybSupplierShip = {
    open: open,
    close: closeSheet,
    couriers: COURIERS
  };
})(typeof window !== 'undefined' ? window : this);
