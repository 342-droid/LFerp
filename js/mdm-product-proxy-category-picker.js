/**
 * 代采商品 — 三级类目逐级选择器（支持多选，仅已上架链路可选）
 */
(function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeSelected(store, ids) {
    var list = [];
    (ids || []).forEach(function (id) {
      var node = store.getNode(id);
      if (node && store.isSelectableL3(id)) {
        list.push({ id: node.id, path: node.path });
      }
    });
    return list;
  }

  function normalizeInitial(store, options) {
    if (Array.isArray(options.values) && options.values.length) {
      return normalizeSelected(store, options.values);
    }
    if (options.value) {
      return normalizeSelected(store, [options.value]);
    }
    return [];
  }

  function renderSelectedTags(selected, editable) {
    if (!selected.length) {
      return '<span class="proxy-cat-picker__placeholder">请选择三级类目</span>';
    }
    return selected.map(function (item) {
      return (
        '<span class="proxy-cat-picker__tag" data-id="' + escapeHtml(item.id) + '">' +
        '  <span class="proxy-cat-picker__tag-text">' + escapeHtml(item.path) + '</span>' +
        (editable
          ? '  <button type="button" class="proxy-cat-picker__tag-remove" data-remove-id="' + escapeHtml(item.id) + '" aria-label="移除">&times;</button>'
          : '') +
        '</span>'
      );
    }).join('');
  }

  function getOnShelfChildren(store, parentId) {
    return store.getChildren(parentId).filter(function (node) {
      if (node.status !== 'on_shelf') return false;
      if (node.level === 3) return store.isSelectableL3(node.id);
      return true;
    });
  }

  function renderCascadeItem(node, selectedId, showIcon, pickedIds) {
    var active = node.id === selectedId ? ' is-active' : '';
    var picked = pickedIds[node.id] ? ' is-picked' : '';
    var iconHtml = '';
    if (showIcon && node.icon) {
      iconHtml = '<img class="product-category-cascade__avatar" src="' + node.icon + '" alt="">';
    } else if (showIcon) {
      iconHtml = '<span class="product-category-cascade__avatar product-category-cascade__avatar--placeholder">' + escapeHtml(node.name.charAt(0)) + '</span>';
    }
    var hotHtml = node.is_hot ? '<span class="product-category-cascade__hot" title="爆品">🔥</span>' : '';
    var pickMark = node.level === 3 && pickedIds[node.id]
      ? '<span class="proxy-cat-cascade__picked" aria-hidden="true">✓</span>'
      : '';
    return (
      '<li class="product-category-cascade__item' + active + picked + '" data-id="' + node.id + '" data-level="' + node.level + '">' +
      iconHtml +
      '<span class="product-category-cascade__name">' + hotHtml + escapeHtml(node.name) + pickMark + '</span>' +
      (node.level < 3 ? '<span class="product-category-cascade__count">' + node.product_count + '</span>' : '') +
      '</li>'
    );
  }

  function renderCascadeColumn(listEl, nodes, selectedId, showIcon, emptyText, pickedIds) {
    if (!listEl) return;
    if (!nodes.length) {
      listEl.innerHTML = '<li class="product-category-cascade__empty">' + escapeHtml(emptyText) + '</li>';
      return;
    }
    listEl.innerHTML = nodes.map(function (n) {
      return renderCascadeItem(n, selectedId, showIcon, pickedIds);
    }).join('');
  }

  function openCascadeModal(store, selected, onApply) {
    var state = {
      selectedL1: '',
      selectedL2: '',
      draft: selected.slice()
    };

    function pickedMap() {
      var map = {};
      state.draft.forEach(function (item) { map[item.id] = true; });
      return map;
    }

    function syncHints(backdrop) {
      var hintL2 = backdrop.querySelector('#proxyCatCascadeHintL2');
      var hintL3 = backdrop.querySelector('#proxyCatCascadeHintL3');
      var l1 = state.selectedL1 ? store.getNode(state.selectedL1) : null;
      var l2 = state.selectedL2 ? store.getNode(state.selectedL2) : null;
      if (hintL2) hintL2.textContent = l1 ? '所属：' + l1.name : '请先选择一级类目';
      if (hintL3) hintL3.textContent = l2 ? '所属：' + (l1 ? l1.name + ' / ' : '') + l2.name : '请先选择二级类目';
    }

    function refresh(backdrop) {
      var l1List = getOnShelfChildren(store, null);
      var l2List = state.selectedL1 ? getOnShelfChildren(store, state.selectedL1) : [];
      var l3List = state.selectedL2 ? getOnShelfChildren(store, state.selectedL2) : [];
      var picked = pickedMap();

      renderCascadeColumn(
        backdrop.querySelector('#proxyCatCascadeL1'),
        l1List,
        state.selectedL1,
        true,
        '暂无已上架一级类目',
        picked
      );
      renderCascadeColumn(
        backdrop.querySelector('#proxyCatCascadeL2'),
        l2List,
        state.selectedL2,
        false,
        state.selectedL1 ? '该一级下暂无已上架二级类目' : '请先选择一级类目',
        picked
      );
      renderCascadeColumn(
        backdrop.querySelector('#proxyCatCascadeL3'),
        l3List,
        '',
        false,
        state.selectedL2 ? '该二级下暂无已上架三级类目' : '请先选择二级类目',
        picked
      );

      var draftEl = backdrop.querySelector('#proxyCatCascadeDraft');
      if (draftEl) {
        draftEl.innerHTML = state.draft.length
          ? state.draft.map(function (item) {
            return (
              '<span class="proxy-cat-picker__tag">' +
              '  <span class="proxy-cat-picker__tag-text">' + escapeHtml(item.path) + '</span>' +
              '  <button type="button" class="proxy-cat-picker__tag-remove" data-draft-remove="' + escapeHtml(item.id) + '" aria-label="移除">&times;</button>' +
              '</span>'
            );
          }).join('')
          : '<span class="proxy-cat-cascade__draft-empty">暂未选择类目，请逐级点选三级类目</span>';
      }

      syncHints(backdrop);
    }

    function toggleDraft(node) {
      if (!store.isSelectableL3(node.id)) return;
      var idx = -1;
      for (var i = 0; i < state.draft.length; i++) {
        if (state.draft[i].id === node.id) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) state.draft.splice(idx, 1);
      else state.draft.push({ id: node.id, path: node.path });
    }

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop proxy-cat-cascade-backdrop';
    backdrop.setAttribute('data-proxy-cat-cascade', '1');
    backdrop.innerHTML =
      '<div class="erp-modal proxy-cat-cascade-modal">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">选择类目</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-cat-cascade-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body proxy-cat-cascade__body">' +
      '    <p class="proxy-cat-cascade__tip">请依次选择一级 → 二级 → 三级类目；点击三级类目加入绑定，可重复打开继续添加多个类目。</p>' +
      '    <div class="product-category-cascade proxy-cat-cascade">' +
      '      <div class="product-category-cascade__col" data-level="1">' +
      '        <div class="product-category-cascade__head">' +
      '          <div class="product-category-cascade__title"><span class="product-category-cascade__level">L1</span>一级类目</div>' +
      '        </div>' +
      '        <ul class="product-category-cascade__list" id="proxyCatCascadeL1"></ul>' +
      '      </div>' +
      '      <div class="product-category-cascade__col" data-level="2">' +
      '        <div class="product-category-cascade__head">' +
      '          <div class="product-category-cascade__title"><span class="product-category-cascade__level">L2</span>二级类目</div>' +
      '          <p class="product-category-cascade__hint" id="proxyCatCascadeHintL2">请先选择一级类目</p>' +
      '        </div>' +
      '        <ul class="product-category-cascade__list" id="proxyCatCascadeL2"></ul>' +
      '      </div>' +
      '      <div class="product-category-cascade__col" data-level="3">' +
      '        <div class="product-category-cascade__head">' +
      '          <div class="product-category-cascade__title"><span class="product-category-cascade__level">L3</span>三级类目</div>' +
      '          <p class="product-category-cascade__hint" id="proxyCatCascadeHintL3">请先选择二级类目</p>' +
      '        </div>' +
      '        <ul class="product-category-cascade__list" id="proxyCatCascadeL3"></ul>' +
      '      </div>' +
      '    </div>' +
      '    <div class="proxy-cat-cascade__draft">' +
      '      <div class="proxy-cat-cascade__draft-label">已选类目</div>' +
      '      <div class="proxy-cat-cascade__draft-tags" id="proxyCatCascadeDraft"></div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-cat-cascade-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-cat-cascade-ok>确定</button>' +
      '  </div>' +
      '</div>';

    function close() {
      backdrop.remove();
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });
    backdrop.querySelector('[data-cat-cascade-close]').addEventListener('click', close);
    backdrop.querySelector('[data-cat-cascade-cancel]').addEventListener('click', close);
    backdrop.querySelector('[data-cat-cascade-ok]').addEventListener('click', function () {
      if (typeof onApply === 'function') onApply(state.draft.slice());
      close();
    });

    backdrop.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('[data-draft-remove]');
      if (removeBtn) {
        var rid = removeBtn.getAttribute('data-draft-remove');
        state.draft = state.draft.filter(function (item) { return item.id !== rid; });
        refresh(backdrop);
        return;
      }

      var item = e.target.closest('.product-category-cascade__item[data-id]');
      if (!item) return;
      var id = item.getAttribute('data-id');
      var level = parseInt(item.getAttribute('data-level'), 10);
      var node = store.getNode(id);
      if (!node) return;

      if (level === 1) {
        state.selectedL1 = id;
        state.selectedL2 = '';
        refresh(backdrop);
        return;
      }
      if (level === 2) {
        state.selectedL2 = id;
        refresh(backdrop);
        return;
      }
      if (level === 3) {
        toggleDraft(node);
        refresh(backdrop);
      }
    });

    document.body.appendChild(backdrop);
    refresh(backdrop);
  }

  function mount(options) {
    var store = window.MdmProxyCategoryStore;
    if (!store) return null;

    options = options || {};
    var wrap = options.container;
    if (!wrap) return null;

    var selected = normalizeInitial(store, options);

    function notifyChange() {
      if (typeof options.onChange === 'function') {
        options.onChange(
          selected.map(function (s) { return s.id; }),
          selected.map(function (s) { return s.path; })
        );
      }
    }

    function renderMain() {
      wrap.innerHTML =
        '<div class="proxy-cat-picker">' +
        '  <div class="proxy-cat-picker__selected" id="proxyCatPickerSelected">' + renderSelectedTags(selected, true) + '</div>' +
        '  <button type="button" class="proxy-cat-picker__add" id="proxyCatPickerAddBtn">+ 选择类目</button>' +
        '</div>';

      var selectedEl = wrap.querySelector('#proxyCatPickerSelected');
      var addBtn = wrap.querySelector('#proxyCatPickerAddBtn');

      if (selectedEl) {
        selectedEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-remove-id]');
          if (!btn) return;
          var rid = btn.getAttribute('data-remove-id');
          selected = selected.filter(function (item) { return item.id !== rid; });
          selectedEl.innerHTML = renderSelectedTags(selected, true);
          notifyChange();
        });
      }

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          openCascadeModal(store, selected, function (draft) {
            selected = draft.slice();
            if (selectedEl) selectedEl.innerHTML = renderSelectedTags(selected, true);
            notifyChange();
          });
        });
      }
    }

    renderMain();

    return {
      getValues: function () {
        return selected.map(function (s) { return s.id; });
      },
      getPaths: function () {
        return selected.map(function (s) { return s.path; });
      },
      getValue: function () {
        return selected[0] ? selected[0].id : '';
      },
      getPath: function () {
        return selected[0] ? selected[0].path : '';
      },
      setValues: function (ids) {
        selected = normalizeSelected(store, ids);
        var selectedEl = wrap.querySelector('#proxyCatPickerSelected');
        if (selectedEl) selectedEl.innerHTML = renderSelectedTags(selected, true);
        notifyChange();
      },
      setValue: function (id) {
        this.setValues(id ? [id] : []);
      }
    };
  }

  window.MdmProxyCategoryPicker = { mount: mount };
})();
