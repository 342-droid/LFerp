/**
 * 选品库 · 商品标签管理抽屉
 */
(function () {
  var store = window.MdmProductSelectionTagStore;
  var PAGE_SIZE_OPTIONS = [20, 50, 100];
  var SOURCE_LABEL = { system: '系统管理', business: '业务创建' };
  var STATUS_LABEL = { active: '启用', stopped: '停用' };

  var state = {
    open: false,
    keyword: '',
    source: '',
    status: '',
    collapsed: true,
    page: 1,
    pageSize: 20
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'success');
      return;
    }
    window.alert(msg);
  }

  function filteredList() {
    var keyword = String(state.keyword || '').trim().toLowerCase();
    return (store.getAll() || []).filter(function (row) {
      if (keyword && String(row.name).toLowerCase().indexOf(keyword) < 0) return false;
      if (state.source && row.source !== state.source) return false;
      if (state.status && row.status !== state.status) return false;
      return true;
    });
  }

  function pageRows() {
    var all = filteredList();
    var start = (state.page - 1) * state.pageSize;
    return { total: all.length, rows: all.slice(start, start + state.pageSize) };
  }

  function renderPill(row) {
    var meta = store.colorMeta(row.color);
    return (
      '<span class="sel-tag-pill" style="color:' +
      meta.text +
      ';border-color:' +
      meta.border +
      ';background:' +
      meta.bg +
      '">' +
      escapeHtml(row.name) +
      '</span>'
    );
  }

  function renderOps(row) {
    if (row.isSystem) {
      return '<span aria-label="系统标签不可编辑">—</span>';
    }
    return (
      '<div class="sel-tag-actions">' +
      '<button type="button" class="product-action__link" data-tag-edit="' +
      escapeHtml(row.id) +
      '">编辑</button>' +
      '<button type="button" class="product-action__link" data-tag-toggle="' +
      escapeHtml(row.id) +
      '">' +
      (row.status === 'active' ? '停用' : '启用') +
      '</button>' +
      '<button type="button" class="product-action__link is-muted" data-tag-remove="' +
      escapeHtml(row.id) +
      '">删除</button>' +
      '</div>'
    );
  }

  function renderTable() {
    var tbody = $('selTagTableBody');
    var empty = $('selTagEmpty');
    if (!tbody) return;
    var pageData = pageRows();
    if (!pageData.rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      tbody.innerHTML = pageData.rows
        .map(function (row) {
          var meta = store.colorMeta(row.color);
          return (
            '<tr data-id="' +
            escapeHtml(row.id) +
            '">' +
            '<td>' +
            renderPill(row) +
            '</td>' +
            '<td>' +
            escapeHtml(meta.label) +
            '</td>' +
            '<td>' +
            escapeHtml(SOURCE_LABEL[row.source] || '业务创建') +
            '</td>' +
            '<td><span class="sel-tag-status ' +
            (row.status === 'active' ? 'is-on' : 'is-off') +
            '">' +
            escapeHtml(STATUS_LABEL[row.status] || '启用') +
            '</span></td>' +
            '<td>' +
            renderOps(row) +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
    }
    renderPagination(pageData.total);
  }

  function renderPagination(total) {
    var totalEl = $('selTagPaginationTotal');
    var pagesEl = $('selTagPaginationPages');
    var sizeEl = $('selTagPageSize');
    var gotoEl = $('selTagPageGoto');
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (sizeEl) sizeEl.value = String(state.pageSize);
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    if (gotoEl) gotoEl.value = String(state.page);
    if (!pagesEl) return;
    pagesEl.innerHTML =
      '<button type="button" class="product-pagination__btn" data-page="' +
      (state.page - 1) +
      '"' +
      (state.page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>' +
      '<button type="button" class="product-pagination__btn is-active" data-page="' +
      state.page +
      '">' +
      state.page +
      '</button>' +
      '<button type="button" class="product-pagination__btn" data-page="' +
      (state.page + 1) +
      '"' +
      (state.page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>';
  }

  function syncCollapse() {
    var extras = document.querySelectorAll('.sel-tag-filter__extra');
    extras.forEach(function (el) {
      el.hidden = state.collapsed;
    });
    var label = $('selTagFilterCollapseLabel');
    var btn = $('selTagFilterCollapse');
    if (label) label.textContent = state.collapsed ? '展开' : '收起';
    if (btn) {
      btn.setAttribute('aria-expanded', state.collapsed ? 'false' : 'true');
      btn.classList.toggle('is-expanded', !state.collapsed);
    }
  }

  function readFilters() {
    state.keyword = ($('selTagFilterName') && $('selTagFilterName').value) || '';
    state.source = ($('selTagFilterSource') && $('selTagFilterSource').value) || '';
    state.status = ($('selTagFilterStatus') && $('selTagFilterStatus').value) || '';
  }

  function resetFilters() {
    if ($('selTagFilterName')) $('selTagFilterName').value = '';
    if ($('selTagFilterSource')) $('selTagFilterSource').value = '';
    if ($('selTagFilterStatus')) $('selTagFilterStatus').value = '';
    state.keyword = '';
    state.source = '';
    state.status = '';
    state.page = 1;
    renderTable();
  }

  function closeFormModal() {
    var backdrop = document.querySelector('[data-sel-tag-form]');
    if (backdrop) backdrop.remove();
  }

  function openFormModal(tag) {
    closeFormModal();
    var isEdit = !!tag;
    var colorOptions = Object.keys(store.COLOR_MAP)
      .map(function (key) {
        var selected = (isEdit ? tag.color : 'orange') === key ? ' selected' : '';
        return (
          '<option value="' +
          key +
          '"' +
          selected +
          '>' +
          store.COLOR_MAP[key].label +
          '</option>'
        );
      })
      .join('');
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop sel-tag-modal-backdrop';
    backdrop.setAttribute('data-sel-tag-form', '1');
    backdrop.innerHTML =
      '<div class="erp-modal" role="dialog" aria-modal="true">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' +
      (isEdit ? '编辑标签' : '新增标签') +
      '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-form-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="sel-tag-form__row">' +
      '      <label class="sel-tag-form__label" for="selTagFormName"><span class="sel-tag-form__req">*</span>标签名称</label>' +
      '      <div class="sel-tag-form__control">' +
      '        <input class="sel-tag-form__input" id="selTagFormName" type="text" maxlength="20" placeholder="请输入标签名称" value="' +
      escapeHtml(isEdit ? tag.name : '') +
      '">' +
      '      </div>' +
      '    </div>' +
      '    <div class="sel-tag-form__row">' +
      '      <label class="sel-tag-form__label" for="selTagFormColor"><span class="sel-tag-form__req">*</span>颜色</label>' +
      '      <div class="sel-tag-form__control">' +
      '        <select class="sel-tag-form__select" id="selTagFormColor">' +
      colorOptions +
      '</select>' +
      '        <div class="sel-tag-form__tip">列表中按所选颜色展示标签胶囊。</div>' +
      '      </div>' +
      '    </div>' +
      '    <div class="sel-tag-form__row">' +
      '      <label class="sel-tag-form__label" for="selTagFormStatus">状态</label>' +
      '      <div class="sel-tag-form__control">' +
      '        <select class="sel-tag-form__select" id="selTagFormStatus">' +
      '          <option value="active"' +
      (!isEdit || tag.status === 'active' ? ' selected' : '') +
      '>启用</option>' +
      '          <option value="stopped"' +
      (isEdit && tag.status === 'stopped' ? ' selected' : '') +
      '>停用</option>' +
      '        </select>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-form-close>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-form-save>保存</button>' +
      '  </div>' +
      '</div>';

    function shut() {
      closeFormModal();
    }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) shut();
    });
    backdrop.querySelectorAll('[data-form-close]').forEach(function (btn) {
      btn.addEventListener('click', shut);
    });
    backdrop.querySelector('[data-form-save]').addEventListener('click', function () {
      var payload = {
        name: ($('selTagFormName') && $('selTagFormName').value) || '',
        color: ($('selTagFormColor') && $('selTagFormColor').value) || 'orange',
        status: ($('selTagFormStatus') && $('selTagFormStatus').value) || 'active'
      };
      var result = isEdit ? store.updateTag(tag.id, payload) : store.addTag(payload);
      if (!result.ok) {
        toast(result.message, 'warning');
        return;
      }
      shut();
      renderTable();
      toast(isEdit ? '标签已更新' : '标签已新增');
    });
    document.body.appendChild(backdrop);
    var nameInput = $('selTagFormName');
    if (nameInput) nameInput.focus();
  }

  function confirmDelete(id) {
    var row = store.getById(id);
    if (!row) return;
    if (
      !window.confirm('确认删除标签「' + row.name + '」吗？已绑定商品将不再展示该标签。')
    ) {
      return;
    }
    var result = store.removeTag(id);
    if (!result.ok) {
      toast(result.message, 'warning');
      return;
    }
    renderTable();
    toast('标签已删除');
  }

  function openDrawer() {
    var root = $('selTagDrawerRoot');
    if (!root) return;
    root.hidden = false;
    state.open = true;
    document.body.classList.add('sel-tag-drawer-open');
    syncCollapse();
    renderTable();
  }

  function closeDrawer() {
    var root = $('selTagDrawerRoot');
    if (root) root.hidden = true;
    state.open = false;
    document.body.classList.remove('sel-tag-drawer-open');
    closeFormModal();
  }

  function bindDrawer() {
    var queryBtn = $('selTagFilterQuery');
    var resetBtn = $('selTagFilterReset');
    var collapseBtn = $('selTagFilterCollapse');
    var addBtn = $('selTagAddBtn');
    var closeBtn = $('selTagDrawerClose');
    var backdrop = $('selTagDrawerBackdrop');
    var pagesEl = $('selTagPaginationPages');
    var sizeEl = $('selTagPageSize');
    var gotoEl = $('selTagPageGoto');
    var tbody = $('selTagTableBody');

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        readFilters();
        state.page = 1;
        renderTable();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        state.collapsed = !state.collapsed;
        syncCollapse();
      });
    }
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openFormModal(null);
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) {
      backdrop.addEventListener('click', closeDrawer);
    }
    if (pagesEl) {
      pagesEl.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var page = parseInt(btn.getAttribute('data-page'), 10);
        if (!page || page < 1) return;
        state.page = page;
        renderTable();
      });
    }
    if (sizeEl) {
      if (!sizeEl.options.length) {
        PAGE_SIZE_OPTIONS.forEach(function (n) {
          var opt = document.createElement('option');
          opt.value = String(n);
          opt.textContent = n + '条/页';
          sizeEl.appendChild(opt);
        });
      }
      sizeEl.value = String(state.pageSize);
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        state.page = 1;
        renderTable();
      });
    }
    if (gotoEl) {
      gotoEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var total = filteredList().length;
        var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        var val = parseInt(gotoEl.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });
    }
    if (tbody) {
      tbody.addEventListener('click', function (ev) {
        var editBtn = ev.target.closest('[data-tag-edit]');
        if (editBtn) {
          openFormModal(store.getById(editBtn.getAttribute('data-tag-edit')));
          return;
        }
        var toggleBtn = ev.target.closest('[data-tag-toggle]');
        if (toggleBtn) {
          var row = store.getById(toggleBtn.getAttribute('data-tag-toggle'));
          if (!row) return;
          var next = row.status === 'active' ? 'stopped' : 'active';
          var result = store.setStatus(row.id, next);
          if (!result.ok) {
            toast(result.message, 'warning');
            return;
          }
          renderTable();
          toast(next === 'active' ? '标签已启用' : '标签已停用');
          return;
        }
        var removeBtn = ev.target.closest('[data-tag-remove]');
        if (removeBtn) confirmDelete(removeBtn.getAttribute('data-tag-remove'));
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.open && !document.querySelector('[data-sel-tag-form]')) {
        closeDrawer();
      }
    });
  }

  function bindEntry() {
    var btn = $('productTagManageBtn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openDrawer();
    });
  }

  function init() {
    bindEntry();
    bindDrawer();
    syncCollapse();
    window.MdmProductSelectionTagDrawer = {
      open: openDrawer,
      close: closeDrawer
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
