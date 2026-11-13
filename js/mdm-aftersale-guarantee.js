/* 售后保障期管理：平台兜底 / 类目默认（单商品售后期在销售域商品编辑） */
(function () {
  var store = window.LFAftersaleGuaranteeStore;
  if (!store) return;

  var state = {
    tab: 'platform',
    data: store.load(),
    /* 类目列表默认查看。修改后先改草稿，点保存才入库。 */
    editing: false,
    draft: null
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

  function categoryRows() {
    if (state.editing && Array.isArray(state.draft)) return state.draft;
    return state.data.categories || [];
  }

  function renderTabs() {
    var tabs = [
      { id: 'platform', text: '平台兜底' },
      { id: 'category', text: '类目默认' }
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
      '<label for="asGPlatformDays">未命中商品/类目时</label>' +
      '<input class="erp-input" id="asGPlatformDays" type="number" min="0" step="1" value="' +
      h(state.data.platformDays) +
      '">' +
      '<span class="as-g-unit">天</span>' +
      '</div>' +
      '<p class="as-g-field__tip" style="margin-left:0;margin-top:10px">建议 7 天。商品/类目未配置时用此值。用户端售后始终按商品天数；仅结算起算选「售后期结束」时，结算才取整单售后期最大值。</p>' +
      '<div class="as-g-footer">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-act="save-platform">保存</button>' +
      '</div></div>'
    );
  }

  function renderCategory() {
    var editing = state.editing;
    var rows = categoryRows()
      .map(function (c, i) {
        var daysCell = editing
          ? '<input class="erp-input" type="number" min="0" step="1" data-cat-days="' + i + '" value="' + h(c.days) + '"> 天'
          : h(c.days) + ' 天';
        var ops = editing
          ? '<button type="button" class="erp-btn" data-act="remove-cat" data-id="' + i + '">移除</button>'
          : '—';
        return (
          '<tr data-cat-index="' + i + '">' +
          '<td>' + h(c.id) + '</td><td>' + h(c.name) + '</td><td>' + daysCell +
          '</td><td class="as-g-ops">' + ops + '</td></tr>'
        );
      })
      .join('');
    var corner = editing
      ? '<button type="button" class="erp-btn erp-btn--primary" data-act="save-category">保存</button>'
      : '<button type="button" class="erp-btn erp-btn--primary" data-act="edit-category">修改</button>';
    return (
      '<div class="as-g-card">' +
      '<div class="as-g-card__title">类目默认保障期</div>' +
      '<div class="as-g-toolbar">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-act="add-cat">新增类目配置</button>' +
      corner +
      '</div>' +
      '<div class="as-g-table-wrap"><table class="as-g-table"><thead><tr>' +
      '<th>类目 ID</th><th>类目名称</th><th>保障天数</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      (rows || '<tr><td colspan="4">暂无类目配置，将使用平台兜底</td></tr>') +
      '</tbody></table></div>' +
      '<p class="as-g-field__tip" style="margin-top:12px">单商品售后期请在商城商品 / 代采商品 / 直播排品编辑页配置（非必填）。C 端置灰按商品；结算仅在起算节点为「售后期结束」时取整单 max。</p>' +
      '</div>'
    );
  }

  function render() {
    app.innerHTML = renderTabs() + (state.tab === 'category' ? renderCategory() : renderPlatform());
  }

  function persist() {
    store.save(state.data);
  }

  function closeModal() {
    var m = document.querySelector('.as-g-modal-backdrop');
    if (m) m.remove();
  }

  /* 改天数后重绘前先收回输入框，避免新增、移除把未保存的天数刷掉。 */
  function collectDraftDays() {
    if (!state.editing || !state.draft) return true;
    var ok = true;
    app.querySelectorAll('[data-cat-days]').forEach(function (inp) {
      var idx = Number(inp.getAttribute('data-cat-days'));
      if (!state.draft[idx]) return;
      var raw = String(inp.value == null ? '' : inp.value).trim();
      var days = raw === '' ? 0 : Number(raw);
      if (!(days >= 0) || Math.floor(days) !== days) {
        ok = false;
        return;
      }
      state.draft[idx].days = days;
    });
    return ok;
  }

  function beginCategoryEdit() {
    if (state.editing) return;
    state.draft = JSON.parse(JSON.stringify(state.data.categories || []));
    state.editing = true;
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
        if (!(days >= 0) || Math.floor(days) !== days) {
          toast('请填写保障天数', 'error');
          return false;
        }
        var name = pick.options[pick.selectedIndex].getAttribute('data-name') || pick.value;
        beginCategoryEdit();
        state.draft.push({
          id: pick.value,
          name: name,
          days: days,
          inheritParent: false
        });
        toast('已加入列表，保存后生效');
        render();
      }
    );
  }

  app.addEventListener('click', function (e) {
    var tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      var nextTab = tabBtn.getAttribute('data-tab');
      if (nextTab !== 'category' && state.editing) {
        state.editing = false;
        state.draft = null;
      }
      state.tab = nextTab;
      render();
      return;
    }
    var actEl = e.target.closest('[data-act]');
    if (!actEl) return;
    var act = actEl.getAttribute('data-act');
    var id = actEl.getAttribute('data-id');
    if (act === 'save-platform') {
      var days = Number((document.getElementById('asGPlatformDays') || {}).value);
      if (!(days >= 0) || Math.floor(days) !== days) {
        toast('请填写有效的兜底天数', 'error');
        return;
      }
      state.data.platformDays = days;
      persist();
      toast('平台兜底已保存');
      return;
    }
    if (act === 'edit-category') {
      beginCategoryEdit();
      render();
      return;
    }
    if (act === 'save-category') {
      if (!collectDraftDays()) {
        toast('请填写有效的保障天数', 'error');
        return;
      }
      state.data.categories = state.draft || [];
      persist();
      state.editing = false;
      state.draft = null;
      toast('类目默认已保存');
      render();
      return;
    }
    if (act === 'add-cat') {
      openCategoryModal();
      return;
    }
    if (act === 'remove-cat') {
      if (!state.editing || !state.draft) return;
      if (!collectDraftDays()) {
        toast('请填写有效的保障天数', 'error');
        return;
      }
      state.draft.splice(Number(id), 1);
      render();
      toast('已从列表移除，保存后生效');
    }
  });

  render();
})();
