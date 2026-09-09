/**
 * 营销活动 — 优惠券列表
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCouponStore;
  var GoodsDialog = window.MdmMarketingCouponGoodsDialog;
  var LogUi = window.MdmMarketingCouponLogUi;
  if (!Store) return;
  var wp = window.wmsPath || { page: function (f) { return f; } };

  var state = { page: 1, pageSize: 10 };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function qs(name) {
    var u = new URLSearchParams(window.location.search);
    return u.get(name) || '';
  }

  function formHref(id, mode) {
    var q = 'mode=' + encodeURIComponent(mode || 'edit');
    if (id) q += '&id=' + encodeURIComponent(id);
    return wp.page('mdm_marketing_coupon_form.html') + '?' + q;
  }

  function statusTagClass(status) {
    if (status === 'ACTIVE') return 'mkt-tpl-tag mkt-tpl-tag--success';
    if (status === 'APPROVED') return 'mkt-tpl-tag mkt-tpl-tag--primary';
    if (status === 'PENDING') return 'mkt-tpl-tag mkt-tpl-tag--warning';
    if (status === 'REJECTED') return 'mkt-tpl-tag mkt-tpl-tag--danger';
    if (status === 'DISABLED') return 'mkt-tpl-tag mkt-tpl-tag--info';
    return 'mkt-tpl-tag mkt-tpl-tag--info';
  }

  function query() {
    return {
      name: (document.getElementById('qCpName') || {}).value || '',
      status: (document.getElementById('qCpStatus') || {}).value || '',
      scene: (document.getElementById('qCpScene') || {}).value || '',
      itemScope: (document.getElementById('qCpScope') || {}).value || ''
    };
  }

  function rowActions(item) {
    var acts = [];
    if (item.status === 'DRAFT' || item.status === 'APPROVED' || item.status === 'REJECTED' || item.status === 'DISABLED') {
      acts.push({ key: 'edit', label: '编辑' });
    }
    if (item.status === 'PENDING') acts.push({ key: 'cancel', label: '取消审核' });
    if (item.status === 'APPROVED' || item.status === 'DISABLED') acts.push({ key: 'enable', label: '启用' });
    if (item.status === 'ACTIVE') acts.push({ key: 'disable', label: '禁用' });
    acts.push({ key: 'operationLog', label: '操作日志' });
    return acts;
  }

  function renderTable() {
    var tbody = document.getElementById('cpTableBody');
    if (!tbody) return;
    var all = Store.listRows(query());
    var total = all.length;
    var start = (state.page - 1) * state.pageSize;
    var rows = all.slice(start, start + state.pageSize);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="mkt-tpl-empty">未查询到符合条件的数据</td></tr>';
    } else {
      tbody.innerHTML = rows
        .map(function (item) {
          var acts = rowActions(item);
          var ops = acts
            .map(function (a) {
              var cls = 'mkt-tpl-link';
              if (a.key === 'disable' || a.key === 'cancel') cls += ' mkt-tpl-link--warn';
              if (a.key === 'enable') cls += ' mkt-tpl-link--ok';
              return (
                '<button type="button" class="' +
                cls +
                '" data-act="' +
                a.key +
                '" data-id="' +
                escapeHtml(item.id) +
                '">' +
                escapeHtml(a.label) +
                '</button>'
              );
            })
            .join('');
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(item.id) +
            '</td>' +
            '<td><button type="button" class="mkt-tpl-name" data-act="view" data-id="' +
            escapeHtml(item.id) +
            '">' +
            escapeHtml(item.name || '未命名草稿') +
            '</button></td>' +
            '<td>' +
            escapeHtml(Store.faceValueText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.thresholdText(item)) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.channelLabel(item.applicableChannel)) +
            '</td>' +
            '<td>' +
            (GoodsDialog ? GoodsDialog.cellHtml(item, 'data-id="' + escapeHtml(item.id) + '"') : escapeHtml(Store.scopeText(item))) +
            '</td>' +
            '<td>' +
            escapeHtml(item.createdAt || '—') +
            '</td>' +
            '<td style="text-align:center"><span class="' +
            statusTagClass(item.status) +
            '">' +
            escapeHtml(Store.statusLabel(item.status)) +
            '</span></td>' +
            '<td>' +
            escapeHtml(item.status === 'REJECTED' ? item.remark || '—' : '—') +
            '</td>' +
            '<td class="mkt-tpl-ops action-links">' +
            ops +
            '</td></tr>'
          );
        })
        .join('');
    }
    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'pagination-container',
        totalItems: total,
        currentPage: state.page,
        pageSize: state.pageSize,
        pageSizeOptions: [10, 20, 50, 100],
        onPageChange: function (p) {
          state.page = p;
          renderTable();
        },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
    }
  }

  function handleAct(act, id) {
    if (act === 'edit' || act === 'view') {
      window.location.href = formHref(id, act === 'view' ? 'view' : 'edit');
      return;
    }
    if (act === 'operationLog') {
      if (LogUi) LogUi.open(id);
      return;
    }
    if (act === 'cancel') {
      if (!window.confirm('取消审核后优惠券将回到草稿，是否继续？')) return;
      Store.cancelAudit(id);
      toast('已取消审核', 'success');
      renderTable();
      return;
    }
    if (act === 'enable') {
      if (!window.confirm('确认启用该优惠券？启用后可被对应发放场景选择。')) return;
      Store.enableCoupon(id);
      toast('已启用', 'success');
      renderTable();
      return;
    }
    if (act === 'disable') {
      if (!window.confirm('确认禁用该优惠券？禁用后不可被发放场景选择。')) return;
      Store.disableCoupon(id);
      toast('已禁用', 'success');
      renderTable();
    }
  }

  function fillSceneFilter() {
    var sel = document.getElementById('qCpScene');
    if (!sel || !Store.SCENE_OPTIONS) return;
    var keep = sel.value || '';
    sel.innerHTML = '';
    var all = document.createElement('option');
    all.value = '';
    all.textContent = '全部';
    sel.appendChild(all);
    Store.SCENE_OPTIONS.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.l;
      sel.appendChild(opt);
    });
    sel.value = keep;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('cpFilterQuery').addEventListener('click', function () {
      state.page = 1;
      renderTable();
    });
    document.getElementById('cpFilterReset').addEventListener('click', function () {
      ['qCpName', 'qCpStatus', 'qCpScene', 'qCpScope'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
      state.page = 1;
      renderTable();
    });
    document.getElementById('cpAddBtn').addEventListener('click', function () {
      window.location.href = formHref('', 'add');
    });
    document.getElementById('cpTableBody').addEventListener('click', function (e) {
      var goodsBtn = e.target.closest('[data-act="view-scope"], [data-act="view-goods"]');
      if (goodsBtn) {
        e.preventDefault();
        var found = Store.findById(goodsBtn.getAttribute('data-id'));
        if (found && GoodsDialog) GoodsDialog.openFromCoupon(found);
        return;
      }
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      handleAct(btn.getAttribute('data-act'), btn.getAttribute('data-id'));
    });
    if (LogUi) LogUi.bind();
    fillSceneFilter();
    renderTable();
    if (qs('created')) toast('已保存', 'success');
  });
})();
