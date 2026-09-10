/**
 * 代采商品列表 — 从商品库添加（右侧抽屉）
 */
(function () {
  var DRAWER_ID = 'mdmProxyLibraryDrawer';
  var ASSET_FALLBACK = '../user-app/assets/restock/product-leaf.svg';

  var drawerState = {
    category: 'all',
    keyword: '',
    selected: {},
    page: 1,
    pageSize: 20
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
    if (!url) return ASSET_FALLBACK;
    if (/^https?:\/\//i.test(url)) return url;
    if (window.wmsPath && typeof window.wmsPath.asset === 'function') {
      return window.wmsPath.asset(String(url).replace(/^\.\.\//, ''));
    }
    return url;
  }

  function getLibrary() {
    if (window.MdmMallProductLibrary) {
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

  function isCatalogSellable(code) {
    var catalog = window.MdmProductCatalog;
    if (!catalog || typeof catalog.isSellableForDownstream !== 'function') return true;
    return catalog.isSellableForDownstream(code);
  }

  function canPickLibraryItem(item, addedCodes) {
    if (!item) return false;
    if (addedCodes[item.code]) return true;
    return !!item.onSale && isCatalogSellable(item.code);
  }

  function getVisibleProducts(addedCodes) {
    var lib = getLibrary();
    if (!lib) return [];
    var list = lib.getProducts({
      category: drawerState.category,
      keyword: drawerState.keyword
    });
    return list.filter(function (item) {
      return canPickLibraryItem(item, addedCodes);
    });
  }

  function selectedCount() {
    return Object.keys(drawerState.selected).length;
  }

  function isItemSelectable(item, addedCodes) {
    return !!(item && item.onSale && !addedCodes[item.code] && isCatalogSellable(item.code));
  }

  function clampPage(total) {
    var totalPages = Math.max(1, Math.ceil(total / drawerState.pageSize));
    if (drawerState.page > totalPages) drawerState.page = totalPages;
    if (drawerState.page < 1) drawerState.page = 1;
    return totalPages;
  }

  function getPageItems(products) {
    clampPage(products.length);
    var start = (drawerState.page - 1) * drawerState.pageSize;
    return products.slice(start, start + drawerState.pageSize);
  }

  /** 当前类目+搜索下全部页可添加商品（全选范围，不限当前页） */
  function selectableAll(products, addedCodes) {
    return (products || []).filter(function (item) {
      return isItemSelectable(item, addedCodes);
    });
  }

  function syncCheckAll(products, addedCodes) {
    var box = document.getElementById('proxyLibraryCheckAll');
    if (!box) return;
    var pickable = selectableAll(products, addedCodes);
    var selectedAll = pickable.filter(function (item) {
      return drawerState.selected[item.code];
    });
    box.disabled = pickable.length === 0;
    box.checked = pickable.length > 0 && selectedAll.length === pickable.length;
    box.indeterminate = selectedAll.length > 0 && selectedAll.length < pickable.length;
  }

  function renderPager(total) {
    var pagesEl = document.getElementById('proxyLibraryPagerPages');
    var gotoEl = document.getElementById('proxyLibraryPageGoto');
    var sizeEl = document.getElementById('proxyLibraryPageSize');
    var totalPages = clampPage(total);
    var page = drawerState.page;
    if (sizeEl && String(sizeEl.value) !== String(drawerState.pageSize)) {
      sizeEl.value = String(drawerState.pageSize);
    }
    if (gotoEl) gotoEl.value = String(page);
    if (!pagesEl) return;

    var html = '';
    html +=
      '<button type="button" class="product-pagination__btn" data-lib-nav="prev"' +
      (page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">‹</button>';

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('…');
      var start = Math.max(2, page - 2);
      var end = Math.min(totalPages - 1, page + 2);
      for (var j = start; j <= end; j++) pages.push(j);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages);
    }
    pages.forEach(function (p) {
      if (p === '…') {
        html += '<button type="button" class="product-pagination__btn" disabled>…</button>';
      } else {
        html +=
          '<button type="button" class="product-pagination__btn' +
          (p === page ? ' is-active' : '') +
          '" data-lib-page="' +
          p +
          '">' +
          p +
          '</button>';
      }
    });
    html +=
      '<button type="button" class="product-pagination__btn" data-lib-nav="next"' +
      (page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderSidebar(addedCodes) {
    var listEl = document.getElementById('proxyLibraryCatList');
    var lib = getLibrary();
    if (!listEl || !lib) return;

    var visibleAll = (lib.getAll() || []).filter(function (item) {
      return canPickLibraryItem(item, addedCodes);
    });
    var counts = { all: visibleAll.length };
    visibleAll.forEach(function (item) {
      var name = item.category || '其他';
      counts[name] = (counts[name] || 0) + 1;
    });

    var categories = lib.getCategories();
    listEl.innerHTML = categories.map(function (cat) {
      var active = (drawerState.category === 'all' && cat.name === '全部') ||
        drawerState.category === cat.name;
      var dataCat = cat.name === '全部' ? 'all' : cat.name;
      var count = dataCat === 'all' ? (counts.all || 0) : (counts[cat.name] || 0);
      return (
        '<li class="proxy-library-cat' + (active ? ' is-active' : '') + '" data-cat="' + escapeHtml(dataCat) + '">' +
        '  <span class="proxy-library-cat__name">' + escapeHtml(cat.name) + '</span>' +
        '  <span class="proxy-library-cat__count">' + count + '</span>' +
        '</li>'
      );
    }).join('');
  }

  function renderCard(item, addedCodes) {
    var added = !!addedCodes[item.code];
    var selectable = item.onSale && !added && isCatalogSellable(item.code);
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
      '    <img class="proxy-library-card__img" src="' + escapeHtml(resolveImg(item.img)) + '" alt="" onerror="this.onerror=null;this.src=\'../user-app/assets/restock/product-leaf.svg\'">' +
      '    <div class="proxy-library-card__media-tags">' +
      '      <span class="proxy-library-card__tag proxy-library-card__tag--type">实物</span>' +
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

  function renderGrid(addedCodes) {
    var gridEl = document.getElementById('proxyLibraryGrid');
    var totalEl = document.getElementById('proxyLibraryTotal');
    var countEl = document.getElementById('proxyLibrarySelectedCount');
    var confirmBtn = document.getElementById('proxyLibraryConfirm');
    if (!gridEl) return;

    var products = getVisibleProducts(addedCodes);
    var pageItems = getPageItems(products);
    if (totalEl) totalEl.textContent = '共 ' + products.length + ' 件商品';
    renderPager(products.length);
    syncCheckAll(products, addedCodes);

    if (!products.length) {
      gridEl.innerHTML = '<div class="proxy-library-drawer__empty">暂无符合条件的商品</div>';
    } else {
      gridEl.innerHTML = pageItems
        .map(function (item) {
          return renderCard(item, addedCodes);
        })
        .join('');
    }

    var count = selectedCount();
    if (countEl) countEl.textContent = '已选 ' + count + ' 件';
    if (confirmBtn) confirmBtn.disabled = count === 0;
    var wrap = document.querySelector('.proxy-library-drawer__grid-wrap');
    if (wrap) wrap.scrollTop = 0;
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
    if (!item || !item.onSale || addedCodes[code] || !isCatalogSellable(code)) return;
    if (drawerState.selected[code]) delete drawerState.selected[code];
    else drawerState.selected[code] = true;
    renderGrid(addedCodes);
  }

  function buildDrawerHtml(options) {
    options = options || {};
    var title = options.title || '从商品库添加';
    var tip = options.footerTip || '仅「售卖中」的选品库商品可加入；待售卖需审核通过后才能被关联';
    return (
      '<div class="store-drawer-backdrop proxy-library-drawer-backdrop" data-proxy-library-backdrop></div>' +
      '<aside class="store-drawer store-drawer--proxy-library proxy-library-drawer" id="' + DRAWER_ID + '" aria-label="' + escapeHtml(title) + '">' +
      '  <header class="store-drawer__header proxy-library-drawer__header">' +
      '    <h2 class="store-drawer__title">' + escapeHtml(title) + '</h2>' +
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
      '        <label class="proxy-library-drawer__checkall" for="proxyLibraryCheckAll" title="选中当前类目与搜索下全部页可添加商品">' +
      '          <input type="checkbox" id="proxyLibraryCheckAll">' +
      '          <span>全选</span>' +
      '        </label>' +
      '        <span class="proxy-library-drawer__total" id="proxyLibraryTotal">共 0 件商品</span>' +
      '      </div>' +
      '      <div class="proxy-library-drawer__grid-wrap">' +
      '        <div class="proxy-library-drawer__grid" id="proxyLibraryGrid"></div>' +
      '      </div>' +
      '      <div class="proxy-library-drawer__pager product-pagination">' +
      '        <div class="product-pagination__right">' +
      '          <select class="product-pagination__size" id="proxyLibraryPageSize" aria-label="每页条数">' +
      '            <option value="20" selected>20条/页</option>' +
      '            <option value="50">50条/页</option>' +
      '            <option value="100">100条/页</option>' +
      '          </select>' +
      '          <div class="product-pagination__pages" id="proxyLibraryPagerPages"></div>' +
      '          <label class="product-pagination__goto">' +
      '            前往' +
      '            <input id="proxyLibraryPageGoto" type="text" value="1" inputmode="numeric">' +
      '            页' +
      '          </label>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <footer class="proxy-library-drawer__footer">' +
      '    <p class="proxy-library-drawer__footer-tip">' + escapeHtml(tip) + '</p>' +
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
        drawerState.page = 1;
        renderAll(addedCodes);
      });
    }

    var catList = document.getElementById('proxyLibraryCatList');
    if (catList) {
      catList.addEventListener('click', function (e) {
        var item = e.target.closest('.proxy-library-cat[data-cat]');
        if (!item) return;
        drawerState.category = item.getAttribute('data-cat');
        drawerState.page = 1;
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

    var checkAll = document.getElementById('proxyLibraryCheckAll');
    if (checkAll) {
      checkAll.addEventListener('change', function () {
        selectableAll(getVisibleProducts(addedCodes), addedCodes).forEach(function (item) {
          if (checkAll.checked) drawerState.selected[item.code] = true;
          else delete drawerState.selected[item.code];
        });
        renderGrid(addedCodes);
      });
    }

    var sizeEl = document.getElementById('proxyLibraryPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        drawerState.pageSize = parseInt(sizeEl.value, 10) || 20;
        drawerState.page = 1;
        renderGrid(addedCodes);
      });
    }

    var pagesEl = document.getElementById('proxyLibraryPagerPages');
    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var nav = e.target.closest('[data-lib-nav]');
        var btn = e.target.closest('[data-lib-page]');
        var next = 0;
        if (nav && !nav.disabled) {
          next = drawerState.page + (nav.getAttribute('data-lib-nav') === 'next' ? 1 : -1);
        } else if (btn && !btn.disabled) {
          next = parseInt(btn.getAttribute('data-lib-page'), 10);
        }
        if (!next || next === drawerState.page) return;
        drawerState.page = next;
        renderGrid(addedCodes);
      });
    }

    var gotoEl = document.getElementById('proxyLibraryPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var total = getVisibleProducts(addedCodes).length;
        var totalPages = Math.max(1, Math.ceil(total / drawerState.pageSize));
        var next = parseInt(gotoEl.value, 10);
        if (!next) next = 1;
        if (next < 1) next = 1;
        if (next > totalPages) next = totalPages;
        drawerState.page = next;
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
          if (addedCodes[code] || !isCatalogSellable(code)) return;
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
      selected: {},
      page: 1,
      pageSize: 20
    };

    var addedCodes = options.addedCodes || {};
    document.body.insertAdjacentHTML('beforeend', buildDrawerHtml(options));
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
