(function () {
  var store = window.MdmMallTagStore;
  var TAG_NAME_MAX = 5;

  var state = {
    page: 1,
    pageSize: 20,
    list: []
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function closeModal() {
    var backdrop = document.querySelector('[data-mall-tag-modal]');
    if (backdrop) backdrop.remove();
  }

  function closeWarmConfirmModal() {
    var backdrop = document.querySelector('[data-mall-tag-warm]');
    if (backdrop) backdrop.remove();
  }

  function openWarmConfirm(message, onConfirm) {
    closeWarmConfirmModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-mall-tag-warm', '1');
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
      '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
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

  function updateNameCounter(input, counterEl) {
    if (!input || !counterEl) return;
    var len = input.value.length;
    counterEl.textContent = len + ' / ' + TAG_NAME_MAX;
  }

  function openTagModal(options) {
    closeModal();
    options = options || {};
    var isEdit = !!options.tag;
    var tag = options.tag;
    var title = isEdit ? '标签-编辑' : '标签-新增';
    var initialName = isEdit ? tag.name : '';

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-mall-tag-modal-backdrop';
    backdrop.setAttribute('data-mall-tag-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-mall-tag-modal">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' + title + '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-modal-fullscreen aria-label="全屏" title="全屏">&#9723;</button>' +
      '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="product-mall-tag-form__row">' +
      '      <label class="product-mall-tag-form__label" for="mallTagName">' +
      '        <span class="product-add-field__req">*</span>标签名称' +
      '      </label>' +
      '      <div class="product-mall-tag-form__control">' +
      '        <input class="product-mall-tag-form__input" id="mallTagName" type="text" placeholder="请输入标签名称" maxlength="' + TAG_NAME_MAX + '" value="' + escapeHtml(initialName) + '">' +
      '        <span class="product-mall-tag-form__counter" id="mallTagNameCounter">' + initialName.length + ' / ' + TAG_NAME_MAX + '</span>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-modal-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-modal-save>保存</button>' +
      '  </div>' +
      '</div>';

    var modal = backdrop.querySelector('.product-mall-tag-modal');
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    var fullscreenBtn = backdrop.querySelector('[data-modal-fullscreen]');
    if (fullscreenBtn && modal) {
      fullscreenBtn.addEventListener('click', function () {
        var on = modal.classList.toggle('erp-modal--fullscreen');
        fullscreenBtn.title = on ? '退出全屏' : '全屏';
      });
    }

    var nameInput = backdrop.querySelector('#mallTagName');
    var counterEl = backdrop.querySelector('#mallTagNameCounter');
    if (nameInput && counterEl) {
      nameInput.addEventListener('input', function () {
        updateNameCounter(nameInput, counterEl);
      });
    }

    backdrop.querySelector('[data-modal-save]').addEventListener('click', function () {
      var name = (nameInput || {}).value.trim();
      var result = isEdit
        ? store.updateTag(tag.id, { name: name })
        : store.addTag({ name: name });

      if (!result.ok) {
        if (typeof showToast === 'function') showToast(result.message, 'warning');
        return;
      }

      closeModal();
      refresh(false);
      if (typeof showToast === 'function') showToast(isEdit ? '标签已更新' : '标签已新增', 'success');
    });

    document.body.appendChild(backdrop);
    if (nameInput) {
      nameInput.focus();
      if (isEdit) nameInput.select();
    }
  }

  function getTagIndex(id) {
    for (var i = 0; i < state.list.length; i++) {
      if (state.list[i].id === id) return i;
    }
    return -1;
  }

  function renderMoreMenu(tag) {
    var index = getTagIndex(tag.id);
    var canUp = index > 0;
    var canDown = index >= 0 && index < state.list.length - 1;

    return (
      '<div class="product-more product-more--tag" data-more-wrap>' +
      '  <button type="button" class="product-more__btn" data-more-toggle>更多 <span class="product-more__caret">▼</span></button>' +
      '  <div class="product-more__menu">' +
      '    <button type="button" class="product-more__item' + (canUp ? '' : ' is-disabled') + '" data-action="move-up" data-id="' + escapeHtml(tag.id) + '"' + (canUp ? '' : ' disabled') + '>上移</button>' +
      '    <button type="button" class="product-more__item' + (canDown ? '' : ' is-disabled') + '" data-action="move-down" data-id="' + escapeHtml(tag.id) + '"' + (canDown ? '' : ' disabled') + '>下移</button>' +
      '    <button type="button" class="product-more__item product-more__item--danger" data-action="delete" data-id="' + escapeHtml(tag.id) + '">删除</button>' +
      '  </div>' +
      '</div>'
    );
  }

  function renderActions(tag) {
    return (
      '<div class="product-action product-action--center">' +
      '  <button type="button" class="product-action__link" data-action="edit" data-id="' + escapeHtml(tag.id) + '">编辑</button>' +
      renderMoreMenu(tag) +
      '</div>'
    );
  }

  function renderTable() {
    var tbody = document.getElementById('mallTagTableBody');
    var emptyEl = document.getElementById('mallTagEmpty');
    if (!tbody) return;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.list.slice(start, start + state.pageSize);

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      tbody.innerHTML = pageItems.map(function (tag) {
        return (
          '<tr data-id="' + escapeHtml(tag.id) + '">' +
          '<td class="product-mall-tag-table__td product-mall-tag-table__td--sort">' + tag.sort + '</td>' +
          '<td class="product-mall-tag-table__td product-mall-tag-table__td--id">' + escapeHtml(tag.id) + '</td>' +
          '<td class="product-mall-tag-table__td product-mall-tag-table__td--name">' + escapeHtml(tag.name) + '</td>' +
          '<td class="product-mall-tag-table__td product-mall-tag-table__td--count">' + tag.bind_count + '</td>' +
          '<td class="product-mall-tag-table__td product-mall-tag-table__td--time">' + escapeHtml(tag.created_at) + '</td>' +
          '<td class="product-mall-tag-table__td product-mall-tag-table__td--action">' + renderActions(tag) + '</td>' +
          '</tr>'
        );
      }).join('');
    }
    renderPagination();
  }

  function renderPagination() {
    var totalEl = document.getElementById('mallTagPaginationTotal');
    var pagesEl = document.getElementById('mallTagPaginationPages');
    var gotoEl = document.getElementById('mallTagPageGoto');
    var total = state.list.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    var page = state.page;

    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(page);
    if (!pagesEl) return;

    var html = '';
    html += '<button type="button" class="product-pagination__btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';

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
        html += '<button type="button" class="product-pagination__btn' + (p === page ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
      }
    });

    html += '<button type="button" class="product-pagination__btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function closeAllMoreMenus() {
    document.querySelectorAll('.product-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  function refresh(resetPage) {
    if (resetPage) state.page = 1;
    state.list = store.getAll();
    var totalPages = Math.max(1, Math.ceil(state.list.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    renderTable();
  }

  function performDelete(id) {
    var result = store.removeTag(id);
    if (!result.ok) {
      if (typeof showToast === 'function') showToast(result.message, 'warning');
      return;
    }
    refresh(false);
    if (typeof showToast === 'function') showToast('标签已删除', 'success');
  }

  function handleDelete(id) {
    var tag = store.getById(id);
    if (!tag) return;
    closeAllMoreMenus();

    var message = '确认删除「' + tag.name + '」？删除后将从所有商品中移除该标签';
    openWarmConfirm(message, function () {
      openWarmConfirm(message, function () {
        performDelete(id);
      });
    });
  }

  function handleMove(id, direction) {
    closeAllMoreMenus();
    var result = store.moveTag(id, direction);
    if (!result.ok) {
      if (typeof showToast === 'function') showToast(result.message, 'warning');
      return;
    }
    refresh(false);
    if (typeof showToast === 'function') showToast(direction === 'up' ? '已上移' : '已下移', 'success');
  }

  function bindEvents() {
    var addBtn = document.getElementById('mallTagAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openTagModal();
      });
    }

    var tbody = document.getElementById('mallTagTableBody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
          e.preventDefault();
          var tag = store.getById(editBtn.getAttribute('data-id'));
          if (tag) openTagModal({ tag: tag });
          return;
        }

        var moveUpBtn = e.target.closest('[data-action="move-up"]');
        if (moveUpBtn && !moveUpBtn.disabled) {
          e.preventDefault();
          handleMove(moveUpBtn.getAttribute('data-id'), 'up');
          return;
        }

        var moveDownBtn = e.target.closest('[data-action="move-down"]');
        if (moveDownBtn && !moveDownBtn.disabled) {
          e.preventDefault();
          handleMove(moveDownBtn.getAttribute('data-id'), 'down');
          return;
        }

        var deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
          e.preventDefault();
          handleDelete(deleteBtn.getAttribute('data-id'));
          return;
        }

        var toggleBtn = e.target.closest('[data-more-toggle]');
        if (toggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          var wrap = toggleBtn.closest('[data-more-wrap]');
          if (!wrap) return;
          var open = wrap.classList.contains('is-open');
          closeAllMoreMenus();
          if (!open) wrap.classList.add('is-open');
        }
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-more-wrap]')) closeAllMoreMenus();
    });

    var pageSizeEl = document.getElementById('mallTagPageSize');
    if (pageSizeEl) {
      pageSizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(pageSizeEl.value, 10) || 20;
        state.page = 1;
        renderTable();
      });
    }

    var pagination = document.getElementById('mallTagPagination');
    if (pagination) {
      pagination.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderTable();
      });
    }

    var gotoEl = document.getElementById('mallTagPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var totalPages = Math.max(1, Math.ceil(state.list.length / state.pageSize));
        var val = parseInt(gotoEl.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });
      gotoEl.addEventListener('blur', function () {
        gotoEl.value = String(state.page);
      });
    }
  }

  function init() {
    if (!store) return;
    bindEvents();
    refresh(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
