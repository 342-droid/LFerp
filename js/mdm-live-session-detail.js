/**
 * 直播管理 — 直播场次详情
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

  function viewPermissionLabel(v) {
    var opt = (Demo.viewPermissionOptions || []).find(function (o) {
      return o.value === v;
    });
    return opt ? opt.label : v || '—';
  }

  function descItem(label, valueHtml, span2) {
    return (
      '<div class="lf-live-desc-item' +
      (span2 ? ' lf-live-desc-item--wide' : '') +
      '">' +
      '<div class="lf-live-desc-item__label">' +
      escapeHtml(label) +
      '</div>' +
      '<div class="lf-live-desc-item__value">' +
      valueHtml +
      '</div></div>'
    );
  }

  function chipsHtml(list, emptyText) {
    if (!list || !list.length) return escapeHtml(emptyText || '—');
    return list
      .map(function (item) {
        var text = item.label || item.name || item.code || item.id || '—';
        return '<span class="lf-live-chip">' + escapeHtml(text) + '</span>';
      })
      .join('');
  }

  function coverHtml(url) {
    if (!url) return '—';
    return '<img class="lf-live-detail-cover" src="' + escapeHtml(url) + '" alt="直播封面">';
  }

  function render(sess) {
    var empty = document.getElementById('sessionDetailEmpty');
    var panel = document.getElementById('sessionDetailPanel');
    if (!sess) {
      if (empty) empty.hidden = false;
      if (panel) panel.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (panel) panel.hidden = false;

    document.getElementById('dName').textContent = sess.name || '—';
    document.getElementById('dRoomId').textContent = sess.roomId || '—';
    var badge = document.getElementById('dStatusBadge');
    badge.className = statusBadgeClass(sess.status);
    badge.textContent = statusLabel(sess.status);

    document.getElementById('dBaseGrid').innerHTML = [
      descItem('场次名称', escapeHtml(sess.name || '—')),
      descItem('直播间名称', escapeHtml(sess.roomName || '—')),
      descItem('直播间ID', escapeHtml(sess.roomId || '—')),
      descItem('直播时段', escapeHtml(sess.slotName || sess.slotId || '—')),
      descItem('直播类型', escapeHtml(sess.liveTypeName || sess.typeName || '—')),
      descItem('主播名称', escapeHtml(sess.anchorName || '—')),
      descItem('开播时间', escapeHtml(sess.startAt || '—')),
      descItem('结束时间', escapeHtml(sess.endAt || '—')),
      descItem('创建时间', escapeHtml(sess.createdAt || '—')),
      descItem('直播封面', coverHtml(sess.cover), true),
      descItem('直播简介', escapeHtml(sess.intro || '—'), true)
    ].join('');

    var scopeExtra = '';
    if (sess.liveType === 'REGION') {
      scopeExtra = descItem('适用区域', chipsHtml(sess.regions), true);
    } else if (sess.liveType === 'TARGETED') {
      scopeExtra = descItem('适用门店', chipsHtml(sess.stores), true);
    }

    document.getElementById('dScopeGrid').innerHTML = [
      descItem('观看权限', escapeHtml(viewPermissionLabel(sess.viewPermission))),
      descItem('分发范围', escapeHtml(sess.liveTypeName || '—')),
      scopeExtra
    ].join('');

    document.getElementById('dStatusGrid').innerHTML = [
      descItem(
        '创建状态',
        escapeHtml(sess.createStatus === 'ENABLED' ? '启用' : sess.createStatus === 'DRAFT' ? '草稿' : sess.createStatus || '—')
      ),
      descItem('直播状态', escapeHtml(statusLabel(sess.status))),
      descItem('备注', escapeHtml(sess.remark || '—'), true)
    ].join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var id = qs('id');
    var sess = id ? findSession(id) : null;
    var back = document.getElementById('sessionDetailBack');
    var editBtn = document.getElementById('sessionDetailEdit');
    var listHref = wp.page('mdm_live_session.html');
    if (back) back.setAttribute('href', listHref);
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        if (!id) return;
        window.location.href = wp.page('mdm_live_session_form.html') + '?id=' + encodeURIComponent(id);
      });
      editBtn.disabled = !sess;
    }
    render(sess);
  });
})();
