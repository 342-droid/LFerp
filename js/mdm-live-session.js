/**
 * 直播管理 — 直播场次列表
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

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

  function pageWithQuery(file, query) {
    var base = wp.page(file);
    var qs = [];
    Object.keys(query || {}).forEach(function (k) {
      if (query[k] == null || query[k] === '') return;
      qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
    });
    if (!qs.length) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
  }

  function statusLabel(st) {
    if (st === 'live') return '直播中';
    if (st === 'upcoming') return '未开始';
    if (st === 'ended') return '已结束';
    return st || '—';
  }

  function statusClass(st) {
    if (st === 'live') return 'mdm-status mdm-status--ok';
    if (st === 'upcoming') return 'mdm-status mdm-status--warn';
    return 'mdm-status mdm-status--muted';
  }

  function fillSelects() {
    var slotEl = document.getElementById('qSessionSlot');
    var roomEl = document.getElementById('qSessionRoom');
    if (slotEl) {
      slotEl.innerHTML =
        '<option value="">全部</option>' +
        Demo.timeslots
          .map(function (s) {
            return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>';
          })
          .join('');
    }
    if (roomEl) {
      roomEl.innerHTML =
        '<option value="">全部</option>' +
        Demo.rooms
          .map(function (r) {
            return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.name) + '</option>';
          })
          .join('');
    }
  }

  function readFilter() {
    return {
      name: ((document.getElementById('qSessionName') || {}).value || '').trim(),
      status: (document.getElementById('qSessionStatus') || {}).value || '',
      type: (document.getElementById('qSessionType') || {}).value || '',
      slotId: (document.getElementById('qSessionSlot') || {}).value || '',
      roomId: (document.getElementById('qSessionRoom') || {}).value || ''
    };
  }

  function filteredSessions() {
    var f = readFilter();
    return Demo.sessions.filter(function (s) {
      if (f.name && String(s.name).indexOf(f.name) < 0) return false;
      if (f.status && s.status !== f.status) return false;
      if (f.type && s.type !== f.type) return false;
      if (f.slotId && s.slotId !== f.slotId) return false;
      if (f.roomId && s.roomId !== f.roomId) return false;
      return true;
    });
  }

  function closeModal() {
    var el = document.querySelector('[data-live-session-modal]');
    if (el) el.remove();
  }

  function openConfirm(message, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-session-modal', '1');
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
    var tbody = document.getElementById('sessionTableBody');
    if (!tbody) return;
    var rows = filteredSessions();
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:#999;padding:24px;">暂无符合条件的直播场次</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (s) {
        var editHref = pageWithQuery('mdm_live_session_form.html', { id: s.id });
        var detailHref = pageWithQuery('mdm_live_session_detail.html', { id: s.id });
        var controlHref = pageWithQuery('mdm_live_control.html', { sessionId: s.id });
        var actions =
          '<a href="' +
          escapeHtml(controlHref) +
          '">中控台</a>';
        // 未开始 / 直播中可编辑；已结束仅中控台+详情
        if (s.status === 'upcoming' || s.status === 'live') {
          actions += '<a href="' + escapeHtml(editHref) + '">编辑</a>';
        }
        actions += '<a href="' + escapeHtml(detailHref) + '">详情</a>';
        if (s.status === 'upcoming') {
          actions += '<a href="#" class="action-link-danger" data-act="delete">删除</a>';
        }
        return (
          '<tr data-id="' +
          escapeHtml(s.id) +
          '">' +
          '<td>' +
          escapeHtml(s.name) +
          '</td>' +
          '<td>' +
          escapeHtml(s.roomName || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.slotName || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.typeName || '—') +
          '</td>' +
          '<td><span class="' +
          statusClass(s.status) +
          '">' +
          escapeHtml(statusLabel(s.status)) +
          '</span></td>' +
          '<td>' +
          escapeHtml(s.startAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.endAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.actualStartAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.actualEndAt || '—') +
          '</td>' +
          '<td class="action-links">' +
          actions +
          '</td></tr>'
        );
      })
      .join('');
  }

  function bindEvents() {
    var queryBtn = document.getElementById('sessionFilterQuery');
    var resetBtn = document.getElementById('sessionFilterReset');
    var addBtn = document.getElementById('sessionAddBtn');
    if (queryBtn) queryBtn.addEventListener('click', render);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        window.location.href = wp.page('mdm_live_session_form.html');
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        ['qSessionName', 'qSessionStatus', 'qSessionType', 'qSessionSlot', 'qSessionRoom'].forEach(
          function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          }
        );
        render();
      });
    }

    document.querySelectorAll('#liveSessionFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });

    var tbody = document.getElementById('sessionTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act="delete"]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      openConfirm('确定删除该直播场次？', function () {
        Demo.sessions = Demo.sessions.filter(function (s) {
          return s.id !== id;
        });
        toast('场次已删除');
        render();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillSelects();
    bindEvents();
    render();
  });
})();
