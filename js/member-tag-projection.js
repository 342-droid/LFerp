/**
 * 会员标签跨业务只读投影。
 *
 * 会员标签的定义与打标仍归「会员 / 会员360」管理。本适配层只把现有
 * member.tags 契约转换成售后列表可展示、可筛选的数据，不提供任何写入口。
 */
(function () {
  'use strict';

  var MEMBER_LIST_KEY = 'mdm_member_c_list_v1';
  var TAG_CATALOG = [
    { id: 'TV10001', name: '高活跃' },
    { id: 'TV10002', name: '中活跃' },
    { id: 'TV10003', name: '低活跃', enabled: false },
    { id: 'TV10004', name: '储值' },
    { id: 'TV10005', name: '复购' },
    { id: 'TV10006', name: '新客' }
  ];
  var DEFAULT_MEMBER_TAGS = {
    U10001: ['高活跃'],
    U10002: ['储值'],
    U10003: [],
    U10004: ['复购'],
    U10005: [],
    U10006: ['新客'],
    U10007: [],
    U10008: [],
    U10012: []
  };

  function parseTagValues(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return typeof item === 'object' && item ? item.name || item.tagValue || '' : item;
      }).map(String).map(function (item) { return item.trim(); }).filter(Boolean);
    }
    var text = String(value == null ? '' : value).trim();
    if (!text || text === '—' || text === '-') return [];
    return text.split(/[、,，;；|/]+/).map(function (item) { return item.trim(); }).filter(Boolean);
  }

  function readStoredMembers() {
    try {
      var raw = localStorage.getItem(MEMBER_LIST_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function memberIdOf(record) {
    return String((record && (record.id || record.memberId || record.userId)) || '').trim();
  }

  function tagValuesFor(memberId) {
    var id = String(memberId || '').trim();
    var stored = readStoredMembers();
    for (var i = 0; i < stored.length; i += 1) {
      if (memberIdOf(stored[i]) === id && Object.prototype.hasOwnProperty.call(stored[i], 'tags')) {
        return parseTagValues(stored[i].tags);
      }
    }
    return (DEFAULT_MEMBER_TAGS[id] || []).slice();
  }

  function generatedId(name) {
    var hash = 0;
    var text = String(name || '');
    for (var i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    return 'MEMBER_TAG_' + Math.abs(hash);
  }

  function metaForName(name) {
    var known = TAG_CATALOG.find(function (item) { return item.name === name; });
    return known || { id: generatedId(name), name: name };
  }

  function listTags(includeDisabled) {
    var catalog = TAG_CATALOG.map(function (item) {
      return { id: item.id, name: item.name, color: '', enabled: item.enabled !== false };
    });
    var seen = {};
    catalog.forEach(function (item) { seen[item.name] = true; });
    readStoredMembers().forEach(function (member) {
      parseTagValues(member.tags).forEach(function (name) {
        if (seen[name]) return;
        seen[name] = true;
        var meta = metaForName(name);
        catalog.push({ id: meta.id, name: meta.name, color: '', enabled: true });
      });
    });
    return catalog.filter(function (item) { return includeDisabled || item.enabled !== false; });
  }

  function tagsFor(memberId) {
    return tagValuesFor(memberId).map(function (name) {
      var meta = metaForName(name);
      return { id: meta.id, name: meta.name, color: '', enabled: true };
    });
  }

  function tagIdsFor(memberId) {
    return tagsFor(memberId).map(function (item) { return item.id; });
  }

  function matches(memberId, selectedIds, mode) {
    var selected = selectedIds || [];
    if (!selected.length) return true;
    var memberTagIds = tagIdsFor(memberId);
    if (mode === 'ALL') {
      return selected.every(function (id) { return memberTagIds.indexOf(id) >= 0; });
    }
    return selected.some(function (id) { return memberTagIds.indexOf(id) >= 0; });
  }

  window.MemberTagProjection = {
    MEMBER_LIST_KEY: MEMBER_LIST_KEY,
    listTags: listTags,
    tagsFor: tagsFor,
    tagIdsFor: tagIdsFor,
    matches: matches
  };
})();
