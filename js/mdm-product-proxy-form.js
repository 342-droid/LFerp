/**
 * 代采商品列表 — 添加/编辑表单（含可搜索三级类目）
 */
(function () {
  var pickerInstance = null;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function closeModal() {
    var modal = document.querySelector('[data-proxy-product-form]');
    if (modal) modal.remove();
    pickerInstance = null;
  }

  function openProxyProductForm(options) {
    var store = window.MdmProxyCategoryStore;
    if (!store) return;

    options = options || {};
    var isEdit = options.mode === 'edit';
    var product = options.product || {};
    var onSave = options.onSave;

    closeModal();

    var title = isEdit ? '编辑商品' : '添加商品';
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-proxy-form-backdrop';
    backdrop.setAttribute('data-proxy-product-form', '1');

    backdrop.innerHTML =
      '<div class="erp-modal product-proxy-form-modal">' +
      '  <div class="erp-modal__header"><h2 class="erp-modal__title">' + title + '</h2>' +
      '    <div class="erp-modal__header-actions"><button type="button" class="erp-modal__header-btn" data-form-close aria-label="关闭">&times;</button></div></div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="product-proxy-form__field"><label class="product-proxy-form__label" for="proxyFormName"><span class="product-proxy-form__req">*</span>商品名称</label>' +
      '      <input class="product-proxy-form__input" id="proxyFormName" type="text" value="' + escapeHtml(product.name || '') + '" placeholder="请输入商品名称"></div>' +
      '    <div class="product-proxy-form__field"><label class="product-proxy-form__label"><span class="product-proxy-form__req">*</span>商品类目</label>' +
      '      <div id="proxyFormCategoryPicker"></div>' +
      '      <p class="product-proxy-form__hint">仅可搜索并关联已上架的三级类目；下架类目不可选</p></div>' +
      '  </div>' +
      '  <div class="erp-modal__footer"><button type="button" class="erp-btn" data-form-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-form-save>保存</button></div></div>';

    backdrop.addEventListener('click', function (ev) { if (ev.target === backdrop) closeModal(); });
    backdrop.querySelectorAll('[data-form-close], [data-form-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    backdrop.querySelector('[data-form-save]').addEventListener('click', function () {
      var name = (document.getElementById('proxyFormName') || {}).value.trim();
      var l3Id = pickerInstance ? pickerInstance.getValue() : '';
      var path = pickerInstance ? pickerInstance.getPath() : '';

      if (!name) {
        if (typeof showToast === 'function') showToast('请输入商品名称', 'warning');
        return;
      }
      if (!l3Id || !store.isSelectableL3(l3Id)) {
        if (typeof showToast === 'function') showToast('请选择已上架的三级类目', 'warning');
        return;
      }

      var payload = {
        name: name,
        category_l3_id: l3Id,
        category_path: path,
        category: path
      };

      if (typeof onSave === 'function') onSave(payload, product);
      closeModal();
    });

    document.body.appendChild(backdrop);

    var pickerEl = document.getElementById('proxyFormCategoryPicker');
    if (pickerEl && window.MdmProxyCategoryPicker) {
      pickerInstance = window.MdmProxyCategoryPicker.mount({
        container: pickerEl,
        value: product.category_l3_id || '',
        onChange: function () {}
      });
    }

    var nameInput = document.getElementById('proxyFormName');
    if (nameInput) nameInput.focus();
  }

  window.MdmProxyProductForm = {
    open: openProxyProductForm,
    close: closeModal
  };
})();
