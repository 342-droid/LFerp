(function () {
  var CHECKOUT_KEY = 'ua_checkout_v1';
  var CART_PAGE_KEY = 'ua_restock_cart_page_v2';
  var CHEVRON = '<svg class="ua-co-package__row-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

  /* 与进货购物车一致：配送按货款阶梯；现阶段快递不收运费 */
  var DELIVERY_FREIGHT_TIERS = [
    { start: 0, end: 200, freight: 12 },
    { start: 200, end: 399, freight: 8 },
    { start: 399, end: Infinity, freight: 0 }
  ];

  var FULFILLMENT_BY_SPU = {
    cola: '快递',
    water: '快递',
    tea: '快递',
    egg: '快递',
    'eggplant-long': '配送',
    'eggplant-round': '配送',
    'leaf-y1': '配送',
    'leaf-y4': '配送',
    tomato: '配送',
    'leaf-c1': '配送',
    caul: '配送'
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

  var state = null;
  var payPwd = '';
  var couponTab = 'available';
  var payState = {
    useBalance: true,
    /* wechat | alipay | card */
    channel: 'wechat',
    methodId: '',
    methodName: '',
    methodTone: ''
  };

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
              deliveryTime: '',
              remark: '',
              items: [
                {
                  id: 'eggplant-long-5',
                  title: '长茄子 广茄',
                  spec: '5斤',
                  priceNum: 21,
                  qty: 1,
                  fulfillmentMethod: '配送',
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
                  fulfillmentMethod: '配送',
                  img: '../assets/restock/product-tomato.svg'
                },
                {
                  id: 'tomato-2',
                  title: '硬粉西红柿 优质',
                  spec: '10斤',
                  priceNum: 46,
                  qty: 1,
                  fulfillmentMethod: '配送',
                  img: '../assets/restock/product-tomato.svg'
                },
                {
                  id: 'caul-1',
                  title: '有机菜花 优质',
                  spec: '5斤',
                  priceNum: 24,
                  qty: 2,
                  fulfillmentMethod: '配送',
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
                  fulfillmentMethod: '快递',
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

  function getPackageFulfillment(pkg) {
    return pkg && pkg.deliveryType === 'store' ? '快递' : '配送';
  }

  function getPackageDeliveryLabel(pkg) {
    return getPackageFulfillment(pkg);
  }

  function getPackageGoodsAmount(pkg) {
    return (pkg.items || []).reduce(function (sum, item) {
      return sum + (Number(item.priceNum) || 0) * (Number(item.qty) || 0);
    }, 0);
  }

  function formatEstimatedArrival(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + (offsetDays == null ? 1 : offsetDays));
    return '预计' + (d.getMonth() + 1) + '月' + d.getDate() + '号送达';
  }

  function resolveCheckoutSupplierName(supplierId, fallbackName) {
    if (
      window.MdmSupplierArchiveStore &&
      typeof window.MdmSupplierArchiveStore.getDisplayName === 'function'
    ) {
      return window.MdmSupplierArchiveStore.getDisplayName({
        id: supplierId,
        name: fallbackName
      });
    }
    return fallbackName || '';
  }

  function buildCheckoutFromItems(items, store) {
    var supplierMap = {};
    items.forEach(function (item) {
      var sid = item.supplierId || 'supplier-default';
      var sname = resolveCheckoutSupplierName(
        sid,
        item.supplierName || '冷丰优选供应链'
      );
      if (!supplierMap[sid]) {
        supplierMap[sid] = { id: sid, name: sname, packages: {} };
      }
      var wh = resolveWarehouse(sid, item);
      var fulfillment = resolveFulfillmentMethod(item);
      var deliveryType = fulfillment === '快递' ? 'store' : 'warehouse';
      var pkgKey = deliveryType + ':' + wh.id;
      if (!supplierMap[sid].packages[pkgKey]) {
        supplierMap[sid].packages[pkgKey] = {
          id: 'pkg-' + sid + '-' + deliveryType + '-' + wh.id,
          warehouseId: wh.id,
          warehouse: wh.name,
          deliveryType: deliveryType,
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
        spuId: item.spuId || '',
        fulfillmentMethod: fulfillment
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
    var n = 0;
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        pkg.deliveryTime = formatEstimatedArrival(1 + (n % 2));
        n += 1;
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

  function resolveFulfillmentMethod(item) {
    if (item && item.fulfillmentMethod) return item.fulfillmentMethod;
    var spuId = (item && (item.spuId || item.id)) || '';
    spuId = String(spuId).replace(/-\d+$/, '').replace(/-default$/, '');
    return FULFILLMENT_BY_SPU[spuId] || '配送';
  }

  function matchDeliveryFreight(amount) {
    var amt = Math.max(0, Number(amount) || 0);
    var current = DELIVERY_FREIGHT_TIERS[0];
    for (var i = 0; i < DELIVERY_FREIGHT_TIERS.length; i++) {
      var t = DELIVERY_FREIGHT_TIERS[i];
      if (amt >= t.start && amt < t.end) {
        current = t;
        break;
      }
      if (i === DELIVERY_FREIGHT_TIERS.length - 1 && amt >= t.start) current = t;
    }
    return current ? current.freight : 0;
  }

  function calcFreightBreakdown() {
    var deliveryAmount = 0;
    var expressAmount = 0;
    var packageRows = [];

    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg, idx) {
        var amount = getPackageGoodsAmount(pkg);
        var mode = getPackageFulfillment(pkg);
        if (mode === '快递') expressAmount += amount;
        else deliveryAmount += amount;
        packageRows.push({
          id: pkg.id,
          supplierName: resolveCheckoutSupplierName(sup.id, sup.name),
          pkgIndex: idx + 1,
          mode: mode,
          amount: amount
        });
      });
    });

    var expressFee = 0; /* 现阶段快递不收运费 */
    var deliveryFee = deliveryAmount > 0 ? matchDeliveryFreight(deliveryAmount) : 0;

    var deliveryShares = allocateFreightByAmount(
      packageRows.filter(function (r) {
        return r.mode === '配送';
      }),
      deliveryFee
    );
    var expressShares = allocateFreightByAmount(
      packageRows.filter(function (r) {
        return r.mode === '快递';
      }),
      expressFee
    );
    var shareMap = {};
    deliveryShares.concat(expressShares).forEach(function (s) {
      shareMap[s.id] = s.fee;
    });

    var packages = packageRows.map(function (row) {
      return {
        id: row.id,
        supplierName: row.supplierName,
        pkgIndex: row.pkgIndex,
        mode: row.mode,
        amount: row.amount,
        fee: shareMap[row.id] != null ? shareMap[row.id] : 0
      };
    });

    return {
      expressFee: expressFee,
      deliveryFee: deliveryFee,
      total: expressFee + deliveryFee,
      expressAmount: expressAmount,
      deliveryAmount: deliveryAmount,
      packages: packages,
      label: formatMoney(expressFee + deliveryFee)
    };
  }

  function allocateFreightByAmount(rows, totalFee) {
    if (!rows.length) return [];
    var fee = Math.round((Number(totalFee) || 0) * 100);
    var amountSum = rows.reduce(function (sum, r) {
      return sum + r.amount;
    }, 0);
    if (fee <= 0 || amountSum <= 0) {
      return rows.map(function (r) {
        return { id: r.id, fee: 0 };
      });
    }
    var allocated = 0;
    return rows.map(function (r, idx) {
      var part;
      if (idx === rows.length - 1) {
        part = fee - allocated;
      } else {
        part = Math.round((fee * r.amount) / amountSum);
        allocated += part;
      }
      return { id: r.id, fee: part / 100 };
    });
  }

  function calcFreight() {
    return calcFreightBreakdown().total;
  }

  function getPayable() {
    var goods = getGoodsSubtotal();
    var freight = calcFreight();
    var coupon = state.coupon ? state.coupon.amount : 0;
    var points = state.pointsEnabled ? state.pointsDeduct : 0;
    var activity = state.activityDiscount || 0;
    return Math.max(0, goods + freight - coupon - points - activity);
  }

  function getWalletAvailable() {
    if (window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function') {
      return window.StoreWalletDemo.snapshot().available || 0;
    }
    return 0;
  }

  /** 混合支付拆腿：余额腿 B + 收单腿 A = 应付 P */
  function getPayLegs() {
    var payable = getPayable();
    var available = getWalletAvailable();
    var useBalance = !!payState.useBalance;
    var balanceLeg = useBalance ? Math.min(available, payable) : 0;
    balanceLeg = Math.round(balanceLeg * 100) / 100;
    var channelLeg = Math.round((payable - balanceLeg) * 100) / 100;
    return {
      payable: payable,
      available: available,
      balanceLeg: balanceLeg,
      channelLeg: channelLeg,
      channel: payState.channel || 'wechat',
      needChannel: channelLeg > 0.001,
      balanceOnly: balanceLeg > 0 && channelLeg <= 0.001
    };
  }

  function channelLabel(channel) {
    if (channel === 'balance') return '钱包余额';
    if (channel === 'alipay') return '支付宝';
    if (channel === 'card') return payState.methodName || '快捷银行卡';
    if (payState.methodName && channel === payState.channel) return payState.methodName;
    return '微信支付';
  }

  /** 底部「应付」= 合计 − 钱包可用余额（未开余额时为合计全额） */
  function getFooterPayable(legs) {
    var L = legs || getPayLegs();
    return L.channelLeg;
  }

  function renderPayWays() {
    var legs = getPayLegs();
    var hint = document.getElementById('checkoutWalletHint');
    if (hint) hint.textContent = '可用 ' + formatMoney(legs.available);
    var useBalanceEl = document.getElementById('checkoutUseBalance');
    if (useBalanceEl) useBalanceEl.checked = !!payState.useBalance;
  }

  function buildPayMethods() {
    var cardApi = window.StoreBindCardDemo;
    var cards =
      cardApi && typeof cardApi.listQuickPayCards === 'function'
        ? cardApi.listQuickPayCards()
        : [];
    var cardMethods = cards.map(function (c) {
      return {
        id: 'card:' + c.id,
        type: 'card',
        name: c.bankName + '(' + c.cardTail + ')',
        short: c.bankShort || '卡',
        tone: 'is-card',
        tip: '快捷支付',
        card: c
      };
    });
    return cardMethods.concat([
      {
        id: 'alipay',
        type: 'alipay',
        name: '支付宝',
        short: '支',
        tone: 'is-alipay',
        tip: '跳转支付宝付款'
      },
      {
        id: 'wechat',
        type: 'wechat',
        name: '微信支付',
        short: '微',
        tone: 'is-wechat',
        tip: '跳转微信支付'
      }
    ]);
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

  function maskPhone(phone) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.length >= 7) {
      return digits.slice(0, 3) + '****' + digits.slice(-4);
    }
    return String(phone || '');
  }

  function persistCheckoutStore() {
    try {
      var payload = readCheckoutPayload() || {};
      payload.store = state.store;
      if (!payload.items) payload.items = [];
      sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }

  function applyPickedAddressFromBook() {
    try {
      var raw = sessionStorage.getItem('ua_refund_picked_address');
      if (!raw) return;
      var picked = JSON.parse(raw);
      sessionStorage.removeItem('ua_refund_picked_address');
      if (!picked || !picked.full) return;
      state.store = {
        name: state.store.name || '悠悠生鲜超市',
        contact: picked.contact || state.store.contact,
        phone: maskPhone(picked.phone) || state.store.phone,
        address: picked.full
      };
      persistCheckoutStore();
    } catch (e) {
      /* ignore */
    }
  }

  function openAddressBook() {
    var params = new URLSearchParams(window.location.search);
    var from = params.get('from') || 'restock.html';
    window.location.href =
      'order-refund-address-book.html?addrFrom=checkout&from=' + encodeURIComponent(from);
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
    var timeLabel = pkg.deliveryTime || formatEstimatedArrival(1);

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
      '<span class="ua-co-package__time ua-co-package__time--static" id="pkgTime-' +
      pkg.id +
      '">' +
      timeLabel +
      '</span></div>' +
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
          resolveCheckoutSupplierName(sup.id, sup.name) +
          '</span></div>' +
          pkgsHtml +
          '</section>'
        );
      })
      .join('');
  }

  function renderSummary() {
    var goods = getGoodsSubtotal();
    var freightInfo = calcFreightBreakdown();
    var coupon = state.coupon ? state.coupon.amount : 0;
    var points = state.pointsEnabled ? state.pointsDeduct : 0;
    var activity = state.activityDiscount || 0;
    var payable = getPayable();

    setText('checkoutGoodsTotal', formatMoney(goods));
    setText('checkoutFreight', freightInfo.label);
    setText('checkoutActivityDiscount', activity > 0 ? '-' + formatMoney(activity) : '-¥0.00');
    setText('checkoutCouponDiscount', state.coupon ? '-¥' + coupon.toFixed(2) : '-¥0.00');
    setText('checkoutPayable', formatMoney(payable));
    setText('checkoutFooterTotal', formatMoney(getFooterPayable()));

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
    renderPayWays();
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
      freight: 'checkoutFreightSheet',
      freightRules: 'checkoutFreightRulesSheet',
      coupon: 'checkoutCouponSheet',
      invoice: 'checkoutInvoiceSheet',
      method: 'checkoutMethodSheet',
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
      freight: 'checkoutFreightSheet',
      freightRules: 'checkoutFreightRulesSheet',
      coupon: 'checkoutCouponSheet',
      invoice: 'checkoutInvoiceSheet',
      method: 'checkoutMethodSheet',
      pay: 'checkoutPaySheet'
    };
    var el = document.getElementById(map[name]);
    if (el) el.hidden = true;
    if (!document.querySelector('.ua-co-sheet:not([hidden])')) {
      document.body.classList.remove('ua-checkout-sheet-open');
    }
  }

  function formatFreightTierRange(tier) {
    if (tier.end === Infinity) {
      return '货款满' + formatMoney(tier.start);
    }
    return '货款' + formatMoney(tier.start) + '～' + formatMoney(tier.end);
  }

  function renderFreightRules() {
    var el = document.getElementById('checkoutFreightRulesBody');
    if (!el) return;
    var tiersHtml = DELIVERY_FREIGHT_TIERS.map(function (tier) {
      var feeText = tier.freight <= 0 ? '免运费' : formatMoney(tier.freight);
      return (
        '<div class="ua-co-freight-rules__item">' +
        '<span>' +
        formatFreightTierRange(tier) +
        '</span>' +
        '<span class="ua-co-freight-rules__fee">' +
        feeText +
        '</span></div>'
      );
    }).join('');

    el.innerHTML =
      '<div class="ua-co-freight-rules">' +
      '<p class="ua-co-freight-rules__intro">快递与配送分开计算；同履约方式商品合并货款后匹配档位。现阶段快递不收取运费。</p>' +
      '<div class="ua-co-freight-rules__section">' +
      '<h4 class="ua-co-freight-rules__title">配送运费档位</h4>' +
      tiersHtml +
      '</div>' +
      '<div class="ua-co-freight-rules__section">' +
      '<h4 class="ua-co-freight-rules__title">快递运费</h4>' +
      '<div class="ua-co-freight-rules__item"><span>全部快递订单</span><span class="ua-co-freight-rules__fee">免运费</span></div>' +
      '<p class="ua-co-freight-rules__note">快递暂不收取运费，后续如有调整将按最新规则执行。</p>' +
      '</div></div>';
  }

  function openFreightRulesSheet() {
    renderFreightRules();
    openSheet('freightRules');
  }

  function renderFreightDetail() {
    var el = document.getElementById('checkoutFreightDetail');
    if (!el) return;
    var info = calcFreightBreakdown();
    var pkgsHtml = (info.packages || [])
      .map(function (pkg) {
        return (
          '<div class="ua-co-freight-detail__pkg">' +
          '<div class="ua-co-freight-detail__pkg-main">' +
          '<span class="ua-co-freight-detail__pkg-name">' +
          pkg.supplierName +
          ' 包裹' +
          pkg.pkgIndex +
          '（' +
          pkg.mode +
          '）</span>' +
          '<span class="ua-co-freight-detail__pkg-sub">货款' +
          formatMoney(pkg.amount) +
          '</span></div>' +
          '<span class="ua-co-freight-detail__pkg-fee">' +
          formatMoney(pkg.fee) +
          '</span></div>'
        );
      })
      .join('');

    el.innerHTML =
      '<div class="ua-co-freight-detail">' +
      '<div class="ua-co-freight-detail__totals">' +
      '<div class="ua-co-freight-detail__total"><span>快递总计</span><strong>' +
      formatMoney(info.expressFee) +
      '</strong></div>' +
      '<div class="ua-co-freight-detail__total"><span>配送总计</span><strong>' +
      formatMoney(info.deliveryFee) +
      '</strong></div></div>' +
      '<div class="ua-co-freight-detail__section">' +
      '<h4 class="ua-co-freight-detail__section-title">各包裹均摊</h4>' +
      (pkgsHtml || '<div class="ua-co-freight-detail__pkg"><span>暂无包裹</span></div>') +
      '</div></div>';
  }

  function openFreightSheet() {
    renderFreightDetail();
    openSheet('freight');
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

  function openMethodSheet() {
    var legs = getPayLegs();
    setText('checkoutMethodAmount', formatMoney(legs.channelLeg > 0 ? legs.channelLeg : legs.payable));
    var list = document.getElementById('checkoutMethodList');
    if (!list) return;
    var methods = buildPayMethods();
    list.innerHTML = methods
      .map(function (m) {
        var tip = m.tip ? '<div class="ua-co-method-option__tip">' + m.tip + '</div>' : '';
        return (
          '<button type="button" class="ua-co-method-option" data-method-id="' +
          m.id +
          '" role="option">' +
          '<span class="ua-co-method-option__icon ' +
          (m.tone || '') +
          '">' +
          m.short +
          '</span>' +
          '<span class="ua-co-method-option__info">' +
          '<div class="ua-co-method-option__name">' +
          m.name +
          '</div>' +
          tip +
          '</span>' +
          '<svg class="ua-co-method-option__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
          '</button>'
        );
      })
      .join('');
    openSheet('method');
  }

  function applySelectedMethod(method) {
    if (!method) return;
    payState.methodId = method.id;
    payState.methodName = method.name;
    payState.methodTone = method.tone || '';
    if (method.type === 'card') payState.channel = 'card';
    else if (method.type === 'alipay') payState.channel = 'alipay';
    else payState.channel = 'wechat';
  }

  function finishPaySuccess(paidLegs) {
    var legs = paidLegs || getPayLegs();
    if (
      legs.balanceLeg > 0 &&
      window.StoreWalletDemo &&
      typeof window.StoreWalletDemo.applyRestockPay === 'function'
    ) {
      window.StoreWalletDemo.applyRestockPay(legs.balanceLeg);
    }
    showResult(true, legs);
  }

  /** 微信/支付宝：演示跳转三方收单，不经本页密码 */
  function jumpThirdPartyPay(method) {
    applySelectedMethod(method);
    closeSheet('method');
    var legs = getPayLegs();
    legs.channel = payState.channel;
    var overlay = document.getElementById('checkoutThirdPay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'checkoutThirdPay';
      overlay.className = 'ua-co-thirdpay';
      overlay.innerHTML =
        '<div class="ua-co-thirdpay__spin" aria-hidden="true"></div><div id="checkoutThirdPayText"></div>';
      document.body.appendChild(overlay);
    }
    var text = document.getElementById('checkoutThirdPayText');
    if (text) text.textContent = '正在跳转' + method.name + '…';
    overlay.hidden = false;
    window.setTimeout(function () {
      overlay.hidden = true;
      finishPaySuccess(legs);
    }, 900);
  }

  function openPaySheet() {
    payPwd = '';
    updatePayPwdDisplay();
    var legs = getPayLegs();
    setText('checkoutPayAmount', formatMoney(legs.payable));

    var methodText = document.getElementById('checkoutPayMethodText');
    var methodWrap = document.getElementById('checkoutPayMethod');
    if (methodText && methodWrap) {
      if (legs.balanceOnly) {
        methodText.textContent = '钱包余额支付';
      } else if (legs.balanceLeg > 0 && legs.channelLeg > 0) {
        methodText.textContent = '余额 + ' + channelLabel(payState.channel);
      } else {
        methodText.textContent = channelLabel(payState.channel);
      }
      var svg = methodWrap.querySelector('svg');
      if (svg) {
        svg.outerHTML =
          '<svg viewBox="0 0 24 24" fill="#FF7A00"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18" stroke="#fff" stroke-width="1.2"/><circle cx="16.5" cy="14.5" r="1.2" fill="#fff"/></svg>';
      }
    }

    var sheetSplit = document.getElementById('checkoutPaySheetSplit');
    if (sheetSplit) {
      if (legs.balanceLeg > 0 && legs.channelLeg > 0) {
        sheetSplit.hidden = false;
        sheetSplit.innerHTML =
          '<div>余额 ' +
          formatMoney(legs.balanceLeg) +
          '</div><div>' +
          channelLabel(payState.channel) +
          ' ' +
          formatMoney(legs.channelLeg) +
          '</div>';
      } else {
        sheetSplit.hidden = true;
        sheetSplit.innerHTML = '';
      }
    }
    openSheet('pay');
  }

  function onPickPayMethod(methodId) {
    var method = buildPayMethods().find(function (m) {
      return m.id === methodId;
    });
    if (!method) return;
    if (method.type === 'card') {
      applySelectedMethod(method);
      closeSheet('method');
      openPaySheet();
      return;
    }
    jumpThirdPartyPay(method);
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
        var paidLegs = getPayLegs();
        paidLegs.channel = payState.channel;
        if (success) finishPaySuccess(paidLegs);
        else showResult(false, paidLegs);
      }, 300);
    }
  }

  function showResult(success, paidLegs) {
    var el = document.getElementById('checkoutResult');
    var body = document.getElementById('checkoutResultBody');
    if (!el || !body) return;

    document.getElementById('checkoutScroll').hidden = true;
    document.getElementById('checkoutFooter').hidden = true;
    el.hidden = false;

    if (success) {
      var legs = paidLegs || getPayLegs();
      var payDesc =
        legs.balanceLeg > 0 && legs.channelLeg > 0
          ? '余额 ' +
            formatMoney(legs.balanceLeg) +
            ' + ' +
            channelLabel(legs.channel) +
            ' ' +
            formatMoney(legs.channelLeg)
          : legs.balanceOnly
            ? '钱包余额支付'
            : channelLabel(legs.channel);
      body.innerHTML =
        '<div class="ua-co-result__icon ua-co-result__icon--success">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg></div>' +
        '<div class="ua-co-result__title">支付成功</div>' +
        '<div class="ua-co-result__amount">' +
        formatMoney(legs.payable) +
        '</div>' +
        '<div class="ua-co-result__sub">' +
        payDesc +
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
    return getPayable() >= 0;
  }

  /**
   * 提交分流：
   * 1) 余额充足 → 直接支付密码半层
   * 2) 余额不足 / 未用余额 → 支付方式选择半层（银行卡走密码；微信/支付宝跳三方）
   */
  function onSubmitOrder() {
    if (!validateBeforeSubmit()) return;
    var legs = getPayLegs();
    if (payState.useBalance && legs.balanceOnly) {
      payState.channel = 'balance';
      payState.methodName = '钱包余额';
      openPaySheet();
      return;
    }
    openMethodSheet();
  }

  function bindEvents() {
    document.getElementById('checkoutStoreCard') &&
      document.getElementById('checkoutStoreCard').addEventListener('click', openAddressBook);

    document.getElementById('checkoutSupplierList') &&
      document.getElementById('checkoutSupplierList').addEventListener('click', function (e) {
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

    document.getElementById('checkoutFreightHelpBtn') &&
      document.getElementById('checkoutFreightHelpBtn').addEventListener('click', openFreightRulesSheet);

    document.getElementById('checkoutFreightDetailBtn') &&
      document.getElementById('checkoutFreightDetailBtn').addEventListener('click', openFreightSheet);

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
      document.getElementById('checkoutSubmitBtn').addEventListener('click', onSubmitOrder);

    document.getElementById('checkoutUseBalance') &&
      document.getElementById('checkoutUseBalance').addEventListener('change', function (e) {
        payState.useBalance = !!e.target.checked;
        renderSummary();
      });

    document.getElementById('checkoutMethodList') &&
      document.getElementById('checkoutMethodList').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-method-id]');
        if (!btn) return;
        onPickPayMethod(btn.getAttribute('data-method-id'));
      });

    var params = new URLSearchParams(window.location.search);
    var back = document.getElementById('checkoutBack');
    if (back && params.get('from') === 'restock.html') {
      back.setAttribute('href', 'restock.html?tab=cart');
    }
  }

  initState();
  applyPickedAddressFromBook();
  renderAll();
  bindEvents();
})();
