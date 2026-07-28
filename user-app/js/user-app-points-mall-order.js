/**
 * 用户 APP — 积分商城兑换草稿 / 购物车
 * 加入购物车同时写入零售购物车（带【积分兑换】标识）
 */
(function (global) {
  var CHECKOUT_KEY = 'ua_points_mall_checkout_v1';
  var CART_KEY = 'ua_points_mall_cart_v1';
  var SHOP_CART_KEY = 'ua_shop_cart_v2';

  function safeParse(raw, fallback) {
    try {
      var data = JSON.parse(raw);
      return data == null ? fallback : data;
    } catch (e) {
      return fallback;
    }
  }

  function readCart() {
    try {
      var list = safeParse(global.sessionStorage.getItem(CART_KEY), []);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(list) {
    try {
      global.sessionStorage.setItem(CART_KEY, JSON.stringify(list || []));
    } catch (e) { /* ignore */ }
  }

  function cartItemId(line) {
    return 'points:' + String(line.code || '') + ':' + String(line.skuCode || '');
  }

  function isPointsCartId(id) {
    return String(id || '').indexOf('points:') === 0;
  }

  function formatExchangeLabel(points, money) {
    var pts = Number(points) || 0;
    var cash = Number(money) || 0;
    if (cash > 0) {
      var n = Math.round(cash * 100) / 100;
      var moneyText = n % 1 === 0 ? '¥' + Math.round(n) : '¥' + n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
      return pts + '积分 + ' + moneyText;
    }
    return pts + '积分';
  }

  function readShopCart() {
    try {
      var data = safeParse(global.localStorage.getItem(SHOP_CART_KEY), null);
      if (data && Array.isArray(data.items)) return data;
    } catch (e) { /* ignore */ }
    return { store: null, items: [] };
  }

  function writeShopCart(cart) {
    try {
      global.localStorage.setItem(SHOP_CART_KEY, JSON.stringify(cart || { items: [] }));
      if (global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent('ua-shop-cart-change', { detail: cart }));
      }
    } catch (e) { /* ignore */ }
  }

  function toShopCartItem(line) {
    var qty = Math.max(1, Math.round(Number(line.qty) || 1));
    var money = Number(line.money) || 0;
    var deliveryMode = line.deliveryMode === 'express' ? 'express' : 'platform';
    var fulfillType = deliveryMode === 'express' ? 'express' : 'pickup';
    var supplierId = String(line.supplierId || '斯斯供应商商家').trim();
    var supplierName = String(line.supplierName || supplierId).trim();
    return {
      id: cartItemId(line),
      qty: qty,
      checked: true,
      source: 'points_mall',
      isPointsExchange: true,
      pointsCode: line.code,
      skuCode: line.skuCode,
      name: line.name,
      img: line.skuImg || line.img,
      spec: line.specName || '默认',
      category: line.category || '',
      points: Number(line.points) || 0,
      money: money,
      exchangeType: line.exchangeType === 'points_money' || money > 0 ? 'points_money' : 'points',
      price: money,
      linePrice: line.linePrice,
      minSaleQty: Math.max(1, Math.round(Number(line.minSaleQty) || 1)),
      deliveryMode: deliveryMode,
      fulfillType: fulfillType,
      /* 与普通商品一致：按供应商归组 */
      merchantId: 'supplier:' + supplierId,
      merchantName: supplierName,
      supplierId: supplierId,
      supplierName: supplierName
    };
  }

  /** 同步到零售购物车，供 cart.html 展示【积分兑换】标签 */
  function syncToShopCart(line, mode) {
    if (!line || !line.code || !line.skuCode) return;
    var shop = readShopCart();
    if (!Array.isArray(shop.items)) shop.items = [];
    var id = cartItemId(line);
    var idx = -1;
    for (var i = 0; i < shop.items.length; i++) {
      if (shop.items[i] && shop.items[i].id === id) {
        idx = i;
        break;
      }
    }
    var next = toShopCartItem(line);
    if (mode === 'set') {
      if (idx >= 0) shop.items[idx] = Object.assign({}, shop.items[idx], next);
      else shop.items.push(next);
    } else if (idx >= 0) {
      var prevQty = Number(shop.items[idx].qty) || 0;
      next.qty = Math.max(1, prevQty + next.qty);
      shop.items[idx] = Object.assign({}, shop.items[idx], next);
    } else {
      shop.items.push(next);
    }
    writeShopCart(shop);
    if (global.UAShop && typeof global.UAShop.syncBadges === 'function') {
      global.UAShop.syncBadges();
    }
  }

  function removeFromShopCart(code, skuCode) {
    var id = cartItemId({ code: code, skuCode: skuCode });
    var shop = readShopCart();
    if (!Array.isArray(shop.items)) return;
    shop.items = shop.items.filter(function (it) {
      return !(it && it.id === id);
    });
    writeShopCart(shop);

    var list = readCart().filter(function (row) {
      return !(row.code === code && row.skuCode === skuCode);
    });
    writeCart(list);
  }

  function setCartLineQty(code, skuCode, qty) {
    var list = readCart();
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === code && list[i].skuCode === skuCode) {
        hit = list[i];
        break;
      }
    }
    if (!hit) return;
    var min = Math.max(1, Math.round(Number(hit.minSaleQty) || 1));
    hit.qty = Math.max(min, Math.round(Number(qty) || min));
    writeCart(list);
    syncToShopCart(hit, 'set');
  }

  function setCheckout(payload) {
    try {
      global.sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(payload || null));
    } catch (e) { /* ignore */ }
  }

  function getCheckout() {
    try {
      return safeParse(global.sessionStorage.getItem(CHECKOUT_KEY), null);
    } catch (e) {
      return null;
    }
  }

  /** 统一成 lines 数组 */
  function normalizeCheckoutLines(payload) {
    if (!payload) return [];
    if (Array.isArray(payload.lines)) return payload.lines.filter(Boolean);
    if (payload.code && payload.skuCode) return [payload];
    return [];
  }

  function clearCheckout() {
    try {
      global.sessionStorage.removeItem(CHECKOUT_KEY);
    } catch (e) { /* ignore */ }
  }

  function addToCart(line) {
    if (!line || !line.code || !line.skuCode) return false;
    var list = readCart();
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].code === line.code && list[i].skuCode === line.skuCode) {
        hit = list[i];
        break;
      }
    }
    var qty = Math.max(1, Math.round(Number(line.qty) || 1));
    if (hit) {
      hit.qty = Math.max(1, (Number(hit.qty) || 0) + qty);
      hit.points = line.points;
      hit.money = line.money;
      hit.exchangeType = line.exchangeType;
      hit.name = line.name;
      hit.specName = line.specName;
      hit.img = line.skuImg || line.img;
      hit.minSaleQty = line.minSaleQty || hit.minSaleQty || 1;
      hit.deliveryMode = line.deliveryMode || hit.deliveryMode;
      syncToShopCart(hit, 'set');
    } else {
      var row = {
        code: line.code,
        name: line.name,
        img: line.skuImg || line.img,
        deliveryMode: line.deliveryMode || 'platform',
        skuCode: line.skuCode,
        specName: line.specName,
        points: line.points,
        money: line.money,
        exchangeType: line.exchangeType,
        linePrice: line.linePrice,
        minSaleQty: line.minSaleQty || 1,
        qty: qty
      };
      list.push(row);
      syncToShopCart(row, 'set');
    }
    writeCart(list);
    return true;
  }

  function cartCount() {
    return readCart().reduce(function (sum, row) {
      return sum + (Number(row.qty) || 0);
    }, 0);
  }

  function buildLine(product, spec, qty) {
    product = product || {};
    spec = spec || {};
    var minSale = Math.max(1, Math.round(Number(spec.minSaleQty) || 1));
    var n = Math.max(minSale, Math.round(Number(qty) || minSale));
    var isMoney =
      spec.exchangeType === 'points_money' || product.exchangeType === 'points_money';
    return {
      code: product.code,
      name: product.name,
      img: product.img,
      category: product.category || '',
      deliveryMode: product.deliveryMode === 'express' ? 'express' : 'platform',
      supplierId: product.supplierId || '斯斯供应商商家',
      supplierName: product.supplierName || product.supplierId || '斯斯供应商商家',
      skuCode: spec.skuCode,
      specName: spec.specName || '默认',
      skuImg: spec.skuImg || product.img,
      points: Number(spec.points) || 0,
      money: isMoney ? Number(spec.money) || 0 : 0,
      exchangeType: isMoney ? 'points_money' : 'points',
      linePrice: spec.linePrice,
      minSaleQty: minSale,
      qty: n
    };
  }

  function goConfirm(lineOrLines, fromPage) {
    var lines = Array.isArray(lineOrLines)
      ? lineOrLines
      : normalizeCheckoutLines(lineOrLines && lineOrLines.lines ? lineOrLines : lineOrLines);
    if (!lines.length && lineOrLines && lineOrLines.code) lines = [lineOrLines];
    if (lines.length === 1) setCheckout(lines[0]);
    else setCheckout({ lines: lines });
    var href = 'points-order-confirm.html';
    if (global.UaNav && global.UaNav.withFrom) {
      href = global.UaNav.withFrom(href, fromPage);
    } else if (fromPage) {
      href += '?from=' + encodeURIComponent(fromPage);
    }
    global.location.href = href;
  }

  function goDetail(code, fromPage) {
    var href = 'points-product-detail.html?code=' + encodeURIComponent(code || '');
    if (global.UaNav && global.UaNav.withFrom) {
      href = global.UaNav.withFrom(href, fromPage);
    } else if (fromPage) {
      href += '&from=' + encodeURIComponent(fromPage);
    }
    global.location.href = href;
  }

  function shopItemToLine(item) {
    if (!item || !item.isPointsExchange) return null;
    return {
      code: item.pointsCode,
      name: item.name,
      img: item.img,
      skuImg: item.img,
      category: item.category || '',
      deliveryMode: item.deliveryMode || (item.fulfillType === 'express' ? 'express' : 'platform'),
      supplierId: item.supplierId,
      supplierName: item.supplierName || item.merchantName,
      skuCode: item.skuCode,
      specName: item.spec,
      points: item.points,
      money: item.money,
      exchangeType: item.exchangeType,
      linePrice: item.linePrice,
      minSaleQty: item.minSaleQty || 1,
      qty: item.qty
    };
  }

  global.UaPointsMallOrder = {
    setCheckout: setCheckout,
    getCheckout: getCheckout,
    normalizeCheckoutLines: normalizeCheckoutLines,
    clearCheckout: clearCheckout,
    addToCart: addToCart,
    readCart: readCart,
    cartCount: cartCount,
    buildLine: buildLine,
    goConfirm: goConfirm,
    goDetail: goDetail,
    cartItemId: cartItemId,
    isPointsCartId: isPointsCartId,
    formatExchangeLabel: formatExchangeLabel,
    syncToShopCart: syncToShopCart,
    removeFromShopCart: removeFromShopCart,
    setCartLineQty: setCartLineQty,
    shopItemToLine: shopItemToLine
  };
})(window);
