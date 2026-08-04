/**
 * C 端直播间进场特效：欢迎横幅 / 进场座驾 / 全屏特效
 * 供直播间页与 B 端等级配置预览共用
 */
(function (global) {
  var TYPE_LABEL = {
    banner: '欢迎横幅',
    vehicle: '进场座驾',
    fullscreen: '全屏特效'
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveUser() {
    var nick = '宁静致远';
    var levelName = '银牌会员';
    try {
      if (global.UAProfile && typeof global.UAProfile.load === 'function') {
        var p = global.UAProfile.load();
        if (p && p.nickname) nick = p.nickname;
      }
      if (global.UAProfile && typeof global.UAProfile.resolveCurrentLevel === 'function') {
        var lv = global.UAProfile.resolveCurrentLevel(1485);
        if (lv && lv.name) levelName = lv.name;
      }
    } catch (e) { /* ignore */ }
    return { nickname: nick, levelName: levelName };
  }

  /** 从会员等级配置解析当前用户应播放的特效；URL ?effect= 可覆盖 */
  function resolveEffectType() {
    try {
      var params = new URLSearchParams(global.location.search || '');
      var q = params.get('effect');
      if (q && TYPE_LABEL[q]) return q;
    } catch (e) { /* ignore */ }

    try {
      var raw = localStorage.getItem('mdm_member_level_list_v1');
      var growth = 1485;
      if (global.UAProfile && global.UAProfile.DEMO_GROWTH != null) {
        growth = Number(global.UAProfile.DEMO_GROWTH) || growth;
      }
      if (!raw) return 'banner';
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) return 'banner';
      var enabled = list
        .filter(function (it) { return it && it.status !== '禁用'; })
        .sort(function (a, b) {
          return Number(a.growthValue || 0) - Number(b.growthValue || 0);
        });
      var current = enabled[0] || null;
      for (var i = 0; i < enabled.length; i++) {
        if (growth >= Number(enabled[i].growthValue || 0)) current = enabled[i];
      }
      if (current && current.liveEntryEffectEnabled && TYPE_LABEL[current.liveEntryEffectType]) {
        return current.liveEntryEffectType;
      }
    } catch (e2) { /* ignore */ }
    return 'banner';
  }

  function buildMarkup(type, user) {
    var name = escapeHtml(user.nickname);
    var level = escapeHtml(user.levelName);
    var initial = escapeHtml(String(user.nickname || '会').charAt(0));

    if (type === 'vehicle') {
      return (
        '<div class="ua-live-fx ua-live-fx--vehicle" data-live-fx="vehicle">' +
        '  <div class="ua-live-fx-vehicle">' +
        '    <div class="ua-live-fx-vehicle__trail" aria-hidden="true"></div>' +
        '    <div class="ua-live-fx-vehicle__car" aria-hidden="true">' +
        '      <svg viewBox="0 0 120 48" width="120" height="48">' +
        '        <defs><linearGradient id="uaFxCar" x1="0" y1="0" x2="1" y2="1">' +
        '          <stop offset="0%" stop-color="#FFE08A"/><stop offset="100%" stop-color="#F0A020"/>' +
        '        </linearGradient></defs>' +
        '        <path d="M14 30h8l6-12h42l10 12h16c4 0 6 3 6 6v2H10v-2c0-3 2-6 4-6z" fill="url(#uaFxCar)"/>' +
        '        <rect x="28" y="14" width="18" height="10" rx="2" fill="#fff6d6" opacity=".9"/>' +
        '        <rect x="50" y="14" width="22" height="10" rx="2" fill="#fff6d6" opacity=".85"/>' +
        '        <circle cx="34" cy="38" r="7" fill="#333"/><circle cx="34" cy="38" r="3.5" fill="#ddd"/>' +
        '        <circle cx="86" cy="38" r="7" fill="#333"/><circle cx="86" cy="38" r="3.5" fill="#ddd"/>' +
        '        <path d="M96 28h10l4 6H96z" fill="#ffd35a"/>' +
        '      </svg>' +
        '    </div>' +
        '    <div class="ua-live-fx-vehicle__card">' +
        '      <span class="ua-live-fx-avatar">' + initial + '</span>' +
        '      <div class="ua-live-fx-vehicle__text">' +
        '        <div class="ua-live-fx-vehicle__name">' + name + '</div>' +
        '        <div class="ua-live-fx-vehicle__sub">' + level + ' · 座驾驾到</div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
      );
    }

    if (type === 'fullscreen') {
      return (
        '<div class="ua-live-fx ua-live-fx--fullscreen" data-live-fx="fullscreen">' +
        '  <div class="ua-live-fx-full__rays" aria-hidden="true"></div>' +
        '  <div class="ua-live-fx-full__sparkles" aria-hidden="true">' +
        '    <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
        '  </div>' +
        '  <div class="ua-live-fx-full__core">' +
        '    <div class="ua-live-fx-full__badge">钻石进场</div>' +
        '    <div class="ua-live-fx-full__avatar">' + initial + '</div>' +
        '    <div class="ua-live-fx-full__name">' + name + '</div>' +
        '    <div class="ua-live-fx-full__desc">以' + level + '身份荣耀登场</div>' +
        '  </div>' +
        '</div>'
      );
    }

    /* banner 默认 */
    return (
      '<div class="ua-live-fx ua-live-fx--banner" data-live-fx="banner">' +
      '  <div class="ua-live-fx-banner">' +
      '    <span class="ua-live-fx-avatar ua-live-fx-avatar--sm">' + initial + '</span>' +
      '    <div class="ua-live-fx-banner__text">' +
      '      <span class="ua-live-fx-banner__name">' + name + '</span>' +
      '      <span class="ua-live-fx-banner__level">' + level + '</span>' +
      '      <span class="ua-live-fx-banner__action">进入直播间</span>' +
      '    </div>' +
      '    <span class="ua-live-fx-banner__tag">欢迎</span>' +
      '  </div>' +
      '</div>'
    );
  }

  function clearFx(host) {
    if (!host) return;
    host.innerHTML = '';
    host.hidden = true;
    host.setAttribute('aria-hidden', 'true');
  }

  /**
   * @param {HTMLElement} host
   * @param {string} type banner|vehicle|fullscreen
   * @param {{ nickname?: string, levelName?: string, duration?: number, preview?: boolean }} opts
   */
  function play(host, type, opts) {
    if (!host) return;
    opts = opts || {};
    var fxType = TYPE_LABEL[type] ? type : 'banner';
    var user = Object.assign({}, resolveUser(), {
      nickname: opts.nickname || undefined,
      levelName: opts.levelName || undefined
    });
    if (opts.nickname) user.nickname = opts.nickname;
    if (opts.levelName) user.levelName = opts.levelName;

    clearFx(host);
    host.hidden = false;
    host.setAttribute('aria-hidden', 'false');
    host.innerHTML = buildMarkup(fxType, user);

    var root = host.querySelector('.ua-live-fx');
    if (root) {
      /* 强制重绘以触发动画 */
      void root.offsetWidth;
      root.classList.add('is-play');
    }

    if (opts.preview) return;

    var duration = opts.duration;
    if (duration == null) {
      duration = fxType === 'fullscreen' ? 3200 : fxType === 'vehicle' ? 2800 : 2600;
    }
    window.clearTimeout(host._uaLiveFxTimer);
    host._uaLiveFxTimer = window.setTimeout(function () {
      if (root) root.classList.add('is-out');
      window.setTimeout(function () {
        clearFx(host);
      }, 420);
    }, duration);
  }

  function renderPreview(host, type) {
    play(host, type, { preview: true, duration: 0 });
    var root = host && host.querySelector('.ua-live-fx');
    if (root) root.classList.add('is-preview');
  }

  global.UaLiveEntryFx = {
    TYPE_LABEL: TYPE_LABEL,
    resolveEffectType: resolveEffectType,
    play: play,
    renderPreview: renderPreview,
    clear: clearFx
  };
})(window);
