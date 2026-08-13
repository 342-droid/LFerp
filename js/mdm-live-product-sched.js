/**
 * 直播商品 — 直播排品
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(n) {
    var v = Number(n);
    if (isNaN(v)) return '—';
    return '¥' + v.toFixed(2);
  }

  function statusLabel(st) {
    var map = {
      listing: '上架中',
      delisting: '下架中',
      draft: '草稿',
      on_shelf: '已上架',
      off_shelf: '已下架'
    };
    return map[st] || st || '—';
  }

  function statusClass(st) {
    if (st === 'on_shelf' || st === 'listing') return 'mdm-status mdm-status--ok';
    if (st === 'draft' || st === 'delisting') return 'mdm-status mdm-status--warn';
    return 'mdm-status mdm-status--muted';
  }

  function pageWithQuery(file, query) {
    var base = wp.page(file);
    var qs = [];
    Object.keys(query || {}).forEach(function (k) {
      if (query[k] == null || query[k] === '') return;
      qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
    });
    if (!qs.length) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
  }

  function currentSessionId() {
    return (document.getElementById('liveSchedSession') || {}).value || '';
  }

  function productsOf(sessionId) {
    if (!sessionId) return [];
    if (!Demo.productsBySession[sessionId]) Demo.productsBySession[sessionId] = [];
    return Demo.productsBySession[sessionId];
  }

  function fillSessionSelect() {
    var sel = document.getElementById('liveSchedSession');
    if (!sel) return;
    var params = new URLSearchParams(window.location.search || '');
    var preset = params.get('sessionId') || '';
    sel.innerHTML =
      '<option value="">请选择直播场次</option>' +
      Demo.sessions
        .map(function (s) {
          return (
            '<option value="' +
            escapeHtml(s.id) +
            '"' +
            (s.id === preset ? ' selected' : '') +
            '>' +
            escapeHtml(s.name) +
            '</option>'
          );
        })
        .join('');
  }

  function thumbHtml(item) {
    if (item.img) {
      return (
        '<span class="lf-live-thumb"><img src="' + escapeHtml(item.img) + '" alt=""></span>'
      );
    }
    var ch = String(item.name || '?').charAt(0);
    return '<span class="lf-live-thumb">' + escapeHtml(ch) + '</span>';
  }

  function render() {
    var empty = document.getElementById('liveSchedEmpty');
    var panel = document.getElementById('liveSchedPanel');
    var tbody = document.getElementById('liveSchedTableBody');
    if (!empty || !panel || !tbody) return;

    var sessionId = currentSessionId();
    if (!sessionId) {
      empty.hidden = false;
      panel.hidden = true;
      return;
    }

    empty.hidden = true;
    panel.hidden = false;

    var rows = productsOf(sessionId);
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="11" style="text-align:center;color:#999;padding:24px;">暂无排品，请点击「添加商品」</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map(function (p) {
        var editHref = pageWithQuery('mdm_live_product_sched_edit.html', {
          id: p.id,
          sessionId: sessionId
        });
        var canOn = p.status === 'off_shelf' || p.status === 'draft' || p.status === 'delisting';
        var canOff = p.status === 'on_shelf' || p.status === 'listing';
        var ops =
          '<a href="' +
          escapeHtml(editHref) +
          '">编辑</a>' +
          (canOn ? '<a href="#" data-act="on">上架</a>' : '') +
          (canOff ? '<a href="#" data-act="off">下架</a>' : '');
        return (
          '<tr data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<td>' +
          thumbHtml(p) +
          '</td>' +
          '<td>' +
          escapeHtml(p.sku || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(p.name) +
          '</td>' +
          '<td>' +
          escapeHtml(p.category || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(p.spec || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(formatPrice(p.price)) +
          '</td>' +
          '<td>' +
          escapeHtml(formatPrice(p.marketPrice)) +
          '</td>' +
          '<td>' +
          escapeHtml(String(p.stock != null ? p.stock : 0)) +
          '</td>' +
          '<td><span class="' +
          statusClass(p.status) +
          '">' +
          escapeHtml(statusLabel(p.status)) +
          '</span></td>' +
          '<td>' +
          escapeHtml(p.addedAt || '—') +
          '</td>' +
          '<td class="action-links">' +
          ops +
          '</td></tr>'
        );
      })
      .join('');
  }

  function findProduct(sessionId, id) {
    var list = productsOf(sessionId);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function bindEvents() {
    var sel = document.getElementById('liveSchedSession');
    var addBtn = document.getElementById('liveSchedAddBtn');
    if (sel) sel.addEventListener('change', render);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var sessionId = currentSessionId();
        if (!sessionId) {
          toast('请先选择直播场次', 'warning');
          return;
        }
        toast('演示：已添加示例商品（实际对接商品选择器）');
        var list = productsOf(sessionId);
        var n = list.length + 1;
        list.push({
          id: 'lp-' + Date.now().toString(36),
          sessionId: sessionId,
          sku: 'LF-DEMO-' + String(10000 + n),
          name: '演示商品 ' + n,
          category: (Demo.categories[0] && Demo.categories[0].name) || '时令果蔬',
          spec: '1份',
          price: 9.9,
          marketPrice: 19.9,
          stock: 100,
          status: 'draft',
          addedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          img: ''
        });
        render();
      });
    }

    var tbody = document.getElementById('liveSchedTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var sessionId = currentSessionId();
      var item = findProduct(sessionId, tr.getAttribute('data-id'));
      if (!item) return;
      var act = actEl.getAttribute('data-act');
      if (act === 'on') {
        item.status = 'on_shelf';
        toast('商品已上架');
        render();
        return;
      }
      if (act === 'off') {
        item.status = 'off_shelf';
        toast('商品已下架');
        render();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillSessionSelect();
    bindEvents();
    render();
  });
})();
