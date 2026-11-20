/**
 * 商城商品 / 代采商品列表批量操作。
 * 勾选后可批量改：商品类目、履约方式、是否包邮、商品标签、售卖范围，以及上下架。
 * 左侧流程不在本文件；列表原有单行编辑、上下架保留。
 */
(function () {
  var ctx = null;
  var selected = {};
  var pageCodes = [];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(message, type) {
    if (typeof showToast === 'function') showToast(message, type || 'info');
  }

  function deliveryOptions() {
    if (ctx && ctx.channel === 'mall') {
      return [
        { value: 'express', label: '快递' },
        { value: 'pickup', label: '自提' }
      ];
    }
    return [
      { value: 'express', label: '快递' },
      { value: 'platform', label: '配送' }
    ];
  }

  function tagNames() {
    var store = ctx && ctx.channel === 'mall' ? window.MdmMallTagStore : window.MdmProxyTagStore;
    var names = [];
    if (store && typeof store.getAll === 'function') {
      store.getAll().forEach(function (tag) {
        if (!tag || !tag.name) return;
        if (tag.name === '不走订货单' || tag.name === 'sys_skip_demand_summary') return;
        names.push(tag.name);
      });
    }
    if (!names.length) {
      names = ['冷丰溯源', '冷丰优选', '牛牛专用', '蔬菜水果', '优选商品', '天天平价'];
    }
    return names;
  }

  function selectedCodes() {
    if (!ctx) return [];
    return Object.keys(selected).filter(function (code) {
      return !!ctx.getProduct(code);
    });
  }

  function requireSelection() {
    var codes = selectedCodes();
    if (!codes.length) {
      toast('请先勾选商品', 'warning');
      return null;
    }
    return codes;
  }

  function updateCount() {
    if (!ctx || !ctx.root) return;
    var el = ctx.root.querySelector('[data-batch-count]');
    if (!el) return;
    var n = selectedCodes().length;
    el.hidden = n === 0;
    el.textContent = '已选 ' + n;
  }

  function sync(codes) {
    pageCodes = (codes || []).slice();
    Object.keys(selected).forEach(function (code) {
      if (!ctx || !ctx.getProduct(code)) delete selected[code];
    });
    var box = ctx && ctx.checkAll;
    if (box) {
      var picked = 0;
      pageCodes.forEach(function (code) {
        if (selected[code]) picked += 1;
      });
      box.disabled = pageCodes.length === 0;
      box.checked = pageCodes.length > 0 && picked === pageCodes.length;
      box.indeterminate = picked > 0 && picked < pageCodes.length;
    }
    updateCount();
  }

  function clear() {
    selected = {};
    if (ctx && ctx.tableBody) {
      ctx.tableBody.querySelectorAll('[data-batch-code]').forEach(function (box) {
        box.checked = false;
      });
    }
    sync(pageCodes);
  }

  function cell(code) {
    var checked = selected[code] ? ' checked' : '';
    return (
      '<td class="product-proxy-table__td product-proxy-table__td--check order-live-table__check-col">' +
      '<input type="checkbox" class="product-batch-check" data-batch-code="' +
      escapeHtml(code) +
      '"' +
      checked +
      ' aria-label="勾选商品">' +
      '</td>'
    );
  }

  function closeModal() {
    var el = document.querySelector('[data-product-batch-modal]');
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, options) {
    options = options || {};
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-product-batch-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal product-batch-modal' +
      (options.wide ? ' product-batch-modal--scope' : '') +
      '">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' + escapeHtml(title) + '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-batch-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body product-proxy-form__body">' +
      bodyHtml +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-batch-close>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-batch-ok>确定</button>' +
      '  </div>' +
      '</div>';

    function dismiss() {
      closeModal();
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) dismiss();
    });
    backdrop.querySelectorAll('[data-batch-close]').forEach(function (btn) {
      btn.addEventListener('click', dismiss);
    });
    backdrop.querySelector('[data-batch-ok]').addEventListener('click', function () {
      if (typeof options.onOk === 'function' && options.onOk(backdrop) === false) return;
      dismiss();
    });
    document.body.appendChild(backdrop);
    if (typeof options.onReady === 'function') options.onReady(backdrop);
    return backdrop;
  }

  function tipHtml(codes) {
    return '<p class="product-batch-form__tip">将覆盖已选的 ' + codes.length + ' 件商品</p>';
  }

  function ensureDetail(product) {
    if (!product.detail || typeof product.detail !== 'object') product.detail = {};
    return product.detail;
  }

  function cloneMap(map) {
    var out = {};
    Object.keys(map || {}).forEach(function (key) {
      out[key] = map[key];
    });
    return out;
  }

  function finish(message) {
    if (ctx) {
      ctx.persist();
      if (typeof ctx.afterCategory === 'function') ctx.afterCategory();
      ctx.rerender();
    }
    toast(message, 'success');
  }

  function openCategory(codes) {
    var picker = null;
    openModal('批量设置商品类目', tipHtml(codes) + '<div id="productBatchCategory"></div>', {
      onReady: function (backdrop) {
        var el = backdrop.querySelector('#productBatchCategory');
        if (el && window.MdmProxyCategoryPicker) {
          picker = window.MdmProxyCategoryPicker.mount({ container: el, values: [] });
        }
      },
      onOk: function () {
        if (!picker) {
          toast('类目组件未加载', 'warning');
          return false;
        }
        var ids = picker.getValues();
        var paths = picker.getPaths();
        if (!ids.length) {
          toast('请选择商品类目', 'warning');
          return false;
        }
        codes.forEach(function (code) {
          var product = ctx.getProduct(code);
          if (!product) return;
          ctx.applyCategories(product, ids, paths);
          product.detailEdited = true;
        });
        finish('已更新 ' + codes.length + ' 件商品的类目');
      }
    });
  }

  function openDelivery(codes) {
    var radios = deliveryOptions()
      .map(function (opt) {
        return (
          '<label class="product-add-radio"><input type="radio" name="batchDeliveryMode" value="' +
          opt.value +
          '"> ' +
          escapeHtml(opt.label) +
          '</label>'
        );
      })
      .join('');
    openModal(
      '批量设置履约方式',
      tipHtml(codes) +
        '<div class="product-batch-form__field"><div class="product-add-radio-row">' +
        radios +
        '</div></div>',
      {
        onOk: function (backdrop) {
          var picked = backdrop.querySelector('input[name="batchDeliveryMode"]:checked');
          if (!picked) {
            toast('请选择履约方式', 'warning');
            return false;
          }
          codes.forEach(function (code) {
            var product = ctx.getProduct(code);
            if (!product) return;
            product.deliveryMode = picked.value;
            product.fulfillmentMode = picked.value;
            ensureDetail(product).deliveryMode = picked.value;
            product.detailEdited = true;
          });
          finish('已更新 ' + codes.length + ' 件商品的履约方式');
        }
      }
    );
  }

  function openFreeShip(codes) {
    openModal(
      '批量设置是否包邮',
      tipHtml(codes) +
        '<div class="product-batch-form__field"><div class="product-add-radio-row">' +
        '<label class="product-add-radio"><input type="radio" name="batchFreeShip" value="yes"> 是</label>' +
        '<label class="product-add-radio"><input type="radio" name="batchFreeShip" value="no"> 否</label>' +
        '</div></div>',
      {
        onOk: function (backdrop) {
          var picked = backdrop.querySelector('input[name="batchFreeShip"]:checked');
          if (!picked) {
            toast('请选择是否包邮', 'warning');
            return false;
          }
          var yes = picked.value === 'yes';
          codes.forEach(function (code) {
            var product = ctx.getProduct(code);
            if (!product) return;
            product.freeShip = yes;
            ensureDetail(product).freeShip = yes;
            product.detailEdited = true;
          });
          finish('已将 ' + codes.length + ' 件商品设为' + (yes ? '包邮' : '不包邮'));
        }
      }
    );
  }

  function openTag(codes) {
    var options =
      '<option value="">请选择商品标签</option>' +
      '<option value="__clear__">清空标签</option>' +
      tagNames()
        .map(function (name) {
          return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
        })
        .join('');
    openModal(
      '批量设置商品标签',
      tipHtml(codes) +
        '<div class="product-batch-form__field">' +
        '<select class="product-proxy-form__input product-batch-form__select" id="productBatchTag">' +
        options +
        '</select></div>',
      {
        onOk: function (backdrop) {
          var value = (backdrop.querySelector('#productBatchTag') || {}).value;
          if (!value) {
            toast('请选择商品标签', 'warning');
            return false;
          }
          var tag = value === '__clear__' ? '' : value;
          codes.forEach(function (code) {
            var product = ctx.getProduct(code);
            if (!product) return;
            product.tag = tag;
            product.detailEdited = true;
          });
          var store = ctx.channel === 'mall' ? window.MdmMallTagStore : window.MdmProxyTagStore;
          if (store && typeof store.syncBindCounts === 'function') store.syncBindCounts();
          finish(tag ? '已更新 ' + codes.length + ' 件商品的标签' : '已清空 ' + codes.length + ' 件商品的标签');
        }
      }
    );
  }

  function openSaleScope(codes) {
    var state = { scope: 'all', regions: {}, summary: [], stores: {} };
    var html =
      tipHtml(codes) +
      '<div class="product-proxy-form__field product-proxy-form__field--inline product-proxy-sale-scope__type">' +
      '  <span class="product-proxy-form__label product-proxy-form__label--inline">范围类型</span>' +
      '  <div class="product-add-radio-row">' +
      '    <label class="product-add-radio"><input type="radio" name="batchSaleScope" value="all" checked> 全部</label>' +
      '    <label class="product-add-radio"><input type="radio" name="batchSaleScope" value="region"> 省市区</label>' +
      '    <label class="product-add-radio"><input type="radio" name="batchSaleScope" value="store"> 门店</label>' +
      '  </div>' +
      '</div>' +
      '<div class="product-proxy-sale-scope__region" id="batchSaleRegion" hidden>' +
      '  <button type="button" class="product-proxy-sale-scope__pick" id="batchSaleRegionBtn">+ 选择区域</button>' +
      '  <div class="product-proxy-sale-scope__tags" id="batchSaleRegionTags"></div>' +
      '</div>' +
      '<div class="product-proxy-sale-scope__store" id="batchSaleStore" hidden>' +
      '  <button type="button" class="product-proxy-sale-scope__pick" id="batchSaleStoreBtn">+ 选择门店</button>' +
      '  <p class="product-proxy-sale-scope__store-count" id="batchSaleStoreCount" hidden></p>' +
      '</div>';

    openModal('批量设置售卖范围', html, {
      wide: true,
      onReady: function (backdrop) {
        var regionPanel = backdrop.querySelector('#batchSaleRegion');
        var storePanel = backdrop.querySelector('#batchSaleStore');
        var tagsEl = backdrop.querySelector('#batchSaleRegionTags');
        var countEl = backdrop.querySelector('#batchSaleStoreCount');

        function paint() {
          var scopeEl = backdrop.querySelector('input[name="batchSaleScope"]:checked');
          state.scope = scopeEl ? scopeEl.value : 'all';
          if (regionPanel) regionPanel.hidden = state.scope !== 'region';
          if (storePanel) storePanel.hidden = state.scope !== 'store';
          if (tagsEl) {
            tagsEl.innerHTML = (state.summary || [])
              .map(function (item) {
                var label = item && item.label ? item.label : item;
                return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(label) + '</span>';
              })
              .join('');
          }
          if (countEl) {
            var count = window.MdmProxyStorePicker
              ? window.MdmProxyStorePicker.count(state.stores)
              : Object.keys(state.stores || {}).length;
            countEl.textContent = '已选择 ' + count + ' 个门店';
            countEl.hidden = !count;
          }
        }

        backdrop.querySelectorAll('input[name="batchSaleScope"]').forEach(function (radio) {
          radio.addEventListener('change', paint);
        });
        backdrop.querySelector('#batchSaleRegionBtn').addEventListener('click', function () {
          if (!window.MdmProxyRegionPicker) {
            toast('区域选择组件未加载', 'warning');
            return;
          }
          window.MdmProxyRegionPicker.open({
            selected: state.regions,
            onConfirm: function (next, summary) {
              state.regions = next || {};
              state.summary = summary || [];
              paint();
            }
          });
        });
        backdrop.querySelector('#batchSaleStoreBtn').addEventListener('click', function () {
          if (!window.MdmProxyStorePicker) {
            toast('门店选择组件未加载', 'warning');
            return;
          }
          window.MdmProxyStorePicker.open({
            selected: state.stores,
            onConfirm: function (next) {
              state.stores = next || {};
              paint();
            }
          });
        });
        paint();
      },
      onOk: function () {
        if (state.scope === 'region' && !Object.keys(state.regions).length) {
          toast('请选择售卖区域', 'warning');
          return false;
        }
        if (state.scope === 'store') {
          var storeCount = window.MdmProxyStorePicker
            ? window.MdmProxyStorePicker.count(state.stores)
            : Object.keys(state.stores).length;
          if (!storeCount) {
            toast('请选择售卖门店', 'warning');
            return false;
          }
        }
        var regions = state.scope === 'region' ? cloneMap(state.regions) : {};
        var summary = state.scope === 'region' ? (state.summary || []).slice() : [];
        var stores = state.scope === 'store' ? cloneMap(state.stores) : {};
        codes.forEach(function (code) {
          var product = ctx.getProduct(code);
          if (!product) return;
          product.saleScope = state.scope;
          product.saleRegions = cloneMap(regions);
          product.saleRegionSummary = summary.slice();
          product.saleStores = cloneMap(stores);
          var detail = ensureDetail(product);
          detail.saleScope = state.scope;
          detail.saleRegions = cloneMap(regions);
          detail.saleRegionSummary = summary.slice();
          detail.saleStores = cloneMap(stores);
          product.detailEdited = true;
        });
        var scopeLabel = state.scope === 'region' ? '省市区' : state.scope === 'store' ? '门店' : '全部';
        finish('已将 ' + codes.length + ' 件商品的售卖范围设为' + scopeLabel);
      }
    });
  }

  function openShelf(codes, onShelf) {
    var verb = onShelf ? '上架' : '下架';
    openModal(
      '批量' + verb,
      '<div class="erp-modal-confirm__row">' +
        '<div class="erp-modal-confirm__icon">!</div>' +
        '<div class="erp-modal-confirm__msg">确定' +
        verb +
        '已选的 ' +
        codes.length +
        ' 件商品吗？</div></div>',
      {
        onOk: function () {
          var ok = 0;
          var skipped = 0;
          var already = 0;
          codes.forEach(function (code) {
            var product = ctx.getProduct(code);
            if (!product) return;
            if (onShelf) {
              if (product.status === 'on_shelf') {
                already += 1;
                return;
              }
              if (!ctx.isReadyForShelf(product)) {
                skipped += 1;
                return;
              }
              product.status = 'on_shelf';
              ok += 1;
              return;
            }
            if (product.status !== 'on_shelf') {
              skipped += 1;
              return;
            }
            product.status = 'off_shelf';
            ok += 1;
          });
          if (ok) {
            ctx.persist();
            ctx.rerender();
          }
          if (!ok && !already) {
            toast(onShelf ? '所选商品缺少类目或尚未完善，不能上架' : '所选商品都不是已上架，无需下架', 'warning');
            return;
          }
          var parts = [];
          if (ok) parts.push('已' + verb + ' ' + ok + ' 件');
          if (already) parts.push(already + ' 件已是上架状态');
          if (skipped) parts.push(skipped + ' 件未处理');
          toast(parts.join('，'), ok ? 'success' : 'warning');
        }
      }
    );
  }

  function runAction(action) {
    var codes = requireSelection();
    if (!codes) return;
    if (action === 'category') openCategory(codes);
    else if (action === 'delivery') openDelivery(codes);
    else if (action === 'free-ship') openFreeShip(codes);
    else if (action === 'tag') openTag(codes);
    else if (action === 'scope') openSaleScope(codes);
    else if (action === 'on-shelf') openShelf(codes, true);
    else if (action === 'off-shelf') openShelf(codes, false);
  }

  function renderToolbar(root) {
    root.innerHTML =
      '<button type="button" class="product-batch__btn" data-batch-toggle>批量操作</button>' +
      '<span class="product-batch__count" data-batch-count hidden>已选 0</span>' +
      '<div class="product-batch__menu" data-batch-menu hidden>' +
      '  <button type="button" class="product-batch__item" data-batch-action="category">商品类目</button>' +
      '  <button type="button" class="product-batch__item" data-batch-action="delivery">履约方式</button>' +
      '  <button type="button" class="product-batch__item" data-batch-action="free-ship">是否包邮</button>' +
      '  <button type="button" class="product-batch__item" data-batch-action="tag">商品标签</button>' +
      '  <button type="button" class="product-batch__item" data-batch-action="scope">售卖范围</button>' +
      '  <div class="product-batch__sep"></div>' +
      '  <button type="button" class="product-batch__item" data-batch-action="on-shelf">批量上架</button>' +
      '  <button type="button" class="product-batch__item" data-batch-action="off-shelf">批量下架</button>' +
      '</div>';
  }

  function mount(options) {
    ctx = options || {};
    selected = {};
    pageCodes = [];
    if (!ctx.root || !ctx.checkAll || !ctx.tableBody) return;
    renderToolbar(ctx.root);

    var menu = ctx.root.querySelector('[data-batch-menu]');
    var toggle = ctx.root.querySelector('[data-batch-toggle]');
    function placeMenu() {
      var rect = toggle.getBoundingClientRect();
      var menuHeight = menu.offsetHeight || 260;
      var spaceBelow = window.innerHeight - rect.bottom;
      var top = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;
      menu.style.left = Math.max(8, rect.left) + 'px';
      menu.style.top = Math.max(8, top) + 'px';
    }
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      menu.hidden = !menu.hidden;
      if (!menu.hidden) placeMenu();
    });
    document.addEventListener('scroll', function () {
      if (menu) menu.hidden = true;
    }, true);
    ctx.root.querySelectorAll('[data-batch-action]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        menu.hidden = true;
        runAction(btn.getAttribute('data-batch-action'));
      });
    });
    document.addEventListener('click', function () {
      if (menu) menu.hidden = true;
    });

    ctx.checkAll.addEventListener('change', function () {
      var on = ctx.checkAll.checked;
      pageCodes.forEach(function (code) {
        if (on) selected[code] = true;
        else delete selected[code];
      });
      ctx.tableBody.querySelectorAll('[data-batch-code]').forEach(function (box) {
        box.checked = on;
      });
      sync(pageCodes);
    });

    var table = ctx.tableBody.closest('table');
    if (table && !table.getAttribute('data-batch-bound')) {
      table.setAttribute('data-batch-bound', '1');
      table.addEventListener('change', function (ev) {
        var box = ev.target.closest('[data-batch-code]');
        if (!box) return;
        var code = box.getAttribute('data-batch-code');
        if (box.checked) selected[code] = true;
        else delete selected[code];
        ctx.tableBody.querySelectorAll('[data-batch-code]').forEach(function (el) {
          el.checked = !!selected[el.getAttribute('data-batch-code')];
        });
        sync(pageCodes);
      });
    }
    updateCount();
  }

  window.MdmProductListBatch = {
    mount: mount,
    cell: cell,
    sync: sync,
    clear: clear
  };
})();
