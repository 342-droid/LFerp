/**
 * 营销活动 — 秒杀创建/编辑/查看（两步 Tab）
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingSeckillStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var mode = 'create';
  var tab = 'info';
  var working = null;
  var prodPage = 1;
  var prodPageSize = 20;
  var expandedIds = {};
  var prodFilter = { code: '', name: '', category: '' };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function qs(name) {
    return new URLSearchParams(window.location.search || '').get(name) || '';
  }

  function listHref() {
    return wp.page('mdm_marketing_seckill.html');
  }

  function productHref(productId) {
    var base = wp.page('mdm_marketing_seckill_product.html');
    return (
      base +
      (base.indexOf('?') >= 0 ? '&' : '?') +
      'id=' +
      encodeURIComponent(productId) +
      '&mode=' +
      encodeURIComponent(mode)
    );
  }

  function getCheckedRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function setRadio(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
      el.checked = el.value === value;
    });
  }

  function cloneMap(map) {
    return Object.assign({}, map || {});
  }

  function formatPrice(n) {
    if (n == null || n === '') return '—';
    var v = Number(n);
    if (isNaN(v)) return '—';
    return '¥' + v.toFixed(2);
  }

  function formatAddedAt(s) {
    if (!s) return '—';
    return String(s).slice(0, 16);
  }

  function isReadonly() {
    return mode === 'view';
  }

  function toDatetimeLocal(val) {
    if (!val) return '';
    var s = String(val).replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return '';
  }

  function syncNameCount() {
    var input = document.getElementById('skName');
    var count = document.getElementById('skNameCount');
    if (count) count.textContent = String((input && input.value) || '').length;
  }

  function syncTimeModeUi() {
    var forever = getCheckedRadio('skTimeMode') === 'forever';
    var end = document.getElementById('skEndAt');
    var sep = document.getElementById('skTimeSep');
    if (end) {
      end.hidden = forever;
      if (forever) end.value = '';
    }
    if (sep) sep.hidden = forever;
  }

  function syncLimitUi() {
    var type = getCheckedRadio('skLimitType') || 'none';
    var wrap = document.getElementById('skLimitQtyWrap');
    if (wrap) wrap.hidden = type === 'none';
  }

  function getSaleStoreCount() {
    if (window.MdmProxyStorePicker && typeof window.MdmProxyStorePicker.count === 'function') {
      return window.MdmProxyStorePicker.count((working && working.saleStores) || {});
    }
    return Object.keys((working && working.saleStores) || {}).length;
  }

  function renderSaleRegionSummary() {
    var list = (working && working.saleRegionSummary) || [];
    return list
      .map(function (item) {
        return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label || item.id || '') + '</span>';
      })
      .join('');
  }

  function syncSaleScopeUi() {
    var scope = getCheckedRadio('skSaleScope') || 'all';
    var regionPanel = document.getElementById('skSaleScopeRegion');
    var storePanel = document.getElementById('skSaleScopeStore');
    if (regionPanel) regionPanel.hidden = scope !== 'region';
    if (storePanel) storePanel.hidden = scope !== 'store';
    var tagsEl = document.getElementById('skSaleScopeTags');
    if (tagsEl) tagsEl.innerHTML = renderSaleRegionSummary();
    var count = getSaleStoreCount();
    var countEl = document.getElementById('skSaleScopeStoreCount');
    if (countEl) {
      countEl.hidden = !count;
      countEl.textContent = '已选择 ' + count + ' 个门店';
    }
  }

  function syncPortScopeUi() {
    var scope = getCheckedRadio('skPortScope') || 'all';
    var list = document.getElementById('skPortList');
    if (list) list.hidden = scope !== 'custom';
  }

  function syncUnqualifiedUi() {
    var row = document.getElementById('skUnqualifiedRow');
    if (row) row.hidden = getCheckedRadio('skBuyLimit') !== 'neu';
  }

  function setSalePorts(ports) {
    var selected = Array.isArray(ports) ? ports : [];
    document.querySelectorAll('#skPortList [data-field="salePort"]').forEach(function (el) {
      el.checked = selected.indexOf(el.value) >= 0;
    });
  }

  function getSalePorts() {
    var ports = [];
    document.querySelectorAll('#skPortList [data-field="salePort"]:checked').forEach(function (el) {
      ports.push(el.value);
    });
    return ports;
  }

  function setScenes(scenes) {
    var selected = Array.isArray(scenes) ? scenes : [];
    document.querySelectorAll('#skSceneRow [data-field="scene"]').forEach(function (el) {
      el.checked = selected.indexOf(el.value) >= 0;
    });
  }

  function getScenes() {
    var scenes = [];
    document.querySelectorAll('#skSceneRow [data-field="scene"]:checked').forEach(function (el) {
      scenes.push(el.value);
    });
    return scenes;
  }

  function fillCategoryFilter() {}

  function collectInfo() {
    if (!working) working = Store.emptyItem();
    working.name = ((document.getElementById('skName') || {}).value || '').trim();
    working.timeMode = getCheckedRadio('skTimeMode') || 'range';
    working.startAt = (document.getElementById('skStartAt') || {}).value || '';
    working.endAt = working.timeMode === 'forever' ? '' : (document.getElementById('skEndAt') || {}).value || '';
    working.limitType = getCheckedRadio('skLimitType') || 'none';
    working.limitQty = working.limitType === 'none' ? '' : (document.getElementById('skLimitQty') || {}).value || '';
    working.saleScope = getCheckedRadio('skSaleScope') || 'all';
    working.portScope = getCheckedRadio('skPortScope') || 'all';
    working.salePorts = getSalePorts();
    working.scenes = getScenes();
    working.buyLimit = getCheckedRadio('skBuyLimit') || 'all';
    working.unqualifiedMode = getCheckedRadio('skUnqualified') || 'deny';
    return working;
  }

  function persistWorking() {
    collectInfo();
    Store.setWorking(working);
    working = Store.getWorking();
  }

  function validateInfo() {
    collectInfo();
    if (!working.name) {
      toast('请输入活动名称', 'warning');
      return false;
    }
    if (working.name.length > 50) {
      toast('活动名称不能超过 50 个字', 'warning');
      return false;
    }
    if (working.timeMode === 'range') {
      if (!working.startAt) {
        toast('请选择活动开始时间', 'warning');
        return false;
      }
      if (!working.endAt) {
        toast('请选择活动结束时间', 'warning');
        return false;
      }
      if (working.endAt <= working.startAt) {
        toast('结束时间需晚于开始时间', 'warning');
        return false;
      }
    }
    if (working.limitType !== 'none') {
      var qty = Number(working.limitQty);
      if (isNaN(qty) || qty < 1) {
        toast('请填写限购件数', 'warning');
        return false;
      }
    }
    if (working.saleScope === 'region' && !(working.saleRegionSummary || []).length) {
      toast('请选择售卖区域', 'warning');
      return false;
    }
    if (working.saleScope === 'store' && !getSaleStoreCount()) {
      toast('请选择门店', 'warning');
      return false;
    }
    if (working.portScope === 'custom' && !working.salePorts.length) {
      toast('请至少选择一个售卖端口', 'warning');
      return false;
    }
    if (!working.scenes.length) {
      toast('请至少选择一个售卖场景', 'warning');
      return false;
    }
    return true;
  }

  function applyReadonly() {
    var main = document.getElementById('skFormMain');
    if (main) main.classList.toggle('is-readonly', isReadonly());
    document.querySelectorAll('#skTabInfo input, #skTabInfo select, #skTabInfo textarea').forEach(function (el) {
      el.disabled = isReadonly();
    });
    var addBtn = document.getElementById('skProdAddBtn');
    var toolbar = document.getElementById('skProdToolbar');
    if (addBtn) addBtn.hidden = isReadonly();
    if (toolbar) toolbar.hidden = isReadonly();
  }

  function syncFooter() {
    var cancel = document.getElementById('skFormCancel');
    var prev = document.getElementById('skFormPrev');
    var next = document.getElementById('skFormNext');
    var save = document.getElementById('skFormSave');
    var back = document.getElementById('skFormBack');
    if (isReadonly()) {
      if (cancel) cancel.hidden = true;
      if (prev) prev.hidden = true;
      if (next) next.hidden = true;
      if (save) save.hidden = true;
      if (back) back.hidden = false;
      return;
    }
    if (back) back.hidden = true;
    if (cancel) cancel.hidden = false;
    if (tab === 'info') {
      if (prev) prev.hidden = true;
      if (next) next.hidden = false;
      if (save) save.hidden = true;
    } else {
      if (prev) prev.hidden = false;
      if (next) next.hidden = true;
      if (save) save.hidden = false;
    }
  }

  function setTab(nextTab, skipValidate) {
    if (nextTab === 'products' && !isReadonly() && !skipValidate && !validateInfo()) return;
    persistWorking();
    tab = nextTab === 'products' ? 'products' : 'info';
    document.getElementById('skTabInfo').hidden = tab !== 'info';
    document.getElementById('skTabProducts').hidden = tab !== 'products';
    document.getElementById('skStepInfo').classList.toggle('active', tab === 'info');
    document.getElementById('skStepProducts').classList.toggle('active', tab === 'products');
    syncFooter();
    if (tab === 'products') renderProducts();
  }

  function fillForm() {
    if (!working) return;
    document.getElementById('skName').value = working.name || '';
    syncNameCount();
    setRadio('skTimeMode', working.timeMode || 'range');
    document.getElementById('skStartAt').value = toDatetimeLocal(working.startAt);
    document.getElementById('skEndAt').value = toDatetimeLocal(working.endAt);
    syncTimeModeUi();
    setRadio('skLimitType', working.limitType || 'none');
    document.getElementById('skLimitQty').value = working.limitQty || '';
    syncLimitUi();
    setRadio('skSaleScope', working.saleScope || 'all');
    setRadio('skPortScope', working.portScope || 'all');
    setSalePorts(working.salePorts);
    setScenes(working.scenes);
    setRadio('skBuyLimit', working.buyLimit || 'all');
    setRadio('skUnqualified', working.unqualifiedMode || 'deny');
    syncSaleScopeUi();
    syncPortScopeUi();
    syncUnqualifiedUi();
    fillCategoryFilter();
    applyReadonly();
  }

  function normalizeStatus(st) {
    if (st === 'enabled' || st === 'on_shelf' || st === 'listing') return 'enabled';
    if (st === 'disabled' || st === 'off_shelf' || st === 'delisting') return 'disabled';
    return 'draft';
  }

  function statusLabel(st) {
    var map = { draft: '草稿', enabled: '上架', disabled: '下架' };
    return map[normalizeStatus(st)] || '草稿';
  }

  function statusClass(st) {
    var n = normalizeStatus(st);
    if (n === 'enabled') return 'lf-live-badge lf-live-badge--ok';
    if (n === 'disabled') return 'lf-live-badge lf-live-badge--danger';
    return 'lf-live-badge lf-live-badge--muted';
  }

  function thumbHtml(item) {
    if (item.img) {
      return '<span class="lf-live-thumb"><img src="' + escapeHtml(item.img) + '" alt=""></span>';
    }
    var ch = String(item.name || '?').charAt(0);
    return '<span class="lf-live-thumb">' + escapeHtml(ch) + '</span>';
  }

  function skuCells(sku) {
    return (
      '<td>' +
      escapeHtml((sku && (sku.specName || sku.displayName)) || '—') +
      '</td>' +
      '<td><span class="lf-live-price">' +
      escapeHtml(formatPrice(sku && (sku.salePrice != null ? sku.salePrice : sku.price))) +
      '</span></td>' +
      '<td><span class="lf-live-market">' +
      escapeHtml(formatPrice(sku && (sku.linePrice != null ? sku.linePrice : sku.marketPrice))) +
      '</span></td>' +
      '<td>' +
      escapeHtml(String(sku ? Store.activityStockOf(sku) : 0)) +
      '</td>'
    );
  }

  function filteredProducts() {
    var list = (working && working.products) || [];
    return list.filter(function (p) {
      if (prodFilter.code && String(p.sku || '').toLowerCase().indexOf(prodFilter.code.toLowerCase()) < 0) {
        return false;
      }
      if (prodFilter.name && String(p.name || '').toLowerCase().indexOf(prodFilter.name.toLowerCase()) < 0) {
        return false;
      }
      return true;
    });
  }

  function renderProdPagination(total) {
    if (typeof createPagination !== 'function') return;
    var totalPages = Math.max(1, Math.ceil(total / prodPageSize) || 1);
    if (prodPage > totalPages) prodPage = totalPages;
    createPagination({
      containerId: 'skProdPagination',
      totalItems: total,
      currentPage: prodPage,
      pageSize: prodPageSize,
      pageSizeOptions: [10, 20, 50],
      onPageChange: function (p) {
        prodPage = p;
        renderProducts();
      },
      onPageSizeChange: function (s) {
        prodPageSize = s;
        prodPage = 1;
        renderProducts();
      }
    });
  }

  function renderProducts() {
    var tbody = document.getElementById('skProdTableBody');
    if (!tbody || !working) return;
    fillCategoryFilter();
    var rows = filteredProducts();
    renderProdPagination(rows.length);
    var start = (prodPage - 1) * prodPageSize;
    var pageRows = rows.slice(start, start + prodPageSize);
    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="12" style="text-align:center;color:#999;padding:24px;">' +
        (isReadonly() ? '暂无活动商品' : '暂无活动商品，请点击「添加商品」') +
        '</td></tr>';
      return;
    }
    tbody.innerHTML = pageRows
      .map(function (p, idx) {
        var skus = Store.skusOf(p);
        var first = skus[0];
        var expanded = !!expandedIds[p.id];
        var canExpand = skus.length > 1;
        var st = normalizeStatus(p.status);
        var canEnable = st === 'draft' || st === 'disabled';
        var canDisable = st === 'enabled';
        var ops =
          '<a href="' +
          escapeHtml(productHref(p.id)) +
          '">' +
          (isReadonly() ? '查看' : '编辑') +
          '</a>';
        if (!isReadonly()) {
          if (canEnable) ops += '<a href="#" data-act="on">上架</a>';
          if (canDisable) ops += '<a href="#" data-act="off">下架</a>';
          ops += '<a href="#" class="action-link-danger" data-act="delete">删除</a>';
        }
        var expandBtn = canExpand
          ? '<button type="button" class="lf-live-expand-btn" data-act="expand" aria-expanded="' +
            (expanded ? 'true' : 'false') +
            '">' +
            (expanded ? '∧' : '∨') +
            '</button>'
          : '';
        var specCount = canExpand ? '<span class="lf-live-sku-count">' + skus.length + ' 规格</span>' : '';
        var parent =
          '<tr data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<td>' +
          (start + idx + 1) +
          '</td>' +
          '<td class="lf-live-code-cell"><div class="lf-live-code-row">' +
          expandBtn +
          '<span class="lf-live-sku-id">' +
          escapeHtml(p.sku || '—') +
          '</span></div>' +
          specCount +
          '</td>' +
          '<td>' +
          thumbHtml(p) +
          '</td>' +
          '<td>' +
          escapeHtml(p.name) +
          '</td>' +
          '<td>' +
          escapeHtml(p.category || '') +
          '</td>' +
          skuCells(first) +
          '<td>' +
          escapeHtml(formatAddedAt(p.addedAt)) +
          '</td>' +
          '<td><span class="' +
          statusClass(p.status) +
          '">' +
          escapeHtml(statusLabel(p.status)) +
          '</span></td>' +
          '<td class="action-links">' +
          ops +
          '</td></tr>';
        if (!canExpand || !expanded) return parent;
        var children = skus
          .slice(1)
          .map(function (sku) {
            return (
              '<tr class="lf-live-sku-child" data-parent="' +
              escapeHtml(p.id) +
              '"><td></td><td></td><td></td><td></td><td></td>' +
              skuCells(sku) +
              '<td></td><td></td><td></td></tr>'
            );
          })
          .join('');
        return parent + children;
      })
      .join('');
  }

  function findProduct(id) {
    var list = (working && working.products) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { item: list[i], index: i, list: list };
    }
    return null;
  }

  function getAddedCodesMap() {
    var map = {};
    ((working && working.products) || []).forEach(function (p) {
      if (p.sku) map[p.sku] = true;
    });
    return map;
  }

  function addProductsFromLibrary(items) {
    if (!items || !items.length || !working) return 0;
    var addedCodes = getAddedCodesMap();
    var count = 0;
    items.forEach(function (item) {
      if (!item || !item.code || addedCodes[item.code]) return;
      working.products.unshift(Store.libraryItemToProduct(item));
      addedCodes[item.code] = true;
      count += 1;
    });
    if (count) {
      persistWorking();
      prodPage = 1;
      renderProducts();
    }
    return count;
  }

  function openLibraryDrawer() {
    if (!window.MdmProxyLibraryDrawer) {
      toast('商品库组件未加载', 'warning');
      return;
    }
    window.MdmProxyLibraryDrawer.open({
      addedCodes: getAddedCodesMap(),
      footerTip: '此处仅将商品库中的商品加入本秒杀活动，不会修改商品库主数据',
      onConfirm: function (picked) {
        var count = addProductsFromLibrary(picked);
        toast(count ? '已添加 ' + count + ' 件商品，请编辑完善后再上架' : '未添加新商品', count ? 'success' : 'info');
      }
    });
  }

  function loadWorking() {
    var id = qs('id');
    mode = qs('mode') || (id ? 'view' : 'create');
    if (mode !== 'edit' && mode !== 'view') mode = 'create';
    tab = qs('tab') === 'products' ? 'products' : 'info';

    var existing = id ? Store.getById(id) : null;
    var session = Store.getWorking();
    if (existing) {
      if (session && session.id === existing.id) working = session;
      else working = Store.startWorking(existing);
    } else if (mode === 'create') {
      working = session && !session.id ? session : Store.startWorking(Store.emptyItem());
    } else {
      working = null;
    }

    var title = document.getElementById('skFormTabTitle');
    if (title) {
      title.textContent = mode === 'create' ? '创建秒杀活动' : mode === 'edit' ? '编辑秒杀活动' : '查看秒杀活动';
    }
    document.title = '冷丰WMS - ' + (title ? title.textContent : '秒杀活动');
  }

  function bindEvents() {
    var nameInput = document.getElementById('skName');
    if (nameInput) nameInput.addEventListener('input', syncNameCount);

    document.querySelectorAll('input[name="skTimeMode"]').forEach(function (el) {
      el.addEventListener('change', syncTimeModeUi);
    });
    document.querySelectorAll('input[name="skLimitType"]').forEach(function (el) {
      el.addEventListener('change', syncLimitUi);
    });
    document.querySelectorAll('input[name="skSaleScope"]').forEach(function (el) {
      el.addEventListener('change', syncSaleScopeUi);
    });
    document.querySelectorAll('input[name="skPortScope"]').forEach(function (el) {
      el.addEventListener('change', syncPortScopeUi);
    });
    document.querySelectorAll('input[name="skBuyLimit"]').forEach(function (el) {
      el.addEventListener('change', syncUnqualifiedUi);
    });

    document.getElementById('skStepInfo').addEventListener('click', function () {
      setTab('info', true);
    });
    document.getElementById('skStepProducts').addEventListener('click', function () {
      setTab('products');
    });

    document.getElementById('skFormNext').addEventListener('click', function () {
      setTab('products');
    });
    document.getElementById('skFormPrev').addEventListener('click', function () {
      setTab('info', true);
    });
    document.getElementById('skFormCancel').addEventListener('click', function () {
      Store.clearWorking();
      window.location.href = listHref();
    });
    document.getElementById('skFormBack').addEventListener('click', function () {
      Store.clearWorking();
      window.location.href = listHref();
    });
    document.getElementById('skFormSave').addEventListener('click', function () {
      if (!validateInfo()) {
        setTab('info', true);
        return;
      }
      persistWorking();
      var onShelf = (working.products || []).filter(function (p) {
        return normalizeStatus(p.status) === 'enabled';
      });
      if (!onShelf.length) {
        toast('请至少上架一个活动商品后再保存', 'warning');
        return;
      }
      var saved = Store.saveItem(working);
      Store.clearWorking();
      toast('保存成功', 'success');
      window.location.href = listHref();
      return saved;
    });

    var regionPickBtn = document.getElementById('skSaleScopePickBtn');
    if (regionPickBtn) {
      regionPickBtn.addEventListener('click', function () {
        if (isReadonly()) return;
        if (!window.MdmProxyRegionPicker) {
          toast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: working.saleRegions,
          onConfirm: function (selected, summary) {
            working.saleRegions = cloneMap(selected);
            working.saleRegionSummary = Array.isArray(summary) ? summary : [];
            if (window.MdmProxyRegionPicker.summarize && !working.saleRegionSummary.length) {
              working.saleRegionSummary = window.MdmProxyRegionPicker.summarize(working.saleRegions);
            }
            persistWorking();
            syncSaleScopeUi();
          }
        });
      });
    }

    var storePickBtn = document.getElementById('skSaleScopeStorePickBtn');
    if (storePickBtn) {
      storePickBtn.addEventListener('click', function () {
        if (isReadonly()) return;
        if (!window.MdmProxyStorePicker) {
          toast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: working.saleStores,
          onConfirm: function (selected) {
            working.saleStores = cloneMap(selected);
            persistWorking();
            syncSaleScopeUi();
          }
        });
      });
    }

    var addBtn = document.getElementById('skProdAddBtn');
    if (addBtn) addBtn.addEventListener('click', openLibraryDrawer);

    document.getElementById('skProdFilterQuery').addEventListener('click', function () {
      prodFilter.code = (document.getElementById('qSkProdCode') || {}).value || '';
      prodFilter.name = (document.getElementById('qSkProdName') || {}).value || '';
      prodPage = 1;
      renderProducts();
    });
    document.getElementById('skProdFilterReset').addEventListener('click', function () {
      document.getElementById('qSkProdCode').value = '';
      document.getElementById('qSkProdName').value = '';
      prodFilter = { code: '', name: '', category: '' };
      prodPage = 1;
      renderProducts();
    });
    document.querySelectorAll('#skProdFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });

    var tbody = document.getElementById('skProdTableBody');
    tbody.addEventListener('click', function (ev) {
      var nav = ev.target.closest('a[href]:not([data-act])');
      if (nav) persistWorking();
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      ev.preventDefault();
      var act = actEl.getAttribute('data-act');
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      if (act === 'expand') {
        expandedIds[id] = !expandedIds[id];
        renderProducts();
        return;
      }
      if (isReadonly()) return;
      var found = findProduct(id);
      if (!found) return;
      if (act === 'on') {
        var ready = Store.productReadyCheck(found.item);
        if (!ready.ok) {
          toast(ready.message, 'warning');
          return;
        }
        found.item.status = 'enabled';
        persistWorking();
        toast('商品已上架');
        renderProducts();
        return;
      }
      if (act === 'off') {
        found.item.status = 'disabled';
        persistWorking();
        toast('商品已下架');
        renderProducts();
        return;
      }
      if (act === 'delete') {
        if (!window.confirm('确认删除活动商品「' + found.item.name + '」吗？')) return;
        found.list.splice(found.index, 1);
        persistWorking();
        toast('已删除', 'success');
        renderProducts();
        return;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadWorking();
    if (!working) {
      toast('未找到该活动', 'warning');
      window.location.href = listHref();
      return;
    }
    fillForm();
    bindEvents();
    setTab(tab, true);
  });
})();
