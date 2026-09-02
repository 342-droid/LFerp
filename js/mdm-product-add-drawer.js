/**
 * 选品库 — 添加商品右侧抽屉
 */
(function () {
  var DRAWER_ID = 'mdmProductAddDrawer';
  var SPEC_NAME_OPTIONS = ['产品类型', '口味', '包装', '规格', '颜色', '尺码'];
  var specGroups = [];
  var specRowCache = {};
  var specIdSeq = 0;

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function drawerTemplate() {
    return (
      '<div class="store-drawer-backdrop product-add-drawer-backdrop" data-product-add-backdrop></div>' +
      '<aside class="store-drawer store-drawer--product-add product-add-drawer" id="' + DRAWER_ID + '" aria-label="添加商品">' +
      '  <header class="store-drawer__header product-add-drawer__header">' +
      '    <h2 class="store-drawer__title">添加商品</h2>' +
      '    <button type="button" class="store-drawer__close" data-product-add-close aria-label="关闭">×</button>' +
      '  </header>' +
      '  <div class="store-drawer__body product-add-drawer__body">' +
      '    <form class="product-add-form" id="productAddForm" novalidate>' +
      drawerBasicSection() +
      drawerSalesSection() +
      drawerDetailSection() +
      '    </form>' +
      '  </div>' +
      '  <footer class="store-drawer__footer product-add-drawer__footer">' +
      '    <button type="button" class="erp-btn" data-product-add-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-product-add-submit>提交审核</button>' +
      '  </footer>' +
      '</aside>'
    );
  }

  function drawerBasicSection() {
    return (
      '<section class="product-add-section product-add-section--basic">' +
      '  <h3 class="product-add-section__title">基础信息</h3>' +
      '  <div class="product-add-form__columns">' +
      '    <div class="product-add-form__col">' +
      fieldRadio(
        'productType',
        '商品类型',
        true,
        [
          { value: 'physical', label: '实物商品', checked: true },
          { value: 'virtual', label: '虚拟商品' }
        ],
        '',
        '<p class="product-add-field__hint">实物商品一般由物流发货，请选择发货与收货信息的城市。</p>'
      ) +
      fieldInput('productName', '商品名称', true, '请输入商品名称', 'text', '', '', true) +
      fieldSelect('productLabel', '请选择标签', false, '请选择标签', getSelectionTagNames()) +
      fieldSelect(
        'productCategory',
        '商品类目',
        true,
        '请选择商品类目',
        ['新鲜蔬菜', '时令水果', '粮油调味', '肉禽蛋品', '酒水饮料']
      ) +
      fieldUpload('productImage', '商品图片', true, '建议上传1张商品主图，第一张将作为主图展示，支持 png/jpg，尺寸 800x800px，大小 10MB 以内') +
      '    </div>' +
      '    <div class="product-add-form__col">' +
      fieldRadio(
        'productSource',
        '商品来源',
        true,
        [
          { value: 'self', label: '自营 (暂不支持)', disabled: true },
          { value: 'supplier', label: '供应商', checked: true }
        ]
      ) +
      fieldSelect(
        'supplierId',
        '选择供应商',
        true,
        '请选择供应商',
        ['鲜丰供应链', '华东果蔬供应商', '冷链肉禽供应商']
      ) +
      fieldSelect('productBrand', '商品品牌', false, '请选择', ['冷丰优选', '产地直采', '无品牌']) +
      fieldSelect('purchaser', '采购员', true, '请选择采购员', ['张三', '李四', '王五']) +
      fieldCheckbox(
        'saleChannels',
        '可售卖渠道',
        true,
        [
          { value: 'live', label: '电商直播' },
          { value: 'proxy', label: '代采', checked: true }
        ]
      ) +
      fieldUpload(
        'productVideo',
        '商品视频',
        false,
        '仅支持 MP4 格式且大小不超过 10MB；上传中断后重新选择同一文件可续传'
      ) +
      '    </div>' +
      '    <div class="product-add-form__col">' +
      fieldRadio(
        'weighType',
        '是否计重',
        true,
        [
          { value: 'yes', label: '计重', checked: true },
          { value: 'no', label: '不计重' }
        ]
      ) +
      fieldSelect('baseUnit', '基础单位', true, '请选择', ['斤', 'kg', '箱', '袋', '瓶']) +
      fieldInputUnit('productWeight', '商品重量', true, '请输入商品重量', 'KG') +
      fieldReadonly('productCode', '商品编码', '系统将自动生成唯一数字编码') +
      fieldInput('shelfLife', '保质期天数', false, '请输入保质期天数', 'number') +
      fieldSelect('tempLayer', '温层', false, '请选择温层', ['常温', '冷藏', '冷冻']) +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function drawerSalesSection() {
    return (
      '<section class="product-add-section product-add-section--sales">' +
      '  <h3 class="product-add-section__title">销售信息</h3>' +
      '  <div class="product-add-spec__head">' +
      '    <label class="product-add-spec__label"><span class="product-add-field__req">*</span>销售规格</label>' +
      '    <div class="product-add-spec__toolbar">' +
      '      <button type="button" class="product-add-spec__add" data-spec-add>+ 添加规格</button>' +
      '      <button type="button" class="product-add-spec__manage" data-spec-manage>规格管理</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="product-add-spec__panels" id="productAddSpecPanels"></div>' +
      '  <div class="product-add-spec-detail" id="productAddSpecDetail" hidden>' +
      '    <div class="product-add-spec-detail__layout">' +
      '      <div class="product-add-spec-detail__title">规格详情：</div>' +
      '      <div class="product-add-spec-table-wrap">' +
      '        <table class="product-add-spec-table" id="productAddSpecTable">' +
      '          <colgroup id="productAddSpecTableCols"></colgroup>' +
      '          <thead id="productAddSpecTableHead"><tr></tr></thead>' +
      '          <tbody id="productAddSpecTableBody"></tbody>' +
      '        </table>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function drawerDetailSection() {
    return (
      '<section class="product-add-section">' +
      '  <h3 class="product-add-section__title">商品详情</h3>' +
      '  <div class="product-add-field product-add-field--full">' +
      '    <label class="product-add-field__label">详情内容</label>' +
      '    <div class="product-add-editor">' +
      '      <div class="product-add-editor__toolbar" id="productAddEditorToolbar">' +
      toolbarBtn('bold', 'B') +
      toolbarBtn('italic', 'I') +
      toolbarBtn('underline', 'U') +
      '<span class="product-add-editor__divider"></span>' +
      toolbarBtn('fontSize', '14px') +
      toolbarBtn('foreColor', 'A') +
      toolbarBtn('hiliteColor', '高亮') +
      '<span class="product-add-editor__divider"></span>' +
      toolbarBtn('justifyLeft', '左') +
      toolbarBtn('justifyCenter', '中') +
      toolbarBtn('justifyRight', '右') +
      '<span class="product-add-editor__divider"></span>' +
      toolbarBtn('insertUnorderedList', '• 列表') +
      toolbarBtn('insertOrderedList', '1. 列表') +
      toolbarBtn('indent', '缩进') +
      toolbarBtn('outdent', '反缩') +
      '<span class="product-add-editor__divider"></span>' +
      toolbarBtn('createLink', '链接') +
      toolbarBtn('insertImage', '图片') +
      toolbarBtn('insertTable', '表格') +
      '      </div>' +
      '      <div class="product-add-editor__body" id="productAddEditorBody" contenteditable="true" data-placeholder="请输入商品详情，支持图文、列表、表格等"></div>' +
      '    </div>' +
      '  </div>' +
      '</section>'
    );
  }

  function toolbarBtn(cmd, label) {
    return '<button type="button" class="product-add-editor__btn" data-editor-cmd="' + cmd + '">' + label + '</button>';
  }

  function fieldWrap(id, label, required, inner, extraClass, hint) {
    return (
      '<div class="product-add-field' + (extraClass ? ' ' + extraClass : '') + '" data-field="' + id + '">' +
      '  <label class="product-add-field__label" for="' + id + '">' +
      (required ? '<span class="product-add-field__req">*</span>' : '') +
      label +
      '  </label>' +
      inner +
      (hint || '') +
      '  <p class="product-add-field__error" data-field-error hidden></p>' +
      '</div>'
    );
  }

  function fieldInput(id, label, required, placeholder, type, value, extraClass, withCounter) {
    var counter = withCounter
      ? '<span class="product-add-field__counter" id="productNameCounter">0 / 100</span>'
      : '';
    var inner =
      '<div class="product-add-field__control' + (withCounter ? ' product-add-field__control--count' : '') + '">' +
      '<input class="erp-input" id="' + id + '" name="' + id + '" type="' + (type || 'text') + '" placeholder="' + placeholder + '" value="' + (value || '') + '" maxlength="' + (withCounter ? '100' : '') + '">' +
      counter +
      '</div>';
    return fieldWrap(id, label, required, inner, extraClass);
  }

  function fieldInputUnit(id, label, required, placeholder, unit) {
    var inner =
      '<div class="product-add-field__control product-add-field__control--unit">' +
      '<input class="erp-input" id="' + id + '" name="' + id + '" type="text" placeholder="' + placeholder + '">' +
      '<span class="product-add-field__unit">' + unit + '</span>' +
      '</div>';
    return fieldWrap(id, label, required, inner);
  }

  function getSelectionTagNames() {
    if (window.MdmProductSelectionTagStore && typeof window.MdmProductSelectionTagStore.getEnabled === 'function') {
      var list = window.MdmProductSelectionTagStore.getEnabled() || [];
      if (list.length) {
        return list.map(function (row) {
          return row.name;
        });
      }
    }
    return ['爆款', '新品', '时令', '跳过自动截单', '不走订货单'];
  }

  function fieldSelect(id, label, required, placeholder, options) {
    var opts = '<option value="">' + placeholder + '</option>';
    (options || []).forEach(function (opt) {
      opts += '<option value="' + opt + '">' + opt + '</option>';
    });
    var inner = '<select class="erp-select" id="' + id + '" name="' + id + '">' + opts + '</select>';
    return fieldWrap(id, label, required, inner);
  }

  function fieldReadonly(id, label, text) {
    var inner =
      '<div class="product-add-field__readonly" id="' + id + '" aria-readonly="true">' + text + '</div>';
    return fieldWrap(id, label, false, inner);
  }

  function fieldRadio(id, label, required, options, extraClass, hint) {
    var radios = (options || [])
      .map(function (opt) {
        return (
          '<label class="product-add-radio">' +
          '<input type="radio" name="' + id + '" value="' + opt.value + '"' +
          (opt.checked ? ' checked' : '') +
          (opt.disabled ? ' disabled' : '') +
          '> ' + opt.label +
          '</label>'
        );
      })
      .join('');
    var inner = '<div class="product-add-radio-row">' + radios + '</div>';
    return fieldWrap(id, label, required, inner, extraClass, hint ? '<div class="product-add-field__hint-wrap">' + hint + '</div>' : '');
  }

  function fieldCheckbox(id, label, required, options) {
    var boxes = (options || [])
      .map(function (opt) {
        return (
          '<label class="product-add-checkbox">' +
          '<input type="checkbox" name="' + id + '" value="' + opt.value + '"' + (opt.checked ? ' checked' : '') + '> ' + opt.label +
          '</label>'
        );
      })
      .join('');
    var inner = '<div class="product-add-checkbox-row">' + boxes + '</div>';
    return fieldWrap(id, label, required, inner);
  }

  function fieldUpload(id, label, required, hint) {
    var inner =
      '<div class="product-add-upload">' +
      '  <button type="button" class="product-add-upload__box" data-upload="' + id + '" aria-label="上传">' +
      '    <span class="product-add-upload__plus">+</span>' +
      '  </button>' +
      '  <input type="file" id="' + id + '" name="' + id + '" hidden>' +
      '  <p class="product-add-upload__hint">' + hint + '</p>' +
      '</div>';
    return fieldWrap(id, label, required, inner);
  }

  function onEl(root, selector, event, handler) {
    var node = root.querySelector(selector);
    if (node) node.addEventListener(event, handler);
  }

  function removeDrawer() {
    document.querySelectorAll('[data-product-add-backdrop], #' + DRAWER_ID + ', .product-add-drawer-root').forEach(function (node) {
      node.remove();
    });
    document.body.classList.remove('product-add-drawer-open');
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resetSpecState() {
    specGroups = [];
    specRowCache = {};
    specIdSeq = 0;
  }

  function nextSpecName() {
    var used = specGroups.map(function (g) {
      return g.name;
    });
    var i = 0;
    for (i = 0; i < SPEC_NAME_OPTIONS.length; i++) {
      if (used.indexOf(SPEC_NAME_OPTIONS[i]) < 0) return SPEC_NAME_OPTIONS[i];
    }
    return '规格' + (specGroups.length + 1);
  }

  function getSpecGroup(id) {
    var i = 0;
    for (i = 0; i < specGroups.length; i++) {
      if (specGroups[i].id === id) return specGroups[i];
    }
    return null;
  }

  function addSpecGroup() {
    specGroups.push({
      id: 'sg' + String(++specIdSeq),
      name: nextSpecName(),
      values: []
    });
    renderSpecUi();
  }

  function removeSpecGroup(id) {
    specGroups = specGroups.filter(function (g) {
      return g.id !== id;
    });
    renderSpecUi();
  }

  function addValueToGroup(id, raw) {
    var group = getSpecGroup(id);
    if (!group) return;
    var val = String(raw || '').trim();
    if (!val) return;
    if (group.values.indexOf(val) >= 0) {
      if (typeof showToast === 'function') showToast('规格值已存在', 'warning');
      return;
    }
    group.values.push(val);
    renderSpecUi();
  }

  function removeValueFromGroup(id, valIdx) {
    var group = getSpecGroup(id);
    if (!group || valIdx < 0 || valIdx >= group.values.length) return;
    group.values.splice(valIdx, 1);
    renderSpecUi();
  }

  function activeSpecGroups() {
    return specGroups.filter(function (g) {
      return g.values.length > 0;
    });
  }

  function cartesianCombinations() {
    var groups = activeSpecGroups();
    if (!groups.length) return [];

    var result = groups[0].values.map(function (val) {
      var row = {};
      row[groups[0].name] = val;
      return row;
    });

    var gi = 1;
    for (gi = 1; gi < groups.length; gi++) {
      var group = groups[gi];
      var next = [];
      result.forEach(function (row) {
        group.values.forEach(function (val) {
          var copy = {};
          var key = '';
          for (key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) copy[key] = row[key];
          }
          copy[group.name] = val;
          next.push(copy);
        });
      });
      result = next;
    }
    return result;
  }

  function comboKey(combo) {
    return activeSpecGroups()
      .map(function (g) {
        return g.name + '=' + combo[g.name];
      })
      .join('|');
  }

  function saveSpecRowCache() {
    document.querySelectorAll('[data-combo-key]').forEach(function (tr) {
      var key = tr.getAttribute('data-combo-key');
      if (!key) return;
      specRowCache[key] = {
        price: (tr.querySelector('[data-spec-price]') || {}).value || '',
        barcode: (tr.querySelector('[data-spec-barcode]') || {}).value || '',
        length: (tr.querySelector('[data-spec-length]') || {}).value || '',
        width: (tr.querySelector('[data-spec-width]') || {}).value || '',
        height: (tr.querySelector('[data-spec-height]') || {}).value || '',
        gross: (tr.querySelector('[data-spec-gross]') || {}).value || '',
        tare: (tr.querySelector('[data-spec-tare]') || {}).value || '',
        net: (tr.querySelector('[data-spec-net]') || {}).value || ''
      };
    });
  }

  function renderSpecPanel(group) {
    var nameOpts = SPEC_NAME_OPTIONS.map(function (name) {
      var used = specGroups.some(function (g) {
        return g.id !== group.id && g.name === name;
      });
      return (
        '<option value="' + name + '"' +
        (group.name === name ? ' selected' : '') +
        (used ? ' disabled' : '') +
        '>' + name + '</option>'
      );
    }).join('');

    var tags = group.values
      .map(function (val, idx) {
        return (
          '<span class="product-add-spec__tag">' + escapeHtml(val) +
          '<button type="button" class="product-add-spec__tag-remove" data-spec-tag-remove data-group-id="' + group.id + '" data-value-idx="' + idx + '" aria-label="移除">×</button></span>'
        );
      })
      .join('');

    return (
      '<div class="product-add-spec__panel" data-spec-group="' + group.id + '">' +
      '<div class="product-add-spec__panel-head">' +
      '<button type="button" class="product-add-spec__delete" data-spec-group-delete data-group-id="' + group.id + '">删除</button>' +
      '</div>' +
      '<div class="product-add-spec__panel-body">' +
      '<div class="product-add-spec__row">' +
      '<span class="product-add-spec__row-label">规格名</span>' +
      '<select class="erp-select product-add-spec__select" data-spec-name-select data-group-id="' + group.id + '">' + nameOpts + '</select>' +
      '</div>' +
      '<div class="product-add-spec__row">' +
      '<span class="product-add-spec__row-label">规格值</span>' +
      '<div class="product-add-spec__value-wrap">' +
      '<input class="erp-input product-add-spec__value-input" type="text" placeholder="输入后按回车添加" data-spec-value-input data-group-id="' + group.id + '">' +
      '<button type="button" class="product-add-spec__value-add" data-spec-value-add data-group-id="' + group.id + '">添加规格值</button>' +
      '</div>' +
      '</div>' +
      (tags
        ? '<div class="product-add-spec__row product-add-spec__row--tags">' +
          '<span class="product-add-spec__row-label product-add-spec__row-label--empty"></span>' +
          '<div class="product-add-spec__tags">' + tags + '</div></div>'
        : '') +
      '</div></div>'
    );
  }

  function renderSpecPanels() {
    var host = document.getElementById('productAddSpecPanels');
    if (!host) return;
    host.innerHTML = specGroups.map(renderSpecPanel).join('');
  }

  function updateRowVolume(tr) {
    var l = parseFloat((tr.querySelector('[data-spec-length]') || {}).value);
    var w = parseFloat((tr.querySelector('[data-spec-width]') || {}).value);
    var h = parseFloat((tr.querySelector('[data-spec-height]') || {}).value);
    var volEl = tr.querySelector('[data-spec-volume]');
    if (!volEl) return;
    if (l > 0 && w > 0 && h > 0) {
      volEl.textContent = String(Math.round(l * w * h));
    } else {
      volEl.textContent = '—';
    }
  }

  function renderSpecTable() {
    var detail = document.getElementById('productAddSpecDetail');
    var colgroup = document.getElementById('productAddSpecTableCols');
    var theadRow = document.querySelector('#productAddSpecTableHead tr');
    var tbody = document.getElementById('productAddSpecTableBody');
    if (!detail || !colgroup || !theadRow || !tbody) return;

    var groups = activeSpecGroups();
    var combos = cartesianCombinations();

    if (!combos.length) {
      detail.hidden = true;
      colgroup.innerHTML = '';
      theadRow.innerHTML = '';
      tbody.innerHTML = '';
      return;
    }

    detail.hidden = false;

    var colHtml = groups.map(function () {
      return '<col class="product-add-spec-table__col product-add-spec-table__col--spec">';
    }).join('');
    colHtml +=
      '<col class="product-add-spec-table__col product-add-spec-table__col--sku">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--price">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--barcode">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--dim">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--dim">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--dim">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--volume">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--weight">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--weight">' +
      '<col class="product-add-spec-table__col product-add-spec-table__col--weight">';
    colgroup.innerHTML = colHtml;

    var headHtml = groups
      .map(function (g) {
        return '<th class="product-add-spec-table__th product-add-spec-table__th--spec">' + escapeHtml(g.name) + '</th>';
      })
      .join('');
    headHtml +=
      '<th class="product-add-spec-table__th product-add-spec-table__th--sku"><span class="product-add-field__req">*</span>SKU图片</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--price"><span class="product-add-field__req">*</span>采购价/基础单位</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--barcode"><span class="product-add-field__req">*</span>商品条形码</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--dim">长(cm)</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--dim">宽(cm)</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--dim">高(cm)</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--volume">体积(cm³)</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--weight">毛重(kg)</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--weight">皮重(kg)</th>' +
      '<th class="product-add-spec-table__th product-add-spec-table__th--weight">净重(kg)</th>';
    theadRow.innerHTML = headHtml;

    tbody.innerHTML = combos
      .map(function (combo) {
        var key = comboKey(combo);
        var cached = specRowCache[key] || {};
        var barcodeValue = cached.barcode || cached.code || '';
        var specCells = groups
          .map(function (g) {
            return '<td class="product-add-spec-table__td product-add-spec-table__td--spec">' + escapeHtml(combo[g.name]) + '</td>';
          })
          .join('');
        return (
          '<tr data-combo-key="' + escapeHtml(key) + '">' +
          specCells +
          '<td class="product-add-spec-table__td product-add-spec-table__td--sku">' +
          '<button type="button" class="product-add-upload__box product-add-upload__box--sm" data-sku-upload><span class="product-add-upload__plus">+</span></button></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--price">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--price" type="text" placeholder="请输入" data-spec-price value="' + escapeHtml(cached.price) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--barcode">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--barcode" type="text" inputmode="numeric" placeholder="8-14位数字" data-spec-barcode value="' + escapeHtml(barcodeValue) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--dim">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--dim" type="text" placeholder="请输入商品长度" data-spec-length value="' + escapeHtml(cached.length) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--dim">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--dim" type="text" placeholder="请输入商品宽度" data-spec-width value="' + escapeHtml(cached.width) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--dim">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--dim" type="text" placeholder="请输入商品高度" data-spec-height value="' + escapeHtml(cached.height) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--volume product-add-spec-table__readonly" data-spec-volume>—</td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--weight">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--weight" type="text" placeholder="请输入" data-spec-gross value="' + escapeHtml(cached.gross) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--weight">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--weight" type="text" placeholder="请输入" data-spec-tare value="' + escapeHtml(cached.tare) + '"></td>' +
          '<td class="product-add-spec-table__td product-add-spec-table__td--weight">' +
          '<input class="erp-input product-add-spec-table__input product-add-spec-table__input--weight" type="text" placeholder="请输入" data-spec-net value="' + escapeHtml(cached.net) + '"></td>' +
          '</tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('tr').forEach(function (tr) {
      ['length', 'width', 'height'].forEach(function (field) {
        var input = tr.querySelector('[data-spec-' + field + ']');
        if (input) {
          input.addEventListener('input', function () {
            updateRowVolume(tr);
          });
        }
      });
      updateRowVolume(tr);
    });
  }

  function renderSpecUi() {
    saveSpecRowCache();
    renderSpecPanels();
    renderSpecTable();
  }

  function bindSpecEvents(drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-spec-add]')) {
        e.preventDefault();
        addSpecGroup();
        return;
      }

      if (e.target.closest('[data-spec-manage]')) {
        if (typeof showToast === 'function') showToast('规格管理（演示）', 'info');
        return;
      }

      var delGroupBtn = e.target.closest('[data-spec-group-delete]');
      if (delGroupBtn) {
        removeSpecGroup(delGroupBtn.getAttribute('data-group-id'));
        return;
      }

      var addValBtn = e.target.closest('[data-spec-value-add]');
      if (addValBtn) {
        var gid = addValBtn.getAttribute('data-group-id');
        var input = drawer.querySelector('[data-spec-value-input][data-group-id="' + gid + '"]');
        if (input) {
          addValueToGroup(gid, input.value);
          input.value = '';
        }
        return;
      }

      var tagRemove = e.target.closest('[data-spec-tag-remove]');
      if (tagRemove) {
        removeValueFromGroup(
          tagRemove.getAttribute('data-group-id'),
          parseInt(tagRemove.getAttribute('data-value-idx'), 10)
        );
        return;
      }

      if (e.target.closest('[data-sku-upload]')) {
        if (typeof showToast === 'function') showToast('上传 SKU 图片（演示）', 'info');
      }
    });

    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var input = e.target.closest('[data-spec-value-input]');
      if (!input) return;
      e.preventDefault();
      addValueToGroup(input.getAttribute('data-group-id'), input.value);
      input.value = '';
    });

    drawer.addEventListener('change', function (e) {
      var select = e.target.closest('[data-spec-name-select]');
      if (!select) return;
      var group = getSpecGroup(select.getAttribute('data-group-id'));
      if (!group) return;
      group.name = select.value;
      renderSpecUi();
    });
  }

  function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('is-error');
    var err = field.querySelector('[data-field-error]');
    if (err) {
      err.hidden = true;
      err.textContent = '';
    }
  }

  function setFieldError(id, message) {
    var field = document.querySelector('[data-field="' + id + '"]');
    if (!field) return;
    field.classList.add('is-error');
    var err = field.querySelector('[data-field-error]');
    if (err) {
      err.hidden = false;
      err.textContent = message;
    }
    var control = field.querySelector('.erp-input, .erp-select');
    if (control) control.focus();
  }

  function isWeighEnabled(root) {
    var scope = root || document;
    var checked = scope.querySelector('input[name="weighType"]:checked');
    return !checked || checked.value !== 'no';
  }

  function syncWeighTypeVisibility(root) {
    var scope = root || document;
    var field = scope.querySelector('[data-field="productWeight"]');
    if (!field) return;
    var enabled = isWeighEnabled(scope);
    field.classList.toggle('is-hidden', !enabled);
    field.hidden = !enabled;
    if (!enabled) {
      clearFieldError(field);
      var weightInput = scope.querySelector('#productWeight');
      if (weightInput) weightInput.value = '';
    }
  }

  function validateForm() {
    var valid = true;
    document.querySelectorAll('.product-add-field.is-error').forEach(clearFieldError);

    var requiredMap = {
      productName: '请输入商品名称',
      supplierId: '请选择供应商',
      baseUnit: '请选择基础单位',
      productWeight: '请输入商品重量',
      productCategory: '请选择商品类目',
      purchaser: '请选择采购员',
      productImage: '请上传商品图片'
    };

    Object.keys(requiredMap).forEach(function (key) {
      if (key === 'productWeight' && !isWeighEnabled()) return;
      var node = document.getElementById(key);
      if (!node) return;
      var empty = false;
      if (node.type === 'file') {
        empty = !node.files || !node.files.length;
      } else {
        empty = !String(node.value || '').trim();
      }
      if (empty) {
        setFieldError(key, requiredMap[key]);
        valid = false;
      }
    });

    if (!document.querySelector('input[name="saleChannels"]:checked')) {
      setFieldError('saleChannels', '请选择可售卖渠道');
      valid = false;
    }

    if (!cartesianCombinations().length) {
      if (typeof showToast === 'function') showToast('请添加销售规格并填写规格值', 'warning');
      valid = false;
    }

    var priceInputs = document.querySelectorAll('[data-spec-price]');
    for (var i = 0; i < priceInputs.length; i++) {
      if (!String(priceInputs[i].value || '').trim()) {
        if (typeof showToast === 'function') showToast('请填写采购价/基础单位', 'warning');
        priceInputs[i].focus();
        valid = false;
        break;
      }
    }

    var barcodeInputs = document.querySelectorAll('[data-spec-barcode]');
    for (var j = 0; j < barcodeInputs.length; j++) {
      if (!String(barcodeInputs[j].value || '').trim()) {
        if (typeof showToast === 'function') showToast('请填写商品条形码', 'warning');
        barcodeInputs[j].focus();
        valid = false;
        break;
      }
    }

    return valid;
  }

  function resetForm() {
    var form = document.getElementById('productAddForm');
    if (form) form.reset();
    resetSpecState();
    var editor = document.getElementById('productAddEditorBody');
    if (editor) editor.innerHTML = '';
    var counter = document.getElementById('productNameCounter');
    if (counter) counter.textContent = '0 / 100';
    document.querySelectorAll('.product-add-field.is-error').forEach(clearFieldError);
    document.querySelectorAll('.product-add-upload__preview').forEach(function (node) {
      node.remove();
    });
    renderSpecUi();
  }

  function bindDrawerEvents(backdrop, drawer) {
    onEl(drawer, '[data-product-add-close]', 'click', close);
    onEl(drawer, '[data-product-add-cancel]', 'click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    onEl(drawer, '[data-product-add-submit]', 'click', function () {
      if (!validateForm()) return;
      if (window.MdmProductCatalog) {
        var nameInput = document.getElementById('productName');
        var categorySelect = document.getElementById('productCategory');
        var channelChecks = document.querySelectorAll('input[name="saleChannels"]:checked');
        var saleChannels = [];
        channelChecks.forEach(function (el) { saleChannels.push(el.value); });
        var channelLabels = [];
        saleChannels.forEach(function (v) {
          if (v === 'live') channelLabels.push('电商直播');
          else if (v === 'proxy') channelLabels.push('代采');
        });
        var codeNum = String(Math.floor(Math.random() * 900) + 100);
        window.MdmProductCatalog.addProduct({
          code: 'SPU00' + codeNum,
          name: nameInput && nameInput.value ? nameInput.value.trim() : '新商品',
          price: 10,
          channel: channelLabels.length ? channelLabels.join('、') : '电商直播',
          saleChannels: saleChannels.length ? saleChannels.slice() : ['live'],
          category: categorySelect && categorySelect.value ? categorySelect.value : '新鲜蔬菜',
          status: 'pending_sale',
          audit: 'pending',
          img: '../user-app/assets/restock/product-leaf.svg'
        });
        if (typeof window.__refreshProductSelection === 'function') {
          window.__refreshProductSelection();
        }
      }
      if (typeof showToast === 'function') showToast('已提交审核（演示）', 'success');
      close();
    });

    var nameInput = document.getElementById('productName');
    var counter = document.getElementById('productNameCounter');
    if (nameInput && counter) {
      nameInput.addEventListener('input', function () {
        counter.textContent = String(nameInput.value.length) + ' / 100';
        clearFieldError(nameInput.closest('.product-add-field'));
      });
    }

    drawer.querySelectorAll('[data-upload]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-upload');
        var input = document.getElementById(id);
        if (input) input.click();
      });
    });

    drawer.querySelectorAll('input[type="file"]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.files || !input.files.length) return;
        var field = input.closest('.product-add-field');
        clearFieldError(field);
        var box = field && field.querySelector('.product-add-upload__box');
        if (!box) return;
        var old = box.querySelector('.product-add-upload__preview');
        if (old) old.remove();
        var name = input.files[0].name;
        var preview = el('span', 'product-add-upload__preview', name);
        box.appendChild(preview);
        if (typeof showToast === 'function') showToast('已选择文件：' + name, 'info');
      });
    });

    drawer.querySelectorAll('input[name="weighType"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        syncWeighTypeVisibility(drawer);
      });
    });
    syncWeighTypeVisibility(drawer);

    bindSpecEvents(drawer);

    drawer.querySelectorAll('[data-editor-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-editor-cmd');
        var editor = document.getElementById('productAddEditorBody');
        if (!editor) return;
        editor.focus();
        if (cmd === 'createLink') {
          var url = window.prompt('请输入链接地址', 'https://');
          if (url) document.execCommand(cmd, false, url);
          return;
        }
        if (cmd === 'insertImage') {
          if (typeof showToast === 'function') showToast('插入图片（演示）', 'info');
          return;
        }
        if (cmd === 'insertTable') {
          document.execCommand('insertHTML', false, '<table border="1" cellpadding="6"><tr><td>单元格</td><td>单元格</td></tr></table>');
          return;
        }
        if (cmd === 'fontSize') {
          document.execCommand('fontSize', false, '3');
          return;
        }
        if (cmd === 'foreColor') {
          document.execCommand('foreColor', false, '#333333');
          return;
        }
        if (cmd === 'hiliteColor') {
          document.execCommand('hiliteColor', false, '#fff566');
          return;
        }
        document.execCommand(cmd, false, null);
      });
    });

    drawer.querySelectorAll('.erp-input, .erp-select').forEach(function (control) {
      control.addEventListener('input', function () {
        clearFieldError(control.closest('.product-add-field'));
      });
      control.addEventListener('change', function () {
        clearFieldError(control.closest('.product-add-field'));
      });
    });

    document.addEventListener('keydown', onEscKey);
  }

  function onEscKey(e) {
    if (e.key === 'Escape' && document.getElementById(DRAWER_ID)) close();
  }

  function open() {
    resetSpecState();
    removeDrawer();
    try {
      var host = el('div', 'product-add-drawer-root');
      host.innerHTML = drawerTemplate();
      var backdrop = host.querySelector('[data-product-add-backdrop]');
      var drawer = host.querySelector('#' + DRAWER_ID);
      if (!backdrop || !drawer) {
        throw new Error('添加商品抽屉模板渲染失败');
      }
      document.body.appendChild(backdrop);
      document.body.appendChild(drawer);
      document.body.classList.add('product-add-drawer-open');
      bindDrawerEvents(backdrop, drawer);
      renderSpecUi();
    } catch (err) {
      removeDrawer();
      if (typeof showToast === 'function') showToast('打开添加商品页失败', 'error');
      if (typeof console !== 'undefined' && console.error) console.error(err);
    }
  }

  function close() {
    document.removeEventListener('keydown', onEscKey);
    removeDrawer();
  }

  window.MdmProductAddDrawer = {
    open: open,
    close: close,
    reset: resetForm
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#productAddBtn')) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  });
})();
