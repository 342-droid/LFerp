/**
 * 直播商品 — 直播排品
 * 排品状态：草稿 / 上架 / 下架。上架不等于直接展示到直播间。
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
  var pickerTab = 'all';
  var pickerKeyword = '';
  var extraSessions = [];

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
    if (n == null || n === '') return '—';
    var v = Number(n);
    if (isNaN(v)) return '—';
    return '¥' + v.toFixed(2);
  }

  function formatAddedAt(s) {
    if (!s) return '—';
    return String(s).slice(0, 16);
  }

  function formatSessionTime(startAt, endAt) {
    function mdhm(t) {
      if (!t) return '—';
      return String(t).replace(/^\d{4}-/, '').slice(0, 11);
    }
    function hm(t) {
      if (!t) return '—';
      var m = String(t).match(/(\d{2}:\d{2})/);
      return m ? m[1] : mdhm(t);
    }
    return mdhm(startAt) + ' - ' + hm(endAt);
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
      enabled: '上架',
      disabled: '下架'
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

  function allPickerSessions() {
    return (Demo.sessions || []).concat(extraSessions);
  }

  function findSession(id) {
    var list = allPickerSessions();
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

  function padDate(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function buildExtraSessions() {
    extraSessions = [];
    var used = {};
    (Demo.sessions || []).forEach(function (s) {
      used[s.id] = true;
    });
    var names = [
      '周末生鲜特卖',
      '产地直采专场',
      '会员日闪购',
      '夜宵速达场',
      '水果拼盘专场',
      '肉禽蛋奶专场',
      '粮油干货清仓',
      '新店开业专场',
      '社群团购场',
      '午间快闪'
    ];
    var i = 0;
    while (extraSessions.length < 52) {
      var id = 'sess-pad-' + padDate(i + 1);
      if (used[id]) {
        i += 1;
        continue;
      }
      var day = 20 - (i % 18);
      extraSessions.push({
        id: id,
        name: names[i % names.length] + ' ' + padDate((i % 12) + 1) + '-' + padDate((i % 28) + 1),
        roomId: 'room-pad-' + (i % 8),
        roomName: names[i % names.length],
        status: 'ended',
        startAt: '2026-08-' + padDate(Math.max(1, day)) + ' 19:00:00',
        endAt: '2026-08-' + padDate(Math.max(1, day)) + ' 21:00:00',
        anchorName: '主播' + ((i % 6) + 1)
      });
      i += 1;
    }
  }

  function sessionSearchText(s) {
    return [s.name, s.roomName].join(' ');
  }

  function filteredPickerSessions() {
    var kw = pickerKeyword.trim().toLowerCase();
    return allPickerSessions().filter(function (s) {
      if (pickerTab !== 'all' && s.status !== pickerTab) return false;
      if (kw && sessionSearchText(s).toLowerCase().indexOf(kw) < 0) return false;
      return true;
    }).sort(function (a, b) {
      var rank = { live: 0, upcoming: 1, ended: 2 };
      var ra = rank[a.status] != null ? rank[a.status] : 9;
      var rb = rank[b.status] != null ? rank[b.status] : 9;
      if (ra !== rb) return ra - rb;
      return String(b.startAt || '').localeCompare(String(a.startAt || ''));
    });
  }

  function pickerCounts() {
    var list = allPickerSessions();
    var kw = pickerKeyword.trim().toLowerCase();
    var counts = { all: 0, live: 0, upcoming: 0, ended: 0 };
    list.forEach(function (s) {
      if (kw && sessionSearchText(s).toLowerCase().indexOf(kw) < 0) return;
      counts.all += 1;
      if (counts[s.status] != null) counts[s.status] += 1;
    });
    return counts;
  }

  function setSessionValue(id, silent) {
    var input = document.getElementById('liveSchedSession');
    var label = document.getElementById('liveSchedSessionLabel');
    if (input) input.value = id || '';
    var sess = findSession(id);
    if (label) {
      label.textContent = sess ? sess.name || sess.roomName || '—' : '请选择直播场次';
      label.classList.toggle('is-placeholder', !sess);
    }
    if (!silent) {
      page = 1;
      expandedIds = {};
      render();
    }
  }

  function closePicker() {
    var dd = document.getElementById('liveSchedSessionDd');
    var pop = document.getElementById('liveSchedSessionPop');
    var trigger = document.getElementById('liveSchedSessionTrigger');
    if (dd) dd.classList.remove('is-open');
    if (pop) pop.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function openPicker() {
    var dd = document.getElementById('liveSchedSessionDd');
    var pop = document.getElementById('liveSchedSessionPop');
    var trigger = document.getElementById('liveSchedSessionTrigger');
    var search = document.getElementById('liveSchedSessionSearch');
    if (dd) dd.classList.add('is-open');
    if (pop) pop.hidden = false;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    renderPicker();
    if (search) {
      setTimeout(function () {
        search.focus();
      }, 0);
    }
  }

  function togglePicker() {
    var dd = document.getElementById('liveSchedSessionDd');
    if (dd && dd.classList.contains('is-open')) closePicker();
    else openPicker();
  }

  function renderPicker() {
    var tabsEl = document.getElementById('liveSchedSessionTabs');
    var listEl = document.getElementById('liveSchedSessionList');
    if (!tabsEl || !listEl) return;
    var counts = pickerCounts();
    var tabs = [
      { key: 'all', label: '全部' },
      { key: 'live', label: '直播中' },
      { key: 'upcoming', label: '未开始' },
      { key: 'ended', label: '已结束' }
    ];
    tabsEl.innerHTML = tabs
      .map(function (t) {
        return (
          '<button type="button" class="lf-live-sess-dd__tab' +
          (pickerTab === t.key ? ' is-active' : '') +
          '" data-tab="' +
          t.key +
          '">' +
          escapeHtml(t.label) +
          ' (' +
          (counts[t.key] || 0) +
          ')</button>'
        );
      })
      .join('');

    var rows = filteredPickerSessions();
    var currentId = currentSessionId();
    if (!rows.length) {
      listEl.innerHTML = '<div class="lf-live-sess-dd__empty">没有匹配的直播场次</div>';
      return;
    }
    listEl.innerHTML = rows
      .map(function (s) {
        return (
          '<div class="lf-live-sess-dd__item' +
          (s.id === currentId ? ' is-current' : '') +
          '" data-id="' +
          escapeHtml(s.id) +
          '" role="option">' +
          '<div class="lf-live-sess-dd__item-main">' +
          '<div class="lf-live-sess-dd__item-name">' +
          escapeHtml(s.name || s.roomName || '—') +
          '</div>' +
          '<div class="lf-live-sess-dd__item-time">' +
          escapeHtml(s.startAt || '—') +
          '</div></div>' +
          '<span class="' +
          sessionBadgeClass(s.status) +
          '">' +
          escapeHtml(sessionStatusLabel(s.status)) +
          '</span></div>'
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
        var serialNo = start + idx + 1;
        var skus = skusOf(p);
        var first = skus[0];
        var expanded = !!expandedIds[p.id];
        var canExpand = skus.length > 1;
        var editHref = pageWithQuery('mdm_live_product_sched_edit.html', {
          id: p.id,
          sessionId: sessionId
        });
        var globalIndex = start + idx;
        var ops =
          '<button type="button" class="lf-live-sort-btn" data-act="up" title="上移"' +
          (globalIndex <= 0 ? ' disabled' : '') +
          '>▲</button>' +
          '<button type="button" class="lf-live-sort-btn" data-act="down" title="下移"' +
          (globalIndex >= rows.length - 1 ? ' disabled' : '') +
          '>▼</button>' +
          '<div class="product-action">' +
          '<a class="product-action__link" href="' +
          escapeHtml(editHref) +
          '">编辑</a>' +
          renderMoreMenu(p) +
          '</div>';
        var expandBtn = canExpand
          ? '<button type="button" class="lf-live-expand-btn" data-act="expand" aria-expanded="' +
            (expanded ? 'true' : 'false') +
            '" title="' +
            (expanded ? '收起规格' : '展开规格') +
            '">' +
            (expanded ? '∧' : '∨') +
            '</button>'
          : '';
        var specCount = canExpand
          ? '<span class="lf-live-sku-count">' + skus.length + ' 规格</span>'
          : '';
        var parent =
          '<tr data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<td>' +
          serialNo +
          '</td>' +
          '<td class="lf-live-code-cell"><div class="lf-live-code-row">' +
          expandBtn +
          '<span class="lf-live-sku-id">' +
          escapeHtml(p.sku || '—') +
          '</span></div>' +
          specCount +
          '</td>' +
          '<td>' +
          thumbHtml(p) +
          '</td>' +
          '<td>' +
          escapeHtml(p.name) +
          '</td>' +
          '<td>' +
          escapeHtml(p.category || '') +
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

  function closeAllMoreMenus() {
    document.querySelectorAll('.lf-live-sched-page .product-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  /* 与代采/商城「更多」一致：草稿/下架可删 SPU；上架中只下架 */
  function renderMoreMenu(p) {
    var st = normalizeStatus(p.status);
    var items = [];
    if (st === 'draft') {
      items.push({ act: 'on', label: '上架', danger: false });
      items.push({ act: 'delete', label: '删除', danger: true });
    } else if (st === 'enabled') {
      items.push({ act: 'off', label: '下架', danger: false });
    } else if (st === 'disabled') {
      items.push({ act: 'on', label: '上架', danger: false });
      items.push({ act: 'delete', label: '删除', danger: true });
    }
    var menuHtml = items
      .map(function (entry) {
        var cls = 'product-more__item' + (entry.danger ? ' product-more__item--danger' : ' product-more__item--primary');
        return (
          '<button type="button" class="' +
          cls +
          '" data-act="' +
          entry.act +
          '">' +
          entry.label +
          '</button>'
        );
      })
      .join('');
    return (
      '<div class="product-more" data-more-wrap>' +
      '<button type="button" class="product-more__btn" data-more-toggle>更多 <span class="product-more__caret">▼</span></button>' +
      '<div class="product-more__menu">' +
      menuHtml +
      '</div></div>'
    );
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

  function nowStamp() {
    var now = new Date();
    return (
      now.getFullYear() +
      '-' +
      padDate(now.getMonth() + 1) +
      '-' +
      padDate(now.getDate()) +
      ' ' +
      padDate(now.getHours()) +
      ':' +
      padDate(now.getMinutes()) +
      ':' +
      padDate(now.getSeconds())
    );
  }

  function getAddedCodesMap() {
    var map = {};
    productsOf(currentSessionId()).forEach(function (p) {
      if (p.sku) map[p.sku] = true;
    });
    return map;
  }

  function libraryItemToSchedProduct(item, sessionId) {
    var price = Number(item.price);
    if (isNaN(price) || price <= 0) price = 0.01;
    return {
      id: 'lp-' + Date.now().toString(36) + '-' + item.code,
      sessionId: sessionId,
      sku: item.code,
      name: item.name || item.code,
      category: '',
      categoryId: '',
      spec: '默认规格',
      price: price,
      marketPrice: null,
      stock: 100,
      status: 'draft',
      liveStatus: 'off_shelf',
      inCart: false,
      saleMode: 'preview',
      explaining: false,
      pinned: false,
      addedAt: nowStamp(),
      img: item.img || '',
      fromLibrary: true,
      skus: [
        {
          id: item.code + '-sku',
          specName: '默认规格',
          price: price,
          marketPrice: null,
          stock: 100,
          unit: '份',
          enabled: true
        }
      ]
    };
  }

  function persistLiveCatalogCodes() {
    var codes = [];
    var seen = {};
    var map = Demo.productsBySession || {};
    Object.keys(map).forEach(function (sid) {
      (map[sid] || []).forEach(function (p) {
        var code = p && (p.sku || p.code || p.goodsId);
        if (!code || seen[code]) return;
        seen[code] = true;
        codes.push(code);
      });
    });
    try {
      sessionStorage.setItem('mdm_live_sched_catalog_codes_v1', JSON.stringify(codes));
    } catch (e) { /* ignore */ }
  }

  function addProductsFromLibrary(items) {
    if (!items || !items.length) return 0;
    var sessionId = currentSessionId();
    var list = productsOf(sessionId);
    var addedCodes = getAddedCodesMap();
    var count = 0;
    items.forEach(function (item) {
      if (!item || !item.code || addedCodes[item.code]) return;
      list.unshift(libraryItemToSchedProduct(item, sessionId));
      addedCodes[item.code] = true;
      count += 1;
    });
    if (count) {
      page = 1;
      persistLiveCatalogCodes();
      render();
    }
    return count;
  }

  function openLibraryDrawer() {
    if (!window.MdmProxyLibraryDrawer) {
      toast('商品库组件未加载', 'warning');
      return;
    }
    if (!window.MdmMallProductLibrary) {
      toast('商品库数据未加载', 'warning');
      return;
    }
    window.MdmProxyLibraryDrawer.open({
      addedCodes: getAddedCodesMap(),
      footerTip: '此处仅将商品库中的商品加入本场直播排品，不会修改商品库主数据',
      onConfirm: function (picked) {
        var count = addProductsFromLibrary(picked);
        toast(count ? '已添加 ' + count + ' 件商品，请编辑完善后再上架' : '未添加新商品', count ? 'success' : 'info');
      }
    });
  }

  function bindEvents() {
    var trigger = document.getElementById('liveSchedSessionTrigger');
    var pop = document.getElementById('liveSchedSessionPop');
    var search = document.getElementById('liveSchedSessionSearch');
    var tabs = document.getElementById('liveSchedSessionTabs');
    var list = document.getElementById('liveSchedSessionList');
    var addBtn = document.getElementById('liveSchedAddBtn');

    if (trigger) {
      trigger.addEventListener('click', function (ev) {
        ev.stopPropagation();
        togglePicker();
      });
    }
    if (search) {
      search.addEventListener('input', function () {
        pickerKeyword = search.value || '';
        renderPicker();
      });
    }
    if (tabs) {
      tabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-tab]');
        if (!btn) return;
        pickerTab = btn.getAttribute('data-tab') || 'all';
        renderPicker();
      });
    }
    if (list) {
      list.addEventListener('click', function (ev) {
        var item = ev.target.closest('[data-id]');
        if (!item) return;
        setSessionValue(item.getAttribute('data-id'));
        closePicker();
      });
    }
    document.addEventListener('click', function (ev) {
      var dd = document.getElementById('liveSchedSessionDd');
      if (!dd || !dd.classList.contains('is-open')) return;
      if (dd.contains(ev.target)) return;
      closePicker();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      closePicker();
      if (window.MdmProxyLibraryDrawer) window.MdmProxyLibraryDrawer.close();
    });

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (!currentSessionId()) {
          toast('请先选择直播场次', 'warning');
          return;
        }
        openLibraryDrawer();
      });
    }

    document.addEventListener('click', function (ev) {
      var toggle = ev.target.closest('.lf-live-sched-page [data-more-toggle]');
      if (toggle) {
        ev.preventDefault();
        ev.stopPropagation();
        var wrap = toggle.closest('.product-more');
        if (!wrap) return;
        var open = wrap.classList.contains('is-open');
        closeAllMoreMenus();
        if (!open) wrap.classList.add('is-open');
        return;
      }
      if (!ev.target.closest('.lf-live-sched-page .product-more')) closeAllMoreMenus();
    });

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
        closeAllMoreMenus();
        item.status = 'enabled';
        toast('商品已上架，可在中控添加到直播商品');
        render();
        return;
      }
      if (act === 'off') {
        closeAllMoreMenus();
        item.status = 'disabled';
        item.inCart = false;
        item.saleMode = 'preview';
        item.explaining = false;
        item.pinned = false;
        if (item.liveStatus && item.liveStatus !== 'off_shelf') item.liveStatus = 'off_shelf';
        toast('商品已下架');
        render();
        return;
      }
      if (act === 'delete') {
        closeAllMoreMenus();
        var st = normalizeStatus(item.status);
        if (st !== 'draft' && st !== 'disabled') {
          toast('上架中的商品请先下架再删除', 'warning');
          return;
        }
        found.list.splice(found.index, 1);
        delete expandedIds[id];
        persistLiveCatalogCodes();
        toast('已删除');
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

  function initDefaultSession() {
    var params = new URLSearchParams(window.location.search || '');
    var preset = params.get('sessionId') || '';
    if (preset && findSession(preset)) {
      setSessionValue(preset, true);
      return;
    }
    var prefer = findSession('sess-ert') || allPickerSessions().filter(function (s) {
      return s.status === 'live';
    })[0];
    if (prefer) setSessionValue(prefer.id, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildExtraSessions();
    initDefaultSession();
    bindEvents();
    persistLiveCatalogCodes();
    render();
    renderPicker();
  });
})();
