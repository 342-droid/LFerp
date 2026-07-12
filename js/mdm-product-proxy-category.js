(function () {
  var wp = window.wmsPath || { page: function (f) { return f; } };
  var store = window.MdmProxyCategoryStore;

  var state = {
    selectedL1: null,
    selectedL2: null,
    selectedL3: null,
    detailTab: 'info',
    detailFocusId: null,
    pickerInstance: null
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

  function renderStatusTag(status) {
    if (status === 'off_shelf') {
      return '<span class="product-tag product-tag--stopped">已下架</span>';
    }
    return '<span class="product-tag product-tag--on-shelf">已上架</span>';
  }

  function renderListItem(node, selectedId, showIcon) {
    var active = node.id === selectedId ? ' is-active' : '';
    var off = node.status === 'off_shelf' ? ' is-off' : '';
    var iconHtml = '';
    if (showIcon && node.icon) {
      iconHtml = '<img class="product-category-cascade__avatar" src="' + node.icon + '" alt="">';
    } else if (showIcon) {
      iconHtml = '<span class="product-category-cascade__avatar product-category-cascade__avatar--placeholder">' + escapeHtml(node.name.charAt(0)) + '</span>';
    }
    var hotHtml = node.is_hot ? '<span class="product-category-cascade__hot" title="爆品">🔥</span>' : '';
    var blocked = store.hasBindingsInTree(node.id);
    var lockHtml = blocked ? '<span class="product-category-cascade__lock" title="含绑定商品">🔒</span>' : '';
    return (
      '<li class="product-category-cascade__item' + active + off + '" data-id="' + node.id + '" data-level="' + node.level + '">' +
      iconHtml +
      '<span class="product-category-cascade__name">' + hotHtml + lockHtml + escapeHtml(node.name) + '</span>' +
      '<span class="product-category-cascade__count">' + node.product_count + '</span>' +
      '</li>'
    );
  }

  function renderColumn(listEl, nodes, selectedId, showIcon, emptyText) {
    if (!listEl) return;
    if (!nodes.length) {
      listEl.innerHTML = '<li class="product-category-cascade__empty">' + escapeHtml(emptyText) + '</li>';
      return;
    }
    listEl.innerHTML = nodes.map(function (n) { return renderListItem(n, selectedId, showIcon); }).join('');
  }

  function syncAddButtons() {
    var btnL2 = document.getElementById('catAddL2');
    var btnL3 = document.getElementById('catAddL3');
    if (btnL2) btnL2.disabled = !state.selectedL1;
    if (btnL3) btnL3.disabled = !state.selectedL2;
  }

  function syncHints() {
    var hintL2 = document.getElementById('catHintL2');
    var hintL3 = document.getElementById('catHintL3');
    var l1 = state.selectedL1 ? store.getNode(state.selectedL1) : null;
    var l2 = state.selectedL2 ? store.getNode(state.selectedL2) : null;
    if (hintL2) hintL2.textContent = l1 ? '所属：' + l1.name : '请先选择一级类目';
    if (hintL3) hintL3.textContent = l2 ? '所属：' + (l1 ? l1.name + ' / ' : '') + l2.name : '请先选择二级类目';
  }

  function getDetailNode() {
    if (state.detailFocusId) return store.getNode(state.detailFocusId);
    if (state.selectedL3) return store.getNode(state.selectedL3);
    if (state.selectedL2) return store.getNode(state.selectedL2);
    if (state.selectedL1) return store.getNode(state.selectedL1);
    return null;
  }

  function renderDetail() {
    var node = getDetailNode();
    if (!node) return;

    var breadcrumbEl = document.getElementById('catDetailBreadcrumb');
    if (breadcrumbEl) {
      var parts = node.path.split('/');
      breadcrumbEl.innerHTML = parts.map(function (p, i) {
        var cls = i === parts.length - 1 ? ' is-current' : '';
        return '<span class="product-category-detail__crumb' + cls + '">' + escapeHtml(p) + '</span>';
      }).join('<span class="product-category-detail__sep">/</span>');
    }

    var tabProducts = document.getElementById('catDetailTabProducts');
    if (tabProducts) tabProducts.hidden = node.level !== 3;
    if (node.level !== 3 && state.detailTab === 'products') state.detailTab = 'info';

    document.querySelectorAll('.product-category-detail__tab').forEach(function (tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-tab') === state.detailTab);
    });

    var paneInfo = document.getElementById('catDetailPaneInfo');
    var paneProducts = document.getElementById('catDetailPaneProducts');
    if (paneInfo) paneInfo.hidden = state.detailTab !== 'info';
    if (paneProducts) paneProducts.hidden = state.detailTab !== 'products';

    var blocked = store.hasBindingsInTree(node.id);

    if (paneInfo) {
      var levelText = node.level === 1 ? '一级 · 频道类目' : node.level === 2 ? '二级 · 分组类目' : '三级 · 叶子类目（商品挂载点）';
      var iconPreview = node.icon
        ? '<img class="product-category-detail__icon" src="' + node.icon + '" alt="">'
        : '<span class="product-category-detail__icon product-category-detail__icon--placeholder">' + escapeHtml(node.name.charAt(0)) + '</span>';

      var offShelfBtn = blocked
        ? '  <button type="button" class="erp-btn" disabled title="' + escapeHtml(store.BLOCK_MSG) + '">下架</button>'
        : '  <button type="button" class="erp-btn" data-detail-action="off-shelf" data-id="' + node.id + '">下架</button>';

      var deleteBtn = blocked
        ? '  <button type="button" class="erp-btn erp-btn--danger" disabled title="' + escapeHtml(store.BLOCK_MSG) + '">删除</button>'
        : '  <button type="button" class="erp-btn erp-btn--danger" data-detail-action="delete" data-id="' + node.id + '">删除</button>';

      var blockedTip = blocked
        ? '<p class="product-category-detail__tip product-category-detail__tip--warn">' + escapeHtml(store.BLOCK_MSG) + '</p>'
        : '';

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
        '  <div class="product-category-detail__meta-row"><dt>完整路径</dt><dd>' + escapeHtml(node.path) + '</dd></div>' +
        '  <div class="product-category-detail__meta-row"><dt>排序</dt><dd>' + node.sort + '</dd></div>' +
        '  <div class="product-category-detail__meta-row"><dt>已绑定商品</dt><dd>' + node.product_count + ' 个' + (node.level < 3 ? '（下级汇总）' : '') + '</dd></div>' +
        (node.is_hot ? '  <div class="product-category-detail__meta-row"><dt>标记</dt><dd>爆品频道</dd></div>' : '') +
        '  <div class="product-category-detail__meta-row"><dt>创建时间</dt><dd>' + escapeHtml(node.created_at) + '</dd></div>' +
        '</dl>' +
        '<div class="product-category-detail__actions">' +
        '  <button type="button" class="erp-btn erp-btn--primary" data-detail-action="edit" data-id="' + node.id + '">编辑</button>' +
        (node.status === 'on_shelf' ? offShelfBtn : '  <button type="button" class="erp-btn" data-detail-action="on-shelf" data-id="' + node.id + '">上架</button>') +
        deleteBtn +
        '</div>' +
        blockedTip;
    }

    if (paneProducts && node.level === 3) {
      var products = store.getBindings(node.id);
      var listHtml = products.length
        ? products.map(function (p) {
          return (
            '<div class="product-category-bound-item">' +
            '<img class="product-category-bound-item__img" src="' + p.img + '" alt="">' +
            '<div class="product-category-bound-item__info">' +
            '  <div class="product-category-bound-item__name">' + escapeHtml(p.name) + '</div>' +
            '  <div class="product-category-bound-item__code">' + escapeHtml(p.code) + '</div>' +
            '</div>' +
            '<button type="button" class="product-action__link product-action__link--muted" data-unbind="' + node.id + '" data-code="' + p.code + '">解绑</button>' +
            '</div>'
          );
        }).join('')
        : '<div class="product-category-detail__products-empty">暂无绑定商品，解绑全部商品后可删除或下架</div>';

      paneProducts.innerHTML =
        '<div class="product-category-detail__products-head">共 ' + products.length + ' 个商品</div>' +
        '<div class="product-category-bound-list">' + listHtml + '</div>';
    }
  }

  function renderAll() {
    var l1List = store.getByLevel(1);
    var l2List = state.selectedL1 ? store.getChildren(state.selectedL1) : [];
    var l3List = state.selectedL2 ? store.getChildren(state.selectedL2) : [];

    renderColumn(document.getElementById('catListL1'), l1List, state.selectedL1, true, '暂无一级类目');
    renderColumn(document.getElementById('catListL2'), l2List, state.selectedL2, false, '该一级下暂无二级类目');
    renderColumn(document.getElementById('catListL3'), l3List, state.selectedL3, false, '该二级下暂无三级类目');

    syncAddButtons();
    syncHints();
    renderDetail();
  }

  function selectLevel(level, id) {
    state.detailFocusId = id;
    if (level === 1) {
      state.selectedL1 = id;
      var l2children = store.getChildren(id);
      state.selectedL2 = l2children.length ? l2children[0].id : null;
      var l3children = state.selectedL2 ? store.getChildren(state.selectedL2) : [];
      state.selectedL3 = l3children.length ? l3children[0].id : null;
    } else if (level === 2) {
      state.selectedL2 = id;
      var l3s = store.getChildren(id);
      state.selectedL3 = l3s.length ? l3s[0].id : null;
    } else if (level === 3) {
      state.selectedL3 = id;
    }
    renderAll();
  }

  function ensureDefaultSelection() {
    var l1 = store.getByLevel(1);
    if (!l1.length) return;
    if (!state.selectedL1 || !store.getNode(state.selectedL1)) state.selectedL1 = l1[0].id;
    var l2 = store.getChildren(state.selectedL1);
    if (!state.selectedL2 || !store.getNode(state.selectedL2)) state.selectedL2 = l2.length ? l2[0].id : null;
    if (state.selectedL2) {
      var l3 = store.getChildren(state.selectedL2);
      if (!state.selectedL3 || !store.getNode(state.selectedL3)) state.selectedL3 = l3.length ? l3[0].id : null;
    } else {
      state.selectedL3 = null;
    }
  }

  function closeModal() {
    var modal = document.querySelector('[data-proxy-category-modal]');
    if (modal) modal.remove();
  }

  function renderCategoryIconUploadField() {
    return (
      '<div class="product-category-modal__field">' +
      '  <label class="product-category-modal__label">类目图标</label>' +
      '  <div class="product-add-upload product-category-modal__upload">' +
      '    <button type="button" class="product-add-upload__box" id="proxyCatIconBtn" aria-label="上传类目图标">' +
      '      <span class="product-add-upload__plus">+</span>' +
      '    </button>' +
      '    <input type="file" id="proxyCatIconFile" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden>' +
      '    <p class="product-add-upload__hint">支持 JPG/PNG/WEBP/SVG，建议正方形，单张不超过 2MB</p>' +
      '  </div>' +
      '</div>'
    );
  }

  function setupCategoryIconUpload(backdrop, initialIcon) {
    var iconValue = initialIcon || '';
    var btn = backdrop.querySelector('#proxyCatIconBtn');
    var fileInput = backdrop.querySelector('#proxyCatIconFile');

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
      btn.addEventListener('click', function () {
        fileInput.click();
      });
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

  function openCategoryModal(options) {
    closeModal();
    options = options || {};
    var isEdit = !!options.node;
    var node = options.node;
    var createLevel = options.createLevel || 1;
    var parentL1 = options.parentL1 ? store.getNode(options.parentL1) : null;
    var parentL2 = options.parentL2 ? store.getNode(options.parentL2) : null;

    var title = isEdit ? '编辑类目' : ('新增' + (createLevel === 1 ? '一级' : createLevel === 2 ? '二级' : '三级') + '类目');
    var hint = isEdit ? '编辑「' + node.path + '」'
      : createLevel === 1 ? '一级类目需上传图标，上架后展示于 APP 进货首页与分类页。'
      : createLevel === 2 && parentL1 ? '将在「' + parentL1.name + '」下创建二级分组类目。'
      : createLevel === 3 && parentL1 && parentL2 ? '将在「' + parentL1.name + ' / ' + parentL2.name + '」下创建三级叶子类目。'
      : '';

    var showIcon = isEdit ? node.level === 1 : createLevel === 1;
    var showHot = isEdit ? node.level === 2 : createLevel === 2;
    var showBindAfter = !isEdit && createLevel === 3;

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-proxy-category-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-category-modal">' +
      '  <div class="erp-modal__header"><h2 class="erp-modal__title">' + title + '</h2>' +
      '    <div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button></div></div>' +
      '  <div class="erp-modal__body"><p class="product-category-modal__hint">' + escapeHtml(hint) + '</p>' +
      (createLevel === 2 && parentL1 && !isEdit ? '<div class="product-category-modal__readonly"><label>所属一级</label><span>' + escapeHtml(parentL1.name) + '</span></div>' : '') +
      (createLevel === 3 && parentL1 && parentL2 && !isEdit ? '<div class="product-category-modal__readonly"><label>所属一级</label><span>' + escapeHtml(parentL1.name) + '</span></div><div class="product-category-modal__readonly"><label>所属二级</label><span>' + escapeHtml(parentL2.name) + '</span></div>' : '') +
      '    <div class="product-category-modal__field"><label class="product-category-modal__label" for="proxyCatName">类目名称</label><input class="product-category-modal__input" id="proxyCatName" type="text" placeholder="请输入类目名称" value="' + escapeHtml(isEdit ? node.name : '') + '"></div>' +
      (showIcon ? renderCategoryIconUploadField() : '') +
      '    <div class="product-category-modal__field"><label class="product-category-modal__label" for="proxyCatSort">排序</label><input class="product-category-modal__input" id="proxyCatSort" type="number" min="0" value="' + (isEdit ? node.sort : 10) + '"></div>' +
      (showHot ? '<div class="product-category-modal__field product-category-modal__field--check"><label><input type="checkbox" id="proxyCatHot"' + (isEdit && node.is_hot ? ' checked' : '') + '> 标记为爆品频道</label></div>' : '') +
      (showBindAfter ? '<div class="product-category-modal__field product-category-modal__field--check"><label><input type="checkbox" id="proxyCatBindAfter" checked> 创建后立即绑定商品</label></div>' : '') +
      '  </div>' +
      '  <div class="erp-modal__footer"><button type="button" class="erp-btn" data-modal-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-modal-save>确定</button></div></div>';

    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeModal(); });
    backdrop.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) { btn.addEventListener('click', closeModal); });

    var getCategoryIconValue = showIcon
      ? setupCategoryIconUpload(backdrop, isEdit ? (node.icon || '') : '')
      : function () { return isEdit ? (node.icon || '') : ''; };

    backdrop.querySelector('[data-modal-save]').addEventListener('click', function () {
      var name = (document.getElementById('proxyCatName') || {}).value.trim();
      var icon = showIcon ? getCategoryIconValue() : (isEdit ? node.icon : '');
      var sort = parseInt((document.getElementById('proxyCatSort') || {}).value, 10) || 10;
      var isHot = showHot && document.getElementById('proxyCatHot') && document.getElementById('proxyCatHot').checked;
      var bindAfter = showBindAfter && document.getElementById('proxyCatBindAfter') && document.getElementById('proxyCatBindAfter').checked;

      if (!name) { if (typeof showToast === 'function') showToast('请输入类目名称', 'warning'); return; }
      if (showIcon && !icon) { if (typeof showToast === 'function') showToast('一级类目请上传图标', 'warning'); return; }

      if (isEdit) {
        node.name = name;
        if (showIcon) node.icon = icon;
        node.sort = sort;
        if (showHot) node.is_hot = isHot;
        store.updateCategory(node);
        closeModal();
        renderAll();
        if (typeof showToast === 'function') showToast('类目已更新', 'success');
        return;
      }

      var parentId = createLevel === 1 ? null : createLevel === 2 ? parentL1.id : parentL2.id;
      var siblings = store.getCategories().filter(function (c) { return c.parent_id === parentId; });
      if (siblings.some(function (s) { return s.name === name; })) {
        if (typeof showToast === 'function') showToast('同级下已存在同名类目', 'warning');
        return;
      }

      var newId = genId('cat');
      var parentNode = parentId ? store.getNode(parentId) : null;
      var newNode = {
        id: newId,
        name: name,
        level: createLevel,
        parent_id: parentId,
        path: parentNode ? parentNode.path + '/' + name : name,
        path_ids: parentNode ? parentNode.path_ids.concat([newId]) : [newId],
        icon: icon,
        sort: sort,
        status: 'on_shelf',
        is_leaf: createLevel === 3,
        is_hot: !!isHot,
        product_count: 0,
        created_at: nowStr()
      };
      store.addCategory(newNode);

      if (createLevel === 1) state.selectedL1 = newId;
      if (createLevel === 2) state.selectedL2 = newId;
      if (createLevel === 3) {
        state.selectedL3 = newId;
        if (bindAfter) {
          var demos = store.getDemoProducts();
          store.bindProduct(newId, demos[Math.floor(Math.random() * demos.length)]);
        }
      }

      closeModal();
      ensureDefaultSelection();
      renderAll();
      if (typeof showToast === 'function') showToast('类目已创建', 'success');
    });

    document.body.appendChild(backdrop);
    var nameInput = document.getElementById('proxyCatName');
    if (nameInput) nameInput.focus();
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
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) { btn.addEventListener('click', closeWarm); });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () { closeWarm(); if (onConfirm) onConfirm(); });
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
      ? '删除「' + node.name + '」将同时删除其下 ' + (descIds.length - 1) + ' 个子类目，确定继续？'
      : '确定删除类目「' + node.name + '」？';
    openWarmConfirm(msg, function () {
      store.removeCategoryTree(id);
      if (descIds.indexOf(state.selectedL1) >= 0) state.selectedL1 = null;
      if (descIds.indexOf(state.selectedL2) >= 0) state.selectedL2 = null;
      if (descIds.indexOf(state.selectedL3) >= 0) state.selectedL3 = null;
      if (descIds.indexOf(state.detailFocusId) >= 0) state.detailFocusId = null;
      ensureDefaultSelection();
      renderAll();
      if (typeof showToast === 'function') showToast('类目已删除', 'success');
    });
  }

  function toggleShelf(id, status) {
    if (status === 'off_shelf' && !store.canOffShelf(id)) {
      if (typeof showToast === 'function') showToast(store.BLOCK_MSG, 'warning');
      return;
    }
    store.setCategoryStatus(id, status);
    renderAll();
    if (typeof showToast === 'function') showToast(status === 'on_shelf' ? '类目已上架' : '类目已下架', 'success');
  }

  function bindEvents() {
    document.getElementById('catAddL1') &&
      document.getElementById('catAddL1').addEventListener('click', function () { openCategoryModal({ createLevel: 1 }); });

    document.getElementById('catAddL2') &&
      document.getElementById('catAddL2').addEventListener('click', function () {
        if (!state.selectedL1) { if (typeof showToast === 'function') showToast('请先选择一级类目', 'warning'); return; }
        openCategoryModal({ createLevel: 2, parentL1: state.selectedL1 });
      });

    document.getElementById('catAddL3') &&
      document.getElementById('catAddL3').addEventListener('click', function () {
        if (!state.selectedL1 || !state.selectedL2) { if (typeof showToast === 'function') showToast('请先选择二级类目', 'warning'); return; }
        openCategoryModal({ createLevel: 3, parentL1: state.selectedL1, parentL2: state.selectedL2 });
      });

    ['catListL1', 'catListL2', 'catListL3'].forEach(function (listId) {
      var el = document.getElementById(listId);
      if (!el) return;
      el.addEventListener('click', function (e) {
        var item = e.target.closest('.product-category-cascade__item[data-id]');
        if (!item) return;
        selectLevel(parseInt(item.getAttribute('data-level'), 10), item.getAttribute('data-id'));
      });
    });

    document.getElementById('catDetailTabs') &&
      document.getElementById('catDetailTabs').addEventListener('click', function (e) {
        var tab = e.target.closest('.product-category-detail__tab[data-tab]');
        if (!tab) return;
        state.detailTab = tab.getAttribute('data-tab');
        renderDetail();
      });

    document.getElementById('catDetailPanel') &&
      document.getElementById('catDetailPanel').addEventListener('click', function (e) {
        var actionBtn = e.target.closest('[data-detail-action]');
        if (actionBtn) {
          var action = actionBtn.getAttribute('data-detail-action');
          var id = actionBtn.getAttribute('data-id');
          if (action === 'edit') openCategoryModal({ node: store.getNode(id) });
          else if (action === 'off-shelf') toggleShelf(id, 'off_shelf');
          else if (action === 'on-shelf') toggleShelf(id, 'on_shelf');
          else if (action === 'delete') deleteCategory(id);
          return;
        }

        var unbindBtn = e.target.closest('[data-unbind]');
        if (unbindBtn) {
          store.unbindProduct(unbindBtn.getAttribute('data-unbind'), unbindBtn.getAttribute('data-code'));
          renderAll();
          if (typeof showToast === 'function') showToast('已解绑商品', 'success');
        }
      });
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
