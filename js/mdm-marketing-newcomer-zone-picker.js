/**
 * 新人专区 — 从选品库添加（仅电商直播 + 售卖中）
 * 用 pickId 唯一标识，避免选品库重复编码导致串选
 */
(function () {
  var DRAWER_ID = 'mdmNewcomerZonePickerDrawer';
  var ASSET_FALLBACK = '../user-app/assets/restock/product-leaf.svg';
  var CATEGORIES = ['新鲜蔬菜', '时令水果', '粮油调味', '肉禽蛋品', '酒水饮料'];

  var drawerState = {
    category: 'all',
    keyword: '',
    addedFilter: '',
    selected: {},
    productByPickId: {}
  };
  var currentAddedCodes = {};
  var eligibleCache = [];

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveImg(url) {
    if (!url) return ASSET_FALLBACK;
    if (/^https?:\/\//i.test(url)) return url;
    if (window.wmsPath && typeof window.wmsPath.asset === 'function') {
      return window.wmsPath.asset(String(url).replace(/^\.\.\//, ''));
    }
    return url;
  }

  function hasLiveChannel(item) {
    var channels = item.saleChannels;
    if (Array.isArray(channels) && channels.length) {
      return channels.indexOf('live') >= 0;
    }
    var ch = item.channel || '';
    return ch.indexOf('电商直播') >= 0;
  }

  /** 打开抽屉时构建一次，保证 pickId 稳定，避免勾选串扰 */
  function rebuildEligibleCache() {
    if (!window.MdmProductCatalog) {
      eligibleCache = [];
      drawerState.productByPickId = {};
      return eligibleCache;
    }
    var raw = window.MdmProductCatalog.getAll().filter(function (item) {
      return item.status === 'selling' && hasLiveChannel(item);
    });
    var map = {};
    eligibleCache = raw.map(function (item, index) {
      var pickId = 'pick-' + index + '-' + String(item.code || '');
      var copy = Object.assign({}, item, { _pickId: pickId });
      map[pickId] = copy;
      return copy;
    });
    drawerState.productByPickId = map;
    return eligibleCache;
  }

  function getEligibleProducts() {
    return eligibleCache;
  }

  function closeDrawer() {
    var backdrop = document.querySelector('[data-newcomer-zone-picker-backdrop]');
    var drawer = document.getElementById(DRAWER_ID);
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
    document.body.classList.remove('proxy-library-drawer-open');
  }

  function getVisibleProducts() {
    var keyword = (drawerState.keyword || '').toLowerCase();
    return getEligibleProducts().filter(function (item) {
      var added = !!currentAddedCodes[item.code];
      if (drawerState.addedFilter === 'added' && !added) return false;
      if (drawerState.addedFilter === 'not_added' && added) return false;
      if (drawerState.category !== 'all' && item.category !== drawerState.category) return false;
      if (keyword) {
        var hay = ((item.name || '') + ' ' + (item.code || '')).toLowerCase();
        if (hay.indexOf(keyword) < 0) return false;
      }
      return true;
    });
  }

  function selectedCount() {
    return Object.keys(drawerState.selected).length;
  }

  function categoryCounts(products) {
    var counts = { all: products.length };
    CATEGORIES.forEach(function (c) { counts[c] = 0; });
    products.forEach(function (item) {
      if (counts[item.category] != null) counts[item.category] += 1;
    });
    return counts;
  }

  function renderSidebar() {
    var listEl = document.getElementById('newcomerZonePickerCatList');
    if (!listEl) return;
    var base = getEligibleProducts().filter(function (item) {
      var added = !!currentAddedCodes[item.code];
      if (drawerState.addedFilter === 'added' && !added) return false;
      if (drawerState.addedFilter === 'not_added' && added) return false;
      return true;
    });
    var counts = categoryCounts(base);
    var cats = [{ name: '全部', key: 'all' }].concat(CATEGORIES.map(function (c) {
      return { name: c, key: c };
    }));

    listEl.innerHTML = cats.map(function (cat) {
      var active = drawerState.category === cat.key;
      return (
        '<li class="proxy-library-cat' + (active ? ' is-active' : '') + '" data-cat="' + escapeHtml(cat.key) + '">' +
        '  <span class="proxy-library-cat__name">' + escapeHtml(cat.name) + '</span>' +
        '  <span class="proxy-library-cat__count">' + (counts[cat.key] || 0) + '</span>' +
        '</li>'
      );
    }).join('');
  }

  function renderCard(item) {
    var pickId = item._pickId;
    var added = !!currentAddedCodes[item.code];
    var selectable = !added;
    var selected = !!drawerState.selected[pickId];
    var cls = 'proxy-library-card';
    if (added) cls += ' is-added';
    else if (selected) cls += ' is-selected';
    else if (selectable) cls += ' is-selectable';

    var statusTag = added
      ? '<span class="proxy-library-card__tag proxy-library-card__tag--added">已添加</span>'
      : '<span class="proxy-library-card__tag proxy-library-card__tag--sale">售卖中</span>';

    var checkHtml = selectable
      ? (
        '<span class="proxy-library-card__check" aria-hidden="true">' +
        '  <input type="checkbox" class="proxy-library-card__checkbox"' + (selected ? ' checked' : '') +
        ' data-pick-id="' + escapeHtml(pickId) + '">' +
        '</span>'
      )
      : '';

    return (
      '<article class="' + cls + '" data-pick-id="' + escapeHtml(pickId) + '"' + (selectable ? ' data-selectable="1"' : '') + '>' +
      '  <div class="proxy-library-card__media">' +
      checkHtml +
      '    <img class="proxy-library-card__img" src="' + escapeHtml(resolveImg(item.img)) + '" alt="" onerror="this.onerror=null;this.src=\'' + ASSET_FALLBACK + '\'">' +
      '    <div class="proxy-library-card__media-tags">' +
      '      <span class="proxy-library-card__tag proxy-library-card__tag--type">电商直播</span>' +
      statusTag +
      '    </div>' +
      '  </div>' +
      '  <div class="proxy-library-card__body">' +
      '    <h4 class="proxy-library-card__name" title="' + escapeHtml(item.name) + '">' + escapeHtml(item.name) + '</h4>' +
      '    <p class="proxy-library-card__code">' + escapeHtml(item.code) + '</p>' +
      '  </div>' +
      '</article>'
    );
  }

  function renderGrid() {
    var gridEl = document.getElementById('newcomerZonePickerGrid');
    var totalEl = document.getElementById('newcomerZonePickerTotal');
    var countEl = document.getElementById('newcomerZonePickerSelectedCount');
    var confirmBtn = document.getElementById('newcomerZonePickerConfirm');
    if (!gridEl) return;

    var products = getVisibleProducts();
    if (totalEl) totalEl.textContent = '共 ' + products.length + ' 件商品';

    if (!products.length) {
      gridEl.innerHTML = '<div class="proxy-library-drawer__empty">暂无符合条件的商品<br><span class="mkt-newcomer-zone-picker-tip">请确认选品库中存在「电商直播」渠道且「售卖中」的商品</span></div>';
    } else {
      gridEl.innerHTML = products.map(renderCard).join('');
    }

    var count = selectedCount();
    if (countEl) countEl.textContent = '已选 ' + count + ' 件';
    if (confirmBtn) confirmBtn.disabled = count === 0;
  }

  function renderAll() {
    renderSidebar();
    renderGrid();
  }

  function setSelected(pickId, on) {
    if (!pickId || currentAddedCodes[(drawerState.productByPickId[pickId] || {}).code]) return;
    if (on) drawerState.selected[pickId] = true;
    else delete drawerState.selected[pickId];
    renderGrid();
  }

  function toggleSelect(pickId) {
    if (!pickId) return;
    setSelected(pickId, !drawerState.selected[pickId]);
  }

  function buildDrawerHtml() {
    return (
      '<div class="store-drawer-backdrop proxy-library-drawer-backdrop" data-newcomer-zone-picker-backdrop></div>' +
      '<aside class="store-drawer store-drawer--proxy-library proxy-library-drawer" id="' + DRAWER_ID + '" aria-label="从选品库添加">' +
      '  <header class="store-drawer__header proxy-library-drawer__header">' +
      '    <h2 class="store-drawer__title">从选品库添加</h2>' +
      '    <button type="button" class="store-drawer__close" data-newcomer-zone-picker-close aria-label="关闭">&times;</button>' +
      '  </header>' +
      '  <div class="proxy-library-drawer__body">' +
      '    <aside class="proxy-library-drawer__sidebar">' +
      '      <div class="proxy-library-drawer__sidebar-title">商品类目</div>' +
      '      <ul class="proxy-library-cat-list" id="newcomerZonePickerCatList"></ul>' +
      '    </aside>' +
      '    <div class="proxy-library-drawer__main">' +
      '      <div class="proxy-library-drawer__toolbar mkt-newcomer-zone-picker-toolbar">' +
      '        <div class="proxy-library-drawer__search">' +
      '          <svg class="proxy-library-drawer__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '          <input type="text" class="proxy-library-drawer__search-input" id="newcomerZonePickerSearch" placeholder="搜索商品名称、编码..." autocomplete="off">' +
      '        </div>' +
      '        <label class="mkt-newcomer-zone-picker-added">' +
      '          <span>是否添加</span>' +
      '          <select id="newcomerZonePickerAddedFilter" aria-label="是否添加">' +
      '            <option value="">全部</option>' +
      '            <option value="added">已添加</option>' +
      '            <option value="not_added">未添加</option>' +
      '          </select>' +
      '        </label>' +
      '        <span class="proxy-library-drawer__total" id="newcomerZonePickerTotal">共 0 件商品</span>' +
      '      </div>' +
      '      <div class="proxy-library-drawer__grid-wrap">' +
      '        <div class="proxy-library-drawer__grid" id="newcomerZonePickerGrid"></div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <footer class="proxy-library-drawer__footer">' +
      '    <p class="proxy-library-drawer__footer-tip">仅展示选品库中可售卖渠道含「电商直播」且状态为「售卖中」的商品</p>' +
      '    <div class="proxy-library-drawer__footer-actions">' +
      '      <span class="proxy-library-drawer__selected" id="newcomerZonePickerSelectedCount">已选 0 件</span>' +
      '      <button type="button" class="erp-btn" data-newcomer-zone-picker-cancel>取消</button>' +
      '      <button type="button" class="erp-btn erp-btn--primary" id="newcomerZonePickerConfirm" data-newcomer-zone-picker-confirm disabled>确认添加</button>' +
      '    </div>' +
      '  </footer>' +
      '</aside>'
    );
  }

  function bindDrawerEvents(onConfirm) {
    var backdrop = document.querySelector('[data-newcomer-zone-picker-backdrop]');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    document.querySelectorAll('[data-newcomer-zone-picker-close], [data-newcomer-zone-picker-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeDrawer);
    });

    var searchEl = document.getElementById('newcomerZonePickerSearch');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        drawerState.keyword = searchEl.value.trim();
        renderAll();
      });
    }

    var addedFilterEl = document.getElementById('newcomerZonePickerAddedFilter');
    if (addedFilterEl) {
      addedFilterEl.addEventListener('change', function () {
        drawerState.addedFilter = addedFilterEl.value || '';
        renderAll();
      });
    }

    var catList = document.getElementById('newcomerZonePickerCatList');
    if (catList) {
      catList.addEventListener('click', function (e) {
        var item = e.target.closest('.proxy-library-cat[data-cat]');
        if (!item) return;
        drawerState.category = item.getAttribute('data-cat');
        renderAll();
      });
    }

    var gridEl = document.getElementById('newcomerZonePickerGrid');
    if (gridEl) {
      gridEl.addEventListener('click', function (e) {
        var checkbox = e.target.closest('.proxy-library-card__checkbox');
        if (checkbox) {
          e.preventDefault();
          e.stopPropagation();
          toggleSelect(checkbox.getAttribute('data-pick-id'));
          return;
        }
        if (e.target.closest('.proxy-library-card__check')) {
          var checkInput = e.target.closest('.proxy-library-card__check').querySelector('.proxy-library-card__checkbox');
          if (checkInput) {
            e.preventDefault();
            e.stopPropagation();
            toggleSelect(checkInput.getAttribute('data-pick-id'));
          }
          return;
        }
        var card = e.target.closest('.proxy-library-card[data-selectable="1"]');
        if (!card) return;
        toggleSelect(card.getAttribute('data-pick-id'));
      });
    }

    var confirmBtn = document.getElementById('newcomerZonePickerConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var pickIds = Object.keys(drawerState.selected);
        if (!pickIds.length) {
          if (typeof showToast === 'function') showToast('请先勾选要添加的商品', 'warning');
          return;
        }
        var picked = [];
        var seenCode = {};
        pickIds.forEach(function (pickId) {
          var product = drawerState.productByPickId[pickId];
          if (!product || !product.code || seenCode[product.code]) return;
          seenCode[product.code] = true;
          picked.push(product);
        });
        if (!picked.length) {
          if (typeof showToast === 'function') showToast('未获取到勾选商品，请重试', 'warning');
          return;
        }
        closeDrawer();
        if (typeof onConfirm === 'function') onConfirm(picked);
      });
    }
  }

  function openDrawer(options) {
    options = options || {};
    closeDrawer();

    if (!window.MdmProductCatalog) {
      if (typeof showToast === 'function') showToast('选品库数据未加载', 'warning');
      return;
    }

    currentAddedCodes = options.addedCodes || {};
    drawerState = {
      category: 'all',
      keyword: '',
      addedFilter: '',
      selected: {},
      productByPickId: {}
    };
    rebuildEligibleCache();

    document.body.insertAdjacentHTML('beforeend', buildDrawerHtml());
    document.body.classList.add('proxy-library-drawer-open');

    bindDrawerEvents(options.onConfirm);
    renderAll();

    var searchEl = document.getElementById('newcomerZonePickerSearch');
    if (searchEl) searchEl.focus();
  }

  window.MdmNewcomerZonePicker = {
    open: openDrawer,
    close: closeDrawer
  };
})();
