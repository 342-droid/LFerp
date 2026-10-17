/**
 * 主数据 · 供应商档案：查询、新增、编辑、停用/启用、删除
 */
(function () {
  var store = window.MasterDataSupplierStore;
  var SUPPLIERS = store ? store.all() : [];
  var SUPPLIER_TYPES = ['品牌商', '代理商', '个人'];

  var state = {
    query: { name: '', status: '' },
    page: 1,
    pageSize: 20,
    editingId: null
  };

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function supplierStatus(item) {
    return item && item.status === 'disabled' ? 'disabled' : 'active';
  }

  function statusLabel(item) {
    return supplierStatus(item) === 'disabled' ? '停用' : '启用';
  }

  function visibleSuppliers() {
    var query = state.query || {};
    return SUPPLIERS.filter(function (item) {
      if (query.name && String(item.name || '').toLowerCase().indexOf(query.name.toLowerCase()) < 0) return false;
      if (query.status && supplierStatus(item) !== query.status) return false;
      return true;
    });
  }

  function totalPagesOf(total) {
    return Math.max(1, Math.ceil(total / state.pageSize) || 1);
  }

  function clampPage(total) {
    var pages = totalPagesOf(total);
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
  }

  function renderTable(list) {
    var body = document.getElementById('supplierTableBody');
    if (!body) return;
    if (!list.length) {
      var emptyText = state.query.name || state.query.status ? '暂无符合条件的供应商' : '暂无供应商';
      body.innerHTML = '<tr><td class="mdb-table-empty" colspan="11">' + emptyText + '</td></tr>';
      return;
    }
    var start = (state.page - 1) * state.pageSize;
    body.innerHTML = list.slice(start, start + state.pageSize).map(function (item) {
      var action = supplierStatus(item) === 'disabled' ? '启用' : '停用';
      return '<tr>' +
        '<td>' + escapeHtml(item.code) + '</td>' +
        '<td>' + escapeHtml(item.name) + '</td>' +
        '<td>' + escapeHtml(item.type) + '</td>' +
        '<td>' + escapeHtml(item.bizContact) + '</td>' +
        '<td>' + escapeHtml(item.bizPhone) + '</td>' +
        '<td>' + escapeHtml(item.warehouseContact) + '</td>' +
        '<td>' + escapeHtml(item.warehousePhone) + '</td>' +
        '<td>' + escapeHtml(item.region) + '</td>' +
        '<td>' + escapeHtml(item.detailAddress) + '</td>' +
        '<td><span class="mdb-status mdb-status--' + supplierStatus(item) + '">' + statusLabel(item) + '</span></td>' +
        '<td class="mdb-table__op"><div class="mdb-table__ops">' +
        '<button type="button" class="mdb-op-btn" data-supplier-edit="' + item.id + '">编辑</button>' +
        '<button type="button" class="mdb-op-btn" data-supplier-status="' + item.id + '">' + action + '</button>' +
        '<button type="button" class="mdb-op-btn mdb-op-btn--danger" data-supplier-delete="' + item.id + '">删除</button>' +
        '</div></td></tr>';
    }).join('');
  }

  function renderPagination(total) {
    var totalEl = document.getElementById('supplierPaginationTotal');
    var pagesEl = document.getElementById('supplierPaginationPages');
    var gotoEl = document.getElementById('supplierPageGoto');
    var sizeEl = document.getElementById('supplierPageSize');
    var totalPages = totalPagesOf(total);
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(state.page);
    if (sizeEl && String(sizeEl.value) !== String(state.pageSize)) sizeEl.value = String(state.pageSize);
    if (!pagesEl) return;
    var page = state.page;
    var html = '<button type="button" class="product-pagination__btn" data-supplier-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';
    for (var i = 1; i <= totalPages; i += 1) {
      html += '<button type="button" class="product-pagination__btn' + (i === page ? ' is-active' : '') + '" data-supplier-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="product-pagination__btn" data-supplier-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function renderPage() {
    var list = visibleSuppliers();
    clampPage(list.length);
    renderTable(list);
    renderPagination(list.length);
  }

  function findSupplier(id) {
    for (var i = 0; i < SUPPLIERS.length; i += 1) {
      if (SUPPLIERS[i].id === id) return SUPPLIERS[i];
    }
    return null;
  }

  function codeTaken(code, exceptId) {
    return SUPPLIERS.some(function (item) {
      return item.id !== exceptId && item.code === code;
    });
  }

  function nameTaken(name, exceptId) {
    return SUPPLIERS.some(function (item) {
      return item.id !== exceptId && item.name === name;
    });
  }

  function typeOptions(current) {
    var html = '<option value="">请选择</option>';
    SUPPLIER_TYPES.forEach(function (type) {
      html += '<option value="' + escapeHtml(type) + '"' + (type === current ? ' selected' : '') + '>' + escapeHtml(type) + '</option>';
    });
    return html;
  }

  function closeModal() {
    var modal = document.querySelector('[data-supplier-modal]');
    if (modal) modal.remove();
    state.editingId = null;
  }

  function regionTree() {
    return (window.MdmStoreRegionCascader && window.MdmStoreRegionCascader.REGION_TREE) || {};
  }

  function setSelectOptions(select, values, current, placeholder) {
    if (!select) return;
    var html = '<option value="">' + escapeHtml(placeholder) + '</option>';
    values.forEach(function (value) {
      html += '<option value="' + escapeHtml(value) + '"' + (value === current ? ' selected' : '') + '>' + escapeHtml(value) + '</option>';
    });
    select.innerHTML = html;
  }

  function bindRegion(item) {
    var tree = regionTree();
    var parts = String(item && item.region || '').split('/').map(function (part) { return part.trim(); });
    var provinceEl = document.getElementById('supplierFormProvince');
    var cityEl = document.getElementById('supplierFormCity');
    var districtEl = document.getElementById('supplierFormDistrict');
    function fillCities(province, city) {
      var cities = province && tree[province] ? Object.keys(tree[province]) : [];
      setSelectOptions(cityEl, cities, city, '市');
    }
    function fillDistricts(province, city, district) {
      var districts = province && city && tree[province] && tree[province][city] ? tree[province][city] : [];
      setSelectOptions(districtEl, districts, district, '区');
    }
    setSelectOptions(provinceEl, Object.keys(tree), parts[0] || '', '省');
    fillCities(parts[0] || '', parts[1] || '');
    fillDistricts(parts[0] || '', parts[1] || '', parts[2] || '');
    provinceEl.addEventListener('change', function () {
      fillCities(provinceEl.value, '');
      fillDistricts(provinceEl.value, '', '');
    });
    cityEl.addEventListener('change', function () {
      fillDistricts(provinceEl.value, cityEl.value, '');
    });
  }

  function openForm(item) {
    closeModal();
    state.editingId = item ? item.id : null;
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-category-modal-backdrop';
    backdrop.setAttribute('data-supplier-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal mdb-modal mdb-supplier-modal" role="dialog" aria-modal="true">' +
      '<div class="erp-modal__header"><h2 class="erp-modal__title">' + (item ? '编辑供应商' : '新增供应商') + '</h2>' +
      '<div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-supplier-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="mdb-form">' +
      '<label class="mdb-field"><span><i>*</i>供应商编码</span><input id="supplierFormCode" type="text" maxlength="20" placeholder="请输入供应商编码" value="' + escapeHtml(item ? item.code : '') + '"></label>' +
      '<label class="mdb-field"><span><i>*</i>供应商名称</span><input id="supplierFormName" type="text" maxlength="40" placeholder="请输入供应商名称" value="' + escapeHtml(item ? item.name : '') + '"></label>' +
      '<label class="mdb-field"><span><i>*</i>供应商类型</span><select id="supplierFormType">' + typeOptions(item ? item.type : '') + '</select></label>' +
      '<label class="mdb-field"><span><i>*</i>业务联系人</span><input id="supplierFormBizContact" type="text" maxlength="20" placeholder="请输入业务联系人" value="' + escapeHtml(item ? item.bizContact : '') + '"></label>' +
      '<label class="mdb-field"><span><i>*</i>业务联系电话</span><input id="supplierFormBizPhone" type="text" maxlength="11" inputmode="numeric" placeholder="请输入11位手机号" value="' + escapeHtml(item ? item.bizPhone : '') + '"></label>' +
      '<label class="mdb-field"><span><i>*</i>仓库联系人</span><input id="supplierFormWarehouseContact" type="text" maxlength="20" placeholder="请输入仓库联系人" value="' + escapeHtml(item ? item.warehouseContact : '') + '"></label>' +
      '<label class="mdb-field"><span><i>*</i>仓库联系电话</span><input id="supplierFormWarehousePhone" type="text" maxlength="11" inputmode="numeric" placeholder="请输入11位手机号" value="' + escapeHtml(item ? item.warehousePhone : '') + '"></label>' +
      '<label class="mdb-field"><span><i>*</i>省市区</span><span class="mdb-region">' +
      '<select id="supplierFormProvince" aria-label="省"></select>' +
      '<select id="supplierFormCity" aria-label="市"></select>' +
      '<select id="supplierFormDistrict" aria-label="区"></select>' +
      '</span></label>' +
      '<label class="mdb-field"><span><i>*</i>详细地址</span><input id="supplierFormDetail" type="text" maxlength="80" placeholder="请输入详细地址" value="' + escapeHtml(item ? item.detailAddress : '') + '"></label>' +
      '</div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-supplier-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-supplier-save>确定</button></div></div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-supplier-close], [data-supplier-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    backdrop.querySelector('[data-supplier-save]').addEventListener('click', saveSupplier);
    document.body.appendChild(backdrop);
    bindRegion(item);
    var input = document.getElementById('supplierFormCode');
    if (input) input.focus();
  }

  function readForm() {
    function valueOf(id) {
      var el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    }
    var province = valueOf('supplierFormProvince');
    var city = valueOf('supplierFormCity');
    var district = valueOf('supplierFormDistrict');
    return {
      code: valueOf('supplierFormCode'),
      name: valueOf('supplierFormName'),
      type: valueOf('supplierFormType'),
      bizContact: valueOf('supplierFormBizContact'),
      bizPhone: valueOf('supplierFormBizPhone'),
      warehouseContact: valueOf('supplierFormWarehouseContact'),
      warehousePhone: valueOf('supplierFormWarehousePhone'),
      region: province && city && district ? province + ' / ' + city + ' / ' + district : '',
      detailAddress: valueOf('supplierFormDetail')
    };
  }

  function saveSupplier() {
    var form = readForm();
    if (!form.code) {
      if (typeof showToast === 'function') showToast('请输入供应商编码', 'warning');
      return;
    }
    if (codeTaken(form.code, state.editingId)) {
      if (typeof showToast === 'function') showToast('供应商编码已存在', 'warning');
      return;
    }
    if (!form.name) {
      if (typeof showToast === 'function') showToast('请输入供应商名称', 'warning');
      return;
    }
    if (nameTaken(form.name, state.editingId)) {
      if (typeof showToast === 'function') showToast('供应商名称已存在', 'warning');
      return;
    }
    if (!form.type) {
      if (typeof showToast === 'function') showToast('请选择供应商类型', 'warning');
      return;
    }
    if (!form.bizContact) {
      if (typeof showToast === 'function') showToast('请输入业务联系人', 'warning');
      return;
    }
    if (!/^1\d{10}$/.test(form.bizPhone)) {
      if (typeof showToast === 'function') showToast('请输入11位业务联系电话', 'warning');
      return;
    }
    if (!form.warehouseContact) {
      if (typeof showToast === 'function') showToast('请输入仓库联系人', 'warning');
      return;
    }
    if (!/^1\d{10}$/.test(form.warehousePhone)) {
      if (typeof showToast === 'function') showToast('请输入11位仓库联系电话', 'warning');
      return;
    }
    if (!form.region) {
      if (typeof showToast === 'function') showToast('请选择省市区', 'warning');
      return;
    }
    if (!form.detailAddress) {
      if (typeof showToast === 'function') showToast('请输入详细地址', 'warning');
      return;
    }
    if (state.editingId) {
      var current = findSupplier(state.editingId);
      if (!current) return;
      current.code = form.code;
      current.name = form.name;
      current.type = form.type;
      current.bizContact = form.bizContact;
      current.bizPhone = form.bizPhone;
      current.warehouseContact = form.warehouseContact;
      current.warehousePhone = form.warehousePhone;
      current.region = form.region;
      current.detailAddress = form.detailAddress;
      if (store) store.save();
      closeModal();
      renderPage();
      if (typeof showToast === 'function') showToast('供应商已更新', 'success');
      return;
    }
    SUPPLIERS.push({
      id: store ? store.nextId() : ('s' + (SUPPLIERS.length + 1)),
      code: form.code,
      name: form.name,
      type: form.type,
      bizContact: form.bizContact,
      bizPhone: form.bizPhone,
      warehouseContact: form.warehouseContact,
      warehousePhone: form.warehousePhone,
      region: form.region,
      detailAddress: form.detailAddress,
      status: 'active'
    });
    if (store) store.save();
    closeModal();
    state.page = totalPagesOf(visibleSuppliers().length);
    renderPage();
    if (typeof showToast === 'function') showToast('供应商已创建', 'success');
  }

  function toggleStatus(id) {
    var item = findSupplier(id);
    if (!item) return;
    var disabling = supplierStatus(item) !== 'disabled';
    item.status = disabling ? 'disabled' : 'active';
    if (store) store.save();
    renderPage();
    if (typeof showToast === 'function') showToast(disabling ? '供应商已停用' : '供应商已启用', 'success');
  }

  function openWarmConfirm(message, onConfirm) {
    var existing = document.querySelector('[data-product-warm-confirm]');
    if (existing) existing.remove();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-product-warm-confirm', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm"><div class="erp-modal__header"><h2 class="erp-modal__title">温馨提示</h2><div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button></div></div>' +
      '<div class="erp-modal__body"><div class="erp-modal-confirm__row"><div class="erp-modal-confirm__icon">!</div><div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div></div></div>' +
      '<div class="erp-modal__footer"><button type="button" class="erp-btn" data-warm-cancel>取消</button><button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button></div></div>';
    function closeWarm() { backdrop.remove(); }
    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeWarm(); });
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeWarm);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      closeWarm();
      if (onConfirm) onConfirm();
    });
    document.body.appendChild(backdrop);
  }

  function deleteSupplier(id) {
    var item = findSupplier(id);
    if (!item) return;
    openWarmConfirm('确定删除供应商「' + item.name + '」？', function () {
      var index = SUPPLIERS.indexOf(item);
      if (index >= 0) SUPPLIERS.splice(index, 1);
      if (store) store.save();
      renderPage();
      if (typeof showToast === 'function') showToast('供应商已删除', 'success');
    });
  }

  function readQuery() {
    var nameEl = document.getElementById('supplierQueryName');
    var statusEl = document.getElementById('supplierQueryStatus');
    return {
      name: nameEl ? String(nameEl.value || '').trim() : '',
      status: statusEl ? String(statusEl.value || '') : ''
    };
  }

  function bindEvents() {
    var form = document.getElementById('supplierQueryForm');
    if (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        state.query = readQuery();
        state.page = 1;
        renderPage();
      });
    }
    var resetBtn = document.getElementById('supplierQueryReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var nameEl = document.getElementById('supplierQueryName');
        var statusEl = document.getElementById('supplierQueryStatus');
        if (nameEl) nameEl.value = '';
        if (statusEl) statusEl.value = '';
        state.query = { name: '', status: '' };
        state.page = 1;
        renderPage();
      });
    }
    var addBtn = document.getElementById('supplierAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });
    var table = document.getElementById('supplierTableBody');
    if (table) {
      table.addEventListener('click', function (ev) {
        var editBtn = ev.target.closest('[data-supplier-edit]');
        if (editBtn) {
          openForm(findSupplier(editBtn.getAttribute('data-supplier-edit')));
          return;
        }
        var statusBtn = ev.target.closest('[data-supplier-status]');
        if (statusBtn) {
          toggleStatus(statusBtn.getAttribute('data-supplier-status'));
          return;
        }
        var deleteBtn = ev.target.closest('[data-supplier-delete]');
        if (deleteBtn) deleteSupplier(deleteBtn.getAttribute('data-supplier-delete'));
      });
    }
    var pages = document.getElementById('supplierPaginationPages');
    if (pages) {
      pages.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-supplier-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-supplier-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderPage();
      });
    }
    var sizeEl = document.getElementById('supplierPageSize');
    if (sizeEl) {
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        state.page = 1;
        renderPage();
      });
    }
    var gotoEl = document.getElementById('supplierPageGoto');
    if (gotoEl) {
      gotoEl.addEventListener('change', function () {
        var total = visibleSuppliers().length;
        var max = totalPagesOf(total);
        var val = parseInt(gotoEl.value, 10);
        if (!val || val < 1) val = 1;
        if (val > max) val = max;
        state.page = val;
        renderPage();
      });
    }
  }

  function init() {
    bindEvents();
    renderPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
