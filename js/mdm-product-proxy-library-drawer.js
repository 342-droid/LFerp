/**
 * 代采商品列表 — 从商品库添加（右侧抽屉）
 */
(function () {
  var DRAWER_ID = 'mdmProxyLibraryDrawer';

  var drawerState = {
    category: 'all',
    keyword: '',
    selected: {}
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveImg(url) {
    if (!url) return '../user-app/assets/restock/product-leaf.svg';
    if (window.wmsPath && typeof window.wmsPath.asset === 'function') {
      return window.wmsPath.asset(String(url).replace(/^\.\.\//, ''));
    }
    return url;
  }

  function getLibrary() {
    if (window.MdmMallProductLibrary) {
      if (typeof window.MdmMallProductLibrary.reload === 'function') {
        window.MdmMallProductLibrary.reload();
      }
      return window.MdmMallProductLibrary;
    }
    return null;
  }

  function closeDrawer() {
    var backdrop = document.querySelector('[data-proxy-library-backdrop]');
    var drawer = document.getElementById(DRAWER_ID);
    if (backdrop) backdrop.remove();
    if (drawer) drawer.remove();
    document.body.classList.remove('proxy-library-drawer-open');
  }

  function getVisibleProducts(addedCodes) {
    var lib = getLibrary();
    if (!lib) return [];
    var list = lib.getProducts({
      category: drawerState.category,
      keyword: drawerState.keyword
    });
    return list.filter(function (item) {
      return item.onSale || !!addedCodes[item.code];
    });
  }

  function selectedCount() {
    return Object.keys(drawerState.selected).length;
  }

  function renderSidebar(addedCodes) {
    var listEl = document.getElementById('proxyLibraryCatList');
    var lib = getLibrary();
    if (!listEl || !lib) return;

    var categories = lib.getCategories();
    listEl.innerHTML = categories.map(function (cat) {
      var active = (drawerState.category === 'all' && cat.name === '全部') ||
        drawerState.category === cat.name;
      var dataCat = cat.name === '全部' ? 'all' : cat.name;
      return (
        '<li class="proxy-library-cat' + (active ? ' is-active' : '') + '" data-cat="' + escapeHtml(dataCat) + '">' +
        '  <span class="proxy-library-cat__name">' + escapeHtml(cat.name) + '</span>' +
        '  <span class="proxy-library-cat__count">' + cat.count + '</span>' +
        '</li>'
      );
    }).join('');
  }

  function renderCard(item, addedCodes) {
    var added = !!addedCodes[item.code];
    var selectable = item.onSale && !added;
    var selected = !!drawerState.selected[item.code];
    var cls = 'proxy-library-card';
    if (added) cls += ' is-added';
    else if (selected) cls += ' is-selected';
    else if (selectable) cls += ' is-selectable';

    var statusTag = added
      ? '<span class="proxy-library-card__tag proxy-library-card__tag--added">已添加</span>'
      : '<span class="proxy-library-card__tag proxy-library-card__tag--sale">在售</span>';

    var checkHtml = selectable
      ? (
        '<span class="proxy-library-card__check" aria-hidden="true">' +
        '  <input type="checkbox" class="proxy-library-card__checkbox"' + (selected ? ' checked' : '') + ' data-code="' + escapeHtml(item.code) + '">' +
        '</span>'
      )
      : '';

    return (
      '<article class="' + cls + '" data-code="' + escapeHtml(item.code) + '"' + (selectable ? ' data-selectable="1"' : '') + '>' +
      '  <div class="proxy-library-card__media">' +
      checkHtml +
      '    <img class="proxy-library-card__img" src="' + escapeHtml(resolveImg(item.img)) + '" alt="">' +
      (added ? '<div class="proxy-library-card__mask" aria-hidden="true"></div>' : '') +
      '  </div>' +
      '  <div class="proxy-library-card__body">' +
      '    <div class="proxy-library-card__tags">' +
      '      <span class="proxy-library-card__tag proxy-library-card__tag--type">实物</span>' +
      statusTag +
      '    </div>' +
      '    <h4 class="proxy-library-card__name" title="' + escapeHtml(item.name) + '">' + escapeHtml(item.name) + '</h4>' +
      '    <p class="proxy-library-card__code">' + escapeHtml(item.code) + '</p>' +
      '  </div>' +
      '</article>'
    );
  }

  function renderGrid(addedCodes) {
    var gridEl = document.getElementById('proxyLibraryGrid');
    var totalEl = document.getElementById('proxyLibraryTotal');
    var countEl = document.getElementById('proxyLibrarySelectedCount');
    var confirmBtn = document.getElementById('proxyLibraryConfirm');
    if (!gridEl) return;

    var products = getVisibleProducts(addedCodes);
    if (totalEl) totalEl.textContent = '共 ' + products.length + ' 件商品';

    if (!products.length) {
      gridEl.innerHTML = '<div class="proxy-library-drawer__empty">暂无符合条件的商品</div>';
    } else {
      gridEl.innerHTML = products.map(function (item) {
        return renderCard(item, addedCodes);
      }).join('');
    }

    var count = selectedCount();
    if (countEl) countEl.textContent = '已选 ' + count + ' 件';
    if (confirmBtn) confirmBtn.disabled = count === 0;
  }

  function renderAll(addedCodes) {
    renderSidebar(addedCodes);
    renderGrid(addedCodes);
  }

  function toggleSelect(code, addedCodes) {
    var products = getVisibleProducts(addedCodes);
    var item = null;
    for (var i = 0; i < products.length; i++) {
      if (products[i].code === code) {
        item = products[i];
        break;
      }
    }
    if (!item || !item.onSale || addedCodes[code]) return;
    if (drawerState.selected[code]) delete drawerState.selected[code];
    else drawerState.selected[code] = true;
    renderGrid(addedCodes);
  }

  function buildDrawerHtml() {
    return (
      '<div class="store-drawer-backdrop proxy-library-drawer-backdrop" data-proxy-library-backdrop></div>' +
      '<aside class="store-drawer store-drawer--proxy-library proxy-library-drawer" id="' + DRAWER_ID + '" aria-label="从商品库添加">' +
      '  <header class="store-drawer__header proxy-library-drawer__header">' +
      '    <h2 class="store-drawer__title">从商品库添加</h2>' +
      '    <button type="button" class="store-drawer__close" data-proxy-library-close aria-label="关闭">&times;</button>' +
      '  </header>' +
      '  <div class="proxy-library-drawer__body">' +
      '    <aside class="proxy-library-drawer__sidebar">' +
      '      <div class="proxy-library-drawer__sidebar-title">商城类目</div>' +
      '      <ul class="proxy-library-cat-list" id="proxyLibraryCatList"></ul>' +
      '    </aside>' +
      '    <div class="proxy-library-drawer__main">' +
      '      <div class="proxy-library-drawer__toolbar">' +
      '        <div class="proxy-library-drawer__search">' +
      '          <svg class="proxy-library-drawer__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '          <input type="text" class="proxy-library-drawer__search-input" id="proxyLibrarySearch" placeholder="搜索商品名称、编码..." autocomplete="off">' +
      '        </div>' +
      '        <span class="proxy-library-drawer__total" id="proxyLibraryTotal">共 0 件商品</span>' +
      '      </div>' +
      '      <div class="proxy-library-drawer__grid-wrap">' +
      '        <div class="proxy-library-drawer__grid" id="proxyLibraryGrid"></div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <footer class="proxy-library-drawer__footer">' +
      '    <p class="proxy-library-drawer__footer-tip">此处仅将商品库中的商品加入商城售卖，不会修改商品库主数据</p>' +
      '    <div class="proxy-library-drawer__footer-actions">' +
      '      <span class="proxy-library-drawer__selected" id="proxyLibrarySelectedCount">已选 0 件</span>' +
      '      <button type="button" class="erp-btn" data-proxy-library-cancel>取消</button>' +
      '      <button type="button" class="erp-btn erp-btn--primary" id="proxyLibraryConfirm" data-proxy-library-confirm disabled>确认添加</button>' +
      '    </div>' +
      '  </footer>' +
      '</aside>'
    );
  }

  function bindDrawerEvents(addedCodes, onConfirm) {
    var backdrop = document.querySelector('[data-proxy-library-backdrop]');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    document.querySelectorAll('[data-proxy-library-close], [data-proxy-library-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeDrawer);
    });

    var searchEl = document.getElementById('proxyLibrarySearch');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        drawerState.keyword = searchEl.value.trim();
        renderAll(addedCodes);
      });
    }

    var catList = document.getElementById('proxyLibraryCatList');
    if (catList) {
      catList.addEventListener('click', function (e) {
        var item = e.target.closest('.proxy-library-cat[data-cat]');
        if (!item) return;
        drawerState.category = item.getAttribute('data-cat');
        renderAll(addedCodes);
      });
    }

    var gridEl = document.getElementById('proxyLibraryGrid');
    if (gridEl) {
      gridEl.addEventListener('click', function (e) {
        if (e.target.closest('.proxy-library-card__check')) return;
        var card = e.target.closest('.proxy-library-card[data-selectable="1"]');
        if (!card) return;
        toggleSelect(card.getAttribute('data-code'), addedCodes);
      });
      gridEl.addEventListener('change', function (e) {
        var checkbox = e.target.closest('.proxy-library-card__checkbox');
        if (!checkbox) return;
        var code = checkbox.getAttribute('data-code');
        if (checkbox.checked) drawerState.selected[code] = true;
        else delete drawerState.selected[code];
        renderGrid(addedCodes);
      });
    }

    var confirmBtn = document.getElementById('proxyLibraryConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var codes = Object.keys(drawerState.selected);
        if (!codes.length) return;
        var all = getLibrary() ? getLibrary().getAll() : [];
        var picked = [];
        codes.forEach(function (code) {
          for (var i = 0; i < all.length; i++) {
            if (all[i].code === code) {
              picked.push(all[i]);
              break;
            }
          }
        });
        closeDrawer();
        if (typeof onConfirm === 'function') onConfirm(picked);
      });
    }
  }

  function openDrawer(options) {
    options = options || {};
    closeDrawer();

    if (!getLibrary()) {
      if (typeof showToast === 'function') showToast('商品库数据未加载', 'warning');
      return;
    }

    drawerState = {
      category: 'all',
      keyword: '',
      selected: {}
    };

    var addedCodes = options.addedCodes || {};
    document.body.insertAdjacentHTML('beforeend', buildDrawerHtml());
    document.body.classList.add('proxy-library-drawer-open');

    bindDrawerEvents(addedCodes, options.onConfirm);
    renderAll(addedCodes);

    var searchEl = document.getElementById('proxyLibrarySearch');
    if (searchEl) searchEl.focus();
  }

  window.MdmProxyLibraryDrawer = {
    open: openDrawer,
    close: closeDrawer
  };
})();
