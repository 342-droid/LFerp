/**
 * 供应商档案共享数据（门店/用户 APP 商品透出名称用）
 * 展示规则：有供应商简称则用简称，否则用供应商名称
 */
(function (global) {
  var STORAGE_KEY = 'mdm_supplier_archive_v1';

  var SEED = [
    {
      id: 'SUP20188301',
      name: '超管创建仓库042402',
      shortName: '超管仓'
    },
    {
      id: 'SUP20188302',
      name: '小牛供应链',
      shortName: ''
    },
    {
      id: 'SUP20188303',
      name: '珠宝集采中心',
      shortName: '珠宝集采'
    },
    {
      id: 'supplier-lengfeng',
      name: '冷丰优选供应链',
      shortName: '冷丰优选'
    },
    {
      id: 'supplier-huadong',
      name: '华东冷链供应商',
      shortName: '华东冷链'
    },
    {
      id: 'supplier-jiangnan',
      name: '江南果蔬批发',
      shortName: '江南果蔬'
    },
    {
      id: 'supplier-xianfeng',
      name: '鲜丰蔬菜批发',
      shortName: '鲜丰蔬菜'
    },
    {
      id: 'supplier-prod-test',
      name: '生产测试商',
      shortName: ''
    }
  ];

  var list = [];

  function normalize(item) {
    return {
      id: String((item && item.id) || '').trim(),
      name: String((item && item.name) || '').trim(),
      shortName: String((item && (item.shortName || item.short_name)) || '').trim()
    };
  }

  function mergeSeed() {
    SEED.forEach(function (seedItem) {
      var seed = normalize(seedItem);
      if (!seed.id) return;
      var existing = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === seed.id) {
          existing = list[i];
          break;
        }
      }
      if (!existing) {
        list.push(seed);
        return;
      }
      if (!existing.name && seed.name) existing.name = seed.name;
      /* 档案未维护简称时，保留演示种子简称，便于 APP 透出 */
      if (!existing.shortName && seed.shortName) existing.shortName = seed.shortName;
    });
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          list = parsed.map(normalize).filter(function (x) {
            return x.id || x.name;
          });
          mergeSeed();
          save();
          return;
        }
      }
    } catch (e) { /* ignore */ }
    list = SEED.map(normalize);
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function getAll() {
    return list.slice();
  }

  function findById(id) {
    var key = String(id || '').trim();
    if (!key) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === key) return list[i];
    }
    return null;
  }

  function findByName(name) {
    var key = String(name || '').trim();
    if (!key) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === key || list[i].shortName === key) return list[i];
    }
    return null;
  }

  function resolveRecord(input) {
    if (!input) return null;
    if (typeof input === 'string') {
      return findById(input) || findByName(input);
    }
    var id = String(input.id || input.supplierId || '').trim();
    var name = String(input.name || input.supplierName || '').trim();
    return (id && findById(id)) || (name && findByName(name)) || null;
  }

  /** 商品透出名称：简称优先，无简称则用全称 */
  function getDisplayName(input) {
    var rec = resolveRecord(input);
    if (rec) return rec.shortName || rec.name || '';
    if (!input || typeof input === 'string') return String(input || '').trim();
    var shortName = String(input.shortName || input.short_name || '').trim();
    var name = String(input.name || input.supplierName || '').trim();
    return shortName || name;
  }

  function upsert(item) {
    var next = normalize(item);
    if (!next.id && !next.name) return { ok: false, message: '缺少供应商标识' };
    var idx = -1;
    if (next.id) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === next.id) {
          idx = i;
          break;
        }
      }
    }
    if (idx < 0 && next.name) {
      for (var j = 0; j < list.length; j++) {
        if (list[j].name === next.name) {
          idx = j;
          break;
        }
      }
    }
    if (idx >= 0) {
      list[idx] = {
        id: next.id || list[idx].id,
        name: next.name || list[idx].name,
        shortName: next.shortName
      };
    } else {
      list.push(next);
    }
    save();
    return { ok: true, record: idx >= 0 ? list[idx] : list[list.length - 1] };
  }

  /** 从供应商档案表格行同步到 store */
  function syncFromArchiveTable(tbody) {
    var root = tbody || document.getElementById('tableBody');
    if (!root) return;
    root.querySelectorAll('tr').forEach(function (tr) {
      var c = tr.querySelectorAll('td');
      if (!c.length) return;
      var id = String((c[0] && c[0].textContent) || '').trim();
      var name = String((c[2] && c[2].textContent) || '').trim();
      var shortName = '';
      if (tr.getAttribute('data-short-name') != null) {
        shortName = String(tr.getAttribute('data-short-name') || '').trim();
      } else if (c[3] && c[3].getAttribute('data-field') === 'shortName') {
        shortName = String(c[3].textContent || '').trim();
        if (shortName === '—' || shortName === '-') shortName = '';
      }
      if (!id && !name) return;
      upsert({ id: id, name: name, shortName: shortName });
    });
  }

  load();

  global.MdmSupplierArchiveStore = {
    STORAGE_KEY: STORAGE_KEY,
    getAll: getAll,
    findById: findById,
    findByName: findByName,
    getDisplayName: getDisplayName,
    upsert: upsert,
    syncFromArchiveTable: syncFromArchiveTable,
    reload: load
  };
})(typeof window !== 'undefined' ? window : this);
