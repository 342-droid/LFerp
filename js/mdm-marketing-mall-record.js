/**
 * 营销记录 — 领券记录列表
 */
(function () {
  'use strict';

  var Store = window.MdmMallMarketingRecordStore;
  if (!Store) return;

  var state = {
    page: 1,
    pageSize: 10,
    filter: {
      userId: '',
      nickname: '',
      phone: '',
      collectMethod: '',
      status: ''
    }
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusClass(st) {
    if (st === '待使用') return 'mdm-status mdm-status--ok';
    if (st === '已使用') return 'mdm-status mdm-status--muted';
    if (st === '已过期') return 'mdm-status mdm-status--warn';
    return 'mdm-status';
  }

  function activityIdText(row) {
    if (row.collectMethod === '直播发券' && row.activityId && row.activityId !== '—') {
      return row.activityId;
    }
    return '—';
  }

  function orderNosHtml(row) {
    if (typeof Store.formatOrderNosHtml === 'function') return Store.formatOrderNosHtml(row);
    var nos = row.orderNos || [];
    if (!nos.length) return '—';
    return nos.map(escapeHtml).join('<br>');
  }

  function readFilterFromForm() {
    return {
      userId: (document.getElementById('qUserId') || {}).value || '',
      nickname: (document.getElementById('qNickname') || {}).value || '',
      phone: (document.getElementById('qPhone') || {}).value || '',
      collectMethod: (document.getElementById('qCollectMethod') || {}).value || '',
      status: (document.getElementById('qStatus') || {}).value || ''
    };
  }

  function renderPagination(total) {
    if (typeof createPagination !== 'function') return;
    createPagination({
      containerId: 'pagination-container',
      totalItems: total,
      currentPage: state.page,
      pageSize: state.pageSize,
      onPageChange: function (page) {
        state.page = page;
        render(false);
      },
      onPageSizeChange: function (size) {
        state.pageSize = size;
        state.page = 1;
        render(false);
      }
    });
  }

  function render(resetPage) {
    var tbody = document.getElementById('mallRecordTableBody');
    if (!tbody) return;
    var rows = Store.filterList(state.filter);
    var total = rows.length;
    var maxPage = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (resetPage) state.page = 1;
    if (state.page > maxPage) state.page = maxPage;
    var start = (state.page - 1) * state.pageSize;
    var slice = rows.slice(start, start + state.pageSize);

    if (!slice.length) {
      tbody.innerHTML =
        '<tr><td colspan="15" style="text-align:center;color:#999;padding:24px;">暂无符合条件的记录</td></tr>';
    } else {
      tbody.innerHTML = slice
        .map(function (row) {
          return (
            '<tr>' +
            '<td>' + escapeHtml(row.id) + '</td>' +
            '<td>' + escapeHtml(row.userId) + '</td>' +
            '<td>' + escapeHtml(row.nickname) + '</td>' +
            '<td>' + escapeHtml(row.phone) + '</td>' +
            '<td>' + escapeHtml(row.couponName) + '</td>' +
            '<td>' + escapeHtml(row.type) + '</td>' +
            '<td>' + escapeHtml(row.faceValue) + '</td>' +
            '<td>' + escapeHtml(row.threshold) + '</td>' +
            '<td>' + escapeHtml(row.templateId) + '</td>' +
            '<td>' + escapeHtml(row.collectAt) + '</td>' +
            '<td>' + escapeHtml(row.collectMethod) + '</td>' +
            '<td>' + escapeHtml(activityIdText(row)) + '</td>' +
            '<td><span class="' + statusClass(row.status) + '">' + escapeHtml(row.status) + '</span></td>' +
            '<td class="mall-record-orders">' + orderNosHtml(row) + '</td>' +
            '<td>' + escapeHtml(row.remark) + '</td>' +
            '</tr>'
          );
        })
        .join('');
    }
    renderPagination(total);
  }

  function bind() {
    var queryBtn = document.getElementById('btnFilterQuery');
    var resetBtn = document.getElementById('btnFilterReset');
    var form = document.getElementById('mallRecordSearchForm');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        state.filter = readFilterFromForm();
        render(true);
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var userId = document.getElementById('qUserId');
        var nickname = document.getElementById('qNickname');
        var phone = document.getElementById('qPhone');
        var method = document.getElementById('qCollectMethod');
        var status = document.getElementById('qStatus');
        if (userId) userId.value = '';
        if (nickname) nickname.value = '';
        if (phone) phone.value = '';
        if (method) method.value = '';
        if (status) status.value = '';
        state.filter = { userId: '', nickname: '', phone: '', collectMethod: '', status: '' };
        render(true);
      });
    }
    if (form) {
      form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          state.filter = readFilterFromForm();
          render(true);
        }
      });
    }
  }

  bind();
  render(true);
})();
