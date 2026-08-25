/**
 * 会员分群 — 列表 + 筛选人群弹窗
 */
(function () {
  'use strict';

  var UPDATE_MODE_TIP = '手动：需要用户手动点击更新，才会触发更新；自动：系统每天凌晨开始更新';

  var state = {
    page: 1,
    pageSize: 10,
    filter: { name: '', status: '', updateMode: '' },
    list: [
      {
        id: 'AG10001',
        name: '高价值复购客群',
        logic: 'and',
        status: '启用',
        updateMode: 'auto',
        creator: '张运营 / admin01',
        createdAt: '2026-07-12 10:18:22',
        updatedAt: '2026-07-22 03:00:11',
        memberCount: 8652,
        conditions: [
          {
            id: 'c1',
            categoryId: 'tag',
            fieldId: 'member_tag',
            type: 'tag',
            match: 'any',
            values: ['TV10001', 'TV10005']
          },
          {
            id: 'c2',
            categoryId: 'consume',
            fieldId: 'total_amount',
            type: 'number',
            operator: 'gte',
            value: 500
          }
        ]
      },
      {
        id: 'AG10002',
        name: '沉睡唤回-海鲜偏好',
        logic: 'and',
        status: '启用',
        updateMode: 'manual',
        creator: '李增长 / growth02',
        createdAt: '2026-07-08 15:41:33',
        updatedAt: '2026-07-16 09:41:33',
        memberCount: 12480,
        conditions: [
          {
            id: 'c3',
            categoryId: 'tag',
            fieldId: 'member_tag',
            type: 'tag',
            match: 'any',
            values: ['TV10008']
          },
          {
            id: 'c4',
            categoryId: 'preference',
            fieldId: 'browse_category',
            type: 'enum',
            values: ['seafood', 'frozen']
          },
          {
            id: 'c5',
            categoryId: 'action',
            fieldId: 'last_login_days',
            type: 'number',
            operator: 'gte',
            value: 30
          }
        ]
      },
      {
        id: 'AG10003',
        name: '领券未用催转化',
        logic: 'or',
        status: '停用',
        updateMode: 'auto',
        creator: '王活动 / act03',
        createdAt: '2026-06-28 11:05:19',
        updatedAt: '2026-07-10 16:05:19',
        memberCount: 3921,
        conditions: [
          {
            id: 'c6',
            categoryId: 'action',
            fieldId: 'coupon_unused',
            type: 'enum',
            values: ['expiring_3d']
          },
          {
            id: 'c7',
            categoryId: 'action',
            fieldId: 'cart_no_pay',
            type: 'compound',
            metrics: [
              { id: 'count', operator: 'gte', value: 1 },
              { id: 'days', operator: 'lte', value: 7 }
            ]
          }
        ]
      }
    ]
  };

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'success');
      return;
    }
    window.alert(msg);
  }

  function closeWarmConfirm() {
    var backdrop = document.querySelector('[data-segment-warm]');
    if (backdrop) backdrop.remove();
  }

  function openWarmConfirm(message, onConfirm) {
    closeWarmConfirm();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
    backdrop.setAttribute('data-segment-warm', '1');
    backdrop.style.zIndex = '4000';
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">温馨提示</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="erp-modal-confirm__row">' +
      '      <div class="erp-modal-confirm__icon">!</div>' +
      '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-warm-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
      '  </div>' +
      '</div>';

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeWarmConfirm();
    });
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeWarmConfirm);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      closeWarmConfirm();
      if (typeof onConfirm === 'function') onConfirm();
    });
    document.body.appendChild(backdrop);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nowStr() {
    var d = new Date();
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function genId() {
    return 'AG' + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);
  }

  function formatNumber(n) {
    return String(n == null ? 0 : n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function pageHref(filename) {
    if (window.wmsPath && typeof window.wmsPath.page === 'function') {
      return window.wmsPath.page(filename);
    }
    return filename;
  }

  function getFilteredList() {
    var f = state.filter;
    return state.list.filter(function (item) {
      if (f.name && item.name.indexOf(f.name) === -1) return false;
      if (f.status && item.status !== f.status) return false;
      if (f.updateMode && item.updateMode !== f.updateMode) return false;
      return true;
    });
  }

  function findById(id) {
    for (var i = 0; i < state.list.length; i++) {
      if (state.list[i].id === id) return state.list[i];
    }
    return null;
  }

  function persistList() {
    try {
      localStorage.setItem('mdm_member_segment_list', JSON.stringify(state.list));
    } catch (e) { /* ignore */ }
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem('mdm_member_segment_list');
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        // 旧演示数据若创建人无账号后缀，保持兼容；结构变化时以代码内置样例覆盖更稳妥
        var needReset = parsed.some(function (item) {
          return item.conditions && item.conditions.some(function (c) {
            return (c.fieldId === 'cart_no_pay' || c.fieldId === 'browse_no_buy') && c.type === 'number';
          });
        });
        if (!needReset) state.list = parsed;
      }
    } catch (e) { /* ignore */ }
  }

  function renderRuleHtml(item) {
    if (!item.conditions || !item.conditions.length) {
      return '<span class="member-segment-rule-empty">未配置</span>';
    }
    var lis = item.conditions.map(function (c) {
      var s = window.CrmAudienceFilter.summarizeCondition(c);
      return '<li>' + escapeHtml(s.name + '：' + s.text) + '</li>';
    }).join('');
    return '<ul class="member-segment-rule-cell">' + lis + '</ul>';
  }

  function modeLabel(mode) {
    return mode === 'auto' ? '自动' : '手动';
  }

  function renderPagination(total) {
    if (typeof createPagination !== 'function') return;
    createPagination({
      containerId: 'pagination-container',
      totalItems: total,
      currentPage: state.page,
      pageSize: state.pageSize,
      onPageChange: function (page) {
        state.page = page;
        renderTable();
      },
      onPageSizeChange: function (size) {
        state.pageSize = size;
        state.page = 1;
        renderTable();
      }
    });
  }

  function renderTable() {
    var list = getFilteredList();
    var totalPages = Math.ceil(list.length / state.pageSize) || 1;
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageList = list.slice(start, start + state.pageSize);
    var tbody = document.getElementById('tableBody');

    if (!pageList.length) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#999;padding:28px 0;">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = pageList.map(function (item, idx) {
        var statusHtml = item.status === '启用'
          ? '<span class="mdm-status mdm-status--ok">启用</span>'
          : '<span class="mdm-status mdm-status--muted">停用</span>';
        var switchAct = item.updateMode === 'auto' ? 'to-manual' : 'to-auto';
        var switchText = item.updateMode === 'auto' ? '切为手动' : '切为自动';
        var updateBtn = (item.updateMode === 'manual' && item.status === '启用')
          ? '<a href="javascript:;" data-act="refresh">更新</a>'
          : '';
        var membersUrl = pageHref('mdm_member_segment_members.html') +
          '?segmentId=' + encodeURIComponent(item.id) +
          '&name=' + encodeURIComponent(item.name);
        return (
          '<tr data-id="' + item.id + '">' +
          '  <td>' + (list.length - start - idx) + '</td>' +
          '  <td>' + escapeHtml(item.name) + '</td>' +
          '  <td><span class="member-segment-logic">' + (item.logic === 'or' ? '或' : '且') + '</span></td>' +
          '  <td>' + renderRuleHtml(item) + '</td>' +
          '  <td><a class="member-segment-count-link" href="' + membersUrl + '">' + formatNumber(item.memberCount) + '</a></td>' +
          '  <td>' + modeLabel(item.updateMode) + '</td>' +
          '  <td>' + escapeHtml(item.creator || '—') + '</td>' +
          '  <td>' + escapeHtml(item.createdAt || '—') + '</td>' +
          '  <td>' + escapeHtml(item.updatedAt || '—') + '</td>' +
          '  <td>' + statusHtml + '</td>' +
          '  <td class="member-segment-ops">' +
          '    <a href="javascript:;" data-act="filter">筛选条件</a>' +
          '    <a href="javascript:;" data-act="rename">重命名</a>' +
          (updateBtn ? '    ' + updateBtn : '') +
          '    <a href="javascript:;" data-act="' + switchAct + '">' + switchText + '</a>' +
          '    <a href="javascript:;" data-act="toggle">' + (item.status === '启用' ? '停用' : '启用') + '</a>' +
          '  </td>' +
          '</tr>'
        );
      }).join('');
    }

    renderPagination(list.length);
  }

  function openNameModal(opts) {
    opts = opts || {};
    var host = document.getElementById('groupNameModalHost');
    host.innerHTML =
      '<div class="erp-modal-backdrop" data-group-name-modal="1">' +
      '  <div class="erp-modal" style="max-width:440px;">' +
      '    <div class="erp-modal__header">' +
      '      <h2 class="erp-modal__title">' + (opts.title || '新建人群') + '</h2>' +
      '      <div class="erp-modal__header-actions">' +
      '        <button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="erp-modal__body">' +
      '      <div class="erp-modal-field">' +
      '        <label class="erp-modal-field__label"><span class="erp-req">*</span>人群名称</label>' +
      '        <div class="erp-modal-field__control">' +
      '          <input class="erp-input" id="groupNameInput" maxlength="40" placeholder="40字以内" value="' + escapeHtml(opts.name || '') + '">' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '    <div class="erp-modal__footer">' +
      '      <button type="button" class="erp-btn" data-close>取消</button>' +
      '      <button type="button" class="erp-btn erp-btn--primary" data-ok>' + (opts.okText || '下一步') + '</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    var backdrop = host.querySelector('[data-group-name-modal]');
    function close() { host.innerHTML = ''; }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-close]')) close();
    });

    backdrop.querySelector('[data-ok]').addEventListener('click', function () {
      var name = (document.getElementById('groupNameInput').value || '').trim();
      if (!name) {
        toast('请输入人群名称', 'warning');
        return;
      }
      close();
      if (typeof opts.onOk === 'function') opts.onOk(name);
    });

    setTimeout(function () {
      var input = document.getElementById('groupNameInput');
      if (input) input.focus();
    }, 0);
  }

  function openFilterForCreate(name) {
    window.CrmAudienceFilter.open({
      onConfirm: function (result) {
        state.list.unshift({
          id: genId(),
          name: name,
          logic: result.logic,
          conditions: result.conditions,
          memberCount: result.estimate,
          updateMode: 'manual',
          creator: '当前用户 / current',
          createdAt: nowStr(),
          updatedAt: nowStr(),
          status: '启用'
        });
        persistList();
        state.page = 1;
        renderTable();
        toast('人群已创建', 'success');
      }
    });
  }

  function openFilterForEdit(item) {
    window.CrmAudienceFilter.open({
      logic: item.logic,
      conditions: item.conditions,
      beforeConfirm: function (_payload, done) {
        openWarmConfirm('修改筛选条件会立即按照新的条件更新人群，确定要提交修改吗？', function () {
          done(true);
        });
      },
      onConfirm: function (result) {
        item.logic = result.logic;
        item.conditions = result.conditions;
        item.memberCount = result.estimate;
        item.updatedAt = nowStr();
        persistList();
        renderTable();
        toast('筛选条件已更新', 'success');
      }
    });
  }

  function bindEvents() {
    document.getElementById('btnCreateSegment').addEventListener('click', function () {
      openNameModal({
        title: '新建人群',
        onOk: openFilterForCreate
      });
    });

    document.getElementById('btnFilterQuery').addEventListener('click', function () {
      state.filter.name = (document.getElementById('qGroupName').value || '').trim();
      state.filter.status = document.getElementById('qStatus').value;
      state.filter.updateMode = document.getElementById('qUpdateMode').value;
      state.page = 1;
      renderTable();
    });

    document.getElementById('btnFilterReset').addEventListener('click', function () {
      document.getElementById('qGroupName').value = '';
      document.getElementById('qStatus').value = '';
      document.getElementById('qUpdateMode').value = '';
      state.filter = { name: '', status: '', updateMode: '' };
      state.page = 1;
      renderTable();
    });

    document.getElementById('tableBody').addEventListener('click', function (ev) {
      var act = ev.target.getAttribute('data-act');
      if (!act) return;
      var tr = ev.target.closest('tr[data-id]');
      if (!tr) return;
      var item = findById(tr.getAttribute('data-id'));
      if (!item) return;

      if (act === 'filter') {
        openFilterForEdit(item);
        return;
      }
      if (act === 'rename') {
        openNameModal({
          title: '重命名人群',
          name: item.name,
          okText: '确定',
          onOk: function (name) {
            item.name = name;
            item.updatedAt = nowStr();
            persistList();
            renderTable();
            toast('已重命名', 'success');
          }
        });
        return;
      }
      if (act === 'refresh') {
        if (item.updateMode !== 'manual' || item.status !== '启用') return;
        openWarmConfirm('确认按当前筛选条件立即更新人群？', function () {
          item.updatedAt = nowStr();
          item.memberCount = Math.max(1, item.memberCount + Math.floor(Math.random() * 50) - 20);
          persistList();
          renderTable();
          toast('已更新', 'success');
        });
        return;
      }
      if (act === 'to-manual') {
        item.updateMode = 'manual';
        item.updatedAt = nowStr();
        persistList();
        renderTable();
        toast('已切换为手动更新', 'success');
        return;
      }
      if (act === 'to-auto') {
        item.updateMode = 'auto';
        item.updatedAt = nowStr();
        persistList();
        renderTable();
        toast('已切换为自动更新', 'success');
        return;
      }
      if (act === 'toggle') {
        item.status = item.status === '启用' ? '停用' : '启用';
        item.updatedAt = nowStr();
        persistList();
        renderTable();
        toast('已' + item.status, 'success');
      }
    });
  }

  function init() {
    loadPersisted();
    bindEvents();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
