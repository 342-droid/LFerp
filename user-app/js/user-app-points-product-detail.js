/**
 * 用户 APP — 积分商品详情
 * 多规格：弹层选 SKU（加入购物车 / 立即兑换）；单规格底栏可直接操作或仍走弹层确认数量
 */
(function () {
  var product = null;
  var state = {
    skuIndex: 0,
    qty: 1,
    sheetIntent: 'buy' /* cart | buy */
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveAsset(src) {
    src = String(src || '');
    if (!src) return '';
    if (/^(data:|https?:|\/\/)/i.test(src)) return src;
    if (src.indexOf('../user-app/') === 0) return src.replace('../user-app/', '../');
    if (src.indexOf('user-app/') === 0) return '../' + src.slice('user-app/'.length);
    if (src.indexOf('../') === 0) return src;
    return src;
  }

  function formatMoney(num) {
    var n = Math.round((Number(num) || 0) * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    return '¥' + n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function formatExchangePrice(spec) {
    if (!spec) return '—';
    var isMoney =
      spec.exchangeType === 'points_money' ||
      (product && product.exchangeType === 'points_money');
    var pts = Number(spec.points) || 0;
    if (isMoney && Number(spec.money) > 0) return pts + '积分 + ' + formatMoney(spec.money);
    return pts + '积分';
  }

  function getEnabledSpecs() {
    return (product && Array.isArray(product.specs) ? product.specs : []).filter(function (s) {
      return !!s.exchangeEnabled;
    });
  }

  function currentSpec() {
    var specs = getEnabledSpecs();
    return specs[state.skuIndex] || specs[0] || null;
  }

  function toast(msg) {
    if (typeof showToast === 'function') {
      showToast(msg, 'info');
      return;
    }
    window.alert(msg);
  }

  function getCodeFromQuery() {
    var params = new URLSearchParams(window.location.search || '');
    return (params.get('code') || '').trim();
  }

  function clampQty() {
    var spec = currentSpec();
    if (!spec) {
      state.qty = 1;
      return;
    }
    var min = Math.max(1, Math.round(Number(spec.minSaleQty) || 1));
    var max = Math.max(min, Math.round(Number(spec.stock) || 0) || min);
    if (state.qty < min) state.qty = min;
    if (state.qty > max) state.qty = max;
  }

  function renderPage() {
    if (!product) return;
    var specs = getEnabledSpecs();
    var spec = currentSpec();
    var hero = document.getElementById('ppdHero');
    var title = document.getElementById('ppdTitle');
    var price = document.getElementById('ppdPrice');
    var line = document.getElementById('ppdLine');
    var meta = document.getElementById('ppdMeta');
    var specValue = document.getElementById('ppdSpecValue');
    var delivery = document.getElementById('ppdDelivery');
    var detail = document.getElementById('ppdDetail');

    var cover =
      (Array.isArray(product.images) && product.images[0]) ||
      (spec && spec.skuImg) ||
      product.img ||
      '';
    if (hero) hero.src = resolveAsset(cover);
    if (title) title.textContent = product.name || '—';
    if (price) price.textContent = formatExchangePrice(spec);
    if (line) {
      if (spec && spec.linePrice != null && spec.linePrice !== '') {
        line.hidden = false;
        line.textContent = formatMoney(spec.linePrice);
      } else {
        line.hidden = true;
      }
    }
    if (meta) {
      var sold = specs.reduce(function (sum, s) {
        return sum + (Number(s.exchangedQty) || 0);
      }, 0);
      meta.textContent = '已兑换 ' + sold + ' · 共 ' + specs.length + ' 个可兑规格';
    }
    if (specValue) {
      specValue.textContent = spec
        ? (spec.specName || '默认') + (specs.length > 1 ? '（共' + specs.length + '款）' : '')
        : '暂无规格';
    }
    if (delivery) {
      delivery.textContent = product.deliveryMode === 'express' ? '快递配送' : '平台配送';
    }
    if (detail) {
      detail.innerHTML = product.detailHtml
        ? product.detailHtml
        : '<p style="color:#999;">暂无商品详情，兑换规则以页面展示为准。</p>';
    }
  }

  function renderSkuSheet() {
    var specs = getEnabledSpecs();
    var spec = currentSpec();
    if (!spec) return;
    clampQty();

    var thumb = document.getElementById('ppdSkuThumb');
    var priceEl = document.getElementById('ppdSkuPrice');
    var nameEl = document.getElementById('ppdSkuName');
    var pickedEl = document.getElementById('ppdSkuPicked');
    var specsEl = document.getElementById('ppdSkuSpecs');
    var qtyEl = document.getElementById('ppdSkuQty');
    var hintEl = document.getElementById('ppdSkuHint');
    var cartBtn = document.getElementById('ppdSkuAddCart');
    var buyBtn = document.getElementById('ppdSkuBuyNow');

    if (thumb) thumb.src = resolveAsset(spec.skuImg || product.img || '');
    if (priceEl) priceEl.textContent = formatExchangePrice(spec);
    if (nameEl) nameEl.textContent = product.name || '';
    if (pickedEl) pickedEl.textContent = '已选：' + (spec.specName || '默认');
    if (qtyEl) qtyEl.textContent = String(state.qty);
    if (hintEl) {
      var min = Math.max(1, Math.round(Number(spec.minSaleQty) || 1));
      hintEl.textContent =
        '起售 ' + min + ' 件 · 库存 ' + (spec.stock != null ? spec.stock : 0);
    }
    if (specsEl) {
      specsEl.innerHTML = specs
        .map(function (s, i) {
          return (
            '<button type="button" class="ua-pm-sku-sheet__chip' +
            (i === state.skuIndex ? ' is-active' : '') +
            '" data-sku-index="' +
            i +
            '">' +
            '<img src="' +
            escapeHtml(resolveAsset(s.skuImg || product.img || '')) +
            '" alt="">' +
            escapeHtml(s.specName || '默认') +
            '</button>'
          );
        })
        .join('');
    }
    /* 按意图突出对应按钮：两者仍都可用 */
    if (cartBtn) cartBtn.style.opacity = state.sheetIntent === 'cart' ? '1' : '0.92';
    if (buyBtn) buyBtn.style.opacity = state.sheetIntent === 'buy' ? '1' : '0.92';
  }

  function openSkuSheet(intent) {
    state.sheetIntent = intent || 'buy';
    var spec = currentSpec();
    state.qty = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
    renderSkuSheet();
    var sheet = document.getElementById('ppdSkuSheet');
    if (sheet) sheet.hidden = false;
  }

  function closeSkuSheet() {
    var sheet = document.getElementById('ppdSkuSheet');
    if (sheet) sheet.hidden = true;
  }

  function buildLine() {
    if (!window.UaPointsMallOrder || !product) return null;
    return window.UaPointsMallOrder.buildLine(product, currentSpec(), state.qty);
  }

  function addCart() {
    var line = buildLine();
    if (!line || !window.UaPointsMallOrder) return;
    window.UaPointsMallOrder.addToCart(line);
    closeSkuSheet();
    toast('已加入购物车');
  }

  function buyNow() {
    var line = buildLine();
    if (!line || !window.UaPointsMallOrder) return;
    closeSkuSheet();
    var from =
      'points-product-detail.html?code=' + encodeURIComponent(product.code || '');
    window.UaPointsMallOrder.goConfirm(line, from);
  }

  function bindEvents() {
    document.getElementById('ppdSpecRow') &&
      document.getElementById('ppdSpecRow').addEventListener('click', function () {
        openSkuSheet('buy');
      });

    document.getElementById('ppdAddCart') &&
      document.getElementById('ppdAddCart').addEventListener('click', function () {
        openSkuSheet('cart');
      });

    document.getElementById('ppdBuyNow') &&
      document.getElementById('ppdBuyNow').addEventListener('click', function () {
        var specs = getEnabledSpecs();
        if (specs.length <= 1) {
          var spec = specs[0];
          state.skuIndex = 0;
          state.qty = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
          buyNow();
          return;
        }
        openSkuSheet('buy');
      });

    var sheet = document.getElementById('ppdSkuSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target.closest('[data-ppd-sku-close]')) {
          closeSkuSheet();
          return;
        }
        var chip = e.target.closest('[data-sku-index]');
        if (chip) {
          state.skuIndex = Number(chip.getAttribute('data-sku-index')) || 0;
          var spec = currentSpec();
          state.qty = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
          renderSkuSheet();
          renderPage();
        }
      });
    }

    document.getElementById('ppdSkuQtyMinus') &&
      document.getElementById('ppdSkuQtyMinus').addEventListener('click', function () {
        var spec = currentSpec();
        var min = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
        state.qty = Math.max(min, state.qty - 1);
        renderSkuSheet();
      });

    document.getElementById('ppdSkuQtyPlus') &&
      document.getElementById('ppdSkuQtyPlus').addEventListener('click', function () {
        state.qty += 1;
        clampQty();
        renderSkuSheet();
      });

    document.getElementById('ppdSkuAddCart') &&
      document.getElementById('ppdSkuAddCart').addEventListener('click', addCart);

    document.getElementById('ppdSkuBuyNow') &&
      document.getElementById('ppdSkuBuyNow').addEventListener('click', buyNow);
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('#ppdBack', 'points-mall.html');
    }

    var code = getCodeFromQuery();
    product = window.MdmPointsMallStore ? window.MdmPointsMallStore.getByCode(code) : null;
    var onShelf =
      product &&
      (window.MdmPointsMallStore && window.MdmPointsMallStore.isOnShelfDisplay
        ? window.MdmPointsMallStore.isOnShelfDisplay(product)
        : product.status === 'on_shelf');
    if (!product || !onShelf || !getEnabledSpecs().length) {
      toast('商品不存在或已下架');
      window.location.replace(
        window.UaNav && window.UaNav.withFrom
          ? window.UaNav.withFrom('points-mall.html')
          : 'points-mall.html'
      );
      return;
    }

    state.skuIndex = 0;
    var spec = currentSpec();
    state.qty = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
    renderPage();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
