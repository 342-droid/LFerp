/**
 * 直播管理 — 直播中控工作台
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

  var sessionId = '';
  var productQuery = '';

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

  function qs(name) {
    return new URLSearchParams(window.location.search || '').get(name) || '';
  }

  function findSession(id) {
    for (var i = 0; i < Demo.sessions.length; i++) {
      if (Demo.sessions[i].id === id) return Demo.sessions[i];
    }
    return null;
  }

  function productsOf(id) {
    if (!id) return [];
    if (!Demo.productsBySession[id]) Demo.productsBySession[id] = [];
    return Demo.productsBySession[id];
  }

  function metricsOf(id) {
    if (!Demo.controlMetrics[id]) {
      Demo.controlMetrics[id] = {
        viewers: 0,
        totalViews: 0,
        peakViewers: 0,
        likes: 0,
        orderCount: 0,
        orderGmv: 0,
        salesAmount: 0,
        recentOrders: [],
        chatMessages: []
      };
    }
    return Demo.controlMetrics[id];
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

  function liveStatusLabel(st) {
    var map = {
      selling: '在售',
      displaying: '展示中',
      explaining: '讲解中',
      sold_out: '售罄',
      off_shelf: '已下架'
    };
    return map[st] || st || '在售';
  }

  function liveStatusClass(st) {
    if (st === 'explaining') return 'lf-live-badge lf-live-badge--live';
    if (st === 'displaying') return 'lf-live-badge lf-live-badge--ok';
    if (st === 'sold_out') return 'lf-live-badge lf-live-badge--danger';
    if (st === 'off_shelf') return 'lf-live-badge lf-live-badge--muted';
    return 'lf-live-badge lf-live-badge--warn';
  }

  function broadcastText(sess) {
    if (!sess) return '未开播';
    if (sess.status === 'live') return '直播中';
    if (sess.status === 'ended') return '已结束';
    return '未开播';
  }

  function formatMoney(n) {
    var v = Number(n);
    if (isNaN(v)) return '¥0.00';
    return '¥' + v.toFixed(2);
  }

  function formatNum(n) {
    var v = Number(n) || 0;
    if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
    return String(v);
  }

  function fillSessionSelect(preset) {
    var sel = document.getElementById('controlSessionSelect');
    if (!sel) return;
    sel.innerHTML =
      '<option value="">请选择直播场次</option>' +
      Demo.sessions
        .map(function (s) {
          return (
            '<option value="' +
            escapeHtml(s.id) +
            '"' +
            (s.id === preset ? ' selected' : '') +
            '>' +
            escapeHtml(s.name) +
            '</option>'
          );
        })
        .join('');
  }

  function enterSession(id) {
    if (!id || !findSession(id)) {
      toast('请选择直播场次', 'warning');
      return;
    }
    var url = wp.page('mdm_live_control.html') + '?sessionId=' + encodeURIComponent(id);
    window.history.replaceState(null, '', url);
    sessionId = id;
    render();
  }

  function renderHeader(sess) {
    var title = document.getElementById('controlSessionTitle');
    var badge = document.getElementById('controlStatusBadge');
    if (title) title.textContent = sess ? sess.name : '直播中控';
    if (badge) {
      if (!sess) {
        badge.hidden = true;
        return;
      }
      badge.hidden = false;
      badge.className = statusBadgeClass(sess.status);
      badge.textContent = statusLabel(sess.status);
    }
  }

  function renderBroadcast(sess) {
    var state = broadcastText(sess);
    var badge = document.getElementById('broadcastStateBadge');
    var text = document.getElementById('broadcastStateText');
    var push = document.getElementById('broadcastPushUrl');
    var preview = document.getElementById('broadcastPreview');
    if (badge) {
      badge.className =
        state === '直播中'
          ? 'lf-live-badge lf-live-badge--live'
          : state === '已结束'
            ? 'lf-live-badge lf-live-badge--muted'
            : 'lf-live-badge lf-live-badge--warn';
      badge.textContent = state;
    }
    if (text) text.textContent = state;
    if (push) push.value = (sess && sess.pushUrl) || '';
    if (preview) {
      preview.classList.toggle('is-live', state === '直播中');
      preview.innerHTML =
        state === '直播中'
          ? '<div class="lf-live-broadcast-preview__placeholder is-live">直播画面预览中…</div>'
          : '<div class="lf-live-broadcast-preview__placeholder">视频预览占位区</div>';
    }
    var startBtn = document.getElementById('btnStartLive');
    var stopBtn = document.getElementById('btnStopLive');
    if (startBtn) startBtn.disabled = !sess || sess.status === 'live' || sess.status === 'ended';
    if (stopBtn) stopBtn.disabled = !sess || sess.status !== 'live';
  }

  function renderProducts(sess) {
    var box = document.getElementById('controlProductList');
    if (!box) return;
    var list = productsOf(sess.id).filter(function (p) {
      if (!productQuery) return true;
      return String(p.name || '').indexOf(productQuery) >= 0 || String(p.sku || '').indexOf(productQuery) >= 0;
    });
    if (!list.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无商品</div>';
      return;
    }
    box.innerHTML = list
      .map(function (p) {
        var st = p.liveStatus || (p.status === 'off_shelf' ? 'off_shelf' : 'selling');
        return (
          '<div class="lf-live-product-card" data-id="' +
          escapeHtml(p.id) +
          '">' +
          '<div class="lf-live-product-card__head">' +
          '<div class="lf-live-product-card__name">' +
          escapeHtml(p.name) +
          '</div>' +
          '<span class="' +
          liveStatusClass(st) +
          '">' +
          escapeHtml(liveStatusLabel(st)) +
          '</span></div>' +
          '<div class="lf-live-product-card__meta">' +
          escapeHtml(p.spec || '—') +
          ' · 库存 ' +
          escapeHtml(String(p.stock != null ? p.stock : 0)) +
          '</div>' +
          '<div class="lf-live-product-card__ops">' +
          '<button type="button" data-act="on">上架</button>' +
          '<button type="button" data-act="off">下架</button>' +
          '<button type="button" data-act="display">设为展示中</button>' +
          '<button type="button" data-act="top">置顶讲解</button>' +
          '<button type="button" data-act="explain">讲解</button>' +
          '<button type="button" data-act="soldout">售罄</button>' +
          '<button type="button" data-act="stock">调库存</button>' +
          '<button type="button" data-act="up">上移</button>' +
          '<button type="button" data-act="down">下移</button>' +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderMonitor(sess) {
    var m = metricsOf(sess.id);
    var sales = document.getElementById('monitorSales');
    if (sales) sales.textContent = formatMoney(m.salesAmount);
    var grid = document.getElementById('monitorMetrics');
    if (grid) {
      var cells = [
        { label: '观看人数', value: formatNum(m.viewers) },
        { label: '累计观看', value: formatNum(m.totalViews) },
        { label: '峰值人数', value: formatNum(m.peakViewers) },
        { label: '点赞数', value: formatNum(m.likes) },
        { label: '订单数', value: formatNum(m.orderCount) },
        { label: '下单GMV', value: formatMoney(m.orderGmv) }
      ];
      grid.innerHTML = cells
        .map(function (c) {
          return (
            '<div class="lf-live-monitor-cell">' +
            '<div class="lf-live-monitor-cell__value">' +
            escapeHtml(c.value) +
            '</div>' +
            '<div class="lf-live-monitor-cell__label">' +
            escapeHtml(c.label) +
            '</div></div>'
          );
        })
        .join('');
    }
    var title = document.getElementById('monitorOrderTitle');
    var orders = m.recentOrders || [];
    if (title) title.textContent = '实时订单(' + orders.length + ')';
    var list = document.getElementById('monitorOrders');
    if (!list) return;
    if (!orders.length) {
      list.innerHTML = '<div class="lf-live-empty-inline">当前暂无订单</div>';
      return;
    }
    list.innerHTML = orders
      .map(function (o) {
        return (
          '<div class="lf-live-order-item">' +
          '<div class="lf-live-order-item__main">' +
          '<div class="lf-live-order-item__user">' +
          escapeHtml(o.nickname || '匿名用户') +
          ' <span>' +
          escapeHtml(o.phone || '') +
          '</span></div>' +
          '<div class="lf-live-order-item__goods">' +
          escapeHtml(o.productName || '—') +
          (o.qty != null ? ' x' + o.qty : '') +
          (o.spec ? ' / ' + escapeHtml(o.spec) : '') +
          '</div></div>' +
          '<div class="lf-live-order-item__side">' +
          '<div class="lf-live-order-item__amount">' +
          escapeHtml(formatMoney(o.amount)) +
          '</div>' +
          '<div class="' +
          (o.paid ? 'is-paid' : 'is-unpaid') +
          '">' +
          escapeHtml(o.statusLabel || '—') +
          '</div>' +
          '<div class="lf-live-order-item__time">' +
          escapeHtml(o.time || '') +
          '</div></div></div>'
        );
      })
      .join('');
  }

  function renderChat(sess) {
    var box = document.getElementById('controlChatList');
    if (!box) return;
    var msgs = (metricsOf(sess.id).chatMessages || []).slice();
    if (!msgs.length) {
      box.innerHTML = '<div class="lf-live-empty-inline">暂无聊天消息</div>';
      return;
    }
    box.innerHTML = msgs
      .map(function (m) {
        var cls = m.isAnchor ? ' is-anchor' : m.isSys ? ' is-sys' : '';
        return (
          '<div class="lf-live-chat-item' +
          cls +
          '">' +
          '<span class="lf-live-chat-item__user">' +
          escapeHtml(m.user) +
          '</span>' +
          '<span class="lf-live-chat-item__text">' +
          escapeHtml(m.text) +
          '</span>' +
          '<span class="lf-live-chat-item__time">' +
          escapeHtml(m.time || '') +
          '</span></div>'
        );
      })
      .join('');
  }

  function render() {
    var picker = document.getElementById('controlPicker');
    var workspace = document.getElementById('controlWorkspace');
    var sess = sessionId ? findSession(sessionId) : null;

    if (!sess) {
      if (picker) picker.hidden = false;
      if (workspace) workspace.hidden = true;
      renderHeader(null);
      return;
    }

    if (picker) picker.hidden = true;
    if (workspace) workspace.hidden = false;
    renderHeader(sess);
    renderBroadcast(sess);
    renderProducts(sess);
    renderMonitor(sess);
    renderChat(sess);
  }

  function findProduct(id) {
    var list = productsOf(sessionId);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { item: list[i], index: i, list: list };
    }
    return null;
  }

  function clearExplainExcept(keepId) {
    productsOf(sessionId).forEach(function (p) {
      if (p.id !== keepId && p.liveStatus === 'explaining') p.liveStatus = 'selling';
    });
  }

  function bindEvents() {
    var back = document.getElementById('controlBackBtn');
    if (back) {
      back.addEventListener('click', function () {
        window.location.href = wp.page('mdm_live_session.html');
      });
    }
    var enter = document.getElementById('controlEnterBtn');
    if (enter) {
      enter.addEventListener('click', function () {
        enterSession((document.getElementById('controlSessionSelect') || {}).value || '');
      });
    }

    var startBtn = document.getElementById('btnStartLive');
    var stopBtn = document.getElementById('btnStopLive');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        if (sess.status === 'ended') return toast('已结束场次无法开播', 'warning');
        sess.status = 'live';
        toast('已开始直播');
        render();
      });
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', function () {
        var sess = findSession(sessionId);
        if (!sess) return;
        sess.status = 'ended';
        toast('已关闭直播');
        render();
      });
    }

    var copyBtn = document.getElementById('btnCopyPush');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var input = document.getElementById('broadcastPushUrl');
        var val = (input && input.value) || '';
        if (!val) return toast('暂未获取到推流地址', 'warning');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(
            function () {
              toast('推流地址已复制');
            },
            function () {
              toast('复制失败，请手动选择', 'warning');
            }
          );
        } else {
          input.select();
          try {
            document.execCommand('copy');
            toast('推流地址已复制');
          } catch (e) {
            toast('复制失败，请手动选择', 'warning');
          }
        }
      });
    }

    var q = document.getElementById('controlProductQ');
    if (q) {
      q.addEventListener('input', function () {
        productQuery = (q.value || '').trim();
        var sess = findSession(sessionId);
        if (sess) renderProducts(sess);
      });
    }

    var productList = document.getElementById('controlProductList');
    if (productList) {
      productList.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-act]');
        if (!btn) return;
        var card = btn.closest('[data-id]');
        if (!card) return;
        var found = findProduct(card.getAttribute('data-id'));
        if (!found) return;
        var act = btn.getAttribute('data-act');
        var p = found.item;
        if (act === 'on') {
          p.status = 'on_shelf';
          p.liveStatus = p.liveStatus === 'off_shelf' ? 'selling' : p.liveStatus || 'selling';
          toast('商品已上架');
        } else if (act === 'off') {
          p.status = 'off_shelf';
          p.liveStatus = 'off_shelf';
          toast('商品已下架');
        } else if (act === 'display') {
          if (p.liveStatus === 'off_shelf' || p.liveStatus === 'sold_out') {
            return toast('商品未上架或已售罄，暂不支持该操作', 'warning');
          }
          p.liveStatus = 'displaying';
          toast('已设为展示中');
        } else if (act === 'explain' || act === 'top') {
          if (p.liveStatus === 'off_shelf' || p.liveStatus === 'sold_out') {
            return toast('商品未上架或已售罄，暂不支持该操作', 'warning');
          }
          clearExplainExcept(p.id);
          p.liveStatus = 'explaining';
          if (act === 'top') {
            found.list.splice(found.index, 1);
            found.list.unshift(p);
            toast('已置顶讲解');
          } else {
            toast('已设为讲解中');
          }
        } else if (act === 'soldout') {
          p.liveStatus = 'sold_out';
          p.stock = 0;
          toast('已标记售罄');
        } else if (act === 'stock') {
          var next = window.prompt('请输入直播售卖库存', String(p.stock != null ? p.stock : 0));
          if (next == null) return;
          var n = Math.floor(Number(next));
          if (isNaN(n) || n < 0) return toast('请输入有效库存', 'warning');
          p.stock = n;
          if (n > 0 && p.liveStatus === 'sold_out') p.liveStatus = 'selling';
          toast('库存已更新');
        } else if (act === 'up') {
          if (found.index <= 0) return;
          var prev = found.list[found.index - 1];
          found.list[found.index - 1] = p;
          found.list[found.index] = prev;
          toast('已上移');
        } else if (act === 'down') {
          if (found.index >= found.list.length - 1) return;
          var nxt = found.list[found.index + 1];
          found.list[found.index + 1] = p;
          found.list[found.index] = nxt;
          toast('已下移');
        }
        render();
      });
    }

    document.querySelectorAll('[data-welfare]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var map = {
          coupon: '发放优惠券',
          bag: '发放福袋',
          sign: '发放签到',
          task: '观看任务'
        };
        var key = btn.getAttribute('data-welfare');
        var label = map[key] || '直播福利';
        var m = metricsOf(sessionId);
        m.chatMessages = m.chatMessages || [];
        m.chatMessages.push({
          id: 'c-' + Date.now(),
          user: '系统',
          text: '演示：已触发「' + label + '」',
          time: new Date().toTimeString().slice(0, 8),
          isSys: true
        });
        toast('演示：' + label);
        var sess = findSession(sessionId);
        if (sess) renderChat(sess);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    sessionId = qs('sessionId');
    fillSessionSelect(sessionId);
    bindEvents();
    render();
  });
})();
