/**
 * C 端 — 新人专区下单（不支持加购，仅立即购买）
 *
 * 规则：
 * - 新人：从未有过支付成功的订单
 * - 专区商品每人限购 1 件，且每个商品仅可购买一次
 * - 下单 / 支付前再次校验是否仍有已支付订单，防止多笔待支付薅羊毛
 */
(function (global) {
  'use strict';

  var CHECKOUT_KEY = 'ua_newcomer_zone_checkout_v1';

  function safeParse(raw, fallback) {
    try {
      var data = JSON.parse(raw);
      return data == null ? fallback : data;
    } catch (e) {
      return fallback;
    }
  }

  function resolveAsset(src) {
    src = String(src || '');
    if (!src) return '../assets/restock/product-leaf.svg';
    if (/^(data:|https?:|\/\/)/i.test(src)) return src;
    if (src.indexOf('../user-app/') === 0) return src.replace('../user-app/', '../');
    if (src.indexOf('user-app/') === 0) return '../' + src.slice('user-app/'.length);
    return src;
  }

  function orders() {
    return global.UaOrdersStore && typeof global.UaOrdersStore.list === 'function'
      ? global.UaOrdersStore.list() || []
      : [];
  }

  /** 是否支付成功过（有 paidAt，或状态已非待支付/关闭） */
  function isPaidOrder(order) {
    if (!order) return false;
    if (order.paidAt) return true;
    var st = String(order.status || '');
    return st && st !== 'unpaid' && st !== 'closed';
  }

  function isNewcomer() {
    return !orders().some(isPaidOrder);
  }

  function orderHasNewcomerCode(order, code) {
    var target = String(code || '').trim();
    if (!target || !order) return false;
    return (order.items || []).some(function (it) {
      if (!it || !it.isNewcomerExclusive) return false;
      return String(it.newcomerCode || it.code || '') === target;
    });
  }

  function orderHasAnyNewcomerItem(order) {
    return (order.items || []).some(function (it) {
      return !!(it && it.isNewcomerExclusive);
    });
  }

  function hasBoughtNewcomerProduct(code) {
    return orders().some(function (o) {
      return isPaidOrder(o) && orderHasNewcomerCode(o, code);
    });
  }

  /** 新人专区限购一单：已有支付成功的新人专区订单 */
  function hasPaidNewcomerOrder() {
    return orders().some(function (o) {
      return isPaidOrder(o) && orderHasAnyNewcomerItem(o);
    });
  }

  /** 已有新人专区待支付单时不允许再下 */
  function hasUnpaidNewcomerOrder() {
    return orders().some(function (o) {
      return String(o.status || '') === 'unpaid' && orderHasAnyNewcomerItem(o);
    });
  }

  /**
   * @returns {{ ok: boolean, message?: string }}
   */
  function canBuyProduct(code) {
    if (!isNewcomer()) {
      return {
        ok: false,
        message: '新人专区仅限未支付成功过订单的新用户购买'
      };
    }
    if (hasPaidNewcomerOrder() || hasBoughtNewcomerProduct(code)) {
      return {
        ok: false,
        message: '新人专区限购一单，您已购买过'
      };
    }
    if (hasUnpaidNewcomerOrder()) {
      return {
        ok: false,
        message: '您已有新人专区待支付订单，请先完成支付或取消后再试'
      };
    }
    return { ok: true };
  }

  /** 下单/支付前复核：必须仍是新人 */
  function assertNewcomerForCheckout() {
    if (!isNewcomer()) {
      return {
        ok: false,
        message: '检测到您已有支付成功的订单，无法购买新人专区商品'
      };
    }
    return { ok: true };
  }

  function setCheckout(line) {
    try {
      global.sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(line || null));
    } catch (e) { /* ignore */ }
  }

  function getCheckout() {
    try {
      return safeParse(global.sessionStorage.getItem(CHECKOUT_KEY), null);
    } catch (e) {
      return null;
    }
  }

  function clearCheckout() {
    try {
      global.sessionStorage.removeItem(CHECKOUT_KEY);
    } catch (e) { /* ignore */ }
  }

  function buildLine(product, spec) {
    product = product || {};
    spec = spec || {};
    var deliveryMode = product.deliveryMode === 'express' ? 'express' : 'platform';
    var price = Math.round((Number(spec.salePrice) || 0) * 100) / 100;
    var supplierId = String(product.supplierId || '斯斯供应商商家').trim();
    var supplierName = String(product.supplierName || supplierId).trim();
    return {
      code: product.code,
      name: product.name,
      img: resolveAsset(product.img),
      category: product.category || '',
      deliveryMode: deliveryMode,
      supplierId: supplierId,
      supplierName: supplierName,
      skuCode: spec.skuCode,
      specName: spec.specName || '默认',
      skuImg: resolveAsset(spec.skuImg || product.img),
      salePrice: price,
      linePrice: spec.linePrice,
      qty: 1,
      isNewcomerExclusive: true
    };
  }

  /** 供结算页读取的商品行（带【新人专享】标识） */
  function getCheckoutItems() {
    var line = getCheckout();
    if (!line || !line.code || !line.skuCode) return [];
    var deliveryMode = line.deliveryMode === 'express' ? 'express' : 'platform';
    var fulfillType = deliveryMode === 'express' ? 'express' : 'pickup';
    var supplierId = String(line.supplierId || '斯斯供应商商家').trim();
    var supplierName = String(line.supplierName || supplierId).trim();
    var price = Math.round((Number(line.salePrice) || 0) * 100) / 100;
    return [
      {
        id: 'newcomer:' + line.code + ':' + line.skuCode,
        name: line.name,
        fullName: line.name,
        spec: line.specName || '默认',
        price: price,
        img: resolveAsset(line.skuImg || line.img || ''),
        watermark: false,
        qty: 1,
        fulfillType: fulfillType,
        merchantId: 'supplier:' + supplierId,
        merchantName: supplierName,
        isPointsExchange: false,
        isNewcomerExclusive: true,
        newcomerCode: line.code,
        skuCode: line.skuCode,
        category: line.category || '',
        deliveryText: fulfillType === 'express' ? '预计2-3天送达' : '按履约方式配送'
      }
    ];
  }

  function goConfirm(line, fromPage) {
    var check = canBuyProduct(line && line.code);
    if (!check.ok) {
      if (typeof global.alert === 'function') global.alert(check.message);
      return false;
    }
    /* 再校一次，防止入口绕过 */
    var again = assertNewcomerForCheckout();
    if (!again.ok) {
      if (typeof global.alert === 'function') global.alert(again.message);
      return false;
    }
    setCheckout(Object.assign({}, line, { qty: 1, isNewcomerExclusive: true }));
    var href = 'order-confirm.html';
    if (global.UaNav && global.UaNav.withFrom) {
      href = global.UaNav.withFrom(href, fromPage || 'newcomer-zone.html');
    } else if (fromPage) {
      href += '?from=' + encodeURIComponent(fromPage);
    }
    global.location.href = href;
    return true;
  }

  global.UaNewcomerZoneOrder = {
    CHECKOUT_KEY: CHECKOUT_KEY,
    isNewcomer: isNewcomer,
    isPaidOrder: isPaidOrder,
    hasBoughtNewcomerProduct: hasBoughtNewcomerProduct,
    hasPaidNewcomerOrder: hasPaidNewcomerOrder,
    hasUnpaidNewcomerOrder: hasUnpaidNewcomerOrder,
    canBuyProduct: canBuyProduct,
    assertNewcomerForCheckout: assertNewcomerForCheckout,
    setCheckout: setCheckout,
    getCheckout: getCheckout,
    clearCheckout: clearCheckout,
    buildLine: buildLine,
    getCheckoutItems: getCheckoutItems,
    goConfirm: goConfirm
  };
})(window);
