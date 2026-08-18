/**
 * 直播管理 — 直播中控工作台
 * 直播商品：从上架排品中添加（添加时选择上架 / 预告，默认上架）；上架 / 预告、置顶（仅 1 个，低于讲解）、讲解（默认置顶）、
 * SKU 库存（需保存）/ 上下架、展示序号、上移下移。
 * 预告：C 端展示商品预告但不可购买；上架：C 端可正常下单。
 * 直播商品上下架只控制 C 端小黄车是否展示，不改直播排品上下架。
 * 直播排品 tab：仅展示已上架且未加入直播商品的排品。
 * 弹幕：点击可禁言（本场）、回复、屏蔽（C 端不展示该条）。
 * 观看记录：当前在线 / 累计观看 / 观看人次。
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

  var QUICK_REPLIES = ['欢迎来到直播间～', '这款正在讲解，库存有限先拍', '下单备注自提门店即可'];

  var sessionId = '';
  var mainTab = 'product';
  var productTab = 'cart';
  var sideTab = 'metrics';
  var watchTab = 'online';
  var watchSortDesc = true;
  var watchStatusFilter = '';
  var danmuMenuTarget = null;
  var expandedIds = {};
  var virtualUser = '';
  var schedFilter = { name: '', sku: '', category: '' };
  var cartFilter = { name: '', sku: '' };
  var pendingStock = {};
  var selectedCart = {};
  var selectedSched = {};
  var pendingAddIds = [];
  var C_STATE_KEY = 'lf_live_c_state_v1';

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

  function qs(name) {
    return new URLSearchParams(window.location.search || '').get(name) || '';
  }

  function findSession(id) {
    for (var i = 0; i < Demo.sessions.length; i++) {
      if (Demo.sessions[i].id === id) return Demo.sessions[i];
    }
    return null;
  }

  function productsOf(id) {
    if (!id) return [];
    if (!Demo.productsBySession[id]) Demo.productsBySession[id] = [];
    return Demo.productsBySession[id];
  }

  function metricsOf(id) {
    if (!Demo.controlMetrics[id]) {
      Demo.controlMetrics[id] = {
        viewers: 0,
        totalViews: 0,
        peakViewers: 0,
        likes: 0,
        orderCount: 0,
        orderGmv: 0,
        salesAmount: 0,
        muted: false,
        mutedUsers: {},
        recentOrders: [],
        chatMessages: [],
        watchViewers: [],
        watchVisits: [],
        watchRecords: [],
        visitCount: 0
      };
    }
    var m = Demo.controlMetrics[id];
    if (!m.chatMessages) m.chatMessages = [];
    if (!m.watchRecords) m.watchRecords = [];
    if (!m.recentOrders) m.recentOrders = [];
    if (!m.mutedUsers) m.mutedUsers = {};
    if (!m.watchViewers) m.watchViewers = [];
    if (!m.watchVisits) m.watchVisits = [];
    if (!m.watchViewers.length && m.watchRecords.length) {
      m.watchViewers = m.watchRecords.map(function (w, i) {
        return {
          id: w.id || 'wv-' + i,
          userId: w.userId || w.id || 'u-' + i,
          nickname: w.nickname || '匿名用户',
          lastEnterTime: w.enterTime || '',
          enterCount: w.enterCount || 1,
          totalDuration: w.duration || w.totalDuration || '',
          online: w.online !== false,
          muted: !!w.muted
        };
      });
    }
    return m;
  }

  function avatarHue(name) {
    var hue = 0;
    var s = String(name || '');
    for (var i = 0; i < s.length; i++) hue += s.charCodeAt(i);
    return hue % 360;
  }

  function avatarHtml(name) {
    var n = name || '匿';
    return (
      '<span class="lf-live-avatar" style="background:hsl(' +
      avatarHue(n) +
      ',58%,52%)">' +
      escapeHtml(n.charAt(0)) +
      '</span>'
    );
  }

  function chatUserKey(userId, nickname) {
    return userId || nickname || '';
  }

  function isUserMuted(m, userId, nickname) {
    var map = (m && m.mutedUsers) || {};
    if (userId && map[userId]) return true;
    if (nickname && map[nickname]) return true;
    return false;
  }

  function setUserMuted(userId, nickname, on) {
    var m = metricsOf(sessionId);
    m.mutedUsers = m.mutedUsers || {};
    var key = chatUserKey(userId, nickname);
    if (!key) return;
    if (on) {
      m.mutedUsers[key] = true;
      if (userId) m.mutedUsers[userId] = true;
    } else {
      delete m.mutedUsers[key];
      if (userId) delete m.mutedUsers[userId];
      if (nickname) delete m.mutedUsers[nickname];
    }
    (m.watchViewers || []).forEach(function (v) {
      if ((userId && v.userId === userId) || (nickname && v.nickname === nickname)) {
        v.muted = !!on;
      }
    });
  }

  function findChatById(id) {
    var msgs = metricsOf(sessionId).chatMessages || [];
    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i].id === id) return msgs[i];
    }
    return null;
  }

  function closeDanmuMenu() {
    var menu = document.getElementById('danmuActMenu');
    if (menu) menu.hidden = true;
    danmuMenuTarget = null;
  }

  function openDanmuMenu(ev, msg) {
    if (!msg || msg.isSys) return;
    ev.preventDefault();
    ev.stopPropagation();
    var menu = document.getElementById('danmuActMenu');
    if (!menu) return;
    danmuMenuTarget = msg;
    var muted = isUserMuted(metricsOf(sessionId), msg.userId, msg.user);
    var muteBtn = document.getElementById('danmuActMute');
    var blockBtn = document.getElementById('danmuActBlock');
    if (muteBtn) {
      muteBtn.hidden = !!(msg.isAnchor || msg.isSys);
      muteBtn.textContent = muted ? '恢复' : '禁言';
    }
    if (blockBtn) {
      blockBtn.textContent = msg.blocked ? '取消屏蔽' : '屏蔽';
    }
    menu.hidden = false;
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = menu.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8;
    menu.style.left = Math.max(8, x) + 'px';
    menu.style.top = Math.max(8, y) + 'px';
  }

  function timeSortValue(s) {
    return String(s || '');
  }

  function normalizeSchedStatus(st) {
    if (typeof Demo.normalizeSchedStatus === 'function') return Demo.normalizeSchedStatus(st);
    if (st === 'enabled' || st === 'on_shelf' || st === 'listing') return 'enabled';
    if (st === 'disabled' || st === 'off_shelf' || st === 'delisting') return 'disabled';
    return 'draft';
  }

  function ensureControlFields(p, index) {
    if (p.inCart == null) {
      p.inCart =
        p.liveStatus === 'explaining' ||
        p.liveStatus === 'displaying' ||
        p.liveStatus === 'selling' ||
        p.liveStatus === 'preview';
    }
    if (p.saleMode == null) {
      if (p.spuOn === true || (p.inCart && p.liveStatus && p.liveStatus !== 'off_shelf' && p.liveStatus !== 'preview')) {
        p.saleMode = 'selling';
      } else {
        p.saleMode = 'preview';
      }
    }
    if (p.explaining == null) p.explaining = p.liveStatus === 'explaining';
    if (p.pinned == null) p.pinned = false;
    if (p.cartSort == null) p.cartSort = index + 1;
    if (p.previewPriceMode == null) p.previewPriceMode = 'sale';
  }

  function skusOf(p) {
    if (p.skus && p.skus.length) return p.skus;
    return [
      {
        id: (p.id || 'x') + '-sku',
        specName: p.spec || '默认规格',
        price: p.price,
        marketPrice: p.marketPrice,
        stock: p.stock,
        enabled: true
      }
    ];
  }

  function displayStock(p, sku) {
    var bag = pendingStock[p.id];
    if (bag && Object.prototype.hasOwnProperty.call(bag, sku.id)) return bag[sku.id];
    return sku.stock != null ? sku.stock : 0;
  }

  function syncLiveStatus(p) {
    if (p.saleMode === 'preview') {
      p.liveStatus = p.explaining ? 'explaining' : 'preview';
      return;
    }
    if (p.explaining) {
      p.liveStatus = 'explaining';
      return;
    }
    var skus = skusOf(p);
    var onSkus = skus.filter(function (s) {
      return s.enabled !== false;
    });
    var stock = onSkus.reduce(function (sum, s) {
      return sum + (Number(s.stock) || 0);
    }, 0);
    p.stock = stock;
    if (!onSkus.length || stock <= 0) {
      p.liveStatus = 'sold_out';
      return;
    }
    p.liveStatus = 'selling';
  }

  function statusLabel(st) {
    if (st === 'live') return '直播中';
    if (st === 'upcoming') return '未开始';
    if (st === 'ended') return '已结束';
    return st || '—';
  }

  function statusBadgeClass(st) {
    if (st === 'live') return 'lf-live-badge lf-live-badge--live';
    if (st === 'upcoming') return 'lf-live-badge lf-live-badge--warn';
    return 'lf-live-badge lf-live-badge--muted';
  }

  function formatMoney(n) {
    var v = Number(n);
    if (isNaN(v)) return '¥0.00';
    return '¥' + v.toFixed(2);
  }

  function formatNum(n) {
    var v = Number(n) || 0;
    if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
    return String(v);
  }

  function formatSessionTime(startAt, endAt) {
    function short(t) {
      if (!t) return '—';
      return String(t).replace(/^\d{4}-/, '').slice(0, 11);
    }
    return short(startAt) + ' - ' + short(endAt);
  }

  function nowTime() {
    return new Date().toTimeString().slice(0, 8);
  }

  function fillSessionSelect(preset) {
    var sel = document.getElementById('controlSessionSelect');
    if (!sel) return;
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

  function fillCategoryFilter() {
    var sel = document.getElementById('schedFilterCategory');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">全部类目</option>' +
      (Demo.categories || [])
        .map(function (c) {
          return '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
        })
        .join('');
  }

  function enterSession(id) {
    if (!id || !findSession(id)) {
      toast('请选择直播场次', 'warning');
      return;
    }
    var url = wp.page('mdm_live_control.html') + '?sessionId=' + encodeURIComponent(id);
    window.history.replaceState(null, '', url);
    sessionId = id;
    expandedIds = {};
    render();
  }

  function allCartProducts() {
    var list = productsOf(sessionId);
    list.forEach(ensureControlFields);
    return list
      .filter(function (p) {
        return !!p.inCart;
      })
      .sort(compareCart);
  }

  function cartProducts() {
    return allCartProducts().filter(function (p) {
      if (cartFilter.name && String(p.name || '').indexOf(cartFilter.name) < 0) return false;
      if (cartFilter.sku && String(p.sku || '').indexOf(cartFilter.sku) < 0) return false;
      return true;
    });
  }

  function updateCartCount() {
    var n = allCartProducts().length;
    var tab = document.getElementById('controlCartTabBtn');
    var count = document.getElementById('controlCartCount');
    if (tab) tab.textContent = '直播商品(' + n + ')';
    if (count) count.textContent = '共 ' + n + ' 件';
  }

  function compareCart(a, b) {
    if (a.explaining && !b.explaining) return -1;
    if (!a.explaining && b.explaining) return 1;
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (a.cartSort || 0) - (b.cartSort || 0);
  }

  function schedProducts() {
    var list = productsOf(sessionId);
    list.forEach(ensureControlFields);
    return list.filter(function (p) {
      if (p.inCart) return false;
      if (normalizeSchedStatus(p.status) !== 'enabled') return false;
      if (schedFilter.name && String(p.name || '').indexOf(schedFilter.name) < 0) return false;
      if (schedFilter.sku && String(p.sku || '').indexOf(schedFilter.sku) < 0) return false;
      if (schedFilter.category && String(p.categoryId || '') !== schedFilter.category) return false;
      return true;
    });
  }

  function findProduct(id) {
    var list = productsOf(sessionId);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { item: list[i], index: i, list: list };
    }
    return null;
  }

  function findSku(p, skuId) {
    var skus = skusOf(p);
    for (var i = 0; i < skus.length; i++) {
      if (skus[i].id === skuId) return skus[i];
    }
    return null;
  }

  function nextCartSort() {
    var max = 0;
    allCartProducts().forEach(function (p) {
      if ((p.cartSort || 0) > max) max = p.cartSort;
    });
    return max + 1;
  }

  function normalizeSaleMode(mode) {
    return mode === 'preview' ? 'preview' : 'selling';
  }

  function saleModeLabel(mode) {
    return normalizeSaleMode(mode) === 'selling' ? '上架' : '预告';
  }

  function addToCart(p, saleMode) {
    ensureControlFields(p, 0);
    p.inCart = true;
    p.saleMode = normalizeSaleMode(saleMode);
    p.explaining = false;
    p.pinned = false;
    p.pendingAdd = null;
    p.removeAt = null;
    p.previewPriceMode = p.previewPriceMode || 'sale';
    p.cartSort = nextCartSort();
    syncLiveStatus(p);
    compactCartSort();
  }

  function removeFromCart(p) {
    p.inCart = false;
    p.saleMode = 'preview';
    p.explaining = false;
    p.pinned = false;
    p.removeAt = null;
    delete pendingStock[p.id];
    delete selectedCart[p.id];
    syncLiveStatus(p);
    compactCartSort();
  }

  function formatClock(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function toLocalInput(ts) {
    var d = new Date(ts);
    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes())
    );
  }

  function processScheduled() {
    var sess = findSession(sessionId);
    var now = Date.now();
    var changed = false;
    productsOf(sessionId).forEach(function (p) {
      ensureControlFields(p, 0);
      if (p.inCart && p.removeAt && now >= p.removeAt) {
        removeFromCart(p);
        changed = true;
      }
      if (!p.inCart && p.pendingAdd) {
        var pendingMode = p.pendingAdd.saleMode;
        if (p.pendingAdd.type === 'at' && p.pendingAdd.at && now >= p.pendingAdd.at) {
          addToCart(p, pendingMode);
          changed = true;
        } else if (p.pendingAdd.type === 'on_live_start' && sess && sess.status === 'live') {
          addToCart(p, pendingMode);
          changed = true;
        }
      }
    });
    return changed;
  }

  function priceBlock(p) {
    var html = '<span class="lf-live-cart-card__sale">' + escapeHtml(formatMoney(p.price)) + '</span>';
    if (p.marketPrice != null && Number(p.marketPrice) > 0) {
      html += '<span class="lf-live-cart-card__market">' + escapeHtml(formatMoney(p.marketPrice)) + '</span>';
    }
    return '<div class="lf-live-cart-card__prices">' + html + '</div>';
  }

  function selectedCartIds() {
    return Object.keys(selectedCart).filter(function (id) {
      return selectedCart[id];
    });
  }

  function selectedSchedIds() {
    return Object.keys(selectedSched).filter(function (id) {
      return selectedSched[id];
    });
  }

  function clearExplainExcept(keepId) {
    productsOf(sessionId).forEach(function (p) {
      if (p.id !== keepId) p.explaining = false;
    });
  }

  function clearPinExcept(keepId) {
    productsOf(sessionId).forEach(function (p) {
      if (p.id !== keepId) p.pinned = false;
    });
  }

  function thumbHtml(item, seq) {
    var name = String(item.name || '商');
    var ch = name.charAt(0);
    var hue = 0;
    for (var i = 0; i < name.length; i++) hue += name.charCodeAt(i);
    hue = 18 + (hue % 40);
    var inner = item.img
      ? '<span class="lf-live-thumb"><img src="' + escapeHtml(item.img) + '" alt=""></span>'
      : '<span class="lf-live-thumb lf-live-thumb--ph" style="--ph-hue:' +
        hue +
        '">' +
        '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="21" r="3" fill="currentColor"/><path d="M12 32l8-8 6 6 5-5 5 7H12z" fill="currentColor" opacity=".45"/></svg>' +
        '<em>' +
        escapeHtml(ch) +
        '</em></span>';
    var badge =
      seq != null
        ? '<span class="lf-live-thumb-seq">' + escapeHtml(String(seq)) + '</span>'
        : '';
    return '<span class="lf-live-thumb-wrap">' + badge + inner + '</span>';
  }

  function syncCState() {
    var explaining = null;
    var previewMode = 'sale';
    allCartProducts().forEach(function (p) {
      if (p.explaining && !explaining) {
        explaining = {
          name: p.name,
          price: p.price,
          marketPrice: p.marketPrice,
          previewPriceMode: p.previewPriceMode || 'sale',
          saleMode: p.saleMode,
          img: p.img || ''
        };
        if (p.saleMode === 'preview') previewMode = p.previewPriceMode || 'sale';
      }
    });
    if (!explaining || explaining.saleMode !== 'preview') {
      allCartProducts().some(function (p) {
        if (p.saleMode !== 'preview') return false;
        previewMode = p.previewPriceMode || 'sale';
        return true;
      });
    }
    try {
      localStorage.setItem(
        C_STATE_KEY,
        JSON.stringify({
          explaining: explaining,
          previewPriceMode: previewMode,
          chatMessages: (metricsOf(sessionId).chatMessages || []).map(function (m) {
            return {
              id: m.id,
              userId: m.userId || '',
              user: m.user,
              text: m.text,
              time: m.time || '',
              isAnchor: !!m.isAnchor,
              isSys: !!m.isSys,
              blocked: !!m.blocked
            };
          }),
          mutedUserIds: Object.keys(metricsOf(sessionId).mutedUsers || {}).filter(function (k) {
            return !!(metricsOf(sessionId).mutedUsers || {})[k];
          }),
          muted: !!metricsOf(sessionId).muted,
          cViewerText: (function () {
            var sess = findSession(sessionId);
            if (!sess || typeof Demo.formatCViewerText !== 'function') return '';
            var cfg = Demo.normalizeCViewerConfig(sess);
            return Demo.formatCViewerText(Demo.resolveCViewerCount(sess, metricsOf(sessionId)), cfg.display);
          })()
        })
      );
    } catch (e) {}
  }

  function compactCartSort() {
    var list = productsOf(sessionId)
      .filter(function (p) {
        return !!p.inCart;
      })
      .sort(function (a, b) {
        return (a.cartSort || 0) - (b.cartSort || 0);
      });
    list.forEach(function (p, i) {
      p.cartSort = i + 1;
    });
    return list;
  }

  function insertCartAt(p, targetSeq) {
    var list = compactCartSort();
    var n = list.length;
    if (!n) return false;
    if (targetSeq === '' || targetSeq == null) return false;
    var to = Math.floor(Number(targetSeq));
    if (!isFinite(to)) return false;
    to = Math.max(1, Math.min(n, to));
    var from = p.cartSort;
    if (from === to) return false;
    var ordered = list.filter(function (item) {
      return item.id !== p.id;
    });
    ordered.splice(to - 1, 0, p);
    ordered.forEach(function (item, i) {
      item.cartSort = i + 1;
    });
    return true;
  }

  function setActiveTab(rootId, attr, value) {
    var root = document.getElementById(rootId);
    if (!root) return;
    root.querySelectorAll('[' + attr + ']').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === value);
    });
  }

  function renderHeader(sess) {
    var pickerTitle = document.getElementById('controlPickerTitle');
    var meta = document.getElementById('controlSessionMeta');
    var actions = document.getElementById('controlTopActions');
    var badge = document.getElementById('controlStatusBadge');
    var startBtn = document.getElementById('btnStartLive');
    var stopBtn = document.getElementById('btnStopLive');
    var push = document.getElementById('broadcastPushUrl');

    if (!sess) {
      if (pickerTitle) pickerTitle.hidden = false;
      if (meta) meta.hidden = true;
      if (actions) actions.hidden = true;
      return;
    }

    if (pickerTitle) pickerTitle.hidden = true;
    if (meta) {
      meta.hidden = false;
      meta.innerHTML =
        '<span>直播名称：<b>' +
        escapeHtml(sess.name || '—') +
        '</b></span>' +
        '<span>主播：<b>' +
        escapeHtml(sess.anchorName || '—') +
        '</b></span>' +
        '<span>开播时间：<b>' +
        escapeHtml(formatSessionTime(sess.startAt, sess.endAt)) +
        '</b></span>' +
        '<span>直播场次ID：<b>' +
        escapeHtml(sess.id || '—') +
        '</b></span>';
    }
    if (actions) actions.hidden = false;
    if (badge) {
      badge.className = statusBadgeClass(sess.status);
      badge.textContent = statusLabel(sess.status);
    }
    if (startBtn) {
      startBtn.hidden = sess.status === 'live' || sess.status === 'ended';
      startBtn.disabled = !sess || sess.status === 'ended';
    }
    if (stopBtn) {
      stopBtn.hidden = sess.status !== 'live';
      stopBtn.disabled = sess.status !== 'live';
    }
    if (push) push.value = sess.pushUrl || '';
  }

  function renderBroadcast(sess) {
    var preview = document.getElementById('broadcastPreview');
    var live = sess && sess.status === 'live';
    if (preview) {
      preview.classList.toggle('is-live', !!live);
      var ph = preview.querySelector('.lf-live-broadcast-preview__placeholder');
      if (ph) ph.textContent = live ? '直播画面' : '直播画面';
    }
    var muteBtn = document.getElementById('btnMuteChat');
    var muted = !!(metricsOf(sess.id).muted);
    if (muteBtn) {
      muteBtn.classList.toggle('is-on', muted);
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      muteBtn.textContent = muted ? '已禁言' : '禁言';
    }
    renderDanmuOverlay(sess);
  }

  function renderDanmuOverlay(sess) {
    var box = document.getElementById('broadcastDanmu');
    if (!box) return;
    var msgs = (metricsOf(sess.id).chatMessages || []).filter(function (m) {
      return !m.isSys && !m.blocked;
    });
    var last = msgs.slice(-8);
    box.innerHTML = last
      .map(function (m) {
        return (
          '<div class="lf-live-danmu-overlay__item" data-chat-id="' +
          escapeHtml(m.id) +
          '"><b>' +
          escapeHtml(m.user) +
          '</b> ' +
          escapeHtml(m.text) +
          '</div>'
        );
      })
      .join('');
  }

  function productBadges(p) {
    var html = '';
    if (p.explaining) html += '<span class="lf-live-badge lf-live-badge--live">讲解中</span>';
    else if (p.pinned) html += '<span class="lf-live-badge lf-live-badge--ok">置顶</span>';
    if (p.saleMode === 'preview') html += '<span class="lf-live-badge lf-live-badge--muted">预告</span>';
    else if (p.liveStatus === 'sold_out') html += '<span class="lf-live-badge lf-live-badge--danger">售罄</span>';
    else html += '<span class="lf-live-badge lf-live-badge--warn">上架</span>';
    return html;
  }

  function renderCart() {
    var box = document.getElementById('controlCartList');
    if (!box) return;
    updateCartCount();
    var list = cartProducts();
    var total = allCartProducts().length;
    var allEl = document.getElementById('cartSelectAll');
    if (allEl) {
      allEl.checked = total > 0 && list.every(function (p) {
        return selectedCart[p.id];
      });
    }
    if (!total) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无直播商品，请从直播排品中添加</div>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">没有符合条件的直播商品</div>';
      return;
    }
    box.innerHTML = list
      .map(function (p) {
        var skus = skusOf(p);
        var expanded = !!expandedIds[p.id];
        var selling = p.saleMode !== 'preview';
        var previewMode = p.previewPriceMode || 'sale';
        var skuRows = skus
          .map(function (sku) {
            var on = sku.enabled !== false;
            return (
              '<div class="lf-live-cart-sku" data-sku-id="' +
              escapeHtml(sku.id) +
              '">' +
              '<span class="lf-live-cart-sku__spec">' +
              escapeHtml(sku.specName || '默认规格') +
              '</span>' +
              '<span class="lf-live-cart-sku__price">' +
              escapeHtml(formatMoney(sku.price)) +
              '</span>' +
              '<label class="lf-live-cart-sku__stock">库存 ' +
              '<input class="erp-input" type="number" min="0" data-stock-input value="' +
              escapeHtml(String(displayStock(p, sku))) +
              '"></label>' +
              '<button type="button" class="erp-btn erp-btn--primary" data-act="sku-save">保存</button>' +
              '<button type="button" class="erp-btn" data-act="sku-toggle">' +
              (on ? '下架 SKU' : '上架 SKU') +
              '</button></div>'
            );
          })
          .join('');
        var skuBlock = expanded ? '<div class="lf-live-cart-skus">' + skuRows + '</div>' : '';
        var previewRow = selling
          ? ''
          : '<div class="lf-live-preview-price">预告价格展示 ' +
            '<button type="button" data-act="preview-price" data-mode="question"' +
            (previewMode === 'question' ? ' class="is-mode-on"' : '') +
            '>问号</button>' +
            '<button type="button" data-act="preview-price" data-mode="market"' +
            (previewMode === 'market' ? ' class="is-mode-on"' : '') +
            '>划线价</button>' +
            '<button type="button" data-act="preview-price" data-mode="sale"' +
            (previewMode === 'sale' ? ' class="is-mode-on"' : '') +
            '>售价</button></div>';
        var extraHint = '';
        if (p.removeAt) extraHint += '<div class="lf-live-card-hint">将于 ' + escapeHtml(formatClock(p.removeAt)) + ' 下架</div>';
        return (
          '<div class="lf-live-cart-card" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="lf-live-cart-card__main">' +
          '<input type="checkbox" class="lf-live-card-check" data-act="select"' +
          (selectedCart[p.id] ? ' checked' : '') +
          '>' +
          thumbHtml(p, p.cartSort || 1) +
          '<div class="lf-live-cart-card__info">' +
          '<div class="lf-live-cart-card__name">' +
          escapeHtml(p.name) +
          ' ' +
          productBadges(p) +
          '</div>' +
          '<div class="lf-live-cart-card__code">' +
          escapeHtml(p.sku || '—') +
          '</div>' +
          priceBlock(p) +
          '</div></div>' +
          previewRow +
          extraHint +
          '<div class="lf-live-cart-card__ops">' +
          '<span class="lf-live-ops-group">' +
          '<button type="button" data-act="sale-mode" data-mode="selling"' +
          (selling ? ' class="is-mode-on"' : '') +
          '>上架</button>' +
          '<button type="button" data-act="sale-mode" data-mode="preview"' +
          (selling ? '' : ' class="is-mode-on"') +
          '>预告</button>' +
          '<button type="button" data-act="remove">下架</button></span>' +
          '<button type="button" data-act="pin">' +
          (p.pinned ? '取消置顶' : '置顶') +
          '</button>' +
          '<button type="button" data-act="explain">' +
          (p.explaining ? '取消讲解' : '讲解') +
          '</button>' +
          '<span class="lf-live-sort-group">' +
          '<span class="lf-live-sort-group__label">排序</span>' +
          '<input class="lf-live-seq-input" data-seq-input type="number" min="1" max="' +
          total +
          '" value="' +
          escapeHtml(String(p.cartSort || 1)) +
          '" title="输入序号后点击保存">' +
          '<button type="button" class="is-primary" data-act="seq-save">保存</button></span>' +
          '<button type="button" data-act="expand">' +
          (expanded ? '收起SKU' : 'SKU管理(' + skus.length + ')') +
          '</button>' +
          '</div>' +
          skuBlock +
          '</div>'
        );
      })
      .join('');
  }

  function renderSched() {
    var box = document.getElementById('controlSchedList');
    if (!box) return;
    var list = schedProducts();
    var countEl = document.getElementById('controlSchedCount');
    if (countEl) countEl.textContent = '共 ' + list.length + ' 件';
    var allEl = document.getElementById('schedSelectAll');
    if (allEl) {
      allEl.checked = list.length > 0 && list.every(function (p) {
        return selectedSched[p.id];
      });
    }
    if (!list.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无待添加的上架排品</div>';
      return;
    }
    box.innerHTML = list
      .map(function (p) {
        var pending = '';
        if (p.pendingAdd && p.pendingAdd.type === 'on_live_start') {
          pending =
            '<div class="lf-live-card-hint">开播后自动添加（' +
            escapeHtml(saleModeLabel(p.pendingAdd.saleMode)) +
            '）</div>';
        } else if (p.pendingAdd && p.pendingAdd.at) {
          pending =
            '<div class="lf-live-card-hint">将于 ' +
            escapeHtml(formatClock(p.pendingAdd.at)) +
            ' 添加（' +
            escapeHtml(saleModeLabel(p.pendingAdd.saleMode)) +
            '）</div>';
        }
        return (
          '<div class="lf-live-cart-card" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="lf-live-cart-card__main">' +
          '<input type="checkbox" class="lf-live-card-check" data-act="select"' +
          (selectedSched[p.id] ? ' checked' : '') +
          '>' +
          thumbHtml(p) +
          '<div class="lf-live-cart-card__info">' +
          '<div class="lf-live-cart-card__name">' +
          escapeHtml(p.name) +
          '</div>' +
          '<div class="lf-live-cart-card__code">' +
          escapeHtml(p.sku || '—') +
          (p.category ? ' · ' + escapeHtml(p.category) : '') +
          '</div>' +
          priceBlock(p) +
          '</div>' +
          '<button type="button" class="lf-live-sched-add is-primary" data-act="add">添加到直播商品</button>' +
          '</div>' +
          pending +
          '</div>'
        );
      })
      .join('');
  }

  function renderProductPanes() {
    var cartPane = document.getElementById('controlCartPane');
    var schedPane = document.getElementById('controlSchedPane');
    if (cartPane) cartPane.hidden = productTab !== 'cart';
    if (schedPane) schedPane.hidden = productTab !== 'sched';
    setActiveTab('controlProductSubTabs', 'data-product-tab', productTab);
    updateCartCount();
    if (productTab === 'cart') renderCart();
    else renderSched();
  }

  function renderMainTabs() {
    var productPane = document.getElementById('controlTabProduct');
    var welfarePane = document.getElementById('controlTabWelfare');
    var isProduct = mainTab === 'product';
    if (productPane) productPane.hidden = !isProduct;
    if (welfarePane) welfarePane.hidden = isProduct;
    setActiveTab('controlMainTabs', 'data-main-tab', mainTab);
    if (!isProduct) {
      var map = {
        coupon: { title: '发放优惠券', hint: '向当前直播间发放本场已绑定的优惠券活动。', label: '立即发放优惠券' },
        bag: { title: '发放福袋', hint: '向当前直播间发放本场已绑定的福袋。', label: '立即发放福袋' },
        sign: { title: '发放签到', hint: '开启本场签到，观众可在直播间完成签到。', label: '立即发放签到' },
        task: { title: '观看任务', hint: '发放本场观看任务，完成后可领取奖励。', label: '立即发放观看任务' }
      };
      var conf = map[mainTab] || map.coupon;
      var title = document.getElementById('welfarePaneTitle');
      var hint = document.getElementById('welfarePaneHint');
      var btn = document.getElementById('btnDeliverWelfare');
      if (title) title.textContent = conf.title;
      if (hint) hint.textContent = conf.hint;
      if (btn) btn.textContent = conf.label;
    }
  }

  function renderMonitor(sess) {
    var m = metricsOf(sess.id);
    var sales = document.getElementById('monitorSales');
    if (sales) sales.textContent = formatMoney(m.salesAmount);
    var grid = document.getElementById('monitorMetrics');
    if (grid) {
      var cells = [
        { label: '观看人数', value: formatNum(m.viewers) },
        { label: '累计观看', value: formatNum(m.totalViews) },
        { label: '峰值人数', value: formatNum(m.peakViewers) },
        { label: '点赞数', value: formatNum(m.likes) },
        { label: '订单数', value: formatNum(m.orderCount) },
        { label: '下单GMV', value: formatMoney(m.orderGmv) }
      ];
      grid.innerHTML = cells
        .map(function (c) {
          return (
            '<div class="lf-live-monitor-cell">' +
            '<div class="lf-live-monitor-cell__value">' +
            escapeHtml(c.value) +
            '</div>' +
            '<div class="lf-live-monitor-cell__label">' +
            escapeHtml(c.label) +
            '</div></div>'
          );
        })
        .join('');
    }
    var title = document.getElementById('monitorOrderTitle');
    var orders = m.recentOrders || [];
    if (title) title.textContent = '实时订单(' + orders.length + ')';
    var list = document.getElementById('monitorOrders');
    if (!list) return;
    if (!orders.length) {
      list.innerHTML = '<div class="lf-live-empty-inline">当前暂无订单</div>';
      return;
    }
    list.innerHTML = orders
      .map(function (o) {
        var name = o.nickname || '匿名用户';
        var ch = String(name).charAt(0);
        var hue = 0;
        for (var i = 0; i < name.length; i++) hue += name.charCodeAt(i);
        hue = hue % 360;
        var level = o.level || 'Lv.0';
        return (
          '<div class="lf-live-order-item">' +
          '<span class="lf-live-order-avatar" style="background:hsl(' +
          hue +
          ',58%,52%)">' +
          escapeHtml(ch) +
          '</span>' +
          '<div class="lf-live-order-item__mid">' +
          '<div class="lf-live-order-item__user">' +
          escapeHtml(name) +
          ' <em class="lf-live-order-lv">' +
          escapeHtml(level) +
          '</em></div>' +
          '<div class="lf-live-order-item__goods">' +
          escapeHtml(o.productName || '—') +
          (o.qty != null ? ' <span>x' + o.qty + '</span>' : '') +
          '</div>' +
          (o.spec
            ? '<div class="lf-live-order-item__spec">' + escapeHtml(o.spec) + '</div>'
            : '') +
          '</div>' +
          '<div class="lf-live-order-item__side">' +
          '<div class="lf-live-order-item__amount">' +
          escapeHtml(formatMoney(o.amount)) +
          '</div>' +
          '<span class="lf-live-order-status">' +
          escapeHtml(o.statusLabel || '—') +
          '</span>' +
          '<div class="lf-live-order-item__time">' +
          escapeHtml(o.time || '') +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function renderChat(sess) {
    var box = document.getElementById('sidePaneChat');
    if (!box) return;
    var msgs = (metricsOf(sess.id).chatMessages || []).slice().reverse();
    if (!msgs.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无弹幕</div>';
      return;
    }
    box.innerHTML = msgs
      .map(function (m) {
        var cls = m.isAnchor ? ' is-anchor' : m.isSys ? ' is-sys' : '';
        if (m.blocked) cls += ' is-blocked';
        return (
          '<div class="lf-live-chat-item' +
          cls +
          '" data-chat-id="' +
          escapeHtml(m.id) +
          '">' +
          '<span class="lf-live-chat-item__user">' +
          escapeHtml(m.user) +
          '</span>' +
          '<span class="lf-live-chat-item__text">' +
          escapeHtml(m.text) +
          (m.blocked ? '<em class="lf-live-chat-item__tag">已屏蔽</em>' : '') +
          '</span>' +
          '<span class="lf-live-chat-item__time">' +
          escapeHtml(m.time || '') +
          '</span></div>'
        );
      })
      .join('');
  }

  function renderWatch(sess) {
    var box = document.getElementById('watchListBody');
    if (!box) return;
    var m = metricsOf(sess.id);
    var viewers = m.watchViewers || [];
    var visits = m.watchVisits || [];
    var onlineCount = viewers.filter(function (v) {
      return !!v.online;
    }).length;
    var onlineBtn = document.getElementById('watchTabOnline');
    var uniqueBtn = document.getElementById('watchTabUnique');
    var visitsBtn = document.getElementById('watchTabVisits');
    if (onlineBtn) onlineBtn.textContent = '当前在线(' + onlineCount + '人)';
    if (uniqueBtn) uniqueBtn.textContent = '累计观看(' + viewers.length + '人)';
    if (visitsBtn) visitsBtn.textContent = '观看人次(' + visits.length + '人次)';
    setActiveTab('watchSubTabs', 'data-watch-tab', watchTab);
    var sortBtn = document.getElementById('watchSortBtn');
    if (sortBtn) sortBtn.textContent = watchSortDesc ? '倒序' : '正序';
    var filterEl = document.getElementById('watchStatusFilter');
    if (filterEl) {
      filterEl.hidden = watchTab === 'visits';
      if (watchTab !== 'visits') filterEl.value = watchStatusFilter;
    }

    var rows;
    var emptyText;
    if (watchTab === 'visits') {
      rows = visits.slice();
      emptyText = '暂无观看人次';
      rows.sort(function (a, b) {
        var va = timeSortValue(a.enterTime);
        var vb = timeSortValue(b.enterTime);
        return watchSortDesc ? (va < vb ? 1 : va > vb ? -1 : 0) : va < vb ? -1 : va > vb ? 1 : 0;
      });
      if (!rows.length) {
        box.innerHTML = '<div class="lf-live-empty-inline">' + emptyText + '</div>';
        return;
      }
      box.innerHTML = rows
        .map(function (w) {
          return (
            '<div class="lf-live-watch-item">' +
            avatarHtml(w.nickname) +
            '<div class="lf-live-watch-item__body">' +
            '<div class="lf-live-watch-item__user">' +
            escapeHtml(w.nickname || '匿名用户') +
            '</div>' +
            '<div class="lf-live-watch-item__meta">进入 ' +
            escapeHtml(w.enterTime || '—') +
            ' · 离开 ' +
            escapeHtml(w.leaveTime ? w.leaveTime : '观看中') +
            '<br>停留 ' +
            escapeHtml(w.stayDuration || '—') +
            '</div></div></div>'
          );
        })
        .join('');
      return;
    }

    rows = viewers.filter(function (v) {
      if (watchTab === 'online' && !v.online) return false;
      var muted = isUserMuted(m, v.userId, v.nickname) || !!v.muted;
      if (watchStatusFilter === 'muted' && !muted) return false;
      if (watchStatusFilter === 'normal' && muted) return false;
      return true;
    });
    rows.sort(function (a, b) {
      var va = timeSortValue(a.lastEnterTime);
      var vb = timeSortValue(b.lastEnterTime);
      return watchSortDesc ? (va < vb ? 1 : va > vb ? -1 : 0) : va < vb ? -1 : va > vb ? 1 : 0;
    });
    emptyText = watchTab === 'online' ? '暂无在线观众' : '暂无累计观看';
    if (!rows.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">' + emptyText + '</div>';
      return;
    }
    box.innerHTML = rows
      .map(function (w) {
        var muted = isUserMuted(m, w.userId, w.nickname) || !!w.muted;
        return (
          '<div class="lf-live-watch-item" data-user-id="' +
          escapeHtml(w.userId || '') +
          '" data-nickname="' +
          escapeHtml(w.nickname || '') +
          '">' +
          avatarHtml(w.nickname) +
          '<div class="lf-live-watch-item__body">' +
          '<div class="lf-live-watch-item__user">' +
          escapeHtml(w.nickname || '匿名用户') +
          (muted ? ' <span class="lf-live-badge lf-live-badge--danger">禁言</span>' : '') +
          '</div>' +
          '<div class="lf-live-watch-item__meta">最近进入 ' +
          escapeHtml(w.lastEnterTime || '—') +
          '<br>进入 ' +
          escapeHtml(String(w.enterCount || 1)) +
          '次 · 累计观看 ' +
          escapeHtml(w.totalDuration || '—') +
          '</div></div>' +
          '<div class="lf-live-watch-item__ops"><a href="#" data-watch-act="' +
          (muted ? 'unmute' : 'mute') +
          '">' +
          (muted ? '恢复' : '禁言') +
          '</a></div></div>'
        );
      })
      .join('');
  }

  function renderSidePanes(sess) {
    var metrics = document.getElementById('sidePaneMetrics');
    var chat = document.getElementById('sidePaneChat');
    var watch = document.getElementById('sidePaneWatch');
    var orderWrap = document.getElementById('monitorOrderWrap');
    if (metrics) metrics.hidden = sideTab !== 'metrics';
    if (chat) chat.hidden = sideTab !== 'chat';
    if (watch) watch.hidden = sideTab !== 'watch';
    if (orderWrap) orderWrap.hidden = sideTab !== 'metrics';
    setActiveTab('controlSideTabs', 'data-side-tab', sideTab);
    if (sideTab === 'metrics') renderMonitor(sess);
    if (sideTab === 'chat') renderChat(sess);
    if (sideTab === 'watch') renderWatch(sess);
  }

  function refreshInteractUi() {
    var sess = findSession(sessionId);
    if (!sess) return;
    renderDanmuOverlay(sess);
    if (sideTab === 'chat') renderChat(sess);
    if (sideTab === 'watch') renderWatch(sess);
    syncCState();
  }

  function renderQuickReplies() {
    var box = document.getElementById('quickReplyBox');
    if (!box) return;
    box.innerHTML = QUICK_REPLIES.map(function (t) {
      return '<button type="button" class="erp-btn" data-reply="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>';
    }).join('');
  }

  function render() {
    var picker = document.getElementById('controlPicker');
    var workspace = document.getElementById('controlWorkspace');
    var sess = sessionId ? findSession(sessionId) : null;

    if (!sess) {
      if (picker) picker.hidden = false;
      if (workspace) workspace.hidden = true;
      renderHeader(null);
      return;
    }

    if (picker) picker.hidden = true;
    if (workspace) workspace.hidden = false;
    processScheduled();
    renderHeader(sess);
    renderBroadcast(sess);
    renderMainTabs();
    renderProductPanes();
    renderSidePanes(sess);
    syncCState();
  }

  function pushChat(text, extra) {
    var m = metricsOf(sessionId);
    var item = {
      id: 'c-' + Date.now(),
      user: virtualUser || '主播小丰',
      userId: virtualUser ? 'u-virtual' : 'u-anchor',
      text: text,
      time: nowTime(),
      isAnchor: !virtualUser
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        item[k] = extra[k];
      });
    }
    m.chatMessages = m.chatMessages || [];
    m.chatMessages.push(item);
  }

  function copyText(val, input) {
    if (!val) return toast('暂未获取到推流地址', 'warning');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(
        function () {
          toast('推流地址已复制');
        },
        function () {
          toast('复制失败，请手动选择', 'warning');
        }
      );
      return;
    }
    if (input) input.select();
    try {
      document.execCommand('copy');
      toast('推流地址已复制');
    } catch (e) {
      toast('复制失败，请手动选择', 'warning');
    }
  }

  function parseAutoCloseMinutes(val) {
    var raw = String(val == null ? '' : val).trim();
    if (!raw) return null;
    var n = Math.floor(Number(raw));
    if (!isFinite(n) || n < 0) return null;
    return n > 1440 ? 1440 : n;
  }

  function setSwitchOn(el, on) {
    if (!el) return;
    el.classList.toggle('is-on', !!on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function isSwitchOn(el) {
    return !!(el && el.classList.contains('is-on'));
  }

  function syncDlgAutoCloseExtra() {
    var extra = document.getElementById('dlgAutoCloseExtra');
    if (extra) extra.hidden = !isSwitchOn(document.getElementById('dlgAutoCloseEnabled'));
  }

  function getRadioValue(name, fallback) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : fallback;
  }

  function setRadioValue(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (el) {
      el.checked = el.value === value;
    });
  }

  function readCViewerFromDialog() {
    var clamp = Demo.clampInt || function (v, min, max, fb) {
      var n = Math.floor(Number(v));
      if (!isFinite(n)) return fb;
      if (n < min) return min;
      if (n > max) return max;
      return n;
    };
    var initialMax = Demo.C_VIEWER_INITIAL_MAX || 999999;
    var extraMax = Demo.C_VIEWER_EXTRA_MAX || 100;
    var display = getRadioValue('dlgCViewerDisplay', 'online');
    if (display !== 'unique' && display !== 'visits') display = 'online';
    var extraMin = clamp((document.getElementById('dlgCViewerExtraMin') || {}).value, 0, extraMax, 0);
    var extraMaxVal = clamp((document.getElementById('dlgCViewerExtraMax') || {}).value, 0, extraMax, 0);
    return {
      display: display,
      initial: clamp((document.getElementById('dlgCViewerInitial') || {}).value, 0, initialMax, 0),
      extraMin: extraMin,
      extraMax: extraMaxVal
    };
  }

  function fillCloseSettingsDialog(sess) {
    var minEl = document.getElementById('dlgAutoCloseMinutes');
    var enabledSw = document.getElementById('dlgAutoCloseEnabled');
    var sw = document.getElementById('dlgRemoveOnClose');
    var cfg = typeof Demo.normalizeCViewerConfig === 'function' ? Demo.normalizeCViewerConfig(sess) : {
      display: 'online',
      initial: 0,
      extraMin: 0,
      extraMax: 0
    };
    setSwitchOn(enabledSw, !!(sess && sess.autoCloseEnabled));
    if (minEl) minEl.value = sess && sess.autoCloseMinutes != null ? sess.autoCloseMinutes : '';
    setSwitchOn(sw, !!(sess && sess.removeProductsOnClose));
    setRadioValue('dlgCViewerDisplay', cfg.display);
    var initialEl = document.getElementById('dlgCViewerInitial');
    var extraMinEl = document.getElementById('dlgCViewerExtraMin');
    var extraMaxEl = document.getElementById('dlgCViewerExtraMax');
    if (initialEl) initialEl.value = cfg.initial;
    if (extraMinEl) extraMinEl.value = cfg.extraMin;
    if (extraMaxEl) extraMaxEl.value = cfg.extraMax;
    syncDlgAutoCloseExtra();
  }

  function removeAllCartProducts() {
    productsOf(sessionId).slice().forEach(function (p) {
      if (p.inCart) removeFromCart(p);
    });
  }

  function openDialog(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }

  function closeDialog(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  function eligibleSchedIds(ids) {
    return (ids || []).filter(function (id) {
      var found = findProduct(id);
      return found && !found.item.inCart && normalizeSchedStatus(found.item.status) === 'enabled';
    });
  }

  function openAddCartDialog(ids) {
    pendingAddIds = eligibleSchedIds(ids);
    if (!pendingAddIds.length) return toast('请先勾选要添加的选品', 'warning');
    var title = document.getElementById('addCartTitle');
    var hint = document.getElementById('addCartHint');
    var batch = pendingAddIds.length > 1;
    if (title) title.textContent = batch ? '批量添加到直播商品' : '添加到直播商品';
    if (hint) {
      hint.textContent = batch
        ? '将添加已选的 ' + pendingAddIds.length + ' 件商品，请选择状态。'
        : '请选择加入直播商品后的状态。';
    }
    setRadioValue('addCartSaleMode', 'selling');
    openDialog('addCartDialog');
  }

  function applyAddToCart(ids, saleMode) {
    var mode = normalizeSaleMode(saleMode);
    var n = 0;
    eligibleSchedIds(ids).forEach(function (id) {
      var found = findProduct(id);
      if (!found) return;
      addToCart(found.item, mode);
      delete selectedSched[id];
      n += 1;
    });
    return n;
  }

  function moveCart(p, dir) {
    compactCartSort();
    return insertCartAt(p, p.cartSort + dir);
  }

  function handleCartAct(act, card, btn) {
    var found = findProduct(card.getAttribute('data-id'));
    if (!found) return;
    var p = found.item;
    ensureControlFields(p, found.index);

    if (act === 'select') {
      selectedCart[p.id] = !selectedCart[p.id];
      renderCart();
      return;
    }
    if (act === 'expand') {
      expandedIds[p.id] = !expandedIds[p.id];
      render();
      return;
    }
    if (act === 'seq-save') {
      var seqInput = card.querySelector('[data-seq-input]');
      var raw = seqInput ? seqInput.value : '';
      if (raw === '' || !isFinite(Number(raw))) {
        if (seqInput) seqInput.value = String(p.cartSort || 1);
        return toast('请输入有效序号', 'warning');
      }
      if (!insertCartAt(p, raw)) {
        if (seqInput) seqInput.value = String(p.cartSort || 1);
        return;
      }
      toast('已调整到序号 ' + p.cartSort);
      productsOf(sessionId).forEach(syncLiveStatus);
      render();
      return;
    }
    if (act === 'sale-mode') {
      var mode = btn.getAttribute('data-mode') || 'selling';
      p.saleMode = mode === 'preview' ? 'preview' : 'selling';
      syncLiveStatus(p);
      toast(p.saleMode === 'preview' ? '已设为预告，C 端仅展示暂不可购买' : '已设为上架，C 端可正常下单');
    } else if (act === 'preview-price') {
      p.previewPriceMode = btn.getAttribute('data-mode') || 'sale';
      toast(
        p.previewPriceMode === 'question'
          ? '预告价展示为问号'
          : p.previewPriceMode === 'market'
            ? '预告价展示为划线价'
            : '预告价展示为售价'
      );
    } else if (act === 'pin') {
      if (p.saleMode === 'selling' && p.liveStatus === 'sold_out') {
        return toast('商品已售罄，暂不支持置顶', 'warning');
      }
      if (p.pinned) {
        p.pinned = false;
        toast('已取消置顶，回到原序号 ' + p.cartSort);
      } else {
        clearPinExcept(p.id);
        p.pinned = true;
        toast('已临时置顶，原序号 ' + p.cartSort + ' 不变');
      }
    } else if (act === 'explain') {
      if (p.saleMode === 'selling' && p.liveStatus === 'sold_out') {
        return toast('商品已售罄，暂不支持讲解', 'warning');
      }
      if (p.explaining) {
        p.explaining = false;
        toast('已取消讲解，回到原序号 ' + p.cartSort);
      } else {
        clearExplainExcept(p.id);
        p.explaining = true;
        toast('已设为讲解中，C 端展示讲解卡片，原序号不变');
      }
      syncLiveStatus(p);
    } else if (act === 'remove') {
      removeFromCart(p);
      toast('已下架，不再展示于直播商品（C 端小黄车）');
    } else if (act === 'sku-toggle') {
      var skuRow = btn.closest('[data-sku-id]');
      var sku = skuRow ? findSku(p, skuRow.getAttribute('data-sku-id')) : null;
      if (!sku) return;
      sku.enabled = sku.enabled === false;
      syncLiveStatus(p);
      toast(sku.enabled !== false ? 'SKU 已上架' : 'SKU 已下架');
    } else if (act === 'sku-save') {
      var saveRow = btn.closest('[data-sku-id]');
      var saveSku = saveRow ? findSku(p, saveRow.getAttribute('data-sku-id')) : null;
      var saveInput = saveRow ? saveRow.querySelector('[data-stock-input]') : null;
      if (!saveSku || !saveInput) return;
      var n = Math.floor(Number(saveInput.value));
      if (isNaN(n) || n < 0) return toast('请输入有效库存', 'warning');
      saveSku.stock = n;
      if (pendingStock[p.id]) delete pendingStock[p.id][saveSku.id];
      syncLiveStatus(p);
      toast('库存已保存');
    } else {
      return;
    }
    productsOf(sessionId).forEach(syncLiveStatus);
    render();
  }

  function bindEvents() {
    var back = document.getElementById('controlBackBtn');
    if (back) {
      back.addEventListener('click', function () {
        window.location.href = wp.page('mdm_live_session.html');
      });
    }
    var enter = document.getElementById('controlEnterBtn');
    if (enter) {
      enter.addEventListener('click', function () {
        enterSession((document.getElementById('controlSessionSelect') || {}).value || '');
      });
    }

    var startBtn = document.getElementById('btnStartLive');
    var stopBtn = document.getElementById('btnStopLive');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        if (sess.status === 'ended') return toast('已结束场次无法开播', 'warning');
        sess.status = 'live';
        processScheduled();
        toast('已开始直播');
        render();
      });
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        sess.status = 'ended';
        if (sess.autoCloseEnabled && sess.removeProductsOnClose) {
          removeAllCartProducts();
          toast('已关闭直播，并下架全部直播商品');
        } else {
          toast('已关闭直播');
        }
        render();
      });
    }

    var pushBtn = document.getElementById('btnPushUrl');
    if (pushBtn) {
      pushBtn.addEventListener('click', function () {
        openDialog('pushUrlDialog');
      });
    }
    document.querySelectorAll('[data-close-dialog]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeDialog(el.getAttribute('data-close-dialog'));
      });
    });
    var copyBtn = document.getElementById('btnCopyPush');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var input = document.getElementById('broadcastPushUrl');
        copyText((input && input.value) || '', input);
      });
    }

    var mainTabs = document.getElementById('controlMainTabs');
    if (mainTabs) {
      mainTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-main-tab]');
        if (!btn) return;
        mainTab = btn.getAttribute('data-main-tab');
        render();
      });
    }
    var subTabs = document.getElementById('controlProductSubTabs');
    if (subTabs) {
      subTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-product-tab]');
        if (!btn) return;
        productTab = btn.getAttribute('data-product-tab');
        render();
      });
    }
    var goSched = document.getElementById('btnGoSched');
    if (goSched) {
      goSched.addEventListener('click', function () {
        productTab = 'sched';
        render();
      });
    }
    var settingsBtn = document.getElementById('btnCartSettings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        fillCloseSettingsDialog(sess);
        openDialog('cartSettingsDialog');
      });
    }
    var settingsEnabledSw = document.getElementById('dlgAutoCloseEnabled');
    if (settingsEnabledSw) {
      settingsEnabledSw.addEventListener('click', function () {
        setSwitchOn(settingsEnabledSw, !isSwitchOn(settingsEnabledSw));
        syncDlgAutoCloseExtra();
      });
    }
    var settingsSw = document.getElementById('dlgRemoveOnClose');
    if (settingsSw) {
      settingsSw.addEventListener('click', function () {
        setSwitchOn(settingsSw, !isSwitchOn(settingsSw));
      });
    }
    var settingsConfirm = document.getElementById('cartSettingsConfirm');
    if (settingsConfirm) {
      settingsConfirm.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        var enabled = isSwitchOn(document.getElementById('dlgAutoCloseEnabled'));
        var minutes = parseAutoCloseMinutes((document.getElementById('dlgAutoCloseMinutes') || {}).value);
        if (enabled && minutes == null) return toast('请填写 0-1440 的断流关播分钟数', 'warning');
        var viewer = readCViewerFromDialog();
        if (viewer.extraMin > viewer.extraMax) {
          return toast('额外跟随人数下限不能大于上限', 'warning');
        }
        sess.autoCloseEnabled = enabled;
        sess.autoCloseMinutes = minutes;
        sess.removeProductsOnClose = enabled && isSwitchOn(document.getElementById('dlgRemoveOnClose'));
        sess.cViewerDisplay = viewer.display;
        sess.cViewerInitial = viewer.initial;
        sess.cViewerExtraMin = viewer.extraMin;
        sess.cViewerExtraMax = viewer.extraMax;
        closeDialog('cartSettingsDialog');
        toast('设置已保存');
        render();
      });
    }
    var sideTabs = document.getElementById('controlSideTabs');
    if (sideTabs) {
      sideTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-side-tab]');
        if (!btn) return;
        sideTab = btn.getAttribute('data-side-tab');
        closeDanmuMenu();
        render();
      });
    }

    var watchSubTabs = document.getElementById('watchSubTabs');
    if (watchSubTabs) {
      watchSubTabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-watch-tab]');
        if (!btn) return;
        watchTab = btn.getAttribute('data-watch-tab');
        var sess = findSession(sessionId);
        if (sess) renderWatch(sess);
      });
    }
    var watchSortBtn = document.getElementById('watchSortBtn');
    if (watchSortBtn) {
      watchSortBtn.addEventListener('click', function () {
        watchSortDesc = !watchSortDesc;
        var sess = findSession(sessionId);
        if (sess) renderWatch(sess);
      });
    }
    var watchFilter = document.getElementById('watchStatusFilter');
    if (watchFilter) {
      watchFilter.addEventListener('change', function () {
        watchStatusFilter = watchFilter.value || '';
        var sess = findSession(sessionId);
        if (sess) renderWatch(sess);
      });
    }
    var watchBody = document.getElementById('watchListBody');
    if (watchBody) {
      watchBody.addEventListener('click', function (ev) {
        var actEl = ev.target.closest('[data-watch-act]');
        if (!actEl) return;
        ev.preventDefault();
        var row = actEl.closest('.lf-live-watch-item');
        if (!row) return;
        var userId = row.getAttribute('data-user-id') || '';
        var nickname = row.getAttribute('data-nickname') || '';
        var on = actEl.getAttribute('data-watch-act') === 'mute';
        setUserMuted(userId, nickname, on);
        toast(on ? '已对该用户本场禁言' : '已恢复该用户本场发言');
        refreshInteractUi();
      });
    }

    var overlay = document.getElementById('broadcastDanmu');
    if (overlay) {
      overlay.addEventListener('click', function (ev) {
        var item = ev.target.closest('[data-chat-id]');
        if (!item) return;
        var msg = findChatById(item.getAttribute('data-chat-id'));
        openDanmuMenu(ev, msg);
      });
    }
    var chatList = document.getElementById('sidePaneChat');
    if (chatList) {
      chatList.addEventListener('click', function (ev) {
        var item = ev.target.closest('[data-chat-id]');
        if (!item) return;
        var msg = findChatById(item.getAttribute('data-chat-id'));
        openDanmuMenu(ev, msg);
      });
    }
    var danmuMenu = document.getElementById('danmuActMenu');
    if (danmuMenu) {
      danmuMenu.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-danmu-act]');
        if (!btn) return;
        ev.stopPropagation();
        var msg = danmuMenuTarget;
        var act = btn.getAttribute('data-danmu-act');
        closeDanmuMenu();
        if (!msg) return;
        if (act === 'mute') {
          if (msg.isAnchor || msg.isSys) return;
          var muted = isUserMuted(metricsOf(sessionId), msg.userId, msg.user);
          setUserMuted(msg.userId, msg.user, !muted);
          toast(muted ? '已恢复该用户本场发言' : '已对该用户本场禁言');
          refreshInteractUi();
          return;
        }
        if (act === 'block') {
          msg.blocked = !msg.blocked;
          toast(msg.blocked ? '该弹幕已屏蔽，C 端不再展示' : '已取消屏蔽');
          refreshInteractUi();
          return;
        }
        if (act === 'reply') {
          var input = document.getElementById('danmuReplyText');
          if (input) {
            input.value = '@' + (msg.user || '') + ' ';
          }
          openDialog('danmuReplyDialog');
          window.setTimeout(function () {
            if (!input) return;
            input.focus();
            input.selectionStart = input.selectionEnd = input.value.length;
          }, 0);
        }
      });
    }
    document.addEventListener('click', function (ev) {
      var menu = document.getElementById('danmuActMenu');
      if (!menu || menu.hidden) return;
      if (ev.target.closest('#danmuActMenu') || ev.target.closest('[data-chat-id]')) return;
      closeDanmuMenu();
    });
    var replySend = document.getElementById('danmuReplySend');
    if (replySend) {
      replySend.addEventListener('click', function () {
        var input = document.getElementById('danmuReplyText');
        var text = ((input && input.value) || '').trim();
        if (!text) return toast('请输入消息内容', 'warning');
        pushChat(text);
        if (input) input.value = '';
        closeDialog('danmuReplyDialog');
        toast('消息已发送');
        refreshInteractUi();
      });
    }

    var queryBtn = document.getElementById('schedFilterQuery');
    var resetBtn = document.getElementById('schedFilterReset');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        schedFilter = {
          name: ((document.getElementById('schedFilterName') || {}).value || '').trim(),
          sku: ((document.getElementById('schedFilterSku') || {}).value || '').trim(),
          category: (document.getElementById('schedFilterCategory') || {}).value || ''
        };
        renderSched();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var name = document.getElementById('schedFilterName');
        var sku = document.getElementById('schedFilterSku');
        var cat = document.getElementById('schedFilterCategory');
        if (name) name.value = '';
        if (sku) sku.value = '';
        if (cat) cat.value = '';
        schedFilter = { name: '', sku: '', category: '' };
        renderSched();
      });
    }

    var cartQueryBtn = document.getElementById('cartFilterQuery');
    var cartResetBtn = document.getElementById('cartFilterReset');
    if (cartQueryBtn) {
      cartQueryBtn.addEventListener('click', function () {
        cartFilter = {
          name: ((document.getElementById('cartFilterName') || {}).value || '').trim(),
          sku: ((document.getElementById('cartFilterSku') || {}).value || '').trim()
        };
        renderCart();
      });
    }
    if (cartResetBtn) {
      cartResetBtn.addEventListener('click', function () {
        var name = document.getElementById('cartFilterName');
        var sku = document.getElementById('cartFilterSku');
        if (name) name.value = '';
        if (sku) sku.value = '';
        cartFilter = { name: '', sku: '' };
        renderCart();
      });
    }

    var cartList = document.getElementById('controlCartList');
    if (cartList) {
      cartList.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn || btn.matches('input[type="checkbox"]')) return;
        var card = btn.closest('[data-id]');
        if (!card) return;
        handleCartAct(btn.getAttribute('data-act'), card, btn);
      });
      cartList.addEventListener('input', function (ev) {
        var input = ev.target.closest('[data-stock-input]');
        if (!input) return;
        var card = input.closest('[data-id]');
        var skuRow = input.closest('[data-sku-id]');
        if (!card || !skuRow) return;
        var pid = card.getAttribute('data-id');
        var skuId = skuRow.getAttribute('data-sku-id');
        if (!pendingStock[pid]) pendingStock[pid] = {};
        pendingStock[pid][skuId] = input.value;
      });
      cartList.addEventListener('change', function (ev) {
        var check = ev.target.closest('[data-act="select"]');
        if (check) {
          var card = check.closest('[data-id]');
          if (!card) return;
          selectedCart[card.getAttribute('data-id')] = !!check.checked;
          renderCart();
        }
      });
      cartList.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter') return;
        var seq = ev.target.closest('[data-seq-input]');
        if (!seq) return;
        ev.preventDefault();
        var card = seq.closest('[data-id]');
        if (card) handleCartAct('seq-save', card, seq);
      });
    }

    var cartSelectAll = document.getElementById('cartSelectAll');
    if (cartSelectAll) {
      cartSelectAll.addEventListener('change', function () {
        var on = !!cartSelectAll.checked;
        cartProducts().forEach(function (p) {
          selectedCart[p.id] = on;
        });
        renderCart();
      });
    }
    var btnCartBatchRemove = document.getElementById('btnCartBatchRemove');
    if (btnCartBatchRemove) {
      btnCartBatchRemove.addEventListener('click', function () {
        var ids = selectedCartIds();
        if (!ids.length) return toast('请先勾选要下架的商品', 'warning');
        ids.forEach(function (id) {
          var found = findProduct(id);
          if (found) removeFromCart(found.item);
        });
        toast('已批量下架 ' + ids.length + ' 件商品');
        render();
      });
    }
    var btnCartTimedRemove = document.getElementById('btnCartTimedRemove');
    if (btnCartTimedRemove) {
      btnCartTimedRemove.addEventListener('click', function () {
        var ids = selectedCartIds();
        if (!ids.length) return toast('请先勾选要定时下架的商品', 'warning');
        var hint = document.getElementById('timedRemoveHint');
        var input = document.getElementById('timedRemoveAt');
        if (hint) hint.textContent = '将定时下架已选的 ' + ids.length + ' 件商品。';
        if (input) input.value = toLocalInput(Date.now() + 5 * 60 * 1000);
        openDialog('timedRemoveDialog');
      });
    }
    var timedRemoveConfirm = document.getElementById('timedRemoveConfirm');
    if (timedRemoveConfirm) {
      timedRemoveConfirm.addEventListener('click', function () {
        var ids = selectedCartIds();
        var input = document.getElementById('timedRemoveAt');
        var ts = input && input.value ? new Date(input.value).getTime() : NaN;
        if (!ids.length) return toast('请先勾选商品', 'warning');
        if (isNaN(ts)) return toast('请选择下架时间', 'warning');
        ids.forEach(function (id) {
          var found = findProduct(id);
          if (found) found.item.removeAt = ts;
        });
        closeDialog('timedRemoveDialog');
        toast('已设置定时下架');
        render();
      });
    }

    var schedList = document.getElementById('controlSchedList');
    if (schedList) {
      schedList.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn || btn.matches('input[type="checkbox"]')) return;
        var card = btn.closest('[data-id]');
        if (!card) return;
        var act = btn.getAttribute('data-act');
        var found = findProduct(card.getAttribute('data-id'));
        if (!found) return;
        var p = found.item;
        if (act === 'add') {
          if (normalizeSchedStatus(p.status) !== 'enabled') {
            return toast('仅上架排品可添加到直播商品', 'warning');
          }
          openAddCartDialog([p.id]);
        }
      });
      schedList.addEventListener('change', function (ev) {
        var check = ev.target.closest('[data-act="select"]');
        if (!check) return;
        var card = check.closest('[data-id]');
        if (!card) return;
        selectedSched[card.getAttribute('data-id')] = !!check.checked;
        renderSched();
      });
    }
    var schedSelectAll = document.getElementById('schedSelectAll');
    if (schedSelectAll) {
      schedSelectAll.addEventListener('change', function () {
        var on = !!schedSelectAll.checked;
        schedProducts().forEach(function (p) {
          selectedSched[p.id] = on;
        });
        renderSched();
      });
    }
    var btnSchedBatchAdd = document.getElementById('btnSchedBatchAdd');
    if (btnSchedBatchAdd) {
      btnSchedBatchAdd.addEventListener('click', function () {
        var ids = selectedSchedIds();
        if (!ids.length) return toast('请先勾选要添加的选品', 'warning');
        openAddCartDialog(ids);
      });
    }
    var addCartConfirm = document.getElementById('addCartConfirm');
    if (addCartConfirm) {
      addCartConfirm.addEventListener('click', function () {
        if (!pendingAddIds.length) return toast('请先勾选要添加的选品', 'warning');
        var saleMode = normalizeSaleMode(getRadioValue('addCartSaleMode', 'selling'));
        var n = applyAddToCart(pendingAddIds, saleMode);
        closeDialog('addCartDialog');
        pendingAddIds = [];
        if (!n) return toast('没有可添加的商品', 'warning');
        toast(
          (n > 1 ? '已批量添加 ' + n + ' 件商品，状态为' : '已添加到直播商品，状态为') + saleModeLabel(saleMode)
        );
        productTab = 'cart';
        render();
      });
    }
    var btnSchedTimedAdd = document.getElementById('btnSchedTimedAdd');
    if (btnSchedTimedAdd) {
      btnSchedTimedAdd.addEventListener('click', function () {
        var ids = selectedSchedIds();
        if (!ids.length) return toast('请先勾选要定时添加的选品', 'warning');
        var hint = document.getElementById('timedAddHint');
        var input = document.getElementById('timedAddAt');
        if (hint) hint.textContent = '将为已选的 ' + ids.length + ' 件选品设置添加时间，请同时选择状态。';
        if (input) input.value = toLocalInput(Date.now() + 5 * 60 * 1000);
        var radios = document.querySelectorAll('input[name="timedAddMode"]');
        radios.forEach(function (r) {
          r.checked = r.value === 'at';
        });
        setRadioValue('timedAddSaleMode', 'selling');
        openDialog('timedAddDialog');
      });
    }
    var timedAddConfirm = document.getElementById('timedAddConfirm');
    if (timedAddConfirm) {
      timedAddConfirm.addEventListener('click', function () {
        var ids = selectedSchedIds();
        if (!ids.length) return toast('请先勾选选品', 'warning');
        var modeEl = document.querySelector('input[name="timedAddMode"]:checked');
        var mode = modeEl ? modeEl.value : 'at';
        var sess = findSession(sessionId);
        var ts = NaN;
        if (mode !== 'on_live_start') {
          var input = document.getElementById('timedAddAt');
          ts = input && input.value ? new Date(input.value).getTime() : NaN;
          if (isNaN(ts)) return toast('请选择添加时间', 'warning');
        }
        var saleMode = normalizeSaleMode(getRadioValue('timedAddSaleMode', 'selling'));
        ids.forEach(function (id) {
          var found = findProduct(id);
          if (!found || found.item.inCart) return;
          if (mode === 'on_live_start') {
            if (sess && sess.status === 'live') {
              addToCart(found.item, saleMode);
            } else {
              found.item.pendingAdd = { type: 'on_live_start', saleMode: saleMode };
            }
          } else {
            found.item.pendingAdd = { type: 'at', at: ts, saleMode: saleMode };
          }
        });
        closeDialog('timedAddDialog');
        toast(mode === 'on_live_start' ? '已设置为开播后自动添加（' + saleModeLabel(saleMode) + '）' : '已设置定时添加（' + saleModeLabel(saleMode) + '）');
        render();
      });
    }

    var muteBtn = document.getElementById('btnMuteChat');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        var m = metricsOf(sessionId);
        m.muted = !m.muted;
        toast(m.muted ? '已开启禁言' : '已关闭禁言');
        render();
      });
    }

    var virtualBtn = document.getElementById('btnVirtualAccount');
    if (virtualBtn) {
      virtualBtn.addEventListener('click', function () {
        var next = window.prompt('请输入虚拟互动账号昵称', virtualUser || '场控小助手');
        if (next == null) return;
        virtualUser = String(next).trim();
        toast(virtualUser ? '当前虚拟账号：' + virtualUser : '已切回主播身份');
      });
    }

    var quickBtn = document.getElementById('btnQuickReply');
    var quickBox = document.getElementById('quickReplyBox');
    if (quickBtn && quickBox) {
      quickBtn.addEventListener('click', function () {
        quickBox.hidden = !quickBox.hidden;
        quickBtn.classList.toggle('is-open', !quickBox.hidden);
      });
      quickBox.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-reply]');
        if (!btn) return;
        var input = document.getElementById('controlDanmuInput');
        if (input) input.value = btn.getAttribute('data-reply') || '';
        quickBox.hidden = true;
        quickBtn.classList.remove('is-open');
      });
    }

    var sendBtn = document.getElementById('btnSendDanmu');
    var danmuInput = document.getElementById('controlDanmuInput');
    function sendDanmu() {
      var text = ((danmuInput && danmuInput.value) || '').trim();
      if (!text) return toast('请输入弹幕内容', 'warning');
      pushChat(text);
      if (danmuInput) danmuInput.value = '';
      toast('弹幕已发送');
      refreshInteractUi();
    }
    if (sendBtn) sendBtn.addEventListener('click', sendDanmu);
    if (danmuInput) {
      danmuInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          sendDanmu();
        }
      });
    }

    var welfareBtn = document.getElementById('btnDeliverWelfare');
    if (welfareBtn) {
      welfareBtn.addEventListener('click', function () {
        var map = {
          coupon: '发放优惠券',
          bag: '发放福袋',
          sign: '发放签到',
          task: '观看任务'
        };
        var label = map[mainTab] || '直播福利';
        pushChat('演示：已触发「' + label + '」', { user: '系统', isSys: true, isAnchor: false });
        toast('演示：' + label);
        refreshInteractUi();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    sessionId = qs('sessionId');
    fillSessionSelect(sessionId);
    fillCategoryFilter();
    renderQuickReplies();
    bindEvents();
    render();
    window.setInterval(function () {
      if (!sessionId) return;
      if (processScheduled()) render();
    }, 5000);
  });
})();
