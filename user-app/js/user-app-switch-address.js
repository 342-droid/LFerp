/**
 * 用户 APP · 切换地址
 * - 商城模式（履约快递 / 附近无门店）：图 2-2
 * - 附近有门店：图 2-1
 * - 搜索结果列表：图 2-3
 * 定位判定逻辑与「商城店铺」一致，本原型仅有商城模式（快递），无独立商城店铺实体。
 * 点击门店 / 收货地址：写入定位上下文并返回上一级。
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'ua_locate_ctx_v1';
  var DEMO_KEY = 'ua_locate_demo_v1';
  var SHARE_LABEL = {
    community: '分享给邻居',
    mall: '分享给亲友'
  };

  var DEFAULT_CTX = {
    mode: 'mall',
    regionLabel: '浙江省/杭州市/西湖区',
    locateAddr: '浙江省杭州市西湖区绿城西溪世纪中心',
    displayName: '生产验证门店',
    shareLabel: SHARE_LABEL.mall,
    selectedPickupId: '',
    selectedShipId: '',
    nearbyHasPickup: false,
    picked: false
  };

  var PLATFORM_HOURS_KEY = 'lf_basic_settings_business_hours';
  var STORE_HOURS_KEY = 'mdm_store_business_hours_v1';

  var PICKUPS = [
    {
      id: 'pk-current',
      storeId: 'store-prod-verify',
      name: '西溪世纪中心店01',
      addr: '杭州市西湖区绿城西溪世纪中心1号楼',
      leader: '店长：喻巧 153****9562',
      dist: '距您：0km',
      avatar: '../assets/shop/live-avatar.svg',
      role: 'current'
    },
    {
      id: 'pk-hist-1',
      storeId: 'store-xixi-south',
      name: '西溪湿地南门店',
      addr: '杭州市西湖区天目山路旁西溪湿地南门',
      leader: '店长：王敏 138****2210',
      dist: '距您：1.2km',
      avatar: '../assets/shop/review-avatar.svg',
      role: 'history'
    },
    {
      id: 'pk-near-1',
      storeId: 'store-jiangcun',
      name: '蒋村公交站店',
      addr: '杭州市西湖区余杭塘路蒋村路口',
      leader: '店长：李强 159****8831',
      dist: '距您：0.8km',
      avatar: '../assets/shop/live-avatar.svg',
      role: 'nearby'
    },
    {
      id: 'pk-near-2',
      storeId: 'store-zijin',
      name: '紫金港地铁站店',
      addr: '杭州市西湖区紫金港路地铁口旁',
      leader: '店长：赵丽 186****4402',
      dist: '距您：1.6km',
      avatar: '../assets/shop/review-avatar.svg',
      role: 'nearby'
    }
  ];

  var SHIP_ADDRS = [
    {
      id: 'ship-1',
      title: '绿城.西溪世纪中心 5-2-702',
      sub: '刘一凡 15933452465',
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区绿城西溪世纪中心',
      nearbyPickup: true
    },
    {
      id: 'ship-2',
      title: '西溪蓝保中心大楼 A座',
      sub: '吴丹萍 17739589272',
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区西溪蓝保中心大楼',
      nearbyPickup: false
    },
    {
      id: 'ship-3',
      title: '杭州溪印公寓 3幢',
      sub: '张三 13800138000',
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区杭州溪印公寓',
      nearbyPickup: false
    }
  ];

  var NEAR_ADDRS = [
    { id: 'near-1', title: '杭州溪印公寓', nearbyPickup: false },
    { id: 'near-2', title: '杭州卫赫公寓', nearbyPickup: false },
    { id: 'near-3', title: '绿城西溪世纪中心-南门', nearbyPickup: true },
    { id: 'near-4', title: '西溪蓝保中心大楼', nearbyPickup: false }
  ];

  var SEARCH_POIS = [
    {
      id: 'poi-1',
      title: '绿城西溪世纪中心',
      sub: '杭州市西湖区余杭塘路与蒋墩路交叉口',
      dist: '距您：>10km',
      nearbyPickup: true,
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区绿城西溪世纪中心'
    },
    {
      id: 'poi-2',
      title: '绿城西溪世纪中心-南门',
      sub: '杭州市西湖区余杭塘路与蒋墩路交叉口南侧',
      dist: '距您：>10km',
      nearbyPickup: true,
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区绿城西溪世纪中心南门'
    },
    {
      id: 'poi-3',
      title: '绿地西溪国际',
      sub: '杭州市西湖区紫金港路206号',
      dist: '距您：>10km',
      nearbyPickup: false,
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区绿地西溪国际'
    },
    {
      id: 'poi-4',
      title: '西溪蓝保中心大楼',
      sub: '杭州市西湖区文一西路与紫金港路交叉口',
      dist: '距您：8.6km',
      nearbyPickup: false,
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区西溪蓝保中心大楼'
    },
    {
      id: 'poi-5',
      title: '杭州溪印公寓',
      sub: '杭州市西湖区蒋墩路旁',
      dist: '距您：1.1km',
      nearbyPickup: false,
      regionLabel: '浙江省/杭州市/西湖区',
      locateAddr: '浙江省杭州市西湖区杭州溪印公寓'
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

  function readCtx() {
    var ctx = readJson(STORAGE_KEY, null);
    if (!ctx) return Object.assign({}, DEFAULT_CTX);
    return Object.assign({}, DEFAULT_CTX, ctx);
  }

  function writeCtx(ctx) {
    writeJson(STORAGE_KEY, ctx);
    try {
      global.dispatchEvent(new CustomEvent('ua-locate-change', { detail: ctx }));
    } catch (e) {
      /* ignore */
    }
  }

  function readDemo() {
    return readJson(DEMO_KEY, { nearbyForce: 'auto' });
  }

  function writeDemo(demo) {
    writeJson(DEMO_KEY, demo);
  }

  function resolveHasPickup(flag) {
    var demo = readDemo();
    if (demo.nearbyForce === 'yes') return true;
    if (demo.nearbyForce === 'no') return false;
    return !!flag;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadPlatformBusinessHours() {
    try {
      var raw = localStorage.getItem(PLATFORM_HOURS_KEY);
      if (!raw) return { start: '08:00', end: '22:00', crossDay: 'no' };
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { start: '08:00', end: '22:00', crossDay: 'no' };
      }
      return {
        start: parsed.start || '08:00',
        end: parsed.end || '22:00',
        crossDay: parsed.crossDay === 'yes' ? 'yes' : 'no'
      };
    } catch (e) {
      return { start: '08:00', end: '22:00', crossDay: 'no' };
    }
  }

  function loadStoreCustomBusinessHours(storeId) {
    var id = String(storeId || '').trim();
    if (!id) return null;
    try {
      var raw = localStorage.getItem(STORE_HOURS_KEY);
      if (!raw) return null;
      var map = JSON.parse(raw);
      if (!map || typeof map !== 'object') return null;
      var custom = map[id];
      if (custom && custom.start && custom.end) {
        return { start: custom.start, end: custom.end, source: 'store' };
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  /** 门店自定义营业时间优先，否则取平台通用默认营业时间 */
  function resolveStoreBusinessHours(storeId) {
    var custom = loadStoreCustomBusinessHours(storeId);
    if (custom) return custom;
    var platform = loadPlatformBusinessHours();
    return {
      start: platform.start,
      end: platform.end,
      source: 'platform',
      crossDay: platform.crossDay
    };
  }

  function isWithinBusinessWindow(start, end, crossDay, now) {
    var s = String(start || '').trim();
    var e = String(end || '').trim();
    if (!s || !e) return false;
    var d = now instanceof Date ? now : new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var cur = hh + ':' + mm;
    var cross = crossDay === 'yes' || s > e;
    if (cross) return cur >= s || cur < e;
    return cur >= s && cur < e;
  }

  function formatHoursRange(start, end) {
    return (start || '08:00') + '-' + (end || '22:00');
  }

  function getStoreBizMeta(storeId, now) {
    var hours = resolveStoreBusinessHours(storeId);
    var platform = loadPlatformBusinessHours();
    var crossDay = hours.crossDay || platform.crossDay || 'no';
    var open = isWithinBusinessWindow(hours.start, hours.end, crossDay, now);
    return {
      open: open,
      statusText: open ? '营业中' : '休息中',
      hoursText: formatHoursRange(hours.start, hours.end),
      source: hours.source || 'platform'
    };
  }

  function showToast(msg) {
    var el = $('saToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function pickupCardHtml(item, withSelect) {
    var biz = getStoreBizMeta(item.storeId || item.id);
    var statusCls = biz.open
      ? 'ua-sa-pickup-card__biz--open'
      : 'ua-sa-pickup-card__biz--closed';
    return (
      '<button type="button" class="ua-sa-pickup-card" data-select-pickup="' +
      escapeHtml(item.id) +
      '">' +
      '<img class="ua-sa-pickup-card__avatar" src="' +
      escapeHtml(item.avatar) +
      '" alt="">' +
      '<div class="ua-sa-pickup-card__main">' +
      '<div class="ua-sa-pickup-card__name">' +
      escapeHtml(item.name) +
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
      escapeHtml(item.addr) +
      '</div>' +
      '<div class="ua-sa-pickup-card__leader">' +
      escapeHtml(item.leader) +
      '</div>' +
      '</div>' +
      '<div class="ua-sa-pickup-card__side">' +
      '<span class="ua-sa-pickup-card__dist">' +
      escapeHtml(item.dist) +
      '</span>' +
      (withSelect
        ? '<span class="ua-sa-select-btn" aria-hidden="true">选他</span>'
        : '') +
      '</div>' +
      '</button>'
    );
  }

  function stateFromCtx(ctx) {
    return {
      view: 'browse',
      keyword: '',
      regionLabel: ctx.regionLabel,
      locateAddr: ctx.locateAddr,
      layout: ctx.nearbyHasPickup || ctx.mode === 'community' ? 'pickup' : 'mall',
      ctx: ctx
    };
  }

  function extractShortPlaceName(title, locateAddr) {
    var s = String(title || '').trim();
    if (!s) {
      s = String(locateAddr || '')
        .replace(/^[\u4e00-\u9fa5]{2,}省/, '')
        .replace(/^[\u4e00-\u9fa5]{2,}市/, '')
        .replace(/^[\u4e00-\u9fa5]{2,}[区县市]/, '')
        .trim();
    }
    /* 去掉门牌/房号/座幢等后缀，保留小区、商圈、建筑名 */
    s = s
      .replace(/\s+\d+-\d+(-\d+)?\s*$/, '')
      .replace(/\s+[A-Za-z]\d*座\s*$/i, '')
      .replace(/\s+\d+[幢栋单元号楼].*$/, '')
      .replace(/\s+\d+号.*$/, '')
      .replace(/[-—－]?(东|西|南|北)?门\s*$/, '')
      .trim();
    /* 仍像详细路名时，尽量取末段兴趣点 */
    if (/[路街道巷弄]/.test(s) && !/(中心|花园|公寓|大厦|广场|城|苑|府|村|园|馆|站|店)/.test(s)) {
      var parts = s.split(/\s+/);
      s = parts[parts.length - 1] || s;
    }
    if (s.length > 16) s = s.slice(0, 16);
    return s || String(title || locateAddr || '定位地址').trim();
  }

  function applyHomeLabel(ctx) {
    if (!ctx) return DEFAULT_CTX.displayName;
    /* 门店：展示门店名 */
    if (ctx.mode === 'community' || ctx.pickedKind === 'store') {
      return ctx.displayName || DEFAULT_CTX.displayName;
    }
    /* 收货地址 / 附近地址：仅展示小区名或商圈/建筑短名 */
    if (ctx.picked) {
      return (
        ctx.shortName ||
        extractShortPlaceName(ctx.displayName, ctx.locateAddr) ||
        DEFAULT_CTX.displayName
      );
    }
    return ctx.displayName || DEFAULT_CTX.displayName;
  }

  function shortenHomeLabel(text) {
    var s = String(text || '');
    if (s.length <= 14) return s;
    return s.slice(0, 14) + '...';
  }

  function initPage() {
    var ctx = readCtx();
    var state = stateFromCtx(ctx);

    var regionText = $('saRegionText');
    var locateAddrEl = $('saLocateAddr');
    var searchInput = $('saSearchInput');
    var bodyPickup = $('saBodyPickup');
    var bodyMall = $('saBodyMall');
    var bodySearch = $('saBodySearch');
    var back = $('saBack');

    if (back) {
      var from = new URLSearchParams(global.location.search || '').get('from');
      back.setAttribute('href', from ? decodeURIComponent(from) : 'home.html');
    }

    function syncHeader() {
      if (regionText) regionText.textContent = state.regionLabel;
      if (locateAddrEl) locateAddrEl.textContent = state.locateAddr;
    }

    function renderPickupLists() {
      var current = PICKUPS.filter(function (p) {
        return p.role === 'current';
      });
      var history = PICKUPS.filter(function (p) {
        return p.role === 'history';
      });
      var nearby = PICKUPS.filter(function (p) {
        return p.role === 'nearby';
      });
      var curHost = $('saCurrentPickup');
      var histHost = $('saHistoryPickup');
      var nearHost = $('saNearbyPickup');
      if (curHost) {
        curHost.innerHTML = current.length
          ? current.map(function (p) {
              return pickupCardHtml(p, false);
            }).join('')
          : '<div class="ua-sa-empty">暂无当前门店</div>';
      }
      if (histHost) {
        histHost.innerHTML = history.length
          ? history.map(function (p) {
              return pickupCardHtml(p, true);
            }).join('')
          : '<div class="ua-sa-empty">暂无历史门店</div>';
      }
      if (nearHost) {
        nearHost.innerHTML = nearby.length
          ? nearby.map(function (p) {
              return pickupCardHtml(p, true);
            }).join('')
          : '<div class="ua-sa-empty">暂无附近门店</div>';
      }
    }

    function renderMallLists() {
      var shipHost = $('saShipList');
      var nearHost = $('saNearList');
      if (shipHost) {
        shipHost.innerHTML = SHIP_ADDRS.map(function (item) {
          return (
            '<button type="button" class="ua-sa-ship-item" data-ship-id="' +
            escapeHtml(item.id) +
            '">' +
            '<span class="ua-sa-ship-item__main">' +
            '<span class="ua-sa-ship-item__title">' +
            escapeHtml(item.title) +
            '</span>' +
            '<span class="ua-sa-ship-item__sub">' +
            escapeHtml(item.sub) +
            '</span>' +
            '</span>' +
            '</button>'
          );
        }).join('');
      }
      if (nearHost) {
        nearHost.innerHTML = NEAR_ADDRS.map(function (item) {
          return (
            '<button type="button" class="ua-sa-near-item" data-near-id="' +
            escapeHtml(item.id) +
            '">' +
            '<span class="ua-sa-near-item__title">' +
            escapeHtml(item.title) +
            '</span>' +
            '</button>'
          );
        }).join('');
      }
    }

    function renderSearchList() {
      var host = $('saSearchList');
      if (!host) return;
      var kw = String(state.keyword || '').trim().toLowerCase();
      var list = SEARCH_POIS.filter(function (p) {
        if (!kw) return true;
        return (
          String(p.title).toLowerCase().indexOf(kw) >= 0 ||
          String(p.sub).toLowerCase().indexOf(kw) >= 0
        );
      });
      if (!list.length) {
        host.innerHTML = '<div class="ua-sa-empty">未找到相关地址</div>';
        return;
      }
      host.innerHTML = list
        .map(function (p) {
          return (
            '<button type="button" class="ua-sa-search-item" data-poi-id="' +
            escapeHtml(p.id) +
            '">' +
            '<span class="ua-sa-search-item__main">' +
            '<span class="ua-sa-search-item__title">' +
            escapeHtml(p.title) +
            '</span>' +
            '<span class="ua-sa-search-item__sub">' +
            escapeHtml(p.sub) +
            '</span>' +
            '</span>' +
            '<span class="ua-sa-search-item__dist">' +
            escapeHtml(p.dist) +
            '</span>' +
            '</button>'
          );
        })
        .join('');
    }

    function render() {
      syncHeader();
      var searching = state.view === 'search';
      if (bodySearch) bodySearch.hidden = !searching;
      if (bodyPickup) bodyPickup.hidden = searching || state.layout !== 'pickup';
      if (bodyMall) bodyMall.hidden = searching || state.layout !== 'mall';
      if (searching) {
        renderSearchList();
      } else if (state.layout === 'pickup') {
        renderPickupLists();
      } else {
        renderMallLists();
      }
    }

    function enterSearchMode() {
      state.view = 'search';
      render();
    }

    function leaveSearchMode() {
      state.view = 'browse';
      state.keyword = '';
      if (searchInput) searchInput.value = '';
      render();
    }

    function goBack() {
      var href = (back && back.getAttribute('href')) || 'home.html';
      global.location.href = href;
    }

    function applyAddressSelection(payload) {
      var hasPickup = resolveHasPickup(payload.nearbyPickup);
      state.regionLabel = payload.regionLabel || state.regionLabel;
      state.locateAddr = payload.locateAddr || payload.title || state.locateAddr;
      state.view = 'browse';
      state.keyword = '';
      if (searchInput) searchInput.value = '';

      /* 搜索选中且附近有门店：先展示门店列表，点门店后再返回 */
      if (hasPickup && payload.fromSearch) {
        state.layout = 'pickup';
        state.ctx = Object.assign({}, state.ctx, {
          regionLabel: state.regionLabel,
          locateAddr: state.locateAddr,
          nearbyHasPickup: true
        });
        writeCtx(state.ctx);
        render();
        showToast('附近有门店，请选择门店');
        return;
      }

      /* 收货地址 / 附近地址：带地址返回上一级（商城模式·快递） */
      state.layout = 'mall';
      state.ctx = Object.assign({}, state.ctx, {
        mode: 'mall',
        nearbyHasPickup: false,
        regionLabel: state.regionLabel,
        locateAddr: state.locateAddr,
        displayName: payload.title || state.locateAddr,
        shortName: extractShortPlaceName(payload.title, state.locateAddr),
        storeAddr: '',
        storeLeader: '',
        storeDist: '',
        storeAvatar: '',
        storeId: '',
        shareLabel: SHARE_LABEL.mall,
        selectedShipId: payload.shipId || '',
        selectedPickupId: '',
        picked: true,
        pickedKind: payload.shipId ? 'ship' : 'address'
      });
      writeCtx(state.ctx);
      showToast(payload.shipId ? '已选择收货地址' : '已选择地址');
      setTimeout(goBack, 200);
    }

    function selectPickup(id) {
      var item = PICKUPS.find(function (p) {
        return p.id === id;
      });
      if (!item) return;
      state.ctx = Object.assign({}, state.ctx, {
        mode: 'community',
        nearbyHasPickup: true,
        displayName: item.name,
        shortName: item.name,
        locateAddr: state.locateAddr || item.addr,
        regionLabel: state.regionLabel,
        storeAddr: item.addr,
        storeLeader: item.leader,
        storeDist: item.dist,
        storeAvatar: item.avatar,
        storeId: item.storeId || '',
        shareLabel: SHARE_LABEL.community,
        selectedPickupId: item.id,
        picked: true,
        pickedKind: 'store'
      });
      writeCtx(state.ctx);
      showToast('已选择门店');
      setTimeout(goBack, 200);
    }

    function bindEvents() {
      if (searchInput) {
        searchInput.addEventListener('focus', function () {
          enterSearchMode();
        });
        searchInput.addEventListener('input', function () {
          state.keyword = searchInput.value || '';
          if (state.view !== 'search') state.view = 'search';
          render();
        });
        searchInput.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape') {
            leaveSearchMode();
          }
        });
      }

      var relocate = $('saRelocateBtn');
      if (relocate) {
        relocate.addEventListener('click', function () {
          state.locateAddr = '浙江省杭州市西湖区绿城西溪世纪中心';
          state.regionLabel = '浙江省/杭州市/西湖区';
          var hasPickup = resolveHasPickup(false);
          state.layout = hasPickup ? 'pickup' : 'mall';
          state.view = 'browse';
          state.ctx = Object.assign({}, state.ctx, {
            locateAddr: state.locateAddr,
            regionLabel: state.regionLabel,
            mode: hasPickup ? 'community' : 'mall',
            nearbyHasPickup: hasPickup,
            displayName: hasPickup
              ? (PICKUPS[0] && PICKUPS[0].name) || '生产验证门店'
              : state.locateAddr,
            shareLabel: hasPickup ? SHARE_LABEL.community : SHARE_LABEL.mall
          });
          writeCtx(state.ctx);
          render();
          showToast('定位成功');
        });
      }

      var regionBtn = $('saRegionBtn');
      if (regionBtn) {
        regionBtn.addEventListener('click', function () {
          showToast('地区切换（演示）：浙江省/杭州市/西湖区');
        });
      }

      var scroll = $('saScroll');
      if (scroll) {
        scroll.addEventListener('click', function (ev) {
          var pickBtn = ev.target.closest('[data-select-pickup]');
          if (pickBtn) {
            selectPickup(pickBtn.getAttribute('data-select-pickup'));
            return;
          }
          var ship = ev.target.closest('[data-ship-id]');
          if (ship) {
            var shipItem = SHIP_ADDRS.find(function (a) {
              return a.id === ship.getAttribute('data-ship-id');
            });
            if (!shipItem) return;
            applyAddressSelection({
              title: shipItem.title,
              regionLabel: shipItem.regionLabel,
              locateAddr: shipItem.locateAddr,
              nearbyPickup: shipItem.nearbyPickup,
              shipId: shipItem.id
            });
            return;
          }
          var near = ev.target.closest('[data-near-id]');
          if (near) {
            var nearItem = NEAR_ADDRS.find(function (a) {
              return a.id === near.getAttribute('data-near-id');
            });
            if (!nearItem) return;
            applyAddressSelection({
              title: nearItem.title,
              regionLabel: state.regionLabel,
              locateAddr: '浙江省杭州市西湖区' + nearItem.title,
              nearbyPickup: nearItem.nearbyPickup
            });
            return;
          }
          var poi = ev.target.closest('[data-poi-id]');
          if (poi) {
            var poiItem = SEARCH_POIS.find(function (a) {
              return a.id === poi.getAttribute('data-poi-id');
            });
            if (!poiItem) return;
            applyAddressSelection({
              title: poiItem.title,
              regionLabel: poiItem.regionLabel,
              locateAddr: poiItem.locateAddr,
              nearbyPickup: poiItem.nearbyPickup,
              fromSearch: true
            });
          }
        });
      }
    }

    function mountDemoPanel() {
      if (document.getElementById('uaSaDemo')) return;
      var demo = readDemo();
      var panel = document.createElement('div');
      panel.id = 'uaSaDemo';
      panel.className = 'ua-sa-demo';
      panel.innerHTML =
        '<div class="ua-sa-demo__title">切换地址验收开关</div>' +
        '<label class="ua-sa-demo__row">附近门店' +
        '<select id="uaSaDemoNearby">' +
        '<option value="auto">按地址</option>' +
        '<option value="yes">强制有</option>' +
        '<option value="no">强制无</option>' +
        '</select></label>' +
        '<button type="button" class="ua-sa-demo__apply" id="uaSaDemoApply">应用并刷新</button>';
      document.body.appendChild(panel);
      var sel = document.getElementById('uaSaDemoNearby');
      if (sel) sel.value = demo.nearbyForce || 'auto';
      var apply = document.getElementById('uaSaDemoApply');
      if (apply) {
        apply.addEventListener('click', function () {
          writeDemo({ nearbyForce: (sel && sel.value) || 'auto' });
          global.location.reload();
        });
      }
    }

    /* 进入页：按当前上下文决定默认布局（商城模式默认图 2-2） */
    if (resolveHasPickup(state.ctx.nearbyHasPickup) && state.ctx.mode === 'community') {
      state.layout = 'pickup';
    } else {
      state.layout = 'mall';
    }

    bindEvents();
    mountDemoPanel();
    render();
  }

  function resolveHomeStoreId(ctx) {
    if (!ctx) return 'store-prod-verify';
    if (ctx.storeId) return String(ctx.storeId);
    if (ctx.selectedPickupId) {
      var found = PICKUPS.find(function (p) {
        return p.id === ctx.selectedPickupId;
      });
      if (found && found.storeId) return found.storeId;
    }
    /* 收货地址 / 附近地址：仍展示平台默认门店营业时段 */
    if (ctx.pickedKind === 'ship' || ctx.pickedKind === 'address') {
      return 'store-prod-verify';
    }
    return 'store-prod-verify';
  }

  function syncHomeLocate() {
    var nameEl = document.getElementById('homeLocateName');
    var locate = document.getElementById('homeLocate');
    if (!nameEl && !locate) return;
    var ctx = readCtx();
    var label = shortenHomeLabel(applyHomeLabel(ctx));
    if (nameEl) nameEl.textContent = label;
    else if (locate) {
      var textNode = null;
      Array.prototype.forEach.call(locate.childNodes, function (n) {
        if (n.nodeType === 3 && String(n.textContent || '').trim()) textNode = n;
      });
      if (textNode) textNode.textContent = ' ' + label + ' ';
    }
    if (locate) {
      locate.setAttribute('data-locate-mode', ctx.mode);
      locate.setAttribute('data-share-label', ctx.shareLabel || SHARE_LABEL.mall);
    }
    var shareEl = document.getElementById('homeShareLabel');
    if (shareEl) shareEl.textContent = ctx.shareLabel || SHARE_LABEL.mall;

    var hoursEl = document.getElementById('homeLocateBizHours');
    if (hoursEl) {
      var storeId = resolveHomeStoreId(ctx);
      var biz = getStoreBizMeta(storeId);
      hoursEl.textContent = biz.hoursText;
      hoursEl.hidden = false;
    }
  }

  global.UaSwitchAddress = {
    initPage: initPage,
    syncHomeLocate: syncHomeLocate,
    readCtx: readCtx,
    writeCtx: writeCtx,
    getStoreBizMeta: getStoreBizMeta,
    STORAGE_KEY: STORAGE_KEY,
    SHARE_LABEL: SHARE_LABEL
  };
})(typeof window !== 'undefined' ? window : this);
