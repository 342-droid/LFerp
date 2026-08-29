/**
 * 系统默认门店（B 端门店档案写入，C 端自然流量用户读取）
 * localStorage: mdm_system_default_store_v1 / mdm_set_default_store_perm_v1
 */
(function (global) {
  var STORE_KEY = 'mdm_system_default_store_v1';
  var PERM_KEY = 'mdm_set_default_store_perm_v1';
  var HOVER_TIP =
    '系统默认门店会作为自然流量用户的默认门店，避免造成分佣资损，请设置冷丰主体下的门店';

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function hasPermission() {
    var v = localStorage.getItem(PERM_KEY);
    if (v == null || v === '') return true;
    return v !== '0';
  }

  function setPermission(on) {
    try {
      localStorage.setItem(PERM_KEY, on ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
  }

  function readDefault() {
    return readJson(STORE_KEY, null);
  }

  function writeDefault(store) {
    if (!store || !store.storeId) {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch (e) {
        /* ignore */
      }
      return null;
    }
    writeJson(STORE_KEY, store);
    return store;
  }

  function isSplitOpened(txt) {
    var s = String(txt || '').trim();
    return s === '已开通' || s === '开启';
  }

  function isStoreEnabled(txt) {
    var s = String(txt || '').trim();
    return s === '正常' || s === '已启用' || s === '启用';
  }

  function canSetAsDefault(meta) {
    if (!meta) return false;
    return (
      String(meta.onboardStatus || '').trim() === '进件成功' &&
      String(meta.balancePay || '').trim() === '已开通' &&
      isSplitOpened(meta.splitService) &&
      isStoreEnabled(meta.storeStatus)
    );
  }

  global.MdmSystemDefaultStore = {
    STORE_KEY: STORE_KEY,
    PERM_KEY: PERM_KEY,
    HOVER_TIP: HOVER_TIP,
    hasPermission: hasPermission,
    setPermission: setPermission,
    readDefault: readDefault,
    writeDefault: writeDefault,
    canSetAsDefault: canSetAsDefault,
    isSplitOpened: isSplitOpened,
    isStoreEnabled: isStoreEnabled
  };
})(typeof window !== 'undefined' ? window : this);
