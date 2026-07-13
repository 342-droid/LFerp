/**
 * 代采商城标签 — 共享数据层
 */
(function () {
  var STORAGE_KEY = 'mdm_proxy_tag_list_v1';
  var PROXY_LIST_KEY = 'mdm_proxy_product_list_v1';

  var SEED = [
    {
      id: '319738699568918528',
      name: '冷丰溯源',
      sort: 2,
      bind_count: 19,
      created_at: '2025-07-09 19:05'
    },
    {
      id: '319738699568918529',
      name: '冷丰优选',
      sort: 3,
      bind_count: 22,
      created_at: '2024-11-29 11:18'
    },
    {
      id: '319738699568918530',
      name: '牛牛专用',
      sort: 4,
      bind_count: 14,
      created_at: '2025-02-11 18:52'
    },
    {
      id: '319738699568918531',
      name: '蔬菜水果',
      sort: 5,
      bind_count: 9,
      created_at: '2026-02-26 17:17'
    },
    {
      id: '319738699568918532',
      name: '优选商品',
      sort: 6,
      bind_count: 15,
      created_at: '2025-03-04 11:52'
    },
    {
      id: '319738699568918533',
      name: '天天平价',
      sort: 7,
      bind_count: 29,
      created_at: '2026-03-09 15:35'
    }
  ];

  var tags = [];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function genId() {
    var ts = Date.now().toString();
    var rand = String(Math.floor(Math.random() * 900) + 100);
    return ts + rand;
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          tags = parsed;
          syncBindCounts();
          return;
        }
      }
    } catch (e) { /* ignore */ }
    tags = SEED.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        sort: item.sort,
        bind_count: item.bind_count,
        created_at: item.created_at
      };
    });
    syncBindCounts();
    save();
  }

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    } catch (e) { /* ignore */ }
  }

  function readProxyProducts() {
    try {
      var raw = sessionStorage.getItem(PROXY_LIST_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function syncBindCounts() {
    var products = readProxyProducts();
    if (!products.length) return;

    var counts = {};
    products.forEach(function (item) {
      var name = String(item.tag || '').trim();
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });
    tags.forEach(function (tag) {
      tag.bind_count = counts[tag.name] || 0;
    });
  }

  function sortTags(list) {
    return list.slice().sort(function (a, b) {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return String(a.created_at).localeCompare(String(b.created_at));
    });
  }

  function getAll() {
    syncBindCounts();
    return sortTags(tags);
  }

  function getById(id) {
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].id === id) return tags[i];
    }
    return null;
  }

  function nameExists(name, excludeId) {
    var trimmed = String(name || '').trim();
    return tags.some(function (tag) {
      return tag.name === trimmed && tag.id !== excludeId;
    });
  }

  function getNextSort() {
    if (!tags.length) return 1;
    var max = tags.reduce(function (m, tag) {
      return Math.max(m, tag.sort || 0);
    }, 0);
    return max + 1;
  }

  function addTag(payload) {
    payload = payload || {};
    var name = String(payload.name || '').trim();
    if (!name) return { ok: false, message: '请输入标签名称' };
    if (name.length > 5) return { ok: false, message: '标签名称不能超过5个字符' };
    if (nameExists(name)) return { ok: false, message: '标签名称已存在' };

    var tag = {
      id: genId(),
      name: name,
      sort: getNextSort(),
      bind_count: 0,
      created_at: nowStr()
    };
    tags.push(tag);
    save();
    return { ok: true, tag: tag };
  }

  function updateTag(id, payload) {
    payload = payload || {};
    var tag = getById(id);
    if (!tag) return { ok: false, message: '标签不存在' };

    var name = String(payload.name != null ? payload.name : tag.name).trim();
    if (!name) return { ok: false, message: '请输入标签名称' };
    if (name.length > 5) return { ok: false, message: '标签名称不能超过5个字符' };
    if (nameExists(name, id)) return { ok: false, message: '标签名称已存在' };

    var oldName = tag.name;
    tag.name = name;

    if (oldName !== name) {
      var products = readProxyProducts();
      var changed = false;
      products.forEach(function (item) {
        if (item.tag === oldName) {
          item.tag = name;
          changed = true;
        }
      });
      if (changed) {
        try {
          sessionStorage.setItem(PROXY_LIST_KEY, JSON.stringify(products));
        } catch (e) { /* ignore */ }
      }
    }

    save();
    syncBindCounts();
    return { ok: true, tag: tag };
  }

  function moveTag(id, direction) {
    var sorted = sortTags(tags);
    var index = -1;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].id === id) {
        index = i;
        break;
      }
    }
    if (index < 0) return { ok: false, message: '标签不存在' };

    var targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) {
      return { ok: false, message: direction === 'up' ? '已在最顶部' : '已在最底部' };
    }

    var current = getById(id);
    var adjacent = getById(sorted[targetIndex].id);
    if (!current || !adjacent) return { ok: false, message: '标签不存在' };

    var tempSort = current.sort;
    current.sort = adjacent.sort;
    adjacent.sort = tempSort;
    save();
    return { ok: true };
  }

  function removeTag(id) {
    var tag = getById(id);
    if (!tag) return { ok: false, message: '标签不存在' };

    var oldName = tag.name;
    tags = tags.filter(function (item) { return item.id !== id; });

    var products = readProxyProducts();
    var changed = false;
    products.forEach(function (item) {
      if (item.tag === oldName) {
        item.tag = '';
        changed = true;
      }
    });
    if (changed) {
      try {
        sessionStorage.setItem(PROXY_LIST_KEY, JSON.stringify(products));
      } catch (e) { /* ignore */ }
    }

    save();
    return { ok: true };
  }

  load();

  window.MdmProxyTagStore = {
    getAll: getAll,
    getById: getById,
    addTag: addTag,
    updateTag: updateTag,
    moveTag: moveTag,
    removeTag: removeTag,
    syncBindCounts: syncBindCounts
  };
})();
