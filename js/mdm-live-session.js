/**
 * 直播管理 — 直播场次列表
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

  var listState = { status: '', page: 1, pageSize: 20 };

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
      status: listState.status || '',
      type: (document.getElementById('qSessionType') || {}).value || '',
      slotId: (document.getElementById('qSessionSlot') || {}).value || '',
      roomId: (document.getElementById('qSessionRoom') || {}).value || ''
    };
  }

  function matchSession(s, f, ignoreStatus) {
    if (f.name && String(s.name).indexOf(f.name) < 0) return false;
    if (!ignoreStatus && f.status && s.status !== f.status) return false;
    if (f.type && s.type !== f.type) return false;
    if (f.slotId && s.slotId !== f.slotId) return false;
    if (f.roomId && s.roomId !== f.roomId) return false;
    return true;
  }

  function sessionsByFilter(ignoreStatus) {
    var f = readFilter();
    return Demo.sessions.filter(function (s) {
      return matchSession(s, f, ignoreStatus);
    });
  }

  function filteredSessions() {
    return sessionsByFilter(false);
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

  function coverFallbacks() {
    return [
      'user-app/assets/shop/cat-veg.svg',
      'user-app/assets/shop/beef-hero.svg',
      'user-app/assets/restock/product-cola.svg',
      'user-app/assets/shop/banner-featured.svg',
      'user-app/assets/shop/product-dumpling.svg',
      'user-app/assets/restock/product-tomato.svg'
    ].map(function (file) {
      return wp.page(file);
    });
  }

  function coverSrc(sess, index) {
    if (sess.cover) return sess.cover;
    var list = coverFallbacks();
    return list[index % list.length];
  }

  function dash(value) {
    var text = String(value == null ? '' : value).trim();
    return text || '—';
  }

  function closeMenus() {
    document.querySelectorAll('.lf-sess-more__menu').forEach(function (menu) {
      menu.hidden = true;
    });
  }

  function updateStatusTabs(baseRows) {
    var counts = { all: baseRows.length, live: 0, upcoming: 0, ended: 0 };
    baseRows.forEach(function (s) {
      if (counts[s.status] != null) counts[s.status] += 1;
    });
    document.querySelectorAll('#sessionStatusTabs [data-tab-count]').forEach(function (node) {
      var key = node.getAttribute('data-tab-count');
      node.textContent = String(counts[key] || 0);
    });
    document.querySelectorAll('#sessionStatusTabs [data-status]').forEach(function (btn) {
      btn.classList.toggle('is-active', (btn.getAttribute('data-status') || '') === listState.status);
    });
  }

  function pageWindow(current, total) {
    if (total <= 7) {
      var all = [];
      var n = 1;
      for (n = 1; n <= total; n++) all.push(n);
      return all;
    }
    var pages = [1];
    var start = Math.max(2, current - 1);
    var end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push('...');
    var i = start;
    for (i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('...');
    pages.push(total);
    return pages;
  }

  function renderPager(total) {
    var host = document.getElementById('sessionPager');
    if (!host) return;
    var size = listState.pageSize;
    var pages = Math.max(1, Math.ceil(total / size));
    if (listState.page > pages) listState.page = pages;
    if (listState.page < 1) listState.page = 1;
    var nums = pageWindow(listState.page, pages);
    var sizeOptions = [10, 20, 50]
      .map(function (n) {
        return '<option value="' + n + '"' + (n === size ? ' selected' : '') + '>' + n + '条/页</option>';
      })
      .join('');
    host.innerHTML =
      '<span class="lf-sess-pager__total">共 ' + total + ' 条</span>' +
      '<select class="lf-sess-pager__size" id="sessionPageSize" aria-label="每页条数">' +
      sizeOptions +
      '</select>' +
      '<div class="lf-sess-pager__nav">' +
      '<button type="button" class="lf-sess-pager__btn" data-page="prev"' +
      (listState.page <= 1 ? ' disabled' : '') +
      ' aria-label="上一页">&lt;</button>' +
      nums
        .map(function (n) {
          if (n === '...') return '<span class="lf-sess-pager__ellipsis">…</span>';
          return (
            '<button type="button" class="lf-sess-pager__btn' +
            (n === listState.page ? ' is-active' : '') +
            '" data-page="' +
            n +
            '">' +
            n +
            '</button>'
          );
        })
        .join('') +
      '<button type="button" class="lf-sess-pager__btn" data-page="next"' +
      (listState.page >= pages ? ' disabled' : '') +
      ' aria-label="下一页">&gt;</button>' +
      '</div>' +
      '<label class="lf-sess-pager__goto">前往<input class="lf-sess-pager__jump" id="sessionPageJump" inputmode="numeric" value="' +
      listState.page +
      '" aria-label="跳转页码">页</label>';
  }

  function renderCard(s, index) {
    var editHref = pageWithQuery('mdm_live_session_form.html', { id: s.id });
    var detailHref = pageWithQuery('mdm_live_session_detail.html', { id: s.id });
    var controlHref = pageWithQuery('mdm_live_control.html', { sessionId: s.id });
    var canEdit = s.status === 'upcoming' || s.status === 'live';
    var menu =
      '<a href="' + escapeHtml(detailHref) + '">详情</a>' +
      (canEdit ? '<a href="' + escapeHtml(editHref) + '">编辑</a>' : '') +
      '<button type="button" data-act="promo">推广海报</button>' +
      (s.status === 'upcoming'
        ? '<button type="button" class="is-danger" data-act="delete">删除</button>'
        : '');
    var avatar = wp.page('user-app/assets/shop/live-avatar.svg');
    return (
      '<article class="lf-sess-card" data-id="' +
      escapeHtml(s.id) +
      '">' +
      '<div class="lf-sess-card__head">' +
      '<img class="lf-sess-card__avatar" src="' +
      escapeHtml(avatar) +
      '" alt="">' +
      '<div class="lf-sess-card__title">' +
      '<span class="lf-sess-card__name">' +
      escapeHtml(s.name) +
      '</span>' +
      '<span class="lf-sess-card__status lf-sess-card__status--' +
      escapeHtml(s.status || 'ended') +
      '">' +
      escapeHtml(statusLabel(s.status)) +
      '</span></div>' +
      '<div class="lf-sess-card__ops">' +
      '<a class="lf-sess-card__control" href="' +
      escapeHtml(controlHref) +
      '">中控台</a>' +
      '<div class="lf-sess-more">' +
      '<button type="button" class="lf-sess-more__btn" data-more>更多 <span aria-hidden="true">▾</span></button>' +
      '<div class="lf-sess-more__menu" hidden>' +
      menu +
      '</div></div></div></div>' +
      '<div class="lf-sess-card__meta">' +
      '<p>开播时间：' + escapeHtml(dash(s.startAt)) + '</p>' +
      '<p>结束时间：' + escapeHtml(dash(s.endAt)) + '</p>' +
      '<p>实际开播：' + escapeHtml(dash(s.actualStartAt)) + '</p>' +
      '<p>实际结束：' + escapeHtml(dash(s.actualEndAt)) + '</p>' +
      '<p>直播间：' + escapeHtml(dash(s.roomName)) + '</p>' +
      '<p>时段：' + escapeHtml(dash(s.slotName)) + '</p>' +
      '<p>类型：' + escapeHtml(dash(s.typeName)) + '</p>' +
      '</div>' +
      '<div class="lf-sess-card__cover">' +
      '<img src="' +
      escapeHtml(coverSrc(s, index)) +
      '" alt="' +
      escapeHtml(s.name || '') +
      '">' +
      '</div></article>'
    );
  }

  function render() {
    var grid = document.getElementById('sessionCardGrid');
    if (!grid) return;
    closeMenus();
    var baseRows = sessionsByFilter(true);
    updateStatusTabs(baseRows);
    var rows = filteredSessions();
    var size = listState.pageSize;
    var pages = Math.max(1, Math.ceil(rows.length / size) || 1);
    if (listState.page > pages) listState.page = pages;
    var start = (listState.page - 1) * size;
    var pageRows = rows.slice(start, start + size);
    if (!pageRows.length) {
      grid.innerHTML = '<div class="lf-sess-empty">暂无符合条件的直播场次</div>';
    } else {
      grid.innerHTML = pageRows
        .map(function (s, idx) {
          return renderCard(s, start + idx);
        })
        .join('');
    }
    renderPager(rows.length);
  }

  function bindEvents() {
    var queryBtn = document.getElementById('sessionFilterQuery');
    var resetBtn = document.getElementById('sessionFilterReset');
    var addBtn = document.getElementById('sessionAddBtn');
    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        listState.page = 1;
        render();
      });
    }
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        window.location.href = wp.page('mdm_live_session_form.html');
      });
    }
    if (queryBtn) {
      var form = document.getElementById('liveSessionFilterForm');
      if (form) {
        form.addEventListener('keydown', function (ev) {
          if (ev.key !== 'Enter') return;
          ev.preventDefault();
          listState.page = 1;
          render();
        });
      }
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        ['qSessionName', 'qSessionType', 'qSessionSlot', 'qSessionRoom'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        listState.status = '';
        listState.page = 1;
        render();
      });
    }

    var tabs = document.getElementById('sessionStatusTabs');
    if (tabs) {
      tabs.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-status]');
        if (!btn) return;
        listState.status = btn.getAttribute('data-status') || '';
        listState.page = 1;
        render();
      });
    }

    var grid = document.getElementById('sessionCardGrid');
    if (grid) {
      grid.addEventListener('click', function (ev) {
        var moreBtn = ev.target.closest('[data-more]');
        if (moreBtn) {
          ev.preventDefault();
          ev.stopPropagation();
          var menu = moreBtn.parentElement && moreBtn.parentElement.querySelector('.lf-sess-more__menu');
          var willOpen = menu && menu.hidden;
          closeMenus();
          if (willOpen) menu.hidden = false;
          return;
        }
        var promoEl = ev.target.closest('[data-act="promo"]');
        if (promoEl) {
          ev.preventDefault();
          var promoCard = promoEl.closest('[data-id]');
          if (!promoCard) return;
          var promoSess = findSession(promoCard.getAttribute('data-id'));
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
        var card = actEl.closest('[data-id]');
        if (!card) return;
        var id = card.getAttribute('data-id');
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

    var pager = document.getElementById('sessionPager');
    if (pager) {
      pager.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var flag = btn.getAttribute('data-page');
        var total = filteredSessions().length;
        var pages = Math.max(1, Math.ceil(total / listState.pageSize));
        if (flag === 'prev') listState.page = Math.max(1, listState.page - 1);
        else if (flag === 'next') listState.page = Math.min(pages, listState.page + 1);
        else listState.page = parseInt(flag, 10) || 1;
        render();
      });
      pager.addEventListener('change', function (ev) {
        if (ev.target && ev.target.id === 'sessionPageSize') {
          listState.pageSize = parseInt(ev.target.value, 10) || 20;
          listState.page = 1;
          render();
        }
      });
      pager.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' || !ev.target || ev.target.id !== 'sessionPageJump') return;
        ev.preventDefault();
        var total = filteredSessions().length;
        var pages = Math.max(1, Math.ceil(total / listState.pageSize));
        var next = parseInt(ev.target.value, 10);
        if (!next || next < 1) next = 1;
        if (next > pages) next = pages;
        listState.page = next;
        render();
      });
    }

    document.addEventListener('click', function () {
      closeMenus();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillSelects();
    bindEvents();
    render();
  });
})();
