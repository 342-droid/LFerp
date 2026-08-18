/**
 * 直播管理 — 直播时段
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

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function getById(id) {
    for (var i = 0; i < Demo.timeslots.length; i++) {
      if (Demo.timeslots[i].id === id) return Demo.timeslots[i];
    }
    return null;
  }

  function filteredSlots() {
    var name = ((document.getElementById('qSlotName') || {}).value || '').trim();
    return Demo.timeslots.filter(function (s) {
      if (name && String(s.name).indexOf(name) < 0) return false;
      return true;
    });
  }

  function closeModal() {
    var el = document.querySelector('[data-live-slot-modal]');
    if (el) el.remove();
  }

  function openFormModal(slot) {
    closeModal();
    var isEdit = !!slot;
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-slot-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal" style="width:480px;max-width:92vw;">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">' +
      (isEdit ? '编辑时段' : '新建时段') +
      '</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<div class="lf-live-form-row">' +
      '<label><span class="req">*</span>时段名称</label>' +
      '<div class="lf-live-form-control">' +
      '<input id="liveSlotNameInput" maxlength="40" placeholder="请输入时段名称" value="' +
      escapeHtml(slot ? slot.name : '') +
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
      var nameEl = document.getElementById('liveSlotNameInput');
      var name = (nameEl && nameEl.value ? nameEl.value : '').trim();
      if (!name) {
        toast('请输入时段名称', 'warning');
        if (nameEl) nameEl.focus();
        return;
      }
      var dup = Demo.timeslots.some(function (s) {
        return s.name === name && (!slot || s.id !== slot.id);
      });
      if (dup) {
        toast('时段名称已存在', 'warning');
        return;
      }
      if (isEdit) {
        slot.name = name;
        toast('时段已更新');
      } else {
        Demo.timeslots.push({
          id: 'slot-' + Date.now().toString(36),
          name: name,
          bindCount: 0,
          createdAt: nowStr()
        });
        toast('时段已创建');
      }
      finish();
      render();
    });
    document.body.appendChild(backdrop);
    var input = document.getElementById('liveSlotNameInput');
    if (input) {
      input.focus();
      input.select();
    }
  }

  function openConfirm(message, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-slot-modal', '1');
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
    var tbody = document.getElementById('slotTableBody');
    if (!tbody) return;
    var rows = filteredSlots();
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#999;padding:24px;">暂无符合条件的时段</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (s, idx) {
        return (
          '<tr data-id="' +
          escapeHtml(s.id) +
          '">' +
          '<td>' +
          (idx + 1) +
          '</td>' +
          '<td>' +
          escapeHtml(s.name) +
          '</td>' +
          '<td>' +
          escapeHtml(String(s.bindCount != null ? s.bindCount : 0)) +
          '</td>' +
          '<td>' +
          escapeHtml(s.createdAt || '—') +
          '</td>' +
          '<td class="action-links">' +
          '<a href="#" data-act="edit">编辑</a>' +
          '<a href="#" class="action-link-danger" data-act="delete">删除</a>' +
          '</td></tr>'
        );
      })
      .join('');
  }

  function bindEvents() {
    var queryBtn = document.getElementById('slotFilterQuery');
    var resetBtn = document.getElementById('slotFilterReset');
    var addBtn = document.getElementById('slotAddBtn');
    if (queryBtn) queryBtn.addEventListener('click', render);
    if (addBtn) addBtn.addEventListener('click', function () {
      openFormModal(null);
    });
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var name = document.getElementById('qSlotName');
        if (name) name.value = '';
        render();
      });
    }

    document.querySelectorAll('#liveSlotFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });

    var tbody = document.getElementById('slotTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      var slot = getById(id);
      if (!slot) return;
      var act = actEl.getAttribute('data-act');
      if (act === 'edit') {
        openFormModal(slot);
        return;
      }
      if (act === 'delete') {
        openConfirm('确定删除该时段？删除后将解绑关联直播场次。', function () {
          Demo.timeslots = Demo.timeslots.filter(function (s) {
            return s.id !== id;
          });
          toast('时段已删除');
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
