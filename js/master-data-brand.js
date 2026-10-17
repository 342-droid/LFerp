/**
 * 主数据 · 商品品牌：查询、新增、编辑、停用/启用、删除
 */
(function () {
  var store = window.MasterDataBrandStore;
  var BRANDS = store ? store.all() : [];

  var state = {
    query: { name: '', status: '' },
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

  function brandStatus(item) {
    return item && item.status === 'disabled' ? 'disabled' : 'active';
  }

  function statusLabel(item) {
    return brandStatus(item) === 'disabled' ? '停用' : '启用';
  }

  function visibleBrands() {
    var query = state.query || {};
    return BRANDS.filter(function (item) {
      if (query.name && String(item.name || '').toLowerCase().indexOf(query.name.toLowerCase()) < 0) return false;
      if (query.status && brandStatus(item) !== query.status) return false;
      return true;
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
    var body = document.getElementById('brandTableBody');
    if (!body) return;
    if (!list.length) {
      var emptyText = state.query.name || state.query.status ? '暂无符合条件的品牌' : '暂无品牌';
      body.innerHTML = '<tr><td class="mdb-table-empty" colspan="4">' + emptyText + '</td></tr>';
      return;
    }
    var start = (state.page - 1) * state.pageSize;
    body.innerHTML = list.slice(start, start + state.pageSize).map(function (item) {
      var action = brandStatus(item) === 'disabled' ? '启用' : '停用';
      var logo = item.logo
        ? '<span class="mdb-logo"><img src="' + escapeHtml(item.logo) + '" alt="' + escapeHtml(item.name) + 'logo"></span>'
        : '<span class="mdb-logo mdb-logo--empty">无</span>';
      return '<tr>' +
        '<td>' + escapeHtml(item.name) + '</td>' +
        '<td>' + logo + '</td>' +
        '<td><span class="mdb-status mdb-status--' + brandStatus(item) + '">' + statusLabel(item) + '</span></td>' +
        '<td class="mdb-table__op"><div class="mdb-table__ops">' +
        '<button type="button" class="mdb-op-btn" data-brand-edit="' + item.id + '">编辑</button>' +
        '<button type="button" class="mdb-op-btn" data-brand-status="' + item.id + '">' + action + '</button>' +
        '<button type="button" class="mdb-op-btn mdb-op-btn--danger" data-brand-delete="' + item.id + '">删除</button>' +
        '</div></td></tr>';
    }).join('');
  }

  function renderPagination(total) {
    var totalEl = document.getElementById('brandPaginationTotal');
    var pagesEl = document.getElementById('brandPaginationPages');
    var gotoEl = document.getElementById('brandPageGoto');
    var sizeEl = document.getElementById('brandPageSize');
    var totalPages = totalPagesOf(total);
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(state.page);
    if (sizeEl && String(sizeEl.value) !== String(state.pageSize)) sizeEl.value = String(state.pageSize);
    if (!pagesEl) return;
    var page = state.page;
    var html = '<button type="button" class="product-pagination__btn" data-brand-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    for (var i = 1; i <= totalPages; i += 1) {
      html += '<button type="button" class="product-pagination__btn' + (i === page ? ' is-active' : '') + '" data-brand-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="product-pagination__btn" data-brand-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderPage() {
    var list = visibleBrands();
    clampPage(list.length);
    renderTable(list);
    renderPagination(list.length);
  }

  function findBrand(id) {
    for (var i = 0; i < BRANDS.length; i += 1) {
      if (BRANDS[i].id === id) return BRANDS[i];
    }
    return null;
  }

  function nameTaken(name, exceptId) {
    return BRANDS.some(function (item) {
      return item.id !== exceptId && item.name === name;
    });
  }

  function closeModal() {
    var modal = document.querySelector('[data-brand-modal]');
    if (modal) modal.remove();
    state.editingId = null;
    formLogo = '';
  }

  var formLogo = '';

  function renderLogoPreview() {
    var btn = document.getElementById('brandLogoBtn');
    var clearBtn = document.getElementById('brandLogoClear');
    if (!btn) return;
    if (!formLogo) {
      btn.innerHTML = '<span class="mdb-logo-plus">+</span>';
      btn.classList.remove('mdb-logo-box--filled');
      if (clearBtn) clearBtn.hidden = true;
      return;
    }
    btn.innerHTML = '<img class="mdb-logo-preview" alt="品牌logo">';
    btn.classList.add('mdb-logo-box--filled');
    var img = btn.querySelector('.mdb-logo-preview');
    if (img) img.src = formLogo;
    if (clearBtn) clearBtn.hidden = false;
  }

  function openForm(item) {
    closeModal();
    state.editingId = item ? item.id : null;
    formLogo = item && item.logo ? item.logo : '';
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-brand-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdb-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (item ? '编辑品牌' : '新增品牌') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-brand-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdb-form">' +
      '<label class="mdb-field"><span><i>*</i>品牌名称</span><input id="brandFormName" type="text" maxlength="30" placeholder="请输入品牌名称" value="' + escapeHtml(item ? item.name : '') + '"></label>' +
      '<div class="mdb-field mdb-field--logo"><span>品牌logo</span><div class="mdb-logo-upload">' +
      '<button type="button" class="mdb-logo-box" id="brandLogoBtn" aria-label="上传品牌logo"></button>' +
      '<button type="button" class="mdb-logo-clear" id="brandLogoClear" hidden>清除</button>' +
      '<input type="file" id="brandLogoFile" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" hidden>' +
      '<p class="mdb-logo-hint">支持 JPG、PNG、WEBP、GIF、SVG，不超过 2MB</p>' +
      '</div></div></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-brand-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-brand-save>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-brand-close], [data-brand-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    backdrop.querySelector('[data-brand-save]').addEventListener('click', saveBrand);
    var logoBtn = backdrop.querySelector('#brandLogoBtn');
    var fileInput = backdrop.querySelector('#brandLogoFile');
    var clearBtn = backdrop.querySelector('#brandLogoClear');
    if (logoBtn && fileInput) {
      logoBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.type)) {
          if (typeof showToast === 'function') showToast('请上传 JPG、PNG、WEBP、GIF 或 SVG 图片', 'warning');
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
          formLogo = String(reader.result || '');
          renderLogoPreview();
        };
        reader.readAsDataURL(file);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        formLogo = '';
        if (fileInput) fileInput.value = '';
        renderLogoPreview();
      });
    }
    document.body.appendChild(backdrop);
    renderLogoPreview();
    var input = document.getElementById('brandFormName');
    if (input) input.focus();
  }

  function saveBrand() {
    var nameEl = document.getElementById('brandFormName');
    var name = nameEl ? String(nameEl.value || '').trim() : '';
    if (!name) {
      if (typeof showToast === 'function') showToast('请输入品牌名称', 'warning');
      return;
    }
    if (nameTaken(name, state.editingId)) {
      if (typeof showToast === 'function') showToast('品牌名称已存在', 'warning');
      return;
    }
    if (state.editingId) {
      var current = findBrand(state.editingId);
      if (!current) return;
      current.name = name;
      current.logo = formLogo;
      if (store) store.save();
      closeModal();
      renderPage();
      if (typeof showToast === 'function') showToast('品牌已更新', 'success');
      return;
    }
    BRANDS.push({ id: store ? store.nextId() : ('b' + (BRANDS.length + 1)), name: name, status: 'active', logo: formLogo });
    if (store) store.save();
    closeModal();
    state.page = totalPagesOf(visibleBrands().length);
    renderPage();
    if (typeof showToast === 'function') showToast('品牌已创建', 'success');
  }

  function toggleStatus(id) {
    var item = findBrand(id);
    if (!item) return;
    var disabling = brandStatus(item) !== 'disabled';
    item.status = disabling ? 'disabled' : 'active';
    if (store) store.save();
    renderPage();
    if (typeof showToast === 'function') showToast(disabling ? '品牌已停用' : '品牌已启用', 'success');
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

  function deleteBrand(id) {
    var item = findBrand(id);
    if (!item) return;
    openWarmConfirm('确定删除品牌「' + item.name + '」？', function () {
      var index = BRANDS.indexOf(item);
      if (index >= 0) BRANDS.splice(index, 1);
      if (store) store.save();
      renderPage();
      if (typeof showToast === 'function') showToast('品牌已删除', 'success');
    });
  }

  function readQuery() {
    var nameEl = document.getElementById('brandQueryName');
    var statusEl = document.getElementById('brandQueryStatus');
    return {
      name: nameEl ? String(nameEl.value || '').trim() : '',
      status: statusEl ? String(statusEl.value || '') : ''
    };
  }

  function bindEvents() {
    var form = document.getElementById('brandQueryForm');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        state.query = readQuery();
        state.page = 1;
        renderPage();
      });
    }
    var resetBtn = document.getElementById('brandQueryReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var nameEl = document.getElementById('brandQueryName');
        var statusEl = document.getElementById('brandQueryStatus');
        if (nameEl) nameEl.value = '';
        if (statusEl) statusEl.value = '';
        state.query = { name: '', status: '' };
        state.page = 1;
        renderPage();
      });
    }
    var addBtn = document.getElementById('brandAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
    var table = document.getElementById('brandTableBody');
    if (table) {
      table.addEventListener('click', function (ev) {
        var editBtn = ev.target.closest('[data-brand-edit]');
        if (editBtn) {
          openForm(findBrand(editBtn.getAttribute('data-brand-edit')));
          return;
        }
        var statusBtn = ev.target.closest('[data-brand-status]');
        if (statusBtn) {
          toggleStatus(statusBtn.getAttribute('data-brand-status'));
          return;
        }
        var deleteBtn = ev.target.closest('[data-brand-delete]');
        if (deleteBtn) deleteBrand(deleteBtn.getAttribute('data-brand-delete'));
      });
    }
    var pages = document.getElementById('brandPaginationPages');
    if (pages) {
      pages.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-brand-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-brand-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderPage();
      });
    }
    var sizeEl = document.getElementById('brandPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        state.page = 1;
        renderPage();
      });
    }
    var gotoEl = document.getElementById('brandPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('change', function () {
        var total = visibleBrands().length;
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
    bindEvents();
    renderPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
