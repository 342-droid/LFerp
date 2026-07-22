/**
 * 批量打标签 — 列表页
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mdm_member_batch_tag_list';

  var TAG_CATALOG = [
    {
      groupId: 'TG10001',
      tagGroup: '活跃度',
      tagRule: '单选',
      tags: [
        { id: 'TV10001', tagValue: '高活跃' },
        { id: 'TV10002', tagValue: '中活跃' },
        { id: 'TV10003', tagValue: '低活跃' }
      ]
    },
    {
      groupId: 'TG10002',
      tagGroup: '消费偏好',
      tagRule: '多选',
      tags: [
        { id: 'TV10004', tagValue: '储值' },
        { id: 'TV10005', tagValue: '复购' }
      ]
    },
    {
      groupId: 'TG10003',
      tagGroup: '生命周期',
      tagRule: '单选',
      tags: [
        { id: 'TV10006', tagValue: '新客' }
      ]
    }
  ];

  var DEFAULT_LIST = [
    {
      id: 'BT10001',
      tagIds: ['TV10001'],
      applyMode: 'overwrite',
      updateMode: 'auto',
      logic: 'and',
      memberCount: 1280,
      creator: '张运营 / admin01',
      createdAt: '2026-07-12 10:18:22',
      updatedAt: '2026-07-22 03:00:11',
      status: '启用',
      conditions: [
        {
          id: 'c1',
          categoryId: 'consume',
          fieldId: 'total_amount',
          type: 'number',
          operator: 'gte',
          value: 300
        },
        {
          id: 'c2',
          categoryId: 'action',
          fieldId: 'last_login_days',
          type: 'number',
          operator: 'lte',
          value: 7
        }
      ]
    },
    {
      id: 'BT10002',
      tagIds: ['TV10004', 'TV10005'],
      applyMode: 'append',
      updateMode: 'manual',
      logic: 'and',
      memberCount: 642,
      creator: '李增长 / growth02',
      createdAt: '2026-07-08 15:41:33',
      updatedAt: '2026-07-16 09:41:33',
      status: '启用',
      conditions: [
        {
          id: 'c3',
          categoryId: 'tag',
          fieldId: 'member_tag',
          type: 'tag',
          match: 'any',
          values: ['TV10006']
        },
        {
          id: 'c4',
          categoryId: 'preference',
          fieldId: 'browse_category',
          type: 'enum',
          values: ['seafood', 'frozen']
        }
      ]
    },
    {
      id: 'BT10003',
      tagIds: ['TV10006'],
      applyMode: 'overwrite',
      updateMode: 'auto',
      logic: 'or',
      memberCount: 2156,
      creator: '王活动 / act03',
      createdAt: '2026-06-28 11:05:19',
      updatedAt: '2026-07-10 16:05:19',
      status: '停用',
      conditions: [
        {
          id: 'c5',
          categoryId: 'basic',
          fieldId: 'member_level',
          type: 'enum',
          values: ['L1']
        }
      ]
    }
  ];

  var state = {
    page: 1,
    pageSize: 10,
    filter: { tagValue: '', updateMode: '', status: '' },
    list: DEFAULT_LIST.slice()
  };

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'success');
      return;
    }
    window.alert(msg);
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

  function formatNumber(n) {
    return String(n == null ? 0 : n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function pageHref(filename) {
    if (window.wmsPath && typeof window.wmsPath.page === 'function') {
      return window.wmsPath.page(filename);
    }
    return filename;
  }

  function modeLabel(mode) {
    return mode === 'auto' ? '自动' : '手动';
  }

  function applyModeLabel(mode) {
    return mode === 'append' ? '添加' : '覆盖';
  }

  function findTagMeta(tagId) {
    for (var i = 0; i < TAG_CATALOG.length; i++) {
      var g = TAG_CATALOG[i];
      for (var j = 0; j < g.tags.length; j++) {
        if (g.tags[j].id === tagId) {
          return {
            id: g.tags[j].id,
            tagValue: g.tags[j].tagValue,
            groupId: g.groupId,
            tagGroup: g.tagGroup,
            tagRule: g.tagRule
          };
        }
      }
    }
    return null;
  }

  function getTagLabels(tagIds) {
    return (tagIds || []).map(function (id) {
      var meta = findTagMeta(id);
      return meta ? meta.tagValue : id;
    });
  }

  function renderTagsHtml(item) {
    var ids = item.tagIds || [];
    if (!ids.length) return '<span class="member-batch-rule-empty">未选择</span>';
    var byGroup = {};
    ids.forEach(function (id) {
      var meta = findTagMeta(id);
      if (!meta) return;
      if (!byGroup[meta.groupId]) {
        byGroup[meta.groupId] = { group: meta.tagGroup, rule: meta.tagRule, values: [] };
      }
      byGroup[meta.groupId].values.push(meta.tagValue);
    });
    return Object.keys(byGroup).map(function (gid) {
      var g = byGroup[gid];
      return '<div class="member-batch-tags-cell"><strong>' + escapeHtml(g.group) + '</strong>（' +
        escapeHtml(g.rule) + '）：' + escapeHtml(g.values.join('、')) + '</div>';
    }).join('');
  }

  function renderRuleHtml(item) {
    if (!item.conditions || !item.conditions.length) {
      return '<span class="member-batch-rule-empty">未配置</span>';
    }
    if (!window.CrmAudienceFilter || typeof window.CrmAudienceFilter.summarizeCondition !== 'function') {
      return '<span class="member-batch-rule-empty">' + item.conditions.length + ' 个条件</span>';
    }
    var lis = item.conditions.map(function (c) {
      var s = window.CrmAudienceFilter.summarizeCondition(c);
      return '<li>' + escapeHtml(s.name + '：' + s.text) + '</li>';
    }).join('');
    return '<ul class="member-batch-rule-cell">' + lis + '</ul>';
  }

  function getFilteredList() {
    var f = state.filter;
    return state.list.filter(function (item) {
      if (f.tagValue) {
        var labels = getTagLabels(item.tagIds).join('、');
        if (labels.indexOf(f.tagValue) === -1) return false;
      }
      if (f.updateMode && item.updateMode !== f.updateMode) return false;
      if (f.status && item.status !== f.status) return false;
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.list));
    } catch (e) { /* ignore */ }
  }

  function loadPersisted() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        persistList();
        return;
      }
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) state.list = parsed;
      else persistList();
    } catch (e) {
      persistList();
    }
  }

  function closeWarmConfirm() {
    var backdrop = document.querySelector('[data-batch-tag-warm]');
    if (backdrop) backdrop.remove();
  }

  function openWarmConfirm(message, onConfirm) {
    closeWarmConfirm();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop';
    backdrop.setAttribute('data-batch-tag-warm', '1');
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

  function formUrl(id) {
    var base = pageHref('mdm_member_batch_tag_form.html');
    return id ? (base + '?id=' + encodeURIComponent(id)) : base;
  }

  function membersUrl(item) {
    var labels = getTagLabels(item.tagIds).join('、') || item.id;
    return pageHref('mdm_member_batch_tag_members.html') +
      '?batchId=' + encodeURIComponent(item.id) +
      '&name=' + encodeURIComponent(labels);
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
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:#999;padding:28px 0;">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = pageList.map(function (item, idx) {
        var statusHtml = item.status === '启用'
          ? '<span style="color:#52c41a;">启用</span>'
          : '<span style="color:#999;">停用</span>';
        var switchAct = item.updateMode === 'auto' ? 'to-manual' : 'to-auto';
        var switchText = item.updateMode === 'auto' ? '切为手动' : '切为自动';
        var updateBtn = (item.updateMode === 'manual' && item.status === '启用')
          ? '<a href="javascript:;" data-act="refresh">更新</a>'
          : '';
        return (
          '<tr data-id="' + item.id + '">' +
          '  <td>' + (start + idx + 1) + '</td>' +
          '  <td>' + renderTagsHtml(item) + '</td>' +
          '  <td>' + applyModeLabel(item.applyMode) + '</td>' +
          '  <td><span class="member-batch-logic">' + (item.logic === 'or' ? '或' : '且') + '</span></td>' +
          '  <td>' + renderRuleHtml(item) + '</td>' +
          '  <td><a class="member-batch-count-link" href="' + membersUrl(item) + '">' + formatNumber(item.memberCount) + '</a></td>' +
          '  <td>' + modeLabel(item.updateMode) + '</td>' +
          '  <td>' + escapeHtml(item.creator || '—') + '</td>' +
          '  <td>' + escapeHtml(item.createdAt || '—') + '</td>' +
          '  <td>' + escapeHtml(item.updatedAt || '—') + '</td>' +
          '  <td>' + statusHtml + '</td>' +
          '  <td class="member-batch-ops">' +
          '    <a href="' + formUrl(item.id) + '">编辑</a>' +
          '    <a href="javascript:;" data-act="filter">筛选条件</a>' +
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

  function bindEvents() {
    var createBtn = document.getElementById('btnCreateBatchTag');
    if (createBtn) {
      if (createBtn.tagName === 'A') {
        createBtn.setAttribute('href', formUrl());
      } else {
        createBtn.addEventListener('click', function () {
          window.location.href = formUrl();
        });
      }
    }

    document.getElementById('btnFilterQuery').addEventListener('click', function () {
      state.filter.tagValue = (document.getElementById('qTagValue').value || '').trim();
      state.filter.updateMode = document.getElementById('qUpdateMode').value;
      state.filter.status = document.getElementById('qStatus').value;
      state.page = 1;
      renderTable();
    });

    document.getElementById('btnFilterReset').addEventListener('click', function () {
      document.getElementById('qTagValue').value = '';
      document.getElementById('qUpdateMode').value = '';
      document.getElementById('qStatus').value = '';
      state.filter = { tagValue: '', updateMode: '', status: '' };
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
        if (!window.CrmAudienceFilter || typeof window.CrmAudienceFilter.open !== 'function') {
          toast('筛选人群组件未加载', 'error');
          return;
        }
        window.CrmAudienceFilter.open({
          logic: item.logic,
          conditions: item.conditions || [],
          beforeConfirm: function (_payload, done) {
            openWarmConfirm('修改筛选条件会立即按照新的条件更新打标人群，确定要提交修改吗？', function () {
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
        return;
      }
      if (act === 'refresh') {
        if (item.updateMode !== 'manual' || item.status !== '启用') return;
        openWarmConfirm('确认按当前筛选条件立即更新打标人群？', function () {
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
    // 兼容旧链接 ?openBatch=1：直接进入新建页
    try {
      var params = new URLSearchParams(window.location.search || '');
      var openBatch = params.get('openBatch');
      if (openBatch === '1' || openBatch === 'true') {
        window.location.replace(formUrl());
      }
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
