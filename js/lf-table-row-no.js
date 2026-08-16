/**
 * 后台数据列表自动加「序号」列（仓储 / 采购 / 物流除外）
 *
 * 策略：仅在 thead 插入「序号」th，tbody 用 tr::before 伪列展示数字，
 * 不插入真实 td，避免打乱业务脚本的 cells[n] / STORE_COL 等硬编码索引。
 * 已有「序号」表头的列表视为自管，跳过。
 */
(function (global) {
  'use strict';

  var EXCLUDE_SRC = /(?:^|\/)(wms-sidebar|purchase-sidebar|tms-sidebar)(?:\.js)?(?:\?|$)/i;
  var INCLUDE_SRC =
    /(?:^|\/)(mdm-sidebar|order-sidebar|product-sidebar|marketing-sidebar|settle-sidebar|aftersale-sidebar|basic-settings-sidebar)(?:\.js)?(?:\?|$)/i;

  var TABLE_SEL =
    'table.table, table.product-proxy-table, table.product-table, table.order-live-table, table.queue-table, table.aftersale-table, table.aftersale-refund-table';
  var SKIP_CLOSEST =
    '.modal, .modal-content, .store-drawer, [data-mdm-archive-drawer], [role="dialog"], .lf-drawer, .product-proxy-form, .sku-picker';

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
      if (normalizeHeaderText(ths[i]) === '序号') return true;
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
    /* 配置区嵌套小表跳过；主列表区保留 */
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
    if (table.classList.contains('lf-row-no-on') && table.querySelector('th.lf-row-no-th')) {
      return true;
    }
    var headerRow = table.tHead.rows[0];
    if (!headerRow) return false;
    var th = document.createElement('th');
    th.className = 'lf-row-no-th';
    th.textContent = '序号';
    th.scope = 'col';
    headerRow.insertBefore(th, headerRow.firstChild);
    ensureColForSerial(table);
    table.classList.add('lf-row-no-on');
    table.classList.remove('lf-row-no-native');
    return true;
  }

  /**
   * 跨页连续编号：根据分页文案推断起始序号（从 0 起的 reset 值）
   * 解析失败则每页从 1 开始。
   */
  function inferCounterReset(table) {
    var explicit = table.getAttribute('data-lf-row-start');
    if (explicit != null && explicit !== '') {
      var n = parseInt(explicit, 10);
      return isNaN(n) ? 0 : Math.max(0, n);
    }

    var root =
      table.closest('.table-section') ||
      table.closest('.member-tab-panel') ||
      table.closest('.main-content') ||
      document;

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

  function applyCounterReset(table) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var start = inferCounterReset(table);
    tbody.style.counterReset = 'lf-row-no ' + start;
  }

  function enhanceTable(table) {
    if (!isEligibleTable(table)) return;
    if (hasNativeSerialHeader(table) && !table.classList.contains('lf-row-no-on')) {
      table.classList.add('lf-row-no-native');
      return;
    }
    if (!ensureSerialHeader(table)) return;
    applyCounterReset(table);
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
    link.href = assetUrl('css/lf-table-row-no.css') + '?v=20260815-row-no-order';
    document.head.appendChild(link);
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
      }
      if (need) scheduleEnhance();
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function init() {
    if (!shouldEnablePage()) return;
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
    shouldEnablePage: shouldEnablePage
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
