/**
 * 会员 · 消费送积分 / 积分抵现 / 积分商城 / 新人专区 列表共用筛选辅助
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveSaleScope(item) {
    item = item || {};
    if (item.saleScope === 'region' || item.saleScope === 'store' || item.saleScope === 'all') {
      return item.saleScope;
    }
    return item.storeScope === 'store' ? 'store' : 'all';
  }

  function normalizeAdcode(code) {
    var s = String(code || '');
    while (s.length > 2 && s.slice(-2) === '00') s = s.slice(0, -2);
    return s;
  }

  function regionCodesOverlap(a, b) {
    if (!a || !b) return false;
    var na = normalizeAdcode(a);
    var nb = normalizeAdcode(b);
    return na === nb || na.indexOf(nb) === 0 || nb.indexOf(na) === 0;
  }

  function saleRegionsCoverCode(saleRegions, code) {
    if (!code) return true;
    var map = saleRegions || {};
    var keys = Object.keys(map).filter(function (k) { return !!map[k]; });
    if (!keys.length) return false;
    return keys.some(function (k) {
      return regionCodesOverlap(k, code);
    });
  }

  /** 旧版：仅按门店 id */
  function matchStoreFilter(item, storeId) {
    if (!storeId) return true;
    var scope = resolveSaleScope(item);
    if (scope === 'all') return true;
    if (scope === 'store') {
      var stores = item.saleStores || item.stores || {};
      return !!stores[storeId];
    }
    return true;
  }

  function regionSummaryTexts(item) {
    var summary = (item && item.saleRegionSummary) || [];
    return summary.map(function (r) {
      if (typeof r === 'string') return r;
      return (r && (r.label || r.name || r.text || r.id)) || '';
    }).filter(Boolean);
  }

  function matchRegionBySummary(item, parts) {
    parts = parts || {};
    if (!parts.province) return true;
    var texts = regionSummaryTexts(item);
    if (!texts.length) return false;
    return texts.some(function (t) {
      var s = String(t);
      if (s.indexOf(parts.province) < 0 && parts.province.indexOf(s) < 0) return false;
      /* 摘要仅到省：覆盖该省下任意市区筛选 */
      if (s === parts.province || (s.indexOf('/') < 0 && s.indexOf(' / ') < 0 && s.indexOf(parts.city || '') < 0)) {
        return true;
      }
      if (parts.city && s.indexOf(parts.city) < 0) return false;
      if (parts.district && s.indexOf(parts.district) < 0 && s.indexOf(parts.city) >= 0) {
        /* 摘要到市：覆盖该市下区 */
        var depth = (s.match(/\//g) || []).length;
        if (depth <= 1) return true;
      }
      if (parts.district && s.indexOf(parts.district) < 0) return false;
      return true;
    });
  }

  /**
   * 售卖范围二级筛选
   * @param {object} item
   * @param {{type?:string, storeId?:string, regionId?:string, regionParts?:object, regions?:object}} f
   */
  function matchSaleScopeFilter(item, f) {
    f = f || {};
    var type = f.type || '';
    var scope = resolveSaleScope(item);
    if (type) {
      if (scope !== type) return false;
    }
    if (type === 'store' && f.storeId) {
      var stores = item.saleStores || item.stores || {};
      if (!stores[f.storeId]) return false;
    }
    if (type === 'region') {
      var regionId = f.regionId || '';
      if (!regionId && f.regions && typeof f.regions === 'object') {
        var keys = Object.keys(f.regions).filter(function (k) { return !!f.regions[k]; });
        regionId = keys[0] || '';
      }
      var parts = f.regionParts || {};
      if (!regionId && !parts.province) return true;

      var map = item.saleRegions || {};
      var mapKeys = Object.keys(map).filter(function (k) { return !!map[k]; });
      if (mapKeys.length) {
        if (regionId && !saleRegionsCoverCode(map, regionId)) return false;
        return true;
      }
      /* 无 adcode 时按区域摘要文案匹配（兼容积分商城等种子数据） */
      if (parts.province) return matchRegionBySummary(item, parts);
      return true;
    }
    return true;
  }

  function fillStoreSearchSelect(inputEl, dropdownEl) {
    if (!inputEl || !dropdownEl) return;
    var keep = inputEl.dataset.value || '';
    var keepText = inputEl.value || '';
    var stores = [];
    if (global.MdmProxyStorePicker && typeof global.MdmProxyStorePicker.listAll === 'function') {
      stores = global.MdmProxyStorePicker.listAll();
    }
    var options = [{ value: '', text: '全部' }].concat(stores.map(function (s) {
      return { value: s.id, text: s.name };
    }));
    if (typeof global.renderSelectOptions === 'function') {
      global.renderSelectOptions(dropdownEl.id, options);
    } else {
      dropdownEl.innerHTML = options.map(function (opt) {
        return '<div class="select-option" data-value="' + escapeHtml(opt.value) + '">' + escapeHtml(opt.text) + '</div>';
      }).join('');
    }
    if (keep) {
      var hit = options.filter(function (o) { return o.value === keep; })[0];
      inputEl.dataset.value = keep;
      inputEl.value = hit ? hit.text : keepText;
    } else {
      inputEl.dataset.value = '';
      inputEl.value = '';
    }
  }

  /**
   * 绑定列表页售卖范围二级联动
   * opts: {
   *   typeSelect, regionGroup, regionMount,
   *   storeGroup, storeInput, storeDropdown,
   *   onChange
   * }
   */
  function bindSaleScopeFilter(opts) {
    opts = opts || {};
    var state = {
      regionId: '',
      regionPath: '',
      regionParts: { province: '', city: '', district: '' }
    };
    var regionCascader = null;
    var storeInited = false;

    function getRegionTree() {
      if (global.MdmProxyRegionPicker && typeof global.MdmProxyRegionPicker.toCascaderTree === 'function') {
        return global.MdmProxyRegionPicker.toCascaderTree();
      }
      if (global.RegionCascader && global.RegionCascader.REGION_TREE) {
        return global.RegionCascader.REGION_TREE;
      }
      return {};
    }

    function resolveRegionId(parts) {
      parts = parts || {};
      if (!parts.province || !parts.city || !parts.district) return '';
      if (global.MdmProxyRegionPicker && typeof global.MdmProxyRegionPicker.findIdByNamePath === 'function') {
        return global.MdmProxyRegionPicker.findIdByNamePath(parts.province, parts.city, parts.district) || '';
      }
      return '';
    }

    function ensureRegionCascader() {
      if (regionCascader || !opts.regionMount || !global.RegionCascader) return;
      regionCascader = global.RegionCascader.create({
        mount: opts.regionMount,
        id: opts.regionCascaderId || 'ptsSaleRegionFilter',
        inline: true,
        width: '280px',
        placeholder: '请选择到区',
        requireDistrict: true,
        regionTree: getRegionTree(),
        onChange: function (value, parts) {
          state.regionPath = value || '';
          state.regionParts = parts || { province: '', city: '', district: '' };
          state.regionId = resolveRegionId(state.regionParts);
          if (typeof opts.onChange === 'function') opts.onChange();
        }
      });
    }

    function ensureStoreSelect() {
      if (!opts.storeInput || !opts.storeDropdown) return;
      fillStoreSearchSelect(opts.storeInput, opts.storeDropdown);
      if (!storeInited && typeof global.initCustomSelect === 'function') {
        global.initCustomSelect(opts.storeInput.id, opts.storeDropdown.id);
        storeInited = true;
        opts.storeInput.addEventListener('change', function () {
          if (typeof opts.onChange === 'function') opts.onChange();
        });
      }
    }

    function syncUi() {
      var type = (opts.typeSelect && opts.typeSelect.value) || '';
      var showRegion = type === 'region';
      var showStore = type === 'store';
      if (opts.regionGroup) {
        opts.regionGroup.hidden = !showRegion;
        opts.regionGroup.style.display = showRegion ? 'flex' : 'none';
      }
      if (opts.storeGroup) {
        opts.storeGroup.hidden = !showStore;
        opts.storeGroup.style.display = showStore ? 'flex' : 'none';
      }
      if (showRegion) ensureRegionCascader();
      if (showStore) ensureStoreSelect();
    }

    function getState() {
      var storeId = '';
      if (opts.storeInput) {
        storeId = opts.storeInput.dataset.value || '';
      }
      return {
        type: (opts.typeSelect && opts.typeSelect.value) || '',
        storeId: storeId,
        regionId: state.regionId,
        regionPath: state.regionPath,
        regionParts: {
          province: state.regionParts.province || '',
          city: state.regionParts.city || '',
          district: state.regionParts.district || ''
        },
        regions: state.regionId ? (function () {
          var m = {};
          m[state.regionId] = 1;
          return m;
        })() : {}
      };
    }

    function reset() {
      state.regionId = '';
      state.regionPath = '';
      state.regionParts = { province: '', city: '', district: '' };
      if (opts.typeSelect) opts.typeSelect.value = '';
      if (regionCascader) regionCascader.reset();
      if (opts.storeInput) {
        opts.storeInput.value = '';
        opts.storeInput.dataset.value = '';
      }
      if (opts.storeDropdown) {
        opts.storeDropdown.querySelectorAll('.select-option').forEach(function (option) {
          option.style.display = 'block';
        });
      }
      fillStoreSearchSelect(opts.storeInput, opts.storeDropdown);
      syncUi();
    }

    if (opts.typeSelect) {
      opts.typeSelect.addEventListener('change', function () {
        var type = opts.typeSelect.value || '';
        if (type !== 'region') {
          state.regionId = '';
          state.regionPath = '';
          state.regionParts = { province: '', city: '', district: '' };
          if (regionCascader) regionCascader.reset();
        }
        if (type !== 'store' && opts.storeInput) {
          opts.storeInput.value = '';
          opts.storeInput.dataset.value = '';
        }
        syncUi();
        if (typeof opts.onChange === 'function') opts.onChange();
      });
    }

    syncUi();
    return { getState: getState, reset: reset, syncUi: syncUi };
  }

  /** @deprecated 保留兼容 */
  function fillStoreSelect(selectEl) {
    if (!selectEl) return;
    var keep = selectEl.value || '';
    var options = '<option value="">全部</option>';
    var stores = [];
    if (global.MdmProxyStorePicker && typeof global.MdmProxyStorePicker.listAll === 'function') {
      stores = global.MdmProxyStorePicker.listAll();
    }
    options += stores.map(function (s) {
      return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>';
    }).join('');
    selectEl.innerHTML = options;
    if (keep) selectEl.value = keep;
  }

  function productHaystack(item) {
    var scope = item.productScope || {};
    var parts = [];
    (scope.products || []).forEach(function (p) {
      parts.push(String(p.id || ''), String(p.name || ''), String(p.code || ''));
    });
    (scope.categories || []).forEach(function (c) {
      parts.push(String(c.id || ''), String(c.name || ''));
    });
    return parts.join(' ').toLowerCase();
  }

  function matchProductFilter(item, keyword) {
    var kw = String(keyword || '').trim().toLowerCase();
    if (!kw) return true;
    var scope = item.productScope || {};
    var type = scope.type || 'all';
    if (productHaystack(item).indexOf(kw) >= 0) return true;

    if (type === 'all' || type === 'exclude_product' || type === 'exclude_category') {
      var catalog = [];
      if (global.MdmProductCatalog && typeof global.MdmProductCatalog.getScopeProducts === 'function') {
        catalog = global.MdmProductCatalog.getScopeProducts();
      }
      var hit = catalog.some(function (p) {
        var code = String(p.id || '').toLowerCase();
        var name = String(p.name || '').toLowerCase();
        var skus = (p.skus || []).map(function (s) {
          return String(s.code || '').toLowerCase();
        }).join(' ');
        return code.indexOf(kw) >= 0 || name.indexOf(kw) >= 0 || skus.indexOf(kw) >= 0;
      });
      if (!hit) return false;
      if (type === 'all') return true;
      if (type === 'exclude_product') {
        var excluded = (scope.products || []).some(function (p) {
          var id = String(p.id || '').toLowerCase();
          var name = String(p.name || '').toLowerCase();
          return id.indexOf(kw) >= 0 || name.indexOf(kw) >= 0;
        });
        return !excluded;
      }
      if (type === 'exclude_category') {
        var excludedCat = (scope.categories || []).some(function (c) {
          return String(c.id || '').toLowerCase().indexOf(kw) >= 0 ||
            String(c.name || '').toLowerCase().indexOf(kw) >= 0;
        });
        return !excludedCat;
      }
    }
    return false;
  }

  global.MdmMemberPointsRuleListFilter = {
    fillStoreSelect: fillStoreSelect,
    fillStoreSearchSelect: fillStoreSearchSelect,
    matchStoreFilter: matchStoreFilter,
    matchSaleScopeFilter: matchSaleScopeFilter,
    matchProductFilter: matchProductFilter,
    bindSaleScopeFilter: bindSaleScopeFilter,
    resolveSaleScope: resolveSaleScope
  };
})(window);
