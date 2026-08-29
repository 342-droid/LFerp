/**
 * LFerp 业务标签原型数据层。
 *
 * 原型约束：
 * 1. 系统管理员只负责按业务模块开通能力；
 * 2. 门店、售后分别维护自己的标签库；会员标签复用会员域现有能力；
 * 3. 颜色是可选展示属性，不参与标签身份；
 * 4. 售后只读消费统一会员标签，不创建平行的会员标签模型。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'lferp_business_tags_v1';
  var DEFAULTS = {
    modules: {
      STORE_TAG: true,
      MEMBER_TAG: true,
      AFTER_SALE_TAG: true
    },
    catalogs: {
      STORE: [
        tag('store-focus', '重点门店', '#fa8c16', 2),
        tag('store-delivery', '配送关注', '#1677ff', 1),
        tag('store-new', '新开门店', '', 1)
      ],
      AFTER_SALE: [
        tag('after-priority', '优先处理', '#ff4d4f', 6),
        tag('after-follow', '重点跟进', '#fa8c16', 8),
        tag('after-material', '待补资料', '', 4)
      ]
    },
    bindings: {
      STORE: {
        ONS307892038169264128: ['store-focus'],
        ONS303445581201: ['store-delivery'],
        ONS303445581202: ['store-focus', 'store-new']
      },
      AFTER_SALE: {}
    }
  };

  function tag(id, name, color, usage) {
    return {
      id: id,
      name: name,
      color: color || '',
      source: '手动创建',
      enabled: true,
      usage: usage || 0,
      updatedAt: '2026-08-29 10:30'
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(data) {
    var next = data && typeof data === 'object' ? data : {};
    var modules = next.modules && typeof next.modules === 'object' ? next.modules : {};
    var legacy = next.capabilities && typeof next.capabilities === 'object' ? next.capabilities : {};
    if (!Object.prototype.hasOwnProperty.call(modules, 'STORE_TAG') &&
        Object.prototype.hasOwnProperty.call(legacy, 'STORE_MANAGEMENT:SELF')) {
      modules.STORE_TAG = legacy['STORE_MANAGEMENT:SELF'];
    }
    if (!Object.prototype.hasOwnProperty.call(modules, 'MEMBER_TAG')) {
      if (Object.prototype.hasOwnProperty.call(legacy, 'MEMBER_MANAGEMENT:SELF')) {
        modules.MEMBER_TAG = legacy['MEMBER_MANAGEMENT:SELF'];
      } else if (Object.prototype.hasOwnProperty.call(legacy, 'CONSUMER_MANAGEMENT:SELF')) {
        modules.MEMBER_TAG = legacy['CONSUMER_MANAGEMENT:SELF'];
      }
    }
    if (!Object.prototype.hasOwnProperty.call(modules, 'AFTER_SALE_TAG') &&
        Object.prototype.hasOwnProperty.call(legacy, 'AFTER_SALE_MANAGEMENT:SELF')) {
      modules.AFTER_SALE_TAG = legacy['AFTER_SALE_MANAGEMENT:SELF'];
    }
    next.modules = Object.assign({}, DEFAULTS.modules, modules);
    delete next.capabilities;
    next.catalogs = next.catalogs || {};
    next.bindings = next.bindings || {};
    delete next.catalogs.CONSUMER;
    delete next.bindings.CONSUMER;
    ['STORE', 'AFTER_SALE'].forEach(function (type) {
      if (!Array.isArray(next.catalogs[type])) next.catalogs[type] = clone(DEFAULTS.catalogs[type]);
      if (!next.bindings[type] || typeof next.bindings[type] !== 'object') {
        next.bindings[type] = clone(DEFAULTS.bindings[type]);
      }
    });
    return next;
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return normalize(raw ? JSON.parse(raw) : clone(DEFAULTS));
    } catch (e) {
      return normalize(clone(DEFAULTS));
    }
  }

  function write(data, detail) {
    var normalized = normalize(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      // 原型在隐私模式下仍允许本页继续交互。
    }
    window.dispatchEvent(
      new CustomEvent('business-tags:changed', { detail: detail || { scope: 'all' } })
    );
    return normalized;
  }

  function isModuleEnabled(moduleCode) {
    return read().modules[moduleCode] !== false;
  }

  function setModuleEnabled(moduleCode, enabled) {
    var data = read();
    data.modules[moduleCode] = !!enabled;
    write(data, { scope: 'module', moduleCode: moduleCode, enabled: !!enabled });
  }

  function listTags(type, includeDisabled) {
    if (type === 'MEMBER') {
      return window.MemberTagProjection ? window.MemberTagProjection.listTags(includeDisabled) : [];
    }
    var list = read().catalogs[type] || [];
    return list.filter(function (item) {
      return includeDisabled || item.enabled !== false;
    });
  }

  function makeId(type, name) {
    var seed = String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 18);
    return String(type || 'tag').toLowerCase() + '-' + (seed || 'tag') + '-' + Date.now().toString(36);
  }

  function addTag(type, values) {
    if (type === 'MEMBER') throw new Error('会员标签请在会员管理中维护');
    var data = read();
    var name = String((values && values.name) || '').trim();
    if (!name) throw new Error('请输入标签名称');
    var duplicated = data.catalogs[type].some(function (item) {
      return item.name === name;
    });
    if (duplicated) throw new Error('标签名称已存在');
    var item = {
      id: makeId(type, name),
      name: name,
      color: String((values && values.color) || '').trim(),
      source: '手动创建',
      enabled: true,
      usage: 0,
      updatedAt: '2026-08-29 ' + new Date().toTimeString().slice(0, 5)
    };
    data.catalogs[type].unshift(item);
    write(data, { scope: 'catalog', type: type, action: 'add', id: item.id });
    return item;
  }

  function toggleTag(type, id) {
    if (type === 'MEMBER') return null;
    var data = read();
    var item = (data.catalogs[type] || []).find(function (candidate) {
      return candidate.id === id;
    });
    if (!item) return null;
    item.enabled = item.enabled === false;
    item.updatedAt = '2026-08-29 ' + new Date().toTimeString().slice(0, 5);
    write(data, { scope: 'catalog', type: type, action: 'toggle', id: id });
    return item;
  }

  function getBinding(type, resourceId) {
    if (type === 'MEMBER') {
      return window.MemberTagProjection ? window.MemberTagProjection.tagIdsFor(resourceId) : [];
    }
    var data = read();
    return ((data.bindings[type] || {})[String(resourceId)] || []).slice();
  }

  function saveBinding(type, resourceIds, tagIds) {
    if (type === 'MEMBER') throw new Error('会员标签请在会员管理中维护');
    var data = read();
    var ids = Array.isArray(resourceIds) ? resourceIds : [resourceIds];
    var activeIds = (data.catalogs[type] || []).map(function (item) { return item.id; });
    var normalizedTags = (tagIds || []).filter(function (id) {
      return activeIds.indexOf(id) >= 0;
    });
    ids.forEach(function (resourceId) {
      data.bindings[type][String(resourceId)] = normalizedTags.slice();
    });
    (data.catalogs[type] || []).forEach(function (item) {
      item.usage = Object.keys(data.bindings[type]).filter(function (resourceId) {
        return (data.bindings[type][resourceId] || []).indexOf(item.id) >= 0;
      }).length;
    });
    write(data, { scope: 'binding', type: type, resourceIds: ids.map(String) });
  }

  function tagsFor(type, resourceId) {
    if (type === 'MEMBER') {
      return window.MemberTagProjection ? window.MemberTagProjection.tagsFor(resourceId) : [];
    }
    var selected = getBinding(type, resourceId);
    return listTags(type, true).filter(function (item) {
      return item.enabled !== false && selected.indexOf(item.id) >= 0;
    });
  }

  function matches(type, resourceId, selectedIds, mode) {
    if (type === 'MEMBER') {
      return window.MemberTagProjection
        ? window.MemberTagProjection.matches(resourceId, selectedIds, mode)
        : !(selectedIds || []).length;
    }
    var selected = selectedIds || [];
    if (!selected.length) return true;
    var bound = getBinding(type, resourceId);
    if (mode === 'ALL') {
      return selected.every(function (id) { return bound.indexOf(id) >= 0; });
    }
    return selected.some(function (id) { return bound.indexOf(id) >= 0; });
  }

  function ensureDemoBinding(type, resourceId, rowIndex) {
    var id = String(resourceId || '');
    if (!id) return [];
    var current = getBinding(type, id);
    if (current.length) return current;
    var index = Number(rowIndex || 0);
    var demo;
    if (type === 'AFTER_SALE') {
      demo = index % 4 === 0
        ? ['after-priority', 'after-follow']
        : index % 4 === 1
          ? ['after-follow']
          : index % 4 === 2
            ? ['after-priority']
            : ['after-material'];
    } else {
      demo = index % 3 === 0
        ? ['store-focus']
        : index % 3 === 1
          ? ['store-delivery']
          : ['store-focus', 'store-new'];
    }
    saveBinding(type, id, demo);
    return demo;
  }

  window.BusinessTagPrototypeStore = {
    STORAGE_KEY: STORAGE_KEY,
    read: read,
    isModuleEnabled: isModuleEnabled,
    setModuleEnabled: setModuleEnabled,
    listTags: listTags,
    addTag: addTag,
    toggleTag: toggleTag,
    getBinding: getBinding,
    saveBinding: saveBinding,
    tagsFor: tagsFor,
    matches: matches,
    ensureDemoBinding: ensureDemoBinding
  };
})();
