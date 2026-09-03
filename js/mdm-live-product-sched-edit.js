/**
 * 直播商品 — 排品编辑
 * 编辑仅作用于本场排品，不回写中央商品库。
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var SALE_UNITS = ['件', '箱', '瓶', '袋', 'kg', 'L', '罐', '包', '套', '卷', '个', '斤', '盒'];
  var LIMIT_OPTIONS = [
    { value: '', label: '请选择' },
    { value: 'none', label: '不限购' },
    { value: 'per_order', label: '每单限购' },
    { value: 'per_user', label: '每用户限购' },
    { value: 'per_day', label: '每天限购' }
  ];
  var POINT_OPTIONS = [
    { value: 'cash', label: '现金' },
    { value: 'points', label: '纯积分兑换' },
    { value: 'points_cash', label: '积分+现金' }
  ];
  var EDITOR_CMDS = [
    { cmd: 'formatBlock', label: '正文', value: 'P' },
    { cmd: 'formatBlock', label: '引用', value: 'BLOCKQUOTE' },
    { cmd: 'bold', label: 'B' },
    { cmd: 'underline', label: 'U' },
    { cmd: 'italic', label: 'I' },
    { cmd: 'foreColor', label: 'A' },
    { cmd: 'hiliteColor', label: '底' },
    { cmd: 'fontSize', label: '字号' },
    { divider: true },
    { cmd: 'insertUnorderedList', label: '•' },
    { cmd: 'insertOrderedList', label: '1.' },
    { cmd: 'justifyLeft', label: '左' },
    { cmd: 'justifyCenter', label: '中' },
    { cmd: 'justifyRight', label: '右' },
    { divider: true },
    { cmd: 'createLink', label: '链接' },
    { cmd: 'insertImage', label: '图片' },
    { cmd: 'insertHTML', label: '表格' },
    { cmd: 'undo', label: '撤' },
    { cmd: 'redo', label: '重' }
  ];

  var productId = '';
  var sessionId = '';
  var product = null;
  var skuPool = [];
  var selectedSkuIds = [];
  var snapshot = null;
  var images = [];
  var video = '';

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function qs(name) {
    return new URLSearchParams(window.location.search || '').get(name) || '';
  }

  function listHref() {
    var base = wp.page('mdm_live_product_sched.html');
    if (!sessionId) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'sessionId=' + encodeURIComponent(sessionId);
  }

  function productsOf(id) {
    if (!Demo.productsBySession[id]) Demo.productsBySession[id] = [];
    return Demo.productsBySession[id];
  }

  function findProduct(sid, pid) {
    var list = productsOf(sid);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === pid) return { item: list[i], index: i, list: list };
    }
    return null;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeDelivery(mode) {
    if (mode === 'pickup') return 'pickup';
    return 'express';
  }

  function normalizePoint(mode) {
    if (mode === 'points' || mode === 'POINTS_ONLY' || mode === 'points_only') return 'points';
    if (mode === 'points_cash' || mode === 'POINTS_CASH') return 'points_cash';
    return 'cash';
  }

  function goodsIdOf(p) {
    if (p.goodsId) return String(p.goodsId);
    var n = 349688244318765000;
    String(p.id || p.sku || '').split('').forEach(function (ch) {
      n += ch.charCodeAt(0);
    });
    return String(n);
  }

  function normalizeSku(raw, productImg) {
    var spec = raw.specName || raw.displayName || raw.specValue || '默认规格';
    var price = raw.price != null ? raw.price : raw.salePrice;
    return {
      id: raw.id,
      displayName: raw.displayName || spec,
      specValue: raw.specValue || spec,
      barcode: raw.barcode || raw.internalCode || '',
      baseUnit: raw.baseUnit || raw.unit || '份',
      purchasePrice: raw.purchasePrice != null ? raw.purchasePrice : 0.01,
      saleRatio: raw.saleRatio != null ? raw.saleRatio : raw.saleCoeff != null ? Number(raw.saleCoeff).toFixed(3) : '1.000',
      saleUnit: raw.saleUnit || '',
      limitConfig: raw.limitConfig || '',
      pointExchange: normalizePoint(raw.pointExchange || raw.bundleMode),
      pointsAmount: raw.pointsAmount || raw.bundlePoints || '',
      pointCash: raw.pointCash || raw.bundleCash || '',
      salePrice: price,
      linePrice: raw.linePrice != null ? raw.linePrice : raw.marketPrice,
      minQty: raw.minQty != null ? raw.minQty : 1,
      sellableMode: window.MdmSkuWhStock && window.MdmSkuWhStock.normalizeSellableMode
        ? window.MdmSkuWhStock.normalizeSellableMode(raw.sellableMode)
        : raw.sellableMode === 'fixed' ? 'fixed' : 'spot',
      sellablePercent: raw.sellablePercent != null ? raw.sellablePercent : '100',
      sellableFixed: raw.sellableFixed || '',
      liveStock: raw.liveStock != null ? raw.liveStock : raw.stock,
      onShelf: raw.onShelf !== false && raw.enabled !== false,
      img: raw.img || productImg || '../user-app/assets/restock/product-leaf.svg'
    };
  }

  function ensureSkus(p) {
    var list = p.skus && p.skus.length ? p.skus : [
      {
        id: 'sku-' + (p.id || 'x') + '-1',
        specName: p.spec || '默认规格',
        price: p.price,
        marketPrice: p.marketPrice,
        stock: p.stock,
        unit: '份'
      }
    ];
    return list.map(function (s) {
      var sku = normalizeSku(s, p.img);
      if (window.MdmSkuWhStock && window.MdmSkuWhStock.attachToSku) {
        var sum = window.MdmSkuWhStock.attachToSku(sku, { sessionId: sessionId });
        var cap = (sum.remainTotal || 0) + (sum.sessionReservedTotal || 0);
        if (sku.liveStock === '' || sku.liveStock == null || Number(sku.liveStock) > cap) {
          sku.liveStock = cap;
        }
      }
      return sku;
    });
  }

  function fillCategories() {
    var el = document.getElementById('pCategory');
    if (!el) return;
    el.innerHTML =
      '<option value="">请选择商品类目</option>' +
      (Demo.categories || [])
        .map(function (c) {
          return (
            '<option value="' +
            escapeHtml(c.id) +
            '"' +
            (c.enabled === false ? ' disabled' : '') +
            '>' +
            escapeHtml(c.name) +
            '</option>'
          );
        })
        .join('');
  }

  function renderEditorToolbar() {
    var bar = document.getElementById('pEditorToolbar');
    if (!bar) return;
    bar.innerHTML = EDITOR_CMDS.map(function (item) {
      if (item.divider) return '<span class="product-add-editor__divider"></span>';
      return (
        '<button type="button" class="product-add-editor__btn" data-editor-cmd="' +
        escapeHtml(item.cmd) +
        '"' +
        (item.value ? ' data-editor-value="' + escapeHtml(item.value) + '"' : '') +
        '>' +
        escapeHtml(item.label) +
        '</button>'
      );
    }).join('');
  }

  function optionHtml(list, current) {
    return list
      .map(function (opt) {
        var value = typeof opt === 'string' ? opt : opt.value;
        var label = typeof opt === 'string' ? opt : opt.label;
        return (
          '<option value="' +
          escapeHtml(value) +
          '"' +
          (String(current || '') === String(value) ? ' selected' : '') +
          '>' +
          escapeHtml(label) +
          '</option>'
        );
      })
      .join('');
  }

  function fieldHtml(label, field, value, readonly, extraClass) {
    return (
      '<div class="product-proxy-spec__field' +
      (extraClass ? ' ' + extraClass : '') +
      '">' +
      '<label class="product-proxy-spec__label' +
      (extraClass === 'is-live-stock' ? ' is-req' : '') +
      '">' +
      escapeHtml(label) +
      '</label>' +
      '<input type="text" class="product-proxy-spec__input" data-field="' +
      field +
      '" value="' +
      escapeHtml(value == null ? '' : value) +
      '"' +
      (readonly ? ' readonly' : '') +
      '>' +
      '</div>'
    );
  }

  function moneyHtml(label, field, value, readonly) {
    return (
      '<div class="product-proxy-spec__field">' +
      '<label class="product-proxy-spec__label">' +
      escapeHtml(label) +
      '</label>' +
      '<div class="product-proxy-spec__money">' +
      '<span class="product-proxy-spec__money-prefix">¥</span>' +
      '<input type="text" class="product-proxy-spec__input product-proxy-spec__input--money" data-field="' +
      field +
      '" value="' +
      escapeHtml(value == null || value === '' ? '' : value) +
      '"' +
      (readonly ? ' readonly' : '') +
      '>' +
      '</div></div>'
    );
  }

  function selectHtml(label, field, options, current) {
    return (
      '<div class="product-proxy-spec__field">' +
      '<label class="product-proxy-spec__label">' +
      escapeHtml(label) +
      '</label>' +
      '<select class="product-proxy-spec__input" data-field="' +
      field +
      '">' +
      optionHtml(options, current) +
      '</select></div>'
    );
  }

  function renderPointField(sku) {
    var mode = normalizePoint(sku.pointExchange);
    var extra = '';
    if (mode === 'points' || mode === 'points_cash') {
      extra +=
        '<div class="product-proxy-spec__points-input">' +
        '<input type="text" class="product-proxy-spec__input" data-field="pointsAmount" value="' +
        escapeHtml(sku.pointsAmount || '') +
        '" placeholder="积分">' +
        '</div>';
    }
    if (mode === 'points_cash') {
      extra +=
        '<div class="product-proxy-spec__money product-proxy-spec__money--inline">' +
        '<span class="product-proxy-spec__money-prefix">¥</span>' +
        '<input type="text" class="product-proxy-spec__input product-proxy-spec__input--money" data-field="pointCash" value="' +
        escapeHtml(sku.pointCash || '') +
        '">' +
        '</div>';
    }
    return (
      '<div class="product-proxy-spec__field product-proxy-spec__field--exchange">' +
      '<label class="product-proxy-spec__label">积分兑换</label>' +
      '<div class="product-proxy-spec__exchange-row">' +
      '<select class="product-proxy-spec__input product-proxy-spec__exchange-select" data-field="pointExchange">' +
      optionHtml(POINT_OPTIONS, mode) +
      '</select>' +
      extra +
      '</div></div>'
    );
  }

  function findSku(id) {
    for (var i = 0; i < skuPool.length; i++) {
      if (skuPool[i].id === id) return skuPool[i];
    }
    return null;
  }

  function renderSkuTrigger() {
    var el = document.getElementById('pSkuTrigger');
    if (el) {
      el.innerHTML = '已选 ' + selectedSkuIds.length + ' 个 SKU <span class="product-proxy-form__sku-caret">▼</span>';
    }
  }

  function renderSkuDropdown() {
    var box = document.getElementById('pSkuDropdown');
    if (!box) return;
    box.innerHTML = skuPool
      .map(function (sku) {
        var checked = selectedSkuIds.indexOf(sku.id) >= 0 ? ' checked' : '';
        return (
          '<label class="product-proxy-form__sku-option">' +
          '<input type="checkbox" data-sku-pick="' +
          escapeHtml(sku.id) +
          '"' +
          checked +
          '>' +
          '<span>' +
          escapeHtml(sku.displayName || sku.specValue || sku.id) +
          '</span></label>'
        );
      })
      .join('');
  }

  function renderSkuCard(sku) {
    var saleUnits = [{ value: '', label: '请选择' }].concat(
      SALE_UNITS.map(function (u) {
        return { value: u, label: u };
      })
    );
    return (
      '<article class="product-proxy-spec" data-sku-id="' +
      escapeHtml(sku.id) +
      '">' +
      '<div class="product-proxy-spec__head">' +
      '<span class="product-proxy-spec__head-label">展示规格名称</span>' +
      '<input type="text" class="product-proxy-spec__head-input" data-field="displayName" value="' +
      escapeHtml(sku.displayName || '') +
      '" placeholder="请输入展示规格名称">' +
      '</div>' +
      '<div class="product-proxy-spec__body">' +
      '<div class="product-proxy-spec__thumb"><img src="' +
      escapeHtml(sku.img || '../user-app/assets/restock/product-leaf.svg') +
      '" alt=""></div>' +
      '<div class="product-proxy-spec__grid">' +
      fieldHtml('商品条形码', 'barcode', sku.barcode, true) +
      fieldHtml('规格值', 'specValue', sku.specValue, true) +
      fieldHtml('基础单位', 'baseUnit', sku.baseUnit, true) +
      moneyHtml('采购价', 'purchasePrice', sku.purchasePrice, true) +
      fieldHtml('售卖系数', 'saleRatio', sku.saleRatio || '1.000') +
      selectHtml('售卖单位', 'saleUnit', saleUnits, sku.saleUnit) +
      selectHtml('限购配置', 'limitConfig', LIMIT_OPTIONS, sku.limitConfig) +
      renderPointField(sku) +
      (normalizePoint(sku.pointExchange) === 'points' ? '' : moneyHtml('售价', 'salePrice', sku.salePrice)) +
      moneyHtml('划线价', 'linePrice', sku.linePrice) +
      fieldHtml('起售量', 'minQty', sku.minQty) +
      fieldHtml('现货库存', 'spotStock', sku.spotStock, true) +
      fieldHtml('可售库存', 'sellableStock', sku.sellableStock, true) +
      fieldHtml('本场售卖配额', 'liveStock', sku.liveStock, false, 'is-live-stock') +
      (window.MdmSkuWhStock && typeof window.MdmSkuWhStock.renderPanel === 'function'
        ? window.MdmSkuWhStock.renderPanel(sku, { variant: 'live', sessionId: sessionId })
        : '<p class="product-proxy-spec__stock-tip product-proxy-spec__stock-tip--span">本场配额不超过剩余可售（可售−现货预占）。</p>') +
      '</div></div>' +
      '<div class="product-proxy-spec__foot">' +
      '<button type="button" class="product-proxy-spec__btn-off' +
      (sku.onShelf === false ? ' is-off' : '') +
      '" data-act="toggle-shelf">' +
      (sku.onShelf === false ? '上架' : '下架') +
      '</button>' +
      '<button type="button" class="product-proxy-spec__btn-del" data-act="remove-sku">删除</button>' +
      '</div></article>'
    );
  }

  function renderSkuCards() {
    var list = document.getElementById('pSkuList');
    if (!list) return;
    var cards = selectedSkuIds
      .map(function (id) {
        return findSku(id);
      })
      .filter(Boolean);
    if (!cards.length) {
      list.innerHTML = '<div class="lf-live-empty-tip">请至少选择一个 SKU</div>';
    } else {
      list.innerHTML = cards.map(renderSkuCard).join('');
    }
    renderSkuTrigger();
    renderSkuDropdown();
  }

  function readSkuCards() {
    document.querySelectorAll('#pSkuList .product-proxy-spec').forEach(function (panel) {
      var sku = findSku(panel.getAttribute('data-sku-id'));
      if (!sku) return;
      panel.querySelectorAll('[data-field]').forEach(function (input) {
        sku[input.getAttribute('data-field')] = input.value;
      });
    });
  }

  function renderImages() {
    var box = document.getElementById('pImages');
    if (!box) return;
    var html = images
      .map(function (src, idx) {
        return (
          '<div class="product-proxy-form__img-item' +
          (idx === 0 ? ' is-cover' : '') +
          '" data-img-index="' +
          idx +
          '">' +
          '<img src="' +
          escapeHtml(src) +
          '" alt="">' +
          '<button type="button" class="product-proxy-form__img-remove" data-act="remove-image" data-index="' +
          idx +
          '" aria-label="删除">&times;</button>' +
          '</div>'
        );
      })
      .join('');
    if (video) {
      html +=
        '<div class="product-proxy-form__img-item is-video">' +
        '<img src="' +
        escapeHtml(images[0] || '../user-app/assets/restock/product-leaf.svg') +
        '" alt="">' +
        '<button type="button" class="product-proxy-form__img-remove" data-act="remove-video" aria-label="删除">&times;</button>' +
        '</div>';
    }
    html +=
      '<button type="button" class="product-add-upload__box" id="pAddMediaBtn" aria-label="上传图片或视频"><span class="product-add-upload__plus">+</span></button>';
    box.innerHTML = html;
  }

  function syncSalesInput() {
    var mode = (document.querySelector('input[name="displaySalesMode"]:checked') || {}).value || 'ACTUAL';
    var input = document.getElementById('pDisplaySales');
    if (input) input.hidden = mode !== 'CUSTOM';
  }

  function takeSnapshot() {
    snapshot = {
      skuPool: clone(skuPool),
      selectedSkuIds: selectedSkuIds.slice()
    };
  }

  function loadForm() {
    productId = qs('id');
    sessionId = qs('sessionId');
    var back = document.getElementById('schedEditBack');
    if (back) back.setAttribute('href', listHref());

    var found = productId && sessionId ? findProduct(sessionId, productId) : null;
    var empty = document.getElementById('schedEditEmpty');
    var form = document.getElementById('schedEditForm');
    var footer = document.getElementById('schedEditFooter');

    if (!found) {
      if (empty) empty.hidden = false;
      if (form) form.hidden = true;
      if (footer) footer.hidden = true;
      return;
    }

    product = found.item;
    if (empty) empty.hidden = true;
    if (form) form.hidden = false;
    if (footer) footer.hidden = false;

    document.getElementById('schedProductId').textContent = goodsIdOf(product);
    document.getElementById('pName').value = product.name || '';
    document.getElementById('pCategory').value = product.categoryId || '';
    document.getElementById('pDesc').value = product.desc || '';
    document.getElementById('pArrival').value = product.arrivalTime || '';
    document.getElementById('pArrivalUnit').value = product.arrivalUnit || 'DAY';

    var dm = normalizeDelivery(product.deliveryMode);
    var dmEl = document.querySelector('input[name="deliveryMode"][value="' + dm + '"]');
    if (dmEl) dmEl.checked = true;

    var salesMode = product.displaySalesMode || 'ACTUAL';
    var smEl = document.querySelector('input[name="displaySalesMode"][value="' + salesMode + '"]');
    if (smEl) smEl.checked = true;
    document.getElementById('pDisplaySales').value = product.displaySales || '';
    syncSalesInput();

    images = (product.images && product.images.length ? product.images.slice() : product.img ? [product.img] : []).slice(0, 10);
    video = product.video || '';
    renderImages();

    var editor = document.getElementById('pDetailEditor');
    if (editor) editor.innerHTML = product.detailHtml || '';

    skuPool = ensureSkus(product);
    selectedSkuIds = skuPool.map(function (s) {
      return s.id;
    });
    takeSnapshot();
    renderSkuCards();
  }

  function validate() {
    var name = ((document.getElementById('pName') || {}).value || '').trim();
    if (!name) return toast('请输入商品名称', 'warning'), false;
    if (!(document.querySelector('input[name="deliveryMode"]:checked') || {}).value) {
      return toast('请选择配送方式', 'warning'), false;
    }
    readSkuCards();
    if (!selectedSkuIds.length) return toast('请至少选择一个 SKU', 'warning'), false;
    for (var i = 0; i < selectedSkuIds.length; i++) {
      var s = findSku(selectedSkuIds[i]);
      if (!s) continue;
      var mode = normalizePoint(s.pointExchange);
      if (mode !== 'points' && (s.salePrice === '' || s.salePrice == null || isNaN(Number(s.salePrice)))) {
        return toast('请补充 ' + (s.displayName || s.id) + ' 的售价', 'warning'), false;
      }
      if (s.liveStock === '' || s.liveStock == null || isNaN(Number(s.liveStock))) {
        return toast('请补充 ' + (s.displayName || s.id) + ' 的本场售卖配额', 'warning'), false;
      }
      if (window.MdmSkuWhStock && window.MdmSkuWhStock.summarize) {
        var stockSum = window.MdmSkuWhStock.summarize(s, { sessionId: sessionId });
        var cap = (stockSum.remainTotal || 0) + (stockSum.sessionReservedTotal || 0);
        if (Number(s.liveStock) > cap) {
          return toast(
            (s.displayName || s.id) + ' 本场配额不能超过配送仓剩余可售（' + cap + '）',
            'warning'
          ), false;
        }
      }
    }
    return true;
  }

  function applyToProduct() {
    readSkuCards();
    var catId = document.getElementById('pCategory').value;
    var cat = (Demo.categories || []).find(function (c) {
      return c.id === catId;
    });
    var kept = selectedSkuIds
      .map(function (id) {
        return findSku(id);
      })
      .filter(Boolean);
    var first = kept[0];
    Object.assign(product, {
      name: document.getElementById('pName').value.trim(),
      categoryId: catId,
      category: cat ? cat.name : product.category,
      desc: document.getElementById('pDesc').value.trim(),
      arrivalTime: document.getElementById('pArrival').value.trim(),
      arrivalUnit: document.getElementById('pArrivalUnit').value,
      deliveryMode: (document.querySelector('input[name="deliveryMode"]:checked') || {}).value || 'express',
      displaySalesMode: (document.querySelector('input[name="displaySalesMode"]:checked') || {}).value || 'ACTUAL',
      displaySales: document.getElementById('pDisplaySales').value.trim(),
      images: images.slice(),
      img: images[0] || product.img || '',
      video: video,
      detailHtml: (document.getElementById('pDetailEditor') || {}).innerHTML || '',
      goodsId: goodsIdOf(product),
      skus: kept.map(function (s) {
        return {
          id: s.id,
          specName: s.displayName,
          displayName: s.displayName,
          specValue: s.specValue,
          barcode: s.barcode,
          unit: s.baseUnit,
          baseUnit: s.baseUnit,
          purchasePrice: s.purchasePrice,
          saleRatio: s.saleRatio,
          saleCoeff: s.saleRatio,
          saleUnit: s.saleUnit,
          limitConfig: s.limitConfig,
          pointExchange: s.pointExchange,
          pointsAmount: s.pointsAmount,
          pointCash: s.pointCash,
          price: s.salePrice,
          salePrice: s.salePrice,
          marketPrice: s.linePrice,
          linePrice: s.linePrice,
          minQty: s.minQty,
          stock: s.liveStock,
          liveStock: s.liveStock,
          onShelf: s.onShelf,
          enabled: s.onShelf !== false,
          img: s.img
        };
      }),
      spec: first ? first.displayName : product.spec,
      price: first ? first.salePrice : product.price,
      marketPrice: first ? first.linePrice : product.marketPrice,
      stock: kept.reduce(function (sum, s) {
        return sum + (Number(s.liveStock) || 0);
      }, 0)
    });
  }

  function bindEvents() {
    document.getElementById('pCancelBtn').addEventListener('click', function () {
      window.location.href = listHref();
    });
    document.getElementById('pSaveBtn').addEventListener('click', function () {
      if (!validate()) return;
      applyToProduct();
      toast('保存成功，仅本场排品生效');
    });

    document.querySelectorAll('input[name="displaySalesMode"]').forEach(function (el) {
      el.addEventListener('change', syncSalesInput);
    });

    document.getElementById('pResetSkuBtn').addEventListener('click', function () {
      if (!snapshot) return;
      if (!window.confirm('确认重置当前规格配置吗？重置后将恢复到进入编辑前的内容。')) return;
      skuPool = clone(snapshot.skuPool);
      selectedSkuIds = snapshot.selectedSkuIds.slice();
      renderSkuCards();
      toast('规格已重置');
    });

    var trigger = document.getElementById('pSkuTrigger');
    var dropdown = document.getElementById('pSkuDropdown');
    var picker = document.getElementById('pSkuPicker');
    if (trigger && dropdown) {
      trigger.addEventListener('click', function (ev) {
        ev.stopPropagation();
        dropdown.hidden = !dropdown.hidden;
      });
    }
    if (dropdown) {
      dropdown.addEventListener('change', function (ev) {
        var box = ev.target.closest('[data-sku-pick]');
        if (!box) return;
        var id = box.getAttribute('data-sku-pick');
        readSkuCards();
        if (box.checked) {
          if (selectedSkuIds.indexOf(id) < 0) selectedSkuIds.push(id);
        } else {
          if (selectedSkuIds.length <= 1) {
            box.checked = true;
            toast('请至少保留一个 SKU', 'warning');
            return;
          }
          selectedSkuIds = selectedSkuIds.filter(function (x) {
            return x !== id;
          });
        }
        renderSkuCards();
      });
    }
    document.addEventListener('click', function (ev) {
      if (!picker || !dropdown || dropdown.hidden) return;
      if (picker.contains(ev.target)) return;
      dropdown.hidden = true;
    });

    document.getElementById('pSkuList').addEventListener('change', function (ev) {
      if (ev.target.getAttribute('data-field') !== 'pointExchange') return;
      readSkuCards();
      renderSkuCards();
    });
    document.getElementById('pSkuList').addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      var panel = actEl.closest('[data-sku-id]');
      if (!panel) return;
      var id = panel.getAttribute('data-sku-id');
      var sku = findSku(id);
      if (!sku) return;
      readSkuCards();
      if (actEl.getAttribute('data-act') === 'toggle-shelf') {
        sku.onShelf = sku.onShelf === false;
        renderSkuCards();
        toast(sku.onShelf === false ? '该规格已下架' : '该规格已上架');
        return;
      }
      if (actEl.getAttribute('data-act') === 'remove-sku') {
        if (selectedSkuIds.length <= 1) return toast('至少保留一个规格', 'warning');
        selectedSkuIds = selectedSkuIds.filter(function (x) {
          return x !== id;
        });
        skuPool = skuPool.filter(function (s) {
          return s.id !== id;
        });
        renderSkuCards();
        toast('已删除该规格');
      }
    });

    document.getElementById('pImages').addEventListener('click', function (ev) {
      if (ev.target.closest('.product-add-upload__box')) {
        document.getElementById('pImageInput').click();
        return;
      }
      var rmImg = ev.target.closest('[data-act="remove-image"]');
      if (rmImg) {
        images.splice(Number(rmImg.getAttribute('data-index')), 1);
        renderImages();
        return;
      }
      if (ev.target.closest('[data-act="remove-video"]')) {
        video = '';
        renderImages();
      }
    });

    document.getElementById('pImageInput').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []);
      this.value = '';
      files.forEach(function (file) {
        var isVideo = file.type === 'video/mp4';
        if (isVideo) {
          if (file.size > 10 * 1024 * 1024) return toast('视频需 ≤10MB', 'warning');
          video = URL.createObjectURL(file);
          toast('已添加视频（演示）');
          return;
        }
        if (images.length >= 10) return toast('最多上传 10 张图片', 'warning');
        if (file.size > 5 * 1024 * 1024) return toast('单张图片需 ≤5MB', 'warning');
        images.push(URL.createObjectURL(file));
      });
      renderImages();
    });

    document.getElementById('pEditorToolbar').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-editor-cmd]');
      if (!btn) return;
      ev.preventDefault();
      var cmd = btn.getAttribute('data-editor-cmd');
      var value = btn.getAttribute('data-editor-value');
      var editor = document.getElementById('pDetailEditor');
      if (editor) editor.focus();
      if (cmd === 'createLink') {
        var url = window.prompt('请输入链接地址', 'https://');
        if (url) document.execCommand('createLink', false, url);
        return;
      }
      if (cmd === 'insertImage') {
        var src = window.prompt('请输入图片地址');
        if (src) document.execCommand('insertImage', false, src);
        return;
      }
      if (cmd === 'insertHTML') {
        document.execCommand('insertHTML', false, '<table border="1" style="width:100%;border-collapse:collapse;"><tr><td>内容</td><td>内容</td></tr></table>');
        return;
      }
      if (cmd === 'foreColor' || cmd === 'hiliteColor') {
        var color = window.prompt('请输入颜色，如 #ff7019', '#ff7019');
        if (color) document.execCommand(cmd, false, color);
        return;
      }
      if (cmd === 'fontSize') {
        document.execCommand('fontSize', false, '4');
        return;
      }
      document.execCommand(cmd, false, value || null);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillCategories();
    renderEditorToolbar();
    bindEvents();
    loadForm();
  });
})();
