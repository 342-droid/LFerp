/**
 * 用户 APP — 商城秒杀命中（与 B 端 mdm_marketing_seckill_v1 联动）
 * 验收开关：售卖范围 / 活动状态 / 用户身份 / 购买限制 / 不符合条件用户
 */
(function (global) {
  'use strict';

  var DEMO_KEY = 'ua_seckill_demo_v1';
  var LIMIT_LABEL = {
    none: '不限购',
    per_order: '每单限购',
    per_user: '每用户限购',
    per_day: '每天限购',
    order: '每单限购',
    daily: '每天限购',
    total: '累计限购'
  };
  var POINT_LABEL = {
    cash: '现金',
    points: '纯积分兑换',
    points_cash: '积分+现金'
  };

  function store() {
    return global.MdmMarketingSeckillStore;
  }

  function readDemo() {
    var d = {
      hit: 'hit',
      status: 'active',
      user: 'new',
      buyLimit: 'auto',
      unqualified: 'auto'
    };
    try {
      var raw = localStorage.getItem(DEMO_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.hit === 'miss' || parsed.hit === 'hit') d.hit = parsed.hit;
          if (parsed.status === 'ended' || parsed.status === 'active') d.status = parsed.status;
          if (parsed.user === 'old' || parsed.user === 'new') d.user = parsed.user;
          if (parsed.buyLimit === 'neu' || parsed.buyLimit === 'all' || parsed.buyLimit === 'auto') {
            d.buyLimit = parsed.buyLimit;
          }
          if (parsed.unqualified === 'deny' || parsed.unqualified === 'origin' || parsed.unqualified === 'auto') {
            d.unqualified = parsed.unqualified;
          }
        }
      }
    } catch (e) {}
    return d;
  }

  function writeDemo(next) {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(next || readDemo()));
    } catch (e) {}
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function productOnShelf(p) {
    var st = p && p.status;
    return st === 'enabled' || st === 'on_shelf' || st === 'listing';
  }

  function skuOnShelf(sku) {
    return !sku || (sku.onShelf !== false && sku.enabled !== false);
  }

  function skuMatchesSpec(sku, spec) {
    spec = String(spec || '');
    if (!spec || !sku) return false;
    var keys = [sku.displayName, sku.specName, sku.specValue].filter(Boolean).map(String);
    return keys.some(function (k) {
      if (spec === k) return true;
      if (spec.indexOf(k) >= 0) return true;
      if (k.indexOf(spec) >= 0) return true;
      return false;
    });
  }

  function intersectPairs(mallProduct, seckillProduct) {
    var api = store();
    var mallSpecs = (mallProduct && mallProduct.specs) || [];
    var skus = api && api.skusOf ? api.skusOf(seckillProduct) : seckillProduct.skus || [];
    skus = skus.filter(skuOnShelf);
    var pairs = [];
    mallSpecs.forEach(function (spec) {
      for (var i = 0; i < skus.length; i++) {
        if (skuMatchesSpec(skus[i], spec)) {
          pairs.push({ spec: spec, sku: skus[i] });
          return;
        }
      }
    });
    return pairs;
  }

  function findMatch(product) {
    var api = store();
    if (!api || !product || !product.id) return null;
    var demo = readDemo();
    if (demo.hit === 'miss') return null;
    if (demo.status === 'ended') return null;
    var list = api.getList() || [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var scenes = item.scenes || [];
      if (scenes.indexOf('mall') < 0) continue;
      var st = demo.status === 'active' ? 'active' : api.computeStatus(item);
      if (st !== 'active') continue;
      var products = item.products || [];
      for (var j = 0; j < products.length; j++) {
        var sp = products[j];
        if (!productOnShelf(sp)) continue;
        var mallId = sp.mallProductId || sp.sku || '';
        if (mallId === product.id || sp.sku === product.id || sp.id === product.id) {
          return { activity: item, product: sp };
        }
      }
    }
    return null;
  }

  function pickPair(pairs, spec) {
    if (!pairs.length) return null;
    if (spec) {
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i].spec === spec) return pairs[i];
      }
    }
    return pairs[0];
  }

  function seckillPriceOf(sku) {
    if (!sku) return null;
    var n = sku.salePrice != null && sku.salePrice !== '' ? Number(sku.salePrice) : Number(sku.price);
    return isNaN(n) ? null : n;
  }

  function linePriceOf(sku) {
    if (!sku) return null;
    var n = sku.linePrice != null && sku.linePrice !== '' ? Number(sku.linePrice) : Number(sku.marketPrice);
    return isNaN(n) ? null : n;
  }

  function resolve(product, opts) {
    opts = opts || {};
    var empty = { hit: false, showSeckill: false, qualified: true, deny: false, useOriginPrice: false };
    if (!product) return empty;
    var found = findMatch(product);
    if (!found) return empty;
    var demo = readDemo();
    var pairs = intersectPairs(product, found.product);
    if (!pairs.length) return empty;
    var spec = opts.spec || product.defaultSpec || product.spec || '';
    var pair = pickPair(pairs, spec);
    var sku = pair && pair.sku;
    var buyLimit = demo.buyLimit === 'auto' ? found.activity.buyLimit : demo.buyLimit;
    var unqualified =
      demo.unqualified === 'auto' ? found.activity.unqualifiedMode || 'deny' : demo.unqualified;
    var isNew = demo.user !== 'old';
    var qualified = buyLimit !== 'neu' || isNew;
    var deny = !qualified && unqualified === 'deny';
    var useOriginPrice = !qualified && unqualified === 'origin';
    var api = store();
    var orderable = sku && api && api.orderableStockOf ? api.orderableStockOf(sku) : 0;
    var soldText = '';
    if (found.product.displaySalesMode === 'CUSTOM' && found.product.displaySales) {
      soldText = String(found.product.displaySales);
    } else if (product.sold != null) {
      soldText = String(product.sold);
    }
    return {
      hit: true,
      showSeckill: true,
      qualified: qualified,
      deny: deny,
      useOriginPrice: useOriginPrice,
      activity: found.activity,
      product: found.product,
      sku: sku,
      spec: pair ? pair.spec : spec,
      specs: pairs.map(function (p) {
        return p.spec;
      }),
      price: seckillPriceOf(sku),
      linePrice: linePriceOf(sku),
      deliveryMode: found.product.deliveryMode || '',
      displaySalesMode: found.product.displaySalesMode || '',
      displaySales: found.product.displaySales || '',
      soldText: soldText,
      saleUnit: sku && sku.saleUnit ? sku.saleUnit : '',
      limitConfig: sku && sku.limitConfig ? sku.limitConfig : '',
      limitLabel: sku && sku.limitConfig ? LIMIT_LABEL[sku.limitConfig] || sku.limitConfig : '',
      pointExchange: sku && sku.pointExchange ? sku.pointExchange : '',
      pointLabel: sku && sku.pointExchange ? POINT_LABEL[sku.pointExchange] || sku.pointExchange : '',
      minQty: sku && sku.minQty != null && sku.minQty !== '' ? sku.minQty : '',
      orderableStock: orderable,
      endAt: found.activity.timeMode === 'forever' ? '' : found.activity.endAt,
      forever: found.activity.timeMode === 'forever',
    };
  }

  function unitPrice(item) {
    if (!item || item.source === 'live') return null;
    var p = (global.UAShop && global.UAShop.PRODUCTS && global.UAShop.PRODUCTS[item.id]) || { id: item.id };
    p.id = item.id;
    if (!p.specs && global.UAShop && global.UAShop.PRODUCTS && global.UAShop.PRODUCTS[item.id]) {
      p = global.UAShop.PRODUCTS[item.id];
    }
    var hit = resolve(p, { spec: item.spec || p.spec || p.defaultSpec });
    if (!hit.showSeckill || hit.useOriginPrice || hit.deny) return null;
    if (!hit.qualified) return null;
    return hit.price;
  }

  function cartTagHtml(item) {
    var p = (global.UAShop && global.UAShop.PRODUCTS && global.UAShop.PRODUCTS[item && item.id]) || {
      id: item && item.id
    };
    var hit = resolve(p, { spec: item && item.spec });
    if (!hit.showSeckill) return '';
    return '<span class="ua-cart-item__tag ua-cart-item__tag--seckill">秒杀</span>';
  }

  function toast(msg) {
    if (global.UAShop && typeof global.UAShop.showToast === 'function') {
      global.UAShop.showToast(msg);
      return;
    }
    if (typeof global.showToast === 'function') global.showToast(msg);
  }

  function guardPurchase(product, spec) {
    var hit = resolve(product, { spec: spec });
    if (hit.deny) {
      toast('当前用户不符合秒杀参与条件，不支持购买');
      return false;
    }
    return true;
  }

  function formatMoney(n) {
    var num = Number(n);
    if (isNaN(num)) return '';
    return '¥' + (num % 1 === 0 ? String(num) : num.toFixed(2));
  }

  var countdownTimer = null;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function parseEnd(dt) {
    if (!dt) return 0;
    var t = Date.parse(String(dt).trim().replace(' ', 'T'));
    return isNaN(t) ? 0 : t;
  }

  function formatRemain(ms) {
    if (ms <= 0) return '00:00:00';
    var total = Math.floor(ms / 1000);
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var hms = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    return d > 0 ? d + '天 ' + hms : hms;
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown(endAt) {
    stopCountdown();
    var el = document.getElementById('goodsDetailSeckillCountdown');
    var wrap = document.getElementById('goodsDetailSeckillCountdownWrap');
    if (!el) return;
    function tick() {
      var left = parseEnd(endAt) - Date.now();
      if (left <= 0) {
        el.textContent = '00:00:00';
        stopCountdown();
        return;
      }
      el.textContent = formatRemain(left);
    }
    if (wrap) wrap.hidden = false;
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function applyGoodsDetail(product, selectedSpec) {
    var hit = resolve(product, { spec: selectedSpec });
    var page = document.querySelector('.ua-gd-page');
    var info = document.getElementById('goodsDetailInfo') || document.querySelector('.ua-gd-info');
    var band = document.getElementById('goodsDetailSeckillBand');
    var tag = document.getElementById('goodsDetailSeckillTag');
    var meta = document.getElementById('goodsDetailSeckillMeta');
    var priceRow = document.getElementById('goodsDetailPriceRow') || document.querySelector('.ua-gd-info__price-row');
    var noteEl = document.getElementById('goodsDetailSeckillNote');
    var cdWrap = document.getElementById('goodsDetailSeckillCountdownWrap');
    if (page) page.classList.toggle('is-seckill', !!hit.showSeckill);
    if (info) info.classList.toggle('is-seckill', !!hit.showSeckill);
    if (tag) tag.hidden = !hit.showSeckill;
    if (band) band.hidden = !hit.showSeckill;
    if (priceRow) priceRow.classList.toggle('is-seckill-hidden', !!hit.showSeckill);
    if (!hit.showSeckill) {
      stopCountdown();
      if (meta) {
        meta.hidden = true;
        meta.innerHTML = '';
      }
      if (noteEl) {
        noteEl.hidden = true;
        noteEl.textContent = '';
      }
      return hit;
    }
    var payPrice = hit.useOriginPrice || hit.deny ? product.price : hit.price;
    var origin = hit.useOriginPrice || hit.deny ? product.originPrice : hit.linePrice || product.originPrice;
    var priceEl = document.getElementById('goodsDetailSeckillPrice');
    var originEl = document.getElementById('goodsDetailSeckillOrigin');
    var stockEl = document.getElementById('goodsDetailSeckillStock');
    var soldEl = document.getElementById('goodsDetailSeckillSold');
    if (priceEl) priceEl.innerHTML = '<small>¥</small>' + (payPrice != null ? payPrice : '');
    if (originEl) {
      if (origin) {
        originEl.hidden = false;
        originEl.textContent = formatMoney(origin);
      } else {
        originEl.hidden = true;
      }
    }
    if (stockEl) stockEl.textContent = '可购' + (hit.orderableStock != null ? hit.orderableStock : '—');
    if (soldEl) soldEl.textContent = '已售' + (hit.soldText || '0');
    if (hit.forever) {
      stopCountdown();
      if (cdWrap) {
        cdWrap.hidden = false;
        cdWrap.innerHTML = '长期有效';
      }
    } else if (hit.endAt) {
      if (cdWrap) {
        cdWrap.hidden = false;
        cdWrap.innerHTML = '距结束 <em id="goodsDetailSeckillCountdown">--:--:--</em>';
      }
      startCountdown(hit.endAt);
    } else if (cdWrap) {
      cdWrap.hidden = true;
    }
    if (noteEl) {
      if (hit.deny) {
        noteEl.hidden = false;
        noteEl.textContent = '不符合参与条件，不支持购买';
      } else if (hit.useOriginPrice) {
        noteEl.hidden = false;
        noteEl.textContent = '不符合参与条件，按原价购买';
      } else {
        noteEl.hidden = true;
        noteEl.textContent = '';
      }
    }
    if (meta) {
      var chips = [];
      if (hit.deliveryMode === 'pickup') chips.push('自提');
      else if (hit.deliveryMode === 'express') chips.push('快递配送');
      if (hit.saleUnit) chips.push('单位 ' + hit.saleUnit);
      if (hit.limitLabel) chips.push(hit.limitLabel);
      if (hit.pointLabel) chips.push(hit.pointLabel);
      if (hit.minQty !== '' && hit.minQty != null) chips.push('起售 ' + hit.minQty);
      if (hit.orderableStock != null) chips.push('活动库存 ' + hit.orderableStock);
      meta.hidden = !chips.length;
      meta.innerHTML = chips
        .map(function (c) {
          return '<span>' + escapeHtml(c) + '</span>';
        })
        .join('');
    }
    var soldPlain = document.getElementById('goodsDetailSold');
    if (soldPlain && hit.soldText) soldPlain.textContent = '已售' + hit.soldText;
    return hit;
  }

  function mountDemoPanel(opts) {
    opts = opts || {};
    if (document.getElementById('uaSeckillDemo')) return;
    var demo = readDemo();
    var panel = document.createElement('div');
    panel.id = 'uaSeckillDemo';
    panel.className = 'ua-rg-demo ua-sk-demo' + (opts.className ? ' ' + opts.className : '');
    function opt(id, value, label) {
      return (
        '<option value="' +
        value +
        '"' +
        (demo[id] === value ? ' selected' : '') +
        '>' +
        label +
        '</option>'
      );
    }
    panel.innerHTML =
      '<div class="ua-rg-demo__title">秒杀验收开关</div>' +
      '<p class="ua-sk-demo__hint">命中且进行中出秒杀样式；未命中或已结束回普通属性</p>' +
      '<label class="ua-rg-demo__row">售卖范围<select id="uaSkDemoHit">' +
      opt('hit', 'hit', '命中') +
      opt('hit', 'miss', '未命中') +
      '</select></label>' +
      '<label class="ua-rg-demo__row">活动状态<select id="uaSkDemoStatus">' +
      opt('status', 'active', '进行中') +
      opt('status', 'ended', '已结束') +
      '</select></label>' +
      '<label class="ua-rg-demo__row">用户身份<select id="uaSkDemoUser">' +
      opt('user', 'new', '新用户') +
      opt('user', 'old', '老用户') +
      '</select></label>' +
      '<label class="ua-rg-demo__row">购买限制<select id="uaSkDemoBuy">' +
      opt('buyLimit', 'auto', '跟随活动') +
      opt('buyLimit', 'all', '全部用户') +
      opt('buyLimit', 'neu', '仅新用户') +
      '</select></label>' +
      '<label class="ua-rg-demo__row">不符合<select id="uaSkDemoUnq">' +
      opt('unqualified', 'auto', '跟随活动') +
      opt('unqualified', 'deny', '不支持购买') +
      opt('unqualified', 'origin', '允许原价') +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaSkDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var apply = document.getElementById('uaSkDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        writeDemo({
          hit: (document.getElementById('uaSkDemoHit') || {}).value || 'hit',
          status: (document.getElementById('uaSkDemoStatus') || {}).value || 'active',
          user: (document.getElementById('uaSkDemoUser') || {}).value || 'new',
          buyLimit: (document.getElementById('uaSkDemoBuy') || {}).value || 'auto',
          unqualified: (document.getElementById('uaSkDemoUnq') || {}).value || 'auto'
        });
        global.location.reload();
      });
    }
  }

  global.UaSeckill = {
    resolve: resolve,
    unitPrice: unitPrice,
    cartTagHtml: cartTagHtml,
    guardPurchase: guardPurchase,
    applyGoodsDetail: applyGoodsDetail,
    mountDemoPanel: mountDemoPanel,
    readDemo: readDemo
  };
})(window);
