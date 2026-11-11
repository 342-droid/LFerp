/**
 * 丰银宝 · 直播推广
 * 列表只展示本门店可看的直播场次（官方全量 / 定向含本店 / 区域覆盖本店；草稿不展示）
 */
(function () {
  var CURRENT_STORE_ID = 'ONS303445581201';
  var ASSET = '../../user-app/assets/shop/';

  function sessionApi() {
    return window.SaLivePromoSession;
  }

  function storeInfo() {
    var api = sessionApi();
    if (api && typeof api.identity === 'function') {
      return api.identity();
    }
    var mock = window.LFMockData && window.LFMockData.store;
    var staff = (mock && mock.staff) || {
      id: 'STAFF-001',
      name: '牛店长',
      phone: '13812348001'
    };
    return {
      role: 'staff',
      storeId: (mock && mock.storeId) || CURRENT_STORE_ID,
      storeName: (mock && mock.companyName) || '冷丰生鲜超市',
      staffId: staff.id || 'STAFF-001',
      staffName: staff.name || '牛店长',
      staffPhone: staff.phone || '13812348001'
    };
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function syncIdentityUi() {
    var info = storeInfo();
    var api = sessionApi();
    var who = document.getElementById('livePromoWho');
    if (who) {
      var phone = api && api.maskPhone ? api.maskPhone(info.staffPhone) : info.staffPhone;
      who.innerHTML =
        '当前门店 <strong>' +
        escapeHtml(info.storeName) +
        '</strong> · 推广人 <strong>' +
        escapeHtml(info.staffName) +
        ' ' +
        escapeHtml(phone) +
        '</strong>';
    }
    var back = document.getElementById('livePromoBack');
    if (back && api && api.backHref) back.href = api.backHref();
    var storeBtn = document.getElementById('liveStoreBtn');
    var storeBtnText = document.getElementById('liveStoreBtnText');
    if (storeBtn) {
      var show = info.role === 'bd';
      storeBtn.hidden = !show;
      if (storeBtnText) storeBtnText.textContent = info.storeName;
    }
  }

  function maskPhone(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length !== 11) return d || '';
    return d.slice(0, 3) + '****' + d.slice(7);
  }

  var SESSIONS = [
    {
      id: 'sess-live-01',
      name: '9.4 晚间生鲜专场',
      status: 'live',
      startAt: '2026-09-04 19:00:00',
      actualStartAt: '2026-09-04 19:02:18',
      anchorName: '小丰主播',
      cover: ASSET + 'live-hero.svg',
      liveType: 'OFFICIAL',
      createStatus: 'ENABLED',
      stores: [],
      regionStoreIds: []
    },
    {
      id: 'sess-live-02',
      name: '9.4 门店会员闪购',
      status: 'live',
      startAt: '2026-09-04 15:00:00',
      actualStartAt: '2026-09-04 15:10:02',
      anchorName: '会员管家',
      cover: ASSET + 'banner-featured.svg',
      liveType: 'TARGETED',
      createStatus: 'ENABLED',
      stores: [{ id: CURRENT_STORE_ID, name: '冷丰生鲜超市' }],
      regionStoreIds: []
    },
    {
      id: 'sess-up-01',
      name: '9.5 产地直采早市',
      status: 'upcoming',
      startAt: '2026-09-05 08:00:00',
      actualStartAt: '',
      anchorName: '产地小哥',
      cover: ASSET + 'cat-veg.svg',
      liveType: 'OFFICIAL',
      createStatus: 'ENABLED',
      stores: [],
      regionStoreIds: []
    },
    {
      id: 'sess-up-02',
      name: '9.5 夜宵速达场',
      status: 'upcoming',
      startAt: '2026-09-05 21:30:00',
      actualStartAt: '',
      anchorName: '小丰主播',
      cover: ASSET + 'cat-meat.svg',
      liveType: 'OFFICIAL',
      createStatus: 'ENABLED',
      stores: [],
      regionStoreIds: []
    },
    {
      id: 'sess-up-03',
      name: '9.6 区域团购专场',
      status: 'upcoming',
      startAt: '2026-09-06 10:00:00',
      actualStartAt: '',
      anchorName: '区域达人',
      cover: ASSET + 'banner-featured.svg',
      liveType: 'REGION',
      createStatus: 'ENABLED',
      stores: [],
      regionStoreIds: ['ONS-CENTER-01']
    },
    {
      id: 'sess-end-01',
      name: '9.3 会员日闪购',
      status: 'ended',
      startAt: '2026-09-03 11:30:00',
      actualStartAt: '2026-09-03 11:33:05',
      anchorName: '会员管家',
      cover: ASSET + 'product-dumpling.svg',
      liveType: 'TARGETED',
      createStatus: 'ENABLED',
      stores: [{ id: CURRENT_STORE_ID, name: '冷丰生鲜超市' }],
      regionStoreIds: []
    },
    {
      id: 'sess-end-02',
      name: '9.2 晚间生鲜专场',
      status: 'ended',
      startAt: '2026-09-02 19:00:00',
      actualStartAt: '2026-09-02 19:01:40',
      anchorName: '小丰主播',
      cover: ASSET + 'live-hero.svg',
      liveType: 'OFFICIAL',
      createStatus: 'ENABLED',
      stores: [],
      regionStoreIds: []
    },
    {
      id: 'sess-end-03',
      name: '9.1 产地直采早市',
      status: 'ended',
      startAt: '2026-09-01 08:00:00',
      actualStartAt: '2026-09-01 08:02:11',
      anchorName: '产地小哥',
      cover: ASSET + 'cat-veg.svg',
      liveType: 'OFFICIAL',
      createStatus: 'ENABLED',
      stores: [],
      regionStoreIds: []
    },
    {
      id: 'sess-hidden-targeted',
      name: '他店定向专场（不可见）',
      status: 'live',
      startAt: '2026-09-04 12:00:00',
      actualStartAt: '2026-09-04 12:01:00',
      anchorName: '会员管家',
      cover: ASSET + 'cat-snack.svg',
      liveType: 'TARGETED',
      createStatus: 'ENABLED',
      stores: [{ id: 'st-other', name: '振宁十足' }],
      regionStoreIds: []
    },
    {
      id: 'sess-draft',
      name: '草稿场次（不可见）',
      status: 'upcoming',
      startAt: '2026-09-08 19:00:00',
      actualStartAt: '',
      anchorName: '小丰主播',
      cover: ASSET + 'live-hero.svg',
      liveType: 'OFFICIAL',
      createStatus: 'DRAFT',
      stores: [],
      regionStoreIds: []
    }
  ];

  function toast(msg) {
    if (window.LFToast && typeof window.LFToast.show === 'function') {
      window.LFToast.show(msg);
      return;
    }
    var el = document.getElementById('saToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'saToast';
      el.className = 'sa-toast';
      var shell = document.querySelector('.sa-shell');
      (shell || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function applyCoverFit(box) {
    if (!box) return;
    var img = box.querySelector('img');
    if (!img) return;
    function measure() {
      var nw = img.naturalWidth;
      var nh = img.naturalHeight;
      var bw = box.clientWidth;
      var bh = box.clientHeight;
      if (!nw || !nh || !bw || !bh) return;
      var scaledH = (bw * nh) / nw;
      if (scaledH + 0.5 < bh) box.classList.add('is-short');
      else box.classList.remove('is-short');
    }
    img.onload = measure;
    if (img.complete && img.naturalWidth) measure();
  }

  function applyCoverFitAll(root) {
    (root || document).querySelectorAll('.sa-cover-fit').forEach(applyCoverFit);
  }

  function canStoreSee(sess, storeId) {
    if (!sess || sess.createStatus === 'DRAFT') return false;
    if (sess.liveType === 'TARGETED') {
      return (sess.stores || []).some(function (s) {
        return s && s.id === storeId;
      });
    }
    if (sess.liveType === 'REGION') {
      return (sess.regionStoreIds || []).indexOf(storeId) >= 0;
    }
    return true;
  }

  function visibleSessions(storeId) {
    return SESSIONS.filter(function (s) {
      return canStoreSee(s, storeId);
    });
  }

  function timeKey(s, field) {
    return String(s[field] || '').replace(/\D/g, '');
  }

  function listByTab(tab, storeId) {
    var rows = visibleSessions(storeId).filter(function (s) {
      return s.status === tab;
    });
    if (tab === 'live') {
      rows.sort(function (a, b) {
        return timeKey(a, 'actualStartAt').localeCompare(timeKey(b, 'actualStartAt'));
      });
    } else if (tab === 'upcoming') {
      rows.sort(function (a, b) {
        return timeKey(a, 'startAt').localeCompare(timeKey(b, 'startAt'));
      });
    } else {
      rows.sort(function (a, b) {
        return timeKey(b, 'actualStartAt').localeCompare(timeKey(a, 'actualStartAt'));
      });
    }
    return rows;
  }

  function defaultTab(storeId) {
    var params = new URLSearchParams(location.search || '');
    var q = params.get('tab');
    if (q === 'live' || q === 'upcoming' || q === 'ended') return q;
    if (params.get('emptyLive') === '1') return 'upcoming';
    return listByTab('live', storeId).length ? 'live' : 'upcoming';
  }

  function formatDotTime(raw) {
    var s = String(raw || '').trim();
    if (!s) return '—';
    return s.replace(/-/g, '.').replace(/(\d{4}\.\d{2}\.\d{2}) /, '$1 ');
  }

  function posterTime(sess) {
    var raw = sess.status === 'upcoming' ? sess.startAt : sess.actualStartAt || sess.startAt;
    return '直播时间：' + formatDotTime(raw);
  }

  function displayTime(sess) {
    if (sess.status === 'upcoming') {
      return '计划开播 ' + (sess.startAt || '—');
    }
    return '开播时间 ' + (sess.actualStartAt || sess.startAt || '—');
  }

  function badgeText(status) {
    if (status === 'live') return '直播中';
    if (status === 'upcoming') return '未开始';
    return '已结束';
  }

  function shareHint() {
    var info = storeInfo();
    var api = sessionApi();
    var phone = api && api.maskPhone ? api.maskPhone(info.staffPhone) : info.staffPhone;
    return info.storeName + ' · ' + info.staffName + ' ' + phone;
  }

  function buildShareUrl(sess, channel) {
    var info = storeInfo();
    var ch = channel === 'app' ? 'app' : 'mp';
    if (window.UaLiveInvite && typeof window.UaLiveInvite.buildShareUrl === 'function') {
      return window.UaLiveInvite.buildShareUrl({
        ch: ch,
        sessionId: sess.id,
        storeId: info.storeId,
        staffId: info.staffId,
        inviteName: info.staffName,
        invitePhone: info.staffPhone
      });
    }
    var url = new URL('../../user-app/h5/live-share.html', location.href);
    url.searchParams.set('ch', ch);
    url.searchParams.set('sessionId', sess.id);
    url.searchParams.set('storeId', info.storeId);
    url.searchParams.set('staffId', info.staffId);
    url.searchParams.set('inviteName', info.staffName);
    url.searchParams.set('invitePhone', info.staffPhone);
    return url.href;
  }

  function renderSessionCard(s) {
    var badgeCls =
      s.status === 'live'
        ? ''
        : s.status === 'upcoming'
          ? ' sa-live-card__badge--upcoming'
          : ' sa-live-card__badge--ended';
    return (
      '<article class="sa-live-card" data-id="' +
      escapeHtml(s.id) +
      '">' +
      '<div class="sa-live-card__cover sa-cover-fit">' +
      '<img src="' +
      escapeHtml(s.cover) +
      '" alt="">' +
      '<span class="sa-live-card__badge' +
      badgeCls +
      '">' +
      escapeHtml(badgeText(s.status)) +
      '</span>' +
      '</div>' +
      '<div class="sa-live-card__body">' +
      '<h2 class="sa-live-card__title">' +
      escapeHtml(s.name) +
      '</h2>' +
      '<div class="sa-live-card__meta">' +
      escapeHtml(displayTime(s)) +
      '</div>' +
      '<div class="sa-live-card__meta">主播 ' +
      escapeHtml(s.anchorName || '—') +
      '</div>' +
      (s.status === 'ended'
        ? ''
        : '<div class="sa-live-card__actions">' +
          '<button type="button" class="sa-live-card__btn" data-act="poster">生成海报</button>' +
          '<button type="button" class="sa-live-card__btn sa-live-card__btn--primary" data-act="share">分享直播</button>' +
          '</div>') +
      '</div></article>'
    );
  }

  function renderList(tab) {
    var host = document.getElementById('livePromoList');
    var empty = document.getElementById('livePromoEmpty');
    if (!host) return;
    syncIdentityUi();
    var info = storeInfo();
    var rows = listByTab(tab, info.storeId);
    host.innerHTML = rows.map(renderSessionCard).join('');
    if (empty) empty.hidden = rows.length > 0;
    applyCoverFitAll(host);
  }

  function setTab(tab) {
    document.querySelectorAll('.sa-live-tabs__btn').forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    renderList(tab);
    state.tab = tab;
  }

  function findSession(id) {
    for (var i = 0; i < SESSIONS.length; i++) {
      if (SESSIONS[i].id === id) return SESSIONS[i];
    }
    return null;
  }

  var state = { tab: 'live', current: null, posterKind: 'mp' };

  function posterKindLabel(kind) {
    return kind === 'app' ? 'App 海报' : '小程序海报';
  }

  function syncPosterKindTabs() {
    var kind = state.posterKind === 'app' ? 'app' : 'mp';
    document.querySelectorAll('[data-poster-kind]').forEach(function (btn) {
      var on = btn.getAttribute('data-poster-kind') === kind;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var sheetTitle = document.getElementById('posterSheetTitle');
    if (sheetTitle) sheetTitle.textContent = kind === 'app' ? '分享 App 海报' : '分享小程序海报';
  }

  function posterScanTip(kind) {
    return kind === 'app' ? '打开冷丰app扫一扫，看直播' : '微信扫一扫，看直播';
  }

  function fillPoster(sess, kind) {
    kind = kind === 'app' ? 'app' : 'mp';
    state.posterKind = kind;
    var img = document.getElementById('posterCover');
    var title = document.getElementById('posterTitle');
    var timeEl = document.getElementById('posterTime');
    var liveEl = document.getElementById('posterLiveBadge');
    var qrTip = document.getElementById('posterQrTip');
    var qrMount = document.getElementById('posterQr');
    if (img) img.src = sess.cover;
    if (title) title.textContent = sess.name;
    if (timeEl) timeEl.textContent = posterTime(sess);
    if (liveEl) {
      liveEl.textContent = badgeText(sess.status);
      liveEl.classList.toggle('is-upcoming', sess.status === 'upcoming');
      liveEl.classList.toggle('is-ended', sess.status === 'ended');
    }
    /* 分享文案写在海报卡内底部，保存/分享一并带出 */
    if (qrTip) qrTip.textContent = posterScanTip(kind);
    if (qrMount) {
      qrMount.innerHTML = '';
      /* 两套海报各用独立 URL 码：ch=mp / ch=app；均为 URL 二维码，非微信官方小程序码 */
      var url = buildShareUrl(sess, kind);
      qrMount.setAttribute(
        'title',
        (kind === 'app' ? 'App URL 二维码' : '小程序 URL 二维码（非官方小程序码）') + '\n' + url
      );
      if (window.QRCode) {
        new window.QRCode(qrMount, {
          text: url,
          width: 68,
          height: 68,
          colorDark: '#111111',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      }
    }
    syncPosterKindTabs();
  }

  function openPoster(sess) {
    state.current = sess;
    /* 默认小程序海报 */
    fillPoster(sess, 'mp');
    var el = document.getElementById('livePoster');
    if (el) {
      el.hidden = false;
      el.setAttribute('aria-hidden', 'false');
    }
  }

  function closePoster() {
    var el = document.getElementById('livePoster');
    if (el) {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
    }
  }

  /** 分享标题：直播场次名称｜门店名称（如「黑灯直播间｜某某门店」）；缺店名时仅场次名称 */
  function fillShare(sess, storeName) {
    var img = document.getElementById('shareCover');
    var title = document.getElementById('shareTitle');
    if (img) img.src = sess.cover;
    if (title) title.textContent = [sess && sess.name, storeName].filter(Boolean).join('｜');
  }

  function openShare(sess) {
    state.current = sess;
    fillShare(sess, storeInfo().storeName);
    document.getElementById('liveShareSheetTitle').textContent = '分享直播';
    var el = document.getElementById('liveShare');
    if (el) {
      el.hidden = false;
      el.setAttribute('aria-hidden', 'false');
    }
    requestAnimationFrame(function () {
      applyCoverFit(document.querySelector('.sa-mpcard__cover'));
    });
  }

  function closeShare() {
    var el = document.getElementById('liveShare');
    if (el) {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function bindUi() {
    document.querySelectorAll('.sa-live-tabs__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-tab') || 'live');
      });
    });
    var list = document.getElementById('livePromoList');
    if (list) {
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var card = btn.closest('[data-id]');
        var sess = findSession(card && card.getAttribute('data-id'));
        if (!sess || sess.status === 'ended') return;
        if (btn.getAttribute('data-act') === 'poster') openPoster(sess);
        else openShare(sess);
      });
    }
    var poster = document.getElementById('livePoster');
    if (poster) {
      poster.addEventListener('click', function (e) {
        if (e.target.closest('[data-poster-close]')) closePoster();
        var kindTab = e.target.closest('[data-poster-kind]');
        if (kindTab && state.current) {
          fillPoster(state.current, kindTab.getAttribute('data-poster-kind') || 'mp');
          return;
        }
        var act = e.target.closest('[data-poster-act]');
        if (!act || !state.current) return;
        var kind = act.getAttribute('data-poster-act');
        var posterName = posterKindLabel(state.posterKind);
        if (kind === 'wx') toast('已将' + posterName + '分享给微信好友（' + shareHint() + '）');
        else if (kind === 'moment') toast('已将' + posterName + '分享到朋友圈（' + shareHint() + '）');
        else if (kind === 'download') toast(posterName + '已保存到相册（演示）');
        closePoster();
      });
    }
    var share = document.getElementById('liveShare');
    if (share) {
      share.addEventListener('click', function (e) {
        if (e.target.closest('[data-share-close]')) closeShare();
        var act = e.target.closest('[data-share-act]');
        if (!act || !state.current) return;
        var kind = act.getAttribute('data-share-act');
        if (kind === 'wx') toast('已分享给微信好友（' + shareHint() + '）');
        else if (kind === 'moment') toast('已分享到朋友圈（' + shareHint() + '）');
        closeShare();
      });
    }
    bindStoreSheet();
    bindFlowToggle();
  }

  function bindFlowToggle() {
    var flow = document.getElementById('livePromoFlow');
    var btn = document.getElementById('liveFlowToggle');
    if (!flow || !btn) return;
    btn.addEventListener('click', function () {
      var collapsed = flow.classList.toggle('is-collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      var label = btn.querySelector('.sa-live-flow__action-text');
      if (label) label.textContent = collapsed ? '展开' : '收起';
    });
  }

  function renderStoreSheet() {
    var api = sessionApi();
    var listEl = document.getElementById('liveStoreSheetList');
    if (!listEl || !api) return;
    var currentId = storeInfo().storeId;
    listEl.innerHTML = (api.STORES || [])
      .map(function (store) {
        var active = store.id === currentId ? ' is-active' : '';
        return (
          '<button type="button" class="sa-live-store-sheet__item' +
          active +
          '" data-store-pick="' +
          escapeHtml(store.id) +
          '">' +
          '<span class="sa-live-store-sheet__item-name">' +
          escapeHtml(store.name) +
          '</span>' +
          '<span class="sa-live-store-sheet__item-meta">' +
          escapeHtml(store.region || '') +
          '</span></button>'
        );
      })
      .join('');
  }

  function openStoreSheet() {
    if (storeInfo().role !== 'bd') return;
    renderStoreSheet();
    var sheet = document.getElementById('liveStoreSheet');
    if (sheet) sheet.hidden = false;
  }

  function closeStoreSheet() {
    var sheet = document.getElementById('liveStoreSheet');
    if (sheet) sheet.hidden = true;
  }

  function applyStoreChange(storeId) {
    var api = sessionApi();
    if (!api) return;
    api.write({ role: 'bd', storeId: storeId });
    if (api.persistListUrl) api.persistListUrl();
    closeStoreSheet();
    closePoster();
    closeShare();
    setTab(state.tab || defaultTab(storeInfo().storeId));
  }

  function bindStoreSheet() {
    var btn = document.getElementById('liveStoreBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        openStoreSheet();
      });
    }
    var sheet = document.getElementById('liveStoreSheet');
    if (!sheet) return;
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-store-sheet-close]')) {
        closeStoreSheet();
        return;
      }
      var pick = e.target.closest('[data-store-pick]');
      if (pick) applyStoreChange(pick.getAttribute('data-store-pick'));
    });
  }

  if (sessionApi() && sessionApi().applyUrlHints) sessionApi().applyUrlHints();
  if (sessionApi() && sessionApi().persistListUrl) sessionApi().persistListUrl();
  if (sessionApi() && sessionApi().mountDemoPanel) sessionApi().mountDemoPanel();
  var info = storeInfo();
  setTab(defaultTab(info.storeId));
  bindUi();
})();
