/**
 * 门店简称 ↔ 站点储位
 * - 建店/入驻编辑：门店简称 = 门店名称，并回传到站点「储位名称」
 * - 站点表改储位后：门店档案简称 = 储位编码-储位名称
 * - 已生成的入驻审核单不随站点回写变更
 */
(function (global) {
  var STORAGE_KEY = 'lferp:store-site-slot:v1';

  function readStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') return { byStore: {}, byHub: {} };
      if (!data.byStore) data.byStore = {};
      if (!data.byHub) data.byHub = {};
      return data;
    } catch (e) {
      return { byStore: {}, byHub: {} };
    }
  }

  function writeStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || { byStore: {}, byHub: {} }));
    } catch (e) {}
  }

  function composeShortName(slotCode, slotName) {
    var code = String(slotCode || '').trim();
    var name = String(slotName || '').trim();
    if (code && name) return code + '-' + name;
    return name || code || '';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hubCodeOf(storeCode) {
    return 'DH-' + String(storeCode || '').trim();
  }

  function upsert(rec) {
    var data = readStore();
    if (rec.storeCode) data.byStore[rec.storeCode] = rec;
    if (rec.hubCode) data.byHub[rec.hubCode] = rec;
    writeStore(data);
    return rec;
  }

  function getByStore(storeCode) {
    var key = String(storeCode || '').trim();
    if (!key) return null;
    return readStore().byStore[key] || null;
  }

  function getByHub(hubCode) {
    var key = String(hubCode || '').trim();
    if (!key) return null;
    return readStore().byHub[key] || null;
  }

  function getShortName(storeCode, fallbackName) {
    var rec = getByStore(storeCode);
    if (rec && rec.fromSite) return composeShortName(rec.slotCode, rec.slotName);
    if (rec && rec.shortName) return rec.shortName;
    return String(fallbackName || '').trim();
  }

  /* 建店 / 入驻编辑：简称跟门店名称，储位名称同步为门店名称 */
  function syncFromStore(input) {
    var storeCode = String((input && input.storeCode) || '').trim();
    var storeName = String((input && input.storeName) || '').trim();
    if (!storeCode && !storeName) return null;
    var prev = getByStore(storeCode) || {};
    if (prev.fromSite) return prev;
    var slotCode = prev.slotCode || storeCode;
    var hubCode = prev.hubCode || (storeCode ? hubCodeOf(storeCode) : '');
    return upsert({
      storeCode: storeCode,
      storeName: storeName,
      shortName: storeName,
      slotCode: slotCode,
      slotName: storeName,
      hubCode: hubCode,
      fromSite: false,
      source: (input && input.source) || 'store'
    });
  }

  /* 站点表改储位：回写门店档案简称，不改入驻审核 */
  function updateFromSite(input) {
    var hubCode = String((input && input.hubCode) || '').trim();
    var slotCode = String((input && input.slotCode) || '').trim();
    var slotName = String((input && input.slotName) || '').trim();
    var storeCode = String((input && input.storeCode) || '').trim();
    var prev = (storeCode && getByStore(storeCode)) || (hubCode && getByHub(hubCode)) || {};
    storeCode = storeCode || prev.storeCode || '';
    hubCode = hubCode || prev.hubCode || (storeCode ? hubCodeOf(storeCode) : '');
    if (!storeCode && !hubCode) return null;
    var shortName = composeShortName(slotCode || prev.slotCode, slotName || prev.slotName);
    return upsert({
      storeCode: storeCode,
      storeName: prev.storeName || slotName,
      shortName: shortName,
      slotCode: slotCode || prev.slotCode || '',
      slotName: slotName || prev.slotName || '',
      hubCode: hubCode,
      fromSite: true,
      source: 'site'
    });
  }

  function listLinked() {
    var data = readStore();
    return Object.keys(data.byStore).map(function (key) {
      return data.byStore[key];
    });
  }

  function applyShortNameToStoreRow(tr) {
    if (!tr) return;
    var cells = tr.querySelectorAll('td');
    var storeCode = cells[0] ? String(cells[0].textContent || '').trim() : '';
    var nameCell = cells[2];
    var storeName = nameCell ? String(nameCell.textContent || '').trim() : '';
    var shortName = getShortName(storeCode, storeName);
    if (shortName) tr.setAttribute('data-short-name', shortName);
  }

  function applyShortNamesToStoreTable(tbody) {
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(applyShortNameToStoreRow);
  }

  function hydrateHubTable(tbody) {
    if (!tbody) return;
    var seen = {};
    tbody.querySelectorAll('tr').forEach(function (tr) {
      var cells = tr.querySelectorAll('td');
      if (cells.length < 6) return;
      var hubCode = String(cells[1].textContent || '').trim();
      var slotCode = String(cells[4].textContent || '').trim();
      seen[hubCode] = true;
      var rec = getByHub(hubCode);
      if (!rec) {
        rec = listLinked().filter(function (item) {
          return item.slotCode === slotCode;
        })[0];
      }
      if (rec) {
        if (rec.storeCode) tr.setAttribute('data-store-code', rec.storeCode);
        cells[5].textContent = rec.slotName || cells[5].textContent;
      } else if (!String(cells[5].textContent || '').trim()) {
        cells[5].textContent = String(cells[2].textContent || '').trim();
      }
    });
    listLinked().forEach(function (rec) {
      if (!rec.hubCode || seen[rec.hubCode]) return;
      var tr = document.createElement('tr');
      if (rec.storeCode) tr.setAttribute('data-store-code', rec.storeCode);
      tr.innerHTML =
        '<td><input type="checkbox" class="table-checkbox checkbox-row"></td>' +
        '<td>' +
        escapeHtml(rec.hubCode) +
        '</td><td>' +
        escapeHtml(rec.storeName || rec.slotName || '') +
        '</td><td>—</td><td>' +
        escapeHtml(rec.slotCode || '') +
        '</td><td>' +
        escapeHtml(rec.slotName || '') +
        '</td><td>—</td><td>门店</td>' +
        '<td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>' +
        '<td><span class="status active">启用</span></td>' +
        '<td>—</td><td>—</td>' +
        '<td class="action-links"><a href="#" class="edit-btn">编辑</a></td>';
      tbody.appendChild(tr);
    });
  }

  global.MdmStoreSiteSlot = {
    composeShortName: composeShortName,
    getByStore: getByStore,
    getByHub: getByHub,
    getShortName: getShortName,
    syncFromStore: syncFromStore,
    updateFromSite: updateFromSite,
    listLinked: listLinked,
    applyShortNameToStoreRow: applyShortNameToStoreRow,
    applyShortNamesToStoreTable: applyShortNamesToStoreTable,
    hydrateHubTable: hydrateHubTable
  };
})(typeof window !== 'undefined' ? window : this);
