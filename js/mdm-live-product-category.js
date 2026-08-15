/**
 * 直播商品 — 直播类目
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getById(id) {
    for (var i = 0; i < Demo.categories.length; i++) {
      if (Demo.categories[i].id === id) return Demo.categories[i];
    }
    return null;
  }

  function sortedCategories() {
    return Demo.categories.slice().sort(function (a, b) {
      return (Number(a.sort) || 0) - (Number(b.sort) || 0);
    });
  }

  function closeModal() {
    var el = document.querySelector('[data-live-cat-modal]');
    if (el) el.remove();
  }

  function openFormModal(cat) {
    closeModal();
    var isEdit = !!cat;
    var nextSort = Demo.categories.reduce(function (max, c) {
      return Math.max(max, Number(c.sort) || 0);
    }, 0) + 1;
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-cat-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal" style="width:480px;max-width:92vw;">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">' +
      (isEdit ? '编辑类目' : '新增类目') +
      '</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<div class="lf-live-form-row">' +
      '<label><span class="req">*</span>类目名称</label>' +
      '<div class="lf-live-form-control">' +
      '<input id="liveCatNameInput" maxlength="20" placeholder="请输入类目名称" value="' +
      escapeHtml(cat ? cat.name : '') +
      '">' +
      '</div></div>' +
      '<div class="lf-live-form-row">' +
      '<label>排序</label>' +
      '<div class="lf-live-form-control">' +
      '<input id="liveCatSortInput" type="number" min="0" step="1" value="' +
      escapeHtml(String(cat ? cat.sort : nextSort)) +
      '">' +
      '</div></div></div>' +
      '<div class="erp-modal__footer">' +
      '<button type="button" class="erp-btn" data-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-ok>确定</button>' +
      '</div></div>';

    function finish() {
      closeModal();
    }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) finish();
    });
    backdrop.querySelector('[data-close]').addEventListener('click', finish);
    backdrop.querySelector('[data-cancel]').addEventListener('click', finish);
    backdrop.querySelector('[data-ok]').addEventListener('click', function () {
      var nameEl = document.getElementById('liveCatNameInput');
      var sortEl = document.getElementById('liveCatSortInput');
      var name = (nameEl && nameEl.value ? nameEl.value : '').trim();
      if (!name) {
        toast('请输入类目名称', 'warning');
        if (nameEl) nameEl.focus();
        return;
      }
      var dup = Demo.categories.some(function (c) {
        return c.name === name && (!cat || c.id !== cat.id);
      });
      if (dup) {
        toast('类目名称已存在', 'warning');
        return;
      }
      var sort = parseInt(sortEl && sortEl.value, 10);
      if (isNaN(sort) || sort < 0) sort = nextSort;
      if (isEdit) {
        cat.name = name;
        cat.sort = sort;
        toast('类目已更新');
      } else {
        Demo.categories.push({
          id: 'lcat-' + Date.now().toString(36),
          name: name,
          sort: sort,
          enabled: true
        });
        toast('类目已创建');
      }
      finish();
      render();
    });
    document.body.appendChild(backdrop);
    var input = document.getElementById('liveCatNameInput');
    if (input) {
      input.focus();
      input.select();
    }
  }

  function openConfirm(message, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-cat-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">温馨提示</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<div class="erp-modal-confirm__row">' +
      '<div class="erp-modal-confirm__icon">!</div>' +
      '<div class="erp-modal-confirm__msg">' +
      escapeHtml(message) +
      '</div></div></div>' +
      '<div class="erp-modal__footer">' +
      '<button type="button" class="erp-btn" data-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-ok>确定</button>' +
      '</div></div>';
    function finish() {
      closeModal();
    }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) finish();
    });
    backdrop.querySelector('[data-close]').addEventListener('click', finish);
    backdrop.querySelector('[data-cancel]').addEventListener('click', finish);
    backdrop.querySelector('[data-ok]').addEventListener('click', function () {
      finish();
      if (typeof onOk === 'function') onOk();
    });
    document.body.appendChild(backdrop);
  }

  function render() {
    var tbody = document.getElementById('liveCatTableBody');
    if (!tbody) return;
    var rows = sortedCategories();
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#999;padding:24px;">暂无类目，请先新增</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (c) {
        var toggleText = c.enabled ? '停用' : '启用';
        return (
          '<tr data-id="' +
          escapeHtml(c.id) +
          '">' +
          '<td>' +
          escapeHtml(c.name) +
          '</td>' +
          '<td>' +
          escapeHtml(String(c.sort != null ? c.sort : 0)) +
          '</td>' +
          '<td><span class="' +
          (c.enabled ? 'mdm-status mdm-status--ok' : 'mdm-status mdm-status--muted') +
          '">' +
          (c.enabled ? '启用' : '停用') +
          '</span></td>' +
          '<td class="action-links">' +
          '<a href="#" data-act="toggle">' +
          toggleText +
          '</a>' +
          '<a href="#" data-act="edit">编辑</a>' +
          '<a href="#" class="action-link-danger" data-act="delete">删除</a>' +
          '</td></tr>'
        );
      })
      .join('');
  }

  function bindEvents() {
    var addBtn = document.getElementById('liveCatAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openFormModal(null);
      });
    }

    var tbody = document.getElementById('liveCatTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      var cat = getById(id);
      if (!cat) return;
      var act = actEl.getAttribute('data-act');
      if (act === 'edit') {
        openFormModal(cat);
        return;
      }
      if (act === 'toggle') {
        cat.enabled = !cat.enabled;
        toast(cat.enabled ? '类目已启用' : '类目已停用');
        render();
        return;
      }
      if (act === 'delete') {
        openConfirm('确定删除该类目？', function () {
          Demo.categories = Demo.categories.filter(function (c) {
            return c.id !== id;
          });
          toast('类目已删除');
          render();
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    render();
  });
})();
