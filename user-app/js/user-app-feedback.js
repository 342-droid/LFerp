/**
 * 用户 APP — 意见反馈 / 历史反馈
 * 历史反馈若有 B 端回复且未读，Tab 与个人中心入口展示红点。
 */
(function (global) {
  'use strict';

  var store = global.LfAftersaleFeedbackStore;
  var DEMO_KEY = 'ua_feedback_demo_v1';
  var mediaPicker = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    var el = document.querySelector('.ua-shop-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ua-shop-toast';
      var host = document.querySelector('.ua-mobile-shell') || document.body;
      host.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    el.classList.add('is-show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
      el.classList.remove('is-show');
    }, 1600);
  }

  function currentUser() {
    var profile = global.UAProfile && typeof global.UAProfile.load === 'function' ? global.UAProfile.load() : null;
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

  function fillTypes() {
    var sel = $('uaFbType');
    if (!sel || !store) return;
    var html = '<option value="">请选择反馈类型</option>';
    store.getEnabledFeedbackTypes().forEach(function (item) {
      html += '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</option>';
    });
    sel.innerHTML = html;
  }

  function syncDots() {
    if (!store) return;
    var user = currentUser();
    var unread = store.hasUnreadReply(user.userId);
    var tabDot = $('uaFbHistoryDot');
    if (tabDot) tabDot.hidden = !unread;
  }

  function renderHistory() {
    var listEl = $('uaFbHistoryList');
    var empty = $('uaFbHistoryEmpty');
    if (!listEl || !store) return;
    var list = store.feedbacksByUser(currentUser().userId);
    if (!list.length) {
      listEl.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    listEl.innerHTML = list
      .map(function (row) {
        var unread = !!(row.reply && row.replyUnread);
        return (
          '<button type="button" class="ua-fb-row" data-fb-id="' +
          escapeHtml(row.id) +
          '">' +
          '<div class="ua-fb-row__meta">' +
          '<span>' +
          escapeHtml(row.createdAt) +
          '</span>' +
          '<span style="display:flex;align-items:center;gap:6px;">' +
          '<span class="ua-fb-row__status' +
          (row.status === '已处理' ? ' is-done' : '') +
          '">' +
          escapeHtml(row.status) +
          '</span>' +
          (unread ? '<span class="ua-fb-row__unread" aria-label="未读回复"></span>' : '') +
          '</span></div>' +
          '<div class="ua-fb-row__title">' +
          escapeHtml(row.content) +
          '</div></button>'
        );
      })
      .join('');
  }

  function openDetail(id) {
    var row = store.getFeedback(id);
    if (!row) return;
    if (row.reply && row.replyUnread) store.markFeedbackRead(id);
    var body = $('uaFbDetailBody');
    var wrap = $('uaFbDetail');
    if (!body || !wrap) return;
    body.innerHTML =
      '<div class="ua-fb-block"><div class="ua-fb-block__title">反馈类型</div><div class="ua-fb-block__text">' +
      escapeHtml(row.typeName) +
      '</div></div>' +
      '<div class="ua-fb-block"><div class="ua-fb-block__title">反馈内容</div><div class="ua-fb-block__text">' +
      escapeHtml(row.content) +
      (global.UaFbMedia && typeof global.UaFbMedia.renderDetail === 'function'
        ? global.UaFbMedia.renderDetail(row)
        : '') +
      '</div></div>' +
      '<div class="ua-fb-block"><div class="ua-fb-block__title">提交时间</div><div class="ua-fb-block__text">' +
      escapeHtml(row.createdAt) +
      '</div></div>' +
      '<div class="ua-fb-block"><div class="ua-fb-block__title">处理状态</div><div class="ua-fb-block__text">' +
      escapeHtml(row.status) +
      '</div></div>' +
      (row.reply
        ? '<div class="ua-fb-block ua-fb-reply"><div class="ua-fb-block__title">平台回复</div><div class="ua-fb-block__text">' +
          escapeHtml(row.reply) +
          '</div></div>'
        : '<div class="ua-fb-block"><div class="ua-fb-block__title">平台回复</div><div class="ua-fb-block__text">暂无回复</div></div>');
    wrap.hidden = false;
    syncDots();
    renderHistory();
  }

  function switchTab(tab) {
    document.querySelectorAll('[data-fb-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-fb-tab') === tab);
    });
    document.querySelectorAll('[data-fb-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-fb-panel') !== tab;
    });
    if (tab === 'history') renderHistory();
  }

  function submitForm() {
    if (!store) return;
    var typeId = ($('uaFbType') || {}).value;
    var content = ($('uaFbContent') || {}).value;
    var user = currentUser();
    var media = mediaPicker && typeof mediaPicker.snapshot === 'function' ? mediaPicker.snapshot() : { images: [], video: null };
    var result = store.addFeedback({
      typeId: typeId,
      content: content,
      userId: user.userId,
      nickname: user.nickname,
      phone: user.phone,
      avatar: user.avatar,
      images: media.images,
      video: media.video
    });
    if (!result.ok) {
      toast(result.message);
      return;
    }
    toast('提交成功');
    if ($('uaFbContent')) $('uaFbContent').value = '';
    if ($('uaFbType')) $('uaFbType').value = '';
    if (mediaPicker) mediaPicker.reset();
    updateCounter();
    renderHistory();
  }

  function updateCounter() {
    var input = $('uaFbContent');
    var counter = $('uaFbContentCounter');
    if (!input || !counter) return;
    counter.textContent = input.value.length + ' / 200';
  }

  function applyDemo(mode) {
    if (!store) return;
    var user = currentUser();
    var base = store.defaultFeedbacks ? store.defaultFeedbacks() : [];
    var others = base.filter(function (row) {
      return row.userId !== user.userId;
    });
    if (mode === 'empty') {
      store.seedFeedbacks(others);
    } else if (mode === 'pending') {
      store.seedFeedbacks(
        [
          {
            id: 'FB901',
            userId: user.userId,
            nickname: user.nickname,
            phone: user.phone,
            avatar: user.avatar,
            typeId: 'FT002',
            typeName: '体验问题',
            content: '直播间点赞后页面会卡一下，希望优化。',
            createdAt: '2026-08-19 14:08:30',
            status: '待处理',
            reply: '',
            remark: '',
            replyUnread: false,
            images: [],
            video: null
          }
        ].concat(others)
      );
    } else if (mode === 'unread') {
      store.seedFeedbacks(base);
    } else if (mode === 'read') {
      store.seedFeedbacks(
        base.map(function (row) {
          var next = Object.assign({}, row);
          if (next.userId === user.userId && next.reply) next.replyUnread = false;
          return next;
        })
      );
    }
    try {
      localStorage.setItem(DEMO_KEY, mode);
    } catch (e) {}
  }

  function mountDemo() {
    var panel = document.createElement('div');
    panel.className = 'ua-fb-demo';
    var saved = 'unread';
    try {
      saved = localStorage.getItem(DEMO_KEY) || 'unread';
    } catch (e) {}
    panel.innerHTML =
      '<div class="ua-fb-demo__title">意见反馈验收开关</div>' +
      '<div class="ua-fb-demo__row"><span>历史状态</span>' +
      '<select id="uaFbDemoMode">' +
      '<option value="empty">无记录</option>' +
      '<option value="pending">待处理</option>' +
      '<option value="unread">未读回复</option>' +
      '<option value="read">已读回复</option>' +
      '</select></div>' +
      '<button type="button" class="ua-fb-demo__apply" id="uaFbDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var sel = $('uaFbDemoMode');
    if (sel) sel.value = saved;
    $('uaFbDemoApply').addEventListener('click', function () {
      applyDemo((sel && sel.value) || 'unread');
      location.reload();
    });
  }

  function bind() {
    if (global.UaNav && typeof global.UaNav.applyBackLink === 'function') {
      global.UaNav.applyBackLink('#uaFbBack', 'profile.html');
    }
    fillTypes();
    if (global.UaFbMedia && typeof global.UaFbMedia.create === 'function') {
      mediaPicker = global.UaFbMedia.create({
        grid: $('uaFbMediaGrid'),
        input: $('uaFbMediaInput'),
        toast: toast
      });
    }
    updateCounter();
    syncDots();

    document.querySelectorAll('[data-fb-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-fb-tab'));
      });
    });

    var content = $('uaFbContent');
    if (content) content.addEventListener('input', updateCounter);
    var submit = $('uaFbSubmit');
    if (submit) submit.addEventListener('click', submitForm);

    var list = $('uaFbHistoryList');
    if (list) {
      list.addEventListener('click', function (ev) {
        var card = ev.target.closest('[data-fb-id]');
        if (card) openDetail(card.getAttribute('data-fb-id'));
      });
    }
    var back = $('uaFbDetailBack');
    if (back) {
      back.addEventListener('click', function () {
        var detail = $('uaFbDetail');
        if (detail) detail.hidden = true;
      });
    }

    try {
      var params = new URLSearchParams(location.search || '');
      if (params.get('tab') === 'history') switchTab('history');
    } catch (e) {}

    mountDemo();
  }

  if (document.querySelector('.ua-fb-page')) bind();

  global.UaFeedback = {
    syncProfileDot: function () {
      if (!store) return;
      var user = currentUser();
      var fbDot = document.getElementById('uaFeedbackDot');
      if (fbDot) fbDot.hidden = !store.hasUnreadReply(user.userId);
      var rpDot = document.getElementById('uaReportDot');
      if (rpDot) rpDot.hidden = !store.hasUnreadReportReply(user.userId);
    }
  };
})(window);
