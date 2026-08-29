/** 通用业务标签原型组件：标签、筛选器、标签库抽屉和资源绑定弹窗。 */
(function () {
  'use strict';

  var store = window.BusinessTagPrototypeStore;
  if (!store) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function notify(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'success');
      return;
    }
    var toast = document.createElement('div');
    toast.className = 'bt-toast' + (type === 'error' ? ' is-error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2200);
  }

  function chipStyle(color) {
    if (!color) return '';
    return ' style="--bt-color:' + escapeHtml(color) + '"';
  }

  function chipsHtml(type, resourceId, attrName) {
    var tags = store.tagsFor(type, resourceId);
    var attr = attrName || 'data-business-tag-list';
    var html = tags.length
      ? tags.map(function (item) {
          return '<span class="bt-chip' + (item.color ? ' has-color' : '') + '"' +
            chipStyle(item.color) + '><i aria-hidden="true"></i>' + escapeHtml(item.name) + '</span>';
        }).join('')
      : '<span class="bt-empty">—</span>';
    return '<div class="bt-chip-list" ' + attr + '="' + escapeHtml(type) + '">' + html + '</div>';
  }

  function renderChips(target, type, resourceId, attrName) {
    if (!target) return;
    target.innerHTML = chipsHtml(type, resourceId, attrName);
  }

  function filterLabel(host) {
    return host.getAttribute('data-label') || '业务标签';
  }

  function updateFilterSummary(host) {
    var checked = host.querySelectorAll('[data-business-tag-option]:checked');
    var text = checked.length ? '已选 ' + checked.length + ' 项' : '全部标签';
    var summary = host.querySelector('[data-business-tag-picker-summary]');
    if (summary) summary.textContent = text;
  }

  function mountFilter(host, type, label) {
    if (!host) return;
    host.setAttribute('data-label', label || '业务标签');
    host.setAttribute('data-type', type);
    var tags = store.listTags(type, false);
    host.innerHTML =
      '<label class="bt-filter__label">' + escapeHtml(label || '业务标签') + '</label>' +
      '<div class="bt-picker">' +
        '<button type="button" class="bt-picker__trigger" data-business-tag-picker-trigger aria-expanded="false">' +
          '<span data-business-tag-picker-summary>全部标签</span><span aria-hidden="true">⌄</span>' +
        '</button>' +
        '<div class="bt-picker__panel" data-business-tag-picker-panel hidden>' +
          '<div class="bt-picker__options">' +
            (tags.length ? tags.map(function (item) {
              return '<label class="bt-picker__option"><input type="checkbox" data-business-tag-option value="' +
                escapeHtml(item.id) + '"><span class="bt-picker__dot"' + chipStyle(item.color) + '></span>' +
                '<span>' + escapeHtml(item.name) + '</span></label>';
            }).join('') : '<div class="bt-picker__none">暂无可用标签</div>') +
          '</div>' +
          '<div class="bt-picker__match"><span>匹配方式</span><select data-business-tag-match aria-label="' +
            escapeHtml((label || '业务标签') + '匹配方式') + '">' +
            '<option value="ANY">任一标签（ANY）</option><option value="ALL">全部标签（ALL）</option>' +
          '</select></div>' +
        '</div>' +
      '</div>';

    var trigger = host.querySelector('[data-business-tag-picker-trigger]');
    var panel = host.querySelector('[data-business-tag-picker-panel]');
    trigger.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    host.addEventListener('change', function () { updateFilterSummary(host); });
  }

  function readFilter(host) {
    if (!host) return { ids: [], mode: 'ANY' };
    return {
      ids: Array.prototype.map.call(
        host.querySelectorAll('[data-business-tag-option]:checked'),
        function (input) { return input.value; }
      ),
      mode: ((host.querySelector('[data-business-tag-match]') || {}).value || 'ANY')
    };
  }

  function resetFilter(host) {
    if (!host) return;
    host.querySelectorAll('[data-business-tag-option]').forEach(function (input) {
      input.checked = false;
    });
    var mode = host.querySelector('[data-business-tag-match]');
    if (mode) mode.value = 'ANY';
    updateFilterSummary(host);
  }

  function closeLayer(layer) {
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
  }

  function openManager(type, title) {
    var old = document.querySelector('[data-business-tag-manager-layer]');
    if (old) old.remove();
    var layer = document.createElement('div');
    layer.className = 'bt-layer';
    layer.setAttribute('data-business-tag-manager-layer', '');
    layer.innerHTML =
      '<div class="bt-layer__mask" data-bt-close></div>' +
      '<aside class="bt-manager" data-business-tag-manager aria-label="' + escapeHtml(title) + '">' +
        '<header class="bt-manager__head"><div><h2>' + escapeHtml(title) + '</h2>' +
          '<p>标签库归当前业务模块管理，颜色可不选。</p></div>' +
          '<button type="button" class="bt-icon-btn" data-bt-close aria-label="关闭">×</button></header>' +
        '<div class="bt-manager__actions"><button type="button" class="btn btn-primary" data-bt-add>新增标签</button></div>' +
        '<form class="bt-tag-form" data-business-tag-form hidden>' +
          '<div><label for="btTagName">标签名称</label><input id="btTagName" name="name" maxlength="20" placeholder="例如：需主管复核"></div>' +
          '<div><label for="btTagColor">标签颜色</label><input id="btTagColor" name="color" list="btTagColors" placeholder="可选，留空使用默认样式">' +
            '<datalist id="btTagColors"><option value="#ff4d4f"><option value="#fa8c16"><option value="#52c41a"><option value="#1677ff"><option value="#722ed1"></datalist></div>' +
          '<div class="bt-tag-form__footer"><button type="button" class="btn btn-secondary" data-bt-form-cancel>取消</button>' +
            '<button type="submit" class="btn btn-primary">保存</button></div>' +
        '</form>' +
        '<div class="bt-manager__table-wrap"><table class="bt-manager__table"><thead><tr>' +
          '<th>标签名称</th><th>颜色</th><th>来源</th><th>状态</th><th>使用次数</th><th>更新时间</th><th>操作</th>' +
        '</tr></thead><tbody data-bt-manager-body></tbody></table></div>' +
      '</aside>';
    document.body.appendChild(layer);
    var form = layer.querySelector('[data-business-tag-form]');
    var body = layer.querySelector('[data-bt-manager-body]');

    function renderTable() {
      var tags = store.listTags(type, true);
      body.innerHTML = tags.map(function (item) {
        return '<tr><td><span class="bt-chip' + (item.color ? ' has-color' : '') + '"' + chipStyle(item.color) +
          '><i aria-hidden="true"></i>' + escapeHtml(item.name) + '</span></td>' +
          '<td>' + (item.color ? '<span class="bt-color-value"><i style="background:' + escapeHtml(item.color) + '"></i>' + escapeHtml(item.color) + '</span>' : '默认') + '</td>' +
          '<td>' + escapeHtml(item.source || '手动创建') + '</td><td>' + (item.enabled === false ? '已停用' : '使用中') + '</td>' +
          '<td>' + escapeHtml(item.usage || 0) + '</td><td>' + escapeHtml(item.updatedAt || '-') + '</td>' +
          '<td><button type="button" class="bt-link-btn" data-bt-toggle="' + escapeHtml(item.id) + '">' +
            (item.enabled === false ? '启用' : '停用') + '</button></td></tr>';
      }).join('');
    }

    renderTable();
    layer.querySelectorAll('[data-bt-close]').forEach(function (button) {
      button.addEventListener('click', function () { closeLayer(layer); });
    });
    layer.querySelector('[data-bt-add]').addEventListener('click', function () {
      form.hidden = false;
      form.querySelector('[name="name"]').focus();
    });
    layer.querySelector('[data-bt-form-cancel]').addEventListener('click', function () {
      form.reset();
      form.hidden = true;
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      try {
        store.addTag(type, {
          name: form.querySelector('[name="name"]').value,
          color: form.querySelector('[name="color"]').value
        });
        form.reset();
        form.hidden = true;
        renderTable();
        notify('标签已新增');
      } catch (error) {
        notify(error.message || '保存失败', 'error');
      }
    });
    body.addEventListener('click', function (event) {
      var toggle = event.target.closest('[data-bt-toggle]');
      if (!toggle) return;
      store.toggleTag(type, toggle.getAttribute('data-bt-toggle'));
      renderTable();
    });
    return layer;
  }

  function openBinding(type, resourceIds, title) {
    var ids = Array.isArray(resourceIds) ? resourceIds.map(String) : [String(resourceIds)];
    var old = document.querySelector('[data-business-tag-binding-layer]');
    if (old) old.remove();
    var tags = store.listTags(type, false);
    var selected = ids.length === 1 ? store.getBinding(type, ids[0]) : [];
    var layer = document.createElement('div');
    layer.className = 'bt-layer';
    layer.setAttribute('data-business-tag-binding-layer', '');
    layer.innerHTML =
      '<div class="bt-layer__mask" data-bt-bind-close></div>' +
      '<section class="bt-binding" role="dialog" aria-modal="true" aria-label="' + escapeHtml(title) + '">' +
        '<header><div><h2>' + escapeHtml(title) + '</h2><p>' +
          (ids.length > 1 ? '将统一更新已选 ' + ids.length + ' 条记录' : '勾选要绑定到当前记录的标签') +
          '</p></div><button type="button" class="bt-icon-btn" data-bt-bind-close aria-label="关闭">×</button></header>' +
        '<div class="bt-binding__options">' + tags.map(function (item) {
          return '<label><input type="checkbox" value="' + escapeHtml(item.id) + '"' +
            (selected.indexOf(item.id) >= 0 ? ' checked' : '') + '><span class="bt-picker__dot"' + chipStyle(item.color) + '></span>' +
            '<span>' + escapeHtml(item.name) + '</span></label>';
        }).join('') + '</div>' +
        '<footer><button type="button" class="btn btn-secondary" data-bt-bind-close>取消</button>' +
          '<button type="button" class="btn btn-primary" data-bt-bind-save>保存</button></footer>' +
      '</section>';
    document.body.appendChild(layer);
    layer.querySelectorAll('[data-bt-bind-close]').forEach(function (button) {
      button.addEventListener('click', function () { closeLayer(layer); });
    });
    layer.querySelector('[data-bt-bind-save]').addEventListener('click', function () {
      var values = Array.prototype.map.call(layer.querySelectorAll('.bt-binding__options input:checked'), function (input) {
        return input.value;
      });
      store.saveBinding(type, ids, values);
      closeLayer(layer);
      notify(ids.length > 1 ? '已批量更新标签' : '标签已更新');
    });
    return layer;
  }

  window.BusinessTagPrototypeUI = {
    escapeHtml: escapeHtml,
    notify: notify,
    chipsHtml: chipsHtml,
    renderChips: renderChips,
    mountFilter: mountFilter,
    readFilter: readFilter,
    resetFilter: resetFilter,
    openManager: openManager,
    openBinding: openBinding
  };
})();
