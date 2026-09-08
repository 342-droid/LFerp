/**
 * 直播管理 — 直播场次列表
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

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pageWithQuery(file, query) {
    var base = wp.page(file);
    var qs = [];
    Object.keys(query || {}).forEach(function (k) {
      if (query[k] == null || query[k] === '') return;
      qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
    });
    if (!qs.length) return base;
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
  }

  function statusLabel(st) {
    if (st === 'live') return '直播中';
    if (st === 'upcoming') return '未开始';
    if (st === 'ended') return '已结束';
    return st || '—';
  }

  function statusClass(st) {
    if (st === 'live') return 'mdm-status mdm-status--ok';
    if (st === 'upcoming') return 'mdm-status mdm-status--warn';
    return 'mdm-status mdm-status--muted';
  }

  function fillSelects() {
    var slotEl = document.getElementById('qSessionSlot');
    var roomEl = document.getElementById('qSessionRoom');
    if (slotEl) {
      slotEl.innerHTML =
        '<option value="">全部</option>' +
        Demo.timeslots
          .map(function (s) {
            return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>';
          })
          .join('');
    }
    if (roomEl) {
      roomEl.innerHTML =
        '<option value="">全部</option>' +
        Demo.rooms
          .map(function (r) {
            return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml(r.name) + '</option>';
          })
          .join('');
    }
  }

  function readFilter() {
    return {
      name: ((document.getElementById('qSessionName') || {}).value || '').trim(),
      status: (document.getElementById('qSessionStatus') || {}).value || '',
      type: (document.getElementById('qSessionType') || {}).value || '',
      slotId: (document.getElementById('qSessionSlot') || {}).value || '',
      roomId: (document.getElementById('qSessionRoom') || {}).value || ''
    };
  }

  function filteredSessions() {
    var f = readFilter();
    return Demo.sessions.filter(function (s) {
      if (f.name && String(s.name).indexOf(f.name) < 0) return false;
      if (f.status && s.status !== f.status) return false;
      if (f.type && s.type !== f.type) return false;
      if (f.slotId && s.slotId !== f.slotId) return false;
      if (f.roomId && s.roomId !== f.roomId) return false;
      return true;
    });
  }

  function closeModal() {
    var el = document.querySelector('[data-live-session-modal]');
    if (el) el.remove();
  }

  function openConfirm(message, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-session-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--confirm">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">温馨提示</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<div class="erp-modal-confirm__row">' +
      '<div class="erp-modal-confirm__icon">!</div>' +
      '<div class="erp-modal-confirm__msg">' +
      escapeHtml(message) +
      '</div></div></div>' +
      '<div class="erp-modal__footer">' +
      '<button type="button" class="erp-btn" data-cancel>取消</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-ok>确定</button>' +
      '</div></div>';
    function finish() {
      closeModal();
    }
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) finish();
    });
    backdrop.querySelector('[data-close]').addEventListener('click', finish);
    backdrop.querySelector('[data-cancel]').addEventListener('click', finish);
    backdrop.querySelector('[data-ok]').addEventListener('click', function () {
      finish();
      if (typeof onOk === 'function') onOk();
    });
    document.body.appendChild(backdrop);
  }

  function closePromoModal() {
    var el = document.querySelector('[data-live-promo-modal]');
    if (el) el.remove();
  }

  function findSession(id) {
    for (var i = 0; i < Demo.sessions.length; i++) {
      if (Demo.sessions[i].id === id) return Demo.sessions[i];
    }
    return null;
  }

  function promoStoresOf(sess) {
    if (typeof Demo.getSessionPromoStores === 'function') return Demo.getSessionPromoStores(sess);
    return (sess.stores || []).filter(function (s) {
      return s && s.id;
    });
  }

  function promoStaffOf(storeId) {
    if (typeof Demo.listStoreStaff === 'function') return Demo.listStoreStaff(storeId);
    return [];
  }

  function findById(list, id) {
    for (var i = 0; i < (list || []).length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function buildPromoUrl(sess, store, staff) {
    var path = wp.page('user-app/h5/live-room.html');
    var url;
    try {
      url = new URL(path, window.location.href);
    } catch (e) {
      url = null;
    }
    if (!url) {
      var qs = ['sessionId=' + encodeURIComponent(sess.id), 'storeId=' + encodeURIComponent(store.id)];
      if (staff && staff.id) {
        qs.push('staffId=' + encodeURIComponent(staff.id));
        qs.push('inviteName=' + encodeURIComponent(staff.name || ''));
        if (staff.phone) qs.push('invitePhone=' + encodeURIComponent(staff.phone));
      }
      return path + (path.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
    }
    url.searchParams.set('sessionId', sess.id);
    url.searchParams.set('storeId', store.id);
    if (staff && staff.id) {
      url.searchParams.set('staffId', staff.id);
      url.searchParams.set('inviteName', staff.name || '');
      if (staff.phone) url.searchParams.set('invitePhone', staff.phone);
    } else {
      url.searchParams.delete('staffId');
      url.searchParams.delete('inviteName');
      url.searchParams.delete('invitePhone');
    }
    return url.href;
  }

  function appendQrPlaceholder(mount, size) {
    if (!mount) return;
    size = size || 180;
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    c.setAttribute('aria-label', '推广二维码');
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#1a1a1a';
    var n = 21;
    var pad = 10;
    var cell = (size - pad * 2) / n;
    function corner(r, col) {
      return (
        r <= 6 &&
        col <= 6 &&
        (r === 0 ||
          col === 0 ||
          r === 6 ||
          col === 6 ||
          (r >= 2 && r <= 4 && col >= 2 && col <= 4))
      );
    }
    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n; col++) {
        var v = (row * 17 + col * 31 + row * col) % 5 < 2;
        if (row < 7 && col < 7) v = corner(row, col);
        else if (row < 7 && col > n - 8) v = corner(row, n - 1 - col);
        else if (row > n - 8 && col < 7) v = corner(n - 1 - row, col);
        if (v) ctx.fillRect(pad + col * cell, pad + row * cell, Math.max(cell - 1, 1), Math.max(cell - 1, 1));
      }
    }
    mount.appendChild(c);
  }

  function renderPromoQr(mount, text) {
    if (!mount) return;
    mount.innerHTML = '';
    if (window.QRCode) {
      try {
        new window.QRCode(mount, {
          text: text,
          width: 180,
          height: 180,
          colorDark: '#1a1a1a',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
        return;
      } catch (e) {
        /* fall through */
      }
    }
    appendQrPlaceholder(mount, 180);
  }

  function openPromoPoster(sess) {
    closePromoModal();
    var stores = promoStoresOf(sess);
    var state = { storeId: '', staffId: '' };

    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop lf-live-promo-backdrop';
    backdrop.setAttribute('data-live-promo-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal lf-live-promo-modal">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">推广海报</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<p class="lf-live-promo-session">场次：' +
      escapeHtml(sess.name || '') +
      '</p>' +
      '<div data-promo-step="form">' +
      '<div class="erp-modal-field">' +
      '<label class="erp-modal-field__label"><span class="erp-req">*</span>门店</label>' +
      '<div class="erp-modal-field__control">' +
      '<div class="lf-live-promo-store">' +
      '<input class="erp-input" id="livePromoStoreKw" placeholder="搜索适用门店" autocomplete="off">' +
      '<div class="lf-live-promo-store__list" id="livePromoStoreList"></div>' +
      '<p class="lf-live-promo-store__picked" id="livePromoStorePicked">请选择本场适用门店</p>' +
      '</div></div></div>' +
      '<div class="erp-modal-field">' +
      '<label class="erp-modal-field__label">员工</label>' +
      '<div class="erp-modal-field__control">' +
      '<select class="erp-select" id="livePromoStaff" disabled>' +
      '<option value="">请先选择门店</option>' +
      '</select>' +
      '<p class="lf-live-promo-tip">员工非必填。不选则二维码不展示推荐人。</p>' +
      '</div></div></div>' +
      '<div class="lf-live-promo-qr" data-promo-step="qr" hidden>' +
      '<div class="lf-live-promo-qr__store" id="livePromoQrStore"></div>' +
      '<div class="lf-live-promo-qr__inviter" id="livePromoQrInviter" hidden></div>' +
      '<div class="lf-live-promo-qr__code" id="livePromoQrMount"></div>' +
      '<p class="lf-live-promo-qr__hint">扫码进入该直播场次</p>' +
      '</div></div>' +
      '<div class="erp-modal__footer">' +
      '<button type="button" class="erp-btn" data-cancel>取消</button>' +
      '<button type="button" class="erp-btn" data-back hidden>返回修改</button>' +
      '<button type="button" class="erp-btn erp-btn--primary" data-gen>生成推广二维码</button>' +
      '</div></div>';

    var formStep = backdrop.querySelector('[data-promo-step="form"]');
    var qrStep = backdrop.querySelector('[data-promo-step="qr"]');
    var genBtn = backdrop.querySelector('[data-gen]');
    var backBtn = backdrop.querySelector('[data-back]');
    var cancelBtn = backdrop.querySelector('[data-cancel]');

    function close() {
      closePromoModal();
    }

    function filteredStores() {
      var kw = ((document.getElementById('livePromoStoreKw') || {}).value || '').trim().toLowerCase();
      return stores.filter(function (s) {
        if (!kw) return true;
        var name = String(s.name || '').toLowerCase();
        var addr = String(s.address || '').toLowerCase();
        return name.indexOf(kw) >= 0 || addr.indexOf(kw) >= 0;
      });
    }

    function renderStoreList() {
      var list = document.getElementById('livePromoStoreList');
      var picked = document.getElementById('livePromoStorePicked');
      if (!list) return;
      if (!stores.length) {
        list.innerHTML = '<div class="lf-live-promo-store__empty">本场暂无适用门店，无法生成推广海报</div>';
        if (picked) picked.textContent = '请选择本场适用门店';
        return;
      }
      var rows = filteredStores();
      if (!rows.length) {
        list.innerHTML = '<div class="lf-live-promo-store__empty">没有匹配的适用门店</div>';
      } else {
        list.innerHTML = rows
          .map(function (s) {
            var on = s.id === state.storeId ? ' is-active' : '';
            return (
              '<button type="button" class="lf-live-promo-store__item' +
              on +
              '" data-store-id="' +
              escapeHtml(s.id) +
              '">' +
              '<span class="lf-live-promo-store__name">' +
              escapeHtml(s.name || s.id) +
              '</span>' +
              (s.address
                ? '<span class="lf-live-promo-store__sub">' + escapeHtml(s.address) + '</span>'
                : '') +
              '</button>'
            );
          })
          .join('');
      }
      var store = findById(stores, state.storeId);
      if (picked) {
        picked.textContent = store ? '已选：' + store.name : '请选择本场适用门店';
      }
    }

    function fillStaff() {
      var sel = document.getElementById('livePromoStaff');
      if (!sel) return;
      var staffs = state.storeId ? promoStaffOf(state.storeId) : [];
      if (!state.storeId) {
        sel.disabled = true;
        sel.innerHTML = '<option value="">请先选择门店</option>';
        state.staffId = '';
        return;
      }
      sel.disabled = false;
      sel.innerHTML =
        '<option value="">不选择员工</option>' +
        staffs
          .map(function (p) {
            return (
              '<option value="' +
              escapeHtml(p.id) +
              '">' +
              escapeHtml(p.name) +
              (p.role ? '（' + escapeHtml(p.role) + '）' : '') +
              '</option>'
            );
          })
          .join('');
      if (state.staffId && !findById(staffs, state.staffId)) state.staffId = '';
      sel.value = state.staffId || '';
    }

    function showForm() {
      if (formStep) formStep.hidden = false;
      if (qrStep) qrStep.hidden = true;
      if (genBtn) genBtn.hidden = false;
      if (backBtn) backBtn.hidden = true;
      if (cancelBtn) cancelBtn.textContent = '取消';
    }

    function showQr() {
      var store = findById(stores, state.storeId);
      if (!store) {
        toast('请先选择门店', 'warning');
        return;
      }
      var staffs = promoStaffOf(state.storeId);
      var staff = state.staffId ? findById(staffs, state.staffId) : null;
      var storeEl = document.getElementById('livePromoQrStore');
      var inviterEl = document.getElementById('livePromoQrInviter');
      var mount = document.getElementById('livePromoQrMount');
      if (storeEl) storeEl.textContent = store.name || store.id;
      if (inviterEl) {
        if (staff && staff.name) {
          inviterEl.hidden = false;
          inviterEl.textContent = '推荐人：' + staff.name;
        } else {
          inviterEl.hidden = true;
          inviterEl.textContent = '';
        }
      }
      if (formStep) formStep.hidden = true;
      if (qrStep) qrStep.hidden = false;
      if (genBtn) genBtn.hidden = true;
      if (backBtn) backBtn.hidden = false;
      if (cancelBtn) cancelBtn.textContent = '关闭';
      renderPromoQr(mount, buildPromoUrl(sess, store, staff));
    }

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) close();
      var item = ev.target.closest('[data-store-id]');
      if (item && backdrop.contains(item)) {
        var nextId = item.getAttribute('data-store-id') || '';
        if (state.storeId !== nextId) {
          state.storeId = nextId;
          state.staffId = '';
          fillStaff();
        }
        renderStoreList();
      }
    });
    backdrop.querySelector('[data-close]').addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    backBtn.addEventListener('click', showForm);
    genBtn.addEventListener('click', showQr);
    var kw = backdrop.querySelector('#livePromoStoreKw');
    if (kw) {
      kw.addEventListener('input', renderStoreList);
    }
    var staffSel = backdrop.querySelector('#livePromoStaff');
    if (staffSel) {
      staffSel.addEventListener('change', function () {
        state.staffId = staffSel.value || '';
      });
    }

    document.body.appendChild(backdrop);
    renderStoreList();
    fillStaff();
    showForm();
  }

  function render() {
    var tbody = document.getElementById('sessionTableBody');
    if (!tbody) return;
    var rows = filteredSessions();
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;color:#999;padding:24px;">暂无符合条件的直播场次</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (s) {
        var editHref = pageWithQuery('mdm_live_session_form.html', { id: s.id });
        var detailHref = pageWithQuery('mdm_live_session_detail.html', { id: s.id });
        var controlHref = pageWithQuery('mdm_live_control.html', { sessionId: s.id });
        var actions =
          '<a href="' +
          escapeHtml(controlHref) +
          '">中控台</a>';
        // 未开始 / 直播中可编辑；已结束仅中控台+详情
        if (s.status === 'upcoming' || s.status === 'live') {
          actions += '<a href="' + escapeHtml(editHref) + '">编辑</a>';
        }
        actions += '<a href="' + escapeHtml(detailHref) + '">详情</a>';
        actions += '<a href="#" data-act="promo">推广海报</a>';
        if (s.status === 'upcoming') {
          actions += '<a href="#" class="action-link-danger" data-act="delete">删除</a>';
        }
        return (
          '<tr data-id="' +
          escapeHtml(s.id) +
          '">' +
          '<td>' +
          escapeHtml(s.name) +
          '</td>' +
          '<td>' +
          escapeHtml(s.roomName || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.slotName || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.typeName || '—') +
          '</td>' +
          '<td><span class="' +
          statusClass(s.status) +
          '">' +
          escapeHtml(statusLabel(s.status)) +
          '</span></td>' +
          '<td>' +
          escapeHtml(s.startAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.endAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.actualStartAt || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(s.actualEndAt || '—') +
          '</td>' +
          '<td class="action-links">' +
          actions +
          '</td></tr>'
        );
      })
      .join('');
  }

  function bindEvents() {
    var queryBtn = document.getElementById('sessionFilterQuery');
    var resetBtn = document.getElementById('sessionFilterReset');
    var addBtn = document.getElementById('sessionAddBtn');
    if (queryBtn) queryBtn.addEventListener('click', render);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        window.location.href = wp.page('mdm_live_session_form.html');
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        ['qSessionName', 'qSessionStatus', 'qSessionType', 'qSessionSlot', 'qSessionRoom'].forEach(
          function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          }
        );
        render();
      });
    }

    document.querySelectorAll('#liveSessionFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });

    var tbody = document.getElementById('sessionTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var promoEl = ev.target.closest('[data-act="promo"]');
      if (promoEl) {
        ev.preventDefault();
        var promoTr = promoEl.closest('tr[data-id]');
        if (!promoTr) return;
        var promoSess = findSession(promoTr.getAttribute('data-id'));
        if (!promoSess) {
          toast('场次不存在', 'warning');
          return;
        }
        openPromoPoster(promoSess);
        return;
      }
      var actEl = ev.target.closest('[data-act="delete"]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      openConfirm('确定删除该直播场次？', function () {
        for (var i = Demo.sessions.length - 1; i >= 0; i--) {
          if (Demo.sessions[i].id === id) Demo.sessions.splice(i, 1);
        }
        if (typeof Demo.persistSessions === 'function') Demo.persistSessions();
        toast('场次已删除');
        render();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillSelects();
    bindEvents();
    render();
  });
})();
