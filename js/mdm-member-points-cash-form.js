/**
 * 会员 · 积分抵现规则表单
 */
(function () {
  'use strict';

  var Store = window.MdmMemberPointsCashStore;
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
    var scope = getRadio('cashPortScope') || 'all';
    var list = document.getElementById('cashPortList');
    if (list) list.hidden = scope !== 'custom';
  }

  function renderSaleRegionTags() {
    var list = saleExtra.saleRegionSummary || [];
    return list.map(function (item) {
      return '<span class="product-proxy-sale-scope__tag">' + escapeHtml(item.label || item.id || '') + '</span>';
    }).join('');
  }

  function syncSaleScopeUi() {
    var scope = getRadio('cashSaleScope') || 'all';
    var regionPanel = document.getElementById('cashSaleScopeRegion');
    var storePanel = document.getElementById('cashSaleScopeStore');
    if (regionPanel) regionPanel.hidden = scope !== 'region';
    if (storePanel) storePanel.hidden = scope !== 'store';
    var tagsEl = document.getElementById('cashSaleScopeTags');
    if (tagsEl) tagsEl.innerHTML = renderSaleRegionTags();
    var countEl = document.getElementById('cashSaleScopeStoreCount');
    if (countEl) {
      var n = storeCount();
      countEl.hidden = scope !== 'store' || !n;
      countEl.textContent = '已选择 ' + n + ' 个门店';
    }
  }

  function readPorts() {
    if (getRadio('cashPortScope') !== 'custom') return [];
    var ports = [];
    document.querySelectorAll('#cashPortList input[data-port]').forEach(function (el) {
      if (el.checked) ports.push(el.getAttribute('data-port'));
    });
    return ports;
  }

  function setPorts(ports) {
    var selected = Array.isArray(ports) ? ports : [];
    document.querySelectorAll('#cashPortList input[data-port]').forEach(function (el) {
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
    document.getElementById('cashName').value = item.name || '';
    document.getElementById('cashEnabled').checked = item.enabled !== false;
    document.getElementById('cashPerPoint').value = Number(item.perPointAmount || 0.01).toFixed(2);
    document.getElementById('cashMaxRatio').value = item.maxRatio || 50;
    document.getElementById('cashMaxAmount').value = Number(item.maxAmount || 100).toFixed(2);
    setRadio('cashPortScope', item.portScope === 'custom' ? 'custom' : 'all');
    setPorts(item.ports || []);
    var saleScope = resolveSaleScope(item);
    setRadio('cashSaleScope', saleScope);
    saleExtra.saleRegions = cloneMap(item.saleRegions || {});
    saleExtra.saleRegionSummary = Array.isArray(item.saleRegionSummary) ? item.saleRegionSummary.slice() : [];
    saleExtra.saleStores = cloneMap(item.saleStores || item.stores || {});
    if (productScopeCtrl) productScopeCtrl.setScope(item.productScope || { type: 'all' });
    syncPortUi();
    syncSaleScopeUi();
  }

  function readForm() {
    var saleScope = getRadio('cashSaleScope') || 'all';
    return {
      id: editingId || '',
      name: String(document.getElementById('cashName').value || '').trim(),
      enabled: document.getElementById('cashEnabled').checked,
      perPointAmount: Number(document.getElementById('cashPerPoint').value),
      maxRatio: Number(document.getElementById('cashMaxRatio').value),
      maxAmount: Number(document.getElementById('cashMaxAmount').value),
      portScope: getRadio('cashPortScope') || 'all',
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
    if (!(item.perPointAmount > 0)) return '请填写每 1 积分可抵扣金额（大于 0，保留 2 位小数）';
    if (!(item.maxRatio >= 1 && item.maxRatio <= 100) || !Number.isInteger(item.maxRatio)) {
      return '每笔订单最大可抵扣比例须为 1~100 的整数';
    }
    if (!(item.maxAmount > 0)) return '请填写最大可抵扣金额（大于 0）';
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
    var tab = document.getElementById('cashFormTabTitle');
    if (tab) tab.textContent = editingId ? '编辑积分抵现' : '新增积分抵现';

    productScopeCtrl = Scope.createScopeController({
      radioName: 'cashProductScope',
      chipsEl: document.getElementById('cashScopeChips'),
      emptyEl: document.getElementById('cashScopeEmpty'),
      pickWrap: document.getElementById('cashScopePickWrap'),
      pickBtn: document.getElementById('cashScopePickBtn'),
      hintEl: document.getElementById('cashScopePickHint'),
      initial: { type: 'all' }
    });

    document.querySelectorAll('input[name="cashPortScope"]').forEach(function (el) {
      el.addEventListener('change', syncPortUi);
    });
    document.querySelectorAll('input[name="cashSaleScope"]').forEach(function (el) {
      el.addEventListener('change', syncSaleScopeUi);
    });

    var regionPickBtn = document.getElementById('cashSaleScopePickBtn');
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

    var storePickBtn = document.getElementById('cashSaleScopeStorePickBtn');
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

    ['cashPerPoint', 'cashMaxAmount'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () {
        var n = Number(el.value);
        if (!isNaN(n) && n > 0) el.value = round2(n).toFixed(2);
      });
    });

    document.getElementById('btnCashCancel').addEventListener('click', function () {
      window.location.href = wp.page('mdm_member_points_cash.html');
    });

    document.getElementById('btnCashSave').addEventListener('click', function () {
      var item = readForm();
      item.perPointAmount = round2(item.perPointAmount);
      item.maxRatio = Math.floor(Number(item.maxRatio));
      item.maxAmount = round2(item.maxAmount);
      var err = validate(item);
      if (err) {
        toast(err, 'warning');
        return;
      }
      Store.save(item);
      toast('积分抵现规则已保存');
      window.location.href = wp.page('mdm_member_points_cash.html');
    });

    if (editingId) {
      var found = Store.getById(editingId);
      if (found) applyItem(found);
      else toast('未找到该规则，将作为新增保存', 'warning');
    } else {
      applyItem({
        name: '',
        enabled: true,
        perPointAmount: 0.01,
        maxRatio: 50,
        maxAmount: 100,
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
