/**
 * 代采商品 — 可搜索三级类目选择器（仅已上架链路可选）
 */
(function () {
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mount(options) {
    var store = window.MdmProxyCategoryStore;
    if (!store) return null;

    options = options || {};
    var wrap = options.container;
    if (!wrap) return null;

    var selectedId = options.value || '';
    var selectedPath = '';
    if (selectedId) {
      var node = store.getNode(selectedId);
      if (node && store.isSelectableL3(selectedId)) selectedPath = node.path;
      else selectedId = '';
    }

    wrap.innerHTML =
      '<div class="proxy-cat-picker">' +
      '  <div class="proxy-cat-picker__selected" id="proxyCatPickerSelected">' +
      (selectedPath
        ? '<span class="proxy-cat-picker__path">' + escapeHtml(selectedPath) + '</span>'
        : '<span class="proxy-cat-picker__placeholder">请搜索并选择三级类目</span>') +
      '  </div>' +
      '  <div class="proxy-cat-picker__search-wrap">' +
      '    <input type="text" class="proxy-cat-picker__input" id="proxyCatPickerInput" placeholder="输入类目名称或路径搜索（仅已上架）" autocomplete="off">' +
      '    <div class="proxy-cat-picker__dropdown" id="proxyCatPickerDropdown" hidden></div>' +
      '  </div>' +
      '  <input type="hidden" id="proxyCatPickerValue" value="' + escapeHtml(selectedId) + '">' +
      '</div>';

    var inputEl = wrap.querySelector('#proxyCatPickerInput');
    var dropdownEl = wrap.querySelector('#proxyCatPickerDropdown');
    var selectedEl = wrap.querySelector('#proxyCatPickerSelected');
    var hiddenEl = wrap.querySelector('#proxyCatPickerValue');

    function renderDropdown(list) {
      if (!list.length) {
        dropdownEl.innerHTML = '<div class="proxy-cat-picker__empty">无匹配的已上架类目</div>';
        dropdownEl.hidden = false;
        return;
      }
      dropdownEl.innerHTML = list.map(function (c) {
        return (
          '<button type="button" class="proxy-cat-picker__option" data-id="' + c.id + '" data-path="' + escapeHtml(c.path) + '">' +
          escapeHtml(c.path) +
          '</button>'
        );
      }).join('');
      dropdownEl.hidden = false;
    }

    function selectItem(id, path) {
      selectedId = id;
      selectedPath = path;
      hiddenEl.value = id;
      selectedEl.innerHTML = '<span class="proxy-cat-picker__path">' + escapeHtml(path) + '</span>';
      dropdownEl.hidden = true;
      inputEl.value = '';
      if (typeof options.onChange === 'function') options.onChange(id, path);
    }

    function doSearch() {
      var list = store.searchSelectableL3(inputEl.value);
      renderDropdown(list);
    }

    inputEl.addEventListener('focus', doSearch);
    inputEl.addEventListener('input', doSearch);

    dropdownEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.proxy-cat-picker__option[data-id]');
      if (!btn) return;
      selectItem(btn.getAttribute('data-id'), btn.getAttribute('data-path'));
    });

    document.addEventListener('click', function closeDropdown(e) {
      if (!wrap.contains(e.target)) dropdownEl.hidden = true;
    });

    return {
      getValue: function () { return hiddenEl.value; },
      getPath: function () { return selectedPath; },
      setValue: function (id) {
        var node = store.getNode(id);
        if (node && store.isSelectableL3(id)) selectItem(id, node.path);
        else {
          selectedId = '';
          selectedPath = '';
          hiddenEl.value = '';
          selectedEl.innerHTML = '<span class="proxy-cat-picker__placeholder">请搜索并选择三级类目</span>';
        }
      }
    };
  }

  window.MdmProxyCategoryPicker = { mount: mount };
})();
