(function () {
  var CART_KEY = 'ua_restock_cart_v2';
  var CART_PAGE_KEY = 'ua_restock_cart_page_v2';
  var CHECK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>';

  var B2B_SERVICES = [
    { title: '品质保障', desc: '平台严选供应商，商品入库前抽检，保障食材品质。' },
    { title: '坏损包赔', desc: '门店签收前发现质量问题，支持按平台规则申请赔付。' },
    { title: '准时送达', desc: '按约定时段配送到店，超时将优先协调补送。' },
    { title: '专票支持', desc: '支持开具电子普通发票，抬头类型为公司或个体工商户。' }
  ];

  var catalogApi = window.UAProductCatalog;
  var PRODUCT_CATALOG = catalogApi.PRODUCT_CATALOG;

  var state = {
    product: null,
    specQtys: {},
    countdownEnd: 0,
    sheetIntent: 'pick'
  };

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function resolveProduct(id) {
    return catalogApi.resolveProduct(id);
  }

  function formatPrice(num) {
    return '¥' + (num % 1 === 0 ? num.toFixed(0) : num.toFixed(2));
  }

  function formatPriceFixed(num) {
    return catalogApi.formatPriceFixed(num);
  }

  function getAvailableSpecs(p) {
    return catalogApi.getAvailableSpecs(p);
  }

  function getSpecDisplayName(p, spec) {
    return catalogApi.getSpecDisplayName(p, spec);
  }

  function getSpecTierHint(spec) {
    return catalogApi.getSpecTierHint(spec);
  }

  function getSpecUnitPriceText(spec) {
    return catalogApi.getSpecUnitPriceText(spec);
  }

  function getPriceRangeText(p) {
    return catalogApi.getPriceRangeText(p);
  }

  function initSpecQtys(reset) {
    var qtys = reset ? {} : state.specQtys || {};
    (state.product.specs || []).forEach(function (spec) {
      if (reset || qtys[spec.id] == null) qtys[spec.id] = 0;
    });
    state.specQtys = qtys;
  }

  function getSpecQty(specId) {
    return state.specQtys[specId] || 0;
  }

  function setSpecQty(specId, qty) {
    state.specQtys[specId] = Math.max(0, Math.min(999, qty));
  }

  function calcSelectedSpecs() {
    return (state.product.specs || [])
      .filter(function (spec) {
        return spec.available !== false && getSpecQty(spec.id) > 0;
      })
      .map(function (spec) {
        return { spec: spec, qty: getSpecQty(spec.id) };
      });
  }

  function calcMspecTotal() {
    var total = 0;
    calcSelectedSpecs().forEach(function (item) {
      total += item.spec.priceNum * item.qty;
    });
    return total;
  }

  function buildDetailUrl(id) {
    var p = getParams();
    var q = 'id=' + encodeURIComponent(id);
    if (p.get('from')) q += '&from=' + encodeURIComponent(p.get('from'));
    if (p.get('tab')) q += '&tab=' + encodeURIComponent(p.get('tab'));
    return 'product-detail.html?' + q;
  }

  function initProduct() {
    var id = getParams().get('id') || 'leaf-c1';
    state.product = resolveProduct(id);
    initSpecQtys(true);
    state.sheetIntent = 'pick';
    if (state.product.promo) {
      state.countdownEnd = Date.now() + 2 * 3600 * 1000;
    }
    var from = getParams().get('from') || 'restock.html';
    var tab = getParams().get('tab');
    var backHref = tab ? from + '?tab=' + tab : from;
    var back = document.getElementById('productDetailBack');
    if (back) back.setAttribute('href', backHref);
    var homeLink = document.getElementById('productDetailHomeLink');
    if (homeLink) homeLink.setAttribute('href', backHref);
    var cartLink = document.getElementById('productDetailCartLink');
    if (cartLink) cartLink.setAttribute('href', from + '?tab=cart');
  }

  function renderPage() {
    var p = state.product;
    if (!p) return;

    document.title = p.title + ' · 用户 APP';
    setText('productDetailTitle', p.title);
    setText('productDetailSubtitle', p.subtitle);
    setText('productDetailPrice', getPriceRangeText(p));
    var originEl = document.getElementById('productDetailOriginPrice');
    if (originEl) originEl.textContent = p.originPrice ? '¥' + p.originPrice : '';

    var promoEl = document.getElementById('productDetailPromo');
    if (promoEl) promoEl.hidden = !p.promo;

    renderFlatSpecs(p);
    setText('productDetailDeliveryText', p.delivery + ' · ' + p.warehouse);
    setText('productDetailServiceText', p.serviceTags.join(' · '));
    setText('productDetailParamsText', p.params.slice(0, 3).map(function (x) { return x.label + ' ' + x.value; }).join(' · '));

    setHtml('productDetailCoupons', (p.coupons || []).map(function (c) {
      return '<span class="ua-pd-coupon">' + c + '</span>';
    }).join(''));

    setHtml('productDetailServiceTags', (p.serviceTags || []).map(function (t) {
      return '<span class="ua-pd-service-tag">' + CHECK_ICON + t + '</span>';
    }).join(''));

    setText(
      'productDetailSupplierName',
      window.MdmSupplierArchiveStore && typeof window.MdmSupplierArchiveStore.getDisplayName === 'function'
        ? window.MdmSupplierArchiveStore.getDisplayName(p.supplier)
        : p.supplier.name
    );
    setText('productDetailSupplierMeta', p.supplier.meta);
    var avatar = document.getElementById('productDetailSupplierAvatar');
    if (avatar) avatar.src = p.supplier.avatar;

    renderGallery(p.imgs);
    renderMiniList('productDetailRecommend', p.recommend);
    renderDetailContent(p);
    updateCartBadge();
    tickCountdown();
  }

  function renderGallery(imgs) {
    var main = document.getElementById('productDetailMainImg');
    var dots = document.getElementById('productDetailDots');
    if (!main || !imgs.length) return;
    main.src = imgs[0];
    main.classList.add('ua-pd-hero__img--active');
    if (dots) {
      dots.innerHTML = imgs.map(function (_, i) {
        return '<span class="ua-pd-hero__dot' + (i === 0 ? ' ua-pd-hero__dot--active' : '') + '"></span>';
      }).join('');
    }
  }

  function renderFlatSpecs(p) {
    var el = document.getElementById('productDetailSpecsFlat');
    var section = document.getElementById('productDetailSpecsSection');
    if (!el) return;
    var specs = p.specs || [];
    if (section) section.hidden = !specs.length;
    el.innerHTML = specs
      .map(function (spec) {
        var disabled = spec.available === false;
        return (
          '<div class="ua-pd-spec-flat' +
          (disabled ? ' ua-pd-spec-flat--disabled' : '') +
          '">' +
          '<div class="ua-pd-spec-flat__main">' +
          '<div class="ua-pd-spec-flat__name">' +
          getSpecDisplayName(p, spec) +
          '</div>' +
          '<div class="ua-pd-spec-flat__hint">' +
          getSpecTierHint(spec) +
          '</div></div>' +
          '<div class="ua-pd-spec-flat__right">' +
          '<div class="ua-pd-spec-flat__price">' +
          getSpecUnitPriceText(spec) +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function renderMiniList(elId, ids) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = (ids || []).map(function (id) {
      var item = PRODUCT_CATALOG[id];
      if (!item) return '';
      var spec = item.specs[0];
      return (
        '<button type="button" class="ua-pd-mini" data-pd-id="' + id + '">' +
        '<img class="ua-pd-mini__img" src="' + item.imgs[0] + '" alt="">' +
        '<div class="ua-pd-mini__title">' + item.title + '</div>' +
        '<div class="ua-pd-mini__price">' + formatPrice(spec.priceNum) + '</div></button>'
      );
    }).join('');
  }

  function renderDetailContent(p) {
    var imgsEl = document.getElementById('productDetailDetailImgs');
    if (imgsEl) {
      imgsEl.innerHTML = (p.detailImgs || []).map(function (src) {
        return '<img src="' + src + '" alt="">';
      }).join('');
    }
    var storyEl = document.getElementById('productDetailStory');
    if (storyEl) {
      storyEl.innerHTML = (p.story || []).map(function (s) {
        return '<h3>' + s.title + '</h3><p>' + s.text + '</p>';
      }).join('');
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function tickCountdown() {
    var el = document.getElementById('productDetailCountdown');
    if (!el || !state.countdownEnd) return;
    var left = Math.max(0, state.countdownEnd - Date.now());
    var h = Math.floor(left / 3600000);
    var m = Math.floor((left % 3600000) / 60000);
    var s = Math.floor((left % 60000) / 1000);
    el.textContent = [h, m, s].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
    if (left > 0) window.setTimeout(tickCountdown, 1000);
  }

  function openSheet(name) {
    var map = { service: 'productDetailServiceSheet', params: 'productDetailParamsSheet', spec: 'productDetailSpecSheet' };
    var el = document.getElementById(map[name]);
    if (el) {
      el.hidden = false;
      document.body.classList.add('ua-pd-sheet-open');
    }
  }

  function closeSheet(name) {
    var map = { service: 'productDetailServiceSheet', params: 'productDetailParamsSheet', spec: 'productDetailSpecSheet' };
    var el = document.getElementById(map[name]);
    if (el) el.hidden = true;
    if (!document.querySelector('.ua-pd-sheet:not([hidden])')) {
      document.body.classList.remove('ua-pd-sheet-open');
    }
  }

  function renderServiceSheet() {
    setHtml(
      'productDetailServiceList',
      B2B_SERVICES.map(function (s) {
        return (
          '<div class="ua-pd-service-item">' +
          '<div class="ua-pd-service-item__icon">' + CHECK_ICON + '</div>' +
          '<div><div class="ua-pd-service-item__title">' + s.title + '</div>' +
          '<div class="ua-pd-service-item__desc">' + s.desc + '</div></div></div>'
        );
      }).join('')
    );
  }

  function renderParamsSheet() {
    var p = state.product;
    setHtml(
      'productDetailParamsList',
      (p.params || []).map(function (row) {
        return '<div class="ua-pd-param-row"><span class="ua-pd-param-row__label">' + row.label + '</span><span class="ua-pd-param-row__value">' + row.value + '</span></div>';
      }).join('')
    );
  }

  function renderMultiSpecSheet() {
    var p = state.product;
    if (!p) return;

    setText('productDetailMspecTitle', p.title);
    setText('productDetailMspecPriceRange', getPriceRangeText(p));
    updateMspecTotal();

    var confirmBtn = document.getElementById('productDetailSpecConfirm');
    if (confirmBtn) {
      if (state.sheetIntent === 'cart') confirmBtn.textContent = '加入购物车';
      else if (state.sheetIntent === 'buy') confirmBtn.textContent = '我要进货';
      else confirmBtn.textContent = '确定';
    }

    setHtml(
      'productDetailMspecList',
      (p.specs || [])
        .map(function (spec) {
          var qty = getSpecQty(spec.id);
          var disabled = spec.available === false;
          var subtotal = spec.priceNum * qty;
          return (
            '<div class="ua-pd-mspec-item' +
            (disabled ? ' ua-pd-mspec-item--disabled' : '') +
            '" data-mspec-id="' +
            spec.id +
            '">' +
            '<div class="ua-pd-mspec-item__top">' +
            '<div class="ua-pd-mspec-item__name">' +
            getSpecDisplayName(p, spec) +
            '</div>' +
            '<div class="ua-pd-mspec-item__stepper">' +
            '<button type="button" class="ua-pd-mspec-minus" data-mspec-id="' +
            spec.id +
            '"' +
            (disabled || qty <= 0 ? ' disabled' : '') +
            ' aria-label="减少">-</button>' +
            '<input type="number" class="ua-pd-mspec-input" data-mspec-id="' +
            spec.id +
            '" value="' +
            qty +
            '" min="0" max="999"' +
            (disabled ? ' disabled' : '') +
            ' inputmode="numeric">' +
            '<button type="button" class="ua-pd-mspec-plus" data-mspec-id="' +
            spec.id +
            '"' +
            (disabled ? ' disabled' : '') +
            ' aria-label="增加">+</button></div></div>' +
            '<div class="ua-pd-mspec-item__bottom">' +
            '<div class="ua-pd-mspec-item__hint">' +
            getSpecTierHint(spec) +
            '</div>' +
            '<div class="ua-pd-mspec-item__pricing">' +
            '<div class="ua-pd-mspec-item__unit-price">' +
            getSpecUnitPriceText(spec) +
            '</div>' +
            '<div class="ua-pd-mspec-item__subtotal"' +
            (qty > 0 ? '' : ' hidden') +
            ' data-mspec-subtotal="' +
            spec.id +
            '">小计：' +
            formatPriceFixed(subtotal) +
            '</div></div></div></div>'
          );
        })
        .join('')
    );
  }

  function updateMspecRow(specId) {
    var p = state.product;
    if (!p) return;
    var spec = p.specs.find(function (s) { return s.id === specId; });
    if (!spec) return;
    var row = document.querySelector('[data-mspec-id="' + specId + '"].ua-pd-mspec-item');
    if (!row) return;
    var qty = getSpecQty(specId);
    var input = row.querySelector('.ua-pd-mspec-input');
    var minus = row.querySelector('.ua-pd-mspec-minus');
    var subtotalEl = row.querySelector('[data-mspec-subtotal="' + specId + '"]');
    if (input) input.value = String(qty);
    if (minus) minus.disabled = qty <= 0;
    if (subtotalEl) {
      if (qty > 0) {
        subtotalEl.hidden = false;
        subtotalEl.textContent = '小计：' + formatPriceFixed(spec.priceNum * qty);
      } else {
        subtotalEl.hidden = true;
      }
    }
    updateMspecTotal();
  }

  function updateMspecTotal() {
    var totalEl = document.getElementById('productDetailMspecTotal');
    var confirmBtn = document.getElementById('productDetailSpecConfirm');
    var total = calcMspecTotal();
    if (totalEl) totalEl.textContent = formatPriceFixed(total);
    if (confirmBtn) confirmBtn.disabled = total <= 0;
  }

  function addMultipleToCart(goCheckout) {
    var p = state.product;
    var selected = calcSelectedSpecs();
    if (!selected.length) {
      window.alert('请选择规格数量');
      return;
    }
    var checkoutItems = [];
    try {
      var raw = localStorage.getItem(CART_PAGE_KEY);
      var cartState = raw ? JSON.parse(raw) : { stores: [] };
      if (!cartState.stores) cartState.stores = [];
      var supplierId = p.supplier.id;
      var supplierDisplayName =
        window.MdmSupplierArchiveStore &&
        typeof window.MdmSupplierArchiveStore.getDisplayName === 'function'
          ? window.MdmSupplierArchiveStore.getDisplayName(p.supplier)
          : p.supplier.name;
      var store = cartState.stores.find(function (s) { return s.id === supplierId; });
      if (!store) {
        store = { id: supplierId, name: supplierDisplayName, blocks: [{ items: [] }] };
        cartState.stores.push(store);
      } else {
        store.name = supplierDisplayName;
      }
      var items = store.blocks[0].items;
      selected.forEach(function (entry) {
        var spec = entry.spec;
        var found = items.find(function (i) { return i.id === spec.id; });
        if (found) found.qty = (found.qty || 0) + entry.qty;
        else {
          items.push({
            id: spec.id,
            spuId: p.spuId,
            title: p.title,
            spec: spec.label,
            priceNum: spec.priceNum,
            qty: entry.qty,
            selected: !!goCheckout,
            img: p.imgs[0],
            supplierId: supplierId,
            supplierName: supplierDisplayName
          });
        }
        checkoutItems.push({
          id: spec.id,
          spuId: p.spuId,
          title: p.title,
          spec: spec.label,
          priceNum: spec.priceNum,
          qty: entry.qty,
          img: p.imgs[0],
          supplierId: p.supplier.id,
          supplierName: supplierDisplayName
        });
      });
      if (goCheckout) {
        var selectedIds = selected.map(function (s) { return s.spec.id; });
        items.forEach(function (i) {
          i.selected = selectedIds.indexOf(i.id) !== -1;
        });
      }
      localStorage.setItem(CART_PAGE_KEY, JSON.stringify(cartState));
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    } catch (e) {
      /* ignore */
    }
    if (goCheckout) {
      sessionStorage.setItem(
        'ua_checkout_v1',
        JSON.stringify({
          store: { name: '悠悠生鲜超市', contact: '张店长', phone: '138****6688', address: '浙江省杭州市萧山区建设一路88号' },
          items: checkoutItems
        })
      );
      window.location.href = 'checkout.html?from=restock.html';
      return;
    }
    updateCartBadge();
    window.alert('已加入购物车');
  }

  function updateCartBadge() {
    var badge = document.getElementById('productDetailCartBadge');
    if (!badge) return;
    var n = 0;
    try {
      var raw = localStorage.getItem(CART_PAGE_KEY);
      if (raw) {
        var cart = JSON.parse(raw);
        (cart.stores || []).forEach(function (s) {
          (s.blocks || []).forEach(function (b) {
            (b.items || []).forEach(function (i) { n += i.qty || 0; });
          });
        });
      }
    } catch (e) {
      /* ignore */
    }
    if (n > 0) {
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.hidden = false;
    } else badge.hidden = true;
  }

  function openSpecSheet(intent) {
    state.sheetIntent = intent || 'pick';
    initSpecQtys(true);
    renderMultiSpecSheet();
    openSheet('spec');
  }

  function bindEvents() {
    document.getElementById('productDetailServiceRow') &&
      document.getElementById('productDetailServiceRow').addEventListener('click', function () {
        renderServiceSheet();
        openSheet('service');
      });

    document.getElementById('productDetailParamsRow') &&
      document.getElementById('productDetailParamsRow').addEventListener('click', function () {
        renderParamsSheet();
        openSheet('params');
      });

    document.getElementById('productDetailDeliveryRow') &&
      document.getElementById('productDetailDeliveryRow').addEventListener('click', function () {
        window.alert('配送时段以结算页选择为准（演示）');
      });

    document.querySelectorAll('[data-pd-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSheet(el.getAttribute('data-pd-close'));
      });
    });

    document.getElementById('productDetailMspecList') &&
      document.getElementById('productDetailMspecList').addEventListener('click', function (e) {
        var minus = e.target.closest('.ua-pd-mspec-minus');
        if (minus && !minus.disabled) {
          var minusId = minus.getAttribute('data-mspec-id');
          setSpecQty(minusId, getSpecQty(minusId) - 1);
          updateMspecRow(minusId);
          return;
        }
        var plus = e.target.closest('.ua-pd-mspec-plus');
        if (plus && !plus.disabled) {
          var plusId = plus.getAttribute('data-mspec-id');
          setSpecQty(plusId, getSpecQty(plusId) + 1);
          updateMspecRow(plusId);
        }
      });

    document.getElementById('productDetailMspecList') &&
      document.getElementById('productDetailMspecList').addEventListener('change', function (e) {
        var input = e.target.closest('.ua-pd-mspec-input');
        if (!input) return;
        var specId = input.getAttribute('data-mspec-id');
        var val = parseInt(input.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 999) val = 999;
        setSpecQty(specId, val);
        updateMspecRow(specId);
      });

    document.getElementById('productDetailSpecConfirm') &&
      document.getElementById('productDetailSpecConfirm').addEventListener('click', function () {
        if (this.disabled) return;
        var intent = state.sheetIntent;
        closeSheet('spec');
        state.sheetIntent = 'pick';
        if (intent === 'cart') addMultipleToCart(false);
        else if (intent === 'buy') addMultipleToCart(true);
      });

    document.getElementById('productDetailAddCart') &&
      document.getElementById('productDetailAddCart').addEventListener('click', function () {
        openSpecSheet('cart');
      });

    document.getElementById('productDetailBuyNow') &&
      document.getElementById('productDetailBuyNow').addEventListener('click', function () {
        openSpecSheet('buy');
      });

    document.getElementById('productDetailShare') &&
      document.getElementById('productDetailShare').addEventListener('click', function () {
        window.alert('分享商品（演示）');
      });

    document.getElementById('productDetailMore') &&
      document.getElementById('productDetailMore').addEventListener('click', function () {
        window.alert('更多操作（演示）');
      });

    document.getElementById('productDetailSupportBtn') &&
      document.getElementById('productDetailSupportBtn').addEventListener('click', function () {
        window.alert('联系客服（演示）');
      });

    document.body.addEventListener('click', function (e) {
      var mini = e.target.closest('[data-pd-id]');
      if (mini) window.location.href = buildDetailUrl(mini.getAttribute('data-pd-id'));
    });
  }

  initProduct();
  renderPage();
  bindEvents();
})();
