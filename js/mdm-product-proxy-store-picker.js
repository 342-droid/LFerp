/**
 * 代采商品 — 门店选择器
 */
(function () {
  var REGIONS = [
    { id: 'all', name: '全部' },
    { id: '110000', name: '北京市' },
    { id: '120000', name: '天津市' },
    { id: '130000', name: '河北省' },
    { id: '140000', name: '山西省' },
    { id: '150000', name: '内蒙古自治区' },
    { id: '210000', name: '辽宁省' },
    { id: '220000', name: '吉林省' },
    { id: '230000', name: '黑龙江省' },
    { id: '310000', name: '上海市' },
    { id: '320000', name: '江苏省' },
    { id: '330000', name: '浙江省' },
    { id: '340000', name: '安徽省' },
    { id: '350000', name: '福建省' },
    { id: '360000', name: '江西省' },
    { id: '370000', name: '山东省' },
    { id: '410000', name: '河南省' },
    { id: '420000', name: '湖北省' },
    { id: '430000', name: '湖南省' },
    { id: '440000', name: '广东省' },
    { id: '450000', name: '广西壮族自治区' },
    { id: '460000', name: '海南省' },
    { id: '500000', name: '重庆市' },
    { id: '510000', name: '四川省' },
    { id: '520000', name: '贵州省' },
    { id: '530000', name: '云南省' },
    { id: '540000', name: '西藏自治区' },
    { id: '610000', name: '陕西省' },
    { id: '620000', name: '甘肃省' },
    { id: '630000', name: '青海省' },
    { id: '640000', name: '宁夏回族自治区' },
    { id: '650000', name: '新疆维吾尔自治区' }
  ];

  var STORES = [
    { id: 'st-001', name: '振宁十足', address: '盈丰街道振宁路898号', regionId: '330000', customerCount: 0 },
    { id: 'st-002', name: '萧山万达店', address: '北干街道金城路987号萧山万达广场', regionId: '330000', customerCount: 3 },
    { id: 'st-003', name: '西湖文三路店', address: '文三路478号华星时代广场', regionId: '330000', customerCount: 12 },
    { id: 'st-004', name: '滨江网商路店', address: '网商路699号网易大厦附近', regionId: '330000', customerCount: 5 },
    { id: 'st-005', name: '朝阳大悦城店', address: '朝阳北路101号朝阳大悦城B1', regionId: '110000', customerCount: 8 },
    { id: 'st-006', name: '海淀中关村店', address: '中关村大街27号中关村广场', regionId: '110000', customerCount: 15 },
    { id: 'st-007', name: '浦东陆家嘴店', address: '陆家嘴环路1000号恒生银行大厦', regionId: '310000', customerCount: 6 },
    { id: 'st-008', name: '静安南京西路店', address: '南京西路1266号恒隆广场', regionId: '310000', customerCount: 9 },
    { id: 'st-009', name: '天河城店', address: '天河路208号天河城购物中心', regionId: '440000', customerCount: 11 },
    { id: 'st-010', name: '南山科技园店', address: '科技园南区科苑南路2666号', regionId: '440000', customerCount: 4 },
    { id: 'st-011', name: '武侯祠店', address: '武侯祠大街231号', regionId: '510000', customerCount: 2 },
    { id: 'st-012', name: '锦江春熙路店', address: '春熙路步行街88号', regionId: '510000', customerCount: 7 },
    { id: 'st-013', name: '江汉路店', address: '江汉路步行街168号', regionId: '420000', customerCount: 0 },
    { id: 'st-014', name: '洪山光谷店', address: '珞喻路766号世界城广场', regionId: '420000', customerCount: 3 },
    { id: 'st-015', name: '鼓楼湖南路店', address: '湖南路18号', regionId: '320000', customerCount: 5 },
    { id: 'st-016', name: '工业园金鸡湖店', address: '苏州工业园区旺墩路268号', regionId: '320000', customerCount: 1 },
    { id: 'st-017', name: '和平路店', address: '和平路116号', regionId: '120000', customerCount: 0 },
    { id: 'st-018', name: '河西陈塘庄店', address: '陈塘庄街道黑牛城道33号', regionId: '120000', customerCount: 2 },
    { id: 'st-019', name: '裕华万达店', address: '裕华区建华南大街136号', regionId: '130000', customerCount: 4 },
    { id: 'st-020', name: '长安勒泰店', address: '长安区中山东路39号勒泰中心', regionId: '130000', customerCount: 6 }
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cloneSelected(map) {
    var out = {};
    Object.keys(map || {}).forEach(function (k) { out[k] = true; });
    return out;
  }

  function getStoreById(id) {
    for (var i = 0; i < STORES.length; i++) {
      if (STORES[i].id === id) return STORES[i];
    }
    return null;
  }

  function filterStores(regionId, keyword) {
    var kw = String(keyword || '').trim().toLowerCase();
    return STORES.filter(function (store) {
      if (regionId && regionId !== 'all' && store.regionId !== regionId) return false;
      if (!kw) return true;
      return store.name.toLowerCase().indexOf(kw) >= 0 ||
        store.address.toLowerCase().indexOf(kw) >= 0;
    });
  }

  function selectedCount(selected) {
    return Object.keys(selected || {}).length;
  }

  function renderRegionList(activeId) {
    return REGIONS.map(function (region) {
      var active = region.id === activeId ? ' is-active' : '';
      var arrow = region.id === 'all' ? '' : '<span class="proxy-store-picker__region-arrow">›</span>';
      return (
        '<button type="button" class="proxy-store-picker__region' + active + '" data-region-id="' + region.id + '">' +
        '  <span class="proxy-store-picker__region-name">' + escapeHtml(region.name) + '</span>' +
        arrow +
        '</button>'
      );
    }).join('');
  }

  function renderStoreRows(stores, selected, single) {
    if (!stores.length) {
      return '<div class="proxy-store-picker__empty">暂无匹配门店</div>';
    }
    var inputType = single ? 'radio' : 'checkbox';
    var nameAttr = single ? ' name="proxyStorePickerSingle"' : '';
    return stores.map(function (store) {
      var checked = !!selected[store.id];
      return (
        '<label class="proxy-store-picker__row' + (checked ? ' is-checked' : '') + '" data-store-id="' + store.id + '">' +
        '  <input type="' + inputType + '" class="proxy-store-picker__check" data-store-id="' + store.id + '"' + nameAttr + (checked ? ' checked' : '') + '>' +
        '  <span class="proxy-store-picker__row-main">' +
        '    <span class="proxy-store-picker__store-name">' + escapeHtml(store.name) + '</span>' +
        '    <span class="proxy-store-picker__store-address">' + escapeHtml(store.address) + '</span>' +
        '  </span>' +
        '  <span class="proxy-store-picker__store-customers">' + store.customerCount + ' 个客户</span>' +
        '</label>'
      );
    }).join('');
  }

  function updateSelectAllState(backdrop, visibleStores, selected) {
    var selectAll = backdrop.querySelector('#proxyStorePickerSelectAll');
    if (!selectAll) return;
    if (!visibleStores.length) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
      return;
    }
    var picked = 0;
    visibleStores.forEach(function (store) {
      if (selected[store.id]) picked += 1;
    });
    selectAll.checked = picked === visibleStores.length;
    selectAll.indeterminate = picked > 0 && picked < visibleStores.length;
  }

  function updateCounts(backdrop, selected) {
    var count = selectedCount(selected);
    var barCount = backdrop.querySelector('#proxyStorePickerBarCount');
    var footerCount = backdrop.querySelector('#proxyStorePickerFooterCount');
    if (barCount) barCount.textContent = '已选 ' + count + ' 家门店';
    if (footerCount) footerCount.textContent = '共选 ' + count + ' 家门店';
  }

  function openStorePicker(options) {
    options = options || {};
    var selected = cloneSelected(options.selected || {});
    var flatFilter = !!options.flatFilter;
    var single = !!options.single;
    var catalog = (options.extraStores || []).concat(STORES);
    var state = {
      regionId: 'all',
      keyword: ''
    };

    function getStoreFromCatalog(id) {
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].id === id) return catalog[i];
      }
      return getStoreById(id);
    }

    function filterCatalog(regionId, keyword) {
      var kw = String(keyword || '').trim().toLowerCase();
      return catalog.filter(function (store) {
        if (regionId && regionId !== 'all' && store.regionId !== regionId) return false;
        if (!kw) return true;
        return store.name.toLowerCase().indexOf(kw) >= 0 ||
          store.address.toLowerCase().indexOf(kw) >= 0;
      });
    }

    var regionSelectHtml = REGIONS.map(function (region) {
      return '<option value="' + region.id + '">' + escapeHtml(region.name) + '</option>';
    }).join('');

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop proxy-store-picker-backdrop';
    backdrop.setAttribute('data-proxy-store-picker', '1');
    backdrop.innerHTML = flatFilter
      ? (
        '<div class="erp-modal proxy-store-picker-modal proxy-store-picker-modal--compact' + (single ? ' proxy-store-picker-modal--single' : '') + '">' +
        '  <div class="erp-modal__header">' +
        '    <h2 class="erp-modal__title">选择门店</h2>' +
        '    <div class="erp-modal__header-actions">' +
        '      <button type="button" class="erp-modal__header-btn" data-store-close aria-label="关闭">&times;</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-modal__body proxy-store-picker__body">' +
        '    <div class="proxy-store-picker__main proxy-store-picker__main--flat">' +
        '      <div class="proxy-store-picker__toolbar proxy-store-picker__toolbar--flat">' +
        '        <select class="proxy-store-picker__region-select" id="proxyStorePickerRegionSelect">' + regionSelectHtml + '</select>' +
        '        <div class="proxy-store-picker__search">' +
        '          <span class="proxy-store-picker__search-icon" aria-hidden="true">⌕</span>' +
        '          <input type="text" class="proxy-store-picker__search-input" id="proxyStorePickerSearch" placeholder="搜索门店名称..." autocomplete="off">' +
        '        </div>' +
        '        <label class="proxy-store-picker__select-all">' +
        '          <input type="checkbox" class="proxy-store-picker__select-all-input" id="proxyStorePickerSelectAll">' +
        '          <span>全选</span>' +
        '        </label>' +
        '      </div>' +
        '      <div class="proxy-store-picker__bar">' +
        '        <span class="proxy-store-picker__bar-count" id="proxyStorePickerBarCount">已选 0 家门店</span>' +
        '        <button type="button" class="proxy-store-picker__bar-clear" id="proxyStorePickerClear">清空</button>' +
        '      </div>' +
        '      <div class="proxy-store-picker__list" id="proxyStorePickerList"></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-modal__footer proxy-store-picker__footer">' +
        '    <span class="proxy-store-picker__footer-count" id="proxyStorePickerFooterCount">共选 0 家门店</span>' +
        '    <div class="proxy-store-picker__footer-actions">' +
        '      <button type="button" class="erp-btn" data-store-cancel>取消</button>' +
        '      <button type="button" class="erp-btn erp-btn--primary" data-store-ok>确定</button>' +
        '    </div>' +
        '  </div>' +
        '</div>'
      )
      : (
        '<div class="erp-modal proxy-store-picker-modal' + (options.compactHeight ? ' proxy-store-picker-modal--compact' : '') + (single ? ' proxy-store-picker-modal--single' : '') + '">' +
        '  <div class="erp-modal__header">' +
        '    <h2 class="erp-modal__title">选择门店</h2>' +
        '    <div class="erp-modal__header-actions">' +
        '      <button type="button" class="erp-modal__header-btn" data-store-close aria-label="关闭">&times;</button>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-modal__body proxy-store-picker__body">' +
        '    <div class="proxy-store-picker__layout">' +
        '      <aside class="proxy-store-picker__sidebar">' +
        '        <div class="proxy-store-picker__regions" id="proxyStorePickerRegions"></div>' +
        '      </aside>' +
        '      <div class="proxy-store-picker__main">' +
        '        <div class="proxy-store-picker__toolbar">' +
        '          <div class="proxy-store-picker__search">' +
        '            <span class="proxy-store-picker__search-icon" aria-hidden="true">⌕</span>' +
        '            <input type="text" class="proxy-store-picker__search-input" id="proxyStorePickerSearch" placeholder="搜索门店名称..." autocomplete="off">' +
        '          </div>' +
        '          <label class="proxy-store-picker__select-all">' +
        '            <input type="checkbox" class="proxy-store-picker__select-all-input" id="proxyStorePickerSelectAll">' +
        '            <span>全选</span>' +
        '          </label>' +
        '        </div>' +
        '        <div class="proxy-store-picker__bar">' +
        '          <span class="proxy-store-picker__bar-count" id="proxyStorePickerBarCount">已选 0 家门店</span>' +
        '          <button type="button" class="proxy-store-picker__bar-clear" id="proxyStorePickerClear">清空</button>' +
        '        </div>' +
        '        <div class="proxy-store-picker__list" id="proxyStorePickerList"></div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="erp-modal__footer proxy-store-picker__footer">' +
        '    <span class="proxy-store-picker__footer-count" id="proxyStorePickerFooterCount">共选 0 家门店</span>' +
        '    <div class="proxy-store-picker__footer-actions">' +
        '      <button type="button" class="erp-btn" data-store-cancel>取消</button>' +
        '      <button type="button" class="erp-btn erp-btn--primary" data-store-ok>确定</button>' +
        '    </div>' +
        '  </div>' +
        '</div>'
      );

    function close() {
      backdrop.remove();
    }

    function getVisibleStores() {
      return filterCatalog(state.regionId, state.keyword);
    }

    function refresh() {
      var regionsEl = backdrop.querySelector('#proxyStorePickerRegions');
      var listEl = backdrop.querySelector('#proxyStorePickerList');
      var visibleStores = getVisibleStores();
      if (regionsEl) regionsEl.innerHTML = renderRegionList(state.regionId);
      if (listEl) listEl.innerHTML = renderStoreRows(visibleStores, selected, single);
      var regionSelect = backdrop.querySelector('#proxyStorePickerRegionSelect');
      if (regionSelect) regionSelect.value = state.regionId;
      updateSelectAllState(backdrop, visibleStores, selected);
      updateCounts(backdrop, selected);
    }

    function toggleStore(id, checked) {
      if (single) {
        selected = {};
        if (checked) selected[id] = true;
        refresh();
        return;
      }
      if (checked) selected[id] = true;
      else delete selected[id];
      refresh();
    }

    function toggleAllVisible(checked) {
      getVisibleStores().forEach(function (store) {
        if (checked) selected[store.id] = true;
        else delete selected[store.id];
      });
      refresh();
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });
    backdrop.querySelector('[data-store-close]').addEventListener('click', close);
    backdrop.querySelector('[data-store-cancel]').addEventListener('click', close);
    backdrop.querySelector('[data-store-ok]').addEventListener('click', function () {
      var ids = Object.keys(selected);
      if (single && !ids.length) {
        if (typeof showToast === 'function') showToast('请选择门店', 'error');
        return;
      }
      if (typeof options.onConfirm === 'function') {
        var stores = ids.map(getStoreFromCatalog).filter(Boolean);
        options.onConfirm(cloneSelected(selected), stores);
      }
      close();
    });

    backdrop.querySelector('#proxyStorePickerClear').addEventListener('click', function () {
      selected = {};
      refresh();
    });

    backdrop.querySelector('#proxyStorePickerSearch').addEventListener('input', function (e) {
      state.keyword = e.target.value;
      refresh();
    });

    var regionSelectEl = backdrop.querySelector('#proxyStorePickerRegionSelect');
    if (regionSelectEl) {
      regionSelectEl.addEventListener('change', function (e) {
        state.regionId = e.target.value || 'all';
        refresh();
      });
    }

    backdrop.addEventListener('change', function (e) {
      if (e.target.id === 'proxyStorePickerSelectAll') {
        toggleAllVisible(e.target.checked);
        return;
      }
      var checkbox = e.target.closest('.proxy-store-picker__check[data-store-id]');
      if (checkbox) {
        toggleStore(checkbox.getAttribute('data-store-id'), checkbox.checked);
      }
    });

    backdrop.addEventListener('click', function (e) {
      var regionBtn = e.target.closest('[data-region-id]');
      if (regionBtn && regionBtn.classList.contains('proxy-store-picker__region')) {
        state.regionId = regionBtn.getAttribute('data-region-id');
        refresh();
      }
    });

    document.body.appendChild(backdrop);
    refresh();
  }

  window.MdmProxyStorePicker = {
    open: openStorePicker,
    cloneSelected: cloneSelected,
    count: selectedCount,
    getStoreById: getStoreById,
    listAll: function () {
      return STORES.map(function (s) {
        return { id: s.id, name: s.name, address: s.address, regionId: s.regionId };
      });
    }
  };
})();
