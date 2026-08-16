/**
 * 直播商品 — 排品编辑
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

  var productId = '';
  var sessionId = '';
  var product = null;
  var skus = [];
  var selectedSkuIds = {};
  var snapshotSkus = [];
  var images = [];
  var detailImages = [];

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

  function fillCategories() {
    var el = document.getElementById('pCategory');
    if (!el) return;
    el.innerHTML =
      '<option value="">请选择商品类目</option>' +
      Demo.categories
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

  function ensureSkus(p) {
    if (p.skus && p.skus.length) {
      return p.skus.map(function (s) {
        return Object.assign({}, s);
      });
    }
    return [
      {
        id: 'sku-' + (p.id || 'x') + '-1',
        specName: p.spec || '默认规格',
        price: p.price,
        marketPrice: p.marketPrice,
        stock: p.stock,
        minQty: 1,
        limitQty: '',
        bundleMode: '',
        bundlePoints: '',
        bundleCash: '',
        unit: '份',
        saleCoeff: 1,
        enabled: true
      }
    ];
  }

  function renderMedia(boxId, list, kind) {
    var box = document.getElementById(boxId);
    if (!box) return;
    if (!list.length) {
      box.innerHTML = '<div class="lf-live-media-empty">暂无图片</div>';
      return;
    }
    box.innerHTML = list
      .map(function (item, idx) {
        return (
          '<div class="lf-live-media-item" data-kind="' +
          escapeHtml(kind) +
          '" data-idx="' +
          idx +
          '">' +
          '<div class="lf-live-media-item__thumb">' +
          (idx === 0 && kind === 'images' ? '<span class="lf-live-media-item__cover">封面</span>' : '') +
          '图' +
          (idx + 1) +
          '</div>' +
          '<button type="button" class="lf-live-media-item__remove" data-act="remove-media">删除</button>' +
          '</div>'
        );
      })
      .join('');
  }

  function updateSkuHint() {
    var n = Object.keys(selectedSkuIds).filter(function (k) {
      return selectedSkuIds[k];
    }).length;
    var hint = document.getElementById('pSkuSelectedHint');
    if (hint) hint.textContent = '已选 ' + n + ' 个 SKU';
    var all = document.getElementById('pSkuCheckAll');
    if (all) all.checked = skus.length > 0 && n === skus.length;
  }

  function renderSkus() {
    var tbody = document.getElementById('pSkuBody');
    if (!tbody) return;
    if (!skus.length) {
      tbody.innerHTML =
        '<tr><td colspan="11" style="text-align:center;color:#999;padding:20px;">请至少保留一个规格</td></tr>';
      updateSkuHint();
      return;
    }
    tbody.innerHTML = skus
      .map(function (s) {
        var checked = selectedSkuIds[s.id] ? ' checked' : '';
        var bundle =
          s.bundleMode === 'POINTS_ONLY'
            ? escapeHtml(String(s.bundlePoints || '')) + ' 积分'
            : s.bundleMode === 'POINTS_CASH'
              ? escapeHtml(String(s.bundlePoints || '')) +
                ' 积分 + ¥' +
                escapeHtml(String(s.bundleCash || ''))
              : '—';
        return (
          '<tr data-sku-id="' +
          escapeHtml(s.id) +
          '">' +
          '<td><input type="checkbox" data-sku-check="' +
          escapeHtml(s.id) +
          '"' +
          checked +
          '></td>' +
          '<td><input class="erp-input" data-f="specName" value="' +
          escapeHtml(s.specName || '') +
          '"></td>' +
          '<td><input class="erp-input" data-f="price" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(s.price != null ? s.price : '')) +
          '"></td>' +
          '<td><input class="erp-input" data-f="marketPrice" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(s.marketPrice != null ? s.marketPrice : '')) +
          '"></td>' +
          '<td><input class="erp-input" data-f="stock" type="number" min="0" step="1" value="' +
          escapeHtml(String(s.stock != null ? s.stock : '')) +
          '"></td>' +
          '<td><input class="erp-input" data-f="minQty" type="number" min="1" step="1" value="' +
          escapeHtml(String(s.minQty != null ? s.minQty : 1)) +
          '"></td>' +
          '<td><input class="erp-input" data-f="limitQty" type="number" min="1" step="1" value="' +
          escapeHtml(String(s.limitQty != null ? s.limitQty : '')) +
          '"></td>' +
          '<td>' +
          bundle +
          '</td>' +
          '<td><input class="erp-input" data-f="unit" value="' +
          escapeHtml(s.unit || '') +
          '"></td>' +
          '<td><input class="erp-input" data-f="saleCoeff" type="number" min="1" step="1" value="' +
          escapeHtml(String(s.saleCoeff != null ? s.saleCoeff : 1)) +
          '"></td>' +
          '<td><a href="#" data-act="remove-sku">删除</a></td>' +
          '</tr>'
        );
      })
      .join('');
    updateSkuHint();
  }

  function syncOtherVisibility() {
    var mode = (document.getElementById('pDisplaySalesMode') || {}).value || 'ACTUAL';
    var sales = document.getElementById('pDisplaySales');
    if (sales) sales.hidden = mode !== 'CUSTOM';
    var limitType = (document.getElementById('pLimitType') || {}).value || 'NONE';
    var limitQty = document.getElementById('pLimitQty');
    if (limitQty) limitQty.hidden = limitType === 'NONE';
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

    document.getElementById('schedProductId').textContent = product.id || '-';
    document.getElementById('pName').value = product.name || '';
    document.getElementById('pCategory').value = product.categoryId || '';
    document.getElementById('pSku').value = product.sku || product.id || '';
    document.getElementById('pDesc').value = product.desc || '';
    document.getElementById('pArrival').value = product.arrivalTime || '';
    document.getElementById('pArrivalUnit').value = product.arrivalUnit || 'DAY';
    var dm = product.deliveryMode || 'pickup';
    var dmEl = document.querySelector('input[name="deliveryMode"][value="' + dm + '"]');
    if (dmEl) dmEl.checked = true;

    images = (product.images || []).slice();
    detailImages = (product.detailImages || []).slice();
    renderMedia('pImages', images, 'images');
    renderMedia('pDetailImages', detailImages, 'detail');

    skus = ensureSkus(product);
    snapshotSkus = skus.map(function (s) {
      return Object.assign({}, s);
    });
    selectedSkuIds = {};
    skus.forEach(function (s) {
      selectedSkuIds[s.id] = true;
    });
    renderSkus();

    document.getElementById('pDisplaySalesMode').value = product.displaySalesMode || 'ACTUAL';
    document.getElementById('pDisplaySales').value = product.displaySales || '';
    document.getElementById('pLimitType').value = product.purchaseLimitType || 'NONE';
    document.getElementById('pLimitQty').value = product.purchaseLimit || '';
    syncOtherVisibility();
  }

  function readSkusFromTable() {
    var tbody = document.getElementById('pSkuBody');
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-sku-id]').forEach(function (tr) {
      var id = tr.getAttribute('data-sku-id');
      var sku = skus.find(function (s) {
        return s.id === id;
      });
      if (!sku) return;
      tr.querySelectorAll('[data-f]').forEach(function (input) {
        var key = input.getAttribute('data-f');
        var val = input.value;
        if (key === 'price' || key === 'marketPrice' || key === 'stock' || key === 'minQty' || key === 'saleCoeff') {
          sku[key] = val === '' ? '' : Number(val);
        } else {
          sku[key] = val;
        }
      });
    });
  }

  function validate() {
    var name = ((document.getElementById('pName') || {}).value || '').trim();
    var categoryId = (document.getElementById('pCategory') || {}).value || '';
    if (!name) return toast('请输入商品名称', 'warning'), false;
    if (!categoryId) return toast('请选择商品类目', 'warning'), false;
    readSkusFromTable();
    var enabled = skus.filter(function (s) {
      return selectedSkuIds[s.id];
    });
    if (!enabled.length) return toast('请至少保留一个规格', 'warning'), false;
    for (var i = 0; i < enabled.length; i++) {
      var s = enabled[i];
      if (s.price === '' || s.price == null || isNaN(Number(s.price))) {
        return toast('请补充 ' + (s.specName || s.id) + ' 的售价', 'warning'), false;
      }
      if (s.stock === '' || s.stock == null || isNaN(Number(s.stock))) {
        return toast('请补充 ' + (s.specName || s.id) + ' 的直播售卖库存', 'warning'), false;
      }
    }
    return true;
  }

  function applyToProduct(extra) {
    readSkusFromTable();
    var catId = document.getElementById('pCategory').value;
    var cat = Demo.categories.find(function (c) {
      return c.id === catId;
    });
    var kept = skus.filter(function (s) {
      return selectedSkuIds[s.id];
    });
    var first = kept[0] || skus[0];
    Object.assign(product, {
      name: document.getElementById('pName').value.trim(),
      categoryId: catId,
      category: cat ? cat.name : product.category,
      sku: document.getElementById('pSku').value,
      desc: document.getElementById('pDesc').value.trim(),
      arrivalTime: document.getElementById('pArrival').value.trim(),
      arrivalUnit: document.getElementById('pArrivalUnit').value,
      deliveryMode: (document.querySelector('input[name="deliveryMode"]:checked') || {}).value || 'pickup',
      images: images.slice(),
      detailImages: detailImages.slice(),
      displaySalesMode: document.getElementById('pDisplaySalesMode').value,
      displaySales: document.getElementById('pDisplaySales').value.trim(),
      purchaseLimitType: document.getElementById('pLimitType').value,
      purchaseLimit: document.getElementById('pLimitQty').value,
      skus: kept,
      spec: first ? first.specName : product.spec,
      price: first ? first.price : product.price,
      marketPrice: first ? first.marketPrice : product.marketPrice,
      stock: kept.reduce(function (sum, s) {
        return sum + (Number(s.stock) || 0);
      }, 0)
    }, extra || {});
  }

  function bindEvents() {
    document.getElementById('pCancelBtn').addEventListener('click', function () {
      window.location.href = listHref();
    });
    document.getElementById('pSaveBtn').addEventListener('click', function () {
      if (!validate()) return;
      applyToProduct();
      toast('保存成功');
      setTimeout(function () {
        window.location.href = listHref();
      }, 400);
    });
    document.getElementById('pOnBtn').addEventListener('click', function () {
      if (!product) return;
      product.status = 'enabled';
      toast('商品已启用，可在直播间上架');
    });
    document.getElementById('pOffBtn').addEventListener('click', function () {
      if (!product) return;
      product.status = 'disabled';
      if (product.liveStatus && product.liveStatus !== 'off_shelf') product.liveStatus = 'off_shelf';
      toast('商品已禁用');
    });
    document.getElementById('pDeleteBtn').addEventListener('click', function () {
      if (!product) return;
      if (!window.confirm('确认删除该直播商品？')) return;
      var found = findProduct(sessionId, productId);
      if (!found) return;
      found.list.splice(found.index, 1);
      toast('商品已删除');
      window.location.href = listHref();
    });

    document.getElementById('pDisplaySalesMode').addEventListener('change', syncOtherVisibility);
    document.getElementById('pLimitType').addEventListener('change', syncOtherVisibility);

    document.getElementById('pAddImageBtn').addEventListener('click', function () {
      images.push({ id: 'img-' + Date.now() });
      renderMedia('pImages', images, 'images');
      toast('已添加图片占位');
    });
    document.getElementById('pAddDetailBtn').addEventListener('click', function () {
      detailImages.push({ id: 'dimg-' + Date.now() });
      renderMedia('pDetailImages', detailImages, 'detail');
      toast('已添加详情图占位');
    });

    document.getElementById('pImages').addEventListener('click', onMediaClick);
    document.getElementById('pDetailImages').addEventListener('click', onMediaClick);

    document.getElementById('pResetSkuBtn').addEventListener('click', function () {
      if (!window.confirm('确认重置当前规格配置吗？重置后将恢复到进入编辑前的内容。')) return;
      skus = snapshotSkus.map(function (s) {
        return Object.assign({}, s);
      });
      selectedSkuIds = {};
      skus.forEach(function (s) {
        selectedSkuIds[s.id] = true;
      });
      renderSkus();
      toast('规格已重置');
    });

    document.getElementById('pSelectAllSku').addEventListener('click', function () {
      skus.forEach(function (s) {
        selectedSkuIds[s.id] = true;
      });
      renderSkus();
    });
    document.getElementById('pClearSku').addEventListener('click', function () {
      selectedSkuIds = {};
      renderSkus();
    });
    document.getElementById('pPickSku').addEventListener('click', function () {
      var nextId = 'sku-' + Date.now().toString(36);
      skus.push({
        id: nextId,
        specName: '新规格',
        price: 9.9,
        marketPrice: 19.9,
        stock: 100,
        minQty: 1,
        limitQty: '',
        bundleMode: '',
        bundlePoints: '',
        bundleCash: '',
        unit: '份',
        saleCoeff: 1,
        enabled: true
      });
      selectedSkuIds[nextId] = true;
      renderSkus();
      toast('已添加规格（选择 SKU 演示）');
    });
    document.getElementById('pSkuCheckAll').addEventListener('change', function () {
      var on = document.getElementById('pSkuCheckAll').checked;
      selectedSkuIds = {};
      if (on) {
        skus.forEach(function (s) {
          selectedSkuIds[s.id] = true;
        });
      }
      renderSkus();
    });

    document.getElementById('pSkuBody').addEventListener('change', function (ev) {
      var check = ev.target.closest('[data-sku-check]');
      if (!check) return;
      var id = check.getAttribute('data-sku-check');
      selectedSkuIds[id] = !!check.checked;
      updateSkuHint();
    });
    document.getElementById('pSkuBody').addEventListener('click', function (ev) {
      var link = ev.target.closest('[data-act="remove-sku"]');
      if (!link) return;
      ev.preventDefault();
      readSkusFromTable();
      var tr = link.closest('tr[data-sku-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-sku-id');
      if (skus.length <= 1) return toast('至少保留一个规格', 'warning');
      skus = skus.filter(function (s) {
        return s.id !== id;
      });
      delete selectedSkuIds[id];
      renderSkus();
    });
  }

  function onMediaClick(ev) {
    var btn = ev.target.closest('[data-act="remove-media"]');
    if (!btn) return;
    var item = btn.closest('[data-kind][data-idx]');
    if (!item) return;
    var kind = item.getAttribute('data-kind');
    var idx = Number(item.getAttribute('data-idx'));
    if (kind === 'images') {
      images.splice(idx, 1);
      renderMedia('pImages', images, 'images');
    } else {
      detailImages.splice(idx, 1);
      renderMedia('pDetailImages', detailImages, 'detail');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillCategories();
    bindEvents();
    loadForm();
  });
})();
