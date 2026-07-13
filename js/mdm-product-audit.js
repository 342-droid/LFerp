/**
 * 选品库 — 商品详情审核页
 */
(function () {
  var wp = window.wmsPath || { page: function (f) { return f; } };
  var productCode = '';
  var productData = null;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function getQueryCode() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('code') || '').trim();
  }

  function getQueryMode() {
    return new URLSearchParams(window.location.search).get('mode') === 'audit' ? 'audit' : 'view';
  }

  function syncHeaderActions(data) {
    var showAudit = getQueryMode() === 'audit' && data && data.audit === 'pending';
    var passBtn = document.getElementById('productAuditPassBtn');
    var rejectBtn = document.getElementById('productAuditRejectBtn');
    if (passBtn) passBtn.hidden = !showAudit;
    if (rejectBtn) rejectBtn.hidden = !showAudit;
  }

  function fieldWrap(id, label, required, inner, extraClass, hint) {
    return (
      '<div class="product-add-field' + (extraClass ? ' ' + extraClass : '') + '" data-field="' + id + '">' +
      '  <label class="product-add-field__label">' +
      (required ? '<span class="product-add-field__req">*</span>' : '') +
      label +
      '  </label>' +
      inner +
      (hint || '') +
      '  <p class="product-add-field__error" data-field-error hidden></p>' +
      '</div>'
    );
  }

  function fieldViewCheckbox(name, label, required, options, selectedValues) {
    var selectedSet = {};
    (selectedValues || []).forEach(function (v) { selectedSet[v] = true; });
    var boxes = (options || [])
      .map(function (opt) {
        var checked = !!selectedSet[opt.value];
        return (
          '<label class="product-add-checkbox">' +
          '<input type="checkbox" name="' + name + '" value="' + opt.value + '"' +
          (checked ? ' checked' : '') +
          ' disabled> ' + opt.label +
          '</label>'
        );
      })
      .join('');
    return fieldWrap(name, label, required, '<div class="product-add-checkbox-row">' + boxes + '</div>');
  }

  function fieldViewRadio(name, label, required, options, selected) {
    var radios = (options || [])
      .map(function (opt) {
        var checked = opt.value === selected;
        return (
          '<label class="product-add-radio">' +
          '<input type="radio" name="' + name + '" value="' + opt.value + '"' +
          (checked ? ' checked' : '') +
          (opt.disabled ? ' disabled' : '') +
          ' disabled> ' + opt.label +
          '</label>'
        );
      })
      .join('');
    return fieldWrap(name, label, required, '<div class="product-add-radio-row">' + radios + '</div>');
  }

  function fieldViewSelect(id, label, required, value) {
    var inner =
      '<select class="erp-select" id="' + id + '" disabled>' +
      '<option selected>' + escapeHtml(value || '') + '</option>' +
      '</select>';
    return fieldWrap(id, label, required, inner);
  }

  function fieldViewInput(id, label, required, value, type) {
    var inner =
      '<input class="erp-input" id="' + id + '" type="' + (type || 'text') + '" value="' + escapeHtml(value || '') + '" disabled readonly>';
    return fieldWrap(id, label, required, inner);
  }

  function fieldViewInputUnit(id, label, required, value, unit) {
    var inner =
      '<div class="product-add-field__control product-add-field__control--unit">' +
      '  <input class="erp-input" id="' + id + '" type="text" value="' + escapeHtml(value || '') + '" disabled readonly>' +
      '  <span class="product-add-field__unit">' + escapeHtml(unit) + '</span>' +
      '</div>';
    return fieldWrap(id, label, required, inner);
  }

  function fieldViewReadonly(id, label, value, hint) {
    var inner =
      '<input class="erp-input erp-input--readonly" id="' + id + '" type="text" value="' + escapeHtml(value || '') + '" disabled readonly>' +
      (hint ? '<p class="product-add-field__hint">' + hint + '</p>' : '');
    return fieldWrap(id, label, false, inner);
  }

  function fieldViewUpload(id, label, required, imgSrc, hint) {
    var inner =
      '<div class="product-add-upload product-add-upload--readonly">' +
      '  <div class="product-add-upload__box product-add-upload__box--preview">' +
      (imgSrc ? '<img class="product-add-upload__img" src="' + escapeHtml(imgSrc) + '" alt="">' : '') +
      '  </div>' +
      '  <p class="product-add-upload__hint">' + hint + '</p>' +
      '</div>';
    return fieldWrap(id, label, required, inner);
  }

  function basicSection(data) {
    var weighHidden = data.weighType === 'no' ? ' is-hidden' : '';
    return (
      '<section class="product-add-section product-add-section--basic">' +
      '  <h3 class="product-add-section__title">基础信息</h3>' +
      '  <div class="product-add-form__columns">' +
      '    <div class="product-add-form__col">' +
      fieldViewRadio(
        'productType',
        '商品类型',
        true,
        [
          { value: 'physical', label: '实物商品' },
          { value: 'virtual', label: '虚拟商品' }
        ],
        data.productType
      ) +
      fieldViewInput('productName', '商品名称', true, data.name) +
      fieldViewSelect('productLabel', '请选择标签', false, data.productLabel || '请选择标签') +
      fieldViewSelect('productCategory', '商品类目', true, data.category) +
      fieldViewUpload(
        'productImage',
        '商品图片',
        true,
        data.img,
        '建议上传1张商品主图，第一张将作为主图展示，支持 png/jpg，尺寸 800x800px，大小 10MB 以内'
      ) +
      '    </div>' +
      '    <div class="product-add-form__col">' +
      fieldViewRadio(
        'productSource',
        '商品来源',
        true,
        [
          { value: 'self', label: '自营 (暂不支持)', disabled: true },
          { value: 'supplier', label: '供应商' }
        ],
        'supplier'
      ) +
      fieldViewSelect('supplierId', '选择供应商', true, data.supplierId) +
      fieldViewSelect('productBrand', '商品品牌', false, data.productBrand) +
      fieldViewSelect('purchaser', '采购员', true, data.purchaser) +
      fieldViewCheckbox(
        'saleChannels',
        '可售卖渠道',
        true,
        [
          { value: 'live', label: '电商直播' },
          { value: 'proxy', label: '代采' }
        ],
        data.saleChannels
      ) +
      fieldViewUpload(
        'productVideo',
        '商品视频',
        false,
        '',
        '仅支持 MP4 格式且大小不超过 10MB；上传中断后重新选择同一文件可续传'
      ) +
      '    </div>' +
      '    <div class="product-add-form__col">' +
      fieldViewRadio(
        'weighType',
        '是否计重',
        true,
        [
          { value: 'yes', label: '计重' },
          { value: 'no', label: '不计重' }
        ],
        data.weighType
      ) +
      fieldViewSelect('baseUnit', '基础单位', true, data.baseUnit) +
      '<div class="product-add-field' + weighHidden + '" data-field="productWeight">' +
      '  <label class="product-add-field__label"><span class="product-add-field__req">*</span>商品重量</label>' +
      '  <div class="product-add-field__control product-add-field__control--unit">' +
      '    <input class="erp-input" id="productWeight" type="text" value="' + escapeHtml(data.productWeight) + '" disabled readonly>' +
      '    <span class="product-add-field__unit">KG</span>' +
      '  </div>' +
      '</div>' +
      fieldViewReadonly('productCode', '商品编码', data.code, '系统将自动生成唯一数字编码') +
      fieldViewInput('shelfLife', '保质期天数', false, data.shelfLife, 'number') +
      fieldViewSelect('tempLayer', '温层', false, data.tempLayer) +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function specValueKey(groupName) {
    if (groupName === '包装') return 'packaging';
    if (groupName === '口味') return 'flavor';
    return groupName;
  }

  function readonlyInput(value, placeholder, readonlyGray) {
    var cls = 'erp-input product-add-spec-table__input' + (readonlyGray ? ' erp-input--readonly' : '');
    var val = value != null ? String(value) : '';
    if (val) {
      return '<input class="' + cls + '" type="text" value="' + escapeHtml(val) + '" disabled readonly>';
    }
    return (
      '<input class="' + cls + '" type="text" value="" placeholder="' + escapeHtml(placeholder || '') + '" disabled readonly>'
    );
  }

  function renderSpecPanelReadonly(group) {
    var tags = (group.values || [])
      .map(function (val) {
        return '<span class="product-add-spec__tag product-add-spec__tag--readonly">' + escapeHtml(val) + '</span>';
      })
      .join('');

    return (
      '<div class="product-add-spec__panel product-add-spec__panel--readonly">' +
      '  <div class="product-add-spec__panel-body">' +
      '    <div class="product-add-spec__row">' +
      '      <span class="product-add-spec__row-label">规格名</span>' +
      '      <select class="erp-select product-add-spec__select" disabled>' +
      '        <option selected>' + escapeHtml(group.name) + '</option>' +
      '      </select>' +
      '    </div>' +
      '    <div class="product-add-spec__row">' +
      '      <span class="product-add-spec__row-label">规格值</span>' +
      '      <input class="erp-input product-add-spec__value-input" type="text" placeholder="输入后按回车添加" disabled readonly>' +
      '    </div>' +
      (tags
        ? '    <div class="product-add-spec__row product-add-spec__row--tags">' +
          '      <span class="product-add-spec__row-label product-add-spec__row-label--empty"></span>' +
          '      <div class="product-add-spec__tags">' + tags + '</div>' +
          '    </div>'
        : '') +
      '  </div>' +
      '</div>'
    );
  }

  function specSalesSection(data) {
    var groups = data.specGroups || [];
    var specs = data.specs || [];

    if (!groups.length || !specs.length) {
      return (
        '<section class="product-add-section product-add-section--sales">' +
        '  <h3 class="product-add-section__title">销售信息</h3>' +
        '  <p class="product-audit-empty-spec">暂无规格信息</p>' +
        '</section>'
      );
    }

    var panels = groups.map(renderSpecPanelReadonly).join('');

    var specCols = groups
      .map(function () {
        return '<col class="product-add-spec-table__col product-add-spec-table__col--spec">';
      })
      .join('');

    var specThs = groups
      .map(function (g) {
        return '<th class="product-add-spec-table__th product-add-spec-table__th--spec">' + escapeHtml(g.name) + '</th>';
      })
      .join('');

    var rows = specs
      .map(function (row) {
        var specTds = groups
          .map(function (g) {
            var key = specValueKey(g.name);
            var val = row[key] != null ? row[key] : row[g.name] || '';
            return (
              '<td class="product-add-spec-table__td product-add-spec-table__td--spec">' +
              '<span class="product-audit-spec-value">' + escapeHtml(val) + '</span></td>'
            );
          })
          .join('');

        var skuImg = row.skuImg || data.img || '../user-app/assets/restock/product-leaf.svg';
        var volume = row.volume != null && row.volume !== '' ? row.volume : '—';

        return (
          '<tr>' +
          specTds +
          '<td class="product-add-spec-table__td product-add-spec-table__td--sku">' +
          '  <div class="product-add-spec-table__sku-img">' +
          '    <img src="' + escapeHtml(skuImg) + '" alt="">' +
          '  </div>' +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--price">' +
          readonlyInput(row.price, '请输入') +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--barcode">' +
          readonlyInput(row.barcode, '8-14位数字', true) +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--dim">' +
          readonlyInput(row.length, '请输入商品长度') +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--dim">' +
          readonlyInput(row.width, '请输入商品宽度') +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--dim">' +
          readonlyInput(row.height, '请输入商品高度') +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--volume product-add-spec-table__readonly">' +
          '<span class="product-audit-spec-value">' + escapeHtml(volume) + '</span></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--weight">' +
          readonlyInput(row.gross, '请输入') +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--weight">' +
          readonlyInput(row.tare, '请输入') +
          '</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--weight">' +
          readonlyInput(row.net, '请输入') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<section class="product-add-section product-add-section--sales">' +
      '  <h3 class="product-add-section__title">销售信息</h3>' +
      '  <div class="product-add-spec__head product-add-spec__head--view">' +
      '    <span class="product-add-spec__label">销售规格</span>' +
      '    <span class="product-add-spec__mode">多规格</span>' +
      '  </div>' +
      '  <div class="product-add-spec__panels product-add-spec__panels--view">' + panels + '</div>' +
      '  <div class="product-add-spec-detail product-add-spec-detail--view">' +
      '    <div class="product-add-spec-detail__layout">' +
      '      <div class="product-add-spec-detail__title">规格详情：</div>' +
      '      <div class="product-add-spec-table-wrap">' +
      '        <table class="product-add-spec-table product-add-spec-table--detail">' +
      '          <colgroup>' + specCols +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--sku">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--price">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--barcode">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--dim">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--dim">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--dim">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--volume">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--weight">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--weight">' +
      '            <col class="product-add-spec-table__col product-add-spec-table__col--weight">' +
      '          </colgroup>' +
      '          <thead><tr>' + specThs +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--sku"><span class="product-add-field__req">*</span>SKU图片</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--price"><span class="product-add-field__req">*</span>商品标准采购价</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--barcode"><span class="product-add-field__req">*</span>商品条形码</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--dim">长(cm)</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--dim">宽(cm)</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--dim">高(cm)</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--volume">体积(cm³)</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--weight">毛重(kg)</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--weight">皮重(kg)</th>' +
      '            <th class="product-add-spec-table__th product-add-spec-table__th--weight">净重(kg)</th>' +
      '          </tr></thead>' +
      '          <tbody>' + rows + '</tbody>' +
      '        </table>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function detailSection(data) {
    return (
      '<section class="product-add-section">' +
      '  <h3 class="product-add-section__title">商品详情</h3>' +
      '  <div class="product-add-field product-add-field--full">' +
      '    <label class="product-add-field__label">详情内容</label>' +
      '    <div class="product-add-editor product-add-editor--readonly">' +
      '      <div class="product-add-editor__body product-add-editor__body--readonly">' + (data.detailHtml || '') + '</div>' +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function renderPage(data) {
    var host = document.getElementById('productAuditBody');
    if (!host) return;
    host.innerHTML =
      '<form class="product-add-form product-add-form--readonly" id="productAuditForm">' +
      basicSection(data) +
      specSalesSection(data) +
      detailSection(data) +
      '</form>';
  }

  function goBackList() {
    window.location.href = wp.page('mdm_product_selection.html');
  }

  function auditPass() {
    if (!productCode || !window.MdmProductCatalog) return;
    window.MdmProductCatalog.updateAudit(productCode, 'passed');
    if (typeof showToast === 'function') showToast('审核通过', 'success');
    goBackList();
  }

  function closeRejectModal() {
    var modal = document.querySelector('[data-product-reject-modal]');
    if (modal) modal.remove();
  }

  function openRejectModal() {
    closeRejectModal();
    var backdrop = el('div', 'erp-modal-backdrop product-reject-modal-backdrop');
    backdrop.setAttribute('data-product-reject-modal', '1');

    var modal = el('div', 'erp-modal product-reject-modal');
    var header = el('div', 'erp-modal__header');
    header.appendChild(el('h2', 'erp-modal__title', '驳回'));
    var headerActions = el('div', 'erp-modal__header-actions');
    var closeBtn = el('button', 'erp-modal__header-btn');
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeRejectModal);
    headerActions.appendChild(closeBtn);
    header.appendChild(headerActions);

    var body = el('div', 'erp-modal__body');
    body.innerHTML =
      '<div class="erp-modal-field product-reject-modal__field">' +
      '  <label class="erp-modal-field__label" for="productRejectReason"><span class="erp-req">*</span>驳回原因</label>' +
      '  <div class="erp-modal-field__control">' +
      '    <textarea class="erp-input product-reject-modal__textarea" id="productRejectReason" rows="5" placeholder="输入驳回原因"></textarea>' +
      '    <p class="product-reject-modal__error" id="productRejectError" hidden>请输入驳回原因</p>' +
      '  </div>' +
      '</div>';

    var footer = el('div', 'erp-modal__footer');
    var cancelBtn = el('button', 'erp-btn');
    cancelBtn.type = 'button';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', closeRejectModal);

    var confirmBtn = el('button', 'erp-btn erp-btn--primary');
    confirmBtn.type = 'button';
    confirmBtn.textContent = '确定';
    confirmBtn.addEventListener('click', function () {
      var textarea = document.getElementById('productRejectReason');
      var errEl = document.getElementById('productRejectError');
      var reason = textarea ? String(textarea.value || '').trim() : '';
      if (!reason) {
        if (errEl) errEl.hidden = false;
        if (textarea) textarea.focus();
        return;
      }
      if (!productCode || !window.MdmProductCatalog) return;
      window.MdmProductCatalog.updateAudit(productCode, 'rejected', reason);
      closeRejectModal();
      if (typeof showToast === 'function') showToast('已驳回', 'success');
      goBackList();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeRejectModal();
    });
    document.body.appendChild(backdrop);

    var textarea = document.getElementById('productRejectReason');
    if (textarea) {
      textarea.addEventListener('input', function () {
        var errEl = document.getElementById('productRejectError');
        if (errEl && String(textarea.value || '').trim()) errEl.hidden = true;
      });
      textarea.focus();
    }
  }

  function bindEvents() {
    var passBtn = document.getElementById('productAuditPassBtn');
    var rejectBtn = document.getElementById('productAuditRejectBtn');
    var closeBtn = document.getElementById('productAuditCloseBtn');

    if (passBtn) passBtn.addEventListener('click', auditPass);
    if (rejectBtn) rejectBtn.addEventListener('click', openRejectModal);
    if (closeBtn) closeBtn.addEventListener('click', goBackList);
  }

  function init() {
    productCode = getQueryCode();
    if (!productCode || !window.MdmProductCatalog) {
      goBackList();
      return;
    }

    productData = window.MdmProductCatalog.getByCode(productCode);
    if (!productData) {
      if (typeof showToast === 'function') showToast('未找到商品 ' + productCode, 'warning');
      goBackList();
      return;
    }

    renderPage(productData);
    syncHeaderActions(productData);
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
