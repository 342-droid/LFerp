/**
 * 直播商品 — 直播排品
 * 排品状态：草稿 / 启用 / 禁用。启用不等于直播间上架。
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

  var page = 1;
  var pageSize = 20;
  var expandedIds = {};

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

  function formatAddedAt(s) {
    if (!s) return '—';
    return String(s).slice(0, 16);
  }

  function formatSessionTime(startAt, endAt) {
    function short(t) {
      if (!t) return '—';
      return String(t).replace(/^\d{4}-/, '').slice(0, 11);
    }
    return short(startAt) + ' - ' + short(endAt);
  }

  function normalizeStatus(st) {
    if (typeof Demo.normalizeSchedStatus === 'function') return Demo.normalizeSchedStatus(st);
    if (st === 'enabled' || st === 'on_shelf' || st === 'listing') return 'enabled';
    if (st === 'disabled' || st === 'off_shelf' || st === 'delisting') return 'disabled';
    return 'draft';
  }

  function statusLabel(st) {
    var map = {
      draft: '草稿',
      enabled: '启用',
      disabled: '禁用'
    };
    return map[normalizeStatus(st)] || '草稿';
  }

  function statusClass(st) {
    var n = normalizeStatus(st);
    if (n === 'enabled') return 'lf-live-badge lf-live-badge--ok';
    if (n === 'disabled') return 'lf-live-badge lf-live-badge--danger';
    return 'lf-live-badge lf-live-badge--muted';
  }

  function sessionStatusLabel(st) {
    if (st === 'live') return '直播中';
    if (st === 'upcoming') return '未开始';
    if (st === 'ended') return '已结束';
    return st || '—';
  }

  function sessionBadgeClass(st) {
    if (st === 'live') return 'lf-live-badge lf-live-badge--live';
    if (st === 'upcoming') return 'lf-live-badge lf-live-badge--warn';
    return 'lf-live-badge lf-live-badge--muted';
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

  function findSession(id) {
    var list = Demo.sessions || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function productsOf(sessionId) {
    if (!sessionId) return [];
    if (!Demo.productsBySession[sessionId]) Demo.productsBySession[sessionId] = [];
    return Demo.productsBySession[sessionId];
  }

  function skusOf(p) {
    if (p.skus && p.skus.length) return p.skus;
    return [
      {
        id: (p.id || 'x') + '-sku',
        specName: p.spec || '默认规格',
        price: p.price,
        marketPrice: p.marketPrice,
        stock: p.stock
      }
    ];
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

  function renderMeta(sess) {
    var el = document.getElementById('liveSchedMeta');
    if (!el) return;
    if (!sess) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML =
      '<span class="lf-live-session-meta__item">直播间名称：<b>' +
      escapeHtml(sess.roomName || sess.name || '—') +
      '</b></span>' +
      '<span class="lf-live-session-meta__item">主播：<b>' +
      escapeHtml(sess.anchorName || '—') +
      '</b></span>' +
      '<span class="lf-live-session-meta__item">开播时间：<b>' +
      escapeHtml(formatSessionTime(sess.startAt, sess.endAt)) +
      '</b></span>' +
      '<span class="lf-live-session-meta__item">状态：<span class="' +
      sessionBadgeClass(sess.status) +
      '">' +
      escapeHtml(sessionStatusLabel(sess.status)) +
      '</span></span>';
  }

  function skuCells(sku) {
    return (
      '<td>' +
      escapeHtml((sku && sku.specName) || '—') +
      '</td>' +
      '<td><span class="lf-live-price">' +
      escapeHtml(formatPrice(sku && sku.price)) +
      '</span></td>' +
      '<td><span class="lf-live-market">' +
      escapeHtml(formatPrice(sku && sku.marketPrice)) +
      '</span></td>' +
      '<td>' +
      escapeHtml(String(sku && sku.stock != null ? sku.stock : 0)) +
      '</td>'
    );
  }

  function renderPagination(total) {
    if (typeof createPagination !== 'function') return;
    var totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > totalPages) page = totalPages;
    createPagination({
      containerId: 'pagination-container',
      totalItems: total,
      currentPage: page,
      pageSize: pageSize,
      pageSizeOptions: [10, 20, 50, 100],
      onPageChange: function (next) {
        page = next;
        render();
      },
      onPageSizeChange: function (size) {
        pageSize = size;
        page = 1;
        render();
      }
    });
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
    renderMeta(findSession(sessionId));

    var rows = productsOf(sessionId);
    renderPagination(rows.length);
    var start = (page - 1) * pageSize;
    var pageRows = rows.slice(start, start + pageSize);

    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="12" style="text-align:center;color:#999;padding:24px;">暂无排品，请点击「添加商品」</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (p, idx) {
        /* 序号倒序：全量排品从大到小编号 */
        var serialNo = rows.length - start - idx;
        var skus = skusOf(p);
        var first = skus[0];
        var expanded = !!expandedIds[p.id];
        var canExpand = skus.length > 1;
        var editHref = pageWithQuery('mdm_live_product_sched_edit.html', {
          id: p.id,
          sessionId: sessionId
        });
        var st = normalizeStatus(p.status);
        var canEnable = st === 'draft' || st === 'disabled';
        var canDisable = st === 'enabled';
        var ops =
          '<a href="' +
          escapeHtml(editHref) +
          '">编辑</a>' +
          (canEnable ? '<a href="#" data-act="on">启用</a>' : '') +
          (canDisable ? '<a href="#" data-act="off">禁用</a>' : '');
        var expandBtn = canExpand
          ? '<button type="button" class="lf-live-expand-btn" data-act="expand" aria-expanded="' +
            (expanded ? 'true' : 'false') +
            '" title="' +
            (expanded ? '收起规格' : '展开规格') +
            '">' +
            (expanded ? '▼' : '▶') +
            '</button>'
          : '';
        var parent =
          '<tr data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<td>' +
          serialNo +
          '</td>' +
          '<td>' +
          expandBtn +
          '<span class="lf-live-sku-id">' +
          escapeHtml(p.sku || '—') +
          '</span>' +
          '<span class="lf-live-sku-count">' +
          skus.length +
          '规格</span></td>' +
          '<td>' +
          thumbHtml(p) +
          '</td>' +
          '<td>' +
          escapeHtml(p.name) +
          '</td>' +
          '<td>' +
          escapeHtml(p.category || '—') +
          '</td>' +
          skuCells(first) +
          '<td>' +
          escapeHtml(formatAddedAt(p.addedAt)) +
          '</td>' +
          '<td><span class="' +
          statusClass(p.status) +
          '">' +
          escapeHtml(statusLabel(p.status)) +
          '</span></td>' +
          '<td class="action-links">' +
          ops +
          '</td></tr>';
        if (!canExpand || !expanded) return parent;
        var children = skus
          .slice(1)
          .map(function (sku) {
            return (
              '<tr class="lf-live-sku-child" data-parent="' +
              escapeHtml(p.id) +
              '">' +
              '<td></td><td></td><td></td><td></td><td></td>' +
              skuCells(sku) +
              '<td></td><td></td><td></td></tr>'
            );
          })
          .join('');
        return parent + children;
      })
      .join('');
  }

  function findProduct(sessionId, id) {
    var list = productsOf(sessionId);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { item: list[i], index: i, list: list };
    }
    return null;
  }

  function swap(list, i, j) {
    var tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }

  function bindEvents() {
    var sel = document.getElementById('liveSchedSession');
    var addBtn = document.getElementById('liveSchedAddBtn');
    if (sel) {
      sel.addEventListener('change', function () {
        page = 1;
        expandedIds = {};
        render();
      });
    }
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
          categoryId: (Demo.categories[0] && Demo.categories[0].id) || 'lcat-001',
          spec: '1份',
          price: 9.9,
          marketPrice: 19.9,
          stock: 100,
          status: 'draft',
          liveStatus: 'off_shelf',
          inCart: false,
          saleMode: 'preview',
          explaining: false,
          pinned: false,
          addedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          img: '',
          skus: [
            {
              id: 'sku-demo-' + Date.now().toString(36),
              specName: '1份',
              price: 9.9,
              marketPrice: 19.9,
              stock: 100,
              unit: '份',
              enabled: true
            }
          ]
        });
        page = Math.ceil(list.length / pageSize) || 1;
        render();
      });
    }

    var tbody = document.getElementById('liveSchedTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      ev.preventDefault();
      var act = actEl.getAttribute('data-act');
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var sessionId = currentSessionId();
      var id = tr.getAttribute('data-id');
      if (act === 'expand') {
        expandedIds[id] = !expandedIds[id];
        render();
        return;
      }
      var found = findProduct(sessionId, id);
      if (!found) return;
      var item = found.item;
      if (act === 'on') {
        item.status = 'enabled';
        toast('商品已启用，可在直播间上架');
        render();
        return;
      }
      if (act === 'off') {
        item.status = 'disabled';
        item.inCart = false;
        item.saleMode = 'preview';
        item.explaining = false;
        item.pinned = false;
        if (item.liveStatus && item.liveStatus !== 'off_shelf') item.liveStatus = 'off_shelf';
        toast('商品已禁用');
        render();
        return;
      }
      if (act === 'up') {
        if (found.index <= 0) return;
        swap(found.list, found.index, found.index - 1);
        render();
        return;
      }
      if (act === 'down') {
        if (found.index >= found.list.length - 1) return;
        swap(found.list, found.index, found.index + 1);
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
