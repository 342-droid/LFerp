/**
 * 主数据 · 配料类别：查询、新增、编辑、停用/启用、删除
 */
(function () {
  var store = window.MasterDataIngredientCategoryStore;
  var CATEGORIES = store ? store.all() : [];

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

  function categoryStatus(item) {
    return item && item.status === 'disabled' ? 'disabled' : 'active';
  }

  function statusLabel(item) {
    return categoryStatus(item) === 'disabled' ? '停用' : '启用';
  }

  function visibleCategories() {
    var query = state.query || {};
    return CATEGORIES.filter(function (item) {
      if (query.name && String(item.name || '').toLowerCase().indexOf(query.name.toLowerCase()) < 0) return false;
      if (query.status && categoryStatus(item) !== query.status) return false;
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
    var body = document.getElementById('ingCatTableBody');
    if (!body) return;
    if (!list.length) {
      var emptyText = state.query.name || state.query.status ? '暂无符合条件的类别' : '暂无类别';
      body.innerHTML = '<tr><td class="mdb-table-empty" colspan="3">' + emptyText + '</td></tr>';
      return;
    }
    var start = (state.page - 1) * state.pageSize;
    body.innerHTML = list.slice(start, start + state.pageSize).map(function (item) {
      var action = categoryStatus(item) === 'disabled' ? '启用' : '停用';
      return '<tr>' +
        '<td>' + escapeHtml(item.name) + '</td>' +
        '<td><span class="mdb-status mdb-status--' + categoryStatus(item) + '">' + statusLabel(item) + '</span></td>' +
        '<td class="mdb-table__op"><div class="mdb-table__ops">' +
        '<button type="button" class="mdb-op-btn" data-ingcat-edit="' + item.id + '">编辑</button>' +
        '<button type="button" class="mdb-op-btn" data-ingcat-status="' + item.id + '">' + action + '</button>' +
        '<button type="button" class="mdb-op-btn mdb-op-btn--danger" data-ingcat-delete="' + item.id + '">删除</button>' +
        '</div></td></tr>';
    }).join('');
  }

  function renderPagination(total) {
    var totalEl = document.getElementById('ingCatPaginationTotal');
    var pagesEl = document.getElementById('ingCatPaginationPages');
    var gotoEl = document.getElementById('ingCatPageGoto');
    var sizeEl = document.getElementById('ingCatPageSize');
    var totalPages = totalPagesOf(total);
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(state.page);
    if (sizeEl && String(sizeEl.value) !== String(state.pageSize)) sizeEl.value = String(state.pageSize);
    if (!pagesEl) return;
    var page = state.page;
    var html = '<button type="button" class="product-pagination__btn" data-ingcat-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    for (var i = 1; i <= totalPages; i += 1) {
      html += '<button type="button" class="product-pagination__btn' + (i === page ? ' is-active' : '') + '" data-ingcat-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="product-pagination__btn" data-ingcat-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderPage() {
    var list = visibleCategories();
    clampPage(list.length);
    renderTable(list);
    renderPagination(list.length);
  }

  function findCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i += 1) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function nameTaken(name, exceptId) {
    return CATEGORIES.some(function (item) {
      return item.id !== exceptId && item.name === name;
    });
  }

  function closeModal() {
    var modal = document.querySelector('[data-ingcat-modal]');
    if (modal) modal.remove();
    state.editingId = null;
  }

  function openForm(item) {
    closeModal();
    state.editingId = item ? item.id : null;
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-ingcat-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdb-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (item ? '编辑类别' : '新增类别') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-ingcat-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdb-form">' +
      '<label class="mdb-field"><span><i>*</i>类别名称</span><input id="ingCatFormName" type="text" maxlength="20" placeholder="请输入类别名称" value="' + escapeHtml(item ? item.name : '') + '"></label>' +
      '</div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-ingcat-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-ingcat-save>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-ingcat-close], [data-ingcat-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    backdrop.querySelector('[data-ingcat-save]').addEventListener('click', saveCategory);
    document.body.appendChild(backdrop);
    var input = document.getElementById('ingCatFormName');
    if (input) input.focus();
  }

  function saveCategory() {
    var nameEl = document.getElementById('ingCatFormName');
    var name = nameEl ? String(nameEl.value || '').trim() : '';
    if (!name) {
      if (typeof showToast === 'function') showToast('请输入类别名称', 'warning');
      return;
    }
    if (nameTaken(name, state.editingId)) {
      if (typeof showToast === 'function') showToast('类别名称已存在', 'warning');
      return;
    }
    if (state.editingId) {
      var current = findCategory(state.editingId);
      if (!current) return;
      current.name = name;
      if (store) store.save();
      closeModal();
      renderPage();
      if (typeof showToast === 'function') showToast('类别已更新', 'success');
      return;
    }
    CATEGORIES.push({ id: store ? store.nextId() : ('c' + (CATEGORIES.length + 1)), name: name, status: 'active' });
    if (store) store.save();
    closeModal();
    state.page = totalPagesOf(visibleCategories().length);
    renderPage();
    if (typeof showToast === 'function') showToast('类别已创建', 'success');
  }

  function toggleStatus(id) {
    var item = findCategory(id);
    if (!item) return;
    var disabling = categoryStatus(item) !== 'disabled';
    item.status = disabling ? 'disabled' : 'active';
    if (store) store.save();
    renderPage();
    if (typeof showToast === 'function') showToast(disabling ? '类别已停用' : '类别已启用', 'success');
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
    var item = findCategory(id);
    if (!item) return;
    openWarmConfirm('确定删除类别「' + item.name + '」？', function () {
      var index = CATEGORIES.indexOf(item);
      if (index >= 0) CATEGORIES.splice(index, 1);
      if (store) store.save();
      renderPage();
      if (typeof showToast === 'function') showToast('类别已删除', 'success');
    });
  }

  function readQuery() {
    var nameEl = document.getElementById('ingCatQueryName');
    var statusEl = document.getElementById('ingCatQueryStatus');
    return {
      name: nameEl ? String(nameEl.value || '').trim() : '',
      status: statusEl ? String(statusEl.value || '') : ''
    };
  }

  function bindEvents() {
    var form = document.getElementById('ingCatQueryForm');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        state.query = readQuery();
        state.page = 1;
        renderPage();
      });
    }
    var resetBtn = document.getElementById('ingCatQueryReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var nameEl = document.getElementById('ingCatQueryName');
        var statusEl = document.getElementById('ingCatQueryStatus');
        if (nameEl) nameEl.value = '';
        if (statusEl) statusEl.value = '';
        state.query = { name: '', status: '' };
        state.page = 1;
        renderPage();
      });
    }
    var addBtn = document.getElementById('ingCatAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
    var table = document.getElementById('ingCatTableBody');
    if (table) {
      table.addEventListener('click', function (ev) {
        var editBtn = ev.target.closest('[data-ingcat-edit]');
        if (editBtn) {
          openForm(findCategory(editBtn.getAttribute('data-ingcat-edit')));
          return;
        }
        var statusBtn = ev.target.closest('[data-ingcat-status]');
        if (statusBtn) {
          toggleStatus(statusBtn.getAttribute('data-ingcat-status'));
          return;
        }
        var deleteBtn = ev.target.closest('[data-ingcat-delete]');
        if (deleteBtn) deleteCategory(deleteBtn.getAttribute('data-ingcat-delete'));
      });
    }
    var pages = document.getElementById('ingCatPaginationPages');
    if (pages) {
      pages.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-ingcat-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-ingcat-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderPage();
      });
    }
    var sizeEl = document.getElementById('ingCatPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        state.page = 1;
        renderPage();
      });
    }
    var gotoEl = document.getElementById('ingCatPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('change', function () {
        var total = visibleCategories().length;
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
