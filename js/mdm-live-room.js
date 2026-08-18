/**
 * 直播管理 — 直播间列表
 */
(function () {
  'use strict';

  var Demo = window.MdmLiveDemo;
  if (!Demo) return;

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

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function nowStr() {
    var d = new Date();
    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      ' ' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  function statusLabel(st) {
    if (st === 'enabled') return '启用';
    if (st === 'disabled') return '禁用';
    if (st === 'stopped') return '停用';
    return st || '—';
  }

  function statusClass(st) {
    if (st === 'enabled') return 'mdm-status mdm-status--ok';
    if (st === 'disabled') return 'mdm-status mdm-status--muted';
    if (st === 'stopped') return 'mdm-status mdm-status--warn';
    return 'mdm-status mdm-status--muted';
  }

  function getById(id) {
    for (var i = 0; i < Demo.rooms.length; i++) {
      if (Demo.rooms[i].id === id) return Demo.rooms[i];
    }
    return null;
  }

  function readFilter() {
    return {
      name: ((document.getElementById('qRoomName') || {}).value || '').trim(),
      status: (document.getElementById('qRoomStatus') || {}).value || ''
    };
  }

  function filteredRooms() {
    var f = readFilter();
    return Demo.rooms.filter(function (r) {
      if (f.name && String(r.name).indexOf(f.name) < 0) return false;
      if (f.status) {
        if (f.status === 'enabled' && r.status !== 'enabled') return false;
        if (f.status === 'disabled' && r.status !== 'disabled' && r.status !== 'stopped') return false;
      }
      return true;
    });
  }

  function closeModal() {
    var el = document.querySelector('[data-live-room-modal]');
    if (el) el.remove();
  }

  /** 确保直播间有推流通道演示数据（每间最多 1 条，对齐 admin） */
  function ensureChannels(room) {
    if (!room.channels) {
      room.channels = room.streamChannel
        ? [
            {
              id: 'ch-' + room.id,
              streamName: 'stream_' + String(room.id).replace(/\W/g, '_'),
              status: 'active',
              role: 'primary',
              pullUrl:
                'https://live-pull.demo.lengfenghl.org.cn/live/' +
                String(room.id).replace(/\W/g, '_') +
                '.flv'
            }
          ]
        : [];
    }
    return room.channels;
  }

  function openStreamPanel(room) {
    closeModal();
    var channels = ensureChannels(room);
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-room-modal', '1');

    function channelRowsHtml() {
      if (!channels.length) {
        return (
          '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">' +
          '暂无推流通道，点击右上角新增</td></tr>'
        );
      }
      return channels
        .map(function (ch) {
          var statusText = ch.status === 'active' ? '主推中' : '已停用';
          var statusCls = ch.status === 'active' ? 'lf-live-badge lf-live-badge--ok' : 'lf-live-badge lf-live-badge--muted';
          var roleText = ch.role === 'primary' ? '主推' : '备用';
          return (
            '<tr data-ch-id="' +
            escapeHtml(ch.id) +
            '">' +
            '<td>' +
            escapeHtml(ch.id) +
            '</td>' +
            '<td>' +
            escapeHtml(ch.streamName) +
            '</td>' +
            '<td><span class="' +
            statusCls +
            '">' +
            statusText +
            '</span></td>' +
            '<td>' +
            roleText +
            '</td>' +
            '<td style="max-width:220px;word-break:break-all;font-size:12px;">' +
            escapeHtml(ch.pullUrl) +
            '</td>' +
            '<td class="action-links">' +
            '<a href="#" data-stream-act="copy">复制拉流地址</a>' +
            (ch.role !== 'primary'
              ? '<a href="#" data-stream-act="primary">设为主推</a>'
              : '') +
            (ch.status === 'active'
              ? '<a href="#" data-stream-act="disable">停用</a>'
              : '<a href="#" data-stream-act="enable">启用</a>') +
            '</td></tr>'
          );
        })
        .join('');
    }

    function paint() {
      var body = backdrop.querySelector('[data-stream-tbody]');
      if (body) body.innerHTML = channelRowsHtml();
      room.streamChannel = channels.length
        ? channels[0].streamName || channels[0].id
        : room.streamChannel;
    }

    backdrop.innerHTML =
      '<div class="erp-modal" style="width:820px;max-width:96vw;">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">推流通道 · ' +
      escapeHtml(room.name) +
      '</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-btn erp-btn--primary" data-add-ch>新增推流通道</button>' +
      '<button type="button" class="erp-modal__close" data-close aria-label="关闭">×</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<p class="lf-live-footnote" style="margin-top:0;">直播间 ID：' +
      escapeHtml(room.id) +
      '　·　每个直播间仅支持 1 个推流通道</p>' +
      '<div class="table-scroll-container">' +
      '<table class="table"><thead><tr>' +
      '<th>通道 ID</th><th>StreamName</th><th>状态</th><th>主备</th>' +
      '<th>拉流地址（含环境域名）</th><th>操作</th>' +
      '</tr></thead><tbody data-stream-tbody></tbody></table></div>' +
      '</div>' +
      '<div class="erp-modal__footer">' +
      '<button type="button" class="erp-btn" data-close>关闭</button>' +
      '</div></div>';

    backdrop.addEventListener('click', function (ev) {
      if (ev.target === backdrop) closeModal();
    });
    backdrop.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    backdrop.querySelector('[data-add-ch]').addEventListener('click', function () {
      if (channels.length >= 1) {
        toast('每个直播间仅支持 1 个推流通道', 'warning');
        return;
      }
      var sn = 'stream_' + String(room.id).replace(/\W/g, '_') + '_' + Date.now().toString(36);
      channels.push({
        id: 'ch-' + Date.now().toString(36),
        streamName: sn,
        status: 'active',
        role: 'primary',
        pullUrl: 'https://live-pull.demo.lengfenghl.org.cn/live/' + sn + '.flv'
      });
      toast('推流通道创建成功');
      paint();
      render();
    });
    backdrop.querySelector('[data-stream-tbody]').addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-stream-act]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-ch-id]');
      if (!tr) return;
      var chId = tr.getAttribute('data-ch-id');
      var ch = null;
      for (var i = 0; i < channels.length; i++) {
        if (channels[i].id === chId) {
          ch = channels[i];
          break;
        }
      }
      if (!ch) return;
      var act = actEl.getAttribute('data-stream-act');
      if (act === 'copy') {
        var text = ch.pullUrl || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              toast('已复制拉流地址');
            },
            function () {
              toast(text, 'info');
            }
          );
        } else {
          toast(text || '暂无地址', 'info');
        }
        return;
      }
      if (act === 'primary') {
        channels.forEach(function (c) {
          c.role = c.id === chId ? 'primary' : 'backup';
        });
        toast('已设为主推');
        paint();
        return;
      }
      if (act === 'disable') {
        ch.status = 'disabled';
        toast('已停用');
        paint();
        return;
      }
      if (act === 'enable') {
        ch.status = 'active';
        toast('已启用');
        paint();
      }
    });

    document.body.appendChild(backdrop);
    paint();
  }

  function openFormModal(room) {
    closeModal();
    var isEdit = !!room;
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-room-modal', '1');
    backdrop.innerHTML =
      '<div class="erp-modal" style="width:480px;max-width:92vw;">' +
      '<div class="erp-modal__header">' +
      '<h2 class="erp-modal__title">' +
      (isEdit ? '编辑直播间' : '新建直播间') +
      '</h2>' +
      '<div class="erp-modal__header-actions">' +
      '<button type="button" class="erp-modal__header-btn" data-close aria-label="关闭">&times;</button>' +
      '</div></div>' +
      '<div class="erp-modal__body">' +
      '<div class="lf-live-form-row">' +
      '<label><span class="req">*</span>直播间名称</label>' +
      '<div class="lf-live-form-control">' +
      '<input id="liveRoomNameInput" maxlength="40" placeholder="请输入直播间名称" value="' +
      escapeHtml(room ? room.name : '') +
      '">' +
      '</div></div>' +
      (isEdit
        ? '<div class="lf-live-form-row"><label>推流通道</label><div class="lf-live-form-control"><input id="liveRoomChannelInput" maxlength="40" value="' +
          escapeHtml(room.streamChannel || '') +
          '"></div></div>'
        : '') +
      '</div>' +
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
      var nameEl = document.getElementById('liveRoomNameInput');
      var name = (nameEl && nameEl.value ? nameEl.value : '').trim();
      if (!name) {
        toast('请输入直播间名称', 'warning');
        if (nameEl) nameEl.focus();
        return;
      }
      if (isEdit) {
        room.name = name;
        var chEl = document.getElementById('liveRoomChannelInput');
        if (chEl) room.streamChannel = (chEl.value || '').trim() || room.streamChannel;
        toast('直播间已更新');
      } else {
        Demo.rooms.unshift({
          id: 'room-' + Date.now().toString(36),
          name: name,
          status: 'enabled',
          streamChannel: '推流通道-' + String.fromCharCode(65 + (Demo.rooms.length % 26)) + (Demo.rooms.length + 1),
          createdAt: nowStr()
        });
        toast('直播间已创建');
      }
      finish();
      render();
    });

    document.body.appendChild(backdrop);
    var input = document.getElementById('liveRoomNameInput');
    if (input) {
      input.focus();
      input.select();
    }
  }

  function openConfirm(message, onOk) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.className = 'erp-modal-backdrop';
    backdrop.setAttribute('data-live-room-modal', '1');
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

  function render() {
    var tbody = document.getElementById('roomTableBody');
    if (!tbody) return;
    var rows = filteredRooms();
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#999;padding:24px;">暂无符合条件的直播间</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        var toggleText = r.status === 'enabled' ? '禁用' : '启用';
        return (
          '<tr data-id="' +
          escapeHtml(r.id) +
          '">' +
          '<td>' +
          escapeHtml(r.name) +
          '</td>' +
          '<td><span class="' +
          statusClass(r.status) +
          '">' +
          escapeHtml(statusLabel(r.status)) +
          '</span></td>' +
          '<td>' +
          escapeHtml(r.streamChannel || '—') +
          '</td>' +
          '<td>' +
          escapeHtml(r.createdAt || '—') +
          '</td>' +
          '<td class="action-links">' +
          '<a href="#" data-act="toggle">' +
          toggleText +
          '</a>' +
          '<a href="#" data-act="edit">编辑</a>' +
          '<a href="#" data-act="stream">推流通道</a>' +
          '<span class="lf-live-more" data-more-wrap>' +
          '<button type="button" class="lf-live-more__btn" data-more-toggle>更多<span class="lf-live-more__caret">▼</span></button>' +
          '<div class="lf-live-more__menu">' +
          '<button type="button" class="lf-live-more__item" data-act="stop">停用</button>' +
          '<button type="button" class="lf-live-more__item lf-live-more__item--danger" data-act="delete">删除</button>' +
          '</div></span>' +
          '</td></tr>'
        );
      })
      .join('');
  }

  function closeAllMore() {
    document.querySelectorAll('.lf-live-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
  }

  function bindEvents() {
    var queryBtn = document.getElementById('roomFilterQuery');
    var resetBtn = document.getElementById('roomFilterReset');
    var addBtn = document.getElementById('roomAddBtn');
    if (queryBtn) queryBtn.addEventListener('click', render);
    if (addBtn) addBtn.addEventListener('click', function () {
      openFormModal(null);
    });
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var name = document.getElementById('qRoomName');
        var status = document.getElementById('qRoomStatus');
        if (name) name.value = '';
        if (status) status.value = '';
        render();
      });
    }

    document.querySelectorAll('#liveRoomFilterForm .input-wrapper .clear-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement && btn.parentElement.querySelector('input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });

    document.addEventListener('click', function (ev) {
      var moreBtn = ev.target.closest('[data-more-toggle]');
      if (moreBtn) {
        ev.preventDefault();
        var wrap = moreBtn.closest('[data-more-wrap]');
        var wasOpen = wrap && wrap.classList.contains('is-open');
        closeAllMore();
        if (wrap && !wasOpen) wrap.classList.add('is-open');
        return;
      }
      if (!ev.target.closest('[data-more-wrap]')) closeAllMore();
    });

    var tbody = document.getElementById('roomTableBody');
    if (!tbody) return;
    tbody.addEventListener('click', function (ev) {
      var actEl = ev.target.closest('[data-act]');
      if (!actEl) return;
      ev.preventDefault();
      var tr = actEl.closest('tr[data-id]');
      if (!tr) return;
      var id = tr.getAttribute('data-id');
      var room = getById(id);
      if (!room) return;
      var act = actEl.getAttribute('data-act');
      closeAllMore();

      if (act === 'edit') {
        openFormModal(room);
        return;
      }
      if (act === 'stream') {
        openStreamPanel(room);
        return;
      }
      if (act === 'toggle') {
        if (room.status === 'enabled') {
          room.status = 'disabled';
          toast('已禁用直播间');
        } else {
          room.status = 'enabled';
          toast('已启用直播间');
        }
        render();
        return;
      }
      if (act === 'stop') {
        openConfirm('确定停用该直播间？停用后不可用于新建场次。', function () {
          room.status = 'stopped';
          toast('直播间已停用');
          render();
        });
        return;
      }
      if (act === 'delete') {
        openConfirm('确定删除直播间？删除后该直播间下未结束的排期将无法继续。', function () {
          Demo.rooms = Demo.rooms.filter(function (r) {
            return r.id !== id;
          });
          toast('直播间已删除');
          render();
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    render();
  });
})();
