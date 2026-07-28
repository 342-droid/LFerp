/**
 * 营销 — 编辑积分商品（独立页面）
 * 含：定时上下架、限购三选一、兑换方式单选、履约方式、划线价、售卖范围、商品图片、详情
 */
(function () {
  var IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  var product = null;
  var specs = [];
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

  function formatMoney(num) {
    var n = Math.round((Number(num) || 0) * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    return '¥' + n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
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

  function syncSpecRowControls(tr, exchangeType) {
    var enabled = !!(tr.querySelector('[data-field="exchangeEnabled"]') || {}).checked;
    var stockEl = tr.querySelector('[data-field="stock"]');
    var minSaleEl = tr.querySelector('[data-field="minSaleQty"]');
    var pointsEl = tr.querySelector('[data-field="points"]');
    var moneyEl = tr.querySelector('[data-field="money"]');
    var lineEl = tr.querySelector('[data-field="linePrice"]');
    var showMoney = exchangeType === 'points_money';
    tr.classList.toggle('is-disabled', !enabled);
    if (stockEl) stockEl.disabled = !enabled;
    if (minSaleEl) minSaleEl.disabled = !enabled;
    if (pointsEl) pointsEl.disabled = !enabled;
    if (lineEl) lineEl.disabled = !enabled;
    if (moneyEl) {
      moneyEl.disabled = !enabled || !showMoney;
      if (!showMoney) moneyEl.value = moneyEl.value || '0';
    }
  }

  function syncExchangeTypeUi() {
    var type = getExchangeType();
    var showMoney = type === 'points_money';
    document.querySelectorAll('[data-money-col]').forEach(function (el) {
      el.hidden = !showMoney;
    });
    document.querySelectorAll('#mallFormSpecBody tr').forEach(function (tr) {
      syncSpecRowControls(tr, type);
    });
  }

  function renderSpecRows(list, exchangeType) {
    var showMoney = exchangeType === 'points_money';
    var body = document.getElementById('mallFormSpecBody');
    if (!body) return;
    var fallbackImg = (formExtra.images && formExtra.images[0]) || (product && product.img) ||
      '../user-app/assets/restock/product-leaf.svg';
    body.innerHTML = list.map(function (spec, i) {
      var enabled = !!spec.exchangeEnabled;
      var lineVal = spec.linePrice == null ? '' : String(spec.linePrice);
      var skuImg = spec.skuImg || fallbackImg;
      return (
        '<tr data-spec-index="' + i + '" class="' + (enabled ? '' : 'is-disabled') + '">' +
        '<td class="mkt-points-mall-spec-table__check">' +
        '  <label class="mkt-points-mall-check">' +
        '    <input type="checkbox" data-field="exchangeEnabled"' + (enabled ? ' checked' : '') + '>' +
        '    <span>开启</span>' +
        '  </label>' +
        '</td>' +
        '<td>' + escapeHtml(spec.skuCode || '-') + '</td>' +
        '<td>' + escapeHtml(spec.specName || '-') + '</td>' +
        '<td>' +
        '  <button type="button" class="mkt-points-mall-spec-img" data-action="edit-spec-img" data-spec-index="' + i + '" title="点击更换规格图片">' +
        '    <img src="' + escapeHtml(skuImg) + '" alt="" onerror="this.onerror=null;this.src=\'../user-app/assets/restock/product-leaf.svg\'">' +
        '    <span>更换</span>' +
        '  </button>' +
        '</td>' +
        '<td>' + formatMoney(spec.purchasePrice) + '</td>' +
        '<td><input type="number" min="0" step="0.01" data-field="linePrice" placeholder="选填" value="' +
        escapeHtml(lineVal) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td><input type="number" min="0" step="1" data-field="stock" value="' +
        escapeHtml(String(spec.stock != null ? spec.stock : 0)) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td><input type="number" min="1" step="1" data-field="minSaleQty" value="' +
        escapeHtml(String(spec.minSaleQty != null ? spec.minSaleQty : 1)) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td><input type="number" min="1" step="1" data-field="points" value="' +
        escapeHtml(String(spec.points || 100)) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td data-money-col' + (showMoney ? '' : ' hidden') + '>' +
        '  <input type="number" min="0" step="0.01" data-field="money" value="' +
        escapeHtml(String(spec.money || 0)) + '"' + (enabled && showMoney ? '' : ' disabled') + '>' +
        '</td>' +
        '<td>' + escapeHtml(String(spec.exchangedQty != null ? spec.exchangedQty : 0)) + '</td>' +
        '</tr>'
      );
    }).join('');
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

    var cover = document.getElementById('mallFormImg');
    if (cover && formExtra.images[0]) cover.src = formExtra.images[0];
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

    var imgEl = document.getElementById('mallFormImg');
    var nameEl = document.getElementById('mallFormName');
    var metaEl = document.getElementById('mallFormMeta');
    if (imgEl) imgEl.src = formExtra.images[0] || item.img || '';
    if (nameEl) nameEl.textContent = item.name || '—';
    var enabledCount = specs.filter(function (s) { return s.exchangeEnabled; }).length;
    if (metaEl) {
      metaEl.textContent =
        (item.code || '') + ' · ' + (item.category || '-') +
        ' · 选品库 ' + specs.length + ' 个规格 · 已开启兑换 ' + enabledCount + ' 个';
    }

    setRadio('mallFormStatus', item.status === 'schedule' ? 'schedule' : (item.status === 'on_shelf' ? 'on_shelf' : 'off_shelf'));
    var onEl = document.getElementById('mallFormScheduleOn');
    var offEl = document.getElementById('mallFormScheduleOff');
    if (onEl) onEl.value = toDatetimeLocal(item.scheduleOnAt);
    if (offEl) offEl.value = toDatetimeLocal(item.scheduleOffAt);
    syncStatusUi();

    setRadio('mallFormDeliveryMode', item.deliveryMode === 'express' ? 'express' : 'platform');

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
    renderSpecRows(specs, exchangeType);
    syncExchangeTypeUi();

    renderImages();

    var editor = document.getElementById('mallFormDetailEditor');
    if (editor) editor.innerHTML = item.detailHtml || '';
  }

  function readForm() {
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

    var deliveryMode = getCheckedRadio('mallFormDeliveryMode') === 'express' ? 'express' : 'platform';

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
    var nextSpecs = [];
    var enabledCount = 0;
    var invalid = false;

    document.querySelectorAll('#mallFormSpecBody tr').forEach(function (tr, i) {
      var src = specs[i] || {};
      var enabled = !!(tr.querySelector('[data-field="exchangeEnabled"]') || {}).checked;
      var stockVal = Number((tr.querySelector('[data-field="stock"]') || {}).value);
      var minSaleVal = Number((tr.querySelector('[data-field="minSaleQty"]') || {}).value);
      var pts = Number((tr.querySelector('[data-field="points"]') || {}).value);
      var moneyVal = Number((tr.querySelector('[data-field="money"]') || {}).value);
      var lineRaw = ((tr.querySelector('[data-field="linePrice"]') || {}).value || '').trim();
      var linePrice = null;
      if (lineRaw !== '') {
        var lp = Number(lineRaw);
        if (isNaN(lp) || lp < 0) invalid = true;
        else linePrice = Math.round(lp * 100) / 100;
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
        exchangedQty: src.exchangedQty || 0
      });
    });

    if (!enabledCount) {
      toast('请至少开启一个规格的积分兑换', 'warning');
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
      name: product.name,
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

    var specBody = document.getElementById('mallFormSpecBody');
    var specImageInput = document.getElementById('mallFormSpecImageInput');
    var pendingSpecImgIndex = -1;
    if (specBody) {
      specBody.addEventListener('change', function (e) {
        var tr = e.target.closest('tr');
        if (!tr) return;
        if (e.target.getAttribute('data-field') === 'exchangeEnabled') {
          syncSpecRowControls(tr, getExchangeType());
        }
      });
      specBody.addEventListener('click', function (e) {
        var imgBtn = e.target.closest('[data-action="edit-spec-img"]');
        if (!imgBtn || !specImageInput) return;
        pendingSpecImgIndex = Number(imgBtn.getAttribute('data-spec-index'));
        if (isNaN(pendingSpecImgIndex)) pendingSpecImgIndex = -1;
        specImageInput.click();
      });
    }
    if (specImageInput) {
      specImageInput.addEventListener('change', function () {
        var file = specImageInput.files && specImageInput.files[0];
        var idx = pendingSpecImgIndex;
        pendingSpecImgIndex = -1;
        specImageInput.value = '';
        if (!file || idx < 0 || !specs[idx]) return;
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
          specs[idx].skuImg = String(reader.result || '');
          var imgEl = document.querySelector(
            '#mallFormSpecBody [data-action="edit-spec-img"][data-spec-index="' + idx + '"] img'
          );
          if (imgEl) imgEl.src = specs[idx].skuImg;
          toast('规格图片已更新', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

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
