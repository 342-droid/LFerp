/**
 * 用户 APP — 个人中心举报记录
 * 可查看平台回复；未读回复在入口与列表出红点。
 */
(function (global) {
  'use strict';

  var store = global.LfAftersaleFeedbackStore;
  var DEMO_KEY = 'ua_report_demo_v1';

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

  function renderList() {
    var listEl = $('uaReportList');
    var empty = $('uaReportEmpty');
    if (!listEl || !store) return;
    var list = store.reportsByUser(currentUser().userId);
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
          '<button type="button" class="ua-fb-row" data-rp-id="' +
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
    var row = store.getReport(id);
    if (!row) return;
    if (row.reply && row.replyUnread) store.markReportRead(id);
    var body = $('uaReportDetailBody');
    var wrap = $('uaReportDetail');
    if (!body || !wrap) return;
    body.innerHTML =
      '<div class="ua-fb-block"><div class="ua-fb-block__title">举报类型</div><div class="ua-fb-block__text">' +
      escapeHtml(row.typeName) +
      '</div></div>' +
      '<div class="ua-fb-block"><div class="ua-fb-block__title">举报内容</div><div class="ua-fb-block__text">' +
      escapeHtml(row.content) +
      (global.UaFbMedia && typeof global.UaFbMedia.renderDetail === 'function'
        ? global.UaFbMedia.renderDetail(row)
        : '') +
      '</div></div>' +
      '<div class="ua-fb-block"><div class="ua-fb-block__title">举报来源</div><div class="ua-fb-block__text">' +
      escapeHtml((row.source || '直播详情') + (row.sessionId ? '（场次ID：' + row.sessionId + '）' : '')) +
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
    renderList();
  }

  function applyDemo(mode) {
    if (!store) return;
    var user = currentUser();
    var base = store.defaultReports ? store.defaultReports() : [];
    var others = base.filter(function (row) {
      return row.userId !== user.userId;
    });
    if (mode === 'empty') {
      store.seedReports(others);
    } else if (mode === 'pending') {
      store.seedReports(
        [
          {
            id: 'RP901',
            userId: user.userId,
            nickname: user.nickname,
            phone: user.phone,
            avatar: user.avatar,
            typeId: 'RT005',
            typeName: '虚假宣传',
            content: '主播说今晚全场半价，实际下单还是原价。',
            source: '直播详情',
            sessionId: 'sess-001',
            sessionName: '8.11 晚间生鲜专场',
            createdAt: '2026-08-19 15:12:08',
            status: '待处理',
            reply: '',
            remark: '',
            replyUnread: false,
            images: [{ kind: 'image', name: '价格截图.png', url: '/user-app/assets/shop/beef-review-1.svg' }],
            video: null
          }
        ].concat(others)
      );
    } else if (mode === 'unread') {
      store.seedReports(base);
    } else if (mode === 'read') {
      store.seedReports(
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
      '<div class="ua-fb-demo__title">举报记录验收开关</div>' +
      '<div class="ua-fb-demo__row"><span>记录状态</span>' +
      '<select id="uaRpDemoMode">' +
      '<option value="empty">无记录</option>' +
      '<option value="pending">待处理</option>' +
      '<option value="unread">未读回复</option>' +
      '<option value="read">已读回复</option>' +
      '</select></div>' +
      '<button type="button" class="ua-fb-demo__apply" id="uaRpDemoApply">应用并刷新</button>';
    document.body.appendChild(panel);
    var sel = $('uaRpDemoMode');
    if (sel) sel.value = saved;
    $('uaRpDemoApply').addEventListener('click', function () {
      applyDemo((sel && sel.value) || 'unread');
      location.reload();
    });
  }

  function bind() {
    if (global.UaNav && typeof global.UaNav.applyBackLink === 'function') {
      global.UaNav.applyBackLink('#uaReportBack', 'profile.html');
    }
    renderList();

    var list = $('uaReportList');
    if (list) {
      list.addEventListener('click', function (ev) {
        var row = ev.target.closest('[data-rp-id]');
        if (row) openDetail(row.getAttribute('data-rp-id'));
      });
    }
    var back = $('uaReportDetailBack');
    if (back) {
      back.addEventListener('click', function () {
        var detail = $('uaReportDetail');
        if (detail) detail.hidden = true;
      });
    }
    mountDemo();
  }

  if (document.querySelector('.ua-report-page')) bind();
})(window);
