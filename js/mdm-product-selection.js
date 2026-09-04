(function () {
  var wp = window.wmsPath || { page: function (f) { return f; } };

  var ALL_PRODUCTS = [];
  var state = {
    filtered: [],
    page: 1,
    pageSize: 20,
    filters: { code: '', name: '', category: '', status: '' }
  };

  function formatPrice(num) {
    var n = Math.round(num * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    var s = n.toFixed(2);
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return '¥' + s;
  }

  function loadCatalog() {
    ALL_PRODUCTS = window.MdmProductCatalog ? window.MdmProductCatalog.getAll() : [];
  }

  function matchStatusFilter(item, filter) {
    if (!filter) return true;
    if (filter === 'pending_sale') return item.status === 'pending_sale';
    if (filter === 'selling') return item.status === 'selling';
    if (filter === 'pending') return item.audit === 'pending';
    if (filter === 'rejected') return item.audit === 'rejected';
    if (filter === 'stopped') return item.status === 'stopped';
    return true;
  }

  function applyFilters() {
    var f = state.filters;
    state.filtered = ALL_PRODUCTS.filter(function (item) {
      if (f.code && item.code.toLowerCase().indexOf(f.code.toLowerCase()) < 0) return false;
      if (f.name && item.name.indexOf(f.name) < 0) return false;
      if (f.category && item.category !== f.category) return false;
      if (!matchStatusFilter(item, f.status)) return false;
      return true;
    });
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
  }

  function statusTag(item) {
    if (item.status === 'stopped') {
      return '<span class="product-tag product-tag--stopped">已停售</span>';
    }
    if (item.status === 'selling') {
      return '<span class="product-tag product-tag--sale">售卖中</span>';
    }
    return '<span class="product-tag product-tag--pending-sale">待售卖</span>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function auditCell(item) {
    if (item.audit === 'passed') {
      return '<span class="product-tag product-tag--audit">审核通过</span>';
    }
    if (item.audit === 'rejected') {
      return (
        '<div class="product-audit-cell">' +
        '<span class="product-tag product-tag--reject">审核未通过</span>' +
        '<button type="button" class="product-audit-cell__reason" data-view-reject="' + escapeHtml(item.code) + '">查看原因</button>' +
        '</div>'
      );
    }
    return '<span class="product-tag product-tag--pending">待审核</span>';
  }

  function closeRejectReasonModal() {
    var modal = document.querySelector('[data-product-reject-view-modal]');
    if (modal) modal.remove();
  }

  function openRejectReasonModal(code) {
    closeRejectReasonModal();
    var product = window.MdmProductCatalog ? window.MdmProductCatalog.getByCode(code) : null;
    var reason = (product && product.rejectReason) || '暂无驳回原因';

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop product-reject-view-backdrop';
    backdrop.setAttribute('data-product-reject-view-modal', '1');

    backdrop.innerHTML =
      '<div class="erp-modal product-reject-view-modal">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">驳回原因</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-reject-view-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="product-reject-view-modal__content">' + escapeHtml(reason) + '</div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-reject-view-close>关闭</button>' +
      '  </div>' +
      '</div>';

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeRejectReasonModal();
    });
    backdrop.querySelectorAll('[data-reject-view-close]').forEach(function (btn) {
      btn.addEventListener('click', closeRejectReasonModal);
    });

    document.body.appendChild(backdrop);
  }

  var DETAIL_CODE_KEY = 'mdm_product_detail_code';
  var DETAIL_MODE_KEY = 'mdm_product_detail_mode';

  function detailPageUrl(code, mode) {
    var pathApi = window.wmsPath || wp;
    var base = pathApi.page ? pathApi.page('mdm_product_audit.html') : 'mdm_product_audit.html';
    base = String(base || 'mdm_product_audit.html').split('#')[0].split('?')[0];
    var q = 'code=' + encodeURIComponent(String(code || '').trim());
    if (mode === 'audit') q += '&mode=audit';
    /* query + hash 双写：部分预览/cleanUrl 会丢掉 ?query，hash 仍可保留 */
    return base + '?' + q + '#' + q;
  }

  function goProductDetail(code, mode) {
    code = String(code || '').trim();
    if (!code) {
      if (typeof showToast === 'function') showToast('商品编码无效', 'warning');
      return;
    }
    try {
      sessionStorage.setItem(DETAIL_CODE_KEY, code);
      sessionStorage.setItem(DETAIL_MODE_KEY, mode === 'audit' ? 'audit' : 'view');
    } catch (e) {
      /* ignore */
    }
    window.location.assign(detailPageUrl(code, mode));
  }

  function closeWarmConfirmModal() {
    var modal = document.querySelector('[data-product-warm-confirm]');
    if (modal) modal.remove();
  }

  function openWarmConfirmModal(message, onConfirm) {
    closeWarmConfirmModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop mdm-people-warm-confirm-backdrop product-warm-confirm-backdrop';
    backdrop.setAttribute('data-product-warm-confirm', '1');

    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">温馨提示</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-warm-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      '    <div class="erp-modal-confirm__row">' +
      '      <div class="erp-modal-confirm__icon">!</div>' +
      '      <div class="erp-modal-confirm__msg">' + escapeHtml(message) + '</div>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-warm-cancel>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-warm-ok>确定</button>' +
      '  </div>' +
      '</div>';

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeWarmConfirmModal();
    });
    backdrop.querySelectorAll('[data-warm-close], [data-warm-cancel]').forEach(function (btn) {
      btn.addEventListener('click', closeWarmConfirmModal);
    });
    backdrop.querySelector('[data-warm-ok]').addEventListener('click', function () {
      closeWarmConfirmModal();
      if (typeof onConfirm === 'function') onConfirm();
    });

    document.body.appendChild(backdrop);
  }

  function renderMoreMenu(code, items) {
    var menuHtml = items
      .map(function (entry) {
        var cls = 'product-more__item';
        if (entry.danger) cls += ' product-more__item--danger';
        else if (entry.primary) cls += ' product-more__item--primary';
        if (entry.muted) cls += ' product-more__item--muted';
        return (
          '<button type="button" class="' + cls + '" data-action="' + entry.action + '" data-code="' + code + '">' + entry.label + '</button>'
        );
      })
      .join('');

    return (
      '<div class="product-more" data-more-wrap>' +
      '<button type="button" class="product-more__btn" data-more-toggle>更多 <span class="product-more__caret">▼</span></button>' +
      '<div class="product-more__menu">' + menuHtml + '</div></div>'
    );
  }

  function canDeleteStatus(item) {
    return item && (item.status === 'pending_sale' || item.status === 'stopped');
  }

  function buildDeleteMoreItem(item) {
    var catalog = window.MdmProductCatalog;
    var marketing =
      catalog && typeof catalog.getMarketingUsage === 'function'
        ? catalog.getMarketingUsage(item.code)
        : [];
    return {
      action: 'delete',
      label: '删除',
      danger: true,
      muted: marketing.length > 0
    };
  }

  function renderActions(item) {
    var html = '<div class="product-action">';
    /* 选品库主数据详情：所有状态均可查看/进入 */
    html +=
      '<button type="button" class="product-action__link" data-action="edit" data-code="' +
      String(item.code || '').replace(/"/g, '&quot;') +
      '">编辑</button>';

    if (item.status === 'pending_sale') {
      var moreAction =
        item.audit === 'rejected'
          ? { action: 'shelf', label: '上架', primary: true }
          : { action: 'audit', label: '审核', primary: true };
      html += renderMoreMenu(item.code, [moreAction, buildDeleteMoreItem(item)]);
    } else if (item.status === 'stopped') {
      html += renderMoreMenu(item.code, [
        { action: 'enable', label: '启用', primary: true },
        buildDeleteMoreItem(item)
      ]);
    } else if (item.status === 'selling') {
      html += renderMoreMenu(item.code, [{ action: 'stop', label: '停用', primary: true }]);
    }

    html += '</div>';
    return html;
  }

  function renderTable() {
    var tbody = document.getElementById('productSelectionTableBody');
    var emptyEl = document.getElementById('productSelectionEmpty');
    if (!tbody) return;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = state.filtered.slice(start, start + state.pageSize);

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (emptyEl) emptyEl.hidden = true;
      tbody.innerHTML = pageItems
        .map(function (item) {
          var codeAttr = String(item.code || '').replace(/"/g, '&quot;');
          return (
            '<tr data-code="' + codeAttr + '">' +
            '<td class="product-table__td product-table__td--code">' + item.code + '</td>' +
            '<td class="product-table__td product-table__td--img"><img class="product-table__thumb" src="' + item.img + '" alt=""></td>' +
            '<td class="product-table__td product-table__td--name"><a href="javascript:void(0)" class="product-table__name" data-view="' + codeAttr + '">' + item.name + '</a></td>' +
            '<td class="product-table__td product-table__td--price">' + formatPrice(item.price) + '</td>' +
            '<td class="product-table__td product-table__td--channel">' + item.channel + '</td>' +
            '<td class="product-table__td product-table__td--category">' + item.category + '</td>' +
            '<td class="product-table__td product-table__td--status">' + statusTag(item) + '</td>' +
            '<td class="product-table__td product-table__td--audit">' + auditCell(item) + '</td>' +
            '<td class="product-table__td product-table__td--action">' + renderActions(item) + '</td></tr>'
          );
        })
        .join('');
    }
    renderPagination();
  }

  function renderPagination() {
    var totalEl = document.getElementById('productPaginationTotal');
    var pagesEl = document.getElementById('productPaginationPages');
    var gotoEl = document.getElementById('productPageGoto');
    var total = state.filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    var page = state.page;

    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (gotoEl) gotoEl.value = String(page);

    if (!pagesEl) return;

    var html = '';
    html += '<button type="button" class="product-pagination__btn" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>';

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('…');
      var start = Math.max(2, page - 2);
      var end = Math.min(totalPages - 1, page + 2);
      for (var j = start; j <= end; j++) pages.push(j);
      if (page < totalPages - 3) pages.push('…');
      pages.push(totalPages);
    }

    pages.forEach(function (p) {
      if (p === '…') {
        html += '<button type="button" class="product-pagination__btn" disabled>…</button>';
      } else {
        html += '<button type="button" class="product-pagination__btn' + (p === page ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>';
      }
    });

    html += '<button type="button" class="product-pagination__btn" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>';
    pagesEl.innerHTML = html;
  }

  function readFiltersFromForm() {
    state.filters.code = (document.getElementById('qProductCode') || {}).value.trim();
    state.filters.name = (document.getElementById('qProductName') || {}).value.trim();
    state.filters.category = (document.getElementById('qProductCategory') || {}).value;
    state.filters.status = (document.getElementById('productStatusFilter') || {}).value;
  }

  function refresh(resetPage) {
    loadCatalog();
    if (resetPage) state.page = 1;
    readFiltersFromForm();
    applyFilters();
    renderTable();
  }

  function closeAllMoreMenus() {
    document.querySelectorAll('.product-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  function bindEvents() {
    document.getElementById('productFilterQuery') &&
      document.getElementById('productFilterQuery').addEventListener('click', function () {
        refresh(true);
        if (typeof showToast === 'function') showToast('查询完成', 'success');
      });

    document.getElementById('productFilterReset') &&
      document.getElementById('productFilterReset').addEventListener('click', function () {
        var form = document.getElementById('productSelectionFilterForm');
        if (form) form.reset();
        var statusEl = document.getElementById('productStatusFilter');
        if (statusEl) statusEl.value = '';
        refresh(true);
      });

    document.getElementById('productStatusFilter') &&
      document.getElementById('productStatusFilter').addEventListener('change', function () {
        refresh(true);
      });

    document.getElementById('productPageSize') &&
      document.getElementById('productPageSize').addEventListener('change', function (e) {
        state.pageSize = parseInt(e.target.value, 10) || 20;
        refresh(true);
      });

    document.getElementById('productPaginationPages') &&
      document.getElementById('productPaginationPages').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var next = parseInt(btn.getAttribute('data-page'), 10);
        if (!next || next === state.page) return;
        state.page = next;
        renderTable();
      });

    document.getElementById('productPageGoto') &&
      document.getElementById('productPageGoto').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
        var val = parseInt(e.target.value, 10);
        if (!val || val < 1) val = 1;
        if (val > totalPages) val = totalPages;
        state.page = val;
        renderTable();
      });

    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('[data-more-toggle]');
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = toggle.closest('.product-more');
        if (!wrap) return;
        var open = wrap.classList.contains('is-open');
        closeAllMoreMenus();
        if (!open) wrap.classList.add('is-open');
        return;
      }

      if (!e.target.closest('.product-more')) closeAllMoreMenus();

      var rejectBtn = e.target.closest('[data-view-reject]');
      if (rejectBtn) {
        e.preventDefault();
        openRejectReasonModal(rejectBtn.getAttribute('data-view-reject'));
        return;
      }

      var actionBtn = e.target.closest('#productSelectionTableBody [data-action]');
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        closeAllMoreMenus();
        var action = actionBtn.getAttribute('data-action');
        var code = actionBtn.getAttribute('data-code');

        if (action === 'edit') {
          goProductDetail(code);
          return;
        }

        if (action === 'audit') {
          goProductDetail(code, 'audit');
          return;
        }

        if (action === 'shelf') {
          openWarmConfirmModal('确定要重新提交审核吗？', function () {
            if (!window.MdmProductCatalog) return;
            var product = window.MdmProductCatalog.getByCode(code);
            if (!product || product.audit !== 'rejected') return;
            window.MdmProductCatalog.resubmitAudit(code);
            refresh(false);
            if (typeof showToast === 'function') showToast('已重新提交审核', 'success');
          });
          return;
        }

        if (action === 'enable') {
          if (window.MdmProductCatalog) {
            var current = window.MdmProductCatalog.getByCode(code);
            if (current && current.status === 'stopped') {
              window.MdmProductCatalog.updateProduct(code, {
                status: current.audit === 'passed' ? 'selling' : 'pending_sale',
                audit: current.audit === 'passed' ? current.audit : 'pending'
              });
              refresh(false);
              if (typeof showToast === 'function') showToast('已启用 ' + code, 'success');
            }
          }
          return;
        }

        if (action === 'stop') {
          if (window.MdmProductCatalog) {
            var selling = window.MdmProductCatalog.getByCode(code);
            if (selling && selling.status === 'selling') {
              window.MdmProductCatalog.updateProduct(code, { status: 'stopped' });
              refresh(false);
              if (typeof showToast === 'function') showToast('已停用 ' + code, 'success');
            }
          }
          return;
        }

        if (action === 'delete') {
          var catalog = window.MdmProductCatalog;
          var target = catalog ? catalog.getByCode(code) : null;
          if (!target || !canDeleteStatus(target)) {
            if (typeof showToast === 'function') showToast('仅待售卖、已停售商品可删除', 'warning');
            return;
          }
          var downstream =
            catalog && typeof catalog.getDownstreamUsage === 'function'
              ? catalog.getDownstreamUsage(code)
              : [];
          if (downstream.length) {
            if (typeof showToast === 'function') {
              showToast('下游已关联（' + downstream.join('、') + '），无法删除', 'warning');
            }
            return;
          }
          var marketing =
            catalog && typeof catalog.getMarketingUsage === 'function'
              ? catalog.getMarketingUsage(code)
              : [];
          var msg = marketing.length
            ? '确定删除该商品吗？营销板块已关联的商品将置灰，可在对应活动中删除。'
            : '确定删除该商品吗？';
          openWarmConfirmModal(msg, function () {
            if (!catalog.removeProduct(code)) return;
            refresh(false);
            if (typeof showToast === 'function') showToast('已删除 ' + code, 'success');
          });
        }
        return;
      }

      var viewLink = e.target.closest('#productSelectionTableBody [data-view]');
      if (viewLink) {
        e.preventDefault();
        e.stopPropagation();
        goProductDetail(viewLink.getAttribute('data-view'));
      }
    });
  }

  function init() {
    loadCatalog();
    state.filtered = ALL_PRODUCTS.slice();
    bindEvents();
    renderTable();
    window.__refreshProductSelection = function () {
      refresh(false);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
