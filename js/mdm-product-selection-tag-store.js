/**
 * 选品库 · 商品标签
 * 系统标签预置不可改名/改色/删除；业务标签可新增、编辑、启停、删除。
 */
(function () {
  var STORAGE_KEY = 'mdm_product_selection_tag_v1';

  var COLOR_MAP = {
    orange: { label: '橙色', text: '#ff7019', border: 'rgba(255, 112, 25, 0.45)', bg: '#fff7f0' },
    red: { label: '红色', text: '#cf1322', border: '#ffa39e', bg: '#fff1f0' },
    green: { label: '绿色', text: '#389e0d', border: '#b7eb8f', bg: '#f6ffed' },
    blue: { label: '蓝色', text: '#1677ff', border: '#91caff', bg: '#e6f4ff' },
    gray: { label: '灰色', text: '#8c8c8c', border: '#d9d9d9', bg: '#fafafa' }
  };

  var RETIRED_TAG_IDS = ['sys_skip_auto_cutoff'];
  var RETIRED_TAG_NAMES = ['跳过自动截单'];

  var SYSTEM_SEED = [
    {
      id: 'sys_skip_demand_summary',
      name: '不走订货单',
      color: 'orange',
      source: 'system',
      status: 'active',
      isSystem: true,
      maintainBiz: '订货汇总',
      maintainTip: '打上此标签的商品不进入采购「门店订货汇总」，不生成门店订货单。适用于已采购到店、不走先销后采的商品（如拉新已铺货）。代采平台配送 / 代采快递配送 / 零售门店自提走订单截单页系统兜底「支付后自动截单」。',
      created_at: '2026-09-02 22:00'
    }
  ];

  var tags = [];
  var idSeq = 1;

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
      pad(d.getMinutes())
    );
  }

  function nextId() {
    return 'biz_' + Date.now() + '_' + idSeq++;
  }

  function clone(row) {
    return JSON.parse(JSON.stringify(row));
  }

  function colorMeta(color) {
    return COLOR_MAP[color] || COLOR_MAP.orange;
  }

  function normalizeTag(row) {
    if (!row) return null;
    var isSystem = !!row.isSystem || row.source === 'system';
    var color = COLOR_MAP[row.color] ? row.color : 'orange';
    var status = row.status === 'stopped' && !isSystem ? 'stopped' : 'active';
    return {
      id: String(row.id || nextId()),
      name: String(row.name || '').trim(),
      color: color,
      source: isSystem ? 'system' : 'business',
      status: status,
      isSystem: isSystem,
      maintainBiz: row.maintainBiz ? String(row.maintainBiz) : '',
      maintainTip: row.maintainTip ? String(row.maintainTip) : '',
      created_at: row.created_at || nowStr()
    };
  }

  function ensureSystemTags(list) {
    list = list.filter(function (row) {
      return (
        RETIRED_TAG_IDS.indexOf(row.id) < 0 &&
        RETIRED_TAG_NAMES.indexOf(String(row.name || '').trim()) < 0
      );
    });
    var map = {};
    list.forEach(function (row) {
      map[row.id] = row;
    });
    SYSTEM_SEED.forEach(function (seed) {
      var current = map[seed.id];
      if (!current) {
        list.unshift(normalizeTag(seed));
        return;
      }
      current.name = seed.name;
      current.color = seed.color;
      current.source = 'system';
      current.isSystem = true;
      current.status = 'active';
      current.maintainBiz = seed.maintainBiz;
      current.maintainTip = seed.maintainTip;
    });
    return list;
  }

  function load() {
    var list = [];
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed.map(normalizeTag).filter(Boolean);
      }
    } catch (e) {
      list = [];
    }
    if (!list.length) list = SYSTEM_SEED.map(normalizeTag);
    tags = ensureSystemTags(list);
    save();
  }

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    } catch (e) {
      /* ignore */
    }
  }

  function getAll() {
    return tags.map(clone);
  }

  function getById(id) {
    var found = null;
    tags.forEach(function (row) {
      if (row.id === id) found = row;
    });
    return found ? clone(found) : null;
  }

  function getEnabled() {
    return getAll().filter(function (row) {
      return row.status === 'active';
    });
  }

  function isSkipDemandSummary(name) {
    var text = String(name || '').trim();
    return text === '不走订货单' || text === 'sys_skip_demand_summary';
  }

  function findByName(name, ignoreId) {
    var target = String(name || '').trim();
    var hit = null;
    tags.forEach(function (row) {
      if (ignoreId && row.id === ignoreId) return;
      if (row.name === target) hit = row;
    });
    return hit;
  }

  function addTag(payload) {
    var name = String((payload && payload.name) || '').trim();
    if (!name) return { ok: false, message: '请输入标签名称' };
    if (name.length > 20) return { ok: false, message: '标签名称不超过20字' };
    if (findByName(name)) return { ok: false, message: '标签名称已存在' };
    var row = normalizeTag({
      id: nextId(),
      name: name,
      color: payload && payload.color,
      source: 'business',
      status: payload && payload.status === 'stopped' ? 'stopped' : 'active',
      isSystem: false
    });
    tags.push(row);
    save();
    return { ok: true, tag: clone(row) };
  }

  function updateTag(id, payload) {
    var current = null;
    tags.forEach(function (row) {
      if (row.id === id) current = row;
    });
    if (!current) return { ok: false, message: '标签不存在' };
    if (current.isSystem) return { ok: false, message: '系统标签不支持修改名称、颜色和业务语义' };
    var name = String((payload && payload.name) || '').trim();
    if (!name) return { ok: false, message: '请输入标签名称' };
    if (name.length > 20) return { ok: false, message: '标签名称不超过20字' };
    if (findByName(name, id)) return { ok: false, message: '标签名称已存在' };
    current.name = name;
    if (payload && payload.color && COLOR_MAP[payload.color]) current.color = payload.color;
    if (payload && (payload.status === 'active' || payload.status === 'stopped')) {
      current.status = payload.status;
    }
    save();
    return { ok: true, tag: clone(current) };
  }

  function setStatus(id, status) {
    var current = null;
    tags.forEach(function (row) {
      if (row.id === id) current = row;
    });
    if (!current) return { ok: false, message: '标签不存在' };
    if (current.isSystem) return { ok: false, message: '系统标签不支持停用' };
    current.status = status === 'stopped' ? 'stopped' : 'active';
    save();
    return { ok: true, tag: clone(current) };
  }

  function removeTag(id) {
    var current = getById(id);
    if (!current) return { ok: false, message: '标签不存在' };
    if (current.isSystem) return { ok: false, message: '系统标签不支持删除' };
    tags = tags.filter(function (row) {
      return row.id !== id;
    });
    save();
    return { ok: true };
  }

  load();

  window.MdmProductSelectionTagStore = {
    COLOR_MAP: COLOR_MAP,
    colorMeta: colorMeta,
    getAll: getAll,
    getById: getById,
    getEnabled: getEnabled,
    isSkipDemandSummary: isSkipDemandSummary,
    addTag: addTag,
    updateTag: updateTag,
    setStatus: setStatus,
    removeTag: removeTag
  };
})();
