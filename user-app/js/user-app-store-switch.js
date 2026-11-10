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

  /* id = 门店档案「门店编码」，与 MDM/mdm_archive_store.html 一一对应 */
  var CATALOG = [
    {
      id: 'HGH00002',
      name: '中心店01',
      homeName: '中心店01',
      addr: '杭州市西湖区绿城西溪世纪中心1号楼',
      leader: '店长: 喻巧 153****9562',
      dist: '距您: 0km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/live-avatar.svg',
      fallbackDefault: true
    },
    {
      id: 'BJS00001',
      name: '测试通知',
      homeName: '测试通知',
      addr: '北京市东城区地下车库',
      leader: '店长：夏利 178****4646',
      dist: '距您: 1.2km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/review-avatar.svg'
    },
    {
      id: 'TSN00001',
      name: '111',
      homeName: '111',
      addr: '天津市河东区长三角珠宝产业园A3栋',
      leader: '店长：张三 138****2211',
      dist: '距您: 0.8km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/live-avatar.svg'
    },
    {
      id: 'SHA00001',
      name: 'DDD',
      homeName: 'DDD',
      addr: '上海市浦东新区张江路88号',
      leader: '店长：李四 186****9001',
      dist: '距您: 2.0km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/review-avatar.svg'
    },
    {
      id: 'HGH00001',
      name: '张三',
      homeName: '张三',
      addr: '杭州市余杭区文一西路969号',
      leader: '店长：张三 —',
      dist: '距您: 3.1km',
      hours: '08:00-22:00',
      avatar: '../assets/shop/live-avatar.svg'
    }
  ];

  /* 旧演示 ID → 门店档案编码（兼容历史 localStorage / 链接） */
  var LEGACY_ID_ALIAS = {
    'ONS-CENTER-01': 'HGH00002',
    'ONS-XIXI-SOUTH': 'BJS00001',
    'ONS-JIANGCUN': 'TSN00001',
    ONS303445581201: 'SHA00001'
  };

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
    if (LEGACY_ID_ALIAS[sid]) sid = LEGACY_ID_ALIAS[sid];
    var i;
    for (i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === sid) return CATALOG[i];
    }
    return null;
  }

  function readDisabledStoreMap() {
    if (global.MdmArchiveEnableDisable && typeof global.MdmArchiveEnableDisable.readStoreDisabledMap === 'function') {
      return global.MdmArchiveEnableDisable.readStoreDisabledMap() || {};
    }
    try {
      var raw = localStorage.getItem('lferp_store_disabled_v1');
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function isStoreDisabled(store) {
    if (!store) return false;
    if (global.MdmArchiveEnableDisable && typeof global.MdmArchiveEnableDisable.isStoreDisabledByMeta === 'function') {
      return !!global.MdmArchiveEnableDisable.isStoreDisabledByMeta({
        id: store.id,
        storeId: store.id,
        name: store.name
      });
    }
    var map = readDisabledStoreMap();
    var id = String(store.id || '').trim();
    var name = String(store.name || '').trim();
    if (id && map[id] && map[id].disabled) return true;
    if (name && map[name] && map[name].disabled) return true;
    return false;
  }

  function filterEnabledStores(list) {
    return (list || []).filter(function (s) {
      return !isStoreDisabled(s);
    });
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
    var south = getCatalogById('BJS00001'); /* 测试通知 */
    var jiang = getCatalogById('TSN00001'); /* 111 */
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

  function pickFirstEnabledStore(candidates, preferredId) {
    var list = filterEnabledStores(candidates || []);
    if (!list.length) return null;
    if (preferredId) {
      var i;
      for (i = 0; i < list.length; i++) {
        if (list[i].id === preferredId) return list[i];
      }
    }
    return list[0];
  }

  function resolveCurrentStore(bind) {
    var def = getSystemDefaultStore();
    var scanned = getNonDefaultScanned(bind);
    var preferred = null;
    if (scanned.length === 0) preferred = def;
    else if (scanned.length === 1) preferred = getCatalogById(scanned[0]) || def;
    else {
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
        preferred = getCatalogById(bind.currentStoreId) || getCatalogById(latestId) || def;
      } else {
        preferred = getCatalogById(latestId) || def;
      }
    }
    if (preferred && !isStoreDisabled(preferred)) return preferred;
    var pool = scanned
      .map(getCatalogById)
      .filter(Boolean)
      .concat(def ? [def] : [])
      .concat(CATALOG);
    return pickFirstEnabledStore(pool) || preferred;
  }

  function resolveSwitchableStores(bind, current) {
    var curId = current && current.id;
    return filterEnabledStores(
      getNonDefaultScanned(bind)
        .filter(function (id) {
          return id !== curId;
        })
        .map(getCatalogById)
        .filter(Boolean)
    );
  }

  function markVisited(storeId) {
    var store = getCatalogById(storeId) || (isSystemDefaultId(storeId) ? getSystemDefaultStore() : null);
    if (store && isStoreDisabled(store)) {
      return readBind();
    }
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
    if (isStoreDisabled(store)) return false;
    markVisited(store.id);
    return true;
  }

  function disabledCopy(store) {
    if (global.MdmArchiveEnableDisable && typeof global.MdmArchiveEnableDisable.userFacingDisabledCopy === 'function') {
      return global.MdmArchiveEnableDisable.userFacingDisabledCopy(store && store.name);
    }
    var name = (store && store.name) || '该门店';
    return {
      title: '门店已暂停服务',
      scan: '「' + name + '」目前已停用，暂时不能进入。请选择其他门店继续购物。',
      switch: '「' + name + '」已停用，无法切换到这家店。',
      current: '您当前所在的「' + name + '」已停用。请先切换到其他门店。'
    };
  }

  function showDisabledToast(msg) {
    var el = $('saToast');
    if (!el) {
      if (typeof showToast === 'function') showToast(msg || '该门店已停用，请选择其他门店', 'error');
      return;
    }
    el.textContent = msg || '该门店已停用，请选择其他门店';
    el.hidden = false;
    clearTimeout(showDisabledToast._t);
    showDisabledToast._t = setTimeout(function () {
      el.hidden = true;
    }, 2200);
  }

  function showDisabledNotice(store, kind) {
    var copy = disabledCopy(store);
    var message = kind === 'switch' ? copy.switch : copy.scan;
    if (global.MdmArchiveEnableDisable && typeof global.MdmArchiveEnableDisable.showUserNotice === 'function') {
      global.MdmArchiveEnableDisable.showUserNotice({
        storeName: store && store.name,
        title: copy.title,
        message: message,
        primaryText: kind === 'scan' ? '去选其他门店' : '我知道了',
        secondaryText: kind === 'scan' ? '留在本页' : '',
        onPrimary: function () {
          if (kind === 'scan') {
            global.location.href = 'switch-address.html?from=scan-store.html';
          }
        }
      });
      return;
    }
    showDisabledToast(message);
  }

  function ensureDisabledCurrentBanner(rawPreferred) {
    var scroll = $('saScroll');
    var old = document.getElementById('uaStoreDisabledBanner');
    if (old) old.remove();
    if (!rawPreferred || !isStoreDisabled(rawPreferred) || !scroll) return;
    var ban = document.createElement('div');
    ban.id = 'uaStoreDisabledBanner';
    ban.className = 'ua-sa-block';
    ban.innerHTML =
      '<div style="margin:0 12px 12px;padding:10px 12px;border-radius:8px;background:#fff2f0;border:1px solid #ffccc7;color:#a8071a;font-size:13px;line-height:1.55">' +
      escapeHtml(disabledCopy(rawPreferred).current) +
      '</div>';
    scroll.insertBefore(ban, scroll.firstChild);
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
      '<label class="ua-rg-demo__row">模拟停用门店' +
      '<select id="uaStoreDemoDisabled">' +
      '<option value="">无</option>' +
      CATALOG.map(function (s) {
        return (
          '<option value="' +
          escapeHtml(s.id) +
          '">' +
          escapeHtml(s.id) +
          ' · ' +
          escapeHtml(s.name) +
          '</option>'
        );
      }).join('') +
      '</select></label>' +
      '<p class="ua-rg-demo__hint" style="margin:0 0 8px;color:#999;font-size:10px;line-height:1.4">编码与门店档案一致；后台停用同名同编码门店后，此处也会拦截</p>' +
      '<button type="button" class="ua-rg-demo__apply" id="uaStoreDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var userSel = $('uaStoreDemoUser');
    var scanSel = $('uaStoreDemoScan');
    var disabledSel = $('uaStoreDemoDisabled');
    if (userSel) userSel.value = demo.userMode || 'new';
    if (scanSel) scanSel.value = demo.scannedCount || '0';
    if (disabledSel) disabledSel.value = demo.disabledStoreId || '';
    var apply = $('uaStoreDemoApply');
    if (apply) {
      apply.addEventListener('click', function () {
        var disabledId = (disabledSel && disabledSel.value) || '';
        writeDemo({
          userMode: (userSel && userSel.value) || 'new',
          scannedCount: (scanSel && scanSel.value) || '0',
          disabledStoreId: disabledId
        });
        applyDemoDisabledStore(disabledId);
        applyDemoToBind();
        global.location.reload();
      });
    }
  }

  function applyDemoDisabledStore(disabledId) {
    try {
      localStorage.setItem('lferp_store_disabled_v1', JSON.stringify({}));
    } catch (e) {
      /* ignore */
    }
    if (!disabledId) return;
    var store = getCatalogById(disabledId);
    if (!store) return;
    if (global.MdmArchiveEnableDisable && typeof global.MdmArchiveEnableDisable.setStoreDisabled === 'function') {
      global.MdmArchiveEnableDisable.setStoreDisabled({
        id: store.id,
        name: store.name,
        disabled: true
      });
      return;
    }
    var map = {};
    map[store.id] = { id: store.id, name: store.name, disabled: true };
    map[store.name] = map[store.id];
    try {
      localStorage.setItem('lferp_store_disabled_v1', JSON.stringify(map));
    } catch (e2) {
      /* ignore */
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
    var rawCurrent = null;
    if (bind.currentStoreId) {
      rawCurrent =
        getCatalogById(bind.currentStoreId) ||
        (isSystemDefaultId(bind.currentStoreId) ? getSystemDefaultStore() : null);
    }
    var current = resolveCurrentStore(bind);
    var others = resolveSwitchableStores(bind, current);
    var q = String(keyword || '').trim();
    var filtered = others.filter(function (s) {
      return storeNameMatch(s, q);
    });
    var curHost = $('saCurrentPickup');
    var otherHost = $('saSwitchablePickup');
    var emptyEl = $('saSwitchableEmpty');
    ensureDisabledCurrentBanner(rawCurrent);
    if (curHost) {
      if (rawCurrent && isStoreDisabled(rawCurrent)) {
        curHost.innerHTML =
          storeCardHtml(rawCurrent, { asButton: false }) +
          '<div style="margin-top:8px;font-size:12px;color:#a8071a;line-height:1.5">' +
          escapeHtml(disabledCopy(rawCurrent).current) +
          '</div>';
      } else {
        curHost.innerHTML = current ? storeCardHtml(current, { asButton: false }) : '';
      }
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
        var store = getCatalogById(id);
        if (store && isStoreDisabled(store)) {
          showDisabledNotice(store, 'switch');
          return;
        }
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
    if (isStoreDisabled(store)) {
      showDisabledNotice(store, 'scan');
      return false;
    }
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
        var id = (sel && sel.value) || 'BJS00001';
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
    if (sel) sel.value = 'BJS00001';
    var simBtn = $('scanSimulateBtn');
    if (simBtn) {
      simBtn.addEventListener('click', function () {
        applyScannedStore((sel && sel.value) || 'BJS00001');
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
