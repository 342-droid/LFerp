/**
 * LFerp 静态原型 · 表格个人视图
 *
 * 同步 VabSchemaTable 已确认的交互边界：筛选项与列分开管理，筛选值不进入偏好，
 * 系统列不可配置，列支持显隐、排序、宽度与左右固定。
 */
(function () {
  'use strict';

  var VERSION = 1;
  var STORAGE_PREFIX = 'lferp:table-personal-view:v1:';
  var profiles = {
    '/MDM/mdm_aftersale_ticket.html': {
      preferenceKey: 'commerce.aftersale.list',
      filterItemSelector: '#asTicketFilterGrid > .aftersale-filter-field',
      filterEntryHost: '.aftersale-filter-actions',
      legacyFilterToggle: '#asTicketCollapse',
      table: '#asTicketTable',
      tableEntryHost: '.aftersale-table-toolbar',
      queryButton: '#asTicketQuery'
    },
    '/MDM/mdm_order_retail.html': {
      preferenceKey: 'commerce.retail-order.list',
      filterItemSelector: '.order-filter-grid > .order-filter-field',
      filterEntryHost: '.order-filter-actions',
      legacyFilterToggle: '#orderFilterExpand',
      table: '.order-live-table-wrap > .order-live-table',
      tableEntryHost: '.order-table-toolbar',
      queryButton: '#orderFilterQuery'
    },
    '/SCM/purchase_store_order_sheet.html': {
      preferenceKey: 'procurement.store-order.list',
      filterItemSelector: '.search-section .search-form > .form-group',
      filterEntryHost: '.search-section .form-actions',
      table: '.table-section .table-scroll-container > table.table',
      tableSection: '.table-section',
      queryButton: '#btnSearch'
    },
    '/SCM/purchase_order.html': {
      preferenceKey: 'procurement.purchase-order.list',
      filterItemSelector: '.search-section .search-form > .form-group',
      filterEntryHost: '.search-section .form-actions',
      table: '.table-section .table-scroll-container > table.table',
      tableSection: '.table-section',
      queryButton: '#btnSearch'
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizePath(pathname) {
    if (!pathname) return '/';
    return pathname.length > 1 && pathname.charAt(pathname.length - 1) === '/'
      ? pathname.slice(0, -1)
      : pathname;
  }

  function cleanLabel(value) {
    return String(value || '')
      .replace(/[?？]/g, '')
      .replace(/[:：]\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function safeKey(value, fallback) {
    var key = String(value || '')
      .trim()
      .replace(/[^A-Za-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    return key || fallback;
  }

  function clampWidth(value, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(80, Math.min(640, Math.round(number)));
  }

  function readStorage(key) {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + key) || 'null');
      return parsed && parsed.formatVersion === VERSION ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, preference) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(preference));
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return true;
    } catch (error) {
      /* localStorage 不可用时仍保留当前页面预览。 */
      return false;
    }
  }

  function isDefaultArea(area, defaults, kind) {
    if (!area || area.length !== defaults.length) return false;
    return area.every(function (item, index) {
      var baseline = defaults[index];
      if (!baseline || item.key !== baseline.key || item.visible !== baseline.visible || item.order !== baseline.order) {
        return false;
      }
      if (kind === 'columns') {
        return item.pin === baseline.pin && Number(item.width) === Number(baseline.width);
      }
      return true;
    });
  }

  function getFieldLabel(node, index) {
    var label = node.querySelector('label, [class*="__label"], .label');
    if (label) return cleanLabel(label.textContent);
    var control = node.querySelector('input:not([type="hidden"]), select, textarea');
    return cleanLabel(control && (control.getAttribute('aria-label') || control.placeholder)) || ('筛选项 ' + (index + 1));
  }

  function getFieldKey(node, index) {
    var control = node.querySelector('input[id]:not([type="hidden"]), select[id], textarea[id]');
    var identified = node.querySelector('[id]');
    return safeKey(
      node.getAttribute('data-preference-key') || node.id || (control && control.id) || (identified && identified.id),
      'filter-' + index
    );
  }

  function captureValues(items) {
    var values = {};
    items.forEach(function (item) {
      values[item.key] = Array.prototype.map.call(
        item.node.querySelectorAll('input, select, textarea'),
        function (control) {
          return {
            node: control,
            value: control.value,
            checked: !!control.checked,
            selectedIndex: typeof control.selectedIndex === 'number' ? control.selectedIndex : -1
          };
        }
      );
    });
    return values;
  }

  function restoreValues(values) {
    Object.keys(values || {}).forEach(function (key) {
      (values[key] || []).forEach(function (entry) {
        if (!entry.node || !entry.node.isConnected) return;
        if (entry.node.type === 'checkbox' || entry.node.type === 'radio') entry.node.checked = entry.checked;
        if (entry.node.tagName === 'SELECT' && entry.selectedIndex >= 0) entry.node.selectedIndex = entry.selectedIndex;
        else entry.node.value = entry.value;
        entry.node.dispatchEvent(new Event('input', { bubbles: true }));
        entry.node.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function clearField(item) {
    Array.prototype.forEach.call(item.node.querySelectorAll('input, select, textarea'), function (control) {
      if (control.type === 'hidden') return;
      if (control.type === 'checkbox' || control.type === 'radio') control.checked = false;
      else if (control.tagName === 'SELECT') control.selectedIndex = 0;
      else control.value = '';
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function mergeArea(defaults, saved, kind) {
    var savedMap = {};
    (saved || []).forEach(function (item) {
      if (item && item.key) savedMap[item.key] = item;
    });
    return defaults
      .map(function (item) {
        var historical = savedMap[item.key] || {};
        var existed = !!savedMap[item.key];
        var merged = clone(item);
        merged.visible = Object.prototype.hasOwnProperty.call(historical, 'visible')
          ? historical.visible !== false
          : (Array.isArray(saved) && !existed ? false : item.visible !== false);
        if (item.required) merged.visible = true;
        merged.order = Number.isFinite(Number(historical.order)) ? Number(historical.order) : item.order;
        if (kind === 'columns') {
          merged.pin = historical.pin === 'left' || historical.pin === 'right' ? historical.pin : 'none';
          merged.width = clampWidth(historical.width, item.width);
        }
        merged.isNew = Array.isArray(saved) && !existed;
        return merged;
      })
      .sort(function (a, b) { return a.order - b.order; })
      .map(function (item, index) {
        item.order = index;
        return item;
      });
  }

  function createController(profile) {
    var table = document.querySelector(profile.table);
    var filterNodes = Array.prototype.slice.call(document.querySelectorAll(profile.filterItemSelector));
    if (!table || !filterNodes.length) return null;

    var filterItems = filterNodes.map(function (node, index) {
      var parentWasHidden = !!node.parentElement.hidden;
      return {
        key: getFieldKey(node, index),
        label: getFieldLabel(node, index),
        node: node,
        parent: node.parentElement,
        visible: !node.hidden && !parentWasHidden,
        order: index,
        parentOrder: Array.prototype.indexOf.call(node.parentElement.children, node),
        required: node.hasAttribute('data-view-required')
      };
    });

    var filterParents = [];
    filterItems.forEach(function (item) {
      if (filterParents.indexOf(item.parent) < 0) filterParents.push(item.parent);
      item.parent.hidden = false;
    });
    var legacyToggle = profile.legacyFilterToggle && document.querySelector(profile.legacyFilterToggle);
    if (legacyToggle) legacyToggle.style.setProperty('display', 'none', 'important');
    filterParents.forEach(function (parent) { parent.classList.remove('is-collapsed'); });

    var headerRow = table.querySelector('thead tr');
    var headers = Array.prototype.slice.call(headerRow ? headerRow.children : []);
    var seenColumnKeys = {};
    var defaultHeaders = headers.map(function (header, index) {
      var label = cleanLabel(header.textContent);
      var isSelection = !!header.querySelector('input[type="checkbox"]');
      var isAction = label === '操作';
      var isSerial = label === '序号' || label === '#';
      var system = isSelection || isAction || isSerial;
      var explicitKey = safeKey(header.getAttribute('data-preference-key'), '');
      var configurable = !system && !!explicitKey && !seenColumnKeys[explicitKey];
      if (explicitKey) seenColumnKeys[explicitKey] = true;
      if (!system && !configurable && window.console && typeof window.console.warn === 'function') {
        window.console.warn('[LfTablePersonalView] 列缺少唯一 data-preference-key，已跳过个人配置：', label);
      }
      var key = system
        ? (isSelection ? '__selection' : isAction ? '__action' : '__serial')
        : (configurable ? explicitKey : '__unmanaged-' + index);
      header.setAttribute('data-lf-view-column-key', key);
      return {
        key: key,
        label: label || ('列 ' + (index + 1)),
        node: header,
        system: system,
        configurable: configurable,
        systemPosition: isAction ? 'right' : 'left',
        visible: true,
        pin: 'none',
        width: clampWidth(header.getAttribute('width') || header.style.width || header.offsetWidth, 140),
        order: index,
        originalIndex: index
      };
    });
    var defaultColumns = defaultHeaders.filter(function (item) { return item.configurable; }).map(function (item, index) {
      item.order = index;
      return item;
    });

    var defaultFilterStates = filterItems.map(function (item) {
      return { key: item.key, label: item.label, visible: item.visible, order: item.order, required: item.required };
    });
    var defaultColumnStates = defaultColumns.map(function (item, index) {
      return { key: item.key, label: item.label, visible: true, order: index, pin: 'none', width: item.width };
    });
    var stored = readStorage(profile.preferenceKey);
    var saved = {
      formatVersion: VERSION,
      filters: mergeArea(defaultFilterStates, stored && stored.filters, 'filters'),
      columns: mergeArea(defaultColumnStates, stored && stored.columns, 'columns')
    };
    if (saved.columns.length && !saved.columns.some(function (item) { return item.visible; })) {
      saved.columns[0].visible = true;
    }
    var draft = null;
    var openKind = '';
    var openValues = null;
    var applyingRows = false;
    var widthSaveTimer = 0;
    var backdrop = null;
    var drawer = null;

    function findFilter(key) {
      return filterItems.find(function (item) { return item.key === key; });
    }

    function findHeader(key) {
      return defaultHeaders.find(function (item) { return item.key === key; });
    }

    function fieldState(area, key) {
      return area.find(function (item) { return item.key === key; });
    }

    function applyFilters(area, preview) {
      var orderMap = {};
      area.forEach(function (item, index) { orderMap[item.key] = index; });
      filterParents.forEach(function (parent) {
        var actionAnchor = Array.prototype.find.call(parent.children, function (child) {
          return child.classList && child.classList.contains('form-actions');
        }) || null;
        filterItems
          .filter(function (item) { return item.parent === parent; })
          .sort(function (a, b) { return orderMap[a.key] - orderMap[b.key]; })
          .forEach(function (item) { parent.insertBefore(item.node, actionAnchor); });
      });
      area.forEach(function (state) {
        var item = findFilter(state.key);
        if (!item) return;
        var wasVisible = item.node.style.display !== 'none';
        item.node.hidden = !state.visible;
        item.node.style.setProperty('display', state.visible ? '' : 'none', state.visible ? '' : 'important');
        if (preview && wasVisible && !state.visible) clearField(item);
      });
      updateFilterEntry(area);
    }

    function mapRowCells(row) {
      var cells = Array.prototype.slice.call(row.children).filter(function (cell) {
        return cell.tagName === 'TD' || cell.tagName === 'TH';
      });
      if (!cells.length || cells.every(function (cell) { return cell.hasAttribute('data-lf-view-column-key'); })) return;
      var definitions = defaultHeaders;
      if (cells.length === defaultHeaders.length - 1 && defaultHeaders[0] && defaultHeaders[0].key === '__selection') {
        definitions = defaultHeaders.slice(1);
      }
      cells.forEach(function (cell, index) {
        if (!cell.hasAttribute('data-lf-view-column-key') && definitions[index]) {
          cell.setAttribute('data-lf-view-column-key', definitions[index].key);
        }
      });
    }

    function columnRank(item) {
      if (item.system && item.systemPosition === 'left') return 0;
      if (item.configurable && item.pin === 'left') return 1;
      if (!item.system && (!item.configurable || item.pin === 'none')) return 2;
      if (item.configurable && item.pin === 'right') return 3;
      return 4;
    }

    function orderedHeaders(area) {
      var areaMap = {};
      area.forEach(function (item) { areaMap[item.key] = item; });
      return defaultHeaders
        .map(function (header) {
          var state = areaMap[header.key];
          return Object.assign({}, header, state || {});
        })
        .sort(function (a, b) {
          var rankDelta = columnRank(a) - columnRank(b);
          if (rankDelta) return rankDelta;
          if (a.system || b.system || !a.configurable || !b.configurable) return a.originalIndex - b.originalIndex;
          return a.order - b.order;
        });
    }

    function applySticky(ordered, areaMap) {
      var left = 0;
      var right = 0;
      ordered.forEach(function (definition) {
        var header = findHeader(definition.key);
        var state = areaMap[definition.key];
        var pin = definition.system
          ? definition.systemPosition
          : (state ? state.pin : 'none');
        var visible = definition.system || !state || state.visible !== false;
        var width = definition.system ? header.node.offsetWidth : (state && state.width);
        var cells = table.querySelectorAll('[data-lf-view-column-key="' + definition.key + '"]');
        Array.prototype.forEach.call(cells, function (cell) {
          cell.classList.remove('lf-view-cell--pinned');
          cell.style.left = '';
          cell.style.right = '';
          if (visible && pin === 'left') {
            cell.style.position = 'sticky';
            cell.style.left = left + 'px';
            cell.classList.add('lf-view-cell--pinned');
          } else if (visible && pin === 'right') {
            cell.style.position = 'sticky';
            cell.style.right = right + 'px';
            cell.classList.add('lf-view-cell--pinned');
          } else if (!definition.system) {
            cell.style.position = '';
          }
        });
        if (visible && pin === 'left') left += Number(width) || header.node.offsetWidth || 120;
      });
      ordered.slice().reverse().forEach(function (definition) {
        var state = areaMap[definition.key];
        var pin = definition.system ? definition.systemPosition : (state ? state.pin : 'none');
        var visible = definition.system || !state || state.visible !== false;
        if (!visible || pin !== 'right') return;
        var header = findHeader(definition.key);
        var cells = table.querySelectorAll('[data-lf-view-column-key="' + definition.key + '"]');
        Array.prototype.forEach.call(cells, function (cell) { cell.style.right = right + 'px'; });
        right += Number(state && state.width) || header.node.offsetWidth || 120;
      });
    }

    function ensureResizers() {
      defaultColumns.forEach(function (definition) {
        var header = definition.node;
        if (header.querySelector('.lf-view-column-resizer')) return;
        var resizer = document.createElement('span');
        resizer.className = 'lf-view-column-resizer';
        resizer.setAttribute('aria-hidden', 'true');
        resizer.addEventListener('pointerdown', function (event) {
          event.preventDefault();
          event.stopPropagation();
          var startX = event.clientX;
          var current = fieldState(saved.columns, definition.key);
          var startWidth = (current && current.width) || header.offsetWidth;
          resizer.classList.add('is-active');
          function move(moveEvent) {
            var width = clampWidth(startWidth + moveEvent.clientX - startX, startWidth);
            var state = fieldState(saved.columns, definition.key);
            if (state) state.width = width;
            applyColumns(saved.columns);
          }
          function end() {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', end);
            resizer.classList.remove('is-active');
            window.clearTimeout(widthSaveTimer);
            widthSaveTimer = window.setTimeout(function () {
              if (!persist()) notifyPreferenceFailure('列宽保留在当前页面，但自动保存失败');
            }, 500);
          }
          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', end);
        });
        header.appendChild(resizer);
      });
    }

    function applyColumns(area) {
      if (!headerRow) return;
      var areaMap = {};
      area.forEach(function (item) { areaMap[item.key] = item; });
      var ordered = orderedHeaders(area);
      applyingRows = true;
      ordered.forEach(function (definition) { headerRow.appendChild(definition.node); });
      Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (row) {
        mapRowCells(row);
        var cellMap = {};
        Array.prototype.forEach.call(row.children, function (cell) {
          var key = cell.getAttribute('data-lf-view-column-key');
          if (key) cellMap[key] = cell;
        });
        ordered.forEach(function (definition) {
          if (cellMap[definition.key]) row.appendChild(cellMap[definition.key]);
        });
      });
      ordered.forEach(function (definition) {
        var state = areaMap[definition.key];
        var visible = definition.system || !state || state.visible !== false;
        var width = state && state.width;
        var cells = table.querySelectorAll('[data-lf-view-column-key="' + definition.key + '"]');
        Array.prototype.forEach.call(cells, function (cell) {
          cell.hidden = !visible;
          cell.style.setProperty('display', visible ? '' : 'none', visible ? '' : 'important');
          if (!definition.system && width) {
            cell.style.width = width + 'px';
            cell.style.minWidth = width + 'px';
            cell.style.maxWidth = width + 'px';
          }
        });
      });
      applySticky(ordered, areaMap);
      ensureResizers();
      applyingRows = false;
      updateColumnEntry(area);
    }

    function persist() {
      var preference = { formatVersion: VERSION };
      if (!isDefaultArea(saved.filters, defaultFilterStates, 'filters')) {
        preference.filters = saved.filters.map(function (item) {
          return { key: item.key, visible: item.visible, order: item.order };
        });
      }
      if (!isDefaultArea(saved.columns, defaultColumnStates, 'columns')) {
        preference.columns = saved.columns.filter(function (item) { return !item.isNew; }).map(function (item) {
          return { key: item.key, visible: item.visible, order: item.order, pin: item.pin, width: item.width };
        });
      }
      if (!preference.filters && !preference.columns) return removeStorage(profile.preferenceKey);
      return writeStorage(profile.preferenceKey, preference);
    }

    var filterEntry;
    var columnEntry;

    function updateFilterEntry(area) {
      if (!filterEntry) return;
      var count = area.filter(function (item) { return item.visible; }).length;
      filterEntry.textContent = '管理筛选项 · ' + count;
      filterEntry.setAttribute('aria-label', '管理筛选项 · ' + count);
    }

    function updateColumnEntry(area) {
      if (!columnEntry) return;
      var count = area.filter(function (item) { return item.visible; }).length;
      columnEntry.title = '已显示 ' + count + ' 列';
    }

    function mountEntries() {
      var filterHost = document.querySelector(profile.filterEntryHost);
      if (filterHost) {
        filterHost.classList.add('lf-view-entry-host');
        filterEntry = document.createElement('button');
        filterEntry.type = 'button';
        filterEntry.className = 'lf-view-entry lf-view-entry--filter';
        filterEntry.addEventListener('click', function () { openDrawer('filters'); });
        filterHost.appendChild(filterEntry);
      }

      var tableHost = profile.tableEntryHost && document.querySelector(profile.tableEntryHost);
      if (!tableHost && profile.tableSection) {
        var section = document.querySelector(profile.tableSection);
        if (section) {
          tableHost = document.createElement('div');
          tableHost.className = 'lf-view-table-toolbar';
          section.insertBefore(tableHost, section.firstChild);
        }
      }
      if (tableHost) {
        tableHost.classList.add('lf-view-entry-host');
        columnEntry = document.createElement('button');
        columnEntry.type = 'button';
        columnEntry.className = 'lf-view-entry lf-view-entry--column';
        columnEntry.textContent = '列设置';
        columnEntry.addEventListener('click', function () { openDrawer('columns'); });
        tableHost.appendChild(columnEntry);
      }
      updateFilterEntry(saved.filters);
      updateColumnEntry(saved.columns);
    }

    function normalizeOrders(area) {
      area.forEach(function (item, index) { item.order = index; });
    }

    function sortPinGroups(area) {
      return ['left', 'none', 'right'].reduce(function (result, pin) {
        return result.concat(area.filter(function (item) { return item.pin === pin; }));
      }, []);
    }

    function movePin(key, pin) {
      var index = draft.findIndex(function (item) { return item.key === key; });
      if (index < 0 || draft[index].pin === pin) return;
      var item = draft.splice(index, 1)[0];
      item.pin = pin;
      var lastTarget = draft.reduce(function (last, candidate, candidateIndex) {
        return candidate.pin === pin ? candidateIndex : last;
      }, -1);
      draft.splice(lastTarget + 1, 0, item);
      draft = sortPinGroups(draft);
      normalizeOrders(draft);
      previewDraft();
      renderDrawerList();
    }

    function moveBefore(sourceKey, targetKey) {
      if (!sourceKey || sourceKey === targetKey) return;
      var sourceIndex = draft.findIndex(function (item) { return item.key === sourceKey; });
      var targetIndex = draft.findIndex(function (item) { return item.key === targetKey; });
      if (sourceIndex < 0 || targetIndex < 0) return;
      if (openKind === 'columns' && draft[sourceIndex].pin !== draft[targetIndex].pin) return;
      var item = draft.splice(sourceIndex, 1)[0];
      targetIndex = draft.findIndex(function (entry) { return entry.key === targetKey; });
      draft.splice(targetIndex, 0, item);
      normalizeOrders(draft);
      previewDraft();
      renderDrawerList();
    }

    function previewDraft() {
      if (openKind === 'filters') applyFilters(draft, true);
      else applyColumns(draft);
    }

    function notifyPreferenceFailure(message) {
      if (typeof window.showToast === 'function') window.showToast(message || '个人视图保存失败', 'error');
    }

    function showDrawerFeedback(message) {
      if (!drawer) return;
      var feedback = drawer.querySelector('[data-lf-view-feedback]');
      if (feedback) feedback.textContent = message || '';
    }

    function renderDrawerList() {
      if (!drawer) return;
      var list = drawer.querySelector('[data-lf-view-list]');
      var summary = drawer.querySelector('[data-lf-view-summary]');
      var keyword = cleanLabel(drawer.querySelector('[data-lf-view-search]').value).toLowerCase();
      var visibleCount = draft.filter(function (item) { return item.visible; }).length;
      summary.innerHTML =
        '<span><strong>' + visibleCount + '</strong>/ ' + draft.length + (openKind === 'columns' ? ' 列已显示' : ' 个筛选项已显示') + '</span>' +
        '<button type="button" class="lf-view-button lf-view-button--text lf-view-drawer__show-all" data-lf-view-show-all>全部显示</button>';

      function matchesKeyword(item) {
        return !keyword || (item.label + ' ' + item.key).toLowerCase().indexOf(keyword) >= 0;
      }

      function renderItem(item) {
        var hiddenBySearch = !matchesKeyword(item);
        var badge = item.isNew ? '<span class="lf-view-item__new">新增</span>' : '';
        var required = item.required ? '<span class="lf-view-item__required">必选</span>' : '';
        var pins = openKind === 'columns'
          ? '<span class="lf-view-item__pins">' +
              '<button type="button" class="lf-view-item__pin" data-lf-view-pin="left" aria-label="固定左侧 ' + escapeHtml(item.label) + '"' + (item.pin === 'left' ? ' disabled' : '') + '>左</button>' +
              '<button type="button" class="lf-view-item__pin lf-view-item__pin--neutral" data-lf-view-pin="none" aria-label="取消固定 ' + escapeHtml(item.label) + '"' + (item.pin === 'none' ? ' disabled' : '') + '>取消 Pin</button>' +
              '<button type="button" class="lf-view-item__pin" data-lf-view-pin="right" aria-label="固定右侧 ' + escapeHtml(item.label) + '"' + (item.pin === 'right' ? ' disabled' : '') + '>右</button>' +
            '</span>'
          : '';
        return '<div class="lf-view-item" draggable="' + (keyword ? 'false' : 'true') + '" data-lf-view-item="' + escapeHtml(item.key) + '"' + (hiddenBySearch ? ' hidden' : '') + '>' +
          '<span class="lf-view-item__drag" aria-hidden="true">↕</span>' +
          '<input type="checkbox" data-lf-view-visible aria-label="' + escapeHtml(item.label) + '"' + (item.visible ? ' checked' : '') + (item.required ? ' disabled' : '') + '>' +
          '<span class="lf-view-item__label" title="' + escapeHtml(item.label) + '">' + escapeHtml(item.label) + badge + required + '</span>' +
          pins +
        '</div>';
      }

      if (openKind === 'filters') {
        list.innerHTML = '<div class="lf-view-group lf-view-group--filters"><div class="lf-view-list">' + draft.map(renderItem).join('') + '</div></div>';
        return;
      }

      list.innerHTML = [
        { pin: 'left', label: '固定左侧', icon: '←' },
        { pin: 'none', label: '普通列', icon: '↕' },
        { pin: 'right', label: '固定右侧', icon: '→' }
      ].map(function (group) {
        var groupItems = draft.filter(function (item) { return item.pin === group.pin; });
        var matchingItems = groupItems.filter(matchesKeyword);
        return '<section class="lf-view-group" data-lf-view-group="' + group.pin + '">' +
          '<header class="lf-view-group__head"><span><span class="lf-view-group__icon" aria-hidden="true">' + group.icon + '</span><strong>' + group.label + '</strong></span><span>' + groupItems.length + '</span></header>' +
          '<div class="lf-view-list">' + (matchingItems.length ? groupItems.map(renderItem).join('') : '<div class="lf-view-group__empty">暂无匹配字段</div>') + '</div>' +
        '</section>';
      }).join('');
    }

    function closeDrawer(cancel) {
      if (!drawer) return;
      if (cancel) {
        if (openKind === 'filters') {
          applyFilters(saved.filters, false);
          restoreValues(openValues);
        } else {
          applyColumns(saved.columns);
        }
      }
      drawer.remove();
      backdrop.remove();
      drawer = null;
      backdrop = null;
      document.body.style.overflow = '';
      (openKind === 'filters' ? filterEntry : columnEntry).focus();
      openKind = '';
      draft = null;
      openValues = null;
    }

    function saveDraft() {
      var shouldQuery = false;
      var previousArea;
      if (openKind === 'filters') {
        shouldQuery = draft.some(function (item) {
          var previous = fieldState(saved.filters, item.key);
          return previous && previous.visible && !item.visible;
        });
        previousArea = clone(saved.filters);
        saved.filters = clone(draft);
        saved.filters.forEach(function (item) { item.isNew = false; });
        applyFilters(saved.filters, false);
      } else {
        previousArea = clone(saved.columns);
        saved.columns = clone(draft);
        saved.columns.forEach(function (item) { item.isNew = false; });
        applyColumns(saved.columns);
      }
      if (!persist()) {
        if (openKind === 'filters') saved.filters = previousArea;
        else saved.columns = previousArea;
        showDrawerFeedback('保存失败，请检查浏览器存储权限后重试');
        notifyPreferenceFailure('个人视图保存失败');
        return;
      }
      closeDrawer(false);
      if (shouldQuery && profile.queryButton) {
        var query = document.querySelector(profile.queryButton);
        if (query) query.click();
      }
      if (typeof window.showToast === 'function') window.showToast('个人视图已保存', 'success');
    }

    function resetDraft() {
      draft = clone(openKind === 'filters'
        ? defaultFilterStates
        : defaultColumnStates);
      previewDraft();
      renderDrawerList();
    }

    function openDrawer(kind) {
      if (drawer) closeDrawer(true);
      openKind = kind;
      draft = clone(kind === 'filters' ? saved.filters : saved.columns);
      openValues = kind === 'filters' ? captureValues(filterItems) : null;

      backdrop = document.createElement('div');
      backdrop.className = 'lf-view-backdrop';
      backdrop.addEventListener('click', function () { closeDrawer(true); });
      drawer = document.createElement('section');
      drawer.className = 'lf-view-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-label', kind === 'filters' ? '管理筛选项' : '列设置');
      drawer.innerHTML =
        '<header class="lf-view-drawer__head">' +
          '<div class="lf-view-drawer__heading"><span class="lf-view-drawer__eyebrow">个人视图</span><h2 class="lf-view-drawer__title">' + (kind === 'filters' ? '管理筛选项' : '列设置') + '</h2>' +
          '<p class="lf-view-drawer__hint">仅影响你的个人视图，保存后可在其他设备恢复</p></div>' +
          '<button type="button" class="lf-view-drawer__close" data-lf-view-close aria-label="关闭">×</button>' +
        '</header>' +
        '<div class="lf-view-drawer__content">' +
        '<div class="lf-view-drawer__summary" data-lf-view-summary></div>' +
        '<div class="lf-view-drawer__tools">' +
          '<label class="lf-view-drawer__search-wrap"><span aria-hidden="true">⌕</span><input class="lf-view-drawer__search" data-lf-view-search type="search" placeholder="搜索字段" aria-label="搜索字段"></label>' +
          '<button type="button" class="lf-view-button" data-lf-view-reset><span aria-hidden="true">↻</span> 恢复默认</button>' +
        '</div>' +
        '<div class="lf-view-drawer__feedback" role="status" aria-live="polite" data-lf-view-feedback></div>' +
        '<div class="lf-view-drawer__body"><div data-lf-view-list></div></div>' +
        '</div>' +
        '<footer class="lf-view-drawer__foot">' +
          '<span class="lf-view-drawer__foot-note">设置按用户、租户和当前页面隔离</span>' +
          '<button type="button" class="lf-view-button" data-lf-view-cancel>取消</button>' +
          '<button type="button" class="lf-view-button lf-view-button--primary" data-lf-view-save>保存视图</button>' +
        '</footer>';

      document.body.appendChild(backdrop);
      document.body.appendChild(drawer);
      document.body.style.overflow = 'hidden';
      renderDrawerList();

      drawer.addEventListener('input', function (event) {
        if (event.target.matches('[data-lf-view-search]')) {
          renderDrawerList();
        }
      });
      drawer.addEventListener('change', function (event) {
        var row = event.target.closest('[data-lf-view-item]');
        if (!row) return;
        var state = fieldState(draft, row.getAttribute('data-lf-view-item'));
        if (!state) return;
        if (event.target.matches('[data-lf-view-visible]')) {
          if (
            openKind === 'columns' &&
            !event.target.checked &&
            draft.filter(function (item) { return item.visible; }).length <= 1
          ) {
            event.target.checked = true;
            showDrawerFeedback('至少保留一个业务列');
            return;
          }
          state.visible = event.target.checked;
          showDrawerFeedback('');
        }
        previewDraft();
        renderDrawerList();
      });
      drawer.addEventListener('click', function (event) {
        if (event.target.closest('[data-lf-view-close], [data-lf-view-cancel]')) return closeDrawer(true);
        if (event.target.closest('[data-lf-view-save]')) return saveDraft();
        if (event.target.closest('[data-lf-view-reset]')) return resetDraft();
        if (event.target.closest('[data-lf-view-show-all]')) {
          draft.forEach(function (item) { if (!item.required) item.visible = true; });
          previewDraft();
          renderDrawerList();
          return;
        }
        var pin = event.target.closest('[data-lf-view-pin]');
        if (pin) {
          var row = pin.closest('[data-lf-view-item]');
          movePin(row.getAttribute('data-lf-view-item'), pin.getAttribute('data-lf-view-pin'));
          return;
        }
      });
      drawer.addEventListener('dragstart', function (event) {
        var row = event.target.closest('[data-lf-view-item]');
        if (!row) return;
        if (cleanLabel(drawer.querySelector('[data-lf-view-search]').value)) {
          event.preventDefault();
          return;
        }
        row.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', row.getAttribute('data-lf-view-item'));
      });
      drawer.addEventListener('dragend', function (event) {
        var row = event.target.closest('[data-lf-view-item]');
        if (row) row.classList.remove('is-dragging');
      });
      drawer.addEventListener('dragover', function (event) {
        if (event.target.closest('[data-lf-view-item]')) event.preventDefault();
      });
      drawer.addEventListener('drop', function (event) {
        var row = event.target.closest('[data-lf-view-item]');
        if (!row) return;
        event.preventDefault();
        moveBefore(event.dataTransfer.getData('text/plain'), row.getAttribute('data-lf-view-item'));
      });
      drawer.querySelector('[data-lf-view-search]').focus();
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer) closeDrawer(true);
    });

    var body = table.tBodies && table.tBodies[0];
    if (body && window.MutationObserver) {
      new MutationObserver(function () {
        if (applyingRows) return;
        window.requestAnimationFrame(function () {
          if (!applyingRows) applyColumns(drawer && openKind === 'columns' ? draft : saved.columns);
        });
      }).observe(body, { childList: true });
    }

    mountEntries();
    applyFilters(saved.filters, false);
    applyColumns(saved.columns);
    table.setAttribute('data-lf-personal-view', profile.preferenceKey);
    return {
      preferenceKey: profile.preferenceKey,
      openFilters: function () { openDrawer('filters'); },
      openColumns: function () { openDrawer('columns'); }
    };
  }

  function init() {
    var path = normalizePath(window.location.pathname);
    var profile = profiles[path];
    if (!profile && !/\.html$/.test(path)) profile = profiles[path + '.html'];
    if (!profile) return;
    var controller = createController(profile);
    if (controller) {
      window.LfTablePersonalView = window.LfTablePersonalView || {};
      window.LfTablePersonalView.current = controller;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
