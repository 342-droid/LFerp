/**
 * 后台数据列表自动加「序号」列（仓储 / 采购 / 物流除外）
 *
 * 策略：thead / tbody 均插入真实「序号」单元格，保证与表头对齐。
 * 同时对 tr.querySelectorAll('td') / tr.querySelector('td') 做兼容过滤，
 * 业务脚本的 cells[n] / STORE_COL 仍按「业务列」从 0 起算（跳过序号列）。
 * 已有「序号」表头的列表视为自管，跳过。
 */
(function (global) {
  'use strict';

  var EXCLUDE_SRC = /(?:^|\/)(wms-sidebar|purchase-sidebar|tms-sidebar)(?:\.js)?(?:\?|$)/i;
  var INCLUDE_SRC =
    /(?:^|\/)(mdm-sidebar|order-sidebar|product-sidebar|marketing-sidebar|settle-sidebar|aftersale-sidebar|basic-settings-sidebar)(?:\.js)?(?:\?|$)/i;

  var TABLE_SEL =
    'table.table, table.product-proxy-table, table.product-table, table.order-live-table, table.queue-table, table.aftersale-table, table.aftersale-refund-table, table.fc-table';
  var SKIP_CLOSEST =
    '.modal, .modal-content, .store-drawer, [data-mdm-archive-drawer], [role="dialog"], .lf-drawer, .product-proxy-form, .sku-picker';

  var shimInstalled = false;

  function scriptSrcList() {
    var out = [];
    var nodes = document.getElementsByTagName('script');
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute('src') || '';
      if (src) out.push(src);
    }
    return out;
  }

  function shouldEnablePage() {
    var root = document.documentElement;
    var flag = root.getAttribute('data-lf-row-no');
    if (flag === 'off' || flag === '0' || flag === 'false') return false;
    if (flag === 'on' || flag === '1' || flag === 'true') return true;

    var srcs = scriptSrcList();
    var i;
    for (i = 0; i < srcs.length; i++) {
      if (EXCLUDE_SRC.test(srcs[i])) return false;
    }
    for (i = 0; i < srcs.length; i++) {
      if (INCLUDE_SRC.test(srcs[i])) return true;
    }
    return false;
  }

  function normalizeHeaderText(th) {
    return String((th && th.textContent) || '')
      .replace(/\s+/g, '')
      .replace(/\*/g, '');
  }

  function hasNativeSerialHeader(table) {
    var ths = table.querySelectorAll('thead tr:first-child th, thead tr:first-child td');
    for (var i = 0; i < ths.length; i++) {
      if (normalizeHeaderText(ths[i]) === '序号' && !ths[i].classList.contains('lf-row-no-th')) {
        return true;
      }
    }
    return false;
  }

  function isEligibleTable(table) {
    if (!table || table.nodeType !== 1) return false;
    if (table.getAttribute('data-lf-row-no') === 'off') return false;
    if (table.classList.contains('lf-row-no-native')) return false;
    if (table.closest(SKIP_CLOSEST)) return false;
    if (!table.tHead || !table.tHead.rows.length) return false;
    if (!table.tBodies || !table.tBodies.length) return false;
    var headerCells = table.tHead.rows[0].cells.length;
    if (headerCells < 2) return false;
    if (table.closest('.bs-hours-cat, .sac-field, .store-form, .product-proxy-form')) return false;
    if (!table.closest('.table-section, .main-content, .member-tab-panel, .product-proxy-page, .content-panel')) {
      return false;
    }
    return true;
  }

  function ensureColForSerial(table) {
    var colgroup = table.querySelector('colgroup');
    if (!colgroup) return;
    if (colgroup.querySelector('.lf-row-no-col')) return;
    var col = document.createElement('col');
    col.className = 'lf-row-no-col product-proxy-table__col';
    col.style.width = '56px';
    colgroup.insertBefore(col, colgroup.firstChild);
  }

  function ensureSerialHeader(table) {
    if (hasNativeSerialHeader(table)) {
      table.classList.add('lf-row-no-native');
      table.classList.remove('lf-row-no-on');
      return false;
    }
    var headerRow = table.tHead.rows[0];
    if (!headerRow) return false;
    var existing = headerRow.querySelector('th.lf-row-no-th');
    if (!existing) {
      var th = document.createElement('th');
      th.className = 'lf-row-no-th';
      th.textContent = '序号';
      th.scope = 'col';
      headerRow.insertBefore(th, headerRow.firstChild);
      ensureColForSerial(table);
    }
    table.classList.add('lf-row-no-on');
    table.classList.remove('lf-row-no-native');
    return true;
  }

  function isDataRow(tr) {
    if (!tr || tr.nodeType !== 1) return false;
    if (tr.querySelector('td[colspan]')) return false;
    var tds = tr.querySelectorAll('td');
    return tds.length > 0;
  }

  function visibleDataRows(tbody) {
    var rows = [];
    var trs = tbody.rows;
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      if (!isDataRow(tr)) continue;
      if (tr.style.display === 'none' || tr.getAttribute('hidden') != null) continue;
      if (tr.classList.contains('lf-row-no-skip')) continue;
      rows.push(tr);
    }
    return rows;
  }

  function parseTotalText(text) {
    var m = String(text || '').match(/共\s*(\d+)\s*条/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  function closestListRoot(table) {
    return (
      table.closest('.table-section') ||
      table.closest('.order-table-card') ||
      table.closest('.aftersale-table-card') ||
      table.closest('.member-tab-panel') ||
      table.closest('.main-content') ||
      document
    );
  }

  /**
   * 跨页连续编号：根据分页文案推断起始偏移（从 0 起）
   */
  function inferCounterReset(table) {
    var explicit = table.getAttribute('data-lf-row-start');
    if (explicit != null && explicit !== '') {
      var n = parseInt(explicit, 10);
      return isNaN(n) ? 0 : Math.max(0, n);
    }

    var root = closestListRoot(table);

    var info = root.querySelector('.pagination-info');
    if (info) {
      var text = info.textContent || '';
      var pageMatch = text.match(/第\s*(\d+)\s*\/\s*(\d+)\s*页/);
      var page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
      var size = 10;
      var sizeInput = root.querySelector('.pagination-select-custom input, .pagination .custom-select input');
      if (sizeInput && sizeInput.value) {
        size = parseInt(sizeInput.value, 10) || size;
      } else {
        var sizeText = root.querySelector('.pagination-controls');
        var sm = sizeText && (sizeText.textContent || '').match(/(\d+)\s*条\/页/);
        if (sm) size = parseInt(sm[1], 10) || size;
      }
      if (page > 1) return (page - 1) * size;
      return 0;
    }

    var activeBtn = root.querySelector(
      '.product-pagination__btn.is-active, .erp-pagination__pages .is-active, .erp-pagination__pages button.active'
    );
    if (activeBtn) {
      var p = parseInt(activeBtn.textContent, 10);
      var pageSize = parseInt(table.getAttribute('data-page-size') || '10', 10) || 10;
      if (!isNaN(p) && p > 1) return (p - 1) * pageSize;
    }
    return 0;
  }

  /**
   * 全量条数：优先 data-lf-row-total，其次分页「共 N 条」
   */
  function inferTotalCount(table, start, pageRowCount) {
    var explicit = table.getAttribute('data-lf-row-total');
    if (explicit != null && explicit !== '') {
      var n = parseInt(explicit, 10);
      if (!isNaN(n) && n >= 0) return n;
    }

    var root = closestListRoot(table);
    var nodes = root.querySelectorAll(
      '.pagination-info, .order-pagination, .aftersale-pagination, .erp-pagination__total, .queue-pagination__total, [class*="pagination__total"], [id$="PaginationTotal"], [id$="Total"]'
    );
    var i;
    for (i = 0; i < nodes.length; i++) {
      var total = parseTotalText(nodes[i].textContent);
      if (!isNaN(total)) return total;
    }
    return Math.max(start + pageRowCount, pageRowCount);
  }

  function syncRowNumbers(table) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = visibleDataRows(tbody);
    var start = inferCounterReset(table);
    var total = inferTotalCount(table, start, rows.length);
    var i;
    for (i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var td = tr.querySelector('td.lf-row-no-td');
      if (!td) {
        td = document.createElement('td');
        td.className = 'lf-row-no-td';
        tr.insertBefore(td, tr.firstChild);
      } else if (tr.firstChild !== td) {
        tr.insertBefore(td, tr.firstChild);
      }
      /* 序号倒序：全量结果从大到小编号，跨页连续 */
      td.textContent = String(Math.max(1, total - start - i));
    }

    /* 隐藏行也补齐空序号格，避免列错位 */
    var allTrs = tbody.rows;
    for (i = 0; i < allTrs.length; i++) {
      var row = allTrs[i];
      if (!isDataRow(row)) continue;
      if (row.querySelector('td.lf-row-no-td')) continue;
      var empty = document.createElement('td');
      empty.className = 'lf-row-no-td';
      empty.textContent = '';
      row.insertBefore(empty, row.firstChild);
    }
  }

  function enhanceTable(table) {
    if (!isEligibleTable(table)) return;
    if (hasNativeSerialHeader(table) && !table.classList.contains('lf-row-no-on')) {
      table.classList.add('lf-row-no-native');
      return;
    }
    if (!ensureSerialHeader(table)) return;
    syncRowNumbers(table);
  }

  function enhanceAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var tables = scope.querySelectorAll(TABLE_SEL);
    for (var i = 0; i < tables.length; i++) {
      enhanceTable(tables[i]);
    }
  }

  function assetUrl(rel) {
    var wp = global.wmsPath;
    if (wp && typeof wp.asset === 'function') return wp.asset(rel);
    var p = String(global.location && global.location.pathname || '').replace(/\\/g, '/');
    if (/\/(MDM|SCM|CRM)(\/|$)/i.test(p)) return '../' + rel;
    return rel;
  }

  function ensureStylesheet() {
    if (document.getElementById('lf-table-row-no-css')) return;
    var link = document.createElement('link');
    link.id = 'lf-table-row-no-css';
    link.rel = 'stylesheet';
    link.href = assetUrl('css/lf-table-row-no.css') + '?v=20260817-row-td';
    document.head.appendChild(link);
  }

  /**
   * 兼容：业务代码 tr.querySelectorAll('td')[n] 仍指向原业务列
   */
  function installCellsShim() {
    if (shimInstalled) return;
    shimInstalled = true;

    var nativeQSA = Element.prototype.querySelectorAll;
    var nativeQS = Element.prototype.querySelector;

    function inRowNoTable(el) {
      return (
        el &&
        el.tagName === 'TR' &&
        el.closest &&
        el.closest('table.lf-row-no-on')
      );
    }

    function isBareTdSelector(sel) {
      return String(sel || '').replace(/\s+/g, '') === 'td';
    }

    Element.prototype.querySelectorAll = function (selectors) {
      if (inRowNoTable(this) && isBareTdSelector(selectors)) {
        return nativeQSA.call(this, 'td:not(.lf-row-no-td)');
      }
      return nativeQSA.apply(this, arguments);
    };

    Element.prototype.querySelector = function (selectors) {
      if (inRowNoTable(this) && isBareTdSelector(selectors)) {
        return nativeQS.call(this, 'td:not(.lf-row-no-td)');
      }
      return nativeQS.apply(this, arguments);
    };
  }

  var scheduled = false;
  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      enhanceAll(document);
    }, 0);
  }

  function bindObservers() {
    if (!global.MutationObserver) return;
    var obs = new MutationObserver(function (mutations) {
      var need = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
          need = true;
          break;
        }
        if (m.type === 'characterData') {
          need = true;
          break;
        }
        if (m.type === 'attributes' && (m.attributeName === 'style' || m.attributeName === 'hidden' || m.attributeName === 'class')) {
          need = true;
          break;
        }
      }
      if (need) scheduleEnhance();
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'hidden', 'class']
    });
  }

  function init() {
    if (!shouldEnablePage()) return;
    installCellsShim();
    ensureStylesheet();
    enhanceAll(document);
    bindObservers();
    global.addEventListener('lf-table-row-no:refresh', scheduleEnhance);
  }

  global.LfTableRowNo = {
    init: init,
    enhanceAll: enhanceAll,
    enhanceTable: enhanceTable,
    refresh: scheduleEnhance,
    shouldEnablePage: shouldEnablePage,
    dataCells: function (tr) {
      if (!tr) return [];
      return tr.querySelectorAll('td:not(.lf-row-no-td)');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
