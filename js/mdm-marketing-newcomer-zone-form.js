/**
 * 营销 — 编辑新人专区商品（独立页面）
 * 含：定时上下架、履约方式、划线价、售卖范围、规格活动价、商品图片、详情
 * （商品限购 / 起售量由 C 端固定规则控制，表单不再配置）
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
      code = String(sessionStorage.getItem('mdm_newcomer_zone_edit_code') || '').trim();
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
        escapeHtml(msg || '未找到新人专区商品') +
        ' <a href="mdm_marketing_newcomer_zone.html">返回新人专区</a>' +
        '</div>';
    }
    toast(msg || '未找到新人专区商品', 'warning');
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

  function syncStatusUi() {
    var status = getCheckedRadio('mallFormStatus') || 'off_shelf';
    var isSchedule = status === 'schedule';
    var box = document.getElementById('mallFormSchedule');
    var hint = document.getElementById('mallFormScheduleHint');
    if (box) box.hidden = !isSchedule;
    if (hint) hint.hidden = !isSchedule;
  }

  function syncSpecRowControls(tr) {
    var enabled = !!(tr.querySelector('[data-field="saleEnabled"]') || {}).checked;
    var stockEl = tr.querySelector('[data-field="stock"]');
    var salePriceEl = tr.querySelector('[data-field="salePrice"]');
    var lineEl = tr.querySelector('[data-field="linePrice"]');
    tr.classList.toggle('is-disabled', !enabled);
    if (stockEl) stockEl.disabled = !enabled;
    if (salePriceEl) salePriceEl.disabled = !enabled;
    if (lineEl) lineEl.disabled = !enabled;
  }

  function renderSpecRows(list) {
    var body = document.getElementById('mallFormSpecBody');
    if (!body) return;
    var fallbackImg = (formExtra.images && formExtra.images[0]) || (product && product.img) ||
      '../user-app/assets/restock/product-leaf.svg';
    body.innerHTML = list.map(function (spec, i) {
      var enabled = !!spec.saleEnabled;
      var lineVal = spec.linePrice == null ? '' : String(spec.linePrice);
      var salePriceVal = spec.salePrice != null ? String(spec.salePrice) : '0';
      var skuImg = spec.skuImg || fallbackImg;
      return (
        '<tr data-spec-index="' + i + '" class="' + (enabled ? '' : 'is-disabled') + '">' +
        '<td class="mkt-newcomer-zone-spec-table__check">' +
        '  <label class="mkt-newcomer-zone-check">' +
        '    <input type="checkbox" data-field="saleEnabled"' + (enabled ? ' checked' : '') + '>' +
        '    <span>开启</span>' +
        '  </label>' +
        '</td>' +
        '<td>' + escapeHtml(spec.skuCode || '-') + '</td>' +
        '<td>' + escapeHtml(spec.specName || '-') + '</td>' +
        '<td>' +
        '  <button type="button" class="mkt-newcomer-zone-spec-img" data-action="edit-spec-img" data-spec-index="' + i + '" title="点击更换规格图片">' +
        '    <img src="' + escapeHtml(skuImg) + '" alt="" onerror="this.onerror=null;this.src=\'../user-app/assets/restock/product-leaf.svg\'">' +
        '    <span>更换</span>' +
        '  </button>' +
        '</td>' +
        '<td>' + formatMoney(spec.purchasePrice) + '</td>' +
        '<td><input type="number" min="0" step="0.01" data-field="linePrice" placeholder="选填" value="' +
        escapeHtml(lineVal) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td><input type="number" min="0" step="1" data-field="stock" value="' +
        escapeHtml(String(spec.stock != null ? spec.stock : 0)) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td><input type="number" min="0" step="0.01" data-field="salePrice" value="' +
        escapeHtml(salePriceVal) + '"' + (enabled ? '' : ' disabled') + '></td>' +
        '<td>' + escapeHtml(String(spec.soldQty != null ? spec.soldQty : 0)) + '</td>' +
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
    var enabledCount = specs.filter(function (s) { return s.saleEnabled; }).length;
    if (metaEl) {
      metaEl.textContent =
        (item.code || '') + ' · ' + (item.category || '-') +
        ' · 选品库 ' + specs.length + ' 个规格 · 已开启售卖 ' + enabledCount + ' 个';
    }

    setRadio('mallFormStatus', item.status === 'schedule' ? 'schedule' : (item.status === 'on_shelf' ? 'on_shelf' : 'off_shelf'));
    var onEl = document.getElementById('mallFormScheduleOn');
    var offEl = document.getElementById('mallFormScheduleOff');
    if (onEl) onEl.value = toDatetimeLocal(item.scheduleOnAt);
    if (offEl) offEl.value = toDatetimeLocal(item.scheduleOffAt);
    syncStatusUi();

    setRadio('mallFormDeliveryMode', item.deliveryMode === 'express' ? 'express' : 'platform');

    setRadio('mallFormSaleScope', item.saleScope === 'region' || item.saleScope === 'store' ? item.saleScope : 'all');
    syncSaleScopeUi();

    var portScope = item.salePortScope === 'custom' ? 'custom' : 'all';
    setRadio('mallFormPortScope', portScope);
    setSalePorts(item.salePorts);
    syncPortScopeUi();

    renderSpecRows(specs);

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

    var nextSpecs = [];
    var enabledCount = 0;
    var invalid = false;

    document.querySelectorAll('#mallFormSpecBody tr').forEach(function (tr, i) {
      var src = specs[i] || {};
      var enabled = !!(tr.querySelector('[data-field="saleEnabled"]') || {}).checked;
      var stockVal = Number((tr.querySelector('[data-field="stock"]') || {}).value);
      var salePriceRaw = ((tr.querySelector('[data-field="salePrice"]') || {}).value || '').trim();
      var salePriceVal = Number(salePriceRaw);
      var lineRaw = ((tr.querySelector('[data-field="linePrice"]') || {}).value || '').trim();
      var linePrice = null;
      if (lineRaw !== '') {
        var lp = Number(lineRaw);
        if (isNaN(lp) || lp < 0) invalid = true;
        else linePrice = Math.round(lp * 100) / 100;
      }

      if (enabled) {
        enabledCount += 1;
        if (salePriceRaw === '' || isNaN(salePriceVal) || salePriceVal < 0) invalid = true;
        if (isNaN(stockVal) || stockVal < 0) invalid = true;
      }

      nextSpecs.push({
        skuCode: src.skuCode,
        specName: src.specName,
        skuImg: src.skuImg || '',
        purchasePrice: src.purchasePrice,
        linePrice: linePrice,
        stock: isNaN(stockVal) ? (src.stock || 0) : Math.max(0, Math.round(stockVal)),
        minSaleQty: 1,
        saleEnabled: enabled,
        salePrice: enabled ? Math.round(salePriceVal * 100) / 100 : Math.max(0, Math.round(salePriceVal * 100) / 100 || 0),
        soldQty: src.soldQty || 0
      });
    });

    if (!enabledCount) {
      toast('请至少开启一个规格的售卖', 'warning');
      return null;
    }
    if (invalid) {
      toast('请完善已开启规格的活动价（≥0）、划线价与库存', 'warning');
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
      memberLevelIds: [],
      /* C 端固定：每人 1 件且仅购一次，B 端不再配置限购 */
      limitType: 'none',
      limitPerOrder: null,
      limitPerDay: null,
      limitTotal: null,
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
    document.querySelectorAll('input[name="mallFormSaleScope"]').forEach(function (el) {
      el.addEventListener('change', syncSaleScopeUi);
    });
    document.querySelectorAll('input[name="mallFormPortScope"]').forEach(function (el) {
      el.addEventListener('change', syncPortScopeUi);
    });

    var specBody = document.getElementById('mallFormSpecBody');
    var specImageInput = document.getElementById('mallFormSpecImageInput');
    var pendingSpecImgIndex = -1;
    if (specBody) {
      specBody.addEventListener('change', function (e) {
        var tr = e.target.closest('tr');
        if (!tr) return;
        if (e.target.getAttribute('data-field') === 'saleEnabled') {
          syncSpecRowControls(tr);
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
        window.location.href = 'mdm_marketing_newcomer_zone.html';
      });
    }

    var saveBtn = document.getElementById('mallFormSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var data = readForm();
        if (!data || !window.MdmNewcomerZoneStore) return;
        window.MdmNewcomerZoneStore.upsert(data);
        toast('新人专区商品已保存', 'success');
        setTimeout(function () {
          window.location.href = 'mdm_marketing_newcomer_zone.html';
        }, 400);
      });
    }
  }

  function init() {
    var code = queryCode();
    if (!window.MdmNewcomerZoneStore) {
      showLoadError('新人专区商品数据未加载，请返回列表重试');
      return;
    }
    if (!code) {
      showLoadError('缺少商品编码，请从新人专区列表点击「编辑」进入');
      return;
    }

    var item = window.MdmNewcomerZoneStore.getByCode(code);
    if (!item) {
      showLoadError('未找到新人专区商品（' + code + '），请返回列表重试');
      return;
    }

    try {
      sessionStorage.removeItem('mdm_newcomer_zone_edit_code');
    } catch (e) { /* ignore */ }

    try {
      if (typeof window.MdmNewcomerZoneStore.mergeWithCatalogSpecs === 'function') {
        item = window.MdmNewcomerZoneStore.mergeWithCatalogSpecs(item);
      }
    } catch (err) {
      console.warn('[newcomer-zone-form] mergeWithCatalogSpecs failed', err);
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
