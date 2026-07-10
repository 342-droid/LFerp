(function () {
  var CHECKOUT_KEY = 'ua_checkout_v1';
  var CART_PAGE_KEY = 'ua_restock_cart_page_v2';
  var CHEVRON = '<svg class="ua-co-package__row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

  var PLATFORM_FREIGHT = { threshold: 399, fee: 6 };

  /** 供应商直配到门店（到店）；其余经仓库分拣为仓配 */
  var DIRECT_TO_STORE_SUPPLIERS = {
    'supplier-xianfeng': true
  };

  var WAREHOUSE_RULES = {
    'supplier-jiangnan': [
      { id: 'wh-xiaoshan', name: '杭州萧山仓', match: /eggplant/ },
      { id: 'wh-yuhang', name: '杭州余杭仓', match: /tomato/ },
      { id: 'wh-linping', name: '杭州临平仓', match: /.*/ }
    ],
    'supplier-xianfeng': [{ id: 'wh-xf-hz', name: '鲜丰杭州仓', match: /.*/ }],
    'supplier-lengfeng': [{ id: 'wh-lf-cold', name: '冷丰中央仓', match: /.*/ }],
    'supplier-huadong': [{ id: 'wh-hd-cold', name: '华东冷链仓', match: /.*/ }],
    'supplier-default': [{ id: 'wh-default', name: '平台统配仓', match: /.*/ }]
  };

  var COUPONS = {
    available: [
      { id: 'c10', amount: 10, cond: '满99可用', title: '全场通用券', expire: '2026.12.31到期', minAmount: 99 },
      { id: 'c20', amount: 20, cond: '满199可用', title: '进货专享券', expire: '2026.11.30到期', minAmount: 199 }
    ],
    unavailable: [
      { id: 'c50', amount: 50, cond: '满500可用', title: '大额满减券', expire: '2026.10.01到期', minAmount: 500, reason: '未达到使用门槛' }
    ]
  };

  var TIME_DATES = [
    { key: 'today', label: '今天\n07-10' },
    { key: 'tomorrow', label: '明天\n07-11' },
    { key: 'day3', label: '后天\n07-12' }
  ];

  var TIME_SLOTS = {
    today: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'],
    tomorrow: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
    day3: ['09:00-11:00', '14:00-16:00', '16:00-18:00']
  };

  var state = null;
  var timeCtx = null;
  var payPwd = '';
  var couponTab = 'available';

  function formatMoney(num) {
    return '¥' + num.toFixed(2);
  }

  function readCheckoutPayload() {
    try {
      var raw = sessionStorage.getItem(CHECKOUT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function getDefaultCheckoutState() {
    return {
      store: {
        name: '悠悠生鲜超市',
        contact: '张店长',
        phone: '138****6688',
        address: '浙江省杭州市萧山区建设一路88号'
      },
      suppliers: [
        {
          id: 'supplier-jiangnan',
          name: '江南果蔬批发',
          packages: [
            {
              id: 'pkg-jn-1',
              warehouseId: 'wh-xiaoshan',
              warehouse: '杭州萧山仓',
              deliveryType: 'warehouse',
              deliveryTime: '今天 14:00-16:00',
              remark: '',
              items: [
                {
                  id: 'eggplant-long-5',
                  title: '长茄子 广茄',
                  spec: '5斤',
                  priceNum: 21,
                  qty: 1,
                  img: '../assets/restock/product-eggplant-long.svg'
                }
              ]
            },
            {
              id: 'pkg-jn-2',
              warehouseId: 'wh-yuhang',
              warehouse: '杭州余杭仓',
              deliveryType: 'warehouse',
              deliveryTime: '',
              remark: '',
              items: [
                {
                  id: 'tomato-1',
                  title: '普罗旺斯西红柿',
                  spec: '5斤',
                  priceNum: 29,
                  qty: 2,
                  img: '../assets/restock/product-tomato.svg'
                },
                {
                  id: 'tomato-2',
                  title: '硬粉西红柿 优质',
                  spec: '10斤',
                  priceNum: 46,
                  qty: 1,
                  img: '../assets/restock/product-tomato.svg'
                },
                {
                  id: 'caul-1',
                  title: '有机菜花 优质',
                  spec: '5斤',
                  priceNum: 24,
                  qty: 2,
                  img: '../assets/restock/product-leaf.svg'
                }
              ]
            }
          ]
        },
        {
          id: 'supplier-xianfeng',
          name: '鲜丰蔬菜批发',
          packages: [
            {
              id: 'pkg-xf-1',
              warehouseId: 'wh-xf-hz',
              warehouse: '鲜丰杭州仓',
              deliveryType: 'store',
              deliveryTime: '',
              remark: '',
              items: [
                {
                  id: 'leaf-y1-10',
                  title: '油麦菜【菜鲜】',
                  spec: '10斤',
                  priceNum: 30,
                  qty: 1,
                  img: '../assets/restock/product-leaf.svg'
                }
              ]
            }
          ]
        }
      ],
      coupon: COUPONS.available[0],
      pointsEnabled: false,
      pointsAvailable: 1200,
      pointsDeduct: 12,
      invoice: { type: 'none', headerType: 'company', title: '悠悠生鲜超市', taxNo: '91330109MA2XXXXXX', email: 'finance@youyou.com' },
      activityDiscount: 5
    };
  }

  function resolveWarehouse(supplierId, item) {
    var rules = WAREHOUSE_RULES[supplierId] || WAREHOUSE_RULES['supplier-default'];
    var key = (item.spuId || item.id || '').toLowerCase();
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].match.test(key)) return rules[i];
    }
    return rules[rules.length - 1];
  }

  function resolveDeliveryType(supplierId) {
    return DIRECT_TO_STORE_SUPPLIERS[supplierId] ? 'store' : 'warehouse';
  }

  function getPackageDeliveryLabel(pkg) {
    return pkg.deliveryType === 'store' ? '到店' : '仓配';
  }

  function buildCheckoutFromItems(items, store) {
    var supplierMap = {};
    items.forEach(function (item) {
      var sid = item.supplierId || 'supplier-default';
      var sname = item.supplierName || '冷丰优选供应链';
      if (!supplierMap[sid]) {
        supplierMap[sid] = { id: sid, name: sname, packages: {} };
      }
      var wh = resolveWarehouse(sid, item);
      var pkgKey = resolveDeliveryType(sid) + ':' + wh.id;
      if (!supplierMap[sid].packages[pkgKey]) {
        supplierMap[sid].packages[pkgKey] = {
          id: 'pkg-' + sid + '-' + wh.id,
          warehouseId: wh.id,
          warehouse: wh.name,
          deliveryType: resolveDeliveryType(sid),
          deliveryTime: '',
          remark: '',
          items: []
        };
      }
      supplierMap[sid].packages[pkgKey].items.push({
        id: item.id,
        title: item.title,
        spec: item.spec || '',
        priceNum: item.priceNum,
        qty: item.qty || 1,
        img: item.img || '../assets/restock/product-leaf.svg',
        spuId: item.spuId || ''
      });
    });

    var suppliers = Object.keys(supplierMap).map(function (sid) {
      var s = supplierMap[sid];
      return {
        id: s.id,
        name: s.name,
        packages: Object.keys(s.packages).map(function (k) {
          return s.packages[k];
        })
      };
    });

    var base = getDefaultCheckoutState();
    base.store = store || base.store;
    base.suppliers = suppliers.length ? suppliers : base.suppliers;
    return base;
  }

  function applyDefaultDeliveryTimes() {
    var slotLabels = ['今天 14:00-16:00', '明天 11:00-13:00', '后天 09:00-11:00'];
    var n = 0;
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        if (!pkg.deliveryTime) {
          pkg.deliveryTime = slotLabels[n % slotLabels.length];
          n += 1;
        }
      });
    });
  }

  function initState() {
    var payload = readCheckoutPayload();
    if (payload && payload.items && payload.items.length) {
      state = buildCheckoutFromItems(payload.items, payload.store);
    } else {
      state = getDefaultCheckoutState();
    }
    applyDefaultDeliveryTimes();
    autoSelectCoupon();
  }

  function getGoodsSubtotal() {
    var total = 0;
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        (pkg.items || []).forEach(function (item) {
          total += item.priceNum * item.qty;
        });
      });
    });
    return total;
  }

  function calcFreight(subtotal) {
    if (subtotal >= PLATFORM_FREIGHT.threshold) return 0;
    return PLATFORM_FREIGHT.fee;
  }

  function getPayable() {
    var goods = getGoodsSubtotal();
    var freight = calcFreight(goods);
    var coupon = state.coupon ? state.coupon.amount : 0;
    var points = state.pointsEnabled ? state.pointsDeduct : 0;
    var activity = state.activityDiscount || 0;
    return Math.max(0, goods + freight - coupon - points - activity);
  }

  function autoSelectCoupon() {
    var goods = getGoodsSubtotal();
    var best = null;
    COUPONS.available.forEach(function (c) {
      if (goods >= c.minAmount && (!best || c.amount > best.amount)) best = c;
    });
    state.coupon = best;
  }

  function renderStore() {
    var s = state.store;
    var nameEl = document.getElementById('checkoutStoreName');
    var contactEl = document.getElementById('checkoutStoreContact');
    var addrEl = document.getElementById('checkoutStoreAddr');
    if (nameEl) nameEl.textContent = s.name;
    if (contactEl) contactEl.textContent = s.contact + ' ' + s.phone;
    if (addrEl) addrEl.textContent = s.address;
  }

  function formatItemPrice(num) {
    var n = Math.round(num * 100) / 100;
    var str =
      n % 1 === 0
        ? String(Math.round(n))
        : Math.round(n * 10) === n * 10
          ? n.toFixed(1)
          : n.toFixed(2);
    str = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return '¥ ' + str;
  }

  function getPackageItemQty(items) {
    return (items || []).reduce(function (sum, item) {
      return sum + (item.qty || 0);
    }, 0);
  }

  function renderItemHtml(item) {
    var specHtml = item.spec
      ? '<span class="ua-co-item__spec-pill">' + item.spec + '</span>'
      : '';
    return (
      '<div class="ua-co-item">' +
      '<img class="ua-co-item__img" src="' +
      item.img +
      '" alt="">' +
      '<div class="ua-co-item__body">' +
      '<h4 class="ua-co-item__title">' +
      item.title +
      '</h4>' +
      specHtml +
      '<div class="ua-co-item__bottom">' +
      '<span class="ua-co-item__price">' +
      formatItemPrice(item.priceNum) +
      '</span>' +
      '<span class="ua-co-item__qty">×' +
      item.qty +
      '</span></div></div></div>'
    );
  }

  function renderPackageMultiHtml(pkg) {
    var items = pkg.items || [];
    var totalQty = getPackageItemQty(items);
    var thumbs = items
      .slice(0, 4)
      .map(function (it) {
        var badge = it.qty > 1 ? '<span class="ua-co-package__thumb-badge">' + it.qty + '</span>' : '';
        return (
          '<div class="ua-co-package__thumb">' +
          '<img src="' +
          it.img +
          '" alt="">' +
          badge +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="ua-co-package__multi">' +
      '<div class="ua-co-package__thumbs">' +
      thumbs +
      '</div>' +
      '<button type="button" class="ua-co-package__count" data-expand-pkg="' +
      pkg.id +
      '">共' +
      totalQty +
      '件' +
      CHEVRON +
      '</button></div>'
    );
  }

  function renderPackageHtml(supplier, pkg, pkgIndex) {
    var items = pkg.items || [];
    var multi = items.length > 1;
    var bodyHtml = multi
      ? renderPackageMultiHtml(pkg)
      : items.length
        ? renderItemHtml(items[0])
        : '';
    var timeLabel = pkg.deliveryTime || '选择时间';

    return (
      '<div class="ua-co-card ua-co-package-card" data-pkg-id="' +
      pkg.id +
      '">' +
      '<div class="ua-co-package__head">' +
      '<span class="ua-co-package__label">包裹' +
      (pkgIndex + 1) +
      '（' +
      getPackageDeliveryLabel(pkg) +
      '）</span>' +
      '<button type="button" class="ua-co-package__time' +
      (pkg.deliveryTime ? ' ua-co-package__time--picked' : '') +
      '" data-time-pkg="' +
      pkg.id +
      '" data-supplier-id="' +
      supplier.id +
      '" id="pkgTime-' +
      pkg.id +
      '">' +
      timeLabel +
      CHEVRON +
      '</button></div>' +
      '<div class="ua-co-package__body" id="pkgItems-' +
      pkg.id +
      '">' +
      bodyHtml +
      '</div>' +
      '<div class="ua-co-package__remark-row">' +
      '<span class="ua-co-package__remark-label">备注</span>' +
      '<input type="text" class="ua-co-package__remark-input" data-remark-pkg="' +
      pkg.id +
      '" placeholder="填写备注30字以内" maxlength="30" value="' +
      (pkg.remark || '') +
      '">' +
      '</div></div>'
    );
  }

  function renderSuppliers() {
    var el = document.getElementById('checkoutSupplierList');
    if (!el) return;
    el.innerHTML = (state.suppliers || [])
      .map(function (sup) {
        var pkgsHtml = (sup.packages || [])
          .map(function (pkg, idx) {
            return renderPackageHtml(sup, pkg, idx);
          })
          .join('');
        return (
          '<section class="ua-co-supplier-block" data-supplier-id="' +
          sup.id +
          '">' +
          '<div class="ua-co-supplier__head">' +
          '<svg class="ua-co-supplier__icon" viewBox="0 0 24 24" fill="none"><path d="M6 3h12l2 4v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3h2z" fill="#FFB800"/><path d="M8 3h8v3H8V3z" fill="#FF9500"/></svg>' +
          '<span class="ua-co-supplier__name">' +
          sup.name +
          '</span></div>' +
          pkgsHtml +
          '</section>'
        );
      })
      .join('');
  }

  function renderSummary() {
    var goods = getGoodsSubtotal();
    var freight = calcFreight(goods);
    var coupon = state.coupon ? state.coupon.amount : 0;
    var points = state.pointsEnabled ? state.pointsDeduct : 0;
    var activity = state.activityDiscount || 0;
    var payable = getPayable();

    setText('checkoutGoodsTotal', formatMoney(goods));
    setText('checkoutFreight', freight > 0 ? formatMoney(freight) : '免运费');
    setText('checkoutActivityDiscount', activity > 0 ? '-' + formatMoney(activity) : '-¥0.00');
    setText('checkoutCouponDiscount', state.coupon ? '-¥' + coupon.toFixed(2) : '-¥0.00');
    setText('checkoutPayable', formatMoney(payable));
    setText('checkoutFooterTotal', formatMoney(payable));

    var couponRow = document.getElementById('checkoutCouponDiscountRow');
    if (couponRow) couponRow.hidden = !state.coupon;
    var pointsRow = document.getElementById('checkoutPointsDiscountRow');
    if (pointsRow) pointsRow.hidden = !state.pointsEnabled;

    var couponText = document.getElementById('checkoutCouponText');
    if (couponText) {
      couponText.textContent = state.coupon ? '-¥' + state.coupon.amount.toFixed(2) : '暂无可用';
      couponText.classList.toggle('ua-co-row__value--accent', !!state.coupon);
    }

    var pointsHint = document.getElementById('checkoutPointsHint');
    if (pointsHint) {
      pointsHint.textContent = '可用' + state.pointsAvailable + '积分，抵¥' + state.pointsDeduct.toFixed(2);
    }
    var pointsToggle = document.getElementById('checkoutPointsToggle');
    if (pointsToggle) pointsToggle.checked = !!state.pointsEnabled;

    renderInvoiceText();
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderInvoiceText() {
    var el = document.getElementById('checkoutInvoiceText');
    if (!el) return;
    if (state.invoice.type === 'none') {
      el.textContent = '不开发票';
      return;
    }
    var headerLabel = state.invoice.headerType === 'sole' ? '个体工商户' : '公司';
    el.textContent = '电子普通发票（' + headerLabel + '）';
  }

  function renderAll() {
    renderStore();
    renderSuppliers();
    renderSummary();
  }

  function findPackage(pkgId) {
    var found = null;
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        if (pkg.id === pkgId) found = { supplier: sup, package: pkg };
      });
    });
    return found;
  }

  function openSheet(name) {
    var map = {
      time: 'checkoutTimeSheet',
      coupon: 'checkoutCouponSheet',
      invoice: 'checkoutInvoiceSheet',
      pay: 'checkoutPaySheet'
    };
    var el = document.getElementById(map[name]);
    if (el) {
      el.hidden = false;
      document.body.classList.add('ua-checkout-sheet-open');
    }
  }

  function closeSheet(name) {
    var map = {
      time: 'checkoutTimeSheet',
      coupon: 'checkoutCouponSheet',
      invoice: 'checkoutInvoiceSheet',
      pay: 'checkoutPaySheet'
    };
    var el = document.getElementById(map[name]);
    if (el) el.hidden = true;
    if (!document.querySelector('.ua-co-sheet:not([hidden])')) {
      document.body.classList.remove('ua-checkout-sheet-open');
    }
  }

  function openTimeSheet(supplierId, pkgId) {
    timeCtx = { supplierId: supplierId, pkgId: pkgId, dateKey: 'today', slot: '' };
    renderTimeSheet();
    openSheet('time');
  }

  function renderTimeSheet() {
    var datesEl = document.getElementById('checkoutTimeDates');
    var slotsEl = document.getElementById('checkoutTimeSlots');
    if (!datesEl || !slotsEl || !timeCtx) return;

    datesEl.innerHTML = TIME_DATES.map(function (d) {
      return (
        '<button type="button" class="ua-co-time__date' +
        (timeCtx.dateKey === d.key ? ' ua-co-time__date--active' : '') +
        '" data-date-key="' +
        d.key +
        '">' +
        d.label.replace('\n', '<br>') +
        '</button>'
      );
    }).join('');

    var slots = TIME_SLOTS[timeCtx.dateKey] || [];
    slotsEl.innerHTML = slots
      .map(function (slot) {
        var active = timeCtx.slot === slot;
        return (
          '<button type="button" class="ua-co-time__slot' +
          (active ? ' ua-co-time__slot--active' : '') +
          '" data-time-slot="' +
          slot +
          '">' +
          slot +
          '</button>'
        );
      })
      .join('');
  }

  function confirmTimeSelection() {
    if (!timeCtx || !timeCtx.slot) return;
    var found = findPackage(timeCtx.pkgId);
    if (!found) return;
    var dateLabel = TIME_DATES.find(function (d) {
      return d.key === timeCtx.dateKey;
    });
    var label = (dateLabel ? dateLabel.label.split('\n')[0] : '今天') + ' ' + timeCtx.slot;
    found.package.deliveryTime = label;
    closeSheet('time');
    renderSuppliers();
  }

  function renderCouponList() {
    var listEl = document.getElementById('checkoutCouponList');
    if (!listEl) return;
    var goods = getGoodsSubtotal();
    var list = COUPONS[couponTab] || [];

    listEl.innerHTML = list
      .map(function (c) {
        var disabled = couponTab === 'unavailable' || goods < c.minAmount;
        var active = state.coupon && state.coupon.id === c.id;
        return (
          '<div class="ua-co-coupon' +
          (active ? ' ua-co-coupon--active' : '') +
          (disabled ? ' ua-co-coupon--disabled' : '') +
          '" data-coupon-id="' +
          c.id +
          '"' +
          (disabled ? ' data-disabled="1"' : '') +
          '>' +
          '<div class="ua-co-coupon__left">' +
          '<div class="ua-co-coupon__amount"><small>¥</small>' +
          c.amount +
          '</div>' +
          '<div class="ua-co-coupon__cond">' +
          c.cond +
          '</div></div>' +
          '<div class="ua-co-coupon__right">' +
          '<div class="ua-co-coupon__title">' +
          c.title +
          '</div>' +
          '<div class="ua-co-coupon__expire">' +
          c.expire +
          '</div>' +
          (c.reason ? '<div class="ua-co-coupon__reason">' + c.reason + '</div>' : '') +
          '</div></div>'
        );
      })
      .join('');

    document.querySelectorAll('[data-coupon-tab]').forEach(function (btn) {
      var tab = btn.getAttribute('data-coupon-tab');
      var count = (COUPONS[tab] || []).length;
      btn.textContent = (tab === 'available' ? '可用' : '不可用') + '(' + count + ')';
      btn.classList.toggle('ua-co-tab--active', tab === couponTab);
    });
  }

  function openCouponSheet() {
    couponTab = 'available';
    renderCouponList();
    openSheet('coupon');
  }

  function syncInvoiceFormFromState() {
    document.querySelectorAll('[data-invoice-type]').forEach(function (btn) {
      btn.classList.toggle('ua-co-chip--active', btn.getAttribute('data-invoice-type') === state.invoice.type);
    });
    document.querySelectorAll('[data-invoice-header]').forEach(function (btn) {
      btn.classList.toggle('ua-co-chip--active', btn.getAttribute('data-invoice-header') === state.invoice.headerType);
    });
    var form = document.getElementById('checkoutInvoiceForm');
    if (form) form.hidden = state.invoice.type === 'none';
    var title = document.getElementById('checkoutInvoiceTitle');
    var taxNo = document.getElementById('checkoutInvoiceTaxNo');
    var email = document.getElementById('checkoutInvoiceEmail');
    if (title) title.value = state.invoice.title || '';
    if (taxNo) taxNo.value = state.invoice.taxNo || '';
    if (email) email.value = state.invoice.email || '';
  }

  function openInvoiceSheet() {
    syncInvoiceFormFromState();
    openSheet('invoice');
  }

  function confirmInvoice() {
    var title = document.getElementById('checkoutInvoiceTitle');
    var taxNo = document.getElementById('checkoutInvoiceTaxNo');
    var email = document.getElementById('checkoutInvoiceEmail');
    if (state.invoice.type === 'electronic') {
      if (!title || !title.value.trim()) {
        window.alert('请填写抬头名称');
        return;
      }
      if (!taxNo || !taxNo.value.trim()) {
        window.alert('请填写纳税人识别号');
        return;
      }
      state.invoice.title = title.value.trim();
      state.invoice.taxNo = taxNo.value.trim();
      state.invoice.email = email ? email.value.trim() : '';
    }
    closeSheet('invoice');
    renderSummary();
  }

  function openPaySheet() {
    payPwd = '';
    updatePayPwdDisplay();
    setText('checkoutPayAmount', formatMoney(getPayable()));
    openSheet('pay');
  }

  function updatePayPwdDisplay() {
    var dots = document.querySelectorAll('#checkoutPayPwd span');
    dots.forEach(function (dot, i) {
      dot.classList.toggle('filled', i < payPwd.length);
      dot.textContent = '';
    });
  }

  function onPayKey(key) {
    if (key === 'del') {
      payPwd = payPwd.slice(0, -1);
    } else if (payPwd.length < 6) {
      payPwd += key;
    }
    updatePayPwdDisplay();
    if (payPwd.length === 6) {
      window.setTimeout(function () {
        closeSheet('pay');
        var success = payPwd !== '000000';
        showResult(success);
      }, 300);
    }
  }

  function showResult(success) {
    var el = document.getElementById('checkoutResult');
    var body = document.getElementById('checkoutResultBody');
    if (!el || !body) return;

    document.getElementById('checkoutScroll').hidden = true;
    document.getElementById('checkoutFooter').hidden = true;
    el.hidden = false;

    if (success) {
      body.innerHTML =
        '<div class="ua-co-result__icon ua-co-result__icon--success">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg></div>' +
        '<div class="ua-co-result__title">支付成功</div>' +
        '<div class="ua-co-result__amount">' +
        formatMoney(getPayable()) +
        '</div>' +
        '<div class="ua-co-result__actions">' +
        '<button type="button" class="ua-co-result__btn" id="checkoutResultOrders">查看订单</button>' +
        '<button type="button" class="ua-co-result__btn ua-co-result__btn--primary" id="checkoutResultHome">返回首页</button>' +
        '</div>' +
        '<div class="ua-co-result__recommend">' +
        '<div class="ua-co-result__recommend-title">猜你喜欢</div>' +
        '<div class="ua-co-result__grid">' +
        '<div class="ua-co-result__product"><img src="../assets/restock/product-egg.svg" alt=""><div class="ua-co-result__product-name">红壳黄心鲜鸡蛋 中码 托装</div><div class="ua-co-result__product-price">¥28.90</div></div>' +
        '<div class="ua-co-result__product"><img src="../assets/restock/product-leaf.svg" alt=""><div class="ua-co-result__product-name">油麦菜【菜鲜】</div><div class="ua-co-result__product-price">¥3.20</div></div>' +
        '</div></div>';
      document.getElementById('checkoutResultOrders').addEventListener('click', function () {
        window.location.href = 'orders.html?from=restock.html&tab=unpaid';
      });
      document.getElementById('checkoutResultHome').addEventListener('click', function () {
        window.location.href = 'restock.html';
      });
      clearCartSelectedItems();
    } else {
      body.innerHTML =
        '<div class="ua-co-result__icon ua-co-result__icon--fail">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/></svg></div>' +
        '<div class="ua-co-result__title">支付失败</div>' +
        '<div class="ua-co-result__sub">请在 30 分钟内完成支付</div>' +
        '<div class="ua-co-result__actions">' +
        '<button type="button" class="ua-co-result__btn ua-co-result__btn--primary" id="checkoutResultRetry">重新支付</button>' +
        '<button type="button" class="ua-co-result__btn" id="checkoutResultView">查看订单</button>' +
        '</div>';
      document.getElementById('checkoutResultRetry').addEventListener('click', function () {
        el.hidden = true;
        document.getElementById('checkoutScroll').hidden = false;
        document.getElementById('checkoutFooter').hidden = false;
        openPaySheet();
      });
      document.getElementById('checkoutResultView').addEventListener('click', function () {
        window.location.href = 'orders.html?from=restock.html&tab=unpaid';
      });
    }
  }

  function clearCartSelectedItems() {
    try {
      var raw = localStorage.getItem(CART_PAGE_KEY);
      if (!raw) return;
      var cartState = JSON.parse(raw);
      (cartState.stores || []).forEach(function (store) {
        (store.blocks || []).forEach(function (block) {
          block.items = (block.items || []).filter(function (item) {
            return !item.selected;
          });
        });
      });
      localStorage.setItem(CART_PAGE_KEY, JSON.stringify(cartState));
    } catch (e) {
      /* ignore */
    }
    sessionStorage.removeItem(CHECKOUT_KEY);
  }

  function expandPackage(pkgId) {
    var found = findPackage(pkgId);
    if (!found) return;
    var container = document.getElementById('pkgItems-' + pkgId);
    if (!container) return;
    container.innerHTML = (found.package.items || []).map(renderItemHtml).join('');
  }

  function validateBeforeSubmit() {
    var missing = [];
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg, idx) {
        if (!pkg.deliveryTime) {
          missing.push(sup.name + ' 包裹' + (idx + 1));
        }
      });
    });
    if (missing.length) {
      window.alert('请选择以下包裹的送达时间：\n' + missing.join('\n'));
      return false;
    }
    return true;
  }

  function bindEvents() {
    document.getElementById('checkoutStoreCard') &&
      document.getElementById('checkoutStoreCard').addEventListener('click', function () {
        window.alert('切换配送门店（演示）');
      });

    document.getElementById('checkoutSupplierList') &&
      document.getElementById('checkoutSupplierList').addEventListener('click', function (e) {
        var timeBtn = e.target.closest('[data-time-pkg]');
        if (timeBtn) {
          openTimeSheet(timeBtn.getAttribute('data-supplier-id'), timeBtn.getAttribute('data-time-pkg'));
          return;
        }
        var expandBtn = e.target.closest('[data-expand-pkg]');
        if (expandBtn) expandPackage(expandBtn.getAttribute('data-expand-pkg'));
      });

    document.getElementById('checkoutSupplierList') &&
      document.getElementById('checkoutSupplierList').addEventListener('input', function (e) {
        var input = e.target.closest('[data-remark-pkg]');
        if (!input) return;
        var found = findPackage(input.getAttribute('data-remark-pkg'));
        if (found) found.package.remark = input.value;
      });

    document.getElementById('checkoutCouponRow') &&
      document.getElementById('checkoutCouponRow').addEventListener('click', openCouponSheet);

    document.getElementById('checkoutPointsToggle') &&
      document.getElementById('checkoutPointsToggle').addEventListener('change', function (e) {
        state.pointsEnabled = e.target.checked;
        renderSummary();
      });

    document.getElementById('checkoutInvoiceRow') &&
      document.getElementById('checkoutInvoiceRow').addEventListener('click', openInvoiceSheet);

    document.querySelectorAll('[data-sheet-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-sheet-close'));
      });
    });

    document.getElementById('checkoutTimeDates') &&
      document.getElementById('checkoutTimeDates').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-date-key]');
        if (!btn || !timeCtx) return;
        timeCtx.dateKey = btn.getAttribute('data-date-key');
        timeCtx.slot = '';
        renderTimeSheet();
      });

    document.getElementById('checkoutTimeSlots') &&
      document.getElementById('checkoutTimeSlots').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-time-slot]');
        if (!btn || !timeCtx) return;
        timeCtx.slot = btn.getAttribute('data-time-slot');
        renderTimeSheet();
        confirmTimeSelection();
      });

    document.getElementById('checkoutCouponTabs') &&
      document.getElementById('checkoutCouponTabs').addEventListener('click', function (e) {
        var tab = e.target.closest('[data-coupon-tab]');
        if (!tab) return;
        couponTab = tab.getAttribute('data-coupon-tab');
        renderCouponList();
      });

    document.getElementById('checkoutCouponList') &&
      document.getElementById('checkoutCouponList').addEventListener('click', function (e) {
        var card = e.target.closest('[data-coupon-id]');
        if (!card || card.getAttribute('data-disabled') === '1') return;
        var id = card.getAttribute('data-coupon-id');
        var found = COUPONS.available.find(function (c) {
          return c.id === id;
        });
        if (found) {
          state.coupon = found;
          closeSheet('coupon');
          renderSummary();
        }
      });

    document.getElementById('checkoutCouponSkip') &&
      document.getElementById('checkoutCouponSkip').addEventListener('click', function () {
        state.coupon = null;
        closeSheet('coupon');
        renderSummary();
      });

    document.querySelectorAll('[data-invoice-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.invoice.type = btn.getAttribute('data-invoice-type');
        syncInvoiceFormFromState();
      });
    });

    document.querySelectorAll('[data-invoice-header]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.invoice.headerType = btn.getAttribute('data-invoice-header');
        syncInvoiceFormFromState();
      });
    });

    document.getElementById('checkoutInvoiceConfirm') &&
      document.getElementById('checkoutInvoiceConfirm').addEventListener('click', confirmInvoice);

    document.getElementById('checkoutKeypad') &&
      document.getElementById('checkoutKeypad').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-key]');
        if (!btn) return;
        onPayKey(btn.getAttribute('data-key'));
      });

    document.getElementById('checkoutSubmitBtn') &&
      document.getElementById('checkoutSubmitBtn').addEventListener('click', function () {
        if (!validateBeforeSubmit()) return;
        openPaySheet();
      });

    var params = new URLSearchParams(window.location.search);
    var back = document.getElementById('checkoutBack');
    if (back && params.get('from') === 'restock.html') {
      back.setAttribute('href', 'restock.html?tab=cart');
    }
  }

  initState();
  renderAll();
  bindEvents();
})();
