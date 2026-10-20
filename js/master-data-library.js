/**
 * 主数据 · 基础商品库：左侧四级分类筛选，右侧商品列表
 */
(function () {
  var store = window.MasterDataCategoryStore;
  if (!store) return;

  function attrPick(name, value, parentName, parentValue) {
    return { name: name, value: value, parentName: parentName || '', parentValue: parentValue || '' };
  }

  /** 商品属性取值与商品分类种子一致，含继承属性和二级属性 */
  var PRODUCTS = [
    { category: '五花肉', spuKey: 'pork-xlb', sku: '4134001', barcode: '6974562300012', barcodeCount: 3, name: '生物发面猪肉小笼包 50g 100个/包', brand: '冷丰优选', purchasePrice: 18.8, purchaseQty: 12800, purchaseUnit: '箱', minQty: 25600000, minUnit: '个', specQty: 256000, specUnit: '包', packQty: 12800, packUnit: '箱', amount: 240640, tone: 'blue', mark: '笼', attrs: [attrPick('储存条件', '冷藏'), attrPick('配送时效', '当日达'), attrPick('储存温度', '0-4℃'), attrPick('分割', '切片'), attrPick('肥瘦', '五花'), attrPick('厚度', '薄'), attrPick('部位', '前五花')] },
    { category: '里脊', spuKey: 'beef-xlb', sku: '4134001', barcode: '6974562300013', barcodeCount: 3, name: '生物发面牛肉小笼包 50g 100个/包', brand: '冷丰优选', purchasePrice: 18.8, purchaseQty: 6200, purchaseUnit: '箱', minQty: 12400000, minUnit: '个', specQty: 124000, specUnit: '包', packQty: 6200, packUnit: '箱', amount: 116560, tone: 'orange', mark: '笼', attrs: [attrPick('储存条件', '冷冻'), attrPick('配送时效', '次日达'), attrPick('储存温度', '冷冻'), attrPick('分割', '整块'), attrPick('肥瘦', '瘦'), attrPick('厚度', '薄片'), attrPick('是否腌制', '鲜肉')] },
    { category: '茄子', sku: '4134101', barcode: '6974562300101', barcodeCount: 1, name: '圆茄 优质', brand: '冷丰优选', purchasePrice: 3.5, purchaseQty: 860, purchaseUnit: '箱', minQty: 8600, minUnit: '斤', specQty: 860, specUnit: '箱', packQty: 860, packUnit: '箱', amount: 3010, tone: 'green', mark: '茄', attrs: [attrPick('储存条件', '冷藏'), attrPick('配送时效', '当日达'), attrPick('是否洗净', '已洗净'), attrPick('产地类型', '本地'), attrPick('等级', '一级', '产地类型', '本地'), attrPick('是否有机', '有机'), attrPick('产地', '本地'), attrPick('等级', '二级', '产地', '本地'), attrPick('果型', '圆茄')] },
    { category: '西红柿', sku: '4134102', barcode: '6974562300102', barcodeCount: 1, name: '普罗旺斯西红柿', brand: '冷丰优选', purchasePrice: 4, purchaseQty: 420, purchaseUnit: '箱', minQty: 4200, minUnit: '斤', specQty: 420, specUnit: '箱', packQty: 420, packUnit: '箱', amount: 1680, tone: 'orange', mark: '西', attrs: [attrPick('储存条件', '常温'), attrPick('配送时效', '次日达'), attrPick('是否洗净', '未洗净'), attrPick('产地类型', '外地'), attrPick('是否有机', '普通'), attrPick('果型', '大果'), attrPick('成熟度', '硬熟')] },
    { category: '可乐', sku: '4134201', barcode: '6974562300201', barcodeCount: 1, name: '可口可乐摩登罐', brand: '冷丰优选', purchasePrice: 52, purchaseQty: 2400, purchaseUnit: '箱', minQty: 57600, minUnit: '罐', specQty: 2400, specUnit: '箱', packQty: 2400, packUnit: '箱', amount: 124800, tone: 'blue', mark: '可', attrs: [attrPick('包装形式', '罐装'), attrPick('容量档', '小'), attrPick('饮用温度', '冷藏'), attrPick('气量', '标准'), attrPick('容量', '330ml'), attrPick('是否含糖', '有糖')] },
    { category: '东北大米', sku: '4134301', barcode: '6974562300301', barcodeCount: 1, name: '东北大米 5kg', brand: '冷丰优选', purchasePrice: 32, purchaseQty: 1500, purchaseUnit: '箱', minQty: 1500, minUnit: '袋', specQty: 1500, specUnit: '袋', packQty: 1500, packUnit: '箱', amount: 48000, tone: 'green', mark: '米', attrs: [attrPick('包装', '袋装'), attrPick('保质期', '12个月'), attrPick('加工精度', '精制'), attrPick('稻种', '粳米'), attrPick('规格', '5kg'), attrPick('产地', '黑龙江')] },
    { category: '苹果', sku: '4134401', barcode: '6974562300401', barcodeCount: 1, name: '红富士苹果', brand: '冷丰优选', purchasePrice: 8, purchaseQty: 960, purchaseUnit: '箱', minQty: 9600, minUnit: '个', specQty: 960, specUnit: '箱', packQty: 960, packUnit: '箱', amount: 7680, tone: 'orange', mark: '苹', attrs: [attrPick('储存条件', '冷藏'), attrPick('配送时效', '当日达'), attrPick('成熟度', '适中'), attrPick('规格', '中果'), attrPick('口感', '脆'), attrPick('品种', '红富士'), attrPick('果径', '75mm')] },
    { category: '纸杯', sku: '4134501', barcode: '6974562300501', barcodeCount: 1, name: '加厚纸杯 250ml', brand: '冷丰优选', purchasePrice: 7, purchaseQty: 300, purchaseUnit: '箱', minQty: 30000, minUnit: '个', specQty: 300, specUnit: '箱', packQty: 300, packUnit: '箱', amount: 2100, tone: 'blue', mark: '杯', attrs: [attrPick('材质', '纸质'), attrPick('是否重复使用', '否'), attrPick('是否降解', '可降解'), attrPick('餐具材质', '纸'), attrPick('容量', '250ml'), attrPick('覆膜', '单层')] }
  ];

  var state = {
    selectedL1: null,
    selectedL2: null,
    selectedL3: null,
    selectedL4: null,
    tab: 'base',
    filter: [],
    filterDraft: null,
    goodsDraft: null,
    goodsEditing: null,
    goodsSpecIndex: null,
    goodsCategoryId: null,
    query: { spu: '', sku: '', barcode: '', name: '', brand: '', status: '' },
    page: 1,
    pageSize: 20
  };

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatNum(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatPrice(n) {
    var num = Number(n) || 0;
    var parts = num.toFixed(2).split('.');
    return '¥' + formatNum(parts[0]) + '.' + parts[1];
  }

  function formatQty(value) {
    var num = Number(value);
    if (!isFinite(num) || num < 1) return '—';
    return String(Math.round(num));
  }

  function selectedId(level) {
    return state['selectedL' + level];
  }

  function focusCategory() {
    return store.getNode(state.selectedL4 || state.selectedL3 || state.selectedL2 || state.selectedL1);
  }

  function renderStatusTag(status) {
    if (status === 'off_shelf') return '<span class="product-tag product-tag--stopped">隐藏</span>';
    return '<span class="product-tag product-tag--on-shelf">显示</span>';
  }

  function renderListItem(node, selectedIdValue) {
    var active = node.id === selectedIdValue ? ' is-active' : '';
    var off = node.status === 'off_shelf' ? ' is-off' : '';
    var iconHtml = node.icon
      ? '<img class="product-category-cascade__avatar" src="' + node.icon + '" alt="">'
      : '<span class="product-category-cascade__avatar product-category-cascade__avatar--placeholder">' + escapeHtml(node.name.charAt(0)) + '</span>';
    return (
      '<li class="product-category-cascade__item' + active + off + '" data-id="' + node.id + '" data-level="' + node.level + '">' +
      iconHtml +
      '<span class="product-category-cascade__name">' + escapeHtml(node.name) + '</span>' +
      renderStatusTag(node.status) +
      '<span class="product-category-cascade__count">' + node.product_count + '</span>' +
      '</li>'
    );
  }

  function renderAllItem(level, selectedIdValue) {
    var active = selectedIdValue ? '' : ' is-active';
    return '<li class="product-category-cascade__item mdl-cat-all' + active + '" data-all="1" data-level="' + level + '"><span class="product-category-cascade__name">全部</span></li>';
  }

  function renderColumn(listEl, nodes, selectedIdValue, level, showAll, emptyText) {
    if (!listEl) return;
    var html = showAll ? renderAllItem(level, selectedIdValue) : '';
    if (nodes.length) {
      html += nodes.map(function (node) { return renderListItem(node, selectedIdValue); }).join('');
    }
    if (!html) {
      listEl.innerHTML = '<li class="product-category-cascade__empty">' + escapeHtml(emptyText) + '</li>';
      return;
    }
    listEl.innerHTML = html;
  }

  function categoryIdsInScope() {
    var focus = focusCategory();
    if (!focus) return null;
    var ids = {};
    store.collectDescendantIds(focus.id).forEach(function (id) { ids[id] = true; });
    return ids;
  }

  function compareSpu(left, right) {
    var a = String((left && left.spu) || '');
    var b = String((right && right.spu) || '');
    if (a === b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, 'en', { numeric: true });
  }

  function visibleProducts() {
    var ids = categoryIdsInScope();
    return PRODUCTS.filter(function (item) {
      var node = categoryNodeByName(item.category);
      if (!node) return false;
      if (ids && !ids[node.id]) return false;
      if (!matchesQuery(item)) return false;
      return matchesFilters(item);
    }).sort(compareSpu);
  }

  function categoryNodeByName(name) {
    return store.getCategories().filter(function (category) {
      return category.name === name && category.level === 4;
    })[0] || null;
  }

  function renderCategories() {
    var l1 = store.getByLevel(1);
    var l2 = state.selectedL1 ? store.getChildren(state.selectedL1) : [];
    var l3 = state.selectedL2 ? store.getChildren(state.selectedL2) : [];
    var l4 = state.selectedL3 ? store.getChildren(state.selectedL3) : [];
    renderColumn(document.getElementById('catListL1'), l1, state.selectedL1, 1, true, '暂无一级分类');
    renderColumn(document.getElementById('catListL2'), l2, state.selectedL2, 2, !!state.selectedL1, state.selectedL1 ? '该一级下暂无二级分类' : '请先选择一级分类');
    renderColumn(document.getElementById('catListL3'), l3, state.selectedL3, 3, !!state.selectedL2, state.selectedL2 ? '该二级下暂无三级分类' : '请先选择二级分类');
    renderColumn(document.getElementById('catListL4'), l4, state.selectedL4, 4, !!state.selectedL3, state.selectedL3 ? '该三级下暂无四级分类' : '请先选择三级分类');
    var l1Node = state.selectedL1 ? store.getNode(state.selectedL1) : null;
    var l2Node = state.selectedL2 ? store.getNode(state.selectedL2) : null;
    var l3Node = state.selectedL3 ? store.getNode(state.selectedL3) : null;
    var hintL2 = document.getElementById('catHintL2');
    var hintL3 = document.getElementById('catHintL3');
    var hintL4 = document.getElementById('catHintL4');
    if (hintL2) hintL2.textContent = l1Node ? '所属：' + l1Node.name : '请先选择一级分类';
    if (hintL3) hintL3.textContent = l2Node ? '所属：' + (l1Node ? l1Node.name + ' / ' : '') + l2Node.name : '请先选择二级分类';
    if (hintL4) hintL4.textContent = l3Node ? '所属：' + [l1Node && l1Node.name, l2Node && l2Node.name, l3Node.name].filter(Boolean).join(' / ') : '请先选择三级分类';
    syncAddGoodsBtn();
  }

  function syncAddGoodsBtn() {
    var btn = document.getElementById('libAddGoodsBtn');
    if (!btn) return;
    var enabled = !!state.selectedL4;
    btn.disabled = !enabled;
    btn.title = enabled ? '添加商品' : '请先选择四级分类';
  }

  function renderStats(list) {
    var box = document.getElementById('libStats');
    if (!box) return;
    var goods = list.length;
    var barcodes = list.reduce(function (sum, item) { return sum + (item.barcodeCount || 1); }, 0);
    var cards = [
      ['商品数量', formatNum(goods)],
      ['商品条码数量', formatNum(barcodes)]
    ];
    box.innerHTML = cards.map(function (card) {
      return '<div class="mdl-stat"><div class="mdl-stat__label">' + card[0] + '</div><div class="mdl-stat__value">' + card[1] + '</div></div>';
    }).join('');
  }

  function goodsStatus(item) {
    return item && item.status === 'disabled' ? 'disabled' : 'active';
  }

  function renderTable(list) {
    var body = document.getElementById('libTableBody');
    if (!body) return;
    if (!list.length) {
      var emptyText = hasActiveQuery() ? '暂无符合条件的商品' : '该分类下暂无商品';
      body.innerHTML = '<tr><td class="mdl-table-empty" colspan="13">' + emptyText + '</td></tr>';
      return;
    }
    var start = (state.page - 1) * state.pageSize;
    body.innerHTML = list.slice(start, start + state.pageSize).map(function (item) {
      return (
        '<tr>' +
        '<td>' + escapeHtml(item.spu) + '</td>' +
        '<td><button type="button" class="mdl-sku-link" data-lib-detail="' + PRODUCTS.indexOf(item) + '">' + escapeHtml(item.sku) + '</button></td>' +
        '<td>' + escapeHtml(item.barcode) + '</td>' +
        '<td><span class="mdl-thumb mdl-thumb--' + item.tone + '">' + escapeHtml(item.mark) + '</span></td>' +
        '<td class="mdl-table__name">' + escapeHtml(item.name) + '</td>' +
        '<td><span class="mdl-status mdl-status--' + goodsStatus(item) + '">' + (goodsStatus(item) === 'disabled' ? '停用' : '启用') + '</span></td>' +
        '<td>' + escapeHtml(item.brand) + '</td>' +
        '<td>' + formatPrice(item.purchasePrice) + '</td>' +
        '<td>' + escapeHtml(item.purchaseUnit) + '</td>' +
        '<td>' + escapeHtml(item.minUnit) + '</td>' +
        '<td>' + escapeHtml(item.specUnit) + '</td>' +
        '<td>' + escapeHtml(item.packUnit) + '</td>' +
        '<td class="mdl-table__op"><div class="mdl-table__ops">' +
        '<button type="button" class="mdl-op-btn" data-lib-spec="' + PRODUCTS.indexOf(item) + '">添加规格</button>' +
        '<button type="button" class="mdl-op-btn" data-lib-status="' + PRODUCTS.indexOf(item) + '">' + (goodsStatus(item) === 'disabled' ? '启用' : '停用') + '</button>' +
        '</div></td>' +
        '</tr>'
      );
    }).join('');
  }

  function activeFilters() {
    return state.filterDraft || state.filter || [];
  }

  function hasActiveQuery() {
    var query = state.query || {};
    return !!(query.spu || query.sku || query.barcode || query.name || query.brand || query.status || activeFilters().length);
  }

  function matchesQuery(item) {
    var query = state.query || {};
    function contains(field, keyword) {
      if (!keyword) return true;
      return String(field || '').toLowerCase().indexOf(String(keyword).toLowerCase()) >= 0;
    }
    if (!contains(item.spu, query.spu)) return false;
    if (!contains(item.sku, query.sku)) return false;
    if (!contains(item.barcode, query.barcode)) return false;
    if (!contains(item.name, query.name)) return false;
    if (query.brand && item.brand !== query.brand) return false;
    if (query.status && goodsStatus(item) !== query.status) return false;
    return true;
  }

  function readQueryForm() {
    function valueOf(id) {
      var el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    }
    return {
      spu: valueOf('libQuerySpu'),
      sku: valueOf('libQuerySku'),
      barcode: valueOf('libQueryBarcode'),
      name: valueOf('libQueryName'),
      brand: valueOf('libQueryBrand'),
      status: valueOf('libQueryStatus')
    };
  }

  function applyQuery() {
    state.query = readQueryForm();
    state.page = 1;
    renderLibrary();
  }

  function resetQuery() {
    ['libQuerySpu', 'libQuerySku', 'libQueryBarcode', 'libQueryName', 'libQueryBrand', 'libQueryStatus'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    state.query = { spu: '', sku: '', barcode: '', name: '', brand: '', status: '' };
    state.page = 1;
    renderLibrary();
  }

  function sameFilter(left, right) {
    return left.name === right.name && left.value === right.value &&
      (left.parentName || '') === (right.parentName || '') &&
      (left.parentValue || '') === (right.parentValue || '');
  }

  function filterGroupKey(entry) {
    return [entry.parentName || '', entry.parentValue || '', entry.name].join('\u0001');
  }

  function filterLabel(entry) {
    if (entry.parentValue) return entry.name + '（' + entry.parentValue + '）';
    return entry.name;
  }

  function readFilterEntry(el) {
    return {
      name: el.getAttribute('data-filter-name') || '',
      value: el.getAttribute('data-filter-value') || '',
      parentName: el.getAttribute('data-filter-parent-name') || '',
      parentValue: el.getAttribute('data-filter-parent-value') || ''
    };
  }

  function selectionList() {
    if (state.goodsDraft) return state.goodsDraft;
    return activeFilters();
  }

  function writeSelection(next) {
    if (state.goodsDraft) {
      state.goodsDraft = next;
      return;
    }
    if (state.filterDraft) state.filterDraft = next;
    else state.filter = next;
  }

  function isFilterSelected(entry) {
    return selectionList().some(function (item) { return sameFilter(item, entry); });
  }

  function dropBranch(list, name, value) {
    var removed = [];
    var kept = [];
    list.forEach(function (item) {
      if (item.parentName === name && item.parentValue === value) removed.push(item);
      else kept.push(item);
    });
    removed.forEach(function (item) {
      kept = dropBranch(kept, item.name, item.value);
    });
    return kept;
  }

  function ancestorEntries(el) {
    var list = [];
    var box = el.closest('.mdl-filter-branch__children');
    while (box) {
      var branch = box.parentElement;
      var headBtn = branch && branch.querySelector(':scope > .mdl-filter-branch__head [data-filter-value]');
      if (headBtn) list.unshift(readFilterEntry(headBtn));
      box = branch && branch.parentElement ? branch.parentElement.closest('.mdl-filter-branch__children') : null;
    }
    return list;
  }

  function toggleFilter(entry, ancestors) {
    var next = selectionList().slice();
    var index = -1;
    next.forEach(function (item, i) {
      if (sameFilter(item, entry)) index = i;
    });
    if (index >= 0) {
      next.splice(index, 1);
      next = dropBranch(next, entry.name, entry.value);
    } else {
      (ancestors || []).forEach(function (parent) {
        if (!next.some(function (item) { return sameFilter(item, parent); })) next.push(parent);
      });
      next.push(entry);
    }
    writeSelection(next);
  }

  function toggleGoodsAttr(entry, ancestors) {
    var next = (state.goodsDraft || []).slice();
    var index = -1;
    next.forEach(function (item, i) {
      if (sameFilter(item, entry)) index = i;
    });
    if (index >= 0) {
      next.splice(index, 1);
      state.goodsDraft = dropBranch(next, entry.name, entry.value);
      return;
    }
    var group = filterGroupKey(entry);
    var removed = next.filter(function (item) { return filterGroupKey(item) === group; });
    next = next.filter(function (item) { return filterGroupKey(item) !== group; });
    removed.forEach(function (item) {
      next = dropBranch(next, item.name, item.value);
    });
    (ancestors || []).forEach(function (parent) {
      var parentGroup = filterGroupKey(parent);
      var removedParents = next.filter(function (item) {
        return filterGroupKey(item) === parentGroup && !sameFilter(item, parent);
      });
      next = next.filter(function (item) {
        return filterGroupKey(item) !== parentGroup || sameFilter(item, parent);
      });
      removedParents.forEach(function (item) {
        next = dropBranch(next, item.name, item.value);
      });
      if (!next.some(function (item) { return sameFilter(item, parent); })) next.push(parent);
    });
    if (!ancestors || !ancestors.length) {
      var removedRoots = next.filter(function (item) {
        return item.name === entry.name && !item.parentName && item.value !== entry.value;
      });
      next = next.filter(function (item) {
        return !(item.name === entry.name && !item.parentName && item.value !== entry.value);
      });
      removedRoots.forEach(function (item) {
        next = dropBranch(next, item.name, item.value);
      });
    }
    next.push(entry);
    state.goodsDraft = next;
  }

  function productHasAttr(item, entry) {
    return (item.attrs || []).some(function (attr) { return sameFilter(attr, entry); });
  }

  function matchesFilters(item) {
    var groups = {};
    activeFilters().forEach(function (entry) {
      var key = filterGroupKey(entry);
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return Object.keys(groups).every(function (key) {
      return groups[key].some(function (entry) { return productHasAttr(item, entry); });
    });
  }

  function renderFilterChip() {
    var chips = document.getElementById('libFilterChips');
    var clearBtn = document.getElementById('libFilterClear');
    if (!chips || !clearBtn) return;
    if (!activeFilters().length) {
      chips.hidden = true;
      clearBtn.hidden = true;
      chips.innerHTML = '';
      return;
    }
    chips.hidden = false;
    clearBtn.hidden = false;
    chips.innerHTML = activeFilters().map(function (item) {
      return '<span class="mdl-filter-chip">属性：' + escapeHtml(filterLabel(item)) + ' / ' + escapeHtml(item.value) +
        '<button type="button" data-filter-remove-name="' + escapeHtml(item.name) + '" data-filter-remove-value="' + escapeHtml(item.value) + '" data-filter-remove-parent-name="' + escapeHtml(item.parentName || '') + '" data-filter-remove-parent-value="' + escapeHtml(item.parentValue || '') + '" aria-label="移除筛选">×</button></span>';
    }).join('');
  }

  function totalPagesOf(total) {
    return Math.max(1, Math.ceil(total / state.pageSize) || 1);
  }

  function clampPage(total) {
    var pages = totalPagesOf(total);
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
  }

  function renderPagination(total) {
    var totalEl = document.getElementById('libPaginationTotal');
    var pagesEl = document.getElementById('libPaginationPages');
    var gotoEl = document.getElementById('libPageGoto');
    var sizeEl = document.getElementById('libPageSize');
    var totalPages = totalPagesOf(total);
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(state.page);
    if (sizeEl && String(sizeEl.value) !== String(state.pageSize)) sizeEl.value = String(state.pageSize);
    if (!pagesEl) return;
    var page = state.page;
    var html = '';
    html += '<button type="button" class="product-pagination__btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i += 1) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('…');
      var start = Math.max(2, page - 2);
      var end = Math.min(totalPages - 1, page + 2);
      for (var j = start; j <= end; j += 1) pages.push(j);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages);
    }
    pages.forEach(function (p) {
      if (p === '…') html += '<button type="button" class="product-pagination__btn" disabled>…</button>';
      else html += '<button type="button" class="product-pagination__btn' + (p === page ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
    });
    html += '<button type="button" class="product-pagination__btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderLibrary() {
    var list = visibleProducts();
    clampPage(list.length);
    renderStats(list);
    renderTable(list);
    renderPagination(list.length);
    renderFilterChip();
  }

  function closeFilterModal(apply) {
    var modal = document.querySelector('[data-lib-filter-modal]');
    if (apply && state.filterDraft) state.filter = state.filterDraft.slice();
    state.filterDraft = null;
    if (modal) modal.remove();
    if (apply) {
      state.page = 1;
      renderLibrary();
    }
  }

  function renderFilterModalBody() {
    var body = document.getElementById('libFilterModalBody');
    var focus = focusCategory();
    if (!body || !focus) return;
    var rows = store.listAttributeRows(focus.id);
    body.innerHTML = rows.length
      ? rows.map(function (row) { return renderFilterAttribute(row.attr); }).join('')
      : '<div class="mdl-filter-empty">该分类暂无商品属性</div>';
  }

  function closeGoodsModal() {
    var modal = document.querySelector('[data-lib-goods-modal]');
    state.goodsDraft = null;
    state.goodsEditing = null;
    state.goodsSpecIndex = null;
    state.goodsCategoryId = null;
    if (modal) modal.remove();
  }

  function closePriceModal() {
    var modal = document.querySelector('[data-lib-price-modal]');
    if (modal) modal.remove();
  }

  function closeDetailModal() {
    closePriceModal();
    closeIngredientModal();
    closeNutritionModal();
    var modal = document.querySelector('[data-lib-detail-modal]');
    if (modal) modal.remove();
  }

  function detailText(value) {
    if (value == null || value === '') return '—';
    return String(value);
  }

  function detailField(label, value) {
    return '<div class="mdl-detail-field"><div class="mdl-detail-field__label">' + escapeHtml(label) + '</div><div class="mdl-detail-field__value">' + escapeHtml(detailText(value)) + '</div></div>';
  }

  function convertText(unit, qty, rateUnit) {
    if (!unit) return '';
    var rate = Number(qty);
    if (rateUnit && rate) return '1' + unit + '=' + rate + rateUnit;
    return unit;
  }

  function detailEditButton(kind) {
    var attr = kind === 'price' ? ' data-lib-price-edit' : ' data-lib-detail-edit';
    return '<button type="button" class="mdl-detail-edit"' + attr + '>' +
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 20h4l10.5-10.5-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
      '编辑</button>';
  }

  function detailMetric(label, value, suffix) {
    return '<span><em>' + escapeHtml(label) + '</em>' + (value ? escapeHtml(value + suffix) : '—') + '</span>';
  }

  function detailUnitCard(title, unit, qty, rateUnit, measure) {
    measure = measure || {};
    var size = (measure.length || measure.width || measure.height)
      ? (measure.length || '—') + ' × ' + (measure.width || '—') + ' × ' + (measure.height || '—')
      : '';
    return '<div class="mdl-detail-unit">' +
      '<div class="mdl-detail-unit__title">' + escapeHtml(title) + '</div>' +
      '<div class="mdl-detail-unit__convert">' + escapeHtml(convertText(unit, qty, rateUnit) || '—') + '</div>' +
      '<div class="mdl-detail-unit__line">' +
      detailMetric('毛重', measure.grossWeight, ' kg') +
      detailMetric('皮重', measure.tareWeight, ' kg') +
      detailMetric('净重', measure.netWeight, ' kg') +
      '</div>' +
      '<div class="mdl-detail-unit__line">' +
      detailMetric('长×宽×高', size, ' cm') +
      detailMetric('体积', measure.volume, ' m³') +
      '</div></div>';
  }

  function detailUnitSection(item) {
    var measures = item.measures || {};
    return '<div class="mdl-detail-units">' +
      detailUnitCard('最小单位', item.minUnit, item.minRateQty, item.minRateUnit, measures.min) +
      detailUnitCard('规格单位', item.specUnit, item.specRateQty, item.specRateUnit, measures.spec) +
      detailUnitCard('包装单位', item.packUnit, item.packRateQty, item.packRateUnit, measures.pack) +
      '</div>';
  }

  function openPriceModal(item) {
    if (!item) return;
    closePriceModal();
    var units = GOODS_UNITS.slice();
    if (item.purchaseUnit && units.indexOf(item.purchaseUnit) < 0) units.unshift(item.purchaseUnit);
    var unitOptions = units.map(function (unit) {
      return '<option value="' + escapeHtml(unit) + '"' + (unit === item.purchaseUnit ? ' selected' : '') + '>' + escapeHtml(unit) + '</option>';
    }).join('');
    var priceValue = item.purchasePrice == null || item.purchasePrice === '' ? '' : String(item.purchasePrice);
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop mdl-price-backdrop';
    backdrop.setAttribute('data-lib-price-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdl-price-modal" role="dialog" aria-modal="true" aria-labelledby="libPriceModalTitle">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title" id="libPriceModalTitle">编辑标准采购价</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-lib-price-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body mdl-price-form">' +
      '<label class="mdl-goods-field" for="libPriceValue"><span class="mdl-goods-field__label"><i>*</i>标准采购价</span>' +
      '<input class="mdl-goods-field__control" id="libPriceValue" type="number" min="0" step="any" placeholder="请输入价格" value="' + escapeHtml(priceValue) + '"></label>' +
      '<label class="mdl-goods-field" for="libPriceUnit"><span class="mdl-goods-field__label"><i>*</i>标准采购单位</span>' +
      '<select class="mdl-goods-field__control" id="libPriceUnit">' + unitOptions + '</select></label>' +
      '</div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-lib-price-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-lib-price-ok>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-lib-price-close]') || ev.target.closest('[data-lib-price-cancel]')) {
        closePriceModal();
        return;
      }
      if (!ev.target.closest('[data-lib-price-ok]')) return;
      var priceText = readGoodsValue('libPriceValue');
      var unit = readGoodsValue('libPriceUnit');
      if (priceText === '' || !isFinite(Number(priceText)) || Number(priceText) < 0) {
        if (typeof showToast === 'function') showToast('请输入标准采购价', 'warning');
        return;
      }
      if (!unit) {
        if (typeof showToast === 'function') showToast('请选择标准采购单位', 'warning');
        return;
      }
      item.purchasePrice = Number(priceText);
      item.purchaseUnit = unit;
      closePriceModal();
      renderLibrary();
      openDetailModal(item);
      if (typeof showToast === 'function') showToast('标准采购价已更新', 'success');
    });
    document.body.appendChild(backdrop);
  }

  function openDetailModal(item) {
    if (!item) return;
    closeFilterModal(false);
    closeGoodsModal();
    closeDetailModal();
    function specChip(qty, rateUnit, unit) {
      return convertText(unit, qty, rateUnit);
    }
    var tags = (item.attrs || []).map(function (attr) {
      return attr && attr.value ? '<span class="mdl-detail-tag">' + escapeHtml(attr.value) + '</span>' : '';
    }).join('');
    [specChip(item.minRateQty, item.minRateUnit, item.minUnit), specChip(item.specRateQty, item.specRateUnit, item.specUnit), specChip(item.packRateQty, item.packRateUnit, item.packUnit)].forEach(function (text) {
      if (text && text !== item.minUnit && text !== item.specUnit && text !== item.packUnit) tags += '<span class="mdl-detail-tag">' + escapeHtml(text) + '</span>';
    });
    var minNet = item.measures && item.measures.min ? item.measures.min.netWeight : item.netWeight;
    [
      ['最小单位', item.minUnit],
      ['规格单位', item.specUnit],
      ['采购单位', item.purchaseUnit],
      ['净重', minNet ? minNet + 'kg' : ''],
      ['是否称重', item.weigh === '是' ? '称重商品' : (item.weigh === '否' ? '非称重商品' : '')]
    ].forEach(function (pair) {
      if (!pair[1]) return;
      tags += '<span class="mdl-detail-tag">' + escapeHtml(pair[0] + ' ' + pair[1]) + '</span>';
    });
    var infoHtml =
      detailField('SPU编码', item.spu) +
      detailField('货号', item.sku) +
      detailField('商品名称', item.name) +
      detailField('商品条码', item.barcode) +
      detailField('保质期天数', item.shelfLife) +
      detailField('商品品牌', item.brand) +
      detailField('经营方式', item.operateMode) +
      detailField('是否称重', item.weigh) +
      detailField('温层', item.tempLayer) +
      detailField('标准采购价', item.purchasePrice == null || item.purchasePrice === '' ? '' : formatPrice(item.purchasePrice)) +
      detailField('标准采购单位', item.purchaseUnit) +
      detailUnitSection(item);
    var copyFields = [
      ['1. 卖点', item.sellingPoint],
      ['2. 产品基本信息介绍', item.productIntro],
      ['3. 产品其他功能、操作事项等', item.extraUsage],
      ['4. 场景带入', item.scene],
      ['5. 售后服务', item.afterSale],
      ['图文详情', item.graphicDetail]
    ];
    var copyHtml = copyFields.map(function (field) {
      return '<div class="mdl-detail-copy"><div class="mdl-detail-copy__label">' + escapeHtml(field[0]) + '</div><div class="mdl-detail-copy__value">' + escapeHtml(detailText(field[1])) + '</div></div>';
    }).join('');
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-lib-detail-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdl-goods-modal mdl-detail-modal" role="dialog" aria-modal="true" aria-labelledby="libDetailTitle">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title" id="libDetailTitle">商品详情</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-lib-detail-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body">' +
      '<div class="mdl-detail-hero">' +
      '<div class="mdl-detail-hero__main">' +
      '<div class="mdl-detail-hero__title"><h3>' + escapeHtml(item.name) + '</h3>' + detailEditButton() + '</div>' +
      '<p class="mdl-detail-hero__meta">SPU编码：' + escapeHtml(detailText(item.spu)) + ' · 货号：' + escapeHtml(detailText(item.sku)) + ' · 商品条码 ' + escapeHtml(detailText(item.barcode)) + '</p>' +
      '</div>' +
      '<div class="mdl-detail-price"><span>标准采购价</span><strong>' + formatPrice(item.purchasePrice) + '</strong>' + detailEditButton('price') + '</div>' +
      '</div>' +
      '<div class="mdl-detail-tags">' + (tags || '<span class="mdl-detail-empty">暂无标签</span>') + '</div>' +
      '<div class="mdl-detail-tabs" role="tablist">' +
      '<button type="button" class="mdl-detail-tabs__item is-active" data-lib-detail-tab="info">商品信息</button>' +
      '<button type="button" class="mdl-detail-tabs__item" data-lib-detail-tab="copy">图文信息</button>' +
      '<button type="button" class="mdl-detail-tabs__item" data-lib-detail-tab="ingredient">配料表</button>' +
      '<button type="button" class="mdl-detail-tabs__item" data-lib-detail-tab="nutrition">营养成分</button>' +
      '<button type="button" class="mdl-detail-tabs__item" data-lib-detail-tab="supply">供货关系</button>' +
      '</div>' +
      '<div class="mdl-detail-pane" data-lib-detail-pane="info"><div class="mdl-detail-grid">' + infoHtml + '</div></div>' +
      '<div class="mdl-detail-pane" data-lib-detail-pane="copy" hidden>' + copyHtml + '</div>' +
      '<div class="mdl-detail-pane" data-lib-detail-pane="ingredient" hidden></div>' +
      '<div class="mdl-detail-pane" data-lib-detail-pane="nutrition" hidden></div>' +
      '<div class="mdl-detail-pane" data-lib-detail-pane="supply" hidden></div>' +
      '</div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-lib-detail-close]')) {
        closeDetailModal();
        return;
      }
      if (ev.target.closest('[data-lib-price-edit]')) {
        openPriceModal(item);
        return;
      }
      if (ev.target.closest('[data-lib-detail-edit]')) {
        closeDetailModal();
        openGoodsModal(item);
        return;
      }
      var tab = ev.target.closest('[data-lib-detail-tab]');
      if (!tab) return;
      var name = tab.getAttribute('data-lib-detail-tab');
      backdrop.querySelectorAll('[data-lib-detail-tab]').forEach(function (btn) {
        btn.classList.toggle('is-active', btn === tab);
      });
      backdrop.querySelectorAll('[data-lib-detail-pane]').forEach(function (pane) {
        pane.hidden = pane.getAttribute('data-lib-detail-pane') !== name;
      });
    });
    var ingredientPane = backdrop.querySelector('[data-lib-detail-pane="ingredient"]');
    if (ingredientPane) {
      ingredientPane.addEventListener('click', function (ev) {
        if (ev.target.closest('[data-ing-copy]')) {
          openIngredientCopy(item);
          return;
        }
        if (ev.target.closest('[data-ing-add]')) {
          openIngredientForm(item, null);
          return;
        }
        var editBtn = ev.target.closest('[data-ing-edit]');
        if (editBtn) {
          openIngredientForm(item, findIngredient(item, editBtn.getAttribute('data-ing-edit')));
          return;
        }
        var deleteBtn = ev.target.closest('[data-ing-delete]');
        if (deleteBtn) {
          deleteIngredient(item, deleteBtn.getAttribute('data-ing-delete'));
          return;
        }
        var pageBtn = ev.target.closest('[data-ing-page]');
        if (!pageBtn || pageBtn.disabled) return;
        var next = parseInt(pageBtn.getAttribute('data-ing-page'), 10);
        if (!next || next === ingredientView.page) return;
        ingredientView.page = next;
        renderIngredientPane(item);
      });
      ingredientPane.addEventListener('change', function (ev) {
        var target = ev.target;
        if (!target || target.id !== 'ingPageSize') return;
        ingredientView.pageSize = parseInt(target.value, 10) || 200;
        ingredientView.page = 1;
        renderIngredientPane(item);
      });
    }
    var nutritionPane = backdrop.querySelector('[data-lib-detail-pane="nutrition"]');
    if (nutritionPane) {
      nutritionPane.addEventListener('click', function (ev) {
        if (ev.target.closest('[data-nutri-copy]')) {
          openNutritionCopy(item);
          return;
        }
        if (ev.target.closest('[data-nutri-add]')) {
          openNutritionForm(item, null);
          return;
        }
        var editBtn = ev.target.closest('[data-nutri-edit]');
        if (editBtn) {
          openNutritionForm(item, findNutrition(item, editBtn.getAttribute('data-nutri-edit')));
          return;
        }
        var deleteBtn = ev.target.closest('[data-nutri-delete]');
        if (deleteBtn) {
          deleteNutrition(item, deleteBtn.getAttribute('data-nutri-delete'));
          return;
        }
        var pageBtn = ev.target.closest('[data-nutri-page]');
        if (!pageBtn || pageBtn.disabled) return;
        var next = parseInt(pageBtn.getAttribute('data-nutri-page'), 10);
        if (!next || next === nutritionView.page) return;
        nutritionView.page = next;
        renderNutritionPane(item);
      });
      nutritionPane.addEventListener('change', function (ev) {
        var target = ev.target;
        if (!target) return;
        if (target.id === 'nutriBasis') {
          item.nutritionBasis = target.value || '每100g';
          renderNutritionPane(item);
          return;
        }
        if (target.id !== 'nutriPageSize') return;
        nutritionView.pageSize = parseInt(target.value, 10) || 200;
        nutritionView.page = 1;
        renderNutritionPane(item);
      });
    }
    document.body.appendChild(backdrop);
    renderIngredientPane(item);
    renderNutritionPane(item);
    renderSupplyPane(item);
  }

  function supplySupplier(id) {
    var store = window.MasterDataSupplierStore;
    if (!store || typeof store.all !== 'function') return null;
    var found = null;
    store.all().some(function (row) {
      if (row && row.id === id) {
        found = row;
        return true;
      }
      return false;
    });
    return found;
  }

  function supplyStatusText(row) {
    return row && row.status === 'disabled' ? '停用' : '启用';
  }

  function supplyBadge(text, kind) {
    return '<span class="mdl-status mdl-status--' + kind + '">' + escapeHtml(text || '—') + '</span>';
  }

  function sampleBadge(value) {
    if (value === '合格') return supplyBadge(value, 'active');
    if (value === '无需样品') return supplyBadge(value, 'plain');
    return supplyBadge(value || '—', 'disabled');
  }

  function renderSupplyPane(item) {
    var pane = document.querySelector('[data-lib-detail-pane="supply"]');
    if (!pane) return;
    var store = window.MasterDataSupplyRelationStore;
    var sku = String(item && item.sku || '');
    var rows = [];
    if (store && typeof store.all === 'function' && sku) {
      rows = store.all().filter(function (row) {
        return row && String(row.sku) === sku;
      });
    }
    rows.sort(function (a, b) {
      if (!!a.isPrimary !== !!b.isPrimary) return a.isPrimary ? -1 : 1;
      var supplierA = supplySupplier(a.supplierId);
      var supplierB = supplySupplier(b.supplierId);
      var nameA = supplierA && supplierA.name ? supplierA.name : '';
      var nameB = supplierB && supplierB.name ? supplierB.name : '';
      return nameA.localeCompare(nameB, 'zh');
    });
    if (!rows.length) {
      pane.innerHTML = '<div class="mdl-ing-empty">暂无该商品的供货关系</div>';
      return;
    }
    var body = rows.map(function (row) {
      var supplier = supplySupplier(row.supplierId);
      var enabled = !(row && row.status === 'disabled');
      return '<tr>' +
        '<td>' + escapeHtml(supplier && supplier.code ? supplier.code : '—') + '</td>' +
        '<td>' + escapeHtml(supplier && supplier.name ? supplier.name : '—') + '</td>' +
        '<td>' + escapeHtml(formatPrice(row.approvedPrice)) + '</td>' +
        '<td>' + escapeHtml(row.actualPurchaseUnit || '—') + '</td>' +
        '<td>' + escapeHtml(formatQty(row.minOrderQty)) + '</td>' +
        '<td>' + escapeHtml(row.priceStatus || '—') + '</td>' +
        '<td>' + sampleBadge(row.sampleStatus) + '</td>' +
        '<td>' + (row.isPrimary ? '是' : '否') + '</td>' +
        '<td>' + supplyBadge(supplyStatusText(row), enabled ? 'active' : 'disabled') + '</td>' +
        '</tr>';
    }).join('');
    pane.innerHTML =
      '<div class="mdl-supply-summary">共 ' + rows.length + ' 条供货关系</div>' +
      '<div class="mdl-ing-table-wrap"><table class="mdl-ing-table"><thead><tr>' +
      '<th>供应商编码</th><th>供应商</th><th>采购核定价</th><th>实际采购单位</th><th>最小起订量</th><th>价格状态</th><th>样品状态</th><th>是否主供应商</th><th>状态</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function ingredientCategoryChoices() {
    var catStore = window.MasterDataIngredientCategoryStore;
    if (catStore) return catStore.activeNames();
    return ['面皮原料', '馅料主料', '馅料辅料', '加工辅料', '调味料', '发酵辅料'];
  }
  var INGREDIENT_ALLERGENS = ['无', '含麸质的谷物', '含大豆及其制品', '含乳及乳制品', '含蛋类', '含花生及其制品', '含鱼类', '含甲壳类', '含芝麻'];
  var ingredientView = { sku: '', page: 1, pageSize: 200 };

  function ingredientRow(id, name, category, ratio, allergen, source) {
    return { id: id, name: name, category: category, ratio: ratio, allergen: allergen, source: source };
  }

  function ingredientSeed(item) {
    var name = String(item && item.name || '');
    if (name.indexOf('小笼包') < 0) return [];
    var meat = name.indexOf('牛肉') >= 0 ? '牛肉' : '猪肉';
    return [
      ingredientRow('ing1', '小麦粉', '面皮原料', 36, '含麸质的谷物', '供应商 BOM 清单'),
      ingredientRow('ing2', meat, '馅料主料', 28, '无', '供应商 BOM 清单'),
      ingredientRow('ing3', '饮用水', '加工辅料', 20, '无', '生产工艺单'),
      ingredientRow('ing4', '洋葱、姜', '馅料辅料', 8, '无', '供应商 BOM 清单'),
      ingredientRow('ing5', '食用植物油、食用盐、生抽', '调味料', 6, '含大豆及其制品', '配方版本 LF-2026Q3'),
      ingredientRow('ing6', '酵母 / 老面', '发酵辅料', 2, '无', '生产工艺单')
    ];
  }

  function ensureIngredients(item) {
    if (!item.ingredients) item.ingredients = ingredientSeed(item);
    return item.ingredients;
  }

  function syncIngredientView(item) {
    var key = String((item && (item.sku || item.name)) || '');
    if (ingredientView.sku === key) return;
    ingredientView.sku = key;
    ingredientView.page = 1;
    ingredientView.pageSize = 200;
  }

  function ratioText(ratio) {
    var num = Number(ratio);
    if (!isFinite(num)) return '';
    var text = String(Math.round(num * 10) / 10);
    return '约' + text + '%';
  }

  function renderIngredientPane(item) {
    var pane = document.querySelector('[data-lib-detail-pane="ingredient"]');
    if (!pane || !item) return;
    syncIngredientView(item);
    var list = ensureIngredients(item);
    var pageSize = ingredientView.pageSize || 200;
    var pages = Math.max(1, Math.ceil(list.length / pageSize) || 1);
    if (ingredientView.page > pages) ingredientView.page = pages;
    if (ingredientView.page < 1) ingredientView.page = 1;
    var start = (ingredientView.page - 1) * pageSize;
    var rows = list.slice(start, start + pageSize);
    var body = rows.map(function (row) {
      return '<tr>' +
        '<td>' + (list.indexOf(row) + 1) + '</td>' +
        '<td>' + escapeHtml(row.name) + '</td>' +
        '<td>' + escapeHtml(row.category) + '</td>' +
        '<td>' + escapeHtml(ratioText(row.ratio)) + '</td>' +
        '<td>' + escapeHtml(row.allergen || '无') + '</td>' +
        '<td>' + escapeHtml(row.source) + '</td>' +
        '<td class="mdl-ing-table__op"><button type="button" class="mdl-op-btn" data-ing-edit="' + escapeHtml(row.id) + '">编辑</button>' +
        '<button type="button" class="mdl-op-btn mdl-op-btn--danger" data-ing-delete="' + escapeHtml(row.id) + '">删除</button></td>' +
        '</tr>';
    }).join('');
    if (!body) {
      body = '<tr><td class="mdl-ing-empty" colspan="7">暂无配料</td></tr>';
    }
    var pageButtons = '';
    for (var i = 1; i <= pages; i += 1) {
      pageButtons += '<button type="button" class="mdl-ing-page' + (i === ingredientView.page ? ' is-active' : '') + '" data-ing-page="' + i + '">' + i + '</button>';
    }
    pane.innerHTML =
      '<div class="mdl-ing-bar">' +
      '<button type="button" class="mdl-btn mdl-btn--ghost" data-ing-copy>复制配料</button>' +
      '<button type="button" class="mdl-btn mdl-btn--primary" data-ing-add>+ 新增配料</button>' +
      '</div>' +
      '<div class="mdl-ing-table-wrap"><table class="mdl-ing-table"><thead><tr>' +
      '<th>序号</th><th>配料名称</th><th>配料类别</th><th>参考占比</th><th>过敏原提示</th><th>资料来源</th><th>操作</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="mdl-ing-pager"><span>共 ' + list.length + ' 条</span><div class="mdl-ing-pager__right">' +
      '<button type="button" class="mdl-ing-page" data-ing-page="' + (ingredientView.page - 1) + '"' + (ingredientView.page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>' +
      pageButtons +
      '<button type="button" class="mdl-ing-page" data-ing-page="' + (ingredientView.page + 1) + '"' + (ingredientView.page >= pages ? ' disabled' : '') + ' aria-label="下一页">›</button>' +
      '<select id="ingPageSize" aria-label="每页条数">' +
      [20, 50, 100, 200].map(function (size) {
        return '<option value="' + size + '"' + (size === pageSize ? ' selected' : '') + '>' + size + '条/页</option>';
      }).join('') +
      '</select></div></div>';
  }

  function findIngredient(item, id) {
    var list = ensureIngredients(item);
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function closeIngredientModal() {
    var modal = document.querySelector('[data-lib-ingredient-modal]');
    if (modal) modal.remove();
    var copyModal = document.querySelector('[data-lib-ingredient-copy]');
    if (copyModal) copyModal.remove();
    var confirmModal = document.querySelector('[data-lib-ingredient-confirm]');
    if (confirmModal) confirmModal.remove();
  }

  function sameSpuProducts(item) {
    var spu = String(item && item.spu || '');
    if (!spu) return [];
    return PRODUCTS.filter(function (other) {
      return other !== item && String(other.spu || '') === spu;
    }).sort(function (left, right) {
      return String(left.sku || '').localeCompare(String(right.sku || ''), 'zh-CN', { numeric: true });
    });
  }

  function ingredientPreviewHtml(source) {
    var list = source ? ensureIngredients(source) : [];
    if (!list.length) {
      return '<p class="mdl-ing-copy-empty">该货号暂无配料</p>';
    }
    var body = list.map(function (row, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(row.name) + '</td><td>' + escapeHtml(row.category) + '</td><td>' + escapeHtml(ratioText(row.ratio)) + '</td><td>' + escapeHtml(row.allergen || '无') + '</td><td>' + escapeHtml(row.source) + '</td></tr>';
    }).join('');
    return '<div class="mdl-ing-table-wrap"><table class="mdl-ing-table"><thead><tr><th>序号</th><th>配料名称</th><th>配料类别</th><th>参考占比</th><th>过敏原提示</th><th>资料来源</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function openIngredientCopy(item) {
    var existing = document.querySelector('[data-lib-ingredient-copy]');
    if (existing) existing.remove();
    var siblings = sameSpuProducts(item);
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--nested';
    backdrop.setAttribute('data-lib-ingredient-copy', '1');
    var sourceHtml = siblings.length
      ? '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>来源货号</span><select class="mdl-goods-field__control" id="ingCopySource"><option value="">请选择</option>' +
        siblings.map(function (other) {
          var count = ensureIngredients(other).length;
          return '<option value="' + escapeHtml(other.sku) + '">' + escapeHtml(other.sku) + ' ' + escapeHtml(other.name) + '（' + count + '条）</option>';
        }).join('') + '</select></label><div id="ingCopyPreview"></div>'
      : '<p class="mdl-ing-copy-empty">同SPU下暂无其他货号</p>';
    backdrop.innerHTML =
      '<div class="erp-modal mdl-ing-modal mdl-ing-copy-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">复制配料</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-ing-copy-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdl-ing-form">' +
      '<p class="mdl-ing-copy-tip">从同 SPU「' + escapeHtml(item.spu || '') + '」的其他货号复制配料，复制后覆盖当前商品已有配料。</p>' +
      sourceHtml +
      '</div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-ing-copy-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-ing-copy-ok' + (siblings.length ? '' : ' disabled') + '>确定</button></div></div>';
    function preview() {
      var box = document.getElementById('ingCopyPreview');
      var select = document.getElementById('ingCopySource');
      if (!box || !select) return;
      if (!select.value) {
        box.innerHTML = '';
        return;
      }
      var source = null;
      siblings.forEach(function (other) {
        if (String(other.sku) === select.value) source = other;
      });
      box.innerHTML = ingredientPreviewHtml(source);
    }
    function closeCopy() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-ing-copy-close]') || ev.target.closest('[data-ing-copy-cancel]')) {
        closeCopy();
        return;
      }
      if (ev.target.closest('[data-ing-copy-ok]')) applyIngredientCopy(item, siblings);
    });
    backdrop.addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'ingCopySource') preview();
    });
    document.body.appendChild(backdrop);
    preview();
  }

  function applyIngredientCopy(item, siblings) {
    var select = document.getElementById('ingCopySource');
    var sku = select ? String(select.value || '') : '';
    var source = null;
    siblings.forEach(function (other) {
      if (String(other.sku) === sku) source = other;
    });
    if (!source) {
      if (typeof showToast === 'function') showToast('请选择来源货号', 'warning');
      return;
    }
    var sourceList = ensureIngredients(source);
    if (!sourceList.length) {
      if (typeof showToast === 'function') showToast('该货号暂无配料', 'warning');
      return;
    }
    item.ingredients = sourceList.map(function (row, index) {
      return ingredientRow('ing' + (index + 1), row.name, row.category, row.ratio, row.allergen, row.source);
    });
    ingredientView.page = 1;
    closeIngredientModal();
    renderIngredientPane(item);
    if (typeof showToast === 'function') showToast('配料已复制', 'success');
  }

  var NUTRITION_BASES = ['每100g', '每100ml'];
  var nutritionView = { sku: '', page: 1, pageSize: 200 };

  function nutritionRow(id, name, amount, nrv, method, source) {
    return { id: id, name: name, amount: amount, nrv: nrv, method: method, source: source };
  }

  function nutritionSeed(item) {
    var name = String(item && item.name || '');
    if (name.indexOf('小笼包') < 0) return [];
    return [
      nutritionRow('nut1', '能量', '920 kJ', 11, 'GB 5009.8', '第三方检测报告'),
      nutritionRow('nut2', '蛋白质', '9.8 g', 16, 'GB 5009.5', '第三方检测报告'),
      nutritionRow('nut3', '脂肪', '8.2 g', 14, 'GB 5009.6', '第三方检测报告'),
      nutritionRow('nut4', '碳水化合物', '25.6 g', 9, '差减法', '第三方检测报告'),
      nutritionRow('nut5', '钠', '460 mg', 23, 'GB 5009.91', '第三方检测报告')
    ];
  }

  function ensureNutrition(item) {
    if (!item.nutrition) item.nutrition = nutritionSeed(item);
    if (!item.nutritionBasis) item.nutritionBasis = '每100g';
    return item.nutrition;
  }

  function syncNutritionView(item) {
    var key = String((item && (item.sku || item.name)) || '');
    if (nutritionView.sku === key) return;
    nutritionView.sku = key;
    nutritionView.page = 1;
    nutritionView.pageSize = 200;
  }

  function nrvText(nrv) {
    var num = Number(nrv);
    if (!isFinite(num)) return '';
    return String(Math.round(num * 10) / 10) + '%';
  }

  function renderNutritionPane(item) {
    var pane = document.querySelector('[data-lib-detail-pane="nutrition"]');
    if (!pane || !item) return;
    syncNutritionView(item);
    var list = ensureNutrition(item);
    var basis = NUTRITION_BASES.indexOf(item.nutritionBasis) >= 0 ? item.nutritionBasis : '每100g';
    item.nutritionBasis = basis;
    var pageSize = nutritionView.pageSize || 200;
    var pages = Math.max(1, Math.ceil(list.length / pageSize) || 1);
    if (nutritionView.page > pages) nutritionView.page = pages;
    if (nutritionView.page < 1) nutritionView.page = 1;
    var start = (nutritionView.page - 1) * pageSize;
    var rows = list.slice(start, start + pageSize);
    var body = rows.map(function (row) {
      return '<tr>' +
        '<td>' + (list.indexOf(row) + 1) + '</td>' +
        '<td>' + escapeHtml(row.name) + '</td>' +
        '<td>' + escapeHtml(row.amount) + '</td>' +
        '<td>' + escapeHtml(nrvText(row.nrv)) + '</td>' +
        '<td>' + escapeHtml(row.method) + '</td>' +
        '<td>' + escapeHtml(row.source) + '</td>' +
        '<td class="mdl-ing-table__op"><button type="button" class="mdl-op-btn" data-nutri-edit="' + escapeHtml(row.id) + '">编辑</button>' +
        '<button type="button" class="mdl-op-btn mdl-op-btn--danger" data-nutri-delete="' + escapeHtml(row.id) + '">删除</button></td>' +
        '</tr>';
    }).join('');
    if (!body) body = '<tr><td class="mdl-ing-empty" colspan="7">暂无营养成分</td></tr>';
    var pageButtons = '';
    for (var i = 1; i <= pages; i += 1) {
      pageButtons += '<button type="button" class="mdl-ing-page' + (i === nutritionView.page ? ' is-active' : '') + '" data-nutri-page="' + i + '">' + i + '</button>';
    }
    pane.innerHTML =
      '<div class="mdl-ing-bar mdl-nutri-bar">' +
      '<label class="mdl-nutri-basis">营养标示<select id="nutriBasis" aria-label="营养标示">' +
      NUTRITION_BASES.map(function (value) {
        return '<option value="' + escapeHtml(value) + '"' + (value === basis ? ' selected' : '') + '>' + escapeHtml(value) + '</option>';
      }).join('') +
      '</select></label>' +
      '<div class="mdl-nutri-actions">' +
      '<button type="button" class="mdl-btn mdl-btn--ghost" data-nutri-copy>复制营养成分</button>' +
      '<button type="button" class="mdl-btn mdl-btn--primary" data-nutri-add>+ 新增营养成分</button>' +
      '</div>' +
      '</div>' +
      '<div class="mdl-ing-table-wrap"><table class="mdl-ing-table"><thead><tr>' +
      '<th>序号</th><th>营养项目</th><th>' + escapeHtml(basis) + '含量</th><th>NRV%</th><th>检测方法</th><th>数据来源</th><th>操作</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="mdl-ing-pager"><span>共 ' + list.length + ' 条</span><div class="mdl-ing-pager__right">' +
      '<button type="button" class="mdl-ing-page" data-nutri-page="' + (nutritionView.page - 1) + '"' + (nutritionView.page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>' +
      pageButtons +
      '<button type="button" class="mdl-ing-page" data-nutri-page="' + (nutritionView.page + 1) + '"' + (nutritionView.page >= pages ? ' disabled' : '') + ' aria-label="下一页">›</button>' +
      '<select id="nutriPageSize" aria-label="每页条数">' +
      [20, 50, 100, 200].map(function (size) {
        return '<option value="' + size + '"' + (size === pageSize ? ' selected' : '') + '>' + size + '条/页</option>';
      }).join('') +
      '</select></div></div>';
  }

  function findNutrition(item, id) {
    var list = ensureNutrition(item);
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function closeNutritionModal() {
    var modal = document.querySelector('[data-lib-nutrition-modal]');
    if (modal) modal.remove();
    var copyModal = document.querySelector('[data-lib-nutrition-copy]');
    if (copyModal) copyModal.remove();
    var confirmModal = document.querySelector('[data-lib-nutrition-confirm]');
    if (confirmModal) confirmModal.remove();
  }

  function nutritionPreviewHtml(source) {
    var list = source ? ensureNutrition(source) : [];
    if (!list.length) return '<p class="mdl-ing-copy-empty">该货号暂无营养成分</p>';
    var basis = source && NUTRITION_BASES.indexOf(source.nutritionBasis) >= 0 ? source.nutritionBasis : '每100g';
    var body = list.map(function (row, index) {
      return '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(row.name) + '</td><td>' + escapeHtml(row.amount) + '</td><td>' + escapeHtml(nrvText(row.nrv)) + '</td><td>' + escapeHtml(row.method) + '</td><td>' + escapeHtml(row.source) + '</td></tr>';
    }).join('');
    return '<div class="mdl-ing-table-wrap"><table class="mdl-ing-table"><thead><tr><th>序号</th><th>营养项目</th><th>' + escapeHtml(basis) + '含量</th><th>NRV%</th><th>检测方法</th><th>数据来源</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function openNutritionCopy(item) {
    var existing = document.querySelector('[data-lib-nutrition-copy]');
    if (existing) existing.remove();
    var siblings = sameSpuProducts(item);
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--nested';
    backdrop.setAttribute('data-lib-nutrition-copy', '1');
    var sourceHtml = siblings.length
      ? '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>来源货号</span><select class="mdl-goods-field__control" id="nutriCopySource"><option value="">请选择</option>' +
        siblings.map(function (other) {
          var count = ensureNutrition(other).length;
          return '<option value="' + escapeHtml(other.sku) + '">' + escapeHtml(other.sku) + ' ' + escapeHtml(other.name) + '（' + count + '条）</option>';
        }).join('') + '</select></label><div id="nutriCopyPreview"></div>'
      : '<p class="mdl-ing-copy-empty">同SPU下暂无其他货号</p>';
    backdrop.innerHTML =
      '<div class="erp-modal mdl-ing-modal mdl-ing-copy-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">复制营养成分</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-nutri-copy-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdl-ing-form">' +
      '<p class="mdl-ing-copy-tip">从同 SPU「' + escapeHtml(item.spu || '') + '」的其他货号复制营养成分，复制后覆盖当前商品已有营养成分。</p>' +
      sourceHtml +
      '</div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-nutri-copy-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-nutri-copy-ok' + (siblings.length ? '' : ' disabled') + '>确定</button></div></div>';
    function preview() {
      var box = document.getElementById('nutriCopyPreview');
      var select = document.getElementById('nutriCopySource');
      if (!box || !select) return;
      if (!select.value) {
        box.innerHTML = '';
        return;
      }
      var source = null;
      siblings.forEach(function (other) {
        if (String(other.sku) === select.value) source = other;
      });
      box.innerHTML = nutritionPreviewHtml(source);
    }
    function closeCopy() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-nutri-copy-close]') || ev.target.closest('[data-nutri-copy-cancel]')) {
        closeCopy();
        return;
      }
      if (ev.target.closest('[data-nutri-copy-ok]')) applyNutritionCopy(item, siblings);
    });
    backdrop.addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'nutriCopySource') preview();
    });
    document.body.appendChild(backdrop);
    preview();
  }

  function applyNutritionCopy(item, siblings) {
    var select = document.getElementById('nutriCopySource');
    var sku = select ? String(select.value || '') : '';
    var source = null;
    siblings.forEach(function (other) {
      if (String(other.sku) === sku) source = other;
    });
    if (!source) {
      if (typeof showToast === 'function') showToast('请选择来源货号', 'warning');
      return;
    }
    var sourceList = ensureNutrition(source);
    if (!sourceList.length) {
      if (typeof showToast === 'function') showToast('该货号暂无营养成分', 'warning');
      return;
    }
    item.nutrition = sourceList.map(function (row, index) {
      return nutritionRow('nut' + (index + 1), row.name, row.amount, row.nrv, row.method, row.source);
    });
    item.nutritionBasis = NUTRITION_BASES.indexOf(source.nutritionBasis) >= 0 ? source.nutritionBasis : '每100g';
    nutritionView.page = 1;
    closeNutritionModal();
    renderNutritionPane(item);
    if (typeof showToast === 'function') showToast('营养成分已复制', 'success');
  }

  function openNutritionForm(item, row) {
    closeNutritionModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--nested';
    backdrop.setAttribute('data-lib-nutrition-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdl-ing-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (row ? '编辑营养成分' : '新增营养成分') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-nutri-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdl-ing-form">' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>营养项目</span><input class="mdl-goods-field__control" id="nutriFormName" type="text" maxlength="20" placeholder="请输入营养项目" value="' + escapeHtml(row ? row.name : '') + '"></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>含量</span><input class="mdl-goods-field__control" id="nutriFormAmount" type="text" maxlength="20" placeholder="如 920 kJ" value="' + escapeHtml(row ? row.amount : '') + '"></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>NRV%</span><span class="mdl-ing-ratio"><input id="nutriFormNrv" type="number" min="0" step="0.1" placeholder="如 11" value="' + (row ? escapeHtml(row.nrv) : '') + '"><span>%</span></span></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>检测方法</span><input class="mdl-goods-field__control" id="nutriFormMethod" type="text" maxlength="30" placeholder="如 GB 5009.8" value="' + escapeHtml(row ? row.method : '') + '"></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>数据来源</span><input class="mdl-goods-field__control" id="nutriFormSource" type="text" maxlength="30" placeholder="如 第三方检测报告" value="' + escapeHtml(row ? row.source : '') + '"></label>' +
      '</div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-nutri-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-nutri-save>确定</button></div></div>';
    function closeForm() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-nutri-close]') || ev.target.closest('[data-nutri-cancel]')) {
        closeForm();
        return;
      }
      if (ev.target.closest('[data-nutri-save]')) saveNutrition(item, row ? row.id : '');
    });
    document.body.appendChild(backdrop);
    var input = document.getElementById('nutriFormName');
    if (input) input.focus();
  }

  function saveNutrition(item, editingId) {
    var nameEl = document.getElementById('nutriFormName');
    var amountEl = document.getElementById('nutriFormAmount');
    var nrvEl = document.getElementById('nutriFormNrv');
    var methodEl = document.getElementById('nutriFormMethod');
    var sourceEl = document.getElementById('nutriFormSource');
    var name = nameEl ? String(nameEl.value || '').trim() : '';
    var amount = amountEl ? String(amountEl.value || '').trim() : '';
    var nrv = nrvEl ? Number(nrvEl.value) : NaN;
    var method = methodEl ? String(methodEl.value || '').trim() : '';
    var source = sourceEl ? String(sourceEl.value || '').trim() : '';
    if (!name) {
      if (typeof showToast === 'function') showToast('请输入营养项目', 'warning');
      return;
    }
    if (!amount) {
      if (typeof showToast === 'function') showToast('请输入含量', 'warning');
      return;
    }
    if (nrvEl && String(nrvEl.value || '').trim() === '' || !isFinite(nrv) || nrv < 0) {
      if (typeof showToast === 'function') showToast('NRV%请填写大于等于 0 的数字', 'warning');
      return;
    }
    if (!method) {
      if (typeof showToast === 'function') showToast('请输入检测方法', 'warning');
      return;
    }
    if (!source) {
      if (typeof showToast === 'function') showToast('请输入数据来源', 'warning');
      return;
    }
    var list = ensureNutrition(item);
    var duplicated = list.some(function (row) {
      return row.id !== editingId && row.name === name;
    });
    if (duplicated) {
      if (typeof showToast === 'function') showToast('营养项目已存在', 'warning');
      return;
    }
    if (editingId) {
      var current = findNutrition(item, editingId);
      if (!current) return;
      current.name = name;
      current.amount = amount;
      current.nrv = nrv;
      current.method = method;
      current.source = source;
    } else {
      var max = 0;
      list.forEach(function (row) {
        var num = parseInt(String(row.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      });
      list.push(nutritionRow('nut' + (max + 1), name, amount, nrv, method, source));
      nutritionView.page = Math.max(1, Math.ceil(list.length / (nutritionView.pageSize || 200)));
    }
    closeNutritionModal();
    renderNutritionPane(item);
    if (typeof showToast === 'function') showToast(editingId ? '营养成分已更新' : '营养成分已添加', 'success');
  }

  function deleteNutrition(item, id) {
    var row = findNutrition(item, id);
    if (!row) return;
    var existing = document.querySelector('[data-lib-nutrition-confirm]');
    if (existing) existing.remove();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--nested mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-lib-nutrition-confirm', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm"><div class="erp-modal__header"><h2 class="erp-modal__title">温馨提示</h2><div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-nutri-confirm-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="erp-modal-confirm__row"><div class="erp-modal-confirm__icon">!</div><div class="erp-modal-confirm__msg">确定删除营养项目「' + escapeHtml(row.name) + '」？</div></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-nutri-confirm-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-nutri-confirm-ok>确定</button></div></div>';
    function closeConfirm() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-nutri-confirm-close]') || ev.target.closest('[data-nutri-confirm-cancel]')) {
        closeConfirm();
        return;
      }
      if (!ev.target.closest('[data-nutri-confirm-ok]')) return;
      var list = ensureNutrition(item);
      var index = list.indexOf(row);
      if (index >= 0) list.splice(index, 1);
      closeConfirm();
      renderNutritionPane(item);
      if (typeof showToast === 'function') showToast('营养成分已删除', 'success');
    });
    document.body.appendChild(backdrop);
  }

  function selectOptions(values, current, placeholder) {
    var html = '<option value="">' + escapeHtml(placeholder) + '</option>';
    var merged = values.slice();
    if (current && merged.indexOf(current) < 0) merged.push(current);
    merged.forEach(function (value) {
      html += '<option value="' + escapeHtml(value) + '"' + (value === current ? ' selected' : '') + '>' + escapeHtml(value) + '</option>';
    });
    return html;
  }

  function openIngredientForm(item, row) {
    closeIngredientModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--nested';
    backdrop.setAttribute('data-lib-ingredient-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdl-ing-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (row ? '编辑配料' : '新增配料') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-ing-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdl-ing-form">' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>配料名称</span><input class="mdl-goods-field__control" id="ingFormName" type="text" maxlength="40" placeholder="请输入配料名称" value="' + escapeHtml(row ? row.name : '') + '"></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>配料类别</span><select class="mdl-goods-field__control" id="ingFormCategory">' + selectOptions(ingredientCategoryChoices(), row ? row.category : '', '请选择') + '</select></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>参考占比</span><span class="mdl-ing-ratio"><input id="ingFormRatio" type="number" min="0" max="100" step="0.1" placeholder="如 36" value="' + (row ? escapeHtml(row.ratio) : '') + '"><span>%</span></span></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>过敏原提示</span><select class="mdl-goods-field__control" id="ingFormAllergen">' + selectOptions(INGREDIENT_ALLERGENS, row ? row.allergen : '无', '请选择') + '</select></label>' +
      '<label class="mdl-goods-field"><span class="mdl-goods-field__label"><i>*</i>资料来源</span><input class="mdl-goods-field__control" id="ingFormSource" type="text" maxlength="40" placeholder="如 供应商 BOM 清单" value="' + escapeHtml(row ? row.source : '') + '"></label>' +
      '</div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-ing-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-ing-save>确定</button></div></div>';
    function closeForm() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-ing-close]') || ev.target.closest('[data-ing-cancel]')) {
        closeForm();
        return;
      }
      if (ev.target.closest('[data-ing-save]')) saveIngredient(item, row ? row.id : '');
    });
    document.body.appendChild(backdrop);
    var input = document.getElementById('ingFormName');
    if (input) input.focus();
  }

  function saveIngredient(item, editingId) {
    var nameEl = document.getElementById('ingFormName');
    var categoryEl = document.getElementById('ingFormCategory');
    var ratioEl = document.getElementById('ingFormRatio');
    var allergenEl = document.getElementById('ingFormAllergen');
    var sourceEl = document.getElementById('ingFormSource');
    var name = nameEl ? String(nameEl.value || '').trim() : '';
    var category = categoryEl ? String(categoryEl.value || '').trim() : '';
    var ratio = ratioEl ? Number(ratioEl.value) : NaN;
    var allergen = allergenEl ? String(allergenEl.value || '').trim() : '';
    var source = sourceEl ? String(sourceEl.value || '').trim() : '';
    if (!name) {
      if (typeof showToast === 'function') showToast('请输入配料名称', 'warning');
      return;
    }
    if (!category) {
      if (typeof showToast === 'function') showToast('请选择配料类别', 'warning');
      return;
    }
    if (!isFinite(ratio) || ratio <= 0 || ratio > 100) {
      if (typeof showToast === 'function') showToast('参考占比请填写大于 0 且不超过 100 的数字', 'warning');
      return;
    }
    if (!allergen) {
      if (typeof showToast === 'function') showToast('请选择过敏原提示', 'warning');
      return;
    }
    if (!source) {
      if (typeof showToast === 'function') showToast('请输入资料来源', 'warning');
      return;
    }
    var list = ensureIngredients(item);
    var duplicated = list.some(function (row) {
      return row.id !== editingId && row.name === name;
    });
    if (duplicated) {
      if (typeof showToast === 'function') showToast('配料名称已存在', 'warning');
      return;
    }
    if (editingId) {
      var current = findIngredient(item, editingId);
      if (!current) return;
      current.name = name;
      current.category = category;
      current.ratio = ratio;
      current.allergen = allergen;
      current.source = source;
    } else {
      var max = 0;
      list.forEach(function (row) {
        var num = parseInt(String(row.id || '').replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > max) max = num;
      });
      list.push(ingredientRow('ing' + (max + 1), name, category, ratio, allergen, source));
      ingredientView.page = Math.max(1, Math.ceil(list.length / (ingredientView.pageSize || 200)));
    }
    closeIngredientModal();
    renderIngredientPane(item);
    if (typeof showToast === 'function') showToast(editingId ? '配料已更新' : '配料已添加', 'success');
  }

  function deleteIngredient(item, id) {
    var row = findIngredient(item, id);
    if (!row) return;
    var existing = document.querySelector('[data-lib-ingredient-confirm]');
    if (existing) existing.remove();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop erp-modal-backdrop--nested mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-lib-ingredient-confirm', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm"><div class="erp-modal__header"><h2 class="erp-modal__title">温馨提示</h2><div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-ing-confirm-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="erp-modal-confirm__row"><div class="erp-modal-confirm__icon">!</div><div class="erp-modal-confirm__msg">确定删除配料「' + escapeHtml(row.name) + '」？</div></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-ing-confirm-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-ing-confirm-ok>确定</button></div></div>';
    function closeConfirm() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-ing-confirm-close]') || ev.target.closest('[data-ing-confirm-cancel]')) {
        closeConfirm();
        return;
      }
      if (!ev.target.closest('[data-ing-confirm-ok]')) return;
      var list = ensureIngredients(item);
      var index = list.indexOf(row);
      if (index >= 0) list.splice(index, 1);
      closeConfirm();
      renderIngredientPane(item);
      if (typeof showToast === 'function') showToast('配料已删除', 'success');
    });
    document.body.appendChild(backdrop);
  }

  function goodsField(id, label, control) {
    return '<label class="mdl-goods-field" for="' + id + '"><span class="mdl-goods-field__label">' + label + '</span>' + control + '</label>';
  }

  function level1Category(node) {
    if (!node) return null;
    var rootId = node.path_ids && node.path_ids.length ? node.path_ids[0] : (node.level === 1 ? node.id : '');
    return rootId ? store.getNode(rootId) : null;
  }

  function skuTaken(sku) {
    var usedByProduct = PRODUCTS.some(function (item) {
      return String(item.sku || '') === sku;
    });
    if (usedByProduct) return true;
    if (!store.getCategories || !store.getBindings) return false;
    var libraryNames = {};
    PRODUCTS.forEach(function (item) {
      if (item.name) libraryNames[item.name] = true;
    });
    return store.getCategories().some(function (category) {
      return store.getBindings(category.id).some(function (product) {
        return String(product.sku || '') === sku && !libraryNames[product.name];
      });
    });
  }

  function nextGoodsSku(node) {
    var root = level1Category(node);
    var prefix = root && root.code ? String(root.code) : '';
    if (!/^\d{2}$/.test(prefix)) return '';
    var max = 0;
    PRODUCTS.forEach(function (item) {
      var sku = String(item.sku || '');
      if (!/^\d{6}$/.test(sku) || sku.slice(0, 2) !== prefix) return;
      var serial = parseInt(sku.slice(2), 10);
      if (!isNaN(serial) && serial > max) max = serial;
    });
    var next = max + 1;
    while (next <= 9999) {
      var candidate = prefix + ('0000' + next).slice(-4);
      if (!skuTaken(candidate)) return candidate;
      next += 1;
    }
    return '';
  }

  function nextSpuCode(node) {
    var root = level1Category(node);
    var prefix = root && root.code ? String(root.code) : '';
    if (!/^\d{2}$/.test(prefix)) return '';
    var max = 0;
    PRODUCTS.forEach(function (item) {
      var spu = String(item.spu || '');
      if (!/^SPU\d{6}$/.test(spu) || spu.slice(3, 5) !== prefix) return;
      var serial = parseInt(spu.slice(5), 10);
      if (!isNaN(serial) && serial > max) max = serial;
    });
    var next = max + 1;
    if (next > 9999) return '';
    return 'SPU' + prefix + ('0000' + next).slice(-4);
  }

  function assignMissingSpu() {
    PRODUCTS.forEach(function (item) {
      if (item.spu) return;
      if (item.spuKey) {
        var leader = null;
        PRODUCTS.some(function (other) {
          if (other !== item && other.spuKey === item.spuKey && other.spu) {
            leader = other;
            return true;
          }
          return false;
        });
        if (leader) {
          item.spu = leader.spu;
          return;
        }
      }
      var node = categoryNodeByName(item.category);
      if (!node) return;
      item.spu = nextSpuCode(node);
    });
  }

  function assignAllSkus() {
    PRODUCTS.forEach(function (item) { item.sku = ''; });
    PRODUCTS.forEach(function (item) {
      var node = categoryNodeByName(item.category);
      item.sku = node ? nextGoodsSku(node) : '';
    });
  }

  function goodsInput(id, label, type, placeholder, required, readonlyValue) {
    var mark = required ? '<i>*</i>' : '';
    var locked = typeof readonlyValue === 'string';
    var control = locked
      ? '<input class="mdl-goods-field__control is-readonly" id="' + id + '" type="text" value="' + escapeHtml(readonlyValue) + '" readonly tabindex="-1">'
      : '<input class="mdl-goods-field__control" id="' + id + '" type="' + type + '" placeholder="' + escapeHtml(placeholder || '请输入') + '"' + (type === 'number' ? ' step="any" min="0"' : '') + '>';
    return goodsField(id, mark + escapeHtml(label), control);
  }

  function brandChoices(current) {
    var brandStore = window.MasterDataBrandStore;
    var names = brandStore ? brandStore.activeNames() : [];
    if (current && names.indexOf(current) < 0) names.push(current);
    return names;
  }

  function fillBrandQuery() {
    var select = document.getElementById('libQueryBrand');
    var brandStore = window.MasterDataBrandStore;
    if (!select || !brandStore) return;
    select.innerHTML = '<option value="">全部</option>' + brandStore.names().map(function (name) {
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    }).join('');
  }

  function goodsSelect(id, label, options, required) {
    return goodsField(
      id,
      (required ? '<i>*</i>' : '') + escapeHtml(label),
      '<select class="mdl-goods-field__control" id="' + id + '"><option value="">请选择</option>' +
      options.map(function (option) {
        return '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</option>';
      }).join('') + '</select>'
    );
  }

  var GOODS_UNITS = ['个', 'g', 'kg', '包', '袋', '瓶', '罐', '箱', '件'];

  function goodsUnitOptions(selected) {
    return GOODS_UNITS.map(function (unit) {
      return '<option value="' + escapeHtml(unit) + '"' + (unit === selected ? ' selected' : '') + '>' + escapeHtml(unit) + '</option>';
    }).join('');
  }

  function goodsUnitPick(id, selected, attrs) {
    return '<div class="mdl-goods-combo__pick">' +
      '<span class="mdl-goods-combo__pick-text">' + escapeHtml(selected) + '</span>' +
      '<select class="mdl-goods-combo__unit" id="' + id + '"' + (attrs || '') + '>' + goodsUnitOptions(selected) + '</select>' +
      '</div>';
  }

  function unitMetric(id, label, suffix, extra) {
    extra = extra || {};
    var attrs = '';
    if (extra.dim) attrs += ' data-dim="' + extra.dim + '" data-dim-group="' + extra.group + '"';
    if (extra.volume) attrs += ' data-dim-volume="' + extra.group + '"';
    if (extra.weight) attrs += ' data-weight="' + extra.weight + '" data-weight-group="' + extra.group + '"';
    var inputAttr = extra.readonly ? ' readonly tabindex="-1"' : '';
    var boxClass = extra.readonly ? ' mdl-goods-affix--readonly' : '';
    var placeholder = extra.readonly ? '自动计算' : (extra.placeholder || '请输入');
    return '<label class="mdl-unit-metric">' +
      '<span class="mdl-unit-metric__label">' + escapeHtml(label) + '</span>' +
      '<span class="mdl-goods-affix' + boxClass + '"><input id="' + id + '" type="number" min="0" step="any" placeholder="' + placeholder + '"' + inputAttr + attrs + '><span>' + escapeHtml(suffix) + '</span></span>' +
      '</label>';
  }

  function unitCard(spec) {
    var id = 'libGoods' + spec.prefix + 'Unit';
    var followAttr = spec.followId ? ' data-unit-follow="' + spec.followId + '"' : '';
    var rateControl = spec.lockRate
      ? '<span class="mdl-goods-combo__unit mdl-goods-combo__unit--locked" id="' + id + 'RateUnit">' + escapeHtml(spec.rateUnit) + '</span>'
      : goodsUnitPick(id + 'RateUnit', spec.rateUnit);
    return '<section class="mdl-unit-card">' +
      '<div class="mdl-unit-card__head"><span class="mdl-unit-card__index">' + spec.index + '</span>' +
      '<div><h4>' + escapeHtml(spec.label) + '</h4><p>' + escapeHtml(spec.hint) + '</p></div></div>' +
      '<div class="mdl-unit-card__line">' +
      '<span class="mdl-unit-card__label">换算</span>' +
      '<div class="mdl-goods-combo">' +
      goodsUnitPick(id, spec.unit, ' data-unit-echo="' + id + 'Echo"' + followAttr) +
      '<span class="mdl-goods-combo__eq">1 <em id="' + id + 'Echo">' + escapeHtml(spec.unit) + '</em> =</span>' +
      '<input class="mdl-goods-combo__num" id="' + id + 'Rate" type="number" min="0" step="any" placeholder="请输入">' +
      rateControl +
      '</div></div>' +
      '<div class="mdl-unit-card__line mdl-unit-card__line--top">' +
      '<span class="mdl-unit-card__label">重量</span>' +
      '<div class="mdl-unit-metrics">' +
      unitMetric('libGoods' + spec.prefix + 'Gross', '毛重', 'kg', { weight: 'gross', group: spec.group }) +
      unitMetric('libGoods' + spec.prefix + 'Tare', '皮重', 'kg', { weight: 'tare', group: spec.group }) +
      unitMetric('libGoods' + spec.prefix + 'Net', '净重', 'kg', { weight: 'net', group: spec.group, placeholder: '毛重减皮重' }) +
      '</div></div>' +
      '<div class="mdl-unit-card__line mdl-unit-card__line--top">' +
      '<span class="mdl-unit-card__label">体积</span>' +
      '<div class="mdl-unit-metrics mdl-unit-metrics--volume">' +
      unitMetric('libGoods' + spec.prefix + 'Length', '长', 'cm', { dim: 'length', group: spec.group }) +
      unitMetric('libGoods' + spec.prefix + 'Width', '宽', 'cm', { dim: 'width', group: spec.group }) +
      unitMetric('libGoods' + spec.prefix + 'Height', '高', 'cm', { dim: 'height', group: spec.group }) +
      unitMetric('libGoods' + spec.prefix + 'Volume', '体积', 'm³', { readonly: true, volume: true, group: spec.group }) +
      '</div></div></section>';
  }

  function goodsUnitCards() {
    return '<div class="mdl-unit-cards">' +
      unitCard({ index: '1', prefix: 'Min', group: 'min', label: '最小单位', hint: '按这一级单独填写重量和体积，换算单位可自选', unit: '个', rateUnit: 'g', followId: 'libGoodsSpecUnitRateUnit' }) +
      unitCard({ index: '2', prefix: 'Spec', group: 'spec', label: '规格单位', hint: '换算单位跟随最小单位', unit: '包', rateUnit: '个', lockRate: true, followId: 'libGoodsPackUnitRateUnit' }) +
      unitCard({ index: '3', prefix: 'Pack', group: 'pack', label: '包装单位', hint: '换算单位跟随规格单位', unit: '箱', rateUnit: '包', lockRate: true }) +
      '</div>';
  }

  function syncUnitVolume(group) {
    var lengthEl = document.querySelector('[data-dim="length"][data-dim-group="' + group + '"]');
    var widthEl = document.querySelector('[data-dim="width"][data-dim-group="' + group + '"]');
    var heightEl = document.querySelector('[data-dim="height"][data-dim-group="' + group + '"]');
    var volumeEl = document.querySelector('[data-dim-volume="' + group + '"]');
    if (!lengthEl || !widthEl || !heightEl || !volumeEl) return;
    var length = String(lengthEl.value || '').trim();
    var width = String(widthEl.value || '').trim();
    var height = String(heightEl.value || '').trim();
    if (length === '' || width === '' || height === '') {
      volumeEl.value = '';
      return;
    }
    var cubicCm = Number(length) * Number(width) * Number(height);
    if (!isFinite(cubicCm)) {
      volumeEl.value = '';
      return;
    }
    volumeEl.value = String(Math.round((cubicCm / 1000000) * 1000000) / 1000000);
  }

  function syncUnitWeight(group) {
    var grossEl = document.querySelector('[data-weight="gross"][data-weight-group="' + group + '"]');
    var tareEl = document.querySelector('[data-weight="tare"][data-weight-group="' + group + '"]');
    var netEl = document.querySelector('[data-weight="net"][data-weight-group="' + group + '"]');
    if (!grossEl || !tareEl || !netEl || netEl.dataset.touched === '1') return;
    var gross = String(grossEl.value || '').trim();
    var tare = String(tareEl.value || '').trim();
    if (gross === '' || tare === '') {
      if (netEl.dataset.auto === '1') netEl.value = '';
      return;
    }
    var net = Number(gross) - Number(tare);
    if (!isFinite(net) || net < 0) return;
    netEl.value = String(Math.round(net * 1000) / 1000);
    netEl.dataset.auto = '1';
  }

  function goodsTextarea(id, label, placeholder) {
    return '<label class="mdl-goods-copy" for="' + id + '">' +
      '<span class="mdl-goods-copy__label">' + escapeHtml(label) + '</span>' +
      '<textarea class="mdl-goods-copy__input" id="' + id + '" rows="3" placeholder="' + escapeHtml(placeholder) + '"></textarea>' +
      '</label>';
  }

  function renderGoodsAttrBody() {
    var body = document.getElementById('libGoodsAttrBody');
    var node = store.getNode(state.goodsCategoryId || state.selectedL4);
    if (!body || !node) return;
    var rows = store.listAttributeRows(node.id);
    body.innerHTML = rows.length
      ? rows.map(function (row) { return renderFilterAttribute(row.attr); }).join('')
      : '<div class="mdl-filter-empty">该分类暂无商品属性</div>';
  }

  function readGoodsValue(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      return String(el.value || '').trim();
    }
    return String(el.textContent || '').trim();
  }

  function readMeasure(prefix) {
    return {
      grossWeight: readGoodsValue('libGoods' + prefix + 'Gross'),
      tareWeight: readGoodsValue('libGoods' + prefix + 'Tare'),
      netWeight: readGoodsValue('libGoods' + prefix + 'Net'),
      length: readGoodsValue('libGoods' + prefix + 'Length'),
      width: readGoodsValue('libGoods' + prefix + 'Width'),
      height: readGoodsValue('libGoods' + prefix + 'Height'),
      volume: readGoodsValue('libGoods' + prefix + 'Volume')
    };
  }

  function readConversion(prefix, prevQty, prevRateUnit) {
    var text = readGoodsValue('libGoods' + prefix + 'UnitRate');
    if (text === '') return { qty: prevQty || 0, rateUnit: prevRateUnit || '' };
    return {
      qty: Number(text) || 0,
      rateUnit: readGoodsValue('libGoods' + prefix + 'UnitRateUnit')
    };
  }

  function saveGoods() {
    var editingIndex = state.goodsEditing;
    var prev = editingIndex != null ? PRODUCTS[editingIndex] : null;
    var specSource = state.goodsSpecIndex != null && state.goodsSpecIndex >= 0 ? PRODUCTS[state.goodsSpecIndex] : null;
    var node = prev ? categoryNodeByName(prev.category) : (specSource ? categoryNodeByName(specSource.category) : store.getNode(state.selectedL4));
    if (!prev && !specSource && !node) return;
    var sku = prev ? prev.sku : nextGoodsSku(node);
    if (!sku) {
      if (typeof showToast === 'function') showToast('该分类货号已用完', 'warning');
      return;
    }
    var spu = prev && prev.spu ? prev.spu : (specSource && specSource.spu ? specSource.spu : nextSpuCode(node));
    if (!spu) {
      if (typeof showToast === 'function') showToast('该分类SPU编码已用完', 'warning');
      return;
    }
    var name = readGoodsValue('libGoodsName');
    if (!name) {
      if (typeof showToast === 'function') showToast('请输入商品名称', 'warning');
      return;
    }
    var barcode = readGoodsValue('libGoodsBarcode');
    if (!barcode) {
      if (typeof showToast === 'function') showToast('请输入商品条码', 'warning');
      return;
    }
    var shelfText = readGoodsValue('libGoodsShelf');
    if (shelfText === '' || !isFinite(Number(shelfText)) || Number(shelfText) < 0) {
      if (typeof showToast === 'function') showToast('请输入保质期天数', 'warning');
      return;
    }
    var brand = readGoodsValue('libGoodsBrand');
    if (!brand) {
      if (typeof showToast === 'function') showToast('请选择商品品牌', 'warning');
      return;
    }
    var operateMode = readGoodsValue('libGoodsOperate');
    if (!operateMode) {
      if (typeof showToast === 'function') showToast('请选择经营方式', 'warning');
      return;
    }
    var weigh = readGoodsValue('libGoodsWeigh');
    if (!weigh) {
      if (typeof showToast === 'function') showToast('请选择是否称重', 'warning');
      return;
    }
    var tempLayer = readGoodsValue('libGoodsTemp');
    if (!tempLayer) {
      if (typeof showToast === 'function') showToast('请选择温层', 'warning');
      return;
    }
    var priceText = readGoodsValue('libGoodsPrice');
    if (priceText === '' || !isFinite(Number(priceText)) || Number(priceText) < 0) {
      if (typeof showToast === 'function') showToast('请输入标准采购价', 'warning');
      return;
    }
    var purchaseUnit = readGoodsValue('libGoodsPurchaseUnit');
    if (!purchaseUnit) {
      if (typeof showToast === 'function') showToast('请选择标准采购单位', 'warning');
      return;
    }
    var minConv = readConversion('Min', prev && prev.minRateQty, prev && prev.minRateUnit);
    var specConv = readConversion('Spec', prev && prev.specRateQty, prev && prev.specRateUnit);
    var packConv = readConversion('Pack', prev && prev.packRateQty, prev && prev.packRateUnit);
    var record = {
      category: prev ? prev.category : (specSource ? specSource.category : node.name),
      spu: spu,
      sku: sku,
      barcode: barcode,
      barcodeCount: prev ? prev.barcodeCount : (barcode ? 1 : 0),
      name: name,
      brand: brand,
      purchasePrice: Number(priceText),
      purchaseQty: prev ? prev.purchaseQty : 0,
      purchaseUnit: purchaseUnit,
      minQty: prev ? prev.minQty : 0,
      minUnit: readGoodsValue('libGoodsMinUnit'),
      minRateQty: minConv.qty,
      minRateUnit: minConv.rateUnit,
      specQty: prev ? prev.specQty : 0,
      specUnit: readGoodsValue('libGoodsSpecUnit'),
      specRateQty: specConv.qty,
      specRateUnit: specConv.rateUnit,
      packQty: prev ? prev.packQty : 0,
      packUnit: readGoodsValue('libGoodsPackUnit'),
      packRateQty: packConv.qty,
      packRateUnit: packConv.rateUnit,
      amount: prev ? prev.amount : 0,
      tone: prev ? prev.tone : (specSource ? specSource.tone : 'blue'),
      mark: prev ? prev.mark : (specSource ? specSource.mark : name.charAt(0)),
      status: prev ? goodsStatus(prev) : 'active',
      weigh: weigh,
      operateMode: operateMode,
      shelfLife: shelfText,
      tempLayer: tempLayer,
      measures: {
        min: readMeasure('Min'),
        spec: readMeasure('Spec'),
        pack: readMeasure('Pack')
      },
      sellingPoint: readGoodsValue('libGoodsSellingPoint'),
      productIntro: readGoodsValue('libGoodsProductIntro'),
      extraUsage: readGoodsValue('libGoodsExtraUsage'),
      scene: readGoodsValue('libGoodsScene'),
      afterSale: readGoodsValue('libGoodsAfterSale'),
      graphicDetail: readGoodsValue('libGoodsGraphicDetail'),
      attrs: (state.goodsDraft || []).slice()
    };
    if (prev) {
      PRODUCTS[editingIndex] = record;
      closeGoodsModal();
      renderLibrary();
      if (typeof showToast === 'function') showToast('商品已更新', 'success');
      return;
    }
    PRODUCTS.push(record);
    closeGoodsModal();
    var addedList = visibleProducts();
    var addedIndex = addedList.indexOf(record);
    state.page = addedIndex < 0 ? 1 : Math.floor(addedIndex / state.pageSize) + 1;
    syncCategoryCounts();
    renderCategories();
    renderLibrary();
    if (typeof showToast === 'function') showToast('商品已添加', 'success');
  }

  function writeControl(id, value) {
    var el = document.getElementById(id);
    if (!el || value == null || value === '') return;
    var text = String(value);
    if (el.tagName === 'SELECT') {
      var found = false;
      Array.prototype.forEach.call(el.options, function (option) {
        if (option.value === text) found = true;
      });
      if (!found) {
        var option = document.createElement('option');
        option.value = text;
        option.textContent = text;
        el.appendChild(option);
      }
      el.value = text;
      var pick = el.closest('.mdl-goods-combo__pick');
      if (pick) {
        var pickText = pick.querySelector('.mdl-goods-combo__pick-text');
        if (pickText) pickText.textContent = text;
      }
      var echoId = el.getAttribute('data-unit-echo');
      if (echoId) {
        var echo = document.getElementById(echoId);
        if (echo) echo.textContent = text;
      }
      return;
    }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = text;
  }

  function fillMeasure(prefix, measure) {
    if (!measure) return;
    writeControl('libGoods' + prefix + 'Gross', measure.grossWeight);
    writeControl('libGoods' + prefix + 'Tare', measure.tareWeight);
    writeControl('libGoods' + prefix + 'Net', measure.netWeight);
    writeControl('libGoods' + prefix + 'Length', measure.length);
    writeControl('libGoods' + prefix + 'Width', measure.width);
    writeControl('libGoods' + prefix + 'Height', measure.height);
    writeControl('libGoods' + prefix + 'Volume', measure.volume);
    if (measure.netWeight) {
      var netEl = document.getElementById('libGoods' + prefix + 'Net');
      if (netEl) netEl.dataset.touched = '1';
    }
  }

  function fillGoodsForm(item, specMode) {
    if (!item) return;
    writeControl('libGoodsName', item.name);
    writeControl('libGoodsBarcode', item.barcode);
    writeControl('libGoodsShelf', item.shelfLife);
    writeControl('libGoodsBrand', item.brand);
    writeControl('libGoodsOperate', item.operateMode);
    writeControl('libGoodsWeigh', item.weigh);
    writeControl('libGoodsTemp', item.tempLayer);
    writeControl('libGoodsPrice', item.purchasePrice);
    writeControl('libGoodsPurchaseUnit', item.purchaseUnit);
    writeControl('libGoodsSellingPoint', item.sellingPoint);
    writeControl('libGoodsProductIntro', item.productIntro);
    writeControl('libGoodsExtraUsage', item.extraUsage);
    writeControl('libGoodsScene', item.scene);
    writeControl('libGoodsAfterSale', item.afterSale);
    writeControl('libGoodsGraphicDetail', item.graphicDetail);
    if (specMode) return;
    writeControl('libGoodsMinUnit', item.minUnit);
    if (item.minRateUnit) {
      writeControl('libGoodsMinUnitRate', item.minRateQty);
      writeControl('libGoodsMinUnitRateUnit', item.minRateUnit);
    }
    writeControl('libGoodsSpecUnit', item.specUnit);
    if (item.specRateUnit) writeControl('libGoodsSpecUnitRate', item.specRateQty);
    writeControl('libGoodsPackUnit', item.packUnit);
    if (item.packRateUnit) writeControl('libGoodsPackUnitRate', item.packRateQty);
    var measures = item.measures || {};
    fillMeasure('Min', measures.min);
    fillMeasure('Spec', measures.spec);
    fillMeasure('Pack', measures.pack);
    var specLock = document.getElementById('libGoodsSpecUnitRateUnit');
    if (specLock && specLock.tagName === 'SPAN') specLock.textContent = readGoodsValue('libGoodsMinUnit');
    var packLock = document.getElementById('libGoodsPackUnitRateUnit');
    if (packLock && packLock.tagName === 'SPAN') packLock.textContent = readGoodsValue('libGoodsSpecUnit');
    ['min', 'spec', 'pack'].forEach(syncUnitVolume);
  }

  function openGoodsModal(item, mode) {
    var specMode = mode === 'spec';
    if (!specMode && !item && !state.selectedL4) {
      if (typeof showToast === 'function') showToast('请先选择四级分类', 'warning');
      return;
    }
    if (specMode && !item) return;
    var categoryNode = item ? categoryNodeByName(item.category) : store.getNode(state.selectedL4);
    if (!specMode && !item && !categoryNode) return;
    var editingIndex = !specMode && item ? PRODUCTS.indexOf(item) : -1;
    if (!specMode && item && editingIndex < 0) return;
    var specIndex = specMode ? PRODUCTS.indexOf(item) : -1;
    if (specMode && specIndex < 0) return;
    closeFilterModal(false);
    closeGoodsModal();
    closeDetailModal();
    state.goodsEditing = !specMode && item ? editingIndex : null;
    state.goodsSpecIndex = specMode ? specIndex : null;
    state.goodsCategoryId = categoryNode ? categoryNode.id : null;
    state.goodsDraft = item && item.attrs ? item.attrs.map(function (attr) {
      return {
        name: attr.name,
        value: attr.value,
        parentName: attr.parentName || '',
        parentValue: attr.parentValue || ''
      };
    }) : [];
    var skuText = specMode || !item ? (nextGoodsSku(categoryNode) || '') : String(item.sku || '');
    var spuText = specMode || (item && item.spu) ? String((item && item.spu) || '') : (nextSpuCode(categoryNode) || '');
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-lib-goods-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdl-goods-modal" role="dialog" aria-modal="true" aria-labelledby="libGoodsModalTitle">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title" id="libGoodsModalTitle">' + (!specMode && item ? '编辑商品' : '添加商品') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-lib-goods-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body">' +
      '<section class="mdl-goods-section"><h3 class="mdl-goods-section__title">商品属性</h3>' +
      '<p class="product-category-modal__hint">当前分类「' + escapeHtml(categoryNode ? (categoryNode.path || categoryNode.name) : (item.category || '')) + '」的商品属性。</p>' +
      '<div id="libGoodsAttrBody"></div></section>' +
      '<section class="mdl-goods-section"><h3 class="mdl-goods-section__title">商品信息</h3>' +
      '<div class="mdl-goods-grid">' +
      goodsInput('libGoodsSpu', 'SPU编码', 'text', '', true, spuText) +
      goodsInput('libGoodsSku', '货号', 'text', '', true, skuText) +
      goodsInput('libGoodsName', '商品名称', 'text', '请输入商品名称', true) +
      goodsInput('libGoodsBarcode', '商品条码', 'text', '请输入商品条码', true) +
      goodsInput('libGoodsShelf', '保质期天数', 'number', '请输入天数', true) +
      goodsSelect('libGoodsBrand', '商品品牌', brandChoices(item && item.brand), true) +
      goodsSelect('libGoodsOperate', '经营方式', ['代采代销', '购销', '联营'], true) +
      goodsSelect('libGoodsWeigh', '是否称重', ['是', '否'], true) +
      goodsSelect('libGoodsTemp', '温层', ['常温', '冷藏', '冷冻'], true) +
      goodsInput('libGoodsPrice', '标准采购价', 'number', '请输入价格', true) +
      goodsSelect('libGoodsPurchaseUnit', '标准采购单位', GOODS_UNITS, true) +
      '</div>' +
      goodsUnitCards() +
      '</section>' +
      '<section class="mdl-goods-section"><h3 class="mdl-goods-section__title">图文信息</h3>' +
      '<div class="mdl-goods-copy-list">' +
      goodsTextarea('libGoodsSellingPoint', '1. 卖点', '突出产品相较于竞品的优势，如材质（纯银、镀金、316L不锈钢 等）、数量、款式等方面的优势。') +
      goodsTextarea('libGoodsProductIntro', '2. 产品基本信息介绍', '涵盖特性、尺寸、颜色等基础信息。') +
      goodsTextarea('libGoodsExtraUsage', '3. 产品其他功能、操作事项等', '补充产品额外功能及使用注意内容。') +
      goodsTextarea('libGoodsScene', '4. 场景带入', '明确适用人群，列举使用场合，如展会、约会、节日、送礼等场景。') +
      goodsTextarea('libGoodsAfterSale', '5. 售后服务', '给予消费者售后保障承诺，增强下单信心。') +
      goodsTextarea('libGoodsGraphicDetail', '图文详情', '图文详情用于沉淀供货商可复用的商品素材，包含货品实拍图、包装信息、规格参数和销售端展示内容。') +
      '<div class="mdl-goods-media">' +
      '<button type="button" class="mdl-goods-media__btn" data-lib-media="image">+ 商品图片</button>' +
      '<button type="button" class="mdl-goods-media__btn" data-lib-media="video">+ 商品视频</button>' +
      '</div>' +
      '</div></section></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-lib-goods-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-lib-goods-ok>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-lib-goods-close]') || ev.target.closest('[data-lib-goods-cancel]')) {
        closeGoodsModal();
        return;
      }
      if (ev.target.closest('[data-lib-goods-ok]')) {
        saveGoods();
        return;
      }
      var valueBtn = ev.target.closest('[data-filter-value]');
      if (valueBtn) {
        toggleGoodsAttr(readFilterEntry(valueBtn), ancestorEntries(valueBtn));
        renderGoodsAttrBody();
        return;
      }
      if (ev.target.closest('[data-lib-media]')) {
        if (typeof showToast === 'function') showToast('原型暂未开放该操作', 'warning');
      }
    });
    backdrop.addEventListener('input', function (ev) {
      var target = ev.target;
      if (!target) return;
      if (target.getAttribute('data-weight') === 'net') {
        target.dataset.touched = '1';
        target.dataset.auto = '';
      }
      var group = target.getAttribute('data-dim-group') || target.getAttribute('data-weight-group');
      if (target.getAttribute('data-dim')) syncUnitVolume(group);
      if (target.getAttribute('data-weight') === 'gross' || target.getAttribute('data-weight') === 'tare') syncUnitWeight(group);
    });
    backdrop.addEventListener('change', function (ev) {
      var value = ev.target.value || '';
      var pick = ev.target.closest('.mdl-goods-combo__pick');
      if (pick) {
        var pickText = pick.querySelector('.mdl-goods-combo__pick-text');
        if (pickText) pickText.textContent = value;
      }
      var echoId = ev.target.getAttribute('data-unit-echo');
      if (echoId) {
        var echo = document.getElementById(echoId);
        if (echo) echo.textContent = value;
      }
      var followId = ev.target.getAttribute('data-unit-follow');
      if (followId) {
        var follow = document.getElementById(followId);
        if (follow) follow.textContent = value;
      }
    });
    document.body.appendChild(backdrop);
    fillGoodsForm(item, specMode);
    renderGoodsAttrBody();
  }

  function openFilterModal() {
    var focus = focusCategory();
    if (!focus) {
      if (typeof showToast === 'function') showToast('请先选择分类', 'warning');
      return;
    }
    closeGoodsModal();
    closeDetailModal();
    closeFilterModal(false);
    state.filterDraft = (state.filter || []).map(function (item) {
      return {
        name: item.name,
        value: item.value,
        parentName: item.parentName || '',
        parentValue: item.parentValue || ''
      };
    });
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-lib-filter-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdl-filter-modal" role="dialog" aria-modal="true" aria-labelledby="libFilterModalTitle">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title" id="libFilterModalTitle">属性筛选</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-lib-filter-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><p class="product-category-modal__hint">选择「' + escapeHtml(focus.name) + '」的属性，可多选。确定后筛选商品。</p>' +
      '<div id="libFilterModalBody"></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-lib-filter-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-lib-filter-ok>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop || ev.target.closest('[data-lib-filter-close]') || ev.target.closest('[data-lib-filter-cancel]')) {
        closeFilterModal(false);
        return;
      }
      if (ev.target.closest('[data-lib-filter-ok]')) {
        closeFilterModal(true);
        return;
      }
      var valueBtn = ev.target.closest('[data-filter-value]');
      if (!valueBtn) return;
      toggleFilter(readFilterEntry(valueBtn), ancestorEntries(valueBtn));
      renderFilterModalBody();
    });
    document.body.appendChild(backdrop);
    renderFilterModalBody();
  }

  function valueText(value) {
    return typeof value === 'string' ? value : (value && value.text) || '';
  }

  function renderFilterButtons(entries) {
    return entries.map(function (entry) {
      var active = isFilterSelected(entry);
      return '<button type="button" class="mdl-filter-value' + (active ? ' is-active' : '') + '" data-filter-name="' + escapeHtml(entry.name) + '" data-filter-value="' + escapeHtml(entry.value) + '" data-filter-parent-name="' + escapeHtml(entry.parentName || '') + '" data-filter-parent-value="' + escapeHtml(entry.parentValue || '') + '">' + escapeHtml(entry.value) + '</button>';
    }).join('');
  }

  function renderFilterRow(name, entries) {
    return '<div class="mdl-filter-row"><div class="mdl-filter-row__name">' + escapeHtml(name) + '</div><div class="mdl-filter-row__values">' + renderFilterButtons(entries) + '</div></div>';
  }

  function renderNestedChildren(children, parentName, parentValue) {
    return (children || []).map(function (child) {
      if (!child || !child.name) return '';
      var nodes = [];
      (child.values || []).forEach(function (raw) {
        var text = valueText(raw);
        if (!text) return;
        nodes.push({
          entry: attrPick(child.name, text, parentName, parentValue),
          deeper: raw && raw.children && raw.children.length ? renderNestedChildren(raw.children, child.name, text) : ''
        });
      });
      if (!nodes.length) return '';
      if (nodes.some(function (node) { return node.deeper; })) {
        return '<div class="mdl-filter-row"><div class="mdl-filter-row__name">' + escapeHtml(child.name) + '</div></div>' +
          nodes.map(function (node) {
            return '<div class="mdl-filter-branch">' +
              '<div class="mdl-filter-branch__head">' + renderFilterButtons([node.entry]) + '</div>' +
              (node.deeper ? '<div class="mdl-filter-branch__children">' + node.deeper + '</div>' : '') +
              '</div>';
          }).join('');
      }
      return renderFilterRow(child.name, nodes.map(function (node) { return node.entry; }));
    }).join('');
  }

  function renderFilterAttribute(attr) {
    var plain = [];
    var branches = [];
    (attr.values || []).forEach(function (value) {
      var text = valueText(value);
      if (!text) return;
      var entry = attrPick(attr.name, text);
      var nested = value && value.children && value.children.length ? renderNestedChildren(value.children, attr.name, text) : '';
      plain.push(entry);
      branches.push(
        '<div class="mdl-filter-branch">' +
        '<div class="mdl-filter-branch__head">' + renderFilterButtons([entry]) + '</div>' +
        (nested ? '<div class="mdl-filter-branch__children">' + nested + '</div>' : '') +
        '</div>'
      );
    });
    if (!branches.some(function (html) { return html.indexOf('mdl-filter-branch__children') >= 0; })) {
      return '<div class="mdl-filter-attr">' + renderFilterRow(attr.name, plain) + '</div>';
    }
    return '<div class="mdl-filter-attr mdl-filter-attr--tree">' +
      '<div class="mdl-filter-row"><div class="mdl-filter-row__name">' + escapeHtml(attr.name) + '</div></div>' +
      '<div class="mdl-filter-branches">' + branches.join('') + '</div></div>';
  }

  function selectAll(level) {
    var cursor = level;
    var hadSelection = false;
    while (cursor <= 4) {
      if (state['selectedL' + cursor]) hadSelection = true;
      state['selectedL' + cursor] = null;
      cursor += 1;
    }
    if (hadSelection) state.filter = [];
    state.page = 1;
    closeFilterModal(false);
    closeGoodsModal();
    closeDetailModal();
    renderCategories();
    renderLibrary();
  }

  function selectLevel(level, id) {
    state['selectedL' + level] = id;
    var next = level + 1;
    while (next <= 4) {
      state['selectedL' + next] = null;
      next += 1;
    }
    state.filter = [];
    state.page = 1;
    closeFilterModal(false);
    closeGoodsModal();
    closeDetailModal();
    renderCategories();
    renderLibrary();
  }

  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll('[data-lib-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lib-tab') === tab);
    });
    document.getElementById('libPaneBase').hidden = tab !== 'base';
    if (tab !== 'base') closeFilterModal(false);
  }

  function bindEvents() {
    ['catListL1', 'catListL2', 'catListL3', 'catListL4'].forEach(function (listId) {
      var el = document.getElementById(listId);
      if (!el) return;
      el.addEventListener('click', function (ev) {
        var allItem = ev.target.closest('.mdl-cat-all[data-all]');
        if (allItem && el.contains(allItem)) {
          selectAll(parseInt(allItem.getAttribute('data-level'), 10));
          return;
        }
        var item = ev.target.closest('.product-category-cascade__item[data-id]');
        if (!item) return;
        selectLevel(parseInt(item.getAttribute('data-level'), 10), item.getAttribute('data-id'));
      });
    });

    var tabs = document.getElementById('libTabs');
    if (tabs) {
      tabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-lib-tab]');
        if (!btn) return;
        switchTab(btn.getAttribute('data-lib-tab'));
      });
    }

    var addGoodsBtn = document.getElementById('libAddGoodsBtn');
    if (addGoodsBtn) {
      addGoodsBtn.addEventListener('click', function () {
        openGoodsModal();
      });
    }

    var tableBody = document.getElementById('libTableBody');
    if (tableBody) {
      tableBody.addEventListener('click', function (ev) {
        var specBtn = ev.target.closest('[data-lib-spec]');
        if (specBtn) {
          openGoodsModal(PRODUCTS[parseInt(specBtn.getAttribute('data-lib-spec'), 10)], 'spec');
          return;
        }
        var statusBtn = ev.target.closest('[data-lib-status]');
        if (statusBtn) {
          var product = PRODUCTS[parseInt(statusBtn.getAttribute('data-lib-status'), 10)];
          if (!product) return;
          var disabling = goodsStatus(product) !== 'disabled';
          product.status = disabling ? 'disabled' : 'active';
          renderLibrary();
          if (typeof showToast === 'function') showToast(disabling ? '商品已停用' : '商品已启用', 'success');
          return;
        }
        var btn = ev.target.closest('[data-lib-detail]');
        if (!btn) return;
        openDetailModal(PRODUCTS[parseInt(btn.getAttribute('data-lib-detail'), 10)]);
      });
    }

    var queryForm = document.getElementById('libQueryForm');
    if (queryForm) {
      queryForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        applyQuery();
      });
    }
    var queryReset = document.getElementById('libQueryReset');
    if (queryReset) queryReset.addEventListener('click', resetQuery);

    var pageSize = document.getElementById('libPageSize');
    if (pageSize) {
      pageSize.addEventListener('change', function () {
        state.pageSize = parseInt(pageSize.value, 10) || 20;
        state.page = 1;
        renderLibrary();
      });
    }
    var pageButtons = document.getElementById('libPaginationPages');
    if (pageButtons) {
      pageButtons.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderLibrary();
        var wrap = document.querySelector('.mdl-table-wrap');
        if (wrap) wrap.scrollTop = 0;
      });
    }
    var pageGoto = document.getElementById('libPageGoto');
    if (pageGoto) {
      pageGoto.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter') return;
        ev.preventDefault();
        var totalPages = totalPagesOf(visibleProducts().length);
        var val = parseInt(pageGoto.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderLibrary();
      });
    }

    var filterBtn = document.getElementById('libFilterBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', function () {
        openFilterModal();
      });
    }

    var filterbar = document.querySelector('.mdl-filterbar');
    if (filterbar) {
      filterbar.addEventListener('click', function (ev) {
        if (ev.target.id === 'libFilterClear') {
          state.filter = [];
          state.page = 1;
          renderLibrary();
          return;
        }
        var removeBtn = ev.target.closest('[data-filter-remove-value]');
        if (!removeBtn) return;
        state.filterDraft = null;
        state.page = 1;
        toggleFilter({
          name: removeBtn.getAttribute('data-filter-remove-name') || '',
          value: removeBtn.getAttribute('data-filter-remove-value') || '',
          parentName: removeBtn.getAttribute('data-filter-remove-parent-name') || '',
          parentValue: removeBtn.getAttribute('data-filter-remove-parent-value') || ''
        });
        renderLibrary();
      });
    }
  }

  var MOCK_PER_CATEGORY = 3;
  var MOCK_VARIANTS = [
    { suffix: '精选', tone: 'blue' },
    { suffix: '家庭装', tone: 'green' },
    { suffix: '产地直供', tone: 'orange' }
  ];
  var MOCK_UNITS = [
    { purchase: '箱', min: '个', spec: '包', pack: '箱' },
    { purchase: '箱', min: '袋', spec: '包', pack: '箱' },
    { purchase: '件', min: '个', spec: '袋', pack: '箱' }
  ];

  function pushNestedAttrs(attrs, children, parentName, parentValue, variantIndex) {
    (children || []).forEach(function (child) {
      var texts = (child && child.values || []).map(function (raw) {
        return { text: valueText(raw), raw: raw };
      }).filter(function (item) { return item.text; });
      if (!child || !child.name || !texts.length) return;
      var picked = texts[variantIndex % texts.length];
      attrs.push(attrPick(child.name, picked.text, parentName, parentValue));
      pushNestedAttrs(attrs, picked.raw && picked.raw.children, child.name, picked.text, variantIndex);
    });
  }

  function pickMockAttrs(categoryId, variantIndex) {
    var attrs = [];
    store.listAttributeRows(categoryId).forEach(function (row) {
      var values = ((row.attr && row.attr.values) || []).map(function (value) {
        return { text: valueText(value), raw: value };
      }).filter(function (item) { return item.text; });
      if (!values.length) return;
      var picked = values[variantIndex % values.length];
      attrs.push(attrPick(row.attr.name, picked.text));
      pushNestedAttrs(attrs, picked.raw && picked.raw.children, row.attr.name, picked.text, variantIndex);
    });
    return attrs;
  }

  function unitMeasure(gross, tare, length, width, height) {
    var net = Math.round((Number(gross) - Number(tare)) * 1000) / 1000;
    var cubic = Number(length) * Number(width) * Number(height);
    var volume = cubic ? String(Math.round((cubic / 1000000) * 1000000) / 1000000) : '';
    return {
      grossWeight: String(gross),
      tareWeight: String(tare),
      netWeight: String(net),
      length: String(length),
      width: String(width),
      height: String(height),
      volume: volume
    };
  }

  function detailProfile(base) {
    return base;
  }

  var DETAIL_BY_BARCODE = {
    '6974562300012': detailProfile({
      shelfLife: '180', operateMode: '购销', weigh: '否', tempLayer: '冷冻',
      minRateQty: 50, minRateUnit: 'g', specRateQty: 100, specRateUnit: '个', packRateQty: 20, packRateUnit: '包',
      measures: { min: unitMeasure(0.055, 0.005, 5, 4, 3), spec: unitMeasure(5.2, 0.2, 32, 22, 15), pack: unitMeasure(105, 5, 48, 36, 32) },
      sellingPoint: '50g 一口一个，皮薄馅足，100个/包，冷链到店即可蒸制。',
      productIntro: '生物发面猪肉小笼包，单只净重 50g，每包 100 个，整箱 20 包。',
      extraUsage: '冷冻保存，蒸制前无需解冻，大火蒸 8–10 分钟。',
      scene: '适用于早餐档口、团餐和门店热食出餐。',
      afterSale: '到货破损或温度异常，请在签收 24 小时内联系售后。',
      graphicDetail: '含单只、整包和整箱实拍，以及蒸制后的成品展示。'
    }),
    '6974562300013': detailProfile({
      shelfLife: '180', operateMode: '购销', weigh: '否', tempLayer: '冷冻',
      minRateQty: 50, minRateUnit: 'g', specRateQty: 100, specRateUnit: '个', packRateQty: 10, packRateUnit: '包',
      measures: { min: unitMeasure(0.058, 0.008, 5, 4, 3), spec: unitMeasure(5.4, 0.4, 32, 22, 15), pack: unitMeasure(55, 3, 40, 32, 28) },
      sellingPoint: '牛肉馅小笼包，单只 50g，口感紧实，适合冷链配送。',
      productIntro: '生物发面牛肉小笼包，1个=50g，1包=100个，1箱=10包。',
      extraUsage: '保持冷冻，蒸制时不要叠放，避免粘连。',
      scene: '适用于午晚餐热食、外卖套餐和团餐。',
      afterSale: '融化、破袋可按批次申请补货。',
      graphicDetail: '展示馅料剖面、单包标签和整箱堆码。'
    }),
    '6974562300101': detailProfile({
      shelfLife: '7', operateMode: '代采代销', weigh: '是', tempLayer: '冷藏',
      minRateQty: 500, minRateUnit: 'g', specRateQty: 10, specRateUnit: '斤', packRateQty: 10, packRateUnit: '斤',
      measures: { min: unitMeasure(0.52, 0.02, 12, 8, 8), spec: unitMeasure(5.3, 0.3, 40, 30, 22), pack: unitMeasure(5.3, 0.3, 40, 30, 22) },
      sellingPoint: '本地圆茄，果型均匀，已洗净，冷藏当日达。',
      productIntro: '圆茄按斤称重，1斤=500g，每箱 10 斤。',
      extraUsage: '冷藏避光存放，建议 3 日内售完。',
      scene: '适用于生鲜柜台和餐饮配菜。',
      afterSale: '腐烂、压伤在签收时拍照即可退换。',
      graphicDetail: '含果型、果蒂和整箱装箱照片。'
    }),
    '6974562300102': detailProfile({
      shelfLife: '7', operateMode: '代采代销', weigh: '是', tempLayer: '常温',
      minRateQty: 500, minRateUnit: 'g', specRateQty: 8, specRateUnit: '斤', packRateQty: 8, packRateUnit: '斤',
      measures: { min: unitMeasure(0.51, 0.01, 8, 7, 6), spec: unitMeasure(4.2, 0.2, 36, 28, 18), pack: unitMeasure(4.2, 0.2, 36, 28, 18) },
      sellingPoint: '普罗旺斯西红柿，沙瓤，适合生食和热菜。',
      productIntro: '按斤销售，1斤=500g，每箱 8 斤。',
      extraUsage: '常温短存，避免挤压和日晒。',
      scene: '适用于沙拉、炒菜和零售称重。',
      afterSale: '软烂果按实收重量扣减。',
      graphicDetail: '含单果、切面和整箱照片。'
    }),
    '6974562300201': detailProfile({
      shelfLife: '270', operateMode: '购销', weigh: '否', tempLayer: '常温',
      minRateQty: 330, minRateUnit: 'ml', specRateQty: 24, specRateUnit: '罐', packRateQty: 24, packRateUnit: '罐',
      measures: { min: unitMeasure(0.36, 0.03, 6, 6, 12), spec: unitMeasure(8.8, 0.4, 40, 27, 14), pack: unitMeasure(8.8, 0.4, 40, 27, 14) },
      sellingPoint: '摩登罐 330ml，气足，整箱 24 罐便于补货。',
      productIntro: '可口可乐摩登罐，1罐=330ml，1箱=24罐。',
      extraUsage: '常温避光，冷藏后口感更佳，避免暴晒。',
      scene: '适用于便利店、餐饮套餐和团购。',
      afterSale: '漏气、瘪罐按罐换货。',
      graphicDetail: '含单罐、六连包和整箱侧面。'
    }),
    '6974562300301': detailProfile({
      shelfLife: '365', operateMode: '购销', weigh: '否', tempLayer: '常温',
      minRateQty: 5, minRateUnit: 'kg', specRateQty: 5, specRateUnit: 'kg', packRateQty: 4, packRateUnit: '袋',
      measures: { min: unitMeasure(5.05, 0.05, 38, 26, 8), spec: unitMeasure(5.05, 0.05, 38, 26, 8), pack: unitMeasure(20.4, 0.4, 42, 32, 28) },
      sellingPoint: '东北大米 5kg 袋装，颗粒完整，适合家庭装。',
      productIntro: '1袋=5kg，1箱=4袋。',
      extraUsage: '阴凉干燥处存放，开封后扎紧袋口。',
      scene: '适用于商超货架和餐饮主食。',
      afterSale: '结块、受潮可整袋更换。',
      graphicDetail: '含米粒特写、袋装正面和整箱。'
    }),
    '6974562300401': detailProfile({
      shelfLife: '30', operateMode: '联营', weigh: '否', tempLayer: '冷藏',
      minRateQty: 200, minRateUnit: 'g', specRateQty: 40, specRateUnit: '个', packRateQty: 40, packRateUnit: '个',
      measures: { min: unitMeasure(0.22, 0.02, 8, 8, 7), spec: unitMeasure(8.6, 0.6, 50, 32, 28), pack: unitMeasure(8.6, 0.6, 50, 32, 28) },
      sellingPoint: '红富士，脆甜，中果，冷藏保鲜。',
      productIntro: '单果约 200g，1箱=40个。',
      extraUsage: '冷藏存放，避免与催熟水果混放。',
      scene: '适用于水果柜台和礼盒分装。',
      afterSale: '碰伤果按个数核销。',
      graphicDetail: '含单果、果径和开箱照片。'
    }),
    '6974562300501': detailProfile({
      shelfLife: '730', operateMode: '购销', weigh: '否', tempLayer: '常温',
      minRateQty: 250, minRateUnit: 'ml', specRateQty: 50, specRateUnit: '个', packRateQty: 100, packRateUnit: '个',
      measures: { min: unitMeasure(0.008, 0.003, 7, 7, 9), spec: unitMeasure(0.45, 0.05, 28, 20, 24), pack: unitMeasure(0.9, 0.1, 40, 30, 32) },
      sellingPoint: '加厚纸杯 250ml，单层覆膜，不易渗漏。',
      productIntro: '1个=250ml，1箱=100个。',
      extraUsage: '避免重压，使用时不要超过标示容量。',
      scene: '适用于茶饮、咖啡和活动用水。',
      afterSale: '变形、污损按包更换。',
      graphicDetail: '含单只、摞装和整箱照片。'
    })
  };

  function genericDetailProfile(name, units, index) {
    var minRate = units.min === '袋' ? 500 : 50;
    var specRate = units.spec === '包' && units.min === '个' ? 50 : (units.spec === '袋' ? 20 : 10);
    var packRate = 6 + (index % 5);
    var shelf = String([90, 180, 365, 30][index % 4]);
    return {
      shelfLife: shelf,
      operateMode: ['购销', '代采代销', '联营'][index % 3],
      weigh: '否',
      tempLayer: ['常温', '冷藏', '冷冻'][index % 3],
      minRateQty: minRate,
      minRateUnit: 'g',
      specRateQty: specRate,
      specRateUnit: units.min,
      packRateQty: packRate,
      packRateUnit: units.spec,
      measures: {
        min: unitMeasure(0.08 + (index % 4) * 0.02, 0.01, 8, 6, 4),
        spec: unitMeasure(1.2 + (index % 3) * 0.3, 0.1, 24, 16, 10),
        pack: unitMeasure(8 + (index % 4), 0.5, 42, 30, 24)
      },
      sellingPoint: name + '，规格统一，适合门店日常补货。',
      productIntro: name + '。换算为 1' + units.min + '=' + minRate + 'g，1' + units.spec + '=' + specRate + units.min + '，1' + units.pack + '=' + packRate + units.spec + '。',
      extraUsage: '按温层存放，开封后尽快售出。',
      scene: '适用于零售货架、餐饮后厨和团购配送。',
      afterSale: '签收后如有破损、短少，请在 24 小时内联系售后。',
      graphicDetail: name + '的实拍包含单件、内包装和整箱，供销售端复用。'
    };
  }

  function applyDetailProfile(item, profile) {
    if (!profile) return;
    Object.keys(profile).forEach(function (key) {
      if (item[key] == null || item[key] === '') item[key] = profile[key];
    });
  }

  PRODUCTS.forEach(function (item) {
    applyDetailProfile(item, DETAIL_BY_BARCODE[item.barcode]);
  });

  function fillCategoryProducts() {
    store.getByLevel(4).forEach(function (node, index) {
      var existing = PRODUCTS.filter(function (item) { return item.category === node.name; }).length;
      var variant = existing;
      while (existing < MOCK_PER_CATEGORY) {
        var spec = MOCK_VARIANTS[variant % MOCK_VARIANTS.length];
        var units = MOCK_UNITS[variant % MOCK_UNITS.length];
        var seq = index * 10 + variant + 1;
        var name = node.name + ' ' + spec.suffix;
        PRODUCTS.push({
          category: node.name,
          sku: '',
          barcode: '69746' + String(10000000 + seq),
          barcodeCount: 1,
          name: name,
          brand: '冷丰优选',
          purchasePrice: Math.round((4.5 + (index % 9) + variant * 1.6) * 10) / 10,
          purchaseQty: 0,
          purchaseUnit: units.purchase,
          minQty: 0,
          minUnit: units.min,
          specQty: 0,
          specUnit: units.spec,
          packQty: 0,
          packUnit: units.pack,
          amount: 0,
          tone: spec.tone,
          mark: node.name.charAt(0),
          attrs: pickMockAttrs(node.id, variant)
        });
        applyDetailProfile(PRODUCTS[PRODUCTS.length - 1], genericDetailProfile(name, units, variant));
        existing += 1;
        variant += 1;
      }
    });
  }

  function syncCategoryCounts() {
    var categories = store.getCategories();
    categories.forEach(function (category) {
      category.product_count = category.level === 4
        ? PRODUCTS.filter(function (item) { return item.category === category.name; }).length
        : 0;
    });
    [3, 2, 1].forEach(function (level) {
      categories.forEach(function (category) {
        if (category.level !== level) return;
        category.product_count = categories
          .filter(function (item) { return item.parent_id === category.id; })
          .reduce(function (sum, item) { return sum + (item.product_count || 0); }, 0);
      });
    });
  }

  function copyAttrs(attrs) {
    return (attrs || []).map(function (attr) {
      return { name: attr.name, value: attr.value, parentName: attr.parentName || '', parentValue: attr.parentValue || '' };
    });
  }

  function addSameSpuSpecs() {
    var pork = null;
    var beef = null;
    PRODUCTS.forEach(function (item) {
      if (item.spuKey === 'pork-xlb' && !pork) pork = item;
      if (item.spuKey === 'beef-xlb' && !beef) beef = item;
    });
    if (!pork || !beef) return;
    function pushSpec(base, spec) {
      PRODUCTS.push({
        category: base.category,
        spuKey: base.spuKey,
        sku: '',
        barcode: spec.barcode,
        barcodeCount: 1,
        name: spec.name,
        brand: base.brand,
        purchasePrice: spec.purchasePrice,
        purchaseQty: 0,
        purchaseUnit: '箱',
        minQty: 0,
        minUnit: '个',
        specQty: 0,
        specUnit: '包',
        packQty: 0,
        packUnit: '箱',
        amount: 0,
        tone: base.tone,
        mark: base.mark,
        status: 'active',
        weigh: '否',
        operateMode: '购销',
        shelfLife: '180',
        tempLayer: '冷冻',
        minRateQty: spec.minRateQty,
        minRateUnit: 'g',
        specRateQty: spec.specRateQty,
        specRateUnit: '个',
        packRateQty: spec.packRateQty,
        packRateUnit: '包',
        measures: {
          min: unitMeasure(spec.minGross, 0.005, 5, 4, 3),
          spec: unitMeasure(spec.specGross, 0.2, 32, 22, 15),
          pack: unitMeasure(spec.packGross, 4, 48, 36, 32)
        },
        sellingPoint: spec.sellingPoint,
        productIntro: spec.name + '。1个=' + spec.minRateQty + 'g，1包=' + spec.specRateQty + '个，1箱=' + spec.packRateQty + '包。',
        extraUsage: '冷冻保存，蒸制前无需解冻。',
        scene: '适用于早餐档口、团餐和门店热食出餐。',
        afterSale: '到货破损或温度异常，请在签收 24 小时内联系售后。',
        graphicDetail: spec.name + '的实拍包含单只、整包和整箱。',
        attrs: copyAttrs(base.attrs),
        ingredients: spec.ingredients
      });
    }
    pushSpec(pork, {
      barcode: '6974562300014',
      name: '生物发面猪肉小笼包 30g 150个/包',
      purchasePrice: 16.8,
      minRateQty: 30,
      specRateQty: 150,
      packRateQty: 16,
      minGross: 0.035,
      specGross: 4.8,
      packGross: 78,
      sellingPoint: '30g 小只，150个/包，适合早餐快餐出餐。',
      ingredients: [
        ingredientRow('ing1', '小麦粉', '面皮原料', 40, '含麸质的谷物', '供应商 BOM 清单'),
        ingredientRow('ing2', '猪肉', '馅料主料', 24, '无', '供应商 BOM 清单'),
        ingredientRow('ing3', '饮用水', '加工辅料', 22, '无', '生产工艺单'),
        ingredientRow('ing4', '洋葱、姜', '馅料辅料', 8, '无', '供应商 BOM 清单'),
        ingredientRow('ing5', '食用植物油、食用盐、生抽', '调味料', 4, '含大豆及其制品', '配方版本 LF-2026Q3'),
        ingredientRow('ing6', '酵母 / 老面', '发酵辅料', 2, '无', '生产工艺单')
      ]
    });
    pushSpec(pork, {
      barcode: '6974562300015',
      name: '生物发面猪肉小笼包 80g 60个/包',
      purchasePrice: 22.6,
      minRateQty: 80,
      specRateQty: 60,
      packRateQty: 12,
      minGross: 0.086,
      specGross: 5.4,
      packGross: 66,
      sellingPoint: '80g 大只，馅多汁足，60个/包。',
      ingredients: [
        ingredientRow('ing1', '小麦粉', '面皮原料', 32, '含麸质的谷物', '供应商 BOM 清单'),
        ingredientRow('ing2', '猪肉', '馅料主料', 34, '无', '供应商 BOM 清单'),
        ingredientRow('ing3', '饮用水', '加工辅料', 16, '无', '生产工艺单'),
        ingredientRow('ing4', '洋葱、姜', '馅料辅料', 8, '无', '供应商 BOM 清单'),
        ingredientRow('ing5', '食用植物油、食用盐、生抽', '调味料', 7, '含大豆及其制品', '配方版本 LF-2026Q3'),
        ingredientRow('ing6', '芝麻油', '调味料', 3, '含芝麻', '生产工艺单')
      ]
    });
    pushSpec(beef, {
      barcode: '6974562300016',
      name: '生物发面牛肉小笼包 80g 60个/包',
      purchasePrice: 24.5,
      minRateQty: 80,
      specRateQty: 60,
      packRateQty: 10,
      minGross: 0.088,
      specGross: 5.5,
      packGross: 56,
      sellingPoint: '80g 牛肉大只，60个/包，适合正餐热食。',
      ingredients: [
        ingredientRow('ing1', '小麦粉', '面皮原料', 34, '含麸质的谷物', '供应商 BOM 清单'),
        ingredientRow('ing2', '牛肉', '馅料主料', 32, '无', '供应商 BOM 清单'),
        ingredientRow('ing3', '饮用水', '加工辅料', 18, '无', '生产工艺单'),
        ingredientRow('ing4', '洋葱、姜', '馅料辅料', 8, '无', '供应商 BOM 清单'),
        ingredientRow('ing5', '食用植物油、食用盐、生抽', '调味料', 6, '含大豆及其制品', '配方版本 LF-2026Q3'),
        ingredientRow('ing6', '酵母 / 老面', '发酵辅料', 2, '无', '生产工艺单')
      ]
    });
  }

  function init() {
    if (!store || typeof store.load !== 'function') return;
    store.load();
    fillCategoryProducts();
    addSameSpuSpecs();
    assignMissingSpu();
    assignAllSkus();
    window.MasterDataGoodsCatalog = PRODUCTS.filter(function (item) {
      return item && item.sku;
    }).map(function (item) {
      return {
        sku: item.sku,
        spu: item.spu || '',
        name: item.name || '',
        barcode: item.barcode || '',
        purchaseUnit: item.purchaseUnit || '',
        purchasePrice: item.purchasePrice,
        shelfLife: item.shelfLife || '',
        tempLayer: item.tempLayer || '',
        operateMode: item.operateMode || '',
        tone: item.tone || 'blue',
        mark: item.mark || (item.name || '').charAt(0)
      };
    });
    if (!document.getElementById('libTableBody')) return;
    syncCategoryCounts();
    fillBrandQuery();
    bindEvents();
    renderCategories();
    renderLibrary();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
