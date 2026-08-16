/**
 * 批量打标签 — 人群成员列表（样式对齐会员分群人群列表）
 */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search || '');
  var batchId = params.get('batchId') || params.get('segmentId') || '';
  var batchName = params.get('name') || '';

  var DEMO_MEMBERS = [
    { id: 'U10001', nickname: '小程序用户A', phone: '13800138001', registerAt: '2026-03-12 09:21:18', avatarText: '程' },
    { id: 'U10002', nickname: 'APP会员B', phone: '13900139002', registerAt: '2026-04-02 14:08:44', avatarText: 'B' },
    { id: 'U10003', nickname: '冷丰小橘', phone: '13700137003', registerAt: '2026-01-18 20:33:07', avatarText: '橘' },
    { id: 'U10004', nickname: '阿梅爱买菜', phone: '13600136004', registerAt: '2025-12-08 23:15:52', avatarText: '梅' },
    { id: 'U10005', nickname: '夜猫子阿强', phone: '13500135005', registerAt: '2026-05-21 11:02:29', avatarText: '强' },
    { id: 'U10006', nickname: '家庭厨房日记', phone: '13400134006', registerAt: '2026-06-01 08:44:11', avatarText: '家' },
    { id: 'U10007', nickname: '小满优选', phone: '13300133007', registerAt: '2026-02-27 16:19:36', avatarText: '满' },
    { id: 'U10008', nickname: '鲜活达人', phone: '13200132008', registerAt: '2026-07-03 19:27:05', avatarText: '鲜' },
    { id: 'U10009', nickname: '阿琳', phone: '13100131009', registerAt: '2026-04-19 10:55:48', avatarText: '琳' },
    { id: 'U10010', nickname: '老李吃货铺', phone: '13000130010', registerAt: '2025-11-30 07:12:03', avatarText: '李' },
    { id: 'U10011', nickname: '蓝莓酸奶', phone: '15800158011', registerAt: '2026-05-08 13:41:22', avatarText: '蓝' },
    { id: 'U10012', nickname: '城市渔夫', phone: '15900159012', registerAt: '2026-06-16 21:06:59', avatarText: '渔' }
  ];

  var state = {
    page: 1,
    pageSize: 10,
    filter: { keyword: '', regStart: '', regEnd: '' },
    list: DEMO_MEMBERS.slice()
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function maskPhone(phone) {
    var raw = String(phone == null ? '' : phone).trim();
    if (!raw || raw === '—') return '—';
    var digits = raw.replace(/\D/g, '');
    if (digits.length === 11) return digits.slice(0, 3) + '****' + digits.slice(7);
    if (digits.length >= 7) return digits.slice(0, 3) + '****' + digits.slice(-4);
    return raw;
  }

  function pageHref(filename) {
    if (window.wmsPath && typeof window.wmsPath.page === 'function') {
      return window.wmsPath.page(filename);
    }
    return filename;
  }

  function fromDatetimeLocal(value) {
    if (!value) return '';
    var v = String(value).replace('T', ' ');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v)) v += ':00';
    return v;
  }

  function resolveBatchName() {
    try {
      if (batchId) {
        var raw = localStorage.getItem('mdm_member_batch_tag_list');
        if (raw) {
          var list = JSON.parse(raw);
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === batchId) {
              var ids = list[i].tagIds || [];
              if (batchName) return batchName;
              if (ids.length) return ids.join('、');
              break;
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
    if (batchName) return batchName;
    return batchId ? ('任务 ' + batchId) : '人群列表';
  }

  function syncDatetimeClearState() {
    document.querySelectorAll('[data-datetime-wrap]').forEach(function (wrap) {
      var input = wrap.querySelector('input');
      wrap.classList.toggle('has-value', !!(input && input.value));
    });
  }

  function getFilteredList() {
    var f = state.filter;
    return state.list.filter(function (item) {
      if (f.keyword) {
        var kw = f.keyword;
        var hit =
          item.id.indexOf(kw) >= 0 ||
          item.nickname.indexOf(kw) >= 0 ||
          item.phone.indexOf(kw) >= 0 ||
          maskPhone(item.phone).indexOf(kw) >= 0;
        if (!hit) return false;
      }
      if (f.regStart && item.registerAt < f.regStart) return false;
      if (f.regEnd && item.registerAt > f.regEnd) return false;
      return true;
    });
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
        renderTable();
      },
      onPageSizeChange: function (size) {
        state.pageSize = size;
        state.page = 1;
        renderTable();
      }
    });
  }

  function memberDetailUrl(id) {
    return pageHref('mdm_member_c.html') +
      '?memberId=' + encodeURIComponent(id) +
      '&detail=1';
  }

  function renderTable() {
    var list = getFilteredList();
    var totalPages = Math.ceil(list.length / state.pageSize) || 1;
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageList = list.slice(start, start + state.pageSize);
    var tbody = document.getElementById('tableBody');

    if (!pageList.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:28px 0;">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = pageList.map(function (item, idx) {
        var detailUrl = memberDetailUrl(item.id);
        return (
          '<tr>' +
          '  <td>' + (start + idx + 1) + '</td>' +
          '  <td><span class="segment-members-avatar">' + escapeHtml(item.avatarText || '会') + '</span></td>' +
          '  <td><a class="subject-name-link" href="' + detailUrl + '">' + escapeHtml(item.nickname) + '</a></td>' +
          '  <td>' + escapeHtml(item.id) + '</td>' +
          '  <td>' + escapeHtml(maskPhone(item.phone)) + '</td>' +
          '  <td>' + escapeHtml(item.registerAt) + '</td>' +
          '  <td><a href="' + detailUrl + '">查看</a></td>' +
          '</tr>'
        );
      }).join('');
    }

    renderPagination(list.length);
  }

  function exportCsv() {
    var list = getFilteredList();
    var rows = [['序号', '昵称', '会员ID', '手机号', '注册时间']];
    list.forEach(function (item, idx) {
      rows.push([
        String(idx + 1),
        item.nickname,
        item.id,
        maskPhone(item.phone),
        item.registerAt
      ]);
    });
    var csv = rows.map(function (cols) {
      return cols.map(function (cell) {
        var s = String(cell == null ? '' : cell).replace(/"/g, '""');
        return /[",\n]/.test(s) ? '"' + s + '"' : s;
      }).join(',');
    }).join('\r\n');

    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (resolveBatchName() || '人群列表') + '_成员_' + Date.now() + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    /* 导出任务与角标由全局 LfFileCenterNotify 处理 */
  }

  function bindEvents() {
    var back = document.getElementById('btnBackSegment');
    if (back) back.href = pageHref('mdm_member_batch_tag.html');

    document.getElementById('btnExport').addEventListener('click', exportCsv);

    document.getElementById('btnFilterQuery').addEventListener('click', function () {
      state.filter.keyword = (document.getElementById('qKeyword').value || '').trim();
      state.filter.regStart = fromDatetimeLocal(document.getElementById('qRegStart').value);
      state.filter.regEnd = fromDatetimeLocal(document.getElementById('qRegEnd').value);
      state.page = 1;
      renderTable();
    });

    document.getElementById('btnFilterReset').addEventListener('click', function () {
      document.getElementById('qKeyword').value = '';
      document.getElementById('qRegStart').value = '';
      document.getElementById('qRegEnd').value = '';
      state.filter = { keyword: '', regStart: '', regEnd: '' };
      state.page = 1;
      syncDatetimeClearState();
      renderTable();
    });

    document.getElementById('membersSearchForm').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-clear-datetime]');
      if (!btn) return;
      var id = btn.getAttribute('data-clear-datetime');
      var input = document.getElementById(id);
      if (input) {
        input.value = '';
        syncDatetimeClearState();
      }
    });

    ['qRegStart', 'qRegEnd'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', syncDatetimeClearState);
      el.addEventListener('change', syncDatetimeClearState);
    });
  }

  function init() {
    document.getElementById('segmentNameLabel').textContent = resolveBatchName();
    if (batchId) {
      var seed = batchId.charCodeAt(batchId.length - 1) || 0;
      state.list = DEMO_MEMBERS.filter(function (_, i) {
        return (i + seed) % 3 !== 0 || i < 4;
      });
    }
    bindEvents();
    syncDatetimeClearState();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
