/**
 * 会员 · 积分规则 — 适用商品范围（全部 / 适用·排除商品·类目）共用选择器
 * 商品 / 类目数据源：选品库 MdmProductCatalog
 */
(function (global) {
  'use strict';

  var Data = global.MdmMemberLevelData || {};

  var SCOPE_TYPES = [
    'all',
    'include_product',
    'include_category',
    'exclude_product',
    'exclude_category'
  ];

  function escapeHtml(str) {
    if (Data.escapeHtml) return Data.escapeHtml(str);
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCatalogProducts() {
    if (global.MdmProductCatalog && typeof global.MdmProductCatalog.getScopeProducts === 'function') {
      return global.MdmProductCatalog.getScopeProducts();
    }
    return Data.DEMO_PRODUCTS || [];
  }

  function getCatalogCategories() {
    if (global.MdmProductCatalog && typeof global.MdmProductCatalog.getCategories === 'function') {
      return global.MdmProductCatalog.getCategories();
    }
    return Data.DEMO_CATEGORIES || [];
  }

  function normalizeScope(scope) {
    if (Data.normalizeDiscountScope) return Data.normalizeDiscountScope(scope);
    scope = scope || {};
    var type = scope.type || 'all';
    if (SCOPE_TYPES.indexOf(type) === -1) type = 'all';
    return {
      type: type,
      products: Array.isArray(scope.products) ? scope.products.slice() : [],
      categories: Array.isArray(scope.categories) ? scope.categories.slice() : []
    };
  }

  function isProductScope(type) {
    return type === 'include_product' || type === 'exclude_product';
  }

  function isCategoryScope(type) {
    return type === 'include_category' || type === 'exclude_category';
  }

  function formatProductPrice(product) {
    var skus = product.skus || [];
    if (!skus.length) return '—';
    var prices = skus.map(function (s) { return Number(s.price); }).filter(function (n) {
      return !isNaN(n);
    });
    if (!prices.length) return '—';
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    function fmt(n) {
      return '¥' + (Math.round(n * 100) / 100).toFixed(2);
    }
    if (min === max) return fmt(min);
    return fmt(min) + ' ~ ' + fmt(max);
  }

  function formatProductSkuCodes(product) {
    var skus = product.skus || [];
    if (!skus.length) return '—';
    return skus.map(function (s) { return s.code; }).join(' / ');
  }

  function scopeSummary(scope) {
    scope = normalizeScope(scope);
    if (scope.type === 'all') return '全部商品';
    if (scope.type === 'include_product') {
      return scope.products.length ? ('适用商品 ' + scope.products.length + ' 件') : '适用商品（未选）';
    }
    if (scope.type === 'exclude_product') {
      return scope.products.length ? ('排除商品 ' + scope.products.length + ' 件') : '排除商品（未选）';
    }
    if (scope.type === 'include_category') {
      return scope.categories.length ? ('适用类目 ' + scope.categories.length + ' 个') : '适用类目（未选）';
    }
    if (scope.type === 'exclude_category') {
      return scope.categories.length ? ('排除类目 ' + scope.categories.length + ' 个') : '排除类目（未选）';
    }
    return '全部商品';
  }

  /**
   * @param {object} options
   * @param {HTMLElement} options.chipsEl
   * @param {HTMLElement} [options.emptyEl]
   * @param {HTMLElement} [options.pickWrap]
   * @param {HTMLElement} [options.pickBtn]
   * @param {HTMLElement} [options.hintEl]
   * @param {string} options.radioName
   * @param {object} [options.initial]
   */
  function createScopeController(options) {
    var state = normalizeScope(options.initial || { type: 'all' });
    var chipsEl = options.chipsEl;
    var emptyEl = options.emptyEl;
    var pickWrap = options.pickWrap;
    var pickBtn = options.pickBtn;
    var hintEl = options.hintEl;
    var radioName = options.radioName;

    function getSelectedItems() {
      if (isProductScope(state.type)) return state.products || [];
      if (isCategoryScope(state.type)) return state.categories || [];
      return [];
    }

    function renderChips() {
      if (!chipsEl) return;
      var items = getSelectedItems();
      if (!items.length) {
        chipsEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = state.type === 'all';
        return;
      }
      if (emptyEl) emptyEl.hidden = true;
      chipsEl.innerHTML = items.map(function (it) {
        return (
          '<span class="pts-rule-scope-chip" data-id="' + escapeHtml(it.id) + '">' +
          '<span>' + escapeHtml(it.name) + '</span>' +
          '<button type="button" class="pts-rule-scope-chip__remove" data-scope-remove aria-label="移除">&times;</button>' +
          '</span>'
        );
      }).join('');
    }

    function syncUi() {
      var typeEl = document.querySelector('input[name="' + radioName + '"]:checked');
      var type = typeEl ? typeEl.value : 'all';
      state.type = type;
      if (type === 'all') {
        state.products = [];
        state.categories = [];
      } else if (isProductScope(type)) {
        state.categories = [];
      } else if (isCategoryScope(type)) {
        state.products = [];
      }

      var needPick = type !== 'all';
      if (pickWrap) pickWrap.hidden = !needPick;
      if (chipsEl) chipsEl.hidden = !needPick;
      if (emptyEl && !needPick) emptyEl.hidden = true;
      if (pickBtn) {
        if (isProductScope(type)) pickBtn.textContent = '选择商品';
        else if (isCategoryScope(type)) pickBtn.textContent = '选择类目';
      }
      if (hintEl) {
        hintEl.textContent = isProductScope(type)
          ? '可多选商品（数据来自选品库）'
          : (isCategoryScope(type) ? '可多选类目（选品库关联类目）' : '');
      }
      if (needPick) renderChips();
      else if (chipsEl) chipsEl.innerHTML = '';
    }

    function openCategoryPicker(selectedMap) {
      var catalog = getCatalogCategories();
      var backdrop = document.createElement('div');
      backdrop.className = 'pts-rule-pick-backdrop';
      backdrop.innerHTML =
        '<div class="pts-rule-pick-modal" role="dialog" aria-modal="true">' +
        '  <div class="pts-rule-pick-modal__header">' +
        '    <h3 class="pts-rule-pick-modal__title">选择类目</h3>' +
        '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
        '  </div>' +
        '  <div class="pts-rule-pick-modal__body">' +
        '    <input class="erp-input pts-rule-pick-filter" type="text" placeholder="输入类目名称筛选" data-pick-filter>' +
        '    <div class="pts-rule-pick-list" data-pick-list></div>' +
        '  </div>' +
        '  <div class="pts-rule-pick-modal__footer">' +
        '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
        '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
        '  </div>' +
        '</div>';

      var listEl = backdrop.querySelector('[data-pick-list]');
      var filterEl = backdrop.querySelector('[data-pick-filter]');

      function renderList(keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var filtered = catalog.filter(function (it) {
          if (!kw) return true;
          return String(it.name).toLowerCase().indexOf(kw) !== -1;
        });
        if (!filtered.length) {
          listEl.innerHTML = '<div class="pts-rule-pick-empty">无匹配项</div>';
          return;
        }
        listEl.innerHTML = filtered.map(function (it) {
          return (
            '<label class="pts-rule-pick-item">' +
            '<input type="checkbox" value="' + escapeHtml(it.id) + '"' +
            (selectedMap[it.id] ? ' checked' : '') + '>' +
            '<span>' + escapeHtml(it.name) + '</span>' +
            '</label>'
          );
        }).join('');
      }

      renderList('');
      filterEl.addEventListener('input', function () {
        renderList(filterEl.value);
      });
      listEl.addEventListener('change', function (ev) {
        var input = ev.target;
        if (!input || input.type !== 'checkbox') return;
        if (input.checked) selectedMap[input.value] = true;
        else delete selectedMap[input.value];
      });

      function close() {
        backdrop.remove();
      }
      backdrop.addEventListener('click', function (ev) {
        if (ev.target === backdrop) close();
      });
      backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
        btn.addEventListener('click', close);
      });
      backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
        state.categories = catalog.filter(function (it) {
          return !!selectedMap[it.id];
        }).map(function (it) {
          return { id: it.id, name: it.name };
        });
        state.products = [];
        renderChips();
        close();
      });

      document.body.appendChild(backdrop);
      filterEl.focus();
    }

    function openProductPicker(selectedMap) {
      if (global.MdmMemberProductPicker && typeof global.MdmMemberProductPicker.open === 'function') {
        global.MdmMemberProductPicker.open({
          selected: selectedMap,
          onConfirm: function (picked) {
            state.products = (picked || []).slice();
            state.categories = [];
            renderChips();
          }
        });
        return;
      }
      /* 兜底：组件未加载时仍可用简表 */
      var catalog = getCatalogProducts();
      var backdrop = document.createElement('div');
      backdrop.className = 'pts-rule-pick-backdrop';
      backdrop.innerHTML =
        '<div class="pts-rule-pick-modal pts-rule-pick-modal--product" role="dialog" aria-modal="true">' +
        '  <div class="pts-rule-pick-modal__header">' +
        '    <h3 class="pts-rule-pick-modal__title">选择商品</h3>' +
        '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
        '  </div>' +
        '  <div class="pts-rule-pick-modal__body">' +
        '    <div class="pts-rule-pick-empty">商品选择组件未加载</div>' +
        '  </div>' +
        '  <div class="pts-rule-pick-modal__footer">' +
        '    <button type="button" class="erp-btn" data-pick-close>关闭</button>' +
        '  </div>' +
        '</div>';
      function close() { backdrop.remove(); }
      backdrop.addEventListener('click', function (ev) {
        if (ev.target === backdrop) close();
      });
      backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
        btn.addEventListener('click', close);
      });
      document.body.appendChild(backdrop);
      void catalog;
    }

    function openPicker() {
      if (state.type === 'all') return;
      var selectedMap = {};
      getSelectedItems().forEach(function (it) {
        selectedMap[it.id] = true;
      });
      if (isProductScope(state.type)) openProductPicker(selectedMap);
      else openCategoryPicker(selectedMap);
    }

    function setScope(scope) {
      state = normalizeScope(scope);
      document.querySelectorAll('input[name="' + radioName + '"]').forEach(function (el) {
        el.checked = el.value === state.type;
      });
      syncUi();
    }

    function getScope() {
      return normalizeScope(state);
    }

    function validate() {
      if (state.type === 'all') return '';
      var items = getSelectedItems();
      if (!items.length) {
        return isProductScope(state.type) ? '请选择适用/排除商品' : '请选择适用/排除类目';
      }
      return '';
    }

    document.querySelectorAll('input[name="' + radioName + '"]').forEach(function (el) {
      el.addEventListener('change', syncUi);
    });
    if (pickBtn) pickBtn.addEventListener('click', openPicker);
    if (chipsEl) {
      chipsEl.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-scope-remove]');
        if (!btn) return;
        var chip = btn.closest('[data-id]');
        if (!chip) return;
        var id = chip.getAttribute('data-id');
        if (isProductScope(state.type)) {
          state.products = (state.products || []).filter(function (it) {
            return it.id !== id;
          });
        } else {
          state.categories = (state.categories || []).filter(function (it) {
            return it.id !== id;
          });
        }
        renderChips();
      });
    }

    syncUi();

    return {
      setScope: setScope,
      getScope: getScope,
      syncUi: syncUi,
      validate: validate,
      isProductScope: isProductScope
    };
  }

  var PORT_LABEL = { mini: '小程序', app: 'APP' };

  function portsSummary(portScope, ports) {
    if (portScope !== 'custom') return '不限';
    var list = Array.isArray(ports) ? ports : [];
    if (!list.length) return '指定端口（未选）';
    return list.map(function (p) {
      return PORT_LABEL[p] || p;
    }).join('、');
  }

  function storesSummary(storeScope, stores) {
    if (storeScope !== 'store') return '全部门店';
    var n = 0;
    if (stores && typeof stores === 'object') {
      if (global.MdmProxyStorePicker && typeof global.MdmProxyStorePicker.count === 'function') {
        n = global.MdmProxyStorePicker.count(stores);
      } else {
        n = Object.keys(stores).length;
      }
    }
    return n ? ('指定门店 ' + n + ' 家') : '指定门店（未选）';
  }

  /** 售卖范围摘要（对齐积分商城：全部 / 省市区 / 门店） */
  function saleScopeSummary(item) {
    item = item || {};
    var scope = item.saleScope || (item.storeScope === 'store' ? 'store' : 'all');
    if (scope === 'region') {
      var summary = item.saleRegionSummary || [];
      if (summary.length) {
        return '省市区：' + summary.map(function (it) {
          return it.label || it.id || '';
        }).filter(Boolean).slice(0, 3).join('、') + (summary.length > 3 ? ' 等' : '');
      }
      return '省市区（未选）';
    }
    if (scope === 'store') {
      return storesSummary('store', item.saleStores || item.stores || {});
    }
    return '全部';
  }

  global.MdmMemberPointsScope = {
    normalizeScope: normalizeScope,
    scopeSummary: scopeSummary,
    createScopeController: createScopeController,
    isProductScope: isProductScope,
    isCategoryScope: isCategoryScope,
    portsSummary: portsSummary,
    storesSummary: storesSummary,
    saleScopeSummary: saleScopeSummary,
    PORT_LABEL: PORT_LABEL,
    escapeHtml: escapeHtml,
    getCatalogProducts: getCatalogProducts,
    getCatalogCategories: getCatalogCategories
  };
})(window);
