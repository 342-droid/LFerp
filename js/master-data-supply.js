/**
 * 主数据 · 供货关系：查询、新增、编辑、删除
 * 一行对应一个货号和一个供应商。同一货号可有多家供应商，同一对不能重复。
 * 同一货号最多一个主供应商。
 */
(function () {
  var store = window.MasterDataSupplyRelationStore;
  var supplierStore = window.MasterDataSupplierStore;
  var RELATIONS = [];
  /* 供应链共用单位枚举；按商品所属一级分类收窄，见 master-data-units.js */
  var PURCHASE_UNITS = (window.MasterDataGoodsUnits && window.MasterDataGoodsUnits.list)
    ? window.MasterDataGoodsUnits.list.slice()
    : ['箱', '件', '个', '克', 'kg', 'ml', '斤', '包', '袋', '瓶', '罐'];
  var PRICE_STATUSES = ['未核价', '已核价'];
  var SAMPLE_STATUSES = ['待检', '合格', '无需样品'];
  var FALLBACK_GOODS = [
    { sku: '100001', spu: 'SPU100001', name: '生物发面猪肉小笼包 50g 100个/包', barcode: '6974562300012', category: '五花肉', shelfLife: '180', tempLayer: '冷冻', operateMode: '购销', purchasePrice: 18.8, purchaseUnit: '箱', tone: 'blue', mark: '笼' },
    { sku: '100002', spu: 'SPU100002', name: '生物发面牛肉小笼包 50g 100个/包', barcode: '6974562300013', category: '里脊', shelfLife: '180', tempLayer: '冷冻', operateMode: '购销', purchasePrice: 18.8, purchaseUnit: '箱', tone: 'orange', mark: '笼' },
    { sku: '100003', spu: 'SPU100003', name: '圆茄 优质', barcode: '6974562300101', category: '茄子', shelfLife: '7', tempLayer: '冷藏', operateMode: '代采代销', purchasePrice: 3.5, purchaseUnit: '箱', tone: 'green', mark: '茄' },
    { sku: '100004', spu: 'SPU100004', name: '普罗旺斯西红柿', barcode: '6974562300102', category: '西红柿', shelfLife: '7', tempLayer: '常温', operateMode: '代采代销', purchasePrice: 4, purchaseUnit: '箱', tone: 'orange', mark: '西' },
    { sku: '100005', spu: 'SPU100005', name: '红富士苹果', barcode: '6974562300401', category: '苹果', shelfLife: '30', tempLayer: '冷藏', operateMode: '联营', purchasePrice: 8, purchaseUnit: '箱', tone: 'orange', mark: '苹' },
    { sku: '110001', spu: 'SPU110001', name: '东北大米 5kg', barcode: '6974562300301', category: '东北大米', shelfLife: '365', tempLayer: '常温', operateMode: '购销', purchasePrice: 32, purchaseUnit: '箱', tone: 'green', mark: '米' },
    { sku: '120001', spu: 'SPU120001', name: '可口可乐摩登罐', barcode: '6974562300201', category: '可乐', shelfLife: '270', tempLayer: '常温', operateMode: '购销', purchasePrice: 52, purchaseUnit: '箱', tone: 'blue', mark: '可' },
    { sku: '130001', spu: 'SPU130001', name: '加厚纸杯 250ml', barcode: '6974562300501', category: '纸杯', shelfLife: '730', tempLayer: '常温', operateMode: '购销', purchasePrice: 7, purchaseUnit: '箱', tone: 'blue', mark: '杯' }
  ];

  function unitsForProduct(product, selected) {
    var category = product && product.category ? product.category : '';
    if (window.MasterDataGoodsUnits && window.MasterDataGoodsUnits.withSelectedForCategoryName) {
      return window.MasterDataGoodsUnits.withSelectedForCategoryName(category, selected);
    }
    var units = PURCHASE_UNITS.slice();
    if (selected && units.indexOf(selected) < 0) units.unshift(selected);
    return units;
  }

  function refreshActualUnitOptions(product, keepValue) {
    var select = document.getElementById('supplyFormActualUnit');
    if (!select) return;
    var current = keepValue != null ? keepValue : String(select.value || '');
    select.innerHTML = optionList(unitsForProduct(product, current), current, '请选择');
  }

  var state = {
    query: { sku: '', spu: '', name: '', barcode: '', supplier: '', operateMode: '', priceStatus: '', sampleStatus: '', status: '' },
    page: 1,
    pageSize: 20,
    editingId: null
  };

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(message, type) {
    if (typeof showToast === 'function') showToast(message, type || 'warning');
  }

  function catalog() {
    var live = window.MasterDataGoodsCatalog;
    var list = live && live.length ? live.slice() : FALLBACK_GOODS.slice();
    list.sort(function (a, b) {
      return String(a.sku || '').localeCompare(String(b.sku || ''), 'en', { numeric: true });
    });
    return list;
  }

  function relationSpu(item) {
    if (item && item.spu) return item.spu;
    var product = findProduct(item && item.sku);
    return product && product.spu ? product.spu : '';
  }

  function relationPurchaseUnit(item) {
    var product = findProduct(item && item.sku);
    if (product && product.purchaseUnit) return product.purchaseUnit;
    return item && item.purchaseUnit ? item.purchaseUnit : '';
  }

  function relationOperateMode(item) {
    var product = findProduct(item && item.sku);
    if (product && product.operateMode) return product.operateMode;
    return item && item.operateMode ? item.operateMode : '';
  }

  function relationStandardPrice(item) {
    var product = findProduct(item && item.sku);
    if (product && product.purchasePrice != null && product.purchasePrice !== '' && isFinite(Number(product.purchasePrice))) {
      return Number(product.purchasePrice);
    }
    var stored = item ? Number(item.purchasePrice) : NaN;
    return isFinite(stored) ? stored : '';
  }

  function productView(item) {
    var product = findProduct(item && item.sku);
    if (product) return product;
    if (!item) return null;
    return {
      sku: item.sku || '',
      spu: relationSpu(item),
      name: item.name || '',
      barcode: item.barcode || '',
      category: item.category || '',
      shelfLife: item.shelfLife || '',
      tempLayer: item.tempLayer || '',
      operateMode: item.operateMode || '',
      purchasePrice: item.purchasePrice,
      purchaseUnit: item.purchaseUnit || '',
      tone: item.tone || 'blue',
      mark: item.mark || '货'
    };
  }

  function findProduct(sku) {
    var key = String(sku || '');
    var found = null;
    catalog().some(function (item) {
      if (String(item.sku) === key) {
        found = item;
        return true;
      }
      return false;
    });
    return found;
  }

  function suppliers() {
    return supplierStore ? supplierStore.all() : [];
  }

  function findSupplier(id) {
    var found = null;
    suppliers().some(function (item) {
      if (item.id === id) {
        found = item;
        return true;
      }
      return false;
    });
    return found;
  }

  function supplierName(item) {
    var supplier = findSupplier(item && item.supplierId);
    if (supplier && supplier.name) return supplier.name;
    return item && item.supplierName ? item.supplierName : '—';
  }

  function supplierCode(item) {
    var supplier = findSupplier(item && item.supplierId);
    if (supplier && supplier.code) return supplier.code;
    return item && item.supplierCode ? item.supplierCode : '—';
  }

  function findRelation(id) {
    var found = null;
    RELATIONS.some(function (item) {
      if (item.id === id) {
        found = item;
        return true;
      }
      return false;
    });
    return found;
  }

  function formatPrice(value) {
    var num = Number(value);
    if (!isFinite(num)) return '—';
    return num.toFixed(2);
  }

  function formatQty(value) {
    var num = Number(value);
    if (!isFinite(num) || num < 1) return '—';
    return String(Math.round(num));
  }

  function formatShelf(value) {
    var text = String(value == null ? '' : value).trim();
    if (!text) return '—';
    return /天$/.test(text) ? text : text + '天';
  }

  function formatTemp(value) {
    return value || '—';
  }

  function thumbHtml(item) {
    var tone = item && item.tone ? item.tone : 'blue';
    var mark = item && item.mark ? item.mark : '货';
    return '<span class="mdb-goods-thumb mdb-goods-thumb--' + escapeHtml(tone) + '">' + escapeHtml(mark) + '</span>';
  }

  function relationStatus(item) {
    return item && item.status === 'disabled' ? 'disabled' : 'active';
  }

  function statusLabel(item) {
    return relationStatus(item) === 'disabled' ? '停用' : '启用';
  }

  function sampleClass(value) {
    if (value === '合格') return 'mdb-status mdb-status--active';
    if (value === '无需样品') return 'mdb-status mdb-status--plain';
    return 'mdb-status mdb-status--disabled';
  }

  function visibleRelations() {
    var query = state.query || {};
    var skuQuery = String(query.sku || '').trim();
    var spuQuery = String(query.spu || '').trim().toLowerCase();
    var nameQuery = String(query.name || '').trim().toLowerCase();
    var barcodeQuery = String(query.barcode || '').trim();
    var supplierQuery = String(query.supplier || '').trim().toLowerCase();
    return RELATIONS.filter(function (item) {
      if (skuQuery && String(item.sku || '').indexOf(skuQuery) < 0) return false;
      if (spuQuery && String(relationSpu(item) || '').toLowerCase().indexOf(spuQuery) < 0) return false;
      if (nameQuery && String(item.name || '').toLowerCase().indexOf(nameQuery) < 0) return false;
      if (barcodeQuery && String(item.barcode || '').indexOf(barcodeQuery) < 0) return false;
      if (supplierQuery && supplierName(item).toLowerCase().indexOf(supplierQuery) < 0 && supplierCode(item).toLowerCase().indexOf(supplierQuery) < 0) return false;
      if (query.operateMode && relationOperateMode(item) !== query.operateMode) return false;
      if (query.priceStatus && item.priceStatus !== query.priceStatus) return false;
      if (query.sampleStatus && item.sampleStatus !== query.sampleStatus) return false;
      if (query.status && relationStatus(item) !== query.status) return false;
      return true;
    }).sort(function (a, b) {
      var skuOrder = String(a.sku || '').localeCompare(String(b.sku || ''), 'en', { numeric: true });
      if (skuOrder) return skuOrder;
      if (!!a.isPrimary !== !!b.isPrimary) return a.isPrimary ? -1 : 1;
      return supplierName(a).localeCompare(supplierName(b), 'zh');
    });
  }

  function totalPagesOf(total) {
    return Math.max(1, Math.ceil(total / state.pageSize) || 1);
  }

  function clampPage(total) {
    var pages = totalPagesOf(total);
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
  }

  function renderTable(list) {
    var body = document.getElementById('supplyTableBody');
    if (!body) return;
    if (!list.length) {
      var queried = state.query.sku || state.query.spu || state.query.name || state.query.barcode || state.query.supplier || state.query.operateMode || state.query.priceStatus || state.query.sampleStatus || state.query.status;
      body.innerHTML = '<tr><td class="mdb-table-empty" colspan="20">' + (queried ? '暂无符合条件的供货关系' : '暂无供货关系') + '</td></tr>';
      return;
    }
    var start = (state.page - 1) * state.pageSize;
    body.innerHTML = list.slice(start, start + state.pageSize).map(function (item) {
      return '<tr>' +
        '<td>' + escapeHtml(supplierCode(item)) + '</td>' +
        '<td>' + escapeHtml(supplierName(item)) + '</td>' +
        '<td>' + escapeHtml(item.name) + '</td>' +
        '<td>' + escapeHtml(relationSpu(item) || '—') + '</td>' +
        '<td>' + escapeHtml(item.sku) + '</td>' +
        '<td>' + escapeHtml(item.barcode || '—') + '</td>' +
        '<td>' + escapeHtml(formatShelf(item.shelfLife)) + '</td>' +
        '<td>' + escapeHtml(formatTemp(item.tempLayer)) + '</td>' +
        '<td>' + thumbHtml(item) + '</td>' +
        '<td>' + escapeHtml(relationOperateMode(item) || '—') + '</td>' +
        '<td>' + escapeHtml(formatPrice(relationStandardPrice(item))) + '</td>' +
        '<td>' + escapeHtml(relationPurchaseUnit(item) || '—') + '</td>' +
        '<td>' + escapeHtml(formatPrice(item.approvedPrice)) + '</td>' +
        '<td>' + escapeHtml(item.actualPurchaseUnit || '—') + '</td>' +
        '<td>' + escapeHtml(formatQty(item.minOrderQty)) + '</td>' +
        '<td>' + escapeHtml(item.priceStatus || '—') + '</td>' +
        '<td><span class="' + sampleClass(item.sampleStatus) + '">' + escapeHtml(item.sampleStatus || '—') + '</span></td>' +
        '<td>' + (item.isPrimary ? '是' : '否') + '</td>' +
        '<td><span class="mdb-status mdb-status--' + relationStatus(item) + '">' + statusLabel(item) + '</span></td>' +
        '<td class="mdb-table__op"><div class="mdb-table__ops">' +
        '<button type="button" class="mdb-op-btn" data-supply-edit="' + item.id + '">编辑</button>' +
        '<button type="button" class="mdb-op-btn" data-supply-status="' + item.id + '">' + (relationStatus(item) === 'disabled' ? '启用' : '停用') + '</button>' +
        '<button type="button" class="mdb-op-btn mdb-op-btn--danger" data-supply-delete="' + item.id + '">删除</button>' +
        '</div></td></tr>';
    }).join('');
  }

  function renderPagination(total) {
    var totalEl = document.getElementById('supplyPaginationTotal');
    var pagesEl = document.getElementById('supplyPaginationPages');
    var gotoEl = document.getElementById('supplyPageGoto');
    var sizeEl = document.getElementById('supplyPageSize');
    var totalPages = totalPagesOf(total);
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(state.page);
    if (sizeEl && String(sizeEl.value) !== String(state.pageSize)) sizeEl.value = String(state.pageSize);
    if (!pagesEl) return;
    var page = state.page;
    var html = '<button type="button" class="product-pagination__btn" data-supply-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    for (var i = 1; i <= totalPages; i += 1) {
      html += '<button type="button" class="product-pagination__btn' + (i === page ? ' is-active' : '') + '" data-supply-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="product-pagination__btn" data-supply-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderPage() {
    var list = visibleRelations();
    clampPage(list.length);
    renderTable(list);
    renderPagination(list.length);
  }

  function optionList(values, current, placeholder) {
    var html = placeholder ? '<option value="">' + escapeHtml(placeholder) + '</option>' : '';
    values.forEach(function (value) {
      html += '<option value="' + escapeHtml(value) + '"' + (value === current ? ' selected' : '') + '>' + escapeHtml(value) + '</option>';
    });
    if (current && values.indexOf(current) < 0) {
      html += '<option value="' + escapeHtml(current) + '" selected>' + escapeHtml(current) + '</option>';
    }
    return html;
  }

  function productOptions(currentSku) {
    var html = '<option value="">请选择</option>';
    var seen = false;
    catalog().forEach(function (item) {
      if (!item.sku) return;
      if (String(item.sku) === String(currentSku || '')) seen = true;
      html += '<option value="' + escapeHtml(item.sku) + '"' + (String(item.sku) === String(currentSku || '') ? ' selected' : '') + '>' +
        escapeHtml(item.sku + '  ' + item.name) + '</option>';
    });
    if (currentSku && !seen) {
      html += '<option value="' + escapeHtml(currentSku) + '" selected>' + escapeHtml(currentSku) + '</option>';
    }
    return html;
  }

  function supplierOptions(currentId) {
    var list = supplierStore ? supplierStore.active().slice() : [];
    var current = currentId ? findSupplier(currentId) : null;
    if (current && !list.some(function (item) { return item.id === current.id; })) list.push(current);
    var html = '<option value="">请选择</option>';
    list.forEach(function (item) {
      var suffix = item.status === 'disabled' ? '（已停用）' : '';
      html += '<option value="' + escapeHtml(item.id) + '"' + (item.id === currentId ? ' selected' : '') + '>' +
        escapeHtml((item.code ? item.code + '  ' : '') + item.name + suffix) + '</option>';
    });
    return html;
  }

  function closeModal() {
    var backdrop = document.querySelector('[data-supply-modal]');
    if (backdrop) backdrop.remove();
    state.editingId = null;
  }

  function setAttr(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  }

  function applyProductPreview(product) {
    var nameEl = document.getElementById('supplyGoodsName');
    var imageEl = document.getElementById('supplyFormImage');
    var panel = document.getElementById('supplyGoodsPanel');
    if (nameEl) nameEl.textContent = product && product.name ? product.name : '请先选择货号';
    if (panel) panel.classList.toggle('is-empty', !product);
    if (imageEl) {
      imageEl.innerHTML = product ? thumbHtml(product) : '';
      imageEl.setAttribute('data-tone', product ? (product.tone || '') : '');
      imageEl.setAttribute('data-mark', product ? (product.mark || '') : '');
      imageEl.setAttribute('data-shelf', product ? (product.shelfLife || '') : '');
      imageEl.setAttribute('data-temp', product ? (product.tempLayer || '') : '');
    }
    setAttr('supplyFormSkuText', product ? product.sku : '');
    setAttr('supplyFormSpu', product ? product.spu : '');
    setAttr('supplyFormBarcode', product ? product.barcode : '');
    setAttr('supplyFormShelf', product ? formatShelf(product.shelfLife) : '');
    setAttr('supplyFormTemp', product ? formatTemp(product.tempLayer) : '');
    setAttr('supplyFormOperate', product ? product.operateMode : '');
    setAttr('supplyFormPurchase', product && product.purchasePrice != null && product.purchasePrice !== '' ? formatPrice(product.purchasePrice) : '');
    setAttr('supplyFormPurchaseUnit', product ? product.purchaseUnit : '');
    var preferred = product && product.purchaseUnit ? product.purchaseUnit : '';
    var unitSelect = document.getElementById('supplyFormActualUnit');
    var keep = unitSelect && unitSelect.value ? unitSelect.value : preferred;
    refreshActualUnitOptions(product, keep);
  }

  function syncProductPreview() {
    var skuEl = document.getElementById('supplyFormSku');
    if (!skuEl || skuEl.readOnly) return;
    applyProductPreview(findProduct(skuEl.value));
  }

  function syncSupplierPreview() {
    var supplierEl = document.getElementById('supplyFormSupplier');
    var codeEl = document.getElementById('supplyFormSupplierCode');
    if (!supplierEl || !codeEl || supplierEl.readOnly) return;
    var supplier = findSupplier(supplierEl.value);
    codeEl.value = supplier && supplier.code ? supplier.code : '';
  }

  function field(label, control, required) {
    return '<label class="mdb-field"><span>' + (required ? '<i>*</i>' : '') + label + '</span>' + control + '</label>';
  }

  function attr(label, id) {
    return '<div class="mdb-supply-attr"><span>' + label + '</span><strong id="' + id + '">—</strong></div>';
  }

  function openForm(item) {
    closeModal();
    state.editingId = item ? item.id : null;
    var editing = !!item;
    var skuControl = editing
      ? '<strong id="supplyFormSkuText">' + escapeHtml(item.sku) + '</strong>'
      : '<select id="supplyFormSku">' + productOptions('') + '</select>';
    var supplierControl = editing
      ? '<input id="supplyFormSupplier" type="text" value="' + escapeHtml(supplierName(item)) + '" readonly tabindex="-1">'
      : '<select id="supplyFormSupplier">' + supplierOptions('') + '</select>';
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-supply-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdb-modal mdb-supply-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (editing ? '编辑供货关系' : '新增供货关系') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-supply-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdb-supply-layout">' +
      '<section class="mdb-supply-section"><h3 class="mdb-supply-section__title">商品信息</h3>' +
      '<div class="mdb-supply-goods' + (editing ? '' : ' is-empty') + '" id="supplyGoodsPanel">' +
      '<div class="mdb-supply-goods__head"><span class="mdb-supply-image" id="supplyFormImage"></span>' +
      '<strong class="mdb-supply-goods__name" id="supplyGoodsName">' + (editing ? escapeHtml(item.name) : '请先选择货号') + '</strong></div>' +
      '<div class="mdb-supply-attrs">' +
      '<div class="mdb-supply-attr mdb-supply-attr--control"><span>' + (editing ? '' : '<i>*</i>') + '货号</span>' + skuControl + '</div>' +
      attr('SPU编码', 'supplyFormSpu') +
      attr('货品条码', 'supplyFormBarcode') +
      attr('保质期', 'supplyFormShelf') +
      attr('温层', 'supplyFormTemp') +
      attr('经营方式', 'supplyFormOperate') +
      attr('标准采购价', 'supplyFormPurchase') +
      attr('标准采购单位', 'supplyFormPurchaseUnit') +
      '</div></div></section>' +
      '<section class="mdb-supply-section"><h3 class="mdb-supply-section__title">供货信息</h3><div class="mdb-supply-form">' +
      field('供应商', supplierControl, true) +
      field('供应商编码', '<input id="supplyFormSupplierCode" type="text" value="' + escapeHtml(editing ? supplierCode(item) : '') + '" readonly tabindex="-1">') +
      field('采购核定价', '<input id="supplyFormApproved" type="number" min="0" step="0.01" placeholder="请输入采购核定价" value="' + escapeHtml(editing ? item.approvedPrice : '') + '">', true) +
      field('实际采购单位', '<select id="supplyFormActualUnit">' + optionList(unitsForProduct(editing ? productView(item) : null, editing ? (item.actualPurchaseUnit || '') : ''), editing ? (item.actualPurchaseUnit || '') : '', '请选择') + '</select>', true) +
      field('最小起订量', '<input id="supplyFormMinOrder" type="number" min="1" step="1" placeholder="请输入最小起订量" value="' + escapeHtml(editing && item.minOrderQty != null ? item.minOrderQty : '') + '">', true) +
      field('价格状态', '<select id="supplyFormPriceStatus">' + optionList(PRICE_STATUSES, editing ? item.priceStatus : '未核价') + '</select>', true) +
      field('样品状态', '<select id="supplyFormSample">' + optionList(SAMPLE_STATUSES, editing ? item.sampleStatus : '待检') + '</select>', true) +
      field('状态', '<select id="supplyFormStatus"><option value="active"' + ((editing ? relationStatus(item) : 'active') === 'active' ? ' selected' : '') + '>启用</option><option value="disabled"' + ((editing ? relationStatus(item) : 'active') === 'disabled' ? ' selected' : '') + '>停用</option></select>', true) +
      '<div class="mdb-field mdb-field--wide"><span>主供应商</span><label class="mdb-check"><input type="checkbox" id="supplyFormPrimary"' + (editing && item.isPrimary ? ' checked' : '') + '>设为主供应商</label></div>' +
      '</div></section></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-supply-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-supply-save>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-supply-close], [data-supply-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    backdrop.querySelector('[data-supply-save]').addEventListener('click', saveRelation);
    var skuEl = backdrop.querySelector('#supplyFormSku');
    if (skuEl && !editing) skuEl.addEventListener('change', syncProductPreview);
    var supplierEl = backdrop.querySelector('#supplyFormSupplier');
    if (supplierEl && !editing) supplierEl.addEventListener('change', syncSupplierPreview);
    document.body.appendChild(backdrop);
    applyProductPreview(editing ? productView(item) : null);
    var focusEl = document.getElementById(editing ? 'supplyFormApproved' : 'supplyFormSku');
    if (focusEl) focusEl.focus();
  }

  function readNumber(value) {
    var text = String(value == null ? '' : value).trim();
    if (!text) return null;
    var num = Number(text);
    return isFinite(num) ? num : NaN;
  }

  function pairExists(sku, supplierId, exceptId) {
    return RELATIONS.some(function (item) {
      return item.id !== exceptId && String(item.sku) === String(sku) && item.supplierId === supplierId;
    });
  }

  function saveRelation() {
    var editing = findRelation(state.editingId);
    var skuEl = document.getElementById('supplyFormSku');
    var supplierEl = document.getElementById('supplyFormSupplier');
    var approvedEl = document.getElementById('supplyFormApproved');
    var minOrderEl = document.getElementById('supplyFormMinOrder');
    var actualUnitEl = document.getElementById('supplyFormActualUnit');
    var priceStatusEl = document.getElementById('supplyFormPriceStatus');
    var sampleEl = document.getElementById('supplyFormSample');
    var statusEl = document.getElementById('supplyFormStatus');
    var primaryEl = document.getElementById('supplyFormPrimary');
    var imageEl = document.getElementById('supplyFormImage');
    var sku = editing ? editing.sku : (skuEl ? String(skuEl.value || '').trim() : '');
    var supplierId = editing ? editing.supplierId : (supplierEl ? String(supplierEl.value || '').trim() : '');
    if (!sku) {
      toast('请选择货号');
      return;
    }
    if (!supplierId) {
      toast('请选择供应商');
      return;
    }
    if (!editing && pairExists(sku, supplierId, null)) {
      toast('该货号已存在此供应商的供货关系');
      return;
    }
    var product = findProduct(sku) || (editing ? productView(editing) : null);
    var operateMode = product && product.operateMode ? String(product.operateMode).trim() : '';
    if (!operateMode) {
      toast('所选货号缺少经营方式');
      return;
    }
    var purchasePrice = product ? readNumber(product.purchasePrice) : null;
    if (purchasePrice == null || isNaN(purchasePrice) || purchasePrice < 0) {
      toast('所选货号缺少标准采购价');
      return;
    }
    var approvedPrice = readNumber(approvedEl ? approvedEl.value : '');
    if (approvedPrice == null || isNaN(approvedPrice) || approvedPrice < 0) {
      toast('请输入采购核定价');
      return;
    }
    var actualPurchaseUnit = actualUnitEl ? String(actualUnitEl.value || '').trim() : '';
    if (!actualPurchaseUnit) {
      toast('请选择实际采购单位');
      return;
    }
    var minOrderQty = readNumber(minOrderEl ? minOrderEl.value : '');
    if (minOrderQty == null || isNaN(minOrderQty) || minOrderQty < 1 || Math.floor(minOrderQty) !== minOrderQty) {
      toast('请输入最小起订量');
      return;
    }
    var priceStatus = priceStatusEl ? String(priceStatusEl.value || '').trim() : '';
    if (!priceStatus) {
      toast('请选择价格状态');
      return;
    }
    var sampleStatus = sampleEl ? String(sampleEl.value || '').trim() : '';
    if (!sampleStatus) {
      toast('请选择样品状态');
      return;
    }
    purchasePrice = Math.round(purchasePrice * 100) / 100;
    approvedPrice = Math.round(approvedPrice * 100) / 100;
    var target = editing;
    if (!target) {
      target = {
        id: store ? store.nextId() : ('r' + (RELATIONS.length + 1)),
        sku: sku,
        spu: product ? (product.spu || '') : '',
        name: product ? product.name : '',
        barcode: product ? (product.barcode || '') : '',
        shelfLife: product ? (product.shelfLife || '') : '',
        tempLayer: product ? (product.tempLayer || '') : '',
        purchaseUnit: product ? (product.purchaseUnit || '') : '',
        tone: product ? (product.tone || 'blue') : 'blue',
        mark: product ? (product.mark || (product.name || '').charAt(0) || '货') : '货',
        supplierId: supplierId
      };
      RELATIONS.push(target);
    }
    target.operateMode = operateMode;
    target.purchaseUnit = product && product.purchaseUnit ? product.purchaseUnit : (target.purchaseUnit || '');
    target.purchasePrice = purchasePrice;
    target.approvedPrice = approvedPrice;
    target.actualPurchaseUnit = actualPurchaseUnit;
    target.minOrderQty = minOrderQty;
    target.priceStatus = priceStatus;
    target.sampleStatus = sampleStatus;
    target.status = statusEl && statusEl.value === 'disabled' ? 'disabled' : 'active';
    target.isPrimary = !!(primaryEl && primaryEl.checked);
    if (imageEl && !product) {
      target.shelfLife = imageEl.getAttribute('data-shelf') || target.shelfLife || '';
      target.tempLayer = imageEl.getAttribute('data-temp') || target.tempLayer || '';
      target.tone = imageEl.getAttribute('data-tone') || target.tone || 'blue';
      target.mark = imageEl.getAttribute('data-mark') || target.mark || '货';
    }
    if (target.isPrimary) {
      RELATIONS.forEach(function (item) {
        if (item !== target && String(item.sku) === String(target.sku)) item.isPrimary = false;
      });
    }
    if (store) store.save();
    var created = !editing;
    closeModal();
    if (created) state.page = totalPagesOf(visibleRelations().length);
    renderPage();
    toast(created ? '供货关系已创建' : '供货关系已更新', 'success');
  }

  function openWarmConfirm(message, onConfirm) {
    var existing = document.querySelector('[data-product-warm-confirm]');
    if (existing) existing.remove();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-product-warm-confirm', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm"><div class="erp-modal__header"><h2 class="erp-modal__title">温馨提示</h2><div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="erp-modal-confirm__row"><div class="erp-modal-confirm__icon">!</div><div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-warm-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button></div></div>';
    function closeWarm() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeWarm(); });
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeWarm);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      closeWarm();
      if (onConfirm) onConfirm();
    });
    document.body.appendChild(backdrop);
  }

  function toggleStatus(id) {
    var item = findRelation(id);
    if (!item) return;
    var disabling = relationStatus(item) !== 'disabled';
    item.status = disabling ? 'disabled' : 'active';
    if (store) store.save();
    renderPage();
    toast(disabling ? '供货关系已停用' : '供货关系已启用', 'success');
  }

  function deleteRelation(id) {
    var item = findRelation(id);
    if (!item) return;
    openWarmConfirm('确定删除货号「' + item.sku + '」与供应商「' + supplierName(item) + '」的供货关系？', function () {
      var index = RELATIONS.indexOf(item);
      if (index >= 0) RELATIONS.splice(index, 1);
      if (store) store.save();
      renderPage();
      toast('供货关系已删除', 'success');
    });
  }

  function readQuery() {
    function valueOf(id) {
      var el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    }
    return {
      sku: valueOf('supplyQuerySku'),
      spu: valueOf('supplyQuerySpu'),
      name: valueOf('supplyQueryName'),
      barcode: valueOf('supplyQueryBarcode'),
      supplier: valueOf('supplyQuerySupplier'),
      operateMode: valueOf('supplyQueryOperate'),
      priceStatus: valueOf('supplyQueryPrice'),
      sampleStatus: valueOf('supplyQuerySample'),
      status: valueOf('supplyQueryStatus')
    };
  }

  function bindEvents() {
    var form = document.getElementById('supplyQueryForm');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        state.query = readQuery();
        state.page = 1;
        renderPage();
      });
    }
    var resetBtn = document.getElementById('supplyQueryReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        ['supplyQuerySku', 'supplyQuerySpu', 'supplyQueryName', 'supplyQueryBarcode', 'supplyQuerySupplier', 'supplyQueryOperate', 'supplyQueryPrice', 'supplyQuerySample', 'supplyQueryStatus'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        state.query = { sku: '', spu: '', name: '', barcode: '', supplier: '', operateMode: '', priceStatus: '', sampleStatus: '', status: '' };
        state.page = 1;
        renderPage();
      });
    }
    var addBtn = document.getElementById('supplyAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
    var table = document.getElementById('supplyTableBody');
    if (table) {
      table.addEventListener('click', function (ev) {
        var editBtn = ev.target.closest('[data-supply-edit]');
        if (editBtn) {
          openForm(findRelation(editBtn.getAttribute('data-supply-edit')));
          return;
        }
        var statusBtn = ev.target.closest('[data-supply-status]');
        if (statusBtn) {
          toggleStatus(statusBtn.getAttribute('data-supply-status'));
          return;
        }
        var deleteBtn = ev.target.closest('[data-supply-delete]');
        if (deleteBtn) deleteRelation(deleteBtn.getAttribute('data-supply-delete'));
      });
    }
    var pages = document.getElementById('supplyPaginationPages');
    if (pages) {
      pages.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-supply-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-supply-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderPage();
      });
    }
    var sizeEl = document.getElementById('supplyPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        state.page = 1;
        renderPage();
      });
    }
    var gotoEl = document.getElementById('supplyPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('change', function () {
        var total = visibleRelations().length;
        var max = totalPagesOf(total);
        var val = parseInt(gotoEl.value, 10);
        if (!val || val < 1) val = 1;
        if (val > max) val = max;
        state.page = val;
        renderPage();
      });
    }
  }

  function init() {
    RELATIONS = store ? store.all() : [];
    bindEvents();
    renderPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
