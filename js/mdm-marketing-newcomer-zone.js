/**
 * 营销 - 新人专区列表
 */
(function () {
  var ALL_PRODUCTS = [];
  var saleFilterCtrl = null;
  var state = {
    filtered: [],
    page: 1,
    pageSize: 20,
    expanded: {},
    sort: { key: '', dir: '' },
    filters: {
      keyword: '',
      category: '',
      deliveryMode: '',
      saleScope: '',
      saleStoreId: '',
      saleRegionId: '',
      saleRegionParts: { province: '', city: '', district: '' },
      status: '',
      hasSchedule: '',
      priceMin: '',
      priceMax: ''
    }
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(num) {
    var n = Math.round((Number(num) || 0) * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    return '¥' + n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function loadList() {
    ALL_PRODUCTS = window.MdmNewcomerZoneStore ? window.MdmNewcomerZoneStore.getAll() : [];
  }

  function parseOptionalNumber(val) {
    if (val === '' || val == null) return null;
    var n = Number(val);
    return isNaN(n) ? null : n;
  }

  function getAllSpecs(item) {
    return Array.isArray(item.specs) && item.specs.length ? item.specs : [];
  }

  /** 列表仅展示已开启售卖的规格 */
  function getEnabledSpecs(item) {
    return getAllSpecs(item).filter(function (s) { return !!s.saleEnabled; });
  }

  function sumEnabledField(item, field) {
    return getEnabledSpecs(item).reduce(function (sum, spec) {
      return sum + (Number(spec[field]) || 0);
    }, 0);
  }

  function normalizeDeliveryMode(mode) {
    if (mode === 'express' || mode === '快递到店' || mode === '快递' || mode === '快递配送' || mode === 'store') {
      return 'express';
    }
    if (mode === 'platform' || mode === '平台配送' || mode === '配送' || mode === 'warehouse' || mode === 'delivery') {
      return 'platform';
    }
    return 'platform';
  }

  function deliveryModeLabel(mode) {
    return normalizeDeliveryMode(mode) === 'express' ? '快递配送' : '平台配送';
  }

  function matchFilters(item) {
    var f = state.filters;
    if (f.keyword) {
      var hay = ((item.name || '') + ' ' + (item.code || '')).toLowerCase();
      if (hay.indexOf(f.keyword.toLowerCase()) < 0) return false;
    }
    if (f.category && item.category !== f.category) return false;
    if (f.status && displayShelfStatus(item) !== f.status) return false;
    if (f.hasSchedule === 'yes' && !hasScheduleConfigured(item)) return false;
    if (f.hasSchedule === 'no' && hasScheduleConfigured(item)) return false;
    if (f.deliveryMode && normalizeDeliveryMode(item.deliveryMode) !== f.deliveryMode) return false;
    if (window.MdmMemberPointsRuleListFilter && window.MdmMemberPointsRuleListFilter.matchSaleScopeFilter) {
      if (!window.MdmMemberPointsRuleListFilter.matchSaleScopeFilter(item, {
        type: f.saleScope,
        storeId: f.saleStoreId,
        regionId: f.saleRegionId,
        regionParts: f.saleRegionParts
      })) return false;
    } else if (f.saleScope) {
      var scope = item.saleScope === 'region' || item.saleScope === 'store' ? item.saleScope : 'all';
      if (scope !== f.saleScope) return false;
    }

    var enabled = getEnabledSpecs(item);
    if (!enabled.length) return false;

    var min = parseOptionalNumber(f.priceMin);
    var max = parseOptionalNumber(f.priceMax);
    if (min != null || max != null) {
      var hit = enabled.some(function (s) {
        var price = Number(s.salePrice) || 0;
        if (min != null && price < min) return false;
        if (max != null && price > max) return false;
        return true;
      });
      if (!hit) return false;
    }
    return true;
  }

  function applySort(list) {
    if (!state.sort.key || !state.sort.dir) return list;
    var field = state.sort.key === 'sold' ? 'soldQty' : 'stock';
    var dir = state.sort.dir === 'asc' ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av = sumEnabledField(a, field);
      var bv = sumEnabledField(b, field);
      if (av === bv) return String(a.code || '').localeCompare(String(b.code || ''));
      return av > bv ? dir : -dir;
    });
  }

  function applyFilters() {
    state.filtered = applySort(ALL_PRODUCTS.filter(matchFilters));
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function renderSalePrice(spec) {
    return '<span class="mkt-newcomer-zone-price">' + formatMoney(spec.salePrice) + '</span>';
  }

  function renderLinePrice(spec) {
    if (spec.linePrice == null || spec.linePrice === '') {
      return '<span class="mkt-newcomer-zone-line-price">-</span>';
    }
    return '<span class="mkt-newcomer-zone-line-price">' + formatMoney(spec.linePrice) + '</span>';
  }

  function hasScheduleConfigured(item) {
    return item.status === 'schedule' && !!(item.scheduleOnAt || item.scheduleOffAt);
  }

  /** 列表状态列仅展示上架/下架；定时商品按当前时间推算展示态 */
  function displayShelfStatus(item) {
    if (item.status === 'on_shelf') return 'on_shelf';
    if (item.status === 'off_shelf') return 'off_shelf';
    if (item.status === 'schedule') {
      var now = Date.now();
      var onMs = item.scheduleOnAt ? Date.parse(String(item.scheduleOnAt).replace(' ', 'T')) : NaN;
      var offMs = item.scheduleOffAt ? Date.parse(String(item.scheduleOffAt).replace(' ', 'T')) : NaN;
      if (!isNaN(onMs) && !isNaN(offMs) && now >= onMs && now < offMs) return 'on_shelf';
      return 'off_shelf';
    }
    return 'off_shelf';
  }

  function renderStatus(item) {
    if (displayShelfStatus(item) === 'off_shelf') {
      return '<span class="product-tag product-tag--stopped">下架</span>';
    }
    return '<span class="product-tag product-tag--on-shelf">上架</span>';
  }

  function formatScheduleTime(val) {
    if (!val) return '';
    return String(val).replace('T', ' ').slice(0, 16);
  }

  function renderScheduleCell(item) {
    var hasSchedule = item.status === 'schedule' && (item.scheduleOnAt || item.scheduleOffAt);
    if (!hasSchedule) return '';
    var lines = [];
    if (item.scheduleOnAt) lines.push('上架 ' + formatScheduleTime(item.scheduleOnAt));
    if (item.scheduleOffAt) lines.push('下架 ' + formatScheduleTime(item.scheduleOffAt));
    return '<div class="mkt-newcomer-zone-schedule-cell">' + escapeHtml(lines.join('\n')).replace(/\n/g, '<br>') + '</div>';
  }

  function renderActions(item) {
    var shelf = displayShelfStatus(item);
    var html = '<div class="product-action">';
    html += '<button type="button" class="product-action__link" data-action="edit" data-code="' +
      escapeHtml(item.code) + '">编辑</button>';
    if (shelf === 'on_shelf') {
      html += '<button type="button" class="product-action__link" data-action="off-shelf" data-code="' +
        escapeHtml(item.code) + '">下架</button>';
    } else {
      html += '<button type="button" class="product-action__link" data-action="on-shelf" data-code="' +
        escapeHtml(item.code) + '">上架</button>';
    }
    html += '</div>';
    return html;
  }

  function goEditForm(code) {
    code = String(code || '').trim();
    if (!code) return;
    try {
      sessionStorage.setItem('mdm_newcomer_zone_edit_code', code);
    } catch (e) { /* ignore */ }
    /* 不带 .html：避免 serve cleanUrls 301 时丢掉 ?code= */
    window.location.href = 'mdm_marketing_newcomer_zone_form?code=' + encodeURIComponent(code);
  }

  function renderSpecCell(spec, item, visibleCount, totalEnabled, expanded) {
    var html = '<div class="mkt-newcomer-zone-spec-cell">' + escapeHtml(spec.specName || '-') + '</div>';
    if (totalEnabled > 1) {
      if (!expanded) {
        html +=
          '<button type="button" class="mkt-newcomer-zone-spec-toggle" data-expand-code="' + escapeHtml(item.code) + '">' +
          '展开(' + (totalEnabled - 1) + ')' +
          '</button>';
      } else {
        html +=
          '<button type="button" class="mkt-newcomer-zone-spec-toggle" data-collapse-code="' + escapeHtml(item.code) + '">收起</button>';
      }
    }
    return html;
  }

  function renderProductRows(item, productIndex, serialNo) {
    var enabled = getEnabledSpecs(item);
    if (!enabled.length) return '';

    var expanded = !!state.expanded[item.code];
    var visible = expanded ? enabled : enabled.slice(0, 1);
    var totalEnabled = enabled.length;
    var rowSpan = visible.length;
    var alt = productIndex % 2 === 1;
    var rows = [];

    visible.forEach(function (spec, si) {
      var isFirst = si === 0;
      var rowCls = 'product-proxy-table__row mkt-newcomer-zone-row' +
        (alt ? ' product-proxy-table__row--alt' : '') +
        (si < visible.length - 1 ? ' mkt-newcomer-zone-row--sku-open' : '') +
        (si > 0 ? ' mkt-newcomer-zone-row--sku-cont' : '');
      var html = '<tr class="' + rowCls + '" data-code="' + escapeHtml(item.code) + '">';

      if (isFirst) {
        html +=
          '<td class="product-proxy-table__td mkt-newcomer-zone-td--seq" rowspan="' + rowSpan + '">' +
          escapeHtml(String(serialNo)) +
          '</td>' +
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' + escapeHtml(item.name) + '</td>' +
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' +
          '  <div class="product-proxy-code">' + escapeHtml(item.code) + '</div>' +
          '  <div class="product-proxy-code__sub">' + totalEnabled + '个规格</div>' +
          '</td>' +
          '<td class="product-proxy-table__td product-proxy-table__td--img" rowspan="' + rowSpan + '">' +
          '  <img class="product-table__thumb" src="' + escapeHtml(item.img) + '" alt="" onerror="this.onerror=null;this.src=\'../user-app/assets/restock/product-leaf.svg\'">' +
          '</td>' +
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' + escapeHtml(item.category || '-') + '</td>';
      }

      html +=
        '<td class="product-proxy-table__td">' +
        (isFirst
          ? renderSpecCell(spec, item, visible.length, totalEnabled, expanded)
          : '<div class="mkt-newcomer-zone-spec-cell">' + escapeHtml(spec.specName || '-') + '</div>') +
        '</td>' +
        '<td class="product-proxy-table__td">' + formatMoney(spec.purchasePrice) + '</td>' +
        '<td class="product-proxy-table__td">' + renderLinePrice(spec) + '</td>' +
        '<td class="product-proxy-table__td">' + escapeHtml(String(spec.stock != null ? spec.stock : 0)) + '</td>' +
        '<td class="product-proxy-table__td">' + renderSalePrice(spec) + '</td>' +
        '<td class="product-proxy-table__td">' + escapeHtml(String(spec.soldQty != null ? spec.soldQty : 0)) + '</td>';

      if (isFirst) {
        html +=
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' +
          escapeHtml(deliveryModeLabel(item.deliveryMode)) +
          '</td>' +
          
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' + renderStatus(item) + '</td>' +
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' + renderScheduleCell(item) + '</td>' +
          '<td class="product-proxy-table__td" rowspan="' + rowSpan + '">' + renderActions(item) + '</td>';
      }

      html += '</tr>';
      rows.push(html);
    });

    return rows.join('');
  }

  function syncSortHeaderUi() {
    document.querySelectorAll('.mkt-newcomer-zone-th-sort[data-sort-key]').forEach(function (btn) {
      var key = btn.getAttribute('data-sort-key');
      btn.classList.toggle('is-asc', state.sort.key === key && state.sort.dir === 'asc');
      btn.classList.toggle('is-desc', state.sort.key === key && state.sort.dir === 'desc');
    });
  }

  function toggleSort(key) {
    if (state.sort.key !== key) {
      state.sort = { key: key, dir: 'asc' };
    } else if (state.sort.dir === 'asc') {
      state.sort = { key: key, dir: 'desc' };
    } else {
      state.sort = { key: '', dir: '' };
    }
    state.page = 1;
    renderTable();
  }

  function renderTable() {
    applyFilters();
    syncSortHeaderUi();
    var tbody = document.getElementById('newcomerZoneTableBody');
    var empty = document.getElementById('newcomerZoneEmpty');
    var totalEl = document.getElementById('newcomerZonePaginationTotal');
    if (!tbody) return;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    if (totalEl) totalEl.textContent = '共 ' + state.filtered.length + ' 条';

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
      renderPagination();
      return;
    }

    if (empty) empty.hidden = true;
    var total = state.filtered.length;
    tbody.innerHTML = pageItems.map(function (item, idx) {
      /* 序号倒序：全量筛选结果从大到小编号 */
      var serialNo = total - start - idx;
      return renderProductRows(item, idx, serialNo);
    }).join('');
    renderPagination();
  }

  function renderPagination() {
    var pagesEl = document.getElementById('newcomerZonePaginationPages');
    var gotoEl = document.getElementById('newcomerZonePageGoto');
    if (!pagesEl) return;

    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize) || 1);
    if (gotoEl) gotoEl.value = String(state.page);

    var html = '';
    var maxBtns = 7;
    var start = Math.max(1, state.page - Math.floor(maxBtns / 2));
    var end = Math.min(totalPages, start + maxBtns - 1);
    start = Math.max(1, end - maxBtns + 1);

    html += '<button type="button" class="product-pagination__btn" data-page="' + Math.max(1, state.page - 1) + '"' + (state.page <= 1 ? ' disabled' : '') + '>上一页</button>';
    for (var i = start; i <= end; i++) {
      html +=
        '<button type="button" class="product-pagination__btn' + (i === state.page ? ' is-active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="product-pagination__btn" data-page="' + Math.min(totalPages, state.page + 1) + '"' + (state.page >= totalPages ? ' disabled' : '') + '>下一页</button>';
    pagesEl.innerHTML = html;
  }

  function readFiltersFromForm() {
    state.filters.keyword = (document.getElementById('qNcKeyword') || {}).value.trim() || '';
    state.filters.category = (document.getElementById('qNcCategory') || {}).value || '';
    state.filters.deliveryMode = (document.getElementById('qNcDeliveryMode') || {}).value || '';
    state.filters.status = (document.getElementById('qNcStatus') || {}).value || '';
    state.filters.hasSchedule = (document.getElementById('qNcHasSchedule') || {}).value || '';
    state.filters.priceMin = (document.getElementById('qNcPriceMin') || {}).value;
    state.filters.priceMax = (document.getElementById('qNcPriceMax') || {}).value;
    var sale = saleFilterCtrl ? saleFilterCtrl.getState() : {};
    state.filters.saleScope = sale.type || (document.getElementById('qNcSaleScope') || {}).value || '';
    state.filters.saleStoreId = sale.storeId || '';
    state.filters.saleRegionId = sale.regionId || '';
    state.filters.saleRegionParts = sale.regionParts || { province: '', city: '', district: '' };
  }

  function resetFiltersForm() {
    var form = document.getElementById('newcomerZoneFilterForm');
    if (form) form.reset();
    if (saleFilterCtrl) saleFilterCtrl.reset();
    state.filters = {
      keyword: '',
      category: '',
      deliveryMode: '',
      saleScope: '',
      saleStoreId: '',
      saleRegionId: '',
      saleRegionParts: { province: '', city: '', district: '' },
      status: '',
      hasSchedule: '',
      priceMin: '',
      priceMax: ''
    };
    state.sort = { key: '', dir: '' };
    state.page = 1;
  }

  function refresh(resetPage) {
    loadList();
    if (resetPage) state.page = 1;
    renderTable();
  }

  function openWarmConfirm(message, onConfirm) {
    var existing = document.querySelector('[data-newcomer-zone-warm]');
    if (existing) existing.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-newcomer-zone-warm', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">温馨提示</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="erp-modal-confirm__row">' +
      '      <div class="erp-modal-confirm__icon">!</div>' +
      '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-warm-close>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
      '  </div>' +
      '</div>';

    function close() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
    });
    backdrop.querySelectorAll('[data-warm-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
    document.body.appendChild(backdrop);
  }

  function handlePickedProducts(picked) {
    if (!picked || !picked.length || !window.MdmNewcomerZoneStore) return;

    if (picked.length === 1) {
      var built = window.MdmNewcomerZoneStore.buildFromCatalogProduct(picked[0], {
        salePrice: 9.9,
        status: 'off_shelf',
        limitType: 'none'
      });
      if (!built || !built.code) {
        if (typeof showToast === 'function') showToast('选品数据无效，请重新勾选', 'warning');
        return;
      }
      if (window.MdmNewcomerZoneStore.getByCode(built.code)) {
        if (typeof showToast === 'function') showToast('该商品已在新人专区中（编码 ' + built.code + '）', 'warning');
        return;
      }
      /* 先写入草稿，再进入编辑新人专区商品页完善配置 */
      window.MdmNewcomerZoneStore.upsert(built);
      goEditForm(built.code);
      return;
    }

    var items = [];
    picked.forEach(function (p) {
      var row = window.MdmNewcomerZoneStore.buildFromCatalogProduct(p, {
        salePrice: 9.9,
        status: 'off_shelf',
        limitType: 'none'
      });
      if (row && row.code) items.push(row);
    });
    var count = window.MdmNewcomerZoneStore.addMany(items);
    refresh(true);
    if (typeof showToast === 'function') {
      showToast(count ? ('已添加 ' + count + ' 件商品（默认开启首个规格，请编辑完善后上架）') : '未添加新商品（可能均已存在）', count ? 'success' : 'info');
    }
  }

  function bindClearButtons() {
    document.querySelectorAll('#newcomerZoneFilterForm .input-wrapper').forEach(function (wrap) {
      var input = wrap.querySelector('input');
      var clearBtn = wrap.querySelector('.clear-btn');
      if (!input || !clearBtn) return;
      function sync() {
        clearBtn.style.visibility = input.value ? 'visible' : 'hidden';
      }
      sync();
      input.addEventListener('input', sync);
      clearBtn.addEventListener('click', function () {
        input.value = '';
        sync();
        input.focus();
      });
    });
  }

  /* —— 新人专区开关（本页可直接开关） —— */
  function syncEnableBar() {
    var cfg = window.MdmNewcomerZoneConfig;
    var on = cfg ? cfg.isEnabled() : true;
    var switchBtn = document.getElementById('newcomerZoneEnableSwitch');
    var statusEl = document.getElementById('newcomerZoneEnableStatus');
    var descEl = document.getElementById('newcomerZoneEnableDesc');
    if (switchBtn) {
      switchBtn.classList.toggle('mkt-points-switch--on', on);
      switchBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      switchBtn.disabled = false;
      switchBtn.removeAttribute('aria-disabled');
      switchBtn.title = on ? '点击关闭新人专区' : '点击开启新人专区';
    }
    if (statusEl) statusEl.textContent = on ? '已开启' : '已关闭';
    if (descEl) {
      descEl.textContent = on
        ? '新人专区已开启，C 端可展示入口；商品清单在本页维护。'
        : '新人专区已关闭，C 端不展示入口；开启后用户端可见新人专区。';
    }
  }

  function bindEnableBar() {
    var switchBtn = document.getElementById('newcomerZoneEnableSwitch');
    if (!switchBtn) return;
    switchBtn.addEventListener('click', function () {
      var cfg = window.MdmNewcomerZoneConfig;
      if (!cfg) return;
      var next = !cfg.isEnabled();
      cfg.setEnabled(next);
      syncEnableBar();
      if (typeof showToast === 'function') {
        showToast(next ? '已开启新人专区' : '已关闭新人专区', 'success');
      }
    });
  }

  /* —— 轮播图配置 —— */
  var bannerDraft = [];

  function closeBannerModal() {
    var existing = document.querySelector('[data-newcomer-zone-banner-modal]');
    if (existing) existing.remove();
  }

  function renderBannerList(listEl) {
    if (!listEl) return;
    if (!bannerDraft.length) {
      listEl.innerHTML = '<div class="pts-rule-pick-empty" style="padding:20px;text-align:center;color:#999;font-size:13px;">暂无轮播，请点击下方添加</div>';
      return;
    }
    listEl.innerHTML = bannerDraft
      .map(function (item, index) {
        var preview = item.image
          ? '<img class="mkt-newcomer-zone-banner-preview" src="' + escapeHtml(item.image) + '" alt="">'
          : '<div class="mkt-newcomer-zone-banner-preview is-empty">暂无图片</div>';
        return (
          '<div class="mkt-newcomer-zone-banner-item" data-banner-index="' + index + '">' +
          '  <div class="mkt-newcomer-zone-banner-item__head">' +
          '    <span class="mkt-newcomer-zone-banner-item__title">轮播 ' + (index + 1) + '</span>' +
          '    <button type="button" class="mkt-newcomer-zone-banner-item__remove" data-banner-remove="' + index + '">删除</button>' +
          '  </div>' +
          '  <div class="mkt-newcomer-zone-banner-fields">' +
          '    <div class="mkt-newcomer-zone-banner-field">' +
          '      <label><span class="req">*</span>标题</label>' +
          '      <div class="mkt-newcomer-zone-banner-field__ctrl">' +
          '        <input class="erp-input" data-banner-field="title" data-banner-index="' + index + '" maxlength="40" placeholder="请输入标题" value="' + escapeHtml(item.title) + '">' +
          '      </div>' +
          '    </div>' +
          '    <div class="mkt-newcomer-zone-banner-field">' +
          '      <label><span class="req">*</span>图片</label>' +
          '      <div class="mkt-newcomer-zone-banner-field__ctrl">' +
          '        <div class="mkt-newcomer-zone-banner-upload">' +
          preview +
          '          <button type="button" class="erp-btn" data-banner-upload="' + index + '">上传图片</button>' +
          '          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" data-banner-file="' + index + '" hidden>' +
          '        </div>' +
          '      </div>' +
          '    </div>' +
          '    <div class="mkt-newcomer-zone-banner-field">' +
          '      <label>跳转链接</label>' +
          '      <div class="mkt-newcomer-zone-banner-field__ctrl">' +
          '        <input class="erp-input" data-banner-field="link" data-banner-index="' + index + '" placeholder="选填，如页面路径或外链" value="' + escapeHtml(item.link) + '">' +
          '      </div>' +
          '    </div>' +
          '  </div>' +
          '</div>'
        );
      })
      .join('');
  }

  function openBannerModal() {
    closeBannerModal();
    var cfg = window.MdmNewcomerZoneConfig;
    bannerDraft = cfg ? cfg.loadBanners().map(function (b) {
      return { id: b.id, title: b.title, image: b.image, link: b.link };
    }) : [];

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-newcomer-zone-banner-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--newcomer-zone-banner">' +
      '  <div class="erp-modal__header">' +
      '    <h3 class="erp-modal__title">轮播图配置</h3>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-banner-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <p class="mkt-newcomer-zone-banner-tip">最多可配置 10 个轮播；标题、图片必填，跳转链接选填。将展示在 C 端新人专区顶部。</p>' +
      '    <div class="mkt-newcomer-zone-banner-list" id="newcomerZoneBannerList"></div>' +
      '    <button type="button" class="erp-btn mkt-newcomer-zone-banner-add" id="newcomerZoneBannerAdd">添加轮播</button>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-banner-close>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" id="newcomerZoneBannerSave">保存</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(backdrop);

    var listEl = document.getElementById('newcomerZoneBannerList');
    renderBannerList(listEl);

    function refreshAddBtn() {
      var addBtn = document.getElementById('newcomerZoneBannerAdd');
      if (!addBtn || !cfg) return;
      addBtn.disabled = bannerDraft.length >= cfg.MAX_BANNERS;
      addBtn.textContent = bannerDraft.length >= cfg.MAX_BANNERS
        ? '已达上限（10）'
        : '添加轮播';
    }
    refreshAddBtn();

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || e.target.closest('[data-banner-close]')) {
        closeBannerModal();
        return;
      }

      var removeBtn = e.target.closest('[data-banner-remove]');
      if (removeBtn) {
        var ri = Number(removeBtn.getAttribute('data-banner-remove'));
        bannerDraft.splice(ri, 1);
        renderBannerList(listEl);
        refreshAddBtn();
        return;
      }

      var uploadBtn = e.target.closest('[data-banner-upload]');
      if (uploadBtn) {
        var ui = uploadBtn.getAttribute('data-banner-upload');
        var fileInput = backdrop.querySelector('[data-banner-file="' + ui + '"]');
        if (fileInput) fileInput.click();
      }
    });

    backdrop.addEventListener('change', function (e) {
      var fileInput = e.target.closest('[data-banner-file]');
      if (!fileInput) return;
      var index = Number(fileInput.getAttribute('data-banner-file'));
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file || !bannerDraft[index]) return;
      if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
        if (typeof showToast === 'function') showToast('请上传 JPG/PNG/GIF/WEBP 格式图片', 'warning');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        if (typeof showToast === 'function') showToast('图片大小不能超过 2MB', 'warning');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        bannerDraft[index].image = String(reader.result || '');
        renderBannerList(listEl);
        refreshAddBtn();
      };
      reader.readAsDataURL(file);
    });

    backdrop.addEventListener('input', function (e) {
      var field = e.target.closest('[data-banner-field]');
      if (!field) return;
      var index = Number(field.getAttribute('data-banner-index'));
      var key = field.getAttribute('data-banner-field');
      if (!bannerDraft[index] || !key) return;
      bannerDraft[index][key] = field.value;
    });

    document.getElementById('newcomerZoneBannerAdd').addEventListener('click', function () {
      if (!cfg || bannerDraft.length >= cfg.MAX_BANNERS) {
        if (typeof showToast === 'function') showToast('最多添加 10 个轮播', 'warning');
        return;
      }
      bannerDraft.push(cfg.createBanner());
      renderBannerList(listEl);
      refreshAddBtn();
    });

    document.getElementById('newcomerZoneBannerSave').addEventListener('click', function () {
      for (var i = 0; i < bannerDraft.length; i++) {
        var row = bannerDraft[i];
        if (!String(row.title || '').trim()) {
          if (typeof showToast === 'function') showToast('请填写轮播 ' + (i + 1) + ' 的标题', 'warning');
          return;
        }
        if (!String(row.image || '').trim()) {
          if (typeof showToast === 'function') showToast('请上传轮播 ' + (i + 1) + ' 的图片', 'warning');
          return;
        }
      }
      if (cfg) cfg.saveBanners(bannerDraft);
      closeBannerModal();
      if (typeof showToast === 'function') showToast('轮播图已保存', 'success');
    });
  }

  function bindEvents() {
    bindClearButtons();
    bindEnableBar();
    syncEnableBar();

    if (window.MdmMemberPointsRuleListFilter && window.MdmMemberPointsRuleListFilter.bindSaleScopeFilter) {
      saleFilterCtrl = window.MdmMemberPointsRuleListFilter.bindSaleScopeFilter({
        typeSelect: document.getElementById('qNcSaleScope'),
        regionGroup: document.getElementById('qNcSaleRegionGroup'),
        regionMount: document.getElementById('qNcSaleRegionMount'),
        regionCascaderId: 'ncSaleRegionFilter',
        storeGroup: document.getElementById('qNcSaleStoreGroup'),
        storeInput: document.getElementById('qNcStore'),
        storeDropdown: document.getElementById('qNcStoreDropdown')
      });
    }

    document.getElementById('newcomerZoneBannerBtn') &&
      document.getElementById('newcomerZoneBannerBtn').addEventListener('click', openBannerModal);

    document.getElementById('newcomerZoneFilterQuery') &&
      document.getElementById('newcomerZoneFilterQuery').addEventListener('click', function () {
        readFiltersFromForm();
        state.page = 1;
        renderTable();
      });

    document.getElementById('newcomerZoneFilterReset') &&
      document.getElementById('newcomerZoneFilterReset').addEventListener('click', function () {
        resetFiltersForm();
        bindClearButtons();
        renderTable();
      });

    document.getElementById('newcomerZoneAddBtn') &&
      document.getElementById('newcomerZoneAddBtn').addEventListener('click', function () {
        if (!window.MdmNewcomerZonePicker) {
          if (typeof showToast === 'function') showToast('选品组件未加载', 'warning');
          return;
        }
        window.MdmNewcomerZonePicker.open({
          addedCodes: window.MdmNewcomerZoneStore ? window.MdmNewcomerZoneStore.getAddedCodesMap() : {},
          onConfirm: handlePickedProducts
        });
      });

    document.getElementById('newcomerZonePageSize') &&
      document.getElementById('newcomerZonePageSize').addEventListener('change', function () {
        state.pageSize = Number(this.value) || 20;
        state.page = 1;
        renderTable();
      });

    document.getElementById('newcomerZonePaginationPages') &&
      document.getElementById('newcomerZonePaginationPages').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        state.page = Number(btn.getAttribute('data-page')) || 1;
        renderTable();
      });

    document.getElementById('newcomerZonePageGoto') &&
      document.getElementById('newcomerZonePageGoto').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize) || 1);
        var val = Number(this.value);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });

    document.addEventListener('click', function (e) {
      var sortBtn = e.target.closest('.mkt-newcomer-zone-th-sort[data-sort-key]');
      if (sortBtn && !e.target.closest('.mkt-newcomer-zone-th-help')) {
        e.preventDefault();
        toggleSort(sortBtn.getAttribute('data-sort-key'));
        return;
      }

      var expandBtn = e.target.closest('[data-expand-code]');
      if (expandBtn) {
        e.preventDefault();
        state.expanded[expandBtn.getAttribute('data-expand-code')] = true;
        renderTable();
        return;
      }

      var collapseBtn = e.target.closest('[data-collapse-code]');
      if (collapseBtn) {
        e.preventDefault();
        delete state.expanded[collapseBtn.getAttribute('data-collapse-code')];
        renderTable();
        return;
      }

      var actionBtn = e.target.closest('#newcomerZoneTableBody [data-action]');
      if (!actionBtn) return;
      e.preventDefault();
      var action = actionBtn.getAttribute('data-action');
      var code = actionBtn.getAttribute('data-code');
      var product = window.MdmNewcomerZoneStore ? window.MdmNewcomerZoneStore.getByCode(code) : null;
      if (!product) return;

      if (action === 'edit') {
        goEditForm(code);
        return;
      }

      if (action === 'on-shelf') {
        window.MdmNewcomerZoneStore.update(code, { status: 'on_shelf', scheduleOnAt: '', scheduleOffAt: '' });
        refresh(false);
        if (typeof showToast === 'function') showToast('已上架', 'success');
        return;
      }

      if (action === 'off-shelf') {
        window.MdmNewcomerZoneStore.update(code, { status: 'off_shelf', scheduleOnAt: '', scheduleOffAt: '' });
        refresh(false);
        if (typeof showToast === 'function') showToast('已下架', 'success');
        return;
      }

      if (action === 'delete') {
        openWarmConfirm('确定删除该新人专区商品吗？', function () {
          window.MdmNewcomerZoneStore.remove(code);
          refresh(false);
          if (typeof showToast === 'function') showToast('已删除', 'success');
        });
      }
    });
  }

  function init() {
    loadList();
    bindEvents();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
