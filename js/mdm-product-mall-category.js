/**
 * 商城类目 — 扁平列表（新增 / 编辑 / 上下架 / 删除）
 * 与代采「三级级联类目」相互独立
 *
 * 业务规则：
 * - 类目名称必填、最多 10 字、不可重名
 * - 类目图片必填；上传仅 JPG/PNG，≤ 5MB；列表展示 80×80 圆形
 * - 已绑定商品数 > 0 时禁止下架、删除（需先解绑商品）
 * - 新增默认已上架；上下架需二次确认
 */
(function () {
  var STORAGE_KEY = 'mdm_mall_category_list_v2';
  var BLOCK_BOUND_MSG = '当前类目已关联商品，请先解除绑定后再操作';

  /* 种子数据对齐原图类目与圆形类目图（80×80 展示） */
  var SEED = [
    { id: 'mc-1', name: '蔬菜水果', productCount: 24, status: 'on_shelf', createdAt: '2026-06-01 15:13', img: '../user-app/assets/shop/cat-veg.svg' },
    { id: 'mc-2', name: '肉禽蛋品', productCount: 5, status: 'on_shelf', createdAt: '2026-06-01 15:13', img: '../user-app/assets/shop/cat-meat.svg' },
    { id: 'mc-3', name: '酒水饮料', productCount: 2, status: 'on_shelf', createdAt: '2026-06-01 15:13', img: '../user-app/assets/restock/category-icon-drink.svg' },
    { id: 'mc-4', name: '日用百货', productCount: 1, status: 'on_shelf', createdAt: '2026-06-01 15:14', img: '../user-app/assets/shop/cat-daily.svg' },
    { id: 'mc-5', name: '粮油调味', productCount: 3, status: 'on_shelf', createdAt: '2026-06-01 15:14', img: '../user-app/assets/shop/cat-grain.svg' },
    { id: 'mc-6', name: '水产海鲜', productCount: 1, status: 'on_shelf', createdAt: '2026-06-01 15:15', img: '../user-app/assets/shop/cat-seafood.svg' },
    { id: 'mc-7', name: '乳品烘焙', productCount: 25, status: 'on_shelf', createdAt: '2026-06-01 15:15', img: '../user-app/assets/shop/cat-dairy.svg' },
    { id: 'mc-8', name: '休闲零食', productCount: 0, status: 'on_shelf', createdAt: '2026-06-01 15:16', img: '../user-app/assets/shop/cat-snack.svg' }
  ];

  var ALL = [];
  var state = {
    page: 1,
    pageSize: 20,
    formMode: 'add',
    editingId: '',
    formImg: ''
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
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
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  function genId() {
    return 'mc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ALL));
    } catch (e) {
      /* ignore */
    }
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          ALL = parsed;
          return;
        }
      }
    } catch (e) {
      /* ignore */
    }
    ALL = SEED.map(function (item) {
      return Object.assign({}, item);
    });
    persist();
  }

  function getById(id) {
    for (var i = 0; i < ALL.length; i++) {
      if (ALL[i].id === id) return ALL[i];
    }
    return null;
  }

  function boundCount(item) {
    return item && item.productCount != null ? Number(item.productCount) || 0 : 0;
  }

  function hasBoundProducts(item) {
    return boundCount(item) > 0;
  }

  function isAllowedImageFile(file) {
    if (!file) return false;
    var type = String(file.type || '').toLowerCase();
    if (type === 'image/jpeg' || type === 'image/png' || type === 'image/jpg') return true;
    var name = String(file.name || '').toLowerCase();
    return /\.(jpe?g|png)$/.test(name);
  }

  function closeWarmConfirmModal() {
    var modal = document.querySelector('[data-product-warm-confirm]');
    if (modal) modal.remove();
  }

  function openWarmConfirmModal(message, onConfirm) {
    closeWarmConfirmModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-product-warm-confirm', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">温馨提示</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="erp-modal-confirm__row">' +
      '      <div class="erp-modal-confirm__icon">!</div>' +
      '      <div class="erp-modal-confirm__msg">' +
      escapeHtml(message) +
      '</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-warm-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
      '  </div>' +
      '</div>';

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeWarmConfirmModal();
    });
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeWarmConfirmModal);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      closeWarmConfirmModal();
      if (typeof onConfirm === 'function') onConfirm();
    });
    document.body.appendChild(backdrop);
  }

  function closeFormModal() {
    var modal = document.querySelector('[data-mall-cat-form]');
    if (modal) modal.remove();
    state.formImg = '';
    state.editingId = '';
  }

  function updateFormCount(input, countEl) {
    if (!input || !countEl) return;
    var len = String(input.value || '').length;
    countEl.textContent = len + ' / 10';
  }

  function renderFormPreview() {
    var box = document.getElementById('mallCatFormImgBox');
    if (!box) return;
    if (state.formImg) {
      box.innerHTML =
        '<img class="mall-cat-form__preview" src="' +
        escapeHtml(state.formImg) +
        '" alt="">' +
        '<button type="button" class="mall-cat-form__img-remove" data-mall-cat-img-remove aria-label="移除图片">&times;</button>';
    } else {
      box.innerHTML = '<span class="mall-cat-form__plus">+</span>';
    }
  }

  function openFormModal(mode, item) {
    closeFormModal();
    state.formMode = mode === 'edit' ? 'edit' : 'add';
    state.editingId = item && item.id ? item.id : '';
    state.formImg = (item && item.img) || '';

    var title = state.formMode === 'edit' ? '类目-编辑' : '类目-新增';
    var nameVal = item && item.name ? item.name : '';

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mall-cat-form-backdrop';
    backdrop.setAttribute('data-mall-cat-form', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mall-cat-form-modal">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' +
      escapeHtml(title) +
      '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-mall-cat-fullscreen aria-label="全屏" title="全屏">&#9723;</button>' +
      '      <button type="button" class="erp-modal__header-btn" data-mall-cat-form-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body mall-cat-form__body">' +
      '    <div class="mall-cat-form__field">' +
      '      <label class="mall-cat-form__label" for="mallCatFormName"><span class="mall-cat-form__req">*</span>类目名称</label>' +
      '      <div class="mall-cat-form__name-wrap">' +
      '        <input class="mall-cat-form__input" id="mallCatFormName" type="text" maxlength="10" placeholder="请输入类目名称" value="' +
      escapeHtml(nameVal) +
      '">' +
      '        <span class="mall-cat-form__count" id="mallCatFormNameCount">0 / 10</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="mall-cat-form__field">' +
      '      <label class="mall-cat-form__label"><span class="mall-cat-form__req">*</span>类目图片</label>' +
      '      <button type="button" class="mall-cat-form__upload" id="mallCatFormImgBox" aria-label="上传类目图片"></button>' +
      '      <input type="file" id="mallCatFormImgInput" accept="image/jpeg,image/png,image/jpg" hidden>' +
      '      <p class="mall-cat-form__hint">建议尺寸：80x80，格式支持 JPG/PNG，≤ 5MB</p>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-mall-cat-form-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-mall-cat-form-save>保存</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(backdrop);
    renderFormPreview();

    var modal = backdrop.querySelector('.mall-cat-form-modal');
    var nameInput = document.getElementById('mallCatFormName');
    var countEl = document.getElementById('mallCatFormNameCount');
    var fileInput = document.getElementById('mallCatFormImgInput');
    updateFormCount(nameInput, countEl);

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeFormModal();
    });
    backdrop.querySelectorAll('[data-mall-cat-form-close], [data-mall-cat-form-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeFormModal);
    });

    var fsBtn = backdrop.querySelector('[data-mall-cat-fullscreen]');
    if (fsBtn && modal) {
      fsBtn.addEventListener('click', function () {
        var on = modal.classList.toggle('erp-modal--fullscreen');
        fsBtn.title = on ? '退出全屏' : '全屏';
      });
    }

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        updateFormCount(nameInput, countEl);
      });
      nameInput.focus();
    }

    var imgBox = document.getElementById('mallCatFormImgBox');
    if (imgBox && fileInput) {
      imgBox.addEventListener('click', function (e) {
        if (e.target.closest('[data-mall-cat-img-remove]')) return;
        fileInput.click();
      });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!isAllowedImageFile(file)) {
          if (typeof showToast === 'function') showToast('仅支持 JPG/PNG 格式', 'warning');
          fileInput.value = '';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          if (typeof showToast === 'function') showToast('图片不能超过 5MB', 'warning');
          fileInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          state.formImg = String(reader.result || '');
          renderFormPreview();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
      });
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target.closest('[data-mall-cat-img-remove]')) {
        e.preventDefault();
        e.stopPropagation();
        state.formImg = '';
        renderFormPreview();
      }
    });

    backdrop.querySelector('[data-mall-cat-form-save]').addEventListener('click', function () {
      var name = String((nameInput && nameInput.value) || '').trim();
      if (!name) {
        if (typeof showToast === 'function') showToast('请输入类目名称', 'warning');
        return;
      }
      if (name.length > 10) {
        if (typeof showToast === 'function') showToast('类目名称最多 10 个字', 'warning');
        return;
      }
      if (!state.formImg) {
        if (typeof showToast === 'function') showToast('请上传类目图片', 'warning');
        return;
      }
      var dup = ALL.some(function (row) {
        return row.name === name && row.id !== state.editingId;
      });
      if (dup) {
        if (typeof showToast === 'function') showToast('类目名称已存在', 'warning');
        return;
      }

      if (state.formMode === 'edit' && state.editingId) {
        var target = getById(state.editingId);
        if (target) {
          target.name = name;
          target.img = state.formImg;
          persist();
          renderTable();
          closeFormModal();
          if (typeof showToast === 'function') showToast('类目已更新', 'success');
        }
        return;
      }

      ALL.unshift({
        id: genId(),
        name: name,
        img: state.formImg,
        productCount: 0,
        status: 'on_shelf',
        createdAt: nowStr()
      });
      persist();
      state.page = 1;
      renderTable();
      closeFormModal();
      if (typeof showToast === 'function') showToast('类目已新增', 'success');
    });
  }

  function renderStatus(status) {
    if (status === 'off_shelf') {
      return '<span class="product-tag product-tag--stopped">已下架</span>';
    }
    return '<span class="product-tag product-tag--on-shelf">已上架</span>';
  }

  function renderActions(item) {
    var shelfLabel = item.status === 'on_shelf' ? '下架' : '上架';
    var shelfAction = item.status === 'on_shelf' ? 'off-shelf' : 'on-shelf';
    var bound = hasBoundProducts(item);
    var offDisabled = shelfAction === 'off-shelf' && bound;
    var deleteDisabled = bound;
    var shelfBtn =
      '<button type="button" class="mall-cat-action__link' +
      (offDisabled ? ' is-disabled' : '') +
      '" data-action="' +
      shelfAction +
      '" data-id="' +
      escapeHtml(item.id) +
      '"' +
      (offDisabled ? ' disabled title="' + escapeHtml(BLOCK_BOUND_MSG) + '"' : '') +
      '>' +
      shelfLabel +
      '</button>';
    var deleteBtn = deleteDisabled
      ? '<button type="button" class="product-more__item product-more__item--danger is-disabled" data-action="delete" data-id="' +
        escapeHtml(item.id) +
        '" disabled title="' +
        escapeHtml(BLOCK_BOUND_MSG) +
        '">删除</button>'
      : '<button type="button" class="product-more__item product-more__item--danger" data-action="delete" data-id="' +
        escapeHtml(item.id) +
        '">删除</button>';
    return (
      '<div class="mall-cat-action">' +
      shelfBtn +
      '<button type="button" class="mall-cat-action__link" data-action="edit" data-id="' +
      escapeHtml(item.id) +
      '">编辑</button>' +
      '<div class="product-more mall-cat-more" data-more-wrap>' +
      '<button type="button" class="product-more__btn" data-more-toggle>更多 <span class="product-more__caret">∨</span></button>' +
      '<div class="product-more__menu mall-cat-more__menu">' +
      deleteBtn +
      '</div></div></div>'
    );
  }

  function renderTable() {
    var tbody = document.getElementById('mallCatTableBody');
    var emptyEl = document.getElementById('mallCatEmpty');
    if (!tbody) return;

    var total = ALL.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = ALL.slice(start, start + state.pageSize);

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      tbody.innerHTML = pageItems
        .map(function (item, idx) {
          var alt = idx % 2 === 1 ? ' mall-cat-table__row--alt' : '';
          var img = item.img
            ? '<img class="mall-cat-table__avatar" src="' + escapeHtml(item.img) + '" alt="">'
            : '<span class="mall-cat-table__avatar mall-cat-table__avatar--placeholder">' +
              escapeHtml((item.name || '?').charAt(0)) +
              '</span>';
          return (
            '<tr class="mall-cat-table__row' +
            alt +
            '" data-id="' +
            escapeHtml(item.id) +
            '">' +
            '<td class="mall-cat-table__td mall-cat-table__td--img">' +
            img +
            '</td>' +
            '<td class="mall-cat-table__td mall-cat-table__td--name">' +
            escapeHtml(item.name) +
            '</td>' +
            '<td class="mall-cat-table__td mall-cat-table__td--count">' +
            escapeHtml(String(item.productCount != null ? item.productCount : 0)) +
            '</td>' +
            '<td class="mall-cat-table__td mall-cat-table__td--status">' +
            renderStatus(item.status) +
            '</td>' +
            '<td class="mall-cat-table__td mall-cat-table__td--time">' +
            escapeHtml(item.createdAt || '-') +
            '</td>' +
            '<td class="mall-cat-table__td mall-cat-table__td--action">' +
            renderActions(item) +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    }
    renderPagination();
  }

  function renderPagination() {
    var totalEl = document.getElementById('mallCatPaginationTotal');
    var pagesEl = document.getElementById('mallCatPaginationPages');
    var gotoEl = document.getElementById('mallCatPageGoto');
    var total = ALL.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    var page = state.page;

    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(page);
    if (!pagesEl) return;

    var html =
      '<button type="button" class="product-pagination__btn" data-page="' +
      (page - 1) +
      '"' +
      (page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>';

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('…');
      var start = Math.max(2, page - 2);
      var end = Math.min(totalPages - 1, page + 2);
      for (var j = start; j <= end; j++) pages.push(j);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages);
    }

    pages.forEach(function (p) {
      if (p === '…') {
        html += '<button type="button" class="product-pagination__btn" disabled>…</button>';
      } else {
        html +=
          '<button type="button" class="product-pagination__btn' +
          (p === page ? ' is-active' : '') +
          '" data-page="' +
          p +
          '">' +
          p +
          '</button>';
      }
    });

    html +=
      '<button type="button" class="product-pagination__btn" data-page="' +
      (page + 1) +
      '"' +
      (page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function closeAllMoreMenus() {
    document.querySelectorAll('.mall-cat-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  function bindEvents() {
    var addBtn = document.getElementById('mallCatAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openFormModal('add');
      });
    }

    var sizeEl = document.getElementById('mallCatPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 20;
        state.page = 1;
        renderTable();
      });
    }

    var pagesEl = document.getElementById('mallCatPaginationPages');
    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderTable();
      });
    }

    var gotoEl = document.getElementById('mallCatPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var totalPages = Math.max(1, Math.ceil(ALL.length / state.pageSize));
        var val = parseInt(e.target.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });
    }

    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('.mall-cat-more [data-more-toggle]');
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = toggle.closest('.mall-cat-more');
        if (!wrap) return;
        var open = wrap.classList.contains('is-open');
        closeAllMoreMenus();
        if (!open) wrap.classList.add('is-open');
        return;
      }

      if (!e.target.closest('.mall-cat-more')) closeAllMoreMenus();

      var actionBtn = e.target.closest('.mall-cat-card [data-action], .mall-cat-more [data-action]');
      if (!actionBtn) return;
      e.preventDefault();
      closeAllMoreMenus();

      var action = actionBtn.getAttribute('data-action');
      var id = actionBtn.getAttribute('data-id');
      var item = getById(id);
      if (!item) return;

      if (actionBtn.disabled || actionBtn.classList.contains('is-disabled')) {
        if ((action === 'off-shelf' || action === 'delete') && hasBoundProducts(item)) {
          if (typeof showToast === 'function') showToast(BLOCK_BOUND_MSG, 'warning');
        }
        return;
      }

      if (action === 'edit') {
        openFormModal('edit', item);
        return;
      }

      if (action === 'off-shelf') {
        if (hasBoundProducts(item)) {
          if (typeof showToast === 'function') showToast(BLOCK_BOUND_MSG, 'warning');
          return;
        }
        openWarmConfirmModal('确认下架类目「' + item.name + '」？', function () {
          item.status = 'off_shelf';
          persist();
          renderTable();
          if (typeof showToast === 'function') showToast('已下架', 'success');
        });
        return;
      }

      if (action === 'on-shelf') {
        openWarmConfirmModal('确认上架类目「' + item.name + '」？', function () {
          item.status = 'on_shelf';
          persist();
          renderTable();
          if (typeof showToast === 'function') showToast('已上架', 'success');
        });
        return;
      }

      if (action === 'delete') {
        if (hasBoundProducts(item)) {
          if (typeof showToast === 'function') showToast(BLOCK_BOUND_MSG, 'warning');
          return;
        }
        openWarmConfirmModal('确认删除类目「' + item.name + '」？删除后无法恢复', function () {
          ALL = ALL.filter(function (row) {
            return row.id !== id;
          });
          persist();
          renderTable();
          if (typeof showToast === 'function') showToast('已删除', 'success');
        });
      }
    });
  }

  function init() {
    load();
    bindEvents();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
