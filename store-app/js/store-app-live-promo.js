/**
 * 门店 APP · 直播推广
 * 列表只展示本门店可看的直播场次（官方全量 / 定向含本店 / 区域覆盖本店；草稿不展示）
 */
(function () {
  var CURRENT_STORE_ID = 'ONS303445581201';
  var ASSET = '../../user-app/assets/shop/';

  function storeInfo() {
    var mock = window.LFMockData && window.LFMockData.store;
    var staff = (mock && mock.staff) || {
      id: 'STAFF-001',
      name: '牛店长',
      phone: '13812348001'
    };
    return {
      storeId: (mock && mock.storeId) || CURRENT_STORE_ID,
      storeName: (mock && mock.companyName) || '冷丰生鲜超市',
      staffId: staff.id || 'STAFF-001',
      staffName: staff.name || '牛店长',
      staffPhone: staff.phone || '13812348001'
    };
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
      cover: ASSET + 'beef-hero.svg',
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

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function buildShareUrl(sess) {
    var info = storeInfo();
    var url = new URL('../../user-app/h5/live-room.html', location.href);
    url.searchParams.set('sessionId', sess.id);
    url.searchParams.set('storeId', info.storeId);
    url.searchParams.set('staffId', info.staffId);
    url.searchParams.set('inviteName', info.staffName);
    url.searchParams.set('invitePhone', info.staffPhone);
    return url.href;
  }

  function renderList(tab) {
    var host = document.getElementById('livePromoList');
    var empty = document.getElementById('livePromoEmpty');
    if (!host) return;
    var info = storeInfo();
    var rows = listByTab(tab, info.storeId);
    host.innerHTML = rows
      .map(function (s) {
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
          '<div class="sa-live-card__cover">' +
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
      })
      .join('');
    if (empty) empty.hidden = rows.length > 0;
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

  var state = { tab: 'live', current: null };

  function fillPoster(sess) {
    var img = document.getElementById('posterCover');
    var title = document.getElementById('posterTitle');
    var timeEl = document.getElementById('posterTime');
    var liveEl = document.getElementById('posterLiveBadge');
    var qrMount = document.getElementById('posterQr');
    if (img) img.src = sess.cover;
    if (title) title.textContent = sess.name;
    if (timeEl) timeEl.textContent = posterTime(sess);
    if (liveEl) liveEl.textContent = badgeText(sess.status);
    if (qrMount) {
      qrMount.innerHTML = '';
      var url = buildShareUrl(sess);
      if (window.QRCode) {
        new window.QRCode(qrMount, {
          text: url,
          width: 72,
          height: 72,
          colorDark: '#111111',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      }
    }
  }

  function openPoster(sess) {
    state.current = sess;
    fillPoster(sess);
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

  function fillShare(sess) {
    var img = document.getElementById('shareCover');
    var title = document.getElementById('shareTitle');
    if (img) img.src = sess.cover;
    if (title) title.textContent = sess.name;
  }

  function openShare(sess) {
    state.current = sess;
    fillShare(sess);
    var el = document.getElementById('liveShare');
    if (el) {
      el.hidden = false;
      el.setAttribute('aria-hidden', 'false');
    }
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
        var act = e.target.closest('[data-poster-act]');
        if (!act || !state.current) return;
        var kind = act.getAttribute('data-poster-act');
        if (kind === 'wx') toast('已将海报分享给微信好友（含门店与邀请人）');
        else if (kind === 'moment') toast('已将海报分享到朋友圈（含门店与邀请人）');
        else if (kind === 'download') toast('海报已保存到相册（演示）');
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
        if (kind === 'wx') toast('已分享给微信好友（含门店与邀请人）');
        else if (kind === 'moment') toast('已分享到朋友圈（含门店与邀请人）');
        closeShare();
      });
    }
  }

  var info = storeInfo();
  setTab(defaultTab(info.storeId));
  bindUi();
})();
