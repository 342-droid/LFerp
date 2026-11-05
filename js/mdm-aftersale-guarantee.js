/* 售后保障期管理：平台兜底 / 类目默认 / SPU 覆盖 */
(function () {
  var store = window.LFAftersaleGuaranteeStore;
  if (!store) return;

  var state = {
    tab: 'platform',
    data: store.load()
  };

  var app = document.getElementById('asGuaranteeApp');
  if (!app) return;

  function h(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function effectiveSpuDays(row) {
    if (row.mode === 'custom' && row.days != null) return Number(row.days);
    return store.categoryDays(state.data, row.categoryId);
  }

  function renderTabs() {
    var tabs = [
      { id: 'platform', text: '平台兜底' },
      { id: 'category', text: '类目默认' },
      { id: 'spu', text: 'SPU 覆盖' }
    ];
    return (
      '<div class="as-g-tabs" role="tablist">' +
      tabs
        .map(function (t) {
          return (
            '<button type="button" class="as-g-tabs__btn' +
            (state.tab === t.id ? ' is-active' : '') +
            '" data-tab="' +
            t.id +
            '">' +
            t.text +
            '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderPlatform() {
    return (
      '<div class="as-g-card">' +
      '<div class="as-g-card__title">平台兜底天数</div>' +
      '<div class="as-g-platform-row">' +
      '<label for="asGPlatformDays">未命中类目/SPU 时</label>' +
      '<input class="erp-input" id="asGPlatformDays" type="number" min="0" step="1" value="' +
      h(state.data.platformDays) +
      '">' +
      '<span class="as-g-unit">天</span>' +
      '</div>' +
      '<p class="as-g-field__tip" style="margin-left:0;margin-top:10px">建议 7 天。结算「售后期结束」起算时，若商品无类目/SPU 配置则用此值。</p>' +
      '<div class="as-g-footer">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-act="save-platform">保存</button>' +
      '</div></div>'
    );
  }

  function renderCategory() {
    var rows = (state.data.categories || [])
      .map(function (c, i) {
        return (
          '<tr data-cat-index="' +
          i +
          '">' +
          '<td>' +
          h(c.id) +
          '</td><td>' +
          h(c.name) +
          '</td><td>' +
          '<input class="erp-input" type="number" min="0" step="1" data-cat-days="' +
          i +
          '" value="' +
          h(c.days) +
          '"> 天' +
          '</td><td class="as-g-ops">' +
          '<button type="button" class="erp-btn" data-act="remove-cat" data-id="' +
          i +
          '">移除</button>' +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<div class="as-g-card">' +
      '<div class="as-g-card__title">类目默认保障期</div>' +
      '<div class="as-g-toolbar">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-act="add-cat">新增类目配置</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-act="save-category">保存</button>' +
      '</div>' +
      '<div class="as-g-table-wrap"><table class="as-g-table"><thead><tr>' +
      '<th>类目 ID</th><th>类目名称</th><th>保障天数</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      (rows || '<tr><td colspan="4">暂无类目配置，将使用平台兜底</td></tr>') +
      '</tbody></table></div></div>'
    );
  }

  function renderSpu() {
    var rows = (state.data.spus || [])
      .map(function (s, i) {
        var modeTag =
          s.mode === 'custom'
            ? '<span class="as-g-tag as-g-tag--orange">自定义</span>'
            : '<span class="as-g-tag">沿用类目</span>';
        return (
          '<tr>' +
          '<td>' +
          h(s.id) +
          '</td><td>' +
          h(s.name) +
          '</td><td>' +
          h(s.categoryName || s.categoryId || '—') +
          '</td><td>' +
          modeTag +
          '</td><td>' +
          h(effectiveSpuDays(s)) +
          ' 天</td><td class="as-g-ops">' +
          '<button type="button" class="erp-btn" data-act="edit-spu" data-id="' +
          i +
          '">编辑</button>' +
          '<button type="button" class="erp-btn" data-act="remove-spu" data-id="' +
          i +
          '">移除</button>' +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<div class="as-g-card">' +
      '<div class="as-g-card__title">SPU 覆盖</div>' +
      '<div class="as-g-toolbar">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-act="add-spu">新增 SPU 覆盖</button>' +
      '</div>' +
      '<div class="as-g-table-wrap"><table class="as-g-table"><thead><tr>' +
      '<th>SPU ID</th><th>商品名称</th><th>所属类目</th><th>配置方式</th><th>生效天数</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      (rows || '<tr><td colspan="6">暂无 SPU 覆盖</td></tr>') +
      '</tbody></table></div></div>'
    );
  }

  function render() {
    var body =
      state.tab === 'category'
        ? renderCategory()
        : state.tab === 'spu'
          ? renderSpu()
          : renderPlatform();
    app.innerHTML = renderTabs() + body;
  }

  function persist() {
    store.save(state.data);
  }

  function closeModal() {
    var m = document.querySelector('.as-g-modal-backdrop');
    if (m) m.remove();
  }

  function openModal(title, bodyHtml, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'as-g-modal-backdrop';
    backdrop.innerHTML =
      '<div class="as-g-modal" role="dialog">' +
      '<div class="as-g-modal__head"><span>' +
      h(title) +
      '</span><button type="button" class="erp-btn" data-close>×</button></div>' +
      '<div class="as-g-modal__body">' +
      bodyHtml +
      '</div>' +
      '<div class="as-g-modal__foot">' +
      '<button type="button" class="erp-btn" data-close>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-ok>确定</button>' +
      '</div></div>';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || e.target.getAttribute('data-close') != null) closeModal();
      if (e.target.getAttribute('data-ok') != null) {
        if (typeof onOk === 'function' && onOk(backdrop) === false) return;
        closeModal();
      }
    });
  }

  function openCategoryModal() {
    var cats = [
      ['CAT-NEW-VEG', '新鲜蔬菜-子类'],
      ['CAT-NEW-SNACK', '膨化食品'],
      ['CAT-NEW-DRINK', '功能饮料']
    ];
    openModal(
      '新增类目配置',
      '<div class="as-g-field"><label>类目</label><select class="erp-select" id="asGCatPick">' +
        cats
          .map(function (c) {
            return '<option value="' + h(c[0]) + '" data-name="' + h(c[1]) + '">' + h(c[1]) + '</option>';
          })
          .join('') +
        '</select></div>' +
        '<div class="as-g-field"><label>保障天数</label><input class="erp-input" id="asGCatDays" type="number" min="0" step="1" value="7"></div>',
      function (root) {
        var pick = root.querySelector('#asGCatPick');
        var daysEl = root.querySelector('#asGCatDays');
        var days = Number(daysEl && daysEl.value);
        if (!(days >= 0)) {
          toast('请填写保障天数', 'error');
          return false;
        }
        var name = pick.options[pick.selectedIndex].getAttribute('data-name') || pick.value;
        state.data.categories.push({
          id: pick.value,
          name: name,
          days: days,
          inheritParent: false
        });
        persist();
        toast('已新增类目配置');
        render();
      }
    );
  }

  function openSpuModal(editIndex) {
    var row = editIndex != null ? state.data.spus[editIndex] : null;
    var isEdit = !!row;
    openModal(
      isEdit ? '编辑 SPU 覆盖' : '新增 SPU 覆盖',
      '<div class="as-g-field"><label>SPU ID</label><input class="erp-input" id="asGSpuId" value="' +
        h(row ? row.id : '') +
        '"' +
        (isEdit ? ' disabled' : '') +
        '></div>' +
        '<div class="as-g-field"><label>商品名称</label><input class="erp-input" id="asGSpuName" value="' +
        h(row ? row.name : '') +
        '"></div>' +
        '<div class="as-g-field"><label>所属类目</label><select class="erp-select" id="asGSpuCat">' +
        (state.data.categories || [])
          .map(function (c) {
            return (
              '<option value="' +
              h(c.id) +
              '"' +
              (row && row.categoryId === c.id ? ' selected' : '') +
              '>' +
              h(c.name) +
              '</option>'
            );
          })
          .join('') +
        '</select></div>' +
        '<div class="as-g-field"><label>配置方式</label><select class="erp-select" id="asGSpuMode">' +
        '<option value="category"' +
        (!row || row.mode === 'category' ? ' selected' : '') +
        '>沿用类目</option>' +
        '<option value="custom"' +
        (row && row.mode === 'custom' ? ' selected' : '') +
        '>自定义天数</option></select></div>' +
        '<div class="as-g-field"><label>保障天数</label><input class="erp-input" id="asGSpuDays" type="number" min="0" step="1" value="' +
        h(row && row.mode === 'custom' ? row.days : 7) +
        '"></div>' +
        '<p class="as-g-field__tip">选择「沿用类目」时天数取类目默认；「自定义」时以本页填写为准。</p>',
      function (root) {
        var id = String((root.querySelector('#asGSpuId') || {}).value || '').trim();
        var name = String((root.querySelector('#asGSpuName') || {}).value || '').trim();
        var catSel = root.querySelector('#asGSpuCat');
        var mode = (root.querySelector('#asGSpuMode') || {}).value || 'category';
        var days = Number((root.querySelector('#asGSpuDays') || {}).value);
        if (!id || !name) {
          toast('请填写 SPU ID 与商品名称', 'error');
          return false;
        }
        if (mode === 'custom' && !(days >= 0)) {
          toast('请填写自定义保障天数', 'error');
          return false;
        }
        var catName = catSel.options[catSel.selectedIndex]
          ? catSel.options[catSel.selectedIndex].textContent
          : '';
        var next = {
          id: id,
          name: name,
          categoryId: catSel.value,
          categoryName: catName,
          mode: mode,
          days: mode === 'custom' ? days : null
        };
        if (isEdit) state.data.spus[editIndex] = next;
        else state.data.spus.push(next);
        persist();
        toast(isEdit ? '已保存 SPU 覆盖' : '已新增 SPU 覆盖');
        render();
      }
    );
  }

  app.addEventListener('click', function (e) {
    var tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      state.tab = tabBtn.getAttribute('data-tab');
      render();
      return;
    }
    var actEl = e.target.closest('[data-act]');
    if (!actEl) return;
    var act = actEl.getAttribute('data-act');
    var id = actEl.getAttribute('data-id');
    if (act === 'save-platform') {
      var days = Number((document.getElementById('asGPlatformDays') || {}).value);
      if (!(days >= 0)) {
        toast('请填写有效的兜底天数', 'error');
        return;
      }
      state.data.platformDays = days;
      persist();
      toast('平台兜底已保存');
      return;
    }
    if (act === 'save-category') {
      app.querySelectorAll('[data-cat-days]').forEach(function (inp) {
        var idx = Number(inp.getAttribute('data-cat-days'));
        if (state.data.categories[idx]) {
          state.data.categories[idx].days = Number(inp.value) || 0;
        }
      });
      persist();
      toast('类目默认已保存');
      return;
    }
    if (act === 'add-cat') {
      openCategoryModal();
      return;
    }
    if (act === 'remove-cat') {
      state.data.categories.splice(Number(id), 1);
      persist();
      render();
      toast('已移除');
      return;
    }
    if (act === 'add-spu') {
      openSpuModal(null);
      return;
    }
    if (act === 'edit-spu') {
      openSpuModal(Number(id));
      return;
    }
    if (act === 'remove-spu') {
      state.data.spus.splice(Number(id), 1);
      persist();
      render();
      toast('已移除');
    }
  });

  render();
})();
