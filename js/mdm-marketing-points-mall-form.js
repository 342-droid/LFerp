/**
 * 营销 — 编辑积分商品（独立页面）
 * 含：基础信息（对齐秒杀商品）、限购三选一（仅 SPU）、兑换方式、会员等级、商品状态、售卖范围、规格卡片
 */
(function () {
  var IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  var SALE_UNITS = ['件', '箱', '瓶', '袋', 'kg', 'L', '罐', '包', '套', '卷', '个', '斤', '盒'];
  var product = null;
  var specs = [];
  var selectedSkuIds = [];
  var specSnapshot = null;
  var formExtra = {
    images: [],
    saleRegions: {},
    saleRegionSummary: [],
    saleStores: {}
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') {
      showToast(msg, type || 'success');
      return;
    }
    window.alert(msg);
  }

  function queryCode() {
    var params = new URLSearchParams(window.location.search || '');
    var code = String(params.get('code') || '').trim();
    if (code) return code;
    try {
      code = String(sessionStorage.getItem('mdm_points_mall_edit_code') || '').trim();
    } catch (e) {
      code = '';
    }
    return code;
  }

  function showLoadError(msg) {
    var panel = document.getElementById('mallFormPanel');
    if (panel) {
      panel.innerHTML =
        '<div class="flow-box" style="margin:0;">' +
        escapeHtml(msg || '未找到积分商品') +
        ' <a href="mdm_marketing_points_mall.html">返回积分商城</a>' +
        '</div>';
    }
    toast(msg || '未找到积分商品', 'warning');
  }

  function getMemberLevels() {
    if (window.MdmMemberLevelData && typeof window.MdmMemberLevelData.loadLevelList === 'function') {
      try {
        return window.MdmMemberLevelData.loadLevelList().filter(function (lv) {
          return lv && lv.status !== '停用';
        });
      } catch (e) {
        /* fallthrough */
      }
    }
    return [
      { id: 'ML10004', name: '普通会员' },
      { id: 'ML10003', name: '银牌会员' },
      { id: 'ML10002', name: '金牌会员' },
      { id: 'ML10001', name: '钻石会员' }
    ];
  }

  function toDatetimeLocal(val) {
    if (!val) return '';
    var s = String(val).replace(' ', 'T');
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return '';
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

  function getSaleStoreCount() {
    if (window.MdmProxyStorePicker && typeof window.MdmProxyStorePicker.count === 'function') {
      return window.MdmProxyStorePicker.count(formExtra.saleStores || {});
    }
    return Object.keys(formExtra.saleStores || {}).length;
  }

  function renderSaleRegionSummary() {
    var list = formExtra.saleRegionSummary || [];
    return list.map(function (item) {
      return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label || item.id || '') + '</span>';
    }).join('');
  }

  function syncSaleScopeUi() {
    var scope = getCheckedRadio('mallFormSaleScope') || 'all';
    var regionPanel = document.getElementById('mallSaleScopeRegion');
    var storePanel = document.getElementById('mallSaleScopeStore');
    if (regionPanel) regionPanel.hidden = scope !== 'region';
    if (storePanel) storePanel.hidden = scope !== 'store';

    var tagsEl = document.getElementById('mallSaleScopeTags');
    if (tagsEl) tagsEl.innerHTML = renderSaleRegionSummary();

    var count = getSaleStoreCount();
    var countEl = document.getElementById('mallSaleScopeStoreCount');
    if (countEl) {
      countEl.hidden = !count;
      countEl.textContent = '已选择 ' + count + ' 个门店';
    }
  }

  function syncPortScopeUi() {
    var scope = getCheckedRadio('mallFormPortScope') || 'all';
    var list = document.getElementById('mallFormPortList');
    if (list) list.hidden = scope !== 'custom';
  }

  function setSalePorts(ports) {
    var selected = Array.isArray(ports) ? ports : [];
    document.querySelectorAll('#mallFormPortList [data-field="salePort"]').forEach(function (el) {
      el.checked = selected.indexOf(el.value) >= 0;
    });
  }

  function getSalePorts() {
    var ports = [];
    document.querySelectorAll('#mallFormPortList [data-field="salePort"]:checked').forEach(function (el) {
      ports.push(el.value);
    });
    return ports;
  }

  function renderLevelBlock(selectedIds) {
    var levels = getMemberLevels();
    var selected = Array.isArray(selectedIds) ? selectedIds : [];
    var isAll = !selected.length;
    var checks = levels.map(function (lv) {
      var checked = !isAll && selected.indexOf(lv.id) >= 0;
      return (
        '<label class="mkt-points-mall-check mkt-points-mall-check--level">' +
        '  <input type="checkbox" data-field="memberLevel" value="' + escapeHtml(lv.id) + '"' + (checked ? ' checked' : '') + '>' +
        '  <span>' + escapeHtml(lv.name || lv.id) + '</span>' +
        '</label>'
      );
    }).join('');

    var root = document.getElementById('mallFormLevelBlock');
    if (!root) return;
    root.innerHTML =
      '<div class="pts-rule-check-row mkt-points-mall-level-scope">' +
      '  <label class="pts-rule-check-label">' +
      '    <input type="radio" name="mallFormLevelScope" value="all"' + (isAll ? ' checked' : '') + '> 全部' +
      '  </label>' +
      '  <label class="pts-rule-check-label">' +
      '    <input type="radio" name="mallFormLevelScope" value="custom"' + (isAll ? '' : ' checked') + '> 指定等级' +
      '  </label>' +
      '</div>' +
      '<div class="mkt-points-mall-level-list" id="mallFormMemberLevels"' + (isAll ? ' hidden' : '') + '>' +
      checks +
      '</div>';
  }

  function syncLevelScopeUi() {
    var scope = getCheckedRadio('mallFormLevelScope') || 'all';
    var list = document.getElementById('mallFormMemberLevels');
    if (list) list.hidden = scope !== 'custom';
  }

  function syncStatusUi() {
    var status = getCheckedRadio('mallFormStatus') || 'off_shelf';
    var isSchedule = status === 'schedule';
    var box = document.getElementById('mallFormSchedule');
    var hint = document.getElementById('mallFormScheduleHint');
    if (box) box.hidden = !isSchedule;
    if (hint) hint.hidden = !isSchedule;
  }

  function syncLimitUi() {
    var type = getCheckedRadio('mallFormLimitType') || 'none';
    var wrap = document.getElementById('mallFormLimitValueWrap');
    if (wrap) wrap.hidden = type === 'none';
  }

  function getExchangeType() {
    return getCheckedRadio('mallFormExchangeType') === 'points_money' ? 'points_money' : 'points';
  }

  function cloneSpecs(list) {
    return (list || []).map(function (s) {
      return Object.assign({}, s);
    });
  }

  function findSpec(skuCode) {
    var key = String(skuCode || '');
    for (var i = 0; i < specs.length; i++) {
      if (String(specs[i].skuCode || '') === key) return specs[i];
    }
    return null;
  }

  function takeSpecSnapshot() {
    specSnapshot = {
      specs: cloneSpecs(specs),
      selected: selectedSkuIds.slice()
    };
  }

  function optionHtml(options, current) {
    return options.map(function (opt) {
      var value = typeof opt === 'string' ? opt : opt.value;
      var label = typeof opt === 'string' ? opt : opt.label;
      return (
        '<option value="' +
        escapeHtml(value) +
        '"' +
        (String(current || '') === String(value) ? ' selected' : '') +
        '>' +
        escapeHtml(label) +
        '</option>'
      );
    }).join('');
  }

  function fieldHtml(label, field, value, readonly, extraClass) {
    return (
      '<div class="product-proxy-spec__field' + (extraClass ? ' ' + extraClass : '') + '">' +
      '<label class="product-proxy-spec__label">' + escapeHtml(label) + '</label>' +
      '<input type="text" class="product-proxy-spec__input" data-field="' + field + '" value="' +
      escapeHtml(value == null ? '' : value) + '"' + (readonly ? ' readonly' : '') + '>' +
      '</div>'
    );
  }

  function moneyHtml(label, field, value, readonly) {
    return (
      '<div class="product-proxy-spec__field">' +
      '<label class="product-proxy-spec__label">' + escapeHtml(label) + '</label>' +
      '<div class="product-proxy-spec__money">' +
      '<span class="product-proxy-spec__money-prefix">¥</span>' +
      '<input type="text" class="product-proxy-spec__input product-proxy-spec__input--money" data-field="' +
      field + '" value="' + escapeHtml(value == null || value === '' ? '' : value) + '"' +
      (readonly ? ' readonly' : '') + '>' +
      '</div></div>'
    );
  }

  function selectHtml(label, field, options, current) {
    return (
      '<div class="product-proxy-spec__field">' +
      '<label class="product-proxy-spec__label">' + escapeHtml(label) + '</label>' +
      '<select class="product-proxy-spec__input" data-field="' + field + '">' +
      optionHtml(options, current) +
      '</select></div>'
    );
  }

  function syncSkuTrigger() {
    var el = document.getElementById('mallFormSkuTrigger');
    if (el) {
      el.innerHTML = '已选 ' + selectedSkuIds.length + ' 个 SKU <span class="product-proxy-form__sku-caret">▼</span>';
    }
  }

  function renderSkuDropdown() {
    var box = document.getElementById('mallFormSkuDropdown');
    if (!box) return;
    box.innerHTML = specs.map(function (spec) {
      var id = String(spec.skuCode || '');
      var checked = selectedSkuIds.indexOf(id) >= 0 ? ' checked' : '';
      return (
        '<label class="product-proxy-form__sku-option">' +
        '<input type="checkbox" data-sku-pick="' + escapeHtml(id) + '"' + checked + '>' +
        '<span>' + escapeHtml(spec.specName || spec.specValue || id) + '</span></label>'
      );
    }).join('');
  }

  function renderSkuCard(spec) {
    var showMoney = getExchangeType() === 'points_money';
    var enabled = !!spec.exchangeEnabled;
    var fallbackImg = (formExtra.images && formExtra.images[0]) || (product && product.img) ||
      '../user-app/assets/restock/product-leaf.svg';
    var skuImg = spec.skuImg || fallbackImg;
    var saleUnits = [{ value: '', label: '请选择' }].concat(
      SALE_UNITS.map(function (u) { return { value: u, label: u }; })
    );
    var lineVal = spec.linePrice == null ? '' : spec.linePrice;
    var extraMoney = showMoney
      ? moneyHtml('加价金额', 'money', spec.money || 0)
      : '';
    return (
      '<article class="product-proxy-spec' + (enabled ? '' : ' is-disabled') + '" data-sku-id="' +
      escapeHtml(spec.skuCode || '') + '">' +
      '<div class="product-proxy-spec__head">' +
      '<span class="product-proxy-spec__head-label">展示规格名称</span>' +
      '<input type="text" class="product-proxy-spec__head-input" data-field="specName" value="' +
      escapeHtml(spec.specName || '') + '" placeholder="请输入展示规格名称">' +
      '</div>' +
      '<div class="product-proxy-spec__body">' +
      '<button type="button" class="product-proxy-spec__thumb" data-act="edit-spec-img" title="点击更换规格图片">' +
      '<img src="' + escapeHtml(skuImg) + '" alt="" onerror="this.onerror=null;this.src=\'../user-app/assets/restock/product-leaf.svg\'">' +
      '</button>' +
      '<div class="product-proxy-spec__grid">' +
      fieldHtml('商品条形码', 'barcode', spec.barcode, true) +
      fieldHtml('规格值', 'specValue', spec.specValue || spec.specName, true) +
      fieldHtml('基础单位', 'baseUnit', spec.baseUnit, true) +
      moneyHtml('采购价', 'purchasePrice', spec.purchasePrice, true) +
      fieldHtml('售卖系数', 'saleRatio', spec.saleRatio || '') +
      selectHtml('售卖单位', 'saleUnit', saleUnits, spec.saleUnit) +
      fieldHtml('兑换积分', 'points', spec.points != null ? spec.points : 100, false, 'is-live-stock') +
      extraMoney +
      moneyHtml('划线价', 'linePrice', lineVal) +
      fieldHtml('起售量', 'minSaleQty', spec.minSaleQty != null ? spec.minSaleQty : 1) +
      fieldHtml('现货库存', 'spotStock', spec.spotStock, true) +
      fieldHtml('实际库存', 'sellableStock', spec.sellableStock, true) +
      fieldHtml('兑换库存', 'stock', spec.stock != null ? spec.stock : 0, false, 'is-live-stock') +
      fieldHtml('已兑换', 'exchangedQty', spec.exchangedQty != null ? spec.exchangedQty : 0, true) +
      '<p class="product-proxy-spec__stock-tip product-proxy-spec__stock-tip--span">划线价选填。商品限购只在上方 SPU 设置，规格上不配限购。上架的规格会出现在积分商城列表中。</p>' +
      '</div></div>' +
      '<div class="product-proxy-spec__foot">' +
      '<button type="button" class="product-proxy-spec__btn-off' + (enabled ? '' : ' is-off') +
      '" data-act="toggle-exchange">' + (enabled ? '下架' : '上架') + '</button>' +
      '<button type="button" class="product-proxy-spec__btn-del" data-act="remove-sku">删除</button>' +
      '</div></article>'
    );
  }

  function renderSkuCards() {
    var list = document.getElementById('mallFormSkuList');
    if (!list) return;
    var cards = selectedSkuIds.map(findSpec).filter(Boolean);
    if (!cards.length) {
      list.innerHTML = '<div class="mkt-points-mall-sku-empty">请至少选择一个 SKU</div>';
    } else {
      list.innerHTML = cards.map(renderSkuCard).join('');
    }
    syncSkuTrigger();
    renderSkuDropdown();
  }

  function readSkuCards() {
    document.querySelectorAll('#mallFormSkuList .product-proxy-spec').forEach(function (panel) {
      var spec = findSpec(panel.getAttribute('data-sku-id'));
      if (!spec) return;
      panel.querySelectorAll('[data-field]').forEach(function (input) {
        var field = input.getAttribute('data-field');
        if (field === 'barcode' || field === 'specValue' || field === 'baseUnit' ||
            field === 'purchasePrice' || field === 'spotStock' || field === 'sellableStock' ||
            field === 'exchangedQty') {
          return;
        }
        spec[field] = input.value;
      });
      var lineRaw = String(spec.linePrice == null ? '' : spec.linePrice).trim();
      if (lineRaw === '') spec.linePrice = null;
      else {
        var lp = Number(lineRaw);
        spec.linePrice = isNaN(lp) || lp < 0 ? null : Math.round(lp * 100) / 100;
      }
      spec.points = Math.max(0, Math.round(Number(spec.points) || 0));
      spec.money = Math.round((Number(spec.money) || 0) * 100) / 100;
      spec.stock = Math.max(0, Math.round(Number(spec.stock) || 0));
      spec.minSaleQty = Math.max(1, Math.round(Number(spec.minSaleQty) || 1));
      spec.saleRatio = String(spec.saleRatio || '');
      spec.saleUnit = String(spec.saleUnit || '');
      spec.specName = String(spec.specName || spec.specValue || '默认规格');
    });
  }

  function syncExchangeTypeUi() {
    readSkuCards();
    renderSkuCards();
  }

  function initSelectedSkuIds() {
    selectedSkuIds = specs.filter(function (s) { return s.exchangeEnabled; }).map(function (s) {
      return String(s.skuCode || '');
    }).filter(Boolean);
    if (!selectedSkuIds.length && specs[0] && specs[0].skuCode) {
      selectedSkuIds = [String(specs[0].skuCode)];
      specs[0].exchangeEnabled = true;
    }
  }

  function renderImages() {
    var root = document.getElementById('mallFormImages');
    if (!root) return;
    var html = (formExtra.images || []).map(function (src, idx) {
      return (
        '<div class="product-proxy-form__img-item" data-img-index="' + idx + '">' +
        '  <img src="' + escapeHtml(src) + '" alt="">' +
        '  <button type="button" class="product-proxy-form__img-remove" data-action="remove-image" data-index="' + idx + '" aria-label="删除">&times;</button>' +
        '</div>'
      );
    }).join('');
    root.innerHTML = html +
      '<button type="button" class="product-add-upload__box" data-action="add-image"><span class="product-add-upload__plus">+</span></button>';
  }

  function syncSalesInput() {
    var mode = getCheckedRadio('mallFormDisplaySalesMode') || 'ACTUAL';
    var input = document.getElementById('mallFormDisplaySales');
    if (input) input.hidden = mode !== 'CUSTOM';
  }

  function fillForm(item) {
    product = item;
    specs = Array.isArray(item.specs) ? item.specs.slice() : [];
    formExtra.images = Array.isArray(item.images) && item.images.length
      ? item.images.slice()
      : (item.img ? [item.img] : []);
    formExtra.saleRegions = cloneMap(item.saleRegions);
    formExtra.saleRegionSummary = Array.isArray(item.saleRegionSummary) ? item.saleRegionSummary.slice() : [];
    formExtra.saleStores = cloneMap(item.saleStores);

    var idEl = document.getElementById('mallFormProductId');
    if (idEl) idEl.textContent = item.code || '-';
    var nameEl = document.getElementById('mallFormName');
    if (nameEl) nameEl.value = item.name || '';
    var descEl = document.getElementById('mallFormDesc');
    if (descEl) descEl.value = item.desc || '';
    var arrivalEl = document.getElementById('mallFormArrival');
    if (arrivalEl) arrivalEl.value = item.arrivalTime || '';
    var arrivalUnitEl = document.getElementById('mallFormArrivalUnit');
    if (arrivalUnitEl) arrivalUnitEl.value = item.arrivalUnit === 'HOUR' ? 'HOUR' : 'DAY';

    setRadio('mallFormStatus', item.status === 'schedule' ? 'schedule' : (item.status === 'on_shelf' ? 'on_shelf' : 'off_shelf'));
    var onEl = document.getElementById('mallFormScheduleOn');
    var offEl = document.getElementById('mallFormScheduleOff');
    if (onEl) onEl.value = toDatetimeLocal(item.scheduleOnAt);
    if (offEl) offEl.value = toDatetimeLocal(item.scheduleOffAt);
    syncStatusUi();

    setRadio('mallFormDeliveryMode', item.deliveryMode === 'express' ? 'express' : 'pickup');

    var salesMode = item.displaySalesMode === 'CUSTOM' ? 'CUSTOM' : 'ACTUAL';
    setRadio('mallFormDisplaySalesMode', salesMode);
    var salesEl = document.getElementById('mallFormDisplaySales');
    if (salesEl) salesEl.value = item.displaySales || '';
    syncSalesInput();

    renderLevelBlock(item.memberLevelIds);
    syncLevelScopeUi();

    var limitType = item.limitType || 'none';
    setRadio('mallFormLimitType', limitType);
    var limitVal = '';
    if (limitType === 'order') limitVal = item.limitPerOrder != null ? String(item.limitPerOrder) : '';
    if (limitType === 'day') limitVal = item.limitPerDay != null ? String(item.limitPerDay) : '';
    if (limitType === 'total') limitVal = item.limitTotal != null ? String(item.limitTotal) : '';
    var limitInput = document.getElementById('mallFormLimitValue');
    if (limitInput) limitInput.value = limitVal;
    syncLimitUi();

    setRadio('mallFormSaleScope', item.saleScope === 'region' || item.saleScope === 'store' ? item.saleScope : 'all');
    syncSaleScopeUi();

    var portScope = item.salePortScope === 'custom' ? 'custom' : 'all';
    setRadio('mallFormPortScope', portScope);
    setSalePorts(item.salePorts);
    syncPortScopeUi();

    var exchangeType = item.exchangeType === 'points_money' ? 'points_money' : 'points';
    setRadio('mallFormExchangeType', exchangeType);
    initSelectedSkuIds();
    renderSkuCards();
    takeSpecSnapshot();

    renderImages();

    var editor = document.getElementById('mallFormDetailEditor');
    if (editor) editor.innerHTML = item.detailHtml || '';
  }

  function readForm() {
    var name = ((document.getElementById('mallFormName') || {}).value || '').trim();
    if (!name) {
      toast('请填写商品名称', 'warning');
      return null;
    }
    if (!getCheckedRadio('mallFormDeliveryMode')) {
      toast('请选择配送方式', 'warning');
      return null;
    }
    if (!getCheckedRadio('mallFormDisplaySalesMode')) {
      toast('请选择展示销量', 'warning');
      return null;
    }
    var salesMode = getCheckedRadio('mallFormDisplaySalesMode') || 'ACTUAL';
    var displaySales = ((document.getElementById('mallFormDisplaySales') || {}).value || '').trim();
    if (salesMode === 'CUSTOM' && !displaySales) {
      toast('请填写自定义展示销量', 'warning');
      return null;
    }
    if (!getCheckedRadio('mallFormExchangeType')) {
      toast('请选择兑换方式', 'warning');
      return null;
    }
    if (!getCheckedRadio('mallFormLimitType')) {
      toast('请选择商品限购', 'warning');
      return null;
    }
    if (!getCheckedRadio('mallFormStatus')) {
      toast('请选择商品状态', 'warning');
      return null;
    }

    var status = getCheckedRadio('mallFormStatus') || 'off_shelf';
    var scheduleOnAt = ((document.getElementById('mallFormScheduleOn') || {}).value || '').trim();
    var scheduleOffAt = ((document.getElementById('mallFormScheduleOff') || {}).value || '').trim();
    if (status === 'schedule') {
      if (!scheduleOnAt || !scheduleOffAt) {
        toast('请填写定时上下架的上架时间与下架时间', 'warning');
        return null;
      }
      if (scheduleOnAt >= scheduleOffAt) {
        toast('下架时间需晚于上架时间', 'warning');
        return null;
      }
    } else {
      scheduleOnAt = '';
      scheduleOffAt = '';
    }

    var deliveryMode = getCheckedRadio('mallFormDeliveryMode') === 'express' ? 'express' : 'pickup';

    var levelScope = getCheckedRadio('mallFormLevelScope') || 'all';
    var memberLevelIds = [];
    if (levelScope === 'custom') {
      document.querySelectorAll('#mallFormMemberLevels [data-field="memberLevel"]').forEach(function (el) {
        if (el.checked) memberLevelIds.push(el.value);
      });
      if (!memberLevelIds.length) {
        toast('请至少勾选一个指定会员等级', 'warning');
        return null;
      }
    }

    var limitType = getCheckedRadio('mallFormLimitType') || 'none';
    var limitValue = null;
    if (limitType !== 'none') {
      var raw = ((document.getElementById('mallFormLimitValue') || {}).value || '').trim();
      var n = Number(raw);
      if (!raw || isNaN(n) || n < 1) {
        toast('请填写限购件数（至少 1 件）', 'warning');
        return null;
      }
      limitValue = Math.round(n);
    }

    var saleScope = getCheckedRadio('mallFormSaleScope') || 'all';
    if (saleScope === 'region' && !(formExtra.saleRegionSummary || []).length) {
      toast('请选择售卖区域', 'warning');
      return null;
    }
    if (saleScope === 'store' && !getSaleStoreCount()) {
      toast('请选择售卖门店', 'warning');
      return null;
    }

    var salePortScope = getCheckedRadio('mallFormPortScope') || 'all';
    var salePorts = [];
    if (salePortScope === 'custom') {
      salePorts = getSalePorts();
      if (!salePorts.length) {
        toast('请至少选择一个售卖端口', 'warning');
        return null;
      }
    }

    var type = getExchangeType();
    readSkuCards();
    var nextSpecs = [];
    var enabledCount = 0;
    var invalid = false;
    var selectedMap = {};
    selectedSkuIds.forEach(function (id) { selectedMap[id] = true; });

    specs.forEach(function (src) {
      var id = String(src.skuCode || '');
      var selected = !!selectedMap[id];
      var enabled = selected && !!src.exchangeEnabled;
      var pts = Number(src.points);
      var moneyVal = Number(src.money);
      var stockVal = Number(src.stock);
      var minSaleVal = Number(src.minSaleQty);
      var linePrice = src.linePrice;
      if (linePrice != null && linePrice !== '') {
        var lp = Number(linePrice);
        if (isNaN(lp) || lp < 0) invalid = true;
        else linePrice = Math.round(lp * 100) / 100;
      } else {
        linePrice = null;
      }

      if (enabled) {
        enabledCount += 1;
        if (!pts || pts < 1 || isNaN(pts)) invalid = true;
        if (type === 'points_money' && (isNaN(moneyVal) || moneyVal < 0)) invalid = true;
        if (isNaN(stockVal) || stockVal < 0) invalid = true;
        if (isNaN(minSaleVal) || minSaleVal < 1) invalid = true;
      }

      nextSpecs.push({
        skuCode: src.skuCode,
        specName: src.specName,
        skuImg: src.skuImg || '',
        purchasePrice: src.purchasePrice,
        linePrice: linePrice,
        stock: isNaN(stockVal) ? (src.stock || 0) : Math.max(0, Math.round(stockVal)),
        minSaleQty: isNaN(minSaleVal) ? Math.max(1, Number(src.minSaleQty) || 1) : Math.max(1, Math.round(minSaleVal)),
        exchangeEnabled: enabled,
        exchangeType: type,
        points: enabled ? Math.round(pts) : Math.max(0, Math.round(pts) || 0),
        money: enabled && type === 'points_money' ? moneyVal : 0,
        exchangedQty: src.exchangedQty || 0,
        barcode: src.barcode || '',
        specValue: src.specValue || src.specName || '',
        baseUnit: src.baseUnit || '',
        saleUnit: src.saleUnit || '',
        saleRatio: src.saleRatio || '',
        spotStock: src.spotStock,
        sellableStock: src.sellableStock
      });
    });

    if (!enabledCount) {
      toast('请至少上架一个规格', 'warning');
      return null;
    }
    if (invalid) {
      toast('请完善已开启规格的兑换信息、划线价、库存与起售量', 'warning');
      return null;
    }

    var editor = document.getElementById('mallFormDetailEditor');
    var detailHtml = editor ? editor.innerHTML : '';
    var images = (formExtra.images || []).slice();
    var cover = images[0] || product.img || '';

    return {
      code: product.code,
      goodsId: product.code,
      name: name,
      desc: ((document.getElementById('mallFormDesc') || {}).value || '').trim(),
      arrivalTime: ((document.getElementById('mallFormArrival') || {}).value || '').trim(),
      arrivalUnit: ((document.getElementById('mallFormArrivalUnit') || {}).value || 'DAY') === 'HOUR' ? 'HOUR' : 'DAY',
      displaySalesMode: salesMode,
      displaySales: salesMode === 'CUSTOM' ? displaySales : '',
      img: cover,
      category: product.category,
      status: status,
      scheduleOnAt: scheduleOnAt,
      scheduleOffAt: scheduleOffAt,
      deliveryMode: deliveryMode,
      saleScope: saleScope,
      saleRegions: saleScope === 'region' ? cloneMap(formExtra.saleRegions) : {},
      saleRegionSummary: saleScope === 'region' ? (formExtra.saleRegionSummary || []).slice() : [],
      saleStores: saleScope === 'store' ? cloneMap(formExtra.saleStores) : {},
      salePortScope: salePortScope,
      salePorts: salePortScope === 'custom' ? salePorts : [],
      images: images,
      detailHtml: detailHtml,
      exchangeType: type,
      memberLevelIds: memberLevelIds,
      limitType: limitType,
      limitPerOrder: limitType === 'order' ? limitValue : null,
      limitPerDay: limitType === 'day' ? limitValue : null,
      limitTotal: limitType === 'total' ? limitValue : null,
      specs: nextSpecs
    };
  }

  function insertImageAtCursor(editor, dataUrl) {
    editor.focus();
    var imgHtml = '<img src="' + dataUrl + '" alt="详情图片">';
    if (document.queryCommandSupported && document.queryCommandSupported('insertHTML')) {
      document.execCommand('insertHTML', false, imgHtml);
      return;
    }
    editor.insertAdjacentHTML('beforeend', imgHtml);
  }

  function bindEvents() {
    document.querySelectorAll('input[name="mallFormStatus"]').forEach(function (el) {
      el.addEventListener('change', syncStatusUi);
    });
    document.querySelectorAll('input[name="mallFormDisplaySalesMode"]').forEach(function (el) {
      el.addEventListener('change', syncSalesInput);
    });
    document.querySelectorAll('input[name="mallFormLimitType"]').forEach(function (el) {
      el.addEventListener('change', syncLimitUi);
    });
    document.querySelectorAll('input[name="mallFormExchangeType"]').forEach(function (el) {
      el.addEventListener('change', syncExchangeTypeUi);
    });
    document.querySelectorAll('input[name="mallFormSaleScope"]').forEach(function (el) {
      el.addEventListener('change', syncSaleScopeUi);
    });
    document.querySelectorAll('input[name="mallFormPortScope"]').forEach(function (el) {
      el.addEventListener('change', syncPortScopeUi);
    });

    var levelRoot = document.getElementById('mallFormLevelBlock');
    if (levelRoot) {
      levelRoot.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'mallFormLevelScope') syncLevelScopeUi();
      });
    }

    var specList = document.getElementById('mallFormSkuList');
    var specImageInput = document.getElementById('mallFormSpecImageInput');
    var pendingSpecImgCode = '';
    if (specList) {
      specList.addEventListener('click', function (e) {
        var actEl = e.target.closest('[data-act]');
        if (!actEl) return;
        var panel = actEl.closest('[data-sku-id]');
        if (!panel) return;
        var id = panel.getAttribute('data-sku-id');
        var spec = findSpec(id);
        if (!spec) return;
        readSkuCards();
        if (actEl.getAttribute('data-act') === 'edit-spec-img') {
          pendingSpecImgCode = id;
          if (specImageInput) specImageInput.click();
          return;
        }
        if (actEl.getAttribute('data-act') === 'toggle-exchange') {
          spec.exchangeEnabled = !spec.exchangeEnabled;
          renderSkuCards();
          toast(spec.exchangeEnabled ? '该规格已上架' : '该规格已下架');
          return;
        }
        if (actEl.getAttribute('data-act') === 'remove-sku') {
          if (selectedSkuIds.length <= 1) {
            toast('至少保留一个规格', 'warning');
            return;
          }
          selectedSkuIds = selectedSkuIds.filter(function (x) { return x !== id; });
          spec.exchangeEnabled = false;
          renderSkuCards();
          toast('已移除该规格');
        }
      });
    }
    if (specImageInput) {
      specImageInput.addEventListener('change', function () {
        var file = specImageInput.files && specImageInput.files[0];
        var code = pendingSpecImgCode;
        pendingSpecImgCode = '';
        specImageInput.value = '';
        var spec = findSpec(code);
        if (!file || !spec) return;
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
          toast('请上传 JPG/PNG/GIF/WEBP 格式图片', 'warning');
          return;
        }
        if (file.size > IMAGE_MAX_BYTES) {
          toast('规格图片不能超过 5MB', 'warning');
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          spec.skuImg = String(reader.result || '');
          var imgEl = document.querySelector('#mallFormSkuList [data-sku-id="' + code + '"] .product-proxy-spec__thumb img');
          if (imgEl) imgEl.src = spec.skuImg;
          toast('规格图片已更新', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    var resetBtn = document.getElementById('mallFormResetSkuBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!specSnapshot) return;
        if (!window.confirm('确认重置当前规格配置吗？重置后将恢复到进入编辑前的内容。')) return;
        specs = cloneSpecs(specSnapshot.specs);
        selectedSkuIds = specSnapshot.selected.slice();
        renderSkuCards();
        toast('规格已重置');
      });
    }

    var trigger = document.getElementById('mallFormSkuTrigger');
    var dropdown = document.getElementById('mallFormSkuDropdown');
    var picker = document.getElementById('mallFormSkuPicker');
    if (trigger && dropdown) {
      trigger.addEventListener('click', function (ev) {
        ev.stopPropagation();
        dropdown.hidden = !dropdown.hidden;
      });
    }
    if (dropdown) {
      dropdown.addEventListener('change', function (ev) {
        var box = ev.target.closest('[data-sku-pick]');
        if (!box) return;
        var id = box.getAttribute('data-sku-pick');
        var spec = findSpec(id);
        readSkuCards();
        if (box.checked) {
          if (selectedSkuIds.indexOf(id) < 0) selectedSkuIds.push(id);
          if (spec && !spec.exchangeEnabled) spec.exchangeEnabled = true;
        } else {
          if (selectedSkuIds.length <= 1) {
            box.checked = true;
            toast('请至少保留一个 SKU', 'warning');
            return;
          }
          selectedSkuIds = selectedSkuIds.filter(function (x) { return x !== id; });
          if (spec) spec.exchangeEnabled = false;
        }
        renderSkuCards();
      });
    }
    document.addEventListener('click', function (ev) {
      if (!picker || !dropdown || dropdown.hidden) return;
      if (picker.contains(ev.target)) return;
      dropdown.hidden = true;
    });

    var regionPickBtn = document.getElementById('mallSaleScopePickBtn');
    if (regionPickBtn) {
      regionPickBtn.addEventListener('click', function () {
        if (!window.MdmProxyRegionPicker) {
          toast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: formExtra.saleRegions,
          onConfirm: function (selected, summary) {
            formExtra.saleRegions = cloneMap(selected);
            formExtra.saleRegionSummary = Array.isArray(summary) ? summary : [];
            if (window.MdmProxyRegionPicker.summarize && !formExtra.saleRegionSummary.length) {
              formExtra.saleRegionSummary = window.MdmProxyRegionPicker.summarize(formExtra.saleRegions);
            }
            syncSaleScopeUi();
          }
        });
      });
    }

    var storePickBtn = document.getElementById('mallSaleScopeStorePickBtn');
    if (storePickBtn) {
      storePickBtn.addEventListener('click', function () {
        if (!window.MdmProxyStorePicker) {
          toast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: formExtra.saleStores,
          onConfirm: function (selected) {
            formExtra.saleStores = cloneMap(selected);
            syncSaleScopeUi();
          }
        });
      });
    }

    var imagesRoot = document.getElementById('mallFormImages');
    var imageInput = document.getElementById('mallFormImageInput');
    if (imagesRoot && imageInput) {
      imagesRoot.addEventListener('click', function (e) {
        var addBtn = e.target.closest('[data-action="add-image"]');
        if (addBtn) {
          imageInput.click();
          return;
        }
        var removeBtn = e.target.closest('[data-action="remove-image"]');
        if (removeBtn) {
          var idx = Number(removeBtn.getAttribute('data-index'));
          if (!isNaN(idx)) {
            formExtra.images.splice(idx, 1);
            renderImages();
          }
        }
      });
      imageInput.addEventListener('change', function () {
        var file = imageInput.files && imageInput.files[0];
        imageInput.value = '';
        if (!file) return;
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
          toast('请上传 JPG/PNG/GIF/WEBP 格式图片', 'warning');
          return;
        }
        if (file.size > IMAGE_MAX_BYTES) {
          toast('图片大小不能超过 5MB', 'warning');
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          formExtra.images.push(String(reader.result || ''));
          renderImages();
        };
        reader.readAsDataURL(file);
      });
    }

    document.querySelectorAll('.product-add-editor__toolbar button[data-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var editor = document.getElementById('mallFormDetailEditor');
        if (!editor) return;
        editor.focus();
        var cmd = btn.getAttribute('data-cmd');
        var val = btn.getAttribute('data-val') || null;
        if (cmd === 'formatBlock' && val) {
          document.execCommand(cmd, false, val);
          return;
        }
        document.execCommand(cmd, false, val);
      });
    });

    var detailImgBtn = document.getElementById('mallFormInsertImage');
    var detailImgInput = document.getElementById('mallFormDetailImageInput');
    var detailEditor = document.getElementById('mallFormDetailEditor');
    if (detailImgBtn && detailImgInput && detailEditor) {
      detailImgBtn.addEventListener('click', function (e) {
        e.preventDefault();
        detailImgInput.click();
      });
      detailImgInput.addEventListener('change', function () {
        var file = detailImgInput.files && detailImgInput.files[0];
        detailImgInput.value = '';
        if (!file) return;
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
          toast('请上传 JPG/PNG/GIF/WEBP 格式图片', 'warning');
          return;
        }
        if (file.size > IMAGE_MAX_BYTES) {
          toast('图片大小不能超过 5MB', 'warning');
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          insertImageAtCursor(detailEditor, String(reader.result || ''));
        };
        reader.readAsDataURL(file);
      });
    }

    var cancelBtn = document.getElementById('mallFormCancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        window.location.href = 'mdm_marketing_points_mall.html';
      });
    }

    var saveBtn = document.getElementById('mallFormSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var data = readForm();
        if (!data || !window.MdmPointsMallStore) return;
        window.MdmPointsMallStore.upsert(data);
        toast('积分商品已保存', 'success');
        setTimeout(function () {
          window.location.href = 'mdm_marketing_points_mall.html';
        }, 400);
      });
    }
  }

  function init() {
    var code = queryCode();
    if (!window.MdmPointsMallStore) {
      showLoadError('积分商品数据未加载，请返回列表重试');
      return;
    }
    if (!code) {
      showLoadError('缺少商品编码，请从积分商城列表点击「编辑」进入');
      return;
    }

    var item = window.MdmPointsMallStore.getByCode(code);
    if (!item) {
      showLoadError('未找到积分商品（' + code + '），请返回列表重试');
      return;
    }

    try {
      sessionStorage.removeItem('mdm_points_mall_edit_code');
    } catch (e) { /* ignore */ }

    try {
      if (typeof window.MdmPointsMallStore.mergeWithCatalogSpecs === 'function') {
        item = window.MdmPointsMallStore.mergeWithCatalogSpecs(item);
      }
    } catch (err) {
      console.warn('[points-mall-form] mergeWithCatalogSpecs failed', err);
    }

    fillForm(item);
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
