/**
 * 会员 · 消费送积分规则表单
 */
(function () {
  'use strict';

  var Store = window.MdmMemberPointsConsumeStore;
  var Scope = window.MdmMemberPointsScope;
  if (!Store || !Scope) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var editingId = '';
  var saleExtra = {
    saleRegions: {},
    saleRegionSummary: [],
    saleStores: {}
  };
  var productScopeCtrl = null;

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
    else window.alert(msg);
  }

  function queryId() {
    var m = String(window.location.search || '').match(/[?&]id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cloneMap(map) {
    if (window.MdmProxyStorePicker && typeof window.MdmProxyStorePicker.cloneSelected === 'function') {
      return window.MdmProxyStorePicker.cloneSelected(map || {});
    }
    if (window.MdmProxyRegionPicker && typeof window.MdmProxyRegionPicker.cloneSelected === 'function') {
      return window.MdmProxyRegionPicker.cloneSelected(map || {});
    }
    return JSON.parse(JSON.stringify(map || {}));
  }

  function storeCount() {
    if (window.MdmProxyStorePicker && typeof window.MdmProxyStorePicker.count === 'function') {
      return window.MdmProxyStorePicker.count(saleExtra.saleStores);
    }
    return Object.keys(saleExtra.saleStores || {}).length;
  }

  function getRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function setRadio(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
      el.checked = el.value === value;
    });
  }

  function syncPortUi() {
    var scope = getRadio('consumePortScope') || 'all';
    var list = document.getElementById('consumePortList');
    if (list) list.hidden = scope !== 'custom';
  }

  function renderSaleRegionTags() {
    var list = saleExtra.saleRegionSummary || [];
    return list.map(function (item) {
      return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label || item.id || '') + '</span>';
    }).join('');
  }

  function syncSaleScopeUi() {
    var scope = getRadio('consumeSaleScope') || 'all';
    var regionPanel = document.getElementById('consumeSaleScopeRegion');
    var storePanel = document.getElementById('consumeSaleScopeStore');
    if (regionPanel) regionPanel.hidden = scope !== 'region';
    if (storePanel) storePanel.hidden = scope !== 'store';
    var tagsEl = document.getElementById('consumeSaleScopeTags');
    if (tagsEl) tagsEl.innerHTML = renderSaleRegionTags();
    var countEl = document.getElementById('consumeSaleScopeStoreCount');
    if (countEl) {
      var n = storeCount();
      countEl.hidden = scope !== 'store' || !n;
      countEl.textContent = '已选择 ' + n + ' 个门店';
    }
  }

  function readPorts() {
    if (getRadio('consumePortScope') !== 'custom') return [];
    var ports = [];
    document.querySelectorAll('#consumePortList input[data-port]').forEach(function (el) {
      if (el.checked) ports.push(el.getAttribute('data-port'));
    });
    return ports;
  }

  function setPorts(ports) {
    var selected = Array.isArray(ports) ? ports : [];
    document.querySelectorAll('#consumePortList input[data-port]').forEach(function (el) {
      el.checked = selected.indexOf(el.getAttribute('data-port')) >= 0;
    });
  }

  function round2(n) {
    return Math.round(Number(n) * 100) / 100;
  }

  function resolveSaleScope(item) {
    if (item.saleScope === 'region' || item.saleScope === 'store' || item.saleScope === 'all') {
      return item.saleScope;
    }
    return item.storeScope === 'store' ? 'store' : 'all';
  }

  function applyItem(item) {
    document.getElementById('consumeName').value = item.name || '';
    document.getElementById('consumeEnabled').checked = item.enabled !== false;
    document.getElementById('consumeAmount').value = Number(item.amountPerPoint || 1).toFixed(2);
    setRadio('consumeLessThanOne', item.lessThanOne || 'count_one');
    setRadio('consumePortScope', item.portScope === 'custom' ? 'custom' : 'all');
    setPorts(item.ports || []);
    var saleScope = resolveSaleScope(item);
    setRadio('consumeSaleScope', saleScope);
    saleExtra.saleRegions = cloneMap(item.saleRegions || {});
    saleExtra.saleRegionSummary = Array.isArray(item.saleRegionSummary) ? item.saleRegionSummary.slice() : [];
    saleExtra.saleStores = cloneMap(item.saleStores || item.stores || {});
    if (productScopeCtrl) productScopeCtrl.setScope(item.productScope || { type: 'all' });
    syncPortUi();
    syncSaleScopeUi();
  }

  function readForm() {
    var saleScope = getRadio('consumeSaleScope') || 'all';
    return {
      id: editingId || '',
      name: String(document.getElementById('consumeName').value || '').trim(),
      enabled: document.getElementById('consumeEnabled').checked,
      amountPerPoint: Number(document.getElementById('consumeAmount').value),
      lessThanOne: getRadio('consumeLessThanOne') || 'count_one',
      portScope: getRadio('consumePortScope') || 'all',
      ports: readPorts(),
      saleScope: saleScope,
      saleRegions: saleScope === 'region' ? cloneMap(saleExtra.saleRegions) : {},
      saleRegionSummary: saleScope === 'region' ? (saleExtra.saleRegionSummary || []).slice() : [],
      saleStores: saleScope === 'store' ? cloneMap(saleExtra.saleStores) : {},
      productScope: productScopeCtrl ? productScopeCtrl.getScope() : { type: 'all', products: [], categories: [] }
    };
  }

  function validate(item) {
    if (!item.name) return '请填写规则名称';
    if (!(item.amountPerPoint > 0)) return '请填写消费送积分金额门槛（大于 0）';
    if (['count_one', 'ignore', 'round'].indexOf(item.lessThanOne) < 0) {
      return '请选择积分不足1时的处理方式';
    }
    if (item.portScope === 'custom' && !(item.ports && item.ports.length)) return '请至少选择一个适用端口';
    if (item.saleScope === 'region' && !(item.saleRegionSummary && item.saleRegionSummary.length)) {
      return '请选择售卖区域';
    }
    if (item.saleScope === 'store' && !storeCount()) return '请选择售卖门店';
    if (productScopeCtrl) {
      var err = productScopeCtrl.validate();
      if (err) return err;
    }
    return '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    editingId = queryId();
    var tab = document.getElementById('consumeFormTabTitle');
    if (tab) tab.textContent = editingId ? '编辑消费送积分' : '新增消费送积分';

    productScopeCtrl = Scope.createScopeController({
      radioName: 'consumeProductScope',
      chipsEl: document.getElementById('consumeScopeChips'),
      emptyEl: document.getElementById('consumeScopeEmpty'),
      pickWrap: document.getElementById('consumeScopePickWrap'),
      pickBtn: document.getElementById('consumeScopePickBtn'),
      hintEl: document.getElementById('consumeScopePickHint'),
      initial: { type: 'all' }
    });

    document.querySelectorAll('input[name="consumePortScope"]').forEach(function (el) {
      el.addEventListener('change', syncPortUi);
    });
    document.querySelectorAll('input[name="consumeSaleScope"]').forEach(function (el) {
      el.addEventListener('change', syncSaleScopeUi);
    });

    var regionPickBtn = document.getElementById('consumeSaleScopePickBtn');
    if (regionPickBtn) {
      regionPickBtn.addEventListener('click', function () {
        if (!window.MdmProxyRegionPicker) {
          toast('区域选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyRegionPicker.open({
          selected: saleExtra.saleRegions,
          onConfirm: function (selected, summary) {
            saleExtra.saleRegions = cloneMap(selected);
            saleExtra.saleRegionSummary = Array.isArray(summary) ? summary : [];
            if (window.MdmProxyRegionPicker.summarize && !saleExtra.saleRegionSummary.length) {
              saleExtra.saleRegionSummary = window.MdmProxyRegionPicker.summarize(saleExtra.saleRegions);
            }
            syncSaleScopeUi();
          }
        });
      });
    }

    var storePickBtn = document.getElementById('consumeSaleScopeStorePickBtn');
    if (storePickBtn) {
      storePickBtn.addEventListener('click', function () {
        if (!window.MdmProxyStorePicker) {
          toast('门店选择组件未加载', 'warning');
          return;
        }
        window.MdmProxyStorePicker.open({
          selected: saleExtra.saleStores,
          onConfirm: function (selected) {
            saleExtra.saleStores = cloneMap(selected);
            syncSaleScopeUi();
          }
        });
      });
    }

    var amountEl = document.getElementById('consumeAmount');
    if (amountEl) {
      amountEl.addEventListener('blur', function () {
        var n = Number(amountEl.value);
        if (!isNaN(n) && n > 0) amountEl.value = round2(n).toFixed(2);
      });
    }

    document.getElementById('btnConsumeCancel').addEventListener('click', function () {
      window.location.href = wp.page('mdm_member_points_consume.html');
    });

    document.getElementById('btnConsumeSave').addEventListener('click', function () {
      var item = readForm();
      item.amountPerPoint = round2(item.amountPerPoint);
      var err = validate(item);
      if (err) {
        toast(err, 'warning');
        return;
      }
      Store.save(item);
      toast('消费送积分规则已保存');
      window.location.href = wp.page('mdm_member_points_consume.html');
    });

    if (editingId) {
      var found = Store.getById(editingId);
      if (found) applyItem(found);
      else toast('未找到该规则，将作为新增保存', 'warning');
    } else {
      applyItem({
        name: '',
        enabled: true,
        amountPerPoint: 1,
        lessThanOne: 'count_one',
        portScope: 'all',
        ports: [],
        saleScope: 'all',
        saleRegions: {},
        saleRegionSummary: [],
        saleStores: {},
        productScope: { type: 'all', products: [], categories: [] }
      });
    }
  });
})();
