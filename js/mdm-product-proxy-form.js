/**
 * 代采商品列表 — 添加/编辑商品（完整表单）
 */
(function () {
  var pickerInstance = null;
  var formState = null;

  var SKU_STATUS_OPTIONS = ['现货', '预售', '缺货'];
  var SALE_UNIT_OPTIONS = ['件', '箱', '瓶', '袋', 'kg', 'L', '罐', '包', '套', '卷', '个', '斤', '盒'];
  var ETA_COUNTDOWN_UNITS = ['天', '小时'];
  var DELIVERY_MODE_OPTIONS = [
    { value: 'platform', label: '平台配送' },
    { value: 'express', label: '快递到店' }
  ];

  function normalizeDeliveryMode(mode) {
    if (mode === 'platform' || mode === '平台配送' || mode === 'warehouse') return 'platform';
    if (mode === 'express' || mode === '快递到店' || mode === 'store') return 'express';
    return 'platform';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function closeModal() {
    var modal = document.querySelector('[data-proxy-product-form]');
    if (modal) modal.remove();
    pickerInstance = null;
    formState = null;
  }

  function getProductCategoryIds(product) {
    if (Array.isArray(product.category_l3_ids) && product.category_l3_ids.length) {
      return product.category_l3_ids.slice();
    }
    if (product.category_l3_id) return [product.category_l3_id];
    return [];
  }

  function getProductCategoryPaths(product) {
    if (Array.isArray(product.category_paths) && product.category_paths.length) {
      return product.category_paths.slice();
    }
    if (product.category_path) return [product.category_path];
    if (product.category) return [product.category];
    return [];
  }

  function defaultSku(id, product, index) {
    var specs = ['2.5kg', '500g', '1kg', '12箱', '1'];
    var names = ['2.5kg装', '500g装', '1kg装', '箱装', '标准装'];
    return {
      id: id,
      displayName: names[index] || ('规格' + (index + 1)),
      internalCode: (product.code || 'SPU') + '-' + String(index + 1).padStart(2, '0'),
      specValue: specs[index] || '1',
      baseUnit: '个',
      purchasePrice: index === 0 ? '12.50' : '8.00',
      stockStatus: '1',
      saleUnit: '个',
      skuStatus: '现货',
      salePrice: index === 0 ? String(product.priceMoney || '0.01') : '0.01',
      linePrice: product.linePrice != null ? String(product.linePrice) : '',
      minQty: '1',
      img: product.img || '../user-app/assets/restock/product-leaf.svg',
      isDefault: index === 0,
      onShelf: true
    };
  }

  function buildSkuPool(product) {
    var count = Math.max(5, product.specCount || 1);
    var pool = [];
    for (var i = 0; i < count; i++) {
      var id = (product.code || 'SPU') + '-sku-' + (i + 1);
      pool.push(defaultSku(id, product, i));
    }
    return pool;
  }

  function normalizeDetail(product) {
    var detail = product.detail || {};
    var pool = buildSkuPool(product);
    var poolMap = {};
    pool.forEach(function (s) { poolMap[s.id] = s; });

    var savedSkus = detail.skus || {};
    pool.forEach(function (s) {
      if (savedSkus[s.id]) {
        Object.assign(s, savedSkus[s.id], { id: s.id });
      }
    });

    var selectedIds = Array.isArray(detail.selectedSkuIds) && detail.selectedSkuIds.length
      ? detail.selectedSkuIds.filter(function (id) { return poolMap[id]; })
      : pool.slice(0, Math.max(1, product.specCount || 1)).map(function (s) { return s.id; });

    if (!selectedIds.length) {
      selectedIds = [pool[0].id];
    }

    var hasDefault = selectedIds.some(function (id) {
      return poolMap[id] && poolMap[id].isDefault;
    });
    if (!hasDefault) {
      poolMap[selectedIds[0]].isDefault = true;
    }

    var result = {
      summary: detail.summary || '',
      displaySales: detail.displaySales != null ? String(detail.displaySales) : (detail.summary || ''),
      textDesc: detail.textDesc || '',
      etaCountdown: detail.etaCountdown != null
        ? String(detail.etaCountdown)
        : (product.etaCountdown != null ? String(product.etaCountdown) : ''),
      etaCountdownUnit: detail.etaCountdownUnit || product.etaCountdownUnit || '天',
      deliveryMode: normalizeDeliveryMode(
        detail.deliveryMode || product.deliveryMode || product.fulfillmentMode
      ),
      saleScope: detail.saleScope || 'all',
      saleRegions: detail.saleRegions ? cloneRegionSelected(detail.saleRegions) : {},
      saleRegionSummary: Array.isArray(detail.saleRegionSummary) ? detail.saleRegionSummary.slice() : [],
      saleStores: detail.saleStores ? cloneStoreSelected(detail.saleStores) : {},
      images: Array.isArray(detail.images) && detail.images.length
        ? detail.images.slice()
        : (product.img ? [product.img] : []),
      detailHtml: detail.detailHtml || '',
      skuPool: pool,
      selectedSkuIds: selectedIds
    };
    if (!result.saleRegionSummary.length && Object.keys(result.saleRegions).length && window.MdmProxyRegionPicker) {
      result.saleRegionSummary = window.MdmProxyRegionPicker.summarize(result.saleRegions);
    }
    return result;
  }

  function getTagOptions() {
    if (window.MdmProxyTagStore) {
      return window.MdmProxyTagStore.getAll().map(function (t) { return t.name; });
    }
    return ['冷丰溯源', '冷丰优选', '牛牛专用', '蔬菜水果', '优选商品', '天天平价'];
  }

  function cloneRegionSelected(map) {
    if (window.MdmProxyRegionPicker) return window.MdmProxyRegionPicker.cloneSelected(map);
    var out = {};
    Object.keys(map || {}).forEach(function (k) { out[k] = true; });
    return out;
  }

  function cloneStoreSelected(map) {
    if (window.MdmProxyStorePicker) return window.MdmProxyStorePicker.cloneSelected(map);
    var out = {};
    Object.keys(map || {}).forEach(function (k) { out[k] = true; });
    return out;
  }

  function getSaleStoreCount(state) {
    if (window.MdmProxyStorePicker) return window.MdmProxyStorePicker.count(state.saleStores || {});
    return Object.keys(state.saleStores || {}).length;
  }

  function renderSaleRegionSummary(state) {
    if (!state.saleRegionSummary || !state.saleRegionSummary.length) return '';
    return state.saleRegionSummary.map(function (item) {
      return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label) + '</span>';
    }).join('');
  }

  function renderSaleScopeSection(state) {
    var isRegion = state.saleScope === 'region';
    var isStore = state.saleScope === 'store';
    var storeCount = getSaleStoreCount(state);
    return (
      '<section class="product-proxy-form__section">' +
      '  <h3 class="product-proxy-form__section-title">售卖范围</h3>' +
      '  <div class="product-proxy-form__field product-proxy-form__field--inline product-proxy-sale-scope__type">' +
      '    <span class="product-proxy-form__label product-proxy-form__label--inline">范围类型</span>' +
      '    <div class="product-add-radio-row">' +
      '      <label class="product-add-radio"><input type="radio" name="proxySaleScope" value="all"' + (state.saleScope === 'all' ? ' checked' : '') + '> 全部</label>' +
      '      <label class="product-add-radio"><input type="radio" name="proxySaleScope" value="region"' + (state.saleScope === 'region' ? ' checked' : '') + '> 省市区</label>' +
      '      <label class="product-add-radio"><input type="radio" name="proxySaleScope" value="store"' + (state.saleScope === 'store' ? ' checked' : '') + '> 门店</label>' +
      '    </div>' +
      '  </div>' +
      '  <div class="product-proxy-sale-scope__region" id="proxySaleScopeRegion"' + (isRegion ? '' : ' hidden') + '>' +
      '    <div class="product-proxy-sale-scope__alert">' +
      '      <span class="product-proxy-sale-scope__alert-icon">i</span>' +
      '      <span class="product-proxy-sale-scope__alert-text">支持按省 / 市 / 区配置售卖范围，可勾选整省、整市或具体区县</span>' +
      '    </div>' +
      '    <button type="button" class="product-proxy-sale-scope__pick" id="proxySaleScopePickBtn">+ 选择区域</button>' +
      '    <div class="product-proxy-sale-scope__tags" id="proxySaleScopeTags">' + renderSaleRegionSummary(state) + '</div>' +
      '  </div>' +
      '  <div class="product-proxy-sale-scope__store" id="proxySaleScopeStore"' + (isStore ? '' : ' hidden') + '>' +
      '    <button type="button" class="product-proxy-sale-scope__pick" id="proxySaleScopeStorePickBtn">+ 选择门店</button>' +
      '    <p class="product-proxy-sale-scope__store-count" id="proxySaleScopeStoreCount"' + (storeCount ? '' : ' hidden') + '>已选择 ' + storeCount + ' 个门店</p>' +
      '  </div>' +
      '</section>'
    );
  }

  function editorToolbarHtml() {
    var btns = ['正文', 'B', 'I', 'U', 'S', 'A', 'A', '清除', '|', '≡', '1.', '"', '←', '→', '🔗', '🖼', '▶'];
    return btns.map(function (b) {
      if (b === '|') return '<span class="product-add-editor__divider"></span>';
      return '<button type="button" class="product-add-editor__btn" tabindex="-1">' + b + '</button>';
    }).join('');
  }

  function renderSpecPanel(sku, index) {
    var statusOptions = SKU_STATUS_OPTIONS.map(function (opt) {
      return '<option value="' + opt + '"' + (sku.skuStatus === opt ? ' selected' : '') + '>' + opt + '</option>';
    }).join('');
    var saleUnit = SALE_UNIT_OPTIONS.indexOf(sku.saleUnit) >= 0 ? sku.saleUnit : SALE_UNIT_OPTIONS[0];
    var saleUnitOptions = SALE_UNIT_OPTIONS.map(function (opt) {
      return '<option value="' + escapeHtml(opt) + '"' + (saleUnit === opt ? ' selected' : '') + '>' + escapeHtml(opt) + '</option>';
    }).join('');

    return (
      '<article class="product-proxy-spec" data-sku-id="' + escapeHtml(sku.id) + '">' +
      '  <div class="product-proxy-spec__head">' +
      '    <span class="product-proxy-spec__head-label">展示规格名称</span>' +
      '    <input type="text" class="product-proxy-spec__head-input" data-field="displayName" value="' + escapeHtml(sku.displayName) + '">' +
      (sku.isDefault ? '<span class="product-proxy-spec__default-tag">默认</span>' : '') +
      '  </div>' +
      '  <div class="product-proxy-spec__body">' +
      '    <div class="product-proxy-spec__thumb">' +
      '      <img src="' + escapeHtml(sku.img) + '" alt="">' +
      '    </div>' +
      '    <div class="product-proxy-spec__grid">' +
      renderSpecField('商品条形码', 'internalCode', sku.internalCode) +
      renderSpecField('规格值', 'specValue', sku.specValue) +
      renderSpecField('基础单位', 'baseUnit', sku.baseUnit) +
      renderMoneyField('采购价', 'purchasePrice', sku.purchasePrice) +
      renderSpecField('售卖系数', 'stockStatus', sku.stockStatus) +
      '      <div class="product-proxy-spec__field">' +
      '        <label class="product-proxy-spec__label">售卖单位</label>' +
      '        <select class="product-proxy-spec__input" data-field="saleUnit">' + saleUnitOptions + '</select>' +
      '      </div>' +
      '      <div class="product-proxy-spec__field">' +
      '        <label class="product-proxy-spec__label">SKU状态</label>' +
      '        <select class="product-proxy-spec__input" data-field="skuStatus">' + statusOptions + '</select>' +
      '      </div>' +
      renderMoneyField('售价', 'salePrice', sku.salePrice) +
      renderMoneyField('划线价', 'linePrice', sku.linePrice) +
      renderSpecField('起售量', 'minQty', sku.minQty) +
      '    </div>' +
      '  </div>' +
      '  <div class="product-proxy-spec__foot">' +
      '    <button type="button" class="product-proxy-spec__btn-default" data-action="set-default"' + (sku.isDefault ? ' disabled' : '') + '>设为默认</button>' +
      '    <button type="button" class="product-proxy-spec__btn-off' + (sku.onShelf === false ? ' is-off' : '') + '" data-action="toggle-shelf">' +
      (sku.onShelf === false ? '上架' : '下架') +
      '    </button>' +
      '  </div>' +
      '</article>'
    );
  }

  function renderSpecField(label, field, value) {
    return (
      '<div class="product-proxy-spec__field">' +
      '  <label class="product-proxy-spec__label">' + label + '</label>' +
      '  <input type="text" class="product-proxy-spec__input" data-field="' + field + '" value="' + escapeHtml(value) + '">' +
      '</div>'
    );
  }

  function renderMoneyField(label, field, value) {
    return (
      '<div class="product-proxy-spec__field">' +
      '  <label class="product-proxy-spec__label">' + label + '</label>' +
      '  <div class="product-proxy-spec__money">' +
      '    <span class="product-proxy-spec__money-prefix">¥</span>' +
      '    <input type="text" class="product-proxy-spec__input product-proxy-spec__input--money" data-field="' + field + '" value="' + escapeHtml(value) + '">' +
      '  </div>' +
      '</div>'
    );
  }

  function renderSkuPanels(state) {
    var poolMap = {};
    state.skuPool.forEach(function (s) { poolMap[s.id] = s; });
    var selected = state.selectedSkuIds.map(function (id) { return poolMap[id]; }).filter(Boolean);
    return selected.map(function (sku, idx) { return renderSpecPanel(sku, idx); }).join('');
  }

  function renderSkuSelectorLabel(state) {
    return '已选 ' + state.selectedSkuIds.length + ' 个 SKU';
  }

  function renderImages(images) {
    var html = images.map(function (src, idx) {
      return (
        '<div class="product-proxy-form__img-item" data-img-index="' + idx + '">' +
        '  <img src="' + escapeHtml(src) + '" alt="">' +
        '  <button type="button" class="product-proxy-form__img-remove" data-action="remove-image" data-index="' + idx + '" aria-label="删除">&times;</button>' +
        '</div>'
      );
    }).join('');
    return html + '<button type="button" class="product-add-upload__box" data-action="add-image"><span class="product-add-upload__plus">+</span></button>';
  }

  function buildFormHtml(product, state, isEdit) {
    var tagOptions = getTagOptions();
    var tagSelect = tagOptions.map(function (name) {
      var sel = product.tag === name ? ' selected' : '';
      return '<option value="' + escapeHtml(name) + '"' + sel + '>' + escapeHtml(name) + '</option>';
    }).join('');

    var skuDropdown = state.skuPool.map(function (sku) {
      var checked = state.selectedSkuIds.indexOf(sku.id) >= 0 ? ' checked' : '';
      return (
        '<label class="product-proxy-form__sku-option">' +
        '  <input type="checkbox" data-sku-id="' + escapeHtml(sku.id) + '"' + checked + '>' +
        '  <span>' + escapeHtml(sku.displayName) + '（' + escapeHtml(sku.specValue) + '）</span>' +
        '</label>'
      );
    }).join('');

    return (
      '<div class="erp-modal product-proxy-form-modal product-proxy-form-modal--landscape">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' + (isEdit ? '编辑商品' : '添加商品') + '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-form-fullscreen aria-label="全屏" title="全屏">&#9723;</button>' +
      '      <button type="button" class="erp-modal__header-btn" data-form-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body product-proxy-form__body">' +
      '    <section class="product-proxy-form__section">' +
      '      <h3 class="product-proxy-form__section-title">基础信息</h3>' +
      '      <div class="product-proxy-form__grid product-proxy-form__grid--2">' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormName"><span class="product-proxy-form__req">*</span>商品名称</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <input class="product-proxy-form__input" id="proxyFormName" type="text" value="' + escapeHtml(product.name || '') + '" placeholder="请输入商品名称">' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field product-proxy-form__field--category">' +
      '          <label class="product-proxy-form__label">商品类目</label>' +
      '          <div class="product-proxy-form__control" id="proxyFormCategoryPicker"></div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormEta">预计到店时间</label>' +
      '          <div class="product-proxy-form__control product-proxy-form__eta">' +
      '            <input class="product-proxy-form__input product-proxy-form__eta-input" id="proxyFormEta" type="text" inputmode="numeric" value="' + escapeHtml(state.etaCountdown) + '" placeholder="请输入预计到店时间">' +
      '            <select class="product-proxy-form__input product-proxy-form__eta-unit" id="proxyFormEtaUnit" aria-label="倒计时单位">' +
      ETA_COUNTDOWN_UNITS.map(function (u) {
        return '<option value="' + escapeHtml(u) + '"' + (state.etaCountdownUnit === u ? ' selected' : '') + '>' + escapeHtml(u) + '</option>';
      }).join('') +
      '            </select>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label">配送方式</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <div class="product-add-radio-row">' +
      DELIVERY_MODE_OPTIONS.map(function (opt) {
        return (
          '<label class="product-add-radio' + (state.deliveryMode === opt.value ? ' is-checked' : '') + '">' +
          '<input type="radio" name="proxyDeliveryMode" value="' + opt.value + '"' +
          (state.deliveryMode === opt.value ? ' checked' : '') + '> ' + opt.label +
          '</label>'
        );
      }).join('') +
      '            </div>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormTag">商品标签</label>' +
      '          <div class="product-proxy-form__control product-proxy-form__tag-select">' +
      '            <select class="product-proxy-form__input" id="proxyFormTag">' +
      '              <option value="">请选择商品标签</option>' + tagSelect +
      '            </select>' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field">' +
      '          <label class="product-proxy-form__label" for="proxyFormDisplaySales">展示销量</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <input class="product-proxy-form__input" id="proxyFormDisplaySales" type="text" value="' + escapeHtml(state.displaySales) + '" placeholder="请输入展示销量">' +
      '          </div>' +
      '        </div>' +
      '        <div class="product-proxy-form__field product-proxy-form__field--full">' +
      '          <label class="product-proxy-form__label" for="proxyFormTextDesc">文字描述</label>' +
      '          <div class="product-proxy-form__control">' +
      '            <textarea class="product-proxy-form__textarea" id="proxyFormTextDesc" rows="3" placeholder="请输入商品文字描述">' + escapeHtml(state.textDesc) + '</textarea>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '    </section>' +
      renderSaleScopeSection(state) +
      '    <section class="product-proxy-form__section">' +
      '      <h3 class="product-proxy-form__section-title">售卖规格配置</h3>' +
      '      <div class="product-proxy-form__sku-bar">' +
      '        <label class="product-proxy-form__label product-proxy-form__label--inline">选择 SKU</label>' +
      '        <div class="product-proxy-form__sku-picker" id="proxyFormSkuPicker">' +
      '          <button type="button" class="product-proxy-form__sku-trigger" id="proxyFormSkuTrigger">' + renderSkuSelectorLabel(state) + ' <span class="product-proxy-form__sku-caret">▼</span></button>' +
      '          <div class="product-proxy-form__sku-dropdown" id="proxyFormSkuDropdown" hidden>' + skuDropdown + '</div>' +
      '        </div>' +
      '      </div>' +
      '      <div class="product-proxy-form__spec-list" id="proxyFormSpecList">' + renderSkuPanels(state) + '</div>' +
      '    </section>' +
      '    <section class="product-proxy-form__section">' +
      '      <h3 class="product-proxy-form__section-title">媒体与详情</h3>' +
      '      <div class="product-proxy-form__field product-proxy-form__field--media">' +
      '        <label class="product-proxy-form__label">商品图片</label>' +
      '        <div class="product-proxy-form__control">' +
      '          <p class="product-proxy-form__hint">发布一波上市的新品图片，支持 JPG/PNG/GIF/WEBP 格式，单张小于 5MB；建议 1 个 MP4 视频小于 10MB</p>' +
      '          <div class="product-proxy-form__images" id="proxyFormImages">' + renderImages(state.images) + '</div>' +
      '          <input type="file" id="proxyFormImageInput" accept="image/*" hidden>' +
      '        </div>' +
      '      </div>' +
      '      <div class="product-proxy-form__field product-proxy-form__field--media">' +
      '        <label class="product-proxy-form__label">商品详情</label>' +
      '        <div class="product-proxy-form__control">' +
      '          <div class="product-add-editor">' +
      '            <div class="product-add-editor__toolbar">' + editorToolbarHtml() + '</div>' +
      '            <div class="product-add-editor__body" id="proxyFormDetailEditor" contenteditable="true" data-placeholder="请输入商品详情，支持图片、文字、连接描述">' +
      (state.detailHtml || '') +
      '            </div>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '    </section>' +
      '  </div>' +
      '  <div class="erp-modal__footer product-proxy-form__footer">' +
      '    <p class="product-proxy-form__footer-tip">编辑内容可能丢失，不会影响中数据</p>' +
      '    <div class="product-proxy-form__footer-actions">' +
      '      <button type="button" class="erp-btn" data-form-cancel>取消</button>' +
      '      <button type="button" class="erp-btn erp-btn--primary" data-form-save>保存</button>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  function refreshSpecList(backdrop) {
    var listEl = backdrop.querySelector('#proxyFormSpecList');
    var triggerEl = backdrop.querySelector('#proxyFormSkuTrigger');
    if (listEl) listEl.innerHTML = renderSkuPanels(formState);
    if (triggerEl) {
      triggerEl.innerHTML = renderSkuSelectorLabel(formState) + ' <span class="product-proxy-form__sku-caret">▼</span>';
    }
    bindSpecEvents(backdrop);
  }

  function refreshImages(backdrop) {
    var wrap = backdrop.querySelector('#proxyFormImages');
    if (!wrap) return;
    wrap.innerHTML = renderImages(formState.images);
    bindImageEvents(backdrop);
  }

  function readSpecPanelsFromDom(backdrop) {
    var poolMap = {};
    formState.skuPool.forEach(function (s) { poolMap[s.id] = s; });

    backdrop.querySelectorAll('.product-proxy-spec').forEach(function (panel) {
      var id = panel.getAttribute('data-sku-id');
      var sku = poolMap[id];
      if (!sku) return;
      panel.querySelectorAll('[data-field]').forEach(function (input) {
        sku[input.getAttribute('data-field')] = input.value;
      });
    });
    formState.skuPool = formState.skuPool.map(function (s) { return poolMap[s.id] || s; });
  }

  function bindSpecEvents(backdrop) {
    backdrop.querySelectorAll('.product-proxy-spec [data-action="set-default"]').forEach(function (btn) {
      btn.onclick = function () {
        readSpecPanelsFromDom(backdrop);
        var panel = btn.closest('.product-proxy-spec');
        var id = panel.getAttribute('data-sku-id');
        formState.skuPool.forEach(function (s) { s.isDefault = s.id === id; });
        refreshSpecList(backdrop);
      };
    });

    backdrop.querySelectorAll('.product-proxy-spec [data-action="toggle-shelf"]').forEach(function (btn) {
      btn.onclick = function () {
        readSpecPanelsFromDom(backdrop);
        var panel = btn.closest('.product-proxy-spec');
        var id = panel.getAttribute('data-sku-id');
        formState.skuPool.forEach(function (s) {
          if (s.id === id) s.onShelf = s.onShelf === false;
        });
        refreshSpecList(backdrop);
      };
    });
  }

  function bindImageEvents(backdrop) {
    var input = backdrop.querySelector('#proxyFormImageInput');
    var addBtn = backdrop.querySelector('[data-action="add-image"]');
    if (addBtn && input) {
      addBtn.onclick = function () { input.click(); };
      input.onchange = function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          formState.images.push(reader.result);
          refreshImages(backdrop);
        };
        reader.readAsDataURL(file);
        input.value = '';
      };
    }

    backdrop.querySelectorAll('[data-action="remove-image"]').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        formState.images.splice(idx, 1);
        refreshImages(backdrop);
      };
    });
  }

  function bindSkuPicker(backdrop) {
    var trigger = backdrop.querySelector('#proxyFormSkuTrigger');
    var dropdown = backdrop.querySelector('#proxyFormSkuDropdown');
    if (!trigger || !dropdown) return;

    trigger.onclick = function (e) {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    };

    dropdown.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) {
      checkbox.onchange = function () {
        readSpecPanelsFromDom(backdrop);
        var id = checkbox.getAttribute('data-sku-id');
        if (checkbox.checked) {
          if (formState.selectedSkuIds.indexOf(id) < 0) {
            formState.selectedSkuIds.push(id);
          }
        } else {
          if (formState.selectedSkuIds.length <= 1) {
            checkbox.checked = true;
            if (typeof showToast === 'function') showToast('至少保留 1 个 SKU', 'warning');
            return;
          }
          formState.selectedSkuIds = formState.selectedSkuIds.filter(function (sid) { return sid !== id; });
        }
        refreshSpecList(backdrop);
        trigger.innerHTML = renderSkuSelectorLabel(formState) + ' <span class="product-proxy-form__sku-caret">▼</span>';
      };
    });

    document.addEventListener('click', function closeSkuDropdown(e) {
      if (!backdrop.isConnected) {
        document.removeEventListener('click', closeSkuDropdown);
        return;
      }
      if (!e.target.closest('#proxyFormSkuPicker')) {
        dropdown.hidden = true;
      }
    });
  }

  function bindSaleScopeEvents(backdrop) {
    var regionPanel = backdrop.querySelector('#proxySaleScopeRegion');
    var storePanel = backdrop.querySelector('#proxySaleScopeStore');
    var tagsEl = backdrop.querySelector('#proxySaleScopeTags');
    var pickBtn = backdrop.querySelector('#proxySaleScopePickBtn');
    var storePickBtn = backdrop.querySelector('#proxySaleScopeStorePickBtn');
    var storeCountEl = backdrop.querySelector('#proxySaleScopeStoreCount');

    function refreshRegionTags() {
      if (!tagsEl) return;
      tagsEl.innerHTML = renderSaleRegionSummary(formState);
    }

    function refreshStoreCount() {
      if (!storeCountEl) return;
      var count = getSaleStoreCount(formState);
      storeCountEl.textContent = '已选择 ' + count + ' 个门店';
      storeCountEl.hidden = !count;
    }

    function syncScopePanelsVisible() {
      var scopeEl = backdrop.querySelector('input[name="proxySaleScope"]:checked');
      var isRegion = scopeEl && scopeEl.value === 'region';
      var isStore = scopeEl && scopeEl.value === 'store';
      if (regionPanel) regionPanel.hidden = !isRegion;
      if (storePanel) storePanel.hidden = !isStore;
      if (scopeEl) formState.saleScope = scopeEl.value;
    }

    backdrop.querySelectorAll('input[name="proxySaleScope"]').forEach(function (radio) {
      radio.addEventListener('change', syncScopePanelsVisible);
    });

    if (pickBtn) {
      pickBtn.addEventListener('click', function () {
        if (!window.MdmProxyRegionPicker) {
          if (typeof showToast === 'function') showToast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: formState.saleRegions,
          onConfirm: function (selected, summary) {
            formState.saleRegions = selected;
            formState.saleRegionSummary = summary;
            refreshRegionTags();
          }
        });
      });
    }

    if (storePickBtn) {
      storePickBtn.addEventListener('click', function () {
        if (!window.MdmProxyStorePicker) {
          if (typeof showToast === 'function') showToast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: formState.saleStores,
          onConfirm: function (selected) {
            formState.saleStores = selected;
            refreshStoreCount();
          }
        });
      });
    }
  }

  function collectPayload(backdrop, product) {
    readSpecPanelsFromDom(backdrop);

    var poolMap = {};
    formState.skuPool.forEach(function (s) { poolMap[s.id] = s; });
    var skus = {};
    formState.selectedSkuIds.forEach(function (id) {
      if (poolMap[id]) skus[id] = Object.assign({}, poolMap[id]);
    });

    var defaultSku = formState.skuPool.find(function (s) { return s.isDefault; }) ||
      poolMap[formState.selectedSkuIds[0]];

    var scopeEl = backdrop.querySelector('input[name="proxySaleScope"]:checked');
    var deliveryEl = backdrop.querySelector('input[name="proxyDeliveryMode"]:checked');
    var detailEditor = backdrop.querySelector('#proxyFormDetailEditor');
    var deliveryMode = normalizeDeliveryMode(deliveryEl ? deliveryEl.value : formState.deliveryMode);
    var etaCountdown = ((backdrop.querySelector('#proxyFormEta') || {}).value || '').trim();
    var etaCountdownUnit = ((backdrop.querySelector('#proxyFormEtaUnit') || {}).value || '天').trim() || '天';

    return {
      name: (backdrop.querySelector('#proxyFormName') || {}).value.trim(),
      tag: (backdrop.querySelector('#proxyFormTag') || {}).value,
      etaCountdown: etaCountdown,
      etaCountdownUnit: etaCountdownUnit,
      deliveryMode: deliveryMode,
      fulfillmentMode: deliveryMode,
      category_l3_ids: pickerInstance ? pickerInstance.getValues() : getProductCategoryIds(product),
      category_paths: pickerInstance ? pickerInstance.getPaths() : getProductCategoryPaths(product),
      category_l3_id: pickerInstance ? pickerInstance.getValue() : (product.category_l3_id || ''),
      category_path: pickerInstance ? pickerInstance.getPath() : (product.category_path || product.category || ''),
      category: pickerInstance ? pickerInstance.getPaths().join('、') : (product.category || product.category_path || ''),
      img: formState.images[0] || product.img,
      specCount: formState.selectedSkuIds.length,
      spec: defaultSku ? defaultSku.specValue : product.spec,
      priceMoney: defaultSku ? parseFloat(defaultSku.salePrice) || 0.01 : product.priceMoney,
      linePrice: defaultSku && defaultSku.linePrice ? parseFloat(defaultSku.linePrice) : null,
      detail: {
        summary: (backdrop.querySelector('#proxyFormDisplaySales') || {}).value.trim(),
        displaySales: (backdrop.querySelector('#proxyFormDisplaySales') || {}).value.trim(),
        textDesc: (backdrop.querySelector('#proxyFormTextDesc') || {}).value.trim(),
        etaCountdown: etaCountdown,
        etaCountdownUnit: etaCountdownUnit,
        deliveryMode: deliveryMode,
        saleScope: scopeEl ? scopeEl.value : 'all',
        saleRegions: cloneRegionSelected(formState.saleRegions),
        saleRegionSummary: (formState.saleRegionSummary || []).slice(),
        saleStores: cloneStoreSelected(formState.saleStores),
        images: formState.images.slice(),
        detailHtml: detailEditor ? detailEditor.innerHTML : '',
        selectedSkuIds: formState.selectedSkuIds.slice(),
        skus: skus
      },
      detailEdited: true
    };
  }

  function openProxyProductForm(options) {
    var store = window.MdmProxyCategoryStore;
    if (!store) return;

    options = options || {};
    var isEdit = options.mode === 'edit';
    var product = options.product || {};
    var onSave = options.onSave;

    closeModal();
    formState = normalizeDetail(product);

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-proxy-form-backdrop';
    backdrop.setAttribute('data-proxy-product-form', '1');
    backdrop.innerHTML = buildFormHtml(product, formState, isEdit);

    var modal = backdrop.querySelector('.product-proxy-form-modal');
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeModal(); });
    backdrop.querySelectorAll('[data-form-close], [data-form-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    var fsBtn = backdrop.querySelector('[data-form-fullscreen]');
    if (fsBtn && modal) {
      fsBtn.addEventListener('click', function () {
        var on = modal.classList.toggle('erp-modal--fullscreen');
        fsBtn.title = on ? '退出全屏' : '全屏';
      });
    }

    backdrop.querySelector('[data-form-save]').addEventListener('click', function () {
      var payload = collectPayload(backdrop, product);
      if (!payload.name) {
        if (typeof showToast === 'function') showToast('请输入商品名称', 'warning');
        return;
      }
      if (!payload.category_l3_ids.length || !payload.category_l3_ids.every(function (id) {
        return store.isSelectableL3(id);
      })) {
        if (typeof showToast === 'function') showToast('请至少选择一个已上架的三级类目', 'warning');
        return;
      }
      if (payload.detail.saleScope === 'region') {
        var regionCount = Object.keys(formState.saleRegions || {}).length;
        if (!regionCount) {
          if (typeof showToast === 'function') showToast('请选择售卖区域', 'warning');
          return;
        }
      }
      if (payload.detail.saleScope === 'store') {
        var storeCount = Object.keys(formState.saleStores || {}).length;
        if (!storeCount) {
          if (typeof showToast === 'function') showToast('请选择售卖门店', 'warning');
          return;
        }
      }
      if (typeof onSave === 'function') onSave(payload, product);
      closeModal();
    });

    document.body.appendChild(backdrop);

    var pickerEl = backdrop.querySelector('#proxyFormCategoryPicker');
    if (pickerEl && window.MdmProxyCategoryPicker) {
      pickerInstance = window.MdmProxyCategoryPicker.mount({
        container: pickerEl,
        values: getProductCategoryIds(product),
        onChange: function () {}
      });
    }

    bindSpecEvents(backdrop);
    bindImageEvents(backdrop);
    bindSkuPicker(backdrop);
    bindSaleScopeEvents(backdrop);

    var nameInput = backdrop.querySelector('#proxyFormName');
    if (nameInput) nameInput.focus();
  }

  window.MdmProxyProductForm = {
    open: openProxyProductForm,
    close: closeModal
  };
})();
