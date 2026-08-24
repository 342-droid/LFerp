/**
 * 售后 — 举报管理 / 意见反馈（同一脚本，按 body[data-as-fb-kind] 区分）
 *
 * 列表第一列序号倒序；举报来源展示直播详情 + 场次 ID（活动 ID）。
 */
(function () {
  'use strict';

  var store = window.LfAftersaleFeedbackStore;
  if (!store) return;

  var kind = document.body.getAttribute('data-as-fb-kind') === 'feedback' ? 'feedback' : 'report';
  var isReport = kind === 'report';

  var state = {
    tab: 'list',
    page: 1,
    pageSize: 10,
    content: '',
    typeId: '',
    user: ''
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'success');
  }

  function wpPage(file) {
    var wp = window.wmsPath;
    if (wp && typeof wp.page === 'function') return wp.page(file);
    return file;
  }

  function getTypes() {
    return isReport ? store.getReportTypes() : store.getFeedbackTypes();
  }

  function getRows() {
    return isReport ? store.getReports() : store.getFeedbacks();
  }

  function fillTypeFilter() {
    var sel = document.getElementById('qType');
    if (!sel) return;
    var html = '<option value="">全部</option>';
    getTypes().forEach(function (item) {
      html += '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</option>';
    });
    sel.innerHTML = html;
    sel.value = state.typeId || '';
  }

  function matchUser(row, keyword) {
    if (!keyword) return true;
    var k = keyword.toLowerCase();
    return (
      String(row.userId || '').toLowerCase().indexOf(k) >= 0 ||
      String(row.nickname || '').toLowerCase().indexOf(k) >= 0 ||
      String(row.phone || '').toLowerCase().indexOf(k) >= 0
    );
  }

  function filteredRows() {
    var content = state.content.trim().toLowerCase();
    return getRows().filter(function (row) {
      if (state.typeId && row.typeId !== state.typeId) return false;
      if (content && String(row.content || '').toLowerCase().indexOf(content) < 0) return false;
      if (!matchUser(row, state.user.trim())) return false;
      return true;
    });
  }

  function resolveAvatar(avatar) {
    var a = String(avatar || '');
    if (!a) return '';
    if (/^https?:|^data:|^\/user-app\//.test(a)) return a;
    if (a.indexOf('../assets/') === 0) return '../user-app/assets/' + a.slice('../assets/'.length);
    return a;
  }

  function userCell(row) {
    var ch = String(row.nickname || '会').charAt(0);
    var avatarSrc = resolveAvatar(row.avatar);
    var avatar = avatarSrc
      ? '<img class="mem-info-cell__avatar" src="' + escapeHtml(avatarSrc) + '" alt="">'
      : '<span class="mem-info-cell__avatar">' + escapeHtml(ch) + '</span>';
    return (
      '<div class="mem-info-cell">' +
      avatar +
      '<div class="mem-info-cell__meta">' +
      '<div class="mem-info-cell__name">' +
      escapeHtml(row.nickname || '—') +
      '</div>' +
      '<div class="mem-info-cell__id">ID: ' +
      escapeHtml(row.userId || '—') +
      '</div>' +
      '</div></div>'
    );
  }

  function mediaHtml(row, compact) {
    var images = row.images || [];
    var video = row.video;
    if (!images.length && !video) return compact ? '—' : '';
    var html = '<div class="aftersale-fb-media">';
    images.forEach(function (item, idx) {
      html +=
        '<button type="button" class="aftersale-fb-media__thumb" data-media-open="img" data-media-idx="' +
        idx +
        '"><img src="' +
        escapeHtml(item.url || '') +
        '" alt="' +
        escapeHtml(item.name || '') +
        '"></button>';
    });
    if (video) {
      html +=
        '<button type="button" class="aftersale-fb-media__thumb aftersale-fb-media__video" data-media-open="video">视频</button>';
    }
    html += '</div>';
    return html;
  }

  function openLightbox(row, kind, idx) {
    var existing = document.querySelector('[data-as-fb-lightbox]');
    if (existing) existing.remove();
    var mask = document.createElement('div');
    mask.className = 'aftersale-fb-lightbox';
    mask.setAttribute('data-as-fb-lightbox', '1');
    var inner = '';
    var name = '';
    if (kind === 'video' && row.video) {
      name = row.video.name || '视频';
      inner = row.video.url
        ? '<video src="' + escapeHtml(row.video.url) + '" controls autoplay></video>'
        : '<div style="color:#fff;font-size:14px;">演示视频：' + escapeHtml(name) + '</div>';
    } else {
      var item = (row.images || [])[idx] || {};
      name = item.name || '图片';
      inner = '<img src="' + escapeHtml(item.url || '') + '" alt="">';
    }
    mask.innerHTML = inner + '<div class="aftersale-fb-lightbox__name">' + escapeHtml(name) + '</div>';
    mask.addEventListener('click', function () {
      mask.remove();
    });
    document.body.appendChild(mask);
  }

  function ellipsisCell(text) {
    var value = text || '—';
    return (
      '<div class="aftersale-fb-ellipsis" title="' +
      escapeHtml(value) +
      '">' +
      escapeHtml(value) +
      '</div>'
    );
  }

  function mediaFieldHtml(row) {
    var block = mediaHtml(row, false);
    if (!block) return '';
    return (
      '<div class="erp-modal-field"><label class="erp-modal-field__label">图片/视频</label><div class="erp-modal-field__control">' +
      block +
      '</div></div>'
    );
  }

  function statusBadge(status) {
    var done = status === '已处理';
    return (
      '<span class="aftersale-fb-status aftersale-fb-status--' +
      (done ? 'done' : 'pending') +
      '">' +
      escapeHtml(status || '待处理') +
      '</span>'
    );
  }

  function sourceCell(row) {
    var href = wpPage('mdm_live_session_detail.html') + '?id=' + encodeURIComponent(row.sessionId || '');
    return (
      '<div class="aftersale-fb-source">' +
      '<a href="' +
      href +
      '">' +
      escapeHtml(row.source || '直播详情') +
      '</a>' +
      '<span class="aftersale-fb-source__id">场次ID ' +
      escapeHtml(row.sessionId || '—') +
      '</span>' +
      '</div>'
    );
  }

  function closeModal() {
    var el = document.querySelector('[data-as-fb-modal]');
    if (el) el.remove();
  }

  function openModal(title, bodyHtml, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-as-fb-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal erp-modal--as-fb">' +
      '  <div class="erp-modal__header">' +
      '    <h2 class="erp-modal__title">' +
      escapeHtml(title) +
      '</h2>' +
      '    <div class="erp-modal__header-actions">' +
      '      <button type="button" class="erp-modal__header-btn" data-modal-close aria-label="关闭">&times;</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="erp-modal__body">' +
      bodyHtml +
      '  </div>' +
      '  <div class="erp-modal__footer">' +
      '    <button type="button" class="erp-btn" data-modal-close>取消</button>' +
      '    <button type="button" class="erp-btn erp-btn--primary" data-modal-ok>确定</button>' +
      '  </div>' +
      '</div>';
    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    backdrop.querySelector('[data-modal-ok]').addEventListener('click', function () {
      if (typeof onOk === 'function') onOk(backdrop);
    });
    document.body.appendChild(backdrop);
    var first = backdrop.querySelector('textarea, input');
    if (first) first.focus();
  }

  function bindCounter(root, inputId, counterId, max) {
    var input = root.querySelector('#' + inputId);
    var counter = root.querySelector('#' + counterId);
    if (!input || !counter) return;
    function sync() {
      counter.textContent = input.value.length + ' / ' + max;
    }
    input.addEventListener('input', sync);
    sync();
  }

  function openProcessModal(row) {
    var contentLabel = isReport ? '举报内容' : '反馈内容';
    var title = isReport ? '处理举报' : '处理意见反馈';
    openModal(
      title,
      '<div class="erp-modal-field"><label class="erp-modal-field__label">' +
        contentLabel +
        '</label><div class="erp-modal-field__control">' +
        escapeHtml(row.content) +
        '</div></div>' +
        mediaFieldHtml(row) +
        '<div class="erp-modal-field"><label class="erp-modal-field__label"><span class="erp-req">*</span>回复内容</label><div class="erp-modal-field__control">' +
        '<textarea class="erp-textarea" id="asFbReply" maxlength="' +
        store.REPLY_MAX +
        '" placeholder="请填写回复内容，用户可在记录中查看">' +
        escapeHtml(row.reply || '') +
        '</textarea><div class="as-fb-counter" id="asFbReplyCounter"></div></div></div>' +
        '<div class="erp-modal-field"><label class="erp-modal-field__label">备注</label><div class="erp-modal-field__control">' +
        '<textarea class="erp-textarea" id="asFbRemark" maxlength="' +
        store.REMARK_MAX +
        '" placeholder="选填">' +
        escapeHtml(row.remark || '') +
        '</textarea><div class="as-fb-counter" id="asFbRemarkCounter"></div></div></div>',
      function (root) {
        var reply = (root.querySelector('#asFbReply') || {}).value;
        var remark = (root.querySelector('#asFbRemark') || {}).value;
        var result = isReport
          ? store.processReport(row.id, reply, remark)
          : store.processFeedback(row.id, reply, remark);
        if (!result.ok) return toast(result.message, 'warning');
        closeModal();
        toast('已处理并回复');
        renderList();
      }
    );
    var modal = document.querySelector('[data-as-fb-modal]');
    bindCounter(modal, 'asFbReply', 'asFbReplyCounter', store.REPLY_MAX);
    bindCounter(modal, 'asFbRemark', 'asFbRemarkCounter', store.REMARK_MAX);
    if (modal) {
      modal.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-media-open]');
        if (!btn) return;
        ev.preventDefault();
        openLightbox(row, btn.getAttribute('data-media-open'), Number(btn.getAttribute('data-media-idx') || 0));
      });
    }
  }

  function openRemarkModal(row) {
    openModal(
      '备注',
      '<div class="erp-modal-field"><label class="erp-modal-field__label">备注</label><div class="erp-modal-field__control">' +
        '<textarea class="erp-textarea" id="asFbRemark" maxlength="' +
        store.REMARK_MAX +
        '" placeholder="请输入备注">' +
        escapeHtml(row.remark || '') +
        '</textarea><div class="as-fb-counter" id="asFbRemarkCounter"></div></div></div>',
      function (root) {
        var remark = (root.querySelector('#asFbRemark') || {}).value;
        var result = isReport ? store.remarkReport(row.id, remark) : store.remarkFeedback(row.id, remark);
        if (!result.ok) return toast(result.message, 'warning');
        closeModal();
        toast('备注已保存');
        renderList();
      }
    );
    bindCounter(document.querySelector('[data-as-fb-modal]'), 'asFbRemark', 'asFbRemarkCounter', store.REMARK_MAX);
  }

  function openAddTypeModal() {
    openModal(
      isReport ? '新增举报类型' : '新增反馈类型',
      '<div class="erp-modal-field"><label class="erp-modal-field__label"><span class="erp-req">*</span>类型名称</label><div class="erp-modal-field__control">' +
        '<input class="erp-input" id="asFbTypeName" maxlength="' +
        store.TYPE_NAME_MAX +
        '" placeholder="请输入类型，20 个字以内">' +
        '<div class="as-fb-counter" id="asFbTypeNameCounter">0 / ' +
        store.TYPE_NAME_MAX +
        '</div></div></div>',
      function (root) {
        var name = (root.querySelector('#asFbTypeName') || {}).value;
        var result = isReport ? store.addReportType(name) : store.addFeedbackType(name);
        if (!result.ok) return toast(result.message, 'warning');
        closeModal();
        toast('类型已新增');
        fillTypeFilter();
        renderTypes();
      }
    );
    var modal = document.querySelector('[data-as-fb-modal]');
    var input = modal.querySelector('#asFbTypeName');
    var counter = modal.querySelector('#asFbTypeNameCounter');
    if (input && counter) {
      input.addEventListener('input', function () {
        counter.textContent = input.value.length + ' / ' + store.TYPE_NAME_MAX;
      });
    }
  }

  function renderList() {
    var tbody = document.getElementById('asFbListBody');
    var empty = document.getElementById('asFbListEmpty');
    if (!tbody) return;
    var list = filteredRows();
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageItems = list.slice(start, start + state.pageSize);

    if (!pageItems.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      tbody.innerHTML = pageItems
        .map(function (row, idx) {
          var seq = total - start - idx;
          var processDisabled = row.status === '已处理' ? ' disabled class="is-disabled"' : '';
          var extra = isReport
            ? '<td>' +
              mediaHtml(row, true) +
              '</td><td>' +
              sourceCell(row) +
              '</td><td>' +
              escapeHtml(row.createdAt) +
              '</td><td>' +
              statusBadge(row.status) +
              '</td><td>' +
              ellipsisCell(row.reply) +
              '</td><td>' +
              ellipsisCell(row.remark) +
              '</td>'
            : '<td>' +
              mediaHtml(row, true) +
              '</td><td>' +
              escapeHtml(row.createdAt) +
              '</td><td>' +
              statusBadge(row.status) +
              '</td><td>' +
              ellipsisCell(row.reply) +
              '</td><td>' +
              ellipsisCell(row.remark) +
              '</td>';
          return (
            '<tr data-id="' +
            escapeHtml(row.id) +
            '">' +
            '<td>' +
            seq +
            '</td><td>' +
            userCell(row) +
            '</td><td>' +
            escapeHtml(row.typeName) +
            '</td><td>' +
            ellipsisCell(row.content) +
            '</td>' +
            extra +
            '<td><div class="aftersale-fb-actions">' +
            '<button type="button" data-act="process"' +
            processDisabled +
            '>处理</button>' +
            '<button type="button" data-act="remark">备注</button>' +
            '</div></td></tr>'
          );
        })
        .join('');
    }

    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'pagination-container',
        totalItems: total,
        currentPage: state.page,
        pageSize: state.pageSize,
        onPageChange: function (page) {
          state.page = page;
          renderList();
        },
        onPageSizeChange: function (size) {
          state.pageSize = size;
          state.page = 1;
          renderList();
        }
      });
    }
  }

  function renderTypes() {
    var tbody = document.getElementById('asFbTypeBody');
    var empty = document.getElementById('asFbTypeEmpty');
    if (!tbody) return;
    var list = getTypes();
    if (!list.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    tbody.innerHTML = list
      .map(function (item, idx) {
        var seq = list.length - idx;
        var canDelete = (isReport ? store.reportTypeRefCount(item.id) : store.feedbackTypeRefCount(item.id)) === 0;
        var canUp = idx > 0;
        var canDown = idx < list.length - 1;
        return (
          '<tr data-id="' +
          escapeHtml(item.id) +
          '">' +
          '<td>' +
          seq +
          '</td><td>' +
          escapeHtml(item.name) +
          ' <span class="aftersale-fb-status aftersale-fb-status--' +
          (item.enabled ? 'on' : 'off') +
          '">' +
          (item.enabled ? '启用' : '禁用') +
          '</span></td>' +
          '<td><div class="aftersale-fb-creator"><span class="aftersale-fb-creator__nick">' +
          escapeHtml(item.creatorNick) +
          '</span><span class="aftersale-fb-creator__acc">' +
          escapeHtml(item.creatorAccount) +
          '</span></div></td>' +
          '<td><div class="aftersale-fb-actions">' +
          '<button type="button" data-type-act="toggle">' +
          (item.enabled ? '禁用' : '启用') +
          '</button>' +
          '<button type="button" data-type-act="delete"' +
          (canDelete ? '' : ' disabled class="is-disabled" title="已有关联数据，无法删除"') +
          '>删除</button>' +
          '<button type="button" data-type-act="up"' +
          (canUp ? '' : ' disabled class="is-disabled"') +
          '>上移</button>' +
          '<button type="button" data-type-act="down"' +
          (canDown ? '' : ' disabled class="is-disabled"') +
          '>下移</button>' +
          '</div></td></tr>'
        );
      })
      .join('');
  }

  function switchTab(tab) {
    state.tab = tab === 'types' ? 'types' : 'list';
    document.querySelectorAll('[data-as-fb-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-as-fb-tab') === state.tab);
    });
    document.querySelectorAll('[data-as-fb-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-as-fb-panel') !== state.tab;
    });
    if (state.tab === 'types') renderTypes();
    else renderList();
  }

  function readFilter() {
    state.content = (document.getElementById('qContent') || {}).value || '';
    state.typeId = (document.getElementById('qType') || {}).value || '';
    state.user = (document.getElementById('qUser') || {}).value || '';
    state.page = 1;
    renderList();
  }

  function bind() {
    document.querySelectorAll('[data-as-fb-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-as-fb-tab'));
      });
    });

    var query = document.getElementById('asFbFilterQuery');
    var reset = document.getElementById('asFbFilterReset');
    if (query) query.addEventListener('click', readFilter);
    if (reset) {
      reset.addEventListener('click', function () {
        var content = document.getElementById('qContent');
        var type = document.getElementById('qType');
        var user = document.getElementById('qUser');
        if (content) content.value = '';
        if (type) type.value = '';
        if (user) user.value = '';
        readFilter();
      });
    }

    var addType = document.getElementById('asFbAddType');
    if (addType) addType.addEventListener('click', openAddTypeModal);

    var listBody = document.getElementById('asFbListBody');
    if (listBody) {
      listBody.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn || btn.disabled) return;
        var tr = btn.closest('tr');
        var id = tr && tr.getAttribute('data-id');
        var row = null;
        getRows().forEach(function (item) {
          if (item.id === id) row = item;
        });
        if (!row) return;
        if (btn.getAttribute('data-act') === 'process') openProcessModal(row);
        if (btn.getAttribute('data-act') === 'remark') openRemarkModal(row);
      });
      listBody.addEventListener('click', function (ev) {
        var mediaBtn = ev.target.closest('[data-media-open]');
        if (!mediaBtn) return;
        var tr = mediaBtn.closest('tr');
        var id = tr && tr.getAttribute('data-id');
        var row = null;
        getRows().forEach(function (item) {
          if (item.id === id) row = item;
        });
        if (!row) return;
        openLightbox(row, mediaBtn.getAttribute('data-media-open'), Number(mediaBtn.getAttribute('data-media-idx') || 0));
      });
    }

    var typeBody = document.getElementById('asFbTypeBody');
    if (typeBody) {
      typeBody.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-type-act]');
        if (!btn || btn.disabled) return;
        var tr = btn.closest('tr');
        var id = tr && tr.getAttribute('data-id');
        var act = btn.getAttribute('data-type-act');
        var result;
        if (act === 'toggle') {
          result = isReport ? store.toggleReportType(id) : store.toggleFeedbackType(id);
          if (!result.ok) return toast(result.message, 'warning');
          toast(result.item.enabled ? '已启用' : '已禁用');
        } else if (act === 'delete') {
          result = isReport ? store.deleteReportType(id) : store.deleteFeedbackType(id);
          if (!result.ok) return toast(result.message, 'warning');
          toast('已删除');
        } else if (act === 'up' || act === 'down') {
          result = isReport ? store.moveReportType(id, act) : store.moveFeedbackType(id, act);
          if (!result.ok) return toast(result.message, 'warning');
        }
        fillTypeFilter();
        renderTypes();
      });
    }

    try {
      var params = new URLSearchParams(window.location.search || '');
      if (params.get('tab') === 'types') switchTab('types');
    } catch (e) {}
  }

  fillTypeFilter();
  bind();
  renderList();
})();
