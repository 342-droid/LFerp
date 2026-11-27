/** 基础设置 · 门店分类配置 */
(function () {
  var selectedLine = 0;
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function button(label, action, index) {
    return '<button type="button" class="bs-category-action" data-action="' + action +
      '" data-index="' + index + '">' + label + '</button>';
  }

  function render() {
    var root = document.getElementById('bsCategoryTree');
    var api = window.StoreBizStructure;
    if (!root || !api) return;
    var nodes = api.tree();
    if (!nodes.length) {
      root.innerHTML = '<div class="bs-category-empty">暂无事业线，点击“新增事业线”开始配置。</div>';
      return;
    }
    selectedLine = Math.min(selectedLine, nodes.length - 1);
    var node = nodes[selectedLine];
    function summary(items) {
      if (!items.length) return '<span class="bs-category-muted">未配置</span>';
      return '<span class="bs-category-summary">' + escapeHtml(items.slice(0, 2).join('、')) +
        (items.length > 2 ? ' 等 ' + items.length + ' 项' : '') + '</span>';
    }
    root.innerHTML = '<div class="bs-category-picker"><label for="bsCategoryLine">事业线</label>' +
      '<select id="bsCategoryLine" class="erp-select">' + nodes.map(function (item, index) {
        return '<option value="' + index + '"' + (index === selectedLine ? ' selected' : '') + '>' + escapeHtml(item.line) + '</option>';
      }).join('') + '</select>' +
      button('修改', 'edit-line', -1) + button('删除', 'delete-line', -1) +
      '<span class="bs-category-count">共 ' + nodes.length + ' 条事业线</span></div>' +
      '<div class="bs-category-compact-row"><span class="bs-category-label">品牌名称</span>' +
      summary(node.brands) + '<span class="bs-category-row-count">' + node.brands.length + ' 项</span>' +
      button('管理', 'manage-brand', -1) + '</div>' +
      '<div class="bs-category-compact-row"><span class="bs-category-label">业务线</span>' +
      summary(node.biz) + '<span class="bs-category-row-count">' + node.biz.length + ' 项</span>' +
      button('管理', 'manage-biz', -1) + '</div>';
  }

  function openManage(kind) {
    var title = kind === 'brand' ? '品牌名称' : '业务线';
    var layer = document.createElement('div');
    layer.className = 'bs-category-modal';
    layer.innerHTML = '<div class="bs-category-dialog bs-category-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="bsCategoryManageTitle">' +
      '<div class="bs-category-dialog-head"><h3 id="bsCategoryManageTitle">管理' + title + '</h3>' +
      '<button type="button" class="bs-category-close" aria-label="关闭">×</button></div>' +
      '<p class="bs-category-dialog-subtitle"></p>' +
      '<input class="erp-input bs-category-search" type="search" placeholder="输入名称筛选" aria-label="筛选' + title + '">' +
      '<div class="bs-category-manage-list"></div>' +
      '<div class="bs-category-dialog-actions"><button type="button" class="erp-btn" data-close>关闭</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-add>+ 新增' + title + '</button></div></div>';
    document.body.appendChild(layer);
    var search = layer.querySelector('.bs-category-search');
    var list = layer.querySelector('.bs-category-manage-list');
    function paint() {
      var node = window.StoreBizStructure.tree()[selectedLine];
      if (!node) { layer.remove(); return; }
      layer.querySelector('.bs-category-dialog-subtitle').textContent = '事业线：' + node.line;
      var items = kind === 'brand' ? node.brands : node.biz;
      var query = search.value.trim().toLowerCase();
      var filtered = items.map(function (name, index) { return { name: name, index: index }; })
        .filter(function (row) { return row.name.toLowerCase().indexOf(query) >= 0; });
      list.innerHTML = filtered.length ? filtered.map(function (row) {
        return '<div class="bs-category-manage-item"><span>' + escapeHtml(row.name) + '</span><span>' +
          button('修改', 'edit-' + kind, row.index) + button('删除', 'delete-' + kind, row.index) +
          '</span></div>';
      }).join('') : '<div class="bs-category-empty">' + (query ? '没有匹配项' : '暂无' + title) + '</div>';
    }
    function close() { layer.remove(); }
    search.addEventListener('input', paint);
    layer.querySelector('[data-close]').addEventListener('click', close);
    layer.querySelector('.bs-category-close').addEventListener('click', close);
    layer.querySelector('[data-add]').addEventListener('click', function () { act('add-' + kind, selectedLine, -1, paint); });
    list.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (target) act(target.dataset.action, selectedLine, Number(target.dataset.index), paint);
    });
    layer.addEventListener('click', function (event) { if (event.target === layer) close(); });
    layer.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
    paint();
    search.focus();
  }

  function addLine() {
    var layer = document.createElement('div');
    var draft = { brands: [], biz: [] };
    layer.className = 'bs-category-modal';
    layer.innerHTML = '<div class="bs-category-dialog bs-category-create-dialog" role="dialog" aria-modal="true" aria-labelledby="bsCategoryCreateTitle">' +
      '<h3 id="bsCategoryCreateTitle">新增事业线</h3>' +
      '<p class="bs-category-dialog-subtitle">事业线、品牌名称和业务线均需填写，保存后才会新增。</p>' +
      '<label for="bsCategoryNewLine"><span class="erp-req">*</span> 事业线</label>' +
      '<input id="bsCategoryNewLine" class="erp-input" maxlength="40" placeholder="请输入事业线名称">' +
      '<label for="bsCategoryNewBrand"><span class="erp-req">*</span> 品牌名称</label>' +
      '<div class="bs-category-add-row"><input id="bsCategoryNewBrand" class="erp-input" maxlength="40" placeholder="输入品牌名称">' +
      '<button type="button" class="erp-btn" data-add-item="brands">添加</button></div>' +
      '<div class="bs-category-draft-list" data-list="brands"></div>' +
      '<label for="bsCategoryNewBiz"><span class="erp-req">*</span> 业务线</label>' +
      '<div class="bs-category-add-row"><input id="bsCategoryNewBiz" class="erp-input" maxlength="40" placeholder="输入业务线名称">' +
      '<button type="button" class="erp-btn" data-add-item="biz">添加</button></div>' +
      '<div class="bs-category-draft-list" data-list="biz"></div>' +
      '<p class="bs-category-error" role="alert"></p>' +
      '<div class="bs-category-dialog-actions"><button type="button" class="erp-btn" data-close>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-save>保存</button></div></div>';
    document.body.appendChild(layer);
    var lineInput = layer.querySelector('#bsCategoryNewLine');
    var inputs = {
      brands: layer.querySelector('#bsCategoryNewBrand'),
      biz: layer.querySelector('#bsCategoryNewBiz')
    };
    var error = layer.querySelector('.bs-category-error');
    function close() { layer.remove(); }
    function paint(kind) {
      var box = layer.querySelector('[data-list="' + kind + '"]');
      box.innerHTML = draft[kind].map(function (name, index) {
        return '<span class="bs-category-draft-chip">' + escapeHtml(name) +
          '<button type="button" data-remove-item="' + kind + '" data-index="' + index +
          '" aria-label="删除' + escapeHtml(name) + '">×</button></span>';
      }).join('');
    }
    function addItem(kind) {
      var input = inputs[kind];
      var name = input.value.trim();
      if (!name) { input.focus(); return false; }
      if (draft[kind].indexOf(name) >= 0) {
        error.textContent = (kind === 'brands' ? '品牌名称' : '业务线') + '不能重复';
        input.focus();
        return false;
      }
      draft[kind].push(name);
      input.value = '';
      error.textContent = '';
      paint(kind);
      input.focus();
      return true;
    }
    function save() {
      var name = lineInput.value.trim();
      if (inputs.brands.value.trim() && !addItem('brands')) return;
      if (inputs.biz.value.trim() && !addItem('biz')) return;
      if (!name) { error.textContent = '请输入事业线名称'; lineInput.focus(); return; }
      var api = window.StoreBizStructure;
      var nodes = api.tree();
      if (nodes.some(function (node) { return node.line === name; })) {
        error.textContent = '事业线名称已存在'; lineInput.focus(); return;
      }
      if (!draft.brands.length) { error.textContent = '请至少添加一个品牌名称'; inputs.brands.focus(); return; }
      if (!draft.biz.length) { error.textContent = '请至少添加一条业务线'; inputs.biz.focus(); return; }
      nodes.push({ line: name, brands: draft.brands.slice(), biz: draft.biz.slice() });
      if (!api.saveTree(nodes)) { error.textContent = '保存失败，请重试'; return; }
      selectedLine = nodes.length - 1;
      close();
      render();
    }
    layer.querySelectorAll('[data-add-item]').forEach(function (control) {
      control.addEventListener('click', function () { addItem(control.dataset.addItem); });
    });
    layer.querySelectorAll('.bs-category-add-row input').forEach(function (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); addItem(input === inputs.brands ? 'brands' : 'biz'); }
      });
    });
    layer.addEventListener('click', function (event) {
      var remove = event.target.closest('[data-remove-item]');
      if (remove) {
        var kind = remove.dataset.removeItem;
        draft[kind].splice(Number(remove.dataset.index), 1);
        paint(kind);
      } else if (event.target === layer) close();
    });
    layer.querySelector('[data-close]').addEventListener('click', close);
    layer.querySelector('[data-save]').addEventListener('click', save);
    layer.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
    lineInput.focus();
  }

  function editName(title, initial, siblings, onSave, onSaved) {
    var layer = document.createElement('div');
    layer.className = 'bs-category-modal';
    layer.innerHTML = '<div class="bs-category-dialog" role="dialog" aria-modal="true" aria-labelledby="bsCategoryDialogTitle">' +
      '<h3 id="bsCategoryDialogTitle">' + escapeHtml(title) + '</h3>' +
      '<label for="bsCategoryName">名称</label>' +
      '<input id="bsCategoryName" class="erp-input" maxlength="40" autocomplete="off" value="' + escapeHtml(initial) + '">' +
      '<p class="bs-category-error" role="alert"></p>' +
      '<div class="bs-category-dialog-actions"><button type="button" class="erp-btn" data-close>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-save>保存</button></div></div>';
    document.body.appendChild(layer);
    var input = layer.querySelector('input');
    var error = layer.querySelector('.bs-category-error');
    function close() { layer.remove(); }
    function save() {
      var name = input.value.trim();
      if (!name) { error.textContent = '请输入名称'; input.focus(); return; }
      if (siblings.some(function (value) { return value === name && value !== initial; })) {
        error.textContent = '同级已有相同名称'; input.focus(); return;
      }
      if (!onSave(name)) { error.textContent = '保存失败，请重试'; return; }
      close();
      render();
      if (onSaved) onSaved();
    }
    layer.querySelector('[data-close]').addEventListener('click', close);
    layer.querySelector('[data-save]').addEventListener('click', save);
    layer.addEventListener('click', function (event) { if (event.target === layer) close(); });
    layer.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
      if (event.key === 'Enter') { event.preventDefault(); save(); }
    });
    input.focus();
    input.select();
  }

  function act(action, lineIndex, itemIndex, afterChange) {
    if (action === 'add-line') { addLine(); return; }
    var api = window.StoreBizStructure;
    var nodes = api.tree();
    var line = nodes[lineIndex];
    var original = action === 'edit-line' ? line.line :
      action === 'edit-brand' ? line.brands[itemIndex] : action === 'edit-biz' ? line.biz[itemIndex] : '';
    if (action.indexOf('delete-') === 0) {
      if (action === 'delete-brand' && line.brands.length <= 1) {
        window.alert('每条事业线至少保留一个品牌名称');
        return;
      }
      if (action === 'delete-biz' && line.biz.length <= 1) {
        window.alert('每条事业线至少保留一条业务线');
        return;
      }
      var label = action === 'delete-line' ? '事业线“' + line.line + '”及其全部品牌名称、业务线' :
        action === 'delete-brand' ? '品牌名称“' + line.brands[itemIndex] + '”' : '业务线“' + line.biz[itemIndex] + '”';
      if (!window.confirm('确定删除' + label + '？已有门店档案不会自动改写。')) return;
      if (action === 'delete-line') nodes.splice(lineIndex, 1);
      else if (action === 'delete-brand') line.brands.splice(itemIndex, 1);
      else line.biz.splice(itemIndex, 1);
      if (api.saveTree(nodes)) {
        render();
        if (afterChange) afterChange();
      }
      else window.alert('删除失败，请重试');
      return;
    }
    var titles = { 'add-line': '新增事业线', 'edit-line': '修改事业线',
      'add-brand': '新增品牌名称', 'edit-brand': '修改品牌名称',
      'add-biz': '新增业务线', 'edit-biz': '修改业务线' };
    var siblings = action.indexOf('line') !== -1 ? nodes.map(function (row) { return row.line; }) :
      action.indexOf('brand') !== -1 ? line.brands.slice() : line.biz.slice();
    editName(titles[action], original, siblings, function (name) {
      if (action === 'edit-line') line.line = name;
      else if (action === 'add-brand') line.brands.push(name);
      else if (action === 'edit-brand') line.brands[itemIndex] = name;
      else if (action === 'add-biz') line.biz.push(name);
      else if (action === 'edit-biz') line.biz[itemIndex] = name;
      return api.saveTree(nodes);
    }, afterChange);
  }

  function init() {
    var root = document.getElementById('bsCategoryTree');
    if (!root || !window.StoreBizStructure) return;
    render();
    document.getElementById('bsCategoryAddLine').addEventListener('click', function () { act('add-line', -1, -1); });
    root.addEventListener('change', function (event) {
      if (event.target.id === 'bsCategoryLine') {
        selectedLine = Number(event.target.value);
        render();
      }
    });
    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (!target) return;
      var action = target.dataset.action;
      if (action === 'manage-brand' || action === 'manage-biz') openManage(action.slice(7));
      else act(action, selectedLine, Number(target.dataset.index));
    });
    var section = document.getElementById('bsCategorySection');
    var toggle = document.getElementById('bsCategorySectionToggle');
    function flip() {
      var collapsed = section.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
    }
    toggle.addEventListener('click', flip);
    toggle.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flip(); }
    });
    window.addEventListener('storage', function (event) {
      if (event.key === 'lf_store_biz_structure_v1') render();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
