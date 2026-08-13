/**
 * 营销活动 — 注册有礼列表
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingRegisterGiftStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readFilter() {
    return {
      name: (document.getElementById('qRgName') || {}).value || '',
      port: (document.getElementById('qRgPort') || {}).value || '',
      status: (document.getElementById('qRgStatus') || {}).value || '',
      timeStart: (document.getElementById('qRgTimeStart') || {}).value || '',
      timeEnd: (document.getElementById('qRgTimeEnd') || {}).value || ''
    };
  }

  function formHref(id) {
    var base = wp.page('mdm_marketing_register_gift_form.html');
    if (!id) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'id=' + encodeURIComponent(id);
  }

  /** 状态色对齐会员列表：纯文字，不用胶囊底（mdm-member360-list） */
  function statusClass(st) {
    if (st === 'active') return 'mdm-status mdm-status--ok';
    if (st === 'upcoming') return 'mdm-status mdm-status--warn';
    return 'mdm-status mdm-status--muted';
  }

  function syncDatetimeClear(wrapId, inputId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-value', !!input.value);
  }

  function bindDatetimeClears() {
    [
      ['qRgTimeStartWrap', 'qRgTimeStart'],
      ['qRgTimeEndWrap', 'qRgTimeEnd']
    ].forEach(function (pair) {
      var wrapId = pair[0];
      var inputId = pair[1];
      var input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', function () {
          syncDatetimeClear(wrapId, inputId);
        });
        input.addEventListener('change', function () {
          syncDatetimeClear(wrapId, inputId);
        });
      }
      syncDatetimeClear(wrapId, inputId);
    });

    document.querySelectorAll('#rgFilterForm .mkt-rg-datetime-clear').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-clear-for');
        var input = id && document.getElementById(id);
        if (!input) return;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
  }

  function render() {
    var tbody = document.getElementById('rgTableBody');
    if (!tbody) return;
    var rows = Store.filterList(readFilter());
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;color:#999;padding:24px;">暂无符合条件的活动</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (item) {
        var st = Store.computeStatus(item);
        var stLabel = Store.statusLabel(st);
        var enableText = item.enabled ? '禁用' : '启用';
        var rewardText = Store.rewardsSummary(item);
        var rewardHtml =
          typeof Store.formatRewardsSummaryHtml === 'function'
            ? Store.formatRewardsSummaryHtml(item)
            : escapeHtml(rewardText);
        return (
          '<tr data-id="' +
          escapeHtml(item.id) +
          '">' +
          '<td>' +
          escapeHtml(item.id || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(item.name) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.portLabel(item.port)) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.scenesText(item)) +
          '</td>' +
          '<td>' +
          escapeHtml(Store.formatRange(item)) +
          '</td>' +
          '<td class="mkt-rg-reward-cell member-level-benefit-cell">' +
          '<div class="member-level-benefit-summary" title="' +
          escapeHtml(rewardText) +
          '">' +
          rewardHtml +
          '</div></td>' +
          '<td><span class="' +
          statusClass(st) +
          '">' +
          escapeHtml(stLabel) +
          '</span></td>' +
          '<td>' +
          escapeHtml(item.createdAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(item.updatedAt || '—') +
          '</td>' +
          '<td class="action-links">' +
          '<a href="' +
          escapeHtml(formHref(item.id)) +
          '" data-act="edit">编辑</a>' +
          '<a href="#" data-act="toggle">' +
          enableText +
          '</a>' +
          '<a href="#" class="action-link-danger" data-act="delete">删除</a>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function bindClearBtns() {
    document.querySelectorAll('#rgFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });
  }

  function bindEvents() {
    var queryBtn = document.getElementById('rgFilterQuery');
    var resetBtn = document.getElementById('rgFilterReset');
    var addBtn = document.getElementById('rgAddBtn');
    if (queryBtn) queryBtn.addEventListener('click', render);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        window.location.href = formHref();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var name = document.getElementById('qRgName');
        var port = document.getElementById('qRgPort');
        var status = document.getElementById('qRgStatus');
        var timeStart = document.getElementById('qRgTimeStart');
        var timeEnd = document.getElementById('qRgTimeEnd');
        if (name) name.value = '';
        if (port) port.value = '';
        if (status) status.value = '';
        if (timeStart) timeStart.value = '';
        if (timeEnd) timeEnd.value = '';
        syncDatetimeClear('qRgTimeStartWrap', 'qRgTimeStart');
        syncDatetimeClear('qRgTimeEndWrap', 'qRgTimeEnd');
        render();
      });
    }

    var tbody = document.getElementById('rgTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var link = ev.target.closest('a[data-act]');
      if (!link) return;
      var act = link.getAttribute('data-act');
      if (act === 'edit') return;
      ev.preventDefault();
      var tr = link.closest('tr[data-id]');
      var id = tr && tr.getAttribute('data-id');
      if (!id) return;
      var item = Store.getById(id);
      if (!item) {
        toast('活动不存在', 'warning');
        render();
        return;
      }
      if (act === 'toggle') {
        Store.setEnabled(id, !item.enabled);
        toast(item.enabled ? '已禁用' : '已启用', 'success');
        render();
        return;
      }
      if (act === 'delete') {
        if (!window.confirm('确认删除活动「' + item.name + '」？删除后不可恢复。')) return;
        Store.removeItem(id);
        toast('已删除', 'success');
        render();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindClearBtns();
    bindDatetimeClears();
    bindEvents();
    render();
  });
})();
