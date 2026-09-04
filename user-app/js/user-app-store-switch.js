/**
 * 用户 APP · 系统默认门店 / 扫码切店
 * - 新用户无门店参数：自动绑定系统默认店（线上店），不弹确认门店
 * - 首页点门店名进入切换门店；扫码入口在切店页右上角
 * - 可切门店仅来自扫过的非系统默认门店
 */
(function (global) {
  'use strict';

  var BIND_KEY = 'ua_store_bind_v1';
  var DEMO_KEY = 'ua_store_bind_demo_v1';
  var EMPTY_HINT = '暂无可切门店，点击右上角扫一扫切换门店';
  var SEARCH_EMPTY_HINT = '暂无匹配门店';
  var SCAN_PREFIX = 'lengfeng-store:';

  var CATALOG = [
    {
      id: 'ONS-CENTER-01',
      name: '中心店01',
      homeName: '溪世纪中心店01',
      addr: '杭州市西湖区绿城西溪世纪中心1号楼',
      leader: '店长: 喻巧 153****9562',
      dist: '距您: 0km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/live-avatar.svg',
      fallbackDefault: true
    },
    {
      id: 'ONS-XIXI-SOUTH',
      name: '西溪湿地南门店',
      homeName: '西溪湿地南门店',
      addr: '杭州市西湖区天目山路旁西溪湿地南门',
      leader: '店长：王敏 138****2210',
      dist: '距您: 1.2km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/review-avatar.svg'
    },
    {
      id: 'ONS-JIANGCUN',
      name: '蒋村公交站店',
      homeName: '蒋村公交站店',
      addr: '杭州市西湖区余杭塘路蒋村路口',
      leader: '店长：李强 159****8831',
      dist: '距您: 0.8km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/live-avatar.svg'
    },
    {
      id: 'ONS303445581201',
      name: '冷丰生鲜超市',
      homeName: '冷丰生鲜超市',
      addr: '天津市河东区长三角珠宝产业园A3栋',
      leader: '店长：张三 138****2211',
      dist: '距您: 2.0km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/review-avatar.svg'
    }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      /* ignore */
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCatalogById(id) {
    var sid = String(id || '').trim();
    var i;
    for (i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === sid) return CATALOG[i];
    }
    return null;
  }

  function fallbackDefaultStore() {
    var i;
    for (i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].fallbackDefault) return CATALOG[i];
    }
    return CATALOG[0];
  }

  function getSystemDefaultStore() {
    var fromB =
      global.MdmSystemDefaultStore && typeof global.MdmSystemDefaultStore.readDefault === 'function'
        ? global.MdmSystemDefaultStore.readDefault()
        : null;
    if (fromB && fromB.storeId) {
      var hit = getCatalogById(fromB.storeId);
      if (hit) {
        return Object.assign({}, hit, {
          name: fromB.name || hit.name,
          homeName: fromB.homeName || fromB.name || hit.homeName,
          addr: fromB.addr || hit.addr,
          leader: fromB.leader || hit.leader,
          hours: fromB.hoursText || hit.hours
        });
      }
      return {
        id: fromB.storeId,
        name: fromB.name || '系统默认门店',
        homeName: fromB.homeName || fromB.name || '系统默认门店',
        addr: fromB.addr || '',
        leader: fromB.leader || '',
        dist: '距您: 0km',
        hours: fromB.hoursText || '08:00-22:00',
        avatar: '../assets/shop/live-avatar.svg'
      };
    }
    return fallbackDefaultStore();
  }

  function isSystemDefaultId(id) {
    var def = getSystemDefaultStore();
    return def && String(id) === String(def.id);
  }

  function readDemo() {
    return Object.assign(
      { userMode: 'new', scannedCount: '0' },
      readJson(DEMO_KEY, {})
    );
  }

  function writeDemo(demo) {
    writeJson(DEMO_KEY, demo);
  }

  function emptyBind() {
    return { confirmed: false, currentStoreId: '', scannedIds: [], visitAt: {} };
  }

  function readBind() {
    var bind = Object.assign(emptyBind(), readJson(BIND_KEY, {}));
    if (!Array.isArray(bind.scannedIds)) bind.scannedIds = [];
    if (!bind.visitAt || typeof bind.visitAt !== 'object') bind.visitAt = {};
    return bind;
  }

  function writeBind(bind) {
    writeJson(BIND_KEY, bind);
    try {
      global.dispatchEvent(new CustomEvent('ua-store-bind-change', { detail: bind }));
    } catch (e) {
      /* ignore */
    }
    syncLocateCtx(bind);
  }

  function applyDemoToBind() {
    var demo = readDemo();
    var bind = emptyBind();
    var def = getSystemDefaultStore();
    var south = getCatalogById('ONS-XIXI-SOUTH');
    var jiang = getCatalogById('ONS-JIANGCUN');
    if (demo.scannedCount === '1') {
      bind.scannedIds = [south.id];
      bind.visitAt[south.id] = Date.now();
      bind.currentStoreId = south.id;
    } else if (demo.scannedCount === '2') {
      bind.scannedIds = [south.id, jiang.id];
      bind.visitAt[south.id] = Date.now() - 60000;
      bind.visitAt[jiang.id] = Date.now();
      bind.currentStoreId = jiang.id;
    } else {
      bind.scannedIds = [];
      bind.currentStoreId = def.id;
    }
    bind.confirmed = true;
    if (demo.userMode === 'new' && !(bind.scannedIds && bind.scannedIds.length)) {
      bind.currentStoreId = def.id;
    }
    if (!bind.currentStoreId) bind.currentStoreId = def.id;
    writeBind(bind);
    return bind;
  }

  function getNonDefaultScanned(bind) {
    var def = getSystemDefaultStore();
    return (bind.scannedIds || []).filter(function (id) {
      return id && (!def || id !== def.id) && getCatalogById(id);
    });
  }

  function resolveCurrentStore(bind) {
    var def = getSystemDefaultStore();
    var scanned = getNonDefaultScanned(bind);
    if (scanned.length === 0) return def;
    if (scanned.length === 1) return getCatalogById(scanned[0]) || def;
    var latestId = scanned[0];
    var latestAt = 0;
    scanned.forEach(function (id) {
      var at = Number((bind.visitAt && bind.visitAt[id]) || 0);
      if (at >= latestAt) {
        latestAt = at;
        latestId = id;
      }
    });
    if (bind.currentStoreId && scanned.indexOf(bind.currentStoreId) >= 0) {
      return getCatalogById(bind.currentStoreId) || getCatalogById(latestId) || def;
    }
    return getCatalogById(latestId) || def;
  }

  function resolveSwitchableStores(bind, current) {
    var curId = current && current.id;
    return getNonDefaultScanned(bind)
      .filter(function (id) {
        return id !== curId;
      })
      .map(getCatalogById)
      .filter(Boolean);
  }

  function markVisited(storeId) {
    var bind = readBind();
    var def = getSystemDefaultStore();
    if (storeId && (!def || storeId !== def.id) && bind.scannedIds.indexOf(storeId) < 0) {
      bind.scannedIds.push(storeId);
    }
    bind.currentStoreId = storeId;
    bind.visitAt[storeId] = Date.now();
    bind.confirmed = true;
    writeBind(bind);
    return bind;
  }

  function confirmCurrentDefault() {
    var def = getSystemDefaultStore();
    var bind = readBind();
    bind.confirmed = true;
    bind.currentStoreId = def.id;
    writeBind(bind);
    return bind;
  }

  function applyUrlStoreParam() {
    var params = new URLSearchParams(global.location.search || '');
    var sid = params.get('storeId') || params.get('store');
    if (!sid) return false;
    var store = getCatalogById(sid) || (isSystemDefaultId(sid) ? getSystemDefaultStore() : null);
    if (!store) return false;
    markVisited(store.id);
    return true;
  }

  function getBizHours(store) {
    if (global.UaSwitchAddress && typeof global.UaSwitchAddress.getStoreBizMeta === 'function') {
      var biz = global.UaSwitchAddress.getStoreBizMeta(store && store.id);
      if (biz && biz.hoursText) {
        return {
          open: !!biz.open,
          statusText: biz.statusText || (biz.open ? '营业中' : '休息中'),
          hoursText: biz.hoursText
        };
      }
    }
    return {
      open: true,
      statusText: '营业中',
      hoursText: (store && store.hours) || '08:00-22:00'
    };
  }

  function syncLocateCtx(bind) {
    if (!global.UaSwitchAddress || typeof global.UaSwitchAddress.writeCtx !== 'function') return;
    var store = resolveCurrentStore(bind || readBind());
    if (!store) return;
    var ctx = global.UaSwitchAddress.readCtx ? global.UaSwitchAddress.readCtx() : {};
    global.UaSwitchAddress.writeCtx(
      Object.assign({}, ctx, {
        mode: 'community',
        displayName: store.homeName || store.name,
        storeId: store.id,
        storeAddr: store.addr,
        storeLeader: store.leader,
        storeDist: store.dist,
        storeAvatar: store.avatar,
        picked: true,
        pickedKind: 'pickup',
        nearbyHasPickup: true
      })
    );
  }

  function storeCardHtml(store, opts) {
    opts = opts || {};
    var biz = getBizHours(store);
    var isDefault = isSystemDefaultId(store.id);
    var statusCls = biz.open
      ? 'ua-sa-pickup-card__biz--open'
      : 'ua-sa-pickup-card__biz--closed';
    var nameInner =
      (isDefault ? '<span class="ua-store-online-tag">线上店</span>' : '') +
      escapeHtml(store.name);
    var selectBtn = opts.withSelect
      ? '<span class="ua-sa-select-btn" aria-hidden="true">选他</span>'
      : '';
    var tag = opts.asButton === false ? 'div' : 'button';
    var typeAttr = opts.asButton === false ? '' : ' type="button"';
    return (
      '<' +
      tag +
      typeAttr +
      ' class="ua-sa-pickup-card' +
      (opts.withSelect ? '' : ' ua-sa-pickup-card--current') +
      '" data-select-pickup="' +
      escapeHtml(store.id) +
      '">' +
      '<img class="ua-sa-pickup-card__avatar" src="' +
      escapeHtml(store.avatar) +
      '" alt="">' +
      '<div class="ua-sa-pickup-card__main">' +
      '<div class="ua-sa-pickup-card__name">' +
      nameInner +
      '</div>' +
      '<div class="ua-sa-pickup-card__biz-row">' +
      '<span class="ua-sa-pickup-card__biz ' +
      statusCls +
      '">' +
      escapeHtml(biz.statusText) +
      '</span>' +
      '<span class="ua-sa-pickup-card__hours">' +
      escapeHtml(biz.hoursText) +
      '</span>' +
      '</div>' +
      '<div class="ua-sa-pickup-card__addr">' +
      escapeHtml(store.addr) +
      '</div>' +
      '<div class="ua-sa-pickup-card__leader">' +
      escapeHtml(store.leader) +
      '</div>' +
      '</div>' +
      (opts.withSelect
        ? '<div class="ua-sa-pickup-card__side">' + selectBtn + '</div>'
        : '') +
      '</' +
      tag +
      '>'
    );
  }

  function scanHref(fromPage) {
    return 'scan-store.html?from=' + encodeURIComponent(fromPage || 'home.html');
  }

  function goHome() {
    global.location.href = 'home.html';
  }

  function mountDemoPanel(extraPosClass) {
    if (document.getElementById('uaStoreBindDemo')) return;
    var demo = readDemo();
    var panel = document.createElement('div');
    panel.id = 'uaStoreBindDemo';
    panel.className = 'ua-rg-demo ua-store-demo' + (extraPosClass ? ' ' + extraPosClass : '');
    panel.innerHTML =
      '<div class="ua-rg-demo__title">切店验收开关</div>' +
      '<label class="ua-rg-demo__row">用户' +
      '<select id="uaStoreDemoUser">' +
      '<option value="new">新用户（自动绑默认店）</option>' +
      '<option value="confirmed">已进入门店</option>' +
      '</select></label>' +
      '<label class="ua-rg-demo__row">已扫非默认' +
      '<select id="uaStoreDemoScan">' +
      '<option value="0">0 家</option>' +
      '<option value="1">1 家</option>' +
      '<option value="2">大于 1 家</option>' +
      '</select></label>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaStoreDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var userSel = $('uaStoreDemoUser');
    var scanSel = $('uaStoreDemoScan');
    if (userSel) userSel.value = demo.userMode || 'new';
    if (scanSel) scanSel.value = demo.scannedCount || '0';
    var apply = $('uaStoreDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        writeDemo({
          userMode: (userSel && userSel.value) || 'new',
          scannedCount: (scanSel && scanSel.value) || '0'
        });
        applyDemoToBind();
        global.location.reload();
      });
    }
  }

  function ensureBindSeeded() {
    if (!localStorage.getItem(BIND_KEY) && !localStorage.getItem(DEMO_KEY)) {
      applyDemoToBind();
      return;
    }
    if (!localStorage.getItem(BIND_KEY)) applyDemoToBind();
  }

  function syncHomeHeader() {
    var nameEl = $('homeLocateName');
    var hoursEl = $('homeLocateBizHours');
    var bind = readBind();
    var store = resolveCurrentStore(bind);
    if (!store) return;
    var biz = getBizHours(store);
    if (nameEl) nameEl.textContent = store.homeName || store.name;
    if (hoursEl) {
      hoursEl.textContent = biz.hoursText;
      hoursEl.hidden = false;
    }
  }

  function autoBindDefaultIfNeeded() {
    var bind = readBind();
    if (bind.confirmed) return bind;
    return confirmCurrentDefault();
  }

  function initHome() {
    ensureBindSeeded();
    var inviteHandled =
      window.UaLiveInvite && typeof window.UaLiveInvite.consumeLanding === 'function'
        ? window.UaLiveInvite.consumeLanding()
        : false;
    if (!inviteHandled) {
      var fromUrl = applyUrlStoreParam();
      if (!fromUrl) autoBindDefaultIfNeeded();
    } else if (window.UaLiveInvite.flushToast) {
      window.UaLiveInvite.flushToast();
    }
    var bind = readBind();
    syncHomeHeader();
    syncLocateCtx(bind);

    var locate = $('homeLocate');
    if (locate) {
      locate.setAttribute('href', 'switch-address.html?from=home.html');
      locate.setAttribute('aria-label', '切换门店');
    }

    mountDemoPanel();
  }

  function storeNameMatch(store, keyword) {
    var q = String(keyword || '').trim().toLowerCase();
    if (!q) return true;
    var name = String((store && store.name) || '').toLowerCase();
    var home = String((store && store.homeName) || '').toLowerCase();
    return name.indexOf(q) >= 0 || home.indexOf(q) >= 0;
  }

  function renderSwitchLists(keyword) {
    var bind = readBind();
    var current = resolveCurrentStore(bind);
    var others = resolveSwitchableStores(bind, current);
    var q = String(keyword || '').trim();
    var filtered = others.filter(function (s) {
      return storeNameMatch(s, q);
    });
    var curHost = $('saCurrentPickup');
    var otherHost = $('saSwitchablePickup');
    var emptyEl = $('saSwitchableEmpty');
    if (curHost) {
      curHost.innerHTML = current ? storeCardHtml(current, { asButton: false }) : '';
    }
    if (otherHost) {
      otherHost.innerHTML = filtered
        .map(function (s) {
          return storeCardHtml(s, { withSelect: true });
        })
        .join('');
      otherHost.hidden = filtered.length === 0;
    }
    if (emptyEl) {
      emptyEl.hidden = filtered.length > 0;
      if (filtered.length === 0) {
        emptyEl.textContent = others.length === 0 || !q ? EMPTY_HINT : SEARCH_EMPTY_HINT;
      }
    }
  }

  function initSwitchPage() {
    ensureBindSeeded();
    var searchInput = $('saStoreSearch');
    renderSwitchLists(searchInput ? searchInput.value : '');

    var back = $('saBack');
    if (back) {
      var from = new URLSearchParams(global.location.search || '').get('from');
      back.setAttribute('href', from ? decodeURIComponent(from) : 'home.html');
    }
    var scanBtn = $('saScanSwitchBtn');
    if (scanBtn) {
      scanBtn.addEventListener('click', function () {
        global.location.href = scanHref('switch-address.html');
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderSwitchLists(searchInput.value || '');
      });
      searchInput.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          renderSwitchLists(searchInput.value || '');
        }
      });
    }
    var otherHost = $('saSwitchablePickup');
    if (otherHost) {
      otherHost.addEventListener('click', function (e) {
        var card = e.target.closest('[data-select-pickup]');
        if (!card) return;
        var id = card.getAttribute('data-select-pickup');
        if (!id) return;
        markVisited(id);
        goHome();
      });
    }
    mountDemoPanel('ua-store-demo--switch');
  }

  function parseScanPayload(raw) {
    var text = String(raw || '').trim();
    if (!text) return null;
    if (text.indexOf(SCAN_PREFIX) === 0) return text.slice(SCAN_PREFIX.length);
    try {
      var url = new URL(text, global.location.href);
      var sid = url.searchParams.get('storeId') || url.searchParams.get('store');
      if (sid) return sid;
    } catch (e) {
      /* ignore */
    }
    if (getCatalogById(text) || isSystemDefaultId(text)) return text;
    return null;
  }

  function applyScannedStore(storeId, fromPage) {
    var store = getCatalogById(storeId) || (isSystemDefaultId(storeId) ? getSystemDefaultStore() : null);
    if (!store) return false;
    markVisited(store.id);
    var from = fromPage || new URLSearchParams(global.location.search || '').get('from') || 'home.html';
    if (String(from).indexOf('switch-address') >= 0) {
      global.location.href = 'switch-address.html?from=home.html';
    } else {
      global.location.href = 'home.html';
    }
    return true;
  }

  function initScanPage() {
    ensureBindSeeded();
    var back = $('scanBack');
    if (back) {
      var from = new URLSearchParams(global.location.search || '').get('from');
      back.setAttribute('href', from ? decodeURIComponent(from) : 'home.html');
    }
    var album = $('scanAlbumBtn');
    if (album) {
      album.addEventListener('click', function () {
        showScanToast('已打开相册（演示）');
      });
    }
    var flash = $('scanFlashBtn');
    if (flash) {
      flash.addEventListener('click', function () {
        flash.classList.toggle('is-on');
        showScanToast(flash.classList.contains('is-on') ? '手电筒已开' : '手电筒已关');
      });
    }

    var frame = $('scanFrame');
    if (frame) {
      frame.addEventListener('click', function () {
        var sel = $('uaScanDemoStore');
        var id = (sel && sel.value) || 'ONS-XIXI-SOUTH';
        applyScannedStore(id);
      });
    }
    mountScanDemo();
  }

  function showScanToast(msg) {
    var el = $('scanToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showScanToast._t);
    showScanToast._t = setTimeout(function () {
      el.hidden = true;
    }, 1400);
  }

  function mountScanDemo() {
    if (document.getElementById('uaScanStoreDemo')) return;
    var panel = document.createElement('div');
    panel.id = 'uaScanStoreDemo';
    panel.className = 'ua-rg-demo ua-store-demo ua-store-demo--scan';
    var options = CATALOG.map(function (s) {
      var tag = s.fallbackDefault ? '（系统默认）' : '';
      return (
        '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + tag + '</option>'
      );
    }).join('');
    panel.innerHTML =
      '<div class="ua-rg-demo__title">扫码验收开关</div>' +
      '<label class="ua-rg-demo__row">模拟扫到' +
      '<select id="uaScanDemoStore">' +
      options +
      '</select></label>' +
      '<p class="ua-rg-demo__hint" style="margin:0 0 8px;color:#999;font-size:10px;line-height:1.4">点取景框或下方按钮识别门店推广码</p>' +
      '<button type="button" class="ua-rg-demo__apply" id="scanSimulateBtn">模拟扫码并进入</button>';
    document.body.appendChild(panel);
    var sel = $('uaScanDemoStore');
    if (sel) sel.value = 'ONS-XIXI-SOUTH';
    var simBtn = $('scanSimulateBtn');
    if (simBtn) {
      simBtn.addEventListener('click', function () {
        applyScannedStore((sel && sel.value) || 'ONS-XIXI-SOUTH');
      });
    }
  }

  function buildPromoPayload(storeId) {
    return SCAN_PREFIX + String(storeId || fallbackDefaultStore().id);
  }

  global.UaStoreSwitch = {
    CATALOG: CATALOG,
    SCAN_PREFIX: SCAN_PREFIX,
    EMPTY_HINT: EMPTY_HINT,
    initHome: initHome,
    initSwitchPage: initSwitchPage,
    initScanPage: initScanPage,
    getSystemDefaultStore: getSystemDefaultStore,
    resolveCurrentStore: resolveCurrentStore,
    readBind: readBind,
    markVisited: markVisited,
    parseScanPayload: parseScanPayload,
    applyScannedStore: applyScannedStore,
    buildPromoPayload: buildPromoPayload,
    storeCardHtml: storeCardHtml,
    syncHomeHeader: syncHomeHeader,
    mountDemoPanel: mountDemoPanel
  };
})(typeof window !== 'undefined' ? window : this);
