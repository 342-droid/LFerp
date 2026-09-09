/**
 * 积分规则 / 消费送积分 / 积分抵现 — 操作日志存储
 * 抽屉样式与字段对齐营销-优惠券-操作日志
 */
(function (global) {
  'use strict';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad2(d.getMonth() + 1) +
      '-' +
      pad2(d.getDate()) +
      ' ' +
      pad2(d.getHours()) +
      ':' +
      pad2(d.getMinutes()) +
      ':' +
      pad2(d.getSeconds())
    );
  }

  function nextId() {
    return 'log-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function displayValue(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'object') {
      try {
        return JSON.stringify(v);
      } catch (e) {
        return String(v);
      }
    }
    return String(v);
  }

  function getPath(obj, path) {
    if (!obj) return undefined;
    var parts = String(path || '').split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function diffFields(oldObj, newObj, fields) {
    var changes = [];
    (fields || []).forEach(function (field) {
      var ov = displayValue(getPath(oldObj, field));
      var nv = displayValue(getPath(newObj, field));
      if (ov !== nv) {
        changes.push({ field: field, oldValue: ov, newValue: nv });
      }
    });
    return changes;
  }

  function createModule(cfg) {
    cfg = cfg || {};
    var storageKey = cfg.storageKey;
    var actionLabel = cfg.actionLabel || {};
    var actionUri = cfg.actionUri || {};
    var resource = cfg.resource || 'member_points';
    var service = cfg.service || 'member-core';
    var logs = {};
    var loaded = false;

    function persist() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(logs));
      } catch (e) { /* ignore */ }
    }

    function makeLog(partial, resourceId) {
      var action = (partial && partial.action) || '';
      var ts = (partial && (partial.timestamp || partial.time)) || nowStr();
      return {
        id: (partial && partial.id) || nextId(),
        timestamp: ts,
        time: ts,
        action: action,
        operator: (partial && partial.operator) || '张征',
        success: !partial || partial.success !== false,
        content: (partial && partial.content) || actionLabel[action] || action,
        httpMethod: (partial && partial.httpMethod) || 'POST',
        requestUri: (partial && partial.requestUri) || actionUri[action] || '/member-core/v1/points',
        clientIp: (partial && partial.clientIp) || '10.8.12.21',
        service: (partial && partial.service) || service,
        elapsedMs: partial && partial.elapsedMs != null ? partial.elapsedMs : 30 + Math.floor(Math.random() * 80),
        resource: (partial && partial.resource) || resource,
        resourceId: String((partial && partial.resourceId) || resourceId || ''),
        requestParams:
          (partial && partial.requestParams) ||
          JSON.stringify({ id: resourceId || '', action: action }),
        changes: partial && Array.isArray(partial.changes) ? partial.changes : []
      };
    }

    function ensureLoaded() {
      if (loaded) return;
      loaded = true;
      try {
        var raw = localStorage.getItem(storageKey);
        var parsed = raw ? JSON.parse(raw) : null;
        logs = parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) {
        logs = {};
      }
    }

    function seedIfEmpty(list, buildSeed) {
      ensureLoaded();
      var keys = Object.keys(logs);
      if (keys.length) return;
      (list || []).forEach(function (item) {
        if (typeof buildSeed === 'function') {
          logs[item.id] = buildSeed(item, makeLog) || [];
        }
      });
      persist();
    }

    function pushLog(resourceId, action, extra) {
      ensureLoaded();
      var id = String(resourceId || '');
      if (!id) return null;
      extra = extra || {};
      extra.action = action;
      if (!logs[id]) logs[id] = [];
      var row = makeLog(extra, id);
      logs[id].unshift(row);
      persist();
      return row;
    }

    function listLogs(resourceId, pageNum, pageSize) {
      ensureLoaded();
      var all = (logs[String(resourceId)] || []).slice();
      all.sort(function (a, b) {
        return String(b.timestamp || b.time || '').localeCompare(String(a.timestamp || a.time || ''));
      });
      var page = Number(pageNum) || 1;
      var size = Number(pageSize) || 20;
      var start = (page - 1) * size;
      return { list: all.slice(start, start + size), total: all.length };
    }

    function findLog(logId) {
      ensureLoaded();
      var keys = Object.keys(logs);
      for (var i = 0; i < keys.length; i++) {
        var arr = logs[keys[i]] || [];
        for (var j = 0; j < arr.length; j++) {
          if (String(arr[j].id) === String(logId)) return arr[j];
        }
      }
      return null;
    }

    return {
      ACTION_LABEL: actionLabel,
      FIELD_LABEL: cfg.fieldLabel || {},
      VALUE_MAP: cfg.valueMap || {},
      makeLog: makeLog,
      seedIfEmpty: seedIfEmpty,
      pushLog: pushLog,
      listLogs: listLogs,
      findLog: findLog,
      ensureLoaded: ensureLoaded
    };
  }

  global.MdmMemberPointsOplog = {
    nowStr: nowStr,
    diffFields: diffFields,
    displayValue: displayValue,
    createModule: createModule
  };
})(window);
