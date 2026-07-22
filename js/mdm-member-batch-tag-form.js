/**
 * 批量打标签 — 新建/编辑页（筛选人群复用 CrmAudienceFilter）
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mdm_member_batch_tag_list';
  var BATCH_MODE_TIP = '手动则需要用户手动点击更新，才会触发更新；自动为系统每天凌晨开始更新';

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

  var params = new URLSearchParams(window.location.search || '');
  var editId = params.get('id') || '';

  var draft = {
    updateMode: 'manual',
    applyMode: 'overwrite',
    tagIds: [],
    audience: null
  };
  var editItem = null;

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

  function pageHref(filename) {
    if (window.wmsPath && typeof window.wmsPath.page === 'function') {
      return window.wmsPath.page(filename);
    }
    return filename;
  }

  function nowStr() {
    var d = new Date();
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function genId() {
    return 'BT' + String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 90) + 10);
  }

  function loadList() {
    var defaults = [
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
          { id: 'c1', categoryId: 'consume', fieldId: 'total_amount', type: 'number', operator: 'gte', value: 300 },
          { id: 'c2', categoryId: 'action', fieldId: 'last_login_days', type: 'number', operator: 'lte', value: 7 }
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
          { id: 'c3', categoryId: 'tag', fieldId: 'member_tag', type: 'tag', match: 'any', values: ['TV10006'] },
          { id: 'c4', categoryId: 'preference', fieldId: 'browse_category', type: 'enum', values: ['seafood', 'frozen'] }
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
          { id: 'c5', categoryId: 'basic', fieldId: 'member_level', type: 'enum', values: ['L1'] }
        ]
      }
    ];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      return defaults;
    }
  }

  function saveList(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function goList() {
    window.location.href = pageHref('mdm_member_batch_tag.html');
  }

  function summarizeAudience(result) {
    if (!result) return '';
    var count = result.conditions ? result.conditions.length : 0;
    var estimate = typeof result.estimate === 'number' ? result.estimate : 0;
    var logicLabel = result.logic === 'or' ? '或' : '且';
    return '已选 ' + count + ' 个条件（关系：' + logicLabel + '），预估覆盖 <em>' + estimate + '</em> 人';
  }

  function renderTagOptions() {
    var wrap = document.getElementById('batchTagOptions');
    if (!wrap) return;
    var selectedMap = {};
    (draft.tagIds || []).forEach(function (id) { selectedMap[id] = true; });
    wrap.innerHTML = TAG_CATALOG.map(function (g) {
      var tags = g.tags.map(function (t) {
        return (
          '<label class="member-tag-check">' +
          '<input type="checkbox" data-batch-tag-id="' + escapeHtml(t.id) + '" data-batch-group-id="' + escapeHtml(g.groupId) + '" data-batch-rule="' + escapeHtml(g.tagRule) + '"' +
          (selectedMap[t.id] ? ' checked' : '') + '>' +
          '<span>' + escapeHtml(t.tagValue) + '</span>' +
          '</label>'
        );
      }).join('');
      return (
        '<div class="member-tag-batch-group">' +
        '  <div class="member-tag-batch-group__title"><strong>' + escapeHtml(g.tagGroup) + '</strong>（' + escapeHtml(g.tagRule) + '）</div>' +
        '  <div class="member-tag-batch-group__tags">' + tags + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function getSelectedTagInputs() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-batch-tag-id]:checked'));
  }

  function hasSingleRuleSelected() {
    return getSelectedTagInputs().some(function (input) {
      return input.getAttribute('data-batch-rule') === '单选';
    });
  }

  function syncApplyModeUi() {
    var addLabel = document.querySelector('[data-batch-apply-add]');
    var addInput = addLabel ? addLabel.querySelector('input') : null;
    var overwriteInput = document.querySelector('input[name="batchApplyMode"][value="overwrite"]');
    var hint = document.querySelector('[data-batch-apply-hint]');
    var forceOverwrite = hasSingleRuleSelected();

    if (forceOverwrite) {
      draft.applyMode = 'overwrite';
      if (overwriteInput) overwriteInput.checked = true;
      if (addInput) {
        addInput.checked = false;
        addInput.disabled = true;
      }
      if (addLabel) addLabel.classList.add('is-disabled');
      if (hint) hint.textContent = '已选择单选标签组，标签值处理仅支持覆盖';
    } else {
      if (addInput) addInput.disabled = false;
      if (addLabel) addLabel.classList.remove('is-disabled');
      if (hint) {
        hint.textContent = '同一标签组内：覆盖将替换原有标签值；添加则在原有基础上追加（单选标签组仅支持覆盖）';
      }
    }
  }

  function renderAudienceSummary() {
    var el = document.getElementById('audienceSummary');
    if (!el) return;
    if (!draft.audience || !draft.audience.conditions || !draft.audience.conditions.length) {
      el.className = 'member-tag-audience-summary member-tag-audience-empty';
      el.innerHTML = '尚未选择人群，请点击「筛选人群」';
      return;
    }
    el.className = 'member-tag-audience-summary';
    el.innerHTML = summarizeAudience(draft.audience) +
      '　<a href="#" class="erp-link" id="btnRepickAudience">重新筛选</a>';
  }

  function openAudienceFilter() {
    if (!window.CrmAudienceFilter || typeof window.CrmAudienceFilter.open !== 'function') {
      toast('筛选人群组件未加载', 'error');
      return;
    }
    window.CrmAudienceFilter.open({
      logic: draft.audience ? draft.audience.logic : 'and',
      conditions: draft.audience ? draft.audience.conditions : [],
      onConfirm: function (result) {
        draft.audience = {
          logic: result.logic,
          conditions: result.conditions || [],
          estimate: result.estimate || 0
        };
        renderAudienceSummary();
      }
    });
  }

  function fillFromItem(item) {
    draft.updateMode = item.updateMode || 'manual';
    draft.applyMode = item.applyMode || 'overwrite';
    draft.tagIds = (item.tagIds || []).slice();
    draft.audience = {
      logic: item.logic || 'and',
      conditions: (item.conditions || []).slice(),
      estimate: item.memberCount || 0
    };
    document.querySelectorAll('input[name="batchUpdateMode"]').forEach(function (input) {
      input.checked = input.value === draft.updateMode;
    });
    document.querySelectorAll('input[name="batchApplyMode"]').forEach(function (input) {
      input.checked = input.value === draft.applyMode;
    });
  }

  function bindEvents() {
    var back = document.getElementById('btnBackList');
    if (back) back.href = pageHref('mdm_member_batch_tag.html');

    document.getElementById('btnCancel').addEventListener('click', goList);
    document.getElementById('btnPickAudience').addEventListener('click', openAudienceFilter);

    document.getElementById('audienceSummary').addEventListener('click', function (ev) {
      if (ev.target.closest('#btnRepickAudience')) {
        ev.preventDefault();
        openAudienceFilter();
      }
    });

    document.querySelectorAll('input[name="batchUpdateMode"]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked) draft.updateMode = input.value;
      });
    });
    document.querySelectorAll('input[name="batchApplyMode"]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked && !input.disabled) draft.applyMode = input.value;
      });
    });

    document.getElementById('batchTagOptions').addEventListener('change', function (ev) {
      if (!ev.target || !ev.target.matches('[data-batch-tag-id]')) return;
      if (ev.target.checked && ev.target.getAttribute('data-batch-rule') === '单选') {
        var gid = ev.target.getAttribute('data-batch-group-id');
        document.querySelectorAll('[data-batch-group-id="' + gid + '"]').forEach(function (cb) {
          if (cb !== ev.target) cb.checked = false;
        });
      }
      draft.tagIds = getSelectedTagInputs().map(function (input) {
        return input.getAttribute('data-batch-tag-id');
      });
      syncApplyModeUi();
    });

    document.getElementById('btnSave').addEventListener('click', function () {
      var selected = getSelectedTagInputs();
      if (!selected.length) {
        toast('请至少选择一个标签', 'warning');
        return;
      }
      if (!draft.audience || !draft.audience.conditions || !draft.audience.conditions.length) {
        toast('请先筛选人群', 'warning');
        return;
      }

      var applyMode = hasSingleRuleSelected() ? 'overwrite' : draft.applyMode;
      var tagIds = selected.map(function (input) {
        return input.getAttribute('data-batch-tag-id');
      });
      var estimate = draft.audience.estimate || 0;
      var stamp = nowStr();
      var list = loadList();

      if (editItem) {
        editItem.tagIds = tagIds;
        editItem.applyMode = applyMode;
        editItem.updateMode = draft.updateMode;
        editItem.logic = draft.audience.logic;
        editItem.conditions = draft.audience.conditions;
        editItem.memberCount = estimate;
        editItem.updatedAt = stamp;
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === editItem.id) {
            list[i] = editItem;
            break;
          }
        }
        saveList(list);
        toast('批量打标签任务已更新', 'success');
      } else {
        list.unshift({
          id: genId(),
          tagIds: tagIds,
          applyMode: applyMode,
          updateMode: draft.updateMode,
          logic: draft.audience.logic,
          conditions: draft.audience.conditions,
          memberCount: estimate,
          creator: '当前用户 / current',
          createdAt: stamp,
          updatedAt: stamp,
          status: '启用'
        });
        saveList(list);
        toast('批量打标签任务已创建', 'success');
      }

      setTimeout(goList, 300);
    });
  }

  function init() {
    var tip = document.querySelector('.member-batch-tip');
    if (tip) tip.setAttribute('title', BATCH_MODE_TIP);

    if (editId) {
      var list = loadList();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === editId) {
          editItem = list[i];
          break;
        }
      }
    }

    var isEdit = !!editItem;
    document.getElementById('formTabTitle').textContent = isEdit ? '编辑批量打标签' : '批量打标签';
    document.getElementById('formCrumb').textContent = isEdit ? '编辑' : '新建';

    if (isEdit) fillFromItem(editItem);
    renderTagOptions();
    syncApplyModeUi();
    renderAudienceSummary();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
