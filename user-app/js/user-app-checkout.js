(function () {
  var CHECKOUT_KEY = 'ua_checkout_v1';
  /* 上楼服务：有无电梯、楼层，下次默认带出 */
  var UPSTAIRS_PREF_KEY = 'ua_checkout_upstairs_v1';
  /* 上次页内收单渠道：wechat | alipay；无记录则首次默认微信支付 */
  var CHANNEL_PREF_KEY = 'ua_checkout_channel_pref_v1';
  /* 收银台混合支付验收：覆盖钱包可用额 / 默认勾选，不改真实演示钱包 */
  var MIX_PAY_DEMO_KEY = 'ua_checkout_mix_pay_demo_v1';

  function isPointsMasterOn() {
    var cfg = window.MdmPointsMallConfig;
    if (cfg && typeof cfg.isMasterEnabled === 'function') return cfg.isMasterEnabled();
    try {
      var raw = localStorage.getItem('mdm_member_points_rule_v1');
      if (!raw) return true;
      return JSON.parse(raw).enabled !== false;
    } catch (e) {
      return true;
    }
  }
  var MIX_PAY_SCENES = [
    { id: 'auto', label: '按实际钱包' },
    { id: 'wallet', label: '余额充足·仅钱包' },
    { id: 'mix_wechat', label: '余额不足·混微信' },
    { id: 'mix_alipay', label: '余额不足·混支付宝' },
    { id: 'wechat', label: '关闭余额·仅微信' },
    { id: 'alipay', label: '关闭余额·仅支付宝' },
    { id: 'wallet_zero', label: '余额为0·隐藏钱包' },
    { id: 'points_mix_wechat', label: '积分+余额+微信' }
  ];
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
    /* 默认开启钱包余额抵扣 */
    useBalance: true,
    /* wechat | alipay | card | null — 余额足够时默认不勾选；不足时用上次/微信 */
    channel: null,
    methodId: '',
    methodName: '',
    methodTone: ''
  };

  function isPayChannel(channel) {
    return channel === 'alipay' || channel === 'wechat';
  }

  function normalizeChannel(channel) {
    return channel === 'alipay' ? 'alipay' : 'wechat';
  }

  function channelMeta(channel) {
    var ch = normalizeChannel(channel);
    if (ch === 'alipay') {
      return {
        channel: 'alipay',
        methodId: 'alipay',
        methodName: '支付宝',
        methodTone: 'is-alipay'
      };
    }
    return {
      channel: 'wechat',
      methodId: 'wechat',
      methodName: '微信支付',
      methodTone: 'is-wechat'
    };
  }

  function applyChannelToPayState(channel) {
    var meta = channelMeta(channel);
    payState.channel = meta.channel;
    payState.methodId = meta.methodId;
    payState.methodName = meta.methodName;
    payState.methodTone = meta.methodTone;
  }

  function clearChannelSelection() {
    payState.channel = null;
    payState.methodId = '';
    payState.methodName = '';
    payState.methodTone = '';
  }

  function readLastChannelPref() {
    try {
      var raw = localStorage.getItem(CHANNEL_PREF_KEY);
      if (raw === 'alipay' || raw === 'wechat') return raw;
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function saveLastChannelPref(channel) {
    if (!isPayChannel(channel)) return;
    try {
      localStorage.setItem(CHANNEL_PREF_KEY, channel);
    } catch (e) {
      /* ignore */
    }
  }

  function readMixPayDemo() {
    try {
      var raw = localStorage.getItem(MIX_PAY_DEMO_KEY);
      if (!raw) return { scene: 'auto' };
      var data = JSON.parse(raw);
      var scene = data && data.scene;
      if (
        MIX_PAY_SCENES.some(function (s) {
          return s.id === scene;
        })
      ) {
        return { scene: scene };
      }
    } catch (e) {
      /* ignore */
    }
    return { scene: 'auto' };
  }

  function writeMixPayDemo(scene) {
    try {
      localStorage.setItem(MIX_PAY_DEMO_KEY, JSON.stringify({ scene: scene || 'auto' }));
    } catch (e) {
      /* ignore */
    }
  }

  function realWalletAvailable() {
    if (window.StoreWalletDemo && typeof window.StoreWalletDemo.snapshot === 'function') {
      var snap = window.StoreWalletDemo.snapshot();
      return Number(snap.restockAvailable != null ? snap.restockAvailable : snap.available) || 0;
    }
    return 0;
  }

  /** 验收场景：改余额开关、收单渠道、积分；返回 true 表示已接管默认勾选 */
  function applyMixPayScene() {
    var scene = readMixPayDemo().scene;
    if (!scene || scene === 'auto') return false;
    if (scene === 'points_mix_wechat') {
      state.pointsEnabled = true;
    }
    if (scene === 'wallet') {
      payState.useBalance = true;
      clearChannelSelection();
      return true;
    }
    if (scene === 'mix_wechat' || scene === 'points_mix_wechat') {
      payState.useBalance = true;
      applyChannelToPayState('wechat');
      return true;
    }
    if (scene === 'mix_alipay') {
      payState.useBalance = true;
      applyChannelToPayState('alipay');
      return true;
    }
    if (scene === 'wechat' || scene === 'wallet_zero') {
      payState.useBalance = false;
      applyChannelToPayState('wechat');
      return true;
    }
    if (scene === 'alipay') {
      payState.useBalance = false;
      applyChannelToPayState('alipay');
      return true;
    }
    return false;
  }

  function layoutMixPayPanel(panel) {
    if (!panel) return;
    var sale = document.getElementById('uaSaleTimeDemo');
    if (!sale) {
      panel.style.top = '50%';
      panel.style.transform = 'translateY(-50%)';
      return;
    }
    var gap = 8;
    var saleRect = sale.getBoundingClientRect();
    var top = saleRect.bottom + gap;
    var maxTop = window.innerHeight - panel.offsetHeight - 12;
    if (top > maxTop && maxTop > 12) {
      var saleH = sale.offsetHeight;
      var stackH = saleH + gap + panel.offsetHeight;
      var stackTop = Math.max(12, window.innerHeight - stackH - 12);
      sale.style.top = stackTop + 'px';
      sale.style.transform = 'none';
      top = stackTop + saleH + gap;
    }
    panel.style.top = Math.round(top) + 'px';
    panel.style.transform = 'none';
  }

  function mountMixPayDemoPanel() {
    if (document.getElementById('uaMixPayDemo')) return;
    var current = readMixPayDemo().scene;
    var options = MIX_PAY_SCENES.map(function (s) {
      return (
        '<option value="' +
        s.id +
        '"' +
        (s.id === current ? ' selected' : '') +
        '>' +
        s.label +
        '</option>'
      );
    }).join('');
    var panel = document.createElement('div');
    panel.id = 'uaMixPayDemo';
    panel.className = 'ua-mix-pay-demo';
    panel.innerHTML =
      '<div class="ua-mix-pay-demo__title">混合支付验收开关</div>' +
      '<label class="ua-mix-pay-demo__row">支付场景' +
      '<select id="uaMixPayDemoScene">' +
      options +
      '</select></label>' +
      '<div class="ua-mix-pay-demo__tip">选场景后点应用并刷新。余额不足会压低钱包可用额，用来走混合支付；不改真实钱包余额。</div>' +
      '<button type="button" class="ua-mix-pay-demo__apply" id="uaMixPayDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaMixPayDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaMixPayDemoScene');
        writeMixPayDemo(sel ? sel.value : 'auto');
        window.location.reload();
      });
    }
    layoutMixPayPanel(panel);
    window.addEventListener('resize', function () {
      layoutMixPayPanel(panel);
    });
  }

  function isRestockCheckout() {
    var p = new URLSearchParams(window.location.search);
    return p.get('from') === 'restock.html' || p.get('port') === 'store-app';
  }

  function mountFreightSchemeDemoPanel() {
    if (!isRestockCheckout() || document.getElementById('uaFreightSchemeDemo')) return;
    var api = window.TmsLogisticsRate || {};
    var current = typeof api.getDemoFeeScheme === 'function' ? api.getDemoFeeScheme() : '';
    var upstairs = typeof api.getDemoUpstairs === 'function' ? api.getDemoUpstairs() : '';
    var panel = document.createElement('div');
    panel.id = 'uaFreightSchemeDemo';
    panel.className = 'ua-freight-scheme-demo';
    panel.innerHTML =
      '<div class="ua-rg-demo__title">费用组成验收开关</div>' +
      '<label class="ua-rg-demo__row">计费方式' +
      '<select id="uaFreightSchemeDemoSel">' +
      '<option value=""' +
      (!current ? ' selected' : '') +
      '>跟随费率表</option>' +
      '<option value="重量计费"' +
      (current === '重量计费' ? ' selected' : '') +
      '>重量计费</option>' +
      '<option value="金额计费"' +
      (current === '金额计费' ? ' selected' : '') +
      '>金额计费</option>' +
      '<option value="按件计费"' +
      (current === '按件计费' ? ' selected' : '') +
      '>按件计费</option>' +
      '<option value="混合计费"' +
      (current === '混合计费' ? ' selected' : '') +
      '>混合计费</option>' +
      '</select></label>' +
      '<label class="ua-rg-demo__row">上楼费' +
      '<select id="uaFreightUpstairsDemoSel">' +
      '<option value=""' +
      (!upstairs ? ' selected' : '') +
      '>跟随费率表</option>' +
      '<option value="on"' +
      (upstairs === 'on' ? ' selected' : '') +
      '>已配置</option>' +
      '<option value="off"' +
      (upstairs === 'off' ? ' selected' : '') +
      '>未配置</option>' +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaFreightSchemeDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaFreightSchemeDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var sel = document.getElementById('uaFreightSchemeDemoSel');
        var upSel = document.getElementById('uaFreightUpstairsDemoSel');
        if (typeof api.setDemoFeeScheme === 'function') {
          api.setDemoFeeScheme(sel ? sel.value : '');
        }
        if (typeof api.setDemoUpstairs === 'function') {
          api.setDemoUpstairs(upSel ? upSel.value : '');
        }
        window.location.reload();
      });
    }
  }

  function isMixFreightDemo() {
    var api = window.TmsLogisticsRate;
    return !!(api && typeof api.isMixFeeScheme === 'function' && api.isMixFeeScheme());
  }

  /** 余额足够：默认不勾选；仍需收单时：恢复上次选择，首次默认微信 */
  function initPayChannelSelection() {
    if (applyMixPayScene()) return;
    var legs = getPayLegs();
    if (legs.channelLeg > 0.001) {
      applyChannelToPayState(readLastChannelPref() || 'wechat');
    } else {
      clearChannelSelection();
    }
  }

  function syncChannelWhenBalanceChanged() {
    var legs = getPayLegs();
    if (legs.channelLeg > 0.001) {
      if (!isPayChannel(payState.channel)) {
        applyChannelToPayState(readLastChannelPref() || 'wechat');
      }
    } else if (payState.useBalance && legs.balanceOnly) {
      clearChannelSelection();
    }
  }

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

  function saleApi() {
    return window.UaProductSaleTime;
  }

  function restockSaleOpts() {
    return saleApi() && saleApi().restockSaleOptions
      ? saleApi().restockSaleOptions()
      : { ignoreStoreHours: true };
  }

  function unsaleableLabel() {
    return (saleApi() && saleApi().UNSALEABLE_LABEL) || '商品不可售';
  }

  function isCheckoutItemSaleable(item) {
    if (!saleApi() || typeof saleApi().isSaleableNow !== 'function') return true;
    return !!saleApi().isSaleableNow(item, restockSaleOpts());
  }

  function listCheckoutItems() {
    var items = [];
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        (pkg.items || []).forEach(function (it) {
          items.push(it);
        });
      });
    });
    return items;
  }

  function removeCheckoutItems(ids) {
    var map = {};
    (ids || []).forEach(function (id) {
      map[String(id)] = true;
    });
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        pkg.items = (pkg.items || []).filter(function (it) {
          return !map[String(it.id)];
        });
      });
      sup.packages = (sup.packages || []).filter(function (pkg) {
        return pkg.items && pkg.items.length;
      });
    });
    state.suppliers = (state.suppliers || []).filter(function (sup) {
      return sup.packages && sup.packages.length;
    });
  }

  function persistCheckoutPayload() {
    try {
      var payload = readCheckoutPayload() || {};
      payload.items = listCheckoutItems();
      payload.invalidItems = state.invalidItems || [];
      sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }

  function isBdAppBrowse() {
    var params = new URLSearchParams(window.location.search);
    return params.get('port') === 'bd-app' || params.get('from') === 'bd-app';
  }

  function isStoreAppPort() {
    if (window.LfAppShell && typeof window.LfAppShell.isStoreApp === 'function') {
      return window.LfAppShell.isStoreApp();
    }
    var params = new URLSearchParams(window.location.search);
    return params.get('port') === 'store-app' || params.get('from') === 'store-app';
  }

  function cartBackHref() {
    var params = new URLSearchParams(window.location.search);
    if (isBdAppBrowse()) {
      var sid = params.get('storeId') || '';
      return (
        'restock.html?from=bd-app&tab=cart' + (sid ? '&storeId=' + encodeURIComponent(sid) : '')
      );
    }
    return isStoreAppPort() ? 'restock.html?from=store-app&tab=cart' : 'restock.html?tab=cart';
  }

  function renderCheckoutInvalid() {
    var el = document.getElementById('checkoutInvalidWrap');
    if (!el) return;
    var items = state.invalidItems || [];
    if (!items.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML =
      '<section class="ua-invalid-goods" id="checkoutInvalid">' +
      '<div class="ua-invalid-goods__head">失效宝贝' +
      items.length +
      '件</div>' +
      items
        .map(function (item) {
          return (
            '<article class="ua-invalid-goods__item">' +
            '<span class="ua-invalid-goods__mark">失效</span>' +
            '<div class="ua-invalid-goods__thumb"><img src="' +
            (item.img || '../assets/restock/product-leaf.svg') +
            '" alt=""></div>' +
            '<div class="ua-invalid-goods__body">' +
            '<div class="ua-invalid-goods__name">' +
            (item.title || '') +
            (item.spec ? ' ' + item.spec : '') +
            '</div>' +
            '<div class="ua-invalid-goods__reason">' +
            (item.reason || unsaleableLabel()) +
            '</div></div></article>'
          );
        })
        .join('') +
      '</section>';
  }

  function applyCheckoutSaleableGuard() {
    var items = listCheckoutItems();
    var unsaleable = items.filter(function (it) {
      return !isCheckoutItemSaleable(it);
    });
    if (!unsaleable.length) {
      if (!items.length) {
        if (saleApi() && saleApi().showSaleDialog) {
          saleApi().showSaleDialog({
            title: saleApi().SALE_DIALOG_ALL_TITLE,
            text: saleApi().SALE_DIALOG_ALL,
            okText: '确定',
            onDone: function () {
              window.location.href = cartBackHref();
            }
          });
        }
        return false;
      }
      return true;
    }
    state.invalidItems = (state.invalidItems || []).concat(unsaleable);
    removeCheckoutItems(
      unsaleable.map(function (it) {
        return it.id;
      })
    );
    persistCheckoutPayload();
    renderAll();
    if (!listCheckoutItems().length) {
      if (saleApi() && saleApi().showSaleDialog) {
        saleApi().showSaleDialog({
          title: saleApi().SALE_DIALOG_ALL_TITLE,
          text: saleApi().SALE_DIALOG_ALL,
          okText: '确定',
          onDone: function () {
            window.location.href = cartBackHref();
          }
        });
      }
      return false;
    }
    if (saleApi() && saleApi().showSaleDialog) {
      saleApi().showSaleDialog({
        title: saleApi().SALE_DIALOG_PARTIAL_TITLE,
        text: saleApi().SALE_DIALOG_PARTIAL_CONFIRM
      });
    }
    return false;
  }

  function getDefaultCheckoutState() {
    return {
      store: {
        name: '悠悠生鲜超市',
        contact: '张店长',
        phone: '138****6688',
        address: '浙江省杭州市萧山区建设一路88号'
      },
      /* 配送按门店配送仓合并一单，不按供应商拆；快递仍按供应商拆 */
      suppliers: [
        {
          id: 'wh:W002',
          name: 'W002 嘉兴仓',
          kind: 'delivery',
          packages: [
            {
              id: 'pkg-wh-W002',
              warehouseId: 'W002',
              warehouse: 'W002 嘉兴仓',
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
                  supplierId: 'supplier-jiangnan',
                  supplierName: '江南果蔬批发',
                  img: '../assets/restock/product-eggplant-long.svg'
                },
                {
                  id: 'tomato-1',
                  title: '普罗旺斯西红柿',
                  spec: '5斤',
                  priceNum: 29,
                  qty: 2,
                  fulfillmentMethod: '配送',
                  supplierId: 'supplier-jiangnan',
                  supplierName: '江南果蔬批发',
                  img: '../assets/restock/product-tomato.svg'
                },
                {
                  id: 'tomato-2',
                  title: '硬粉西红柿 优质',
                  spec: '10斤',
                  priceNum: 46,
                  qty: 1,
                  fulfillmentMethod: '配送',
                  supplierId: 'supplier-jiangnan',
                  supplierName: '江南果蔬批发',
                  img: '../assets/restock/product-tomato.svg'
                },
                {
                  id: 'caul-1',
                  title: '有机菜花 优质',
                  spec: '5斤',
                  priceNum: 24,
                  qty: 2,
                  fulfillmentMethod: '配送',
                  tempLayer: '冷冻',
                  supplierId: 'supplier-jiangnan',
                  supplierName: '江南果蔬批发',
                  img: '../assets/restock/product-leaf.svg'
                }
              ]
            }
          ]
        },
        {
          id: 'supplier-xianfeng',
          name: '鲜丰蔬菜批发',
          kind: 'express',
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
                  supplierId: 'supplier-xianfeng',
                  supplierName: '鲜丰蔬菜批发',
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

  /** 进货配送 / 零售自提：按门店对应配送仓，一门店一个仓 */
  function resolveStoreWarehouse(store) {
    var dest = null;
    var api = window.TmsLogisticsRate;
    if (api && typeof api.parseDestFromAddress === 'function') {
      dest = api.parseDestFromAddress(store && store.address);
    }
    if (api && typeof api.warehouseByDest === 'function') {
      return api.warehouseByDest(dest);
    }
    if (dest && (dest.province === '江苏省' || /南京|苏州/.test(dest.city || ''))) {
      return { id: 'W001', name: 'W001 南京仓' };
    }
    if (dest && (dest.province === '上海市' || dest.city === '上海市')) {
      return { id: 'W003', name: 'W003 上海仓' };
    }
    return { id: 'W002', name: 'W002 嘉兴仓' };
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

  function mapCheckoutLine(item, fulfillment) {
    var sid = item.supplierId || 'supplier-default';
    return {
      id: item.id,
      title: item.title,
      spec: item.spec || '',
      priceNum: item.priceNum,
      qty: item.qty || 1,
      img: item.img || '../assets/restock/product-leaf.svg',
      spuId: item.spuId || '',
      fulfillmentMethod: fulfillment,
      tempLayer: item.tempLayer || '',
      supplierId: sid,
      supplierName: resolveCheckoutSupplierName(sid, item.supplierName || '')
    };
  }

  /**
   * 进货拆单：配送按门店配送仓合成一单（不按供应商）；快递仍按供应商拆。
   */
  function buildCheckoutFromItems(items, store) {
    var storeWh = resolveStoreWarehouse(store);
    var deliveryPkg = null;
    var expressMap = {};
    (items || []).forEach(function (item) {
      var fulfillment = resolveFulfillmentMethod(item);
      var line = mapCheckoutLine(item, fulfillment);
      if (fulfillment !== '快递') {
        if (!deliveryPkg) {
          deliveryPkg = {
            id: 'pkg-wh-' + storeWh.id,
            warehouseId: storeWh.id,
            warehouse: storeWh.name,
            deliveryType: 'warehouse',
            deliveryTime: '',
            remark: '',
            items: []
          };
        }
        deliveryPkg.items.push(line);
        return;
      }
      var sid = line.supplierId;
      if (!expressMap[sid]) {
        expressMap[sid] = { id: sid, name: line.supplierName || '冷丰优选供应链', packages: {} };
      }
      var wh = resolveWarehouse(sid, item);
      var pkgKey = 'store:' + wh.id;
      if (!expressMap[sid].packages[pkgKey]) {
        expressMap[sid].packages[pkgKey] = {
          id: 'pkg-' + sid + '-store-' + wh.id,
          warehouseId: wh.id,
          warehouse: wh.name,
          deliveryType: 'store',
          deliveryTime: '',
          remark: '',
          items: []
        };
      }
      expressMap[sid].packages[pkgKey].items.push(line);
    });

    var suppliers = [];
    if (deliveryPkg && deliveryPkg.items.length) {
      suppliers.push({
        id: 'wh:' + storeWh.id,
        name: storeWh.name,
        kind: 'delivery',
        packages: [deliveryPkg]
      });
    }
    Object.keys(expressMap).forEach(function (sid) {
      var s = expressMap[sid];
      suppliers.push({
        id: s.id,
        name: s.name,
        kind: 'express',
        packages: Object.keys(s.packages).map(function (k) {
          return s.packages[k];
        })
      });
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
    state.invalidItems = (payload && Array.isArray(payload.invalidItems) ? payload.invalidItems : []) || [];
    state.upstairs = loadUpstairsPref();
    autoSelectCoupon();
  }

  function loadUpstairsPref() {
    try {
      var raw = localStorage.getItem(UPSTAIRS_PREF_KEY);
      if (raw) {
        var pref = JSON.parse(raw);
        var floor = pref && pref.floor;
        return {
          hasElevator: !pref || pref.hasElevator !== false,
          floor: floor != null && floor !== '' ? floor : 2
        };
      }
    } catch (e) {
      /* ignore */
    }
    return { hasElevator: true, floor: 2 };
  }

  function saveUpstairsPref() {
    if (!state || !state.upstairs) return;
    try {
      localStorage.setItem(
        UPSTAIRS_PREF_KEY,
        JSON.stringify({
          hasElevator: state.upstairs.hasElevator !== false,
          floor: state.upstairs.floor
        })
      );
    } catch (e) {
      /* ignore */
    }
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

  function listCheckoutLineItems(opts) {
    opts = opts || {};
    var items = [];
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        if (opts.deliveryOnly && getPackageFulfillment(pkg) === '快递') return;
        if (opts.expressOnly && getPackageFulfillment(pkg) !== '快递') return;
        (pkg.items || []).forEach(function (item) {
          items.push(item);
        });
      });
    });
    return items;
  }

  function checkoutFreightDest() {
    var api = window.TmsLogisticsRate;
    if (!api) return null;
    var address = state && state.store && state.store.address;
    return api.parseDestFromAddress(address) || api.DEMO_DEST;
  }

  function checkoutQuoteOpts(fulfill, items) {
    var api = window.TmsLogisticsRate;
    var upstairs = (state && state.upstairs) || { hasElevator: true, floor: 2 };
    var payable = (items || []).reduce(function (sum, item) {
      return sum + (Number(item.priceNum != null ? item.priceNum : item.price) || 0) * (Number(item.qty) || 0);
    }, 0);
    return {
      channel: api.CHANNEL_PROXY,
      fulfill: fulfill,
      dest: checkoutFreightDest(),
      items: items,
      payable: payable,
      upstairs: fulfill === 'platform' ? upstairs : undefined,
      forceCharge: isMixFreightDemo()
    };
  }

  function quoteCheckoutFreight() {
    var api = window.TmsLogisticsRate;
    if (!api || typeof api.quoteOrder !== 'function') return null;
    var items = listCheckoutLineItems({ deliveryOnly: true });
    var opts = checkoutQuoteOpts('platform', items);
    opts.payable = getGoodsSubtotal();
    if (isMixFreightDemo() && typeof api.quoteOrderWithScheme === 'function') {
      return api.quoteOrderWithScheme(opts, '重量计费');
    }
    return api.quoteOrder(opts);
  }

  function quoteCheckoutExpressFreight() {
    var api = window.TmsLogisticsRate;
    var items = listCheckoutLineItems({ expressOnly: true });
    if (!items.length || !api || typeof api.quoteOrder !== 'function') return null;
    var opts = checkoutQuoteOpts('express', items);
    if (isMixFreightDemo() && typeof api.quoteOrderWithScheme === 'function') {
      return api.quoteOrderWithScheme(opts, '重量计费');
    }
    return api.quoteOrder(opts);
  }

  function quoteMixCompareLanes() {
    var api = window.TmsLogisticsRate;
    if (!api || typeof api.quoteSchemeCompare !== 'function') return null;
    var allItems = listCheckoutLineItems();
    if (!allItems.length) return null;
    var deliveryItems = listCheckoutLineItems({ deliveryOnly: true });
    var expressItems = listCheckoutLineItems({ expressOnly: true });
    return {
      delivery: api.quoteSchemeCompare(
        checkoutQuoteOpts('platform', deliveryItems.length ? deliveryItems : allItems)
      ),
      express: api.quoteSchemeCompare(
        checkoutQuoteOpts('express', expressItems.length ? expressItems : allItems)
      ),
      deliveryPreview: !deliveryItems.length,
      expressPreview: !expressItems.length
    };
  }

  function summarizeLineItems(items) {
    var qty = 0;
    var amount = 0;
    (items || []).forEach(function (item) {
      var q = Number(item.qty) || 0;
      qty += q;
      amount += (Number(item.priceNum != null ? item.priceNum : item.price) || 0) * q;
    });
    return { qty: qty, amount: Math.round(amount * 100) / 100 };
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
    var deliveryItems = listCheckoutLineItems({ deliveryOnly: true });
    var expressItems = listCheckoutLineItems({ expressOnly: true });
    var mixCompare = isMixFreightDemo() ? quoteMixCompareLanes() : null;
    if (mixCompare) {
      var deliveryRoll = mixCompare.deliveryPreview
        ? { ambient: 0, cold: 0, service: 0, total: 0 }
        : mixLaneRollup(mixCompare.delivery);
      var expressRoll = mixCompare.expressPreview
        ? { ambient: 0, cold: 0, service: 0, total: 0 }
        : mixLaneRollup(mixCompare.express);
      var mixTotal = moneyRound(deliveryRoll.total + expressRoll.total);
      return {
        ambientFee: deliveryRoll.ambient,
        coldFee: deliveryRoll.cold,
        expressFee: expressRoll.total,
        deliveryFee: deliveryRoll.total,
        total: mixTotal,
        baseTotal: moneyRound(deliveryRoll.ambient + deliveryRoll.cold),
        extras: [],
        serviceSummary: null,
        quote: mixQuoteFromRollup(deliveryRoll),
        expressQuote: mixQuoteFromRollup(expressRoll),
        hasDelivery: true,
        hasExpress: true,
        mixCompare: mixCompare,
        packages: [],
        label: mixTotal > 0 ? formatMoney(mixTotal) : '免运费'
      };
    }
    var expressQuote = quoteCheckoutExpressFreight();
    var expressFee = expressQuote ? Number(expressQuote.total) || 0 : 0;
    var quote = quoteCheckoutFreight();
    if (quote) {
      var deliveryFee = quote.total || 0;
      var total = Math.round((deliveryFee + expressFee) * 100) / 100;
      return {
        ambientFee: quote.ambient.amount || 0,
        coldFee: quote.cold.amount || 0,
        expressFee: expressFee,
        deliveryFee: deliveryFee,
        total: total,
        baseTotal: quote.baseTotal || 0,
        extras: quote.extras || [],
        serviceSummary: quote.serviceSummary || null,
        quote: quote,
        expressQuote: expressQuote,
        hasDelivery: mixCompare ? true : deliveryItems.length > 0,
        hasExpress: mixCompare ? true : expressItems.length > 0,
        mixCompare: mixCompare,
        packages: [],
        label: total > 0 ? formatMoney(total) : '免运费'
      };
    }

    var deliveryAmount = 0;
    (state.suppliers || []).forEach(function (sup) {
      (sup.packages || []).forEach(function (pkg) {
        if (getPackageFulfillment(pkg) !== '快递') {
          deliveryAmount += getPackageGoodsAmount(pkg);
        }
      });
    });
    var deliveryFee = deliveryAmount > 0 ? matchDeliveryFreight(deliveryAmount) : 0;
    var total = Math.round((deliveryFee + expressFee) * 100) / 100;
    return {
      ambientFee: deliveryFee,
      coldFee: 0,
      expressFee: expressFee,
      deliveryFee: deliveryFee,
      total: total,
      expressQuote: expressQuote,
      hasDelivery: mixCompare ? true : deliveryItems.length > 0,
      hasExpress: mixCompare ? true : expressItems.length > 0,
      mixCompare: mixCompare,
      packages: [],
      label: total > 0 ? formatMoney(total) : '免运费'
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
    var scene = readMixPayDemo().scene;
    var real = realWalletAvailable();
    if (!scene || scene === 'auto') return real;
    if (scene === 'wallet_zero') return 0;
    var payable = state ? getPayable() : 0;
    if (scene === 'wallet' || scene === 'wechat' || scene === 'alipay') {
      /* 仅钱包 / 关闭余额：保证钱包行可见，且余额足够盖住应付 */
      return Math.max(real, Math.round((payable + 50) * 100) / 100);
    }
    if (scene === 'mix_wechat' || scene === 'mix_alipay' || scene === 'points_mix_wechat') {
      var forced = Math.round(payable * 0.4 * 100) / 100;
      return Math.max(0.01, forced);
    }
    return real;
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

  /** 订单/成功页透出用短名：微信、支付宝、钱包余额、银行卡 */
  function payChannelShortName(channel) {
    if (channel === 'balance') return '钱包余额';
    if (channel === 'alipay') return '支付宝';
    if (channel === 'card') return payState.methodName || '快捷银行卡';
    if (channel === 'wechat') return '微信';
    if (payState.methodName && channel === payState.channel) return payState.methodName;
    return '微信';
  }

  function buildPayLegParts(legs) {
    var L = legs || getPayLegs();
    var parts = [];
    var pointsAmt = state.pointsEnabled ? Number(state.pointsDeduct) || 0 : 0;
    if (pointsAmt > 0.001) {
      parts.push({ name: '积分抵扣', amount: pointsAmt });
    }
    if (L.balanceLeg > 0.001) {
      parts.push({ name: '钱包余额', amount: L.balanceLeg });
    }
    if (L.channelLeg > 0.001) {
      parts.push({ name: payChannelShortName(L.channel), amount: L.channelLeg });
    }
    if (!parts.length) {
      parts.push({
        name: payChannelShortName(L.channel || 'balance'),
        amount: L.payable || 0
      });
    }
    return parts;
  }

  /** 支付明细两行：钱包余额 / 支付宝（或微信），金额红色负号 */
  function formatPayLegsRowsHtml(parts, className, options) {
    var list = (parts || []).filter(function (p) {
      return p && Number(p.amount) > 0.001;
    });
    if (!list.length) return '';
    var opts = options || {};
    var rows = list
      .map(function (p) {
        return (
          '<div class="ua-co-pay-legs__row">' +
          '<span class="ua-co-pay-legs__name">' +
          p.name +
          '</span>' +
          '<span class="ua-co-pay-legs__amount">-' +
          formatMoney(Number(p.amount) || 0) +
          '</span>' +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="' +
      (className || 'ua-co-pay-legs') +
      '"' +
      (opts.hidden ? ' hidden' : '') +
      '>' +
      rows +
      '</div>'
    );
  }

  function payLegsToggleBtnHtml() {
    return (
      '<button type="button" class="ua-co-pay-legs-toggle" id="checkoutPayLegsToggle" aria-expanded="false" aria-label="展开支付明细">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button>'
    );
  }

  function bindPayLegsToggle(toggleId, legsSelector) {
    var toggle = document.getElementById(toggleId);
    var legsEl = document.querySelector(legsSelector);
    if (!toggle || !legsEl) return;
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      var next = !expanded;
      toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
      toggle.setAttribute('aria-label', next ? '收起支付明细' : '展开支付明细');
      toggle.classList.toggle('is-expanded', next);
      legsEl.hidden = !next;
    });
  }

  function formatPayMethodNames(parts) {
    return (parts || [])
      .map(function (p) {
        return p.name;
      })
      .join('、');
  }

  /** 底部「待支付」= 小计 − 钱包已抵扣（未开余额时为小计全额） */
  function getFooterPayable(legs) {
    var L = legs || getPayLegs();
    return L.channelLeg;
  }

  function syncChannelCardUI() {
    var card = document.getElementById('checkoutChannelCard');
    if (!card) return;
    var channel = isPayChannel(payState.channel) ? payState.channel : '';
    card.querySelectorAll('[data-channel]').forEach(function (btn) {
      var selected = !!channel && btn.getAttribute('data-channel') === channel;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-checked', selected ? 'true' : 'false');
    });
  }

  function renderPayWays() {
    var legs = getPayLegs();
    var payWays = document.getElementById('checkoutPayWays');
    var walletRow = payWays ? payWays.querySelector('.ua-co-row--wallet') : null;
    /* 钱包余额为 0 时不展示该行 */
    var showWallet = Number(legs.available) > 0.001;
    if (payWays) payWays.hidden = !showWallet;
    if (walletRow) walletRow.hidden = !showWallet;
    if (showWallet) {
      var hint = document.getElementById('checkoutWalletHint');
      if (hint) hint.textContent = '已抵扣 ' + formatMoney(legs.balanceLeg);
      var useBalanceEl = document.getElementById('checkoutUseBalance');
      if (useBalanceEl) useBalanceEl.checked = !!payState.useBalance;
    }
    /* 支付宝/微信始终展示；余额足够时默认不勾选 */
    var channelCard = document.getElementById('checkoutChannelCard');
    if (channelCard) channelCard.hidden = false;
    syncChannelCardUI();
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
        card: c
      };
    });
    return cardMethods.concat([
      {
        id: 'alipay',
        type: 'alipay',
        name: '支付宝',
        short: '支',
        tone: 'is-alipay'
      },
      {
        id: 'wechat',
        type: 'wechat',
        name: '微信支付',
        short: '微',
        tone: 'is-wechat'
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
    renderAccessCard();
  }

  function checkoutHasDelivery() {
    return (state.suppliers || []).some(function (block) {
      return checkoutBlockKind(block) === 'delivery';
    });
  }

  function checkoutHasUpstairsFee() {
    if (!checkoutHasDelivery()) return false;
    var api = window.TmsLogisticsRate;
    var demo = api && typeof api.getDemoUpstairs === 'function' ? api.getDemoUpstairs() : '';
    if (demo === 'off') return false;
    if (demo === 'on') return true;
    var quote = quoteCheckoutFreight();
    var svc = quote && quote.serviceSummary && quote.serviceSummary.upstairs;
    return !!(svc && svc.available);
  }

  function renderAccessCard() {
    var el = document.getElementById('checkoutAccessCard');
    if (!el) return;
    /* 仅配送且费率表配了上楼费时展示电梯/楼层；未配置则隐藏 */
    el.hidden = !checkoutHasUpstairsFee();
    if (el.hidden) return;
    var up = (state && state.upstairs) || { hasElevator: true, floor: 2 };
    var chips = el.querySelectorAll('[data-upstairs-lift]');
    chips.forEach(function (btn) {
      var on = btn.getAttribute('data-upstairs-lift') === '1';
      btn.classList.toggle(
        'ua-co-chip--active',
        on ? up.hasElevator !== false : up.hasElevator === false
      );
    });
    var floor = document.getElementById('checkoutUpstairsFloor');
    if (floor && document.activeElement !== floor) {
      floor.value = up.floor != null && up.floor !== '' ? up.floor : 2;
    }
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
          (checkoutBlockKind(sup) === 'delivery'
            ? sup.name
            : resolveExpressOrderShopName(sup) || resolveCheckoutSupplierName(sup.id, sup.name)) +
          '</span>' +
          (sup.kind || checkoutBlockKind(sup)
            ? '<span class="ua-co-supplier__tag">' +
              (checkoutBlockKind(sup) === 'delivery' ? '配送' : '快递') +
              '</span>'
            : '') +
          '</div>' +
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
    var pointsEntry = document.getElementById('checkoutPointsEntry');
    var masterOn = isPointsMasterOn();
    if (pointsEntry) pointsEntry.hidden = !masterOn;
    if (!masterOn && state.pointsEnabled) state.pointsEnabled = false;

    var pointsRow = document.getElementById('checkoutPointsDiscountRow');
    if (pointsRow) pointsRow.hidden = !state.pointsEnabled;
    /* 开关关闭时下方明细不展示积分抵扣金额 */
    setText(
      'checkoutPointsDiscount',
      state.pointsEnabled && points > 0 ? '-' + formatMoney(points) : ''
    );

    var couponText = document.getElementById('checkoutCouponText');
    if (couponText) {
      couponText.textContent = state.coupon ? '-¥' + state.coupon.amount.toFixed(2) : '暂无可用';
      couponText.classList.toggle('ua-co-row__value--accent', !!state.coupon);
    }

    var pointsHint = document.getElementById('checkoutPointsHint');
    if (pointsHint) {
      /* 未开启积分抵扣时，不展示可抵金额 */
      pointsHint.textContent = state.pointsEnabled
        ? '可用' + state.pointsAvailable + '积分，抵¥' + state.pointsDeduct.toFixed(2)
        : '可用' + state.pointsAvailable + '积分';
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

  function refreshFreightAmounts() {
    var freightInfo = calcFreightBreakdown();
    setText('checkoutFreight', freightInfo.label);
    setText('checkoutPayable', formatMoney(getPayable()));
    setText('checkoutFooterTotal', formatMoney(getFooterPayable()));
    renderPayWays();
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
    renderCheckoutInvalid();
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

  function renderFreightRules() {
    var el = document.getElementById('checkoutFreightRulesBody');
    if (!el) return;
    var api = window.TmsLogisticsRate;
    if (api && typeof api.renderExplainHtml === 'function') {
      el.innerHTML = api.renderExplainHtml();
      return;
    }
    el.innerHTML = '<p class="ua-freight-explain__intro">进货运费按履约方式及货物计收，具体金额以确认订单运费明细为准。</p>';
  }

  function openFreightRulesSheet() {
    renderFreightRules();
    openSheet('freightRules');
  }

  function schemeHeading(scheme) {
    if (scheme === '金额计费') return '按订单金额';
    if (scheme === '按件计费') return '按件';
    if (scheme === '重量计费') return '按重量';
    return scheme || '计费明细';
  }

  function groupSchemeName(group) {
    return schemeHeading((group && group.feeScheme) || (group && group.breakdown && group.breakdown.scheme) || '');
  }

  function groupLayerFee(quote, layer) {
    var group = quote && quote[layer];
    if (!group || group.empty) return 0;
    return Number(group.amount) || 0;
  }

  function moneyRound(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function schemeParts(group) {
    if (!group || group.empty) return { base: 0, extra: 0, total: 0 };
    var base = moneyRound(group.amount);
    var extra = moneyRound(group.serviceTotal);
    return { base: base, extra: extra, total: moneyRound(base + extra) };
  }

  function sumSchemeGroups(groups) {
    var base = 0;
    var extra = 0;
    (groups || []).forEach(function (group) {
      var part = schemeParts(group);
      base += part.base;
      extra += part.extra;
    });
    return { base: moneyRound(base), extra: moneyRound(extra), total: moneyRound(base + extra) };
  }

  function mixLayerGroups(cmp, layer) {
    if (!cmp) return [];
    return [
      cmp.weight && cmp.weight[layer],
      cmp.amount && cmp.amount[layer],
      cmp.qty && cmp.qty[layer]
    ];
  }

  function mixLaneRollup(cmp) {
    var ambient = sumSchemeGroups(mixLayerGroups(cmp, 'ambient'));
    var cold = sumSchemeGroups(mixLayerGroups(cmp, 'cold'));
    return {
      ambient: ambient.base,
      cold: cold.base,
      service: moneyRound(ambient.extra + cold.extra),
      total: moneyRound(ambient.total + cold.total)
    };
  }

  function mixQuoteFromRollup(roll) {
    return {
      ambient: { amount: roll.ambient, empty: !(roll.ambient > 0) },
      cold: { amount: roll.cold, empty: !(roll.cold > 0) },
      serviceTotal: roll.service,
      total: roll.total
    };
  }

  function renderFreightBreakdownLines(group) {
    var bd = group && group.breakdown;
    if (!bd) return '';
    if (bd.scheme === '按件计费') {
      return (
        '<div class="ua-co-freight-detail__calc">' +
        '<div class="ua-co-freight-detail__calc-row"><span>购买件数</span><span>' +
        bd.qty +
        '件</span></div>' +
        '<div class="ua-co-freight-detail__calc-row"><span>命中档 ' +
        bd.tierStart +
        '~' +
        bd.tierEnd +
        '件</span><span>¥' +
        Number(bd.unitPrice || 0).toFixed(2) +
        '/件</span></div>' +
        (bd.discount !== 1
          ? '<div class="ua-co-freight-detail__calc-row"><span>运费折扣</span><span>' +
            bd.discount +
            '</span></div>'
          : '') +
        '<div class="ua-co-freight-detail__calc-row"><span>基础运费</span><span>' +
        formatMoney(bd.amount) +
        '</span></div></div>'
      );
    }
    if (bd.scheme === '金额计费') {
      return (
        '<div class="ua-co-freight-detail__calc">' +
        '<div class="ua-co-freight-detail__calc-row"><span>货款金额</span><span>' +
        formatMoney(bd.goodsAmount) +
        '</span></div>' +
        '<div class="ua-co-freight-detail__calc-row"><span>命中档 ' +
        bd.tierStart +
        '~' +
        bd.tierEnd +
        '元</span><span>' +
        formatMoney(bd.price) +
        '</span></div>' +
        (bd.discount !== 1
          ? '<div class="ua-co-freight-detail__calc-row"><span>运费折扣</span><span>' +
            bd.discount +
            '</span></div>'
          : '') +
        '<div class="ua-co-freight-detail__calc-row"><span>基础运费</span><span>' +
        formatMoney(bd.amount) +
        '</span></div></div>'
      );
    }
    return (
      '<div class="ua-co-freight-detail__calc">' +
      '<div class="ua-co-freight-detail__calc-row"><span>计费重量</span><span>' +
      bd.weight +
      'kg</span></div>' +
      '<div class="ua-co-freight-detail__calc-row"><span>命中档 ' +
      bd.tierStart +
      '~' +
      bd.tierEnd +
      'kg</span><span></span></div>' +
      '<div class="ua-co-freight-detail__calc-row"><span>首重 ' +
      bd.firstWeight +
      'kg</span><span>' +
      formatMoney(bd.firstPrice) +
      '</span></div>' +
      '<div class="ua-co-freight-detail__calc-row"><span>续重 ' +
      bd.extraKg +
      'kg × ¥' +
      Number(bd.cont || 0).toFixed(2) +
      '</span><span>' +
      formatMoney(bd.extraFee) +
      '</span></div>' +
      (bd.discount !== 1
        ? '<div class="ua-co-freight-detail__calc-row"><span>运费折扣</span><span>' +
          bd.discount +
          '</span></div>'
        : '') +
      '<div class="ua-co-freight-detail__calc-row"><span>基础运费</span><span>' +
      formatMoney(bd.amount) +
      '</span></div></div>'
    );
  }

  function renderGroupExtraBlock(group) {
    var extras = ((group && group.extras) || []).filter(function (line) {
      return line && line.selected;
    });
    if (!extras.length) return '';
    var rows = extras
      .map(function (line) {
        return (
          '<div class="ua-co-fd-extra__row">' +
          '<div class="ua-co-fd-extra__main">' +
          '<span class="ua-co-fd-extra__name">' +
          line.name +
          '</span>' +
          '<span class="ua-co-fd-extra__hint">' +
          (line.hint || '') +
          '</span></div>' +
          '<span class="ua-co-fd-extra__fee">' +
          formatMoney(line.amount) +
          '</span></div>'
        );
      })
      .join('');
    return (
      '<div class="ua-co-fd-extra">' +
      '<div class="ua-co-fd-extra__title">增值服务 / 上楼</div>' +
      rows +
      '</div>'
    );
  }

  function renderSchemeBlock(group) {
    if (!group || group.empty || (!group.breakdown && !(group.extras || []).length)) return '';
    var part = schemeParts(group);
    return (
      '<div class="ua-co-fd-scheme">' +
      '<div class="ua-co-fd-scheme__title"><span>' +
      groupSchemeName(group) +
      '</span><strong>' +
      formatMoney(part.total) +
      '</strong></div>' +
      renderFreightBreakdownLines(group) +
      renderGroupExtraBlock(group) +
      '</div>'
    );
  }

  function renderLayerPackage(group, title, moreGroups) {
    var schemes = [group].concat(moreGroups || []).filter(function (item) {
      return item && !item.empty;
    });
    if (!schemes.length) {
      return (
        '<div class="ua-co-fd-pkg">' +
        '<div class="ua-co-fd-pkg__head">' +
        '<div class="ua-co-fd-pkg__main"><span class="ua-co-fd-pkg__name">' +
        title +
        '</span><span class="ua-co-fd-pkg__sub">本单无此温层商品</span></div>' +
        '<span class="ua-co-fd-pkg__fee">' +
        formatMoney(0) +
        '</span></div></div>'
      );
    }
    var primary = schemes[0];
    var bits = [];
    if (primary.itemCount) bits.push(primary.itemCount + '件');
    if (primary.goodsAmount) bits.push('货款' + formatMoney(primary.goodsAmount));
    if (primary.carrier) bits.push(primary.carrier);
    if (primary.level) bits.push('命中' + primary.level);
    var pkgFee = sumSchemeGroups(schemes).total;
    var body = schemes.map(renderSchemeBlock).join('');
    return (
      '<div class="ua-co-fd-pkg">' +
      '<div class="ua-co-fd-pkg__head">' +
      '<div class="ua-co-fd-pkg__main"><span class="ua-co-fd-pkg__name">' +
      title +
      '</span><span class="ua-co-fd-pkg__sub">' +
      (primary.miss || bits.join(' · ')) +
      '</span></div>' +
      '<span class="ua-co-fd-pkg__fee">' +
      formatMoney(pkgFee) +
      '</span></div>' +
      body +
      '</div>'
    );
  }

  function renderFulfillLane(title, quote, mixCmp, preview, freeText) {
    var html =
      '<div class="ua-co-fd-lane">' +
      '<div class="ua-co-fd-lane__title">' +
      title +
      (preview ? '<em class="ua-co-freight-mix__preview">对照试算</em>' : '') +
      '</div>';
    if (freeText) {
      html +=
        '<div class="ua-co-fd-pkg"><div class="ua-co-fd-pkg__head"><div class="ua-co-fd-pkg__main"><span class="ua-co-fd-pkg__sub">' +
        freeText +
        '</span></div><span class="ua-co-fd-pkg__fee">免运费</span></div></div></div>';
      return html;
    }
    var ambient = quote && quote.ambient;
    var cold = quote && quote.cold;
    var moreA = null;
    var moreC = null;
    if (mixCmp) {
      ambient = mixCmp.weight && mixCmp.weight.ambient;
      cold = mixCmp.weight && mixCmp.weight.cold;
      moreA = [mixCmp.amount && mixCmp.amount.ambient, mixCmp.qty && mixCmp.qty.ambient];
      moreC = [mixCmp.amount && mixCmp.amount.cold, mixCmp.qty && mixCmp.qty.cold];
    }
    html += renderLayerPackage(ambient, '常温包裹', moreA);
    html += renderLayerPackage(cold, '冷链包裹', moreC);
    html += '</div>';
    return html;
  }

  function renderFulfillTotals(label, fee, quote, showUpstairs) {
    var ambient = groupLayerFee(quote, 'ambient');
    var cold = groupLayerFee(quote, 'cold');
    var extra = quote ? Number(quote.serviceTotal) || 0 : 0;
    var html =
      '<div class="ua-co-freight-detail__total"><span>' +
      label +
      '</span><strong>' +
      (fee > 0 ? formatMoney(fee) : '免运费') +
      '</strong></div>';
    if (!(fee > 0) && !quote) return html;
    html +=
      '<div class="ua-co-freight-detail__subs">' +
      '<div class="ua-co-freight-detail__sub"><span>常温基础运费</span><span>' +
      formatMoney(ambient) +
      '</span></div>' +
      '<div class="ua-co-freight-detail__sub"><span>冷链基础运费</span><span>' +
      formatMoney(cold) +
      '</span></div>' +
      '<div class="ua-co-freight-detail__sub"><span>' +
      (showUpstairs ? '增值 / 上楼' : '增值服务') +
      '</span><span>' +
      formatMoney(extra) +
      '</span></div></div>';
    return html;
  }

  function renderFreightDetail() {
    var el = document.getElementById('checkoutFreightDetail');
    if (!el) return;
    var info = calcFreightBreakdown();
    var quote = info.quote || {};
    var expressQuote = info.expressQuote || {};
    var deliveryFee = Number(info.deliveryFee) || 0;
    var expressFee = Number(info.expressFee) || 0;
    var mix = info.mixCompare;
    var totals = '';
    if (info.hasDelivery) {
      totals += renderFulfillTotals('配送费', deliveryFee, quote, true);
    }
    if (info.hasExpress) {
      totals += renderFulfillTotals('快递费', expressFee, expressQuote, false);
    }
    var body = '';
    if (info.hasDelivery) {
      body += renderFulfillLane('配送费', quote, mix && mix.delivery, mix && mix.deliveryPreview);
    }
    if (info.hasExpress) {
      var expressFree = !(expressQuote && !expressQuote.freeShip && expressFee > 0) && !mix;
      body += renderFulfillLane(
        '快递费',
        expressQuote,
        mix && mix.express,
        mix && mix.expressPreview,
        expressFree ? '按包邮配置不收取' : ''
      );
    }
    el.innerHTML =
      '<div class="ua-co-freight-detail">' +
      '<div class="ua-co-freight-detail__totals">' +
      totals +
      '</div>' +
      '<div class="ua-co-freight-detail__total ua-co-freight-detail__total--sum"><span>总运费</span><strong>' +
      (info.total > 0 ? formatMoney(info.total) : '免运费') +
      '</strong></div>' +
      body +
      '</div>';
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
    if (method.type === 'card') {
      payState.channel = 'card';
      return;
    }
    if (method.type === 'alipay' || method.type === 'wechat') {
      applyChannelToPayState(method.type);
      saveLastChannelPref(method.type);
      return;
    }
    payState.channel = 'wechat';
  }

  function collectBlockOrderItems(block) {
    var items = [];
    (block && block.packages ? block.packages : []).forEach(function (pkg) {
      var fulfillType = getPackageFulfillment(pkg) === '快递' ? 'express' : 'delivery';
      (pkg.items || []).forEach(function (item) {
        items.push({
          id: item.id,
          name: item.title || item.name || '',
          spec: item.spec || '',
          img: item.img || '',
          qty: item.qty || 1,
          price: Number(item.priceNum != null ? item.priceNum : item.price) || 0,
          tempLayer: item.tempLayer || '',
          spuId: item.spuId || '',
          fulfillType: fulfillType,
          supplierId: item.supplierId || (block.kind === 'express' ? block.id : ''),
          supplierName: item.supplierName || (block.kind === 'express' ? block.name : '')
        });
      });
    });
    return items;
  }

  function collectCheckoutOrderItems() {
    var items = [];
    (state.suppliers || []).forEach(function (sup) {
      collectBlockOrderItems(sup).forEach(function (it) {
        items.push(it);
      });
    });
    return items;
  }

  function checkoutBlockKind(block) {
    var name = (block && block.name) || '';
    if (/W002|嘉兴仓/.test(name) || /^W00\d/.test(name) || /仓$/.test(name) && !/供应商/.test(name)) {
      return 'delivery';
    }
    if (block && block.kind) return block.kind;
    var pkg = block && block.packages && block.packages[0];
    return pkg && pkg.deliveryType === 'store' ? 'express' : 'delivery';
  }

  function resolveExpressOrderShopName(block) {
    var id = (block && block.id) || '';
    var name = (block && block.name) || '';
    if (id === 'supplier-huadong' || name === '华东冷链' || name === '华东冷链仓') {
      return '华东冷链供应商';
    }
    return name;
  }

  /**
   * 按商品金额占比分摊支付方式到各商品明细（原路退回依据）
   * payLegs: [{ name, amount }]
   */
  function allocatePayLegsToItems(items, payLegs) {
    var list = (items || []).map(function (it) {
      var line = Math.round(Number(it.price || 0) * Number(it.qty || 1) * 100) / 100;
      return Object.assign({}, it, { lineAmount: line, payLegs: [] });
    });
    var total = list.reduce(function (s, it) {
      return s + (it.lineAmount || 0);
    }, 0);
    var legs = (payLegs || []).filter(function (leg) {
      return leg && Number(leg.amount) > 0.001;
    });
    if (!list.length || !legs.length) return list;
    if (total <= 0) {
      list[0].payLegs = legs.map(function (leg) {
        return { name: leg.name, amount: Math.round(Number(leg.amount) * 100) / 100 };
      });
      return list;
    }
    legs.forEach(function (leg) {
      var remain = Math.round(Number(leg.amount) * 100) / 100;
      list.forEach(function (it, idx) {
        var share =
          idx === list.length - 1
            ? remain
            : Math.round(((it.lineAmount / total) * Number(leg.amount)) * 100) / 100;
        if (share < 0) share = 0;
        if (idx < list.length - 1) remain = Math.round((remain - share) * 100) / 100;
        if (share > 0.001) {
          it.payLegs.push({ name: leg.name, amount: share });
        }
      });
    });
    return list;
  }

  function persistPaidCheckoutOrders(legs) {
    var blocks = (state.suppliers || []).filter(function (block) {
      return collectBlockOrderItems(block).length;
    });
    if (!blocks.length) return [];
    var parts = buildPayLegParts(legs);
    var pointsAmt = state.pointsEnabled ? Number(state.pointsDeduct) || 0 : 0;
    var pointsCount = state.pointsEnabled ? Number(state.pointsAvailable) || 0 : 0;
    var payMethod = formatPayMethodNames(parts);
    var freightInfo = calcFreightBreakdown();
    var svc = freightInfo.serviceSummary || {};
    var coupon = state.coupon ? Number(state.coupon.amount) || 0 : 0;
    var activity = Number(state.activityDiscount) || 0;
    var totalGoods = getGoodsSubtotal();
    var groupId = window.UaOrdersStore ? window.UaOrdersStore.genOrderNo() : String(Date.now());
    var nos = blocks.map(function (_, i) {
      return window.UaOrdersStore ? window.UaOrdersStore.genOrderNo() : String(Date.now() + i);
    });
    var remainCoupon = coupon;
    var remainActivity = activity;
    var remainPointsAmt = pointsAmt;
    var remainPointsCount = pointsCount;
    var remainParts = parts.map(function (p) {
      return Math.round(Number(p.amount) * 100) / 100;
    });
    var saved = [];
    var deliveryIdx = -1;
    var expressIdx = -1;
    blocks.forEach(function (block, idx) {
      if (checkoutBlockKind(block) === 'delivery') deliveryIdx = idx;
      else expressIdx = idx;
    });
    blocks.forEach(function (block, idx) {
      var rawItems = collectBlockOrderItems(block);
      var goodsTotal = Math.round(
        rawItems.reduce(function (s, it) {
          return s + (Number(it.price) || 0) * (Number(it.qty) || 1);
        }, 0) * 100
      ) / 100;
      var last = idx === blocks.length - 1;
      var share = totalGoods > 0 ? goodsTotal / totalGoods : 1 / blocks.length;
      var isDelivery = checkoutBlockKind(block) === 'delivery';
      var freight = 0;
      if (isDelivery && idx === deliveryIdx) {
        freight = Number(freightInfo.deliveryFee) || 0;
      } else if (!isDelivery && idx === expressIdx) {
        freight = Number(freightInfo.expressFee) || 0;
      }
      var thisCoupon = last ? remainCoupon : Math.round(coupon * share * 100) / 100;
      remainCoupon = Math.round((remainCoupon - thisCoupon) * 100) / 100;
      var thisActivity = last ? remainActivity : Math.round(activity * share * 100) / 100;
      remainActivity = Math.round((remainActivity - thisActivity) * 100) / 100;
      var thisPointsAmt = last ? remainPointsAmt : Math.round(pointsAmt * share * 100) / 100;
      remainPointsAmt = Math.round((remainPointsAmt - thisPointsAmt) * 100) / 100;
      var thisPointsCount = last ? remainPointsCount : Math.round(pointsCount * share);
      remainPointsCount -= thisPointsCount;
      var payable = Math.round((goodsTotal + freight - thisCoupon - thisActivity - thisPointsAmt) * 100) / 100;
      if (payable < 0) payable = 0;
      var orderParts = parts
        .map(function (p, pi) {
          var amt = last
            ? remainParts[pi]
            : Math.round(Number(p.amount) * share * 100) / 100;
          remainParts[pi] = Math.round((remainParts[pi] - amt) * 100) / 100;
          return { name: p.name, amount: amt };
        })
        .filter(function (p) {
          return p.amount > 0.001;
        });
      var items = allocatePayLegsToItems(rawItems, orderParts);
      var siblingNos = nos.filter(function (n) {
        return n !== nos[idx];
      });
      var payload = {
        orderNo: nos[idx],
        status: 'shipping',
        createdAt: window.UaOrdersStore ? window.UaOrdersStore.nowText() : '',
        paidAt: window.UaOrdersStore ? window.UaOrdersStore.nowText() : '',
        goodsTotal: goodsTotal,
        freight: freight,
        ambientFee: isDelivery
          ? freightInfo.ambientFee
          : (freightInfo.expressQuote && freightInfo.expressQuote.ambient && freightInfo.expressQuote.ambient.amount) || 0,
        coldFee: isDelivery
          ? freightInfo.coldFee
          : (freightInfo.expressQuote && freightInfo.expressQuote.cold && freightInfo.expressQuote.cold.amount) || 0,
        insureFee: isDelivery
          ? (svc.insure && svc.insure.amount) || 0
          : (freightInfo.expressQuote &&
              freightInfo.expressQuote.serviceSummary &&
              freightInfo.expressQuote.serviceSummary.insure &&
              freightInfo.expressQuote.serviceSummary.insure.amount) ||
            0,
        deliverFee: isDelivery
          ? (svc.deliver && svc.deliver.amount) || 0
          : (freightInfo.expressQuote &&
              freightInfo.expressQuote.serviceSummary &&
              freightInfo.expressQuote.serviceSummary.deliver &&
              freightInfo.expressQuote.serviceSummary.deliver.amount) ||
            0,
        upstairsFee: isDelivery ? (svc.upstairs && svc.upstairs.amount) || 0 : 0,
        upstairs: isDelivery && state.upstairs
          ? { hasElevator: state.upstairs.hasElevator !== false, floor: state.upstairs.floor }
          : null,
        payable: payable,
        payLabel: formatMoney(payable),
        payMethod: payMethod,
        payNo:
          window.UaOrdersStore && typeof window.UaOrdersStore.demoPayNo === 'function'
            ? window.UaOrdersStore.demoPayNo(groupId, payMethod)
            : '',
        payLegs: orderParts,
        deductPoints: thisPointsCount,
        deductAmount: thisPointsAmt,
        from: 'restock.html',
        store: state.store || null,
        fulfillType: isDelivery ? 'delivery' : 'express',
        warehouse: isDelivery ? (block.packages[0] && block.packages[0].warehouse) || block.name : '',
        supplierName: isDelivery ? '' : resolveExpressOrderShopName(block),
        splitKind: isDelivery ? 'delivery' : 'express',
        splitGroupId: blocks.length > 1 ? groupId : '',
        siblingOrderNo: siblingNos[0] || '',
        siblingOrderNos: siblingNos,
        items: items.map(function (it) {
          var copy = Object.assign({}, it || {});
          delete copy.skipDemandSummary;
          delete copy.spotDirectVerify;
          if (copy.fulfillTag === '现货直核') delete copy.fulfillTag;
          return copy;
        })
      };
      if (window.UaOrdersStore && typeof window.UaOrdersStore.upsert === 'function') {
        saved.push(window.UaOrdersStore.upsert(payload));
      } else {
        saved.push(payload);
      }
    });
    return saved;
  }

  /** 支付成功写入演示订单；混配送+快递时按仓/供应商拆成多单 */
  function persistPaidCheckoutOrder(legs) {
    var list = persistPaidCheckoutOrders(legs);
    return list[0] || null;
  }

  var lastPaidOrder = null;
  var lastPaidOrders = [];

  /** 混合支付：冻结积分+余额 → 等待三方/密码成功后再解冻划拨 */
  function beginPayFreeze(legs) {
    var L = legs || getPayLegs();
    var pointsAmt = state.pointsEnabled ? Number(state.pointsDeduct) || 0 : 0;
    if (
      window.StoreWalletDemo &&
      typeof window.StoreWalletDemo.freezeRestockPay === 'function' &&
      (L.balanceLeg > 0.001 || pointsAmt > 0)
    ) {
      return window.StoreWalletDemo.freezeRestockPay({
        balanceAmount: L.balanceLeg,
        pointsAmount: pointsAmt,
        channel: L.channel || payState.channel || ''
      });
    }
    return { ok: true, skipped: true };
  }

  function settlePayAfterChannelOk(legs) {
    var L = legs || getPayLegs();
    var channelLabel = payChannelShortName(L.channel || payState.channel);
    var result = { ok: true };
    if (
      window.StoreWalletDemo &&
      typeof window.StoreWalletDemo.commitRestockPayFreeze === 'function'
    ) {
      var committed = window.StoreWalletDemo.commitRestockPayFreeze({
        balanceAmount: L.balanceLeg,
        channel: L.channel || payState.channel,
        channelLabel: channelLabel
      });
      if (committed && committed.ok) result = committed;
    } else if (
      L.balanceLeg > 0 &&
      window.StoreWalletDemo &&
      typeof window.StoreWalletDemo.applyRestockPay === 'function'
    ) {
      window.StoreWalletDemo.applyRestockPay(L.balanceLeg, {
        channel: L.channel || payState.channel,
        channelLabel: channelLabel
      });
    }
    /* 三方回调成功并解冻划拨余额后，再扣减积分 */
    if (state.pointsEnabled) {
      state.pointsAvailable = 0;
      state.pointsEnabled = false;
      state.pointsDeduct = 0;
    }
    return result;
  }

  function releasePayFreeze() {
    if (
      window.StoreWalletDemo &&
      typeof window.StoreWalletDemo.releaseRestockPayFreeze === 'function'
    ) {
      window.StoreWalletDemo.releaseRestockPayFreeze();
    }
  }

  function finishPaySuccess(paidLegs) {
    var legs = paidLegs || getPayLegs();
    /* 先落库/展示（含积分分摊），再解冻划拨余额并扣减积分 */
    lastPaidOrders = persistPaidCheckoutOrders(legs);
    lastPaidOrder = lastPaidOrders[0] || null;
    showResult(true, legs);
    settlePayAfterChannelOk(legs);
  }

  function finishPayFail(paidLegs) {
    releasePayFreeze();
    showResult(false, paidLegs || getPayLegs());
  }

  /** 微信/支付宝：演示跳转三方收单；混合支付先冻结再等回调 */
  function jumpThirdPartyPay(method) {
    applySelectedMethod(method);
    closeSheet('method');
    var legs = getPayLegs();
    legs.channel = payState.channel;
    var freeze = beginPayFreeze(legs);
    if (freeze && freeze.ok === false) {
      window.alert(freeze.message || '余额冻结失败');
      return;
    }
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
    if (text) {
      text.textContent =
        '已冻结余额/积分，正在验证' + method.name + '回调…';
    }
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
    var freeze = beginPayFreeze(legs);
    if (freeze && freeze.ok === false) {
      window.alert(freeze.message || '余额冻结失败');
      return;
    }
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
      var splitParts = buildPayLegParts(legs);
      if (legs.balanceLeg > 0 && legs.channelLeg > 0) {
        sheetSplit.hidden = false;
        sheetSplit.innerHTML = formatPayLegsRowsHtml(splitParts, 'ua-co-pay-legs ua-co-pay-legs--sheet');
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
        /* 密码结算中关闭面板：保留冻结，成功 commit / 失败 release */
        closeSheet('pay');
        var success = payPwd !== '000000';
        var paidLegs = getPayLegs();
        paidLegs.channel = payState.channel === 'balance' ? 'balance' : payState.channel;
        if (success) finishPaySuccess(paidLegs);
        else finishPayFail(paidLegs);
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
      var parts = buildPayLegParts(legs).filter(function (p) {
        return p && Number(p.amount) > 0.001;
      });
      var isMixed = parts.length >= 2;
      var amountHtml = isMixed
        ? '<div class="ua-co-result__amount-line">' +
          '<span class="ua-co-result__amount">' +
          formatMoney(legs.payable) +
          '</span>' +
          payLegsToggleBtnHtml() +
          '</div>' +
          formatPayLegsRowsHtml(parts, 'ua-co-pay-legs ua-co-pay-legs--result', { hidden: true })
        : '<div class="ua-co-result__amount">' + formatMoney(legs.payable) + '</div>';
      body.innerHTML =
        '<div class="ua-co-result__icon ua-co-result__icon--success">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg></div>' +
        '<div class="ua-co-result__title">支付成功</div>' +
        amountHtml +
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
      if (isMixed) bindPayLegsToggle('checkoutPayLegsToggle', '.ua-co-pay-legs--result');
      document.getElementById('checkoutResultOrders').addEventListener('click', function () {
        if (isStoreAppPort()) {
          if (lastPaidOrders && lastPaidOrders.length > 1) {
            window.location.href =
              window.LfAppShell && window.LfAppShell.restockOrdersHref
                ? window.LfAppShell.restockOrdersHref()
                : '../../store-app/h5/restock-orders.html';
            return;
          }
          var paid = lastPaidOrder;
          window.location.href =
            paid && paid.orderNo && window.LfAppShell && window.LfAppShell.restockDetailHref
              ? window.LfAppShell.restockDetailHref(paid.orderNo)
              : paid && paid.orderNo
                ? '../../store-app/h5/restock-order-detail.html?orderNo=' + encodeURIComponent(paid.orderNo)
                : '../../store-app/h5/restock-orders.html';
          return;
        }
        if (lastPaidOrders && lastPaidOrders.length > 1) {
          window.location.href = 'orders.html?from=restock.html&tab=shipping';
          return;
        }
        var order = lastPaidOrder;
        if (order && window.UaOrdersStore && window.UaOrdersStore.buildDetailHref) {
          window.location.href = window.UaOrdersStore.buildDetailHref(order);
          return;
        }
        if (order && order.orderNo) {
          window.location.href =
            'order-detail.html?status=shipping&orderNo=' +
            encodeURIComponent(order.orderNo) +
            '&from=restock.html';
          return;
        }
        window.location.href = 'orders.html?from=restock.html&tab=shipping';
      });
      document.getElementById('checkoutResultHome').addEventListener('click', function () {
        window.location.href = isStoreAppPort() ? 'restock.html?from=store-app' : 'restock.html';
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
        window.location.href = isStoreAppPort()
          ? window.LfAppShell && window.LfAppShell.restockOrdersHref
            ? window.LfAppShell.restockOrdersHref()
            : '../../store-app/h5/restock-orders.html'
          : 'orders.html?from=restock.html&tab=unpaid';
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
   * 1) 仅纯余额支付 → 支付密码半层
   * 2) 混合支付 / 纯支付宝 / 微信 → 不输支付密码，直接跳三方收单
   */
  function onSubmitOrder() {
    if (isBdAppBrowse()) {
      var tip = (window.UaProxySaleScope && window.UaProxySaleScope.BD_ONLY_ORDER_TIP) || '仅门店用户采购';
      if (saleApi() && saleApi().showToast) saleApi().showToast(tip);
      else window.alert(tip);
      return;
    }
    if (!applyCheckoutSaleableGuard()) return;
    if (!validateBeforeSubmit()) return;
    var legs = getPayLegs();
    if (payState.useBalance && legs.balanceOnly) {
      payState.channel = 'balance';
      payState.methodName = '钱包余额';
      openPaySheet();
      return;
    }
    if (!isPayChannel(payState.channel)) {
      window.alert(legs.balanceLeg > 0.001 ? '请选择支付宝或微信补足差额' : '请选择支付方式');
      return;
    }
    var channel = payState.channel;
    var method = buildPayMethods().find(function (m) {
      return m.type === channel;
    });
    if (method) {
      jumpThirdPartyPay(method);
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

    var accessCard = document.getElementById('checkoutAccessCard');
    if (accessCard) {
      accessCard.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'checkoutUpstairsFloor') {
          if (!state.upstairs) state.upstairs = loadUpstairsPref();
          state.upstairs.floor = e.target.value === '' ? 1 : e.target.value;
          saveUpstairsPref();
          refreshFreightAmounts();
        }
      });
      accessCard.addEventListener('input', function (e) {
        if (!e.target || e.target.id !== 'checkoutUpstairsFloor') return;
        if (!state.upstairs) state.upstairs = loadUpstairsPref();
        state.upstairs.floor = e.target.value === '' ? 1 : e.target.value;
        saveUpstairsPref();
        refreshFreightAmounts();
      });
      accessCard.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-upstairs-lift]');
        if (!btn) return;
        if (!state.upstairs) state.upstairs = loadUpstairsPref();
        state.upstairs.hasElevator = btn.getAttribute('data-upstairs-lift') === '1';
        saveUpstairsPref();
        renderAccessCard();
        refreshFreightAmounts();
      });
    }

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
        var sheetName = el.getAttribute('data-sheet-close');
        /* 用户取消密码支付：释放已冻结的余额/积分 */
        if (sheetName === 'pay') releasePayFreeze();
        closeSheet(sheetName);
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

    document.getElementById('checkoutPayForgot') &&
      document.getElementById('checkoutPayForgot').addEventListener('click', function () {
        var path = window.location.pathname.split('/').pop() + window.location.search;
        var q = new URLSearchParams();
        q.set('step', 'sms');
        q.set('from', 'checkout');
        q.set('return', path);
        var appFrom = new URLSearchParams(window.location.search).get('from');
        if (appFrom) q.set('appFrom', appFrom);
        window.location.href = 'store-pay-password.html?' + q.toString();
      });

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
        syncChannelWhenBalanceChanged();
        renderSummary();
      });

    document.getElementById('checkoutChannelCard') &&
      document.getElementById('checkoutChannelCard').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-channel]');
        if (!btn) return;
        var channel = btn.getAttribute('data-channel');
        if (channel !== 'alipay' && channel !== 'wechat') return;
        /* 再次点击已选项 → 取消勾选 */
        if (payState.channel === channel) {
          clearChannelSelection();
        } else {
          applyChannelToPayState(channel);
          saveLastChannelPref(channel);
        }
        syncChannelCardUI();
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
      back.setAttribute('href', cartBackHref());
    }
    if (isBdAppBrowse()) {
      document.title = '确认订单 · BD APP';
      var body = document.getElementById('checkoutBody');
      if (body && !document.getElementById('checkoutBdTip')) {
        var tip = document.createElement('p');
        tip.id = 'checkoutBdTip';
        tip.className = 'ua-co-bd-tip';
        tip.textContent = 'BD 查看模式，提交订单将提示「仅门店用户采购」';
        body.insertBefore(tip, body.firstChild);
      }
    }
  }

  initState();
  applyPickedAddressFromBook();
  initPayChannelSelection();
  renderAll();
  bindEvents();
  if (saleApi() && saleApi().mountDemoPanel) {
    saleApi().mountDemoPanel({
      className: 'ua-sale-time-demo--confirm ua-sale-time-demo--mix-stack',
      variant: 'checkout'
    });
  }
  mountMixPayDemoPanel();
  mountFreightSchemeDemoPanel();
  if (isMixFreightDemo()) {
    openFreightSheet();
  }
})();
