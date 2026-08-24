/**
 * 用户 APP — 直播间举报
 * 类型与详细内容均必填，提交后写入后台举报管理。
 */
(function (global) {
  'use strict';

  var store = global.LfAftersaleFeedbackStore;
  var mediaPicker = null;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentUser() {
    var profile =
      global.UAProfile && typeof global.UAProfile.load === 'function' ? global.UAProfile.load() : null;
    var id = 'UC10001';
    if (global.UAProfile && typeof global.UAProfile.getActiveMemberId === 'function') {
      id = global.UAProfile.getActiveMemberId();
    }
    return {
      userId: id,
      nickname: (profile && profile.nickname) || '宁静致远',
      phone: (profile && profile.displayPhone) || '15589069061',
      avatar: (profile && profile.avatar) || '../user-app/assets/profile-avatar.svg'
    };
  }

  function sessionMeta() {
    var id = 'sess-001';
    try {
      var params = new URLSearchParams(location.search || '');
      id = params.get('sessionId') || params.get('id') || id;
    } catch (e) {}
    return { sessionId: id, sessionName: '黑灯直播间' };
  }

  function toast(msg) {
    if (global.UAShop && typeof global.UAShop.showToast === 'function') {
      global.UAShop.showToast(msg);
      return;
    }
    var el = document.getElementById('uaShopToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function fillTypes(sel) {
    if (!sel || !store) return;
    var html = '<option value="">请选择举报类型</option>';
    store.getEnabledReportTypes().forEach(function (item) {
      html += '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</option>';
    });
    sel.innerHTML = html;
  }

  function ensureSheet() {
    var existing = document.getElementById('liveReportSheet');
    if (existing) return existing;
    var wrap = document.createElement('div');
    wrap.className = 'ua-live-sheet';
    wrap.id = 'liveReportSheet';
    wrap.hidden = true;
    wrap.innerHTML =
      '<div class="ua-live-sheet__mask" data-live-report-close></div>' +
      '<div class="ua-live-sheet__panel ua-live-report">' +
      '  <div class="ua-live-report__head">' +
      '    <div class="ua-live-report__title">举报</div>' +
      '    <button type="button" class="ua-live-report__close" data-live-report-close aria-label="关闭">×</button>' +
      '  </div>' +
      '  <div class="ua-live-report__body">' +
      '    <div class="ua-fb-field">' +
      '      <label class="ua-fb-field__label" for="liveReportType"><i>*</i>举报类型</label>' +
      '      <select id="liveReportType"></select>' +
      '    </div>' +
      '    <div class="ua-fb-field">' +
      '      <label class="ua-fb-field__label" for="liveReportContent"><i>*</i>详细举报内容</label>' +
      '      <textarea id="liveReportContent" maxlength="200" placeholder="请填写详细举报内容"></textarea>' +
      '      <div class="ua-fb-counter" id="liveReportCounter">0 / 200</div>' +
      '    </div>' +
      '    <div class="ua-fb-field">' +
      '      <label class="ua-fb-field__label">图片/视频</label>' +
      '      <input type="file" id="liveReportMediaInput" accept="image/*,video/*" multiple hidden>' +
      '      <div class="ua-fb-media__grid" id="liveReportMediaGrid"></div>' +
      '      <p class="ua-fb-media__tip">图片最多 9 张，单张不超过 5MB；视频最多 1 个，不超过 100MB；非必填</p>' +
      '    </div>' +
      '  </div>' +
      '  <div class="ua-live-report__foot">' +
      '    <button type="button" class="ua-fb-submit" id="liveReportSubmit">提交</button>' +
      '  </div>' +
      '</div>';
    var host = document.querySelector('.ua-mobile-shell') || document.body;
    host.appendChild(wrap);
    wrap.querySelectorAll('[data-live-report-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    var content = wrap.querySelector('#liveReportContent');
    var counter = wrap.querySelector('#liveReportCounter');
    if (content && counter) {
      content.addEventListener('input', function () {
        counter.textContent = content.value.length + ' / 200';
      });
    }
    wrap.querySelector('#liveReportSubmit').addEventListener('click', submit);
    if (global.UaFbMedia && typeof global.UaFbMedia.create === 'function') {
      mediaPicker = global.UaFbMedia.create({
        grid: wrap.querySelector('#liveReportMediaGrid'),
        input: wrap.querySelector('#liveReportMediaInput'),
        toast: toast
      });
    }
    return wrap;
  }

  function open() {
    var sheet = ensureSheet();
    fillTypes(sheet.querySelector('#liveReportType'));
    var content = sheet.querySelector('#liveReportContent');
    var counter = sheet.querySelector('#liveReportCounter');
    if (content) content.value = '';
    if (counter) counter.textContent = '0 / 200';
    if (mediaPicker) mediaPicker.reset();
    sheet.hidden = false;
  }

  function close() {
    var sheet = document.getElementById('liveReportSheet');
    if (sheet) sheet.hidden = true;
  }

  function submit() {
    if (!store) {
      toast('举报模块未加载');
      return;
    }
    var typeId = (document.getElementById('liveReportType') || {}).value;
    var content = (document.getElementById('liveReportContent') || {}).value;
    var user = currentUser();
    var session = sessionMeta();
    var media = mediaPicker && typeof mediaPicker.snapshot === 'function' ? mediaPicker.snapshot() : { images: [], video: null };
    var result = store.addReport({
      typeId: typeId,
      content: content,
      userId: user.userId,
      nickname: user.nickname,
      phone: user.phone,
      avatar: user.avatar,
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      images: media.images,
      video: media.video
    });
    if (!result.ok) {
      toast(result.message);
      return;
    }
    close();
    toast('举报已提交');
  }

  global.UaLiveReport = { open: open, close: close };
})(window);
