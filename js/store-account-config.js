/**
 * 门店账户配置（结算·账户配置 + 档案个性化）
 * - 平台通用：保证金账户金额、货款金额、历史数据影响
 * - 门店个性化：优先于平台通用
 */
(function (global) {
  var STORAGE_KEY = 'lf_store_account_config_v1';

  var DEFAULT_PLATFORM = {
    depositRequired: 2000,
    goodsQuotaRequired: 8000,
    affectHistory: 'no' /* yes | no */
  };

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            platform: Object.assign({}, DEFAULT_PLATFORM, parsed.platform || {}),
            stores: parsed.stores && typeof parsed.stores === 'object' ? parsed.stores : {}
          };
        }
      }
    } catch (e) {
      /* ignore */
    }
    return { platform: Object.assign({}, DEFAULT_PLATFORM), stores: {} };
  }

  function saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || loadAll()));
    } catch (e) {
      /* ignore */
    }
  }

  function getPlatform() {
    return Object.assign({}, loadAll().platform);
  }

  function savePlatform( partial ) {
    var all = loadAll();
    var next = Object.assign({}, all.platform, partial || {});
    next.depositRequired = round2(next.depositRequired);
    next.goodsQuotaRequired = round2(next.goodsQuotaRequired);
    next.affectHistory = next.affectHistory === 'yes' ? 'yes' : 'no';
    all.platform = next;
    saveAll(all);
    return getPlatform();
  }

  function getStoreOverride(storeId) {
    var id = String(storeId || '').trim();
    if (!id) return null;
    var row = loadAll().stores[id];
    return row ? Object.assign({}, row) : null;
  }

  function saveStoreOverride(storeId, partial) {
    var id = String(storeId || '').trim();
    if (!id) return null;
    var all = loadAll();
    var prev = all.stores[id] || {};
    var next = Object.assign({}, prev, partial || {}, { storeId: id, updatedAt: Date.now() });
    if (next.depositRequired != null && next.depositRequired !== '') {
      next.depositRequired = round2(next.depositRequired);
    }
    if (next.goodsQuotaRequired != null && next.goodsQuotaRequired !== '') {
      next.goodsQuotaRequired = round2(next.goodsQuotaRequired);
    }
    all.stores[id] = next;
    saveAll(all);
    return getStoreOverride(id);
  }

  function clearStoreOverrideField(storeId, field) {
    var id = String(storeId || '').trim();
    if (!id) return null;
    var all = loadAll();
    var prev = all.stores[id];
    if (!prev) return null;
    delete prev[field];
    all.stores[id] = prev;
    saveAll(all);
    return getStoreOverride(id);
  }

  /**
   * 解析生效规则：门店个性化 > 平台通用
   */
  function resolve(storeId) {
    var platform = getPlatform();
    var ov = getStoreOverride(storeId) || {};
    var depositFromStore = ov.depositRequired != null && ov.depositRequired !== '';
    var goodsFromStore = ov.goodsQuotaRequired != null && ov.goodsQuotaRequired !== '';
    return {
      depositRequired: depositFromStore
        ? round2(ov.depositRequired)
        : round2(platform.depositRequired),
      goodsQuotaRequired: goodsFromStore
        ? round2(ov.goodsQuotaRequired)
        : round2(platform.goodsQuotaRequired),
      affectHistory: platform.affectHistory === 'yes' ? 'yes' : 'no',
      depositSource: depositFromStore ? 'store' : 'platform',
      goodsSource: goodsFromStore ? 'store' : 'platform',
      platform: platform,
      storeOverride: ov
    };
  }

  var HISTORY_TIPS = {
    yes: '修改配置后，已产生的历史数据会按照新配置规则同步调整或重新计算',
    no: '修改配置后，仅影响新增数据，历史数据保持原配置结果不变'
  };

  global.StoreAccountConfig = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_PLATFORM: DEFAULT_PLATFORM,
    HISTORY_TIPS: HISTORY_TIPS,
    getPlatform: getPlatform,
    savePlatform: savePlatform,
    getStoreOverride: getStoreOverride,
    saveStoreOverride: saveStoreOverride,
    clearStoreOverrideField: clearStoreOverrideField,
    resolve: resolve,
    loadAll: loadAll
  };
})(typeof window !== 'undefined' ? window : this);
