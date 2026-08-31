/**
 * 选品库 · 库存统计（MDM 主数据）
 * 一张总表：SKU 维度现货 / 可售 / 总预占 / 现货预占 / 预售预占；展开看分仓。
 */
(function () {
  var Stock = window.MdmSkuWhStock;
  var Catalog = window.MdmProductCatalog;

  var state = {
    all: [],
    filtered: [],
    page: 1,
    pageSize: 20,
    filters: { code: '', name: '', category: '', warehouseId: '' },
    openKey: '',
    selected: {}
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function specLabel(spec) {
    return spec.packaging || spec.specValue || spec.flavor || spec.skuCode || '默认';
  }

  function toSku(product, spec) {
    return {
      id: spec.skuCode || product.code,
      barcode: spec.barcode || '',
      specValue: specLabel(spec),
      sellableMode: spec.sellableMode || 'follow',
      sellablePercent: spec.sellablePercent != null ? spec.sellablePercent : '100',
      sellableFixed: spec.sellableFixed || '',
      warehouseStocks: spec.warehouseStocks
    };
  }

  function viewOf(sum, warehouseId) {
    if (!warehouseId) {
      return {
        spot: sum.spotTotal,
        sellable: sum.sellableTotal,
        reserved: sum.reservedTotal,
        reservedSpot: sum.reservedSpotTotal,
        reservedPresale: sum.reservedPresaleTotal,
        remain: sum.remainTotal
      };
    }
    var row = (sum.rows || []).filter(function (r) {
      return r.warehouseId === warehouseId;
    })[0];
    if (!row) {
      return { spot: 0, sellable: 0, reserved: 0, reservedSpot: 0, reservedPresale: 0, remain: 0 };
    }
    return {
      spot: row.spot,
      sellable: row.sellable,
      reserved: row.reserved,
      reservedSpot: row.reservedSpot,
      reservedPresale: row.reservedPresale,
      remain: row.remain
    };
  }

  function buildRows() {
    if (!Catalog || !Stock) return [];
    var list = [];
    Catalog.getAll().forEach(function (item) {
      var detail = Catalog.getByCode(item.code);
      if (!detail) return;
      (detail.specs || []).forEach(function (spec) {
        var sku = toSku(detail, spec);
        var sum = Stock.attachToSku(sku);
        var channels = Stock.reservedChannelTotals(sum);
        list.push({
          key: detail.code + ':' + (spec.skuCode || specLabel(spec)),
          code: detail.code,
          name: detail.name,
          category: detail.category || '',
          spec: specLabel(spec),
          skuCode: spec.skuCode || '',
          img: spec.skuImg || detail.img || '',
          sku: sku,
          sum: sum,
          channels: channels
        });
      });
    });
    return list;
  }

  function fillSelects() {
    var catEl = document.getElementById('qStockCategory');
    if (catEl && Catalog) {
      var cats = Catalog.getCategories ? Catalog.getCategories() : [];
      catEl.innerHTML =
        '<option value="">请选择商品类目</option>' +
        cats
          .map(function (c) {
            return '<option value="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</option>';
          })
          .join('');
    }
    var whEl = document.getElementById('qStockWarehouse');
    if (whEl && Stock) {
      whEl.innerHTML =
        '<option value="">全部仓库</option>' +
        (Stock.WAREHOUSES || [])
          .map(function (wh) {
            return '<option value="' + escapeHtml(wh.id) + '">' + escapeHtml(wh.name) + '</option>';
          })
          .join('');
    }
  }

  function readFilters() {
    state.filters.code = ((document.getElementById('qStockCode') || {}).value || '').trim();
    state.filters.name = ((document.getElementById('qStockName') || {}).value || '').trim();
    state.filters.category = (document.getElementById('qStockCategory') || {}).value || '';
    state.filters.warehouseId = (document.getElementById('qStockWarehouse') || {}).value || '';
  }

  function applyFilters() {
    var f = state.filters;
    state.filtered = state.all.filter(function (row) {
      if (f.code && String(row.code).toLowerCase().indexOf(f.code.toLowerCase()) < 0) return false;
      if (f.name && String(row.name).indexOf(f.name) < 0) return false;
      if (f.category && row.category !== f.category) return false;
      if (f.warehouseId) {
        var hit = (row.sum.rows || []).some(function (r) {
          return r.warehouseId === f.warehouseId;
        });
        if (!hit) return false;
      }
      return true;
    });
    var keep = {};
    state.filtered.forEach(function (row) {
      if (state.selected[row.key]) keep[row.key] = true;
    });
    state.selected = keep;
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function selectedRows() {
    return state.filtered.filter(function (row) {
      return !!state.selected[row.key];
    });
  }

  function getPageRows() {
    var start = (state.page - 1) * state.pageSize;
    return state.filtered.slice(start, start + state.pageSize);
  }

  function syncCheckAll() {
    var all = document.getElementById('productStockCheckAll');
    if (!all) return;
    var rows = getPageRows();
    var checked = 0;
    rows.forEach(function (row) {
      if (state.selected[row.key]) checked += 1;
    });
    all.checked = rows.length > 0 && checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
  }

  function updateExportMenuLabels() {
    var selectedBtn = document.querySelector('[data-export-scope="selected"]');
    var queryBtn = document.querySelector('[data-export-scope="query"]');
    if (selectedBtn) selectedBtn.textContent = '导出勾选数据（' + selectedRows().length + '）';
    if (queryBtn) queryBtn.textContent = '导出所有查询数据（' + state.filtered.length + '）';
  }

  function closeExportMenu() {
    var wrap = document.getElementById('productStockExport');
    var btn = document.getElementById('productStockExportBtn');
    var menu = document.getElementById('productStockExportMenu');
    if (wrap) wrap.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  }

  function toggleExportMenu() {
    var wrap = document.getElementById('productStockExport');
    var btn = document.getElementById('productStockExportBtn');
    var menu = document.getElementById('productStockExportMenu');
    if (!wrap || !menu) return;
    var open = !wrap.classList.contains('is-open');
    if (open) {
      updateExportMenuLabels();
      wrap.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
    } else {
      closeExportMenu();
    }
  }

  function csvCell(value) {
    var s = String(value == null ? '' : value).replace(/"/g, '""');
    return /[",\n]/.test(s) ? '"' + s + '"' : s;
  }

  function flattenWarehouseRows(list) {
    var wid = state.filters.warehouseId;
    var out = [];
    list.forEach(function (row) {
      (row.sum.rows || []).forEach(function (wh) {
        if (wid && wh.warehouseId !== wid) return;
        out.push({
          code: row.code,
          name: row.name,
          spec: row.spec,
          skuCode: row.skuCode,
          category: row.category,
          warehouse: wh.name,
          stores: (wh.stores || []).join('、'),
          spot: wh.spot,
          sellable: wh.sellable,
          reserved: wh.reserved,
          reservedSpot: wh.reservedSpot,
          reservedPresale: wh.reservedPresale,
          reservedSpotText: wh.reservedSpotText,
          reservedPresaleText: wh.reservedPresaleText,
          remain: wh.remain
        });
      });
    });
    return out;
  }

  function exportRows(list, scopeLabel) {
    var header = [
      '商品编码',
      '商品名称',
      '规格',
      'SKU编码',
      '商品类目',
      '配送仓',
      '共享门店',
      '现货库存',
      '可售库存',
      '总预占',
      '现货预占',
      '预售预占',
      '现货预占构成',
      '预售预占构成',
      '剩余可售'
    ];
    var lines = [header.map(csvCell).join(',')];
    var flat = flattenWarehouseRows(list);
    if (!flat.length) {
      if (typeof showToast === 'function') showToast('没有可导出的配送仓数据', 'warning');
      return;
    }
    flat.forEach(function (row) {
      lines.push(
        [
          row.code,
          row.name,
          row.spec,
          row.skuCode,
          row.category,
          row.warehouse,
          row.stores,
          row.spot,
          row.sellable,
          row.reserved,
          row.reservedSpot,
          row.reservedPresale,
          row.reservedSpotText,
          row.reservedPresaleText,
          row.remain
        ]
          .map(csvCell)
          .join(',')
      );
    });
    var stamp = new Date();
    var name =
      '库存统计_' +
      scopeLabel +
      '_' +
      stamp.getFullYear() +
      String(stamp.getMonth() + 1).padStart(2, '0') +
      String(stamp.getDate()).padStart(2, '0') +
      '.csv';
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') {
      showToast('已按配送仓导出' + scopeLabel + ' ' + flat.length + ' 条', 'success');
    }
  }

  function exportByScope(scope) {
    if (scope === 'selected') {
      var picked = selectedRows();
      if (!picked.length) {
        if (typeof showToast === 'function') showToast('请先勾选要导出的数据', 'warning');
        return;
      }
      exportRows(picked, '勾选数据');
      return;
    }
    if (!state.filtered.length) {
      if (typeof showToast === 'function') showToast('当前查询无数据可导出', 'warning');
      return;
    }
    exportRows(state.filtered, '所有查询数据');
  }

  function renderSummary() {
    var box = document.getElementById('productStockSummary');
    if (!box) return;
    var spot = 0;
    var sellable = 0;
    var reserved = 0;
    var reservedSpot = 0;
    var reservedPresale = 0;
    var wid = state.filters.warehouseId;
    state.filtered.forEach(function (row) {
      var v = viewOf(row.sum, wid);
      spot += v.spot;
      sellable += v.sellable;
      reserved += v.reserved;
      reservedSpot += v.reservedSpot;
      reservedPresale += v.reservedPresale;
    });
    box.innerHTML =
      '<div class="product-stock-summary__item"><span>现货库存</span><strong>' +
      spot +
      '</strong></div>' +
      '<div class="product-stock-summary__item"><span>可售库存</span><strong>' +
      sellable +
      '</strong></div>' +
      '<div class="product-stock-summary__item"><span>总预占</span><strong>' +
      reserved +
      '</strong><em>现货预占 ' +
      reservedSpot +
      ' + 预售预占 ' +
      reservedPresale +
      '</em></div>' +
      '<div class="product-stock-summary__item"><span>现货预占</span><strong>' +
      reservedSpot +
      '</strong></div>' +
      '<div class="product-stock-summary__item"><span>预售预占</span><strong>' +
      reservedPresale +
      '</strong></div>' +
      '<div class="product-stock-summary__item"><span>SKU 数</span><strong>' +
      state.filtered.length +
      '</strong></div>';
  }

  function renderPagination() {
    var totalEl = document.getElementById('productStockPaginationTotal');
    var pagesEl = document.getElementById('productStockPaginationPages');
    var gotoEl = document.getElementById('productStockPageGoto');
    var total = state.filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    var page = state.page;
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(page);
    if (!pagesEl) return;
    var html =
      '<button type="button" class="product-pagination__btn" data-page="' +
      (page - 1) +
      '"' +
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
          '" data-page="' +
          p +
          '">' +
          p +
          '</button>';
      }
    });
    html +=
      '<button type="button" class="product-pagination__btn" data-page="' +
      (page + 1) +
      '"' +
      (page >= totalPages ? ' disabled' : '') +
      ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderTable() {
    var tbody = document.getElementById('productStockTableBody');
    var empty = document.getElementById('productStockEmpty');
    if (!tbody) return;
    renderSummary();
    var pageRows = getPageRows();
    if (!pageRows.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
      renderPagination();
      syncCheckAll();
      updateExportMenuLabels();
      return;
    }
    if (empty) empty.hidden = true;
    var wid = state.filters.warehouseId;
    tbody.innerHTML = pageRows
      .map(function (row) {
        var v = viewOf(row.sum, wid);
        var open = state.openKey === row.key;
        var checked = state.selected[row.key] ? ' checked' : '';
        var detail = '';
        if (open && Stock.renderTable) {
          detail =
            '<tr class="product-stock-detail-row"><td colspan="11">' +
            Stock.renderTable(row.sum) +
            '</td></tr>';
        }
        return (
          '<tr data-stock-key="' +
          escapeHtml(row.key) +
          '">' +
          '<td class="product-stock-table__check"><input type="checkbox" class="js-stock-check" data-stock-key="' +
          escapeHtml(row.key) +
          '"' +
          checked +
          ' aria-label="勾选 ' +
          escapeHtml(row.skuCode || row.code) +
          '"></td>' +
          '<td>' +
          escapeHtml(row.code) +
          '</td>' +
          '<td>' +
          escapeHtml(row.name) +
          '</td>' +
          '<td>' +
          escapeHtml(row.spec) +
          '</td>' +
          '<td>' +
          escapeHtml(row.skuCode) +
          '</td>' +
          '<td class="product-stock-table__num">' +
          v.spot +
          '</td>' +
          '<td class="product-stock-table__num">' +
          v.sellable +
          '</td>' +
          '<td class="product-stock-table__num" title="' +
          escapeHtml(row.channels.text) +
          '">' +
          v.reserved +
          '</td>' +
          '<td class="product-stock-table__num" title="' +
          escapeHtml(row.channels.spotText) +
          '">' +
          v.reservedSpot +
          '<span class="product-stock-table__parts">' +
          escapeHtml(row.channels.spotText) +
          '</span></td>' +
          '<td class="product-stock-table__num" title="' +
          escapeHtml(row.channels.presaleText) +
          '">' +
          v.reservedPresale +
          '<span class="product-stock-table__parts">' +
          escapeHtml(row.channels.presaleText) +
          '</span></td>' +
          '<td><button type="button" class="product-stock-toggle' +
          (open ? ' is-open' : '') +
          '" data-toggle-stock="' +
          escapeHtml(row.key) +
          '" aria-expanded="' +
          (open ? 'true' : 'false') +
          '">' +
          (open ? '收起' : '分仓明细') +
          '<span class="product-stock-toggle__caret" aria-hidden="true"></span>' +
          '</button></td></tr>' +
          detail
        );
      })
      .join('');
    renderPagination();
    syncCheckAll();
    updateExportMenuLabels();
  }

  function refresh(resetPage) {
    if (resetPage) {
      state.page = 1;
      state.openKey = '';
    }
    readFilters();
    applyFilters();
    renderTable();
  }

  function bind() {
    var queryBtn = document.getElementById('productStockQuery');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        refresh(true);
        if (typeof showToast === 'function') showToast('查询完成', 'success');
      });
    }
    var resetBtn = document.getElementById('productStockReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = document.getElementById('productStockFilterForm');
        if (form) form.reset();
        state.selected = {};
        refresh(true);
      });
    }
    var sizeEl = document.getElementById('productStockPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 20;
        refresh(true);
      });
    }
    var pagesEl = document.getElementById('productStockPaginationPages');
    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        state.openKey = '';
        renderTable();
      });
    }
    var gotoEl = document.getElementById('productStockPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        var val = parseInt(e.target.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        state.openKey = '';
        renderTable();
      });
    }
    var tbody = document.getElementById('productStockTableBody');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-toggle-stock]');
        if (!btn) return;
        var key = btn.getAttribute('data-toggle-stock');
        state.openKey = state.openKey === key ? '' : key;
        renderTable();
      });
      tbody.addEventListener('change', function (e) {
        var cb = e.target.closest('.js-stock-check');
        if (!cb) return;
        var key = cb.getAttribute('data-stock-key');
        if (cb.checked) state.selected[key] = true;
        else delete state.selected[key];
        syncCheckAll();
        updateExportMenuLabels();
      });
    }

    var checkAll = document.getElementById('productStockCheckAll');
    if (checkAll) {
      checkAll.addEventListener('change', function () {
        var on = checkAll.checked;
        getPageRows().forEach(function (row) {
          if (on) state.selected[row.key] = true;
          else delete state.selected[row.key];
        });
        renderTable();
      });
    }

    var exportBtn = document.getElementById('productStockExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleExportMenu();
      });
    }
    var exportMenu = document.getElementById('productStockExportMenu');
    if (exportMenu) {
      exportMenu.addEventListener('click', function (e) {
        var item = e.target.closest('[data-export-scope]');
        if (!item) return;
        e.preventDefault();
        e.stopPropagation();
        var scope = item.getAttribute('data-export-scope');
        closeExportMenu();
        exportByScope(scope);
      });
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('#productStockExport')) return;
      closeExportMenu();
    });
  }

  function init() {
    fillSelects();
    state.all = buildRows();
    bind();
    refresh(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
