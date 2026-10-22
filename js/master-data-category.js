(function () {
  var store = window.MasterDataCategoryStore;
  var LEVEL_LABEL = ['', '一级分类', '二级分类', '三级分类', '四级分类'];

  var state = {
    selectedL1: null,
    selectedL2: null,
    selectedL3: null,
    selectedL4: null,
    detailTab: 'info',
    detailFocusId: null
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function genId(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function selectedId(level) {
    return state['selectedL' + level];
  }

  function setSelectedId(level, id) {
    state['selectedL' + level] = id;
  }

  function hasHiddenAncestor(node) {
    var parent = node && node.parent_id ? store.getNode(node.parent_id) : null;
    while (parent) {
      if (parent.status === 'off_shelf') return true;
      parent = parent.parent_id ? store.getNode(parent.parent_id) : null;
    }
    return false;
  }

  function renderStatusTag(status) {
    if (status === 'off_shelf') {
      return '<span class="product-tag product-tag--stopped">隐藏</span>';
    }
    return '<span class="product-tag product-tag--on-shelf">显示</span>';
  }

  function renderListItem(node, selectedIdValue, showIcon) {
    var active = node.id === selectedIdValue ? ' is-active' : '';
    var off = node.status === 'off_shelf' ? ' is-off' : '';
    var iconHtml = '';
    if (showIcon && node.icon) {
      iconHtml = '<img class="product-category-cascade__avatar" src="' + node.icon + '" alt="">';
    } else if (showIcon) {
      iconHtml = '<span class="product-category-cascade__avatar product-category-cascade__avatar--placeholder">' + escapeHtml(node.name.charAt(0)) + '</span>';
    }
    return (
      '<li class="product-category-cascade__item' + active + off + '" data-id="' + node.id + '" data-level="' + node.level + '">' +
      iconHtml +
      '<span class="product-category-cascade__name">' + escapeHtml(node.name) + '</span>' +
      renderStatusTag(node.status) +
      '<span class="product-category-cascade__count">' + node.product_count + '</span>' +
      '</li>'
    );
  }

  function renderColumn(listEl, nodes, selectedIdValue, showIcon, emptyText) {
    if (!listEl) return;
    if (!nodes.length) {
      listEl.innerHTML = '<li class="product-category-cascade__empty">' + escapeHtml(emptyText) + '</li>';
      return;
    }
    listEl.innerHTML = nodes.map(function (n) { return renderListItem(n, selectedIdValue, showIcon); }).join('');
  }

  function syncAddButtons() {
    var btnL2 = document.getElementById('catAddL2');
    var btnL3 = document.getElementById('catAddL3');
    var btnL4 = document.getElementById('catAddL4');
    if (btnL2) btnL2.disabled = !state.selectedL1;
    if (btnL3) btnL3.disabled = !state.selectedL2;
    if (btnL4) btnL4.disabled = !state.selectedL3;
  }

  function syncHints() {
    var l1 = state.selectedL1 ? store.getNode(state.selectedL1) : null;
    var l2 = state.selectedL2 ? store.getNode(state.selectedL2) : null;
    var l3 = state.selectedL3 ? store.getNode(state.selectedL3) : null;
    var hintL2 = document.getElementById('catHintL2');
    var hintL3 = document.getElementById('catHintL3');
    var hintL4 = document.getElementById('catHintL4');
    if (hintL2) hintL2.textContent = l1 ? '所属：' + l1.name : '请先选择一级分类';
    if (hintL3) hintL3.textContent = l2 ? '所属：' + (l1 ? l1.name + ' / ' : '') + l2.name : '请先选择二级分类';
    if (hintL4) {
      hintL4.textContent = l3
        ? '所属：' + [l1 && l1.name, l2 && l2.name, l3.name].filter(Boolean).join(' / ')
        : '请先选择三级分类';
    }
  }

  function getDetailNode() {
    if (state.detailFocusId) return store.getNode(state.detailFocusId);
    if (state.selectedL4) return store.getNode(state.selectedL4);
    if (state.selectedL3) return store.getNode(state.selectedL3);
    if (state.selectedL2) return store.getNode(state.selectedL2);
    if (state.selectedL1) return store.getNode(state.selectedL1);
    return null;
  }

  function renderDetail() {
    var node = getDetailNode();
    var breadcrumbEl = document.getElementById('catDetailBreadcrumb');
    var paneInfo = document.getElementById('catDetailPaneInfo');
    var paneUnits = document.getElementById('catDetailPaneUnits');
    var paneAttrCats = document.getElementById('catDetailPaneAttrCats');
    var paneAttrs = document.getElementById('catDetailPaneAttrs');
    var paneProducts = document.getElementById('catDetailPaneProducts');
    var tabUnits = document.getElementById('catDetailTabUnits');
    var tabAttrCats = document.getElementById('catDetailTabAttrCats');
    var tabAttrs = document.getElementById('catDetailTabAttrs');
    var tabProducts = document.getElementById('catDetailTabProducts');

    if (!node) {
      state.detailTab = 'info';
      if (breadcrumbEl) breadcrumbEl.innerHTML = '<span class="product-category-detail__crumb">请选择分类</span>';
      if (tabUnits) tabUnits.hidden = true;
      if (tabAttrCats) tabAttrCats.hidden = true;
      if (tabAttrs) tabAttrs.hidden = true;
      if (tabProducts) tabProducts.hidden = true;
      if (paneInfo) {
        paneInfo.hidden = false;
        paneInfo.innerHTML = '<div class="product-category-detail__products-empty">从左侧选择一级至四级分类</div>';
      }
      if (paneUnits) paneUnits.hidden = true;
      if (paneAttrCats) paneAttrCats.hidden = true;
      if (paneAttrs) paneAttrs.hidden = true;
      if (paneProducts) paneProducts.hidden = true;
      return;
    }

    if (breadcrumbEl) {
      var parts = node.path.split('/');
      breadcrumbEl.innerHTML = parts.map(function (part, index) {
        var cls = index === parts.length - 1 ? ' is-current' : '';
        return '<span class="product-category-detail__crumb' + cls + '">' + escapeHtml(part) + '</span>';
      }).join('<span class="product-category-detail__sep">/</span>');
    }

    if (tabUnits) tabUnits.hidden = node.level !== 1;
    if (tabAttrCats) tabAttrCats.hidden = node.level !== 1;
    if (tabAttrs) tabAttrs.hidden = false;
    if (tabProducts) tabProducts.hidden = node.level !== 4;
    if (node.level !== 1 && (state.detailTab === 'attrcats' || state.detailTab === 'units')) state.detailTab = 'info';
    if (node.level !== 4 && state.detailTab === 'products') state.detailTab = 'info';

    document.querySelectorAll('.product-category-detail__tab').forEach(function (tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-tab') === state.detailTab);
    });

    if (paneInfo) paneInfo.hidden = state.detailTab !== 'info';
    if (paneUnits) paneUnits.hidden = state.detailTab !== 'units';
    if (paneAttrCats) paneAttrCats.hidden = state.detailTab !== 'attrcats';
    if (paneAttrs) paneAttrs.hidden = state.detailTab !== 'attrs';
    if (paneProducts) paneProducts.hidden = state.detailTab !== 'products';

    var deleteBlocked = store.hasBindingsInTree(node.id);
    if (paneInfo) {
      var levelText = LEVEL_LABEL[node.level] + (node.level === 4 ? '（商品挂载点）' : '');
      var iconPreview = node.icon
        ? '<img class="product-category-detail__icon" src="' + node.icon + '" alt="">'
        : '<span class="product-category-detail__icon product-category-detail__icon--placeholder">' + escapeHtml(node.name.charAt(0)) + '</span>';
      var deleteBtn = deleteBlocked
        ? '  <button type="button" class="erp-btn erp-btn--danger" disabled title="' + escapeHtml(store.BLOCK_MSG) + '">删除</button>'
        : '  <button type="button" class="erp-btn erp-btn--danger" data-detail-action="delete" data-id="' + node.id + '">删除</button>';
      var showBlocked = node.status === 'off_shelf' && hasHiddenAncestor(node);
      var statusBtn = node.status === 'off_shelf'
        ? (showBlocked
          ? '  <button type="button" class="erp-btn" disabled title="上级分类已隐藏，请先显示上级分类">显示</button>'
          : '  <button type="button" class="erp-btn" data-detail-action="on-shelf" data-id="' + node.id + '">显示</button>')
        : '  <button type="button" class="erp-btn" data-detail-action="off-shelf" data-id="' + node.id + '">隐藏</button>';

      paneInfo.innerHTML =
        '<div class="product-category-detail__hero">' +
        iconPreview +
        '<div class="product-category-detail__hero-text">' +
        '  <h3 class="product-category-detail__name">' + escapeHtml(node.name) + '</h3>' +
        '  <p class="product-category-detail__level-tag">' + levelText + '</p>' +
        '</div>' +
        renderStatusTag(node.status) +
        '</div>' +
        '<dl class="product-category-detail__meta">' +
        '  <div class="product-category-detail__meta-row"><dt>分类编码</dt><dd>' + escapeHtml(node.code || '') + '</dd></div>' +
        '  <div class="product-category-detail__meta-row"><dt>完整路径</dt><dd>' + escapeHtml(node.path) + '</dd></div>' +
        '  <div class="product-category-detail__meta-row"><dt>排序</dt><dd>' + node.sort + '</dd></div>' +
        '  <div class="product-category-detail__meta-row"><dt>已绑定商品</dt><dd>' + node.product_count + ' 个' + (node.level < 4 ? '（下级汇总）' : '') + '</dd></div>' +
        '  <div class="product-category-detail__meta-row"><dt>创建时间</dt><dd>' + escapeHtml(node.created_at) + '</dd></div>' +
        '</dl>' +
        '<div class="product-category-detail__actions">' +
        '  <button type="button" class="erp-btn erp-btn--primary" data-detail-action="edit" data-id="' + node.id + '">编辑</button>' +
        statusBtn +
        deleteBtn +
        '</div>';
    }

    if (paneUnits && state.detailTab === 'units' && node.level === 1) {
      paneUnits.innerHTML = renderGoodsUnitsPane(node);
    }

    if (paneAttrCats && state.detailTab === 'attrcats' && node.level === 1) {
      paneAttrCats.innerHTML = renderAttributeCategoriesPane(node);
    }

    if (paneAttrs && state.detailTab === 'attrs') {
      paneAttrs.innerHTML = renderAttributesPane(node);
    }

    if (paneProducts && node.level === 4) {
      var products = store.getBindings(node.id);
      var listHtml = products.length
        ? products.map(function (product) {
          return (
            '<div class="product-category-bound-item">' +
            '<img class="product-category-bound-item__img" src="' + product.img + '" alt="">' +
            '<div class="product-category-bound-item__info">' +
            '  <div class="product-category-bound-item__name">' + escapeHtml(product.name) + '</div>' +
            '  <div class="product-category-bound-item__code">' + escapeHtml(product.sku || '') + '</div>' +
            '</div>' +
            '</div>'
          );
        }).join('')
        : '<div class="product-category-detail__products-empty">暂无绑定商品；删除分类前需解绑全部商品</div>';

      paneProducts.innerHTML =
        '<div class="product-category-detail__products-head">共 ' + products.length + ' 个商品</div>' +
        '<div class="product-category-bound-list">' + listHtml + '</div>';
    }
  }

  function renderAll() {
    var l1List = store.getByLevel(1);
    var l2List = state.selectedL1 ? store.getChildren(state.selectedL1) : [];
    var l3List = state.selectedL2 ? store.getChildren(state.selectedL2) : [];
    var l4List = state.selectedL3 ? store.getChildren(state.selectedL3) : [];

    renderColumn(document.getElementById('catListL1'), l1List, state.selectedL1, true, '暂无一级分类');
    renderColumn(
      document.getElementById('catListL2'),
      l2List,
      state.selectedL2,
      true,
      state.selectedL1 ? '该一级下暂无二级分类' : '请先选择一级分类'
    );
    renderColumn(
      document.getElementById('catListL3'),
      l3List,
      state.selectedL3,
      true,
      state.selectedL2 ? '该二级下暂无三级分类' : '请先选择二级分类'
    );
    renderColumn(
      document.getElementById('catListL4'),
      l4List,
      state.selectedL4,
      true,
      state.selectedL3 ? '该三级下暂无四级分类' : '请先选择三级分类'
    );

    syncAddButtons();
    syncHints();
    renderDetail();
  }

  function clearFrom(level) {
    var current = level;
    while (current <= 4) {
      setSelectedId(current, null);
      current += 1;
    }
  }

  function selectLevel(level, id) {
    state.detailFocusId = id;
    setSelectedId(level, id);
    clearFrom(level + 1);
    renderAll();
  }

  function ensureDefaultSelection() {
    var l1 = state.selectedL1 ? store.getNode(state.selectedL1) : null;
    if (!l1 || l1.level !== 1) {
      clearFrom(1);
      return;
    }
    var l2 = state.selectedL2 ? store.getNode(state.selectedL2) : null;
    if (!l2 || l2.parent_id !== state.selectedL1) {
      clearFrom(2);
      return;
    }
    var l3 = state.selectedL3 ? store.getNode(state.selectedL3) : null;
    if (!l3 || l3.parent_id !== state.selectedL2) {
      clearFrom(3);
      return;
    }
    var l4 = state.selectedL4 ? store.getNode(state.selectedL4) : null;
    if (!l4 || l4.parent_id !== state.selectedL3) clearFrom(4);
  }

  function closeModal() {
    var modal = document.querySelector('[data-master-category-modal]');
    if (modal) modal.remove();
  }

  function renderFieldLabel(text, required) {
    var req = required ? '<span class="erp-req">*</span>' : '';
    return req + escapeHtml(text);
  }

  function renderCategoryIconUploadField(required) {
    return (
      '<div class="product-category-modal__field">' +
      '  <label class="product-category-modal__label">' + renderFieldLabel('分类图标', required) + (required ? '' : '<span class="product-category-modal__optional">选填</span>') + '</label>' +
      '  <div class="product-add-upload product-category-modal__upload">' +
      '    <button type="button" class="product-add-upload__box" id="masterCatIconBtn" aria-label="上传分类图标">' +
      '      <span class="product-add-upload__plus">+</span>' +
      '    </button>' +
      '    <input type="file" id="masterCatIconFile" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden>' +
      '    <p class="product-add-upload__hint">支持 JPG/PNG/WEBP/SVG，建议正方形，单张不超过 2MB</p>' +
      '  </div>' +
      '</div>'
    );
  }

  function setupCategoryIconUpload(backdrop, initialIcon) {
    var iconValue = initialIcon || '';
    var btn = backdrop.querySelector('#masterCatIconBtn');
    var fileInput = backdrop.querySelector('#masterCatIconFile');

    function renderPreview() {
      if (!btn) return;
      if (!iconValue) {
        btn.innerHTML = '<span class="product-add-upload__plus">+</span>';
        btn.classList.remove('product-add-upload__box--filled');
        return;
      }
      btn.innerHTML = '<img class="product-category-modal__icon-preview" src="" alt="">';
      btn.classList.add('product-add-upload__box--filled');
      var img = btn.querySelector('.product-category-modal__icon-preview');
      if (img) img.src = iconValue;
    }

    renderPreview();
    if (btn && fileInput) {
      btn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!/^image\/(jpeg|png|webp|svg\+xml)$/.test(file.type)) {
          if (typeof showToast === 'function') showToast('请上传 JPG/PNG/WEBP/SVG 格式图片', 'warning');
          fileInput.value = '';
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          if (typeof showToast === 'function') showToast('图片不能超过 2MB', 'warning');
          fileInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          iconValue = reader.result;
          renderPreview();
        };
        reader.readAsDataURL(file);
      });
    }

    return function getCategoryIconValue() {
      return iconValue;
    };
  }

  function parentAt(level) {
    var id = selectedId(level);
    return id ? store.getNode(id) : null;
  }

  function nextCodeSegment(parentId) {
    var max = 9;
    store.getCategories().forEach(function (item) {
      if ((item.parent_id || null) !== (parentId || null)) return;
      var current = parseInt(item.code_segment, 10);
      if (!isNaN(current) && current > max) max = current;
    });
    var next = max + 1;
    if (next > 99) return '';
    return next < 10 ? '0' + next : String(next);
  }

  function openCategoryModal(options) {
    closeModal();
    options = options || {};
    var isEdit = !!options.node;
    var node = options.node;
    var createLevel = options.createLevel || 1;
    var parents = [];
    if (!isEdit) {
      for (var level = 1; level < createLevel; level += 1) {
        parents.push(parentAt(level));
      }
    }

    var title = isEdit ? '编辑分类' : '新增' + LEVEL_LABEL[createLevel];
    var hint = isEdit
      ? '编辑「' + node.path + '」'
      : createLevel === 1
        ? '请完整填写分类信息。'
        : '将在「' + parents.map(function (item) { return item && item.name; }).filter(Boolean).join(' / ') + '」下创建' + LEVEL_LABEL[createLevel] + '。';

    var readonlyHtml = '';
    if (!isEdit && createLevel > 1) {
      readonlyHtml = parents.map(function (item, index) {
        if (!item) return '';
        return '<div class="product-category-modal__readonly"><label>所属' + LEVEL_LABEL[index + 1] + '</label><span>' + escapeHtml(item.name) + '</span></div>';
      }).join('');
    }

    var codeParent = isEdit
      ? (node.parent_id ? store.getNode(node.parent_id) : null)
      : (createLevel > 1 ? parents[parents.length - 1] : null);
    var parentPrefix = codeParent && codeParent.code ? codeParent.code : '';
    var createParentId = isEdit ? (node.parent_id || null) : (codeParent ? codeParent.id : null);
    var segmentValue = isEdit ? (node.code_segment || '') : nextCodeSegment(createParentId);
    var fullPreview = segmentValue ? parentPrefix + segmentValue : '—';
    var prefixHtml = parentPrefix
      ? '<span class="master-data-code__prefix">' + escapeHtml(parentPrefix) + '</span>'
      : '';

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-master-category-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-category-modal">' +
      '  <div class="erp-modal__header"><h2 class="erp-modal__title">' + title + '</h2>' +
      '    <div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button></div></div>' +
      '  <div class="erp-modal__body"><p class="product-category-modal__hint">' + escapeHtml(hint) + '</p>' +
      readonlyHtml +
      '    <div class="product-category-modal__field"><label class="product-category-modal__label" for="masterCatCode">' + renderFieldLabel('分类编码', true) + '</label>' +
      '      <div class="master-data-code">' + prefixHtml +
      '        <input class="product-category-modal__input master-data-code__input master-data-code__input--locked" id="masterCatCode" type="text" value="' + escapeHtml(segmentValue) + '" readonly tabindex="-1">' +
      '      </div>' +
      '      <p class="master-data-code__preview">完整编码：<strong id="masterCatCodeFull">' + escapeHtml(fullPreview) + '</strong></p>' +
      '    </div>' +
      '    <div class="product-category-modal__field"><label class="product-category-modal__label" for="masterCatName">' + renderFieldLabel('分类名称', true) + '</label><input class="product-category-modal__input" id="masterCatName" type="text" placeholder="请输入分类名称" value="' + escapeHtml(isEdit ? node.name : '') + '"></div>' +
      renderCategoryIconUploadField(true) +
      '    <div class="product-category-modal__field"><label class="product-category-modal__label" for="masterCatSort">' + renderFieldLabel('排序', true) + '</label><input class="product-category-modal__input" id="masterCatSort" type="number" min="0" placeholder="请输入排序" value="' + (isEdit ? node.sort : '') + '"></div>' +
      '  </div>' +
      '  <div class="erp-modal__footer"><button type="button" class="erp-btn" data-modal-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-modal-save>确定</button></div></div>';

    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeModal(); });
    backdrop.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    var getCategoryIconValue = setupCategoryIconUpload(backdrop, isEdit ? (node.icon || '') : '');

    backdrop.querySelector('[data-modal-save]').addEventListener('click', function () {
      var name = ((document.getElementById('masterCatName') || {}).value || '').trim();
      var icon = getCategoryIconValue();
      var sortInput = document.getElementById('masterCatSort');
      var sortText = sortInput ? String(sortInput.value || '').trim() : '';
      var sort = parseInt(sortText, 10);
      var parentId = isEdit
        ? (node.parent_id || null)
        : (createLevel === 1 ? null : (parents[parents.length - 1] ? parents[parents.length - 1].id : null));
      var segment = isEdit ? (node.code_segment || '') : nextCodeSegment(parentId);
      if (!segment) {
        if (typeof showToast === 'function') showToast('同级分类编码已用完', 'warning');
        return;
      }
      if (!name) {
        if (typeof showToast === 'function') showToast('请输入分类名称', 'warning');
        return;
      }
      if (!icon) {
        if (typeof showToast === 'function') showToast('请上传分类图标', 'warning');
        return;
      }
      if (sortText === '' || isNaN(sort) || sort < 0) {
        if (typeof showToast === 'function') showToast('请输入排序', 'warning');
        return;
      }
      var fullCode = parentPrefix + segment;
      var siblings = store.getCategories().filter(function (item) {
        return (item.parent_id || null) === parentId && (!isEdit || item.id !== node.id);
      });
      if (!isEdit && siblings.some(function (item) { return item.code_segment === segment; })) {
        if (typeof showToast === 'function') showToast('同级下已存在相同分类编码', 'warning');
        return;
      }
      if (siblings.some(function (item) { return item.name === name; })) {
        if (typeof showToast === 'function') showToast('同级下已存在同名分类', 'warning');
        return;
      }
      if (siblings.some(function (item) { return parseInt(item.sort, 10) === sort; })) {
        if (typeof showToast === 'function') showToast('同级下已存在相同排序', 'warning');
        return;
      }

      if (isEdit) {
        node.name = name;
        node.icon = icon;
        node.sort = sort;
        store.updateCategory(node);
        closeModal();
        renderAll();
        if (typeof showToast === 'function') showToast('分类已更新', 'success');
        return;
      }

      var parent = createLevel === 1 ? null : parents[parents.length - 1];

      var newId = genId('cat');
      var newNode = {
        id: newId,
        name: name,
        code_segment: segment,
        code: fullCode,
        level: createLevel,
        parent_id: parentId,
        path: parent ? parent.path + '/' + name : name,
        path_ids: parent ? parent.path_ids.concat([newId]) : [newId],
        icon: icon,
        sort: sort,
        status: 'on_shelf',
        is_leaf: createLevel === 4,
        product_count: 0,
        attributes: [],
        attribute_categories: [],
        goods_units: [],
        created_at: nowStr()
      };
      store.addCategory(newNode);
      setSelectedId(createLevel, newId);
      state.detailFocusId = newId;
      if (createLevel < 4) {
        for (var next = createLevel + 1; next <= 4; next += 1) setSelectedId(next, null);
      }
      closeModal();
      renderAll();
      if (typeof showToast === 'function') showToast('分类已创建', 'success');
    });

    document.body.appendChild(backdrop);
    var nameInput = document.getElementById('masterCatName');
    if (nameInput) nameInput.focus();
  }

  var ATTR_MAX_LEVEL = 5;
  var ATTR_LEVEL_TEXT = ['', '一', '二', '三', '四', '五'];

  function attrLevelText(level) {
    return (ATTR_LEVEL_TEXT[level] || String(level)) + '级属性';
  }

  function describeAttrValue(value) {
    if (typeof value === 'string') return { text: value, children: [] };
    return {
      text: value && value.text ? String(value.text) : '',
      children: ((value && value.children) || []).map(function (child) {
        return {
          name: (child && child.name) || '',
          values: ((child && child.values) || []).map(describeAttrValue)
        };
      })
    };
  }

  function renderAttrTree(values) {
    var items = (values || []).map(describeAttrValue).filter(function (item) { return item.text; });
    var hasChild = items.some(function (item) {
      return (item.children || []).some(function (child) { return child.name; });
    });
    if (!hasChild) {
      return '<div class="master-data-attr-chips">' + renderAttrChips(items.map(function (item) { return item.text; })) + '</div>';
    }
    return '<div class="master-data-attr-branches">' + items.map(function (item) {
      var children = (item.children || []).filter(function (child) { return child.name; }).map(function (child) {
        return '<div class="master-data-attr-sub">' +
          '<div class="master-data-attr-sub__name">' + escapeHtml(child.name) + '</div>' +
          renderAttrTree(child.values) + '</div>';
      }).join('');
      return '<div class="master-data-attr-branch">' +
        '<div class="master-data-attr-branch__value">' + renderAttrChips([item.text]) + '</div>' +
        (children ? '<div class="master-data-attr-branch__children">' + children + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  function renderAttrChips(values) {
    var list = (values || []).filter(Boolean);
    if (!list.length) return '<span class="master-data-attr-chip is-empty">未设置</span>';
    return list.map(function (text) {
      return '<span class="master-data-attr-chip">' + escapeHtml(text) + '</span>';
    }).join('');
  }

  function renderAttributeRow(node, row) {
    var attr = row.attr;
    var inheritFrom = LEVEL_LABEL[row.sourceLevel] || '上级分类';
    var inheritTip = '继承自' + inheritFrom + '，不可操作';
    var opsHtml = row.inherited
      ? '<button type="button" class="product-action__link" disabled title="' + escapeHtml(inheritTip) + '">编辑</button>' +
        '<button type="button" class="product-action__link" disabled title="' + escapeHtml(inheritTip) + '">删除</button>'
      : '<button type="button" class="product-action__link" data-attr-edit data-cat-id="' + node.id + '" data-attr-id="' + attr.id + '">编辑</button>' +
        '<button type="button" class="product-action__link product-action__link--muted" data-attr-delete data-cat-id="' + node.id + '" data-attr-id="' + attr.id + '">删除</button>';
    return (
      '<div class="master-data-attr' + (row.inherited ? ' master-data-attr--inherited' : '') + '">' +
      '<div class="master-data-attr__line">' +
      '<div class="master-data-attr__name">' + escapeHtml(attr.name) +
      '<span class="master-data-attr__sort">排序 ' + escapeHtml(String(attr.sort != null && attr.sort !== '' ? attr.sort : 0)) + '</span>' +
      (row.inherited ? '<span class="master-data-attr__inherit">继承自' + escapeHtml(inheritFrom) + '</span>' : '') +
      '</div>' +
      '<div class="master-data-attr__body">' + renderAttrTree(attr.values) + '</div>' +
      '<div class="master-data-attr__ops">' + opsHtml + '</div></div>' +
      '</div>'
    );
  }

  function renderGoodsUnitsPane(node) {
    var list = store.getGoodsUnits(node.id);
    var rows = list.length
      ? '<div class="master-data-attr__list">' + list.map(function (item) {
        return (
          '<div class="master-data-attr master-data-attrcat">' +
          '<div class="master-data-attr__line">' +
          '<div class="master-data-attr__name">' + escapeHtml(item.name) +
          '<span class="master-data-attr__sort">排序 ' + escapeHtml(String(item.sort != null && item.sort !== '' ? item.sort : 0)) + '</span></div>' +
          '<div class="master-data-attr__ops">' +
          '<button type="button" class="product-action__link" data-goods-unit-edit data-cat-id="' + node.id + '" data-goods-unit-id="' + item.id + '">编辑</button>' +
          '<button type="button" class="product-action__link product-action__link--muted" data-goods-unit-delete data-cat-id="' + node.id + '" data-goods-unit-id="' + item.id + '">删除</button>' +
          '</div></div></div>'
        );
      }).join('') + '</div>'
      : '<div class="product-category-detail__products-empty">暂无商品单位；配置后，本一级下新增商品与供货关系仅可选这些单位</div>';
    return (
      '<div class="master-data-attr__head"><span>共 ' + list.length + ' 个商品单位</span>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-goods-unit-add data-cat-id="' + node.id + '">新增单位</button></div>' +
      '<p class="product-category-modal__hint" style="margin:0 0 12px">单位从供应链全局枚举中选择；配置后对该一级分类下全部下级生效。</p>' +
      rows
    );
  }

  function renderAttributeCategoriesPane(node) {
    var list = store.getAttributeCategories(node.id);
    var rows = list.length
      ? '<div class="master-data-attr__list">' + list.map(function (item) {
        return (
          '<div class="master-data-attr master-data-attrcat">' +
          '<div class="master-data-attr__line">' +
          '<div class="master-data-attr__name">' + escapeHtml(item.name) +
          '<span class="master-data-attr__sort">排序 ' + escapeHtml(String(item.sort != null && item.sort !== '' ? item.sort : 0)) + '</span></div>' +
          '<div class="master-data-attr__ops">' +
          '<button type="button" class="product-action__link" data-attr-cat-edit data-cat-id="' + node.id + '" data-attr-cat-id="' + item.id + '">编辑</button>' +
          '<button type="button" class="product-action__link product-action__link--muted" data-attr-cat-delete data-cat-id="' + node.id + '" data-attr-cat-id="' + item.id + '">删除</button>' +
          '</div></div></div>'
        );
      }).join('') + '</div>'
      : '<div class="product-category-detail__products-empty">暂无属性分类</div>';
    return (
      '<div class="master-data-attr__head"><span>共 ' + list.length + ' 个属性分类</span>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-attr-cat-add data-cat-id="' + node.id + '">新增属性分类</button></div>' +
      rows
    );
  }

  function renderAttributesPane(node) {
    var rows = store.listAttributeRows(node.id);
    var categories = store.getAttributeCategories(node.id);
    var grouped = {};
    var order = [];
    categories.forEach(function (item) {
      grouped[item.id] = { category: item, rows: [] };
      order.push(item.id);
    });
    var orphans = [];
    rows.forEach(function (row) {
      var bucket = grouped[row.attr && row.attr.category_id];
      if (bucket) bucket.rows.push(row);
      else orphans.push(row);
    });
    var sections = order.map(function (id) {
      return renderAttributeGroup(node, grouped[id].category.name, grouped[id].category.sort, grouped[id].rows);
    });
    if (orphans.length) sections.push(renderAttributeGroup(node, '未分类', '', orphans));
    var listHtml = sections.length
      ? sections.join('')
      : '<div class="product-category-detail__products-empty">暂无商品属性</div>';
    return (
      '<div class="master-data-attr__head"><span>共 ' + rows.length + ' 个属性</span>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-attr-add data-cat-id="' + node.id + '">新增属性</button></div>' +
      listHtml
    );
  }

  function renderAttributeGroup(node, name, sort, rows) {
    var sortHtml = sort === '' || sort == null
      ? ''
      : '<span class="master-data-attr__sort">排序 ' + escapeHtml(String(sort)) + '</span>';
    var body = rows.length
      ? '<div class="master-data-attr__list">' + rows.map(function (row) { return renderAttributeRow(node, row); }).join('') + '</div>'
      : '<div class="master-data-attr-group__empty">暂无商品属性</div>';
    return (
      '<section class="master-data-attr-group">' +
      '<h4 class="master-data-attr-group__title">' + escapeHtml(name) + sortHtml +
      '<span class="master-data-attr-group__count">' + rows.length + ' 个属性</span></h4>' +
      body +
      '</section>'
    );
  }

  function closeAttrModal() {
    var modal = document.querySelector('[data-master-attr-modal]');
    if (modal) modal.remove();
  }

  function openAttributeModal(catId, attrId) {
    closeAttrModal();
    var node = store.getNode(catId);
    if (!node) return;
    var attrs = store.getAttributes(catId);
    var current = null;
    if (attrId) {
      for (var i = 0; i < attrs.length; i += 1) {
        if (attrs[i].id === attrId) current = attrs[i];
      }
      if (!current) return;
    }
    var attrCategories = store.getAttributeCategories(catId);
    var root = store.rootCategory(catId);
    var categoryOptions = '<option value="">请选择属性分类</option>' + attrCategories.map(function (item) {
      var selected = current && current.category_id === item.id ? ' selected' : '';
      return '<option value="' + escapeHtml(item.id) + '"' + selected + '>' + escapeHtml(item.name) + '</option>';
    }).join('');
    var categoryHint = attrCategories.length
      ? ''
      : '<p class="product-category-modal__hint">请先在一级分类「' + escapeHtml(root ? root.name : '') + '」的属性分类页签中维护属性分类。</p>';
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-master-attr-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-category-modal master-data-attr-modal">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (current ? '编辑属性' : '新增属性') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-attr-modal-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><p class="product-category-modal__hint">维护「' + escapeHtml(node.name) + '」的商品属性。属性值下可继续添加下级属性，最多 5 级。</p>' +
      categoryHint +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterAttrCategory">' + renderFieldLabel('属性分类', true) + '</label>' +
      '<select class="product-category-modal__input" id="masterAttrCategory">' + categoryOptions + '</select></div>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterAttrName">' + renderFieldLabel('属性名称', true) + '</label>' +
      '<input class="product-category-modal__input" id="masterAttrName" type="text" placeholder="请输入属性名称" value="' + escapeHtml(current ? current.name : '') + '"></div>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterAttrSort">' + renderFieldLabel('排序', true) + '</label>' +
      '<input class="product-category-modal__input" id="masterAttrSort" type="number" min="0" placeholder="请输入排序" value="' + (current && current.sort != null && current.sort !== '' ? current.sort : '') + '"></div>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label">' + renderFieldLabel('属性值', true) + '</label>' +
      '<div class="master-data-attr-values" id="masterAttrValues" data-attr-value-list></div></div>' +
      '</div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-attr-modal-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-attr-modal-save>确定</button></div></div>';

    var valueList = backdrop.querySelector('#masterAttrValues');

    function valuePayload(value) {
      if (typeof value === 'string' || value == null) return { text: value || '', children: [] };
      return { text: value.text || '', children: value.children || [] };
    }

    function valueItemHtml(valueText, level) {
      var nextBtn = level < ATTR_MAX_LEVEL
        ? '<button type="button" class="master-data-attr-values__link" data-attr-child-add>' + attrLevelText(level + 1) + '</button>'
        : '';
      return (
        '<div class="master-data-attr-values__item" data-attr-value-item data-attr-level="' + level + '">' +
        '<div class="master-data-attr-values__row">' +
        '<input class="product-category-modal__input" data-attr-value-input type="text" placeholder="请输入属性值" value="' + escapeHtml(valueText || '') + '">' +
        '<button type="button" class="master-data-attr-values__btn master-data-attr-values__btn--add" data-attr-value-add aria-label="添加属性值">+</button>' +
        '<button type="button" class="master-data-attr-values__btn" data-attr-value-remove aria-label="删除该属性值">−</button>' +
        nextBtn +
        '</div>' +
        '<div class="master-data-attr-values__children" data-attr-children></div>' +
        '</div>'
      );
    }

    function childBlockHtml(child, level) {
      var childId = child && child.id ? child.id : genId('attr-child');
      var levelName = attrLevelText(level);
      return (
        '<div class="master-data-attr-child" data-attr-child data-child-id="' + childId + '" data-attr-level="' + level + '">' +
        '<div class="master-data-attr-child__head"><span>' + levelName + '</span>' +
        '<button type="button" class="product-action__link product-action__link--muted" data-attr-child-remove>删除</button></div>' +
        '<div class="master-data-attr-child__field"><label class="master-data-attr-child__label">' + renderFieldLabel('属性名称', true) + '</label>' +
        '<input class="product-category-modal__input" data-attr-child-name type="text" placeholder="请输入' + levelName + '名称" value="' + escapeHtml(child && child.name ? child.name : '') + '"></div>' +
        '<div class="master-data-attr-child__field"><div class="master-data-attr-child__label">' + renderFieldLabel('属性值', true) + '</div>' +
        '<div class="master-data-attr-values" data-attr-value-list></div></div>' +
        '</div>'
      );
    }

    function syncRemoveState(container) {
      if (!container) return;
      var items = container.querySelectorAll(':scope > [data-attr-value-item]');
      var onlyEmpty = items.length === 1 && !(items[0].querySelector('[data-attr-value-input]') || {}).value.trim();
      items.forEach(function (item, index) {
        var removeBtn = item.querySelector(':scope > .master-data-attr-values__row [data-attr-value-remove]');
        if (removeBtn) removeBtn.disabled = onlyEmpty && index === 0;
      });
    }

    function appendChildBlock(childrenEl, child, level) {
      if (!childrenEl || level > ATTR_MAX_LEVEL) return null;
      var holder = document.createElement('div');
      holder.innerHTML = childBlockHtml(child || {}, level);
      var block = holder.firstChild;
      childrenEl.appendChild(block);
      var list = block.querySelector('[data-attr-value-list]');
      var values = child && child.values && child.values.length ? child.values : [''];
      values.forEach(function (value) { appendValueItem(list, value, level); });
      return block;
    }

    function appendValueItem(container, value, level, afterItem) {
      if (!container) return null;
      var payload = valuePayload(value);
      var holder = document.createElement('div');
      holder.innerHTML = valueItemHtml(payload.text, level);
      var item = holder.firstChild;
      if (afterItem && afterItem.parentNode === container) container.insertBefore(item, afterItem.nextSibling);
      else container.appendChild(item);
      var childrenEl = item.querySelector(':scope > [data-attr-children]');
      payload.children.forEach(function (child) { appendChildBlock(childrenEl, child, level + 1); });
      syncRemoveState(container);
      return item;
    }

    function readChildren(childrenEl, level) {
      if (!childrenEl || level > ATTR_MAX_LEVEL) return [];
      var blocks = childrenEl.querySelectorAll(':scope > [data-attr-child]');
      var children = [];
      var seenNames = {};
      var levelName = attrLevelText(level);
      for (var i = 0; i < blocks.length; i += 1) {
        var block = blocks[i];
        var childName = (block.querySelector('[data-attr-child-name]') || {}).value.trim();
        if (!childName) {
          if (typeof showToast === 'function') showToast('请输入' + levelName + '名称', 'warning');
          return null;
        }
        if (seenNames[childName]) {
          if (typeof showToast === 'function') showToast(levelName + '名称不能重复', 'warning');
          return null;
        }
        seenNames[childName] = true;
        var childValues = readValueList(block.querySelector('[data-attr-value-list]'), level);
        if (!childValues) return null;
        children.push({
          id: block.getAttribute('data-child-id'),
          name: childName,
          values: childValues
        });
      }
      return children;
    }

    function readValueList(container, level) {
      var items = container ? container.querySelectorAll(':scope > [data-attr-value-item]') : [];
      var values = [];
      var seenValues = {};
      for (var i = 0; i < items.length; i += 1) {
        var item = items[i];
        var valueText = (item.querySelector(':scope > .master-data-attr-values__row [data-attr-value-input]') || {}).value.trim();
        if (!valueText) {
          if (typeof showToast === 'function') showToast('请输入属性值', 'warning');
          return null;
        }
        if (seenValues[valueText]) {
          if (typeof showToast === 'function') showToast('属性值不能重复', 'warning');
          return null;
        }
        seenValues[valueText] = true;
        var children = readChildren(item.querySelector(':scope > [data-attr-children]'), level + 1);
        if (!children) return null;
        values.push({ text: valueText, children: children });
      }
      if (!values.length) {
        if (typeof showToast === 'function') showToast('请输入属性值', 'warning');
        return null;
      }
      return values;
    }

    var initialValues = current && current.values && current.values.length ? current.values : [''];
    initialValues.forEach(function (value) { appendValueItem(valueList, value, 1); });

    if (valueList) {
      valueList.addEventListener('click', function (ev) {
        var childAdd = ev.target.closest('[data-attr-child-add]');
        if (childAdd) {
          var owner = childAdd.closest('[data-attr-value-item]');
          var ownerLevel = parseInt(owner.getAttribute('data-attr-level'), 10) || 1;
          if (ownerLevel >= ATTR_MAX_LEVEL) return;
          var addedChild = appendChildBlock(owner.querySelector(':scope > [data-attr-children]'), {}, ownerLevel + 1);
          var childNameInput = addedChild && addedChild.querySelector('[data-attr-child-name]');
          if (childNameInput) childNameInput.focus();
          return;
        }
        var childRemove = ev.target.closest('[data-attr-child-remove]');
        if (childRemove) {
          var childBlock = childRemove.closest('[data-attr-child]');
          if (childBlock) childBlock.remove();
          return;
        }
        var addBtn = ev.target.closest('[data-attr-value-add]');
        if (addBtn) {
          var source = addBtn.closest('[data-attr-value-item]');
          var sourceLevel = parseInt(source.getAttribute('data-attr-level'), 10) || 1;
          var added = appendValueItem(source.parentElement, '', sourceLevel, source);
          var input = added && added.querySelector('[data-attr-value-input]');
          if (input) input.focus();
          return;
        }
        var removeBtn = ev.target.closest('[data-attr-value-remove]');
        if (!removeBtn || removeBtn.disabled) return;
        var item = removeBtn.closest('[data-attr-value-item]');
        if (!item || !item.parentElement) return;
        var container = item.parentElement;
        if (container.querySelectorAll(':scope > [data-attr-value-item]').length <= 1) {
          var lone = item.querySelector('[data-attr-value-input]');
          if (lone) lone.value = '';
          var childrenBox = item.querySelector(':scope > [data-attr-children]');
          if (childrenBox) childrenBox.innerHTML = '';
        } else {
          item.remove();
        }
        syncRemoveState(container);
      });
      valueList.addEventListener('input', function (ev) {
        if (!ev.target.matches('[data-attr-value-input]')) return;
        var item = ev.target.closest('[data-attr-value-item]');
        if (item && item.parentElement) syncRemoveState(item.parentElement);
      });
    }

    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeAttrModal(); });
    backdrop.querySelectorAll('[data-attr-modal-close], [data-attr-modal-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeAttrModal);
    });
    backdrop.querySelector('[data-attr-modal-save]').addEventListener('click', function () {
      var categoryId = (document.getElementById('masterAttrCategory') || {}).value || '';
      if (!categoryId) {
        if (typeof showToast === 'function') showToast('请选择属性分类', 'warning');
        return;
      }
      var name = (document.getElementById('masterAttrName') || {}).value.trim();
      if (!name) {
        if (typeof showToast === 'function') showToast('请输入属性名称', 'warning');
        return;
      }
      var sortInput = document.getElementById('masterAttrSort');
      var sortText = sortInput ? String(sortInput.value || '').trim() : '';
      var sort = parseInt(sortText, 10);
      if (sortText === '' || isNaN(sort) || sort < 0) {
        if (typeof showToast === 'function') showToast('请输入排序', 'warning');
        return;
      }
      var sortDuplicated = attrs.some(function (item) {
        if (current && item.id === current.id) return false;
        return parseInt(item.sort, 10) === sort;
      });
      if (sortDuplicated) {
        if (typeof showToast === 'function') showToast('同级下已存在相同排序', 'warning');
        return;
      }
      var duplicated = store.listAttributeRows(catId).some(function (row) {
        if (row.attr.name !== name) return false;
        if (current && !row.inherited && row.attr.id === current.id) return false;
        return true;
      });
      if (duplicated) {
        if (typeof showToast === 'function') showToast('已存在同名属性', 'warning');
        return;
      }
      var values = readValueList(valueList, 1);
      if (!values) return;
      var next = {
        id: current ? current.id : genId('attr'),
        name: name,
        sort: sort,
        category_id: categoryId,
        values: values
      };
      if (current && current.independent_sku) next.independent_sku = current.independent_sku;
      var list = current
        ? attrs.map(function (item) { return item.id === next.id ? next : item; })
        : attrs.concat([next]);
      store.setAttributes(catId, list);
      closeAttrModal();
      renderAll();
      if (typeof showToast === 'function') showToast(current ? '属性已更新' : '属性已新增', 'success');
    });
    document.body.appendChild(backdrop);
    var nameInput = document.getElementById('masterAttrName');
    if (nameInput) nameInput.focus();
  }

  function deleteAttribute(catId, attrId) {
    var attrs = store.getAttributes(catId);
    var attr = null;
    for (var i = 0; i < attrs.length; i += 1) {
      if (attrs[i].id === attrId) attr = attrs[i];
    }
    if (!attr) return;
    openWarmConfirm('确定删除属性「' + attr.name + '」？', function () {
      store.setAttributes(catId, attrs.filter(function (item) { return item.id !== attrId; }));
      renderAll();
      if (typeof showToast === 'function') showToast('属性已删除', 'success');
    });
  }

  function closeGoodsUnitModal() {
    var modal = document.querySelector('[data-master-goods-unit-modal]');
    if (modal) modal.remove();
  }

  function openGoodsUnitModal(l1Id, unitId) {
    closeGoodsUnitModal();
    var node = store.getNode(l1Id);
    if (!node || node.level !== 1) return;
    var list = store.getGoodsUnits(l1Id);
    var current = null;
    if (unitId) {
      for (var i = 0; i < list.length; i += 1) {
        if (list[i].id === unitId) current = list[i];
      }
      if (!current) return;
    }
    var enumList = (window.MasterDataGoodsUnits && window.MasterDataGoodsUnits.list)
      ? window.MasterDataGoodsUnits.list.slice()
      : [];
    var usedNames = {};
    list.forEach(function (item) {
      if (!current || item.id !== current.id) usedNames[item.name] = true;
    });
    var options = enumList.filter(function (name) {
      return current && current.name === name ? true : !usedNames[name];
    });
    if (!options.length) {
      if (typeof showToast === 'function') showToast(current ? '没有可切换的单位' : '全局枚举中的单位已全部添加', 'warning');
      return;
    }
    var optionHtml = options.map(function (name) {
      var selected = current && current.name === name ? ' selected' : (!current && name === options[0] ? ' selected' : '');
      return '<option value="' + escapeHtml(name) + '"' + selected + '>' + escapeHtml(name) + '</option>';
    }).join('');
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-master-goods-unit-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-category-modal">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (current ? '编辑商品单位' : '新增商品单位') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-goods-unit-modal-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><p class="product-category-modal__hint">维护一级分类「' + escapeHtml(node.name) + '」的商品单位。配置后，该一级下新增商品与供货关系仅可选这些单位。</p>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterGoodsUnitName">' + renderFieldLabel('单位', true) + '</label>' +
      '<select class="product-category-modal__input" id="masterGoodsUnitName">' + optionHtml + '</select></div>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterGoodsUnitSort">' + renderFieldLabel('排序', true) + '</label>' +
      '<input class="product-category-modal__input" id="masterGoodsUnitSort" type="number" min="0" placeholder="请输入排序" value="' + (current && current.sort != null && current.sort !== '' ? current.sort : '') + '"></div>' +
      '</div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-goods-unit-modal-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-goods-unit-modal-save>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeGoodsUnitModal(); });
    backdrop.querySelectorAll('[data-goods-unit-modal-close], [data-goods-unit-modal-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeGoodsUnitModal);
    });
    backdrop.querySelector('[data-goods-unit-modal-save]').addEventListener('click', function () {
      var nameEl = document.getElementById('masterGoodsUnitName');
      var name = nameEl ? String(nameEl.value || '').trim() : '';
      if (!name) {
        if (typeof showToast === 'function') showToast('请选择单位', 'warning');
        return;
      }
      if (enumList.indexOf(name) < 0) {
        if (typeof showToast === 'function') showToast('请从全局单位枚举中选择', 'warning');
        return;
      }
      var sortInput = document.getElementById('masterGoodsUnitSort');
      var sortText = sortInput ? String(sortInput.value || '').trim() : '';
      var sort = parseInt(sortText, 10);
      if (sortText === '' || isNaN(sort) || sort < 0) {
        if (typeof showToast === 'function') showToast('请输入排序', 'warning');
        return;
      }
      if (list.some(function (item) { return (!current || item.id !== current.id) && item.name === name; })) {
        if (typeof showToast === 'function') showToast('该单位已添加', 'warning');
        return;
      }
      if (list.some(function (item) { return (!current || item.id !== current.id) && parseInt(item.sort, 10) === sort; })) {
        if (typeof showToast === 'function') showToast('同级下已存在相同排序', 'warning');
        return;
      }
      var next = {
        id: current ? current.id : genId('gunit'),
        name: name,
        sort: sort
      };
      var saved = current
        ? list.map(function (item) { return item.id === next.id ? next : item; })
        : list.concat([next]);
      store.setGoodsUnits(l1Id, saved);
      closeGoodsUnitModal();
      renderAll();
      if (typeof showToast === 'function') showToast(current ? '商品单位已更新' : '商品单位已新增', 'success');
    });
    document.body.appendChild(backdrop);
    var sortEl = document.getElementById('masterGoodsUnitSort');
    if (sortEl) sortEl.focus();
  }

  function deleteGoodsUnit(l1Id, unitId) {
    var list = store.getGoodsUnits(l1Id);
    var current = null;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === unitId) current = list[i];
    }
    if (!current) return;
    openWarmConfirm('确定删除商品单位「' + current.name + '」？', function () {
      store.setGoodsUnits(l1Id, list.filter(function (item) { return item.id !== unitId; }));
      renderAll();
      if (typeof showToast === 'function') showToast('商品单位已删除', 'success');
    });
  }

  function closeAttrCategoryModal() {
    var modal = document.querySelector('[data-master-attr-cat-modal]');
    if (modal) modal.remove();
  }

  function openAttrCategoryModal(l1Id, categoryId) {
    closeAttrCategoryModal();
    var node = store.getNode(l1Id);
    if (!node || node.level !== 1) return;
    var list = store.getAttributeCategories(l1Id);
    var current = null;
    if (categoryId) {
      for (var i = 0; i < list.length; i += 1) {
        if (list[i].id === categoryId) current = list[i];
      }
      if (!current) return;
    }
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-master-attr-cat-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-category-modal">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (current ? '编辑属性分类' : '新增属性分类') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-attr-cat-modal-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><p class="product-category-modal__hint">维护一级分类「' + escapeHtml(node.name) + '」的属性分类。下级分类的商品属性从这里选择。</p>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterAttrCatName">' + renderFieldLabel('属性分类', true) + '</label>' +
      '<input class="product-category-modal__input" id="masterAttrCatName" type="text" placeholder="请输入属性分类" value="' + escapeHtml(current ? current.name : '') + '"></div>' +
      '<div class="product-category-modal__field"><label class="product-category-modal__label" for="masterAttrCatSort">' + renderFieldLabel('排序', true) + '</label>' +
      '<input class="product-category-modal__input" id="masterAttrCatSort" type="number" min="0" placeholder="请输入排序" value="' + (current && current.sort != null && current.sort !== '' ? current.sort : '') + '"></div>' +
      '</div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-attr-cat-modal-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-attr-cat-modal-save>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeAttrCategoryModal(); });
    backdrop.querySelectorAll('[data-attr-cat-modal-close], [data-attr-cat-modal-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeAttrCategoryModal);
    });
    backdrop.querySelector('[data-attr-cat-modal-save]').addEventListener('click', function () {
      var name = (document.getElementById('masterAttrCatName') || {}).value.trim();
      if (!name) {
        if (typeof showToast === 'function') showToast('请输入属性分类', 'warning');
        return;
      }
      var sortInput = document.getElementById('masterAttrCatSort');
      var sortText = sortInput ? String(sortInput.value || '').trim() : '';
      var sort = parseInt(sortText, 10);
      if (sortText === '' || isNaN(sort) || sort < 0) {
        if (typeof showToast === 'function') showToast('请输入排序', 'warning');
        return;
      }
      if (list.some(function (item) { return (!current || item.id !== current.id) && item.name === name; })) {
        if (typeof showToast === 'function') showToast('已存在同名属性分类', 'warning');
        return;
      }
      if (list.some(function (item) { return (!current || item.id !== current.id) && parseInt(item.sort, 10) === sort; })) {
        if (typeof showToast === 'function') showToast('同级下已存在相同排序', 'warning');
        return;
      }
      var next = {
        id: current ? current.id : genId('acat'),
        name: name,
        sort: sort
      };
      var saved = current
        ? list.map(function (item) { return item.id === next.id ? next : item; })
        : list.concat([next]);
      store.setAttributeCategories(l1Id, saved);
      closeAttrCategoryModal();
      renderAll();
      if (typeof showToast === 'function') showToast(current ? '属性分类已更新' : '属性分类已新增', 'success');
    });
    document.body.appendChild(backdrop);
    var nameInput = document.getElementById('masterAttrCatName');
    if (nameInput) nameInput.focus();
  }

  function deleteAttributeCategory(l1Id, categoryId) {
    var list = store.getAttributeCategories(l1Id);
    var current = null;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === categoryId) current = list[i];
    }
    if (!current) return;
    if (store.isAttributeCategoryUsed(l1Id, categoryId)) {
      if (typeof showToast === 'function') showToast('该属性分类下已有商品属性，请先调整后再删除', 'warning');
      return;
    }
    openWarmConfirm('确定删除属性分类「' + current.name + '」？', function () {
      store.setAttributeCategories(l1Id, list.filter(function (item) { return item.id !== categoryId; }));
      renderAll();
      if (typeof showToast === 'function') showToast('属性分类已删除', 'success');
    });
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

  function deleteCategory(id) {
    if (!store.canDelete(id)) {
      if (typeof showToast === 'function') showToast(store.BLOCK_MSG, 'warning');
      return;
    }
    var node = store.getNode(id);
    if (!node) return;
    var descIds = store.collectDescendantIds(id);
    var msg = descIds.length > 1
      ? '删除「' + node.name + '」将同时删除其下 ' + (descIds.length - 1) + ' 个下级分类，确定继续？'
      : '确定删除分类「' + node.name + '」？';
    openWarmConfirm(msg, function () {
      store.removeCategoryTree(id);
      [1, 2, 3, 4].forEach(function (level) {
        if (descIds.indexOf(selectedId(level)) >= 0) setSelectedId(level, null);
      });
      if (descIds.indexOf(state.detailFocusId) >= 0) state.detailFocusId = null;
      ensureDefaultSelection();
      renderAll();
      if (typeof showToast === 'function') showToast('分类已删除', 'success');
    });
  }

  function toggleShelf(id, status) {
    var node = store.getNode(id);
    if (!node) return;
    if (status === 'on_shelf' && hasHiddenAncestor(node)) {
      if (typeof showToast === 'function') showToast('上级分类已隐藏，请先显示上级分类', 'warning');
      return;
    }
    store.setCategoryStatus(id, status);
    renderAll();
    if (typeof showToast === 'function') {
      showToast(status === 'on_shelf' ? '分类已显示' : '分类已隐藏', 'success');
    }
  }

  function bindEvents() {
    var addLevels = [
      { id: 'catAddL1', level: 1, need: 0, warn: '' },
      { id: 'catAddL2', level: 2, need: 1, warn: '请先选择一级分类' },
      { id: 'catAddL3', level: 3, need: 2, warn: '请先选择二级分类' },
      { id: 'catAddL4', level: 4, need: 3, warn: '请先选择三级分类' }
    ];
    addLevels.forEach(function (item) {
      var btn = document.getElementById(item.id);
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (item.need && !selectedId(item.need)) {
          if (typeof showToast === 'function') showToast(item.warn, 'warning');
          return;
        }
        openCategoryModal({ createLevel: item.level });
      });
    });

    ['catListL1', 'catListL2', 'catListL3', 'catListL4'].forEach(function (listId) {
      var el = document.getElementById(listId);
      if (!el) return;
      el.addEventListener('click', function (e) {
        var item = e.target.closest('.product-category-cascade__item[data-id]');
        if (!item) return;
        selectLevel(parseInt(item.getAttribute('data-level'), 10), item.getAttribute('data-id'));
      });
    });

    var tabs = document.getElementById('catDetailTabs');
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.product-category-detail__tab[data-tab]');
        if (!tab || tab.hidden) return;
        state.detailTab = tab.getAttribute('data-tab');
        renderDetail();
      });
    }

    var panel = document.getElementById('catDetailPanel');
    if (panel) {
      panel.addEventListener('click', function (e) {
        var actionBtn = e.target.closest('[data-detail-action]');
        if (actionBtn) {
          var action = actionBtn.getAttribute('data-detail-action');
          var id = actionBtn.getAttribute('data-id');
          if (action === 'edit') openCategoryModal({ node: store.getNode(id) });
          else if (action === 'on-shelf') toggleShelf(id, 'on_shelf');
          else if (action === 'off-shelf') toggleShelf(id, 'off_shelf');
          else if (action === 'delete') deleteCategory(id);
          return;
        }
        var addAttrBtn = e.target.closest('[data-attr-add]');
        if (addAttrBtn) {
          openAttributeModal(addAttrBtn.getAttribute('data-cat-id'));
          return;
        }
        var addGoodsUnitBtn = e.target.closest('[data-goods-unit-add]');
        if (addGoodsUnitBtn) {
          openGoodsUnitModal(addGoodsUnitBtn.getAttribute('data-cat-id'));
          return;
        }
        var editGoodsUnitBtn = e.target.closest('[data-goods-unit-edit]');
        if (editGoodsUnitBtn) {
          openGoodsUnitModal(editGoodsUnitBtn.getAttribute('data-cat-id'), editGoodsUnitBtn.getAttribute('data-goods-unit-id'));
          return;
        }
        var delGoodsUnitBtn = e.target.closest('[data-goods-unit-delete]');
        if (delGoodsUnitBtn) {
          deleteGoodsUnit(delGoodsUnitBtn.getAttribute('data-cat-id'), delGoodsUnitBtn.getAttribute('data-goods-unit-id'));
          return;
        }
        var addAttrCatBtn = e.target.closest('[data-attr-cat-add]');
        if (addAttrCatBtn) {
          openAttrCategoryModal(addAttrCatBtn.getAttribute('data-cat-id'));
          return;
        }
        var editAttrCatBtn = e.target.closest('[data-attr-cat-edit]');
        if (editAttrCatBtn) {
          openAttrCategoryModal(editAttrCatBtn.getAttribute('data-cat-id'), editAttrCatBtn.getAttribute('data-attr-cat-id'));
          return;
        }
        var delAttrCatBtn = e.target.closest('[data-attr-cat-delete]');
        if (delAttrCatBtn) {
          deleteAttributeCategory(delAttrCatBtn.getAttribute('data-cat-id'), delAttrCatBtn.getAttribute('data-attr-cat-id'));
          return;
        }
        var editAttrBtn = e.target.closest('[data-attr-edit]');
        if (editAttrBtn) {
          openAttributeModal(editAttrBtn.getAttribute('data-cat-id'), editAttrBtn.getAttribute('data-attr-id'));
          return;
        }
        var delAttrBtn = e.target.closest('[data-attr-delete]');
        if (delAttrBtn) {
          deleteAttribute(delAttrBtn.getAttribute('data-cat-id'), delAttrBtn.getAttribute('data-attr-id'));
        }
      });
    }
  }

  function init() {
    store.load();
    ensureDefaultSelection();
    bindEvents();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
