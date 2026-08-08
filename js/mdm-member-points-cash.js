/**
 * 会员 · 积分抵现规则列表
 */
(function () {
  'use strict';

  var Store = window.MdmMemberPointsCashStore;
  var Scope = window.MdmMemberPointsScope;
  var Filter = window.MdmMemberPointsRuleListFilter;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var saleFilterCtrl = null;

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    if (Scope && Scope.escapeHtml) return Scope.escapeHtml(str);
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formHref(id) {
    var base = wp.page('mdm_member_points_cash_form.html');
    if (!id) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'id=' + encodeURIComponent(id);
  }

  function readFilter() {
    var sale = saleFilterCtrl ? saleFilterCtrl.getState() : {};
    return {
      name: (document.getElementById('qCashName') || {}).value || '',
      port: (document.getElementById('qCashPort') || {}).value || '',
      saleScopeType: sale.type || '',
      storeId: sale.storeId || '',
      regions: sale.regions || {},
      regionId: sale.regionId || '',
      regionParts: sale.regionParts || {},
      product: (document.getElementById('qCashProduct') || {}).value || '',
      status: (document.getElementById('qCashStatus') || {}).value || ''
    };
  }

  function matchFilter(item, f) {
    var nameKw = String(f.name || '').trim().toLowerCase();
    if (nameKw && String(item.name || '').toLowerCase().indexOf(nameKw) === -1) return false;
    if (f.status === 'enabled' && !item.enabled) return false;
    if (f.status === 'disabled' && item.enabled) return false;
    if (f.port) {
      if (item.portScope === 'custom' && (item.ports || []).indexOf(f.port) < 0) return false;
    }
    if (Filter && !Filter.matchSaleScopeFilter(item, {
      type: f.saleScopeType,
      storeId: f.storeId,
      regions: f.regions,
      regionId: f.regionId,
      regionParts: f.regionParts
    })) return false;
    if (Filter && !Filter.matchProductFilter(item, f.product)) return false;
    return true;
  }

  function ruleText(item) {
    var per = Number(item.perPointAmount);
    var ratio = Number(item.maxRatio);
    var maxAmt = Number(item.maxAmount);
    return (
      '1 积分抵 ' + (isNaN(per) ? '—' : per.toFixed(2)) + ' 元；' +
      '上限 ' + (isNaN(ratio) ? '—' : ratio) + '% / ' +
      (isNaN(maxAmt) ? '—' : maxAmt.toFixed(2)) + ' 元'
    );
  }

  function render() {
    var body = document.getElementById('cashTableBody');
    if (!body) return;
    var f = readFilter();
    var rows = Store.getAll().filter(function (it) {
      return matchFilter(it, f);
    });
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#999;padding:28px;">暂无规则</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (it) {
      var statusCls = it.enabled ? 'mdm-status mdm-status--ok' : 'mdm-status mdm-status--muted';
      var statusTxt = it.enabled ? '已启用' : '已禁用';
      var toggleTxt = it.enabled ? '禁用' : '启用';
      return (
        '<tr data-id="' + escapeHtml(it.id) + '">' +
        '<td>' + escapeHtml(it.id) + '</td>' +
        '<td>' + escapeHtml(it.name) + '</td>' +
        '<td>' + escapeHtml(ruleText(it)) + '</td>' +
        '<td>' + escapeHtml(Scope ? Scope.portsSummary(it.portScope, it.ports) : '—') + '</td>' +
        '<td>' + escapeHtml(Scope ? Scope.saleScopeSummary(it) : '—') + '</td>' +
        '<td>' + escapeHtml(Scope ? Scope.scopeSummary(it.productScope) : '—') + '</td>' +
        '<td><span class="' + statusCls + '">' + statusTxt + '</span></td>' +
        '<td>' + escapeHtml(it.updatedAt || '—') + '</td>' +
        '<td class="pts-rule-ops">' +
        '<a href="' + formHref(it.id) + '">编辑</a>' +
        '<a href="javascript:;" data-act="toggle">' + toggleTxt + '</a>' +
        '<a href="javascript:;" data-act="delete">删除</a>' +
        '</td>' +
        '</tr>'
      );
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (Filter && Filter.bindSaleScopeFilter) {
      saleFilterCtrl = Filter.bindSaleScopeFilter({
        typeSelect: document.getElementById('qCashSaleScope'),
        regionGroup: document.getElementById('qCashSaleRegionGroup'),
        regionMount: document.getElementById('qCashSaleRegionMount'),
        regionCascaderId: 'cashSaleRegionFilter',
        storeGroup: document.getElementById('qCashSaleStoreGroup'),
        storeInput: document.getElementById('qCashStore'),
        storeDropdown: document.getElementById('qCashStoreDropdown')
      });
    }

    var queryBtn = document.getElementById('cashFilterQuery');
    var resetBtn = document.getElementById('cashFilterReset');
    var addBtn = document.getElementById('cashAddBtn');
    var body = document.getElementById('cashTableBody');

    if (queryBtn) queryBtn.addEventListener('click', render);
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var form = document.getElementById('cashFilterForm');
        if (form) form.reset();
        if (saleFilterCtrl) saleFilterCtrl.reset();
        render();
      });
    }
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        window.location.href = formHref();
      });
    }
    if (body) {
      body.addEventListener('click', function (ev) {
        var link = ev.target.closest('[data-act]');
        if (!link) return;
        ev.preventDefault();
        var tr = link.closest('tr[data-id]');
        if (!tr) return;
        var id = tr.getAttribute('data-id');
        var act = link.getAttribute('data-act');
        if (act === 'toggle') {
          var item = Store.getById(id);
          if (!item) return;
          Store.setEnabled(id, !item.enabled);
          toast(item.enabled ? '已禁用' : '已启用');
          render();
          return;
        }
        if (act === 'delete') {
          if (!window.confirm('确认删除该积分抵现规则？')) return;
          Store.remove(id);
          toast('已删除');
          render();
        }
      });
    }

    if (typeof initClearButtons === 'function') initClearButtons();
    render();
  });
})();
