/**
 * 代采售卖范围：按门店过滤进货商城商品。
 * 优先读 MDM 代采商品列表（sessionStorage mdm_proxy_product_list_v1）的售卖范围；
 * 未配置时用演示范围，保证切店能看到不同商品。
 */
(function (global) {
  var PROXY_LIST_KEY = 'mdm_proxy_product_list_v1';
  var SELECTED_STORE_KEY = 'ua_bd_restock_store_v1';

  var EXTRA_BD_STORES = [
    {
      id: 'xiaoshan',
      name: '鲜丰水果萧山万达店',
      shortName: '鲜丰-萧山万达',
      regionCascade: '浙江省 / 杭州市 / 萧山区',
      regionId: '330000',
      cityId: '330100',
      districtId: '330109',
      proxyStoreId: 'st-002',
      address: '杭州市萧山区金城路987号萧山万达广场',
      boundBd: '李泽峰'
    },
    {
      id: 'chaoyang',
      name: '鲜丰水果朝阳大悦城店',
      shortName: '鲜丰-朝阳大悦城',
      regionCascade: '北京市 / 市辖区 / 朝阳区',
      regionId: '110000',
      cityId: '110100',
      districtId: '110105',
      proxyStoreId: 'st-005',
      address: '北京市朝阳区朝阳北路101号朝阳大悦城',
      boundBd: '李泽峰'
    },
    {
      id: 'lujiazui',
      name: '鲜丰水果陆家嘴店',
      shortName: '鲜丰-陆家嘴',
      regionCascade: '上海市 / 市辖区 / 浦东新区',
      regionId: '310000',
      cityId: '310100',
      districtId: '310115',
      proxyStoreId: 'st-007',
      address: '上海市浦东新区陆家嘴环路1000号',
      boundBd: '李泽峰'
    }
  ];

  /* 演示售卖范围：与代采商品配置页的全部 / 省市区 / 门店一致 */
  var DEMO_SCOPE_BY_SPU = {
    SPU00088: { saleScope: 'region', saleRegions: { '330000': 1 }, saleRegionSummary: ['浙江省'] },
    SPU00085: { saleScope: 'region', saleRegions: { '330000': 1 }, saleRegionSummary: ['浙江省'] },
    SPU00082: { saleScope: 'store', saleStores: { 'st-003': 1, '1': 1 } },
    SPU00098: { saleScope: 'region', saleRegions: { '310000': 1 }, saleRegionSummary: ['上海市'] },
    SPU00102: { saleScope: 'region', saleRegions: { '110000': 1 }, saleRegionSummary: ['北京市'] },
    SPU00078: { saleScope: 'store', saleStores: { 'st-002': 1, xiaoshan: 1 } }
  };

  var REGION_NAME = {
    '110000': '北京',
    '310000': '上海',
    '330000': '浙江'
  };

  function restockIdToSpu(id) {
    id = String(id || '');
    if (!id) return '';
    if (id.indexOf('eggplant-long') === 0) return 'SPU00078';
    if (id.indexOf('eggplant-round') === 0) return 'SPU00085';
    if (id.indexOf('hot-cola') === 0 || id === 'cola' || id.indexOf('cola-') === 0) return 'SPU00082';
    if (id === 'egg' || id === 'hot-egg' || id.indexOf('egg-') === 0) return 'SPU00088';
    if (id === 'tea' || id.indexOf('tea-') === 0) return 'SPU00098';
    if (id === 'water' || id.indexOf('water-') === 0) return 'SPU00102';
    return '';
  }

  function readProxyList() {
    try {
      var raw = sessionStorage.getItem(PROXY_LIST_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function findProxyByCode(code) {
    if (!code) return null;
    var list = readProxyList();
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].code === code) return list[i];
    }
    return null;
  }

  function normalizeStore(raw) {
    if (!raw || raw.id == null) return null;
    var cascade = raw.regionCascade || '';
    var regionId = raw.regionId || '';
    if (!regionId) {
      if (cascade.indexOf('北京') >= 0) regionId = '110000';
      else if (cascade.indexOf('上海') >= 0) regionId = '310000';
      else if (cascade.indexOf('浙江') >= 0) regionId = '330000';
    }
    return {
      id: String(raw.id),
      name: raw.name || raw.shortName || '门店',
      shortName: raw.shortName || raw.name || '门店',
      regionCascade: cascade,
      regionId: regionId,
      cityId: raw.cityId || '',
      districtId: raw.districtId || '',
      proxyStoreId: raw.proxyStoreId || '',
      address: raw.address || '',
      boundBd: raw.boundBd || ''
    };
  }

  function listBdStores() {
    var seen = {};
    var out = [];
    function push(raw) {
      var store = normalizeStore(raw);
      if (!store || seen[store.id]) return;
      if (raw.phase === 'draft' || !store.name || store.name.indexOf('草稿') === 0) return;
      seen[store.id] = true;
      out.push(store);
    }
    var audits = global.__BD_STORE_AUDITS__;
    if (Array.isArray(audits)) {
      audits.forEach(function (row) {
        if (row && row.boundBd === '李泽峰') push(row);
      });
    }
    EXTRA_BD_STORES.forEach(push);
    return out;
  }

  function getStoreById(id) {
    id = String(id || '');
    var list = listBdStores();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function readSelectedStoreId() {
    try {
      var params = new URLSearchParams((global.location && global.location.search) || '');
      var fromUrl = params.get('storeId');
      if (fromUrl && getStoreById(fromUrl)) return String(fromUrl);
    } catch (e) {
      /* ignore */
    }
    try {
      var saved = sessionStorage.getItem(SELECTED_STORE_KEY);
      if (saved && getStoreById(saved)) return saved;
    } catch (e2) {
      /* ignore */
    }
    var list = listBdStores();
    return list[0] ? list[0].id : '';
  }

  function writeSelectedStoreId(id) {
    try {
      sessionStorage.setItem(SELECTED_STORE_KEY, String(id || ''));
    } catch (e) {
      /* ignore */
    }
  }

  function getCurrentStore(opts) {
    opts = opts || {};
    var list = listBdStores();
    if (!list.length) return null;
    if (opts.fromBd) {
      return getStoreById(readSelectedStoreId()) || list[0];
    }
    if (opts.fromStore) {
      return getStoreById('1') || list[0];
    }
    return null;
  }

  function storeMatchesRegions(store, saleRegions, saleRegionSummary) {
    if (!store) return false;
    var cascade = store.regionCascade || store.address || '';
    var names = saleRegionSummary || [];
    var ni;
    for (ni = 0; ni < names.length; ni++) {
      if (names[ni] && cascade.indexOf(String(names[ni]).replace(/省$|市$/, '')) >= 0) return true;
    }
    var keys = Object.keys(saleRegions || {});
    var storeIds = [store.regionId, store.cityId, store.districtId].filter(Boolean);
    var ki;
    for (ki = 0; ki < keys.length; ki++) {
      var key = String(keys[ki]);
      if (storeIds.indexOf(key) >= 0) return true;
      if (store.regionId && key.slice(0, 2) === String(store.regionId).slice(0, 2)) return true;
      var name = REGION_NAME[key];
      if (name && cascade.indexOf(name) >= 0) return true;
    }
    return false;
  }

  function storeMatchesStores(store, saleStores) {
    if (!store || !saleStores) return false;
    var ids = [store.id, store.proxyStoreId].filter(Boolean);
    for (var i = 0; i < ids.length; i++) {
      if (saleStores[ids[i]]) return true;
    }
    return false;
  }

  function resolveScope(productId) {
    var code = restockIdToSpu(productId);
    var proxy = findProxyByCode(code);
    if (proxy && (proxy.saleScope === 'all' || proxy.saleScope === 'region' || proxy.saleScope === 'store')) {
      return {
        saleScope: proxy.saleScope,
        saleRegions: proxy.saleRegions || {},
        saleRegionSummary: proxy.saleRegionSummary || [],
        saleStores: proxy.saleStores || {}
      };
    }
    return DEMO_SCOPE_BY_SPU[code] || { saleScope: 'all' };
  }

  function isVisible(productId, store) {
    if (!store) return true;
    var scope = resolveScope(productId);
    if (!scope || scope.saleScope === 'all') return true;
    if (scope.saleScope === 'store') return storeMatchesStores(store, scope.saleStores);
    if (scope.saleScope === 'region') {
      return storeMatchesRegions(store, scope.saleRegions, scope.saleRegionSummary);
    }
    return true;
  }

  function filterItems(items, store) {
    return (items || []).filter(function (item) {
      return isVisible(item && (item.id || item.spuId), store);
    });
  }

  global.UaProxySaleScope = {
    listBdStores: listBdStores,
    getStoreById: getStoreById,
    getCurrentStore: getCurrentStore,
    readSelectedStoreId: readSelectedStoreId,
    writeSelectedStoreId: writeSelectedStoreId,
    restockIdToSpu: restockIdToSpu,
    isVisible: isVisible,
    filterItems: filterItems,
    BD_ONLY_ORDER_TIP: '仅门店用户采购'
  };
})(window);
